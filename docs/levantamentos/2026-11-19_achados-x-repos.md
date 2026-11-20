# Achados de 19/11/2026: repositórios e referências vindos do X

Triagem feita na sessão do Lanús e do CE-25A. Aqui fica **só o que vale**; os descartes vão no fim, com o motivo, para não serem reavaliados.

## Adotado
| O quê | Onde | Uso |
|---|---|---|
| **motionmaxxing**, **reanimate**, **huashu-art-motion** | skills globais (`docs/skills-motion.md`) | Juiz anti-slide, cópia de ritmo medida e gramáticas de take explicativo. |

## Próximo passo técnico: camadas reais na foto 2.5D (SAM 2)
- **Problema:** no Lanús, o `foto25d` deforma a imagem inteira pelo mapa de profundidade, e o resultado parece "foto esticada" ou slide.
- **Proposta:** na G4, o **SAM 2** (facebookresearch/sam2) recorta cada imagem do Flow em 3 camadas: frente, meio e fundo. Um inpainting de imagem preenche o buraco atrás de cada camada. O ProPainter não serve, porque é para vídeo. No Remotion/R3F, cada camada vira um plano a uma profundidade, e a câmera passa entre eles, como no Kriegsmomente.
- **Batedor:** no CE-25A, 1 imagem em camadas contra a versão só com profundidade, lado a lado, mais a medição de câmera parada (meta < 20%).

## Asset a testar: mocap CMU retargetado
- 2.067 clipes de gente real, do banco da Carnegie Mellon, retargetados para GLB (cerca de 1,2 GB no Hugging Face, post do @anxuanng no X, 19/11). Abrem direto no three.js e no Blender, e há versão só com o esqueleto, para aplicar em personagem próprio.
- **Uso:** pessoas andando, correndo e evacuando nas reconstruções 3D.
- **Antes de usar:** conferir a licença (o banco da CMU é de uso livre, mas falta confirmar a do repositório) e se o boneco passa no veto do visual de "PS2" (`feedback-personagem-bonito-sem-quaternius`). Se não passar, usar só o esqueleto num personagem bom.

## Pistas de nicho e formato (não medidas)
- **RUNULL** (YouTube): canal de 1 mês com 4,6 mil inscritos, vídeos longos de histórias reais bizarras de tecnologia, ciência, história militar e hacking. Tem um vídeo com 186 mil views e outro com mais de 700 mil. Mesmo território do Silicon Up Close e do CE-25A. **Falta:** medir a concorrência em ES.
- **Perfis escuros de fé e conselho** (Instagram BR): mesmo menino cartoon em todo post, ganchos como "3 sinais que Deus…" e "É pecado jogar GTA 6?", que pega a tendência, sem rosto, automatizado. Vendido em curso de R$ 27. Serve ao **E Agora?** (pausado). O risco é virar commodity e cair em conteúdo repetitivo.
- **Stickman de terror** (Indonésia): boneco 2D simples sobre cenário ilustrado noturno, com narração e legenda. Referência visual caso o E Agora? volte.

## Avaliados e descartados (não reabrir)
| Repo ou coisa | Motivo |
|---|---|
| Pixelle-Video, Jellyfish, waoowaoo | Fábricas de drama curto com IA: uma imagem ou vídeo por frase, mais TTS e música. É slideshow e vídeo gerado; risco de "conteúdo não original". |
| LTX-Video, FramePack | Vídeo gerado, proibido. |
| RobustVideoMatting, CoTracker, ProPainter | Pressupõem filmagem real; o nosso material é código. |
| Motion Canvas, Revideo | Duplicam o Remotion. |
| Motion (framer), Theatre.js | Animação de interface e editor manual de keyframes; quem dirige a câmera é o planejador. |
| Natron, Shotcut, EffectCraft, Tweakpane | Interface gráfica, não é para agente. |
| Manim | Fórmula matemática. |
| lottie-web, motion-design-skill | Pouco ganho sobre o kit atual. |
| mg-styles-15, anidoodle, cinetic | Filme de marca ou produto, ou arte à mão. Do cinetic, servem no máximo as 23 animações de texto. |
| Claude-Video-Editing-Skills (Viprasol) | Edita vídeo gravado (silêncio, corte de podcast); repositório com 2 dias. |
| Biblioteca de sites do @tobiadonadon_ | Template de landing page, pago. |
| Já na stack | three.quarks, react-postprocessing, react-three-fiber, WhisperX, stable-ts, librosa, Remotion skills. |

## Formato a portar: Silicon Up Close (de olho)
- Canal criado em 07/10/2026: 12,8 mil inscritos, 13 vídeos, cerca de US$ 13,8 mil por mês estimados (post @SojAutomation, 19/11).
- Vídeos: "What Happens Inside an AI Chip" (1 mi), "1s Inside a CPU" (447 mil), "How Did Phone Cameras Get This Good?" (269 mil).
- **Molde:** "por dentro da máquina", em 1 segundo ou em zoom extremo, com motion graphics Remotion barato e 12 a 25 min de duração.
- **Ideia:** levar o molde para outro nicho ou idioma, por exemplo em ES: "1 segundo dentro de un motor de avión", "dentro de una batería", "dentro del cuerpo". O CE-25A já é um piloto desse território.

## Rodada 2 (19/11, noite)

### Receita da foto 2.5D v2 (post @kaulabs)
Um teste dela comparou dois caminhos. O cenário 100% em código (three.js) ficou com cara de protótipo. A imagem gerada **reprojetada quadro a quadro** com câmera de grua e travelling foi aprovada.
1. A câmera **se desloca** (sobe e avança): zoom não gera paralaxe.
2. O chão é tratado como plano em perspectiva: o perto anda mais que o horizonte.
3. O personagem ou objeto fica numa camada separada, presa ao chão (SAM 2).

**Batedor do CE-25A:** avião recortado pelo SAM 2, pista reprojetada, câmera de grua, comparado lado a lado com o `foto25d` atual (meta: < 20% de câmera parada).

### Imagem na G4 em vez do Flow: MiniMax H3 (pesos abertos)
- `MiniMaxAI/MiniMax-H3-Image` está no Hugging Face (03/11, 821 mil downloads). O app de teste é animede/Diffusers_minimax-h3 e roda a partir de 6 GB de VRAM.
- Usar **só o modo imagem**, de texto (T2I) e de referência (Ref2I). O Ref2I é a nossa âncora com a foto real. O vídeo continua proibido.
- **Ganho:** sem cota e sem o perfil da Ivone, em lote por script na G4.
- **Antes de adotar:** ler a licença ("other"; confirmar uso comercial) e fazer o batedor de 5 imagens H3 contra Flow.
- O **FreeVideo** (outro app que promete o H3 com 8 GB) não deve ser instalado: é um instalador desconhecido.

### Pipeline de personagem a testar (post @kenonews)
- **MPFB** (MakeHuman para Blender): humano completo com rosto e esqueleto, por script e com licença livre. É a saída para o veto do visual de "PS2".
- **FlowHMR:** vídeo de celular vira animação FBX. O Eduardo grava o movimento exato que a cena pede.
- **Puppeteer** (Seed3D): põe esqueleto e anima qualquer modelo do Fab ou do Sketchfab.
- Somar ao mocap da CMU. Saída para Blender (G4) ou GLB (three.js). Destrava pessoas nas reconstruções e o formato POV.

### Formato POV de desastre (Instagram, @playafterbell)
- Primeira pessoa (o espectador vê os próprios braços), título de escolha ("Boat or Helicopter?", "Door or Window?"), desastre famoso e 3D cartoon. São 32,8 mi de views com 4 posts, **mas 19,7 mi vêm de um só**.
- Dá para fazer na nossa stack (three.js + mocap). **Antes:** medir de 5 a 10 perfis do formato e ver se já existe em ES.

### Referência de take explicativo: o torno do @0xKapri
O render 3D demonstra o mecanismo, e os contadores ao vivo (rotação, força, potência, diâmetro de 40 para 30,5 mm) nascem da ação, com corte lateral, vista de cima e peças numeradas no mesmo quadro. É o "instrumento vivo" bem feito. **CE-25A:** o avião com contadores de kWh, km, empuxo e **peso constante**, ao lado do esquema de bateria contra querosene. É o take eureka.

### Método SIMULAB (ecapri-dev/simulab-skill, MIT): absorver, não instalar
- Números com fonte antes do desenho; o resto é marcado como suposição.
- **O modelo vem primeiro, como funções puras**: todo número na tela sai de uma fonte só.
- **Capítulos por contraste: errado, certo, exagerado.** No CE-25A: bateria de carro não chega a 150 km; a de 500 Wh/kg chega a 400; com bateria demais, o peso derruba o alcance.
- O kit (44 objetos de eletrônica e café, isométrico interativo) não serve ao nosso vídeo narrado.

### Pistas sem ação
- **Silicon Up Close portado:** ver a seção acima.
- **Terror de regras EN→ES** (Lullorin, 33 mil inscritos, para o clone ES Expediente Doméstico, 2,4 mil): o clone pega entre um décimo e um terço do original. Vale o método (formato EN em alta e sem clone ES), não esse nicho, que já está clonado e é commodity.

### Descartados nesta rodada
Shorts faceless no piloto automático com Zapier (molde repetido, contra a regra de variedade de 14/11); a lista de 18 libs de motion (Typed.js, GSAP, anime.js, react-spring, mo.js, Rive, Paper.js, p5, PixiJS, matter.js, tsParticles, Lenis…), que são básicas e já estão cobertas pelo Remotion e pelo three.js. O HyperFrames entra só via motionmaxxing. Também: CAD com agente (freelance chinês, isca de engajamento) e o curso de "perfis dark".

## Rodada 3: 10 canais de animação que acertaram em semanas (artigo @morgsmariana, 18/11)
Filtro dela: vídeo mais visto com pelo menos 10 vezes o número de inscritos e no mínimo 250 mil views. As estimativas de receita são dela.

| Canal | Formato | Viral | Lição para nós |
|---|---|---|---|
| **Minute Zero** | "e se…" científico em 3D, primeira pessoa, **sem narração**, um número crescendo no canto | "e se você acelerasse e não conseguisse parar?", 2,4 mi; o seguinte, 2,2 mi | **Parado desde 31/10.** A pergunta precisa crescer sem limite. Quase sem fala, então porta fácil para ES. É o nosso What If ES somado ao POV. |
| **Fossil** | animais pré-históricos | título de "eu simulei" (182 mil) trocado por "quanto tempo **você** duraria em cada era" (13 mi) | Título em "você". Serve ao canal pré-história POV. |
| **Depth Theory** | perigo de bicho do oceano | "por que você nunca ia querer encontrar um cachalote", 8,7 mi | Bicho famoso + perigo desconhecido + você dentro da água. Sem o bicho famoso, cai para 40 mil. |
| **Fortune of Nations** | economia contada em mapa com relevo animado | "por que os EUA ficaram ricos e a América Latina nunca ficou?", 1,8 mi | Rivais que o público sente na pele. O tema é latino-americano por natureza (ES). O mapa é a stack do Kriegsmomente. **Cuidado** com a regra "sem política": fazer pela história econômica. |
| **RUNULL** | minidoc de tecnologia real, 3D no Blender feito com o Claude | "o update de software mais difícil da história" (Voyager 1), 728 mil num canal de 4 mil inscritos | O assunto pesa mais que o capricho. |
| Lullorin | terror de regras, um vídeo por dia | 3,2 mi | Já tem clone em ES (ver acima). |
| A Better Mind, Day One Films, The Rep Theory, Strabo | psicologia, motivação, treino, geopolítica | 5,3 mi, 6,2 mi, 5,4 mi, 1,3 mi | Fora do nosso território. Strabo é política. |

**Sete fórmulas de título:** falar com "você"; desafio ("duvido você terminar"); regra de sobrevivência; ideia contra o senso comum; "e se… e não conseguisse parar?"; "por que esse e não aquele?" (rivais); "o mais difícil da história".

**Atenção:** "um formato que vira série" conflita com a regra de variedade de 14/11. A série tem de variar título, tema e miniatura entre vídeos (`docs/BADPATHS.md` #8).

**Candidatos para nós, nesta ordem:**
1. **Minute Zero em ES:** o original parou; formato quase sem fala; three.js com câmera em primeira pessoa e contador crescente.
2. **Fortune of Nations para a América Latina:** mapas do K19.
3. Títulos em "você" no canal pré-história e no What If ES.
