# Lista completa de falhas do v14b v2 (Moltke, 18:06) contra o AiTelly "How the Gatling Gun Actually Works?" (03/11/2026)

**Para que serve:** checklist de correção para os **próximos** vídeos. O v14b não ganha v3 (decisão do Eduardo).

**Material:**
- folhas `lado_a_lado_1..4.jpg` (na pasta de pesquisa local): cada falha à esquerda (borda vermelha) com o equivalente do AiTelly à direita (borda verde), com o instante.
- folhas de planos dos dois vídeos (pasta de pesquisa local): todos os planos dos dois vídeos, com classe, câmera e cor.
- a tabela de segmentos (pasta de pesquisa local): as medições plano a plano.

**Método:**
- cortes a 8 fps;
- por plano: câmera (correlação de fase + zoom log-polar), luminância, saturação, colorfulness;
- classe automática:
  - "cartão escuro": luminância < 45 e pouco detalhe;
  - "mapa bege": tom de areia;
  - "época/pouca cor": saturação e cor baixas;
  - "cena": o resto.

  Depois, leitura plano a plano das folhas.
- **Escolha da referência:** o Gatling é o "como funciona" mais visto dos 10 lidos (510 mil) e o mais puro em mecanismo.

## 1. Os números
| Medida | v14b v2 | AiTelly Gatling |
|---|---|---|
| Duração / planos | 18:06 / 134 | 11:59 / 105 |
| **Cena** (3D, mundo, objeto) | **45%** | **85%** |
| **Cartão escuro** | **28%** | 5% |
| **Mapa bege chapado** | **17%** | 8% (é deserto 3D, não mapa) |
| **Época / pouca cor** | **11%** | 2% |
| Câmera parada (24 fps) | 36,7% | 4,0% |
| Takes distintos/min | 11,0 | 16,3 |
| Colorfulness (mediana) | 17,4 | 27,9 |
| Planos longos (> 8 s) | 44, quase todos cartão, foto ou mapa | 18, quase todos plano contínuo com o mecanismo andando |

## 2. As falhas, por categoria (as folhas lado a lado mostram 3 exemplos de cada)
| Cód. | Falha | Onde (exemplos) | Como o AiTelly faz (instante no Gatling) | Correção para o próximo vídeo |
|---|---|---|---|---|
| **F1** | **Cartão escuro explicativo separado da cena:** esquemas de caixas e setas, linhas do tempo e barras sobre fundo azul-marinho, quase vazios, 28% do vídeo | 2:28 "Die Zange" 12,5 s; 4:05 "Wer steht zuerst an der Grenze?" 12,4 s; 8:40 Reservist→Depot 24,4 s; 3:24 "7 Sprachen" 12 s; 7:43 "Wie ein Schachspieler"; 12:57 "Befehlsweg"; 17:02 cartão vazio 15,9 s | o mecanismo em **corte no palco** (3:10), o **palco de planta azul** com o objeto (9:55), o **rótulo do estágio dentro da cena** ("FIRST/THIRD STAGE", 8:07) | `EsquemaNaCena`: fluxo e ícones andando sobre o diorama/terreno; rótulo com linha de chamada; o conceito explicado no **objeto** dentro do palco. Cartão só como soco ≤ 3 s |
| **F2** | **Foto ou pintura de época parada por muito tempo** | 4:28 foto "Ohne Änderung" 22,8 s; 12:35 pintura Mars-la-Tour 31,8 s; 0:17 retrato parado; 3:36 "7 Sprachen" parado 95% | **personagem em ação, primeira pessoa** (0:17 piloto; 5:10 mãos no comando; 5:23) | época ≤ 4 s por imagem, com movimento (dolly/parallax); o momento humano em 3D com personagem estilizado com rig |
| **F3** | **Mapa bege chapado, a mesma base voltando** (17%) | 7:32 Aufmarsch (3ª vez da mesma base); 14:25 mapa quase vazio 11,1 s; 1:32 Steinmetz, parado 84% | **mundo 3D com rótulo no lugar** (0:47 "M163" no deserto), **ação no terreno** (8:56), céu e mundo vivos (0:21) | o lugar em terreno 3D real com câmera andando e rótulo preso; mapa 2D só como inserto ≤ 4 s; variar ângulo e recorte |
| **F4** | **Objeto de kit: brinquedo e argila**, sem interior | 3:56 mesa de cubos azuis; 5:55 locomotiva de brinquedo e soldados com "X"; 16:50 Krupp low-poly sem interior; 3:43 relógio de argila | **mecanismo em corte** (3:05), **ferrolho e came** (3:40), **estúdio com o veículo e a peça** (6:48 "M61 VULCAN") | modelo explicativo com interior por código (Krupp com culatra, locomotiva com rodas e bielas); preset de acabamento "explicação AiTelly" (luz de estúdio + IBL, cor por subsistema, sombra) |
| **F5** | **Texto sobreposto, fantasma ou cobrindo o objeto** | 1:52 título sobre o objeto 3D; 10:00 "Tag 17" sobre "Tag 37"; 17:14 "SchrittSchrittSchritt 3"; 8:04 "100.000" duplicado sobre retrato; 9:45 "kein Fahrplan" fantasma | **rótulo limpo, um por vez, fora do objeto** (0:30 "THE PIPPER"; 8:51 "FOURTH STAGE"; 8:06 "FIRST STAGE") | posição do texto pela máscara do objeto (espaço vazio); checagem automática de caixas sobrepostas; uma camada de texto por vez |
| **F6** | **Instrumento em cartão escuro, fora da cena** (e vazio) | 9:30 gráfico "Truppen am Rhein" em 0, 11,5 s, parado 93%; 16:15 contador de prisioneiros sobre cartão; 0:52 calendário sobre cartão | **instrumento dentro da cena** (0:30 HUD; 5:39 MFD; 0:50 retícula do visor) | o instrumento vive sobre a cena viva (painel vivo, como em Sedan e na curva do Tag 17), nunca em cartão; nunca começar em 0 parado |
| **F7** | **Cor e luz apagadas** (colorfulness 17 contra 28) | 0:02 abertura cinza; 15:10 Sedan cinza; 15:30 terreno sem cor | céu saturado (0:21), luz de sol (0:14), contraluz e nuvem (5:30) | luz de estúdio/sol com IBL, céu com cor (atmosfera Takram), exposição mais alta; meta ~30 nos trechos de explicação |
| **F8** | **Mesmo retrato e mesma medalha repetidos** (Moltke 10+ vezes, medalha 3×, calendário 2×, barras 2×) | 4:55, 13:42, 17:20 (mesmo retrato); planos #4, 12, 31, 32, 36, 48, 77, 79, 85, 104, 105, 125, 129; medalha #87, 95, 111, 130, 131 | **o mesmo objeto em ângulos novos** (3:05, 3:50, 4:40), nunca a mesma imagem | take único também para imagem 2D (hash na régua preditiva); variar fonte (outras fotos, gravuras) ou ir para o 3D |
| **F9** | **Final só de época** (15:52–18:06: pinturas, fotos, gravuras, medalhas) | 15:55 pintura 16,6 s; 16:27 foto 17,2 s; 17:48 gravura | o final **em ação**, com o objeto vivo (10:59, 11:03, 11:08) | o resumo e a regra de ouro sobre a cena 3D principal (Sedan, os trens); época só como pontuação |
| **F10** | **Fato errado na tela** | 1:32 "General Steinmetz · 74" (nasceu em 27/12/1796: tinha 73) | — | conferir todo número e idade da tela contra o dossiê de fatos (não só a narração) |
| **F11** | **Planos longos sem ação dentro** (44 planos > 8 s) | 4:28 (22,8 s), 8:33 (24,4 s), 12:25 (31,8 s), 13:05 (33,5 s planície vazia), 17:02 (15,9 s) | planos longos **com o mecanismo andando** (2:59 36 s, 3:36 61 s, 9:49 40 s: câmera contínua, peças girando) | plano longo só com ação ou dado mudando a cada ≤ 1 s; senão corta |

**O que já está no nível e deve ficar** (folha 4, linha "MANTER"):
- Sedan com painel vivo 774 × 564, relógio e barra de alcance (15:38);
- curva de chegada sobre o mapa e o diorama (6:35, 10:31–10:46);
- Gleisprofil (6:10).

## 3. Lista completa, plano a plano (134 planos)
**Classe medida:**
- **CENA** = 3D, mundo, objeto;
- **CARTAO_ESCURO** = fundo escuro com pouco detalhe;
- **MAPA_BEGE** = mapa cor de areia;
- **EPOCA/POUCA_COR** = foto, gravura ou cena sem cor.

"Câmera parada" = % de quadros do plano sem movimento a 8 fps. A coluna de falha usa os códigos da seção 2.

| # | Instante | Duração (s) | Classe medida | Câmera parada (%) | Colorfulness | Falha / observação |
|---|---|---|---|---|---|---|
| 1 | 0:00.0 | 4.75 | CENA | 0 | 17.5 | abertura com terreno cinza, sem cor (F7) |
| 2 | 0:04.8 | 4.38 | EPOCA/POUCA_COR | 3 | 2.5 | retrato de época sobre mapa (F2) |
| 3 | 0:09.1 | 4.5 | CENA | 69 | 15.8 | foto de época parada (F2) |
| 4 | 0:13.6 | 3.38 | CENA | 8 | 13.2 | foto de Moltke (1ª de 10+ vezes) (F8) |
| 5 | 0:17.0 | 4.88 | CENA | 79 | 26.2 | foto de Moltke parada (F2/F8) |
| 6 | 0:21.9 | 3.5 | CENA | 4 | 17.9 |  |
| 7 | 0:25.4 | 5.5 | CARTAO_ESCURO | 42 | 14.6 | cartão escuro 'Warum in nur 45 Tagen?' com linha do tempo vazia (F1) |
| 8 | 0:30.9 | 10.88 | CENA | 27 | 32.4 |  |
| 9 | 0:41.8 | 3.62 | EPOCA/POUCA_COR | 4 | 12.1 | terreno 3D cinza, sem cor (F7) |
| 10 | 0:45.4 | 3.75 | CENA | 7 | 20.0 | mapa vermelho chapado com 1 linha (F3) |
| 11 | 0:49.1 | 6.0 | CARTAO_ESCURO | 9 | 19.4 | calendário em cartão escuro (F1/F6) |
| 12 | 0:55.1 | 4.25 | CENA | 3 | 9.4 | foto de Moltke 'Mit 69 Jahren' (F8) |
| 13 | 0:59.4 | 12.62 | CARTAO_ESCURO | 32 | 17.3 | o MESMO calendário de novo, 12,6 s (F1, repetição); plano longo sem ação |
| 14 | 1:12.0 | 9.0 | CENA | 48 | 17.3 | mapa vermelho quase vazio, 9 s (F3) |
| 15 | 1:21.0 | 6.0 | CARTAO_ESCURO | 72 | 17.1 | barras de idade em cartão escuro (F1/F6) |
| 16 | 1:27.0 | 5.25 | MAPA_BEGE | 10 | 39.8 | barras de idade de novo (F1, repetição) |
| 17 | 1:32.2 | 7.25 | CENA | 84 | 21.9 | mapa bege parado + 'Steinmetz · 74' (erro: 73) (F3, fato); parado |
| 18 | 1:39.5 | 4.25 | CENA | 3 | 17.3 | papel 'doppelt bereit' em cartão (F1) |
| 19 | 1:43.8 | 5.75 | CARTAO_ESCURO | 49 | 13.6 | 'Der Krieg geht weiter': linha do tempo vazia (F1) |
| 20 | 1:49.5 | 2.12 | CARTAO_ESCURO | 81 | 4.3 | 'Einfach mehr Glück?' em cartão (F1); parado |
| 21 | 1:51.6 | 5.12 | CENA | 2 | 42.2 | título sobre o objeto 3D da mesa (F5); objetos de argila (F4) |
| 22 | 1:56.8 | 5.88 | EPOCA/POUCA_COR | 67 | 2.5 | gravura de época (F2) |
| 23 | 2:02.6 | 4.75 | MAPA_BEGE | 8 | 43.3 | mapa bege com Tag (F3) |
| 24 | 2:07.4 | 6.38 | CENA | 2 | 14.9 | diorama do trem no kit antigo (F4) |
| 25 | 2:13.8 | 4.25 | CARTAO_ESCURO | 42 | 8.0 | cartão escuro quase vazio (F1) |
| 26 | 2:18.0 | 4.25 | MAPA_BEGE | 3 | 37.1 | caixas 'einen Plan / keinen Fahrplan' sobre mapa (F5) |
| 27 | 2:22.2 | 3.12 | MAPA_BEGE | 4 | 46.0 | mapa bege com setas chapadas (F3) |
| 28 | 2:25.4 | 12.5 | CARTAO_ESCURO | 35 | 8.8 | 'Die Zange' em cartão escuro quase vazio, 12,5 s (F1); plano longo sem ação |
| 29 | 2:37.9 | 6.88 | EPOCA/POUCA_COR | 13 | 2.5 | foto de grupo 'Unsere Quellen' (F2) |
| 30 | 2:44.8 | 4.75 | CENA | 0 | 21.1 | soldados em bloco com X (F4) |
| 31 | 2:49.5 | 4.25 | CENA | 0 | 18.2 | foto de Moltke de novo (F8) |
| 32 | 2:53.8 | 3.25 | EPOCA/POUCA_COR | 8 | 5.6 | foto de Moltke 'Wer war dieser Mann?' (F8) |
| 33 | 2:57.0 | 4.12 | CENA | 12 | 10.6 | mapa escuro com 1 linha (F3) |
| 34 | 3:01.1 | 7.75 | CARTAO_ESCURO | 23 | 11.1 | 'Ein Leben im Generalstab': linha do tempo em cartão, 7,8 s (F1) |
| 35 | 3:08.9 | 5.25 | CENA | 7 | 15.9 | mapa em relevo bege '1866 Königgrätz' (F3) |
| 36 | 3:14.1 | 5.12 | CENA | 5 | 9.5 | foto de Moltke de novo (F8) |
| 37 | 3:19.2 | 4.75 | EPOCA/POUCA_COR | 3 | 2.4 | gravura de época (F2) |
| 38 | 3:24.0 | 12.0 | CENA | 80 | 15.5 | '7 Sprachen' em cartão escuro, 12 s, parado (F1/F2); parado |
| 39 | 3:36.0 | 7.75 | CENA | 95 | 28.0 | '7 Sprachen' sobre o 3D, parado 95% (F2); parado |
| 40 | 3:43.8 | 4.38 | MAPA_BEGE | 6 | 32.3 | diorama de cubos + relógio de argila (F4) |
| 41 | 3:48.1 | 6.38 | CENA | 32 | 22.3 | mapa bege com rota (F3) |
| 42 | 3:54.5 | 5.12 | CENA | 57 | 31.7 | mesa de comando com cubos azuis (F4) |
| 43 | 3:59.6 | 12.38 | CARTAO_ESCURO | 22 | 12.5 | 'Wer steht zuerst an der Grenze?' esquema em cartão, 12,4 s (F1); plano longo sem ação |
| 44 | 4:12.0 | 6.75 | CENA | 6 | 39.9 | 'Wer zuerst ankommt' esquema em cartão (F1) |
| 45 | 4:18.8 | 6.38 | CENA | 72 | 21.5 | papel de época (F2) |
| 46 | 4:25.1 | 5.62 | EPOCA/POUCA_COR | 68 | 2.6 | foto de grupo de época (F2) |
| 47 | 4:30.8 | 22.75 | CARTAO_ESCURO | 8 | 8.1 | foto 'Ohne Änderung' parada, 22,8 s (F2); plano longo sem ação |
| 48 | 4:53.5 | 4.62 | CENA | 3 | 12.9 | foto de Moltke 'Die Vorhersage' (F8) |
| 49 | 4:58.1 | 5.62 | MAPA_BEGE | 0 | 42.1 | mapa bege com contador (F3) |
| 50 | 5:03.8 | 7.38 | CARTAO_ESCURO | 72 | 9.3 | cartão escuro com contador (F1) |
| 51 | 5:11.1 | 9.25 | CENA | 1 | 17.1 | diorama 'Ein Fahrplan für eine ganze Armee' (F4) |
| 52 | 5:20.4 | 6.88 | CENA | 87 | 21.4 | papel 'Eisenbahnabteilung' parado 87% (F2); parado |
| 53 | 5:27.2 | 12.38 | CARTAO_ESCURO | 5 | 9.9 | o mesmo papel de novo, 12,4 s (F1/F8); plano longo sem ação |
| 54 | 5:39.6 | 4.88 | EPOCA/POUCA_COR | 29 | 8.7 | mapa escuro com rota (F3) |
| 55 | 5:44.5 | 7.38 | CARTAO_ESCURO | 38 | 11.2 | cartão escuro (F1) |
| 56 | 5:51.9 | 9.12 | CENA | 1 | 20.9 | locomotiva de brinquedo + título (F4) |
| 57 | 6:01.0 | 18.38 | CARTAO_ESCURO | 14 | 7.7 | diorama escuro com vagões de soldados em X, 18,4 s (F4); plano longo sem ação |
| 58 | 6:19.4 | 7.25 | CENA | 4 | 20.3 | locomotiva de brinquedo (F4) |
| 59 | 6:26.6 | 9.25 | MAPA_BEGE | 19 | 39.6 | mapa bege com gráfico (bom, mas mapa) (F3); plano longo sem ação |
| 60 | 6:35.9 | 9.38 | CARTAO_ESCURO | 36 | 14.0 | 'Im Sekundentakt' caixas em cartão, 9,4 s (F1); plano longo sem ação |
| 61 | 6:45.2 | 6.38 | CENA | 2 | 14.8 | diorama do trem (F4) |
| 62 | 6:51.6 | 6.0 | CENA | 2 | 20.8 | trem e soldados em bloco (F4) |
| 63 | 6:57.6 | 6.75 | CARTAO_ESCURO | 6 | 9.5 | 'Aufmarsch' caixas em cartão (F1) |
| 64 | 7:04.4 | 18.88 | MAPA_BEGE | 11 | 42.8 | mapa bege Aufmarsch (F3); plano longo sem ação |
| 65 | 7:23.2 | 3.62 | CARTAO_ESCURO | 64 | 13.9 | barras em cartão escuro (F1/F6) |
| 66 | 7:26.9 | 10.38 | MAPA_BEGE | 6 | 43.1 | mapa bege Aufmarsch, 10,4 s (F3, mesma base); plano longo sem ação |
| 67 | 7:37.2 | 6.0 | MAPA_BEGE | 15 | 43.6 | mapa bege vazio (F3) |
| 68 | 7:43.2 | 9.5 | CARTAO_ESCURO | 27 | 13.4 | 'Wie ein Schachspieler' em cartão, 9,5 s (F1); plano longo sem ação |
| 69 | 7:52.8 | 2.62 | CARTAO_ESCURO | 80 | 11.4 | 'Einen Haken hatte der Plan' em cartão (F1); parado |
| 70 | 7:55.4 | 6.38 | CARTAO_ESCURO | 8 | 8.4 | 'Ein Korps' caixa em cartão (F1) |
| 71 | 8:01.8 | 3.12 | CENA | 62 | 4.5 | '100.000' em cartão (F1) |
| 72 | 8:04.9 | 6.5 | EPOCA/POUCA_COR | 12 | 8.5 | '100.000' sobre retrato, texto duplicado (F5) |
| 73 | 8:11.4 | 4.62 | EPOCA/POUCA_COR | 6 | 9.1 | retrato de época (F2) |
| 74 | 8:16.0 | 17.25 | MAPA_BEGE | 25 | 43.8 | retrato sobre mapa bege 'Ein Plan – aber kein Fahrplan', 17,2 s (F3/F5); plano longo sem ação |
| 75 | 8:33.2 | 24.38 | CARTAO_ESCURO | 32 | 7.9 | Reservist→Depot em cartão escuro, 24,4 s (F1); plano longo sem ação |
| 76 | 8:57.6 | 7.0 | CENA | 2 | 16.9 | diorama de casas e trem (F4) |
| 77 | 9:04.6 | 6.0 | EPOCA/POUCA_COR | 9 | 6.4 | foto de Moltke (F8) |
| 78 | 9:10.6 | 8.75 | MAPA_BEGE | 9 | 38.5 | mapa bege dos trens 'Tag' (F3); plano longo sem ação |
| 79 | 9:19.4 | 3.88 | CENA | 10 | 10.6 | foto de Moltke 'Ein Detail…' (F8) |
| 80 | 9:23.2 | 11.5 | CARTAO_ESCURO | 93 | 5.0 | gráfico 'Truppen am Rhein' VAZIO em 0, 11,5 s, parado 93% (F6); plano longo sem ação, parado |
| 81 | 9:34.8 | 10.88 | CENA | 2 | 17.6 | retrato de época (F2) |
| 82 | 9:45.6 | 7.12 | CENA | 2 | 17.6 | mapa bege 'Ein Plan – aber kein Fahrplan' com texto fantasma (F5) |
| 83 | 9:52.8 | 3.38 | CENA | 4 | 22.0 | cartão escuro (F1) |
| 84 | 9:56.1 | 14.62 | MAPA_BEGE | 4 | 42.9 | diorama (F4); plano longo sem ação |
| 85 | 10:10.8 | 6.62 | CARTAO_ESCURO | 2 | 14.6 | foto de Moltke (F8) |
| 86 | 10:17.4 | 5.38 | MAPA_BEGE | 5 | 39.2 | mapa bege dos trens (F3) |
| 87 | 10:22.8 | 6.25 | CENA | 6 | 27.7 | medalha de Moltke (1ª de 3) (F8) |
| 88 | 10:29.0 | 2.12 | CARTAO_ESCURO | 88 | 4.4 | 'Die eigentliche Wendung' em cartão (F1); parado |
| 89 | 10:31.1 | 7.0 | CENA | 96 | 27.9 | curva de chegada sobre o diorama (bom); parado |
| 90 | 10:38.1 | 7.88 | CARTAO_ESCURO | 24 | 12.2 | curva sobre o diorama (bom) |
| 91 | 10:46.0 | 5.75 | EPOCA/POUCA_COR | 56 | 5.8 | curva sobre o diorama (bom) |
| 92 | 10:51.8 | 6.88 | CENA | 19 | 27.4 | mapa bege dos trens + gráfico (bom, mas mapa) (F3) |
| 93 | 10:58.6 | 17.38 | MAPA_BEGE | 42 | 32.6 | gráfico sobre o diorama em cartão (F1); plano longo sem ação |
| 94 | 11:16.0 | 13.62 | CENA | 2 | 26.3 | mapa bege + barras (F3) |
| 95 | 11:29.6 | 6.25 | CENA | 2 | 20.5 | medalha (F8) |
| 96 | 11:35.9 | 6.25 | CENA | 69 | 30.2 | cartão escuro (F1) |
| 97 | 11:42.1 | 5.25 | CENA | 5 | 18.6 | diorama do trem + painel (bom) |
| 98 | 11:47.4 | 14.25 | CENA | 9 | 33.3 | mapa 3D do comando com X (F4) |
| 99 | 12:01.6 | 6.0 | CARTAO_ESCURO | 19 | 8.6 | grade vazia em cartão, 6 s (F1) |
| 100 | 12:07.6 | 18.0 | CENA | 17 | 29.0 | mesa do comando, 18 s (F4) |
| 101 | 12:25.6 | 31.75 | CENA | 4 | 26.0 | pintura Mars-la-Tour parada, 31,8 s (F2) |
| 102 | 12:57.4 | 8.38 | CARTAO_ESCURO | 17 | 6.1 | 'Befehlsweg' caixa-linha-caixa em cartão, 8,4 s (F1); plano longo sem ação |
| 103 | 13:05.8 | 33.5 | CENA | 9 | 19.6 | planície vazia, 33,5 s (F3/F2) |
| 104 | 13:39.2 | 4.5 | EPOCA/POUCA_COR | 9 | 6.1 | foto de Moltke (F8) |
| 105 | 13:43.8 | 13.38 | MAPA_BEGE | 11 | 42.9 | foto de Moltke 'Moltke entscheidet selbst', 13,4 s (F8); plano longo sem ação |
| 106 | 13:57.1 | 9.88 | CENA | 9 | 19.1 | foto de época Bar-le-Duc (F2) |
| 107 | 14:07.0 | 7.12 | CARTAO_ESCURO | 86 | 6.3 | 'Wohin marschiert MacMahon?' em cartão, parado 86% (F1); parado |
| 108 | 14:14.1 | 7.0 | MAPA_BEGE | 7 | 42.6 | mapa bege com seta (F3) |
| 109 | 14:21.1 | 11.12 | MAPA_BEGE | 35 | 34.7 | mapa bege quase vazio, 11,1 s (F3); plano longo sem ação |
| 110 | 14:32.2 | 9.62 | CARTAO_ESCURO | 5 | 12.7 | esquema da porta (Schwenk) em cartão (F1); plano longo sem ação |
| 111 | 14:41.9 | 7.75 | CARTAO_ESCURO | 11 | 26.9 | medalha 'Nur ein Luftstoß?' (F8) |
| 112 | 14:49.6 | 9.0 | MAPA_BEGE | 7 | 46.3 | mapa bege com setas (F3); plano longo sem ação |
| 113 | 14:58.6 | 7.62 | EPOCA/POUCA_COR | 7 | 1.5 | gravura de época (F2) |
| 114 | 15:06.2 | 7.62 | EPOCA/POUCA_COR | 55 | 11.9 | terreno de Sedan cinza (F7) |
| 115 | 15:13.9 | 5.38 | EPOCA/POUCA_COR | 2 | 12.7 | Krupp low-poly sobre terreno cinza (F4/F7) |
| 116 | 15:19.2 | 5.5 | CENA | 9 | 16.0 | Sedan: painel 774×564 + relógio (bom) |
| 117 | 15:24.8 | 9.38 | CENA | 8 | 21.2 | Sedan: painel (bom) |
| 118 | 15:34.1 | 4.62 | CENA | 3 | 18.5 | Sedan: painel (bom) |
| 119 | 15:38.8 | 10.38 | CENA | 45 | 21.9 | Sedan: painel + barra (bom) |
| 120 | 15:49.1 | 3.62 | CENA | 54 | 17.7 | anel de Sedan (bom) |
| 121 | 15:52.8 | 16.62 | CENA | 12 | 12.8 | pintura de época 'Von der Anhöhe bei Frénois', 16,6 s (F9) |
| 122 | 16:09.4 | 4.0 | CARTAO_ESCURO | 0 | 33.2 | pintura de época (F9) |
| 123 | 16:13.4 | 8.12 | CARTAO_ESCURO | 5 | 23.6 | contador de prisioneiros em cartão escuro, 8,1 s (F1/F6); plano longo sem ação |
| 124 | 16:21.5 | 3.5 | CARTAO_ESCURO | 4 | 20.1 | pintura 'Republik in Paris' (F9) |
| 125 | 16:25.0 | 17.25 | CENA | 20 | 12.5 | foto de Moltke 'Metz kapituliert', 17,2 s (F8/F9) |
| 126 | 16:42.2 | 15.88 | CENA | 2 | 19.2 | esquema sobre gravura, texto sobreposto (F5/F9) |
| 127 | 16:58.1 | 4.25 | CENA | 6 | 18.7 | Krupp low-poly com fumaça (F4) |
| 128 | 17:02.4 | 15.88 | CARTAO_ESCURO | 24 | 10.2 | cartão escuro vazio, 15,9 s (F1); plano longo sem ação |
| 129 | 17:18.2 | 9.62 | EPOCA/POUCA_COR | 37 | 6.2 | foto de Moltke 'Kreisau' (F8/F9); plano longo sem ação |
| 130 | 17:27.9 | 4.62 | CENA | 19 | 25.6 | medalha (F8/F9) |
| 131 | 17:32.5 | 7.75 | CENA | 36 | 10.6 | medalha '2 Wachswalzen' (F8/F9) |
| 132 | 17:40.2 | 4.88 | MAPA_BEGE | 3 | 40.4 | mapa bege 'In sieben Sprachen schweigen' (F3/F9) |
| 133 | 17:45.1 | 8.75 | EPOCA/POUCA_COR | 20 | 3.4 | gravura 'Warum verlor Frankreich' (F9); plano longo sem ação |
| 134 | 17:53.9 | 12.0 | EPOCA/POUCA_COR | 27 | 4.3 | gravura, 12 s (F9); plano longo sem ação |