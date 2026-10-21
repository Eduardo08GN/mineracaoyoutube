# Detector de flicker: quadro i difere de i-1 e de i+1, mas i-1 e i+1 sao parecidos (algo pisca por 1 quadro).
# Uso: python flicker.py video.mp4  -> lista os segundos com mais ocorrencias e a regiao (grade 8x8) onde pisca
import sys, subprocess, numpy as np
W, H = 192, 108
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", sys.argv[1], "-vf", f"scale={W}:{H},format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.int16)
a = np.abs(F[1:-1] - F[:-2]); b = np.abs(F[1:-1] - F[2:]); c = np.abs(F[2:] - F[:-2])
pis = (np.minimum(a, b) - c) > 18                      # pixels que piscam
pis[:, :int(H*0.36), :int(W*0.62)] = False             # painel (o numero muda a cada quadro)
pis[:, int(H*0.84):, :] = False                        # legenda
n = pis.reshape(len(pis), -1).sum(1)
ruins = np.where(n > 25)[0] + 1
print("quadros com flicker:", len(ruins), "de", len(F))
seg = {}
for i in ruins: seg.setdefault(i // 30, []).append(i)
for s, l in sorted(seg.items(), key=lambda x: -len(x[1]))[:25]:
    m = pis[np.array(l) - 1].sum(0); y, x = np.unravel_index(m.argmax(), m.shape)
    k = np.array(l)[np.argmax(n[np.array(l)-1])]
    print(f"{s//60}:{s%60:02d} quadros={len(l)} pico={n[np.array(l)-1].max()} regiao=({x*100//W}%,{y*100//H}%) quadro={k}")
    if len(sys.argv) > 2 and s in [int(v) for v in sys.argv[2].split(',')]:
        import PIL.Image as I
        tira = np.concatenate([F[k-1], F[k], F[k+1], (pis[k-1]*255).astype(np.int16)], 1).clip(0,255).astype(np.uint8)
        I.fromarray(tira).resize((W*8, H*2)).save(f"flick_{s}.png")
