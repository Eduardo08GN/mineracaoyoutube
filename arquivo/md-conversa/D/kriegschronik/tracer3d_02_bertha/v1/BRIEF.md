# BRIEF — KriegsChronik / Tracer3D · vídeo 2 · „Die Dicke Bertha"

Mesmo formato, regras e contrato do vídeo 1. **Leia primeiro o BRIEF do vídeo 1**
(`D:\kriegschronik\tracer3d_01_paris\v1\BRIEF.md`): contrato da batida, determinismo, câmera viva, tom, licenças, desempenho,
nada no C:. Aqui só o que muda. Mapa geral da esteira: `D:\mineracaoyoutube\tracer3d\PIPELINE.md`.

## O vídeo
O morteiro Krupp de 42 cm (M-Gerät) e a queda dos 12 fortes de Brialmont em Liège, agosto de 1914; Fort Loncin (15/08/1914,
explosão do paiol). Tom: engenharia sim, glorificação não; a invasão da Bélgica neutra e o custo humano ditos com sobriedade;
sem sangue, sem corpos, sem símbolos, nada de 2ª Guerra.

## Onde está tudo (projeto `D:\kriegschronik\tracer3d_02_bertha\v1`)
- `src/plano.json` — batidas **ancoradas em palavras** (campo `wort`: a batida começa no início dessa palavra falada). Desta vez as
  descrições (`bild`) foram escritas **depois** da narração alinhada: devem bater com a fala. Use `wortLokal(beat, 'Wort')` para
  sincronizar elementos internos.
- `public/bahn.json` (casos `referenz_schwer_65`, `schwer_max_reichweite`, `leicht_1917_65`, `flachfeuer_10_vergleich`; séries em
  metros, `src/daten.ts` já converte para km), `public/zahlen.json`, `..\fisica\formeln.md`, `..\roteiro\fakten.md`.
- `public/geo/` + `manifest.json`: relevo e satélite 2017 da região de Liège, **close de Loncin com ortofoto 2021 de 0,5 m**
  (`loncin_ortho_2021.jpg`, contém elementos modernos: mascarar casas/estradas para 1914), `forts_liege.geojson` (12 fortes com
  datas de queda), `forts_liege_umriss.geojson`, `loncin_osm.json`, `orte_bertha.geojson`, fotos PD em `geo/fotos/` (`fotos.json`).
  Créditos obrigatórios em `geo/CREDITOS.md`.
- `..\BATEDOR_bertha.md`: **fratura de concreto com `@dgreenheck/three-pinata` 2.0.1** (já na stack; pré-fraturar com semente fixa,
  trajetórias dos fragmentos analíticas = função de t), plantas de Brialmont com cotas (para modelar o forte), dimensões do M-Gerät,
  explosão do paiol (flipbooks Unity CC0 + shader próprio).

## Reaproveitar (módulos do vídeo 1 já copiados para `src/`)
| Dono | Reaproveite | Faça novo |
|---|---|---|
| **G** globo/atmosfera/trajetória | `welt/g_*` (GWelt com atmosfera Takram, Erde, BahnLinie, Machkegel, flugHud) | arco do tiro curvo (65°, ~4 km de altura, 57 s), comparação tiro curvo × tiro tenso |
| **M** a máquina | `welt/t_szene.tsx`, `t_vfx.tsx` (clarão/fumaça), `t_baeume.tsx`, `t_gelaende.tsx` | `welt/m_moerser.tsx`: M-Gerät procedural pelas medidas reais; transporte de 1914 com tratores; montagem |
| **F** a fortaleza | `t_gelaende.tsx` (terreno; use a área nova `loncin`), `t_vfx.tsx` | `welt/f_fort.tsx`: forte de Brialmont pelas plantas; impactos de cima; fratura (three-pinata); cratera; paiol explodindo à distância |
| **K** mapas 2D | `karten/basis.tsx` (projeção, camadas, Lineal, Ort, Blitz, Quelle) | anel dos 12 fortes caindo por data, rota desde a fronteira, panorama Namur/Maubeuge/Antuérpia/Verdun |
| **U** cartões | `ui/u1_*` (Heft, MathTitel, Formel KaTeX, Diagramm, Balken), `ui/u2_*` (Stempel, Blaupause, Zeitstrahl, gravuras) | os cartões da Bertha, cartão final + teaser |

Os arquivos `src/beats/*.tsx` do vídeo 1 foram esvaziados; os módulos do vídeo 1 que citam dados de Paris (`p_*`, `karten/daten.ts`)
não devem ser importados.

## Stills: agora na G4
Quando a G4 estiver ligada para a montagem (o orquestrador avisa), use
`python D:\tracer3d\g4_stills.py D:\kriegschronik\tracer3d_02_bertha\v1 <pasta> <seg> [<seg> ...]` → JPGs em `teste/<pasta>/`
(~2 min por rodada, peça VÁRIOS segundos por chamada; há trava: agentes esperam a vez). Se responder `G4_DESLIGADA`, use o still
local (`bash teste/still.sh <pasta> <seg>...`). Olhe todo still que gerar.

## Entrega
Igual ao vídeo 1: batidas feitas, fracas e por quê, stills de prova, módulos criados (API), pedidos de mudança em arquivos comuns.
