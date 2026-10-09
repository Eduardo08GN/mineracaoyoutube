# Fatia 1 do primeiro video (secoes 1, 2 e 4 do projeto "Anbauanleitung ... 12 Klosterkraeuter"): o manifesto de producao.
#   python work/video/fatia01.py      -> work/video/fatia01/manifesto.json
# fonte: fala (Veo, voz do personagem) | split (fala do Veo + imagem ao lado) | veo (b-roll em video) |
#        img (imagem com movimento lento: so' reserva) | mg (motion graphics do livro)
# ⛔ assinatura do Elias: b-roll sao CLIPES EM MOVIMENTO de 3-6 s, nao imagens paradas -> tudo vira Veo;
#    tela dividida = faixa central do MESMO plano do avatar a esquerda + clipe do assunto a direita, corte seco.
import json, os

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))
PROJ = os.path.join(RAIZ, "data", "projetos", "20261008-anbauanleitung-fur-30-wichtige-krauter-k", "projeto.json")
SAIDA = os.path.join(AQUI, "fatia01")

# cenario FIXO de todas as falas (o avatar so' fala: nada de acao complexa, como no canal do Elias)
CENARIO = ("Bruder Wendelin sits at a worn oak table in a quiet vaulted monastery kitchen, soft daylight from a small window on the "
           "left, dried herb bundles and copper pots softly out of focus behind him. Medium close-up from the chest up, eye level, "
           "static camera on a tripod, shallow depth of field, natural warm colors, photorealistic. He looks directly into the "
           "camera, hands resting calmly on the table, and says in German, slowly and warmly: \"{fala}\" Then he pauses and keeps "
           "looking kindly into the camera. No music, no subtitles, no text on screen.")
FOTO = (" Photorealistic, natural soft daylight, warm muted colors, shallow depth of field, 35mm documentary photograph. "
        "No faces, no text, no labels, no price tags, no logos.")
VIDEO = (" Photorealistic, natural soft daylight, warm muted colors, shallow depth of field, slow gentle camera movement. "
         "No faces, no text, no labels, no logos, no music.")

CENAS = {   # n do plano -> (fonte, pedido em ingles)
    2: ("veo", "A small German garden centre aisle in spring: wooden shelves full of little potted herbs and stacked bags of potting soil, nobody in the aisle."),
    3: ("veo", "Close-up of the hands of an older woman in a beige cardigan holding a small supermarket pot of fresh basil in front of a shelf of herbs."),
    4: ("veo", "A small plastic pot of curly parsley standing on a garden centre shelf among other herb pots, close-up."),
    5: ("veo", "A small pot of fresh mint with bright green leaves on a garden centre shelf, close-up."),
    6: ("veo", "Three small herb pots, basil, parsley and mint, lined up on a sunny white windowsill of an old German apartment."),
    7: ("veo", "Close-up of an older person's hands watering three small herb pots on a sunny windowsill with a small tin watering can, water soaking into the soil."),
    8: ("veo", "Time-lapse of a potted basil plant on a windowsill slowly wilting, its leaves drooping down over the rim of the pot."),
    9: ("veo", "Macro close-up of basil leaves with blackened, dried edges, sad and damaged."),
    10: ("veo", "Macro close-up of a soft, brown, rotting basil stem right at the soil surface in a plastic pot."),
    12: ("veo", "A thin, pale, leggy parsley plant stretching upward in a small pot on a windowsill, weak and floppy."),
    13: ("veo", "Close-up of a parsley plant bolting, a tall flower stalk with small umbels shooting up from the pot."),
    14: ("veo", "Three sad, half-dead herb pots on a windowsill, grey daylight from outside, melancholic mood."),
    15: ("veo", "Close-up of a completely dried-out dead herb in a small pot, brown crumbling leaves."),
    16: ("veo", "An older person's hand gently touching a wilted, collapsed herb plant in a pot on a windowsill."),
    17: ("veo", "Close-up of old, weathered hands gently cradling a small healthy green seedling with a little ball of dark soil, soft morning light."),
    18: ("veo", "Close-up of a hand placing a single small herb pot on a shop counter next to a cash register, the shop softly blurred."),
    19: ("veo", "Top-down close-up of one small pot densely overcrowded with dozens of crammed basil seedlings competing for space."),
    20: ("veo", "Slow-motion macro of a single water droplet falling onto dry, cracked potting soil in a pot and soaking in."),
    22: ("veo", "Dry, cracked soil in an empty terracotta pot on a stone windowsill, harsh light."),
    23: ("veo", "Waterlogged, soggy potting soil in a plastic pot with water standing on top and dripping from the drainage holes into a full saucer."),
    24: ("veo", "Lush, healthy green herbs growing abundantly in a raised bed of a monastery herb garden, stone wall behind."),
    25: ("veo", "Close-up of fresh herb leaves side by side on an old wooden table: basil, parsley, mint, thyme, sage, rosemary."),
    42: ("mg", "Shelves of old glass jars filled with dried herbs in a vaulted monastery cellar, candle-warm light."),
    43: ("mg", "A wicker basket overflowing with many bunches of freshly cut herbs on a stone floor of a monastery garden."),
    44: ("mg", ""),
    45: ("mg", ""),
}


def main():
    p = json.load(open(PROJ, encoding="utf-8"))
    planos = []
    for pl in p["planos"]:
        if pl["secao"] not in (1, 2, 4): continue
        n, tipo = pl["n"], pl["tipo"]
        item = {"n": n, "secao": pl["secao"], "tipo": tipo, "texto": pl["texto"], "dur_estimada": pl["dur"]}
        if tipo == "avatar":
            item.update(fonte="fala", voz="veo", pedido=CENARIO.format(fala=pl["texto"]))
        elif tipo == "split":
            f, ped = CENAS[n]
            item.update(fonte="split", voz="veo", pedido=CENARIO.format(fala=pl["texto"]), lado=ped + VIDEO)
        else:
            f, ped = CENAS[n]
            item.update(fonte=f, voz="minimax", pedido=(ped + (VIDEO if f == "veo" else FOTO)) if ped else "")
        planos.append(item)
    os.makedirs(SAIDA, exist_ok=True)
    json.dump(planos, open(os.path.join(SAIDA, "manifesto.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    from collections import Counter
    print(len(planos), "planos:", dict(Counter(x["fonte"] for x in planos)))


if __name__ == "__main__":
    main()
