# Batedor 07: malecón do Equador com os pacotes do Fab (What If ES narrado, molde What If Sim)

Este batedor prova, em 14 s, o formato novo do canal **¿Qué Pasaría Si? 3D**, rodando na pipeline **Eddie3D** (Remotion 4, three 0.180, R3F 9, drei).
- **O que está na tela:**
  - um malecón tropical hispânico (Salinas, Equador) montado com os pacotes do Fab;
  - uma multidão viva;
  - o mar subindo.
- **O que dirige tudo:** um único parâmetro `p`.
- **HUD moderno:**
  - número que manda com dígitos que rolam;
  - grandezas derivadas ao vivo;
  - comparação dourada que troca girando;
  - rótulos presos aos objetos 3D;
  - frase cinética palavra a palavra.

Referência de dinamismo: `docs/referencias/whatifsim-24fps.md` e as folhas `D:/tmp/ref_cql/folha_1..4.jpg`.

## Como rodar

**No PC: só stills de depuração**, pela trava de 3 renders da máquina. É WebGL por software, então o look sai mais estourado que na GPU.

```bash
cd D:/whatif_es/07_batedor_fab
npx tsc --noEmit -p .                       # tem de passar limpo
bash teste/still.sh s1 2.5 7.5 12.5         # segundos do vídeo → teste/s1/tNNNN.NN.png (escala 0,4; ESCALA=0.25 para depurar)
# opções: EXTRA='--props={"p":0.8,"plano":"C"}'  força o mundo e o plano
#         EXTRA='--props={"hud":"0","dbg":"semNevoa,semBloom,semRaios,semNuvem"}'  isola camadas
#         SUF=_x  sufixo no nome do png
```

Os temporários ficam em `D:/tmp`. O `node_modules` é uma junção para `D:/whatif_es/stack/node_modules`, a stack travada, sem dependência nova.

**Na G4: o render bom (stills e clipe).** Antes, ligue a G4 com `python g4.py ligar` e confira que não há job de outra sessão rodando.

```bash
cd D:/whatif_es
bash 07_batedor_fab/g4/stills_g4.sh b1 45 135 195 270 345 405    # empacota (g4/empacotar.py), sobe pelo painel, preparar.sh + stills.sh
bash 07_batedor_fab/g4/clipe_g4.sh                               # 420 quadros por render_seq.sh (P=12) + régua ler24.py
python g4.py desligar                                            # e conferir que desligou
```

- **Saída:** `g4/saida/`, com os PNGs, a folha `st_b1.jpg`, `RENDER_MUDO_NAO_PUBLICAR_batedor07.mp4` e `leitura24.txt`.
- **Meta da régua:** movimento ≥ 2 e no máximo 25% de quadros parados.
- **Tamanho do pacote:** cerca de 90 MB. Sobe em pedaços de 45 MB.

## O parâmetro `p` (0 → 1): `src/fisica.ts`

A regra é `p = t / 14 s`. A prop `p` força outro valor. Cada coisa do mundo e do HUD é **função pura** de `(tw, p)`: nada acumula entre quadros, e qualquer quadro sai igual em qualquer aba.

| Grandeza | Função | Hoje (p = 0) | Fim (p = 1) |
|---|---|---|---|
| duração do dia | `diaH(p)`, geométrica | 24 h | 1 h 36 min |
| gravidade efetiva / peso | `gEf`, `pesoKg` (g₀ = 9,814; ω²R) | 82 kg | 23 kg (ingravidez em 1 h 24 min) |
| velocidade do chão | `velChaoKmh` | 1.670 km/h | 24.900 km/h |
| comparação dourada | `COMPARACOES` (sonido 1.235, Concorde 2.180, bala 3.000, avión 3.540, cohete 11.000, estación 20.000+) | "más rápido que el sonido" | "casi como la estación espacial" |
| nível do mar | `nivelMar(p)`: 0,04 → 1,79 m | praia seca | malecón e avenida alagados |
| linha d'água | `linhaAgua(p)`: rampa da praia → muro → cidade | z = −30 | toda a orla |
| chegada da água num ponto | `pChegada(z)` (bisseção) | — | dispara a fuga, a queda, o boiar e a deriva |
| hora do Sol | `anguloHorario(p)`: (24/dia)², quase parado no início e ~1 volta nos últimos 30% | 15h | tarde → pôr do sol (B) → noite → nascer → manhã (C) |

`src/mundo/dados.ts` define o que cada coisa faz com isso, também como função pura:

- **Gente (81 bonecos Quaternius com rig):**
  - 38 passeiam no malecón;
  - 30 estão na praia, sentados, de pé ou conversando;
  - 9 nadam;
  - 3 pulam perto da fonte; o pulo de 3 m/s sobe 0,46 m hoje e cerca de 2 m no fim;
  - 1 é o "TÚ".
  - Cada um **reage** um pouco antes de a água chegar onde está, levanta e corre para dentro.
  - 30 a 40% **caem** quando a água os alcança (`Death01`) e **são arrastados** pela corrente, boiando.
- **Fonte:** a fase de cada gota vem da **gravidade integrada**. O jato sobe de 2,9 m para 12 m sem saltar entre quadros.
- **Guarda-sóis (45, instanciados, cor por instância):** boiam e giram quando a água chega e **voam** girando quando o peso cai (p > 0,74).
- **Bolas:** quicam mais alto conforme o g cai.
- **Pranchas:** deitam e vão com a corrente.
- **Veleiro:** balança e é trazido para a costa.
- **Carros (20, 4 faixas, paleta por carro):** freiam em p ≈ 0,5 e boiam à deriva em p ≈ 0,66.
- **Palmeiras:** o vento sobe de 1 para 3,2.
- **Nuvens:** a deriva acelera.
- **Postes:** acendem à noite.

## Os 3 enquadramentos (`src/roteiro.ts`)

Os três têm dolly lento contínuo e começam e terminam em movimento.

| Plano | Tempo | p | Câmera | O que mostra |
|---|---|---|---|---|
| **A: aérea** | 0 a 5 s | 0 a 0,36 | 30 m de altura sobre o mar, olhando a cidade, travelling para a direita | o mar embaixo, a praia com 45 guarda-sóis, o malecón com a fonte, a avenida com carros e os prédios e o skyline do Small Town em cima; luz do fim da tarde de frente |
| **B: rente ao calçadão** | 5 a 10 s | 0,36 a 0,71 | olhos a 2,4 m, olhando ao longo do malecón (+x) | o mar passando o muro, a multidão fugindo pelo quadro, a fonte, os quiosques e os prédios à direita; pôr do sol |
| **C: close na fonte e nos guarda-sóis** | 10 a 14 s | 0,71 a 1 | 3,3 m, junto da fonte, olhando o mar (oeste), push-in | o jato alto, os guarda-sóis voando, os bonecos boiando, dia e noite girando no céu, god rays |

## HUD (`src/hud/Hud.tsx`, montado em `src/Video.tsx`)

Tudo é função do quadro: sem relógio do navegador, sem estado.

- **`<Painel p pAnt tVideo>`, no alto à esquerda:**
  - "UN DÍA DURA" e **odômetro em base mista** (`OdoDuracao`: minutos de 0 a 59 e horas). O dígito fica parado e rola no último quarto de cada unidade. Dígito rápido encaixa e ganha um rastro de movimento.
  - A dezena da hora some suavemente abaixo de 10 h.
  - **Barra de dado** em escala log: "HOY · 24 h" → "NADA PESA · 1 h 24 min", com o marcador dourado andando.
  - **PESAS** em kg e **EL SUELO SE MUEVE A** em km/h, em odômetros com milhar es-ES (1.670).
  - **Comparação dourada** (`Comparacao`): pílula que gira (flip swap) no instante exato em que a velocidade cruza o limiar, com um brilho varrendo.
- **`<Lugar>`, no alto à direita:** "SALINAS, ECUADOR · MALECÓN · LATITUD 2° S".
- **`<RotulosPresos plano u tPlano lista>`:** a âncora 3D é projetada com **a mesma câmera do quadro** e desenha o ponto dourado, o anel, a linha-guia e a etiqueta de vidro.
  - A etiqueta troca de lado para não cobrir o painel, o lugar ou a frase (`ZONAS`).
  - Âncoras por plano em `Video.tsx/ancoras()`:
    - A: nível do mar e jato da fonte;
    - B: "TÚ" com o peso e água sobre o malecón;
    - C: jato da fonte e "TÚ PESAS".
- **`<FraseCinetica tVideo>`:** palavra a palavra em Instrument Serif itálica. Cada palavra sobe da máscara com desfoque em 0,3 s, com stagger de 75 ms; as palavras-herói ficam em dourado; a saída leva 0,2 s.
  - Frases em `roteiro.ts/FRASES`, em espanhol, com causa e efeito curtos.
  - A frase da tela é a versão curta da fala.
- **Fontes OFL em `public/fontes`:** Inter Tight (dígitos tabulares) e Instrument Serif Italic. São carregadas com `delayRender`, sem Google Fonts em tempo de render.
- **Props úteis:**
  - `hud: "0"` desliga o HUD;
  - `p` e `plano` forçam o estado.

## Pacotes do Fab (`D:/whatif_es/assets/fab/`)

- **`catalogo.json`:** 199 itens. Cada um traz arquivo, nós com bbox em metros, triângulos, texturas antes e depois, animações, autor, licença e uid.
- **`folha_contato_fab.jpg`:** as miniaturas do Fab com os nomes.
- **`folha_pecas_flat_vehicles.jpg`:** cada carro e prédio renderizado.
- **`CREDITOS.md`:** licenças, linha pronta para a descrição e o método de conversão (Blender FBX → GLB, gltf-transform com meshopt).
- **No batedor (`public/fab/`):** Small Town, Large Low Poly Building, 13 carros e 7 prédios do Flat Style, quiosque, poste, banco do Modern Street Props, guarda-sol, bola, pranchas e veleiro.
- **Ficaram no catálogo, sem uso aqui:** peixe, Low Poly Nature, Voxel Beach.

## O que está fraco (honesto)

1. **Mar.** É o `Mar` da biblioteca: plano com faixas de espuma, cáusticas e cor por profundidade.
   - Sobe e invade bem, mas não tem arrebentação nem areia molhada.
   - Sobre o malecón alagado fica manchado.
   - **O Ultra-Water NÃO foi portado neste batedor.** No commit pré-02/11 (`ce9248f`, de 28/10) ele exige um pipeline de render próprio:
     - opaco num RT com MSAA e textura de profundidade;
     - cubemap do céu dele;
     - `sampler2DShadow` do sol;
     - reflexo planar;
     - espuma com estado, que pede aquecimento por quadro;
     - mapa de costa assado de um heightfield, que teria de ser reassado conforme o nível sobe.
   - Isso não cabe no `Look.tsx` sem reescrever o `RenderPass`. É um batedor separado de 3 a 4 h; o plano de porte está na seção seguinte.
2. **God rays.** Só no plano C, com o Sol na tela. Com o Sol atrás da câmera, o `GodRaysEffect` desenhava um disco branco no meio do quadro.
   - O `three-good-godrays` 0.12.1, que resolve isso, **não entrou**. Ele é dependência nova da stack travada; precisa do OK e de um still de teste.
3. **Multidão.** São 81 bonecos com malha e esqueleto cada (`Multidao3D`). Para centenas, o caminho é o `@three.ez/instanced-mesh` 0.3.16 com skinning e LOD, que não entrou (dependência nova).
4. **Céu.**
   - Hoje: céu analítico da biblioteca, com estrelas, mais `<Clouds>` do drei (seed fixa, `speed=0`, deriva por t).
   - A cor de dia e noite está boa, mas não é física: o `@takram/three-atmosphere` não entrou.
   - Correção feita: as nuvens nasciam no chão no still porque a `matrixWorld` ainda era a identidade (`AtualizaMatrizes`, `useFrame` com prioridade −1).
5. **Proporção dos pacotes.**
   - Os prédios e carros do Flat Style são "brinquedo": os carros têm 2,4 m de altura.
   - Ao lado do Small Town, o malecón mistura dois estilos.
   - O Modern Street Props convertido pelo Fab só trouxe o banco.
   - As janelas não acendem à noite.
6. **Rótulos.** Ao trocar de lado para fugir do painel, a etiqueta pula de uma vez, sem histerese.
7. **Stills locais.** São SwiftShader: o bloom, o HDR e a névoa só valem na G4.
8. **Dinamismo.** Ainda não foi medido. Precisa do clipe da G4 e do `ler24.py`.

## Mudanças em arquivos da biblioteca (para o orquestrador levar a `eddie3d/biblioteca`)

- **`src/look/Look.tsx`:** a cor da névoa, a força do bloom e o brilho saíram da chave do compositor e viraram uniformes atualizados no `useFrame`.
  - Antes, no dia acelerado, a cor da névoa mudava a cada quadro e recriava a cadeia inteira (recompila e pisca).
  - Na biblioteca, vale para todo vídeo com pôr do sol.
- **Os demais módulos da biblioteca** (`comum`, `pessoas`, `palmeiras`, `ambiente`, `vfx`) foram copiados sem mudança.
- **Novos e reaproveitáveis:**
  - `mundo/fab.tsx`: carregar e clonar GLB do Fab, geometria quantizada → float para instanciar, troca de paleta;
  - `mundo/fonte.tsx`: a fonte com gravidade variável;
  - `hud/Hud.tsx`: odômetro em base mista, rótulo preso, frase cinética, comparação.

## Porte do Ultra-Water (próximo batedor, se o Eduardo quiser)

1. Fixar o commit `ce9248f` (28/10, MIT; o repositório inteiro tem menos de 2 semanas). Copiar `src/water/*`, `src/engine/{PostFX,PlanarReflection,fullscreen}.js` e `src/scene/{sky,atmosphere}.js` para `biblioteca/src/mundo/oceano/`.
2. Trocar no `Look.tsx` o `RenderPass` por um passe "opaco → RT com depthTexture → água" que preencha `uSceneColor`/`uSceneDepth`. A névoa, o bloom e a LUT continuam depois.
3. Assar o `shoreMap` com `alturaPraia(z)` deste batedor e, em vez de reassar quando o nível sobe, deslocar a cota da água (`uniform`).
4. Fazer a espuma determinística: refazer N passos fixos (`dt` = 1/60) antes de cada quadro, a partir de um estado zerado em `t − 6 s`.
5. Prova de determinismo: MD5 do quadro 300 renderizado direto e vindo do quadro 0.

## Quadros para renderizar na G4

**6 stills + 1 clipe** (30 fps):

| Quadro | s | p | Plano | O que conferir |
|---|---|---|---|---|
| 45 | 1,5 | 0,11 | A | entrada do HUD, "MÁS RÁPIDO QUE EL SONIDO", cidade e praia com luz quente de frente, multidão andando |
| 135 | 4,5 | 0,32 | A | rótulos "NIVEL DEL MAR +0,18 m" e "EL CHORRO 3,0 m", a água começando a subir a praia |
| 195 | 6,5 | 0,46 | B | a água chegando ao muro, a fuga começando, a comparação girando ("bala de fusil" → "cualquier avión") |
| 270 | 9,0 | 0,64 | B | malecón alagado no pôr do sol, gente caída e arrastada, carros freando, "TÚ 7x kg" |
| 345 | 11,5 | 0,82 | C | a noite, os postes acesos, o jato alto, os guarda-sóis decolando, as estrelas |
| 405 | 13,5 | 0,96 | C | o dia de volta, os guarda-sóis voando, "1 h 4x min", "CASI COMO LA ESTACIÓN ESPACIAL", god rays |
| 0 a 419 | 0 a 14 | 0 a 1 | A, B, C | clipe de 14 s (`clipe_g4.sh`) e régua: movimento ≥ 2, parados ≤ 25% |

**Stills locais já feitos (SwiftShader, escala 0,4):** `teste/s2` a `s7` e a folha `teste/folha_batedor_local.jpg`.
