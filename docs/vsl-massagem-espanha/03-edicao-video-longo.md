# 03 · Edição do vídeo longo (VSL de ~20 min)

O que já existe (`work/video/montar_headcast.py`, testado no vídeo de 20 min da Mamaw Opal), o que a VSL de
referência faz diferente (medido quadro a quadro) e o que falta construir.

## Estrutura de pastas de um projeto

```
data/projetos/<AAAAMMDD-slug>/       (data/ não vai para o git)
  roteiro.md          o roteiro em blocos [BLOCO] texto…
  planos.json         um plano por frase/trecho: n, bloco, texto, tipo (imagem|avatar|split), ancora, cena
  falas_avatar.json   as falas que a avatar diz na câmera (k, ini, fim, texto)
  ref/                retratos-âncora
  imagens/NNNN.png    uma imagem por plano
  avatar/aNN.mp4      takes do Omni
  voz/                narração (um arquivo por trecho entre falas da avatar) + tempos de cada palavra (.json)
  video/video.mp4     o vídeo final
```

## Como a montagem atual funciona

```bash
python work/video/montar_headcast.py "<projeto>" voz      # narração dos trechos entre as falas da avatar
python work/video/montar_headcast.py "<projeto>" montar   # monta o vídeo
HC_SEGS=12 python work/video/montar_headcast.py "<projeto>" montar   # prévia só com os 12 primeiros segmentos
```

1. **Linha do tempo** (`linha_do_tempo`): alterna "trecho narrado" e "fala da avatar". Fala sem take vira
   narração (o vídeo nunca fica com buraco).
2. **Tempo de cada imagem:** do início da 1ª palavra do plano até a 1ª palavra do plano seguinte, com os tempos
   de palavra do **Whisper** sobre o áudio narrado. É isso que deixa a imagem trocar exatamente na frase certa.
3. **Imagem:** parada, com zoom lento (4 movimentos alternados), leve granulação, saturação 0,92. **Sem
   animação** (veto do Eduardo).
4. **Take da avatar:** cortado na janela da fala (Whisper com folga de 0,15 s antes e 0,35 s depois). O áudio
   do take entra no lugar da narração.
5. **Tela dividida** (1 em cada 3 aparições): avatar com **45 %** da largura, take centrado, imagem nos 55 %
   restantes. (Com 25 % o rosto ficava cortado.)
6. Concatena sem recodificar, junta o áudio, **−16 LUFS**, 720p, AAC 160k, `+faststart`.
7. Depois: logo sobre a marca d'água do Omni (doc 02).

## O que a VSL de referência faz (medido: 3 fps, 3.600 quadros, 592 cenas)

| Medida | VSL francesa | Mamaw Opal (YouTube) |
|---|---|---|
| Duração | 20 min | 20,5 min |
| Duração mediana de cada plano | **1,3 s** | 4–5 s |
| Duração média | 2,0 s | ~4,4 s |
| Quem aparece mais | o apresentador na câmera | imagens, avatar a cada ~35 s |
| Legenda na tela | **sempre** | nunca |

Gramática visual da VSL (para copiar a forma, não o conteúdo):

- **Apresentador na câmera a maior parte do tempo**, em 3 enquadramentos que alternam a cada frase: plano médio
  sentado no sofá (com notebook), close, e em pé ao lado de um quadro branco desenhando a coluna. Cortes com
  "punch-in" (zoom de 1,1–1,3× no mesmo take) para dar ritmo sem trocar de take.
- **Inserções curtas (0,3–2 s)** sobre a voz dele: anatomia 3D (disco, nervo), pessoas com a mão nas costas,
  remédios, cirurgia, cadeira, sofá, celular, ressonância.
- **Quadro de imagem ao lado do rosto** (picture-in-picture à direita) quando ele explica uma peça: ícone, relógio
  "30 segundos", número de exercícios.
- **Cartelas pretas** com 1 frase em maiúsculas + ícone (alerta, cadeado, relógio, "Règle nº 1/2/3", "✓").
- **Efeitos de corte:** flash branco, quadro em preto e branco por 0,3 s, desfoque de movimento, tremida.
- **Depoimentos** num quadro de "câmera de celular" (moldura com REC, bateria, "4K 60FPS"), nome e idade na tela.
- **Legenda queimada sempre:** 1–2 linhas, maiúsculas, fonte condensada pesada, caixa escura semitransparente,
  centrada embaixo. **Cor por função:** branco = neutro; amarelo = ênfase/curiosidade; **vermelho = dor, ameaça,
  inimigo**; **verde = solução, benefício**.
- Fecha com a avatar dizendo o CTA e uma cartela final com seta "↓" durante ~18 s (o botão aparece embaixo do
  player).

## O que adaptar para a VSL da Carmen

1. **Proporção de avatar muito maior.** A Carmen precisa estar na câmera a maior parte do tempo, como o
   apresentador. Isso significa **muitos takes do Omni** (20 min ≈ 2.700 palavras ≈ 120+ takes de até 10 s) se a
   fala dela vier do Omni. Ver "Voz" abaixo: é a decisão que define o pipeline.
2. **Ritmo:** planos de 1–3 s, punch-in alternado dentro do mesmo take (já dá para fazer no ffmpeg com `crop`+
   `scale` por segmento), inserções curtas de imagem.
3. **Legendas queimadas** (falta construir): gerar um `.ass` a partir dos tempos de palavra do Whisper, blocos de
   até ~40 caracteres, maiúsculas, fonte tipo "Anton"/"Bebas Neue", cor por função (o roteiro marca as palavras
   com `{r}…{/r}` vermelho, `{g}…{/g}` verde, `{y}…{/y}` amarelo) e queimar com o filtro `subtitles` do ffmpeg.
4. **Cartelas pretas** (falta construir): gerar PNG com PIL (texto + ícone simples) e tratar como imagem de
   plano.
5. **Estilo das imagens:** trocar o "filmadora caseira de 2012" pelo **realista moderno**: luz natural, câmera
   atual, nítido. Anatomia em estilo ilustração 3D médica limpa (pode ser gerada no Vids; sem texto).
6. **Depoimentos:** só de usuários reais com autorização, ou dramatização com aviso na tela (doc 01, tabela).
   A moldura "REC" pode ser reaproveitada.
7. **Aviso de IA** discreto e permanente (doc 01).

## Voz

Decisão do Eduardo: **TTS do Google na conta Google Ultra.** Pontos que o próximo agente precisa resolver no
primeiro teste, antes de gerar em escala:

1. **Qual ferramenta exatamente.** Confirmar com o Eduardo onde ele quer gerar (ex.: geração de fala do Gemini/
   AI Studio ou a narração do próprio Vids) e escolher **uma** voz feminina em espanhol da Espanha, madura, calma.
   Fixar o nome da voz no projeto e nunca trocar.
2. **Consistência com a boca da avatar.** O Omni gera a **própria voz** em cada take (não recebe áudio). Se a
   narração vier do TTS e as falas na câmera vierem do Omni, as duas vozes podem soar como pessoas diferentes. Foi
   exatamente a reclamação do Eduardo no vídeo da Opal (lá a solução foi clonar a voz do Omni no MiniMax:
   `work/video/voz_opal.py` e `mm.py`). Testar com 3 falas: gerar no Omni e no TTS escolhido e comparar lado a
   lado. Se destoar, levar ao Eduardo as opções: (a) tudo na voz do Omni (mais takes, voz única); (b) TTS em tudo
   e a avatar só em planos sem boca visível; (c) uma ferramenta de lip-sync sobre o áudio do TTS.
3. **Tempo de cada palavra:** o pipeline usa o Whisper. Hoje ele carrega o modelo **inglês**
   (`fw_small_en`, em `FW_DIR`, padrão `D:\modelos`). Para espanhol, usar o multilíngue (`small` ou `medium`) com
   `language="es"`. Em CPU, o `medium` é lento demais para 20 min de áudio; o `small` em 4 pedaços paralelos
   transcreve 20 min em poucos minutos.

## Conferência antes de entregar

- Extrair 1 quadro a cada 3 s do vídeo final e olhar tudo (folhas de contato de 30 quadros). Procurar: rosto
  diferente, texto inventado em imagem, imagem que não bate com a frase, legenda fora de sincronia, a estrela do
  Gemini aparecendo.
- Loudness entre −16 e −17 LUFS; sem trecho mudo maior que 1 s.
- Ouvir os 2 primeiros minutos e o CTA inteiros.
