# Teste da fila paralela (04/11): o clipe do batedor (16 s, 24 fps, 6 subquadros) inteiro num Chromium x fatiado em 4.
import os, sys, time
os.environ.setdefault("T2_DONO", "k16"); os.environ.setdefault("TEMP", "D:/tmp")
sys.path.insert(0, r"D:\tracer3d2"); import canal, fila_g4

V = "/content/teardown"
CFG = "--config maquinas/seekrieg/cfg_batedor_clip.json --pixfmt yuv420p10le --crf 16 --size 1600x900 --dpr 1.2"
um = [{"nome": "inteiro", "faixa": "3d", "cwd": V, "cmd": f"{fila_g4.EGL} && node sims/capture.mjs seekrieg {CFG} --fps 24 --out teardown-out/k16_teste_inteiro.mp4 2>&1 | tail -2"}]
t = time.time(); r1 = fila_g4.rodar(um); a = time.time() - t
t = time.time(); r4 = fila_g4.rodar(fila_g4.fatias("teste", "seekrieg", V, 0, 16, 4, "teardown-out/k16_teste_fatiado.mp4", extra=CFG)); b = time.time() - t
print(f"INTEIRO {a:.0f}s ({r1['inteiro']['estado']}) | FATIADO x4 {b:.0f}s ({r4['teste_junta']['estado']}) | ganho {a / max(b, 1):.1f}x")
print(r4["teste_junta"]["cauda"][-300:])
print(canal.exec_vm("nproc; nvidia-smi --query-gpu=memory.used,memory.total,utilization.gpu --format=csv,noheader; ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 /content/teardown/teardown-out/k16_teste_inteiro.mp4; ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 /content/teardown/teardown-out/k16_teste_fatiado.mp4", prazo=300)[-400:])
