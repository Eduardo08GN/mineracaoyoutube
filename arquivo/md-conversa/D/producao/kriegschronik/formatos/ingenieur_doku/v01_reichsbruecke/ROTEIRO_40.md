# Reichsbrücke 1976 · roteiro, primeiros 40% + bíblia + esqueleto do resto

**Para quem continua (Opus):** os blocos 0, 1 e 2 abaixo estão prontos e são a régua de qualidade. Os blocos 3 e 4 estão em esqueleto (seção 5). Escreva-os no mesmo padrão: mesma voz, mesma densidade de ensino, mesma marcação de batida. Fatos só do `dossie.md`; o que está na lista "NÃO AFIRMAR" não entra.

**Alvo:** ~12 min, ~1.500 palavras em alemão (~125 palavras/min), ~100 batidas. Este arquivo cobre 0:00–4:55 (43 batidas, 559 palavras: ~4,5 min de fala a 125 palavras/min, mais as pausas de imagem).

**Título:** *Reichsbrücke 1976: Wiens größte Brücke fiel in die Donau – und fast niemand starb | Ganze Dokumentation*

---

## 1. Bíblia do vídeo (vale para os 100%)

### 1.1 A promessa
Quem assiste sai sabendo três coisas que não sabia: **como uma ponte pênsil carrega peso**, **por que concreto sem aço racha com o gelo** e **por que uma inspeção pode olhar sete vezes e não ver**. A história da noite é o fio; o ensino é o produto.

### 1.2 A voz
- Engenheiro velho contando a um amigo inteligente que não é da área. Calmo, exato, sem drama.
- Frases curtas. Uma ideia por frase. Verbo cedo.
- "Du" nunca; "wir" e "man" sim. Presente para a noite da queda, pretérito para a história.
- Toda grandeza abstrata ganha uma comparação de casa: corda de varal, garrafa no congelador, pilha de livros.
- Nunca: "unglaublich", "schockierend", "niemand ahnte". Nunca sofrimento descrito. Nunca culpado apontado.
- Cada bloco fecha com uma pergunta que o seguinte responde.

### 1.3 Regra de ouro do ensino
Cada conceito aparece em três tempos, sempre nesta ordem:
1. **a coisa de casa** (o espectador reconhece);
2. **a mesma coisa na ponte** (o 3D mostra);
3. **o número** (preso ao objeto, não num cartão).

### 1.4 Tipos de batida
| Sigla | O que é | Quem faz |
|---|---|---|
| `GV` | vídeo gerado (MiniMax), 3–4 s, um movimento só, plano aberto ou pessoa de longe/de costas | lote na G4, por prompt |
| `GI` | imagem gerada + técnica de edição (ver 1.5) | lote na G4 + Remotion |
| `3D` | o gêmeo da ponte por código (three.js no Remotion) | frente de código |
| `SK` | esquema a tinta do kit Kriegsmomente | frente de código |
| `KT` | mapa creme do kit | frente de código |
| `ZT` | régua de tempo / número / documento recriado | kit |

**Mistura-alvo:** GV+GI ~60%, 3D+SK ~25%, KT+ZT ~15%.

**Regras das geradas:**
- Estilo `{STIL}`: ilustração de época assumida, não foto. Texto do estilo, a colar em todo prompt GV/GI (ajustar depois do batedor e da leitura do concorrente):
  `hand-inked illustration with muted watercolor wash on warm cream paper, fine cross-hatching, 1970s Central European editorial illustration, soft grain, no text, no lettering, no logos`
- A ponte, quando precisa estar **certa**, vem do render do gêmeo 3D usado como quadro inicial do `GV`. Sem isso, a ponte só aparece longe, em silhueta ou na névoa.
- Pessoas: de longe, de costas ou em silhueta, uma ação só. Nunca close de mãos fazendo tarefa.
- Nunca reaproveitar take.

### 1.5 Técnicas de edição (marcadas em cada batida)
| Sigla | Técnica |
|---|---|
| `PX` | parallax 2,5D em camadas de profundidade, câmera atravessa |
| `RC` | recorte do objeto com contorno; dado ou linha passa atrás dele |
| `FA` | congela e anota: linha a tinta + ponto + número |
| `MC` | corte por semelhança de forma com a batida seguinte |
| `CT` | cortina antes/depois |
| `TD` | tela dividida: cena de um lado, corte técnico do outro |
| `FO` | foco muda de plano |
| `SR` | aceleração e freada |
| `AT` | camada de atmosfera (névoa do rio, poeira, chuva) |
| `LZ` | luz que varre (farol, amanhecer) |

Transição sempre motivada. Nada parado mais de 4 s. Som pontual no corte (metal, água, estalo), sem música.

### 1.6 HUD fixo
- **Régua longa** no rodapé: 1937 ——— 1976, com um marcador que anda.
- **Régua curta** (só nos blocos 0 e 3): 04:00 ——— 05:00, sem cravar o minuto da queda (as fontes divergem; "kurz vor 5").
- **Caminho da carga** (a partir do bloco 1): cinco pontos no canto, que acendem quando o narrador passa por eles: Fahrbahn · Hänger · Kette · Pylon · Pfeiler.

---

## 2. Bloco 0 · abertura fria (0:00–0:50)

### Texto (DE)
> Wien, Sonntag, der erste August 1976. Kurz vor fünf Uhr früh.
>
> Die Stadt schläft. Auf der Reichsbrücke, der größten Brücke Wiens, ist fast niemand unterwegs. Ein Linienbus. Eine Handvoll Autos.
>
> Dann gibt die Brücke nach. Nicht ein Teil. Die ganze Brücke. Zweihunderteinundvierzig Meter Stahl fallen in die Donau.
>
> Kein Erdbeben. Keine Explosion. Kein gerissenes Kettenglied. Das werden die Gutachter später ausschließen.
>
> Sieben Mal wurde diese Brücke in diesem Jahr geprüft. Sieben Mal fand man nichts.
>
> Der Fehler war da. Seit neununddreißig Wintern. Nur lag er an einer Stelle, an die kein Prüfer herankam.
>
> Um ihn zu finden, müssen wir zuerst verstehen, wie diese Brücke überhaupt stand.

### Batidas
| # | t | Tipo · técnica | O que se vê | Prompt / nota |
|---|---|---|---|---|
| 1 | 0:00 | GV · AT | Viena antes do amanhecer vista de cima, Danúbio largo, névoa sobre a água, a ponte longe em silhueta | `{STIL}, high aerial view of a sleeping city at dawn, wide river, low mist drifting over the water, distant silhouette of a large chain suspension bridge, cool blue hour light, slow drift of mist` |
| 2 | 0:05 | ZT | Data escrita à pena: "Sonntag, 1. August 1976"; a régua curta nasce | kit tinta |
| 3 | 0:09 | GV · LZ | Avenida vazia, um ônibus articulado de costas indo para a ponte, faróis varrendo o asfalto molhado | quadro inicial = render do gêmeo (portal da ponte ao fundo). `{STIL}, empty wide avenue before dawn, a 1970s articulated city bus seen from behind driving away toward a bridge portal, headlights sweeping the road` |
| 4 | 0:14 | 3D | O gêmeo inteiro em creme, lateral, calmo. Rótulo: "241 m" na corrente do vão central | 1º encontro com o gêmeo; câmera em avanço lento |
| 5 | 0:19 | 3D | A queda em tempo real, uma vez, sem corte e sem som até o impacto | animação por chaves no gêmeo (pilar cisalha, pilone desliza, vão cai) |
| 6 | 0:24 | GV · AT | Água do rio subindo em espuma e baixando, vista do nível da margem, sem a ponte no quadro | `{STIL}, river surface at dawn seen from the bank, a large surge of white water rising and settling, mist, no bridge visible` |
| 7 | 0:28 | SK · FA | Três ícones a tinta riscados um a um: tremor, explosão, elo partido | texto de tela: "ausgeschlossen" |
| 8 | 0:34 | ZT | Sete carimbos de vistoria batendo em fila num papel; o sétimo fica | "7 Prüfungen · 1976" |
| 9 | 0:39 | 3D · FO | O gêmeo de pé outra vez; a câmera desce até um pilar de rio e o foco passa da corrente para a pedra | prepara o corte do bloco 2 |
| 10 | 0:44 | ZT | A régua longa nasce: 1937 ——— 1976, com 39 flocos de neve pequenos em cima | "39 Winter" |
| 11 | 0:47 | 3D · MC | O pilar some em névoa; fica só a curva da corrente | a curva vira a corda da batida 12 |

---

## 3. Bloco 1 · como a ponte ficava de pé (0:50–2:50)

### Texto (DE)
> Eine Hängebrücke trägt wie eine Wäscheleine.
>
> Spannt man eine Leine zwischen zwei Wänden und hängt etwas daran, zieht die Leine an den Wänden. Je schwerer die Wäsche, desto stärker der Zug. Die Wände müssen halten.
>
> Bei einer Brücke ist die Leine eine Kette aus Stahl. Die Fahrbahn hängt daran, an senkrechten Stangen, den Hängern. Die Kette läuft über zwei Türme, die Pylonen. Und an den Enden zieht sie mit gewaltiger Kraft nach innen.
>
> Normalerweise fängt man diesen Zug mit riesigen Betonblöcken im Boden ab. So war auch die Reichsbrücke geplant.
>
> Doch man baute sie anders. Die Ketten wurden nicht im Boden verankert, sondern an der Brücke selbst, an den Enden der stählernen Fahrbahnträger.
>
> Das ist, als würde man die Wäscheleine nicht an zwei Wänden festmachen, sondern an den beiden Enden eines Bretts. Die Leine zieht, das Brett wird zusammengedrückt, und beides hält sich gegenseitig. Ingenieure nennen das eine unechte Hängebrücke.
>
> Es funktioniert. Im Oktober 1937 wird die Brücke eröffnet. Sie ist die drittgrößte Kettenbrücke Europas.
>
> Aber diese Bauweise hat eine Folge, die man leicht übersieht. Die Brücke hält sich selbst zusammen. Ihr ganzes Gewicht aber steht auf wenigen Punkten: dort, wo die Pylonen auf den Pfeilern im Fluss ruhen.
>
> Fahrbahn, Hänger, Kette, Pylon, Pfeiler. Jede Tonne nimmt diesen Weg. Und er endet auf einem Stück Beton, das von außen niemand sieht.
>
> Was war in diesem Pfeiler?

**A conferir antes da voz:** "drittgrößte Kettenbrücke Europas" não está no dossiê. Confirmar em fonte ou cortar a frase. O abandono dos blocos de ancoragem tem duas fontes; o motivo (solo mole, parecer de Terzaghi) tem uma só, e por isso o texto não dá o motivo.

### Batidas
| # | t | Tipo · técnica | O que se vê | Prompt / nota |
|---|---|---|---|---|
| 12 | 0:50 | GI · PX, MC | Quintal com varal entre dois muros, lençóis ao vento; a corda repete a curva da corrente | `{STIL}, a backyard clothesline stretched between two brick walls, white sheets hanging, the rope sagging in a gentle curve, morning light` |
| 13 | 0:56 | SK · FA | Sobre o varal congelado: setas de tração puxando os dois muros para dentro; as setas engrossam quando cai mais um lençol | o dado mora na corda |
| 14 | 1:04 | 3D | O varal vira o gêmeo por sobreposição: muros → blocos, corda → corrente | match de forma, 1 s |
| 15 | 1:08 | 3D | Peça por peça, cada uma acende com o nome a tinta: Kette, Hänger, Fahrbahn, Pylon | HUD "caminho da carga" nasce aqui |
| 16 | 1:18 | 3D | Fluxo de forças pela 1ª vez: tinta azul corre pela corrente (tração), vermelha desce pelos pilones (compressão) | espessura = força |
| 17 | 1:26 | 3D | Versão planejada: dois blocos enormes de concreto no solo seguram as pontas da corrente; a tinta azul entra neles | rótulo "geplant" |
| 18 | 1:33 | GV · AT | Canteiro de obras dos anos 30 visto de cima: margem do rio, guindastes, operários pequenos, vapor | `{STIL}, 1930s riverside construction site seen from above, steam cranes, timber scaffolding, tiny workers walking, river barges, haze` |
| 19 | 1:38 | 3D · CT | Cortina: "geplant" → "gebaut". Os blocos somem; as pontas da corrente sobem e prendem nas extremidades do vigamento | o momento-chave do bloco |
| 20 | 1:46 | GI · PX | Tábua de madeira com uma corda presa nas duas pontas e um peso pendurado no meio, sobre bancada | `{STIL}, a wooden plank on a workbench with a rope tied to both of its ends, a weight hanging from the middle of the rope, the plank slightly bowed` |
| 21 | 1:52 | SK · FA | Sobre a tábua: azul na corda puxando para dentro, vermelho ao longo da tábua apertando | as duas cores se fecham num circuito |
| 22 | 1:59 | 3D | O mesmo circuito no gêmeo: azul na corrente, vermelho no vigamento. Texto: "unechte Hängebrücke" | o circuito fecha sem tocar o solo |
| 23 | 2:07 | GV · AT | Inauguração de 1937 de longe: multidão pequena na cabeceira, bandeirolas, a ponte ao fundo na névoa | quadro inicial = render do gêmeo. `{STIL}, 1937 bridge opening ceremony seen from far away, small crowd at the bridgehead, bunting, hats, overcast light` |
| 24 | 2:12 | ZT | Régua longa: marcador em "10. Oktober 1937" | |
| 25 | 2:16 | GV | Bondes e carros dos anos 50 cruzando a ponte, vistos de lado e de longe | quadro inicial = render do gêmeo. `{STIL}, 1950s trams and small cars crossing a large chain bridge, seen from the riverbank far away, soft daylight` |
| 26 | 2:21 | 3D | O circuito azul e vermelho continua correndo; a câmera desce: todo o vermelho dos pilones converge em quatro pontos | os quatro pontos pulsam |
| 27 | 2:29 | 3D · FA | Close num dos quatro pontos: pilone → grelha de apoio → topo do pilar. Rótulo "Auflager" | 3ª escala do gêmeo |
| 28 | 2:36 | 3D | HUD do caminho da carga acende em sequência com a fala: Fahrbahn · Hänger · Kette · Pylon · Pfeiler; uma gota de tinta faz o percurso inteiro | |
| 29 | 2:44 | 3D · FO | A gota chega ao pilar e para na pedra. Foco no granito: liso, fechado, sem nada a ver | fecha com a pergunta |

---

## 4. Bloco 2 · o defeito escondido (2:50–4:55)

### Texto (DE)
> Von außen: Granit. Massive Blöcke, sauber gefügt. Ein Pfeiler, der aussieht, als hielte er ewig.
>
> Doch der Granit ist nur die Hülle. Dahinter liegt ein Sockel aus Beton. Und auf diesem Sockel ruht der stählerne Rost, über den der Pylon seine ganze Last abgibt.
>
> Beton hat eine Stärke und eine Schwäche. Drückt man ihn zusammen, hält er enorm viel aus. Zieht man an ihm, reißt er früh. Deshalb legt man Stahl hinein. Der Stahl nimmt den Zug, der Beton den Druck.
>
> In diesem Sockel lag kein Stahl. Er war unbewehrt. Und er war schlecht verdichtet: Im Inneren blieben Hohlräume.
>
> Durch Hohlräume kommt Wasser.
>
> Was Wasser im Winter tut, kennt jeder, der einmal eine volle Flasche im Gefrierfach vergessen hat. Wasser dehnt sich beim Gefrieren aus, um etwa ein Zehntel. Das Glas platzt.
>
> Im Pfeiler ist es dasselbe, nur langsamer. Das Wasser friert, drückt den Beton von innen auseinander, ein Riss entsteht. Im Frühjahr taut es, und in den Riss läuft neues Wasser. Im nächsten Winter wird er länger.
>
> Ein Winter. Zehn Winter. Neununddreißig Winter.
>
> Und der Granit davor bleibt glatt. Kein Riss dringt nach außen. Wer den Pfeiler prüft, sieht Stein, klopft auf Stein und geht weiter.
>
> Unter dem Auflager, genau dort, wo jede Tonne der Brücke ankommt, ist aus einem Block ein Gefüge aus Rissen geworden.
>
> Es fehlt nur noch der Moment, in dem es nachgibt.

**A conferir antes da voz:**
- "Hohlräume" traduz "schlecht verdichtet / unverdichteter Beton" (duas fontes). Não usar "Sand" nem "nach dem Krieg repariert" (uma fonte cada).
- "um etwa ein Zehntel": a água expande cerca de 9% ao congelar (física básica); manter "etwa".
- "klopft auf Stein" é imagem de linguagem; se a crítica de fatos achar que afirma método de inspeção, trocar por "sieht Stein und geht weiter".

### Batidas
| # | t | Tipo · técnica | O que se vê | Prompt / nota |
|---|---|---|---|---|
| 30 | 2:50 | GI · PX, AT | Pilar de rio visto de um barco, de baixo: blocos de granito, água batendo, névoa | `{STIL}, massive granite-clad bridge pier seen from a small boat at water level, large fitted stone blocks, river water lapping, mist, low angle` |
| 31 | 2:57 | 3D | O mesmo pilar no gêmeo; um plano de corte desce e abre o pilar ao meio | o dispositivo "corte do defeito" |
| 32 | 3:04 | 3D · FA | Corte anotado a tinta: Granit (casca), Betonsockel, Auflagerrost, Pylon | 4ª escala: material |
| 33 | 3:13 | SK | Dois blocos de concreto lado a lado: um apertado por uma prensa (aguenta, seta vermelha grossa); outro puxado pelas pontas (trinca cedo, seta azul fina) | a coisa de casa do concreto |
| 34 | 3:22 | SK · MC | No bloco puxado entram barras de aço; a seta azul passa para as barras e a trinca não abre | "Bewehrung" |
| 35 | 3:29 | 3D · TD | Tela dividida: à esquerda o soco como deveria ser (com armadura), à direita como era (sem); à direita aparecem os vazios | "unbewehrt · schlecht verdichtet" |
| 36 | 3:38 | 3D | Gotas entram pelos vazios e se acumulam; o corte fica úmido de dentro para fora | tinta azul-clara = água |
| 37 | 3:44 | GI · RC, SR | Garrafa de vidro cheia num congelador; geada cresce; a garrafa trinca. Recorte da garrafa com "+ 9 %" passando atrás | `{STIL}, a full glass bottle lying in a frosty freezer compartment, ice crystals, a crack running along the glass` |
| 38 | 3:53 | 3D | Dentro do corte: a água congela (branco), empurra, nasce uma fissura; degela, a água entra mais fundo | um ciclo completo, devagar |
| 39 | 4:03 | 3D + ZT · SR | O ciclo acelera; a régua longa corre de 1937 a 1976 e o contador de invernos sobe: 1 · 10 · 39. A rede de fissuras cresce a cada salto | os dois relógios e o corte no mesmo quadro |
| 40 | 4:16 | 3D · CT | Cortina de fora para dentro: por fora, granito liso idêntico ao de 1937; por dentro, a rede de fissuras | o paradoxo visual do vídeo |
| 41 | 4:27 | GV · AT | Inspetor de costas, de longe, numa passarela junto ao pilar, olha a pedra e segue andando | `{STIL}, a bridge inspector in a 1970s work coat seen from behind and from far away, walking along a narrow service walkway beside a granite pier, river below, overcast` |
| 42 | 4:34 | 3D · FA | Volta ao corte: o fluxo vermelho do pilone desce e chega exatamente à zona fissurada sob a grelha | carga + defeito no mesmo ponto |
| 43 | 4:45 | 3D | A câmera recua até a ponte inteira, de pé, ao entardecer. A régua longa para em "31. Juli 1976" | pausa antes da noite |

---

## 5. Esqueleto dos 60% restantes (para o Opus escrever)

### Bloco 3 · a última noite e a queda (4:55–8:30, ~450 palavras, ~35 batidas)
**Ensina:** por que a ponte caiu **inteira**. É a consequência do circuito fechado do bloco 1: sem ancoragem no solo, nada segura a corrente quando um apoio some.
- **Abre** com a régua curta e a madrugada: o ônibus atrasado, poucos veículos (não cravar quantos nem a hora).
- **Take eureka do vídeo:** a queda em câmera lenta no gêmeo, em 4 etapas, parando e anotando cada uma, com o fluxo de forças:
  1. o soco cisalha logo abaixo do apoio;
  2. o pilone escorrega;
  3. a corrente perde o ponto alto, e o azul não tem para onde ir;
  4. o segundo pilone é arrastado e o vão central desce inteiro.
- **Coisa de casa:** voltar à tábua com a corda do bloco 1 e tirar o calço de baixo de uma ponta. Tudo desce junto.
- **Contraste que explica o "fast niemand starb":** domingo antes das 5h contra um dia útil com milhares de veículos (o número tem uma fonte só: dizer "viele tausend").
- **O ônibus** fica sobre os escombros e o motorista sai ileso (confirmado). Uma morte, dita com sobriedade, numa frase.
- **Não usar:** telefonema anônimo, semáforos, "elevação" antes da queda, nome e frase do motorista (uma fonte).
- **Fecha com:** "Wie konnte man das sieben Mal übersehen?"

### Bloco 4 · por que ninguém viu, o que mudou e a contraprova (8:30–12:00, ~440 palavras, ~28 batidas)
**Ensina:** o limite de uma inspeção visual. O que não se vê por fora só se acha quebrando ou medindo por dentro.
- **Inspeções:** 7 vistorias em 1976, os peritos ainda nos vigamentos dois dias antes, a reforma geral em preparo. Olhava-se o **aço**. O interior do pilar não era examinável sem ensaio destrutivo.
- **A comissão:** TU Wien e TU Graz, cerca de 400 páginas, conclusão "nicht vorhersehbar". Dizer também, em uma frase, que décadas depois o tribunal de contas da cidade criticou a falta de inspeção dos pilares.
- **O dia seguinte** (curto, em mapa): Danúbio fechado à navegação, bairros ao norte sem água, gás e telefone por cerca de um dia.
- **Âncora:** no mesmo dia, à tarde, o acidente de Lauda em Nürburgring. Uma frase, sem hora.
- **Contraprova (◀◀):** a régua volta a 1937; o soco é refeito com armadura e bem compactado; os ciclos de gelo passam e o corte fica inteiro; o fluxo vermelho atravessa.
- **Ponte nova:** inaugurada em 8 de novembro de 1980, em concreto protendido (não dar vão nem comprimento: divergem).
- **Inspeção hoje:** citar o esquema atual (inspeção principal a cada 6 anos etc.) **sem** dizer que a norma nasceu deste acidente.
- **Fecho:** voltar à frase do começo: o defeito estava onde nenhum olho chegava. Última imagem: o granito liso, e por trás, em transparência, a rede de fissuras. Gancho do próximo vídeo em uma linha.

### Checklist de continuidade
- [ ] Varal, tábua com corda e garrafa voltam ao menos uma vez cada no resto do vídeo.
- [ ] HUD do caminho da carga aparece na queda (bloco 3) apagando ponto por ponto.
- [ ] A régua longa e a curta se encontram no instante da queda.
- [ ] Mistura final perto de 60/25/15; nenhuma sequência com mais de 3 batidas do mesmo tipo.
- [ ] Toda batida `3D` responde: "o que a frase diz que é abstrato, e como este take faz ver?"
