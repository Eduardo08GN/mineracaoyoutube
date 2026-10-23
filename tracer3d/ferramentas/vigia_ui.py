# Vigia de UI/UX do Colab (pro-ativo, 23/10/2026): fica conectado a aba do notebook durante a sessao, le a tela a cada 4 s e
# AGE de prontidao sobre avisos e dialogos — nada de surdez. Roda em paralelo a sessao_g4.py (que o liga/desliga e le os alertas).
#   benigno conhecido (aviso de arquivos temporarios etc.)  -> fecha na hora (Enter / OK) e registra
#   problema (runtime caiu, sem GPU, limite de uso, erro)   -> grava ALERTA (a sessao aborta e desliga a G4)
#   desconhecido                                            -> screenshot + ALERTA (nao clica as cegas)
#   CAPTCHA / verificacao humana                            -> ALERTA para o Eduardo (nunca resolver)
#   pagina travada (avaliar a pagina nao responde em 20 s)  -> ALERTA "pagina_travada"
#   python vigia_ui.py [saida_dir=D:/tmp/vigia_ui]
import json, os, re, sys, time

sys.path.insert(0, os.environ.get("COLAB_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "eddie3d", "ferramentas"))); sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from playwright.sync_api import sync_playwright
import colab

SAIDA = sys.argv[1] if len(sys.argv) > 1 else "D:/tmp/vigia_ui"
ALERTA = os.path.join(SAIDA, "alerta.json"); LOG = os.path.join(SAIDA, "vigia_ui.log"); PARAR = os.path.join(SAIDA, "parar")

BENIGNOS = [  # (regex do texto do dialogo, acao)
    (r"Confira se os arquivos foram salvos|Make sure your files are saved|arquivos deste ambiente", "ok"),
    (r"Aviso.*arquivos|Warning.*files", "ok"),
]
PROBLEMAS = [
    (r"Ambiente de execução desconectado|Runtime disconnected|desconectado", "runtime_caiu"),
    (r"Não é possível se conectar a um back-end de GPU|Cannot connect to GPU backend|GPU indispon", "sem_gpu"),
    (r"limite de uso|usage limit|unidades de computação (insuficientes|esgotadas)|out of compute units", "sem_unidades"),
    (r"Ocorreu um erro|An error occurred|Falha ao|Failed to", "erro"),
]
HUMANO = r"recaptcha|captcha|não sou um robô|I'm not a robot|Ainda está aí|Are you still there"

JS_DIALOGOS = """() => {
  const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 40 && r.height > 20 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const out = [];
  const pega = root => root.querySelectorAll('[role=dialog], [role=alertdialog], mwc-dialog[open], md-dialog[open], paper-dialog, colab-dialog, .goog-modalpopup, iframe[src*=recaptcha]').forEach(d => { if (vis(d)) out.push((d.innerText || d.getAttribute('src') || '').slice(0, 400)); });
  pega(document);
  document.querySelectorAll('*').forEach(e => { if (e.shadowRoot) pega(e.shadowRoot); });
  return out;
}"""


def log(*x):
    l = time.strftime("%H:%M:%S ") + " ".join(map(str, x)); print(l, flush=True)
    open(LOG, "a", encoding="utf-8").write(l + "\n")


def alertar(tipo, texto, nb=None):
    shot = ""
    if nb:
        try: shot = os.path.join(SAIDA, f"alerta_{int(time.time())}.png"); nb.screenshot(path=shot, timeout=10000)
        except Exception: shot = ""
    json.dump({"tipo": tipo, "texto": texto[:400], "hora": time.strftime("%H:%M:%S"), "screenshot": shot},
              open(ALERTA, "w", encoding="utf-8"), ensure_ascii=False)
    log("ALERTA", tipo, texto[:160].replace("\n", " "))


def tratar(nb, texto):
    for rx, acao in BENIGNOS:
        if re.search(rx, texto, re.I | re.S):
            nb.keyboard.press("Enter"); time.sleep(0.6)
            try:
                b = [e for e in nb.get_by_role("button", name=re.compile(r"^(OK|Ok|Fechar|Close)$")).all() if e.is_visible()]
                if b: b[-1].click(force=True, timeout=3000)
            except Exception: pass
            log("fechado (benigno):", texto[:100].replace("\n", " ")); return
    if re.search(HUMANO, texto, re.I): return alertar("humano", texto, nb)
    for rx, tipo in PROBLEMAS:
        if re.search(rx, texto, re.I): return alertar(tipo, texto, nb)
    alertar("desconhecido", texto, nb)


if __name__ == "__main__":
    os.makedirs(SAIDA, exist_ok=True)
    for f in (ALERTA, PARAR):
        if os.path.exists(f): os.remove(f)
    log("vigia de UI ativo")
    with sync_playwright() as p:
        nb = colab.aba(p); vistos = {}
        while not os.path.exists(PARAR):
            try:
                dialogos = nb.evaluate(JS_DIALOGOS)
            except Exception as e:
                if "Timeout" in str(e) or "Target closed" in str(e): alertar("pagina_travada", str(e)[:200])
                time.sleep(10); continue
            try:   # menu esquecido aberto bloqueia cliques da automacao: fecha
                if nb.evaluate("() => [...document.querySelectorAll('.goog-menu')].some(m => m.offsetParent !== null && getComputedStyle(m).visibility !== 'hidden')"):
                    nb.keyboard.press("Escape"); log("menu aberto fechado")
            except Exception: pass
            for t in dialogos:
                if t.strip() and time.time() - vistos.get(t, 0) > 20:     # mesmo dialogo: reage de novo so apos 20 s
                    vistos[t] = time.time(); tratar(nb, t)
            time.sleep(4)
    log("vigia de UI parado")
