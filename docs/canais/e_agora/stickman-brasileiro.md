# Stickman Brasileiro: happy path e pipeline de HUD (canal "E Agora?", Instagram)

**Status:** reel 02 (apagão em prédio) aprovado na imagem em 10/11. Voz em troca (a do Vids saiu aguda). HUD em Remotion: plano abaixo, ainda **não renderizado** (falta o batedor na G4).

**O que é:** reel de 55 a 70 s de sobrevivencialismo para o público brasileiro. Um boneco palito 2D (cabeça branca redonda, boné preto, camiseta verde, membros finos pretos) age sobre a **foto realista de um ambiente típico do brasileiro** (cozinha de azulejo, mercadinho, prédio). Narração em off, HUD por código por cima.

## 1. Regras fixas (decisões do Eduardo, 10/11)
- **Arte:** boneco 2D chapado sobre fundo fotorrealista brasileiro. Não trocar a arte sem pedido explícito. O fundo real conversa com o público mais velho e passa autoridade.
- **O boneco nunca fala:** boca fechada, sem lip sync. Só voz em off.
- **Tema:** sempre uma necessidade real de sobrevivência do brasileiro (apagão, falta d'água, enchente, gás, comida sem geladeira). O reel entrega valor prático, não curiosidade.
- **CTA:** palavra fixa **GUIA** + pedido para seguir. Take próprio, com a animação do caminho Mensagens › Pedidos › Aceitar.
- **Voz:** só português brasileiro, grave. Voz do canal só com aprovação do Eduardo (ele ouve as candidatas).
- **Sem Flow.** Clipes só no Google Vids. Trocar de conta do Vids só com aval.

## 2. Divisão de trabalho (por que é barato)
| Etapa | Onde | Custo |
|---|---|---|
| Quadro de cada take (boneco + foto) | Gemini, no perfil de automação | ~2 a 8 min por quadro, sem G4 |
| Movimento + voz em off | Google Vids, modo Ingredientes, Omni 720p 9:16, 10 s | ~2 min por take, sem G4 |
| Conferência da fala e tempo das palavras | faster-whisper `small` na CPU | segundos |
| HUD, legenda e montagem | Remotion, **na G4** a partir da imagem `.sqfs` da stack | minutos de G4 por reel |

A G4 entra só no render do HUD. Lote grande (~20 reels) pode compensar a rota de imagem local; abaixo disso, Vids.

## 3. Happy path
Pasta do formato (fora do repositório): `D:/producao/e_agora/formatos/historia_escolha/`. Um reel = `reel_NN/`.

1. **Roteiro em 7 takes** (`reel_NN/roteiro_vids.md`). Molde medido nos reels mais vistos da referência do nicho:
   1. gancho de alerta + pergunta "E agora?";
   2. "Primeiro: …";
   3. "Segundo: …";
   4. "Terceiro: …";
   5. "Agora, o que quase ninguém sabe: …" (o fato contraintuitivo);
   6. "Manda pra quem …";
   7. CTA: "Comenta GUIA e me segue, senão a mensagem não chega. Não chegou? Olha em Pedidos de mensagem e aceita."
   Cada take tem **≤ 27 palavras** (cabe em 10 s). Cada fato tem fonte brasileira em `entrega/fuentes.md` antes de publicar.
2. **Quadro por take:** `gemini_img.py <porta> q_N.txt cena_N.png`. O prompt descreve a foto do ambiente e o boneco desenhado por cima, sempre com o mesmo figurino. Espera de até 800 s; há reserva por canvas quando o download falha.
3. **Takes no Vids:** `produzir_vids.py` com `FOTO=.../cena_{n}.png`, `MD=prompts.md`, `DOC`, `PERFIL`, `SAI`, `FIM`, `TENT`. Take já baixado é pulado. **Um job por vez.**
4. **Molde do prompt do Vids** (inglês, fala entre aspas em pt-BR):
   - "Animate @Imagem1 exactly as it is… the background photo stays still; only the cartoon character moves";
   - a ação, uma só, neutra;
   - "The stick figure never speaks: mouth closed, no lip sync. Only an unseen off-screen narrator… says exactly, in Brazilian Portuguese: "<fala>"";
   - "Exactly two hands… only person in the scene… One single continuous shot… No text, no subtitles, no music."
5. **QA da fala:** whisper em cada take; a transcrição tem de bater com o roteiro. Take mudo ou com frase inventada é refeito.
6. **Tempos:** alinhar as palavras do whisper ao roteiro (difflib) e gravar `tempos.json`. O texto da legenda vem do roteiro; só o tempo vem da transcrição.
7. **HUD:** escrever `hud.json` (seção 5), batedor de stills na G4, folha ao Eduardo, render.
8. **Entrega:** `reel_NN/entrega/` só com o mp4 final com áudio (conferido por ffprobe), `post.txt` e `fuentes.md`.

## 4. Voz
A voz do Vids não é fixa: o mesmo prompt pode sair agudo. Duas rotas, nesta ordem:
1. **Voz descrita no prompt do Vids** (grave, peito, idade, "never high-pitched"). Gerar 3 candidatas do take 1 e mandar ao Eduardo. Serve se a escolhida se mantiver igual nos 7 takes.
2. **Narração separada, voz fixa do canal** (Qwen3-TTS na G4, a voz aprovada do canal). Como o boneco não fala, a troca de áudio é limpa: os takes do Vids ficam só com a imagem e a narração única define o tempo de tudo. É a rota de reserva se a voz do Vids variar entre takes.

## 5. Pipeline de HUD (Remotion)
### 5.1 Reaproveitado (levantamento de prontos)
- **Kit do formato** (`kit/`, Remotion 4): `tema.ts` (cores, fontes Oswald e Barlow Condensed OFL, molas), `tempo.ts` (`na_palavra`: todo elemento entra numa palavra da fala), `Legenda.tsx`, `dados.tsx` (etiqueta, carimbo, anel), `cartoes.tsx` (contador, barras, grade, notificação), `medir.mjs` (metas que travam o render).
- **Remotion Skills oficiais** (`remotion-captions`, `remotion-multimedia`, `remotion-best-practices`), já clonadas.
- **Pacotes a provar no batedor** antes de escrever componente novo: `@remotion/captions`, `@remotion/layout-utils` (`fitText`), `@remotion/paths` (`evolvePath` para seta e traço), `@remotion/shapes`, `@remotion/transitions`, `@remotion/lottie` + ícones Lottie de licença livre, `@remotion/motion-blur`.
- **Feito à mão, com o porquê:** o cartão `pedidos` (celular desenhado). Não existe pronto com o caminho em português e no nosso tema, e captura de app real não entra.

### 5.2 Princípios
1. **O HUD explica, não enfeita.** Cada elemento responde "o que eu faço?" ou "por quê?". Se não ajuda a entender, sai.
2. **O dado nasce na cena e voa para o trilho.** O número aparece em cima do objeto real da foto (balde, geladeira) e depois encolhe para o topo. Nada de caixa fixa.
3. **Nunca em cima do boneco.** Texto e gráfico só no espaço vazio da foto. A posição vem de `pos.json` por take.
4. **Tudo entra numa palavra.** Nenhum elemento tem tempo em segundos no JSON; só `na_palavra`.
5. **Público mais velho:** letra grande (≥ 56 px), contorno grosso, no máximo **2 elementos além da legenda** ao mesmo tempo, nenhuma tela parada por mais de 3 s.
6. **Três cores de sentido:** amarelo = atenção e palavra falada; vermelho = perigo e proibido; verde = certo e feito.

### 5.3 Zonas do quadro (1080 × 1920)
| Faixa (y) | Uso |
|---|---|
| 0 a 200 | livre (interface do Instagram) |
| 200 a 330 | trilho de passos |
| 330 a 1240 | cena: marcadores, dado, cartão |
| 1280 a 1480 | legenda karaokê |
| 1600 a 1920 | livre (interface do Instagram) |

A coluna direita (x > 930) fica livre entre y 1100 e 1600, onde ficam os botões do Instagram.

### 5.4 Elementos por batida do roteiro
| Take | Elemento | Comportamento |
|---|---|---|
| Todos | **Legenda karaokê** | Blocos de até 4 palavras; a palavra falada fica amarela e dá um pulo de mola |
| 1 Gancho | **Selo de alerta + carimbo "E AGORA?"** | O selo entra na 1ª palavra; o carimbo bate na palavra "agora", com tremor curto |
| 2 a 4 Passos | **Trilho 1 · 2 · 3** | O número grande nasce no centro em "Primeiro/Segundo/Terceiro" e voa para o trilho, que acende |
| 2 a 4 Passos | **Marcador na cena** | Anel + linha-guia + rótulo curto no objeto real ("ENCHE AGORA", "NÃO ABRE") |
| 2 a 5 | **Um dado vivo por take** | Medidor da caixa d'água descendo; relógio "4 h" da geladeira que despenca em "abriu"; vela, churrasqueira e gerador com X vermelho, um por palavra |
| 5 Virada | **Varredura "QUASE NINGUÉM SABE"** | Faixa amarela cruza a tela; o acento passa a vermelho até o fim do take |
| 6 Compartilhar | **Avião de papel** | Sai do centro e pousa no canto direito, onde fica o botão de enviar |
| 7 CTA | **Comentário "GUIA" + botão Seguir** | O balão digita GUIA; "Seguir" vira "Seguindo ✓" na palavra "segue" |
| 7 CTA | **Cartão `pedidos`** | Ver 5.5 |

Som: só efeitos pontuais (toque, virada), baixos, sem música.

### 5.5 Animação do caminho "Pedidos" (cartão `pedidos`, `kit/src/pedidos.tsx`)
Fundo: o próprio take desfocado e escurecido. No topo, o trilho **1 MENSAGENS › 2 PEDIDOS › 3 ACEITAR** acende a cada batida.
1. **"Não chegou?"** Um celular desenhado sobe com a caixa de mensagens. As conversas comuns ficam apagadas, aparece "O guia não está aqui", e a aba **Pedidos (1)** pulsa em azul.
2. **"Pedidos"** Um dedo (círculo) toca na aba, com onda amarela. A tela desliza para "Pedidos de mensagem", com a linha do perfil e "Aqui está o seu GUIA".
3. **"aceita"** O dedo toca em **Aceitar**. O botão fica verde, "✓ Aceito", e o cartão amarelo **GUIA chegou ✓** salta do celular.

No `hud.json`: `{"tipo": "pedidos", "na_palavra": "chegou", "na_palavra_b": "Pedidos", "na_palavra_c": "aceita", "perfil": "E Agora?"}`.

### 5.6 Como o HUD é produzido
1. `hud.json` do reel: por take, a lista de elementos com `tipo`, `na_palavra` e os textos.
2. `pos.json`: ponto (x, y de 0 a 1) do objeto de cada marcador.
3. **Batedor na G4:** um still por elemento novo (`still.sh`), folha de contato ao Eduardo. Elemento já aprovado num reel anterior não volta ao batedor.
4. `medir.mjs` confere as metas (zonas, tempo parado, elementos simultâneos) antes do render.
5. `render.sh` na G4, a partir da imagem `.sqfs` da stack no Drive. No PC só se edita código.

## 6. Caminhos ruins já pagos
- **Trocar a arte sem pedido.** Custou três rodadas e a paciência do Eduardo.
- **Dois jobs do Vids ao mesmo tempo:** o laço do job morto continuou e um take saiu sem fala. Conferir que o processo morreu antes de lançar outro.
- **Recusa "parece violar":** trocar o quadro e deixar a ação neutra (apontar, joinha). Repetir o mesmo prompt não resolve.
- **CTA junto com outra fala:** o Vids recusa. CTA é sempre take próprio.
- **Gemini "Creating your image" por mais de 500 s:** é lentidão, não erro. Esperar 800 s.
- **Voz aguda:** pedir "calm, serious adult male" não basta. Ver seção 4.
- **Roteiro genérico** (reel 01, carro na enchente): reprovado. O tema nasce da demanda do brasileiro, não do molde.
