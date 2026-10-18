# -*- coding: utf-8 -*-
r"""INSTAGRAM — a aba Instagram: Reels 9:16 com um avatar no universo-lar dele, a partir de um Reel de origem.

    python agente/instagram.py --autoteste

O que a pessoa faz na aba: sobe a foto do avatar (e, se quiser, a capa do livro), aprova os comodos do
universo-lar e cola o link de um Reel com o idioma de destino. O resto roda sozinho, num fio proprio:

    fonte     baixa o Reel (ou usa o mp4 enviado), transcreve com tempo por palavra e corta em takes de ate' 8 s
    roteiro   o Claude adapta cada take para o idioma e a boca do avatar, escreve o movimento e o take do CTA
    gerar     o backend de geracao (motor/instagram_backend.py) faz o quadro do livro e os videos dos takes
    montagem  apara a cauda de cada take, monta 1080x1920, -14 LUFS, e queima a legenda (whisper no idioma)
e, se ligado, sobe o Reel para a branch `videos` do repositorio (motor/instagram_repo.py).

⭐ Um comodo por video, em rodizio (o menos usado entre os aprovados). O angulo pode repetir no mesmo video.
⭐ Uma vez por dia a branch `videos` e' refeita so' com os Reels dos ultimos N dias (padrao 5).

Eventos para o painel (pelo nucleo): mudou {"o": "instagram", "id": ...} e linhas no registro.
"""
import base64, datetime as _dt, json, os, queue, re, secrets, shutil, sys, threading, time

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
for _p in (AQUI, os.path.join(RAIZ, "motor")):
    if _p not in sys.path: sys.path.insert(0, _p)

import config                                                               # noqa: E402
import instagram_backend as _backend                                        # noqa: E402
import instagram_midia as _midia                                            # noqa: E402
import instagram_repo as _repo                                              # noqa: E402
import instagram_roteiro as _rot                                            # noqa: E402

PASTA = os.path.join(config.DATA, "instagram")
ETAPAS = ("fonte", "roteiro", "gerar", "montagem")
NOMES = {"fonte": "Fonte", "roteiro": "Roteiro", "gerar": "Geração", "montagem": "Montagem"}
AJUSTES_PADRAO = {"backend": "", "repo_dir": "", "auto_subir": False, "dias": 5, "cookies": ""}
EXT_IMAGEM = {"png", "jpg", "jpeg", "webp"}
MAX_VIDEO_MB = 200
_ID = re.compile(r"^[a-z0-9][a-z0-9-]{0,63}$")


def _valida(i):
    if not isinstance(i, str) or not _ID.match(i): raise KeyError(i)
    return i


def _slug(texto):
    import unicodedata
    t = unicodedata.normalize("NFKD", texto or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")[:30] or "avatar"


def _bytes_de(b64):
    """O conteudo de um data URL (ou base64 puro)."""
    if "," in b64[:100]: b64 = b64.split(",", 1)[1]
    try:
        return base64.b64decode(b64, validate=False)
    except ValueError as e:
        raise ValueError("arquivo inválido") from e


class Instagram:
    def __init__(self, nucleo=None, base=PASTA, chamar=None, midia=_midia, backend=None, repo=_repo,
                 iniciar_fios=True):
        self.n = nucleo
        self.base = base
        self._chamar = chamar
        self.midia = midia
        self._backend_fixo = backend
        self.repo = repo
        self._t = threading.RLock()
        self._fila = queue.Queue()
        self._vivo = True
        self._trabalhando = None              # ("reel", rid, etapa) | ("cena", aid, cid) | ("repo", "", "")
        for sub in ("avatares", "reels"): os.makedirs(os.path.join(base, sub), exist_ok=True)
        self._fio = threading.Thread(target=self._trabalhar, daemon=True, name="minerador-instagram")
        self._fio.start()
        if iniciar_fios:
            threading.Thread(target=self._relogio, daemon=True, name="minerador-instagram-limpeza").start()

    # ── conversa com o nucleo ──
    def _log(self, texto):
        if self.n: self.n.log(texto)

    def _mudou(self, ident=""):
        if self.n: self.n._emitir("mudou", o="instagram", id=ident)

    def _avisar(self, texto, tom=""):
        if self.n: self.n.avisar(texto, tom)

    def _claude(self, pedido, timeout=600):
        if self._chamar: return self._chamar(pedido, timeout=timeout)
        import persona as _persona
        return _persona.chamar_claude(pedido, timeout=timeout)

    def _gerador(self):
        return self._backend_fixo or _backend.carregar(self.ajustes()["backend"])

    # ── arquivos ──
    def _ler(self, arq, padrao=None):
        try:
            return json.load(open(arq, encoding="utf-8"))
        except (OSError, ValueError):
            return padrao

    def _gravar(self, arq, dados):
        os.makedirs(os.path.dirname(arq), exist_ok=True)
        tmp = arq + ".tmp"
        json.dump(dados, open(tmp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        os.replace(tmp, arq)

    def _pasta_av(self, aid): return os.path.join(self.base, "avatares", _valida(aid))
    def _pasta_reel(self, rid): return os.path.join(self.base, "reels", _valida(rid))

    def _avatar(self, aid):
        a = self._ler(os.path.join(self._pasta_av(aid), "avatar.json"))
        if not a: raise KeyError(aid)
        return a

    def _alterar_avatar(self, aid, fn):
        with self._t:
            a = self._avatar(aid); fn(a)
            self._gravar(os.path.join(self._pasta_av(aid), "avatar.json"), a)
            return a

    def _reel(self, rid):
        r = self._ler(os.path.join(self._pasta_reel(rid), "reel.json"))
        if not r: raise KeyError(rid)
        return r

    def _alterar_reel(self, rid, fn):
        with self._t:
            r = self._reel(rid); fn(r)
            self._gravar(os.path.join(self._pasta_reel(rid), "reel.json"), r)
            return r

    def _registrar(self, rid, texto):
        self._alterar_reel(rid, lambda r: r.setdefault("registro", []).insert(0, {"t": time.time(), "texto": texto}))

    # ── ajustes ──
    def ajustes(self):
        a = self._ler(os.path.join(self.base, "ajustes.json"), {}) or {}
        return {**AJUSTES_PADRAO, **{k: v for k, v in a.items() if k in AJUSTES_PADRAO}}

    def salvar_ajustes(self, **campos):
        a = self.ajustes()
        for k, v in campos.items():
            if k not in AJUSTES_PADRAO: raise ValueError(f"ajuste desconhecido: {k}")
            if k == "auto_subir": a[k] = bool(v)
            elif k == "dias":
                if not 1 <= int(v) <= 60: raise ValueError("os dias no repositório vão de 1 a 60")
                a[k] = int(v)
            else:
                a[k] = str(v or "").strip().strip('"')
        if a["repo_dir"]: self.repo.conferir(a["repo_dir"])
        if a["backend"]: _backend.carregar(a["backend"])
        self._gravar(os.path.join(self.base, "ajustes.json"), a)
        self._mudou()
        return a

    # ── leitura para o painel ──
    def _info_avatar(self, a):
        p = self._pasta_av(a["id"])
        cenas = [{**c, "tem": os.path.isfile(os.path.join(p, "cenas", f"{c['id']}.png")),
                  "na_fila": self._na_fila(("cena", a["id"], c["id"])), "usos": len(a.get("usos", {}).get(c["id"], []))}
                 for c in a.get("cenas", [])]
        return {**{k: v for k, v in a.items() if k != "usos"}, "cenas": cenas,
                "foto": bool(self._achar(p, "foto")), "livro": bool(self._achar(p, "livro"))}

    @staticmethod
    def _achar(pasta, nome):
        for ext in EXT_IMAGEM:
            arq = os.path.join(pasta, f"{nome}.{ext}")
            if os.path.isfile(arq): return arq
        return ""

    def _na_fila(self, item):
        return item in list(self._fila.queue) or self._trabalhando == item

    def etapas(self, r):
        p = self._pasta_reel(r["id"])
        feito = {"fonte": bool(r.get("takes_origem")), "roteiro": bool(r.get("takes")),
                 "gerar": bool(r.get("takes")) and all(t.get("video") and os.path.isfile(t["video"]) for t in r["takes"]),
                 "montagem": os.path.isfile(os.path.join(p, "final.mp4"))}
        saida, antes = [], True
        for e in ETAPAS:
            estado = "pronta" if feito[e] else ("pendente" if antes else "bloqueada")
            saida.append({"id": e, "nome": NOMES[e], "estado": estado})
            antes = antes and feito[e]
        return saida

    def _resumo(self, r):
        trab = self._trabalhando
        return {**r, "etapas": self.etapas(r),
                "trabalhando": trab[2] if trab and trab[0] == "reel" and trab[1] == r["id"] else "",
                "na_fila": [e for (t, i, e) in list(self._fila.queue) if t == "reel" and i == r["id"]],
                "final": os.path.isfile(os.path.join(self._pasta_reel(r["id"]), "final.mp4"))}

    def tudo(self):
        avs = []
        for aid in sorted(os.listdir(os.path.join(self.base, "avatares"))):
            a = self._ler(os.path.join(self.base, "avatares", aid, "avatar.json"))
            if a: avs.append(self._info_avatar(a))
        reels = []
        for rid in os.listdir(os.path.join(self.base, "reels")):
            r = self._ler(os.path.join(self.base, "reels", rid, "reel.json"))
            if r: reels.append(self._resumo(r))
        reels.sort(key=lambda r: -r["criado"])
        aj = self.ajustes()
        return {"avatares": avs, "reels": reels, "ajustes": aj,
                "idiomas": {k: v["nome"] for k, v in _rot.IDIOMAS.items()},
                "gerador": self._estado_gerador(aj), "publicados": self._publicados()}

    def _estado_gerador(self, aj):
        if self._backend_fixo: return {"ok": True, "texto": "gerador de teste"}
        try:
            _backend.carregar(aj["backend"])
            return {"ok": True, "texto": os.path.basename(aj["backend"])}
        except Exception as e:                                             # noqa: BLE001
            return {"ok": False, "texto": str(e)}

    def reel(self, rid):
        return self._resumo(self._reel(rid))

    def arquivo_avatar(self, aid, qual):
        p = self._pasta_av(aid)
        if qual in ("foto", "livro"): arq = self._achar(p, qual)
        elif qual.startswith("cena-"): arq = os.path.join(p, "cenas", f"{_valida(qual[5:])}.png")
        else: raise KeyError(qual)
        if not arq or not os.path.isfile(arq): raise KeyError(qual)
        return arq

    def arquivo_reel(self, rid, qual):
        p = self._pasta_reel(rid)
        nomes = {"final": "final.mp4", "fonte": "fonte.mp4", "cta": "cta.png"}
        arq = os.path.join(p, nomes[qual]) if qual in nomes else ""
        if re.fullmatch(r"take_\d{2}", qual): arq = os.path.join(p, f"{qual}.mp4")
        if not arq or not os.path.isfile(arq): raise KeyError(qual)
        return arq

    # ── avatares e universo-lar ──
    def criar_avatar(self, nome, imagem, ext, descricao="", prefixo="", voz="", quem="", tomiko=False):
        ext = (ext or "").lower().lstrip(".")
        if ext not in EXT_IMAGEM: raise ValueError("a foto do avatar tem de ser PNG, JPG ou WEBP")
        if not (nome or "").strip(): raise ValueError("dê um nome ao avatar")
        base = _rot.TOMIKO if tomiko else {}
        aid = f"{_slug(nome)}-{secrets.token_hex(2)}"
        p = self._pasta_av(aid)
        os.makedirs(os.path.join(p, "cenas"), exist_ok=True)
        open(os.path.join(p, f"foto.{ext}"), "wb").write(_bytes_de(imagem))
        a = {"id": aid, "nome": nome.strip(), "criado": time.time(),
             "descricao": (descricao or base.get("descricao", "")).strip(),
             "prefixo": (prefixo or base.get("prefixo", "")).strip(),
             "voz": (voz or base.get("voz", "")).strip(), "quem": (quem or base.get("quem", "")).strip(),
             "cenas": [{"id": c[0], "nome": c[1], "cena": c[2], "estado": "pendente"} for c in base.get("cenas", [])],
             "usos": {}}
        if not a["prefixo"]: a["prefixo"] = "The same person from the frame; keep the same person, clothes and setting."
        if not a["voz"]: a["voz"] = "a natural, warm voice in {lingua}, spoken by the person in frame"
        with self._t: self._gravar(os.path.join(p, "avatar.json"), a)
        self._log(f"instagram: avatar {a['nome']} criado")
        self._mudou(aid)
        return self._info_avatar(a)

    def editar_avatar(self, aid, campos):
        def f(a):
            for k in ("nome", "descricao", "prefixo", "voz", "quem"):
                if k in campos: a[k] = str(campos[k]).strip()
        a = self._alterar_avatar(aid, f)
        self._mudou(aid)
        return self._info_avatar(a)

    def enviar_imagem(self, aid, qual, imagem, ext):
        """A foto nova do avatar ou a capa do livro. ⭐ Foto nova = os comodos ficam velhos e voltam a pendente."""
        if qual not in ("foto", "livro"): raise KeyError(qual)
        ext = (ext or "").lower().lstrip(".")
        if ext not in EXT_IMAGEM: raise ValueError("a imagem tem de ser PNG, JPG ou WEBP")
        p = self._pasta_av(aid); self._avatar(aid)
        for e in EXT_IMAGEM:
            if os.path.isfile(os.path.join(p, f"{qual}.{e}")): os.remove(os.path.join(p, f"{qual}.{e}"))
        open(os.path.join(p, f"{qual}.{ext}"), "wb").write(_bytes_de(imagem))
        if qual == "foto":
            self._alterar_avatar(aid, lambda a: [c.update(estado="pendente") for c in a["cenas"]])
        self._log(f"instagram: {'foto' if qual == 'foto' else 'capa do livro'} de {self._avatar(aid)['nome']} trocada")
        self._mudou(aid)
        return self._info_avatar(self._avatar(aid))

    def adicionar_cena(self, aid, nome, cena):
        if not (cena or "").strip(): raise ValueError("descreva o cômodo")
        cid = f"{_slug(nome or cena)}-{secrets.token_hex(2)}"
        a = self._alterar_avatar(aid, lambda a: a["cenas"].append(
            {"id": cid, "nome": (nome or "Cômodo").strip(), "cena": cena.strip(), "estado": "pendente"}))
        self._mudou(aid)
        return self._info_avatar(a)

    def cena(self, aid, cid, acao, texto=None):
        """acao: aprovar | recusar | refazer | remover | editar (com `texto`)."""
        _valida(cid)

        def f(a):
            c = next((x for x in a["cenas"] if x["id"] == cid), None)
            if not c: raise KeyError(cid)
            if acao == "aprovar":
                if not os.path.isfile(os.path.join(self._pasta_av(aid), "cenas", f"{cid}.png")):
                    raise ValueError("gere a imagem do cômodo antes de aprovar")
                c["estado"] = "aprovada"
            elif acao == "recusar": c["estado"] = "recusada"
            elif acao == "remover": a["cenas"].remove(c)
            elif acao == "editar":
                if not (texto or "").strip(): raise ValueError("descreva o cômodo")
                c["cena"], c["estado"] = texto.strip(), "pendente"
            elif acao != "refazer": raise ValueError(f"ação desconhecida: {acao}")
        a = self._alterar_avatar(aid, f)
        if acao == "refazer": self._fila.put(("cena", aid, cid))
        self._mudou(aid)
        return self._info_avatar(a)

    def gerar_pool(self, aid):
        """Manda gerar a imagem de todo comodo pendente ou recusado (os aprovados ficam)."""
        a = self._avatar(aid)
        if not self._achar(self._pasta_av(aid), "foto"): raise ValueError("suba a foto do avatar primeiro")
        n = 0
        for c in a["cenas"]:
            if c["estado"] in ("pendente", "recusada") and not self._na_fila(("cena", aid, c["id"])):
                self._fila.put(("cena", aid, c["id"])); n += 1
        if not n: raise ValueError("nenhum cômodo pendente: adicione um ou peça para refazer")
        self._log(f"instagram: {n} cômodo(s) de {a['nome']} na fila")
        self._mudou(aid)
        return {"ok": True, "na_fila": n}

    # ── reels ──
    def criar_reel(self, avatar, idioma, url="", video="", ext="mp4", cta="bio", palavra="", livro=False,
                   modelo="gratis"):
        a = self._avatar(_valida(avatar))
        if idioma not in _rot.IDIOMAS: raise ValueError("idioma desconhecido")
        if modelo not in ("gratis", "pago"): raise ValueError("modelo desconhecido")
        if cta not in ("bio", "palavra"): raise ValueError("CTA desconhecido")
        if cta == "palavra" and not re.fullmatch(r"[A-Za-zÀ-ÿ0-9]{2,20}", (palavra or "").strip()):
            raise ValueError("a palavra do CTA é uma palavra só (letras, sem espaço)")
        if livro and not self._achar(self._pasta_av(a["id"]), "livro"): raise ValueError("suba a capa do livro primeiro")
        url = (url or "").strip()
        if not url and not video: raise ValueError("cole o link do Reel ou envie o vídeo")
        if url and not re.match(r"^https://(www\.)?(instagram\.com|youtube\.com|youtu\.be|tiktok\.com)/", url):
            raise ValueError("o link tem de ser do Instagram, YouTube ou TikTok")
        cid = _rot.proxima_cena(a["cenas"], a.get("usos", {}))
        if not cid: raise ValueError("aprove pelo menos um cômodo do universo-lar antes")
        rid = f"{_dt.date.today().isoformat()}-{a['id'][:20]}-{secrets.token_hex(2)}"
        p = self._pasta_reel(rid)
        os.makedirs(p)
        if video:
            dados = _bytes_de(video)
            if len(dados) > MAX_VIDEO_MB * 1024 * 1024: raise ValueError(f"o vídeo passa de {MAX_VIDEO_MB} MB")
            open(os.path.join(p, "fonte.mp4"), "wb").write(dados)
        r = {"id": rid, "avatar": a["id"], "criado": time.time(), "idioma": idioma, "url": url, "cena": cid,
             "cta": {"tipo": cta, "palavra": _slug(palavra).replace("-", "") if cta == "palavra" else "", "livro": bool(livro)},
             "modelo": modelo, "takes_origem": [], "takes": [], "legenda_post": "", "registro": [], "publicado": ""}
        with self._t: self._gravar(os.path.join(p, "reel.json"), r)
        self._alterar_avatar(a["id"], lambda x: x.setdefault("usos", {}).setdefault(cid, []).append(time.time()))
        nome_cena = next(c["nome"] for c in a["cenas"] if c["id"] == cid)
        self._registrar(rid, f"Reel criado: {a['nome']}, {_rot.IDIOMAS[idioma]['nome']}, cômodo “{nome_cena}”")
        for e in ETAPAS: self._fila.put(("reel", rid, e))
        self._log(f"instagram: Reel {rid} na fila")
        self._mudou(rid)
        return self.reel(rid)

    def rodar(self, rid, etapa):
        if etapa not in ETAPAS: raise ValueError(f"etapa desconhecida: {etapa}")
        self._reel(rid)
        for e in ETAPAS[ETAPAS.index(etapa):]:
            if not self._na_fila(("reel", rid, e)): self._fila.put(("reel", rid, e))
        self._mudou(rid)
        return self.reel(rid)

    def editar_take(self, rid, n, fala=None, movimento=None):
        """Troca a fala ou o movimento de um take. ⭐ O video daquele take e o final ficam velhos e saem."""
        def f(r):
            t = next((x for x in r["takes"] if x["n"] == int(n)), None)
            if not t: raise KeyError(n)
            if fala is not None:
                if not fala.strip(): raise ValueError("a fala não pode ficar vazia")
                t["fala"] = re.sub(r"\s*[—–]\s*|\s+-\s+", ", ", fala.strip())
            if movimento is not None: t["movimento"] = movimento.strip()
            t["video"] = ""
        self._alterar_reel(rid, f)
        final = os.path.join(self._pasta_reel(rid), "final.mp4")
        if os.path.isfile(final): os.remove(final)
        self._registrar(rid, f"take {n} editado à mão (refaça a geração e a montagem)")
        self._mudou(rid)
        return self.reel(rid)

    def abrir(self, rid):
        arq = self.arquivo_reel(rid, "final")
        os.startfile(arq)                                                   # noqa: S606
        return {"ok": True}

    def apagar(self, rid):
        self._reel(rid)
        if any(t == "reel" and i == rid for (t, i, _) in list(self._fila.queue) + [self._trabalhando or ("", "", "")]):
            raise ValueError("esse Reel está na fila: espere terminar")
        shutil.rmtree(self._pasta_reel(rid))
        self._mudou(rid)
        return {"ok": True}

    # ── repositorio ──
    def _publicados(self):
        return self._ler(os.path.join(self.base, "publicados.json"), []) or []

    def subir(self, rid):
        r = self._reel(rid)
        arq = self.arquivo_reel(rid, "final")
        if not self.ajustes()["repo_dir"]: raise ValueError("configure a pasta do repositório em Ajustes")
        hoje = _dt.date.today().isoformat()
        with self._t:
            pub = [i for i in self._publicados() if i["rid"] != rid]
            pub.append({"rid": rid, "nome": f"{rid}.mp4", "arquivo": arq, "data": hoje,
                        "legenda": r.get("legenda_post", "")})
            self._gravar(os.path.join(self.base, "publicados.json"), pub)
        self._alterar_reel(rid, lambda x: x.update(publicado="na fila"))
        self._fila.put(("repo", "", ""))
        self._mudou(rid)
        return {"ok": True}

    def limpar_repo(self):
        if not self.ajustes()["repo_dir"]: raise ValueError("configure a pasta do repositório em Ajustes")
        self._fila.put(("repo", "", ""))
        return {"ok": True}

    def _relogio(self):
        """Uma vez por dia (e logo ao abrir, se o dia mudou): a branch `videos` e' refeita no prazo."""
        while self._vivo:
            try:
                aj = self.ajustes()
                marca = self._ler(os.path.join(self.base, "limpeza.json"), {}) or {}
                if aj["repo_dir"] and self._publicados() and marca.get("dia") != _dt.date.today().isoformat() \
                        and not self._na_fila(("repo", "", "")):
                    self._fila.put(("repo", "", ""))
            except Exception:                                              # noqa: BLE001
                pass
            for _ in range(1800):
                if not self._vivo: return
                time.sleep(1)

    def _etapa_repo(self):
        aj = self.ajustes()
        pub = self._publicados()
        r = self.repo.publicar(aj["repo_dir"], pub, dias=aj["dias"])
        dentro = set(r["arquivos"])
        with self._t:
            self._gravar(os.path.join(self.base, "publicados.json"), [i for i in pub if i["nome"] in dentro])
            self._gravar(os.path.join(self.base, "limpeza.json"), {"dia": _dt.date.today().isoformat(), "t": time.time()})
        for i in pub:
            try:
                self._alterar_reel(i["rid"], lambda x, i=i: x.update(
                    publicado=i["data"] if i["nome"] in dentro else "saiu do repositório"))
            except KeyError:
                pass
        self._log(f"instagram: repositório com {len(dentro)} Reel(s)" + (f", {len(r['fora'])} saíram" if r["fora"] else ""))

    # ── o fio ──
    def _trabalhar(self):
        while self._vivo:
            try:
                item = self._fila.get(timeout=0.5)
            except queue.Empty:
                continue
            tipo, alvo, etapa = item
            self._trabalhando = item
            self._mudou(alvo)
            try:
                if tipo == "reel": getattr(self, f"_etapa_{etapa}")(alvo)
                elif tipo == "cena": self._etapa_cena(alvo, etapa)
                elif tipo == "repo": self._etapa_repo()
            except Exception as e:                                         # noqa: BLE001
                msg = str(e)[:240] or e.__class__.__name__
                self._log(f"⚠ instagram ({etapa or tipo}): {msg}")
                self._avisar(f"Instagram, {NOMES.get(etapa, etapa or tipo)}: {msg}", "erro")
                if tipo == "reel":
                    try: self._registrar(alvo, f"⚠ {NOMES[etapa]}: {msg}")
                    except Exception: pass                                 # noqa: BLE001
                    # ⛔ etapa que falhou nao deixa as seguintes rodarem em cima de nada
                    with self._fila.mutex:
                        self._fila.queue = type(self._fila.queue)(x for x in self._fila.queue
                                                                  if not (x[0] == "reel" and x[1] == alvo))
                if tipo == "repo":
                    for i in self._publicados():
                        try: self._alterar_reel(i["rid"], lambda x: x["publicado"] == "na fila" and x.update(publicado=""))
                        except Exception: pass                             # noqa: BLE001
            finally:
                self._trabalhando = None
                self._mudou(alvo)
                self._fila.task_done()

    def _etapa_cena(self, aid, cid):
        a = self._avatar(aid)
        c = next((x for x in a["cenas"] if x["id"] == cid), None)
        if not c: return
        foto = self._achar(self._pasta_av(aid), "foto")
        destino = os.path.join(self._pasta_av(aid), "cenas", f"{cid}.png")
        self._log(f"instagram: gerando o cômodo “{c['nome']}” de {a['nome']}")
        self._gerador().gerar_imagem(_rot.prompt_cena(a, c["cena"]), [foto], destino, self._log)
        if not os.path.isfile(destino): raise RuntimeError(f"o gerador não gravou a imagem de “{c['nome']}”")
        self._alterar_avatar(aid, lambda x: [y.update(estado="pronta") for y in x["cenas"] if y["id"] == cid])

    def _etapa_fonte(self, rid):
        r = self._reel(rid)
        p = self._pasta_reel(rid)
        fonte = os.path.join(p, "fonte.mp4")
        if not os.path.isfile(fonte):
            self._log(f"instagram: baixando o Reel de origem de {rid}")
            self.midia.baixar(r["url"], p, cookies=self.ajustes()["cookies"])
        self._log(f"instagram: transcrevendo o Reel de origem de {rid}")
        pals, lingua = self.midia.palavras(fonte)
        if not pals: raise RuntimeError("o Reel de origem não tem fala")
        origem = lingua if lingua in _rot.PALAVRAS_TAKE else "en"
        takes = _rot.cortar(pals, origem)
        self._alterar_reel(rid, lambda x: x.update(takes_origem=takes, idioma_origem=lingua, takes=[]))
        self._registrar(rid, f"fonte: {len(pals)} palavras em “{lingua}”, {len(takes)} take(s) de até 8 s")

    def _etapa_roteiro(self, rid):
        r = self._reel(rid)
        if not r.get("takes_origem"): raise RuntimeError("leia a fonte primeiro")
        a = self._avatar(r["avatar"])
        pedido = _rot.pedido_adaptacao(r["takes_origem"], r["idioma"], a, r["cta"])
        self._log(f"instagram: o Claude está adaptando {rid}")
        lido = None
        for _ in range(2):                         # ⭐ uma segunda tentativa se vier fora do formato
            lido = _rot.ler_adaptacao(self._claude(pedido), len(r["takes_origem"]))
            if lido: break
        if not lido: raise RuntimeError("a adaptação veio fora do formato")
        for t in lido["takes"]: t["video"] = ""
        self._alterar_reel(rid, lambda x: x.update(takes=lido["takes"], legenda_post=lido["legenda_post"]))
        final = os.path.join(self._pasta_reel(rid), "final.mp4")
        if os.path.isfile(final): os.remove(final)
        self._registrar(rid, f"roteiro: {len(lido['takes'])} takes ({len(lido['takes']) - 1} + CTA)")

    def _etapa_gerar(self, rid):
        r = self._reel(rid)
        if not r.get("takes"): raise RuntimeError("faça o roteiro primeiro")
        a = self._avatar(r["avatar"])
        pa, p = self._pasta_av(a["id"]), self._pasta_reel(rid)
        quadro = os.path.join(pa, "cenas", f"{r['cena']}.png")
        if not os.path.isfile(quadro): raise RuntimeError("a imagem do cômodo deste Reel sumiu: refaça o cômodo")
        g = self._gerador()
        fim_cta = quadro
        if r["cta"]["livro"]:
            fim_cta = os.path.join(p, "cta.png")
            if not os.path.isfile(fim_cta):
                livro = self._achar(pa, "livro")
                if not livro: raise RuntimeError("a capa do livro sumiu: suba de novo")
                self._log(f"instagram: gerando o quadro do livro de {rid}")
                g.gerar_imagem(_rot.PROMPT_OBJETO, [quadro, livro], fim_cta, self._log)
                if not os.path.isfile(fim_cta): raise RuntimeError("o gerador não gravou o quadro do livro")
        pedidos = [{"nome": f"take_{t['n']:02d}", "prompt": _rot.prompt_video(a, r["idioma"], t["movimento"], t["fala"], muda=t["cta"] and fim_cta != quadro),
                    "inicio": quadro, "fim": fim_cta if t["cta"] else quadro}
                   for t in r["takes"] if not (t.get("video") and os.path.isfile(t["video"]))]
        if not pedidos: return
        self._log(f"instagram: {len(pedidos)} take(s) de {rid} no gerador ({r['modelo']})")
        feitos = g.gerar_videos(pedidos, p, r["modelo"], self._log) or {}

        def f(x):
            for t in x["takes"]:
                arq = feitos.get(f"take_{t['n']:02d}")
                if arq and os.path.isfile(arq): t["video"] = arq
        r = self._alterar_reel(rid, f)
        falta = [t["n"] for t in r["takes"] if not (t.get("video") and os.path.isfile(t["video"]))]
        self._registrar(rid, f"geração: {len(pedidos) - len(falta)} de {len(pedidos)} take(s) prontos")
        if falta: raise RuntimeError(f"take(s) {', '.join(map(str, falta))} falharam: rode a geração de novo")

    def _etapa_montagem(self, rid):
        r = self._reel(rid)
        p = self._pasta_reel(rid)
        if not r["takes"] or not all(t.get("video") and os.path.isfile(t["video"]) for t in r["takes"]):
            raise RuntimeError("faltam takes: rode a geração")
        lingua = _rot.IDIOMAS[r["idioma"]]["whisper"]
        self._log(f"instagram: montando {rid}")
        # ⭐ o whisper mede onde a fala de cada take comeca e acaba; o texto da legenda vem do roteiro (grafia certa)
        clipes, legenda, inicio = [], [], 0.0
        for t in r["takes"]:
            pals, _ = self.midia.palavras(t["video"], lingua)
            ate = self.midia.fim_da_fala(pals, self.midia.duracao(t["video"]))
            clipes.append((t["video"], ate))
            legenda += self.midia.alinhar(t["fala"], pals, ate, inicio)
            inicio += ate
        sem = self.midia.montar(clipes, os.path.join(p, "sem_legenda.mp4"))
        self.midia.queimar(sem, self.midia.legenda_ass(legenda), os.path.join(p, "final.mp4"))
        if r.get("legenda_post"):
            open(os.path.join(p, "legenda_post.txt"), "w", encoding="utf-8").write(r["legenda_post"] + "\n")
        dur = round(sum(c[1] for c in clipes), 1)
        self._alterar_reel(rid, lambda x: x.update(duracao=dur))
        self._registrar(rid, f"montagem: {dur} s, 1080x1920, legenda queimada")
        self._avisar(f"Reel pronto ({dur} s).", "ok")
        if self.ajustes()["auto_subir"] and self.ajustes()["repo_dir"]: self.subir(rid)

    def esperar(self, limite=60):
        fim = time.time() + limite
        while time.time() < fim:
            if self._fila.unfinished_tasks == 0: return True
            time.sleep(0.05)
        return False

    def encerrar(self):
        self._vivo = False


def _autoteste():
    import subprocess, tempfile
    ok = True

    def caso(nome, cond):
        nonlocal ok; print(("  OK  " if cond else "  ERRO"), nome); ok &= bool(cond)

    base = tempfile.mkdtemp(prefix="min-ig-")
    png = base64.b64encode(b"\x89PNG\r\n\x1a\n" + b"0" * 500).decode()

    class Gerador:
        def __init__(self): self.videos, self.imagens, self.falhar = [], [], set()

        def gerar_imagem(self, prompt, refs, destino, diz):
            self.imagens.append((prompt, refs)); open(destino, "wb").write(b"\x89PNG" + b"0" * 100); return destino

        def gerar_videos(self, pedidos, pasta, modelo, diz):
            saida = {}
            for pd in pedidos:
                self.videos.append({**pd, "modelo": modelo})
                if pd["nome"] in self.falhar: saida[pd["nome"]] = None; continue
                arq = os.path.join(pasta, pd["nome"] + ".mp4")
                subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "color=green:s=720x1280:d=8:r=24",
                                "-f", "lavfi", "-i", "sine=duration=8", "-shortest", "-c:v", "libx264", "-c:a", "aac",
                                arq], check=True)
                saida[pd["nome"]] = arq
            return saida

    class Midia:
        baixados = []
        duracao = staticmethod(_midia.duracao)
        fim_da_fala = staticmethod(_midia.fim_da_fala)
        montar = staticmethod(_midia.montar)
        legenda_ass = staticmethod(_midia.legenda_ass)
        queimar = staticmethod(_midia.queimar)
        alinhar = staticmethod(_midia.alinhar)

        @classmethod
        def baixar(cls, url, pasta, cookies=""):
            cls.baixados.append(url); open(os.path.join(pasta, "fonte.mp4"), "wb").write(b"0")

        @staticmethod
        def palavras(arq, idioma=None):
            if arq.endswith("fonte.mp4"):
                ws, t = [], 0.0
                for w in ("Did you know that ginger in the morning wakes up your stomach. My grandmother made "
                          "this tea every winter for the whole family.").split():
                    ws.append({"w": w, "ini": t, "fim": t + 0.35}); t += 0.4
                return ws, "en"
            return [{"w": "Olá,", "ini": 0.4, "fim": 0.9}, {"w": "gente", "ini": 0.9, "fim": 1.4}], idioma

    pedidos = []

    def claude(pedido, timeout=0):
        pedidos.append(pedido)
        n = len(re.findall(r"^\d+\. \(", pedido, flags=re.M))
        return json.dumps({"takes": [{"n": i, "fala": f"Fala {i} da Tomiko", "movimento": "She smiles at the camera."}
                                     for i in range(1, n + 2)], "legenda_post": "Chá de gengibre 🍵"})

    eventos = []

    class N:
        def log(self, t): eventos.append(("log", t))
        def avisar(self, t, tom=""): eventos.append(("aviso", t, tom))
        def _emitir(self, tipo, **d): eventos.append((tipo, d))

    g = Gerador()
    ig = Instagram(N(), base=base, chamar=claude, midia=Midia, backend=g, iniciar_fios=False)
    try:
        ig.criar_avatar("Tomiko", png, "exe"); caso("⛔ foto com extensao estranha", False)
    except ValueError:
        caso("⛔ foto com extensao estranha", True)
    a = ig.criar_avatar("Tomiko Hayashi", "data:image/png;base64," + png, "png", tomiko=True)
    aid = a["id"]
    caso("avatar com a ficha da Tomiko e 8 comodos pendentes", a["foto"] and len(a["cenas"]) == 8
         and all(c["estado"] == "pendente" for c in a["cenas"]) and "Japanese-Brazilian" in a["prefixo"])
    try:
        ig.criar_reel(aid, "pt", url="https://www.instagram.com/reel/abc/"); caso("⛔ Reel sem comodo aprovado", False)
    except ValueError:
        caso("⛔ Reel sem comodo aprovado", True)
    ig.gerar_pool(aid); ig.esperar(20)
    a = ig._info_avatar(ig._avatar(aid))
    caso("⭐ o pool gera as 8 imagens com a foto como referencia", all(c["estado"] == "pronta" and c["tem"] for c in a["cenas"])
         and all(refs[0].endswith("foto.png") for _, refs in g.imagens))
    caso("prompt do comodo e' 9:16 com a descricao do avatar", g.imagens[0][0].startswith("Vertical 9:16")
         and "sashiko" in g.imagens[0][0])
    try:
        ig.cena(aid, "nao-existe", "aprovar"); caso("⛔ comodo inexistente", False)
    except KeyError:
        caso("⛔ comodo inexistente", True)
    for c in ("cozinha", "varanda"): ig.cena(aid, c, "aprovar")
    ig.enviar_imagem(aid, "livro", png, "jpg")
    r1 = ig.criar_reel(aid, "pt", url="https://www.instagram.com/reel/abc/", cta="palavra", palavra="Umeboshi", livro=True)
    caso("⛔ link de fora recusado", _erro(lambda: ig.criar_reel(aid, "pt", url="https://evil.com/x")))
    caso("⛔ palavra com espaco recusada", _erro(lambda: ig.criar_reel(aid, "pt", url="https://www.instagram.com/reel/x/",
                                                                       cta="palavra", palavra="duas palavras")))
    ig.esperar(120)
    r1 = ig.reel(r1["id"])
    est = {e["id"]: e["estado"] for e in r1["etapas"]}
    caso("⭐ as 4 etapas rodam sozinhas", all(v == "pronta" for v in est.values()) and r1["final"])
    caso("fonte: baixou o link e cortou em takes", Midia.baixados == ["https://www.instagram.com/reel/abc/"]
         and len(r1["takes_origem"]) >= 2 and r1["idioma_origem"] == "en")
    caso("roteiro: pediu em portugues com a palavra do CTA", "Brazilian Portuguese" in pedidos[0] and '"umeboshi,"' in pedidos[0])
    caso("roteiro: um take a mais para o CTA", len(r1["takes"]) == len(r1["takes_origem"]) + 1 and r1["takes"][-1]["cta"])
    vs = g.videos
    caso("⭐ todos os takes no mesmo comodo (inicio)", len({v["inicio"] for v in vs}) == 1 and vs[0]["inicio"].endswith("cozinha.png"))
    caso("⭐ o CTA termina no quadro do livro", vs[-1]["fim"].endswith("cta.png") and vs[0]["fim"] == vs[0]["inicio"])
    caso("o quadro do livro usou o comodo e a capa", g.imagens[-1][1][0].endswith("cozinha.png")
         and g.imagens[-1][1][1].endswith("livro.jpg") and "SECOND reference" in g.imagens[-1][0])
    caso("⭐ o take do livro pede a mudanca durante a fala", "in step with the speech" in vs[-1]["prompt"]
         and "in step with the speech" not in vs[0]["prompt"])
    caso("modelo gratis por padrao", all(v["modelo"] == "gratis" for v in vs))
    caso("prompt do take no formato testado", vs[0]["prompt"].startswith("Interpolate naturally") and "Fala 1 da Tomiko" in vs[0]["prompt"])
    ass = open(os.path.join(ig._pasta_reel(r1["id"]), "legenda.ass"), encoding="utf-8").read()
    caso("⭐ a legenda queimada usa a fala do roteiro", "Fala 1 da" in ass and "Olá" not in ass)
    caso("legenda do post gravada", open(os.path.join(ig._pasta_reel(r1["id"]), "legenda_post.txt"), encoding="utf-8").read().startswith("Chá"))
    r2 = ig.criar_reel(aid, "en", url="https://www.instagram.com/reel/def/")
    caso("⭐ o video seguinte vai para o outro comodo", r2["cena"] == "varanda")
    ig.esperar(120)
    n_antes = len(g.videos)
    ig.editar_take(r2["id"], 1, fala="Uma fala nova — com travessão")
    r2 = ig.reel(r2["id"])
    caso("editar um take tira o video dele e o final", not r2["takes"][0]["video"] and not r2["final"]
         and "—" not in r2["takes"][0]["fala"])
    ig.rodar(r2["id"], "gerar"); ig.esperar(120)
    caso("⭐ refazer a geracao gera so' o take editado", len(g.videos) == n_antes + 1 and ig.reel(r2["id"])["final"])
    g.falhar = {"take_02"}
    r3 = ig.criar_reel(aid, "pt", url="https://www.instagram.com/reel/ghi/")
    ig.esperar(120)
    r3 = ig.reel(r3["id"])
    caso("⛔ take que falha para a montagem e explica", not r3["final"] and "take(s) 2 falharam" in r3["registro"][0]["texto"]
         and any(e[0] == "aviso" and e[2] == "erro" for e in eventos))
    caso("⛔ caminho de arquivo nao sai da pasta", _erro(lambda: ig.arquivo_reel("../../x", "final"), KeyError)
         and _erro(lambda: ig.arquivo_avatar(aid, "cena-../foto"), KeyError))
    caso("arquivo do Reel pronto", ig.arquivo_reel(r1["id"], "final").endswith("final.mp4"))
    caso("⛔ subir sem repositorio configurado", _erro(lambda: ig.subir(r1["id"])))
    remoto, clone = os.path.join(base, "r.git"), os.path.join(base, "clone")
    subprocess.run(["git", "init", "-q", "--bare", remoto], check=True)
    subprocess.run(["git", "clone", "-q", remoto, clone], check=True, capture_output=True)
    ig.salvar_ajustes(repo_dir=clone, dias=5)
    ig.subir(r1["id"]); ig.esperar(60)
    nomes = subprocess.run(["git", "-C", remoto, "ls-tree", "-r", "--name-only", "videos"], capture_output=True,
                           text=True).stdout.split()
    caso("⭐ subir: o Reel e a legenda chegam na branch videos", any(x.endswith(f"{r1['id']}.mp4") for x in nomes)
         and any(x.endswith(f"{r1['id']}.txt") for x in nomes) and ig.reel(r1["id"])["publicado"] == _dt.date.today().isoformat())
    caso("⛔ ajuste de dias fora do intervalo", _erro(lambda: ig.salvar_ajustes(dias=0)))
    caso("⛔ backend que nao existe", _erro(lambda: ig.salvar_ajustes(backend=os.path.join(base, "nao.py")), Exception))
    caso("tudo() para o painel", len(ig.tudo()["reels"]) == 3 and ig.tudo()["gerador"]["ok"])
    caso("eventos mudou/instagram", any(e[0] == "mudou" and e[1].get("o") == "instagram" for e in eventos))
    ig.encerrar()
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


def _erro(fn, tipo=ValueError):
    try:
        fn()
    except tipo:
        return True
    return False


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.exit(0 if _autoteste() else 1)
