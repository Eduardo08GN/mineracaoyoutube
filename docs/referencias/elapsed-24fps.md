# Leitura ótica a 24 fps: Elapsed, "What if all Humans disappeared?" (05/11/2026)

O vídeo é de @ElapsedYT, feito em UE5, e é o único do canal: 192 mil views em 17 dias, com 414 inscritos. Dura 9:52 em 1080p30.
- Os arquivos estão em `D:/tmp/elapsed24/`: o vídeo, `leitura24.json`/`.txt`, as folhas `folha_1..4.jpg` (início, meio e fim de cada plano) e `ELAPSED_estrutura.jpg`.
- A medição foi feita com `D:/tmp/elapsed24/ler24.py`: diferença média entre quadros a 160 px, cortes por salto e por histograma, e tipo de câmera por fluxo óptico global (Farneback).

## Números

| | Elapsed | K17 v2 (nosso, DE) | Desmontando o Mundo (Reels) |
|---|---|---|---|
| movimento médio | **0,99** | 1,31 | 7,2 |
| quadros quase parados | **44%** | 46% | 6% |
| planos | **40 em 9:52** (4,7 cortes/min) | 59 | 13 cortes/min |
| plano mediano | **14 s** (30 planos acima de 10 s; o maior tem 35 s) | ~7 s | 0,5 s |
| câmera | 17 quase fixos, 15 "ação no plano", 3 push-in, 3 pan, 1 órbita, 1 pull-out | variada | sempre em movimento |
| áudio | trilha e ambiente contínuos, **sem narração e sem legenda automática**; -20 LUFS, LRA 17 | voz e efeitos | voz e música |

**Conclusão:** o Elapsed é lento na régua e mesmo assim prende. O dinamismo dele não vem da câmera. Vem de o **mundo mudar dentro do plano** (time-lapse) enquanto um **contador acelera**. Um plano fixo de 18 s não é morto quando nesse tempo passam 5 anos: um incêndio começa e acaba, a ponte enferruja e cai.

## A fórmula

1. **Um lugar só, visto ao longo do tempo:** uma cidade estilizada com uma ponte pênsil vermelha. A empatia vem de ser "a sua cidade" ("This is your city").
2. **Tempo em escala exponencial** dentro do mesmo plano:
   - 8,3 bilhões de humanos, depois 0;
   - segundos, minutos, horas (luzes, metrô, usina);
   - dias e meses (mato, inverno);
   - anos (incêndio, mudas, parque invadindo a rua);
   - décadas e séculos (prédios caem, a ponte afunda);
   - milênios (só muros, pirâmide);
   - eras do gelo (geleira raspa o vale);
   - 10 milhões de anos (a cidade vira camada de rocha);
   - depois o espaço (satélites, a bandeira desbotada na Lua, a Voyager, as ondas de rádio), e então volta à Terra: "life goes on".
3. **HUD fixo no alto à esquerda** (serifa clássica, branco):
   - rótulo pequeno "HUMANS GONE FOR";
   - número grande ("2 days", "10,000,000 years");
   - comparação humana embaixo ("LONGER THAN A LONG MOVIE", "LONGER THAN A LUNAR CYCLE", "LONGER THAN THE PRINTING PRESS"…);
   - e o gancho **"NEXT: THE LIGHTS GO OUT in 37 hours"**, uma contagem regressiva para o próximo acontecimento. É o dispositivo de retenção principal: o espectador sempre sabe o que vem.
   - No ato do espaço entra um segundo HUD à direita, "DISTANCE FROM HOME", e **"BY YOUR WATCH: 9 min 33 s"** (o tempo real que o espectador já assistiu).
4. **Legenda poética em serifa itálica,** centralizada embaixo, uma frase curta por batida ("The sun sets on an empty city." / "And the lights still come on."). Faz o papel de narração muda.
5. **Visual:** UE5 estilizado e saturado.
   - Copas rosa e laranja, água turquesa, céu azul com nuvens volumosas.
   - Profundidade de campo e névoa atmosférica, noite com janelas acesas.
   - O tempo e o clima mudam dentro do plano: dia/noite, neve, gelo.
6. **Fim emocional:** volta ao lugar do início, árvore e passarinho, "right where you started… life goes on".

## O que tiramos (filosofia, não literalidade)

- **O motor é a mudança de estado dentro do plano**, medida por um contador visível com comparação humana e um "PRÓXIMO" que puxa o espectador. Vale para qualquer "¿Qué pasaría si…?" que seja um processo no tempo (ou na distância).
- **Plano longo pode,** desde que algo mude a cada 2–4 s (luz, crescimento, queda, clima). Isso corrige a leitura de que "movimento = câmera rápida".
- **Um cenário principal bem feito vale mais que muitos cenários pobres:** o investimento vai em UM mundo com estados, não em 40 cenários.
- **O nosso será narrado em espanhol:** a legenda poética vira a fala, e a legenda na tela fica como subtítulo curto. O HUD e o "PRÓXIMO" em espanhol, com comparações hispânicas ("más que una telenovela entera", "más que el Imperio inca").
- **Não copiar:** nem o nome Elapsed, nem a ponte vermelha, nem o tema "humanos desaparecem" no vídeo 1, nem o layout idêntico do HUD.

## Stack: correção de 05/11 (Eduardo)

A versão anterior desta seção propunha Blender feito à mão e estava **errada**. O Elapsed serve só de **referência visual**. Segundo o Eduardo, ele é UE5 montado com **bibliotecas prontas do Fab** (low poly e estilizadas) e com automação inteligente, não modelado à mão. A referência de **dinamismo** do nosso What If ES é o What If Sim: ver `whatifsim-24fps.md`, que traz a stack corrigida.
