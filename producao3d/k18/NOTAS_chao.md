# NOTAS da frente `chao` (K18 Königgrätz)

Família `chao`: 27 batidas (~148 s). O campo **à altura do chão**, sobre o relevo real (DMR 5G float16 de `DADOS`), em ilustração 3D estilizada integrada ao creme. Todas as 27 batidas têm palco próprio; nenhuma cai no stub.

## O que foi feito

### Arquivos
- `src/cenas/chao.tsx`: despacha a batida para o palco (`chao/palcos.tsx`).
- `src/cenas/chao/` (tudo copiado ou escrito aqui, nada importado de fora do projeto):

| Módulo | Função | Origem |
|---|---|---|
| `geo.ts` | Referencial local em metros por lugar; amostra o DEM na CPU (LUT half→float, bilinear); OSM perto; máscara de mata em grade 512² | novo; a máscara soma o OSM e a do K09 (`mata_k9.ts`) |
| `mata_k9.ts` | Máscara de mata do K09 (EOX 2017 + OSM), 1 bit/px em base64 | K09 `public/geo/k9_wald_maske.png` |
| `terreno.tsx` | Malha de passo variável (fina no centro, larga no horizonte) | novo |
| `atmos.ts` | Névoa única na cor do papel + névoa de baixada, um só conjunto de uniforms para todos os materiais | novo |
| `estilo.ts` | Toon de 3 tons + contorno de nanquim por casca invertida em espaço de tela | K17 v2 `kit/desenhados/estilo.tsx`, enxugado |
| `heer.tsx` | Soldados instanciados de 1866 (Pickelhaube, Tschako, Feldmütze) | K09 `kit/acabamento/heer_bloco.tsx`, mais toon, névoa e contorno |
| `cavalo.tsx` | Cavaleiro instanciado (galope e queda no shader) | novo, mesmo molde do Heer |
| `canhoes.tsx` | Canhão de bronze de antecarga (stand-in genérico, nunca rotulado "M 1863") e Krupp | geometria do K09/vídeo 6, refeita sem dependências |
| `bateria.tsx` | Grande bateria ao longo de uma linha REAL do `unidades.json`: serventes, tiro por peça, recuo, clarão, fumaça | novo, receita do `k9_batterie` |
| `fumaca.tsx` | Fumaça, poeira, clarão e névoa em cartões | 100% procedural (fbm no shader, sem atlas: nada novo em `public/`) |
| `impactos.tsx` | Granadas: chafariz de terra, fumaça, clarão | novo |
| `arvores.tsx` | Árvores desenhadas (3 formas de copa em nuvens) e moitas | novo |
| `aldeia.tsx` | Aldeias de 1866 e igreja com torre | gerador `casasDe` do K09 |
| `agua.tsx` | Rios do OSM em fita, margem úmida, traço de margem | novo |
| `obras.tsx` | Espaldões que crescem, telégrafo com fio, ponte | novo |
| `visao.tsx` | **Viewshed real** sobre o DEM + copas, com o "toter Winkel" em hachura de pena colada ao chão | novo |
| `tropas.tsx` | Formações em bloco, perda que esvazia o bloco (cinza caído, sem estilhaço) | novo |
| `tela.ts` | Ponte 3D → tinta | usa `src/tinta/projecao.ts` com a mesma pose |
| `palco.tsx` | Céu de papel com aguadas de chuva, ThreeCanvas, luzes de dia encoberto, grão, `<Folha>` | novo |
| `palavras.json` | Tempo de cada palavra das 27 batidas | gerado de `../voz/alinhamento.json` |
| `b_*.tsx` | Os palcos por região | novo |

- **Tinta:** só o kit comum (`Escrita`, `Rotulo`, `Guia`, `Traco`, `Numero`, `Bloco`) com `COR` e `FONTE`. Cada gesto está preso à palavra pelo `palavras.json`. O acento laranja vai só no número-chave ou na peça que trabalha.
- **Pureza:** tudo é função de (beat, t, u):
  - sem `Math.random`: hash e mulberry32 com semente;
  - sem `useEffect`;
  - as listas de tiros, fumaça e impactos são estáticas por batida, e o shader só lê `t`;
  - a geometria fica em cache de módulo ou `useMemo`.
- **Nenhuma biblioteca instalada.**

### O que cada batida torna visível NO lugar
| Batida | Palavra → gesto |
|---|---|
| b001 lipa | Na linha REAL Lipa–Problus das 11:00, a câmera corre rasante atrás das 250 peças. "Linie" → a tinta traça a linha no chão. "Kilometern" → "5,4 km". "zweihundertfünfzig" → as peças são contadas UMA A UMA, com ponto de acento sobre cada canhão enquanto o número sobe. |
| b005 lipa | Órbita na bateria em fogo, com impactos no vale. "gewinne / Österreich" → barras 250 × 42 a tinta. |
| b052 lipa | Rasante numa peça, depois a grua sobe. Raio tracejado e arco de 3.375 m (alcance da granada do 4-Pfünder, dossiê) sobre o vale. |
| b057 lipa | As peças CHEGAM de baterias espalhadas e fecham a linha no plano. "zusammen" → chave de 1 km e número de peças por km (N/L real). |
| b105 lipa/Chlum | Estado-maior e telégrafo com fio. Pulsos Morse correm até Benedek. "Norden" → seta azul no chão de Horenowes para Chlum e bloco "Korps". |
| b110 lipa | Do olho de Benedek, linhas-guia a "Bistritz", "I. Armee" e "Rauch", escritas na palavra. O que ele NÃO vê fica hachurado a lápis (o mesmo viewshed do b112). |
| b034 chlum (2/7) | Os espaldões I–V da linha Chlum–Nedelist CRESCEM no plano, com turmas cavando e numeração romana escrita. |
| b059 chlum | Atrás do Erdwall, a grua sobe. "kannten die Entfernungen" → arcos de 500 a 2.500 m se escrevem no chão do vale, e as granadas caem EXATAMENTE nos arcos. |
| **b112 chlum** | Olho de Benedek (ca.) escolhido porque o DEM prova o roteiro: dali ele vê Sadowa (3,7 km) e NÃO vê o NNE, onde a crista de Chlum (336 m) a ~170 m tapa a 1. Garde-Division. A visada bate na crista (X), o "toter Winkel" se espalha em hachura de pena pelo chão, a grua passa a crista e revela a Garde dentro da hachura e na névoa. Acento: o anel onde a batalha se decide. |
| b118 chlum | Um só batalhão na orla de Chlum. A linha prevista Chlum–Nedelist fica tracejada a lápis, com 4 vagas vazias ("vorgesehen: IV. und II. Korps"). |
| b121 chlum | Benedek e o estado-maior a cavalo, com a rota a tinta até Chlum. Clarões e fumaça da Garde nas casas. "Gewehrfeuer" no acento. |
| b011 swiepwald | A brigada (Poeckh, ca. 4.000) marcha para dentro da mata, e quem passa da orla é "engolido". Contador de batalhões dentro. |
| b070 swiepwald | 14 batalhões da 7. Div na mata, marcados em Brockhaus azul e contados um a um. |
| b072 swiepwald | A linha ordenada fica tracejada a lápis. As colunas do IV/II giram para a mata, com seta de acento. |
| b075 swiepwald | Estado-maior de Festetics nas alturas de Maslowed. Trajetória tracejada da granada, impacto marcado e "9.30 Uhr". Sem ferimento mostrado. |
| b078 swiepwald | 40 batalhões austríacos na orla contra 14 prussianos dentro, com os números ancorados nos grupos e "Mollinary: weiter angreifen?". |
| b002 bistritz | As 42 peças prussianas (aço) na margem leste, contadas uma a uma, com impactos austríacos em volta. "250 auf der Höhe" a lápis sobre a crista em fumaça. |
| b063 bistritz | Divisões 3/4/5/8, cada uma com a sua bateria, ligadas a tinta: "verteilt". |
| b065 bistritz | 12 baterias marcadas: só 7 atiram (acento), 5 mudas (lápis). |
| b046 sadowa | Coluna da 8. Div na ponte de Sadowa. "sofort Feuer" → trajetórias tracejadas da crista até os impactos. |
| b049 holawald | Divisões deitadas na orla do Holawald sob granadas. "ohne voranzukommen" → "Vormarsch: 0 m" sobre o tracejado até Lipa. |
| b107 nedelist | Linha Chlum–Nedelist com 7 vagas. As colunas voltam e só 3 ocupam ("halb: 3 von 7"). |
| b113 rosberitz | Parque de 144 peças paradas, com ponto a lápis em cada uma e contagem. "nur eine Vorwarnung". |
| b131 rosberitz | O VI. Korps sobe para dentro de Rosberitz enquanto a Garde recua. Seta vermelha, aldeia em fumaça e casas queimadas. |
| b136 rosberitz | As colunas do I. Korps ESVAZIAM no plano (caídos em cinza; bloco Brockhaus com hachura de perda). 279 Offiziere e 10.000 Mann (acento). |
| b140 stresetitz | Couraceiros brancos contra cavalaria prussiana: choque, poeira e cavalos que caem. 1.000 Mann e 1.700 Pferde (acento). |
| b147 elbe | Noite (papel escuro). Coluna saxônica junto à Elba, com seta verde para o sul e "nach Pardubitz: 19 km Luftlinie" (distância calculada Předměřice → Pardubice). |

## Verificação
- `npx tsc --noEmit -p .`: a família `chao` passa limpa. O único erro do projeto é de outra frente (`src/cenas/campo/motor.tsx`, conversão de JSON).
- Stills locais em `D:/tmp/k18_chao/` (escala 0,5), pela porta 3103.
  - Folhas de contato: `D:/tmp/k18_chao/folha_*.jpg`.
  - Script de lote: `D:/tmp/k18_chao/scr/stills.mjs`. Ele faz um bundle e roda vários `beat:u` no mesmo Chrome; com a máquina carregada por outras frentes, o bundle levou 2,5 a 8 min e cada still 3 a 30 s.

- Para depuração, o `palco.tsx` aceita a prop de entrada `dbgPose` ({pos, alvo, fov}), que troca a câmera nos stills locais. O `Video` nunca a passa.

## Problemas conhecidos e pedidos
1. **O OSM do K18 não traz o Swiepwald** (les Svíb é relação multipolígono). Completei com a máscara do K09 (`mata_k9.ts`, mata de HOJE, ca.).
   - Tirei o bosque do memorial de Chlum (posterior a 1866), que tapava o olho de Benedek.
   - Pedido à frente de dados: incluir os multipolígonos de `landuse=forest`/`natural=wood` no `osm.json`.
2. **Posições:** a linha da bateria, as unidades e o olho de Benedek são "ca." (`unidades.json` e dossiê). O ponto de Benedek foi escolhido pelo critério do DEM descrito acima.
3. **Figuras de cápsula em close:**
   - mantive câmera ≥ ~20 m dos soldados e ≥ ~15 m das peças;
   - no b110 e no b105, o estado-maior passa a 9–25 m; vale olhar na régua;
   - o modelo Sketchfab do levantamento fica para a próxima, se o Eduardo pedir mais perto.
4. **Desempenho:**
   - na primeira vez que cada palco aparece num Chrome, ele monta a máscara 512², o terreno 440² e, no b110/b112, o viewshed de 720 × 350 raios: alguns segundos;
   - depois é cache, e por quadro só se atualizam matrizes de instância e uniforms;
   - medir na G4. Se passar de 1,5 s/quadro, baixar `n` do terreno (440 → 320) e `passoArv`.
5. **A fumaça é cartão procedural.** Em close extremo de uma peça ela pode mostrar o recorte do cartão; não usei close assim.
6. **Os stills de vitrine** devem sair na G4 em escala 1. Eu só olhei em escala 0,5.

7. **Leitura fraca em alguns planos abertos.**
   - No b063 e no b072, as unidades ficam pequenas (blocos escuros a 300–500 m). A tinta carrega a ideia (linhas e círculos; seta e linha prevista). Se a régua ou o Eduardo pedir, pôr placas Brockhaus por cima, respeitando o limite de 2 placas por tela.
   - No b113, uma moita entra no primeiro plano em parte do movimento.
8. **Os stills locais são poucos por batida** (u 0,8–0,9, mais 3–5 no b001 e no b112). O movimento contínuo de câmera e de mundo está no código, mas a régua de movimento não foi medida aqui; ela roda na G4.


## Passada de acabamento (pedido do maestro, 06/11)
- **Ação perto da câmera:**
  - `trigo.tsx` novo: trigo e centeio alto, encharcado e com manchas acamadas, em tufos instanciados no primeiro plano. Está no b112 (no estado-maior e na Garde), b063, b072, b011, b046 e b001.
  - **Crateras:** os impactos agora deixam marca de terra revolvida no chão (`impactos.tsx`).
- **b112:** a grua termina a ~100 m e a 11 m de altura da Garde. As 8 colunas estão mais juntas (20 × 14) e há uma linha de atiradores no primeiro plano andando no trigo, dentro da hachura do toter Winkel.
- **b063:** refeito. Câmera rasante atrás da bateria (viva: tiro, fumaça, serventes) de cada divisão, que aparece separada das outras ("verteilt"), com granadas austríacas nas divisões.
- **b072:** câmera a ~8 m entre as colunas do IV/II que giram para a mata, com granadas e crateras. A linha prevista e a seta continuam a tinta.
- **b113:**
  - câmera rente ao parque de 80 peças, que agora ocupa o terço central;
  - sem moita nem árvore no primeiro plano (novas opções `moitas` e `livreArv` no `Cenario`).
- **b105 / b110:** estado-maior agora a ≥ 45–75 m da câmera (sem close de figura de cápsula).
- Ainda abertos (sem tempo nesta passada): b005, b057, b107 e b118 seguem com bastante campo vazio; o b063 deixa a bateria na borda esquerda.

## As 3 melhores (beat, u) para o still de vitrine
1. **b112, u = 0,97** (ou 0,5): o "toter Winkel" de Benedek.
   - Na versão 0,5: as linhas de visada batem na crista de Chlum (X), a hachura de pena do viewshed real cobre o chão, e há os rótulos "Swiepwald" e "Höhe von Chlum".
   - Na versão 0,97: a Garde dentro da hachura e o anel de acento.
2. **b001, u = 0,8**: rasante na linha REAL de 250 peças, fumaça acumulando, linha a tinta no chão, "5,4 km", e "250 Geschütze" com os pontos de acento contados peça a peça.
3. **b121, u = 0,85**: Benedek e o estado-maior a cavalo, com a rota a tinta até Chlum (igreja e aldeia) e "Gewehrfeuer" no acento.

Alternativas: b059 u = 0,9 (arcos de distância no vale), b140 u = 0,9 (choque de cavalaria com 1.700 Pferde), b052 u = 0,3 (peças e serventes de perto).
