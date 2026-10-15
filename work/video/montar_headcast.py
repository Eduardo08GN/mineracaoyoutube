# MONTAGEM DO MODO HEADCAST (Mama Pearline): uma imagem por plano com zoom lento, o avatar (take do Omni, com a voz
# e a boca dele) nas falas de falas_avatar.json, tela dividida 45% (avatar) + 55% (imagem), corte seco, 720p, -16 LUFS.
# A narracao entre as falas do avatar: Kokoro (af_heart) com o tempo de cada palavra, levada ao timbre da Opal
# (OpenVoice v2, tau 0,3, voz/opal_se.pth tirado do take do Omni) -> narrador e avatar soam como uma pessoa so'.
#   python work/video/montar_headcast.py <pasta do projeto> [voz|montar]
import json
import os
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
W, H, FPS = 1280, 720, 30
VOZ_KOKORO, VELOCIDADE = "af_heart", 0.8
FAIXA_SPLIT = 0.45
VID = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-r", str(FPS)]
SR = 48000


def ff(*a):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *a], check=True)


def dur(arq):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arq],
                                capture_output=True, text=True).stdout)


def _limpa(w):
    return re.sub(r"[^a-z0-9']", "", w.lower())


def linha_do_tempo(proj):
    """Segmentos em ordem: ("fala", fala) ou ("trecho", [indices de palavra]) com a palavra -> plano."""
    import headcast as hc
    planos = json.load(open(os.path.join(proj, "planos.json"), encoding="utf-8"))
    falas = [f for f in json.load(open(os.path.join(proj, "falas_avatar.json"), encoding="utf-8"))
             if os.path.exists(os.path.join(proj, "avatar", f["k"] + ".mp4"))]      # fala sem take: vira narracao
    Wd = hc.palavras_dos_planos(planos)
    segs, i = [], 0
    for f in falas + [{"ini": len(Wd), "fim": len(Wd) - 1}]:
        if f["ini"] > i: segs.append(("trecho", list(range(i, f["ini"]))))
        if "k" in f: segs.append(("fala", f))
        i = f["fim"] + 1
    return planos, Wd, segs


# ── voz ──
def _kokoro(texto, saida):
    """Sintetiza `texto` e devolve [(palavra, inicio_s)] (o Kokoro informa o tempo de cada token)."""
    import soundfile as sf
    from kokoro import KPipeline
    if not hasattr(_kokoro, "p"): _kokoro.p = KPipeline(lang_code="a")
    audios, marcas, off = [], [], 0.0
    for r in _kokoro.p(texto, voice=VOZ_KOKORO, speed=VELOCIDADE):
        a = r.audio.numpy() if hasattr(r.audio, "numpy") else np.asarray(r.audio)
        for t in (r.tokens or []):
            if t.start_ts is not None and _limpa(t.text): marcas.append((t.text, off + t.start_ts))
        audios.append(a); off += len(a) / 24000
    sf.write(saida, np.concatenate(audios), 24000)
    return marcas


def etapa_voz_minimax(proj, limite=None):
    """(Eduardo, 13/10) A narracao sai da voz clonada "Mamaw Opal" no MiniMax (clone feito com a voz que o Omni deu a
    ela nos takes) pela sessao web logada no perfil Dolphin 12 Ivone (speech-2.8-turbo, 0,6 credito/caractere). O tempo
    de cada palavra vem do Whisper (a pagina nao informa)."""
    import mm, ivone
    from playwright.sync_api import sync_playwright
    from faster_whisper import WhisperModel
    planos, Wd, segs = linha_do_tempo(proj)
    pasta = os.path.join(proj, "voz", "minimax"); os.makedirs(pasta, exist_ok=True)
    wm = WhisperModel(os.path.join(os.environ.get("FW_DIR", r"D:\modelos"), "fw_small_en"),
                      device="cpu", compute_type="int8")
    feitos = 0
    with sync_playwright() as p:
        pg = mm.aba(ivone.conectar(p)); pg.bring_to_front()
        for k, (tipo, x) in enumerate(segs):
            if tipo != "trecho": continue
            base = os.path.join(pasta, f"w{x[0]:05d}_{x[-1]:05d}")
            if os.path.exists(base + ".json"): continue
            if limite and feitos >= limite: break
            texto = " ".join(Wd[i][0] for i in x)
            c0, c1, ach = mm.gerar_tts(pg, texto, base + ".mp3")
            ff("-i", base + ".mp3", "-ac", "1", "-ar", str(SR), base + ".wav")
            ff("-i", base + ".wav", "-ac", "1", "-ar", "16000", base + "_16k.wav")
            ws = [w for s_ in wm.transcribe(base + "_16k.wav", language="en", word_timestamps=True)[0]
                  for w in (s_.words or [])]
            inicios, j = [], 0
            for i in x:
                alvo = _limpa(Wd[i][0]); achou = None
                for jj in range(j, min(j + 6, len(ws))):
                    wj = _limpa(ws[jj].word)
                    if wj == alvo or (alvo and wj and alvo[:4] == wj[:4]): achou = jj; break
                if achou is not None: inicios.append(ws[achou].start); j = achou + 1
                else: inicios.append(inicios[-1] if inicios else 0.0)
            json.dump({"palavras": x, "inicios": inicios, "dur": dur(base + ".wav"), "creditos": [c0, c1]},
                      open(base + ".json", "w"))
            feitos += 1
            print(f"voz {x[0]:05d}: {len(texto)} car, {dur(base + '.wav'):.1f}s, creditos {c0} -> {c1} | {ach[:1]}",
                  flush=True)


def etapa_voz(proj):
    import torch
    import voz_conrad as vc
    planos, Wd, segs = linha_do_tempo(proj)
    if os.environ.get("HC_SEGS"): segs = segs[:int(os.environ["HC_SEGS"])]
    pasta = os.path.join(proj, "voz", "trechos"); os.makedirs(pasta, exist_ok=True)
    tc, _ = vc._tc()
    alvo = torch.load(os.path.join(proj, "voz", "opal_se.pth"))
    for k, (tipo, x) in enumerate(segs):
        if tipo != "trecho": continue
        base = os.path.join(pasta, f"w{x[0]:05d}_{x[-1]:05d}")
        if os.path.exists(base + ".json"): continue
        texto = " ".join(Wd[i][0] for i in x)
        marcas = _kokoro(texto, base + "_k.wav")
        tc.convert(audio_src_path=base + "_k.wav", src_se=tc.extract_se([base + "_k.wav"]), tgt_se=alvo,
                   output_path=base + ".wav", tau=0.3)
        # palavra do roteiro -> inicio na fala (alinhamento sequencial pelos tokens do Kokoro)
        inicios, j = [], 0
        for i in x:
            alvo_w = _limpa(Wd[i][0])
            while j < len(marcas) and _limpa(marcas[j][0]) != alvo_w and alvo_w: j += 1
            inicios.append(marcas[j][1] if j < len(marcas) else (inicios[-1] if inicios else 0.0))
            j = min(j + 1, len(marcas))
        json.dump({"palavras": x, "inicios": inicios, "dur": dur(base + ".wav")}, open(base + ".json", "w"))
        print(f"voz {x[0]:05d}: {len(x)} palavras, {dur(base + '.wav'):.1f}s", flush=True)


# ── video ──
def _clipe_imagem(img, d, saida, k):
    """Imagem parada com movimento lento (zoom in/out e deriva alternados), d segundos exatos. Se a imagem tem
    animacao (animacoes/NNNN.mp4, Vids Animar), usa o trecho do meio dela no lugar do zoom (sem som)."""
    n = max(1, round(d * FPS))
    anim = img.replace(os.sep + "imagens" + os.sep, os.sep + "animacoes" + os.sep)[:-4] + ".mp4"
    if os.environ.get("HC_ANIMAR") and os.path.exists(anim) and d <= dur(anim) - 0.6:   # (Eduardo, 13/10) sem animacao
        ini = max(0.5, (dur(anim) - d) / 2)
        ff("-ss", f"{ini:.3f}", "-i", anim, "-t", f"{d:.3f}", "-vf",
           f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},eq=saturation=0.92,format=yuv420p",
           "-frames:v", str(n), *VID, "-an", saida)
        return
    modos = [("1+0.06*on/{n}", "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"),
             ("1.06-0.06*on/{n}", "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"),
             ("1.05", "(iw-iw/zoom)*on/{n}", "ih/2-(ih/zoom/2)"),
             ("1.05", "(iw-iw/zoom)*(1-on/{n})", "ih/2-(ih/zoom/2)")]
    z, x, y = (m.format(n=n) for m in modos[k % 4])
    ff("-loop", "1", "-i", img, "-vf",
       f"scale=2560:1440:force_original_aspect_ratio=increase,crop=2560:1440,"
       f"zoompan=z='{z}':x='{x}':y='{y}':d={n}:s={W}x{H}:fps={FPS},"
       f"eq=saturation=0.92,noise=alls=3:allf=t,format=yuv420p",
       "-frames:v", str(n), *VID, "-an", saida)


def _janela_fala(arq):
    """[inicio, fim] da fala no take (Whisper), com folga."""
    from faster_whisper import WhisperModel
    if not hasattr(_janela_fala, "m"):
        _janela_fala.m = WhisperModel(os.path.join(os.environ.get("FW_DIR", r"D:\modelos"), "fw_small_en"),
                                      device="cpu", compute_type="int8")
    wav = arq[:-4] + "_16k.wav"
    ff("-i", arq, "-ac", "1", "-ar", "16000", wav)
    s = list(_janela_fala.m.transcribe(wav, vad_filter=True)[0])
    if not s: return 0.0, dur(arq)
    return max(0.0, s[0].start - 0.15), min(dur(arq), s[-1].end + 0.35)


def montar(proj):
    planos, Wd, segs = linha_do_tempo(proj)
    if os.environ.get("HC_SEGS"): segs = segs[:int(os.environ["HC_SEGS"])]          # previa: so' o comeco
    por_n = {p["n"]: p for p in planos}
    tmp = os.path.join(proj, "video", "tmp"); os.makedirs(tmp, exist_ok=True)
    img_de = lambda n: os.path.join(proj, "imagens", f"{n:04d}.png")
    tarefas, ordem, audio = [], [], []          # audio: [(arquivo wav, ini, fim)] na ordem
    ultima_img = None
    for k, (tipo, x) in enumerate(segs):
        if tipo == "trecho":
            base = os.path.join(proj, "voz", "minimax", f"w{x[0]:05d}_{x[-1]:05d}")
            m = json.load(open(base + ".json"))
            # tempo de cada plano: do 1o palavra dele ate' a 1a palavra do proximo
            cortes = []
            for i, ini in zip(m["palavras"], m["inicios"]):
                n = Wd[i][1]
                if not cortes or cortes[-1][0] != n: cortes.append([n, ini])
            cortes[0][1] = 0.0
            for c, (n, ini) in enumerate(cortes):
                fim = cortes[c + 1][1] if c + 1 < len(cortes) else m["dur"]
                d = round((fim - ini) * FPS) / FPS
                if d <= 0: continue
                img = img_de(n) if os.path.exists(img_de(n)) else ultima_img
                if img is None: continue
                ultima_img = img
                saida = os.path.join(tmp, f"s{k:03d}_{c:02d}.mp4")
                tarefas.append((img, d, saida, len(tarefas))); ordem.append(saida)
            audio.append((base + ".wav", 0.0, m["dur"]))
        else:
            f = x
            take = os.path.join(proj, "avatar", f["k"] + ".mp4")
            a, b = _janela_fala(take)
            d = round((b - a) * FPS) / FPS
            saida = os.path.join(tmp, f"s{k:03d}_{f['k']}.mp4")
            if not os.path.exists(saida):
                if f["tipo"] == "split":
                    n0 = Wd[f["ini"]][1]
                    img = img_de(n0) if os.path.exists(img_de(n0)) else ultima_img
                    fx = int(W * FAIXA_SPLIT) // 2 * 2
                    ff("-ss", f"{a:.3f}", "-t", f"{d:.3f}", "-i", take, "-loop", "1", "-t", f"{d:.3f}", "-i", img,
                       "-filter_complex",
                       f"[0:v]scale={W}:{H},crop={fx}:{H}:(iw-{fx})/2:0[e];"
                       f"[1:v]scale={W - fx}:{H}:force_original_aspect_ratio=increase,crop={W - fx}:{H},setsar=1[d];"
                       f"[e][d]hstack,fps={FPS},format=yuv420p[v]", "-map", "[v]", *VID, "-an", "-t", f"{d:.3f}", saida)
                else:
                    ff("-ss", f"{a:.3f}", "-t", f"{d:.3f}", "-i", take, "-vf", f"scale={W}:{H},fps={FPS},format=yuv420p",
                       *VID, "-an", "-t", f"{d:.3f}", saida)
            ordem.append(saida)
            wav = os.path.join(tmp, f"a{k:03d}.wav")
            ff("-ss", f"{a:.3f}", "-t", f"{d:.3f}", "-i", take, "-vn", "-ac", "1", "-ar", str(SR), wav)
            audio.append((wav, 0.0, d))
    with ThreadPoolExecutor(4) as ex:
        list(ex.map(lambda t: None if os.path.exists(t[2]) else _clipe_imagem(*t), tarefas))
    # video: concat sem recodificar
    lista = os.path.join(tmp, "lista.txt")
    open(lista, "w").write("".join(f"file '{o}'\n" for o in ordem))
    so_video = os.path.join(tmp, "so_video.mp4")
    ff("-f", "concat", "-safe", "0", "-i", lista, "-c", "copy", so_video)
    # audio: cada pedaco no mesmo SR, mono, emendado
    partes = []
    for i, (wav, a, b) in enumerate(audio):
        p = os.path.join(tmp, f"au{i:03d}.wav")
        ff("-i", wav, "-af", f"aresample={SR},atrim=0:{b - a:.3f},apad=whole_dur={b - a:.3f}", "-ac", "1", p)
        partes.append(p)
    la = os.path.join(tmp, "lista_a.txt"); open(la, "w").write("".join(f"file '{p}'\n" for p in partes))
    so_audio = os.path.join(tmp, "so_audio.wav")
    ff("-f", "concat", "-safe", "0", "-i", la, "-c", "copy", so_audio)
    final = os.path.join(proj, "video", "previa.mp4" if os.environ.get("HC_SEGS") else "video.mp4")
    ff("-i", so_video, "-i", so_audio, "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "medium", "-crf", "22",
       "-maxrate", "4M", "-bufsize", "8M", "-pix_fmt", "yuv420p", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
       "-c:a", "aac", "-b:a", "160k", "-ar", str(SR), "-shortest", "-movflags", "+faststart", final)
    print("pronto:", final, f"{dur(final) / 60:.1f} min", flush=True)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    proj = os.path.abspath(sys.argv[1])
    cmd = sys.argv[2] if len(sys.argv) > 2 else "montar"
    if cmd == "voz": etapa_voz_minimax(proj, int(sys.argv[3]) if len(sys.argv) > 3 else None)
    elif cmd == "voz_kokoro": etapa_voz(proj)
    else: montar(proj)
