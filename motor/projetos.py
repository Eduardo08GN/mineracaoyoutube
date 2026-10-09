# -*- coding: utf-8 -*-
r"""PROJETOS — cada video que a aba Producao faz, do viral fonte ao video pronto.

    python motor/projetos.py --autoteste

    data/projetos/<id>/projeto.json     o estado inteiro (fonte, roteiro, planos, registro)
    data/projetos/<id>/...              o que as fases seguintes guardarem (avatar, voz, b-roll, versoes)

⭐ As etapas sao DERIVADAS do conteudo (o padrao do AutoTube): nao ha' "etapa atual" gravada que possa mentir.
⭐ Gravar e' atomico (arquivo temporario + troca): uma queda no meio nunca deixa o projeto pela metade.
"""
import json, os, re, sys, threading, time, unicodedata

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path: sys.path.insert(0, AQUI)

import config                                                               # noqa: E402

PASTA = os.path.join(config.DATA, "projetos")
_trava = threading.RLock()

# as 8 etapas do video; o painel faz as 3 primeiras, as do meio rodam nos scripts de work/video
# (motor/pipeline_video.py) e gravam o resultado em p["producao"][etapa]
ETAPAS = [
    ("fonte", "Fonte"), ("roteiro", "Roteiro"), ("planos", "Planos"), ("avatar", "Avatar"),
    ("voz", "Voz"), ("broll", "B-roll"), ("montagem", "Montagem"), ("miniatura", "Miniatura"),
]


def _slug(texto, n=40):
    t = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")[:n].strip("-") or "video"


def pasta(pid, base=PASTA):
    # ⛔ o id vem da URL do painel: so' letras, numeros e hifen (nada de "../")
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,80}", str(pid)): raise KeyError(pid)
    return os.path.join(base, pid)


def criar(op, persona, base=PASTA):
    """Projeto novo a partir de uma oportunidade do Minerador (dict de banco.oportunidade)."""
    with _trava:
        os.makedirs(base, exist_ok=True)
        raiz = time.strftime("%Y%m%d") + "-" + _slug(op["titulo"])
        pid, n = raiz, 2
        while os.path.exists(pasta(pid, base)):
            pid, n = f"{raiz}-{n}", n + 1
        os.makedirs(pasta(pid, base))
        p = {"id": pid, "criado": time.time(), "persona": persona["id"], "idioma": persona.get("idioma", "en"),
             "op_id": op.get("id"), "nome": (op.get("titulos") or [op["titulo"]])[0],
             "fonte": {"video_id": op["video_id"], "titulo": op["titulo"], "canal": op.get("canal", ""),
                       "views": op.get("views", 0), "publicado": op.get("publicado", ""), "thumb": op.get("thumb", "")},
             "roteiro": None, "planos": [], "registro": []}
        salvar(p, base)
        return p


def carregar(pid, base=PASTA):
    arq = os.path.join(pasta(pid, base), "projeto.json")
    if not os.path.isfile(arq): raise KeyError(pid)
    with open(arq, encoding="utf-8") as f:
        return json.load(f)


def salvar(p, base=PASTA):
    with _trava:
        arq = os.path.join(pasta(p["id"], base), "projeto.json")
        tmp = arq + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(p, f, ensure_ascii=False, indent=1)
        os.replace(tmp, arq)


def alterar(pid, fn, base=PASTA):
    """Le, aplica `fn(projeto)` e grava, com a trava (dois fios nunca se atropelam)."""
    with _trava:
        p = carregar(pid, base)
        fn(p)
        salvar(p, base)
        return p


def registrar(pid, texto, base=PASTA):
    return alterar(pid, lambda p: p["registro"].insert(0, {"t": time.time(), "texto": texto}) or
                   p.__setitem__("registro", p["registro"][:200]), base)


def etapas(p):
    """[{id, nome, estado}] — estado: pronta | pendente | bloqueada | futura (fases seguintes)."""
    f = p.get("fonte") or {}
    pr = p.get("producao") or {}
    feito = {"fonte": bool(f.get("pronta")), "roteiro": bool((p.get("roteiro") or {}).get("secoes")),
             "planos": bool(p.get("planos")), **{k: bool(pr.get(k)) for k in ("avatar", "voz", "broll", "montagem")}}
    saida, antes_ok = [], True
    for k, nome in ETAPAS:
        if k not in feito: estado = "futura"
        elif feito[k]: estado = "pronta"
        else: estado = "pendente" if antes_ok else "bloqueada"
        antes_ok = antes_ok and feito.get(k, False)
        saida.append({"id": k, "nome": nome, "estado": estado})
    return saida


def resumo(p):
    """O que a lista de projetos mostra (sem o roteiro inteiro)."""
    r = p.get("roteiro") or {}
    pl = p.get("planos") or []
    return {"id": p["id"], "nome": p["nome"], "persona": p["persona"], "idioma": p["idioma"], "criado": p["criado"],
            "op_id": p.get("op_id"), "thumb": (p.get("fonte") or {}).get("thumb", ""),
            "palavras": r.get("palavras", 0), "minutos": r.get("minutos", 0), "n_planos": len(pl),
            "etapas": etapas(p), "trabalhando": p.get("trabalhando", ""),
            "pronto": bool((p.get("producao") or {}).get("montagem"))}


def lista(base=PASTA):
    if not os.path.isdir(base): return []
    saida = []
    for pid in os.listdir(base):
        try:
            saida.append(resumo(carregar(pid, base)))
        except (OSError, ValueError):
            continue
    return sorted(saida, key=lambda r: -r["criado"])


def _autoteste():
    import tempfile
    ok = True
    def caso(nome, cond):
        nonlocal ok; print(("  OK  " if cond else "  ERRO"), nome); ok &= bool(cond)
    base = tempfile.mkdtemp(prefix="min-proj-")
    op = {"id": 7, "video_id": "V1", "titulo": "Wie man natürliche Arznei herstellt | SWR", "canal": "SWR",
          "views": 2_207_331, "titulos": ["Klosterarznei selber machen... wie die alten Mönche"]}
    per = {"id": "kloster-moench", "idioma": "de"}
    p = criar(op, per, base)
    caso("⭐ id legivel (data + titulo sem acento)", p["id"].endswith("wie-man-naturliche-arznei-herstellt-swr"))
    caso("o nome do projeto e' o titulo reescrito", p["nome"].startswith("Klosterarznei"))
    caso("o mesmo titulo no mesmo dia ganha outro id", criar(op, per, base)["id"].endswith("-2"))
    e = {x["id"]: x["estado"] for x in etapas(p)}
    caso("⭐ etapas derivadas: fonte pendente, roteiro bloqueado, avatar bloqueado, miniatura futura",
         e["fonte"] == "pendente" and e["roteiro"] == "bloqueada" and e["avatar"] == "bloqueada"
         and e["miniatura"] == "futura")
    alterar(p["id"], lambda q: q["fonte"].update(pronta=True), base)
    caso("fonte pronta libera o roteiro", {x["id"]: x["estado"] for x in etapas(carregar(p["id"], base))}["roteiro"] == "pendente")
    registrar(p["id"], "fonte lida", base)
    caso("registro grava a frase mais nova primeiro", carregar(p["id"], base)["registro"][0]["texto"] == "fonte lida")
    caso("lista traz os 2, o mais novo primeiro", len(lista(base)) == 2 and "roteiro" not in lista(base)[0])
    for ruim in ("../../etc", "a/b", "..", "X"):
        try:
            carregar(ruim, base); caso(f"⛔ id '{ruim}' recusado", False)
        except KeyError:
            caso(f"⛔ id '{ruim}' recusado", True)
    caso("⛔ gravacao atomica nao deixa .tmp para tras", not [f for f in os.listdir(pasta(p["id"], base)) if f.endswith(".tmp")])
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.exit(0 if _autoteste() else 1)
