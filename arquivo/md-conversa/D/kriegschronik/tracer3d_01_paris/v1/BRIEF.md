# BRIEF — KriegsChronik / Tracer3D · vídeo 1 · „Das Paris-Geschütz"

Explicador narrado em alemão (16:53, 1920×1080, 30 fps) para o canal alemão KriegsChronik: uma voz calma o tempo todo, números
calculados em código na tela, cenas 3D com dados reais, mapas de dados, cartões „DIE MATHEMATIK". Referência de estilo: canal
Tracer Project (globo, terreno real com névoa, arco de trajetória, cartões técnicos sóbrios). Queremos SUPERAR: dados reais como
herói, atmosfera física, câmera sempre em movimento, nada parado mais de 4 s, algo muda na tela a cada ≤ 8 s.

## Onde está tudo
- Projeto Remotion: `D:\kriegschronik\tracer3d_01_paris\v1` (stack travada: Remotion 4.0.537, three 0.180, R3F 9.8.2, drei,
  postprocessing, n8ao, `@takram/three-atmosphere` 0.19.1, `@takram/three-geospatial` 0.9.1, `katex` 0.19.0, `@remotion/paths`,
  `@remotion/layout-utils`, `d3-geo` 3.1.1). NÃO instale nada; se faltar algo, diga no relatório.
- Plano: `src/plano.json` (gerado; não edite). Cada **batida** tem `id` (ex. `06_03`), `kap`, `s`/`e` (segundos do vídeo), `dono`,
  `bild` (descrição em português do que deve aparecer — siga-a, mas as durações reais estão em `s`/`e`, não nos segundos citados).
- Roteiro e narração: `..\roteiro\skript_de.json` (texto falado por capítulo), `..\roteiro\fakten.md` (fatos/fontes),
  palavras com tempo em `plano.json → woerter[kap]`. Para sincronizar algo com uma palavra: `wortLokal(beat, 'Granate')` (tempo
  local na batida) de `src/tempo.ts`. Use isso para que números e rótulos apareçam quando o narrador os diz.
- Física: `public/bahn.json` (trajetórias a cada 0,5 s: `basis_52`, `vakuum_52`, `ussa76_45`, `meeresniveau_52`, `meeresniveau_opt`,
  `ohne_erddrehung_52`, `naiv_ohne_korrektur`, `flache_erde_52`), `public/zahlen.json` (todos os números de manchete), helpers em
  `src/daten.ts` (`bahn(fall, ts)`, `Z`, `ORTE`, `enu()`, `de()` para formato alemão). `..\fisica\formeln.md` = fórmulas KaTeX.
  **Todo número na tela vem de zahlen.json/bahn.json** (nunca invente).
- Dados reais: `public/geo/` + `public/geo/manifest.json` (como ler cada arquivo: limites, projeção, decodificação da altura) e
  `public/geo/CREDITOS.md`. Terreno região/Crépy/Paris (altura 16 bits + cópia RG 8 bits `valor = R·256 + G`, cor JPG), Blue Marble
  global e Europa, `impactos_paris.geojson` (183 impactos reais de 1918), `front_1918.geojson`, `orte.geojson`, prédios/ruas/Sena de
  Paris (metros a leste/norte de Notre-Dame), `grenzen.geojson`, `fluesse.geojson`, `fotos/` (5 fotos CC0 de 1918 + `fotos.json`).
- Relatório do batedor (armadilhas da atmosfera Takram e do KaTeX): `..\BATEDOR_paris.md` — LEIA a parte que te toca.
- Identidade visual: `src/ui/basis.tsx` (cores `C`, fontes `F`, `Chip`, `Etikett`, `Hud`, `Titel`, `fase`, `sichtbar`, `zaehle`).
  Use sempre. Não edite (peça no relatório); crie seus componentes nos seus arquivos.
- Compositor de pós (névoa, god rays, bloom, AgX, vinheta): `src/look/Look.tsx` (do Eddie3D; leia o cabeçalho e o tipo `Perfil`).

## Contrato da batida
Cada dono implementa as batidas em que `dono` é ele, em `src/beats/<DONO>.tsx`, exportando um mapa `{ '06_03': Componente }`.
O componente recebe `{t, d, s, id, kap}` (t = segundos desde o início da batida; d = duração) e desenha a TELA INTEIRA (fundo
incluso). O sequenciador (`src/Video.tsx`) faz fusão de 0,4 s entre batidas (a anterior continua a ser desenhada até t = d + 0,4).
Batida ainda não feita aparece como cartão provisório com a descrição.

## Regras
1. **Determinismo**: tudo é função de `t` (ou do quadro). Nada de `useFrame` acumulando estado, `Date.now`, `Math.random` sem semente,
   física que dependa do quadro anterior, animação por relógio (por isso three-globe/r3f-globe estão fora). Texturas/JSON grandes:
   `staticFile()` + carregamento com `delayRender/continueRender` (ou `useLoader` com Suspense) — o quadro só pode sair com tudo carregado.
2. **Câmera viva**: em 3D a câmera sempre se move (devagar), e algo muda a cada ≤ 8 s. Sem tela parada > 4 s.
3. **Tom**: engenharia sim, glorificação não. Sem sangue, sem corpos, sem pessoas sofrendo, sem bandeiras, insígnias, símbolos
   militares ou da 2ª Guerra. Impactos em Paris = marcador geométrico (círculo que se expande, clarão + poeira à distância), nunca
   destruição explícita. Saint-Gervais: sóbrio e respeitoso.
4. **Texto na tela em alemão**, números no formato alemão (`de(41.6,1)` → „41,6"), unidades corretas, fontes de `basis.tsx`.
   Pouco texto por vez (é vídeo, não slide). Fórmulas em KaTeX (ver BATEDOR para revelação termo a termo).
5. **Seus arquivos apenas**: `src/beats/<DONO>.tsx` e uma pasta sua `src/<pasta do dono>/` (G → `welt/g_*`, T → `welt/t_*`,
   P → `welt/p_*`, K → `karten/`, U1 → `ui/u1_*`, U2 → `ui/u2_*`). Pode LER/importar módulos de outros donos se já existirem
   (ex.: G pode usar o terreno `welt/t_gelaende.tsx` do T quando ele existir), mas não edite arquivos alheios, `Video.tsx`,
   `tempo.ts`, `plano.json`, `index.tsx`, `basis.tsx`, `Look.tsx`.
6. **Licenças**: só os dados de `public/geo` e o que já está na stack. Nada de imagem/modelo/textura baixado da internet sem
   licença comercial clara (CC0/CC-BY/domínio público) — se baixar (ex.: textura PBR CC0 da ambientCG/Poly Haven), guarde em
   `public/<dono>/` e registre em `public/<dono>/CREDITOS.md`.
7. **Desempenho**: o render final é na GPU do Colab (Chrome com `--gl=angle-egl`), um Chrome por bloco de quadros. Mire em ≤ 1,5 s
   por quadro lá; evite geometrias de milhões de triângulos sem necessidade (Paris: instancie/mescle prédios; terreno: malha ≤ 1024²
   com o detalhe na textura/normal map).
8. **Nada no C:**: `TEMP=D:/tmp`. Os stills locais já fazem isso.

## Testar (stills locais, WebGL por software — lento, use poucos)
`bash teste/still.sh <pasta> <segundo_do_video> [...]` (dentro de `v1`; segundos ABSOLUTOS do vídeo = `s` da batida + t). Saída em
`teste/<pasta>/t<seg>.png` (escala 0,4; `ESCALA=1 bash ...` para checar detalhe). Há uma trava global de 3 renders simultâneos na
máquina (outros agentes também testam): o script espera a vez. Se o Chrome não conectar dentro do sandbox do Bash, rode o comando
com o sandbox desligado. Olhe TODO still que gerar (Read no PNG) e corrija o que estiver feio, vazio, preto, cortado ou ilegível.
`npx tsc --noEmit -p .` para checar tipos (erros só nos seus arquivos importam).

## Entrega
Responda com: batidas feitas (ids), as que ficaram fracas e por quê, caminhos dos stills de prova (pelo menos 1 por batida), módulos
criados (com a API, para os outros donos), e qualquer pedido de mudança em arquivos compartilhados.
