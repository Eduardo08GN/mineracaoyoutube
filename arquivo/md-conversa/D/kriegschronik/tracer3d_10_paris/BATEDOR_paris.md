# Batedor: Tracer3D 10, "Die Belagerung von Paris, 19.9.1870 – 28.1.1871 — Woche für Woche" (31/10/2026)

Rotina: [BATEDOR.md](D:/mineracaoyoutube/docs/whatif-es/BATEDOR.md). Batedor **curto, só dos elementos novos**. **Não repetido** (já adotado): BATEDOR_koeniggraetz/gewehr/sedan, ACABAMENTO (HDRI/PBR, `Tropa`, `Heer`, flipbooks, setas/kessel, Gemaelde 2.5D), BADPATHS. Partiu do vídeo 6 (`k6_paris_szenen`, pacote `paris_anel`, `forts_1870.geojson`, balão).
Stack travada (Remotion 4.0.537, three 0.180, R3F 9.8.2). **Nada instalado**; `v1/node_modules` (junction) intocado. **G4 não usada**: stills locais por `renderStill` com WebGL por software (swangle), 1920×1080 × 2/3 = **1280×720**, renderizando os **componentes de produção** (`k10_*.tsx`). Custo na L4 não medido (local: 6–12 s por still depois do bundle).

**Folha:** `render/FOLHA_batedor_paris.jpg` (16 quadros). Stills em `D:\kriegschronik\batedor_tmp\paris\out\`; runner `batedor_tmp\paris\prova\` (`entry.tsx`, `run.mjs`, `j*.json`, `folha.py`). Nenhum servidor aberto; processos iniciados por mim (downloader, tiefe, node) terminaram sozinhos.
**API:** [`v1/src/welt/K10_API.md`](v1/src/welt/K10_API.md). `npx tsc --noEmit`: **zero erros nos arquivos novos** (os 6 erros que restam já existiam na cópia do vídeo 9).

## 1. Tabela

| Elemento | Hoje | Feito / candidato | Licença | Prova (still) | Decisão |
|---|---|---|---|---|---|
| **1a. `paris_anel` `hell`** | 0,9 (escuro) | `mat.hell` → **1,8** em `cenas/pacotes.json`; o `Terra` do k10 usa o mesmo fator | — | `f_anel*` (relevo ×2,5: Sena, Mont-Valérien, Meudon/Châtillon, Montmorency legíveis) | **Adotar**. O `Flug` do kit com 1,8 **não** foi renderizado (só o `Terra` k10) |
| **1b. Satélite "1870"** | metrópole inteira cinza/marrom | `geo_scripts/paris_1870_sat.py`: fora da muralha, pixel que não é mata/água → mosaico de lavoura de inverno (parcelas 140–260 × 380–680 m, orientação por bloco de 2,5 km, + textura alto-passa do satélite); **60 povoados de 1870** (círculos ca.), mata, parques, Sena/Marne (corredor OSM + pixels escuros) ficam; dentro da muralha leve dessaturação. → `geo/paris_1870_satellit.jpg` + pacote novo **`paris_1870`** | CC BY 4.0 (EOX) + ODbL | quadros 1–2 da folha (antes/depois); `f_anel` | **Adotar** (barato: 1 min em Python, zero custo de render). Aeroportos/autoestradas somem; sobram linhas de vias como "estradas" |
| **1c. `paris_1870.geojson`** | só fortes (15) | Enceinte (33,4 km ≈ real 33 km; Portes + 120 m), **16 fortes** (+ Fort neuf de Vincennes, com nº de baluartes), 14 lugares (Versailles QG, Châtillon, Le Bourget, Champigny, Villiers, Buzenval, Saint-Cloud, Saint-Denis, Montmartre, Mont Avron…), **anel de cerco 77 km** (fortes + ~3 km, suavizado) em 2 setores (III. Armee S/O, Maas-Armee N/L) | CC0/ODbL | overlay em `f_anel*`, `b_route*` | **Adotar**; tudo **ca.** (conferir fronteira dos setores e Württemberger com `fakten.md`) |
| **2a. Forte bastionado procedural** | caixa pentagonal (v6) | `bastioniert()` (baluarte em cada vértice: flanco/ombro/saliente) + `loft()` de perfil típico (terrapleno, parapeito, escarpa 10 m, fosso 15 m, contraescarpa, caminho coberto, esplanada até o DEM); 3 materiais (grama/lama PBR + alvenaria lisa), quartéis com telhado; 1 malha por material | código nosso | `f_fort_vanves` (~400 m), `f_anel` (16 fortes ×2,2 lêem como estrelas) | **Adotar** no aéreo; close = **Testar** (lê como maquete limpa) |
| **2b. Muralha bastionada (94)** | — | mesma técnica no polígono reamostrado (94 baluartes), base pela média local do DEM | código nosso | `f_anel` (contorno claro bom); `f_mauer` (close **fraco**) | **Adotar** no aéreo/mapa; close = **Fora** por ora (usar Gemaelde: Cuisin "Bastion 68", Benassit, Chazal) |
| **3a. Balão de gás 1870** | `Ballon` do v6 | **Sketchfab** (API, CC-BY/CC0; "gas balloon", "victorian/hydrogen/19th century balloon", "aerostat", "montgolfier", "siege of paris balloon"): **nenhum** balão de gás do séc. XIX (só ar quente moderno, "steampunk"). → `Ballon1870` procedural melhorado: percal envernizado (clearcoat/sheen), **rede em losango pintada + 3D**, válvula, apêndice aberto, aro de carga, 8 tirantes em tubo, **cesto de vime retangular**, lastro, sacos de correio, gaiola de pombos, **cabo-guia** | código nosso | `b_aufstieg_unten` (bom), `b_aufstieg_t7` | **Adotar** |
| **3b. Subida sobre a cidade ao amanhecer** | — | `BallonAufstieg` (medio, `entardecer`), `Stadt`: ~5 000 casas instanciadas em quadras (2 draw calls) | código nosso | `b_aufstieg_t7` (bom), `b_aufstieg_t2` (médio) | **Adotar** `orbit`/`unten`; cidade = **Testar** (caixas claras de perto) |
| **3c. Trajetória tracejada sobre o mapa** | — | `BallonRoute`: overlay com rota (contorno escuro + traço dourado) crescendo, balão ×150 a ~2 km, rótulo "über dem Belagerungsring" | código nosso | `b_route_t6` | **Adotar** (rota ca.; sai pela borda do pacote) |
| **4. Canhão de cerco Krupp** | `KruppC64` (v6) | **Serve como stand-in** (sem modelo novo): `Feldgeschuetz art="krupp"` ×1,7, rótulo "Krupp-Hinterlader (schematisch)"; bateria de 6 peças em parapeitos com neve, fumaça/clarão CC0, **arcos de 6,5 km** até 6 alvos da margem esquerda, impacto escuro | kit (procedural) + Unity Labs CC0 | `k_bahn_t14` (bom), `k_batterie_t9`, `k_nah_t6` (fracos) | **Adotar** `bahn`; `batterie`/`nah` = **Testar** (peça de campanha azul, chão de neve chapado) |
| **5. Contador semanal (3 números)** | `zaehler.tsx` (2 lados, por `STAENDE`) | `src/zaehler_paris.tsx` + `src/tage_paris.json`: Belagerer · Verteidiger · **Brotration** (opcional; `null` → "frei"), semana fracionária corre; campo `woche` no plano | código nosso | `z_woche3`, `z_woche18` | **Adotar**; trocar a série BEISPIEL pelos dados de `fakten.md` |
| **6. Imagens de época** | 25 de 1866 (herdadas) | herdadas **movidas** para `D:\tmp\fotos_v9_old` (+ 76 tiefe `k9_*`); `geo/baixar_fotos.py` (Special:FilePath?width=1920, 15 s de pausa): **41 baixadas**, 2 nomes não achados; `tiefe.py` → **37 com profundidade** (os 4 planos/mapas ficam fora por regra); `epoca_indice.py` rodado | PD / CC0 / CC BY 2.0 (2) | quadro 16 da folha | **Adotar** |

## 2. Receitas curtas
**A. Satélite "voltado a 1870" (qualquer cidade do pacote):** copiar `paris_1870_sat.py`, trocar polígono de núcleo (aqui a Enceinte), lista `DOERFER` (lugar, raio m) e rios; o limiar `veg` (verde domina) preserva mata/parques. Pacote novo = cópia da entrada com `farbe` trocada.
**B. Fortificação bastionada:** `bastioniert(poly, f, e, g)` → `loft(traço, PERFIL, base, chao, escala)` (grupos por material; faces verticais com material liso, o PBR de chão projeta em xz e vira listras). Forte = `polyRegular(n, 150)`; muralha = `reamostra(MAUER, 94)`.
**C. Overlay no terreno:** `zeichneOverlay(g, 2048, 2048, {ring, sektoren, mauer, route, routeU})` em `OV_BOX` 48 × 48 km; **`ov.tex.flipY = false`** (sem isso o anel saiu espelhado norte-sul na 1ª prova — mesma armadilha do v9).
**D. Arcos de artilharia visíveis a 7 km:** esfera ≥ 30 m e tubo ≥ 10 m com `AdditiveBlending`, `toneMapped={false}`, `fog={false}` (com 5 m e opacidade 0,55 sumiram).
**E. Contador:** batida com `"woche": 16.5` → corre entre as semanas 16 e 17; `"zaehler": false` esconde.

## 3. Assets
| Asset | Fonte | Licença |
|---|---|---|
| `v1/public/geo/paris_1870_satellit.jpg` (novo) | derivado de EOxCloudless 2017 + OSM | CC BY 4.0 + ODbL |
| `v1/public/geo/paris_1870.geojson`, `geo/paris_1870.geojson`, `v1/src/welt/k10_geo.json` | Wikidata/OSM/construção própria | CC0/ODbL |
| `v1/public/geo/fotos/k10_*.jpg` (41) + `tiefe/k10_*` (37) | Commons (por imagem em `fotos.json`); Depth Anything V2 (Apache-2.0) | PD/CC0/CC BY 2.0 |
| Balão, fortes, muralha, cidade, bateria | procedurais | — |
Linha de crédito pronta em `geo/CREDITOS.md`. Nenhum modelo do Sketchfab baixado (token lido só por código na busca; nada gravado).

## 4. O que ficou fraco (honesto)
- **Close da muralha** (`kamera="mauer"`): perfil baixo e fino, terreno borrado (satélite 12 m/px) — usar pintura/foto de época.
- **Close de forte**: geometria certa, mas limpa demais (sem canhões, sem neve, sem gente); chão em volta borrado. Bom para ~400 m+.
- **Bateria `batterie`/`nah`**: o C/64 é peça de campanha (8 cm, reparo azul) — como stand-in passa no plano geral, não em close; chão de neve chapado; Paris quase invisível na névoa a 6,5 km.
- **Cidade instanciada**: caixas claras de perto (`b_aufstieg_t2`); funciona em movimento/de cima; no `bahn` foi tirada (o satélite lê melhor).
- **Satélite 1870**: mosaico regular demais em close; linhas de autoestrada viram "estradas"; povoados são círculos.
- Não provei o `Flug` do kit com `hell` 1,8 nem o pacote `paris_1870` dentro do `Flug` (só o `Terra` próprio do k10).
- Tudo posicional é **ca.** (anel 77 km vs. ~80 km citados; fronteira dos setores; alvos); contador com **números de exemplo**.
- Determinismo: tudo função de `t`/props (hash fixo); MD5 de repetição **não** testado.

## Decisão do maestro (a preencher)
**Aprovado pelo maestro (31/10/2026, 02:15):**
- Adotar `Festungsring` (`anel`; `fort` só a ≥ 400 m), `BallonAufstieg` (`orbit`/`unten`), `BallonRoute`, `Beschiessung` (`bahn`) e satélite 1870 (`paris_1870`).
- `ZaehlerParis` adotado com a série real (fakten §2) e dois campos novos: `ration` (texto "In Paris") e `tote` (óbitos por semana com o ano anterior, aparece a partir da 1ª batida com `"tote": true`, cap. 10). O `plano.py` repassa `woche` e `tote`.
- **Closes de muralha, forte e peça: Gemaelde**, nunca `kamera="mauer"`, `batterie` ou `nah`.
