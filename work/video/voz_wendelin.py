# A voz do Wendelin na narracao dos b-rolls: um clone MiniMax feito com a PROPRIA voz que o Veo deu
# ao monge nos takes de fala (assim a narracao e a boca do avatar soam como a mesma pessoa).
#   python work/video/voz_wendelin.py clonar          # junta a fala dos takes e cria a voz
#   python work/video/voz_wendelin.py narrar "texto" saida.wav
import binascii, hashlib, json, os, subprocess, sys, time

import requests

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))
ENV = dict(l.strip().split("=", 1) for l in open(os.path.join(RAIZ, ".env"), encoding="utf-8") if "=" in l)
HOST = ENV.get("MINIMAX_HOST", "https://api.minimax.io").rstrip("/")
CAB = {"Authorization": "Bearer " + ENV["MINIMAX_API_KEY"]}
PASTA = os.path.join(AQUI, "voz")
CFG = os.path.join(PASTA, "wendelin_clone.json")
BRUTO = os.path.join(AQUI, "fatia01", "bruto")
CACHE = os.path.join(PASTA, "narracao")
VOICE_ID = "BruderWendelin01"


def _falas():
    """[(arquivo, ini, fim)] do trecho falado de cada take de fala (whisper com tempo de palavra)."""
    from faster_whisper import WhisperModel
    m = WhisperModel("small", device="cpu", compute_type="int8")
    out = []
    # ⭐ os takes cuja voz do Veo e' parecida entre si (ECAPA 0,46-0,76); o clipe do Veo Fast (p01_b) tem outra voz
    for f in ("p01_fala.mp4", "p06_fala.mp4", "teste_fala_p01_169.mp4", "teste_fala_p01.mp4"):
        segs, _ = m.transcribe(os.path.join(BRUTO, f), language="de", word_timestamps=True)
        ws = [w for s in segs for w in (s.words or [])]
        if ws: out.append((os.path.join(BRUTO, f), max(0, ws[0].start - 0.08), ws[-1].end + 0.15))
    return out


def clonar():
    tmp = os.path.join(PASTA, "_clone"); os.makedirs(tmp, exist_ok=True)
    partes = []
    for i, (arq, a, b) in enumerate(_falas()):
        p = os.path.join(tmp, f"{i:02d}.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{a:.2f}", "-to", f"{b:.2f}", "-i", arq, "-vn",
                        "-af", "apad=pad_dur=0.45", "-ac", "1", "-ar", "44100", p], check=True)
        partes.append(p)
    lista = os.path.join(tmp, "lista.txt")
    open(lista, "w").write("".join(f"file '{p.replace(chr(92), '/')}'\n" for p in partes))
    amostra = os.path.join(PASTA, "wendelin_veo.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lista, amostra], check=True)
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", amostra],
                               capture_output=True, text=True).stdout)
    print(f"amostra da voz do Veo: {len(partes)} takes, {dur:.1f} s")
    if dur < 10: raise SystemExit("menos de 10 s de fala: a MiniMax exige pelo menos 10 s")
    r = requests.post(HOST + "/v1/files/upload", headers=CAB, data={"purpose": "voice_clone"},
                      files={"file": open(amostra, "rb")}, timeout=180).json()
    fid = (r.get("file") or {}).get("file_id")
    if not fid: raise SystemExit(f"upload falhou: {r.get('base_resp')}")
    corpo = {"file_id": fid, "voice_id": VOICE_ID, "need_noise_reduction": True, "need_volume_normalization": True,
             "model": "speech-2.6-hd", "text": "Es ist ein Samstag im April, und der Garten wartet auf Sie."}
    r = requests.post(HOST + "/v1/voice_clone", headers={**CAB, "Content-Type": "application/json"},
                      json=corpo, timeout=300).json()
    if (r.get("base_resp") or {}).get("status_code") != 0: raise SystemExit(f"clone falhou: {r.get('base_resp')}")
    json.dump({"voice_id": VOICE_ID, "file_id": fid, "em": time.time()}, open(CFG, "w"))
    print("voz criada:", VOICE_ID)


EDGE_VOZ, EDGE_RATE, EDGE_PITCH = "de-DE-ConradNeural", "-10%", "-6Hz"  # (Eduardo, 09/10) o NOSSO ritmo, ~130 ppm


def _sintetizar(texto, mp3, pal):
    """edge-tts em stream: grava o mp3 e os limites de cada palavra [(palavra, ini, fim)] em segundos (offset/duration
    vem em unidades de 100 ns)."""
    import asyncio, edge_tts

    async def go():
        c = edge_tts.Communicate(texto, EDGE_VOZ, rate=EDGE_RATE, pitch=EDGE_PITCH, boundary="WordBoundary")
        ws = []
        with open(mp3, "wb") as f:
            async for ch in c.stream():
                if ch["type"] == "audio": f.write(ch["data"])
                elif ch["type"] == "WordBoundary":
                    a = ch["offset"] / 1e7
                    ws.append((ch["text"], round(a, 3), round(a + ch["duration"] / 1e7, 3)))
        return ws
    ws = asyncio.run(go())
    json.dump(ws, open(pal, "w", encoding="utf-8"), ensure_ascii=False)


def narrar(texto, saida, velocidade=None):
    """Um trecho da narracao em wav 48 kHz mono. ⭐ (08/10, MiniMax sem saldo) voz neural gratis da
    Microsoft (edge-tts, de-DE-ConradNeural), a MESMA voz para a qual o audio dos takes do Veo e'
    convertido (OpenVoice), entao avatar e narracao soam como uma pessoa so'. Cache pelo texto.
    ⭐ (09/10, velocidade) grava junto `<saida>.palavras.json` com o tempo de cada palavra (o proprio edge-tts informa):
    a montagem corta nos vaos entre palavras sem precisar do Whisper. O silencio das pontas e' cortado pelas palavras."""
    os.makedirs(CACHE, exist_ok=True)
    h = hashlib.sha1(f"{EDGE_VOZ}|{EDGE_RATE}|{EDGE_PITCH}|{texto}".encode()).hexdigest()[:16]
    c, pal = os.path.join(CACHE, h + ".mp3"), os.path.join(CACHE, h + ".palavras.json")
    if not (os.path.exists(c) and os.path.exists(pal)):
        for t in range(4):
            try:
                _sintetizar(texto, c, pal); break
            except Exception:                                                       # noqa: BLE001
                time.sleep(3 * (t + 1))
        else:
            raise SystemExit("edge-tts falhou")
    ws = json.load(open(pal, encoding="utf-8"))
    if ws:
        a = max(0.0, ws[0][1] - 0.06)
        b = ws[-1][2] + 0.12
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", c,
                        "-ac", "1", "-ar", "48000", saida], check=True)
        ws = [(w, round(x - a, 3), round(y - a, 3)) for w, x, y in ws]
    else:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", c, "-af",
                        "silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
                        "silenceremove=start_periods=1:start_threshold=-45dB,areverse",
                        "-ac", "1", "-ar", "48000", saida], check=True)
    json.dump(ws, open(saida + ".palavras.json", "w", encoding="utf-8"), ensure_ascii=False)
    return saida


def palavras_de(wav):
    """Os tempos de palavra que narrar() gravou ao lado do wav, ou None."""
    try: return [tuple(x) for x in json.load(open(wav + ".palavras.json", encoding="utf-8"))]
    except (OSError, ValueError): return None


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if sys.argv[1] == "clonar": clonar()
    else: print(narrar(sys.argv[2], sys.argv[3]))
