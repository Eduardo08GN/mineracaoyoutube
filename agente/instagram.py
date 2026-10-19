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

Depois de pronto, o editor de curadoria (painel: telas/EditorReel.tsx) revisa take a take:
    curadoria o defeito apontado vira ocorrencia (motor/instagram_curadoria.py), o Claude reescreve o take e o Veo
              gera 2 versoes novas; a escolhida entra no Reel e a montagem roda de novo sozinha.
⭐ Cada take guarda as suas versoes (take_NN_vK.mp4): nada e' sobrescrito.

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
import instagram_curadoria as _cur                                          # noqa: E402
import instagram_midia as _midia                                            # noqa: E402
import instagram_repo as _repo                                              # noqa: E402
import instagram_roteiro as _rot                                            # noqa: E402

PASTA = os.path.join(config.DATA, "instagram")
ETAPAS = ("fonte", "roteiro", "gerar", "montagem")
NOMES = {"fonte": "Fonte", "roteiro": "Roteiro", "gerar": "Geração", "montagem": "Montagem", "curadoria": "Curadoria"}
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
        def versao(cid):
            arq = os.path.join(p, "cenas", f"{cid}.png")
            return int(os.path.getmtime(arq)) if os.path.isfile(arq) else 0
        cenas = [{**c, "tem": os.path.isfile(os.path.join(p, "cenas", f"{c['id']}.png")), "v": versao(c["id"]),
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
                "trabalhando": trab[2] if trab and trab[0] in ("reel", "curadoria") and trab[1] == r["id"] else "",
                "na_fila": [e for (t, i, e) in list(self._fila.queue) if t in ("reel", "curadoria") and i == r["id"]],
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
                "idiomas": {k: v["nome"] for k, v in _rot.IDIOMAS.items()}, "legendas": _midia.estilos_legenda(),
                "gerador": self._estado_gerador(aj), "publicados": self._publicados(), "producao": self._producao()}

    def _producao(self):
        """O que o fio da aba faz agora, para o painel de producao: {"tipo", "id", "etapa"} | None, e a fila."""
        trab = self._trabalhando
        agora = {"tipo": trab[0], "id": trab[1], "etapa": NOMES.get(trab[2], trab[2])} if trab else None
        return {"agora": agora, "fila": self._fila.qsize()}

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
        # ⭐ as pecas do editor de curadoria: cada versao de take, a miniatura dela, os quadros de abertura e de origem
        for padrao, ext in ((r"take_\d{2}(_v\d+)?", "mp4"), (r"mini_\d{2}_v\d+", "jpg"), (r"quadro_\d{2}(_q\d+)?", "png"),
                            (r"origem_\d{2}", "jpg"), (r"cta(_quadro_\d{2}_q\d+)?", "png")):
            if re.fullmatch(padrao, qual): arq = os.path.join(p, f"{qual}.{ext}")
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
        if not a["prefixo"]: a["prefixo"] = "The same person from the frame, same face, hands, clothes and setting."
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

    def enviar_cena(self, aid, cid, imagem, ext):
        """A imagem do comodo feita fora do gerador (ex.: no Flow, a mao). Vira cenas/<cid>.png e fica para aprovar."""
        from PIL import Image
        import io
        _valida(cid)
        ext = (ext or "").lower().lstrip(".")
        if ext not in EXT_IMAGEM: raise ValueError("a imagem tem de ser PNG, JPG ou WEBP")
        a = self._avatar(aid)
        if not any(c["id"] == cid for c in a["cenas"]): raise KeyError(cid)
        if self._na_fila(("cena", aid, cid)): raise ValueError("esse cômodo está na fila do gerador agora")
        try:
            img = Image.open(io.BytesIO(_bytes_de(imagem))).convert("RGB")
        except OSError as e:
            raise ValueError("não consegui abrir essa imagem") from e
        destino = os.path.join(self._pasta_av(aid), "cenas", f"{cid}.png")
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        img.save(destino + ".tmp.png", "PNG")
        os.replace(destino + ".tmp.png", destino)
        a = self._alterar_avatar(aid, lambda x: [y.update(estado="pronta") for y in x["cenas"] if y["id"] == cid])
        w, h = img.size
        nome = next(c["nome"] for c in a["cenas"] if c["id"] == cid)
        self._log(f"instagram: imagem do cômodo “{nome}” de {a['nome']} enviada ({w}x{h})")
        self._mudou(aid)
        info = self._info_avatar(a)
        # ⛔ o take do Veo e' 9:16: quadro deitado ou quadrado sai cortado na montagem
        if abs(w / h - 9 / 16) > 0.06: info["aviso"] = f"a imagem tem {w}x{h}, não é vertical 9:16: o Reel vai cortar as bordas"
        return info

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
                   modelo="gratis", legenda=0):
        a = self._avatar(_valida(avatar))
        if idioma not in _rot.IDIOMAS: raise ValueError("idioma desconhecido")
        if modelo not in ("gratis", "pago"): raise ValueError("modelo desconhecido")
        if cta not in ("bio", "palavra"): raise ValueError("CTA desconhecido")
        palavra = " ".join((palavra or "").split())
        if cta == "palavra" and not re.fullmatch(r"[A-Za-zÀ-ÿ0-9]{2,20}( [A-Za-zÀ-ÿ0-9]{1,20}){0,2}", palavra):
            raise ValueError("o CTA é uma palavra ou uma frase curta de até 3 palavras (só letras)")
        legenda = int(legenda or 0)
        if legenda and legenda not in _midia.estilos_legenda(): raise ValueError("estilo de legenda desconhecido")
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
             "cta": {"tipo": cta, "palavra": _slug(palavra).replace("-", " ") if cta == "palavra" else "", "livro": bool(livro)},
             "modelo": modelo, "legenda": legenda, "takes_origem": [], "takes": [], "legenda_post": "", "registro": [],
             "publicado": ""}
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

    # ── editor de curadoria (telas/EditorReel.tsx): revisar take a take, refazer com o defeito apontado ──
    def _take(self, r, n):
        t = next((x for x in r["takes"] if x["n"] == int(n)), None)
        if not t: raise KeyError(n)
        return t

    def _ocupado_reel(self, rid):
        """Etapa do Reel na fila ou rodando que mexe nos takes (o roteiro troca todos; a geracao grava video neles)."""
        itens = list(self._fila.queue) + ([self._trabalhando] if self._trabalhando else [])
        return any(i[0] == "reel" and i[1] == rid and i[2] in ("roteiro", "gerar") for i in itens)

    def _mini(self, rid, t, ver):
        """A miniatura de uma versao (para a timeline e o seletor de versoes), tirada no meio da fala."""
        arq = os.path.join(self._pasta_reel(rid), f"mini_{t['n']:02d}_v{ver['v']}.jpg")
        if not os.path.isfile(arq) and os.path.isfile(ver["video"]):
            de, ate = t.get("corte") or [0.5, 6.0]
            try:
                self.midia.quadro(ver["video"], (de + ate) / 2, arq)
            except Exception:                                              # noqa: BLE001
                return ""
        return os.path.basename(arq)[:-4] if os.path.isfile(arq) else ""

    def editor(self, rid):
        """Tudo do editor de curadoria: o Reel, e por take as versoes (com miniatura), o corte e o estado da revisao."""
        r = self._reel(rid)
        if any(not t.get("versoes") and t.get("video") for t in r["takes"]):
            r = self._alterar_reel(rid, lambda x: [self._migrar(t) for t in x["takes"]])
        takes = []
        for t in r["takes"]:
            versoes = [{**{k: x for k, x in ver.items() if k not in ("video", "quadro_png")},
                        "arquivo": os.path.basename(ver["video"])[:-4], "existe": os.path.isfile(ver["video"]),
                        "quadro_arquivo": os.path.basename(ver.get("quadro_png") or "")[:-4],
                        "mini": self._mini(rid, t, ver)} for ver in t.get("versoes", [])]
            takes.append({**{k: x for k, x in t.items() if k not in ("versoes", "video", "quadro_png")},
                          "versoes": versoes, "cur": t.get("cur") or {"estado": ""}})
        return {"reel": self._resumo(r), "takes": takes, "etiquetas": [{"id": e, "nome": n} for e, n in _cur.ETIQUETAS],
                "ocupado": self._ocupado_reel(rid)}

    def anotar_take(self, rid, n, defeito="", etiquetas=()):
        """O defeito apontado num take, ainda sem mandar refazer (o rascunho fica salvo)."""
        etiquetas = [e for e in etiquetas if e in _cur.IDS_ETIQUETA]

        def f(r):
            cur = self._take(r, n).setdefault("cur", {"estado": ""})
            if cur.get("estado") in ("refazer", "refazendo"): raise ValueError(f"o take {n} já está sendo refeito")
            cur.update(defeito=(defeito or "").strip(), etiquetas=etiquetas)
            if cur["defeito"] or etiquetas: cur["estado"] = "defeito"
            elif cur.get("estado") == "defeito": cur["estado"] = ""
        self._alterar_reel(rid, f)
        self._mudou(rid)
        return {"ok": True}

    def aceitar_take(self, rid, n):
        """O take como esta' fica. Se havia versoes novas para escolher, fica a ativa (e a ocorrencia registra isso)."""
        oc = {}

        def f(x):
            t = self._take(x, n)
            cur = t.setdefault("cur", {"estado": ""})
            if cur.get("estado") in ("refazer", "refazendo"): raise ValueError(f"o take {n} está sendo refeito")
            if cur.get("estado") == "escolher": oc.update(id=cur.get("ocorrencia", ""), v=t.get("v"))
            cur.update(estado="aceito", defeito="", etiquetas=[])
        self._alterar_reel(rid, f)
        if oc.get("id"):
            _cur.registrar(self.base, {"tipo": "escolha", "id": oc["id"], "reel": rid, "take": int(n), "v": oc["v"],
                                       "resolveu": False})
        self._mudou(rid)
        return {"ok": True}

    def escolher_versao(self, rid, n, v):
        """A versao `v` passa a ser a do Reel. ⭐ A fala vai junto (a legenda queimada e' a da versao) e a montagem
        roda de novo sozinha (so' ffmpeg)."""
        info = {}

        def f(r):
            t = self._take(r, n)
            ver = next((x for x in self._migrar(t) if x["v"] == int(v)), None)
            if not ver or not os.path.isfile(ver["video"]): raise KeyError(v)
            cur = t.setdefault("cur", {"estado": ""})
            if cur.get("estado") in ("refazer", "refazendo"): raise ValueError(f"o take {n} está sendo refeito")
            info.update(mudou=t.get("v") != ver["v"], origem=ver.get("origem", ""),
                        ocorrencia=cur.get("ocorrencia", "") if cur.get("estado") == "escolher" else "")
            t.update(video=ver["video"], v=ver["v"], fala=ver["fala"], movimento=ver["movimento"],
                     quadro=ver.get("quadro", t.get("quadro", "")), quadro_png=ver.get("quadro_png", ""))
            cur.update(estado="aceito", defeito="", etiquetas=[])
        self._alterar_reel(rid, f)
        if info["ocorrencia"]:
            _cur.registrar(self.base, {"tipo": "escolha", "id": info["ocorrencia"], "reel": rid, "take": int(n), "v": int(v),
                                       "resolveu": info["origem"] == "correcao"})
        if info["mudou"]:
            self._registrar(rid, f"curadoria: take {n} agora na versão {v}")
            if not self._na_fila(("reel", rid, "montagem")): self._fila.put(("reel", rid, "montagem"))
        self._mudou(rid)
        return {"ok": True, "remontando": info["mudou"]}

    def refazer_takes(self, rid, itens):
        """Manda refazer takes no Veo: itens = [{"n", "fala"?, "movimento"?}]. Com o defeito apontado, o corretor
        (Claude) reescreve o take; com fala/movimento escritos a mao, eles vao como estao. Cada take sai em 2 versoes.
        ⭐ Grava a ocorrencia (a migalha do erro) antes de qualquer coisa."""
        if not itens: raise ValueError("nenhum take para refazer")
        if self._ocupado_reel(rid): raise ValueError("o Reel está no roteiro ou na geração agora: espere terminar")
        r = self._reel(rid)
        a = self._avatar(r["avatar"])
        eventos, ns = [], []

        def f(x):
            for it in itens:
                t = self._take(x, it["n"])
                self._migrar(t)
                cur = t.setdefault("cur", {"estado": ""})
                if cur.get("estado") in ("refazer", "refazendo"): raise ValueError(f"o take {t['n']} já está sendo refeito")
                manual = {k: it[k].strip() for k in ("fala", "movimento")
                          if isinstance(it.get(k), str) and it[k].strip() and it[k].strip() != t[k]}
                if not (cur.get("defeito") or cur.get("etiquetas") or manual):
                    raise ValueError(f"aponte o defeito do take {t['n']} ou edite a fala ou o movimento")
                ativa = next((v for v in t["versoes"] if v["v"] == t.get("v")), {})
                oc = _cur.nova_id()
                eventos.append({"tipo": "defeito", "id": oc, "reel": rid, "take": t["n"], "avatar": a["id"],
                                "idioma": x["idioma"], "modelo": x["modelo"], "v": t.get("v"), "cta": t["cta"],
                                "defeito": cur.get("defeito", ""), "etiquetas": cur.get("etiquetas", []),
                                "fala": t["fala"], "quadro": t.get("quadro", ""), "movimento": t["movimento"],
                                "prompt": ativa.get("prompt") or _rot.prompt_video(a, x["idioma"], t["movimento"], t["fala"]),
                                "manual": manual})
                cur.update(estado="refazer", ocorrencia=oc, manual=manual, correcao={})
                ns.append(t["n"])
        self._alterar_reel(rid, f)
        for ev in eventos: _cur.registrar(self.base, ev)
        if ("curadoria", rid, "curadoria") not in list(self._fila.queue): self._fila.put(("curadoria", rid, "curadoria"))
        self._registrar(rid, f"curadoria: take(s) {', '.join(map(str, ns))} para refazer")
        self._log(f"instagram: curadoria de {rid}, take(s) {', '.join(map(str, ns))} na fila")
        self._mudou(rid)
        return {"ok": True, "takes": ns}

    def _etapa_curadoria(self, rid):
        r = self._reel(rid)
        a = self._avatar(r["avatar"])
        alvos = [t for t in r["takes"] if (t.get("cur") or {}).get("estado") == "refazer"]
        if not alvos: return
        lingua = _rot.IDIOMAS[r["idioma"]]["whisper"]
        prontos = []
        for t in alvos:
            cur = t["cur"]
            # ⭐ edicao a mao vai direto ao Veo SO' sem defeito apontado; com defeito, o corretor recebe a edicao como a
            #    intencao de quem revisa (o campo "movimento" chegou a receber a descricao do erro em portugues)
            if cur.get("manual") and not (cur.get("defeito") or cur.get("etiquetas")):
                corr = {"fala": cur["manual"].get("fala", t["fala"]), "movimento": cur["manual"].get("movimento", t["movimento"]),
                        "quadro": t.get("quadro", ""), "refazer_quadro": False, "motivo": "editado à mão"}
            else:
                ouvido = ""
                if t.get("video") and os.path.isfile(t["video"]):
                    try:
                        ouvido = " ".join(w["w"] for w in self.midia.palavras(t["video"], lingua)[0])
                    except Exception:                                      # noqa: BLE001
                        ouvido = ""
                ativa = next((v for v in t.get("versoes", []) if v["v"] == t.get("v")), {})
                prompt = ativa.get("prompt") or _rot.prompt_video(a, r["idioma"], t["movimento"], t["fala"])
                pedido = _cur.pedido_correcao(a, r["idioma"], r["cta"], t, cur.get("defeito", ""), cur.get("etiquetas", []),
                                              ouvido, prompt, cur.get("manual"))
                self._log(f"instagram: o Claude está corrigindo o take {t['n']} de {rid}")
                corr = None
                for _ in range(2):                         # ⭐ uma segunda tentativa se vier fora do formato
                    corr = _cur.ler_correcao(self._claude(pedido))
                    if corr: break
                if not corr: raise RuntimeError(f"a correção do take {t['n']} veio fora do formato")
                corr["ouvido"] = ouvido
            _cur.registrar(self.base, {"tipo": "correcao", "id": cur.get("ocorrencia", ""), "reel": rid, "take": t["n"], **corr})
            prontos.append({**t, "fala": corr["fala"], "movimento": corr["movimento"], "quadro": corr["quadro"] or t.get("quadro", ""),
                            "_novo_quadro": corr["refazer_quadro"], "_motivo": corr["motivo"]})
            self._alterar_reel(rid, lambda x, n=t["n"], c=corr: self._take(x, n)["cur"].update(estado="refazendo", correcao=c))
            self._mudou(rid)
        novas = self._gerar_takes(rid, prontos, copias=2)
        motivos = {t["n"]: t["_motivo"] for t in prontos}

        def f(x):
            for t in x["takes"]:
                if t["n"] not in motivos: continue
                vs = self._migrar(t)
                for ver in novas.get(t["n"], []):
                    vs.append({**ver, "origem": "correcao", "nota": motivos[t["n"]]})
                t["cur"]["estado"] = "escolher" if novas.get(t["n"]) else "defeito"
        self._alterar_reel(rid, f)
        for t in prontos:
            _cur.registrar(self.base, {"tipo": "versoes", "id": t["cur"].get("ocorrencia", ""), "reel": rid, "take": t["n"],
                                       "versoes": [v["v"] for v in novas.get(t["n"], [])]})
        falhou = [t["n"] for t in prontos if not novas.get(t["n"])]
        feitos = sum(len(v) for v in novas.values())
        self._registrar(rid, f"curadoria: {feitos} versão(ões) nova(s) para escolher" +
                        (f"; take(s) {', '.join(map(str, falhou))} sem versão nova" if falhou else ""))
        if feitos: self._avisar(f"Curadoria: {feitos} versão(ões) nova(s) para escolher.", "ok")
        if falhou: raise RuntimeError(f"o gerador não entregou versão nova do(s) take(s) {', '.join(map(str, falhou))}")

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
                elif tipo == "curadoria": self._etapa_curadoria(alvo)
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
                if tipo == "curadoria":
                    try:
                        self._registrar(alvo, f"⚠ Curadoria: {msg}")
                        # ⭐ os takes voltam a "com defeito", com o texto apontado: e' so' mandar de novo
                        self._alterar_reel(alvo, lambda x: [t["cur"].update(estado="defeito") for t in x["takes"]
                                                            if (t.get("cur") or {}).get("estado") in ("refazer", "refazendo")])
                    except Exception: pass                                 # noqa: BLE001
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
        p = self._pasta_reel(rid)
        for arq in os.listdir(p):                  # ⛔ quadro velho seria de outra fala: roteiro novo = quadros novos
            if arq == "final.mp4" or re.fullmatch(r"(quadro_\d{2}\.png|origem_\d{2}\.jpg)", arq): os.remove(os.path.join(p, arq))
        self._registrar(rid, f"roteiro: {len(lido['takes'])} takes ({len(lido['takes']) - 1} + CTA)")

    # ── geracao dos takes (o roteiro e a curadoria usam o mesmo caminho) ──
    @staticmethod
    def _migrar(t):
        """⭐ Take de antes das versoes (so' "video"): o video dele vira a v1. Devolve a lista de versoes."""
        if not t.get("versoes"):
            t["versoes"] = ([{"v": 1, "video": t["video"], "fala": t["fala"], "movimento": t["movimento"],
                              "quadro": t.get("quadro", ""), "quadro_png": t.get("quadro_png", ""), "origem": "roteiro",
                              "nota": "", "criado": 0}] if t.get("video") else [])
            if t["versoes"]: t["v"] = 1
        return t["versoes"]

    def _quadro_take(self, r, a, t, g, novo=False):
        """O quadro de abertura de um take: o do take (o escolhido), o padrao quadro_NN.png, ou um novo quadro_NN_qK.png
        quando a curadoria pede (`novo`). ⭐ Cada take abre no SEU quadro, com o angulo e o zoom do video de origem
        naquele trecho (o take do CTA usa o ultimo). O comodo entra so' pelo texto: a imagem dele como referencia
        dominava o quadro e punha o avatar de corpo inteiro, longe da camera (18/10). Sem video de origem, vale a
        imagem do comodo."""
        pa, p = self._pasta_av(a["id"]), self._pasta_reel(r["id"])
        comodo = os.path.join(pa, "cenas", f"{r['cena']}.png")
        if not novo and t.get("quadro_png") and os.path.isfile(t["quadro_png"]): return t["quadro_png"]
        foto, fonte, origem = self._achar(pa, "foto"), os.path.join(p, "fonte.mp4"), r.get("takes_origem") or []
        if not (foto and origem and os.path.isfile(fonte)): return comodo
        n = t["n"]
        arq = os.path.join(p, f"quadro_{n:02d}.png")
        if novo:
            k = 2
            while os.path.isfile(os.path.join(p, f"quadro_{n:02d}_q{k}.png")): k += 1
            arq = os.path.join(p, f"quadro_{n:02d}_q{k}.png")
        if not os.path.isfile(arq):
            o = origem[min(n, len(origem)) - 1]
            ref = os.path.join(p, f"origem_{n:02d}.jpg")
            if not os.path.isfile(ref): self.midia.quadro(fonte, (o["ini"] + o["fim"]) / 2, ref)
            lugar = next((c["cena"] for c in a["cenas"] if c["id"] == r["cena"]), "")
            self._log(f"instagram: gerando o quadro do take {n} de {r['id']}")
            g.gerar_imagem(_rot.prompt_quadro(a, lugar, t.get("quadro", "")), [ref, foto], arq, self._log)
            if not os.path.isfile(arq): raise RuntimeError(f"o gerador não gravou o quadro do take {n}")
        return arq

    def _fim_take(self, r, a, t, inicio, g):
        """O quadro final: o mesmo do inicio; no CTA com livro, o avatar segurando o livro NESSE quadro."""
        if not (t["cta"] and r["cta"]["livro"]): return inicio
        p = self._pasta_reel(r["id"])
        padrao = os.path.join(p, f"quadro_{t['n']:02d}.png")
        arq = os.path.join(p, "cta.png" if inicio == padrao or not inicio.startswith(p) else
                           f"cta_{os.path.splitext(os.path.basename(inicio))[0]}.png")
        if not os.path.isfile(arq):
            livro = self._achar(self._pasta_av(a["id"]), "livro")
            if not livro: raise RuntimeError("a capa do livro sumiu: suba de novo")
            self._log(f"instagram: gerando o quadro do livro de {r['id']}")
            g.gerar_imagem(_rot.PROMPT_OBJETO, [inicio, livro], arq, self._log)
            if not os.path.isfile(arq): raise RuntimeError("o gerador não gravou o quadro do livro")
        return arq

    def _gerar_takes(self, rid, alvos, copias=1):
        """Gera `copias` versoes novas de cada take de `alvos` (dicts com fala/movimento/quadro ja' finais; "_novo_quadro"
        pede um quadro de abertura novo). Devolve {n: [versao, ...]} so' com o que o gerador entregou.
        ⭐ Nada e' sobrescrito: cada video novo vira take_NN_vK.mp4, e a versao guarda o prompt mandado ao Veo."""
        r = self._reel(rid)
        a = self._avatar(r["avatar"])
        p = self._pasta_reel(rid)
        if not os.path.isfile(os.path.join(self._pasta_av(a["id"]), "cenas", f"{r['cena']}.png")):
            raise RuntimeError("a imagem do cômodo deste Reel sumiu: refaça o cômodo")
        g = self._gerador()
        usados = {t["n"]: max([v["v"] for v in self._migrar(dict(t))] + [0]) for t in r["takes"]}
        pedidos, meta = [], {}
        for t in alvos:
            inicio = self._quadro_take(r, a, t, g, novo=t.get("_novo_quadro", False))
            fim = self._fim_take(r, a, t, inicio, g)
            prompt = _rot.prompt_video(a, r["idioma"], t["movimento"], t["fala"], muda=fim != inicio)
            for i in range(copias):
                v = usados[t["n"]] + 1 + i
                nome = f"take_{t['n']:02d}_v{v}"
                pedidos.append({"nome": nome, "prompt": prompt, "inicio": inicio, "fim": fim})
                meta[nome] = {"n": t["n"], "v": v, "fala": t["fala"], "movimento": t["movimento"],
                              "quadro": t.get("quadro", ""), "quadro_png": inicio, "prompt": prompt}
        self._log(f"instagram: {len(pedidos)} take(s) de {rid} no gerador ({r['modelo']})")
        feitos = g.gerar_videos(pedidos, p, r["modelo"], self._log) or {}
        novas = {}
        for nome, m in meta.items():
            arq = feitos.get(nome)
            if arq and os.path.isfile(arq):
                novas.setdefault(m["n"], []).append({**{k: x for k, x in m.items() if k != "n"}, "video": arq,
                                                     "criado": round(time.time(), 2)})
        return novas

    def _etapa_gerar(self, rid):
        r = self._reel(rid)
        if not r.get("takes"): raise RuntimeError("faça o roteiro primeiro")
        faltam = [t for t in r["takes"] if not (t.get("video") and os.path.isfile(t["video"]))]
        if not faltam: return
        novas = self._gerar_takes(rid, faltam)

        def f(x):
            for t in x["takes"]:
                for ver in novas.get(t["n"], []):
                    vs = self._migrar(t)
                    # ⭐ take que ja' tinha versao e perdeu o video = editado a mao no cartao do Reel
                    vs.append({**ver, "origem": "manual" if vs else "roteiro", "nota": ""})
                    t.update(video=ver["video"], v=ver["v"], quadro_png=ver["quadro_png"])
        r = self._alterar_reel(rid, f)
        falta = [t["n"] for t in r["takes"] if not (t.get("video") and os.path.isfile(t["video"]))]
        self._registrar(rid, f"geração: {len(faltam) - len(falta)} de {len(faltam)} take(s) prontos")
        if falta: raise RuntimeError(f"take(s) {', '.join(map(str, falta))} falharam: rode a geração de novo")

    def _etapa_montagem(self, rid):
        r = self._reel(rid)
        p = self._pasta_reel(rid)
        if not r["takes"] or not all(t.get("video") and os.path.isfile(t["video"]) for t in r["takes"]):
            raise RuntimeError("faltam takes: rode a geração")
        lingua = _rot.IDIOMAS[r["idioma"]]["whisper"]
        self._log(f"instagram: montando {rid}")
        # ⭐ o whisper mede onde a fala de cada take comeca e acaba; o take vai de um respiro antes da primeira palavra a
        #    um respiro depois da ultima. O texto da legenda vem do roteiro (grafia certa).
        clipes, legenda, inicio, cortes = [], [], 0.0, {}
        for t in r["takes"]:
            pals, _ = self.midia.palavras(t["video"], lingua)
            ate = self.midia.fim_da_fala(pals, self.midia.duracao(t["video"]))
            de = min(self.midia.inicio_da_fala(pals), max(0.0, ate - 1.0))
            clipes.append((t["video"], de, ate))
            cortes[t["n"]] = {"corte": [de, ate], "no_reel": [round(inicio, 2), round(inicio + ate - de, 2)]}
            pals = [{**w, "ini": w["ini"] - de, "fim": w["fim"] - de} for w in pals]
            legenda += self.midia.alinhar(t["fala"], pals, ate - de, inicio)
            inicio += ate - de
        sem = self.midia.montar(clipes, os.path.join(p, "sem_legenda.mp4"))
        if r.get("legenda"):
            cta = r["cta"]["palavra"] if r["cta"]["tipo"] == "palavra" else ""
            self.midia.queimar_estilo(sem, legenda, os.path.join(p, "final.mp4"), r["legenda"], cta)
        else:
            self.midia.queimar(sem, self.midia.legenda_ass(legenda), os.path.join(p, "final.mp4"))
        if r.get("legenda_post"):
            open(os.path.join(p, "legenda_post.txt"), "w", encoding="utf-8").write(r["legenda_post"] + "\n")
        dur = round(sum(c[2] - c[1] for c in clipes), 1)
        # ⭐ onde cada take entra no Reel: a timeline do editor de curadoria anda por aqui
        self._alterar_reel(rid, lambda x: (x.update(duracao=dur, montado=round(time.time(), 2)),
                                           [t.update(cortes[t["n"]]) for t in x["takes"] if t["n"] in cortes]))
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
        inicio_da_fala = staticmethod(_midia.inicio_da_fala)
        montar = staticmethod(_midia.montar)
        legenda_ass = staticmethod(_midia.legenda_ass)
        queimar = staticmethod(_midia.queimar)
        queimar_estilo = staticmethod(_midia.queimar_estilo)
        alinhar = staticmethod(_midia.alinhar)

        quadros = []

        @classmethod
        def quadro(cls, video, t, saida):
            cls.quadros.append(round(t, 2)); open(saida, "wb").write(b"0" * 50); return saida

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
        if pedido.startswith("You fix ONE take"):              # o corretor da curadoria
            return json.dumps({"fala": "Fala corrigida da Tomiko", "quadro": "A teapot.", "motivo": "troquei a palavra",
                               "movimento": "As she speaks, her right hand lifts the teapot. After the line, she sets it back.",
                               "refazer_quadro": "QUADRO" in pedido})
        n = len(re.findall(r"^\d+\. \(", pedido, flags=re.M))
        quadro = "Target language: American English." in pedido          # ⭐ o Reel em ingles traz os itens do quadro
        return json.dumps({"takes": [{"n": i, "fala": f"Fala {i} da Tomiko", "movimento": "She smiles at the camera.",
                                      **({"quadro": f"A blender with soaked rice, step {i}."} if quadro else {})}
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

    def _img(w, h, fmt):
        from PIL import Image
        import io
        b = io.BytesIO(); Image.new("RGB", (w, h), "green").save(b, fmt)
        return base64.b64encode(b.getvalue()).decode()
    v0 = next(c["v"] for c in ig._info_avatar(ig._avatar(aid))["cenas"] if c["id"] == "horta")
    ig.cena(aid, "horta", "recusar"); time.sleep(1.1)
    e = ig.enviar_cena(aid, "horta", "data:image/jpeg;base64," + _img(720, 1280, "JPEG"), "jpg")
    h = next(c for c in e["cenas"] if c["id"] == "horta")
    caso("⭐ imagem enviada a mao: vira o PNG do comodo e fica para aprovar", h["estado"] == "pronta" and h["tem"]
         and h["v"] > v0 and "aviso" not in e)
    from PIL import Image
    caso("enviada em JPG, gravada em PNG", Image.open(ig.arquivo_avatar(aid, "cena-horta")).format == "PNG")
    caso("⛔ imagem deitada avisa do corte", "9:16" in ig.enviar_cena(aid, "sala", _img(1280, 720, "PNG"), "png").get("aviso", ""))
    for nome, args, erro in (("⛔ envio para comodo inexistente", ("nao-existe", _img(9, 16, "PNG"), "png"), KeyError),
                             ("⛔ arquivo que nao e' imagem", ("horta", base64.b64encode(b"lixo").decode(), "png"), ValueError),
                             ("⛔ extensao estranha no envio", ("horta", _img(9, 16, "PNG"), "gif"), ValueError)):
        try:
            ig.enviar_cena(aid, *args); caso(nome, False)
        except erro:
            caso(nome, True)
    for c in ("cozinha", "varanda"): ig.cena(aid, c, "aprovar")
    ig.enviar_imagem(aid, "livro", png, "jpg")
    n0 = len(g.imagens)
    r1 = ig.criar_reel(aid, "pt", url="https://www.instagram.com/reel/abc/", cta="palavra", palavra="Umeboshi", livro=True)
    caso("⛔ link de fora recusado", _erro(lambda: ig.criar_reel(aid, "pt", url="https://evil.com/x")))
    caso("⛔ CTA de mais de 3 palavras recusado", _erro(lambda: ig.criar_reel(aid, "pt", url="https://www.instagram.com/reel/x/",
                                                                              cta="palavra", palavra="eu quero muito isso")))
    caso("⛔ estilo de legenda desconhecido", _erro(lambda: ig.criar_reel(aid, "pt", url="https://www.instagram.com/reel/x/",
                                                                           legenda=99)))
    ig.esperar(120)
    r1 = ig.reel(r1["id"])
    est = {e["id"]: e["estado"] for e in r1["etapas"]}
    caso("⭐ as 4 etapas rodam sozinhas", all(v == "pronta" for v in est.values()) and r1["final"])
    caso("fonte: baixou o link e cortou em takes", Midia.baixados == ["https://www.instagram.com/reel/abc/"]
         and len(r1["takes_origem"]) >= 2 and r1["idioma_origem"] == "en")
    caso("roteiro: pediu em portugues com a palavra do CTA", "Brazilian Portuguese" in pedidos[0] and '"umeboshi,"' in pedidos[0])
    caso("roteiro: um take a mais para o CTA", len(r1["takes"]) == len(r1["takes_origem"]) + 1 and r1["takes"][-1]["cta"])
    vs = g.videos
    caso("⭐ o comodo do Reel entra como texto, nunca como referencia do quadro",
         all("dark wood cabinets" in i[0] and not any(x.endswith(".png") and "cenas" in x for x in i[1])
             for i in g.imagens[n0:] if "SECOND reference image for the object" not in i[0])
         and [os.path.basename(v["inicio"]) for v in vs] == [f"quadro_{i:02d}.png" for i in range(1, len(vs) + 1)])
    caso("⭐ o CTA termina no quadro do livro", vs[-1]["fim"].endswith("cta.png") and vs[0]["fim"] == vs[0]["inicio"])
    caso("o quadro do livro parte do quadro do take do CTA, com a capa", g.imagens[-1][1][0] == vs[-1]["inicio"]
         and g.imagens[-1][1][1].endswith("livro.jpg") and "SECOND reference" in g.imagens[-1][0])
    caso("⭐ o take do livro pede a mudanca durante a fala", "in step with the speech" in vs[-1]["prompt"]
         and "in step with the speech" not in vs[0]["prompt"])
    caso("modelo gratis por padrao", all(v["modelo"] == "gratis" for v in vs))
    caso("prompt do take: camera travada e a fala do roteiro", vs[0]["prompt"].startswith(_rot.CAMERA) and '"Fala 1 da Tomiko"' in vs[0]["prompt"])
    ass = open(os.path.join(ig._pasta_reel(r1["id"]), "legenda.ass"), encoding="utf-8").read()
    caso("⭐ a legenda queimada usa a fala do roteiro", "Fala 1 da" in ass and "Olá" not in ass)
    caso("legenda do post gravada", open(os.path.join(ig._pasta_reel(r1["id"]), "legenda_post.txt"), encoding="utf-8").read().startswith("Chá"))

    # ── editor de curadoria ──
    rid1 = r1["id"]
    ed = ig.editor(rid1)
    t1 = ed["takes"][0]
    caso("⭐ editor: cada take ja' tem a v1, com miniatura, e onde entra no Reel",
         [len(t["versoes"]) for t in ed["takes"]] == [1] * len(ed["takes"]) and t1["versoes"][0]["mini"] == "mini_01_v1"
         and t1["no_reel"][0] == 0 and ed["takes"][1]["no_reel"][0] == t1["no_reel"][1] and ed["reel"]["montado"])
    caso("editor: as etiquetas de defeito vem do motor", any(e["id"] == "pronuncia" for e in ed["etiquetas"]))
    caso("arquivos do editor: versao, miniatura e quadro", ig.arquivo_reel(rid1, "take_01_v1").endswith("take_01_v1.mp4")
         and ig.arquivo_reel(rid1, "mini_01_v1").endswith(".jpg") and ig.arquivo_reel(rid1, "quadro_01").endswith(".png"))
    caso("⛔ arquivo do editor fora do padrao", _erro(lambda: ig.arquivo_reel(rid1, "take_01_v1/../../x"), KeyError))
    caso("⛔ refazer sem defeito nem edicao", _erro(lambda: ig.refazer_takes(rid1, [{"n": 2}])))
    ig.anotar_take(rid1, 1, "  ela fala errado  ", ["pronuncia", "inventada"])
    cur = ig.editor(rid1)["takes"][0]["cur"]
    caso("anotar: o rascunho do defeito fica salvo", cur["estado"] == "defeito" and cur["defeito"] == "ela fala errado"
         and cur["etiquetas"] == ["pronuncia"])
    n_ped, n_vid = len(pedidos), len(g.videos)
    ig.refazer_takes(rid1, [{"n": 1}])
    caso("⛔ o mesmo take nao vai duas vezes", _erro(lambda: ig.refazer_takes(rid1, [{"n": 1}])))
    ig.esperar(120)
    ed = ig.editor(rid1)
    t1 = ed["takes"][0]
    novos = g.videos[n_vid:]
    caso("⭐ refazer: o corretor recebe o defeito e o que foi ouvido", len(pedidos) == n_ped + 1
         and '"ela fala errado"' in pedidos[-1] and "Pronúncia" in pedidos[-1] and "Olá, gente" in pedidos[-1])
    caso("⭐ refazer: 2 versoes novas, com a fala corrigida, sem tocar na ativa", [v["nome"] for v in novos] == ["take_01_v2", "take_01_v3"]
         and all('"Fala corrigida da Tomiko"' in v["prompt"] for v in novos) and t1["v"] == 1
         and [v["origem"] for v in t1["versoes"]] == ["roteiro", "correcao", "correcao"]
         and t1["versoes"][2]["nota"] == "troquei a palavra" and t1["cur"]["estado"] == "escolher")
    caso("refazer: o Reel pronto continua la' ate' a escolha", ig.reel(rid1)["final"])
    ig.escolher_versao(rid1, 1, 3)
    ig.esperar(120)
    r1 = ig.reel(rid1)
    t1 = next(t for t in r1["takes"] if t["n"] == 1)
    caso("⭐ escolher: a versao entra com a fala dela e a montagem roda sozinha", t1["v"] == 3 and t1["fala"] == "Fala corrigida da Tomiko"
         and t1["video"].endswith("take_01_v3.mp4") and r1["final"]
         and "Fala corrigida" in open(os.path.join(ig._pasta_reel(rid1), "legenda.ass"), encoding="utf-8").read())
    oc = [e for e in _cur.ocorrencias(base) if e.get("reel") == rid1]
    caso("⭐ ocorrencia: defeito, correcao, versoes e escolha, com o mesmo id", [e["tipo"] for e in oc] == ["defeito", "correcao", "versoes", "escolha"]
         and len({e["id"] for e in oc}) == 1 and oc[0]["fala"] == "Fala 1 da Tomiko" and "Interpolate" not in oc[0]["prompt"]
         and oc[2]["versoes"] == [2, 3] and oc[3]["resolveu"] is True and oc[1]["ouvido"] == "Olá, gente")
    n_ped = len(pedidos)
    ig.refazer_takes(rid1, [{"n": 2, "fala": "Uma fala nova escrita à mão", "movimento": ""}])
    ig.esperar(120)
    t2 = ig.editor(rid1)["takes"][1]
    caso("⭐ editado a mao: vai como esta', sem passar pelo corretor", len(pedidos) == n_ped and t2["cur"]["estado"] == "escolher"
         and all(v["fala"] == "Uma fala nova escrita à mão" for v in t2["versoes"][1:]) and t2["versoes"][1]["nota"] == "editado à mão")
    ig.aceitar_take(rid1, 2)
    caso("aceitar com versoes novas: fica a ativa e a ocorrencia diz que nao resolveu",
         ig.editor(rid1)["takes"][1]["v"] == 1 and _cur.ocorrencias(base)[-1] == {**_cur.ocorrencias(base)[-1], "tipo": "escolha", "resolveu": False})
    n_img = len(g.imagens)
    ig.anotar_take(rid1, 2, "o QUADRO de abertura esta ruim", ["quadro"])
    ig.refazer_takes(rid1, [{"n": 2}])
    ig.esperar(120)
    t2 = ig.editor(rid1)["takes"][1]
    caso("⭐ quadro ruim: o corretor pede quadro novo e so' as versoes novas abrem nele", len(g.imagens) == n_img + 1
         and "A teapot." in g.imagens[-1][0] and [v["quadro_arquivo"] for v in t2["versoes"]]
         == ["quadro_02"] * 3 + ["quadro_02_q2"] * 2)
    n_ped = len(pedidos)
    ig.anotar_take(rid1, 1, "três mãos", ["maos"])
    ig.refazer_takes(rid1, [{"n": 1, "movimento": "ela esta com tres maos"}])
    ig.esperar(120)
    caso("⭐ defeito + edicao a mao: passa pelo corretor, com a edicao so' como intencao", len(pedidos) == n_ped + 1
         and 'by hand: "ela esta com tres maos"' in pedidos[-1]
         and all(v["movimento"] != "ela esta com tres maos" for v in ig.editor(rid1)["takes"][0]["versoes"]))
    n_vid = len(g.videos)
    r2 = ig.criar_reel(aid, "en", url="https://www.instagram.com/reel/def/", legenda=2)
    caso("⭐ o video seguinte vai para o outro comodo", r2["cena"] == "varanda")
    n_img = len(g.imagens)
    ig.esperar(120)
    vs2 = g.videos[n_vid:]
    caso("⭐ cada take abre no seu quadro", [os.path.basename(v["inicio"]) for v in vs2]
         == [f"quadro_{i:02d}.png" for i in range(1, len(vs2) + 1)] and all(v["fim"] == v["inicio"] for v in vs2))
    caso("⭐ o quadro copia o enquadramento do video de origem, com a foto e o comodo em texto", len(g.imagens) == n_img + len(vs2)
         and [os.path.basename(x) for x in g.imagens[n_img][1]][0] == "origem_01.jpg"
         and len(g.imagens[n_img][1]) == 2 and os.path.basename(g.imagens[n_img][1][1]).startswith("foto.")
         and "bamboo bench" in g.imagens[n_img][0]
         and "same camera angle" in g.imagens[n_img][0] and "step 1." in g.imagens[n_img][0])
    caso("o take do CTA usa o ultimo trecho da origem", Midia.quadros[len(vs2) - 1] == Midia.quadros[len(vs2) - 2])
    caso("⭐ legenda estilo 2: cartoes por cima, sem .ass", ig.reel(r2["id"])["final"]
         and os.path.isdir(os.path.join(ig._pasta_reel(r2["id"]), "cartoes"))
         and not os.path.isfile(os.path.join(ig._pasta_reel(r2["id"]), "legenda.ass")))
    n_antes = len(g.videos)
    ig.editar_take(r2["id"], 1, fala="Uma fala nova — com travessão")
    r2 = ig.reel(r2["id"])
    caso("editar um take tira o video dele e o final", not r2["takes"][0]["video"] and not r2["final"]
         and "—" not in r2["takes"][0]["fala"])
    ig.rodar(r2["id"], "gerar"); ig.esperar(120)
    caso("⭐ refazer a geracao gera so' o take editado", len(g.videos) == n_antes + 1 and ig.reel(r2["id"])["final"])
    caso("refazer a geracao reaproveita os quadros", len(g.imagens) == n_img + len(vs2))
    g.falhar = {"take_02_v1"}
    r3 = ig.criar_reel(aid, "pt", url="https://www.instagram.com/reel/ghi/", cta="palavra", palavra=" Eu  Quero ")
    caso("⭐ CTA de frase curta guardado em minusculas", r3["cta"]["palavra"] == "eu quero")
    ig.esperar(120)
    r3 = ig.reel(r3["id"])
    caso("roteiro: o CTA de frase vai inteiro no pedido", '"eu quero,"' in pedidos[-1])
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
    caso("tudo() para o painel", len(ig.tudo()["reels"]) == 3 and ig.tudo()["gerador"]["ok"]
         and ig.tudo()["producao"] == {"agora": None, "fila": 0})
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
