# Gera as imagens do modo headcast no Google Vids (painel "Imagem"), no perfil Dolphin "12 Ivone", pela porta CDP.
# O estilo e' o aprovado pelo Eduardo em 12/10 (data/headcast_teste/comparacao_estilo.jpg): quadro de filmadora caseira
# antiga, luz comum, foco profundo, flagrante no meio da acao, enquadramento imperfeito, cenario vivido.
#   python work/video/vids_imagem.py abrir                       abre o documento do Vids e o painel Imagem (nao gera)
#   python work/video/vids_imagem.py gerar "<cena>" saida.png    gera UMA imagem com o estilo e salva
# Trabalha so' na aba do documento DOC (acha pela URL ou abre uma nova): nao mexe na aba do Flow (.aba) nem nas outras.
import json
import os
import sys
import time

from playwright.sync_api import sync_playwright

import ivone

AQUI = os.path.dirname(os.path.abspath(__file__))
ESTADO = os.path.join(AQUI, "estado_vids.json")
# o documento "Video sem titulo" criado no teste de 12/10 (Drive da conta do perfil); trocar aqui se for apagado
DOC = os.environ.get("VIDS_DOC") or "1g7TXplXkTI6cXeYmxDV9rZWMpgFhb1mTitFgtQhTrOo"
URL = f"https://docs.google.com/videos/d/{DOC}/edit"

ABERTURA = "A still frame from a home video shot on an old consumer camcorder, around 2012, wide 16:9 landscape frame. "
TECNICA = (" Ordinary daylight from the window or household lamps, automatic white balance, slightly soft focus, mild sensor "
           "noise and video compression, slightly lifted blacks, muted natural colors. Deep focus, wide phone-like lens at eye "
           "level, imperfect handheld framing with something cut off at the edge. Candid moment caught mid-action, nobody "
           "poses or looks at the camera. Lived-in, worn, real environment with small everyday imperfections. No cinematic "
           "lighting, no bokeh, no color grading, no beauty retouching, no text, no logos.")


def prompt(cena):
    """O prompt inteiro: a abertura de estilo, a cena da frase (o que ela diz, ao pe' da letra) e a parte tecnica."""
    return ABERTURA + cena.strip().rstrip(".") + "." + TECNICA


def _aba(b):
    for ctx in b.contexts:
        for pg in ctx.pages:
            if DOC in pg.url: return pg
    pg = b.contexts[0].new_page(); pg.goto(URL, wait_until="domcontentloaded"); time.sleep(6)
    return pg


def _painel_imagem(pg):
    """Abre o painel "Gerar uma imagem" (se fechado) e devolve a caixa de texto VISIVEL do pedido."""
    t = pg.get_by_text("Gerar uma imagem")
    if not any(t.nth(i).is_visible() for i in range(t.count())):
        pg.keyboard.press("Escape"); time.sleep(1)                      # fecha dialogo de boas-vindas, se houver
        pg.get_by_text("Imagem", exact=True).last.click(); time.sleep(3)
    return pg.locator("textarea:visible").last


def _imagens(pg):
    return pg.evaluate("() => [...document.images].filter(i => i.src.includes('gg-dl')).map(i => i.src)")


def abrir():
    with sync_playwright() as p:
        pg = _aba(ivone.conectar(p)); pg.bring_to_front()
        caixa = _painel_imagem(pg)
        print("painel aberto, caixa de texto:", caixa.count() > 0, "| imagens ja' geradas:", len(_imagens(pg)))


def gerar(cena, saida, espera_s=180, estilo=True):
    """Digita o prompt (digitado, nao colado), clica Criar, espera a imagem nova e baixa na resolucao cheia.
    estilo=False manda o texto como esta' (retrato-ancora do avatar, que olha para a camera)."""
    with sync_playwright() as p:
        pg = _aba(ivone.conectar(p)); pg.bring_to_front()
        caixa = _painel_imagem(pg)
        antes = set(_imagens(pg))
        caixa.click(); time.sleep(.5)
        pg.keyboard.type(prompt(cena) if estilo else cena, delay=6); time.sleep(1)
        pg.get_by_role("button", name="Criar").last.click()
        fim, nova = time.time() + espera_s, None
        while time.time() < fim and not nova:
            time.sleep(5)
            nova = next((s for s in _imagens(pg) if s not in antes), None)
        if not nova: raise SystemExit("a imagem nao apareceu a tempo")
        r = pg.context.request.get(nova)                 # o fetch da pagina e' barrado (CORS); o contexto do navegador nao
        if r.status != 200: raise SystemExit(f"download falhou: HTTP {r.status}")
        from io import BytesIO
        from PIL import Image
        im = Image.open(BytesIO(r.body())).convert("RGB"); im.save(saida)
        reg = json.load(open(ESTADO, encoding="utf-8")) if os.path.exists(ESTADO) else []
        reg.append({"quando": time.strftime("%Y-%m-%d %H:%M"), "cena": cena, "arquivo": saida, "tamanho": im.size})
        json.dump(reg, open(ESTADO, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(saida, im.size)
        return saida


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    a = sys.argv[1:]
    if a[:1] == ["abrir"]: abrir()
    elif a[:1] == ["gerar"] and len(a) == 3: gerar(a[1], a[2])
    elif a[:1] == ["bruto"] and len(a) == 3: gerar(a[1], a[2], estilo=False)
    else: raise SystemExit(__doc__ or "uso: abrir | gerar \"<cena>\" saida.png")
