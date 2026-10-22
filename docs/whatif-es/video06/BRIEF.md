# Brief comum — vídeo 6 do What If ES: "¿Qué pasaría si la Tierra girara cada vez más lento y no pudiera parar?"

Refazemos em espanhol, com cena 3D própria, "What If Earth Spun Slower and Couldn't Stop?" (What If Sim, 6:52 = 412 s).
Mesmo processo do vídeo 5 (as regras abaixo valem igual); o que muda neste vídeo:

- Projeto: `D:\whatif_es_spun_slower1`. Original e leitura: `D:\whatif_es_spun_slower
ef\` (q10 a 0,1 s, geral_*.jpg),
  **mapa de ações** `D:\whatif_es_spun_slower\mapa_acoes.md` / `.json`, painel `hud.json`, legendas `legendas_en_corrigidas.json`,
  **batedor** (libs e assets escolhidos para este vídeo) `D:\whatif_es_spun_sloweratedor.md` — leia antes de modelar.
- **Não há câmera POV fixa**: cada capítulo é um lugar; **cada mundo controla a própria câmera** (useThree/useFrame, determinística em t,
  reproduzindo os movimentos de câmera do mapa) e monta o próprio céu com `<CeuLugar t lugar>` de `src/mundo/ceu.tsx`.
- `src/roteiro.ts`: capítulos (tempos do ORIGINAL), mundo de cada um, fusões de 0,6 s, take inédito em 244,9 s, `camEm(chaves, t)`.
- `src/fisica.ts`: velocidade do equador (do painel do original), dia solar, sentido do Sol, `nivelMar(t, lat)` (a água foge do equador
  para os polos).
- Adaptação cultural: THE EQUATOR → EL ECUADOR; Cannon Beach/Oregon → **San Juan de Gaztelugatxe, España** (ilhota com ermida e escadaria);
  Nova York/Times Square → **Madrid, Gran Vía / Plaza del Callao** (telões); San Francisco/Golden Gate → **Ciudad de Panamá, Puente de las
  Américas** sobre a entrada do Canal; Santa Monica → **Acapulco, México** (baía, hotéis, palmeiras).

## Módulos prontos para reusar (em `src/mundo/`)
`vfx.tsx` (`Flipbook`: fogo/fumaça/explosão/nuvem em flipbook CC0), `pessoas.tsx` (`Multidao3D`: humanos Quaternius com rig e 43
animações), `arvores.tsx` (EZ-Tree com cache, vento, crescimento), `comum.tsx` (`rnd`, `smooth`, `clamp01`, `Mar`, `Nuvens`),
`ambiente.tsx` (HDRI, areia PBR `useAreiaPBR`), `look/Look.tsx` (névoa + god rays + bloom; perfil por mundo). Referência do céu físico
do vídeo 5 em `mundo/ceu_v5_referencia.tsx.txt`. Assets em `public/` (pessoas, vfx, hdri, tex). Libs e assets novos: ver `batedor.md`.

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
`bash teste/still.sh <sua_pasta> <segundo_do_VIDEO> ...` (segundos do vídeo final; antes de 244,9 é igual ao do original; depois some 30).
Gera `teste/<pasta>/tNNNN.NN.png` a 40% de escala, WebGL por software (lento: ~40–90 s por quadro; o bloom/HDR fica mais estourado
que na GPU). Há uma trava global de 3 renders simultâneos na máquina: peça poucos quadros por vez. Olhe as imagens (Read) e compare
com o original no mesmo segundo (`ref\q10`). `ESCALA=0.25` para testes rápidos.

## Relatório final (curto)
Arquivos criados, o que cada evento do mapa virou na tela (com o segundo), o que ficou faltando, pedidos ao orquestrador
(mudanças em arquivos que não são seus), licenças dos assets novos.
