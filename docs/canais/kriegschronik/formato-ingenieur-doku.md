# Formato "Ingenieur-Doku": catástrofes de engenharia (canal ex-KriegsChronik, DE)

**Status (13/11/2026):** plano de formato e de produção do vídeo 1, escrito para ser executado numa conversa nova (maestro Opus). Nada foi produzido. Base: `docs/pipeline-kriegsmomente.md` (K19 a K21) e `docs/canais/kriegschronik/catastrofes-tecnicas.md` (nicho e fórmula de título).

**O que muda em relação ao Kriegsmomente:** na guerra, o herói é a manobra no mapa. Aqui, o herói é **uma estrutura**. O formato inteiro gira em volta de um único modelo 3D dela, que o espectador aprende a ler e depois vê falhar.

## 0. Atualização de 13/11: versão enxuta do vídeo 1 (vale sobre as seções abaixo)
Decisões do Eduardo depois deste plano:
- **Duração: ~12 min** (~1.500 palavras em alemão, ~100 batidas).
- **Mistura:** ~60% imagem e vídeo gerados (MiniMax na G4, lote por prompt), ~25% 3D e esquema por código, ~15% mapa e réguas de tempo. Take gerado custa uma linha de prompt; take por código custa um agente. O 3D fica só onde o vídeo ensina o mecanismo, porque vídeo gerado erra a física.
- **Colapso:** animado por chaves no gêmeo, sem simulação física. A simulação fica para o vídeo 2, se o 1 performar.
- **Edição das geradas:** parallax 2,5D, recorte com contorno, congela e anota, corte por semelhança, cortina antes/depois, tela dividida, foco que muda, aceleração, atmosfera e luz que varre. Cada batida do roteiro traz a sigla da técnica.
- **MiniMax:** planos abertos e pessoas de longe ou de costas, uma ação por take de 3 a 4 s. Quando a ponte precisa estar certa, o quadro inicial é o render do gêmeo.
- **Regra de ensino:** cada conceito em três tempos: a coisa de casa, a mesma coisa na ponte, o número preso ao objeto.
- **Famílias de código:** 4 em vez de 9. **Teto:** ~4 h e ~3 M tokens.

Material do vídeo (fora do repo): `D:/producao/kriegschronik/formatos/ingenieur_doku/v01_reichsbruecke/`, com `ABERTURA.md`, `dossie.md` e `ROTEIRO_40.md` (bíblia, primeiros 40% escritos e esqueleto do resto).

## 1. Os seis dispositivos do formato
1. **Gêmeo da estrutura (Bauwerk-Zwilling).** Um só modelo 3D, com medidas reais, usado do começo ao fim em quatro escalas: cidade, obra inteira, elemento (pilar, corrente, apoio) e material (corte). O espectador nunca se perde, porque é sempre o mesmo objeto.
2. **Fluxo de forças (Kraftfluss).** A carga desenhada dentro da estrutura como tinta que corre: compressão em vermelho-ferrugem, tração em azul-tinta, com espessura proporcional à força. É o abstrato do nicho tornado visível (`docs/take-explicativo.md`). Quando uma peça falha, a tinta procura outro caminho e não acha.
3. **Corte do defeito escondido.** O elemento é aberto em corte e mostra o que ninguém via por fora. Um contador preso ao corte marca o tempo de dano (invernos, ciclos de gelo, anos).
4. **Dois relógios.** Uma régua longa (décadas, da inauguração ao colapso) e uma régua curta (a última noite, minuto a minuto). As duas ficam no HUD e se encontram no instante da queda.
5. **Colapso simulado.** A queda é uma simulação física do próprio gêmeo, não uma animação à mão. Passa uma vez em tempo real e depois em câmera lenta, com o fluxo de forças por cima, parando em cada etapa da cadeia causal.
6. **Contraprova.** Volta no tempo (◀◀) e mostra o que teria segurado: a peça certa montando no lugar e a tinta voltando a correr. Fecha com a regra que nasceu do acidente.

## 2. Composição por batida
| Tipo | Fatia | Como é feito |
|---|---|---|
| 3D do gêmeo (escala, forças, corte, colapso, contraprova) | ~40% | Blender Cycles na G4 para os takes-herói; three.js no Remotion para os takes de leitura com HUD |
| Ilustração a tinta colorida (cenas com pessoas, cidade, obra) | ~20% | Qwen-Image em traço de tinta e aguada sobre papel creme, push 2,5D |
| Esquema a tinta | ~15% | Kit tinta do Kriegsmomente (linha-guia com ponto, serifa itálica) |
| Mapa | ~10% | Mapa creme e mapa sobre relevo (kit K18 a K20) |
| Réguas de tempo e documento recriado (manchete, laudo) | ~10% | Remotion, tipografia de época, texto fiel à fonte |
| Cartão de número | ≤ 5% | Kit |

**Por que ilustração e não "foto de época" gerada:** o tema é recente e existem fotos reais com direito autoral. Imagem gerada com cara de foto passaria por documento falso. A cena com gente é sempre ilustração assumida, em traço de tinta. Foto real só se for de domínio público ou com licença, com crédito na descrição.

**Regras herdadas, sem mudança:**
- tema creme;
- câmera nunca parada mais de 4 s;
- nunca reaproveitar take: cada batida 3D tem render próprio, inclusive cada ângulo da simulação;
- overlay no espaço vazio;
- sem música; voz e efeitos pontuais, −14 LUFS;
- créditos só na descrição;
- legendas com até 17 caracteres por segundo;
- foco no mecanismo, sem sofrimento, sem culpados políticos.

**Duração:** 24 a 26 min (~3.200 a 3.400 palavras em alemão, ~210 batidas). É o dobro de palavras do K21, e por isso o orçamento de frentes da seção 6 é maior.

## 3. Vídeo 1: Reichsbrücke, Viena, 1º de agosto de 1976
**Título principal:** *Reichsbrücke 1976: Wiens größte Brücke fiel in die Donau – und fast niemand starb | Ganze Dokumentation*

**Títulos B e C para o teste A/B** (confirmar os fatos no dossiê antes de usar):
- *Reichsbrücke 1976: 39 Jahre hielt sie – dann fiel sie in Sekunden | Ganze Dokumentation*
- *Warum stürzte die Reichsbrücke ein – obwohl kein Sturm, kein Schiff und keine Last sie traf? | Ganze Dokumentation*

**O que a busca de 13/11 já confirmou** (ORF, Wikipedia, vienna.at):
- colapso em 1º de agosto de 1976, pouco antes das 5h;
- um morto;
- um ônibus de linha e um carro estavam na ponte;
- a nova ponte abriu em novembro de 1980;
- o acidente gerou a regra austríaca de inspeção de pontes.

**O que as fontes contam de forma diferente e o dossiê precisa fechar:** a causa exata. Aparecem "água que entrou num pilar", "material de má qualidade" e "falha de fundação". O laudo oficial e a literatura técnica decidem. Nenhuma frase do roteiro sobre a causa sai antes disso.

**Gancho extra a confirmar:** o acidente de Niki Lauda em Nürburgring foi no mesmo dia. Serve como âncora de memória do público austríaco e alemão, em uma frase.

### Espinha em 7 blocos
| # | Bloco | Tempo | O que o espectador vê |
|---|---|---|---|
| 0 | Abertura fria | 0:00–1:00 | Madrugada, a ponte vazia, o ônibus entra. O colapso em tempo real, uma vez. A pergunta: sem tempestade, sem navio, sem carga. Por quê? |
| 1 | A ponte | 1:00–5:00 | O gêmeo na escala da cidade. Como uma ponte de correntes trabalha: o fluxo de forças do tabuleiro às correntes, das correntes aos pilares. Tudo passa por dois pontos. |
| 2 | O defeito escondido | 5:00–10:00 | Corte do pilar: o que havia por dentro, o que entrou, o que os invernos fizeram. A régua longa corre. |
| 3 | Por que ninguém viu | 10:00–14:00 | O que uma inspeção olhava e o que ficava fora do alcance. O paradoxo do título mora aqui. |
| 4 | A última noite | 14:00–19:00 | A régua curta, minuto a minuto. O colapso em câmera lenta, etapa por etapa, com o fluxo de forças. Take eureka: por que caiu tudo de uma vez. |
| 5 | O dia seguinte | 19:00–23:00 | O Danúbio bloqueado, a cidade cortada, o que passava pela ponte. Mapa de Viena. A decisão de reconstruir. |
| 6 | A lição | 23:00–26:00 | A contraprova (◀◀). A regra de inspeção que nasceu. A ponte nova. Frase final e gancho do próximo vídeo. |

Cada bloco fecha com uma pergunta aberta que o bloco seguinte responde. O conteúdo dos blocos 2 e 3 depende do dossiê.

## 4. As duas G4: o que vai para a GPU
| Trabalho | Onde | Por quê |
|---|---|---|
| Simulação do colapso (corpos rígidos com restrições) e render Cycles dos takes-herói, vários ângulos em paralelo | **G4-1** | É o diferencial visual; 96 GB permitem várias cenas na fila ao mesmo tempo |
| Ilustrações a tinta (Qwen-Image) + fiscal Qwen3-VL com refação | **G4-1**, depois do Cycles | Mesma placa, fila contínua |
| Narração Qwen3-TTS (voz nova do canal, a aprovar) + QA Whisper | **G4-2** | Curta, libera cedo |
| Stills e `tsc` das frentes Remotion/three.js | **G4-2** | As frentes pedem stills o tempo todo; não disputam a placa do Cycles |
| Render final Remotion em fatias | **G4-1 e G4-2** | Metade das batidas em cada uma; junta no ffmpeg |
| Interpolação de quadros e upscale dos takes Cycles | G4-2 | Só se o batedor provar ganho: renderizar menos quadros e interpolar |

A G4-2 lê as imagens de stack por link do Drive da conta Ultra. Esses links ainda não existem (`docs/pendencias-otimizacao-avatar-g4.md`, P7). Sem eles, a G4-2 instala do zero.

## 5. Portões e batedor
**Levantamento de prontos (portão 1), antes de modelar:**
- modelo da ponte ou de ponte de correntes em Sketchfab/Fab; plantas e medidas em fonte pública;
- simulação de colapso no Blender: Cell Fracture (nativo) e o add-on Bullet Constraints Builder (a provar; foi feito para colapso estrutural);
- visualização de forças: buscar pronto antes de escrever shader;
- o kit do K21 para tudo que é creme, tinta, mapa e HUD.

**Batedor curto, só do que é novo** (stills, lado a lado com um quadro do Letzte Stunden):
1. o gêmeo em creme, na escala da obra;
2. o corte do pilar;
3. o fluxo de forças;
4. três quadros da simulação do colapso;
5. duas ilustrações a tinta (ônibus na ponte, a cidade de manhã);
6. três candidatas de voz.

**Portões do Eduardo:**
- **Portão 0:** batedor e voz.
- **Portão A:** roteiro e títulos.
- **Portão B:** folha de contato por família.

## 6. Fluxo de produção
| # | Etapa | Quem | Saída |
|---|---|---|---|
| 0 | Infra: links de leitura da G4-2, imagem da stack no Drive, nome e identidade novos do canal | maestro + Eduardo | G4-2 pronta |
| 1 | Dossiê: fato → fonte, com o laudo da causa, medidas da ponte, cronologia da noite | Sonnet + busca | `dossie.md` |
| 2 | Levantamento de prontos + batedor | Sonnet (levantamento), Opus (take do colapso) | folha do batedor → **Portão 0** |
| 3 | Roteiro DE, cada batida com tipo e a pergunta do take explicativo | Opus, uma vez | `skript_de.md`, `falas.tsv` |
| 4 | Crítica de fatos, que aplica as correções | Sonnet | → **Portão A** |
| 5 | Narração | script na G4-2 | `narracao.wav`, `tempos.json` |
| 6 | Gêmeo 3D final + simulação + renders Cycles | Opus (1 agente), script na G4-1 | `cycles/` |
| 7 | Lote de ilustrações + fiscal | script na G4-1 | `tinta/final/` |
| 8 | Frentes de cena por família (6 a 11 batidas por agente) | Sonnet; Opus nas de 3D | `v1/src/` |
| 9 | Integração, stills de prova | Sonnet | folhas → **Portão B** |
| 10 | Render em fatias nas duas G4, mux, legendas, 3 miniaturas, `.txt` | script + Haiku | `entrega/` |
| 11 | Desligar e conferir as duas G4 | script | `saude` = G4_FORA |

As etapas 5 a 8 rodam em paralelo assim que o Portão A passa.

**Famílias de frente previstas:**
- `zwilling_escala`
- `kraftfluss`
- `schnitt_pfeiler`
- `kollaps`
- `gegenprobe`
- `tinta_cenas`
- `schema`
- `karte`
- `zeit_dokument`

**Regras de custo** (`docs/BADPATHS-custo.md`):
- uma conversa nova, aberta pelo `ABERTURA.md`;
- agentes novos com contrato curto, sem fork;
- sentinela por script nas duas G4 desde o `ligar`;
- o agente não lê imagens;
- cada bloco baixa para o PC assim que fica pronto.

**Meta:** o K21 levou ~5 h e ~3,9 M tokens de agentes para 162 batidas. Aqui são ~210 batidas mais a simulação. Teto: 8 h e 6 M tokens. Se o batedor mostrar que a simulação não fecha em 1 h de G4, a queda vira animação guiada por chaves no mesmo gêmeo, e isso é dito ao Eduardo no Portão 0.

## 7. Riscos
- **Causa técnica errada** no roteiro: o dossiê fecha antes, com o laudo.
- **Simulação instável** ou feia: plano B acima.
- **Ilustração com cara de foto** ou com texto inventado: fiscal + refação; prompt em traço de tinta.
- **Voz:** o canal precisa de voz própria aprovada; a voz A do Kriegsmomente fica só lá.
- **Duração:** 25 min é aposta; medir a retenção antes de alongar para os 40 min do pioneiro.
- **Corrida:** o pioneiro posta quase todo dia e ainda não fez a Reichsbrücke. Se fizer antes de nós, o ângulo de mecanismo ainda nos separa, mas o título muda.
