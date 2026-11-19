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
