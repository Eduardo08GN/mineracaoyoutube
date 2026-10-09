# Renderiza uma cena de motion graphics (HTML com render(t) deterministico) -> MP4 sem audio, em 1280x720.
# ⭐ (09/10) em paralelo, JPEG direto para o ffmpeg (render_paralelo.py): ~25 min -> ~1,5 min por cena.
#   python work/video/render_mg.py <pagina.html> <cues.json> <saida.mp4> [fps]
import json, sys

import render_paralelo


def main(pagina, cues, saida, fps=30, escala=2 / 3):          # ⛔ (09/10) a pagina e' 1920x1080; sai 1280x720
    return render_paralelo.render(pagina, cues, saida, fps=fps, escala=escala)


if __name__ == "__main__":
    main(sys.argv[1], json.load(open(sys.argv[2])), sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 30)
