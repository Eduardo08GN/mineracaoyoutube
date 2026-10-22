# Vídeo 5 — "¿Qué pasaría si el tiempo se acelerara y no pudiera parar?"

Refação em espanhol de *What If Time Sped Up and Couldn't Stop?* (Minute Zero, 8:57). Produzido na madrugada de 22/10/2026,
do zero ao mp4 final em ~6 h, com a pipeline e a stack de qualidade descritas em [`../STACK.md`](../STACK.md) e
[`../video01/PRODUCAO.md`](../video01/PRODUCAO.md). Duração 9:27,2 (537,2 s do original + 30 s de take inédito), 17.016 quadros.

## O que é novo neste vídeo

**1. Produção em paralelo por agentes, com contrato fixo.** O orquestrador escreve o esqueleto comum e cada "mundo" vira um
módulo com dono:

| Arquivo comum (orquestrador) | Papel |
|---|---|
| `src/tempo.ts` | relógio da história: log10 do tempo decorrido lá fora por segundo do original (lido do painel do original), hora do dia, dia do ano |
| `src/roteiro.ts` | 23 capítulos + take, `tOrig`, **câmera POV** (trilho de guinada/inclinação/rolagem tirado dos 48 eventos de câmera do mapa), `alturaOlho` (gelo e montanha te levantam), `relCam` |
| `src/Cena.tsx` | monta cada mundo no seu trecho e escolhe o perfil do look |
| `BRIEF.md` | regras comuns que todo agente lê (determinismo, ação em cena, qualidade, licenças, nada no C:, como testar) |

| Agente | Arquivos | Trecho |
|---|---|---|
| Céu | `mundo/ceu.tsx` | céu físico em lapso de tempo (média do céu na janela de cada quadro: disco → traço → listra → faixa entre solstícios), estrelas e rastros, Polar, Betelgeuse, vapor, `luzEm(t)` |
| Rua | `mundo/rua.tsx`, `mundo/arvores.tsx` | bairro hispânico ("CALLE 12 DE OCTUBRE"), pedestres e carros, estações e neve, casa trocada, muda que vira árvore, volta às 17:42; wrapper do **EZ-Tree** |
| Cidade | `mundo/cidade.tsx` | skyline que cresce, muro contra o mar, torres de 1,9 km, apagão e queda |
| Terra | `mundo/terra*.tsx` | gelo com fendas, cânion de 1,6 km, cordilheira, deserto e a última árvore, rocha, salinas |
| Cosmos | `mundo/cosmos*.tsx` | abertura na gigante vermelha, Andrômeda (38 mil estrelas) e a fusão, lava, dentro do Sol, nebulosa planetária, anã branca |
| Fim | `mundo/fim*.tsx` | galáxias e estrelas se apagando, colisão, buraco negro com disco de acreção (raymarching), evaporação, flash final |
| Corpo | `mundo/corpo.tsx`, `mundo/take.tsx` | braço com relógio (5 vezes), pés no gelo e flutuando, e o take inédito |
| HUD | `Video.tsx`, `hud.tsx`, `hud_dados.ts`, `legendas.json` | painel em espanhol (escala longa: mil millones, billones…), 140 legendas, título, borrão nos chicotes |
| Som | `audio/` | 13 cues de música (ACE-Step) e 49 efeitos (MOSS) na G4, mixagem a −14 LUFS |

Teste local com trava global de 3 renders (`teste/still.sh`, pasta `D:\whatif_es\_slots`); stills de verdade na G4
(22 quadros em < 1 min).

**2. Árvores: EZ-Tree** (`@dgreenheck/ez-tree` 1.1.0, MIT; cascas CC0 de Poly Haven/TextureCan, embutidas no pacote).
Galhos 3D com semente (determinístico), presets Ash/Aspen/Oak/Pine Small–Large; por cima: estações (cor, queda das folhas, neve
nos galhos), crescimento Small→Medium→Large com dissolve, vento por `update(t)`. Floresta instanciada (`<Floresta>`).

**3. Upload para a G4 pelo painel Arquivos** (`colab.subir_painel`): grava direto em `/content` sem célula; pedaços de 45 MB
(limite de 50 MB do Playwright por CDP, erro 72), cada um conferido pelo tamanho na VM, junção idempotente (erro 73), conferir md5.
O widget `files.upload()` ficou só para arquivos pequenos (rodava vazio às vezes).

**4. Look: perfil arredondado e chaveado pelo conteúdo** (`look/Look.tsx`): o compositor só é recriado quando o perfil muda de
verdade (2 algarismos); cores lidas pelo valor original (erro 74). God rays só quando há disco de Sol de verdade.

## Adaptação cultural e take inédito
- A rua americana virou um bairro hispânico (reboco claro, telha cerâmica, grades, ponto de ônibus "PARADA", placa
  "CALLE 12 DE OCTUBRE": 12 de outubro de 2026 é segunda-feira, como no original — e é o Día de la Hispanidad).
- Unidades métricas ("más de un kilómetro y medio"), escala longa do espanhol em todo número.
- **Take inédito (6:26,5–6:56,5): "Tu cabeza envejece más rápido que tus pies"** — dilatação temporal gravitacional: NIST 2010
  (relógios atômicos de alumínio com 33 cm de diferença; ~90 ns em 79 anos) e GPS (+45 µs/dia pela gravidade, −7 pela velocidade,
  +38 líquido; sem correção, ~10 km/dia de erro). Fontes em `public/corpo/FONTES_TAKE.txt` e na descrição.

## Tempo de máquina (G4)
Música + efeitos: 9 min. Stills de teste: < 1 min. Render completo (17.016 quadros, 24 Chromes): ~12 min incluindo bundle,
reparo e encode. Retrabalho de 90 quadros (erro 75): ~2 min. Download do mp4 mudo (324 MB): ~3 min.

## Arquivos
Código em [`codigo/src`](codigo/src), brief comum em [`BRIEF.md`](BRIEF.md), mapa de ações em [`mapa_acoes.md`](mapa_acoes.md),
mapa de som em [`mapa_som.json`](mapa_som.json). Projeto vivo: `D:\whatif_es\05_time_sped_up\v1`; entrega em
`D:\whatif_es\05_time_sped_up\entrega\`.
