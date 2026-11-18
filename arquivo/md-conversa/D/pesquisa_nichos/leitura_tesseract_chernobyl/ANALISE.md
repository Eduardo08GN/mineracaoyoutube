# Leitura a 24 fps: "Chernobyl", feito com Opus 5.5 + Tesseract (06/11/2026)

**Vídeo:** 26,3 s, 1080p30, lido a 24 fps (631 quadros).
- Curvas: `leitura_curvas.png` (diferença, zoom, translação e resposta de fase por quadro).
- Fitas quadro a quadro: `fita_t1..t4.jpg` (40 quadros seguidos, 1,6 s cada).
- Script: `ler.py`.

## Números
| Medida | Chernobyl | K18 (trecho de 26 s) | K18 inteiro |
|---|---|---|---|
| Movimento médio (régua `ler24`, 160 px) | 4,85 | 2,48 | 1,64 |
| Quadros quase parados | 1% | 17% | 4% |
| Quadros idênticos ao anterior | 4 de 631 | — | — |
| Cortes secos | 0 (só 1 no fade final) | 4 | — |
| Transições motivadas pelo conteúdo | 5, de 0,6 a 1,8 s | 0 | — |
| Fração da mudança por quadro que é detalhe fino (grão, partículas) | ~55% (dif 6,1 bruta contra 2,8 com desfoque de 3 px) | — | — |

## O que as curvas mostram
1. **A câmera nunca para.** Há um empurrão contínuo de ~0,1% de zoom por quadro (~2,4%/s) com deriva lateral leve, do primeiro ao último quadro. A resposta de fase fica em 0,9 fora das transições: é a mesma imagem deslocando, um 2,5D de foto.
2. **Cinco quedas da resposta de fase = cinco transições, todas motivadas pela história:**
   - **4,8–5,9 s, usina → sala de controle:** a fumaça da explosão cresce e enche o quadro. As letras de "CHERNOBYL" são **comidas pela fumaça uma a uma** (o texto está atrás da fumaça, numa camada do mundo, e não é adesivo por cima). Depois de ~8 quadros de tela cheia de fumaça, a sala aparece por buracos escuros da fumaça.
   - **8,5–10,3 s, explosão → mapa:** o fogo vira o ponto vermelho no mapa da URSS. É um match de forma.
   - **15,8–17,0 s, mapa → nuvem → estação:** a nuvem radioativa entra pela esquerda e cobre o mapa. O "×400" se **desintegra em partículas** em 2–3 quadros. Ficam ~24 quadros de nuvem pura à deriva, e a estação surge pelos buracos da nuvem, com revelação por luminância.
   - **18,6–19,6 s:** o contador "48.300 → 49.000 people" sobe dentro do plano, enquanto o resto da imagem respira.
   - **22,2–22,8 s, estação → Pripyat:** o texto sai primeiro ("people. Pack for three days"). Depois vem um tilt vertical com borrão de movimento (pico de 6% do quadro por quadro) que cai na moldura da janela de Pripyat. É um match de enquadramento.
3. **O grão e as partículas animadas** (neve, poeira, granulação de filme) respondem por mais da metade da mudança de cada quadro. Mesmo com a câmera lenta, o quadro está sempre vivo.

## A tipografia, quadro a quadro
- **Data:** em máquina de escrever ("April 26th, 1986." e depois "01:23 AM" em monoespaçada).
- **Frase:** palavra a palavra, com desfoque de entrada, em serifa itálica. A palavra-chave vem em vermelho ("a *routine* safety test", "They *never* came back").
- **Número:** gigante, contando, com a unidade em serifa menor embaixo e o comparativo em monoespaçada ("HIROSHIMA ×1").
- **O texto vive na profundidade da cena:** a fumaça e a nuvem passam na frente dele e o apagam.

## Por que é melhor que o nosso (e como chegar lá)
| Deles | Nosso hoje | Como chegar |
|---|---|---|
| Foto de base fotorrealista (IA), com luz, profundidade de campo e pretos | Terreno por código, chapado | Imagem de base gerada na G4, ou modelos Fab/Megascans com render de verdade |
| Push contínuo 2,5D | Plano parado e corte seco | Câmera sempre em movimento + parallax com Depth Anything (já usado no K18) |
| Transição por elemento da história (fumaça, nuvem, fogo → ponto) | Corte seco | Biblioteca de transições motivadas: fumaça, nuvem e poeira (flipbooks JangaFX/Fab), match de forma e de enquadramento |
| Grão + partículas + vinheta + correção de cor | Quadro limpo | Camada de acabamento fixa no Remotion (grão animado, partículas, vinheta, LUT) |
| Texto dentro da cena, ocluído pela fumaça | Texto por cima, pequeno | Texto como camada com profundidade (atrás da fumaça), número grande contando |

Atenção: são 26 s de vitrine (marketing, com o selo "4.3M visualizaciones" gravado no próprio vídeo). Não é um vídeo de 15 min. O método, porém, é barato e escala: uma foto por batida + câmera contínua + transição motivada + camada fixa de acabamento.
