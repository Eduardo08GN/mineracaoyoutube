# Closes de MAOS (sem rosto) para o b-roll de acao e o hack do video: o que o Veo faz melhor.
# Cada clipe: quadro inicial e quadro FINAL diferentes (o estado depois da acao), senao o Veo so' aproxima e volta.
#   1) imagens: GEM_PIX_2 em 16:9; a final usa a inicial como referencia (mesmas maos, mesma bancada)
#   2) videos: Veo 3.1 Lite [Lower Priority]; Omni 1.1 Flash 360p so' se o Lower Priority barrar
# ⛔ VERBA (Eduardo, 08/10): 100 creditos no total, a partir do saldo 24280. O Lower Priority COBRA ~5 creditos
#    com atraso, entao a trava conta o custo PREVISTO no envio (nao espera o debito cair).
#   python work/video/gerar_maos.py imagens | videos
import json, os, sys, time

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import flow_ivone as fi              # noqa: E402
fh = fi.fh
from PIL import Image               # noqa: E402

PASTA = os.path.join(AQUI, "fatia01")
QUADROS = os.path.join(PASTA, "maos")
BRUTO = os.path.join(PASTA, "bruto")
ESTADO = os.path.join(PASTA, "estado_maos.json")
VERBA = {"limite": 100, "ja_gasto": 5, "custo_lp": 5, "custo_omni": 6}   # ja_gasto: imagem m04_plantar_fim (5)

MAOS = ("the weathered, wrinkled hands of an old man, the sleeves of a coarse dark-brown wool monk's habit at the wrists, "
        "no face, nobody else in the frame")
CENA = ("on an old scarred oak potting bench in a monastery garden shed, soft window light from the left, terracotta pots, "
        "a bag of dark potting soil, dried herb bundles blurred in the background")
FOTO = (" Photorealistic close-up, 16:9 landscape, natural light, muted warm earthy colors like an old Dutch painting, "
        "shallow depth of field, 35mm documentary photograph. No text, no labels, no logos, no face.")

# chave: (pedido do quadro inicial, como o quadro FINAL difere, movimento do video)
TOMADAS = {
    "m01_tirar": (f"Close-up of {MAOS} holding a small supermarket basil plant in a thin black plastic pot {CENA}.",
                  "Same hands, same bench: the basil has been slid out of the plastic pot, the hands now hold the bare, dense root ball, the empty black pot lies on the bench.",
                  "The hands squeeze the plastic pot and slide the basil out, lifting the dense root ball free."),
    "m02_partir": (f"Close-up of {MAOS} holding a dense basil root ball with many crowded thin stems {CENA}.",
                   "Same hands, same bench: the root ball has been pulled apart into two halves, one half in each hand, roots visible.",
                   "The thumbs push into the root ball and the hands gently pull it apart into two halves."),
    "m03_quatro": (f"Close-up of {MAOS} holding two halves of a basil root ball over the potting bench {CENA}.",
                   "Same bench: four small separate basil clumps with their own roots now lie side by side on the bench, the hands resting beside them.",
                   "The hands tease each half apart once more and lay four small basil clumps side by side on the bench."),
    "m04_plantar": (f"Close-up of {MAOS} lowering a small basil clump with roots into a terracotta pot half filled with dark potting soil {CENA}.",
                    "Same pot: the basil clump now stands upright in the terracotta pot, the soil filled to the rim and pressed down around the stems by the hands.",
                    "The hands set the clump into the pot, fill soil around it and press it down firmly with the fingertips."),
    "m05_giessen": (f"Close-up of {MAOS} holding a small old tin watering can over a freshly potted basil in a terracotta pot {CENA}.",
                    "Same pot: the soil is now dark and wet, a few drops on the leaves, the watering can lowered.",
                    "Water pours gently from the tin watering can onto the soil, which darkens as it soaks in."),
    "m06_finger": (f"Close-up of {MAOS}: one index finger hovering just above the dry soil surface of a terracotta pot with basil {CENA}.",
                   "Same pot: the index finger is now pushed into the soil up to the second knuckle.",
                   "The index finger slowly pushes down into the soil up to the second knuckle to feel the moisture."),
    "m07_ernte": (f"Close-up of {MAOS}: thumb and index finger pinching the top shoot of a healthy basil plant just above a pair of leaves {CENA}.",
                  "Same plant: the fingers now hold the pinched-off top shoot, two small new side shoots visible where it was taken.",
                  "The fingers pinch the top shoot just above the leaf pair and lift it away."),
    "m08_fenster": (f"Close-up of {MAOS} setting the fourth small terracotta pot of basil onto an old wooden windowsill next to three others, warm morning light through old glass panes, monastery garden blurred outside.",
                    "Same windowsill: four small terracotta basil pots in a neat row, the hands withdrawn out of the frame.",
                    "The hands place the fourth pot in the row and withdraw slowly."),
    "m09_staunaesse": (f"Close-up of {MAOS} lifting a terracotta pot of wilting basil out of a saucer full of standing water {CENA}.",
                       "Same hands: the saucer has been tipped and is now empty, the pot set back on dry wood.",
                       "The hands lift the pot, tip the standing water out of the saucer and set the pot back down."),
    "m10_dicht": (f"Top-down close-up of {MAOS} above a supermarket basil pot overcrowded with dozens of thin stems {CENA}.",
                  "Same pot from above: the fingers now gently part the stems, revealing how many thin crowded seedlings grow in the one pot.",
                  "The fingers slowly part the dense stems to reveal dozens of crowded seedlings."),
}


def carregar():
    try: return json.load(open(ESTADO, encoding="utf-8"))
    except Exception: return {}                                                    # noqa: BLE001


def gravar(e):
    json.dump(e, open(ESTADO + ".tmp", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    os.replace(ESTADO + ".tmp", ESTADO)


def imagens():
    os.makedirs(QUADROS, exist_ok=True)
    est = carregar()
    s, cdp = fi.conectar()
    for k, (ini, fim, _mov) in TOMADAS.items():
        e = est.setdefault(k, {})
        for papel, texto, refs in (("ini", ini + FOTO, []), ("fim", None, None)):
            arq = os.path.join(QUADROS, f"{k}_{papel}.png")
            if os.path.exists(arq): continue
            if papel == "fim":
                texto = ("Using the reference image: keep exactly the same hands, sleeves, bench, light and framing. " + fim + FOTO)
                refs = [e["ini_id"]]
            for tent in range(3):
                try:
                    # ⭐ o caminho da ferramenta: rodizio de modelos gratis, medicao por conta (flow_ivone.imagem_feliz)
                    mid, modelo = fi.imagem_feliz(s, texto, refs, aspecto=3)
                    if modelo in fh._estado_modelos()["cobra"]:
                        print(f"⛔ a imagem {k}_{papel} cobrou ({modelo}): PAREI"); gravar(est); sys.exit(2)
                    fh.baixar_limpa(s, mid, arq)
                    e[f"{papel}_id"] = mid; gravar(est); print("  imagem", k, papel, flush=True)
                    break
                except fh.Freio:
                    print("  freio: 2 min e selo novo", flush=True)
                    time.sleep(120); fi.renovar_selo(cdp); cdp.close(); s, cdp = fi.conectar(); continue
                except fh.ErroFlow as x:
                    if fh.e_freio(x.detalhe):
                        print("  freio: 2 min e selo novo", flush=True)
                        time.sleep(120); fi.renovar_selo(cdp); cdp.close(); s, cdp = fi.conectar(); continue
                    print("  erro", k, papel, fh.motivo(x.detalhe), flush=True); break
            time.sleep(3)
    cdp.close()


def videos(so=None):
    est = carregar()
    s, cdp = fi.conectar()
    gasto_previsto = sum(v.get("custo_previsto", 0) for v in est.values())
    print("previsto ja' gasto:", gasto_previsto, "| saldo", fh.creditos(s), flush=True)
    for k, (_i, _f, mov) in TOMADAS.items():
        if so and k not in so: continue
        e = est.get(k, {})
        if e.get("op") or e.get("video"): continue
        a, b = os.path.join(QUADROS, f"{k}_ini.png"), os.path.join(QUADROS, f"{k}_fim.png")
        if not (os.path.exists(a) and os.path.exists(b)): print("  sem quadros:", k); continue
        # ⛔ o saldo da conta e' compartilhado (o Eduardo tambem gera nela): a verba conta SO' o que este script envia,
        #    mais o que ja' foi gasto antes (a imagem m04 que cobrou 5)
        if VERBA["ja_gasto"] + gasto_previsto + VERBA["custo_lp"] > VERBA["limite"]:
            print(f"⛔ verba: {VERBA['ja_gasto']} + previsto {gasto_previsto}: PAREI antes de {k}"); break
        prompt = fi.prompt_sem_fala(mov + " Only the hands move; the camera stays almost still, handheld feel.")
        try:
            ia, ib = fh.upload(s, a, fi.PROJETO)[0], fh.upload(s, b, fi.PROJETO)[0]
            op, rest = fi._gerar_video(s, prompt, ia, ib, Image.open(a).size, Image.open(b).size)
        except fh.ErroFlow as x:
            print(f"  {k}: o Lower Priority barrou ({fh.motivo(x.detalhe)})", flush=True)
            if fh.e_freio(x.detalhe):
                time.sleep(120); fi.renovar_selo(cdp); cdp.close(); s, cdp = fi.conectar()
            continue
        gasto_previsto += VERBA["custo_lp"]
        est[k] = dict(e, op=op, custo_previsto=VERBA["custo_lp"], prompt=prompt); gravar(est)
        print(f"  {k} enviado (previsto {gasto_previsto}, saldo devolvido {rest})", flush=True)
        time.sleep(3)
    # colhe
    fim = time.time() + 2400
    while time.time() < fim:
        ops = {k: v["op"] for k, v in est.items() if v.get("op") and not v.get("video") and not v.get("falhou")}
        if not ops: break
        st = fh.poll(s, list(ops.values()))
        for k, op in ops.items():
            if st.get(op) == "pronto":
                url = fh.media_info(s, op).get("url")
                if url:
                    est[k]["video"] = fh.download_video(s, url, os.path.join(BRUTO, k + ".mp4")); gravar(est)
                    print("  pronto", k, flush=True)
            elif st.get(op) in ("falhou", "recusado"):
                est[k]["falhou"] = st.get(op); gravar(est); print("  FALHOU", k, flush=True)
        time.sleep(15)
    print("saldo no fim:", fh.creditos(s), "| verba usada (previsto):", gasto_previsto, flush=True)
    cdp.close()


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    imagens() if sys.argv[1] == "imagens" else videos(set(sys.argv[2:]) or None)
