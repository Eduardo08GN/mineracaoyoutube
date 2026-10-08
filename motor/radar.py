# -*- coding: utf-8 -*-
r"""RADAR — canais-persona NOVOS crescendo rapido (o proximo "Elias Yoder" antes de saturar).

    python motor/radar.py --autoteste

Duas buscas por persona (200 unidades):
    1. canais com o nome da persona criados nos ultimos N meses
    2. videos da persona mais vistos nos ultimos 6 meses -> os canais deles
Fica o canal criado ha' menos de N meses, com inscritos e inscritos por video acima do piso.
"""
import datetime as _dt, os, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path: sys.path.insert(0, AQUI)

import persona as _persona                                                  # noqa: E402

CUSTO_RADAR = 2 * 100 + 2


def _meses_atras(n, hoje=None):
    hoje = hoje or _dt.date.today()
    return (hoje - _dt.timedelta(days=int(n * 30.4))).isoformat()


def rodar(banco, yt, pid, meses=18, min_inscritos=5000, diz=print, hoje=None):
    """[canais] novos da persona, gravados no radar. Mais inscritos primeiro."""
    p = _persona.persona(pid)
    corte = _meses_atras(meses, hoje)
    # ⭐ cada persona e' procurada no mercado dela, com a palavra que o nativo usa
    P = _persona.IDIOMAS[p.get("idioma", "en")]
    q = p.get("busca") or p["nome"]
    ids = set(yt.buscar(q, depois=corte, ordem="relevance", maximo=50, tipo="channel", idioma=P["idioma"], regiao=P["regiao"]))
    vids = yt.buscar(q, depois=_meses_atras(6, hoje), ordem="viewCount", maximo=50, idioma=P["idioma"], regiao=P["regiao"])
    melhor = {}                     # ⭐ o video mais visto de cada canal: o painel mostra a thumb dele
    for v in (yt.videos(vids) if vids else []):
        ids.add(v["canal_id"])
        if v["views"] > melhor.get(v["canal_id"], {}).get("views", -1): melhor[v["canal_id"]] = v
    canais = yt.canais(sorted(ids)) if ids else []
    novos = []
    for c in canais:
        if c["criado"] < corte or c["inscritos"] < min_inscritos: continue
        # ⛔ a busca por canal devolve qualquer coisa ("Old Mechanic" trouxe historias em hindi, 08/10):
        # so' entra o canal com a persona no nome, na descricao ou no video mais visto
        texto = " ".join([c["nome"], c.get("descricao", ""), (melhor.get(c["id"]) or {}).get("titulo", "")])
        if not _persona.ja_tem_persona(texto, p): continue
        c["por_video"] = round(c["inscritos"] / max(c["n_videos"], 1))
        v = melhor.get(c["id"]) or {}
        c["video_id"], c["video_views"] = v.get("id", ""), v.get("views", 0)
        banco.marcar_radar(c["id"], p["id"], c["video_id"], c["video_views"])
        novos.append(c)
    novos.sort(key=lambda c: -c["inscritos"])
    banco.radar_rodou(p["id"])
    diz(f"radar {p['nome']}: {len(novos)} canal(is) novo(s) com ≥ {min_inscritos:,} inscritos")
    return novos


def _autoteste():
    import tempfile
    from banco import Banco
    from youtube import YouTube
    ok = True
    def caso(nome, cond):
        nonlocal ok; print(("  OK  " if cond else "  ERRO"), nome); ok &= bool(cond)
    CANAIS = {"NOVO": ("Amish Gardening", "2025-11-01", 106_000, 134), "VELHO": ("Old Amish Life", "2015-01-01", 900_000, 500),
              "MINI": ("Amish Tiny", "2026-01-01", 800, 5), "OUTRO": ("Girl Truck Routine", "2026-01-01", 455_000, 70)}
    def falso(url):
        if "/search?" in url and "type=channel" in url:
            return {"items": [{"id": {"channelId": "NOVO"}}, {"id": {"channelId": "MINI"}}, {"id": {"channelId": "OUTRO"}}]}
        if "/search?" in url:
            return {"items": [{"id": {"videoId": "X"}}]}
        if "/videos?" in url:
            return {"items": [{"id": "X", "snippet": {"title": "t", "channelId": "VELHO"}, "statistics": {},
                               "contentDetails": {}}]}
        if "/channels?" in url:
            return {"items": [{"id": k, "snippet": {"title": v[0], "publishedAt": v[1] + "T00:00:00Z"},
                               "statistics": {"subscriberCount": str(v[2]), "videoCount": str(v[3])}}
                              for k, v in CANAIS.items()]}
        return {}
    b = Banco(os.path.join(tempfile.mkdtemp(prefix="min-radar-"), "t.db"))
    yt = YouTube(b, chave="k", http=falso)
    r = rodar(b, yt, "amish", diz=lambda *_: None, hoje=_dt.date(2026, 10, 8))
    caso("⭐ so' o canal novo, grande e da persona entra (sem o canal aleatorio)", [c["id"] for c in r] == ["NOVO"])
    caso("inscritos por video", r[0]["por_video"] == 791)
    caso("fica gravado no radar", b.radar("amish")[0]["id"] == "NOVO")
    caso("custo declarado bate", yt.cota()["usadas"] <= CUSTO_RADAR)
    caso("⭐ radar que nao acha nada marca saturacao 0, nao -1",
         rodar(b, yt, "old-electrician", diz=lambda *_: None, hoje=_dt.date(2026, 10, 8)) == []
         and b.saturacao("old-electrician", "2026-04-01") == 0)
    b.fechar()
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if "--autoteste" in sys.argv: sys.exit(0 if _autoteste() else 1)
