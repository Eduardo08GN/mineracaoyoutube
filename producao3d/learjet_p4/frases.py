# P4: corta a narração em frases com tempo global (alinhamento palavra a palavra + duração de cada wav + pausa entre capítulos).
# Saída: roteiro/frases.json = [{id, cap, i, texto, t0, t1, palavras:[{w, s, e}]}] com tempos no relógio do vídeo final.
import json, os, re
R = r"D:/reconstruccion/09_learjet_p4"
PAUSA = 0.45   # s de silêncio entre capítulos na montagem da voz
caps = json.load(open(f"{R}/roteiro/skript_de.json", encoding="utf-8"))["kapitel"]
al = json.load(open(f"{R}/voz/alinhamento.json", encoding="utf-8"))
norm = lambda w: re.sub(r"[^a-záéíóúüñ0-9]", "", w.lower())
out, off = [], 0.0
for c in caps:
    a = al[c["id"]]; ws = a["palavras"]
    frases = [f.strip() for f in re.split(r"(?<=[.!?])\s+", c["text"]) if f.strip()]
    k = 0
    for i, f in enumerate(frases):
        n = len(f.split()); bloco = ws[k:k + n]; k += n
        if not bloco: continue
        out.append({"id": f"{c['id'][:3].rstrip('_')}_{i + 1:02d}", "cap": c["id"], "i": i, "texto": f,
                    "t0": round(off + bloco[0]["s"], 2), "t1": round(off + bloco[-1]["e"], 2),
                    "palavras": [{"w": w["w"], "s": round(off + w["s"], 3), "e": round(off + w["e"], 3)} for w in bloco]})
    if k != len(ws): print("AVISO contagem", c["id"], "texto", k, "alinhadas", len(ws))
    off += a["dur"] + PAUSA
json.dump(out, open(f"{R}/roteiro/frases.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(len(out), "frases ·", round(off, 1), "s")
for f in out: print(f"{f['id']:<8} {f['t0']:7.2f}-{f['t1']:7.2f} ({f['t1'] - f['t0']:4.1f}s) {f['texto'][:90]}")
