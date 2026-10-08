# -*- coding: utf-8 -*-
r"""RETRATOS — a imagem de cada persona: o prompt para o Flow e onde a imagem mora.

    python motor/retratos.py --autoteste
    python motor/retratos.py --prompt amish

⭐ O modo manual do OW Agente: a pessoa gera no Flow (na conta dela), baixa, e a ferramenta faz o resto —
percebe o download na pasta Downloads e poe a imagem na persona certa.
⛔ Nada aqui abre o navegador, chama o Flow ou mexe em reCAPTCHA.

As imagens ficam em data/personas/<id>.<ext> (fora do git: sao da pessoa).
Arquetipos de MESMA ROUPA (os Amish, os huteritas, os menonitas, o centenario de Okinawa) emprestam
o retrato de outro mercado enquanto o local nao existe.
"""
import base64, os, shutil, sys, time

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path: sys.path.insert(0, AQUI)

import config                                                               # noqa: E402

PASTA = os.path.join(config.DATA, "personas")
EXTS = (".png", ".jpg", ".jpeg", ".webp")
MESMA_ROUPA = {"longevidade", "amish", "hutterita", "menonita"}

# (quem aparece, onde) — o retrato de cada persona, no mesmo estilo do canal do Elias
VISUAL = {
    # EUA
    "amish": ("a 60-year-old Amish man with a long grey beard, straw hat, white shirt and black suspenders", "a plain farmhouse kitchen with a window"),
    "mennonite": ("a 55-year-old Mennonite woman with a white prayer kapp and a modest floral dress", "a farmhouse pantry full of jars"),
    "appalachian": ("an 80-year-old Appalachian granny with silver hair in a bun, flannel shirt and apron", "a wooden cabin porch in the Smoky Mountains"),
    "depression": ("an 88-year-old American grandmother with a cardigan and pearl earrings, gentle smile", "a 1930s-style kitchen with an old stove"),
    "old-farmer": ("an 80-year-old Midwest farmer with a weathered face, John Deere-style cap and denim overalls", "a red barn and corn fields at golden hour"),
    "pioneer": ("a rugged 60-year-old 1800s frontier homesteader with a wide-brim hat and wool vest", "a log cabin on the prairie"),
    "okinawan": ("a smiling 100-year-old Okinawan woman with white hair, simple cotton clothes", "a small Okinawan garden with sweet potato leaves"),
    "monk": ("a 70-year-old Benedictine monk in a black habit, calm face", "a stone monastery herb garden"),
    "barn-finds": ("a 70-year-old rural picker with a grey stubble, trucker cap and work jacket, holding an old tin sign", "inside a dusty old barn full of antiques"),
    "cowboy": ("a 75-year-old Texas cowboy with a white mustache, felt cowboy hat and denim jacket", "a ranch corral at sunset"),
    "old-mechanic": ("an 81-year-old American mechanic with grease on his hands, grey work shirt with a name patch", "a small-town auto repair garage with an old pickup on the lift"),
    "hutterite": ("a 65-year-old Hutterite man with a dark beard, black hat and suspenders", "a large colony communal kitchen with big steel pots"),
    "shaker": ("a 70-year-old Shaker craftsman in a plain shirt and vest, holding a wooden oval box", "a bright minimalist Shaker workshop"),
    "sleep-farm": ("a gentle 80-year-old storyteller in a knitted sweater, soft smile, in a rocking chair", "a dim cozy farmhouse living room with a fireplace at night"),
    "victory-garden": ("an 85-year-old grandmother in a 1940s floral headscarf and apron, holding a basket of vegetables", "a backyard victory garden with a white picket fence"),
    "old-electrician": ("a 75-year-old retired American electrician in a work shirt with a tool belt, reading glasses on his head", "a basement next to an open electrical panel"),
    # Franca
    "meme-occupation": ("a 90-year-old French grandmother with white hair, dark wool cardigan, kind eyes", "a rustic French kitchen with a wood stove and a 1940s ration ticket on the table"),
    "meme-campagne": ("an 80-year-old French countryside grandmother (mémé) with an apron and a gilet", "a stone farmhouse kitchen in the Auvergne with copper pans"),
    "moine-trappiste": ("a 70-year-old French Trappist monk in a white habit with a black scapular", "an abbey cheese cellar with wheels of cheese"),
    "vieux-paysan": ("an 85-year-old French peasant farmer with a beret and blue work jacket", "a misty French farm field with an old stone barn"),
    "vieux-mecano": ("a 75-year-old French village mechanic in blue overalls and a flat cap", "a small French garage with an old Peugeot 404"),
    "vieil-electricien": ("a 72-year-old French electrician with grey hair, glasses and a blue work jacket", "an old Parisian apartment hallway with an open fuse box"),
    "okinawa-fr": ("a smiling 100-year-old Okinawan woman with white hair, simple cotton clothes", "a small Okinawan garden"),
    "dormir-fr": ("a gentle 80-year-old French storyteller in a wool cardigan in an armchair", "a dim cozy French farmhouse living room with a fireplace at night"),
    "compagnon-du-devoir": ("a 65-year-old French master carpenter (Compagnon du Devoir) with a white beard and a black wide-brim hat", "a timber-frame workshop full of oak beams and hand tools"),
    "vigneron": ("an 80-year-old Burgundy winegrower with sun-weathered skin and a straw hat", "rows of grapevines in autumn with an old stone cellar"),
    "berger-basque": ("a 70-year-old Basque shepherd with a black beret (txapela) and a walking stick", "green Pyrenees mountain pastures with sheep"),
    # Alemanha
    "nachkriegs-oma": ("a 90-year-old German grandmother with white curled hair and a knitted cardigan", "a simple 1950s German kitchen with an enamel pot"),
    "oma-bauernhof": ("an 80-year-old German farm grandmother with a headscarf and apron", "a Bavarian farmhouse garden with preserving jars"),
    "kloster-moench": ("a 70-year-old German Benedictine monk in a black habit", "a monastery herb garden with stone walls"),
    "alter-bauer": ("an 85-year-old Bavarian farmer with a felt hat and a grey wool jacket", "a Bavarian farm with an old tractor and the Alps behind"),
    "alter-schrauber": ("a 75-year-old German master mechanic (Kfz-Meister) in navy work overalls", "a tidy German workshop with an old VW Beetle"),
    "alter-elektriker": ("a 72-year-old German master electrician with grey hair and a work vest", "an old German house cellar with an electrical panel"),
    "okinawa-de": ("a smiling 100-year-old Okinawan woman with white hair, simple cotton clothes", "a small Okinawan garden"),
    "dormir-de": ("a gentle 80-year-old German storyteller in a wool cardigan in an armchair", "a cozy German farmhouse parlour with a tiled stove at night"),
    "amish-de": ("a 60-year-old Amish man with a long grey beard, straw hat, white shirt and black suspenders", "a plain farmhouse kitchen with a window"),
    "hutterer": ("a 65-year-old Hutterite man with a dark beard, black hat and suspenders", "a large colony communal kitchen"),
    "ddr-oma": ("an 85-year-old East German grandmother with short permed grey hair and a 1970s patterned blouse", "a 1970s East German (GDR) kitchen with a Trabant visible through the window"),
    "foerster": ("a 70-year-old German forester with a grey beard, green loden jacket and hat", "a deep German pine forest with stacked firewood"),
    # Espanha / hispanicos
    "abuela-posguerra": ("a 90-year-old Spanish grandmother dressed in black with white hair in a bun", "a humble Spanish village kitchen with a clay pot of lentils"),
    "abuela-pueblo": ("an 80-year-old Spanish village grandmother with a floral apron, smiling", "a whitewashed village house patio with geraniums"),
    "monje-benedictino": ("a 70-year-old Spanish Benedictine monk in a black habit", "a Romanesque monastery cloister (Silos)"),
    "abuelo-agricultor": ("an 85-year-old Spanish farmer from Castile with a flat cap and a weathered face", "a dry Castilian wheat field with an old farmhouse"),
    "viejo-mecanico": ("a 75-year-old Spanish-speaking mechanic in grey overalls with a mustache", "a small Spanish taller (garage) with an old SEAT 600"),
    "viejo-electricista": ("a 72-year-old Spanish electrician with glasses and a work shirt", "an old Spanish apartment with an open fuse box"),
    "okinawa-es": ("a smiling 100-year-old Okinawan woman with white hair, simple cotton clothes", "a small Okinawan garden"),
    "dormir-es": ("a gentle 80-year-old Spanish storyteller in a wool cardigan in an armchair", "a cozy Spanish village living room with a fireplace at night"),
    "menonitas": ("a 55-year-old Mennonite farmer from the Chihuahua colonies in a plaid shirt, overalls and a cowboy hat", "a Mexican Mennonite colony farm with cheese and a pickup"),
    "vaquero": ("a 75-year-old Mexican vaquero with a white mustache, sombrero and leather vest", "a dusty ranch corral in northern Mexico at sunset"),
    "pastor-vasco": ("a 70-year-old Basque shepherd with a black txapela beret and a walking stick", "green Basque mountain pastures with latxa sheep"),
    "pastor-trashumante": ("a 70-year-old Spanish transhumant shepherd with a felt hat and a blanket over his shoulder", "a wide Spanish cañada drove road with a flock of merino sheep"),
    "huertano": ("a 75-year-old Valencian huertano with a straw hat and a hoe", "an irrigated vegetable huerta with orange trees"),
}

ESTILO = ("Photorealistic cinematic portrait, 16:9 horizontal, medium shot of {quem}, looking warmly at the camera, "
          "in {onde}. Soft natural window light, shallow depth of field, documentary YouTube thumbnail look, "
          "rich detail, no text, no watermark, no logo.")


def prompt(p):
    """O prompt do retrato de uma persona (dict do catalogo). Sem visual cadastrado: monta pelo 'quem'."""
    quem, onde = VISUAL.get(p["id"], (p.get("quem", p["nome"]), "a warm, simple setting that fits them"))
    return ESTILO.format(quem=quem, onde=onde)


def arquivo(pid, pasta=PASTA):
    """O retrato desta persona no disco, ou ''."""
    for e in EXTS:
        c = os.path.join(pasta, pid + e)
        if os.path.isfile(c): return c
    return ""


def guardar(pid, origem, pasta=PASTA):
    """Copia a imagem para data/personas/<pid>.<ext> (troca a anterior). Devolve o caminho."""
    ext = os.path.splitext(origem)[1].lower()
    if ext not in EXTS: raise ValueError("a imagem precisa ser png, jpg ou webp")
    os.makedirs(pasta, exist_ok=True)
    for e in EXTS:
        velho = os.path.join(pasta, pid + e)
        if os.path.isfile(velho): os.remove(velho)
    destino = os.path.join(pasta, pid + (".jpg" if ext == ".jpeg" else ext))
    shutil.copyfile(origem, destino)
    return destino


def guardar_base64(pid, dados_b64, ext, pasta=PASTA):
    """A imagem que o painel mandou (arrastada para a celula)."""
    import tempfile
    ext = "." + ext.lower().lstrip(".")
    if ext not in EXTS: raise ValueError("a imagem precisa ser png, jpg ou webp")
    bruto = base64.b64decode(dados_b64.split(",", 1)[-1])
    if len(bruto) > 15 * 1024 * 1024: raise ValueError("imagem grande demais (máx. 15 MB)")
    tmp = os.path.join(tempfile.mkdtemp(prefix="min-ret-"), "r" + ext)
    open(tmp, "wb").write(bruto)
    return guardar(pid, tmp, pasta)


def pasta_downloads():
    """A pasta Downloads de verdade: no Windows ela pode ter sido movida (ex.: D:\\Downloads)."""
    if os.name == "nt":
        import ctypes, uuid
        from ctypes import wintypes
        guid = uuid.UUID("{374DE290-123F-4565-9164-39C4925E467B}")       # FOLDERID_Downloads
        caminho = ctypes.c_wchar_p()
        sh = ctypes.windll.shell32
        sh.SHGetKnownFolderPath.argtypes = [ctypes.c_char_p, wintypes.DWORD, wintypes.HANDLE, ctypes.POINTER(ctypes.c_wchar_p)]
        if sh.SHGetKnownFolderPath(guid.bytes_le, 0, None, ctypes.byref(caminho)) == 0:
            p = caminho.value
            ctypes.windll.ole32.CoTaskMemFree(caminho)
            if p and os.path.isdir(p): return p
    return os.path.join(os.environ.get("USERPROFILE") or os.path.expanduser("~"), "Downloads")


def imagens_novas(pasta, desde):
    """As imagens que apareceram na pasta depois de `desde` (e ja' pararam de crescer), mais nova primeiro.
    ⛔ .crdownload/.tmp (download pela metade) nao contam."""
    achadas = []
    try:
        nomes = os.listdir(pasta)
    except OSError:
        return []
    for n in nomes:
        c = os.path.join(pasta, n)
        if os.path.splitext(n)[1].lower() not in EXTS or not os.path.isfile(c): continue
        st = os.stat(c)
        if st.st_mtime > desde and time.time() - st.st_mtime > 1.0 and st.st_size > 1024:
            achadas.append((st.st_mtime, c))
    return [c for _, c in sorted(achadas, reverse=True)]


def _autoteste():
    import tempfile
    ok = True
    def caso(nome, cond):
        nonlocal ok; print(("  OK  " if cond else "  ERRO"), nome); ok &= bool(cond)
    import persona as _p
    faltam = [p["id"] for p in _p.PERSONAS if p["id"] not in VISUAL]
    caso(f"⭐ toda persona do catalogo tem visual ({len(VISUAL)})", not faltam)
    if faltam: print("      faltam:", faltam)
    pr = prompt(_p.persona("abuela-posguerra"))
    caso("prompt leva quem, onde e o estilo", "Spanish grandmother" in pr and "16:9" in pr and "no text" in pr)
    caso("persona livre ganha prompt pelo 'quem'", "Navy" in prompt(_p.persona("Navy Seal")))
    d = tempfile.mkdtemp(prefix="min-ret-")
    dl = os.path.join(d, "Downloads"); os.makedirs(dl)
    t0 = time.time() - 5
    img = os.path.join(dl, "flow_123.png"); open(img, "wb").write(b"\x89PNG" + b"0" * 2000)
    os.utime(img, (time.time() - 2, time.time() - 2))
    open(os.path.join(dl, "pela_metade.png.crdownload"), "wb").write(b"x" * 5000)
    caso("⭐ download novo e' achado; o pela metade nao", imagens_novas(dl, t0) == [img])
    caso("download antigo nao conta", imagens_novas(dl, time.time()) == [])
    pasta = os.path.join(d, "personas")
    guardar("amish", img, pasta)
    caso("guarda e acha", arquivo("amish", pasta).endswith("amish.png"))
    guardar_base64("amish", "data:image/jpeg;base64," + base64.b64encode(b"\xff\xd8" + b"0" * 2000).decode(), "jpeg", pasta)
    caso("⭐ trocar o retrato apaga o anterior", arquivo("amish", pasta).endswith("amish.jpg")
         and not os.path.exists(os.path.join(pasta, "amish.png")))
    try:
        guardar("x", os.path.join(d, "a.gif"), pasta); caso("⛔ gif recusado", False)
    except ValueError:
        caso("⛔ gif recusado", True)
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if "--autoteste" in sys.argv: sys.exit(0 if _autoteste() else 1)
    if "--prompt" in sys.argv:
        import persona as _p
        print(prompt(_p.persona(sys.argv[sys.argv.index("--prompt") + 1])))
