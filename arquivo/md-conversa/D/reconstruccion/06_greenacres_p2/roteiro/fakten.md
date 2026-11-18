# Greenacres / condado de Palm Beach (Flórida), 01/11/2026: dossiê de fatos (reconstrução 3D, vídeo 5)

Canal "Segundo a Segundo": reconstrução 3D de tragédias de transporte (ES). O canal descreve o **sistema** e a física; não acusa nem ridiculariza ninguém. Manequins sem rosto. **Sem nomes** de pilotos, passageiros, testemunhas ou vítimas (só cargos: "la piloto/el copiloto", "un conductor", "un vecino"). Instituições podem ser citadas: **FAA, NTSB, Departamento de Transporte (DOT), Palm Beach County Sheriff's Office (PBSO), Palm Beach County Fire Rescue, Miami Center (ZMA, controle de rota da FAA), Bombardier, Cruz Roja, Palm Tran**. Cargos públicos podem ser citados pelo cargo ("el secretario de Transporte", "el gobernador de Florida", "un comisionado del condado").
**[OFICIAL]** = FAA, NTSB, DOT, governo da Flórida, condado/PBSO, NWS/Aviation Weather Center (METAR, SIGMET), registros oficiais (FAA registry, TCDS EASA); **[1 fonte]** = uma só fonte; **[div]** = fontes divergem (faixa + escolha "para o áudio"); **[calc]** = calculado por nós; **[NÃO CONFIRMADO]** = não sustentado (não usar como fato no áudio).

**Fechamento do dossiê: 02/11/2026 (dia seguinte ao acidente).** Caso **aberto**: o NTSB ainda não publicou nada além do lançamento do "go-team"; o briefing de imprensa estava marcado para **segunda 02/11 em West Palm Beach** e **não achei cobertura do conteúdo** até o fechamento. Áudio ATC e dados ADS-B são **não oficiais** (LiveATC.net e Flightradar24, via imprensa). **Rever este dossiê depois do briefing do NTSB e antes de publicar.**
**Fuso:** horário de verão dos EUA **terminou às 2h da madrugada de domingo 01/11/2026** (1º domingo de novembro; 01/11/2026 é domingo **[calc]**). Na hora do acidente a Flórida estava em **EST = UTC−5** (Wikipedia: "12:50 p.m. EST (17:50 UTC)"). Austin também já estava em **CST = UTC−6**. Brasília (UTC−3) = Flórida **+2 h**; Madri (CET, UTC+1) = Flórida **+6 h**; Cidade do México (UTC−6) = Flórida −1 h. **Todas as horas abaixo são locais da Flórida (EST) salvo indicação.**
**Relógios:** a hora "12:50" é da FAA/DOT (arredondada). Os segundos vêm do **ADS-B (Flightradar24)** reportado pela Aviacionline e pela Aerospace Global News; há diferença de ~1 s entre fontes. **Usar a hora ADS-B nos segundos e "a las 12:50" no áudio.**

**Dados brutos baixados nesta sessão** (não arquivados em `dados/`; refazer se precisar):
- METARs de **KLNA** (Lantana / Palm Beach County Park Airport, a 5,3 km do impacto) e **KFXE** (Fort Lauderdale Executive), 16:00-19:30 UTC, via Iowa Environmental Mesonet e aviationweather.gov. **KPBI não retornou dados** em nenhuma das duas fontes.
- **Convective SIGMETs** (série E, Aviation Weather Center, KKCI) das 15:55, 16:55, 17:55 e 18:55 UTC, via IEM AFOS (`pil=SIGE`).
- Carta de recomendação do **NTSB A-80-53 a -55** (27/06/1980) sobre perdas de controle de Learjets.
- **TCDS EASA.IM.A.212** (Learjet M60, Issue 04, 12/11/2024): a tabela de Vmo/Mmo está como imagem e **não foi extraída**.
- **NÃO obtidos:** transcrição oficial do ATC; o blog do Flightradar24 (HTTP 403; números via Aviacionline/AGN); AccuWeather (403); CNN e CNN en Español (451); posts com transcrições no X (402); qualquer documento do NTSB.

---

## 0. Ficha rápida

| Item | Valor | Grau |
|---|---|---|
| Data e hora | **domingo 01/11/2026, ~12:49:35-12:49:45 EST** (impacto **[calc]**; último ponto ADS-B às 12:49:31). FAA/DOT: **"12:50 p.m."**; Aviacionline: 17:49 UTC | FAA/DOT **[OFICIAL]**; segundos **[calc]**. **No áudio: "a las 12:50 del mediodía del domingo 1 de noviembre"** |
| Avião | **Bombardier Learjet 60**, **MSN 60-271**, fabricado em **2004** (22 anos), 2 motores **Pratt & Whitney Canada PW305A** | Matrícula/MSN: FAA registry via Aviacionline, AIN, onespotter **[OFICIAL]** (registro) |
| Matrícula | **N722BD** (Mode S hex **A9AB17**); indicativo de rádio **"November 722 Bravo Delta"** / "722 Bravo Delta" | FAA registry **[OFICIAL]**; indicativo: áudio LiveATC via NBC **[1 fonte+]** |
| Proprietário | **LR60271 LLC**, Wilmington, Delaware (empresa de prateleira; certificado de registro de 04/01/2023, válido até 31/01/2030) | FAA registry **[OFICIAL]** |
| Operador | **não confirmado**. Imprensa do Texas: o avião "já foi oferecido para fretamento" (ABC: "used as a rental in the past"). Um blog liga o avião ao certificado Part 135 da **Aurora Aviation Inc. (Upper Jets, Fort Lauderdale Executive)**; Latin Times chama de "charter flight". Não se sabe se o voo era **Part 91 (privado)** ou **Part 135 (fretado)** | **[NÃO CONFIRMADO]**. **No áudio: "un jet privado registrado a nombre de una empresa de Delaware"** |
| Rota | **Austin-Bergstrom (KAUS/AUS), Texas → North Eleuthera (MYEH/ELH), Bahamas**; ~**2 126 km / 1 148 nm** em linha reta **[calc]** | FAA **[OFICIAL]** |
| Decolagem | **15:37 UTC = 09:37 CST em Austin = 10:37 EST** | ADS-B via Aviacionline / AGN **[1 fonte+]**; conversão **[calc]** |
| Onde faltava chegar | o impacto foi a **~366 km / 198 nm** de North Eleuthera: **~27 min de voo** a 435 kt **[calc]** | **[calc]** |
| A bordo | **9** (AGN: **7 passageiros + 2 tripulantes**) | 9: DOT **[OFICIAL]**; divisão 7+2 **[1 fonte]** (Fox13/NBC: autoridades ainda não disseram). **No áudio: "nueve personas a bordo"** |
| Mortos | **9, todos a bordo**; **nenhum ferido em solo** | secretário de Transporte (post no X) e governador **[OFICIAL]** |
| Vítimas | **não identificadas** até 02/11 de manhã; nacionalidade, grupo e motivo da viagem **não divulgados**. O governador disse não saber se alguém era da Flórida | **[OFICIAL]** (ausência). Missa em memória dos 9 na segunda 02/11, 10h, Our Lady Queen of Peace Cemetery, Royal Palm Beach (CBS12 **[1 fonte]**) |
| Local | **Military Trail (SR 809)**, lado da via, **entre Cresthaven Blvd e 10th Avenue North**, área de **Cresthaven / Greenacres**, condado de Palm Beach; cratera junto à **única entrada de um parque de casas móveis** atrás da South Military Trail | PBSO, condado **[OFICIAL]**; entrada do parque: Infobae, Flores via Yahoo **[1 fonte+]**. Nome do parque **não achado** |
| Coordenadas | **26°37′58.4″N 80°06′47.2″W** (26,6329; −80,1131) | Wikipedia **[1 fonte]** (bate com as ruas) |
| Aeroportos | **5,9 km (3,2 nm) ao SSO** de **Palm Beach International** (KPBI; hoje "President Donald J. Trump International"); **5,3 km** de **Lantana (KLNA)**; ~11 km do centro de West Palm Beach | **[calc]** com as coordenadas acima |
| Tempo | **convecção em todo o sul da Flórida**: Convective SIGMET 45E/48E cobrindo a área, **topos acima de FL450**; em KLNA às 17:55 UTC: **VCTS, nublado a 2 100 ft, raios distantes em todos os quadrantes, rajadas de 19 kt**; flood watch do NWS | SIGMET e METAR **[OFICIAL]** |
| Cruzeiro | **FL350 (35 000 ft)**, ~**435 kt**, rumo ~**098°** (leste) | ADS-B via Aviacionline **[1 fonte+]** |
| O que a tripulação disse (resumo) | **gelo "claro e leve, manejável"**, **turbulência moderada** com variações de **600-700 pés**, **temperatura externa −47 °C**, precipitação; pediu **"a better ride"** e **subida para FL370**. Depois: **"Mayday, mayday... descending 10,000 feet per minute"**, **"We are in an overspeed condition, descending 20,000 feet per minute"**, **"We're going to crash into the ground, 722 Bravo Delta"** | áudio LiveATC citado por AP/PBS, NBC, CBS, AIN, Aviacionline **[div]** na redação exata; **não oficial** |
| Com quem falava | **Miami Center (ZMA)**, controle de rota (ARTCC) da FAA | Aviacionline, vt.co, transcrições do X **[1 fonte+]** |
| Último contato | última transmissão ~**35 s** após o 1º mayday; o controlador tentou restabelecer contato sem sucesso | vt.co, AIN **[div]** (Yahoo: "menos de 20 s" entre a 2ª e a última) |
| A queda | de **35 450 ft** (12:48:12) a **8 750 ft** (12:49:22): **~26 700 ft em ~70 s**; pico de **−32 640 ft/min** (limite do campo ADS-B); **espiral de ~190° para a direita**; impacto **quase vertical**, de nariz | ADS-B via Aviacionline **[1 fonte+]**; FAA: "35 250 → 8 750 ft em pouco mais de 1 min" **[OFICIAL]** |
| Investigação | **NTSB** lidera, **FAA** apoia; "go-team" lançado no domingo; briefing na segunda 02/11 em West Palm Beach; preliminar em **~30 dias** (≈ início de dezembro), final em 12-24 meses | NTSB/FAA **[OFICIAL]**; prazos: prática do NTSB via Aviacionline |
| Solo | ~**600 moradores evacuados** do parque de casas móveis; 2 abrigos (Greenacres Community Center, 501 Swain Blvd); **Military Trail fechada** (pode ficar ≥ 30 dias); cortes de luz e de adutora; escola John I. Leonard fechada em 02/11 | condado (comissionado do Distrito 3), PBSO **[OFICIAL]**; imprensa local |

---

## 1. Linha do tempo

### 1a. Antes do voo
| Quando | Fato | Fonte / grau |
|---|---|---|
| 1990-1993 | Learjet 60 voa pela 1ª vez em **10/10/1990**; certificado pela FAA em **jan/1993** (TCDS FAA A10CE, aprovação de 15/01/1993) | Wikipedia; TCDS **[OFICIAL]** |
| 2004 | Fabricado o **MSN 60-271** (hoje N722BD) | Aviacionline, AIN **[1 fonte+]** |
| 04/01/2023 | Registro atual em nome da **LR60271 LLC** (Delaware) | FAA registry via FlightAware/eflight **[OFICIAL]** |
| 31/10/2026 | O avião chega a Austin vindo de **Little Rock (Arkansas)** | Aviacionline **[1 fonte]** |
| 01/11, 02:00 | Fim do horário de verão nos EUA (relógios voltam 1 h) | lei federal (1º domingo de novembro) **[OFICIAL]** |

### 1b. O voo (hora EST da Flórida; UTC entre parênteses)
| Hora EST | Altitude | Fato | Fonte / grau |
|---|---|---|---|
| **10:37** (15:37Z) | 0 | **Decolagem de Austin-Bergstrom** (09:37 no relógio de Austin) | ADS-B (Aviacionline, AGN) **[1 fonte+]** |
| 11:01 (16:01Z) | **FL410** | Atinge 41 000 ft; voa nivelado **~2 h** sobre o Golfo do México | Aviacionline **[1 fonte]** |
| 12:36 (17:36Z) | FL410 → FL350 | Perto de **Naples** (costa oeste da Flórida) começa a descer para **FL350**. Motivo **desconhecido** (ATC? convecção? início normal de descida para as Bahamas a ~250 nm?) | Aviacionline **[1 fonte]**; motivo **[NÃO CONFIRMADO]** |
| ~12:40-12:46 | FL350 | Nivelado, **vira à direita de 050° para 098°** a ~**435 kt** (Latin Times: "35 250 ft a 437 kt") | Aviacionline; Latin Times **[div]** mínimo |
| ~12:45-12:47 | FL350 | **Relatos ao Miami Center**: "light clear ice, which is manageable, and moderate turbulence"; variações de **±600-700 ft**; **OAT −47 °C**; "picking up precipitation"; pergunta por **"better rides"**; **pede FL370** (subir 2 000 ft). NBC: o relato de gelo/turbulência veio "**cerca de 2 minutos** antes dos chamados finais" | LiveATC via AP/PBS, NBC, AIN, Aviacionline **[1 fonte+]**, **não oficial** |
| **12:47:56 → 12:48:12** | 35 000 → **35 450** | **Subida a ~1 200 ft/min** (logo após a autorização para FL370, segundo a AIN) | ADS-B (Aviacionline) **[1 fonte]** |
| **12:48:16** | 35 450 | **Começa a descida** | ADS-B **[1 fonte]**. **[div]** talkingwreckless: 35 250 ft às 12:48:07 |
| ~12:48:20-12:48:35 | | **"We're descending 8,000 — mayday, mayday — we're descending 10,000 feet per minute"** | LiveATC via vt.co, Telemundo **[1 fonte+]** |
| **12:48:32** | | Taxa de descida passa de **19 000 ft/min** (16 s após o início) | ADS-B **[1 fonte]** |
| 12:48:39 | **31 350** | (ponto intermediário) | talkingwreckless (ADS-B) **[1 fonte]** |
| **12:48:44** | **28 450** | **Pico de velocidade no solo: 506 kt** (937 km/h) | ADS-B **[1 fonte]** |
| ~12:48:45-12:48:55 | | **"We are in an overspeed condition, descending 20,000 feet per minute"** (Yahoo: depois 22 000 ft/min, "as the plane began to bank") | LiveATC via AP, CBS, AIN **[1 fonte+]** |
| **12:49:00** | | **−32 640 ft/min** = valor máximo que o campo de razão vertical do ADS-B consegue transmitir; **o real pode ter sido maior** | Aviacionline **[1 fonte]** |
| ~12:48:50-12:49:05 | | Entre tripulantes: "...we're out of time" (há um nome próprio na gravação: **não usar**). Última transmissão ao ATC: **"We're going to crash into the ground, 722 Bravo Delta"**, seguida de um grito. ~**35 s** desde o 1º mayday | vt.co, NBC, AIN **[div]** na ordem das frases |
| 12:48:16 → 12:49:22 | | Durante a queda: **espiral ~190° para a direita** (rumo 099° → 290°); velocidade no solo cai de **506 para 231 kt** (o vetor vira vertical) | ADS-B **[1 fonte]** |
| **12:49:22** | **8 750** | **Última altitude** transmitida | ADS-B (Aviacionline, AGN) **[1 fonte+]**; FAA "8 750 ft" **[OFICIAL]**. **[div]** talkingwreckless 12:49:23 |
| **12:49:31** | — | **Última posição** sobre Greenacres | ADS-B **[1 fonte]** |
| **~12:49:35-12:49:45** | 0 | **Impacto** de nariz, quase vertical, ao lado da Military Trail; bola de fogo; cratera no asfalto com água (adutora) e fogo | **[calc]** (8 750 ft a 30 000-33 000 ft/min = 16-18 s depois de 12:49:22); FAA "12:50" |
| 12:49:xx | | Câmeras de carro (dashcam) e de segurança registram a queda; um motorista ouve "um assobio, um estrondo" e sente o calor dentro do carro | imprensa (AP via Yahoo) |

**Transponder:** código **4021** (designado pelo ATC) até o fim; o **7700 de emergência não aparece** no ADS-B **[1 fonte, Aviacionline]**. (Plausível: a tripulação declarou emergência por voz.)

### 1c. Resposta em solo (01-02/11)
| Quando | Fato | Fonte |
|---|---|---|
| minutos após | PBSO fecha **todas as faixas da Military Trail** (norte e sul) entre **10th Avenue North e Purdy Lane/Alameda Drive** (WPTV) / entre Cresthaven Blvd e 10th Ave N (CBS12); desvios por Haverhill Rd e Kirk Rd | PBSO, condado **[OFICIAL]** **[div]** de trecho |
| tarde | Queda de energia na área (linhas cortadas) e adutora rompida | Wikipedia; testemunhas **[1 fonte+]** |
| tarde | Área tratada como **cena de crime** pelo PBSO: evacuação só começa com autorização; **Palm Tran** com ônibus prontos; **Cruz Roja** de prontidão | WPTV, Infobae **[OFICIAL]** via imprensa |
| tarde | **Governador da Flórida** visita o local: "cataclysmic plane crash", "looked like a missile going down"; sem feridos em solo | coletiva **[OFICIAL]** |
| tarde | **Secretário de Transporte** confirma no X: os 9 morreram, "horrific tragedy" | DOT **[OFICIAL]** |
| tarde/noite | **NTSB lança go-team** (o post do NTSB localiza o acidente em "Lake Worth Beach"); FAA envia equipe de apoio | NTSB via AGN **[OFICIAL]** |
| noite | ~**600 moradores** do parque de casas móveis vão para 2 abrigos (Greenacres Community Center, 501 Swain Blvd) | comissionado do Distrito 3 **[OFICIAL]** |
| — | **Bombardier**: "deeply saddened", coopera com os investigadores, não comenta causas | NBC, Telemundo **[OFICIAL da empresa]** |
| 02/11 | Escola **John I. Leonard Community High School** fechada; missa às 10h | WPTV, CBS12 |
| 02/11 | **Briefing do NTSB em West Palm Beach** (hora não divulgada). Conteúdo **não obtido** até o fechamento | CBS12 |

**As contas [calc]:**
- **Queda média:** 35 450 → 8 750 ft = 26 700 ft em 66-70 s = **~23 000-24 300 ft/min** de média (**~120 m/s, ~430 km/h só na vertical**). FAA: "pouco mais de 1 minuto", "~350 ft/s".
- **Do topo ao chão:** 12:48:16 → ~12:49:40 = **~84 s**. Em queda livre no vácuo, 35 000 ft levariam **46,6 s** (chegando a 457 m/s). O avião levou quase o dobro porque **continuava voando**: asa e arrasto freavam e desviavam a queda (espiral).
- **Dos 8 750 ft ao solo:** a 20 000 ft/min = 26 s; a 25 000 = 21 s; a **30 000 = 17,5 s**; a 32 640 = 16 s. Com a última posição às 12:49:31, o impacto fica em **~12:49:35-12:49:45**.
- **Mach no pico:** 506 kt de velocidade no solo a 28 450 ft (som a ~593 kt na atmosfera padrão) = **~M0,85** **[calc, indicativo]**: o vento real em altitude não é conhecido, então isto não é a velocidade do ar. O cruzeiro "rápido" do Learjet 60 é **M0,81** (AOPA). Coerente com o "overspeed condition" do rádio.
- **Temperatura:** −47 °C a FL350; a atmosfera padrão dá −54 °C. O ar estava **~7 °C mais quente que o padrão** (típico de convecção tropical).

---

## 2. O avião (Learjet 60) para a modelagem 3D

| Item | Valor | Fonte / grau |
|---|---|---|
| Fabricante | **Learjet Inc. (Wichita, Kansas), subsidiária da Bombardier**; família Learjet encerrada em **2021** | Aviacionline; TCDS EASA **[OFICIAL]** |
| Origem | derivado do **Learjet 55**; 1º voo 10/10/1990; serviço a partir de jan/1993; **60XR** a partir do nº de série 319 (aviônica Pro Line 21, 2007). N722BD (nº 271) é **60 "clássico", não XR** **[calc]** pelo nº de série | Wikipedia; Aviacionline |
| Produção | **~429** (infobox) **[div]** texto da Wikipedia: 318 Learjet 60 até 2007 + 60XR até 2012/13 | Wikipedia **[div]** |
| Comprimento | **17,88 m** (58 ft 8 in) | Wikipedia (Brassey's) **[1 fonte+]** |
| Envergadura | **13,34 m** (43 ft 9 in) | idem |
| Altura | **4,47 m** (14 ft 8 in) | idem |
| Área da asa | **24,57 m²** | idem |
| Configuração | **asa baixa enflechada** com **winglets**; **cauda em T** (estabilizador horizontal no topo da deriva); **2 turbofans na traseira da fuselagem** (montados em pilones laterais, atrás da asa); trem triciclo retrátil; janelas ovais; porta dianteira à esquerda | descrição padrão do tipo (fotos do N722BD em flycraft/onespotter, §8). Ângulo de enflechamento **não achado** |
| Motores | **2 × Pratt & Whitney Canada PW305A**, **4 600 lbf (20 kN)** cada, FADEC | Wikipedia; AOPA; TCDS **[OFICIAL]** |
| Peso vazio | 14 640 lb (6 641 kg) (Wikipedia) / peso básico operacional **15 180 lb** (AOPA, 60XR) | **[div]** |
| MTOW | **23 500 lb (10 659 kg)**; máx. sem combustível 17 000 lb; máx. pouso 19 500 lb | AOPA, Wikipedia (60XR). **[div]** o diagrama de CG do TCDS EASA mostra 22 750 lb / MZFW 16 500 lb para uma variante; usar 23 500 |
| Combustível | **7 910 lb (1 185 gal)**; com tanques cheios a carga paga é só **660 lb** | AOPA |
| Cruzeiro | rápido **466 kt / M0,81**; típico 453 kt / M0,79; econômico 426 kt / M0,74 | AOPA (dados do fabricante) |
| Mmo / Vmo | **não confirmados** (o TCDS EASA tem a tabela, mas como imagem). Não dizer número no áudio; dizer "**por encima de su velocidad máxima de diseño**" só se o NTSB confirmar overspeed | **[NÃO CONFIRMADO]** |
| Teto | **51 000 ft** (15 545 m); cabine a 8 000 ft na altitude máxima (9,4 psi) | AOPA, Wikipedia |
| Alcance | ~**2 410-2 450 nm** (4 460-4 540 km) | Wikipedia, AOPA |
| Capacidade | **2 pilotos + até 8 passageiros** (no voo: 9 pessoas ao todo) | Aviacionline |
| Pintura do N722BD | **não confirmada** nesta sessão. Fotos públicas do avião em flycraft.com e onespotter.com (§8): conferir antes de modelar. Sugestão: se não houver foto confiável, **branco genérico com faixa cinza**, **sem a matrícula legível** | **[NÃO CONFIRMADO]** |

**Escala para a cena [calc]:** o avião (17,9 m) é mais curto que a largura da Military Trail com canteiro (6 faixas, ~30-35 m **[NÃO CONFIRMADO]**, medir no Google Earth). A cratera deve ser **menor que o avião**: o avião se desintegra para dentro do solo.

**Histórico de acidentes do Learjet 60 (o tipo):**
- **19/09/2008, Columbia (Carolina do Sul):** decolagem abortada depois de V1; **pneus muito abaixo da pressão**; um pneu rompido danificou um microinterruptor e o reverso passou a dar **empuxo para a frente**. 4 mortos (2 tripulantes + 2 passageiros), 2 feridos. O FAA passou a exigir verificação da pressão dos pneus a cada 4 dias. **Não é perda de controle em voo.** Wikipedia (NTSB) **[1 fonte+]**.
- **01/11/2026, Greenacres:** este caso.
- **Não achei** nesta sessão outro acidente do **Learjet 60** por perda de controle em cruzeiro (a busca no ASN deu 403). Ver §7 take C (Learjets **antigos**, modelos 23-25, NTSB 1980).

---

## 3. Meteorologia e o mecanismo físico

### 3a. O tempo real (oficial)
**Convective SIGMETs (Aviation Weather Center, Kansas City):**
- **45E**, emitido 16:55 UTC (11:55 EST), válido até **18:55 UTC**: "FL AND CSTL WTRS, FROM 70ESE OMN-70E MIA-50E EYW-20WNW PIE-70ESE OMN. **AREA TS MOV LTL. TOPS ABV FL450.**" O polígono (de 70 nm a ESE de Ormond Beach a 70 nm a E de Miami, Key West e Tampa) cobre **toda a península sul, inclusive Palm Beach**. **Estava em vigor na hora do acidente.** **[OFICIAL]**
- **48E**, emitido 17:55 UTC (6 min depois do impacto): mesma área (80NE TRV-70E MIA-50E EYW-RSW-ORL), "AREA TS MOV LTL. **TOPS ABV FL450**". **[OFICIAL]**
- **51E** (17:55 UTC): área de tempestades **em desenvolvimento** sobre o mar, 90-140 nm a ENE de PBI, topos a FL340 **[OFICIAL]**.
- Em palavras: **uma área de tempestades quase parada sobre o sul da Flórida, com topos acima de 45 000 pés**, ou seja, **mais de 10 000 pés acima** do Learjet a 35 000. O avião voava **dentro da altura das nuvens de tempestade**.
- A Wikipedia (Learjet 60) também diz que um Convective SIGMET estava ativo na área **[1 fonte]**, o que bate com o texto oficial acima.

**METAR de Lantana (KLNA), o aeroporto mais próximo com dados (5,3 km):**
- **17:35 UTC (12:35 EST):** `KLNA 011735Z AUTO 12007G19KT 3SM VCTS SCT023 BKN029 OVC037 26/22 A3008 RMK AO2 LTG DSNT W THRU N` = vento de 120° a 7 kt com rajadas de 19, **visibilidade 3 milhas**, **trovoada nas vizinhanças**, nublado a 3 700 ft, 26 °C, raios distantes de oeste a norte.
- **17:55 UTC (12:55 EST, 5 min após o impacto):** `KLNA 011755Z AUTO 09012G19KT 7SM VCTS OVC021 27/22 A3007 RMK AO2 LTG DSNT ALQDS` = rajadas de 19 kt, **céu fechado a 2 100 ft**, trovoada nas vizinhanças, **raios distantes em todos os quadrantes**.
- Às 16:15-16:55 UTC o METAR registrou **TS** (trovoada no aeródromo).
- **KFXE** (Fort Lauderdale Exec., 60 km ao sul), 17:53 UTC: chuva, névoa, visibilidade 2,5 mi, teto 1 600 ft, VCTS.
- **KPBI:** METAR **não obtido**. Wikipedia: visibilidade 2-10 mi, rajadas de 20-30 mph, NEXRAD mostrando tempestades no sul da Flórida ~5 min antes **[1 fonte]**.
- NWS: **flood watch** (alerta de inundação) para o sul da Flórida até segunda à tarde **[OFICIAL]**.

**Luz para a cena:** o sol estava a **~47° de altura, azimute ~196° (SSO)** às 12:49 EST **[calc]**, mas com **céu encoberto a ~2 000 ft e chuva intermitente**: luz **difusa, cinza**, chão molhado. Acima das nuvens, a FL350, luz forte entre torres de cumulonimbus.

### 3b. O que significa "turbulência moderada, variações de 700 pés" [calc]
- **Definição oficial (AIM, Tabela de intensidade de turbulência, FAA):** "moderate" = mudanças de altitude e/ou atitude, **mas o avião continua sob controle positivo o tempo todo**; variações de velocidade; ocupantes sentem pressão contra os cintos; objetos soltos se deslocam. "Severe" = **mudanças grandes e abruptas**, perda momentânea de controle. **[OFICIAL]** (AIM 7-1-21 / tabela de turbulência; citado de memória, conferir o texto exato antes de citar).
- **700 pés = 213 m.** Se o avião sobe e desce 213 m num ciclo suave:
  - ciclo de **40 s** → aceleração extra ±0,27 g (sentiria de 0,7 a 1,3 g);
  - ciclo de **30 s** → ±0,48 g (0,5 a 1,5 g);
  - ciclo de **20 s** → ±1,07 g (de **~0 g** a **~2,1 g**: copos flutuando, gente sem cinto batendo no teto);
  - ciclo de **10 s** → ±4,3 g (acima do limite estrutural: **não aconteceu**, senão a tripulação não descreveria como "moderada").
  - **Para o áudio: "subir y bajar 200 metros en segundos, como un ascensor sin frenos"** (sem dar g exato; a duração do ciclo é desconhecida).
- **700 pés em 10 s** equivalem a **~4 200 ft/min (21 m/s, 77 km/h) de corrente vertical**, a ordem de grandeza das correntes dentro de uma tempestade.
- **Carga de projeto (14 CFR 25.341):** a rajada de referência para certificação cai de 56 ft/s ao nível do mar para 44 ft/s a 15 000 ft e 20,86 ft/s a 60 000 ft. A **35 000 ft: ~34 ft/s EAS (10,3 m/s)** **[calc]**. Para o Learjet 60 a ~8,5-9 t, a 242 kt EAS (435 kt verdadeiros a FL350), essa rajada dá **Δn ≈ ±0,85-0,9 g** **[calc]** (fórmula de rajada de Pratt, inclinação de sustentação ~4,5/rad, fator de alívio ~0,86). Isto é, o avião é **projetado para aguentar rajadas desse tamanho com folga**.
- **Limite estrutural (14 CFR 25.337):** fator de carga limite positivo = 2,1 + 24 000/(W+10 000), mínimo 2,5: para 23 500 lb dá **+2,8 g**; negativo **−1,0 g**; a estrutura tem de aguentar **1,5×** isso sem romper (25.303) **[calc]** sobre a regra **[OFICIAL]**.
- **Conclusão para o roteiro:** a turbulência relatada, **sozinha**, não basta para derrubar um jato certificado. O perigo está no que ela provoca: **perda da atitude ("upset")**, velocidade passando do limite, e o avião entrando numa espiral da qual não sai.

### 3c. O mecanismo provável de "upset" em convecção (para leigo) [hipótese; o NTSB não disse nada]
1. **Perto do topo de uma tempestade**, o ar sobe e desce em colunas de dezenas de km/h. O piloto automático tenta **manter a altitude** a cada solavanco, mexendo no nariz e na potência. FAA (AC 00-24C, cancelada em 2022 e incorporada ao Aviation Weather Handbook FAA-H-8083-28): turbulência perigosa existe em **todas** as tempestades; turbulência de cisalhamento a **até 20 milhas** de lado de uma tempestade severa e milhares de pés acima do topo; a recomendação clássica é **evitar por 20 nm** e, se dentro, **manter a atitude, não a altitude**. **[OFICIAL]** (20 milhas e "todas as tempestades": confirmados via SKYbrary/AOPA; a frase "attitude, not altitude" **não foi reconferida no documento** nesta sessão).
2. **Alta altitude = margem pequena** ("coffin corner"): a FL350 o ar tem **~31% da densidade** do nível do mar **[calc]**; a velocidade de estol e a velocidade máxima (Mach) ficam próximas. Um solavanco para baixo + nariz baixo leva o avião **acima do Mach máximo** em segundos.
3. **Acima do Mach máximo**, em jatos de asa enflechada aparece o **"Mach tuck"**: o centro de sustentação se desloca para trás e o nariz **tende a baixar sozinho**, acelerando mais (ciclo vicioso). Os Learjets antigos tinham sistemas específicos contra isso (AOPA; NTSB 1980) **[1 fonte+]**. "**Overspeed condition**", dito pela tripulação, é exatamente o alarme de excesso de velocidade.
4. **Espiral:** se as asas não estão niveladas, a sustentação vira o avião em vez de segurá-lo; puxar o manche aperta a curva sem levantar o nariz ("spiral dive"). O ADS-B mostra **~190° de giro à direita** durante a queda.
5. **Gelo:** a tripulação relatou "clear ice" a −47 °C. **Água líquida super-resfriada praticamente não existe abaixo de ~−40 °C** (congela sozinha, "nucleação homogênea"), então a −47 °C o mais provável é **gelo de cristais** (alta concentração de cristais de gelo perto do topo da convecção), o mesmo fenômeno que **entupiu os tubos de Pitot do Air France 447** (FL350, zona de convecção, 2009) **[NÃO CONFIRMADO para este caso]**; física da nucleação e AF447 = fontes externas não reabertas nesta sessão (BEA, relatório final 2012; AMS Glossary).
- **Opiniões de especialistas na imprensa (não usar como fato):** "gelo e turbulência podem ter causado um estol" (especialista em segurança aérea à AP); "um Learjet tende a ficar vertical quando perde o controle em altitude e continua acelerando" (advogado aeronáutico, ex-engenheiro da NASA); "as tempestades podem ter contribuído" (especialista à CBS12). **[NÃO CONFIRMADO]**

### 3d. Velocidade e energia no impacto [calc]
- **Componente vertical:** 30 000-32 640 ft/min = **152-166 m/s (550-600 km/h)**; o ADS-B satura em 32 640, então pode ter sido mais.
- **Componente horizontal:** 231 kt no último dado (119 m/s).
- **Resultante:** **~190-220 m/s = ~700-790 km/h (~375-425 kt)**, trajetória a **~52-57° abaixo do horizonte** no último dado; vídeos mostram impacto **quase vertical** (a trajetória ficou ainda mais inclinada nos últimos segundos). Um blog independente (talkingwreckless) chega a 219,6 m/s (491 mph) a ~46°. **Para o áudio: "a más de 700 kilómetros por hora".**
- **Massa estimada no impacto:** peso básico 15 180 lb + 7 passageiros com bagagem ~1 400 lb + combustível restante 2 000-4 200 lb (não se decola com tanque cheio e 9 a bordo: a carga paga com tanque cheio é só 660 lb) = **~18 600-20 800 lb (8,4-9,4 t)**.
- **Energia cinética:** ½·m·v² = **~155-230 MJ** (≈ **40-55 kg de TNT**). Faixa central: 8,7 t a 205 m/s = **~183 MJ (~44 kg de TNT)**.
- **Comparação:** o combustível restante (1-1,9 t de querosene a 43 MJ/kg) guarda **~40 000-80 000 MJ**, ou seja, **200 a 400 vezes** a energia do choque. **A bola de fogo é o combustível, não a velocidade.**
- **Desaceleração:** o avião se para em poucos metros (cratera); a ordem de grandeza é de **centenas de g** em ~0,1 s (talkingwreckless: ~490 g em 5 m) **[calc, fonte secundária]**: não sobrevivível. **Não detalhar no vídeo** (regra do canal: respeito às vítimas).

---

## 4. Local do impacto (para o mapa 3D)

- **Município / área:** a imprensa e o PBSO dizem **Greenacres**; o bairro é **Cresthaven** (área não incorporada do condado, colada a Greenacres). Outras denominações na imprensa: "Lake Worth Beach" (post do NTSB), "Palm Springs" (AIN), "West Palm Beach" (ASN). **No áudio: "Greenacres, en el condado de Palm Beach, Florida".** Greenacres: ~45 000 habitantes, ~11 km (7 mi) a SO de West Palm Beach (AP/PBS).
- **Via:** **Military Trail (State Road 809)**, avenida norte-sul de várias faixas com canteiro central. Impacto **no lado da via ("beside a road")**, deixando **cratera no pavimento**, entre **Cresthaven Boulevard (sul)** e **10th Avenue North (norte)** (ABC, CBS, Aviacionline). Infobae: **South Military Trail perto de Marilyn Drive**. O trecho fechado vai de **10th Ave N a Purdy Lane/Alameda Drive**.
- **Parque de casas móveis:** a cratera ficou **na única entrada** de um parque de casas móveis que fica **atrás da South Military Trail** (Infobae; comissionado do condado: "massive crater near the entrance"). **~600 moradores** evacuados. Nome **não achado**: conferir no Google Maps ao redor das coordenadas.
- **Outros pontos:** um centro comercial ("strip mall") no **3001 South Military Trail** (Latin Times **[1 fonte]**); "perto de um shopping center" (ABC); **escola John I. Leonard Community High School** perto; uma casa atingida por destroços a **~500 ft (150 m)** (morador à NBC/AP); destroços espalhados "a distância significativa" (governador). Wikipedia: o avião "quase atingiu uma casa"; linhas de energia e **adutoras subterrâneas rompidas**.
- **Coordenadas:** **26,6329 N, −80,1131 W** (26°37′58.4″N 80°06′47.2″W, Wikipedia) **[1 fonte]**.
- **Distâncias [calc]:** **5,9 km (3,6 mi, 3,2 nm) a SSO de Palm Beach International (KPBI)**; **5,3 km de Lantana (KLNA)**; ~11 km do centro de West Palm Beach; **~10 km da costa atlântica** (estimativa de mapa, conferir); **366 km (198 nm) de North Eleuthera**.
- **Direção da queda:** o avião vinha para o **leste (098°)** a 35 000 ft e caiu girando **para a direita** até apontar ~**290°** (ONO) no último dado **[1 fonte, ADS-B]**. Para a câmera 3D: entrada pelo oeste, espiral à direita, impacto quase vertical.
- **Elevação do terreno:** planície costeira, poucos metros acima do mar **[NÃO CONFIRMADO]** (medir em DEM).

---

## 5. O que ainda não se sabe / hipóteses da imprensa

| Item | Situação |
|---|---|
| **Causa** | **Nenhuma** declarada. Linhas de investigação citadas: destroços, comunicações ATC, tempo, registros do avião, dados de voo (NTSB via AGN) **[OFICIAL]** |
| **Gravadores (CVR/FDR)** | **Não se sabe** se o avião tinha CVR/FDR nem se foram recuperados. Regras da FAA exigem CVR em jatos multimotores **operados por remuneração** (CNN); fonte da CNN especula que o FDR pode ter sido destruído **[NÃO CONFIRMADO]** |
| **Operação** | Part 91 (privado) ou Part 135 (fretado)? Operador real? **[NÃO CONFIRMADO]**. Importa porque muda as regras de tripulação, manutenção e gravadores |
| **Vítimas** | nomes, nacionalidades, relação entre os passageiros e **motivo da viagem às Bahamas: nada divulgado** (até 02/11 de manhã). Divisão 7 passageiros + 2 tripulantes só numa fonte. A gravação sugere **uma piloto (voz feminina)** e um segundo tripulante. **No áudio: "dos pilotos y siete pasajeros" só se o NTSB confirmar; senão "nueve personas"** |
| **Por que desceu de FL410 para FL350** perto de Naples | desconhecido |
| **O que aconteceu entre a subida (12:48:12) e a queda (12:48:16)** | desconhecido; é o centro da investigação |
| **Gelo** | "light clear ice, manageable" a −47 °C: fisicamente estranho para gelo de água líquida (ver §3c). Hipótese de **gelo de cristais / Pitot** **[NÃO CONFIRMADO]** |
| **Ruptura em voo?** | a AP e a Telemundo dizem que a descida passou dos "limites de projeto"; não há relato de peças caindo antes do impacto. Debris num só lugar (cratera) sugere avião **inteiro até o chão** **[NÃO CONFIRMADO]** |
| **Hipóteses na imprensa** | estol por gelo + turbulência (especialista à AP); tempestades (especialista à CBS12); "Learjet vai a vertical e não para de acelerar" (advogado aeronáutico à KVUE/CBS Austin). **Todas [NÃO CONFIRMADO]** |
| **Transcrição ATC** | só versões não oficiais (LiveATC, posts no X que divergem na redação). **Usar no vídeo só frases que AP + NBC + AIN repetem**: "light clear ice... manageable... moderate turbulence", "mayday, mayday", "overspeed condition, descending 20,000 feet per minute", "we're going to crash into the ground". **Nunca o nome próprio dito na cabine** |
| **Dado em conflito** | "35 250 → 8 750 ft em pouco mais de 1 min a ~350 ft/s" (FAA via ABC): 26 500 ft a 350 ft/s = 76 s, o que bate com o ADS-B (~70-76 s) **[calc]** |
| **Próximos passos do NTSB** | briefing 02/11; documentação de destroços no local (Military Trail pode ficar fechada ≥ 30 dias); **relatório preliminar em ~30 dias (início de dez/2026)**; relatório final e causa provável em **12-24 meses** |

---

## 6. Fontes (acesso em 02/11/2026)

**Oficiais / dados primários**
- Aviation Weather Center (NOAA/NWS), Convective SIGMETs 41E-56E de 01/11/2026, via IEM AFOS: https://mesonet.agron.iastate.edu/cgi-bin/afos/retrieve.py?pil=SIGE&sdate=2026-11-01T15:00Z&edate=2026-11-01T19:00Z&limit=10&fmt=text
- METARs KLNA/KFXE, Iowa Environmental Mesonet: https://mesonet.agron.iastate.edu/request/download.phtml e https://aviationweather.gov/api/data/metar?ids=KLNA&format=raw&hours=48
- NTSB, Safety Recommendation A-80-53 a -55 (27/06/1980): https://www.ntsb.gov/safety/safety-recs/RecLetters/A80_53_55.pdf
- EASA, TCDS EASA.IM.A.212 Learjet M60, Issue 04 (12/11/2024): https://www.easa.europa.eu/en/downloads/7238/en
- 14 CFR 25.337, 25.341, 25.303 (eCFR): https://www.ecfr.gov/current/title-14/chapter-I/subchapter-C/part-25 (regras citadas de memória; conferir texto)
- FAA AC 00-24C "Thunderstorms" (cancelada em 22/12/2022): https://www.faa.gov/regulations_policies/advisory_circulars/index.cfm/go/document.information/documentID/1020774 ; resumo SKYbrary: https://skybrary.aero/bookshelf/ac-00-24c-thunderstorms
- FAA registry N722BD (via FlightAware): https://www.flightaware.com/resources/registration/N722BD

**Imprensa (inglês)**
- Wikipedia, "2026 Palm Beach County Learjet 60 crash": https://en.wikipedia.org/wiki/2026_Palm_Beach_County_Learjet_60_crash
- Wikipedia, "Learjet 60": https://en.wikipedia.org/wiki/Learjet_60
- AP via PBS NewsHour (01/11, 18:48 EST): https://www.pbs.org/newshour/nation/all-9-people-aboard-a-jet-that-crashed-in-florida-have-died-transportation-secretary-says
- NBC News (atualizado 02/11): https://www.nbcnews.com/news/us-news/jet-crashes-florida-nine-people-board-rcna606874
- CBS News Miami (02/11): https://www.cbsnews.com/miami/news/texas-jet-florida-crash-11-1-2026/
- ABC News (01/11): https://abcnews.com/US/learjet-9-aboard-crashes-palm-beach-florida-faa/story?id=137753599
- Al Jazeera (02/11): https://www.aljazeera.com/news/2026/11/2/nine-die-in-cataclysmic-florida-business-jet
- AIN, "Florida Learjet Crash Claims Nine": https://www.ainonline.com/aviation-news/business-aviation/2026-11-01/florida-learjet-crash-claims-nine
- Aviacionline (ADS-B detalhado, ATC): https://www.aviacionline.com/english/accidents-and-incidents/learjet-60-crashes-in-palm-beach-with-nine-people-on-board-what-we-know_a6ae7eec19b2d9a633cce2d67
- Aerospace Global News (7+2 a bordo, post do NTSB): https://aerospaceglobalnews.com/news/what-we-know-about-florida-learjet-crash/
- WPTV (ruas, abrigos): https://www.wptv.com/news/region-c-palm-beach-county/greenacres/fiery-incident-reported-near-military-trail-and-10th-avenue
- CBS12 (briefing do NTSB, abrigos, escola): https://cbs12.com/newsletter-daily/ntsb-to-brief-on-deadly-greenacres-jet-crash-as-600-residents-remain-displacedgreenacres-plane-crash-greenacres-jet-crash-learjet-60-crash-military-trail-crash-10th-avenue-north-crash-palm-beach-county-plane-crash-nine-killed-in-plane-crash-600-re
- NBC 6 Miami, live updates: https://www.nbcmiami.com/news/local/officials-respond-to-fiery-aircraft-incident-in-palm-beach-county/3881532/
- Yahoo / AP "What we know": https://www.yahoo.com/news/us/article/learjet-plane-crash-in-florida-kills-all-9-on-board-what-we-know-111242550.html
- vt.co (sequência do áudio): https://vt.co/news/us/learjet-60-crash-audio-florida
- Latin Times (3001 S Military Trail; 437 kt): https://www.latintimes.com/learjet-60-crash-greenacres-florida-nine-killed-600776
- Fox13 (vítimas não identificadas): https://www.fox13news.com/news/florida-plane-crash-what-we-know-about-victims
- AOPA, "Learjet 60XR: Bring it on" (2008; desempenho): https://aopa.org/news-and-media/all-news/2008/november/01/turbine-pilot-learjet-60xr-bring-it-on
- talkingwreckless (blog, contas de energia; **secundária**): https://www.talkingwreckless.com/p/the-anatomy-of-a-learjet-crash-203

**Imprensa (espanhol)**
- Telemundo 51 (frases do rádio em espanhol, vocabulário): https://www.telemundo51.com/noticias/local/avion-privado-learjet-60-accidente-condado-palm-beach-live-updates/2843443/
- Infobae (South Military Trail / Marilyn Drive, entrada do parque): https://www.infobae.com/estados-unidos/2026/11/02/parecia-un-meteorito-el-terror-de-los-vecinos-tras-el-accidente-aereo-del-learjet-60-en-palm-beach/
- CNN en Español (não abriu, HTTP 451): https://cnnespanol.cnn.com/2026/11/01/eeuu/accidente-aereo-condado-palm-beach-florida-trax
- El Nuevo Herald / Univision: **nada achado** na busca.

**Vocabulário ES da imprensa (Telemundo):** aeronave, jet privado, zona residencial, cráter, descenso pronunciado, **exceso de velocidad**, **formación de hielo**, turbulencia, precipitaciones, **parque de casas móviles**, desplazados, refugio, alerta de inundaciones, Junta Nacional de Seguridad en el Transporte (NTSB), Administración Federal de Aviación (FAA). Rádio traduzido: "Tenemos hielo claro y ligero que es manejable y turbulencia moderada"; "Estamos en condición de exceso de velocidad descendiendo 20,000 pies por minuto"; "Vamos a estrellarnos contra el suelo".

---

## 7. Três takes inéditos (fato contraintuitivo verificável)

**Take A: "Hielo a −47 °C... que no debería existir" (o mais forte, com cautela)**
- Fato verificável: a tripulação relatou **"clear ice"** com **−47 °C** lá fora (áudio, várias fontes). Física de manual: **gotas de água líquida congelam sozinhas abaixo de ~−38/−40 °C** (nucleação homogênea). Então, a −47 °C, quase não há água líquida para formar gelo "claro" como o de um para-brisa: o que existe perto do topo das tempestades é uma **nuvem densa de cristais de gelo**, que não gruda nas asas mas **pode derreter e recongelar dentro de sondas e motores aquecidos** ("ice crystal icing").
- Ponte: foi esse tipo de gelo, **a 35 000 pés, numa zona de tempestades**, que bloqueou os Pitot do **Air France 447** em 2009 (BEA).
- Regra: **não afirmar** que foi a causa aqui. Formular como pergunta: "¿Qué hielo puede formarse a 47 bajo cero?".
- Fontes a reabrir antes do roteiro: AMS Glossary ("homogeneous nucleation"); BEA, relatório final AF447 (2012); FAA, 14 CFR Part 33 Appendix D (ice crystal icing).

**Take B: "El avión cayó más rápido de lo que su transponder sabía contar"**
- O ADS-B transmite a razão vertical num campo de tamanho fixo. O N722BD chegou a **−32 640 ft/min**, o **valor máximo codificável** (Aviacionline), às 12:49:00: **a queda real pode ter sido mais rápida que o número**.
- Contraintuitivo 2: de 35 000 ft, uma pedra no vácuo chegaria ao chão em **46,6 s**; o Learjet levou **~84 s** **[calc]**. Não porque caía devagar: porque **continuava voando**, numa espiral de 190° à direita, com a asa ainda gerando força. É isso que torna a recuperação tão difícil: o piloto puxa e o avião aperta a curva em vez de subir.
- Fontes: Aviacionline (ADS-B); conta **[calc]**; especificação ADS-B (RTCA DO-260B) para o campo de razão vertical (**conferir** o máximo exato antes de citar; a Aviacionline diz 32 640).

**Take C: "El aviso del NTSB de 1980"**
- Em **27/06/1980**, o NTSB escreveu à FAA sobre **três Learjets** (modelos antigos) que **perderam o controle em altitude e terminaram em descidas de alta velocidade até o solo**; um voava em cruzeiro a **41 000 ft**, outro caiu no **Golfo do México vindo de 43 000 ft**. A carta diz que as descidas foram "inesperadas e sem aviso" e que, segundo os registros, "**once high speeds and steep descents have been established, complete loss of control may result and recovery may be impossible**". Em vários aviões foram achados **interruptores instalados para silenciar a buzina de excesso de velocidade (Mach)**.
- Regra: são **Learjets 23/24/25 dos anos 60-70**, **não o Learjet 60**. O take é sobre a **física dos jatos executivos de asa enflechada em altitude** (Mach tuck, margem estreita) e sobre por que existe o alarme de "overspeed", não sobre culpa do modelo.
- Complemento: a regra de certificação **14 CFR 25.341** já prevê rajadas de ~34 ft/s a 35 000 ft (**~±0,9 g** no Learjet 60 **[calc]**): **a turbulência sozinha raramente quebra um jato; o que mata é perder a atitude e a velocidade passar do limite**.
- Fonte: https://www.ntsb.gov/safety/safety-recs/RecLetters/A80_53_55.pdf **[OFICIAL]**.

**Extra (se sobrar tempo):** "**La bola de fuego no fue la velocidad**": energia do choque **~180 MJ (~44 kg de TNT)** contra **~40 000-80 000 MJ** do querosene restante (**200-400×**) **[calc]**.

---

## 8. Referências visuais para os modeladores (NÃO usar no vídeo)
1. Fotos do N722BD (pintura, matrícula): https://www.flycraft.com/aircraft/n722bd e https://onespotter.com/aircraft/fid/290594/N722BD
2. Local no mapa (coordenadas da Wikipedia): https://www.google.com/maps/search/?api=1&query=26.63289,-80.11311 (Military Trail entre Cresthaven Blvd e 10th Ave N; conferir a entrada do parque de casas móveis)
3. Trajetória e perfil de altitude (gráficos do Flightradar24): https://www.flightradar24.com/blog/flight-tracking-news/major-incident/learjet-60-crashes-near-west-palm-beach-florida/ (403 para o robô; abrir no navegador)
4. Vídeo de dashcam do impacto (imprensa): https://www.plataformamedia.com/en/2026/11/02/learjet-bound-for-the-bahamas-crashes-on-a-greenacres-florida-road-killing-all-nine-aboard-the-ntsb-leads-the-investigation-with-video/ e as galerias da NBC 6 (link do §6)
5. Fotos aéreas da cratera e da via (AP, Mark Elias, via CBS News Miami, §6) e galeria CBS12: https://cbs12.com/news/local/gallery/ntsb-to-brief-on-deadly-greenacres-jet-crash-as-600-residents-remain-displacedgreenacres-plane-crash-greenacres-jet-crash-learjet-60-crash-military-trail-crash-10th-avenue-north-crash-palm-beach-county-plane-crash-nine-killed-in-plane-crash-600-re
