# Sessao na G4 "pro-ativa" (regra do Eduardo, 23/10/2026: a pipeline escuta ativamente a resposta de cada objeto orquestrado;
# surdez nao pode existir). Regras implementadas aqui:
#   1. cada passo CONFERE a resposta (marcador, tamanho, arquivo) e, se falhar, ABORTA a sessao na hora (nada segue as cegas);
#   2. a G4 e DESLIGADA em qualquer saida (sucesso, erro, Ctrl+C): try/finally + verificacao de "conectado depois: False";
#   3. toda espera tem prazo E deteccao de estagnacao: se o status na VM nao muda por N minutos, aborta (nao espera a toa);
#   4. tudo vai para um log com hora; a ultima linha diz SESSAO_OK ou FALHOU <passo>: <motivo>.
#   python sessao_g4.py <plano.json>        (passos: ligar, subir, rodar, preparar, stills, esperar, baixar)
import json, os, re, subprocess, sys, time

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
AQUI = os.path.dirname(os.path.abspath(__file__))
COLAB_DIR = os.environ.get("COLAB_DIR", os.path.join(AQUI, "..", "..", "eddie3d", "ferramentas"))
G4 = os.environ.get("G4_PY", os.path.join(COLAB_DIR, "g4.py"))
STILLS = r"D:\tracer3d\g4_stills.py"
LOG = None


def log(*x):
    linha = time.strftime("%H:%M:%S ") + " ".join(str(i) for i in x)
    print(linha, flush=True)
    if LOG: open(LOG, "a", encoding="utf-8").write(linha + "\n")


class Falha(Exception): pass


def sh(args, prazo, exige=None, nome=""):
    """Roda um comando local com prazo; exige = regex que PRECISA aparecer na saida (senao Falha)."""
    try:
        r = subprocess.run(args, capture_output=True, text=True, timeout=prazo, encoding="utf-8", errors="replace",
                           env={**os.environ, "MSYS_NO_PATHCONV": "1"})
    except subprocess.TimeoutExpired:
        raise Falha(f"{nome}: passou do prazo de {prazo}s")
    out = (r.stdout or "") + (r.stderr or "")
    if LOG: open(LOG, "a", encoding="utf-8").write(out[-4000:] + "\n")
    if r.returncode != 0 or (exige and not re.search(exige, out)):
        ult = [l for l in out.splitlines() if l.strip() and "socket.send" not in l][-3:]
        raise Falha(f"{nome}: resposta inesperada (rc={r.returncode}) {' | '.join(ult)[:400]}")
    return out


def g4(*args, prazo=600, exige=None, nome=None):
    return sh([sys.executable, G4, *args], prazo, exige, nome or args[0])


def ler_vm(caminho, n=600):
    out = g4("rodar", f"(tail -c {n} {caminho}) > /content/st.txt 2>&1", prazo=180, exige="disparado", nome="ler")
    out = g4("ler", "/content/st.txt", str(n + 200), prazo=180, exige="LER_OK", nome="ler")
    return out.split("LER_OK")[0]


def esperar(caminho, fim_regex, falha_regex, prazo_min, estagnado_min):
    """Escuta o status na VM: sai no marcador de fim; aborta no marcador de falha, no prazo ou se nada mudar por estagnado_min."""
    t0 = time.time(); ultimo = None; mudou = time.time()
    while True:
        txt = ler_vm(caminho)
        if re.search(falha_regex, txt): raise Falha(f"esperar {caminho}: a VM reportou falha: {txt.strip()[-300:]}")
        if re.search(fim_regex, txt): log("pronto:", txt.strip().splitlines()[-1][:160]); return txt
        if txt != ultimo: ultimo, mudou = txt, time.time(); log("progresso:", txt.strip().splitlines()[-1][:160] if txt.strip() else "(vazio)")
        checar_vigia_ui()
        if time.time() - mudou > estagnado_min * 60: raise Falha(f"esperar {caminho}: sem progresso ha {estagnado_min} min")
        if time.time() - t0 > prazo_min * 60: raise Falha(f"esperar {caminho}: passou do prazo de {prazo_min} min")
        time.sleep(30)


VIGIA_UI = "D:/tmp/vigia_ui"


VIGIA_PROC = None


def checar_vigia_ui():
    """O vigia de UI grava alerta.json quando ve um problema na tela do Colab: a sessao para na hora.
    Tambem exige que o proprio vigia esteja vivo (vigia morto = sessao surda)."""
    if VIGIA_PROC is not None and VIGIA_PROC.poll() is not None:
        err = open(os.path.join(VIGIA_UI, "vigia_err.txt"), encoding="utf-8", errors="replace").read()[-300:]
        raise Falha(f"vigia de UI morreu (rc={VIGIA_PROC.poll()}): {err}")
    a = os.path.join(VIGIA_UI, "alerta.json")
    if os.path.exists(a):
        j = json.load(open(a, encoding="utf-8")); raise Falha(f"vigia de UI: {j['tipo']} — {j['texto'][:200]} (print: {j.get('screenshot')})")


def passo(p):
    checar_vigia_ui()
    tipo = p["tipo"]; log(">>", tipo, p.get("rotulo", ""))
    if tipo == "ligar":
        g4("ligar", prazo=1200, exige="vigia ativo")
    elif tipo == "subir":            # zip local -> /content (painel Arquivos, pedacos, tamanho conferido)
        sh([sys.executable, "-c", f"import sys; sys.path.insert(0, r'{COLAB_DIR}'); import colab; colab.subir_painel(sys.argv[1])", p["zip"]],
           p.get("prazo", 2400), r"SUBIU_PAINEL \S+ \d+ True", "subir " + os.path.basename(p["zip"]))
    elif tipo == "rodar":            # dispara em segundo plano na VM e EXIGE prova de vida (arquivo de status criado)
        g4("rodar", p["cmd"], prazo=300, exige="disparado")
        if p.get("vida"):
            for _ in range(10):
                time.sleep(15)
                if ler_vm(p["vida"]).strip(): break
            else: raise Falha(f"rodar: {p['vida']} nao apareceu em 150 s (o comando nao comecou)")
    elif tipo == "preparar":
        sh([sys.executable, STILLS, "--preparar", p["projeto"], p["zip"]], 3600, r"PREP_FIM", "preparar")
        txt = ler_vm(p["projeto_vm"] + "/status.txt")
        if "npm_FALHOU" in txt or "PREPARADO" not in txt: raise Falha(f"preparar: {txt.strip()[-200:]}")
    elif tipo == "stills":
        t0 = time.time()
        sh([sys.executable, STILLS, p["projeto"], p["pasta"], *[str(s) for s in p["segundos"]]], 1200, r"G4: \d+ stills", "stills")
        log(f"stills {p['pasta']}: {time.time() - t0:.0f} s para {len(p['segundos'])}")
    elif tipo == "esperar":
        esperar(p["status"], p["fim"], p.get("falha", "FALHOU|Traceback"), p.get("prazo_min", 60), p.get("estagnado_min", 10))
    elif tipo == "baixar":
        g4("baixar", p["remoto"], p["local"], prazo=p.get("prazo", 1800), exige="baixado")
        if not os.path.exists(p["local"]) or os.path.getsize(p["local"]) == 0: raise Falha(f"baixar: {p['local']} vazio")
    else:
        raise Falha(f"passo desconhecido {tipo}")


def desligar():
    for _ in range(3):
        try:
            out = g4("desligar", prazo=600, nome="desligar")
            if "conectado depois: False" in out: log("G4 desligada (verificado)"); return True
        except Falha as e: log("desligar falhou:", e)
        time.sleep(10)
    log("ATENCAO: G4 PODE ESTAR LIGADA — o vigia na VM a desliga apos 20 min sem uso; conferir a aba do Colab")
    return False


if __name__ == "__main__":
    plano = json.load(open(sys.argv[1], encoding="utf-8"))
    LOG = plano.get("log", "D:/tmp/sessao_g4.log"); open(LOG, "w").close()
    ok = False
    os.makedirs(VIGIA_UI, exist_ok=True)
    for f in ("alerta.json", "parar", "vigia_ui.log"):
        if os.path.exists(os.path.join(VIGIA_UI, f)): os.remove(os.path.join(VIGIA_UI, f))
    vigia = subprocess.Popen([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), "vigia_ui.py"), VIGIA_UI],
                             stdout=subprocess.DEVNULL, stderr=open(os.path.join(VIGIA_UI, "vigia_err.txt"), "w"))
    globals()["VIGIA_PROC"] = vigia
    log("vigia de UI iniciado (pid", vigia.pid, ")")
    try:
        for _ in range(20):                       # prova de vida do vigia antes de qualquer passo
            time.sleep(1)
            lg = os.path.join(VIGIA_UI, "vigia_ui.log")
            if os.path.exists(lg) and "vigia de UI ativo" in open(lg, encoding="utf-8").read(): break
            checar_vigia_ui()
        else: raise Falha("vigia de UI nao confirmou que esta ativo em 20 s")
        for p in plano["passos"]: passo(p)
        checar_vigia_ui()
        ok = True
    except Falha as e:
        log("FALHOU", e)
    except KeyboardInterrupt:
        log("FALHOU interrompido")
    finally:
        desligar()
        open(os.path.join(VIGIA_UI, "parar"), "w").close()
        try: vigia.wait(30)
        except Exception: vigia.kill()
    log("SESSAO_OK" if ok else "SESSAO_FALHOU")
    sys.exit(0 if ok else 1)
