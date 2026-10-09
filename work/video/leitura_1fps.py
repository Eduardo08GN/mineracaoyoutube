# Leitura otica a 1 fps: folhas de contato (6x5 = 30 s por folha) com o tempo em cada quadro, para revisar o video
# segundo a segundo (rosto de terceiro, texto/marca d'agua, plano parado, transicao feia, avatar fora de quadro).
#   python work/video/leitura_1fps.py <video.mp4> <pasta de saida> [ini_s] [fim_s]
import os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw


def main(video, saida, ini=0.0, fim=None):
    os.makedirs(saida, exist_ok=True)
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video],
                             capture_output=True, text=True).stdout)
    fim = min(fim or d, d)
    w, h = 320, 180
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{ini}", "-to", f"{fim}", "-i", video, "-vf",
                          f"fps=1,scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    Q = np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)
    folhas = []
    for k in range(0, len(Q), 30):
        S = Image.new("RGB", (6 * w, 5 * h)); dr = ImageDraw.Draw(S)
        for j, q in enumerate(Q[k:k + 30]):
            x, y = (j % 6) * w, (j // 6) * h
            S.paste(Image.fromarray(q), (x, y))
            t = int(ini + k + j); dr.rectangle([x, y, x + 58, y + 16], fill=(0, 0, 0))
            dr.text((x + 3, y + 2), f"{t // 60}:{t % 60:02d}", fill=(255, 255, 0))
        f = os.path.join(saida, f"folha_{int(ini + k):05d}.jpg"); S.save(f, quality=82); folhas.append(f)
    print(len(Q), "quadros,", len(folhas), "folhas em", saida)


if __name__ == "__main__":
    a = sys.argv
    main(a[1], a[2], float(a[3]) if len(a) > 3 else 0.0, float(a[4]) if len(a) > 4 else None)
