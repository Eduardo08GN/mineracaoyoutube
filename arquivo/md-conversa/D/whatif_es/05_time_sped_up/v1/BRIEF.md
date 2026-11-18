# Brief comum — vídeo 5 do What If ES: "¿Qué pasaría si el tiempo se acelerara y no pudiera parar?"

Refazemos em espanhol, com cena 3D própria, o vídeo "What If Time Sped Up and Couldn't Stop?" (Minute Zero, 8:57).
Entrega é amanhã de manhã: trabalhe rápido, entregue algo **completo e bonito** no seu escopo antes de polir detalhes.

## Onde está tudo
- Projeto: `D:\whatif_es\05_time_sped_up\v1` (Remotion 4 + React Three Fiber 9 + three 0.180 + postprocessing). `node_modules` é junction
  para `D:\whatif_es\stack\node_modules` (não instale nada sem necessidade; se precisar, `npm install --save-exact` em `D:\whatif_es\stack`
  e copie `package.json`/`package-lock.json` de lá para `v1`, e diga no relatório).
- **Mapa de ações do original** (o que acontece em cada segundo — siga à risca, ±0,5 s): `D:\whatif_es\05_time_sped_up\mapa_acoes.md`
  (resumo legível) e `mapa_acoes.json` (619 eventos `{t0,t1,tipo,quem,acao,onde,nota}`).
- Quadros do original a 10 fps: `D:\whatif_es\05_time_sped_up\ref\q10\` (arquivo `NNNNN.jpg`, quadro N = segundo N/10 — confira o nome
  real com `ls | head`); folhas `ref\geral_*.jpg`. **Olhe os quadros do seu trecho antes de modelar.**
- Legendas originais: `legendas_en_corrigidas.json`.
- Tempo: todo `t` que seu componente recebe é o **segundo do ORIGINAL** (0–537,2). O take inédito de 30 s entra em 386,5 s, mas isso é
  resolvido fora do seu componente (`tOrig` em `src/roteiro.ts`).
- `src/roteiro.ts`: capítulos, **câmera POV** (você está parado de pé na calçada; a câmera só gira e muda de altura), `poseCamera(t)`,
  `alturaOlho(t)`, `relCam(t, dx, dy, dist)` (ponto preso ao quadro). Sistema do mundo: olho em (0, 1,7, 0); guinada 0 olha para **-z**
  (oeste: o Sol se põe à frente, atrás do skyline); **+x = direita/norte** (a rua e as casas do outro lado); **-x = esquerda/sul**
  (banco, gramado, a cidade ao fundo à esquerda). Leste (nascer do Sol) = +z (atrás de você).
- `src/tempo.ts`: relógio da história (`logDecorrido`, `anos`, `horaDoDia`, `diaDoAno`, `logTaxa`). Use para o Sol, as estações, a cidade.
- `src/Cena.tsx`: monta os mundos por trecho (não edite; se precisar de mudança, peça no relatório). Contrato de cada módulo em `src/mundo/`:
  `export const X: React.FC<{t: number}>` + `export const perfilX(t): Perfil` (perfil do look: bloom, limiar, saturacao, contraste,
  vinheta, **nevoa {cor, densidade, max}** e **raios** — névoa de perspectiva aérea e god rays são padrão em cena externa com Sol).
- Módulos prontos para reusar: `mundo/vfx.tsx` (`Flipbook`: fogo/fumaça/explosão em flipbook CC0 da Unity), `mundo/pessoas.tsx`
  (`Multidao3D`: humanos Quaternius com rig e 43 animações; arquivos em `public/pessoas`), `mundo/comum.tsx` (`rnd`, `smooth`, `clamp01`,
  `Mar`, `Nuvens`, texturas), `mundo/ambiente.tsx` (HDRI, areia PBR), `look/Look.tsx`.
- **Árvores**: `@dgreenheck/ez-tree` 1.1.0 (MIT, já instalado): `import {Tree, TreePreset} from '@dgreenheck/ez-tree'`;
  `const tr = new Tree(); tr.options.seed = N; tr.loadPreset('Oak Medium'); tr.generate();` (presets Ash/Aspen/Oak/Pine Small/Medium/Large).
  É um `THREE.Group`; folhas com `tint`. O vento é `tr.update(tempo)` — chame com o **tempo do quadro**, nunca relógio real.
  Gere uma vez (useMemo) e clone; NUNCA gere por quadro. O agente da Rua escreve o wrapper `mundo/arvores.tsx` (estações, crescimento,
  neve) — os outros usam esse wrapper quando existir.

## Regras inegociáveis
1. **Determinismo**: tudo é função de `t`. Nada de `Math.random()`, `Date.now()`, `performance.now()`, `useFrame((s, delta) => …)` com
   acumulação. Aleatório só com `rnd(i)` (semente). Hooks sempre no topo (nunca `useMemo` dentro de `if` ou depois de `return`).
2. **Ação em cena** (regra do canal): tudo que o mapa de ações lista no seu trecho acontece no mesmo segundo, visível e em destaque.
   Nunca mais de ~4 s sem algo novo na tela. A legenda descreve o que **se vê** naquele momento.
3. **Qualidade acima do original**: o original é low-poly simples. O dono do canal reprovou nossos vídeos anteriores por textura, nuvem,
   água, árvore e fogo "amadores". Use iluminação boa, materiais PBR (texturas CC0 de Poly Haven/ambientCG baixadas por URL pública se
   precisar; guarde em `public/` e anote a licença em `public/LICENCAS.txt`), névoa de distância, god rays, bloom moderado.
4. **Só assets com licença comercial** (CC0, MIT, CC-BY com crédito anotado). Nada NC.
5. **Nada no C:** (disco cheio). Temporários, downloads e caches em `D:`. Se for usar o TEMP do sistema, aponte `TEMP`/`TMP` para `D:\tmp`.
6. **Não edite arquivos de outro dono.** Os seus estão listados no seu pedido. Mudanças em `Cena.tsx`, `roteiro.ts`, `tempo.ts`,
   `Look.tsx` → descreva no relatório final (o orquestrador aplica).
7. Mantenha seus arquivos **sempre compilando** (outros agentes renderizam o projeto inteiro ao mesmo tempo): escreva o arquivo inteiro
   de uma vez, rode `npx tsc --noEmit -p .` (no diretório `v1`) e corrija só os erros dos seus arquivos.
8. Desempenho: o render final é numa GPU L4 (rápida), mas cada quadro precisa sair em < ~1,5 s. Instancie (InstancedMesh) o que for
   repetido; texturas ≤ 2k.

## Teste
`bash teste/still.sh <sua_pasta> <segundo_do_VIDEO> ...` (segundos do vídeo final; antes de 386,5 é igual ao do original; depois some 30).
Gera `teste/<pasta>/tNNNN.NN.png` a 40% de escala, WebGL por software (lento: ~40–90 s por quadro; o bloom/HDR fica mais estourado
que na GPU). Há uma trava global de 3 renders simultâneos na máquina: peça poucos quadros por vez. Olhe as imagens (Read) e compare
com o original no mesmo segundo (`ref\q10`). `ESCALA=0.25` para testes rápidos.

## Relatório final (curto)
Arquivos criados, o que cada evento do mapa virou na tela (com o segundo), o que ficou faltando, pedidos ao orquestrador
(mudanças em arquivos que não são seus), licenças dos assets novos.
