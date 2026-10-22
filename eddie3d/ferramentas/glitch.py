# Varre um video por quadros com glitch (area grande diferente dos dois vizinhos). Uso: python glitch.py video.mp4 [limiar]
import sys, subprocess, numpy as np
lim = int(sys.argv[2]) if len(sys.argv) > 2 else 40
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', sys.argv[1], '-vf', 'scale=96:54,format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, 54, 96).astype(int).copy(); print('quadros', len(F))
F[:, :20, :60] = 0; F[:, 45:, :] = 0
a = np.abs(F[1:-1] - F[:-2]); b = np.abs(F[1:-1] - F[2:]); c = np.abs(F[2:] - F[:-2])
n = ((np.minimum(a, b) - c) > 18).reshape(len(a), -1).sum(1)
sp = np.where(n > lim)[0] + 1
print(len(sp), [(int(i), int(n[i - 1])) for i in sp])
