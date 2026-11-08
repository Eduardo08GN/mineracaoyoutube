# P4: mix final NA G4 (áudio também fora do PC). Sobe mixar_p4.py + voz + camas + roteiro + plano, roda lá e baixa
# audio/mix_final.wav e .m4a (AAC já codificado: o mux final é só cópia de fluxos). Uso: python -I g4_mixar_p4.py
import glob, os, sys
os.environ.setdefault("T2_DONO", "learjet_p4"); os.environ.setdefault("TEMP", "D:/tmp")
sys.path.insert(0, r"D:\tracer3d2"); import canal
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); V = "/content/p4mix"
arqs = ["ferramentas/mixar_p4.py", "roteiro/skript_de.json", "cena/learjet_p4/plano.json"] + [os.path.relpath(f, R).replace("\\", "/") for f in
        glob.glob(os.path.join(R, "voz", "*.wav")) + glob.glob(os.path.join(R, "audio", "pm", "*.flac"))]
for a in arqs: canal.subir(os.path.join(R, a), f"{V}/{a}")
out = canal.exec_vm(f"cd {V} && pip -q install soundfile pyloudnorm > pip.log 2>&1; python3 ferramentas/mixar_p4.py 2>&1 | tail -5 && "
                    f"ffmpeg -v error -y -i audio/mix_final.wav -c:a aac -b:a 256k -ar 48000 audio/mix_final.m4a && echo MIX_OK", prazo=1800, estagnacao=900)
print(out[-800:])
if "MIX_OK" not in out: raise SystemExit("MIX_FALHOU")
os.makedirs(os.path.join(R, "audio"), exist_ok=True)
for a in ("mix_final.wav", "mix_final.m4a"): canal.baixar(f"{V}/audio/{a}", os.path.join(R, "audio", a))
print("MIX_BAIXADO")
