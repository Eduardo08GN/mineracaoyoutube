# Adamuz (Córdoba), 18/01/2026: dossiê de fatos (reconstrução 3D, vídeo 3)

Canal "Segundo a Segundo": reconstrução 3D de tragédias de transporte (ES). O canal descreve o sistema que falhou; não acusa nem ridiculariza ninguém. Manequins sem rosto. **Sem nomes** de maquinistas, operadores, peritos ou vítimas (só cargos).
**[1 fonte]** = uma só fonte; **[div]** = fontes divergem (faixa + escolha para o áudio); **[calc]** = calculado por nós; **[NÃO CONFIRMADO]** = não sustentado (não usar como fato no áudio); **[OFICIAL]** = CIAF/AITAT, Ministerio de Transportes, Adif, Renfe, Iryo, Guardia Civil, juzgado, Junta de Andalucía.

**Fechamento do dossiê: 31/10/2026, ~19h de Madri (~15h de Brasília).** Caso de janeiro, com investigação aberta: **não há relatório final** (prazo legal: ~janeiro de 2027).
**Fuso:** todas as horas são de Madri. Em janeiro vale o horário de inverno (CET, UTC+1). Brasília = Madri − 4 h.

**Quem investiga:** a **CIAF** (Comisión de Investigación de Accidentes Ferroviarios), expediente **08/2026**, aberto em 19/01 (WIKI-ES). A autoridade independente criada pela Ley 2/2024 (AITAT) ainda não funcionava em janeiro; por disposição transitória o caso ficou com a CIAF (WIKI-ES). O estatuto da AITAT saiu depois, pelo **Real Decreto 141/2026, de 25/02/2026** (BOE, citado por WIKI-ES). Quem vai assinar o relatório final de Adamuz (CIAF ou AITAT): **[NÃO CONFIRMADO]**. No áudio: "la comisión que investiga los accidentes ferroviarios" ou "los investigadores".

**Documentos oficiais baixados** (pasta `roteiro/dados/adamuz/`):
- `ciaf_nota1_24h_19ene.pdf` (+ `.txt`): nota da CIAF depois das primeiras 24 h, distribuída como "Comunicado del Ministerio de Transportes", 19/01/2026. Cópia obtida no site da Vía Libre (FFE), porque o transportes.gob.es bloqueia download automático.
- `ciaf_nota5_10mar.pdf` (+ `.txt`): nota da CIAF de 10/03/2026, com a **sequência segundo a segundo dos registradores (JRU)**. Cópia hospedada pelo El Debate. **É o documento mais sólido sobre os segundos do acidente.**
- **NÃO obtidos:** a nota da CIAF de 23/01 (transportes.gob.es/recursos_mfom/actualizacion_nota_adamuz.pdf, com 403 e o Wayback bloqueado: uso a imprensa que a resumiu) e o informe da CIAF à juíza de 28/04 (38 pp., interno, não publicado: uso a imprensa que teve acesso).

---

## 0. Ficha rápida

| Item | Valor | Grau |
|---|---|---|
| Data e hora | **domingo 18/01/2026, 19:43** (impacto às **19:43:42**, segundo o relatório de abril). Primeiras notas: "19:45" | **[OFICIAL]** CIAF. **[div]** dos segundos: ver §1. No áudio: **"a las 19:43"** |
| Tipo | **descarrilamento seguido de colisão**: os 3 últimos carros do Iryo descarrilam numa **rotura de trilho**, invadem a via contígua e o Alvia, no sentido oposto, bate neles | **[OFICIAL]** CIAF (19/01, 10/03, 28/04) |
| Local | **LAV 010 Madrid–Sevilla**, entrada da estação técnica (puesto de banalización) de **Adamuz**, Córdoba. Rotura no **PK 318+681, via 1, trilho direito**; colisão no **PK ~318+173** (CIAF abril) ou "~318,200" (CIAF 19/01) | **[OFICIAL]** CIAF; "trilho direito" e "fractura transversal completa": ata da Guardia Civil (MONCLOA-ACTA) |
| Coordenadas | Rotura: **38,0078 N, −4,5655 W**; colisão: **38,0121 N, −4,5641 W** | **[calc]** sobre o OSM (§6). WIKI-ES dá 38,0097, −4,5647 (~PK 318,45) |
| Trem 1 | **Iryo 6189** Málaga (18:40) → Madrid, via 1, **ETR 1000 / série 109 (Hitachi), 8 carros**, **289 passageiros + 4 tripulantes + 1 maquinista** | Iryo (via RVOL, WIKI-ES). **[div]** CIAF 19/01: "300" viajeros |
| Trem 2 | **Alvia 2384** Madrid (18:10) → Huelva, via 2, **Renfe série 120 (CAF), 4 carros**, **~186 pessoas** | **[OFICIAL]** CIAF 19/01: 186 viajeros. **[div]** 184 (El Debate), 187 (RVOL) |
| Velocidades | Iryo **205 km/h** quando aparece a 1ª anomalia; Alvia **216-217 km/h** quando o sinal fecha. **No impacto: Iryo 152, Alvia 204 km/h.** Limite do trecho: **250 km/h** | **[OFICIAL]** CIAF 10/03 e 28/04. Limite: RGI, OSM |
| Sinalização | **LZB** + **ASFA 200** (ERTMS nível 2 em obras, sem serviço). O LZB **freou o Alvia sozinho** 5-6 s antes do choque | OSM (tags), **[OFICIAL]** CIAF 10/03 |
| Mortos | **46** (37 no Alvia, 9 no Iryo) | **[OFICIAL]** final desde 30/01 (RTVE, El Mundo via WIKI-ES). Evolução: §4 |
| Feridos | **152** (29 graves + 123 leves) | **[OFICIAL]** CIAF 19/01 (29+123 = 152 **[calc]**), igual à WIKI-ES. **[div]** "más de 120", 126, 245 |
| Causa | **rotura do trilho** no PK 318+681, numa **solda entre trilhos fabricados em 1989 e em 2023**; sem anomalias prévias nos dois trens | **[OFICIAL]** CIAF 28/04 (provisória). Solda 1989/2023: El Mundo 24/01, Guardia Civil. **Relatório final não publicado** |
| Investigação | CIAF: nota 24 h (19/01), nota 2 (23/01), nota 5 (10/03), informe à juíza (28/04), carta à Adif (jul). Judicial: **Tribunal de Instancia de Montoro, plaza 2**. Fiscalía Europea (fundos da UE) | §4 |

---

## 1. Linha do tempo

### 1a. Antes do acidente
| Quando | Fato | Fonte / grau |
|---|---|---|
| 2022-2023 | Trecho de Adamuz renovado pela UTE Guadalmez-Córdoba; em **mai/2025**, troca de aparelhos de via (110 desvios na linha). Ali ficaram **trilhos de épocas diferentes**: o ponto da rotura é a solda entre um trilho de **1989** e outro de **2023** | WIKI-ES; El Mundo 24/01 (via WIKI-ES); Maldita ("zona de transição") **[div]** sobre o que foi "renovado": Puente falou em renovação de 700 M€ e depois corrigiu |
| 2022 → jan/2026 | A conta @InfoAdif publicou **19 avisos** de incidências entre Alcolea, Adamuz e Villanueva (catenária, sinalização, infraestrutura, avarias de trens, um desvio em 23/12/2025); **7 depois de mai/2025** | TOBJ-INC (lista com datas). Maldita: 19 tuítes desde 2017 ainda visíveis. **Atenção:** a frase viral "Adif llevaba tres años reportando incidencias en el tramo" é **imprecisa**: os avisos são de atrasos, em trechos vizinhos, de tipos variados; Puente diz que "no tienen nada que ver" (TOBJ-INC). **Não usar como causa** |
| jun/2025 | O Governo responde ao Senado (pergunta do PP) reconhecendo "dos incidencias técnicas" de sinalização entre Adamuz e Villanueva de Córdoba | Vozpópuli (via busca) **[1 fonte]** |
| ~10/11/2025 e 07/01/2026 | Inspeções: auscultação por ultrassom do trecho (10/11) e "última revisión completa" (07/01, 11 dias antes) | Nota do Ministério de 23/01 e Adif, via busca **[div]**: o relatório da Guarda Civil (TOBJ-FIS) diz critério de ultrassom **anual**, próximo previsto para **mar/2026**, referência mai/2025. No áudio: "las inspecciones periódicas no detectaron el defecto" |
| **17/01, 21:46** | A tensão do **circuito de via 667** (via 1, PK 319+412 a 318+665) cai de **~2,2 V para ~1,5 V** e **não volta** até o acidente. O alarme só dispara abaixo de **0,78 V**. Nenhum aviso | Relatório da Guardia Civil ao juzgado (28/03), via MONCLOA-SAM, ARA-22H, BOLSA-EP, DT-GC. **[div]** limiar: 0,780 V (Hitachi, prestadora) × 1 V (Adif) |
| 18/01, durante o dia | **19 maquinistas** passam pelo ponto; nenhum reporta incidência, **um lembra de um golpe do lado direito** | TOBJ-FIS, ARA-22H (relatório da Guardia Civil) |
| 18/01, **17:21, 19:01, 19:09** | Três trens anteriores (Iryo 109-011, Iryo 109-003 e um Renfe série 130) ficam com **marcas geometricamente compatíveis** nas rodas do lado direito | **[OFICIAL]** CIAF 23/01 via DL-CIAF. **[div]** leve: WIKI-ES escreve "109-012" para o das 17:21; usar "tres trenes anteriores" |
| 18:10 | Alvia 2384 sai de Madrid-Atocha para Huelva | RVOL, WIKI-ES |
| 18:40 | Iryo 6189 sai de Málaga para Madrid, com parada em Córdoba; o acidente ocorre ~10 min depois de sair de Córdoba | RVOL, WIKI-ES, RGI |
| ~18:15 | **Pôr do sol** em Córdoba: o acidente acontece **de noite** | **[calc]** (astronômico aproximado). Coerente com as câmeras do Iryo que captam "las luces frontales del Alvia" (INFOBAE-CIAF) |

### 1b. Os segundos (registradores jurídicos, enclavamiento e CCTV do Iryo)
| Hora | Fato | Fonte / grau |
|---|---|---|
| 19:43:20 | Iryo ocupa o **circuito de via 667** da via 1 (da saída do túnel Loma del Partidor Norte, **PK 319+412**, até o desvio Sul de Adamuz, **PK 318+656**): é o circuito com a rotura | **[OFICIAL]** CIAF 10/03. **[div]** TOBJ-CIAF: 19:43:21 |
| 19:43:29 | **Disjuntor do Iryo abre** a **205 km/h** (perturbação de tensão ou perda de contato do pantógrafo): **1ª anomalia** registrada | **[OFICIAL]** CIAF 10/03 |
| 19:43:33 | O **carro 6** do Iryo chega ao ponto da rotura | CIAF 28/04 via INFOBAE-CIAF |
| 19:43:33 | Alvia ocupa o circuito 613 da via 2 (PK 317+440 a 318+179, já dentro da estação de Adamuz). Iryo, a **204 km/h**, entra no circuito 645 (desvio **A645**, PK 318+656) passando o sinal de entrada E669; **alarme de temperatura nas caixas de graxa do carro 8** ("presumiblemente por ir ya descarrilado") aciona o freio do Iryo | **[OFICIAL]** CIAF 10/03 |
| 19:43:34 | **Primeiro eixo do carro 6 descarrila**; trem acima de 200 km/h | CIAF 28/04 via INFOBAE-CIAF, WIKI-ES |
| 19:43:35 | Catenária cai de **mais de 25 000 V para 590 V** | CIAF 28/04 via INFOBAE-CIAF **[1 fonte]** |
| 19:43:37 | **Desvio A645 perde a comprovação** (provável golpe dos carros descarrilados) | **[OFICIAL]** CIAF 10/03 e 28/04 |
| **19:43:37-38** | Por proteção, o **sinal de saída S613** da via 2 (lado Córdoba) passa de **branco (via livre) a vermelho**; o **LZB aplica frenagem de emergência no Alvia**, a **216-217 km/h**, com o nariz no **PK 317,940, a 188 m do sinal** (PK 318,128). Alarmes sonoros gravados | **[OFICIAL]** CIAF 10/03 (19:43:38, 216 km/h); CIAF 28/04 via INFOBAE-CIAF e busca (19:43:37, 217 km/h, 188 m). **[div]** de 1 s e 1 km/h |
| 19:43:40 | As câmeras do Iryo captam **os faróis do Alvia** | CIAF 28/04 via INFOBAE-CIAF |
| **19:43:42** | **Colisão** no PK ~318,173, na **parte traseira do carro 6 do Iryo**; Iryo a **152 km/h**, Alvia a **204 km/h**. O registrador do Alvia para por falta de alimentação | CIAF 28/04 via INFOBAE-CIAF e busca. **[div]** CIAF 10/03: registrador do Alvia para às **19:43:44** a 204 km/h ("presumiblemente" o choque) |
| 19:43:43 | Maquinista do Iryo aperta o **freio de emergência**; trem já a **141 km/h** | **[OFICIAL]** CIAF 10/03 |
| — | "No se aprecia en el registro del tren Alvia 2384 ninguna acción por parte del maquinista" | **[OFICIAL]** CIAF 10/03. **Leitura neutra:** o LZB já tinha freado; entre o sinal fechar e o choque houve 4-6 s **[calc]**. Não insinuar falha humana: a Guardia Civil descartou erro de maquinista (TOBJ-FIS, ARA-22H) |
| 19:43:45 | Queda de tensão na zona, registrada pelo CRC | WIKI-ES, RVOL |
| 19:44:03 | **Iryo para** na posição final | **[OFICIAL]** CIAF 10/03 |

**Quantos segundos [div]:** da 1ª anomalia (19:43:29) ao choque (19:43:42-44) = **13-15 s** (manchetes: "14", "15 segundos"); do 1º eixo descarrilado (19:43:34) ao choque = **8-10 s** **[calc]**; do sinal vermelho ao choque = **4-6 s** **[calc]**. As primeiras crônicas do CTC (RVOL) davam 19:43:40 e 19:43:49: **superadas**. **Escolha para o áudio:** "unos diez segundos entre el descarrilamiento y el choque" e "el Alvia frenó durante apenas cinco segundos".

**Coerência das contas [calc]:**
- Iryo: rotura (318,681) → choque (318,173) = **508 m**; de 19:43:33 a 19:43:42 (9 s) a ~178 km/h médios (204 → 152) = ~445 m. Fecha na ordem de grandeza (o choque é na traseira do carro 6, não na cabeça).
- Alvia: 317,940 → 318,173 = **233 m** em 4-5 s a ~210 km/h médios (= 58 m/s) → 233-290 m. Fecha.
- Desaceleração do Alvia: 217 → 204 km/h em ~4-5 s ≈ **0,7-0,9 m/s²**. Para parar de 217 km/h (60 m/s) nessa taxa: **~2,0-2,6 km**. O sinal fechou **188 m** à frente. **O freio tinha menos de um décimo da distância de que precisava.**

### 1c. Resgate (noite de 18 para 19/01)
| Hora | Fato | Fonte |
|---|---|---|
| 19:44:51 | 1ª chamada ao 112 Andalucía, de uma passageira do Iryo ("el tren ha volcado") | Junta (Moreno, 22/01) via MALDITA-CRONO, WIKI-ES |
| 19:45:02 | Maquinista do Iryo liga para o CRC de Atocha: acha que foi um **"enganchón" de catenária**; o CRC trata como tráfego suspenso por catenária | Puente no Senado 29/01, via MALDITA-CRONO **[OFICIAL]** |
| 19:46 | Interventora do Alvia liga para a Renfe: "golpe fuerte", "accidente grande" | Puente no Senado, via MALDITA-CRONO |
| 19:46:07 | Trem 2181 (que vinha atrás do Iryo) avisa: parado e sem tensão | MALDITA-CRONO, RVOL |
| 19:47 | 112 Andalucía ativado; Guardia Civil de Córdoba sabe pelo 112 | MALDITA-CRONO |
| 19:48:39 e 19:48:51 | CRC liga **duas vezes ao maquinista do Alvia**: sem resposta | Cronologia do Ministério 22/01, via MALDITA-CRONO **[OFICIAL]** |
| 19:49:33 | Interventora do Alvia, ferida na cabeça, relata descarrilamento invadindo a via contígua, **pequeno incêndio**, feridos, passageiros quebrando vidros; o controlador diz não ter trem perto | Ministério 22/01, via MALDITA-CRONO **[OFICIAL]** |
| 19:49:35 | Maquinista do Iryo informa que descarrilou e invade a via contrária; pede parar todo o tráfego | WIKI-ES, RVOL |
| 19:50 | Adif ativa emergências; "sobre las 19:50" já se sabe que há algo grave no Alvia (diretor de Tráfego da Adif) | MALDITA-CRONO |
| 20:00 | 1ª patrulha da Guardia Civil chega (ao Iryo); Iryo avisa o 1º morto, carros 6 e 7 descarrilados, **carro 8 tombado** | MALDITA-CRONO |
| 20:02 | 1º sanitário (Cruz Roja) | MALDITA-CRONO |
| 20:07 | Os 112 de Madri e Andaluzia **duvidam** que haja um segundo trem e concluem que pode ser confusão | WIKI-ES **[1 fonte]** |
| 20:13 | @InfoAdif: o Alvia 2384 "también ha descarrilado" | MALDITA-CRONO |
| 20:15 | Patrulha localiza o segundo trem; maquinista do 2181 e mais duas pessoas inspecionam a via 2 | MALDITA-CRONO |
| 20:31 | Um passageiro do Alvia chega a pé ao Iryo e avisa que há vítimas na via | WIKI-ES **[1 fonte]** |
| 20:35-20:45 | 1ª equipe médica destinada ao Alvia; Guardia Civil chega ao Alvia | WIKI-ES |
| 21:00 | Começa a evacuação de feridos | MALDITA-CRONO |
| 22:00-23:00 | Ilesos e feridos leves levados de ônibus a Adamuz; fim da evacuação de leves às 23:00. Resgate dos presos e dos mortos segue a noite toda | MALDITA-CRONO |
| ~22:00 / 01:30 | Equipe da CIAF (secretário + 2 técnicos) sai de Madri ~22h e chega ~1:30; inspeciona até ~4:15 e volta às 9h com luz | **[OFICIAL]** CIAF 19/01 |

- **"45 minutos" para confirmar que o Alvia também tinha descarrilado** (elDiario.es/Cordópolis, 08/04, via WIKI-ES) **[1 fonte]**: de 19:43 a ~20:13-20:16 **[calc]** dá ~30-33 min. **[div]**; no áudio: "pasó cerca de media hora hasta que los equipos supieron que había un segundo tren".
- Vizinhos: ~**500 moradores de Adamuz** (município de ~4 100 hab.) foram os primeiros voluntários (WIKI-ES **[1 fonte]**). UME: 40 militares, 15 veículos (WIKI-ES).

---

## 2. Os trens

| | **Iryo 6189** | **Alvia 2384 (Renfe)** |
|---|---|---|
| Sentido / via | Málaga → Madrid, **via 1**, rumo norte | Madrid → Huelva, **via 2**, rumo sul |
| Série | **ETR 1000 / Frecciarossa 1000**, série espanhola **109**, Hitachi Rail, construído em **2022** (RGI); "cerca de 4 anos" (Adif) | **Série 120** (CAF), bitola variável; unidade **"61"** segundo WIKI-120 **[1 fonte]** |
| Composição | **8 carros**, ~202 m (WIKI-ETR1000, ver dossiê de Urda) | **4 carros**, **106,23 m**, 225 t vazio (WIKI-120) |
| Velocidade máx. | 300 km/h em serviço | **250 km/h** (WIKI-120) |
| A bordo | **289 passageiros + 4 tripulantes + maquinista** (Iryo, via RVOL e WIKI-ES) **[div]** CIAF "300", El Debate 294, La Nación 317 | **~186 pessoas** (CIAF) **[div]** 184/187. Nos 2 carros da frente: **53 passageiros** (37 + 16) |
| Mortos | **9** (7 no carro 8) | **37** (19 no carro 1, 10 no carro 2), incluindo o **maquinista**; um maquinista da Renfe que viajava como passageiro também morreu (RVOL) |

- **Escolha para o áudio:** "casi quinientas personas a bordo" (289 + 5 + ~186 ≈ **480** **[calc]**); "unos 290 pasajeros en el Iryo, unos 185 en el Alvia".
- **Numeração dos carros do Iryo:** carro 8 é o **último** no sentido Madrid (é o "coche de cola"); descarrilaram **6, 7 e 8**. O **carro 6** foi o primeiro a sair dos trilhos (CIAF). A CIAF 28/04 localiza o desvio A645 **entre o 1º e o 2º truque do carro 8** num certo instante (TOBJ-CIAF).

**Onde cada carro parou (para a maquete):**
- **Iryo:** os 3 últimos carros descarrilam e se deslocam **lateralmente para a via 2** (CIAF 19/01). Segundo a RGI, primeiro para a **direita** (para fora), depois para a **esquerda**, provavelmente por cima do **aparelho de via** da estação técnica **[1 fonte]**. O trem segue **~30 s** com eles descarrilados (19:43:34 → 19:44:03 **[calc]**) até parar às **19:44:03** (CIAF), na estação técnica de Adamuz (WIKI-ES). **Carro 8 tombado** (Iryo às 20:00, via MALDITA-CRONO). **Carro 4** descarrilou por completo sem tombar, ao ser atingido pelo carro 3 do Alvia (WIKI-ES **[1 fonte]**). Os carros dianteiros, intactos, foram desengatados e retirados depois (RVOL).
- **Alvia:** golpe na traseira do carro 6 do Iryo (CIAF abril; RVOL: "extremos de los coches 6 y 7"). Os **2 primeiros carros** seguem **~200 m**, caem por um **terraplén/talude de 4 m** e batem numa **parede de rocha** paralela à via (CIAF 19/01 para os 4 m; WIKI-ES e RGI para os 200 m e a rocha: "rock cutting wall"). O **3º carro** fica **atravessado entre as vias** ("jackknifed", RGI).
- **Distância final entre os dois trens: ~700 m** (WIKI-ES **[1 fonte]**).
- Um **truque de ~10 t** (provavelmente do carro 8 do Iryo) foi achado no **arroio Tamujosillo**, ~300 m do ponto do descarrilamento, a meio caminho entre os trens (RVOL **[1 fonte]**). O OSM tem o **arroio Tamujoso** cruzando a linha num bueiro no **PK ~318,13** **[calc]**, junto ao ponto de colisão.
- **Fogo:** a interventora do Alvia relatou um **"pequeño incendio"** (Ministério 22/01). Para a maquete: no máximo fumaça/brasas pontuais, **sem trem em chamas**. Câmeras do Iryo: "esquirlas incandescentes" pelas janelas (CIAF abril, via INFOBAE-CIAF).

---

## 3. A salvaguarda que falhou

### 3a. O trilho e a solda (a falha física)
- **Ponto:** PK **318+681**, **via 1**, **trilho direito** (sentido Madrid), "fractura transversal completa" (ata de inspeção ocular da Guardia Civil, via MONCLOA-ACTA, 04/09). Na **solda** que une um trilho de **1989** a outro de **2023** (El Mundo 24/01; Guardia Civil; Moncloa-ACTA).
- Um **fragmento de ~40 cm** se soltou na zona da fratura (CIAF 23/01 via DL-CIAF). **[div]** RGI fala em "300 mm"; usar "unos 40 centímetros".
- **Mecanismo descrito pela CIAF (nota 23/01, hipótese):**
  1. Com o trilho já fraturado, o trecho antes da fratura recebe a carga inteira da roda e **desce levemente**;
  2. A 1ª roda de cada truque bate na **cabeça do trilho fraturado**: daí as **marcas só em eixos ímpares**, do lado direito, nos carros **2, 3, 4 e 5** do Iryo;
  3. A cada golpe o trilho se deforma mais e vai **tombando para fora**;
  4. Na passagem do **carro 5** (marca diferente, na parte externa da banda de rodagem, "compatible con un impacto contra la cabeza de carril") o trilho já tombou; o **carro 6 perde a continuidade de rodagem e descarrila**. (DL-CIAF; WIKI-ES: trilho "volcado hacia el exterior, con marcas de pisada lateral")
- **Por que quebrou:** **ainda não há resposta oficial.** Hipóteses: defeito na solda; trilho "con distintos grados de acero" (R260 × R350HT) **[NÃO CONFIRMADO]** (Maldita, 27/01: tese que circulou, não comprovada); defeito de fábrica (Puente, elDiario, "Adif revisará lotes") **[NÃO CONFIRMADO]**; **grieta por fatiga** que cresceu até a ruptura (WIKI-ES atribui a uma ata de 03/08; peritos citados na busca) **[NÃO CONFIRMADO]**: em 04/09 o ministro disse que as provas periciais ainda não foram feitas (MONCLOA-ACTA). Sabotagem: "altamente improbable" (Guardia Civil).
- **Documentação das soldas:** a CIAF achou "incongruencias" nos documentos das soldas (El Español, El Debate 02/03); a Guardia Civil diz que não havia inspetores da Adif durante a execução da solda **"a verificar"** (TOBJ-FIS, p. 65 do relatório); Redalsa conferiu 114 soldas, mas a Adif não guarda os dados brutos (TOBJ-FIS). **A empresa contratada nega** falta de experiência dos técnicos (El País 10/04 via WIKI-ES). **No vídeo: sem nomes de empresas; "la documentación de la soldadura está bajo análisis".**
- Inspeção depois do acidente (Guardia Civil): **outros 5 pontos com fissuras a menos de 500 m** do descarrilamento (a 67, 119, 231, 239 e 476 m) (TOBJ-FIS **[1 fonte]**).

### 3b. As camadas de detecção (por que ninguém viu)
| Camada | O que deveria fazer | O que aconteceu | Fonte |
|---|---|---|---|
| **Inspeção por ultrassom** | achar fissuras antes de virarem ruptura | trecho auscultado em nov/2025 (Ministério) ou com próxima inspeção só em mar/2026 (relatório GC) **[div]**; a Adif reconhece que **a maioria dos defeitos pequenos em soldas não é captada pelo trem auscultador** | El Debate 05/02 (via busca); TOBJ-FIS |
| **Circuito de via** (corrente de baixa tensão pelos trilhos; o eixo do trem fecha o circuito = "ocupado") | pela especificação da Adif, o projeto deveria ter "la capacidad de poder detectar la rotura del carril"; o memorando do AVE de **1992** (ponto 2.9) pede o mínimo de conexões trilho-retorno e **aterramento dos postes coordenado com a sinalização** para isso | a tensão caiu **2,2 → 1,5 V** às 21:46 de 17/01; o alarme é **abaixo de 0,78 V**; **nunca disparou**. A prestadora (Hitachi Rail GTS) diz que, nesta linha, a confiabilidade da detecção é **"muy baja debido a la configuración eléctrica de la infraestructura"**; deixá-la mais sensível geraria "constantes falsas ocupaciones". O registro ficou passivo no **SAM** (sistema de apoio à manutenção, na base de **Hornachuelos**), consultado só quando há avaria | DT-GC, MONCLOA-SAM, ARA-22H, BOLSA-EP (todos citando o relatório da Guardia Civil de 28/03) |
| **Os próprios trens** | maquinista sente o golpe | 19 maquinistas passaram; 1 sentiu um golpe à direita; 3 trens com marcas nas rodas | TOBJ-FIS, CIAF 23/01 |
| **LZB (última barreira)** | frear qualquer trem diante de um sinal fechado | **funcionou**: fechou o S613 em ~1 s e freou o Alvia a 216-217 km/h, mas **a 188 m** do sinal. Precisava de ~2 km **[calc]** | CIAF 10/03 e 28/04 |

- **Versão da Adif [OFICIAL] (para equilíbrio):** os circuitos de via **não são projetados para detectar roturas**, servem para posicionar trens; o limiar é **1 V** e a variação foi de ~0,7 V; essa queda "puede ser coincidente con diferentes incidencias que no tienen por qué ser una rotura" (pedra de lastro, chapa de trem) (BOLSA-EP, ARA-22H, Forbes). Em 13/04 o presidente da Adif disse que não há prova conclusiva da rotura 22 h antes (El País via WIKI-ES).
- **Por que a corrente "não percebeu" a ruptura:** WIKI-ES, citando a **Cadena SER (17/07/2026)**, diz que a corrente voltou **pelo cabo de guarda e pelos postes da catenária** e que a Thales propôs mudar a distância entre os postes na renovação dos circuitos, o que não se fez por afetar a eletrificação de toda a Espanha e não estar no contrato. **[1 fonte, não abri o original: cadenaser.com bloqueado]**. O conteúdo é **coerente** com o memorando de 1992 (aterramento dos postes) e com a frase da Hitachi (configuração elétrica) **[2 fontes independentes para a ideia geral]**. No áudio: usar a versão genérica ("la configuración eléctrica de la línea"), não "cable de guarda".
- **Carta da CIAF à Adif (jul/2026) [OFICIAL, via ESD-CARTA]:** o procedimento da Adif de gestão de defeitos "no contempla un sistema dirigido a la detección de roturas de carril"; pede medidas para detectar uma rotura ou defeito grave **o quanto antes**. Também diz que o relatório final "probablemente" levará vários meses.

### 3c. Cena 3D passo a passo (resumo para a direção)
1. Noite. Via dupla reta (rumo ~194°, NNE-SSW), saída do túnel Loma del Partidor Norte (PK 319+412) a **731 m** da rotura **[calc]**.
2. **21:46 da véspera**: close no trilho direito da via 1; uma solda; o trilho se parte. Um medidor de tensão desce de 2,2 para 1,5 V e para acima da linha vermelha de 0,78 V.
3. Durante 22 h passam trens (contador: 19 maquinistas; 3 trens com marcas às 17:21, 19:01, 19:09).
4. **19:43:20**: Iryo (8 carros) a 205 km/h; rodas ímpares batem na ponta do trilho; o trilho tomba para fora.
5. **19:43:34**: o 1º eixo do carro 6 sai; carros 6-7-8 derivam para a via 2, faíscas; o carro 8 tomba.
6. **19:43:37-38**: o desvio A645 perde a comprovação; o S613 passa de branco a vermelho; HUD do Alvia: 217 km/h, 188 m até o sinal, FRENADO DE EMERGENCIA.
7. **19:43:40**: faróis do Alvia vistos pelas câmeras do Iryo.
8. **19:43:42**: impacto na traseira do carro 6 (Iryo 152, Alvia 204 km/h), PK ~318,173, sobre o vale do arroio.
9. Carros 1-2 do Alvia seguem ~200 m, caem 4 m e batem na parede de rocha; carro 3 atravessado; Iryo para às 19:44:03; trens a ~700 m um do outro.

---

## 4. Vítimas, resgate e consequências

### Cifras de vítimas (evolução)
| Quando | Mortos | Feridos | Fonte |
|---|---|---|---|
| 18/01 noite | 21 → "al menos 39" | "más de cien" | Cronista; RTVE 18/01 |
| 19/01 (nota 24 h) | **40** (provisório) | **29 graves + 123 leves** | **[OFICIAL]** CIAF 19/01 |
| 20-23/01 | 41 → 42 → 43 → **45** | | RGI (41), Diari de Tarragona (42), RTVE 25/01 (45) |
| 23/01 | as 45 vítimas morreram **no ato**, pelo impacto (autópsias) | | conselheiro da Junta, via WIKI-ES |
| **30/01** | **46** (uma passageira do Alvia morre na UTI) | **152** | RTVE 30/01, El Mundo 30/01, via WIKI-ES |
- **Escolha para o áudio: "46 muertos y 152 heridos".** Não usar 45 (anterior), nem 126/245 (fontes isoladas).
- Origem das vítimas: 28 de Huelva (o Alvia ia para Huelva) (WIKI-ES). **Sem nomes.**

### Consequências e medidas (cronológico)
- **19/01:** suspensa a alta velocidade Madrid–Andaluzia; plano alternativo com ônibus a partir de 20/01 (WIKI-ES). Três dias de luto oficial (Diario Córdoba 19/01). Juzgado de **Montoro**, plaza 2, assume o caso (Última Hora 19/01).
- **20-21/01:** Adif impõe limitações temporárias de velocidade em pontos da **Madrid–Barcelona** (160, depois 230 km/h em 4 pontos) por "rough riding" (Xataka, RVOL): **primeira consequência na rede**, fora da linha de Adamuz.
- **27/01:** pacote de **20 M€** do Governo para Adamuz e Gelida (outro acidente, 20/01, Rodalies) **[OFICIAL]**; indenização de ~72 000 € por morte (WIKI-ES).
- **29/01:** Puente comparece ao Senado (cronologia oficial). Missa em Huelva com os Reis.
- **9-11/02:** greve de maquinistas (SEMAF, CCOO, UGT desconvocam após acordo; CGT, SF e Alferro mantêm; ~700 trens cancelados) (WIKI-ES, RTVE 09/02).
- **17/02:** **reabertura da Madrid–Sevilla**, com limitações de velocidade iniciais (WIKI-ES, RGI).
- **05/03:** extração dos registradores jurídicos na CIAF, diante do Letrado da Justiça e da UCO (CIAF 10/03).
- **mar/2026:** **Fiscalía Europea (EPPO)** abre investigação sobre possível uso fraudulento de fundos da UE na obra do trecho (RTVE 20/03, El Mundo 19/03). O presidente da Adif comparece ao Congresso (24/03).
- **28/03 → 08/04:** relatório da Guardia Civil ao juzgado: rotura **~22 h antes**, alteração elétrica sem alarme (El País, El Mundo, ABC 08/04).
- **23/04:** a **AESF** (Agência Estatal de Segurança Ferroviária) impõe protocolo de emergência mais rígido e emite recomendação técnica sobre comunicações em emergências (El Economista 23/04; AESF REC TEC 2-26) **[1 fonte de imprensa + documento AESF citado]**.
- **27/04 em diante:** **comissão de investigação do Senado** sobre Adamuz (depois ampliada a Gelida) ouve CIAF, Adif, associação de vítimas (25/05) e outros (Forbes, ESdiario, Última Hora). Em **05/10**, o CEO da Iryo disse ali que a incidência mais reportada pelos maquinistas na Madrid–Sevilla era o **LZB** (ECON-IRYO, ver dossiê de Urda).
- **28/04:** informe da CIAF à juíza: rotura do trilho como causa; nenhuma anomalia prévia nos trens (provisório).
- **jun/2026:** juíza rejeita a recusa de dois dos três peritos judiciais (El Español 10/06).
- **jul/2026:** carta da CIAF à Adif sobre detecção de roturas; a associação de vítimas pede a suspensão temporária do tráfego ferroviário até haver certificação técnica (ESD-CARTA).
- **03/08 → 04/09:** ata de inspeção ocular da Guardia Civil: fratura transversal completa no trilho direito da via 1, PK 318+681, na solda 1989/2023. PP e Junta exigem responsabilidades; Puente diz que as perícias ainda não foram feitas (MONCLOA-ACTA).
- **Processos:** querela do Vox contra o presidente e a ex-presidente da Adif por homicídio imprudente (Última Hora 22/01); acusações unificadas por decisão judicial (TOBJ 28/04); a Iryo se apresenta como parte prejudicada (El Debate 10/04). **No vídeo: só "la causa judicial sigue abierta en un juzgado de Montoro".**

### O que ainda não se sabe (31/10/2026)
1. **Por que a solda quebrou** (defeito de execução, de material, fatiga, carga dinâmica): perícias metalográficas pendentes.
2. **Quando exatamente quebrou**: Guardia Civil diz 21:46 de 17/01; Adif contesta que a queda de tensão prove a rotura.
3. **Se uma alarme era tecnicamente possível** com aquela queda de tensão (o próprio relatório da Guardia Civil deixa em aberto, DT-GC).
4. A **data exata da última auscultação** por ultrassom do ponto ([div] nov/2025 × mai/2025 × "anual, próxima em março").
5. **Os segundos exatos** (19:43:42 × 19:43:44) até o relatório final.
6. **Relatório final** (CIAF/AITAT): previsto em até ~12 meses (jan/2027); a CIAF disse em julho que levaria "varios meses".
7. Responsabilidades judiciais: nenhuma acusação formal concluída.
8. **Ocupação exata** de cada trem (289/300; 184/186/187).

---

## 5. Conexão com Urda (só fatos)

| | **Adamuz** | **Urda** |
|---|---|---|
| Data | dom 18/01/2026, 19:43 | qua 28/10/2026, 8:53 |
| Linha | **LAV 010 Madrid–Sevilla**, PK 318+681 | **a mesma linha**, PK 118+800 |
| Distância entre os pontos | **~200 km** pela via (318,7 − 118,8 = 199,9) **[calc]**; Articulo14 (28/10): "200 kilómetros" | |
| Intervalo | **283 dias ≈ 9 meses e 10 dias** **[calc]** ("nueve meses después") | |
| Trens | **Iryo** (ETR 1000, série 109) + **Renfe** (Alvia série 120) | **Iryo** (ETR 1000, série 109) + **Renfe** (AVE série 103) |
| Mecanismo | **infraestrutura**: trilho quebrado → descarrilamento → **colisão lateral/frontal** com trem no sentido oposto | **sinalização em modo degradado**: queda do LZB → ordem de marcha → **alcance** (traseira) |
| LZB | **funcionou** e freou o Alvia (distância insuficiente) | **caiu**; o acidente ocorreu no modo de reserva |
| Mortos | 46 | 69 |
| Investigador | CIAF (AITAT ainda não operacional) | AITAT |

- **Ranking:** Adamuz foi a **primeira colisão entre dois trens na rede espanhola de alta velocidade**; Urda, a segunda (WIKI-ES de ambos). Hoje Adamuz é o **3º acidente ferroviário mais grave da Espanha no século XXI**, depois de Angrois (2013) e Urda (2026) (WIKI-ES).
- **O que a imprensa compara:** mesma linha, ~200 km de distância (Articulo14 28/10); a frase de Puente em janeiro, de que a probabilidade de outro acidente como Adamuz "es muy baja" (Articulo14, "hemeroteca", 28/10) **[1 fonte]**; fotos de Adamuz circulando como se fossem de Urda (Maldita 28/10); a associação de vítimas de Adamuz diz que Urda "desgarra unas heridas que todavía permanecen abiertas" (via busca, 28/10). Uma trabalhadora da Cruz Roja sobreviveu aos dois (Articulo14 28/10) **[1 fonte; sem nome no vídeo]**.
- **O que Adamuz mudou antes de Urda (fatos):** linha reaberta em 17/02; protocolo de emergência mais rígido da AESF (abr); carta da CIAF pedindo detecção de roturas (jul); comissão do Senado, onde em **05/10** o CEO da Iryo alertou sobre as desconexões do LZB (23 dias antes de Urda); estatuto da AITAT (RD 141/2026, fev). **O que não mudou:** o ERTMS nível 2 seguia sem serviço comercial em out/2026 (dossiê de Urda; OSM: "construction:railway:etcs=2").
- **Não há relação técnica demonstrada** entre as duas causas (busca, várias fontes). **Não sugerir no áudio que uma "levou" à outra.** Formulação segura: "dos fallos distintos, en la misma línea, en nueve meses".

---

## 6. Geografia para a maquete 3D

**Arquivos:** `dados/adamuz/osm_adamuz.json` (Overpass, 31/10/2026, ODbL), `adamuz_pk_coords.json` (PK → lat/lon), `dem_adamuz_eudem25.json` (perfil e cortes, OpenTopoData EU-DEM 25 m), consulta em `q_adamuz.txt`.

- **Calibração do PK [calc]:** o OSM traz as agulhas com PK exato (`railway:position:exact`): **A631** 316,984; **A632** 317,276; **Puesto de Banalización de Adamuz** 317,796 (38,01554, −4,56306); **A644** 318,366 (38,01036, −4,56468); **A645** **318,657** (38,00802, −4,56536). Ajuste linear ao traçado: resíduo ≤ 35 m. Perto da rotura, a referência local é a A645, a 24 m.

| Ponto | PK | lat, lon **[calc]** |
|---|---|---|
| Nariz do Alvia quando o S613 fecha | 317,940 | 38,0141, −4,5634 |
| Sinal S613 (via 2) | 318,128 | ~38,0125, −4,5640 |
| Bueiro do arroio Tamujoso | ~318,13 | 38,0125, −4,5640 |
| **Colisão** | **318,173** | **38,0121, −4,5641** |
| Desvio A645 (OSM, exato) | 318,657 | 38,00802, −4,56536 |
| **Rotura do trilho** | **318,681** | **38,0078, −4,5655** |
| Saída do túnel Loma del Partidor Norte | 319,412 (CIAF) | 38,0017, −4,5675 (OSM põe a boca em ~319,26) |

- **Distância rotura → colisão:** 508 m pelo PK (CIAF) = ~494 m em linha reta **[calc]**.
- **Traçado:** **reta** de PK 317,4 a 319,0, rumo constante **193,6-193,7°** (NNE → SSW, sentido Sevilla) **[calc]**; TOBJ-INC também chama o trecho de "línea recta". Depois de 319,26 a linha entra num túnel (OSM `layer=-1`) até ~321,2. Via dupla, 1 435 mm, 25 kV 50 Hz; OSM marca `maxspeed=250`, LZB, ASFA 200.
- **Relevo (EU-DEM 25 m, superfície; não resolve aterros) [calc]:** altitude **~246-280 m**. Perfil longitudinal: **vale do arroio em PK ~318,08-318,18 (~246-248 m)** → ali a via deve estar em **aterro** (é o ponto da colisão; coerente com o "terraplén de 4 m" da CIAF); **elevação em PK ~318,28-318,68 (~266-279 m)** → via provavelmente em **trincheira**, coerente com a "pared de roca" contra a qual bateram os carros do Alvia ~200 m depois do choque. Cortes transversais: em 318,173 o terreno cai dos dois lados (~248 → ~231 m a 200 m a oeste; → ~239 m a leste); em 318,681 o terreno sobe a oeste (276 m) e desce a leste (~266 m). **Inferências**: confirmar com fotos ou LiDAR PNOA.
- **Lugar no mapa:** sopé da **Sierra Morena**, ao norte do Guadalquivir. Povoado de **Adamuz a ~4,2 km a NE**; Villafranca de Córdoba a ~5,3 km; **o Guadalquivir passa a ~5,8 km ao sul** (não está na cena); rio Guadalmellato a ~5,2 km a SW **[calc, OSM]**. Córdoba fica ~25-30 km a SW (o Iryo tinha saído de lá ~10 min antes, RGI).
- **Município:** término municipal de **Adamuz** (WIKI-ES). Coordenada da WIKI-ES (38°00′35″N 4°33′53″O = 38,0097, −4,5647) cai ~PK 318,45, entre a colisão e a rotura **[calc]**; usar as nossas.
- **Iluminação:** noite (pôr do sol ~18:15 **[calc]**); câmeras do Iryo veem os faróis do Alvia. Clima do dia: **não pesquisado**.

---

## 7. Take inédito (~1 min)

**"La vía avisó 22 horas antes. En voltios."**
- Os trilhos de alta velocidade carregam, além do trem, uma **corrente elétrica baixinha**: o **circuito de via**. Quando um eixo passa, ele fecha o circuito e a tensão cai: assim o sistema sabe onde está cada trem (descrição genérica; Adif, BOLSA-EP). Pela especificação da própria Adif, o desenho devia também permitir **detectar um trilho partido**; o memorando do AVE de **1992** já pedia isso (DT-GC).
- Em **17/01, às 21:46**, a tensão do circuito 667, justamente o trecho da rotura, **caiu de 2,2 para 1,5 V e não voltou mais**. O alarme só toca **abaixo de 0,78 V** (DT-GC, MONCLOA-SAM, ARA-22H).
- Durante **22 horas**, o dado ficou gravado num computador de manutenção em **Hornachuelos**, que só se consulta quando há avaria (MONCLOA-SAM). Passaram **19 maquinistas**; um sentiu um golpe; **três trens** ganharam marcas nas rodas (TOBJ-FIS, CIAF 23/01).
- Por que não tocou? Segundo a prestadora do sistema, nesta linha a detecção é pouco confiável **por causa da própria configuração elétrica** que alimenta os trens; deixá-la mais sensível encheria a via de **falsos "ocupados"** (DT-GC). Em julho, a CIAF escreveu à Adif que o seu procedimento **"no contempla un sistema dirigido a la detección de roturas de carril"** (ESD-CARTA).
- **Contraintuitivo:** o trilho quebrado "deu sinal", e o sistema que media isso estava funcionando; o problema foi **onde estava a linha vermelha**. Ninguém precisava ver a fissura: a física já a tinha registrado.
- **Fecho com o segundo dado inédito (10 s):** a última barreira também funcionou. Quando os carros do Iryo tocaram o desvio, o LZB **fechou o sinal e freou o Alvia em ~1 segundo**, mas a 188 m. A 217 km/h, com a desaceleração registrada (~0,8 m/s²), parar exigiria **~2,0-2,6 km e mais de um minuto** de frenagem **[calc]** (60 m/s ÷ 0,8 m/s² ≈ 75 s). **O sistema reagiu em um segundo; a física pedia mais de um minuto.** Para o áudio: "le faltaban casi dos kilómetros".
- **Equilíbrio obrigatório no áudio:** "Adif sostiene que esa caída de tensión pudo deberse a otras causas y que estos circuitos no están diseñados para detectar roturas." Não afirmar que o alarme "teria evitado" o acidente: o próprio relatório da Guardia Civil deixa isso em aberto.
- **Por que é inédito:** os vídeos em espanhol contam "la vía se rompió 22 horas antes"; quase nenhum explica **o circuito de via, os 2,2 → 1,5 V contra o limiar de 0,78 V** e a frenagem automática que chegou 188 m antes do sinal. As duas peças são visuais (medidor de tensão + HUD de frenagem).

---

## 8. Fontes

| Cód. | Veículo | Título (resumido) | URL | Publicação (Madri) |
|---|---|---|---|---|
| **CIAF-1** | CIAF / Ministerio de Transportes **[OFICIAL]** | Comunicado: información de la CIAF tras las primeras 24 horas | https://vialibre-ffe.com/pdf/-accidente-adamuz-ComunicadoMinisterioTransportes.pdf (cópia `dados/adamuz/ciaf_nota1_24h_19ene.pdf`) | 19/01/2026 |
| **CIAF-2** | CIAF **[OFICIAL]**, NÃO baixado | Nota: actualización de información disponible (6 pp.) | https://www.transportes.gob.es/recursos_mfom/actualizacion_nota_adamuz.pdf (403) | 23/01/2026 |
| **CIAF-5** | CIAF **[OFICIAL]** | Nota sobre la investigación: actualización 10 de marzo de 2026 | https://www.eldebate.com/uploads/files/2026/03/11/nota_adamuz_5_10-mar.pdf (cópia `dados/adamuz/ciaf_nota5_10mar.pdf`) | 10/03/2026 |
| DL-CIAF | Diario de León | Primer informe confirma vía rota al paso del Iryo (resume CIAF-2) | https://www.diariodeleon.es/nacional/260124/2073352/primer-informe-confirma-via-rota-paso-iryo.html | 24/01 06:00 |
| INFOBAE-CIAF | Infobae | Conclusión del accidente de Adamuz: la CIAF dice que se rompió el carril... | https://www.infobae.com/espana/2026/04/28/conclusion-del-accidente-de-adamuz-la-ciaf-dice-que-se-rompio-el-carril-y-descarta-anomalias-previas-en-los-trenes/ | 28/04 (11:48 "EST" na página) |
| TOBJ-CIAF | The Objective | Informe de la CIAF (38 pp.) a la jueza de Montoro | https://theobjective.com/espana/tribunales/2026-04-28/tren-adamuz-carril/ | 28/04 |
| ESD-CARTA | ESdiario | Víctimas de Adamuz piden suspender el tráfico ferroviario (carta CIAF→Adif) | https://www.esdiario.com/andalucia/260708/192683/victimas-adamuz-enciende-alarmas-piden-oscar-puente-suspension-trafico-ferroviario-espana.html | 08/07 11:36 |
| MONCLOA-JRU | Moncloa.com | Los 14 trágicos segundos de las cajas negras | https://www.moncloa.com/2026/03/12/adamuz-cajas-negras-3365288/ | 12/03 05:20 |
| MONCLOA-SAM | Moncloa.com | El sistema de apoyo (SAM) avisó la noche antes | https://www.moncloa.com/2026/04/09/sam-aviso-accidente-de-adamuz-3369820/ | 09/04 05:25 |
| MONCLOA-ACTA | Moncloa.com | Moreno y el PP-A exigen responsabilidades... (ata de inspeção ocular) | https://www.moncloa.com/2026/09/04/moreno-pp-adamuz-puente-adif-3426216/ | 04/09 15:30 |
| ARA-22H | Ara (es) | La vía de Adamuz se rompió 22 horas antes... | https://es.ara.cat/sociedad/sucesos/via-adamuz-rompio-22-horas-accidente-sistema-adif-alerto_1_5701175.html | 08/04 14:01 |
| DT-GC | Diari de Tarragona (Europa Press) | La Guardia Civil dice que el sistema estaba preparado para detectar la rotura | https://www.diaridetarragona.com/espana/256654/guardia-civil-dice-sistema-preparado-detectar-rotura-via-adamuz_amp.html | 08/04 13:04 (atualiz. 28/04) |
| BOLSA-EP | Bolsamanía (Europa Press) | GC confirma la rotura 22 horas antes / Adif: la caída de tensión no tiene por qué ser rotura | https://www.bolsamania.com/noticias_print/empresas/economia--la-guardia-civil-confirma-la-rotura-de-la-via-en-adamuz-22-horas-antes-pero-no-salto-la-alerta-en-adif--22256575.html | 08-09/04 |
| TOBJ-FIS | The Objective | Fisuras a menos de 500 m; inspecciones; 19 maquinistas | https://theobjective.com/economia/transporte/2026-04-09/vias-adamuz-fisuras-inspecccion-adif/ | 09/04 05:25 |
| TOBJ-INC | The Objective | Adif registró 20 incidencias en Adamuz desde 2022 | https://theobjective.com/economia/transporte/2026-01-19/adif-fallos-via-adamuz-2022-renovacion-mayo/ | 19/01 09:39 |
| MALDITA-CRONO | Maldita.es | Cronología y dudas: atención a las víctimas del Alvia | https://maldita.es/malditobulo/20260129/cronologia-dudas-descarrilamiento-adamuz-alvia/ | atualiz. 29/01 |
| MALDITA-3A | Maldita.es | Los tuits de Adif sobre incidencias en Adamuz: 19 desde 2017 | https://maldita.es/malditobulo/20260119/la-cuenta-oficial-de-informacion-de-adif-lleva-3-anos-comunicando-incidencias-en-el-tramo-de-adamuz/ | 19/01 (só o título legível) |
| ELESP-OUIGO | El Español | Ouigo avisó a la CIAF de marcas (no compatibles con la rotura) | https://www.elespanol.com/invertia/observatorios/movilidad/20260310/ouigo-aviso-ciaf-detecto-marcas-via-trenes-mismo-dia-accidente-adamuz/1003744162647_0.html | 10/03 02:48 |
| RVOL | Railvolution | Adamuz accident – summary of events | https://www.railvolution.net/news/adamuz-accident-summary-of-events | 22/01 13:04 |
| RGI | Railway Gazette International | Broken rail suspected in Spanish high speed crash | https://www.railwaygazette.com/high-speed/broken-rail-suspected-in-spanish-high-speed-crash/70290.article | 20/01 |
| WIKI-ES | Wikipedia (es) | Accidente ferroviario de Adamuz | https://es.wikipedia.org/wiki/Accidente_ferroviario_de_Adamuz | consultado 31/10 ~18:45 |
| WIKI-120 | Wikipedia (en) | Renfe Class 120 | https://en.wikipedia.org/wiki/Renfe_Class_120 | consultado 31/10 |
| URDA | nosso dossiê | `D:\reconstruccion\02_urda\roteiro\fakten.md` (ECON-IRYO, ERTMS, WIKI-ETR1000, Angrois) | | 29/10 |
| OSM | OpenStreetMap via Overpass (ODbL) | agulhas com PK, PB Adamuz, túnel, arroios, povoados | overpass-api.de | 31/10/2026 ~18:47 |
| EUDEM | OpenTopoData, EU-DEM 25 m | perfil PK 317,4-319,6 e cortes em 318,173 e 318,681 | api.opentopodata.org | 31/10/2026 |
| Só via busca (não abertas) | El País (19/01 "ocho incidencias... Senado"; 08/04; 13/04; 28/04), El Mundo (24/01; 08/04), ABC (08/04; 02/09), Cadena SER (17/07), La Razón (28/04), RTVE (18/01; 30/01; 20/03), Diario Córdoba (19/01; 06/02), El Debate (05/02; 02/03), El Español (10/06), El Economista (23/04), Xataka (20/01), Vozpópuli (jun/2025 Senado), Articulo14 (28/10, 2 peças), Forbes/ESdiario/Última Hora (comissão do Senado) | | | apoio, nunca sozinhas |
| **NÃO obtidos** | CIAF-2 (23/01) e informe de 28/04 em PDF; ficha de início da investigação; relatório da Guardia Civil de 28/03 e ata de 03/08 no original; Cadena SER 17/07 (bloqueado); nota do Ministério de 23/01 sobre inspeções (lamoncloa.gob.es recusou conexão) | | | lacunas |

---

## 9. Espinha sugerida (13 capítulos, ~13 min)

1. **19:43:42. El impacto**: noite, reta, faróis; o Alvia entra no quadro, os carros do Iryo atravessados; corte para o branco.
2. **La pregunta**: "Un tren que va hacia Madrid se sale de la vía. Otro que va hacia Huelva lo encuentra diez segundos después. ¿Dónde empezó todo?"
3. **Lo reconstruimos segundo a segundo**: com os registradores, as notas da comissão e o traçado real; mapa Madri → Córdoba, PK 318.
4. **Dos trenes, dos sentidos**: Iryo de 8 carros (~290 passageiros) e Alvia de 4 carros (~185); horários de saída; ~480 pessoas.
5. **La víspera, 21:46**: o circuito de via, o medidor de 2,2 → 1,5 V e a linha vermelha de 0,78 V. **(take inédito, parte 1)**
6. **Veintidós horas**: 19 maquinistas, um golpe, três trens com marcas nas rodas.
7. **19:43:20. La rueda y el carril**: rodas ímpares batendo, o trilho tombando para fora (mecanismo da CIAF, com o rótulo "hipótesis de la comisión").
8. **19:43:34. Se sale el coche 6**: carros 6-7-8 derivam para a via 2, faíscas, o carro 8 tomba.
9. **19:43:37. Un segundo**: o desvio perde a comprovação, o S613 vai a vermelho, o LZB freia o Alvia a 217 km/h, a 188 m. **(take inédito, parte 2: "le faltaban casi dos kilómetros")**
10. **19:43:42. El choque**: 152 contra 204 km/h; os dois primeiros carros do Alvia, 4 m de talude, a parede de rocha; o carro 3 atravessado; o Iryo para às 19:44:03.
11. **La media hora**: chamadas sem resposta, "enganchón de catenaria", o segundo trem que ninguém via; os vizinhos de Adamuz.
12. **Lo que se sabe y lo que no**: 46 mortos, 152 feridos; rotura na solda 1989/2023; versões da Guardia Civil, da Adif e da comissão lado a lado; relatório final pendente.
13. **Nueve meses después: Urda**: mesma linha, ~200 km ao norte, outro sistema, 69 mortos; "dos fallos distintos en la misma línea". Fecho respeitoso: memória das 46 vítimas, maquete branca se apagando.
