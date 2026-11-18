# Kriegsmomente × unreal3d: direção de arte "Schlachtgemälde" (v1, 01/11/2026)

**Uma frase:** *as pinturas de batalha do século XIX ganham vida em 3D.* Realismo fotográfico no material e na luz, com a composição, a paleta e a atmosfera dos grandes painéis de 1870–1890: Anton von Werner (Panorama de Sedan), Alphonse de Neuville (*Le cimetière de Saint-Privat*, 1881, a mesma batalha do vídeo 12), Édouard Detaille e Carl Röchling.

O espectador deve sentir que entrou num quadro de museu que se move. Ninguém faz isso na guerra de 1870 no YouTube alemão.

## 1. Três registros (todo vídeo usa os três)
| Registro | Para quê | Visual |
|---|---|---|
| **Schlachtgemälde** (o quadro vivo) | Batalha, terreno, tropas, momentos-chave | Fotorrealista, luz de fim de tarde, fumaça de pólvora como massa luminosa, lente longa comprimindo as fileiras |
| **Moltkes Tisch** (a mesa do Estado-Maior) | **Estratégia:** manobras, ordens, telegramas, tamanhos de exército | Mesa de madeira escura sob lâmpada a óleo, mapa de época e **peças de Kriegsspiel** (os blocos que o Estado-Maior prussiano realmente usava) que se movem. **Transição-assinatura:** a câmera mergulha no mapa e sai no terreno real (match cut mesa → campo) |
| **Werkstatt** (a oficina) | 3–5 cenas 3D explicativas: Dreyse × Chassepot, culatra Krupp, mitrailleuse, telégrafo | Estúdio escuro, luz de recorte e aro, aço oxidado, latão, madeira com veio, **vista explodida** que se monta e desmonta, câmera macro lenta. Rótulos no Remotion |

## 2. Código de cor (casa com o vetor de título "Preußen × Frankreich")
| Papel | Cor | Hex (alvo após a gradação) |
|---|---|---|
| Prússia | azul-prussiano (o pigmento leva o nome) | `#1F3A5F` / destaque `#2E5C8A` |
| França | vermelho garance (a calça) | `#9E2B25` / destaque `#C23B2E` |
| Saxônia / aliados | verde-cinza | `#5B6B4E` |
| Luz | âmbar de fim de tarde | `#E8B46A` |
| Sombra | sépia-umbra (nunca preto puro) | `#2A2118` |
| Terra / trigo de agosto | ocre | `#B8975A` |
| Papel, mapa, Tisch | pergaminho | `#E9DFC7` |

**Regras:**
- Só azul e vermelho podem ser saturados em cena. O resto do mundo é dessaturado em ~25%.
- O azul e o vermelho valem também nos mapas, cartões, setas e miniaturas: **um só sistema de cor no canal**.

## 3. Luz (presets no Unreal)
- **Hora dourada (padrão da batalha):** sol a 8–15° do horizonte, 5.200–5.600 K, sombras longas, Lumen GI, Sky Atmosphere + Volumetric Clouds altocúmulos. O 18/08 terminou ao anoitecer; usar a hora real como desculpa dramática.
- **Crepúsculo e fogo:** St. Privat em chamas, céu índigo, fogo como fonte principal (3.000 K), fumaça iluminada por baixo.
- **Tisch:** uma lâmpada a óleo quente com falloff curto, o resto em penumbra; poeira no feixe (névoa volumétrica local).
- **Werkstatt:** fundo quase preto, uma key suave + dois rims, reflexos de estúdio (HDRI de estúdio só nos reflexos).

## 4. Câmera
| Plano | Lente | Movimento |
|---|---|---|
| Panorama da batalha | 35–50 mm | travelling lateral lento, altura de colina, horizonte no terço superior |
| Fileiras e colunas | **85–135 mm** (compressão) | pan lento, foco que corre da 1ª à 3ª fileira |
| Momento-herói (Garde diante de St. Privat) | 24 mm, baixa | dolly-in lento contra a fumaça |
| Tisch | 50 mm macro | push-in no mapa → mergulho para o terreno |
| Werkstatt | 100 mm macro, DOF f/2.8 | órbita de 30–60° e explosão das peças em câmera lenta |

**Regras:**
- Nunca mais de 4 s parado (regra do canal).
- Sem tremido de câmera de mão nos planos de quadro. Leve "respiração" só nos planos de soldado.
- DOF físico, desfoque de movimento de 180°.

## 5. Atmosfera e efeitos (o que impressiona)
- **Fumaça de pólvora negra** como protagonista visual. Volume branco-cinza que pega o âmbar do sol, se acumula em bancos e esconde e revela as fileiras. É a imagem que define 1870.
- Partículas de poeira e palha no ar, contra a luz.
- **Névoa de distância** em camadas (aérea), que dá a escala de 200 mil homens.
- Fogo de St. Privat com brasas subindo no crepúsculo.

## 6. Gradação ("Kriegsmomente 1870" LUT)
- Tonemapper fílmico, sombras levantadas para sépia, realces âmbar, verdes deslocados para oliva.
- **Granulação de filme** 0,15–0,25.
- **Vinheta** 0,25–0,35.
- **Aberração cromática** ≤ 0,1, só nas bordas.
- Bloom baixo (só fogo e céu).
- **Transição "quadro → vida"** (abertura e momentos-chave): o plano começa com textura de pincel e verniz de óleo (pós-processo de pinceladas suave) e "descongela" para fotorrealista em 1–2 s. É uma assinatura que nenhum concorrente tem.

## 7. Texto e marca (Remotion)
- Títulos e contadores em serifa clássica (estilo Cormorant ou EB Garamond); números em versaletes.
- Rótulos técnicos da Werkstatt em grotesca fina (estilo Inter Light).
- Nada de Fraktur no corpo do texto (ilegível). No máximo num selo.
- Marca d'água discreta: só "@Kriegsmomente". Sem SIMULATION. Créditos só na descrição.

## 8. Miniaturas
Still do próprio render na mesma gradação, mais o rosto (regra das 3 miniaturas). O azul e o vermelho brigam no quadro: Prússia à esquerda, França à direita.

## 9. Como garantir que fique premium (portões)
1. **3 quadros de estilo antes de produzir** (um por registro): Schlachtgemälde (Garde diante de St. Privat ao pôr do sol), Moltkes Tisch (mapa com blocos) e Werkstatt (Dreyse explodida). O Eduardo aprova os três **antes** de qualquer cena.
2. Comparação lado a lado com um quadro de vídeo já entregue no T2 e com a pintura de Neuville.
3. Só depois a produção: nada entra no vídeo fora da paleta e dos presets aprovados.
