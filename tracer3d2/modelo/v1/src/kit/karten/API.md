# Familia karten (mapas 2D/2,5D)

Cenas: `Karte` (geral), `KarteDetail` (ortofoto de local + vetor), `KarteWelt` (mapa-mundi/regiao de contexto). As tres usam as MESMAS props; as duas ultimas so mudam o ponto de partida (camera, raster).
Tudo e JSON em `src/cenas/karten.json`: `{"03_05": {"comp":"Karte","props":{...}}}`. Coordenadas sao `[lon, lat]`. Nada de codigo.

## Tempo (vale para todo campo `em`, `ate`, `t`, `bis`...)
- numero = segundos locais da batida | `{"wort":"Granate","nach":0,"plus":0.2}` = palavra da fala (busca a partir de `nach` s locais; `"s":660` = a partir do segundo ABSOLUTO do video; `"k":8` = a partir de 8 s depois do inicio do capitulo; `"fb":663.5` = absoluto de reserva se a palavra nao existir)
- `{"s":652.84}` = segundo absoluto do video | `{"k":3.2}` = segundo do capitulo. Use absoluto quando uma cena cobre varias batidas seguidas (a mesma `vorlage` em cada uma = camera e camadas continuas, sem corte).

## Karte: props
| prop | tipo / padrao | |
|---|---|---|
| `kamera` | obrigatoria. `{lon,lat,km,zoom?:0.93,drift?:[dlon,dlat]}` = deriva lenta durante a batida (km = km por pixel; 0.0165 = cidade, 0.1 = regiao, 0.8 = Europa) ou lista `[[Zeit,lon,lat,km],...]` = voo por keyframes (zoom logaritmico, suave) |
| `phi0` | latitude da projecao, padrao = lat da 1a chave |
| `grund` | `{modus:'auto'\|'einfach', rasters?, netz:0.7, grenzen:0.8, fluesse:'auto', heller?, grenzenDatei?, fluesseDatei?}`. `auto` = rasters de `public/karten2/raster.json` (mundo + relevo/satelite que entra ao dar zoom). `einfach` = so fundo escuro + grade. netz/grenzen/fluesse/heller aceitam numero ou keyframes `[[Zeit,v],...]`. Raster proprio: `rasters:[{bild:'geo/x.jpg',grenzen:[oeste,sul,leste,norte],o?,rand?,filter?:'css',px?:[aparece,cheio]}]` |
| `titel` | `"texto"` ou `{text,unter,em,ate}` (canto sup. esq.) |
| `rahmen` | `false` ou `{massstab:true,koord:false}` (escala; some sozinha se houver `zeitleiste`) |
| `quelle` | texto da linha de fonte (rodape esq.). Obrigatorio dar credito dos dados |
| `vignette`,`korn` | 0.75 / 0.22 |
| `ebenen` | lista de camadas (abaixo), desenhadas na ordem |
| `vorlage` | nome de modelo em `karten.json` -> `"_vorlagen"`. Herda props; `ebenen` do filho sao anexadas; camada com o mesmo `id` SUBSTITUI a do modelo (`"erbt":true` = so sobrescreve os campos citados, `"weg":true` = remove) |

## Camadas (`ebenen[]`), campos comuns
`typ`, `id?`, `em` (entrada, padrao 0), `ate?` (saida), `blende` (0.4 s fade in), `blendeAus` (fade out), `o` (opacidade 0..1 ou keyframes `[[Zeit,v],...]`), `dauer` (s de progresso/desenho).
Lista de itens com entrada escalonada: `liste:[{...},{...}]` (cada item sobrescreve campos), `stufe` (s entre itens) ou `bis` (+ `n`: espaca igualmente de `em` ate `bis`), `letzte:{...}` (sobrescreve o ultimo).
Pontos podem vir de arquivo: `datei:'forts_liege.geojson', filter:{typ:'fortin'}` (pontos), `kranz:{mitte,n,km,saat,streu}` (anel gerado), `aus:'<id de outra camada>'`; ordem: `ordnung:{winkel:[lon,lat]}` (angulo em volta do centro) ou `reihenfolge:[ids]`.
Referencia de lugar em vez de coordenada: `"@orte_bertha.geojson:Aachen"` (id ou comeco do nome) ou `{"von":[lon,lat],"az":215,"km":6}`.

| `typ` | para que | campos principais |
|---|---|---|
| `ort` | nome pequeno de lugar (estilo atlas) | `ll,name,seite:'r'\|'l',gross:21` |
| `marke` | ponto + rotulo | `ll,titel,unter,farbe,r:7,seite:'r'\|'l'\|'o'\|'u',gross:30,ring,dx,dy` |
| `ziel` | alvo (aneis); com impacto | `ll,r:46,farbe,drehen:graus/s,treffer:Zeit` (flash + onda no impacto) |
| `blitz` | impacto/disparo isolado ou serie | `ll,farbe,r,ringR,dauer`; serie: `n:8,bis:Zeit,letzte:{farbe,r,ringR}` |
| `kreis` | alcance em circulos (km reais) | `ll,km,text:'6 km',az:215,farbe,breite,dash,fill,dauer,modus:'wachsen'\|'puls'` (`puls`: `periode,ringe`) |
| `lineal` | regua de distancia A->B com contador | `a,b,schrittKm:10,farbe,text,seite:1\|-1,textGroesse,zaehler:false` (contador em km inteiros: use `zaehler:false` abaixo de 2 km) |
| `linie` | linha que se desenha | `pts:[ll..]` ou `{datei,filter,lat:[a,b],sortiere:'lat',glatten:4}`; `farbe,breite,dash,glow,kopf,verlauf` |
| `front` | frente de batalha que avanca | `pts`, `dann:[{pts,t:Zeit,dauer}]` (linha migra para a seguinte, a antiga fica tracejada), `farbe,breite,glow` |
| `pfeil` | seta grossa de movimento | `pts,breite:46,farbe,fill,glatt,verlauf:[[Zeit,0..1]]` |
| `strahl` | linha fina com ponta (liga A a B) | `a,b,bog:px (curva),farbe,breite,dash,glow,spitze` (aceita `liste`) |
| `bogen` | arco de alcance (azimute) | `ll,km,az:graus\|zentrum:ll (aponta para fora),halb:55,farbe` (aceita datei/liste) |
| `ring` | poligono fechado pelos pontos de outra camada | `aus:'<id>'`,`farbe,breite,dash,glow,puls,fill` |
| `geojson` / `flaeche` | qualquer GeoJSON (ou JSON em metros do repo) ou `pts` | `datei,filter,stil:{fill,stroke,breite,dash,glow},kappeOst:[[lat,lonMax]..]` (corta a borda leste = fronteira historica), `dauer` desenha linhas |
| `symbol` | simbolos com estados (forts, unidades) | `datei\|liste\|kranz,form:'dreieck'\|'quadrat'\|'kreis'\|'raute',formProp+formen (forma por propriedade),gefuelltProp+gefuelltWert,s,farbe,zahl:'nr',namen:{em,groesse,zentrum,o,sub:[regex,subst],kurz:{id:txt}}`, `ereignisse:[{ids\|wo:{prop:valor},art:'fall'\|'rot'\|'hell'\|'dim'\|'intakt'\|'blitz'\|'name',t:Zeit,dauer,wert,bis,puls:{freq,tief},stufe}]` |
| `kreuz` | cruzamentos rota x arco (marcador X) | `routen:[pts,pts],bogen:'<id de camada bogen>'` |
| `fleck` / `hauch` / `flamme` / `zeichen` | mancha de cidade / elipse de incerteza / chama / circulo com texto | `ll,km` / `ll,a,b,winkel` / `ll,dx,dy,s` / `ll,text,r,dy` |
| `text` | texto (tela `xy:[x,y]` ou no mapa `ll`+`dx,dy`) | `klein,gross,groesse:54,farbe,align:'l'\|'c'\|'r',mono,zaehltAus:'<id>'` (`{n}` = itens ja visiveis), `atmen` |
| `stempel` | carimbo de data inclinado | `xy,text,unter,farbe,dreh,groesse` |
| `gebiet` | nome de pais/regiao em letras largas | `ll,text,groesse,farbe` |
| `zahl` | numero grande a direita | `label,wert` ou `zaehlt:{von,bis,dauer\|endeT,dec,praefix,suffix,stufen}` ou `zaehltAus:'<id>'`, `phasen:[{t,farbe,suffix}],top,right,groesse,farbe,unter` |
| `datum` | calendario grande (so vai para frente) | `anker:[{t:Zeit,wert:n}],fmt:'{nn}.08.',kopf:'AUGUST 1914',right,top` |
| `zeitleiste` | linha do tempo inferior | `von,bis,ticks,fmt,kopf,datum:'<id datum>',symbole:'<id symbol>' (cada fort cai no dia certo, `tagProp`),baender:[{a,b,text,farbe,em,dauer}],marke:{tag,text,em}` |
| `uhr` | relogio de periodo do dia | `schritte:[{t,wert:0..1,text,dauer}],x,y` |

## Exemplo (batida 03_07: raio de 6/10 km + fortes)
```json
{"03_07": {"comp":"Karte","props":{
  "kamera":{"lon":5.585,"lat":50.642,"km":0.0225,"zoom":0.92},
  "titel":{"text":"Lüttich","unter":"DER RING · 12 FORTS"},
  "quelle":"Relief: Copernicus DEM · Forts: © OpenStreetMap-Mitwirkende",
  "ebenen":[
   {"typ":"kreis","ll":[5.57308,50.64473],"farbe":"#f2c14e","dash":"12 8","em":{"wort":"sechs","nach":1.5},
    "liste":[{"km":6,"text":"6 km"},{"km":10,"text":"10 km","em":{"wort":"sechs","nach":2.0}}]},
   {"typ":"symbol","datei":"forts_liege.geojson","s":17,"formProp":"typ","formen":{"grand fort":"dreieck","fortin":"quadrat"},
    "gefuelltProp":"typ","gefuelltWert":"grand fort","namen":{"em":0.3,"zentrum":[5.57308,50.64473],"sub":["^Fort (de |d')",""]}},
   {"typ":"zahl","label":"GROSSE FORTS ▲","wert":"6","top":120,"right":90}]}}}
```
Padroes uteis: camera sempre com deriva (nunca parada); entradas em palavras da fala; `grund` padrao ja fica bom; so falta `kamera` e `ebenen`.
Dados: `public/geo/*` (grenzen, fluesse, forts_liege, orte_bertha, luettich_strassen, maas, fotos...). Novos arquivos: `datei` e o nome dentro de `public/geo` (ou caminho `pasta/arquivo` a partir de `public/`). Arquivos de fundo: `public/karten2/raster.json` (nome -> limites).
Quem precisar de modelo reutilizavel por capitulo: ver `_vorlagen` em `src/cenas/karten.json` (ex.: `kap8` = fortes que caem + calendario + linha do tempo).
