import json, os, sys, time
sys.path.insert(0, "work/video")
import flow_ivone as fi
from PIL import Image
fh = fi.fh
s, cdp = fi.conectar()
ret = json.load(open("work/video/fatia01/ids.json"))["retrato"]
prompt = open("work/video/teste_img.py", encoding="utf-8").read().split('prompt = (')[1].split(')\nwith')[0]
prompt = eval("(" + prompt + ")").replace("16:9 landscape frame", "wide 16:9 landscape frame, he is in the center")
for asp in (3,):
    with fi.Gratis(s):
        mid = fi.imagem(s, prompt, [ret], aspecto=asp, modelo="GEM_PIX_2")
    d = fh.baixar_limpa(s, mid, os.path.abspath(f"work/video/fatia01/quadros/avatar_asp{asp}.png"))
    print(asp, Image.open(d).size)
cdp.close()
