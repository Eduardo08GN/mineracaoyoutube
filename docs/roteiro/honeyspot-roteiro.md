# Honeyspot de roteiro: a tocada dos agregadores BR × a das referências 3D (04/11/2026)

**Base:** 35 vídeos documentais-explicativos, 7 por canal, com as legendas lidas por inteiro. A lista está em `lote_35.txt`, as métricas em `metricas_35.json` e os relatórios de cada canal em `tocada_AM.md`, `tocada_MM.md`, `tocada_ST.md`, `tocada_RC.md` e `tocada_AT.md`. Os tempos foram estimados pela marca de minuto da legenda (±10 s).

## 1. O que cada canal ensina (numa frase)

| Canal | O que ele faz melhor | O que levamos |
|---|---|---|
| **Reconstructed** (EN, 3D) | conduz pelo relógio, com frase curta e um gancho por minuto | a espinha: cena fria, índice-enigma, cronologia, "o que se sabe / o que não se sabe" |
| **AiTelly** (EN, 3D) | explica a máquina em ordem espacial, frase = ação na tela | o passeio pelas peças e os passos numerados |
| **Aviões e Músicas** (Lito) | narra em tempo real e explica o sistema só quando ele decide | a pausa técnica curta, "mais um elo" e o fecho com lição |
| **Manual do Mundo** (Iberê) | dá o mapa antes do detalhe, analogia caseira e lacuna a cada 60–90 s | a ordem por peça e a reabertura no último terço |
| **Space Today** (Sacani) | ensina o pré-requisito, descreve antes de nomear e faz a causa andar por perguntas | o sanduíche, "como sabemos" e o mito corrigido |

**A lacuna que justifica o cruzamento:**
- Os dois canais 3D dizem **o que** acontece, mas quase nunca **por quê**. No AiTelly, analogia e porquê são cerca de 0,1 por minuto.
- Os três BR explicam o porquê, mas dependem de um rosto conhecido, de anúncio e de improviso.
- O honeyspot fica no meio: a espinha e a imagem dos 3D com a explicação dos BR, em canal faceless.

## 2. Métricas (medianas)

| | AM | MM | ST | RC | AT | **P3 (nós)** |
|---|---:|---:|---:|---:|---:|---:|
| Duração (min) | 25,7 | 19,8 | 15,6 | 17,0 | 10,0 | 9,7 |
| Palavras/min | 152 | 179 | 141 | 141 | 155 | 150 |
| Palavras/frase | 20,5 | 17,7 | n/d* | **10,9** | n/d* | 13,2 |
| "Você"/min | 0,4 | 1,9 | 2,2 | 0,3 | 0,4 | 0,7 |
| Marcas de tempo/min | 0,7 | 0,5 | 0,1 | **1,3** | 0,3 | 1,1 |
| Pergunta/tensão central | ~10 s | ~25 s | ~45 s | 0:40–1:05 ("ninguém sabe") e ~1:37 (explícita) | 0 s (o objeto) | ~25 s |
| Re-gancho forte | 1 a cada 1,5–2,5 min | 1 a cada 60–100 s | ~1 a cada 3–4 min | 1 a cada 60–75 s | n/d | a medir |

\* Legenda automática sem pontuação. Na P3 os números são falados por extenso para a TTS, então o regex de números não os conta.

## 3. O molde (vídeo de 9 a 12 min, reconstrução de evento com máquina)

| Tempo | Bloco | Como (fonte) |
|---|---|---|
| 0:00–0:15 | **Cena fria dentro da máquina, no segundo da falha** | Lugar, hora, quantas pessoas, um número, e uma pessoa nomeada com a fala dela (citada da imprensa). Uma virada atribuída: "Y entonces, dice X…". (RC 7/7, AM 6/7) |
| 0:15–0:45 | **Paradoxo + pergunta física** | Uma pergunta que a animação consegue **mostrar** ("¿por qué perdió esa pieza en el aire?"), não uma abstrata. "Nadie sabe todavía por qué" antes de 1:00. (RC, MM, ST) |
| 0:45–1:30 | **Índice-enigma = a promessa** | "Esta es la historia de A, de B y de C", cada item como enigma, mais a segunda pergunta (de causa ou sistêmica). É a promessa pelo objeto, nunca "vas a entender". (RC 7/7, AT 7/7) |
| 1:30–3:00 | **Volta ao dia normal + a máquina antes de falhar** | Contexto em até 2 min. A ficha: 3–4 números e uma comparação do dia a dia. O passeio pelas peças em ordem espacial, com a peça da história mostrada **antes** de falhar. (AM, AT, RC) |
| 3:00–7:30 | **Cronologia no relógio (40–60% do vídeo)** | Uma hora em cada fato. Toda explicação é uma **pausa técnica de 15–40 s**, quando o sistema decide algo: termo → "normalmente…" → "pero en este vuelo…" → consequência (AM 7/7). Descrever antes de nomear (ST 7/7). A causa anda por "¿Por qué X? Porque Y". Um re-gancho a cada 60–90 s; "un eslabón más" quando o erro se forma. |
| 7:30–9:00 | **Último terço: a mesma pergunta mais fundo** | Contagem regressiva. A segunda metade aprofunda **o mesmo mecanismo** (nos virais do RC), sem saltar para estatística ou geopolítica. No máximo um caso anterior parecido. Reabertura: "en la práctica fue peor", o número que estava errado, um último dado. (MM 7/7) |
| 9:00–10:00 | **Como se sabe + fecho** | O instrumento que prova (ADS-B, radar, destroço) (ST). "A [fecha]: confirmado / calculado / desconocido" (RC 7/7). Lição sem culpado único (AM 6/7). A frase da cena fria volta como **refrão** (RC, AM). Sair em até 1 min. Puxar o vídeo anterior: só nós; o RC não faz. |

## 4. Textura (regras de frase)

1. **Ritmo da TTS: 140–150 palavras por minuto.** O ritmo de improviso do Iberê (179) atropela na voz sintética.
2. **Frase média de 10 a 14 palavras**, com 13–21% de fragmentos de 5 palavras ou menos ("Breve.", "Y se queda clavado."). Frase longa só na pausa técnica, com conector de causa.
3. **No máximo 3,5 números falados por minuto.** Só o número do clímax ganha escala do cotidiano. Por vídeo, pelo menos um número comparado com a norma ("el mínimo es 700 m; había 300").
4. **Termo técnico definido na mesma frase** em que aparece. Sigla por extenso na hora.
5. **Frase = ação na tela** (AT: 5–9 frases de ação por minuto no mecanismo). Uma frase dêitica por mecanismo ("fíjate en…", "mira la barra…"), mas não como muleta no lugar de explicar ("como se ve en la animación").
6. **Voz:** sem opinião. Toda informação vem atribuída ("según la junta…", "dice…"). "Nosotros" só para método e ética. "Tú" pouco: os canais 3D ficam em 0,3–0,4 por minuto.
7. **Por vídeo, pelo menos uma vez cada:**
   - um mito corrigido ("todo el mundo citó… no es que…");
   - a dúvida do espectador antecipada ("quizá pienses que…");
   - um contraste com um caso que o espectador já conhece.
8. **A digressão começa só depois de uma pendência aberta** e termina com uma frase de volta ao caso.

## 5. O que não copiar

- **Anúncio cedo**, bordão de canal e promessa genérica ("vamos entender essa história toda").
- **Rosto e corpo:** autoridade pessoal, prova pelo corpo, diálogo de dupla.
- **Áudio real de rádio ou caixa-preta** (regra nossa).
- **Política, sensacionalismo**, três eventos num vídeo, palavrão citado.
- **Final sem síntese** (AT) e terminar no clímax (MM).
- **Leitura de ficha e de matrícula em voz;** número de artigo sem tradução.

## 6. A P3 do Learjet contra o molde

| Item | P3 | Ação no próximo vídeo |
|---|---|---|
| Cena fria + pergunta física em até 30 s | ✅ (35.000 pies…; "¿por qué perdió esa pieza?") | manter |
| Pessoa nomeada com fala na cena fria | ❌ | entrar com uma fala da imprensa (testemunha, junta ou familiar) |
| Índice-enigma "esta es la historia de…" | ❌ (vai direto a "lo nuevo") | criar entre 0:45 e 1:30 |
| A máquina mostrada antes de falhar, em ordem espacial | parcial (a cauda só no bloco 06) | puxar o passeio pela cauda para antes da cronologia |
| Cronologia no relógio com pausa técnica | ✅ (bloco 04, "Mach es…") | manter; medir os re-ganchos |
| Mito corrigido | ✅ (transponder) | manter |
| Analogias do cotidiano | ✅ (ascensor, velocímetro, Torre Latinoamericana) | manter |
| Reabertura no último terço | ❌ | um dado que muda a leitura antes do fecho |
| "Confirmado / calculado / desconocido" | ✅ (bloco 09) | manter, com a data |
| Frase da abertura volta como refrão | ❌ | fechar com a frase da cena fria |

## 7. Checklist (substitui o de 15 itens de 03/11 nos vídeos de reconstrução)

1. Cena fria com lugar, hora, número e uma pessoa com fala, em até 15 s.
2. Pergunta física e visual em até 45 s; "nadie sabe todavía" antes de 1:00.
3. Índice-enigma com 2–3 itens até 1:30; promessa pelo objeto.
4. A máquina mostrada antes de falhar: ficha com 3–4 números + 1 comparação.
5. Cronologia com hora em cada fato, ocupando 40–60% do vídeo.
6. Toda explicação é uma pausa de 15–40 s, na ordem termo → normalmente → pero en este vuelo → consequência.
7. Re-gancho a cada 60–90 s (medido no roteiro: pergunta aberta, "pero", "un eslabón más").
8. A segunda metade aprofunda o mesmo mecanismo; no máximo um caso anterior.
9. Reabertura no último terço.
10. "Cómo se sabe" com o instrumento na tela.
11. Fecho: confirmado / calculado / desconocido com data, lição sem culpado, refrão da abertura, saída em até 1 min.
12. Textura: frase de 10–14 palavras com fragmentos, ≤ 3,5 números/min, termo definido na hora, ≥ 1 mito, ≥ 1 dúvida antecipada, frase = ação na tela.
