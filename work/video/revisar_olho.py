# Folhas para a revisao NO OLHO do banco de b-roll (o filtro de rosto Haar deixa passar gente de perfil, de bone,
# agachada; e nenhum filtro pega fonte fora do tema ou transicao embutida). 3 quadros por trecho, 16 trechos por folha.
#   python work/video/revisar_olho.py folhas <pasta terceiros> <saida>      -> folha_NN.jpg (indice do trecho em amarelo)
#   python work/video/revisar_olho.py marcar <pasta terceiros> i,j,k motivo -> "olho": motivo em aprovados.json
import json, os, subprocess, sys
from PIL import Image, ImageDraw


def quadro(arq, t, w=240, h=135):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.2f}", "-i", arq, "-frames:v", "1", "-vf", f"scale={w}:{h}",
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    return Image.frombytes("RGB", (w, h), raw) if len(raw) == w * h * 3 else Image.new("RGB", (w, h))


def folhas(pasta, saida, so_limpos=True):
    os.makedirs(saida, exist_ok=True)
    ap = json.load(open(os.path.join(pasta, "aprovados.json"), encoding="utf-8"))
    sujas = {c["clipe"].rsplit("_", 1)[0] for c in ap if c.get("texto") and c.get("texto_revisto") != "falso"}
    idx = [i for i, c in enumerate(ap) if not so_limpos or ("texto" in c and c["clipe"].rsplit("_", 1)[0] not in sujas)]
    for f in range(0, len(idx), 16):
        S = Image.new("RGB", (4 * 3 * 240 + 3 * 8, 4 * 150), (30, 30, 30)); d = ImageDraw.Draw(S)
        for k, i in enumerate(idx[f:f + 16]):
            arq = os.path.join(pasta, "clips", ap[i]["clipe"])
            dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arq],
                                       capture_output=True, text=True).stdout or 0)
            x0, y0 = (k % 4) * (3 * 240 + 8), (k // 4) * 150
            for j, fr in enumerate((.15, .5, .85)):
                S.paste(quadro(arq, dur * fr), (x0 + j * 240, y0))
            d.rectangle([x0, y0, x0 + 150, y0 + 14], fill=(0, 0, 0))
            d.text((x0 + 3, y0 + 1), f"{i} {ap[i].get('tag', '')}", fill=(255, 255, 0))
        S.save(os.path.join(saida, f"folha_{f // 16:02d}.jpg"), quality=80)
    print(len(idx), "trechos,", (len(idx) + 15) // 16, "folhas em", saida)


def marcar(pasta, lista, motivo):
    arq = os.path.join(pasta, "aprovados.json")
    ap = json.load(open(arq, encoding="utf-8"))
    for i in [int(x) for x in lista.split(",") if x.strip()]: ap[i]["olho"] = motivo
    json.dump(ap, open(arq, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("marcados:", lista, "->", motivo)


if __name__ == "__main__":
    if sys.argv[1] == "folhas": folhas(sys.argv[2], sys.argv[3])
    else: marcar(sys.argv[2], sys.argv[3], " ".join(sys.argv[4:]))
