# Learjet P3 (ES): composição das cenas, v1 (04/11)

O modelo está congelado: Learjet 45 simples, atlas de duas cores, janela em disco. Toda a energia vai para estes planos.
Stack: teardown (three.js r186) + GSAP na G4. HUD e números entram no próprio quadro. Fala: `07_greenacres_p3/voz`.

## Biblioteca de enquadramentos (10)
Cada plano usa um destes, com lente e movimento próprios. O mesmo enquadramento não aparece duas vezes seguidas.

| # | Nome | Lente | Câmera | Uso |
|---|---|---|---|---|
| E1 | Teleobjetiva de perseguição | 200 mm, de trás e de baixo | segue com atraso; o avião deriva no terço | voo normal, tensão crescendo |
| E2 | Passagem rasante | 35 mm, câmera parada | o avião cruza o quadro e passa perto da lente | ritmo, corte forte |
| E3 | Avião pequeno no céu | 85 mm, avião em 1/10 do quadro | dolly lento lateral | escala, solidão, a tempestade em volta |
| E4 | Detalhe da história | 50 mm, só a cauda | órbita de 40° em volta da peça | profundor, estabilizador, compensador |
| E5 | Vista de cima | 24 mm, quase vertical | desce em espiral | inclinação de 60°, giro à direita |
| E6 | Olho do chão | 24 mm, a 1,5 m do asfalto | tilt para cima | o que o motorista via |
| E7 | Mapa oblíquo | 35 mm, 45° sobre o NAIP | voo da câmera com dolly contínuo | anel de 2–6 km, trilha, cratera |
| E8 | Corte no ar | 50 mm, fundo escuro e névoa | câmera parada, objeto que gira | mecanismo (Mach tuck, pressão) |
| E9 | Dentro da nuvem | 28 mm, névoa densa | aproximação em balanço | perda de horizonte |
| E10 | Plano geral da tempestade | 18 mm, linha de Cb | grua alta e lenta | radar, cimas acima do avião |

**Regras:**
- terços sempre, com o avião no terço oposto ao HUD e ao texto (máscara do objeto);
- câmera nunca parada mais de 1,5 s, exceto o E2, que corta;
- turbulência GSAP (`turbR/P/Y`) com amplitude conforme a fase: cruzeiro 0,3°, curva 0,8°, mergulho 1,8°;
- atmosfera: linhas de velocidade no mergulho, nuvem correndo no fundo e névoa por profundidade;
- detalhe só onde está a história: a cauda (E4), a cratera e as viaturas (E7) e o HUD de 5 números.

## Planos por bloco

### 01. Abertura fria (≈ 30 s, 7 planos)
| Frase | Plano | O que demonstra |
|---|---|---|
| "Treinta y cinco mil pies sobre Florida." | E10: grua alta sobre a linha de tempestade; o avião é um ponto na luz | onde e quando |
| "Un jet ejecutivo con nueve personas…" | E1: teleobjetiva fechando no jet | quem |
| "empieza a caer." | E2: o avião passa pela lente e mergulha para fora do quadro | a virada |
| "Gira hacia la derecha, cada vez más inclinado…" | E5: de cima, roll crescendo (dado ADS-B), HUD do rumo | o giro à direita |
| "…y llega al suelo casi en vertical." | E3 invertido: de baixo, o avião vertical contra as nuvens; corta antes do solo | a vertical, com respeito |
| "una pieza de su cola se suelta…" | E4: o estabilizador esquerdo acende, solta e fica para trás | a pergunta do vídeo |
| "Los datos públicos de este vuelo…" | E7: sobe para o mapa, a trilha laranja termina num ponto | promessa |

### 02. Lo nuevo (≈ 45 s, 7 planos)
| Frase | Plano | O que demonstra |
|---|---|---|
| "¿Qué apareció este martes?" | E7: o mapa à luz do dia, a câmera desce na direção da cratera | lugar |
| "…el timón de profundidad izquierdo, en tres pedazos." | E8: a cauda isolada no ar; a peça se divide em 3 | a prova |
| "El timón de profundidad es la parte móvil…" | E4: órbita, a superfície move ±10°, o nariz de um avião-fantasma sobe e desce | o que a peça faz |
| "Esos pedazos no estaban en el cráter." | E7: a câmera sobe da cratera (fumaça) | contraste |
| "Estaban a entre dos y seis kilómetros." | E7: o anel tracejado nasce da cratera, com régua de km | distância |
| "…todavía no saben si esa pieza hizo caer el avión…" | E8: duas setas alternadas ("pieza → caída" / "caída → pieza") | a dúvida |
| "…fuimos a buscar los datos completos del vuelo." | E3: o avião no céu, com os pontos ADS-B aparecendo atrás dele | o método |

### 03. El vuelo (≈ 60 s) e 04. El segundo a segundo (bloco contínuo)
- O 04 é **um plano-sequência** com o instrumento vivo (HUD de 5 números). A câmera troca de enquadramento por **movimento**, não por corte: E1 → E5 → E9 → E1, guiada pelas âncoras da fala.
- "sesenta grados": E5 com a asa apontando para o chão; uma linha de horizonte tracejada mostra o ângulo.
- "en un giro coordinado, el peso se siente hacia el asiento": E9 dentro da nuvem; um boneco na cabine com a seta de peso para baixo, sem horizonte.
- "cruza otra raya: su velocidad máxima": barra de velocidade no HUD passando a marca vermelha VMO, com um flash curto.
- "treinta y dos mil seiscientos cuarenta pies por minuto, y se queda clavado": o número do HUD trava e pisca; ao lado, um velocímetro chega ao tope.
- "el GPS siguió transmitiendo": o último ponto aparece quase sobre a cratera (corte para E7).

### 05. El número (≈ 25 s, 3 planos)
| Frase | Plano | O que demonstra |
|---|---|---|
| "…unos doscientos metros cada segundo." | E8: régua vertical de 200 m com relógio de 1 s | a taxa |
| "Es la Torre Latinoamericana…" | E6 adaptado: a torre (modelo pronto, chapado) ao lado da régua; o avião passa a altura dela em 1 s | escala conhecida |
| "…más del noventa por ciento de la velocidad del sonido." | E2: passagem rasante com linhas de velocidade no máximo e o número 0,9 Mach | sensação |

### 06. Cómo puede pasar (≈ 75 s, mecanismo: 3 takes de física sem anunciar "física")
| Frase | Plano | O que demonstra |
|---|---|---|
| "rincón del ataúd" | E8: duas curvas (estol e Mach) que se fecham com a altitude, e o avião como cursor | a margem que estreita |
| "el aire se acelera hasta superar la velocidad del sonido en una zona" | E8: corte da asa em flecha, com a zona supersônica em cor sobre o extradorso | onde nasce |
| "el punto donde el ala empuja… se desplaza hacia atrás" | E8: seta de sustentação deslizando para trás; o nariz baixa sozinho | Mach tuck |
| "compensador de Mach" | E4: o estabilizador corrige; contador "auto" | a defesa |
| "Este avión tiene la cola en forma de te." | E4: órbita de 90° em volta da cauda em T; as peças acendem em sequência (deriva, estabilizador, profundor) | anatomia |
| "Ahora mira la barra sobre la cola." | E4: barra de pressão sobre a cauda subindo com v² | 2× o limite |

### 07. El entorno (≈ 35 s, 4 planos)
| Frase | Plano | O que demonstra |
|---|---|---|
| "el globo sonda que se lanza desde Miami" | E10: balão subindo com o perfil de temperatura ao lado | dado do dia |
| "una línea de tormentas…con cimas más altas que el avión" | E10: a cortina do radar (NEXRAD) como volume translúcido | escala da tormenta |
| "El avión vuela dentro de la zona…" | E3: o avião pequeno dentro da cortina | dentro, não acima |
| "ese viento importa…" | E7: setas de vento do oeste por altitude | gancho para o 08 |

### 08. Lo que leen los investigadores (≈ 70 s, 6 planos)
| Frase | Plano | O que demonstra |
|---|---|---|
| "Mira este anillo." | E7: o anel de 2–6 km, com a trilha real passando por cima | geometria |
| "Una pieza pesada sigue casi el camino…" | E7: uma pedra em parábola seguindo a trilha | balística |
| "Una pieza ligera y plana frena… gira como una hoja" | E8: a placa caindo em folha, empurrada pelas setas de vento | a diferença |
| "…calcular hacia atrás en qué punto…" | E7: linha pontilhada da peça no chão de volta para a trilha (retroprojeção) | o método |
| "videos de coches que pasaban por la avenida" | E6: olho do chão na avenida; o avião aparece um instante, quase vertical | testemunho |
| "el cráter, inundado por la lluvia" | E7: a cratera com água, viaturas e telhados; câmera baixa e respeitosa | o próximo passo |

### 09. Cierre (≈ 45 s, 4 planos)
| Frase | Plano | O que demonstra |
|---|---|---|
| "Confirmado / Calculado / Desconocido" | E8: três colunas que surgem sobre um fundo de céu desfocado; cada item acende quando é falado | recapitulação |
| "el número que se queda quieto en la pantalla…" | o HUD congela o 32.640 e a câmera continua caindo | a lição |
| "murieron nueve personas" | E3: o céu vazio, sem o avião, depois a luz da manhã | respeito |
| "el vídeo anterior está aquí" | tela final | gancho |

## Ordem de execução
1. Fazer o batedor da biblioteca: 10 stills, um por enquadramento, com o avião congelado, e comparar lado a lado com os quadros do Reconstructed em `ref/`.
2. Montar os blocos 01 e 04 primeiro, porque são o gancho e o plano-sequência; depois o 06 (mecanismo).
3. Revisar por folha de quadros. Critério: "ajuda a entender?", e nunca "o avião está bonito?".
