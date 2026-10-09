# Controla a aba do Flow no perfil Dolphin "12 Ivone" (869356248) pela porta de depuracao (CDP).
# Trabalha so' numa aba propria (marcada em .aba); nunca fecha o navegador nem mexe nas outras abas.
#   python work/video/ivone.py nova <url>          abre a aba propria
#   python work/video/ivone.py ir <url> | shot [arq] [escala] | clique x y | direito x y | digitar "txt" | tecla K
#   python work/video/ivone.py js "expr" | subir "<seletor css do input file>" arq1 [arq2...] | url
import json
import os
import sys
import time

from playwright.sync_api import sync_playwright

AQUI = os.path.dirname(os.path.abspath(__file__))
ABA = os.path.join(AQUI, ".aba")
PORTA = os.path.join(os.environ["APPDATA"], "dolphin_anty", "browser_profiles", "869356248", "data_dir", "DevToolsActivePort")


def conectar(p):
    porta = open(PORTA).read().split()[0]
    return p.chromium.connect_over_cdp(f"http://127.0.0.1:{porta}")


def minha_aba(b):
    alvo = open(ABA).read().strip() if os.path.exists(ABA) else ""
    for ctx in b.contexts:
        for pg in ctx.pages:
            if alvo and alvo in pg.url: return pg
    raise SystemExit("aba propria nao encontrada (use: nova <url>)")


def main(a):
    cmd = a[0]
    with sync_playwright() as p:
        b = conectar(p)
        if cmd == "nova":
            pg = b.contexts[0].new_page(); pg.goto(a[1], wait_until="domcontentloaded"); time.sleep(4)
            open(ABA, "w").write(pg.url.split("?")[0].rstrip("/").split("/")[-1]); pg.bring_to_front(); print(pg.url); return
        pg = minha_aba(b)
        if cmd == "ir":
            pg.goto(a[1], wait_until="domcontentloaded"); time.sleep(4); open(ABA, "w").write(pg.url.split("?")[0].rstrip("/").split("/")[-1]); print(pg.url)
        elif cmd == "marcar":
            open(ABA, "w").write(pg.url.split("?")[0].rstrip("/").split("/")[-1]); print(pg.url)
        elif cmd == "url":
            print(pg.url, pg.viewport_size)
        elif cmd == "shot":
            arq = a[1] if len(a) > 1 else os.path.join(os.environ["TEMP"], "ivone.png")
            pg.bring_to_front()
            pg.screenshot(path=arq, scale="css")
            if len(a) > 2:
                from PIL import Image
                im = Image.open(arq); f = float(a[2]); im.resize((int(im.width * f), int(im.height * f))).save(arq)
            print(arq)
        elif cmd == "clique":
            pg.mouse.click(float(a[1]), float(a[2])); time.sleep(1)
        elif cmd == "baixar":            # baixar x y destino  -> clica em (x,y) e salva o download que vier
            with pg.expect_download(timeout=120000) as dl:
                pg.mouse.click(float(a[1]), float(a[2]))
            dl.value.save_as(a[3]); print(a[3], dl.value.suggested_filename)
        elif cmd == "baixar_js":         # baixar_js "<js que clica>" destino
            with pg.expect_download(timeout=120000) as dl:
                pg.evaluate(a[1])
            dl.value.save_as(a[2]); print(a[2], dl.value.suggested_filename)
        elif cmd == "mover":
            pg.mouse.move(float(a[1]), float(a[2])); time.sleep(2)
        elif cmd == "direito":
            pg.mouse.click(float(a[1]), float(a[2]), button="right"); time.sleep(1)
        elif cmd == "digitar":
            pg.keyboard.type(a[1], delay=8); time.sleep(.5)
        elif cmd == "tecla":
            pg.keyboard.press(a[1]); time.sleep(.5)
        elif cmd == "js":
            print(json.dumps(pg.evaluate(a[1]), ensure_ascii=False, indent=1)[:6000])
        elif cmd == "subir":
            pg.set_input_files(a[1], a[2:]); time.sleep(2); print("ok")
        elif cmd == "escolher":          # escolher "<texto do botao>" arq...  (intercepta a janela de arquivos)
            with pg.expect_file_chooser(timeout=15000) as fc:
                pg.get_by_role("button", name=a[1]).first.click()
            fc.value.set_files(a[2:]); time.sleep(3); print("ok")
        elif cmd == "esperar":           # esperar "<expr js booleana>" [segundos]
            fim = time.time() + float(a[2] if len(a) > 2 else 300)
            while time.time() < fim:
                if pg.evaluate(a[1]): print("pronto"); return
                time.sleep(4)
            print("tempo esgotado")
        elif cmd == "botao":             # botao "<texto>"  clica no primeiro botao com esse nome
            pg.get_by_role("button", name=a[1]).first.click(); time.sleep(1.5); print("ok")
        else:
            raise SystemExit("comando?")


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    main(sys.argv[1:])
