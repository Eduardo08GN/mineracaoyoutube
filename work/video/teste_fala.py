import json, os, sys, time
sys.path.insert(0, "work/video")
import flow_ivone as fi
fh = fi.fh
s, cdp = fi.conectar()
quadro = fh.upload(s, os.path.abspath("work/video/fatia01/quadros/avatar_asp3.png"), fi.PROJETO)[0]
p = fi.prompt_fala("Es ist ein Samstag im April.")
try:
    op = fi.video(s, p, quadro, quadro)
except fh.Freio as e:
    print("freio de novo:", e, "-> renovo o selo como a ferramenta faz e tento uma vez")
    fi.renovar_selo(cdp); cdp.close(); time.sleep(5)
    s, cdp = fi.conectar()
    quadro = fh.upload(s, os.path.abspath("work/video/fatia01/quadros/avatar_asp3.png"), fi.PROJETO)[0]
    op = fi.video(s, p, quadro, quadro)
print("op", str(op)[:12], "enviado")
feitos, falta = fi.esperar_e_baixar(s, {"teste_fala_p01_169b": op}, os.path.abspath("work/video/fatia01/bruto"))
print(feitos, falta, "| saldo", fh.creditos(s))
cdp.close()
