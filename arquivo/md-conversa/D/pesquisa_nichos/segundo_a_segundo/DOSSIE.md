# Dossiê Segundo a Segundo — fatos para a revisão adversarial (01/11/2026)

Só fatos e números, sem recomendação. Cada item aponta a fonte. Quem completar, marque **[minerador]** ou **[suporte]**.

---

## 1. O canal hoje
Fonte: API do YouTube às 01/11, salvo em `D:\pesquisa_nichos\segundo_canal_0111.txt`.
- O canal tem 179 inscritos e 3 vídeos públicos. A estatística do canal (1.196 views) está atrasada em relação à soma dos vídeos.
- Vídeos publicados:

| Vídeo | Publicado (UTC) | Tipo | Views | Likes | Coment. | Duração |
|---|---|---|---:|---:|---:|---|
| Tenerife: "Lo que realmente pasó en la pista de Tenerife" | 29/10 19:15 | evergreen (1977) | 270 | 2 | 0 | 13:20 |
| Urda: "Choque de trenes en Toledo: lo que realmente pasó en Urda" | 30/10 09:30 | **notícia quente**, ~25 h depois do acidente (primeira manchete 29/10 08:01Z) | **32.485** | 219 | 23 | 13:06 |
| Adamuz: "Choque de trenes en Córdoba: lo que realmente pasó en Adamuz" | 01/11 06:45 | evergreen recente (jan/2026) | 8 | 1 | 0 | 10:42 |

- No Urda, ~80% do tráfego veio de Início e ~15% de "A seguir". A busca foi quase nula (transcrição da sessão do minerador, print do Studio).
- Comentários do Urda: solidariedade, elogio à apuração e debate técnico de culpa (controlador/ordem). Há duas teorias de atentado.
- Angrois já está entregue e não publicado (`D:\reconstruccion\04_angrois\entrega`).

## 2. Janela da notícia quente
- **O interesse no Urda caiu ~90% em 72 h** (Trends, `crista.py`, 31/10). A janela útil medida é de 24–48 h depois do pico.
- **O Chiapas 7,4 (27/10) passou do pico sem vídeo nosso.** No México, a busca chegou a ~2× o pico do Urda e estava em 0 em 31/10. Não havia vídeo longo em ES (`D:\reconstruccion\radar\saida\crista_2026-10-31_2028.json`).
- **O radar não está agendado.** Rodou em 31/10 e em 01/11 04:42 (112 consultas RSS em 9 países + Trends de 9 países, 3.323 unidades de cota).
- **Radar de 01/11** (`saida\2026-11-01.md`):
  - nº 1 é o Urda (já produzido);
  - Panamá 5,9 com nota 100, sem kit de sismo;
  - 3 helicópteros: Chinook da Eufor (ES 106 mil / EN 334 mil), San Juan e Uttarakhand;
  - Ouigo parado no túnel (ES 1,1 mi, 65 h, sem mortos).
- **O radar agora marca JÁ PRODUZIDO** (−40 na nota) e cobre sismo, riada, vulcão, alud, furacão, energia e espaço.

## 3. O canal-modelo (Reconstructed, EUA, criado em 03/10/2026)
Fontes: `D:\pesquisa_tracer\radar2\RELATORIO_RECONSTRUCAO.md`, `reconstructed_0111\` e `D:\pesquisa_nichos\tipos_es\uploads.json`.
- **Em 01/11:** 21,5 mil inscritos, 5,52 mi de views e 30 vídeos em 29 dias.
- **Os hits são notícia da semana:**
  - flydubai cockpit: 3,28 mi;
  - Six Flags: 1,08 mi;
  - flydubai versão longa: 276 mil;
  - ataque ao aeroporto de Riad: 244 mil;
  - "Spain's Safest Train Failed, Twice" (Urda + Adamuz, 28/10): 198 mil em 4 dias, com dublagem em ES;
  - Mein Schiff 3: 135 mil.
- **Evergreen:** o Air India 171 (evento de jun/2025) fez 74–81 mil em 2 dias.
- **Fracassos:**
  - tiroteios: 1–48 mil;
  - enchente: 6–11 mil;
  - protesto na França: 1,5 mil;
  - Binance: 241 views na estreia;
  - cortes "(3D)" de 1 min: ≤ 8 mil.
- **Ele nunca repete o tipo de evento em seguida.**
- **Visual:** argila branca/cinza com corte para dentro do veículo, pessoas sem rosto coloridas (azul vítima, vermelho culpado), fundo de estúdio escuro, mapa branco em relevo com rota vermelha, selo "HOW WAS THIS ALLOWED?". As miniaturas não têm rosto.

## 4. Demanda em ES por tipo de evento

### 4.1 Famílias no Noticias Ilustradas (624 mil inscritos, jan–out/2026)
Fonte: `D:\pesquisa_nichos\tipos_es\RELATORIO.md`.

| Família | Vídeos/mês | Mediana |
|---|---:|---:|
| Máquina/transporte | 3,6 | 64 mil |
| Natural com física | 0,7 | 80 mil |
| Operação militar/policial | 2,7 | 85 mil |
| Roubo/golpe | 1,0 | 120 mil |
| Crime/atentado | 3,5 | 93 mil |

As famílias reconstruíveis somam ~12 eventos por mês, contra 3,6 só de máquina.

### 4.2 Subtipos naturais, busca ES de vídeos longos, 180 dias
Fonte: `natural_subtipos.json`.
- Tsunami e terremoto têm mediana de 1,5–2,6 mi, e nenhum desses vídeos é reconstrução 3D.
- Depois vêm glaciar/riada, vulcão e furacão.
- Deslizamento, incêndio florestal e socavão ficam fracos (20–78 mil).

### 4.3 Grafos de evento (63 eventos, busca no país do evento + MX)
Fonte: `D:\pesquisa_tracer\radar2\grafos_es.json` [minerador].
- **Mediana dos vídeos longos por grafo:**
  - energia 1,96 mi;
  - navio 1,11 mi;
  - espaço 624 mil;
  - natural 564 mil;
  - mina/resgate 463 mil;
  - avião 461 mil;
  - incêndio 338 mil;
  - explosão 301 mil;
  - estrutura 294 mil;
  - motor 267 mil;
  - roubo 101 mil;
  - **trem 94 mil**.
- **Eventos com alta demanda e 0 reconstrução longa:**
  - Titan: 3,77 mi, 5 longos;
  - Banco Río: 2,8 mi;
  - montanha-russa MX: 1,84 mi;
  - La Palma: 1,24 mi;
  - Columbia: 631 mil;
  - Surfside: 560 mil;
  - Otis: 496 mil;
  - Línea 12: 412 mil;
  - Campanar: 338 mil;
  - Los Alfaques: 289 mil;
  - Apagón: 234 mil.
- **Com muita demanda, mas já reconstruídos:** Chernóbil 6,8 mi (5 reconstruções), Fukushima 1,96 mi (1), Costa Concordia 1,78 mi (1), Chapecoense 1,69 mi (4), Armero 1,56 mi (5).
- **Os nossos:** Angrois/Alvia tem mediana de longos de **26 mil** (3º pior de 63) e Spanair 357 mil (3 reconstruções). Na busca, o Interoceánico tem 94 mil.

### 4.4 Eventos hispânicos (todos os tempos, 28/10)
Fonte: `RELATORIO_RECONSTRUCAO.md`.
- Chapecoense: a simulação da Télam fez 7,9 mi, e o Jimenito1010 tem "Minuto a Minuto" com 2,0 mi.
- Armero 8,4 mi.
- Línea 12: 4,9 mi e 0 em 3D.
- Costa Concordia: 6,9 mi e 0 em 3D.

## 5. Semântica hipotética ("What if / simulamos / mapeamos")
Fontes: `D:\pesquisa_nichos\hipoteticos\varre.txt`, `oferta_es.txt` e `D:\pesquisa_tracer\radar2\RELATORIO.md` (28/10).
- **EN, últimos 30 dias:** 4 canais novos estouraram com "What If <ameaça real> + We Mapped/Simulated":
  - Tracer: Apophis, 5,38 mi, canal de 27 dias;
  - Hindcast: nuke, 1,56 mi, 11 dias;
  - Every Strike: 145 mil, 70 dias;
  - Doomsday Math: "Cascadia Megaquake… We Ran 10,000 Simulations", 200 mil, 22 dias, 971 inscritos.
  - Também: The Last Day, "Sun Disappeared", 764 mil, 115 dias.
- **ES:** o 1º clone literal saiu em 22/10. O Amberfield Archive, com 186 inscritos, publicou "¿Y si el asteroide Apofis chocara…? Los científicos trazaron…" e fez 176 mil em 10 dias.
- **Oferta ES de vídeos longos em 12 meses, por ameaça hispânica:**
  - megaterremoto CDMX: 0;
  - tsunami Lima/Valparaíso: 0;
  - megaterremoto Chile: 1 matéria de TV de 4 min (8,6 mil);
  - Cumbre Vieja: 15 mil;
  - Popocatépetl: Xataka 117 mil (23/10), o resto < 13 mil;
  - supervulcão: Nat Geo ES 4,1 mi, CATACLYSMA 722 mil;
  - asteroide: mediana de 276 mil.
- **Radar de 28/10, buracos EN×ES:** supervulcão 83×, tsunami minuto a minuto 67×, asteroide 27×, megaterremoto 7,7×.
- **Outro boom em ES, de fantasia/pessoal:** Versión Extrema 772 mil (canal de 58 dias), Giro Imposible 445 mil (20 dias), SUPERMASIVO 228 mil (24 dias).
- **Consistência dos canais hipotéticos** (`D:\pesquisa_tracer\referencias_whatif\uploads.json`) [minerador]:
  - Tracer é one-hit. O Apophis tem 5,38 mi; depois dele, só o Cascadia (68 mil) passou de 10 mil. O tsunami hour by hour fez 381 views, o nuclear food 261 e o solar storm 299. O canal pivotou para esse formato em 16/10.
  - Doomsday Math: 39 uploads em 3 semanas, 30 deles shorts. Dos longos, só 2 funcionaram (Cascadia 200 mil e asteroide dos dinossauros 165 mil); os outros ficaram entre 89 e 6,7 mil. Todos os shorts têm menos de 2 mil.
  - Hindcast: 2 vídeos, com 1,56 mi e 160 mil. Every Strike: mediana dos longos de 51 mil e 1 fracasso de 3 mil. Os dois são de guerra (fora do nosso escopo).
  - Reconstructed: mediana dos longos de 82 mil; todos os shorts têm menos de 8 mil.
- **Demanda de busca pelas ameaças hispânicas** (Trends, 12 meses, e autocompletar do YouTube; `D:\pesquisa_nichos\hipoteticos\demanda_ameacas.txt`):
  - No México (média de 12 meses, escala relativa do mesmo lote): "tsunami" 39, "Popocatépetl" 20,8, "asteroide" 15,5, "accidente de tren" 2,0 e **"terremoto Ciudad de México" 0,6**. O mexicano busca "sismo/temblor", não "terremoto CDMX"; o termo exato tem pouca busca.
  - No Peru: "terremoto Lima" 8,2 contra "tsunami Lima" 0,5.
  - Autocompletar do YouTube (MX): "qué pasaría si hay/hubiera un terremoto en lima" aparece 3 vezes, ao lado de "...en colombia", "...de magnitud 9/10". "qué pasaría si el popocatépetl hiciera erupción" também existe. "qué pasaría si" puro puxa fantasia (sol explotara, luna, EUA invade México).

## 6. Produção (pipeline Segundo a Segundo)
Fonte: `MEDICAO.md` de cada vídeo [minerador].
- **Do tema ao mp4:**
  - Tenerife: ~2 h, mais o batedor;
  - Urda: 1 h 41;
  - Adamuz: 1 h 10;
  - Angrois: 2 h 10.
- **Com kit pronto, do alerta ao mp4: 2–3 h.** Os gargalos são três: fatos ainda em movimento, o OK do Eduardo e a publicação manual.
- **Kit:**

| Situação | Tipos |
|---|---|
| Pronto | trem, terreno Copernicus, manequins, VFX, HDRI |
| Parcial | avião (747/RJ85; falta A320/737 e cockpit), apagão (fica pouco 3D) |
| Falta | navio/submarino, colapso/estrutura, sismo, água/lava, helicóptero |

- **Batedores:** cada um leva ~30–60 min; o de colapso + sismo, 1,5–2,5 h na primeira vez. A G4 é compartilhada com o Kriegsmomente (1 render por vez).
- **Infra:** o sync tar caiu de 703 s para 36–104 s, a correção por trecho leva 2 min 47 s e o porteiro já está em uso.

## 7. Regras do Eduardo em vigor
Fontes: memória e decisões desta conversa.
- **Escopo:** máquina, estrutura e parque, mais desastre natural com física (31/10). Crime, tiroteio e política ficam fora; roubo também, até ele decidir.
- **Título de notícia:** lugar + tipo do evento no começo.
- **Física implícita, estilo Discovery:** sem anunciar "física", sem fórmula nem unidade técnica na tela.
- **Dinamismo:** nada parado mais de 4 s, câmera em movimento, 2–3 takes de física para leigo e acabamento melhor sem custo alto.
- **Mineração tridimensional:** demanda + estágio da corrida + produção ≤ 2 h.
- **Produção:**
  - batedor sempre;
  - entregar só o mp4 com áudio;
  - música só instrumental;
  - narração no AI Studio (sem API).
- **Um vídeo por micronicho;** só se repete quando o vídeo viraliza.

## 8. Engenharia reversa dos canais What If [minerador — a completar]
`D:\pesquisa_tracer\referencias_whatif\RELATORIO.md`: roteiro (6 legendas por canal), ritmo a 20 fps (3 vídeos por canal) e esteira de produção deduzida. Detalhe em `<canal>\CANAL.md` e `medidas.json`. [minerador]

- **Concentração extrema.**
  - Tracer: o Apophis é 98,3% das views.
  - Doomsday: 3 hits em 9 longos, com o mesmo molde de produção. As views por dia vão de 89 a 27 mil (300×).
  - Every Strike: mesmo título, 146 mil × 3 mil.
  - Conclusão: em hipotético, quem decide é o tema e o título; a produção não explica a diferença.
- **O que os hits têm em comum.** É hipótese, porque não há Studio. Os padrões se repetem nos 4 canais:
  - ameaça real nomeada, com lugar e momento ("Hit Tonight/Today", data real);
  - medo pessoal ("e se eu estiver lá");
  - número humano na miniatura ("31 MINUTES", "TOKYO 41.7 MILLION");
  - promessa entregue cedo.
- **O que os fracassos têm em comum:**
  - tema abstrato (Terra parada, buraco negro, gelo);
  - título genérico ("a tsunami… West Coast", 381 views);
  - promessa atrasada (mapa aos 7:29 e aos 14:03; 24% do tempo em outro país);
  - tema saturado (Yellowstone, 2,8 mil).
- **Carona no viral (Tracer).** As views por dia caem com a distância do Apophis: 6.850 → 1.206 → 385 → 252 → 95. É correlação.
- **Publicar demais divide.**
  - Reconstructed: a semana de 5 longos (19–25/10) concentrou 4 dos 5 fracassos.
  - Every Strike: o fracasso saiu 1 dia depois do hit.
  - É hipótese.
- **Shorts falham em todos:** Doomsday (30) abaixo de 2 mil, Reconstructed abaixo de 8 mil, Tracer e Every Strike abaixo de 2 mil.
- **Conversão em inscrito é baixa nos hipotéticos:** Tracer 0,06% e Doomsday 0,23% das views. O público passa e não fica.
- **Roteiro:**
  - gancho com hora/lugar ou número-âncora de tempo;
  - "simulação, números reais" aos ~30 s;
  - relógio T+;
  - 4,2–9,6 números por minuto (hits do Doomsday 8,1–9,2; Reconstructed 7,8–8,3);
  - 121–175 wpm;
  - TTS masculina grave;
  - fecho "nada disso aconteceu" + 3–4 portas de prevenção, ou "the honest part".
- **Visual e ritmo** (cortes/min, plano mediano, % 3D):
  - Doomsday: 1 corte a cada 9–14 s, câmera parada em 54–66% dos segundos, mapa/UI 60–70%;
  - Reconstructed: 9,6–12,3 cortes/min, plano mediano 4,5–4,9 s, 3D 63–65%;
  - **nós (Angrois): 15,4 cortes/min, 3,9 s, 3D 69%.**
- **Produção:** todos parecem código (Remotion/three.js, TTS, roteiro de LLM), ~1 dia por vídeo.
  - Doomsday: simulações reais em Python, mas elas ocupam só 11–12% do tempo.
  - Reconstructed: Spain saiu em menos de 15 h depois do acidente.
- **Reconstructed Spain × nós:**
  - ASFA não é nomeado;
  - a conta de velocidade não fecha (25 km/16 min ≈ 94 km/h × "≈200");
  - fontes quase só ministeriais;
  - dublagem ES com legenda 16% menor e "L-Z-B" soletrado.
- **Mudanças recentes no Reconstructed:**
  - o hit de 03/10 tinha 3D branco editorial; agora é terreno/aeroporto realista;
  - abas "Reported / A fault? / Tests";
  - foto de sobrevivente no Air India.

## 9. Lacunas de dado (o que NÃO sabemos)
- O CTR e a retenção do Urda: não temos o Studio por API. Só o Eduardo vê.
- Se o público do Urda segue o canal para outro tipo de evento: nenhum teste foi feito.
- A demanda real de um hipotético CDMX: o termo exato tem pouca busca (seção 5), mas o vídeo vive de Início, e a busca não mede isso. É hipótese.
- n = 1: só temos um viral nosso (Urda). Quase toda inferência sobre o canal é hipótese, para os dois lados.
- A curva de views do Adamuz (publicado há horas).
