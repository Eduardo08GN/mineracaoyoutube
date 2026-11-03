# Pipeline de acabamento do motor three.js (levantamento de 03/11/2026)

**Para que serve:** guia de longo prazo para o acabamento visual (luz, sombra, céu, oclusão, câmera e cor) dos dois motores 3D em tempo real que renderizam na G4:
- **Tracer3D 2.0:** Remotion + React Three Fiber, canal DE;
- **kit "maquete":** Remotion + three.js puro, canal ES.

**Como se encaixa no princípio de produção** (`docs/principio-producao-multidimensional.md`):
- O acabamento é o **4º investimento**, depois do roteiro, do desenho da informação e da animação. Ele não salva take repetido, câmera parada nem número em cartão.
- O critério de cada camada abaixo é sempre "**isso ajuda o espectador a entender?**", nunca "isso parece real?".
- O alvo é o desenho barato e bem resolvido, não o ultrarrealismo.

**Regra de origem:** "pronto antes de construir". Antes de escrever shader, material ou efeito à mão, procurar biblioteca mantida e conferir:
1. versão;
2. licença;
3. data da última publicação;
4. faixa de `three` aceita (peer dependency);
5. se funciona com o motor (R3F ou three.js puro);
6. se é determinística no Remotion.

Este documento faz isso para as camadas de acabamento.

> **Estado:** levantamento de fontes (npm registry + GitHub API, 03/11/2026). **Nenhuma biblioteca nova foi testada em render ainda.** As marcadas "candidata" só entram depois do batedor da §6.

---

## 1. O que já existe (não refazer)

### 1.1 Tracer3D 2.0 (canal DE): R3F
**Dependências fixadas:**
- `three` 0.180.0;
- `@react-three/fiber` 9.8.2;
- `@react-three/drei` 10.7.9;
- `@react-three/postprocessing` 3.2.1;
- `postprocessing` 6.39.5;
- `n8ao` 2.0.1;
- `@takram/three-atmosphere` 0.19.1 e `@takram/three-geospatial` 0.9.1;
- `@dgreenheck/ez-tree` 1.1.0 e `@dgreenheck/three-pinata` 2.0.1;
- `remotion` 4.0.537.

**Compositor próprio (`look/Look`), montado de forma síncrona.** O `EffectComposer` do R3F demora alguns ciclos para ficar pronto e o Remotion captura antes. A ordem:
1. saneamento do buffer HDR (NaN/Inf);
2. N8AO;
3. god rays;
4. bloom só acima do limiar;
5. tone mapping AgX;
6. LUT 3D de época;
7. saturação e contraste;
8. vinheta.

**Camada `kit/acabamento`, em 3 níveis com custo medido na G4:**
| Nível | Onde | O que liga | Custo medido por batida |
|---|---|---|---|
| `leve` | toda cena 3D | pós: AgX, LUT de época, grão, vinheta, bloom só em emissivos | −1% a +4% |
| `medio` | cenas externas inéditas | `leve` + N8AO, névoa de perspectiva aérea, céu HDRI com IBL e sol no azimute da cena, detalhe PBR no chão | −2% a +15% |
| `heroi` | ≤ ~6 batidas por vídeo | `medio` + god rays, soldados com esqueleto (LOD), árvores EZ-Tree, fumaça em flipbook com a luz do clima | +8% a +23% |

**Já resolvido:**
- banding do céu: a causa era `wrapS`, não 8 bits;
- N8AO instável em cena com `far` enorme: usar `ao={false}`;
- texturas suspendem o canvas até carregar;
- render paralelo determinístico: sem estado entre quadros.

### 1.2 Kit "maquete" (canal ES): three.js puro
- Compositor próprio com N8AO + bloom + tonemapping (`neutral` nos looks novos).
- **Acumulação Halton de N amostras por quadro** (antialiasing, disco do sol, DOF). É determinístico: o mesmo quadro sempre gera o mesmo MD5.
- Céu 2.0:
  - nuvem volumétrica por raymarch, com pré-passe de profundidade;
  - céu físico (Preetham) como IBL;
  - céus de foto 4k com o sol girado para o azimute da cena.

> **Achado importante:** como o kit "maquete" **já soma N amostras por quadro**, três efeitos caros em outros motores saem quase de graça dentro do mesmo laço:
> - sombra suave (sortear a direção do sol dentro do disco a cada amostra);
> - motion blur (sortear o instante dentro do obturador a cada amostra);
> - DOF.
>
> É o caminho mais barato e mais determinístico que existe para os dois. Ver §3.3 e §3.6.

### 1.3 O que falta (o buraco do acabamento)
| Camada | Hoje | Lacuna |
|---|---|---|
| Estilo do objeto | modelo cinza ou PBR pela metade | **contorno + toon**: a receita do "desenho bem feito" |
| Sombra | shadow map padrão, borda dura; sol rasante apaga o terreno | **sombra suave e sombra de contato** ancorando o objeto no chão |
| Oclusão / luz indireta | N8AO | GTAO como alternativa; luz indireta só em plano-herói |
| Nuvem no R3F | HDRI de foto | nuvem volumétrica pronta (Takram) |
| Câmera | DOF só no "maquete"; sem motion blur | **motion blur** nos movimentos rápidos; DOF no Tracer3D 2.0 |
| Cor | AgX / neutral + LUT | ok; falta régua medida (§6) |

---

## 2. Princípios técnicos do acabamento no Remotion (valem para qualquer biblioteca)
1. **Nada temporal entre quadros.** O Remotion renderiza quadros fora de ordem e em ~24 Chromes paralelos na G4. Efeito que acumula "ao longo do tempo" (TAA temporal, sombras temporais, path tracer progressivo entre quadros) quebra o determinismo e pisca. Toda acumulação acontece **dentro do quadro**, com N amostras e semente fixa.
2. **Tudo é função pura de `t` e da semente.** Sem `Math.random()`, sem relógio.
3. **Compositor síncrono**, montado no mesmo ciclo do render (lição do `Look`).
4. **Esperar carregamento:** textura, HDRI e modelo suspendem o quadro (`delayRender`) até estarem prontos; senão o primeiro quadro sai preto.
5. **Buffer HDR saneado** antes de bloom e AO: um NaN vira quadro preto inteiro na G4.
6. **Custo medido por batida na G4**, contra a referência `nivel="off"`. Alvos: leve ≤ +10%, médio ≤ +35%, herói ≤ +100%.
7. **Cuidado com `three`:** cada biblioteca aceita uma faixa de versão (§5). Atualizar o `three` só com a matriz conferida.

---

## 3. O pipeline, camada por camada (na ordem do render)

### 3.1 Estilo do objeto: o "desenho bem feito"
**Objetivo:** objeto barato e bonito, como o avião do Short de referência:
- poucos polígonos;
- **contorno escuro**;
- 2–3 tons chapados;
- traço identificador exagerado;
- ancorado no chão.

| Opção | Pacote | Licença | Motor | Status |
|---|---|---|---|---|
| Contorno por casca invertida (inverted hull): cópia da malha com `side: BackSide`, escalada pela normal, cor escura | código próprio de ~20 linhas | — | R3F e puro | **recomendado** (o mais barato, uma draw call a mais por objeto, determinístico) |
| `<Outlines>` (casca invertida pronta) | `@react-three/drei` 10.7.9 (já instalado) | MIT | R3F | candidato |
| `Outlines` versão sem React | `@pmndrs/vanilla` 1.25.0 | MIT | puro | candidato |
| Contorno em pós (bordas por profundidade/normal) | `OutlineEffect` do `postprocessing` 6.39 | Zlib | os dois | candidato para objetos selecionados (destaque explicativo) |
| `OutlineEffect` do three (examples/jsm/effects) | `three` | MIT | os dois | alternativa (desenha a cena 2×) |
| Sombreamento em faixas | `MeshToonMaterial` + `gradientMap` de 3–4 texels (`NearestFilter`) | MIT (three) | os dois | **recomendado** |
| Material custom sobre o padrão (toon + PBR leve) | `three-custom-shader-material` 6.4.0 | MIT | os dois | candidato, se o toon puro ficar pobre |

**Paleta por canal:**
- **DE:** traço e paleta de **gravura do século XIX animada**:
  - azul prussiano × vermelho garance;
  - ferro escuro, latão, madeira;
  - contorno sépia escuro em vez de preto puro.
- **ES:** **infográfico de aviação**:
  - objeto branco/cinza claro, contorno grafite;
  - cor só no dado (verde sobe, vermelho desce, escala do radar).

**Regras:**
- Contorno em **unidades de tela** (espessura constante no quadro), não em metros, senão some de longe.
- Nunca close macro de modelo simples; plano médio.
- Modelo baixado (fotogrametria/PBR) passa pelo mesmo tratamento ou não divide quadro com os desenhados.

### 3.2 Materiais e texturas
- Já em uso: Poly Haven (CC0), com detalhe PBR no chão em coordenadas de mundo (`kit/acabamento/chao`).
- **Candidato:** ambientCG (CC0) para variedade de chão, madeira e metal.
- **Regra:** no estilo desenho, textura PBR só no **chão e no terreno**. Nos objetos, cor chapada (§3.1).

### 3.3 Luz e céu
| Opção | Pacote | Licença | Motor | Status |
|---|---|---|---|---|
| Céu HDRI de foto com IBL e sol girado para o azimute da cena | Poly Haven + código próprio | CC0 | os dois | **em uso** |
| Atmosfera física (céu, luz do sol e perspectiva aérea coerentes com a hora e o lugar) | `@takram/three-atmosphere` 0.19.1 (já instalado no Tracer3D 2.0) | MIT | R3F e puro (`postprocessing` ≥ 6.36.7) | **candidato forte**: um sol no lugar e na hora certos (Sedan, 1º/9/1870, 05:00) dá a luz da cena sem ajuste à mão |
| Nuvens volumétricas | `@takram/three-clouds` 0.7.6 | MIT | os dois (three ≥ 0.170, postprocessing ≥ 6.36.7) | **candidato** para o R3F; no "maquete", comparar com o Céu 2.0 próprio antes de trocar |
| Céu físico simples | `Sky` do three (Preetham) | MIT | os dois | em uso no "maquete" |

**Regra:** **uma fonte de verdade para o sol.** Azimute e elevação vêm da cena (hora e lugar), e céu, sombra, god rays e névoa leem o mesmo valor. Se o sol do céu não bate com a sombra, o olho percebe na hora.

### 3.4 Sombras
| Opção | Pacote | Licença | Motor | Determinismo | Status |
|---|---|---|---|---|---|
| Sombra suave por **acumulação dentro do quadro**, sorteando a direção do sol dentro do disco a cada amostra Halton | código próprio no laço de acumulação do "maquete" | — | puro | total | **recomendado no ES** (custo ≈ zero a mais, o laço já existe) |
| `AccumulativeShadows` + `RandomizedLight` (catcher plano que acumula N renders de sombra) | `@react-three/drei` 10.7.9 / `@pmndrs/vanilla` 1.25.0 | MIT | os dois | com `temporal={false}` (padrão) acumula **tudo no mesmo quadro**: determinístico, mas custa `frames` renders de sombra por quadro se algo se move | candidato para **cena estática** (diorama, mesa do Estado-Maior); medir |
| PCSS (sombra de contato mais dura e penumbra que abre com a distância) | `SoftShadows` do drei / `pcss` do `@pmndrs/vanilla` | MIT | os dois | total | **candidato forte no DE** (barato, um passe) |
| Sombra de contato (blur da projeção de cima no chão) | `ContactShadows` do drei | MIT | R3F | total | candidato para objeto pequeno sobre chão liso |
| VSM / PCFSoft nativos | `three` (`shadowMap.type`) | MIT | os dois | total | base atual; trocar o tipo é custo zero |
| Mapa de luz progressivo | `ProgressiveLightMap` (three examples/misc) | MIT | puro | precisa assar antes, por cena estática | reserva |

**Regras:**
- **Todo objeto toca o chão com sombra de contato ou linha tracejada.** É o que tira a cara de maquete e o "objeto no vazio" reprovado no batedor do vídeo 14.
- **Sol rasante:** cascata de shadow map ou elevação mínima do clima (`elevLuz`), para não apagar o terreno inteiro.
- **Terreno de 40 km:** sombra só no raio da ação (frustum de sombra apertado na câmera); fora disso, oclusão e névoa fazem o trabalho.

### 3.5 Oclusão e luz indireta
| Opção | Pacote | Licença | Status / risco |
|---|---|---|---|
| N8AO | `n8ao` 2.0.1 | ISC | **em uso**. Desligar em cena com `far` enorme |
| GTAO | `GTAOPass` do three (examples/jsm/postprocessing) | MIT | alternativa ao N8AO para cena grande; medir |
| SSGI / SSR / TRAA / motion blur por velocidade | `realism-effects` 1.1.2 | MIT | **risco alto:** última publicação no npm em 05/2023, repositório parado desde 02/2024, 32 issues abertas; testado em three 0.148+, não em 0.180. Só testar num batedor isolado; não depender |
| SSR legado | `screen-space-reflections` 2.5.0 | MIT | **descartado** (parado desde 2022) |
| Path tracing (luz global de verdade, quase Blender, em three.js) | `three-gpu-pathtracer` + `three-mesh-bvh` 0.9.18 | MIT | **candidato só para plano-herói** (1–3 por vídeo, cena estática). A versão **0.0.24 aceita three ≥ 0.180** (a nossa); a 0.0.25+ exige three ≥ 0.185 e a 0.0.28 exige ≥ 0.187. Determinismo: N amostras **dentro do quadro**, nunca progressivo entre quadros. Custo alto por quadro: medir contra o Cycles |

**Regra:** luz indireta cara só onde o espectador olha o objeto por vários segundos e a luz ajuda a ler a forma. No take de diagramação (painel + mapa + objeto pequeno) ela não aparece.

### 3.6 Atmosfera e volumes
| Opção | Pacote | Licença | Status |
|---|---|---|---|
| Névoa de perspectiva aérea na cor do clima | código próprio (`kit/acabamento`) | — | **em uso** |
| God rays por marcha de raio contra o shadow map (feixes que respeitam a geometria) | `three-good-godrays` 0.12.1 | permissiva estilo zlib, com crédito ao código original de N8python | **candidato**. Aceita **three ≤ 0.182** e `postprocessing` ^6.33.4: trava a atualização do three acima de 0.182 |
| God rays de disco (pós-processo) | `GodRaysEffect` do `postprocessing` | Zlib | **em uso** no `heroi` |
| Fumaça, poeira e fogo | flipbooks Unity Labs (CC0) | CC0 | **em uso** |

### 3.7 Câmera: antialiasing, DOF e motion blur
| Efeito | Opção recomendada | Alternativas | Observação |
|---|---|---|---|
| Antialiasing | **acumulação Halton** (maquete); MSAA 4× + `SMAAEffect` (Tracer3D 2.0) | — | já resolvido nos dois |
| DOF | **acumulação** (lente sorteada por amostra) no maquete; `DepthOfFieldEffect` / `TiltShiftEffect` do `postprocessing` no R3F | `BokehPass` do three | DOF raso só em close de objeto ou de detalhe explicativo; nunca no take de painel |
| **Motion blur** | **acumulação de subquadros dentro do quadro** (instante sorteado no obturador de 180° a cada amostra): determinístico e reaproveita o laço do maquete. No R3F, renderizar K subinstantes num alvo float e tirar a média | `<CameraMotionBlur>` (`@remotion/motion-blur` 4.0.540, MIT): renderiza `samples` cópias do conteúdo com instantes deslocados. Ótimo para **camadas 2D** (painel, setas); para 3D cria K contextos WebGL e custa K× | é a "imperfeição de câmera" que tira a cara de jogo nos movimentos rápidos; aplicar só nos movimentos rápidos |

### 3.8 Cor e grão (fim da cadeia)
- **Em uso:**
  - tone mapping **AgX** no DE e **Neutral** no ES (cor mais viva);
  - LUT 3D de época (DE);
  - saturação e contraste;
  - vinheta;
  - grão de película (DE).
- **Regra medida** (do batedor do vídeo 14):
  - luminância mediana ≥ 100 (0–255) nos planos abertos;
  - colorfulness na faixa da referência;
  - os **acentos de facção preservados**: dessaturar o mundo, não o azul e o vermelho que contam a história.

---

## 4. Presets por canal (ponto de partida para o batedor)

### 4.1 DE: "gravura animada"
| Camada | Preset |
|---|---|
| Objeto | casca invertida (sépia escuro, ~1,5 px em 1080p) + `MeshToonMaterial` de 3 tons em cor de facção ou de material |
| Chão | relevo Copernicus + ortofoto/satélite com detalhe PBR leve (já existe) |
| Luz | sol pela hora e lugar da batalha (atmosfera Takram) ou clima do `kit/acabamento` |
| Sombra | PCSS (`SoftShadows`) + sombra de contato em cada objeto |
| Oclusão | N8AO (desligado com `far` enorme) |
| Atmosfera | névoa na cor do clima; fumaça de pólvora em flipbook |
| Câmera | dolly contínuo; motion blur só em movimento rápido |
| Cor | AgX + LUT de época + grão + vinheta; acentos de facção preservados |

### 4.2 ES: "infográfico de aviação"
| Camada | Preset |
|---|---|
| Objeto | avião/trem branco ou cinza claro, contorno grafite, toon de 2–3 tons; atitude exagerada para leitura |
| Chão | relevo + ortofoto/satélite real do local; prédios OSM em tom neutro |
| Luz e céu | Céu 2.0 próprio (nuvem volumétrica) ou Takram clouds se ganhar no batedor; o sol é uma fonte de verdade só |
| Sombra | **sol sorteado no disco dentro da acumulação Halton** (suave e grátis) + linha tracejada até o chão |
| Volumes | cortina de radar translúcida com rótulo 3D preso (ver §4 do princípio) |
| Câmera | acumulação: AA + DOF + **motion blur por subquadro** |
| Cor | Neutral; cor só no dado (verde sobe, vermelho desce, escala do radar) |

---

## 5. Matriz de compatibilidade (03/11/2026)
| Pacote | Última versão | Publicada | Licença | `three` aceito | `postprocessing` aceito | Situação |
|---|---|---|---|---|---|---|
| `three` | 0.180.0 (fixado) | — | MIT | — | — | base dos dois motores |
| `postprocessing` | 6.39.6 | 2026-11-01 | Zlib | ≥ 0.168 < **0.188** | — | em uso (6.39.5) |
| `n8ao` | 2.0.1 | 2026-08-10 | ISC | ≥ 0.137 | ≥ 6.30 | em uso |
| `@react-three/drei` | 10.7.9 | 2026-09-25 | MIT | ≥ 0.159 | — | instalado (Tracer3D 2.0) |
| `@pmndrs/vanilla` | 1.25.0 | 2025-09-17 | MIT | ≥ 0.137 | — | candidato (maquete): `pcss`, `AccumulativeShadows`, `Outlines`, `Cloud` |
| `@react-three/postprocessing` | 3.2.2 | 2026-10-21 | MIT | ≥ 0.156 | ^6.36 | instalado (3.2.1) |
| `@takram/three-atmosphere` | 0.19.1 | 2026-05-06 | MIT | ≥ 0.170 | ≥ 6.36.7 | instalado |
| `@takram/three-clouds` | 0.7.6 | 2026-05-06 | MIT | ≥ 0.170 | ≥ 6.36.7 | candidato |
| `three-good-godrays` | 0.12.1 | 2026-08-06 | permissiva (zlib-like) | ≥ 0.125 ≤ **0.182** | ^6.33.4 | candidato; **trava o three em ≤ 0.182** |
| `three-gpu-pathtracer` | 0.0.28 | 2026-11-02 | MIT | ≥ **0.187** (a **0.0.24** aceita ≥ 0.180) | — | candidato só plano-herói; usar 0.0.24 enquanto o three for 0.180 |
| `three-mesh-bvh` | 0.9.18 | 2026-11-03 | MIT | ≥ 0.159 | — | dependência do path tracer |
| `three-custom-shader-material` | 6.4.0 | 2025-10-12 | MIT | ≥ 0.159 | — | candidato |
| `realism-effects` | 1.1.2 | 2023-05-12 | MIT | ≥ 0.148 | ≥ 6.30.1 | **risco** (sem manutenção) |
| `screen-space-reflections` | 2.5.0 | 2022-08-11 | MIT | ≥ 0.141 | ≥ 6.28 | descartado |
| `@remotion/motion-blur` | 4.0.540 | 2026-11-02 | MIT (pacote; Remotion tem licença comercial própria) | — | — | candidato para camadas 2D |
| `@dgreenheck/ez-tree` | 1.1.0 | 2026-01-15 | MIT | ≥ 0.167 | — | em uso |

**Conflito a lembrar:** atualizar o `three` para ≥ 0.185 (path tracer novo) **quebra** o `three-good-godrays` (≤ 0.182). Escolher um dos dois ou ficar no 0.180 com o path tracer 0.0.24.

---

## 6. Batedor de validação (antes de qualquer pacote novo entrar no kit)
**Cena-padrão por canal**, sempre a mesma, para comparar:
- **DE:** diorama do trem na estação + o canhão em plano médio no terreno de Sedan;
- **ES:** jato em descida ao lado da cortina de radar, mais um plano baixo sobre o bairro.

**Matriz:** 1 coluna por camada ligada, acumulando: off → estilo desenho → sombra → céu/atmosfera → oclusão → câmera → cor.

**Medidas por coluna:**
1. **custo na G4:** segundos de parede da batida, contra `off`, e ms por quadro;
2. **régua de imagem:** luminância p10/p50/p90, contraste, colorfulness, detalhe (Sobel p90), comparadas com a referência do canal;
3. **determinismo:** o mesmo quadro renderizado 2× tem o mesmo MD5;
4. **juiz separado:** nota de 0 a 10 aos stills contra a referência; entra só o que leva o conjunto a **≥ 8,5**;
5. **folha lado a lado:** referência | atual | com a camada.

**Critério de entrada:** o ganho aparece **no tamanho em que o objeto vai estar na tela** e cabe no alvo de custo (§2.6). Se só aparece em close ampliado, não entra.

**Ordem sugerida** (do mais barato e de maior ganho para o mais caro):
1. contorno + toon;
2. sombra suave (PCSS no DE, sol no disco no ES) + sombra de contato;
3. motion blur por subquadro;
4. atmosfera Takram com o sol pela hora e lugar;
5. Takram clouds × Céu 2.0;
6. GTAO × N8AO;
7. good-godrays;
8. path tracer em 1 plano-herói.

---

## 7. Como manter este documento
- Toda biblioteca nova de acabamento entra primeiro na matriz (§5), com versão, licença, data e faixa de `three`, e só depois no batedor (§6).
- Resultado de batedor (custo, régua, nota do juiz) é anotado na linha do pacote, com a data.
- Pacote aprovado sai de "candidato" para "em uso" e ganha a camada e o preset do canal (§3–§4).
- Créditos de licença que exigem atribuição vão na descrição do vídeo, nunca na imagem (regra do canal DE).

---

## 8. Preset "explicação AiTelly" e ordem de subida do acabamento (03/11/2026)
**Decisão do Eduardo:** em todo trecho de **explicação** dos dois canais vale a direção de arte do AiTelly (`docs/plano-qualidade-3d.md` §2a).

**Pela leitura dos 10 vídeos** (`docs/referencia-aitelly.md` §5), a aparência deles é:
- material **limpo e saturado** (não toon) sob **luz de estúdio suave**;
- reflexo leve no metal pintado;
- sombra macia ancorando o objeto;
- AO nas junções;
- bloom só no emissivo;
- palco com chão escuro que reflete;
- DOF raso no close;
- motion blur no rápido;
- volumes no mundo (poeira, nuvem, água turva).

Tudo isso existe no three.js. O contorno + toon (§3.1) fica para objetos pequenos no mapa e no mundo.

### 8.1 O que sobe, com que custo, em que ordem
| # | Camada | O que fazer no three.js | Desenvolvimento (uma vez) | Custo de G4 no render | Ganho visual |
|---|---|---|---|---|---|
| 1 | **Luz de estúdio + IBL + exposição** | `RoomEnvironment` → `PMREMGenerator` como `scene.environment` (reflexo suave em tudo); luz principal direcional com sombra; luz de recorte por trás (`RectAreaLight` ou direcional fraca); tone mapping Neutral/AgX com exposição mais alta e contraste leve | 1–2 h | ~0% | **o maior**: tira a cara de argila |
| 2 | **Materiais por subsistema** | `MeshPhysicalMaterial`: cor base saturada por subsistema, roughness 0,35–0,6, metalness 0–0,3 (pintado), clearcoat 0,2–0,4; decalques (`DecalGeometry`) para marcas e números | 0,5 h por modelo | ~0% | grande |
| 3 | **Sombra macia + contato** | VSM ou PCSS (`SoftShadows` do drei / `pcss` do `@pmndrs/vanilla`) + `ContactShadows` sob o objeto; frustum de sombra apertado na ação | 1 h | +3–5% | grande (o objeto para de flutuar) |
| 4 | **Palcos com chão que reflete** | presets: planta azul com grade, estúdio escuro, grade holográfica, céu liso; chão com `MeshReflectorMaterial` (drei), reflexo borrado e esmaecido | 2–3 h | +10–20% só nos planos de palco | grande (é o "estúdio" do AiTelly) |
| 5 | **AO afinado para close** | N8AO (já em uso) com raio pequeno (0,2–0,6 m) e intensidade maior nos palcos | 0,5 h | ~+3% | médio |
| 6 | **Raio X / holograma + bloom seletivo** | casca com Fresnel (`three-custom-shader-material` ou `ShaderMaterial`), arestas com `EdgesGeometry` + `LineSegments2` (linhas grossas), interior emissivo; bloom só acima do limiar | 2 h | ~+5% | grande nas explicações |
| 7 | **Corte com tampa** | `clippingPlanes` + técnica de tampa por stencil (exemplo oficial "clipping stencil") com cor sólida no plano de corte | 2–3 h | ~+5% | grande (é o "como funciona") |
| 8 | **DOF + motion blur** | `DepthOfFieldEffect` nos closes; motion blur por **subquadros dentro do quadro** (K instantes no obturador de 180°), só nos movimentos rápidos | 3 h | DOF ~+5%; blur ×K só nos planos rápidos | médio-grande (tira a cara de jogo) |
| 9 | **Volumes do mundo** | atmosfera e nuvens Takram (céu e sol pela hora e lugar); névoa de altura; poeira e fumaça em flipbook (já em uso); embaixo d'água: névoa colorida + cáusticas por textura animada projetada | 3–4 h | +10–25% nos planos de mundo | médio-grande |
| 10 | **Textura de chão e ambiente** | ambientCG/Poly Haven com mapeamento triplanar no terreno e nos pisos | 1 h | ~0% | médio |

**Totais:** ~15–20 h de agente, uma vez só, e **+15–30% de G4** no render. Num vídeo de 18 min, ~17,5 → ~21–23 min.

**Ordem:** 1 → 2 → 3 → 4 dão a maior parte do salto em ~5–7 h. Depois 6 → 7 (as explicações), depois 8 → 9 → 10.

**Validação:** como no §6:
- cena-padrão por canal;
- coluna por camada;
- custo, régua, MD5 e juiz calibrado nas referências (`docs/plano-qualidade-3d.md` §3).

O alvo de cor nos trechos de explicação é colorfulness ~30.
