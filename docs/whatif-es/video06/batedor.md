# Batedor — vídeo 6 "What If Earth Spun Slower and Couldn't Stop?" (22/10/2026)

Rotina em `D:\mineracaoyoutube\docs\whatif-es\BATEDOR.md`. Elementos tirados das folhas `ref/geral_0..3.jpg` e do
`mapa_acoes.md` (capítulos e efeitos-herói). Critérios: licença comercial, grátis, offline, determinístico em `t`, three 0.180 +
R3F 9 + Remotion 4, barato na GPU, versão com mais de 2 semanas.

Tudo o que foi baixado está em `D:\whatif_es\assets\<fonte>\`, cada pasta com o seu `LICENCA.txt`. Nada foi para o C:, e os
temporários de `D:\tmp` foram apagados.

## Tabela

| Elemento (segundo do original) | Situação | Candidato | Licença / versão | Prova | Decisão sugerida |
|---|---|---|---|---|---|
| 1. Parede/onda gigante (Times Square 90–97,7; equador 365–383) e teto de água com estrias (97,8–103,9; 383,4–390) | inédito | **módulo próprio `onda.tsx`**: faixa extrudada com perfil paramétrico em `t`, shader do `Mar` (Fresnel + env), translucidez teal na crista, espuma por curvatura + fbm, spray e névoa com o nosso `Flipbook` (Cloud01/02/WispySmoke já baixados) | técnica própria; flipbooks Unity Labs CC0 (já temos) | — | **fazer o nosso**. Os repos abaixo servem só de técnica |
| ″ referência de costa/espuma/spray | — | [iamtechartist/coastal-simulation](https://github.com/iamtechartist/coastal-simulation) | MIT, 56★, push 19/09/2026; three WebGPU/TSL embutido | código lido (spray.js, shading.js) | técnica só: solver com estado (worker + WASM), não é determinístico e não roda no nosso WebGLRenderer |
| ″ referência de arrebentação | — | [scottstts/Threejs-Awesome-Graphics-Agent-Skills](https://github.com/scottstts/Threejs-Awesome-Graphics-Agent-Skills) → `threejs-spectral-ocean/references/coastal-breaker-and-swash-ocean.md` | MIT no topo, **mas mistura GPL-3.0** (Sandboard, rain-puddle, `coconut_tree.glb`) e fontes sem licença "MIT by project rule"; push 15/10/2026 (< 2 semanas) | leitura | técnica só, sem copiar código |
| ″ VDB/flipbook de água CC0 | — | JangaFX free VDBs (15, todos CC0) e Unity Labs (28 sets CC0) | — | conferido nas páginas | **nenhum é de água** (só fogo, fumaça, poeira e nuvem). Plano B: assar spray no Blender/Mantaflow na G4 → atlas |
| 2. Mar recuando e fundo secando (36–60; 133–159; 244–300) | inédito | Poly Haven `damp_beach_sand_02` + `mud_cracked_dry_03` + `lambis_shell`; Kenney Watercraft Kit (barcos) | CC0; 01/09/2026, 12/05/2022, 12/07/2024; Kenney CC0 (45 arquivos) | **baixados** (2k, 13 + 16 MB; concha 2,2 MB); Kenney não baixado | **adotar** num material de chão único com `nivel(t)` e secagem em função de `t − tSaida(x)` |
| 3. Terra: oceanos migrando aos polos e continente no equador (103,9–132,9; 217,9–244,9; 300,9–329,9) | fraco (temos o globo NASA com halo Fresnel) | **NOAA ETOPO 2022** (relevo + batimetria) | domínio público; 2022 | **baixado** a 5′ (4320×2160 e 2048×1024, PNG 16 bits, 17 MB). Teste da costa com nível = 21 km·(sin²φ − ⅓): sai o cinturão equatorial com 2 oceanos polares, igual ao original | **adotar**: costa no shader do globo |
| ″ nuvens | fraco (`cloud.png` 256 px) | NASA Blue Marble Clouds (`cloud_combined_8192.tif`) | domínio público | **baixado**, reduzido para 4096 e 2048 (3,4 MB) | **adotar** |
| ″ luzes noturnas | já temos bom | Black Marble (`terra_noite.jpg` 3600×1800, vídeos 4/5) | domínio público | — | manter |
| ″ atmosfera do planeta | fraco (Fresnel aditivo) | [`@takram/three-atmosphere`](https://github.com/takram-design-engineering/three-geospatial) | MIT, 0.19.1 (06/05/2026); peer three ≥ 0.170, R3F ≥ 9.0.4, postprocessing ≥ 6.36.7 | não provado | **provar**: still do globo com `Sky` + `AerialPerspective` e LUTs pré-calculadas em `public/` (offline). Se passar de 30 min, fazer um shell de Rayleigh analítico |
| 4. Palmeiras (praias, Santa Monica, calçadão) | fraco (auditoria do v3: "palmas parecem pente de linhas") | **Yughues/Nobiax "Free palm treeZ v3"** | CC0 (página + `readme.txt`); 28/03/2012 | **baixado** (7z 19,7 MB → pasta 32 MB). Still local: 4 modelos com folhas em alfa, sombra de palmeira na areia, vento por `uT` no `onBeforeCompile` (`teste/batedor/palmeira.html?t=…`) | **adotar** via `mundo/palmeiras.tsx` (instanciado, vento em `t`) |
| ″ alternativa | — | [edap/palmgenerator](https://github.com/edap/palmgenerator) | **AGPL-3.0** | — | descartado (licença) |
| 5. Ponte pênsil tipo Golden Gate (132,9–159,9) | inédito | **gerador próprio** (torre art déco + cabo parabólico + pendurais + tabuleiro treliçado) | técnica própria | — | **fazer o nosso**: nenhum modelo CC0 achado (Free3D é "editorial only"; CGTrader/TurboSquid são pagos) |
| 6. Rocha costeira (Haystack Rock 60,9–74,9) e penhascos | fraco | Poly Haven `boulder_01` (124k tris) e `namaqualand_cliff_01` (177k tris); `coastal_cliff_01/02/04` como reserva | CC0; 06/02/2024, 08/10/2024, 2023 | `boulder_01` e `namaqualand_cliff_01` **baixados** em 1k (5,8 + 4,5 MB); falésias não (0,9–2,9 M tris, 29–60 MB) | **adotar** `boulder_01` escalado (~50 m), com detalhe triplanar (`cliff_side`/`rock_wall_02`, já no v5) e topo verde por `normal.y` |
| 7. Píer com roda-gigante (Santa Monica, 159,9–217,9) | fraco (criticada; nos vídeos 1 e 3, escala e posição erradas) | **gerador próprio** `rodaGigante.tsx`; o píer reaproveita o atual. Poly Haven `modular_wooden_pier` como textura de tábuas | — ; Poly Haven CC0 (2022) | — | **fazer o nosso**: nenhuma roda CC0 boa (só pagas ou "editorial only") |
| 8. Praia congelada de noite (196–217,9) | inédito | Poly Haven `qwantani_night_puresky` (Via Láctea, sem chão) + máscara de geada no shader (técnica do [SnowSystemThreeJS](https://github.com/achrefelouafi/SnowSystemThreeJS)) | CC0 (22/08/2025); repo MIT, push 28/06/2026, WebGL | HDRI **baixado** (2k HDR + JPG 8k, 10,6 MB) | **adotar**: geada em `onBeforeCompile` na areia, no calçadão e nas palmeiras |
| 9. Avenida com telões (Times Square, 74,9–103,9) | fraco (temos `cidade.tsx` e `rua.tsx`) | telões emissivos por Canvas em `t` + Kenney City Kit Commercial 2.1 para enchimento | Kenney CC0 (v2.1) | — | **fazer o nosso** (barato); Kenney opcional, não baixado |
| 10. Sol parado / nascendo no oeste (244,9–300; 340–356,5) | já temos bom (`ceu.tsx`, céu físico) | série Poly Haven **Qwantani** puresky (dawn, sunrise, morning, noon, afternoon, sunset, dusk, night, moonrise) do mesmo lugar | CC0 (2025) | — | manter o céu físico; o Qwantani fica de reserva para fundos fotográficos (espelhar = sol a oeste) |

## Notas por item

### 1. Onda gigante, cortina de água e teto de água
- **O que o original mostra.** Uma linha fina no horizonte que vira parede azul-petróleo com crista de espuma, sobe entre os prédios
  e termina num whiteout de spray. Depois, um "teto" de água sobre a câmera, com estrias irradiando para o ponto de fuga. Não é uma
  arrebentação física; é um volume estilizado.
- **Não há asset pronto de água com licença livre.**
  - JangaFX: os 15 VDBs grátis (CC0) são explosões, tornado, plumas, nuvens e poeira.
  - Unity Labs: 28 sets CC0 de fogo, fumaça, nuvem e explosão.
  - Splashes em Alembic/VDB só aparecem em packs pagos.
- **Receita sugerida (`mundo/onda.tsx`, tudo em função de `t`).**
  1. **Malha.** Uma faixa larga (2–4 km) extrudada ao longo da frente. O perfil 2D (altura × avanço) é paramétrico: face côncava
     que sobe com H(t) e crista curvando para a frente (Bézier com o lábio crescendo). Avanço x(t) em fórmula fechada.
  2. **Shader.** O mesmo Fresnel + `env` do `Mar`. Na crista e no lábio, onde a espessura do perfil é pequena, entra translucidez
     teal (`#2b8c8c`→`#0f4c5c`) quando o sol está atrás. Espuma = curvatura do perfil + fbm rolando para cima (velocidade casada
     com x(t)), com uma faixa branca na base.
  3. **Spray e névoa.** Duas camadas do `Flipbook` com Cloud01/Cloud02/WispySmoke tingidos de branco-azulado:
     - spray nascendo na crista, em balística fechada `p0 + v·t − g·t²/2` (a mesma do `spray.js` do coastal-simulation);
     - névoa baixa à frente da parede.
     O whiteout final vem do próprio flipbook cobrindo a câmera.
  4. **Teto de água.** Um plano acima da câmera com a face de baixo visível: normal map rolando, cor azul-petróleo, estrias de ruído
     esticado na direção radial a partir do ponto de fuga e um brilho fraco de cáusticas. A luz da cena cai para tons frios.
  5. **Plano B para o spray.** Assar um spray de crista no Blender (Mantaflow, partículas de spray/foam) na G4, renderizado com
     alfa para atlas 8×8. A saída é nossa (o Blender é GPL, mas o render não herda a licença).
- **Técnicas lidas** (sem copiar código):
  - `coastal-simulation` (MIT): espuma "ivory" = cobertura × (1 − furos) × borda fina; areia molhada com rugosidade 0,94→0,24 e
    película refletindo o céu; spray por contato com vida de 0,28–0,63 s.
  - `coastal-breaker-and-swash-ocean.md` (skills do scottstts): campos de onda por banda com sementes fixas, o que garante o
    determinismo.
- **Riscos.** Os dois repos são WebGPU/TSL e o nosso render é WebGLRenderer + GLSL, então portar o código não compensa. O repo de
  skills mistura GPL e trechos sem licença.

### 2. Mar recuando e leito secando
- **Baixado** (`D:\whatif_es\assets\polyhaven\tex\`):
  - `damp_beach_sand_02_*_2k` (areia molhada de praia, fotografada em 2026, CC0);
  - `mud_cracked_dry_03_*_2k` (lama rachada para o leito seco ao longe);
  - `models/lambis_shell` (concha, 12k tris), para espalhar instanciada.
- **Técnica (um material de chão só).**
  - `nivel(t)` controla a malha do mar. A batimetria é suave: praia em 1:50 e depois uma plataforma; a água recua até a faixa fina no
    horizonte (44–48 s).
  - Cada ponto do leito guarda `tSaida(x)`, o instante em que a água saiu, calculado da batimetria e de `nivel(t)` (fórmula fechada).
    A idade seca `s = t − tSaida` mistura molhado (damp, escuro, rugosidade ~0,25, reflexo do HDRI) → úmido → seco (`coast_sand_01`)
    → rachado (`mud_cracked_dry_03`) nos trechos mais baixos e distantes.
  - Poças: fbm abaixo de um limiar, rugosidade 0,05 e reflexo do céu. Elas encolhem com `s`.
  - Algas/manchas escuras: fbm de baixa frequência no tom.
- **Barcos encalhados.** Kenney Watercraft Kit (CC0, 45 arquivos) tombados 15–25°, poucos e longe. Não baixado; a página e a licença
  foram conferidas.
- **Reaproveitamento.** O mesmo material serve à Golden Gate secando (133–159 s) e ao equador sem mar (244–300 s, com o reflexo do sol
  no leito molhado de 286–300 s).

### 3. Terra do espaço, oceanos migrando e continente novo
- **Relevo.** `D:\whatif_es\assets\noaa_etopo\`:
  - **ETOPO 2022** "surface" (topo + batimetria) a 5′, `etopo2022_surface_4320x2160_u16.png` e `_2048x1024_u16.png`, com
    `h = v/65535·20000 − 11000` m, norte em cima e lon −180 na borda esquerda.
  - Baixado por OPeNDAP com passo 5 (37 MB brutos em vez dos 466 MB do GeoTIFF inteiro).
  - **Prova:** `etopo2022_surface_costa_A21000.png`, a máscara do mar com nível `A·(sin²φ − ⅓)`, onde A é a diferença polo–equador do
    bojo equatorial (~21 km). Reproduz o resultado conhecido: um continente contínuo no equador e dois oceanos polares, igual ao
    capítulo 6 do original.
- **Shader do globo.**
  - `mar = h < A(t)·(sin²φ − ⅓)`, com A(t) indo de 0 a 21 000 m pela curva de rotação do HUD.
  - Nas terras antigas, a cor vem do Blue Marble. No leito exposto, a cor é bege/areia modulada pelo relevo (relevo sombreado
    pelo gradiente de `h`) e pela profundidade antiga.
  - Água: o azul do mapa NASA onde já era mar; nos polos, onde o mar invadiu terra, azul mais claro (raso) pela profundidade
    `nivel − h`.
- **Nuvens.** `D:\whatif_es\assets\nasa\nuvens_4096x2048.jpg` (Blue Marble Clouds, domínio público). Substitui o `cloud.png` de
  256 px.
- **Atmosfera.**
  - Hoje é um Fresnel aditivo (`Espaco.tsx`, `HALO_FS`).
  - Candidato: `@takram/three-atmosphere` 0.19.1 (MIT, WebGL/GLSL, R3F 9, three ≥ 0.170). Dá céu e atmosfera físicos (Bruneton),
    também vistos do espaço, e estrelas do catálogo Yale. O sol se define à mão (`sunDirection`), o que é determinístico.
  - As LUTs no GitHub são ponteiros LFS. Para rodar offline, gerar uma vez com `PrecomputedTexturesGenerator` e salvar em `public/`,
    ou baixar os `.bin` do LFS.
  - Atenção: as nuvens volumétricas da mesma família custaram 11 min por 20 s no vídeo 1 (`STACK_GEMS.md`). A atmosfera sozinha é
    barata (consulta a LUT).
  - Plano B: shell de espalhamento de Rayleigh analítico (O'Neil, GPU Gems 2 cap. 16), com a borda azul e o terminador alaranjado.

### 4. Palmeiras
- **Adotado:** "Free palm treeZ v3" (Yughues/Nobiax, CC0).
  - 5 OBJ: reta, curva, dupla, dupla curva e trio, com 470–1400 tris cada.
  - Atlas 2048 com alfa recortando os folíolos, normal, translucidez e especular.
  - Em `D:\whatif_es\assets\yughues_palmeiras\`: o 7z original, os OBJ em `obj/` e as texturas convertidas para PNG/JPG.
- **Prova local** (`D:\whatif_es\06_spun_slower\teste\batedor\palmeira.html?t=0` e `?t=1.4`):
  - as 4 palmeiras renderizam com folhas recortadas e a sombra de palmeira de verdade na areia, que resolve a crítica do "pente de
    linhas";
  - o vento é determinístico: o tronco curva com `(y/H)²` e as folhas (`uv.x > 0.25` no atlas) tremulam pela distância ao eixo, tudo
    em `uT`;
  - `customDepthMaterial` com `alphaTest` faz a sombra respeitar o recorte.
- **Pendências do wrapper** (`mundo/palmeiras.tsx`):
  - o tronco sai escuro: clarear a casca ou usar o mapa especular;
  - translucidez das folhas no contraluz (o mapa já vem no pacote);
  - variação de cor e altura por semente;
  - `InstancedMesh` para fileiras;
  - geada (item 8).
- **Descartados.**
  - `edap/palmgenerator`: AGPL-3.0.
  - `coconut_tree.glb` do repo de skills: GPL-3.0.
  - Kenney Nature Kit: CC0, mas low-poly demais para este visual.

### 5. Ponte pênsil (Golden Gate)
- Nenhum modelo CC0 utilizável:
  - Free3D "suspension bridge high detail" é *editorial only*;
  - CGTrader e TurboSquid são pagos;
  - SketchUp Warehouse não declara licença.
- **Gerador próprio** (`mundo/ponte.tsx`; o plano do original mostra só uma torre cortada, o tabuleiro e os cabos):
  - torre art déco com 2 pernas de seção decrescente e 4 travessas-portal com recortes;
  - cabo principal = parábola (carga uniforme) entre os topos das torres, em tubo;
  - pendurais verticais a cada ~15 m (instanciados) e tabuleiro com treliça lateral (instanciada);
  - cor "International Orange" `#C0362C`, material com rugosidade 0,6 e AO pela altura.
  - Custo: meio dia.
- Nota: o nome e a forma podem ser usados em contexto documental. Evitar logotipo e marca do distrito da ponte em cartazes.

### 6. Rocha costeira e penhascos
- **Baixados** (1k, `D:\whatif_es\assets\polyhaven\models\`):
  - `boulder_01` (1,3 × 1,8 × 1,0 m, 124k tris): escalado para ~50 m, dá o domo do Haystack Rock;
  - `namaqualand_cliff_01` (8 × 4 × 5 m, 177k tris): para falésia ou um sea stack mais anguloso.
- Ao escalar 40×, a textura 1k estica. A solução é o detalhe triplanar com `cliff_side`/`rock_wall_02` (já no `public/terra` do v5)
  e o topo verde (grama) por `normal.y` + ruído, como no original ("domo cinza com topo verde").
- Reserva: `coastal_cliff_01/02/04` e `coast_rocks_*` (CC0, 0,9–2,9 M tris e 29–60 MB em 1k–2k), pesados para entrar no projeto.
  Só valem para um plano de falésia de perto.

### 7. Píer com roda-gigante (Santa Monica)
- Nenhuma roda-gigante CC0 de qualidade (CGTrader, Fab, RenderHub e Free3D são pagos ou *editorial only*).
- **Gerador próprio** `mundo/rodaGigante.tsx`, na escala real da Pacific Park: ~26 m de altura, ~20 gôndolas.
  - **Estrutura:** dois aros (tubo) ligados por travessas; raios em pares cruzados até o cubo; treliça entre os aros (instanciada);
    cavalete em A dos dois lados com contraventamento.
  - **Gôndolas:** penduradas no aro, que gira por `ω·t`; cada uma contra-gira para ficar na vertical, com balanço `sin` pequeno.
  - **LEDs:** milhares de pontos emissivos instanciados ao longo dos aros e raios, com padrões animados em `t` (a noite do original,
    196–217 s, é um "círculo pontilhado"). O bloom já existe no `Look`.
  - **Posição:** na ponta do píer, escala ~0,6 da atual (correção das auditorias dos vídeos 1 e 3).
- Píer: tábuas com Poly Haven `modular_wooden_pier` (CC0) ou só a textura de madeira; guarda-corpo e postes densos e a plataforma no fim.

### 8. Praia congelada de noite
- **Céu baixado:** `qwantani_night_puresky` (CC0, 2k HDR + JPG 8k), com Via Láctea e estrelas, sem chão.
  - O JPG tonemapped vem claro (exposição automática do Poly Haven); baixar a exposição no `CeuFoto`.
  - Tem um brilho na linha do horizonte; girar para que ele fique atrás da câmera ou do píer.
- **Geada** (técnica do `SnowSystemThreeJS`, MIT, WebGL, three 0.185; os modelos de carro do repo não têm licença e não devem ser
  usados):
  - `onBeforeCompile` com máscara fbm em mundo × `smoothstep(limiar, 1, normal.y)` × `geada(t)` (196→217,9 s);
  - albedo → branco frio (`#dfe8f2`), rugosidade → 0,9, e cintilação = `hash(floor(pos·escala))` > 0,985 com piscar em `uT` (nunca
    relógio);
  - aplicar na areia, no calçadão, no guarda-corpo e no topo das folhas das palmeiras (as folhas usam a mesma máscara, com
    `normal.y` da face).
  - Opcional: `snow_02` (Poly Haven, já no v5) ou `Snow014` (ambientCG, CC0, 02/2026) no fim, quando a geada vira crosta.

### 9. Avenida com telões (Times Square)
- **Telões:** planos emissivos com `CanvasTexture` desenhada em função de `t`: gradientes pastel, textos do original trocados por
  espanhol, rolagem e troca de quadro por segundo.
  - Fonte carregada antes do primeiro quadro (`delayRender` até `document.fonts.ready`), para que todas as abas do render saiam iguais.
  - Intensidade > 1 para o bloom; um refletor fraco no asfalto.
- **Prédios:** os `cidade.tsx`/`rua.tsx` atuais, com janelas por textura de Canvas. O Kenney City Kit Commercial 2.1 (CC0, 50
  arquivos) serve só se faltarem volumes; não baixado.
- Escadaria vermelha do TKTS: caixas com degraus vermelhos translúcidos (emissivo fraco).

### 10. Sol parado e nascendo no oeste
- O céu físico (`ceu.tsx`, Rayleigh/Mie/ozônio) já dá conta: o Sol parado é só `sol(t)` constante, e nascer no oeste é o azimute
  invertido. Manter.
- Reserva: série Poly Haven **Qwantani** puresky (CC0, 2025), o mesmo lugar em 11 horários, de *dawn* a *moonrise*. Serve se
  quisermos fundos fotográficos em vez do céu físico. Espelhar o equiretangular põe o sol a oeste.
- `@takram/three-atmosphere` (item 3) também faria o céu do chão, mas não compensa trocar o que já funciona.

## Arquivos novos

| Pasta | Conteúdo | Tamanho |
|---|---|---|
| `D:\whatif_es\assets\noaa_etopo\` | ETOPO 2022 em 4320×2160 e 2048×1024 (PNG 16 bits), prévia e máscara-teste da costa | 17 MB |
| `D:\whatif_es\assets\nasa\` | nuvens Blue Marble 4096×2048 e 2048×1024 | 3,4 MB |
| `D:\whatif_es\assets\yughues_palmeiras\` | 7z original, 5 OBJ, atlas 2k (difusa RGBA, normal, translucidez, especular) e difusa 1k | 32 MB |
| `D:\whatif_es\assets\polyhaven\tex\` | `damp_beach_sand_02_*`, `mud_cracked_dry_03_*` (2k, 5 mapas cada) | 29 MB |
| `D:\whatif_es\assets\polyhaven\models\` | `boulder_01`, `namaqualand_cliff_01`, `lambis_shell` (glTF 1k) | 12,5 MB |
| `D:\whatif_es\assets\polyhaven\hdri\` | `qwantani_night_puresky_2k.hdr` + `_8k_tonemapped.jpg` | 10,6 MB |
| `D:\whatif_es\06_spun_slower\teste\batedor\palmeira.html` | prova das palmeiras (servir `D:\whatif_es` por HTTP e abrir com `?t=`) | — |

Quando cada achado for adotado: licença em `public/LICENCAS.txt` e uma linha no `STACK.md` (palmeiras, ETOPO e nuvens, areia
molhada e geada já são candidatos a padrão da stack).
