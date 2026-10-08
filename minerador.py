# -*- coding: utf-8 -*-
r"""MINERADOR — ponto de entrada.

    python minerador.py                         # abre a janela (o painel)
    python minerador.py --navegador             # sem janela: imprime o link para abrir no navegador
    python minerador.py --autoteste             # roda os autotestes de todos os modulos
    python minerador.py --garimpar "semente 1; semente 2" --persona amish    # garimpo sem tela
"""
import os, subprocess, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
for _p in (os.path.join(AQUI, "motor"), os.path.join(AQUI, "agente")):
    if _p not in sys.path: sys.path.insert(0, _p)

MODULOS_COM_AUTOTESTE = [
    ("motor", "config.py"), ("motor", "catalogo.py"), ("motor", "banco.py"), ("motor", "youtube.py"), ("motor", "score.py"),
    ("motor", "persona.py"), ("motor", "garimpo.py"), ("motor", "radar.py"), ("motor", "retratos.py"),
    ("motor", "producao.py"),
    ("agente", "nucleo.py"), ("agente", "servidor.py"), ("agente", "painel.py"),
]


def autoteste():
    falhas = []
    for pasta, arq in MODULOS_COM_AUTOTESTE:
        r = subprocess.run([sys.executable, "-I", os.path.join(AQUI, pasta, arq), "--autoteste"],
                           capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=300)
        passou = r.returncode == 0
        print(f"  {'OK  ' if passou else 'ERRO'} {pasta}/{arq}")
        if not passou:
            falhas.append(arq)
            print("\n".join("        " + l for l in (r.stdout + r.stderr).splitlines() if "ERRO" in l or "Error" in l))
    print(f"\n{len(MODULOS_COM_AUTOTESTE) - len(falhas)}/{len(MODULOS_COM_AUTOTESTE)} módulos passaram")
    return not falhas


def garimpar(argv):
    import nucleo as _nucleo
    sementes = argv[argv.index("--garimpar") + 1].split(";")
    pid = argv[argv.index("--persona") + 1] if "--persona" in argv else "amish"
    n = _nucleo.Nucleo()
    n.ouvir(lambda tipo, d: print(d["linha"]) if tipo == "log" else None)
    g = n.novo_garimpo(sementes, pid)
    n.esperar_fila(limite=1800)
    for o in n.oportunidades(garimpo=g["id"])[:15]:
        print(f"{o['nota']:5.1f}  {o['views']:>12,}  {o['outlier']:>6.1f}x  {o['titulo'][:60]}")
        for t in o["titulos"][:1]: print(f"{'':28}→ {t}")
    n.encerrar()


def main():
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    argv = sys.argv[1:]
    if "--autoteste" in argv: return 0 if autoteste() else 1
    if "--garimpar" in argv: garimpar(argv); return 0
    if "--navegador" in argv:
        import servidor
        return servidor.main([])
    import painel
    return painel.main()


if __name__ == "__main__":
    sys.exit(main())
