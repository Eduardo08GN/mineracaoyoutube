# Brief do planejador de batidas — vídeo 5 do canal "Segundo a Segundo" (Learjet 60 N722BD, Greenacres/Palm Beach, 01/11/2026)

Você transforma a narração em **batidas visuais** escritas por um gerador Python, como nos vídeos 3 e 4. Projeto: `D:\reconstruccion\05_greenacres` (cópia do vídeo 4, Angrois). **Notícia quente, URGENTE: publicar hoje.** Tempo-alvo: **35 min** até o plano passar no `plano.py`; depois os stills de conferência.

## Leia (só isto)
- `roteiro/skript_de.json`: o texto de cada capítulo, em espanhol.
- **`roteiro/fakten.md`**: use **só** números e rótulos que estão lá, nas escolhas "para o áudio":
  - §0 a ficha;
  - §1b os segundos;
  - §3 o tempo e a física;
  - §4 o lugar.
- `v1/src/kit/maquete/API.md`: família maquete, e as seções Angrois e **"Vídeo 5 — Greenacres"** (do batedor).
- O batedor também deixou a folha `render/FOLHA_batedor.jpg`, as decisões e receitas JSON em `BATEDOR_greenacres.md`, e o gerador de prova em `ferramentas/cenas_batedor_greenacres.py`, de onde você copia as cenas.
- **Modelo de gerador:** `roteiro/gerar_batidas_A.py` e `gerar_batidas_B.py` são os do Angrois, com a classe `Cap`, `add(indice_da_palavra, dono, bild, cena)` e âncoras derivadas do texto. Reescreva-os para este vídeo. **Confira que não há capítulo duplicado** (`grep "^c = Cap"`).
- O alinhamento real vai chegar em `voz/alinhamento.json`. Até lá use `voz/alinhamento_provisorio.json`, que o gerador já escolhe sozinho. **Rode o gerador de novo quando o real chegar.**

## Fatos que mandam
- **Avião:** Learjet 60 **N722BD**, 2004, com 9 a bordo. No vídeo o modelo é o `Jato` do batedor.
  - Nunca mostrar a matrícula como texto grande. No HUD pode aparecer "N722BD" pequeno.
  - Acento azul na deriva. É a vítima, então a cor dele é azul.
- **Voo:**
  - Austin, 10:37 EST → Golfo a FL410 → perto de Naples desce para FL350 → vira para leste (098°), a ~435 kt.
  - A tempestade é o vermelho/ameaça. Convective SIGMET com topos acima de 45 000 ft.
- **Rádio:** às ~12:45 a tripulação relata gelo claro e leve, turbulência moderada de ±600-700 ft e −47 °C. Pede FL370 e sobe a ~1 200 ft/min.
- **A queda:**
  - 12:48:16, a 35 450 ft, começa a descida;
  - 12:48:32, mais de 19 000 ft/min;
  - 12:48:44, a 28 450 ft, 506 kt sobre o solo (937 km/h);
  - "overspeed";
  - 12:49:00, −32 640 ft/min, o **limite do campo ADS-B**;
  - espiral de **~190° para a direita**;
  - 12:49:22, a 8 750 ft;
  - impacto em ~12:49:35-45, quase vertical, a mais de 700 km/h.
- **Comparação:** 84 s de queda contra 46,6 s de queda livre no vácuo.
- **Solo:**
  - Military Trail, entre Cresthaven Blvd e 10th Ave N;
  - cratera na entrada do parque de casas móveis;
  - ~600 evacuados, nenhum ferido em solo;
  - PBI a 5,9 km.
- **Luz:**
  - acima das nuvens, sol forte entre torres de cumulonimbos (look `florida`);
  - embaixo, céu fechado, chuva e chão molhado (look `tormenta`/`dia` escuro).
  - **Nada de noite.**
- **Respeito:**
  - impacto em plano médio ou longo, sem corpos e sem gente perto;
  - bola de fogo curta, fumaça;
  - os vizinhos só como silhuetas ao longe.
  - **Sem nomes.** Pilotos e passageiros são manequins sem rosto.
  - Nada de logo da Bombardier.

## Linguagem visual (regras do Eduardo para este canal)
- **Gancho nos 10 s:** o cap. 01 abre já no mergulho, com o jato caindo em espiral e as 3 frases do rádio em legenda grande sobre o 3D. Nada de cartão calmo.
- **Câmera sempre em movimento:** chase com `kamera.segue`, órbita, drone e travelling. Cortes de **2,5–5 s** nos caps. 08–10 e de 3–6 s no resto. **Nada parado mais de 4 s.**
- **Texto sobre 3D em movimento**, nunca cartão branco sozinho. Os cartões (`Dokument`, `Zitat2`, `Verlauf`) precisam de fundo 3D vivo.
- **HUD fixo nos caps. 08–10**, com o mesmo estilo de número grande:
  - relógio EST com segundos;
  - altitude em pés;
  - razão de descida em pés/min (vermelho);
  - "SEGUNDOS DE CAÍDA" contando.
- **Rádio:** as frases em espanhol entram como legenda de rádio, uma "tira" com ícone de rádio, no instante em que a narração as diz. Sem o texto em inglês (o áudio original não é usado).
- **As explicações** (sem anunciar que é física), várias batidas por bloco, ancoradas palavra a palavra:
  1. **Cap. 06 "setenta pisos":**
     - `Turbulencia` (cabine, régua de 700 pés, g);
     - comparação com um prédio de 70 andares ao lado do jato;
     - a ráfaga de diseño com o `grande` "± casi 1 g" e "estructura: ~2,8 g × 1,5".
     - Use "valores de ejemplo" quando for exemplo.
  2. **Cap. 07, "rincón del ataúd":** um `Verlauf` com altitude no eixo vertical e duas curvas, a velocidade mínima (estol) e a máxima (Mach), que se aproximam no alto, com o jato marcado a 35 000 ft dentro da faixa estreita.
     - Rótulo "esquemático".
     - Densidade "menos de 1/3" com o `grande`.
  3. **Cap. 08, "efecto que los pilotos conocen bien":** uma seta 3D da força do ala deslizando para trás e o nariz baixando. `Seta3D` sobre o `Jato`, esquemático.
  4. **Cap. 09:**
     - a espiral, com `Jato.trilha` girando para a direita e `rastro` azul;
     - `Picada` com os números do dossiê (receita no `BATEDOR_greenacres.md`);
     - o transponder "saturando" (o contador para em 32 640 e pisca "LÍMITE DEL SISTEMA");
     - "piedra 47 s × avión 84 s", em barras ou em dois objetos caindo lado a lado.
  5. **Cap. 10, energia × combustível:** `grande` "≈ 44 kg de explosivo" contra "× 200 en el combustible", com uma barra comparativa.
- **Take inédito, cap. 11 (hielo a −47 °C):**
  - termômetro descendo até −40 °C (a linha "el agua se congela sola") e depois −47 °C;
  - gotas que viram cristais;
  - um sensor de velocidade (Pitot), esquemático, entupindo de cristais;
  - um `Zitat2` ou rótulo "Air France 447, 2009".
  - Termine em pergunta, sem afirmar a causa.
- **Cap. 12, a carta do NTSB de 1980:** `Dokument` com a citação traduzida, [[grifo]] em "la recuperación puede ser imposible", e o fundo 3D do jato em cruzeiro.
- **Cap. 13:** checklist do que falta saber, sobre o bairro com a cratera ao longe e os "27 min" até Eleuthera no mapa.
- **Cap. 14:** ponte para Tenerife, com um `KarteWeiss` ou cartão da nossa reconstrução. Feche numa tela de memória "9" sobre o céu.
- **Mapas:** `KarteWeiss` com `terra` (rota Austin → Golfo → Greenacres → Eleuthera em cinza, como destino que não chegou) e o `Bairro` do OSM para o lugar.
- Créditos e licenças **nunca** na imagem. Sem marca "SIMULATION".

## Regras de qualidade
- Batidas de 1,5 a 8 s, com média de ~3,5 s.
- **MISTURA** (`plano.py`): 3D ≥ 60%, cartão ≤ 25%, mapa ≤ 15%, nunca mais de 4 seguidas da mesma família.
- **DINAMISMO:** ≤ 2 cartões seguidos.
- Nos cartões, o texto aparece até 1 s depois do início da batida (BADPATHS 3.21).
- O que for esquemático ou aproximado leva "aprox." ou "esquemático".

## Divisão
- **Planejador A:** caps. 01–07 (`roteiro/gerar_batidas_A.py`).
- **Planejador B:** caps. 08–14 (`roteiro/gerar_batidas_B.py`).
- Não toque nos arquivos do outro. Componentes novos de código são **proibidos**: use só o kit, o batedor e o JSON.
  - Se algo do item 3/4/5 acima exigir código, faça com o que existe (`Seta3D`, `grande`, `Verlauf`, `hud`, `pfeil`, `schema`) e anote a limitação.

## Verificação (obrigatória)
1. `python ferramentas/plano.py` tem de passar sem ERROS, com MISTURA e DINAMISMO `ok`.
2. Stills locais, no mesmo método do batedor: Chrome do Remotion com `--gl=angle`, 1280×720, N 8. Veja os `teste_*_stills.mjs` e `teste_greenacres_stills.mjs`.
   - Se o maestro avisar que a G4 está no ar, use `set T2_DONO=segundo_v05` e `python D:/tracer3d2/canal.py stills D:/reconstruccion/05_greenacres/v1 <pasta> <seg...>` (até 16 por chamada).
   - **Nunca** rode `ligar/garantir/desligar/preparar`.
   - Monte folhas de contato de 480 px em `render/FOLHA_<A|B>_*.jpg` e corrija: vazio, cortado, sobreposto, jato fora do quadro, rótulo sobre rótulo, céu estourado, escuro demais.
3. Nada no C: (`TEMP=D:/tmp`). Mate só processos seus (PID).

## Entrega (curta)
A contagem por família, MISTURA/DINAMISMO, as folhas e o que ainda está fraco.
