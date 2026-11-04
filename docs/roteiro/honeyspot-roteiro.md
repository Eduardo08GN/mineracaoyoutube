# Honeyspot de roteiro: a tocada dos agregadores BR × a das referências 3D (04/11/2026)

**Base:** 35 vídeos documentais-explicativos, 7 por canal, com as legendas lidas por inteiro. A lista está em `lote_35.txt`, as métricas em `metricas_35.json` e os relatórios de cada canal em `tocada_AM.md`, `tocada_MM.md`, `tocada_ST.md`, `tocada_RC.md` e `tocada_AT.md`. Os tempos foram estimados pela marca de minuto da legenda (±10 s).

## 1. O que cada canal ensina (numa frase)

| Canal | O que ele faz melhor | O que levamos |
|---|---|---|
| **Reconstructed** (EN, 3D) | conduz pelo relógio, com frase curta e um gancho por minuto | o tempo como espinha, a pergunta visual e a honestidade sobre o que se sabe |
| **AiTelly** (EN, 3D) | explica a máquina em ordem espacial, frase = ação na tela | mostrar a peça antes de ela importar, na ordem em que a câmera passa |
| **Aviões e Músicas** (Lito) | narra em tempo real e explica o sistema só quando ele decide | explicar só quando o sistema decide algo |
| **Manual do Mundo** (Iberê) | dá o mapa antes do detalhe, analogia caseira e lacuna a cada 60–90 s | sempre uma lacuna aberta e o mapa antes do detalhe |
| **Space Today** (Sacani) | ensina o pré-requisito, descreve antes de nomear e faz a causa andar por perguntas | o pré-requisito antes do dado e o "como sabemos" |

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

## 3. A espinha: 8 princípios (filosofia, não literalidade)

**Correção do Eduardo (04/11):** não é para copiar o recurso literal de nenhum canal ("pessoa com a fala dela na abertura" não cabe no Kriegsmomente nem no Segundo a Segundo). O que se tira de cada canal é **por que** o recurso funciona. Cada princípio abaixo traz o porquê e a tradução para os nossos dois formatos.

| # | Princípio | Por que funciona | Kriegsmomente (DE, 1866/1870–71) | Segundo a Segundo (ES, reconstrução) |
|---|---|---|---|---|
| 1 | **Abrir no momento decisivo, com uma pergunta que a imagem consegue responder** | o espectador entra com tensão concreta e já sabe o que vai procurar na tela | a decisão, o tiro ou a manobra que mudou a guerra, e o paradoxo do título ("obwohl…") | o segundo da falha e a pergunta física ("¿por qué se soltó esa pieza?") |
| 2 | **Prometer pelo caminho, não pela aula** | dizer por onde vamos passar cria curiosidade sem soar escolar | as 2–3 peças da explicação (a máquina, o terreno, a decisão), ditas como enigma | as 2–3 perguntas que o vídeo vai fechar, ditas como enigma |
| 3 | **Mostrar a peça antes de ela importar** | quando a falha chega, o espectador já conhece o que falhou (preparação e retorno) | o canhão Krupp, a ferrovia ou o telégrafo apresentados antes da batalha | a cauda em T e o profundor apresentados antes da queda |
| 4 | **O tempo é a espinha** | um relógio que avança dá ritmo e uma sensação de inevitável | dias, horas e ordens: a sequência das decisões | o relógio segundo a segundo dos dados |
| 5 | **Explicar só quando o sistema decide algo** | a explicação chega no instante em que o espectador quer saber, e não antes | a doutrina ou o mecanismo entra quando muda o rumo da batalha | o Mach, a pressão e a cauda entram quando mudam o voo |
| 6 | **Sempre uma lacuna aberta** | a curiosidade administrada segura a retenção | uma pergunta em aberto a cada 60–90 s | idem |
| 7 | **Aprofundar a mesma pergunta, não ampliar** | nos virais, a segunda metade cava o mesmo mecanismo, sem desviar para estatística ou geopolítica | a mesma inovação vista de outro ângulo, não uma lista de batalhas | a mesma peça e a mesma física, no máximo um caso anterior |
| 8 | **Honestidade sobre o que se sabe e fechar na pergunta do início** | a confiança vem de separar fato, cálculo e dúvida; o fim responde ao começo | fonte e cálculo separados; o paradoxo do título resolvido | confirmado / calculado / desconocido, e a pergunta do início respondida |

**Recursos dos canais que NÃO entram literalmente:**
- a pessoa com a fala dela na abertura;
- a frase "esta es la historia de…";
- a frase da abertura repetida como refrão;
- o "mais um elo" dito em voz;
- o "você" de conversa.

Cada um vale só como ilustração do princípio, e a forma de executar sai do nosso estilo.

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

## 6. A P3 do Learjet contra os princípios

| Princípio | P3 | Próximo vídeo |
|---|---|---|
| 1. Momento decisivo + pergunta visual | ✅ | manter |
| 2. Prometer pelo caminho | parcial (vai direto a "lo nuevo") | dizer as 2–3 perguntas que o vídeo vai fechar |
| 3. Peça antes de importar | parcial (a cauda só no bloco 06) | apresentar a cauda antes da cronologia |
| 4. Tempo como espinha | ✅ (bloco 04) | manter |
| 5. Explicar quando o sistema decide | ✅ (Mach no instante em que cruza) | manter |
| 6. Lacuna aberta | a medir | medir no roteiro |
| 7. Mesma pergunta mais fundo | ✅ (Mach → cauda → pressão) | manter |
| 8. Sabido / calculado / desconhecido + fechar na pergunta | ✅ / parcial | o fim responde explicitamente à pergunta do início |

## 7. Checklist (princípios; vale para o Segundo a Segundo e o Kriegsmomente)

1. A abertura está no momento decisivo e traz uma pergunta que a imagem responde?
2. A promessa diz o caminho (2–3 perguntas), sem anunciar aula?
3. A peça que vai importar aparece antes de importar?
4. O tempo (relógio ou sequência de decisões) conduz o vídeo?
5. Cada explicação entra no instante em que o sistema decide algo?
6. Há sempre uma pergunta em aberto (uma a cada 60–90 s)?
7. A segunda metade aprofunda a mesma pergunta, com no máximo um caso paralelo?
8. O fim separa sabido, calculado e desconhecido e responde à pergunta do início?
9. Textura: frase curta com fragmentos, poucos números, termo definido na hora, frase = ação na tela, sem opinião.
