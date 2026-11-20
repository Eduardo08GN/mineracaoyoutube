# Blender como pré-visualização para vídeo de IA: 3 tutoriais a 24 fps (19/11/2026)

Leitura com a `regua24.py` e transcrição local com o faster-whisper. O material bruto fica em `D:/pesquisa_nichos/ref_<id>/`. **Os três são patrocinados pelo Higgsfield** (plugin do Blender mais Seedance 2.5). Isso é campanha, mas o método independe do Higgsfield.

| Vídeo | Canal | Views / idade | Duração | Cortes/min | Takes/min | Câmera parada |
|---|---|---|---|---|---|---|
| [OO6J2w_FBnE](https://youtu.be/OO6J2w_FBnE) "Claude + Blender Is The Best Way To Make AI Videos (Full Course)" | Dan Kieft (330 mil) | 247 mil / 3 dias | 22min30 | 6,1 | 17,3 | 35% |
| [9fC3pnf_Xew](https://youtu.be/9fC3pnf_Xew) "How To Save AI Credits With Claude + Blender" | TutStick (52 mil) | 243 mil / ~2 meses | 8min08 | 7,1 | 12,8 | 34% |
| [mx1yjt4k73o](https://youtu.be/mx1yjt4k73o) "Save AI Credits With Blender + Seedance 2.5 (NEW SYSTEM)" | Thomas Lundström (31 mil) | 15,8 mil / 6 dias | 13min02 | 9,3 | 18,4 | 25% |

> Os números medem o tutorial inteiro, com gravação de tela. São só ordem de grandeza.

## A ideia central
Um prompt de texto deixa o modelo de vídeo **adivinhar** câmera, posição e tempo, e cada tentativa custa crédito. A solução é decidir tudo antes, de graça, numa **maquete cinza no Blender** (cenário, objetos, bonecos substitutos e câmera animada). Ela é exportada como prévia rápida e entra como **referência de movimento** do modelo de vídeo. O modelo segue a câmera em vez de inventar. Resultado relatado: 1 ou 2 gerações em vez de 10 tentativas.

## O método (a parte comum aos três)
1. **O Claude monta a maquete no Blender** (MCP do Blender, ou o plugin do Higgsfield pelo chat) a partir de uma descrição em linguagem natural. Pergunta de lente e ângulo antes de construir.
2. **Bonecos substitutos em forma de "pílula" listrada e colorida** (Lundström). Destaca-se no render cinza e o modelo entende bem. Por ser pílula, a atuação do boneco **não vaza** para o resultado. Arma, braço ou cabeça entram só quando a ação exige. "Menos é mais."
3. **Diálogo travado antes:** dar ao Claude a fala exata, para cada take ter o tempo da fala, com pausas, reações, hesitações e interrupções. Isso deixa a fala menos "IA".
4. **Ciclo de iteração na maquete, não no prompt:** ver no viewport (barra de espaço, sem renderizar), dar notas ("câmera menos tremida", "pausa no Michael"), o Claude refaz, repetir. Física simples, como vidro quebrando ou carro batendo, é simulada já ali.
5. **Exportar a prévia** do viewport, ou do Eevee em H.264, como vídeo de referência.
6. **Truque do cenário:** pedir ao Claude um **print da câmera do Blender** e usar esse print como base de uma imagem gerada fotorrealista (Seedream 5.5, Nano Banana, GPT Image) "deste cenário em live action". O cenário gerado fica com **a mesma disposição** da maquete.
7. **Personagens:** folhas de personagem geradas à parte e salvas como "elementos" com nome. Um print dos nomes vai ao Claude, para ele marcar cada referência no prompt ("image 1 = esposa, image 2 = corredor").
8. **Prompt do vídeo:** feito por uma skill de prompt (Seedance prompter, "shot list director"). Tem de ter uma **seção obrigatória: "o vídeo do Blender é só referência de maquete; não copie o visual dele"**. Mais lentes por plano: grande-angular no estabelecimento, tele no close.
9. **Gerar primeiro em modo rascunho** (mais barato), corrigir na maquete ou no prompt e só então gerar em 1080p.
10. **Sequência com vários planos: no máximo 15 s por geração.** Prompt mais curto, menos invenção do modelo. Dois takes montados valem mais que um longo.
11. **Voz consistente:** referência de áudio da voz da pessoa junto das imagens.

**Dicas de direção (Dan Kieft):**
- Não deixe o Claude fazer a parte criativa. Você decide a cena antes, com rascunho ou imagem de referência do que quer ver.
- Não detalhe à toa o que o modelo de vídeo vai repintar, como arbustos. Isso economiza processamento.
- Salve o arquivo `.blend` sempre, porque o Blender cai.

## O que isso significa para nós
- **Destrava o debate do Blender MCP.** O uso certo do MCP **não é** fazer o render final no Blender, e sim a **pré-visualização de câmera e ação**: maquete leve, iterada por notas, exportada em segundos. Encaixa na proposta de 19/11: Blender residente na G4 com servidor MCP e túnel, MCP só na fase de desenvolvimento do visual.
- **O "modelo de vídeo" pode ser o nosso MiniMax H3 na G4**, sem créditos, em vez do Seedance pago. O rea-video fez remakes com o H3 usando **o plano original como referência de movimento**, então o H3 aceita vídeo de movimento. **Falta confirmar no batedor:** modo e qualidade do H3 com maquete do Blender como referência.
- **A maquete cinza deixa de ser um problema.** Em 02/11, a "maquete branca" foi reprovada como **imagem final**. Aqui ela é só guia de câmera; o visual vem do modelo de vídeo e das referências geradas.
- **O truque do print da maquete servindo de base à imagem gerada** resolve a consistência de cenário entre planos. Vale também para as imagens 2.5D do documentário.
- **Formatos que ganham com isso:**
  - POV de desastre (câmera em primeira pessoa travada na maquete);
  - Minute Zero (o percurso da câmera com o contador);
  - novelinha com H3 (diálogo travado mais planos ≤ 15 s);
  - reconstrução de acidente (trajetória exata do avião ou do carro, com o modelo de vídeo dando o visual).

## Batedor proposto
1. Na G4: Blender residente com servidor MCP. O Claude monta uma maquete de 10 s, por exemplo o POV de desastre "porta ou janela", com bonecos pílula e câmera animada. Exportar a prévia.
2. Print da câmera, imagem do cenário gerada pelo H3 a partir dele, e uma folha de personagem.
3. Gerar com o H3 usando a maquete como referência de movimento, a imagem do cenário e a folha. Rascunho em 512², depois em 768² ou 1080p.
4. Medir: o H3 seguiu a câmera? Quantas gerações? Tempo de G4. Folha de contato da maquete contra o resultado, para o Eduardo.
