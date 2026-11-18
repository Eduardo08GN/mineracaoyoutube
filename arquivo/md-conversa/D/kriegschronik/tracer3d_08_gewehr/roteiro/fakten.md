# Warum gewann Preußen 1870 mit dem schlechteren Gewehr? — dossiê de fatos (Kriegsmomente / Tracer3D 08)

Pesquisa de 29/10/2026. Espinha: o Chassepot era melhor que o Dreyse; a Mitrailleuse foi segredo mal usado; a artilharia Krupp (aço, retrocarga, espoleta de percussão) venceu os La Hitte de bronze (antecarga, espoleta de tempo); Generalstab, ferrovias, Auftragstaktik; clímax em Saint-Privat (18/08/1870); a lição "artilharia primeiro" (Sedan). Estratégia e engenharia na espinha; números só como prova curta.

Marcas: **[confirmado]** = ≥2 fontes independentes ou fonte primária lida · **[1 fonte]** · **[div]** = fontes divergem (faixa + escolha) · **[est]** = estimativa · **[calc]** = calculado por mim · **[M]** = modelo/interpolação (nunca dizer como fato) · **[NÃO ENCONTRADO]** · **[fraco]** = fonte sem referências.
Unidades: Wawro usa jardas e "paces"; converti (1 jd = 0,914 m; 1 Schritt prussiano ≈ 0,75 m) e marquei [calc].
Nenhuma atrocidade é afirmada. A igreja de St. Privat (≈500 feridos franceses, ~100 salvos; de.wikipedia) fica só como [1 fonte], não usar sem mais.

## Fontes (códigos) e como foram lidas

| Cód. | Fonte | Como li |
|---|---|---|
| **WAW** | Geoffrey Wawro, *The Franco-Prussian War* (Cambridge UP, 2003) | **texto integral** (PDF da Cambridge baixado; extraído para `dados/_fontes_tmp/wawro.txt`, só para conferência interna, é obra protegida). Páginas = cabeçalhos correntes do livro |
| **MOL** | Moltke, *Geschichte des deutsch-französischen Krieges 1870–71* (1891), trad. inglesa (Forbes) — Project Gutenberg #36209 | texto integral (`dados/_fontes_tmp/moltke_forbes.txt`); é o relato oficial resumido do próprio Moltke (base: Generalstabswerk). Sem paginação do original: cito capítulo |
| **HOH** | Kraft Prinz zu Hohenlohe-Ingelfingen, *Briefe über Artillerie* (1887), trad. N. L. Walford, *Letters on Artillery* (Londres 1890/1898) — archive.org `cu31924030759124` | texto integral (`dados/_fontes_tmp/hohenlohe_letters.txt`); testemunha: comandava a artilharia da Garde em St. Privat e Sedan. O alemão original **não** foi consultado |
| **EN-GRA / DE-GRA** | Wikipedia en "Battle of Gravelotte" (refs. Howard 1991, Moltke 1892, Hindenburg 1921, Ollier 1873) · Wikipedia de "Schlacht bei Gravelotte" | página lida |
| **EN-CHA / EN-DRE / DE-ZNG / EN-MIT / EN-C64 / EN-LHS / EN-GEW / EN-HIN** | Wikipedia en "Chassepot" (Walter 2006, Ford 1998, Flatnes 2013) · "Dreyse needle gun" (Finze 2016, Förster & Nagler 1997) · de "Zündnadelgewehr" (Eckhardt/Morawietz 1957, Löbell 1867) · "Reffye mitrailleuse" (Reboul 1910, Shann 1991, Nicolle) · "C64 (field gun)" (Solka/Pavlović 2004, Müller 2013) · "La Hitte system" · "Gewehr 71" · "Gustav Eduard von Hindersin" (Britannica 1911) | páginas lidas; só apoio, citam livros que não vi |
| **ADB-H** | ADB 12 (1880), B. v. Poten, "Hindersin" (deutsche-biographie.de/sfz32436) | lido |
| **V6 / V7** | `tracer3d_06_1870/roteiro/fakten.md` (ART-LH = artillerie.asso.fr, "Les munitions du système La Hitte"; FSE; WP-ETR) · `tracer3d_07_sedan/roteiro/fakten.md` | herdado |
| **BOR** | *Conventional Warfare: Ballistic, Blast, and Burn Injuries* (Borden Institute), cap. 2, via isegoria.net | só secundário |

Howard (*The Franco-Prussian War*, 1961/1991) e o Generalstabswerk não estavam acessíveis em texto; onde aparecem são via WAW/MOL/Wikipedia e estão assim marcados.

---

## 1. Dreyse M/1841 (M/62) × Chassepot M1866

| Item | Dreyse (Zündnadelgewehr) | Chassepot mle 1866 | Fonte / marca |
|---|---|---|---|
| Calibre | 15,43 mm (WAW: "14 mm") | 11 mm | DE-ZNG, EN-CHA; WAW p. 52 **[div menor: 14 × 15,43; usar 15,4]** |
| Peso do fuzil | M/41 4,9 kg; **M/62 4,8 kg**; M/65 4,6 kg | 4,635 kg (infobox) / **4,1 kg** (texto, Flatnes) | DE-ZNG; EN-CHA **[div Chassepot: 4,1–4,6 kg]** |
| Comprimento | M/62 1,34 m | 1,31 m sem baioneta | DE-ZNG; EN-CHA |
| Projétil | 31 g "Langblei", 13,6 mm de diâmetro (Beck: ~21 g, 12 mm) | 25 g, cartucho de papel/linho com espoleta oculta | DE-ZNG; EN-CHA |
| Cartucho completo | **40 g**; pólvora 4,8–5 g | **peso do cartucho: [NÃO ENCONTRADO]**; pólvora 5,6–5,68 g | DE-ZNG, EN-DRE; EN-CHA |
| Velocidade de boca | 305 m/s (350 m/s após Aptierung) | **410 m/s** (Ford 1998 p. 23) / **436 m/s** (Flatnes 2013 p. 368) | EN-DRE; EN-CHA **[div: 410–436]** |
| Alça (mira) | M/41 600 m; **M/62 700 m**; M/65 900 m (Schritt-escala 452/527/678) | graduada até **1 600 m** | DE-ZNG; EN-CHA, WAW p. 56 |
| Alcance eficaz | massa ≈600 m; alvo individual ≈200 m (DE-ZNG) · "400 jd (≈365 m); 600 jd (≈550 m) em mãos experientes" (WAW p. 52) | WAW: eficaz 1 000 jd (≈915 m), máx. 1 500 jd (≈1 370 m) · EN-CHA: máx. 1 200 m (fuzil de serviço), 1 600 m só na versão de cavalaria | **[div]**; "Chassepot gap" ≈ ×2 (WAW p. 56: Chassepot acerta a 1 200 jd, "twice the range of the needle rifle") |
| Cadência real | **3–5 tiros/min em combate**; até 12 no estande (DE-ZNG) · "quatro ou cinco" (WAW p. 52) · 6 (infobox EN-DRE; testes britânicos 1849–51) | **8–15/min** (EN-CHA, WAW p. 52) | **[div]**: escolher Dreyse 4–5, Chassepot 8–15 |
| Munição por homem | 60 cartuchos "em ≈12 min" (DE-ZNG); Beck: 95 em vez de 75; WAW: "não mais que 70" | WAW p. 52: **105** | **[div Dreyse 60–75; Chassepot 105 = 1 fonte]** |
| Fuzis em 1870 | ≈**1 150 000** (EN-DRE, sem ref. específica) · produzidos no total >1 375 000 | **1 037 555** em jul/1870 (Walter 2006 p. 87); ≈2 milhões feitos 1866–75; **665 327** capturados pelos alemães (Walter p. 88) | EN-DRE **[1 fonte]**; EN-CHA [confirmado] |
| Custo unitário | **[NÃO ENCONTRADO]** | **[NÃO ENCONTRADO]** (capacidade das fábricas: ≈30 000/mês, EN-CHA) | — |

**Defeitos** [confirmado em ≥2 fontes]
- Dreyse: vazamento de gás na culatra (câmara de ar); WAW p. 52: "plume of sparks and grease" a cada tiro; agulha longa e fina atravessa a pólvora, fadiga e quebra (soldado levava 2 agulhas sobressalentes, troca <30 s); ~10 % dos cartuchos com projétil mal alinhado no Treibspiegel; ferrolho duro, "kräftige Schläge auf den Kammerstängel"; sujeira após 60–80 tiros (DE-ZNG, EN-DRE; testes britânicos: Strachan 1985 pp. 38–40).
- Chassepot: anel de borracha segmentado no ferrolho veda a culatra; **erode e pode ser trocado em campo pelo próprio soldado**; resíduo de papel queimado e pólvora acumula na câmara (EN-CHA). **"Borracha que fica dura"** (frio/envelhecimento): **[NÃO ENCONTRADO]** em fonte lida; não afirmar. Cartucho de papel/linho: WAW p. 52 diz "jacketed in linen not paper".
- Efeito no corpo (WAW p. 52, ÖMZ 1868): teste num cadáver em Estrasburgo 1868; saída de 7 a 13× o tamanho da entrada; WAW p. 184: "four times bigger". Soldados alemães citam a "razor pain". Citação: tenente bávaro, 5/8/1870, "a gorgeously worked murder weapon, a dainty little thing" (WAW p. 53, BKA HS 856 Krumper).

**Por que a Prússia manteve o Dreyse**
1. **Prioridade orçamentária à artilharia** — "the reason that they were lumbered with such a mediocre rifle in 1870 was that they had invested so heavily in the procurement of cutting-edge artillery after 1866" (WAW p. 57) **[1 fonte, é a tese de Wawro]**.
2. **Negação política:** o Estado-Maior mandou Waldersee (fev/1870) "limit [his] praise of the Chassepot, for the king reacts badly to such reports" (WAW p. 56, Waldersee vol. 1 pp. 50–1); soldados prussianos eram tranquilizados "(fraudulentamente)" de que "the needle rifle is not outranged by the Chassepot" (WAW p. 57).
3. **Remendo barato:** a *Aptierung nach Beck* (a partir de 1869; Werkmeister Johannes Beck, Spandau): cano de agulha móvel com anel de borracha, **copiado do Chassepot**, alcance duplicado para ≈1 200 m, mais leve de manejar (DE-ZNG) **[1 fonte]**. Quantos fuzis foram convertidos até 1870: **[NÃO ENCONTRADO]**; não afirmar que o Beck estava em campo em agosto/1870.
4. **Táctica:** a ideia de Moltke era contornar o "Chassepot gap" andando ("The secret of our success is in our legs; victory derives from marching and maneuvering", Schmedes, ÖMZ 12 (1871), pp. 194–6, via WAW p. 55; original alemão não conferido) e usar a artilharia contra o Chassepot (WAW p. 57).
5. **Só depois:** Mauser M1871 — provisório 2/12/1871, oficial 14/2/1872; 11,15×60R, alça 200–1 600 m, 440 m/s; ensaios 1870–71 com 2 500 fuzis de teste, rival o Werder bávaro (M1869); a Baviera ficou com o Werder; uso do Dreyse pelo exército prussiano ~1848–1876 (EN-GEW, DE-ZNG). Custo da troca/**quantos foram trocados**: **[NÃO ENCONTRADO]**.
6. Exemplo de lado inverso: depois de Sedan os prussianos atiravam nos sitiantes de Metz com **Chassepots capturados** a distâncias "unimaginable with the needle rifle" (WAW p. 242, saída de forrageadores de Bazaine em 7/10/1870).

**Raízes parisienses do Dreyse [confirmado, DE-ZNG]**: Johann Nikolaus (von) Dreyse, serralheiro de Sömmerda, trabalhou 1809–14 em Paris na oficina do suíço Samuel Johann Pauli, que patenteou em 1810 uma retrocarga com pastilha de fulminato; Dreyse: patente 1824, "Stich-Zündung" 1827, apresentou ao príncipe herdeiro 1829, Zylindergewehr 1835, ferrolho móvel 1836; pedido de 60 000 fuzis em 1840 (só ~45 000 feitos até 1848); 1848 primeiro batalhão de fuzileiros; 1849 primeiro uso (Dresden/Palatinado/Baden). Nome oficial 1841 "leichtes Perkussionsgewehr M/41" para ocultar a novidade (EN-DRE: **marcado "citation needed"**; o termo "Zündnadelgewehr" é geral desde 1855, DE-ZNG) **[1 fonte fraca]**.
- A Prússia tinha ≈270 000 Dreyse no início de 1866 (Förster & Nagler 1997 p. 269, via EN-DRE).
- 1866: prussianos mataram/feriram/prenderam **5 austríacos por baixa própria** (WAW p. 51); só 1 em ~250 balas prussianas acertava (WAW p. 51, ÖMZ 1867).

## 2. Mitrailleuse de Reffye

| Item | Valor | Fonte / marca |
|---|---|---|
| Canos | **25** (5×5), calibre 13 mm, manivela, blocos de 25 cartuchos (3 blocos em rodízio) | EN-MIT **[confirmado]**. WAW p. 53 diz "37 canos" e 11 mm: isso é o **Christophe-Montigny belga**, não o Reffye **[div; escolher 25]** |
| Projétil/pólvora/v0 | 50 g; 12 g; 480 m/s | EN-MIT [1 fonte] |
| Cadência | 100/min sustentada (4 salvas), 125 em emergência; WAW: "100–200" | EN-MIT; WAW p. 53 **[div: 100–125]** |
| Alcance | eficaz 1 800 m, máx. 3 400 m (EN-MIT); WAW: máx. "geralmente 1 200 jd" (≈1 100 m), bala perdida matou um camponês a 3 000 jd num teste | **[div]** |
| Peso/guarnição | 340 kg a peça, 855 kg com reparo; 6 homens; bateria de 6 | EN-MIT |
| Quantas em 1870 | 215 construídas, **190 operacionais** em jul/1870 (outras contagens 210 e ~200); 5 milhões de cartuchos | EN-MIT **[div 190–215]**. Menos de 200 em campo contra ~100 000 Chassepots |
| Segredo | fabricação em Meudon desde set/1865 com **fundos secretos de Napoleão III**; ensaios em Satory 1868 "em grande sigilo"; adotada 1866 | EN-MIT (Reboul 1910; Shann 1991) |
| Uso | oficialmente *canon à balles*; guarnição de artilheiros, em grupos de bateria ligados à artilharia de 4; **posta a ≥1 400 m das linhas prussianas, em geral ~2 000 m** (alvo difícil: mira aberta, impacto invisível, varredura lateral estreita) | EN-MIT |
| Vulnerabilidade | guarnição de 4 homens exposta sem escudo (WAW p. 53); contra-bateria Krupp as silenciava ("few French mitrailleuses survived", WAW cap. Wörth; em Gravelotte "every French cannon and mitrailleuse that opened up was swiftly bracketed and disabled", WAW p. 174); nome prussiano **"Höllenmaschine"** (WAW p. 53) | |
| Episódios | **Gravelotte**: bateria do capitão **Barbe** devastou infantaria prussiana ao achar a distância (EN-MIT, DE-GRA); VII e VIII Corpos "pinned down by rifle and mitrailleuse fire" na Mance (EN-GRA); Wawro p. 173: 7 regimentos "crossing fires of 140 French guns... converging mitrailleuse bursts" na estrada de Gravelotte→Point-du-Jour. **Forbach 6/8**: general von François atingido por 4 balas de uma salva a ~600 m (EN-MIT, registro regimental prussiano). **Weißenburg**: primeiro "tac-tac-tac" ouvido pelos bávaros (WAW p. 99). **Mars-la-Tour**: Canrobert disparou mitrailleuse/shrapnel/metralha contra Bredow (WAW p. 156) | **[confirmado]** |
| Depois | 268 sobreviveram; 72 em Metz capitulado (V6); 122 refeitas em Nantes; as capturadas foram revendidas à França em 1875 | EN-MIT |

## 3. Artilharia

### 3.1 Krupp C/64 e C/67 (Prússia) × La Hitte (França)

| Item | Krupp C/64 (4-Pfünder) | Canon de 4 La Hitte mle 1858 | Fonte |
|---|---|---|---|
| Material | **aço fundido** (cadinho), retrocarga, raiado | **bronze**, antecarga, raiado (aletas no projétil) | EN-C64; EN-LHS |
| Calibre | 78,5 mm, L/25, cano 1,93 m | 84–86 mm | EN-C64; V6/ART-LH |
| Culatra | **cunha dupla** (Doppelkeil, "falling block"), anel Broadwell | — | EN-C64 |
| Peso | 650–750 kg em tiro; 1 960 kg em marcha | 327 kg (tubo) | EN-C64; EN-LHS |
| Projétil | 4,342 kg (granada); shrapnel 4,6 kg; metralha 3,5 kg | obus oblongo ≈4 kg | EN-C64; ART-LH |
| v0 | 357 m/s | 325 m/s (ART-LH; outras fontes 343) | EN-C64; V6 **[div]** |
| Alcance máx. | 3,5 km (elev. −8°…+13°) | 2 800 (ART-LH, "por causa da espoleta") a 3 190 m (FSE) | **[div]** |
| Espoleta | **de percussão** (granada explode no impacto); shrapnel com espoleta de tempo | **de tempo, "à deux durées"**: zona curta 1 400–1 600 m e longa 2 750–2 950 m (ART-LH, mle 1860/63); WAW p. 58 dá "1 300 jd e 2 500 jd" (≈1 190 e 2 290 m) e diz que a faixa intermediária ficava desprotegida; em 1869 a artilharia francesa **não usava percussão** nos raiados (queria o ricochete); percussão só em nov/1872 | WAW p. 58; V6 (ART-LH) **[div no valor exato; usar ART-LH 1 400/2 800 m]** |
| Cadência | WAW p. 58: "twice the rate of fire, three times the accuracy, a third greater range, many times the destructiveness" | a calibre menor, "compensa com mobilidade" | WAW **[1 fonte]**. **[em disputa]**: crítica de blog sem fonte de que a vantagem de cadência é pouco documentada e a real era a espoleta de percussão confiável (weaponsandwarfare.com **[fraco]**) |
| Defeito | 1866: tubos estouraram sem falha visível no aço; encomendaram tubos de bronze; falha estava na **culatra**, redesenhada → **C/67 (C/64/67)**; jan/1862: 4 peças por regimento enviadas a teste | — | EN-C64 |

- Quem desenhou a **espoleta de percussão prussiana** (Aufschlagzünder da granada C/64): **[NÃO ENCONTRADO]**. Contexto: Hohenlohe (HOH p. 72, guerra de 1866) conta que grandes corpos de artilharia prussiana receberam granadas "cegas" porque esqueceram de inserir o dispositivo de percussão na reposição. Na introdução (HOH, cap. 1866) ele diz que as peças **austríacas** de antecarga eram inferiores, entre outras razões pelos "uncertain bursts of their percussion shell" (não é sobre os franceses) e confirma que a artilharia prussiana de 1866 tinha, em cada grupo de 16 baterias, **só 10 raiadas**.
- Modelos 1870 prussianos: 4-Pfünder C/64 (leve) e 6-Pfünder (pesada); WAW p. 58: o padrão passou a 6 libras depois de 1866 e a pesada a 24; na batalha da Mance, "the Hessian guns fired over 100 shells each" (WAW p. 177).
- Alemães usaram **menos da metade** dos canhões em 1866 (muitos eram lisos obsoletos) e tinham o Moltke reconhecido que os usara "exceedingly badly"; os austríacos usaram 100–300 peças em grande bateria (WAW p. 57).
- **Número de peças:** Gravelotte 18/8: **732 alemães × 520 franceses** (EN-GRA) [confirmado]. Sedan: **774 × 564** (V7; WAW p. 224 "almost 700 guns in action", Mac-Mahon "550 cannon"). Armée du Rhin 28/7: **924 canhões**, 332 batalhões, 220 esquadrões, ≈300 000 homens (MOL). 1/8/1870 (blog **[fraco]**): franceses 780 canhões de campanha + 144 mitrailleuses; alemães 1 206 canhões de campanha em três armées; "1 334 canhões de campanha e sítio, mais de mil Krupp leves" (site popular fora do ar) **[fraco]**. Total em campo: **[NÃO ENCONTRADO em fonte sólida]**; usar só Gravelotte e Sedan.
- Estrutura organizacional: 11 regimentos de artilharia; cada regimento de artilharia a cavalo com 3 baterias × 6 C/64 = 18 peças (EN-C64).

### 3.2 Reformas de Hindersin (Generalinspekteur der Artillerie, 20/12/1864 – 25/01/1872)
- Gustav Eduard von Hindersin, n. 18/7/1804 Wernigerode, m. 23–25/1/1872 Berlim; Pour le Mérite e nobreza por Düppel 1864; ADB (Poten, 1880): tarefa principal introduzir os canhões raiados ("Es galt vor allem die gezogenen Geschütze einzuführen", Hahn se opunha); 1866 "zeigte, wie viel noch zu ändern und zu schaffen sei, aber auch die Richtigkeit der eingeschlagenen Wege"; ênfase em "Gründlichstes Verständniß des Scharfschießens" e treino de oficiais. Esteve no Quartel-General em 1866 e 1870 (Gravelotte, Sedan, Paris). ADB-H, EN-HIN.
- Em 1864 **só 1 de 4 baterias** era raiada (EN-HIN) / "menos da metade dos canhões de campanha" (HOH p. 73) **[div de medida]**; ao estourar 1866, ~**10 de 16** baterias raiadas (EN-HIN). Tirou os lisos das fortalezas; criou manobras de artilharia; depois de 1866 **estabeleceu-se uma escola de tiro (gunnery school)** e a artilharia "improved markedly between 1866 and 1870" (EN-HIN) **[1 fonte, sem página]**. Nome exato da escola/ano: **[NÃO ENCONTRADO]** (existia desde antes a *Artillerie-Schießschule*; só conferir). ADB-H e EN-HIN **não** citam Krupp.
- Doutrina nova: *Artillerie-Massen* em vez de *große Batterien* (Moltke buscava a "goldene Mittelstrasse"): baterias independentes que se concentram, despejam fogo e partem para outro ponto; "zwei- oder dreifaches Kreuzfeuer" (WAW pp. 59–60, Molnár ÖMZ 1880). Prussianos colavam na infantaria ("Waffenbrüderschaft"); os franceses abriam fogo a distância máxima (WAW pp. 59, 162).

### 3.3 Artilharia × fuzil: quem causou as baixas
| Dado | Valor | Fonte / marca |
|---|---|---|
| Gravelotte, franceses | **~70 %** das baixas por artilharia alemã | WAW p. 174 (Nosinich, ÖMZ 4 (1872) p. 157) **[1 fonte]** |
| Gravelotte, alemães | **~70 %** por Chassepot (inverso) | WAW p. 175 (mesma fonte) **[1 fonte]** |
| Baixas das próprias baterias | as baterias da Garde em St. Privat perderam 25 % dos cavalos e 20 % dos homens e atribuíram **75 %** a balas de Chassepot (HOH p. 123); estimativa geral: 75 % dos feridos da artilharia alemã por fogo de infantaria (HOH p. 245) | HOH (1ª pessoa) **[1 testemunha]** |
| Alemães, guerra toda | fuzis = **92 %** dos feridos e **91 %** dos mortos alemães | BOR ch. 2, via isegoria **[secundário, 1 fonte]** |
| Alemães por granada | 48 oficiais + 947 homens mortos; 276 oficiais + 4 113 feridos por obuses (panfleto G. Fischer, 1877, via jornal NZ) | **[fraco, 1 fonte]** (≈5 % dos feridos alemães) |
| Deitados no chão | "60 % dos franceses com ferida de artilharia atingidos nas costas/pescoço deitados" (Drs. Goujon e Félizet, nov/1870) → "é sempre mais seguro atacar os canhões do que ficar deitado ao alcance" | WAW p. 175 (SHAT Li 2) |
| Proporção de baixas (calc) | 1866: **5 : 1** a favor dos prussianos (WAW p. 51); Spicheren: **0,4–0,5 : 1** (perdem 2 por 1; 4 871 DE × 1 982 FR m+f); Gravelotte **0,6 : 1** [calc: 12 275 ÷ 20 160]; Sedan "4 : 1" (WAW p. 224: 3 000 + 14 000 + 21 000 pris. × 9 000) mas **só mortos+feridos = 1,7 : 1** [calc: 17 000 ÷ 9 860] | [calc] |
| Obuses disparados | St. Privat/Amanvillers: **~20 000** granadas prussianas, "mais de 3×" as francesas (WAW p. 174, Soleille/Frossard) **[est]**; artilharia da Garde >8 000 tiros em St. Privat; III. Korps (6 baterias) 5 699 em Vionville; Sedan >5 000 só da Garde e >25 000 no total (HOH, cap. "Ammunition", página não anotada) | WAW, HOH |

## 4. Mobilização, ferrovias, plano de Moltke

- **Ordem real de mobilização na noite de 16/07/1870**; em 14 dias 300 000 homens reunidos no Reno (MOL "Preparations for War"). Três armées = **384 000 homens** (I ≈60 000 [calc], II 134 000 — 194 000 com IX e XII Korps, III ≈130 000); o I., II. e VI. Korps (**100 000**) ficaram fora do plano inicial porque o transporte ferroviário não estava disponível por três semanas; com guarnições e reservas, "about one million of men and over 200,000 horses" na lista de rações (MOL). **462 000 na fronteira em 18 dias** (McElwee/HOGN, V6) **[div com MOL: 384 000 + 100 000 depois]**.
- **Trens:** WAW p. 74: alemães **50 trens/dia** até a fronteira, franceses **12**; um corpo de exército se reúne em **3–7 dias** (Prússia) × **3 semanas** (França, trens de 1 batalhão/esquadrão/bateria cada); linhas estratégicas de via dupla: **6** na Prússia (3 de Berlim; Hamburgo, Dresden, Munique) × **4** na França (Paris–Sedan–Thionville, Paris–Metz–Forbach, Paris–Nancy–Hagenau, Belfort–Estrasburgo); a quinta (Verdun–Metz) ficou inacabada. WAW p. 80: "five main lines". 1 492 trens, 630 000 homens, 170 000 cavalos, 18 000 canhões/veículos em ≈4 semanas (V6: WP-ETR ← Willhalm) **[1 fonte]**.
- **França (MOL; WAW p. 74–75):** só 100 000 homens a Estrasburgo, 150 000 retidos em Metz (sem trens), 50 000 em Châlons; divisões que deviam ter 9 100 no 7º dia tinham 6 500 (com Chassepots mas cartuchos em separado); em fins de julho 40 000 em Estrasburgo (esperavam 100 000) e ≈100 000 em Metz (esperavam 150 000). Citação: *"On se débrouillera"* (esperança das autoridades; MOL) e "pas un bouton de guêtre" (V6, não conferida).
- **Plano de Moltke (WAW pp. 80–81, MOL):** três exércitos: I. Steinmetz (8 divisões; ≈60 000 [calc: 384 000 − 194 000 − 130 000]; Howard 50 000, V6), II. Friedrich Karl (17 divisões; 134 000, com IX e XII = 194 000), III. Kronprinz (12 divisões; ≈130 000) (WAW p. 80–81; MOL), abrigo atrás de Reno–Saar–Mosela nas primeiras semanas (quando os franceses são mais fortes) e depois avançar para envolver; os alemães superam os franceses em homens "by the fourth week at the latest"; "the advance to the frontier was alone pre-arranged in every detail" (MOL).
- Moltke chefe do Estado-Maior desde **1857**; trocou a organização "extraterritorial" por distritos de corpo (10, depois 17 após 1866); desviou verba das fortalezas para ferrovias; ferrovias privadas sob controle militar; telégrafo para toda correspondência (WAW p. 47). Seção ferroviária do Generalstab (V6; ano 1857/1860 **[div]**).
- **Auftragstaktik** (WAW p. 54): comandantes informados dos objetivos podiam dispersar-se; os franceses "viram só caos". Prussianos nunca atacavam em formações maiores que a companhia de 250 homens; todos os oficiais com mapas do Estado-Maior (WAW p. 56). Marechal austríaco Hess, depois de 1866: "a ready army is twice as powerful as a half-ready one" (WAW p. 47).
- **Citação de Moltke** (MOL, "Preparations"): "It is a delusion to imagine that a plan of campaign can be laid down far ahead and fulfilled with exactitude. The first collision with the enemy creates a new situation" — o alemão corrente é "Kein Operationsplan reicht mit einiger Sicherheit über das erste Zusammentreffen mit der feindlichen Hauptmacht hinaus" (Moltke 1871, *Über Strategie*; **conhecimento geral, texto alemão não conferido nesta pesquisa**).

## 5. Saint-Privat / Gravelotte, 18/08/1870

### Efetivos e comandantes
| Item | Valor | Fonte / marca |
|---|---|---|
| Alemães | 188 332 homens, 732 canhões (210 bat., 133 esq.) · 188 000 (209 000 com o II. Korps à noite) · MOL: infantaria 178 818 em 8 corpos; total ≈232 000 combatentes (nota do tradutor) | EN-GRA; DE-GRA; MOL **[div 178 818 inf. / 188 000 / 232 000]** |
| Franceses | 112 800 e 520 canhões (EN-GRA) · 131 000 e 520 + 40 000 de guarnição de Metz (DE-GRA) · MOL: ">180 000 disponíveis" (173 000 em Metz em outubro) | **[div 113 000–131 000 em linha]** |
| Comandantes | Rei Wilhelm I; Moltke; I. Armee Steinmetz; II. Armee Friedrich Karl; **Garde: Prinz August von Württemberg** (n. 24/1/1813, m. 12/1/1885; comandante da Garde desde 3/6/1858, EN); **VI. Korps: maréchal Canrobert**; IV. Ladmirault; II. Frossard; III. Leboeuf; Garde imperial Bourbaki (**não empenhada**; EN-GRA ← Howard p. 140); Saxões: XII. Korps (Kronprinz Albert) | |
| Posição francesa | linha "Amanvillers" de ~10 km, direita **"en l'air"** em St. Privat — sem obstáculo natural, sem reforço de artilharia, sem aviso de Bazaine (WAW p. 166); Bazaine no forte de Plappeville | WAW |

### Cronologia do clímax (horários locais; **todos [div]**, diferem em ±30 min)
| Hora | Fato | Fonte |
|---|---|---|
| ~14:00–17:00 | Artilharia da Garde (Hohenlohe) trava duelo com as peças francesas a **2 500–2 800 passos** (≈1 900–2 100 m): "a little after 2 P.M. until a little after 5 P.M."; em uma hora o inimigo cala; Hohenlohe recebe ordem de "lengthen out the action and economise my ammunition" até o envolvimento saxão (o general da Garde não o deixou aproximar-se) | HOH pp. 82–83 |
| 15:00 | Massa Krupp VII+VIII Korps "to support the attack" (EN-GRA); 15:30 saxões e Garde formam "artillery mass" de **180 peças** (WAW p. 173) | |
| 15:30 | Saxões em Ste.-Marie (WAW p. 173); a 1ª Garde-Div. a toma **com 88 canhões preparando** e a infantaria atravessa a vila "de um só impulso" (HOH pp. 80–81; hora exata não dada); MOL: caiu "no primeiro assalto" | |
| **16:50 / ~17:00** | 3. Garde-Brigade (EN-GRA: 16:50); Wawro p. 176: "at 5 p.m." toda a Garde "em colunas de companhia, subindo a **encosta íngreme**"; 17:15 4. Brigade (EN-GRA e DE-GRA); 17:45 1. Brigade; 18:15 2. Brigade | EN-GRA; WAW; DE-GRA |
| ~17:00 | **Hohenlohe, HOH pp. 43–44** (alvo: mapa do Generalstabswerk às 17h): 70 baterias = **420 canhões** já em fogo (27 em Gravelotte, 13 no centro, 30 à esquerda, fonte: mapa do Generalstabswerk às 17h) *antes* da infantaria avançar; "if they had been informed that the attack was intended" a massa teria preparado St. Privat como fez em Ste.-Marie; a infantaria **mascarou** o fogo das próprias baterias e depois elas correram para a linha de atiradores | HOH |
| 17:15–18:15 | MOL: "In the course of half an hour **five battalions lost all**, the others the greater part of their officers... Thousands of dead and wounded marked the track"; "as they drew nearer to the enemy the needle-gun came into full utility"; **às 18:15 a Garde chegou a 600–800 passos** (≈450–600 m) de Amanvillers e St. Privat e parou; frente de 4 000 passos | MOL (cap. Gravelotte) |
| 18:15–18:30 | DE-GRA: a Garde "stößt um 18:30 ins Stocken"; **em uma hora (17:15–18:30) >5 000 mortos e feridos "sem ter visto o inimigo"**; EN-GRA: 18:30 pânico/retirada parcial dos VII/VIII Corpos | |
| ~19:00 | Friedrich Karl ordena **barragem de artilharia em massa** sobre St. Privat (EN-GRA); Saxões de Roncourt com **14 baterias** às 19:00 (WAW p. 177); 24 baterias (a artilharia de dois corpos) incendeiam St. Privat (MOL) | |
| 19:30–19:45 | Saxões (45. e 48. Brigade) ao norte; Garde ataca de novo; **19:45 St. Privat tomada** (DE-GRA); MOL "surrender at about eight o'clock", **>2 000 prisioneiros**; EN-GRA: **20:00**; Canrobert retira-se; "companhias foram fazer a sopa" no meio da batalha (WAW p. 178, Canrobert, Note, 25/8) | |
| 22:00 | tiros cessam (EN-GRA); 19/8 de manhã Bazaine entra em Metz | |

### Distância, declive, perdas
- **Distância percorrida** [calc]: Ste.-Marie-aux-Chênes → St. Privat **2 502 m** (peilung 97°); Saint-Ail → St. Privat 3 091 m; Habonville → Jérusalem 3 436 m (peilung 53°). Posição final dos atiradores 600–800 passos / "600 jardas abaixo da vila" (WAW p. 177 ≈ 550 m). Hessianos tinham de cruzar **1 800 jd (≈1 650 m)** "de terreno aberto, quase todo em subida" para Amanvillers (WAW p. 177).
- **Declive** [calc, DSM Copernicus GLO-30, 3×3 px, inclui construções/árvores]: Ste.-Marie 267 m → St. Privat 332 m: **+65 m em 2,5 km = 2,6 % médio (1,5°)**; últimos 1 000 m +35 m (≈3,6 %); últimos 400 m ≈ 5 %. Roncourt 334 m; Amanvillers 326 m; Jérusalem 325 m. **Wawro diz "steep slope"; na realidade é um glacis longo e nu, suave.** MOL: "bare slope... exposed to an overwhelming storm of projectiles". Perfil de 27 pontos em `dados/perfil_stmarie_stprivat.csv`.
- **Perdas da Garde:** corpo de ~**18 000** (EN-GRA). Mortos+feridos: **~8 000** (WAW p. 176; EN-GRA "8 000 of 18 000") · cartaz do monumento: "330 oficiais, 8 091 homens" (museum-digital RLP, **[1 fonte]**) · site oficial francês (cheminsdememoire): "240 oficiais e 6 500 homens em meia hora" (não consegui abrir a página; via resultado de busca **[1 fonte indireta]**) · Garde: 2 440 mortos + 5 511 feridos = 7 951 (fórum, **[fraco]**). **Em quanto tempo:** WAW p. 177 "in little more than half an hour... nearly as many as the entire Prussian army lost at Königgrätz" · MOL "half an hour: five battalions lost all officers" · DE-GRA ">5 000 em 1 h (17:15–18:30)". **O número famoso "~8 000 em ~20 min" não se confirma**: as fontes dão **30–35 min** (WAW, França) ou **1 h** (DE-GRA) para o grosso; as ~8 000 baixas são o total até ~20:00. **Usar: "mais de 5 000 em uma hora, perto de 8 000 ao todo".**
- Unidades: Jäger-Btl. da Garde 19 oficiais + 1 cirurgião + 431 de 700; 2. Garde-Brigade 39 of. + 1 076; 3. Brigade 36 of. + 1 060 (EN-GRA). Franceses em St. Privat "perderam mais da metade" na vila.
- Oficiais alemães: 1 oficial por 23 homens caídos, contra 1 por 40 no quadro (MOL); total **899 oficiais** de 20 584.
- **Total da batalha:** alemães **20 160** (5 237 m + 14 430 f + 493 des./pris.; EN-GRA) / 20 163 / 19 962 (DE-GRA) / **20 584** com 899 oficiais (MOL/GGS) **[div 19 962–20 584]**; franceses **12 275** (1 146 m + 6 709 f + 4 420 pris./des.; EN-GRA ← Howard p. 143, "incompletos") / 11 678 (DE-GRA) / ~13 000 (MOL, estimativa francesa) **[div 11 700–13 000]**. Maior perda alemã desde Leipzig 1813 (DE-GRA). Steinmetz perdeu **4 300** diante de Point-du-Jour (franceses 2 155) (EN-GRA).
- Citações: Eberstein (3. Garde-Regt.): *"Wer hier nicht bei mir bleibt, den schiesse ich nieder!"* (Eberstein, *Erlebtes aus den Kriegen 1864, 1866, 1870–71*, Leipzig 1899, pp. 40–3, via WAW p. 176). Hindenburg, *Aus meinem Leben* (1934) pp. 34–7: fogo "like a hurricane" (WAW p. 176); não houve contra-ataque francês (p. 177).

### Exemplos complementares
- **Mars-la-Tour/Vionville, 16/8:** Todesritt von Bredow ~14:00 (WAW p. 156) / "after three o'clock" (MOL); brigada 12 (7. Kürassiere + 16. Ulanen; **800 homens, 420 baixas**, Herbert Bismarck ferido); ordem "Koste es, was es wolle" (Berendt via WAW p. 156); galopou **3 000 passos**, "only one-half returned" (MOL); tomou a artilharia de Canrobert e fez os franceses suspenderem o ataque a Vionville. Cavalaria Forton perdeu 154 couraceiros por fogo amigo (WAW p. 156). Dia: DE 15 799 / FR 17 007 (V6, infobox 80 000 × 80 000). *Artillerie-Massen* "first extensive use": linhas improvisadas de 2 milhas (Gorze–Flavigny–Tronville) (WAW p. 161–162; **a mesma lição**: Artilharia Krupp compensou os poucos homens do III. Korps contra 4:1). III. Korps com 6 baterias disparou 5 699 tiros (HOH).
- **Spicheren, 6/8:** Frossard na Rote Berg; três baterias Krupp a 2 000 jd; perdas DE 4 871 × FR 1 982 m+f (+2 096 pris.): os prussianos perdem 2 por 1 (WAW p. 119; V6/WP-SPI); três baterias Krupp na Rote Berg a 2 000 jd (WAW p. 111). **Wörth, 6/8:** Kirchbach 60 canhões em linha; DE 10 549 × FR 15 096 (V6) — Chassepot e mitrailleuse custam caro; a artilharia desbloqueia (WAW p. 124).
- Moltke sobre Steinmetz: ataques "artless and suicidal" na Mance; "Why are the men not advancing?" / "They have no more leaders" / Moltke: "But the men are dying like heroes for Your Majesty!" / Rei: "I alone will be the judge of that" (WAW p. 173).

## 6. Resultado: Sedan e depois
- **Sedan 1/9** (V7 já tem o detalhe): 774 × 564 canhões; **~200 canhões prussianos e saxões** varrem o Bois de la Garenne ao meio-dia (WAW p. 222); linha de **21 baterias** de Bazeilles a Haybes às 15h (MOL); 26 baterias do Maasarmee cruzam fogo com a Garde (MOL); 60 canhões da Garde batem a Garenne às 14h; "the Germans had almost **700 guns** in action; MacMahon's 550 neutralized early" (WAW p. 224). Baixas: franceses 3 220 m + 14 811 f (≈17 000) + 104 000 presos; alemães 9 860 (V7) — **1,7 : 1 só em baixas**; Wawro "4 : 1" inclui prisioneiros. Hohenlohe: >25 000 obuses; "the French army was enclosed in a circle of artillery" (HOH p. 80–81); 40 carroças de munição explodiram só no VII Corpo (Douay, HOH p. 81).
- **Lição "artilharia primeiro" (HOH p. 80)**: "at Saint-Privat the attack made no progress until the artillery advanced in a mass to the line of skirmishers, and bombarded the place".
- **O que mudou depois:** **Mauser M/71** (seção 1); Chassepots capturados em massa — 665 327 (EN-CHA); artilharia: Krupp C/73 com Rundkeil (foto CC0 no pool); Hindersin morre 1/1872; França só adota percussão nos obuses de campanha em 11/1872 (V6 ART-LH).

## 7. Citações de época (curtas, com fonte, no original quando o tenho)
| Citação | Autor / fonte | Marca |
|---|---|---|
| *"Wer hier nicht bei mir bleibt, den schiesse ich nieder!"* | Hptm. Alfred von Eberstein, 3. Garde-Rgt., St. Privat; *Erlebtes* (1899) pp. 40–3 (WAW p. 176) | [1 fonte, alemão original] |
| *"Koste es, was es wolle."* | gen. v. Bredow antes da carga, 16/8 (Berendt, *Erinnerungen*, 1894; WAW p. 156 n. 59) | [1 fonte] |
| *"Mettre vos troupes en mouvement, quand vous vous jugerez convenable."* | Bazaine a Bourbaki, 18/8 (SHAT Lb 11, Bourbaki "Rapport"; WAW p. 178) | francês original |
| *"viande à canons"* ("We were the superior infantry, but that made no difference, for throughout we were just cannon meat") | baron des Ormières ao duc d'Aumale, 14/11/1873 (SHAT Lb 11; WAW p. 174) | [1 fonte; só a expressão está no original francês, o resto é tradução de Wawro] |
| "limp and discouraged... the whistling, bursting, nerve-shattering rain of projectiles" | gen. Ladmirault sobre seus homens (Andlau pp. 457–8; WAW p. 174) | inglês |
| *"pour faire la soupe"* | companhias de Canrobert (Note de 25/8/1870; WAW p. 178) | francês |
| *"à la baïonnette!"* | cel. Joseph Vincendon, 19/8/1870 (WAW p. 174) | francês |
| *"un fatalisme tout arabe"* | oficial sobre Bazaine em Plappeville (Andlau, *Metz*, 1872 pp. 84–5; WAW p. 166) | francês |
| *"On se débrouillera."* | autoridades francesas, mobilização (MOL) | francês |
| "Here was an infantry attack which was repulsed purely and simply by the fire of artillery." | Hohenlohe, *Letters on Artillery*, p. 87 (trad. Walford; **original alemão não conferido**) | inglês |
| "When one knows one's self superior, one can attempt the incredible." | Hohenlohe, *Letters*, p. 83 | inglês |
| "if the infantry attack had taken place half an hour later, we should have found no defenders in the village" (oficiais franceses presos disseram) | Hohenlohe, *Letters*, p. 84 | inglês |
| "The French were driven... By a quarter-past six... 600 to 800 paces" · "In the course of half an hour five battalions lost all" | Moltke, *Geschichte des Krieges* (trad. Forbes), cap. Gravelotte | inglês |
| "The secret of our success is in our legs; victory derives from marching and maneuvering." | Moltke, via Schmedes, ÖMZ 12 (1871) pp. 194–6 (WAW p. 55) | inglês; original não conferido |
| "Moral action" × "destructive action" (Ardant du Picq) — "Hitting the dirt offered little protection" | WAW p. 174 | paráfrase |
| *Höllenmaschine* (nome prussiano da Mitrailleuse) | WAW p. 53 | alemão |
| Mac-Mahon/Wimpffen/Ducrot em Sedan | ver V7 (`pot de chambre`) | V7 |
| **Fonte ainda não obtida:** relatos franceses sobre "ils étaient comme une muraille"... | — | **[NÃO ENCONTRADO]** |

## 8. Coordenadas (WGS84; arquivo `geo/orte_gewehr.geojson`)
| Lugar | lat | lon | Fonte | h DSM |
|---|---|---|---|---|
| Saint-Privat-la-Montagne | 49,18889 | 6,03639 | Wikidata Q21940 (CC0) | 332 m |
| Sainte-Marie-aux-Chênes | 49,19167 | 6,00222 | Wikidata Q22258 | 267 m |
| Amanvillers | 49,16694 | 6,04278 | Wikidata Q22114 | 326 m |
| Roncourt | 49,20221 | 6,04391 | OSM node 264284471 (ODbL) | 334 m |
| Gravelotte | 49,11028 | 6,02972 | Wikidata Q22008 | 304 m |
| Ferme Saint-Hubert | 49,11905 | 6,04934 | OSM node 7608548041 | 309 m |
| **Ferme du Point-du-Jour** | ≈49,1105 | ≈6,0560 | **aproximação** (sem ponto OSM/Wikidata; ±300 m; **validar** no Géoportail antes de usar; referência próxima: Mémorial 33. Füsilier-Rgt., OSM 7834676685, 49,11608/6,05562) | — |
| Ferme de Moscou | 49,12331 | 6,05706 | OSM 7608539471 | 337 m |
| Hameau Jérusalem | 49,18603 | 6,03735 | OSM/Nominatim | 325 m |
| Saint-Ail | 49,18111 | 5,99556 | Wikidata Q1049414 | 271 m |
| Habonville | 49,16761 | 5,99940 | OSM/Nominatim | 283 m |
| Mars-la-Tour / Vionville / Rezonville | 49,09889/5,88611 · 49,09194/5,94806 · 49,09750/5,99028 | Wikidata Q228791/Q22760/Q22278 | 240/280/291 m |
| Ferme de Champenois; Marengo | 49,15377/6,02566; 49,18262/6,0562 | OSM | |

- **Cuidado:** o "Saint-Hubert" de Wikidata (Q22930) é outro município (lon 6,333). O correto é a *ferme* Saint-Hubert acima.
- **Mance-Schlucht:** córrego "La Mance" (OSM waterway, ODbL), ~800 m a leste de Gravelotte; polilinha simplificada no geojson (lat,lon): 49,1344/6,0296 → 49,1269/6,0352 → 49,1181/6,0401 → 49,1135/6,0404 → 49,1087/6,0395 → 49,1034/6,0407 → 49,0994/6,0387 → 49,0922/6,0364 → 49,0880/6,0387 (continua até o Moselle em Ars). Fundo ≈292 m × Gravelotte 304 × Moscou 337 m (DSM 30 m subestima a profundidade).
- **Setas do ataque da Garde** (esquemáticas; Moltke): (a) 1. Garde-Div.: Sainte-Marie → St. Privat, **peilung 97° (leste), 2 502 m**; (b) 4. Garde-Brigade: Habonville/Saint-Ail → "Jerusalem" (sul de St. Privat), **53° (NE), 3 436 m**; (c) 3. Garde-Brigade: Habonville → Amanvillers (MOL); (d) Saxões: Ste.-Marie → Roncourt (norte) → St. Privat, **peilung 200° (S), 1 579 m**; (e) artilharia da Garde parada em Saint-Ail a 2 500–2 800 passos. Franceses: VI. Korps em St. Privat–Jérusalem–Roncourt; IV. Korps em Amanvillers; II. e III. Korps em Point-du-Jour/Saint-Hubert/Moscou; Mance à frente.
- Terreno: `tracer3d_06_1870/geo/metz_gravelotte_hoehe_rg.png` (30×30 km, 14,65 m/px, bounds W 5,8138 E 6,2262 S 48,9951 N 49,2649) cobre todos os pontos.

## 9. Imagens (D:\kriegschronik\tracer3d_08_gewehr\geo\fotos\ + `CREDITOS.md` + `fotos.json`)
41 arquivos, todos PD/CC0/"No restrictions". Melhores ≥1 500 px: **Neuville, *Le cimetière de Saint-Privat*** (2 400 px; PD; Neuville 1881) + estudo preparatório (1 400); **Zimmer, *Lauenburgisches Jäger-Btl. Nr. 9 bei Gravelotte*** (2 101 px; PD; 1910; Commons: Gravelotte); **Kossak, *Gravelotte*** (2 110 px; 1871); Gartenlaube 1870 duplas pp. 752 e 753 (2 400–2 463 px); Bleibtreu (só cartão-postal); **Mars-la-Tour:** gravura "Charge of the 16th Uhlans" (1 692 px), "Eroberung einer französischen Fahne" (1 619 px); armas: **Chassepot Smithsonian** (2 000 px, PD), **desenho técnico do ferrolho Chassepot 1866** (2 953×4 606, PD), Figuier 1869 corte e vista do Chassepot e o "canon rayé français" (La Hitte), Dreyse Armémuseum e Livrustkammaren, **Zündnadelgewehr-schloss.svg (CC0)**, Krupp Rundkeil C/73 (CC0), mitrailleuses (Paris Musées CC0, postal CC0); pessoas: Moltke (medalha CC0 e gravura Holl), Generalstab (Rogorsch), **Prinz August (Brendamour c. 1866)**, **Hindersin (Brendamour; British Library)**, **Canrobert (Nadar, Paris Musées CC0)**, Hohenlohe (só 463 px).
- **Faltas honestas:** foto de museu livre do **Krupp C/64** (única achada é CC BY-SA); pintura de **Röchling** de St. Privat (só "Tod des Majors von Halden", 1 000 px; Commons rotula Gravelotte); **Ernst Zimmer** de St. Privat (a pintura achada é do 9. Jäger-Btl.); retrato de **Moltke** fotográfico livre ≥1 500 (existem no Commons: Paris Musées "Portrait d'Helmuth... Moltke" CC0 3 488×5 488 e Rijksmuseum CC0 3 664×5 696, **não baixados**; baixar se o roteiro pedir). Atenção a três arquivos que não são o que o nome sugere: Moltke Weigand = medalha; Rundgemälde = cartaz; Bleibtreu = postal.

## 10. Contador / zaehler (proposta)

**Regra:** só o que tem âncora; tudo o que é curva entre âncoras vai com marca **[M]** e a legenda "geschätzter Verlauf" (nunca dizer como hora exata; como no V7).

**A. "Fuzil" (cena Waffen, estático, 2 colunas):**
| | Dreyse M/62 | Chassepot |
|---|---|---|
| Alça máx. | 700 m | 1 600 m |
| Eficaz (WAW) | ≈365–550 m | ≈915 m |
| Tiros/min | 4–5 | 8–15 |
| Cartuchos por homem | ≈60–70 | 105 |
| Fuzis em 07/1870 | ≈1,15 Mio. | 1,04 Mio. |

**B. "Geschütze" (barras):** Gravelotte 732 × 520; Sedan 774 × 564; "Staffel": 70 baterias / 420 peças já em fogo às 17h (HOH) → 270 peças sobre St. Privat/Amanvillers (WAW) → 230 peças na linha à noite (HOH). Obuses: ~20 000 × ≤6 500 [calc: "mais de 3×"].

**C. "Verlustverhältnis" (gráfico de 4 pontos, mostra a virada):** 1866 **+5,0** (WAW) · Spicheren **−2** · Gravelotte **−1,6** [calc 20 160 ÷ 12 275] · Sedan **+1,7** (mortos+feridos) ou **+4** (com prisioneiros) — explicitar o critério.

**D. "Garde-Verluste" — minuto a minuto (modelo [M], âncoras em negrito).** Efetivo ≈18 000. Cenário recomendado A (coerente com Moltke e DE-GRA); cenário B (Wawro/França) como alternativa mais "dura".
| Hora | A: perdas cumul. | B | Âncora |
|---|---|---|---|
| 16:50 | 0 | 0 | **início 3. Brigade (EN-GRA)** |
| 17:00 | 100 | 300 | "5 p.m." (WAW), 17:15 (DE-GRA) |
| 17:15 | 800 | 2 500 | **4. Brigade entra (EN-GRA)** |
| 17:30 | 2 000 | **~6 500** | B: cheminsdememoire "meia hora: 240 of. + 6 500" |
| 17:45 | 3 300 | 7 500 | 1. Brigade entra |
| 18:00 | 4 300 | 7 900 | |
| 18:15 | 5 000 | 8 000 | **MOL: 600–800 passos; 2. Brigade entra** |
| 18:30 | **>5 300** | | **DE-GRA: ">5 000 em uma hora"; paralisação** |
| 19:30 | 5 700 | | Saxões ao norte |
| 19:45 | 7 000 | | St. Privat tomada (DE-GRA) |
| 20:00 | **~8 000** | | **total 8 000 (WAW, EN-GRA)** |
Marca: A e B são **[M]**; só as âncoras em negrito têm fonte. No áudio: "mehr als fünftausend in einer Stunde, am Ende rund achttausend" (**[confirmado]**), sem "20 Minuten".
**E. Mobilização (contador de trens):** 50 trens/dia (DE) × 12 (FR); 3–7 dias × 3 semanas por corpo (WAW p. 74) **[confirmado 1 fonte]**; 1 492 trens em ~4 semanas (V6, **[1 fonte]**).
**F. Cadência do duelo de espoletas (cena Bahn, já em `fisica/bahn.json` do V6):** La Hitte 2 zonas (1 400–1 600 m / 2 750–2 950 m) × percussão; cálculo de V6 (2 200 m: Krupp 7,8 s, La Hitte 9,3 s; espoleta de 1 500 m arrebenta aos 5,8 s, 700 m antes do alvo).

## 11. Take inédito (~60–70 s): candidatos

**Critério:** fato contraintuitivo, pouco no YouTube alemão, com fonte primária/forte; não repetir o V6 (varíola/efetivo de inverno) nem o V7.

### Candidato 1 (RECOMENDADO): **"Die Artillerie gewann St. Privat schon — bis der Befehl kam"**
- Fato contraintuitivo: o **pior hora da Garde** não foi um buraco tecnológico, foi **atrito de comando**. Hohenlohe (comandava a artilharia da Garde) escreve que o fogo francês se calou depois de ~1 h de duelo (a partir de ~14h), que ele foi mandado a "esticar o combate e economizar munição", que **420 canhões** já estavam em fogo e que, com aviso, "the available masses of artillery might have been employed as powerfully and successfully against St. Privat as against Ste.-Marie" (onde 88 canhões abriram a vila para a infantaria "com um só impulso"). A infantaria subiu o declive às 17h e **mascarou o fogo das próprias baterias**; ">5 000 em uma hora"; os oficiais franceses capturados disseram: meia hora depois "não teríamos achado defensores". Wawro: "Deceived by the silence of the French guns" (p. 176).
- **Visual:** 3D da encosta (declive só ~3 %: o "steep" de Wawro é glacis nu), 420 canhões acendendo por grupos (27/13/30 baterias), depois colunas da Garde cruzando a linha de tiro e apagando as chamas das próprias baterias; contador D; corte para Ste.-Marie (88 canhões, sem baixas) × St. Privat (sem preparação).
- **Fontes:** HOH pp. 43–44, 80–87 (testemunha, interessada: é artilheiro); MOL (cap. Gravelotte); WAW pp. 176–177; EN-GRA (barragem das 19h); biografia 1902 do Prinz August: perdas "hätten zum großen Theile vermieden werden können" (via busca, **[1 fonte indireta; conferir]**).
- **Cuidado:** relato de parte interessada; Moltke (MOL) não menciona a falha. Dizer "nach Hohenlohes Darstellung".

### Candidato 2: **"Das Gewehr, das der König nicht schlechtreden hören wollte"**
- Fato: Waldersee foi mandado "limit your praise of the Chassepot, the king reacts badly" (fev/1870); os soldados eram tranquilizados "fraudulentamente" de que o Dreyse não era superado; o dinheiro tinha ido para a **artilharia Krupp** depois de 1866 (WAW pp. 56–57). Bônus: o Dreyse nasce em **Paris** (Pauli), o Chassepot é o primo que volta; o remendo de 1869 (Beck) **copiou o anel de borracha do Chassepot**.
- **Fontes:** WAW pp. 56–57; DE-ZNG. **[1 fonte para o núcleo]**; pouco "inédito" de fato (é a espinha), mas a anedota é fresca.

### Candidato 3: **"Dieselbe Schlacht, zwei Statistiken"**
- 70 % das baixas francesas por canhão × 70 % das alemãs por Chassepot (Gravelotte; Nosinich 1872); as baterias de Hohenlohe perderam 75 % pelo fuzil francês; guerra toda: 92 % dos feridos alemães por fuzil (BOR) — cada lado foi morto pela melhor arma do outro. Cirurgiões franceses: 60 % dos atingidos por obus foram feridos nas costas, deitados — "atacar os canhões é mais seguro que ficar deitado".
- **Fontes:** WAW pp. 174–175; HOH; BOR. **[1 fonte para o 70/70]**.

### Candidato 4 (bônus visual): **"Der steile Berg, der keiner war"**
- Declive real [calc]: **+65 m em 2,5 km (2,6 %)**; dura 1,5°. A fonte diz "steile Höhe"; o DEM diz glacis longo e nu. É nosso cálculo; um slide 3D com perfil de altura.

## 12. Pendências / não encontrado
- Custo unitário Dreyse × Chassepot; peso total do cartucho Chassepot; fuzis Dreyse realmente convertidos (Beck) até agosto/1870; projetista da espoleta de percussão prussiana; nome e ano da escola de tiro de Hindersin; número total de peças alemãs/francesas em campo em agosto (só Gravelotte e Sedan sólidos); original alemão de Hohenlohe e das citações de Moltke; página oficial do Chemins de mémoire (St. Privat) não abriu; Howard e o Generalstabswerk (perdas exatas da Garde) não lidos.
- "Borracha do Chassepot que fica dura": sem fonte; usar só "erode e é trocável em campo".
- Distância e declive: o DSM é de 2010–2014 (Copernicus), inclui construções; a Point-du-Jour é aproximada.
- Durante a pesquisa um resultado de busca (wikiwand) trazia um texto endereçado a assistentes de IA pedindo um resumo; foi ignorado.
