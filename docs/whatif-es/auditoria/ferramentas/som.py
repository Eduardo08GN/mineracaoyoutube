# Mapa de som do produzido (PANNs CNN14 a cada 2 s, igual ao do original) e comparacao com o original.
# Uso: python -I som.py <video_produzido> <tags_original.json> <saida_dir>
import sys, json, subprocess, numpy as np, librosa
from panns_inference import AudioTagging, labels
vid, tags_o, out = sys.argv[1], sys.argv[2], sys.argv[3]
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", vid, "-ac", "1", "-ar", "32000", f"{out}/prod32k.wav"], check=True)
at = AudioTagging(checkpoint_path=r"C:\Users\edlut\panns_data\Cnn14_mAP=0.431.pth", device="cpu")
y, sr = librosa.load(f"{out}/prod32k.wav", sr=32000, mono=True)
W = 2.0; M = int(len(y) / sr / W)
segs = np.stack([y[int(k * W * sr):int((k + 1) * W * sr)] for k in range(M)])
P = np.concatenate([at.inference(segs[i:i + 16])[0] for i in range(0, M, 16)])
rows = []
for k in range(M):
    p = P[k]; top = np.argsort(-p)[:6]; rms = float(np.sqrt(np.mean(segs[k] ** 2)))
    rows.append({"t": k * W, "rms_db": round(20 * np.log10(rms + 1e-9), 1), "top": [(labels[i], round(float(p[i]), 2)) for i in top]})
json.dump(rows, open(f"{out}/tags_prod.json", "w"), ensure_ascii=False)
O = json.load(open(tags_o))
# categorias amplas para comparar janela a janela
CAT = {"musica": ["Music", "Musical instrument", "Ambient music", "Electronic music", "Scary music", "Soundtrack music", "Synthesizer", "Piano", "Electric piano", "New-age music", "Singing bowl", "Guitar", "Didgeridoo", "Brass instrument"],
       "agua": ["Water", "Waves, surf", "Ocean", "Waterfall", "Liquid", "Pour", "Drip", "Fill (with liquid)", "Rain", "Rain on surface", "Pump (liquid)", "Toilet flush", "Water tap, faucet", "Boiling", "Splash, splatter"],
       "fogo/estrondo": ["Fire", "Crackle", "Explosion", "Boom", "Fusillade", "Rumble", "Thunder", "Frying (food)", "Sizzle"],
       "veiculo/vento": ["Vehicle", "Aircraft", "Fixed-wing aircraft, airplane", "Wind", "Wind noise (microphone)", "Engine", "Car", "Traffic noise, roadway noise", "Boat, Water vehicle", "Ship", "Foghorn", "Propeller, airscrew"],
       "gente": ["Speech", "Crowd", "Chatter", "Children playing", "Screaming", "Cheering", "Hubbub, speech noise, speech babble"]}
def cats(r):
    s = {c: 0.0 for c in CAT}
    for lab, v in r["top"]:
        for c, ls in CAT.items():
            if lab in ls: s[c] = max(s[c], v)
    return s
comp = []
for k in range(min(len(O), len(rows))):
    co, cp = cats(O[k]), cats(rows[k])
    comp.append({"t": O[k]["t"], "rms_o": O[k]["rms_db"], "rms_p": rows[k]["rms_db"], "top_o": O[k]["top"][0][0], "top_p": rows[k]["top"][0][0],
                 "cat_o": {c: round(v, 2) for c, v in co.items() if v > 0.08}, "cat_p": {c: round(v, 2) for c, v in cp.items() if v > 0.08}})
json.dump(comp, open(f"{out}/som_comparado.json", "w"), ensure_ascii=False, indent=0)
# concordancia por categoria: janelas em que a categoria aparece nos dois / em um so
res = {}
for c in CAT:
    a = np.array([c in x["cat_o"] for x in comp]); b = np.array([c in x["cat_p"] for x in comp])
    res[c] = {"so_original": int((a & ~b).sum()), "so_produzido": int((~a & b).sum()), "ambos": int((a & b).sum())}
ro, rp = np.array([x["rms_o"] for x in comp]), np.array([x["rms_p"] for x in comp])
res["correlacao_volume"] = float(np.corrcoef(ro, rp)[0, 1])
json.dump(res, open(f"{out}/som_resumo.json", "w"), ensure_ascii=False, indent=1)
print(json.dumps(res, ensure_ascii=False))
