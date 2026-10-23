# Copia as ferramentas de producao (D:\tracer3d, D:\prehistoria\colab.py, D:\whatif_es\g4.py) para o repositorio publico,
# trocando caminhos e contas locais por configuracao portavel. Recusa se sobrar caminho/conta local.
#   python sincronizar_repo.py   (depois: git add/commit/push no repo)
import os, re, sys

REPO = r"D:\mineracaoyoutube"
T = os.path.join(REPO, "tracer3d", "ferramentas"); E = os.path.join(REPO, "eddie3d", "ferramentas")
PROIBIDO = re.compile(r"prehistoria|whatif_es\\\\g4|D:\\\\tracer3d|ivone|lucase|eddie08|@gmail|AIza", re.I)
CD = 'os.environ.get("COLAB_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "eddie3d", "ferramentas"))'


def troca(s, pares):
    for a, b in pares:
        if a in s: s = s.replace(a, b)
    return s


def g4_stills(s):
    return troca(s, [('sys.path.insert(0, r"D:\\prehistoria")', f"sys.path.insert(0, {CD})"),
                     ("'python D:/whatif_es/g4.py ligar'", "'python eddie3d/ferramentas/g4.py ligar'")])


def vigia(s):
    return troca(s, [('sys.path.insert(0, r"D:\\prehistoria")', f"sys.path.insert(0, {CD})")])


def sessao(s):
    s = troca(s, [('G4 = r"D:\\whatif_es\\g4.py"', 'AQUI = os.path.dirname(os.path.abspath(__file__))\nCOLAB_DIR = os.environ.get("COLAB_DIR", os.path.join(AQUI, "..", "..", "eddie3d", "ferramentas"))\nG4 = os.environ.get("G4_PY", os.path.join(COLAB_DIR, "g4.py"))'),
                  ('STILLS = r"D:\\tracer3d\\g4_stills.py"', 'STILLS = os.path.join(AQUI, "g4_stills.py")')])
    return s.replace("r'D:\\\\prehistoria'", "r'{COLAB_DIR}'").replace('"import sys; sys.path.insert(0, r\'{COLAB_DIR}\')', 'f"import sys; sys.path.insert(0, r\'{COLAB_DIR}\')')


def colab(s):
    return troca(s, [('# Controla o notebook do Colab aberto no perfil Dolphin "12 Ivone" (conta com Ultra) pela porta CDP.', '# Controla o notebook do Colab aberto num perfil Dolphin (config local) pela porta CDP.'),
                     ('sys.path.insert(0, r"D:\\mineracaoyoutube\\work\\video")', 'sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))'),
                     ('import ivone  # noqa: E402', 'import local  # noqa: E402'),
                     ('URL = open(r"D:\\prehistoria\\out\\colab_url.txt").read().strip()', 'URL = (local.cfg("colab_url") or "").strip()'),
                     ('b = ivone.conectar(p)', 'b = local.conectar(p)')])


ITENS = [(r"D:\tracer3d\g4_stills.py", os.path.join(T, "g4_stills.py"), g4_stills),
         (r"D:\tracer3d\vigia_ui.py", os.path.join(T, "vigia_ui.py"), vigia),
         (r"D:\tracer3d\sessao_g4.py", os.path.join(T, "sessao_g4.py"), sessao),
         (r"D:\tracer3d\escuta.sh", os.path.join(T, "escuta.sh"), lambda s: s),
         (r"D:\tracer3d\sincronizar_repo.py", os.path.join(T, "sincronizar_repo.py"), lambda s: s),
         (r"D:\prehistoria\colab.py", os.path.join(E, "colab.py"), colab),
         (r"D:\whatif_es\g4.py", os.path.join(E, "g4.py"), lambda s: s.replace('sys.path.insert(0, r"D:\prehistoria")', 'sys.path.insert(0, __import__("os").path.dirname(__import__("os").path.abspath(__file__)))'))]

ruins = []
for src, dst, f in ITENS:
    s = f(open(src, encoding="utf-8").read())
    if not dst.endswith("sincronizar_repo.py") and PROIBIDO.search(s): ruins.append((dst, PROIBIDO.search(s).group(0)))
    open(dst, "w", encoding="utf-8", newline="\n").write(s)
    print("ok", os.path.relpath(dst, REPO))
if ruins: sys.exit(f"ATENCAO: sobrou caminho/conta local em {ruins}")
