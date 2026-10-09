# INFOGRAFICOS (Eduardo, 09/10): de vez em quando, no lugar do b-roll de terceiros, um plano esquematico, ilustrativo e
# explicativo — o corte do vaso com a drenagem, a raiz partida em quatro, o canteiro em rodizio... Gerados como IMAGEM no
# Flow (so' os modelos de imagem gratis: flow_ivone.imagem_feliz, que para se um modelo cobrar), no estilo de um
# herbario de mosteiro (tinta e aquarela em papel antigo), SEM texto (os modelos escrevem letra errada).
# Na montagem (montar_completo.Banco) entra um a cada ~10 planos de b-roll, com movimento lento de camera.
#   python work/video/gerar_infografos.py [chave ...]   ->  work/video/completo/infografos/<chave>.png + infografos.json
import json, os, sys, time

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
PASTA = os.path.join(AQUI, "completo", "infografos")
ESTILO = (" Hand-drawn explanatory schematic illustration in the style of an old monastery herbal manuscript: fine sepia ink "
          "lines with soft muted watercolor washes on aged cream paper, clean composition with plenty of empty paper, "
          "arrows and simple numbered circles as the only markers. 16:9 landscape. Absolutely no text, no letters, "
          "no words, no labels, no numbers written out, no watermark.")
# chave: (etiqueta de b-roll onde entra, o desenho)
INFOGRAFOS = {
    "vaso_drenagem": ("erde", "Cross-section of a terracotta pot: a drainage hole at the bottom, a layer of gravel, sandy herb "
                      "soil above, a small thyme plant with its roots, an arrow showing excess water running out of the hole."),
    "raiz_quatro": ("basilikum", "A supermarket basil root ball shown in four steps from left to right: the dense root ball, "
                    "two hands pulling it apart, four separate clumps, four small terracotta pots each with one clump."),
    "mediterraneo": ("mittelmeer", "A sunny dry rocky slope above the sea in cross-section, thyme, sage and oregano growing "
                     "between stones, long thin roots going deep, arrows showing rain water running quickly down the slope."),
    "rodizio": ("petersilie", "Four garden beds seen from above in a row, each a different year: parsley in the first, then "
                "beans, then cabbage, then a resting bed with clover, a curved arrow connecting them in a cycle."),
    "semeadura": ("saat", "Cross-section of soil in a seed tray: tiny seeds lying at different depths, a fine layer of soil "
                  "on top, a hand-drawn watering can sprinkling gentle drops, small sprouts emerging on the right side."),
    "oleo_folha": ("labor", "A sage leaf magnified like under a loupe: tiny oil glands drawn as golden droplets on the leaf "
                   "surface, sun rays above, a small distillation flask beside it with a single golden drop."),
    "secagem": ("trocknen", "Bundles of herbs hanging upside down from a wooden beam in an airy attic, arrows showing air "
                "flowing around them, a glass jar with dried leaves below."),
    "rizoma": ("minze", "Mint plant in cross-section under the soil: long runners (rhizomes) spreading sideways, and next to "
               "it a buried bucket without bottom that stops the runners, arrows marking the barrier."),
    "sol_agua": ("garten", "Three herb pots side by side with symbols above them: a full sun with a single water drop, a half "
                 "sun with two drops, a cloud-shaded sun with three drops, drawn as a simple comparison chart."),
    "dedo_terra": ("erde", "A finger pushed into the soil of a pot up to the second knuckle, the soil drawn in cross-section: "
                   "dry on top, moist below, a check mark circle and a small clock circle beside it."),
}


def main(so=None):
    import flow_ivone as fi
    fh = fi.fh
    os.makedirs(PASTA, exist_ok=True)
    idx_arq = os.path.join(PASTA, "infografos.json")
    idx = json.load(open(idx_arq, encoding="utf-8")) if os.path.exists(idx_arq) else {}
    s, cdp = fi.conectar()
    base = fh.creditos(s)
    print("saldo no inicio:", base, flush=True)
    try:
        for k, (tag, desenho) in INFOGRAFOS.items():
            if so and k not in so: continue
            arq = os.path.join(PASTA, k + ".png")
            if os.path.exists(arq): continue
            for _ in range(3):
                try:
                    mid, modelo = fi.imagem_feliz(s, desenho + ESTILO, [], aspecto=3)
                    if modelo in fh._estado_modelos()["cobra"]:
                        print(f"⛔ o modelo {modelo} cobrou: PAREI"); return
                    fh.baixar_limpa(s, mid, arq)
                    idx[k] = {"tag": tag, "modelo": modelo, "id": mid}
                    json.dump(idx, open(idx_arq, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
                    print(f"  {k} ({modelo})", flush=True)
                    break
                except fh.Freio:
                    print("  freio: 2 min e selo novo", flush=True)
                    time.sleep(120); fi.renovar_selo(cdp); cdp.close(); s, cdp = fi.conectar()
            if fh.creditos(s) < base:
                print(f"⛔ o saldo caiu ({base} -> {fh.creditos(s)}): PAREI"); return
            time.sleep(4)
    finally:
        cdp.close()


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    main(set(sys.argv[1:]) or None)
