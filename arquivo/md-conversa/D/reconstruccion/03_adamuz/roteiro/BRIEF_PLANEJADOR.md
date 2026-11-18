# Brief do planejador de batidas — vídeo 3 do canal "Segundo a Segundo" (Adamuz, 18/01/2026)

Você transforma a narração em **batidas visuais** escritas por um gerador Python (como nos vídeos 1 e 2). Projeto: `D:\reconstruccion\03_adamuz` (cópia do vídeo 2 Urda). Prazo curto: o vídeo sai hoje à noite.

## Leia (só isto)
- `roteiro/skript_de.json` (texto de cada capítulo, ES) e **`roteiro/fakten.md`** (fatos de Adamuz; use **só** números e rótulos que estão lá, com as escolhas "para o áudio"; §1b = os segundos, §2 = onde cada carro parou, §3c = cena passo a passo, §6 = geografia).
- `v1/src/kit/maquete/API.md` — família maquete (`Maquete`, objetos, `anot`, editorial `Dokument`/`Verlauf`/`Uhr`/`Zitat2`/`KarteWeiss`), a seção "Trens e via (Urda)" (`TremAV`, `Via`, descarrilamento) e **a seção nova "Vídeo 3 — Adamuz"** (série `s120` Alvia, looks `dia`/`atardecer`/`noche` com céu Poly Haven, brita/trilho/corte de rocha, faíscas/giroflex/tremor, anotação de número grande, `RodaTrilho`, `Frenagem`, lugar com relevo + PNOA). Folha: `render/FOLHA_batedor.jpg`; decisões: `BATEDOR_adamuz.md`.
- **Modelo de gerador:** `roteiro/gerar_batidas_A.py` / `gerar_batidas_B.py` (os do Urda, já copiados; classe `Cap`, `add(indice_da_palavra, dono, bild, cena)`, âncoras derivadas do texto). Reescreva para Adamuz. **Confira que não há capítulo duplicado** (`grep "^c = Cap"`; lição do Urda).

## ATENÇÃO — fatos do dossiê, não do batedor
O batedor trabalhou antes do dossiê e usou números da imprensa (PK 317, rotura na via 2, 15–20 s). **Vale o dossiê:**
- Rotura: **PK 318+681, via 1, trilho direito**, numa **solda** (trilhos de 1989 e 2023). Colisão: **PK ~318+173** (~500 m ao norte). Trecho reto; saída do túnel Loma del Partidor Norte no PK 319+412.
- **Iryo 6189** (série 109/ETR 1000, 8 carros, ~290 pass.) rumo **norte (Madrid) pela via 1**; os **carros 6, 7, 8** (os de trás) descarrilam e invadem a **via 2**; o carro 8 tomba; o Iryo para às 19:44:03.
- **Alvia 2384** (Renfe **s120**, 4 carros, ~185 pessoas) rumo **sul (Huelva) pela via 2**; LZB fecha o S613 e freia o Alvia a **217 km/h a 188 m** do sinal; impacto às **19:43:42** na traseira do **carro 6 do Iryo** (Iryo 152, Alvia 204 km/h); os 2 primeiros carros do Alvia seguem ~200 m, caem num **talude de 4 m** e batem numa **parede de rocha**; o 3º fica atravessado.
- **~10 s** entre o 1º eixo fora (19:43:34) e o choque; ~13 s desde a 1ª anomalia (19:43:29). Noite (pôr do sol ~18:15) → look **`noche`** em toda a sequência do acidente; `dia`/`atardecer` só para o lugar, os trens partindo e as cenas de física.
- **Não usar `SoldaFria`** (a causa da quebra da solda NÃO está confirmada: perícias pendentes). Pode mostrar a rotura/lasca de ~40 cm sem explicar o porquê.
- Adapte as constantes do batedor (`v1/src/kit/maquete/adamuz.ts`: PK, via, tempos, onde os carros param) aos valores acima; tempo do descarrilamento real (≈10 s), não comprimido.

## Linguagem visual (pedido do dono do canal em 31/10)
- **~20% menos "maquete branca":** céu real (looks do batedor), brita, trilho, corte de rocha, cores de acento dos operadores (Iryo vermelho, Alvia roxo), faróis e luzes de cauda acesos, giroflex no resgate. Manequins sem rosto; **sem nomes** de pessoas; sem logos.
- **Mais dinamismo:** câmera sempre em trilho; cortes de 3–6 s; **nada parado mais de 4 s**; números grandes por cima do 3D (anotação de número grande).
- **Física explicada (3 blocos, o coração do vídeo — várias batidas cada, ancoradas palavra a palavra):**
  1. **Cap. 05 "La vía que siente al tren" (circuito de via):** componha com o que existe — close de `Via` com a corrente animada (`anot` traço/seta correndo pelos dois trilhos, cor azul), um eixo entrando que "faz ponte" (a seta curta-circuita pelas rodas) e um **medidor** (anotação de número grande "2,2 V → 0 V · ocupado"); depois o trilho partido cortando o caminho. Fecha com `Verlauf` (gráfico) se ajudar.
  2. **Cap. 06 take inédito "La vía avisó":** `Verlauf` da tensão (2,2 → 1,5 V às 21:46 de 17/01, **linha vermelha de 0,78 V** nunca cruzada), relógio `uhr` "sábado 17 enero 21:46"; contadores "22 horas · 19 maquinistas · 3 trenes con marcas"; a frase da Adif em `Zitat2` ("pudo deberse a otras causas…", fonte "Adif"). Nada de afirmar que a alarme teria evitado o acidente.
  3. **Cap. 07 `RodaTrilho`** (cônica 1:20 → pestaña → "si falta el carril") com os marcos na fala.
  4. **Cap. 10 `Frenagem`** com **números reais**: Alvia a **217 km/h**, distância necessária **2.000–2.600 m** (régua), sinal a **188 m**; HUD **velocímetro e distância lado a lado** ("217 km/h" | "188 m hasta la señal" vs "necesitaba ~2 km"); a energia "al doble de velocidad, cuatro veces más". Câmera acompanhando o trem (o batedor achou o trem pequeno). Energia em MJ só se calcular de fatos do dossiê (massa do Alvia 225 t vazio — rotule "aprox."); senão, sem MJ.
- **Momentos de tensão (8–11):** relógio `uhr` "domingo 18 enero 2026" com segundos (19:43:20 → :34 → :37 → :40 → :42), velocímetro dos dois trens, distância entre eles encolhendo.
- **Choque respeitoso:** média/longa distância, corte antes do contato, resultado em plano médio; sem corpos, sem fogo (só "pequeño incendio": no máximo brasa/fumaça pontual).
- Créditos/licenças **nunca** na imagem. Sem marca "SIMULATION".

## Regras de qualidade
- Batidas de 1,5 a 10 s, média ~4–5 s. **MISTURA** (`plano.py`): 3D ≥ 55%, cartão ≤ 30%, mapa ≤ 15%, nunca mais de 4 seguidas da mesma família; **DINAMISMO** ≤ 2 cartões seguidos.
- Cartões: o texto aparece até 1 s depois do início da batida (BADPATHS 3.21).
- Coordenadas sem documentação = "aprox.".

## Divisão
- **Planejador A:** caps. 01–07 (`gerar_batidas_A.py`). **Planejador B:** caps. 08–14 (`gerar_batidas_B.py`). Não toque nos arquivos do outro.

## Verificação (obrigatória)
1. `python ferramentas/plano.py` sem ERROS; MISTURA e DINAMISMO `ok`. Alinhamento real em `voz/alinhamento.json` quando existir; até lá `python ferramentas/alinhamento_provisorio.py` e regenere depois.
2. Stills na G4: `set T2_DONO=segundo_v03` e `python D:/tracer3d2/canal.py stills D:/reconstruccion/03_adamuz/v1 <pasta> <seg...>` (até 16 por chamada) — **só se `canal.py saude` mostrar a G4 no ar**. **Nunca** `ligar/garantir/desligar/preparar` (só o maestro). Folhas de contato 480 px em `render/FOLHA_<A|B>_*.jpg`. Corrija vazio, cortado, sobreposto, trem fora do quadro, rótulo sobre rótulo, noite escura demais.
3. Nada no C: (`TEMP=D:/tmp`); mate só processos seus (PID).

## Entrega (curta)
Contagem por família, MISTURA/DINAMISMO, folhas e o que ainda está fraco.
