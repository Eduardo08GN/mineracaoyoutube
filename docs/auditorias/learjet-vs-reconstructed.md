# Auditoria visual: o nosso Learjet (Segundo a Segundo, vídeo 5) contra o Reconstructed (03/11/2026)

**O que foi comparado:**
- **Nosso:** `accidente_learjet_palm_beach.mp4`, 10:30, Tracer3D 2.0 (Remotion + three.js).
- **Referência:** Reconstructed, "Como 9 pessoas morreram na queda do Learjet na Flórida", 12:05, baixado em 720p.

**Método:**
- **Leitura completa a 24 fps** dos dois vídeos: 15.127 quadros nossos e 17.410 deles. Em cada quadro, medi luminância, contraste, saturação, colorido e detalhe (gradiente), além da diferença entre quadros e dos cortes.
- **40 pares lado a lado** no mesmo instante relativo (a cada 2,5% da duração).
- **Três tiras a 24 fps** de 2 s cada (mergulho, cruzeiro, bairro).
- As folhas estão nesta pasta: `learjet_vs_rec_par_0..3.jpg` e `learjet_vs_rec_tira_*.jpg`.

## 1. O que os números mostram

| Medida (por quadro) | Nosso | Reconstructed | Leitura |
|---|---|---|---|
| Duração mediana do plano | 2,5 s | 3,4 s | **O ritmo não é o problema.** Cortamos até mais rápido. |
| Planos com mais de 8 s | 16 | 13 | parecido |
| Luminância mediana (0–255) | **176** | **118** | O nosso é claro e lavado; o deles é escuro e com clima. |
| Luminância p10 | **132** | **8** | Não temos pretos. Eles usam tela preta, céu de tempestade e sombras. |
| Contraste p90 | 31 | 42 | O nosso é chapado. |
| Detalhe p90 (gradiente) | **10,6** | **23,5** | Eles têm o dobro de detalhe fino: cidade fotogramétrica, nuvens texturizadas, chuva. |
| Colorido mediano | 17 | 6,6 | Eles são quase monocromáticos (cinza-azulado) e só pontuam com vermelho e azul. Nós espalhamos bege, azul e vermelho. |

**Conclusão:** a diferença está na **imagem**, não na montagem. O que faltou foi luz, faixa tonal, detalhe, materiais e atmosfera.

## 2. Defeitos encontrados no nosso vídeo, com instante

### A. Imagem (render e look)
1. **Faixa tonal clara e lavada:** céu e chão bege ocupam a maior parte dos quadros. Não há pretos nem gradação de cor (grading).
2. **Chão bege infinito com horizonte duro** (0:47, 1:18, 3:40, 7:52). O mundo parece uma maquete num vazio. Eles usam um mar de nuvens, a cidade ou o preto.
3. **Nuvens em bolas** (0:00, 1:03, 2:21, 2:37, 5:30, 9:58). É geometria de esferas, já reprovada em 02/11. No mergulho (5:30, a 24 fps) elas **encobrem o avião** por 2 s seguidos.
4. **O rastro do avião parece uma asa gigante** (0:47, 1:18, 1:50, 2:06, 7:52, 8:24, 8:40, 9:43). A fita do rastro sai da ponta da asa, larga e opaca, e se lê como uma asa deformada. É defeito recorrente.
5. **Avião de plástico fosco:** branco chapado com cauda azul, sem reflexo de ambiente, sem metal, sem vidro nas janelas e sem luz de navegação. O deles tem pintura metálica com reflexo do céu, janelas escuras e luzes vermelha e verde.
6. **Sem sol, sem sombra e sem brilho especular.** A luz é só ambiente.
7. **O avião aparece pequeno e longe** em quase todo plano (0:47, 1:34, 3:40, 4:12, 9:11, 10:14). Eles colam a câmera na fuselagem e na asa (0:18, 3:01, 3:37, 4:13), com o mar de nuvens passando embaixo. Isso dá velocidade e perigo.
8. **Bairro com caixas OSM cinzas sobre bege** (0:15, 7:05, 9:27), quase parado e visto de cima. O deles é uma cidade fotogramétrica oblíqua (6:02, 6:20, 7:15, 8:09, 9:04), com coluna de fumaça volumétrica alta.
9. **Fumaça do impacto** em pufes pretos pequenos (7:21, 9:27). A deles é uma coluna alta e escura.
10. **Chuva:** a nossa são riscos brancos sobre cinza liso (0:17, 9:11). A deles tem riscos sobre nuvem com profundidade.

### B. Gráficos e tipografia
11. **HUD poluído:** caixa de relógio, descida em vermelho, altitude em azul, segundos de queda, frase e rótulo, tudo junto (5:15, 5:30, 6:02, 6:18). A fonte é mono grande, em vermelho e azul sobre fundo claro. Eles mostram **dois números brancos pequenos** (altitude e descida) com rótulo em versalete e nada mais.
12. **Cartões de documento brancos sobre fundo cinza-claro** (1:00, 2:53, 8:55): branco sobre branco, letra pequena, baixo contraste.
13. **Rótulos fantasma e semitransparentes** ("North Eleuthera" 1:50, "27 min" 2:21, "SEGUÍA VOLANDO" 6:33, "EL MARGEN ES ESTRECHO" 9:11).
14. **Diagrama de ADS-B** (5:46): linha pontilhada fina num papel branco. O deles é um mapa de satélite escuro com uma rota azul limpa e pontos brancos (2:07, 6:39, 7:51).
15. **Torres "70 pisos"** (3:24): prédios brancos sem textura sobre bege, um diagrama de maquete.

### C. Recursos de narrativa que eles têm e nós não
16. **Áudio real do controle aéreo** com onda sonora e transcrição em karaokê ("PILOT · minutes before 12:48 p.m. ET"). É a assinatura deles e prende a atenção. Nós escrevemos a fala do rádio em cartão.
17. **Telas pretas de capítulo com uma frase** ("Registered in Delaware", "Smoother air", "240 mph, straight down"). Funcionam como respiro e ênfase.
18. **Encerramento:** "In memory of the nine people aboard". Tom de respeito.

## 3. Causas no pipeline (por que isso sai assim)

1. **Motor de render:** o Tracer3D 2.0 desenha em three.js dentro do Remotion. Céu, nuvem, chão e cidade são primitivas do kit (`Tempestade`, `Bairro` OSM, `KarteWeiss.terra`). Ali não há nuvem volumétrica, iluminação por HDRI no avião, sombra suave nem grading. A qualidade fica presa ao kit procedural.
2. **Assets:**
   - avião CC-BY sem material PBR trabalhado;
   - cidade por OSM extrudado, porque a rota de geo vetou o Google 3D Tiles e o Cesium ion (decisão de 03/11);
   - nenhuma nuvem VDB nem fumaça simulada.
3. **Os portões medem a mistura, não a imagem.** O `plano.py` confere a porcentagem de 3D, cartão e mapa e o número de cartões seguidos. Não confere a faixa tonal (pretos), o tamanho do objeto no quadro, a oclusão, o detalhe nem a legibilidade do texto. Por isso um vídeo lavado passa.
4. **Sem comparação com a referência.** O batedor aprovou stills isolados, nunca lado a lado com o Reconstructed. A regra entrou no CLAUDE.md (portão 3) depois deste vídeo.
5. **Meta de velocidade:** o vídeo foi feito em 1 h 17 contra a régua de ≤ 2 h. O tempo foi para a esteira, não para o look.
6. **Revisão por folha de miniaturas:** quadros pequenos escondem rastro em forma de asa, rótulo fantasma e avião encoberto.

## 4. O que muda (proposta)

- **Look de referência fixo:** paleta cinza-azulada escura, preto de verdade, dois números de HUD, telas pretas de frase. Fica numa folha de estilo a partir de quadros do Reconstructed.
- **Planos-herói no Blender (EEVEE/Cycles na G4):**
  - avião com material metálico e HDRI de tempestade;
  - câmera colada (chase) sobre um mar de nuvens VDB, com prontos CC0 ou CC-BY a levantar;
  - fumaça simulada.

  O Remotion fica para HUD, mapa e montagem.
- **Cidade:** decisão do Eduardo. Ou seguimos com dados públicos (ortofoto + OSM com textura), ou aceitamos o Google Earth Studio ou o 3D Tiles com crédito na descrição.
- **Rádio:** decisão do Eduardo em 03/11: **sem áudio real de ATC ou caixa-preta**. A fala do rádio entra só como texto na tela ou na narração.
- **Portão de imagem automático no `plano.py`/folha:**
  - luminância p10 < 40 no conjunto;
  - objeto principal ≥ 20% da altura do quadro nos planos-herói;
  - texto com opacidade final ≥ 0,9;
  - comparação lado a lado com a referência.
