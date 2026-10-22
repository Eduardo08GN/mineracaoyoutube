# Controla o notebook do Colab aberto num perfil Dolphin (config local) pela porta CDP.
#   python colab.py rodar "<codigo da celula>" [espera_s]   -> cria uma celula no fim, roda e imprime a saida
#   python colab.py shot arquivo.png
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright  # noqa: E402

import local  # noqa: E402

URL = (local.cfg("colab_url") or "").strip()
JS_SAIDA = "() => { const c = [...document.querySelectorAll('.cell')].pop(); return c ? c.innerText : ''; }"
JS_RODANDO = "() => { const c = [...document.querySelectorAll('.cell')].pop(); return !!(c && c.querySelector('.running, colab-run-button[running], .cell-execution.running')); }"


def aba(p):
    b = local.conectar(p)
    return next(x for c in b.contexts for x in c.pages if URL.split("/")[-1] in x.url)


def saida(nb):
    """Texto da saida da ultima celula (o Colab pode desenhar a saida na pagina ou num iframe)."""
    c = nb.locator(".cell").last
    txt = ""
    try: txt = c.locator(".output").first.inner_text(timeout=3000)
    except Exception: pass
    if not txt.strip():
        for fr in nb.frames:
            if fr != nb.main_frame:
                try: txt += fr.evaluate("() => document.body ? document.body.innerText : ''")
                except Exception: pass
    return txt


def nova_celula(nb):
    nb.keyboard.press("Escape"); time.sleep(0.3)
    n0 = nb.locator(".cell").count()
    nb.locator(".cell").last.scroll_into_view_if_needed()
    nb.locator(".cell").last.click(position={"x": 4, "y": 4}); time.sleep(0.4)
    nb.keyboard.press("Escape"); time.sleep(0.2)
    nb.keyboard.press("Control+m"); time.sleep(0.15); nb.keyboard.press("b"); time.sleep(1.5)
    if nb.locator(".cell").count() <= n0:
        nb.mouse.click(170, 84); time.sleep(1.5)
    if nb.locator(".cell").count() <= n0: raise SystemExit("nao criou celula nova")
    cel = nb.locator(".cell").last; cel.scroll_into_view_if_needed()
    cel.click(position={"x": 4, "y": 4}); time.sleep(0.3)
    cel.locator("textarea").first.focus(); time.sleep(0.4)


def rodar(codigo, espera=600, marca=None):
    """Cria uma celula nova no fim com `codigo`, roda e espera `marca` aparecer na saida."""
    import uuid
    if marca:
        if marca in codigo:
            tok = uuid.uuid4().hex[:8]; codigo = codigo.replace(marca, marca + tok); marca = marca + tok
    with sync_playwright() as p:
        nb = aba(p); nb.bring_to_front()
        # interrompe e apaga sobras antes: um widget de upload esquecido rodando trava a fila e a celula nova nunca executa
        try: limpar(nb)
        except Exception: pass
        nova_celula(nb)
        nb.keyboard.insert_text(codigo); time.sleep(0.8)
        nb.keyboard.press("Control+Enter")
        fim = time.time() + espera
        while time.time() < fim and marca:
            time.sleep(5)
            if marca in saida(nb): break
        time.sleep(2)
        txt = saida(nb); print(txt[-3000:]); return txt


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if sys.argv[1] == "rodar":
        rodar(sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 600, sys.argv[4] if len(sys.argv) > 4 else None)
    elif sys.argv[1] == "shot":
        with sync_playwright() as p:
            aba(p).screenshot(path=sys.argv[2])


def subir_grande(arquivo, espera=900, pedaco=45 * 1024 * 1024):
    """Arquivos > 50 MB nao passam pelo Playwright para um navegador remoto (CDP): sobe em pedacos e junta na VM."""
    tam = os.path.getsize(arquivo)
    if tam <= pedaco: return subir(arquivo, espera)
    nome = os.path.basename(arquivo); tmp = os.path.join("D:/tmp", "pedacos_" + nome); os.makedirs(tmp, exist_ok=True)
    partes = []
    with open(arquivo, "rb") as f:
        k = 0
        while True:
            b = f.read(pedaco)
            if not b: break
            pt = os.path.join(tmp, f"{nome}.p{k:02d}"); open(pt, "wb").write(b); partes.append(pt); k += 1
    for pt in partes: subir(pt, espera)
    junta = " ".join(f"'/content/{os.path.basename(pt)}'" for pt in partes)
    out = rodar(f"!cat {junta} > '/content/{nome}' && rm -f {junta} && ls -l '/content/{nome}' && echo JUNTOU_OK", 600, "JUNTOU_OK")
    for pt in partes: os.remove(pt)
    return out


def subir(arquivo, espera=600):
    """Roda files.upload() numa celula nova e entrega o arquivo ao input da saida (fica em /content)."""
    with sync_playwright() as p:
        nb = aba(p); nb.bring_to_front()
        try: limpar(nb)
        except Exception: pass
        nova_celula(nb)
        import uuid
        tok = "SUBIU" + uuid.uuid4().hex[:8]
        nb.keyboard.insert_text("from google.colab import files\nup = files.upload()\nprint('" + tok + "', list(up))"); time.sleep(0.8)
        # frames que ja existiam: a celula que o limpar deixa guarda a saida (e o widget) do upload anterior;
        # entregar o arquivo a esse widget velho travava a fila com "No file chosen"
        def ids_upload():
            r = {}
            for fr in nb.frames:
                if fr == nb.main_frame: continue
                try:
                    for i in fr.evaluate("() => [...document.querySelectorAll('input[type=file]')].map(e => e.id)"): r[i] = fr
                except Exception: pass
            return r
        # o Colab reaproveita iframes: o widget novo se reconhece pelo id do input (files-<aleatorio>), nao pelo frame
        antes = set(ids_upload())
        nb.keyboard.press("Control+Enter")
        alvo = None
        for _ in range(120):
            time.sleep(2)
            # so o iframe de saida da celula nova: a pagina principal tem outro input[type=file] escondido (navegador de arquivos)
            atual = ids_upload(); novos = {i: fr for i, fr in atual.items() if i not in antes}
            if os.environ.get("DEBUG_SUBIR"): print("antes", antes, "agora", list(atual), flush=True)
            if novos: idn, alvo = next(iter(novos.items())); break
        if not alvo: raise SystemExit("o campo de upload nao apareceu")
        campo = alvo.locator(f"input[type=file][id='{idn}']")
        campo.set_input_files(arquivo, timeout=600000)
        n = campo.evaluate("e => e.files.length")
        if not n: raise SystemExit("o arquivo nao entrou no widget de upload")
        fim = time.time() + espera
        while time.time() < fim:
            time.sleep(4)
            if tok + " [" in saida(nb): break
        print(saida(nb)[-600:])
        # apaga a celula ja executada: o Colab as vezes reexecuta celulas antigas e o widget de upload travava a fila
        try: limpar(nb)
        except Exception: pass


def _sem_git(caminho):
    """O Git Bash do Windows troca /content/... por C:/Program Files/Git/content/...: desfaz."""
    import re
    return re.sub(r"^[A-Za-z]:/Program Files/Git", "", caminho.replace("\\", "/"))


def baixar(caminho_remoto, destino, espera=900):
    """files.download() na VM e captura o download no navegador."""
    caminho_remoto = _sem_git(caminho_remoto)
    with sync_playwright() as p:
        nb = aba(p); nb.bring_to_front()
        nova_celula(nb)
        nb.keyboard.insert_text(f"from google.colab import files\nfiles.download('{caminho_remoto}')"); time.sleep(0.8)
        with nb.expect_download(timeout=espera * 1000) as dl:
            nb.keyboard.press("Control+Enter")
        dl.value.save_as(destino)
        # o Playwright guarda uma copia temporaria em %TEMP% (no C:, que esta cheio); apaga assim que a copia no destino existe
        try: dl.value.delete()
        except Exception: pass
        print("baixado", destino)


if __name__ == "__main__" and sys.argv[1] == "subir": subir(sys.argv[2])
if __name__ == "__main__" and sys.argv[1] == "baixar": baixar(sys.argv[2], sys.argv[3])


def _menu_runtime(nb):
    import re
    nb.get_by_text(re.compile(r"^(Runtime|Ambiente de execução)$")).first.click(); time.sleep(1.2)


def _item(nb, *textos):
    for t in textos:
        it = [e for e in nb.get_by_text(t).all() if e.is_visible()]
        if it: return it[0]
    return None


def conectado(nb):
    """True se ha VM ligada (o botao 'Conectar'/'Connect' some quando ha runtime)."""
    import re
    bt = [e for e in nb.get_by_text(re.compile(r"^(Conectar|Connect|Reconectar|Reconnect)$")).all() if e.is_visible()]
    return not bt


def limpar(nb):
    """Interrompe o que estiver rodando e apaga todas as celulas (sobras de execucoes anteriores travam a fila)."""
    nb.keyboard.press("Escape")
    try:
        _menu_runtime(nb)
        it = _item(nb, "Interromper execução", "Interrupt execution")
        if it: it.click(); time.sleep(3)
        else: nb.keyboard.press("Escape")
    except Exception: pass
    for _ in range(60):
        if nb.locator(".cell").count() <= 1: break
        c = nb.locator(".cell").first; c.scroll_into_view_if_needed(); c.click(position={"x": 4, "y": 4}); time.sleep(.3)
        nb.keyboard.press("Escape"); time.sleep(.2); nb.keyboard.press("Control+m"); time.sleep(.15); nb.keyboard.press("d"); time.sleep(.6)
    try:
        ed = nb.locator(".cell").last.locator(".view-lines").first
        ed.scroll_into_view_if_needed(); ed.click(force=True, position={'x': 3, 'y': 3}); time.sleep(.3)
        nb.keyboard.press("Control+a"); nb.keyboard.press("Delete"); time.sleep(.3); nb.keyboard.press("Escape")
    except Exception as e: print("nao esvaziou a ultima celula:", e)


def desligar():
    """Desliga a G4 de verdade: runtime.unassign() por dentro da VM (independe do idioma da interface),
    depois o menu (PT ou EN) como reserva, e confere que o botao Conectar voltou."""
    with sync_playwright() as p:
        nb = aba(p); nb.bring_to_front()
        if not conectado(nb): print("G4 ja estava desligada (botao Conectar visivel)"); return
        try: limpar(nb)
        except Exception as e: print("limpar falhou:", e)
        try:
            nova_celula(nb); nb.keyboard.insert_text("from google.colab import runtime\nruntime.unassign()"); time.sleep(.6)
            nb.keyboard.press("Control+Enter"); time.sleep(12)
        except Exception as e: print("unassign pela celula falhou:", e)
        if conectado(nb):
            try:
                nb.keyboard.press("Escape"); _menu_runtime(nb)
                it = _item(nb, "Desconectar e excluir ambiente de execução", "Disconnect and delete runtime")
                if it:
                    it.click(); time.sleep(2)
                    for nome in ("Sim", "Yes"):
                        bt = nb.get_by_role("button", name=nome)
                        if bt.count(): bt.first.click(); time.sleep(6); break
            except Exception as e: print("menu falhou:", e)
        time.sleep(3)
        print("G4 desligada (verificado)" if not conectado(nb) else "ATENCAO: G4 AINDA PARECE LIGADA")


if __name__ == "__main__" and sys.argv[1] == "desligar": desligar()


SETUP = ("apt-get -qq install -y libxi6 libxkbcommon0 libsm6 libgl1 libegl1 > /dev/null 2>&1; cd /content && "
         "for i in 1 2 3; do /content/blender-4.2.3-linux-x64/blender --version 2>/dev/null | grep -q 'Blender 4.2.3' && break; "
         "rm -rf blender-4.2.3-linux-x64 b.tar.xz; wget -q -O b.tar.xz https://download.blender.org/release/Blender4.2/blender-4.2.3-linux-x64.tar.xz "
         "&& tar -xf b.tar.xz; done; /content/blender-4.2.3-linux-x64/blender --version 2>/dev/null | head -1; "
         "mkdir -p /usr/share/glvnd/egl_vendor.d && "
         "echo '{\"file_format_version\":\"1.0.0\",\"ICD\":{\"library_path\":\"/usr/lib64-nvidia/libEGL_nvidia.so.0\"}}'"
         " > /usr/share/glvnd/egl_vendor.d/10_nvidia.json && rm -f /usr/share/glvnd/egl_vendor.d/50_mesa.json")


def render_completo(pacote, destino, quadros=600, partes=3):
    """Tudo de uma vez, com a G4 desligada no fim AINDA QUE algo falhe:
    instala, sobe o pacote, renderiza em partes paralelas (espera com `wait`, nunca com pgrep), junta, baixa."""
    try:
        rodar("!" + SETUP + "; echo FIM_SETUP", 900, "FIM_SETUP")
        subir(pacote)
        passo = quadros // partes
        jobs = " ".join(f"($B -b --factory-startup -P blender/cena.py -- --assets /content/proj/assets "
                        f"--saida /content/proj/parte_{i}.mp4 --ini {i * passo} --fim {min(quadros, (i + 1) * passo) - 1} "
                        f"> /content/proj/log_{i}.txt 2>&1) &" for i in range(partes))
        cmd = ("!cd /content && rm -rf proj && unzip -qo pacote.zip -d proj && cd proj && export LD_LIBRARY_PATH=/usr/lib64-nvidia && "
               "B=/content/blender-4.2.3-linux-x64/blender && " + jobs + " wait; "
               "for i in $(seq 0 " + str(partes - 1) + "); do echo file parte_$i.mp4; done > lista.txt; "
               "ffmpeg -v error -y -f concat -safe 0 -i lista.txt -c copy fundo.mp4 && "
               "zip -q -j resultado.zip fundo.mp4 parte_0_mamute.json; grep -c 'Append frame' log_*.txt; echo FIM_RENDER")
        rodar(cmd, 7200, "FIM_RENDER")
        baixar("/content/proj/resultado.zip", destino)
    finally:
        desligar()


if __name__ == "__main__" and sys.argv[1] == "render": render_completo(sys.argv[2], sys.argv[3])


VIGIA = """import threading, subprocess, time
def _ativo():
    try:
        u = int(subprocess.run(['nvidia-smi', '--query-gpu=utilization.gpu', '--format=csv,noheader,nounits'], capture_output=True, text=True).stdout.split()[0])
        if u > 5: return True
    except Exception: pass
    return subprocess.run(['pgrep', '-f', 'blender|remotion|chrome|node|etapas.py|repro.sh|acestep|uv sync|pip install|npm|wget|ffmpeg'], capture_output=True).returncode == 0
def _vigia(limite_min=20):
    ocioso = 0
    while True:
        time.sleep(60)
        ocioso = 0 if _ativo() else ocioso + 1
        open('/content/vigia.txt', 'w').write(str(ocioso))
        if ocioso >= limite_min:
            from google.colab import runtime
            runtime.unassign()
if not any(t.name == 'vigia' for t in threading.enumerate()):
    threading.Thread(target=_vigia, name='vigia', daemon=True).start()
print('VIGIA_OK')"""


def render_video(pacote, destino, pedaco=600, paralelo=12):
    """Render do video inteiro: G4 sobe, vigia interno liga, renderiza, baixa e DESLIGA (mesmo em erro)."""
    try:
        with sync_playwright() as p:
            limpar(aba(p))
        import base64
        if "VIGIA_OK" not in rodar("exec(__import__('base64').b64decode('" + base64.b64encode(VIGIA.encode()).decode() + "').decode())", 300, "VIGIA_OK"):
            raise SystemExit("vigia nao subiu: abortando (a G4 sera desligada)")
        if "Blender 4.2.3" not in rodar("!" + SETUP + "; echo FIM_SETUP", 1200, "FIM_SETUP"):
            raise SystemExit("Blender nao instalou: abortando (a G4 sera desligada)")
        subir(pacote)
        rodar(f"!cd /content && rm -rf proj && unzip -qo $(ls -t /content/pacote*.zip | head -1) -d proj && cd proj && python blender/render_vm.py {pedaco} {paralelo} "
              f"> /content/render.log 2>&1; tail -5 /content/render.log; echo FIM_RENDER", 6 * 3600, "FIM_RENDER")
        baixar("/content/proj/resultado.zip", destino, espera=1800)
    finally:
        desligar()


if __name__ == "__main__" and sys.argv[1] == "video": render_video(sys.argv[2], sys.argv[3])


def terminal(cmd, espera=4):
    """Digita um comando no terminal da VM (painel Terminal do Colab) e devolve o texto visivel do terminal."""
    with sync_playwright() as p:
        nb = aba(p); nb.bring_to_front()
        rows = nb.locator(".xterm-rows")
        if rows.count() and "[disconnected]" in rows.last.inner_text():
            fechar = nb.locator("[aria-label*='Close'], [title*='Close']").filter(has_text="")
            for e in nb.get_by_text("Terminal", exact=True).all():
                pass
            nb.mouse.click(1458, 141); time.sleep(2)              # X da aba Terminal
        if not nb.locator(".xterm-rows").count():
            nb.mouse.click(183, 893); time.sleep(6)
        nb.locator(".xterm-screen").last.click(); time.sleep(.4)
        nb.keyboard.type(cmd + "\n", delay=2); time.sleep(espera)
        return nb.locator(".xterm-rows").last.inner_text()


if __name__ == "__main__" and sys.argv[1] == "term": print(terminal(sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else 4))


def subir_painel(arquivo, espera=1800, pedaco=45 * 1024 * 1024):
    """Upload pelo painel Arquivos do Colab ("Upload to session storage"): grava direto em /content, sem celula nem widget
    (o files.upload() as vezes rodava vazio). Pedacos <= 45 MB (limite de 50 MB do Playwright por CDP); confere pelo tamanho na VM."""
    nome = os.path.basename(arquivo); tam = os.path.getsize(arquivo)
    tmp = os.path.join("D:/tmp", "pedacos_" + nome); os.makedirs(tmp, exist_ok=True)
    partes = []
    with open(arquivo, "rb") as f:
        k = 0
        while True:
            b = f.read(pedaco)
            if not b: break
            pt = os.path.join(tmp, f"{nome}.p{k:02d}"); open(pt, "wb").write(b); partes.append((pt, len(b))); k += 1
    for pt, n in partes:
        with sync_playwright() as p:
            nb = aba(p); nb.bring_to_front(); nb.keyboard.press("Escape")
            if not nb.locator("input[type=file]").count():
                nb.locator("[aria-label='Files'], [aria-label='Arquivos'], [title='Files'], [title='Arquivos']").first.click(); time.sleep(3)
            nb.locator("input[type=file]").first.set_input_files(pt, timeout=900000); time.sleep(3)
            ok = nb.get_by_role("button", name="OK")
            if ok.count() and ok.first.is_visible(): ok.first.click()
        alvo = "/content/" + os.path.basename(pt); fim = time.time() + espera
        while time.time() < fim:
            time.sleep(20)
            out = rodar(f"import os; print('TAM', os.path.getsize('{alvo}') if os.path.exists('{alvo}') else -1, 'TAM_OK')", 120, "TAM_OK")
            import re
            m = re.search(r"TAM (-?\d+) TAM_OK", out)
            if m and int(m.group(1)) == n: break
        else:
            raise SystemExit(f"pedaco {alvo} nao chegou")
        os.remove(pt)
    junta = " ".join(f"'/content/{os.path.basename(pt)}'" for pt, _ in partes)
    # idempotente: o Colab as vezes reexecuta a celula; um segundo `cat ... > final` sem os pedacos zerava o arquivo
    p0 = f"/content/{os.path.basename(partes[0][0])}"
    out = rodar(f"![ -f '{p0}' ] && cat {junta} > '/content/{nome}.tmp' && mv '/content/{nome}.tmp' '/content/{nome}' && rm -f {junta}; stat -c 'TAMFINAL %s' '/content/{nome}' && echo JUNTOU_OK", 600, "JUNTOU_OK")
    print(f"SUBIU_PAINEL {nome} {tam}", "JUNTOU_OK" in out and f"TAMFINAL {tam}" in out)
    return out
