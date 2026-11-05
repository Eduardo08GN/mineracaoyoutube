# K17: voz + vídeo NA G4. Junta as falas na ordem com 0,45 s entre capítulos (o mesmo PAUSA do frases.py, então as legendas
# e os cortes batem), loudnorm a -14 LUFS (pico -1 dBTP), SEM música (regra do Kriegsmomente), e une ao mudo que já está na VM.
import json, os, sys
os.environ.setdefault("T2_DONO", "k17"); os.environ.setdefault("TEMP", "D:/tmp")
sys.path.insert(0, r"D:\tracer3d2"); import canal
K = r"D:\kriegschronik\k17_pioniere"; W = "/content/k17_voz"; V = "/content/teardown"
caps = json.load(open(os.path.join(K, "roteiro", "skript_de.json"), encoding="utf-8"))["kapitel"]
for c in caps: canal.subir(os.path.join(K, "voz", c["id"] + ".wav"), f"{W}/{c['id']}.wav")
ins = " ".join(f"-i {c['id']}.wav" for c in caps)
n = len(caps)
fc = "".join(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo,apad=pad_dur=0.45[a{i}];" for i in range(n)) + "".join(f"[a{i}]" for i in range(n)) + f"concat=n={n}:v=0:a=1,loudnorm=I=-14:TP=-1:LRA=11[out]"
out = canal.exec_vm(f"cd {W} && ffmpeg -loglevel error -y {ins} -filter_complex \"{fc}\" -map \"[out]\" -ar 48000 -c:a aac -b:a 256k voz.m4a && "
                    f"ffmpeg -loglevel error -y -i {V}/teardown-out/k17_mudo.mp4 -i voz.m4a -map 0:v -map 1:a -c copy -shortest -movflags +faststart k17_final.mp4 && "
                    f"ffprobe -v error -show_entries format=duration:stream=codec_type -of compact k17_final.mp4 && echo MUX_OK", prazo=1800, estagnacao=900)
print(out[-600:])
if "MUX_OK" not in out: raise SystemExit("MUX_FALHOU")
dest = os.path.join(K, "entrega", "warum_sprengte_frankreich_1870_die_maasbruecken_nicht.mp4")
canal.baixar(f"{W}/k17_final.mp4", dest)
print("FINAL", dest)
