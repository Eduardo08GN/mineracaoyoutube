# Planejador de batidas, Kriegsmomente 14 REFEITO (v14b): "Warum besiegte Moltke mit 69 Jahren Napoleon III. in nur 45 Tagen?"

- **Projeto:** `D:\kriegschronik\tracer3d_14b_moltke_refacao`.
- **Prazo duro:** 70 min até o `plano.py` passar e a folha ficar pronta.
- **Narração:** é NOVA, reescrita pelo checklist agregador, e já está alinhada.

## Leia (nesta ordem)
1. **Princípio-mãe:** `D:/pesquisa_nichos/PRINCIPIO_PRODUCAO.md`.
   - O produto é a compreensão do espectador.
   - Cada take de mecanismo cruza ≥ 3 dimensões: dado × conceito × ilustração × espaço × tempo × narrativa.
   - Critério: "ajuda a entender?", nunca "parece real?".
2. **Roteiro:**
   - `roteiro/skript_de.json` (14 capítulos);
   - campo `painel` por capítulo: os números que saíram da fala e devem estar NA TELA, como instrumento vivo;
   - alinhamento: `voz/alinhamento.json`.
3. **Fatos:** `roteiro/fakten.md`. Só números de lá.
4. **Brief do batedor, com os adendos 1–4:** `roteiro/BRIEF_BATEDOR_REFACAO.md`.
5. **Kits:**
   - `v1/src/kit/desenhados/API.md`: biblioteca própria em estilo gravura (locomotiva, vagão, Krupp, canhão de bronze, soldados, telégrafo, casas, árvores);
   - `v1/src/kit/premium/API.md`: Timeline, CompareBars, Arrow, LeaderLabel, HudPair, StatementCard;
   - os takes do batedor, `v1/src/welt/k14b_bahn.tsx`, `k14b_comando.tsx` e `k14b_sedan.tsx`, com presets de `angulo`;
   - o kit antigo do projeto (`welt/`, `kit/`), com Sedan v7, Batterie v9, terreno real em `public/geo` e Gemaelde para época.
6. **Formato das batidas:** `roteiro/_batidas_v1/*.json` (o mesmo formato `{wort, nr, dono, bild}`), `ferramentas/plano.py`, `v1/src/beats/k14_A.tsx` como exemplo de BeatMap e `wortLokal`.

## Regras (todas obrigatórias)
- **TAKE ÚNICO:** nenhuma batida reaproveita o take de outra. Pode repetir o componente, nunca a mesma câmera + ação + trecho: troque `angulo`, posição, ação e tempo.
- **Câmera sempre andando:** ≤ 10% de quadros parados; ação dentro do plano.
- **Blocos de mecanismo** (cap. 06 trens, cap. 09 Tag 18, cap. 10 comando, cap. 13 Sedan): **simulação contínua com instrumento vivo**:
  - ≤ 3 grandezas em cor de sinal + 1 barra amostrada no objeto + relógio com compressão declarada;
  - entram e saem com a fala;
  - legenda de ação de 1 linha;
  - a fala desses capítulos APONTA para esses instrumentos (frase dêitica): entregue exatamente o que ela promete (curva tracejada, esquema objetivo × caminhos, barra + anéis).
- **Esquema explicativo** para todo mecanismo ou conceito falado: corte, fluxo, escala ou anatomia, que se constrói com a fala, com o selo "Prinzipskizze · nicht maßstabsgetreu" quando for princípio geral.
- **Terreno:** sempre relevo real + satélite/mapa de época + rios, florestas e aldeias. Nada de bege liso.
- **Objetos:** sempre do `kit/desenhados` em estilo gravura e em plano médio. Nunca close macro de modelo simples.
- **Paleta:** mundo dessaturado; acento só azul prussiano × vermelho francês; mediana de luminância ≥ 100 nos abertos.
- **Cartão preto de uma frase:** ≤ 10% do tempo, ≤ 3 s cada.
- **Época (Gemaelde):** só onde a fala é biografia ou contexto.
- **Mapa:** a mesma base ≤ 15% do tempo e ≤ 2 seguidas.
- **Texto na tela:**
  - opacidade final 1, contraste ≥ 4,5:1;
  - nada fora da margem de 96 px, nenhuma caixa sobre outra;
  - ≤ 2 elementos fora do painel;
  - rótulos em alemão;
  - números com ponto de milhar alemão.
- **Cortes:** 3–8 s fora dos blocos contínuos; nos blocos de mecanismo, take longo permitido se um dado muda a cada ≤ 1 s.
- **Sem marca d'água e sem crédito na imagem.**
- **Cada batida, no JSON:** declara `"dims": [...]` (as dimensões que cruza) e `"custo": "leve|medio|heroi"`.

## Divisão
- **A:** caps. 01–07, em `roteiro/batidas_<cap>.json` + `v1/src/beats/k14b_A.tsx` (`export const K14B_A: BeatMap`).
- **B:** caps. 08–14, em `k14b_B.tsx` (`K14B_B`).
- No `v1/src/beats/index.ts` fica `BEATS = {...K14B_A, ...K14B_B}`: edite só essa linha e os imports.

## Verificação
1. `python ferramentas/plano.py` sem ERROS, com REPERTORIO ok.
2. Stills locais (`npx remotion still`, metade da resolução), 1 por batida no meio dela, mais a folha `render/FOLHA_v14b_<A|B>.jpg` com o id em cada quadro.
3. Rode `ferramentas/camera.py` (se já existir) num MP4 curto de 2–3 blocos de mecanismo.

Tudo no D: (TEMP=D:/tmp). Nada de G4 (nenhum canal.py). Mate só processos seus.

## Entrega (≤ 200 palavras)
- número de batidas;
- tempo por tipo;
- os blocos de mecanismo e o que cruzam;
- o que ficou fraco;
- o caminho da folha.
