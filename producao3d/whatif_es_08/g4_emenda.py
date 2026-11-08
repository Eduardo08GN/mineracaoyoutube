# Re-renderiza [ini, fim] (ampliado para quadros-chave) e emenda no mudo com -c copy; depois refaz o mux com o mix.
import os, subprocess, sys
os.environ.setdefault("T2_DONO", "mar_latam"); os.environ.setdefault("TEMP", "D:/tmp"); os.environ.setdefault("T2_PROJ", "08_mar_latam")
sys.path.insert(0, r"D:\tracer3d2"); import canal
R = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(R, "v1"); ini, fim = float(sys.argv[1]), float(sys.argv[2])
MUDO = os.path.join(R, "render", "RENDER_MUDO_NAO_PUBLICAR_v1.mp4"); k0, k1 = canal.janela(MUDO, ini, fim); print("janela", k0, k1, flush=True)
TR = os.path.join(R, "render", "trecho.mp4"); canal.garantir(P); canal.render(P, k0, k1, TR)
NOVO = os.path.join(R, "render", "RENDER_MUDO_NAO_PUBLICAR_v1b.mp4"); canal.juntar(MUDO, TR, k0, k1, NOVO); os.replace(NOVO, MUDO)
FINAL = os.path.join(R, "entrega", "que_pasaria_si_el_mar_subiera_latinoamerica.mp4")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", MUDO, "-i", os.path.join(R, "audio", "mix.m4a"), "-map", "0:v:0", "-map", "1:a:0", "-c", "copy", "-shortest", FINAL], check=True)
print("EMENDA_OK", flush=True)
