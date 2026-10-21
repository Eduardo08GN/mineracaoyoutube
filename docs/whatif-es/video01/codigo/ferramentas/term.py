# Comando no terminal da VM (independe do kernel). Reabre o painel se caiu.  python term.py "<cmd>" [espera_s]
import sys, time
sys.path.insert(0, r"D:\prehistoria"); sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import colab
from playwright.sync_api import sync_playwright
cmd = sys.argv[1]; espera = float(sys.argv[2]) if len(sys.argv) > 2 else 6

def abrir(nb):
    if not nb.locator(".xterm-screen").count():
        nb.locator("text=Terminal").last.click(); time.sleep(10)

with sync_playwright() as p:
    nb = colab.aba(p); nb.bring_to_front()
    abrir(nb)
    if "[disconnected]" in nb.locator(".xterm-rows").last.inner_text():
        x = [e for e in nb.locator("[aria-label*='Fechar'], [aria-label*='Close']").all() if e.is_visible()]
        if x: x[-1].click(); time.sleep(3)
        abrir(nb)
    nb.locator(".xterm-screen").last.click(); time.sleep(.5)
    nb.keyboard.type("   clear; " + cmd + "\n", delay=3); time.sleep(espera)
    print(nb.locator(".xterm-rows").last.inner_text()[-3000:])
