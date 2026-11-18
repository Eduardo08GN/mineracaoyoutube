# Leitura do vídeo Nfgd8L7dZQc: qual modelo gerou? (07/11/2026)

**Vídeo:** "11 Things You Only Notice in Upper Class Homes (Old English Housekeeping Habits)", canal Mrs. Whitmore's Housekeeping.

| Dado | Valor |
|---|---|
| Inscritos | 9,4 mil |
| Views | 18,2 mil |
| Publicado | 01/11 |
| Duração | 11:46 |

A descrição vende um livro (whitmorehousekeeping.com) e não cita ferramenta nenhuma.

**Como foi lido:**
- O yt-dlp foi bloqueado ("confirm you're not a bot"; os clientes alternativos só davam storyboard).
- Gravei 3 trechos de 45 s em 1080p, tocando o vídeo no navegador de automação (MediaRecorder do `<video>`), a 30 fps.
- **Trechos:** 0:20, 5:30 e 10:00, em `cap/`.
- **Leitura:** quadros únicos, cortes, planos, movimento e cadência por plano, em `leitura/` (JSON, folhas e tira de 20 quadros/s). Quadros em 1080p em `quadros/`.

## Medidas
- **Planos:** mediana de 3,4 a 4,3 s. Há muitos planos de **exatamente 4,00 s**:

  | Trecho | Planos de 4,00 s |
  |---|---|
  | 5:30 | 4,00 / 4,03 / 4,00 / 4,00 / 4,00 |
  | 0:20 | 4,0 / 4,0 |

  O clipe gerado tem **4 s**, cortado inteiro.
- **Cadência:** nos planos de IA, o quadro muda **em todo quadro a 30 fps**. Não aparece o padrão de 24 fps em timeline de 30 (1 repetição a cada 5) nem o de 16 fps.
  - Os dois únicos planos com repetição têm o padrão "100" (20 quadros novos/s). São clipes **desacelerados** para caber na fala, e mostram que o editor repete quadro em vez de misturar.
  - Logo, o clipe nativo tem ~30 fps, ou foi interpolado para isso antes da edição.
- **Movimento:** câmera quase parada (73 a 86% dos instantes sem translação). O movimento está no objeto e na mão. Há cartões de motion graphics (livro, infográficos) entre os clipes.
- **Imagem:**
  - estética de vídeo de celular (UGC): luz do dia suave, grão leve, lente grande-angular;
  - mãos idosas da mesma personagem em POV (punho de cardigã azul-marinho igual em todos os planos);
  - física de fluido boa (corante azul se espalhando na caixa d'água).
- **Apresentadora falando:** pele lisa demais, halo de nitidez de upscale (geração em ~720p, entregue em 1080p) e lombadas de livro com texto ilegível.
- **Marca d'água:** nenhuma visível (sem a marca móvel do app Sora, sem "Veo"). O SynthID é invisível e não dá para checar aqui.

## Veredito (confiança média, ~60%)
**Mais provável: modelo comercial por API, não local, e não o Google Flow padrão.**
- **1º Sora 2, via API ou Pro:**
  - tem clipes de 4/8/12 s, e o padrão de 4,00 s bate;
  - gera a ~30 fps;
  - o estilo "vídeo de celular realista" é a assinatura dele;
  - pela API sai sem a marca d'água do app;
  - o padrão é 720p, coerente com o halo de upscale.
- **2º Veo 3.1 via API:** aceita 4/6/8 s. Mas é nativo de 24 fps, e no Flow o clipe é de 8 s. Só bate se houver interpolação.
- **Local (Wan 2.2):** possível, mas menos provável.
  - Ele sai a 16 fps e precisaria de interpolação (RIFE ×2).
  - 65 quadros dão 4,06 s, perto dos 4,03 medidos.
  - Mas a coerência de mão com objeto e a física do fluido estão acima do Wan 2.2 típico em clipe de 4 s.

Não dá para cravar o modelo só pelo vídeo. O que está provado: clipe de 4 s, ~30 fps, i2v ou t2v com personagem fixa (imagem de referência), apresentadora com lip sync e cartões de motion design.

## Dá para replicar na nossa G4?
- **Rota local:**
  - Qwen-Image para a personagem fixa;
  - Wan 2.2 I2V 14B (lightx2v) com 65 quadros e RIFE para 30 fps;
  - lip sync da apresentadora com InfiniteTalk (Wan, local).
  - **Custo:** o piloto v2v de 06/11 mostrou ~1–2 min por clipe de 5 s em 480p. Em 720p fica bem mais lento. Para 11 min (~160 clipes) são horas de G4.
  - **Qualidade:** abaixo da do vídeo nas mãos e nos objetos.
- **Rota igual à deles:** Sora 2 ou Veo 3.1 por API, que é pago por segundo.
