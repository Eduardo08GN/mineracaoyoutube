# Gera os clipes da fatia 1 pelo BACKEND da ferramenta ow_agente (flow_http), so' no gratis.
#   python work/video/gerar_fatia.py
# Estado em work/video/fatia01/estado.json (retoma de onde parou). Imagens: ogiZ0b gratis em 16:9.
# Videos: Veo 3.1 Lite [Lower Priority] em 16:9, quadro inicial = final = a imagem do plano.
#   fala/split  -> quadro fixo do Wendelin na cozinha (o mesmo em todas as falas), a fala no Dialogue
#   veo/lado    -> imagem do b-roll gerada a partir do texto, sem fala
# ⛔ trava de custo: saldo antes/depois de cada geracao; qualquer debito PARA tudo.
import json, os, shutil, sys, time
from concurrent.futures import ThreadPoolExecutor

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import flow_ivone as fi              # noqa: E402
fh = fi.fh

PASTA = os.path.join(AQUI, "fatia01")
QUADROS = os.path.join(PASTA, "quadros")
BRUTO = os.path.join(PASTA, "bruto")
ESTADO = os.path.join(PASTA, "estado.json")
AVATAR = os.path.join(QUADROS, "avatar_asp3.png")
PAUSA_S = 4                          # entre geracoes de video (o piloto usa 3)

MOVIMENTO = {   # o movimento de cada b-roll (a imagem vem do pedido do manifesto)
    "padrao": "Very slow, gentle camera push-in; subtle natural motion in the scene, soft light flickering slightly.",
    7: "Slow push-in while water pours gently from the small watering can into the herb pots and soaks into the soil.",
    8: "Time-lapse: the basil slowly wilts and its leaves droop down over the rim of the pot.",
    17: "The weathered hands gently lift and cradle the seedling; slow push-in.",
    18: "The hand slowly sets the herb pot down on the counter and withdraws; the background stays softly blurred.",
    20: "Slow-motion: a single water droplet falls onto the dry cracked soil and soaks in.",
}


def carregar():
    try: return json.load(open(ESTADO, encoding="utf-8"))
    except Exception: return {}                                                   # noqa: BLE001


def gravar(e):
    json.dump(e, open(ESTADO + ".tmp", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    os.replace(ESTADO + ".tmp", ESTADO)


def trabalhos(man):
    """(chave, tipo, texto/prompt) de cada clipe a gerar. Split = fala + lado."""
    out = []
    for p in man:
        n = p["n"]
        if p["fonte"] in ("fala", "split"):
            out.append((f"p{n:02d}_fala", "fala", p["texto"], None))
        if p["fonte"] == "split":
            out.append((f"p{n:02d}_lado", "broll", p["lado"], n))
        if p["fonte"] == "veo":
            out.append((f"p{n:02d}", "broll", p["pedido"], n))
    return out


def main():
    man = json.load(open(os.path.join(PASTA, "manifesto.json"), encoding="utf-8"))
    est = carregar()
    jobs = trabalhos(man)
    # o teste aprovado vira o plano 1
    t = os.path.join(BRUTO, "teste_fala_p01_169b.mp4")
    if os.path.exists(t) and not est.get("p01_fala", {}).get("video"):
        shutil.copy2(t, os.path.join(BRUTO, "p01_fala.mp4"))
        est["p01_fala"] = {"video": os.path.join(BRUTO, "p01_fala.mp4")}; gravar(est)

    s, cdp = fi.conectar()
    c0 = fh.creditos(s); print("creditos no inicio:", c0, flush=True)

    # 1) imagens dos b-rolls (gratis, 3 no ar)
    falta_img = [(k, txt) for k, tipo, txt, _n in jobs if tipo == "broll" and not os.path.exists(os.path.join(QUADROS, k + ".png"))]

    def uma_imagem(k, txt):
        for tent in range(3):
            try:
                mid = fi.imagem(s, txt, [], aspecto=3, modelo=fh.MODELOS_IMAGEM[fh._proximo_modelo(fh._modelo_imagem[0]) or 0])
                fh.baixar_limpa(s, mid, os.path.join(QUADROS, k + ".png"))
                return k, "ok"
            except fh.ErroFlow as e:
                if fh.e_conteudo(e.detalhe): return k, "conteudo: " + fh.motivo(e.detalhe)
                if fh.e_cota(e.detalhe): fh._modelo_imagem[0] = (fh._modelo_imagem[0] + 1) % len(fh.MODELOS_IMAGEM)
                time.sleep(20 * (tent + 1))
            except Exception as e:                                              # noqa: BLE001
                time.sleep(10); last = str(e)[:100]
        return k, "falhou"
    if falta_img:
        print(f"{len(falta_img)} imagens de b-roll…", flush=True)
        with ThreadPoolExecutor(3) as ex:
            for k, r in ex.map(lambda a: uma_imagem(*a), falta_img):
                print("  imagem", k, r, flush=True)
    if fh.creditos(s) < c0: raise SystemExit("⛔ as imagens cobraram creditos: parei")

    # 2) videos (um a um, com pausa; freio -> descansa, renova o selo, conexao nova)
    ops = {}
    for k, tipo, txt, n in jobs:
        if est.get(k, {}).get("video") or est.get(k, {}).get("op"):
            if est.get(k, {}).get("op") and not est[k].get("video"): ops[k] = est[k]["op"]
            continue
        quadro = AVATAR if tipo == "fala" else os.path.join(QUADROS, k + ".png")
        if not os.path.exists(quadro):
            print("  sem quadro para", k, flush=True); continue
        prompt = fi.prompt_fala(txt) if tipo == "fala" else fi.prompt_sem_fala(MOVIMENTO.get(n, MOVIMENTO["padrao"]))
        for tent in range(4):
            try:
                from PIL import Image
                mid = fh.upload(s, quadro, fi.PROJETO)[0]
                tam = Image.open(quadro).size
                saldo = fh.creditos(s)
                op, rest = fi._gerar_video(s, prompt, mid, mid, tam, tam)
                if isinstance(rest, (int, float)) and rest < saldo:
                    raise SystemExit(f"⛔ {k} cobrou {saldo - rest} creditos: parei (so' gratis)")
                ops[k] = op; est[k] = {"op": op, "prompt": prompt}; gravar(est)
                print(f"  {k} enviado", flush=True)
                break
            except fh.ErroFlow as e:
                if fh.e_freio(e.detalhe):
                    print(f"  freio do Google em {k}: descanso 2 min e renovo o selo", flush=True)
                    time.sleep(120); fi.renovar_selo(cdp); cdp.close(); s, cdp = fi.conectar()
                    continue
                print(f"  {k}: erro do Flow {fh.motivo(e.detalhe)}", flush=True); break
        time.sleep(PAUSA_S)

    # 3) espera e baixa
    print(f"esperando {len(ops)} videos…", flush=True)
    feitos, falta = fi.esperar_e_baixar(s, ops, BRUTO, prazo=2400)
    for k, arq in feitos.items():
        est.setdefault(k, {})["video"] = arq; gravar(est)
        print("  baixado", k, "ok" if arq else "FALHOU", flush=True)
    print("ainda gerando:", list(falta), "| creditos no fim:", fh.creditos(s), "(inicio", c0, ")", flush=True)
    cdp.close()


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    main()
