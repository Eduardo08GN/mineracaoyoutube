# Renderiza a cena do livro (cta.html) quadro a quadro -> MP4 1920x1080 30 fps (sem audio).
#   python work/video/cta/render_cta.py [cues.json] [saida.mp4]
import json, os, subprocess, sys, tempfile

from playwright.sync_api import sync_playwright

AQUI = os.path.dirname(os.path.abspath(__file__))
FPS = 30


def main(cues=None, saida=None, escala=1):
    cues = cues or {}
    saida = saida or os.path.join(AQUI, "cta.mp4")
    pasta = tempfile.mkdtemp(prefix="cta_")
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome")
        pg = b.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=escala)
        pg.goto("file:///" + os.path.join(AQUI, "cta.html").replace("\\", "/"))
        pg.wait_for_load_state("networkidle")
        if cues: pg.evaluate("c => Object.assign(window.CUES, c)", cues)
        fim = pg.evaluate("window.CUES.FIM")
        n = int(round(fim * FPS))
        for i in range(n):
            pg.evaluate(f"render({i / FPS})")
            pg.screenshot(path=os.path.join(pasta, f"q{i:05d}.png"))
        b.close()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", os.path.join(pasta, "q%05d.png"),
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "slow", saida], check=True)
    import shutil; shutil.rmtree(pasta, ignore_errors=True)    # ⛔ os PNG de um render em 4K passam de 4 GB
    print(saida, n, "quadros")


if __name__ == "__main__":
    c = json.load(open(sys.argv[1])) if len(sys.argv) > 1 and sys.argv[1].endswith(".json") else None
    main(c, sys.argv[2] if len(sys.argv) > 2 else None)
