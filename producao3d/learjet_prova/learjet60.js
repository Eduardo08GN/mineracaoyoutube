// O Learjet 60 construído por código. Método da teardown (referência real, medidas reais, peça que trabalha separada)
// + forma pelo pipeline da skill threejs-procedural-geometry (casco = UM loft dirigido por trilhos de parâmetros por estação,
// superfícies = wingLoft de perfil arqueado), via kit3d.js (MIT, scottstts). 04/11: o torno anterior dava um cilindro.
// Referência de proporção: perfil técnico lateral do Learjet 60 (Norebbo, só comparação interna). Comprimento 17,88 m,
// envergadura 13,34 m, diâmetro ~1,96 m. Material pelas regras da teardown: nada de branco puro, rugosidade >= 0,45 nas
// superfícies grandes, reflexo ~0,5.
// Eixos: x da proa (-) para a cauda (+), y para cima, z para a ESQUERDA (+z = asa esquerda). Origem no meio do comprimento.
import * as THREE from 'three';
import {latheX, loftLoops, V2, V3, wingLoft} from './kit3d.js';

const OX = 8.94; // x da proa -> x local
const dih = Math.tan((2.5 * Math.PI) / 180);

// ---------------------------------------------------------------- trilhos de parâmetros do casco (x em m da proa)
const track = (knots) => (x) => {
  const n = knots.length;
  if (x <= knots[0][0]) return knots[0][1];
  if (x >= knots[n - 1][0]) return knots[n - 1][1];
  let i = 0;
  while (knots[i + 1][0] < x) i++;
  const k = (j) => knots[Math.max(0, Math.min(n - 1, j))];
  const [x1, p1] = k(i), [x2, p2] = k(i + 1), p0 = k(i - 1)[1], p3 = k(i + 2)[1];
  const s = (x - x1) / (x2 - x1);
  return 0.5 * (2 * p1 + (-p0 + p2) * s + (2 * p0 - 5 * p1 + 4 * p2 - p3) * s * s + (-p0 + 3 * p1 - 3 * p2 + p3) * s * s * s);
};
const HULL = {
  // dorso: nariz caído, para-brisa subindo, dorso reto, descida suave até a cauda
  top: track([[0, -0.2], [0.3, -0.02], [0.9, 0.2], [1.7, 0.36], [2.3, 0.46], [2.8, 0.64], [3.3, 0.86], [3.8, 0.952], [4.4, 0.978], [10.6, 0.98], [12.2, 0.94], [13.6, 0.86], [15.0, 0.75], [16.2, 0.62], [16.95, 0.52]]),
  // quilha: queixo sob o nariz, barriga reta, subida longa do cone de cauda
  bot: track([[0, -0.26], [0.3, -0.46], [0.9, -0.67], [1.7, -0.83], [2.7, -0.93], [3.8, -0.968], [4.6, -0.975], [10.4, -0.975], [11.8, -0.87], [13.2, -0.64], [14.6, -0.35], [15.8, -0.04], [16.95, 0.3]]),
  // meia-largura: em planta o nariz afina mais e a cauda estreita antes da altura (cone em oval vertical)
  w: track([[0, 0.03], [0.3, 0.27], [0.9, 0.52], [1.7, 0.72], [2.6, 0.86], [3.6, 0.94], [4.5, 0.955], [10.6, 0.955], [12.2, 0.84], [13.6, 0.65], [15.0, 0.45], [16.2, 0.27], [16.95, 0.14]]),
  // altura da largura máxima: abaixo do centro no nariz (queixo), sobe na cauda
  yw: track([[0, -0.24], [1.7, -0.14], [3.3, -0.04], [4.4, 0], [10.6, 0], [13.6, 0.1], [16.95, 0.4]]),
  // expoentes da seção: em cima elipse, embaixo um pouco mais chato na cabine
  et: track([[0, 2.0], [16.95, 2.0]]),
  eb: track([[0, 2.0], [4, 2.35], [10.8, 2.35], [14, 2.1], [16.95, 2.0]]),
};
function hullRing(X, n = 112) {
  const top = HULL.top(X), bot = HULL.bot(X), w = HULL.w(X), yw = Math.min(top - 0.01, Math.max(bot + 0.01, HULL.yw(X)));
  const et = HULL.et(X), eb = HULL.eb(X);
  const loop = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    const e = sa >= 0 ? et : eb;
    const z = Math.sign(ca) * Math.pow(Math.abs(ca), 2 / e) * w;
    const y = sa >= 0 ? yw + Math.pow(sa, 2 / et) * (top - yw) : yw - Math.pow(-sa, 2 / eb) * (yw - bot);
    loop.push(V3(X - OX, y, z));
  }
  return loop;
}
function hullGeometry(rows = 220) {
  const loops = [];
  for (let i = 0; i <= rows; i++) {
    const t = i / rows;
    const X = 0.02 + (16.95 - 0.02) * (t < 0.3 ? 0.3 * Math.pow(t / 0.3, 1.6) : t); // mais anéis no nariz
    loops.push(hullRing(X));
  }
  return loftLoops(loops, {capStart: true, capEnd: true, capSegs: 8, capBulge: 0.85});
}

// ---------------------------------------------------------------- estabilizador e profundor (loft simples, corda separável)
const naca = (x, t) => 5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4);
function loftChord(secs, {th, c0 = 0, c1 = 1, n = 28}) {
  const T = new THREE.Vector3(...th), C = new THREE.Vector3(1, 0, 0);
  const ring = (s) => {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const u = c0 + (c1 - c0) * (0.5 - 0.5 * Math.cos((Math.PI * i) / n));
      out.push([u, naca(u, s.t)]);
    }
    const up = out.map(([u, h]) => new THREE.Vector3(...s.le).addScaledVector(C, u * s.chord).addScaledVector(T, h * s.chord));
    const dn = out.slice().reverse().map(([u, h]) => new THREE.Vector3(...s.le).addScaledVector(C, u * s.chord).addScaledVector(T, -h * s.chord));
    return up.concat(dn);
  };
  const R = secs.map(ring), m = R[0].length, pos = [], idx = [];
  for (const r of R) for (const p of r) pos.push(p.x, p.y, p.z);
  for (let a = 0; a < R.length - 1; a++)
    for (let j = 0; j < m - 1; j++) {
      const p = a * m + j, q = p + m;
      idx.push(p, q, p + 1, q, q + 1, p + 1);
    }
  for (const [a, flip] of [[0, true], [R.length - 1, false]]) {
    const c = R[a].reduce((s, p) => s.add(p), new THREE.Vector3()).multiplyScalar(1 / m), ci = pos.length / 3;
    pos.push(c.x, c.y, c.z);
    for (let j = 0; j < m - 1; j++) flip ? idx.push(ci, a * m + j, a * m + j + 1) : idx.push(ci, a * m + j + 1, a * m + j);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const X3 = (x, y, z) => V3(x - OX, y, z);
const AX = V3(1, 0, 0), UP = V3(0, 1, 0);

export function buildLearjet60() {
  const root = new THREE.Group();
  root.name = 'Learjet60';
  const paint = new THREE.MeshStandardMaterial({color: '#d2d6da', metalness: 0.0, roughness: 0.72, envMapIntensity: 0.3, side: THREE.DoubleSide});
  const dark = new THREE.MeshStandardMaterial({color: '#2a2f35', metalness: 0.0, roughness: 0.6});
  const add = (g, m = paint, name = '') => {
    const o = new THREE.Mesh(g, m);
    o.name = name;
    o.castShadow = o.receiveShadow = true;
    root.add(o);
    return o;
  };

  // casco com janelas e para-brisa pintados no shader (máscara pelas coordenadas locais)
  const fusMat = paint.clone();
  fusMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLp;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLp = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vLp;
        float rbox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }`)
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', `vec4 diffuseColor = vec4( diffuse, opacity );
        float side = smoothstep(0.45, 0.62, abs(vLp.z));
        float win = 0.0;
        // 8 fendas: 0,2 x 0,5 m, inclinadas 16°, passo 0,54 m, de x 5,6 a 9,4 m da proa
        for (int i = 0; i < 8; i++) {
          vec2 p = vec2(vLp.x - (5.0 + 0.56 * float(i) - ${OX.toFixed(2)}), vLp.y - 0.2);
          p = mat2(0.961, -0.276, 0.276, 0.961) * p;
          win = max(win, 1.0 - smoothstep(-0.006, 0.006, rbox(p, vec2(0.1, 0.25), 0.07)));
        }
        win *= side;
        // para-brisa: trapézio escuro na subida do dorso, de x 3,2 a 4,45 m
        float xr = vLp.x + ${OX.toFixed(2)};
        float ws = step(2.35, xr) * step(xr, 3.75) * step(0.24 + clamp(3.1 - xr, 0.0, 1.0) * 0.38, vLp.y) * step(abs(vLp.z), 0.72) * step(vLp.y, 0.965);
        float m = max(win, ws);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.035, 0.045, 0.06), m);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(0.62, 0.76, smoothstep(-7.0, 6.0, vLp.x));\nroughnessFactor = mix(roughnessFactor, 0.3, max(win, ws));'); // nariz mais liso, cauda mais fosca
  };
  add(hullGeometry(), fusMat, 'casco');

  // carenagem asa-fuselagem: barriga alongada e suave sob a raiz da asa
  const fair = add(new THREE.SphereGeometry(1, 64, 32), paint, 'carenagem');
  fair.scale.set(2.5, 0.3, 0.88);
  fair.position.set(8.4 - OX, -0.72, 0);

  for (const s of [1, -1]) {
    const SP = V3(0, 0, s);
    // asa baixa (wingLoft: perfil arqueado, enflechamento ~13°, diedro 2,5°)
    const st = (x, y, z, chord, thick, camber = 0.02, inc = 0.02) => ({le: X3(x, y, s * z), chord, incidence: inc, chordDir: AX, upDir: UP, spanDir: SP, section: {thick, camber, camberPos: 0.4, teThick: 0.004}});
    add(
      wingLoft([st(6.95, -0.62, 0.45, 2.9, 0.13), st(7.05, -0.6, 1.0, 2.75, 0.13), st(7.7, -0.6 + 2.6 * dih, 3.6, 1.95, 0.115), st(8.35, -0.6 + 5.1 * dih, 6.1, 1.02, 0.1, 0.015, 0)], {sectionPoints: 72, flip: s < 0}),
      paint,
      s > 0 ? 'asaE' : 'asaD',
    );
    // winglet: 4 estações girando a espessura de vertical (asa) para horizontal (winglet), raio de curva 0,25 m
    const tip = [8.35, -0.6 + 5.1 * dih, 6.1];
    const wl = [0, 30, 60, 85].map((deg, i) => {
      const f = (deg * Math.PI) / 180, R = 0.25;
      const up = V3(0, Math.cos(f), -s * Math.sin(f)).normalize(), span = V3(0, Math.sin(f), s * Math.cos(f)).normalize();
      const h = i === 3 ? 1.2 : 0;
      return {
        le: X3(tip[0] + 0.14 * i + (i === 3 ? 0.95 : 0), tip[1] + R * (1 - Math.cos(f)) + h, s * (tip[2] + R * Math.sin(f) + (i === 3 ? 0.08 : 0))),
        chord: [1.02, 0.95, 0.85, 0.4][i],
        chordDir: AX,
        upDir: up,
        spanDir: span,
        section: {thick: 0.09, camber: 0.0},
      };
    });
    add(wingLoft(wl, {sectionPoints: 64, roundTips: [false, true], flip: s < 0}), paint, s > 0 ? 'wingletE' : 'wingletD');

    // motores traseiros: nacele por torno (forma de revolução é a certa aqui) + entrada escura + pilone em wingLoft
    const prof = [[0.4, 10.95], [0.47, 10.98], [0.51, 11.08], [0.53, 11.35], [0.535, 12.0], [0.51, 12.7], [0.45, 13.2], [0.37, 13.5], [0.29, 13.56], [0.26, 14.05], [0.0, 14.12]].map(([r, x]) => V2(r, x - OX));
    const nac = add(latheX(prof, 72), paint, s > 0 ? 'motorE' : 'motorD');
    nac.position.set(0, 0.7, s * 1.55);
    const fan = add(new THREE.CircleGeometry(0.42, 48), dark, 'fan');
    fan.rotation.y = -Math.PI / 2;
    fan.position.set(11.06 - OX, 0.7, s * 1.55);
    const pst = (x, y, z, chord) => ({le: X3(x, y, s * z), chord, chordDir: AX, upDir: UP, spanDir: SP, section: {thick: 0.12, camber: 0}});
    add(wingLoft([pst(11.7, 0.5, 0.55, 1.6), pst(11.85, 0.66, 1.1, 1.35)], {sectionPoints: 48, flip: s < 0}), paint, 'pilone');
  }

  // deriva com filete dorsal (wingLoft com envergadura em y, espessura em z): a raiz longa e baixa funde no dorso
  const fst = (x, y, chord, thick) => ({le: X3(x, y, 0), chord, chordDir: AX, upDir: V3(0, 0, 1), spanDir: UP, section: {thick, camber: 0}});
  add(wingLoft([fst(11.9, 0.82, 5.0, 0.05), fst(12.9, 1.0, 3.75, 0.085), fst(14.4, 2.0, 2.35, 0.085), fst(15.95, 3.02, 1.1, 0.08)], {sectionPoints: 64}), paint, 'deriva');

  // estabilizador em T (topo da deriva), 4,4 m, enflechado; profundores nos 30 % de trás
  const hy = 3.02, hx = 15.85 - OX;
  const htSecs = (s) => [
    {le: [hx - 0.05, hy, s * 0.0], chord: 1.35, t: 0.08},
    {le: [hx + 2.1 * Math.tan(Math.PI / 5.2), hy + 0.05, s * 2.2], chord: 0.62, t: 0.07},
  ];
  const elev = [];
  for (const s of [1, -1]) {
    const sec = s > 0 ? htSecs(s) : htSecs(s).reverse();
    add(loftChord(sec, {th: [0, 1, 0], c1: 0.7}), paint, s > 0 ? 'estabE' : 'estabD');
    if (s < 0) add(loftChord(sec, {th: [0, 1, 0], c0: 0.7}), paint, 'profD');
  }
  // profundor esquerdo em 3 pedaços (a peça do vídeo), cada um com pivô na linha de articulação
  const L = htSecs(1);
  const lerp3 = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
  for (let i = 0; i < 3; i++) {
    const k0 = i / 3, k1 = (i + 1) / 3;
    const sA = {le: lerp3(L[0].le, L[1].le, k0), chord: L[0].chord + (L[1].chord - L[0].chord) * k0, t: 0.075};
    const sB = {le: lerp3(L[0].le, L[1].le, k1), chord: L[0].chord + (L[1].chord - L[0].chord) * k1, t: 0.075};
    const g = loftChord([sA, sB], {th: [0, 1, 0], c0: 0.7});
    const hinge = new THREE.Vector3(...lerp3(sA.le, sB.le, 0.5)).add(new THREE.Vector3((sA.chord + sB.chord) * 0.5 * 0.705, 0, 0));
    g.translate(-hinge.x, -hinge.y, -hinge.z);
    const piv = new THREE.Group();
    piv.position.copy(hinge);
    const mesh = new THREE.Mesh(g, paint.clone());
    mesh.castShadow = mesh.receiveShadow = true;
    piv.add(mesh);
    piv.userData.home = hinge.clone();
    root.add(piv);
    elev.push(piv);
  }

  // 04/11 (Eduardo: "simplificar, só a forma do Learjet"): sem aletas ventrais e sem luzes, que liam como peças soltas
  return {root, elev, paint};
}
