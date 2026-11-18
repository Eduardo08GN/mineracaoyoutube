# K18 Königgrätz: briefing comum das frentes de cena

Vídeo 18 do **Kriegsmomente** (canal alemão): *"Warum verlor Österreich bei Königgrätz – obwohl es die bessere Artillerie hatte?"*. Narração alemã pronta, 16,7 min, 163 batidas em `src/plano.json`.

**O pedido do Eduardo:** nos vídeos anteriores, os mapas e os esquemas ficaram **"muito amadores e engessados"**, com cara de apresentação de PowerPoint. Agora é para caprichar. Ele também reclamou que o HUD, os marcadores e os textos estão **engessados** e pediu que fiquem mais dinâmicos e intuitivos.

## O produto
O produto é a **compreensão do espectador**, não a imagem bonita. O critério é "ajuda a entender?". Cada take cruza pelo menos 3 dimensões entre estas: dado, conceito, ilustração, espaço, tempo e narrativa.

**A animação explica, não ilustra:**
- torne visível o abstrato **no próprio objeto ou lugar**: o alcance vira um anel no chão, o tempo vira uma trilha, a perda vira uma hachura que esvazia o bloco;
- as dimensões ficam ligadas **no mesmo take**, nunca na sequência lugar → cartão → efeito;
- é proibido diorama parado.

**Movimento:**
- o mundo muda dentro do plano;
- nada fica parado mais de 4 s;
- a câmera está sempre em movimento, num dolly contínuo que segue a ação (nunca deriva decorativa);
- a meta é movimento ≥ 2,5 e ≤ 15 % de meios-segundos parados.

**Um gesto de tinta por frase, preso à palavra:**
- os tempos de cada palavra estão em `../voz/alinhamento.json`, por capítulo, com `ini` e `fim` relativos ao wav do capítulo;
- o início do capítulo no vídeo é `plano.kapitel[i].s`;
- o texto está em `../roteiro/skript_de.json`, e `beat.frases` dá os índices das frases do capítulo `beat.cap`.

**HUD vivo, não painel:**
- o rótulo se escreve na fala;
- o número voa ou conta até o lugar;
- a linha-guia vai até o objeto;
- tudo some quando a fala passa.

**Anti-poluição:**
- no máximo 3 elementos em tinta cheia por tela; o resto fica a lápis (`COR.lapis`), apagado pela cor;
- por tela: no máximo 1 rota principal, 2 reações e 2 placas de unidade.

## Design system (obrigatório): CREME, o take do telégrafo do K15
- **Fundo:** papel antigo.
- **Texto:** serifa itálica de época (IM Fell English Italic) que **se escreve** na tela.
- **Linha-guia:** fina, terminada em ponto sobre o objeto.
- **Gráficos:** traçados a tinta marrom-escura.
- **Acento:** UM só, laranja (`COR.acento`), para a peça que trabalha ou o número-chave.
- **Unidades:** no estilo Brockhaus 1866, retângulo cheio pequeno: **azul = Preußen, vermelho = Österreich, verde-escuro = Sachsen**, com número ou nome em itálico.
- **Perdas:** hachura que esvazia o bloco, nunca estilhaço.
- **Proibido:** tema escuro, vinheta pesada, glow neon, Inter/sans, balão de quadrinho, crédito ou licença na imagem.

## Contrato técnico
- **A cena:** `src/cenas/<familia>.tsx` exporta `Cena: React.FC<CenaProps>` (`src/cenas/tipos.ts`).
  - Os módulos auxiliares ficam em `src/cenas/<familia>/`.
  - A cena desenha o quadro INTEIRO (fundo incluso).
  - É **função pura de (beat, t, u)**: `t` em segundos do vídeo, `u` de 0 a 1 na batida.
  - Proibidos: `Math.random` (use hash com semente), `Date.now`, animação por `useEffect`/`requestAnimationFrame`, estado que dependa de quadros anteriores. O render roda em 48 Chromes, cada um com um trecho.
- **Dados:** `src/dados.ts` → `DADOS` (DEM float16 do terreno nu DMR 5G, sombra, declive, plano de 1866 encaixado, OSM, unidades, lugares, linha do tempo, Boêmia).
  - A projeção é `xy(meta, lon, lat)` → `[x leste, z sul]` em unidades de 100 m.
  - `meta.z` é a faixa de altitude real em metros.
  - A cena roda dentro de `<Pronto>`, então `DADOS` já existe (guarde mesmo assim).
- **Relógio:** `src/relogio.ts` (`horaDe(beat, u)` → minutos de 3/7).
- **Tinta (SVG por cima):** `src/tinta/index.tsx` traz `COR`, `FONTE`, `Folha`, `Papel`, `Escrita`, `Guia`, `Traco`, `Rotulo`, `Numero`, `Bloco`, `prog` e `saida`.
  - As assinaturas são fixas. A frente "tinta" está trocando as implementações (tegaki e perfect-freehand), sem mudar as props.
  - Para seguir um objeto 3D, use `src/tinta/projecao.ts` (`projeta(pose, [x, y, z])`) com a MESMA pose de câmera da cena.
- **3D:** `ThreeCanvas` de `@remotion/three` (three 0.180, R3F 9, drei 10.7.9; troika 0.52.5, que NÃO deve ser atualizado). Para seguir a cena 3D, a câmera é calculada como função pura de t.
- **HUD global (frente tinta, em `Video.tsx`):** relógio e painel no canto superior esquerdo (x 60–760, y 50–330), nome do lugar no canto superior direito, legenda embaixo (y > 900) e a marca `@Kriegsmomente`. **As cenas não desenham relógio nem legenda** e deixam essas zonas livres de informação importante.
- **Desempenho:** menos de ~1,5 s por quadro a 1080p. A geometria é construída uma vez (`useMemo` ou cache de módulo), nunca refeita por quadro sem necessidade.
- **Bibliotecas já instaladas na stack** (não instale nada sem necessidade; se precisar, avise nas NOTAS): perfect-freehand 1.2.3, roughjs 4.6.6 (sempre com `seed`), @orbat-mapper/control-measures 0.42.0 (`split-arrow` / `flow-arrow`), flubber, @turf/turf 7.2.0, tegaki 1.1.0, polylabel, milsymbol.
- **Levantamento de prontos já feito:** `../LEVANTAMENTO_PRONTOS.md`. Use as escolhas de lá antes de construir à mão.
- **Código reaproveitável** (copie para a sua pasta e adapte; não importe de fora do projeto):
  - K17 v2: `D:/kriegschronik/k17_v2/v1/src/kit/` (`acabamento/`: soldados, tropa, fumaça, árvores, céu, chão; `desenhados/`: canhão de bronze, Krupp, telégrafo, casa, locomotiva, soldado; `epoca/`) e `karten/`;
  - K09: `D:/kriegschronik/tracer3d_09_koeniggraetz/` (Heer e Tropa com barretinas de 1866, frente com dentes);
  - K08: `D:/kriegschronik/tracer3d_08_gewehr/` (modelo e mecanismo do fuzil Dreyse);
  - What If ES 08: `D:/whatif_es/08_mar_latam/v1/src/` (padrão de terreno float16 e HUD dinâmico).

## Limites de cada frente
- **Edite só** `src/cenas/<sua_familia>.tsx` e `src/cenas/<sua_familia>/`, além de `NOTAS_<familia>.md` na raiz do v1.
- **Somente leitura:** `plano.json`, `dados.ts`, `tinta/`, `tipos.ts` e os arquivos das outras frentes. Se uma batida precisar de outro parâmetro, escreva o pedido nas NOTAS.
- **Verificação:**
  - `npx tsc --noEmit -p .` (no v1) precisa passar;
  - stills de depuração locais, poucos e em escala 0,5, na SUA porta: `npx remotion still src/index.tsx Teste D:/tmp/k18_<familia>/<nome>.jpg --props="{\"beat\":\"b005\",\"u\":0.5}" --scale=0.5 --port=<porta> --gl=angle`;
  - o primeiro still depois de um bundle novo pode estourar o tempo carregando os 90 MB de dados: rode de novo ou acrescente `--timeout=240000`;
  - olhe as imagens com a ferramenta Read e corrija;
  - **nada no C:** (`TEMP=D:/tmp`).
- **Na entrega**, as NOTAS trazem: o que foi feito, as batidas cobertas, os problemas conhecidos e **as 3 melhores (beat, u) para o still de vitrine**. O render final e os stills para o Eduardo saem na G4, pelo maestro.
