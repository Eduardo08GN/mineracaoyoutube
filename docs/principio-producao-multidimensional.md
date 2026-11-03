# O princípio de produção: a excelência está na interseção das dimensões (03/11/2026)

**Para quem é:** todo agente e toda sessão que roteiriza, planeja take, desenha, renderiza ou revisa vídeo nos dois canais 3D:
- o **canal DE** de guerras prussianas, com explicador narrado e simulação;
- o **canal ES** de reconstrução 3D de eventos.

O princípio também vale para canal novo que use a mesma stack.

**De onde veio:** o Eduardo o fixou em 03/11/2026, depois de uma série de leituras de referência e de reprovações. Cada parte abaixo foi confirmada por ele frase a frase antes de virar regra. Nas palavras dele:
- "o hotspot dos nossos nichos são as interseções multidimensionais";
- "nada engessado, informação solta, take engessado, desconexo, sem harmonização, tal como a gente vinha fazendo, soltando números de forma robotizada".

**Como usar:**
1. O §1 é o princípio-mãe.
2. Os §2 a §6 são a aplicação dele em cada camada do vídeo.
3. O §7 traz as regras verificáveis, o §8 os anti-padrões medidos e o §9 o procedimento de revisão.
4. O §10 traz as referências que sustentam cada número.

---

## 1. O princípio-mãe: o nosso ponto ideal é a interseção das dimensões

O vídeo excelente não maximiza uma dimensão, seja mais realismo, mais números ou mais cortes. Ele **cruza várias dimensões ao mesmo tempo e faz cada uma dar sentido à outra.**

Isso vale em **três escalas**, com a mesma lógica:

| Escala | Dimensões que se cruzam | Exemplo bom | O que fazíamos |
|---|---|---|---|
| **Nicho / tema** | história × **o espectro técnico do assunto** × discurso adaptado ao leigo | 1870 × a logística ferroviária e a estratégia do Estado-Maior × "um trem a cada oitenta minutos, dia e noite" | história crua (aula) ou número cru (planilha) |
| **Roteiro** | fato × tradução para o cotidiano × porquê × reação do narrador | "Fast eine Million Mann… Würden sie im Sekundentakt an Ihnen vorbeigehen, stünden Sie über elf Tage am Straßenrand" | 9 números por minuto, falados em fila, sem régua |
| **Take** | dado técnico × conceito abstrato × ilustração × espaço × tempo × narrativa | avião desenhado dentro da cortina de radar 3D, com a barra "dentro da nuvem · gelo" e a razão de descida ficando vermelha | cartão com número → mapa → 3D mudo, um de cada vez |

**O espectro técnico é amplo e não afunila numa disciplina só** (correção do Eduardo, 03/11):
- **canal DE:** estratégia, tática militar, logística, inovação de engenharia e tecnologia. Cada vídeo escolhe as que o assunto pede; não é "sempre engenharia";
- **canal ES:** aerodinâmica, meteorologia, engenharia, procedimentos e investigação, conforme o evento.

**Sozinha, cada dimensão é comum:**
- história crua é aula;
- ciência crua é palestra;
- linguagem simples sem conteúdo é vazia;
- gráfico sem contexto é planilha;
- animação sem dado é enfeite.

**O vídeo vira único no cruzamento.** O espectador leigo não junta peças soltas na cabeça: se o vídeo não juntar, ninguém junta.

**Teste universal**, para cada tema, capítulo, frase e take: *quais dimensões isto cruza, e elas conversam entre si?*

---

## 2. O produto é a compreensão do espectador, não a imagem bonita

**O que a referência mostrou:**
- Um Short vertical de 2:34 fez **576 mil views em ~1 dia** num canal de **1.900 inscritos**. Foi sobre o mesmo acidente aéreo que nós reconstruímos com render caro.
- O valor dele estava em transformar um conceito abstrato e técnico (interação de um jato com uma tempestade, espiral, excesso de velocidade) em algo digerível para o leigo, juntando **visual gráfico + animação** no mesmo take.
- O avião era um desenho barato e simples. Ele bastou, e até se destacou, porque o contexto carregava o significado.

**O nosso erro, medido:** apostamos todas as fichas no realismo caro e entregamos informação mal processada:
- render pesado (Blender/Cycles) com ~40 min de G4 para **31 s de imagem única**, esticados em 113 batidas de um vídeo de 8:47;
- **56%** do tempo de imagem em takes repetidos; o mesmo plano voltou **17×**;
- **60,6%** dos quadros com câmera parada;
- **21%** do tempo em cartão separado do 3D;
- roteiro com **~9 números falados por minuto** (referência: 0,6–2,9), sem tradução e sem analogia.

Em resumo: imagem cara e conhecimento pobre.

**Ordem de investimento, do mais importante para o menos importante:**
1. **Roteiro que agrega conhecimento** (§3).
2. **Desenho da informação:** o gráfico dentro do take, com o número vivo sobre a simulação (§4).
3. **Animação que demonstra o mecanismo:** o objeto se move, a câmera anda e a ação muda dentro do plano.
4. **Acabamento visual:** só até o ponto em que ajuda a entender (§5).

O orçamento de tempo e de G4 segue essa ordem. Se o roteiro e a informação não estão prontos, não se gasta render.

---

## 3. Roteiro: o padrão "agregador de conhecimento"

**Referência:** três canais brasileiros de alto alcance que transformam conteúdo técnico em algo útil para o leigo:
- Aviões e Músicas (aviação, reconstrução de acidentes);
- Manual do Mundo (ciência do cotidiano);
- Space Today (ciência e notícia).

Foram analisados 9 vídeos pelas legendas, com métricas de texto.

### 3.1 O que eles fazem (o denominador comum)
1. **Uma pergunta só**, dita em voz alta nos primeiros 30 s.
2. **Todo termo novo definido no ato**, em linguagem de cozinha.
3. **Todo número grande ganha uma régua:** cidade, campo de futebol, "um a cada…".
4. **O narrador tem ponto de vista e reage** aos fatos.
5. **Camadas:** primeiro o princípio em 1 frase, depois o mecanismo, depois a complicação real.
6. **Fecho que o espectador leva embora:** resumo, regra e "para que serve".

### 3.2 Onde estávamos
| Métrica | Nosso roteiro DE (vídeo 14 v1) | Nossos roteiros ES | Faixa das referências |
|---|---:|---:|---:|
| Palavras por frase | **8,5** | 12,8–12,9 | 14–18 |
| Números falados por minuto | **~9,3** | ~5–8 | 0,6–2,9 |
| Perguntas por minuto | 0,45 | 0,23–0,36 | 0,7–2,7 |
| Fala ao espectador ("Sie/tú") por minuto | 0,56 | 0,36–0,46 | 0,9–4,3 |
| Marcadores de tradução ("das heißt / es decir") por minuto | 0,22 | ~0 | 0,3–0,65 |

### 3.3 Checklist do roteiro agregador (15 itens, verificáveis no texto antes da narração)
| # | Item | Como verificar |
|---|---|---|
| 1 | Pergunta do título dita em voz alta até 30 s (≤ 75 palavras) | achar o "?" no capítulo 1 |
| 2 | Promessa concreta até 60 s, com objeto nomeado | No ES, prometer pelo objeto e pela fonte ("lo reconstruimos con el radar"), **sem** "vas a entender" |
| 3 | Todo termo técnico definido na 1ª menção, em ≤ 1 frase ("X, das heißt…") | listar termos; 0 sem definição |
| 4 | Todo número de ≥ 4 dígitos ou unidade estranha tem régua do cotidiano; nunca mais de 3 números seguidos sem tradução | contar por capítulo |
| 5 | **≤ 4 números falados por minuto**; o resto vai para o **painel vivo** da simulação (§4), não para cartão | contagem por capítulo |
| 6 | ≥ 3 analogias do dia a dia por vídeo, uma por cena de mecanismo | marcar "wie / como" |
| 7 | Cena de mecanismo em camadas: porquê simples → como → número → consequência | ler a ordem das frases |
| 8 | ≥ 2 perguntas do espectador antecipadas ("Sie fragen sich vielleicht…") | contar |
| 9 | ≥ 1 mito ou senso comum corrigido, com fonte | achar a frase |
| 10 | Contador de progresso (dias, etapas, elos), que no take vira o relógio do painel | lista no texto + instrumento |
| 11 | Voz com reação: ≥ 3 momentos de "wir/nosotros" com espanto ou opinião; ≥ 1 fala ao espectador por minuto | contar |
| 12 | Frase média de 11–16 palavras com conectores de causa (weil, deshalb, porque) ≥ 1 por minuto | script de métrica |
| 13 | Resumo procedimental ≤ 60 palavras + 1 regra de ouro citável | achar o parágrafo e a frase |
| 14 | "Para que serve" / ponte com o hoje do espectador, em 1–2 frases | achar a frase |
| 15 | **Cada cena de mecanismo tem 1 frase dêitica que aponta o cruzamento** dado × animação ("Achten Sie auf den Zähler, während die Züge einfahren") | contar por cena |

**Cuidados na aplicação:**
- **Variar a fórmula dêitica.** Repetir "Achten Sie auf… während" vira tique. Use "Hier sehen Sie, wie…", "Im Bild läuft…" ou só o tempo da fala.
- **Ressalva por afirmação causal**, não por quantidade de palavras: toda frase de causa leva qualificação, e nenhum bloco termina em ressalva.
- **Causa única desmentida pela tela é erro de interseção.** Se o painel mostra 3:1 de efetivo, a fala não pode atribuir a vitória a uma causa só.

**Resultado no vídeo 14 v2 (DE), reescrito com o checklist:**
| Métrica | v1 | v2 |
|---|---:|---:|
| Números falados por minuto | 9,3 | 2,25 |
| Palavras por frase | 8,5 | 14,0 |
| Conectores causais por minuto | 0,28 | 2,2 |
| Termos definidos | 1/17 | 17/17 |
| Réguas do cotidiano | 1 | 9 |
| Analogias | 1 | 8 |
| Perguntas antecipadas | 0 | 6 |

### 3.4 Molde de 9 blocos para o canal ES (reconstrução de evento)
Comparado com uma reconstrução que fez 1,24 mi em 1 dia, o nosso roteiro tinha frases do mesmo tamanho; o problema era a **arquitetura**:
- 7 casos paralelos que tiravam o espectador da história;
- ressalvas fechando os blocos;
- "parte 2" escrita como comentário da parte 1;
- frases sobre instituições, que viravam cartão.

Os 9 blocos:
1. **Abertura fria de 30 s** no momento crítico (altura/hora → desfecho → vítimas) + promessa pela fonte.
2. **Lo nuevo**, só se houver atualização: fatos novos, concretos e humanos.
3. **El vuelo / el recorrido completo:** sempre inteiro, para quem chega pelo feed.
4. **Segundo a segundo, o miolo:** relógio e números em progressão; cada frase é uma ação animável. **É aqui que o take contínuo com painel vivo (§4) mora.**
5. **El número:** 1 número central traduzido em referência **hispânica** conhecida.
6. **Cómo puede pasar:** 1 mecanismo como princípio geral, em 3–5 passos visíveis.
7. **Take inédito:** ≤ 1 caso paralelo ou fato contraintuitivo, ~30 s, com plano próprio.
8. **Lo que leen los investigadores:** como se leem destroços e dados, em geral.
9. **Fecho ≤ 40 s:** resumo do mecanismo (≤ 60 palavras) que já separa confirmado / reportado / desconocido + 1 regra citável + famílias + próximo vídeo.

**Limite honesto do molde:** ele é **piso de retenção, não alavanca de viral.** Um vídeo nosso com retenção maior que a do nosso viral fez 220 views (397 impressões, CTR 2%). A alavanca continua sendo evento, janela, título e miniatura.

---

## 4. Desenho da informação: o gráfico dentro do take

### 4.1 O que a referência faz (Short do acidente aéreo, leitura a 20 fps, 3.085 quadros)
**Números:**
| Medida | Referência | Nossa parte 2 do mesmo evento |
|---|---|---|
| Cortes | **4 em 154 s** (1,6/min), take mais longo de **81 s** | 9,5/min |
| Quadros com imagem congelada | **0%** | grande parte (60,6% de câmera parada) |
| Cartão separado do 3D | **0** | 21% do tempo |

Ele quase não corta, e mesmo assim nenhum quadro fica parado: **os números mudam dentro do take.** O ritmo vem do dado, não do corte.

**Tudo vive sobre uma simulação contínua** (avião 3D, trajeto ADS-B real, radar meteorológico como volume 3D, imagem de satélite), em camadas que nunca saem da cena:
1. **Painel ao vivo:**
   - altura em pés e km;
   - subindo/descendo com **cor de sinal** (verde sobe, vermelho desce);
   - velocidade;
   - "asas niveladas" ou "9° inclinadas para a direita";
   - hora local.
2. **Barra amostrada no lugar do objeto:** a escala de cor do radar com marcador, de "chuva embaixo · chuva fraca" a "**na altura do avião · dentro da nuvem · gelo**". É o gráfico da interação clima × avião, dentro do take.
3. **Compressão de tempo declarada:** "40× mais rápido" → "5×" → "2×" → "**tempo real**" quando começa a queda.
4. **Legenda de ação de 1 linha:** "Curva à direita, para o leste", "Inclina para a direita e a descida acelera".
5. **Fala do rádio como cartão de texto traduzido.** Para nós, **só texto**: nunca áudio real de controle de tráfego ou de caixa-preta.
6. **Instrumento que entra quando passa a importar:** o horizonte artificial ("nariz −67° · asas 60°") só aparece no mergulho.
7. **Rótulo 3D preso ao volume:** "NÚCLEO DA TEMPESTADE · topo a 15 km", na cortina de radar ao lado da qual o avião desce.

**A sinergia:**
- a barra "dentro da nuvem" faz sentido porque o avião está visivelmente dentro da cortina;
- o mergulho assusta porque o número fica vermelho e acelera;
- o horizonte inclinado traduz o "60 graus" que o piloto disse.

### 4.2 Regra aprovada (versão corrigida após revisão adversarial)
1. **Vale nos blocos de mecanismo:**
   - ES: bloco 4;
   - DE: capítulos de mecanismo (por exemplo trens, dia da previsão, cerco final).

   Biografia e contexto usam outra linguagem.
2. **Número citado na fala = instrumento vivo sobre a simulação.** Cartão preto só como soco de uma linha: **≤ 10% do tempo e ≤ 3 s cada.** O problema nunca foi o cartão em si; uma referência de 565 mil usa 22% de cartão de uma linha. O problema era o cartão **sem 3D vivo atrás e com câmera parada**.
3. **Painel:**
   - **≤ 3 grandezas** com cor de sinal + **1 barra amostrada no objeto** + **relógio com compressão declarada**;
   - entram e saem com a fala, nunca todas fixas;
   - um HUD nosso de 4–5 números fixos já foi reprovado, e a referência longa usa 2.
4. **Legenda de ação de 1 linha** = o que acontece agora.
5. **Dado do ambiente como volume ou objeto 3D com rótulo preso:** cortina de radar, anel de alcance, faixa de via simples × dupla.
6. **Take de simulação pode durar 30–80 s sem corte**, se algum dado muda a cada ≤ 1 s.
7. **Na régua de medição, "% de imagem congelada = 0" substitui "cortes por minuto".**
8. **Fonte:** no canal DE, créditos só na descrição; no ES, rodapé fino de uma linha onde permitido.

**Exemplos aplicados (vídeo 14, DE):**
- **Trens:** o diorama roda "Tag 1 … Tag 18" com o painel "Züge heute · eingleisig/zweigleisig · Truppen am Rhein". A **curva de chegada se desenha no canto** conforme os trens chegam e cruza a linha tracejada da previsão no dia 18. Gráfico e trem no mesmo take.
- **Cerco final:** contador de canhões 774 × 564 em cor de facção, relógio "1. Sept 05:00 → 11:00", barra "im Feuer / außer Reichweite" amostrada sobre o vale enquanto os anéis de alcance se desenham. A barra é métrica derivada: leva o selo "Prinzipskizze".

---

## 5. Realismo × custo: a linha tênue e o desenho inteligente

### 5.1 Nenhum extremo é certo
- **Realismo caro** desperdiça: horas de modelagem e minutos de G4 que não aparecem no take.
- **O barato que parece barato** também atrapalha: objeto cinza, sem material e iluminado como argila parece inacabado.
- **O alvo:** o ponto em que custa pouco e ainda é **bonito e intencional**, um desenho bem resolvido.

### 5.2 O avião da referência (ampliado quadro a quadro)
- corpo claro de poucos polígonos;
- **contorno escuro**, como traço de nanquim;
- sombra chapada de 2–3 tons;
- o traço que identifica o modelo **exagerado**: cauda em T, motores atrás, janelas em pontos;
- pequeno ou médio no quadro (~1–2% da área), ancorado por uma linha tracejada até o chão e pelo trajeto branco.

**Ele basta, e até se destaca:**
- **tamanho:** a 1–2% da tela, rebite, reflexo e textura não viram pixel visível;
- **atenção:** o olho está no número, na barra e na trajetória; o avião só precisa ser reconhecível e mostrar a atitude;
- **harmonia:** um avião fotorrealista no meio de painel chapado e cortina translúcida pareceria colado. O desenho conversa com a diagramação.

### 5.3 O caminho caro não compensa nesse contexto
Para pôr um avião ultrarrealista num take de diagramação multidimensional, seria preciso:
- procurar e baixar biblioteca;
- conferir licença;
- converter formato;
- ajustar material;
- iluminar;
- renderizar minutos por take.

Cada etapa é ponto de falha e atraso, e o resultado final seria praticamente o mesmo. Foi esse caminho que deu os 31 s de render reaproveitados como papel de parede. **É engenharia excessiva onde o valor não está.**

### 5.4 As quatro perguntas, para cada objeto ou take
1. **O que o espectador precisa reconhecer ou entender aqui?** Só esse detalhe recebe investimento, e exagerado. Exemplos: no canhão, a culatra e as rodas; na locomotiva, a chaminé e as rodas motrizes; no soldado, o capacete com ponta.
2. **Quanto tempo e espaço ele ocupa na tela?** Fundo e passagem ficam no simples. Só o protagonista visto de perto ganha mais acabamento, e nunca em close macro de modelo simples.
3. **Quanto custa** em horas e minutos de GPU? Se o ganho não aparece no take, não se justifica.
4. **Combina com o resto da cena?** Uma peça realista entre objetos desenhados, ou o contrário, parece erro. **Coerência de estilo vale mais que detalhe.** Um modelo baixado de fotogrametria passa pelo mesmo tratamento (contorno + 2–3 tons) ou não divide o quadro com os desenhados.

O critério é sempre "**isso ajuda a entender?**", nunca "isso parece real?". O realismo fica para a rara exceção em que a própria textura é a informação, e mesmo aí um destaque desenhado costuma explicar melhor.

### 5.5 Receita técnica do desenho barato (stack de tempo real: Remotion + three.js)
- **Contorno:** inverted hull (cópia da malha com faces invertidas, levemente escalada, em cor escura) ou `OutlinePass` de pós-processamento.
- **Material:** `MeshToonMaterial` com mapa de gradiente de 2–3 tons. Cor de facção ou de identidade (azul prussiano × vermelho francês; branco limpo de aviação) ou de material (ferro escuro, latão, madeira).
- **Âncora:** sombra de contato ou linha tracejada até o chão; nada flutua no vazio.
- **Chão e céu:** chão real (ortofoto ou relevo) ou chão de material simples + céu de HDRI. A sombra de contato é o que tira a cara de maquete.
- **Luz:** mediana de luminância nos planos abertos ≥ 100 (0–255); preservar os acentos de facção mesmo se o mundo for dessaturado.
- **Vegetação e casas:** prontas e coerentes com o estilo. Árvore em cone é pior que nada.

### 5.6 Habilidade e biblioteca próprias
A habilidade que vale desenvolver é **desenhar bem e barato, de forma inteligente e harmônica com a ambientação de cada canal**:
- **canal DE:** paleta e traço de época, como gravura do século XIX animada;
- **canal ES:** traço limpo de infográfico de aviação e engenharia.

A habilidade **acumula**: uma biblioteca nossa de objetos desenhados no mesmo estilo (avião, trem, vagão, canhão, soldado, casa, navio, telégrafo) se reaproveita como **modelo** em todo vídeo novo, com outro ângulo e outra ação. O que nunca se reaproveita é o **take** renderizado (§7). O caminho ultrarrealista cobra o custo cheio toda vez.

---

## 6. O take: cruzamento sinérgico de dimensões

### 6.1 As seis dimensões
| Dimensão | O que é | Exemplo |
|---|---|---|
| Dado técnico | número vivo, instrumento, gráfico | razão de descida em vermelho; curva de chegada |
| Conceito abstrato | mecanismo, força, alcance, causa | espiral; anel de alcance; via simples × dupla |
| Ilustração | objeto desenhado (§5) | avião, trem, canhão |
| Espaço | terreno e trajeto reais | relevo e satélite; trajeto ADS-B |
| Tempo | relógio, compressão, progressão | "Tag 1 → Tag 18"; "40× → tempo real" |
| Narrativa | fala, legenda de ação, fala de rádio em texto | "Inclina para a direita e a descida acelera" |

### 6.2 A regra
- Cada **take de mecanismo** cruza **no mínimo 3–4 dimensões ao mesmo tempo**, e **uma ajuda a ler a outra**. Contexto e biografia podem cruzar menos.
- Isso **substitui a meta antiga de mistura por famílias** (simulação ≥ 30%, esquema ≥ 20%, mapa ≤ 25%…), que premiava separar as dimensões em fila.
- **Exemplo (cerco final, DE):** um take só com terreno real (espaço), anéis de alcance se desenhando (conceito), canhões desenhados disparando (ilustração + movimento), contador 774 × 564 (dado), relógio da manhã (tempo) e a fala. Antes eram cinco takes separados.

### 6.3 Gramática de câmera e de ação
**Medido numa referência de Short com 255 mi de views:** 31 s **sem corte**, com dolly contínuo de ~0,15% de escala por quadro, só **4,8%** de quadros parados e a ação mudando dentro do plano. Os nossos vídeos tinham **23–35%** de câmera parada e dolly 4–6× mais lento.

**Regras:**
- câmera padrão sempre andando, num eixo, com easing;
- ≤ 10% de quadros parados nos planos 3D;
- a ação muda dentro do plano;
- transição por movimento em vez de corte seco quando couber.

**Biblioteca de ângulos sobre o mesmo modelo:** close de detalhe, de cima, de frente, de trás, pequeno no terreno imenso, travelling lateral, grua, corte interior. Cada frase ganha um ângulo novo; uma referência longa usa ~15 ângulos sobre um único modelo e **149 takes distintos em 12 min**, com só 3% do tempo em takes repetidos.

---

## 7. Regras verificáveis (resumo para portão de qualidade)
| Camada | Regra | Medida |
|---|---|---|
| Tema | cruza história × espectro técnico do assunto (DE: estratégia, tática, logística, engenharia, tecnologia) × discurso adaptado | revisão humana do brief |
| Roteiro | checklist de 15 itens (§3.3) | script de métricas antes da narração |
| Roteiro | ≤ 4 números falados por minuto por capítulo | contagem |
| Roteiro | causa nunca desmentida pelo painel | revisão cruzada fala × painel |
| Take | ≥ 3 dimensões nos takes de mecanismo | cada batida do plano declara as suas |
| Take | painel ≤ 3 grandezas + barra + relógio | revisão de still |
| Take | imagem congelada 0%; câmera parada ≤ 10% nos planos 3D | medidor de câmera (correlação de fase) |
| Take | cartão preto ≤ 10% do tempo e ≤ 3 s cada | plano de batidas |
| Take | **nunca reaproveitar o mesmo take de animação no vídeo**: outro trecho, outra velocidade ou espelho do mesmo clipe contam como reaproveitamento | agrupamento de takes por correlação |
| Objeto | as 4 perguntas (§5.4); estilo coerente; nada de close macro de modelo simples | revisão de still |
| Imagem | luminância mediana ≥ 100 nos abertos; acentos de facção preservados | régua de luz e cor |
| Qualidade | juiz separado dá nota de 0 a 10 aos stills-chave contra a referência; segue só com ≥ 8,5 | relatório do juiz |
| Áudio | nunca áudio real de controle de tráfego ou caixa-preta; música ~20 dB abaixo da voz no canal DE | mixagem medida em LU |
| Custo | minutos de G4 anotados por take; nenhum take caro sem ganho visível | plano de batidas |

---

## 8. Anti-padrões (o que fazíamos, com número)
1. **Número em fila falado como robô:** ~9 por minuto, sem régua.
2. **Uma dimensão por take, em fila:** cartão → mapa → 3D mudo.
3. **Mapa disfarçado de 3D:** 54–57% do vídeo em mapa; 9 de 12 amostras sobre a mesma base.
4. **Realismo caro como papel de parede:** 31 s de render único esticados por 8:47; o mesmo plano 17×.
5. **Câmera parada:** 60,6% dos quadros.
6. **Objeto de argila:** modelo cinza sem material, flutuando em névoa, árvore em cone.
7. **Esquema que não se constrói:** frase no centro, cartão vazio ("KAPAZITÄT PRO STRECKE" sem gráfico), texto cortado na borda, cinza sobre preto.
8. **Ressalva fechando bloco:** a energia cai no fim de cada bloco.
9. **"Parte 2" como comentário da parte 1:** quem chega pelo feed fica sem chão.
10. **Causa única em fala, desmentida pela tela.**

---

## 9. Procedimento de revisão (antes de cada etapa cara)
1. **Antes da narração:**
   - roteiro pelo checklist (§3.3) com métricas;
   - checagem de fato de cada número e causa contra o dossiê de fatos;
   - revisão adversarial: steelman → ≤ 5 objeções com dado → o que mudaria a posição → versão corrigida.
2. **Antes do render em escala:**
   - batedor curto só dos elementos novos;
   - folha de stills lado a lado com a referência e com a versão anterior;
   - nota do juiz ≥ 8,5;
   - medidor de câmera (% parado, % congelado);
   - régua de luz e cor.
3. **Antes de entregar:**
   - leitura do vídeo final a 20–24 fps com o mesmo medidor das referências;
   - agrupamento de takes (nenhum repetido);
   - cartão ≤ 10%;
   - arquivo com áudio conferido.
4. **Depois de publicar:** curva de retenção **por bloco** no Studio. Ela decide se a regra vale (queda concentrada nos pontos que a regra corrige) ou se é só piso.

---

## 10. Referências que sustentam os números
| Referência | O que mediu | O que ensinou |
|---|---|---|
| Short de reconstrução de acidente aéreo (canal pequeno, 576 mil em ~1 dia), leitura a 20 fps | 4 cortes em 154 s, 0% congelado, 0 cartão separado | gráfico dentro do take; painel vivo; compressão de tempo; desenho barato |
| Reconstrução longa de acidente aéreo (565 mil em ~1 dia), leitura a 24 fps | 149 takes distintos em 12:05, 3% repetido, 10,2 cortes/min, 22% de cartão de uma linha | método de direção: take único por frase, biblioteca de ângulos, dados ao vivo, explicação sobre o 3D; render simples em tempo real |
| Reconstrução de acidente aéreo com roteiro "últimos 60 s" (1,24 mi em 1 dia), transcrição | 0 casos paralelos; 7,4 ressalvas por mil palavras; tripé confirmado/reportado/desconhecido | arquitetura de roteiro de uma espinha só |
| Tutorial de shorts 3D realistas feitos com IA + Blender, leitura a 24 fps + transcrição | Short de referência de 31 s sem corte, 4,8% parado | método: medir a referência com o mesmo medidor do nosso render, juiz com nota, engenharia de render; "perfeito demais = falso" |
| Aviões e Músicas, Manual do Mundo e Space Today (9 vídeos, legendas) | 0,6–2,9 números/min; 14–18 palavras/frase; 0,9–4,3 falas ao espectador/min | checklist do roteiro agregador |
| Nossos vídeos (vídeo 14 v1 DE; reconstrução parte 2 ES) | ver §2, §3.2 e §8 | o que não fazer |

---

*Este documento é a fonte de verdade do princípio. Qualquer regra nova de produção dos canais 3D precisa dizer em qual camada (§2–§6) entra e qual dimensão ela cruza.*
