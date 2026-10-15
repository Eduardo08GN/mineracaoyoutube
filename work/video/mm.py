# Narracao pela voz clonada no MiniMax, pela sessao web logada no perfil Dolphin "12 Ivone" (usado por
# montar_headcast.etapa_voz_minimax). O audio e' baixado pela API do historico da pagina; a url e os cabecalhos dessa
# chamada sao da SESSAO do usuario e ficam fora do repo, no arquivo MM_HIST_REQ (padrao D:/tmp/hist_req.json).
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

HIST_REQ = os.environ.get("MM_HIST_REQ", "D:/tmp/hist_req.json")
VOZ = os.environ.get("MM_VOZ", "Mamaw Opal")


def aba(b):
    for c in b.contexts:
        for pg in c.pages:
            if "minimax.io/audio" in pg.url: return pg
    raise RuntimeError("abra https://www.minimax.io/audio/text-to-speech no perfil Dolphin antes")


def _creditos(pg):
    t = pg.evaluate(r"""()=>[...document.querySelectorAll('button')].map(b=>b.innerText.trim()).find(x=>/^[0-9][0-9,]*$/.test(x))||''""")
    return int(t.replace(",", "")) if t else None


def audio_do_texto(pg, texto):
    """A url do mp3 do item do historico com exatamente esse texto (o mais novo)."""
    q = json.load(open(HIST_REQ))
    r = pg.context.request.get(q["url"], headers=q["headers"])
    lst = ((r.json() if r.status == 200 else {}).get("data") or {}).get("audio_list") or []
    for it in lst:
        if (it.get("text") or "").strip() == texto.strip() and it.get("audio_url"): return it["audio_url"]
    return None


def _modelo_atual(pg):
    return pg.evaluate("()=>{const s=document.querySelector('.ant-select-selector'); return s? s.innerText : ''}")


def _garantir_modelo(pg, modelo):
    """Recarregar a pagina volta o modelo para o hd (1 credito/car): troca para o turbo antes de gerar."""
    for _ in range(3):
        if modelo in _modelo_atual(pg): return
        pg.locator("[role=combobox]").first.click(force=True); time.sleep(1.5)
        op = pg.locator(".ant-select-item-option", has_text=modelo)
        (op.first if op.count() else pg.get_by_text(modelo, exact=True).first).click(); time.sleep(1.5)
    if modelo not in _modelo_atual(pg): raise RuntimeError(f"nao consegui escolher o modelo {modelo}: '{_modelo_atual(pg)}'")


def gerar_tts(pg, texto, saida, modelo="speech-2.8-turbo"):
    """Cola o texto, gera (~0,6 credito/caractere no turbo) e baixa o mp3 do historico. Devolve (creditos antes,
    creditos depois, origem)."""
    pg.get_by_text("Settings", exact=True).first.click(); time.sleep(1)
    _garantir_modelo(pg, modelo)
    if not pg.evaluate(f"()=>document.body.innerText.includes({json.dumps(VOZ)})"):
        raise RuntimeError(f"a voz selecionada nao e' a {VOZ}")
    c0 = _creditos(pg)
    ja = audio_do_texto(pg, texto)                      # ja' gerado antes (retomada): nao paga de novo
    if ja:
        open(saida, "wb").write(pg.context.request.get(ja).body()); return c0, c0, ["historico"]
    ed = pg.locator("[contenteditable=true]:visible, textarea:visible").first
    norm = lambda t: " ".join((t or "").split())
    for _ in range(3):
        pg.mouse.click(1503, 700); time.sleep(1.2)                # a borracha ao lado do contador limpa o editor (Slate)
        t = norm(ed.inner_text())
        if t and not t.startswith("Start typing"): continue
        ed.click(); time.sleep(.3)
        pg.keyboard.insert_text(texto); time.sleep(1)
        if norm(ed.inner_text()) == norm(texto): break
    else:
        raise RuntimeError("o editor nao ficou com o texto certo (nada foi gerado)")
    b = pg.get_by_role("button", name="Generate")
    if not b.count() or not b.last.is_visible(): b = pg.get_by_role("button", name="Regenerate")
    b.last.click()
    fim = time.time() + 300
    while time.time() < fim:
        time.sleep(3)
        c1 = _creditos(pg)
        if c1 is not None and c0 is not None and c1 < c0: break
    else:
        raise RuntimeError("a geracao nao terminou (creditos nao mudaram)")
    url = None
    for _ in range(20):
        time.sleep(3)
        url = audio_do_texto(pg, texto)
        if url: break
    if not url: raise RuntimeError("o audio nao apareceu no historico")
    r = pg.context.request.get(url)
    if r.status != 200: raise RuntimeError(f"download HTTP {r.status}")
    open(saida, "wb").write(r.body())
    return c0, c1, [url[-60:]]
