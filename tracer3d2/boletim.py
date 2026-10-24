# Tracer3D 2.0 - boletim para o maestro (Opus escuta com Monitor): 1 linha a cada BOLETIM_S, ALERTA na hora.
# Le /saude (nao conta como atividade: nao segura a G4 ligada) e o progresso do projeto. Nunca liga a G4.
#   python boletim.py <projeto v1> [boletim_s=300]
import glob, json, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import canal

proj = sys.argv[1]; passo = int(sys.argv[2]) if len(sys.argv) > 2 else 300
ult = 0; caiu = False
while True:
    try: s = canal.saude(); erro = None
    except SystemExit as e: s = None; erro = str(e)[:120]
    except Exception as e: s = None; erro = repr(e)[:120]
    if s is None and not caiu: print(time.strftime("%H:%M:%S"), "ALERTA G4 sem resposta:", erro, flush=True); caiu = True
    if s and caiu: print(time.strftime("%H:%M:%S"), "G4 de volta", flush=True); caiu = False
    if time.time() - ult >= passo:
        ult = time.time()
        cenas = sum(len(json.load(open(f, encoding="utf-8"))) for f in glob.glob(os.path.join(proj, "src", "cenas", "*.json")))
        kit = len(glob.glob(os.path.join(proj, "src", "kit", "*", "*.tsx")))
        pastas = sorted(glob.glob(os.path.join(proj, "teste", "*")), key=os.path.getmtime)[-1:]
        g4 = f"G4 ON {s['uptime'] // 60} min, ocioso {s['ocioso']} s, gpu {s['gpu']}, stills {'ok' if s['stills'] else 'NAO'}" if s else "G4 OFF"
        print(time.strftime("%H:%M:%S"), f"BOLETIM {g4} · kit {kit} arquivos · {cenas} batidas em JSON · ultimo still: "
              f"{os.path.basename(pastas[0]) if pastas else '-'}", flush=True)
    time.sleep(60)
