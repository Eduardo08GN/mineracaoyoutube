// K17 Pioniere 1870: batedor do MAPA "atlas creme" (design system do Kriegsmomente: papel, tinta, escrita do K15).
// Camadas (receita do levantamento de 04/11): papel (multiply) → relevo sépia assado (Copernicus, gdaldem) → curvas de nível a
// tinta (do DEM, no shader) → territórios de 1870 com faixa de cor interna na fronteira (Grenzkolorit) → rios que se desenham →
// seta de avanço com cauda afinando, levantada do papel com sombra → símbolo da ponte de pontões (a única tinta vermelha) →
// rótulos em IM Fell sem sobreposição → data escrita. A base é maior que qualquer enquadramento e se dissolve no papel nas bordas:
// o mapa nunca aparece como uma placa solta. render(t) é função pura do tempo.
import * as THREE from 'three';
import {Line2} from 'three/addons/lines/Line2.js';
import {LineGeometry} from 'three/addons/lines/LineGeometry.js';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';
import {runSim} from 'teardown-kit/runtime.js';
import {clamp01, easeInOutCubic, keyed} from 'teardown-kit/util.js';
import demB64 from './assets/dem16.png';
import hsB64 from './assets/hillshade.png';
import papelB64 from './assets/papel.png';
import fellIt from './font/imfell-it.woff2';
import fellRm from './font/imfell-rm.woff2';
import GEO from './geo.json';
import META from './assets/meta.json';

const D2R = Math.PI / 180;
const ss = (a, b, t) => easeInOutCubic(clamp01((t - a) / (b - a)));
const INK = '#2a2622', ACC = '#a4402a', PREUSSEN = '#24384f', FRANKREICH = '#7a5a3c', PAPIER = '#e9e1d0';
// projeção = a do assado (eqc com escala verdadeira em φ0), em km; z = -norte
const KX = (META.R * Math.cos(META.phi0 * D2R) * D2R) / 1000, KY = (META.R * D2R) / 1000;
const YM = (META.y[0] + META.y[1]) / 2000;
const P = (lon, lat) => [(lon - META.lam0) * KX, -(lat * KY - YM)];
const X0 = META.x[0] / 1000, X1 = META.x[1] / 1000, W = X1 - X0, H = (META.y[1] - META.y[0]) / 1000;

// ---------------------------------------------------------------- takes do batedor
// cam em km (alvo no mapa); cada take com intenção própria: abrir o lugar, mostrar o avanço, descer ao rio, ir ao Mosa
const PAM = P(6.054, 48.905), DON = P(4.873, 49.698), METZ = P(6.176, 49.12);
const TAKES = [
  {id: 'lothringen', dur: 6, data: 'August 1870', rios: [0.3, 3.0], cam: [[0, {pos: [8, 120, 95], tgt: [-2, 0, -6], fov: 34}], [6, {pos: [4, 104, 84], tgt: [0, 0, -8], fov: 34}]]},
  {id: 'vorstoss', dur: 6, data: '15. August 1870', pfeil: [{de: 'saar', t: [0.4, 4.6], larg: 0.75}], cam: [[0, {pos: [40, 118, 104], tgt: [16, 0, 2], fov: 34}], [6, {pos: [30, 100, 94], tgt: [12, 0, 4], fov: 34}]]},
  {id: 'brueckenschlag', dur: 6, data: '16. August 1870', pfeil: [{de: 'saar', t: [-9, -8], larg: 0.12}], bruecke: {at: PAM, t: [1.2, 4.2], esc: 1.0},
    cam: [[0, {pos: [PAM[0] + 9, 8.5, PAM[1] + 12], tgt: [PAM[0], 0.3, PAM[1]], fov: 30}], [6, {pos: [PAM[0] + 4, 5.2, PAM[1] + 11], tgt: [PAM[0] - 0.5, 0.3, PAM[1]], fov: 28}]]},
  {id: 'maas', dur: 6, data: '31. August 1870', pfeil: [{de: 'saar', t: [-9, -8], larg: 0.32}, {de: 'maas', t: [0.5, 4.2], larg: 0.32}], bruecke: {at: DON, t: [3.6, 5.4], esc: 3.0},
    cam: [[0, {pos: [DON[0] + 46, 58, DON[1] + 56], tgt: [DON[0] + 22, 0, DON[1] + 18], fov: 32}], [6, {pos: [DON[0] + 26, 38, DON[1] + 40], tgt: [DON[0] + 8, 0, DON[1] + 8], fov: 30}]]},
];
let acc = 0;
for (const k of TAKES) (k.t0 = acc), (acc += k.dur);
export const DURATION = acc;
const takeAt = (t) => TAKES.filter((k) => k.t0 <= t).pop();
const camAt = (k, u) => {
  const pick = (f) => keyed(k.cam.map(([a, c]) => [a, f(c)]), u, easeInOutCubic);
  return {pos: pick((c) => c.pos), tgt: pick((c) => c.tgt), fov: pick((c) => c.fov)};
};
// rotas das setas (lon/lat), suavizadas por Catmull-Rom; a da Saar cruza o Mosela em Pont-à-Mousson; a do Mosa vai a Donchery
const ROTAS = {
  saar: [[6.95, 49.2], [6.62, 49.05], [6.3, 48.95], [6.054, 48.905], [5.8, 48.95]],
  maas: [[5.6, 49.25], [5.35, 49.45], [5.1, 49.6], [4.873, 49.698], [4.72, 49.73]],
};

const img = (b64) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = `data:image/png;base64,${b64}`; });
// flipY = false: a linha 0 da imagem (GDAL) é o NORTE, igual à projeção (z = -norte) e ao alt() que lê os pixels
const tex = (i, rep = false) => { const t = new THREE.Texture(i); t.flipY = false; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = rep ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping; t.needsUpdate = true; return t; };

// territórios de 1870 num canvas em UV do mapa: cor chapada leve + faixa interna mais forte na fronteira + linha tracejada
function territorios() {
  const c = document.createElement('canvas');
  c.width = 4096;
  c.height = Math.round(4096 * (H / W));
  const g = c.getContext('2d');
  const toPx = ([lon, lat]) => { const [x, z] = P(lon, lat); return [((x - X0) / W) * c.width, ((z + H / 2) / H) * c.height]; };
  const COR = {frankreich_1870: [150, 64, 42], norddeutscher_bund: [36, 56, 79], belgien: [120, 120, 110], luxemburg: [120, 120, 110], bayern: [36, 56, 79], baden: [36, 56, 79]};
  for (const [id, rings] of Object.entries(GEO.fronteiras)) {
    const [r, gg, b] = COR[id] || [110, 110, 110];
    g.save();
    g.beginPath();
    for (const ring of rings) ring.forEach((p, i) => (i ? g.lineTo(...toPx(p)) : g.moveTo(...toPx(p))));
    g.fillStyle = `rgba(${r},${gg},${b},0.10)`;
    g.fill('evenodd');
    g.clip('evenodd');
    g.lineWidth = 46;
    g.strokeStyle = `rgba(${r},${gg},${b},0.34)`;
    g.stroke();
    g.restore();
  }
  g.setLineDash([22, 10, 4, 10]);
  g.lineWidth = 3.2;
  g.strokeStyle = 'rgba(42,38,34,0.55)';
  for (const rings of Object.values(GEO.fronteiras)) for (const ring of rings) { g.beginPath(); ring.forEach((p, i) => (i ? g.lineTo(...toPx(p)) : g.moveTo(...toPx(p)))); g.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.flipY = false;
  t.anisotropy = 8;
  return t;
}

const TERRA_V = /* glsl */ `uniform sampler2D uDem; uniform vec4 uBox; uniform float uExag; varying vec2 vUv; varying vec2 vW; varying float vH;
  void main(){ vec3 p = position; vec2 uv = vec2((p.x - uBox.x) / uBox.z, (p.z - uBox.y) / uBox.w); vUv = uv;
    float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
    float h = texture2D(uDem, vec2(uv.x, uv.y)).r * inside; vH = h; vW = p.xz;
    p.y = h * uExag; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`;
const TERRA_F = /* glsl */ `uniform sampler2D uHs; uniform sampler2D uPapel; uniform sampler2D uTerr; uniform vec2 uZ; uniform vec3 uPap; varying vec2 vUv; varying vec2 vW; varying float vH;
  void main(){
    vec3 pap = texture2D(uPapel, vW * 0.045).rgb; pap = mix(uPap, uPap * (0.86 + 0.28 * pap), 0.55);
    float hs = texture2D(uHs, vUv).r;
    float hm = uZ.x + vH * (uZ.y - uZ.x);
    vec3 tint = mix(vec3(0.95, 0.94, 0.86), vec3(0.92, 0.85, 0.72), smoothstep(150.0, 600.0, hm));
    vec3 sombra = vec3(0.48, 0.38, 0.28);
    vec3 col = pap * tint * mix(vec3(1.0), mix(sombra, vec3(1.05), smoothstep(0.1, 0.9, hs)), 0.55);
    // curvas de nível: 50 m finas, 250 m mais fortes (técnica monolith-terrain: fwidth)
    float c1 = abs(fract(hm / 50.0 - 0.5) - 0.5) / max(fwidth(hm / 50.0), 1e-4);
    float c5 = abs(fract(hm / 250.0 - 0.5) - 0.5) / max(fwidth(hm / 250.0), 1e-4);
    col = mix(col, vec3(0.42, 0.32, 0.22), (1.0 - min(c1, 1.0)) * 0.14 + (1.0 - min(c5 / 1.4, 1.0)) * 0.30);
    vec4 terr = texture2D(uTerr, vUv); col = mix(col, col * (1.0 - terr.a) + terr.rgb * terr.a, 1.0);
    // a borda do dado se dissolve no papel (nunca uma placa)
    float dIn = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    float e = smoothstep(0.0, 0.07, dIn);
    col = mix(pap, col, e);
    gl_FragColor = vec4(col, 1.0); }`;

// fita de seta: corpo afinando na cauda, cabeça na tangente, cresce com k (0..1); sombra = cópia escura deslocada
function fitaSeta(pts, k, larg, cor, y) {
  const n = Math.max(2, Math.floor(pts.length * k));
  const P2 = pts.slice(0, n);
  const pos = [], idx = [];
  for (let i = 0; i < P2.length; i++) {
    const a = P2[Math.max(0, i - 1)], b = P2[Math.min(P2.length - 1, i + 1)];
    const tx = b.x - a.x, tz = b.z - a.z, L = Math.hypot(tx, tz) || 1;
    const nx = -tz / L, nz = tx / L, s = i / (pts.length - 1);
    const w = larg * (0.35 + 0.65 * Math.min(1, s / 0.35));
    const yy = P2[i].y + y;
    pos.push(P2[i].x + nx * w, yy, P2[i].z + nz * w, P2[i].x - nx * w, yy, P2[i].z - nz * w);
    if (i) idx.push((i - 1) * 2, i * 2, (i - 1) * 2 + 1, i * 2, i * 2 + 1, (i - 1) * 2 + 1);
  }
  const e = P2[P2.length - 1], f = P2[Math.max(0, P2.length - 2)];
  const tx = e.x - f.x, tz = e.z - f.z, L = Math.hypot(tx, tz) || 1, ux = tx / L, uz = tz / L, nx = -uz, nz = ux, hw = larg * 2.1, hl = larg * 3.4;
  const b0 = pos.length / 3;
  const ye = e.y + y;
  pos.push(e.x + nx * hw, ye, e.z + nz * hw, e.x - nx * hw, ye, e.z - nz * hw, e.x + ux * hl, ye, e.z + uz * hl);
  idx.push(b0, b0 + 1, b0 + 2);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

export const run = () =>
  runSim({duration: DURATION, fps: 24, theme: 'light', hud: {enabled: false, title: 'karte', subtitle: ''}, director: {enabled: false}, watermark: ''}, async ({canvas, capture}) => {
    for (const [n, b] of [['IM Fell', fellIt], ['IM Fell Roman', fellRm]]) { const f = new FontFace(n, `url(data:font/woff2;base64,${b}) format('woff2')`); document.fonts.add(f); await f.load(); }
    const [iDem, iHs, iPap] = await Promise.all([img(demB64), img(hsB64), img(papelB64)]);
    const renderer = new THREE.WebGLRenderer({canvas, antialias: true, preserveDrawingBuffer: true});
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(PAPIER);
    const camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.05, 3000);
    // terreno: plano 1,8× maior que o dado (a borda some no papel)
    const terra = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.8, H * 1.8, 900, Math.round(900 * H / W)).rotateX(-Math.PI / 2),
      new THREE.ShaderMaterial({vertexShader: TERRA_V, fragmentShader: TERRA_F, extensions: {derivatives: true},
        uniforms: {uDem: {value: tex(iDem)}, uHs: {value: tex(iHs)}, uPapel: {value: tex(iPap, true)}, uTerr: {value: territorios()},
          uBox: {value: new THREE.Vector4(X0, -H / 2, W, H)}, uExag: {value: 4.0 * (META.z[1] - META.z[0]) / 1000}, uZ: {value: new THREE.Vector2(META.z[0], META.z[1])},
          uPap: {value: new THREE.Color(PAPIER)}}}));
    terra.position.x = (X0 + X1) / 2;
    terra.geometry.translate(0, 0, 0);
    scene.add(terra);
    // altura do terreno num ponto (para pôr rios, setas e pontes em cima do relevo)
    const dc = document.createElement('canvas'); dc.width = iDem.width; dc.height = iDem.height;
    const dg = dc.getContext('2d'); dg.drawImage(iDem, 0, 0); const dd = dg.getImageData(0, 0, dc.width, dc.height).data;
    const alt = (x, z) => { const u = (x - X0) / W, v = (z + H / 2) / H; if (u < 0 || u > 1 || v < 0 || v > 1) return 0;
      return (dd[(Math.floor(v * (dc.height - 1)) * dc.width + Math.floor(u * (dc.width - 1))) * 4] / 255) * terra.material.uniforms.uExag.value; };
    const V = (lon, lat, dy = 0.05) => { const [x, z] = P(lon, lat); return new THREE.Vector3(x, alt(x, z) + dy, z); };
    // rios (tinta azul-cinza com halo claro), desenhados por drawRange
    const RES = new THREE.Vector2(1600, 900);
    const rios = [];
    for (const [id, ls] of Object.entries(GEO.rios)) for (const l of ls) {
      const pts = l.map(([lo, la]) => V(lo, la, 0.08));
      for (const [w, c, o] of [[5.5, '#efe8da', 0.9], [2.4, '#3b5566', 1.0]]) {
        const g = new LineGeometry(); g.setPositions(pts.flatMap((p) => [p.x, p.y, p.z]));
        const m = new LineMaterial({color: c, linewidth: w * (id === 'maas' || id === 'mosel' ? 1 : 0.7), transparent: true, opacity: o, resolution: RES, depthTest: false});
        const ln = new Line2(g, m); ln.renderOrder = 2 + (c === '#3b5566'); ln.userData.n = pts.length; scene.add(ln); rios.push(ln);
      }
    }
    // setas
    const setas = {};
    for (const [id, r] of Object.entries(ROTAS)) {
      const curva = new THREE.CatmullRomCurve3(r.map(([lo, la]) => V(lo, la, 0)));
      const pts = curva.getSpacedPoints(160).map((p) => new THREE.Vector3(p.x, alt(p.x, p.z), p.z));
      // altura suavizada (média móvel larga + máximo local): a seta paira sobre o relevo sem serrilhar
      setas[id] = pts.map((p, i) => { let m = 0, s = 0, n = 0; for (let j = Math.max(0, i - 12); j <= Math.min(pts.length - 1, i + 12); j++) { s += pts[j].y; n++; m = Math.max(m, pts[j].y); } return new THREE.Vector3(p.x, 0.5 * (s / n) + 0.5 * m, p.z); });
    }
    const mSeta = new THREE.MeshBasicMaterial({color: PREUSSEN, side: THREE.DoubleSide, depthTest: false});
    const mSombra = new THREE.MeshBasicMaterial({color: '#3a2c1c', transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthTest: false});
    const meshSeta = {}, meshSombra = {};
    for (const id of Object.keys(ROTAS)) {
      meshSombra[id] = new THREE.Mesh(new THREE.BufferGeometry(), mSombra); meshSombra[id].renderOrder = 5;
      meshSeta[id] = new THREE.Mesh(new THREE.BufferGeometry(), mSeta); meshSeta[id].renderOrder = 6;
      scene.add(meshSombra[id], meshSeta[id]);
    }
    // ponte de pontões: travessas vermelhas atravessando o rio, uma a uma (a única tinta de acento)
    const ponte = new THREE.Group();
    const mPonte = new THREE.MeshBasicMaterial({color: ACC, depthTest: false});
    for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.02, 0.32), mPonte); b.position.x = (i - 4) * 0.075; b.renderOrder = 8; ponte.add(b); }
    const longo = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.02, 0.05), mPonte); longo.renderOrder = 8; ponte.add(longo);
    scene.add(ponte);

    // camada 2D: papel (vinheta, grão), data escrita, rótulos com colisão
    const app = document.getElementById('app');
    const st = document.createElement('style');
    st.textContent = `.kl{position:absolute;white-space:nowrap;color:${INK};text-shadow:0 0 4px ${PAPIER},0 0 8px ${PAPIER},0 0 12px ${PAPIER};pointer-events:none}
      .kl.fl{font:italic 30px 'IM Fell',serif;letter-spacing:4px;color:#3b5566} .kl.st{font:28px 'IM Fell Roman',serif;letter-spacing:1px} .kl.st::before{content:'';display:inline-block;width:9px;height:9px;border-radius:50%;background:${INK};margin-right:8px;vertical-align:middle}
      .kl.ac{color:${ACC};font:italic 40px 'IM Fell',serif} .kl.tr{font:italic 34px 'IM Fell',serif;letter-spacing:10px;color:rgba(42,38,34,.62)}
      #dat{position:absolute;left:70px;top:64px;font:italic 64px 'IM Fell',serif;color:${INK};white-space:nowrap;overflow:hidden}
      #pap{position:absolute;inset:0;pointer-events:none;mix-blend-mode:multiply;background:radial-gradient(ellipse 78% 72% at 50% 48%, rgba(0,0,0,0) 60%, rgba(120,86,44,.30) 100%)}
      #grain{position:absolute;inset:0;pointer-events:none;mix-blend-mode:multiply;opacity:.14;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' seed='4'/><feColorMatrix values='0 0 0 0 .45 0 0 0 0 .36 0 0 0 0 .25 0 0 0 .55 0'/></filter><rect width='400' height='400' filter='url(%23f)'/></svg>")}`;
    document.head.appendChild(st);
    const lay = document.createElement('div'); lay.style.cssText = 'position:absolute;inset:0;pointer-events:none';
    app.append(lay);
    app.insertAdjacentHTML('beforeend', '<div id="pap"></div><div id="grain"></div><div id="dat"></div>');
    const ROT = [
      ...Object.entries(GEO.cidades).map(([n, [lo, la]]) => ({txt: n, cls: 'st', at: () => V(lo, la), pri: n === 'Metz' || n === 'Sedan' ? 3 : 1})),
      {txt: 'Mosel', cls: 'fl', at: () => V(6.12, 49.0), pri: 2}, {txt: 'Maas', cls: 'fl', at: () => V(5.2, 49.45), pri: 2},
      {txt: 'F R A N K R E I C H', cls: 'fl tr', at: () => V(5.25, 49.05), pri: 4}, {txt: 'P R E U S S E N', cls: 'fl tr', at: () => V(6.75, 49.55), pri: 4},
    ];
    const els = ROT.map((r) => { const d = document.createElement('div'); d.className = `kl ${r.cls}`; d.textContent = r.txt; lay.appendChild(d); return d; });
    const lblPonte = document.createElement('div'); lblPonte.className = 'kl ac'; lblPonte.textContent = 'Pontonbrücke'; lay.appendChild(lblPonte);
    const proj = (v) => { const p = v.clone().project(camera); return p.z > 1 ? null : [(p.x * 0.5 + 0.5) * 1600, (-p.y * 0.5 + 0.5) * 900]; };
    const frame = (k, u) => { const c = camAt(k, u); camera.position.set(...c.pos); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.lookAt(...c.tgt); camera.updateMatrixWorld(); };
    // colocação de rótulos: calculada no MEIO do take (estável dentro do take, determinística), gulosa por prioridade, 4 posições
    const lugares = (k) => {
      frame(k, k.dur / 2);
      const ocup = [], res = [];
      const ord = ROT.map((r, i) => i).sort((a, b) => ROT[b].pri - ROT[a].pri);
      for (const i of ord) {
        const p = proj(ROT[i].at()); const w = els[i].offsetWidth, h = els[i].offsetHeight;
        if (!p) { res[i] = null; continue; }
        const cands = [[12, -h / 2], [-w - 12, -h / 2], [-w / 2, -h - 10], [-w / 2, 10]];
        res[i] = null;
        for (const [dx, dy] of cands) {
          const b = [p[0] + dx, p[1] + dy, p[0] + dx + w, p[1] + dy + h];
          if (b[0] < 30 || b[2] > 1570 || b[1] < 150 || b[3] > 870) continue;
          if (ocup.some((o) => !(b[2] < o[0] || b[0] > o[2] || b[3] < o[1] || b[1] > o[3]))) continue;
          ocup.push([b[0] - 6, b[1] - 4, b[2] + 6, b[3] + 4]); res[i] = [dx, dy]; break;
        }
      }
      return res;
    };
    const cacheLug = new Map();
    renderer.setSize(1600, 900, false);
    const resize = () => renderer.setPixelRatio(capture ? devicePixelRatio || 1 : 1);
    resize();
    return {
      resize,
      render(t) {
        const k = takeAt(t), u = t - k.t0;
        if (!cacheLug.has(k.id)) cacheLug.set(k.id, lugares(k));
        frame(k, u);
        // rios se desenham no primeiro take e ficam
        const kr = k.rios ? ss(k.rios[0], k.rios[1], u) : 1;
        for (const ln of rios) ln.geometry.instanceCount = Math.max(1, Math.floor((ln.userData.n - 1) * kr));
        // setas
        for (const id of Object.keys(ROTAS)) {
          const s = (k.pfeil || []).find((p) => p.de === id);
          const L = s?.larg ?? 0.9, o = L * 0.45;
          const kk = s ? ss(s.t[0], s.t[1], u) : 0;
          meshSeta[id].visible = meshSombra[id].visible = kk > 0.01;
          if (kk > 0.01) {
            meshSeta[id].geometry.dispose(); meshSombra[id].geometry.dispose();
            meshSeta[id].geometry = fitaSeta(setas[id], kk, L, PREUSSEN, L * 0.9);
            meshSombra[id].geometry = fitaSeta(setas[id].map((p) => new THREE.Vector3(p.x + o, p.y, p.z + o)), kk, L * 1.05, '#000', 0.05);
          }
        }
        // ponte
        const B = k.bruecke;
        ponte.visible = !!B;
        lblPonte.style.opacity = 0;
        if (B) {
          const kp = ss(B.t[0], B.t[1], u);
          const [x, z] = B.at;
          ponte.position.set(x, alt(x, z) + 0.06, z);
          ponte.scale.setScalar(B.esc ?? 1);
          ponte.children.forEach((c, i) => (c.visible = i === ponte.children.length - 1 ? kp > 0.95 : kp * 9 > i));
          const p = proj(ponte.position);
          if (p && kp > 0.3) { lblPonte.style.opacity = ss(B.t[0] + 0.6, B.t[0] + 1.2, u); lblPonte.style.left = `${p[0] + 40}px`; lblPonte.style.top = `${p[1] - 70}px`; }
        }
        // rótulos (posição escolhida no meio do take) e entrada suave
        const lug = cacheLug.get(k.id);
        ROT.forEach((r, i) => {
          const p = proj(r.at()), L = lug[i];
          els[i].style.opacity = p && L ? ss(0.3 + i * 0.05, 0.9 + i * 0.05, u) : 0;
          if (p && L) { els[i].style.left = `${p[0] + L[0]}px`; els[i].style.top = `${p[1] + L[1]}px`; }
        });
        // data escrita da esquerda para a direita (máscara)
        const dat = document.getElementById('dat');
        dat.textContent = k.data;
        dat.style.clipPath = `inset(0 ${100 - 100 * ss(0.2, 1.4, u)}% 0 0)`;
        renderer.render(scene, camera);
        return {};
      },
    };
  });
