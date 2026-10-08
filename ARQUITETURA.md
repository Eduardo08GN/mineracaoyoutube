# Minerador de Nichos — arquitetura

Mesmo motor de interface do `ow_agente`: **Python faz o trabalho, uma página React desenha, uma
janela do Windows segura a página.** Nada de Electron, nada de servidor na nuvem.

```
┌──────────── janela do Windows (pywebview / WebView2) ─────────────┐
│  painel React (Vite + TS)  ── fetch /api/* ──┐                    │
│        ▲                                     ▼                    │
│        └──── WebSocket /api/eventos ── servidor FastAPI (127.0.0.1, senha por sessão)
│                                              │                    │
│  window.pywebview.api (Ponte) ── pastas, abrir link, copiar       │
└──────────────────────────────────────────────┼────────────────────┘
                                               ▼
                         núcleo (sem tela): fila de garimpos + eventos
                                               ▼
                motor/: YouTube API · yt-dlp · outlier · persona · score
                                               ▼
                                 data/minerio.db (SQLite)
```

## Peças herdadas do ow_agente (mesma regra, mesmo jeito)

| ow_agente | aqui | o que faz |
|---|---|---|
| `agente/painel.py` | `agente/painel.py` | abre a janela WebView2, sobe o servidor num fio, passa a senha pela URL, guarda tamanho/posição |
| `agente/servidor.py` | `agente/servidor.py` | FastAPI só em 127.0.0.1; toda `/api` pede `X-Token`; confere `Host` (DNS rebinding); WS manda `estado` e depois cada evento |
| `agente/nucleo.py` | `agente/nucleo.py` | o estado vive aqui; quem desenha só chama métodos e ouve `ouvir(fn)` |
| `painel/app` (React 19, Vite, lucide, fontsource) | `painel/app` | mesmas libs, mesmo `api.ts` / `estado.ts` (useHook + WS com reconexão) / `rota.ts` (hash) |
| `painel/design-system/tokens.css` | igual | mesmos tokens `--ow-*` (troca só o acento, se quiser) |
| `motor/descrever.py` (`claude -p`) | `motor/persona.py` | reescrita de título pelo Claude Code da máquina — sem chave extra |
| `--autoteste` em cada módulo | igual | cada arquivo se testa sozinho |

## Motor de mineração (`motor/`)

| módulo | entrada → saída |
|---|---|
| `youtube.py` | YouTube Data API v3 + contador de cota diária (10.000 unidades; busca = 100) |
| `ytdlp.py` | metadados sem gastar cota (fallback e enriquecimento) |
| `garimpo.py` | sementes → virais antigos (`publishedBefore=2022-01-01`, por views) |
| `outlier.py` | views ÷ inscritos do canal, idade, views/dia → nota de "viral provado" |
| `remake.py` | o título já foi remakado com persona depois de 2024? (lacuna aberta ou não) |
| `persona.py` | matriz persona × tema e reescrita "…The Old AMISH Way" via `claude -p` |
| `radar.py` | canais-persona novos (criados < 12 meses, inscritos por vídeo alto) — acha o próximo "Elias Yoder" |
| `score.py` | demanda provada × lacuna × encaixe da persona × potencial de produto próprio |
| `banco.py` | SQLite: sementes, vídeos, canais, oportunidades, cota |

## Telas do painel

| rota | tela |
|---|---|
| `#/` | **Painel** — cota do dia, garimpos rodando, feed ao vivo, top 5 da semana |
| `#/garimpo` | **Novo garimpo** — sementes + persona(s) + filtros → roda |
| `#/oportunidades` | **Oportunidades** — cards: thumb antiga, views, outlier, título reescrito, nota |
| `#/oportunidades/:id` | **Detalhe** — original, remakes que já existem, 5 títulos, ângulo de produto |
| `#/matriz` | **Matriz** — persona × tema em mapa de calor |
| `#/radar` | **Radar** — canais-persona novos crescendo rápido |
| `#/ajustes` | **Ajustes** — chave da API (lida do `.env`), cota, Claude |

## Rodar

```bash
python minerador.py              # abre a janela
python minerador.py --autoteste  # testa todos os módulos
cd painel/app && npm run dev     # painel em desenvolvimento (proxy /api -> 127.0.0.1:8790)
```

## Regras

- ⛔ A chave da API mora só no `.env` (no `.gitignore`). Nunca no código, nunca no painel.
- ⛔ O servidor nunca escuta fora de 127.0.0.1.
- ⭐ Busca é cara (100 unidades): o que já foi buscado fica no SQLite e não se busca de novo no mesmo dia.
