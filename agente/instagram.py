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
    curadoria a pessoa SO' aponta o defeito: alguns segundos depois o take vai sozinho para o corretor (Claude) e o
              Veo gera 4 versoes, cada uma com o QA, e o take fica "escolha a versao": a pessoa assiste, usa a
              melhor (o QA so' sugere) e a montagem roda de novo.
    qa        cada versao nova (da geracao e da curadoria) passa pelo QA automatico (motor/instagram_qa.py): o whisper
              contra o roteiro, o tempo da fala, a camera e a deriva do quadro; as flags aparecem com ⚠ no editor
    licoes    os casos da curadoria viram licoes propostas pelo Claude (motor/instagram_licoes.py); aprovadas no
              painel Licoes, as de palavra viram um lint da fala e as de gesto/prompt entram nas regras e no prompt
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
import instagram_licoes as _lic                                             # noqa: E402
import instagram_midia as _midia                                            # noqa: E402
import instagram_qa as _qa                                                  # noqa: E402
import instagram_repo as _repo                                              # noqa: E402
import instagram_roteiro as _rot                                            # noqa: E402

PASTA = os.path.join(config.DATA, "instagram")
ETAPAS = ("fonte", "roteiro", "gerar", "montagem")
NOMES = {"fonte": "Fonte", "roteiro": "Roteiro", "gerar": "Geração", "montagem": "Montagem", "curadoria": "Curadoria",
         "retrato": "Retrato",
         "qa": "QA dos takes", "destilar": "Lições"}
AJUSTES_PADRAO = {"backend": "", "repo_dir": "", "auto_subir": False, "dias": 5, "cookies": ""}
EXT_IMAGEM = {"png", "jpg", "jpeg", "webp"}
MAX_VIDEO_MB = 200
COPIAS_REFAZER = 4           # ⭐ (20/10) versoes de cada take refeito: a pessoa assiste e escolhe a melhor
ESPERA_REFAZER = 6.0         # ⭐ s entre salvar um defeito e mandar refazer: apontar varios takes seguidos vira um job so'
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
        self._trabalhando = None              # ("reel", rid, etapa) | ("cena", aid, cid) | ("repo", "", "") | ("qa", rid, "qa")
        self._pals = {}                       # (video, mtime, lingua) -> palavras do whisper (QA e montagem usam as mesmas)
        self._timers = {}                     # rid -> o Timer do refazer agendado (anotar_take)
        self.espera_refazer = ESPERA_REFAZER
        self.copias_refazer = COPIAS_REFAZER
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

    def _claude(self, pedido, timeout=600, pastas=()):
        if self._chamar: return self._chamar(pedido, timeout=timeout)
        import persona as _persona
        return _persona.chamar_claude(pedido, timeout=timeout, pastas=pastas)

    def _quadros_origem(self, r, ns=None):
        """{n: (origem_NN.jpg, origem_fim_NN.jpg)}: o inicio (15%) e o fim (90%) de cada trecho do video de origem,
        os mesmos que os quadros do take usam. Sem a fonte, {}."""
        p, origem = self._pasta_reel(r["id"]), r.get("takes_origem") or []
        fonte = os.path.join(p, "fonte.mp4")
        if not (origem and os.path.isfile(fonte)): return {}
        saida = {}
        for o in origem:
            n = o["n"]
            if ns is not None and n not in ns: continue
            ini, fim = os.path.join(p, f"origem_{n:02d}.jpg"), os.path.join(p, f"origem_fim_{n:02d}.jpg")
            try:
                if not os.path.isfile(ini): self.midia.quadro(fonte, o["ini"] + 0.15 * (o["fim"] - o["ini"]), ini)
                if not os.path.isfile(fim): self.midia.quadro(fonte, o["fim"] - 0.1 * (o["fim"] - o["ini"]), fim)
            except Exception:                                              # noqa: BLE001
                continue
            if os.path.isfile(ini) and os.path.isfile(fim): saida[n] = (ini, fim)
        return saida

    def _gerador(self):
        return self._backend_fixo or _backend.carregar(self.ajustes()["backend"])

    def _palavras(self, video, lingua):
        """O whisper de um take, uma vez so' por arquivo: o QA, o corretor e a montagem leem o mesmo video."""
        chave = (video, os.path.getmtime(video), lingua)
        if chave not in self._pals:
            if len(self._pals) > 200: self._pals.clear()
            self._pals[chave] = self.midia.palavras(video, lingua)[0]
        return self._pals[chave]

    def _licoes(self):
        return _lic.carregar(self.base)["licoes"]

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
        base = _rot.PERSONAS.get(a.get("persona", ""), {})
        return {**{k: v for k, v in a.items() if k != "usos"}, "cenas": cenas,
                "idioma": a.get("idioma") or base.get("idioma", "pt"), "cta": a.get("cta") or base.get("cta", ""),
                "foto": bool(self._achar(p, "foto")), "livro": bool(self._achar(p, "livro")),
                "gerando_retrato": self._na_fila(("retrato", a["id"], ""))}

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
                "trabalhando": trab[2] if trab and trab[0] in ("reel", "curadoria", "qa") and trab[1] == r["id"] else "",
                "na_fila": [e for (t, i, e) in list(self._fila.queue) if t in ("reel", "curadoria", "qa") and i == r["id"]],
                "final": os.path.isfile(os.path.join(self._pasta_reel(r["id"]), "final.mp4"))}

    def tudo(self):
        avs = []
        for aid in sorted(os.listdir(os.path.join(self.base, "avatares"))):
            a = self._ler(os.path.join(self.base, "avatares", aid, "avatar.json"))
            if a and not a.get("arquivado"): avs.append(self._info_avatar(a))
        reels = []
        for rid in os.listdir(os.path.join(self.base, "reels")):
            r = self._ler(os.path.join(self.base, "reels", rid, "reel.json"))
            if r: reels.append(self._resumo(r))
        reels.sort(key=lambda r: -r["criado"])
        aj = self.ajustes()
        return {"avatares": avs, "reels": reels, "ajustes": aj,
                "idiomas": {k: v["nome"] for k, v in _rot.IDIOMAS.items()}, "legendas": _midia.estilos_legenda(),
                "personas": {k: {"nome": v["nome"], "idioma": v["idioma"], "cta": v["cta"]} for k, v in _rot.PERSONAS.items()},
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
                            (r"origem_\d{2}", "jpg"), (r"quadro_fim_\d{2}(_q\d+)?", "png"), (r"origem_fim_\d{2}", "jpg"), (r"cta(_quadro_\d{2}_q\d+)?", "png")):
            if re.fullmatch(padrao, qual): arq = os.path.join(p, f"{qual}.{ext}")
        if not arq or not os.path.isfile(arq): raise KeyError(qual)
        return arq

    # ── avatares e universo-lar ──
    def criar_avatar(self, nome, imagem, ext, descricao="", prefixo="", voz="", quem="", tomiko=False, persona="",
                     idioma=""):
        """Um avatar novo. `persona` = uma ficha pronta (motor/instagram_roteiro.py: PERSONAS): descricao, voz,
        idioma, CTA e os 8 comodos ja' preenchidos. ⭐ Com ficha e sem foto, o retrato-ancora e' gerado no Flow e os
        8 comodos sao gerados em seguida, sozinhos."""
        persona = persona or ("tomiko" if tomiko else "")
        if persona and persona not in _rot.PERSONAS: raise ValueError("ficha de avatar desconhecida")
        base = _rot.PERSONAS.get(persona, {})
        nome = (nome or base.get("nome", "")).strip()
        if not nome: raise ValueError("dê um nome ao avatar")
        ext = (ext or "").lower().lstrip(".")
        if imagem and ext not in EXT_IMAGEM: raise ValueError("a foto do avatar tem de ser PNG, JPG ou WEBP")
        if not imagem and not base: raise ValueError("suba a foto do avatar ou escolha uma ficha pronta")
        idioma = idioma or base.get("idioma", "pt")
        if idioma not in _rot.IDIOMAS: raise ValueError("idioma desconhecido")
        aid = f"{_slug(nome)}-{secrets.token_hex(2)}"
        p = self._pasta_av(aid)
        os.makedirs(os.path.join(p, "cenas"), exist_ok=True)
        if imagem: open(os.path.join(p, f"foto.{ext}"), "wb").write(_bytes_de(imagem))
        a = {"id": aid, "nome": nome, "criado": time.time(), "persona": persona, "idioma": idioma,
             "cta": base.get("cta", ""), "genero": base.get("genero", "f"),
             "descricao": (descricao or base.get("descricao", "")).strip(),
             "prefixo": (prefixo or base.get("prefixo", "")).strip(),
             "voz": (voz or base.get("voz", "")).strip(), "quem": (quem or base.get("quem", "")).strip(),
             "cenas": [{"id": c[0], "nome": c[1], "cena": c[2], "estado": "pendente"} for c in base.get("cenas", [])],
             "usos": {}}
        if not a["prefixo"]: a["prefixo"] = "The same person from the frame, same face, hands, clothes and setting."
        if not a["voz"]: a["voz"] = "a natural, warm voice in {lingua}, spoken by the person in frame"
        with self._t: self._gravar(os.path.join(p, "avatar.json"), a)
        self._log(f"instagram: avatar {a['nome']} criado")
        if not imagem: self._fila.put(("retrato", aid, ""))
        self._mudou(aid)
        return self._info_avatar(a)

    def editar_avatar(self, aid, campos):
        def f(a):
            for k in ("nome", "descricao", "prefixo", "voz", "quem", "cta", "mundo", "cta_fala"):
                if k in campos: a[k] = str(campos[k]).strip()
            if "persona" in campos:
                if campos["persona"] and campos["persona"] not in _rot.PERSONAS: raise ValueError("ficha de avatar desconhecida")
                a["persona"] = campos["persona"]
            if "idioma" in campos:
                if campos["idioma"] not in _rot.IDIOMAS: raise ValueError("idioma desconhecido")
                a["idioma"] = campos["idioma"]
            # ⭐ (19/10) arquivado: sai das sub-abas e do lote; a pasta, os comodos e os Reels ficam guardados
            if "arquivado" in campos: a["arquivado"] = bool(campos["arquivado"])
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
                   modelo="gratis", legenda=0, lote="", camera="fonte", ambiente=""):
        """⭐ (22/10, Eduardo) `camera`: "fonte" copia os movimentos de camera da fonte (leitura optica), "fixa" deixa a
        camera travada como antes. `ambiente`: o lugar de todos os takes (ex.: a mesa da varanda), no lugar do da fonte."""
        a = self._avatar(_valida(avatar))
        if idioma not in _rot.IDIOMAS: raise ValueError("idioma desconhecido")
        if camera not in ("fonte", "fixa"): raise ValueError("câmera desconhecida")
        ambiente = " ".join((ambiente or "").split())[:400]
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
             "publicado": "", "lote": lote, "camera": camera, "ambiente": ambiente}
        with self._t: self._gravar(os.path.join(p, "reel.json"), r)
        self._alterar_avatar(a["id"], lambda x: x.setdefault("usos", {}).setdefault(cid, []).append(time.time()))
        nome_cena = next(c["nome"] for c in a["cenas"] if c["id"] == cid)
        self._registrar(rid, f"Reel criado: {a['nome']}, {_rot.IDIOMAS[idioma]['nome']}, cômodo “{nome_cena}”")
        for e in ETAPAS: self._fila.put(("reel", rid, e))
        self._log(f"instagram: Reel {rid} na fila")
        self._mudou(rid)
        return self.reel(rid)

    def criar_lote(self, itens, url="", video="", ext="mp4", legenda=0, livro=False, modelo="gratis"):
        """⭐⭐ (19/10) UM video-fonte -> um Reel por avatar, cada um no idioma e com o CTA dele.
        itens = [{"avatar": id, "palavra": "livro"}] (sem palavra, vale o CTA da ficha do avatar).
        ⭐ A fonte e' baixada e transcrita uma vez so': os outros Reels do lote copiam (_etapa_fonte)."""
        if not itens: raise ValueError("escolha pelo menos um avatar para o lote")
        lote = f"{_dt.date.today().isoformat()}-{secrets.token_hex(3)}"
        reels = []
        for it in itens:
            a = self._avatar(_valida(it["avatar"]))
            info = self._info_avatar(a)
            palavra = (it.get("palavra") or info["cta"] or "").strip()
            reels.append(self.criar_reel(a["id"], info["idioma"], url=url, video=video, ext=ext,
                                         cta="palavra" if palavra else "bio", palavra=palavra,
                                         livro=bool(livro) and info["livro"], modelo=modelo, legenda=legenda, lote=lote))
        self._log(f"instagram: lote {lote} com {len(reels)} Reel(s) na fila")
        return {"lote": lote, "reels": [r["id"] for r in reels]}

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
        sem_qa = sum(1 for t in takes for v in t["versoes"] if v["existe"] and not v.get("qa"))
        return {"reel": self._resumo(r), "takes": takes, "etiquetas": [{"id": e, "nome": n} for e, n in _cur.ETIQUETAS],
                "ocupado": self._ocupado_reel(rid), "sem_qa": sem_qa,
                "checando": self._na_fila(("qa", rid, "qa"))}

    # ⭐ (18/10, Eduardo: "voce so' aponta o erro e o resto e' automatico") salvar o defeito agenda o refazer; a espera
    #    junta os takes apontados em sequencia num job so' da curadoria
    def anotar_take(self, rid, n, defeito="", etiquetas=()):
        """O defeito apontado num take. Com defeito, o take entra na fila do refazer depois de `espera_refazer` s
        (outro defeito salvo nesse meio tempo vai junto); sem defeito, volta a "sem revisao"."""
        etiquetas = [e for e in etiquetas if e in _cur.IDS_ETIQUETA]
        info = {}

        def f(r):
            cur = self._take(r, n).setdefault("cur", {"estado": ""})
            if cur.get("estado") in ("refazer", "refazendo"): raise ValueError(f"o take {n} já está sendo refeito")
            cur.update(defeito=(defeito or "").strip(), etiquetas=etiquetas)
            cur.pop("erro", None)
            if cur["defeito"] or etiquetas: cur["estado"] = "defeito"
            elif cur.get("estado") == "defeito": cur["estado"] = ""
            info["agendar"] = cur["estado"] == "defeito"
        self._alterar_reel(rid, f)
        if info["agendar"]: self._agendar_refazer(rid)
        self._mudou(rid)
        return {"ok": True, "refaz_em": self.espera_refazer if info["agendar"] else None}

    def _agendar_refazer(self, rid):
        with self._t:
            velho = self._timers.pop(rid, None)
            if velho: velho.cancel()
            tm = threading.Timer(self.espera_refazer, self._disparar_refazer, args=(rid,))
            tm.daemon = True
            self._timers[rid] = tm
            tm.start()

    def _disparar_refazer(self, rid):
        """Fim da espera: todo take com defeito salvo (e nao refeito ainda) vai para a curadoria, num job so'."""
        eu = threading.current_thread()
        try:
            if self._ocupado_reel(rid):                # ⛔ roteiro ou geracao rodando: tenta de novo depois
                self._agendar_refazer(rid); return
            ns = [t["n"] for t in self._reel(rid)["takes"] if (t.get("cur") or {}).get("estado") == "defeito"]
            if ns: self.refazer_takes(rid, [{"n": n} for n in ns])
        except Exception as e:                                             # noqa: BLE001
            self._log(f"⚠ instagram (curadoria): {str(e)[:200]}")
        finally:                                   # ⛔ so' sai da lista depois de enfileirar: esperar() nao ve um vao
            with self._t:
                if self._timers.get(rid) is eu: self._timers.pop(rid)

    def aceitar_take(self, rid, n):
        """O take como esta' fica. Se havia versoes novas para escolher, fica a ativa (e a ocorrencia registra isso)."""
        oc = {}

        def f(x):
            t = self._take(x, n)
            cur = t.setdefault("cur", {"estado": ""})
            if cur.get("estado") in ("refazer", "refazendo"): raise ValueError(f"o take {n} está sendo refeito")
            if cur.get("estado") in ("escolher", "precisa"): oc.update(id=cur.get("ocorrencia", ""), v=t.get("v"))
            cur.update(estado="aceito", defeito="", etiquetas=[])
            for k in ("motivo", "sugerida"): cur.pop(k, None)
        self._alterar_reel(rid, f)
        if oc.get("id"):
            _cur.registrar(self.base, {"tipo": "escolha", "id": oc["id"], "reel": rid, "take": int(n), "v": oc["v"],
                                       "resolveu": False})
        self._mudou(rid)
        return {"ok": True}

    def _remontar(self, rid):
        """⛔ (18/10) com _na_fila, a montagem RODANDO contava como na fila: escolher 4 versoes seguidas disparava uma
        montagem com a 1a e pulava as outras 3. So' a montagem ainda ESPERANDO na fila ja' pega a mudanca."""
        if ("reel", rid, "montagem") not in list(self._fila.queue): self._fila.put(("reel", rid, "montagem"))

    def _usar_versao(self, t, ver):
        t.update(video=ver["video"], v=ver["v"], fala=ver["fala"], movimento=ver["movimento"],
                 quadro=ver.get("quadro", t.get("quadro", "")), quadro_png=ver.get("quadro_png", ""),
                 quadro_fim=ver.get("quadro_fim", t.get("quadro_fim", "")))

    def escolher_versao(self, rid, n, v):
        """A versao `v` passa a ser a do Reel (a troca da escolha automatica, ou a escolha de um take que precisa de
        voce). ⭐ A fala vai junto (a legenda queimada e' a da versao) e a montagem roda de novo sozinha (so' ffmpeg)."""
        info = {}

        def f(r):
            t = self._take(r, n)
            ver = next((x for x in self._migrar(t) if x["v"] == int(v)), None)
            if not ver or not os.path.isfile(ver["video"]): raise KeyError(v)
            cur = t.setdefault("cur", {"estado": ""})
            if cur.get("estado") in ("refazer", "refazendo"): raise ValueError(f"o take {n} está sendo refeito")
            info.update(mudou=t.get("v") != ver["v"], origem=ver.get("origem", ""), troca=cur.get("estado") == "corrigido",
                        ocorrencia=cur.get("ocorrencia", "") if cur.get("estado") in ("escolher", "precisa", "corrigido") else "")
            self._usar_versao(t, ver)
            cur.update(estado="aceito", defeito="", etiquetas=[])
            for k in ("motivo", "auto", "sugerida"): cur.pop(k, None)
        self._alterar_reel(rid, f)
        if info["ocorrencia"] and info["mudou"]:
            _cur.registrar(self.base, {"tipo": "escolha", "id": info["ocorrencia"], "reel": rid, "take": int(n), "v": int(v),
                                       "resolveu": info["origem"] == "correcao", "troca": info["troca"]})
        if info["mudou"]:
            self._registrar(rid, f"curadoria: take {n} agora na versão {v}")
            self._remontar(rid)
        self._mudou(rid)
        return {"ok": True, "remontando": info["mudou"]}

    def refazer_takes(self, rid, itens):
        """Manda refazer takes no Veo: itens = [{"n", "fala"?, "movimento"?}]. Com o defeito apontado, o corretor
        (Claude) reescreve o take; com fala/movimento escritos a mao, eles vao como estao. Cada take sai em 4 versoes, para a pessoa escolher.
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
                cur.update(estado="refazer", ocorrencia=oc, manual=manual, correcao={}, tentativa=1)
                for k in ("motivo", "auto", "erro", "sugerida"): cur.pop(k, None)
                ns.append(t["n"])
        self._alterar_reel(rid, f)
        for ev in eventos: _cur.registrar(self.base, ev)
        if ("curadoria", rid, "curadoria") not in list(self._fila.queue): self._fila.put(("curadoria", rid, "curadoria"))
        self._registrar(rid, f"curadoria: take(s) {', '.join(map(str, ns))} para refazer")
        self._log(f"instagram: curadoria de {rid}, take(s) {', '.join(map(str, ns))} na fila")
        self._mudou(rid)
        return {"ok": True, "takes": ns}

    def _corrigir(self, r, a, t, base, lics, palavras):
        """A correcao de UM take: a edicao a mao (sem defeito apontado) vai como esta'; senao o corretor (Claude)
        reescreve. `base` = a versao de partida: a ativa ou, na nova tentativa, a melhor da rodada que reprovou."""
        cur = t["cur"]
        # ⭐ edicao a mao vai direto ao Veo SO' sem defeito apontado; com defeito, o corretor recebe a edicao como a
        #    intencao de quem revisa (o campo "movimento" chegou a receber a descricao do erro em portugues)
        if cur.get("manual") and not (cur.get("defeito") or cur.get("etiquetas")):
            return {"fala": cur["manual"].get("fala", t["fala"]), "movimento": cur["manual"].get("movimento", t["movimento"]),
                    "quadro": t.get("quadro", ""), "refazer_quadro": False, "motivo": "editado à mão"}
        lingua = _rot.IDIOMAS[r["idioma"]]["whisper"]
        ouvido = ""
        if base.get("video") and os.path.isfile(base["video"]):
            try:
                ouvido = " ".join(w["w"] for w in self._palavras(base["video"], lingua))
            except Exception:                                              # noqa: BLE001
                ouvido = ""
        alvo = {**t, **{k: base[k] for k in ("fala", "movimento", "quadro") if base.get(k)}}
        prompt = base.get("prompt") or _rot.prompt_video(a, r["idioma"], alvo["movimento"], alvo["fala"])
        quadros = self._quadros_origem(r, {t["n"]})
        pedido = _cur.pedido_correcao(a, r["idioma"], r["cta"], alvo, cur.get("defeito", ""), cur.get("etiquetas", []),
                                      ouvido, prompt, cur.get("manual"), _lic.regras_texto(lics, a["id"], r["idioma"]),
                                      quadros)
        self._log(f"instagram: o Claude está corrigindo o take {t['n']} de {r['id']}")
        corr = None
        for _ in range(2):                         # ⭐ uma segunda tentativa se vier fora do formato
            corr = _cur.ler_correcao(self._claude(pedido, pastas=(self._pasta_reel(r["id"]),) if quadros else ()))
            if corr: break
        if not corr: raise RuntimeError(f"a correção do take {t['n']} veio fora do formato")
        corr["ouvido"] = ouvido
        # ⭐ o lint das licoes de palavra vale tambem para o corretor (o Claude pode trazer a palavra de volta)
        corr["fala"], trocas = _lic.lint_fala(corr["fala"], palavras)
        if trocas:
            corr["lint"] = trocas
            corr["motivo"] += " (lição: " + ", ".join(f"{x['de']} → {x['para'] or 'sai'}" for x in trocas) + ")"
        return corr

    def _etapa_curadoria(self, rid):
        """Corrige e gera COPIAS_REFAZER (4) versoes de cada take apontado e o take fica "escolha a versao": a pessoa
        assiste e escolhe (escolher_versao), e so' entao a montagem roda. O QA de cada versao vai junto como sugestao
        (a melhor pelo QA fica marcada em cur.sugerida).
        ⭐ (20/10, Eduardo: "gerar 4x quando eu pedir refazimento de take errado e me retornar pra eu escolher") a
        escolha automatica pelo QA deixou passar acao errada (a cenoura cortada no comprimento): quem escolhe e' a pessoa."""
        r = self._reel(rid)
        a = self._avatar(r["avatar"])
        alvos = [t for t in r["takes"] if (t.get("cur") or {}).get("estado") == "refazer"]
        if not alvos: return
        lics = self._licoes()
        palavras = _lic.relevantes(lics, a["id"], r["idioma"], "palavra")
        prontos = []
        for t in alvos:
            base = next((v for v in self._migrar(t) if v["v"] == t.get("v")), {})
            corr = self._corrigir(r, a, t, base, lics, palavras)
            _cur.registrar(self.base, {"tipo": "correcao", "id": t["cur"].get("ocorrencia", ""), "reel": rid, "take": t["n"],
                                       "tentativa": 1, **corr})
            prontos.append({**t, "fala": corr["fala"], "movimento": corr["movimento"],
                            "quadro": corr["quadro"] or base.get("quadro") or t.get("quadro", ""),
                            "quadro_fim": corr.get("quadro_fim") or base.get("quadro_fim") or t.get("quadro_fim", ""),
                            "quadro_png": base.get("quadro_png") or t.get("quadro_png", ""),
                            "_novo_quadro": corr["refazer_quadro"], "_motivo": corr["motivo"]})
            self._alterar_reel(rid, lambda x, n=t["n"], c=corr: self._take(x, n)["cur"].update(estado="refazendo", correcao=c))
            self._mudou(rid)
        novas = self._gerar_takes(rid, prontos, copias=self.copias_refazer)
        motivos = {t["n"]: t["_motivo"] for t in prontos}
        fim = {}                                   # n -> (estado, versao sugerida, motivo)
        for t in prontos:
            n, vs = t["n"], novas.get(t["n"], [])
            _cur.registrar(self.base, {"tipo": "versoes", "id": t["cur"].get("ocorrencia", ""), "reel": rid, "take": n,
                                       "versoes": [v["v"] for v in vs]})
            ver, _, motivo = _qa.melhor(vs)
            fim[n] = ("escolher", ver, motivo) if ver else ("falhou", None, "o gerador não entregou versão nova")

        def aplicar(x):
            for t in x["takes"]:
                if t["n"] not in fim: continue
                self._migrar(t).extend({**ver, "origem": "correcao", "nota": motivos[t["n"]]} for ver in novas.get(t["n"], []))
                estado, ver, motivo = fim[t["n"]]
                cur = t["cur"]
                if estado == "escolher":
                    cur.update(estado="escolher", sugerida={"v": ver["v"], "motivo": motivo})
                else:
                    cur.update(estado="defeito", erro=motivo)
        self._alterar_reel(rid, aplicar)
        for n, (estado, ver, motivo) in sorted(fim.items()):
            if estado == "escolher":
                qtd = len(novas.get(n, []))
                self._registrar(rid, f"curadoria: take {n} com {qtd} versões novas para você escolher")
                self._avisar(f"Take {n}: {qtd} versões novas, escolha a melhor no editor.", "ok")
        # ⭐ casos novos o bastante: o Claude ja' propoe as licoes (elas so' valem depois de aprovadas no painel)
        novos = _lic.pendentes(_lic.carregar(self.base), _lic.casos(_cur.ocorrencias(self.base)))
        if len(novos) >= _lic.AUTO_DESTILAR and not self._na_fila(("licoes", "", "destilar")):
            self._fila.put(("licoes", "", "destilar"))
        falhou = [n for n, (e, _, _) in fim.items() if e == "falhou"]
        if falhou: raise RuntimeError(f"o gerador não entregou versão nova do(s) take(s) {', '.join(map(str, falhou))}")

    # ── QA automatico (motor/instagram_qa.py): a flag sugere, a pessoa confirma ou dispensa ──
    def qa_take(self, rid, n, v, etiqueta, acao):
        """acao: confirmar (a etiqueta entra no defeito do take, com o motivo) | dispensar (a flag some do editor).
        ⭐ As duas ficam registradas nas ocorrencias: e' o que recalibra os limites do QA."""
        if acao not in ("confirmar", "dispensar"): raise ValueError(f"ação desconhecida: {acao}")
        info = {}

        def f(r):
            t = self._take(r, n)
            ver = next((x for x in self._migrar(t) if x["v"] == int(v)), None)
            if not ver: raise KeyError(v)
            fl = next((x for x in (ver.get("qa") or {}).get("flags", []) if x["etiqueta"] == etiqueta), None)
            if not fl: raise KeyError(etiqueta)
            cur = t.setdefault("cur", {"estado": ""})
            if cur.get("estado") in ("refazer", "refazendo"): raise ValueError(f"o take {n} está sendo refeito")
            fl["estado"] = "confirmada" if acao == "confirmar" else "dispensada"
            info.update(motivo=fl["motivo"])
            if acao == "confirmar":
                if int(v) != t.get("v"): raise ValueError("confirme a flag da versão que está no Reel")
                if etiqueta not in cur.setdefault("etiquetas", []): cur["etiquetas"].append(etiqueta)
                texto = cur.get("defeito", "")
                if fl["motivo"] not in texto: cur["defeito"] = (f"{texto}; " if texto else "") + f"(QA) {fl['motivo']}"
                cur["estado"] = "defeito"
        self._alterar_reel(rid, f)
        if acao == "confirmar": self._agendar_refazer(rid)
        _cur.registrar(self.base, {"tipo": "qa_revisao", "reel": rid, "take": int(n), "v": int(v), "etiqueta": etiqueta,
                                   "acao": acao, "motivo": info["motivo"]})
        self._mudou(rid)
        return {"ok": True}

    def checar_reel(self, rid):
        """Manda o QA nas versoes que ainda nao passaram por ele (ex.: os Reels de antes do QA)."""
        self._reel(rid)
        if self._ocupado_reel(rid): raise ValueError("o Reel está no roteiro ou na geração agora: espere terminar")
        if not self._na_fila(("qa", rid, "qa")): self._fila.put(("qa", rid, "qa"))
        self._mudou(rid)
        return {"ok": True}

    def _qa_versao(self, r, t, ver):
        """O QA de uma versao: o whisper (do cache), o tempo da fala, a camera e a deriva no ponto de corte."""
        try:
            lingua = _rot.IDIOMAS[r["idioma"]]["whisper"]
            pals = self._palavras(ver["video"], lingua)
            dur = self.midia.duracao(ver["video"])
            try:
                fim_ref = ver.get("fim_png") if ver.get("fim_png") and ver.get("fim_png") != ver.get("quadro_png") else None
                visual = _qa.medir_video(ver["video"], dur, self.midia.fim_da_fala(pals, dur),
                                         fim_ref if fim_ref and os.path.isfile(fim_ref) else None)
            except Exception as e:                                         # noqa: BLE001
                visual, erro = None, str(e)[:120]
            else:
                erro = ""
            res = _qa.avaliar(ver.get("fala", t.get("fala", "")), pals, dur, visual,
                              camera_livre=bool(self._camera_take(r, t)))
            if erro: res["erro"] = f"sem a parte visual: {erro}"
        except Exception as e:                                             # noqa: BLE001
            res = {"flags": [], "medidas": {}, "erro": str(e)[:200] or e.__class__.__name__}
        res["t"] = round(time.time(), 2)
        return res

    def _registrar_qa(self, r, n, ver):
        _cur.registrar(self.base, {"tipo": "qa", "reel": r["id"], "take": n, "v": ver["v"], "avatar": r["avatar"],
                                   "idioma": r["idioma"], "flags": [{"etiqueta": f["etiqueta"], "motivo": f["motivo"]}
                                                                    for f in ver["qa"].get("flags", [])],
                                   "medidas": {k: x for k, x in ver["qa"].get("medidas", {}).items() if k != "ouvido"}})

    def _etapa_qa(self, rid):
        r = self._reel(rid)
        feitos = {}
        for t in r["takes"]:
            for ver in self._migrar(dict(t)):
                if ver.get("qa") or not os.path.isfile(ver["video"]): continue
                self._log(f"instagram: QA do take {t['n']} v{ver['v']} de {rid}")
                feitos[(t["n"], ver["v"])] = self._qa_versao(r, t, ver)

        def f(x):
            for t in x["takes"]:
                for ver in self._migrar(t):
                    if (t["n"], ver["v"]) in feitos: ver["qa"] = feitos[(t["n"], ver["v"])]
        r = self._alterar_reel(rid, f)
        for t in r["takes"]:
            for ver in t.get("versoes", []):
                if (t["n"], ver["v"]) in feitos: self._registrar_qa(r, t["n"], ver)
        n_flags = sum(len(_qa.abertas(q)) for q in feitos.values())
        self._registrar(rid, f"QA: {len(feitos)} versão(ões) checada(s), {n_flags} alerta(s)")

    # ── licoes (motor/instagram_licoes.py): o Claude propoe, a pessoa aprova ──
    def licoes(self):
        return {**_lic.painel(self.base), "destilando": self._na_fila(("licoes", "", "destilar"))}

    def destilar(self):
        if not _lic.pendentes(_lic.carregar(self.base), _lic.casos(_cur.ocorrencias(self.base))):
            raise ValueError("nenhum caso novo da curadoria para destilar")
        if not self._na_fila(("licoes", "", "destilar")): self._fila.put(("licoes", "", "destilar"))
        self._mudou("licoes")
        return {"ok": True}

    def licao(self, lid, acao, campos=None):
        """acao: aprovar | recusar | aposentar | reativar | editar (com `campos`)."""
        avatares = os.listdir(os.path.join(self.base, "avatares"))
        with self._t:
            dados = _lic.carregar(self.base)
            lic = _lic.editar(dados, lid, campos or {}, avatares) if acao == "editar" else _lic.mudar(dados, lid, acao)
            _lic.gravar(self.base, dados)
        verbo = {"aprovar": "aprovada", "reativar": "reativada", "recusar": "recusada", "aposentar": "aposentada",
                 "editar": "editada"}[acao]
        self._log(f"instagram: lição {verbo}: {lic['texto']}")
        self._mudou("licoes")
        return lic

    def _etapa_destilar(self):
        todos = _lic.casos(_cur.ocorrencias(self.base))
        dados = _lic.carregar(self.base)
        novos = _lic.pendentes(dados, todos)
        if not novos: return
        pedido = _lic.pedido_destilacao(novos, dados["licoes"])
        avatares = os.listdir(os.path.join(self.base, "avatares"))
        self._log(f"instagram: o Claude está destilando {len(novos)} caso(s) da curadoria em lições")
        lido = None
        for _ in range(2):                         # ⭐ uma segunda tentativa se vier fora do formato
            lido = _lic.ler_destilacao(self._claude(pedido), [c["id"] for c in novos],
                                       [l["id"] for l in dados["licoes"]], avatares)
            if lido is not None: break
        if lido is None: raise RuntimeError("a destilação das lições veio fora do formato")
        with self._t:                              # ⛔ relido agora: uma aprovacao feita durante a chamada nao se perde
            dados = _lic.carregar(self.base)
            criadas = _lic.aplicar(dados, lido, novos)
            _lic.gravar(self.base, dados)
        self._log(f"instagram: {len(criadas)} lição(ões) nova(s) para aprovar, {len(lido['reforcos'])} reforçada(s)")
        if criadas: self._avisar(f"{len(criadas)} lição(ões) nova(s) para aprovar no painel Lições.", "ok")
        self._mudou("licoes")

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
                elif tipo == "qa": self._etapa_qa(alvo)
                elif tipo == "licoes": self._etapa_destilar()
                elif tipo == "cena": self._etapa_cena(alvo, etapa)
                elif tipo == "retrato": self._etapa_retrato(alvo)
                elif tipo == "repo": self._etapa_repo()
            # ⛔ (19/10) o gerador do Flow sai com SystemExit quando a aba do projeto sumiu: sem pegar isso, o fio da aba
            #    morria calado e a fila ficava parada para sempre (o painel mostrava "Parado" com montagem na fila)
            except (Exception, SystemExit) as e:                           # noqa: BLE001
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
                if tipo == "qa":
                    try: self._registrar(alvo, f"⚠ QA: {msg}")
                    except Exception: pass                                 # noqa: BLE001
                if tipo == "curadoria":
                    try:
                        self._registrar(alvo, f"⚠ Curadoria: {msg}")
                        # ⭐ os takes voltam a "com defeito", com o texto apontado e o erro: salvar de novo refaz
                        self._alterar_reel(alvo, lambda x: [t["cur"].update(estado="defeito", erro=msg) for t in x["takes"]
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

    def _etapa_retrato(self, aid):
        """O retrato-ancora de um avatar criado de uma ficha, sem foto; em seguida os comodos pendentes."""
        a = self._avatar(aid)
        p = self._pasta_av(aid)
        if not self._achar(p, "foto"):
            destino = os.path.join(p, "foto.png")
            self._log(f"instagram: gerando o retrato de {a['nome']}")
            self._gerador().gerar_imagem(_rot.prompt_retrato(a), [], destino, self._log)
            if not os.path.isfile(destino): raise RuntimeError(f"o gerador não gravou o retrato de {a['nome']}")
            self._log(f"instagram: retrato de {a['nome']} pronto; os cômodos vão para a fila")
        if any(c["estado"] in ("pendente", "recusada") for c in a["cenas"]): self.gerar_pool(aid)

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

    def _irmao_com_fonte(self, r):
        """Um Reel do mesmo lote que ja' tem a fonte (e, se tiver, a transcricao)."""
        if not r.get("lote"): return None
        for rid in sorted(os.listdir(os.path.join(self.base, "reels"))):
            if rid == r["id"]: continue
            x = self._ler(os.path.join(self.base, "reels", rid, "reel.json"))
            if x and x.get("lote") == r["lote"] and os.path.isfile(os.path.join(self.base, "reels", rid, "fonte.mp4")):
                if x.get("takes_origem"): return x
        return None

    def _etapa_fonte(self, rid):
        r = self._reel(rid)
        p = self._pasta_reel(rid)
        fonte = os.path.join(p, "fonte.mp4")
        irmao = self._irmao_com_fonte(r)
        if irmao:
            # ⭐ mesmo video-fonte: copia o mp4 e a transcricao em vez de baixar e transcrever de novo
            if not os.path.isfile(fonte): shutil.copyfile(os.path.join(self._pasta_reel(irmao["id"]), "fonte.mp4"), fonte)
            self._alterar_reel(rid, lambda x: x.update(takes_origem=irmao["takes_origem"],
                                                       idioma_origem=irmao.get("idioma_origem", "en"), takes=[]))
            self._registrar(rid, f"fonte: a mesma do lote ({len(irmao['takes_origem'])} take(s))")
            return
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
        lics = self._licoes()
        p = self._pasta_reel(rid)
        for arq in os.listdir(p):                  # ⛔ quadro velho seria de outra fala: roteiro novo = quadros novos
            if arq == "final.mp4" or re.fullmatch(r"(quadro_(fim_)?\d{2}(_q\d+)?(_base)?\.png|origem_(fim_)?\d{2}\.jpg)", arq):
                os.remove(os.path.join(p, arq))
        quadros = self._quadros_origem(r)
        pedido = _rot.pedido_adaptacao(r["takes_origem"], r["idioma"], a, r["cta"], _lic.regras_texto(lics, a["id"], r["idioma"]),
                                       quadros)
        self._log(f"instagram: o Claude está adaptando {rid}")
        lido = None
        for _ in range(2):                         # ⭐ uma segunda tentativa se vier fora do formato
            lido = _rot.ler_adaptacao(self._claude(pedido, pastas=(p,) if quadros else ()), len(r["takes_origem"]))
            if lido: break
        if not lido: raise RuntimeError("a adaptação veio fora do formato")
        # ⭐ o lint das licoes de palavra aprovadas: deterministico, nao depende do Claude ter obedecido a regra
        palavras, trocas = _lic.relevantes(lics, a["id"], r["idioma"], "palavra"), []
        fixa = _rot.cta_fala(a, r["cta"])
        for t in lido["takes"]:
            t["video"] = ""
            if fixa and t["cta"]: t["fala"] = fixa
            t["fala"], tr = _lic.lint_fala(t["fala"], palavras)
            trocas += [f"take {t['n']}: {x['de']} → {x['para'] or 'sai'}" for x in tr]
        self._alterar_reel(rid, lambda x: x.update(takes=lido["takes"], legenda_post=lido["legenda_post"]))
        n_cta = sum(1 for t in lido["takes"] if t["cta"])
        self._registrar(rid, f"roteiro: {len(lido['takes'])} takes ({len(lido['takes']) - n_cta} + {n_cta} de CTA)")
        if trocas: self._registrar(rid, "lições no roteiro: " + "; ".join(trocas))

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

    def _camera_take(self, r, t):
        """O movimento de camera do take, em texto ("" = travada): o lido na fonte pela leitura optica, se o Reel copia
        a camera da fonte. O take do CTA (sem trecho na fonte) fica travado. ⭐ A leitura fica guardada no takes_origem."""
        if r.get("camera", "fixa") != "fonte": return ""
        origem = r.get("takes_origem") or []
        if not 1 <= t["n"] <= len(origem): return ""
        o = origem[t["n"] - 1]
        if "camera" not in o:
            fonte = os.path.join(self._pasta_reel(r["id"]), "fonte.mp4")
            try:
                cam = _qa.camera_da_fonte(fonte, o["ini"], o["fim"]) if os.path.isfile(fonte) else {"texto": ""}
            except Exception as e:                                         # noqa: BLE001
                cam = {"texto": "", "erro": str(e)[:120]}
            o["camera"] = cam
            self._alterar_reel(r["id"], lambda x, n=t["n"], c=cam: x["takes_origem"][n - 1].update(camera=c))
        return o["camera"].get("texto", "")

    def _lugar(self, r, a):
        """O lugar dos quadros: o ambiente do Reel (troca o da fonte) ou o mundo do avatar (o da fonte, restilizado)."""
        if r.get("ambiente"): return r["ambiente"], True
        return _rot.mundo(a, next((c["cena"] for c in a["cenas"] if c["id"] == r["cena"]), "")), False

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
            if not os.path.isfile(ref): self.midia.quadro(fonte, o["ini"] + 0.15 * (o["fim"] - o["ini"]), ref)
            lugar, novo_lugar = self._lugar(r, a)
            self._log(f"instagram: gerando o quadro do take {n} de {r['id']}")
            g.gerar_imagem(_rot.prompt_quadro(a, lugar, t.get("quadro", ""), novo_lugar), [ref, foto], arq, self._log)
            if not os.path.isfile(arq): raise RuntimeError(f"o gerador não gravou o quadro do take {n}")
            # ⭐⭐ (22/10) 2a passada: reenquadra pela fonte (o close continua close, o "de cima" continua de cima)
            base = arq[:-4] + "_base.png"
            os.replace(arq, base)
            self._log(f"instagram: reenquadrando o quadro do take {n} pela fonte")
            try:
                g.gerar_imagem(_rot.prompt_reenquadrar(a, t.get("quadro", "")), [ref, base], arq, self._log)
            except Exception as e:                                         # noqa: BLE001
                self._log(f"  ⚠ o reenquadramento do take {n} falhou ({str(e)[:80]}): fica o quadro da 1a passada")
            if not os.path.isfile(arq): shutil.copyfile(base, arq)
        return arq

    def _quadro_fim_take(self, r, a, t, inicio, g, novo=False):
        """⭐⭐ (19/10, ordem do Eduardo) o quadro FINAL do take: o fim do mesmo passo no video de origem, com a pessoa, o
        lugar e a luz do quadro de abertura. Com o mesmo quadro nas duas pontas o Veo nao completava a acao (a
        Tomiko so' erguia o sal e devolvia). Passo sem acao (so' fala) ou sem video de origem: o proprio inicio."""
        qi, qf = " ".join((t.get("quadro") or "").lower().split()), " ".join((t.get("quadro_fim") or "").lower().split())
        pa, p = self._pasta_av(a["id"]), self._pasta_reel(r["id"])
        foto, fonte, origem = self._achar(pa, "foto"), os.path.join(p, "fonte.mp4"), r.get("takes_origem") or []
        anda = bool(self._camera_take(r, t))
        if (not anda and (not qf or qf == qi)) or not (foto and origem and os.path.isfile(fonte)) or not inicio.startswith(p):
            return inicio
        n = t["n"]
        sufixo = os.path.splitext(os.path.basename(inicio))[0][len(f"quadro_{n:02d}"):]       # "" ou "_qK"
        arq = os.path.join(p, f"quadro_fim_{n:02d}{sufixo}.png")
        if novo or not os.path.isfile(arq):
            o = origem[min(n, len(origem)) - 1]
            ref = os.path.join(p, f"origem_fim_{n:02d}.jpg")
            if not os.path.isfile(ref):
                ini_t, fim_t = o["ini"] + 0.15 * (o["fim"] - o["ini"]), o["fim"] - 0.1 * (o["fim"] - o["ini"])
                try:                               # ⭐ o fim do MESMO plano do quadro de abertura (sem atravessar corte)
                    fim_t = _qa.fim_do_plano(fonte, ini_t, fim_t)
                except Exception:                                          # noqa: BLE001
                    pass
                self.midia.quadro(fonte, fim_t, ref)
            lugar, _novo = self._lugar(r, a)
            self._log(f"instagram: gerando o quadro final do take {n} de {r['id']}")
            g.gerar_imagem(_rot.prompt_quadro_fim(a, lugar, t.get("quadro_fim") or t.get("quadro", ""), self._camera_take(r, t)),
                           [ref, inicio, foto], arq, self._log)
            if not os.path.isfile(arq): raise RuntimeError(f"o gerador não gravou o quadro final do take {n}")
        return arq

    def _fim_take(self, r, a, t, inicio, g, novo=False):
        """O quadro final: o fim do passo (_quadro_fim_take); no CTA com livro, o avatar segurando o livro."""
        if not (t["cta"] and r["cta"]["livro"]): return self._quadro_fim_take(r, a, t, inicio, g, novo)
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
        lics = self._licoes()
        usados = {t["n"]: max([v["v"] for v in self._migrar(dict(t))] + [0]) for t in r["takes"]}
        pedidos, meta = [], {}
        for t in alvos:
            inicio = self._quadro_take(r, a, t, g, novo=t.get("_novo_quadro", False))
            fim = self._fim_take(r, a, t, inicio, g, novo=t.get("_novo_quadro", False))
            acao = _rot.tipo_acao(t["movimento"])
            # ⭐ as licoes de prompt deste tipo de acao entram no prompt do Veo; a versao guarda todas as que valeram
            #    (palavra, gesto e prompt), para o painel medir o antes e o depois de cada uma
            prompt = _rot.prompt_video(a, r["idioma"], t["movimento"], t["fala"], muda=fim != inicio,
                                       extras=_lic.frases_prompt(lics, a["id"], r["idioma"], acao),
                                       camera=self._camera_take(r, t))
            valeram = [l["id"] for l in _lic.relevantes(lics, a["id"], r["idioma"], acao=acao)
                       if l["tipo"] != "prompt" or l["regra"] in prompt]
            for i in range(copias):
                v = usados[t["n"]] + 1 + i
                nome = f"take_{t['n']:02d}_v{v}"
                pedidos.append({"nome": nome, "prompt": prompt, "inicio": inicio, "fim": fim})
                meta[nome] = {"n": t["n"], "v": v, "fala": t["fala"], "movimento": t["movimento"],
                              "quadro": t.get("quadro", ""), "quadro_fim": t.get("quadro_fim", ""), "quadro_png": inicio,
                              "fim_png": fim, "prompt": prompt, "licoes": valeram}
        self._log(f"instagram: {len(pedidos)} take(s) de {rid} no gerador ({r['modelo']})")
        feitos = g.gerar_videos(pedidos, p, r["modelo"], self._log) or {}
        novas = {}
        for nome, m in meta.items():
            arq = feitos.get(nome)
            if arq and os.path.isfile(arq):
                novas.setdefault(m["n"], []).append({**{k: x for k, x in m.items() if k != "n"}, "video": arq,
                                                     "criado": round(time.time(), 2)})
        if novas:
            _cur.registrar(self.base, {"tipo": "geracao", "reel": rid, "avatar": a["id"], "idioma": r["idioma"],
                                       "modelo": r["modelo"], "versoes": [{"take": n, "v": ver["v"], "licoes": ver["licoes"]}
                                                                          for n, vs in novas.items() for ver in vs]})
        # ⭐ o QA de cada versao nova, logo depois de gerada: as flags vao junto com a versao para o editor
        for n, vs in novas.items():
            t = next(x for x in r["takes"] if x["n"] == n)
            for ver in vs:
                self._log(f"instagram: QA do take {n} v{ver['v']} de {rid}")
                ver["qa"] = self._qa_versao(r, t, ver)
                self._registrar_qa(r, n, ver)
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
        # ⭐ cada take entra acelerado (midia.velocidade: 1,11x +-5%, fixo por take e versao); a legenda e a timeline
        #    andam no tempo do Reel, ja' acelerado
        clipes, legenda, inicio, cortes = [], [], 0.0, {}
        for t in r["takes"]:
            pals = self._palavras(t["video"], lingua)
            ate = self.midia.fim_da_fala(pals, self.midia.duracao(t["video"]))
            de = min(self.midia.inicio_da_fala(pals), max(0.0, ate - 1.0))
            vel = self.midia.velocidade(f"{rid}-{t['n']}-v{t.get('v', 1)}")
            dur_t = (ate - de) / vel
            clipes.append((t["video"], de, ate, vel))
            cortes[t["n"]] = {"corte": [de, ate], "velocidade": vel, "no_reel": [round(inicio, 2), round(inicio + dur_t, 2)]}
            pals = [{**w, "ini": (w["ini"] - de) / vel, "fim": (w["fim"] - de) / vel} for w in pals]
            legenda += self.midia.alinhar(t["fala"], pals, dur_t, inicio)
            inicio += dur_t
        sem = self.midia.montar(clipes, os.path.join(p, "sem_legenda.mp4"))
        if r.get("legenda"):
            cta = r["cta"]["palavra"] if r["cta"]["tipo"] == "palavra" else ""
            self.midia.queimar_estilo(sem, legenda, os.path.join(p, "final.mp4"), r["legenda"], cta)
        else:
            self.midia.queimar(sem, self.midia.legenda_ass(legenda), os.path.join(p, "final.mp4"))
        if r.get("legenda_post"):
            open(os.path.join(p, "legenda_post.txt"), "w", encoding="utf-8").write(r["legenda_post"] + "\n")
        dur = round(inicio, 1)
        # ⭐ onde cada take entra no Reel: a timeline do editor de curadoria anda por aqui
        self._alterar_reel(rid, lambda x: (x.update(duracao=dur, montado=round(time.time(), 2)),
                                           [t.update(cortes[t["n"]]) for t in x["takes"] if t["n"] in cortes]))
        self._registrar(rid, f"montagem: {dur} s, 1080x1920, legenda queimada")
        self._avisar(f"Reel pronto ({dur} s).", "ok")
        if self.ajustes()["auto_subir"] and self.ajustes()["repo_dir"]: self.subir(rid)

    def esperar(self, limite=60):
        fim = time.time() + limite
        while time.time() < fim:
            if self._fila.unfinished_tasks == 0 and not self._timers: return True
            time.sleep(0.05)
        return False

    def encerrar(self):
        self._vivo = False
        for tm in list(self._timers.values()): tm.cancel()


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
                m = re.search(r': "(.*)" \(no subtitles\)', pd["prompt"])
                Midia.falas[pd["nome"]] = m.group(1) if m else ""
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
        velocidade = staticmethod(_midia.velocidade)
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

        falas = {}                 # nome do video -> a fala do prompt (o gerador de teste preenche)
        errar = set()              # prefixos de nome ("take_03") em que o "whisper" ouve outra coisa

        @classmethod
        def palavras(cls, arq, idioma=None):
            if arq.endswith("fonte.mp4"):
                ws, t = [], 0.0
                for w in ("Did you know that ginger in the morning wakes up your stomach. My grandmother made "
                          "this tea every winter for the whole family.").split():
                    ws.append({"w": w, "ini": t, "fim": t + 0.35}); t += 0.4
                return ws, "en"
            nome = os.path.basename(arq)[:-4]
            fala = cls.falas.get(nome)
            if fala is None or any(nome.startswith(x) for x in cls.errar):
                return [{"w": "Olá,", "ini": 0.4, "fim": 0.9}, {"w": "gente", "ini": 0.9, "fim": 1.4}], idioma
            return [{"w": w, "ini": round(0.4 + i * 0.4, 2), "fim": round(0.75 + i * 0.4, 2)}
                    for i, w in enumerate(fala.split())], idioma

    pedidos = []

    def claude(pedido, timeout=0):
        pedidos.append(pedido)
        if pedido.startswith("You maintain the"):              # a destilacao das licoes
            ids = re.findall(r'^\{"id": "(\d{8}-[^"]+)"', pedido, flags=re.M)        # os casos, nao as licoes
            return json.dumps({"novas": [
                {"tipo": "palavra", "texto": "Evitar “Tomiko” na fala.", "palavra": "Tomiko", "trocar": "Tomi",
                 "regra": "the voice stumbles on it", "escopo": {"idioma": "pt"}, "etiquetas": ["pronuncia"], "evidencias": ids[:1]},
                {"tipo": "prompt", "texto": "Mãos com cinco dedos.", "regra": "Her hands keep five fingers.",
                 "escopo": {}, "etiquetas": ["maos"], "evidencias": ids[-1:]}]})
        if pedido.startswith("You fix ONE take"):              # o corretor da curadoria
            return json.dumps({"fala": "Fala corrigida da Tomiko", "quadro": "A teapot.", "motivo": "troquei a palavra",
                               "movimento": "As she speaks, her right hand lifts the teapot. After the line, she sets it back.",
                               "refazer_quadro": "QUADRO" in pedido})
        n = len(re.findall(r"^\d+\. \(", pedido, flags=re.M))
        quadro = "Target language: American English." in pedido          # ⭐ o Reel em ingles traz os itens do quadro
        return json.dumps({"takes": [{"n": i, "fala": f"Fala {i} da Tomiko", "movimento": "She smiles at the camera.",
                                      **({"quadro": f"A blender with soaked rice, step {i}.", "quadro_fim": f"Rice inside the blender, step {i}."}
                                         if quadro else {})}
                                     for i in range(1, n + 2)], "legenda_post": "Chá de gengibre 🍵"})

    eventos = []

    class N:
        def log(self, t): eventos.append(("log", t))
        def avisar(self, t, tom=""): eventos.append(("aviso", t, tom))
        def _emitir(self, tipo, **d): eventos.append((tipo, d))

    g = Gerador()
    ig = Instagram(N(), base=base, chamar=claude, midia=Midia, backend=g, iniciar_fios=False)
    ig.espera_refazer = 0.4
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
    Midia.errar = {"take_02_v1", "take_03_v1"}
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
    caso("⭐ o lugar vem do video-fonte, no mundo do avatar (texto); o comodo nunca e' referencia do quadro",
         all("garden bed stays a garden bed" in i[0] and "chácara" in i[0] and "dark wood cabinets" not in i[0]
             and not any(x.endswith(".png") and "cenas" in x for x in i[1])
             for i in g.imagens[n0:] if "SECOND reference image for the object" not in i[0]
             and "Reframe the SECOND image" not in i[0])
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

    # ── editor de curadoria (automatica: a pessoa so' aponta) ──
    rid1 = r1["id"]
    Midia.errar = set()
    ed = ig.editor(rid1)
    t1 = ed["takes"][0]
    caso("⭐ editor: cada take ja' tem a v1, com miniatura, e onde entra no Reel",
         [len(t["versoes"]) for t in ed["takes"]] == [1] * len(ed["takes"]) and t1["versoes"][0]["mini"] == "mini_01_v1"
         and t1["no_reel"][0] == 0 and ed["takes"][1]["no_reel"][0] == t1["no_reel"][1] and ed["reel"]["montado"])
    caso("⭐ montagem acelerada: cada take a 1,11x +-5%, e o lugar no Reel ja' no tempo acelerado",
         all(1.0545 <= t["velocidade"] <= 1.1655 for t in ed["takes"])
         and abs((t1["no_reel"][1] - t1["no_reel"][0]) - (t1["corte"][1] - t1["corte"][0]) / t1["velocidade"]) < 0.02
         and abs(ed["reel"]["duracao"] - _midia.duracao(ig.arquivo_reel(rid1, "final"))) < 0.3)
    caso("editor: as etiquetas de defeito vem do motor", any(e["id"] == "pronuncia" for e in ed["etiquetas"]))
    q1, q2 = t1["versoes"][0].get("qa") or {}, ed["takes"][1]["versoes"][0].get("qa") or {}
    caso("⭐ QA: cada versao gerada ja' vem checada; fala ouvida certa = sem flag", ed["sem_qa"] == 0 and q1["flags"] == []
         and q1["medidas"]["ouvido"] == "Fala 1 da Tomiko" and q1["medidas"]["camera_pct"] < 1)
    caso("⭐ QA: o whisper ouviu outra fala = flag com o motivo", [f["etiqueta"] for f in q2["flags"]] == ["fala"]
         and "faltou" in q2["flags"][0]["motivo"] and q2["flags"][0]["grave"])
    evq = [e for e in _cur.ocorrencias(base) if e.get("reel") == rid1]
    caso("⭐ QA e geracao vao para as ocorrencias", any(e["tipo"] == "geracao" and len(e["versoes"]) == len(ed["takes"]) for e in evq)
         and sum(1 for e in evq if e["tipo"] == "qa") == len(ed["takes"]))
    caso("arquivos do editor: versao, miniatura e quadro", ig.arquivo_reel(rid1, "take_01_v1").endswith("take_01_v1.mp4")
         and ig.arquivo_reel(rid1, "mini_01_v1").endswith(".jpg") and ig.arquivo_reel(rid1, "quadro_01").endswith(".png"))
    caso("⛔ arquivo do editor fora do padrao", _erro(lambda: ig.arquivo_reel(rid1, "take_01_v1/../../x"), KeyError))
    caso("⛔ refazer sem defeito nem edicao", _erro(lambda: ig.refazer_takes(rid1, [{"n": 2}])))

    # apontar e desfazer antes da espera: nada e' refeito
    n_vid = len(g.videos)
    caso("⭐ anotar agenda o refazer", ig.anotar_take(rid1, 1, "x", [])["refaz_em"] == ig.espera_refazer)
    ig.anotar_take(rid1, 1, "", [])
    ig.esperar(30)
    caso("⭐ defeito apagado antes da espera: nada vai para o Veo", len(g.videos) == n_vid
         and ig.editor(rid1)["takes"][0]["cur"]["estado"] == "")

    # a flag do QA confirmada vira defeito, e o take se corrige sozinho
    ig.qa_take(rid1, 3, 1, "fala", "dispensar")
    t3 = ig.editor(rid1)["takes"][2]
    caso("⭐ QA: dispensar tira a flag e nao agenda nada", t3["versoes"][0]["qa"]["flags"][0]["estado"] == "dispensada"
         and t3["cur"]["estado"] != "defeito" and not ig._timers)
    ig._alterar_reel(rid1, lambda x: x["takes"][0]["versoes"][0].pop("qa"))
    caso("Reel antigo: o editor conta as versoes sem QA", ig.editor(rid1)["sem_qa"] == 1)
    ig.checar_reel(rid1); ig.esperar(60)
    caso("⭐ checar: o QA roda nas versoes que faltavam", ig.editor(rid1)["sem_qa"] == 0
         and "QA: 1 versão" in ig.reel(rid1)["registro"][0]["texto"])
    n_ped, n_vid, n_aviso = len(pedidos), len(g.videos), len(eventos)
    ig.qa_take(rid1, 2, 1, "fala", "confirmar")
    t2 = ig.editor(rid1)["takes"][1]
    caso("⭐ QA: confirmar marca o defeito com o motivo", t2["cur"]["estado"] == "defeito" and t2["cur"]["etiquetas"] == ["fala"]
         and t2["cur"]["defeito"].startswith("(QA) faltou"))
    caso("⛔ QA: flag que nao existe / acao estranha", _erro(lambda: ig.qa_take(rid1, 2, 1, "camera", "dispensar"), KeyError)
         and _erro(lambda: ig.qa_take(rid1, 2, 1, "fala", "talvez")))
    ig.esperar(120)
    r1 = ig.reel(rid1)
    t2 = next(t for t in r1["takes"] if t["n"] == 2)
    novos = g.videos[n_vid:]
    caso("⭐ refazer: o corretor recebe o defeito e o que foi ouvido", len(pedidos) == n_ped + 1
         and "(QA) faltou" in pedidos[-1] and "Olá, gente" in pedidos[-1])
    caso("⭐ refazer: 4 versoes e o take fica para a pessoa escolher, com a sugestao do QA; o Reel nao muda",
         [v["nome"] for v in novos] == [f"take_02_v{i}" for i in (2, 3, 4, 5)] and t2["v"] == 1
         and t2["cur"]["estado"] == "escolher" and t2["cur"]["sugerida"]["v"] == 2
         and "fala conferida" in t2["cur"]["sugerida"]["motivo"])
    caso("⭐ refazer: o aviso pede a escolha", any(e[0] == "aviso" and e[1].startswith("Take 2: 4 versões novas")
                                                  for e in eventos[n_aviso:]))
    ig.escolher_versao(rid1, 2, 2)
    ig.esperar(120)
    r1 = ig.reel(rid1)
    t2 = next(t for t in r1["takes"] if t["n"] == 2)
    caso("⭐ escolher: a versao entra no Reel com a fala dela e a montagem roda de novo",
         t2["v"] == 2 and t2["fala"] == "Fala corrigida da Tomiko" and t2["cur"]["estado"] == "aceito"
         and "sugerida" not in t2["cur"] and r1["final"]
         and "corrigida" in open(os.path.join(ig._pasta_reel(rid1), "legenda.ass"), encoding="utf-8").read())
    oc = [e for e in _cur.ocorrencias(base) if e.get("reel") == rid1 and e["tipo"] in ("defeito", "correcao", "versoes", "escolha")]
    caso("⭐ ocorrencia: defeito, correcao, versoes e a escolha da pessoa, com o mesmo id",
         [e["tipo"] for e in oc] == ["defeito", "correcao", "versoes", "escolha"] and len({e["id"] for e in oc}) == 1
         and oc[0]["fala"] == "Fala 2 da Tomiko" and oc[2]["versoes"] == [2, 3, 4, 5] and oc[3]["v"] == 2
         and oc[3]["resolveu"] is True and oc[1]["ouvido"] == "Olá, gente")
    caso("QA: a revisao fica registrada", [e["acao"] for e in _cur.ocorrencias(base) if e["tipo"] == "qa_revisao"][-1] == "confirmar")

    # dois takes apontados em sequencia: um job so'; reprovadas no QA, as versoes ficam para escolher (sem nova tentativa)
    Midia.errar = {"take_03"}
    n_ped, n_vid, n_aviso = len(pedidos), len(g.videos), len(eventos)
    ig.anotar_take(rid1, 1, "  ela fala errado  ", ["pronuncia", "inventada"])
    cur = ig.editor(rid1)["takes"][0]["cur"]
    caso("anotar: o defeito fica salvo, limpo", cur["estado"] == "defeito" and cur["defeito"] == "ela fala errado"
         and cur["etiquetas"] == ["pronuncia"])
    ig.anotar_take(rid1, 3, "cortou a fala", ["fala"])
    ig.esperar(120)
    ed = ig.editor(rid1)
    t1, t3 = ed["takes"][0], ed["takes"][2]
    cor = [x for x in pedidos[n_ped:] if x.startswith("You fix ONE take")]
    caso("⭐ espera: os dois takes apontados em sequencia vao no mesmo job",
         any("take(s) 1, 3 para refazer" in x["texto"] for x in ig.reel(rid1)["registro"]))
    caso("⭐ take 1: 4 versoes para escolher", t1["cur"]["estado"] == "escolher" and t1["v"] == 1
         and [v["v"] for v in t1["versoes"]] == [1, 2, 3, 4, 5])
    caso("⭐ reprovadas no QA: sem nova tentativa, ficam para escolher com o motivo; a versao do Reel nao muda",
         len(cor) == 2 and t3["cur"]["estado"] == "escolher" and "faltou" in t3["cur"]["sugerida"]["motivo"]
         and t3["v"] == 1 and [v["v"] for v in t3["versoes"]] == [1, 2, 3, 4, 5]
         and not any(e.get("automatico") for e in _cur.ocorrencias(base)))
    Midia.errar = set()
    ig.escolher_versao(rid1, 3, 4)
    ig.escolher_versao(rid1, 1, 2)
    ig.esperar(120)
    caso("escolher uma versao resolve", ig.editor(rid1)["takes"][2]["cur"]["estado"] == "aceito"
         and ig.reel(rid1)["takes"][2]["v"] == 4 and ig.reel(rid1)["takes"][0]["v"] == 2)

    # ⛔ escolher durante a montagem: outra montagem roda depois, com a versao nova
    montar_antes, n_montar = Midia.montar, []

    def montar_lento(clipes, saida):
        n_montar.append(1); time.sleep(0.6); return _midia.montar(clipes, saida)
    Midia.montar = staticmethod(montar_lento)
    ig.rodar(rid1, "montagem")
    for _ in range(100):
        if ig._trabalhando == ("reel", rid1, "montagem"): break
        time.sleep(0.02)
    ig.escolher_versao(rid1, 1, 1)
    ig.esperar(120)
    Midia.montar = montar_antes
    caso("⭐ escolher com a montagem rodando: outra montagem vem depois e o final usa o take novo", len(n_montar) == 2
         and "Fala 1 da" in open(os.path.join(ig._pasta_reel(rid1), "legenda.ass"), encoding="utf-8").read())

    # editado a mao, sem defeito: vai como esta', e as versoes ficam para escolher
    n_ped = len(pedidos)
    ig.refazer_takes(rid1, [{"n": 2, "fala": "Uma fala nova escrita à mão", "movimento": ""}])
    ig.esperar(120)
    t2 = ig.editor(rid1)["takes"][1]
    caso("⭐ editado a mao: sem o corretor, as versoes novas sao a edicao", len(pedidos) == n_ped
         and t2["cur"]["estado"] == "escolher" and t2["versoes"][-1]["fala"] == "Uma fala nova escrita à mão"
         and t2["versoes"][-1]["nota"] == "editado à mão")
    Midia.errar = {"take_02"}
    ig.refazer_takes(rid1, [{"n": 2, "fala": "Outra fala à mão"}])
    ig.esperar(120)
    t2 = ig.editor(rid1)["takes"][1]
    caso("⛔ editado a mao e reprovado no QA: tambem fica para escolher, sem nova tentativa",
         t2["cur"]["estado"] == "escolher" and len(t2["versoes"]) == 13 and len(pedidos) == n_ped)
    Midia.errar = set()
    ig.aceitar_take(rid1, 2)
    caso("manter a atual: fica a ativa e a ocorrencia diz que nao resolveu",
         ig.editor(rid1)["takes"][1]["cur"]["estado"] == "aceito"
         and _cur.ocorrencias(base)[-1] == {**_cur.ocorrencias(base)[-1], "tipo": "escolha", "resolveu": False})
    n_img = len(g.imagens)
    ig.anotar_take(rid1, 2, "o QUADRO de abertura esta ruim", ["quadro"])
    ig.esperar(120)
    t2 = ig.editor(rid1)["takes"][1]
    caso("⭐ quadro ruim: o corretor pede quadro novo (e o reenquadra) e so' as versoes novas abrem nele", len(g.imagens) == n_img + 2
         and "A teapot." in g.imagens[-1][0] and [v["quadro_arquivo"] for v in t2["versoes"][-4:]] == ["quadro_02_q2"] * 4
         and "quadro_02_q2" not in [v["quadro_arquivo"] for v in t2["versoes"][:-4]])
    n_ped = len(pedidos)
    ig.anotar_take(rid1, 1, "três mãos", ["maos"])
    ig.refazer_takes(rid1, [{"n": 1, "movimento": "ela esta com tres maos"}])
    ig.esperar(120)
    caso("⭐ defeito + edicao a mao: passa pelo corretor, com a edicao so' como intencao",
         len([x for x in pedidos[n_ped:] if x.startswith("You fix ONE take")]) == 1
         and 'by hand: "ela esta com tres maos"' in pedidos[n_ped]
         and all(v["movimento"] != "ela esta com tres maos" for v in ig.editor(rid1)["takes"][0]["versoes"]))
    # ── licoes ──
    destil = [x for x in pedidos if x.startswith("You maintain the")]
    lp = ig.licoes()
    caso("⭐ licoes: com 3 casos novos a destilacao roda sozinha; igual reforca, nao duplica",
         len(destil) == 2 and [l["estado"] for l in lp["licoes"]] == ["proposta"] * 2 and lp["pendentes"] == 1
         and all(l["n"] == 2 for l in lp["licoes"]))
    caso("⛔ proposta nao entra no corretor", "Never use the word" not in
         [x for x in pedidos if x.startswith("You fix ONE take")][-1])
    ig.destilar(); ig.esperar(60)
    lp = ig.licoes()
    caso("destilar a mao: o caso que sobrou", lp["pendentes"] == 0 and all(l["n"] == 3 for l in lp["licoes"]))
    caso("⛔ destilar sem caso novo", _erro(lambda: ig.destilar()))
    lpal = next(l for l in lp["licoes"] if l["tipo"] == "palavra")
    lpro = next(l for l in lp["licoes"] if l["tipo"] == "prompt")
    for l in (lpal, lpro): ig.licao(l["id"], "aprovar")
    caso("⛔ licao: acao estranha / id que nao existe", _erro(lambda: ig.licao(lpal["id"], "xx"))
         and _erro(lambda: ig.licao("l-nada", "aprovar"), KeyError))
    ig.licao(lpro["id"], "editar", {"texto": "Mãos com cinco dedos, sempre."})
    n_ped, n_vid = len(pedidos), len(g.videos)
    ig.anotar_take(rid1, 1, "mão estranha", ["maos"])
    ig.esperar(120)
    novos = g.videos[n_vid:]
    t1 = ig.editor(rid1)["takes"][0]
    caso("⭐ licao ativa: a regra da palavra vai ao corretor e o lint tira a palavra da fala",
         'Never use the word "Tomiko"' in pedidos[n_ped] and all('"Fala corrigida da Tomi"' in v["prompt"] for v in novos)
         and "lição: Tomiko → Tomi" in t1["versoes"][-1]["nota"] and t1["versoes"][-1]["fala"] == "Fala corrigida da Tomi")
    caso("⭐ licao de prompt no Veo, e a versao guarda as licoes que valeram",
         len(novos) == 4 and all("Her hands keep five fingers." in v["prompt"] for v in novos)
         and set(t1["versoes"][-1]["licoes"]) == {lpal["id"], lpro["id"]})
    caso("licoes: o painel mede o depois da licao", next(l for l in ig.licoes()["licoes"] if l["id"] == lpro["id"])["efeito"]["depois"]["n"] == 4
         and ig.licoes()["taxas"]["etiquetas"])
    n_vid, nq0 = len(g.videos), len(Midia.quadros)
    r2 = ig.criar_reel(aid, "en", url="https://www.instagram.com/reel/def/", legenda=2)
    caso("⭐ o video seguinte vai para o outro comodo", r2["cena"] == "varanda")
    n_img = len(g.imagens)
    ig.esperar(120)
    vs2 = g.videos[n_vid:]
    caso("⭐ cada take vai do SEU quadro de abertura ao SEU quadro final (a acao completa)",
         [os.path.basename(v["inicio"]) for v in vs2] == [f"quadro_{i:02d}.png" for i in range(1, len(vs2) + 1)]
         and [os.path.basename(v["fim"]) for v in vs2] == [f"quadro_fim_{i:02d}.png" for i in range(1, len(vs2) + 1)]
         and all("in step with the speech" in v["prompt"] for v in vs2))
    fim1 = g.imagens[n_img + 2]
    reen = g.imagens[n_img + 1]
    caso("⭐ 2a passada: o quadro e' reenquadrado pela fonte (quadro da fonte + o da 1a passada)",
         [os.path.basename(x) for x in reen[1]] == ["origem_01.jpg", "quadro_01_base.png"] and "Reframe the SECOND image" in reen[0])
    caso("⭐ quadro final: o fim do trecho de origem, o quadro de abertura e a foto, com o resultado da acao",
         [os.path.basename(x) for x in fim1[1]][:2] == ["origem_fim_01.jpg", "quadro_01.png"]
         and os.path.basename(fim1[1][2]).startswith("foto.") and "END of the same step" in fim1[0]
         and "Rice inside the blender, step 1." in fim1[0])
    caso("⭐ o quadro copia o enquadramento do video de origem, com a foto e o comodo em texto", len(g.imagens) == n_img + 3 * len(vs2)
         and [os.path.basename(x) for x in g.imagens[n_img][1]][0] == "origem_01.jpg"
         and len(g.imagens[n_img][1]) == 2 and os.path.basename(g.imagens[n_img][1][1]).startswith("foto.")
         and "Londrina" in g.imagens[n_img][0] and "bamboo bench" not in g.imagens[n_img][0]
         and "same camera angle" in g.imagens[n_img][0] and "step 1." in g.imagens[n_img][0])
    qs = Midia.quadros[nq0:]
    caso("o take do CTA usa o ultimo trecho da origem; o quadro final vem depois do inicial",
         qs[2 * (len(vs2) - 1)] == qs[2 * (len(vs2) - 2)] and qs[1] > qs[0])
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
    caso("refazer a geracao reaproveita os quadros", len(g.imagens) == n_img + 3 * len(vs2))
    g.falhar = {"take_02_v1"}
    r3 = ig.criar_reel(aid, "pt", url="https://www.instagram.com/reel/ghi/", cta="palavra", palavra=" Eu  Quero ")
    caso("⭐ CTA de frase curta guardado em minusculas", r3["cta"]["palavra"] == "eu quero")
    ig.esperar(120)
    r3 = ig.reel(r3["id"])
    caso("⭐ roteiro: a frase fixa do CTA da Tomiko vai no pedido e no take do CTA",
         "Escreva eu quero, aqui embaixo e te mando o guia completo." in pedidos[-1]
         and r3["takes"][-1]["cta"] and r3["takes"][-1]["fala"] == "Escreva eu quero, aqui embaixo e te mando o guia completo.")
    caso("⭐ licao de palavra no roteiro: na regra e no lint", 'Never use the word "Tomiko"' in pedidos[-1]
         and all("Tomiko" not in t["fala"] for t in r3["takes"]) and "Fala 1 da Tomi" in r3["takes"][0]["fala"]
         and any("lições no roteiro" in x["texto"] for x in r3["registro"]))
    caso("⛔ licao de pt nao vale no Reel em ingles", 'Never use the word' not in next(
        x for x in pedidos if "Target language: American English." in x) and ig.reel(r2["id"])["takes"][1]["fala"] == "Fala 2 da Tomiko")
    ig.licao(lpal["id"], "aposentar")
    caso("licao aposentada", next(l for l in ig.licoes()["licoes"] if l["id"] == lpal["id"])["estado"] == "aposentada")
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
    # ── avatares por mercado: ficha sem foto (retrato + comodos sozinhos) e o lote de 1 fonte -> N Reels ──
    n_img = len(g.imagens)
    caso("⛔ avatar sem foto e sem ficha", _erro(lambda: ig.criar_avatar("Fulano", "", "")))
    w = ig.criar_avatar("", "", "", persona="wendelin")
    caso("⭐ avatar da ficha: nome, idioma, CTA e 8 comodos ja' preenchidos, retrato na fila",
         w["nome"] == "Bruder Wendelin" and w["idioma"] == "de" and w["cta"] == "Buch" and len(w["cenas"]) == 8
         and not w["foto"] and w["gerando_retrato"])
    ig.esperar(120)
    w = next(a for a in ig.tudo()["avatares"] if a["id"] == w["id"])
    retrato = g.imagens[n_img]
    caso("⭐ retrato-ancora gerado sem referencia, e os 8 comodos em seguida a partir dele",
         w["foto"] and retrato[1] == [] and "Benedictine monk" in retrato[0] and len(g.imagens) == n_img + 9
         and all(c["estado"] == "pronta" for c in w["cenas"]) and os.path.basename(g.imagens[-1][1][0]) == "foto.png")
    ig.cena(w["id"], "klostergarten", "aprovar")
    n_vid, g.falhar = len(g.videos), set()
    lote = ig.criar_lote([{"avatar": aid, "palavra": "livro"}, {"avatar": w["id"]}],
                         url="https://www.instagram.com/reel/lote/", legenda=0)
    caso("⛔ lote vazio", _erro(lambda: ig.criar_lote([], url="https://www.instagram.com/reel/x/")))
    ig.esperar(240)
    ra, rw = (ig.reel(x) for x in lote["reels"])
    caso("⭐ lote: um Reel por avatar, cada um no idioma e com o CTA dele", len(lote["reels"]) == 2
         and (ra["idioma"], ra["cta"]["palavra"]) == ("pt", "livro") and (rw["idioma"], rw["cta"]["palavra"]) == ("de", "buch")
         and ra["lote"] == rw["lote"] == lote["lote"] and ra["final"] and rw["final"])
    caso("⭐ lote: a fonte do segundo vem do primeiro, sem baixar de novo",
         Midia.baixados.count("https://www.instagram.com/reel/lote/") == 1
         and any("a mesma do lote" in x["texto"] for x in rw["registro"]))
    pw = [v["prompt"] for v in g.videos[n_vid:] if v["nome"].startswith("take_") and "German" in v["prompt"]]
    caso("⭐ os takes do monge: alemao e no masculino", pw and all("he stays silent, looking at the camera" in x and "She " not in x for x in pw))
    caso("tudo(): o catalogo das fichas", set(ig.tudo()["personas"]) == {"tomiko", "beppe", "cuca", "wendelin"})
    ig.editar_avatar(w["id"], {"arquivado": True})
    caso("⭐ avatar arquivado sai das sub-abas, e os arquivos e Reels dele ficam",
         all(a["id"] != w["id"] for a in ig.tudo()["avatares"]) and os.path.isdir(ig._pasta_av(w["id"]))
         and ig.reel(rw["id"])["final"])
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
