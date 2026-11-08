# Legendas ES (SRT) do video 08 pelas palavras alinhadas: blocos por frase, cortados em virgula/dois-pontos quando passam de
# 2 linhas de 42; numeros por extenso viram algarismos (a voz diz "doscientos dieciocho", a legenda mostra "218").
# Saida: entrega/legendas_es.srt. Uso: python ferramentas/legendas.py
import json, os, re
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rot = json.load(open(os.path.join(R, "roteiro", "roteiro.json"), encoding="utf-8"))["kapitel"]
ali = json.load(open(os.path.join(R, "voz", "alinhamento.json"), encoding="utf-8"))
U = {"cero": 0, "un": 1, "uno": 1, "una": 1, "dos": 2, "tres": 3, "cuatro": 4, "cinco": 5, "seis": 6, "siete": 7, "ocho": 8, "nueve": 9, "diez": 10, "once": 11, "doce": 12,
     "trece": 13, "catorce": 14, "quince": 15, "dieciséis": 16, "diecisiete": 17, "dieciocho": 18, "diecinueve": 19, "veinte": 20, "veintiún": 21, "veintiuno": 21, "veintidós": 22,
     "veintitrés": 23, "veinticuatro": 24, "veinticinco": 25, "veintiséis": 26, "veintisiete": 27, "veintiocho": 28, "veintinueve": 29, "treinta": 30, "cuarenta": 40,
     "cincuenta": 50, "sesenta": 60, "setenta": 70, "ochenta": 80, "noventa": 90, "cien": 100, "ciento": 100, "doscientos": 200, "trescientos": 300, "cuatrocientos": 400,
     "quinientos": 500, "seiscientos": 600, "setecientos": 700, "ochocientos": 800, "novecientos": 900}
def numeros(txt):
    # troca sequencias de palavras-numero ("dos mil doscientos cuarenta") por algarismos com ponto de milhar
    ws = txt.split(" "); out = []; i = 0
    while i < len(ws):
        j, tot, cur, ok = i, 0, 0, False
        while j < len(ws):
            w = re.sub(r"[^\wáéíóúñ]", "", ws[j].lower())
            if w in U: cur += U[w]; ok = True
            elif w == "mil" and ok or (w == "mil" and j == i): cur = max(1, cur) * 1000; tot += cur; cur = 0; ok = True
            elif w == "y" and ok and j + 1 < len(ws) and re.sub(r"[^\wáéíóúñ]", "", ws[j + 1].lower()) in U: pass
            else: break
            j += 1
        v = tot + cur
        if ok and v >= 10 and j > i:
            fim = re.sub(r"^[\wáéíóúñ]+", "", ws[j - 1]); out.append(f"{v:,}".replace(",", ".") + fim); i = j
        else: out.append(ws[i]); i += 1
    return " ".join(out)
def ts(s): h, s = divmod(s, 3600); m, s = divmod(s, 60); return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s % 1) * 1000)):03d}"
norm = lambda s: re.sub(r"[^a-záéíóúüñ0-9]", "", s.lower())
blocos, t0 = [], 0.6
for c in rot:
    ws = ali[c["id"]]["palavras"]; i = 0
    for f in [x.strip() for x in re.split(r"(?<=[.?!])\s+|\n", c["text"]) if x.strip()]:
        pal = [x for x in f.split() if norm(x)]; n = len(pal); seg = ws[i:i + n]; i += n
        # partes: corta em , : ; quando a frase passa de 84 caracteres
        partes, atual = [], []
        for k, p in enumerate(pal):
            atual.append(k)
            if (p.endswith((",", ":", ";")) and len(" ".join(pal[atual[0]:k + 1])) > 30) or k == n - 1: partes.append(atual); atual = []
        juntas = []
        for p in partes:
            if juntas and len(" ".join(pal[juntas[-1][0]:p[-1] + 1])) <= 84: juntas[-1] = juntas[-1] + p
            else: juntas.append(p)
        def corta(p):   # bloco longo demais sem pontuacao: divide no meio por palavras
            if len(" ".join(pal[p[0]:p[-1] + 1])) <= 80 or len(p) < 4: return [p]
            m = len(p) // 2; return corta(p[:m]) + corta(p[m:])
        juntas = [q for p in juntas for q in corta(p)]
        for p in juntas:
            txt = numeros(" ".join(pal[p[0]:p[-1] + 1]).replace(" por ciento", " %").replace("por ciento", "%")); a = t0 + seg[p[0]]["s"]; b = t0 + seg[p[-1]]["e"]
            if len(txt) > 42:   # duas linhas equilibradas
                ps = txt.split(" "); melhor = min(range(1, len(ps)), key=lambda k: abs(len(" ".join(ps[:k])) - len(" ".join(ps[k:]))))
                txt = " ".join(ps[:melhor]) + "\n" + " ".join(ps[melhor:])
            blocos.append([a, max(b, a + 1.2), txt])
    t0 += ali[c["id"]]["dur"] + 0.7
for k in range(len(blocos) - 1): blocos[k][1] = min(blocos[k][1] + 0.25, blocos[k + 1][0] - 0.05)
os.makedirs(os.path.join(R, "entrega"), exist_ok=True)
with open(os.path.join(R, "entrega", "legendas_es.srt"), "w", encoding="utf-8") as f:
    for k, (a, b, txt) in enumerate(blocos, 1): f.write(f"{k}\n{ts(a)} --> {ts(b)}\n{txt}\n\n")
longas = [b for b in blocos if any(len(l) > 42 for l in b[2].split("\n"))]
print("blocos", len(blocos), "| linhas > 42:", len(longas), "| ex.:", blocos[30][2].replace("\n", " / "), "|", blocos[60][2].replace("\n", " / "))
