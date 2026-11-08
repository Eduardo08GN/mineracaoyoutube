# Olho da G4: verificação visual DENTRO da G4, devolvendo um JSON curto (o agente só abre imagem quando algo reprova).
# Camada 2 (régua de imagem): luminância p10/p50/p90, contraste, saturação e % de branco estourado, render vs referência.
# Camada 3 (juiz visual): Qwen3-VL-8B-Instruct (Apache-2.0) local, rubrica fixa em JSON, N amostras -> mediana e dispersão
# (mesmas regras do vlm_gate.py do img2threejs: o juiz nunca aprova o que a régua determinística reprovou; dispersão alta = incerto).
# A camada 1 (geometria/silhueta) é o divine_eye do img2threejs, rodado à parte.
# Uso (na VM): python3 olho.py --ref ref.png --render a.png [b.png ...] [--rubrica rubrica.json] [--amostras 3] --modelo DIR --saida out.json
import argparse, json, re, statistics, sys
import numpy as np
from PIL import Image

RUBRICA_PADRAO = {
    "contexto": "Cena 3D de um jato executivo (Learjet) em voo, para vídeo explicativo. Queremos o visual harmônico e limpo da REFERÊNCIA, não ultrarrealismo.",
    "criterios": {
        "harmonia": "1 = avião e céu na mesma família de cor, luz e contraste; 0 = avião destoa do ambiente (colado em cima do fundo).",
        "nao_plastico": "1 = pintura acetinada/fosca crível; 0 = brinquedo de plástico ou PVC brilhante, verniz duro.",
        "forma": "1 = silhueta de jato executivo esguio parecida com a da referência (fuselagem longa, nariz afilado, asas enflechadas, winglets, cauda em T, motores traseiros); 0 = formas toscas/cilíndricas/desproporcionais.",
        "pecas_soltas": "1 = nenhuma peça flutuando, desencaixada ou com fresta; 0 = há peças soltas.",
        "para_brisa_janelas": "1 = para-brisa escuro e nítido e janelas legíveis; 0 = ausentes, borradas ou erradas.",
        "exposicao": "1 = sem branco estourado e sem aspecto leitoso; 0 = estourado ou lavado.",
    },
    # calibrado em 04/11 com casos já julgados pelo Eduardo (takram leitoso, "PVC", L60 atual, quadro do Reconstructed):
    # o Qwen3-VL é benevolente (0,7-0,9 em tudo); com 0,8 os ruins reprovam, o controle passa e o L60 reprova em plástico.
    "limiar": 0.8,
}


def regua(path):
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(np.float32) / 255.0
    lum = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    mx, mn = a.max(-1), a.min(-1)
    sat = np.where(mx > 1e-4, (mx - mn) / np.maximum(mx, 1e-4), 0)
    p10, p50, p90 = (float(np.percentile(lum, q)) * 255 for q in (10, 50, 90))
    return {"p10": round(p10, 1), "p50": round(p50, 1), "p90": round(p90, 1), "contraste": round(p90 - p10, 1),
            "saturacao": round(float(sat.mean()), 3), "estourado_pct": round(float((lum > 0.98).mean()) * 100, 2)}


def comparar_regua(r, ref):
    d = {k: round(r[k] - ref[k], 2) for k in ref}
    alertas = []
    if r["estourado_pct"] > max(1.0, ref["estourado_pct"] * 3): alertas.append("branco estourado acima da referência")
    if r["contraste"] < ref["contraste"] * 0.6: alertas.append("contraste baixo (leitoso) contra a referência")
    if abs(r["p50"] - ref["p50"]) > 35: alertas.append("tom médio muito diferente da referência")
    return d, alertas


def juiz(modelo_dir, ref, render, rubrica, amostras):
    import torch
    from transformers import AutoModelForImageTextToText, AutoProcessor
    global _M, _P
    if "_M" not in globals():
        _P = AutoProcessor.from_pretrained(modelo_dir)
        _M = AutoModelForImageTextToText.from_pretrained(modelo_dir, dtype=torch.bfloat16, device_map="cuda")
    crit = rubrica["criterios"]
    pedido = (
        f"{rubrica['contexto']}\nImagem 1 = REFERÊNCIA. Imagem 2 = NOSSO RENDER.\n"
        "Avalie a Imagem 2 em relação à Imagem 1, critério por critério, com nota de 0 a 1 (use decimais):\n"
        + "\n".join(f"- {k}: {v}" for k, v in crit.items())
        + "\nResponda SÓ com JSON: {" + ", ".join(f'"{k}": n' for k in crit) + ', "defeitos": ["frase curta", ...], "classe": "o que é o objeto"}'
    )
    msgs = [{"role": "user", "content": [{"type": "text", "text": "Imagem 1:"}, {"type": "image", "image": ref},
                                          {"type": "text", "text": "Imagem 2:"}, {"type": "image", "image": render},
                                          {"type": "text", "text": pedido}]}]
    ent = _P.apply_chat_template(msgs, tokenize=True, add_generation_prompt=True, return_dict=True, return_tensors="pt").to(_M.device)
    res = []
    for i in range(amostras):
        out = _M.generate(**ent, max_new_tokens=420, do_sample=i > 0, temperature=0.6, top_p=0.9)
        txt = _P.batch_decode(out[:, ent["input_ids"].shape[1]:], skip_special_tokens=True)[0]
        m = re.search(r"\{.*\}", txt, re.S)
        try: res.append(json.loads(m.group(0)) if m else {})
        except Exception: res.append({})
    agg, disp = {}, 0.0
    for k in crit:
        v = [float(r.get(k, 0)) for r in res if isinstance(r.get(k, None), (int, float))]
        agg[k] = round(statistics.median(v), 2) if v else None
        if len(v) > 1: disp = max(disp, max(v) - min(v))
    defeitos = sorted({d for r in res for d in (r.get("defeitos") or []) if isinstance(d, str)})[:8]
    classes = [r.get("classe") for r in res if r.get("classe")]
    return {"notas": agg, "dispersao": round(disp, 2), "incerto": disp > 0.2, "defeitos": defeitos, "classe": classes[0] if classes else None}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ref", required=True)
    ap.add_argument("--render", nargs="+", required=True)
    ap.add_argument("--rubrica")
    ap.add_argument("--amostras", type=int, default=3)
    ap.add_argument("--modelo", required=True)
    ap.add_argument("--saida", required=True)
    a = ap.parse_args()
    rub = json.load(open(a.rubrica, encoding="utf-8")) if a.rubrica else RUBRICA_PADRAO
    rref = regua(a.ref)
    out = {"referencia": {"arquivo": a.ref, "regua": rref}, "renders": []}
    for r in a.render:
        rr = regua(r)
        delta, alertas = comparar_regua(rr, rref)
        item = {"arquivo": r, "regua": rr, "delta_regua": delta, "alertas_regua": alertas}
        # regra do vlm_gate: com reprovação dura da régua, o juiz não roda
        duro = any("estourado" in x for x in alertas)
        item["juiz"] = None if duro else juiz(a.modelo, a.ref, r, rub, a.amostras)
        notas = (item["juiz"] or {}).get("notas") or {}
        reprov = [k for k, v in notas.items() if v is not None and v < rub.get("limiar", 0.7)]
        item["veredito"] = "reprova" if (duro or reprov) else ("incerto" if (item["juiz"] or {}).get("incerto") else "passa")
        item["reprovou_em"] = (["regua: " + x for x in alertas] if duro else []) + reprov
        out["renders"].append(item)
    json.dump(out, open(a.saida, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(json.dumps(out, ensure_ascii=False)[:4000])
    print("OLHO_OK")


if __name__ == "__main__":
    main()
