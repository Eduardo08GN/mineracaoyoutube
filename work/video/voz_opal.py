# A voz da Mamaw Opal na narracao: clone MiniMax feito com a PROPRIA voz que o Omni (Google Vids) deu a ela nos takes do
# avatar. Assim narracao e boca do avatar soam como a mesma pessoa (Eduardo, 13/10: nada de Kokoro + OpenVoice).
#   python work/video/voz_opal.py <pasta do projeto> clonar
#   python work/video/voz_opal.py <pasta do projeto> testar "texto"
import binascii, json, os, subprocess, sys, time

import requests

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))
ENV = dict(l.strip().split("=", 1) for l in open(os.path.join(RAIZ, ".env"), encoding="utf-8") if "=" in l)
HOST = ENV.get("MINIMAX_HOST", "https://api.minimax.io").rstrip("/")
CAB = {"Authorization": "Bearer " + ENV["MINIMAX_API_KEY"]}
VOICE_ID = "MamawOpal01"
MODELO = "speech-2.6-hd"
AMOSTRA_MAX_S = 150


def _janela(arq, m):
    segs, _ = m.transcribe(arq, language="en", word_timestamps=True, vad_filter=True)
    ws = [w for s in segs for w in (s.words or [])]
    return (max(0, ws[0].start - 0.08), ws[-1].end + 0.15) if ws else None


def clonar(proj):
    from faster_whisper import WhisperModel
    m = WhisperModel(os.path.join(os.environ.get("FW_DIR", r"D:\modelos"), "fw_small_en"),
                     device="cpu", compute_type="int8")
    pasta = os.path.join(proj, "voz", "clone"); os.makedirs(pasta, exist_ok=True)
    takes = sorted(f for f in os.listdir(os.path.join(proj, "avatar")) if f.startswith("a") and f.endswith(".mp4"))
    partes, total = [], 0.0
    for f in takes:
        arq = os.path.join(proj, "avatar", f)
        j = _janela(arq, m)
        if not j or j[1] - j[0] < 2.5: continue                      # falas curtas demais nao ajudam o clone
        p = os.path.join(pasta, f[:-4] + ".wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{j[0]:.2f}", "-to", f"{j[1]:.2f}", "-i", arq, "-vn",
                        "-af", "apad=pad_dur=0.4", "-ac", "1", "-ar", "44100", p], check=True)
        partes.append(p); total += j[1] - j[0] + 0.4
        if total >= AMOSTRA_MAX_S: break
    lista = os.path.join(pasta, "lista.txt")
    open(lista, "w").write("".join(f"file '{p.replace(chr(92), '/')}'\n" for p in partes))
    amostra = os.path.join(proj, "voz", "opal_omni.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lista, amostra], check=True)
    print(f"amostra da voz do Omni: {len(partes)} takes, {total:.1f} s", flush=True)
    mp3 = amostra[:-4] + ".mp3"                                   # o wav de 12 MB derrubava a conexao (SSL EOF)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", amostra, "-b:a", "192k", mp3], check=True)
    for t in range(4):
        try:
            r = requests.post(HOST + "/v1/files/upload", headers=CAB, data={"purpose": "voice_clone"},
                              files={"file": ("opal_omni.mp3", open(mp3, "rb"), "audio/mpeg")}, timeout=300).json()
            break
        except requests.RequestException as e:
            print("upload: nova tentativa", e.__class__.__name__, flush=True); time.sleep(5 * (t + 1))
    else:
        raise SystemExit("upload falhou 4 vezes")
    fid = (r.get("file") or {}).get("file_id")
    if not fid: raise SystemExit(f"upload falhou: {r.get('base_resp')}")
    corpo = {"file_id": fid, "voice_id": VOICE_ID, "need_noise_reduction": True, "need_volume_normalization": True,
             "model": MODELO, "text": "Stop pouring your batter into a cold pan. That is the whole trick, honey."}
    r = requests.post(HOST + "/v1/voice_clone", headers={**CAB, "Content-Type": "application/json"},
                      json=corpo, timeout=300).json()
    print("clone:", r.get("base_resp"), flush=True)
    if (r.get("base_resp") or {}).get("status_code") != 0: raise SystemExit("clone falhou")
    demo = r.get("demo_audio")
    if demo:
        a = requests.get(demo, timeout=60).content
        open(os.path.join(proj, "voz", "opal_clone_demo.mp3"), "wb").write(a)
    json.dump({"voice_id": VOICE_ID, "file_id": fid, "em": time.time(), "takes": len(partes), "seg": total},
              open(os.path.join(proj, "voz", "opal_clone.json"), "w"))
    print("voz criada:", VOICE_ID)


def narrar(texto, saida_mp3, velocidade=0.95):
    corpo = {"model": MODELO, "text": texto, "stream": False, "language_boost": "English",
             "voice_setting": {"voice_id": VOICE_ID, "speed": velocidade, "vol": 1.0, "pitch": 0},
             "audio_setting": {"sample_rate": 44100, "bitrate": 256000, "format": "mp3", "channel": 1}}
    ultimo = None
    for t in range(5):
        try:
            r = requests.post(HOST + "/v1/t2a_v2", headers={**CAB, "Content-Type": "application/json"}, json=corpo,
                              timeout=300).json()
        except requests.RequestException as e:
            ultimo = str(e); time.sleep(4 * (t + 1)); continue
        st = (r.get("base_resp") or {}).get("status_code")
        if st == 0 and (r.get("data") or {}).get("audio"):
            open(saida_mp3, "wb").write(binascii.unhexlify(r["data"]["audio"]))
            return r.get("extra_info") or {}
        ultimo = r.get("base_resp")
        if st in (1002, 1039, 1000, 1001): time.sleep(5 * (t + 1)); continue
        break
    raise RuntimeError(f"MiniMax falhou: {ultimo}")


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    proj, cmd = os.path.abspath(sys.argv[1]), sys.argv[2]
    if cmd == "clonar": clonar(proj)
    elif cmd == "testar":
        print(narrar(sys.argv[3], os.path.join(proj, "voz", "teste_minimax.mp3")))
