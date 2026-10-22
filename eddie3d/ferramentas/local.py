"""Config da maquina (fora do Git): eddie3d/local/config.json. Modelo em eddie3d/local.exemplo.json.
Chaves: dolphin_perfil (id do perfil Dolphin Anty com o Colab logado), colab_url (link do notebook), dir_trabalho (pasta de producao)."""
import json, os

_ARQ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "local", "config.json")


def cfg(chave, padrao=None):
    if os.environ.get("EDDIE3D_" + chave.upper()): return os.environ["EDDIE3D_" + chave.upper()]
    if os.path.exists(_ARQ): return json.load(open(_ARQ, encoding="utf-8")).get(chave, padrao)
    return padrao


def conectar(p):
    """Playwright ligado por CDP ao navegador do perfil Dolphin (porta lida do DevToolsActivePort do perfil)."""
    perfil = cfg("dolphin_perfil")
    if not perfil: raise SystemExit("defina dolphin_perfil em eddie3d/local/config.json")
    arq = os.path.join(os.environ["APPDATA"], "dolphin_anty", "browser_profiles", str(perfil), "data_dir", "DevToolsActivePort")
    porta = open(arq).read().split()[0]
    return p.chromium.connect_over_cdp(f"http://127.0.0.1:{porta}")
