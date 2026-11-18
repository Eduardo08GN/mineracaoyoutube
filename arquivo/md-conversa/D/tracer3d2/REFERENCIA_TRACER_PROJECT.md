# Referência: assinatura de edição do Tracer Project (análise de 25/10/2026)

Vídeo analisado: "Scientists Just Mapped the 9.0 Cascadia Megaquake" (Tracer Project, 13:47, ~61 mil views em 3 dias).
Método: leitura óptica a **10 fps** (8.265 quadros), detecção de cortes por histograma e diferença de quadro, folha de contato por plano (107 planos), quadros em 1080p dos planos-chave e transcrição das legendas originais.
O mesmo método foi aplicado ao nosso vídeo 6 (1870/71). O material bruto fica fora do repo: `<projetos>/ref/__pfCTcBb5U/`.

## 1. Números medidos (eles × nós)

| | Tracer Project (Cascadia) | Nosso vídeo 6 (1870/71) |
|---|---|---|
| Duração | 13:47 | 18:01 |
| Planos (cortes secos) | 107 · média 7,7 s · mediana 4,9 s | 180 batidas · média ~6 s |
| Planos < 2 s / > 8 s | 23 / 38 | — |
| Quadros quase parados | 35% | 37% |
| Janelas de 4 s paradas | 50 de 206 (24%) | 43 de 270 (16%) |
| **Famílias visuais** | **7 a 8, bem distribuídas** | **3 dominantes** |
| Imagem real (filmagem/foto) | **~26%** | ~8% (fotos/pinturas em cartão) |
| Mapa | ~28% | **~63%** |
| Cena 3D de simulação | ~17% | ~18% |
| Gráfico/fórmula | ~14% | ~11% |
| Título/transição | ~8% | — |

**Conclusão:** o ritmo de corte e a quantidade de movimento são parecidos. A sensação de "poucos b-rolls" vem de duas coisas:
1. **Monotonia de família:** quase dois terços do vídeo são o mesmo mapa bege.
2. **Acabamento:** nossos 3D novos ficaram com cara de maquete (low-poly, materiais lisos, luz chapada). Os deles têm textura, camadas, brilho e profundidade.

## 2. A stack que se vê na tela
As notas de rodapé dos próprios vídeos confirmam:
- **3D em tempo real com dados reais:** terreno e batimetria AWS Terrain Tiles, luzes de cidade NASA Black Marble e prédios do OSM extrudados.
  - Estética de WebGL/three.js renderizado (bloom, emissivos, estrelas): é a mesma família da nossa stack.
- **Modelos físicos simples e declarados na tela:** o tsunami é a equação de águas rasas 1D sobre o perfil real do fundo; o prédio é SDOF com 5% de amortecimento. O rigor vem do modelo simples e honesto, não do VFX.
- **Diagrama de bloco geológico** (terreno + estratos em corte com textura de camadas e ruído) como imagem-assinatura recorrente.
- **Cidade estilizada à noite:** fachadas com janelas acesas, letreiros neon ciano e vermelho e carros com faróis. Low-poly, mas **com luz rica** (emissivos + bloom + neblina). O low-poly só funciona com luz boa.
- **Filmagem real rotulada** "REAL FOOTAGE · evento, ano" no canto (Japão 2011, Loma Prieta 1989, Alasca 1964).
- **Fotos de prova:** anéis de árvore, régua sobre testemunho de sedimento e floresta-fantasma.
- **Tipografia:**
  - sans geométrica bold em caixa-alta para títulos;
  - mono para números;
  - fórmulas em serifa itálica (estilo LaTeX);
  - cartão "THE MATH" em ciano com brilho.

## 3. Assinatura de edição (o que repetir)
1. **Cold open dentro da cena:** lugar, hora e um detalhe sensorial. Depois o aviso "é simulação, mas nada é inventado", e o título.
2. **Relógio de evento sempre visível** (T+00:48). O nosso contador de efetivos e de datas cumpre esse papel.
3. **Legenda-manchete inferior esquerda:** barra vertical de cor, frase-chave em caixa-alta e sublinha mono pequena. Uma por plano importante ("P WAVES REACH THE COAST", "SEASIDE, OREGON · T+29 MIN").
4. **KPI no canto superior direito:** rótulo pequeno e número grande em mono vermelho ou ciano, contando.
5. **Blocos "A matemática, parte N":** curtos, com fórmula sobre imagem escurecida, e voltam à ação logo depois.
6. **Virada "isso já aconteceu":** a simulação vira história documentada, com provas físicas fotografadas.
7. **Fecho honesto:** o que se sabe e o que não se sabe, mais a "boa notícia".
8. **Paleta:** fundo marinho escuro com acentos ciano, laranja e vermelho, e o brilho guiando o olho.

Diferença de regra do nosso canal: eles põem crédito e método no rodapé e o selo SIMULATION. **Nós não:** créditos só na descrição e sem selo (pedidos do Eduardo, 24/10/2026).

## 4. Regras para os próximos vídeos (Kriegsmomente, Tracer3D 2.0)

### Mistura de b-roll (o planejador confere e o `plano.py` mede)
- **Mapa no máximo 35%.**
- **3D de simulação pelo menos 25%.**
- **Imagem de época pelo menos 20%:** pinturas, gravuras e fotos PD em **2.5D com paralaxe**. Profundidade estimada na G4 com o **Depth Anything V2 Small** (Apache-2.0; os modelos Base e Large são não comerciais), mais câmera e partículas (fumaça, poeira).
  - É o equivalente do "REAL FOOTAGE" deles: rótulo "ZEITGENÖSSISCHE DARSTELLUNG · pintor, ano" ou "ORIGINALFOTO 1870".
- **Gráfico, fórmula e cartão até 20%.**
- **Nunca mais de 3 batidas seguidas da mesma família.**

### Acabamento (para os agentes de cena inédita)
- **Nada de figura low-poly em close.** Figuras instanciadas só a média e longa distância, com luz de recorte e atmosfera; em close, use pintura em 2.5D ou silhueta.
- **Materiais PBR com textura:**
  - aço Krupp com anisotropia e marcas de usinagem;
  - bronze com pátina;
  - madeira com veio;
  - terra com mapas de normal e rugosidade (Poly Haven, ambientCG, CC0).
- **Luz em camadas:** luz-chave mais preenchimento frio, AO, bloom sutil em emissivos (fogo, boca do canhão, lampião), neblina de profundidade e fumaça volumétrica (flipbooks já adotados).
- **Diagrama de bloco do campo de batalha:** terreno real (GLO-30 + satélite) em corte, com estratos, para St. Privat, Spichern e o meandro de Sedan. É a nossa versão do bloco geológico deles.
- **Mapa com profundidade:** relevo em hachura (`hachure.py` do batedor), papel, sombra das setas e unidades com volume. Nunca o bege liso por vários planos seguidos.
- **Revisão:** folha de contato a 1080p dos quadros-chave de cada inédita, antes do render. Cena com cara de maquete volta para o agente.

### Conteúdo (pedido do Eduardo, 25/10/2026)
- A espinha é **ação, tática e inovação militar dos dois lados**, com a perspectiva do público alemão do canal. A Prússia e a Alemanha são o centro da narrativa, sem distorcer fatos: o que a França fez melhor também é dito, e o vídeo explica por que não bastou.
- A matemática fica só como prova curta (ver memória `feedback-estrategia-sobre-matematica`).
- Banco de temas táticos e de inovação, para os roteiros:
  - **Prússia/Alemanha:**
    - Generalstab e Kriegsakademie; Kriegsspiel (jogo de guerra dos oficiais);
    - Auftragstaktik; getrennt marschieren, vereint schlagen; Kesselschlacht (Sedan, Metz);
    - massa de artilharia avançada (St. Privat, Sedan), aço Krupp de retrocarga e espoleta de percussão;
    - ferrovia (Linienkommandanturen, Etappenwesen) e telégrafo de campo; Pioniere e pontes de pontões;
    - Ulanen como cortina de reconhecimento; Schützenschwärme depois de St. Privat;
    - parque de cerco contra Paris; revacinação.
  - **França:**
    - Chassepot (alcance), Mitrailleuse (segredo e mau emprego);
    - fortificação de Paris (muralha de Thiers + fortes), Ballon monté e microfilme de Dagron;
    - levée en masse de Gambetta; francs-tireurs e a resposta alemã; Turcos e Zouaves.
  - **1866:** Zündnadelgewehr contra a Stoßtaktik austríaca; artilharia austríaca superior em Königgrätz; os três exércitos convergindo pela ferrovia; o Kronprinz chegando à tarde.
