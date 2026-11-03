# Rotas baratas para chegar perto da qualidade gráfica do AiTelly (pesquisa de 03/11/2026)

**Para que serve:** registra, como memória de longo prazo, como fechar as lacunas gráficas que sobram depois do plano de qualidade (`docs/plano-qualidade-3d.md`) e do preset de acabamento (`docs/acabamento-threejs.md` §8), sem montar uma equipe de animadores. O Eduardo pediu a pesquisa, e a documentação, depois de ver a lista das 5 lacunas.

**Contexto:**
- O AiTelly tem 7 animadores e 1 roteirista, e modela à mão em Blender (`docs/referencia-aitelly.md`).
- Nós temos agentes, a G4 (RTX PRO 6000, 96 GB) e o motor em tempo real (Remotion + three.js).
- O plano já resolve câmera, cartão, cor e acabamento básico. O que sobra é o **ofício de construir e animar o 3D**.

> **Estado:** pesquisa de fontes (páginas oficiais e guias de 2026). Nada aqui foi testado em render ainda. Cada ferramenta entra primeiro como **candidata** no batedor (`docs/acabamento-threejs.md` §6) e só vira padrão se passar.

---

## 1. As 5 lacunas que sobram (o que o AiTelly tem e nós não)
| # | Lacuna | No AiTelly | Em nós hoje |
|---|---|---|---|
| 1 | **Detalhe do modelo com interior** | centenas de peças modeladas à mão (Gatling: canos, ferrolhos, came, tambor com trilho em espiral, esteiras) | geometria simples por código: poucas peças, sem rebite, painel ou parafuso |
| 2 | **Material e textura** | metal pintado com desgaste, adesivos de aviso, números, logotipo como decalque, sujeira nas bordas | cor chapada saturada por subsistema, sem a camada de "objeto real" |
| 3 | **Animação mecânica e efeitos** | cinemática real (uma peça empurra a outra), aceleração refinada, cápsulas ejetadas, clarão, fumaça, faíscas | animação por fórmula; efeitos em flipbook |
| 4 | **Personagens** | pilotos e operadores com rig e expressão; mão de luva no manche em primeira pessoa | base de brinquedo, sem rosto |
| 5 | **Tipografia e interface** | rótulos condensados e consistentes, letras espaçadas na cena, telas de radar e MFD desenhadas | sem sistema definido; foi a raiz do texto sobreposto do vídeo 14 |

---

## 2. As rotas, por lacuna

### 2.1 Modelo com interior: três rotas complementares, nesta ordem
**a) Pronto e livre (portão 1, "pronto antes de construir"):**
- **Smithsonian Open Access:** mais de 2.000 modelos 3D em **domínio público (CC0)**, inclusive aviões, para download em **glTF/GLB** (padrão adotado com o Khronos).
  - Uso comercial sem crédito.
  - Só os marcados CC0; o resto exige permissão escrita.
- **Sketchfab:** filtrar por CC0 e CC-BY. Com CC-BY, o crédito vai na **descrição** do vídeo, nunca na imagem.
- **Tratamento:** o modelo pronto é recolorido no estilo AiTelly (uma cor por subsistema, §2.2) para não destoar dos modelos nossos.
- ⚠️ **Precisa do OK do Eduardo por caso:** ele vetou modelo baixado nos closes do v14b. No v14b liberou a "Maison lorraine" (CC-BY).

**b) IA imagem → 3D na G4: TRELLIS.2 (Microsoft):**
- **Licença MIT** no código e nos pesos, sem restrição comercial além das dependências (nvdiffrast/nvdiffrec têm licença própria; conferir na instalação).
- Precisa de **≥ 24 GB de GPU** (a G4 tem 96 GB).
- Gera malha com **material PBR em GLB** (cor base, rugosidade, metálico, opacidade) a partir de **uma imagem**.
- **Para corte e vista explodida:** gerar **cada subsistema separado** (estabilizador, timón de profundidad, deriva, atuador) e montar no palco. A malha gerada é superfície, sem interior.
- A imagem de referência pode ser foto ou desenho técnico licenciado, ou imagem gerada.
- **Descartados:**
  - **Hunyuan3D** (Tencent): a licença comunitária exclui **UE, Reino Unido e Coreia do Sul** e tem teto de receita;
  - **PartPacker** (NVIDIA): licença não comercial.

**c) Mecanismo por CAD em código: CadQuery** (Python, exporta **glTF/GLB**):
- Dá o detalhe de engenharia que as primitivas do three.js não dão: filete, chanfro, furação, rosca, engrenagem, conjunto de peças com pivô.
- É ideal para: culatra de cunha do Krupp, agulha do Dreyse, atuador do estabilizador, dobradiças, rodas e bielas, engrenagens do telégrafo.
- **build123d** é a alternativa moderna (mesmo núcleo, OpenCascade). A exportação glTF dele está documentada por ferramentas de terceiros; conferir na doc oficial antes de adotar.
- Peças padrão (parafuso, porca) podem vir de STEP pronto e entrar no conjunto.

**Regra de escolha por objeto:**
1. Existe pronto CC0/CC-BY bom? Pronto + recolorir (com OK).
2. O objeto é mecanismo? CadQuery.
3. É forma orgânica ou casca externa complexa? TRELLIS.2 por peça.
4. Só se nada servir: primitivas no three.js.

### 2.2 Material e textura sem pagar o Substance
- **Material Maker** (MIT): ferramenta de textura procedural por nós, que exporta mapas PBR metal/rugosidade. Serve para criar a nossa biblioteca de metal pintado, metal nu, borracha e lona.
- **Desgaste de borda no three.js:**
  1. máscara de borda/cavidade (por derivada da normal no shader, ou mapas de curvatura e AO assados no Blender sem tela na G4);
  2. multiplicada por ruído, para o desgaste não sair uniforme;
  3. mistura tinta → metal nu (`onBeforeCompile` ou `three-custom-shader-material`).

  É a técnica padrão do Blender, do Unreal e do Substance, adaptada. ~2 h, uma vez.
- **Decalques nossos:** números de painel, faixas de aviso, inscrições técnicas e o selo do canal desenhados em código (SVG → textura) e aplicados com `DecalGeometry`. São nossos, sem questão de licença.
- **Texturas de base:** Poly Haven e ambientCG (CC0), já previstas.

### 2.3 Animação mecânica e efeitos
- **Cinemática por fórmula, com dependência entre peças:** a came empurra o ferrolho, a manivela gira a roda, o atuador inclina o estabilizador. Tudo como função pura de `t` (determinístico no render paralelo da G4).
- **Aceleração refinada:** curvas de easing por peça (entrada e saída) e movimento secundário (pequeno atraso e assentamento). É o que o AiTelly faz no Graph Editor.
- **Partículas: three.quarks** (MIT), sistema de partículas para three.js com sprite-sheet. Serve para faíscas, clarão de disparo, fumaça, poeira e lascas. Conferir a licença das texturas de exemplo antes de reaproveitar.
- **Fumaça e explosões volumétricas:** pacotes gratuitos da JangaFX em **CC0** (já em uso), flipbooks e VDBs.
- **Física (cápsulas ejetadas, pedaços caindo):** simular uma vez fora do render e **assar em keyframes/JSON**, tocando por `t`. Nunca simular ao vivo no render paralelo (o resultado varia entre quadros e máquinas).

### 2.4 Personagens
- **Corpo:** Quaternius (CC0), já usado no `Tropa` do Tracer3D 2.0.
- **Animação: Mixamo** (Adobe): livre para uso comercial em vídeo, sem redistribuir os arquivos brutos. Conferir os termos na página oficial da Adobe antes de cada uso novo, porque guias de 2026 citam que o serviço segue como "prévia".
- **Rosto: não perseguir.** Usar capacete, quepe, ângulo de costas, silhueta e primeira pessoa (mão no manche, mão no telégrafo). É a vantagem da equipe do AiTelly e não compensa para nós.

### 2.5 Tipografia e interface
- **Sistema de tipo**, fontes Google (OFL):
  - **uma condensada** para rótulos e títulos de estágio (ex.: Barlow Condensed ou Oswald);
  - **uma mono** para dado e instrumento (ex.: IBM Plex Mono ou JetBrains Mono).
- **Regras:** tamanhos fixos por papel (rótulo, título, dado), espaçamento de letra largo nos títulos de estágio ("FOURTH STAGE"), cor por função (dado, alerta, contexto).
- **Rótulos sem colisão:** cada rótulo é posicionado em código (espaço livre pela máscara do objeto + checagem de caixas) e nunca encavala. Corrige o F5 da auditoria do v14b.
- **Telas de interface:** radar, MFD, horizonte artificial e vista de sensor como componentes React/SVG reutilizáveis, aplicados como textura na tela da cabine ou sobre a cena.

---

## 3. Custo e ordem
| # | Item | Custo (uma vez) | Ganho |
|---|---|---|---|
| 1 | TRELLIS.2 + CadQuery instalados e testados na G4 | 2–3 h | lacuna 1: o salto maior |
| 2 | Sistema de tipo + rótulos sem colisão + telas de interface | 2–3 h | lacuna 5 (e o F5) |
| 3 | Desgaste de borda + decalques nossos + biblioteca no Material Maker | ~2 h + biblioteca aos poucos | lacuna 2 |
| 4 | Biblioteca de efeitos (three.quarks + física assada) | 3–4 h | lacuna 3 |
| 5 | Personagens (Quaternius + Mixamo, sem rosto) | ~2 h | lacuna 4 |

**Por vídeo, depois:** o modelo explicativo cai de 2–3 h (primitivas) para **1–2 h**, com muito mais detalhe.

**Ordem dentro do plano de qualidade:**
- o item 1 entra no batedor do próximo vídeo (já em teste na parte 3 do Learjet, contra a cauda em T por código);
- o 2 entra junto com o `EsquemaNaCena`;
- o 3 e o 4 depois do preset §8 itens 1–4;
- o 5 quando o DE precisar de soldados e Estado-Maior de perto.

---

## 4. Riscos e cuidados
- **Licença por modelo e por ferramenta**, conferida na fonte oficial antes do uso. O crédito CC-BY vai na descrição.
- **O modelo pronto ou gerado pode destoar:** passa pelo preset de acabamento e pela recoloração antes de entrar. O juiz compara lado a lado com os modelos nossos.
- **TRELLIS.2 não gera interior nem precisão de engenharia:** serve para casca e peças orgânicas. O mecanismo vem do CadQuery.
- **Determinismo:** tudo que se move é função de `t` ou animação assada; nada de simulação ao vivo no render.
- **Material de terceiros** (AiTelly, Reconstructed etc.): nunca. Só referência de método.

## 5. Fontes
- TRELLIS.2 (Microsoft), licença MIT, ≥ 24 GB, saída PBR em GLB: https://github.com/microsoft/TRELLIS.2
- Panorama de geradores 3D abertos em 2026: https://www.cmarix.com/blog/top-open-source-ai-models-for-3d-image-generation/
- Linha do tempo de geração 3D por IA em 2026 (exclusões territoriais do Hunyuan3D): https://app.cinevva.com/guides/ai-3d-model-generation-timeline-2026
- CadQuery, importação e exportação (glTF): https://github.com/CadQuery/cadquery/blob/c44978d60cee2d61bdadf4cb4498286b7034b4c6/doc/importexport.rst
- build123d: https://github.com/gumyr/build123d
- Guia CadQuery e build123d (bd_warehouse): https://docs.printago.io/docs/parts/cadquery/cadquery-intro
- three.quarks (MIT): https://github.com/Alchemist0823/three.quarks/
- Material Maker (MIT): https://github.com/rodzill4/material-maker
- Desgaste de borda procedural (técnica): https://www.strayspark.studio/learn/tutorials/procedural-edge-wear-blender
- Smithsonian 3D CC0: https://3d.si.edu/collections/openaccesshighlights
- Khronos × Smithsonian (glTF): https://www.khronos.org/news/press/khronos-smithsonian-collaborate-to-diffuse-knowledge-for-education-research-and-creative-use
- Mixamo e alternativas (2026): https://app.cinevva.com/guides/free-character-animations-rigging
- FAQ do Mixamo (fórum da Adobe): https://community.adobe.com/t5/mixamo-discussions/mixamo-faq-licensing-royalties-ownership-eula-and-tos/m-p/13234775
