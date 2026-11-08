// K16 Seekrieg: mapa ESCURO 2.5D (assinatura nova do Kriegsmomente, 04/11). Plano chapado no 3D, câmera inclinada,
// sem relevo nem satélite. Tudo é função de (t, estado): nada se acumula entre quadros (os "pools" só guardam objetos).
//
//   const mapa = await buildMapa(scene, MAPA_ASSETS, {largura: 1600, altura: 900});   // MAPA_ASSETS: mapa_assets.js
//   const cam = mapa.cameraPara(estado.camera);   // {pos, tgt, fov, near, far}  -> stage.frame(cam, 'mapa', ...)
//   mapa.set(t, estado);                           // estado = null esconde o mapa
//
// Paleta: mar #141a20 (fundo > 50 m um tom mais escuro), terra #262d34, costa #8fa6b6 fina, nomes em branco caixa alta
// condensada. Semântica: branco = dado, laranja-sinal #ff7a1f = perigo/peça da história, azul-frio #6fa8dc = trajetória.
// Render: as cores só saem exatas sem tone mapping (renderer.toneMapping = NoToneMapping nas tomadas de mapa) e com
// o clima CLIMA_MAPA (grade neutra, sem névoa). As camadas não usam profundidade: a ordem é a renderOrder (ORDEM).
import * as THREE from 'three';
import {Line2} from 'three/addons/lines/Line2.js';
import {LineGeometry} from 'three/addons/lines/LineGeometry.js';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';
import {LineSegments2} from 'three/addons/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/addons/lines/LineSegmentsGeometry.js';

export const COR = {mar: '#141a20', marFundo: '#0f1419', terra: '#262d34', costa: '#8fa6b6', dado: '#ffffff', perigo: '#ff7a1f', trajetoria: '#6fa8dc',
  watt: '#5f676e', raso: '#25313b', fundoJade: '#10161c', halo: '#0b0f13'};
// clima para o stage.js (CLIMA.mapa = CLIMA_MAPA): grade neutra, céu do tom do mar, sem névoa nem listras
export const CLIMA_MAPA = {fundoInt: 0, envInt: 0.5, rim: 0, grade: [1, 1, [1, 1, 1]], top: COR.mar, hor: COR.mar, bot: COR.mar, streak: 0, fog: 0};
// enquadramentos prontos; estado.camera sobrescreve campo a campo
export const AREAS = {
  europa_norte: {centro: [6.8, 53.0], alt_km: 1400, inclinacao_graus: 22, rumo_graus: 0, fov: 30},
  mar_norte: {centro: [8.0, 53.85], alt_km: 230, inclinacao_graus: 28, rumo_graus: 0, fov: 30},
  jade: {centro: [8.02, 53.70], alt_km: 55, inclinacao_graus: 30, rumo_graus: 0, fov: 30},
  franca: {centro: [1.7, 49.3], alt_km: 545, inclinacao_graus: 22, rumo_graus: 0, fov: 30},
};
const ORDEM = {mar: 0, terra: 1, jade: 2, costa: 3, setas: 4, trilhas: 5, aneis: 6, navios: 7, pontos: 8, rotulos: 9};

// projeção: Mercator com escala verdadeira em 54° N; 1 unidade = 1 km; norte = -z, leste = +x, mapa no plano y = 0
const R = 6371, D2R = Math.PI / 180, LON0 = 7, LAT0 = 54, K = Math.cos(LAT0 * D2R);
const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * D2R) / 2));
const MY0 = merc(LAT0);
const mx = (lon) => R * K * (lon - LON0) * D2R;
const mz = (lat) => -R * K * (merc(lat) - MY0);
const escalaEm = (lat) => K / Math.cos(lat * D2R);   // km de mapa por km real nesta latitude
export const lonlatParaMundo = ([lon, lat], y = 0) => new THREE.Vector3(mx(lon), y, mz(lat));
export const mundoParaLonlat = (v) => [LON0 + v.x / (R * K) / D2R, (2 * Math.atan(Math.exp(-v.z / (R * K) + MY0)) - Math.PI / 2) / D2R];
// distância real (ortodrômica) em km
export const distKm = ([a, b], [c, d]) => {
  const p1 = b * D2R, p2 = d * D2R, dl = (c - a) * D2R;
  return R * Math.acos(Math.min(1, Math.sin(p1) * Math.sin(p2) + Math.cos(p1) * Math.cos(p2) * Math.cos(dl)));
};

export function cameraPara(c = {}) {
  const base = AREAS[c.area] || {};
  const {centro, alt_km, inclinacao_graus = 20, rumo_graus = 0, fov = 30} = {...base, ...c};
  const tgt = lonlatParaMundo(centro);
  const inc = Math.max(2, inclinacao_graus) * D2R, r = rumo_graus * D2R;
  const off = alt_km * Math.tan(inc);
  const pos = new THREE.Vector3(tgt.x - Math.sin(r) * off, alt_km, tgt.z + Math.cos(r) * off);
  const dist = pos.distanceTo(tgt);
  return {pos: pos.toArray(), tgt: tgt.toArray(), fov, near: alt_km * 0.02, far: dist * 40, dist};
}

// rota suavizada (Catmull-Rom centrípeta) amostrada por comprimento: pontos do mundo + comprimento acumulado
const rotaCache = new Map();
export function rotaMundo(pontos, suave = true) {
  const k = JSON.stringify(pontos) + suave;
  if (rotaCache.has(k)) return rotaCache.get(k);
  const vs = pontos.map((p) => lonlatParaMundo(p));
  let pts = vs;
  if (suave && vs.length > 2) pts = new THREE.CatmullRomCurve3(vs, false, 'centripetal').getSpacedPoints(Math.max(64, vs.length * 40));
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const r = {pts, acc, L: acc[acc.length - 1]};
  rotaCache.set(k, r);
  return r;
}
// ponto e rumo (graus, horário a partir do norte) a uma distância s (km de mapa) ao longo da rota
export function naRota(rota, s) {
  const {pts, acc, L} = rota;
  s = Math.min(Math.max(s, 0), L);
  let i = 1;
  while (i < acc.length - 1 && acc[i] < s) i++;
  const a = pts[i - 1], b = pts[i], f = (s - acc[i - 1]) / Math.max(1e-9, acc[i] - acc[i - 1]);
  const p = a.clone().lerp(b, Math.min(1, Math.max(0, f)));
  const rumo = Math.atan2(b.x - a.x, -(b.z - a.z)) / D2R;
  return {p, rumo, i};
}
const ateS = (rota, s) => {   // a rota cortada em s (desenho progressivo)
  const {p, i} = naRota(rota, s);
  return [...rota.pts.slice(0, i), p];
};
const ZERO = new THREE.Vector3(0, 0, 0);
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

async function decodeL8(b64) {
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const bmp = await createImageBitmap(new Blob([bin], {type: 'image/png'}), {colorSpaceConversion: 'none', premultiplyAlpha: 'none'});
  const cv = document.createElement('canvas');
  cv.width = bmp.width; cv.height = bmp.height;
  const cx = cv.getContext('2d', {willReadFrequently: true});
  cx.drawImage(bmp, 0, 0);
  const d = cx.getImageData(0, 0, bmp.width, bmp.height).data;
  const out = new Uint8Array(bmp.width * bmp.height);
  for (let i = 0; i < out.length; i++) out[i] = d[i * 4];
  return {w: bmp.width, h: bmp.height, data: out};
}
const texR8 = ({w, h, data}) => {
  const t = new THREE.DataTexture(data, w, h, THREE.RedFormat, THREE.UnsignedByteType);
  t.unpackAlignment = 1;
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
};

const GEO_GLSL = /* glsl */ `
  const float R = 6371.0, D2R = 0.017453292519943295;
  uniform float uK; uniform float uLon0; uniform float uMy0;
  vec2 lonlat(vec2 xz){ float lon = uLon0 + xz.x / (R * uK) / D2R;
    float lat = (2.0 * atan(exp(-xz.y / (R * uK) + uMy0)) - 1.5707963267948966) / D2R; return vec2(lon, lat); }`;
const VERT = /* glsl */ `varying vec2 vXZ; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vXZ = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const MAR_FRAG = /* glsl */ `${GEO_GLSL}
  uniform sampler2D uTex; uniform vec4 uBox; uniform vec3 uRaso; uniform vec3 uFundo; varying vec2 vXZ;
  uniform sampler2D uTerraTex; uniform vec4 uTerraBox; uniform vec3 uTerra;
  void main(){
    vec2 ll = lonlat(vXZ);
    vec2 ut = vec2((ll.x - uTerraBox.x) / (uTerraBox.y - uTerraBox.x), (uTerraBox.w - ll.y) / (uTerraBox.w - uTerraBox.z));
    float terra = all(greaterThanEqual(ut, vec2(0.0))) && all(lessThanEqual(ut, vec2(1.0))) ? texture2D(uTerraTex, ut).r : 0.0;
    float at = smoothstep(0.5 - 0.6 * fwidth(terra), 0.5 + 0.6 * fwidth(terra) + 1e-4, terra);
    vec2 uv = vec2((ll.x - uBox.x) / (uBox.y - uBox.x), (uBox.w - ll.y) / (uBox.w - uBox.z));
    float prof = 100.0;   // fora do recorte do ETOPO (Atlântico, Mar da Noruega): tom do fundo, sem degrau na borda
    if (all(greaterThanEqual(uv, vec2(0.0))) && all(lessThanEqual(uv, vec2(1.0)))) {
      float v = texture2D(uTex, uv).r * 255.0;
      prof = v < 1.0 ? 0.0 : 700.0 * pow((v - 1.0) / 254.0, 2.0);
    }
    float w = fwidth(prof) + 1.0;
    gl_FragColor = vec4(mix(mix(uRaso, uFundo, smoothstep(50.0 - w, 50.0 + w, prof)), uTerra, at), 1.0);
  }`;
// faixas do Jade (EMODnet, LAT): Watt (seca ou < 2 m) / raso (2–7 m) / fundo (> 7 m); linha opcional numa profundidade
const JADE_FRAG = /* glsl */ `${GEO_GLSL}
  uniform sampler2D uTex; uniform vec4 uBox; uniform vec3 uTerra; uniform vec3 uWatt; uniform vec3 uRaso; uniform vec3 uFundo;
  uniform vec2 uLim; uniform float uOpac; uniform float uLinhaM; uniform float uLinhaO; uniform vec3 uLinhaCor; varying vec2 vXZ;
  uniform sampler2D uTerraJ; uniform vec3 uLinhaC;
  void main(){
    vec2 ll = lonlat(vXZ);
    vec2 uv = vec2((ll.x - uBox.x) / (uBox.y - uBox.x), (uBox.w - ll.y) / (uBox.w - uBox.z));
    if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) discard;
    float v = texture2D(uTex, uv).r * 255.0;
    float prof = v / 4.0 - 20.0;
    float fw = max(fwidth(prof), 0.05);
    vec3 c = mix(uWatt, uRaso, smoothstep(uLim.x - fw, uLim.x + fw, prof));
    c = mix(c, uFundo, smoothstep(uLim.y - fw, uLim.y + fw, prof));
    float tj = texture2D(uTerraJ, uv).r;
    float lt = smoothstep(0.5 - fwidth(tj), 0.5 + fwidth(tj) + 1e-4, tj);
    c = mix(c, uTerra, max(lt, 1.0 - smoothstep(0.0, 0.5, v)));
    float perto = uLinhaC.z > 0.0 ? 1.0 - smoothstep(0.6 * uLinhaC.z, uLinhaC.z, distance(vXZ, uLinhaC.xy)) : 1.0;
    float linha = (1.0 - smoothstep(0.0, 1.6 * fw, abs(prof - uLinhaM))) * smoothstep(0.65, 1.0, v) * step(uLim.x, prof) * (1.0 - lt) * perto;
    c = mix(c, uLinhaCor, linha * uLinhaO);
    float borda = smoothstep(0.0, 0.04, uv.x) * smoothstep(1.0, 0.96, uv.x) * smoothstep(0.0, 0.04, uv.y) * smoothstep(1.0, 0.96, uv.y);
    gl_FragColor = vec4(c, uOpac * borda);
  }`;

const camada = (mat, ordem) => {
  Object.assign(mat, {depthTest: false, depthWrite: false, transparent: true, toneMapped: false, fog: false});
  return ordem;
};
const NAVIO = (() => {   // silhueta de cima, proa em +y, comprimento 1
  const s = new THREE.Shape();
  [[0, 0.5], [0.09, 0.34], [0.145, 0.16], [0.15, -0.36], [0.11, -0.5], [-0.11, -0.5], [-0.15, -0.36], [-0.145, 0.16], [-0.09, 0.34]].forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  return new THREE.ShapeGeometry(s).rotateX(-Math.PI / 2);   // deitada: +y da forma vira -z (norte)
})();

export async function buildMapa(scene, assets, {largura = 1600, altura = 900} = {}) {
  const grupo = new THREE.Group();
  grupo.name = 'mapa';
  scene.add(grupo);
  const {geo, info} = assets;
  const RES = new THREE.Vector2(largura, altura);
  const geoU = {uK: {value: K}, uLon0: {value: LON0}, uMy0: {value: MY0}};

  if (assets.fonte) {
    const ff = new FontFace('MapaCond', `url(data:font/woff2;base64,${assets.fonte})`, {weight: '600'});
    document.fonts.add(await ff.load());
  }
  const [marPx, jadePx, terraPx, jadeTerraPx] = await Promise.all([assets.mar, assets.jade, assets.terra, assets.jadeTerra].map(decodeL8));

  // mar: um plano grande; a profundidade do ETOPO só escolhe entre dois tons
  const M = info.mar;
  const marMat = new THREE.ShaderMaterial({vertexShader: VERT, fragmentShader: MAR_FRAG, uniforms: {...geoU, uTex: {value: texR8(marPx)},
    uBox: {value: new THREE.Vector4(M.lon0, M.lon1, M.lat0, M.lat1)}, uRaso: {value: new THREE.Color(COR.mar)}, uFundo: {value: new THREE.Color(COR.marFundo)},
    uTerraTex: {value: texR8(terraPx)}, uTerraBox: {value: new THREE.Vector4(info.terra.lon0, info.terra.lon1, info.terra.lat0, info.terra.lat1)}, uTerra: {value: new THREE.Color(COR.terra)}}});
  const mar = new THREE.Mesh(new THREE.PlaneGeometry(9000, 7000).rotateX(-Math.PI / 2), marMat);
  mar.position.set(mx(10), 0, mz(52));
  mar.renderOrder = camada(marMat, ORDEM.mar);
  mar.frustumCulled = false;
  grupo.add(mar);

  // terra: máscara de cobertura (NE 10 m, 1/150°) no próprio shader do mar (o earcut perdia triângulos do continente recortado)

  // faixas do Jade (opcional, por cima do mar/terra: dentro do recorte manda a máscara OSM do Jade)
  const J = info.jade;
  const jadeMat = new THREE.ShaderMaterial({vertexShader: VERT, fragmentShader: JADE_FRAG, uniforms: {...geoU, uTex: {value: texR8(jadePx)},
    uBox: {value: new THREE.Vector4(J.lon0, J.lon1, J.lat0, J.lat1)}, uTerra: {value: new THREE.Color(COR.terra)}, uWatt: {value: new THREE.Color(COR.watt)},
    uRaso: {value: new THREE.Color(COR.raso)}, uFundo: {value: new THREE.Color(COR.fundoJade)}, uLim: {value: new THREE.Vector2(2, 7)}, uOpac: {value: 0},
    uLinhaM: {value: 8.4}, uLinhaO: {value: 0}, uLinhaCor: {value: new THREE.Color(COR.perigo)}, uTerraJ: {value: texR8(jadeTerraPx)}, uLinhaC: {value: new THREE.Vector3()}}});
  const j0 = lonlatParaMundo([J.lon0, J.lat1]), j1 = lonlatParaMundo([J.lon1, J.lat0]);
  const jade = new THREE.Mesh(new THREE.PlaneGeometry(j1.x - j0.x, j1.z - j0.z).rotateX(-Math.PI / 2), jadeMat);
  jade.position.set((j0.x + j1.x) / 2, 0, (j0.z + j1.z) / 2);
  jade.renderOrder = camada(jadeMat, ORDEM.jade);
  grupo.add(jade);
  // profundidade do Jade no CPU (para o navio parar na borda do raso); null = terra ou fora do recorte
  const profJade = ([lon, lat]) => {
    const c = Math.floor(((lon - J.lon0) / (J.lon1 - J.lon0)) * jadePx.w), r = Math.floor(((J.lat1 - lat) / (J.lat1 - J.lat0)) * jadePx.h);
    if (c < 0 || r < 0 || c >= jadePx.w || r >= jadePx.h) return undefined;
    const v = jadePx.data[r * jadePx.w + c];
    return v === 0 ? null : v / 4 - 20;
  };

  // costa: segmentos finos em pixels
  const segs = [];
  for (const l of geo.costa) for (let i = 1; i < l.length; i++) { const a = l[i - 1], b = l[i]; segs.push(mx(a[0]), 0, mz(a[1]), mx(b[0]), 0, mz(b[1])); }
  const costaGeo = new LineSegmentsGeometry().setPositions(segs);
  const costaMat = new LineMaterial({color: COR.costa, linewidth: 1.2, resolution: RES});
  const costa = new LineSegments2(costaGeo, costaMat);
  costa.renderOrder = camada(costaMat, ORDEM.costa);
  costa.frustumCulled = false;
  grupo.add(costa);

  // pools: um objeto por índice, criado na 1ª vez; o que não é usado no quadro fica invisível
  const pool = (fazer) => {
    const itens = [];
    let n = 0;
    return {ini() { n = 0; }, prox() { if (!itens[n]) itens[n] = fazer(); return itens[n++]; }, fim() { for (let i = 0; i < itens.length; i++) (Array.isArray(itens[i]) ? itens[i] : [itens[i]]).forEach((o) => (o.visible = i < n)); }};
  };
  const linhaPool = pool(() => {
    const m = new LineMaterial({color: '#ffffff', linewidth: 3, resolution: RES});
    const l = new Line2(new LineGeometry(), m);
    l.renderOrder = camada(m, ORDEM.trilhas);
    l.frustumCulled = false;
    grupo.add(l);
    return l;
  });
  const setLinha = (pts, {cor, largura: lw = 3, opac = 1, tracejada = false, dash = 10, ordem = ORDEM.trilhas}) => {
    if (pts.length < 2) return;
    const l = linhaPool.prox();
    l.geometry.dispose();
    l.geometry = new LineGeometry().setPositions(pts.flatMap((p) => [p.x, p.y, p.z]));
    const m = l.material;
    m.color.set(cor);
    m.linewidth = lw;
    m.opacity = opac;
    m.dashed = tracejada;
    if (tracejada) { m.dashSize = dash; m.gapSize = dash * 0.8; m.dashScale = 1; l.computeLineDistances(); }
    m.needsUpdate = true;
    l.renderOrder = ordem;
  };
  const discoGeo = new THREE.CircleGeometry(1, 20).rotateX(-Math.PI / 2);
  const discoPool = pool(() => {
    const m = new THREE.MeshBasicMaterial({color: '#fff'});
    const d = new THREE.Mesh(discoGeo, m);
    d.renderOrder = camada(m, ORDEM.pontos);
    grupo.add(d);
    return d;
  });
  const disco = (p, raio, cor, opac = 1, ordem = ORDEM.pontos) => {
    const d = discoPool.prox();
    d.position.copy(p);
    d.scale.setScalar(raio);
    d.material.color.set(cor);
    d.material.opacity = opac;
    d.renderOrder = ordem;
  };
  const N_PONTOS = 420;
  const enxamePool = pool(() => {
    const m = new THREE.MeshBasicMaterial({color: '#fff'});
    const im = new THREE.InstancedMesh(discoGeo, m, N_PONTOS);
    im.renderOrder = camada(m, ORDEM.pontos);
    im.frustumCulled = false;
    grupo.add(im);
    return im;
  });
  const navioPool = pool(() => {
    const g = new THREE.Group();
    const halo = new THREE.Mesh(NAVIO, new THREE.MeshBasicMaterial({color: COR.halo}));
    const corpo = new THREE.Mesh(NAVIO, new THREE.MeshBasicMaterial({color: '#fff'}));
    halo.scale.set(1.5, 1, 1.22);
    halo.renderOrder = camada(halo.material, ORDEM.navios);
    corpo.renderOrder = camada(corpo.material, ORDEM.navios + 0.1);
    halo.material.opacity = 0.75;
    g.add(halo, corpo);
    g.userData = {halo, corpo};
    grupo.add(g);
    return g;
  });
  const setaPool = pool(() => {
    const g = new THREE.Group();
    const m = new THREE.MeshBasicMaterial({color: '#fff', side: THREE.DoubleSide});
    const haste = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0.5, 0, 0), m);
    const tri = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -0.5), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0.5)]);
    const ponta = new THREE.Mesh(tri, m);
    haste.renderOrder = ponta.renderOrder = camada(m, ORDEM.setas);
    g.add(haste, ponta);
    g.userData = {haste, ponta, m};
    grupo.add(g);
    return g;
  });

  // rótulos: textura de canvas por (texto, cor), sprite de tamanho constante em pixels (ou deitado no mapa)
  const texCache = new Map();
  const FPX = 72;
  const texto = (txt, cor) => {
    const k = txt + '|' + cor;
    if (texCache.has(k)) return texCache.get(k);
    const cv = document.createElement('canvas');
    const cx = cv.getContext('2d');
    const font = `600 ${FPX}px MapaCond, "Barlow Condensed", "Arial Narrow", sans-serif`;
    cx.font = font;
    cx.letterSpacing = `${FPX * 0.06}px`;
    const w = Math.ceil(cx.measureText(txt).width + FPX * 0.6);
    cv.width = w; cv.height = Math.ceil(FPX * 1.4);
    cx.font = font;
    cx.letterSpacing = `${FPX * 0.06}px`;
    cx.textBaseline = 'middle';
    cx.lineJoin = 'round';
    cx.strokeStyle = 'rgba(11,15,19,0.9)';
    cx.lineWidth = FPX * 0.16;
    cx.strokeText(txt, FPX * 0.3, cv.height / 2);
    cx.fillStyle = cor;
    cx.fillText(txt, FPX * 0.3, cv.height / 2);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    const r = {t, asp: cv.width / cv.height, padX: (FPX * 0.3) / cv.width};
    texCache.set(k, r);
    return r;
  };
  const spritePool = pool(() => {
    const m = new THREE.SpriteMaterial({sizeAttenuation: false});
    const s = new THREE.Sprite(m);
    s.renderOrder = camada(m, ORDEM.rotulos);
    grupo.add(s);
    return s;
  });
  const deitadoPool = pool(() => {
    const m = new THREE.MeshBasicMaterial({side: THREE.DoubleSide});
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), m);
    p.renderOrder = camada(m, ORDEM.rotulos);
    grupo.add(p);
    return p;
  });
  const ANC = {c: [0.5, 0.5], d: [0, 0.5], e: [1, 0.5], n: [0.5, -0.15], s: [0.5, 1.15]};   // d = texto à direita do ponto

  let Q = null;   // parâmetros do quadro: km de mapa por pixel, escala de sprite por pixel
  const rotulo = (r) => {
    const {lonlat, texto: txt, opacidade = 1, cor = COR.dado, tamanho = 26, ancora = 'c', ponto = false, deitado = false, rumo_graus = 0, afasta_px = ponto ? 6 : 0} = r;
    if (opacidade <= 0.001 || !txt) return;
    const tx = texto(String(txt).toUpperCase(), cor);
    const p = lonlat.isVector3 ? lonlat.clone() : lonlatParaMundo(lonlat);
    if (ponto) disco(p, 3.2 * Q.kmpx, cor, opacidade, ORDEM.rotulos);
    if (deitado) {   // texto deitado no mapa (o "número gigante no terreno"); tamanho em px na distância do alvo
      const d = deitadoPool.prox();
      const h = tamanho * 1.4 * Q.kmpx;
      d.material.map = tx.t; d.material.opacity = opacidade; d.material.needsUpdate = true;
      d.position.copy(p);
      d.scale.set(h * tx.asp, 1, h);
      d.rotation.y = -rumo_graus * D2R;
      return;
    }
    const s = spritePool.prox();
    s.material.map = tx.t;
    s.material.opacity = opacidade;
    s.material.needsUpdate = true;
    s.position.copy(p);
    const sy = tamanho * 1.4 * Q.spx;
    s.scale.set(sy * tx.asp, sy, 1);
    const [ax, ay] = ANC[ancora] || ANC.c;
    const gap = afasta_px / (tamanho * 1.4 * tx.asp);   // afastamento do ponto, em fração da largura do rótulo
    s.center.set(ancora === 'd' ? -gap : ancora === 'e' ? 1 + gap : ax, ancora === 'n' ? ay - afasta_px / (tamanho * 1.4) : ancora === 's' ? ay + afasta_px / (tamanho * 1.4) : ay);
  };

  const trilha = (tr) => {
    const {pontos, progresso = 1, estilo = 'solida', cor = COR.trajetoria, largura: lw = 3, opacidade = 1, suave = true, rotulo: rot, ponta = true} = tr;
    if (progresso <= 0 || opacidade <= 0) return;
    const rota = rotaMundo(pontos, suave);
    if (estilo === 'pontos') {   // coluna de pontos (a divisão): a cabeça anda; na chegada os pontos se juntam no destino
      const im = enxamePool.prox();
      const n = tr.n ?? 360, col = (tr.coluna ?? 0.3) * rota.L, rp = (tr.raio_px ?? 2.4) * Q.kmpx, larg = 7 * Q.kmpx;
      im.count = Math.min(n, N_PONTOS);
      im.material.color.set(cor); im.material.opacity = opacidade;
      const head = progresso * (rota.L + col);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(rp, 1, rp);
      for (let i = 0; i < im.count; i++) {
        const u = hash(i), s = head - col * u;
        const {p, rumo} = naRota(rota, s);
        const chegou = Math.min(1, Math.max(0, (s - rota.L) / (col * 0.5)));
        const a = rumo * D2R + Math.PI / 2, jl = (hash(i + 0.37) - 0.5) * 2 * larg;
        p.x += Math.sin(a) * jl; p.z -= Math.cos(a) * jl;
        const ang = hash(i + 0.71) * Math.PI * 2, rr = Math.sqrt(hash(i + 0.13)) * 14 * Q.kmpx * chegou;
        p.x += Math.cos(ang) * rr; p.z += Math.sin(ang) * rr;
        im.setMatrixAt(i, m4.compose(p, q, s < 0 ? ZERO : sc));
      }
      im.instanceMatrix.needsUpdate = true;
      setLinha(ateS(rota, Math.min(head, rota.L)), {cor, largura: 2, opac: 0.7 * opacidade});
      return;
    }
    const s = progresso * rota.L;
    const pts = ateS(rota, s);
    setLinha(pts, {cor, largura: lw, opac: opacidade, tracejada: estilo === 'tracejada', dash: 10 * Q.kmpx});
    if (ponta && progresso < 0.999) disco(pts[pts.length - 1], 4.5 * Q.kmpx, cor, opacidade);
    if (rot) {
      const meio = naRota(rota, rota.L / 2).p;
      rotulo({tamanho: 24, cor: COR.dado, ...rot, lonlat: meio, opacidade: (rot.opacidade ?? 1) * Math.min(1, Math.max(0, (progresso - 0.5) * 4)) * opacidade});
    }
  };

  const anel = (a) => {
    const {centro, raio_km, progresso = 1, cor = COR.perigo, rotulo: rot, largura: lw = 3, opacidade = 1, estilo = 'solida'} = a;
    if (progresso <= 0 || opacidade <= 0) return;
    const c = lonlatParaMundo(centro), r = raio_km * escalaEm(centro[1]);
    const N = Math.max(2, Math.ceil(128 * progresso));
    const pts = [];
    for (let i = 0; i <= N; i++) { const th = (i / N) * progresso * Math.PI * 2; pts.push(new THREE.Vector3(c.x + Math.sin(th) * r, 0, c.z - Math.cos(th) * r)); }
    setLinha(pts, {cor, largura: lw, opac: opacidade, tracejada: estilo === 'tracejada', dash: 8 * Q.kmpx, ordem: ORDEM.aneis});
    if (rot) {
      const th = (a.rotulo_angulo ?? 45) * D2R, ro = typeof rot === 'string' ? {} : rot;   // ângulo horário a partir do norte
      const p = new THREE.Vector3(c.x + Math.sin(th) * r, 0, c.z - Math.cos(th) * r);
      rotulo({tamanho: 26, cor: COR.dado, ancora: ro.ancora ?? (Math.sin(th) >= 0 ? 'd' : 'e'), ...(typeof rot === 'string' ? {texto: rot} : rot), lonlat: p,
        opacidade: opacidade * Math.min(1, Math.max(0, (progresso - 0.6) * 3)) * (typeof rot === 'object' ? rot.opacidade ?? 1 : 1)});
    }
  };

  // navio: {lonlat, rumo_graus} ou {rota, progresso}; com calado_m dentro do Jade ele para onde a água fica mais rasa
  const navio = (nv) => {
    const {cor = COR.dado, escala = 1, opacidade = 1, calado_m} = nv;
    if (opacidade <= 0) return null;
    let p, rumo = nv.rumo_graus ?? 0, parou = false;
    if (nv.rota) {
      const rota = rotaMundo(nv.rota, nv.suave ?? true);
      let s = (nv.progresso ?? 0) * rota.L;
      if (calado_m != null) {   // primeira posição da rota com menos água que o calado (passo de ~100 m)
        const passo = 0.1;
        for (let x = 0; x <= s; x += passo) {
          const pr = profJade(mundoParaLonlat(naRota(rota, x).p));
          if (pr === null || (pr !== undefined && pr < calado_m)) { s = Math.max(0, x - passo); parou = true; break; }
        }
      }
      const r = naRota(rota, s);
      p = r.p; rumo = nv.rumo_graus ?? r.rumo;
    } else p = lonlatParaMundo(nv.lonlat);
    const g = navioPool.prox();
    const L = 46 * escala * Q.kmpx;
    g.position.copy(p);
    g.rotation.y = -rumo * D2R;
    g.scale.setScalar(L);
    g.userData.corpo.material.color.set(cor);
    g.userData.corpo.material.opacity = opacidade;
    g.userData.halo.material.opacity = 0.75 * opacidade;
    if (parou && (nv.marca_parada ?? true)) {   // barra laranja na proa: a borda do raso
      const a = rumo * D2R, f = new THREE.Vector3(Math.sin(a), 0, -Math.cos(a)), l = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      const b = p.clone().addScaledVector(f, L * 0.62);
      setLinha([b.clone().addScaledVector(l, -L * 0.45), b.clone().addScaledVector(l, L * 0.45)], {cor: COR.perigo, largura: 4, opac: opacidade * (nv.parada_opac ?? 1), ordem: ORDEM.navios + 0.2});
    }
    return {p, rumo, parou, lonlat: mundoParaLonlat(p)};
  };

  // seta (vetor): {de, para, progresso, cor, largura_px}; cresce da base para a ponta
  const seta = (sa) => {
    const {de, para, progresso = 1, cor = COR.dado, largura_px = 7, opacidade = 1} = sa;
    if (progresso <= 0 || opacidade <= 0) return;
    const a = lonlatParaMundo(de), b = lonlatParaMundo(para);
    const d = b.clone().sub(a), Lt = d.length(), L = Lt * progresso;
    const w = largura_px * Q.kmpx, hp = Math.min(L * 0.5, w * 3.2);
    const g = setaPool.prox();
    g.position.copy(a);
    g.rotation.y = Math.atan2(-d.z, d.x);
    g.userData.haste.scale.set(Math.max(1e-3, L - hp), 1, w);
    g.userData.ponta.position.set(L - hp, 0, 0);
    g.userData.ponta.scale.set(hp, 1, w * 2.6);
    g.userData.m.color.set(cor);
    g.userData.m.opacity = opacidade;
  };

  const pools = [linhaPool, discoPool, enxamePool, navioPool, setaPool, spritePool, deitadoPool];
  const set = (t, e) => {
    grupo.visible = !!e;
    if (!e) return {};
    const cam = cameraPara({area: e.area, ...(e.camera || {})});
    const th = Math.tan((cam.fov * D2R) / 2);
    Q = {kmpx: (2 * cam.dist * th) / altura, spx: th / (altura / 2), cam};
    for (const p of pools) p.ini();
    // faixas do Jade: bool ou {opacidade, limites:[2,7], linha_m, linha_opac}
    const fj = e.faixasJade === true ? {} : e.faixasJade || null;
    jade.visible = !!fj && (fj.opacidade ?? 1) > 0;
    if (fj) {
      const u = jadeMat.uniforms;
      u.uOpac.value = fj.opacidade ?? 1;
      u.uLim.value.set(...(fj.limites || [2, 7]));
      u.uLinhaM.value = fj.linha_m ?? 8.4;
      u.uLinhaO.value = fj.linha_opac ?? 0;
      const lc = fj.linha_centro ? lonlatParaMundo(fj.linha_centro) : null;   // linha só perto deste ponto (raio em km)
      u.uLinhaC.value.set(lc ? lc.x : 0, lc ? lc.z : 0, lc ? (fj.linha_raio_km ?? 5) * escalaEm(fj.linha_centro[1]) : 0);
    }
    costaMat.opacity = e.costa_opac ?? 1;
    for (const s of e.setas || []) seta(s);
    for (const tr of e.trilhas || []) trilha(tr);
    for (const a of e.aneis || []) anel(a);
    const navios = (e.navios || []).map(navio);
    for (const r of e.rotulos || []) rotulo(r);
    for (const p of pools) p.fim();
    return {cam, navios};
  };

  return {grupo, set, lonlatParaMundo, cameraPara, profJade, rotaMundo, naRota, distKm};
}
