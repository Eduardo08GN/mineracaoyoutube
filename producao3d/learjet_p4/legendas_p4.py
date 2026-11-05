# P4: legendas ES (.srt) a partir das palavras alinhadas (roteiro/frases.json, tempo global). Diretiva de 04/11 (leitura do K16):
# legenda POR FRASE (quebra em fim de frase e, se precisar, em vírgula), >= 1,5 s na tela, <= 2 linhas de <= 42 caracteres,
# sem palavra órfã (bloco de 1–2 palavras junta com o vizinho). Números voltam a algarismos (por extenso só para a TTS).
import json, os, re
R = r"D:/reconstruccion/09_learjet_p4"
MIN_D, LINHA, MAXC = 1.5, 42, 80
F = json.load(open(f"{R}/roteiro/frases.json", encoding="utf-8"))
NUM = [("doce y cuarenta y nueve con veintitrés", "12:49:23"), ("doce y cuarenta y nueve", "12:49"), ("doce y cuarenta y ocho", "12:48"),
       ("treinta y cinco mil", "35.000"), ("ocho mil setecientos cincuenta", "8.750"), ("nueve mil quinientos", "9.500"), ("veintiocho mil", "28.000"),
       ("dieciséis mil", "16.000"), ("ocho mil", "8.000"), ("quinientos setenta", "570"), ("trescientos ochenta", "380"), ("trescientos", "300"),
       ("mil cien", "1.100"), ("dos mil seis", "2006"), ("cero coma setenta y siete", "0,77"), ("cero coma ochenta y uno", "0,81"), ("cero coma setenta", "0,70"),
       ("Learjet sesenta", "Learjet 60"), ("Learjet treinta y seis", "Learjet 36"), ("más de cien", "más de 100"), ("más de mil", "más de 1.000"),
       ("unas cuatro semanas", "unas 4 semanas"), ("diez segundos", "10 segundos"), ("ocho segundos", "8 segundos"), ("seis kilómetros", "6 kilómetros"),
       ("dos y seis", "2 y 6"), ("tres pedazos", "3 pedazos"), ("tres bisagras", "3 bisagras"), ("dos motores", "2 motores"), ("dos altitudes", "2 altitudes")]
tc = lambda s: "%02d:%02d:%02d,%03d" % (int(s // 3600), int(s % 3600 // 60), int(s % 60), int(round((s % 1) * 1000)) % 1000)

def duas(t):
    if len(t) <= LINHA: return t
    ws = t.split(); best = None
    for i in range(1, len(ws)):
        a, b = " ".join(ws[:i]), " ".join(ws[i:])
        if len(a) <= LINHA and len(b) <= LINHA and len(ws[i:]) > 1 and i > 1:
            sc = abs(len(a) - len(b)) - (8 if a.endswith(",") else 0)
            if best is None or sc < best[0]: best = (sc, a + "\n" + b)
    if best: return best[1]
    for i in range(1, len(ws)):   # sem par equilibrado: aceita qualquer corte que caiba
        a, b = " ".join(ws[:i]), " ".join(ws[i:])
        if len(a) <= LINHA and len(b) <= LINHA: return a + chr(10) + b
    return t

blocos = []
for f in F:
    ws = f["palavras"]; txt = " ".join(w["w"] for w in ws)
    if len(txt) <= MAXC: blocos.append(ws); continue
    # frase longa: corta nas vírgulas em pedaços <= 84 caracteres, sem deixar 1–2 palavras sozinhas
    cur = []
    for w in ws:
        cand = cur + [w]
        if len(" ".join(x["w"] for x in cand)) > MAXC and len(cur) > 2:
            # volta até a última vírgula do bloco atual, se houver
            k = max((i for i, x in enumerate(cur) if x["w"].endswith((",", ":", ";"))), default=-1)
            if 2 <= k < len(cur) - 2: blocos.append(cur[:k + 1]); cur = cur[k + 1:] + [w]
            else: blocos.append(cur); cur = [w]
        else: cur = cand
    if cur:
        if len(cur) <= 2 and blocos and len(blocos[-1]) > 5: cur = blocos[-1][-3:] + cur; blocos[-1] = blocos[-1][:-3]
        blocos.append(cur)
# bloco curto (< 1,5 s) junta com o seguinte se couber
j = []
for b in blocos:
    if j and ((j[-1][-1]["e"] - j[-1][0]["s"]) < MIN_D or len(j[-1]) <= 2) and len(" ".join(x["w"] for x in j[-1] + b)) <= MAXC and b[0]["s"] - j[-1][-1]["e"] < 0.8:
        j[-1] = j[-1] + b
    else: j.append(b)
# órfã (<= 2 palavras) que sobrou: junta com o bloco anterior se couber, senão com o seguinte
k = []
for b in j:
    if k and len(b) <= 2 and len(" ".join(x["w"] for x in k[-1] + b)) <= MAXC: k[-1] = k[-1] + b
    else: k.append(b)
j = []
for b in k:
    if j and len(j[-1]) <= 2 and len(" ".join(x["w"] for x in j[-1] + b)) <= MAXC: j[-1] = j[-1] + b
    else: j.append(b)
subs = []
for i, b in enumerate(j):
    a, e = b[0]["s"], b[-1]["e"]
    prox = j[i + 1][0]["s"] if i + 1 < len(j) else e + 2
    e = min(max(e + 0.8, a + MIN_D), prox - 0.08)
    t = " ".join(w["w"] for w in b)
    for de, para in NUM: t = re.sub(de, para, t, flags=re.I)
    subs.append((a, e, duas(t)))
os.makedirs(f"{R}/entrega", exist_ok=True)
with open(f"{R}/entrega/subtitulos_es.srt", "w", encoding="utf-8") as o:
    for i, (a, e, t) in enumerate(subs, 1): o.write(f"{i}\n{tc(a)} --> {tc(e)}\n{t}\n\n")
cps = [len(t.replace("\n", " ")) / (e - a) for a, e, t in subs]
print(len(subs), "legendas · >20 cps:", f"{100 * sum(c > 20 for c in cps) / len(cps):.1f}%", "· < 1,5 s:", sum((e - a) < 1.49 for a, e, _ in subs),
      "· linhas > 42:", sum(any(len(l) > 42 for l in t.split("\n")) for _, _, t in subs), "· órfãs:", sum(len(t.split()) <= 2 for _, _, t in subs))
