# K17 v2: plano de som. Efeitos pontuais presos à AÇÃO de cada batida (regra do Kriegsmomente: sem música, sem cama contínua
# audível; só um tom de sala a -50 LUFS para nunca haver silêncio digital). Gera ton/mapa.json (prompts do MOSS-SoundEffect v2.0,
# Apache 2.0, gerados na G4) e ton/plano.json (onde cada efeito entra).
#   python ton.py
import json, os
from regie import B, F, FR, DAUER

O = r"D:\kriegschronik\k17_v2\ton"
os.makedirs(O, exist_ok=True)
# id: (prompt, segundos)
LIB = {
    "zug": ("steam locomotive departing slowly from a small station, chuffing and accelerating, steam hiss, iron wheels on rails, 19th century", 14),
    "zug_fern": ("steam train rolling away into the distance, chuffing fading out, one far whistle", 9),
    "feder": ("quill pen scratching on rough paper, drawing a long line, close up, dry", 4),
    "papier": ("old paper sheet slid across a wooden desk, soft rustle", 2),
    "stempel": ("heavy rubber stamp pressed onto paper on a wooden desk, single firm thud", 2),
    "telegraf": ("telegraph key tapping morse code, mechanical clicks, 19th century office", 4),
    "wasser": ("calm river flowing, small waves lapping against a wooden boat hull", 15),
    "bau": ("pioneers building a wooden pontoon bridge on a river, planks dropped onto beams, wooden mallets, ropes creaking, men working, water splashing", 20),
    "anker": ("heavy iron anchor thrown from a boat into a river, splash and rope running out", 4),
    "pferde": ("six horses pulling a heavy wooden wagon on a gravel road, hooves, creaking wheels, harness jingling", 9),
    "flut": ("flooded river roaring, fast current, floating timber knocking against wooden pontoons, wood groaning under strain", 15),
    "bruch": ("large wooden beams bending and cracking under pressure, deep creaking", 5),
    "explosion": ("huge black powder explosion under a stone railway bridge at night, deep boom, stones and debris falling into a river", 9),
    "kanonen": ("distant artillery battle, cannons rumbling far away, muffled thunder-like booms", 10),
    "gewehre": ("sporadic rifle fire across a river, distant shots echoing", 8),
    "marsch": ("column of soldiers marching across a wooden bridge, boots on planks, equipment rattling", 9),
    "faesser": ("wooden barrels rolling over a bridge deck and splashing into a river one after another", 6),
    "uhr": ("old pocket watch ticking, close, steady", 7),
    "nacht": ("calm night by a river, crickets, gentle water", 10),
    "geroell": ("rocks and rubble collapsing inside a tunnel, heavy rumble and dust", 5),
    "raum": ("quiet room tone, old study, very soft air, almost silent", 30),
}
W = {}
for f in FR:
    for p in f["palavras"]:
        W.setdefault(f["cap"], []).append(p)
def wort(b, w, plus=0.0):
    kp = F[b["a"]]["cap"]
    for p in W[kp]:
        if p["s"] >= b["s"] - 0.05 and p["w"].lower().startswith(w.lower()):
            return round(p["s"] + plus, 2)
    raise SystemExit(f"palavra {w} nao achada em {b['id']}")
BB = {b["id"]: b for b in B}
P = []
def ef(i, t, lufs=-27, dur=None, var=0):
    P.append({"t": round(t, 2), "id": i, "var": var, "lufs": lufs, **({"dur": dur} if dur else {})})

# trocas de linguagem: folha de papel na entrada de cada cartão/foto/mapa (baixo)
for b in B:
    if b["fam"] in ("ui", "karten"): ef("papier", max(0, b["s"] - 0.15), -36)
    if b["comp"] == "Titel": ef("telegraf", b["s"] + 0.2, -30, 3.5)
# por batida
ac = lambda i: BB[i]
ef("feder", ac("b01")["s"] + 0.2, -30, 2.4); ef("stempel", ac("b01")["s"] + 0.45, -26)
ef("zug_fern", ac("b02")["s"] + 0.3, -30, 9, 3); ef("feder", wort(ac("b02"), "verlässt"), -32, 3)
ef("zug", ac("b04")["s"], -22, ac("b04")["e"] - ac("b04")["s"] + 0.6)
ef("feder", wort(ac("b03"), "Brücke"), -30, 1.5); ef("marsch", wort(ac("b03"), "Deutschen"), -34, 3.5)
ef("stempel", ac("b04b")["s"] + 0.5, -24)
ef("feder", wort(ac("b05"), "Brücke"), -32, 4)
for w in ("Pontonbrücke", "Brücken", "ausgerechnet"): ef("feder", wort(ac("b06"), w, -0.3), -32, 1.2)
ef("feder", wort(ac("b08"), "Boot"), -30, 3); ef("feder", wort(ac("b08"), "eineinhalb", -0.4), -30, 2.5, 1)
ef("bruch", wort(ac("b09"), "trägt"), -32, 2.5)
ef("pferde", ac("b10")["s"] + 0.2, -28, 7.5)
ef("pferde", wort(ac("b11"), "Ponton-Kolonne"), -32, 5, 1)
ef("bau", ac("b12")["s"], -22, ac("b12")["e"] - ac("b12")["s"] + 0.5); ef("anker", wort(ac("b12"), "verankern"), -24)
ef("bau", ac("b13")["s"], -30, ac("b13")["e"] - ac("b13")["s"], 1)
ef("feder", wort(ac("b15"), "Mosel"), -30, 2); ef("stempel", wort(ac("b15"), "Keine"), -26)
ef("marsch", wort(ac("b16"), "marschiert"), -30, 6, 1); ef("nacht", ac("b16")["s"], -36, 10)
ef("kanonen", ac("b17")["s"], -34, 4.3)
ef("uhr", ac("b18")["s"], -32, 7)
ef("feder", wort(ac("b19"), "Saint-Avold"), -30, 2.5); ef("pferde", wort(ac("b19"), "erreicht"), -32, 4); ef("kanonen", wort(ac("b19"), "tobt"), -28, 4, 1)
ef("feder", ac("b20")["s"] + 0.3, -32, 4)
ef("feder", ac("b22")["s"] + 0.3, -34, 2)
ef("wasser", ac("b23")["s"], -34, 7.5); ef("feder", wort(ac("b23"), "Brücke"), -30, 1.6)
ef("bau", wort(ac("b24"), "Pontons", -0.9), -30, 4.5, 2)
ef("uhr", wort(ac("b25"), "Dauer"), -30, 4, 1)
ef("wasser", ac("b26")["s"], -36, 6, 1)
ef("wasser", ac("b27")["s"], -34, 4.2, 2)
ef("wasser", ac("b28")["s"], -32, 5.6)
ef("flut", ac("b29")["s"], -22, ac("b29")["e"] - ac("b29")["s"] + 0.5); ef("bruch", ac("b29")["s"] + 6.8, -22)
ef("nacht", ac("b30")["s"], -30, 4.5, 1); ef("bau", wort(ac("b30"), "sieben"), -26, 4.5, 2); ef("wasser", ac("b30")["s"], -32, 8.5, 2)
ef("wasser", ac("b31")["s"], -36, 4.4, 1)
ef("pferde", wort(ac("b32"), "erbeuten"), -30, 4, 2)
ef("marsch", ac("b33")["s"] + 0.2, -34, 5, 2); ef("feder", wort(ac("b33"), "festen"), -30, 2)
ef("marsch", wort(ac("b35"), "durchbrechen", -1), -32, 4, 3); ef("kanonen", wort(ac("b35"), "Norden"), -34, 4, 2)
ef("stempel", wort(ac("b36"), "befiehlt"), -26); ef("explosion", wort(ac("b36"), "Frénois"), -30, 2.5, 1); ef("explosion", wort(ac("b36"), "Flize"), -30, 2.5, 2)
ef("stempel", wort(ac("b36"), "stehen"), -26, None, 1)
ef("faesser", ac("b37")["s"] + 0.6, -24, 6); ef("gewehre", ac("b37")["s"] + 0.3, -36, 3)
ef("wasser", ac("b38")["s"], -34, 4.5)
ef("gewehre", wort(ac("b39"), "Beschuss"), -28, 4.5, 1); ef("bau", wort(ac("b39"), "Nacht"), -30, 5, 3); ef("uhr", wort(ac("b39"), "zehn"), -30, 2.5)
ef("zug_fern", ac("b41")["s"] + 0.5, -34, 4, 1)
for w in ("Sprengkammern", "Verdämmen", "Pulver"): ef("feder", wort(ac("b42"), w), -30, 1.2)
ef("nacht", ac("b43")["s"], -32, 6.3, 2); ef("marsch", wort(ac("b43"), "preußische"), -34, 3)
ef("feder", ac("b44")["s"] + 0.3, -32, 2.5); ef("explosion", ac("b44")["s"] + 6.1, -16, ac("b44")["e"] - ac("b44")["s"] - 5.6)
ef("marsch", wort(ac("b45"), "marschieren"), -28, 6, 4); ef("kanonen", wort(ac("b45"), "elf"), -30, 3, 3)
ef("telegraf", ac("b46")["s"] + 0.2, -32, 2.8, 1)
for w in ("Befehle", "erschöpft", "Zug"): ef("feder", wort(ac("b47"), w), -32, 1)
ef("explosion", wort(ac("b49"), "gesprengte", -0.4), -32, 2.5, 3); ef("bau", wort(ac("b49"), "Pontonbrücke", -1.2), -30, 4, 4); ef("uhr", wort(ac("b49"), "Zweieinviertel"), -30, 2.5, 3)
ef("feder", wort(ac("b50"), "Verzögerung", -1.0), -30, 3)
ef("zug_fern", ac("b51")["s"], -30, 4, 2); ef("geroell", wort(ac("b51"), "Tunnel"), -28, 4)
ef("zug_fern", ac("b52")["s"] + 0.3, -36, 5, 3)
ef("uhr", wort(ac("b53"), "Pontons"), -32, 2.5, 4)
ef("feder", wort(ac("b54"), "sechs"), -32, 3)
ef("feder", ac("b55")["s"] + 0.3, -34, 2)
ef("feder", wort(ac("b56"), "Berechnet"), -30, 3)
ef("telegraf", wort(ac("b58"), "Frankreich"), -32, 3.5, 2)
# tom de sala contínuo quase inaudível (evita silêncio digital; não é "ambiente")
t = 0.0
while t < DAUER:
    ef("raum", t, -50, min(30, DAUER - t)); t += 29.5

mapa = {"efeitos": [{"id": i, "prompt": p, "s": 0, "e": d} for i, (p, d) in LIB.items()]}
# variações: quantas vezes cada id aparece com var diferente
nvar = {}
for e in P: nvar[e["id"]] = max(nvar.get(e["id"], 0), e["var"] + 1)
mapa["variacoes"] = nvar
json.dump(mapa, open(os.path.join(O, "mapa.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(sorted(P, key=lambda e: e["t"]), open(os.path.join(O, "plano.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("efeitos", len(P), "tipos", len(LIB), "variacoes", nvar)
