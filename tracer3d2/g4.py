# G4 compartilhada entre conversas (docs/g4-concomitante.md, 19/11/2026). As sessoes NAO rodam mais ligar/desligar:
# pedem a G4, rodam e soltam; quem liga e desliga e este modulo (ligar em voo unico; desligar so pelo zelador).
#   python g4.py pedir  --dono <dono> --vram <GB> [--g4 1|2|auto] [--ttl 900] [--espera 3600] [--cofre rel:dst,...]
#   python g4.py rodar  --dono <dono> "<comando>" [--prazo 3600]     roda em /content/jobs/<dono>/ renovando a reserva
#   python g4.py renovar|soltar --dono <dono>
#   python g4.py status [--g4 1|2]
#   python g4.py zelador [--ocioso 600]        UM por PC: limpa reservas vencidas e desliga a G4 sem reserva ha <ocioso> s
# Reserva (lease) = {dono, vram, ate, g4}. Vence sozinha se a sessao morrer. Orcamento: soma das vram vivas <= TETO_GB.
import argparse, json, os, subprocess, sys, threading, time

TMP = os.environ.get("T2_TMP", "D:/tmp"); TETO_GB = int(os.environ.get("T2_VRAM_TETO", "90"))
AQUI = os.path.dirname(os.path.abspath(__file__))


def arq(g): return f"{TMP}/g4_reservas_{g}.json"


class Trava:
    def __init__(self, nome): self.d = f"{TMP}/{nome}.lock"
    def __enter__(self):
        t0 = time.time()
        while True:
            try: os.mkdir(self.d); return self
            except FileExistsError:
                try:   # 19/11: a trava pode sumir entre o mkdir e o getmtime (outro processo a soltou): so tentar de novo
                    if time.time() - os.path.getmtime(self.d) > 30: os.rmdir(self.d)   # trava orfa
                except (FileNotFoundError, OSError): continue
                if time.time() - t0 > 60: raise SystemExit("G4_TRAVA_PRESA " + self.d)
                time.sleep(0.2)
    def __exit__(self, *a): os.rmdir(self.d)


def vivas(g):
    """Reservas nao vencidas da G4 g (ja grava o arquivo limpo). Chamar dentro da Trava."""
    try: r = json.load(open(arq(g), encoding="utf-8"))
    except (FileNotFoundError, ValueError): r = {}
    r = {k: v for k, v in r.items() if v["ate"] > time.time()}
    json.dump(r, open(arq(g), "w", encoding="utf-8"), indent=1); return r


def no_ar(g):
    return subprocess.run([sys.executable, "-X", "utf8", os.path.join(AQUI, "canal.py"), "saude"], capture_output=True, text=True,
                          env={**os.environ, "T2_G4": g, "T2_DONO": "g4_status"}, timeout=90).returncode == 0


def escolher(vram):
    """auto: a G4 que ja esta no ar e tem folga; senao a 1."""
    for g in ("1", "2"):
        with Trava(f"g4_res_{g}"): usado = sum(v["vram"] for v in vivas(g).values())
        if usado + vram <= TETO_GB and no_ar(g): return g
    return "1"


def reservar(g, dono, vram, ttl, espera, log=print):
    t0 = bat = time.time()
    while True:
        with Trava(f"g4_res_{g}"):
            r = vivas(g); usado = sum(v["vram"] for k, v in r.items() if k != dono)
            if usado + vram <= TETO_GB:
                r[dono] = {"dono": dono, "vram": vram, "ttl": ttl, "ate": time.time() + ttl, "g4": g,
                           "desde": r.get(dono, {}).get("desde", time.strftime("%H:%M:%S"))}
                json.dump(r, open(arq(g), "w", encoding="utf-8"), indent=1); return
        if time.time() - t0 > espera: raise SystemExit(f"G4_FILA_PRAZO: {usado} GB em uso na G4-{g}, pedido de {vram} GB nao coube")
        if time.time() - bat >= 60: bat = time.time(); log(f"BATIMENTO fila G4-{g}: {usado}/{TETO_GB} GB em uso; esperando {vram} GB")
        time.sleep(5)


def renovar(g, dono):
    with Trava(f"g4_res_{g}"):
        r = vivas(g)
        if dono not in r: return False
        r[dono]["ate"] = time.time() + r[dono]["ttl"]; json.dump(r, open(arq(g), "w", encoding="utf-8"), indent=1); return True


def soltar(g, dono):
    with Trava(f"g4_res_{g}"):
        r = vivas(g); r.pop(dono, None); json.dump(r, open(arq(g), "w", encoding="utf-8"), indent=1)


def de_quem(dono):
    for g in ("1", "2"):
        with Trava(f"g4_res_{g}"):
            if dono in vivas(g): return g
    raise SystemExit(f"G4_SEM_RESERVA: {dono} nao tem reserva viva; rode 'g4.py pedir' antes")


def canal_de(g, dono):
    os.environ["T2_G4"] = g; os.environ["T2_DONO"] = dono; sys.path.insert(0, AQUI)
    import canal; return canal


def garantir_no_ar(g, dono, log=print):
    """Ligar em voo unico: so um processo liga; os outros esperam e reaproveitam."""
    c = canal_de(g, dono)
    def ok():
        try: c.saude(); return True
        except SystemExit: return False
    if ok(): return c
    t0 = time.time()
    while True:
        try: os.mkdir(f"{TMP}/g4_ligando_{g}.lock")
        except FileExistsError:
            if ok(): return c
            if time.time() - os.path.getmtime(f"{TMP}/g4_ligando_{g}.lock") > 1500: os.rmdir(f"{TMP}/g4_ligando_{g}.lock"); continue
            if time.time() - t0 > 1800: raise SystemExit("G4_LIGAR_PRAZO")
            time.sleep(10); continue
        try:
            if not ok():
                log(f"G4-{g} fora do ar: ligando (voo unico)")
                if not c.reconectar(): c.ligar()
            return c
        finally: os.rmdir(f"{TMP}/g4_ligando_{g}.lock")


def cmd_pedir(a):
    g = escolher(a.vram) if a.g4 == "auto" else a.g4
    reservar(g, a.dono, a.vram, a.ttl, a.espera)
    c = garantir_no_ar(g, a.dono); renovar(g, a.dono)
    c.exec_vm(f"mkdir -p /content/jobs/{a.dono}", prazo=120)
    if a.cofre:
        import cofre; cofre.puxar(a.cofre.split(","))
    print(f"G4_PRONTA g4={g} dono={a.dono} vram={a.vram} pasta=/content/jobs/{a.dono}")


def cmd_rodar(a):
    g = de_quem(a.dono); c = garantir_no_ar(g, a.dono); parar = threading.Event()
    def bate():
        while not parar.wait(60): renovar(g, a.dono)
    threading.Thread(target=bate, daemon=True).start()
    try: print(c.exec_vm(a.comando, cwd=f"/content/jobs/{a.dono}", prazo=a.prazo, estagnacao=a.estagnacao))
    finally: parar.set(); renovar(g, a.dono)


def cmd_status(a):
    for g in ([a.g4] if a.g4 in ("1", "2") else ["1", "2"]):
        with Trava(f"g4_res_{g}"): r = vivas(g)
        print(f"G4-{g}: {'NO AR' if no_ar(g) else 'desligada'} | {sum(v['vram'] for v in r.values())}/{TETO_GB} GB reservados")
        for v in r.values(): print(f"   {v['dono']}: {v['vram']} GB desde {v['desde']}, vence em {int(v['ate'] - time.time())} s")


def cmd_zelador(a):
    """Desliga a G4 quando nao ha reserva nova (g4.py) nem antiga (porteiro) nem job rodando ha <ocioso> s."""
    try: os.mkdir(f"{TMP}/g4_zelador.lock")
    except FileExistsError:
        if time.time() - os.path.getmtime(f"{TMP}/g4_zelador.lock") < 180: raise SystemExit("ZELADOR_JA_RODANDO")
    vazio = {}
    try:
        while True:
            os.utime(f"{TMP}/g4_zelador.lock")
            for g in ("1", "2"):
              try:   # 19/11: um erro passageiro numa volta nao pode matar o zelador
                with Trava(f"g4_res_{g}"): r = vivas(g)
                env = {**os.environ, "T2_G4": g, "T2_DONO": "g4_zelador", "T2_PAPEL": "maestro"}
                if g == "2": env["T2_PORTEIRO"] = f"{TMP}/porteiro_2.json"
                s = subprocess.run([sys.executable, "-X", "utf8", "-c",
                                    "import json,canal,porteiro;print(json.dumps({'s':canal.saude(),'p':list(porteiro.estado())}))"],
                                   capture_output=True, text=True, cwd=AQUI, env=env, timeout=120)
                if s.returncode != 0: vazio.pop(g, None); continue                       # desligada: nada a fazer
                d = json.loads(s.stdout.strip().splitlines()[-1])
                if r or d["p"] or d["s"].get("rodando") or d["s"].get("daemons"): vazio.pop(g, None); continue
                vazio.setdefault(g, time.time())
                if time.time() - vazio[g] >= a.ocioso:
                    print(time.strftime("%H:%M:%S"), f"zelador: G4-{g} sem reserva nem job ha {a.ocioso} s; desligando", flush=True)
                    subprocess.run([sys.executable, "-X", "utf8", "canal.py", "desligar"], cwd=AQUI, env=env, timeout=600)
                    vazio.pop(g, None)
              except Exception as e: print(time.strftime("%H:%M:%S"), "zelador: erro na volta", g, repr(e)[:160], flush=True)
            time.sleep(60)
    finally: os.rmdir(f"{TMP}/g4_zelador.lock")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    p = argparse.ArgumentParser(); s = p.add_subparsers(dest="c", required=True)
    x = s.add_parser("pedir"); x.add_argument("--dono", required=True); x.add_argument("--vram", type=int, required=True)
    x.add_argument("--g4", default="auto"); x.add_argument("--ttl", type=int, default=900); x.add_argument("--espera", type=int, default=3600)
    x.add_argument("--cofre", default="")
    x = s.add_parser("rodar"); x.add_argument("--dono", required=True); x.add_argument("comando")
    x.add_argument("--prazo", type=int, default=3600); x.add_argument("--estagnacao", type=int, default=600)
    for n in ("renovar", "soltar"): s.add_parser(n).add_argument("--dono", required=True)
    s.add_parser("status").add_argument("--g4", default="")
    s.add_parser("zelador").add_argument("--ocioso", type=int, default=600)
    a = p.parse_args()
    if a.c == "pedir": cmd_pedir(a)
    elif a.c == "rodar": cmd_rodar(a)
    elif a.c == "renovar": print("RENOVADA" if renovar(de_quem(a.dono), a.dono) else "SEM_RESERVA")
    elif a.c == "soltar": soltar(de_quem(a.dono), a.dono); print("SOLTA")
    elif a.c == "status": cmd_status(a)
    elif a.c == "zelador": cmd_zelador(a)
