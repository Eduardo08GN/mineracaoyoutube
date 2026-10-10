# Os takes do AVATAR (Bruder Wendelin falando para a camera), no Flow pela tela:
# Video > Elementos > personagem "Bruder Wendelin" > modelo, 16:9, 8 s, x1.
# ⛔⛔ MODELO (Eduardo, 09/10): o pipeline SEMPRE usa o gratis "Veo 3.1 - Lite [Lower Priority]" (0 credito no modo
#    Elementos, medido na tela). So' quando o Eduardo PEDIR outro modelo: "Veo 3.1 - Lite", 1 take (x1) de 8 s
#    (5 creditos, medido na tela) — python gerar_avatar.py enviar --pago. O Fast (10 cr.) nao e' mais usado.
# ⛔⛔ TAKES DINAMICOS (Eduardo, 09/10): nada de so' "do peito para cima, camera parada" em todo take. Cada take tem um
#    PLANO (corpo inteiro em pe, andando e falando, sentado de corpo inteiro, trabalhando, tres-quartos, close...) e um
#    CENARIO, e dois takes seguidos nunca repetem nem o plano nem o cenario; pelo menos 4 em cada 10 de corpo inteiro.
#    A montagem respeita o plano: take aberto entra com o quadro inteiro (sem o recorte do peito para cima).
# A trava confere o saldo ANTES de cada envio: no gratis, qualquer queda de saldo PARA tudo.
#   python work/video/gerar_avatar.py enviar [chave ...] [--pago]
import json, os, subprocess, sys, time

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
ESTADO = os.path.join(AQUI, "completo", "estado_avatar.json")
MODELOS = {"gratis": ("Veo 3.1 - Lite [Lower Priority]", 0), "pago": ("Veo 3.1 - Lite", 6)}   # (10/10) a tela anuncia 6
# verba so' para o pago (autorizacao do Eduardo a cada producao): base = saldo no inicio, limite = creditos liberados
VERBA = {"base": None, "limite": 0}       # base = o saldo no inicio de cada rodada (o enviar le)

# onde ele esta' (o lugar, sem o enquadramento)
CENARIO = {
    "K": "in a quiet vaulted monastery kitchen with a worn oak table, dried herb bundles and copper pots, soft daylight from a small window",
    "G": "in a walled monastery herb garden with raised beds of thyme, sage and lavender, soft overcast morning light",
    "S": "in a monastery garden shed with an old scarred potting bench, terracotta pots and dried herb bundles, soft window light",
    "C": "in a stone cloister walkway with arches and ivy, a small herb garden in the middle, gentle morning light",
    "P": "on a gravel path between tall herb beds in a monastery garden, old stone walls and fruit trees behind",
    "D": "in a wooden drying loft under the roof beams, hundreds of herb bundles hanging upside down, warm light through a gable window",
    "W": "in an old glasshouse attached to the monastery wall, rows of young herb plants in pots, diffuse bright light",
    "T": "at the old wooden gate of the monastery garden, a stone wall covered in climbing roses, late afternoon light",
}
# como a camera o mostra: (pedido ao Veo, enquadramento na montagem: aberto | medio | fechado)
PLANOS = {
    "em_pe": ("Wide full-body shot: he stands upright {lugar}, talking directly to the camera with calm natural hand gestures. "
              "Camera static at chest height, the whole figure from head to feet in frame.", "aberto"),
    "andando": ("Full-body tracking shot: he walks slowly toward the camera {lugar} while talking to it, the camera moving "
                "backward in front of him at the same pace, his whole body visible.", "aberto"),
    "sentado": ("Wide shot: he sits on an old wooden bench {lugar}, his whole body visible, leaning slightly forward and "
                "talking to the camera.", "aberto"),
    "porta": ("Wide shot: he steps out of a stone archway {lugar}, stops, turns to the camera and talks, full body in frame.", "aberto"),
    "trabalhando": ("Medium shot from the waist up, three-quarter angle: he works with his hands {lugar} (repotting a small herb, "
                    "cutting a few stems), then looks up into the camera and talks while his hands keep working.", "medio"),
    "tres_quartos": ("Medium shot from a three-quarter angle {lugar}, slow gentle push-in: he turns his head to the camera and talks.", "medio"),
    "baixo": ("Low-angle medium-wide shot {lugar}: he stands among tall herbs, the sky and branches behind him, talking down "
              "toward the camera.", "medio"),
    "close": ("Close-up of his face and shoulders {lugar}, slightly handheld, very shallow depth of field, he talks quietly "
              "and intimately to the camera.", "fechado"),
}
# ⭐ (10/10) tela dividida: o monge na faixa de ~45% da esquerda — plano medio CENTRADO, com folga dos dois lados,
#    para o rosto nunca sair cortado no recorte da faixa (nada de close: a cabeca nao cabe).
PLANOS["split"] = ("Medium shot from the waist up {lugar}: he stands in the exact horizontal center of the frame, facing the "
                   "camera, with generous empty space on both sides of him, eye level, static camera, and talks to the camera.", "medio")
PLANOS["split_mao"] = ("Medium shot from the waist up {lugar}: he stands in the exact horizontal center of the frame, holding a small "
                       "bunch of fresh herbs at chest height, generous empty space on both sides of him, static camera, and talks "
                       "to the camera.", "medio")
PLANOS["peito"] = ("Medium close-up from the chest up {lugar}, eye level, static camera on a tripod.", "fechado")   # o antigo
ROTACAO = ["em_pe", "trabalhando", "andando", "close", "sentado", "tres_quartos", "porta", "baixo"]
ROTACAO_CEN = ["G", "S", "P", "K", "C", "W", "D", "T"]


def plano_do_take(k):
    """(plano, cenario) do take: o que o TAKES pede, ou a rotacao (dois seguidos nunca iguais)."""
    i = list(TAKES).index(k)
    t = TAKES[k]
    pl = t[3] if len(t) > 3 and t[3] else ROTACAO[i % len(ROTACAO)]
    cen = t[0] if t[0] else ROTACAO_CEN[i % len(ROTACAO_CEN)]
    return pl, cen


def enquadramento(k):
    return PLANOS[plano_do_take(k)[0]][1]


# chave: (cenario, numeros das frases em completo/frases.json, gesto[, plano])
# ⛔ os takes abaixo sao do video do Klostergarten (09/10), feitos ANTES da regra dos takes dinamicos: o plano
#    "peito" mantem o enquadramento antigo para quem remontar esse video. Producao nova: deixe o plano vazio (rotacao).
TAKES = {
    "a01": ("K", [35, 36], "", "peito"),
    "a02": ("G", [56], "", "peito"),        # ⛔ "Ich bin Bruder Wendelin" na boca dele = recusa por "pessoa famosa" (Sao Wendelino)
    "a03": ("K", [66], "He leans slightly forward.", "peito"),
    "a05": ("S", [114], "He gives a small nod at the end.", "peito"),
    "a06": ("G", [123], "He raises one finger slightly.", "peito"),
    "a07": ("S", [128, 129], "", "peito"),
    "a08": ("G", [136, 137], "He smiles faintly.", "peito"),
    "a09": ("S", [157], "He taps the bench once with his fingers.", "peito"),
    "a10": ("G", [167], "", "peito"),
    "a12": ("K", [195], "He opens one hand slightly.", "peito"),
    "a13": ("K", [211, 212], "He repeats the number slowly, with a small smile.", "peito"),
    "a14": ("K", [244, 245, 246], "", "peito"),
    "a15": ("G", [248], "He leans slightly forward.", "peito"),
    "a16": ("S", [250, 251], "", "peito"),
    "a17": ("K", [270, 271], "He smiles warmly.", "peito"),
    "a18": ("G", [279], "He gives a small, warm nod and smiles.", "peito"),
}


def frases():
    return {f["n"]: f for f in json.load(open(os.path.join(AQUI, "completo", "frases.json"), encoding="utf-8"))}


# ⭐ (09/10) uso generico pelo projeto_video.py: FALAS = {take: texto}, PASTA_TAKES = onde baixar, ESTADO = estado do projeto
FALAS = None
PASTA_TAKES = os.path.join(AQUI, "completo", "avatar")


def fala_de(k):
    """O texto que o monge diz no take. ⛔ sem o travessao: no a05/a10 ele virou gaguejo ("Po, Petersilie")."""
    if FALAS is not None: return FALAS[k].replace(" – ", " ").replace("–", " ")
    return " ".join(frases()[n]["texto"] for n in TAKES[k][1]).replace(" – ", " ")


def prompt(k):
    _cen, _ns, gesto = TAKES[k][:3]
    pl, cen = plano_do_take(k)
    lugar = CENARIO.get(cen, cen)
    if len(lugar) == 1: raise SystemExit(f"{k}: cenario {cen} desconhecido")
    camera = PLANOS[pl][0].format(lugar=lugar)
    fala = fala_de(k)
    return (f"Bruder Wendelin, the old monk. {camera} Shallow depth of field, natural warm colors, photorealistic, "
            f"cinematic documentary look. He says in German, slowly and warmly: \"{fala}\" "
            f"{gesto + ' ' if gesto else ''}Then he pauses and keeps looking kindly into the camera. "
            f"No music, no subtitles, no text on screen.")


def carregar():
    try: return json.load(open(ESTADO, encoding="utf-8"))
    except Exception: return {}                                                    # noqa: BLE001


def gravar(e):
    json.dump(e, open(ESTADO + ".tmp", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    os.replace(ESTADO + ".tmp", ESTADO)


_PW = []           # ⭐ (10/10) UMA conexao com a aba do Flow (antes: um processo novo por gesto, 7-10 s cada)


def _pagina(nova=False):
    import ivone
    from playwright.sync_api import sync_playwright
    if nova and _PW:
        try: _PW[0][0].stop()
        except Exception: pass                                                       # noqa: BLE001
        _PW.clear()
    if not _PW:
        pw = sync_playwright().start()
        b = ivone.conectar(pw)
        _PW.append((pw, b, ivone.minha_aba(b)))
    return _PW[0][2]


def iv(*a):
    """Os mesmos comandos do ivone.py (js, digitar, tecla, clique, esperar, ir), na conexao persistente."""
    cmd = a[0]
    for tent in range(2):
        try:
            pg = _pagina(nova=bool(tent))
            if cmd == "js":
                return json.dumps(pg.evaluate(a[1]), ensure_ascii=False)
            if cmd == "digitar":
                pg.keyboard.type(a[1], delay=8); time.sleep(.5); return ""
            if cmd == "tecla":
                pg.keyboard.press(a[1]); time.sleep(.5); return ""
            if cmd == "clique":
                pg.mouse.click(float(a[1]), float(a[2])); time.sleep(1); return ""
            if cmd == "esperar":
                fim = time.time() + float(a[2] if len(a) > 2 else 300)
                while time.time() < fim:
                    if pg.evaluate(a[1]): return "pronto"
                    time.sleep(4)
                return "tempo esgotado"
            if cmd == "ir":
                pg.goto(a[1], wait_until="domcontentloaded"); time.sleep(4); return pg.url
            raise ValueError(cmd)
        except ValueError:
            raise
        except Exception as e:                                                       # noqa: BLE001
            if tent: print("  (aba do Flow:", str(e)[:100], ")", flush=True); return ""
    return ""


# ⛔ so' vale a miniatura DENTRO da caixa de comando: a do card do a01 na lista enganava a conferencia (saiu outro monge)
ANEXADO = ("[...document.querySelectorAll('img[alt=\"Imagem do elemento de personagem\"]')].some(i => { "
           "const b = i.getBoundingClientRect(); return b.top > 560 && b.left > 560 && b.left < 1300 && b.width > 0; })")


def anexar():
    """Anexa o personagem no comando (o Flow tira o anexo depois de cada envio)."""
    if iv("js", ANEXADO) == "true": return True
    iv("tecla", "Escape"); time.sleep(1)
    iv("clique", "678", "852")                                     # o "+" (Adicionar elementos) do comando
    time.sleep(2)
    iv("js", r"(() => { const f=[...document.querySelectorAll('.cdk-overlay-pane *')].find(e=>e.children.length<=2 && /^\s*(accessibility_new\s*)?Personagens\s*$/.test(e.innerText||'')); if(f){f.click(); return 1;} return 0; })()")
    time.sleep(2)
    iv("js", "(() => { const it=[...document.querySelectorAll('.cdk-overlay-pane *')].find(e=>e.children.length<=3 && /Bruder Wendelin/.test(e.innerText||'') && e.getBoundingClientRect().height<80); if(it){it.click(); return 1;} return 0; })()")
    time.sleep(1.5)
    iv("js", "(() => { const b=[...document.querySelectorAll('.cdk-overlay-pane button')].find(b=>/Incluir no comando/.test(b.innerText)); if(b){b.click(); return 1;} return 0; })()")
    time.sleep(2)
    return iv("js", ANEXADO) == "true"


_SES = []          # ⭐ (10/10) UMA conexao com o navegador para a rodada inteira (o OW reconecta so' no selo novo)


def _sessao(nova=False):
    import flow_ivone as fi
    if nova and _SES:
        try: _SES[0][1].close()
        except Exception: pass                                                       # noqa: BLE001
        _SES.clear()
    if not _SES: _SES.append(fi.conectar())
    return _SES[0][0]


def _rpc(fn):
    try: return fn(_sessao())
    except Exception:                                                                # noqa: BLE001
        return fn(_sessao(nova=True))                     # a conexao caiu (ou o selo foi renovado): uma nova


def saldo():
    import flow_ivone as fi
    return _rpc(fi.fh.creditos)


def geracoes(todas=False):
    """{texto do pedido: id} das geracoes de video COM o personagem (r2v) aceitas no projeto (a recusada nao entra).
    todas=True: {texto: (id, com_personagem)} de toda geracao de video."""
    import flow_ivone as fi
    r = None
    for _ in range(3):                         # a pagina do Flow as vezes demora (o RPC estoura 60 s): tenta de novo
        try:
            r = _rpc(lambda s: s.batchexecute("Zzl0ze", json.dumps([f"projects/{fi.PROJETO}", None, None, None, [2]],
                                                                    separators=(",", ":"))))
            break
        except Exception as e:                                                       # noqa: BLE001
            print("  (lista do projeto demorou:", str(e)[:80], ")", flush=True); time.sleep(10)
    if r is None: raise SystemExit("a lista do projeto nao respondeu 3 vezes")
    out = {}
    for e in r[2] if isinstance(r, list) and len(r) > 2 and isinstance(r[2], list) else []:
        t = json.dumps(e, ensure_ascii=False)
        if todas and "veo_" in t: out[t] = (e[0], "r2v_" in t)
        elif "r2v_" in t: out[t] = e[0]
    return out


_PAINEL = r"[...document.querySelectorAll('.cdk-overlay-pane')].map(p=>p.innerText.replace(/\s+/g,' ')).join(' || ')"


def _abrir_menu():
    """Garante o menu do comando aberto (o botao "Video · 8s · x1")."""
    for _ in range(3):
        if "arrow_drop_down" in iv("js", _PAINEL): return True
        iv("tecla", "Escape"); time.sleep(.6)
        # o botao "Video · 720p · 8s · x1" do comando (por texto: a posicao muda com a janela)
        iv("js", r"(() => { const b=[...document.querySelectorAll('button')].find(b=>/x[1-4]\s*$/.test(b.innerText.trim()) && b.getBoundingClientRect().top>500); if(b){b.click(); return 1;} return 0; })()")
        time.sleep(1.6)
    return "arrow_drop_down" in iv("js", _PAINEL)


def conferir_tela(modelo="gratis"):
    """Poe o modelo certo (gratis = Lite [Lower Priority]; pago = Lite), 8 s e x1, e confere o custo que a tela anuncia
    (0 / 5 creditos)."""
    nome, custo = MODELOS[modelo]
    for _ in range(3):
        if not _abrir_menu(): continue
        # o comando pode estar no modo Imagem: forca Video + Elementos (o personagem) antes do modelo
        for rot in ("videocam Vídeo", "chrome_extension Elementos"):
            iv("js", r"(() => { const b=[...document.querySelectorAll('.cdk-overlay-pane button')].find(b=>b.innerText.replace(/\s+/g,' ').trim()==="
                     f"{json.dumps(rot)}); if(b){{b.click(); return 1;}} return 0; }})()")
            time.sleep(1.0)
        if "arrow_drop_down" not in iv("js", _PAINEL): _abrir_menu()
        if f"{nome} arrow_drop_down" in iv("js", _PAINEL): break
        iv("js", r"(() => { const b=[...document.querySelectorAll('.cdk-overlay-pane button')].find(b=>/arrow_drop_down$/.test(b.innerText.replace(/\s+/g,' ').trim())); if(b){b.click(); return 1;} return 0; })()")
        time.sleep(1.4)
        iv("js", "(() => { const it=[...document.querySelectorAll('.cdk-overlay-pane [role=menuitem], .cdk-overlay-pane button')]"
                 rf".find(b=>b.innerText.replace(/\s+/g,' ').trim()==={json.dumps('volume_up ' + nome)}); if(it){{it.click(); return 1;}} return 0; }})()")
        time.sleep(1.4)
    _abrir_menu()
    for b in ("8s", "x1"):
        iv("js", "(() => { const b=[...document.querySelectorAll('.cdk-overlay-pane button')].find(b=>b.innerText.trim()==="
                 f"{json.dumps(b)}); if(b){{b.click(); return 1;}} return 0; }})()")
        time.sleep(.6)
    txt = iv("js", _PAINEL)
    iv("tecla", "Escape"); time.sleep(.8)
    import re as _re
    m = _re.search(r"usar (\d+) créditos", txt)
    # o custo anunciado nao pode passar do combinado para o modelo (gratis: 0; pago: ate' 6 por take)
    return f"{nome} arrow_drop_down" in txt and m is not None and int(m.group(1)) <= custo, txt[:220]


# ⭐⭐ (10/10, Eduardo) SO' os tempos e gestos do OW Agente (a ferramenta de referencia), nada inventado:
#    - PAUSA_ENTRE_GERACOES_S = 45 entre um envio e o seguinte (macro.py);
#    - no freio do Google: FREIO_REPOUSO_S = 120 de descanso e UMA renovacao do selo (limpa os dados das origens,
#      recarrega o projeto UMA vez por uma conexao nova) — flow_http.FlowHTTP;
#    - fora isso, nenhum recarregamento de pagina, e consulta ao projeto so' para confirmar o envio.
PAUSA_ENTRE_GERACOES_S = 45
FREIO_REPOUSO_S = 120
CONFIRMA_S = (10, 20)            # o envio aparece no projeto em segundos: no maximo 2 consultas


def renovar_selo():
    import flow_ivone as fi
    time.sleep(FREIO_REPOUSO_S)
    s, cdp = fi.conectar()
    try: fi.renovar_selo(cdp)
    finally: cdp.close()
    _sessao(nova=True)                                    # conexao nova depois do selo, como o OW (_reconectar)
    _pagina(nova=True)
    # o OW espera a pagina assentar no projeto (ate' 45 s), sem recarregar de novo
    iv("esperar", "!!document.querySelector('[contenteditable=true]')", "45")


def recarregar():
    import flow_ivone as fi
    iv("ir", f"https://flow.google.com/u/{fi.CONTA}/project/{fi.PROJETO}"); time.sleep(8)


FREIO_NA_TELA = ("(() => { const t=document.body.innerText; return /atividade incomum|unusual activity/i.test(t.slice(0, 4000)); })()")


def enviar(so=None, modelo="gratis"):
    custo = MODELOS[modelo][1]
    if VERBA["base"] is None: VERBA["base"] = saldo()                 # gratis: qualquer queda a partir daqui PARA tudo
    print("saldo no inicio:", VERBA["base"], "| modelo:", MODELOS[modelo][0], flush=True)
    est = carregar()
    feitos = geracoes(todas=True)                                     # uma consulta: o que ja' entrou antes
    tela_ok = False
    for k in TAKES:
        if so and k not in so: continue
        if est.get(k, {}).get("id"): continue
        fala = fala_de(k)
        ja = next((v[0] for t, v in feitos.items() if fala in t and v[1]), None)
        if ja:
            est[k] = dict(est.get(k, {}), id=ja); gravar(est); continue
        for tent in range(5):
            sd = saldo(); gasto = VERBA["base"] - sd
            if gasto + custo > VERBA["limite"]:
                print(f"⛔ verba: {gasto} creditos gastos desde {VERBA['base']} (saldo {sd}), limite {VERBA['limite']}: "
                      f"PAREI antes de {k}", flush=True); return
            if not tela_ok:                                          # so' no inicio e depois de renovar o selo
                ok, txt = conferir_tela(modelo)
                if not ok:
                    print(f"⛔ a tela nao ficou em {MODELOS[modelo][0]} / {custo} creditos ({txt}): PAREI", flush=True); return
                tela_ok = True
            if iv("js", ANEXADO) != "true" and not anexar():
                print(f"⛔ o personagem nao anexou: PAREI antes de {k}", flush=True); return
            p = prompt(k)
            # ⛔ DIGITA (colar apagava o anexo do personagem)
            iv("js", "(() => { const t=document.querySelector('[contenteditable=true]'); t.focus(); "
                     "const r=document.createRange(); r.selectNodeContents(t); r.collapse(false); "
                     "const s=getSelection(); s.removeAllRanges(); s.addRange(r); return 1; })()")
            iv("digitar", p)
            ok_anexo = iv("js", ANEXADO) == "true"
            ok_texto = iv("js", "document.querySelector('[contenteditable=true]').innerText.includes(" + json.dumps(p[:40]) + ")") == "true"
            if not (ok_anexo and ok_texto):
                print(f"⛔ {k}: antes do Enter o anexo={ok_anexo} texto={ok_texto}: PAREI sem enviar", flush=True); return
            antes = set(v[0] for v in feitos.values())
            iv("tecla", "Enter")
            aceito, freou = None, False
            for espera in CONFIRMA_S:
                time.sleep(espera)
                if iv("js", FREIO_NA_TELA) == "true": freou = True; break
                feitos = geracoes(todas=True)
                achou = [v for t, v in feitos.items() if fala in t and v[0] not in antes]
                if any(not com for _i, com in achou):
                    print(f"⛔ {k}: saiu uma geracao SEM o personagem: PAREI tudo", flush=True); return
                aceito = next((i for i, com in achou if com), None)
                if aceito: break
            if aceito:
                est[k] = {"id": aceito, "enviado": time.strftime("%H:%M:%S"), "saldo_antes": sd, "prompt": p}; gravar(est)
                print(f"  {k} aceito (saldo antes {sd}, gasto ate' aqui {gasto})", flush=True)
                break
            print(f"  {k}: {'freio do Google' if freou else 'nao apareceu no projeto'} -> {FREIO_REPOUSO_S} s e selo novo "
                  f"(OW Agente)", flush=True)
            renovar_selo(); tela_ok = False
        else:
            print(f"⛔ {k}: 5 recusas seguidas: PAREI", flush=True); return
        time.sleep(PAUSA_ENTRE_GERACOES_S)
    print("saldo agora:", saldo(), flush=True)


def baixar():
    """Baixa os takes prontos em 720p (a montagem recorta do peito para cima)."""
    import flow_ivone as fi
    fh = fi.fh
    est = carregar()
    s, c = fi.conectar()
    try:
        for k, v in est.items():
            arq = os.path.join(PASTA_TAKES, k + ".mp4")
            if not v.get("id") or os.path.exists(arq): continue
            st = fh.poll(s, [v["id"]]).get(v["id"])
            if st != "pronto": print(f"  {k}: {st}", flush=True); continue
            os.makedirs(os.path.dirname(arq), exist_ok=True)
            url = fh.media_info(s, v["id"]).get("url")
            if url: fh.download_video(s, url, arq); print("  baixado", k, flush=True)
    finally:
        c.close()


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if sys.argv[1] == "prompts":
        for k in TAKES: print(k, prompt(k), "\n")
    elif sys.argv[1] == "baixar":
        baixar()
    else:
        # --pago so' quando o Eduardo pedir (Veo 3.1 Lite, x1, 8 s) e com VERBA["limite"] liberado por ele
        enviar(set(a for a in sys.argv[2:] if not a.startswith("--")) or None, "pago" if "--pago" in sys.argv else "gratis")
