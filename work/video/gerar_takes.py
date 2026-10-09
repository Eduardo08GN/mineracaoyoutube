# Gera os clipes da fatia 1 no caminho da ferramenta ow_agente: SO' video Lower Priority (gratis),
# quadro inicial = final, um pedido por vez, no maximo 4 no ar (ADIANTADOS_MAX), 3 s entre pedidos.
# ⛔ Saldo conferido antes de cada envio, no saldo que o nprQif devolve e depois de cada video pronto:
#    qualquer queda em relacao ao saldo do inicio PARA tudo. Nenhuma imagem e' gerada aqui.
#   python work/video/gerar_takes.py [chave ...]
import json, os, sys, time

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import flow_ivone as fi              # noqa: E402
fh = fi.fh
from PIL import Image               # noqa: E402

PASTA = os.path.join(AQUI, "fatia01")
QUADROS = os.path.join(PASTA, "quadros")
BRUTO = os.path.join(PASTA, "bruto")
ESTADO = os.path.join(PASTA, "estado_takes.json")
AVATAR = os.path.join(QUADROS, "avatar_asp3.png")
ADIANTADOS_MAX = 4
PAUSA_S = 3

MOV = {
    "padrao": "Very slow, gentle camera push-in; subtle natural motion in the scene, leaves trembling slightly in the air.",
    "p02": "Slow lateral dolly along the shelves of potted herbs; leaves move slightly.",
    "p03": "The hands turn the basil pot slightly toward the camera; slow push-in.",
    "p07": "Slow push-in while water pours gently from the small watering can into the herb pots and soaks into the soil.",
    "p08": "Time-lapse: the basil slowly wilts and its leaves droop down over the rim of the pot.",
    "p13": "Slow push-in toward the tall flower stalk, which sways gently.",
    "p14": "Very slow push-in; grey light from the window flickers softly with passing clouds.",
    "p15": "A few dry brown leaves crumble and fall from the dead herb; very slow push-in.",
}
FALA_MOV = ("He stays seated at the table and talks calmly to the camera with small, natural head movements "
            "and blinking; his hands rest on the table.")


def trabalhos():
    man = {p["n"]: p for p in json.load(open(os.path.join(PASTA, "manifesto.json"), encoding="utf-8"))}
    out = []
    for n, p in sorted(man.items()):
        if p["fonte"] in ("fala", "split") and n != 1:
            out.append((f"p{n:02d}_fala", AVATAR, fi.prompt_fala(p["texto"], FALA_MOV)))
        k = f"p{n:02d}_lado" if p["fonte"] == "split" else f"p{n:02d}"
        img = os.path.join(QUADROS, k + ".png")
        if p["fonte"] in ("veo", "split") and os.path.exists(img):
            out.append((k, img, fi.prompt_sem_fala(MOV.get(k, MOV["padrao"]))))
    # ⭐ planos sem imagem: falas do avatar (gratis) e variacoes de movimento das imagens que ja' existem
    #    (nenhuma imagem nova no Flow)
    for n in (17, 24):
        out.append((f"p{n:02d}_fala", AVATAR, fi.prompt_fala(man[n]["texto"], FALA_MOV)))
    for k, base, mov in EXTRA:
        out.append((k, os.path.join(QUADROS, base + ".png"), fi.prompt_sem_fala(mov)))
    return out


EXTRA = [
    ("p18", "p02", "Slow push-in toward one small herb pot on the middle shelf; a hand reaches into the frame and takes it away."),
    ("p19", "p03", "Very slow macro push-in into the dense crowd of thin basil stems packed together in the pot."),
    ("p20", "p07", "Macro slow motion: single drops of water fall onto the dark potting soil and soak in."),
    ("p22", "p14", "Very slow lateral pan along the three dried-out pots on the windowsill; dust floats in the grey light."),
    ("p23", "p07", "Too much water: the water overflows the pots, pools on the windowsill and drips over the edge."),
    ("p25", "p05", "Slow orbit around the fresh, healthy mint; the leaves glow in soft light and move gently."),
]


def carregar():
    try: return json.load(open(ESTADO, encoding="utf-8"))
    except Exception: return {}                                                    # noqa: BLE001


def gravar(e):
    json.dump(e, open(ESTADO + ".tmp", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    os.replace(ESTADO + ".tmp", ESTADO)


def main(so=None):
    est = carregar()
    jobs = [j for j in trabalhos() if not so or j[0] in so]
    s, cdp = fi.conectar()
    base = fh.creditos(s)
    print("saldo no inicio:", base, "|", len(jobs), "clipes", flush=True)
    subidos = {}

    def conferir(onde):
        c = fh.creditos(s)
        if c < base:
            print(f"⛔ o saldo caiu {base - c} ({onde}): PAREI tudo", flush=True)
            gravar(est); cdp.close(); sys.exit(2)
        return c

    def colher():
        ops = {k: v["op"] for k, v in est.items() if v.get("op") and not v.get("video") and not v.get("falhou")}
        if not ops: return 0
        st = fh.poll(s, list(ops.values()))
        for k, op in ops.items():
            if st.get(op) == "pronto":
                url = fh.media_info(s, op).get("url")
                if url:
                    est[k]["video"] = fh.download_video(s, url, os.path.join(BRUTO, k + ".mp4"))
                    gravar(est); conferir(f"depois de {k} pronto")
                    print("  pronto", k, flush=True)
            elif st.get(op) in ("falhou", "recusado"):
                est[k]["falhou"] = st.get(op); gravar(est); print("  FALHOU", k, st.get(op), flush=True)
        return sum(1 for k in ops if not est[k].get("video") and not est[k].get("falhou"))

    for k, img, prompt in jobs:
        if est.get(k, {}).get("video") or est.get(k, {}).get("op"): continue
        while colher() >= ADIANTADOS_MAX: time.sleep(15)
        for tent in range(3):
            try:
                if img not in subidos: subidos[img] = fh.upload(s, img, fi.PROJETO)[0]
                tam = Image.open(img).size
                antes = conferir(f"antes de {k}")
                op, rest = fi._gerar_video(s, prompt, subidos[img], subidos[img], tam, tam)
                if not isinstance(rest, (int, float)) or rest < antes:
                    print(f"⛔ {k}: o pedido devolveu saldo {rest} (antes {antes}): PAREI", flush=True)
                    est[k] = {"op": op}; gravar(est); cdp.close(); sys.exit(2)
                est[k] = {"op": op, "prompt": prompt}; gravar(est)
                print(f"  {k} enviado ({rest})", flush=True)
                break
            except fh.ErroFlow as e:
                if fh.e_freio(e.detalhe):
                    print(f"  freio do Google em {k}: 2 min de silencio e selo novo", flush=True)
                    time.sleep(120); fi.renovar_selo(cdp); cdp.close(); s, cdp = fi.conectar(); subidos.clear()
                    continue
                print(f"  {k}: erro do Flow {fh.motivo(e.detalhe)}", flush=True); break
        time.sleep(PAUSA_S)

    fim = time.time() + 2400
    while colher() and time.time() < fim: time.sleep(15)
    print("saldo no fim:", conferir("no fim"), "(inicio", base, ")", flush=True)
    cdp.close()


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    main(set(sys.argv[1:]) or None)
