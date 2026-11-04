# Orquestrador do "olho da G4" (o PC só orquestra): sobe referência + renders, roda olho.py na VM, devolve o JSON curto.
# O modelo (Qwen3-VL-8B-Instruct, Apache-2.0) fica em /content/modelos/qwen3vl8b; numa VM nova vem do Drive
# (/content/drive/MyDrive/modelos/qwen3vl8b) ou, sem Drive, do Hugging Face.
# Uso: python -I olho_g4.py --ref ref.jpg --render a.png [b.png ...] [--rubrica r.json] [--amostras 3] [--saida out.json]
import argparse, json, os, sys, tarfile
os.environ.setdefault("T2_DONO", "olho_g4"); os.environ.setdefault("TEMP", "D:/tmp")
sys.path.insert(0, r"D:\tracer3d2"); import canal
AQ = os.path.dirname(os.path.abspath(__file__)); V = "/content/olho"
LOCAL, DRIVE = "/content/modelos/qwen3vl8b", "/content/drive/MyDrive/modelos/qwen3vl8b"

ap = argparse.ArgumentParser()
ap.add_argument("--ref", required=True)
ap.add_argument("--render", nargs="+", required=True)
ap.add_argument("--rubrica")
ap.add_argument("--amostras", type=int, default=3)
ap.add_argument("--saida", default=os.path.join(os.environ["TEMP"], "olho_saida.json"))
a = ap.parse_args()
try: canal.saude()
except SystemExit: canal.ligar()
tar = os.path.join(os.environ["TEMP"], "olho_in.tar")
nomes = []
with tarfile.open(tar, "w") as t:
    t.add(os.path.join(AQ, "olho.py"), arcname="olho.py")
    t.add(a.ref, arcname="ref" + os.path.splitext(a.ref)[1])
    for i, r in enumerate(a.render):
        n = f"r{i}_{os.path.basename(r)}"; nomes.append(n); t.add(r, arcname=n)
    if a.rubrica: t.add(a.rubrica, arcname="rubrica.json")
canal.subir(tar, f"{V}/in.tar")
ref = "ref" + os.path.splitext(a.ref)[1]
cmd = (f"rm -rf {V}/w && mkdir -p {V}/w && cd {V}/w && tar -xf ../in.tar && "
       f"(test -f {LOCAL}/config.json || (test -f {DRIVE}/config.json && mkdir -p /content/modelos && cp -r {DRIVE} /content/modelos/) || "
       f"python3 -c \"from huggingface_hub import snapshot_download as s; s('Qwen/Qwen3-VL-8B-Instruct', local_dir='{LOCAL}')\") && "
       f"python3 olho.py --ref {ref} --render {' '.join(nomes)} {'--rubrica rubrica.json' if a.rubrica else ''} --amostras {a.amostras} --modelo {LOCAL} --saida saida.json 2>&1 | tail -3")
out = canal.exec_vm(cmd, prazo=1800, estagnacao=900)
if "OLHO_OK" not in out: raise SystemExit("OLHO_FALHOU " + out[-1500:])
canal.baixar(f"{V}/w/saida.json", a.saida)
r = json.load(open(a.saida, encoding="utf-8"))
for it in r["renders"]:
    j = it.get("juiz") or {}
    print(f"{it['veredito'].upper():8s} {os.path.basename(it['arquivo'])} notas={j.get('notas')} dispersão={j.get('dispersao')} reprovou={it['reprovou_em']} defeitos={j.get('defeitos')}")
print("saida:", a.saida)
