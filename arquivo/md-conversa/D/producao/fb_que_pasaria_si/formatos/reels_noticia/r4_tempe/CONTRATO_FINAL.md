# Reel de Tempe COMPLETO: pipeline buildKit (aprovado pelo Eduardo em 08/11, noite)

O Eduardo aprovou os stills da s4 ("ficou muito bom"). Agora é o reel completo, nessa mesma pipeline.

**Sem teto de tokens por enquanto** (decisão dele). Mesmo assim: script por etapa, sem acompanhar passo a passo e sem ler imagens no contexto.

## Base (não mude o estilo)
- Projeto: `D:/producao/fb_que_pasaria_si/formatos/reels_noticia/r4_tempe/v1/`.
- Cena: `src/cenas/tempe/CenaKit.tsx` com `USAR_KIT=true` (buildKit do Roadside Americana + luz `stage` do kit), exatamente como na s4.
- Narração `voz_out/saida/voz_L.wav` (96 s), plano de 40 tomadas, HUD e legenda do motor: tudo já existe.

## O que fazer
1. **As 40 tomadas na assinatura da s4:**
   - câmera do kit, alta em 3/4, com aproximações a partir dela, movimento em todo plano e corte a cada ≤ 3 s;
   - nunca reaproveitar take;
   - personagens do Polyfork com os clipes assados (Idle, Walk, Run) e pose por ossos onde precisar;
   - nada de pose T.
2. **Melhorias pendentes da s4:**
   - espuma na água (polígonos brancos na borda);
   - conferir o enquadramento da represa e do helicóptero;
   - o homem legível na árvore.
3. **Render completo na G4-2** (`T2_G4=2`, `T2_DONO=reels_r4_tempe`).
   - **Não use a G4-1** (outra sessão está nela).
   - Se a G4-2 mostrar a conta deslogada ("signed-out"), PARE e avise: só o Eduardo reloga.
   - Gere e colete a imagem `.sqfs` da stack (`T2_IMAGEM=1`, `T2_CANAL=fb_que_pasaria_si`, `T2_FORMATO=reels_noticia`).
4. **Portões:**
   - régua a 24 fps: ≥ 12 cortes/min, parado ≤ 20%, mediana ≤ 3 s;
   - ffprobe: vídeo + áudio, ~96 s, 1080×1920;
   - folha de contato com 12 quadros;
   - **revisão por um agente Opus novo, com o código, a s4 e a folha.** Reprovado: corrija e repita.
5. **Não desligue a G4:** avise PRONTO_DESLIGAR.

## Entrega
Em `.../r4_tempe/entrega/`:
- `reel_r4_tempe.mp4`;
- `folha_contato.jpg`;
- `post.txt` (já existe; confira títulos e legenda);
- `RELATORIO.md` com tokens, minutos de G4 e o que falhou.

**Resposta:** no máximo 8 linhas, com os caminhos.
