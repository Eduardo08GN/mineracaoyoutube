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

import config                                                               # noqa: E402
import garimpo as _garimpo                                                  # noqa: E402
import persona as _persona                                                  # noqa: E402
import radar as _radar                                                      # noqa: E402
import score as _score                                                      # noqa: E402
from banco import Banco, ESTADOS_OPORTUNIDADE                               # noqa: E402
from youtube import YouTube, ErroYoutube                                    # noqa: E402

ARQ_AJUSTES = os.path.join(config.DATA, "ajustes.json")


def _vivo(pid):
    from servidor import processo_vivo
    return processo_vivo(int(pid))
AJUSTES_PADRAO = {"rpm": 5.0}
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

    def salvar_ajustes(self, rpm=None, chave=None):
        a = self.ajustes()
        if rpm is not None:
            if not 0 < float(rpm) <= 100: raise ValueError("RPM fora do normal (0 a 100)")
            a["rpm"] = round(float(rpm), 2)
        os.makedirs(os.path.dirname(self._arq_ajustes), exist_ok=True)
        json.dump(a, open(self._arq_ajustes, "w", encoding="utf-8"))
        if chave is not None:
            chave = chave.strip()
            if len(chave) < 20: raise ValueError("essa chave parece curta demais")
            config.gravar_chave(chave)
            self.yt.chave = chave
        self._emitir("mudou", o="ajustes")
        return self.estado()

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
        }

    def personas(self):
        seis = (_dt.date.today() - _dt.timedelta(days=183)).isoformat()
        return {"personas": [{**p, "saturacao": self.banco.saturacao(p["id"], seis)} for p in _persona.PERSONAS],
                "temas": _persona.TEMAS, "filtros": _garimpo.FILTROS_PADRAO, "idiomas": _persona.IDIOMAS}

    def garimpos(self):
        return self.banco.garimpos()

    def _com_receita(self, o):
        if o:
            o["receita"] = _score.receita(o.get("views") or 0, self.ajustes()["rpm"])
            o["fome"] = _score.fome(o.get("views") or 0, o.get("publicado"), o.get("n_remakes", -1))
        return o

    def oportunidades(self, **filtros):
        return [self._com_receita(o) for o in self.banco.oportunidades(**filtros)]

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

    # ── acoes ──
    def novo_garimpo(self, sementes, persona, filtros=None):
        sementes = [s.strip() for s in sementes if s and s.strip()][:20]
        if not sementes: raise ValueError("escreva pelo menos uma semente")
        if not (persona or "").strip(): raise ValueError("escolha uma persona")
        f = _garimpo.filtros_completos(filtros)
        custo = _garimpo.custo_estimado(len(sementes), f)
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

    def gerar_equivalentes(self, oid, idiomas=("fr", "de")):
        """Roda na fila (gasta cota): o painel recebe `mudou` quando acabar."""
        if not self.banco.oportunidade(int(oid)): raise KeyError(oid)
        idiomas = [k for k in idiomas if k in _persona.IDIOMAS]
        if not idiomas: raise ValueError("escolha FR ou DE")
        self._fila.put(("equivalentes", (int(oid), idiomas)))
        self.log(f"equivalentes {'/'.join(k.upper() for k in idiomas)} da oportunidade #{oid} na fila "
                 f"(até {len(idiomas) * 101} unidades)")
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
    caso("⭐ matriz traz a fome e a capa da persona", n.matriz()["resumo"]["amish"]["fome"] == 16_000_000)
    caso("⭐ o detalhe traz os equivalentes FR/DE com a fome nativa",
         set(o["equivalentes"]) == {"fr", "de"} and "fome" in n.oportunidade(o["id"])["equivalentes"]["de"])
    caso("lista por idioma", len(n.idioma("fr")) == 1 and n.estado()["idiomas"] == {"fr": 1, "de": 1})
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
    n.encerrar()
    b.fechar()
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if "--autoteste" in sys.argv: sys.exit(0 if _autoteste() else 1)
