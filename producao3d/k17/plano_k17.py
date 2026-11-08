# K17: plano de batidas a partir de roteiro/frases.json. Uma batida por frase (frases < 1,4 s juntam com a anterior), cada uma
# com take PRÓPRIO numa das famílias: K (mapa Lorena/Ardenas), S (mapa Sena), M (máquina + caderno), B (gravura/página-prova 2.5D).
# Escolha por direção (o que a frase precisa mostrar), não por cota. Cada batida declara 'demonstra'.
# Saída: cena/plano.json com {id, fam, v0, v1, texto, demonstra, spec} — o spec vai inteiro no --config do clipe.
import json, math, random
R0 = r"D:/kriegschronik/k17_pioniere"
F = json.load(open(f"{R0}/roteiro/frases.json", encoding="utf-8"))
rnd = random.Random(17)
R = 6371000.0
REG = {"K": (49.25, 5.75), "S": (48.7, 2.5)}
def P(reg, lon, lat):
    phi0, lam0 = REG[reg]
    KX = R * math.cos(math.radians(phi0)) * math.pi / 180 / 1000; KY = R * math.pi / 180 / 1000
    return [(lon - lam0) * KX, -(lat - phi0) * KY]
def cam(reg, ll, dist, az, elev, fov=32, dolly=0.86, giro=7):
    """câmera em órbita oblíqua sobre o ponto ll; anda (dolly + giro) durante o take; variação pequena para nada repetir"""
    az += rnd.uniform(-6, 6); elev += rnd.uniform(-3, 3)
    c = P(reg, *ll)
    def pos(d, a, e):
        return [round(c[0] + d * math.cos(math.radians(e)) * math.sin(math.radians(a)), 3), round(d * math.sin(math.radians(e)), 3),
                round(c[1] + d * math.cos(math.radians(e)) * math.cos(math.radians(a)), 3)]
    return [[0, {"pos": pos(dist, az, elev), "tgt": [round(c[0], 3), 0, round(c[1], 3)], "fov": fov}],
            ["FIM", {"pos": pos(dist * dolly, az + giro, elev - 3), "tgt": [round(c[0], 3), 0, round(c[1], 3)], "fov": fov}]]
LL = {"Sedan": (4.94, 49.702), "Donchery": (4.873, 49.698), "Mezieres": (4.72, 49.762), "Metz": (6.176, 49.12), "PaM": (6.054, 48.905),
      "Corny": (6.06, 49.035), "StAvold": (6.705, 49.104), "MarsLaTour": (5.887, 49.098), "Forbach": (6.9, 49.188), "Frenois": (4.8996, 49.6855),
      "Flize": (4.7761, 49.6979), "Bazeilles": (5.0305, 49.7143), "Remilly": (4.9932, 49.6508), "StMenges": (4.927, 49.745),
      "Dieulouard": (6.0683, 48.8416), "Marbache": (6.0996, 48.7967), "Lorraine": (5.6, 49.2),
      "Corbeil": (2.4818, 48.6138), "Juvisy": (2.3738, 48.6904), "Paris": (2.352, 48.857)}
L = lambda n: list(LL[n])
BAHN_MAAS = [L("Sedan"), [4.9, 49.70], L("Donchery"), [4.8, 49.725], L("Mezieres")]
def K(ll, dist, az=20, elev=48, data="", cidades=None, **k):
    return {"fam": "K", "spec": {"cam": cam("K", L(ll) if isinstance(ll, str) else ll, dist, az, elev), "data": data, "cidades": cidades or [], **k}}
def S(ll, dist, az=20, elev=48, data="", cidades=None, **k):
    return {"fam": "S", "spec": {"cam": cam("S", L(ll), dist, az, elev), "data": data, "cidades": cidades or [], **k}}
def B(img, foco, titulo="", par=0.8, lado=1, zoom=0.8):
    return {"fam": "B", "spec": {"imagem": img, "foco": foco, "paralaxe": par, "lado": lado if rnd.random() > 0.4 else -lado, "zoomMax": zoom, "titulo": titulo}}
def Mq(camk, notes, bau=None, felder=5, v=None, biege=None, foco=(12, 0.3, 0, 16)):
    c, e = foco[:3], foco[3]
    return {"fam": "M", "spec": {"felder": felder, "bau": bau, "v": v, "biege": biege, "cam": camk, "notes": notes,
                                  "focus": {"c": list(c), "ext": e, "ao": 0.02 * e, "fade": 4 * e}}}
def mc(p0, t0, p1, t1, fov=32, fov1=None):
    return [[0, {"pos": p0, "tgt": t0, "fov": fov}], ["FIM", {"pos": p1, "tgt": t1, "fov": fov1 or fov}]]
TT = lambda txt, em=0.15, **k: {"type": "text", "key": "title", "x": 70, "y": 96, "txt": txt, "size": 50, "em": em, **k}
TX = lambda key, txt, x, y, em, size=34, **k: {"type": "text", "key": key, "x": x, "y": y, "txt": txt, "size": size, "em": em, **k}
LB = lambda key, a, txt, x, y, em, size=34, **k: {"type": "label", "key": key, "a": a, "x": x, "y": y, "txt": txt, "size": size, "em": em, **k}
ZA = lambda key, de, ate, fmt, x, y, em, dur, size=46: {"type": "zahl", "key": key, "x": x, "y": y, "de": de, "ate": ate, "em": em, "dur": dur, "size": size, "col": "acc", "fmt": fmt}
FOL = lambda txt: {"type": "text", "key": "fol", "x": 1534, "y": 866, "txt": txt, "size": 23, "font": "gar", "align": "r", "col": "ink2", "em": 0, "dur": 0.01}
OK = lambda n, t=0.3, txt="": {"tipo": "ok", "at": L(n), "t": t, "txt": txt}
XX = lambda n, t=0.3, txt="": {"tipo": "x", "at": L(n), "t": t, "txt": txt}
MOSEL6 = ["Corny", "PaM", "Dieulouard", "Marbache"]
SAAR = [[6.95, 49.2], [6.62, 49.05], [6.3, 48.98], [6.06, 49.03], [5.887, 49.098]]
MAAS_V = [[5.4, 49.45], [5.1, 49.62], [4.95, 49.68], [4.873, 49.698], [4.86, 49.745]]
RING = {"tipo": "ring", "at": L("Sedan"), "r": 5.5}
PONT = lambda bau, **k: {"bau": bau, **k}

P_ = {
 # 01 — o trem com a pólvora (mapa vivo nos primeiros 5 s, pergunta do título)
 "01_01": (K("Donchery", 70, 200, 55, data="31. August 1870", cidades=["Sedan", "Donchery", "Mézières"], rios=[0.2, 2.0],
             marcas=[{"tipo": "zug", "pts": BAHN_MAAS[:3], "t": 0.6, "dur": 1.6, "fass": True}]), "Sedan e Mosa aparecem; o trem já anda com o barril"),
 "01_02": (K("Donchery", 38, 215, 50, data="31. August 1870", cidades=["Sedan", "Donchery"], marcas=[{"tipo": "zug", "pts": BAHN_MAAS[:3], "t": 0, "dur": 2.6, "fass": True}]), "o trem sai de Sedan para oeste"),
 "01_03": (B("e09", [0.05, 0.1, 0.95, 0.9], "Pontonniers et train", par=0.7), "a gravura de pontonniers franceses e seu trem (quem eram)"),
 "01_05": (K("Donchery", 22, 190, 42, data="31. August 1870", cidades=["Donchery"], marcas=[OK("Donchery", 0.4, "Maasbrücke")]), "a ponte de Donchery marcada: o alvo"),
 "01_06": (K("Donchery", 16, 230, 38, data="31. August 1870", cidades=["Donchery"], marcas=[{"tipo": "zug", "pts": BAHN_MAAS[1:3], "t": 0, "dur": 1.2, "fass": True}, OK("Donchery", 0.1)]), "o trem para em Donchery"),
 "01_07": (K("Donchery", 30, 250, 46, data="31. August 1870", cidades=["Donchery", "Mézières"], marcas=[{"tipo": "zug", "pts": BAHN_MAAS[2:], "t": 0.2, "dur": 2.6, "fass": True}, OK("Donchery", 0)]), "o trem segue para Mézières COM o barril"),
 "01_10": (K("Donchery", 12, 160, 34, data="31. August 1870", cidades=["Donchery"], marcas=[OK("Donchery", 0.2, "bleibt stehen")]), "a ponte fica: o ✓ se escreve"),
 # 02 — três perguntas (caderno)
 "02_01": (B("e13", [0.08, 0.55, 0.92, 0.82], "Generalstabswerk, S. 1115", par=0.12, zoom=0.6), "a página do Generalstabswerk: não é caso isolado"),
 "02_03": (K("Lorraine", 150, 10, 60, data="Sommer 1870", cidades=["Metz", "Sedan", "Pont-à-Mousson"], marcas=[OK(n, 0.4 + i * 0.4) for i, n in enumerate(["Corny", "PaM", "Dieulouard", "Donchery", "Bazeilles"])]), "ponte após ponte intacta: os ✓ acendem pelo mapa"),
 "02_04": (Mq(mc([30, 12, 22], [12, 0, 0], [26, 10, 20], [12, 0, 0]), [TT("Drei Fragen"), TX("q1", "1 · Was kann eine Pontonbrücke?", 72, 700, 1.0, 34), TX("q2", "2 · Welche Brücken wurden gesprengt?", 72, 750, 2.0, 34), TX("q3", "3 · Warum war das entscheidend?", 72, 800, 3.0, 34)], bau=[[0, 5], [9, 5]]), "o caderno abre as três perguntas sobre a ponte pronta"),
 "02_05": (Mq(mc([10, 3.4, 8], [3.2, 0.2, 0], [8.5, 2.8, 6.8], [3.6, 0.2, 0]), [TX("q1", "1 · Was kann eine Pontonbrücke?", 72, 96, 0.1, 44)], bau=[[0, 0.02], [3, 0.35]], felder=6, foco=(3.2, 0.3, 0, 5)), "pergunta 1: o pontão entra em cena"),
 "02_06": (K("Sedan", 40, 160, 50, data="", cidades=["Frénois", "Flize", "Donchery"], marcas=[XX("Frenois", 0.5), XX("Flize", 0.8), OK("Donchery", 1.2)]), "pergunta 2: ✗ e ✓ no Mosa"),
 "02_07": (K("Sedan", 26, 120, 40, data="", cidades=["Sedan"], marcas=[{**RING, "t": 0.3, "dur": 2.0}]), "pergunta 3: o anel em volta de Sedan (o que estava em jogo)"),
 # 03 — a máquina (caderno + 3D)
 "03_01": (Mq(mc([14, 5, 12], [3.2, 0.2, 0], [11, 4, 9], [3.2, 0.2, 0]), [TT("Die Maschine")], bau=[[0, 0.0], [2.8, 0.3]], felder=6, foco=(3.2, 0.3, 0, 6)), "o pontão chega ao atelier"),
 "03_02": (Mq(mc([10.5, 3.6, 8.5], [3.2, 0.1, -0.4], [9.2, 3.0, 7.0], [3.2, 0.15, -0.2]), [TT("Der preußische Ponton"), LB("lL", "pontonBug:0", "7,21 m lang", 560, 250, 1.6, 38), LB("lB", "pontonSeite:0", "1,52 m breit", 1080, 640, 3.6, 34)], bau=[[0, 0.3], [5, 0.3]], felder=6, foco=(3.2, 0.3, 0, 5)), "as medidas se escrevem no pontão"),
 "03_03": (Mq(mc([2, 4.5, 9], [3.2, 0.1, 0], [1, 3.8, 8], [3.2, 0.1, 0]), [TX("n1", "aus Holz", 72, 700, 0.1, 34), ZA("z1", 0, 514, "kg", 72, 770, 0.4, 1.4)], bau=[[0, 0.3], [3, 0.3]], felder=6, foco=(3.2, 0.3, 0, 5)), "o peso conta até 514 kg"),
 "03_04": (Mq(mc([6, 1.6, 7], [3.2, 0.2, 0], [5, 1.4, 6.5], [3.2, 0.2, 0]), [TX("n1", "er trägt", 72, 700, 0.1, 34), ZA("z1", 0, 4638, "kg", 72, 770, 0.3, 1.3)], bau=[[0, 0.3], [2, 0.3]], felder=6, foco=(3.2, 0.3, 0, 5)), "a carga conta até 4.638 kg, ao lado dos 514"),
 "03_05": (B("e09", [0.4, 0.3, 1.0, 0.95], "Wagen, Ponton, Gerät", par=0.9, zoom=0.9), "a gravura do trem: carro, pontão e material de um campo"),
 "03_06": (Mq(mc([-6, 14, 30], [12, 0, 0], [-2, 12, 28], [13, 0, 0], 36), [TT("Ponton-Kolonne"), TX("n1", "nach dem Etat", 72, 700, 0.4, 30), ZA("z1", 0, 34, "n", 72, 760, 0.8, 2.4), TX("n2", "Wagen · 6 Pferde je Wagen", 160, 772, 2.6, 30)], bau=[[0, 5], [6, 5]]), "a ponte inteira e a contagem dos carros da coluna"),
 "03_07": (Mq(mc([24, 10.5, 19], [10, 0, -1], [27, 10, 17], [11, 0, -1], 34), [TT("Brückenschlag – Feld um Feld", 0.1)], bau=[[0, 0.1], [1.2, 0.35]]), "câmera abre: a ponte vai crescer"),
 "03_08": (Mq(mc([12, 4.5, 11], [3.2, 0, -2], [10, 3.8, 9], [3.6, 0, -2.5]), [LB("la", "anker:0", "Anker gegen die Strömung", 640, 210, 0.8, 32)], bau=[[0, 0.15], [4, 0.46]]), "o pontão entra e é ancorado contra a corrente"),
 "03_09": (Mq(mc([9, 5, 6], [3.2, 0.3, 0], [7, 4.2, 5], [3.6, 0.3, 0]), [LB("ll", "balken:0", "fünf Streckbalken", 1040, 250, 0.2, 32), LB("lr", "belag:0", "der Belag", 1150, 640, 1.6, 34)], bau=[[0, 0.45], [3, 1.0]]), "caem as 5 vigas, depois as tábuas"),
 "03_10": (Mq(mc([16, 6, 12], [6, 0.2, 0], [14, 5, 10], [7.2, 0.2, 0]), [TX("n1", "Feldweite", 72, 700, 0.3, 30), ZA("z1", 0, 4.4, "m1", 72, 760, 0.5, 1.2)], bau=[[0, 1.0], [2.6, 1.95]]), "o próximo pontão, 4,4 m adiante"),
 "03_11": (Mq(mc([30, 9.5, 15], [14, 0, -1], [33, 9, 12], [16, 0, -1], 34), [TX("n1", "Brückenlänge", 72, 700, 0.1, 30), ZA("z1", 8.6, 22, "m1", 72, 760, 0.2, 2.8)], bau=[[0, 1.95], [3.1, 5]]), "campo a campo a estrada atravessa"),
 # 04 — o Mosela (mapa)
 "04_01": (K("Lorraine", 160, 0, 62, data="August 1870", cidades=["Metz", "Pont-à-Mousson", "Nancy"], rios=[0, 1.2]), "a região: Metz, o Mosela, agosto de 1870"),
 "04_02": (K("Metz", 60, 300, 50, data="August 1870", cidades=["Metz", "Mars-la-Tour"], pfeil=[{"de": "rueck", "pts": [[5.6, 49.15], [5.9, 49.12], [6.12, 49.12]], "t": [0.3, 2.0], "larg": 0.5}]), "a seta francesa recua para Metz"),
 "04_03": (K("Lorraine", 110, 330, 55, data="August 1870", cidades=["Metz", "Pont-à-Mousson"]), "o Mosela entre os alemães e Paris (rio em destaque)"),
 "04_04": (K("PaM", 40, 20, 52, data="August 1870", cidades=["Corny", "Pont-à-Mousson", "Dieulouard", "Marbache"], marcas=[OK(n, 0.3 + i * 0.4) for i, n in enumerate(MOSEL6)]), "as pontes ao sul de Metz marcadas uma a uma"),
 "04_05": (K("PaM", 28, 60, 46, data="August 1870", cidades=["Pont-à-Mousson"], marcas=[OK(n, 0) for n in MOSEL6] + [{"tipo": "uhr", "txt": "keine gesprengt", "t": 0.3}]), "nenhuma explodida: todos os ✓ ficam"),
 "04_06": (K("Corny", 9, 200, 36, data="15. August 1870", cidades=["Corny", "Novéant"], marcas=[OK("Corny", 0.2, "Hängebrücke")]), "close na ponte pênsil de Corny"),
 "04_07": (K("Corny", 30, 140, 44, data="15./16. August", cidades=["Corny", "Mars-la-Tour"], pfeil=[{"de": "saar", "pts": SAAR, "t": [0.4, 5.0], "larg": 0.45}], marcas=[OK("Corny", 0)]), "a divisão atravessa em Corny rumo a Mars-la-Tour"),
 "04_08": (B("e03", [0.1, 0.2, 0.9, 0.85], "Pont-à-Mousson, 14. August 1870", par=0.9), "a gravura de Pont-à-Mousson ocupada: a sorte alemã"),
 "04_09": (K("StAvold", 30, 40, 48, data="15. August 1870", cidades=["Saint-Avold"], marcas=[OK("StAvold", 0.2, "Pontontrain?")]), "o estado-maior procura o trem de pontões"),
 "04_11": (K("Lorraine", 70, 20, 56, data="15. August 1870", cidades=["Saint-Avold", "Pont-à-Mousson"], marcas=[{"tipo": "linie", "pts": [L("StAvold"), L("PaM")], "t": 0.3, "dur": 2.4, "txt": "52 km"}]), "a linha de 52 km se desenha"),
 "04_12": (K("PaM", 24, 80, 42, data="16. August 1870", cidades=["Pont-à-Mousson"], marcas=[{"tipo": "uhr", "txt": "12.45 Uhr", "t": 0.3}], bruecke={"at": P("K", *LL["PaM"]), "t": [0.8, 3.0], "esc": 1.6}), "o trem chega ao Mosela às 12h45"),
 "04_13": (K("MarsLaTour", 28, 250, 46, data="16. August 1870", cidades=["Mars-la-Tour"], marcas=[XX("MarsLaTour", 0.2, "Schlacht")]), "a batalha já em curso em Mars-la-Tour"),
 "04_14": (B("e15", [0.08, 0.35, 0.92, 0.65], "Generalstabswerk, S. 521", par=0.12, zoom=0.7), "a página-prova: 'die nicht zerstörte Brücke'"),
 # 05 — quão rápido (caderno + Sena)
 "05_01": (Mq(mc([24, 14, 22], [12, 0, 0], [20, 12, 20], [12, 0, 0], 34), [TT("Was kostet eine Sprengung?")], bau=[[0, 5], [3, 5]]), "a pergunta sobre a ponte pronta"),
 "05_02": (B("e14", [0.08, 0.3, 0.92, 0.7], "Gesch. d. Pomm. Pionier-Bat. Nr. 2, S. 90", par=0.12, zoom=0.7), "a página do batalhão pomerano"),
 "05_03": (S("Juvisy", 14, 30, 48, data="17. November 1870", cidades=["Juvisy", "Paris"], bruecke={"at": P("S", *LL["Juvisy"]), "t": [0.6, 4.0], "esc": 1.6}, marcas=[{"tipo": "uhr", "txt": "141 m", "t": 1.2}]), "Juvisy no Sena: a ponte de 141 m se desenha"),
 "05_04": (Mq(mc([34, 12, 18], [16, 0, -1], [30, 10, 16], [14, 0, -1], 34), [ZA("z1", 0, 31, "n", 72, 760, 0.2, 3.0), TX("n1", "Pontons", 72, 700, 0.1, 30), TX("n2", "+ 1 Bock · 3,25 m Wassertiefe", 200, 772, 2.0, 30)], bau=[[0, 0.3], [4, 5]]), "a contagem dos 31 pontões enquanto a ponte cresce"),
 "05_05": (Mq(mc([22, 8, 16], [12, 0, 0], [24, 7, 14], [13, 0, 0]), [TX("n1", "Dauer", 72, 700, 0.1, 30), ZA("z1", 0, 105, "min", 72, 760, 0.2, 1.6)], bau=[[0, 3.5], [2, 5]]), "o tempo conta até 105 min"),
 "05_06": (Mq(mc([8, 3, 7], [6.8, 0.2, 0], [7, 2.6, 6], [7.6, 0.2, 0]), [TX("n1", "pro Ponton", 72, 700, 0.1, 30), ZA("z1", 0, 3.3, "m1", 72, 760, 0.2, 1.2)], bau=[[0, 1.0], [2, 2.0]]), "um campo em ~3,3 min (o relógio de um campo)"),
 "05_07": (K("PaM", 7, 90, 30, data="", cidades=["Pont-à-Mousson"], marcas=[{"tipo": "linie", "pts": [[6.047, 48.905], [6.062, 48.905]], "t": 0.3, "dur": 1.5, "txt": "110–150 m"}]), "a largura do Mosela medida no mapa"),
 "05_08": (Mq(mc([30, 18, 12], [14, 0, 0], [26, 16, 14], [14, 0, 0], 36), [TX("n1", "eine Kolonne", 72, 700, 0.2, 30), TX("n2", "≈ 141 m Brücke", 72, 760, 0.8, 44, col="acc")], bau=[[0, 4], [3, 5]]), "uma coluna basta para o rio inteiro"),
 "05_09": (Mq(mc([38, 9, 4], [14, 0, 0], [34, 8, 8], [14, 0, 0], 32), [TX("n1", "< 2 Stunden", 72, 760, 0.2, 54, col="acc")], bau=[[0, 5], [2, 5]]), "menos de 2 horas: o número fecha"),
 # 05b — a cheia
 "05b_01": (B("e01", [0.15, 0.3, 0.85, 0.8], "Suresnes, Pontonbrücke", par=0.85), "a gravura de uma ponte de pontões real"),
 "05b_02": (Mq(mc([13, 21, 24], [13, 0, 1], [15, 19, 23], [13, 0, 1], 36), [TT("Novéant, September 1870")], bau=[[0, 5], [3, 5]], v=[[0, 0.45], [3, 0.5]]), "a ponte de Novéant, rio calmo"),
 "05b_04": (Mq(mc([20, 15, 20], [13, 0, 1], [18, 14, 22], [13, 0, 1], 36), [TX("n1", "Strömung", 72, 700, 0.2, 30), ZA("z1", 0.45, 1.25, "ms2", 72, 760, 0.3, 4.5)], bau=[[0, 5], [6, 5]], v=[[0, 0.45], [5, 1.25]], biege=[[0, 0], [3, 0], [6, 0.35]]), "a corrente sobe até 1,25 m/s"),
 "05b_05": (Mq(mc([13, 21, 24], [13, 0, 1], [17, 18, 22], [13, 0, 2], 36), [LB("lh", "ponton:2", "Halbmond", 980, 210, 0.4, 40, acc=True)], bau=[[0, 5], [3, 5]], v=[[0, 1.25]], biege=[[0, 0.35], [2.4, 1]]), "a ponte se curva em meia-lua"),
 "05b_06": (Mq(mc([16, 18, 20], [13, 0, 1], [15, 17, 21], [13, 0, 1], 36), [{"type": "clock", "key": "c1", "x": 1380, "y": 220, "r": 70, "em": 0.2, "time": [1, 0], "cap": "1 Uhr nachts"}], bau=[[0, 5], [2.4, 0]], v=[[0, 1.25], [2.4, 0.6]], biege=[[0, 1], [2.4, 1]]), "a ponte desmontada; o relógio marca 1h"),
 "05b_07": (Mq(mc([26, 10, 18], [13, 0, 0], [22, 9, 16], [13, 0, 0], 34), [{"type": "clock", "key": "c1", "x": 1380, "y": 220, "r": 70, "em": 0.1, "time": [7, 0], "cap": "7 Uhr"}, TX("n1", "16 Pontons", 72, 760, 1.0, 44, col="acc")], bau=[[0, 0], [3.8, 5]], v=[[0, 0.6]]), "refeita em timelapse até as 7h"),
 # 05c — e a França?
 "05c_02": (B("e09", [0.0, 0.0, 0.6, 0.6], "Pontonniers français", par=0.8), "pontonniers franceses na gravura de Épinal"),
 "05c_03": (K("Forbach", 18, 60, 44, data="6. August 1870", cidades=["Forbach", "Saarbrücken"], marcas=[XX("Forbach", 0.4, "42 Wagen erbeutet")]), "Forbach: o trem francês de 42 carros capturado"),
 "05c_05": (K("Sedan", 46, 200, 52, data="Ende August", cidades=["Sedan"], marcas=[{"tipo": "uhr", "txt": "kein Pontontrain", "t": 0.3}]), "MacMahon no Mosa sem pontões"),
 "05c_06": (K("Sedan", 24, 150, 44, data="Ende August", cidades=["Sedan", "Donchery", "Bazeilles"], marcas=[OK("Donchery", 0.4), OK("Bazeilles", 0.8)]), "as pontes fixas como única saída da armée"),
 "05c_07": (K("Sedan", 12, 100, 36, data="", cidades=["Sedan"], marcas=[OK("Donchery", 0), OK("Bazeilles", 0), {"tipo": "uhr", "txt": "der eigene Ausweg", "t": 0.2}]), "a saída própria"),
 # 06 — o Mosa
 "06_01": (K("Sedan", 90, 10, 58, data="Ende August 1870", cidades=["Sedan", "Mézières"], rios=[0, 1.2]), "o Mosa duas semanas depois"),
 "06_02": (K("Sedan", 120, 160, 58, data="Ende August 1870", cidades=["Sedan", "Metz"], pfeil=[{"de": "mac", "pts": [[4.6, 49.5], [4.95, 49.6], [5.4, 49.45], [5.8, 49.3]], "t": [0.3, 3.0], "larg": 0.6}]), "o plano de MacMahon: seta para Metz"),
 "06_03": (K("Sedan", 70, 200, 54, data="Ende August 1870", cidades=["Sedan"], pfeil=[{"de": "maas", "pts": MAAS_V, "t": [0.2, 3.2], "larg": 0.5}]), "os alemães empurram para o norte, contra Sedan"),
 "06_04": (B("e08", [0.1, 0.2, 0.9, 0.85], "Kehl, 1870", par=0.85), "gravura: pontes e demolições à beira do rio"),
 "06_05": (K("Sedan", 22, 170, 46, data="30./31. August", cidades=["Frénois", "Flize"], marcas=[XX("Frenois", 0.4, "gesprengt"), XX("Flize", 0.9, "gesprengt")]), "só Frénois e Flize recebem o ✗"),
 "06_06": (K("Donchery", 10, 250, 34, data="31. August", cidades=["Donchery"], marcas=[OK("Donchery", 0.2, "steht")]), "Donchery fica"),
 "06_07": (K("Bazeilles", 9, 140, 36, data="31. August", cidades=["Bazeilles"], marcas=[OK("Bazeilles", 0.3, "Eisenbahnbrücke")]), "Bazeilles: a tentativa na ponte ferroviária"),
 "06_08": (K("Bazeilles", 6, 190, 30, data="31. August", cidades=["Bazeilles"], marcas=[OK("Bazeilles", 0), {"tipo": "uhr", "txt": "Pulverfässer im Fluss", "t": 0.3}]), "os barris de pólvora vão para o rio"),
 "06_09": (Mq(mc([18, 9, 14], [8, 0, 0], [16, 8, 12], [9, 0, 0]), [TT("Wo keine Brücke steht")], bau=[[0, 0.5], [3.5, 3]]), "onde não há ponte, a ponte nasce"),
 "06_10": (K("Remilly", 9, 120, 38, data="31. August", cidades=["Remilly", "Bazeilles"], bruecke={"at": P("K", *LL["Remilly"]), "t": [0.4, 3.0], "esc": 2.2}), "duas pontes bávaras em Remilly sob fogo"),
 "06_11": (K("Remilly", 7, 200, 32, data="1. September, nachts", cidades=["Remilly"], bruecke={"at": P("K", *LL["Remilly"]), "t": [-9, -8], "esc": 2.2}, marcas=[{"tipo": "uhr", "txt": "3 Uhr", "t": 0.3}]), "a ordem de fechar à noite"),
 "06_12": (Mq(mc([20, 8, 14], [10, 0, 0], [17, 7, 12], [11, 0, 0]), [TX("n1", "geschlossen nach", 72, 700, 0.1, 30), ZA("z1", 0, 10, "min", 72, 760, 0.2, 1.6)], bau=[[0, 3], [1.8, 5]]), "fechada em 10 minutos"),
 # 07 — a ironia de Donchery
 "07_01": (B("e12", [0.1, 0.3, 0.9, 0.7], "Frobenius, Bd. 2, S. 40", par=0.12, zoom=0.75), "a página de Frobenius: o momento mais estranho"),
 "07_02": (K("Donchery", 8, 300, 36, data="31. August", cidades=["Donchery"], marcas=[OK("Donchery", 0.2, "Eisenbahnbrücke"), {"tipo": "linie", "pts": BAHN_MAAS[1:4], "t": 0.4, "dur": 1.6}]), "a ponte ferroviária de Donchery, intacta"),
 "07_03": (Mq(mc([22, 6, 18], [10, 0, 0], [20, 5.5, 16], [11, 0, 0]), [TT("Die Sprengkammern"), TX("n1", "von den Franzosen gebohrt", 72, 760, 0.6, 36, col="acc")], bau=[[0, 5], [2, 5]]), "as câmaras de mina já abertas (caderno)"),
 "07_04": (Mq(mc([24, 7, 12], [12, 0, 0], [22, 6.5, 14], [12, 0, 0]), [TX("n1", "Verdämmungsmaterial: bereit", 72, 760, 0.3, 36)], bau=[[0, 5], [2, 5]]), "o material de tamponamento pronto"),
 "07_05": (K("Donchery", 26, 260, 44, data="31. August", cidades=["Donchery", "Mézières"], marcas=[{"tipo": "zug", "pts": BAHN_MAAS[2:], "t": 0.2, "dur": 3.0, "fass": True}]), "o barril no trem para Mézières, de novo"),
 "07_06": (K("Donchery", 7, 220, 32, data="1. September, 2 Uhr", cidades=["Donchery"], marcas=[XX("Donchery", 0.6, "Eisenbahnbrücke gesprengt")]), "às 2h os prussianos explodem a ponte"),
 "07_07": (Mq(mc([18, 6, 14], [10, 0, 0], [16, 5.5, 13], [10, 0, 0]), [TX("n1", "mit den französischen Kammern", 72, 760, 0.2, 36, col="acc")], bau=[[0, 5], [2, 5]]), "usando as câmaras francesas"),
 "07_08": (Mq(mc([16, 7, 15], [12, 0, 0], [14, 6, 13], [12, 0, 0]), [TX("n1", "zwei Ladungen", 72, 700, 0.1, 30), ZA("z1", 0, 235, "n", 72, 760, 0.3, 1.4), TX("n2", "Pfund je Kammer", 210, 772, 1.4, 30)], bau=[[0, 5], [2, 5]]), "2 cargas de 235 libras contam"),
 "07_09": (Mq(mc([30, 12, 16], [12, 0, 0], [28, 11, 18], [12, 0, 0]), [TX("n1", "Lücke", 72, 700, 0.1, 30), ZA("z1", 0, 72, "m1", 72, 760, 0.3, 1.4)], bau=[[0, 5], [2.4, 1.6]]), "o vão de 72 m se abre"),
 "07_10": (K("Donchery", 30, 160, 46, data="1. September", cidades=["Donchery", "Sedan"], pfeil=[{"de": "cerco", "pts": [[4.86, 49.65], [4.873, 49.698], [4.9, 49.735], [4.93, 49.75]], "t": [0.2, 2.2], "larg": 0.35}]), "dois corpos cruzam o Mosa em Donchery"),
 "07_11": (K("Sedan", 22, 100, 50, data="1. September, 11 Uhr", cidades=["Sedan", "Saint-Menges"], marcas=[{**RING, "t": 0.2, "dur": 2.0}, {"tipo": "uhr", "txt": "11 Uhr", "t": 0.2}]), "o anel em volta de Sedan se fecha às 11h"),
 # 08 — o que uma demolição custa
 "08_01": (K("Lorraine", 150, 40, 62, data="", cidades=["Metz", "Sedan"], marcas=[OK(n, 0.2 + i * 0.2) for i, n in enumerate(["Corny", "PaM", "Dieulouard", "Donchery", "Bazeilles"])]), "a pergunta sobre o mapa de pontes intactas"),
 "08_02": (B("e04", [0.1, 0.2, 0.9, 0.85], "Champigny, Pont de bateaux", par=0.85), "a gravura do caos à beira do rio"),
 "08_03": (K("Donchery", 20, 280, 44, data="", cidades=["Donchery"], marcas=[{"tipo": "zug", "pts": BAHN_MAAS[2:], "t": 0.1, "dur": 3.2, "fass": True}]), "ordens atrasadas, homens exaustos, um trem que segue"),
 "08_04": (Mq(mc([24, 14, 22], [12, 0, 0], [21, 12, 20], [12, 0, 0], 34), [TT("Der unbequemere Teil")], bau=[[0, 5], [3, 5]]), "a segunda parte, mais incômoda"),
 "08_05": (S("Corbeil", 18, 40, 52, data="September 1870", cidades=["Corbeil", "Paris"]), "o Sena: onde a França explodiu"),
 "08_06": (S("Corbeil", 8, 150, 38, data="17. September 1870", cidades=["Corbeil"], marcas=[XX("Corbeil", 0.4, "gesprengt")]), "Corbeil: a ponte explodida"),
 "08_07": (S("Corbeil", 6, 200, 34, data="17. September 1870", cidades=["Corbeil"], marcas=[XX("Corbeil", 0), {"tipo": "uhr", "txt": "+ 2¼ Stunden", "t": 0.4}], bruecke={"at": P("S", *LL["Corbeil"]), "t": [0.6, 3.6], "esc": 1.4}), "2¼ h depois a ponte de pontões ao lado"),
 "08_08": (S("Paris", 30, 10, 56, data="Marsch auf Paris", cidades=["Paris", "Corbeil", "Juvisy", "Villeneuve-St-Georges"], pfeil=[{"de": "paris", "pts": [[2.9, 48.5], [2.6, 48.6], [2.45, 48.7]], "t": [0.3, 4.5], "larg": 0.4}]), "a marcha sobre Paris sem atraso"),
 "08_09": (B("e05", [0.1, 0.2, 0.9, 0.85], "Montlouis, Eisenbahnbrücke", par=0.8), "a ponte ferroviária explodida de Montlouis"),
 "08_10": (B("e06", [0.1, 0.2, 0.9, 0.85], "Montlouis, Holzprovisorium", par=0.8, lado=-1), "o reparo provisório em madeira (semanas)"),
 "08_11": (Mq(mc([30, 12, 18], [12, 0, 0], [26, 11, 17], [12, 0, 0]), [TX("n1", "Montlouis", 72, 700, 0.1, 30), ZA("z1", 0, 17, "n", 72, 760, 0.3, 2.0), TX("n2", "Tage ohne Züge", 160, 772, 1.8, 34, col="acc")], bau=[[0, 5], [2, 5]]), "17 dias sem trens contam"),
 "08_12": (Mq(mc([26, 9, 14], [12, 0, 0], [22, 8, 16], [12, 0, 0]), [TX("n1", "Pontonbrücke:", 72, 700, 0.1, 34), TX("n2", "Stunden", 300, 700, 0.6, 44, col="acc")], bau=[[0, 1], [2.8, 5]]), "contra pontões: horas"),
 "08_13": (Mq(mc([36, 14, 6], [12, 0, 0], [33, 13, 10], [12, 0, 0]), [TX("n1", "Eisenbahn:", 72, 760, 0.1, 34), TX("n2", "Wochen", 260, 760, 0.5, 54, col="acc")], bau=[[0, 5], [2, 5]]), "contra trens: semanas"),
 # 09 — sabido, calculado, desconhecido
 "09_02": (K("Lorraine", 140, 330, 60, data="gesichert", cidades=["Metz", "Sedan"], marcas=[OK(n, 0.2 + i * 0.3) for i, n in enumerate(["Corny", "PaM", "Dieulouard", "Marbache", "Donchery", "Bazeilles"])]), "SABIDO: as pontes intactas"),
 "09_03": (B("e13", [0.1, 0.6, 0.9, 0.8], "Generalstabswerk, S. 1115", par=0.1, zoom=0.75), "a fonte do trem com a pólvora"),
 "09_04": (Mq(mc([28, 10, 16], [12, 0, 0], [25, 9, 15], [12, 0, 0]), [TT("berechnet"), TX("n1", "141 m ÷ 105 min ≈ 1,3 m/min", 72, 760, 0.4, 36)], bau=[[0, 2], [3.6, 5]]), "CALCULADO: a conta de ritmo"),
 "09_05": (B("e09", [0.0, 0.3, 0.7, 1.0], "die französische Sicht", par=0.8), "DESCONHECIDO: o lado francês"),
 "09_06": (K("Donchery", 14, 200, 40, data="?", cidades=["Donchery", "Sedan"], marcas=[OK("Donchery", 0.2), {"tipo": "uhr", "txt": "warum?", "t": 0.4}]), "por que a ordem não foi cumprida"),
 "09_07": (K("Sedan", 40, 120, 50, data="", cidades=["Sedan"], marcas=[{"tipo": "zug", "pts": BAHN_MAAS[2:], "t": 0.1, "dur": 3.4, "fass": True}]), "exaustão ou caos da retirada"),
 "09_08": (Mq(mc([30, 16, 20], [12, 0, 0], [27, 14, 19], [12, 0, 0], 34), [TT("Die Antwort")], bau=[[0, 5], [2, 5]]), "a resposta"),
 "09_09": (K("Lorraine", 160, 20, 64, data="", cidades=["Metz", "Sedan"], marcas=[OK(n, 0.1 + i * 0.15) for i, n in enumerate(["Corny", "PaM", "Dieulouard", "Donchery", "Bazeilles"])]), "não explodiu: os ✓"),
 "09_10": (Mq(mc([40, 18, 22], [12, 0, 0], [52, 24, 30], [12, 0, 0], 34), [TX("n1", "nicht · zu spät · das Falsche", 72, 760, 0.6, 44, col="acc")], bau=[[0, 0.5], [7, 5]]), "a resposta escrita enquanto a ponte se completa"),
}
# 04/11: mapa caiu de 44% para ~37% — frases de reflexão/recapitulação vão para o caderno (lugar fica no mapa)
P_.update({
 "02_06": (Mq(mc([20, 10, 18], [9, 0, 0], [18, 9, 16], [10, 0, 0]), [TX("q2", "2 · Welche Brücken wurden gesprengt?", 72, 96, 0.1, 44)], bau=[[0, 2], [3, 3]]), "pergunta 2 no caderno sobre a ponte em montagem"),
 "04_03": (Mq(mc([34, 16, 8], [14, 0, 0], [31, 15, 12], [14, 0, 0], 34), [TT("Die Mosel"), TX("n1", "zwischen den Deutschen und Paris", 72, 760, 0.4, 36)], bau=[[0, 0], [3, 0]]), "o rio vazio, sem ponte: o obstáculo"),
 "05c_05": (Mq(mc([34, 12, 10], [14, 0, 0], [30, 11, 14], [14, 0, 0], 34), [TX("n1", "MacMahons Armee:", 72, 700, 0.2, 34), TX("n2", "kein Pontontrain", 72, 760, 1.0, 50, col="acc")], bau=[[0, 0], [4, 0]]), "o rio sem pontões do lado francês"),
 "05c_07": (Mq(mc([28, 7, 4], [12, 0, 0], [26, 6.5, 8], [12, 0, 0]), [TX("n1", "der eigene Ausweg", 72, 760, 0.1, 50, col="acc")], bau=[[0, 5], [1.5, 5]]), "a ponte como saída própria"),
 "06_01": (B("e08", [0.0, 0.1, 0.7, 0.75], "an der Maas", par=0.75, lado=-1), "a gravura do rio: duas semanas depois"),
 "06_08": (Mq(mc([12, 3, 9], [6, 0, 0], [10, 2.6, 8], [6.5, 0, 0]), [TX("n1", "Pulverfässer", 72, 700, 0.1, 34), TX("n2", "in den Fluss", 72, 760, 0.6, 46, col="acc")], bau=[[0, 2], [2, 2]], v=[[0, 0.6]]), "os barris vão para a correnteza"),
 "08_01": (Mq(mc([30, 16, 22], [12, 0, 0], [26, 14, 21], [12, 0, 0], 34), [TT("Warum sprengte Frankreich nicht?")], bau=[[0, 5], [2.5, 5]]), "a pergunta central sobre a ponte inteira"),
 "09_06": (Mq(mc([10, 4, 10], [8, 0, 0], [9, 3.6, 9], [8.6, 0, 0]), [TX("n1", "Warum wurde der Befehl", 72, 700, 0.1, 34), TX("n2", "nicht ausgeführt?", 72, 760, 0.6, 44, col="acc")], bau=[[0, 5], [3, 5]]), "a pergunta aberta"),
 "09_07": (Mq(mc([22, 9, 4], [12, 0, 0], [20, 8, 9], [12, 0, 0]), [TX("n1", "Moltke: Erschöpfung", 72, 700, 0.2, 34), TX("n2", "andere: Chaos des Rückzugs", 72, 760, 1.6, 34)], bau=[[0, 5], [3, 5]]), "duas explicações lado a lado"),
 "09_09": (Mq(mc([20, 6, 20], [10, 0, 0], [18, 5.5, 18], [11, 0, 0]), [TX("n1", "nicht, weil es sprengte", 72, 760, 0.2, 44)], bau=[[0, 5], [2, 5]]), "a primeira metade da resposta"),
})
# 05/11 (revisão das folhas): a ponte inteira repetia em ~15 batidas só com texto trocado = "modelo + rótulo" (crítica do P4).
# Essas frases viram ESQUEMA a pena no caderno (sem 3D, câmera no papel), cada um explicando a sua frase.
PAPEL = mc([-60, 9, 6], [-60, 0, -6], [-60, 8.6, 5.6], [-60, 0, -6], 30)
RU = lambda key, pts, em, dur=0.8, w=2.4, c="ink", dash="": {"type": "rule", "key": key, "pts": pts, "em": em, "dur": dur, "w": w, "c": c, **({"dash": dash} if dash else {})}
def SK(notes, dem):
    return (Mq(PAPEL, notes, bau=[[0, 0]], felder=1, foco=(-60, 0, -6, 12)), dem)
# corte da ponte ferroviária de Donchery: arcos, pilares, as 2 câmaras (vermelho) — desenhados à pena
ARCOS = [[[round(c + 240 * math.cos(math.pi * (1 - k / 16)), 1), round(560 - 120 * math.sin(math.pi * k / 16), 1)] for k in range(17)] for c in (420, 940)]
TABULEIRO = [[160, 420], [1440, 420]]
PILAR = lambda x: [[x - 22, 560], [x - 22, 700], [x + 22, 700], [x + 22, 560]]
CAM = lambda x: [[x - 12, 600], [x - 12, 640], [x + 12, 640], [x + 12, 600], [x - 12, 600]]
P_.update({
 "02_04": SK([TT("Drei Fragen"), TX("q1", "1 · Was kann eine Pontonbrücke?", 160, 330, 0.6, 46), TX("q2", "2 · Welche Brücken wurden gesprengt?", 160, 430, 1.6, 46), TX("q3", "3 · Warum war das entscheidend?", 160, 530, 2.6, 46)], "as três perguntas escritas a pena, uma por vez"),
 "05_05": SK([TT("Juvisy, 17. November 1870"), {"type": "clock", "key": "c1", "x": 560, "y": 470, "r": 150, "em": 0.2, "time": [4, 45], "cap": "15 Uhr → 16.45 Uhr"}, TX("n1", "Dauer", 900, 420, 0.6, 40), ZA("z1", 0, 105, "min", 900, 500, 0.8, 1.4, 72)], "o relógio: 1¾ h de obra"),
 "05_06": SK([TX("n1", "105 min ÷ 32 Stützen", 160, 380, 0.2, 48), RU("r1", [[160, 420], [900, 420]], 1.0, 0.6), ZA("z1", 0, 3.3, "d1", 160, 520, 1.4, 1.0, 84), TX("n2", "Minuten pro Ponton", 330, 520, 1.6, 40, col="acc")], "a conta: ~3,3 min por pontão"),
 "05_08": SK([TT("Mosel gegen Kolonne"), TX("a", "Breite der Mosel", 160, 330, 0.2, 36), RU("b1", [[160, 380], [880, 380]], 0.5, 1.2, 14, "ink2"), RU("b1b", [[880, 380], [1180, 380]], 1.3, 0.6, 14, "ink2", "10 8"), TX("a2", "110–150 m", 1200, 392, 1.6, 36),
              TX("b", "eine Ponton-Kolonne", 160, 500, 1.8, 36), RU("b2", [[160, 550], [1128, 550]], 2.1, 1.4, 14, "acc"), TX("b3", "141 m", 1150, 562, 3.3, 40, col="acc")], "duas barras lado a lado: rio × coluna"),
 "05_09": SK([TX("n1", "eine Kolonne reicht", 160, 400, 0.1, 50), TX("n2", "in weniger als 2 Stunden", 160, 500, 0.5, 62, col="acc"), RU("u", [[160, 520], [960, 516]], 1.4, 0.4, 3, "acc")], "a conclusão sublinhada"),
 "07_03": SK([TT("Eisenbahnbrücke Donchery", 0.1), RU("t", TABULEIRO, 0.2, 0.6, 3), *[RU(f"a{i}", a, 0.4 + i * 0.3, 0.6, 2.4) for i, a in enumerate(ARCOS)], RU("p1", PILAR(680), 0.9, 0.5, 2.4),
              RU("c1", CAM(668), 1.4, 0.5, 3, "acc"), RU("c2", CAM(692), 1.6, 0.5, 3, "acc"), TX("n1", "Sprengkammern – französisch gebohrt", 740, 640, 1.8, 34, col="acc")], "o corte da ponte com as duas câmaras (vermelho)"),
 "07_04": SK([RU("t", TABULEIRO, 0, 0.01, 3), *[RU(f"a{i}", a, 0, 0.01, 2.4) for i, a in enumerate(ARCOS)], RU("p1", PILAR(680), 0, 0.01, 2.4), RU("c1", CAM(668), 0, 0.01, 3, "acc"), RU("c2", CAM(692), 0, 0.01, 3, "acc"),
              *[RU(f"h{i}", [[620 + i * 12, 720], [640 + i * 12, 760]], 0.3 + i * 0.05, 0.2, 2) for i in range(8)], TX("n1", "Verdämmung: bereit", 740, 760, 0.6, 34)], "o material de tamponamento hachurado ao pé do pilar"),
 "07_07": SK([RU("t", TABULEIRO, 0, 0.01, 3), *[RU(f"a{i}", a, 0, 0.01, 2.4) for i, a in enumerate(ARCOS)], RU("p1", PILAR(680), 0, 0.01, 2.4), RU("c1", CAM(668), 0, 0.01, 4, "acc"), RU("c2", CAM(692), 0, 0.01, 4, "acc"),
              TX("n1", "preußische Pioniere, 2 Uhr nachts", 160, 800, 0.2, 34), TX("n2", "mit den französischen Kammern", 740, 640, 0.8, 34, col="acc")], "as mesmas câmaras, agora usadas pelos prussianos"),
 "07_08": SK([RU("t", TABULEIRO, 0, 0.01, 3), *[RU(f"a{i}", a, 0, 0.01, 2.4) for i, a in enumerate(ARCOS)], RU("p1", PILAR(680), 0, 0.01, 2.4),
              RU("c1", CAM(668), 0, 0.01, 6, "acc"), RU("c2", CAM(692), 0, 0.01, 6, "acc"), TX("n1", "zwei Ladungen", 160, 800, 0.2, 34), ZA("z1", 0, 235, "n", 470, 812, 0.4, 1.4, 52), TX("n2", "Pfund je Kammer", 620, 800, 1.6, 34)], "as cargas nas câmaras e o peso contando"),
 "07_09": SK([RU("t1", [[160, 420], [600, 420]], 0, 0.01, 3), RU("t2", [[1000, 420], [1440, 420]], 0, 0.01, 3), RU("a0", ARCOS[0][:7], 0, 0.01, 2.4), RU("a1", ARCOS[1][10:], 0, 0.01, 2.4),
              RU("q1", [[600, 420], [640, 470], [620, 520]], 0.2, 0.4, 2, "acc"), RU("q2", [[1000, 420], [970, 480], [990, 530]], 0.3, 0.4, 2, "acc"),
              {"type": "rule", "key": "d", "pts": [[600, 380], [1000, 380]], "em": 0.6, "dur": 0.8, "dim": True}, TX("n1", "72 m", 760, 360, 1.2, 52, col="acc")], "o vão de 72 m cotado"),
 "08_12": SK([TT("Was eine Sprengung kostet"), TX("a", "Pontonbrücke", 160, 400, 0.2, 38), RU("b1", [[160, 450], [210, 450]], 0.5, 0.4, 18, "acc"), TX("a2", "≈ 2 Stunden", 230, 462, 0.9, 38, col="acc"),
              TX("b", "Eisenbahnbrücke", 160, 560, 1.4, 38), RU("b2", [[160, 610], [1440, 610]], 1.6, 1.4, 18, "ink2"), TX("b2t", "17 Tage", 1300, 662, 3.0, 38)], "horas × dias na mesma escala"),
 "08_13": SK([TX("n1", "gegen Truppen mit Pontons:", 160, 400, 0.1, 40), TX("n2", "Stunden", 760, 400, 0.4, 54, col="acc"), TX("n3", "gegen Züge:", 160, 540, 0.8, 40), TX("n4", "Wochen", 480, 540, 1.1, 64, col="acc")], "a conclusão em duas linhas"),
 "09_04": SK([TT("berechnet"), TX("n1", "141 m ÷ 105 min", 160, 400, 0.4, 56), RU("r", [[160, 430], [700, 430]], 1.2, 0.4, 2.4), TX("n2", "≈ 1,3 m pro Minute", 160, 520, 1.6, 56, col="acc")], "a conta exibida como cálculo"),
 "09_07": SK([TX("n1", "Moltke:", 160, 400, 0.1, 40), TX("n2", "Erschöpfung der Männer", 380, 400, 0.4, 40), TX("n3", "andere:", 160, 520, 1.6, 40), TX("n4", "Chaos des Rückzugs", 380, 520, 1.9, 40)], "duas explicações lado a lado"),
})
# 05/11 leitura ótica do vídeo final: 04_03 e 05c_05 eram um cavalete sozinho no vazio -> mapa e esquema
P_.update({
 "04_03": (K("PaM", 70, 300, 52, data="August 1870", cidades=["Metz", "Pont-à-Mousson"], rios=[0, 1.6]), "o Mosela se desenha entre Metz e Pont-à-Mousson: o obstáculo"),
 "05c_05": SK([TX("n1", "MacMahons Armee an der Maas", 160, 380, 0.2, 44), RU("x1", [[160, 470], [700, 560]], 1.2, 0.4, 5, "acc"), RU("x2", [[160, 560], [700, 470]], 1.4, 0.4, 5, "acc"), TX("n2", "kein Pontontrain", 760, 535, 1.6, 56, col="acc")], "o trem de pontões riscado no caderno"),
})
JUNTA = {"01_04", "01_08", "01_09", "02_02", "04_10", "05b_03", "05c_01", "05c_04", "09_01"}
bat = []
for f in F:
    fid = f["id"]
    if fid in JUNTA or fid not in P_:
        if fid not in JUNTA: print("SEM_TAKE", fid)
        bat[-1]["t1"] = f["t1"]; bat[-1]["texto"] += " " + f["texto"]; continue
    take, dem = P_[fid]
    bat.append({"id": fid, "texto": f["texto"], "t0": f["t0"], "t1": f["t1"], "demonstra": dem, **json.loads(json.dumps(take))})
for i, b in enumerate(bat):
    b["v0"] = 0.0 if i == 0 else round(round(max(bat[i - 1]["t0"] + 0.5, b["t0"] - 0.12) * 24) / 24, 4)   # corte no quadro exato
for i, b in enumerate(bat):
    b["v1"] = bat[i + 1]["v0"] if i + 1 < len(bat) else round(round((b["t1"] + 2.2) * 24) / 24, 4)
    d = round(b["v1"] - b["v0"], 4); b["spec"]["dur"] = d
    if "cam" in b["spec"]: b["spec"]["cam"] = [[0 if k == 0 else d, c] for k, (_, c) in enumerate(b["spec"]["cam"])]
    # tempos de animação do take escalam para caber no take (nada corta no meio)
    sp = b["spec"]
    if b["fam"] == "M" and sp.get("bau"):
        last = sp["bau"][-1][0]; sp["bau"] = [[round(min(t, d) if last <= d else t * d / last, 3), x] for t, x in sp["bau"]]
dur = bat[-1]["v1"]
json.dump({"fps": 24, "dur": dur, "batidas": bat}, open(f"{R0}/cena/plano.json", "w", encoding="utf-8"), ensure_ascii=False)
fam = {}
for b in bat: fam[b["fam"]] = fam.get(b["fam"], 0) + b["v1"] - b["v0"]
print(len(bat), "batidas ·", round(dur, 1), "s ·", {k: f"{v / dur:.0%}" for k, v in fam.items()})
print("máx", max(b["v1"] - b["v0"] for b in bat), "mín", min(b["v1"] - b["v0"] for b in bat))
