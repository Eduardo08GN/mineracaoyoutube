# Narra cada capitulo do roteiro.json no AI Studio (Gemini TTS) e baixa o wav. What If ES (video 08, mar subindo).
#   python narrar.py [id ...]
import json, os, sys, time
# processo unico: dois narradores na mesma aba do AI Studio baixam o audio um do outro (24/10/2026: 4 processos vivos
# depois de TaskStop geraram wavs trocados e invalidos)
TRAVA = "D:/tmp/narrar.pid"
if os.path.exists(TRAVA):
    import subprocess
    pid = open(TRAVA).read().strip()
    if pid and pid in subprocess.run(["tasklist", "/FI", f"PID eq {pid}", "/NH"], capture_output=True, text=True).stdout:
        sys.exit(f"NARRAR_JA_RODANDO pid {pid}")
open(TRAVA, "w").write(str(os.getpid()))
sys.path.insert(0, r"D:\kriegschronik\tracer3d_01_paris\voz_teste")
import ais
AQUI = os.path.dirname(os.path.abspath(__file__))
ESTILO = ("Warm, curious science storyteller speaking neutral Latin American Spanish (no Spain accent, no vosotros), male, around thirty-five; "
          "clear diction with a sense of wonder and quiet suspense, like guiding a friend through an astonishing thought experiment; "
          "numbers read slowly and clearly; short pauses after each sentence and a longer pause before a reveal; never theatrical, never shouting.")
caps = json.load(open(os.path.join(AQUI, "..", "roteiro", "roteiro.json"), encoding="utf-8"))["kapitel"]
quero = sys.argv[1:]

def preparar(pg):
    # com audio gerado na pagina o Chrome pergunta "sair da pagina?" e o goto empaca (24/10/2026): aceita e confere
    for tent in range(3):
        pg.goto("https://aistudio.google.com/generate-speech"); pg.wait_for_timeout(7000)
        try: pg.get_by_text("The Master Storyteller").click(timeout=20000); break
        except Exception:
            if tent == 2: raise
    pg.wait_for_timeout(5000)
    while pg.locator('[aria-label="Delete speech block"]').count() > 1:
        pg.locator('[aria-label="Delete speech block"]').last.dispatch_event("click"); pg.wait_for_timeout(800)
    pg.get_by_text("Rich, velvety").click(); pg.wait_for_timeout(1200)
    pg.locator(".cdk-overlay-container textarea").first.fill(ESTILO); pg.wait_for_timeout(500)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(800)

def um(pg, c):
    preparar(pg)
    ta = pg.locator('textarea[aria-label="Speech block text"]').first
    ta.fill(c["text"]); pg.wait_for_timeout(600)
    run = pg.locator('button.ms-button-primary:has-text("Run")')
    run.click(); t0 = time.time()
    # so conta como gerado depois que o "Stop" aparece (24/10/2026: sem isso baixava lixo em 12 s)
    while time.time() - t0 < 60 and "Stop" not in pg.locator("body").inner_text(): pg.wait_for_timeout(1000)
    if "Stop" not in pg.locator("body").inner_text(): raise RuntimeError("Run nao comecou a gerar")
    while time.time() - t0 < 600:
        txt = pg.locator("body").inner_text()
        if "Stop" not in txt and run.is_enabled(): break
        pg.wait_for_timeout(3000)
    pg.wait_for_timeout(2000)
    # 24/10/2026: NAO clicar em pausa antes do download; o AI Studio passou a abortar o audio e o download saia com 0 byte
    # o balao "Send prompt" do botao Run fica aberto e cobre o Download (24/10/2026): tira o mouse e fecha antes
    pg.mouse.move(5, 5); pg.keyboard.press("Escape"); pg.wait_for_timeout(600)
    import subprocess
    tmp = os.path.join(AQUI, c["id"] + ".parcial.wav"); esperado = len(c["text"].split()) / 2.4   # ~144 palavras/min
    # download as vezes sai com 0 bytes (o audio longo ainda finalizando): tenta baixar de novo antes de regerar
    for k in range(5):
        with pg.expect_download(timeout=90000) as d:
            bt = pg.locator('button:has-text("download")').last
            try: bt.click(timeout=8000)
            except Exception: bt.dispatch_event("click")
        d.value.save_as(tmp)
        r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", tmp], capture_output=True, text=True)
        dur = float(r.stdout.strip() or 0)
        if dur > 0: break
        print(c["id"], f"download vazio, nova tentativa {k + 1}", flush=True); pg.wait_for_timeout(8000)
    if not (0.6 * esperado < dur < 1.6 * esperado):
        tam = os.path.getsize(tmp); cab = open(tmp, "rb").read(12); os.remove(tmp)
        raise RuntimeError(f"wav invalido ou fora do tamanho: {dur:.1f} s, esperado ~{esperado:.0f} s, {tam} bytes, {cab!r}, {r.stderr[:120]}")
    os.replace(tmp, os.path.join(AQUI, c["id"] + ".wav"))
    print(c["id"], f"{time.time() - t0:.0f}s", flush=True)

def f(pg):
    pg.on("dialog", lambda d: d.accept())
    for c in caps:
        if quero and c["id"] not in quero: continue
        if not quero and os.path.exists(os.path.join(AQUI, c["id"] + ".wav")): continue
        for tent in range(3):
            try: um(pg, c); break
            except Exception as e: print(c["id"], "erro", type(e).__name__, str(e)[:200], flush=True); pg.wait_for_timeout(5000)
ais.com_aba(f)
