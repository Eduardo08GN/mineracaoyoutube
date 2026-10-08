# -*- coding: utf-8 -*-
r"""PRODUCAO — o video da' para ser refeito no formato da nossa producao (avatar + b-roll do Veo)?

    python motor/producao.py --autoteste

O formato foi medido em 12 videos do Elias Yoder (docs/edicao-elias-yoder.md): ~20% do tempo o avatar
falando (cheio ou em tela dividida) e ~80% b-roll, um clipe novo a cada ~4 s — uns 250 clipes num video
de 20 min. A voz carrega toda a informacao; o b-roll so' ilustra. ⭐ Entao o que decide e' o b-roll:
o tema tem de caber em cenas GENERICAS que o Veo gera bem. Um viral cujo valor e' ver um carro especifico
ficar limpo nao vira video nosso, por mais fome que tenha.

⛔ Na duvida (o Claude falhou, o id nao voltou) o video FICA: so' sai o que o Claude disse que nao da'.
"""
import json, os, re, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path: sys.path.insert(0, AQUI)

LOTE = 60

INSTRUCAO = """You decide whether old viral YouTube videos can be REMADE in one fixed production format that uses ONLY AI-generated footage.

THE FORMAT (measured on 12 videos of the reference channel):
- About 20% of screen time is the persona talking to camera (an AI avatar on a fixed set), sometimes in split screen next to a clip.
- About 80% is B-ROLL: a new illustrative clip every ~4 seconds, roughly 250 clips for a 20-minute video, all generated with an AI video/image model.
- The persona's voice carries ALL the information. B-roll only illustrates. A viewer must never need to see a precise action or a specific real object to follow the video.

PRODUCIBLE when every scene the remake needs can be generated as GENERIC illustrative footage: food and cooking, plants and gardens, hands doing simple actions, kitchens, farms, stores, warehouses, workshops, common household objects and generic tools, generic vehicles, crowds, landscapes, old-time scenes, maps. News and real events ARE producible when the persona retells them over generic scenes.

NOT PRODUCIBLE when the value of the video depends on footage AI cannot fake convincingly or truthfully:
- a specific identifiable product, model or brand is the protagonist (a particular car model, a vintage Ferrari, a named gadget, a specific engine bay)
- a precise hands-on technical procedure the viewer must SEE to copy correctly (repair steps, wiring, detailing a specific part, a before/after transformation of a real object)
- real people or celebrities as the core, or a story that only works by showing the real recording (a viral clip, a disaster video)
- screen recordings, software, games, or data/charts as the core
- performance, sport, music, animal tricks, or a real-time experiment whose result must be filmed truthfully
- content where the visual IS the content (ASMR, satisfying cleaning, timelapse of a real build, tour of a real place)

Judge the TOPIC as the persona would retell it, not the original video's style. Examples:
- "How to SUPER CLEAN your engine bay" -> not producible: the value is watching that real engine get clean
- "5 Car Habits That Make Your Engine Last 300,000 Miles" -> producible: advice over generic car shots
- "How to Pick a Sweet Watermelon" -> producible: generic watermelons, hands tapping, a market

For each video return {{"id": "...", "produzivel": true or false, "motivo": "at most 12 words in Brazilian Portuguese"}}.
Answer with JSON only, no prose, no code fences: {{"itens": [ ... ]}}

VIDEOS:
{lista}"""


def montar_pedido(videos):
    return INSTRUCAO.format(lista="\n".join(f'- id={v["id"]} | "{v["titulo"]}"' for v in videos))


def interpretar(texto):
    """{id: {produzivel, motivo}}. So' entra item com id e com produzivel booleano."""
    t = re.sub(r"^```(?:json)?\s*|\s*```$", "", (texto or "").strip())
    ini, fim = t.find("{"), t.rfind("}")
    if ini < 0 or fim < ini: return {}
    try:
        d = json.loads(t[ini:fim + 1])
    except ValueError:
        return {}
    saida = {}
    for it in d.get("itens", []) if isinstance(d, dict) else []:
        if isinstance(it, dict) and it.get("id") and isinstance(it.get("produzivel"), bool):
            saida[str(it["id"])] = {"produzivel": it["produzivel"], "motivo": str(it.get("motivo") or "").strip()[:140]}
    return saida


def avaliar(videos, chamar=None):
    """videos = [{id, titulo}] -> {id: {produzivel, motivo}}, em lotes de LOTE titulos por pedido."""
    if chamar is None:
        from persona import chamar_claude as chamar
    saida = {}
    for i in range(0, len(videos), LOTE):
        pedido = montar_pedido(videos[i:i + LOTE])
        # ⭐ uma segunda tentativa: em 08/10 o pedido do Alter Förster (30 titulos) passou de 5 min sem resposta
        try:
            r = chamar(pedido)
        except Exception:                                                  # noqa: BLE001
            r = chamar(pedido)
        saida.update(interpretar(r))
    return saida


def inviaveis(videos, avaliacao):
    """Os ids que o Claude disse que nao da'. ⛔ Sem resposta para o id: fica."""
    return {v["id"] for v in videos if avaliacao.get(v["id"], {}).get("produzivel") is False}


def _autoteste():
    ok = True
    def caso(nome, cond):
        nonlocal ok; print(("  OK  " if cond else "  ERRO"), nome); ok &= bool(cond)
    vs = [{"id": "A", "titulo": "How to SUPER CLEAN your Engine Bay"}, {"id": "B", "titulo": "How to Pick a Sweet Watermelon"},
          {"id": "C", "titulo": "Sem resposta"}]
    caso("pedido leva o formato medido e os titulos", "every ~4 seconds" in montar_pedido(vs) and "SUPER CLEAN" in montar_pedido(vs))
    resp = '```json\n{"itens": [{"id": "A", "produzivel": false, "motivo": "o valor é ver o motor real"},' \
           ' {"id": "B", "produzivel": true, "motivo": "melancias genéricas"}, {"id": "X", "produzivel": "talvez"}]}\n```'
    r = interpretar(resp)
    caso("⭐ resposta com cerca de codigo e' lida", r["A"]["produzivel"] is False and r["B"]["produzivel"] is True)
    caso("produzivel que nao e' booleano e' ignorado", "X" not in r)
    caso("⭐ so' sai o que o Claude disse que nao da' (sem resposta fica)", inviaveis(vs, r) == {"A"})
    caso("resposta quebrada: ninguem sai", inviaveis(vs, interpretar("desculpe")) == set())
    pedidos = []
    avaliar([{"id": str(i), "titulo": "t"} for i in range(130)], chamar=lambda p: pedidos.append(p) or "{}")
    caso(f"lotes de {LOTE} titulos", len(pedidos) == 3)
    tentativas = []
    def instavel(p):
        tentativas.append(p)
        if len(tentativas) == 1: raise TimeoutError("demorou")
        return resp
    caso("⭐ o Claude demorou: tenta de novo uma vez", avaliar(vs, chamar=instavel)["A"]["produzivel"] is False
         and len(tentativas) == 2)
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.exit(0 if _autoteste() else 1)
