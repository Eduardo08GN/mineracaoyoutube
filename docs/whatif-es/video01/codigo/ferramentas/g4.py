# Passos curtos na G4 (cada chamada termina rapido).  python g4.py ligar|enviar <zip>|disparar|status|baixar <remoto> <local>|desligar
import base64, contextlib, io, sys
sys.path.insert(0, r"D:\prehistoria"); sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import colab
from playwright.sync_api import sync_playwright

def fechar_terminal():
    import time
    with sync_playwright() as p:
        nb = colab.aba(p)
        if nb.locator(".xterm-screen").count():
            x = [e for e in nb.locator("[aria-label*='Fechar'], [aria-label*='Close']").all() if e.is_visible()]
            if x: x[-1].click(); time.sleep(2)

def cel(cod, marca, espera=180):
    fechar_terminal()
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        out = colab.rodar(cod, espera, marca)
    return out

cmd = sys.argv[1]
if cmd == "ligar":
    # apaga as celulas (o unassign da sessao anterior fica na fila) e conecta pelo botao antes de mandar o vigia
    import time, re
    with sync_playwright() as p:
        nb = colab.aba(p); nb.bring_to_front(); colab.limpar(nb)
        if not colab.conectado(nb):
            bt = [e for e in nb.locator("colab-connect-button").all() if e.is_visible()]
            (bt[0] if bt else nb.get_by_text(re.compile(r"^(Conectar|Reconectar|Connect|Reconnect)$")).first).click()
            for _ in range(60):
                time.sleep(5)
                if colab.conectado(nb): break
        print("conectado:", colab.conectado(nb))
    out = cel("exec(__import__('base64').b64decode('" + base64.b64encode(colab.VIGIA.encode()).decode() + "').decode())", "VIGIA_OK", 900)
    print("VIGIA_OK" in out and "vigia ativo" or "FALHOU: " + out[-400:])
elif cmd == "enviar":
    b64 = base64.b64encode(open(sys.argv[2], "rb").read()).decode()
    dest = sys.argv[3] if len(sys.argv) > 3 else '/content/es'
    out = cel(f"import base64, zipfile, io, os\nos.makedirs('{dest}', exist_ok=True)\n" + f"zipfile.ZipFile(io.BytesIO(base64.b64decode('{b64}'))).extractall('{dest}')\n" + f"print('FIM_PKG', sorted(os.listdir('{dest}')))", "FIM_PKG", 300)
    print(out[-300:])
elif cmd == "enviar_grande":
    # pacote grande em pedacos (celula com texto gigante travava o navegador)
    b64 = base64.b64encode(open(sys.argv[2], "rb").read()).decode()
    dest = sys.argv[3] if len(sys.argv) > 3 else '/content/es'
    T = int(__import__("os").environ.get("PEDACO", 45000)); partes = [b64[i:i + T] for i in range(0, len(b64), T)]
    # cada pedaco num arquivo proprio sobrescrito: se a celula rodar duas vezes (acontece), nada duplica
    for k, pt in enumerate(partes):
        out = cel(f"open('/content/_up_{k:03d}.b64','w').write('{pt}'); print('PT_{k}_OK')", f"PT_{k}_OK", 180)
        if f"PT_{k}_OK" not in out: print("falhou parte", k); sys.exit(1)
    out = cel(f"import base64, zipfile, io, os\nos.makedirs('{dest}', exist_ok=True)\n" + f"zipfile.ZipFile(io.BytesIO(base64.b64decode(''.join(open(f'/content/_up_{{i:03d}}.b64').read() for i in range({len(partes)}))))).extractall('{dest}')\n" + f"print('FIM_PKG', sorted(os.listdir('{dest}')))", "FIM_PKG", 300)
    print(len(partes), "partes;", out[-300:])
elif cmd == "disparar":
    out = cel("!cd /content/es && rm -f status.txt && setsid nohup bash vm/producao.sh > producao.out 2>&1 < /dev/null &\n!sleep 3; cat /content/es/status.txt; echo FIM_DISP", "FIM_DISP", 120)
    print(out[-300:])
elif cmd == "status":
    out = cel("!cat /content/es/status.txt; echo ---; cat /content/au/status.txt 2>/dev/null; tail -2 /content/au/efeitos.log 2>/dev/null; echo ---; tail -c 300 /content/es/render.log 2>/dev/null; echo; tail -3 /content/es/musica.log 2>/dev/null; echo; nvidia-smi --query-gpu=utilization.gpu,memory.used --format=csv,noheader; cat /content/vigia.txt; echo; echo FIM_ST", "FIM_ST", 120)
    print(out[-2500:])
elif cmd == "baixar":
    # limpa as celulas antes: o texto novo caia na celula do download anterior e o Colab baixava o arquivo velho primeiro
    fechar_terminal()
    with sync_playwright() as p: colab.limpar(colab.aba(p))
    colab.baixar(sys.argv[2], sys.argv[3], espera=3600)
elif cmd == "desligar":
    colab.desligar()
    with sync_playwright() as p: print("conectado depois:", colab.conectado(colab.aba(p)))
