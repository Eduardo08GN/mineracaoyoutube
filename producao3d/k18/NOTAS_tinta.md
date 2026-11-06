# NOTAS da frente `tinta` (K18 Königgrätz): kit de tinta, HUD global, `telegrama` e `fim`

06/11/2026. Dono de: `src/tinta/` (todo), `src/Video.tsx`, `src/cenas/telegrama.tsx` + `telegrama/`, `src/cenas/fim.tsx` + `fim/`.

## 1. Kit de tinta (`src/tinta/index.tsx`): API final

As assinaturas e props originais ficaram **intactas**; só entraram props opcionais e exports novos. O cabeçalho do arquivo repete esta tabela.

| Export | Props (+ = opcional novo) | Implementação |
|---|---|---|
| `COR`, `FONTE`, `prog`, `saida`, `fmtDe`, `Folha` | iguais | `FONTE.tegaki` novo (= IM Fell Italic) |
| `Papel` | `+textura=true` | papel assado `public/papel/papel_k18.jpg`: base creme × fibras **ambientCG Paper001** × amassado leve **Paper003** (ambos **CC0**, ambientCG.com) × grão estático. Ferramenta: `D:/tmp/k18_tinta/papel.py` |
| `GraoPapel` (novo) | `opacidade=0.55` | fibra do papel em soft-light por cima de cena 3D (`public/papel/grao_k18.jpg`) |
| `Escrita` | `t t0 texto x y tam cor ancora vel ate fonte rot peso` `+pena=1` `+contorno=true` | **tegaki 1.1.0** traço a traço, pontas afinando (`taperPlugin`). Pacote IM Fell English Italic **regenerado completo** (107 glifos: a–z, A–Z, 0–9, äöüÄÖÜß, pontuação, „“ – — … ° × §) em `src/tinta/imfell_it` (o anterior só tinha 36 letras). O SMIL do tegaki é **avaliado em JS** (dashoffset pela curva `keySplines`, opacidade pelo `begin`): determinístico por t, sem animação do navegador. Ritmo natural do tegaki escalado para durar `texto.length / vel` s. Ids de máscara prefixados por instância (`useId`). A tinta é recortada pelo contorno real das letras (clipPath com `IMFeENit28P.ttf` sem kerning/ligaduras: o layout do tegaki é por avanço). `fonte` ≠ Fell (romana, Garamond) → revelação por pena com borda macia |
| `Guia` | `+larg=1.7` | linha a pena (perfect-freehand), termina em gota de tinta |
| `Traco` | `+pressao=true +grao=true +semente` | **perfect-freehand 1.2.3**: pressão de pena (ataque leve, barriga, alívio) presa ao comprimento TOTAL (o traço não "respira" enquanto cresce); ponta de seta com farpas que segue a ponta; tracejado = traços de pena; grão de tinta por feTurbulence+feDisplacement (método do `brush` do **Remocn**, MIT) |
| `Rotulo` | igual | Escrita (tegaki) + Guia |
| `Numero` | `+sublinhado=false` | algarismos de época (IM Fell Roman, old-style), tinta que "assenta" ao parar; `sublinhado` passa um traço de pena |
| `Bloco` | `+sombra=true` | Brockhaus: cheio, filete claro interno, sombra de contato; **perda = hachura que esvazia o bloco pela retaguarda**; nome sempre de pé |
| `larguraTexto(texto,tam)`, `duracaoEscrita(texto,vel)` | novos | diagramação |
| `penaPath(pontos, {largura, inicio, ate, pressao, afina, afinaFim, semente})` | novo | contorno (path d) de pena para desenhar a tinta sem animar |
| `hash01(s)` | novo | hash determinístico |

Notas de uso:
- Texto com caractere fora do pacote: `→ ←` viram `-`, `≈` vira `~`; o resto vira `·`. Para mais glifos: regenerar com o gerador do tegaki (`D:/tmp/levant_k18/tegaki_src/packages/generator`, `bun ... generate --font-file IMFeENit28P.ttf --chars "..."`) e acrescentar o espaço (`" ": {w: 431}`) no `glyphData.json`.
- Custo: ~20 ms na 1ª vez de cada texto (cache por texto); por quadro só se monta a string.

## 2. HUD global (`src/tinta/hud.tsx`, montado em `src/Video.tsx`)

Função pura do quadro global. `Video` aceita `--props='{"soHud":true}'` (só papel + HUD, para depurar sem as cenas).

- **Relógio de bolso a tinta** (x 60–760, y 50–330): a caixa se traça a pena, os ponteiros correm com `horaDe(beat,u)`. Data e hora escritas pelo tegaki ("3. Juli," + "11.30 Uhr"). Os algarismos da hora **se reescrevem quando mudam** (o „Uhr“ fica parado), num passo de 1, 5, 10, 15, 30 ou 60 min que nunca reescreve mais de 1× por 0,45 s. Por trás há um fundo de papel macio, para o HUD ler sobre mapa ou 3D (o lugar tem o mesmo fundo). **Régua do dia** (0–24 h) que se enche de tinta até a hora atual. Nas batidas só com data (`d0/d1`), é uma régua da campanha (22.6. → 4.7., ou até agosto) e os ponteiros giram os dias.
- **Vivo:** entra quando a batida tem hora e some ao fim do trecho com hora. Com a hora parada há mais de 4 s, vai a **lápis** e encolhe para 80 %. Volta à tinta quando a hora mexe ou salta.
- Horas fora do plano:
  - família `telegrama`, horas do dossiê: 1/7 11:30 para o pedido e 14:10 para a resposta (ÖK III p. 228);
  - b009/b013/b035, onde o plano traz 00:00 de placeholder: espelho das horas próprias da cena `campo` (`campo/receitas2.tsx`). **Se o campo mudar essas horas, atualizar `HORA_BEAT` no hud.**
- **Lugar:** canto superior direito, `nome_1866` de `dados/lugares.json` via `beat.reg`, sem o parêntese. Para regiões sem ponto há uma tabela: gesamt = "Schlachtfeld von Königgrätz", bistritz = "An der Bistritz", route = "Gitschin – Königinhof" etc. Escrito e com fio de pena; reescreve quando o `reg` muda.
- **Legenda:** `src/tinta/legendas.json`, gerada por `python -I src/tinta/gerar_legendas.py` a partir de `plano.legendas` + `../voz/alinhamento.json`:
  - blocos de ≤ 2 × 42 caracteres, quebrados em pontuação, com o tempo das palavras;
  - **números da TTS → numerais/datas**; a tabela completa das 52 conversões está em `src/tinta/legendas_tabela.tsv`, conferida com o `skript_de.md` e o dossiê: "Dritter Juli achtzehnhundertsechsundsechzig" → "3. Juli 1866", "elf Uhr" → "11 Uhr", ≥ 13 em algarismos com ponto de milhar, anos sem ponto, "dreieinhalb" → "3,5", 1–12 por extenso fora de hora/data;
  - EB Garamond 42 px sobre uma faixa de papel de borda macia.
- Marca `@Kriegsmomente` discreta, embaixo à direita, em lápis.

## 3. Família `telegrama` (b025, b027–b031)

Método do telégrafo do K15: um modelo, uma entrada, a peça que trabalha em acento.

- **Estação de Benedek em 3D desenhado:** `telegrama/estacao.tsx`. O `TasterMorse` e o `Farbschreiber` foram **copiados** de `k17_v2/v1/src/kit/desenhados/telegrafo.tsx` + `estilo.tsx`, com a facção `acento` e `corMarca` acrescentadas. A tecla bate o Morse real do texto e a fita grava os pontos e traços da resposta. A câmera é função de t.
- **Linha telegráfica a tinta** Königgrätz → Wien:
  - coordenadas reais, projeção de escala verdadeira;
  - traçado esquemático ao longo da ferrovia de 1845–49;
  - postes, Elbe e Donau;
  - régua tracejada **226 km em linha reta** (haversine).
  
  Os **pulsos laranja descem a linha** a cada toque no envio e **sobem** na resposta.
- **Formulários que se escrevem na fala** (tempos de `../voz/alinhamento.json`, gravados em `telegrama/palavras.json`), com textos **literais do ÖK III p. 228**:
  - **pedido (~11.30 Uhr):** „Bitte Euere Majestät dringend, um jeden Preis den Frieden zu schliessen; Katastrophe für Armee unvermeidlich.“ O traço de acento cai sob „unvermeidlich“;
  - **resposta Nr. 3020 (14.10 Uhr):** „Einen Frieden zu schliessen unmöglich. Ich befehle – wenn unausweichlich – den Rückzug in grösster Ordnung anzutreten.“ e a pergunta „Hat eine Schlacht stattgefunden?“ em acento, sublinhada.
- **b025 (Benedek):** nome e posto escritos, régua 1859 (Solferino, „Held aus Italien“) → 1866 (Kommando der Nordarmee). A seta de acento **treme e recua** em „widerwillig“.
- **Anti-poluição:** quando chega a resposta, o formulário 1 e o mapa vão a lápis; quando a pergunta se escreve, o corpo da resposta vai a lápis.
- **Câmera:** dolly 2D contínuo (Catmull-Rom entre pontos-chave, nunca para) que segue a peça ativa.
  - **Recomposta em 06/11 (pedido do maestro):** em v_b031 o formulário 1 saía cortado em cima e os 40 % de baixo do quadro ficavam vazios.
  - **Regras agora:** nada essencial cortado; o que fica à esquerda de x 770 fica abaixo de y 330 (zona do relógio); tudo termina acima de y ~890 (zona da legenda).
  - **Enquadramento por batida:** b027 mostra estação, linha e formulário 1 juntos; b028 mostra o formulário 1 com o mapa inteiro; b029–b031 mostram os dois formulários e a pergunta inteiros, com push lento de 1,00 a 1,03.
  - **Mapa:** desceu 40 px (MY0 = 440).
  - **Conferência:** `D:/tmp/k18_tinta/checa.py` projeta as caixas de cada peça (estação, mapa, formulários, pergunta, cartões) em u = 0,3 / 0,6 / 0,97 de todas as batidas de telegrama e fim e confere borda, zona do relógio e zona da legenda. Todas passam. Stills `D:/tmp/k18_tinta/r_*.jpg`.
- **HUD nessas batidas:** o relógio mostra „1. Juli, 11.30 Uhr“ e depois „14.10 Uhr“ (tabela `HORA_FASE` no hud). Isso vale para linha_wien, pedido, resposta, rueckzug e frage. b025 fica sem relógio.

## 4. Família `fim` (b155–b159, b162)

- **Três cartões de tinta** que se escrevem na fala (tempos em `fim/palavras.json`), cada um com o selo a pena (✓, ≈, ?), o número, um gesto que demonstra e a fonte em lápis no rodapé (sem licença):
  - **GESICHERT (b155–b156):**
    - barras a pena 250 × 42 canhões às 11 Uhr e „≈ 6 : 1“ em acento (GSW; CRÍTICA C.2);
    - „alle gezogen“ com as raias se desenhando no tubo;
    - os blocos **IV. e II.** saem da linha tracejada (Bloco Brockhaus) e a deixam vazia;
    - „Chlum fällt 14.45 Uhr“ („2¾ Uhr“, GSW/ÖK);
  - **BERECHNET (b157):** silhuetas frontais em escala (1 m = 120 px), em pé ≈ 0,65 m² e deitado ≈ 0,13 m², hachuradas; a seta de acento passa de uma à outra e nasce „etwa 5-fach“ (CRÍTICA C.6: 0,65 ÷ 0,13 = 5,0). Fonte: „eigene Rechnung, Frontalfläche“;
  - **UMSTRITTEN (b158–b159):** uma balança **que não assenta** (Strategie × Waffe, oscilação pura de t). Com Wagner („Zündnadelgewehr ‚unschätzbar‘, aber ‚keineswegs die Hauptursache‘“, 1889) ela pende para a estratégia e o prato fica em acento, mas continua oscilando.
- **Só o cartão ativo** fica em tinta cheia; os outros vão a lápis.
- **b162 (frage):** „Welches dieser drei Dinge hat für dich den Ausschlag gegeben?“ (a fala, com a concordância corrigida). Os três „Dinge“ se desenham vivos: a rota noturna com o cavaleiro andando, o Swiepwald adensando, o soldado deitado com a mira respirando. Cada um tem número, nome e uma caixinha de acento para a resposta. Embaixo, „Schreib es in die Kommentare.“
- **Câmera:** dolly 2D contínuo que vai do cartão 1 ao 3 (Catmull-Rom). Em b162 a pergunta desceu para y 380 e o push vai até 1,05, para não entrar na zona do relógio nem na da legenda (conferido pelo `checa.py`).

## 5. Problemas conhecidos

- **Ambiente lento (06/11):** com as outras frentes renderizando, o D: copia ~10 MB/min e cada `remotion still` a partir de `src/index.tsx` rebundla e copia os 98 MB do `public` (5–15 min). Usei um bundle pronto: `npx remotion bundle src/index.tsx --out-dir=D:/tmp/k18_tinta/bundle` e depois `npx remotion still D:/tmp/k18_tinta/bundle Teste ...`. O cache do webpack é compartilhado pelo link `node_modules` e falha com EPERM/ENOENT quando as frentes bundlam ao mesmo tempo (só aviso).
- **Legenda ≤ 17 cps:** 22 dos 246 blocos passam de 17,5 cps, porque nesses trechos a própria TTS fala mais rápido que 17 cps; o máximo é 21,6. O gerador adianta o bloco até 0,3 s e estica o último no silêncio, mas não atrasa a legenda em relação à fala. A lista sai no console do `gerar_legendas.py`.
- **Glifos do tegaki:** `≈ ~ → ←` não estão no pacote. Na Escrita viram substitutos; para „≈“ use `fonte={FONTE.fellRom}` (revelação por pena).
- **HORA_BEAT** no hud espelha as horas próprias do `campo` (b009 11:00; b013 06→15; b035 06:00). Se o campo mudar, atualizar.
- **Linha telegráfica:** o traçado ao longo da ferrovia Pardubitz–Brünn–Lundenburg é **esquemático**. O dossiê não dá o caminho real do fio, por isso só Königgrätz e Wien são nomeados. Os 226 km são linha reta (haversine), não comprimento de fio.
- **Formulários:** os cabeçalhos („Telegramm an den Kaiser“, „FZM Benedek“, „Antwort aus Wien“, „Nr. 3020“) são desenho de época, não fac-símile. O corpo é literal do ÖK III p. 228.
- **Legenda** em EB Garamond (romana), não em Fell itálica, por legibilidade a 42 px. Se o Eduardo quiser tudo em Fell, é só trocar `FONTE.garamond` por `FONTE.fellRom` em `Legenda`.
- **`Escrita` `peso`/`pena`:** só engrossam a pena dentro do contorno da letra; não existe negrito de verdade (a Fell não tem).
- **Desempenho:** uma Escrita longa monta ~100–300 KB de SVG por quadro (innerHTML). Com até ~10 rótulos por tela fica bem abaixo de 1,5 s, mas não medi a 1080p com a máquina livre.
- **b025:** no começo da batida, a estação 3D fica cortada na borda esquerda; é proposital, como estabelecimento, e o dolly a traz para dentro.

## Vitrine (stills para o maestro)

| # | Onde | Por quê |
|---|---|---|
| 1 | `telegrama` **b031, u = 0,97** | resposta Nr. 3020 escrita, „Hat eine Schlacht stattgefunden?“ em acento e sublinhada, pulsos subindo a linha Wien → Königgrätz, HUD „1. Juli, 14.10 Uhr“ |
| 2 | `telegrama` **b027, u = 0,85** | estação 3D com a tecla em acento batendo Morse, fio até a linha, postes, Elbe/Donau, régua de 226 km e pulsos descendo para Wien |
| 3 | `fim` **b157, u = 0,97** | cartão BERECHNET com as silhuetas em escala (0,65 × 0,13 m²) e „etwa 5-fach“ nascendo entre elas; GESICHERT a lápis ao lado |
| HUD | `Video` **--frame=8640** (t = 288 s, b044 Bistritz 06:30 → 07:15, cena campo) | relógio correndo, hora se reescrevendo, régua enchendo, „An der Bistritz“ e legenda sobre o mapa vivo |

Stills de depuração: `D:/tmp/k18_tinta/` (`v_*.jpg`, `w_*.jpg`, `hud_*.jpg`, `video_8640.jpg`).
