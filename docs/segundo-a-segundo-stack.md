# Segundo a Segundo — stack de produção (atualizada em 02/11/2026)

Canal em espanhol de **reconstrução 3D de acidentes reais, segundo a segundo**: evento quente do mundo todo, narrado para um público hispânico mais velho, com simulação 3D, dados na tela (HUD) e explicação do "porquê" sem anunciar física.

Este documento descreve a stack **como ela está depois do vídeo 5** (queda do Learjet 60 em Greenacres, Palm Beach, 01/11/2026). O vídeo 5 foi produzido em **1 h 17**, do pedido à entrega. Ele também registra as duas mudanças de padrão decididas no mesmo dia: **Céu 2.0** e **paleta premium**.

> Repositório público: aqui não entram chaves, e-mails, IDs de canal, links de notebook nem tokens. Credenciais ficam só no `.env` local.

---

## 1. Visão geral

| Camada | O que é | Onde roda |
|---|---|---|
| Orquestração | Tracer3D 2.0 (`canal.py`, `porteiro.py`, `vigia_ativo.py`) | PC local (só orquestra) |
| Render, música, alinhamento, efeitos | Remotion + three.js, ACE-Step, stable-ts | **G4** (GPU na nuvem), ligada só durante o job |
| Narração | Gemini TTS pelo AI Studio (navegador, plano Ultra) | navegador; **sem API** |
| Roteiro, planejamento, QA | maestro (Opus) + agentes planejadores/batedor | PC local |
| Publicação | manual, pelo dono do canal | YouTube Studio |

Cada vídeo vive numa pasta própria `reconstruccion/NN_<lugar>/`, criada como cópia do vídeo anterior, com:

```
roteiro/    fakten.md (dossiê), gerar_skript.py, skript_*.json, gerar_batidas_A/B.py, BRIEF_PLANEJADOR.md
voz/        narrar.py, NN_<cap>.wav, alinhamento.json
g4/         rodada_g4.py (alinhamento + música + efeitos), fazer_mapa.py, musica_g4.py
v1/         projeto Remotion: src/kit (famílias maquete/welt/karten/ui/epoca), src/cenas/*.json, src/plano.json
ferramentas/ plano.py, efeitos.py, mixar.py, legendas.py, cenas_batedor_*.py, folha_*.py
dados/      descricao_curta.json, publicacao.json, miniaturas/montar.py
render/     RENDER_MUDO_NAO_PUBLICAR.mp4, folhas de contato (FOLHA_*.jpg)
entrega/    só o mp4 final com áudio + 3 miniaturas + titulo_e_descricao.txt + legendas + PUBLICACAO.txt
MEDICAO.md  linha do tempo real de cada etapa
```

## 2. Esteira de um vídeo de notícia quente (régua: ≤ 2 h)

| # | Etapa | Ferramenta | Tempo no vídeo 5 |
|---|---|---|---|
| 0 | Gancho e corrida: Trends ES+MX+AR+CO, concorrentes (API YouTube), autocompletar | `radar/`, API | — |
| 1 | Dossiê de fatos com fontes (ficha, segundos, clima, lugar) | agente dossiê → `fakten.md` | 15 min |
| 2 | Roteiro em capítulos; checagens automáticas (sem dígitos, sem dois-pontos, sem "física"/"vas a entender") | `gerar_skript.py` | junto com a 1 |
| 3 | Narração, 1 wav por capítulo | `narrar.py` (AI Studio) | 17 min |
| 4 | G4 no ar: alinhamento palavra a palavra, música instrumental (com Demucs e medição de voz), efeitos | `rodada_g4.py` | 12 min |
| 5 | Batidas visuais em 2 planejadores paralelos (A: caps. iniciais, B: finais) | `gerar_batidas_A/B.py` → `plano.json` | 14 min |
| 6 | Portões: `plano.py` (MISTURA: 3D ≥ 60%, cartão ≤ 25%, mapa ≤ 15%; DINAMISMO: ≤ 2 cartões seguidos), preflight | `plano.py` | — |
| 7 | Render na G4 (18.909 quadros em 350 s no vídeo 5) | `canal.py render` | 8 min |
| 8 | Mix a −14 LUFS (pico −1 dB), mux, `ffprobe`; desligar a G4 e conferir | `mixar.py`, `efeitos.py` | 5 min |
| 9 | Embalagem: 3 títulos A/B, 3 miniaturas, descrição curta, legendas, roteiro de publicação | `descricao_curta.py`, `montar.py`, `legendas.py`, `publicacao.py` | 10 min |

Regras fixas da esteira:
- **Batedor sempre.** Elemento visual novo só entra depois de uma prova curta (stills e folha).
- **Vigia ativo.** Etapa longa tem monitor emitindo cada mudança ou erro; nada de loop cego de espera.
- **G4:** ligada só com job. Desligar e conferir no fim. Nunca desligar com job de outra sessão.
- **Entrega:** a pasta `entrega/` só recebe o mp4 com áudio conferido. O render mudo se chama `RENDER_MUDO_NAO_PUBLICAR`.

## 3. Linguagem visual (regras do canal)

- **Gancho em 10 s:** o capítulo 1 abre já no momento crítico (no vídeo 5, o mergulho com as frases do rádio). Nunca abrir com cartão calmo.
- **Câmera sempre em movimento:** chase, órbita, drone, travelling. As réguas são as de `docs/plano-qualidade-3d.md` §3: 0% de imagem congelada, **câmera parada ≤ 10%** nos planos 3D (velocidade mínima de cada preset acima do limiar do medidor) e **≥ 12 takes distintos/min**, contando mudança de câmera ou ação dentro da batida. Take longo (30–80 s) só nos blocos de mecanismo, com a câmera andando e algum dado mudando a cada ≤ 1 s. Fora deles, cortes de 2,5–6 s.
- **Instrumento vivo nos blocos de mecanismo** (o miolo "segundo a segundo"; regra aprovada pelo Eduardo em 03/11):
  - uma simulação contínua carrega o dado; o número citado vira instrumento sobre ela, nunca cartão separado;
  - no máximo 3 grandezas em cor de sinal, mais 1 barra amostrada no objeto ("a la altura del avión · dentro de la nube") e o relógio com a compressão de tempo declarada;
  - os instrumentos entram e saem com a fala;
  - legenda de ação de 1 linha;
  - dado do ambiente como volume 3D rotulado;
  - cartão preto de uma frase: no máximo 10% do vídeo e 3 s cada.
- **Texto sobre 3D em movimento:** cartão (documento, citação, gráfico) sempre com fundo 3D vivo.
- **HUD nos capítulos críticos:** relógio local com segundos, altitude, razão de descida (vermelho), contador de segundos.
- **Explicação para leigo** em 2 a 3 blocos por vídeo, ancorados palavra a palavra, sem anunciar "física".
- **Take inédito de ~1 min:** o fato que a TV não explicou, terminando em pergunta, sem afirmar causa.
- **Respeito:** impacto só em plano médio ou longo; sem corpos, sem nomes; vítimas como manequins sem rosto; sem logos de fabricante.
- **Créditos e licenças só na descrição**, nunca na imagem. Sem marca d'água "SIMULATION". Música só instrumental.
- **Final:** ponte para outro vídeo do canal e pergunta para os comentários.

## 4. Kit 3D "maquete" (Remotion + three.js puro)

O motor (`kit/maquete/motor.ts`) é three.js fora do R3F, com compositor próprio:
- N8AO + bloom + tonemapping;
- **acumulação Halton de N amostras por quadro** (antialiasing, sol com disco, DOF);
- determinístico: o mesmo quadro sempre gera o mesmo MD5.

As cenas são escritas em JSON (`cenas/maquete.json`), sem código novo por vídeo:
- câmera em trilho ou `segue` (chase);
- objetos do registro de modelos;
- `anot` (números grandes, tiras de rádio, rótulos);
- `uhr` (relógio);
- `look`.

**Modelos já disponíveis:**

| Vídeo | Modelos |
|---|---|
| 1 | aviação de pista: B747, RJ85, Pista |
| 2–4 | trens: Via, TremAV, PostoControle, Terreno, Rodeiro, Seta3D, Aldea |
| 5 | Jato (Learjet 45 CC-BY reescalado para o 60, atitude completa, trilha, turbulência, rastro), Tempestade, Chuva, Bairro (OSM), CabineJato; física: Turbulencia, Picada |
| todos | Feuer, Rauch (flipbooks) e Manequim |

### 4.1 Céu 2.0 (novo, 02/11) — `kit/maquete/ceu.ts`

O céu do vídeo 5 foi reprovado: nuvem de esferas, céu chapado e luz sem direção. Ele foi substituído por:

- **Nuvem volumétrica por raymarch** (`nuvemVol`): uma malha-caixa com shader.
  - A densidade vem de uma forma analítica multiplicada por ruído 3D Perlin-Worley (textura 96³ gerada uma vez, de forma determinística).
    - Formas: cumulonimbo com base reta, torre de couve-flor, bigorna e cortina de chuva; ou camada, para mar de nuvens e teto de tempestade.
    - Leituras anti-repetição em escalas não comensuráveis.
  - Luz por marcha de sombra até o sol: Beer, powder, fase HG dupla e 3 oitavas de espalhamento múltiplo.
  - Ambiente por altura, com manchas.
  - Perspectiva aérea igual à névoa da cena.
  - Detalhe extra quando a câmera chega perto.
  - Clarão de relâmpago por dentro.
- **Oclusão correta:** o motor faz um pré-passe de profundidade por amostra, então a nuvem para no jato ou no chão e o jato pode atravessar a nuvem. O jitter do raio usa a mesma amostra Halton da acumulação, que limpa o ruído.
- **Dois céus:**
  - `florida_v`: céu físico (Preetham) que também é o IBL. Serve para cruzeiro alto, acima das nuvens.
  - `florida_vf`: céu de foto 4k com nuvens reais (Poly Haven, CC0), com o sol do HDRI girado para o azimute da luz da cena. Serve para média e baixa altitude.
  - `tormenta_v`: encoberto 4k escurecido mais teto volumétrico com base ondulada (modelo `Camada`).
- **Tonemapping `neutral`** nos looks novos (cor mais viva que o AgX).
- **Opt-in:** a cena precisa de `nuvens: 'vol'` (os looks `*_v` já trazem). Os vídeos 1 a 5 não mudam.
- **Proibido daqui para frente:** nuvem de esfera ou sprite, e céu de cor única.

### 4.2 Paleta premium (novo, 02/11)

A "maquete branca" monocromática deixa de ser o visual do canal. Com `paleta: 'premium'` (os looks `*_v` já trazem):
- avião com pintura executiva real (verniz, cheatline, vidros escuros, metal nos motores) e o acento azul da vítima na deriva;
- bairro nas cores do lugar;
- asfalto e vegetação reais;
- chão de longe com textura;
- sobreposições (UI) com tokens refinados.

O look `blanco` sai também do diagrama. Todo trecho de explicação usa o preset "explicação AiTelly" (`docs/plano-qualidade-3d.md` §2a e `docs/acabamento-threejs.md` §8): palco, uma cor saturada por subsistema, luz de estúdio suave e colorfulness ~30.

### 4.3 Custo de render

| Configuração | Custo relativo por quadro | Vídeo de 10 min na G4 |
|---|---|---|
| Maquete antiga (esferas, HDRI 1k) | 1× | ~6 min (medido no vídeo 5) |
| Céu 2.0 (volumétrico) | ~3–5× nas cenas com nuvem (medido em stills locais) | estimado em 20–30 min |

## 5. Embalagem e publicação

**Títulos do teste A/B (3, cada um preso à sua miniatura):**

| # | Molde | Exemplo |
|---|---|---|
| 1 | "¿Por qué…?", o arquétipo mais forte em espanhol para evento real (mediana ~269 mil views na amostra de 01/11). Tipo do evento + lugar nas primeiras palavras, usando o termo que o hispânico digita ("avión", não o modelo). | "¿Por qué cayó el avión en Florida? El Learjet 60 de Palm Beach, reconstruido en 3D" |
| 2 | O molde do viral do canal (Urda, 87 mil views): "<tipo> en <lugar>: lo que realmente pasó con/en <x>" | "Accidente de avión en Florida: lo que realmente pasó con el Learjet de Palm Beach" |
| 3 | Gancho do material que o público procura + "últimos N segundos en 3D". **Nunca prometer áudio de controle de tráfego ou caixa-preta**: o canal não usa esse áudio (decisão do Eduardo, 03/11). | "Learjet en Florida: sus últimos 84 segundos, reconstruidos en 3D" |

O que os dados do canal mostram até aqui:
- O viral (Urda) veio do **evento quente**, com 80% do tráfego vindo do Início e 15% de "A seguir". Não veio do molde: dois casos antigos com o mesmo molde fizeram 203 e 475 views.
- Por isso o canal só publica com gancho: evento quente, aniversário redondo ou fato novo de caso antigo.
- Publicar mesmo com a busca já em ~10% do pico, até ~48 h depois.
- O vencedor do teste A/B só aparece no Studio (aba "Testes"). A API pública mostra o título original enquanto o teste roda.

**Outras regras da embalagem:**
- **Miniaturas:** 3 por vídeo, pareadas com os títulos. Combinam simulação + número, rosto de susto + gancho e rosto + número; os rostos são fictícios, feitos no Flow.
- **Descrição curta (~1.200 caracteres):** 4 linhas, capítulos, 1 linha de licenças e 3 a 5 hashtags. Títulos com até 100 caracteres.
- **Publicação:** manual. Telas finais, cards, playlist e comentário fixado ligam o vídeo novo ao viral (`PUBLICACAO.txt`). Nunca dois uploads no mesmo dia.

## 6. Pendências da stack

- Aprovar o batedor do Céu 2.0 e da paleta premium (folha em `render/FOLHA_ceu.jpg` e `render/FOLHA_paleta.jpg` do vídeo 5) antes do próximo vídeo.
- Medir o custo real do Céu 2.0 na G4 no primeiro render completo.
- Rótulos do `titulo_e_descricao.txt` saíram em alemão no vídeo 5 (herança do modelo Kriegsmomente): corrigir o gerador.
