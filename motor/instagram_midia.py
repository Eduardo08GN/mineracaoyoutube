# -*- coding: utf-8 -*-
r"""INSTAGRAM MIDIA — baixar o Reel de origem, transcrever, montar o Reel 9:16 com legenda queimada.

    python motor/instagram_midia.py --autoteste       (precisa do ffmpeg)

    baixar(url, pasta, cookies="")        yt-dlp -> pasta/fonte.mp4
    palavras(arquivo, idioma=None)        faster-whisper com tempo por palavra -> ([{"w","ini","fim"}], idioma)
    quadro(video, t, saida)               um quadro do video (o enquadramento de origem de cada take)
    inicio_da_fala(palavras)              de onde o take vai (corta o silencio antes da primeira palavra)
    fim_da_fala(palavras, duracao)        onde aparar a cauda de um take (o Veo devolve 8 s mesmo com fala curta)
    montar(clipes, saida)                 [(mp4, ate_s) | (mp4, de_s, ate_s)] -> um mp4 1080x1920 30 fps, -14 LUFS
    legenda_ass(palavras)                 palavras -> legenda .ass (2 a 3 palavras por vez, na base do Reel)
    queimar(video, ass, saida)            a legenda dentro da imagem
    queimar_estilo(video, palavras, saida, n, cta)   a legenda no estilo N do OW Agente (2 = PILULA)
"""
import json, os, shutil, subprocess, sys

W, H, FPS = 1080, 1920, 30
CAUDA_S = 0.35
RESPIRO_S = 0.15
# ⭐ (18/10, ordem do Eduardo) a legenda fica SEMPRE na posicao mais baixa do Reel: a base do cartao em 82% da altura.
#    Mais baixo que isso ela entra embaixo da descricao, do @ e dos botoes que o Instagram poe por cima do video.
#    A base (nao o centro) e' que fica fixa: cartao de 2 linhas cresce para cima, nunca para dentro da faixa do app.
# ⭐ (26/10, ordem do Eduardo) "um pouco mais baixa": a base desceu de 82% para 85% da altura.
BASE_LEGENDA = 0.85
# ⭐ (26/10, ordem do Eduardo) no take do CTA a legenda fica menor e mais baixa: o livro na mao e o cartaz do CTA no alto
#    ja' enchem o quadro. ⛔ Nao desce mais que isso: abaixo de ~90% entra embaixo do @, da descricao e da musica do app.
BASE_LEGENDA_CTA = 0.89
ESCALA_LEGENDA_CTA = 0.75
# ⭐ (19/10, ordem do Eduardo) cada take entra no Reel a 1,11x, com +-5% de variacao sorteada por take: o ritmo fica
#    mais vivo e nao soa como o mesmo acelerador aplicado igual no video inteiro.
VELOCIDADE = 1.11
JITTER = 0.05
_SEM_JANELA = {"creationflags": 0x08000000} if os.name == "nt" else {}
_modelo = {}


def _rodar(cmd, cwd=None, timeout=900):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace",
                       timeout=timeout, **_SEM_JANELA)
    if r.returncode:
        raise RuntimeError(f"{os.path.basename(cmd[0])} falhou: " + (r.stderr or r.stdout).strip()[-400:])
    return r.stdout


def duracao(arq):
    out = _rodar(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", arq])
    return float(json.loads(out)["format"]["duration"])


def baixar(url, pasta, cookies=""):
    """O Reel de origem em pasta/fonte.mp4. ⭐ O Instagram as vezes pede login: `cookies` = um cookies.txt."""
    os.makedirs(pasta, exist_ok=True)
    exe = shutil.which("yt-dlp")
    cmd = [exe] if exe else [sys.executable, "-m", "yt_dlp"]
    cmd += ["-f", "mp4/bv*+ba/b", "--merge-output-format", "mp4", "--no-playlist", "-o",
            os.path.join(pasta, "fonte.%(ext)s"), url]
    if cookies: cmd[1:1] = ["--cookies", cookies]
    _rodar(cmd, timeout=300)
    arq = os.path.join(pasta, "fonte.mp4")
    if not os.path.isfile(arq): raise RuntimeError("o yt-dlp não gravou o vídeo (o link é de um Reel público?)")
    return arq


def palavras(arquivo, idioma=None, modelo="small"):
    """([{"w", "ini", "fim"}], idioma detectado). faster-whisper na CPU, VAD ligado."""
    from faster_whisper import WhisperModel
    if modelo not in _modelo:
        _modelo[modelo] = WhisperModel(modelo, device="cpu", compute_type="int8", cpu_threads=8)
    segs, info = _modelo[modelo].transcribe(arquivo, language=idioma, word_timestamps=True, vad_filter=True)
    saida = [{"w": w.word.strip(), "ini": round(w.start, 2), "fim": round(w.end, 2)}
             for s in segs for w in (s.words or []) if w.word.strip()]
    return saida, info.language


def fim_da_fala(pals, dur):
    """Ate' onde o take vai: a ultima palavra + uma respiracao; sem fala, o clipe inteiro."""
    if not pals: return round(dur, 2)
    return round(min(dur, max(1.0, pals[-1]["fim"] + CAUDA_S)), 2)


def inicio_da_fala(pals):
    """De onde o take vai: um respiro antes da primeira palavra. ⭐ O silencio de abertura so' existe para a primeira
    consoante sair inteira no Veo; no Reel ele so' alonga (no run de 18/10, 9 takes = 64 s para 36 s de origem)."""
    if not pals: return 0.0
    return round(max(0.0, pals[0]["ini"] - RESPIRO_S), 2)


def alinhar(fala, pals, ate, inicio=0.0):
    """As palavras do ROTEIRO com o tempo da fala medida pelo whisper no take.

    ⭐ O whisper erra grafia (acento, nome proprio, a palavra do CTA); o texto do take e' conhecido. Entao o whisper
    da' so' a janela [primeira palavra, ultima palavra] e as palavras do roteiro se espalham nela pelo tamanho de
    cada uma. Sem fala medida, a janela e' o take inteiro menos o respiro. `inicio` desloca para o tempo do Reel."""
    palavras = fala.split()
    if not palavras: return []
    a, b = (pals[0]["ini"], pals[-1]["fim"]) if pals else (0.5, max(0.8, ate - 0.3))
    b = min(b, ate)
    pesos = [len(w) + 1 for w in palavras]
    total, t, saida = sum(pesos), a, []
    for w, p in zip(palavras, pesos):
        d = (b - a) * p / total
        saida.append({"w": w, "ini": round(inicio + t, 2), "fim": round(inicio + t + d, 2)})
        t += d
    return saida


def quadro(video, t, saida):
    """Um quadro do video no segundo `t` (JPG): o enquadramento de origem de um take."""
    _rodar(["ffmpeg", "-y", "-v", "error", "-ss", f"{max(0.0, t):.2f}", "-i", video, "-frames:v", "1", "-q:v", "2", saida])
    if not os.path.isfile(saida): raise RuntimeError(f"o ffmpeg não tirou o quadro de {t:.1f} s")
    return saida


def velocidade(chave):
    """A velocidade de um take no Reel: VELOCIDADE com JITTER para cima ou para baixo, sorteada pela `chave` (o mesmo
    take na mesma versao sai sempre na mesma velocidade: remontar nao muda o ritmo)."""
    import random
    return round(VELOCIDADE * (1 + random.Random(str(chave)).uniform(-JITTER, JITTER)), 4)


def montar(clipes, saida):
    """[(mp4, ate_s) | (mp4, de_s, ate_s) | (mp4, de_s, ate_s, velocidade)] -> um mp4 9:16 numa passada so' do ffmpeg
    (corte, velocidade, escala, concat, loudnorm). A velocidade acelera imagem e voz juntas, sem mudar o tom."""
    if not clipes: raise ValueError("nenhum take para montar")
    cmd, filtros, rotulos = ["ffmpeg", "-y", "-v", "error"], [], ""
    for i, c in enumerate(clipes):
        arq, de, ate, vel = (c[0], 0.0, c[1], 1.0) if len(c) == 2 else (*c, 1.0) if len(c) == 3 else c
        cmd += ["-ss", f"{de:.2f}", "-t", f"{ate - de:.2f}", "-i", arq]
        filtros.append(f"[{i}:v]setpts=(PTS-STARTPTS)/{vel:.4f},scale={W}:{H}:force_original_aspect_ratio=increase,"
                       f"crop={W}:{H},fps={FPS},setsar=1,format=yuv420p[v{i}]")
        filtros.append(f"[{i}:a]asetpts=PTS-STARTPTS,atempo={vel:.4f},aresample=48000,aformat=channel_layouts=stereo[a{i}]")
        rotulos += f"[v{i}][a{i}]"
    filtros.append(f"{rotulos}concat=n={len(clipes)}:v=1:a=1[v][a0]")
    filtros.append("[a0]loudnorm=I=-14:TP=-1.5:LRA=11[a]")
    cmd += ["-filter_complex", ";".join(filtros), "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "medium",
            "-crf", "20", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-movflags", "+faststart", saida]
    _rodar(cmd)
    return saida


def _tempo(s):
    h, r = divmod(max(0.0, s), 3600)
    m, s = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def _blocos(pals, max_palavras=3, max_s=1.6):
    bloco = []
    for p in pals:
        if bloco and (len(bloco) >= max_palavras or p["fim"] - bloco[0]["ini"] > max_s or p["ini"] - bloco[-1]["fim"] > 0.6):
            yield bloco; bloco = []
        bloco.append(p)
        if p["w"][-1:] in ".!?,": yield bloco; bloco = []
    if bloco: yield bloco


def legenda_ass(pals):
    """Legenda .ass no estilo dos Reels: branca, contorno preto grosso, 2-3 palavras por vez, na base do Reel (BASE_LEGENDA)."""
    cab = (f"[Script Info]\nScriptType: v4.00+\nPlayResX: {W}\nPlayResY: {H}\nWrapStyle: 2\n\n"
           "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, "
           "Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, "
           "Alignment, MarginL, MarginR, MarginV, Encoding\n"
           "Style: R,Arial,82,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,7,2,2,90,90,"
           f"{round(H * (1 - BASE_LEGENDA))},1\n\n"
           "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n")
    linhas, blocos = [], list(_blocos(pals))
    for i, b in enumerate(blocos):
        texto = " ".join(p["w"] for p in b).strip().rstrip(",")
        texto = texto.replace("{", "(").replace("}", ")").replace("\\", "/")
        fim = b[-1]["fim"] + 0.08
        if i + 1 < len(blocos): fim = min(fim, blocos[i + 1][0]["ini"])      # ⛔ duas linhas nunca na tela juntas
        linhas.append(f"Dialogue: 0,{_tempo(b[0]['ini'])},{_tempo(fim)},R,,0,0,0,,{texto}")
    return cab + "\n".join(linhas) + "\n"


def queimar(video, ass_texto, saida):
    """A legenda dentro da imagem. ⛔ O filtro `subtitles` do ffmpeg engasga com o caminho do Windows (C:): roda
    na pasta do video com o nome curto do .ass."""
    pasta = os.path.dirname(os.path.abspath(saida))
    open(os.path.join(pasta, "legenda.ass"), "w", encoding="utf-8").write(ass_texto)
    _rodar(["ffmpeg", "-y", "-v", "error", "-i", os.path.abspath(video), "-vf", "subtitles=legenda.ass",
            "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-c:a", "copy", "-movflags", "+faststart",
            os.path.abspath(saida)], cwd=pasta)
    return saida


# ── a legenda nos estilos do OW Agente (o mesmo pool numerado do /produzir: 1 CLASSICA, 2 PILULA...) ──
OW_MOTOR = r"C:\Users\edlut\ow_agente\organic-wave-studio\motor"


def _ow_legendas():
    if OW_MOTOR not in sys.path: sys.path.insert(0, OW_MOTOR)
    import legendas
    return legendas


def estilos_legenda():
    """{numero: "NOME, desc"} do pool do OW Agente; {} se o OW nao estiver nesta maquina."""
    try:
        return {e["numero"]: f'{e["nome"].title()}, {e["desc"]}' for e in _ow_legendas().ESTILOS}
    except ImportError:
        return {}


def _juntar_cta(pals, cta):
    """⭐ CTA de varias palavras ("eu quero") vira UMA peca do cartao: o destaque do OW casa a peca inteira."""
    alvo = cta.lower().split()
    if len(alvo) < 2: return pals
    limpa = lambda w: "".join(c for c in w.lower() if c.isalnum())                       # noqa: E731
    saida, i = [], 0
    while i < len(pals):
        trecho = pals[i:i + len(alvo)]
        if len(trecho) == len(alvo) and [limpa(p["w"]) for p in trecho] == [limpa(a) for a in alvo]:
            saida.append({"w": " ".join(p["w"] for p in trecho), "ini": trecho[0]["ini"], "fim": trecho[-1]["fim"]})
            i += len(alvo)
        else:
            saida.append(pals[i]); i += 1
    return saida


def queimar_estilo(video, pals, saida, estilo, cta="", cta_ini=None):
    """A legenda no estilo N do OW Agente: cartoes de ate' 3 palavras, a palavra falada em realce e, na frase do
    CTA, so' o CTA em destaque. Cada cartao e' um PNG (legendas.png_cartao) posto por cima no tempo da palavra.
    `cta_ini` = o segundo em que comeca o take do CTA: dali em diante o cartao sai menor e mais baixo."""
    leg = _ow_legendas()
    est = leg.POR_NUMERO[int(estilo)]
    pasta = os.path.dirname(os.path.abspath(saida))
    sub = os.path.join(pasta, "cartoes")
    shutil.rmtree(sub, ignore_errors=True); os.makedirs(sub, exist_ok=True)
    fora, blocos = [], list(_blocos(_juntar_cta(pals, cta)))
    for b_i, b in enumerate(blocos):
        fim_bloco = b[-1]["fim"] + 0.08
        if b_i + 1 < len(blocos): fim_bloco = min(fim_bloco, blocos[b_i + 1][0]["ini"])  # ⛔ um cartao por vez
        pecas = [p["w"].strip(",.!?;:") for p in b]
        for j, p in enumerate(b):
            png = os.path.join(sub, f"c{len(fora):03d}.png")
            no_cta = cta_ini is not None and b[0]["ini"] >= cta_ini - 0.05
            escala, base = (ESCALA_LEGENDA_CTA, BASE_LEGENDA_CTA) if no_cta else (1.0, BASE_LEGENDA)
            w, h = leg.png_cartao(pecas, j, est["alt"] * H * escala, png, W, int(W * 0.88), cta, est)
            x = min(max(int(W / 2 - w / 2), int(W * 0.02)), int(W * 0.98) - w)
            t0 = p["ini"] if j else b[0]["ini"]
            t1 = b[j + 1]["ini"] if j + 1 < len(b) else fim_bloco
            if t1 > t0: fora.append((os.path.relpath(png, pasta), x, int(base * H - h), t0, t1))
    if not fora: return queimar(video, legenda_ass(pals), saida)
    cmd, filtros, cur = ["ffmpeg", "-y", "-v", "error", "-i", os.path.abspath(video)], [], "0:v"
    for i, (png, x, y, t0, t1) in enumerate(fora, 1):
        cmd += ["-i", png]
        filtros.append(f"[{cur}][{i}:v]overlay={x}:{y}:enable='between(t,{t0:.3f},{t1:.3f})'[v{i}]")
        cur = f"v{i}"
    script = os.path.join(pasta, "cartoes.txt")              # ⛔ o filtro inteiro na linha de comando passa do limite
    open(script, "w", encoding="utf-8").write(";".join(filtros))
    cmd += ["-filter_complex_script", "cartoes.txt", "-map", f"[{cur}]", "-map", "0:a?", "-c:v", "libx264",
            "-preset", "medium", "-crf", "20", "-c:a", "copy", "-movflags", "+faststart", os.path.abspath(saida)]
    _rodar(cmd, cwd=pasta)
    return saida


# ⭐⭐ (26/10, ordem do Eduardo) o CTA queimado no take final, como no Reel de referencia do canal: a chamada em branco,
#    a palavra do comentario grande em amarelo e tres setas vermelhas apontando para os comentarios, no alto do quadro
#    (a legenda fica embaixo, a 85%)
# ⭐ (26/10, Eduardo) a chamada pede para seguir antes de comentar, como a fala do CTA
CHAMADA_CTA = {"pt": "ME SIGA E COMENTE!", "es": "¡SÍGUEME Y COMENTA!", "es-es": "¡SÍGUEME Y COMENTA!",
               "en": "FOLLOW & COMMENT", "fr": "ABONNE-TOI ET COMMENTE !", "de": "FOLGE MIR & KOMMENTIERE!"}
FONTE_CTA = r"C:\Windows\Fonts\ariblk.ttf"
TOPO_CTA = 0.04


def cartaz_cta(chamada, palavra, saida):
    """O PNG transparente 1080x1920 do CTA: chamada, palavra e setas. Devolve o caminho."""
    from PIL import Image, ImageDraw, ImageFont
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    fonte = lambda t: ImageFont.truetype(FONTE_CTA if os.path.isfile(FONTE_CTA) else "arialbd.ttf", t)  # noqa: E731
    y = int(TOPO_CTA * H)
    t1 = 64
    while t1 > 36 and d.textlength(chamada, font=fonte(t1)) > W * 0.9: t1 -= 2     # chamada longa (alemao) encolhe
    d.text((W // 2, y), chamada, font=fonte(t1), fill="white", anchor="mt", stroke_width=8, stroke_fill="black")
    y += 84
    tam = 160
    while tam > 70 and d.textlength(palavra, font=fonte(tam)) > W * 0.86: tam -= 6
    d.text((W // 2, y), palavra, font=fonte(tam), fill=(255, 214, 0), anchor="mt", stroke_width=11, stroke_fill="black")
    y += int(tam * 1.05)
    for cx in (W // 2 - 260, W // 2, W // 2 + 260):                     # tres setas vermelhas para baixo
        haste = [(cx - 10, y), (cx + 10, y), (cx + 10, y + 22), (cx - 10, y + 22)]
        ponta = [(cx - 30, y + 20), (cx + 30, y + 20), (cx, y + 58)]
        for forma in (haste, ponta): d.polygon(forma, fill=(230, 30, 30), outline="white", width=4)
    os.makedirs(os.path.dirname(os.path.abspath(saida)), exist_ok=True)
    im.save(saida)
    return saida


def queimar_cartaz(video, png, t0, t1, saida):
    """O cartaz do CTA por cima do video, so' entre t0 e t1 (o take do CTA no Reel)."""
    _rodar(["ffmpeg", "-y", "-v", "error", "-i", os.path.abspath(video), "-i", os.path.abspath(png), "-filter_complex",
            f"[0:v][1:v]overlay=0:0:enable='between(t,{t0:.3f},{t1:.3f})'[v]", "-map", "[v]", "-map", "0:a?",
            "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-c:a", "copy", "-movflags", "+faststart",
            os.path.abspath(saida)])
    return saida


def _autoteste():
    import tempfile
    ok = True

    def caso(nome, cond):
        nonlocal ok; print(("  OK  " if cond else "  ERRO"), nome); ok &= bool(cond)

    d = tempfile.mkdtemp(prefix="min-ig-midia-")
    clipes = []
    for i, (cor, w, h) in enumerate([("red", 720, 1280), ("blue", 1280, 720)]):
        arq = os.path.join(d, f"take_{i}.mp4")
        _rodar(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", f"color={cor}:s={w}x{h}:d=8:r=24",
                "-f", "lavfi", "-i", "sine=frequency=440:duration=8", "-shortest", "-c:v", "libx264", "-c:a", "aac", arq])
        clipes.append(arq)
    caso("fim_da_fala: ultima palavra + respiro", fim_da_fala([{"w": "a", "ini": 0.5, "fim": 4.0}], 8.0) == 4.35)
    caso("fim_da_fala: sem fala = clipe inteiro", fim_da_fala([], 8.0) == 8.0)
    caso("fim_da_fala: nunca passa da duracao", fim_da_fala([{"w": "a", "ini": 0, "fim": 7.9}], 8.0) == 8.0)
    al = alinhar("Comente gengibre, e eu te mando", [{"w": "Comenti", "ini": 0.6, "fim": 1.0},
                                                   {"w": "mandu", "ini": 2.8, "fim": 3.2}], 3.55, inicio=10.0)
    caso("⭐ alinhar: a grafia vem do roteiro", [p["w"] for p in al] == ["Comente", "gengibre,", "e", "eu", "te", "mando"])
    caso("⭐ alinhar: dentro da janela medida, deslocado para o Reel", al[0]["ini"] == 10.6 and al[-1]["fim"] == 13.2
         and all(x["fim"] <= y["ini"] + 0.01 for x, y in zip(al, al[1:])))
    caso("alinhar: palavra maior fica mais tempo", al[1]["fim"] - al[1]["ini"] > al[2]["fim"] - al[2]["ini"])
    caso("alinhar: sem fala medida usa o take", alinhar("Oi", [], 4.0)[0]["ini"] == 0.5)
    m = montar([(clipes[0], 3.0), (clipes[1], 0.5, 3.0)], os.path.join(d, "sem_legenda.mp4"))
    caso("inicio_da_fala: um respiro antes da primeira palavra", inicio_da_fala([{"w": "Oi", "ini": 0.9, "fim": 1.2}]) == 0.75
         and inicio_da_fala([{"w": "Oi", "ini": 0.05, "fim": 0.3}]) == 0.0 and inicio_da_fala([]) == 0.0)
    caso("montar: duracao = soma dos cortes", abs(duracao(m) - 5.5) < 0.2)
    vs = [velocidade(f"reel-{n}-v1") for n in range(40)]
    caso("⭐ velocidade: 1,11x com +-5%, varia entre takes e repete no mesmo take",
         all(1.11 * 0.95 <= v <= 1.11 * 1.05 for v in vs) and len(set(vs)) > 30 and velocidade("reel-3-v1") == velocidade("reel-3-v1"))
    mv = montar([(clipes[0], 0.0, 3.0, 1.2), (clipes[1], 0.5, 3.0, 1.0)], os.path.join(d, "rapido.mp4"))
    caso("⭐ montar com velocidade: o take acelerado encurta, com audio", abs(duracao(mv) - (3.0 / 1.2 + 2.5)) < 0.2
         and "audio" in _rodar(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type", "-of", "csv=p=0", mv]))
    info = json.loads(_rodar(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                              "stream=width,height", "-of", "json", m]))["streams"][0]
    caso("⭐ montar: 1080x1920 mesmo com take deitado", (info["width"], info["height"]) == (W, H))
    pals = [{"w": "Você", "ini": 0.2, "fim": 0.5}, {"w": "sabia", "ini": 0.5, "fim": 0.9},
            {"w": "que", "ini": 0.9, "fim": 1.0}, {"w": "o", "ini": 1.0, "fim": 1.1}, {"w": "gengibre,", "ini": 1.1, "fim": 1.6},
            {"w": "{x}", "ini": 3.0, "fim": 3.3}]
    ass = legenda_ass(pals)
    caso("legenda: no maximo 3 palavras por linha", all(len(l.split(",,")[-1].split()) <= 3
                                                       for l in ass.splitlines() if l.startswith("Dialogue")))
    caso("legenda: virgula fecha o bloco", "Dialogue: 0,0:00:01.00,0:00:01.68,R,,0,0,0,,o gengibre" in ass)
    tempos = [l.split(",")[1:3] for l in ass.splitlines() if l.startswith("Dialogue")]
    caso("⛔ legenda: uma linha so' por vez", all(a[1] <= b[0] for a, b in zip(tempos, tempos[1:])))
    caso("⛔ legenda: chaves nao viram comando do ASS", "{x}" not in ass.split("[Events]")[1])
    caso("⭐ legenda simples na base do Reel (85% da altura)", ",90,90,288,1" in ass)
    f = queimar(m, ass, os.path.join(d, "final.mp4"))
    caso("queimar: final gravado com audio", os.path.getsize(f) > 10_000 and abs(duracao(f) - 5.5) < 0.2)
    cta = [{"w": w, "ini": 2 + i * 0.4, "fim": 2 + i * 0.4 + 0.35} for i, w in enumerate("Comente eu quero, aqui".split())]
    junto = _juntar_cta(cta, "eu quero")
    caso("⭐ CTA de duas palavras vira uma peca so'", [p["w"] for p in junto] == ["Comente", "eu quero,", "aqui"]
         and junto[1]["ini"] == 2.4 and junto[1]["fim"] == 3.15)
    caso("CTA de uma palavra nao mexe nas palavras", _juntar_cta(cta, "yes") == cta)
    if 2 in estilos_legenda():
        f2 = queimar_estilo(m, pals[:5] + cta, os.path.join(d, "estilo", "final.mp4"), 2, "eu quero")
        caso("⭐ legenda estilo 2 (PILULA) queimada, com audio", abs(duracao(f2) - 5.5) < 0.2
             and len(os.listdir(os.path.join(d, "estilo", "cartoes"))) == 8)
        filtro = open(os.path.join(d, "estilo", "cartoes.txt"), encoding="utf-8").read()
        from PIL import Image
        alt = Image.open(os.path.join(d, "estilo", "cartoes", "c000.png")).size[1]
        caso("⭐ legenda estilo 2: a base do cartao em 85% da altura", f":{int(BASE_LEGENDA * H - alt)}:enable" in filtro)
    from PIL import Image
    png = cartaz_cta(CHAMADA_CTA["pt"], "EU QUERO", os.path.join(d, "cartaz.png"))
    caixa = Image.open(png).getbbox()
    caso("⭐ (26/10) cartaz do CTA: transparente, no alto do quadro, longe da legenda",
         Image.open(png).size == (W, H) and caixa[1] >= int(TOPO_CTA * H) - 20 and caixa[3] < 0.24 * H)
    fc = queimar_cartaz(f, png, 3.0, 5.0, os.path.join(d, "final_cta.mp4"))
    if 2 in estilos_legenda():
        queimar_estilo(m, pals[:5] + cta, os.path.join(d, "estilo_cta", "final.mp4"), 2, "eu quero", cta_ini=2.0)
        fil = open(os.path.join(d, "estilo_cta", "cartoes.txt"), encoding="utf-8").read().split(";")
        ys = [int(x.split("overlay=")[1].split(":")[1]) for x in fil]
        hs = [Image.open(os.path.join(d, "estilo_cta", "cartoes", f"c{i:03d}.png")).size[1] for i in range(len(fil))]
        caso("⭐ (26/10) no take do CTA a legenda sai menor e mais baixa (base a 89%)",
             hs[-1] < hs[0] and ys[-1] + hs[-1] == int(BASE_LEGENDA_CTA * H) and ys[0] + hs[0] == int(BASE_LEGENDA * H))
    caso("⭐ cartaz do CTA queimado so' no fim, com audio", abs(duracao(fc) - duracao(f)) < 0.2)
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.exit(0 if _autoteste() else 1)
