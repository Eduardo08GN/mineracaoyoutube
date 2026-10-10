# O VIDEO COMPLETO (14 secoes, ~20 min) com as regras da fatia (docs/divergencias-edicao-fatia01.md):
# narracao continua cortada a ~4 s, b-roll de ACAO casado com a erva/assunto de cada frase, o avatar do Veo falando na
# camera a cada 20-40 s (completo/avatar, gerar_avatar.py), 3 blocos de motion graphics >= 50 s (o hack, "Das Warum",
# o resumo das 12 ervas), CTA do livro, visual vintage — e a COSTURA de montador (costura.py) no lugar do corte seco:
# fusao na troca de assunto, mergulho no papel na entrada/saida dos motion graphics, clarao de pelicula na troca de secao.
#   python work/video/montar_completo.py   ->  work/video/completo/video_completo.mp4
import json, os, re, subprocess, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import montar_fatia as mf          # noqa: E402  (as mesmas funcoes de corte, cor, voz e portao de acao)
import costura                     # noqa: E402
import gerar_avatar as ga          # noqa: E402  (as falas de cada take do avatar)

PASTA = os.path.join(AQUI, "completo")
TMP = os.path.join(PASTA, "montagem")
SAIDA = os.path.join(PASTA, "video_completo.mp4")
FATIA = os.path.join(AQUI, "fatia01", "montagem3")
TERC = os.path.join(PASTA, "terceiros")
AVATAR = os.path.join(PASTA, "avatar")
MG = {6: os.path.join(AQUI, "mg_warum", "bloco.mp4"), 9: os.path.join(AQUI, "mg_resumo", "bloco.mp4")}
W, H, FPS = mf.W, mf.H, mf.FPS

# a erva ou o assunto de cada frase (a etiqueta das buscas de b-roll)
ERVAS = [("petersilie", r"petersilie"), ("basilikum", r"basilikum"), ("dill", r"\bdill"), ("schnittlauch", r"schnittlauch"),
         ("minze", r"\bminze"), ("liebstoeckl", r"liebstöckl"), ("thymian", r"thymian"), ("salbei", r"salbei"),
         ("oregano", r"oregano"), ("lorbeer", r"lorbeer"), ("koriander", r"koriander"), ("melisse", r"melisse")]
ASSUNTOS = [("mittelmeer", r"mittelmeer|süden|hängen|hitze"), ("kompost", r"kompost|dünger|dünge|gedüngt"),
            ("saat", r"\bsä|aussaat|samen|aussäen"), ("trocknen", r"trockn|aufbewahr|lager|winter über"),
            ("tee", r"\btee\b|brot"), ("labor", r"\böl|wissenschaft|universität|forscher|institut|messung"),
            ("markt", r"euro|gartencenter|einkaufsliste|töpfchen|kauf"), ("erde", r"erde|boden|sand|topf|staunässe|wasser|gieß"),
            ("kloster", r"kloster|mönch|brüder|bruder|benedikt"), ("garten", r"garten|beet|pflanze")]
VIZINHOS = {"erde": ["kompost", "basilikum", "thymian"], "kloster": ["trocknen", "thymian", "melisse"],
            "labor": ["trocknen", "melisse", "tee"], "markt": ["basilikum", "koriander", "petersilie"],
            "mittelmeer": ["thymian", "oregano", "salbei", "lorbeer"], "garten": ["thymian", "dill", "koriander"],
            "saat": ["koriander", "dill", "kompost"], "tee": ["trocknen", "melisse", "minze"],
            "trocknen": ["thymian", "melisse"], "kompost": ["basilikum", "erde"], "oregano": ["thymian", "mittelmeer"],
            "salbei": ["thymian", "mittelmeer"], "lorbeer": ["thymian", "mittelmeer"], "liebstoeckl": ["petersilie", "dill"],
            "minze": ["melisse", "basilikum"], "melisse": ["minze", "basilikum"], "schnittlauch": ["dill", "petersilie"],
            "petersilie": ["koriander", "dill", "schnittlauch"], "dill": ["koriander", "petersilie"],
            "koriander": ["petersilie", "dill"], "basilikum": ["minze", "melisse", "petersilie"],
            "thymian": ["oregano", "salbei", "lorbeer"]}


def etiqueta(texto, corrente):
    t = texto.lower()
    for tag, rx in ERVAS:
        if re.search(rx, t): return tag, tag
    for tag, rx in ASSUNTOS:
        if re.search(rx, t): return (corrente or tag), corrente
    return corrente or "garten", corrente


def fonte(clipe):
    return os.path.basename(clipe).rsplit("_", 1)[0]


class Banco:
    """Os trechos aprovados por etiqueta; nunca o mesmo trecho duas vezes no video.
    ⛔ so' trechos JA' revisados contra texto (revisar_texto.py), e nenhum de fonte com texto/selo/marca d'agua."""
    def __init__(self):
        self.por_tag, self.fora, self.sem_olho = {}, 0, 0
        for pasta in (TERC, os.path.join(AQUI, "fatia01", "terceiros")):
            arq = os.path.join(pasta, "aprovados.json")
            if not os.path.exists(arq): continue
            ap = json.load(open(arq, encoding="utf-8"))
            sujas = {fonte(c["clipe"]) for c in ap if c.get("texto") and c.get("texto_revisto") != "falso"}
            segundas = {}
            for c in sorted(ap, key=lambda c: -float(c.get("acao") or 0)):        # mais acao primeiro
                if "texto" not in c or fonte(c["clipe"]) in sujas or c.get("olho"): self.fora += 1; continue
                # ⛔ (09/10) so' entra o que passou pela revisao no olho ANTES da montagem (revisar_olho.py aprovar)
                if not c.get("olho_ok") and not os.environ.get("SEM_OLHO"): self.fora += 1; self.sem_olho += 1; continue
                # ⛔ (Eduardo, 09/10) b-roll SEMPRE com acao: trecho parado (abaixo de ACAO_MIN %) nao entra
                if float(c.get("acao") or 0) < ACAO_MIN: self.fora += 1; continue
                tag = c.get("tag") or "basilikum"
                arq = os.path.join(pasta, "clips", c["clipe"])
                self.por_tag.setdefault(tag, []).append(("terc", arq, 0.0))
                d = mf.dur(arq)
                # trecho de 5 s ou mais rende um 2o plano (a 2a metade), mas so' depois de TODOS os ineditos da etiqueta
                # ⛔ (Eduardo, 09/10) nunca a mesma imagem duas vezes: a 2a metade de um trecho NAO entra mais
                if REUSAR_METADE and d >= 5.0: segundas.setdefault(tag, []).append(("terc", arq, round(d / 2, 2)))
            for tag, vs in segundas.items(): self.por_tag[tag] += vs
        # o que a fatia (secoes 1-2) ja' mostrou nao volta (nem a 2a metade do mesmo trecho)
        self.secao, self.uso, self.forcar = 0, {}, None
        # ⭐ (Eduardo, 09/10) infograficos esquematicos de vez em quando (gerar_infografos.py): 1 a cada INFO_CADA planos
        self.cont, self.infos = 0, []
        arq_i = os.path.join(PASTA, "infografos", "infografos.json")
        movs = [(1.0, 1.12, (.45, .5), (.55, .5)), (1.12, 1.0, (.5, .45), (.5, .55)), (1.0, 1.1, (.55, .55), (.45, .45))]
        if os.path.exists(arq_i):
            for i, (k, d) in enumerate(json.load(open(arq_i, encoding="utf-8")).items()):
                img = os.path.join(PASTA, "infografos", k + ".png")
                if os.path.exists(img): self.infos.append((d.get("tag", ""), mf.F(img, *movs[i % 3])))                     # caminho do trecho -> secao em que ja' apareceu
        # ultima reserva (o banco limpo de terceiros acaba na secao 12): imagens proprias ainda nao usadas, com movimento
        # lento de camera — as maos do Veo (m01-m04), as cenas p03/p07/p12/p06_lado e as 3 celulas livres da grade p08
        Fq = lambda n: os.path.join(AQUI, "fatia01", "quadros", n + ".png")                   # noqa: E731
        Fm = lambda n: os.path.join(AQUI, "fatia01", "maos", n + ".png")                      # noqa: E731
        mov = [(1.0, 1.12, (.45, .5), (.55, .5)), (1.12, 1.0, (.5, .45), (.5, .55)), (1.0, 1.1, (.55, .55), (.45, .5))]
        imgs = [Fm(m) for m in ("m01_tirar_ini", "m02_partir_ini", "m03_quatro_ini", "m04_plantar_ini", "m01_tirar_fim",
                                "m02_partir_fim", "m03_quatro_fim")] + [Fq(q) for q in ("p03", "p07", "p12", "p06_lado")]
        self.extra = [mf.F(f, *mov[i % 3]) for i, f in enumerate(imgs) if os.path.exists(f)]
        self.extra += [mf.F(Fq("p08"), 1.0, 1.06, (.5, .55), (.5, .5), mf.CEL(r, c)) for r, c in ((0, 1), (0, 2), (1, 0))]
        self.usados = {repr(v) for vs in mf.VISUAL.values() for v in vs} | {repr(v) for v in mf.RESERVA}
        # o que a fatia mostrou: o 1o pedaco nunca volta; a 2a metade so' nas secoes finais (10-14, a 13+ min de distancia)
        self.da_fatia = {v[1] for vs in mf.VISUAL.values() for v in vs if v[0] == "terc"} |                         {v[1] for v in mf.RESERVA if v[0] == "terc"}
        self.usados |= {repr(v) for vs in self.por_tag.values() for v in vs if v[1] in self.da_fatia and v[2] == 0}

    def pode(self, v):
        if repr(v) in self.usados or self.uso.get(v[1]) == self.secao: return False
        return not (v[1] in self.da_fatia and self.secao < 10)

    def pegar(self, tag, rel, n):
        if self.forcar:                                  # a sobra do take do avatar que acabou de falar
            v, self.forcar = self.forcar, None
            rel.append(f"frase {n}: abre com o resto do take do avatar ({os.path.basename(v[1])} a partir de {v[2]} s)")
            return v
        self.cont += 1
        livres_i = [(t, v) for t, v in self.infos if repr(v) not in self.usados]
        if livres_i and self.cont % INFO_CADA == 0:
            t, v = next(((t, v) for t, v in livres_i if t == tag), livres_i[0])
            self.usados.add(repr(v)); rel.append(f"frase {n} ({tag}): infografico {os.path.basename(v[1])}")
            return v
        for t in [tag] + VIZINHOS.get(tag, []) + ["garten", "kloster", "erde"]:
            for v in self.por_tag.get(t, []):
                if self.pode(v):   # a 2a metade nunca na mesma secao
                    self.usados.add(repr(v)); self.uso[v[1]] = self.secao
                    if t != tag: rel.append(f"frase {n} ({tag}): sem trecho livre, usei '{t}'")
                    return v
        # reserva geral: alterna as etiquetas (a que tem mais sobrando, nunca a mesma da ultima vez) — antes ela
        # esgotava uma etiqueta inteira de uma vez (30 s de composteira seguidos)
        livres = lambda t: [v for v in self.por_tag[t] if self.pode(v)]  # noqa: E731
        ordem = sorted((t for t in self.por_tag if livres(t)), key=lambda t: (t == getattr(self, "ultima", None), -len(livres(t))))
        if ordem:
            t = ordem[0]; v = livres(t)[0]; self.ultima = t
            self.usados.add(repr(v)); self.uso[v[1]] = self.secao; rel.append(f"frase {n} ({tag}): reserva '{t}'"); return v
        for vs in self.por_tag.values():                 # ultima rede: 2a metade mesmo na secao (com aviso)
            for v in vs:
                if repr(v) not in self.usados:
                    self.usados.add(repr(v)); rel.append(f"frase {n} ({tag}): 2a metade na mesma secao"); return v
        for v in self.extra:
            if repr(v) not in self.usados:
                self.usados.add(repr(v)); rel.append(f"frase {n} ({tag}): imagem propria {os.path.basename(v[1])}"); return v
        raise SystemExit(f"frase {n}: acabaram os trechos de b-roll")


def bloco_narrado(frases, nome, banco, rel):
    saida, cache = os.path.join(TMP, nome + ".mp4"), os.path.join(TMP, nome + ".json")
    if os.path.exists(saida) and os.path.exists(cache):          # ja' montado: so' repoe as escolhas no banco
        c = json.load(open(cache, encoding="utf-8")); banco.forcar = None
        for v in c["vis"]:
            v = tuple(v); banco.usados.add(repr(v)); banco.uso[v[1]] = banco.secao
        return saida, [tuple(t) for t in c["tomadas"]]
    man = {f["n"]: f for f in frases}
    wav, marcas = mf.com_respiro(*mf.faixa_narrada([f["n"] for f in frases], man, nome))
    corrente, tags = None, {}
    for f in frases:
        tags[f["n"]], corrente = etiqueta(f["texto"], corrente)
    mf.ALVO = 5.2 if banco.secao >= 10 else 4.8         # secoes finais, mais reflexivas: planos um pouco mais longos
    tomadas = mf.grade_de_cortes(wav, marcas, lambda n: banco.pegar(tags[n], rel, n))
    if not os.path.exists(saida):              # bloco ja' renderizado numa rodada anterior: so' refaz a conta das escolhas
        trans = mf.montar_narrado(wav, tomadas, nome, saida, assunto=lambda t: tags[t[2]])
        rel.append(f"{nome}: {sum(1 for t in trans if t[0] != 'corte')} fusoes em {len(trans)} cortes")
    res = [("broll", f"frase {n}", round(b - a, 2), tags[n]) for a, b, n, _v in tomadas]
    json.dump({"vis": [list(v) for _a, _b, _n, v in tomadas], "tomadas": res}, open(cache, "w", encoding="utf-8"))
    return saida, res


def rosto_x(arq):
    """Centro horizontal (fracao) do rosto no take: a mediana de 5 quadros (um quadro so' errava e caia no meio)."""
    import cv2, numpy as np
    cc = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    xs = []
    for t in (1, 2.5, 4, 5.5, 7):
        raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(t), "-i", arq, "-frames:v", "1", "-vf", "scale=640:360",
                              "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True).stdout
        if len(raw) != 640 * 360: continue
        f = cc.detectMultiScale(np.frombuffer(raw, np.uint8).reshape(360, 640), 1.1, 6, minSize=(30, 30))
        if len(f):
            x, y, w, h = max(f, key=lambda r: r[2] * r[3])
            xs.append((x + w / 2) / 640)
    return float(np.median(xs)) if xs else 0.5


# ⛔⛔ REGRA (Eduardo, 09/10, vale das proximas producoes em diante): o take do Veo com o avatar e' PRECIOSO
#    (10 creditos cada) — os 8 s inteiros entram no video, nada fica no chao:
#      - antes da fala: o monge olhando para a camera abre o plano dele (um respiro antes de falar);
#      - a fala: o plano do avatar, do peito para cima, com a voz dele;
#      - depois da fala: o monge ouvindo/acenando vira o 1o plano da narracao seguinte, em plano ABERTO (o quadro
#        inteiro do Veo, um enquadramento diferente do punch-in) com a narracao por cima; se nao ha' narracao depois
#        (fim de secao), a sobra fica no proprio plano dele, em silencio, ate' o fim do take.
#    So' a fala de OUTRA frase emendada pelo Veo (o a15) fica de fora: ali o monge mexe a boca com palavras erradas.
SOBRA_MIN = 1.0
REUSAR_METADE = False     # (09/10) proibido repetir imagem
ACAO_MIN = 1.0            # (09/10) % minimo de acao do sujeito (portao de acao) para um trecho de b-roll entrar
INFO_CADA = 10            # um infografico a cada 10 planos de b-roll (~45 s)           # sobra mais curta que isso nao vira plano (vai no proprio bloco do avatar)


def bloco_avatar(k, texto, saida, avisos, ultimo=False):
    """Devolve (duracao do bloco, sobra) — sobra = o visual do resto do take para a narracao seguinte, ou None."""
    import voz_conrad
    arq = os.path.join(AVATAR, k + ".mp4")
    voz = voz_conrad.converter(arq)                     # o timbre da narracao (o mesmo monge narra e fala)
    # a janela vai da 1a palavra ate' a ULTIMA palavra da fala-alvo: o Veo as vezes emenda outra frase depois
    # (o a15 seguiu com "Es ist ein Samstag im April...") e o respiro final para antes dela
    ws = mf.palavras(arq)
    if not ws: raise SystemExit(f"{k}: o take nao tem fala")
    norm = lambda w: re.sub(r"[^a-zäöüß0-9]", "", w.lower())                    # noqa: E731
    alvo = texto.split(); fim = min(len(alvo), len(ws)) - 1
    for i in range(max(0, len(alvo) - 3), min(len(ws), len(alvo) + 3)):
        if norm(ws[i][0]) == norm(alvo[-1]): fim = i; break
    if fim < len(ws) - 1: avisos.append(f"{k}: cortei {len(ws) - 1 - fim} palavra(s) a mais no fim do take")
    a, b = max(0.0, ws[0][1] - 0.25), ws[fim][2] + 0.15
    teto = ws[fim + 1][1] - 0.08 if fim + 1 < len(ws) else mf.dur(arq)
    total = mf.dur(arq)
    emendou = fim + 1 < len(ws)
    a, b = 0.0, min(teto, b + mf.PAD)                                   # desde o 1o quadro (regra dos 8 s)
    sobra = None
    if not emendou:
        if ultimo or total - b < SOBRA_MIN: b = total                   # o resto fica no plano dele
        else: sobra = ("terc", arq, round(b, 3))                        # vira o 1o plano da narracao seguinte
    # ⭐ (Eduardo, 09/10) o enquadramento segue o PLANO do take (gerar_avatar.PLANOS): corpo inteiro / andando entram
    #    com o quadro inteiro; medio com recorte leve; so' o close e o "peito" antigo levam o punch-in do peito para cima
    enq = ga.enquadramento(k) if k in ga.TAKES else "fechado"
    L = {"aberto": 1.0, "medio": 0.8}.get(enq, mf.AV_LARG)
    x0 = min(max(0.0, rosto_x(arq) - L / 2), 1 - L)
    topo = 0.0 if L == 1.0 else (0.02 if enq == "medio" else mf.AV_TOPO)
    crop = (f"crop=iw*{L}:iw*{L}*9/16:iw*{x0:.4f}:ih*{topo},scale={W}:{H}:flags=lanczos,setsar=1,"
            f"{mf.GRADE_AVATAR},fps={FPS}")
    mf.ff("-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", arq, "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", voz,
          "-filter_complex", f"[0:v]{crop}[v];[1:a]afade=t=in:d=0.05,afade=t=out:st={b - a - 0.12:.3f}:d=0.12[a]",
          "-map", "[v]", "-map", "[a]", *mf.VID, *mf.AUD, saida)
    return b - a, sobra


def bloco_mg(arq, nome):
    saida = os.path.join(TMP, nome + ".mp4")
    mf.ff("-i", arq, "-vf", f"scale={W}:{H},fps={FPS},setsar=1,{mf.GRADE_MG}", *mf.VID, *mf.AUD, saida)
    return saida


# take que so' serve em parte: o a13 diz "sechstausend Euro" uma vez so' (a repeticao vai na narracao, logo depois)
PARCIAL = {"a13": [211]}


def takes_prontos():
    """{numero da 1a frase (sem o +1000): (chave, [numeros])} dos takes do avatar que ja' estao no disco."""
    return {ns[0]: (k, PARCIAL.get(k, ns)) for k, (_c, ns, _g) in ga.TAKES.items()
            if os.path.exists(os.path.join(AVATAR, k + ".mp4"))}


def main():
    os.makedirs(TMP, exist_ok=True)
    mf.TMP = TMP
    mf.ALVO = 4.8                                    # o banco limpo e' curto: planos um pouco mais longos
    frases = json.load(open(os.path.join(PASTA, "frases.json"), encoding="utf-8"))
    for f in frases: f["n"] = 1000 + f["n"]          # ⛔ fora da faixa das chaves da fatia (TEXTO_EXTRA usa 170)
    sec = lambda k: [f for f in frases if f["secao"] == k]                       # noqa: E731
    banco, rel, avisos, tomadas = Banco(), [], [], []
    blocos, generos, falas = [], [], []
    takes = takes_prontos()
    print(f"b-roll: {sum(len(v) for v in banco.por_tag.values())} trechos limpos ({banco.fora} fora: texto/sem revisao)")
    print(f"avatar: {len(takes)} takes no disco", flush=True)

    def narrado_com_avatar(k):
        """A secao em blocos: narracao, e o avatar onde ha' take para a frase (a narracao pula a frase dele)."""
        fs, run, i = sec(k), [], 0
        banco.secao, banco.forcar = k, None
        def solta():
            if not run: return
            nome = f"s{k:02d}_{len(blocos):02d}"
            print(" ", nome, f"narr {len(run)} frases", flush=True)
            b, t = bloco_narrado(list(run), nome, banco, rel)
            blocos.append(b); generos.append(("narr", k, k)); tomadas.extend(t); run.clear()
        while i < len(fs):
            n0 = fs[i]["n"] - 1000
            if n0 in takes:
                chave, ns = takes[n0]
                if [f["n"] - 1000 for f in fs[i:i + len(ns)]] == ns:
                    solta()
                    saida = os.path.join(TMP, f"s{k:02d}_{len(blocos):02d}_{chave}.mp4")
                    print(" ", os.path.basename(saida), "avatar", flush=True)
                    ultimo = i + len(ns) >= len(fs)          # nada narrado depois dele nesta secao
                    d, banco.forcar = bloco_avatar(chave, " ".join(f["texto"] for f in fs[i:i + len(ns)]), saida, avisos,
                                                   ultimo)
                    blocos.append(saida); generos.append(("fala", k, k)); tomadas.append(("avatar", chave, round(d, 2)))
                    i += len(ns); continue
            run.append(fs[i]); i += 1
        solta()

    # secoes 1 e 2, o hack, e o CTA (secao 4): os blocos da fatia, ja' montados com a mesma costura
    fat = json.load(open(os.path.join(FATIA, "blocos.json"), encoding="utf-8"))
    corte = max(i for i, g in enumerate(fat["generos"]) if g[0] == "mg") + 1          # ate' o hack, inclusive
    blocos += fat["blocos"][:corte]; generos += [tuple(g) for g in fat["generos"][:corte]]
    print("secao 3", flush=True); narrado_com_avatar(3)
    blocos += fat["blocos"][corte:]; generos += [tuple(g) for g in fat["generos"][corte:]]   # "Ein kurzes Wort..." + o livro
    print("secao 5", flush=True); narrado_com_avatar(5)
    for k in (6, 7, 8, 9, 10, 11, 12, 13, 14):
        if k in MG and os.path.exists(MG[k]):
            print(f"secao {k} (motion graphics)", flush=True)
            blocos.append(bloco_mg(MG[k], f"s{k:02d}_mg")); generos.append(("mg", k, k))
            tomadas.append(("mg", f"secao {k}", round(mf.dur(MG[k]), 2)))
        else:
            if k in MG: rel.append(f"secao {k}: o bloco de motion graphics nao existe, narrei com b-roll")
            print(f"secao {k}", flush=True); narrado_com_avatar(k)
    tipos = [costura.tipo_entre(x, y) for x, y in zip(generos, generos[1:])]
    json.dump({"blocos": blocos, "generos": generos, "tipos": tipos}, open(os.path.join(TMP, "blocos.json"), "w"), indent=1)
    print("costura", flush=True)
    feitas = costura.costurar_blocos(blocos, tipos, SAIDA, TMP)
    from collections import Counter
    ds = [t[2] for t in tomadas if t[0] == "broll"]
    print(f"\n{SAIDA}  {mf.dur(SAIDA) / 60:.1f} min · {len(blocos)} blocos · b-roll novo: {len(ds)} tomadas, "
          f"media {sum(ds) / max(1, len(ds)):.2f} s · avatar: {sum(1 for g in generos if g[0] in ('fala', 'split'))} entradas")
    print("transicoes entre blocos:", dict(Counter(t for t, q in feitas if q)), "| encolhidas a corte:",
          sum(1 for t, q in feitas if not q and t != "corte"))
    for r in avisos + rel: print("  ⚠", r)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    main()
