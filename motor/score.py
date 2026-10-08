# -*- coding: utf-8 -*-
r"""SCORE — a nota de uma oportunidade (0 a 100). Funcoes puras.

    python motor/score.py --autoteste

A nota junta cinco sinais, cada um de 0 a 1:
    views     o video foi viral de verdade?                 (100 mil = 0 · 30 milhoes = 1)
    outlier   foi alem do tamanho do canal?                 (views ÷ inscritos: 1x = 0 · 50x = 1)
    demanda   ainda puxa views por ano? (evergreen)         (30 mil/ano = 0 · 3 milhoes/ano = 1)
    lacuna    ninguem remakou com a persona ainda?          (0 remakes = 1 · 3+ = 0,1 · sem checar = 0,5)
    encaixe   a persona cabe no tema e vende produto?       (nota do Claude 0-10 · sem nota = 0,5)
"""
import datetime as _dt, math, sys

PESOS = {"views": 0.25, "outlier": 0.15, "demanda": 0.20, "lacuna": 0.20, "encaixe": 0.20}


def _entre(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, x))


def outlier(views, inscritos):
    """Quantas vezes o video passou o tamanho do canal. ⛔ Canal oculto/minusculo: piso de 1.000."""
    return round(views / max(int(inscritos or 0), 1000), 2)


def anos_desde(publicado, hoje=None):
    hoje = hoje or _dt.date.today()
    try:
        d = _dt.date.fromisoformat(publicado[:10])
    except (TypeError, ValueError):
        return 1.0
    return max((hoje - d).days / 365.25, 0.25)


def sinais(views, inscritos, publicado, n_remakes=-1, encaixe=-1, hoje=None):
    v = _entre((math.log10(max(views, 1)) - 5) / 2.5)
    o = _entre(math.log10(outlier(views, inscritos) + 1) / math.log10(51))
    vpa = views / anos_desde(publicado, hoje)
    d = _entre((math.log10(max(vpa, 1)) - 4.5) / 2)
    lac = 0.5 if n_remakes is None or n_remakes < 0 else {0: 1.0, 1: 0.6, 2: 0.35}.get(n_remakes, 0.1)
    enc = 0.5 if encaixe is None or encaixe < 0 else _entre(encaixe / 10)
    return {"views": v, "outlier": o, "demanda": d, "lacuna": lac, "encaixe": enc}


def fator_saturacao(canais_novos):
    """Quantos canais novos da persona o radar ja' viu (6 meses) -> multiplicador da nota.
    ⭐ O formato avatar+B-roll e' vendido em escala: persona lotada de clones vale menos."""
    if canais_novos is None or canais_novos < 0: return 1.0
    if canais_novos <= 2: return 1.0
    if canais_novos <= 5: return 0.9
    if canais_novos <= 10: return 0.8
    return 0.7


def nota(views, inscritos, publicado, n_remakes=-1, encaixe=-1, hoje=None, canais_novos=-1):
    s = sinais(views, inscritos, publicado, n_remakes, encaixe, hoje)
    return round(100 * sum(PESOS[k] * s[k] for k in PESOS) * fator_saturacao(canais_novos), 1)


def fome(views, publicado, n_remakes=-1, hoje=None):
    """O vao de oferta: demanda por ano ÷ (1 + remakes com a persona). Em views/ano por remake.
    ⭐ E' o que mais se parece com o que o algoritmo "sente": gente procurando, pouco video novo.
    -1 quando os remakes nao foram checados (sem oferta medida nao ha' vao)."""
    if n_remakes is None or n_remakes < 0: return -1
    return round(views / anos_desde(publicado, hoje) / (1 + n_remakes))


def fome_nativa(demanda, oferta_recente, com_persona):
    """O vao num idioma: a maior demanda nativa ÷ (1 + oferta recente + 3 × videos ja' com a persona)."""
    return round(demanda / (1 + oferta_recente + 3 * com_persona))


def receita(views, rpm=5.0):
    """Receita de AdSense estimada se o remake repetir as views do original (RPM em $ por mil)."""
    return round(views / 1000 * rpm)


def _autoteste():
    ok = True
    def caso(nome, cond):
        nonlocal ok; print(("  OK  " if cond else "  ERRO"), nome); ok &= bool(cond)
    hoje = _dt.date(2026, 10, 8)
    caso("outlier: 16M num canal de 956k = 16,74x", outlier(16_000_000, 956_000) == 16.74)
    caso("⛔ canal oculto (0 inscritos) nao divide por zero", outlier(50_000, 0) == 50.0)
    caso("pesos somam 1", abs(sum(PESOS.values()) - 1) < 1e-9)
    melancia = nota(16_000_000, 956_000, "2017-07-01", n_remakes=0, encaixe=9, hoje=hoje)
    caso(f"⭐ o caso da melancia fica no alto ({melancia})", melancia >= 75)
    fraco = nota(150_000, 2_000_000, "2021-01-01", n_remakes=4, encaixe=2, hoje=hoje)
    caso(f"video pequeno num canal grande, ja' remakado, fica embaixo ({fraco})", fraco < 25)
    caso("⭐ remake existente derruba a nota",
         nota(5_000_000, 100_000, "2018-01-01", 0, 7, hoje) > nota(5_000_000, 100_000, "2018-01-01", 3, 7, hoje))
    caso("sem checar remake e sem encaixe: neutro (0,5)",
         sinais(1e6, 1e5, "2019-01-01", hoje=hoje)["lacuna"] == 0.5 and sinais(1e6, 1e5, "2019-01-01", hoje=hoje)["encaixe"] == 0.5)
    caso("data ruim nao quebra", nota(1_000_000, 10_000, "", hoje=hoje) > 0)
    caso("⭐ persona lotada de clones vale menos",
         nota(5e6, 1e5, "2018-01-01", 0, 7, hoje, canais_novos=12) < nota(5e6, 1e5, "2018-01-01", 0, 7, hoje, canais_novos=1))
    caso("fome: sem remake checado nao existe", fome(1e6, "2018-01-01", -1, hoje) == -1)
    f0, f7 = fome(16e6, "2016-10-08", 0, hoje), fome(16e6, "2016-10-08", 7, hoje)
    caso(f"⭐ fome cai com cada remake ({f0:,} -> {f7:,})", abs(f0 - 1.6e6) < 2e4 and abs(f0 / f7 - 8) < 0.01)
    caso("⭐ fome nativa pune persona ja' presente", fome_nativa(1e6, 2, 0) > fome_nativa(1e6, 2, 2))
    caso("receita: 4,3M views a $5,35 = ~$23 mil (o print do FaceTuber)", receita(4_319_216, 5.35) == 23108)
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if "--autoteste" in sys.argv: sys.exit(0 if _autoteste() else 1)
