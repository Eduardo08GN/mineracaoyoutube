# NOTAS da frente `boemia` (K18 Königgrätz)

As 20 batidas da família `boemia` (≈ 122 s) têm desenho próprio: o **mapa estratégico vivo da Boêmia, julho de 1866, em creme**.

## O que foi feito

### Arquivos
- `src/cenas/boemia.tsx`: a cena (`Cena`). Monta o papel do kit, um `ThreeCanvas` transparente com o relevo e a tinta SVG (`Folha`), projetada com a MESMA câmera.
- `src/cenas/boemia/base.ts`:
  - carga do `vetor.json` com `delayRender`;
  - altura do relevo na CPU (half-float decodificado uma vez, mesma conta do shader);
  - câmera de mapa (alvo lon/lat, distância, rumo, inclinação) com keyframes em `u` e `dolly` (nunca para);
  - projetor rápido (uma câmera por quadro; ponto atrás da câmera vira `NaN` e quebra a linha);
  - `pal()`, que dá o tempo absoluto da palavra da fala.
- `src/cenas/boemia/terreno.tsx`: relevo Copernicus (DADOS.boemia) em **3D raso** (exagero 9 na Boêmia inteira, 4 a 5 de perto, 2 na Europa), impresso como atlas:
  - Höhenschichten ocre;
  - sombra a sépia;
  - curvas de nível a lápis (100 m finas, 500 m mestras, somem onde adensam);
  - grão fixo no mapa;
  - bordas que se dissolvem no papel;
  - `nacht`: o papel esfria um pouco à noite. Não é tema escuro.
- `src/cenas/boemia/tinta.tsx`: peças de tinta do mapa:
  - rios (lápis-água; o citado "acende" e ganha nome ao longo do próprio rio, `textPath`);
  - fronteira de 1866 com Grenzkolorit;
  - `Estado` (lavado translúcido);
  - cidades;
  - `Bahn` (trilho com dormentes e trens que andam);
  - `Pfeil`: corpo **perfect-freehand** + ponta de pena;
  - `SplitPfeil`: geometria do **@orbat-mapper/control-measures `split-arrow`**;
  - `Regua`: conta km, com ticks de 5 km na escala do número;
  - `Anel` no chão;
  - `Front` com dentes;
  - `Brief`: a carta lacrada com o selo-acento, o Befehl;
  - `Regen`;
  - `Nota`: guia + escrita.
- `src/cenas/boemia/heere.ts`: as armadas com **data em cada ponto**. A linha central é suavizada pelo split-arrow do orbat, e a ponta anda no **relógio dos dias** (`horaDe`/`minutos`). Também guarda:
  - os recuos austríacos de 29/6 a 1/7;
  - os corpos da II. Armee em 3/7;
  - os dois split-arrows: `TEILEN` (Berlim → divide em 3) e `VEREINT` (as 3 se reúnem em Chlum).
- `src/cenas/boemia/comum.tsx`: `HeerZug` (seta + bloco Brockhaus + rótulo), `Gebiet` (nome de região em versaletes), `Gefecht` e `Marca`.
- `src/cenas/boemia/batidas.tsx`: câmera e tinta de cada uma das 20 batidas, com os gestos presos às palavras.
- `src/cenas/boemia/palavras.json`: as palavras das 20 batidas em tempo absoluto do vídeo, extraídas de `../voz/alinhamento.json` + `plano.kapitel[i].s`.
- `public/dados/boemia/vetor.json`: arquivo novo, 146 KB, com rios, fronteira, lugares, rota e estados de 1866.

### As batidas
| Batida | O que acontece (o mundo muda no plano) |
|---|---|
| b010 route | Teaser: a trilha Gitschin → Königinhof se escreve em 2,6 s, com a carta e chuva |
| b014 boehmen | Revela de Berlim/Wien até a Boêmia. Prússia e Áustria acendem na fala. Ferrovias com trens andando. As armadas saem das fronteiras e a Nordarmee sai de Olmütz. O Lehrbuch »Die Kräfte zusammenhalten« se escreve e é riscado a acento em "widerspricht" |
| b015 boehmen | "Es teilt seine Kräfte": split-arrow do orbat, um tronco de Berlim que se divide em três |
| b016 boehmen | As três armadas nomeadas uma a uma (Elbarmee/Sachsen, I. Armee/Lausitz, II. Armee/Schlesien), em tinta cheia só a citada. Travelling oeste → leste, baixando sobre o Riesengebirge em "über die Berge" (Trautenau e Nachod escritos) |
| b018 boehmen | "verwundbar": a Nordarmee no meio, com linhas interiores tracejadas até cada armada. Anel-acento e "Lücke" entre a I. e a II. Armee |
| b019 boehmen | "Plan … vereinigen": split-arrow tracejado a acento, três fluxos que se reúnem em Chlum. "auf dem Schlachtfeld" |
| b020 bistritz | 2/7 à noite: I. Armee e Elbarmee acendem na fala. A Bistritz acende e se escreve. Régua Horsitz → Sadowa "½ Tagesmarsch". A linha austríaca a lápis |
| b021 koeniginhof | Travelling até o Elba; II. Armee acende; régua Sadowa → Königinhof "rund 20 km"; o Elba acende e ganha nome |
| b022 route | Pull: Moltke em Gitschin (bloco + nota) e régua ao longo da estrada contando até 38 km |
| b023 boehmen | Órbita: três blocos tracejados com "?" atrás da Bistritz, "etwa 3 Korps" (acento), "Moltkes Annahme" |
| b026 boehmen | Combates de 26–29/6 com data; os recuos austríacos em tinta cheia; o bloco se esvazia (hachura) em "erschöpft"; "Böhmischer Kriegsschauplatz" |
| b032 bistritz | "nicht weiter zurück": as setas de recuo param (lavadas). A frente austríaca com dentes se desenha Ober-Prim → Lipa → Chlum → Nedelist. "Halt – hinter der Bistritz" |
| b037 route | A carta aparece em Gitschin. O telégrafo (fio + postes) se estende até Königinhof com "Telegraf?" e é riscado com X-acento em "Telegraf" |
| b038 route | O Ritt: a trilha se escreve com o relógio (00:10 → 02:30) e marca 1 Uhr e 2 Uhr. A carta é a ponta. "Graf Finckenstein – mit dem Befehl"; a chuva cresce em "Regen"; "fremdes Gelände" |
| b039 route | "Rund 38 km": régua-acento contando ao longo da trilha |
| b040 koeniginhof | Push em Königinhof; a carta chega às 03:50; "4 Uhr"; Blumenthal, Stabschef; anel |
| b041 koeniginhof | "5 Uhr": a ordem irradia do QG aos 4 corpos, que giram para o sul em "Aufbruch!" |
| b042 nordost | Os corpos partem na hora do GSW (12. Div 6 Uhr, 2. Garde 7, 1. Garde e V. 8, I. Korps 9½), cada seta nasce na sua hora |
| b043 nordost | Pull: as setas da II. Armee rumo ao anel do Schlachtfeld; "97.064 Mann" conta (acento); "nie gesehen" |
| b161 europa | Deutscher Bund (OHM, até 23/08/1866) em tinta. A Áustria "sai" (desliza e lava). O Bund "zerfällt" (o traço se rompe). A Prússia cresce para o contorno de out/1866 (anexações). Seta tracejada-acento até Paris, "1870" |

## Fontes e licenças (para a descrição; nada na imagem)
- **Relevo:** Copernicus DEM GLO-30 (já no DADOS.boemia).
- **Rios:** OpenStreetMap, Overpass, 06/11/2026, relações filtradas (Elbe, Aupa, Mettau, Bistritz, Iser, Adler, Stille e Wilde Adler, Cidlina, Moldau, Eger, Bober, Queis, Glatzer e Lausitzer Neiße), com nome alemão. **© OpenStreetMap-Mitwirkende (ODbL).**
- **Lugares:** Nominatim (OSM, ODbL), 06/11/2026, mais o `lugares.json` do dossiê. Nomes de 1866 em alemão.
- **Rota do mensageiro:** OSRM sobre OSM, estrada atual Jičín → Miletín → Dvůr Králové, 40,2 km. O número exibido é o do GSW (≈ 38 km, 5 Meilen); os ticks seguem a escala do número.
- **Estados de 1866:** OpenHistoricalMap (CC0):
  - Deutscher Bund 2916008, até 1866-08-23;
  - Kaiserthum Oesterreich 2694155;
  - Königreich Preußen 2745625 (03–09/1866) e 2694592 (10/1866, com as anexações);
  - Königreich Sachsen 2806952.

  A fronteira da Boêmia é o contorno da Áustria recortado.
- Os scripts de coleta e processamento ficaram em `D:/tmp/k18_boemia/scripts/geo.py` e os dados brutos em `D:/tmp/k18_boemia/geo/`.

## Problemas conhecidos / a conferir
1. **Ferrovias de 1866 (b014/b015): esquemáticas.**
   - Linhas retas entre estações reais. Prússia: Berlin–Frankfurt/O–Kohlfurt–Görlitz, Kohlfurt–Liegnitz–Breslau, Breslau–Schweidnitz–Waldenburg, Breslau–Brieg–Neisse e Halle–Leipzig–Dresden. Áustria: Wien–Lundenburg–Prerau–Olmütz–Böhm. Trübau–Pardubitz–Prag.
   - Todas existiam em 1866 (conhecimento geral), mas **o "5 linhas contra 1" do dossiê é [A CONFERIR]**, então nenhum número aparece na tela.
2. **Trajetos das armadas de 19/6 a 2/7: corredores esquemáticos**, ancorados nos combates conhecidos (Hühnerwasser e Podol 26/6; Trautenau e Nachod 27/6; Münchengrätz, Soor e Skalitz 28/6; Gitschin, Schweinschädel e Königinhof 29/6). Essas datas são conhecimento geral, **fora do dossiê** (que cobre 1–3/7). Conferir antes de ir ao ar.
3. **Pontos de partida dos corpos da II. Armee em 3/7 (b041–b043): esquemáticos.** Os horários são do GSW (dossiê). Os "3 Korps" de b023 são blocos hipotéticos (a crença de Moltke), sem posição real.
4. **"rund 20 km" (b021) é rótulo, não contador:** Sadowa–Königinhof em linha reta dá ≈ 17 km. Escolhi não exibir um número que contradiga a fala.
5. **"Getrennt marschieren, vereint schlagen" não foi escrito na tela:** o dossiê marca a frase como [LENDA/paráfrase]. O split-arrow de b019 mostra a ideia sem citar.
6. **Desempenho:**
   - o primeiro quadro de cada Chrome decodifica o DEM da Boêmia na CPU (10 M half-floats, ~1 s);
   - depois, cada quadro é uma malha 1024×628 + ~4 mil pontos SVG projetados;
   - não medi o tempo por quadro na G4. O bundle local levou de 5 a 9 min (máquina carregada).
7. **Pedido ao maestro/tinta:** nenhum. Uso `Escrita`, `Guia`, `Bloco` e `Numero` do kit sem mudar assinaturas. Se a frente tinta trocar o `Papel` por papel com grão, o mapa herda (o canvas é transparente).

8. **Polimento pendente (visto nos stills):**
   - b016: a seta II. Armee/Nachod (`II_B`) ondula, porque a curva do orbat passa por Reinerz e Schweinschädel.
   - b043: as setas dos corpos às 10:30 ainda são curtas (é o dado: partiram entre 6 e 9½ h).
   - b161: a Prússia lavada lê mais cinza que azul.
   - b014: Berlim e Wien ficam na borda do quadro no começo da revela.
9. **Stills locais (escala 0,5) em `D:/tmp/k18_boemia/`:**
   - `v_*.jpg`: última rodada;
   - `b0xx_u.jpg`: as 20 batidas;
   - `folha*.jpg` / `f_*.jpg`: folhas de contato.

   O script de stills em lote (um bundle, um Chrome, porta 3102) é `D:/tmp/k18_boemia/scripts/stills.mjs`.

## As 3 melhores (beat, u) para a vitrine
1. **(b016, 0.98)**: o Riesengebirge em 3D raso, a II. Armee atravessando as passagens (Trautenau/Nachod), a Nordarmee em Josephstadt, Lausitz e Schlesien escritos.
2. **(b019, 0.95)**: o plano de Moltke: o split-arrow tracejado a acento, três fluxos que se reúnem em Chlum, "auf dem Schlachtfeld", e as armadas reais ainda separadas.
3. **(b038, 0.6)**: o Ritt: a trilha que se escreve na noite, com a carta lacrada na ponta, "Graf Finckenstein – mit dem Befehl", 1 Uhr marcado e a chuva.

Reserva: (b015, 0.95), o tronco de Berlim que se divide em três ("drei Armeen").
