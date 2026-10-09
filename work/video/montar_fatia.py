# Monta a fatia 1 (~2 min) na assinatura do Elias, v2: as regras saem da leitura otica lado a lado com o video
# "Two Spoons of Borax" (docs/divergencias-edicao-fatia01.md).
#   A  narracao em UMA faixa continua; o video e' cortado por cima numa grade de ~4,2 s, no vao entre palavras
#   B  avatar do peito para cima (punch-in centrado no rosto)
#   C  tela dividida: faixa de 1/4 colada ao rosto + clipe em 3/4
#   D  CTA em planos de <=4,5 s, enquadramentos diferentes, render em 4K
#   E  grade de cor no b-roll (menos saturado, menos claro, grao leve)
#   F  nenhuma imagem repetida; foto parada no maximo 3,6 s; tomada minima 2,2 s
#   H  portao de acao: mede a acao do sujeito de cada b-roll e lista as tomadas paradas
# ⛔ Nada aqui gera no Flow: so' o que ja' esta' no disco.
#   python work/video/montar_fatia.py   ->  work/video/fatia01/fatia01.mp4
import json, os, subprocess, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
for p in (AQUI, os.path.join(AQUI, "cta"), r"C:\Users\edlut\ow_agente\organic-wave-studio\motor"):
    if p not in sys.path: sys.path.insert(0, p)
import voz_wendelin as voz        # noqa: E402
import costura                    # noqa: E402  (as transicoes de montador)

PASTA = os.path.join(AQUI, "fatia01")
BRUTO = os.path.join(PASTA, "bruto")
QUADROS = os.path.join(PASTA, "quadros")
LIVRO = os.path.join(AQUI, "cta", "img")
CONRAD = os.path.join(AQUI, "voz", "conrad")
TMP = os.path.join(PASTA, "montagem3")
TERC = os.path.join(PASTA, "terceiros")
HACK = os.path.join(AQUI, "hack", "hack_bloco.mp4")
SAIDA = os.path.join(PASTA, "fatia01.mp4")
# ⛔⛔ (Eduardo, 09/10) NADA acima de 720p no pipeline: o Veo entrega 720p e o vídeo de 1080p saiu com 2,1 GB
W, H, FPS = 1280, 720, 30

# ── o ritmo (medido no Elias: tomada media 4,2 s, 2,2-6,2 s; respiro 0,3-0,6 s) ──
ALVO, MIN_T, MAX_CLIPE, MAX_FOTO = 4.2, 2.2, 5.4, 3.6
RESPIRO, RESPIRO_SECAO = 0.22, 0.5
PAD = 0.4          # respiro nas bordas de cada bloco: e' onde a transicao entre blocos cruza imagem e som sem pisar na fala
# ⭐ visual "old-monk-garden-dutch" (pedido do Eduardo, 08/10): pretos levantados, sombras quentes, verdes apagados,
#    realce ocre, vinheta e grao de filme. Vale para tudo (b-roll, avatar, motion graphics).
VINTAGE = ("curves=all='0/0.07 0.25/0.25 0.5/0.51 0.75/0.77 1/0.94',"
           "colorbalance=rs=.07:gs=.02:bs=-.07:rm=.04:gm=.00:bm=-.05:rh=.03:gh=.01:bh=-.05,"
           "eq=saturation=0.76:contrast=1.04,vignette=angle=PI/4.6,noise=alls=7:allf=t")
GRADE = VINTAGE
GRADE_AVATAR = VINTAGE
GRADE_MG = "vignette=angle=PI/5,noise=alls=5:allf=t"
# avatar: recorte do peito para cima no quadro 1280x720 do Veo (56% da largura, rosto no centro)
AV_LARG, AV_TOPO = 0.56, 0.04

TEXTO_EXTRA = {170: "Aber hören Sie mir zu."}     # o plano 17 partido: a 1a frase narrada, a 2a no avatar
Q = lambda n: os.path.join(QUADROS, n + ".png")                                    # noqa: E731
CEL = lambda r, c: (c / 3, r / 2, 1 / 3, 1 / 2)    # uma celula da grade 3x2 do p08  # noqa: E731
F = lambda img, z0, z1, c0, c1, caixa=None: ("foto", img, z0, z1, c0, c1, caixa)  # noqa: E731
C = lambda nome, ini: ("clipe", nome, ini)                                         # noqa: E731
_APROV = json.load(open(os.path.join(PASTA, "terceiros", "aprovados.json"), encoding="utf-8"))
# trecho de video de terceiros (regra: <=8 s, <=10% da fonte, sem rosto/legenda/audio — broll_terceiros.py)
T = lambda i: ("terc", os.path.join(PASTA, "terceiros", "clips", _APROV[i]["clipe"]), 0.0)   # noqa: E731
# ⛔ marca d'agua (o Eduardo achou texto semitransparente): se UM trecho de uma fonte tem texto/selo (revisar_texto.py),
#    a fonte inteira sai — o selo aparece e some, e os outros trechos dela tambem o carregam
FONTES_COM_TEXTO = {c["clipe"].rsplit("_", 1)[0] for c in _APROV if c.get("texto") and c.get("texto_revisto") != "falso"}


OLHO = {c["clipe"] for c in _APROV if c.get("olho")}          # rejeitados na revisao no olho (rosto, fora do tema, parado)


def limpo(spec):
    return spec[0] != "terc" or (os.path.basename(spec[1]).rsplit("_", 1)[0] not in FONTES_COM_TEXTO
                                 and os.path.basename(spec[1]) not in OLHO)

# visual de cada frase narrada, em ordem de preferencia (a montagem nunca repete um visual)
VISUAL = {
    2: [C("p02", 0.5)],
    3: [T(60)],
    4: [T(54), C("p04", 0.5)],
    5: [T(106), C("p05", 0.5)],
    7: [T(67), T(51)],
    8: [F(Q("p08"), 1.0, 1.05, (.5, .55), (.5, .55), CEL(0, 0)), F(Q("p08"), 1.0, 1.06, (.5, .55), (.5, .55), CEL(1, 1))],
    9: [F(Q("p09"), 1.0, 1.15, (.45, .5), (.55, .5))],
    10: [F(Q("p10"), 1.05, 1.2, (.5, .6), (.5, .65))],
    11: [T(30)],
    12: [T(49)],
    13: [T(93), F(Q("p13"), 1.1, 1.0, (.5, .4), (.5, .5))],
    14: [F(Q("p14"), 1.0, 1.1, (.4, .5), (.6, .5))],
    15: [F(Q("p15"), 1.0, 1.15, (.5, .5), (.5, .5))],
    16: [F(Q("p08"), 1.0, 1.06, (.5, .55), (.5, .5), CEL(1, 2))],
    170: [T(37)],
    18: [T(59), T(53)],
    19: [T(73), T(47)],
    20: [T(103), T(48)],
    21: [T(31)],
    22: [T(25)],
    23: [T(28), T(111)],
    24: [],
    25: [T(79), T(80)],
    41: [T(26), T(119)],
}
# reserva quando a frase pede mais tomadas do que tem visual proprio (nunca o mesmo enquadramento duas vezes)
RESERVA = [T(50), T(58), T(27), T(104), T(45), T(55),                 # limpos (a revisao de texto tirou varios da lista)
           T(46), T(107), T(108), T(113), T(72), T(70), T(42), T(40), C("p04", 4.2), C("p05", 4.2), C("p02", 4.2)]

# a sequencia: avatar (fala do Veo), tela dividida, blocos narrados e o CTA
SEQ = [("fala", 1, "p01_fala"),
       ("narr", [2, 3, 4, 5]),
       ("split", 6, "p06_fala", T(46)),
       ("narr", [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 170]),
       ("fala", 17, "p01_b", (3.85, 6.85), "Es war nicht Ihre Schuld."),   # o take pago do Veo Fast (mesmo monge)
       ("narr", [18, 19, 20, 21, 22, 23, 24, 25]),
       ("mg", HACK),                                    # o hack (Handgriff Nr. 1), motion graphics >= 50 s
       ("narr", [41]),
       ("cta",)]
CTA = [("Was in unserem Kloster über die Jahre gesammelt wurde,", 0.22, None),
       ("ist mehr, als in ein Video passt.", 0.45, None),
       ("Ich habe alles in ein Buch geschrieben:", 0.25, "B0"),
       ("Das Klostergarten-Buch,", 0.22, "TITEL"),
       ("zu finden auf Bruder Wendelin Punkt online.", 0.5, "URL"),
       ("Das Buch ist die lange Fassung.", 0.3, "C0"),
       ("Wenn Sie es möchten, ist es dort.", 0.5, None),
       ("Ich werde es nicht noch einmal erwähnen.", 0.0, None)]

# ⛔ o grao de filme a crf 17 sem teto dava ~80 Mbps (a fatia de 3 min com 1,9 GB e o disco cheio): teto de 25 Mbps
VID = ["-c:v", "libx264", "-preset", "medium", "-crf", "20", "-maxrate", "8M", "-bufsize", "16M", "-pix_fmt", "yuv420p",
       "-r", str(FPS)]
AUD = ["-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"]
TOM_SALA = "anoisesrc=color=brown:amplitude=0.0025:r=48000"


def ff(*a):
    r = subprocess.run(["ffmpeg", "-v", "error", "-y", *a], capture_output=True, text=True)
    if r.returncode: raise SystemExit("ffmpeg: " + r.stderr[-800:])


def dur(arq):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arq],
                                capture_output=True, text=True).stdout)


_W = [None]


def palavras(arq, lingua="de"):
    if _W[0] is None:
        from faster_whisper import WhisperModel
        _W[0] = WhisperModel("small", device="cpu", compute_type="int8")
    segs, _ = _W[0].transcribe(arq, language=lingua, word_timestamps=True)
    return [(w.word.strip(), w.start, w.end) for s in segs for w in (s.words or []) if w.word.strip()]


# ── os visuais ──────────────────────────────────────────────────────────────────────────────────

def video_foto(spec, d, saida):
    """Movimento lento de camera numa imagem parada (conta feita numa imagem 4x maior: nao treme)."""
    _, img, z0, z1, (x0, y0), (x1, y1), caixa = spec
    n = max(2, int(round(d * FPS)))
    e = f"(0.5-0.5*cos(PI*(on/{n - 1})))"
    z = f"({z0}+({z1}-{z0})*{e})"
    cx, cy = f"({x0}+({x1}-{x0})*{e})", f"({y0}+({y1}-{y0})*{e})"
    pre = f"crop=iw*{caixa[2]}-6:ih*{caixa[3]}-6:iw*{caixa[0]}+3:ih*{caixa[1]}+3," if caixa else ""
    filtro = (f"{pre}scale=3840:2160:force_original_aspect_ratio=increase,crop=3840:2160,"
              f"zoompan=z='{z}':x='max(0,min(iw-iw/zoom,iw*{cx}-iw/zoom/2))':y='max(0,min(ih-ih/zoom,ih*{cy}-ih/zoom/2))'"
              f":d={n}:s={W}x{H}:fps={FPS},setsar=1,{GRADE}")
    ff("-loop", "1", "-i", img, "-vf", filtro, "-frames:v", str(n), *VID, "-an", saida)


def video_clipe(spec, d, saida):
    _, nome, ini = spec
    arq = os.path.join(BRUTO, nome + ".mp4")
    total = dur(arq)
    if d > total - ini: ini = max(0.3, total - d)
    ff("-ss", f"{ini}", "-t", f"{d:.3f}", "-i", arq,
       "-vf", f"scale={W}:{H}:flags=lanczos,fps={FPS},setsar=1,{GRADE}", *VID, "-an", saida)


def video_terc(spec, d, saida):
    _, arq, ini = spec
    d = min(d, dur(arq) - ini)
    ff("-ss", f"{ini:.3f}", "-t", f"{d:.3f}", "-i", arq, "-vf", f"scale={W}:{H}:flags=lanczos,fps={FPS},setsar=1,{GRADE}", *VID, "-an", saida)


def video(spec, d, saida):
    {"foto": video_foto, "clipe": video_clipe, "terc": video_terc}[spec[0]](spec, d, saida)


def max_dur(spec):
    if spec[0] == "foto": return MAX_FOTO
    if spec[0] == "terc": return min(MAX_CLIPE, dur(spec[1]) - spec[2])
    return MAX_CLIPE


# ── o avatar ────────────────────────────────────────────────────────────────────────────────────

def janela_fala(arq, texto, avisos, n):
    ws = palavras(arq)
    if not ws: raise SystemExit(f"plano {n}: o take nao tem fala")
    try:
        import conferir
        lau = conferir.avaliar(texto, " ".join(w for w, _, _ in ws))
        if not lau["ok"]: avisos.append(f"plano {n}: " + "; ".join(lau["motivos"]))
    except Exception as e:                                                          # noqa: BLE001
        avisos.append(f"plano {n}: conferencia nao rodou ({e})")
    return max(0.0, ws[0][1] - 0.25), min(dur(arq), ws[-1][2] + 0.15)


def recorte_avatar():
    """crop do peito para cima no quadro do Veo (fracoes da largura/altura de entrada)."""
    return (f"crop=iw*{AV_LARG}:iw*{AV_LARG}*9/16:iw*{(1 - AV_LARG) / 2}:ih*{AV_TOPO},"
            f"scale={W}:{H}:flags=lanczos,setsar=1,{GRADE_AVATAR}")


def bloco_fala(n, clipe, texto, saida, avisos, janela=None):
    arq = os.path.join(BRUTO, clipe + ".mp4")
    a, b = janela if janela else janela_fala(arq, texto, avisos, n)
    a, b = max(0.0, a - PAD), min(dur(arq), b + PAD)
    ff("-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", arq, "-ss", f"{a:.3f}", "-to", f"{b:.3f}",
       "-i", os.path.join(CONRAD, clipe + "_conrad.wav"),
       "-filter_complex", f"[0:v]{recorte_avatar()},fps={FPS}[v];[1:a]afade=t=out:st={b - a - 0.08:.3f}:d=0.08[a]",
       "-map", "[v]", "-map", "[a]", *VID, *AUD, saida)
    return [("avatar", clipe, b - a)]


def bloco_split(n, clipe, lado, texto, saida, avisos):
    """Faixa de 1/4 do avatar (colada ao rosto) a esquerda e o clipe em 3/4 a direita."""
    arq = os.path.join(BRUTO, clipe + ".mp4")
    a, b = janela_fala(arq, texto, avisos, n)
    a, b = max(0.0, a - PAD), min(dur(arq), b + PAD)
    d = b - a
    vid = os.path.join(TMP, f"lado{n:02d}.mp4")
    video(lado, d, vid)
    faixa = W // 4
    filtro = (f"[0:v]{recorte_avatar()},crop={faixa}:{H}:{(W - faixa) // 2}:0[e];"
              f"[1:v]crop={W - faixa}:{H}:{faixa // 2}:0,setpts=PTS-STARTPTS[d];"
              f"[e][d]hstack,fps={FPS}[v];[2:a]afade=t=out:st={d - 0.08:.3f}:d=0.08[a]")
    ff("-ss", f"{a:.3f}", "-t", f"{d:.3f}", "-i", arq, "-i", vid, "-ss", f"{a:.3f}", "-t", f"{d:.3f}",
       "-i", os.path.join(CONRAD, clipe + "_conrad.wav"),
       "-filter_complex", filtro, "-map", "[v]", "-map", "[a]", *VID, *AUD, "-t", f"{d:.3f}", saida)
    return [("split", clipe, d)]


# ── a narracao continua e a grade de cortes ─────────────────────────────────────────────────────

def faixa_narrada(ns, man, nome):
    """UMA faixa com as frases do bloco (respiro curto entre elas). Devolve (wav, [(n, ini, fim)])."""
    linhas, marcas, t = [], [], 0.0
    for i, n in enumerate(ns):
        w = voz.narrar(TEXTO_EXTRA.get(n) or man[n]["texto"], os.path.join(TMP, f"f{n:02d}.wav"))
        d = dur(w)
        gap = 0.0 if i == len(ns) - 1 else (RESPIRO_SECAO if man.get(ns[i + 1], {}).get("secao", 1) != man.get(n, {}).get("secao", 1) else RESPIRO)
        p = os.path.join(TMP, f"f{n:02d}_p.wav")
        ff("-i", w, "-af", f"apad=pad_dur={gap}", p)
        linhas.append(f"file '{os.path.basename(p)}'\n"); marcas.append((n, t, t + d)); t += d + gap
    lst = os.path.join(TMP, nome + ".txt")
    open(lst, "w").writelines(linhas)
    wav = os.path.join(TMP, nome + ".wav")
    ff("-f", "concat", "-safe", "0", "-i", lst, "-ac", "1", "-ar", "48000", wav)
    return wav, marcas


def grade_de_cortes(wav, marcas, visuais_livres):
    """[(ini, fim, n, visual)] — corte a ~4,2 s, no vao entre duas palavras, sem esperar a frase acabar."""
    total = dur(wav)
    ws = palavras(wav)
    vaos = [(ws[i][2] + ws[i + 1][1]) / 2 for i in range(len(ws) - 1)] + [total]
    frase_em = lambda t: next((n for n, a, b in marcas if a <= t < b + 0.3), marcas[-1][0])   # noqa: E731
    tomadas, t = [], 0.0
    while total - t > 0.05:
        n = frase_em(t + 1.0)
        vis = visuais_livres(n)
        teto = max_dur(vis)
        if total - t <= teto + MIN_T * 0.5:            # o resto cabe numa tomada
            fim = total
        else:
            cand = [v for v in vaos if t + MIN_T <= v <= t + teto and total - v >= MIN_T]
            alvo = min(ALVO, teto - 0.2)
            fim = min(cand, key=lambda v: abs(v - (t + alvo))) if cand else min(t + alvo, total)
        tomadas.append((t, fim, n, vis))
        t = fim
    return tomadas


def com_respiro(wav, marcas):
    """PAD s de silencio antes e depois da narracao do bloco (as marcas andam junto)."""
    p = wav[:-4] + "_pad.wav"
    ff("-i", wav, "-af", f"adelay={int(PAD * 1000)}:all=1,apad=pad_dur={PAD}", p)
    return p, [(n, a + PAD, b + PAD) for n, a, b in marcas]


def transicoes_internas(tomadas, assunto=lambda t: None):
    """Dentro do bloco: corte seco no mesmo assunto (corte na acao); fusao curta quando o assunto muda, ou numa frase
    nova depois de 2 cortes secos seguidos (o ritmo nao fica mecanico nem vira "efeito em todo corte")."""
    out, secos = [], 0
    for x, y in zip(tomadas, tomadas[1:]):
        if assunto(x) != assunto(y) or (x[2] != y[2] and secos >= 2):
            out.append(("fusao", costura.QUADROS["fusao"])); secos = 0
        else:
            out.append(("corte", 0)); secos += 1
    return out


def render_tomadas(tomadas, trans, nome):
    """Cada tomada estendida pelos quadros da fusao que vem depois dela (a fusao come esse pedaco: a soma nao muda)."""
    partes = []
    for i, (a, b, n, vis) in enumerate(tomadas):
        q = int(round(b * FPS)) - int(round(a * FPS))
        extra = trans[i][1] if i < len(trans) else 0
        if extra and vis[0] == "terc" and q + extra > int((dur(vis[1]) - vis[2]) * FPS): trans[i] = ("corte", 0); extra = 0
        p = os.path.join(TMP, f"{nome}_{i:02d}.mp4")
        video(vis, (q + extra) / FPS, p)
        partes.append(p)
    return partes


def montar_narrado(wav, tomadas, nome, saida, assunto=lambda t: None):
    trans = transicoes_internas(tomadas, assunto)
    partes = render_tomadas(tomadas, trans, nome)
    vid = os.path.join(TMP, nome + "_v.mp4")
    costura.costurar_video(partes, trans, vid, TMP, nome)
    ff("-i", vid, "-i", wav, "-f", "lavfi", "-i", TOM_SALA,
       "-filter_complex", "[1:a]apad[n];[n][2:a]amix=inputs=2:duration=first:normalize=0[a]",
       "-map", "0:v", "-map", "[a]", *VID, *AUD, "-t", f"{dur(wav):.3f}", saida)
    return trans


def bloco_narrado(ns, man, saida, rel):
    nome = f"narr{ns[0]:02d}"
    wav, marcas = com_respiro(*faixa_narrada(ns, man, nome))
    usados_bloco = {}

    def livres(n):
        lista = VISUAL.get(n) or []
        for v in lista:
            if repr(v) not in USADOS and limpo(v):
                USADOS.add(repr(v)); return v
        for v in RESERVA:
            if repr(v) not in USADOS and limpo(v):
                USADOS.add(repr(v)); rel.append(f"frase {n}: sem visual proprio sobrando, usei a reserva"); return v
        raise SystemExit(f"frase {n}: acabaram os visuais (todos ja' usados)")
    tomadas = grade_de_cortes(wav, marcas, livres)
    for i, (a, b, n, vis) in enumerate(tomadas):
        usados_bloco[i] = (n, round(b - a, 2), vis[0], os.path.basename(vis[1]))
    trans = montar_narrado(wav, tomadas, nome, saida)
    rel.append(f"{nome}: {sum(1 for t in trans if t[0] != 'corte')} fusoes em {len(trans)} cortes")
    return [("broll", f"frase {n}", d, tipo, arq) for n, d, tipo, arq in usados_bloco.values()]


# ── o CTA, em planos ────────────────────────────────────────────────────────────────────────────

def bloco_cta(saida):
    import render_cta
    cues, t = {}, 0.5
    ff("-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", "0.5", os.path.join(TMP, "cta_s0.wav"))
    linhas = ["file 'cta_s0.wav'\n"]
    for i, (txt, pausa, marca) in enumerate(CTA):
        w = voz.narrar(txt, os.path.join(TMP, f"cta{i}.wav"))
        if marca: cues[marca] = round(t + (0.9 if marca == "URL" else 0.0), 3)
        t += dur(w) + pausa
        s = os.path.join(TMP, f"cta{i}_p.wav")
        ff("-i", w, "-af", f"apad=pad_dur={pausa}", s)
        linhas.append(f"file 'cta{i}_p.wav'\n")
    cues["FIM"] = round(t + 0.8, 3)
    lst = os.path.join(TMP, "cta.txt"); open(lst, "w").writelines(linhas)
    narr = os.path.join(TMP, "cta_narracao.wav")
    ff("-f", "concat", "-safe", "0", "-i", lst, "-ac", "1", "-ar", "48000", narr)
    mg = os.path.join(TMP, "cta_mg_4k.mp4")
    if not os.path.exists(mg): render_cta.main(cues, mg, escala=1)     # mesmo texto e mesma voz = mesmo render
    # os planos: (inicio, fim, zoom, centro x, centro y) sobre o quadro 4K da cena
    B0, TI, URL, C0, FIM = cues["B0"], cues["TITEL"], cues["URL"], cues["C0"], cues["FIM"]
    planos = [(0.0, B0 * 0.52, 1.0, .5, .5),                 # as pranchas do herbario, geral
              (B0 * 0.52, B0, 1.45, .62, .45),                # fechado nas pranchas da direita
              (B0, TI, 1.25, .33, .47),                       # o livro subindo
              (TI, URL - 0.15, 1.0, .5, .5),                  # titulo, geral
              (URL - 0.15, C0, 1.55, .66, .78),               # a placa da URL
              (C0, C0 + (FIM - C0) / 2, 1.0, .5, .5),         # as paginas abrindo, geral
              (C0 + (FIM - C0) / 2, FIM, 1.3, .7, .38)]       # fechado nas paginas
    partes = []
    for i, (a, b, z, cx, cy) in enumerate(planos):
        cw, ch = 1920 / z, 1080 / z                     # o render do CTA em 1080 basta para o recorte de saida em 720
        x, y = min(max(0, 1920 * cx - cw / 2), 1920 - cw), min(max(0, 1080 * cy - ch / 2), 1080 - ch)
        p = os.path.join(TMP, f"cta_p{i}.mp4")
        ff("-ss", f"{a:.3f}", "-t", f"{b - a:.3f}", "-i", mg,
           "-vf", f"crop={cw:.0f}:{ch:.0f}:{x:.0f}:{y:.0f},scale={W}:{H}:flags=lanczos,fps={FPS},setsar=1,{GRADE_MG}", *VID, "-an", p)
        partes.append(p)
    lst = os.path.join(TMP, "cta_v.txt"); open(lst, "w").writelines(f"file '{os.path.basename(x)}'\n" for x in partes)
    vid = os.path.join(TMP, "cta_v.mp4")
    ff("-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", vid)
    ff("-i", vid, "-i", narr, "-f", "lavfi", "-i", TOM_SALA,
       "-filter_complex", "[1:a]apad[n];[n][2:a]amix=inputs=2:duration=first:normalize=0[a]",
       "-map", "0:v", "-map", "[a]", *VID, *AUD, "-t", f"{FIM:.3f}", saida)
    return [("cta", f"plano {i}", round(b - a, 2)) for i, (a, b, *_r) in enumerate(planos)]


# ── portao de acao ──────────────────────────────────────────────────────────────────────────────

def acao_do_sujeito(arq, fps=10):
    """% medio da imagem com movimento PROPRIO (o movimento de camera e' descontado por fluxo optico)."""
    import numpy as np, cv2
    w, h = 320, 180
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", arq, "-vf", f"fps={fps},scale={w}:{h}", "-f", "rawvideo",
                          "-pix_fmt", "gray", "-"], capture_output=True).stdout
    G = np.frombuffer(raw, np.uint8).reshape(-1, h, w)
    vals = []
    for a, b in zip(G[:-1], G[1:]):
        p0 = cv2.goodFeaturesToTrack(a, 300, 0.01, 6)
        if p0 is None: vals.append(0.0); continue
        p1, st, _ = cv2.calcOpticalFlowPyrLK(a, b, p0, None)
        ok = st.ravel() == 1
        M = cv2.estimateAffinePartial2D(p0[ok], p1[ok])[0] if ok.sum() >= 10 else None
        if M is None: vals.append(0.0); continue
        r = np.abs(cv2.warpAffine(a, M, (w, h), borderMode=cv2.BORDER_REPLICATE).astype(int) - b)[8:-8, 8:-8]
        vals.append(float((r > 18).mean() * 100))
    return round(float(np.mean(vals)), 2) if vals else 0.0


USADOS = set()


def main():
    os.makedirs(TMP, exist_ok=True)
    man = {p["n"]: p for p in json.load(open(os.path.join(PASTA, "manifesto.json"), encoding="utf-8"))}
    avisos, rel, blocos, tomadas, generos = [], [], [], [], []
    sec = lambda n: man.get(n, man.get(n // 10, {})).get("secao", 1)                    # noqa: E731  (170 -> 17)
    for k, b in enumerate(SEQ):
        saida = os.path.join(TMP, f"bloco{k:02d}.mp4")
        print("bloco", k, b[0], flush=True)
        if b[0] == "fala": tomadas += bloco_fala(b[1], b[2], b[4] if len(b) > 4 else man[b[1]]["texto"], saida, avisos,
                                                 b[3] if len(b) > 3 else None)
        elif b[0] == "split": tomadas += bloco_split(b[1], b[2], b[3], man[b[1]]["texto"], saida, avisos)
        elif b[0] == "narr": tomadas += bloco_narrado(b[1], man, saida, rel)
        elif b[0] == "mg":
            ff("-i", b[1], "-vf", f"scale={W}:{H},fps={FPS},setsar=1,{GRADE_MG}", *VID, *AUD, saida)
            tomadas.append(("mg", os.path.basename(b[1]), round(dur(saida), 2)))
        else: tomadas += bloco_cta(saida)
        blocos.append(saida)
        if b[0] == "narr": generos.append(("narr", sec(b[1][0]), sec(b[1][-1])))
        elif b[0] in ("fala", "split"): generos.append((b[0], sec(b[1]), sec(b[1])))
        elif b[0] == "cta": generos.append(("cta", 4, 4))
        else: generos.append(("mg", generos[-1][2], generos[-1][2]))
    json.dump({"blocos": blocos, "generos": generos}, open(os.path.join(TMP, "blocos.json"), "w"), indent=1)
    tipos = [costura.tipo_entre(x, y) for x, y in zip(generos, generos[1:])]
    feitas = costura.costurar_blocos(blocos, tipos, SAIDA, TMP)
    rel.append("transicoes entre blocos: " + ", ".join(f"{t}({q})" for t, q in feitas))
    # relatorio + portao de acao nas tomadas de b-roll
    print(f"\n{SAIDA}  {dur(SAIDA):.1f} s, {len(tomadas)} tomadas")
    ds = [t[2] for t in tomadas]
    print(f"tomada media {sum(ds) / len(ds):.2f} s · max {max(ds):.1f} s · min {min(ds):.1f} s")
    paradas = 0
    for i, t in enumerate(tomadas):
        print("  ", i, t)
    for p in sorted(x for x in os.listdir(TMP) if x.startswith("narr") and x[-7:-4].lstrip("_").isdigit() and "_v" not in x):
        a = acao_do_sujeito(os.path.join(TMP, p))
        if a < 0.5: paradas += 1; print(f"  ⚠ acao baixa ({a}%): {p}")
    print(f"portao de acao: {paradas} tomadas de b-roll sem acao do sujeito")
    for a in avisos + rel: print("  ⚠", a)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    main()
