"""Descricao CURTA do YouTube (regra do Eduardo/socio, 31/10/2026): 4 linhas com as palavras-chave do video + capitulos +
1 linha so com as licencas que EXIGEM credito (CC BY, ODbL, Copernicus) + 3-5 hashtags. Nada de lista de fontes, links de
imagens nem paragrafos longos. Meta <= 1.500 caracteres (o YouTube corta em 5.000).
    python descricao_curta.py <pasta_do_video> <config.json>
config.json: {"titel": [3 titulos], "zeilen": [4 linhas], "lizenz": "1 linha", "hashtags": "...", "tags": "..."}
Os capitulos vem do plano.json (tempos reais) + skript_de.json (nomes). Saida: <pasta>/entrega/titulo_e_descricao.txt"""
import json, os, sys

R, CFG = sys.argv[1], json.load(open(sys.argv[2], encoding="utf-8"))
P = json.load(open(os.path.join(R, "v1/src/plano.json"), encoding="utf-8"))
SK = {k["id"]: k["titel"] for k in json.load(open(os.path.join(R, "roteiro/skript_de.json"), encoding="utf-8"))["kapitel"]}


def mmss(s): s = int(s); return f"{s // 60}:{s % 60:02d}"


assert len(CFG["titel"]) == 3 and len(CFG["zeilen"]) == 4, "3 titulos e 4 linhas"
KAP = CFG.get("kapitel_rotulo", "KAPITEL")   # ES: "CAPÍTULOS"
desc = "\n".join(CFG["zeilen"]) + f"\n\n{KAP}\n" +"\n".join(f"{mmss(k['s'])} {SK.get(k['id'], k['id'])}" for k in P["kapitel"])
desc += "\n\n" + CFG["lizenz"] + "\n\n" + CFG["hashtags"]
o = []
for i, t in enumerate(CFG["titel"], 1):
    assert len(t) <= 100, f"titulo {i} com {len(t)} caracteres (> 100)"
    o += [f"TITEL {i} (A/B, mit Miniatur titulo{i}_thumb{i}.jpg)", t, ""]
o += ["BESCHREIBUNG (alles bis zur Linie kopieren)", desc, "-" * 40, "", "TAGS (Feld „Tags“ in YouTube Studio)", CFG["tags"]]
open(os.path.join(R, "entrega", "titulo_e_descricao.txt"), "w", encoding="utf-8").write("\n".join(o) + "\n")
print(f"ok: descricao {len(desc)} caracteres (max 5.000), tags {len(CFG['tags'])} (max 500)")
assert len(desc) <= 5000 and len(CFG["tags"]) <= 500
