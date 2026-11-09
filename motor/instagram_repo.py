# -*- coding: utf-8 -*-
r"""INSTAGRAM REPO — os Reels prontos num repositorio do GitHub, so' os dos ultimos N dias.

    python motor/instagram_repo.py --autoteste        (precisa do git)

⛔ Apagar um mp4 num commit novo nao libera espaco: ele continua no historico e o repo incha ate' a cota.
Por isso os videos moram numa branch propria (`videos`) que e' REFEITA do zero a cada envio e a cada
limpeza: um commit sem pai com so' os videos dentro do prazo, e push --force nela. A `main` nunca e' tocada.

A branch e' montada por comandos de baixo nivel do git (hash-object, mktree, commit-tree, update-ref): o
checkout e a branch atual do clone ficam como estao.

    publicar(repo_dir, itens, dias=5)     itens = [{"nome", "arquivo", "data": "AAAA-MM-DD", "legenda"}]
"""
import datetime as _dt, os, subprocess, sys

RAMO = "videos"
PASTA = "reels"
LIMITE_MB = 95                     # o GitHub recusa arquivo acima de 100 MB
_SEM_JANELA = {"creationflags": 0x08000000} if os.name == "nt" else {}
LEIA_ME = (b"# Reels prontos\n\nEsta branch e' refeita do zero pelo Minerador a cada envio e uma vez por dia: "
           b"ficam so' os videos dos ultimos dias. Nao commite nada aqui.\n")


def _git(repo, *args, entrada=None, timeout=600):
    r = subprocess.run(["git", "-C", repo, *args], input=entrada, capture_output=True, timeout=timeout, **_SEM_JANELA)
    if r.returncode:
        raise RuntimeError(f"git {args[0]} falhou: " + (r.stderr or r.stdout).decode("utf-8", "replace").strip()[-300:])
    return r.stdout.decode("utf-8", "replace").strip()


def conferir(repo_dir, remoto="origin"):
    """O caminho e' um clone com o remoto? Devolve a URL do remoto. ⛔ A branch `videos` nao pode estar aberta nele."""
    if not repo_dir or not os.path.isdir(repo_dir): raise ValueError("a pasta do repositório não existe")
    if _git(repo_dir, "rev-parse", "--is-inside-work-tree") != "true": raise ValueError("a pasta não é um repositório git")
    url = _git(repo_dir, "remote", "get-url", remoto)
    atual = subprocess.run(["git", "-C", repo_dir, "symbolic-ref", "-q", "HEAD"], capture_output=True, **_SEM_JANELA)
    if atual.stdout.decode().strip() == f"refs/heads/{RAMO}":
        raise ValueError(f"a branch {RAMO} está aberta nesse clone: troque para a main antes")
    return url


def no_prazo(itens, dias=5, hoje=None):
    """(dentro, fora) pelo campo data. ⭐ Hoje conta como dia 1: com 5 dias ficam hoje e os 4 anteriores."""
    hoje = hoje or _dt.date.today()
    corte = (hoje - _dt.timedelta(days=dias - 1)).isoformat()
    dentro = [i for i in itens if i["data"] >= corte and os.path.isfile(i["arquivo"])]
    fora = [i for i in itens if i not in dentro]
    return dentro, fora


def publicar(repo_dir, itens, dias=5, hoje=None, remoto="origin", empurrar=True):
    """Refaz a branch `videos` com os itens dentro do prazo e da' push --force nela.
    Devolve {"commit", "arquivos", "fora", "url"}."""
    url = conferir(repo_dir, remoto)
    dentro, fora = no_prazo(itens, dias, hoje)
    for i in dentro:
        if os.path.getsize(i["arquivo"]) > LIMITE_MB * 1024 * 1024:
            raise ValueError(f"{i['nome']} passa de {LIMITE_MB} MB: o GitHub recusa")
    linhas = []
    for i in sorted(dentro, key=lambda x: x["nome"]):
        sha = _git(repo_dir, "hash-object", "-w", i["arquivo"])
        linhas.append(f"100644 blob {sha}\t{i['nome']}")
        if i.get("legenda"):
            sha_t = _git(repo_dir, "hash-object", "-w", "--stdin", entrada=i["legenda"].encode("utf-8"))
            linhas.append(f"100644 blob {sha_t}\t{os.path.splitext(i['nome'])[0]}.txt")
    sub = _git(repo_dir, "mktree", entrada=("\n".join(linhas) + "\n").encode("utf-8")) if linhas else ""
    leia = _git(repo_dir, "hash-object", "-w", "--stdin", entrada=LEIA_ME)
    raiz = [f"100644 blob {leia}\tREADME.md"] + ([f"040000 tree {sub}\t{PASTA}"] if sub else [])
    arvore = _git(repo_dir, "mktree", entrada=("\n".join(raiz) + "\n").encode("utf-8"))
    msg = f"Reels dos últimos {dias} dias ({len(dentro)} vídeo(s))".encode("utf-8")
    commit = _git(repo_dir, "commit-tree", arvore, entrada=msg)
    _git(repo_dir, "update-ref", f"refs/heads/{RAMO}", commit)
    if empurrar: _git(repo_dir, "push", "--force", remoto, f"{RAMO}:{RAMO}", timeout=1800)
    # ⭐ os mp4 que sairam ficam soltos no clone: sem o reflog da branch (e do espelho dela no remoto) o gc libera o disco
    _git(repo_dir, "reflog", "expire", "--expire=now", f"refs/heads/{RAMO}", f"refs/remotes/{remoto}/{RAMO}")
    _git(repo_dir, "gc", "--prune=now", "--quiet", timeout=1800)
    return {"commit": commit, "arquivos": [i["nome"] for i in dentro], "fora": [i["nome"] for i in fora], "url": url}


def _autoteste():
    import tempfile
    ok = True

    def caso(nome, cond):
        nonlocal ok; print(("  OK  " if cond else "  ERRO"), nome); ok &= bool(cond)

    d = tempfile.mkdtemp(prefix="min-ig-repo-")
    remoto, clone = os.path.join(d, "remoto.git"), os.path.join(d, "clone")
    subprocess.run(["git", "init", "-q", "--bare", remoto], check=True)
    subprocess.run(["git", "clone", "-q", remoto, clone], check=True, capture_output=True)
    for k, v in (("user.name", "t"), ("user.email", "t@t")): _git(clone, "config", k, v)
    open(os.path.join(clone, "a.txt"), "w").write("main\n")
    _git(clone, "add", "a.txt"); _git(clone, "commit", "-qm", "main"); _git(clone, "push", "-q", "origin", "HEAD")
    main_antes = _git(clone, "rev-parse", "HEAD")
    vids = []
    for nome in ("velho", "novo", "hoje"):
        arq = os.path.join(d, f"{nome}.mp4"); open(arq, "wb").write(os.urandom(2000)); vids.append(arq)
    hoje = _dt.date(2026, 10, 18)
    itens = [{"nome": "2026-10-10_velho.mp4", "arquivo": vids[0], "data": "2026-10-10"},
             {"nome": "2026-10-14_novo.mp4", "arquivo": vids[1], "data": "2026-10-14", "legenda": "Receita 🍵"},
             {"nome": "2026-10-18_hoje.mp4", "arquivo": vids[2], "data": "2026-10-18"}]
    r = publicar(clone, itens, dias=5, hoje=hoje)
    caso("⭐ so' os dos ultimos 5 dias entram", r["arquivos"] == ["2026-10-14_novo.mp4", "2026-10-18_hoje.mp4"]
         and r["fora"] == ["2026-10-10_velho.mp4"])
    no_remoto = _git(remoto, "ls-tree", "-r", "--name-only", RAMO).splitlines()
    caso("push --force chegou no remoto (com a legenda do post)",
         no_remoto == ["README.md", "reels/2026-10-14_novo.mp4", "reels/2026-10-14_novo.txt", "reels/2026-10-18_hoje.mp4"])
    caso("⛔ a main e o checkout nao mudam", _git(clone, "rev-parse", "HEAD") == main_antes
         and os.listdir(clone) == [".git", "a.txt"] or sorted(os.listdir(clone)) == [".git", "a.txt"])
    r2 = publicar(clone, itens, dias=5, hoje=hoje + _dt.timedelta(days=4))
    caso("⭐ no dia seguinte ao prazo o video sai", r2["arquivos"] == ["2026-10-18_hoje.mp4"])
    caso("⭐ a branch nao tem historico (commit sem pai)",
         _git(remoto, "rev-list", "--count", RAMO) == "1")
    caso("⛔ o blob que saiu some do clone depois do gc",
         subprocess.run(["git", "-C", clone, "cat-file", "-e", _git(clone, "hash-object", vids[1])],
                        capture_output=True).returncode != 0)
    r3 = publicar(clone, itens, dias=5, hoje=hoje + _dt.timedelta(days=30))
    caso("sem nenhum no prazo: so' o README", r3["arquivos"] == [] and
         _git(remoto, "ls-tree", "-r", "--name-only", RAMO) == "README.md")
    _git(clone, "checkout", "-q", "-B", RAMO)
    try:
        publicar(clone, itens, hoje=hoje); caso("⛔ recusa com a branch videos aberta", False)
    except ValueError:
        caso("⛔ recusa com a branch videos aberta", True)
    try:
        conferir(os.path.join(d, "nao-existe")); caso("⛔ pasta inexistente", False)
    except ValueError:
        caso("⛔ pasta inexistente", True)
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.exit(0 if _autoteste() else 1)
