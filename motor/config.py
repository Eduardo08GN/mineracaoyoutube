# -*- coding: utf-8 -*-
r"""CONFIG — onde as coisas moram e a chave da API.

    python motor/config.py --autoteste

⛔ A chave mora so' no `.env` da raiz (no .gitignore). Nunca no codigo, nunca no painel.
"""
import os, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(RAIZ, "data")
BANCO = os.path.join(DATA, "minerio.db")
ARQ_ENV = os.path.join(RAIZ, ".env")


def ler_env(arq=ARQ_ENV):
    """{chave: valor} do .env. Linhas vazias e # sao ignoradas; aspas em volta saem."""
    d = {}
    try:
        for linha in open(arq, encoding="utf-8"):
            linha = linha.strip()
            if not linha or linha.startswith("#") or "=" not in linha: continue
            k, v = linha.split("=", 1)
            d[k.strip()] = v.strip().strip('"').strip("'")
    except OSError:
        pass
    return d


def chave_youtube(arq=ARQ_ENV):
    """A chave da YouTube Data API: variavel de ambiente primeiro, depois o .env. "" se nao houver."""
    return os.environ.get("YOUTUBE_API_KEY") or ler_env(arq).get("YOUTUBE_API_KEY", "")


def gravar_chave(valor, arq=ARQ_ENV):
    """Troca (ou poe) a YOUTUBE_API_KEY no .env, sem mexer nas outras linhas."""
    linhas, achou = [], False
    try:
        linhas = open(arq, encoding="utf-8").read().splitlines()
    except OSError:
        pass
    for i, l in enumerate(linhas):
        if l.strip().startswith("YOUTUBE_API_KEY="):
            linhas[i] = f"YOUTUBE_API_KEY={valor}"; achou = True
    if not achou: linhas.append(f"YOUTUBE_API_KEY={valor}")
    with open(arq, "w", encoding="utf-8") as f:
        f.write("\n".join(linhas) + "\n")


def mascarar(chave):
    """AIza…xyz — o painel so' ve' isso."""
    return f"{chave[:4]}…{chave[-3:]}" if len(chave) > 10 else ("" if not chave else "…")


def _autoteste():
    import tempfile
    ok = True
    def caso(nome, cond):
        nonlocal ok; print(("  OK  " if cond else "  ERRO"), nome); ok &= bool(cond)
    d = tempfile.mkdtemp(prefix="min-cfg-")
    arq = os.path.join(d, ".env")
    open(arq, "w", encoding="utf-8").write("# comentario\nOUTRA=1\nYOUTUBE_API_KEY=\"abc123456789xyz\"\n")
    caso("le' a chave sem aspas", ler_env(arq)["YOUTUBE_API_KEY"] == "abc123456789xyz")
    gravar_chave("novachave1234567", arq)
    e = ler_env(arq)
    caso("troca a chave e mantem as outras", e["YOUTUBE_API_KEY"] == "novachave1234567" and e["OUTRA"] == "1")
    caso("⛔ o painel so' ve' a chave mascarada", mascarar("AIzaFAKEchaveDeTestexyz") == "AIza…xyz")
    caso("sem .env: vazio", ler_env(os.path.join(d, "nada")) == {})
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if "--autoteste" in sys.argv: sys.exit(0 if _autoteste() else 1)
