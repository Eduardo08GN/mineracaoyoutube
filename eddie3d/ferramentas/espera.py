# Espera um marcador aparecer num arquivo de status da VM. Uso: python espera.py <arquivo> <marcador> [max_min]
import sys, time; sys.path.insert(0, __import__("os").path.dirname(__import__("os").path.abspath(__file__))); sys.stdout.reconfigure(encoding="utf-8")
arq, marca = sys.argv[1], sys.argv[2]; lim = time.time() + 60 * float(sys.argv[3] if len(sys.argv) > 3 else 30)
src = open(r'D:\whatif_es\g4.py', encoding='utf-8').read().split("cmd = sys.argv[1]")[0]
sys.argv = ['x', 'status']; exec(src)
while time.time() < lim:
    o = cel(f"!cat {arq}; cat /content/status34.txt; echo FIM_W", "FIM_W", 120)
    corpo = o.split("FIM_W")[0]
    if marca in corpo.replace(f"cat {arq}", ""): print(corpo[-1500:]); sys.exit(0)
    if "FALHOU" in corpo: print("FALHA", corpo[-1500:]); sys.exit(1)
    time.sleep(60)
print("TEMPO", o[-1500:])
