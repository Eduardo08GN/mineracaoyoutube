# K17 v2 — refeito do zero (pedido do Eduardo, 05/11 ~01:20: "ficou uma porcaria"; entregar pronto de manhã)

## Por que refazer (crítica dele + medições)
- K17 v1: movimento médio 0,53, **73% de quadros parados**, mesma câmera nas 86 tomadas, ponte como enchimento, esquemas de dois traços, mapas sem informação (relevo + check), 30 buracos de silêncio, corte seco em tudo, nenhuma pessoa no 3D, ação vira número.
- Referência de dinamismo: @desmontandoomundo (`docs/referencias/desmontando-o-mundo.md`), mov. médio 7,2, 6% parados. **Só a espinha**: a imagem DEMONSTRA a frase enquanto ela é dita; ação física com causa visível dentro do plano. Tom documental alemão 60+ (3ª pessoa, sóbrio), cortes calmos (3–6 s) mas plano vivo.
- Faltou **Remotion**: edição, esquemas que se constroem, mapas do kit, tipografia, efeitos sonoros.

## Arquitetura v2 (híbrida)
- **Remotion = mesa de edição** (projeto base: `D:/kriegschronik/tracer3d_15_emser/v1`, design creme do K15, kit completo):
  - mapas pelo kit `karten` (pfeil, front, lineal com contador, datum, zeitleiste, symbol com estados, blitz, uhr, stempel, gebiet; câmera com deriva) → **placar das pontes** (de pé / explodida / tentada + contador "6 von 6 stehen");
  - cartões `ui` (Vergleich, Balken, Zeitleiste, Formel, Zahl, Zitat) e `premium` (Compare, Timeline, Arrow, Hypothesis) para números → comparação de escala;
  - `epoca` Gemaelde (gravuras com paralaxe + fumaça/chuva) — cada gravura uma vez só;
  - `desenhados` (locomotiva, vagão, soldado) e `acabamento` (tropa, fumaça) onde servir;
  - transições com movimento nas trocas de linguagem; títulos grandes em condensada; capítulos "1 / 2 / 3".
- **three.js (G4) = só a ação 3D** que o 2D não faz bem (clipes embutidos por BlenderClip/OffthreadVideo):
  - lançamento da ponte de pontões com pioneiros (silhuetas) carregando, pontão entrando na água, âncora, vigas, tábuas — AÇÃO dentro do plano;
  - cheia de Novéant: água com partículas/fluxo, balsa à deriva BATE, a ponte cede em meia-lua, desmontada peça a peça, noite, remontada;
  - Donchery: pilar da ponte ferroviária em corte, câmaras acendem, cargas descem, explosão (clarão, estilhaços, poeira), vão de 72 m.
  - câmera: ≥ 5 tipos (passagem, órbita, close rente, aproximação rápida, chicote); nunca 2 planos seguidos iguais.
- **Som**: zero silêncio digital; base de ambiente (água/vento leve) + efeitos (madeira, corda, trem, explosão) — SEM música (regra do canal).
- Roteiro/voz: o texto alemão v1 é factual e foi conferido; a crítica foi visual. **Mantém a narração** (459 s, alinhada) — o plano de imagem é que é refeito do zero.

## Metas (régua 25 fps, `D:/tmp/reel_dfk3/movimento.py`) antes de entregar
- movimento médio ≥ 3 (v1 0,53), quadros parados ≤ 20% (v1 73%), nenhum plano parado > 4 s.
- ≥ 60% dos planos se transformam do início ao fim; conteúdo ≥ 40% do quadro.
- mapa ≤ 35% e cada mapa com algo se movendo.

## Ordem de trabalho (noite de 05/11)
1. Projeto Remotion k17_v2 a partir do K15 v1 (fontes, design, kit) + plano.json no formato do K15 a partir de `k17_pioniere/roteiro/frases.json`.
2. Cenas JSON por batida (karten / ui / epoca / premium / clipes 3D).
3. Clipes 3D de ação (three.js) na G4, em paralelo.
4. Batedor: stills de cada batida na G4 → folha → corrigir.
5. Efeitos sonoros + voz → mix.
6. Render Remotion na G4 (fatias) → leitura ótica a 25 fps → corrigir → entregar.
