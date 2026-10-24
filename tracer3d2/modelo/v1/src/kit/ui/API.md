# Familia ui: cartoes 2D de explicador (fundo "caderno tecnico" grafite, grade fina, camera em deriva lenta)

Uso: `src/cenas/ui.json` -> `{"<id da batida>": {"comp": "<Cena>", "props": {...}}}`. Cenas: `Titel Liste Hinweis Formel Balken Vergleich Zahl Kurve Zeitleiste Foto Zitat`.
Textos em alemao (ou qualquer idioma); numeros formatados com `.` de milhar e `,` decimal (troque com `"zahl": {"dez": ".", "tsd": ","}`).

## Regras comuns (valem para todas as cenas)
- **Tempo**: todo `em`/`ate`/`dur` e em **segundos desde o inicio da cena** (= inicio da batida) ou `{"wort": "Granate", "nach": 0, "plus": 0.2}` (palavra falada; `nach` = segundos desde o inicio da cena a partir de onde procurar, use quando a palavra se repete). Palavra nao achada = valor padrao, nunca quebra.
- **`ab`**: id da 1a batida de uma cena que continua por varias batidas (`"ab": "02_01"`). Repita as MESMAS props em todas as batidas e so mude `comp` se o tipo mudar; o tempo passa a contar desde `ab`, o fundo e os itens ja entrados continuam sem reiniciar.
- **`kopf`** `{"titel": "DIE MATHEMATIK", "nr": "1", "thema": "Wucht", "em": 0}` cabecalho (com `nr` = estilo caderno, sem `nr` = rubrica). `fortschritt` `{"labels": [...], "von": 0, "bis": 1, "em": 0, "ab": t, "ende": t}` barra de etapas no rodape (idx vai de `von` a `bis` entre `ab` e `ende`). `fuss` texto pequeno no rodape esquerdo. `quelle` linha de fonte no rodape direito. `zoom` deriva da camera (padrao 0.0014).
- Rich-text em todo texto: `*amarelo*`, `~cinza~`, `^vermelho^`; `⊥` e `∥` sao desenhados (as fontes nao os tem).
- **`deko`**: lista de elementos livres em px (tela 1920x1080), em qualquer cena. Todos aceitam `em`, `ate`, `dur`. Tipos:
  `text` {text, x, y, groesse=36, farbe, schrift:"text|titel|mono", abstand, ausr:"l|m|r", winkel, tippen:cps, zaehler:{von,bis,em,dauer,stellen} com `{z}` no texto, pop, glow, puls}
  `zahl` {wert (numero ou texto), zaehler:true | bis, kicker, einheit, einheitInline, unter, untenEm, groesse=210, farbe, x, y, ausr}
  `tex` {tex, x, y, groesse, farbe, ausr, rahmen:true (caixa amarela), puls:t, unter} · `kreis` {x,y,r,farbe,fuell,strich,text,unter,ring}
  `rechteck` {x,y,w,h,farbe,fuell,strich,gestrichelt,schraffur,text} · `linie` {x1,y1,x2,y2,farbe,strich,gestrichelt} · `pfeil` {x1,y1,x2,y2,farbe,strich,spitze,offen,doppelt,gestrichelt}
  `bogen` {x,y,r,von,bis (graus),farbe} · `pfad` {d,x,y,drehung,skala,farbe,fuell,strich} · `wuerfel` {x,y,u,farbe,stapel:n,text} · `raster` {x,y,spalten,zeilen,w,h,abstand,text,farbe,dauer}
  `chip` {text,x,y,farbe,groesse,ausr,fuell} · `siegel` {text,unter,x,y,farbe,groesse,drehung} (carimbo) · `ikon` {name,x,y,groesse} (rechner atmo kurve beton quellen schaetzung haken kreuz warnung info punkt bogen)
  `rahmen` {x,y,w,h,farbe} moldura tracejada com cantos · `skala` {x,y,breite,min,max,ticks,einheit,label,bereiche:[{von,bis,kern:[a,b],farbe}]} · `lkw` {x,y,gr} · `schale` {x,y,laenge,radius,neigung} wireframe de granada
  `kurve` (ver Kurve) · `balken` (ver Balken) · `karte` (ver Zitat).

## Titel
Cartao tipografico de capitulo/titulo. Props: `titel`* (rich), `kicker`, `teil` ("TEIL 1", linhas dos dois lados), `unter`, `stil` `"kapitel"` (padrao, wipe) | `"zeile"` (kicker sinal + titulo de 1 linha, `y`, `groesse`, `kickerAte`, `titelEm`) | `"gross"` (palavra grande tipo SIMULATION), `tippen` cps (letra a letra com cursor), `aus` t (o titulo encolhe e sobe para o `kopf`, que entra sozinho).
`{"comp":"Titel","props":{"kicker":"KAPITEL · BERECHNUNG","titel":"DIE MATHEMATIK","teil":"TEIL 1","unter":"Wucht","aus":{"wort":"Doppeltes","plus":-0.9},"kopf":{"titel":"DIE MATHEMATIK","nr":"1","thema":"Wucht"}}}`

## Liste / Hinweis
Aviso, lista, checklist. `held` {titel, em, unter: texto | [{text, em, fett}], hoch: t (sobe e encolhe, obrigatorio se houver zeilen), wipe, groesse=190, abstand=34}; `zeilen`* [{ikon, titel, detail, farbe, titelfarbe, em, rechts}] com `rechts` = {typ:"vergleich", a, b, symbol:"≠", em} | {typ:"fehler", text:"± ?", em} | {typ:"text", text}; `x`=250, `x2`=1180, `y0`=310, `abstand`=124; `schluss` {atem:t, aus:t} (respira e esmaece no fim). `Hinweis` = Liste com wireframe de fundo (cartao de SIMULACAO: nao e marca d'agua).
`{"comp":"Hinweis","props":{"ab":"02_01","held":{"titel":"SIMULATION","em":{"wort":"Simulation"},"unter":[{"text":"Alle Zahlen ","em":{"wort":"Zahlen"}}],"hoch":{"wort":"berechnet","plus":0.3}},"zeilen":[{"ikon":"atmo","titel":"Atmosphäre","detail":"US-Standard 1976","farbe":"#5ec8e5","em":{"wort":"Standardatmosphäre","plus":-0.3}}]}}`

## Formel
Formula KaTeX com termos que entram um a um. `formeln`* [{tex*, terme, marken, groesse=72, x, y, em, farbe, zaehler, schrumpf}] (sem `x` = centrada). Marque os termos no TeX com `\htmlClass{T1}{...}\htmlClass{T2}{...}`. `terme` [{em, ate, hi:[a,b] (brilha amarelo entre a e b), farbe}] (um por classe, na ordem). `marken` [{n (no do termo), text, em, ate, stufe, oben}] legenda com colchete sob/sobre o termo. `zaehler` {von,bis,em,dauer,stellen} troca `{{z}}` no tex por numero que sobe. `schrumpf` {em,dauer,vonY,vonS,nachY,nachS} formula grande que encolhe. Extras: `etikett` {text, unter, x, y, em} (selo "NDRC · 1946"), `balken` (objeto Balken), `deko`.
`{"comp":"Formel","props":{"kopf":{...},"formeln":[{"tex":"\\htmlClass{T1}{E}\\;=\\;\\htmlClass{T2}{\\tfrac12 m v^2}","groesse":120,"y":300,"terme":[{"em":0.3},{"em":1.2,"hi":[1.2,3]}],"marken":[{"n":2,"text":"Bewegungsenergie","em":1.6}]}]}}`

## Balken
Barras horizontais. Props (tambem como `deko` tipo `balken`): `balken`* [{wert*, farbe, label, unter, em, dur=0.9, einheit, stellen, y, von (faixa von..wert), text (valor fixo), innen (valor dentro da barra), pfx, pfxEnde, gestrichelt, teilung:{schritt,strich}+teilungEm (divisorias), ikon, dim, einheitGross, schrift:"mono"}], `x`=330, `breite`=1250, `max`*, `hoehe`=62, `y0`=300, `abstand`=150, `stellen`, `wertpt`, `skala`:"log" (+`min`, `max`, rotulo a esquerda), `achse` {ticks, y, einheit, label, em}, `grenze` {wert, label, text, farbe, em, y1} (linha-limite), `rahmenbox` {x,y,w,h,em,gruen:t (vira verde),label,label2,haken}, `faktor` {text,unter,x,y,em,unterEm}. O `y` da barra e o topo da barra; o label fica acima (modo linear) ou a esquerda (log).
`{"comp":"Balken","props":{"max":1750,"balken":[{"y":360,"wert":333,"label":"Bertha","einheit":"m/s","farbe":"#f2c14e"},{"y":660,"wert":1640,"label":"Paris","innen":true,"pfx":"~","einheit":"m/s","farbe":"#e8873a","em":1}],"faktor":{"text":"≈ 4,9 ×","unter":"fast fünfmal so schnell","em":2.5}}}`

## Vergleich
Colunas lado a lado (comparacao, conflito, certo/errado, "antes/depois"). `spalten`* [{x,y,w,h (auto), em, ate, farbe (borda), rahmen=3, fuell, dim, puls, mitte (centraliza), pad, kicker, klein, label, titel (rich), titelpt=96, anhang:{text,ate} (ex. "?" que cai), wert|bis (contador), wertpt=210, einheit, label2, unter, zeilen:[{k,v,farbe,em}], notiz}], `mitte` {text:"?"|typ:"chevron", x, y, groesse, farbe, em, ate}. Use `deko` para carimbo (`siegel`), cruz (`ikon kreuz`) e frase final (`text`).
`{"comp":"Vergleich","props":{"spalten":[{"farbe":"#d9483b","kicker":"ANNAHME A","titel":"v₀ = 815 m/s","zeilen":[{"k":"Reichweite","v":"25,8 km"}]},{"farbe":"#7fbf6a","kicker":"ANNAHME B","titel":"v₀ = 333 m/s"}],"deko":[{"typ":"siegel","text":"✓ passt","x":1690,"y":770,"farbe":"#7fbf6a","em":3}]}}`

## Zahl
Numero grande. Um numero: `wert`* (numero ou texto), `zaehler`:true ou `bis` (conta), `kicker`, `einheit`, `einheitInline`, `unter`, `groesse`=210, `farbe`, `x`/`y`/`ausr` (padrao centro). Varios: `zahlen` [{...}]. Combine com `deko` (circulos, texto, `?` com `pop`, `skala` de incerteza).
`{"comp":"Zahl","props":{"kicker":"ENERGIE PRO FLÄCHE","wert":244,"zaehler":true,"einheit":"MJ pro m²","unter":"33,9 MJ ÷ 0,1385 m²"}}`

## Kurve
Grafico de linha/curva: `ausdruck` (formula em `x` com log10 log sqrt pow sin cos exp abs min max PI) ou `punkte` [[x,y],...]; `xmin xmax ymin ymax`, `xticks`, `yticks`, `xlabel`, `titel`, `x`,`y` (origem), `breite`, `hoehe`, `kurvem`/`dur` (quando a curva corre), `marken` [{x, text, em, farbe}]; varias curvas em `kurven` [{ausdruck, farbe, em, dur, gestrichelt, marken}]. Tambem como `deko` tipo `kurve` (default menor, canto inferior direito).
`{"comp":"Kurve","props":{"ausdruck":"1000*exp(-x/6)","xmax":30,"ymax":1000,"xticks":[0,10,20,30],"xlabel":"km","titel":"Luftdichte","marken":[{"x":10,"text":"10 km"}]}}`

## Zeitleiste
`min`*, `max`*, `schritt`=1, `beschriftung`=5 (rotulo a cada n marcas), `y`=640, `x0`/`x1`; `ereignisse` [{wert, datum, text, farbe, em, oben:true, laenge}]; `spannen` [{von, bis, text, farbe, em, stufe}]; `lauf` {von, bis, em, dauer, label:"{z} Jahre", unter, farbe} (marcador que corre contando).
`{"comp":"Zeitleiste","props":{"min":1880,"max":1920,"ereignisse":[{"wert":1914,"datum":"1914","text":"Kriegsbeginn"}],"lauf":{"von":1914,"bis":1888,"label":"{z} Jahre"}}}`

## Foto
`bild`* (caminho em `public/`, ex. "f/foto.jpg"), `von`/`bis` {zoom, x, y (0..1)} Ken Burns ao longo da batida, `stil`: "voll" (tela cheia, vinheta, grao) | "rahmen" (foto impressa com borda, `w`,`h`,`y`,`winkel`), `filter` (CSS; padrao arquivo p&b/sepia; "keiner" = cores), `legende` (rich), `legendeKicker`, `legendeEm`, `quelle`, `deko`. Sem fundo caderno.
`{"comp":"Foto","props":{"bild":"f/loncin_1914_full.jpg","legende":"Fort de *Loncin*","quelle":"Quelle: Wikimedia Commons"}}`

## Zitat
Cartao de papel envelhecido. Ficha: `kicker`, `zeile`, `gross` (nome grande), `klein` (ano, com rabisco), `*Em` (tempos: zeileEm grossEm kleinEm). Citacao: `text`* (longo), `autor`, `quelle`. Comum: `x`,`y`,`w`=1000,`h`=560,`winkel`, `schrumpf` {em,dauer,x,y,scale,winkel} (encolhe para o canto; use o mesmo objeto em `deko` tipo `karte` nas batidas seguintes com `ab`).
`{"comp":"Zitat","props":{"kicker":"AUGENZEUGE","text":"Die Erde bebte …","autor":"Unbekannter Soldat","quelle":"Tagebuch, 1914"}}`
