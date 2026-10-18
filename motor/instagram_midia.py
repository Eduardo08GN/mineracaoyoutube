# -*- coding: utf-8 -*-
r"""INSTAGRAM MIDIA — baixar o Reel de origem, transcrever, montar o Reel 9:16 com legenda queimada.

    python motor/instagram_midia.py --autoteste       (precisa do ffmpeg)

    baixar(url, pasta, cookies="")        yt-dlp -> pasta/fonte.mp4
    palavras(arquivo, idioma=None)        faster-whisper com tempo por palavra -> ([{"w","ini","fim"}], idioma)
    fim_da_fala(palavras, duracao)        onde aparar a cauda de um take (o Veo devolve 8 s mesmo com fala curta)
    montar(clipes, saida)                 [(mp4, ate_s)] -> um mp4 1080x1920 30 fps, -14 LUFS
    legenda_ass(palavras)                 palavras -> legenda .ass (2 a 3 palavras por vez, centro-baixo)
    queimar(video, ass, saida)            a legenda dentro da imagem
"""
import json, os, shutil, subprocess, sys

W, H, FPS = 1080, 1920, 30
CAUDA_S = 0.35
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


def montar(clipes, saida):
    """[(mp4, ate_s)] -> um mp4 9:16 numa passada so' do ffmpeg (corte, escala, concat, loudnorm)."""
    if not clipes: raise ValueError("nenhum take para montar")
    cmd, filtros, rotulos = ["ffmpeg", "-y", "-v", "error"], [], ""
    for i, (arq, ate) in enumerate(clipes):
        cmd += ["-t", f"{ate:.2f}", "-i", arq]
        filtros.append(f"[{i}:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},"
                       f"setsar=1,format=yuv420p[v{i}]")
        filtros.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo[a{i}]")
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
    """Legenda .ass no estilo dos Reels: branca, contorno preto grosso, 2-3 palavras por vez, no centro-baixo."""
    cab = (f"[Script Info]\nScriptType: v4.00+\nPlayResX: {W}\nPlayResY: {H}\nWrapStyle: 2\n\n"
           "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, "
           "Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, "
           "Alignment, MarginL, MarginR, MarginV, Encoding\n"
           "Style: R,Arial,82,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,7,2,2,90,90,560,1\n\n"
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
    m = montar([(clipes[0], 3.0), (clipes[1], 2.5)], os.path.join(d, "sem_legenda.mp4"))
    caso("montar: duracao = soma dos cortes", abs(duracao(m) - 5.5) < 0.2)
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
    f = queimar(m, ass, os.path.join(d, "final.mp4"))
    caso("queimar: final gravado com audio", os.path.getsize(f) > 10_000 and abs(duracao(f) - 5.5) < 0.2)
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.exit(0 if _autoteste() else 1)
