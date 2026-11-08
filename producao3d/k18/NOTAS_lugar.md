# NOTAS da frente `lugar` (K18 Königgrätz)

06/11/2026. Cobre **13 batidas**, cerca de 68 s, todas com cena real. `npx tsc --noEmit -p .` passa sem erro da família. As cenas foram verificadas em stills (0,5x) na porta 3104, em `D:/tmp/k18_lugar/`. A folha de contato está em `folha_0.jpg` e `folha_1.jpg`.

## O que foi feito

São mini-cenas 3D em **ilustração estilizada no creme**:
- o relevo é **real** (DMR 5G de `DADOS.campo`), desenhado como gravura;
- o chão é papel tingido, com retalhos de lavoura em textura de buril, curvas de nível a lápis, hachura nas encostas de sombra e mata do OSM em pontilhado;
- a névoa e o céu viram papel, e o céu leva uma hachura horizontal fina;
- as bordas do recorte se dissolvem no papel;
- os objetos são toon de 3 tons, com contorno de nanquim em espaço de tela;
- a tinta é sempre o kit comum (`Escrita`, `Rotulo`, `Traco`, `Numero`, `Bloco`), presa às palavras de `voz/alinhamento.json`.

A câmera é função pura de `u` (dolly contínuo), e o mundo é função do tempo do vídeo.

| Batida | fase | O que se vê / o que explica |
|---|---|---|
| b073 | swiepwald_dentro | **A mata em corte.** Perto do foco ficam só os tocos; longe, as copas fechadas. A vista de um grupo austríaco vira uma estrela clara no chão, com raios que param no primeiro tronco, calculados contra os troncos da cena ("so weit reicht der Blick"). Em "Kanonen", o tiro da peça na orla morre num tronco (X laranja). Em "Mann gegen Mann", os prussianos surgem e fecham a distância dentro da estrela. |
| b103 | zwei_baeume | **As duas tílias de perto, depois a subida para o alto.** O rumo tracejado das colunas de Jericek (Garde), Zizelowes (1. Garde-Div.) e Racitz (11. Div.) converge nas árvores, com blocos Brockhaus azuis que andam no rumo. Em "von weitem", a linha do Kronprinz de Chotěborek conta **6,2 km**. Na tela: "weithin sichtbar". |
| b104 | zwei_baeume_heute | **Mesmo enquadramento do início da b103.** Em "heute", uma linha de tinta varre a tela: atrás dela fica hoje (sem tropa, sem fumaça, uma estela genérica). Escreve-se "die Linden von Horenowes". Não afirma que são as mesmas árvores (crítica, item 15). |
| b116 | chlum_kirche | **A aldeia e a igreja na crista.** Em "höchsten Punkt", uma **cota sobe pelo relevo real** e cobre tudo de aguada e hachura. A última ilha (topo de 337,75 m no DEM) é Chlum: ganha anel laranja e o rótulo "höchster Punkt". Em "österreichischen Zentrums", blocos vermelhos em Chlum e Lipa. |
| b117 | chlum_blick | **Da torre (POV) para o alto.** A **linha de visada real** (DEM, olho a ~30 m na torre) se espalha em anel. O que se vê fica claro, o que o relevo esconde fica com hachura cruzada ("verdeckt"). Os nomes surgem quando o anel passa por eles. |
| b123 | batterie | As 8 peças chegam rebocadas, desatrelam e viram para o norte. Em "acht Geschütze", os números 1 a 8 aparecem sobre as peças (o 8 em laranja). A Garde sobe a encosta; a seta vermelha marca "entgegen". |
| b124 | kartaetsche | **Um movimento só.** Começa do alto, atrás da bateria, com o cone de dispersão desenhado no chão até a Garde e a cota contando **200 Schritt**. Desce até o lado da boca da peça 4, onde a 2ª carga sai em câmera lenta: a lata ("Kartätsche: Büchse voll Kugeln") abre e as balas se espalham em cone, com o cone de perfil a tinta. Fecha com "wie eine riesige Schrotflinte". |
| b125 | ueberrannt | De lado: a onda azul atravessa a linha das peças, e o bloco "Batterie" esvazia em hachura (`perda`). |
| b126 | batterie_zahlen | **De cima.** Cruz no comandante ("Groeben, Kommandant"). Strichliste a tinta de **52 Mann** e **58 Pferde** ("tot oder verwundet"). Em "sieben der acht", 7 peças ganham anel azul e "7 von 8 genommen"; a 8ª é puxada para o sul ("1 entkommt", GSW). |
| b127 | denkmal | Hoje, o monumento (1896) no mesmo lugar, com as 8 posições tracejadas a lápis no chão em volta e "Batterie der Toten" escrito. |
| b143 | festung | Planície real do Elba e do Adler, com os rios do OSM. A fortaleza abaluartada surge à frente da estrada da retirada (blocos vermelhos andando, "Rückzug"). "Festung Königgrätz" se escreve. |
| b144 | festung_wasser | "Tore geschlossen", com barra laranja no portão. A água **sobe pelas cotas reais** do Vorfeld; só o dique da estrada fica seco, e a coluna se amontoa nele. |
| b145 | festung_tore | Noite (aguada sépia leve), "23 Uhr". O portão abre e a multidão escoa em fila pela ponte. |

## Arquivos (todos em `src/cenas/lugar/`, exceto o despacho em `src/cenas/lugar.tsx`)

| Arquivo | Papel |
|---|---|
| `base.ts` | utilidades puras: hash, dolly, `pl`, `curva3`; `pal(beat, prefixo)` dá o tempo da palavra |
| `falas.ts` | palavras de cada batida em segundos do vídeo. **É gerado** por `D:/tmp/k18_lugar/falas.py`; não editar à mão |
| `estilo.ts` | paleta creme 3D, toon e contorno (copiados e adaptados do K17 v2, `kit/desenhados/estilo.tsx`) |
| `relevo.ts` | amostragem do DEM, recorte local em metros, linha de visada |
| `terreno.tsx` | shader do chão ilustrado, com camadas opcionais: `vis` (visada), `cota` (nível que sobe), `agua` (alagamento, com dique e raio interno), `tom` e `mata` (OSM) |
| `palco.tsx` | ThreeCanvas + câmera pela pose + névoa de papel + céu de hachura + `GraoPapel` do kit + folha de tinta |
| `pecas.ts` | peças feitas por código, em metros: canhão de bronze (carreta, tubo exagerado 30 %), armão, cavalo, figuras (Garde, artilheiro austríaco, infantaria austríaca), árvore, tília, mato, toco, casa, igreja, muro, monumento, estela |
| `inst.tsx` | instâncias toon + contorno |
| `fumaca.tsx` | fumaça de pólvora ilustrada, sem estado |
| `tinta_extra.tsx` | `Riscos` (Strichliste), `Linha3D`, `projetaL`, `anel`, `Cruz`, `Halo`; tudo montado só com o kit comum |
| `batterie.tsx`, `chlum.tsx`, `swiep.tsx`, `baeume.tsx`, `festung.tsx` | as cenas |
| `teste/entrada.tsx` | **só depuração**: renderiza N (beat, u) num único bundle |

Comando da entrada de depuração:
```
npx remotion render src/cenas/lugar/teste/entrada.tsx Lugar <pasta> --sequence --props='{"lista":[["b124",0.35],["b073",0.85]]}' --scale=0.5 --port=3104 --gl=angle
```
Com o prop opcional `cams`, uma pose fixa entra no lugar da câmera da batalha, via `globalThis.__camLugar` (só lido em `batterie.tsx`).

## Prontos, licenças e créditos

- **Reaproveitado (copiado e adaptado):**
  - o estilo toon + contorno do K17 v2;
  - o padrão de câmera pura e o patch `KHR_parallel_shader_compile` do What If ES 08;
  - o kit de tinta comum.
- **Dados, já creditados na descrição pelo projeto:**
  - DMR 5G (ČÚZK, CC BY 4.0);
  - OpenStreetMap (ODbL): mata, rios Elbe e Adler, lugares de `dados/lugares.json`.
- **Fab e Sketchfab não usados, de propósito:**
  - os candidatos do `LEVANTAMENTO_PRONTOS.md` (igreja St. Wenceslas, M1857 Napoleon, Andywoodhead e outros) exigem aceitar licença na conta Fab, ou decimar modelos de 130 a 820 mil faces;
  - além disso, trazer arquivos para `public/` está fora do limite desta frente;
  - as peças foram feitas por código, com proporção real, pelo método do telégrafo do K15. No plano médio e aberto do creme, elas leem melhor que fotogrametria posterizada.
  - **Nenhum asset novo, logo nenhuma linha nova de crédito.**
- **Números na tela, todos do dossiê ou da crítica:**
  - 8 peças, 200 Schritt, 52 Mann, 58 Pferde, 7 von 8 e 1 entkommt (GSW, §4.5 e §6);
  - Denkmal 1896 (§5);
  - 6,2 km Chotěborek → Horenowes (crítica, cálculo);
  - 23 Uhr (GSW).
  - 200 Schritt ≈ 150 m só na geometria, nunca escrito. O "höchster Punkt" é medido no DEM e não tem número na tela.

## Problemas conhecidos / abertos

1. **Custo por quadro.** Medi aqui cerca de **2,3 s/quadro** a 1080p (`--concurrency=1`, ANGLE, máquina local; 20 quadros da b123 em 46 s, descontado o bundle). Está acima da meta de 1,5 s. **Medir na G4.** Se precisar cortar:
   - grade do relevo: a b117 usa 300², a b116 300×250;
   - a casca de contorno nas instâncias de mato e tocos;
   - o `GraoPapel`.
2. **b117 × narração.** A visada real mostra que de Chlum **não** se vê o vale do Swiepwald nem a dobra ao norte (o "verdeckt"). A frase diz "das ganze Schlachtfeld". Isso combina com a frase seguinte do capítulo (a Garde chega "gedeckt von einer Falte im Gelände") e com o dossiê §3.3.5, mas o maestro deve confirmar que quer essa nuance. Se não quiser, basta tirar o rótulo "verdeckt" em `chlum.tsx`.
3. **Visada de terreno nu.** O DMR 5G é terreno nu: mata, casas e fumaça não entram na conta. A mata do OSM é a de hoje (o dossiê avisa que pode diferir de 1866).
4. **Fortaleza estilizada.** Tem 8 bastiões, raio de 430 m e portão a noroeste. É traçado ilustrativo, não levantamento: a fortaleza foi desmontada depois de 1884. Na b143–b145, as figuras estão em escala 6x para ler a 1 km.
5. **Igreja de Chlum genérica** (nave, presbitério, torre oeste com coruchéu). A aldeia é posta por hash, não pelo OSM.
6. **O monumento e a estela de hoje** são desenhos genéricos, sem a forma real.
7. **Fontes.** O pacote tegaki da IM Fell não tem "ř" nem "ě", por isso usei só os nomes alemães ("die Linden von Horenowes", nunca "Hořiněveské lípy").
8. **A b123 é o enquadramento mais fraco** do bloco da bateria: as peças ficam pequenas no terço de baixo. Melhoraria com uma câmera mais baixa ao longo da linha.
9. **Interferência entre frentes.** Builds simultâneos de várias frentes colidem no cache do webpack (`ENOTEMPTY`); basta rodar de novo. Erros de `tsc` de outras frentes (por exemplo `campo/receitas2`) aparecem de vez em quando e não são desta família.

## Pedidos ao maestro / às outras frentes

- Nenhum parâmetro novo no `plano.json`.
- As cenas não desenham relógio nem legenda. O nome do lugar fica para o HUD global, no canto superior direito.
- O "23 Uhr" da b145 fica no alto, ao centro (x 960, y 150), fora das zonas do HUD. Se o relógio global também mostrar 23:00, pode-se tirar o da cena.

## As 3 melhores (beat, u) para o still de vitrine

1. **b073, u = 0.85**: a mata em corte com a estrela da vista, o tiro morto no tronco e "Mann gegen Mann".
2. **b103, u = 0.6**: os rumos das colunas convergindo nas duas árvores, com 6,2 km do Kronprinz.
3. **b144, u = 0.85**: a fortaleza com portão fechado, o Vorfeld alagado e a coluna presa no dique.

Reservas: **b124, u = 0.35** (o cone da Kartätsche com 200 Schritt até a Garde), **b116, u = 0.92** (a cota que deixa só o topo de Chlum) e **b126, u = 0.92** (Strichliste 52 / 58 e 7 von 8).
