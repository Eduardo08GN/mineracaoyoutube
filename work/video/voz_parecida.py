# Acha a voz de sistema MiniMax (falando alemao) mais parecida com a voz do Wendelin no Flow/Veo.
#   python work/video/voz_parecida.py work/video/voz/wendelin_previa.wav
# Metodo do editingtool (ferramentas/voz_parecida.py): mesma frase com cada voz candidata e comparacao da
# impressao digital de voz (ECAPA). Calibracao de la': mesma voz ~0,86; vozes diferentes ~0,44.
import binascii, json, os, sys, time, urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))
ENV = dict(l.strip().split("=", 1) for l in open(os.path.join(RAIZ, ".env"), encoding="utf-8") if "=" in l)
HOST = ENV.get("MINIMAX_HOST", "https://api.minimax.io").rstrip("/")
PASTA = os.path.join(AQUI, "voz", "candidatas")
TEXTO = ("Es ist ein Samstag im April. Sie stehen im Gartencenter, zwischen den Regalen, und es riecht nach feuchter Erde. "
         "Aber hören Sie mir zu: Es war nicht Ihre Schuld.")
FEM = ("lady", "girl", "woman", "queen", "female", "hostess", "girlfriend", "princess", "sister", "mother", "mom",
       "grandma", "granny", "wife", "madam", "miss", "she ", "her ", "maiden", "diva", "actress", "ballerina")


def post(caminho, corpo):
    req = urllib.request.Request(HOST + caminho, data=json.dumps(corpo).encode(),
                                 headers={"Authorization": "Bearer " + ENV["MINIMAX_API_KEY"], "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=180))


def sintetizar(vid, saida):
    corpo = {"model": "speech-2.6-hd", "text": TEXTO, "stream": False, "language_boost": "German",
             "voice_setting": {"voice_id": vid, "speed": 0.95, "vol": 1.0, "pitch": 0},
             "audio_setting": {"sample_rate": 32000, "bitrate": 128000, "format": "mp3", "channel": 1}}
    for t in range(3):
        try:
            r = post("/v1/t2a_v2", corpo)
            if (r.get("base_resp") or {}).get("status_code") == 0:
                open(saida, "wb").write(binascii.unhexlify(r["data"]["audio"])); return True
        except Exception:                                                       # noqa: BLE001
            pass
        time.sleep(3 * (t + 1))
    return False


def main(ref):
    import numpy as np, librosa, torch
    from speechbrain.inference.speaker import EncoderClassifier
    from speechbrain.utils.fetching import LocalStrategy
    os.makedirs(PASTA, exist_ok=True)
    enc = EncoderClassifier.from_hparams(source="speechbrain/spkrec-ecapa-voxceleb", savedir=os.path.join(AQUI, "voz", "ecapa"),
                                         run_opts={"device": "cpu"}, local_strategy=LocalStrategy.COPY)

    def emb(arq):
        y, _ = librosa.load(arq, sr=16000)
        with torch.no_grad(): e = enc.encode_batch(torch.tensor(y).unsqueeze(0)).squeeze().numpy()
        return e / np.linalg.norm(e), y

    R, y = emb(ref)
    f0, vf, _ = librosa.pyin(y, fmin=60, fmax=300, sr=16000)
    print(f"referencia: tom mediano {np.nanmedian(f0[vf]):.0f} Hz", flush=True)
    d = post("/v1/get_voice", {"voice_type": "system"})
    cand = []
    for v in d.get("system_voice") or []:
        vid = v["voice_id"]; desc = (" ".join(v.get("description") or []) + " " + (v.get("voice_name") or "") + " " + vid).lower()
        if any(k in desc for k in FEM): continue
        cand.append((vid, desc[:70]))
    print(f"{len(cand)} vozes masculinas candidatas", flush=True)
    res = []
    for vid, desc in cand:
        mp3 = os.path.join(PASTA, vid.replace("/", "_") + ".mp3")
        if not os.path.exists(mp3) and not sintetizar(vid, mp3): continue
        try:
            e, yc = emb(mp3)
        except Exception:                                                       # noqa: BLE001
            continue
        fc, vc, _ = librosa.pyin(yc, fmin=60, fmax=300, sr=16000)
        res.append((float(e @ R), vid, float(np.nanmedian(fc[vc])) if vc.any() else 0, desc))
    res.sort(reverse=True)
    json.dump(res, open(os.path.join(AQUI, "voz", "ranking.json"), "w"), indent=1)
    for s, vid, hz, desc in res[:12]:
        print(f"{s:.3f}  {hz:5.0f} Hz  {vid}  | {desc}", flush=True)
    print("FIM")


if __name__ == "__main__":
    main(sys.argv[1])
