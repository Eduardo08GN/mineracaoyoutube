# Fatia 1 x Elias Yoder: leitura ótica a 1 fps, lado a lado (08/10/2026)

Fonte: "Two Spoons of Borax... The Cheap Old Trick" (Amish Gardening, `NVybSB_2iew`), primeiros 144 s,
contra `work/video/fatia01/fatia01.mp4` (v1, 144 s). Folhas lado a lado: 1 quadro por segundo, Elias à
esquerda e nós à direita, 16 s por folha (`ffmpeg ... hstack,tile=2x8`). Medidas: `$TEMP/claude_med/*.py`
(cortes por salto de imagem, ação do sujeito por fluxo óptico com o movimento de câmera descontado,
fala por whisper com tempo de palavra, silêncio a -45 dB).

## Os números

| | Elias | Fatia 1 (v1) |
|---|---|---|
| Tomadas em 144 s | 34 | 31 |
| Duração da tomada (média · máx) | 4,2 s · 6,2 s | 4,7 s · **21,5 s** |
| Tomadas acima de 6 s | 1 | **7** |
| Tomadas abaixo de 2 s | 0 | **6** (time-lapse de 0,8 s) |
| Segundos com ação do sujeito (>1% da imagem, câmera descontada) | **81 de 144** | 53 de 145 |
| Avatar ou tela dividida na tela | 0–5, 17–21, 34–39, 51–55, 61–65, 74–76, 114–118, 131–133… (a cada ~15–25 s) | **0–5 e 25–31, depois nunca** |
| Palavras por minuto | 157 | 131 |
| Pausas na fala > 0,3 s | 31 (média 0,62 s) | **54** (média 0,76 s) |
| Silêncios > 0,25 s a -45 dB | 15 | **46** |
| Brilho / saturação média | 105 / 0,30 | **125 / 0,41** |
| Volume | -16,5 LUFS | -15 LUFS |

## As divergências (em ordem de peso)

1. **B-roll sem ação.** No Elias quase todo b-roll é alguém fazendo alguma coisa: mão segurando a caixa
   (5–8 s), mulher despejando pó na tina (8–14), alguém andando na cozinha (14–17), homem lendo a caixa no
   jardim (17–21), carpindo a horta (66–70), mão pondo a caixa na prateleira (40–43), colher com pó
   (56–60), raspando a colher com faca (101–106), passando o livro de mão em mão (139–142). Nós mostramos
   planta parada em vaso, com zoom lento: só a câmera se mexe. Causa: as imagens são fotos de objeto, e os
   clipes do Veo têm quadro inicial = final, então o Veo só aproxima e volta.
2. **O avatar some.** Ele volta a cada 15–25 s, em tela cheia ou dividida. O nosso aparece 2 vezes nos
   primeiros 31 s e nunca mais. O vídeo vira uma narração de slides.
3. **A narração para a cada frase.** Ele fala corrido (157 ppm, respiros de 0,3–0,6 s) e o corte cai no
   meio da frase, num ritmo próprio de ~4 s. Nós cortamos exatamente onde a frase acaba e deixamos meio
   segundo de silêncio: 46 silêncios contra 15. Isso é o que dá a sensação de slideshow.
4. **Enquadramento do avatar.** O dele é do peito para cima, com o rosto ocupando ~40% da altura, câmera na
   altura dos olhos, quase uma webcam. O nosso é um plano médio aberto do monge sentado à mesa (rosto ~15%).
5. **Tela dividida.** No Elias o avatar fica numa faixa estreita (~1/4 da largura) colada ao rosto, e o
   clipe ocupa ~3/4. A nossa é metade/metade, com o plano aberto.
6. **CTA longo demais e de uma tomada só.** O livro dele dura ~13 s, cortado a cada ~4 s em cenas reais
   (livro na mesa com chá, mãos segurando, livro sendo entregue). O nosso é um bloco de 21,5 s de motion
   graphics sem corte (e com texto na tela, o que ele nunca usa; o texto fica porque é a URL do livro).
7. **Mesma imagem repetida.** p07 3 vezes, p03, p08, p14 e p15 2 vezes cada, e p15 em dois planos
   seguidos (67–75 s: 8 s do mesmo vaso morto). Ele não repete plano.
8. **Pouca variedade de escala e de assunto.** Ele alterna geral (fazenda, celeiro, horta), médio (pessoa
   trabalhando), fechado (mãos, colher) e foto de época em sépia. Nós ficamos quase só em close de vaso na
   janela.
9. **Corte curto demais.** O time-lapse em 5 cortes de 0,8 s quebra o ritmo; a tomada mais curta dele é
   2,2 s.
10. **Imagem polida demais.** A nossa é mais clara (+20 de brilho) e mais saturada (+35%), com cara de
    foto de catálogo. A dele é natural e apagada, de câmera de celular ou banco de imagens.
11. **Fala lenta.** 131 ppm contra 157 (em alemão a palavra é mais longa, mas o alvo é 140–150).

## O que mudou na pipeline (`work/video/montar_fatia.py`, v2)

| # | Regra nova | Resolve |
|---|---|---|
| A | A narração vira UMA faixa contínua (respiro de 0,22 s entre frases, 0,5 s na troca de seção), e o vídeo é cortado por cima dela numa grade de ~4,2 s (3,2–5,4 s), no vão entre duas palavras, sem esperar a frase acabar | 3, 9 |
| B | Avatar do peito para cima (punch-in de 1,8x centrado no rosto) | 4 |
| C | Tela dividida com faixa de 1/4 colada ao rosto + clipe em 3/4 | 5 |
| D | O CTA é cortado em planos de ≤4,5 s com enquadramentos diferentes (geral, livro, título, placa da URL, páginas) renderizados em 4K, para o recorte ficar nítido | 6 |
| E | Grade de cor no b-roll: saturação 0,8, brilho -0,03, contraste 1,04, grão leve | 10 |
| F | Nenhum plano repete imagem; foto parada no máximo 3,6 s; nenhuma tomada abaixo de 2,2 s | 7, 9 |
| G | Fala com velocidade -3% (era -10%) | 11 |
| H | Portão de ação: a montagem mede a ação do sujeito de cada b-roll (fluxo óptico, câmera descontada) e lista as tomadas paradas no relatório | 1 |

## v3 → v4 (09/10): a costura, a marca d'água e o avatar

O Eduardo viu a v3 e apontou três problemas: "cortes secos e amadores", texto semitransparente que passou
("...Homegarden Project" sobre a lavanda) e o avatar só duas vezes.

| # | Regra nova | Onde |
|---|---|---|
| I | **Costura de montador** no lugar do corte seco. Dentro do b-roll, corte seco no mesmo assunto (corte na ação) e fusão de 0,4 s quando a erva ou o assunto muda, ou numa frase nova depois de 2 cortes secos. Avatar ↔ narração: fusão de 0,33 s. Entrada e saída dos motion graphics e do CTA: mergulho no creme do papel (0,67 s). Troca de seção: fusão com clarão de película âmbar (0,8 s). Nada de efeito em todo corte nem cortina vistosa | `costura.py` |
| J | **Respiro de 0,4 s** nas bordas de cada bloco (narração com silêncio antes e depois, avatar com a janela mais larga). A transição entre blocos cruza imagem **e** som só dentro desse silêncio, então a fala de um bloco nunca pisa na do outro. A duração de cada transição é limitada pelo silêncio medido nas bordas | `costura.costurar_blocos` |
| K | Tudo em quadros (30 fps; o áudio a 48 kHz dá 1.600 amostras por quadro): cada plano é estendido pelos quadros que a fusão come, e a sincronia com a narração não escorrega | `montar_fatia.render_tomadas` |
| L | **Marca d'água**: segunda passada de OCR com 7 quadros por trecho, contraste realçado e quadro invertido, confiança 0,3. Se **um** trecho de uma fonte tem texto ou selo, a **fonte inteira** sai, porque o selo aparece e some. Os falsos positivos (folhagem lida como letra) são conferidos no olho e marcados como `texto_revisto: falso`. No vídeo completo só entram trechos já revisados | `revisar_texto.py`, `montar_*.limpo` |
| M | **Avatar no Veo 3.1 Fast** com o personagem "Bruder Wendelin" (Elementos), 10 créditos por take, 18 falas curtas espalhadas pelas seções 3–14 (a cada 20–40 s), em três cenários (cozinha, banco no jardim, bancada do galpão). A voz do take vai para o timbre da narração (OpenVoice, tau 0,3), e o recorte do peito para cima centra no rosto detectado | `gerar_avatar.py`, `voz_conrad.py` |
| N | Teto de bitrate: o grão de filme a crf 17 sem teto dava ~80 Mbps (1,9 GB para 3 min). Agora são 25 Mbps nos intermediários e 16 Mbps na entrega | `VID` |
| O | Motion graphics: os pássaros passam **uma** vez pela faixa alta e somem. Antes congelavam na tela ao fim da cena e cruzavam os títulos | `mg_comum/mg.js` |
| P | Recortes das ervas **escolhidos no olho** entre 8 candidatos por erva. A nota automática tinha posto manjericão como salsinha, um vaso como hortelã, um homem como tomilho e uma tigela de comida como coentro | `recortes_ervas.py` |

### O vídeo completo (09/10): `work/video/completo/video_completo.mp4`

- **Duração e técnica:** 17,7 min, 1920×1080, 30 fps, 15,7 Mbps, −16 LUFS integrado.
- **Blocos:** 47, ligados por 46 transições: 32 fusões curtas, 8 mergulhos no papel e 6 clarões de troca de seção. Nenhuma ficou como corte seco por falta de silêncio.
- **Avatar:** 18 entradas, das quais 16 são takes novos (a cada 20–60 s nas seções narradas). Avatar ↔ b-roll entra em fusão; a voz do take entra inteira (J/L-cut).
- **Verba do Veo:** 200 créditos (saldo 23.930 → 23.730), assim distribuídos:
  - 160 créditos: 16 takes aproveitados.
  - 20 créditos: a02 gerado sem o personagem (anexo apagado ao colar o texto).
  - 20 créditos: a05 e a10 refeitos (o travessão virava gaguejo).
- **Revisão no olho do banco de b-roll:** 3 quadros por trecho, 136 trechos. Saíram 21: 11 com rosto (o Haar não pega perfil nem gente agachada), 5 fora do tema, 3 parados, 1 com texto e 1 com transição embutida.
- **Leitura a 1 fps do vídeo inteiro** (1.063 quadros, 23 folhas): nenhum rosto de terceiro, texto ou marca d'água encontrado.
- **O que ainda pesa:**
  - O banco limpo é curto para 18 min. Algumas fontes voltam em pedaços diferentes (a composteira, as sementes na peneira).
  - A etiqueta automática erra a espécie: alecrim aparece etiquetado como tomilho, e folha de pessegueiro como coentro.
  - As seções 12–14 usam as imagens próprias (as mãos do monge geradas pelo Veo) com movimento de câmera.
- **Próximo passo:** buscar fontes por espécie com termo em alemão **e** inglês, e conferir a espécie no olho antes de etiquetar.

## O que a edição sozinha não resolve

- **Ação no b-roll (1) e variedade (8)** pedem filmagem nova: clipes de gente fazendo coisas. As fontes
  possíveis são banco grátis (Pixabay, falta a chave) ou o Veo (cobra ~5 créditos por clipe na conta da
  Ivone). Para o Veo, a regra do pedido passa a ser: toda cena de b-roll tem um verbo de ação humana
  (mãos regando, cortando, plantando, carregando), câmera na mão, e quadro FINAL diferente do inicial
  (o estado depois da ação), senão o clipe só aproxima e volta.
- **O avatar a cada ~20 s (2)** precisa de mais takes de fala: cada um é uma geração do Veo.
