# Corrida DDR-Alltag (DE) — mineração rasa, 14/11/2026

Método: 14 buscas (5 grupos OR de termos x {90 dias por views, todos os tempos por views} + 4 "mais recentes"), região DE/de, + videos/channels. ~1.415 unidades de cota. 453 vídeos, 243 canais. Script: `scripts/coleta.py`, `rel.py`; dados: `dados/coleta.json`. Cobertura rasa: amostra por busca (50 resultados), não é o universo.
Classificação de tipo, formato e filtro é por regex no título/nome do canal (conferir os casos de borda). "Avatar/IA vs arquivo vs rosto" é inferência por título/duração/volume, sem ver os vídeos.

## Resumo
- Vídeos longos (>3 min) dos últimos 90 dias na amostra: 121, mediana **767 views**. Indep 117 (mediana 767), TV/mídia 4 (611; a TV pública pesa nos perenes: 23 dos 60 maiores).
- Dentro do filtro (cotidiano/técnica): 106 vídeos, mediana 814. Política/Stasi/fuga: 15, mediana 284 (e a cauda longa dos perenes tem 13 em 60 nesse tema).
- Shorts: 235 achados, mediana 1.319 em 90 dias; os maiores perenes são Shorts de comida/produto ("DDR Jägerschnitzel" 6,3 mi).
- Canais novos (desde 14/08/2025) com vídeo na amostra: **98**. 78 têm <1k inscritos, 16 têm 1–10k, **só 4 passam de 10k** (Zeitspringer 37k, auto-motorad 22k, DDR Enthüllt 12,7k, Ruli Taz 10,9k, Wendekind 9,3k no limite).
- Mediana de views (90 d) dos novos: <1k inscritos = 189; 1–10k = 1.458; >10k = 35.345.
- Coortes de criação: ago/25–fev/26: 14 canais, mediana 1.134, 0 acima de 10k; mar–jun/26: 19 canais, mediana 2.355, 3 acima de 10k (os vencedores); jul–nov/26: **65 canais, mediana 209**, 1 acima de 10k. Quem chegou depois de julho quase não pega views.
- Formatos (longos, 90 d, mediana): marca "o que virou / quem é dono hoje" (Der Ausverkauf, 8 min) **12.078**; imersão/arquivo/pessoal 1.168; lista de produtos 370 (mas os 40 min do DDR Enthüllt chegam a 148 mil); mecanismo puro 223.
- Vencedores atuais: (1) arquivo de TV/Super-8 sem narração (Deutrans 779 mil; TV pública); (2) listas longas "25 Dinge / 50 Snacks" do DDR Enthüllt (canal de 6 meses, 10–148 mil por vídeo, formato IA/narração sobre imagens, 40–77 min); (3) Der Ausverkauf: "Marca: heute gehört sie X" (4–37 mil, canal de 974 inscritos); (4) Zeitspringer "Ein Tag in Leipzig 1975" (imersão, 35 mil).

## Fase da corrida
- **Documentário explicativo (marca/mecanismo, 7–15 min, dado novo por vídeo): COMEÇO.** Só o Der Ausverkauf faz de verdade, e com canal minúsculo já tem vídeos de 30 mil+. Ninguém faz "Warum… – obwohl…" de técnica (Trabant, Plattenbau, Kaffeekrise) em formato explicado; Kaffeekrise e Mangelwirtschaft vêm só em lista ou curto.
- **Lista nostálgica longa (25 Dinge): MEIO, com pico de um líder** (DDR Enthüllt) e clones já nascendo.
- **Avatar "eu vivi na DDR" (testemunha idosa): ENXURRADA nos Shorts, vazio no longo.** Há ~15 canais com nomes falsos de pessoa e o mesmo Short "Bei uns haben die Frauen immer gearbeitet" (views 0–1.019): spam batido. O melhor avatar-nostalgia é DDR Nostalgie (jul/26, 2,9k inscritos, 186 mil num Short) e "Kicher Oma" (227 mil, humor). Em longa duração com testemunha idosa não achei ninguém acima de 20 mil: lacuna, mas o sinal do formato curto está saturado e Westpaket/Intershop viraram enxurrada (30+ canais criados desde set/26, quase todos <1k views).
- Risco: tema Westpaket/Intershop já está spammado por canais de IA de 0–300 inscritos.

## Filtro de tema
- Fora: Stasi, fuga, Mauer, Politbüro, Grenzsoldaten, "frühe DDR/Diktatur", Haft (ZDFinfo 432 mil, Welt Stasi 2,5 mi, Wandlitz 1,9 mi, Fluchten 7,5k no DDR Enthüllt).
- Dentro: comida, produtos, marcas, Trabant/Simson/Ikarus/Multicar, Kaufhalle, Westpaket/Intershop (consumo), Kindheit, Plattenbau, Preise, Reparaturtricks, Alltag 1975/1989.
- Zona cinza: "Politbüro nach dem Mauerfall" (43 mil), Grenzsoldaten (19 mil), "Rentensystem", "1989 Ost-Berlin": política, evitar.

## Melhor formato para nós
Explicativo curto-médio (8–15 min) no molde "marca/objeto do cotidiano + o que aconteceu depois + por quê" (Ausverkauf) cruzado com mecanismo técnico (Trabant, Plattenbau, Kaffeekrise, Intershop), em cima de arquivo de época. Ainda não competido. A lista de 40 min é boa de views mas é commodity IA. Avatar de testemunha idosa: só como complemento/Short, não como espinha.

## Títulos de exemplo
1. Warum kostete ein Trabant 13 Jahre Wartezeit – obwohl er fast nichts kostete?
2. Warum gab es in der DDR Kaffee mit Erbsen – obwohl man Westkaffee im Intershop kaufen konnte?
3. Plattenbau 1976: Wie die WBS 70 in 6 Stunden eine Wohnung baute

# Tabelas de evidência

### A. Top 30 vídeos longos (>3 min) dos últimos 90 dias

| vídeo | canal | tipo | criação | inscritos | views | idade | formato / filtro | link |
|---|---|---|---|---|---|---|---|---|
| Deutrans-2, Tour nach Österreich, DDR-Fernsehen 1989 | The120352 | indep | 2011-02 | 8120 | 779378 | 62d | pessoal/arquivo-imersao / dentro | https://youtu.be/L0X2RCK-s40 |
| Die frühe DDR: Zwischen Hoffnung, Aufstand und Diktatur / ZDFi | ZDFinfo Dokus & Reportag | TV/midia | 2017-05 | 803000 | 431849 | 42d | outro / fora(pol/Stasi/fuga) | https://youtu.be/X9zfjrpsX7k |
| MARCO'S Delle in neuem Glanz! Auf OSTALGIE und alte FREUNDSCHA | Die Autogesellschaft Dre | indep | 2017-08 | 303000 | 220910 | 29d | pessoal/arquivo-imersao / fora(pol/Stasi/fuga) | https://youtu.be/gERmvY3edho |
| 25 Dinge aus der DDR, die kein Wessi versteht — und jeder Ossi | DDR Enthüllt | indep | 2026-05 | 12700 | 147569 | 58d | nostalgia-produtos(lista) / dentro | https://youtu.be/vb9gOC8bRBY |
| 50 Snacks, die in der DDR üblich waren – aber sonst nirgendwo  | DDR Enthüllt | indep | 2026-05 | 12700 | 104046 | 61d | nostalgia-produtos(lista) / dentro | https://youtu.be/X1596kZMLYc |
| ICH BIN DEUTSCHER – UND BLEIBE OSSI ❤️ / Angekommen, ohne mein | Mehrfachamt | indep | 2013-01 | 1910 | 86186 | 83d | pessoal/arquivo-imersao / dentro | https://youtu.be/CWq0nK6e1Es |
| Собрал игровой ПК за 100.000 рублей на DDR5 — и отдам его подп | Inter Link | indep | 2021-03 | 120000 | 77233 | 88d | outro / dentro | https://youtu.be/kVm6UvoE6Nk |
| MZ TS 250 im Neckermann Versandhauskatalog DDR Ostalgie Zeitre | Auto Zeitreise | indep | 2025-02 | 6830 | 62647 | 84d | outro / dentro | https://youtu.be/bja31XoHbxA |
| DDR - Ostalgie! 77 Jahre, 1949-2026! Danke 🙏 für den Gastbeitr | SachsenKanal Sender Frei | indep | 2017-01 | 11100 | 48222 | 39d | outro / dentro | https://youtu.be/nTGiUeRwQfw |
| 25 Dinge, die in jedem DDR-Betrieb normal waren – heute undenk | DDR Enthüllt | indep | 2026-05 | 12700 | 47276 | 17d | nostalgia-produtos(lista) / dentro | https://youtu.be/vTtjwEVmmcw |
| Was wurde aus dem Politbüro nach dem Mauerfall? / DDR Doku | DDR Enthüllt | indep | 2026-05 | 12700 | 43767 | 86d | outro / fora(pol/Stasi/fuga) | https://youtu.be/GITSZPW3Q1c |
| Viba: Die Nougatstange aus dem Osten kaufte Hussel — wem gehör | Der Ausverkauf | indep | 2020-02 | 974 | 37045 | 23d | marca: o que virou (mecanismo) / dentro | https://youtu.be/nXELK41Bi2g |
| Zörbiger: Der einzige Rübensirup der DDR — heute gehört er Ita | Der Ausverkauf | indep | 2020-02 | 974 | 36216 | 10d | marca: o que virou (mecanismo) / dentro | https://youtu.be/pOg7_sbyzIk |
| 30 geniale Reparaturtricks, die nur DDR-Väter kannten / DDR Do | DDR Enthüllt | indep | 2026-05 | 12700 | 35799 | 10d | nostalgia-produtos(lista) / dentro | https://youtu.be/kdFwdpO3fbY |
| Das Leben in der DDR: Ein Tag in Leipzig 1975 | Zeitspringer | indep | 2026-04 | 37300 | 34891 | 4d | pessoal/arquivo-imersao / dentro | https://youtu.be/zyGEmubPD5k |
| DDR RETROKRIMIS DER 70er JAHRE  #krimihörspiel #ddr  #deutsch  | HÖR  MAL  ZU ® HÖRSPIELE | indep | 2019-10 | 74900 | 33191 | 86d | outro / dentro | https://youtu.be/RGjptsq4gwE |
| Spreewaldhof, Krügermann, Rabe: Welche Spreewaldgurke gehört n | Der Ausverkauf | indep | 2020-02 | 974 | 32726 | 71d | marca: o que virou (mecanismo) / dentro | https://youtu.be/TCTvs6TdWW8 |
| Meissen: Nie verkauft, bis heute volkseigen — 52 Millionen Eur | Der Ausverkauf | indep | 2020-02 | 974 | 32679 | 14d | marca: o que virou (mecanismo) / dentro | https://youtu.be/dA08FG0VwsQ |
| DDR 3 - Importtraktoren (DDR DOKU, TRAKTOREN Doku, LANDTECHNIK | TemporaTV - Dokumentatio | indep | 2014-05 | 89000 | 24950 | 60d | outro / dentro | https://youtu.be/l3JeH6j8x9c |
| Warum Kinder in der DDR so frei aufwuchsen wie nie wieder / DD | DDR Enthüllt | indep | 2026-05 | 12700 | 23450 | 15d | mecanismo/explicacao / dentro | https://youtu.be/kyiRibqBXgI |
| 30 Kuchen, die in der DDR üblich waren – aber sonst nirgendwo  | DDR Enthüllt | indep | 2026-05 | 12700 | 21873 | 7d | nostalgia-produtos(lista) / dentro | https://youtu.be/D9hCmt6f7P0 |
| Was Wurde Aus Den Grenzsoldaten Nach 1990? / DDR Doku | Kasernenzeit | indep | 2008-10 | 499 | 18971 | 11d | outro / fora(pol/Stasi/fuga) | https://youtu.be/gq67_fsPXsU |
| Riesaer Zündhölzer: Deutschlands letzte Streichholzfabrik — we | Der Ausverkauf | indep | 2020-02 | 974 | 17735 | 53d | marca: o que virou (mecanismo) / dentro | https://youtu.be/MqEiDvPMXpc |
| Florena: Die Nivea des Ostens — heute gehört sie dem Nivea-Kon | Der Ausverkauf | indep | 2020-02 | 974 | 14301 | 33d | marca: o que virou (mecanismo) / dentro | https://youtu.be/fuCIel3V0Z0 |
| 25 vergessene DDR-Gerichte, die heute niemand mehr bestellt /  | DDR Enthüllt | indep | 2026-05 | 12700 | 14186 | 64d | nostalgia-produtos(lista) / dentro | https://youtu.be/U0bQ8L323YQ |
| Die Auktion #krimihörspiel  WERBEFREI  #ostalgie   1964  #ddr  | HÖR  MAL  ZU ® HÖRSPIELE | indep | 2019-10 | 74900 | 13660 | 30d | outro / dentro | https://youtu.be/4s4KBFw2--M |
| PIKO: Die Eisenbahn unterm Weihnachtsbaum — wer baut sie heute | Der Ausverkauf | indep | 2020-02 | 974 | 13251 | 50d | marca: o que virou (mecanismo) / dentro | https://youtu.be/nISqrmmQCG4 |
| DDR Alltag im Umbruch Leipzig Ende 1989 | Nostalgie Garage Sachsen | indep | 2011-11 | 35800 | 12652 | 42d | pessoal/arquivo-imersao / dentro | https://youtu.be/QUDMyAPNoQ4 |
| DDR-Geschichte: Der INTERSHOP in Gumtow  an der F5  Was ist he | Mein Multicar Channel | indep | 2015-10 | 7010 | 12647 | 7d | marca: o que virou (mecanismo) / dentro | https://youtu.be/gmZEtE3D2X4 |
| Kathi, Filinchen, Burger Knäcke: Welche Marke gehört noch dem  | Der Ausverkauf | indep | 2020-02 | 974 | 11509 | 65d | marca: o que virou (mecanismo) / dentro | https://youtu.be/KCSTeSMyuoU |

### B. Top 30 perenes (todos os tempos, >3 min)

| vídeo | canal | tipo | criação | inscritos | views | idade | formato / filtro | link |
|---|---|---|---|---|---|---|---|---|
| DIE STASI IN DER DDR: Wie das Ministerium für Staatssicherheit | WELT Doku | TV/midia | 2016-06 | 363000 | 2560763 | 1035d | outro / fora(pol/Stasi/fuga) | https://youtu.be/5A0uch3i-lU |
| Honecker, Ulbricht, Mielke - die Wandlitz-Siedlung / Geheimnis | rbb Doku | TV/midia | 2021-06 | 202000 | 1941246 | 1327d | outro / fora(pol/Stasi/fuga) | https://youtu.be/RJ2y_Onf3h8 |
| Gründung der Deutschen Demokratischen Republik (DDR) / Geschi | MrWissen2go Geschichte / | TV/midia | 2016-09 | 1500000 | 1425299 | 2816d | outro / dentro | https://youtu.be/OQilRzj8oH0 |
| DDR Alltag 1982 - Doku, Westfernsehen in Ostdeutscher Kleinsta | JWSport TV mit Jeffrey,  | indep | 2011-03 | 6050 | 1095887 | 1001d | pessoal/arquivo-imersao / dentro | https://youtu.be/WDgVZ-IeNDM |
| So war der Alltag in der DDR / Geschichte | MrWissen2go Geschichte / | TV/midia | 2016-09 | 1500000 | 1056449 | 2654d | pessoal/arquivo-imersao / dentro | https://youtu.be/WfKy7bkcrOQ |
| Leben in der DDR / Das Leben im geteilten Deutschland - Dokume | Alfred Fischer | indep | 2014-11 | 21600 | 1045209 | 3937d | outro / dentro | https://youtu.be/6Is0DvO1iQU |
| Leben in der DDR: Einkaufen in der Kaufhalle & Der Beruf der W | footage berlin - rbb med | TV/midia | 2015-12 | 47800 | 1034320 | 596d | marca: o que virou (mecanismo) / dentro | https://youtu.be/_uRZ7Jwzs2o |
| Die deutsche Teilung: Das müsst ihr wissen | MrWissen2go Geschichte / | TV/midia | 2016-09 | 1500000 | 1027301 | 1920d | outro / dentro | https://youtu.be/KX8WrWKqbHE |
| (Prost) Mahlzeit DDR / Ostalgie vor 20 Jahren | Heico Homburg | indep | 2018-08 | 1200 | 877609 | 1102d | outro / dentro | https://youtu.be/0MvuUW-tQjw |
| DDR-Alltag der 80er Jahre, seltene private 8-MM-Aufnahmen | Nostalgie Garage Sachsen | indep | 2011-11 | 35800 | 865152 | 1009d | outro / dentro | https://youtu.be/sCuMxt_0gNk |
| Deutrans-2, Tour nach Österreich, DDR-Fernsehen 1989 | The120352 | indep | 2011-02 | 8120 | 779378 | 62d | pessoal/arquivo-imersao / dentro | https://youtu.be/L0X2RCK-s40 |
| Geniale Fluchtversuche aus der DDR / Terra X | Terra X History | TV/midia | 2016-10 | 1430000 | 776693 | 272d | outro / fora(pol/Stasi/fuga) | https://youtu.be/bdXDP3kQUkY |
| DDR-Alltag / Berlin-Friedrichshagen 1987 / Kaufhalle, Bölsches | footage berlin - rbb med | TV/midia | 2015-12 | 47800 | 696896 | 876d | outro / dentro | https://youtu.be/cs4CWeElpzk |
| DDR-Produkte - langlebig & gut? Werbung im DDR-Fernsehen | Jac Biermann Dokus | indep | 2010-02 | 17700 | 640635 | 2588d | nostalgia-produtos(lista) / dentro | https://youtu.be/l3Norqm3aAw |
| Nachtleben in der Hauptstadt der DDR / Doku / Berlin erleben | rbb | TV/midia | 2006-01 | 380000 | 565759 | 232d | outro / dentro | https://youtu.be/EtMWfGj01n8 |
| wissen2go: Die DDR erklärt | MrWissen2go | TV/midia | 2012-05 | 2410000 | 540994 | 5054d | mecanismo/explicacao / dentro | https://youtu.be/tDIwB7uaRHk |
| (Doku in HD) ZDF-History - Der Todesstreifen - Anatomie einer  | MegaBob | indep | 2017-02 | 1430 | 519712 | 3536d | outro / fora(pol/Stasi/fuga) | https://youtu.be/SIg2G40sGl8 |
| Der erste Rasthof der DDR - Doku | Dokus aus Sachsen, Sachs | indep | 2017-05 | 1960 | 509025 | 2736d | outro / dentro | https://youtu.be/6trK2HZuUjE |
| Fotoshooting DDR: Bilder zwischen Propaganda und Alltag / Doku | Irgendwas mit ARTE und K | TV/midia | 2014-12 | 767000 | 479112 | 274d | outro / dentro | https://youtu.be/LNOHAxzCDSU |
| Reichsbahner Jahn--Leben in der DDR 1985-- | Karl Bönisch | indep | 2010-01 | 8040 | 455924 | 4564d | outro / dentro | https://youtu.be/4Lwz6-CVXMk |
| Die frühe DDR: Zwischen Hoffnung, Aufstand und Diktatur / ZDFi | ZDFinfo Dokus & Reportag | TV/midia | 2017-05 | 803000 | 431849 | 42d | outro / fora(pol/Stasi/fuga) | https://youtu.be/X9zfjrpsX7k |
| Jagdflugzeuge der DDR Doku | Dokust | indep | 2013-10 | 5230 | 419918 | 3873d | outro / dentro | https://youtu.be/jaaenJKeSQQ |
| Ackerbau und Sozialismus, Landwirtschaft in der DDR | Sachsen_Andi - Ostalgie  | indep | 2014-11 | 2330 | 385127 | 842d | outro / fora(pol/Stasi/fuga) | https://youtu.be/i_QDngjA5nM |
| FKK und mehr...    Wie das wahre Leben in der DDR war | DDR Kanal | indep | 2014-08 | 8130 | 383412 | 4320d | outro / dentro | https://youtu.be/6Zg3ZeKWVh0 |
| Alltag in der DDR - Doku 1981 | dokupedia5311 | indep | 2020-09 | 593 | 316874 | 2104d | pessoal/arquivo-imersao / dentro | https://youtu.be/PBo1VL50QAI |
| Deutschland - Wie die DDR wirklich war2 - deutsch | Teleguen - - - | indep | 2013-11 | 157000 | 292396 | 3918d | pessoal/arquivo-imersao / dentro | https://youtu.be/FDs3CHZmSyI |
| ALEMANIA y la NOSTALGIA por el PASADO ORIENTAL | Gustavo Llusa | indep | 2020-09 | 495000 | 252900 | 1413d | outro / dentro | https://youtu.be/FnqKo9q8fSU |
| MARCO'S Delle in neuem Glanz! Auf OSTALGIE und alte FREUNDSCHA | Die Autogesellschaft Dre | indep | 2017-08 | 303000 | 220910 | 29d | pessoal/arquivo-imersao / fora(pol/Stasi/fuga) | https://youtu.be/gERmvY3edho |
| Wenn die Eltern Fremde sind - Kinder in DDR-Wochenheimen - Fro | ZDF | TV/midia | 2020-01 | 155000 | 218861 | 2827d | outro / dentro | https://youtu.be/2DTaJCy8Qm8 |
| VEB Gleichschritt · Die Nationale Volksarmee der DDR erklärt / | ARD History | TV/midia | 2015-09 | 276000 | 217012 | 686d | mecanismo/explicacao / dentro | https://youtu.be/vaI81x-yT7o |

### C. Canais novos (criados desde 14/08/2025): melhores vídeos longos em 90 dias

| vídeo | canal | tipo | criação | inscritos | views | idade | formato / filtro | link |
|---|---|---|---|---|---|---|---|---|
| 25 Dinge aus der DDR, die kein Wessi versteht — und jeder Ossi | DDR Enthüllt | indep | 2026-05 | 12700 | 147569 | 58d | nostalgia-produtos(lista) / dentro | https://youtu.be/vb9gOC8bRBY |
| 50 Snacks, die in der DDR üblich waren – aber sonst nirgendwo  | DDR Enthüllt | indep | 2026-05 | 12700 | 104046 | 61d | nostalgia-produtos(lista) / dentro | https://youtu.be/X1596kZMLYc |
| 25 Dinge, die in jedem DDR-Betrieb normal waren – heute undenk | DDR Enthüllt | indep | 2026-05 | 12700 | 47276 | 17d | nostalgia-produtos(lista) / dentro | https://youtu.be/vTtjwEVmmcw |
| Was wurde aus dem Politbüro nach dem Mauerfall? / DDR Doku | DDR Enthüllt | indep | 2026-05 | 12700 | 43767 | 86d | outro / fora(pol/Stasi/fuga) | https://youtu.be/GITSZPW3Q1c |
| 30 geniale Reparaturtricks, die nur DDR-Väter kannten / DDR Do | DDR Enthüllt | indep | 2026-05 | 12700 | 35799 | 10d | nostalgia-produtos(lista) / dentro | https://youtu.be/kdFwdpO3fbY |
| Das Leben in der DDR: Ein Tag in Leipzig 1975 | Zeitspringer | indep | 2026-04 | 37300 | 34891 | 4d | pessoal/arquivo-imersao / dentro | https://youtu.be/zyGEmubPD5k |
| Warum Kinder in der DDR so frei aufwuchsen wie nie wieder / DD | DDR Enthüllt | indep | 2026-05 | 12700 | 23450 | 15d | mecanismo/explicacao / dentro | https://youtu.be/kyiRibqBXgI |
| 30 Kuchen, die in der DDR üblich waren – aber sonst nirgendwo  | DDR Enthüllt | indep | 2026-05 | 12700 | 21873 | 7d | nostalgia-produtos(lista) / dentro | https://youtu.be/D9hCmt6f7P0 |
| 25 vergessene DDR-Gerichte, die heute niemand mehr bestellt /  | DDR Enthüllt | indep | 2026-05 | 12700 | 14186 | 64d | nostalgia-produtos(lista) / dentro | https://youtu.be/U0bQ8L323YQ |
| 30 vergessene Hobbys, die aus DDR-Jungs echte Männer machten / | DDR Enthüllt | indep | 2026-05 | 12700 | 10806 | 22d | nostalgia-produtos(lista) / dentro | https://youtu.be/-BGqAI3vOrc |
| Die 5 spektakulärsten Fluchten aus der DDR / DDR Doku | DDR Enthüllt | indep | 2026-05 | 12700 | 7544 | 87d | outro / fora(pol/Stasi/fuga) | https://youtu.be/Ij5F36dVyLo |
| 25 DDR-Weihnachtstraditionen, die fast verschwunden sind / DDR | DDR Enthüllt | indep | 2026-05 | 12700 | 6615 | 4d | nostalgia-produtos(lista) / dentro | https://youtu.be/_C8suGuGetE |
| So sah das Leben in der DDR in den 80ern WIRKLICH aus | Damals in Ost und West | indep | 2026-10 | 13 | 3093 | 29d | pessoal/arquivo-imersao / dentro | https://youtu.be/L2R3gBY8kXg |
| 15 Überlebenstricks aus der DDR-Mangelwirtschaft, die heute ni | Zeitkapsel | indep | 2026-07 | 1500 | 2713 | 87d | nostalgia-produtos(lista) / fora(pol/Stasi/fuga) | https://youtu.be/taNholl8ELA |
| DDR-Alltag: WOHNEN in den 60er Jahren (heue NICHT vorstellbar) | DDR Nostalgie | indep | 2026-07 | 2910 | 1909 | 85d | outro / dentro | https://youtu.be/k18JroX7yds |
| So war das Leben in der DDR – erinnerst du dich noch? | 박세정 | indep | 2026-10 | 16 | 1168 | 29d | pessoal/arquivo-imersao / dentro | https://youtu.be/kOg8dN19UFQ |
| Das Westpaket: Warum ein Pappkarton in der DDR magisch war | ALS DIE WELT STILLSTAND | TV/midia | 2026-08 | 88 | 1155 | 31d | mecanismo/explicacao / dentro | https://youtu.be/sGGJQutLrW0 |
| Was im Westpaket lag und warum es drüben jeder geliebt hat | Damals bei uns | indep | 2026-10 | 2250 | 1008 | 19d | outro / dentro | https://youtu.be/PJo2FVGHSNA |
| Wer hat Ihr Westpaket geöffnet? | Grenzsäule | indep | 2026-10 | 116 | 767 | 30d | outro / dentro | https://youtu.be/b-nn4MScOjc |
| 1989 in Ost-Berlin – DDR-Alltag vor dem Mauerfall | Dr. Friedrich Richter | indep | 2026-06 | 5760 | 744 | 7d | nostalgia-produtos(lista) / fora(pol/Stasi/fuga) | https://youtu.be/ri5DgYpOsCc |
| Der letzte Traum 🫧 – Ostalgie Synth-Pop (80s Euro Disco Edit - | BETONBLUT | indep | 2026-01 | 2380 | 714 | 30d | outro / dentro | https://youtu.be/YCSPR9vm1ZI |
| DDR-Alltag: 15 Dinge, die es nur im Osten gab | Verflossene Zeit | indep | 2026-10 | 4 | 531 | 30d | nostalgia-produtos(lista) / dentro | https://youtu.be/qRWiyIyvDsM |
| Damals in der DDR – Unser Trabi, Unsere Jugend ❤️ | Das kleine Jahreszeitend | indep | 2026-05 | 1070 | 356 | 11d | pessoal/arquivo-imersao / dentro | https://youtu.be/mmUEfNNHH8c |
| Das Leben hinter der Mauer: Der Alltag in Ostdeutschland, 1961 | Geschichte Unzensiert | indep | 2026-09 | 19 | 284 | 41d | pessoal/arquivo-imersao / fora(pol/Stasi/fuga) | https://youtu.be/Sh7p6S9IWtE |
| Wie war das Leben in der DDR wirklich? Was Sie dir nicht erzäh | Nexo | indep | 2026-09 | 50 | 273 | 42d | outro / dentro | https://youtu.be/-1nfZ5wqdqk |

Nota: "avatar/IA vs arquivo vs rosto" não foi verificado nos vídeos; DDR Enthüllt, DDR Nostalgie, Zeitspringer e os clones de Westpaket são prováveis IA/narração sobre imagem (inferência por volume e títulos). Der Ausverkauf: narração sobre imagens de marca (8 min).
