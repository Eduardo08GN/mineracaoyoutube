# Auditoria de fidelidade, vídeo 4: "¿Qué pasaría si pesaras cada vez más y no pudieras parar?"

**Como auditei:** li todas as folhas (4 gerais e 18 densas), `capitulos.md`, `graficos.png` e os dois JSON de som. Também extraí 55 quadros em resolução cheia do `comparativo.mp4` nos momentos-chave e li `roteiro.ts`, `Cena.tsx`, `Video.tsx`, `fisica.ts`, `mundo/Buraco.tsx` e `legendas.json`. Não editei nenhum arquivo do projeto. Os quadros extraídos ficaram em `C:\Users\edlut\AppData\Local\Temp\claude\C--Users-edlut-mineracaoyoutube\269fb63e-6731-4a16-b780-bceeefcac449\scratchpad\c4\`.

## Visão geral

**O que está bom:**
- Os tempos dos capítulos batem com o original.
- As legendas entram e saem no tempo certo em quase todo o vídeo (diferença de até ~0,5 s).
- Os valores do painel coincidem, em kg e toneladas métricas, quase o tempo todo.
- Os capítulos Lua, Sol e Vía Láctea estão com o enquadramento parecido.

**O que denuncia que é outro vídeo:**
1. **Cor.** A saturação média é 176 contra 76 do original. No espaço chega a 230–250 contra 50–70, ou seja, 3 a 4 vezes mais.
2. **Buraco negro.** A forma, o tamanho e a cor estão errados, e o clímax final (a sombra engolindo a tela) não existe.
3. **Cenas cortadas ou trocadas:**
   - o vidro estilhaçando aos 0:17;
   - a parede do tsunami engolindo a câmera aos 2:07–2:09;
   - a Terra afundando dentro do disco aos 2:33;
   - o clarão do Sol colapsando aos 4:22.
4. **Elementos que o original não tem:** 7 galáxias voando aos 5:27–5:49, a Lua esticada como charuto e um fio de partículas saindo do Sol.
5. **Som:** é música contínua do começo ao fim, cerca de 7 dB mais alta, sem os momentos de silêncio, sem o som do mar e com uma falha de áudio aos 2:54–2:57.

**Sobre o buraco negro (a pergunta específica):** o original **não** usa lente gravitacional nem disco relativístico. Não há arco do disco por cima da sombra nem lado mais claro por efeito Doppler. É um disco **estilizado e chapado**, assim:
- **Planos médios (2:33–5:49):** miolo creme quase branco, ranhuras concêntricas finas e de baixo contraste (como um disco de vinil), borda laranja suave com brilho difuso.
- **Esfera:** preta, com a faixa escura do disco passando na frente dela (visual de Saturno). De 3:50 a 4:30 aparece um anel de fótons como um círculo fino e brilhante.
- **Closes (0:00–0:04 e 5:49–6:03):** disco bege/castanho com riscos escuros de movimento. Anel de fótons grosso com halo luminoso, e a sombra vira uma elipse preta "furada" no plano do disco.

No produzido, o disco é um alvo de anéis senoidais laranja/amarelo muito saturado com centro branco estourado. O anel de fótons é um traço fino e duro desenhado por cima de tudo, sem brilho e sem a elipse da sombra. Nos planos médios, o disco tem cerca de 40 a 60% do tamanho do original.

---

## Capítulo a capítulo

### intro (0:00–0:04)
1. **Cinematografia.**
   - Original: o disco é visto quase rasante e a câmera **avança** (zoom +0,58). A sombra cresce até cobrir a tela inteira em 0:03.9.
   - Produzido: câmera praticamente parada (zoom +0,10).
   - **ALTA.**
2. **Montagem.**
   - Original: o preto da sombra serve de "cortina" e há um corte seco para Chicago em 0:04.0.
   - Produzido: mergulho ao preto de 0,25 s em 0:04.0, e a cidade aparece escura.
   - **MÉDIA.**
3. **Ações.** O original é uma antecipação do plano final, com a câmera sendo engolida. O produzido é um disco estático girando. **ALTA.**
4. **Acabamento.**
   - Original: disco bege/cinza dessaturado (saturação 83) com riscos escuros, anel grosso e luminoso.
   - Produzido: laranja estourado (saturação 194), anéis em senoide, esfera pequena, anel fino.
   - **ALTA.**
5. **Texto.**
   - Original: "In 5 minutes…" em serifa itálica grande, sobre a sombra preta, legível a partir de 0:00.5.
   - Produzido: fonte menor, sem itálico, centrada exatamente sobre o miolo branco do disco. A partir de 0:01 fica praticamente ilegível.
   - **ALTA.**
6. **Som.** O original tem música mais um estrondo/vento (fogo 0,22, veículo 0,24). O produzido tem só música. **BAIXA.**

**Correção:**
- Em `roteiro.ts`, intro: `cam` de `[0,0.42,2.6]` até cerca de `[0,0.12,0.4]` com aceleração no fim (`Easing.in`), para a sombra ocupar a tela em 3,9 s.
- Usar a versão "close bege" do shader (ver o desvio nº 2 da lista final).
- Em `Video.tsx`, não aplicar o mergulho ao preto na saída da intro (`muda=false` quando `ant.id==='intro'`).
- Posicionar o texto em `top: 40%`, sobre a sombra.

### mirador (0:04–0:18)
1. **Cinematografia.**
   - Original: começa olhando cerca de 25° abaixo do horizonte, com o horizonte em y≈0,3 e céu nublado. Faz uma **inclinação contínua para baixo** e chega em 0:13 olhando quase na vertical **através do piso de vidro**, com arestas ciano translúcidas e o rio embaixo. Movimento 0,81 px/quadro.
   - Produzido: câmera fixa em vista oblíqua para o lago, horizonte no alto, 0,24 px/quadro. Nunca chega à vista vertical.
   - **ALTA.**
2. **Montagem.** O original corta em 0:17.2–0:17.5 quando o vidro estoura. O produzido não corta. **MÉDIA.**
3. **Ações.**
   - Original: de 0:17.2 a 0:18 o vidro estilhaça em cacos triangulares **brancos** que explodem na parte de baixo.
   - Produzido: nada acontece até 0:18. Os cacos só aparecem depois, na queda, e são **pretos**.
   - **ALTA.**
4. **Acabamento.**
   - Original: cidade de prédios baixos e variados, cinza/branco/pastel, telhados verdes e azuis com caixas de ar-condicionado.
   - Produzido: "floresta" de torres altas, azul e ferrugem saturados, com grade de janelas uniforme.
   - Produzido: tem uma **nuvem branca enorme dentro da moldura do vidro** (canto inferior direito, de 0:04 a 0:20) e moldura preta grossa. O original não tem moldura preta; as arestas do vidro são ciano.
   - **ALTA.**
5. **HUD e títulos.**
   - Título do original: "What If You Got Heavier…" em serifa reta, semitransparente, de ~0:04.3 a ~0:07.0. Título do produzido: de 0:05.2 a **0:10.5**, cerca de 3,5 s a mais e sobreposto à legenda de 0:07–0:10. **MÉDIA.**
   - Comparação errada: aos 0:13 (1.327 kg) o produzido ainda diz "TANTO COMO UN ADULTO". O original diz "HEAVIER THAN A GRAND PIANO" aos 0:13 e "…A CAR" aos 0:14.5. **MÉDIA.**
   - "Y SIGUES GANANDO PESO" aparece desde 0:04. No original, "AND STILL GETTING HEAVIER" só aparece por volta de 0:11. **BAIXA.**
6. **Som.**
   - Original quase em silêncio: −29 dB, só vento, sonar e ruído branco, música 0,07.
   - Produzido: música cheia a −16 dB, ou seja, +13 dB, e a tensão se perde.
   - **ALTA.**

**Correção:**
- Câmera: alvo de `[260,0,-760]` para `[2,0,-4]` ao longo de 4→16 s, chegando à vista vertical.
- Fazer `mirador.e=17.2` e acionar os cacos (`cacos`) em 17.2 com material branco/azul-claro e `opacity 0.8`.
- Remover nuvens abaixo de cerca de 600 m.
- Em `CidadeAlto`: escala de altura × 0,4 e paleta dessaturada (cinza #c9ccd2, branco, um pouco de tijolo #9a6b5e).
- Título entre 4.3 e 7.0 s, em `num` (sem itálico).
- Música −12 dB entre 4 e 16 s.

### queda (0:18–0:27)
1. **Cinematografia.**
   - Original: queda com giro (pan −0,84), passando rente às fachadas, com fundo em degradê escuro em 0:22–0:24. Movimento 2,23.
   - Produzido: olhar fixo para baixo com lente aberta e torres convergindo radialmente. Visual de "cânion", diferente do original.
   - **MÉDIA.**
2. **Montagem.**
   - Original: fusão de cerca de 0,2 s para a praça em **0:26.0–0:26.2**.
   - Produzido: de 0:25.8 a 0:27.0 a tela fica **azul-escura vazia com cacos pretos** (1,2 s de tela morta), depois mergulho ao preto e praça em 0:27.0, com cerca de 1 s de atraso.
   - **ALTA.**
3. **Ações.** Os cacos do original são brancos e ficam para trás. Os do produzido são pretos e ficam na frente. Em 0:20 ainda aparece a nuvem dentro do quadro. **MÉDIA.**
4. **Acabamento.** O mesmo problema de cidade saturada e torres altas do capítulo anterior. **MÉDIA.**
5. **HUD.** A curva do peso diverge de 0:24.9 a 0:27.9:

| Tempo | Original | Produzido | Situação |
|---|---|---|---|
| 0:25.0 | 302.374 t | 7,7 millones | produzido adiantado |
| 0:25.7 | 4,3 million | — | o original salta ×5 a cada 0,1 s |
| 0:26.6 | 11,2 trillion | 2,9 billones | produzido atrasado |
| 0:27.3 | 173 quintillion (~1,6·10²⁰ t) | 40 mil billones (4·10¹⁶) | atraso de cerca de 4.000× |

   No original a "LOCALIZAÇÃO" continua "CHICAGO, THE LEDGE" até 0:26; o produzido muda para "CHICAGO" em 0:18. As comparações elefante, jumbo e Torre Eiffel não existem: o produzido mostra "MÁS DE LO QUE AGUANTA EL CRISTAL" de 0:15 a 0:26, texto que o original não tem. **MÉDIA.**
6. **Som.** O original mistura música e estalos. O produzido tem ronco de "veículo" contínuo, 8 dB mais alto. **MÉDIA.**

**Correção:**
- `queda.e = praca.s = 26.1`.
- Trocar o mergulho ao preto por fusão (ver o desvio nº 8).
- Em `fisica.ts`, inserir em `PONTOS`: `[25.6, 622381*TON]`, `[26.0, 588e6*TON]`, `[26.6, 11.2e12*TON]`, `[26.7, 13e18*TON]`, `[27.0, 89.1e18*TON]`, `[27.3, 173e18*TON]`.
- Trocar `COMPARA` por uma tabela por tempo copiada do original: adulto → piano de cola (~0:12) → coche (~0:14) → elefante (~0:17) → jumbo (~0:19,5) → Torre Eiffel (~0:22,5) → Everest (~0:26) → Luna → Tierra.

### praca (0:27–1:26)
1. **Cinematografia.** Os dois são estáticos.
   - Original: câmera mais alta, cerca de 25 m, olhando ~20° para baixo; o piso ocupa 2/3 da tela.
   - Produzido: câmera mais baixa, cerca de 11 m; o piso ocupa metade. Composição 0,36.
   - **MÉDIA.**
2. **Montagem.** Plano único nos dois. Entrada com mergulho ao preto em 0:27 (ver capítulo anterior).
3. **Ações.**
   - **Pessoas caindo.** No original as pessoas já estão caídas em massa por volta de 0:50–0:56. No produzido a maioria ainda está em pé em 0:56, e as quedas vêm em 1:00–1:08. **MÉDIA.**
   - **Postes e árvores.** "Trees snap. Cranes fold." Em 0:56 o original mostra postes pretos tortos e árvores inclinadas. No produzido as árvores continuam intactas até o fim e não há postes. **MÉDIA.**
   - **Desabamento e poeira.** No original, de 1:10 a 1:25 nuvens de poeira volumétricas rolam pela praça e os prédios da esquerda caem por volta de 1:15. No produzido, os prédios viram **silhuetas bege chapadas como papelão** sob céu azul (1:20–1:26), com "poeira" em retângulos. **ALTA.**
4. **Acabamento.**
   - Original: luz de fim de tarde quente e lateral, piso de lajotas com anéis concêntricos e raios, chafariz com jato central alto, árvores verde-oliva com tronco.
   - Produzido: luz chapada de meio-dia, piso **roxo-acinzentado liso**, chafariz pequeno, árvores **icosaedros verde-neon** sem tronco visível, fachadas laranja/vermelho saturadas com janelas pretas.
   - **ALTA.**
5. **HUD e legendas.** Legendas no tempo certo. O número longo ("17,5 mil trillones de toneladas") ocupa cerca de 75% da largura e passa por cima dos prédios. **BAIXA.**
6. **Som.**
   - Multidão: OK (gente 0,34 contra 0,24).
   - Estrondos: o original tem estalo e explosão em 1:12, 1:18 e 1:20 a cerca de −16 dB. O produzido tem uma "Eruption" em 1:08 e ruído de −6 a −9 dB entre 1:08 e 1:24, cerca de 15 dB mais alto.
   - **MÉDIA.**

**Correção:**
- `cam` y 11→26 com alvo mais baixo.
- Textura de canvas para o piso (grade e dois anéis escuros).
- Árvores: `#556b2f`, `flatShading`, escala 0,7, tronco visível.
- Luz direcional baixa `#ffd2a0` e céu em degradê quente.
- Poeira: cerca de 200 sprites de textura radial suave (reaproveitar `texBrilho`), em vez de planos.
- Desabamento: escalar Y dos prédios para 0, sem trocar o material para bege.
- Antecipar `caidos` para `smooth(44, 56)`.

### miami (1:26–2:00)
1. **Cinematografia.**
   - Original: aéreo oblíquo com a costa na diagonal (o produzido acerta essa diagonal), mas com deriva e inclinação (pan −0,23). De cerca de 1:50 a 2:00 a câmera **desce e inclina até o nível do chão**, olhando o horizonte.
   - Produzido: aéreo fixo (0,12) até 2:00.
   - **ALTA** (por causa da descida que falta).
2. **Montagem.**
   - Original: fusão de 0,2 s em 1:26.0.
   - Produzido: mergulho ao preto em 1:26.0.
   - **MÉDIA.**
3. **Ações.**
   - Original: o mar recua até sair do quadro (1:53) e o fundo seco vai até o horizonte.
   - Produzido: o mar continua ocupando o terço superior direito o tempo todo; o recuo parece pequeno.
   - Em 1:58 o produzido já mostra o mar de volta na praia. O original ainda mostra fundo seco, coerente com "Then it all comes back" (a onda ainda vem).
   - **ALTA.**
4. **Acabamento.**
   - Água: o original é azul-esverdeado profundo com reflexos e sombras de nuvem; o produzido é turquesa chapado.
   - Fundo do mar: o original é manchado de forma natural, com algas verdes e poças; o produzido é bege com **elipses coloridas como bolinhas de tecido**.
   - Prédios: o original tem hotéis com piscina na cobertura; o produzido tem torres genéricas.
   - **MÉDIA/ALTA.**
5. **HUD e legendas.** OK.
6. **Som.**
   - Original: mar, ondas e ruído rosa (água 0,22, chegando a 0,71 em 1:46).
   - Produzido: **nenhum som de água**, só ronco de "veículo".
   - **ALTA.**

**Correção:**
- Recuo `-14 - recua*420` → `*1500`.
- Água `#1d4f6b` com plano de sombras de nuvem (ruído multiplicado).
- `FundoMar` com ruído em dois tons e manchas verdes, sem elipses.
- Adicionar ao capítulo chaves de câmera descendo até cerca de 3 m de altura entre as frações 0,7 e 1.
- Colocar um loop de ondas/arrebentação de 1:26 a 2:08.

### tsunami (2:00–2:08)
1. **Cinematografia.**
   - Original: a mesma câmera, já ao rés do chão, sobre o fundo seco, encarando o horizonte (movimento contínuo, zoom +0,30).
   - Produzido: **corte seco** em 2:00 para a beira da praia, com câmera parada.
   - **ALTA.**
2. **Montagem.**
   - Original: em 2:08.0–2:09.2 a câmera é **engolida pela onda** (água turquesa, raios de luz) e há fusão para a Terra em 2:09.3–2:10.
   - Produzido: mergulho ao preto em 2:08.0 direto para a Terra.
   - **ALTA.**
3. **Ações.**
   - Original: a parede de água cinza-turquesa com colunas de espuma cresce de uma linha (2:02) até cerca de 40% da altura da tela (2:07). Ninguém aparece.
   - Produzido: **pessoas andando em água rasa turquesa**. O "tsunami" é uma linha branca e depois uma faixa borrada no alto, que parece clima e não onda. Contradiz o "fundo seco".
   - **ALTA.**
4. **Acabamento.** Água do produzido turquesa saturada (saturação 128 contra 75). **MÉDIA.**
5. **HUD e legendas.** OK.
6. **Som.**
   - Original: água/ruído rosa crescendo até −15 dB.
   - Produzido: ronco a −12 dB, sem água.
   - **MÉDIA.**

**Correção:**
- Não cortar em 120. Manter o fundo seco (`recua=1` até 128) e tirar as pessoas.
- `paredao`: um plano vertical com textura de espuma, altura 0→60 m, avançando para a câmera.
- De 127,9 a 128,6: camada CSS teal (`#2e7f8f`) com degradê e raios, simulando a câmera submersa.
- Fusão de 0,7 s para a Terra.
- SFX: rugido de onda e som abafado de mergulho.

### terra (2:08–2:33)
1. **Cinematografia.**
   - Tamanho: a Terra do original tem cerca de 70% da altura da tela; a do produzido, cerca de 58%.
   - Original: a câmera recua levemente saindo das nuvens.
   - Produzido: estático.
   - **MÉDIA.**
2. **Montagem.**
   - Original: troca seca para a Terra derretida em 2:29.2.
   - Produzido: transição gradual de 2:28.8 a 2:29.8.
   - **BAIXA.**
3. **Ações.**
   - Original: a Terra derretida **mantém o tamanho** até 2:32.8. Entre 2:33.0 e 2:34.0 ela é achatada e engolida enquanto **o disco se forma em volta dela** ("Earth falls into you").
   - Produzido: a Terra encolhe até virar um ponto entre 2:30.5 e 2:32 (cerca de 1,5 s antes). O disco nasce minúsculo, depois que o planeta some.
   - **ALTA.**
4. **Acabamento.**
   - Original: reflexo do sol nos oceanos, mais nuvens, gelo polar brilhante, névoa de nebulosa cinza ao fundo (luz 34).
   - Produzido: oceano escuro sem reflexo, preto puro (luz 11).
   - Na Terra derretida, o original tem a esfera inteira incandescente; o produzido tem metade marrom.
   - **MÉDIA.**
5. **HUD.** "ERES UN AGUJERO NEGRO DE 1,7 M" já aparece em 2:33.5. No original a linha só surge por volta de 2:37–2:38. **BAIXA.**
6. **Som.**
   - Produzido entre 2:28 e 2:40: de −6 a −9 dB contra −23 a −31 dB no original, cerca de **18 dB mais alto**.
   - O original tem som de "água/líquido" em 2:32–2:34.
   - **MÉDIA.**

**Correção:**
- `cam z` 3.4 → 2.7.
- `lava = t>=149.2 ? 1 : 0` (troca seca).
- Encolher em `smooth(152.8, 154)`, com o `BuracoNegro` começando em escala ~0,7 e brilho, já em volta da Terra.
- Material de oceano com `roughness` 0,35.
- Fundo de nebulosa (ver o desvio nº 10 da lista).
- `larguraTxt` só a partir de 157 s.
- Baixar o ganho entre 2:28 e 2:40.

### buraco (2:33–2:58)
1. **Cinematografia.** Câmera estática nos dois. O disco do original tem cerca de 47% da largura da tela; o do produzido, cerca de 18–25%. **ALTA.**
2. **Montagem.** OK.
3. **Ações.** OK: o disco cresce devagar nos dois.
4. **Acabamento.** Ver o bloco do buraco negro na visão geral. Ranhuras finas creme contra alvo saturado; borda laranja suave contra borda dura. **ALTA.**
5. **HUD e legendas.** OK.
6. **Som.** Música nos dois. Produzido +4,5 dB. **BAIXA.**

**Correção:** `escala` 0.7→1.15 passando para cerca de 1.6→2.4 (ou câmera mais perto). Ver o desvio nº 2 da lista final para o shader.

### lua (2:58–3:46)
1. **Cinematografia.** A posição está boa (disco embaixo à direita). Disco menor no produzido. **MÉDIA.**
2. **Montagem.** O original faz uma **fusão de reenquadramento** em 2:58.3–2:59.0: o disco "desliza" para baixo à direita e a Lua entra. O produzido faz a Lua surgir de repente em 2:58.1. **MÉDIA.**
3. **Ações.**
   - Original: a Lua é redonda e encolhe enquanto cai, sumindo por volta de 3:30.
   - Produzido: a Lua vira um **charuto esticado** que encosta no disco (3:20–3:30). É um efeito a mais.
   - **MÉDIA.**
4. **Acabamento.**
   - Original: Lua estilizada (manchas cinza e brancas de cartum), grande (~23% da altura).
   - Produzido: textura fotográfica, pequena (~13%), **sobreposta às linhas do HUD** (2:59–3:05).
   - **MÉDIA.**
5. **HUD e legendas.** OK.
6. **Som.**
   - **Falha de áudio no produzido em 2:54–2:57** (−40/−52 dB). **MÉDIA.**
   - De 3:04 a 3:44 aparece "Hum" com música fraca (0,40 contra 0,65). **BAIXA.**

**Correção:**
- `estica=0`, `raio` 0.3→0.45, posição `(-1.5, 0.45, 0.2)` (abaixo do HUD).
- Textura de canvas com ruído cinza em limiar.
- Cobrir a lacuna da trilha em 2:54–2:57.

### sol (3:46–4:36)
1. **Cinematografia.** Posições parecidas (composição 0,68). OK.
2. **Montagem.** O original corta em 4:23.2, depois do clarão. O produzido corta no mesmo ponto, mas sem o clarão. **MÉDIA.**
3. **Ações.**
   - Original: o Sol é um **brilho enorme sem borda** (raio ~35% da tela) que ofusca o disco. Não se vê nenhum fio de gás. O Sol encolhe e **colapsa num clarão de raios radiais** em 4:22–4:23.
   - Produzido: **disco branco nítido** com halo (parece uma bola de pingue-pongue) e um **fio pontilhado de partículas** de 4:00 a 4:22. Sem clarão.
   - **ALTA.**
4. **Acabamento.** "The Sun is gone. It's dark." (4:24–4:36): o disco do original fica **apagado, marrom**. O do produzido continua amarelo-laranja forte. **MÉDIA.**
5. **HUD e legendas.** OK.
6. **Som.**
   - Produzido tem ronco em 3:52–4:04, onde o original tem música.
   - O original tem roncos em 4:10, 4:26 e 4:36 que o produzido não tem.
   - **BAIXA.**

**Correção:**
- `Sol`: tirar a esfera nítida (ou deixá-la com o mesmo tom do halo) e usar sprite com escala `raio*20`.
- `fluxo=0`.
- Sprite de raios (canvas com linhas radiais) entre 262 e 263,2 s.
- Depois de 263,2: `brilho=0.35` com cores dessaturadas.

### galaxia (4:36–5:27)
1. **Cinematografia.**
   - Original: galáxia **inclinada cerca de 60°**, com ~45% da largura da tela, centrada.
   - Produzido: galáxia de frente, enorme (~75% da altura), invadindo a área das legendas.
   - **ALTA.**
2. **Montagem.**
   - Original: fusão de 4:36.3 a 4:37.0.
   - Produzido: **surge de repente** em 4:36.0, sobre o disco.
   - **MÉDIA.**
3. **Ações.** A galáxia encolhe até o buraco negro nos dois. No original o encolhimento começa por volta de 4:58 e é gradual. No produzido o tamanho quase não muda até cerca de 5:06 e depois cai rápido. Em 5:14–5:27 os dois coincidem. **BAIXA/MÉDIA.**
4. **Acabamento.**
   - Original: braços azul-claros e núcleo amarelo-quente.
   - Produzido: pontos cinza-brancos monocromáticos com aparência granulada.
   - **MÉDIA.**
5. **HUD e legendas.** Legenda coberta pelos braços da galáxia em 4:45. **BAIXA.**
6. **Som.** O original tem ronco em 5:12–5:18 (o colapso); o produzido só tem música. **BAIXA.**

**Correção:**
- `rot=[1.1, 0, 0.3]`, escala × 0,55.
- Cores: braços `(0.6,0.7,1.0)`, núcleo `(1.0,0.85,0.6)`, mais um sprite aditivo no centro.
- Opacidade de entrada `smooth(276.3, 277)`, com o disco saindo junto.
- `enc = smooth(296, 313)`.

### todo (5:27–5:49)
1. **Cinematografia.**
   - Original: o buraco negro **cresce** (de ~13% para ~28% da largura) e escurece, ficando castanho.
   - Produzido: escala fixa em 0,42.
   - **ALTA.**
2. **Montagem.** OK.
3. **Ações.**
   - O original **não mostra outras galáxias**: só o buraco negro crescendo sobre o fundo de nebulosa.
   - O produzido traz **7 galáxias brancas** que surgem de repente em 5:27.0 e voam pela tela, uma delas por cima da legenda (5:30, 5:40).
   - **ALTA.**
4. **Acabamento.** Paleta 0,26, a pior do vídeo. **ALTA.**
5. **HUD e legendas.** Legendas encobertas pelas galáxias. **MÉDIA.**
6. **Som.** OK.

**Correção:** remover `OutrasGalaxias`. `escala` 0.42→1.0 entre 327 e 349, com `brilho` 1.6→0.5 e cores do disco puxadas para o castanho.

### final (5:49–6:06)
1. **Cinematografia.**
   - Original: já em 5:49 a câmera está **colada no disco** gigante castanho.
     - 5:52: a sombra cresce;
     - 5:55: anel de fótons luminoso e elipse preta sobre o disco;
     - 5:58: a sombra ocupa quase toda a tela;
     - **6:00–6:03.8: tela preta** (só bordas do anel).
   - Produzido: buraco negro minúsculo até cerca de 5:58; disco médio e saturado em 6:00; grande em 6:02. Atraso de cerca de 8–10 s e **nunca chega ao preto**.
   - **ALTA.**
2. **Montagem.**
   - Original: preto, fade para cinza, **branco (6:06.5–6:07.2)**, fade lento até o preto, com "You started at 180 pounds." a partir de 6:07.5.
   - Produzido: disco, branco creme (6:05.5–6:06.6), escuro rápido (6:07.3), texto a partir de 6:06.8.
   - **MÉDIA.**
3. **Ações.** O buraco negro engolindo a câmera, que é o clímax, foi trocado por um clarão branco. **ALTA.**
4. **Acabamento.** O close do original é bege/castanho com riscos. O produzido é laranja saturado (saturação 193 contra 63). **ALTA.**
5. **HUD.** O painel do produzido some de 362 a 364 junto com o clarão. No original o painel continua sobre o preto até cerca de 6:06. **BAIXA.**
6. **Som.**
   - Original: **silêncio total em 6:06–6:08** (−55 / −105 dB).
   - Produzido: música contínua a cerca de −22 dB, e o silêncio se perde.
   - **ALTA.**

**Correção:**
- Mudar o início do `final` para cerca de 347 s.
- `s = interpolate(t, [347,352,356,359,361], [1.6,2.6,4.5,9,20])` com a câmera fixa perto do disco, sombra preta ocupando a tela a partir de 360.
- Clarão com opacidade `[364, 366.5, 367.2, 369]`.
- Silenciar a trilha de 366 a 368,5.

### fim (6:06–6:29)
1. **Cinematografia e montagem.** OK, cartelas com fusões.
2. **Layout.**
   - "Is any of this real?" fica no terço superior (y≈0,25) no original e em y≈0,40 no produzido.
   - Texto do corpo: cerca de 30 px no original, **20 px** no produzido (6 linhas, difícil de ler).
   - "Now watch what happens…" fica no alto (y≈0,2) no original e no centro-baixo (y≈0,5) no produzido. Isso **colide com os cards de tela final do YouTube**, que o original deixa livres nos 2/3 de baixo.
   - Assinatura: o original tem "SUBSCRIBE…" lilás/azulado e CTA cinza; o produzido tem CTA laranja.
   - **MÉDIA.**
3. **Som.** OK: música nos dois, produzido 9 dB mais alto.

**Correção:** cartelas com `justifyContent: 'flex-start'` e `paddingTop` de cerca de 22%. Corpo com 30 px e no máximo 4 linhas (enxugar o texto).

---

## Itens que valem para o vídeo todo

- **Itálico ausente: é um bug.** Em `Video.tsx`, `Legenda` e `Centro` usam `fontFamily: ital`, mas não definem `fontStyle: 'italic'`. Com isso, todas as legendas e frases centrais saem retas. No original elas são itálicas. **MÉDIA.** Correção: uma linha em cada estilo.
- **Número do painel.** Tem 104 px contra cerca de 92 px no original, e os textos longos em espanhol ocupam cerca de 75% da largura (por exemplo em 0:40 e 4:05). **BAIXA.** Correção: 92 px e `maxWidth` de 900 px, reduzindo a fonte proporcionalmente.
- **Fundo do espaço.** O original tem névoa cinza de nebulosa à esquerda em todas as cenas espaciais. O produzido é preto puro com estrelas. **MÉDIA.** Correção: uma camada CSS fixa com PNG de ruído suave, 12% de opacidade, em `mix-blend-mode: screen` atrás do canvas.
- **Transições.** O produzido usa mergulho ao preto (0,25 s, 90%) em 0:04, 0:27, 1:26 e 2:08. O original usa corte seco ou fusão de 0,2 a 0,7 s. **MÉDIA.**

---

## Os 10 desvios mais graves (do mais grave para o menos)

1. **Saturação de 2 a 4 vezes maior** em todo o vídeo, pior no espaço (saturação 230–250 contra 50–70; paleta 0,26–0,56). Correção: `filter: saturate(0.4)` no contêiner do `ThreeCanvas` nos capítulos espaciais e `saturate(0.8)` na Terra, mais as cores do shader do disco.
2. **Buraco negro com visual errado.** O produzido é um alvo laranja saturado, sem brilho, pequeno e com anel fino. O original é um disco creme com ranhuras finas e borda laranja suave, com anel luminoso e, nos closes, a elipse da sombra sobre um disco bege. Em `mundo/Buraco.tsx`:
   - `aneis = 0.93 + 0.07*sin(u*220.)`;
   - cores `quente (1,.97,.9)`, `meio (.98,.8,.58)`, `frio (.85,.45,.2)`;
   - sprite aditivo de brilho em volta do anel e anel com espessura 0.1–0.13 e degradê;
   - um anel preto achatado no plano do disco (raio cerca de 1,6× a esfera) como "sombra";
   - uniforme `uBege` para os closes, com riscos escuros `step(.72, n(vec2(gira*6., u*25.)))`;
   - discos cerca de 2× maiores nos capítulos buraco, lua e sol.
3. **Final sem o clímax** (5:49–6:04). O buraco negro chega cerca de 10 s atrasado e nunca engole a tela; faltam o preto de 6:00–6:03.8 e o silêncio de 6:06–6:08. Correção: ver capítulo final.
4. **Tsunami** (2:00–2:09). Corte seco em vez de descida contínua da câmera; pessoas na água em vez de fundo seco; não há parede de água nem a câmera engolida pela onda e a fusão para a Terra.
5. **Intro** (0:00–0:04). Sem o avanço da câmera até a sombra cobrir a tela, disco laranja estourado e frase ilegível em cima do miolo branco.
6. **Chicago, do mirante à queda** (0:04–0:27).
   - câmera fixa em vez de inclinar até a vista vertical pelo vidro;
   - sem o estilhaço branco em 0:17.2;
   - nuvem dentro do vidro;
   - cidade de torres saturadas;
   - 1,2 s de tela morta (0:25.8–0:27.0) e praça 1 s atrasada.
7. **Galáxias a mais e buraco negro sem crescer** no capítulo "todo" (5:27–5:49), cobrindo as legendas.
8. **Som.**
   - mix plano cerca de 7 dB mais alto;
   - o silêncio do mirante (+13 dB) e o silêncio final se perdem;
   - **nenhum som de mar** em Miami e no tsunami (água: 37 janelas só no original, 0 nas duas);
   - estrondos da praça antecipados e 15 dB mais altos;
   - pico de +18 dB em 2:28–2:40;
   - falha de áudio em 2:54–2:57.
   Correção: automação de ganho por capítulo, SFX de ondas, imersão e estrondos nos tempos do original, e preenchimento da lacuna.
9. **Praça** (0:27–1:26). Piso liso roxo, árvores icosaedros neon, luz chapada e desabamento em silhuetas de papelão em vez de poeira volumétrica; pessoas caindo e postes tortos atrasados ou ausentes.
10. **Sol e Lua**:
    - Sol como disco nítido mais um fio de partículas, sem o brilho que ofusca e sem o clarão de colapso em 4:22;
    - disco claro depois de "Todo está oscuro";
    - Lua pequena, fotográfica, por cima do HUD e esticada como charuto (o original a mantém redonda).

Fora da lista, entre as correções baratas: o itálico das legendas (uma linha de CSS), a curva do painel em 0:25–0:28 e as comparações do painel (piano, coche, elefante, jumbo, Torre Eiffel).

## Notas de fidelidade (0 a 10)

| Dimensão | Nota | Motivo |
|---|---|---|
| Cinematografia | **4,0** | Lua, Sol e galáxia parecidos; intro, mirante, queda, descida no tsunami e final errados; discos pequenos |
| Montagem | **5,0** | Tempos dos capítulos certos; mergulhos ao preto no lugar de fusões; corte em 2:00; falta a sequência na água; 1,2 s de tela morta |
| Roteiro / ações | **4,5** | As cenas principais existem; faltam vidro, parede do tsunami, Terra entrando no disco, colapso do Sol e engolimento final; sobram galáxias, charuto e fio de gás |
| Acabamento | **3,0** | Saturação, buraco negro, cidade, praça, fundo do mar, galáxia e fundo sem nebulosa |
| HUD / legendas | **7,0** | Tempo das legendas excelente e valores certos; sem itálico; comparações faltando ou erradas; atraso de 0:25 a 0:28; números longos; cartelas finais mal posicionadas |
| Som | **3,5** | Correlação de volume 0,20; sem som de água; dinâmica achatada; silêncios perdidos; falha em 2:54 |

**Média: cerca de 4,5/10.** Com as correções 1, 2, o itálico e o som, sem mexer em modelos, a estimativa é chegar a cerca de 6,5.
