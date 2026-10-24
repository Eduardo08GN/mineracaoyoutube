# Legendas DE (.srt) a partir das palavras alinhadas do plano: blocos de ate 2 linhas x 42 caracteres, quebra em fim de frase.
import json, os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = json.load(open(f"{R}/v1/src/plano.json", encoding="utf-8"))
def tc(s): h, r = divmod(s, 3600); m, r = divmod(r, 60); return f"{int(h):02d}:{int(m):02d}:{int(r):02d},{int(round((r % 1) * 1000)):03d}"
blocos = []
for k in P["kapitel"]:
    cur = []
    for w in P["woerter"][k["id"]]:
        cur.append(w)
        txt = " ".join(x["w"] for x in cur)
        if len(txt) >= 70 or w["w"][-1] in ".?!" or (w["w"][-1] in ",:;" and len(txt) > 45):
            blocos.append(cur); cur = []
    if cur: blocos.append(cur)
out = []
for i, b in enumerate(blocos, 1):
    txt = " ".join(x["w"] for x in b)
    if len(txt) > 42:   # quebra em 2 linhas no espaco mais proximo do meio
        meio = len(txt) // 2; c = min((j for j, ch in enumerate(txt) if ch == " "), key=lambda j: abs(j - meio)); txt = txt[:c] + "\n" + txt[c + 1:]
    fim = min(b[-1]["e"] + 0.4, blocos[i][0]["s"] if i < len(blocos) else b[-1]["e"] + 0.4)
    out.append(f"{i}\n{tc(b[0]['s'])} --> {tc(fim)}\n{txt}\n")
open(f"{R}/entrega/untertitel_de.srt", "w", encoding="utf-8").write("\n".join(out))
print(len(out), "legendas")
