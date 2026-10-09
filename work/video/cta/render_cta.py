# Renderiza a cena do livro (cta.html) -> MP4 1920x1080 30 fps (sem audio); a montagem recorta e sai em 720p.
#   python work/video/cta/render_cta.py [cues.json] [saida.mp4]
import json, os, subprocess, sys, tempfile

from playwright.sync_api import sync_playwright

AQUI = os.path.dirname(os.path.abspath(__file__))
FPS = 30


def main(cues=None, saida=None, escala=1):
    """⭐ (09/10) em paralelo (render_paralelo.py). escala 1 = 1080, so' para o recorte de zoom dos planos do CTA."""
    sys.path.insert(0, os.path.dirname(AQUI))
    import render_paralelo
    return render_paralelo.render(os.path.join(AQUI, "cta.html"), cues or {}, saida or os.path.join(AQUI, "cta.mp4"),
                                  fps=FPS, escala=escala)


if __name__ == "__main__":
    c = json.load(open(sys.argv[1])) if len(sys.argv) > 1 and sys.argv[1].endswith(".json") else None
    main(c, sys.argv[2] if len(sys.argv) > 2 else None)
