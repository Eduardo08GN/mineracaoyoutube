# Angrois (Santiago de Compostela), 24/07/2013: dossiê de fatos (reconstrução 3D, vídeo 4)

Canal "Segundo a Segundo": reconstrução 3D de tragédias de transporte (ES). O canal descreve o **sistema** que falhou; não acusa nem ridiculariza ninguém. Manequins sem rosto. **Sem nomes** de maquinista, interventor, diretores, juízes, peritos ou vítimas (só cargos). Instituições podem ser citadas (CIAF, Adif, Renfe, ERA, Comisión Europea, Juzgado de lo Penal nº 2 de Santiago, Audiencia Provincial de A Coruña).
**[1 fonte]** = uma só fonte; **[div]** = fontes divergem (faixa + escolha "para o áudio"); **[calc]** = calculado por nós; **[NÃO CONFIRMADO]** = não sustentado (não usar como fato no áudio); **[OFICIAL]** = CIAF (relatório final 2014), ERA, Comisión Europea, Ministerio de Fomento/Transportes, Adif, Renfe, juzgado/Audiencia (sentenças e notas do CGPJ), Xunta.

**Fechamento do dossiê: 31/10/2026, ~20h de Madri.** Caso encerrado tecnicamente (relatório final da CIAF de 20/05/2014, publicado em 04/06/2014) e judicialmente (sentença firme da Audiencia de A Coruña, 23/01/2026). Pendente só o **indulto** do maquinista (§5).
**Fuso:** todas as horas são locais de Galicia/Madri. Em julho vale o horário de verão (**CEST, UTC+2**). Brasília = Madri − 5 h.
**Relógios:** a CIAF usa como referência o **registrador do trem** (Hasler Teloc). O registrador do enclavamiento estava **2 min 32 s adiantado** (descarrilamento às 20:41:06 no trem = 20:43:38 no enclavamiento) [OFICIAL, CIAF 3.4.1]. **Usar sempre a hora do trem.**

**Documentos oficiais baixados** (pasta `roteiro/dados/angrois/`, todos com `.txt` extraído):
- `ciaf_informe_final_0054-2013_es.pdf` (266 pp., 28,6 MB, com anexos): **Informe final de la CIAF, accidente grave 0054/2013**, Madri, 20/05/2014. Cópia hospedada pela ERA (o transportes.gob.es bloqueia download). **É o documento-base dos segundos.**
- `era_2014_0070_en.pdf` (110 pp.): a tradução oficial inglesa do mesmo relatório (ERA-2014-0070), sem anexos. Mais fácil de pesquisar; os números são idênticos.
- `era_adv_2015_6_avaliacao_ciaf_2016.pdf` (15 pp.): **ERA/ADV/2015-6**, parecer da Agência Ferroviária Europeia à Comissão Europeia sobre a investigação da CIAF (entregue em 07/07/2016). Obtido pelo Wayback Machine (snapshot de 08/09/2016); o link original da ERA dá 404.
- `ciaf_comunicado_respuesta_era_2016-07-07.pdf` (3 pp.): resposta oficial da CIAF ao parecer da ERA (07/07/2016), cópia hospedada pela Praza.gal.
- `sentencia_penal2_santiago_2024-07-26.pdf` (versão anonimizada, 120 pp. de texto): **sentença do Juzgado de lo Penal nº 2 de Santiago, PA 463/21, 26/07/2024**, publicada pelo CGPJ. Os "Hechos probados" (fatos provados) trazem a sequência e o histórico do projeto da linha.
- `dem_angrois_eudem25.json`: perfil de relevo (EU-DEM 25 m) ao longo da linha e corte transversal no ponto 0.
- **NÃO obtidos:** a sentença de apelação da Audiencia de A Coruña (jan/2026, só a nota do CGPJ); a transcrição integral do anexo 3.5.1 (áudio da cabine), que está no PDF espanhol só como imagem; nenhum "relatório da ERA de 2024" (ver §5c: **não existe**, o parecer da ERA é de 2016).

---

## 0. Ficha rápida

| Item | Valor | Grau |
|---|---|---|
| Data e hora | **quarta-feira 24/07/2013, 20:41:06** (início do descarrilamento, registrador do trem); fim do arrasto às **20:41:16** | **[OFICIAL]** CIAF 3.4.3.7 e 4.1; Sentença HP 6º. No áudio: **"a las 20:41"** |
| Coincidência | 20:41 era exatamente a **hora prevista de chegada a Santiago** (o trem saiu de Ourense 4 min atrasado, às 20:05:13) | **[OFICIAL]** CIAF 3.2.3.1 e 4.2 |
| Dia | véspera do **Día de Galicia e da festa do Apóstolo** (25/07); a cidade estava em festa | **[OFICIAL]** CIAF 2.4 |
| Luz | **de dia, tempo bom** (CIAF 2.4: "era de día. Las condiciones meteorológicas eran buenas"). **Pôr do sol às ~22:04**; sol a **~13° de altura, azimute ~285° (OSO-ONO)** às 20:41 | Luz: **[OFICIAL]**. Sol: **[calc]** (algoritmo astronômico, lat 42,859 N, lon −8,527) |
| Local | **PK 84+413** da **linha 082** (Bif. Coto da Torre, Ourense → Bif. A Grandeira, PK 85,0), **curva de A Grandeira / "curva de Angrois"**, bairro de **Angrois**, município de Santiago de Compostela (A Coruña) | **[OFICIAL]** CIAF 2.1.1 |
| Distância da estação | **3,6 km** da estação de Santiago pela via (CIAF); 3,69 km somando PKs (84,413 → 85,0 na linha 082 + 3,1 km na linha 822) **[calc]**; **1,9 km em linha reta** **[calc, OSM]** | |
| Trem | **Alvia 150/151 Madrid-Chamartín (15:00) → Ferrol**, Renfe, **rama 730.012** (série **730**, Talgo-Bombardier, híbrida elétrica + diesel, bitola variável) | **[OFICIAL]** CIAF 2.2.2 |
| Composição | **13 veículos**: 2 **cabeças tratoras** (uma em cada ponta) + 2 **coches extremos técnicos (CET)** com gerador diesel (um atrás de cada cabeça) + **8 carros de passageiros + 1 cafeteria**; **185 m**, **382 t**, 22 eixos, **264 lugares** | **[OFICIAL]** CIAF 2.2.2 (dados do "documento del tren") |
| A bordo | **227 pessoas** + crianças menores de 4 anos sem bilhete (221 bilhetes + 6 de serviço) (CIAF) | **[div]**: sentença "al menos 225"; WIKI-ES 218 + 6 = 224; WIKI-EN 218 + 4. **No áudio: "unas 220 personas a bordo"** |
| Velocidade | **199 km/h** na reta durante a chamada; **195 km/h** ao frear (PK 84+009); **~191** no início da curva; **179 km/h** no ponto 0 (PK 84+413). Limite da curva: **80 km/h** | **[OFICIAL]** CIAF. **[div]** sentença 2024: **176 km/h** no ponto 0. No áudio: **"a casi 180 km/h, más del doble del límite"** |
| Mortos | **80** (CIAF, ERA, Comissão Europeia, imprensa). A justiça condenou por **79**: a 80ª vítima morreu **73 dias depois** de uma doença grave prévia, agravada pelo acidente | **[OFICIAL]** **[div]** CIAF 2.3.1 × Sentença 2024. **No áudio: "80 muertos"** (ver §5a) |
| Feridos | **152** (CIAF, ERA: "almost all the passengers") × **145 incluindo o maquinista** (sentença; condena por 143) × 144 (WIKI-ES) | **[div]**. **No áudio: "más de 140 heridos"** |
| Causa (técnica) | velocidade excessiva (179 km/h numa curva de 80); causa coadjuvante: **atenção reduzida por uma chamada de serviço de 100 s** do interventor ao celular corporativo do maquinista | **[OFICIAL]** CIAF 4.3 |
| O sistema | o trecho final (PK 80,1 → 85,0) só tinha **ASFA**, que **não controlava a velocidade com sinal verde**; o ERTMS acabava **~4 km antes** da curva; nenhuma placa avisava a queda de 200 para 80; o risco de excesso de velocidade foi **"exportado al maquinista"** nos documentos de segurança | **[OFICIAL]** CIAF 2.2.3, 3.4.2.5 e 3.3; Sentença HP 1º-2º; ERA 2016 |
| Justiça | 2024: maquinista **e** ex-diretor de Segurança na Circulação da Adif condenados a **2 anos e 6 meses**. 2026 (apelação): **maquinista condenado, ex-diretor absolvido** (com voto particular). Indulto pendente | **[OFICIAL]** CGPJ 26/07/2024 e 23/01/2026 |

---

## 1. Linha do tempo

### 1a. Antes do acidente (o sistema sendo montado)
| Quando | Fato | Fonte / grau |
|---|---|---|
| 20/12/2002 | Conselho de Ministros encarrega o GIF (depois Adif) de construir o trecho **Ourense–Santiago** da alta velocidade para a Galícia (futura LAV 082) | Sentença HP 1º **[OFICIAL]** |
| 30/04/2009 | Instalações de sinalização adjudicadas a uma UTE; projeto original: **bitola internacional (1 435 mm)**, **ERTMS nível 2** como sistema principal, nível 1 secundário, **ASFA só como reserva**, com **trocadores de bitola nas duas pontas** (Ourense PK 1+700 e **dentro da estação de Santiago, PK 88+00**). A transição ERTMS → ASFA seria feita **nos trocadores**, ou seja, **depois** da curva | Sentença HP 1º **[OFICIAL]** |
| jul/2010 → dez/2011 | **Projeto modificado** (autorizado pelo Ministério em abr/2011, aprovado em dez/2011): linha toda em **bitola ibérica**, **sem trocadores**, ligando à linha convencional 822 em **Coto da Torre** e em **A Grandeira (PK 85+045)**. Sem trocadores, o fim do ERTMS teve de ir para outro lugar: **PK 80+169** (sentença) / **80+069** (CIAF), **antes da sinal avançada E′7**, ~4 km antes da curva | Sentença HP 1º; CIAF 2.2.3.2.2 **[OFICIAL]** **[div]** de 100 m no PK: usar "unos cuatro kilómetros antes de la curva" |
| 2009-2011 | A análise preliminar de riscos da UTE lista "descarrilamento porque o trem circula a velocidade excessiva": consequência **catastrófica**, frequência **"increíble"**, aceitabilidade **"despreciable"**, porque assume que **um sistema automático (ERTMS N1) garante os limites**. Para trens com ASFA, o caso de segurança escreve: **"Riesgo exportado al maquinista"**. A Adif **não aplicou** nenhum procedimento de avaliação a esse risco exportado | Sentença HP 2º-3º; CIAF 3.3 (texto literal dos "riesgos exportados") **[OFICIAL]**. É o **take inédito** (§7) |
| 07/12/2011 | O diretor de Segurança na Circulação da Adif certifica as condições de segurança da linha 082 | Sentença HP 4º **[OFICIAL]** |
| 09-10/12/2011 | Ministério autoriza a entrada em serviço; **operação comercial a partir de 10/12/2011** | Sentença HP 4º; CIAF 3.4.3.6 **[OFICIAL]** |
| 23-28/12/2011 | Um **maquinista-chefe** da Renfe na Galícia escreve num relatório interno: queda "brusca" de **300 (200) para 80 km/h**, **sem aviso na sinalização lateral e sem cobertura do ERTMS**; propõe placas fixas de 80 km/h. O ponto da curva **não entrou na ata** da reunião em Madri; ficou só como reforço de formação. **Pelo menos 9 pessoas** da Renfe sabiam; não chegou à Adif | CIAF 3.2.3.3 e 4.2 **[OFICIAL]**; ERA 2016 ("no explanation how identified hazard ... was dealt with") |
| 17/06/2012 | Entram em serviço na linha os **série 730** (Alvia Madrid–Galícia), com ERTMS N1 embarcado (software Bombardier 3.1.0.1) | Sentença HP 5º; CIAF 3.4.3.6 |
| 17-22/06/2012 | **7 dos 16** trens 730 têm falhas de ERTMS (o software de bordo, Bombardier, não "conversava" bem com o de via, Thales: não lia o 1º grupo de balizas → freada automática → trecho em modo degradado) | Sentença HP 5º; CIAF 3.4.3.6 **[OFICIAL]** |
| 23/06/2012 | Renfe pede e a Adif autoriza **no mesmo dia** desligar o ERTMS de bordo dos 730 na linha 082: passam a circular **só com ASFA digital** e sinais laterais, "de forma indefinida" | Sentença HP 5º (23/06); CIAF (pedido 23/06, autorização **25/06**) **[div]** de 2 dias. No áudio: "en junio de 2012" |
| desde 25/06/2012 | Limitação temporária de **200 km/h** na via 1, PK 77,6-80,1 (ajuste da transição ERTMS/ASFA) | CIAF 3.2.3.1 **[OFICIAL]** |
| nov/2012-abr/2013 | Bombardier entrega software corrigido (3.1.1.2); testes positivos até abr/2013; reativação não feita até o acidente | CIAF 3.4.3.6 **[OFICIAL]** |
| mai/2013 | Última auscultação dinâmica da via: em bom estado | CIAF 4.2 **[OFICIAL]** |
| 22-24/07/2013 | Última manutenção da rama 12, incluindo ar e freio | Sentença HP 6º |
| 24/07, 15:00 | Alvia sai de **Madrid-Chamartín** em composição dupla (ramas 13 + 12) | CIAF 2.2.2 |
| 24/07, ~19:51-20:05 | Em **Ourense**, as ramas se separam (a 13 vai a Vigo/Pontevedra) e **troca o maquinista**. Saída prevista 20:01; real **20:05:13** | CIAF 2.2.2, 3.4.3.7 |

### 1b. Os segundos (registrador jurídico do trem; hora do trem)
| Hora | PK | Velocidade | Fato | Fonte |
|---|---|---|---|---|
| 20:05:13 | ~0 | 0 | Partida de Ourense, ASFA em modo convencional | CIAF 3.4.3.7; Sentença |
| 20:08:54 | | | Outra pessoa na cabine (maquinista que saía de serviço) | CIAF |
| 20:15:21 e ~20:16 | 8+889 e 10+857 | 110 / 109 | Duas freadas de emergência pelo **"hombre muerto"** (pedal de vigilância) apesar de o maquinista responder | CIAF; Sentença |
| 20:17:42 | | | 1ª chamada ao celular corporativo (o maquinista anterior), **46 s** | Sentença HP 6º |
| ~20:23 | | 200 | Atinge a velocidade máxima permitida com ASFA (**200 km/h**) | CIAF 4.2 |
| 20:29:02 / 20:30:33 | | 201,25 | Dois avisos sonoros do ASFA por passar de 201,25 km/h (47 s e 72 s) | CIAF; Sentença |
| **20:39:06** | **77+780** | 199 | **Toca o celular corporativo**: é o **interventor (chefe de trem)** | **[OFICIAL]** CIAF 4.1 |
| **20:39:15** | **78+280** | **199** | **Começa a conversa** (9 s depois). Assunto: se o trem "cabe" na via 2 da estação de **Pontedeume** (perto de Ferrol), para uma família descer do lado do edifício | CIAF 4.1; Sentença |
| 20:39:23 | 78+646 → 79+056 | | Zona neutra de catenária: o maquinista **reconhece** com o botão (ainda ao telefone) | CIAF |
| ~20:39:47 | **80+069 / 80+169** | 199 | **Fim do ERTMS na via** (o 730 não o usava) | PK: CIAF/Sentença; hora **[calc]** (32 s de conversa) |
| — | 80+086, 80+278, 80+398 | 199 | Três **placas de proximidade** da sinal avançada E′7, sem baliza | CIAF; Sentença |
| **20:39:52** | **80+319** | **199** | Baliza prévia da **E′7** em **verde (via livre)**: só um **som** na cabine, sem controle | **[OFICIAL]** CIAF |
| **~20:39:58** | **80+619** | 199 | Passa a **sinal avançada E′7**, **verde**, aos **43 s** de conversa. Era aqui que os maquinistas costumavam **começar a frear** para chegar a 80 na curva | CIAF 4.2; Sentença HP 1º |
| — | 80+671 | 199 | Entra no **túnel de Marrozos** (1 285 m) | CIAF 2.2.3.2.1 |
| **20:40:01** | **80+803** | 199 | Placa de **mudança de modo ASFA** (alta velocidade → convencional), dentro do túnel: **o maquinista não faz a mudança** (46 s de conversa) | **[OFICIAL]** CIAF 4.1 e 4.2 |
| — | 82+112 → 83+337 | 199 | Cruza o **viaduto de O Eixo** (1 225 m). **Último trecho onde uma freada de emergência ainda deixaria o trem a 80 km/h na curva** (ver §4) | PK: CIAF; ponto-limite **[calc]** |
| — | 83+465 | 199 | Entra no **túnel de Santiago** (641 m) | CIAF |
| **20:40:55** | **83+821** | **195** | **Fim da conversa**: **100 s**, **5 540 m** percorridos falando | **[OFICIAL]** CIAF 4.1 e 4.2 |
| 20:40:56 | 83+876 | 195 | Baliza prévia da sinal de entrada **E7**, **verde**: só o som | CIAF |
| 20:40:58 | | 195 | O maquinista percebe a curva e aplica o **freio de serviço** | Sentença HP 6º (CIAF não registra este segundo) |
| **20:40:59** | **84+009** | **195** | **Freio de emergência** | **[OFICIAL]** CIAF 3.4.3.5 |
| — | 84+106 | | **Sai do túnel de Santiago** | CIAF |
| **20:41:02** | **84+171** | **195** | Baliza ao pé da **E7** (PK 84+176), **verde**. O freio só "morde" agora: o sistema demora **3 s** para frear de fato | **[OFICIAL]** CIAF 3.4.3.5 |
| ~20:41:03 | **84+228** | **~191** | **Início da curva** (clotoide de transição, 202 m); o limite de 80 vale desde **84+230** | CIAF 4.1 |
| — | 84+245 → 84+325 | | Viaduto **E-01** (80 m) e a placa de "mudança de velocidade máxima" (PK **84+273**, marcada "84.2", **43 m depois** do início do limite) | CIAF 2.2.3.2.2 e 3.4.2.5; Sentença HP 1º |
| **20:41:06** | **84+413** | **179** | **Ponto 0**: perto do fim da transição (a curva circular de **R = 402 m** começa em 84+428). A cabeça tratora entra na curva; o **CET (2º veículo, o do gerador diesel) sobe e se desloca para fora da curva**, puxando a cabeça e os carros de trás. Grande **arco elétrico** na catenária | **[OFICIAL]** CIAF 4.1 (vídeo das câmeras da linha). **[div]** 176 km/h (Sentença) |
| **20:41:16** | **84+684** | 0 | **Fim do arrasto**: 10 s, ~271 m da cabeça | CIAF 4.1; distância **[calc]** |
| 20:42:25 | | | O maquinista liga pelo **GSM-R** ao CRC de Madrid-Atocha (32 s) e informa o descarrilamento | **[OFICIAL]** CIAF 2.2.5 e 4.1 |
| 20:42:42 | | | Fim da gravação de áudio da cabine | CIAF |

**As contas [calc]:**
- **A chamada:** a 199 km/h (55,3 m/s), **100 s = 5,53 km**; pelos PKs, 78+280 → 83+821 = **5,541 km** (CIAF: 5 540 m). Fecha.
- **A sinal de referência:** da E′7 (80+619) ao início da curva (84+228) são **3,6 km = 65 s** a 199 km/h. A conversa já durava 43 s quando o trem passou por ela; durou mais 57 s.
- **Os 4 s finais:** CIAF diz 242 m em 4 s com 16 km/h a menos (= 1,11 m/s²). Com velocidade média de ~187 km/h, 242 m levam **~4,6 s**: os segundos do registrador são **arredondados**. A essa taxa, 195 km/h viram **~177 km/h** em 4,6 s, o que explica a divergência **179 (CIAF) × 176 (sentença)**.
- **O comprimento:** o trem tem 185 m. Quando a cabeça chegou ao ponto 0 (84+413), **a cauda estava passando o início da curva (84+228)**: o trem inteiro já estava na curva.
- **Velocidades antigas, superadas:** nos primeiros dias (jul/2013) circularam "192 km/h ao frear e 153 km/h no descarrilamento" (WIKI-ES cita as caixas pretas abertas em 30/07/2013). **Não usar.** O próprio maquinista disse ao CRC "190" (CIAF 3.5.2).

### 1c. Resgate (noite de 24 para 25/07)
| Hora | Fato | Fonte |
|---|---|---|
| 20:41 | 1ª chamada ao 112 | WIKI-ES **[1 fonte]** |
| 20:42:25 | Maquinista avisa o CRC de Atocha pelo GSM-R; CRC avisa o 112, o CGR24 e o posto de Ourense | **[OFICIAL]** CIAF 2.2.5 |
| 20:45 | Adif CGR24 avisa León e o CECON da Renfe; Renfe abre a célula de crise | CIAF 2.2.5 |
| primeiros minutos | **Vizinhos de Angrois** são os primeiros a socorrer (casas a ~100-150 m da via) | The Clinic 26/07/2013; Xunta (DOG 15/07/2014: **Medalla de Oro de Galicia** a vítimas, vizinhos de Angrois e serviços de emergência) |
| até 21:15 | **Mais de 140 policiais** no local (já havia dispositivo para as festas do Apóstolo) | **[OFICIAL]** CIAF 2.2.6 |
| noite | Xunta ativa o **PLATERGA nível 2**; **mais de 3 000 pessoas** no operativo (polícias, bombeiros de 7 parques, 26 grupos de Proteção Civil, 6 hospitais, Cruz Vermelha) | **[OFICIAL]** CIAF 2.2.6 |
| 25/07, 03:10 | Juiz autoriza a entrada de Adif, Renfe e CIAF na zona | CIAF 2.2.5 |
| 25/07, 07:25 | Retirado o 1º veículo (guindastes); os restos vão para um terreno em **A Escravitude**, sob custódia judicial | CIAF 2.2.5 |
| 26/07, 07:30 | Reabre a via 2 (30 km/h na zona) | CIAF |
| 28/07, 06:45 | Retirado o último veículo (a cabeça tratora) | CIAF |
| 29/07, 07:25 | Reabre a via 1 (30 km/h) | CIAF |

---

## 2. O trem e onde cada veículo parou

### 2a. Rama 730.012 (ordem no sentido da marcha)
| Pos. | Veículo (CIAF) | O que é | Destino final (CIAF 2.3.2.1 e 4.1; Sentença HP 6º) |
|---|---|---|---|
| 1 | Cabeza motriz 2 | locomotiva elétrica (registrador e cabine ativa) | grupo 1 (PK 84+637 a 84+684); **tombada sobre o lado direito, deslizou fora da via** arrastando postes de catenária (inclusive o da câmera); ficou **levemente inclinada para a esquerda** |
| 2 | Coche extremo técnico (CET) | carro com **gerador diesel de 1 800 kW e tanque de 1 600 L**; também leva passageiros | grupo 1; **o primeiro a sair** (subiu e foi para fora da curva) segundo o vídeo da linha; muito inclinado para a direita |
| 3 | Turista | Talgo | grupo 1; muito inclinado à direita |
| 4-5 | Turista | Talgo | **grupo 2**, a **11 m** do 1 (PK 84+600 a 84+626); muito inclinados à direita |
| 6 | Turista | Talgo | **grupo 3**, a **33 m** do 2 (PK 84+505 a 84+567); inclinado (CIAF 2.3.2.1: "à esquerda"; CIAF 4.1 e sentença: "à direita") **[div]** |
| 7 | Turista | Talgo | grupo 3; **atravessado** na via |
| 8 | Turista | Talgo | **separado do grupo, fora da plataforma, até um caminho adjacente** (empurrado por cima do talude/aterro) |
| 9 | Cafeteria | Talgo | **tombado**, com uma ponta **montada sobre o 7º** |
| 10-11 | Preferente (club) | Talgo | tombados para a direita |
| 12 | CET de cauda | **gerador diesel** | **pegou fogo e ficou esmagado** |
| 13 | Cabeza motriz 1 | locomotiva de cauda | inclinada à direita |

- **Correções ao briefing:** (1) quem pegou fogo foi o **CET de cauda (gerador diesel, posição 12)**, junto à cabeça tratora traseira, não a própria cabeça; (2) o veículo que "voou" para fora da plataforma foi o **8º, um carro de passageiros Talgo**, não um furgão gerador. A série 730 **não tem "furgões"**: o gerador fica nos CET, carros de passageiros convertidos (CIAF 3.4.3).
- **Por que "Talgo":** os carros intermédios são **curtos e apoiados em rodados simples independentes** (sem truques, um rodado na junção entre carros); cabeças e CET têm truques (CIAF 2.2.2). O 730 é um **130 convertido**: os dois carros das pontas viraram geradores para rodar em linhas sem catenária (CIAF 2.2.2).
- **Velocidades autorizadas do 730:** 240 km/h com ERTMS em bitola internacional; 220 em ibérica; **200 com ASFA**; 180 em modo diesel (CIAF 2.2.2).
- **Danos na via:** 32 m de via destruídos, 600 travessas, 8 postes, 1 200 m de cabo de catenária; 100 m de catenária na via 2; barreira do lado direito e **as duas câmeras** (CIAF 2.3.2.2). **Projéteis** (pedaços de via e trem) atingiram casas próximas (CIAF 2.3.2.3).
- **O muro:** "a maioria dos carros bateu no **muro de concreto** ao longo da curva" (ERA 2016); CIAF: "a maioria foi empurrada para uma **vala de drenagem** ao longo da via; o **muro de concreto** e o **aterro elevado** impediram o tombamento total e o deslocamento lateral". **De que lado da via fica o muro e qual a altura: [NÃO CONFIRMADO]** (o OSM marca um muro de arrimo ~40 m ao sul do ponto 0, no **lado de dentro** da curva; os carros foram para **fora**, à direita: conferir em fotos antes de modelar).

---

## 3. O sistema que falhou

### 3a. As três "redes de proteção" e onde cada uma terminava
| Camada | O que faz | No dia | Fonte |
|---|---|---|---|
| **ERTMS/ETCS N1** (via) | supervisão contínua: sabe a velocidade-alvo e **freia sozinho** se o trem não reduz | existia de PK 1+845 a **80+069** (CIAF) / **80+169** (sentença) no sentido Santiago; **acabava ~4 km antes da curva**. No sentido contrário (rumo a Ourense) começa em 84+200, ou seja, logo **depois** de o trem sair da curva | CIAF 2.2.3.2.2; Sentença HP 1º |
| **ERTMS de bordo** do 730 | o mesmo, no trem | **desligado desde jun/2012** por incompatibilidade de software. **Mesmo ligado não teria freado o trem na curva**: depois de 80,1 o trem passaria a ASFA a 200 km/h. Só obrigaria o maquinista a **apertar um botão** ao sair do ERTMS (ou o trem freava): "un factor más de atención" | CIAF 3.4.3.6 e 4.2; Sentença (FD): "la situación de riesgo ... era exactamente la misma" |
| **ASFA digital** (balizas no meio da via, ~300 m antes de cada sinal e ao pé dela) | anuncia o aspecto do sinal; **só controla a velocidade se o sinal está restritivo** (amarelo, vermelho, limitação). Com **verde**, apenas emite um som; freia sozinho só se o maquinista não reconhecer um aviso ou se passar do **teto de 200 km/h** | E′7 e E7 estavam **verdes** (o itinerário estava aberto até a entrada de Santiago): as 3 balizas só apitaram. **Não havia baliza de velocidade na curva** | Sentença HP 1º; CIAF 3.4.1 e 4.2 |
| **"Hombre muerto"** | pedal que confirma que o maquinista está consciente | funcionou (até freou duas vezes no início); **não controla velocidade** | Sentença (FD) |
| **Sinalização vertical** | placas | não havia **nenhuma placa de aviso** antes da curva; só a placa de "mudança de velocidade máxima" **no PK 84+273, 43 m depois** de o limite de 80 começar, e **dentro** da curva. As normas (PTO) **não exigiam** aviso prévio de reduções de velocidade | CIAF 3.4.2.5 e 4.2; Sentença HP 1º |
| **O maquinista** | sabia pelo **Libro Horario** e pelo **Cuadro de Velocidades Máximas** (papel) que em 84+230 caía de 200 para 80 | **última barreira**; o caso de segurança "exportava" o risco a ele | CIAF 3.3; ERA 2016 |

- **Por que os sinais estavam verdes e mesmo assim "protegiam" outra coisa:** E′7 e E7 protegem a **bifurcação de A Grandeira (PK 85+045)**, não a curva; não impunham redução nenhuma (Sentença HP 1º). **"Todas as luzes diziam: via livre."**
- **O limite de 80 era seguro?** Sim. Com o peralte de **130 mm**, a 80 km/h sobra uma aceleração lateral não compensada de **0,50 m/s²**, abaixo do máximo normal (0,65, atingido a 85 km/h). A via estava dentro das tolerâncias (bitola, peralte, empeno); trilho novo de 2011, 60 kg/m (CIAF 3.4.2.4-5).
- **O que mudou depois (norma):** a CIAF emitiu em **30/07/2013** (6 dias depois) duas recomendações antecipadas: sinalizar na via toda redução forte de velocidade e instalar **balizas ASFA** que **freiem** o trem se ele chega rápido demais. A Adif criou o conceito de **"Cambio Significativo de Velocidad" (CSV)** e achou **375 pontos** na rede (51 em alta velocidade, 324 na convencional); em mar/2014 **122 já tinham placas e balizas** (os que reduzem ≥ 40 % da velocidade menor, em linhas > 160 km/h). Sinais novos: **preanuncio, anuncio (com baliza), ejecutiva e fin de CSV** (CIAF 5.1; Sentença HP 7º) **[OFICIAL]**.
- **Na própria curva (ago/2013):** limitação de **160 km/h** (desde PK 80+338) e **30 km/h** (desde 84+400), com baliza; na via 2, no mesmo sentido Ourense → Santiago, limitação permanente sinalizada: pré-aviso, aviso e início dos 80 km/h, com baliza no pré-aviso (CIAF 5.2). Renfe proibiu o celular na condução salvo emergência (**Circular 3, 28/02/2014**) (CIAF 5.1, medida 12).
- **ERTMS depois:** em jul/2015 a Adif aprovou 63 M€ para ERTMS em A Coruña–Santiago–Vigo e no entorno da estação; em 2018-2019 ainda não estava no trecho do acidente (WIKI-ES) **[1 fonte]**. **Situação em 2026: [NÃO CONFIRMADO]**.

### 3b. O "risco exportado" (coração do vídeo)
- Toda linha nova precisa de uma **análise de riscos** (normas CENELEC 50126/128/129, avaliador independente). A da sinalização da linha 082 listou o perigo **"descarrilamento por velocidade excessiva"** e o resolveu dizendo que **um sistema automático** (o ERTMS) garante os limites. Resultado no papel: **catastrófico × "increíble" × "despreciable"** (Sentença HP 2º).
- Para trens com **ASFA**, que não supervisiona velocidade, o fornecedor não podia mitigar o risco e o **exportou**. Texto literal do caso de segurança, citado pela própria CIAF (3.3): **"Los trenes que circulen al amparo de la señalización lateral o ASFA deben respetar el cuadro de velocidades máximas de la línea proporcionado por Adif. Riesgo exportado al maquinista."** E: "El sistema de ayuda a la conducción ASFA no proporciona supervisión a bordo, y por lo tanto el maquinista debe seguir las indicaciones mostradas por la señalización lateral. **Riesgo exportado al maquinista.**"
- A avaliação independente (Ineco) dizia que os riscos iam para a **Adif**, que devia cobri-los com regras ou manutenção; a Adif **não aplicou** nenhum procedimento de avaliação a esse risco, nem antes nem depois da inauguração (Sentença HP 2º-3º, fatos provados em 1ª instância).
- Em 2009 o próprio Ministério já tinha achado o procedimento de riscos da Adif "excesivamente genérico y teórico" e pedido uma **metodologia para riscos exportados** (Sentença HP 3º).
- **ERA 2016:** a Ineco era ao mesmo tempo **avaliadora independente da decisão de exportar riscos ao maquinista** e apoio da investigação da CIAF: "this further weakens the independence" (ERA/ADV/2015-6, p. 2).
- **Equilíbrio obrigatório:** em 2026 a **Audiencia** **absolveu** o ex-diretor de Segurança da Adif: não se provou uma omissão concreta nem uma "posição de garante" específica; ele agiu segundo os padrões então vigentes para inaugurar linhas; a defesa da Adif sustentou que, em 2011, um "cambio brusco de velocidad" desse tipo **não era considerado risco** e que o conceito de CSV nasceu **com este acidente**. Houve **voto particular** a favor de manter a condenação ("existía una obligación de valorar correctamente el riesgo y no se hizo") (CGPJ 23/01/2026; Sentença 2024, FD).

### 3c. Cena 3D passo a passo (resumo para a direção)
1. **Fim de tarde de verão, sol baixo à frente** (13° de altura, ligeiramente à esquerda do rumo da reta, ~298°) **[calc]**; trem de 13 veículos a 199 km/h numa reta de **4,4 km** (79+916 → 84+228), com túneis e um viaduto alto.
2. **20:39:06**, PK 77,8: toca o celular. HUD: "LLAMADA 0 s", "199 km/h".
3. **~20:39:47**, PK 80,1: placa invisível "FIN ERTMS" (o 730 nem o usava): o "guarda-costas" automático fica para trás.
4. **20:39:52-58**: baliza + E′7 **verde** (apito); "aquí se empieza a frenar"; contador da chamada: 43 s.
5. Túnel de Marrozos; placa "cambio de modo ASFA" passa sem ação (46 s).
6. **Viaduto de O Eixo**: marcador fantasma "ÚLTIMO PUNTO PARA FRENAR A TIEMPO" (PK ~82,85-82,97) **[calc]**; contador ~80 s de chamada.
7. Túnel de Santiago; **20:40:55** a chamada acaba (100 s, 5,54 km); **20:40:59** freio de emergência a 195; 3 s até o freio agir.
8. **20:41:02** saída do túnel, E7 **verde** (apito), 195 km/h; **20:41:03** início da curva, ~191; placa "84.2" passa já dentro da curva.
9. **20:41:06**, 179 km/h: o CET (2º veículo) levanta e sai para fora da curva, arrasta cabeça e carros; arco elétrico na catenária.
10. **20:41:16**: três grupos (11 m e 33 m de separação), o 8º fora da plataforma, o 9º sobre o 7º, o 12º (gerador) em chamas.

---

## 4. Física para leigo [calc]

Dados de entrada [OFICIAL, CIAF]: R = **402 m**; peralte **130 mm**; bitola ibérica 1 668 mm (distância entre os centros dos trilhos **≈ 1,752 m**, deduzida para bater com os 0,50 e 5,41 m/s² da CIAF); massa **382 t**; desaceleração medida na freada **1,11 m/s²** com **3 s** de atraso do sistema.

| | 80 km/h (limite) | 179 km/h (ponto 0) | 195 km/h (ao frear) |
|---|---|---|---|
| Velocidade | 22,2 m/s | 49,7 m/s | 54,2 m/s |
| Aceleração centrípeta v²/R | 1,23 m/s² = **0,13 g** | 6,15 m/s² = **0,63 g** | 7,30 m/s² = 0,74 g |
| Lateral **não compensada** pelo peralte | **0,50 m/s²** (CIAF) | **5,41 m/s²** (CIAF: **8×** o máximo normal de 0,65; **4,5×** o máximo do 730, 1,2 m/s²) | 6,57 m/s² |
| Peralte que "zeraria" a força lateral | 219 mm | **~1 100 mm** (a via tinha 130) | ~1 300 mm |
| "Empurrão" lateral numa pessoa de 75 kg | **~4 kg** | **~41 kg** (mais da metade do peso do corpo, de lado) | ~50 kg |
| Inclinação da "seta do peso" (resultante) em relação à vertical da via | **~3°** | **~29°** | ~34° |
| Energia cinética do trem (382 t) | **94 MJ** | **472 MJ** (~490 MJ com passageiros) | 560 MJ |
| Altura de queda equivalente (v²/2g) | 25 m (prédio de ~8 andares) | **126 m (prédio de ~40 andares)** | 150 m |

- **Razão-chave:** (179/80)² = **5,0**: a força para fora na curva é **5 vezes** a do limite; a parte **não compensada** pelo peralte é **~11 vezes** maior (5,41 / 0,50). **No áudio: "cinco veces más fuerza hacia fuera"**.
- **Por que tomba:** o trem tomba quando a "seta" que soma o peso (para baixo) e a força da curva (para fora) **sai da base entre as duas rodas** (metade da distância entre trilhos ≈ **0,88 m**). Com centro de gravidade a ~1,2-1,8 m de altura, a seta sai da base com uma aceleração não compensada de **~4,8-7,2 m/s²**; a 179 km/h havia **5,4**. Antes disso, a roda de fora já sobe no trilho (descarrilamento). **A altura real do centro de gravidade dos carros 730 / do CET: [NÃO CONFIRMADO]**; usar só como ilustração ("el peso se sale de la base"). A CIAF registra que **o CET (gerador, o carro mais pesado da cauda) foi o primeiro a subir e sair**; a ERA criticou que o relatório **não identificou o rodado que descarrilou primeiro**.
- **A freada que faltou:** de 195 a 80 km/h, a 1,05-1,11 m/s², o trem precisava de **1,10-1,22 km + 162 m** de atraso do sistema = **~1,26-1,38 km** e **~32-35 s**. Freou a **221 m** do início da curva (84+009 → 84+230). **Tinha um sexto da distância de que precisava.** O ponto-limite para frear ficava no **PK ~82,85-82,97, em cima do viaduto de O Eixo**, uns **19-23 s antes** da freada real, **quando a conversa ainda durava** (terminou às 20:40:55). **No áudio: "le faltó más de un kilómetro"**.
- **Comparação palpável da energia:** 472 MJ = o de **~3 300 carros** de 1,5 t batendo a 50 km/h; ou o trem inteiro caindo do alto de um prédio de 40 andares. Dissipados em **10 s** = potência média de **~47 MW**.
- **A janela do maquinista:** 65 s entre a sinal de referência (E′7) e a curva; 100 s de chamada; em 100 s o trem anda **5,5 km**.

---

## 5. Vítimas, investigação, justiça e consequências

### 5a. Cifras de vítimas
| Fonte | Mortos | Feridos | Nota |
|---|---|---|---|
| Primeiros dias (jul/2013) | 77 → 78 (contagem forense de 26/07) | | WIKI-EN **[1 fonte]** |
| Juzgado de Instrucción nº 3, fim de ago/2013 | **79** | 147 | citado pela CIAF 2.3.1 |
| Depois (Renfe avisa mais uma morte) | **80** (incluindo **2 trabalhadores do trem**) | 152 "afetados" | **[OFICIAL]** CIAF 2.3.1; ERA 2016; Comissão Europeia |
| Sentença 2024 e Audiencia 2026 | **79** homicídios | **143** lesões (145 feridos incl. o maquinista; 1 não provou que viajava; 1 menor sem tratamento) | A 80ª vítima morreu **73 dias depois** (≈ **05/10/2013** **[calc]**) de doença grave prévia; conta como lesionada e é indenizada | **[OFICIAL]** CGPJ 26/07/2024 |
- **Escolha para o áudio: "80 muertos y más de 140 heridos".** Se houver espaço: "la justicia condenó por 79; la víctima 80 murió semanas después, de una enfermedad que el accidente agravó".
- Nacionalidades: 67 espanhóis e 12 estrangeiros (WIKI-EN **[1 fonte]**). **Sem nomes.**
- A bordo iam **6 pessoas de serviço**: maquinista, interventor, um agente de segurança, o maquinista que tinha conduzido até Ourense (viajando sem serviço) e **2 empregados da cafeteria** (CIAF 2.3.1). A CIAF conta **2 pessoas de serviço** entre os 80 mortos; o maquinista e o interventor sobreviveram (o maquinista ferido). A WIKI-EN diz que "os 4 tripulantes sobreviveram": **[div]** sobre quem conta como "tripulação". Um dos mortos era um **empregado da cafeteria** (ver §7, ponte com Adamuz).

### 5b. A investigação técnica (CIAF)
- CIAF avisada pela Adif às **21:11**; secretário no local na mesma noite (CIAF 2.1.3).
- Equipe: o secretário da CIAF como investigador-chefe + 2 técnicos, **mais os diretores de Segurança na Circulação da Adif e da Renfe** (que entregaram "informes particulares" em nov/2013) e apoio da **Ineco** (empresa pública da qual Adif e Renfe são acionistas) (CIAF 2.1.3; ERA 2016).
- O maquinista **recusou** a entrevista com a CIAF (CIAF 3.1).
- Relatório final assinado em **20/05/2014**, publicado em **04/06/2014** (ERA). Conclusão única: velocidade excessiva; coadjuvante: a chamada. **9 recomendações** (placas e balizas nas reduções fortes; análise de riscos de interação entre subsistemas na inauguração de linhas; comunicação segura com a cabine; **gravação de áudio e vídeo na cabine**; canalizar alertas internos de segurança na Renfe; comitês mistos de segurança) (CIAF 6).
- **A gravação de áudio da cabine foi a primeira que a CIAF pôde usar** numa investigação (CIAF 4.2).

### 5c. A ERA (2016) e a Comissão Europeia
- Em **26/10/2015** a Comissão Europeia pediu à ERA um parecer; ampliado em **30/11/2015**. Parecer **ERA/ADV/2015-6**, entregue em **07/07/2016** [OFICIAL].
- **Conclusão:** o acidente **"has not yet been independently investigated as required by the Railway Safety Directive"**; recomenda **abrir nova investigação** independente.
- **Fraquezas apontadas:** equipe com Adif, Renfe e Ineco (conflito de interesses, art. 21.1-21.2 da Diretiva 2004/49); foco na **causa direta (um erro humano)** e não nas causas de fundo (organização de Adif, Renfe e DGF); **colisão com o muro e incêndio do gerador não analisados**; não identifica **o primeiro rodado a descarrilar**; não analisa o desenho da linha, do trem nem a decisão de **exportar o risco ao maquinista**; ignora o alerta do maquinista-chefe de 2011; **20 descarrilamentos por velocidade na Espanha em 2008-2013** (14 incidentes + 6 acidentes) com semelhanças (curva, sem balizas ASFA) não analisados; nada sobre como vítimas e famílias foram ouvidas.
- **Resposta da CIAF (07/07/2016):** discorda; diz que Adif e Renfe só mandaram informes, que a Ineco fez apoio administrativo (2 pessoas) e que o procedimento de infração da Comissão contra a Espanha foi encerrado a favor da Espanha.
- **Depois:** fev/2017 a Comissão de Petições do Parlamento Europeu pede investigação independente; jul/2017 a DG MOVE convida a CIAF a reabrir (WIKI-ES); **26/02/2020** a comissária de Transportes responde que a investigação independente **"sigue pendiente"** (Europa Press via Bolsamanía, 06/03/2020). **Nunca houve nova investigação técnica.**
- **"Relatório da ERA de 2024": não encontrado.** WIKI-ES não registra nenhuma ação da ERA ou da Comissão em 2023-2024; o documento da ERA é o de **2016**. Há uma pergunta parlamentar europeia de 2024 (E-000669/2024) que não consegui abrir. **[NÃO CONFIRMADO]** qualquer reavaliação em 2024.
- **Comissão de investigação no Congreso:** constituída em 18/04/2018; terminou **sem conclusões** em fev/2019 com a dissolução das Cortes (WIKI-ES).

### 5d. A justiça (só cargos)
| Data | Fato | Fonte |
|---|---|---|
| 28/07/2013 | O maquinista declara no juzgado (é o único investigado de início) | CIAF 3.1 |
| out/2015 | Instrução fechada só contra o maquinista; **mai/2016** a Audiencia manda reabrir | WIKI-ES |
| mar/2017 | Investigado o **diretor de Segurança na Circulação da Adif** em 2013 | CGPJ (via busca); WIKI-ES |
| dez/2018 | Instrução fechada contra **dois**: maquinista e ex-diretor de Segurança da Adif | CGPJ; WIKI-ES |
| 05/10/2022 → jul/2023 | Julgamento na **Cidade da Cultura de Galicia** (Santiago); a Fiscalía retirou a acusação contra o ex-diretor em jun/2023 (as acusações particulares mantiveram) | Última Hora 05/10/2022; Menorca.info 20/06/2023 (via busca) |
| **26/07/2024** | **Juzgado de lo Penal nº 2 de Santiago**: os dois condenados a **2 anos e 6 meses** de prisão e 4 anos e meio de inabilitação, por **79 homicídios e 143 lesões por imprudência grave**. Razões: o maquinista atendeu uma chamada **"totalmente innecesaria"**, perdeu a referência da posição e chegou à curva a **176 km/h**; a Adif trocou o ERTMS pelo ASFA no trecho sem avaliar o risco que a própria UTE havia identificado. Indenizações de **mais de 25 M€** (seguradoras QBE da Renfe e Allianz da Adif) | **[OFICIAL]** CGPJ 26/07/2024; Sentença |
| **23/01/2026** | **Audiencia Provincial de A Coruña** (108 recursos): **confirma** a pena do maquinista e **absolve** o ex-diretor da Adif (sem posição de garante provada; agiu conforme os padrões); **voto particular** discordante; indenizações ampliadas (**> 22 M€**, a cargo da QBE); **sentença firme** (não cabe cassação no Supremo pela data do processo) | **[OFICIAL]** CGPJ 23/01/2026 |
| 2026 | Recursos de amparo ao **Tribunal Constitucional** (defesa, outro maquinista, plataforma de vítimas) | Onda Vasca (via busca) **[1 fonte, não aberta]** |
| set/2026 | A juíza de execução informa **a favor do indulto** (total; subsidiariamente parcial); a **Fiscalía apoia indulto parcial** | CGPJ (via busca); Moncloa.com 04/09/2026 (via busca) |
| **14/10/2026** | Suspensa a entrada na prisão do maquinista **enquanto se tramita o indulto** (art. 4.4 do Código Penal); a decisão cabe ao Conselho de Ministros | Diario de León 15/10/2026 |
- **No vídeo:** "La justicia condenó al maquinista. Al responsable de seguridad de Adif lo condenó en 2024 y lo absolvió en apelación en 2026, con un voto en contra. Trece años después, el caso sigue pendiente de un indulto." Sem nomes, sem adjetivos.

---

## 6. Geografia para a maquete 3D

**Arquivos:** `geo/osm_angrois.py` (coleta Overpass), `geo/osm_angrois_raw.json` (bruto, 9 802 elementos, ODbL, 31/10/2026), `geo/tracado_angrois.py` (encadeia e calibra o PK), **`geo/lav_angrois.json`** (traçado PK 77,57 → 85,04: `pontos` = vértices do OSM com PK, tipo e nome de túnel/viaduto; `pontos_25m` = densificado a cada 25 m; `marcos` = todos os PKs da sequência com lat/lon; `entorno` = povoados, muros e caminhos perto do ponto 0), `roteiro/dados/angrois/dem_angrois_eudem25.json` (relevo).

- **PK no OSM:** esta zona **não tem `railway:position`** nem marcos. O PK foi **calibrado [calc]** por interpolação linear entre 8 âncoras do relatório da CIAF (bocas dos túneis de Marrozos e Santiago, extremos dos viadutos de O Eixo e E-01). Resíduos entre âncoras: **≤ 29 m**. Antes de 80,671 o PK é extrapolado (escala média). **Raio medido no OSM: ~399 m** (CIAF: 402) **[calc]**.
- **Qual via:** usei a via desenhada no sentido Ourense → Santiago, do lado **direito/NE** no sentido da marcha. Que ela seja a **"via 1"** do relatório é **inferência** (circulação pela direita em linha de alta velocidade): **[NÃO CONFIRMADO]**; a diferença entre as vias é de ~4-5 m.
- **Rumos [calc]:** reta (80,0 → 84,2) rumo **~298° (ONO)**; depois da curva (84,7 → 84,9) **~235° (SO)**. É uma **curva à esquerda**: o "lado de fora" é a **direita / norte**, para onde os carros foram (CIAF).

| Ponto | PK | lat, lon **[calc]** |
|---|---|---|
| Celular começa a tocar | 77+780 | 42,82988, −8,45681 |
| **Início da conversa** | **78+280** | **42,83287, −8,46137** |
| Fim do ERTMS (CIAF / sentença) | 80+069 / 80+169 | 42,84144, −8,47981 / 42,84186, −8,48090 |
| **Sinal avançada E′7** (verde) | **80+619** | **42,84373, −8,48577** |
| Túnel de Marrozos (1 285 m) | 80+671 → 81+956 | 42,84395, −8,48634 → 42,84920, −8,49998 |
| Placa "cambio de modo ASFA" | 80+803 | 42,84449, −8,48774 |
| Viaduto de O Eixo (1 225 m) | 82+112 → 83+337 | 42,84989, −8,50183 → 42,85498, −8,51514 |
| Ponto-limite para frear a tempo **[calc]** | ~82+85 a 82+97 | ~42,8530, −8,5106 (sobre o viaduto) |
| Túnel de Santiago (641 m) | 83+465 → 84+106 | 42,85559, −8,51666 → 42,85815, −8,52335 |
| **Fim da conversa** | **83+821** | **42,85701, −8,52037** (dentro do túnel) |
| **Freio de emergência** | **84+009** | **42,85776, −8,52233** (dentro do túnel) |
| Sinal de entrada E7 (verde) + baliza | 84+176 / 84+171 | 42,85847, −8,52417 |
| **Início da curva** (transição) | **84+228** | **42,85870, −8,52479** |
| Viaduto E-01 (80 m) | 84+245 → 84+325 | 42,85878, −8,52499 → 42,85913, −8,52597 |
| Placa "84.2" (mudança de velocidade) | 84+273 | 42,85891, −8,52533 |
| **Ponto 0 (descarrilamento)** | **84+413** | **42,85939, −8,52699** |
| Início da curva circular R 402 m | 84+428 | 42,85942, −8,52717 |
| Grupo 3 (carros 6-13) | 84+505 → 84+567 | 42,85951, −8,52810 → 42,85948, −8,52886 |
| Grupo 2 (carros 4-5) | 84+600 → 84+626 | ~42,85940, −8,52941 |
| Grupo 1 (cabeça, CET, carro 3) / fim do arrasto | 84+637 → **84+684** | **42,85919, −8,53023** |
| Fim da curva / agulhas B1-B3 | 84+894 / 84+892-84+983 | 42,85814, −8,53235 |
| Fim da linha 082 (Bif. A Grandeira) | 85+041/045 | 42,85732, −8,53376 |
| Estação Santiago de Compostela (Daniel Castelao) | linha 822, PK 378+500 | 42,87044, −8,54520 (OSM) |

- **WIKI-ES** dá 42°51′34″N 8°31′40″O (42,8595, −8,5277): cai ~60 m adiante do nosso ponto 0, dentro da zona dos destroços. Usar as nossas.
- **Bairro:** o lugar **Angrois** (hamlet no OSM) fica a **~130 m ao norte** do ponto 0 (42,8606, −8,5273), do lado de fora da curva; em volta, os lugares A Cortiña, Trepumar, O Soutiño, O Forxán, O Limpadoiro (≤ 200 m). Ruas: **Rúa de Angrois** (~85 m), **Camiño Real de Angrois** (~100 m). Um **caminho** sem nome passa a **~30 m** do ponto 0, **do lado de dentro (sul)** da curva, junto a um muro de arrimo do OSM; se este é o "camino adyacente" onde parou o 8º carro: **[NÃO CONFIRMADO]** (os carros saíram para fora/norte, mas o grupo da cauda ficou atravessado; conferir em fotos aéreas de 2013). A **AP-9 (Autoestrada do Atlántico)** passa a ~110 m.
- **Linha convencional 822** (Ourense–Santiago, via única, sem eletrificação) corre **colada à 082** no ponto do acidente (CIAF 2.2.3.2.1); ficou fora de serviço só para o resgate.
- **Relevo (EU-DEM 25 m, superfície, não resolve aterros/viadutos) [calc]:** a reta é um sobe-e-desce de vales: ~300 m de cota sobre o túnel de Marrozos; **vale de ~150 m** sob o viaduto de O Eixo (a via passa bem alta: **viaduto alto**, conferir altura em foto); **~265 m** sobre o túnel de Santiago; a curva fica numa **depressão de ~208-215 m** (o viaduto E-01 cruza esse fundo); depois sobe para ~228 m. Corte transversal no ponto 0: o terreno **cai suavemente para o norte/fora da curva** (214 → 212 m a 50-150 m) e **sobe para o sul/dentro** (214 → 223 m a 150 m). Greide da via (CIAF): rampa de 12,5 ‰ por 4,6 km e de 8,6 ‰ na curva.
- **Distância Ourense–curva:** a linha 082 tem ~87 km (Sentença); da estação de Ourense ao ponto 0 são **~85 km**, feitos em **35 min 53 s** (20:05:13 → 20:41:06), média ~142 km/h **[calc]**.
- **Iluminação:** dia claro, **sol baixo de fim de tarde** (13°, az. ~285°), **pôr do sol 22:04**, fim do crepúsculo civil 22:36 **[calc]**. Na reta o sol fica **~13° à esquerda do rumo e 13° acima do horizonte** (contraluz na saída dos túneis); depois da curva, o sol vem **pela direita**. **Não usar o sol como causa** (nenhuma fonte fala em ofuscamento): é só o look.

---

## 7. Take inédito (~1 min): candidatos

### Candidato A (ESCOLHIDO): **"El riesgo estaba escrito. Y se lo pasaron al maquinista."**
- Na papelada de segurança da linha, o perigo **"descarrilar por exceso de velocidad"** aparece com todas as letras e é classificado como **catastrófico… mas "increíble" e "despreciable"**, porque o papel supunha que um sistema automático freava o trem (Sentença 2024, HP 2º).
- Só que, para os trens com ASFA, uma frase resolvia o resto: **"Riesgo exportado al maquinista"** (citada literalmente pela própria CIAF, 2014, §3.3). A curva de 80 numa reta de 200 ficou protegida **por uma pessoa e uma folha de papel** (Libro Horario).
- **O contraintuitivo:** todos os sistemas **funcionaram como projetados**: sinais verdes, balizas que apitaram três vezes, freio que respondeu em 3 s. O "furo" não era uma peça quebrada: era **uma linha num documento**. E não era só Angrois: depois do acidente a Adif achou **375 "cambios significativos de velocidad"** na rede espanhola, e em oito meses **122** ganharam placas e balizas que freiam o trem (CIAF 5.1).
- **Fecho com números (10 s):** "La señal de referencia quedaba a 65 segundos de la curva. La llamada duró 100. El último punto donde frenar aún servía estaba sobre el viaducto de O Eixo, unos 20 segundos antes de que el maquinista frenara" **[calc]**.
- **Equilíbrio obrigatório no áudio:** "La Audiencia de A Coruña absolvió en 2026 al responsable de seguridad de Adif: consideró que actuó según las normas de la época. Un magistrado votó en contra." E: "La CIAF y la justicia coinciden en la causa directa: la velocidad y la llamada."
- **Por que é inédito / por que é o melhor:** os vídeos em espanhol contam "la llamada" e "iba a 179"; quase nenhum mostra **o documento** ("riesgo exportado al maquinista"), a nota "increíble/despreciable" e os **375 pontos**. Tem fonte **[OFICIAL] tripla** (CIAF 2014, ERA 2016, sentença 2024), é visual (um carimbo "EXPORTADO" voando de um papel para a cabine; mapa da Espanha acendendo 375 pontos) e é **sistêmico**, que é a linha editorial do canal.

### Candidato B: **"El guardián que se apagaba 4 km antes"**
- O projeto original levava o ERTMS **até dentro da estação de Santiago** (trocadores de bitola no PK 88); a modificação de 2010-2011 (bitola ibérica, sem trocadores) mudou o fim do ERTMS para o **PK 80,1, 4 km antes da curva** (Sentença HP 1º). E nos 730 o ERTMS de bordo estava **desligado desde jun/2012** por incompatibilidade de software.
- **A virada contraintuitiva:** ligado ou desligado **daria quase no mesmo**: a CIAF e a sentença concluem que, com o ERTMS ativo, o trem passaria a ASFA a 200 km/h em 80,1 e **nada o frearia na curva**. A única diferença: o maquinista teria de **apertar um botão** no fim do ERTMS, ~32 s depois de começar a chamada **[calc]**.
- Fraqueza: mais técnico e mais conhecido ("le quitaron el ERTMS" circulou muito em 2013-2014).

### Candidato C: **"Lo vieron venir en 2011"**
- O maquinista-chefe da Renfe escreveu em dez/2011 que a queda de 200 para 80 não tinha aviso nem ERTMS e pediu placas; o alerta morreu numa ata (CIAF 3.2.3.3). Mais a ERA: **20 descarrilamentos por velocidade em 2008-2013** com curvas sem balizas.
- Fraqueza: já foi manchete em 2014 ("el correo del maquinista jefe"); risco de soar acusatório contra pessoas.

### Ponte com Adamuz (vídeo anterior) **[1 fonte por fato, sem nomes]**
- Um **camareiro da cafeteria do Alvia** morto em **Adamuz (18/01/2026)** tinha **escapado de Angrois em 2013 porque trocou o turno com um colega da cafeteria, que morreu em Angrois** (cunhado, a Diario de León, 20/01/2026; irmã, a EFE via Diari de Tarragona, 21/01/2026). **Correção ao briefing:** ele **não era sobrevivente a bordo** de Angrois; **não estava no trem**. Formulação segura: "trece años antes, un cambio de turno lo apartó del tren de Angrois".
- **A mesma comissão:** a CIAF que a ERA julgou "não independente" em Angrois (2016) foi a que investigou Adamuz, por disposição transitória, antes de a nova autoridade independente (AITAT, Ley 2/2024) funcionar (dossiê de Adamuz; El Salto, "La comisión que investiga el accidente de Adamuz fue tachada de parcial por Bruselas…", via busca).
- **Distância:** Angrois → Adamuz **~635 km em linha reta** **[calc]**; Público fala em "778 kilómetros y 13 años" (provavelmente por estrada) **[1 fonte, não aberta]**.
- **Ranking:** Angrois segue sendo o acidente ferroviário mais grave da Espanha no século XXI (80), à frente de Urda (69) e Adamuz (46) (dossiê de Adamuz, WIKI-ES).

---

## 8. O que ainda não se sabe / não confirmei
1. **Velocidade exata no ponto 0:** 179 (CIAF) × 176 km/h (sentença); a resolução de 1 s do registrador explica a diferença.
2. **Quantas pessoas a bordo** (224-227 + menores de 4) e **quantos feridos** (143-152).
3. **Altura do centro de gravidade** dos carros 730 e do CET (para a física do tombamento).
4. **Lado, altura e extensão do muro de concreto** contra o qual bateram os carros; posição exata do "camino adyacente" do 8º carro.
5. Que a via do OSM usada seja a **via 1**.
6. **ERTMS no trecho hoje** (2026).
7. **Qualquer ação da ERA em 2024** (não existe no que encontrei; o parecer é de 2016).
8. **Indulto:** pendente no Conselho de Ministros (out/2026); recursos no TC não verificados na fonte.

---

## 9. Fontes

| Cód. | Veículo | Título (resumido) | URL | Publicação |
|---|---|---|---|---|
| **CIAF** | CIAF / Ministerio de Fomento **[OFICIAL]** | Informe final sobre el accidente grave ferroviario nº 0054/2013 (es, 266 pp. com anexos) | https://www.era.europa.eu/system/files/2023-07/IF_240713_200514_CIAF.pdf (cópia `dados/angrois/ciaf_informe_final_0054-2013_es.pdf`) | 20/05/2014 (publ. 04/06/2014) |
| CIAF-EN | ERA (tradução oficial) **[OFICIAL]** | Final report on serious railway accident no 0054/2013 (ERA-2014-0070) | https://www.era.europa.eu/system/files/2023-07/IF_240713_ERA-2014-0070-EN.pdf (cópia `dados/angrois/era_2014_0070_en.pdf`) | 2014 |
| **ERA-2016** | European Railway Agency **[OFICIAL]** | ERA/ADV/2015-6: strengths and weaknesses of the investigation report on Santiago de Compostela | http://www.era.europa.eu/Document-Register/Documents/ERA-ADV-2015-6%20Investigation%20report-Santiago%20de%20Compostela%20(003)%20(002).pdf (404 hoje; cópia Wayback 08/09/2016 em `dados/angrois/era_adv_2015_6_avaliacao_ciaf_2016.pdf`) | 07/07/2016 |
| CIAF-2016 | CIAF **[OFICIAL]** | Comunicado de la CIAF (resposta à ERA) | https://praza.gal/storage/xornal/uploads/arquivos/arquivo/577f740e06e43-20160707comunicadodelaciaf.pdf | 07/07/2016 |
| **SENT-2024** | Juzgado de lo Penal nº 2 de Santiago (CGPJ) **[OFICIAL]** | Sentencia PA 463/21 (anonimizada) | https://www.poderjudicial.es/stfls/TRIBUNALES%20SUPERIORES%20DE%20JUSTICIA/TSJ%20Galicia/DOCUMENTOS%20DE%20INTERES/SENTENCIA%20ALVIA%20PA%20463-21_Anonimizada.pdf | 26/07/2024 |
| CGPJ-2024 | CGPJ, TSJ Galicia **[OFICIAL]** | El maquinista del Alvia y el exdirector de Seguridad en la Circulación de ADIF son condenados a dos años y medio… | https://www.poderjudicial.es/cgpj/es/Poder-Judicial/Tribunales-Superiores-de-Justicia/TSJ-Galicia/Noticias-Judiciales-TSJ-Galicia/El-maquinista-del-Alvia-y-el-exdirector-de-Seguridad-en-la-Circulacion-de-ADIF-son-condenados-a-dos-anos-y-medio-de-prision-por-79-homicidios-y-143-lesiones-imprudentes- | 26/07/2024 |
| CGPJ-2026 | CGPJ, TSJ Galicia **[OFICIAL]** | La Audiencia de A Coruña confirma la condena al maquinista… y absuelve al exdirector… | https://www.poderjudicial.es/cgpj/es/Poder-Judicial/Tribunales-Superiores-de-Justicia/TSJ-Galicia/Oficina-de-Comunicacion/Archivo-de-notas-de-prensa/La-Audiencia-de-A-Coruna-confirma-la-condena-al-maquinista-del-Alvia-que-descarrilo-en-Angrois-y-absuelve-al-exdirector-de-Seguridad-en-la-Circulacion-de-ADIF | 23/01/2026 |
| CGPJ-IND | CGPJ (só via busca) | La jueza del Tribunal de Instancia de Santiago informa a favor del indulto del maquinista… | https://www.poderjudicial.es/cgpj/es/Poder-Judicial/Tribunales-Superiores-de-Justicia/TSJ-Galicia/Noticias-Judiciales-TSJ-Galicia/La-jueza-del-Tribunal-de-Instancia-de-Santiago-informa-a-favor-del-indulto-del-maquinista-del-tren-Alvia-que-descarrilo-en-Angrois | set/2026 |
| DL-IND | Diario de León (Europa Press) | Suspendida la entrada en prisión del maquinista del Alvia… hasta que se resuelva el indulto | https://www.diariodeleon.es/nacional/261015/2100322/suspendida-entrada-prision-maquinista-alvia-angrois-resuelva-indulto.html | 15/10/2026 15:24 |
| MONC-FISC | Moncloa.com (só via busca) | Indulto al maquinista del Alvia: la Fiscalía apoya la medida | https://www.moncloa.com/2026/09/04/indulto-maquinista-alvia-fiscalia-santiago-3425902/ | 04/09/2026 |
| BOLSA-CE | Bolsamanía (Europa Press) | La Comisión Europea avisa de que la investigación independiente del accidente del Alvia "sigue pendiente" | https://www.bolsamania.com/noticias/politica/la-comision-europea-avisa-de-que-la-investigacion-independiente-del-accidente-del-alvia-sigue-pendiente--7372878.html | 06/03/2020 18:47 |
| RG-2016 | Railway Gazette International | Concerns raised over Santiago de Compostela crash investigation | https://www.railwaygazette.com/archive/2016/07/08/concerns-raised-over-santiago-de-compostela-crash-investigation/ | 08/07/2016 |
| DL-ADAMUZ | Diario de León | El tripulante desaparecido que salvó la vida en Angrois… | https://www.diariodeleon.es/sociedad/260120/2072987/tripulante-desaparecido-salvo-vida-angrois-viuda-vuelto-nacer-historias-quedaron-adamuz.html | 20/01/2026 21:51 |
| DT-ADAMUZ | Diari de Tarragona (EFE) | Identifican al tripulante del Alvia que se salvó en Angrois entre las víctimas de Adamuz | https://www.diaridetarragona.com/sucesos/250199/identifican-tripulante-alvia-salvo-angrois-victimas-adamuz_amp.html | 21/01/2026 19:21 |
| DOG-2014 | Xunta de Galicia, DOG **[OFICIAL]** | Decreto 84/2014: Medalla de Oro de Galicia (vítimas, vizinhos de Angrois, emergências) | https://www.xunta.gal/dog/Publicados/2014/20140715/AnuncioG0244-140714-0006_es.html | 15/07/2014 |
| CLINIC | The Clinic | La historia de los vecinos de Angrois, los primeros rescatistas | https://www.theclinic.cl/2013/07/26/la-historia-de-los-vecinos-de-angrois-los-primeros-rescatistas-de-la-tragedia-ferroviaria-en-espana/ | 26/07/2013 |
| WIKI-ES | Wikipedia (es) | Accidente ferroviario de Angrois | https://es.wikipedia.org/wiki/Accidente_ferroviario_de_Angrois | consultado 31/10/2026 |
| WIKI-EN | Wikipedia (en) | Santiago de Compostela derailment | https://en.wikipedia.org/wiki/Santiago_de_Compostela_derailment | consultado 31/10/2026 (contagem de mortos confusa; só apoio) |
| OSM | OpenStreetMap via Overpass (ODbL) | LAV 082/822, túneis, viadutos, povoados, muros, caminhos | overpass-api.de | 31/10/2026 |
| EUDEM | OpenTopoData, EU-DEM 25 m | perfil PK 80,4-85,0 e corte no ponto 0 | api.opentopodata.org | 31/10/2026 |
| ADAMUZ | nosso dossiê | `D:\reconstruccion\03_adamuz\roteiro\fakten.md` | | 31/10/2026 |
| Só via busca (não abertas) | Última Hora 05/10/2022 (início do julgamento); Menorca.info 20/06/2023 (Fiscalía retira acusação ao ex-diretor); Onda Vasca 2026 (recursos ao TC); El Salto (CIAF "tachada de parcial"); Público ("De Angrois a Adamuz: 778 kilómetros y 13 años"); eldiario.es (medalha e vítimas); Europarl E-000669/2024 (PDF vazio) | | | apoio, nunca sozinhas |

---

## 10. Espinha sugerida (12 capítulos, ~12 min)
1. **20:41:06. La curva**: luz dourada, o trem sai do túnel, o CET levanta; corte para branco.
2. **La pregunta**: "Un tren a 200 por hora tenía que pasar a 80 en una curva. ¿Quién tenía que frenarlo?"
3. **Lo reconstruimos segundo a segundo**: registrador, CIAF, sentença; mapa Madrid → Ourense → Santiago; véspera do Apóstolo.
4. **El tren**: 13 veículos, 185 m, 382 t, cabeças + geradores diesel + Talgos; ~220 pessoas.
5. **El guardián que se apagaba antes** (cand. B condensado): projeto original até a estação; fim do ERTMS 4 km antes; ERTMS de bordo desligado desde 2012.
6. **20:39:15. La llamada**: 100 s, 5,5 km; HUD com contador e PKs.
7. **Todo en verde**: E′7, balizas que só apitam, placa de modo ASFA no túnel; "65 segundos hasta la curva".
8. **El último punto para frenar**: viaduto de O Eixo, conta de freada (1,3 km, 33 s) **[calc]**.
9. **20:40:59. Freno**: túnel, 3 s de atraso, E7 verde, placa "84.2" dentro da curva.
10. **179 km/h en 402 metros de radio**: física (5×, 41 kg de lado, seta do peso saindo da base, 126 m de queda); 10 s, três grupos, o 8º fora, o 12º em chamas.
11. **El riesgo exportado** (TAKE INÉDITO): o papel "catastrófico / increíble / despreciable", "riesgo exportado al maquinista", ERA 2016, 375 pontos; equilíbrio com a absolvição de 2026.
12. **Trece años después**: vizinhos de Angrois, 80 mortos, sentença e indulto pendente; ponte com Adamuz (o camareiro que trocou o turno; a mesma comissão). Fecho respeitoso, maquete se apagando.
