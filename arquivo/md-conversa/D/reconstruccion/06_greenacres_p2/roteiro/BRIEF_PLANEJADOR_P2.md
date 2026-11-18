# Brief do planejador: Segundo a Segundo, vídeo 6 = PARTE 2 do Learjet (ângulo "Se rompió en el aire")

Projeto: `D:\reconstruccion\06_greenacres_p2`. É cópia da parte 1, mas **o visual é novo**. Não use o kit antigo `maquete` (maquete branca, nuvem em bola) nem os cartões antigos (`anot`, `editorial`, `ui`): o Eduardo reprovou tudo isso.

**Prazo duro:** 60 min até o `plano.py` passar e a folha ficar pronta.

## Leia
- **Roteiro:** `roteiro/skript_de.json` (14 capítulos; o texto é ES) e `roteiro/kapitel_p2.py`.
- **Fatos:** `pesquisa/fakten_p2.md`.
  - Nunca afirmar causa; o rótulo "Hipótesis" vale onde couber.
  - Sem nomes.
  - Áudio de rádio só como TEXTO.
- **Alinhamento real:** `voz/alinhamento.json` (palavra a palavra).
- **Design system premium (USE SÓ ISTO para gráficos 2D):** `v1/src/kit/premium/API.md`.
  - Componentes: StatementCard, RadioTranscript, DocQuote, HudPair, LeaderLabel, Arrow, ScaleCompare, CompareBars, Timeline, Hypothesis.
  - **BlenderClip** (`kit/premium/BlenderClip.tsx`) toca os clipes 3D e expõe `bbox` e `lado` (espaço livre).
- **Formato das batidas:** veja `roteiro/_parte1/batidas_08_mayday.json` e `ferramentas/plano.py`.
  - `roteiro/batidas_<cap>.json` traz `{wort, nr, dono, bild}`, ancorado em palavra.
  - Cada batida é desenhada por um componente React em `v1/src/beats/p2_<A|B>.tsx` (`export const P2_A: BeatMap = {"01_01": ({t, d}) => ...}`).
  - `dono` = `"INEDITO_p2"`, sem `cena`.
  - Registre no `v1/src/beats/index.ts`: `BEATS = {...P2_A, ...P2_B}`, editando só essa linha e os imports.

## Peças visuais disponíveis (só peças prontas; NÃO construa cena 3D nova)

**Clipes do Blender** em `v1/public/clipes/<nome>.mp4`: 1080p, 24 fps, ~4 s cada. Use `velocidade` 0.5–0.8 para esticar e `inicio` para variar o trecho.

| nome | o que é | estado |
|---|---|---|
| `cruzeiro` | Learjet sobre mar de nuvens, céu azul, câmera colada | pronto |
| `entrada_tormenta` | o mesmo em céu de tempestade escuro (entrando na precipitação) | pronto |
| `mergulho` | nariz 40° abaixo, rolando, dentro da tempestade | pronto |
| `ruptura_perfil` | perfil da cauda em T: o estabilizador horizontal se solta (hipótese) | pronto |
| `ruptura_tras` | o mesmo, visto de trás e de cima | pronto |
| `impacto_obliquo` | Greenacres real (ortofoto NAIP), explosão e coluna de fumaça | renderizando |
| `restos_alto` | Greenacres do alto, plano aberto para o campo de restos | renderizando |
| `estabilizador_cai` | o estabilizador caindo e girando sobre o bairro, levado pelo vento | renderizando |

Os três últimos chegam em ~40 min. Use os nomes desde já. Se o arquivo ainda não existir, o render final só sai depois que ele existir.

**Máscara:** `<nome>_mascara.json` vai ao lado do mp4. Os componentes premium vão no lado livre (`lado`), **NUNCA sobre o avião ou o objeto principal** (regra do Eduardo).

**Radar oficial:** `v1/public/radar/n0q_1745.png` (+ `.wld`, 0,005°/px, origem −126,50). É o mosaico NEXRAD da NOAA via Iowa Environmental Mesonet, às 12:45 EST. O planejador A cria `kit/premium/MapaRadar.tsx`:
- fundo escuro;
- recorte do sul da Flórida (lat 25.8–27.6, lon −81.6 a −79.6);
- o radar com transparência nos ecos fracos;
- a rota (26.69,−80.57 → 26.633,−80.113) desenhada com `evolvePath` (do `Arrow`);
- o ponto do impacto e o rótulo "Radar NOAA · 12:45".

Câmera: zoom lento. Se quiser satélite por baixo, só EOX s2cloudless 2016/2017 (CC BY). Crédito só na descrição.

## Regras de qualidade (portão)
- **Nada cobre o protagonista.** Use `lado`/`bbox` do BlenderClip. Em plano de ambiente, no máximo 2 elementos de texto.
- **Repertório:**
  - nenhum clipe passa de 15% do tempo;
  - no máximo 2 batidas seguidas do mesmo clipe;
  - StatementCard (tela preta) no máximo 1 a cada ~30 s;
  - 3D (clipes + mapa de radar) em ≥ 60% do tempo.
- **Movimento:** cortes de 2,5–7 s; nada parado mais de 4 s; gancho nos primeiros 10 s (cap. 01: ruptura + a frase do NTSB).
- **Texto:** opacidade final 1; números com `numES`; ES neutro.
- **Sem marca d'água e sem créditos na imagem:** desligue o `Abspann` em `Video.tsx` e limpe os conjuntos `SEM_SELO`/`ILLU`, que são da parte 1.

## Divisão
- **A:** caps. 01–07. Constrói o `MapaRadar`.
- **B:** caps. 08–14. Pode usar o `MapaRadar` quando existir.
- Não editem os arquivos um do outro, exceto a linha do `BEATS`.

## Verificação
1. `python ferramentas/plano.py` sem ERROS. Os arquivos de batidas são `roteiro/batidas_*.json`; os da parte 1 estão em `_parte1/`.
2. Stills locais (`npx remotion still`, metade da resolução) de 1 quadro por batida da sua parte, numa folha `render/FOLHA_p2_<A|B>.jpg`.
3. Tudo no D: (`TEMP=D:/tmp`). Não mexa na G4 (nenhum `canal.py`). Mate só processos seus.

## Entrega (≤ 200 palavras)
- contagem de batidas;
- % de tempo por tipo (clipe, mapa, cartão);
- o que ficou fraco;
- o caminho da folha.
