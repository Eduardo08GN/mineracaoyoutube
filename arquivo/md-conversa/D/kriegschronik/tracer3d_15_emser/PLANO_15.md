# Kriegsmomente 15: a Emser Depesche (13/07/1870)

**Status:** plano inicial de 04/11/2026, 00:50. Pedido do Eduardo pelo suporte: "inicie o próximo vídeo alemão com toda a pipeline corrigida".

## 0. DECISÃO DO EDUARDO (04/11, ~01:14): vale acima de tudo abaixo
- **A stack visual nova está REPROVADA** ("horrível", "confuso", "inventou a roda"): kit maquete/cartoon técnico, palcos e as peças Telegrama/TelegrafMorse do batedor 1. O v1 dela ficou em `_v1_stack_nova_abandonada/` e as ferramentas em `ferramentas/_stack_nova/`.
- **Fica só o pipeline de ROTEIRO**: pauta com fontes, checklist agregador, dêiticas declaradas, fato conferido linha a linha, revisão do suporte. O roteiro aprovado continua.
- **Produção volta à stack Tracer3D do v14b**: `v1` copiado de `tracer3d_14b_moltke_refacao/v1`, ferramentas do 14b, objetos da biblioteca e época.
- **Mapa: pouco** (bem abaixo dos 35% antigos).
- As seções 3 e 4 abaixo (tabela da G4 e batedor) valem só onde não colidem com isto.

## 1. Tema: pelo radar, não pela continuidade
| Leitura | Dado (API do YouTube, 04/11) |
|---|---|
| Vetor do canal | "Warum… – obwohl…" fez 53,7 mil (rifle); os outros 9 vídeos, de 0,7 a 9 mil |
| Outlier do nicho no mês | "Der wahre Ursprung des Deutsch-Französischen Krieges…": 61,8 mil views com 525 inscritos (118×) |
| Demanda DE entre os micronichos abertos | Emser Depesche: 18 vídeos DE, mediana do top 10 em 6 mil e máximo de 480 mil (a maior entre os abertos) |
| Radar dos micronichos abertos | `radar_v2/prussia_temas_1104.csv`. Fora: Sedan, Gravelotte, Paris, Mitrailleuse, Dreyse/Chassepot, Moltke, Königgrätz, 1866 geral, dia a dia, artilharia/Krupp |

**Títulos (rascunho, 3 estruturas):**
1. Paradoxo: "Warum erklärte Frankreich 1870 den Krieg – obwohl Bismarck ihn wollte?"
2. Origem: "Der wahre Auslöser des Krieges 1870: Wie ein gekürztes Telegramm Europa in den Krieg trieb"
3. Número: "Ein Telegramm, sechs Tage, ein Krieg: Die Emser Depesche Stunde für Stunde" (os números saem da pauta)

## 2. Espinha (provisória; o roteiro sai da pauta verificada)
1. Gancho: Bad Ems, manhã de 13 de julho, o rei e o embaixador na promenade.
2. Paradoxo: quem queria a guerra não a declarou.
3. Candidatura Hohenzollern e o pedido de garantias.
4. O telegrama de Abeken: o que dizia.
5. **Mecanismo 1, telégrafo:** como a mensagem viajou de Ems a Berlim (tecla, corrente, registro, estações; 3D cartoon técnico).
6. O jantar: Bismarck, Moltke e Roon. **Mecanismo 2, a edição:** o texto encolhe palavra a palavra, com contador vivo.
7. Extrablatt e embaixadas: o texto se espalha numa noite (mapa da rede).
8. Paris, 14 de julho: como o texto foi lido.
9. Por que a França declarou (as alianças do sul da Alemanha, a opinião pública).
10. Take inédito: o relógio das 6 horas de 13/07 à noite (pela pauta).
11. Resposta em 3 frases e ponte para o vídeo de Sedan.

## 3. Tabela da G4 (CLAUDE.md: antes de cada vídeo)
| Trabalho | Onde | Por quê |
|---|---|---|
| Narração | AI Studio (Ultra), aba de automação | regra "narração sem API" |
| Alinhamento (stable-ts DE) | **G4** | `g4_alinhar_um.py` |
| Efeitos (MOSS) e mix sem música | **G4** | `g4_mixar.py`, adaptado para o modo sem música do DE |
| Stills de batedor, montagem e juiz | **G4** | `g4_stills_*.py` |
| Clipe herói Blender (Bad Ems: promenade, Lahn, Kurhaus) | **G4**, Cycles em lotes | `lotes_g4.py`, câmera sempre em movimento |
| Render Remotion, correção de trecho, régua 24 fps | **G4** | `g4_render_video.py`, `g4_corrigir.py`, `g4_regua.py` |
| Roteiro, plano, régua preditiva, composição de miniatura, mux por cópia | PC (só orquestra) | leve |

## 4. Batedor: só o que é novo
| Peça | Pronto achado (portão 1) | Status |
|---|---|---|
| Tecla Morse em cartoon técnico | Smithsonian "Morse-Vail Telegraph Key", **CC0** (`public/maquete/telegraf/`) | baixado |
| Registro Morse (fita de papel) | Sketchfab "Mors Telegraph" (carlcapu9, CC-BY) e "Vintage Morse Telegraph Sounder" (CC-BY) | **precisa do login do Eduardo** no Sketchfab |
| Telegrama que encolhe (diff de texto) | `diff` (npm, BSD) para calcular as diferenças + o sistema de tipo do kit | a testar |
| Rede telegráfica 1870 (mapa) | kit de mapas existente / `remotion-maps` | a testar |
| Bad Ems 3D | OSM (prédios) + Copernicus GLO-30 (relevo) + ortofoto RLP DOP20 (dl-de/by-2-0, crédito na descrição) | levantar |

## 5. Checklists que valem neste vídeo
- §9 da auditoria v14b: dêitica ↔ imagem; legendas ≤ 17 cps, ≥ 1,2 s e ≤ 42 caracteres; descrição sem afirmação falsa; licença de cada mapa; miniatura 3 = 3D + número; MEDICAO viva; rosto e fato contra o dossiê.
- Lições do Learjet P3:
  - clipe Blender só com câmera em movimento;
  - `props.push` nos planos lentos desde o plano;
  - palco em degradê médio, objeto ≥ 30%, piso de preto `#141820`;
  - nenhum render inteiro em cima de outro do mesmo projeto (trava no `render.sh`).
- Regras do canal:
  - sem música;
  - título 1 no molde paradoxo;
  - estratégia acima de matemática;
  - 3 miniaturas (rosto + gancho, rosto + número, 3D + número).
