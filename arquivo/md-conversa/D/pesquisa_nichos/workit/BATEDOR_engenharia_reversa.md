# Batedor de engenharia reversa: Workit App (manequim fitness 3D), 01/11/2026

**Amostra:** https://www.youtube.com/shorts/ObGXvPi5cyk ("Dumbbell workouts to target your upper body muscles!").
- 21 s, 1080x1920, 30 fps, VP9 + Opus (trilha a −15 dB);
- publicado em 26/10, 1,3 mil views.

**Leitura ótica:** 24 fps, 504 quadros em `f24/`, folhas em `sheets/`, recortes em `z/`.

## 1. O que a leitura mostrou
| # | Observação | Onde |
|---|---|---|
| 1 | **4 clipes de ~5 s com corte seco:** 0–4,80 / 4,80–10,03 / 10,03–15,63 / 15,63–21,0 s (4,8 · 5,2 · 5,6 · 5,4 s). O detector de cena com limiar 0,25 só achou o último corte; com 0,08 achou os três | `z/cortes.jpg` |
| 2 | **Mesmo cenário e mesmo enquadramento inicial em todo clipe.** Cada clipe tem uma órbita lenta de câmera (3/4 esquerdo → frente → 3/4 direito) | folhas s01–s08 |
| 3 | 1 exercício por clipe: rosca, elevação lateral, tríceps acima da cabeça, remada renegada | |
| 4 | **Movimento com defeito de IA:** a elevação lateral começa assimétrica (um braço sobe, o outro fica dobrado no quadril segurando o halter); o tríceps começa no meio do movimento | s03 (4,79–4,96 s), s06 |
| 5 | **Mão atravessa o halter** na remada: a mão pousa sobre a cabeça sextavada, não na pega | `z/hands_stack.jpg` |
| 6 | Manequim sem rosto, roupa idêntica em todos os clipes, render tipo PBR (piso com reflexo, spots azuis) | `z/full_*.jpg` |
| 7 | **Camada 2D por cima:** coluna de 4 "cards" do mesmo manequim com o músculo em vermelho; ✓ verde animado + sublinhado amarelo no exercício da vez; banner de notificação estilo iOS ("Workit — Your workout and nutrition plans are ready"); no último clipe a coluna vira linha no topo. Entra e sai em crossfade nos cortes | s04, s08 |
| 8 | Sem narração. Só trilha | volumedetect |

## 2. Veredito sobre a stack (confiança: alta para IA; média para o modelo exato)
**É imagem→vídeo de IA, não animação 3D.**
- **Duração dos clipes:** todos têm ~5 s, que é a unidade de geração dos modelos de vídeo. Kling, Seedance e Hailuo geram 5–6 s; o Wan gera 81 quadros = 5,06 s. Um render 3D faria a sequência contínua, sem motivo para cortar a cada 5 s no mesmo cenário.
- **Enquadramento:** cada clipe parte do mesmo quadro inicial (mesma imagem de referência) e só o prompt do exercício muda.
- **Defeitos de movimento e contato** (itens 4 e 5): mocap ou animação manual não produzem isso.
- **Manequim sem rosto:** é a escolha típica de quem gera com IA. Elimina o problema de consistência de rosto e o "uncanny".

**Pipeline provável:**
1. **Quadro-chave:** gerador de imagem com referência de personagem (manequim + roupa + academia), uma vez só.
2. **Cards de músculo:** edição de imagem do mesmo manequim pintando o músculo de vermelho, um por grupo.
3. **Vídeo:** imagem→vídeo de 5 s por exercício, com prompt "do 3 reps of [exercício], slow orbit camera". Pelo acabamento: Kling 2.x, Seedance ou Veo. Não dá para cravar qual.
4. **Edição** (CapCut/AE): empilhar clipes, cards com ✓, banner do app, trilha.

**Custo de produção estimado:** 4 gerações de 5 s + 4 edições de imagem + ~30 min de edição. Cabe em menos de 1 h por vídeo.

## 3. Como reproduzir na G4 (sem crédito pago, tudo aberto)
| Etapa | Ferramenta aberta | Licença | Status |
|---|---|---|---|
| Quadro-chave do manequim e da academia | Qwen-Image | Apache-2.0 | a testar |
| Cards de músculo (edição consistente) | Qwen-Image-Edit | Apache-2.0 | a testar |
| Movimento de 5 s | **Wan 2.2 I2V A14B** (720p, 81 quadros) | Apache-2.0 | a testar. **Risco:** contato mão-halter e repetições contadas |
| Alternativa determinística | Blender + manequim + movimento de texto→mocap (MoMask/MDM) na G4, render Cycles | MIT / dados variam | só se o Wan errar demais o exercício |
| Camada 2D | Remotion (cards, ✓, banner) | já na stack | pronto |

**Prova proposta (precisa do seu OK para a G4):**
- 1 quadro-chave + rosca direta + elevação lateral, 5 s cada, no Wan 2.2;
- medir o tempo por clipe e contar defeitos (mão atravessando, assimetria);
- montar 10 s com os cards no Remotion.

## 4. Leitura como nicho
- **Workit App:** 689 inscritos, 33 vídeos, mediana de 1,6 mil, maior vídeo com 10,9 mil.
- **É peça de anúncio de app**, não canal viral. Mesmo padrão do post do X (página animada que vende app).
- **O valor está na stack** (barata, repetível, sem rosto), não no canal.
- Para virar aposta, precisa achar quem usa esse visual com views altas em vídeo longo ou em Shorts ES. Isso entra na mineração (`../proxima_mineracao/PLANO.md`).
