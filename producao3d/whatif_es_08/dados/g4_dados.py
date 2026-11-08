# Orquestra os dados do video 08 na G4: baixa GHS-POP/ETOPO/Natural Earth, roda vm_calc.py, traz resultado.json e texturas.
import os, sys
os.environ.setdefault("T2_DONO", "mar_latam"); os.environ.setdefault("TEMP", "D:/tmp")
sys.path.insert(0, r"D:\tracer3d2"); import canal
AQ = os.path.dirname(os.path.abspath(__file__))
try: canal.saude()
except SystemExit:
    if not canal.reconectar(): canal.ligar()
canal.exec_vm("mkdir -p /content/mar/saida", prazo=60)
for n in ("vm_prep.sh", "vm_calc.py", "cidades.json"): canal.subir(os.path.join(AQ, n), "/content/mar/" + n)
print(canal.exec_vm("bash /content/mar/vm_prep.sh", prazo=2400, estagnacao=1500)[-1500:], flush=True)
print(canal.exec_vm("cd /content/mar && python3 vm_calc.py", prazo=5400, estagnacao=1800)[-4000:], flush=True)
os.makedirs(os.path.join(AQ, "saida"), exist_ok=True)
for n in ("resultado.json", "texturas.json", "nivel.png", "dem.png", "pop.png", "pais.png"):
    canal.baixar("/content/mar/saida/" + n, os.path.join(AQ, "saida", n))
print("DADOS_OK", flush=True)
