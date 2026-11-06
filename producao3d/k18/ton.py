# K18: plano de som. Efeitos PONTUAIS presos a palavra da narracao ou a entrada de uma batida (Kriegsmomente: sem musica,
# sem cama continua audivel; so um tom de sala a -50 LUFS contra silencio digital). Gera ton/mapa.json (prompts do
# MOSS-SoundEffect v2.0, Apache 2.0, gerados na G4 por g4_ton.py) e ton/plano.json (onde cada efeito entra, em s do video).
#   python ton.py
import json, os, re
R = os.path.dirname(os.path.abspath(__file__)); O = os.path.join(R, "ton"); os.makedirs(O, exist_ok=True)
PL = json.load(open(os.path.join(R, "v1", "src", "plano.json"), encoding="utf-8")); ALI = json.load(open(os.path.join(R, "voz", "alinhamento.json"), encoding="utf-8"))
KS = {k["id"]: k["s"] for k in PL["kapitel"]}; DAUER = PL["dauer"]
LIB = {
    "kanonen_fern": ("distant field artillery battle, many cannons firing from far hills, rolling thunder-like booms, 19th century", 8),
    "kanonen_nah": ("a battery of muzzle-loading field cannons firing one after another close by, heavy booms, wheels recoiling on earth", 6),
    "granate": ("artillery shell whistling overhead and exploding in wet muddy ground nearby, dirt falling", 4),
    "salve": ("two volleys of massed rifle fire from a line of infantry, sharp crack echoing over fields", 5),
    "schnellfeuer": ("rapid continuous rifle fire from a long infantry line, 19th century breech-loading rifles, crackling", 6),
    "wald": ("rifle fire inside a dense forest, shots echoing between trees, branches snapping", 7),
    "regen": ("steady rain falling on a muddy field and wet grass, soft", 8),
    "galopp": ("a single horse galloping fast on a muddy country road at night in the rain", 7),
    "kavallerie": ("large cavalry charge, many horses galloping and colliding, sabres clashing, harness rattling", 7),
    "marsch": ("infantry column marching through mud, boots squelching, equipment rattling", 7),
    "telegraf": ("telegraph key tapping morse code, mechanical clicks, 19th century office", 4),
    "feder": ("quill pen scratching on rough paper, writing quickly, close up, dry", 3),
    "papier": ("old paper sheet slid across a wooden desk, soft rustle", 2),
    "uhr": ("old pocket watch ticking, close, steady", 4),
    "verschluss": ("metal rifle bolt opened, paper cartridge inserted, bolt pushed forward and locked with a click, close up", 3),
    "ladestock": ("metal ramrod pushed down a rifle barrel twice and pulled out, close up", 3),
    "kartaetsche": ("cannon firing canister shot at close range, huge blast and spray of iron balls whistling", 4),
    "tor": ("heavy wooden fortress gate slammed shut, iron bolts sliding, echo in a stone arch", 4),
    "wasser": ("river flowing, water rushing under a wooden bridge", 8),
    "raum": ("quiet room tone, old study, very soft air, almost silent", 30),
}
# gatilhos por palavra (prefixo, sem maiusculas): (regex, efeito, lufs, dur, deslocamento)
GAT = [
    (r"^feuer(n|t)$", "kanonen_fern", -30, 6, 0.1), (r"^granat", "granate", -28, 3.5, 0), (r"^kanonendonner", "kanonen_fern", -32, 5, 0),
    (r"^salven", "salve", -24, 4.5, 0), (r"^schnellfeuer", "schnellfeuer", -26, 5, 0), (r"^regnet|^regen", "regen", -34, 7, 0),
    (r"^reitet", "galopp", -28, 6, 0), (r"^reiter", "kavallerie", -26, 6, 0), (r"^telegra", "telegraf", -30, 3, 0),
    (r"^kartätsche", "kartaetsche", -24, 3.5, 0), (r"^überrannt", "kavallerie", -32, 4, 0), (r"^tore$", "tor", -26, 3.5, 0.2),
    (r"^brücken", "wasser", -34, 5, 0), (r"^marschier", "marsch", -32, 5, 0), (r"^ladestock", "ladestock", -26, 3, 0),
    (r"^verschluss", "verschluss", -26, 2.5, 0), (r"^bajonett", "marsch", -30, 4, 0), (r"^wald", "wald", -32, 5, 0.2),
]
MINGAP = 9.0   # o mesmo efeito nao volta antes disso
P = []; ult = {}; var = {}
def ef(i, t, lufs=-28, dur=None):
    if t < 0 or t > DAUER - 0.5 or (i != "raum" and t - ult.get(i, -99) < MINGAP): return
    ult[i] = t; v = var.get(i, 0); var[i] = (v + 1) % 4
    P.append({"t": round(t, 2), "id": i, "var": v, "lufs": lufs, **({"dur": dur} if dur else {})})
# 1) palavras
for cap, a in ALI.items():
    for p in a["palavras"]:
        w = re.sub(r"[^\wäöüß]", "", p["w"].lower())
        for rx, i, l, d, dl in GAT:
            if re.search(rx, w): ef(i, KS[cap] + p["s"] + dl, l, d); break
# 2) entradas de batida por familia/fase
for b in PL["beats"]:
    f, fs = b["familia"], b.get("fase") or b.get("motivo") or b.get("reg")
    if f == "epoca": ef("papier", b["ini"] - 0.1, -36)
    elif f == "telegrama": ef("telegraf", b["ini"] + 0.3, -30, 3)
    elif f == "fim": ef("feder", b["ini"] + 0.3, -32, 2.5)
    elif f == "dreyse" and fs == "agulha": ef("verschluss", b["ini"] + 0.6, -24)
    elif f == "dreyse" and fs == "lorenz_vareta": ef("ladestock", b["ini"] + 0.5, -24)
    elif f == "dreyse" and fs == "cadencia": ef("schnellfeuer", b["ini"] + 0.4, -32, 4)
    elif f == "artilharia" and fs in ("alcance", "giro"): ef("kanonen_nah", b["ini"] + 0.4, -28, 4)
    elif f == "chao" and fs in ("lipa", "chlum") and b.get("h0", "99") < "14:00": ef("kanonen_nah", b["ini"] + 0.3, -32, 4)
    elif f == "boemia" and fs == "route": ef("galopp", b["ini"] + 0.2, -34, 5)
    elif f == "lugar" and fs == "festung": ef("tor", b["ini"] + 0.8, -26)
t = 0.0
while t < DAUER: P.append({"t": round(t, 2), "id": "raum", "var": 0, "lufs": -50, "dur": round(min(30, DAUER - t), 2)}); t += 29.5
nvar = {}
for e in P: nvar[e["id"]] = max(nvar.get(e["id"], 0), e["var"] + 1)
json.dump({"efeitos": [{"id": i, "prompt": p, "s": 0, "e": d} for i, (p, d) in LIB.items()], "variacoes": nvar}, open(os.path.join(O, "mapa.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(sorted(P, key=lambda e: e["t"]), open(os.path.join(O, "plano.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
from collections import Counter
print("efeitos", len(P), dict(Counter(e["id"] for e in P)), "variacoes", nvar)
