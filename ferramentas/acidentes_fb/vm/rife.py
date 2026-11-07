# 16 fps (65 quadros) -> 30 fps, 4,0 s (120 quadros): RIFE em tempo fracionario, sem quadros repetidos
import os, sys, time, json, torch, numpy as np, imageio, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rife_arch import IFNet
D="/content/t2/acid_bat"
ck=f"{D}/rife49.pth"
if not os.path.exists(ck):
    for u in ["https://huggingface.co/marduk191/rife/resolve/main/rife49.pth","https://huggingface.co/hfmaster/models-moved/resolve/main/rife/rife49.pth"]:
        try: urllib.request.urlretrieve(u, ck); break
        except Exception as e: print("falhou", u, e)
m=IFNet(arch_ver="4.7"); m.load_state_dict(torch.load(ck, weights_only=False)); m.eval().cuda()
SC=[8,4,2,1]
t0=time.time(); tempos={}
for k in ["k1","k2","k3","k4"]:
    t1=time.time()
    fr=np.load(f"{D}/raw/{k}.npy")  # T,H,W,3 uint8
    T=len(fr); outs=[]
    ten=lambda a: torch.from_numpy(a).permute(2,0,1)[None].float().cuda()/255
    for i in range(120):
        pos=i*16/30; a=int(pos); f=pos-a
        if f<1e-3 or a+1>=T: outs.append(fr[min(a,T-1)]); continue
        with torch.no_grad():
            o=m(ten(fr[a]), ten(fr[a+1]), timestep=float(f), scale_list=SC, training=False, fastmode=True, ensemble=False)
            o = o[0] if isinstance(o,(tuple,list)) else o
        outs.append((o[0].clamp(0,1)*255).byte().permute(1,2,0).cpu().numpy()[:fr.shape[1],:fr.shape[2]])
    imageio.mimwrite(f"{D}/{k}_30fps.mp4", outs, fps=30, quality=9, macro_block_size=8)
    tempos[k]=round(time.time()-t1,1); print("RIFE", k, tempos[k], "s", flush=True)
json.dump(tempos, open(f"{D}/raw/tempos_rife.json","w")); print("RIFE_FIM")
