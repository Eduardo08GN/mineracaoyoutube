# Documentário de notícia quente (~10–12 min): pipeline barato, Lanús 19/11/2026

Formato do Segundo a Segundo / página FB "¿Qué Pasaría Si? 3D" a partir de 19/11. O 1º vídeo saiu sobre a explosão de gás em Lanús: `lanus_doc12_v2_sfx.mp4`, com 10min41s.

## Por que este formato
O Eduardo mediu o vídeo "Why Is Nvidia's AI Chip So Hard to Copy?" (Silicon Up Close, 21 min, 83 mil views em 2 dias). Quase todo o vídeo é motion graphics em Remotion, com 3D e foto só pontuais, e por isso sai barato.
A ideia é usar o **pipeline barato** dele com o **dinamismo** do Kriegsmomente (K19/K20). O vídeo **não** é slideshow: tem câmera viva, paralaxe, transições e dado que nasce na cena.

## Meta de tempo
No máximo 30 min do pedido à entrega. O 1º vídeo levou bem mais por causa do vaivém de rota; a §6 diz o que evitar.

## Etapas (com o tempo medido no Lanús)
| # | Etapa | Ferramenta | Tempo |
|---|---|---|---|
| 1 | Radar: tema quente, de qualquer país | `ferramentas/radar_noticias/radar.py` | — |
| 2 | Dossiê de fatos com fontes (agente Sonnet) | WebSearch/WebFetch → `dossie/fakten.md` | ~3 min |
| 3 | Roteiro ES de ~1.700 palavras em capítulos `## N.` (Opus), depois a copy agressiva | sessão **COPY Master** (`roteiro_v2.md`) | ~6 min |
| 4 | Voz: Qwen3-TTS na G4 com o clone do narrador do Learjet, `N_TOMADAS=1`, tempos por palavra | `doc12/pk_voz` + `rodar_job_g41.py` | 4,5 min |
| 5 | Âncoras reais: fotos do caso (galeria da imprensa); **fora as com ferido, sangue ou rosto em close** | agente | ~1 min |
| 6 | **Imagens novas no Google Flow** (perfil 12 Ivone), ancoradas nas fotos reais, **só imagem, nunca vídeo**, ~35 únicas | `D:/tmp/lanus_vids/flow_lanus.py` (base `flow_ivone.py`) | ~5 min por lote de 20 |
| 7 | Profundidade das imagens: Depth Anything V2 Large na G4 | `doc12/pk_depth*` | ~3 min |
| 8 | Planejador: frase → pedaços de ≤12 palavras → batidas, cerca de 60% foto 2.5D + diagramas explicativos | `doc12/planejar2.py` + `imagens.json` (imagem por capítulo) | segundos |
| 9 | Render Remotion na G4 (1920×1080, 30 fps) | `v1/ferramentas/g4_render.py` | ~7 min para 10min41s |
| 10 | Efeitos sonoros: MOSS-SoundEffect v2.0 na G4 (whoosh, tique, gás, explosão, fogo, impacto) | `doc12/pk_sfx` | 4,5 min |
| 11 | Mixagem voz + efeitos pelas batidas, −14 LUFS, **sem música** | `doc12/mixar_sfx.py` | segundos |

Pasta do 1º vídeo: `D:/producao/fb_que_pasaria_si/formatos/reels_noticia/lanus/` (`doc12/`, `v1/`, `vids/`, `render/`, `entrega/`).

## Kit Remotion (`lanus/v1/src/kit/`, dirigido por `batidas.json`)
Tipos:
- `foto25d`: imagem com profundidade, câmera 3D (push, pull, lateral, sobe, desce, órbita) e `fx` (fumaça, fogo, faíscas, gás, poeira, cinzas);
- `cano`: corte do subsolo;
- `nuvem`: planta da esquina com a janela de 5–15%;
- `relogio`, `numero`, `comparacao`, `saldo`, `cita`, `lista`, `titulo`, `explosao`, `mapa`, `take`.

`sobre` põe um cartão como camada lateral em cima da foto, nunca no centro.

Transições: `whip`, `fumaca`, `tinta`, `luz`, `zoom`, `glitch`, `corte`. Look global: grão, vinheta, letterbox e bloom. Legenda com uma palavra por vez.

## Regras do Eduardo nesta rodada (19/11)
1. **Não é slideshow.** O que vale do vídeo da Nvidia é o pipeline barato; o dinamismo vem do vídeo alemão: paralaxe, transição de fumaça, câmera e batida.
2. **Imagens no Flow, só IMAGEM.** As fotos reais servem de âncora e nunca aparecem no vídeo. Nada de Veo ou vídeo gerado.
3. **Zero gore:** fora feridos, sangue, vítimas e rostos.
4. **A animação explicativa fica** (corte do cano, nuvem de gás, relógio). A imagem do Flow não substitui a explicação.
5. **Take de mapa sempre** (país → cidade → bairro → esquina), mesmo em proporção pequena. O 1º vídeo saiu sem, e foi reclamado.
6. **Efeitos sonoros pontuais, sem música.**
7. Imagem de outro caso (ex.: Rosario 2013) não pode usar foto do caso principal.

## Caminhos ruins desta rodada (não repetir)
- Rota trocada 4 vezes (animação 3D → slide → takes do Vids → vídeo do Flow) antes de entender o pedido. Ao receber referência, pergunte em 1 linha **o que** dela vale.
- Vids da 12 Ivone sem cota; a rota é o Flow no mesmo perfil.
- Job na VM em `/content/t2/<proj>` sumiu no meio da execução. Usar `/content/jobs/<dono>/` (fluxo `g4.py`, `docs/g4-concomitante.md`).
- Git Bash troca `/content/...` por `C:/Program Files/Git/...` nos argumentos: rodar com `MSYS_NO_PATHCONV=1`.
- "CANAL_CAIU / JSONDecodeError" é o proxy do Colab piscando, não a G4 caindo: relançar o job.
- `foto25d` com câmera lenta ficou 75% parado. Com percurso 3x e soco de zoom caiu para 41%, e a meta é < 20%.
- Imagens do Flow vêm em pares quase iguais (quadros inicial e final): use só uma de cada.
- Mais detalhes em `docs/auditorias/friccao-pipeline-reel-lanus-1911.md`.
