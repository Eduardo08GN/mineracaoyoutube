# Folhas para a revisao NO OLHO do banco de b-roll (o filtro de rosto Haar deixa passar gente de perfil, de bone,
# agachada; e nenhum filtro pega fonte fora do tema ou transicao embutida). 3 quadros por trecho, 16 trechos por folha.
#   python work/video/revisar_olho.py folhas <pasta terceiros> <saida>      -> folha_NN.jpg (indice do trecho em amarelo)
#   python work/video/revisar_olho.py marcar <pasta terceiros> i,j,k motivo -> "olho": motivo em aprovados.json
#   python work/video/revisar_olho.py aprovar <pasta terceiros>             -> "olho_ok" nos que sobraram nas folhas
# ⛔ (09/10) a revisao vem ANTES da montagem: o Banco do montar_completo so' usa trecho com "olho_ok".
import json, os, subprocess, sys
from PIL import Image, ImageDraw


def quadro(arq, t, w=240, h=135):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.2f}", "-i", arq, "-frames:v", "1", "-vf", f"scale={w}:{h}",
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    return Image.frombytes("RGB", (w, h), raw) if len(raw) == w * h * 3 else Image.new("RGB", (w, h))


def folhas(pasta, saida, so_limpos=True, por_folha=16, n_quadros=3, w=240, h=135, so_novos=False):
    """Folhas de contato: n_quadros por trecho, por_folha trechos (4 por linha). ⭐ (09/10) a revisao pelo Claude usa
    8 trechos x 4 quadros de 320 px: com 16 x 3 de 240 px ele deixou passar um rosto grande."""
    os.makedirs(saida, exist_ok=True)
    for f in os.listdir(saida):
        if f.endswith(".jpg"): os.remove(os.path.join(saida, f))
    ap = json.load(open(os.path.join(pasta, "aprovados.json"), encoding="utf-8"))
    sujas = {c["clipe"].rsplit("_", 1)[0] for c in ap if c.get("texto") and c.get("texto_revisto") != "falso"}
    idx = [i for i, c in enumerate(ap) if (not so_limpos or ("texto" in c and c["clipe"].rsplit("_", 1)[0] not in sujas
                                                              and not c.get("olho")))
           and not (so_novos and c.get("olho_ok"))]
    larg = n_quadros * w + 8
    feitas = []
    for f in range(0, len(idx), por_folha):
        linhas = (min(por_folha, len(idx) - f) + 3) // 4
        S = Image.new("RGB", (4 * larg, linhas * (h + 15)), (30, 30, 30)); d = ImageDraw.Draw(S)
        for k, i in enumerate(idx[f:f + por_folha]):
            arq = os.path.join(pasta, "clips", ap[i]["clipe"])
            dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arq],
                                       capture_output=True, text=True).stdout or 0)
            x0, y0 = (k % 4) * larg, (k // 4) * (h + 15)
            for j in range(n_quadros):
                S.paste(quadro(arq, dur * (0.1 + 0.8 * j / max(1, n_quadros - 1)), w, h), (x0 + j * w, y0))
            d.rectangle([x0, y0, x0 + 150, y0 + 14], fill=(0, 0, 0))
            d.text((x0 + 3, y0 + 1), f"{i} {ap[i].get('tag', '')}", fill=(255, 255, 0))
        out = os.path.join(saida, f"folha_{f // por_folha:02d}.jpg"); S.save(out, quality=85); feitas.append(out)
    print(len(idx), "trechos,", len(feitas), "folhas em", saida)
    return feitas


def aprovar(pasta):
    """Depois de olhar TODAS as folhas e marcar os rejeitados: o resto vira "olho_ok"."""
    arq = os.path.join(pasta, "aprovados.json")
    ap = json.load(open(arq, encoding="utf-8"))
    sujas = {c["clipe"].rsplit("_", 1)[0] for c in ap if c.get("texto") and c.get("texto_revisto") != "falso"}
    n = 0
    for c in ap:
        if "texto" in c and c["clipe"].rsplit("_", 1)[0] not in sujas and not c.get("olho"):
            c["olho_ok"] = True; n += 1
    json.dump(ap, open(arq, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(n, "trechos aprovados no olho")


def marcar(pasta, lista, motivo):
    arq = os.path.join(pasta, "aprovados.json")
    ap = json.load(open(arq, encoding="utf-8"))
    for i in [int(x) for x in lista.split(",") if x.strip()]: ap[i]["olho"] = motivo
    json.dump(ap, open(arq, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("marcados:", lista, "->", motivo)


if __name__ == "__main__":
    if sys.argv[1] == "folhas": folhas(sys.argv[2], sys.argv[3])
    elif sys.argv[1] == "aprovar": aprovar(sys.argv[2])
    else: marcar(sys.argv[2], sys.argv[3], " ".join(sys.argv[4:]))
