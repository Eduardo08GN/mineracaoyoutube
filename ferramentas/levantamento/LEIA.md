# Ferramentas do levantamento de prontos (CLAUDE.md, portão 1)

Usadas no passo 0 do `docs/BATEDOR.md`. Leem a chave da YouTube API do `.env` local e nunca a imprimem.

| Ferramenta | O que faz |
|---|---|
| `python -I yt_busca.py "consulta" [max] [lang]` | Busca vídeos na YouTube Data API: id, canal, views, duração, data e título. Custa ~101 unidades de cota por busca. |
| `python -I yt_legenda.py <id> <saida.txt>` | Baixa a legenda em inglês (automática ou manual) como texto com marcas de minuto, para ler o método de tutoriais e making-ofs. |
| `python -I yt_desc.py v\|c id1,id2` | Descrição de vídeos (`v`) ou canais (`c`). Os concorrentes creditam ali assets, dados e ferramentas. |
| `gh search repos "termos" --sort stars --limit 10 --json fullName,stargazersCount,updatedAt,description,license` | Busca de repositórios no GitHub. A busca é literal: use muitas variações de termo. |

Também valem o grep.app (código), as listas "awesome", o npm, o PyPI, `extensions.blender.org`, Poly Haven, ambientCG e JangaFX.
