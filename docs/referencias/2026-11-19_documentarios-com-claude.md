# Documentários feitos com Claude: 3 tutoriais e 1 artigo (19/11/2026)

Leitura óptica com a `regua24.py` (`D:/pesquisa_nichos/regua24`, a mesma régua do K19 e do Lanús) e transcrição local com o faster-whisper. O material bruto fica em `D:/pesquisa_nichos/ref_<id>/`.

> **Cuidado:** os três vídeos são tutoriais. Parte do tempo é gravação de tela, então a régua mede o tutorial inteiro, e os números são só ordem de grandeza.

| Vídeo | Canal | Views / idade | Duração | Cortes/min | Takes/min | Câmera parada | Cartão |
|---|---|---|---|---|---|---|---|
| [YnZsjCwSdXo](https://youtu.be/YnZsjCwSdXo) Vox com material de arquivo | Lilly's Tech Tips (88 mil) | 16 mil / 1 dia | 6min41 | 6,3 | 14,7 | 47% | 33% |
| [TfKre3A4508](https://youtu.be/TfKre3A4508) Documentário com manequim 3D | Bots & All (178) | 621 / 7 dias | 5min19 | 11,1 | 16,0 | 38% | 6% |
| [NpcBmDSV0CQ](https://youtu.be/NpcBmDSV0CQ) Skill de true crime | Money Mastery Hub (34 mil) | 7,9 mil / 3 dias | 6min07 | 3,3 | 19,9 | 54% | 29% |

Os três vendem um produto (templates, master prompt ou skill). O que vale é o **método**.

## 1. Molde Vox com material de arquivo (Lilly's Tech Tips)
**Produto:** cold open sobre o bug do milênio. Mapa escuro, impressões de bordas queimadas, grão, câmera na mão lenta e contador "99 → 00".

**Como ela fez:**
1. O Claude propõe 5 cold opens com gancho de 1 linha. Ela escolheu um paradoxo: "US$ 300 bi para consertar, e nada aconteceu".
2. **Material de domínio público no archive.org**, com a busca `licenseurl:*publicdomain* <termo>`. Juntou 10 imagens e um filme de 1956. Sob a graduação de documentário, a aspereza parece real.
3. **O roteiro é escrito em volta das imagens**, para cada frase ter um plano. Depois ela lê em voz alta e corta.
4. Voz no ElevenLabs.
5. A 1ª animação em código ficou sem graça. A virada veio de um **quadro de Pinterest com o estilo** e um briefing de direção de arte ("mundo de mapa escuro, bordas queimadas, grão, câmera na mão lenta").
6. **Ajuste por trecho** ("pancada quando o contador pousar") sem refazer o resto.
7. **Música:** faixa adaptada por prompt, sem bateria. O Claude recorta a faixa para casar com a composição.
8. **Efeitos:** saem do banco do ElevenLabs; o Claude encaixa cada um no quadro certo.

**Para nós:**
- Material de domínio público como fonte e roteiro nascido do material.
- Quadro de referência de estilo mais briefing de direção de arte antes de animar.
- Ajuste = 1 batida.

## 2. Documentário com manequim 3D (Bots & All, estilo Zack D. Films)
**Produto:** história curta de crime ou guerra (Escobar, Operação Mincemeat), com manequins sem rosto e narração seca em frases curtas.

**Como fazem:**
1. Um master prompt gera 10 ideias. A duração (30 s a 10 min) define o número de cenas.
2. **Folha de personagens:** cor do manequim, porte, roupa, sinal distintivo e vários ângulos. É gerada uma vez e usada como referência.
3. **Dois prompts por cena:** um de imagem (cenário, luz, ângulo, posições, cores) e um de animação (movimento de câmera e **uma** ação simples).
4. Imagem no Flow com a folha de referência. Depois, do quadro para vídeo com o Omni, 6 s por cena e **movimento pequeno**, porque ação grande deforma o corpo.
5. Montagem no CapCut. O Claude ainda gera miniatura, 10 títulos e descrição.

**Para nós:**
- Folha de personagens para manter a consistência das imagens (Flow ou MiniMax H3).
- Contrato de 2 prompts por cena.
- **Manequim sem rosto resolve gore e rosto de vítima.**
- O vídeo por IA (Omni ou MiniMax H3) pode entrar onde o formato pedir; no Lanús ficou fora por decisão daquele vídeo.

## 3. Skill de true crime (Money Mastery Hub; referência: canal Gloam)
**Gloam:** 5 vídeos e ~8 mil inscritos. "How Binance Lost $6,300,000,000 in One Night" fez 2,5 mi em 2 semanas.

**Título:** número exato por extenso, mais tempo curto, mais nome famoso. Grande, rápido e famoso.

**Roteiro:**
1. Detalhe minúsculo ao lado de um número enorme.
2. Descartar o esperado: "sem tiros, sem túnel".
3. A virada.
4. O plano.
5. A noite, minuto a minuto.
6. "Devia ter acabado e não acabou."
7. O erro.
8. O fim volta à abertura.

**Visual:**
- Arquivo real em tela cheia.
- Fotos em **moldura branca de evidência**.
- Texto documental para lugar, hora e número.
- Cenas escuras com criminosos **sem rosto**.
- Câmera **sem corte**: alfinete no mapa → planta do prédio → sala.
- **Pausa de 2 s** no título de capítulo.

**Segurança do canal:**
- Recusa material marcado como restrito e usa material do governo dos EUA (domínio público), com crédito.
- Nunca nomeia quem não foi condenado.
- Prévia de 90 s antes do render completo, que leva de 1 a 2 h para 10 min.

**Para nós:**
- Essa fórmula de roteiro serve ao documentário de notícia.
- O voo mapa → planta → local é o take de mapa que faltou no Lanús.

## 4. Artigo @kaulabs: como dissecar um estilo viral (19/11)
**Resultado dela:** 8 estilos dissecados, 63 referências e ~2.800 quadros anotados com a fala, em 6 dias.

**Método em 7 passos:**
1. **Bancada:** yt-dlp, ffmpeg, whisper e Remotion, mais as pastas `estilos/`, `clientes/` e `recursos/`.
2. **Referências:** de 6 a 14 por estilo, separando sub-estilo. Com 1 referência você copia; com 10 vê o padrão.
3. **Quebra em planos:** 1 quadro do meio de cada plano, amarrado à fala exata daquele plano. Se passar 3 s sem corte, avisa: pode ser um estilo em que só um elemento troca dentro da tela.
4. **Medir em vez de adjetivar:** sempre mediana, cada número com a conta ("42 de 51 cortes"), e "não medido" quando não der.
5. **Separar linguagem de pele:**
   - **linguagem:** ritmo, câmera, estrutura e legenda;
   - **pele:** paleta, fonte e tema, que vão para uma skill da marca à parte.
6. **Guia com esqueleto fixo de 11 seções**, sendo a última "aprendizados e correções".
7. **Portões:** roteiro → voz com tempos → storyboard (com safe zone) → animatic → só então imagem de IA. Cada correção vira regra datada no guia.

**Números medidos por ela:**
| Estilo | Palavras/min | Música abaixo da voz | Outros |
|---|---|---|---|
| Vox retrô | 182–208 | — | 42 de 51 cortes em cima da palavra; 36 de 51 com efeito |
| Zack D. Films | ~170 | ~6 dB | legenda a ~78% da altura, 2 ou 3 palavras por vez |
| Rickclips | ~223 | — | nenhum plano parado > 0,4 s; cena nova a cada ~3 s |
| HeyHistorically | ~181 | ~4 dB | palavra-chave em vermelho e maior |
| Crayon Capital (longo) | 153 | — | corte mediano a cada 2,6 s; ~95% de corte seco |

**Aprendizados dela que valem para nós:**
- **Risers:** um só, no começo do vídeo.
- **Final:** ~0,8 s de respiro sem cortar a voz. A voz ~21 dB acima da música.
- **Imagem parada:** sozinha, não pode passar de ~1 s; parta em 2 ou 3 planos ou anime.
- **Destaque:** vai na informação (o número), não na palavra vizinha.
- **Zoom:** no máximo em 15 a 20% das cenas, alternando com pan e câmera parada.
- **Legenda:** dentro da área segura. No 1080×1920 do Instagram, entre x 60 e 950 e entre y 250 e 1500.
- **Acabamento:** grão e textura sempre.
- **Skills de terceiros** misturadas com as próprias pioraram o resultado.

**Teste dela de cenário:** three.js puro ficou com cara de protótipo. Imagem gerada reprojetada quadro a quadro por Python, com câmera de grua, foi aprovada (ver `docs/levantamentos/2026-11-19_achados-x-repos.md`, receita da foto 2.5D v2).

**Custo de tokens, que confirma o nosso BADPATHS-custo:**
- chat novo já nasce com ~100 mil tokens de ferramentas;
- chat de produção chega a 900 mil, e cada mensagem relê tudo;
- um chat acumulou 263 imagens;
- fork copia o chat inteiro.

O que ela faz:
- 3 sessões por vídeo;
- um `ESTADO.md` de ≤ 40 linhas;
- imagem só em subagente;
- conector pesado desligado;
- montagem no Sonnet.

## Referências de estilo enviadas pelo Eduardo (Pinterest, 19/11)
- [pin 648518415078406830](https://br.pinterest.com/pin/648518415078406830/): "Detective - After Effects". Colagem de recortes de foto com o título "DETECTIVE STORY" grande embaixo.
- [pin 810999845425155935](https://br.pinterest.com/pin/810999845425155935/): sem título público.

## O que entra no nosso pipeline de documentário
1. **Guia de estilo por formato:** medir a referência com o checklist do item 4 (palavras/min, dB, plano mediano, % de corte na palavra, altura da legenda) usando a régua 24 fps e o rea-video (`docs/levantamentos/rea-video.md`). Separar linguagem de pele, que no nosso caso é o canal.
2. **Roteiro:** fórmula de true crime mais gancho de paradoxo.
3. **Material:** primeiro domínio público (archive.org, governo dos EUA); o restrito não entra. Imagens geradas com folha de personagens e pessoas sem rosto.
4. **Visual:** quadro de estilo mais briefing antes de animar; moldura de evidência; voo mapa → planta → local.
5. **Portões:** storyboard e animatic antes de gerar imagem; prévia de 90 s antes do render completo.
6. **Som:** 1 riser, voz bem acima, 0,8 s de respiro no fim.
