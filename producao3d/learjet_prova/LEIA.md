# Cena-prova do Learjet (teardown / three.js r186)

Referência viva da stack 3D descrita em `docs/stack-producao-3d.md`.

| Arquivo | Função |
|---|---|
| `film.js` | Tomadas (câmera, clima, poses), timeline GSAP de turbulência, HUD (2 e 5 números), linhas de velocidade e `render(t)` puro. |
| `stage.js` | Renderer ACES, HDRIs (fundo e reflexo), luz-chave + contorno, névoa por clima, N8AO, bloom, correção de cor, SMAA. |
| `world.js` | Avião: GLTF do Sketchfab com a receita de material, ou o modelo por código (reprovado). Profundor-peça, cidade OSM+NAIP, fumaça, rota ADS-B. |
| `adsb.js` | Trilha ADS-B pública do voo, em metros locais, com altitude, descida, velocidade e rumo. |
| `prep.mjs` | Preparo dos modelos na G4 (gltf-transform): enxuga o avião, junta a cidade e monta o chão NAIP. |
| `g4_prova.py` | Orquestrador: sobe tudo para a G4, builda e captura os quadros e o filme, e baixa o resultado. |
| `learjet60.js`, `kit3d.js` | Avião construído por código (registro do caminho reprovado). O `kit3d.js` é MIT, do pacote scottstts. |

**Assets** (não versionados; ficam no D: e na G4):
- Learjet 45 do Sketchfab (CC-BY 4.0, KarimFatatry; o crédito vai na descrição);
- HDRIs do Poly Haven (CC0);
- NAIP (domínio público) e OSM2World (ODbL).
