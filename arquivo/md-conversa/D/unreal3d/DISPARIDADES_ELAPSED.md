# Leitura óptica: Elapsed × nossa stack Unreal (Kriegsmomente) — 02/11/2026

**Referência:** "What if all Humans disappeared?" (@ElapsedYT, 101 mil views, UE5).
- 18 quadros capturados em 1080p nos tempos 8 s → 585 s, em `D:\tmp\elapsed\e_*.png`.
- Folhas `folha_A.jpg` e `folha_B.jpg`.

**Nosso lado:** stills de 02/11 (`quadros/schlacht_previa_2139/2141/2145/2147.png`).

**Comparação:** `LADO_A_LADO_ELAPSED.jpg`.

**Veredito do Eduardo:** "o nosso parece vídeo de PS2 antigo; o do Elapsed parece stack mais moderna, leve e smart".

**Conclusão da leitura:** o Elapsed também é UE5, então a engine não é a diferença. A diferença está em quatro camadas que nós não montamos: luz global convergida, pacote de vegetação densa estilizada, pós-processo de cinema e direção de câmera. Abaixo vai tudo, item por item.

## 1. Render: o que faz parecer "PS2"

| # | Elapsed | Nosso | Causa no nosso código | Correção |
|---|---|---|---|---|
| 1.1 | **Luz global (Lumen) convergida:** sombra colorida pela luz que rebate (verde sob as copas, azulada no céu), nada fica preto puro | Sombra chapada e escura, sem rebote; o close das fardas fica "apagado" | `renderizar(..., aquecimento=0)` na Schlacht: o Lumen precisa de quadros de aquecimento para acumular. A Tisch e a Werkstatt usam 16/96 | Aquecimento ≥ 64 na prévia e ≥ 128 no final; `r.Lumen.ScreenProbeGather.DownsampleFactor` 8 → 2 no final |
| 1.2 | **Bordas suaves (TSR/TAA):** folhas finas sem serrilhado | Serrilhado e "escada" nas folhas de capim e nos fuzis | Prévia com `amostras_t=2` e AA = NONE | Prévia com 8 amostras temporais e final com 32; ou TSR ligado |
| 1.3 | **Sombras de contato nítidas e manchadas** (sombra de copa recortada no chão, `e_110`) | Sombra dura sob cada tufo, sem penumbra e sem contato | Virtual Shadow Maps com bias genérico; sol puntual | Raio de fonte do sol de 0,5–1°; contact shadows; `r.Shadow.Virtual.*` em qualidade cinema |
| 1.4 | **Oclusão de ambiente** dentro das copas e entre as plantas, o que dá volume | Plantas parecem recortes chapados | Sem Lumen convergido, o AO some; a malha do kit é flat-shaded | Vem com 1.1, mais AO em tela no pós |
| 1.5 | **Perspectiva aérea:** o fundo azula e clareia (`e_175`, `e_290`) | Horizonte duro, a vila a 200 m com a mesma saturação do primeiro plano | Névoa quase zero no look ilustrado (0,0006), céu escuro | Névoa de altura + cor do céu no fundo, densidade calibrada por distância |
| 1.6 | **Nuvens volumétricas estilizadas**, iluminadas pelo sol, com bordas claras | Céu azul-marinho escuro (prévia 2139) ou nuvens de "cartão" | Exposição baixa, nuvem padrão do VolumetricCloud | Material de nuvem estilizado e exposição calibrada no céu |

## 2. Pós-processo (assinatura "de cinema")

| # | Elapsed | Nosso |
|---|---|---|
| 2.1 | **Aberração cromática** leve nas bordas: franja RGB visível no poste e nas folhas do `e_008` | Nenhuma |
| 2.2 | **Grão de filme** fino, constante | Grão 0,03, invisível |
| 2.3 | **Profundidade de campo** com bokeh: primeiro plano desfocado e foco no meio. Nos aéreos, efeito de **miniatura** (tilt-shift) | DOF só no close, e ali ele "apaga" metade do quadro em vez de emoldurar |
| 2.4 | **Gradação teal-orange:** sombras ciano e azuis, altas luzes quentes, pretos levantados e contraste suave (look de filme) | Cores primárias brutas: amarelo-gema no chão e azul-marinho no céu, sem harmonia |
| 2.5 | Bloom suave nas altas luzes (sol nas copas) | Quase nenhum |
| 2.6 | Vinheta leve | Vinheta 0,12 |

## 3. Assets e direção de arte

| # | Elapsed | Nosso | Correção |
|---|---|---|---|
| 3.1 | **Vegetação densa em camadas:** o chão quase não aparece; capim, arbusto, flor, samambaia e árvore em alturas diferentes (`e_110`, `e_210`) | Plano ocre infinito com tufos espaçados de forma uniforme: cara de deserto ou PS2 | Espalhar com o **PCG** do UE5 em aglomerados (ruído), 10–50× mais instâncias, com chão texturizado embaixo |
| 3.2 | **Árvores de "folhas-cartão" estilizadas:** muitas folhas em camadas, com cor variando por árvore (laranja, rosa, amarelo, verde) e vento | Árvores Quaternius de baixo polígono e flat-shading (copa em blocos), todas da mesma cor | Pacote de folhagem estilizada mais moderno (Fab, grátis ou CC0, com folhas-cartão e vento) ou recriar copas com cartões |
| 3.3 | **Terreno com relevo** (colinas, margens, ruas com meio-fio) | Plano inclinado 3°, sem relevo | Landscape com ruído suave e caminhos de terra, sulcos de arado e cercas |
| 3.4 | **Coerência de estilo:** tudo no mesmo nível de estilização | Choque de estilos: soldados Woodhead semirrealistas sobre ambiente "brinquedo" Quaternius | Escolher um nível só, por exemplo soldados com sombreamento estilizado (cel/gradiente) e ambiente no mesmo nível de detalhe |
| 3.5 | Paleta harmônica: água turquesa contra folhagem quente, saturação seletiva | Saturação igual em tudo | Paleta-guia por cena (2 dominantes + 1 acento) |
| 3.6 | Escala legível (carros, postes, bancos) | Vila e soldados pequenos, sem objetos de escala humana por perto | Objetos de escala no primeiro plano (cerca, carroça, cesto, marco de pedra) |

## 4. Fotografia e câmera

| # | Elapsed | Nosso |
|---|---|---|
| 4.1 | **Câmera baixa entre as plantas**, primeiro plano emoldurando (folhas atravessando o quadro em `e_110`) | Câmera a 1,5–6 m sobre um chão vazio |
| 4.2 | **Linhas-guia:** faixa de pedestres, ponte, rio | Sem linhas-guia; as colunas ficam como manchas |
| 4.3 | **Camadas** frente / meio / fundo, separadas por foco e névoa | Tudo no mesmo plano de nitidez e cor |
| 4.4 | **Plano fixo (lock-off) com a mudança acontecendo no tempo:** a mesma câmera em 7 s → 25 anos (`e_008`→`e_030`, `e_175`→`e_250`) | Ainda sem linguagem de movimento definida |
| 4.5 | Aéreo diorama (miniatura) com tilt-shift | Aéreo "maquete crua" |

## 5. Tipografia e interface

| Elapsed | Nosso (Remotion) |
|---|---|
| Serifa elegante (romana + itálica), versaletes espaçados como subtítulo ("LONGER THAN A LUNAR CYCLE"), legenda itálica centralizada embaixo, sem caixas nem barras | Caixas, HUD e rótulos de dados (bom para explicar, mas visualmente pesado) |

Proposta: um modo "cinema" no Remotion para os planos de Unreal, com serifa e menos caixas. O HUD fica para as cenas explicativas.

## 6. Plano de correção, em ordem de impacto por custo

1. **Render**, sem trocar asset nenhum:
   - aquecimento do Lumen;
   - 8 ou mais amostras temporais (TSR);
   - sombra do sol com raio;
   - névoa e perspectiva aérea;
   - exposição calibrada no céu.

   Esse passo, sozinho, tira o "PS2" de sombra e serrilhado.
2. **Pós de cinema:** aberração cromática 0,3, grão 0,15, DOF com bokeh, LUT teal-orange e bloom suave.
3. **Vegetação e terreno:** PCG em aglomerados densos, landscape com relevo, chão texturizado e um pacote de folhagem estilizada moderna no lugar do Quaternius nas árvores e no capim de perto.
4. **Câmera:** baixa entre as plantas, primeiro plano emoldurando, linhas-guia (estrada de Saint-Privat, sulcos) e lock-off com a ação acontecendo.
5. **Coerência dos soldados:** shading estilizado ou ambiente mais detalhado, um nível só.

**Batedor seguinte:** 1 + 2 + câmera no mesmo cenário, depois 3. Comparar sempre lado a lado com o quadro do Elapsed equivalente.
