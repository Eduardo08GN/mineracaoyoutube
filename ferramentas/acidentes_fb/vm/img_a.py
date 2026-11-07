# Rota (a), passo 1: keyframe 1 com Qwen-Image (2 sementes), depois K2..K4 como EDICAO do K1 com Qwen-Image-Edit (personagem mantido).
# Uso: python img_a.py k1 | python img_a.py edit     (processos separados para liberar a VRAM)
import os, sys, time, json, torch
D = "/content/t2/acid_bat"; P = json.load(open(f"{D}/vm/prompts.json")); os.makedirs(f"{D}/img", exist_ok=True)
T = {}; W, H = 720, 1280
if sys.argv[1] == "k1":
    from diffusers import DiffusionPipeline
    t0 = time.time(); pipe = DiffusionPipeline.from_pretrained("Qwen/Qwen-Image", torch_dtype=torch.bfloat16).to("cuda")
    print("CARREGOU", round(time.time() - t0), flush=True)
    for s in (7, 21):
        t1 = time.time()
        im = pipe(prompt=P["estilo"] + " " + P["k1"], negative_prompt=" ", width=W, height=H, num_inference_steps=30,
                  true_cfg_scale=4.0, generator=torch.Generator("cuda").manual_seed(s)).images[0]
        im.save(f"{D}/img/k1_s{s}.png"); T[f"k1_s{s}"] = round(time.time() - t1, 1); print("IMG", s, T[f"k1_s{s}"], flush=True)
    import shutil; shutil.copy(f"{D}/img/k1_s7.png", f"{D}/img/k1.png")
else:
    from PIL import Image
    t0 = time.time()
    try:
        from diffusers import QwenImageEditPlusPipeline as Pp; rep = "Qwen/Qwen-Image-Edit-2509"
    except ImportError:
        from diffusers import QwenImageEditPipeline as Pp; rep = "Qwen/Qwen-Image-Edit"
    pipe = Pp.from_pretrained(rep, torch_dtype=torch.bfloat16).to("cuda"); print("CARREGOU", rep, round(time.time() - t0), flush=True)
    ref = Image.open(f"{D}/img/k1.png").convert("RGB")
    for k, p in P["edits"].items():
        t1 = time.time()
        kw = dict(image=[ref] if "Plus" in Pp.__name__ else ref, prompt=p, negative_prompt=" ", num_inference_steps=30,
                  true_cfg_scale=4.0, generator=torch.Generator("cuda").manual_seed(7))
        im = pipe(**kw).images[0]
        if im.size != (W, H): im = im.resize((W, H), Image.LANCZOS)
        im.save(f"{D}/img/{k}.png"); T[k] = round(time.time() - t1, 1); print("EDIT", k, T[k], flush=True)
json.dump(T, open(f"{D}/img/tempos_{sys.argv[1]}.json", "w")); print("IMG_FIM", sys.argv[1], round(time.time() - t0), flush=True)
