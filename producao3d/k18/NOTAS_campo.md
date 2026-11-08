# NOTAS da frente `campo` (K18 Königgrätz): o mapa vivo 3D

Entrega de 06/11. Cena em `src/cenas/campo.tsx`, módulos em `src/cenas/campo/`. `npx tsc --noEmit -p .` passa sem erro no campo (o único erro restante do projeto é de outra frente: `src/cenas/dreyse/estacoes1.tsx(144)`).

## O que foi feito

### Terreno (`campo/terreno.tsx`)
- **Relevo:** DEM float16 DMR 5G real, com exagero vertical **4,5×**. Chlum (336 m) e Lipa (315 m) leem como alturas sobre a Bistritz (~250 m).
- **Malha:** uma fina de 512² só na janela da câmera e uma grossa de 256² no resto, furada onde a fina cobre.
- **Pele:** o plano prussiano de 1866 (CC0) multiplicado pela sombra calculada do próprio DEM.
  - A derivada é média em 3 e 7 texels, o que apaga o aterro da autoestrada D35 e o micro-relevo moderno.
  - Há ganho de papel por quadrante, medido no PNG, para igualar o tom das 4 folhas.
  - As frestas entre quadrantes são preenchidas esticando o plano vizinho.
- **Fora da folha de 1866:** um mapa "de época" feito do DEM, com curvas de 5 m que só aparecem no declive, mata OSM pontilhada e água aquarelada. Ele esmaece no papel conforme se afasta do plano: a folha parece pousada sobre o papel.
- **Borda:** dissolve no papel creme com bordo irregular de aquarela, sem vinheta. O fundo é papel liso com grão `feTurbulence` estático.
- **Extras no shader:**
  - neblina nas Senken (b044), que deriva com t;
  - zona cega hachurada em acento (viewshed).

### Viewshed real
`viewshed()` faz uma varredura por raios no DMR 5G, com a copa do **Swiepwald de 1866** (+20 m) como obstáculo. O Swiepwald foi cortado e não está no OSM: tracei o contorno do plano encaixado (`SWIEP_1866` em `receitas.tsx`). O resultado também pode ser consultado na CPU, e é isso que alimenta os raios de visada a tinta da b111.

### Unidades (`campo/tropas.ts`, `motor.tsx`)
- **Interpolação:** `unidades.json` é interpolado por `horaDe`, com posição, frente e efetivo.
- **Bloco Brockhaus:** projetado no chão e virado para `frente_graus`.
  - A largura é ∝ `largura_m`, mas fica limitada entre 34 e 128 px (bloco pequeno).
  - Corpo = 3–4 brigadas com fresta; divisão = 2 blocos.
  - A borda da frente é mais grossa.
- **Perdas:** hachura de papel que esvazia o bloco, vinda dos dados (I. Korps 20.000 → 9.721, Poeckh, Batterie der Toten) ou de um override por batida.
- **Tinta cheia × lápis:** o foco fica em tinta cheia; o resto, a lápis (apagado pela cor). As placas de unidade se escrevem com linha-guia.

### Setas (`SetaChao`)
- **Corpo e ponta:** o corpo de pena é do perfect-freehand, sobre a trilha **real** das keys. A ponta fica onde a unidade ou o grupo está **na hora do relógio** e passa à frente do bloco.
- **Largura:** ∝ √efetivo.
- **Rastro:** pontilhado que esmaece.
- **Recorte:** a trilha é recortada no campo, para que a marcha que vem de fora do DEM não seja desenhada.
- **Grupos:** setas de armée/korps usam o centroide dos filhos.

### Frentes
`linhas` do tipo frente são reamostradas e interpoladas entre os estados das 12:00 e das 15:00. Têm dentes perpendiculares voltados para o inimigo.

### Gestos presos à palavra
Os tempos de cada palavra estão em `campo/palavras.json`, gerado por `gera_palavras.cjs` com a mesma divisão de frases do `plano_k18.py`. Os gestos são:
- rótulo de lugar que se escreve e depois cai para lápis;
- número que conta, com linha-guia;
- tomada (hachura na cor de quem tomou);
- régua no chão;
- anel e leque de alcance (setor anular);
- rio aceso (só a Bistritz);
- canhões em fila com fogo;
- fumaça, trovão, chuva, ponte, relógio no chão (os 20 min), proporção em blocos (5 : 1);
- olho de Benedek, mensageiro, seta hipotética tracejada ("was wäre").

### Eventos genéricos
Nas batidas com janela de ≥ 30 min, os eventos `tomada`/`baixa` de `unidades.json` viram gesto quando o relógio passa por eles: hachura ou cruz, mais o carimbo "13.00". Ficam desligados onde a batida já tem o gesto próprio.

### Câmera (`campo/camera.ts`)
- **Movimento:** pura de (região, `mov`, u), com dolly contínuo. O push é de 6,5% por frase; há também pull, revela (de cima para o oblíquo), órbita, travelling (o alvo desliza até a ação) e dolly.
- **Inclinação:** 13–40° a partir da vertical.
- **Rumo:** limitado a ±45°, porque o plano de 1866 tem texto e não pode ficar de cabeça para baixo.

### Takes que só este mapa permite
- **b076, o funil do Swiepwald:** 11 brigadas saem da linha prevista Chlum–Nedelist e são sugadas pelo bosque, com "51 Bataillone" e "über 100 Geschütze".
- **b111, a cegueira de Benedek:** o viewshed real do DMR 5G mais a copa do Swiepwald. Os raios de visada a oeste chegam à Bistritz; os do norte são cortados por um traço, e a II. Armee em tinta cheia anda dentro da zona hachurada.
- **b083/b084, "die Höhen im Norden sind jetzt leer":** o vazio hachurado em acento, com a II. Armee entrando nele.
- **b071:** a linha prevista com as Verschanzungen I–V.
- **b013/b067/b153:** as três armadas convergindo, com a folha inteira vista de cima.
- **b133:** a Garde e três colunas do I. Korps a 100 Schritt, com régua.
- **b135:** relógio de 20 min no chão enquanto o I. Korps esvazia.

### Ferramentas (na pasta da frente)
- `stills.mjs`: um bundle e um navegador para vários (beat, u). Use `SERVE=` para reaproveitar o bundle e `ESCALA=` para mudar a escala.
- `tempo.mjs`: mede ms por quadro no `Video`.
- `gera_palavras.cjs`: gera `palavras.json`.

## Batidas cobertas (49/49, todas com receita própria)
b000 b003 b006 b007 b008 b009 b013 b033 b035 b044 b045 b047 b051 b058 b064 b066 b067 b068 b069 b071 b076 b077 b079 b081 b082 b083 b084 b101 b102 b106 b108 b111 b114 b115 b120 b128 b129 b130 b133 b135 b137 b138 b141 b142 b149 b150 b151 b152 b153.

As três de referência, levadas mais longe, são **b000** (gesamt), **b076** (Swiepwald) e **b006** (Chlum). Stills em `D:/tmp/k18_campo/` (`<beat>_<u>.jpg`; folhas `todas_0..2.jpg`).

## Desempenho
Medido em `tempo.mjs` (b076, 1080p, GPU local `--gl=angle`): **0,2–0,7 s por quadro**, mediana 0,29 s, abaixo de 1,5 s.
- A geometria (grades, OSM rasterizado, viewshed) fica em cache de módulo.
- O viewshed custa uma vez por Chrome, e só na b111.

## Pedidos ao maestro e às outras frentes
1. **plano.json:**
   - b009 e b013 têm `h0`/`h1` = "00:00" de placeholder. A cena usa hora própria: b009 = 11:00; b013 = 06:00 → 15:00 em avanço rápido ("Stunde für Stunde").
   - Peço `b009: h0/h1 "11:00"` e `b013: h0 "06:00", h1 "15:00"`, para o relógio do HUD bater com o mapa.
   - A b035 (00:00–00:30) mostra os bivaques. Está coerente como está.
2. **Porta:** a 3101 está ocupada por um `next dev` de outro projeto (`automaweb`). Os stills do campo usaram a **3111**.
3. **tinta/Escrita:** a IM Fell não tem o glifo "¾". Usei "14.45 Uhr" em vez de "2¾ Uhr".
4. **Elba:** o Elba do OSM é o canal regulado do séc. XX (reto). Não o acendo como rio, para não desenhar um rio que não existia em 1866. Fica só o rótulo "Elbe" e as pontes. A Bistritz (Bystřice) do OSM bate com o plano e acende.
5. **Bundle:** o cache do webpack em `node_modules/.cache` é disputado pelas frentes em paralelo.
   - Aparecem os avisos `PackFileCacheStrategy`.
   - Uma vez o `bundle()` não resolveu ("unsettled top-level await"). Bastou rodar de novo.

## Problemas conhecidos
- **Junção das folhas de 1866:** ainda se vê uma linha fina na junção NW/NE e um degrau leve de tom em SW, mesmo com o preenchimento e o ganho por quadrante.
- **Mapa fora da folha:** ainda se veem fracos alguns artefatos modernos do DEM/OSM (açudes e áreas industriais perto de Hradec).
- **Unidades fora do recorte:** as que ainda estão fora do recorte (II. Armee antes das ~11 h, Elbarmee de madrugada) aparecem sobre o papel, além da borda da folha. Lê como "chegando de fora do mapa", mas não há trilha desenhada fora do DEM.
- **Oclusão:** a tinta (SVG) não é ocultada por colinas. Com inclinação ≤ 40° e exagero 4,5×, isso não aparece nos planos testados.
- **Seta de pena:** é SVG sobre pontos do chão projetados (drapeia no relevo), não `ShapeGeometry` no three. Escolhi assim pela nitidez a 1080p e pelo custo.
  - O `split-arrow` do orbat-mapper não entrou.
  - A convergência das 3 armadas sai das trilhas reais de grupo (b013/b067/b153), que mostram a hora de cada uma.
- **Viewshed:** considera só o relevo e o Swiepwald de 1866. Outras matas e aldeias de 1866 não entram como obstáculo.
- **Cortes:** batidas seguidas da mesma região cortam, sem continuidade de câmera.
- **Rótulos:** a colocação usa `seguro()` para fugir das zonas de HUD, mas não há colisão entre rótulos. Em algumas batidas (b006, b076) a placa da unidade encosta no rótulo do lugar.
- **Fonte:** a fonte é IM Fell, mas a `Escrita` ainda é a provisória da frente tinta (revelação por recorte).

## As 3 melhores (beat, u) para o still de vitrine
1. **(b076, 0.95):** o funil do Swiepwald. As brigadas saem da linha prevista e são sugadas pelo bosque, com "51 Bataillone".
2. **(b111, 0.95):** Benedek cego. O viewshed real hachurado, os raios cortados ao norte e a II. Armee dentro da zona que ele não vê.
3. **(b006, 0.95):** Chlum às 14.45. A trilha da 1. Garde-Division sobe a crista, com "Chlum · 336 m" e a hachura azul de "in preußischer Hand".

Alternativa de plano aberto: **(b000, 0.96)**, o campo inteiro às 11 h, com a grande bateria atirando e a Festung Königgrätz.
