# Plano de batidas do video 08: frase -> batida (take proprio), tempos da narracao alinhada, nivel do mar L(t) amarrado
# as palavras (quando a voz diz "doscientos dieciocho metros", o contador esta em 218) e familia/cena de cada batida.
# Saida: v1/src/plano.json (lido pela composicao). Uso: python ferramentas/plano.py
import json, math, os, re
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rot = json.load(open(os.path.join(R, "roteiro", "roteiro.json"), encoding="utf-8"))["kapitel"]
ali = json.load(open(os.path.join(R, "voz", "alinhamento.json"), encoding="utf-8"))
INICIO, PAUSA, CAUDA = 0.6, 0.7, 3.0
# ancoras: (capitulo, trecho do texto, nivel em m). O nivel vale no FIM da ultima palavra do trecho.
ANC = [("01_gancho", "El mar empieza a subir", 0.3), ("01_gancho", "Un metro", 1), ("01_gancho", "Dos", 2), ("01_gancho", "Tres", 3), ("01_gancho", "montaña más alta", 4),
       ("02_orilla", "A cinco metros", 5), ("02_orilla", "A diez metros", 10), ("02_orilla", "Y a treinta", 28), ("02_orilla", "mar en la avenida", 29.5),
       ("03_plata", "A treinta metros cae Buenos Aires", 30), ("03_plata", "Diez metros más, y cae Montevideo", 41), ("03_plata", "Cincuenta metros", 50),
       ("04_hielo", "Setenta metros.", 70), ("04_hielo", "Lo que sigue es imaginación", 71), ("04_hielo", "el mar sigue subiendo", 80),
       ("05_primeros", "Doscientos dieciocho metros", 218), ("05_primeros", "Catorce metros después, cae Cuba", 232), ("05_primeros", "es océano", 300),
       ("05_primeros", "A seiscientos dieciocho metros cae Paraguay", 618), ("05_primeros", "ochocientos noventa y siete", 897),
       ("06_mil", "Mil metros", 1000), ("06_mil", "Nicaragua y Panamá caen", 1147), ("06_mil", "mil doscientos cuarenta y ocho", 1248),
       ("06_mil", "mil trescientos treinta y cinco metros cae Argentina", 1335), ("06_mil", "Guarda esa pregunta", 1345), ("06_mil", "Cuarenta metros después, Haití", 1378),
       ("07_altos", "mil quinientos ochenta y uno", 1581), ("07_altos", "mil setecientos treinta y nueve", 1739), ("07_altos", "mil ochocientos siete", 1807),
       ("07_altos", "dos mil doscientos cuarenta", 2240), ("07_altos", "dos mil doscientos ochenta metros", 2280), ("07_altos", "vuelve a haber agua", 2300),
       ("08_tres", "dos mil quinientos ochenta", 2580), ("08_tres", "dos mil setecientos cuarenta y cinco", 2745), ("08_tres", "dos mil novecientos tres", 2903),
       ("08_tres", "dos mil novecientos cincuenta", 2950), ("08_tres", "A tres mil metros", 3000),
       ("09_eureka", "viven en el cielo", 3060),
       ("10_final", "tres mil trescientos treinta y ocho", 3338), ("10_final", "se hunde poco después", 3403), ("10_final", "el mismo lago", 3560),
       ("10_final", "cañón de La Paz", 3700), ("10_final", "tres mil ochocientos cincuenta y un metros", 3851), ("10_final", "El Alto, Potosí", 4060),
       ("10_final", "cuatro mil ciento cuarenta y nueve metros", 4149), ("10_final", "setenta y dos metros", 4221),
       ("11_cima", "el agua no se detiene", 4400), ("11_cima", "A cinco mil cien metros", 5100), ("11_cima", "Ya no queda nadie", 5300),
       ("11_cima", "seis mil novecientos sesenta y un metros", 6961), ("12_real", "Te leo en los comentarios", 6961)]
# direcao: (capitulo, indices de frase, familia, parametros). Frases nao listadas herdam a batida anterior do capitulo.
DIR = {
 "01_gancho": [([0, 1, 2, 3, 4], "salinas", {"cam": "malecon"}), ([5], "cont", {"reg": "latam", "mov": "push"}), ([6], "cont", {"reg": "latam_paises", "mov": "orbita"}),
               ([7], "cont", {"reg": "andes_sul", "mov": "dolly"}), ([8], "cont", {"reg": "aconcagua", "mov": "revela"})],
 "02_orilla": [([0], "cont", {"reg": "yucatan", "mov": "rasante"}), ([1], "salinas", {"cam": "praia"}), ([2], "cont", {"reg": "caribe", "mov": "dolly"}),
               ([3], "cont", {"reg": "caribe_sul", "mov": "travelling"}), ([4], "cont", {"reg": "rio", "mov": "push"})],
 "03_plata": [([0], "bsas", {"cam": "obelisco"}), ([1], "cont", {"reg": "montevideo", "mov": "dolly"}), ([2, 3], "cont", {"reg": "plata_parana", "mov": "travelling"}),
              ([4], "cont", {"reg": "cone_sul", "mov": "pull"})],
 "04_hielo": [([0, 1], "bsas", {"cam": "obelisco_topo"}), ([2, 3], "cont", {"reg": "latam", "mov": "orbita"}), ([4], "cont", {"reg": "brasil_costa", "mov": "dolly"}),
              ([5, 6, 7], "eureka_gelo", {"fase": "puxa"}), ([8, 9], "eureka_gelo", {"fase": "solta"}), ([10], "eureka_gelo", {"fase": "vai"}),
              ([11, 12, 13], "cont", {"reg": "latam_alto", "mov": "pull"})],
 "05_primeros": [([0, 1], "cont", {"reg": "uruguai", "mov": "dolly"}), ([2, 3], "cont", {"reg": "uruguai_perto", "mov": "orbita"}), ([4, 5], "cont", {"reg": "rivera", "mov": "rasante"}),
                 ([6], "cont", {"reg": "cuba", "mov": "travelling"}), ([7], "cont", {"reg": "amazonas", "mov": "pull"}), ([8], "cont", {"reg": "latam", "mov": "orbita"}),
                 ([9], "cont", {"reg": "paraguai", "mov": "dolly"}), ([10], "cont", {"reg": "hispaniola", "mov": "travelling"})],
 "06_mil": [([0, 1], "cont", {"reg": "latam_alto", "mov": "push"}), ([2], "cont", {"reg": "america_central", "mov": "travelling"}), ([3], "cont", {"reg": "brasilia", "mov": "dolly"}),
            ([4, 5], "cont", {"reg": "argentina", "mov": "pull"}), ([6], "cont", {"reg": "aconcagua", "mov": "orbita"}), ([7, 8], "cont", {"reg": "aconcagua_perto", "mov": "push"}),
            ([9], "cont", {"reg": "haiti", "mov": "dolly"})],
 "07_altos": [([0], "cont", {"reg": "venezuela", "mov": "travelling"}), ([1, 2], "cont", {"reg": "america_central", "mov": "dolly"}), ([3, 4], "cont", {"reg": "atacama", "mov": "rasante"}),
              ([5], "cdmx", {"cam": "zocalo"}), ([6], "cdmx", {"cam": "lago"})],
 "08_tres": [([0], "cont", {"reg": "bogota", "mov": "push"}), ([1], "cont", {"reg": "tres", "mov": "pull"}), ([2], "cont", {"reg": "toluca", "mov": "orbita"}),
             ([3], "cont", {"reg": "colombia_andes", "mov": "travelling"}), ([4], "cont", {"reg": "guatemala", "mov": "dolly"}), ([5, 6], "cont", {"reg": "andes", "mov": "pull"})],
 "09_eureka": [([0], "cont", {"reg": "aconcagua_ilha", "mov": "orbita"}), ([1, 2], "cont", {"reg": "andes_pessoas", "mov": "dolly"}), ([3, 4], "eureka_ar", {"fase": "corte"}),
               ([5, 6], "eureka_ar", {"fase": "sobe"}), ([7], "eureka_ar", {"fase": "guayaquil"}), ([8, 9], "eureka_ar", {"fase": "quito"}),
               ([10], "eureka_ar", {"fase": "tiwanaku"}), ([11], "eureka_ar", {"fase": "cielo"})],
 "10_final": [([0], "cont", {"reg": "quito", "mov": "push"}), ([1], "cont", {"reg": "cusco", "mov": "dolly"}), ([2, 3, 4], "cont", {"reg": "altiplano", "mov": "orbita"}),
              ([5], "lapaz", {"cam": "canion"}), ([6], "cont", {"reg": "titicaca", "mov": "rasante"}), ([7], "lapaz", {"cam": "elalto"}),
              ([8], "cont", {"reg": "bolivia", "mov": "pull"}), ([9, 10], "cont", {"reg": "cerro_pasco", "mov": "dolly"}), ([11], "cont", {"reg": "peru", "mov": "orbita"})],
 "11_cima": [([0], "cont", {"reg": "puna", "mov": "travelling"}), ([1, 2], "cont", {"reg": "rinconada", "mov": "push"}), ([3, 4], "cont", {"reg": "andes_ilhas", "mov": "dolly"}),
             ([5], "cont", {"reg": "aconcagua_cume", "mov": "orbita"}), ([6, 7], "cont", {"reg": "aconcagua_ilha", "mov": "pull"})],
 "12_real": [([0], "cont", {"reg": "oceano", "mov": "pull"}), ([1, 2], "real", {"fase": "cartao"}), ([3, 4], "real", {"fase": "pergunta"})],
}
frases_de = lambda t: [x.strip() for x in re.split(r"(?<=[.?!])\s+|\n", t) if x.strip()]
norm = lambda s: re.sub(r"[^a-záéíóúüñ0-9]", "", s.lower())

beats, anc_t, t0, legendas = [], [], INICIO, []
for c in rot:
    ws = ali[c["id"]]["palavras"]; nw = [norm(w["w"]) for w in ws]
    fr = frases_de(c["text"]); i = 0; spans = []
    for f in fr:                                   # palavras de cada frase em ordem
        n = len([x for x in f.split() if norm(x)]); spans.append((t0 + ws[i]["s"], t0 + ws[min(len(ws) - 1, i + n - 1)]["e"], f)); i += n
    for k, (a, b, f) in enumerate(spans): legendas.append({"ini": round(a, 3), "fim": round(b, 3), "texto": f})
    for cap, trecho, m in ANC:                     # ancoras: fim da ultima palavra do trecho
        if cap != c["id"]: continue
        alvo = [norm(x) for x in trecho.split() if norm(x)]
        for j in range(len(nw) - len(alvo) + 1):
            if nw[j:j + len(alvo)] == alvo: anc_t.append((t0 + ws[j + len(alvo) - 1]["e"], m)); break
        else: raise SystemExit(f"ANCORA_NAO_ACHADA {cap}: {trecho}")
    for idx, fam, par in DIR[c["id"]]:
        a = spans[idx[0]][0] - (0.35 if beats else INICIO); b = spans[idx[-1]][1]
        beats.append({"cap": c["id"], "frases": idx, "familia": fam, **par, "ini": round(max(0, a), 3), "fim_fala": round(b, 3)})
    t0 += ali[c["id"]]["dur"] + PAUSA
DUR = round(t0 - PAUSA + CAUDA, 2)
for k, bt in enumerate(beats): bt["fim"] = beats[k + 1]["ini"] if k + 1 < len(beats) else DUR; bt["id"] = f"b{k:02d}"
anc_t.sort(); anc = [(0.0, 0.0)] + [(round(t, 3), m) for t, m in anc_t] + [(DUR, 6961.0)]
for (ta, ma), (tb, mb) in zip(anc, anc[1:]):
    if tb < ta or mb < ma: raise SystemExit(f"ANCORAS_FORA_DE_ORDEM {ta}:{ma} -> {tb}:{mb}")
out = {"fps": 30, "dauer": DUR, "ancoras": anc, "beats": beats, "legendas": legendas}
json.dump(out, open(os.path.join(R, "v1", "src", "plano.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
from collections import Counter
print(f"duracao {DUR:.1f} s | batidas {len(beats)} | familias {dict(Counter(b['familia'] for b in beats))}")
print("batida mais curta", min(round(b["fim"] - b["ini"], 1) for b in beats), "| mais longa", max(round(b["fim"] - b["ini"], 1) for b in beats))
