# -*- coding: utf-8 -*-
r"""PROJETO_VIDEO — as etapas 4 a 7 da aba Producao (avatar, voz, b-roll, montagem) para QUALQUER projeto, a partir
dos planos que a etapa 3 ja' gravou (tipo avatar/split/broll, texto, cena e busca de cada plano de ~4 s).

    python work/video/projeto_video.py <id do projeto> avatar | baixar | voz | broll | montagem

Tudo do projeto fica em data/projetos/<id>/video/ e o resumo de cada etapa vai para projeto.json -> "producao"
(e' o que a aba mostra e o que deixa a etapa "pronta"). As regras sao as de motor/pipeline_video.py:
  avatar    um take do Veo por plano de avatar/tela dividida (falas curtas, plano e cenario variados, modelo GRATIS)
  voz       a narracao inteira no edge-tts (com o tempo de cada palavra) + a voz de cada take no timbre da narracao
  broll     o Claude agrupa as buscas dos planos em assuntos (de/en/ru/zh) -> YouTube, Rutube e Bilibili em 720p ->
            trechos de acao (<=8 s, <=10% da fonte) -> sem rosto (YuNet), sem texto (OCR) -> revisao NO OLHO (Claude)
  montagem  planos na ordem: narracao continua cortada nas fronteiras dos planos, avatar com o take inteiro (8 s),
            tela dividida 1/4 + 3/4, infografico de vez em quando, costura de montador, 720p, -16 LUFS
"""
import json, os, re, subprocess, sys, time

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))
for _p in (AQUI, os.path.join(RAIZ, "motor")):
    if _p not in sys.path: sys.path.insert(0, _p)

import projetos as _proj          # noqa: E402

MAX_TAKE_PALAVRAS = 16            # fala avulsa curta (regra do avatar)
# para TESTE (nunca na producao): PV_SECOES="1,2" limita aos planos dessas secoes; PV_ASSUNTOS=n limita os assuntos;
# PV_FONTES="youtube,rutube" limita as plataformas do b-roll
SECOES = {int(x) for x in os.environ.get("PV_SECOES", "").split(",") if x.strip()}


def planos_de(p):
    return [pl for pl in (p.get("planos") or []) if not SECOES or pl["secao"] in SECOES]


# ── caminhos e estado ───────────────────────────────────────────────────────────────────────────

def pastas(pid):
    v = os.path.join(_proj.pasta(pid), "video")
    d = {k: os.path.join(v, k) for k in ("takes", "voz", "terceiros", "montagem", "infografos", "leitura")}
    for x in d.values(): os.makedirs(x, exist_ok=True)
    d["raiz"] = v
    return d


def gravar_producao(pid, etapa, resumo):
    _proj.alterar(pid, lambda p: p.setdefault("producao", {}).__setitem__(etapa, resumo))


def registrar(pid, texto):
    print(texto, flush=True)
    _proj.registrar(pid, texto)


# ── 4. avatar ───────────────────────────────────────────────────────────────────────────────────

def _limpa_fala(t):
    return re.sub(r"\s*[–—]\s*", " ", t).strip()


def planejar_takes(p):
    """{chave: (cenario, [], gesto, plano)} + {chave: fala} — um take por plano de avatar/tela dividida.
    Plano e cenario em rodizio (dois seguidos nunca iguais); a tela dividida pede plano medio/fechado (o rosto cabe
    na faixa de 1/4). Fala longa demais ou com o nome do personagem: o plano vira narracao (fica fora dos takes)."""
    import gerar_avatar as ga
    nome = ((p.get("perfil") or {}).get("nome") or "").lower()
    cens = list(ga.ROTACAO_CEN) if p.get("persona") == "kloster-moench" else ["X"]
    if cens == ["X"]:
        ga.CENARIO["X"] = "in " + ((p.get("perfil") or {}).get("cenario_avatar") or "a quiet old farmhouse")
    # avatar em tela cheia: 3 de cada 4 de CORPO INTEIRO (em pe, andando e falando, sentado, saindo do arco) e 1 de baixo
    # para cima; tela dividida: so' planos em que o rosto cabe na faixa de 1/4 (close, tres-quartos, trabalhando).
    # Os dois rodizios nao tem plano em comum: dois takes seguidos nunca repetem o plano.
    abertos = ["em_pe", "andando", "sentado", "baixo", "porta", "andando", "em_pe", "baixo", "sentado", "porta", "em_pe", "baixo"]
    fechados = ["close", "tres_quartos", "trabalhando"]
    gestos = ["", "He gives a small nod.", "He opens one hand slightly.", "He smiles faintly.", "He leans slightly forward.",
              "He raises one finger slightly.", ""]
    takes, falas, i_ab, i_fe, i_cen = {}, {}, 0, 0, 0
    for pl in planos_de(p):
        if pl["tipo"] not in ("avatar", "split"): continue
        fala = _limpa_fala(pl["texto"])
        if len(fala.split()) > MAX_TAKE_PALAVRAS or (nome and nome in fala.lower()): continue
        if pl["tipo"] == "split":
            plano = fechados[i_fe % len(fechados)]; i_fe += 1
        else:
            plano = abertos[i_ab % len(abertos)]; i_ab += 1
        k = f"t{pl['n']:03d}"
        takes[k] = (cens[i_cen % len(cens)], [], gestos[pl["n"] % len(gestos)], plano); i_cen += 1
        falas[k] = fala
    return takes, falas


def _contexto_avatar(pid, p):
    import gerar_avatar as ga
    d = pastas(pid)
    ga.TAKES, ga.FALAS = planejar_takes(p)
    ga.PASTA_TAKES = d["takes"]
    ga.ESTADO = os.path.join(d["raiz"], "estado_avatar.json")
    return ga


def etapa_avatar(pid, pago=False, verba=0):
    """pago=True so' com verba liberada pelo Eduardo (VERBA["limite"] = verba). Ordem: primeiro os takes de avatar em tela
    cheia, depois os de tela dividida — se a verba acabar, o que sobra vira narracao com b-roll."""
    p = _proj.carregar(pid)
    ga = _contexto_avatar(pid, p)
    tipo = {f"t{pl['n']:03d}": pl["tipo"] for pl in p["planos"]}
    ga.TAKES = dict(sorted(ga.TAKES.items(), key=lambda kv: (tipo.get(kv[0]) != "avatar", kv[0])))
    if pago: ga.VERBA["limite"] = int(verba)
    registrar(pid, f"avatar: {len(ga.TAKES)} takes planejados ({'Veo 3.1 Lite x1 8 s, pago' if pago else 'Veo 3.1 Lite [Lower Priority], grátis'})")
    ga.enviar(None, "pago" if pago else "gratis")
    etapa_baixar(pid)
    # os infograficos tambem saem do Flow (imagem, modelos gratis): no mesmo passo, com o assunto do b-roll ja' definido
    if os.path.exists(os.path.join(pastas(pid)["raiz"], "assuntos.json")):
        try: etapa_infograficos(pid)
        except Exception as e: registrar(pid, f"⚠ infográficos: {str(e)[:150]}")        # noqa: BLE001


PEDIDO_INFOS = """You plan EXPLANATORY SCHEMATIC ILLUSTRATIONS (infographics without any text) for a calm YouTube video.
Video: {nome}
B-roll topics of the video (id: description):
{topicos}
Propose {n} drawings that EXPLAIN something concrete the narration talks about (a cross-section, a step sequence left to
right, a comparison side by side, a cycle with arrows). Each: "key" (short-slug), "tag" (one of the topic ids above),
"desenho" (one English paragraph describing exactly what is drawn: objects, arrows, numbered circles; NO words or
letters in the image). Return ONLY JSON: {{"infograficos": [{{"key": "...", "tag": "...", "desenho": "..."}}]}}"""


def planejar_infograficos(pid, n=8):
    d = pastas(pid)
    arq = os.path.join(d["infografos"], "plano.json")
    if os.path.exists(arq): return json.load(open(arq, encoding="utf-8"))
    p = _proj.carregar(pid)
    tops = assuntos(pid)["topicos"]
    r = _json_de(_chamar_claude(PEDIDO_INFOS.format(nome=p["nome"], n=n, topicos=chr(10).join(f"{t['id']}: {t['en']}" for t in tops))))
    infos = {x["key"]: (x.get("tag", ""), x["desenho"]) for x in r.get("infograficos") or [] if x.get("key") and x.get("desenho")}
    json.dump(infos, open(arq, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return infos


def etapa_infograficos(pid):
    """Os infograficos esquematicos do projeto, como IMAGEM nos modelos gratis do Flow (gerar_infografos.py)."""
    import gerar_infografos as gi
    d = pastas(pid)
    gi.INFOGRAFOS = planejar_infograficos(pid)
    gi.PASTA = d["infografos"]
    gi.main()
    feitos = [k for k in gi.INFOGRAFOS if os.path.exists(os.path.join(d["infografos"], k + ".png"))]
    registrar(pid, f"infográficos: {len(feitos)} de {len(gi.INFOGRAFOS)} no disco (modelos de imagem grátis)")


def etapa_baixar(pid):
    p = _proj.carregar(pid)
    ga = _contexto_avatar(pid, p)
    ga.baixar()
    prontos = [k for k in ga.TAKES if os.path.exists(os.path.join(ga.PASTA_TAKES, k + ".mp4"))]
    from collections import Counter
    planos = Counter(ga.TAKES[k][3] for k in prontos)
    gravar_producao(pid, "avatar", {"takes": len(prontos), "planejados": len(ga.TAKES), "entradas": len(prontos),
                                    "creditos": 0, "modelo": "Veo 3.1 Lite [Lower Priority] + personagem",
                                    "planos": dict(planos), "pasta": ga.PASTA_TAKES})
    registrar(pid, f"avatar: {len(prontos)} de {len(ga.TAKES)} takes no disco")


# ── 5. voz ──────────────────────────────────────────────────────────────────────────────────────

def etapa_voz(pid):
    import voz_wendelin as voz, voz_conrad
    import roteiro as _rot
    p = _proj.carregar(pid)
    d = pastas(pid)
    n = 0
    for pl in planos_de(p):
        for f in _rot.frases(pl["texto"]) or [pl["texto"]]:
            voz.narrar(f, os.path.join(d["voz"], f"cache_{n % 50}.wav")); n += 1      # so' aquece o cache (com tempos)
    convertidos = 0
    for f in sorted(os.listdir(d["takes"])):
        if f.endswith(".mp4"):
            voz_conrad.converter(os.path.join(d["takes"], f)); convertidos += 1
    gravar_producao(pid, "voz", {"narracao": "Conrad (edge-tts, -10%)", "takes": f"OpenVoice v2 -> Conrad ({convertidos})",
                                 "frases": n})
    registrar(pid, f"voz: {n} frases narradas (com o tempo de cada palavra), {convertidos} takes no timbre da narração")


# ── 6. b-roll ───────────────────────────────────────────────────────────────────────────────────

PEDIDO_ASSUNTOS = """You group the B-ROLL search queries of a video into stock-footage TOPICS.
Below, one line per shot: shot number | scene description | search query (English).
Return ONLY JSON: {{"topicos": [{{"id": "short-slug", "en": "...", "de": "...", "ru": "...", "zh": "...", "planos": [n, ...]}}]}}
Rules: at most {max_t} topics; every shot number appears in exactly one topic; each query is 2-5 words describing
VISIBLE HANDS-ON ACTION (hands watering, cutting, planting, sieving, harvesting...) or the concrete object, never
abstract ideas; "de" German, "ru" Russian, "zh" Simplified Chinese, all natural search phrases a gardener would type.

{linhas}"""


def _chamar_claude(pedido, timeout=900, ferramentas=None):
    import persona as _persona
    exe = _persona.binario()
    if not exe: raise RuntimeError("o Claude Code não está instalado nesta máquina")
    cmd = [exe, "-p", "--output-format", "json"] + (["--allowedTools", ferramentas] if ferramentas else [])
    extra = {"creationflags": 0x08000000} if os.name == "nt" else {}
    r = subprocess.run(cmd, input=pedido, capture_output=True, text=True, encoding="utf-8", errors="replace",
                       timeout=timeout, env=_persona.ambiente_limpo(), **extra)
    try: d = json.loads(r.stdout or "")
    except ValueError: d = {}
    if r.returncode or d.get("is_error"): raise RuntimeError("o Claude falhou: " + str(d.get("result") or r.stderr)[:160])
    return d.get("result") or ""


def _json_de(texto):
    m = re.search(r"\{.*\}", texto, re.S)
    return json.loads(m.group(0)) if m else {}


def assuntos(pid, max_t=30):
    d = pastas(pid)
    arq = os.path.join(d["raiz"], "assuntos.json")
    if os.path.exists(arq): return json.load(open(arq, encoding="utf-8"))
    p = _proj.carregar(pid)
    linhas = "\n".join(f"{pl['n']} | {pl.get('cena', '')} | {pl.get('busca', '')}" for pl in planos_de(p)
                       if pl["tipo"] in ("broll", "split") and pl.get("busca"))
    t = _json_de(_chamar_claude(PEDIDO_ASSUNTOS.format(max_t=max_t, linhas=linhas)))
    if not t.get("topicos"): raise RuntimeError("o Claude não devolveu os assuntos do b-roll")
    json.dump(t, open(arq, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return t


PEDIDO_ESCOLHA = """You pick stock-footage source videos. For each JOB below there is a topic and up to 6 search results (index: title
[duration]). Titles may be in German, English, Russian or Chinese. Choose the ONE result most likely to show the topic as
real hands-on footage (gardening, plants, soil, herbs...). Reject music videos, songs, vlogs about unrelated things,
product reviews of machines, news, cartoons, slideshows. If none fits, use null.
Return ONLY JSON: {{"escolha": {{"0": index_or_null, "1": index_or_null, ...}}}}

{linhas}"""

PEDIDO_TEXTO = """An OCR flagged possible TEXT in these video frames (red box = where it found "text"; the yellow number
top-left is the clip index). Read these image files with the Read tool:
{arquivos}
For each clip decide: is there REAL text in the frame (letters, numbers, a logo, a watermark even semi-transparent,
subtitles, a price tag, a label)? Or is the red box just leaves, soil, wood grain, branches, a pattern (a false
positive)? Be strict: if you can read or nearly read any character, it is real text.
Return ONLY JSON: {{"nao_e_texto": [indices that are FALSE positives]}}"""

PEDIDO_OLHO = """You review a contact sheet of stock video clips for a calm YouTube channel about {tema}.
The sheet shows up to 8 clips; each clip is a row of 4 frames with "index topic" in yellow in its top-left corner.
Look at EVERY frame of EVERY clip one by one before answering.
Read these image files with the Read tool:
{arquivos}
REJECT a clip if ANY frame shows: a human face (even in profile, small, or partly visible); any text, logo, subtitle
or watermark (even semi-transparent); something off-topic for {tema} (kitchens stoves, furniture, pallets, machines,
landscapes without the topic); a visible transition, glitch, split screen or graphic overlay.
⛔ ALSO REJECT every clip WITHOUT HUMAN ACTION: the channel only uses footage of someone DOING something — hands or arms
visibly working (planting, watering, cutting, sieving, harvesting, pouring, touching the soil...). Plants just swaying
in the wind, an empty tray, a jar standing still, a pot with nobody touching it -> "parado". Hands, arms and people seen
from behind are fine.
Return ONLY JSON: {{"rejeitar": [{{"i": index, "motivo": "rosto|texto|parado|fora do tema|transicao"}}]}}"""


def etapa_broll(pid, por_assunto=None):
    d = pastas(pid)
    os.environ["TERC_PASTA"] = d["terceiros"]
    # o YouTube so' baixa logado: os cookies da sessao autorizada (perfil do Dolphin, ajuste do estudio)
    import cookies_youtube
    try: perfil = json.load(open(os.path.join(RAIZ, "data", "estudio.json"), encoding="utf-8")).get("perfil_dolphin")
    except (OSError, ValueError): perfil = None
    ck = cookies_youtube.exportar(perfil or cookies_youtube.PERFIL_PADRAO)
    if ck: os.environ["YT_COOKIES"] = ck
    else: print("  ⚠ o perfil do Dolphin nao esta' aberto: o YouTube vai recusar; sigo com Rutube e Bilibili", flush=True)
    import importlib, broll_terceiros as bt, revisar_texto, revisar_olho
    importlib.reload(bt)                                  # o modulo le TERC_PASTA ao ser carregado
    p = _proj.carregar(pid)
    tops = assuntos(pid, max_t=int(os.environ.get("PV_ASSUNTOS") or 30))["topicos"]
    # busca dirigida: so' os assuntos que tem plano nas secoes pedidas (o banco acabou no fim do video)
    if os.environ.get("PV_TOPICOS_SECOES"):
        alvo_s = {int(x) for x in os.environ["PV_TOPICOS_SECOES"].split(",")}
        ns = {pl["n"] for pl in p["planos"] if pl["secao"] in alvo_s}
        tops = [t for t in tops if set(t["planos"]) & ns]
    registrar(pid, f"b-roll: {len(tops)} assuntos para {sum(len(t['planos']) for t in tops)} planos; buscando em YouTube, Rutube e Bilibili")
    # ⭐ (09/10) em RODADAS: busca/baixa/recorta/confere ate' ter trecho limpo para todos os planos (alvo), no maximo 4
    #    rodadas; cada rodada pega candidatos novos (os ja' vistos ficam de fora).
    # alvo: 1 trecho por plano de b-roll/tela dividida, +40% (plano longo vira 2 tomadas e a revisao no olho ainda tira)
    sec_mg = {int(x["secao"]) for x in (p.get("producao") or {}).get("mg", [])}     # secoes que viram animacao
    # a revisao no olho tira ~40% (plano sem maos agindo): a meta de trechos ANTES dela e' ~2x os planos
    alvo = int(os.environ.get("PV_ALVO") or 2.0 * sum(1 for pl in planos_de(p) if pl["tipo"] in ("broll", "split")
                                                      and pl["secao"] not in sec_mg))
    por_assunto = por_assunto or [("youtube", "en"), ("youtube", "de"), ("rutube", "ru"), ("bilibili", "zh")]

    def limpos():
        arq = os.path.join(d["terceiros"], "aprovados.json")
        ap = json.load(open(arq, encoding="utf-8")) if os.path.exists(arq) else []
        sujas = {c["clipe"].rsplit("_", 1)[0] for c in ap if c.get("texto") and c.get("texto_revisto") != "falso"}
        return sum(1 for c in ap if "texto" in c and c["clipe"].rsplit("_", 1)[0] not in sujas and not c.get("olho")
                   and float(c.get("acao") or 0) >= 3.0)

    def rodada(por_assunto):
        # 1. fontes: por assunto, 1 do YouTube em ingles, 1 em alemao, 1 do Rutube (ru) e 1 do Bilibili (zh)
        if os.environ.get("PV_FONTES"): por_assunto = [x for x in por_assunto if x[0] in os.environ["PV_FONTES"].split(",")]
        os.makedirs(bt.SRC, exist_ok=True)
        import threading
        from concurrent.futures import ThreadPoolExecutor
        ja = set()                                             # (assunto, plataforma, busca) que ja' tem fonte no disco
        vistos = set()
        for x in os.listdir(bt.SRC):
            if x.endswith(".json"):
                m = json.load(open(os.path.join(bt.SRC, x), encoding="utf-8"))
                ja.add((m.get("tag"), m.get("fonte", "youtube"), m.get("busca"))); vistos.add(m.get("id"))
        # cada rodada busca de novo TODAS as combinacoes: os videos ja' vistos ficam de fora, entao vem um video novo
        jobs = [(t, f, lg) for t in tops for f, lg in por_assunto if t.get(lg)]
        # 1a. busca em todas as plataformas (4 de cada vez; o Bilibili 1 por vez, por causa do antirrobo)
        sem = {"bilibili": threading.Semaphore(1), "rutube": threading.Semaphore(2), "youtube": threading.Semaphore(2)}

        def buscar_job(job):
            t, fonte, lg = job
            with sem[fonte]:
                return [c for c in bt.candidatos(fonte, t[lg], n=6) if c[0] not in vistos and bt.DUR_MIN <= c[2] <= 900]
        with ThreadPoolExecutor(max_workers=4) as ex:
            cands = list(ex.map(buscar_job, jobs))
        # 1b. ⭐ (09/10) o Claude escolhe, pelo titulo, o candidato que mostra o assunto (a busca em russo/chines trazia
        #     clipe musical, triturador eletrico, corte de grama...)
        linhas = []
        for k, ((t, fonte, lg), cs) in enumerate(zip(jobs, cands)):
            linhas.append(f"JOB {k} — topic: {t['en']} ({fonte}, {lg})")
            linhas += [f"  {m}: {c[3] or ''} [{c[2]:.0f}s]" for m, c in enumerate(cs)]
        escolha = {}
        if any(cands):
            r = _json_de(_chamar_claude(PEDIDO_ESCOLHA.format(linhas=chr(10).join(linhas))))
            escolha = {int(k): v for k, v in (r.get("escolha") or {}).items()}
        # 1c. baixa as escolhidas em paralelo
        trava = threading.Lock()

        def baixar_job(k):
            (t, fonte, lg), cs = jobs[k], cands[k]
            m = escolha.get(k)
            if m is None or not (0 <= int(m) < len(cs)): return
            vid, url, dur, titulo, canal = cs[int(m)]
            with trava:
                if vid in vistos: return
                vistos.add(vid)
            alvo = os.path.join(bt.SRC, vid + ".mp4")
            with sem[fonte]:
                try: bt.baixar_fonte(fonte, url, alvo, dur)
                except subprocess.TimeoutExpired: return
            if not os.path.exists(alvo): return
            json.dump({"id": vid, "fonte": fonte, "url": url, "titulo": titulo, "canal": canal, "dur": dur, "busca": t[lg],
                       "tag": t["id"]}, open(os.path.join(bt.SRC, vid + ".json"), "w", encoding="utf-8"), ensure_ascii=False)
            print(f"  [{fonte}] {t['id']}: {vid} {dur:.0f}s {(titulo or '')[:50]}", flush=True)
        with ThreadPoolExecutor(max_workers=4) as ex:
            list(ex.map(baixar_job, range(len(jobs))))
        # 2. trechos de acao (<=8 s, <=10% da fonte, sem rosto, sem texto) e a 2a passada contra texto/marca d'agua
        bt.recortar()
        revisar_texto.main([d["terceiros"]])
        # 2b. ⭐ (09/10) o Claude confere o que o OCR marcou: folhagem lida como letra volta (e a fonte dela tambem)
        for _ in range(2):
            marcados = revisar_texto.folhas_marcados(d["terceiros"], os.path.join(d["terceiros"], "folhas_texto"))
            if not marcados: break
            falsos, vistos_txt = [], set()
            for k in range(0, len(marcados), 4):
                grupo = marcados[k:k + 4]
                r = _json_de(_chamar_claude(PEDIDO_TEXTO.format(arquivos=chr(10).join(f for f, _ in grupo)), ferramentas="Read"))
                validos = {i for _, ids in grupo for i in ids}
                vistos_txt |= validos
                falsos += [int(i) for i in (r.get("nao_e_texto") or []) if int(i) in validos]
            revisar_texto.reabrir_falsos(d["terceiros"], falsos, vistos_txt - set(falsos))
            if not falsos: break
            revisar_texto.main([d["terceiros"]])
            print(f"  texto: {len(falsos)} falsos positivos do OCR voltaram ao banco", flush=True)
        for f in os.listdir(bt.SRC):                          # as fontes inteiras nao servem mais: libera o disco
            if f.endswith(".mp4"): os.remove(os.path.join(bt.SRC, f))
    for r in range(4):
        antes = limpos()
        rodada(por_assunto)
        agora = limpos()
        print(f"  rodada {r + 1}: {agora} trechos limpos (alvo {alvo})", flush=True)
        if agora >= alvo or agora == antes and r: break
        por_assunto = [("youtube", "en"), ("youtube", "de"), ("rutube", "ru"), ("bilibili", "zh"), ("youtube", "en")]
        if os.environ.get("PV_FONTES"): por_assunto = [x for x in por_assunto if x[0] in os.environ["PV_FONTES"].split(",")]

    # 3. revisao NO OLHO antes da montagem, e o pente fino (corte interno + rosto)
    rej = revisar_no_olho(pid, d, p)
    pente_fino(pid, d)
    ap = json.load(open(os.path.join(d["terceiros"], "aprovados.json"), encoding="utf-8"))
    bons = sum(1 for c in ap if c.get("olho_ok") and float(c.get("acao") or 0) >= 3.0)
    from collections import Counter
    fontes = Counter(c["fonte"].split("_")[0] if c["fonte"][:3] in ("rt_", "bb_") else "yt" for c in ap
                     if c.get("olho_ok") and float(c.get("acao") or 0) >= 3.0)
    gravar_producao(pid, "broll", {"trechos_limpos": bons, "fora": len(ap) - bons, "assuntos": len(tops),
                                   "por_fonte": dict(fontes), "motion_graphics": (p.get("producao") or {}).get("mg_nomes", [])})
    registrar(pid, f"b-roll: {bons} trechos limpos de {len(ap)} ({rej} tirados no olho) · {dict(fontes)}")


def revisar_no_olho(pid, d=None, p=None, de_novo=False):
    """O Claude olha as folhas (8 trechos x 4 quadros de 320 px, UMA folha por chamada) e rejeita rosto, texto, plano
    parado, fora do tema e transicao embutida. de_novo=True revisa tambem os ja' aprovados."""
    import revisar_olho
    d = d or pastas(pid); p = p or _proj.carregar(pid)
    arq = os.path.join(d["terceiros"], "aprovados.json")
    if de_novo:
        ap = json.load(open(arq, encoding="utf-8"))
        for c in ap: c.pop("olho_ok", None)
        json.dump(ap, open(arq, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    folhas = revisar_olho.folhas(d["terceiros"], os.path.join(d["terceiros"], "folhas_olho"), por_folha=8, n_quadros=4,
                                 w=320, h=180, so_novos=True)
    tema = (p.get("mecanismo") or {}).get("resumo", "")[:200] or p["nome"]
    import threading
    from concurrent.futures import ThreadPoolExecutor
    trava, rej, vistos = threading.Lock(), [], set()

    def uma(folha):
        f, ids = folha
        try:
            r = _json_de(_chamar_claude(PEDIDO_OLHO.format(tema=tema, arquivos=f), ferramentas="Read"))
        except Exception as e:                                                       # noqa: BLE001
            print("  olho: uma folha falhou (os trechos dela ficam sem aprovar):", str(e)[:100], flush=True); return
        # ⛔ so' indices que estao NESTA folha (o Claude ja' citou um que nao existe e derrubou tudo); marca na hora
        boas = [x for x in (r.get("rejeitar") or []) if str(x.get("i", "")).isdigit() and int(x["i"]) in ids]
        with trava:
            for motivo in {x.get("motivo", "olho") for x in boas}:
                revisar_olho.marcar(d["terceiros"], ",".join(str(int(x["i"])) for x in boas if x.get("motivo", "olho") == motivo), motivo)
            rej.extend(boas); vistos.update(ids)
    with ThreadPoolExecutor(max_workers=4) as ex:             # 4 folhas ao mesmo tempo
        list(ex.map(uma, folhas))
    revisar_olho.aprovar(d["terceiros"], vistos)
    print(f"  olho: {len(rej)} rejeitados em {len(folhas)} folhas", flush=True)
    return len(rej)


PEDIDO_ROSTO = """FACE CHECK of stock video clips. Read this image file with the Read tool:
{arquivo}
Each row is ONE clip (6 frames across its duration); "index" in yellow at the top-left of the row.
For EACH clip look at all 6 frames: is ANY human face visible — even small, far away, partly cut, in profile, blurred,
or for a single frame? A person seen only from behind, or only hands/arms/legs, is NOT a face.
Also: does the row jump between clearly DIFFERENT scenes (a cut to another place/subject inside the clip)?
Return ONLY JSON: {{"rosto": [indices with a face], "corte": [indices with a cut to a different scene]}}"""


def corte_interno(arq, limiar=0.32):
    """True se o trecho tem um corte de cena por dentro (o aUCprKd5Me0_39 ia do manjericao ao rosto de um homem)."""
    r = subprocess.run(["ffmpeg", "-v", "info", "-i", arq, "-vf", f"scale=320:-2,select='gt(scene,{limiar})',showinfo",
                        "-f", "null", "-"], capture_output=True, text=True)
    return "pts_time" in r.stderr


def pente_fino(pid, d=None):
    """⭐ (10/10) depois da revisao no olho, nos APROVADOS: (1) corte de cena dentro do trecho -> sai; (2) uma 2a olhada
    SO' para rosto, 6 quadros por trecho, 4 trechos por folha (a revisao de 4 quadros deixou passar rosto)."""
    import revisar_olho, threading
    from concurrent.futures import ThreadPoolExecutor
    from PIL import Image, ImageDraw
    d = d or pastas(pid)
    arq = os.path.join(d["terceiros"], "aprovados.json")
    ap = json.load(open(arq, encoding="utf-8"))
    ok = [i for i, c in enumerate(ap) if c.get("olho_ok") and not c.get("pente")]
    clip = lambda i: os.path.join(d["terceiros"], "clips", ap[i]["clipe"])   # noqa: E731
    cortados = []                       # (o corte por limiar de cena marcava mao mexendo rapido: quem decide e' o Claude)
    pasta = os.path.join(d["terceiros"], "folhas_rosto"); os.makedirs(pasta, exist_ok=True)
    resto = [i for i in ok if i not in cortados]
    folhas = []
    for k in range(0, len(resto), 4):
        ids = resto[k:k + 4]
        S = Image.new("RGB", (6 * 320, len(ids) * 195), (20, 20, 20)); dr = ImageDraw.Draw(S)
        for r, i in enumerate(ids):
            dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                                        clip(i)], capture_output=True, text=True).stdout or 0)
            for j in range(6):
                S.paste(revisar_olho.quadro(clip(i), dur * (0.05 + 0.9 * j / 5), 320, 180), (j * 320, r * 195))
            dr.rectangle([0, r * 195, 60, r * 195 + 16], fill=(0, 0, 0)); dr.text((4, r * 195 + 2), str(i), fill=(255, 255, 0))
        f = os.path.join(pasta, f"rosto_{k // 4:03d}.jpg"); S.save(f, quality=85); folhas.append((f, ids))
    trava, rostos = threading.Lock(), []

    def uma(fi):
        f, ids = fi
        try: r = _json_de(_chamar_claude(PEDIDO_ROSTO.format(arquivo=f), ferramentas="Read"))
        except Exception as e:                                                       # noqa: BLE001
            print("  rosto: folha falhou, os trechos dela saem por precaucao:", str(e)[:80], flush=True)
            with trava: rostos.extend(ids)
            return
        with trava:
            rostos.extend(int(x) for x in (r.get("rosto") or []) if str(x).isdigit() and int(x) in ids)
            cortados.extend(int(x) for x in (r.get("corte") or []) if str(x).isdigit() and int(x) in ids)
    with ThreadPoolExecutor(max_workers=4) as ex:
        list(ex.map(uma, folhas))
    ap = json.load(open(arq, encoding="utf-8"))
    for i in cortados: ap[i]["olho"] = "corte interno"; ap[i].pop("olho_ok", None)
    for i in rostos: ap[i]["olho"] = "rosto"; ap[i].pop("olho_ok", None)
    for i in ok: ap[i]["pente"] = True
    json.dump(ap, open(arq, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"  pente fino: {len(cortados)} com corte interno, {len(rostos)} com rosto; "
          f"{sum(1 for c in ap if c.get('olho_ok'))} aprovados", flush=True)


# ── 7. montagem ─────────────────────────────────────────────────────────────────────────────────

class Banco:
    """Trechos aprovados por assunto. Nunca a mesma imagem duas vezes; so' com acao e revisados no olho;
    um infografico a cada INFO_CADA planos; imagens proprias (takes de maos) como ultima reserva."""
    INFO_CADA = 10
    ESPACO = 8

    @staticmethod
    def _fonte(v):
        return os.path.basename(v[1]).rsplit("_", 1)[0]

    def __init__(self, d, assuntos_json):
        self.por_tag, self.usados, self.cont, self.forcar, self.secao = {}, set(), 0, None, 0
        self.ultimas, self.vezes, self.escolhas = [], {}, []
        arq = os.path.join(d["terceiros"], "aprovados.json")
        ap = json.load(open(arq, encoding="utf-8")) if os.path.exists(arq) else []
        for c in sorted(ap, key=lambda c: -float(c.get("acao") or 0)):
            if not c.get("olho_ok") or float(c.get("acao") or 0) < 3.0: continue      # (09/10) acao minima de 3%
            self.por_tag.setdefault(c.get("tag", ""), []).append(("terc", os.path.join(d["terceiros"], "clips", c["clipe"]), 0.0))
        self.tag_do_plano = {n: t["id"] for t in assuntos_json.get("topicos", []) for n in t["planos"]}
        import montar_fatia as _mf, glob as _g
        _movs = [(1.0, 1.12, (.45, .5), (.55, .5)), (1.12, 1.0, (.5, .45), (.5, .55)), (1.0, 1.1, (.55, .55), (.45, .45))]
        _imgs = sorted(_g.glob(os.path.join(AQUI, "fatia01", "maos", "*.png"))) + sorted(_g.glob(os.path.join(AQUI, "hack", "img", "*.png")))
        self.proprias = [_mf.F(f, *_movs[i % 3]) for i, f in enumerate(_imgs)]
        self.infos = []
        idx = os.path.join(d["infografos"], "infografos.json")
        if os.path.exists(idx):
            import montar_fatia as mf
            movs = [(1.0, 1.12, (.45, .5), (.55, .5)), (1.12, 1.0, (.5, .45), (.5, .55)), (1.0, 1.1, (.55, .55), (.45, .45))]
            for i, (k, v) in enumerate(json.load(open(idx, encoding="utf-8")).items()):
                img = os.path.join(d["infografos"], k + ".png")
                if os.path.exists(img): self.infos.append((v.get("tag", ""), mf.F(img, *movs[i % 3])))

    def pegar(self, n, rel):
        v = self._pegar(n, rel)
        self.escolhas.append((n, os.path.basename(v[1]), v[2]))      # o registro: qual trecho entrou em cada plano
        return v

    def _pegar(self, n, rel):
        if self.forcar:
            v, self.forcar = self.forcar, None; return v
        tag = self.tag_do_plano.get(n, "")
        self.cont += 1
        livres_i = [(t, v) for t, v in self.infos if repr(v) not in self.usados]
        if livres_i and self.cont % self.INFO_CADA == 0:
            t, v = next(((t, v) for t, v in livres_i if t == tag), livres_i[0])
            self.usados.add(repr(v)); rel.append(f"plano {n}: infográfico"); return v
        ordem = [tag] + sorted((t for t in self.por_tag if t != tag), key=lambda t: -len(self.por_tag[t]))
        # ⭐ (09/10) a mesma FONTE nao volta antes de ESPACO planos e a menos usada vem primeiro (o corte de microverdes
        #    aparecia 3 vezes em 100 s); so' se nao houver outra a regra afrouxa
        for espaco in (self.ESPACO, 3, 0):
            recentes = set(self.ultimas[-espaco:]) if espaco else set()
            for t in ordem:
                livres = [v for v in self.por_tag.get(t, []) if repr(v) not in self.usados and self._fonte(v) not in recentes]
                if not livres: continue
                v = min(livres, key=lambda v: self.vezes.get(self._fonte(v), 0))
                self.usados.add(repr(v)); self.ultimas.append(self._fonte(v))
                self.vezes[self._fonte(v)] = self.vezes.get(self._fonte(v), 0) + 1
                if t != tag: rel.append(f"plano {n} ({tag}): sem trecho livre, usei '{t}'")
                return v
        for t, v in livres_i:
            self.usados.add(repr(v)); rel.append(f"plano {n}: infográfico (b-roll acabou)"); return v
        # ultima reserva: imagens proprias do canal (maos do monge trabalhando, geradas no Veo; a raiz partida do hack),
        # com movimento lento de camera — so' quando o b-roll de terceiros e os infograficos acabaram
        for v in self.proprias:
            if repr(v) not in self.usados:
                self.usados.add(repr(v)); rel.append(f"plano {n}: imagem propria {os.path.basename(v[1])}"); return v
        raise SystemExit(f"plano {n}: acabou o b-roll limpo — busque mais (etapa B-roll) antes de montar")


def _norm(w):
    return re.sub(r"[^\w]", "", w.lower())


def cortes_dos_planos(planos_run, ws):
    """Tempo de corte entre planos consecutivos, alinhando as palavras do texto de cada plano com as palavras que o
    edge-tts informou (difflib). Devolve [fim do plano 0, fim do plano 1, ...] em segundos."""
    import difflib
    alvo, dono = [], []
    for i, pl in enumerate(planos_run):
        for w in pl["texto"].split():
            if _norm(w): alvo.append(_norm(w)); dono.append(i)
    falado, tempo = [], []
    for w, a, b in ws:
        for x in w.split():
            if _norm(x): falado.append(_norm(x)); tempo.append((a, b))
    mapa = {}
    for blk in difflib.SequenceMatcher(None, alvo, falado, autojunk=False).get_matching_blocks():
        for k in range(blk.size): mapa[blk.a + k] = blk.b + k
    fins = []
    for i in range(len(planos_run) - 1):
        ult = max((k for k in range(len(alvo)) if dono[k] == i and k in mapa), default=None)
        prox = min((k for k in range(len(alvo)) if dono[k] == i + 1 and k in mapa), default=None)
        if ult is not None and prox is not None:
            fins.append((tempo[mapa[ult]][1] + tempo[mapa[prox]][0]) / 2)
        else:                                               # sem alinhamento: proporcional as palavras
            fins.append(None)
    return fins


def bloco_narrado(run, nome, banco, rel, mf):
    """Os planos de narracao seguidos: uma faixa continua (frase a frase) cortada nas fronteiras dos planos."""
    import roteiro as _rot
    man, ns, k = {}, [], 0
    for pl in run:
        for f in _rot.frases(pl["texto"]) or [pl["texto"]]:
            k += 1; man[k] = {"texto": f, "secao": pl["secao"]}; ns.append(k)
    mf.TEXTO_EXTRA = {}
    wav, marcas = mf.com_respiro(*mf.faixa_narrada(ns, man, nome))
    ws = mf.PALAVRAS.get(wav) or mf.palavras(wav)
    total = mf.dur(wav)
    fins = cortes_dos_planos(run, ws)
    palavras = [max(1, len(pl["texto"].split())) for pl in run]
    tot_p = sum(palavras)
    t0 = ws[0][1] if ws else mf.PAD
    t1 = ws[-1][2] if ws else total - mf.PAD
    acum, lim = 0, []
    for i, f in enumerate(fins):
        acum += palavras[i]
        lim.append(f if f is not None else t0 + (t1 - t0) * acum / tot_p)
    bordas = [0.0] + lim + [total]
    tomadas = []
    for i, pl in enumerate(run):
        a, b = bordas[i], bordas[i + 1]
        # plano longo vira 2 tomadas (teto de ~5,4 s, como o Elias); curto (<2,2 s) junta com o anterior
        partes = [(a, b)] if b - a <= mf.MAX_CLIPE else [(a, (a + b) / 2), ((a + b) / 2, b)]
        for x, y in partes:
            if tomadas and y - x < mf.MIN_T:
                pa, _pb, pn, pv = tomadas[-1]; tomadas[-1] = (pa, y, pn, pv); continue
            tomadas.append((x, y, pl["n"], banco.pegar(pl["n"], rel)))
    # ⭐ regra dos 8 s: o 1o plano pode ser a SOBRA do take do avatar (o monge ouvindo, em plano aberto). Se ela e' mais
    #    curta que o plano, ocupa o comeco dele e o resto ganha outro b-roll — antes a sobra era trocada e se perdia
    if tomadas and os.sep + "takes" + os.sep in tomadas[0][3][1]:
        a, b, n, v = tomadas[0]
        resto = mf.dur(v[1]) - v[2]
        if resto < b - a - 0.05:
            meio = min(a + resto, b - mf.MIN_T)             # o resto do plano nunca fica menor que um plano minimo
            if meio - a >= 1.0: tomadas[0:1] = [(a, meio, n, v), (meio, b, n, banco.pegar(n, rel))]
            else: tomadas[0] = (a, b, n, banco.pegar(n, rel))   # sobra curta demais para um plano: fica de fora
    for i, (a, b, n, v) in enumerate(tomadas):              # o visual nunca e' mais curto que o plano
        if i == 0 and os.sep + "takes" + os.sep in v[1]: continue
        if v[0] == "terc" and mf.dur(v[1]) - v[2] < b - a - 0.05:
            tomadas[i] = (a, b, n, banco.pegar(n, rel))
    saida = os.path.join(mf.TMP, nome + ".mp4")
    mf.montar_narrado(wav, tomadas, nome, saida, assunto=lambda t: banco.tag_do_plano.get(t[2], ""))
    return saida, len(tomadas)


def cta_do_livro(p, planos):
    """⭐ (09/10) a secao do livro, no Bruder Wendelin, vira a animacao do livro (cta/cta.html), cortada em planos:
    as frases dos planos de b-roll da secao, partidas nas virgulas/dois-pontos, com as marcas que a animacao usa
    (B0 = "Buch", TITEL = o nome do livro, URL = o site falado, C0 = a frase seguinte). None se a secao nao casa."""
    import roteiro as _rot
    perf = p.get("perfil") or {}
    livro, site, nome = perf.get("livro", ""), perf.get("site", ""), perf.get("nome", "")
    if p.get("persona") != "kloster-moench" or not livro or not site: return None
    base, _, tld = site.partition(".")
    falado = f"{nome} Punkt {tld}" if base == nome.replace(" ", "").lower() else site.replace(".", " Punkt ")
    clausulas = []
    for pl in planos:
        for f in _rot.frases(pl["texto"]) or [pl["texto"]]:
            partes = re.split(r"(?<=[:,])\s+", f.replace(site, falado))
            for i, c in enumerate(partes):
                clausulas.append([c, 0.22 if c.rstrip()[-1:] in ",:" else 0.45, None])
    marca = lambda m, cond: next((c for c in clausulas if c[2] is None and cond(c[0])), None)  # noqa: E731
    for m, cond in (("B0", lambda t: "Buch" in t and livro not in t), ("TITEL", lambda t: livro in t),
                    ("URL", lambda t: falado in t)):
        c = marca(m, cond)
        if not c: return None
        c[2] = m
    iu = next(i for i, c in enumerate(clausulas) if c[2] == "URL")
    if iu + 1 >= len(clausulas): return None
    clausulas[iu + 1][2] = "C0"
    return [tuple(c) for c in clausulas]


def bloco_split(pl, k, d, banco, rel, mf, mc, avisos):
    """Tela dividida: o monge numa faixa de 1/4 (rosto inteiro e centrado) + o b-roll em 3/4, com a voz do take."""
    import voz_conrad
    arq = os.path.join(d["takes"], k + ".mp4")
    vozw = voz_conrad.converter(arq)
    a, b = mf.janela_fala(arq, _limpa_fala(pl["texto"]), avisos, k)
    a, b = max(0.0, a - mf.PAD), min(mf.dur(arq), b + mf.PAD)
    dd = b - a
    lado = os.path.join(mf.TMP, f"lado_{k}.mp4")
    mf.video(banco.pegar(pl["n"], rel), dd, lado)
    faixa = mf.W // 4
    cx = mc.rosto_x(arq)
    filtro = (f"[0:v]scale={mf.W}:{mf.H},crop={faixa}:{mf.H}:'min(max(0,{cx:.4f}*iw-{faixa}/2),iw-{faixa})':0,"
              f"setsar=1,{mf.GRADE_AVATAR}[e];[1:v]crop={mf.W - faixa}:{mf.H}:{faixa // 2}:0,setpts=PTS-STARTPTS[d];"
              f"[e][d]hstack,fps={mf.FPS}[v];[2:a]afade=t=out:st={dd - 0.08:.3f}:d=0.08[a]")
    saida = os.path.join(mf.TMP, f"split_{k}.mp4")
    mf.ff("-ss", f"{a:.3f}", "-t", f"{dd:.3f}", "-i", arq, "-i", lado, "-ss", f"{a:.3f}", "-t", f"{dd:.3f}", "-i", vozw,
          "-filter_complex", filtro, "-map", "[v]", "-map", "[a]", *mf.VID, *mf.AUD, "-t", f"{dd:.3f}", saida)
    return saida


def etapa_montagem(pid):
    d = pastas(pid)
    import montar_fatia as mf, montar_completo as mc, costura, gerar_avatar as ga
    p = _proj.carregar(pid)
    mf.TMP = d["montagem"]; mc.TMP = d["montagem"]; mc.AVATAR = d["takes"]
    mc.SOBRA_MIN = mf.MIN_T                  # sobra do take menor que um plano minimo (2,2 s) fica no plano do avatar
    mf.MAX_CLIPE = 6.2                      # (10/10) a tomada mais longa medida no Elias: menos planos partidos em dois
    ga.TAKES, ga.FALAS = planejar_takes(p)
    banco = Banco(d, assuntos(pid) if os.path.exists(os.path.join(d["raiz"], "assuntos.json")) else {})
    if not banco.por_tag: raise RuntimeError("não há b-roll revisado no olho: rode a etapa B-roll antes")
    planos = planos_de(p)
    tem_take = {pl["n"]: f"t{pl['n']:03d}" for pl in planos if os.path.exists(os.path.join(d["takes"], f"t{pl['n']:03d}.mp4"))}
    mg = {int(x["secao"]): x["bloco"] for x in (p.get("producao") or {}).get("mg", []) if os.path.exists(x.get("bloco", ""))}
    blocos, generos, rel, avisos, run = [], [], [], [], []
    n_av = n_sp = 0

    def solta():
        nonlocal run
        if not run: return
        nome = f"b{len(blocos):03d}"
        b, _n = bloco_narrado(run, nome, banco, rel, mf)
        blocos.append(b); generos.append(("narr", run[0]["secao"], run[-1]["secao"])); run = []

    feitas_mg = set()
    # a secao do livro (Bruder Wendelin): os planos de b-roll dela viram a animacao do livro
    sec_livro = next((pl["secao"] for pl in planos if (p.get("perfil") or {}).get("livro", "@@") in pl["texto"]), None)
    planos_cta = [pl for pl in planos if pl["secao"] == sec_livro and pl["tipo"] == "broll"]
    cta = cta_do_livro(p, planos_cta) if planos_cta else None
    ns_cta = {pl["n"] for pl in planos_cta} if cta else set()
    for i, pl in enumerate(planos):
        s = pl["secao"]
        if pl["n"] in ns_cta:
            if pl["n"] == min(ns_cta):
                solta()
                mf.CTA = cta
                saida = os.path.join(mf.TMP, f"cta_{s:02d}.mp4")
                mf.bloco_cta(saida)
                blocos.append(saida); generos.append(("cta", s, s))
            continue
        if s in mg:
            if s not in feitas_mg:
                solta(); feitas_mg.add(s)
                saida = os.path.join(mf.TMP, f"mg_{s:02d}.mp4")
                mf.ff("-i", mg[s], "-vf", f"scale={mf.W}:{mf.H},fps={mf.FPS},setsar=1,{mf.GRADE_MG}", *mf.VID, *mf.AUD, saida)
                blocos.append(saida); generos.append(("mg", s, s))
            continue
        k = tem_take.get(pl["n"])
        if k and pl["tipo"] == "avatar":
            solta()
            ultimo = i + 1 >= len(planos) or planos[i + 1]["secao"] != s
            saida = os.path.join(mf.TMP, f"av_{k}.mp4")
            _dd, banco.forcar = mc.bloco_avatar(k, _limpa_fala(pl["texto"]), saida, avisos, ultimo)
            blocos.append(saida); generos.append(("fala", s, s)); n_av += 1
        elif k and pl["tipo"] == "split":
            solta()
            blocos.append(bloco_split(pl, k, d, banco, rel, mf, mc, avisos)); generos.append(("split", s, s)); n_sp += 1
        else:
            if run and run[-1]["secao"] != s: solta()        # troca de secao = fronteira de bloco (o clarao de pelicula)
            run.append(pl)                                   # b-roll, ou avatar sem take: narrado
    solta()
    tipos = [costura.tipo_entre(x, y) for x, y in zip(generos, generos[1:])]
    json.dump({"blocos": blocos, "generos": generos, "tipos": tipos}, open(os.path.join(mf.TMP, "blocos.json"), "w"), indent=1)
    json.dump(banco.escolhas, open(os.path.join(mf.TMP, "escolhas.json"), "w"), indent=1)
    saida = os.path.join(d["raiz"], "video.mp4" if not SECOES else "previa.mp4")       # teste por secao: previa
    feitas = costura.costurar_blocos(blocos, tipos, saida, mf.TMP)
    from collections import Counter
    minutos = round(mf.dur(saida) / 60, 1)
    if SECOES:
        print("previa:", saida, round(mf.dur(saida), 1), "s", flush=True)
        import leitura_1fps; leitura_1fps.main(saida, d["leitura"]); return
    gravar_producao(pid, "montagem", {"arquivo": saida, "minutos": minutos, "blocos": len(blocos),
                                      "transicoes": dict(Counter(t for t, q in feitas if q)), "lufs": -16.0,
                                      "resolucao": f"{mf.W}x{mf.H}", "avatar": n_av, "split": n_sp,
                                      "feito": time.strftime("%d/%m/%Y %H:%M")})
    registrar(pid, f"montagem: {minutos} min, {len(blocos)} blocos, {n_av} avatar + {n_sp} tela dividida · {saida}")
    for r in avisos + rel[:40]: print("  ⚠", r)
    # leitura otica a 1 fps (as folhas ficam em video/leitura para a revisao final)
    import leitura_1fps
    leitura_1fps.main(saida, d["leitura"])


ETAPAS = {"avatar": etapa_avatar, "baixar": etapa_baixar, "infograficos": etapa_infograficos, "voz": etapa_voz, "broll": etapa_broll, "montagem": etapa_montagem,
          "olho": lambda pid: revisar_no_olho(pid, de_novo="--de-novo" in sys.argv), "pente": pente_fino}

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    pid, etapa = sys.argv[1], sys.argv[2]
    if etapa == "avatar" and "--pago" in sys.argv:
        verba = int(sys.argv[sys.argv.index("--verba") + 1]) if "--verba" in sys.argv else 0
        etapa_avatar(pid, pago=True, verba=verba)
    else: ETAPAS[etapa](pid)
