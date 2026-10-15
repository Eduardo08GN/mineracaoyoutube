# MODO HEADCAST: uma imagem gerada por frase (~3,5 s), personagens consistentes, avatar a cada ~35 s.
# Imagens no Google Vids (perfil Dolphin "12 Ivone"):
#   - cena com personagem: EDITA o retrato-ancora dele no historico do painel (o modo editar preserva rosto, roupa e casa);
#   - cena sem personagem (objeto, paisagem): gera direto com o estilo aprovado (vids_imagem.prompt).
#   python work/video/headcast.py <pasta do projeto> planejar     roteiro.md -> planos.json (Claude escreve as cenas)
#   python work/video/headcast.py <pasta do projeto> ancoras      gera os retratos-ancora que faltam (ref/<nome>.png)
#   python work/video/headcast.py <pasta do projeto> imagens [n]  gera as imagens que faltam (retoma de onde parou)
import json
import os
import re
import sys
import time

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
PPM = 155                       # palavras por minuto da narracao
PALAVRAS_PLANO = 9.5            # ~3,7 s por imagem (Mama Pearline: mediana 3,2 s)
AVATAR_CADA = 90                # palavras entre duas aparicoes do avatar (~35 s)

ESTILO_ANCORA = ("A still frame from a real creator's casual home video, shot on an old consumer camcorder around 2012, "
                 "wide 16:9 landscape frame. ")
TECNICA_ANCORA = (" Ordinary daylight, automatic white balance, slightly soft focus, mild sensor noise, muted natural "
                  "colors, deep focus, face clearly visible. Realistic skin texture, natural facial asymmetry. No beauty "
                  "filter, no cinematic lighting, no bokeh, no text, no logos.")

# os retratos-ancora (um por personagem da lore). O texto e' o que identifica o item no historico do painel.
ANCORAS = {
    "opal": None,               # ref/opal.png, gerado a mao em 12/10 (o retrato do avatar)
    "opal_1966": "Eastern Kentucky coal camp, 1966. A 16-year-old girl with light brown hair in a ponytail tied with a "
                 "ribbon, freckles, light blue-gray eyes, a home-sewn blue cotton dress, standing in her mother's small "
                 "coal camp kitchen beside a white enamel wood cook stove, looking a little shy.",
    "hazel": "Eastern Kentucky coal camp, 1966. A 42-year-old coal miner's wife with dark brown hair pinned back, strong "
             "work-worn hands, a serious but kind face, a faded flour-sack print dress and a white apron, standing at "
             "her wood cook stove in a small company-house kitchen.",
    "clyde": "Eastern Kentucky coal camp, 1960s. A lean 45-year-old coal loader with coal dust in the creases of his face "
             "and hands, a cloth miner's cap, denim overalls over a gray work shirt, a tin lunch bucket, standing on the "
             "porch of a small wooden company house.",
    "wanda_1966": "Eastern Kentucky, 1966. A 13-year-old girl with dark curly hair, a mischievous grin, a red gingham "
                  "dress, standing in a grassy family cemetery on a hilltop with mountains behind her.",
    "big_opal": "Eastern Kentucky mountains, 1950s. A heavyset 60-year-old mountain grandmother with a long gray braid, "
                "a sunbonnet pushed back, a plain brown work dress and apron, standing in front of a log cabin at the head "
                "of a hollow beside a wood stove seen through the open door.",
    "elmer": "Eastern Kentucky, 1966. A thin 65-year-old country preacher in a worn black suit and white shirt with no "
             "tie, gray hair combed back, a small black Bible in his hand, standing at a long homemade table on the "
             "grounds of a hilltop family cemetery on Decoration Day.",
    "earl_young": "Eastern Kentucky, 1969. A lean 22-year-old coal miner with dark hair combed back, a shy smile, a "
                  "plaid flannel shirt with rolled sleeves, standing on the porch of a small wooden house in a hollow.",
    "earl_old": "Eastern Kentucky, 2010s. A 68-year-old retired railroad man with a gray crew cut, suspenders over a "
                "white undershirt, a weathered kind face, sitting in a rocking chair on the front porch of a wooden "
                "farmhouse with green mountains behind him.",
    "donna_small": "Eastern Kentucky, 1973. A toddler girl about two years old with light brown curls, a little cotton "
                   "dress, sitting on a braided rug on a wooden kitchen floor holding a piece of cornbread.",
    "donna_adult": "Dayton, Ohio, present day. A 55-year-old woman with shoulder-length light brown hair going gray, "
                   "reading glasses on her head, a cardigan, standing in a modest suburban kitchen talking on her phone.",
    "kaylee": "Dayton, Ohio, present day. A 27-year-old woman with long light brown hair in a messy bun, a hoodie, sitting "
              "on a couch in a small apartment texting on her phone, a little smile.",
}

PEDIDO_CENAS = """You plan the IMAGES of a talking-head cooking video narrated by Mamaw Opal Sizemore, a 76-year-old
Appalachian grandmother (born 1950 in the Lynch coal camp, Harlan County, Kentucky; lives up Cloverlick Holler).
Every image is a candid home-camcorder still that shows LITERALLY what the line says, in the right era.

Characters (use these exact ids for "ancora"; the image will be an edit of that character's fixed reference portrait):
- opal: Opal today, 76, silver-white bun, wire-rim glasses, blue flowered housedress, white apron, her farmhouse kitchen
  with a black wood stove and shelves of canned jars, a hillside garden, a porch with two rocking chairs.
- opal_1966: Opal at 16 in 1966 (ponytail with ribbon, freckles). Use for any memory of young Opal (1960s, early 1970s).
- hazel: her mama in the 1960s (dark hair pinned back, flour-sack dress, apron). Use for "my mama" memories.
- clyde: her daddy, coal loader in the 1950s-60s. big_opal: her grandmother in the 1950s, log cabin at the head of the holler.
- wanda_1966: her sister at 13. elmer: Brother Elmer Hall, country preacher, 1966.
- earl_young: her husband Earl 1969-1977 (young miner). earl_old: Earl in his 60s-70s (porch, rocking chair).
- donna_small: daughter Donna as a toddler in 1973. donna_adult: Donna today in Dayton, Ohio. kaylee: granddaughter today, Dayton.
- nenhum: no recurring character (hands only, objects, food close-ups, places, landscapes, crowds).

For each shot return: "n", "ancora" (one id above), "cena" (English, 1-2 sentences). Rules:
- When ancora is a character, "cena" says what changes from the reference: the action, place, framing and era props.
  Example: "She pours the batter into a smoking cast iron skillet on the wood stove, close on her hands and the skillet."
- When the line is about the cooking step, show the step (hands, skillet, batter, buttermilk, cornmeal, oven) in Opal's
  kitchen with ancora "opal" (hands and apron visible) or "nenhum" for tight close-ups of food or objects.
- Vary the scale constantly: close detail, hands at work, medium, wide room or landscape. Never 3 close-ups in a row.
- Past memories happen in their era: 1950s-60s coal camp company houses, the company store, scrip, the mill on Looney
  Creek with a big millstone, Decoration Day dinner on the grounds at a hilltop family cemetery, the 1973 Brookside
  strike (miners on a picket line in winter coats), hog killing time in November.
- The first shot of each numbered item ("Number twenty-four...") shows a small handwritten paper card with that number
  written in pencil, propped against something on the table in the scene (the only text allowed in any image).
- No brand names, no labels, no other text, no modern things in past scenes.
Return ONLY JSON: {{"planos": [{{"n": 1, "ancora": "...", "cena": "..."}}]}}

Shots (n | block | narration line):
{linhas}"""


def blocos(roteiro):
    t = re.sub(r"<!--.*?-->", "", open(roteiro, encoding="utf-8").read(), flags=re.S)
    t = re.sub(r"^#.*$", "", t, flags=re.M)
    out = []
    for m in re.finditer(r"\[([A-Z0-9]+)\]\s*(.*?)(?=\n\[[A-Z0-9]+\]|\Z)", t, re.S):
        out.append((m.group(1), " ".join(m.group(2).split())))
    return out


def recortar(roteiro):
    """Planos de ~PALAVRAS_PLANO palavras, cortados em fronteira de frase (frase longa vira 2-3 planos)."""
    planos, desde_av = [], AVATAR_CADA
    for bloco, texto in blocos(roteiro):
        frases = re.split(r"(?<=[.!?])\s+", texto)
        for i, f in enumerate(frases):
            w = f.split()
            k = max(1, round(len(w) / PALAVRAS_PLANO))
            partes = [" ".join(w[j * len(w) // k:(j + 1) * len(w) // k]) for j in range(k)]
            for parte in partes:
                if planos and len(parte.split()) < 4 and planos[-1]["bloco"] == bloco:
                    planos[-1]["texto"] += " " + parte; continue
                tipo = "imagem"
                # avatar: a identificacao, a abertura do truque e do fecho, e depois a cada ~35 s numa frase curta
                if (not planos or bloco in ("ID",) or (bloco in ("TRUQUE", "FECHO") and i == 0 and parte == partes[0])
                        or (desde_av >= AVATAR_CADA and len(f.split()) <= 16 and parte == partes[0])):
                    tipo = "avatar"; desde_av = 0
                desde_av += len(parte.split())
                planos.append({"n": len(planos) + 1, "bloco": bloco, "texto": parte, "tipo": tipo})
    n_av = 0
    for p in planos:                                   # 1 em cada 3 aparicoes do avatar vira tela dividida
        if p["tipo"] == "avatar":
            n_av += 1
            if n_av % 3 == 0 and p["bloco"] not in ("ID", "FECHO"): p["tipo"] = "split"
    return planos


def planejar(proj):
    from projeto_video import _chamar_claude, _json_de
    planos = recortar(os.path.join(proj, "roteiro.md"))
    alvo = [p for p in planos if p["tipo"] in ("imagem", "split")]
    for i in range(0, len(alvo), 45):
        lote = alvo[i:i + 45]
        linhas = "\n".join(f"{p['n']} | {p['bloco']} | {p['texto']}" for p in lote)
        d = _json_de(_chamar_claude(PEDIDO_CENAS.format(linhas=linhas)))
        por_n = {int(x["n"]): x for x in d.get("planos", [])}
        for p in lote:
            x = por_n.get(p["n"])
            if x: p["ancora"], p["cena"] = x.get("ancora", "nenhum"), x.get("cena", "")
        print(f"cenas {i + len(lote)}/{len(alvo)}", flush=True)
    json.dump(planos, open(os.path.join(proj, "planos.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    w = sum(len(p["texto"].split()) for p in planos)
    print(f"{len(planos)} planos ({sum(p['tipo'] == 'imagem' for p in planos)} imagens, "
          f"{sum(p['tipo'] == 'avatar' for p in planos)} avatar, {sum(p['tipo'] == 'split' for p in planos)} tela dividida), "
          f"~{w / PPM:.1f} min")


# ── Vids ──
def _historico(pg, trecho):
    """O item do historico do painel cujo pedido contem `trecho` (o mais antigo, que e' o retrato original)."""
    itens = pg.query_selector_all('[aria-label^="Criar imagem, "]')
    for it in itens:
        if trecho in (it.get_attribute("aria-label") or ""):
            return it
    return None


def _limpar_caixa(pg, caixa):
    """A caixa guarda o texto quando a geracao falha: sem limpar, o pedido seguinte gruda no anterior."""
    caixa.click(); time.sleep(.3)
    pg.keyboard.press("Control+A"); pg.keyboard.press("Delete"); time.sleep(.3)
    if (caixa.input_value() or "").strip(): caixa.fill(""); time.sleep(.3)


def _erros(pg):
    t = pg.get_by_text("Algo deu errado", exact=False)
    return sum(1 for i in range(t.count()) if t.nth(i).is_visible())


def _editar(pg, item, instrucao):
    import vids_imagem as v
    item.scroll_into_view_if_needed(); time.sleep(1)
    img = item.query_selector("img") or item
    img.hover(); time.sleep(1)
    b = img.bounding_box()
    pg.mouse.click(b["x"] + b["width"] / 2 + 36, b["y"] + b["height"] - 28); time.sleep(3)   # 3o botao: editar
    antes = set(v._imagens(pg))
    caixa = pg.locator("textarea:visible").last
    _limpar_caixa(pg, caixa); pg.keyboard.type(instrucao, delay=5); time.sleep(1)
    pg.get_by_role("button", name="Criar").last.click()
    return antes


def _gerando(pg):
    g = pg.get_by_text("Gerando", exact=False)
    return any(g.nth(i).is_visible() for i in range(g.count()))


def _ocioso(pg, espera_s=180):
    """Espera nenhum "Gerando…" visivel (imagem atrasada nao pode cair no plano seguinte). Travou: recarrega a pagina."""
    import vids_imagem as v
    fim = time.time() + espera_s
    while time.time() < fim:
        if not _gerando(pg): return
        time.sleep(5)
    print("   painel travado em Gerando: recarregando a pagina", flush=True)
    pg.reload(wait_until="domcontentloaded"); time.sleep(10)
    v._painel_imagem(pg); time.sleep(3)


def _esperar_nova(pg, antes, espera_s=300):
    import vids_imagem as v
    fim = time.time() + espera_s
    err0 = _erros(pg)
    while time.time() < fim:
        time.sleep(5)
        if _erros(pg) > err0: raise RuntimeError("o Vids respondeu 'Algo deu errado'")
        nova = next((s for s in v._imagens(pg) if s not in antes), None)
        if nova: return nova
    raise RuntimeError("a imagem nao apareceu a tempo")


def _sair_edicao(pg):
    """Sai do modo editar (senao a proxima edicao parte da ULTIMA imagem e o rosto deriva)."""
    for _ in range(3):
        b = pg.locator('[aria-label="Concluir edição"]:visible, [data-tooltip="Concluir edição"]:visible')
        if not b.count(): return
        b.first.click(); time.sleep(2)


def _baixar(pg, src, saida):
    from io import BytesIO
    from PIL import Image
    r = pg.context.request.get(src)
    if r.status != 200: raise RuntimeError(f"download falhou: HTTP {r.status}")
    im = Image.open(BytesIO(r.body())).convert("RGB"); im.save(saida)
    return im.size


def _texto_ancora(nome):
    if nome == "opal":
        return "A 76-year-old Appalachian grandmother from eastern Kentucky sits at her kitchen table"
    return ANCORAS[nome][:90]


def gerar_ancoras(proj):
    import vids_imagem as v, ivone
    from playwright.sync_api import sync_playwright
    os.makedirs(os.path.join(proj, "ref"), exist_ok=True)
    with sync_playwright() as p:
        pg = v._aba(ivone.conectar(p)); pg.bring_to_front()
        for nome, desc in ANCORAS.items():
            arq = os.path.join(proj, "ref", nome + ".png")
            if os.path.exists(arq) or not desc: continue
            v._painel_imagem(pg); _sair_edicao(pg)
            antes = set(v._imagens(pg))
            caixa = pg.locator("textarea:visible").last
            caixa.click(); pg.keyboard.type(ESTILO_ANCORA + desc + TECNICA_ANCORA, delay=5); time.sleep(1)
            pg.get_by_role("button", name="Criar").last.click()
            print(nome, _baixar(pg, _esperar_nova(pg, antes), arq), flush=True)


def gerar_imagens(proj, limite=None):
    import vids_imagem as v, ivone
    from playwright.sync_api import sync_playwright
    planos = json.load(open(os.path.join(proj, "planos.json"), encoding="utf-8"))
    pasta = os.path.join(proj, "imagens"); os.makedirs(pasta, exist_ok=True)
    feitos = 0
    with sync_playwright() as p:
        pg = v._aba(ivone.conectar(p)); pg.bring_to_front()
        so = os.environ.get("HC_SO")          # "nenhum" | "personagens" (varios trabalhadores em abas diferentes)
        tras = os.environ.get("HC_ORDEM", "tras" if so == "nenhum" else "frente") == "tras"
        for pl in (list(reversed(planos)) if tras else planos):
            if pl["tipo"] not in ("imagem", "split") or not pl.get("cena"): continue
            if os.environ.get("HC_LISTA") and pl["n"] not in json.load(open(os.environ["HC_LISTA"])): continue
            sem = pl.get("ancora", "nenhum") == "nenhum"
            if (so == "nenhum" and not sem) or (so == "personagens" and sem): continue
            arq = os.path.join(pasta, f"{pl['n']:04d}.png")
            if os.path.exists(arq): continue
            if limite and feitos >= limite: break
            try:
                v._painel_imagem(pg); _ocioso(pg); _sair_edicao(pg)
                anc = pl.get("ancora", "nenhum")
                item = _historico(pg, _texto_ancora(anc)) if anc in ANCORAS else None
                if item:
                    tem_cartao = "card" in pl["cena"].lower()
                    instr = ("Keep this exact same person: same face, same hair and same clothes, nothing added to the face, "
                             "same home-camcorder look. " + pl["cena"] + " Candid, not looking at the camera, wide 16:9, "
                             "deep focus, muted colors. " + ("" if tem_cartao else "No text, no cards, no labels anywhere."))
                    antes = _editar(pg, item, instr)
                else:
                    antes = set(v._imagens(pg))
                    caixa = pg.locator("textarea:visible").last
                    _limpar_caixa(pg, caixa); pg.keyboard.type(v.prompt(pl["cena"]) + ("" if "card" in pl["cena"].lower() else " No cards or labels."), delay=5); time.sleep(1)
                    pg.get_by_role("button", name="Criar").last.click()
                src = _esperar_nova(pg, antes)
                if os.path.exists(arq): continue                   # o outro trabalhador chegou antes
                tam = _baixar(pg, src, arq)
                feitos += 1
                print(f"{pl['n']:04d} {anc:12s} {tam} | {pl['cena'][:70]}", flush=True)
            except Exception as e:                                    # noqa: BLE001
                print(f"{pl['n']:04d} FALHOU: {str(e)[:120]}", flush=True)
                time.sleep(20)
    print("imagens feitas nesta rodada:", feitos)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    proj, cmd = sys.argv[1], sys.argv[2]
    if cmd == "planejar": planejar(proj)
    elif cmd == "ancoras": gerar_ancoras(proj)
    elif cmd == "imagens": gerar_imagens(proj, int(sys.argv[3]) if len(sys.argv) > 3 else None)


# ── avatar (Omni no Google Vids) ──
MAX_FALA = 22                    # palavras que cabem num take de 10 s

def palavras_dos_planos(planos):
    """[(palavra, n do plano, indice da frase)] na ordem do roteiro (as frases como em recortar)."""
    out, fi = [], 0
    for p in planos:
        for w in p["texto"].split():
            out.append([w, p["n"], fi])
            if re.search(r"[.!?]$", w): fi += 1
    return out


def falas_avatar(planos):
    """Cada plano avatar/split vira uma fala inteira: a frase que o contem, do comeco; frase longa corta na
    ultima virgula ate' MAX_FALA palavras. Devolve [{"k", "tipo", "ini", "fim", "texto"}] (indices de palavra)."""
    W = palavras_dos_planos(planos)
    falas, usado = [], -1
    for p in planos:
        if p["tipo"] not in ("avatar", "split"): continue
        idx = [i for i, w in enumerate(W) if w[1] == p["n"]]
        if not idx or idx[0] <= usado: continue
        fr = W[idx[0]][2]
        ini = next(i for i, w in enumerate(W) if w[2] == fr)
        if ini <= usado: ini = usado + 1
        fim_fr = max(i for i, w in enumerate(W) if w[2] == fr)
        fim = fim_fr
        if fim - ini + 1 > MAX_FALA:
            cortes = [i for i in range(ini + 5, min(fim_fr, ini + MAX_FALA)) if W[i][0].endswith(",")]
            fim = cortes[-1] if cortes else min(fim_fr, ini + MAX_FALA - 1)
        if fim < idx[0]: continue
        falas.append({"k": f"a{len(falas) + 1:02d}", "tipo": p["tipo"], "ini": ini, "fim": fim,
                      "texto": " ".join(w[0] for w in W[ini:fim + 1]).rstrip(",")})
        usado = fim
    return falas


DOC_OMNI = os.environ.get("VIDS_DOC_OMNI") or "1Jijy6DrF8ETusH0koxPQW9y27yN07jiWemQaYEFuqKk"
PEDIDO_OMNI = ("Make the woman in image 1 talk directly to the camera, sitting at her kitchen table, and say exactly: \"{fala}\" "
               "She is a 76-year-old grandmother from the mountains of eastern Kentucky: a warm, slow, slightly raspy elderly "
               "voice with a gentle Appalachian accent, calm natural pacing, {gesto}. Keep the camera still, keep her face, "
               "glasses, hair and clothes exactly as in the image. Speech clean, no background music, no sound effects, no "
               "other speakers, no text.")
GESTOS = ["small natural head movements and hand gestures", "a soft knowing smile and a small nod",
          "her hands folded on the table, leaning slightly forward", "one hand opening gently as she explains",
          "a warm little laugh at the start", "raising one finger slightly to make her point"]


def gerar_avatar(proj):
    from playwright.sync_api import sync_playwright
    import ivone
    planos = json.load(open(os.path.join(proj, "planos.json"), encoding="utf-8"))
    falas = falas_avatar(planos)
    json.dump(falas, open(os.path.join(proj, "falas_avatar.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    foto = os.path.join(proj, "ref", "opal.png")
    pasta = os.path.join(proj, "avatar"); os.makedirs(pasta, exist_ok=True)
    js_videos = ("()=>[...document.querySelectorAll('video')].map(v=>v.currentSrc||v.src||(v.querySelector('source')||{}).src)"
                 ".filter(s=>s&&!s.includes('gstatic'))")
    with sync_playwright() as p:
        b = ivone.conectar(p)
        pg = next(x for c in b.contexts for x in c.pages if DOC_OMNI in x.url)
        for i, f in enumerate(falas):
            arq = os.path.join(pasta, f["k"] + ".mp4")
            if os.path.exists(arq): continue
            try:
                ab = pg.get_by_role("button", name="Abrir", exact=True)
                if ab.count() and ab.last.is_visible(): ab.last.click(); time.sleep(2)     # a caixa recolhe apos gerar
                cr = pg.get_by_role("button", name="Criar", exact=True)
                if cr.count(): cr.last.click(); time.sleep(1)
                lim = pg.get_by_role("button", name="Limpar")
                if lim.count() and lim.last.is_visible(): lim.last.click(); time.sleep(2)
                if not pg.get_by_text("@Imagem1").count():
                    with pg.expect_file_chooser(timeout=20000) as fc:
                        pg.get_by_role("button", name="Ingredientes").last.click()
                    fc.value.set_files(foto); time.sleep(8)
                antes = set(pg.evaluate(js_videos))
                caixa = pg.locator("textarea:visible, [contenteditable=true]:visible").last
                caixa.click(); time.sleep(.5)
                pg.keyboard.type(PEDIDO_OMNI.format(fala=f["texto"], gesto=GESTOS[i % len(GESTOS)]), delay=4); time.sleep(1)
                pg.get_by_role("button", name="Gerar").last.click()
                fim, src = time.time() + 900, None
                while time.time() < fim and not src:
                    time.sleep(10)
                    src = next((s for s in pg.evaluate(js_videos) if s not in antes), None)
                if not src: raise RuntimeError("o take nao apareceu em 15 min")
                r = pg.context.request.get(src)
                open(arq, "wb").write(r.body())
                print(f["k"], len(r.body()), "|", f["texto"], flush=True)
            except Exception as e:                                    # noqa: BLE001
                print(f["k"], "FALHOU:", str(e)[:150], flush=True); time.sleep(30)


if __name__ == "__main__" and sys.argv[2:3] == ["avatar"]:
    gerar_avatar(sys.argv[1])
