# Stills na G4 (Tracer3D): substitui os stills locais em WebGL por software (~72 s cada, fila de 3 vagas) por stills na GPU
# (~2 s cada, com o look final). Uma chamada = 1 celula no Colab: manda src/ (e arquivos de public/ alterados desde a ultima
# sincronizacao), faz bundle, renderiza os quadros em paralelo e devolve os JPGs por download.
#   python g4_stills.py <projeto v1> <pasta_saida> <segundo> [<segundo> ...]   [ESCALA=0.5]
# Pre-requisito: G4 ligada e o projeto ja preparado nela (g4_stills.py --preparar <projeto v1> <zip do projeto>).
# Varios agentes podem chamar ao mesmo tempo: uma trava local serializa o uso do Colab (a aba e uma so).
import io, json, os, sys, tarfile, time, zipfile
sys.path.insert(0, os.environ.get("COLAB_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "eddie3d", "ferramentas")))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import colab

REMOTO = "/content/kc/v1"
TRAVA = r"D:\tmp\g4_stills.lock"
LIMITE_PUBLIC = 25 * 1024 * 1024        # acima disso, sincronizar public/ com --preparar (subir_painel)


def travar():
    os.makedirs(os.path.dirname(TRAVA), exist_ok=True)
    while True:
        try: os.mkdir(TRAVA); return
        except FileExistsError:
            if time.time() - os.path.getmtime(TRAVA) > 900: os.rmdir(TRAVA)   # trava velha de um processo morto
            time.sleep(3)


def guarda():
    """Nunca ligar a G4 por acidente: uma celula num notebook desconectado faz o Colab subir uma G4 nova SEM o vigia que a
    desliga por ociosidade (o 'Conectando...' de 23/10/2026). So segue se ja estiver conectada (ligada por g4.py ligar)."""
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        if not colab.conectado(colab.aba(p)):
            raise SystemExit("G4_DESLIGADA: ligue com 'python eddie3d/ferramentas/g4.py ligar' (sobe o vigia: desliga sozinha apos 20 min sem uso)")


def pacote(proj):
    """zip em memoria com src/ inteiro + arquivos de public/ mais novos que a ultima sincronizacao."""
    marca = os.path.join(proj, "teste", ".g4_sync")
    t0 = os.path.getmtime(marca) if os.path.exists(marca) else time.time()
    b = io.BytesIO(); pub = 0
    with zipfile.ZipFile(b, "w", zipfile.ZIP_DEFLATED) as z:
        for raiz, _, arqs in os.walk(os.path.join(proj, "src")):
            for a in arqs: z.write(os.path.join(raiz, a), os.path.relpath(os.path.join(raiz, a), proj).replace("\\", "/"))
        for raiz, _, arqs in os.walk(os.path.join(proj, "public")):
            for a in arqs:
                f = os.path.join(raiz, a)
                if os.path.getmtime(f) > t0:
                    pub += os.path.getsize(f); z.write(f, os.path.relpath(f, proj).replace("\\", "/"))
    if pub > LIMITE_PUBLIC: raise SystemExit(f"public/ mudou {pub / 1e6:.0f} MB: rode --preparar para subir o projeto inteiro")
    return b.getvalue(), marca


def stills(proj, pasta, segundos, escala):
    dados, marca = pacote(proj)
    fps = json.load(open(os.path.join(proj, "src", "plano.json"), encoding="utf-8")).get("fps", 30)
    quadros = " ".join(str(round(s * fps)) for s in segundos)
    tag = f"{pasta}_{int(time.time())}"
    # o zip vai pelo painel Arquivos (input de arquivo), NUNCA como texto base64 numa celula: 400 KB de texto numa celula
    # congelaram o editor do Colab ("Page Unresponsive", 23/10/2026)
    zloc = os.path.join("D:/tmp", f"src_{tag}.zip"); open(zloc, "wb").write(dados)
    colab.subir_painel(zloc)
    cod = (f"!cd {REMOTO} && unzip -q -o /content/src_{tag}.zip && rm -f /content/src_{tag}.zip && "
           f"bash /content/vm_comum/stills_srv.sh {REMOTO} {tag} {escala} {quadros} 2>&1 | tail -25; echo STILLS_FEITOS")
    t0 = time.time()
    out = colab.rodar(cod, 900, "STILLS_FEITOS")
    if "TAR_OK" not in out: raise SystemExit("falhou na G4:\n" + out[-1500:])
    destino = os.path.join(proj, "teste", pasta); os.makedirs(destino, exist_ok=True)
    tar = os.path.join(destino, "_g4.tar")
    colab.baixar(f"/content/st_{tag}.tar", tar, espera=600)
    with tarfile.open(tar) as t:
        for m in t.getmembers():
            if not m.isfile(): continue
            q = int(os.path.splitext(os.path.basename(m.name))[0])
            open(os.path.join(destino, f"t{q / fps:07.2f}.jpg"), "wb").write(t.extractfile(m).read())
    os.remove(tar)
    open(marca, "w").close()
    print(f"G4: {len(segundos)} stills em {time.time() - t0:.0f} s -> {destino}")


def preparar(proj, zip_projeto):
    """Sobe o projeto inteiro (pedacos de 45 MB pelo painel), os scripts da VM, e prepara (EGL, npm install)."""
    colab.subir_painel(zip_projeto)
    colab.rodar(f"!mkdir -p /content/kc && cd /content/kc && unzip -q -o /content/{os.path.basename(zip_projeto)} && cp -r vm_comum /content/ && "
                f"bash preparar_kc.sh {REMOTO} > prep.out 2>&1; tail -2 {REMOTO}/status.txt; echo PREP_FIM", 1800, "PREP_FIM")
    open(os.path.join(proj, "teste", ".g4_sync"), "w").close()


if __name__ == "__main__":
    if sys.argv[1] == "--preparar":
        travar()
        try: guarda(); preparar(sys.argv[2], sys.argv[3])
        finally: os.rmdir(TRAVA)
    else:
        proj, pasta, segs = sys.argv[1], sys.argv[2], [float(s) for s in sys.argv[3:]]
        travar()
        try: guarda(); stills(proj, pasta, segs, os.environ.get("ESCALA", "0.5"))
        finally: os.rmdir(TRAVA)
