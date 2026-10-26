# Tracer3D 2.0: gera v1/src/plano.json (e v1/src/cenas/*.json com as cenas do kit) a partir das batidas ANCORADAS em palavras (roteiro/batidas.json), feitas depois do
# alinhamento: cada batida comeca exatamente no inicio da palavra falada (wort + nr = ocorrencia no capitulo).
import json, os, subprocess
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS, RESPIRO, CAUDA = 30, 0.8, 4.0
caps = json.load(open(f"{R}/roteiro/skript_de.json", encoding="utf-8"))["kapitel"]
# alinhamento real (G4) ou provisorio (planejar antes da G4); batidas podem vir em varios arquivos (planejadores em paralelo)
import glob
ALI = f"{R}/voz/alinhamento.json" if os.path.exists(f"{R}/voz/alinhamento.json") else f"{R}/voz/alinhamento_provisorio.json"
ali = json.load(open(ALI, encoding="utf-8")); PROV = ALI.endswith("provisorio.json")
bat = {}
for fb in sorted(glob.glob(f"{R}/roteiro/batidas*.json")): bat.update(json.load(open(fb, encoding="utf-8"))["kapitel"])
dur = lambda f: float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], capture_output=True, text=True).stdout)
t, kap, beats, woerter, erros, cenas = 0.0, [], [], {}, [], {}
for c in caps:
    k = c["id"]
    if k not in bat:   # outro planejador ainda nao entregou este capitulo: uma batida provisoria, sem travar os demais
        bat[k] = [{"wort": c["text"].split()[0], "nr": 1, "dono": "pendente", "bild": "capitulo ainda sem plano"}]
    d = dur(f"{R}/voz/{k}.wav") if os.path.exists(f"{R}/voz/{k}.wav") else ali[k]["dur"]
    kap.append({"id": k, "s": round(t, 3), "e": round(t + d, 3), "titel": c["titel"]})
    ws = ali[k]["palavras"]
    woerter[k] = [{"w": w["w"], "s": round(t + w["s"], 3), "e": round(t + w["e"], 3)} for w in ws]
    for i, b in enumerate(bat[k]):
        hits = [w for w in ws if w["w"] == b["wort"]]
        if len(hits) < b["nr"]: erros.append(f"{k} batida {i + 1}: palavra {b['wort']!r} nr {b['nr']} nao existe"); continue
        s = t if i == 0 else t + hits[b["nr"] - 1]["s"]
        # 2.0: dono = familia do kit (ui/karten/welt) quando a batida traz "cena" {comp, props}; senao o agente da cena inedita
        bid = f"{k[:2]}_{i + 1:02d}"
        if b.get("cena"): cenas.setdefault(b["dono"], {})[bid] = b["cena"]
        beats.append({"id": bid, "kap": k, "n": i + 1, "s": round(s, 3), "e": None, "dono": b["dono"], "bild": b.get("bild", ""), "wort": b["wort"],
                      # video 6: contador de efetivos (src/zaehler.tsx) - data da batida, 'lauf' = data corre ate a proxima, 'zaehler': false = esconde
                      **{x: b[x] for x in ("datum", "lauf", "zaehler") if x in b}})
    t += d + RESPIRO
if erros: raise SystemExit("ERROS:\n" + "\n".join(erros))
dauer = round(t - RESPIRO + CAUDA, 3)
for i, b in enumerate(beats): b["e"] = beats[i + 1]["s"] if i + 1 < len(beats) else dauer
ruins = [(b["id"], round(b["e"] - b["s"], 2)) for b in beats if b["e"] - b["s"] < 1.5 or b["e"] - b["s"] > 12]
json.dump({"dauer": dauer, "fps": FPS, "kapitel": kap, "beats": beats, "woerter": woerter},
          open(f"{R}/v1/src/plano.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
for fam in ("ui", "karten", "welt"):
    # _vorlagen (modelos reutilizaveis) ficam em roteiro/vorlagen_<fam>.json, se o planejador criar
    extra = {}
    for vf in sorted(glob.glob(f"{R}/roteiro/vorlagen_{fam}*.json")):
        for kk, vv in json.load(open(vf, encoding="utf-8")).items():
            if isinstance(vv, dict) and isinstance(extra.get(kk), dict): extra[kk] = {**extra[kk], **vv}   # _vorlagen de varios planejadores
            else: extra[kk] = vv
    json.dump({**extra, **cenas.get(fam, {})}, open(f"{R}/v1/src/cenas/{fam}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
from collections import Counter
print("ALINHAMENTO PROVISORIO" if PROV else "alinhamento real", "| dauer", dauer, "beats", len(beats), dict(Counter(b["dono"] for b in beats)), "fora de 1,5-12 s:", ruins, "| cenas do kit:", {f: len(v) for f, v in cenas.items()})

# dinamismo (24/10/2026, V3 ficou menos dinamica que a Bertha): <= 40% ui, <= 2 cartoes seguidos
ui = [b["dono"] == "ui" for b in beats]; seq = mx = 0
for u in ui: seq = seq + 1 if u else 0; mx = max(mx, seq)
pct = 100 * sum(ui) / max(1, len(ui))
print(f"DINAMISMO: {pct:.0f}% cartoes ui (max 40%), maior sequencia de cartoes {mx} (max 2)" + ("  <-- AJUSTAR" if pct > 40 or mx > 2 else "  ok"))
