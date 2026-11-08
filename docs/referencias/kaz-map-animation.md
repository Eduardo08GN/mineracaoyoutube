# Kaz Map Animation: skill de terceiros para vídeo explicativo de mapa (documentada em 08/11/2026)

**Origem:**
- Vídeo "I Made VIRAL Map Animation Videos Using Claude Code (FREE Skill)", canal Grow With Kaz, publicado em 08/11/2026.
- A skill vem por uma pasta do Drive linkada na descrição: um zip de 8,7 MB e o PDF "Map Animation master prompt".

**Cópia local:** `D:/pesquisa_nichos/skills_terceiros/kaz-map-animation/`, fora do repositório (ver Licença).

## O que faz
Transforma narração ou roteiro num **vídeo explicativo de mapa no estilo dos Shorts de geografia e política**:
- globo de satélite;
- zooms suaves de câmera;
- países, estados, províncias e fusos acendendo em cor;
- rotas com brilho, pinos, ícones que surgem;
- legenda com palavra-chave;
- cortes para "planta" (organograma, contagens, hemiciclo) e para "corte em seção" (o que está sob a superfície).

**Como funciona:** **100% por código e determinístico.** O Claude só escreve um **JSON de cena**. Um motor em SVG desenha cada quadro no Chromium headless (Playwright), e o ffmpeg codifica o MP4. Não há IA de imagem nem de vídeo.

| Parte | Função |
|---|---|
| `engine/engine.js` (~56 KB) | renderizador: palcos, câmera, estilos de destaque, elementos, fundos |
| `engine/geo.js` (~1,4 MB) | fronteiras embutidas. Natural Earth: países em 1:50m; províncias em 1:50m para EUA, CAN, AUS, BRA, CHN, IND, IDN, RUS e ZAF; estados dos EUA em 1:10m. Mais o topojson-client |
| `scripts/render.mjs` | JSON → MP4, folha de contato (`--contact`) ou um quadro (`--still t`) |
| `scripts/timestamps.py` | narração → tempo por palavra (faster-whisper) |
| `scripts/autoalign.py` | encaixa um print de mapa web (Esri, Google, Mapbox) nas costas reais, por casamento terra/água |
| `scripts/georef.mjs` | confere o georreferenciamento de uma imagem própria |
| `scripts/make_sfx.py` + `assets/sfx/` | kit de efeitos sintetizados (whoosh, swish, pop, click, ding, impact, riser, flip), aplicados sozinhos conforme o elemento |
| `references/style-guide.md` | gramática visual e regra de destaque |
| `references/elements.md` | todos os campos de todos os elementos |

**Requisitos:** Node 18+, Playwright com Chromium, ffmpeg. Opcional: faster-whisper.
**Saída padrão:** 1080×1920 a 30 fps. 16:9 e 4K (`--scale 2`) também funcionam.

## O fluxo de trabalho
1. **Entrada:** roteiro e/ou narração, os lugares citados e imagens de mapa (opcional).
2. **Mapa:** sem imagem, usa o globo embutido. Com imagem, georreferencia (Mercator com 4–8 pontos + `autoalign`; ou *thin-plate spline* com 10–25 pontos, que serve até para mapa feito por IA ou globo inclinado).
3. **Tempo:** Whisper na narração, ou ~2,6 palavras/s.
4. **Mapa de batidas:** batidas de 1–2,5 s agrupadas em planos de 2,5–5 s. Todo lugar citado ganha destaque na sua batida.
5. **JSON da cena:** o `start`/`end` de cada plano vem do Whisper. Os destaques caem na palavra tônica.
6. **Conferência:** folha de contato e quadros soltos.
7. **Final:** render com narração, efeitos automáticos e música opcional.

## As ideias que valem para nós (independentes do código)
1. **A regra de destaque:** todo lugar que a narração nomeia **acende em cor na mesma batida**, nunca só um rótulo ou um pino. A cor tem papel:

   | Papel | Estilo |
   |---|---|
   | Área do assunto | `tint` azul translúcido |
   | Lugares da história | `solid` laranja |
   | Categorias | `zones`, um pastel por categoria, com etiqueta em pílula |
   | Elemento-herói | `glow` laranja-fogo, com `spotlight` escurecendo o resto |
   | O que não tem fronteira | `area` (polígono livre) ou `path` grosso |

   O destaque anterior fica na tela enquanto o próximo entra (tint embaixo, solid em cima).
2. **Câmera por "span"** (graus de longitude na largura do quadro): mundo 300–360, continente 90–150, EUA 55–65, estado 12–20, ilhas 4–9, cidade 0,4–1. O zoom é interpolado em escala log, por isso o salto 360 → 1 fica suave. Em plano parado, deriva ~10%.
3. **Forma da história (60–90 s):**
   - gancho (0–4 s), com a imagem familiar;
   - virada (4–10 s), com flash, número grande ou rota com brilho;
   - prova (10–45 s), com comparação A×B, régua e corte em planta ou seção;
   - fecho (5–10 s finais), com fato surpreendente ou ciclo aberto.
4. **Ritmo:** algo novo a cada 1–2 s. Corte seco por padrão, `flash` na revelação.
5. **Cortes para "planta" e "seção"** quando o mapa não mostra o porquê. É o nosso "objeto em corte" do K14.
6. **Efeitos sonoros ligados ao tipo de elemento** (região → pop, zoom → swish, contador → riser), um por batida e sob a voz.
7. **Checklist de conferência:**
   - todo lugar citado aparece destacado;
   - o destaque fica sobre a terra certa;
   - no máximo 2 cores de destaque por plano;
   - todo dado tem imagem;
   - toda imagem é dita na narração.
8. **O PDF "master prompt"** é um roteirista em 3 passos: nicho → ideias (título, 1ª frase, pergunta, mapa-chave) → roteiro (Short de ~130–150 palavras para 60 s, ou longo por capítulos com *cold open*). É útil como molde de pauta para formatos de mapa.

## Onde serviria
- **Kriegsmomente (mapas e esquemas):** a regra de destaque, a câmera por span e o corte em planta ou seção. **O visual não serve** (satélite moderno × design system CREME de época); só a gramática.
- **Reels de notícia e acidente (pausados):** o plano "onde aconteceu" e o mecanismo em seção (por exemplo, a represa soltando água) caberiam nesta gramática, com custo de tokens mínimo (só o JSON).
- **Formato novo de "geografia curiosa" em ES:** seria um canal à parte. Mineração antes, pela regra dos 3 eixos.

## Licença: atenção
- O `rights/OWNERSHIP_AND_RIGHTS.txt` declara **proprietária, todos os direitos reservados**. Ninguém além do dono pode **copiar, modificar, redistribuir, sublicenciar, vender ou publicar** a skill sem autorização escrita. O `package.json` diz `UNLICENSED`.
- O vídeo a oferece como "FREE". Usar como veio para renderizar os próprios vídeos é o uso que o autor tem em mente, mas **não está concedido por escrito**.
- **Não copiar o código para o nosso repositório (público), nem modificar o motor.** Pelo item 3 da licença, isso precisa da autorização escrita do autor; o contato está no arquivo de direitos da cópia local.
- **As ideias e a gramática (seção acima) não são protegidas** e podem ir para o nosso motor (Remotion + mapa Natural Earth, que já temos).
- Dados de fronteira: Natural Earth (domínio público) via world-atlas/us-atlas (ISC). A fonte Poppins é OFL 1.1.

## Veredito
- **O que se aproveita é a gramática:** regra de destaque, câmera por span, forma da história, cortes e efeito por elemento. Aplicar no nosso mapa (Remotion + Natural Earth).
- **O motor dela:** só como referência, até haver licença clara.
- **Prova de custo:** um formato inteiro de explicativo de mapa cabe em "o Claude escreve um JSON, o script renderiza". É o modelo de custo baixo que buscamos para os formatos curtos.
