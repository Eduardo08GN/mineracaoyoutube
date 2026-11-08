# NOTAS da frente `epoca` (K18 Königgrätz)

## O que foi feito
- **19 batidas `epoca`** (b004, b017, b024, b036, b048, b050, b060, b074, b080, b100, b109, b119, b122, b132, b134, b139, b146, b148, b160), todas com prancha própria (nenhuma imagem repetida dentro do vídeo).
- **Cena** (`src/cenas/epoca.tsx` + `src/cenas/epoca/`):
  - `motor.ts`: tempo preso à palavra (`'Granaten'`, `'links#2'`, `'Dub+0.3'`, `'fim-0.4'`), câmera em dolly contínuo por quadros-chave (foco na imagem + zoom, com suavização que nunca para; depois do último quadro o dolly continua a 1,8 %/s) e varredura lateral monótona para a paralaxe; projeção prancha → tela pela MESMA pose (`tinta/projecao.ts`).
  - `Mesa.tsx`: papel creme (`public/papel/papel_k18.jpg`, espelhado sem costura) e a pintura como **prancha** (borda de papel, filete a tinta, sombra suave, leve giro). A pintura é uma malha 2.5D deslocada pela profundidade: com `<motivo>_prof.png` usa o mapa; sem ele, relevo sintético por camadas (`chao` = chão perto / céu longe, `retrato`, `plano`). Tom: leve virada para a sépia, pretos viram tinta marrom e brancos viram papel (nunca escura).
  - `Gestos.tsx`: tinta que se escreve na fala: `rotulo` (guia até a pessoa/lugar), `escrita`, `numero` (conta), `traco` (seta/rota/sublinhado), `anel`, `estouro` (impacto de granada), `perda` (bloco Brockhaus que esvazia em hachura), `cota`, `risco` (barra de parada), `bloco` (placa de unidade), `linha` (régua de tempo / ritmo de fogo). Texto sobre a pintura ganha uma **tira de papel rasgada** que desenrola junto com a escrita (legível sem halo nem balão). `lapis:` apaga a tinta para lápis pela cor; `ate:` some quando a fala passa.
  - `motivos.ts`: as 19 configurações (prancha, câmera, gestos).
  - `palavras.json`: tempos (s do vídeo) das palavras de cada batida, extraídos de `voz/alinhamento.json` + `roteiro/skript_de.json` + `plano.json`. **Se o plano mudar, regenerar** com `python src/cenas/epoca/gerar_palavras.py`.
  - A tinta segue o **relevo** da malha: o `_prof.png` é lido uma vez por Chrome (na sonda) e `motor.relevo()` faz no CPU a mesma conta do vertex shader, então a guia cai no ponto deslocado, não no plano.
- **Imagens** (`public/epoca/<motivo>.jpg`, ≤ 2560 px) e **fontes** (`public/epoca/FONTES.json`: título, autor, ano, URL do Commons, licença, nota). Todas domínio público / CC0 do Wikimedia Commons. Crédito só na descrição.
- **Profundidade**: 12 motivos já têm `_prof.png` (recortados, com o mesmo recorte da prancha, dos mapas Depth Anything V2 que a biblioteca do K17 já tinha em `geo/tiefe`, nada rodou no PC). Os 7 restantes estão em `public/epoca/PROFUNDIDADE_PEDIDO.txt` para o maestro rodar na G4; a cena detecta o arquivo sozinha (sonda com `delayRender`), sem mudar código.

## Escolhas de imagem que pedem atenção (alternativas factuais)
- `eisenbahn_1866`: não há no Commons imagem PD de transporte de tropas por trem em 1866. Uso a **Übersichtskarte des Kriegsschauplatzes in Böhmen** (Brockhaus/Blankenburg 1868) e a tinta traça as linhas de trem reais do mapa até a fronteira (Lusácia, Liegnitz–Breslau, Breslau–Freiburg/Waldenburg).
- `holawald_gefecht`: sem imagem do próprio Holawald. Uso Christian Sell, *Ruhe im Feuer* (Gartenlaube 1868, ilustra "Vier Stunden in Reserve bei Königgrätz": 5ª Div. prussiana além da Bistritz em Unter-Dohalitz, horas sob o fogo de Lipa, ~1 km ao sul do Holawald). A tinta desenha o esquema Bistritz → Holawald → fogo de Lipa → barra de parada.
- `oe_kolonnen`: sem imagem PD do ataque do I. Korps em Chlum/Rosberitz. Uso Fritz Neumann, *IR 77 bei Skalitz, 28. Juni 1866* (mesma Stoßtaktik em coluna com baioneta, 5 dias antes). A cena escreve "Skalitz, 28. Juni 1866" a lápis no canto para não enganar.
- `koenig_dub`: Bleibtreu mostra o Rei sob fogo em Königgrätz, mas não identifica a colina de Dub; o rótulo diz "Höhe bei Dub · gegen 8 Uhr" (fala + dossiê). "≈ 20 Schritt" vem do dossiê (Craig p. 106–108, granada a ~20 passos do Rei).
- `kronprinz`: Heyden não legenda as figuras; a guia aponta o grupo do estado-maior (figura de casaco claro), com o texto "Kronprinz Friedrich Wilhelm · mit Stab".
- `prag_frieden`: a imagem é a Waffenruhe/Vorfrieden de **Nikolsburg (26. Juli)** = "knapp drei Wochen später ruhen die Waffen"; o Frieden von Prag (23. August) entra na régua de tempo.
- `elbe_flucht`: Schüllinger 1896 só existe com 521 px; está ampliado 2× (Lanczos) e mostrado como prancha menor com papel em volta. **Pedido de upscale na G4** no mesmo arquivo de pedido.

## Verificação
- `npx tsc --noEmit -p .` passa.
- Stills locais (escala 0,5, porta 3107) das 19 batidas em `D:/tmp/k18_epoca/st_*.jpg`; folhas de revisão `D:/tmp/k18_epoca/r1.jpg` … `r12.jpg`. Duas rodadas de correção em koenig_dub e oe_kolonnen (tira de papel sincronizada com a escrita, alvo do Bajonett, tinta seguindo o relevo), depois nos demais.
- Tempo por quadro nos stills: 3 a 10 s incluindo a carga da página; o quadro em si é leve (1 malha de ~220×300, 2–3 texturas que sobem uma vez só).

## Problemas conhecidos / abertos
- **Movimento não medido em vídeo**: só vi stills. A intensidade da paralaxe (`prof` 0,14 com mapa / 0,09 sintético; varredura lateral 5,5 % da distância) precisa ser conferida num render curto na G4 (régua 24 fps). Se estourar borda em pintura com mapa duro, baixar `prof` por prancha em `motivos.ts`.
- **7 motivos sem mapa de profundidade** (pedido em `PROFUNDIDADE_PEDIDO.txt`): rodam com o relevo sintético até o maestro gravar `_prof.png`. A sonda gera um 404 no console para cada mapa ausente (inofensivo).
- `elbe_flucht`: original de 521 px; mesmo como prancha menor, fica macio em 1080p. Upscale pedido.
- Alvos aproximados: a torre de Chlum no Sochor (`chlum_sturm`, [0.705, 0.07]) está no meio da fumaça e não consegui confirmar a igreja; a ponta da baioneta (`oe_kolonnen`) e o Kronprinz no Heyden (figura não legendada pelo pintor) também são aproximados. Conferir no still da G4.
- A tira de papel estima a largura do texto (0,44 do corpo no itálico, 0,5 nos algarismos). Se a frente "tinta" trocar a `Escrita` por tegaki com outro ritmo, a tira pode adiantar ou atrasar um pouco: a velocidade usada é a mesma da `Escrita` (16 caracteres/s ou `vel`).
- Zonas do HUD: os textos ficam fora de x 60–760 × y 50–330 e de y > 900. O "I. Korps" do oe_kolonnen está em y 250 à direita (x 1290): conferir que não encosta no nome do lugar do HUD.
- `motor.ts` ainda tem variáveis locais sem uso na função `camera` (inofensivas).
- Pedido nenhum de parâmetro novo no `plano.json`.

## As 3 melhores (beat, u) para o still de vitrine
1. **(b050, 0.92)** koenig_dub: Bleibtreu, o Rei sob fogo, dois impactos a tinta laranja à esquerda e à direita, "rund 20 Schritt neben dem König".
2. **(b119, 0.95)** garde_chlum: a Garde subindo a encosta, névoa em lápis, linha da Geländefalte e o anel "schon da".
3. **(b017, 0.95)** eisenbahn_1866: o mapa de 1868 deitado na mesa, as linhas de trem traçadas a tinta laranja até a fronteira, "in Tagen" / "statt Wochen" riscado.
- Reserva: (b074, 0.85) swiepwald_kampf, com o bloco da Brigade Poeckh esvaziando em hachura de 4.000 para 1.800 e as setas de entrada e saída com espessura proporcional.
