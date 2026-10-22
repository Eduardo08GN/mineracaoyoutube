# Vídeo 6 — "¿Qué pasaría si la Tierra girara cada vez más lento y no pudiera parar?"

Refação em espanhol de *What If Earth Spun Slower and Couldn't Stop?* (What If Sim, 6:52). Produzido em 22/10/2026, de manhã
à tarde, com a pipeline do vídeo 5 ([`../video05/PRODUCAO.md`](../video05/PRODUCAO.md)) mais a etapa nova do **batedor**
([`../BATEDOR.md`](../BATEDOR.md), registro deste vídeo em [`batedor.md`](batedor.md)). Duração 7:22 (412 s do original + 30 s de
take inédito), 13.260 quadros.

## Etapas e tempos
| Etapa | Como | Tempo |
|---|---|---|
| Leitura a 10 fps | `analisar.py` + agente MAPA (16 capítulos, 414 eventos, HUD a cada 2 s, legendas corrigidas) | ~35 min |
| Batedor | agente BATEDOR em paralelo com o mapa (ETOPO, palmeiras, areia molhada, onda, geada) | ~40 min |
| Esqueleto | `roteiro.ts` (capítulos, fusões, take em 244,9), `fisica.ts` (velocidade do equador lida do painel, dia solar, `nivelMar`), `Cena.tsx`, stubs, BRIEF | ~20 min |
| Mundos | 11 agentes em paralelo (céu, praia+palmeiras, leito+chão molhado, calçadão, Gaztelugatxe+Panamá, Madrid, globo, Acapulco, HUD, take, som) | ~1 h 50 |
| G4 | assets 198 MB pelo painel (md5 conferido), música + efeitos (19 + 69), 24 stills, render completo, retrabalho de 25 quadros | ~45 min |
| Final | mixagem −14 LUFS, `glitch.py`, emenda, lado a lado | ~20 min |

GPU desta sessão: **NVIDIA RTX PRO 6000 Blackwell** (render completo de 13.260 quadros em ~8 min).

## Diferença de arquitetura em relação ao vídeo 5
Não há câmera POV fixa: **cada mundo controla a própria câmera** (`camEm` em `roteiro.ts`) e monta o próprio céu com
`<CeuLugar t lugar>` (`mundo/ceu.tsx`: Sol pela rotação física desta Terra que desacelera, ancorado em instantes medidos no
original; nuvens volumétricas; Via Láctea CC0). Fusões de 0,6 s entre capítulos em `Video.tsx` (duas cenas sobrepostas).

## Adaptação cultural
| Original | Nosso |
|---|---|
| The Equator | El Ecuador (Atacames) — calçadão com letreiro "ATACAMES", ônibus "ESMERALDAS" |
| Cannon Beach, Oregon + Haystack Rock | **San Juan de Gaztelugatxe, España** (43,4 N): ilhota com ermida, sino, escadaria; caserío basco |
| New York / Times Square | **Madrid, Gran Vía / Plaza del Callao** (40,4 N): telões "ÚLTIMA HORA", "EVACUACIÓN", táxis com a faixa vermelha, ônibus da EMT |
| San Francisco / Golden Gate | **Ciudad de Panamá, Puente de las Américas** sobre o Canal que seca |
| Santa Monica | **Acapulco, México**: baía, hotéis, roda-gigante no muelle com LEDs verde-branco-vermelho |
| mph | km/h em todo o painel e legendas |

## Take inédito (4:04,9–4:34,9): "La Luna ya está frenando la Tierra"
O dia fica ~1,8 ms mais longo por século (Stephenson, Morrison & Hohenkerk, Proc. R. Soc. A 2016); a Lua se afasta 3,8 cm/ano
(refletores laser das Apollo — NASA); corais fósseis do Devoniano registram ~400 dias por ano (Wells, Nature 1963). Cena: Terra e Lua
com o bojo de maré e o "freio", régua da Lua se afastando, contador da duração do dia, coral fóssil com as linhas diárias contadas.

## Novidades da stack (vindas do batedor)
- **Relevo NOAA ETOPO 2022** (domínio público) no shader do globo: a costa nova sai do nível do mar por latitude (`nivelMar`).
- **Palmeiras Yughues/Nobiax** (CC0) com vento por shader e geada: `mundo/palmeiras.tsx`.
- **Chão molhado → seco → rachado** por tempo de exposição: `mundo/chao_molhado.tsx` (praia, leito, Canal do Panamá).
- **Onda gigante / parede de água / teto de água** feitas por nós (não há água pronta com licença livre).

## Erros novos
Erro 76 (`erros-pipeline.md`): limite de capítulo com ponto flutuante na saída do take — `capDe` com tolerância de 1e-6.

## Arquivos
Código em [`codigo/src`](codigo/src), brief em [`BRIEF.md`](BRIEF.md), mapa em [`mapa_acoes.md`](mapa_acoes.md), som em
[`mapa_som.json`](mapa_som.json). Projeto: `D:\whatif_es\06_spun_slower\v1`; entrega em `D:\whatif_es\06_spun_slower\entrega\`.
