# -*- coding: utf-8 -*-
r"""NUCLEO — o Minerador sem tela (o mesmo papel do nucleo do OW Agente).

    python agente/nucleo.py --autoteste

A fila de garimpos e de radar, a cota, os ajustes e o banco moram aqui. Quem desenha (o painel
web) so' chama os metodos e ouve os eventos.

    n = Nucleo()
    n.ouvir(lambda tipo, dados: ...)
    n.novo_garimpo(["watermelon", "garden pests"], "amish", {})
    ...
    n.encerrar()

Eventos (tipo, dados). ⛔ Chegam de QUALQUER fio: quem desenha leva para o fio da tela.
    log    {"linha"}            uma linha do registro, ja' com a hora
    mudou  {"o"}                garimpos | oportunidades | radar | ajustes: reler
    aviso  {"texto", "tom"}     a frase da faixa de aviso (tom: ok | erro | "")
"""
import datetime as _dt, json, os, queue, sys, threading, time

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
for _p in (AQUI, os.path.join(RAIZ, "motor")):
    if _p not in sys.path: sys.path.insert(0, _p)

import catalogo as _cat                                                     # noqa: E402
import config                                                               # noqa: E402
import garimpo as _garimpo                                                  # noqa: E402
import persona as _persona                                                  # noqa: E402
import radar as _radar                                                      # noqa: E402
import retratos as _ret                                                     # noqa: E402
import score as _score                                                      # noqa: E402
from banco import Banco, ESTADOS_OPORTUNIDADE                               # noqa: E402
from youtube import YouTube, ErroYoutube                                    # noqa: E402

ARQ_AJUSTES = os.path.join(config.DATA, "ajustes.json")


def _vivo(pid):
    from servidor import processo_vivo
    return processo_vivo(int(pid))
# ⭐ o RPM de cada mercado (o americano 45+ paga mais): muda a receita estimada de cada oportunidade
AJUSTES_PADRAO = {"rpm": _cat.PAISES["en"]["rpm"], "rpm_fr": _cat.PAISES["fr"]["rpm"],
                  "rpm_de": _cat.PAISES["de"]["rpm"], "rpm_es": _cat.PAISES["es"]["rpm"]}
# as views minimas de partida por mercado (FR/DE/ES sao mercados menores)
MIN_VIEWS = {"en": 1_000_000, "fr": 300_000, "de": 300_000, "es": 500_000}


def copiar_texto(texto):
    """Poe o texto na area de transferencia do Windows (o prompt do retrato vai pronto para o Flow).
    False fora do Windows ou se o Windows nao deixar."""
    if os.name != "nt": return False
    import ctypes
    from ctypes import wintypes
    u, k = ctypes.windll.user32, ctypes.windll.kernel32
    k.GlobalAlloc.restype = wintypes.HGLOBAL; k.GlobalAlloc.argtypes = [wintypes.UINT, ctypes.c_size_t]
    k.GlobalLock.restype = wintypes.LPVOID; k.GlobalLock.argtypes = [wintypes.HGLOBAL]
    k.GlobalUnlock.argtypes = [wintypes.HGLOBAL]
    u.SetClipboardData.argtypes = [wintypes.UINT, wintypes.HANDLE]
    dados = (texto + "\0").encode("utf-16-le")
    for _ in range(10):                       # outro programa pode estar com a area aberta: tenta de novo
        if u.OpenClipboard(None): break
        time.sleep(0.05)
    else:
        return False
    try:
        u.EmptyClipboard()
        h = k.GlobalAlloc(0x0002, len(dados))  # GMEM_MOVEABLE
        p = k.GlobalLock(h)
        ctypes.memmove(p, dados, len(dados))
        k.GlobalUnlock(h)
        return bool(u.SetClipboardData(13, h))  # CF_UNICODETEXT
    finally:
        u.CloseClipboard()


def _rpm_de(ajustes, idioma):
    return ajustes["rpm"] if idioma == "en" else ajustes.get(f"rpm_{idioma}", ajustes["rpm"])
MAX_REGISTRO = 300


class Nucleo:
    def __init__(self, banco=None, yt=None, reescrever=None, arq_ajustes=ARQ_AJUSTES, iniciar=True, equivaler=None):
        self.banco = banco or Banco()
        self.yt = yt or YouTube(self.banco)
        self._reescrever = reescrever
        self._equivaler = equivaler
        self._arq_ajustes = arq_ajustes
        self._ouvintes = []
        self._fila = queue.Queue()
        self._atual = None                 # {"tipo", "id", "persona", "etapa"}
        self._cancelar = set()
        self._t = threading.RLock()
        self.registro = []
        self._vivo = True
        self.yt.ao_trocar = lambda texto: (self.log("⚠ " + texto), self._emitir("mudou", o="ajustes"))
        # ⭐ o modo retrato: {fila, atual, desde, pasta}. Um fio olha a pasta de downloads enquanto ativo.
        self._retrato = None
        self.copiar = copiar_texto
        self.pasta_retratos = _ret.PASTA
        self._fio_retrato = None
        self._fio = threading.Thread(target=self._trabalhar, daemon=True, name="minerador-fila")
        if iniciar:
            for g in self.banco.garimpos_abertos():
                # ⛔ rodando num processo vivo (outra janela, um script): e' dele, nao se toca
                if g["estado"] == "rodando" and g.get("dono") and g["dono"] != os.getpid() and _vivo(g["dono"]):
                    continue
                self.banco.atualizar_garimpo(g["id"], estado="fila", etapa="")   # a janela fechou no meio
                self._fila.put(("garimpo", g["id"]))
            self._fio.start()

    # ── eventos ──
    def ouvir(self, fn):
        self._ouvintes.append(fn)

    def _emitir(self, tipo, **dados):
        for fn in list(self._ouvintes):
            try:
                fn(tipo, dados)
            except Exception:                                              # noqa: BLE001
                pass

    def log(self, texto):
        linha = f"{time.strftime('%H:%M:%S')} {texto}"
        with self._t:
            self.registro = ([linha] + self.registro)[:MAX_REGISTRO]
        self._emitir("log", linha=linha)

    def avisar(self, texto, tom=""):
        self._emitir("aviso", texto=texto, tom=tom)

    # ── ajustes ──
    def ajustes(self):
        try:
            a = json.load(open(self._arq_ajustes, encoding="utf-8"))
        except (OSError, ValueError):
            a = {}
        return {**AJUSTES_PADRAO, **{k: v for k, v in a.items() if k in AJUSTES_PADRAO}}

    def salvar_ajustes(self, rpm=None, chave=None, rpms=None):
        a = self.ajustes()
        novos = dict(rpms or {})
        if rpm is not None: novos["rpm"] = rpm
        for k, v in novos.items():
            if k not in AJUSTES_PADRAO: raise ValueError(f"ajuste desconhecido: {k}")
            if not 0 < float(v) <= 100: raise ValueError("RPM fora do normal (0 a 100)")
            a[k] = round(float(v), 2)
        os.makedirs(os.path.dirname(self._arq_ajustes), exist_ok=True)
        json.dump(a, open(self._arq_ajustes, "w", encoding="utf-8"))
        if chave is not None: self.adicionar_chaves([chave])
        self._emitir("mudou", o="ajustes")
        return self.estado()

    # ── as chaves da API (quantas a pessoa quiser; a rotacao mora no youtube.py) ──
    def chaves(self):
        return self.yt.cota()

    def adicionar_chaves(self, brutas, arq_env=None):
        """Testa cada chave nova (1 unidade dela mesma) e guarda as aceitas. Devolve o resultado de cada uma.
        ⭐ Aceita colar varias de uma vez: uma por linha, ou separadas por virgula/espaco."""
        import re as _re
        novas = [c for c in _re.split(r"[\s,;]+", "\n".join(brutas)) if c]
        if not novas: raise ValueError("cole pelo menos uma chave")
        resultado, aceitas = [], []
        for k in dict.fromkeys(novas):
            m = config.mascarar(k)
            if len(k) < 20: resultado.append({"mascara": m, "ok": False, "motivo": "curta demais"}); continue
            if k in self.yt.chaves: resultado.append({"mascara": m, "ok": False, "motivo": "já estava na lista"}); continue
            ok, motivo = self.yt.testar_chave(k)
            resultado.append({"mascara": m, "ok": ok, "motivo": motivo})
            if ok: aceitas.append(k)
        if aceitas:
            self.yt.chaves = self.yt.chaves + aceitas
            config.gravar_chaves(self.yt.chaves, **({"arq": arq_env} if arq_env else {}))
            self.log(f"{len(aceitas)} chave(s) nova(s) da API · agora são {len(self.yt.chaves)}")
        self._emitir("mudou", o="ajustes")
        return {"resultado": resultado, "cota": self.yt.cota()}

    def remover_chave(self, cid, arq_env=None):
        antes = len(self.yt.chaves)
        self.yt.chaves = [k for k in self.yt.chaves if config.id_chave(k) != cid]
        if len(self.yt.chaves) == antes: raise KeyError(cid)
        config.gravar_chaves(self.yt.chaves, **({"arq": arq_env} if arq_env else {}))
        self.log(f"chave removida · restam {len(self.yt.chaves)}")
        self._emitir("mudou", o="ajustes")
        return self.yt.cota()

    def subir_chave(self, cid, arq_env=None):
        """Poe a chave no topo da fila de uso."""
        k = next((k for k in self.yt.chaves if config.id_chave(k) == cid), None)
        if not k: raise KeyError(cid)
        self.yt.chaves = [k] + [x for x in self.yt.chaves if x != k]
        config.gravar_chaves(self.yt.chaves, **({"arq": arq_env} if arq_env else {}))
        self._emitir("mudou", o="ajustes")
        return self.yt.cota()

    # ── leitura ──
    def estado(self):
        with self._t:
            atual = dict(self._atual) if self._atual else None
        return {
            "cota": self.yt.cota(),
            "atual": atual,
            "na_fila": self._fila.qsize(),
            "chave": config.mascarar(self.yt.chave or ""),
            "claude": bool(_persona.binario()),
            "ajustes": self.ajustes(),
            "contagem": self.banco.contagem_por_estado(),
            "idiomas": self.banco.contagem_por_idioma(),
            "nativas": self._nativas(),
            "retrato": self.retrato_estado(),
        }

    def _nativas(self):
        """Quantas oportunidades ativas cada mercado tem de garimpo nativo."""
        conta = {}
        for pid, n in self.banco.contagem_por_persona().items():
            k = _persona.persona(pid).get("idioma", "en")
            conta[k] = conta.get(k, 0) + n
        return conta

    def personas(self):
        seis = (_dt.date.today() - _dt.timedelta(days=183)).isoformat()
        paises = {k: {c: v[c] for c in ("nome", "sigla", "bandeira", "lingua")} for k, v in _cat.PAISES.items()}
        return {"personas": [{**p, "saturacao": self.banco.saturacao(p["id"], seis), **self._info_retrato(p)}
                             for p in _persona.PERSONAS],
                "temas": _persona.TEMAS, "filtros": _garimpo.FILTROS_PADRAO, "idiomas": paises,
                "arquetipos": _cat.ARQUETIPOS, "sementes": _cat.SEMENTES, "min_views": MIN_VIEWS}

    def garimpos(self):
        return self.banco.garimpos()

    # ── retratos das personas ──
    def _info_retrato(self, p):
        """{retrato: versao (0 = sem), retrato_de: de quem e' a imagem (emprestada, nos de mesma roupa)}."""
        a = _ret.arquivo(p["id"], self.pasta_retratos)
        if a: return {"retrato": int(os.path.getmtime(a)), "retrato_de": p["id"]}
        if p.get("arquetipo") in _ret.MESMA_ROUPA:
            for q in _persona.PERSONAS:
                if q["arquetipo"] == p["arquetipo"] and q["id"] != p["id"]:
                    b = _ret.arquivo(q["id"], self.pasta_retratos)
                    if b: return {"retrato": int(os.path.getmtime(b)), "retrato_de": q["id"]}
        return {"retrato": 0, "retrato_de": ""}

    def caminho_retrato(self, pid):
        info = self._info_retrato(_persona.persona(pid))
        if not info["retrato"]: raise KeyError(pid)
        return _ret.arquivo(info["retrato_de"], self.pasta_retratos)

    def prompt_retrato(self, pid, copiar=True):
        p = _persona.persona(pid)
        texto = _ret.prompt(p)
        return {"persona": pid, "prompt": texto, "copiado": bool(copiar and self.copiar(texto))}

    def sem_retrato(self):
        """As personas que ainda nao tem imagem (nem emprestada), na ordem do mapa."""
        return [p["id"] for p in _persona.PERSONAS if not self._info_retrato(p)["retrato"]]

    def retrato_estado(self):
        r = self._retrato
        total = len(_persona.PERSONAS)
        feitos = total - len(self.sem_retrato())
        if not r: return {"ativo": False, "feitos": feitos, "total": total}
        return {"ativo": True, "atual": r["atual"], "restam": len(r["fila"]), "feitos": feitos, "total": total,
                "prompt": _ret.prompt(_persona.persona(r["atual"])), "pasta": r["pasta"]}

    def retrato_iniciar(self, ids=None, pasta=None):
        """Comeca o modo retrato: copia o prompt da primeira e espera o download dela."""
        fila = [i for i in (ids or self.sem_retrato())]
        if not fila: raise ValueError("todas as personas já têm retrato")
        self._retrato = {"fila": fila[1:], "atual": fila[0], "desde": time.time(), "pasta": pasta or _ret.pasta_downloads()}
        self.copiar(_ret.prompt(_persona.persona(fila[0])))
        self.log(f"modo retrato: prompt de {_persona.persona(fila[0])['nome']} copiado — gere no Flow e baixe")
        if not (self._fio_retrato and self._fio_retrato.is_alive()):
            self._fio_retrato = threading.Thread(target=self._vigiar_downloads, daemon=True, name="minerador-retratos")
            self._fio_retrato.start()
        self._emitir("mudou", o="retratos")
        return self.retrato_estado()

    def retrato_pular(self):
        r = self._retrato
        if not r: raise ValueError("o modo retrato não está ligado")
        return self._proximo_retrato()

    def retrato_parar(self):
        self._retrato = None
        self._emitir("mudou", o="retratos")
        return self.retrato_estado()

    def retrato_enviar(self, pid, dados_b64, ext):
        """A imagem arrastada para a celula da persona."""
        _ret.guardar_base64(pid, dados_b64, ext, self.pasta_retratos)
        self.log(f"retrato de {_persona.persona(pid)['nome']} guardado")
        if self._retrato and self._retrato["atual"] == pid: self._proximo_retrato()
        self._emitir("mudou", o="retratos")
        return self.retrato_estado()

    def _proximo_retrato(self):
        r = self._retrato
        if not r: return self.retrato_estado()
        if not r["fila"]:
            self._retrato = None
            self.avisar("Modo retrato terminado: todas as personas da fila têm imagem.", "ok")
        else:
            r["atual"], r["fila"], r["desde"] = r["fila"][0], r["fila"][1:], time.time()
            self.copiar(_ret.prompt(_persona.persona(r["atual"])))
            self.log(f"modo retrato: prompt de {_persona.persona(r['atual'])['nome']} copiado")
        self._emitir("mudou", o="retratos")
        return self.retrato_estado()

    def _vigiar_downloads(self):
        """Enquanto o modo retrato esta' ligado: a imagem nova na pasta de downloads e' da persona atual."""
        while self._vivo and self._retrato:
            r = self._retrato
            novas = _ret.imagens_novas(r["pasta"], r["desde"])
            if novas:
                try:
                    _ret.guardar(r["atual"], novas[0], self.pasta_retratos)
                    nome = _persona.persona(r["atual"])["nome"]
                    self.log(f"retrato de {nome} guardado ({os.path.basename(novas[0])})")
                    self.avisar(f"Retrato de {nome} guardado. O prompt da próxima já está copiado.", "ok")
                    self._proximo_retrato()
                except Exception as e:                                     # noqa: BLE001
                    self.log(f"⚠ retrato: {e}")
                    r["desde"] = time.time()
            time.sleep(1.5)

    def _com_receita(self, o):
        if o:
            o["idioma"] = _persona.persona(o["persona"]).get("idioma", "en")
            o["receita"] = _score.receita(o.get("views") or 0, _rpm_de(self.ajustes(), o["idioma"]))
            o["fome"] = _score.fome(o.get("views") or 0, o.get("publicado"), o.get("n_remakes", -1))
        return o

    def oportunidades(self, idioma="", **filtros):
        ops = [self._com_receita(o) for o in self.banco.oportunidades(**filtros)]
        return [o for o in ops if o["idioma"] == idioma] if idioma else ops

    def oportunidade(self, oid):
        o = self.banco.oportunidade(int(oid))
        if not o: raise KeyError(oid)
        o = self._com_receita(o)
        c = self.banco.canal(o["canal_id"]) or {}
        o["canal_info"] = {k: c.get(k) for k in ("nome", "inscritos", "n_videos", "criado", "thumb")}
        o["sinais"] = _score.sinais(o["views"], o["inscritos"] or 0, o["publicado"], o["n_remakes"], o["encaixe"])
        o["equivalentes"] = {k: self._eq(e) for k, e in self.banco.equivalentes(o["id"]).items()}
        return o

    @staticmethod
    def _eq(e):
        e["fome"] = _score.fome_nativa(e.get("demanda", 0), e.get("oferta_recente", 0), e.get("com_persona", 0))
        e["aberto"] = e.get("com_persona", 0) == 0 and e.get("demanda", 0) >= 100_000
        return e

    def idioma(self, cod):
        if cod not in _persona.IDIOMAS: raise KeyError(cod)
        return [self._eq(e) for e in self.banco.equivalentes_por_idioma(cod)]

    def matriz(self):
        """As celulas persona x tema e, por persona, a fome (demanda ÷ oferta) e a capa da melhor."""
        celulas = self.banco.matriz()
        resumo = {}
        for o in self.oportunidades(limite=2000):
            r = resumo.setdefault(o["persona"], {"demanda": 0, "remakes": 0, "checados": 0, "n": 0, "capa": "", "melhor": -1})
            r["n"] += 1
            if o["n_remakes"] >= 0:
                r["checados"] += 1; r["remakes"] += o["n_remakes"]
                r["demanda"] += o["views"]
            if o["nota"] > r["melhor"]: r["melhor"], r["capa"], r["melhor_id"] = o["nota"], o["thumb"], o["id"]
        for pid, r in resumo.items():
            r["fome"] = round(r["demanda"] / (1 + r["remakes"])) if r["checados"] else -1
        return {"celulas": celulas, "resumo": resumo, **self.personas()}

    def radar(self, persona=""):
        return self.banco.radar(persona)

    def mapa(self):
        """O diagrama de Venn em grade: cada arquetipo x os 4 mercados. Em cada celula, a persona local,
        a saturacao (radar), o garimpo nativo dela e as equivalencias que caem nela vindas de outro mercado."""
        seis = (_dt.date.today() - _dt.timedelta(days=183)).isoformat()
        resumo = self.matriz()["resumo"]
        eqs = {}
        for e in self.banco._todas("""SELECT e.op_id, e.idioma, e.persona, e.demanda, e.com_persona, e.oferta_recente,
                                             e.top, e.titulo, o.persona AS origem FROM equivalentes e
                                      JOIN oportunidades o ON o.id=e.op_id WHERE o.estado!='descartada'"""):
            local = e["persona"] or _persona.local_de(_persona.persona(e["origem"]), e["idioma"])[0]["id"]
            c = eqs.setdefault(local, {"n": 0, "abertos": 0, "melhor": 0, "capa": "", "op_id": None, "titulo": ""})
            c["n"] += 1
            if e["com_persona"] == 0 and e["demanda"] >= 100_000: c["abertos"] += 1
            if e["demanda"] > c["melhor"]:
                top = json.loads(e["top"] or "[]")
                c.update(melhor=e["demanda"], op_id=e["op_id"], titulo=e["titulo"],
                         capa=(top[0].get("thumb") or f"https://i.ytimg.com/vi/{top[0]['id']}/mqdefault.jpg") if top else "")
        linhas = {}
        for p in _persona.PERSONAS:
            arq = p.get("arquetipo", p["id"])
            linha = linhas.setdefault(arq, {"id": arq, "nome": _cat.ARQUETIPOS.get(arq, p["nome"]), "paises": {}})
            r = resumo.get(p["id"], {})
            linha["paises"][p.get("idioma", "en")] = {
                "persona": {k: p[k] for k in ("id", "nome", "marca")}, "saturacao": self.banco.saturacao(p["id"], seis),
                "n": r.get("n", 0), "melhor": r.get("melhor", -1), "capa": r.get("capa", ""), "melhor_id": r.get("melhor_id"),
                "fome": r.get("fome", -1), "equiv": eqs.get(p["id"])}
        for l in linhas.values():
            l["regiao"] = _cat.regiao_do_arquetipo(set(l["paises"]))
            l["comum"] = len(l["paises"])
        ordem = sorted(linhas.values(), key=lambda l: (-l["comum"], l["nome"]))
        return {"arquetipos": ordem, "idiomas": self.personas()["idiomas"]}

    # ── acoes ──
    def novo_garimpo(self, sementes, persona, filtros=None):
        sementes = [s.strip() for s in sementes if s and s.strip()][:20]
        if not sementes: raise ValueError("escreva pelo menos uma semente")
        if not (persona or "").strip(): raise ValueError("escolha uma persona")
        f = _garimpo.filtros_completos(filtros)
        custo = _garimpo.custo_estimado(len(sementes), f, _persona.persona(persona.strip()).get("idioma", "en"))
        livres = self.yt.cota()["livres"]
        gid = self.banco.novo_garimpo(sementes, persona.strip(), f)
        self._fila.put(("garimpo", gid))
        self.log(f"garimpo #{gid} na fila: {len(sementes)} semente(s) · {_persona.persona(persona)['nome']} · "
                 f"até {custo:,} unidades")
        if custo > livres:
            self.avisar(f"Este garimpo pode gastar até {custo:,} unidades e restam {livres:,} hoje. "
                        "Ele roda até onde a cota deixar.", "")
        self._emitir("mudou", o="garimpos")
        return self.banco.garimpo(gid)

    def cancelar(self, gid):
        gid = int(gid)
        g = self.banco.garimpo(gid)
        if not g: raise KeyError(gid)
        if g["estado"] not in ("fila", "rodando"): return g
        with self._t:
            self._cancelar.add(gid)
        if g["estado"] == "fila":
            self.banco.atualizar_garimpo(gid, estado="cancelado", fim=time.time())
        self.log(f"garimpo #{gid} cancelado")
        self._emitir("mudou", o="garimpos")
        return self.banco.garimpo(gid)

    def rodar_radar(self, persona):
        if not (persona or "").strip(): raise ValueError("escolha uma persona")
        self._fila.put(("radar", persona.strip()))
        self.log(f"radar {_persona.persona(persona)['nome']} na fila (até {_radar.CUSTO_RADAR} unidades)")
        return {"ok": True}

    def gerar_equivalentes(self, oid, idiomas=("en", "fr", "de", "es")):
        """Roda na fila (gasta cota): o painel recebe `mudou` quando acabar."""
        if not self.banco.oportunidade(int(oid)): raise KeyError(oid)
        origem = _persona.persona(self.banco.oportunidade(int(oid))["persona"]).get("idioma", "en")
        idiomas = [k for k in idiomas if k in _persona.IDIOMAS and k != origem]
        if not idiomas: raise ValueError("escolha pelo menos um mercado diferente do de origem")
        self._fila.put(("equivalentes", (int(oid), idiomas)))
        self.log(f"equivalentes {'/'.join(k.upper() for k in idiomas)} da oportunidade #{oid} na fila "
                 f"(até {len(idiomas) * 102} unidades)")
        return {"ok": True}

    def marcar(self, oid, estado):
        if estado not in ESTADOS_OPORTUNIDADE: raise ValueError(f"estado inválido: {estado}")
        if not self.banco.oportunidade(int(oid)): raise KeyError(oid)
        self.banco.atualizar_oportunidade(int(oid), estado=estado)
        self._emitir("mudou", o="oportunidades")
        return self.oportunidade(oid)

    def reescrever(self, oid):
        """Roda num fio proprio (o Claude leva ~30 s): o painel recebe `mudou` quando acabar."""
        if not self.banco.oportunidade(int(oid)): raise KeyError(oid)
        def fazer():
            try:
                _garimpo.reescrever_uma(self.banco, int(oid), reescrever=self._reescrever)
                self.avisar("Títulos novos prontos.", "ok")
            except Exception as e:                                         # noqa: BLE001
                self.avisar(f"Não consegui reescrever: {e}", "erro")
            self._emitir("mudou", o="oportunidades")
        threading.Thread(target=fazer, daemon=True, name="minerador-reescrever").start()
        self.log(f"reescrevendo a oportunidade #{oid}")
        return {"ok": True}

    # ── o fio da fila ──
    def _trabalhar(self):
        while self._vivo:
            try:
                tipo, alvo = self._fila.get(timeout=0.5)
            except queue.Empty:
                continue
            try:
                if tipo == "garimpo": self._rodar_garimpo(alvo)
                elif tipo == "radar": self._rodar_radar(alvo)
                elif tipo == "equivalentes": self._rodar_equivalentes(*alvo)
            finally:
                self._fila.task_done()

    def _etapa(self, texto):
        with self._t:
            if self._atual: self._atual["etapa"] = texto
        if self._atual and self._atual["tipo"] == "garimpo":
            self.banco.atualizar_garimpo(self._atual["id"], etapa=texto)
        self._emitir("mudou", o="garimpos")

    def _rodar_garimpo(self, gid):
        g = self.banco.garimpo(gid)
        if not g or not self.banco.pegar_garimpo(gid, os.getpid()): return
        with self._t:
            self._atual = {"tipo": "garimpo", "id": gid, "persona": g["persona"], "etapa": "começando"}
        antes = self.yt.cota()["usadas"]
        self.log(f"garimpo #{gid} começou")
        try:
            n = _garimpo.rodar(g, self.banco, self.yt, diz=self.log, etapa=self._etapa,
                               cancelado=lambda: gid in self._cancelar, reescrever=self._reescrever,
                               equivaler=self._equivaler)
            self.banco.atualizar_garimpo(gid, estado="pronto", etapa="", fim=time.time())
            self.avisar(f"Garimpo #{gid} terminou: {n} oportunidade(s).", "ok")
        except _garimpo.Cancelado:
            self.banco.atualizar_garimpo(gid, estado="cancelado", etapa="", fim=time.time())
        except ErroYoutube as e:
            self.banco.atualizar_garimpo(gid, estado="falhou", etapa="", erro=str(e), fim=time.time())
            self.log(f"⚠ garimpo #{gid}: {e}")
            self.avisar(f"Garimpo #{gid} parou: {e}", "erro")
        except Exception as e:                                             # noqa: BLE001
            self.banco.atualizar_garimpo(gid, estado="falhou", etapa="", erro=str(e)[:200], fim=time.time())
            self.log(f"⚠ garimpo #{gid} falhou: {e}")
            self.avisar(f"Garimpo #{gid} falhou: {e}", "erro")
        finally:
            self.banco.atualizar_garimpo(gid, cota=self.yt.cota()["usadas"] - antes)
            with self._t:
                self._atual = None
                self._cancelar.discard(gid)
            self._emitir("mudou", o="garimpos")
            self._emitir("mudou", o="oportunidades")

    def _rodar_radar(self, pid):
        with self._t:
            self._atual = {"tipo": "radar", "id": 0, "persona": pid, "etapa": "procurando canais novos"}
        self._emitir("mudou", o="garimpos")
        try:
            novos = _radar.rodar(self.banco, self.yt, pid, diz=self.log)
            self.avisar(f"Radar {_persona.persona(pid)['nome']}: {len(novos)} canal(is) novo(s).", "ok")
        except Exception as e:                                             # noqa: BLE001
            self.log(f"⚠ radar: {e}")
            self.avisar(f"O radar parou: {e}", "erro")
        finally:
            with self._t:
                self._atual = None
            self._emitir("mudou", o="radar")
            self._emitir("mudou", o="garimpos")

    def _rodar_equivalentes(self, oid, idiomas):
        with self._t:
            self._atual = {"tipo": "equivalentes", "id": oid, "persona": "", "etapa": "equivalentes " + "/".join(idiomas)}
        self._emitir("mudou", o="garimpos")
        try:
            n = _garimpo.equivalentes_uma(self.banco, self.yt, oid, idiomas, equivaler=self._equivaler, diz=self.log)
            self.avisar(f"{n} equivalente(s) prontos." if n else "O Claude não devolveu equivalentes.", "ok" if n else "erro")
        except Exception as e:                                             # noqa: BLE001
            self.log(f"⚠ equivalentes: {e}")
            self.avisar(f"As equivalências pararam: {e}", "erro")
        finally:
            with self._t:
                self._atual = None
            self._emitir("mudou", o="oportunidades")
            self._emitir("mudou", o="garimpos")

    def esperar_fila(self, limite=30):
        """Para o autoteste: espera a fila esvaziar."""
        fim = time.time() + limite
        while time.time() < fim:
            if self._fila.unfinished_tasks == 0: return True
            time.sleep(0.05)
        return False

    def encerrar(self):
        self._vivo = False
        with self._t:
            if self._atual and self._atual["tipo"] == "garimpo": self._cancelar.add(self._atual["id"])


def _autoteste():
    import tempfile
    ok = True
    def caso(nome, cond):
        nonlocal ok; print(("  OK  " if cond else "  ERRO"), nome); ok &= bool(cond)
    d = tempfile.mkdtemp(prefix="min-nucleo-")
    def falso(url):
        if "/search?" in url:
            return {"items": [] if "publishedAfter" in url else [{"id": {"videoId": "V1"}}]}
        if "/videos?" in url:
            return {"items": [{"id": "V1", "snippet": {"title": "How to Pick a Sweet Watermelon", "channelId": "C1",
                                                      "channelTitle": "Daisy", "publishedAt": "2016-07-01T00:00:00Z"},
                               "statistics": {"viewCount": "16000000"}, "contentDetails": {"duration": "PT2M3S"}}]}
        if "/channels?" in url:
            return {"items": [{"id": "C1", "snippet": {"title": "Daisy", "publishedAt": "2010-01-01T00:00:00Z"},
                               "statistics": {"subscriberCount": "956000"}}]}
        return {}
    b = Banco(os.path.join(d, "t.db"))
    yt = YouTube(b, chave="chave-de-teste-com-mais-de-20", http=falso)
    claude = lambda p, vs: {v["id"]: {"titulos": ["T... The Old AMISH Way"], "tema": "jardim", "angulo": "x",
                                      "encaixe": 8} for v in vs}
    equiv = lambda p, ops, idiomas: {o["id"]: {k: {"titulo": "t", "consulta": "q", "persona_local": "amish"}
                                               for k in idiomas} for o in ops}
    n = Nucleo(banco=b, yt=yt, reescrever=claude, arq_ajustes=os.path.join(d, "aj.json"), equivaler=equiv)
    eventos = []
    n.ouvir(lambda t, dd: eventos.append((t, dd)))
    e = n.estado()
    caso("estado inicial", e["cota"]["usadas"] == 0 and e["atual"] is None and e["ajustes"]["rpm"] == 5.0)
    caso("⛔ a chave sai mascarada no estado", e["chave"] == "chav…-20")
    import json as _json
    caso("⭐ o catalogo vai para o painel (sem sets)", _json.dumps(n.personas()) and "sementes" in n.personas())
    env = os.path.join(d, ".env")
    r = n.adicionar_chaves(["outra-chave-de-teste-123456\ncurta, chave-de-teste-com-mais-de-20"], arq_env=env)
    caso("⭐ colar varias chaves: aceita a nova, recusa curta e repetida",
         [x["ok"] for x in r["resultado"]] == [True, False, False] and len(n.yt.chaves) == 2)
    caso("chaves gravadas no .env", "outra-chave-de-teste-123456" in open(env, encoding="utf-8").read())
    n.subir_chave(config.id_chave("outra-chave-de-teste-123456"), arq_env=env)
    caso("subir a chave para o topo", n.yt.chaves[0] == "outra-chave-de-teste-123456")
    n.remover_chave(config.id_chave("outra-chave-de-teste-123456"), arq_env=env)
    caso("remover a chave", n.yt.chaves == ["chave-de-teste-com-mais-de-20"])
    try:
        n.novo_garimpo(["  "], "amish"); caso("⛔ garimpo sem semente", False)
    except ValueError:
        caso("⛔ garimpo sem semente", True)
    g = n.novo_garimpo(["watermelon"], "amish", {"remakes": 1})
    caso("garimpo entra na fila", g["estado"] == "fila")
    caso("a fila anda sozinha", n.esperar_fila())
    g = b.garimpo(g["id"])
    caso("⭐ garimpo termina pronto e conta a cota gasta", g["estado"] == "pronto" and g["cota"] > 0)
    ops = n.oportunidades()
    caso("⭐ oportunidade com receita estimada (16M views a $5/mil = $80 mil)",
         len(ops) == 1 and ops[0]["receita"] == 80000)
    caso("eventos de log, mudou e aviso", {"log", "mudou", "aviso"} <= {t for t, _ in eventos})
    o = n.oportunidade(ops[0]["id"])
    caso("detalhe traz sinais e canal", "lacuna" in o["sinais"] and o["canal_info"]["inscritos"] == 956000)
    n.marcar(o["id"], "salva")
    caso("salvar", n.oportunidade(o["id"])["estado"] == "salva")
    try:
        n.marcar(o["id"], "xyz"); caso("⛔ estado invalido", False)
    except ValueError:
        caso("⛔ estado invalido", True)
    n.salvar_ajustes(rpm=7.5)
    caso("⭐ RPM muda a receita", n.oportunidade(o["id"])["receita"] == 120000)
    caso("matriz conta a celula", n.matriz()["celulas"][0]["tema"] == "jardim")
    mp = n.mapa()
    esc = next(l for l in mp["arquetipos"] if l["id"] == "avo-escassez")
    caso("⭐ mapa: a avo dos tempos dificeis nos 4 mercados", set(esc["paises"]) == {"en", "fr", "de", "es"}
         and esc["regiao"] == "comum aos 4")
    am = next(l for l in mp["arquetipos"] if l["id"] == "amish")
    caso("⭐ mapa: Amish e' EN ∩ DE, com a oportunidade e a equivalencia DE", am["regiao"] == "EN ∩ DE"
         and am["paises"]["en"]["n"] == 1 and am["paises"]["de"]["equiv"]["n"] == 1)
    caso("⭐ matriz traz a fome e a capa da persona", n.matriz()["resumo"]["amish"]["fome"] == 16_000_000)
    caso("⭐ o detalhe traz os equivalentes FR/DE com a fome nativa",
         set(o["equivalentes"]) == {"fr", "de", "es"} and "fome" in n.oportunidade(o["id"])["equivalentes"]["de"])
    caso("lista por idioma", len(n.idioma("fr")) == 1 and n.estado()["idiomas"] == {"fr": 1, "de": 1, "es": 1})
    n.gerar_equivalentes(o["id"], ["de"]); n.esperar_fila()
    caso("gerar equivalente pela fila", n.estado()["idiomas"]["de"] == 1)
    g2 = n.novo_garimpo(["x"], "amish")
    n.cancelar(g2["id"])
    n.esperar_fila()
    caso("⛔ cancelado na fila nao roda", b.garimpo(g2["id"])["estado"] == "cancelado")
    g3 = b.novo_garimpo(["y"], "amish", {})
    caso("⭐ o primeiro processo pega o garimpo", b.pegar_garimpo(g3, 111))
    caso("⛔ o segundo nao pega o mesmo", not b.pegar_garimpo(g3, 222))
    b.atualizar_garimpo(g3, estado="cancelado")
    caso("personas com saturacao -1 antes do radar", n.personas()["personas"][0]["saturacao"] == -1)
    # ⭐ o modo retrato: prompt copiado, download percebido, imagem na persona certa, proxima ja' copiada
    copiados = []
    n.copiar = lambda t: copiados.append(t) or True
    n.pasta_retratos = os.path.join(d, "personas")
    dl = os.path.join(d, "Downloads"); os.makedirs(dl)
    e = n.retrato_iniciar(["amish", "depression"], pasta=dl)
    caso("modo retrato liga e copia o prompt da primeira", e["ativo"] and e["atual"] == "amish" and "Amish" in copiados[0])
    time.sleep(0.2)
    img = os.path.join(dl, "flow-image.png"); open(img, "wb").write(b"\x89PNG" + b"0" * 4000)
    fim = time.time() + 8
    while time.time() < fim and (n.retrato_estado().get("atual") == "amish"): time.sleep(0.3)
    caso("⭐ o download vira o retrato da persona e a proxima e' copiada",
         n._info_retrato(_persona.persona("amish"))["retrato"] > 0 and n.retrato_estado()["atual"] == "depression"
         and "88-year-old American grandmother" in copiados[-1])
    caso("⭐ a Amish alema empresta o retrato (mesma roupa)", n._info_retrato(_persona.persona("amish-de"))["retrato_de"] == "amish")
    caso("a avo alema NAO empresta (roupa diferente)", n._info_retrato(_persona.persona("nachkriegs-oma"))["retrato"] == 0)
    import base64 as _b64
    n.retrato_enviar("depression", _b64.b64encode(b"\xff\xd8" + b"0" * 3000).decode(), "jpg")
    caso("⭐ arrastar a imagem fecha a persona atual e termina a fila", n.retrato_estado()["ativo"] is False
         and n.caminho_retrato("depression").endswith(".jpg"))
    caso("prompt avulso", "Spanish grandmother" in n.prompt_retrato("abuela-posguerra")["prompt"])
    n.encerrar()
    b.fechar()
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if "--autoteste" in sys.argv: sys.exit(0 if _autoteste() else 1)
