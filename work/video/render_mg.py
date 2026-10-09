# Renderiza uma cena de motion graphics (HTML com render(t) deterministico) quadro a quadro -> MP4 sem audio.
#   python work/video/render_mg.py <pagina.html> <cues.json> <saida.mp4> [fps]
import json, os, subprocess, sys, tempfile

from playwright.sync_api import sync_playwright


def main(pagina, cues, saida, fps=30, escala=2 / 3):          # ⛔ (09/10) a pagina e' 1920x1080; sai 1280x720
    pasta = tempfile.mkdtemp(prefix="mg_")
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome")
        pg = b.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=escala)
        pg.goto("file:///" + os.path.abspath(pagina).replace("\\", "/"))
        pg.wait_for_load_state("networkidle")
        if cues: pg.evaluate("c => Object.assign(window.CUES, c)", cues)
        n = int(round(pg.evaluate("window.CUES.FIM") * fps))
        for i in range(n):
            pg.evaluate(f"render({i / fps})")
            pg.screenshot(path=os.path.join(pasta, f"q{i:05d}.png"))
            if i % 300 == 0: print(f"  {i}/{n}", flush=True)
        b.close()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(fps), "-i", os.path.join(pasta, "q%05d.png"),
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "slow", saida], check=True)
    import shutil; shutil.rmtree(pasta, ignore_errors=True)    # ⛔ os PNG de um render em 4K passam de 4 GB
    print(saida, n, "quadros")
    return saida


if __name__ == "__main__":
    main(sys.argv[1], json.load(open(sys.argv[2])), sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 30)
