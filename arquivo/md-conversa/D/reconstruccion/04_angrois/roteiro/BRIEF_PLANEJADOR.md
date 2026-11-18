# Brief do planejador de batidas — vídeo 4 do canal "Segundo a Segundo" (Angrois, 24/07/2013)

Você transforma a narração em **batidas visuais** escritas por um gerador Python, como nos vídeos 2 e 3. Projeto: `D:\reconstruccion\04_angrois` (cópia do vídeo 3, Adamuz). O dono pediu: **"capriche bastante, um vídeo bem dinâmico"**.

## Leia (só isto)
- `roteiro/skript_de.json` (texto de cada capítulo, ES) e **`roteiro/fakten.md`**. Use **só** números e rótulos que estão lá, nas escolhas "para o áudio":
  - §1b os segundos;
  - §2a onde cada veículo parou;
  - §3a as camadas de proteção;
  - §3c cena passo a passo;
  - §4 física;
  - §6 geografia e PKs.
- `v1/src/kit/maquete/API.md`: família maquete, seções Urda e Adamuz, e **a seção nova "Vídeo 4 — Angrois"** do batedor. Folha: `render/FOLHA_batedor.jpg`; decisões: `BATEDOR_angrois.md`.
- **Modelo de gerador:** `roteiro/gerar_batidas_A.py` / `gerar_batidas_B.py`. São os do Adamuz: classe `Cap`, `add(indice_da_palavra, dono, bild, cena)`, âncoras derivadas do texto. Reescreva para Angrois. **Confira que não há capítulo duplicado** (`grep "^c = Cap"`).

## Fatos que mandam (do dossiê)
- **Trem:** Alvia série **730**, **13 veículos** na ordem cabeça, CET (gerador), 9 Talgo, CET (gerador), cabeça. São **185 m** e 382 t.
- **Curva:** à **esquerda**, raio **402 m**, peralte 130 mm, limite 80 desde o PK 84+230. Os carros saem para a **direita/norte** (lado de fora).
- **Sequência:**
  - a chamada vai de **20:39:15 a 20:40:55**: 100 s, 5,54 km, a **199 km/h**;
  - a E′7 está **verde** no PK 80+619, aos 43 s de chamada;
  - o túnel de Marrozos (1.285 m) fica logo depois;
  - a placa de mudança de modo ASFA está no PK 80+803;
  - o viaduto de **O Eixo** (alto, 1.225 m) traz o **ponto-limite para frear** no PK ~82,85–82,97;
  - em seguida vem o túnel de Santiago (641 m);
  - o freio de emergência é às **20:40:59** a 195 km/h, dentro do túnel, com 3 s de atraso;
  - a E7 está verde no PK 84+176;
  - a curva começa no PK 84+228;
  - a placa "84.2" fica no PK 84+273, já dentro da curva.
- **Ponto 0, 20:41:06, a 179 km/h:**
  - **o CET (2º veículo) sobe primeiro** e sai para fora, arrastando tudo;
  - **arco elétrico** na catenária;
  - **fim às 20:41:16**, depois de 10 s e ~271 m.
- **Três grupos de destroços:**
  - o 8º carro fica fora da plataforma, num caminho;
  - o 9º (cafeteria) fica montado sobre o 7º;
  - o **12º (CET de cauda) pega fogo**: só brasa e fumaça localizada.
- **Luz:** **dia de verão**, sol baixo a ~13°, à esquerda e à frente na reta (contraluz na saída dos túneis). Look `atardecer`/dourado, o do batedor. **Nada de noite.**
- **Sem nomes.** Maquinista e interventor são manequins sem rosto. Sem logos.

## Linguagem visual
- **Pouca "maquete branca":** céu real, verde da Galícia, brita, trilho, concreto, as cores do Alvia como acento, faróis acesos.
- **Dinamismo máximo:**
  - câmera **sempre** em trilho (chase colado no trem, travelling lateral, drone);
  - cortes de **2,5–5 s** nas sequências de tensão (07–10 e 12) e de 3–6 s no resto;
  - **nada parado mais de 4 s**;
  - **texto sobre 3D em movimento**, nunca cartão branco sozinho.
- **HUD fixo nas sequências 07–10** (anotação de número grande, sempre do mesmo jeito):
  - relógio "20:39:15 → 20:40:55" correndo;
  - **contador da chamada "LLAMADA 0 → 100 s"**;
  - velocímetro "199 km/h";
  - **"distancia hasta la curva"** encolhendo (5,5 km → 221 m).
  - A **E′7** e a **E7** acendem verdes com um "pi" visual (anel).
- **Física, o coração do vídeo:** várias batidas por bloco, ancoradas palavra a palavra.
  1. **Cap. 05 ERTMS e cap. 06 ASFA:**
     - a via colorida "protegida" que **acaba** no PK 80,1, 4 km antes da curva;
     - as balizas ASFA que só "pitam" com verde;
     - as placas que não existem;
     - a única placa já dentro da curva (+43 m).
  2. **Cap. 07, "cien segundos = cinco kilómetros y medio":**
     - trem visto de drone com régua/trilha luminosa crescendo 55 m por segundo;
     - comparação com campo de futebol;
     - mapa de satélite com a mancha de 5,5 km sobre a reta real.
  3. **Cap. 09 `Frenagem`:**
     - **195 → 80** precisa de **~1,3 km / ~33 s**;
     - o ponto-limite **sobre o viaduto de O Eixo** (marcador fantasma);
     - "20 s antes do freio real; a llamada seguía".
  4. **Cap. 10:**
     - os 3 s de atraso do freio (+160 m);
     - "**221 m** disponíveis × **1,3 km** necessários";
     - "tenía la sexta parte".
  5. **Cap. 11, `Curva` e `Vuelco` do batedor:**
     - 4× ao dobro da velocidade;
     - **5×** a 179;
     - **4 kg → 41 kg** de lado numa pessoa de 75 kg (manequim);
     - a **seta do peso**: 3° a 80 → ~29° a 179, **saindo da base**;
     - a roda interna levanta.
     - A altura do CG não é confirmada: rótulo discreto "esquemático".
- **Take inédito (cap. 13):**
  - um `Dokument` com a análise de riscos ("catastrófico · **increíble** · **despreciable**");
  - o carimbo **"RIESGO EXPORTADO AL MAQUINISTA"** voando do papel até a cabine (em 3D, sobre a cabine);
  - **mapa da Espanha acendendo 375 pontos** (122 ficam verdes "en 8 meses"; distribuição esquemática, rotular "ubicación esquemática");
  - `Zitat2` da ERA 2016 ("no ha sido investigado de forma independiente");
  - o equilíbrio (absolvição de 2026, voto contra) em `Dokument` sóbrio.
- **Choque respeitoso (cap. 12):**
  - média/longa distância, sem gente, sem corpos;
  - o CET levanta, o arco elétrico, a poeira;
  - resultado em plano médio e drone;
  - vizinhos de Angrois como silhuetas de longe, correndo para a via (sem rostos).
- **Final (cap. 14):**
  - placa e baliza novas na curva;
  - mapa ligando Angrois e Adamuz;
  - tela de memória "80" sobre a curva ao entardecer.
- Créditos e licenças **nunca** na imagem. Sem marca "SIMULATION".

## Regras de qualidade
- Batidas de 1,5 a 8 s, com média de ~3,5–4 s (mais que no Adamuz).
- **MISTURA** (`plano.py`): 3D ≥ 60%, cartão ≤ 25%, mapa ≤ 15%, nunca mais de 4 seguidas da mesma família.
- **DINAMISMO:** ≤ 2 cartões seguidos.
- Cartões: o texto aparece até 1 s depois do início da batida (BADPATHS 3.21).
- Coordenadas sem documentação levam "aprox.".

## Divisão
- **Planejador A:** caps. 01–07 (`gerar_batidas_A.py`).
- **Planejador B:** caps. 08–14 (`gerar_batidas_B.py`).
- Não toque nos arquivos do outro.

## Verificação (obrigatória)
1. `python ferramentas/plano.py` sem ERROS, com MISTURA e DINAMISMO `ok`. O alinhamento real está em `voz/alinhamento.json`.
2. Stills na G4:
   - rode `set T2_DONO=segundo_v04` e `python D:/tracer3d2/canal.py stills D:/reconstruccion/04_angrois/v1 <pasta> <seg...>`, até 16 por chamada;
   - **só se `canal.py saude` mostrar a G4 no ar**;
   - **nunca** `ligar/garantir/desligar/preparar` (só o maestro);
   - folhas de contato de 480 px em `render/FOLHA_<A|B>_*.jpg`;
   - corrija: vazio, cortado, sobreposto, trem fora do quadro, rótulo sobre rótulo, céu estourado, contraluz escuro demais.
3. Nada no C: (`TEMP=D:/tmp`). Mate só processos seus (PID).

## Entrega (curta)
A contagem por família, MISTURA/DINAMISMO, as folhas e o que ainda está fraco.

## Componentes do batedor (ver API.md "Vídeo 4 — Angrois" e `ferramentas/cenas_batedor_angrois.py`, copie dali)
- `TremAV` `serie: "s730"` (`talgo_n` 9); faixa com `partes.faixa`/`faixa_alt`/`faixa_y`.
- `Via` com:
  - `segmentos` (curva real pelos PKs), `peralte`, `bitola: 1.668`;
  - `tunel` (boca do túnel), `trinchera` com `muro`;
  - `protecao` (faixa ERTMS azul → ASFA laranja, balizas, placa "Fin del ERTMS").
- `kamera.segue {obj, ref, pos, pos_fim, alvo, orbita, congela}`: chase e helicóptero na curva. `congela` congela a câmera no impacto enquanto o trem segue, e é o plano mais forte.
- `descarrila()` no gerador (calcula `carros_kf` dos 13). **Ajuste ao dossiê** (o batedor usou valores provisórios):
  - **o 2º veículo (CET) é o 1º a levantar**;
  - o **8º** vai para fora da plataforma até um caminho;
  - o **9º** termina montado sobre o 7º;
  - o fogo e a fumaça ficam no **12º (CET de cauda)**, não na cabeça;
  - três grupos: cabeça+CET+3; 4–5 a 11 m; 6–13 a 33 m.
  - A cabeça leva ~10 s e ~271 m até parar. Use cortes, **não acelere o tempo**.
- Física:
  - `{"comp": "Curva"}`: seta ∝ v², 0,13 g → 0,63 g, comparação com rotatória. A seta cinza de 80 km/h fica escondida sob a vermelha no começo: separe-as.
  - `{"comp": "Vuelco"}`: seção do Talgo com CG, peso, centrífuga e resultante.
  - `Frenagem`: ainda na reta do Adamuz. Serve para o cap. 09 com os números 195 → 80, 1,3 km, 221 m.
- Modelos: `Seta3D`, `SecaoVuelco`, `Mata` (eucalipto e carvalho), `Aldea` (casas de Angrois), `Terreno` com `geo/angrois_local.json` e ortofoto IGN (`achata.via`).
- **Look:** `look: "tarde"`. Na folha do batedor o céu ficou **branco e lavado demais**. Nas batidas, puxe para um **entardecer dourado de verão**:
  - sol quente e baixo (~13°);
  - céu com cor;
  - verde mais saturado;
  - sombras longas.
  - Se o look não aceitar, ajuste os parâmetros de luz da cena (`sol.cor`, `ambiente`, `nevoa`) e não o kit.
- **Ainda não modelados** (resolva com o que existe, sem inventar forma de foto):
  - o viaduto alto de O Eixo (use `Terreno`/vale + rótulo);
  - os sinais E′7/E7 (poste com luz verde simples);
  - a placa "84.2" (placa simples com rótulo).
