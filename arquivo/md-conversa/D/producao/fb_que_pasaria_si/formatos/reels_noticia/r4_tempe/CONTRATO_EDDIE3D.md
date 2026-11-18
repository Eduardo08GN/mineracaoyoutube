# Reel 1 do Segundo a Segundo / página FB: Tempe na stack Eddie3D (08/11/2026)

**Decisão do Eduardo (08/11, noite):** os vídeos do Segundo a Segundo e da página "¿Qué Pasaría Si? 3D" passam a usar **só a stack Eddie3D**, a do What If ES vídeo 08 ("el mar sube…"). As rotas anteriores estão **mortas**: low poly, Polyfork, papel, IA local, código low-poly cru. **Este contrato substitui o `CONTRATO.md` desta pasta.**

## Teto (critério de parada)
- **≤ 200 mil tokens de agente e ≤ 1,5 h de G4.** Ao chegar a 80%, pare e relate.
- Um job por etapa, com sentinela. Não leia imagens no contexto.

## Leia antes (só isto)
1. `D:/tmp/consolida/docs/LEIA-PRIMEIRO.md`.
2. `D:/tmp/consolida/docs/whatif-es/STACK.md`: a stack.
3. **O projeto do vídeo 08: `D:/whatif_es/08_mar_latam/v1/`** (estrutura, `src/`, famílias de cena, `ferramentas/plano.py`, `Pronto.tsx`, render na G4). **Parta dele: copie o projeto para `D:/producao/fb_que_pasaria_si/formatos/reels_noticia/r4_tempe/v1/` e adapte.** Nada de stack nova.
4. `D:/pesquisa_nichos/acidentes_fb/lote1/r4_tempe/dossie.md`: fatos e coordenadas.
5. `D:/tmp/consolida/docs/whatif-es/erros-pipeline.md` e `D:/tmp/consolida/tracer3d2/BADPATHS.md` (G4, render).

## O que reaproveitar do vídeo 08
- Água com reflexo do céu e espuma; HDRI do Poly Haven com o sol medido; névoa de perspectiva aérea; god rays; EZ-Tree.
- HUD vivo: o dado nasce na cena e voa ao painel.
- Nível amarrado às palavras pelo `plano.py`.
- Pessoas Quaternius **só pequenas, de longe**, como no vídeo 08.

## Assets (decisão do Eduardo, 08/11, 21h)
**A stack é o motor do vídeo 08. Os assets vêm do Polyfork e da "My Library" do Fab do Eduardo.**
- **Polyfork** (polyfork.dev):
  - **personagens:** Firefighter, Park Ranger, Highway Patrol Officer, Hiker Visitor e outros. São editáveis, aceitam Mixamo, têm uso comercial e não exigem atribuição;
  - **kits de ambiente:** Roadside Americana e Nature & Forest servem para Tempe;
  - **o GLB baixa sem conta.** O `.mjs` precisa de chave grátis e não pode ser redistribuído: os arquivos ficam fora do git.
- **Fab "My Library"** (os assets que o Eduardo já tem; ver `docs/pacotes-por-canal.md` e `docs/pipeline-fab-g4.md`), quando servirem melhor. Ex.: Megascans de rocha e planta para o leito.
- **Regra de harmonia:** tudo recolorido e iluminado pelo HDRI e pelo `Look` do vídeo 08, para parecer uma cena só. O homem e os bombeiros vêm do Polyfork, de longe ou em plano médio de costas, nunca em close de rosto. **Os Quaternius saem.**

## O que é novo (o mínimo)
1. **Família de cena "rio no deserto" (Tempe):**
   - leito largo de cascalho e areia (PBR CC0 do Poly Haven: cascalho, areia seca e areia molhada);
   - margens baixas, vegetação de deserto (EZ-Tree com preset seco, ou álamos/paloverde);
   - a cidade de Tempe ao fundo, na névoa, como silhueta;
   - **um parâmetro único `nivel` (0 → 4,3 m)** move a água, como o nível do mar no vídeo 08;
   - água marrom e turva com correnteza (o `Mar` do vídeo 08 com cor e fluxo ajustados).
2. **A árvore com o homem:**
   - o homem pequeno, de longe e em silhueta, agarrado (pose de agarrar da biblioteca de animações);
   - o drama vem da água subindo em volta, do número e da câmera, **nunca de close no rosto**.
3. **Represa com comporta abrindo:** cena curta, geometria simples com material de concreto PBR e o volume de água saindo.
4. **Helicóptero com cabo e resgatista:** modelo CC0/CC-BY do Poly Pizza ou do Sketchfab, com licença anotada; visto de longe ou contra o céu.
5. **Ônibus de referência (4,3 m):** ao lado da árvore, no corte do nível.

## Roteiro, voz e tempo (prontos, não refazer)
- **Narração:** `D:/producao/fb_que_pasaria_si/formatos/reels_noticia/r4_tempe/voz_out/saida/voz_L.wav` (96,3 s, clone do Learjet).
- **Tempos por palavra e batidas:** `.../r4_tempe/cena/src/plano.json`. Converta para o formato do `plano.py` do vídeo 08.
- **Texto:** os 10 blocos de `CONTRATO.md`, seção Roteiro.
- **Números na tela (máximo 4):** 11 h · ×8 · 1.500 m³/s (= piscina olímpica a cada 1,5 s) · 4 m (= ônibus de dois andares).
- **Formato:** **1080×1920** (o vídeo 08 é 16:9: adapte câmeras e HUD ao vertical, com a legenda acima dos 18% inferiores). Zero crédito na imagem.
- **Câmera:**
  - movimento em todo plano;
  - corte a cada ≤ 3 s;
  - planos variados (geral do vale, médio da árvore, detalhe da água, represa, helicóptero);
  - nunca reaproveitar take.

## Infra
- **G4-2** (`T2_G4=2`, `T2_DONO=reels_r4_tempe`); está desligada. **Não desligue: avise "PRONTO_DESLIGAR" ao maestro, que é quem desliga.**
- **Montagem e render na G4,** como no vídeo 08 (`canal.py garantir` e o render, não `preparar` 2×). Nada de npm, stills ou render pesado no PC.
- **Imagem `.sqfs`:** gere a da stack Eddie3D se o `g4-imagem-stack.md` permitir. Se pedir "Permitir" do Drive, pare e avise.
- Baixe cada bloco ao PC na hora. Nada no C:.

## Portões
1. **Folha com 3 stills** (abertura com o vale e o homem na árvore; comporta e piscina; helicóptero no resgate), renderizada na G4. **Mande ao maestro só o caminho e espere o OK do Eduardo antes do render completo.**
2. **Depois do OK:**
   - render completo;
   - régua a 24 fps (≥ 12 cortes/min, parado ≤ 20%, mediana ≤ 3 s);
   - ffprobe;
   - revisão independente por um agente Opus novo, com o código e a bíblia.

## Entrega
Em `.../r4_tempe/entrega/`:
- `reel_r4_tempe.mp4`;
- `post.txt` (já existe; confira);
- `RELATORIO.md` com os tokens, os minutos de G4 e o que falhou.

**Resposta ao maestro:** no máximo 8 linhas.
