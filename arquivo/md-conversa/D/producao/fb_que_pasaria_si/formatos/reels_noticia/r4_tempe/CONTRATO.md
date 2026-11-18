# Reel 1 da página FB "¿Qué Pasaría Si? 3D": Tempe (rio Salt). Produção, não é teste (08/11/2026)

O Eduardo mandou produzir o 1º reel direto. **O formato estava ENCERRADO por custo e foi reaberto por ele para este reel.** Por isso o teto de custo abaixo é lei.

## Teto (critério de parada)
- **≤ 250 mil tokens de agente e ≤ 1,5 h de G4.** Ao chegar a 80% de qualquer um, pare, salve o estado e relate.
- O agente escreve JSON/código e dispara **um job por etapa** com a sentinela. Não fique acompanhando passo a passo e não leia imagens no contexto.

## Leia antes (em ordem, só o necessário)
1. `D:/tmp/consolida/docs/LEIA-PRIMEIRO.md`: regras de toda sessão (o PR #6 está no `main`).
2. `D:/tmp/consolida/docs/canais/fb_que_pasaria_si/reels_noticia.md`: **bíblia do formato** (estilo, regras, alvo "No Sleep", receitas).
3. `D:/tmp/consolida/fb_reels/tempe_polyfork_congelado/` (`LEIAME.md`, `RELATORIO_R13.md`, `cena/`): **a cena de Tempe que o Eduardo aprovou ("ficou muito bom"). Parta dela, não do zero.**
4. `D:/tmp/consolida/docs/g4-imagem-stack.md` e `D:/tracer3d2/canal.py`.
5. `D:/pesquisa_nichos/acidentes_fb/lote1/r4_tempe/dossie.md`: os fatos e as fontes.

## Direção de arte (fixa, não reabrir)
- **Estilo:** Polyfork harmonizado, exatamente o da cena aprovada: uma paleta, uma receita de luz, modo barato (sem path tracer). Água e chuva pelas receitas do pacote de skills.
- **Personagem:** o homem anônimo de costas, em 3/4 ou em contraluz, **no mesmo kit e na mesma paleta da cena**. Nunca boneco cru tipo Quaternius ou KayKit, nunca rosto atuando, nunca close do boneco.
- **HUD:** o dado nasce na cena e voa ao canto, sem caixa fixa. Texto só no espaço vazio. Legenda acima dos 18% inferiores. Zero crédito na imagem.
- **Câmera:** movimento em todo plano, corte a cada ≤ 3 s, planos variados (geral, médio e detalhe do mecanismo). **Nunca reaproveitar take**: cada batida tem um render próprio.
- **Formato:** 1080×1920.

## Roteiro (aprovado pelo Eduardo, final em espanhol; ~250 palavras ≈ 95–105 s)
1. "Once horas aferrado a un árbol. Y pocas horas antes, este río estaba completamente seco."
2. "En pleno desierto de Arizona, en Estados Unidos, un hombre que vivía en el cauce seco de un río vio cómo el agua subía a su alrededor, en mitad de la noche."
3. "Era medianoche. Se subió al árbol más cercano. Y el agua no dejó de subir."
4. "Pero ¿cómo se llena así, de golpe, un río en medio del desierto?"
5. "La respuesta está río arriba, en las montañas. A los ríos llegó unas ocho veces más agua de lo normal. Las presas se llenaron y, para no correr riesgos, abrieron las compuertas: más de mil quinientos metros cúbicos de agua por segundo. Una piscina olímpica pasando cada segundo y medio."
6. "Donde él estaba, el agua llegó a cuatro metros: la altura de un autobús de dos pisos. Y no hace falta tanto: quince centímetros de corriente ya tumban a un adulto."
7. "Toda la noche así, solo, a oscuras. Y hay un detalle: la corriente va socavando la grava alrededor de las raíces. Los árboles de al lado empiezan a ceder."
8. "A las once de la mañana, unos peatones oyen sus gritos. Los bomberos prueban con una balsa, pero la corriente no los deja. Hasta que llega el helicóptero del sheriff. Un rescatista baja por el cable, lo sujeta… y mientras lo suben, árboles vecinos se quiebran y caen al agua."
9. "Llegó a tierra firme caminando y hablando."
10. "Y tú: si el agua empezara a subir de noche donde duermes, ¿sabrías a dónde subir? Cuéntamelo en los comentarios."

**Os números na tela (no máximo 4, traduzidos):** 11 h · ×8 · 1.500 m³/s (= piscina olímpica a cada 1,5 s) · 4 m (= ônibus de dois andares).

**Mapa de imagem por batida:**

| Batida | Imagem |
|---|---|
| 1 | água marrom forte, árvore no meio, o homem em silhueta agarrado; câmera aproximando |
| 2 | plano aberto do deserto com o vale, rótulo "Tempe, Arizona" nascendo no lugar |
| 3 | leito de cascalho invadido pela água; relógio 00:00 nasce e voa ao canto |
| 4 | câmera sobe e olha rio acima |
| 5 | represa e comporta abrindo; piscina olímpica "passando" com contador |
| 6 | corte do leito com régua de nível e um ônibus de referência ao lado da árvore |
| 7 | corte mostrando a água escavando a base da árvore |
| 8 | balsa recuando; helicóptero; içamento; árvores vizinhas caindo |
| 9 | margem, o homem de pé, de longe |
| 10 | volta ao rio à noite, pergunta |

## Voz
- **O clone da narração do Learjet, a escolha do Eduardo.** Referência: `D:/pesquisa_nichos/acidentes_fb/lote1/voz/ref.wav`.
- Qwen3-TTS na G4, melhor tomada entre várias por frase (QA por Whisper).
- Velocidade ≤ 1,05×. Se o áudio passar de 110 s, avise; não acelere.

## Infra
- **G4-2** (`T2_G4=2`, `T2_DONO=reels_r4_tempe`). Está livre e desligada desde as 18:00; o porteiro tinha uma reserva vencida de "tempe_polyfork_cena".
- **Stack:** parta da imagem `D:/t2_stacks/fb_que_pasaria_si/reels_noticia/node_849f29b4e40c.sqfs`. A montagem (npm, empacotar, checar tipos, stills, render) acontece **na G4, nunca no PC**. Suba a imagem para o Drive Ultra se o fluxo do `g4-imagem-stack.md` permitir. O link vai só no `D:/tracer3d2/.env`. Se pedir "Permitir" do Drive, **pare e avise**: quem clica é o Eduardo.
- **Render:** Chromium headless com GPU real (as flags `--use-angle=gl-egl` e `LD_LIBRARY_PATH=/usr/lib64-nvidia`). Confira a linha `gpu:` antes do filme. Renderize as batidas em paralelo. Na montagem final, use ffmpeg com NVENC.
- **Sentinela** (script + Monitor) emitindo só na mudança de estado. Baixe cada bloco ao PC na hora.
- **No fim:** desligue a G4-2 e confira que desligou.
- Nada no C:.

## Portões antes de entregar
1. **Régua a 24 fps:** ≥ 12 cortes/min, tempo parado ≤ 20%, mediana de plano ≤ 3 s, sem excesso de escuro.
2. **Conferência por script:** duração, áudio presente (ffprobe), legenda fora da faixa inferior.
3. **Revisão independente:** um agente Opus novo, **com o código, não com a sua conclusão**, avalia uma folha de contato contra a bíblia e a cena aprovada. **Reprovado não vai ao Eduardo:** corrija e repita. Ele pode abrir a folha em escala reduzida.

## Entrega
Em `D:/producao/fb_que_pasaria_si/formatos/reels_noticia/r4_tempe/entrega/`:
- `reel_r4_tempe.mp4`;
- `post.txt` com os 3 títulos (`D:/pesquisa_nichos/acidentes_fb/pauta_0711/LOTE1.md`), a legenda curta do post e as fontes;
- `RELATORIO.md` com os tokens gastos, os minutos de G4 por etapa e o que falhou.

**Resposta final ao maestro:** no máximo 8 linhas, com o caminho do mp4. O maestro manda ao Eduardo.
