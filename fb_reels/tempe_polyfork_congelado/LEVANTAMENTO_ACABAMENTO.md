# Levantamento de prontos: acabamento (reel enchente noturna, low-poly, Remotion+R3F)
Data: 08/11/2026. Dados de gh/npm. Nada instalado. Stack: three 0.180, R3F 9, postprocessing 6.39 (peer three <0.188 OK), drei 10.7.9.

## TOP 3
1. **three-gpu-pathtracer 0.0.24** (gkjohnson, MIT, 2.0k*, ativo 08/11/2026). Fixar 0.0.24: peer three>=0.180. As 0.0.25+ exigem >=0.185 (incompatível com 0.180). Como o quadro é quase estático: acumule N amostras por quadro e salve (GI real, sombra macia, contraluz, DoF físico). Tempo por quadro NÃO medido; precisa batedor na G4 (alvo: 256-512 spp por quadro, 1080x1920). Demo: gkjohnson.github.io/three-gpu-pathtracer. Decisão: BATEDOR 1 (still, depois 10 quadros de push).
2. **drei AccumulativeShadows + ContactShadows + SoftShadows** (pmndrs/drei, MIT, 10k*, 21/10/2026, 10.7.9 compatível R3F 9). Rota barata de GI suave/sombra de contato, roda no render do Remotion sem custo. Demo: drei.docs.pmnd.rs. Decisão: USAR já como base; o pathtracer só se faltar.
3. **@takram/three-atmosphere 0.19.1 + @takram/three-clouds 0.7.6** (three-geospatial, MIT, 1.8k*, 05/2026). Céu noturno/atmosfera/nuvens volumétricas; peers R3F>=9, postprocessing>=6.36.7, three>=0.170 (compatível). Demo: takram-design-engineering.github.io/three-geospatial. Decisão: BATEDOR para céu (testar noite/luar; pode ser pesado e realista demais para low-poly).

## 1. Água
| Item | URL | Licença | Atividade | Compat. | Demo | Decisão |
|---|---|---|---|---|---|---|
| three WaterMesh/Water/Water2 (examples/jsm/objects) | github.com/mrdoob/three.js | MIT | 118k*, 08/11/2026 | sim (Water.js clássico em WebGL; Water2Mesh e WaterMesh podem ser WebGPU/TSL: conferir) | sim, examples | Water2 (normal + flowmap) como base de enchente; escurecer, deslocar normal, cor turva |
| norio/three-stylized-water | github.com/norio/three-stylized-water | MIT | 80*, 16/08/2026 | WebGPU+TSL (WebGPU disponível na G4; precisa three com TSL, 0.180 ok) | norio.github.io/three-stylized-water | MELHOR candidato a água estilizada com espuma/costa; batedor |
| boona13/threejs-grass-water-shaders | github.com/boona13/threejs-grass-water-shaders | MIT | 15*, 05/2026 | WebGL, a verificar | a verificar | referência de shader apenas |
| drei MeshReflectorMaterial | pmndrs/drei | MIT | ativo | sim | sim | só reflexo de lâmina rasa; combinar com normal map animado |
| Espuma por profundidade | sem lib madura achada | | | | | técnica: depth texture + smoothstep (já em norio e nos exemplos three); não construir sem batedor |
| Chuva/respingo | Ashwyn28/weather-effects (MIT, 0*, 11/2026) | MIT | 0 estrelas | não confiável | | descartar; chuva = Points/instanced simples, risco baixo |
| jbouny/ocean | github.com/jbouny/ocean | MIT | 2017 | morto | | descartar |
Flowmap: Water2 já inclui; sem pacote maduro separado encontrado.

## 2. GI / sombra
| Item | Licença | Atividade | Compat. | Demo | Decisão |
|---|---|---|---|---|---|
| three-gpu-pathtracer | MIT | 08/11/2026 | 0.0.24 ok | sim | topo 1 |
| realism-effects (0beqz, SSGI/TRAA) | MIT | último push 02/2024, npm 05/2023 | peer postprocessing>=6.30 e three>=0.148, mas código parado: risco com three 0.180 | realism-effects-obeqz.vercel.app | batedor só se o pathtracer for lento; baixa prioridade |
| n8ao (N8python, CC0, 504*, 08/2026, v2.0.1) | CC0 | ativo | sim | sim | já usado, manter |
| drei AccumulativeShadows/SoftShadows/ContactShadows | MIT | ativo | sim | sim | topo 2 |
| Lightmap bake | via pathtracer (xatlas-web é peer opcional) | | | | só se quiser estático barato; batedor depois |

## 3. Céu
- @takram/three-atmosphere e three-clouds: ver topo 3.
- drei Sky / Cloud / Clouds (MIT): leve, estilizado, bom para low-poly; usar como fallback e para nuvens flat.
- three examples Sky.js/SkyMesh.js: dia; para noite usar estrelas + lua.

## 4. Pós "ilustração"
| Item | URL | Licença | Atividade | Compat. | Decisão |
|---|---|---|---|---|---|
| pmndrs/postprocessing 6.39.6 (LUT3DEffect, DepthOfField, Noise, Vignette, Outline, ToneMapping) | github.com/pmndrs/postprocessing | Zlib | 2.9k*, 01/11/2026 | sim (<0.188) | base: LUT + DoF + Noise (grain) |
| @react-three/postprocessing 3.2.2 | pmndrs | MIT | 21/10/2026 | sim (R3F>=9.7) | usar wrappers |
| three-good-godrays 0.12.2 (Ameobea) | github.com/Ameobea/three-good-godrays | "Other"/NOASSERTION (licença não padrão: LER antes de usar) | 236*, 05/11/2026 | peer three <0.188, postprocessing ^6.33.4: ok | demo three-good-godrays.ameo.design; batedor para contraluz, checar licença |
| Outline (pmndrs Outline/SelectiveBloom) | | Zlib | | sim | só se o estilo pedir contorno |
| OmarShehata/webgl-outlines | MIT | 2022 | parado | | descartar |

## Plano de batedor (ordem)
1. Pathtracer 0.0.24: 1 still do cenário, medir segundos por quadro em 256/512 spp na G4.
2. Rota barata em paralelo: AccumulativeShadows + n8ao + LUT + DoF + grain + godrays.
3. Água: Water2 com normais turvas vs norio/three-stylized-water (WebGPU).
4. Céu: drei Sky/estrelas vs takram.
Comparar lado a lado com o reel No Sleep (scenario.com) antes de mostrar.
Obs.: licença/estrelas lidas via API do GitHub e npm; demos não abertas/renderizadas nesta passada.
