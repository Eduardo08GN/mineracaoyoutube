# Auditoria da VSL Upsell 1 (solda, FR)

18/11/2026. Versão viva (editável): https://claude.ai/artifact/LwXX4UtmaB5ccwMQzTprkb

## Resumo

O vídeo saiu fraco porque o processo pulou o começo: não houve VSL de referência medida, nem roteiro de edição, nem teste de um take antes de produzir tudo. O agente foi direto da copy para a montagem e conferiu só se o texto foi falado, não se o vídeo vende.

As cinco falhas que mais pesam, em ordem:

1. **Lip sync forçado.** O take foi gerado mudo no Veo Lite e a boca foi refeita depois por outro modelo. São duas gerações de IA empilhadas no rosto, que é onde o espectador olha. Nosso método não usa lip sync: o take já nasce falando.
2. **Sem referência e sem roteiro de edição.** Ninguém definiu, frase por frase, o que aparece na tela e por quê. O resultado é um rodízio de seis modos de cena, e não uma demonstração.
3. **Ritmo lento e uniforme.** Cada plano dura 3,0 s na mediana, contra 1,3 s da VSL de referência que medimos. E 42% dos quadros estão quase parados.
4. **Fala corrida.** São 216 palavras por minuto, sem nenhuma pausa maior que 0,9 s. O preço e a garantia passam sem respiro.
5. **Arte e HUD genéricos.** As telas do app entram como gravação crua dentro de um celular. Falta desenhar a informação: destacar o número que muda, o total, o PDF saindo.

O que o agente fez bem e deve manter: dados fictícios coerentes nas gravações da ferramenta, legenda casada palavra por palavra com o Whisper, montagem por etapas com retomada e registro de créditos.

Um aviso sobre os números: o arquivo medido veio pelo WhatsApp, que recomprime o vídeo. Resolução, taxa de bits e áudio mono podem ser do WhatsApp e não do original, então não entram como falha.

## Leitura ótica a 24 fps

O vídeo tem 2min23s e foi lido em 3.441 quadros. A coluna de referência é a VSL francesa de 20 min que medimos para a VSL de massagem (592 cenas).

| Medida | Esta VSL | Referência | Leitura |
| --- | --- | --- | --- |
| Planos | 47 | | |
| Duração mediana do plano | 3,0 s | 1,3 s | 2,3 vezes mais lento |
| Duração média do plano | 3,05 s | 2,0 s | média igual à mediana: ritmo de metrônomo |
| Planos acima de 4 s | 10 | raros | 6 deles estão no fechamento (1:46 a 2:23) |
| Quadros quase parados | 42% | | quase metade do vídeo sem nada se mexendo |
| Quadros idênticos ao anterior | 18% | | tela parada ou take de 24 fps posto em 30 fps |
| Velocidade da fala | 216 palavras/min | 150 a 170 | rápida demais para francês falado |
| Pausas acima de 0,6 s | 7, a maior de 0,9 s | | nenhum respiro antes do preço |
| Volume | −15,2 LUFS, variação de 3,9 LU | −16 LUFS | nível certo, dinâmica achatada |
| Pico | −0,6 dBFS | até −1,0 | sem folga, pode distorcer no celular |
| Silêncio abaixo de −40 dB | nenhum | | a música nunca sai |

Os trechos mais parados são 0:10 a 0:20 (70% dos quadros parados), 0:40 a 0:50 (66%) e 0:50 a 1:00 (61%). São justamente as telas da ferramenta, que deveriam ser o momento de demonstração.

O que a transcrição do vídeo final mostrou, para um ouvido nativo conferir:

| Tempo | O que se ouve | Problema provável |
| --- | --- | --- |
| 0:16 | «la bonne mesure, le bon prix» | o nome do produto foi traduzido ao pé da letra e soa como frase solta, não como nome |
| 0:30 | «un bras zéro» | «brasero» mal pronunciado pela voz sintética |
| 1:14 | «le filet» | arame de solda é «fil»; «filet» é rede ou rosca |
| 1:21 | «avec votre taxe» | o serralheiro francês diz «TVA» |
| 1:36 | «dix pas d'avant» | a expressão é «une longueur d'avance» |
| 1:50 | «réservé à ce qu'il prenne» | frase confusa na locução |

O que eu não medi: a qualidade visual do lip sync e do HUD. Essas duas leituras são do Eduardo, que viu o vídeo; eu trabalhei só com medidas, sem olhar as imagens.

## Falhas etapa por etapa

Cada item traz o que foi feito, por que prejudica e o que fazer no lugar.

### Antes da etapa 1: o que faltou

- **Referência medida.** O agente não escolheu nenhuma VSL de upsell que converte para medir e comparar. Sem alvo, «pronto» vira «o script rodou sem erro». O certo: baixar uma ou duas VSLs de referência, medir ritmo, enquadramentos, legenda e HUD, e escrever a gramática visual antes de produzir.
- **Levantamento de prontos.** O HUD, o celular flutuante e os cartões foram feitos à mão no ffmpeg. Existem modelos e bibliotecas prontos para moldura de celular, destaque de tela e contadores no Remotion. Nossa regra: procurar o pronto antes de construir.
- **Roteiro de edição.** Não existe um documento que diga, frase por frase, o que aparece e o que essa imagem prova. A linha do tempo saiu das durações do áudio e de um rodízio de modos. O certo: uma tabela frase → imagem → o que o espectador entende, aprovada antes de gerar qualquer take.
- **Teste de um take.** Os 9 takes e os 9 lip syncs foram feitos de uma vez. O certo: um take completo, do pedido ao resultado final, mostrado ao Eduardo. Só depois o lote.

### 1. Copy

- **Só traduziu.** Traduzir não é adaptar. O serralheiro francês fala de TVA, cotes, devis com «bon pour accord» e SIRET. Quando o vídeo erra o vocabulário do ofício, ele se denuncia como produto de fora, e a confiança cai antes da oferta. O certo: adaptação por alguém ou por um agente com o vocabulário do ofício no país, mais revisão de um nativo.
- **Nome do produto traduzido ao pé da letra.** «La bonne mesure, le bon prix» dito no meio da frase não soa como nome. O certo: decidir o nome no idioma e apresentá-lo na tela, com destaque, na hora em que é dito.
- **Dividir em 15 trechos pelo texto, não pela imagem.** A divisão «câmera» e «narração» foi feita antes de saber o que cada trecho mostra. O certo: o corte nasce do roteiro de edição.
- **Escassez sem lastro.** «Restam 5 vagas» para uma ferramenta digital só pode ir ao ar se o checkout cumprir isso. É decisão do Eduardo e está na revisão de copy em andamento.

### 2. Voz

- **Um único arquivo por trecho, sem escolha.** Voz sintética erra pronúncia e entonação de forma aleatória. Com uma tentativa só, o erro vai para o vídeo, como em «bras zéro». O certo: gerar várias versões de cada frase e escolher a melhor com medição (transcrição e nota de naturalidade).
- **Narração crua.** Sem controle de ritmo, a fala saiu a 216 palavras por minuto. Venda precisa de pausa: antes do preço, depois da garantia, antes do botão. O certo: marcar as pausas no texto e conferir a velocidade antes de montar.
- **A voz não é do personagem.** A voz veio de um lugar e o rosto de outro, e depois foram costurados. Isso é a raiz da falha 4.

### 3. Takes de câmera

- **Ferramenta fora do padrão.** Os takes saíram do Flow com o Veo 3.1 Lite. Nosso padrão para vídeo de IA é o Google Vids, com a foto do personagem em «Ingredientes» e a fala entre aspas no pedido, em takes de até 10 s. O take já sai com voz e boca certas, no rosto do personagem.
- **Modelo Lite para o rosto.** O rosto é o que segura a atenção numa VSL. Economizar justamente ali custa mais caro que os créditos poupados.
- **Todos os takes da mesma foto e do mesmo enquadramento.** O espectador vê nove vezes a mesma imagem. A referência alterna três enquadramentos e dá zoom dentro do próprio take a cada frase. O certo: dois ou três retratos-âncora do mesmo personagem (bancada, close, em pé com a peça) e cortes com aproximação.
- **Take com legenda queimada.** O c08 teve de ser refeito. O pedido precisa terminar sempre com a proibição de texto na imagem. Essa armadilha já está documentada no nosso pipeline.
- **Sem conferência de cada take.** O certo: transcrever cada take, comparar com o texto pedido e olhar um quadro para conferir rosto e roupa.

### 4. Lip sync

Esta etapa não deveria existir.

- **Por que prejudica.** O modelo de lip sync redesenha só a região da boca, em baixa resolução, e cola de volta no rosto. A boca fica mais mole que o resto da imagem, os dentes mudam de um quadro para outro e o movimento do queixo não acompanha o corpo. O espectador não sabe dizer o que está errado, mas sente que é falso. Numa VSL, isso derruba a confiança no vendedor.
- **Por que é erro de método.** A placa de vídeo serve para trabalhar ingredientes prontos: melhorar resolução, interpolar, montar. Ela não serve para consertar um take que nasceu errado. Se o take precisa de conserto na boca, o take está errado e deve ser gerado de novo já falando.
- **Sinal de alerta ignorado.** O agente precisou ampliar a boca para conferir a sincronia. Quando a conferência exige lupa, o método é frágil.

### 5. Gravações da ferramenta

- **Acerto:** navegador automático em tela de celular, com dados fictícios coerentes e o PDF real da ferramenta. Manter.
- **Gravação crua não é demonstração.** As telas respondem por boa parte dos 42% de quadros parados. A tela aparece, mas nada conduz o olho: não há dedo tocando, campo sendo digitado, número mudando em destaque. O certo: cada gravação mostra uma ação e um resultado. Digitar 3,40, ver a lista de cortes mudar, ver o total subir.
- **Celular flutuando em vídeo vertical.** O quadro já é um celular na mão do espectador. Um celular menor dentro dele joga fora área de tela e deixa o texto do app pequeno. O certo: tela cheia com aproximação no campo que importa.

### 6. Legendas

- **Acerto:** cartões curtos, casados com o tempo de cada palavra.
- **Só duas cores de destaque.** Latão para palavra-chave e verde para dinheiro não cobrem a dor. A referência usa cor por função: vermelho para perda e erro, verde para ganho, amarelo para ênfase. Esta copy tem dor clara (aço jogado fora, medida errada) e ela passa sem marca.
- **Legenda como única arte.** O «3 m → 3,40 m» grande é o melhor momento gráfico do vídeo e é o único. Os outros números da copy (menos de um minuto, 18,90 €, 15 dias) pedem o mesmo tratamento.

### 7. Montagem

- **Rodízio de modos.** Seis modos de cena distribuídos pelas 41 cenas dão variedade de forma, mas não de conteúdo. O espectador percebe o padrão em 30 segundos. O certo: a imagem é escolhida pelo que a frase precisa provar.
- **Ritmo de metrônomo.** Média e mediana iguais (3,0 s) mostram que quase todo plano tem o mesmo tamanho. Ritmo bom alterna: rajada de planos curtos na dor, plano mais longo na demonstração, corte seco no preço.
- **Fechamento arrastado.** Seis dos dez planos longos estão de 1:46 em diante, na oferta. É onde a atenção mais cai e onde o vídeo deveria acelerar e empilhar prova: preço, comparação com o disco de corte, garantia, botão.
- **Três músicas em 2min23s.** Trocar de música a cada bloco quebra a continuidade num vídeo curto. Uma trilha só, baixa, que sobe no fechamento, ou nenhuma. E a música nunca sai: não há um silêncio no vídeo inteiro para dar peso a uma frase.
- **HUD básico** (leitura do Eduardo). Selo, cartão de PDF e seta são enfeites soltos, sem sistema: sem família de tipos, grade, paleta nem animação de entrada e saída coerentes entre si. O certo: definir o sistema visual numa folha antes de montar, e fazer a arte no Remotion com componentes prontos, não com filtros do ffmpeg.
- **Possível trepidação.** 18% dos quadros repetem o anterior. Parte é tela parada. Vale conferir se os takes de 24 fps foram postos numa linha do tempo de 30 fps, o que duplica um quadro a cada cinco e deixa o movimento aos trancos.

### 8. Conferência

- **Conferiu o processo, não o produto.** A folha de quadros, a boca ampliada e o Whisper respondem «o vídeo saiu como eu mandei?». Nenhuma conferência responde «o vídeo é bom?». O certo: comparar lado a lado com a referência, medir ritmo e movimento, e mostrar ao dono antes de entregar.
- **92% de igualdade aceito como aprovação.** Os 8% restantes foram descartados como «números e palavras de mesmo som». Em vídeo de venda, número é preço, medida e prazo. Cada diferença precisa ser lida uma a uma. Foi assim que «filet» e «bras zéro» passaram.
- **Quem produziu foi quem aprovou.** O agente julgou o próprio trabalho. O certo: um revisor separado, que não viu o processo, recebe só o vídeo e a referência.

### 9. Entrega

- **Acerto:** uma pasta só com o arquivo final e a capa, scripts separados, créditos anotados.
- **Lições registradas depois, não regras lidas antes.** As lições foram para a seção 9 de um README. O que evita a repetição é o agente ler as regras no começo de cada produção e dizer o que vai reaproveitar.

## Regras para as próximas VSLs

O princípio por trás de todas: o produto é a compreensão e a confiança do espectador, não o vídeo montado. A ordem de investimento é copy, depois desenho da informação, depois animação, e acabamento por último.

A ordem de trabalho, com um portão em cada passo:

1. **Referência.** Medir uma ou duas VSLs que convertem no mesmo tipo de oferta: duração dos planos, enquadramentos, legenda, HUD. Escrever a gramática visual em uma página.
2. **Copy adaptada.** Vocabulário do ofício no país, nome do produto decidido, pausas marcadas, revisão de nativo. Aprovação do dono antes de qualquer imagem.
3. **Roteiro de edição.** Uma tabela frase → imagem → o que o espectador entende. Toda frase de mecanismo mostra uma ação e um resultado na tela.
4. **Levantamento de prontos.** Procurar modelos e componentes prontos para HUD, moldura e destaque antes de escrever código.
5. **Teste de um take.** Um trecho completo, do pedido ao resultado final, comparado lado a lado com a referência e mostrado ao dono. Só depois o lote.
6. **Takes já falando.** Gerados no Google Vids a partir do retrato-âncora, com a fala entre aspas e sem texto na imagem. Dois ou três enquadramentos. Nunca lip sync por cima.
7. **Conferência de cada take.** Transcrição comparada com o pedido, e um quadro olhado para rosto e roupa. Take errado é gerado de novo, não consertado.
8. **Montagem pela copy.** Ritmo que alterna, mediana de plano perto de 1,5 a 2 s, aceleração na oferta, uma trilha só ou nenhuma, pausa antes do preço.
9. **Conferência do produto.** Medir ritmo, movimento e velocidade da fala contra a referência. Ler uma a uma as diferenças da transcrição. Revisor separado de quem produziu.
10. **Aprovação do dono** antes de considerar entregue.

Metas numéricas para o próximo vídeo, tiradas desta medição:

| Medida | Hoje | Meta |
| --- | --- | --- |
| Duração mediana do plano | 3,0 s | 1,5 a 2,0 s |
| Quadros quase parados | 42% | abaixo de 20% |
| Velocidade da fala | 216 palavras/min | 150 a 170 |
| Pausa antes do preço | nenhuma | 0,8 s ou mais |
| Planos acima de 4 s na oferta | 6 | nenhum |
| Músicas | 3 | 1 ou nenhuma |
| Lip sync | 9 takes | nenhum |

Referências do nosso método neste repositório: `docs/vsl-massagem-espanha/02-pipeline-avatar-google-vids.md` (takes de avatar no Google Vids) e `docs/vsl-massagem-espanha/03-edicao-video-longo.md` (gramática visual medida da VSL de referência).
