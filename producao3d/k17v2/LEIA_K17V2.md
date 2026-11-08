# K17 v2 — projeto Remotion (Tracer3D 2.0, base K15) no DESIGN SYSTEM CREME

Criado em 05/11/2026 a partir de `D:/kriegschronik/tracer3d_15_emser/v1` (o K15 não foi tocado). Remotion 4.0.537, mesmo kit (`src/kit/`, APIs em `src/kit/API.md`, `kit/karten/API.md`, `kit/ui/API.md`, `kit/epoca/API.md`, `kit/premium/API.md`).

## 1. O que mudou em relação ao K15

### Paleta (tokens em `src/ui/basis.tsx`, objeto `C`)
| token | cor | uso |
|---|---|---|
| `C.grund` | `#e9e1d0` | fundo papel (fora dos rasters do mapa também é papel) |
| `C.grund2` | `#ddd3bf` | cartões |
| `C.linie` | `#b9ab90` | linhas, bordas |
| `C.tinte` (= `C.papier`, nome legado) | `#2a2622` | **tinta**: texto principal, linhas, símbolos, setas padrão |
| `C.grau` | `#6b6152` | texto secundário, kickers |
| `C.signal` = `C.rot` | `#a4402a` | vermelho-tinta: números, destaque, destruído |
| `C.preussen` | `#24384f` | azul prussiano = lado alemão |
| `C.frankreich` | `#9a3b2b` | vermelho francês = lado francês |
| `C.sepia` | `#8a6a48` | época, nomes de país (`gebiet`) |
| `C.wasser` | `#3f6f8f` | rios (camada de rios do mapa) |
| `C.cyan` / `C.orange` / `C.gruen` | `#2f6b7a` / `#b0652c` / `#4f7a3a` | engenharia / calor-arrasto / verificado |
| `HALO` | halo cor de papel | atrás de todo texto escuro sobre mapa/foto |

**Rich-text** (todo texto dos cartões ui, Manchete, Clip): `*x*` = `C.signal` (#a4402a), `^x^` = `C.rot` (#a4402a), `~x~` = `C.grau` (#6b6152). Para marcar lados use `farbe` explícita: `#24384f` (alemão) / `#9a3b2b` (francês).
Nas camadas do mapa, os padrões são: texto/pfeil/strahl/marke/ring em tinta `#2a2622`; ziel/lineal/zahl/datum/blitz/stempel em `#a4402a`; kreis em `#a4402a`; linie/front em `#a4402a`; fronteiras 1870 tracejado-ponto em tinta 62 %; rios `#3f6f8f`. Em JSON passe as cores por hex.

Conversão: `ferramentas/creme_converter.py` (idempotente) trocou em todo `src/` 2D as cores escritas à mão (texto claro → tinta, fundos/halos escuros → papel, sombras de texto pretas → halo de papel, sombras de caixa → sépia suave, vinhetas pretas → sépia, amarelo/cyan/verde/laranja → tintas de atlas). Ficaram FORA (3D, materiais/luz): `kit/welt`, `kit/acabamento`, `kit/desenhados`, `welt/`. `kit/epoca` (Gemaelde) teve só a manchete/rótulo trocados para papel+tinta (componente `kit/ui/manchete.tsx`). `kit/motion` já tinha o tema `labor` creme (padrão). `kit/premium` (tokens do Segundo a Segundo, escuro) **não foi convertido nem testado** — não use sem batedor.
Ajustes manuais de legibilidade (`ferramentas/_patch_karten.py`, `_patch_ui.py`): rótulos ≥ 30 px (Ort 32, Marke 40, nomes de símbolo 30, régua 34, eixo da Zeitleiste 28–32, títulos de mapa 58), títulos em Barlow Bold 700, vinheta do atlas em sépia leve.

### Fontes (locais, `public/fonts`, carregadas por `ui/basis.tsx` com delayRender — sem rede)
- `F.titel` = Barlow Condensed (500/600/**700**) — títulos grandes (OFL).
- `F.text` = Inter 400–700 — texto e rótulos (público 60+, mínimo ~32 px a 1080p; `GR.min = 32`).
- `F.mono` = JetBrains Mono — kickers, números tabulares.
- `F.epoche` = **IM Fell itálico** (OFL) — datas, carimbos (`stempel`), `datum`, subtítulo de mapa, sub da manchete. `F.epocheR` = IM Fell romano.
- Símbolos ✓ ✕ → continuam vindo de Noto Sans Symbols 2 (google-fonts).

### Mapas sem EOX
`public/karten2/raster.json` só tem rasters creme (EOX removido, nada de satélite):
| arquivo | west | east | south | north | px |
|---|---|---|---|---|---|
| `karten2/lorena_creme.jpg` | 4.5 | 7.0 | 48.5 | 50.0 | 4096 × 3765 |
| `karten2/seine_creme.jpg` | 1.9 | 3.1 | 48.45 | 48.95 | 4096 × 2586 |
| `karten2/maas_hd_creme.jpg` (~9 m/px, Sedan/Donchery) | 4.62 | 5.12 | 49.58 | 49.82 | 4096 × 3040 |
| `karten2/mosel_hd_creme.jpg` (Metz–Pont-à-Mousson) | 5.82 | 6.32 | 48.74 | 49.16 | 4096 × 5239 |

Equiretangular (linear em lon/lat), linha 0 = norte. Composição "atlas creme" em `ferramentas/atlas_creme.py` (papel ambientCG × relevo Copernicus sépia ~55 % × tinta hipsométrica 150–600 m × curvas 50/250 m); para outra região: assar `hillshade.png + dem16.png + meta.json` como em `k17_pioniere/ferramentas/assar_mapa_vm.py` e acrescentar à lista `PACOTES`. No modo `auto` o maior raster (Lorena) está sempre ligado e os outros (Sena, Maas HD, Mosel HD) entram por cima conforme o zoom (aparecem quando ocupam > 337 px de largura na tela, cheios a 675 px). Fora dos rasters = papel. Raster explícito (HD por cima do Lorena), quando quiser controlar:
`"grund": {"rasters": [{"bild": "karten2/lorena_creme.jpg", "grenzen": [4.5, 48.5, 7.0, 50.0], "rand": 0.08}, {"bild": "karten2/mosel_hd_creme.jpg", "grenzen": [5.82, 48.74, 6.32, 49.16], "rand": 0.06}]}` (ordem `[oeste, sul, leste, norte]`; o último da lista fica por cima).
Padrões do `grund`: fronteiras = `geo/grenzen_1870.geojson` (OHM), rios = `geo/fluesse_1870.geojson`; `bahn_1870`, `forts_1870`, `orte_1870`, `grenzen_1871*` também estão em `public/geo/` para `datei`. Créditos: `public/karten2/CREDITOS.md` (linha pronta para a descrição) e `public/geo/CREDITOS_1870.md`.

### Outros
- `beats/index.ts` vazio: os componentes próprios do K15 e anteriores ficam na pasta só como biblioteca (os ids colidiriam). `cenas/*.json` zerados.
- `Video.tsx`: sem o contador de 1866; cartão provisório em creme; marca d'água `@Kriegsmomente` em tinta 42 %.
- `public/geo/fotos` + `public/geo/tiefe` copiados do K15 (Gemaelde precisa); `public/aktion/` para os clipes 3D.

## 2. Plano e voz
- `python -I ../ferramentas/plano.py` (rodar de `D:/kriegschronik/k17_v2`) gera `src/plano.json` da narração do K17 (mantida): copia na 1ª vez `k17_pioniere/roteiro/{skript_de,frases}.json` e `voz/*.wav + alinhamento.json` para `k17_v2/roteiro` e `k17_v2/voz`. Pausa entre capítulos = 0,45 s (igual à montagem da voz do K17 v1). Hoje: **462,46 s, 11 capítulos, 102 batidas**.
- Sem `roteiro/batidas*.json` → **uma batida por frase**, id = id da frase (`01_01`…`09_10`; frases < 1,4 s juntam com a anterior). Para cortar diferente, escreva `k17_v2/roteiro/batidas_A.json` = `{"kapitel": {"04_mosel": [{"wort": "Pontons", "nr": 1, "dono": "karten", "bild": "...", "id": "04_03"?, "schnitt": true?}, ...]}}` e rode de novo (a 1ª batida de cada capítulo começa no início do capítulo; as outras no início da palavra `wort`, `nr`-ésima ocorrência).
- `woerter` do plano permite âncoras na fala em qualquer tempo de cena: `{"wort": "Pontons", "nach": 0, "plus": -0.2}`.
- O render sai **mudo**; a voz entra na mixagem depois (`tracer3d_15_emser/ferramentas/mixar_novo.py D:/kriegschronik/k17_v2 <eventos.json> 0 462.46 saida.wav --sem_musica`, que lê `<video>/v1/src/plano.json` e `<video>/voz/<kap>.wav`). Sem música (regra do canal).

## 3. Registrar cenas
Cada batida vira cena escrevendo em `src/cenas/<familia>.json`: `{"04_03": {"comp": "Karte", "props": {...}}}`. Ordem do sequenciador: cena do kit > `beats/` > cartão provisório (mostra id + frase). Arquivos: `ui.json`, `karten.json`, `epoca.json`, `welt.json`, **`clips.json`** (todos lidos pelo `CENAS`; o nome do arquivo não importa para o render, só para organizar). Exemplos completos e testados: `src/teste/teste_cenas.json` (Karte Lorena com pfeil/lineal/symbol/ort/gebiet/datum, Balken, Titel, Zeitleiste).

### Deko dos cartões ui (vale em todo cartão, no `Clip` e onde houver `deko`)
- `pfad` com `dur`: o traço se **desenha** de `em` até `em + dur` (como o `bogen`); `fuell` entra quando o traço fecha; `gestrichelt` vale depois de desenhado.
- `bahn: [[Zeit, dx, dy], ...]` em **qualquer** elemento deko: deslocamento em px, suave entre as chaves (Zeit = s locais ou `{"wort": ...}`); antes da 1ª chave fica na 1ª, depois da última fica na última. Ex.: barril que cai e quica `"bahn": [[0.5, 0, 0], [2.0, 0, 380], [2.4, 0, 350], [2.7, 0, 380]]`.

### Cena `Clip` (clipes 3D de ação)
`src/cenas/clips.json`: `{"04_05": {"comp": "Clip", "props": {"datei": "aktion/brueckenschlag.mp4", "inicio": 0, "velocidade": 1, "kopf": {"titel": "Pioniere schlagen die Brücke", "sub": "Pont-à-Mousson, 14. August 1870", "em": 0.6}, "deko": [{"typ": "text", "text": "*2 Stunden*", "x": 1500, "y": 200, "groesse": 90, "schrift": "titel", "em": {"wort": "Stunden"}}]}}}`
- mp4 1920×1080 em `public/aktion/`, **sem áudio** (muted). Quadro escolhido por `<Freeze>` a partir do tempo local: `tClip = inicio + t × velocidade`.
- Se a batida for mais longa que o resto do clipe: desacelera até **0,6 × velocidade**; se ainda faltar, congela o último quadro (aviso `console.warn` no render). Duração lida do próprio mp4 (`@remotion/media-parser`); `clipDauer` (s) força um valor.
- `kopf` = mesma manchete do Gemaelde, em creme (faixa de papel embaixo à esquerda, Barlow Bold + IM Fell itálico). `deko` = o mesmo renderizador dos cartões ui (tempos locais ou `{wort}`); `ab` funciona como nos cartões (cena contínua por várias batidas).

## 4. Renderizar
```
cd D:/kriegschronik/k17_v2/v1
set npm_config_cache=D:/tmp/npm-cache & set TEMP=D:/tmp
npm install                       # 1a vez (node_modules local, cache no D:)
npx remotion studio src/index.tsx # previa
npx remotion still src/index.tsx Teste ../teste/x.png --frame=90 --scale=0.6667   # stills de teste (CPU)
npx remotion still src/index.tsx Video ../teste/b.png --frame=<s*30>               # still de uma batida
npx remotion render src/index.tsx Video out/k17v2_mudo.mp4                          # filme (na G4 em fatias: --frames=a-b)
```
Composições: `Video` (filme inteiro, 1920×1080, 30 fps) e `Teste` (cenas de `teste/teste_cenas.json` em sequência: a_karte 0–8 s, b_balken 8–14 s, c_titel 14–19 s, d_zeitleiste 19–25 s, e_clip 25–31 s com `public/aktion/_teste.mp4` de 3 s → testa desaceleração 0,6 + congelamento, `pfad` desenhado e `bahn`).
Dica: `npx remotion bundle src/index.tsx --out-dir=D:/kriegschronik/k17_v2/bundle` uma vez e depois `npx remotion still D:/kriegschronik/k17_v2/bundle Teste ...` (não reempacota a cada still).
Aviso conhecido: em still com `Clip`, o log pode mostrar `Could not extract frame from compositor: Request closed` depois do quadro pronto (o compositor fecha enquanto pré-busca quadros vizinhos); a imagem sai certa (conferido nos quadros 36 e 89 do clipe de teste).
Stills de referência do batedor creme: `D:/kriegschronik/k17_v2/teste/`.
