# Brief do planejador de batidas — vídeo 10 Kriegsmomente: Belagerung von Paris, 19.9.1870 – 28.1.1871 (Tracer3D 2.0)

Você transforma a narração em **batidas visuais**. Projeto: `D:\kriegschronik\tracer3d_10_paris` (cópia do vídeo 9). Formato idêntico aos vídeos 8 e 9: leia as seções "Formato de saída", "Regras de qualidade" e "Mistura de famílias" de `D:\kriegschronik\tracer3d_08_gewehr\roteiro\BRIEF_PLANEJADOR.md`; valem aqui. Geradores de referência: `roteiro/gerar_A.py` / `gerar_B.py` (os do vídeo 9, já copiados — reescreva para o vídeo 10; o do vídeo 9 é o melhor modelo de estrutura).

## Leia
- `roteiro/skript_de.json` e `roteiro/fakten.md` (use só números/rótulos de lá; "ca." onde for aproximado; respeite as escolhas "para o áudio"). **Nunca** mostre "240.000" Belagerer (não confirmado), nem data dos elefantes, nem enquadre "Kaiserreich/Reichsgründung".
- `v1/src/kit/API.md` + `kit/ui/API.md`, `kit/karten/API.md`, `kit/welt/API.md`, `kit/epoca/API.md` (cena `Gemaelde`).
- **Novos do vídeo 10:** `v1/src/welt/K10_API.md` — `Festungsring` (anel aéreo com 16 fortes e a muralha; `fort` só a ≥ 400 m), `BallonAufstieg` (`orbit`/`unten`), `BallonRoute`, `Beschiessung` (**só `kamera="bahn"`**). Pacotes de terreno `paris_anel` (hell 1,8) e `paris_1870` (satélite "1870") em `v1/src/cenas/pacotes.json` para o `Flug` do kit. Geo: `v1/public/geo/paris_1870.geojson`. Folha do batedor: `render/FOLHA_batedor_paris.jpg`; decisões em `BATEDOR_paris.md` (closes de muralha, forte e peça = `Gemaelde`, nunca `mauer`/`batterie`/`nah`).
- **Do vídeo 6 (biblioteca, já no projeto):** `v1/src/welt/k6_paris_szenen.tsx`, `k6_paris_winter.tsx` (`Taube`, `FilmTisch`, `Projektion`, `ParisBelagert`, …) e o uso deles em `v1/src/beats/paris.tsx` — serve para pombos e microfilme de Dagron (cap. 07). `KruppC64` é stand-in "Krupp-Hinterlader (schematisch)", nunca "C/64".
- Imagens de época: `v1/public/geo/fotos/fotos.json` (41 imagens `k10_*`, 37 com profundidade 2.5D; os mapas sem profundidade entram como `Gemaelde` plano ou cartão de documento). Rótulo = `titulo_de`.

## Cenas inéditas
Batidas com componentes `k10_*` ou `k6_paris_*` usam `"dono": "INEDITO_k10"` (sem `cena`) e você escreve o componente no seu arquivo `v1/src/beats/k10_<A|B>.tsx` (`export const K10_<A|B>: BeatMap = {"06_03": (b) => <Festungsring t={b.t} d={b.d} kamera="anel" />, ...}`), no estilo de `D:\kriegschronik\tracer3d_09_koeniggraetz\v1\src\beats\k9_A.tsx` (use `wortLokal` para ancorar ações na fala). O `index.ts` já junta `K10_A` e `K10_B`. Rode `npx tsc --noEmit` (só erros novos importam). **Nada de componente 3D novo**: só os prontos (k10, k6, kit). Cena fraca vira `Gemaelde` na hora.

## Rodapé semanal (campos da batida) — OBRIGATÓRIO
`src/zaehler_paris.tsx` + série `src/tage_paris.json` (20 semanas: 1 = 19/9/1870 … 18 = 16/1/1871, 19 = 23/1, 20 = 28/1). Na batida: `"woche": <n>` (fracionário corre entre semanas; vale até a próxima batida com `woche`), `"zaehler": false` esconde (cartões grandes embaixo, cap. 01 e 03 iniciais se atrapalhar). **`"tote": true` na batida de "Unten im Bild sehen Sie jetzt die Zahl der Toten"** (cap. 10) — a partir dela o campo "Tote pro Woche" aparece. Sugestão de semanas: 01 → 16 (5/1/1871); 02 → 1 e depois 9 em "Im November"; 03 → 1; 04 → escondido (antes do cerco); 05 → 1; 06 → 1; 07 → 1→4 (23/9, 7/10) até 10 (Norwegen, 24/11); 08 → 6–8; 09 → 11–12; 10 → 3→18; 11 → 15–17; 12 → 18–20; 13 → 20; 14 → escondido ou 20.

## Direção visual
- Mistura (linha MISTURA do `plano.py`): mapa ≤ 35 %, 3D ≥ 25 %, época ≥ 20 %, no máximo 3 seguidas da mesma família; DINAMISMO: cartões `ui` ≤ 40 %, ≤ 2 seguidos; 3D ou mapa a cada ~15 s.
- **Estratégia e engenharia, perspectiva alemã plausível**: o anel (`Festungsring anel` crescendo), Feldtelegraph e reservas (setas sobre o anel/`Karte`), a ferrovia Toul–Nanteuil (mapa `Karte` com a linha e o túnel), a bateria a 30° (`Beschiessung bahn` + `Gemaelde`), e do lado francês balões/pombos/microfilme (`BallonAufstieg`, `BallonRoute`, `Taube`/`FilmTisch`/`Projektion` do v6).
- Combate humano (Châtillon, Le Bourget, Champigny/Villiers, Buzenval) = `Gemaelde` (Detaille, de Neuville, Meissonier…) + mapa com setas; não 3D de figuras.
- Cap. 01 e cap. 11 rimam: mesmo enquadramento da bateria de Châtillon (`Beschiessung bahn`) e do sinal de 8:30.
- Cap. 13 (take inédito): dois números lado a lado — "97 Zivilisten durch Granaten" parado × "ca. 30.000 mehr Tote als im Vorjahr" subindo (cartão `ui` de comparação ou gráfico da série semanal 1870/71 × 1869/70 de `tage_paris.json`), depois a frase de Moltke como `Zitat` **parafraseada** (não é citação literal: rótulo "sinngemäß, Moltke").
- Cap. 02: 300.000 × 150.000, 2.600 × 620 Geschütze, Mauer 34 km / 94 Bastionen / 16 Forts sobre o `Festungsring` (números em HUD por cima do 3D sempre que der).
- Sem marca SIMULATION; créditos nunca na imagem; `@Kriegsmomente` já está no sequenciador.

## Verificação
1. `python ferramentas/plano.py` sem ERROS. O alinhamento real estará em `voz/alinhamento.json` (se ainda não existir, rode `python ferramentas/alinhamento_provisorio.py` e regenere depois; grave `dur` por capítulo — BADPATHS 3.14).
2. Stills na G4: `python D:/tracer3d2/canal.py stills D:/kriegschronik/tracer3d_10_paris/v1 <pasta> <seg...>` (até 16 por chamada) — **só se `python D:/tracer3d2/canal.py saude` responder com a G4 no ar**; **nunca** `garantir`/`ligar`/`desligar`/`preparar` (a G4 é compartilhada; o maestro controla). Se mexer em `public/`, rode `canal.py sync D:/kriegschronik/tracer3d_10_paris/v1 public`. Folhas de contato a 480 px em `render/FOLHA_<A|B>_*.jpg`. No máximo 2 rodadas de stills por capítulo. Corrija vazio, cortado, sobreposto, feio. Para os INEDITO_k10, 3 stills (início/meio/fim).
3. Tudo no D: (`TEMP=D:/tmp`); mate só processos seus (PID).

## Entrega (curta)
Contagem por família, MISTURA/DINAMISMO da sua parte, folhas, o que está fraco.
