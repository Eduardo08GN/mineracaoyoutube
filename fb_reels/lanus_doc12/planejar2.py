# v2 (19/11): frase -> pedaços de ≤12 palavras (tempo da voz) -> 1 batida por pedaço.
# ~60% foto25d (imagens do Flow por capítulo, cada imagem no máx. 3 vezes com movimentos diferentes), resto = kit explicativo
# (regra() do planejar.py). Cartão de dado vira 'sobre' em cima da foto quando possível.
import json, sys, os, itertools, importlib.util
from collections import Counter, defaultdict
AQUI = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("p1", os.path.join(AQUI, "planejar_regras.py")); P1 = importlib.util.module_from_spec(spec); spec.loader.exec_module(P1)
T = json.load(open(sys.argv[1], encoding="utf-8")); OUT = sys.argv[2]
G = {f["id"]: f["texto"] for f in json.load(open(sys.argv[3], encoding="utf-8"))["frases"]}
IMGS = json.load(open(os.path.join(AQUI, "imagens.json"), encoding="utf-8"))   # {"<cap>": ["imgs/img_01.png", ...]}
MOVS = ["push", "lateral_esq", "sobe", "pull", "lateral_dir", "orbita", "desce"]
FX = {"0": "fumaca", "1": "poeira", "2": "poeira", "3": "gas", "4": "gas", "5": "gas", "6": "fogo,faiscas,fumaca", "7": "fogo,fumaca", "8": "chuva_cinzas", "9": "fumaca", "10": "poeira", "C": "fumaca"}
TRANS = itertools.cycle(["corte", "fumaca", "corte", "whip", "corte", "tinta", "corte", "zoom", "luz"])
uso = Counter(); movi = defaultdict(int); pool_i = defaultdict(int)
def foto(cap):
    lst = IMGS.get(cap) or IMGS.get("*") or []
    for _ in range(len(lst) * 2):
        im = lst[pool_i[cap] % len(lst)]; pool_i[cap] += 1
        if uso[im] < 4:
            uso[im] += 1; m = MOVS[(movi[im] + hash(im)) % len(MOVS)]; movi[im] += 1
            return {"tipo": "foto25d", "img": im, "depth": im.rsplit(".", 1)[0] + "_depth.png", "mov": m, "fx": FX.get(cap, "")}
    return None
RES = itertools.cycle(["relogio", "cita", "nuvem", "cano", "relogio", "cita"])
def reserva(cap, txt):
    t = next(RES); h = P1.HORA.get(cap, "09:44"); h = h if h != "—" else "10:52"
    if t == "relogio": return {"tipo": "relogio", "de": "09:44", "ate": h if h > "09:44" else "10:52", "eventos": [{"h": "09:44", "t": "Rotura"}, {"h": "10:04", "t": "\"Controlado\""}, {"h": "10:52", "t": "Explosión"}]}
    if t == "nuvem": return {"tipo": "nuvem", "conc_ini": 2, "conc": 4 + (hash(txt) % 10), "lojas": P1.LOJAS}
    if t == "cano": return {"tipo": "cano", "fase_ini": 0.5, "fase": 1}
    return {"tipo": "cita", "texto": txt, "fonte": ""}
bat = []; ult = None; k = 0
for f in T["frases"]:
    cap = f["id"][1:].split("_")[0]; txt = G[f["id"]]; pal = f.get("palavras") or []
    if cap != ult and cap != "0":
        bat.append({"ini": f["t0"], "fim": f["t0"] + 1.4, "tipo": "titulo", "titulo": P1.CAP[cap], "cap": P1.CAP[cap], "hora": P1.HORA[cap], "trans": "luz"})
    ult = cap
    regra = P1.regra(cap, txt)
    pedacos = [pal[i:i + 12] for i in range(0, len(pal), 12)] or [[{"p": txt, "t0": f["t0"], "t1": f["t1"]}]]
    if len(pedacos) > 1 and len(pedacos[-1]) < 4: _x = pedacos.pop(); pedacos[-1] += _x
    for j, pd in enumerate(pedacos):
        t0 = max(pd[0]["t0"], bat[-1]["ini"] + 1.4 if bat and bat[-1]["tipo"] == "titulo" else pd[0]["t0"]); t1 = pd[-1]["t1"]
        b = None
        if j == 0 and regra and regra["tipo"] in ("cano", "nuvem", "lista", "explosao"): b = dict(regra)   # diagrama explicativo puro
        else:
            b = foto(cap)
            if b and j == 0 and regra and regra["tipo"] in ("numero", "relogio", "comparacao", "saldo", "cita", "lista"): b["sobre"] = regra
            if b is None: b = dict(regra) if regra else reserva(cap, " ".join(p["p"] for p in pd))
        b.update(ini=t0, fim=t1, leg=" ".join(p["p"] for p in pd), cap=P1.CAP[cap], hora=P1.HORA[cap], trans=next(TRANS))
        bat.append(b); k += 1
for a, b in zip(bat, bat[1:]): a["fim"] = max(b["ini"], a["ini"] + 0.5)
dauer = round(T["total"], 2); bat[-1]["fim"] = dauer
json.dump({"fps": 30, "dauer": dauer, "batidas": bat}, open(OUT + "/batidas.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
json.dump({"fps": 30, "dauer": dauer}, open(OUT + "/plano.json", "w"))
c = Counter(b["tipo"] for b in bat); print(len(bat), "batidas", dauer, "s", c.most_common(), "foto%", round(100 * c["foto25d"] / len(bat)))
