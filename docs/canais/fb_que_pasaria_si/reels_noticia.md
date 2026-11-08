# Página FB "¿Qué Pasaría Si? 3D": formato reels de notícia reconstruída

**Status (08/11/2026):** o estilo foi provado em stills. O revisor independente aprovou a folha como prova de direção, com notas A 8, B 7 e C 8. O vídeo ainda não foi produzido.

**Substitui:** o lote 1 por código, reprovado em 08/11 (roteiro sem contexto, animação "rascunho de estudante", HUD engessado), e a rota de IA por plano. O doc antigo `pipeline-reels-codigo.md` não foi oficializado.

## 1. Regras fixas do formato
- **Zero IA generativa e zero serviço pago no visual.** Scenario, Qwen e Wan estão vetados: a IA alucina e o serviço é pago. Tudo é código mais assets prontos.
- **O evento é o protagonista.** A notícia é real, e quem conta a história é o lugar, a água, o objeto e o número.
- **A pessoa real fica anônima:** de costas, em 3/4 ou em contraluz, nunca com o rosto atuando. Ela dá escala humana.
- **Planos variados:** o geral mostra o lugar e o tamanho, o médio mostra a situação da pessoa, o detalhe mostra o mecanismo.
- **Texto:** nunca sobre o objeto principal. A legenda fica acima dos 18% inferiores, que são a interface do Reels. Nenhum crédito ou licença na imagem; os créditos vão só na descrição.
- **Roteiro (molde do reel do jato na Flórida):**
  1. momento forte;
  2. contexto numa frase só (quem, o quê, onde);
  3. a cena humana antes;
  4. uma pergunta aberta até o fim.

  Use no máximo 4 números, traduzidos, e a ciência só como resposta, nunca no clímax.

## 2. Alvo de estilo: "No Sleep" (scenario.com), por leitura óptica a 24 fps
| Medida | No Sleep | Tempe v4 (reprovado) |
|---|---|---|
| Câmera parada | 40% | 13% |
| Plano mediano | 3,2 s | 1,1 s |
| Colorfulness | 41,5 | 27,6 |
| Luminância mediana | 25 (low-key) | 32 |

**A diferença não estava no ritmo de corte.** Ela estava em quatro pontos:
- **Unidade de arte:** um low-poly só, uma cor de acento, uma paleta por estágio e o último estágio dessaturado com cor seletiva.
- **Luz:** chave quente lateral, contraluz e profundidade de campo.
- **HUD:** editorial serifado em etapas.
- **Movimento:** uma microação por plano, com câmera quase parada.

O No Sleep é IA generativa: a página do Scenario diz isso. Copiamos o princípio, não a ferramenta. A medição completa fica fora do repositório, em `D:/pesquisa_nichos/acidentes_fb/referencias/scenario_no_sleep/`.

## 3. Bíblia de estilo
1. **Kit-base de paleta única: Polyfork** (polyfork.dev).
   - São mais de 3.100 modelos low-poly flat-shaded grátis, com uso comercial, em GLB sem conta.
   - Os kits dividem paleta, escala e grade. Guia de uso: `https://polyfork.dev/prompt.txt`.
   - Use `/api/kits/{id}` (o campo `usage` é o contrato de montagem) e `/api/assets/{id}/matching`.
   - O `.mjs` com knobs (colorway, season, weather, wear) exige uma chave grátis, que fica só no `.env` local.
   - **Licença:** o `.mjs` não pode ser redistribuído, então nunca vai ao repositório.
   - **Kits no deserto dos EUA:** `roadside-americana`, `frontier-town` e `campground-lake`.
   - **Fab da biblioteca do Eduardo** (Cozy Nature, Stylized Forest Sample, Low Poly Nature Essentials): entra quando o caso pedir vegetação verde. O que vier de fora é sempre recolorido para a paleta do kit.
2. **Receita de luz ("modo barato", padrão):**
   - `AccumulativeShadows` + `RandomizedLight` + `ContactShadows` (drei) + N8AO + DoF + vinheta + AgX.
   - Uma paleta por estágio: âmbar/teal, depois azul-marinho, depois cinza frio dessaturado com só o vermelho do herói.
   - **O path tracer está fora,** por decisão do Eduardo (ver §5).
3. **Água e chuva:** use as receitas prontas do pacote `Threejs-Awesome-Graphics-Agent-Skills` (`threejs-water-optics` e `threejs-precipitation-surfaces`), aplicadas em WebGL por `onBeforeCompile`:
   - lama com ondas analíticas na direção da correnteza;
   - faixas de espuma e anel em volta do objeto;
   - anéis de respingo pequenos e esparsos.
4. **HUD editorial** (fontes OFL Playfair Display/SC e Fraunces):
   - **topo central:** "ETAPA n / 3", com 3 pontos e o ativo em vermelho;
   - **topo esquerdo:** rótulo pequeno espaçado, NÚMERO grande serifado e linha de apoio (ex.: "MEDIANOCHE / HORA 1 / EL AGUA SUBE"), sempre sobre céu livre;
   - **legenda:** serifa itálica negrito, por frase;
   - **rodapé:** "RECONSTRUCCIÓN · BASADA EN HECHOS REALES".
5. **Cor de acento única:** o vermelho da pessoa (`#E63B2E`). Todo o resto entra na paleta do kit.

## 4. Batedor de Tempe (08/11): o que funcionou
- **Projeto:** `D:/producao/fb_que_pasaria_si/formatos/reels_noticia/tempe_polyfork/cena/` (Remotion 4 + R3F 9 + three 0.180, com `node_modules` próprio).
- **Assets:** 17 modelos Polyfork (personagem `hiker` rigado e repintado, álamo, barraca, deserto) mais terreno e água por código.
- **Notas do revisor por rodada:**

  | Rodada | A | B | C | Veredito |
  |---|---|---|---|---|
  | r1 | 5 | 2 | 4 | reprova |
  | r14 | 7 | 4 | 6 | reprova |
  | r15 | 8 | 5 | 7 | reprova |
  | r16 | 8 | 7 | 8 | **APROVA** |

- **Fica para a produção:**
  - **B:** a enchente precisa passar por baixo do homem pendurado (aparece chão seco sob os pés); o contorno da barba ainda pode ser lido como rosto.
  - **C:** o "11" encosta na copa e o homem ocupa só ~8% do quadro.
- **Custo:** render em modo barato de 7–8 s por still na G4-2. O tempo maior foi de instalação de pacotes, que motivou a [imagem da stack](../../g4-imagem-stack.md).

## 5. Caminhos ruins desta rodada
- **Stack Frankenstein:** Quaternius cru + EZ-Tree + terreno por código, cada um com sua paleta, produz um resultado "sem identidade". Comece pelo kit harmonizado.
- **Água feita à mão antes do levantamento de prontos:** foi o elemento mais reprovado. O pacote de skills de three.js já tinha a receita.
- **`three-gpu-pathtracer@0.0.24` headless:**
  - 16 spp: ~8,5 s por quadro;
  - 48, 64 e 256 spp: trava;
  - 3 estágios em paralelo: trava, mesmo a 16 spp.

  A hipótese é perda de contexto WebGL num laço longo de amostragem. Se um dia voltar, acumule em chamadas curtas com `requestAnimationFrame`, um estágio por vez. Hoje está fora por decisão do Eduardo.
- **O construtor reporta correção que não está no arquivo final.** O construtor confere recortando os arquivos finais, e o revisor confere nos arquivos, nunca na descrição.
- **Item "protagonista fixo no centro" copiado do No Sleep:** serve para What If fictício, não para notícia real.
