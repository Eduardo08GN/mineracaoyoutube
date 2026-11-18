# Levantamento: kit de estilo por código (reels de notícia/acidente) - 08/11

Método: ~85 buscas `gh search repos` (risograph, halftone, paper cutout, toon/outline, ink, hatching, stop-motion, tilt-shift, npr, kuwahara, comic, cel, dither, remotion+three), `npm view`, `gh api` (licença/estrelas/push conferidos hoje), WebSearch para assets, leitura de README/árvore dos candidatos. Nada foi rodado ou renderizado: **"roda em R3F/Remotion headless" abaixo é inferido do README/stack, não provado.**

Lacunas: grep.app bloqueou o acesso automático (Vercel checkpoint); Shadertoy e mcpmarket não reconsultados (ver `levantamento_mcpmarket_0811.md`); Poly Pizza, Polyfork, Sketchfab, Fab, AccuRIG e Mixamo não verificados nesta rodada. Não achei o demo "Claude goes to the moon".

## Combinação recomendada (menos código próprio)

Nenhum pacote entrega os 6 estilos. Duas trilhas prontas; escolher pelo batedor.

**Trilha 3D (personagem + cenário reaproveitados, Claude escreve JSON):**
1. **Personagem-kit:** Quaternius **Universal Base Characters + Universal Animation Library 1/2** (CC0, 6 corpos, 1 rig humanoide, 130+ ações: andar, correr, cair, morrer, sentar, nadar). Troca de pessoa = trocar malha; as ações são compartilhadas. Alternativa: KayKit (CC0, Rig_Medium, 133 ações).
2. **Acabamento:** **sloemo01/diorama** (MIT, 353 estrelas, push 07/11): playbook + kit three.js com look "stroked toon" (contorno de tinta + paleta travada), pixel e dither, elenco animado em escala de brinquedo, QA por entidade. Por cima, tilt-shift de **ybouane/tiltshift-in-html** (MIT, usa depth buffer, plano Scheimpflug) ou `TiltShiftEffect` do pmndrs/postprocessing. Contorno de apoio: drei `Outlines`/`Edges` ou `OutlineEffect` do three.
3. **Cenário:** **KayKit City Builder Bits** (CC0: prédios, ruas, semáforos, carros, parque, árvores) + **Kenney City Kit Roads/Suburban/Commercial/Industrial** (CC0, glTF). Rio/mar/hospital: sem kit coerente achado.

**Trilha papel (2.5D, chega mais rápido a um look coerente):** **0xS4N4TG/papercut-explainer** (MIT, 168 estrelas, push 17/10): biblioteca Remotion de recorte de papel com 24 backdrops 1080x1920, 17 movimentos de câmera (inclui TiltShift, RackFocus, parallax), 10 transições, camadas de filme, 79 SFX, 8 músicas e 9 skills (estratégia, roteiro, storyboard, build, QA). Cobre "recorte de papel + diorama/tilt-shift" quase sem código nosso.

Palpite: começar pelo **papercut-explainer** (já é Remotion e já tem intenção de estilo) e testar a Trilha 3D só se o Eduardo quiser 3D real de acidente (objeto em corte).

Avisos antes de adotar:
- papercut: **16 dos 24 backdrops são gerados por IA de imagem** (THIRD_PARTY.md). Usar só os 8 desenhados em código (`backdrops-src/`) ou redesenhar. O personagem base é um `Critter` caixa (trocar). Testado em macOS; Windows só via WSL. O custo de ~US$14-19 por reel é do fluxo de skills deles, não precisamos dele.
- **Remotion tem licença própria** (grátis para indivíduos/pequenas equipes); conferir enquadramento.
- Contorno em low-poly só resolve o "rascunho" se paleta, materiais e luz forem travados (o diorama faz isso; Quaternius cru não).

## Tabela por estilo

R3F = React Three Fiber; Rem = Remotion headless (provavelmente precisa de `--gl=angle`/GPU; validar).

### Risografia (halftone 2-3 tintas)
| Pacote | Entrega | Licença | Estrelas / push | R3F / Rem | Veredito |
|---|---|---|---|---|---|
| sevenevesai/riso-windowseat | filmes riso procedurais em Canvas 2D + kit de skills, docs de ofício, harness de render | MIT | 309 / 28-10-26 | Canvas 2D; Rem via canvas | TESTAR (melhor receita riso por código) |
| three `HalftonePass`/`HalftoneShader` | halftone de pontos pronto | MIT | three 118k / 08-11-26 | R3F via three-stdlib; Rem sim | USAR como base; 2 tintas = ajustar paleta |
| pmndrs `DotScreenEffect` | pontos em tela | Zlib | 2,9k / 01-11-26 | R3F via @react-three/postprocessing | USAR (halftone simples) |
| antiboredom/p5.riso | separação de tintas riso em p5 | "other" (conferir) | 373 / 03-11-26 | p5/canvas | TESTAR só como referência de misregistration |
| Robpayot/risograph-grain-shader | grão riso (Codrops) | MIT | 80 / 2022 | R3F fácil | TESTAR (só grão) |
| robertvklinken/halftone.gl | halftone+ASCII de ícones 3D | sem licença | 3 / 22-10 | WebGL | IGNORAR |
| YIAN6557/eian-riso-broll | skill: roteiro para animações riso 2 cores | **não comercial** | 365 / 19-10 | GSAP/HTML | IGNORAR (proíbe canal monetizado); só ideia de paleta |
| yanliudesign/mono-color-skill | skill de imagem estática 1-2 tintas | MIT | 3,6k / 02-09 | estático | IGNORAR; paletas como ideia |

### Recorte de papel (camadas, sombra, borda irregular)
| Pacote | Entrega | Licença | Estrelas / push | R3F / Rem | Veredito |
|---|---|---|---|---|---|
| 0xS4N4TG/papercut-explainer | kit Remotion completo (ver topo) | MIT (+ Remotion) | 168 / 17-10-26 | **Remotion nativo** | **TESTAR primeiro** |
| pissang/papercut-box-art | caixa de luz de recorte em camadas | MIT | 116 / 2018 | three antigo | IGNORAR; ideia de sombra entre camadas |
| ssalentin/kritzel | desenho vira diorama de papel 3D | sem licença | 1 / 21-10 | three | IGNORAR |

### Traço de tinta + dois tons / hachura
| Pacote | Entrega | Licença | Estrelas / push | R3F / Rem | Veredito |
|---|---|---|---|---|---|
| sloemo01/diorama (look "stroked toon") | contorno de tinta + paleta travada, elenco animado | MIT | 353 / 07-11-26 | three + playwright (já captura mp4) | **TESTAR** |
| three `OutlineEffect`/`OutlinePass`, drei `Outlines`/`Edges`, `MeshToonMaterial` + `gradientMap` | contorno por casco invertido/normais, 2 tons | MIT | drei 10,1k / 21-10-26 | R3F sim; Rem sim | **USAR** |
| three TSL `OutlineNode`, `SobelOperatorNode` | contorno por pós em WebGPU | MIT | - | R3F WebGPU experimental | TESTAR (WebGPU já provado na G4) |
| spite/sketch | cross-hatching/gravura em three | MIT | 334 / 02-08-26 | three/WebGL2 | USAR como fonte de shader de hachura |
| mayacoda/toon-shader | toon three (degraus de luz, rim) | MIT | 83 / 2022 | three; portar p/ R3F | TESTAR (referência curta) |
| mayacoda/pencil-lines | pós de linhas de lápis | MIT | 51 / 2022 | three | TESTAR (hachura de lápis) |
| dotslashsimran/simcraft `perspective-illusion` | skill: linha de tinta + 2 tons + sombra hachurada, renderer GPU com motion blur | **sem licença** | 135 / 08-11-26 | three + playwright | só IDEIA |
| AxiomeCG/awesome-threejs (CC0), scottstts/Threejs-Awesome-Graphics-Agent-Skills (MIT, 978) | listas / skills | - | ~1k | - | consulta |

### Massinha (stop-motion)
| Pacote | Entrega | Licença | Estrelas / push | R3F / Rem | Veredito |
|---|---|---|---|---|---|
| markldn/shaun-claymation | curta de 2 min: bonecos de massa por primitivas, texturas procedurais de digital/ferramenta, poses em "twos" (12/s) com "boil" de superfície e flicker de exposição; render por puppeteer | MIT (código; personagens Shaun são IP alheia, não usar) | 0 / 26-09-26 | three puro; headless via tools/render.mjs | **TESTAR** (única receita de massinha achada) |
| Truque barato | animar o Quaternius em 12 fps (twos) + jitter leve de vértice + normal map de digital | - | - | R3F/Rem | USAR |
| claymation-restaurant, CryptoClayFactory, clay shaders Unity | cenas isoladas ou Unity | n/d | 0 | - | IGNORAR |

### Diorama em miniatura (tilt-shift)
| Pacote | Entrega | Licença | Estrelas / push | R3F / Rem | Veredito |
|---|---|---|---|---|---|
| ybouane/tiltshift-in-html | tilt-shift por depth buffer, plano inclinado, bokeh de primeiro plano; demo com 18 dioramas | MIT | 28 / 23-08-26 | three (plugável em R3F) | **USAR/TESTAR** |
| pmndrs `TiltShiftEffect` | tilt-shift em faixa | Zlib | 2,9k / 01-11-26 | R3F sim | USAR (mais simples) |
| three `Horizontal/VerticalTiltShiftShader` | shader básico | MIT | - | R3F via three-stdlib | fallback |
| educlopez/diorama | 4 skills (SVG, Worlds three com halftone/blueprint, pixel, dither) | MIT | 16 / 03-11-26 | three/SVG | TESTAR (Worlds com halftone) |
| sloemo01/diorama | ver acima | MIT | 353 | three | TESTAR |
| JDhruv14/ascii-diorama | miniatura tilt-shift em ASCII | MIT | 95 / 02-11-26 | three | IGNORAR (look ASCII); câmera como ideia |

### Quadrinho (comic)
| Pacote | Entrega | Licença | Estrelas / push | R3F / Rem | Veredito |
|---|---|---|---|---|---|
| Montagem: three `HalftoneShader` + `OutlineEffect` + `MeshToonMaterial` | halftone nas sombras + contorno grosso | MIT | - | R3F/Rem | USAR (3 peças prontas) |
| niccolofanton/dithering-shader | dither Bayer em R3F + Leva | MIT | 294 / 20-09-26 | **R3F** | TESTAR (look "impresso") |
| andreumassanet/planeteer | mundo em quadrinho tintado | MIT | 7 / 05-11 | three | só referência |
| include-steve-kx/GLSL-comic-book-shader | shader GLSL de capa | sem licença | 2 | WebGL | IGNORAR |

### Pacotes transversais (npm)
| Pacote | Entrega | Licença | Versão / data | Veredito |
|---|---|---|---|---|
| three | `MeshToonMaterial`, OutlineEffect, HalftonePass, tilt-shift, TSL display nodes | MIT | 0.187.0 / 30-10-26 | USAR |
| postprocessing (pmndrs) | ASCII, DotScreen, Outline, TiltShift, Pixelation, Sepia, Noise, LUT3D, DoF, SSAO | Zlib | 6.39.6 / 01-11-26 | USAR |
| @react-three/postprocessing | wrapper R3F | MIT | 3.2.2 / 21-10-26 | USAR |
| @react-three/drei | `Outlines`, `Edges`, `ContactShadows`, `AccumulativeShadows`, `Cloud`, `Sparkles` | MIT | 10.7.9 / 25-09-26 | USAR |
| three-stdlib | exemplos do three sem transpilar | MIT | 2.36.1 / 11-2025 | USAR |
| @remotion/three + remotion-dev/template-three | R3F dentro do Remotion | MIT (Remotion: licença própria) | 4.0.541 / 05-11-26; template 118 estrelas | **USAR** |
| three-custom-shader-material | estende material PBR com GLSL próprio | MIT | 6.4.0 / 10-2025 | TESTAR (toon/hachura sem reescrever material) |
| BinhL3/what-if-video-skill | skill Remotion+R3F "What if" vertical | sem licença | 3 / 15-10 | só ideia |

## Assets de personagem e cenário
| Asset | Entrega | Licença | Veredito |
|---|---|---|---|
| Quaternius Universal Base Characters | 6 humanos, rig humanoide, .blend na versão Source | CC0 | **USAR** |
| Quaternius Universal Animation Library 1 e 2 | 130+ ações num rig só | CC0 (tiers Pro/Source podem ser pagos; conferir) | **USAR** |
| Quaternius Modular Character Outfits | roupas modulares compatíveis com UAL | CC0 | TESTAR (roupa civil moderna pode faltar) |
| KayKit Character Animations + Adventurers/Skeletons | 133 ações; personagens chunky de fantasia | CC0 | TESTAR (estilo fantasia, pouco jornalístico) |
| Kenney Mini Characters | pequenos, com animação | CC0 | TESTAR (miniatura; usar glTF: o guia de importação deles apagou animação do FBX segundo comentário) |
| KayKit City Builder Bits | cidade low-poly completa | CC0 | **USAR** |
| Kenney City Kit Roads/Suburban/Commercial/Industrial, Building Kit | cidade em glTF | CC0 | **USAR** |
| Mixamo, AccuRIG 2.0, Poly Pizza, Polyfork, Sketchfab CC0, Fab grátis | não verificados | n/v | pendente (Poly Pizza hospeda o City Builder Bits; Mixamo: termos não confirmados) |

## Método e ideias (não código)
- Codrops 2026: "Still: From Akira to Ink Wash" (tinta em WebGPU), "Beyond the Luminance Ramp" (ASCII com forma), "The Ink Whale" (outline), tutorial de jitter PS1 em R3F: fontes de técnica.
- `sloemo01/diorama` documenta portões de QA por entidade; `papercut-explainer` usa um `CATALOG.md` para o agente não ler o kit inteiro (economia de token que podemos copiar).
- simcraft `perspective-illusion` (ilustração 3D com contorno e 2 tons) e `vox-explainer` (cartões de papel rasgado): só ideia, repositório sem licença.

## Próximo passo (batedor curto)
1. Clonar papercut-explainer em `D:/`, renderizar o `hello-reel` com Remotion headless na G4 (provar `--gl=angle`).
2. Montar 1 still da Trilha 3D: Quaternius UBC + 1 ação UAL, `MeshToonMaterial` com `gradientMap` de 2 tons, `Outlines`, tilt-shift do pmndrs, cenário KayKit. Comparar com o still do papercut e mostrar ao Eduardo.
