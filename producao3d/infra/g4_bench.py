# Benchmark da G4: render Remotion (K17 v2, 60 s = 1800 quadros) variando P (Chromes) e ESC (s entre partidas),
# amostrando GPU/VRAM/CPU a cada 2 s e contando fatias que caíram em WebGL por software. Saída: D:/tmp/wgpu/bench.txt
import os, sys
os.environ.setdefault("T2_DONO", "bench"); os.environ.setdefault("TEMP", "D:/tmp")
sys.path.insert(0, r"D:\tracer3d2"); import canal
try: canal.saude()
except SystemExit: canal.ligar()
log = open(r"D:\tmp\wgpu\bench.txt", "a", encoding="utf-8")
def p(*a): print(*a, flush=True); log.write(" ".join(map(str, a)) + "\n"); log.flush()
R = "/content/t2/proj/k17_v2_v1"
MON = r"""nohup bash -c 'while true; do echo $(date +%s) $(nvidia-smi --query-gpu=utilization.gpu,memory.used --format=csv,noheader,nounits | tr -d " ") $(top -bn1 | grep "Cpu(s)" | awk "{print \$2+\$4}"); sleep 2; done' > /tmp/mon_PP.txt 2>&1 & echo $! > /tmp/mon.pid"""
RES = ("import sys\nL=[l.split() for l in open(sys.argv[1]) if len(l.split())>=3]\n"
       "g=[float(x[1].split(',')[0]) for x in L]; v=[float(x[1].split(',')[1]) for x in L]; c=[float(x[2]) for x in L]\n"
       "print('GPU_media %.0f%% pico %.0f%% | VRAM_pico %.0f MiB | CPU_media %.0f%% | amostras %d' % (sum(g)/len(g), max(g), max(v), sum(c)/len(c), len(L)))\n")
loc = os.path.join(os.environ["TEMP"], "bench_res.py"); open(loc, "w").write(RES); canal.subir(loc, "/tmp/res.py")
canal.subir(r"D:\tracer3d2\vm\render.sh", "/content/t2/vm/render.sh")
for P, ESC in ((48, 0.3), (96, 0.2), (32, 0.3)):
    out = canal.exec_vm(f"rm -f {R}/.render.lock; {MON.replace('PP', str(P))}; T0=$(date +%s); ESCALONA={ESC} P={P} bash /content/t2/vm/render.sh {R} 0 1799 2>&1 | tail -2; "
                        f"echo TEMPO $(( $(date +%s) - T0 )); kill $(cat /tmp/mon.pid); python3 /tmp/res.py /tmp/mon_{P}.txt; "
                        f"echo SOFTWARE $(grep -l -i -E 'swiftshader|software render' {R}/out/p*.log 2>/dev/null | wc -l)", prazo=5400, estagnacao=1500)
    p(f"P={P} ESC={ESC}", out[-500:])
p("FIM_BENCH")
