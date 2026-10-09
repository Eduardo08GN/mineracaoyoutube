# Cliente do Flow da conta "12 Ivone" (Dolphin 869356248) pelo BACKEND da ferramenta ow_agente
# (C:\Users\edlut\ow_agente\organic-wave-studio\agente\flow_http.py, usado como biblioteca, sem alterar nada la').
# ⛔ Video SO' no veo_3_1_interpolation_lite_low_priority (gratis) e imagem so' nos modelos gratis da ferramenta:
#    qualquer geracao que cobrar credito PARA (mesma trava do piloto).
#   python work/video/flow_ivone.py creditos
import json, os, sys, time

OW = r"C:\Users\edlut\ow_agente\organic-wave-studio"
for p in (os.path.join(OW, "agente"), os.path.join(OW, "motor")):
    if p not in sys.path: sys.path.insert(0, p)
import flow_http as fh            # noqa: E402
# ⛔ o estado dos modelos de imagem desta conta fica AQUI, nunca na pasta da ferramenta (ela e' do usuario)
fh._arq_modelos = lambda: os.path.join(os.path.dirname(os.path.abspath(__file__)), "estado_modelos_imagem.json")

PERFIL = "869356248"
PROJETO = "0a75314c-9cc7-4f40-ba06-88f1ec191577"     # projeto "Bruder Wendelin" criado em 08/10 na conta da Ivone
CONTA = "0"                                          # a Ivone mora em /u/0/ nesse perfil


def _porta():
    arq = os.path.join(os.environ["APPDATA"], "dolphin_anty", "browser_profiles", PERFIL, "data_dir", "DevToolsActivePort")
    return int(open(arq).readline().strip())


def conectar():
    """CDP direto na MINHA aba do projeto (nunca na aba do outro projeto da Ivone) e sessao do Flow."""
    import requests
    alvos = requests.get(f"http://127.0.0.1:{_porta()}/json/list", timeout=10).json()
    aba = next((t for t in alvos if t.get("type") == "page" and PROJETO in t.get("url", "")), None)
    if not aba:
        raise SystemExit("a aba do projeto Bruder Wendelin nao esta aberta no perfil da Ivone")
    cdp = fh.CDPConnection(aba["webSocketDebuggerUrl"])
    s = fh.FlowSession(PROJETO, user_path=f"/u/{CONTA}/", auth_index=CONTA)
    s.bootstrap(cdp)
    return s, cdp


def imagem(s, texto, refs=(), aspecto=1, modelo=None):
    """O MESMO pedido ogiZ0b do flow_http._pedido_imagem (modelos gratis), com o campo da proporcao
    livre: no flow_http ele vai fixo em 2 (9:16, a ferramenta e' de video vertical). Devolve o id."""
    import random, uuid
    modelo = modelo or fh.MODELOS_IMAGEM[fh._proximo_modelo(fh._modelo_imagem[0]) or 0]
    token = s.recaptcha_token("IMAGE_GENERATION")
    ctx = [None, 22, None, None, None, PROJETO, None, None, None, None, [token, 1]]
    payload = json.dumps([
        None,
        [[None, None, [[r, None, None, None, 1] for r in refs], random.randint(1_000_000, 99_999_999), aspecto,
          modelo, None, ctx, [[[texto]]], None, None, None,
          str(uuid.uuid4()).upper(), str(uuid.uuid4()).upper()]],
        1, ctx, [str(uuid.uuid4()).upper()],
    ], separators=(",", ":"))
    r = s.batchexecute("ogiZ0b", payload, timeout=120)
    return r[0][0][0]


def imagem_feliz(s, texto, refs=(), aspecto=3, diz=print):
    """⭐ O CAMINHO DA FERRAMENTA para imagem (copia de flow_http._pedido_imagem, so' com a proporcao livre):
    rodizio NARWHAL -> GEM_PIX_2 -> HARBOR_SEAL -> BELUGA; modelo no limite do dia passa para o proximo gratis;
    modelo ainda nao medido NESTA conta roda sozinho com o saldo conferido antes e depois e, se cobrar, fica
    marcado e nunca mais e' usado; [5] = o modelo nao existe nesta conta; freio = fh.Freio; filtro de conteudo
    = recusa definitiva. ⛔ `imagem()` acima pula tudo isso (modelo fixo): nao usar para gerar em lote."""
    import random, uuid
    while True:
        i = fh._proximo_modelo(fh._modelo_imagem[0])
        if i is None:
            raise fh.SemLimpeza("nenhum modelo de imagem gratis disponivel agora nesta conta")
        if i != fh._modelo_imagem[0]:
            diz(f"  imagem: passo para o modelo {fh.MODELOS_IMAGEM[i]}"); fh._modelo_imagem[0] = i
        modelo = fh.MODELOS_IMAGEM[i]
        d = fh._estado_modelos()
        medir = modelo not in fh.MEDIDOS_GRATIS and modelo not in d["gratis"]
        token = s.recaptcha_token("IMAGE_GENERATION")
        ctx = [None, 22, None, None, None, PROJETO, None, None, None, None, [token, 1]]
        payload = json.dumps([None, [[None, None, [[r, None, None, None, 1] for r in refs],
                                      random.randint(1_000_000, 99_999_999), aspecto, modelo, None, ctx, [[[texto]]],
                                      None, None, None, str(uuid.uuid4()).upper(), str(uuid.uuid4()).upper()]],
                              1, ctx, [str(uuid.uuid4()).upper()]], separators=(",", ":"))
        try:
            if not medir:
                r = s.batchexecute("ogiZ0b", payload, timeout=120)
            else:
                c0 = fh.creditos(s)
                r = s.batchexecute("ogiZ0b", payload, timeout=120)
                gasto = c0 - fh.creditos(s)
                d = fh._estado_modelos()
                if gasto > 0:
                    d["cobra"][modelo] = gasto; diz(f"  ⚠ o modelo {modelo} cobrou {gasto}: nao uso mais")
                elif modelo not in d["gratis"]:
                    d["gratis"].append(modelo); diz(f"  modelo {modelo}: gratis nesta conta ✓")
                fh._gravar_modelos(d)
            return r[0][0][0], modelo
        except fh.ErroFlow as e:
            if e.detalhe == [5] or (e.detalhe == [3] and medir):
                d = fh._estado_modelos(); d["sem_modelo"][modelo] = str(e.detalhe); fh._gravar_modelos(d)
                diz(f"  o modelo {modelo} nao serve nesta conta ({e.detalhe})"); continue
            if fh.e_cota(e.detalhe):
                d = fh._estado_modelos(); d["esgotado_ate"][modelo] = fh._meia_noite_california(); fh._gravar_modelos(d)
                diz(f"  o modelo {modelo} chegou ao limite do dia"); continue
            if fh.e_freio(e.detalhe): raise fh.Freio(fh.motivo(e.detalhe)) from e
            raise


def marcar_cobra(modelo, gasto):
    """Registra no estado desta conta que o modelo cobrou (o rodizio nunca mais o usa)."""
    d = fh._estado_modelos(); d["cobra"][modelo] = gasto; fh._gravar_modelos(d)


import regras as _regras          # noqa: E402  (frases da ferramenta: RESPIRO_ANTES_DA_FALA, FALA_UMA_VEZ)

VOZ = "the old monk, in German, with a low, slightly husky, calm and warm old man's voice, natural and clear"


def prompt_fala(fala, movimento="He stays seated at the table and talks calmly to the camera with small, natural head movements and blinking; his hands rest on the table."):
    """O prompt de fala no formato do pedido.prompt da ferramenta (quadros iguais: sem a frase da mudanca)."""
    return " ".join(["Interpolate naturally between the two given frames.", movimento,
                     f'Dialogue: "{fala}" Voice: spoken by {VOZ}. The other people in frame do not speak and stay silent.',
                     _regras.RESPIRO_ANTES_DA_FALA, _regras.FALA_UMA_VEZ,
                     "Ambient room tone. No music. No on-screen text, no captions, no subtitles."])


def prompt_sem_fala(movimento):
    return " ".join(["Interpolate naturally between the two given frames.", movimento, "No speech.",
                     "Ambient room tone. No music. No on-screen text, no captions, no subtitles."])


def renovar_selo(cdp):
    """O que a ferramenta faz no freio (FlowHTTP._limpar_selo_e_recarregar): limpa a memoria do selo
    anti-robo e recarrega o projeto. O login fica (cookies de accounts.google intactos)."""
    for origem, tipos in fh.FlowHTTP._ORIGENS_SELO:
        try: cdp.send("Storage.clearDataForOrigin", {"origin": origem, "storageTypes": tipos})
        except Exception: pass                                                  # noqa: BLE001
    cdp.send("Page.navigate", {"url": f"https://flow.google.com/u/{CONTA}/project/{PROJETO}"})
    time.sleep(8)


# ⭐⭐ (08/10, pedido capturado da tela do Flow: Frames, 16:9, Veo 3.1 Lite [Lower Priority], x1)
#   gen_def = [[None,None,[[[prompt]]]], modelo, ASPECTO, None, [None, ini, None,None,None, RECORTE], [... fim ...], [ids]]
#   ASPECTO: 1 = 9:16 (o que o flow_http manda, ferramenta vertical), 2 = 16:9. O "[uuid, 2]" do fim nao muda.
#   RECORTE: [topo, esquerda, baixo, direita] da imagem que cabe na proporcao (1376x768 em 16:9: [None, .0039, 1, .9961]).
ASPECTO_169 = 2


def recorte_169(w, h):
    alvo = 16 / 9
    if w / h > alvo:
        m = (1 - h * alvo / w) / 2
        return [None, m, 1, 1 - m]
    m = (1 - w / alvo / h) / 2
    return [m or None, None, 1 - m, 1]


def _gerar_video(s, prompt, ini, fim, tam_ini=(1376, 768), tam_fim=(1376, 768)):
    """O pedido nprQif da tela do Flow em 16:9, no modelo gratis (o flow_http manda 9:16 fixo)."""
    import uuid
    gen_def = [
        [None, None, [[[prompt]]]],
        fh.MODELO_GRATIS, ASPECTO_169, None,
        [None, ini, None, None, None, recorte_169(*tam_ini)],
        [None, fim, None, None, None, recorte_169(*tam_fim)],
        [None, None, None, None, str(uuid.uuid4()).upper(), str(uuid.uuid4()).upper()],
    ]
    token = s.recaptcha_token("VIDEO_GENERATION")
    payload = json.dumps([[gen_def], [None, 22, None, None, None, PROJETO, None, None, None, None, [token, 1]],
                          [str(uuid.uuid4()).upper(), 2]], separators=(",", ":"))
    r = s.batchexecute("nprQif", payload)
    ops = r[3] if len(r) > 3 else []
    return ops[0][0], r[1]


def video(s, prompt, ini, fim):
    """Uma geracao no Veo 3.1 Lite [Lower Priority] (gratis). Devolve o id da operacao.
    ⛔ cobrou qualquer credito -> SystemExit. Freio do Google -> fh.Freio (quem chama descansa)."""
    saldo = fh.creditos(s)
    try:
        op, rest = _gerar_video(s, prompt, ini, fim)
    except fh.ErroFlow as e:
        if fh.e_freio(e.detalhe): raise fh.Freio(fh.motivo(e.detalhe)) from e
        raise
    if isinstance(rest, (int, float)) and rest < saldo:
        raise SystemExit(f"⛔ a geracao cobrou {saldo - rest} creditos: parei (so' gratis)")
    return op


def esperar_e_baixar(s, ops, pasta, prazo=1200):
    """ops: {nome: op_id}. Consulta em lotes (fh.poll) e baixa cada video pronto em pasta/<nome>.mp4."""
    falta, fim, feitos = dict(ops), time.time() + prazo, {}
    while falta and time.time() < fim:
        st = fh.poll(s, list(falta.values()))
        for nome, op in list(falta.items()):
            if st.get(op) == "pronto":
                url = fh.media_info(s, op).get("url")
                if url:
                    feitos[nome] = fh.download_video(s, url, os.path.join(pasta, nome + ".mp4")); del falta[nome]
            elif st.get(op) in ("falhou", "recusado"):
                feitos[nome] = None; del falta[nome]
        if falta: time.sleep(10)
    return feitos, falta


class Gratis:
    """Uma geracao que nao pode cobrar: confere o saldo antes e depois."""
    def __init__(self, s): self.s = s
    def __enter__(self): self.antes = fh.creditos(self.s); return self
    def __exit__(self, *exc):
        if exc[0]: return False
        depois = fh.creditos(self.s)
        if depois < self.antes:
            raise SystemExit(f"⛔ a geracao cobrou {self.antes - depois} creditos: parei (so' gratis)")


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    s, cdp = conectar()
    if sys.argv[1:2] == ["creditos"]:
        print("creditos:", fh.creditos(s), "| tokens:", bool(s.at), bool(s.sid), bool(s.recaptcha_key))
    cdp.close()
