# P4: plano de batidas a partir de roteiro/frases.json (tempo de cada frase do alinhamento). Uma batida por frase, cada uma
# com TAKE PRÓPRIO (regra de 03/11: nada reaproveitado). Frase < 1,4 s junta com a anterior; frase > 7,5 s vira 2 batidas
# (a 2ª com outra câmera). Cada batida declara 'demonstra' (o que a imagem mostra junto com a fala).
# Câmeras: ceu/altim = relativas ao avião (nariz em -x, cauda em +x, esquerda em +z); estudio = Learjet 60 por código
# (cauda em x ~ +7,9, topo da deriva em y 3); mapa = metros absolutos com origem na cratera (x leste, z -norte).
# Uso: python -I plano_p4.py  -> cena/learjet_p4/plano.json
import json, math, random
R = r"D:/reconstruccion/09_learjet_p4"
F = json.load(open(f"{R}/roteiro/frases.json", encoding="utf-8"))
rnd = random.Random(4)

def jit(v, a):  # variação pequena para nenhuma câmera repetir
    return [round(x + rnd.uniform(-a, a), 3) for x in v]

def C(p0, t0, f0, p1, t1, f1=None, near=None, far=None, j=0.0):
    a = {"pos": jit(p0, j), "tgt": t0, "fov": f0}; b = {"pos": jit(p1, j), "tgt": t1, "fov": f1 or f0}
    if near: a["near"] = near; a["far"] = far
    return [[0, a], ["FIM", b]]

# ---------------------------------------------------------------- bibliotecas de câmera
CEU = {
    "pequeno":  lambda: C([60, 18, 105], [0, 0, 0], 22, [44, 14, 108], [-6, 0, 0], j=4),
    "chase":    lambda: C([34, 3.5, 9], [-6, 0.4, 0], 20, [28, 3.0, 7], [-6, 0.4, 0], j=1.5),
    "lado":     lambda: C([4, 2.5, 38], [0, 0.5, 0], 26, [-6, 2.0, 36], [-2, 0.5, 0], j=2),
    "nariz":    lambda: C([-19, 2.7, 8.4], [-4.6, 0.25, 0], 22, [-17, 2.4, 7.4], [-4, 0.25, 0], j=0.6),
    "cima":     lambda: C([6, 46, 12], [0, 0, 0], 28, [-4, 40, 18], [0, 0, 0], j=3),
    "baixo":    lambda: C([12, -28, 16], [0, 0, 0], 30, [4, -24, 20], [0, 0, 0], j=2),
    "mergulho": lambda: C([17, 15, -10], [0, -1.2, 0], 40, [14, 12.5, -12], [0, -1.6, 0], j=1.5),
    "rasante":  lambda: C([-60, 1.5, 7], [0, 0, 0], 32, [-10, 1.2, 9], [0, 0, 0], j=1),
    "tres4":    lambda: C([-22, 9, 24], [0, 0, 0], 30, [-12, 7, 28], [0, 0, 0], j=2),
    "tras":     lambda: C([30, 10, -14], [0, 0, 0], 26, [24, 8, -20], [0, 0, 0], j=2),
}
EST = {
    "chega":      lambda: C([-30, 9, 26], [0, 0.5, 0], 30, [-14, 5, 17], [1, 0.8, 0], j=0.5),
    "lado_geral": lambda: C([2, 1.5, 30], [0, 0.6, 0], 32, [-1, 1.8, 28], [0.5, 0.8, 0], j=0.6),
    "cauda34":    lambda: C([15.5, 5.2, 8.5], [7.4, 2.2, 0.2], 32, [12.2, 4.2, 6.4], [7.5, 2.4, 0], j=0.3),
    "prof_tras":  lambda: C([13.6, 4.6, 5.6], [8.3, 2.8, 1.0], 28, [14.4, 3.9, 3.8], [8.8, 2.8, 1.4], j=0.3),
    "raiox_entra": lambda: C([12, 3.8, 5.5], [7.2, 2.4, 0], 30, [8.6, 3.0, 2.2], [7.1, 2.4, 0], j=0.15),
    "cabos":      lambda: C([9.5, 1.8, 4.2], [7.0, 2.0, 0], 30, [10.2, 2.6, 3.4], [7.6, 2.5, 0], j=0.15),
    "lado_trim":  lambda: C([7.4, 3.5, 7.4], [8.7, 2.6, 0], 26, [7.8, 3.6, 6.9], [8.8, 2.65, 0], j=0.2),
    "atuador":    lambda: C([8.9, 2.5, 2.4], [7.1, 2.3, 0], 34, [8.4, 2.9, 1.9], [7.2, 2.5, 0], j=0.1),
    "motores":    lambda: C([8.0, 1.6, 1.6], [7.05, 2.05, 0], 34, [8.4, 2.1, 1.3], [7.05, 2.1, 0], j=0.08),
    "cima_cauda": lambda: C([11.5, 6.8, 5.8], [7.8, 3.0, 0.6], 32, [10.2, 6.2, 6.6], [7.8, 3.0, 0.8], j=0.3),
    "alto":       lambda: C([2, -2.5, 30], [0, -3.6, 0], 32, [-1, -2.2, 28], [0.5, -3.4, 0], j=0.4),
    "sai":        lambda: C([11, 4, 6], [7.5, 2.5, 0], 30, [-18, 9, 26], [1, 0.6, 0], j=0.5),
    "tres4_baixa": lambda: C([14, 0.4, 7], [7.5, 2.5, 0.5], 30, [12, 0.8, 8.5], [7.4, 2.6, 0.5], j=0.3),
}
M = dict(near=20, far=2e6)
MAPA = {
    "cratera_baixa": lambda: C([1400, 900, 2600], [0, 0, 0], 34, [700, 500, 1700], [0, 0, 0], **M, j=80),
    "cratera_cima":  lambda: C([300, 3200, 400], [0, 0, 0], 34, [-300, 2600, 500], [0, 0, 0], **M, j=80),
    "faixa_cima":    lambda: C([800, 17000, 6000], [0, 0, 0], 40, [-600, 15500, 5200], [0, 0, 0], **M, j=300),
    "oblq_alta":     lambda: C([-9000, 13500, 12500], [-3000, 0, -600], 38, [-6500, 11500, 11500], [-1800, 0, -500], **M, j=300),
    "oeste":         lambda: C([-30000, 11000, 9000], [-14000, 0, -3500], 40, [-20000, 9000, 9000], [-6000, 0, -1500], **M, j=400),
    "marca":         lambda: C([2600, 2400, 3400], [700, 600, -500], 34, [2000, 2000, 3000], [700, 500, -500], **M, j=80),
    "trecho":        lambda: C([-2000, 12000, 9000], [600, 2500, -2500], 38, [500, 10000, 9500], [600, 2500, -2500], **M, j=200),
    "vento":         lambda: C([5000, 6500, 7500], [800, 0, 200], 38, [3500, 5800, 7800], [600, 0, 300], **M, j=150),
    "orbita":        lambda: C([9000, 9000, -6000], [0, 0, 0], 40, [11000, 8500, 2000], [0, 0, 0], **M, j=200),
    "bairro":        lambda: C([-1350, 430, 1300], [150, 40, -80], 40, [-1150, 390, 1120], [170, 50, -80], **M, j=40),
}

def ceu(cam, clima="cruzeiro", alt=10700, speed=225, pitch=(0, 0), roll=(-4, 4), sink=0, rain=False, turb=None, **k):
    return {"fam": "ceu", "cam": CEU[cam](), "clima": clima, "alt": alt, "speed": speed, "sink": sink, "rain": rain,
            "pose": {"pitch": list(pitch), "roll": list(roll)}, "turb": turb or ([0.35, 0.25, 0.05] if clima == "cruzeiro" else [1.6, 1.1, 0.2]), **k}
def tor(cam, **k):
    k.setdefault("clima", "tormenta"); k.setdefault("rain", True); k.setdefault("alt", 6500)
    return ceu(cam, **k)
def est(cam, **k):
    return {"fam": "estudio", "cam": EST[cam](), "clima": "estudio", **k}
def mapa(cam, route=(1, 1), **k):
    if cam.startswith("cratera") or cam == "bairro": route = None   # sem o "cano" da trilha nos planos baixos
    return {"fam": "mapa", "cam": MAPA[cam](), "clima": "mapa", "route": list(route) if route else None, **k}
def alt(frm, rate=1.0, cam=None, **k):
    c = cam or [[17, 15, -10], [0, -1.2, 0], 40, [14, 12.5, -12], [0, -1.6, 0]]
    return {"fam": "altim", "cam": C(c[0], c[1], c[2], c[3], c[4], j=1.5), "clima": "tormenta", "alt": 3000, "speed": 160, "sink": 260, "rain": True,
            "pose": {"pitch": [55, 60], "roll": [58, 64]}, "turb": [1.8, 1.2, 0.22], "altim": {"from": frm, "rate": rate, **k.pop("ak", {})}, **k}
rot = lambda anc, txt, t=0.4, off=(140, -140), p=None: {"tipo": "rotulo", "anc": anc, "txt": txt, "t": t, "off": list(off), **({"p": p} if p else {})}
nota = lambda txt, t=0.4: {"tipo": "nota", "txt": txt, "t": t}
rel = lambda a, b, t=0.2: {"tipo": "relogio", "tt": [a, b], "t": t}
pre = lambda a, b, t=0.2: {"tipo": "pressao", "tt": [a, b], "t": t}
ABERTO = [{}, {}, {}]
def marcas(est_, t=0.2): return {"tipo": "marcas", "est": est_, "t": t}

# ---------------------------------------------------------------- uma entrada por frase (o que a imagem demonstra)
P = {
 "01_01": (tor("pequeno", alt=4000, pitch=(50, 55), roll=(55, 62), sink=150, ui=[{"tipo": "titulo", "txt": "¿POR QUÉ NO QUEDÓ CASI NADA DEL AVIÓN?", "t": 0.3}]), "o avião pequeno caindo na tempestade; relógio 12:49 e a pergunta do título no quadro"),
 "01_02": (tor("mergulho", alt=3000, pitch=(62, 72), roll=(60, 66), sink=280), "o mergulho quase vertical, de perto"),
 "01_03": (mapa("cratera_baixa"), "a câmera desce sobre o bairro até a cratera: o lugar do choque"),
 "01_04": (mapa("cratera_cima", ui=[rot("cratera", "CRÁTER", 0.5, (160, -120))]), "de cima: só a cratera, sem asas nem cauda"),
 "01_06": (mapa("bairro", ui=[nota("Un cráter lleno de agua", 0.3)]), "o bairro e a cratera na luz do dia"),
 "01_07": (est("prof_tras", raiox=0, cauda={"brilho": [0.3, 0.9]}, ui=[rot("profundor", "TIMÓN DE PROFUNDIDAD IZQUIERDO", 0.8)]), "a peça acende na cauda do avião"),
 "01_08": (mapa("faixa_cima", faixa=0.2, ui=[rot("faixa", "PEDAZOS: A 2–6 KM", 1.0, (-60, -170))]), "o anel de 2–6 km nasce em volta da cratera"),
 "01_09": (tor("baixo", alt=4500, pitch=(70, 76), roll=(60, 64), sink=200), "de baixo: o avião vertical contra as nuvens"),
 "01_10": (est("tres4_baixa", cauda={"brilho": [0, 0.2], "solta": 0.4}), "o profundor esquerdo se solta e fica para trás"),
 "02_01": (ceu("pequeno", ui=[marcas([{"hide": 1}] * 3)]), "o avião em cruzeiro, céu largo: as perguntas vão entrar"),
 "02_02": (ceu("lado", ui=[marcas([{"t": 0.2}, {"hide": 1}, {"hide": 1}])]), "1ª marca: o velocímetro"),
 "02_03": (ceu("tres4", ui=[marcas([{}, {"t": 0.2}, {"hide": 1}])]), "2ª marca: a cauda"),
 "02_04": (ceu("tras", ui=[marcas([{}, {}, {"t": 0.4}])]), "3ª marca: o relógio (quando se soltou)"),
 "02_05": (ceu("chase", ui=[marcas(ABERTO)]), "as três perguntas abertas sobre o voo"),
 "03_01": (est("chega"), "o Learjet chega ao estúdio creme"),
 "03_02": (est("lado_geral", arfOsc=1.2, ui=[rot("lj", "ALAS: LO SOSTIENEN", 0.3, (-60, -170), [-0.5, -0.6, 5.5]), rot("lj", "COLA: CONTRAPESO", 1.2, (80, -150), [7.8, 3.0, 0])]), "a balança: asas sustentam, cauda é o contrapeso; o avião balança"),
 "03_03": (est("cauda34", ui=[rot("lj", "ALETA VERTICAL", 0.6, (-220, 120), [6.0, 1.6, 0]), rot("estab", "ESTABILIZADOR", 1.6, (120, -150))]), "a cauda em T: deriva e, no topo, o estabilizador"),
 "03_04": (est("prof_tras", cauda={"prof": {"amp": 8, "f": 1.6}}, ui=[rot("profundor", "TIMÓN DE PROFUNDIDAD", 0.5)]), "o profundor atrás do estabilizador, com as 3 dobradiças"),
 "03_05": (est("raiox_entra", cauda={"raiox": [0, 1], "raioxDur": 2.0}), "a deriva vira raio-x: a câmera entra"),
 "03_06": (est("cabos", cauda={"raiox": 1, "prof": {"amp": 15, "f": 2.2}}, ui=[rot("lj", "CABLES", 0.4, (-200, 80), [6.9, 1.7, 0])]), "os cabos sobem e levantam o bordo de fuga"),
 "03_07": (est("lado_geral", arfagem=[0, 7], cauda={"prof": {"amp": 14, "f": 0.6}}), "a cauda baixa e o nariz sobe (o avião inteiro arfa)"),
 "03_09": (est("chega", arfOsc=3, cauda={"prof": {"amp": 12, "f": 2.6}}, ui=[nota("Cabeceo: el sube y baja del avión", 0.3)]), "o sobe-e-desce do avião junto com o profundor"),
 "03_10": (est("lado_trim", cauda={"raiox": 0.85, "incid": [6.5, 10], "fant": 1}, ui=[{"tipo": "angulo", "t": 0.3}]), "o estabilizador INTEIRO gira contra a linha neutra"),
 "03_12": (est("atuador", cauda={"raiox": 1, "incid": [6.5, 4.0], "giro": 6}, ui=[rot("pino", "PERNO", 0.3, (160, -120)), rot("atuador", "ACTUADOR DE HUSILLO", 1.6, (-220, -160)), rot("motor", "2 MOTORES ELÉCTRICOS", 2.8, (-240, 120))]), "pino atrás, fuso na frente e os 2 motores girando"),
 "03_13": (est("lado_trim", cauda={"raiox": 0.85, "incid": [4.0, 8.5], "fant": 1}, ui=[{"tipo": "angulo", "t": 0.2}]), "o giro de compensação, em graus"),
 "03_14": (est("sai", cauda={"incid": [8.5, 6.5]}), "o avião equilibrado; a câmera sai"),
 "04_01": (est("motores", cauda={"raiox": 1, "giro": 14}, ui=[rot("motor", "MOTOR PRIMARIO", 0.4, (180, 100))]), "o motor primário gira sozinho: o terceiro ator"),
 "04_02": (ceu("chase", pitch=(0, -4), ui=[nota("Cerca de la velocidad del sonido, el morro tiende a bajar", 0.5)]), "o nariz começa a cair sozinho"),
 "04_03": (ceu("lado", pitch=(-2, -6), ui=[rot("aviao", "MACH TUCK", 0.3, (120, -150), [-6, 0, 0])]), "o mergulho sozinho tem nome: Mach tuck"),
 "04_04": (est("lado_trim", cauda={"raiox": 0.85, "fant": 1, "mach": [0.66, 0.75], "machTrim": 1}, ui=[{"tipo": "gauge", "t": 0.2}, {"tipo": "angulo", "t": 0.4}]), "Mach passa de 0,70 e o estabilizador gira sozinho para N UP"),
 "04_05": (est("cauda34", cauda={"mach": [0.74, 0.77], "machTrim": 1, "giro": 8}, ui=[{"tipo": "gauge", "t": 0.2}]), "o mesmo sistema visto de 3/4"),
 "04_06": (est("lado_trim", cauda={"raiox": 0.85, "fant": 1, "mach": [0.72, 0.81], "machTrim": 1}, ui=[{"tipo": "gauge", "t": 0.1}, {"tipo": "angulo", "t": 0.1}]), "quanto mais rápido, mais o ponteiro e a peça andam"),
 "04_07": (est("cima_cauda", cauda={"mach": [0.78, 0.81], "machTrim": 1}, ui=[{"tipo": "gauge", "t": 0.1}, nota("Límite del fabricante: Mach 0,81", 0.6)]), "a régua encosta em 0,81 (Mmo)"),
 "04_08": (est("tres4_baixa", cauda={"mach": [0.70, 0.80], "incid": 6.5}, ui=[{"tipo": "gauge", "t": 0.1}, nota("Mach trim apagado: límite 0,77", 0.4)]), "Mach trim desligado: o ponteiro não anda e o limite cai para 0,77"),
 "04_09": (est("atuador", cauda={"raiox": 1, "giro": 4}, ui=[rot("atuador", "TORNILLO", 0.3, (-200, -150)), rot("motor", "MOTORES", 1.2, (-220, 120))]), "o fuso e os motores: o que a junta examina"),
 "05_01": (ceu("pequeno", ui=[rel(50, 56)]), "o voo em cruzeiro"),
 "05_02": (ceu("chase", ui=[rel(57.2, 62)]), "o relógio chega a 12:48"),
 "05_03": (tor("lado", alt=10700, speed=225, pitch=(0, 0), ui=[rel(62, 70)]), "a 35.000 pés, dentro da tempestade"),
 "05_04": (tor("nariz", alt=10600, speed=225, pitch=(0, 14), ui=[rel(73, 79)]), "o nariz começa a baixar"),
 "05_05": (tor("chase", alt=10000, speed=230, pitch=(14, 24), sink=40, ui=[rel(80, 86), nota("Mach 0,81: límite superado", 0.8)]), "o avião passa do limite de Mach"),
 "05_06": (tor("cima", alt=9000, pitch=(25, 32), roll=(20, 62), sink=80, ui=[rel(86, 96)]), "a curva à direita, cada vez mais inclinada"),
 "05_07": (tor("tres4", alt=8000, pitch=(32, 38), roll=(55, 60), sink=120, ui=[pre(96, 108)]), "a barra de pressão do ar presa ao avião"),
 "05_08": (tor("mergulho", alt=7000, pitch=(38, 44), roll=(58, 62), sink=150, ui=[pre(108, 116)]), "a pressão cresce com o quadrado da velocidade"),
 "05_09": (tor("tras", alt=6500, pitch=(44, 48), roll=(58, 62), sink=170, ui=[pre(116, 124)]), "dobro de velocidade, quatro vezes a força"),
 "05_10": (tor("lado", alt=6000, pitch=(48, 54), roll=(58, 62), sink=190, ui=[pre(124, 145)]), "≈570 nós equivalentes contra o limite"),
 "05_11": (tor("baixo", alt=4000, pitch=(55, 60), roll=(60, 62), sink=230, ui=[pre(144, 145)]), "limite: 300"),
 "05_12": (tor("pequeno", alt=3500, pitch=(58, 64), roll=(60, 64), sink=250, ui=[pre(145, 146.5)]), "quase 4× a pressão de certificação"),
 "06_01": (tor("rasante", alt=2500, pitch=(72, 78), roll=(60, 64), sink=280), "o avião chega ao solo (corta antes)"),
 "06_02": (tor("lado", alt=2400, speed=120, pitch=(70, 72), roll=(60, 62), sink=290, ui=[{"tipo": "vetores", "t": 0.3, "tR": 99}]), "duas setas: 290 m/s para baixo e 120 m/s para frente"),
 "06_03": (tor("tres4", alt=2200, speed=120, pitch=(72, 74), roll=(60, 62), sink=290, ui=[{"tipo": "vetores", "t": 0.1, "tR": 0.4}]), "as duas somam: 1.120 km/h"),
 "06_04": (tor("pequeno", alt=2000, speed=120, pitch=(74, 75), roll=(60, 62), sink=290, ui=[{"tipo": "vetores", "t": 0.1, "tR": 0.1, "tC": 0.3}]), "mais que um avião de linha em cruzeiro"),
 "06_05": (tor("baixo", alt=1500, speed=120, pitch=(80, 82), roll=(60, 62), sink=290), "quase vertical"),
 "06_06": (mapa("cratera_baixa", ui=[nota("A esa velocidad, el avión se fragmenta", 0.4)]), "a cratera: não sobram peças grandes"),
 "06_08": (mapa("cratera_cima", ui=[rot("cratera", "PEDAZOS PEQUEÑOS", 0.4, (160, -140))]), "o que está na cratera: pedaços pequenos"),
 "06_09": (mapa("bairro", ui=[nota("Desde el 4/11 sacan el agua · la grabadora de voz aún no aparece", 0.5)]), "a busca na cratera"),
 "06_10": (mapa("cratera_baixa", ui=[rot("cratera", "CASI NO HAY AVIÓN", 0.3, (-200, -150))]), "por isso as imagens quase não mostram avião"),
 "06_11": (mapa("oblq_alta", faixa=0.4, ui=[rot("faixa", "3 PEDAZOS DE LA COLA", 1.0, (-60, -170))]), "a pergunta 2: a faixa longe da cratera"),
 "07_01": (mapa("faixa_cima", faixa=True, ui=[rot("faixa", "2,1 – 6,1 KM DEL CRÁTER", 0.4, (-60, -170))]), "o achado: 3 pedaços na faixa de 2–6 km"),
 "07_02": (est("prof_tras", cauda={"brilho": [0.1, 0.6], "prof": {"amp": 16, "f": 2.2, "ate": 2.0}}), "sem essa peça não há como sair do mergulho"),
 "07_03": (est("cima_cauda", cauda={"brilho": [0, 0.1], "solta": 0.6}), "a essas velocidades, nem com ela"),
 "07_04": (tor("chase", alt=6500, pitch=(40, 46), roll=(58, 62), sink=170, ui=[nota("¿Causa o consecuencia?", 0.4)]), "causa ou consequência?"),
 "07_05": (tor("cima", alt=6000, pitch=(46, 50), roll=(58, 62), sink=180, ui=[nota("¿Arriba o abajo?", 0.2)]), "acima ou abaixo?"),
 "07_06": (alt(118, 1.0, ak={"soBaro": True}), "só a barométrica, como nos sites de rastreio"),
 "07_07": (alt(136.5, 1.1, cam=[[30, 20, -20], [0, 1, -9], 36, [26, 18, -23], [0, 1, -9]], ak={"soBaro": True}), "perto de 8.000 pés a linha fica plana"),
 "07_08": (alt(141, 1.0, cam=[[22, 6, -28], [0, 0, 0], 32, [18, 4, -30], [0, 0, 0]], ak={"soBaro": True}, ui=[nota("¿Nivelado?", 0.3)]), "parece um nivelamento"),
 "07_09": (est("prof_tras", cauda={"prof": {"amp": 16, "f": 3.0}, "brilho": [0.2, 0.6], "solta": 1.4}), "a hipótese: o puxão arranca a peça"),
 "07_10": (alt(124, 1.0, cam=[[10, 30, 10], [0, 0, 0], 34, [14, 26, 6], [0, 0, 0]], ak={"perfil": False}), "o dado cru: as duas altitudes aparecem"),
 "07_11": (alt(128, 1.0, cam=[[34, 8, 14], [0, 0, 0], 30, [30, 10, 18], [0, 0, 0]]), "barométrica (pressão) × GPS"),
 "07_12": (alt(135, 1.0, cam=[[-20, 12, -24], [0, 0, 0], 34, [-16, 10, -26], [0, 0, 0]]), "lado a lado"),
 "07_13": (alt(138.5, 1.0, cam=[[30, 20, -20], [0, 1, -9], 36, [27, 19, -22], [0, 1, -9]]), "12:49:23: a barométrica congela em 8.750"),
 "07_14": (alt(143, 0.8, cam=[[18, -14, -16], [0, 0, 0], 34, [14, -12, -20], [0, 0, 0]]), "e não se move mais"),
 "07_15": (alt(140.3, 1.6, cam=[[26, 16, 18], [0, 0, 0], 34, [22, 14, 22], [0, 0, 0]]), "nos mesmos 10 s a GPS cai de 9.475 a 325"),
 "07_16": (alt(148.6, 0.25, cam=[[40, 25, -10], [0, 0, 0], 30, [36, 22, -14], [0, 0, 0]]), "o avião não nivelou"),
 "07_17": (alt(149.4, 0.12, cam=[[12, 40, -8], [0, 0, 0], 32, [16, 36, -12], [0, 0, 0]]), "o que parou foi um número"),
 "08_01": (mapa("oblq_alta", faixa=True, marca=0.4), "segunda pista: o lugar"),
 "08_02": (mapa("marca", marca=0.1, ui=[rot("marca", "AQUÍ SE CONGELA: A 1,16 KM", 0.5, (140, -150))]), "o ponto de 1,16 km onde a barométrica congela"),
 "08_03": (mapa("faixa_cima", faixa=True, marca=0, ui=[rot("faixa", "PEDAZOS: 2,1 – 6,1 KM", 0.4, (-60, -170))]), "os pedaços estão mais longe"),
 "08_04": (mapa("oeste", route=(0.7, 1.0), faixa=True), "a trilha chega à faixa: quando passou por ali?"),
 "08_05": (mapa("orbita", faixa=True, trecho=0.4), "a trajetória sobre a faixa acende"),
 "08_06": (mapa("trecho", faixa=True, trecho=0, ui=[rot("trecho", "28.600 → 15.700 PIES (GPS)", 0.3, (160, -140))]), "só entre 28.000 e 16.000 pés"),
 "08_07": (tor("mergulho", alt=8500, pitch=(30, 36), roll=(50, 58), sink=110, ui=[pre(109, 132)]), "já acima do limite, a pressão sobe até 2×"),
 "08_08": (mapa("vento", faixa=True, ui=[{"tipo": "vento", "t": 0.3}]), "o vento baixo empurrava para a cratera"),
 "08_09": (mapa("orbita", faixa=True, marca=0, trecho=0, ui=[nota("¿Prueba eso que se soltó arriba? No.", 0.3)]), "isso não é prova"),
 "08_11": (est("cima_cauda", cauda={"solta": 0.0}, ui=[nota("Pieza plana: puede planear · posición de cada pedazo: no publicada", 0.6)]), "a peça plana pode planar; posições não publicadas"),
 "08_12": (alt(139, 1.2, cam=[[24, 10, 24], [0, 0, 0], 32, [20, 12, 26], [0, 0, 0]]), "a nivelação a 8.000 pés não aparece"),
 "09_01": (est("tres4_baixa", cauda={"brilho": [0.1, 0.6]}), "não seria a primeira vez"),
 "09_02": (est("alto", ui=[{"tipo": "reguas", "t": 0.3}]), "2006: Learjet 36 a 380 nós × Florida acima de 570"),
 "09_03": (est("prof_tras", cauda={"prof": {"amp": 10, "f": 2}}, ui=[nota("Learjet 36, 2006: perdió el timón derecho", 0.3)]), "perdeu o profundor direito"),
 "09_04": (est("cauda34", cauda={"incid": [6.5, 7]}, ui=[nota("El izquierdo quedó doblado · aterrizó", 0.2)]), "o esquerdo dobrou; pousou"),
 "09_06": (ceu("tres4", alt=6000, pitch=(-18, 0), roll=(30, 0)), "mais devagar e com altura: saiu do mergulho"),
 "09_07": (tor("chase", alt=6500, pitch=(44, 52), roll=(58, 62), sink=180, ui=[rel(125, 140)]), "na Flórida, dentro da tempestade, a velocidade só subiu"),
 "10_01": (ceu("pequeno", ui=[marcas(ABERTO, 0.1)]), "o que sabemos: as três marcas voltam"),
 "10_02": (est("chega", ui=[marcas([{"tag": "CONFIRMADO", "t": 0.4}, {"tag": "CONFIRMADO", "t": 1.2}, {}], 0.1)]), "confirmado: perda do profundor e chegada quase vertical"),
 "10_03": (mapa("trecho", faixa=True, marca=0, trecho=0, ui=[nota("Calculado con datos públicos: sin nivelación · franja cruzada sobre el límite", 0.4)]), "calculado: sem nivelação; faixa cruzada acima do limite"),
 "10_04": (tor("cima", alt=10000, pitch=(10, 20), sink=30, ui=[marcas([{}, {}, {"tag": "DESCONOCIDO", "t": 0.4}], 0.1)]), "desconhecido: por que começou o mergulho"),
 "10_05": (est("atuador", cauda={"raiox": 1, "giro": 2}, ui=[rot("profundor", "BISAGRAS", 0.3, (160, -140)), rot("atuador", "ACTUADOR", 1.0, (-220, -150))]), "o que vai responder: bisagras, atuador, gravador"),
 "10_06": (ceu("tras", ui=[marcas([{"tag": "RESPONDIDA", "t": 0.3}, {}, {}], 0.1)]), "pergunta 1 respondida: mais de 1.000 km/h"),
 "10_07": (mapa("faixa_cima", faixa=True, marca=0, ui=[nota("Informe preliminar: en unas cuatro semanas", 0.4)]), "pergunta 2: o informe preliminar"),
 "10_08": (ceu("chase", ui=[nota("El vuelo completo: nuestro primer video", 0.3)]), "o voo completo no vídeo 1"),
}

# frases curtas que juntam com a anterior (sem take próprio)
JUNTA = {"01_05", "03_08", "03_11", "06_07", "08_10", "09_05"}
SEGUNDA = {  # 2ª câmera para frases longas (> 7,5 s)
    "ceu": ["tres4", "cima", "tras", "baixo"], "estudio": ["cauda34", "tres4_baixa", "cima_cauda"], "mapa": ["orbita", "oblq_alta"], "altim": None,
}

bat = []
for f in F:
    fid = f["id"]
    if fid in JUNTA or fid not in P:
        if fid not in JUNTA: print("SEM_TAKE", fid)
        bat[-1]["t1"] = f["t1"]; bat[-1]["texto"] += " " + f["texto"]; continue
    take, dem = P[fid]
    bat.append({"id": fid, "texto": f["texto"], "t0": f["t0"], "t1": f["t1"], "demonstra": dem, **json.loads(json.dumps(take))})
# limites de vídeo: cada batida começa 0,15 s antes da fala (corte antecipa) e vai até o início da próxima
for i, b in enumerate(bat):
    b["v0"] = 0.0 if i == 0 else round(max(bat[i - 1]["t0"] + 0.5, b["t0"] - 0.15), 3)
for i, b in enumerate(bat):
    b["v1"] = bat[i + 1]["v0"] if i + 1 < len(bat) else round(b["t1"] + 2.5, 3)
# frases longas: segunda metade com outra câmera (mesma família, estado contínuo)
out = []
for b in bat:
    d = b["v1"] - b["v0"]
    if d > 7.5 and SEGUNDA.get(b["fam"]):
        meio = round(b["v0"] + d / 2, 3)
        a = dict(b); a["v1"] = meio
        c = json.loads(json.dumps(b)); c["id"] = b["id"] + "B"; c["v0"] = meio
        lib = {"ceu": CEU, "estudio": EST, "mapa": MAPA}[b["fam"]]
        nome = rnd.choice(SEGUNDA[b["fam"]]); c["cam"] = lib[nome]()
        c["demonstra"] = b["demonstra"] + " (2ª câmera)"
        # o estado não reinicia: o que é faixa [a,b] continua do meio
        out += [a, c]
    else:
        out.append(b)
for b in out:
    d = round(b["v1"] - b["v0"], 3)
    b["cam"] = [[0 if k == 0 else d, c] for k, (_, c) in enumerate(b["cam"])]
dur = out[-1]["v1"]
json.dump({"fps": 24, "dur": dur, "batidas": out}, open(f"{R}/cena/learjet_p4/plano.json", "w", encoding="utf-8"), ensure_ascii=False)
fams = {}
for b in out: fams[b["fam"]] = fams.get(b["fam"], 0) + b["v1"] - b["v0"]
print(len(out), "batidas ·", round(dur, 1), "s ·", {k: f"{v / dur:.0%}" for k, v in fams.items()})
print("plano máx", max(b["v1"] - b["v0"] for b in out), "mín", min(b["v1"] - b["v0"] for b in out))
