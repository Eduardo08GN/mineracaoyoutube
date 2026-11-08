# Legendas DE (.srt) do K16 a partir das palavras alinhadas (roteiro/frases.json, tempo global), regras do §9 da auditoria:
# <= 17 caracteres/s, >= 1,2 s na tela, <= 2 linhas de <= 42 caracteres; quebra em fim de frase/vírgula; o fim de cada
# legenda vai até a pausa seguinte (até 0,08 s antes da próxima). Uso: python -I legendas_k16.py
import json, os
R = r"D:/kriegschronik/k16_seekrieg"
CPS, MIN_D, LINHA, MAXC = 17.0, 1.2, 42, 84
F = json.load(open(f"{R}/roteiro/frases.json", encoding="utf-8"))
# na legenda os números voltam a algarismos (por extenso só para a TTS)
NUM = {"achtzehnhundertsiebzig": "1870", "achtzehnhundertvierundsechzig": "1864", "achtzehnhunderteinundsiebzig": "1871", "achtzehnhundertdreiundsiebzig": "1873",
       "neunundvierzig": "49", "sechzehntausend": "16.000", "zehntausend": "10.000", "sechsundfünfzigtausend": "56.000", "hundertsiebzig": "170",
       "sechshundert": "600", "dreihundertfünfzig": "350", "siebentausend": "7.000", "vierundzwanzig": "24", "achtzig": "80", "hundertdreißig": "130",
       "viereinhalb": "4,5", "vierzehn": "14", "zehnmal": "10-mal", "fünfmal": "5-mal", "fünfzehn": "15", "vierzig-": "40-", "fünfzigtausend": "50.000",
       "Elfter": "11.", "zweiundzwanzigsten": "22.", "vierzehnten": "14.", "vierundzwanzigsten": "24.", "sechzehnten": "16.", "zweiten": "2.",
       "neunten": "9.", "achtundzwanzigsten": "28.", "dreiundachtzig": "83"}
def num(w):
    core = w.rstrip(",.:;!?"); tail = w[len(core):]
    return NUM.get(core, core) + tail
for f in F:
    for w in f["palavras"]: w["w"] = num(w["w"])
tc = lambda s: "%02d:%02d:%02d,%03d" % (int(s // 3600), int(s % 3600 // 60), int(s % 60), int(round((s % 1) * 1000)) % 1000)

def duas(t):
    if len(t) <= LINHA: return t
    ws = t.split(); best = None
    for i in range(1, len(ws)):
        a, b = " ".join(ws[:i]), " ".join(ws[i:])
        if len(a) <= LINHA and len(b) <= LINHA:
            sc = abs(len(a) - len(b)) - (8 if a.endswith(",") else 0)
            if best is None or sc < best[0]: best = (sc, a + "\n" + b)
    return best[1] if best else t

blocos = []
for f in F:
    ws = f["palavras"]; cur = []
    for w in ws:
        cand = cur + [w]; txt = " ".join(x["w"] for x in cand)
        dur = cand[-1]["e"] - cand[0]["s"]
        if cur and (len(txt) > MAXC or (dur >= MIN_D and len(txt) / dur > CPS + 1.5 and len(" ".join(x["w"] for x in cur)) > 20)):
            blocos.append(cur); cur = [w]
        else:
            cur = cand
            if w["w"].endswith(",") and len(txt) > 34: blocos.append(cur); cur = []
    if cur: blocos.append(cur)
# bloco curto (< 1,2 s) junta com o seguinte se couber
j = []
for b in blocos:
    if j and (j[-1][-1]["e"] - j[-1][0]["s"]) < MIN_D and len(" ".join(x["w"] for x in j[-1] + b)) <= MAXC and b[0]["s"] - j[-1][-1]["e"] < 0.6:
        j[-1] = j[-1] + b
    else: j.append(b)
blocos = j
subs = []
for i, b in enumerate(blocos):
    a, e = b[0]["s"], b[-1]["e"]
    prox = blocos[i + 1][0]["s"] if i + 1 < len(blocos) else e + 2
    e = min(max(e + 1.2, a + MIN_D), prox - 0.08)   # fica na tela durante a pausa seguinte (até 1,2 s), sem encostar na próxima
    subs.append((a, e, duas(" ".join(w["w"] for w in b))))
os.makedirs(f"{R}/entrega", exist_ok=True)
with open(f"{R}/entrega/untertitel_de.srt", "w", encoding="utf-8") as o:
    for i, (a, e, t) in enumerate(subs, 1): o.write(f"{i}\n{tc(a)} --> {tc(e)}\n{t}\n\n")
cps = [len(t.replace("\n", " ")) / (e - a) for a, e, t in subs]
print(len(subs), "legendas · acima de 17 cps:", f"{100 * sum(c > 17 for c in cps) / len(cps):.1f}%", "· abaixo de 1,2 s:", sum((e - a) < 1.2 for a, e, _ in subs),
      "· linhas > 42:", sum(any(len(l) > 42 for l in t.split("\n")) for _, _, t in subs))
