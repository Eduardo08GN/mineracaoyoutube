# K17 v2 — Aktion: 9 clipes 3D de ação (three.js / teardown kit)

Um take por `--config cfg_<take>.json`. `render(t)` é puro (nada de `Math.random` nem estado entre quadros), então qualquer fps ou resolução sai igual.
Tema creme/papel: céu em degradê leve, névoa na cor do horizonte e margens em camadas 2.5D (`kulisse.js`).
O vermelho-tinta `#a4402a` só aparece nas câmaras de mina e nos barris de pólvora. Os alemães vestem azul prussiano `#24384f`.
Não há texto nem números na imagem: as anotações entram depois, no Remotion, pelos tempos abaixo.

## Renderizar
```
export TEMP=D:/tmp TEARDOWN_OUT=D:/tmp/td_aktion
cd D:/pesquisa_nichos/teardown
node sims/build.mjs D:/kriegschronik/k17_v2/aktion            # → $TEARDOWN_OUT/dist/aktion.html
# entrega 1920×1080 @ 30 fps:
node sims/capture.mjs aktion --size 1600x900 --dpr 1.2 --fps 30 --config D:/kriegschronik/k17_v2/aktion/cfg_<take>.json --out <take>.mp4
# teste 1600×900 @ 24 fps: --dpr 1 --fps 24 (é o que está em aktion_teste/)
```
- Na G4 (Linux) as flags EGL já estão no `paths.mjs`.
- No PC, a Chromium 1208 do playwright não está instalada. Use `CHROMIUM=%LOCALAPPDATA%/ms-playwright/chromium-1223/chrome-win64/chrome.exe`; a 1228 está sem o `icudtl.dat`.
- Os atalhos de teste estão em `aktion_teste/td.sh` (`build`, `still`, `sheet`, `clip`) e `alle.sh` (stills e clipes dos 9 takes).

## Arquivos
| arquivo | o que é |
|---|---|
| `film.js` / `main.js` | escolhe o take e monta o palco |
| `stage.js` | o atelier do `maschine/stage.js` (GTAO, sombra VSM), com luz viva por quadro (dia/noite/clarão), céu em degradê e sombra que segue a ação |
| `pontonbruecke.js` | a ponte do `maschine/ponton.js` com as mesmas medidas (pontão 7,21 × 1,52 × 0,76 m, Feldweite 4,4 m, 5 Streckbalken, 14 tábuas), aberta peça a peça; casco com tampas; âncora e corda (tubo refeito por quadro) |
| `steinbruecke.js` | ponte de pedra ferroviária destrutível bloco a bloco: 4 arcos, para existir um pilar central (com 3 arcos não há); tem estado "gesprengt" estático |
| `wasser.js` | rio com estrias de corrente pela distância integrada ∫v·dt, esteira em V e espuma atrás dos obstáculos, barrancos |
| `figur.js` | pioneiro em silhueta sóbria (corpo, cabeça e quepe; juntas posadas por código): `de` prussiano, `fr` sapador francês; o bávaro é recolorido no take |
| `fx.js` | partículas puras na GPU (respingo em gotas + espuma, poeira, vapor) e brilho |
| `kulisse.js` | árvores e aldeia em camadas 2.5D |
| `take_*.js` | um arquivo por take (`DUR`, `EVENTS`, `build`) |

## Tempos (segundos dentro do take) para sincronizar com a fala

### 1. `brueckenschlag` — 13,0 s
Lançamento ao vivo com 7 pioneiros, cada um com uma tarefa. Câmera: passagem lateral baixa a montante, acompanhando a frente da obra, e grua no fim.

| s | evento |
|---|---|
| 0,0 | pontão 3 chega remado; a dupla traz a última viga no ombro; o pregador crava as tábuas do campo 2 |
| 2,8 | pontão 3 encosta (tranco) |
| 3,0 | o homem da proa gira o braço com a âncora |
| 3,4 | a âncora voa a montante (arco e corda se desenrolando) |
| **4,2** | **a âncora cai: respingo + anel**; a corda estica até 5,0 e puxa o pontão |
| 3,6 / 4,15 / 4,7 / 5,25 / 5,8 | vigas 1–5 empurradas sobre o vão (todas assentadas às 6,7) |
| 4,6–8,0 | a dupla anda sobre as vigas externas por cima da água |
| 7,0 | pontão 4 aparece (encosta às 10,0) |
| 8,2 | os homens do pontão tiram a 1ª tábua da pilha e a passam para cima |
| **9,05 / 10,15 / 11,25 / 12,35** | **tábuas 1–4 assentadas; o pregador crava cada uma** |
| 10,0 | começa a grua |
| 10,3 | 2º arremesso de âncora |
| 11,1 | 2ª âncora cai na água |

O ritmo é próximo do real, por isso o take mostra um campo avançando (pontão, âncora, vigas, primeiras tábuas) e não o campo inteiro tábua a tábua. O crescimento campo a campo está no take `feld_um_feld`.

### 2. `noveant_flut` — 15,0 s
Câmera: órbita alta, aproximação rápida no impacto, plano baixo na noite e subida larga no dia.

| s | evento |
|---|---|
| 0,0 | a jangada vem com a corrente |
| 0,5–3,0 | a corrente acelera de 0,45 para 1,25 m/s: estrias mais rápidas, longas e densas |
| **3,4** | **impacto no meio: respingo e tremor que corre pela ponte** |
| 3,5–6,0 | a ponte cede em meia-lua |
| 6,0–6,9 | cai a noite; lamparinas com 4 homens nos pontões do meio |
| 6,7–9,3 | as tábuas são retiradas do meio para as margens |
| 7,6 | começam a sair as vigas |
| 8,4–10,4 | os pontões são soltos e derivam para as margens (com os homens) |
| 10,4–11,2 | amanhece |
| 11,1–14,4 | reconstrução acelerada com 16 pontões (mais apoios) |
| 14,4 | a ponte está de pé |

### 3. `donchery_sprengung` — 10,0 s
Câmera: close rente no pilar, recuo rápido no clarão e plano largo do vão.

| s | evento |
|---|---|
| 0,2–1,2 | o pilar central vira raio-x (fantasma com contorno a tinta) |
| 0,8 / 1,1 | as câmaras de mina 1 e 2 acendem em vermelho-tinta |
| 1,4–2,8 | a carga 1 desce pelo poço |
| 1,8–3,2 | a carga 2 desce |
| 3,6–4,55 | a faísca do estopim desce |
| **4,6** | **EXPLOSÃO (clarão, estilhaços); a câmera recua** |
| 4,8–6,5 | arcos e tabuleiro caem a partir do pilar |
| 5,3–6,8 | as pedras batem na água (respingos) |
| 6,0 | plano largo: poeira sobre o vão |
| 8,0–10,0 | a poeira assenta e o vão fica |

### 4. `zug_pulver` — 9,0 s
A ferrovia Sedan–Mézières passa pela ponte. O trem atravessa a ponte freando e para na cabeceira (locomotiva sobre o encontro, vagão ainda no 1º arco). Depois parte de novo levando a pólvora. Câmera: travelling junto ao trem; quando o trem sai, fica na ponte inteira com leve deriva.

| s | evento |
|---|---|
| 0,0–3,0 | o trem freia sobre a ponte (rodas girando, fumaça) |
| **3,0** | **o trem para na cabeceira** |
| 3,1–3,9 | 4 sapadores franceses descem e andam para a ponte |
| **4,5** | **o trem parte de novo com os barris** |
| 6,8 | o vagão de pólvora sai do quadro |
| 7,5–9,0 | a ponte inteira, de pé; os sapadores ficam sem pólvora |

### 5. `ponton_last` — 6,0 s
O pontão vazio (514 kg) afunda caixote a caixote (465 kg cada) até ~5,2 t. O calado vem do volume real do casco. Câmera: 3/4 rente à água.

| s | evento |
|---|---|
| 0,0 | o pontão vazio boia alto |
| 1,22 / 1,68 / 2,14 / 2,60 / 3,06 / 3,52 / 3,98 / 4,44 / 4,90 / 5,36 | caixotes 1–10 batem no casco: o pontão afunda e balança. Massa total depois de cada um: 979 / 1.444 / 1.909 / 2.374 / 2.839 / 3.304 / 3.769 / 4.234 / 4.699 / 5.164 kg |
| 5,4–6,0 | a linha d'água fica logo abaixo da borda |

### 6. `feld_um_feld` — 8,0 s
Câmera aérea alta acompanhando a frente da obra e abrindo no fim. São 13 campos (12 pontões + 2 cavaletes) de margem a margem, em tempo acelerado. A cada pontão a âncora cai (anel na água).
- Os campos 1–13 fecham em: 0,94 · 1,48 · 2,02 · 2,55 · 3,09 · 3,63 · 4,17 · 4,71 · 5,25 · 5,78 · 6,32 · 6,86 · 7,40 s. O contador do Remotion segue essa lista.

### 7. `juvisy_141` — 5,0 s
A ponte de Juvisy pronta (141 m, 31 pontões + 2 cavaletes), com uma coluna de infantaria de 24 homens marchando. Câmera: passagem rápida a jusante, ao longo da ponte.

| s | evento |
|---|---|
| 0,0 | sai da margem |
| 1,5–2,7 | a coluna no meio da ponte |
| 4,2 | a outra margem entra no quadro |

### 8. `bazeilles_faesser` — 8,0 s
Ponte de pilares de pedra com tabuleiro de vigas de ferro. Câmera: push-in lento por baixo do tabuleiro, inclinando com a queda.
- 0,0: soldados bávaros (azul-claro) chegam aos 3 barris.
- Cada barril é tombado, rola, cai e bate na água:

| barril | tomba | rola | cai | **bate na água** |
|---|---|---|---|---|
| 1 | 0,6 | 1,0 | 1,9 | **3,28** |
| 2 | 2,0 | 2,4 | 3,3 | **4,68** |
| 3 | 3,4 | 3,8 | 4,7 | **6,08** |

- 6,2–8,0: os barris derivam; os soldados olham para baixo.

### 9. `corbeil` — 11,0 s
A ponte de pedra com o arco do meio explodido (entulho no rio) e, a jusante, a ponte de pontões que se completa em tempo acelerado. Câmera: órbita lenta pelo lado de jusante, com as duas pontes no quadro.
- 0,8: começa a ponte de pontões.
- Os campos 1–11 fecham em: 1,75 · 2,65 · 3,52 · 4,34 · 5,14 · 5,91 · 6,65 · 7,37 · 8,06 · 8,74 · 9,40 s.
- 9,6: a primeira infantaria pisa na ponte (os soldados aparecem na margem às 8,2).

## Câmeras (nenhuma se repete)
| take | câmera |
|---|---|
| brueckenschlag | passagem lateral baixa e grua |
| noveant_flut | órbita alta, aproximação rápida, plano baixo e subida |
| donchery_sprengung | close rente e recuo |
| zug_pulver | travelling e deriva |
| ponton_last | 3/4 rente à água |
| feld_um_feld | aérea acompanhando |
| juvisy_141 | passagem rápida |
| bazeilles_faesser | push-in por baixo |
| corbeil | órbita lenta de jusante |

## Pontos fracos conhecidos
- As figuras ainda têm algo de "boneco de madeira" em close (cabeça clara, juntas em cápsula); em plano médio e aberto leem bem.
- Donchery:
  - no close, as aduelas parecem blocos grossos;
  - o clarão tinge o quadro de pêssego por cerca de 0,3 s;
  - o entulho se interpenetra um pouco (queda balística sem colisão).
- Novéant: a desmontagem e a reconstrução são em tempo acelerado; os homens da noite ficam nos pontões em vez de correr pela ponte.
- zug_pulver: no plano largo, os sapadores são pequenos e os barris aparecem sobretudo pelas tampas vermelhas.
