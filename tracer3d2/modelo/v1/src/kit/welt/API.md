# kit/welt — cenas 3D: Bahn · Globus · Flug · Modell

Uso: `src/cenas/welt.json` → `{"<batida>": {"comp": "Bahn", "props": {...}}}`. Chaves das props em português; todas opcionais salvo as marcadas **(obrig.)**.

## Convenções comuns
- **Tempo** (`em`, `ate`, `t` das chaves...): número (s locais da batida) ou `{"wort": "Granate", "nach": 0, "plus": 0.2}`.
- **Cor**: nome do canal (`signal papier cyan orange rot gruen grau weiss`) ou css (`#f2c14e`).
- **Textos** de Bahn/Globus aceitam tokens da curva no instante atual: `{t} {h} {h_km} {x} {x_m} {v} {mach} {ang} {vh}` e fixos `{hmax} {tmax} {T} {vfim} {vmin} {alcance_km} {alcance_m} {angfim}`; `{v|1}` = casas decimais; `{idCurva:v}` = outra curva.
- `locale` (`"de-DE"`; es-ES, pt-BR...) formata os números. `fonte` = linha de crédito dos dados (embaixo à esquerda), `fonte_em` = tempo de entrada. Sem marca d'água.
- **Ref** (ponto no mundo, Bahn/Globus): `"origem" | "alvo" | "meio" | "proj" | "apogeu"` ou `{ancora?, curva?, ts?, lat?, lon?, h?, lado?, frente?, alto?, norte?, leste?}`. `lado` = para a direita do tiro (de onde a câmera lateral olha), `frente` = sentido do tiro, `alto` = vertical, `norte/leste` absolutos (m); `h` = altitude (m); `curva`+`ts` = ponto da curva no segundo de voo `ts`.

## Bahn — trajetória balística sobre globo/terreno
Câmera, atmosfera física (Takram), luz e Look; só `curva` é obrigatória: sai câmera lateral com deriva, rastro, cabeça luminosa, HUD t/h/v/Mach e impacto.
- **curva / curvas[] (obrig.)** `{id?, serie?, arquivo?("bahn.json"), pontos?, params?, origem?, azimute?, solo?}`. Fontes: `serie` (dentro de `{faelle:{serie:{t_s,x_m|x_km,h_m|h_km,v_ms,mach,lat,lon,winkel_grad}}}`); `arquivo` plano com as mesmas colunas (ou `lat,lon,alt`, ou `{pontos:[...]}`); `pontos` `[{t,lat,lon,alt}]` ou `[{t,x,y,z}]` (x alcance, y altura, z lateral à direita, m; exige `origem{lat,lon,h}`+`azimute`); `params` `{v0, angulo, g?, arrasto?(1/m, 0 = vácuo), h0?}` + `origem`+`azimute`. `solo:[h_origem,h_impacto]` (m) deforma a altura para coincidir com o terreno.
  Estilo por curva: `cor` (padrão laranja <20 km, ciano acima), `largura`(4), `brilho`(1), `opak`, `tracejado:[traço,vão]`, `limite_km`, `fantasma:{opak,largura,brilho}` (curva inteira esmaecida), `de` (s; negativo = a partir do fim), `atraso` (s; o rastro termina antes do projétil, 0.05 em câmera de perseguição), `cabeca:{px,cor,ate}`, `muda:{em,ate,cor,opak,brilho,tracejado,largura}` (transição de estilo), `visivel:false`, `rastro:false`.
  `fluxo:[[t, ts],...]` (por curva): tempo local → segundo de voo, interpolação monótona (padrão linear 0..T em `d`).
- **camera**: `[{t, pos:Ref, alvo:Ref, fov(40), roll?}]` (Hermite, nunca para) ou `{chaves:[...], tremor}`; chave orbital `{t, alvo:Ref, orbita:{dist(m), elev(°), az(°)}, fov}` (interpola dist em log). Âncoras seguem o projétil: `{"ancora":"proj","lado":600,"alto":20}`.
- `origem`/`alvo` `{lat,lon,h}` (cenas sem curva), `azimute` (°, padrão: origem→alvo), `t0` (s somados ao tempo; continua uma cena na batida seguinte).
- `sol` `{data:"1914-08-15T15:40:00Z"}` ou `{dia:"AAAA-MM-DD", elevacao:38, lado:"tarde"|"manha"}`; `look` `{preset: dia|espaco|crepusculo|dramatico, exposicao, bloom, saturacao, contraste, vinheta, estrelas, sol:false}`; `detalhes` `["regiao","loncin"]` ou pacote `{box:{w,e,s,n}, farbe, hoehe, hmin, hmax, hPix}` (relevo+satélite por cima do globo); `europa`(true), `brilho_terra`(1.45), `relevo`(1), `envelhece`(1 = dessatura p/ época).
- `projetil` `{tipo: granada|ponto|disco|nenhum, px | escala, giro, cor, raio_px:[r0,r1]}`; `hud` `{titulo, linhas:["t","h","x","v","mach","ang" | ["rótulo","{v} m/s","cor"]], em, curva, h_unid:"m"|"km"|"auto"}` ou `false`.
- `eventos` (padrão `[{tipo:"impacto"}]`): `{tipo:"impacto", em?, rotulo, sub, dx, dy, raio, flash}` (anel + clarão + rótulo) · `{tipo:"apogeu", rotulo, sub, px}`.
- **camadas[]** `{tipo, em, ate, ...}`: `marca` (pos, titulo, sub, cor, dx, dy, tam, align) · `alvo` (mira: pos, titulo, sub, r0, r1) · `ponto` (pos | lista[Ref] | arquivo geojson+h; px, cor, forca) · `linha` (pts[Ref] | de,para; n, alturas[], alto, arco(m), crescer:[t0,t1], tracejado, largura, brilho) · `anel` (centro, raio, vr, alto, sobe, vida, n, cada, ate_proj) · `onda_som` (c, cada, ate_ts, raio) · `vetor` (direcao: horizontal|velocidade|gravidade|vertical, comp_px, inicio_px, v_ref, rotulo:{texto,dx,dy}) · `regua` (de, para, texto, deslocamento) · `regua_h` (ticks[m], plano:[a,b], rotulo) · `angulo` (graus, raio, projetil_dist, texto) · `texto` (x,y | pos+dx,dy; tam, fonte, peso, espaco, anker, tafel) · `plaqueta` (texto, sub, x, y) · `energia` (de, para, fa, fe, rotulo_de, unidade, texto_perda) · `vt` (gráfico v(t): marca, tmax, vmax) · `espectro` (titulo, eixo, cresce) · `fumaca` (centro, brasa, alto, raio, densidade) · `flash` · `vinheta` · `regiao` (pontos | circulo:{lat,lon,raio_km} | arquivo+filtro; preenche, cor).
```json
{"comp":"Bahn","props":{"azimute":299.6,"sol":{"data":"1914-08-15T15:40:00Z"},"detalhes":["regiao","loncin"],
 "curva":{"serie":"referenz_schwer_65","solo":[70.6,168],"cor":"orange","largura":5,"fantasma":{"opak":0.55},"fluxo":[[0,27.4],[3.5,29.9],[7.1,30.4]]},
 "projetil":{"tipo":"granada","px":40},"hud":{"titulo":"GIPFEL"},"eventos":[],
 "camera":[{"t":0,"pos":{"ancora":"meio","lado":12400,"alto":2700,"frente":900},"alvo":{"ancora":"meio","alto":1600}},{"t":7,"pos":{"ancora":"meio","lado":9800,"alto":3300,"frente":-500},"alvo":{"ancora":"meio","alto":1600}}],
 "camadas":[{"tipo":"regua_h","em":3.2,"ticks":[1000,2000,3000,4000],"rotulo":{"texto":"h = {hmax} m","em":3.4}},{"tipo":"vetor","direcao":"horizontal","comp_px":150,"v_ref":125,"cor":"cyan","em":5}]}}
```

## Globus — globo com arco, região destacada e câmera
Mesmo motor do Bahn (mesmas props e camadas), padrões: look `espaco` (estrelas), sem HUD/eventos, câmera orbital que desce até `alvo`.
- **alvo (obrig.)** `{lat,lon,h}`; `camera` orbital `[{t, alvo, orbita:{dist(m),elev,az}, fov}]` (de ~16 000 km a poucos km); `curva`/`curvas` opcionais (arco de tiro); `camadas`: `regiao` (destaque de país/zona), `linha` com `arco` (arco entre cidades), `marca`, `alvo`, `plaqueta`, `texto`.
- Terra: Blue Marble global + Europa 500 m; detalhe local só onde há pacote em `detalhes` (Liège: `regiao`, `loncin`).
```json
{"comp":"Globus","props":{"alvo":{"lat":50.67456,"lon":5.49238,"h":168},"detalhes":["regiao"],"sol":{"data":"1914-08-15T15:40:00Z"},
 "camera":[{"t":0,"alvo":{"lat":50.67456,"lon":5.49238,"h":168},"orbita":{"dist":16000000,"elev":70,"az":200},"fov":30},{"t":4.4,"alvo":{"lat":50.67456,"lon":5.49238,"h":168},"orbita":{"dist":17000,"elev":36,"az":218},"fov":42}],
 "camadas":[{"tipo":"plaqueta","em":0.5,"texto":"REFERENZSCHUSS","sub":"65°"},{"tipo":"alvo","pos":{"lat":50.67456,"lon":5.49238,"h":168},"em":2.7,"titulo":"LONCIN"},
 {"tipo":"regiao","circulo":{"lat":50.65,"lon":5.6,"raio_km":150},"cor":"signal","em":1}]}}
```

## Flug — voo sobre terreno real (ortofoto/satélite + relevo)
- **camera (obrig.)** `[{t, pos, alvo, fov(40)}]` (Catmull-Rom); ponto = `{lat,lon,h}` (h = altitude m) ou `{lat,lon,acima}` (acima do solo) ou `{leste,norte,h}` (m a partir do centro do pacote); `tremor`(0, 1 = câmera na mão), `near`, `far`.
- `terreno` `{pacote:"loncin"|"regiao"|objeto, variante?("1914"|"2021"|"2021sc" no loncin), horizonte?:[pacotes sob o principal], mat?:{alt(0..1 envelhece), hell, detail, ton}, horizonte_mat?, horizonte_seg?}`. Pacote objeto: `{id, bounds:{west,east,south,north}, zentrum:{lat,lon}, hoehe:"geo/x_hoehe_rg.png", farbe:"geo/x.jpg", hmin, hmax, farbeMax?, hbase?, near?, far?, seg?, texG?, nah?:{farbe,raio_m,seg}}` (PNG RG de 8 bits: h = hmin + (R·256+G)/65535·(hmax−hmin); ver `public/geo/manifest.json`). `ueb` = exagero vertical (declare na tela com `notas`).
- `luz` `{preset: dia|tarde_cinza|frio_azul|tarde_quente|entardecer, sol:{azimute,altura,forca,cor}|null, ceu:{zenit,horizont,boden,hof}, hemi:[céu,solo,forca], env, nevoa:{cor,alcance_km,max}|null, look:{bloom,limiar,vinheta,saturacao,contraste,brilho,raios,ao}}`.
- Sobreposições: `rotulos` `[{lat,lon,h|acima,texto,sub,em,ate,cor,tam,dx,dy,mitte}]` · `pontos` `[{lat,lon,acima,em,halo(m),pulso(m),cor,altura,contorno:[[lon,lat],...]}]` ou `pontos_arquivo` `{arquivo:geojson, contornos?, id, ordem[], em0, passo, halo, pulso, cor, altura, destaque:{id,halo_extra}}` · `ligar` `{de,ate,acima,altura,raio,cor,fechar}` (arcos em cadeia/anel entre os pontos) · `arcos` `[{de,para,altura,raio,cor,em,dur,cabeca}]` · `vetores` `[{de,para,raio,cor,em,dur,ate}]` (seta 3D) · `cabecalho` `{titulo,linhas[],em}` · `legenda` `{texto,sub,em,tam,baixo}` · `notas` `[{texto,em}]` · `textos` `[{x,y,texto,em,tam,cor,fonte,tafel}]` · `entrada`/`saida` (s de fusão com preto) · `fonte`.
```json
{"comp":"Flug","props":{"terreno":{"pacote":"regiao","mat":{"alt":0.6,"hell":2.2,"detail":0,"ton":"#b9c6d2"}},"ueb":1.8,"luz":{"preset":"tarde_quente"},
 "camera":[{"t":0,"pos":{"lat":50.66,"lon":5.58,"h":1200},"alvo":{"lat":50.67,"lon":5.49,"h":165}},{"t":4,"pos":{"lat":50.66,"lon":5.52,"h":700},"alvo":{"lat":50.67,"lon":5.49,"h":165}}],
 "arcos":[{"de":{"lat":50.6468,"lon":5.5746,"h":80},"para":{"lat":50.6738,"lon":5.4930,"h":165},"altura":900,"raio":9,"em":0.3}],
 "rotulos":[{"lat":50.64473,"lon":5.57308,"h":300,"texto":"LÜTTICH","em":0.1,"mitte":true}]}}
```

## Modell — vitrine de modelo 3D
Palco escuro com grade em metros e luz de estúdio; o modelo vem do **registro** `kit/welt/modelos.tsx` (um agente de código registra cada modelo novo com `registraModelo(nome,{C,doc,ancoras})`; já registrados: `MGeraet` (gamma:true = Gamma-Gerät), `Granate`, `Schlepper`, `Wagen`, `Moerser21Reihe`, `Kran`, `Lkw`, `Regal`, `RegalGranaten`, `Bohlenplatz`, `Leute`).
- **modelo (obrig.)** nome + `opcoes` (props do modelo, ex. `{"elev":12}`), `anim` `{opcao: [[t,v],...] | {de:[t0,t1], v:[v0,v1], ease:"glatt"|"glatt2"|"linear"}}`; vários: `modelos:[{modelo,opcoes,anim}]`. Ponto = `[x,y,z]` (m) ou `{ancora:"boca"|"culatra"|"rohr"|..., modelo?, arg?, dx,dy,dz}` (âncoras do registro).
- **camera (obrig.)** `[{t, alvo:[x,y,z], orbita:{az(°), dist(m horizontal), alto(m)}, fov(40), far}]` (interpola az/dist/alto) ou `{t, pos:[x,y,z], alvo}`.
- `rotulos` `[{pos,texto,sub,em,ate,cor,tam,dx,dy,seta(true: ponto+linha),align}]` · `cotas` `[{de,para,texto,em,cor,deslocamento,tam}]` · `graduacao` `{de,para,n,em,fim,cor,cor_pontas,rotulos,altura,espessura}` (régua com marcas numeradas 1..n) · `barra` `{de,para,em,dur,cor}` (haste de destaque) · `humano` `{pos:[x,z],ry,pose,altura,cor,em}` + `escala_humana` `{pos:[x,z],altura,texto,em}` · `chips` `[{texto,em,cor,pos:{left,bottom|right,top}}]` · `hud` `{titulo,linhas:[[k,v]],em}`.
- `luz` `{centro:[x,y,z], raio, haupt, gegen}`, `look` `{ao,bloom,limiar,vinheta,contraste,saturacao,nevoa}`, `grade_centro:[x,z]`, `fonte`.
```json
{"comp":"Modell","props":{"modelo":"MGeraet","opcoes":{"elev":6},"luz":{"centro":[1.5,3.5,0],"raio":12},
 "camera":[{"t":0,"pos":[5.7,3.6,15.5],"alvo":[2.7,4.1,0],"fov":36},{"t":5,"pos":[-1.5,3.2,15.5],"alvo":[1,3.5,0],"fov":36}],
 "cotas":[{"de":[3.9,3.5,2.15],"para":[-1.3,3.4,2.15],"texto":"5,04 m","em":0.5,"deslocamento":70}],
 "rotulos":[{"pos":{"ancora":"boca"},"texto":"Mündung","sub":"Ø 42 cm","em":1,"cor":"cyan"}],"escala_humana":{"pos":[3,0],"altura":1.75,"texto":"1,75 m","em":1}}}
```

## Pacotes de terreno do vídeo (24/10/2026)
`terreno.pacote` aceita, por nome, `loncin`, `regiao` **ou qualquer nome registrado em `src/cenas/pacotes.json`** (dados por vídeo, no mesmo formato do objeto inline). O batedor de dados acrescenta os pacotes ali, sem mexer no código.

## Modelos do vídeo 4 (Schwerer Gustav), registrados no kit
Use em `Modell` pelo nome: `Gustav` (elevação, recuo, explodido, carregamento, rede, brilho, blueprint, truques acesos), `GustavRohr` (corte do tubo), `Betongranate`, `Sprenggranate`, `Kleinwagen`, `Haus4`, `Portal` (guindaste), `Flachwagen`, `GleisG4`, `VerladeZug`, `Anel`, `Kriecher`, `Feuer`. Código: `welt/g4_gustav_modell.tsx` + `kit/welt/modelos_gustav.tsx`.
