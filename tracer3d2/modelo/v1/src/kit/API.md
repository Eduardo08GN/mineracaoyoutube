# Kit do Tracer3D 2.0: índice para o planejador

Uma batida vira cena do kit escrevendo em `src/cenas/<familia>.json`:
```json
{"04_07": {"comp": "Formel", "props": {...}}}
```
Ordem do sequenciador: cena do kit > componente próprio (`beats/`) > cartão provisório.
Todo tempo nas props aceita segundos locais ou âncora na fala: `{"wort": "Granate", "nach": 0, "plus": 0.2}`.

| Família | Cenas | API |
|---|---|---|
| ui (cartões 2D) | Titel, Liste, Hinweis, Formel, Balken, Vergleich, Zahl, Kurve, Zeitleiste, Foto, Zitat (+ `deko` em todas) | `ui/API.md` |
| karten (mapas) | Karte, KarteDetail, KarteWelt; ~20 tipos de camada; modelos `_vorlagen` | `karten/API.md` |
| epoca (imagem de época 2.5D) | Gemaelde (pintura/gravura/foto com paralaxe, fumaça/poeira/chuva, rótulo, manchete; mapa/carta sem profundidade = Ken Burns). `dono: "epoca"` | `kit/epoca/API.md` |
| welt (3D) | Bahn, Globus, Flug, Modell (modelos registrados por vídeo em `welt/modelos.tsx`) | `welt/API.md` |
| acabamento (camada opcional de acabamento 3D, 3 níveis de custo) | `<BildAcab nivel="leve\|medio\|heroi" clima="nublado\|entardecer\|inverno">`, `<Acabamento>`, `materialPBR('lama')`, `<SoldadosRig>`, `<Arvores>`, `<Fumaca>`; assets em `public/acabamento` (`<raiz>/assets\copiar.py <projeto>`) | `<raiz>/ACABAMENTO.md` |

## Quando ainda é preciso agente de código
- Modelo 3D novo: registrar em `welt/modelos.tsx` e usar via `Modell`.
- Terreno de outra região: pacote de relevo e satélite em `public/`.
- Dados geográficos novos: frentes, rotas.
- Efeitos fora do catálogo: corte do forte, fratura, fogo em flipbook.
- Geometria 2D muito específica: dá para aproximar com `deko`.

## Validação (24/10/2026, Bertha como banco de teste)
71 batidas reproduzidas só a partir de JSON (29 ui, 22 karten, 20 welt). O capítulo 6 inteiro foi renderizado pelo kit: diferença média de 1,6/255 por quadro em relação ao vídeo entregue e nenhum flicker.
