# Planejador de batidas: Kriegsmomente 15, Emser Depesche

Título: "Warum erklärte Frankreich 1870 den Krieg – obwohl Preußen schon nachgegeben hatte?"
Projeto: `D:\kriegschronik\tracer3d_15_emser`.

**Stack: Tracer3D**, a mesma do v14b. Decisão do Eduardo em 04/11: a stack visual nova (kit maquete, cartoon técnico, palcos, peças por código) está REPROVADA. Não use nada de `_v1_stack_nova_abandonada/` nem de `ferramentas/_stack_nova/`.

## Leia (nesta ordem)
1. **Roteiro aprovado:** `roteiro/skript_de.json` (15 capítulos, ~14,6 min). Alinhamento: `voz/alinhamento.json`; se ainda não existir, `voz/alinhamento_provisorio.json`, gerado por `ferramentas/alinhamento_provisorio.py`.
2. **Fatos:** `roteiro/PAUTA_15.md`. Na tela, só números e textos de lá: horários 15:50 / 18:09 / ~21 Uhr / 23:15 / 2:30; 205 → 102 Wörter; 13 neue Inhaltswörter; 22 Telegramme; 461 km Luftlinie; as idades do §8.
3. **Formato das batidas:**
   - modelo: `D:/kriegschronik/tracer3d_14b_moltke_refacao/roteiro/_batidas_v1/*.json` e `batidas_*.json`, no formato `{wort, nr, dono, bild}` ancorado em palavra;
   - ferramenta: `ferramentas/plano.py`;
   - exemplo de BeatMap e `wortLokal`: `v1/src/beats/k14b_*.tsx`.
4. **Kits do Tracer3D:**
   - `v1/src/kit/desenhados/API.md`: TasterMorse, Farbschreiber, ZugDesenhado, CasasDesenhadas, ArvoresDesenhadas, SoldadosDesenhados;
   - `v1/src/kit/premium/API.md`: Timeline, CompareBars, Arrow, LeaderLabel, HudPair, StatementCard;
   - `v1/src/kit/epoca` (Gemaelde e fotos de época);
   - `v1/src/kit/ui`, `v1/src/kit/karten`;
   - os componentes de `v1/src/welt/`: k14b_bahn, k14b_comando, k10_ballon, k14_basis…;
   - o kit `v1/src/kit/maquete` como estava no 14b, apenas.
   - Brief do 14b como referência de regras: `D:/kriegschronik/tracer3d_14b_moltke_refacao/roteiro/BRIEF_PLANEJADOR_V14B.md`.

## Regras (todas obrigatórias)
- **POUCO MAPA (Eduardo, 04/11):**
  - mapa no total ≤ 10% do tempo;
  - nunca 2 batidas de mapa seguidas;
  - mesma base de mapa no máximo 2 vezes no vídeo.
  - Mapa só onde o lugar é a informação: Ems → Berlim 461 km; a noite das 22 cópias na Europa; Sul da Alemanha × França.
- **TAKE ÚNICO:** nenhuma batida reaproveita o take de outra. Componente pode repetir; câmera + ação + trecho não. Trechos do mesmo clipe com outra velocidade ou espelhados também contam como reaproveitamento.
- **Câmera sempre andando**, ≤ 10% de quadros parados; ação dentro do plano. Cortes de 3–8 s fora dos blocos de mecanismo.
- **Dêiticas declaradas** (§9 da auditoria v14b). A fala diz "Achten Sie auf…" em três pontos, e a imagem TEM de mostrar o elemento naquele segundo:
  - cap. 07: "Achten Sie auf die Taste in Ems" → TasterMorse em plano médio, com a tecla sendo pressionada;
  - cap. 07: "Achten Sie auf den Streifen" → Farbschreiber com a fita andando e pontos e traços aparecendo;
  - cap. 09: "Achten Sie auf die roten Striche" → o texto de Abeken com os trechos cortados riscados em vermelho, com a mecânica do grifo do kit epoca/Dokument;
  - cap. 10: "Achten Sie auf die blauen Wörter" → o texto publicado de Bismarck com as palavras novas em azul e as 13 de conteúdo destacadas.
  Implícitas: cap. 01 "ein Gedenkstein mit genau dieser Uhrzeit" → a pedra com "13. Juli 1870 / 9 Uhr 10 min / morgens" legível. A foto do Commons é CC BY-SA e não serve: reconstrua.
  Declare no JSON da batida `"deitica": "<elemento>"`.
- **Textos dos telegramas:** use os textos LITERAIS da PAUTA §2 (A, com a abertura de Caprivi, e B). O estado final na tela é sempre o texto B literal. Contador 205 → 102.
- **Época (Gemaelde/fotos):** onde a fala é biografia ou contexto (Wilhelm, Benedetti, Abeken, Bismarck, Roon, Moltke, Gramont, Ollivier, Napoleão III), ≤ 20% do tempo. Só imagens de domínio público ou CC0 do Wikimedia Commons, com o arquivo e a licença anotados no JSON. A PAUTA §7 lista algumas: estereofotos CC0 do Kurhaus, gravura do encontro, "Wilhelm I at Bad Ems" (sem Benedetti), "Depesche.jpg" (1ª Expedição). Fotos dos originais do PA AA não podem ser usadas.
- **Cartão preto de uma frase:** ≤ 10% do tempo e ≤ 3 s cada.
- **Texto na tela:**
  - opacidade final 1, contraste ≥ 4,5:1;
  - margem de 96 px;
  - nada sobreposto;
  - alemão, com ponto de milhar alemão.
- **Sem marca d'água e sem crédito na imagem.**
- **Disputados:** na tela, só o que a fala diz. O jantar sai com selo "nach Bismarcks Erinnerungen", e a votação com "nach Ollivier".
- **Cada batida** declara no JSON `"dims": [...]` e `"custo": "leve|medio|heroi"`.

## Divisão
- **A:** caps. 01_promenade a 07_draht → `roteiro/batidas_<cap>.json` + `v1/src/beats/k15_A.tsx` (`export const K15_A: BeatMap`).
- **B:** caps. 08_abendessen a 14_antwort, incluindo 10b_faelschung → `k15_B.tsx` (`K15_B`).
- `v1/src/beats/index.ts`: `BEATS = {...K15_A, ...K15_B}`. Edite só essa linha e os imports. Quando a linha já tiver o outro planejador, mantenha.

## Verificação
1. `python ferramentas/plano.py` sem ERROS.
2. **NADA de render no PC:** nada de `npx remotion still` ou render, nem de node que renderiza. Regra do Eduardo: o PC só orquestra. Os stills saem na G4 pelo maestro. Você entrega os ids e eu rodo.
3. Tudo no D: (TEMP=D:/tmp). Nada de G4 (nenhum canal.py). Mate só processos seus.

## Entrega
Uma lista curta por batida: id, componente, dêitica (se houver), % de mapa do seu bloco e o que ficou de fora.
