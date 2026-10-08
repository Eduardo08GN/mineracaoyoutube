# -*- coding: utf-8 -*-
r"""BANCO — o minerio guardado (SQLite em data/minerio.db).

    python motor/banco.py --autoteste

Tabelas:
    garimpos       cada rodada: sementes, persona, filtros, estado, quanto achou, quanta cota gastou
    videos         o que a API devolveu de cada video (views, canal, data, duracao, thumb)
    canais         inscritos, numero de videos, data de criacao
    oportunidades  video x persona: nota, outlier, remakes, titulos reescritos, angulo de produto
    radar          canais-persona novos achados por persona
    cota           unidades da API gastas por dia (dia do Pacifico: e' quando o Google zera)
    cache          resposta de busca guardada no dia: a mesma busca nao gasta cota duas vezes

⭐ Uma conexao, uma trava: o nucleo grava de um fio, o servidor le' de outro.
"""
import json, os, sqlite3, sys, threading, time

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path: sys.path.insert(0, AQUI)

import config                                                               # noqa: E402

ESQUEMA = """
CREATE TABLE IF NOT EXISTS garimpos (
  id INTEGER PRIMARY KEY AUTOINCREMENT, criado REAL, fim REAL,
  sementes TEXT, persona TEXT, filtros TEXT,
  estado TEXT DEFAULT 'fila', etapa TEXT DEFAULT '', achados INTEGER DEFAULT 0,
  cota INTEGER DEFAULT 0, erro TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY, titulo TEXT, canal_id TEXT, canal TEXT, publicado TEXT,
  views INTEGER, likes INTEGER, comentarios INTEGER, duracao INTEGER, thumb TEXT, atualizado REAL
);
CREATE TABLE IF NOT EXISTS canais (
  id TEXT PRIMARY KEY, nome TEXT, inscritos INTEGER, n_videos INTEGER, views INTEGER,
  criado TEXT, thumb TEXT, descricao TEXT, atualizado REAL
);
CREATE TABLE IF NOT EXISTS oportunidades (
  id INTEGER PRIMARY KEY AUTOINCREMENT, video_id TEXT, persona TEXT, garimpo_id INTEGER,
  semente TEXT, outlier REAL, nota REAL, n_remakes INTEGER DEFAULT -1, remakes TEXT DEFAULT '[]',
  titulos TEXT DEFAULT '[]', tema TEXT DEFAULT '', angulo TEXT DEFAULT '', encaixe REAL DEFAULT -1,
  estado TEXT DEFAULT 'nova', criado REAL,
  UNIQUE(video_id, persona)
);
CREATE TABLE IF NOT EXISTS radar (
  canal_id TEXT, persona TEXT, visto REAL, PRIMARY KEY (canal_id, persona)
);
CREATE TABLE IF NOT EXISTS equivalentes (
  op_id INTEGER, idioma TEXT, titulo TEXT, consulta TEXT, persona_local TEXT,
  demanda INTEGER DEFAULT 0, oferta_recente INTEGER DEFAULT 0, com_persona INTEGER DEFAULT 0,
  top TEXT DEFAULT '[]', checado REAL, PRIMARY KEY (op_id, idioma)
);
CREATE TABLE IF NOT EXISTS radar_rodadas (persona TEXT PRIMARY KEY, quando REAL);
CREATE TABLE IF NOT EXISTS cota (dia TEXT PRIMARY KEY, usadas INTEGER);
CREATE TABLE IF NOT EXISTS cota_chaves (
  dia TEXT, chave_id TEXT, usadas INTEGER DEFAULT 0, esgotada INTEGER DEFAULT 0, motivo TEXT DEFAULT '',
  PRIMARY KEY (dia, chave_id)
);
CREATE TABLE IF NOT EXISTS cache (chave TEXT PRIMARY KEY, dia TEXT, json TEXT);
"""

ESTADOS_OPORTUNIDADE = ("nova", "salva", "descartada", "produzida")


class Banco:
    def __init__(self, arq=None):
        self.arq = arq or config.BANCO
        os.makedirs(os.path.dirname(self.arq), exist_ok=True)
        self._c = sqlite3.connect(self.arq, check_same_thread=False)
        self._c.row_factory = sqlite3.Row
        self._t = threading.RLock()
        with self._t:
            self._c.executescript(ESQUEMA)
            # ⭐ bancos criados antes das colunas novas (08/10): acrescenta sem perder nada
            for sql in ("ALTER TABLE garimpos ADD COLUMN dono INTEGER DEFAULT 0",
                        "ALTER TABLE videos ADD COLUMN lingua TEXT DEFAULT ''",
                        "ALTER TABLE videos ADD COLUMN categoria TEXT DEFAULT ''",
                        "ALTER TABLE videos ADD COLUMN kids INTEGER DEFAULT 0",
                        "ALTER TABLE canais ADD COLUMN pais TEXT DEFAULT ''",
                        "ALTER TABLE equivalentes ADD COLUMN persona TEXT DEFAULT ''",
                        "ALTER TABLE equivalentes ADD COLUMN importada INTEGER DEFAULT 0",
                        "ALTER TABLE radar ADD COLUMN video_id TEXT DEFAULT ''",
                        "ALTER TABLE radar ADD COLUMN video_views INTEGER DEFAULT 0"):
                try: self._c.execute(sql)
                except sqlite3.OperationalError: pass
            self._c.commit()

    # ── baixo nivel ──
    def _x(self, sql, args=()):
        with self._t:
            cur = self._c.execute(sql, args)
            self._c.commit()
            return cur

    def _todas(self, sql, args=()):
        with self._t:
            return [dict(r) for r in self._c.execute(sql, args).fetchall()]

    def _uma(self, sql, args=()):
        with self._t:
            r = self._c.execute(sql, args).fetchone()
            return dict(r) if r else None

    def fechar(self):
        with self._t:
            self._c.close()

    # ── cota e cache ──
    def cota_usada(self, dia):
        r = self._uma("SELECT usadas FROM cota WHERE dia=?", (dia,))
        return r["usadas"] if r else 0

    def gastar_cota(self, dia, n, chave_id=None):
        self._x("INSERT INTO cota(dia, usadas) VALUES(?, ?) ON CONFLICT(dia) DO UPDATE SET usadas=usadas+?",
                (dia, n, n))
        if chave_id:
            self._x("""INSERT INTO cota_chaves(dia, chave_id, usadas) VALUES(?, ?, ?)
                       ON CONFLICT(dia, chave_id) DO UPDATE SET usadas=usadas+?""", (dia, chave_id, n, n))

    def cota_chave(self, dia, chave_id):
        r = self._uma("SELECT usadas, esgotada, motivo FROM cota_chaves WHERE dia=? AND chave_id=?", (dia, chave_id))
        return r or {"usadas": 0, "esgotada": 0, "motivo": ""}

    def tem_cota_por_chave(self, dia):
        return bool(self._uma("SELECT 1 FROM cota_chaves WHERE dia=? LIMIT 1", (dia,)))

    def marcar_chave(self, dia, chave_id, esgotada, motivo=""):
        self._x("""INSERT INTO cota_chaves(dia, chave_id, esgotada, motivo) VALUES(?, ?, ?, ?)
                   ON CONFLICT(dia, chave_id) DO UPDATE SET esgotada=excluded.esgotada, motivo=excluded.motivo""",
                (dia, chave_id, int(esgotada), motivo))

    def cache_ler(self, chave, dia):
        r = self._uma("SELECT json FROM cache WHERE chave=? AND dia=?", (chave, dia))
        return json.loads(r["json"]) if r else None

    def cache_gravar(self, chave, dia, valor):
        self._x("INSERT OR REPLACE INTO cache(chave, dia, json) VALUES(?, ?, ?)", (chave, dia, json.dumps(valor)))

    # ── videos e canais ──
    def gravar_video(self, v):
        self._x("""INSERT OR REPLACE INTO videos(id, titulo, canal_id, canal, publicado, views, likes, comentarios,
                   duracao, thumb, lingua, categoria, kids, atualizado) VALUES(:id, :titulo, :canal_id, :canal, :publicado,
                   :views, :likes, :comentarios, :duracao, :thumb, :lingua, :categoria, :kids, :atualizado)""",
                {**v, "lingua": v.get("lingua", ""), "categoria": v.get("categoria", ""), "kids": int(bool(v.get("kids"))),
                 "atualizado": time.time()})

    def gravar_canal(self, c):
        self._x("""INSERT OR REPLACE INTO canais(id, nome, inscritos, n_videos, views, criado, thumb, descricao, pais,
                   atualizado) VALUES(:id, :nome, :inscritos, :n_videos, :views, :criado, :thumb, :descricao, :pais,
                   :atualizado)""", {**c, "pais": c.get("pais", ""), "atualizado": time.time()})

    def video(self, vid):
        return self._uma("SELECT * FROM videos WHERE id=?", (vid,))

    def canal(self, cid):
        return self._uma("SELECT * FROM canais WHERE id=?", (cid,))

    # ── garimpos ──
    def novo_garimpo(self, sementes, persona, filtros):
        cur = self._x("INSERT INTO garimpos(criado, sementes, persona, filtros) VALUES(?, ?, ?, ?)",
                      (time.time(), json.dumps(sementes), persona, json.dumps(filtros)))
        return cur.lastrowid

    def atualizar_garimpo(self, gid, **campos):
        if not campos: return
        sets = ", ".join(f"{k}=?" for k in campos)
        self._x(f"UPDATE garimpos SET {sets} WHERE id=?", (*campos.values(), gid))

    def pegar_garimpo(self, gid, dono):
        """Fila -> rodando, so' se ninguem pegou antes (atomico). ⛔ Sem isto, dois processos abertos
        (a janela e um script) rodaram o mesmo garimpo e gastaram a cota em dobro (08/10)."""
        return self._x("UPDATE garimpos SET estado='rodando', dono=? WHERE id=? AND estado='fila'",
                       (dono, gid)).rowcount == 1

    def garimpo(self, gid):
        g = self._uma("SELECT * FROM garimpos WHERE id=?", (gid,))
        return _garimpo_py(g) if g else None

    def garimpos(self, limite=50):
        return [_garimpo_py(g) for g in self._todas("SELECT * FROM garimpos ORDER BY id DESC LIMIT ?", (limite,))]

    def garimpos_abertos(self):
        """Os que ficaram na fila ou rodando quando a janela fechou."""
        return [_garimpo_py(g) for g in self._todas(
            "SELECT * FROM garimpos WHERE estado IN ('fila', 'rodando') ORDER BY id")]

    # ── oportunidades ──
    def gravar_oportunidade(self, o):
        """Insere (video, persona) ou atualiza a nota/outlier, sem apagar o que ja' foi reescrito ou decidido."""
        self._x("""INSERT INTO oportunidades(video_id, persona, garimpo_id, semente, outlier, nota, criado)
                   VALUES(:video_id, :persona, :garimpo_id, :semente, :outlier, :nota, :criado)
                   ON CONFLICT(video_id, persona) DO UPDATE SET outlier=excluded.outlier, nota=excluded.nota""",
                {**o, "criado": time.time()})
        return self._uma("SELECT id FROM oportunidades WHERE video_id=? AND persona=?",
                         (o["video_id"], o["persona"]))["id"]

    def atualizar_oportunidade(self, oid, **campos):
        for k in ("remakes", "titulos"):
            if k in campos and not isinstance(campos[k], str): campos[k] = json.dumps(campos[k], ensure_ascii=False)
        if not campos: return
        sets = ", ".join(f"{k}=?" for k in campos)
        self._x(f"UPDATE oportunidades SET {sets} WHERE id=?", (*campos.values(), oid))

    _SELECT_OP = """SELECT o.*, v.titulo, v.canal, v.canal_id, v.publicado, v.views, v.likes, v.comentarios,
                    v.duracao, v.thumb, c.inscritos,
                    (SELECT GROUP_CONCAT(e.idioma) FROM equivalentes e WHERE e.op_id=o.id) AS idiomas_eq
                    FROM oportunidades o JOIN videos v ON v.id=o.video_id LEFT JOIN canais c ON c.id=v.canal_id"""

    def oportunidade(self, oid):
        o = self._uma(self._SELECT_OP + " WHERE o.id=?", (oid,))
        return _op_py(o) if o else None

    def oportunidades(self, persona="", estado="", garimpo=0, ordem="nota", limite=300):
        onde, args = [], []
        if persona: onde.append("o.persona=?"); args.append(persona)
        if estado: onde.append("o.estado=?"); args.append(estado)
        else: onde.append("o.estado!='descartada'")
        if garimpo: onde.append("o.garimpo_id=?"); args.append(int(garimpo))
        col = {"nota": "o.nota", "views": "v.views", "outlier": "o.outlier", "recente": "o.id"}.get(ordem, "o.nota")
        sql = self._SELECT_OP + (" WHERE " + " AND ".join(onde) if onde else "") + f" ORDER BY {col} DESC LIMIT ?"
        return [_op_py(o) for o in self._todas(sql, (*args, limite))]

    def contagem_por_persona(self):
        return {r["persona"]: r["n"] for r in self._todas(
            "SELECT persona, COUNT(*) n FROM oportunidades WHERE estado!='descartada' GROUP BY persona")}

    def contagem_por_estado(self):
        return {r["estado"]: r["n"] for r in self._todas("SELECT estado, COUNT(*) n FROM oportunidades GROUP BY estado")}

    def matriz(self):
        """[(persona, tema, n, nota_media, nota_max)] das oportunidades ja' classificadas."""
        return self._todas("""SELECT persona, tema, COUNT(*) n, AVG(nota) media, MAX(nota) maxima
                              FROM oportunidades WHERE tema!='' AND estado!='descartada'
                              GROUP BY persona, tema""")

    # ── radar ──
    def marcar_radar(self, canal_id, persona, video_id="", video_views=0):
        self._x("INSERT OR REPLACE INTO radar(canal_id, persona, visto, video_id, video_views) VALUES(?, ?, ?, ?, ?)",
                (canal_id, persona, time.time(), video_id, video_views))

    # ── equivalentes em outros idiomas ──
    def gravar_equivalente(self, op_id, idioma, e):
        self._x("""INSERT OR REPLACE INTO equivalentes(op_id, idioma, titulo, consulta, persona_local, demanda,
                   oferta_recente, com_persona, top, checado, persona, importada) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (op_id, idioma, e.get("titulo", ""), e.get("consulta", ""), e.get("persona_local", ""),
                 e.get("demanda", 0), e.get("oferta_recente", 0), e.get("com_persona", 0),
                 json.dumps(e.get("top", []), ensure_ascii=False), time.time(), e.get("persona", ""),
                 int(bool(e.get("importada")))))

    def equivalentes(self, op_id):
        return {r["idioma"]: _eq_py(r) for r in self._todas("SELECT * FROM equivalentes WHERE op_id=?", (op_id,))}

    def equivalentes_por_idioma(self, idioma):
        """As oportunidades com equivalente neste idioma, a de mais demanda nativa primeiro."""
        linhas = self._todas("""SELECT e.*, o.persona AS persona_origem, o.nota, o.titulos, v.titulo AS original, v.thumb, v.views
                                FROM equivalentes e JOIN oportunidades o ON o.id=e.op_id JOIN videos v ON v.id=o.video_id
                                WHERE e.idioma=? AND o.estado!='descartada' ORDER BY e.demanda DESC""", (idioma,))
        return [{**_eq_py(r), "titulos": json.loads(r.get("titulos") or "[]")} for r in linhas]

    def contagem_por_idioma(self):
        return {r["idioma"]: r["n"] for r in self._todas("SELECT idioma, COUNT(*) n FROM equivalentes GROUP BY idioma")}

    def saturacao(self, persona, desde):
        """Canais novos da persona no radar criados depois de `desde` (AAAA-MM-DD). -1 se o radar nunca rodou."""
        # ⭐ "nao rodou" e "rodou e nao achou nada" sao coisas diferentes: 0 canais novos = persona aberta
        if not self._uma("SELECT 1 FROM radar_rodadas WHERE persona=?", (persona,)) and \
                not self._uma("SELECT 1 FROM radar WHERE persona=? LIMIT 1", (persona,)):
            return -1
        return self._uma("""SELECT COUNT(*) n FROM radar r JOIN canais c ON c.id=r.canal_id
                            WHERE r.persona=? AND c.criado>=?""", (persona, desde))["n"]

    def radar_rodou(self, persona):
        self._x("INSERT OR REPLACE INTO radar_rodadas(persona, quando) VALUES(?, ?)", (persona, time.time()))

    def radar(self, persona=""):
        sql = """SELECT r.persona, r.visto, r.video_id, r.video_views, c.* FROM radar r JOIN canais c ON c.id=r.canal_id"""
        args = ()
        if persona: sql += " WHERE r.persona=?"; args = (persona,)
        return self._todas(sql + " ORDER BY c.inscritos DESC", args)


def _garimpo_py(g):
    g = dict(g)
    g["sementes"] = json.loads(g.get("sementes") or "[]")
    g["filtros"] = json.loads(g.get("filtros") or "{}")
    return g


def _eq_py(e):
    e = dict(e)
    e["top"] = json.loads(e.get("top") or "[]")
    return e


def _op_py(o):
    o = dict(o)
    o["remakes"] = json.loads(o.get("remakes") or "[]")
    o["titulos"] = json.loads(o.get("titulos") or "[]")
    return o


def _autoteste():
    import tempfile
    ok = True
    def caso(nome, cond):
        nonlocal ok; print(("  OK  " if cond else "  ERRO"), nome); ok &= bool(cond)
    b = Banco(os.path.join(tempfile.mkdtemp(prefix="min-banco-"), "t.db"))
    b.gastar_cota("2026-10-08", 100); b.gastar_cota("2026-10-08", 3)
    caso("cota soma no dia", b.cota_usada("2026-10-08") == 103 and b.cota_usada("2026-10-09") == 0)
    b.gastar_cota("2026-10-08", 100, "K1"); b.marcar_chave("2026-10-08", "K1", True, "cota acabou")
    caso("⭐ cota e estado por chave", b.cota_chave("2026-10-08", "K1") == {"usadas": 100, "esgotada": 1, "motivo": "cota acabou"}
         and b.cota_chave("2026-10-09", "K1")["usadas"] == 0)
    b.cache_gravar("busca:x", "2026-10-08", {"ids": ["a"]})
    caso("cache vale no dia", b.cache_ler("busca:x", "2026-10-08") == {"ids": ["a"]})
    caso("⭐ cache de ontem nao vale hoje", b.cache_ler("busca:x", "2026-10-09") is None)
    gid = b.novo_garimpo(["watermelon"], "amish", {"antes": "2022-01-01"})
    caso("garimpo nasce na fila", b.garimpo(gid)["estado"] == "fila" and b.garimpo(gid)["sementes"] == ["watermelon"])
    b.gravar_canal({"id": "C1", "nome": "Daisy", "inscritos": 956000, "n_videos": 300, "views": 1, "criado": "2010-01-01",
                    "thumb": "", "descricao": ""})
    b.gravar_video({"id": "V1", "titulo": "How to Pick a Sweet Watermelon", "canal_id": "C1", "canal": "Daisy",
                    "publicado": "2016-07-01", "views": 16000000, "likes": 1, "comentarios": 1, "duracao": 123, "thumb": ""})
    oid = b.gravar_oportunidade({"video_id": "V1", "persona": "amish", "garimpo_id": gid, "semente": "watermelon",
                                 "outlier": 16.7, "nota": 80})
    b.atualizar_oportunidade(oid, titulos=["How to Pick a Sweet Watermelon… The Old AMISH Way"], tema="jardim")
    o = b.oportunidade(oid)
    caso("oportunidade junta video e canal", o["titulo"].startswith("How to") and o["inscritos"] == 956000)
    caso("titulos voltam como lista", o["titulos"][0].endswith("AMISH Way"))
    oid2 = b.gravar_oportunidade({"video_id": "V1", "persona": "amish", "garimpo_id": gid, "semente": "watermelon",
                                  "outlier": 17.0, "nota": 82})
    caso("⭐ o mesmo video x persona nao duplica e nao perde os titulos",
         oid2 == oid and b.oportunidade(oid)["titulos"] and b.oportunidade(oid)["nota"] == 82)
    b.atualizar_oportunidade(oid, estado="descartada")
    caso("descartada some da lista padrao", b.oportunidades() == [] and len(b.oportunidades(estado="descartada")) == 1)
    caso("matriz ignora descartada", b.matriz() == [])
    b.marcar_radar("C1", "amish", "V1", 16000000)
    caso("radar junta o canal e o video", b.radar("amish")[0]["nome"] == "Daisy" and b.radar("amish")[0]["video_id"] == "V1")
    b.atualizar_oportunidade(oid, estado="nova")
    b.gravar_equivalente(oid, "de", {"titulo": "Süße Wassermelone… wie die Amischen", "consulta": "wassermelone erkennen",
                                     "demanda": 2_000_000, "oferta_recente": 3, "com_persona": 0,
                                     "top": [{"id": "D1", "titulo": "Wassermelone", "views": 2_000_000}]})
    caso("equivalente gravado e lido", b.equivalentes(oid)["de"]["top"][0]["id"] == "D1")
    caso("⭐ lista por idioma junta a oportunidade", b.equivalentes_por_idioma("de")[0]["original"].startswith("How to")
         and b.contagem_por_idioma() == {"de": 1})
    b.fechar()
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if "--autoteste" in sys.argv: sys.exit(0 if _autoteste() else 1)
