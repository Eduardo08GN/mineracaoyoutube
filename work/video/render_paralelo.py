# Render de uma pagina HTML com render(t) deterministico -> MP4, em PARALELO (velocidade, 09/10).
# Antes (render_mg/render_cta): 1 aba, 1 quadro por vez, cada quadro gravado em PNG no disco e so' no fim o ffmpeg.
# Agora: N processos (cada um com o seu Chrome) pegam um pedaco da linha do tempo, capturam em JPEG e mandam os
# quadros DIRETO para o ffmpeg pelo stdin (nada de milhares de PNGs no disco); no fim os pedacos sao colados sem
# recodificar. Mesma ideia do HyperFrames/Remotion, sem trocar as paginas que ja' temos.
#   python work/video/render_paralelo.py <pagina.html> <cues.json|-> <saida.mp4> [workers]
import json, os, subprocess, sys, tempfile, time
from concurrent.futures import ProcessPoolExecutor

FPS = 30
VID_PEDACO = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p", "-r", str(FPS)]


def _pedaco(args):
    """Um processo: renderiza os quadros [a, b) e grava um MP4 do pedaco."""
    pagina, cues, a, b, escala, saida, fps = args
    from playwright.sync_api import sync_playwright
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "image2pipe", "-framerate", str(fps), "-c:v", "mjpeg", "-i", "-",
                           *VID_PEDACO, saida], stdin=subprocess.PIPE)
    with sync_playwright() as p:
        br = p.chromium.launch(channel="chrome")
        pg = br.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=escala)
        pg.goto("file:///" + os.path.abspath(pagina).replace("\\", "/"))
        pg.wait_for_load_state("networkidle")
        if cues: pg.evaluate("c => Object.assign(window.CUES, c)", cues)
        # aquece com os quadros logo antes do pedaco (estado que dependa do quadro anterior, se houver)
        for i in range(max(0, a - 3), a): pg.evaluate(f"render({i / fps})")
        for i in range(a, b):
            pg.evaluate(f"render({i / fps})")
            ff.stdin.write(pg.screenshot(type="jpeg", quality=92))
        br.close()
    ff.stdin.close()
    if ff.wait(): raise RuntimeError(f"ffmpeg falhou no pedaco {a}-{b}")
    return saida


def render(pagina, cues, saida, fps=FPS, escala=2 / 3, workers=None, fim=None):
    """escala: a pagina e' desenhada em 1920x1080; 2/3 -> sai 1280x720 (o teto do pipeline), 1 -> 1080."""
    t0 = time.time()
    if fim is None:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            br = p.chromium.launch(channel="chrome"); pg = br.new_page()
            pg.goto("file:///" + os.path.abspath(pagina).replace("\\", "/")); pg.wait_for_load_state("networkidle")
            if cues: pg.evaluate("c => Object.assign(window.CUES, c)", cues)
            fim = pg.evaluate("window.CUES.FIM"); br.close()
    n = int(round(fim * fps))
    workers = workers or max(2, min(6, (os.cpu_count() or 4) // 2))
    pasta = tempfile.mkdtemp(prefix="rp_")
    cortes = [round(n * k / workers) for k in range(workers + 1)]
    tarefas = [(pagina, cues, cortes[k], cortes[k + 1], escala, os.path.join(pasta, f"p{k:02d}.mp4"), fps)
               for k in range(workers) if cortes[k + 1] > cortes[k]]
    with ProcessPoolExecutor(max_workers=len(tarefas)) as ex:
        pedacos = list(ex.map(_pedaco, tarefas))
    lst = os.path.join(pasta, "lista.txt")
    open(lst, "w").writelines(f"file '{x.replace(os.sep, '/')}'\n" for x in pedacos)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", saida], check=True)
    import shutil; shutil.rmtree(pasta, ignore_errors=True)
    print(f"{saida}: {n} quadros em {time.time() - t0:.0f} s com {len(tarefas)} processos", flush=True)
    return saida


if __name__ == "__main__":
    a = sys.argv
    render(a[1], None if a[2] == "-" else json.load(open(a[2])), a[3], workers=int(a[4]) if len(a) > 4 else None)
