# -*- coding: utf-8 -*-
r"""ESTUDIO — a aba Producao: transforma uma oportunidade do Minerador num video no formato do Elias Yoder.

    python agente/estudio.py --autoteste

Um fio proprio (producao nunca segura um garimpo) roda as etapas de cada projeto:
    fonte    le o viral original (legenda ou audio + whisper) e o Claude tira o MECANISMO
    roteiro  o Claude escreve o texto falado no molde do Elias, na lingua do canal
    planos   a narracao vira trechos de ~4 s (avatar / tela dividida / b-roll) e o Claude descreve cada cena
Ao criar um projeto as tres rodam em sequencia; qualquer uma pode ser refeita sozinha.

Eventos para o painel (pelo nucleo): mudou {"o": "producao", "id": <projeto>} e linhas no registro.
"""
import json, os, queue, sys, threading, time
from concurrent.futures import ThreadPoolExecutor

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
for _p in (AQUI, os.path.join(RAIZ, "motor")):
    if _p not in sys.path: sys.path.insert(0, _p)

import config                                                               # noqa: E402
import fonte as _fonte                                                      # noqa: E402
import persona as _persona                                                  # noqa: E402
import projetos as _proj                                                    # noqa: E402
import roteiro as _rot                                                      # noqa: E402

ARQ_AJUSTES = os.path.join(config.DATA, "estudio.json")
AJUSTES_PADRAO = {"perfil_dolphin": "869356248"}    # "12 Ivone": a sessao do YouTube que o Eduardo autorizou (08/10)
ETAPAS = ("fonte", "roteiro", "planos")
LOTE_PLANOS = 60


class Estudio:
    def __init__(self, nucleo=None, base=_proj.PASTA, chamar=None, ler_fonte=None, arq_ajustes=ARQ_AJUSTES):
        self.n = nucleo
        self.base = base
        self._chamar = chamar or _persona.chamar_claude
        self._ler = ler_fonte or _fonte.ler
        self._arq = arq_ajustes
        self._fila = queue.Queue()
        self._vivo = True
        self._fio = threading.Thread(target=self._trabalhar, daemon=True, name="minerador-estudio")
        self._fio.start()

    # ── conversa com o nucleo (log, eventos) ──
    def _log(self, texto):
        if self.n: self.n.log(texto)

    def _mudou(self, pid):
        if self.n: self.n._emitir("mudou", o="producao", id=pid)

    def _avisar(self, texto, tom=""):
        if self.n: self.n.avisar(texto, tom)

    # ── ajustes ──
    def ajustes(self):
        try:
            a = json.load(open(self._arq, encoding="utf-8"))
        except (OSError, ValueError):
            a = {}
        return {**AJUSTES_PADRAO, **{k: v for k, v in a.items() if k in AJUSTES_PADRAO}}

    def salvar_ajustes(self, **campos):
        a = self.ajustes()
        for k, v in campos.items():
            if k not in AJUSTES_PADRAO: raise ValueError(f"ajuste desconhecido: {k}")
            a[k] = str(v).strip()
        os.makedirs(os.path.dirname(self._arq), exist_ok=True)
        json.dump(a, open(self._arq, "w", encoding="utf-8"))
        return a

    # ── leitura ──
    def lista(self):
        return _proj.lista(self.base)

    def projeto(self, pid):
        p = _proj.carregar(pid, self.base)
        return {**p, "etapas": _proj.etapas(p), "proporcoes": _rot.proporcoes(p.get("planos") or []),
                "na_fila": [e for (q, e) in list(self._fila.queue) if q == pid]}

    # ── acoes ──
    def criar(self, op, ate="planos"):
        """Projeto novo a partir de uma oportunidade (dict) e ja' manda produzir ate' a etapa `ate`."""
        per = _persona.persona(op["persona"])
        p = _proj.criar(op, per, self.base)
        _proj.alterar(p["id"], lambda q: q.update(perfil=_rot.perfil_de(per)), self.base)
        self._log(f"produção: projeto “{p['nome'][:60]}” criado")
        for e in ETAPAS[:ETAPAS.index(ate) + 1]: self.rodar(p["id"], e)
        self._mudou(p["id"])
        return self.projeto(p["id"])

    def rodar(self, pid, etapa):
        if etapa not in ETAPAS: raise ValueError(f"etapa desconhecida: {etapa}")
        _proj.carregar(pid, self.base)                     # KeyError/OSError se nao existir
        self._fila.put((pid, etapa))
        self._mudou(pid)
        return {"ok": True}

    def editar_perfil(self, pid, campos):
        def f(p):
            p["perfil"] = {**(p.get("perfil") or {}), **{k: str(v) for k, v in campos.items() if k in _rot.PERFIS["kloster-moench"]}}
        _proj.alterar(pid, f, self.base)
        self._mudou(pid)
        return self.projeto(pid)

    def editar_secao(self, pid, n, texto):
        """Troca o texto de uma secao do roteiro. ⭐ Os planos ficam velhos: saem (refaca a etapa Planos)."""
        def f(p):
            r = p.get("roteiro") or {}
            for s in r.get("secoes") or []:
                if s["n"] == int(n): s["texto"] = texto.strip()
            r["palavras"] = sum(len(s["texto"].split()) for s in r.get("secoes") or [])
            r["minutos"] = round(r["palavras"] / _rot.PALAVRAS_POR_S.get(p["idioma"], 2.4) / 60, 1)
            p["planos"] = []
        _proj.alterar(pid, f, self.base)
        _proj.registrar(pid, f"seção {n} do roteiro editada à mão (os planos saíram: refaça a etapa Planos)", self.base)
        self._mudou(pid)
        return self.projeto(pid)

    # ── o fio ──
    def _trabalhar(self):
        while self._vivo:
            try:
                pid, etapa = self._fila.get(timeout=0.5)
            except queue.Empty:
                continue
            try:
                _proj.alterar(pid, lambda p: p.update(trabalhando=etapa), self.base)
                self._mudou(pid)
                getattr(self, f"_etapa_{etapa}")(pid)
            except Exception as e:                                     # noqa: BLE001
                msg = str(e)[:200] or e.__class__.__name__
                try: _proj.registrar(pid, f"⚠ {etapa}: {msg}", self.base)
                except Exception: pass                                 # noqa: BLE001
                self._log(f"⚠ produção ({etapa}): {msg}")
                self._avisar(f"A etapa {etapa} falhou: {msg}", "erro")
                # ⛔ etapa que falhou nao deixa as seguintes rodarem em cima de nada
                with self._fila.mutex:
                    self._fila.queue = type(self._fila.queue)(x for x in self._fila.queue if x[0] != pid)
            finally:
                try: _proj.alterar(pid, lambda p: p.update(trabalhando=""), self.base)
                except Exception: pass                                 # noqa: BLE001
                self._mudou(pid)
                self._fila.task_done()

    def _etapa_fonte(self, pid):
        p = _proj.carregar(pid, self.base)
        f = p["fonte"]
        self._log(f"produção: lendo o viral “{f['titulo'][:50]}”")
        lido = self._ler(f["video_id"], perfil_dolphin=self.ajustes()["perfil_dolphin"], preferida=p["idioma"])
        per = _persona.persona(p["persona"])
        mec = _rot.interpretar_mecanismo(self._chamar(_rot.montar_mecanismo(per, {**f, **lido}), timeout=600))
        if not mec: raise RuntimeError("o Claude não devolveu o mecanismo do vídeo")
        _proj.alterar(pid, lambda q: (q["fonte"].update({**lido, "pronta": True}), q.update(mecanismo=mec)), self.base)
        _proj.registrar(pid, f"fonte lida ({lido.get('legenda') or 'sem fala'}, {len(lido.get('texto', '').split())} palavras) · "
                             f"{len(mec['pontos'])} pontos no mecanismo", self.base)

    def _etapa_roteiro(self, pid):
        p = _proj.carregar(pid, self.base)
        if not p.get("mecanismo"): raise RuntimeError("leia a fonte primeiro")
        per = _persona.persona(p["persona"])
        pedido = _rot.montar_roteiro(per, p.get("perfil") or _rot.perfil_de(per), p["fonte"], p["mecanismo"], p["idioma"])
        self._log(f"produção: o Claude está escrevendo o roteiro de “{p['nome'][:50]}” (alguns minutos)")
        r = None
        for _ in range(2):                                 # ⭐ uma segunda tentativa se vier fora do formato
            r = _rot.interpretar_roteiro(self._chamar(pedido, timeout=1500))
            if r: break
        if not r: raise RuntimeError("o roteiro veio fora do formato (sem as seções)")
        r["minutos"] = round(r["palavras"] / _rot.PALAVRAS_POR_S.get(p["idioma"], 2.4) / 60, 1)
        _proj.alterar(pid, lambda q: q.update(roteiro=r, planos=[], nome=(r["titulos"] or [q["nome"]])[0]), self.base)
        _proj.registrar(pid, f"roteiro escrito: {r['palavras']} palavras, ~{r['minutos']} min, {len(r['secoes'])} seções", self.base)

    def _etapa_planos(self, pid):
        p = _proj.carregar(pid, self.base)
        r = p.get("roteiro") or {}
        if not r.get("secoes"): raise RuntimeError("escreva o roteiro primeiro")
        per = _persona.persona(p["persona"])
        planos = _rot.segmentar(r["secoes"], p["idioma"], (p.get("perfil") or {}).get("nome", ""))
        lotes = [planos[i:i + LOTE_PLANOS] for i in range(0, len(planos), LOTE_PLANOS)]
        self._log(f"produção: {len(planos)} planos; o Claude descreve as cenas em {len(lotes)} lote(s)")
        def descrever(lote):
            pedido = _rot.montar_planos(per, p["nome"], lote, p["idioma"])
            try:
                return _rot.interpretar_planos(self._chamar(pedido, timeout=600))
            except Exception:                                          # noqa: BLE001
                return _rot.interpretar_planos(self._chamar(pedido, timeout=600))
        cenas = {}
        with ThreadPoolExecutor(3) as ex:
            for d in ex.map(descrever, lotes): cenas.update(d)
        for pl in planos:
            pl.update(cenas.get(pl["n"]) or {"cena": "", "camada": "", "busca": ""})
        sem = sum(1 for pl in planos if pl["tipo"] != "avatar" and not pl["cena"])
        _proj.alterar(pid, lambda q: q.update(planos=planos), self.base)
        pr = _rot.proporcoes(planos)
        _proj.registrar(pid, f"{len(planos)} planos: avatar {pr['avatar']}%, tela dividida {pr['split']}%, b-roll {pr['broll']}%"
                             + (f" · ⚠ {sem} sem cena" if sem else ""), self.base)

    def esperar(self, limite=60):
        fim = time.time() + limite
        while time.time() < fim:
            if self._fila.unfinished_tasks == 0: return True
            time.sleep(0.05)
        return False

    def encerrar(self):
        self._vivo = False


def _autoteste():
    import tempfile
    ok = True
    def caso(nome, cond):
        nonlocal ok; print(("  OK  " if cond else "  ERRO"), nome); ok &= bool(cond)
    base = tempfile.mkdtemp(prefix="min-estudio-")
    secoes = "".join(f"=== {i} | {n} ===\n" + " ".join(f"Satz {k} über Kräuter im Klostergarten." for k in range(25 if i in (7, 8) else 6))
                     + ("\nIch bin Bruder Anselm." if i == 3 else "") + "\n\n" for i, (n, _) in enumerate(_rot.SECOES, 1))
    pedidos = []
    def claude(pedido, timeout=0):
        pedidos.append(pedido)
        if "analyse an old viral" in pedido:
            return '{"resumo": "Salben aus Wildkräutern", "pontos": ["Spitzwegerich-Salbe", "Andorn-Tinktur"], "itens": 7}'
        if "full spoken script" in pedido:
            return "TITEL 1: Klosterarznei wie früher\nTITEL 2: x\nTITEL 3: 7 Kräuter\nMINIATUR-TEXT: Vergessen\nMINIATUR-OBJEKT: a jar\n" + secoes
        import re
        ns = re.findall(r"^(\d+) \[", pedido, flags=re.M)
        return json.dumps({"planos": [{"n": int(n), "cena": "hands picking plantain leaves", "camada": "acao", "busca": "plantain"} for n in ns]})
    def ler(vid, perfil_dolphin="", preferida=""):
        return {"titulo": "Wie man natürliche Arznei herstellt", "texto": "Spitzwegerich " * 60, "legenda": "whisper", "sem_fala": False}
    eventos = []
    class N:
        def log(self, t): eventos.append(("log", t))
        def avisar(self, t, tom=""): eventos.append(("aviso", t))
        def _emitir(self, tipo, **d): eventos.append((tipo, d))
    e = Estudio(N(), base=base, chamar=claude, ler_fonte=ler, arq_ajustes=os.path.join(base, "aj.json"))
    op = {"id": 548, "video_id": "OQeWS5Ktl0Y", "persona": "kloster-moench", "titulo": "Wie man natürliche Arznei herstellt | SWR",
          "titulos": ["Klosterarznei selber machen"], "views": 2207331}
    p = e.criar(op)
    caso("projeto criado com o perfil do monge", p["perfil"]["nome"] == "Bruder Anselm")
    caso("as 3 etapas rodam sozinhas", e.esperar(30))
    p = e.projeto(p["id"])
    est = {x["id"]: x["estado"] for x in p["etapas"]}
    caso("⭐ fonte, roteiro e planos prontos", est["fonte"] == est["roteiro"] == est["planos"] == "pronta")
    caso("o titulo do roteiro vira o nome do projeto", p["nome"] == "Klosterarznei wie früher")
    caso("⭐ o pedido do roteiro levou o mecanismo e o perfil", any("Andorn-Tinktur" in x and "Bruder Anselm" in x for x in pedidos))
    caso("⭐ cada plano de b-roll ganhou cena", all(pl["cena"] for pl in p["planos"] if pl["tipo"] != "avatar"))
    caso("proporcoes no projeto", sum(p["proporcoes"].values()) in (99, 100, 101))
    caso("eventos mudou/producao para o painel", any(t == "mudou" and d.get("o") == "producao" for t, d in eventos))
    p2 = e.editar_secao(p["id"], 6, "Ein neuer Satz.")
    caso("⭐ editar uma secao tira os planos (ficaram velhos)", p2["planos"] == [] and
         {x["id"]: x["estado"] for x in p2["etapas"]}["planos"] == "pendente")
    def quebra(vid, **k): raise _fonte.ErroFonte("o perfil 1 do Dolphin não está aberto")
    e._ler = quebra
    p3 = e.criar(op)
    e.esperar(30)
    p3 = e.projeto(p3["id"])
    caso("⛔ fonte que falha: registro explica e roteiro nem roda", "não está aberto" in p3["registro"][0]["texto"]
         and not p3.get("roteiro") and any(t == "aviso" for t, _ in eventos))
    caso("ajuste do perfil do Dolphin", e.salvar_ajustes(perfil_dolphin="123")["perfil_dolphin"] == "123")
    try:
        e.salvar_ajustes(outro="x"); caso("⛔ ajuste desconhecido", False)
    except ValueError:
        caso("⛔ ajuste desconhecido", True)
    e.encerrar()
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.exit(0 if _autoteste() else 1)
