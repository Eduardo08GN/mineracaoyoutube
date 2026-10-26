# -*- coding: utf-8 -*-
r"""INSTAGRAM QA — a checagem automatica de cada versao de take, logo depois de gerada.

    python motor/instagram_qa.py --autoteste          (precisa do ffmpeg para o video de teste)

    comparar_fala(fala, palavras)      o roteiro contra o que o whisper ouviu: trocadas, faltando, sobrando, repetida
    medir_video(video, corte_s)        a camera (correlacao de fase na faixa de cima) e a deriva do quadro no corte
                                       e no fim do video contra o quadro de abertura
    avaliar(fala, palavras, dur, visual)
        -> {"flags": [{"etiqueta", "motivo", "estado", "grave"}], "medidas": {...}}; cada flag usa uma etiqueta da
           curadoria (motor/instagram_curadoria.py), para o editor pre-marcar o defeito que a pessoa confirma ou dispensa
    melhor(versoes)                    a curadoria automatica: entre as versoes novas de um take, a que passou no QA
                                       (sem flag grave) e tem menos defeito; diz se passou e por que

⭐ Num take que a pessoa NAO apontou, o QA so' SUGERE: a flag aparece com ⚠ e vira defeito apenas quando ela confirma.
⭐ Num take refeito pela curadoria, o QA ESCOLHE a versao (melhor): a pessoa so' aponta o erro, o resto e' automatico. Dispensar tambem
   fica registrado (ocorrencias.jsonl), para recalibrar os limites com o tempo.
⛔ Os limites abaixo foram calibrados no run de 18/10 (9 takes + 2 versoes da Tomiko): camera travada em todos (no
   maximo 0,4% de deslocamento, a cabeca entrando na faixa); o take 4, em que a forma "anda sozinha" para o forno,
   chega a ~10% de diferenca no corte, os outros ficam abaixo de 6%.
"""
import difflib, os, re, sys, unicodedata

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path: sys.path.insert(0, AQUI)
import instagram_roteiro as _rot                                            # noqa: E402

LIMITES = {
    "camera_pct": 1.5,      # deslocamento da faixa de cima contra o 1o quadro, em % da largura
    "corte_pct": 7.0,       # diferenca media do quadro no ponto de corte contra a abertura (o salto no Reel)
    "fim_pct": 7.0,         # diferenca meio segundo antes do fim: o take nao voltou ao quadro (algo mudou de lugar)
    # ⭐ (19/10) take com acao (quadro final diferente do de abertura): o fim e' comparado com o QUADRO FINAL, que e'
    #    outra imagem gerada; folga maior que a do mesmo quadro, que o Veo reproduz quase igual
    "acao_pct": 11.0,
    "fala_longa_s": _rot.FALA_S + 1.5,
    "folga_fim_s": 0.4,     # ultima palavra a menos disso do fim do video: o Veo provavelmente cortou a fala
    "parecida": 0.6,        # palavra trocada com essa semelhanca (letras) e' pronuncia, abaixo e' outra palavra
}
FAIXA_CIMA = 0.22           # ⭐ a faixa de cima do quadro e' parede e prateleira: so' a camera mexe ali
FPS_LEITURA = 10            # ⭐ (22/10, Eduardo) a leitura optica a 10 quadros por segundo (antes: 17 amostras por take)
# ⭐ (22/10, Eduardo: "respeite os angulos, o enquadramento e os movimentos de camera do video original") o que a
#    leitura optica da fonte chama de movimento: zoom e pan/tilt acumulados no trecho, e o balanco da mao
CAMERA_FONTE = {"zoom_pct": 5.0, "pan_pct": 4.0, "tremor_pct": 0.35}
RAPIDO_PCT_S = 12.0         # zoom/pan acima disso por segundo e' "rapido" (o zoom de edicao do plano medio ao close)
CORTE_CENA_PCT = 12.0
# ⭐ (22/10) so' o movimento FORTE leva o quadro final ao enquadramento do fim da fonte; o fraco (6% de zoom, um tilt
#    leve) fica so' no texto do prompt (forcar o quadro final cortava o rosto dela no meio da fala)
CAMERA_FORTE = {"zoom_pct": 15.0, "pan_pct": 10.0}       # dois quadros seguidos (0,1 s) mais diferentes que isso = corte de cena, nao camera


def _norm(w):
    t = unicodedata.normalize("NFKD", (w or "").lower()).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9']", "", t)


def _tokens(texto):
    return [x for x in (_norm(p) for p in re.split(r"[\s\-]+", texto or "")) if x]


def comparar_fala(fala, palavras):
    """O roteiro (`fala`) contra as palavras do whisper ([{"w", ...}] ou texto). Devolve {"trocadas": [(esperada,
    ouvida, parecida)], "faltando": [...], "sobrando": [...], "repetiu": bool, "ouvido": "..."}.
    ⛔ O whisper erra sozinho: numero em algarismo, palavra de 1-2 letras e acento nao contam como defeito."""
    ouvido = palavras if isinstance(palavras, str) else " ".join(w["w"] for w in palavras or [])
    a, b = _tokens(fala), _tokens(ouvido)
    saida = {"trocadas": [], "faltando": [], "sobrando": [], "repetiu": False, "ouvido": ouvido.strip()}
    if not a: return saida
    # ⭐ a fala dita duas vezes: o comeco do roteiro aparece de novo depois do fim dele
    if len(a) >= 3:
        ini = a[:3]
        vezes = sum(1 for i in range(len(b) - 2) if b[i:i + 3] == ini)
        saida["repetiu"] = vezes >= 2 or (len(b) >= 1.6 * len(a) and len(a) >= 5)
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if op == "equal": continue
        esp, ouv = a[i1:i2], b[j1:j2]
        if any(x.isdigit() for x in ouv): continue                          # "180" pelo "cento e oitenta"
        if op == "replace" and "".join(esp) == "".join(ouv): continue       # "bem estar" / "bemestar"
        if op == "replace" and len(esp) == len(ouv):
            for e, o in zip(esp, ouv):
                if len(e) <= 2: continue
                sem = difflib.SequenceMatcher(None, e, o).ratio()
                saida["trocadas"].append((e, o, sem >= LIMITES["parecida"]))
            continue
        # ⭐ (18/10) "Asse em forno" saiu "Assim forno": duas palavras fundidas numa, a vogal do fim colando na do comeco
        if op == "replace" and len(esp) <= 3 and len(ouv) <= 3 and \
                difflib.SequenceMatcher(None, " ".join(esp), " ".join(ouv)).ratio() >= LIMITES["parecida"]:
            saida["trocadas"].append((" ".join(esp), " ".join(ouv), True))
            continue
        saida["faltando"] += [e for e in esp if len(e) > 2]
        saida["sobrando"] += [o for o in ouv if len(o) > 2]
    return saida


def _cinza(arq_ou_quadro):
    import cv2
    return cv2.cvtColor(arq_ou_quadro, cv2.COLOR_BGR2GRAY) if arq_ou_quadro.ndim == 3 else arq_ou_quadro


def _quadros(video, tempos):
    """[(t, cinza)] nos segundos pedidos (o que o video tiver)."""
    import cv2
    cap = cv2.VideoCapture(video)
    if not cap.isOpened(): raise RuntimeError("não consegui abrir o vídeo para o QA")
    saida = []
    try:
        for t in tempos:
            cap.set(cv2.CAP_PROP_POS_MSEC, max(0.0, t) * 1000)
            ok, f = cap.read()
            if ok: saida.append((t, _cinza(f)))
    finally:
        cap.release()
    return saida


def _ler_fps(video, ini=0.0, fim=None, fps=FPS_LEITURA):
    """[(t, cinza)] a `fps` quadros por segundo entre ini e fim, lendo o video em sequencia (sem um seek por quadro)."""
    import cv2
    cap = cv2.VideoCapture(video)
    if not cap.isOpened(): raise RuntimeError("não consegui abrir o vídeo para a leitura óptica")
    saida, prox, passo = [], max(0.0, ini), 1.0 / fps
    try:
        if ini > 0: cap.set(cv2.CAP_PROP_POS_MSEC, ini * 1000)
        while True:
            ok, f = cap.read()
            if not ok: break
            t = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000
            if fim is not None and t > fim: break
            if t + 1e-3 >= prox:
                saida.append((round(t, 3), _cinza(f)))
                prox += passo
    finally:
        cap.release()
    return saida


def fim_do_plano(video, ini, fim, limiar=CORTE_CENA_PCT):
    """⭐ (22/10) o ultimo instante do MESMO plano que comeca em `ini`: o tempo logo antes do primeiro corte de cena
    entre ini e fim (leitura optica a FPS_LEITURA), ou `fim` sem corte. ⛔ O quadro final tirado depois de um corte
    (o forno, outro plano) fazia o Veo fundir as duas cenas no fim do take."""
    fs = _ler_fps(video, ini, fim)
    for (ta, a), (_tb, b) in zip(fs, fs[1:]):
        if _diferenca(a, b) > limiar: return max(ini, ta - 0.05)
    return fim


def camera_da_fonte(video, ini=0.0, fim=None):
    """⭐ A camera de um trecho do video de origem, pela leitura optica a FPS_LEITURA: entre cada par de quadros, os
    pontos rastreados (Lucas-Kanade) dao uma similaridade (RANSAC: o fundo vence a mao que mexe); acumulados, dao o
    zoom (% de crescimento da imagem), o pan e o tilt (% da largura/altura que o conteudo andou) e o tremor (o
    balanco de camera na mao). -> {"zoom_pct", "pan_pct", "tilt_pct", "tremor_pct", "texto"}"""
    import cv2, numpy as np
    fs = _ler_fps(video, ini, fim)
    vazio = {"zoom_pct": 0.0, "pan_pct": 0.0, "tilt_pct": 0.0, "tremor_pct": 0.0, "texto": ""}
    if len(fs) < 3: return vazio
    h0, w0 = fs[0][1].shape
    esc = 360.0 / max(h0, w0)
    pq = [cv2.resize(g, (max(1, int(w0 * esc)), max(1, int(h0 * esc))), interpolation=cv2.INTER_AREA) for _, g in fs]
    h, w = pq[0].shape
    escala, dx, dy, passos, cortes = 1.0, 0.0, 0.0, [], 0
    for a, b in zip(pq, pq[1:]):
        if _diferenca(a, b) > CORTE_CENA_PCT:      # ⛔ corte de cena no meio do trecho: nao e' a camera andando
            cortes += 1
            continue
        pts = cv2.goodFeaturesToTrack(a, 300, 0.01, 6)
        if pts is None or len(pts) < 8: continue
        p2, st, _err = cv2.calcOpticalFlowPyrLK(a, b, pts, None)
        bons = st.reshape(-1) == 1
        if bons.sum() < 8: continue
        m, _inl = cv2.estimateAffinePartial2D(pts[bons], p2[bons], method=cv2.RANSAC, ransacReprojThreshold=2.0)
        if m is None: continue
        s = float(np.hypot(m[0, 0], m[1, 0]))
        # translacao do centro do quadro (a de m e' em torno da origem: com zoom, o canto anda sem a camera andar)
        cx, cy = w / 2, h / 2
        tx = float(m[0, 0] * cx + m[0, 1] * cy + m[0, 2] - cx)
        ty = float(m[1, 0] * cx + m[1, 1] * cy + m[1, 2] - cy)
        escala *= s; dx += tx; dy += ty
        passos.append((tx / w * 100, ty / h * 100))
    if not passos: return vazio
    arr = np.array(passos)
    tremor = float(np.mean(np.abs(arr - np.mean(arr, axis=0)))) if len(arr) > 2 else 0.0
    med = {"zoom_pct": round((escala - 1) * 100, 1), "pan_pct": round(dx / w * 100, 1), "tilt_pct": round(dy / h * 100, 1),
           "tremor_pct": round(tremor, 2), "cortes": cortes, "dur_s": round(len(fs) / FPS_LEITURA, 1)}
    # ⛔ trecho picado (2+ cortes de cena) mistura planos diferentes: nao ha um movimento so' para copiar
    texto = "" if cortes >= 2 else texto_camera(med)
    forte = bool(texto) and (abs(med["zoom_pct"]) >= CAMERA_FORTE["zoom_pct"] or abs(med["pan_pct"]) >= CAMERA_FORTE["pan_pct"]
                             or abs(med["tilt_pct"]) >= CAMERA_FORTE["pan_pct"])
    return {**med, "texto": texto, "forte": forte}


def texto_camera(m):
    """A camera medida em palavras para o prompt do Veo ("" = travada). O conteudo andar para a esquerda e' a camera
    indo para a direita; a imagem crescer e' a camera chegando perto."""
    lim, partes, dur = CAMERA_FONTE, [], max(0.5, m.get("dur_s") or 5.0)
    ritmo = lambda pct: "quick" if abs(pct) / dur >= RAPIDO_PCT_S else "slow, steady"           # noqa: E731
    z = m.get("zoom_pct", 0)
    if z >= lim["zoom_pct"]:
        partes.append(f"a {ritmo(z)} push-in (the frame tightens about {abs(z):.0f}% by the end)")
    elif z <= -lim["zoom_pct"]:
        partes.append(f"a {ritmo(z)} pull-back (the frame widens about {abs(z):.0f}% by the end)")
    if abs(m.get("pan_pct", 0)) >= lim["pan_pct"]:
        partes.append(f"a {ritmo(m['pan_pct'])} pan to the {'right' if m['pan_pct'] < 0 else 'left'}")
    if abs(m.get("tilt_pct", 0)) >= lim["pan_pct"]:
        partes.append(f"a {ritmo(m['tilt_pct'])} tilt {'down' if m['tilt_pct'] < 0 else 'up'}")
    if m.get("tremor_pct", 0) >= lim["tremor_pct"]:
        partes.append("a subtle, natural handheld sway, like a phone held in the hand")
    return ", ".join(partes)


def _pequeno(g):
    import cv2, numpy as np
    return cv2.GaussianBlur(cv2.resize(g, (90, 160), interpolation=cv2.INTER_AREA), (5, 5), 0).astype(np.float32)


def _diferenca(a, b):
    """Diferenca media (0-100) entre dois quadros reduzidos e borrados: ignora ruido e compressao, pega objeto que mudou."""
    import numpy as np
    return float(np.mean(np.abs(_pequeno(a) - _pequeno(b)))) / 255 * 100


def medir_video(video, dur, corte_s=None, fim_ref=None):
    """{"camera_pct", "corte_pct", "fim_pct"} de uma versao. ⭐ Camera: correlacao de fase da faixa de cima de cada
    amostra contra a do 1o quadro (deslocamento em % da largura, so' com resposta confiavel). Deriva: o quadro no
    ponto de corte da montagem e o de meio segundo antes do fim, contra o 1o quadro."""
    import cv2, numpy as np
    fs = _ler_fps(video, 0.0, max(0.0, dur - 0.2))                           # ⛔ o ultimo quadro do Veo vem borrado
    if len(fs) < 3: raise RuntimeError("vídeo curto demais para o QA")
    h, w = fs[0][1].shape
    alt = max(16, int(h * FAIXA_CIMA))
    janela = cv2.createHanningWindow((w, alt), cv2.CV_32F)
    b0 = np.float32(fs[0][1][:alt])
    cam = 0.0
    for _, g in fs[1:]:
        (dx, dy), resp = cv2.phaseCorrelate(b0, np.float32(g[:alt]), janela)
        if resp >= 0.3: cam = max(cam, float(np.hypot(dx, dy)) / w * 100)
    ref = fs[0][1]
    acao = False
    if fim_ref:
        # ⭐ take com acao: o ponto de corte e o fim tem de chegar ao quadro final (a acao terminou), nao voltar ao inicio
        img = cv2.imread(fim_ref, cv2.IMREAD_GRAYSCALE)
        if img is not None: ref, acao = cv2.resize(img, (w, h), interpolation=cv2.INTER_AREA), True
    extras = _quadros(video, [x for x in (corte_s, max(0.0, dur - 0.5)) if x is not None])
    corte = _diferenca(ref, extras[0][1]) if corte_s is not None and extras else None
    fim = _diferenca(ref, extras[-1][1]) if extras else None
    return {"camera_pct": round(cam, 2), "corte_pct": None if corte is None else round(corte, 1),
            "fim_pct": None if fim is None else round(fim, 1), "acao": acao}


def _seg(s):
    return f"{s:.1f}".replace(".", ",") + " s"


def avaliar(fala, palavras, dur, visual=None, camera_livre=False):
    """As flags de uma versao. `palavras` = o que o whisper ouviu no video (com tempo); `visual` = medir_video(...).
    `camera_livre`: o take copia um movimento de camera da fonte, entao a camera andar nao e' defeito."""
    flags, med = [], {}

    def flag(etiqueta, motivo, grave=True):
        """`grave` = reprova a versao na escolha automatica (a fala so' longa pesa, mas nao reprova)."""
        f = next((f for f in flags if f["etiqueta"] == etiqueta), None)
        if not f: flags.append({"etiqueta": etiqueta, "motivo": motivo, "estado": "", "grave": grave})
        else: f.update(motivo=f["motivo"] + "; " + motivo, grave=f["grave"] or grave)

    if fala.strip():
        c = comparar_fala(fala, palavras)
        med["ouvido"] = c["ouvido"]
        if not palavras:
            flag("fala", "o whisper não ouviu fala nenhuma")
        else:
            ini, fim = palavras[0]["ini"], palavras[-1]["fim"]
            med["fala_s"] = round(fim - ini, 2)
            pron = [(e, o) for e, o, p in c["trocadas"] if p]
            outras = [(e, o) for e, o, p in c["trocadas"] if not p]
            if pron: flag("pronuncia", ", ".join(f"“{e}” saiu “{o}”" for e, o in pron[:3]))
            if outras: flag("fala", ", ".join(f"“{e}” virou “{o}”" for e, o in outras[:3]))
            esp = _tokens(fala)
            if c["faltando"] and (len(c["faltando"]) >= 2 or (esp and esp[-1] in c["faltando"])):
                flag("fala", "faltou " + ", ".join(f"“{x}”" for x in c["faltando"][:4]))
            if c["repetiu"]: flag("fala", "a fala foi dita duas vezes")
            elif len(c["sobrando"]) >= 3: flag("fala", "sobrou " + ", ".join(f"“{x}”" for x in c["sobrando"][:4]))
            if med["fala_s"] > LIMITES["fala_longa_s"]:
                flag("tempo", f"a fala durou {_seg(med['fala_s'])} (alvo ~{_seg(_rot.FALA_S)}): o Reel incha", grave=False)
            if dur and fim > dur - LIMITES["folga_fim_s"]:
                flag("tempo", "a fala vai até o fim do take: pode ter sido cortada")
    if visual:
        med.update({k: v for k, v in visual.items() if v is not None})
        if not camera_livre and visual.get("camera_pct", 0) > LIMITES["camera_pct"]:
            flag("camera", f"o fundo deslocou {visual['camera_pct']:.1f}% da largura: a câmera mexeu")
        if visual.get("acao"):
            lim = LIMITES["acao_pct"]
            if (visual.get("corte_pct") or 0) > lim:
                flag("acao", f"no fim da fala o quadro está {visual['corte_pct']:.0f}% diferente do quadro final: a ação não terminou")
            elif (visual.get("fim_pct") or 0) > lim:
                flag("acao", f"o take não chega ao quadro final ({visual['fim_pct']:.0f}% diferente no fim)")
        elif (visual.get("corte_pct") or 0) > LIMITES["corte_pct"]:
            flag("morph", f"no corte o quadro está {visual['corte_pct']:.0f}% diferente da abertura: algo mudou de lugar")
        elif (visual.get("fim_pct") or 0) > LIMITES["fim_pct"]:
            flag("morph", f"o take não volta ao quadro de abertura ({visual['fim_pct']:.0f}% diferente no fim)")
    return {"flags": flags, "medidas": med}


def abertas(qa):
    """As flags que ainda pedem decisao (nem confirmadas nem dispensadas)."""
    return [f for f in (qa or {}).get("flags", []) if not f.get("estado")]


# ⭐ o peso de cada defeito na escolha automatica: errar a fala pesa mais que a fala longa
PESO = {"fala": 5, "pronuncia": 4, "morph": 4, "acao": 4, "camera": 3, "tempo": 1}


def passou(qa):
    """Sem flag grave em aberto. ⛔ QA que nao rodou (erro) nao reprova: sem medida, a versao nao e' julgada."""
    return not any(f.get("grave", True) for f in abertas(qa))


def nota(qa):
    """Quanto menor, melhor: a soma dos pesos das flags abertas (+ o excesso da fala, para desempatar)."""
    med = (qa or {}).get("medidas", {})
    return sum(PESO.get(f["etiqueta"], 3) for f in abertas(qa)) + max(0.0, (med.get("fala_s") or 0) - _rot.FALA_S) / 10


def resumo(qa):
    """O porque da escolha, curto, para o toast e para a ocorrencia: "fala conferida", "fala um pouco longa"..."""
    if not qa or (qa.get("erro") and not qa.get("medidas")): return "sem QA (não deu para medir)"
    fl = abertas(qa)
    if not passou(qa): return "; ".join(f["motivo"] for f in fl if f.get("grave", True))
    partes = ["fala conferida"] if qa.get("medidas", {}).get("ouvido") else []
    if any(f["etiqueta"] == "tempo" for f in fl): partes.append("fala um pouco longa")
    if "camera_pct" in qa.get("medidas", {}): partes.append("imagem estável")
    return ", ".join(partes) or "sem defeito medido"


def melhor(versoes):
    """A versao que a curadoria automatica escolhe: a que passou no QA, com a menor nota; no empate, a primeira.
    Devolve (versao, passou, motivo) ou (None, False, "") sem versao."""
    if not versoes: return None, False, ""
    v = min(versoes, key=lambda x: (not passou(x.get("qa")), nota(x.get("qa"))))
    return v, passou(v.get("qa")), resumo(v.get("qa"))


def _autoteste():
    import subprocess, tempfile
    ok = True

    def caso(nome, cond):
        nonlocal ok; print(("  OK  " if cond else "  ERRO"), nome); ok &= bool(cond)

    def ws(texto, ini=0.5, passo=0.4):
        return [{"w": w, "ini": round(ini + i * passo, 2), "fim": round(ini + i * passo + 0.35, 2)} for i, w in enumerate(texto.split())]

    fala = "Nasce um pão macio, fofinho, sem glúten, cheio de gorduras boas."
    c = comparar_fala(fala, ws("Nasce um pão macio, forinho, sem gluten, cheio de gorduras boas."))
    caso("⭐ 'fofinho' -> 'forinho' e' pronuncia; acento nao conta", c["trocadas"] == [("fofinho", "forinho", True)]
         and not c["faltando"])
    caso("⭐ duas palavras fundidas numa e' pronuncia", comparar_fala("Asse em forno a cento e oitenta graus.",
                                                                    ws("Assim forno a 180 graus."))["trocadas"]
         == [("asse em", "assim", True)])
    caso("numero em algarismo nao conta", not comparar_fala("Asse a cento e oitenta graus.", ws("Asse a 180 graus."))["faltando"])
    caso("hifen nao conta", comparar_fala("o seu bem-estar", ws("o seu bem estar"))["trocadas"] == [])
    caso("⭐ fala repetida", comparar_fala("Uma pitada de sal e bate tudo.",
                                           ws("Uma pitada de sal e bate tudo. Uma pitada de sal e bate tudo."))["repetiu"])

    a = avaliar(fala, ws("Nasce um pão macio, forinho, sem glúten, cheio de gorduras boas."), 8.0)
    caso("⭐ avaliar: flag de pronuncia com o motivo", [f["etiqueta"] for f in a["flags"]] == ["pronuncia"]
         and "“fofinho” saiu “forinho”" in a["flags"][0]["motivo"] and a["medidas"]["fala_s"] > 0)
    a = avaliar(fala, ws("Nasce um pão macio, fofinho, sem glúten, cheio"), 8.0)
    caso("⭐ avaliar: o fim da fala sumiu", any(f["etiqueta"] == "fala" and "faltou" in f["motivo"] for f in a["flags"]))
    a = avaliar(fala, ws(fala, ini=0.4, passo=0.75), 8.0)
    caso("⭐ avaliar: fala longa e encostada no fim", [f["etiqueta"] for f in a["flags"]] == ["tempo"]
         and "durou" in a["flags"][0]["motivo"] and "cortada" in a["flags"][0]["motivo"])
    caso("avaliar: sem fala ouvida", avaliar(fala, [], 8.0)["flags"][0]["etiqueta"] == "fala")
    caso("avaliar: take sem fala nao checa fala", avaliar("", [], 8.0)["flags"] == [])
    caso("avaliar: tudo certo = sem flag", avaliar(fala, ws(fala), 8.0)["flags"] == [])
    v = avaliar(fala, ws(fala), 8.0, {"camera_pct": 3.2, "corte_pct": 9.7, "fim_pct": 2.0})
    caso("⭐ avaliar: camera e deriva no corte", [f["etiqueta"] for f in v["flags"]] == ["camera", "morph"]
         and "10% diferente" in v["flags"][1]["motivo"])
    caso("avaliar: deriva so' no fim", "não volta" in avaliar("", [], 8, {"camera_pct": 0, "corte_pct": 2, "fim_pct": 9})["flags"][0]["motivo"])
    va = avaliar("", [], 8, {"camera_pct": 0, "corte_pct": 9.5, "fim_pct": 9, "acao": True})
    vb = avaliar("", [], 8, {"camera_pct": 0, "corte_pct": 14, "fim_pct": 9, "acao": True})
    caso("⭐ take com acao: o fim diferente da abertura nao e' morph; so' longe do quadro final vira 'acao'",
         va["flags"] == [] and vb["flags"][0]["etiqueta"] == "acao" and "não terminou" in vb["flags"][0]["motivo"])
    a = avaliar(fala, ws(fala, ini=0.4, passo=0.75), 8.0)
    caso("⭐ fala longa nao e' grave; cortada no fim e' grave", a["flags"][0]["grave"] is True
         and avaliar(fala, ws(fala, ini=0.4, passo=0.62), 8.0)["flags"][0]["grave"] is False)
    boa = {"v": 2, "qa": avaliar(fala, ws(fala), 8.0, {"camera_pct": 0.1, "corte_pct": 1, "fim_pct": 1})}
    longa = {"v": 3, "qa": avaliar(fala, ws(fala, ini=0.4, passo=0.62), 8.0)}
    errada = {"v": 4, "qa": avaliar(fala, ws("Nasce um pão macio, forinho, sem glúten, cheio de gorduras boas."), 8.0)}
    caso("⭐ melhor: a que passou, com menos defeito", melhor([errada, longa, boa])[:2] == (boa, True)
         and melhor([boa])[2] == "fala conferida, imagem estável")
    caso("⭐ melhor: fala longa passa (pesa, nao reprova)", melhor([errada, longa]) == (longa, True, "fala conferida, fala um pouco longa"))
    v, ok_, motivo = melhor([errada, dict(errada, v=5)])
    caso("⭐ melhor: as duas reprovadas = nao passou, com o motivo", v["v"] == 4 and not ok_ and "forinho" in motivo)
    caso("melhor: sem versao / QA que nao rodou", melhor([]) == (None, False, "")
         and melhor([{"v": 1, "qa": {"flags": [], "medidas": {}, "erro": "x"}}])[1] is True)
    caso("abertas: so' as sem decisao", len(abertas({"flags": [{"etiqueta": "a", "estado": ""},
                                                             {"etiqueta": "b", "estado": "dispensada"}]})) == 1)

    tmp = tempfile.mkdtemp(prefix="min-ig-qa-")
    parado, mexe = os.path.join(tmp, "parado.mp4"), os.path.join(tmp, "mexe.mp4")
    base = "testsrc2=s=360x640:d=4:r=24"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", base, "-vf", "trim=0:0.04,loop=200:1:0,setpts=N/24/TB",
                    "-t", "4", "-c:v", "libx264", "-pix_fmt", "yuv420p", parado], check=True)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", base, "-vf",
                    "trim=0:0.04,loop=200:1:0,setpts=N/24/TB,crop=300:560:'min(60,t*30)':'min(80,t*40)',scale=360:640",
                    "-t", "4", "-c:v", "libx264", "-pix_fmt", "yuv420p", mexe], check=True)
    mp = medir_video(parado, 4.0, corte_s=2.0)
    caso("⭐ video parado: camera e deriva ~0", mp["camera_pct"] < 0.5 and mp["corte_pct"] < 1 and mp["fim_pct"] < 1)
    mm = medir_video(mexe, 4.0, corte_s=2.0)
    caso("⭐ video com a camera andando: a faixa de cima acusa", mm["camera_pct"] > LIMITES["camera_pct"]
         and mm["fim_pct"] > mp["fim_pct"])
    caso("⛔ video que nao abre", _erro(lambda: medir_video(os.path.join(tmp, "nao.mp4"), 4.0)))
    import cv2
    fim_png = os.path.join(tmp, "fim.png")
    cap = cv2.VideoCapture(mexe); cap.set(cv2.CAP_PROP_POS_MSEC, 3500); _ok, quadro_fim = cap.read(); cap.release()
    cv2.imwrite(fim_png, quadro_fim)
    ma = medir_video(mexe, 4.0, corte_s=3.4, fim_ref=fim_png)
    caso("⭐ take com acao: o fim e' medido contra o quadro final esperado", ma["acao"] and ma["fim_pct"] < mm["fim_pct"])
    lido = _ler_fps(parado, 0.0, 3.0)
    caso("⭐ leitura optica a 10 fps", 29 <= len(lido) <= 31 and abs((lido[1][0] - lido[0][0]) - 0.1) < 0.03)
    zoom = os.path.join(tmp, "zoom.mp4")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", base, "-vf",
                    "trim=0:0.04,loop=200:1:0,setpts=N/24/TB,zoompan=z='1+on*0.003':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
                    ":d=1:s=360x640:fps=24",
                    "-t", "4", "-c:v", "libx264", "-pix_fmt", "yuv420p", zoom], check=True)
    cp, cm, cz = camera_da_fonte(parado), camera_da_fonte(mexe), camera_da_fonte(zoom)
    caso("⭐ camera da fonte: parada = travada (sem texto)", cp["texto"] == "" and abs(cp["zoom_pct"]) < 2)
    corte = os.path.join(tmp, "corte.mp4")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", parado, "-f", "lavfi", "-i", "color=c=red:s=360x640:d=2:r=24",
                    "-filter_complex", "[0:v]trim=0:2,setpts=PTS-STARTPTS[a];[1:v]format=yuv420p[b];[a][b]concat=n=2:v=1[v]",
                    "-map", "[v]", "-c:v", "libx264", "-pix_fmt", "yuv420p", corte], check=True)
    fp = fim_do_plano(corte, 0.3, 3.8)
    caso("⭐ fim do plano: o quadro final para antes do corte de cena", 1.7 <= fp <= 2.0 and fim_do_plano(parado, 0.3, 3.8) == 3.8)
    caso("⭐ camera da fonte: o conteudo andando para a esquerda = pan para a direita", "pan to the right" in cm["texto"])
    caso("⭐ camera da fonte: a imagem crescendo = push-in", cz["zoom_pct"] > 10 and "push-in" in cz["texto"])
    caso("camera forte: o zoom grande leva o quadro final; a parada nao", cz["forte"] is (abs(cz["zoom_pct"]) >= 15)
         and cp["forte"] is False)
    caso("camera livre: o take que copia o movimento nao leva a flag de camera",
         not any(f["etiqueta"] == "camera" for f in avaliar(fala, ws(fala), 8.0, {"camera_pct": 9.0}, camera_livre=True)["flags"])
         and any(f["etiqueta"] == "camera" for f in avaliar(fala, ws(fala), 8.0, {"camera_pct": 9.0})["flags"]))
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


def _erro(fn):
    try:
        fn()
    except Exception:                                                      # noqa: BLE001
        return True
    return False


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if "--calibrar" in sys.argv:
        # python motor/instagram_qa.py --calibrar <pasta do reel>: mede todas as versoes com o whisper de verdade
        import json, instagram_midia as _m
        pasta = sys.argv[-1]
        r = json.load(open(os.path.join(pasta, "reel.json"), encoding="utf-8"))
        for t in r["takes"]:
            for ver in t.get("versoes") or [{"v": 1, "video": t["video"], "fala": t["fala"]}]:
                pals, _ = _m.palavras(ver["video"], _rot.IDIOMAS[r["idioma"]]["whisper"])
                dur = _m.duracao(ver["video"])
                vis = medir_video(ver["video"], dur, _m.fim_da_fala(pals, dur))
                res = avaliar(ver["fala"], pals, dur, vis)
                print(t["n"], ver["v"], json.dumps(res["medidas"], ensure_ascii=False))
                for f in res["flags"]: print("     ⚠", f["etiqueta"], "-", f["motivo"])
        sys.exit(0)
    sys.exit(0 if _autoteste() else 1)
