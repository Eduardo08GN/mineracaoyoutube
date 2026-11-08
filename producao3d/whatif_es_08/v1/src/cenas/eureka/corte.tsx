// Corte dos Andes como fatia de bolo 3D, com o relevo REAL (dem.f16/nivel.f16 da G4, ETOPO 2022) amostrado ao longo de um perfil.
// Face da frente = o perfil exato (camadas de rocha no corte); topo = faixa de 50 km de terreno atras do perfil; atras, uma
// "cortina de ar" pintada pela temperatura (gradiente de ~6,5 °C/km). A agua entra pelo dado (nivel.f16), como no Continente.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {DADOS} from '../../dados';

export const KM = 0.1;                    // 1 unidade = 10 km na horizontal
export const VE = 0.0021;                 // metros -> unidades (exagero vertical 21x)
export const FUNDO = 50;                  // km de terreno atras do corte
export const FRENTE = 22;                 // km da fatia da frente que sai no corte

const f16 = THREE.DataUtils.fromHalfFloat;
const amostrador = () => {
  const d = DADOS!, [O, S, E, N] = d.bounds, w = d.tw, h = d.th;
  const dem = d.tex.dem.image.data as unknown as Uint16Array, niv = d.tex.nivel.image.data as unknown as Uint16Array;
  const bil = (a: Uint16Array, lon: number, lat: number) => {
    const x = ((lon - O) / (E - O)) * (w - 1), y = ((N - lat) / (N - S)) * (h - 1), x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, i = y0 * w + x0;
    return f16(a[i]) * (1 - fx) * (1 - fy) + f16(a[i + 1]) * fx * (1 - fy) + f16(a[i + w]) * (1 - fx) * fy + f16(a[i + w + 1]) * fx * fy;
  };
  return {dem: (lon: number, lat: number) => bil(dem, lon, lat), niv: (lon: number, lat: number) => bil(niv, lon, lat)};
};

export type Perfil = {
  comp: number;                                       // km
  ll: (s: number, a: number) => [number, number];     // (km ao longo, km para tras) -> lon, lat
  sa: (lon: number, lat: number) => {s: number; a: number};
  dem: (lon: number, lat: number) => number; niv: (lon: number, lat: number) => number;
  frente: {s: number[]; dem: number[]; niv: number[]};
  base: number;                                       // m (fundo da fatia)
  pos: (lon: number, lat: number, m?: number) => [number, number, number];
};
const cache: Record<string, Perfil> = {};
export const perfil = (nome: string, pts: [number, number][]): Perfil => {
  if (cache[nome]) return cache[nome];
  const am = amostrador();
  const lat0 = pts.reduce((a, p) => a + p[1], 0) / pts.length, kx = 111.32 * Math.cos((lat0 * Math.PI) / 180), ky = 110.57;
  const P = pts.map(([lo, la]) => [(lo - pts[0][0]) * kx, (la - pts[0][1]) * ky]);
  const cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const comp = cum[cum.length - 1];
  const dx = P[P.length - 1][0] - P[0][0], dy = P[P.length - 1][1] - P[0][1], dl = Math.hypot(dx, dy), tras = [-dy / dl, dx / dl];   // esquerda do percurso
  const ponto = (s: number) => { let i = 0; while (i < cum.length - 2 && s > cum[i + 1]) i++; const f = (s - cum[i]) / (cum[i + 1] - cum[i]); return [P[i][0] + (P[i + 1][0] - P[i][0]) * f, P[i][1] + (P[i + 1][1] - P[i][1]) * f]; };
  const ll = (s: number, a: number): [number, number] => { const q = ponto(Math.max(0, Math.min(comp, s))); return [pts[0][0] + (q[0] + tras[0] * a) / kx, pts[0][1] + (q[1] + tras[1] * a) / ky]; };
  const sa = (lon: number, lat: number) => {
    const x = (lon - pts[0][0]) * kx, y = (lat - pts[0][1]) * ky; let best = {d: 1e9, s: 0, a: 0};
    for (let i = 0; i < P.length - 1; i++) {
      const ux = P[i + 1][0] - P[i][0], uy = P[i + 1][1] - P[i][1], L2 = ux * ux + uy * uy, f = Math.max(0, Math.min(1, ((x - P[i][0]) * ux + (y - P[i][1]) * uy) / L2));
      const fx = P[i][0] + ux * f, fy = P[i][1] + uy * f, d = Math.hypot(x - fx, y - fy);
      if (d < best.d) best = {d, s: cum[i] + Math.sqrt(L2) * f, a: (x - fx) * tras[0] + (y - fy) * tras[1]};
    }
    return {s: best.s, a: best.a};
  };
  const n = 700, fr = {s: [] as number[], dem: [] as number[], niv: [] as number[]};
  let mn = 0; for (let i = 0; i <= n; i++) { const s = (comp * i) / n, [lo, la] = ll(s, 0); const d = am.dem(lo, la); fr.s.push(s); fr.dem.push(d); fr.niv.push(am.niv(lo, la)); mn = Math.min(mn, d); }
  const base = Math.min(-1300, mn - 700);
  const pos = (lon: number, lat: number, m?: number): [number, number, number] => { const q = sa(lon, lat); return [q.s * KM, (m ?? am.dem(lon, lat)) * VE, -q.a * KM]; };
  return (cache[nome] = {comp, ll, sa, dem: am.dem, niv: am.niv, frente: fr, base, pos});
};
// altura do terreno na face do corte (m) em s km
export const chaoEm = (p: Perfil, s: number) => { const n = p.frente.s.length - 1, x = Math.max(0, Math.min(n, (s / p.comp) * n)), i = Math.floor(Math.min(n - 1, x)), f = x - i; return p.frente.dem[i] * (1 - f) + p.frente.dem[i + 1] * f; };

const HIPS = /* glsl */ `
vec3 hips(float m) {
  vec3 c = vec3(0.47, 0.64, 0.35);
  c = mix(c, vec3(0.62, 0.70, 0.40), smoothstep(0.0, 400.0, m));
  c = mix(c, vec3(0.80, 0.72, 0.47), smoothstep(400.0, 1500.0, m));
  c = mix(c, vec3(0.72, 0.60, 0.42), smoothstep(1500.0, 3000.0, m));
  c = mix(c, vec3(0.66, 0.62, 0.46), smoothstep(3000.0, 4100.0, m));
  c = mix(c, vec3(0.58, 0.50, 0.46), smoothstep(4100.0, 4900.0, m));
  return mix(c, vec3(0.96, 0.97, 0.99), smoothstep(4800.0, 5800.0, m));
}
vec3 agua(float prof) {
  vec3 raso = vec3(0.36, 0.83, 0.90), medio = vec3(0.10, 0.52, 0.80), fundo = vec3(0.03, 0.15, 0.34);
  float k = 1.0 - exp(-prof / 400.0);
  vec3 c = mix(raso, medio, smoothstep(0.0, 0.5, k)); return mix(c, fundo, smoothstep(0.45, 1.0, k));
}`;
// fatia da frente: cada coluna sai depois que a lamina passa (desliza para a camera, cai e some)
const SEP = /* glsl */ `
float sepDe(float x) { return uPeca > 0.5 ? clamp((uLamina - x) / 7.0, 0.0, 1.0) : 0.0; }
vec3 separa(vec3 p, float s) { return p + vec3(0.0, -s * s * s * 14.0, s * s * 16.0); }`;

const TOPO_V = /* glsl */ `
attribute float aDem, aNiv; uniform float uLw, uVE, uLamina, uPeca;
varying float vDem, vAgua, vSep, vNiv; varying vec3 vNrm, vW;
${SEP}
void main() {
  vDem = aDem; vNiv = aNiv; vAgua = aNiv <= uLw ? 1.0 : 0.0;
  float y = vAgua > 0.5 ? max(uLw, aDem) : aDem;
  vec3 p = vec3(position.x, y * uVE, position.z);
  vSep = sepDe(position.x); p = separa(p, vSep);
  vNrm = vAgua > 0.5 ? vec3(0.0, 1.0, 0.0) : normal; vW = p;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const TOPO_F = /* glsl */ `
uniform float uLw, uT; uniform vec3 uSol;
varying float vDem, vAgua, vSep, vNiv; varying vec3 vNrm, vW;
${HIPS}
void main() {
  if (vSep > 0.985) discard;
  vec3 c;
  float dif = clamp(dot(normalize(vNrm), uSol), 0.0, 1.0);
  if (vAgua > 0.5) {
    c = agua(uLw - vDem);
    float dS = uLw - vNiv, esp = 1.0 - smoothstep(0.0, 60.0, dS);
    float ondas = smoothstep(0.85, 1.0, sin(dS / 40.0 - uT * 2.4)) * (1.0 - smoothstep(60.0, 300.0, dS));
    c = mix(c, vec3(0.97, 0.99, 1.0), clamp(esp * 0.8 + ondas * 0.3, 0.0, 1.0));
    c *= 0.85 + 0.2 * dif;
  } else {
    c = hips(vDem) * (0.45 + 0.75 * dif);
    float k = vDem / 500.0, w = max(fwidth(k), 0.001), f = abs(fract(k) - 0.5);          // curvas de nivel de 500 m
    c *= 1.0 - 0.18 * (1.0 - smoothstep(0.0, w * 1.3, 0.5 - f));
  }
  gl_FragColor = vec4(c, 1.0 - vSep);
}`;

// parede do corte: camadas de rocha (bolo), agua em corte onde o mar cobre
const PAREDE_V = /* glsl */ `
attribute float aDem, aNiv, aTopo; uniform float uLw, uVE, uBase, uLamina, uPeca;
varying float vDem, vYm, vX, vSep;
${SEP}
void main() {
  float topo = aNiv <= uLw ? max(uLw, aDem) : aDem;
  vYm = mix(uBase, topo, aTopo); vDem = aDem; vX = position.x;
  vec3 p = vec3(position.x, vYm * uVE, position.z);
  vSep = sepDe(position.x); p = separa(p, vSep);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const PAREDE_F = /* glsl */ `
uniform float uLw, uLamina, uRevela, uT, uBase;
varying float vDem, vYm, vX, vSep;
${HIPS}
void main() {
  if (uRevela > 0.5 && vX > uLamina) discard;          // a face so existe onde a lamina ja passou
  if (vSep > 0.985) discard;
  vec3 c;
  float d = vDem - vYm;
  if (d < 0.0) {
    c = agua(-d + 30.0) * 0.92;
    c += vec3(0.02, 0.05, 0.06) * smoothstep(0.8, 1.0, sin(vYm / 140.0 + vX * 0.4 - uT * 1.6));
    c = mix(c, vec3(0.95, 0.99, 1.0), 1.0 - smoothstep(0.0, 35.0, uLw - vYm));       // linha da superficie
  } else {
    // estratos quase horizontais (cortados pelo relevo), como num corte geologico; so a capa de solo segue a superficie
    float w = vYm + 260.0 * sin(vX * 0.11 + 0.7) + 120.0 * sin(vX * 0.37 + 2.0) + 0.18 * d;
    float b = floor(w / 650.0), f = fract(w / 650.0), r = mod(b, 4.0);
    vec3 cam = r < 0.5 ? vec3(0.62, 0.45, 0.34) : r < 1.5 ? vec3(0.70, 0.57, 0.42) : r < 2.5 ? vec3(0.56, 0.50, 0.46) : vec3(0.52, 0.40, 0.32);
    cam *= 0.93 + 0.07 * smoothstep(0.0, 0.05, f) * smoothstep(1.0, 0.95, f);
    vec3 solo = hips(vDem) * 0.78;
    c = mix(solo, cam, smoothstep(40.0, 180.0, d));
    c *= 1.0 - 0.45 * smoothstep(0.0, 6000.0, vDem - vYm + max(0.0, -uBase) * 0.2);
    c = mix(c, vec3(1.0, 0.97, 0.9), 1.0 - smoothstep(0.0, 22.0, d));                 // fio claro da borda do corte
  }
  gl_FragColor = vec4(c, 1.0 - vSep);
}`;

// cortina de ar atras do terreno: cor pela temperatura (quente embaixo, frio em cima) + isotermas a cada 1 km
const AR_V = /* glsl */ `
attribute float aTopo, aChao; uniform float uVE, uTopo;
varying float vYm;
void main() { vYm = mix(aChao, uTopo, aTopo); gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x, vYm * uVE, position.z, 1.0); }`;
const AR_F = /* glsl */ `
uniform float uAr, uIso; varying float vYm;
void main() {
  float z = vYm / 1000.0;
  vec3 q = vec3(1.0, 0.52, 0.22), m = vec3(0.98, 0.84, 0.48), f = vec3(0.52, 0.80, 0.98), g = vec3(0.36, 0.52, 1.0);
  vec3 c = mix(q, m, smoothstep(0.0, 1.6, z)); c = mix(c, f, smoothstep(1.4, 3.2, z)); c = mix(c, g, smoothstep(3.0, 5.5, z));
  float k = z, w = max(fwidth(k), 0.0005), fr = abs(fract(k + 0.5) - 0.5);
  float iso = (1.0 - smoothstep(0.0, w * 1.6, fr)) * step(0.5, z);
  float a = uAr * (0.55 - 0.35 * smoothstep(4.0, 7.0, z)) + iso * uIso * 0.6;
  gl_FragColor = vec4(mix(c, vec3(1.0), iso * uIso * 0.6), a);
}`;

export type EstadoCorte = {Lw: number; lamina: number; ar: number; iso: number; t: number; pontosL: number; sol: [number, number, number]};

export const Corte: React.FC<{p: Perfil; e: EstadoCorte}> = ({p, e}) => {
  // ---- malhas (uma vez por perfil)
  const m = useMemo(() => {
    const ns = 560, na = 34, nf = 10;
    const grade = (a0: number, a1: number, nA: number) => {
      const pos: number[] = [], dem: number[] = [], niv: number[] = [], idx: number[] = [];
      for (let j = 0; j <= nA; j++) for (let i = 0; i <= ns; i++) {
        const s = (p.comp * i) / ns, a = a0 + ((a1 - a0) * j) / nA, [lo, la] = p.ll(s, a);
        const d = p.dem(lo, la); pos.push(s * KM, d * VE, -a * KM); dem.push(d); niv.push(p.niv(lo, la));
      }
      for (let j = 0; j < nA; j++) for (let i = 0; i < ns; i++) { const k = j * (ns + 1) + i; idx.push(k, k + 1, k + ns + 1, k + 1, k + ns + 2, k + ns + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      g.setAttribute('aDem', new THREE.Float32BufferAttribute(dem, 1)); g.setAttribute('aNiv', new THREE.Float32BufferAttribute(niv, 1));
      return {g, dem, niv};
    };
    const topo = grade(0, FUNDO, na), frente = grade(-FRENTE, 0, nf);
    // paredes: lista de colunas (x, z, dem, niv)
    const parede = (cols: [number, number, number, number][]) => {
      const pos: number[] = [], dem: number[] = [], niv: number[] = [], top: number[] = [], idx: number[] = [];
      cols.forEach(([x, z, d, n], i) => { for (let k = 0; k < 2; k++) { pos.push(x, 0, z); dem.push(d); niv.push(n); top.push(k); } if (i < cols.length - 1) { const b = i * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); } });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      g.setAttribute('aDem', new THREE.Float32BufferAttribute(dem, 1)); g.setAttribute('aNiv', new THREE.Float32BufferAttribute(niv, 1)); g.setAttribute('aTopo', new THREE.Float32BufferAttribute(top, 1));
      return g;
    };
    const col = (gr: {dem: number[]; niv: number[]}, nA: number, a0: number, a1: number, i: number) => Array.from({length: nA + 1}, (_, j) => {
      const k = j * (ns + 1) + i; return [(p.comp * i) / ns * KM, -(a0 + ((a1 - a0) * j) / nA) * KM, gr.dem[k], gr.niv[k]] as [number, number, number, number];
    });
    const face = parede(Array.from({length: ns + 1}, (_, i) => [(p.comp * i) / ns * KM, 0.001, topo.dem[i], topo.niv[i]] as [number, number, number, number]));
    const faceFr = parede(Array.from({length: ns + 1}, (_, i) => [(p.comp * i) / ns * KM, FRENTE * KM, frente.dem[i], frente.niv[i]] as [number, number, number, number]));
    const esq = parede(col(topo, na, 0, FUNDO, 0).reverse()), dir = parede(col(topo, na, 0, FUNDO, ns));
    const esqF = parede(col(frente, nf, -FRENTE, 0, 0).reverse()), dirF = parede(col(frente, nf, -FRENTE, 0, ns));
    // cortina de ar no fundo
    const ar = new THREE.BufferGeometry(), apos: number[] = [], atop: number[] = [], achao: number[] = [], aidx: number[] = [];
    for (let i = 0; i <= ns; i++) { const k = na * (ns + 1) + i; for (let q = 0; q < 2; q++) { apos.push((p.comp * i) / ns * KM, 0, -FUNDO * KM - 0.02); atop.push(q); achao.push(Math.max(topo.dem[k], 0)); } if (i < ns) { const b = i * 2; aidx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } }
    ar.setAttribute('position', new THREE.Float32BufferAttribute(apos, 3)); ar.setAttribute('aTopo', new THREE.Float32BufferAttribute(atop, 1)); ar.setAttribute('aChao', new THREE.Float32BufferAttribute(achao, 1)); ar.setIndex(aidx);
    return {topo: topo.g, frente: frente.g, face, faceFr, esq, dir, esqF, dirF, ar};
  }, [p]);
  // ---- materiais
  const mats = useMemo(() => {
    const sol = new THREE.Vector3();
    const topo = (peca: number) => new THREE.ShaderMaterial({vertexShader: TOPO_V, fragmentShader: TOPO_F, transparent: peca > 0.5,
      uniforms: {uLw: {value: 0}, uVE: {value: VE}, uLamina: {value: 0}, uPeca: {value: peca}, uT: {value: 0}, uSol: {value: sol}}});
    const par = (peca: number, revela: number) => new THREE.ShaderMaterial({vertexShader: PAREDE_V, fragmentShader: PAREDE_F, transparent: peca > 0.5, side: THREE.DoubleSide,
      uniforms: {uLw: {value: 0}, uVE: {value: VE}, uBase: {value: p.base}, uLamina: {value: 0}, uPeca: {value: peca}, uRevela: {value: revela}, uT: {value: 0}}});
    const ar = new THREE.ShaderMaterial({vertexShader: AR_V, fragmentShader: AR_F, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: {uVE: {value: VE}, uTopo: {value: 7000}, uAr: {value: 0}, uIso: {value: 0}}});
    return {sol, topo: topo(0), topoF: topo(1), face: par(0, 1), faceF: par(1, 0), lados: par(0, 0), ladosF: par(1, 0), ar};
  }, [p]);
  mats.sol.set(...e.sol).normalize();
  const lam = e.lamina;
  for (const k of ['topo', 'topoF', 'face', 'faceF', 'lados', 'ladosF'] as const) {
    const u = mats[k].uniforms; u.uLw.value = e.Lw; u.uLamina.value = lam; u.uT.value = e.t;
  }
  mats.ar.uniforms.uAr.value = e.ar; mats.ar.uniforms.uIso.value = e.iso;
  const frenteViva = e.lamina < p.comp * KM + 8;
  return (
    <group>
      <mesh geometry={m.ar} material={mats.ar} renderOrder={-1} />
      <mesh geometry={m.topo} material={mats.topo} />
      <mesh geometry={m.face} material={mats.face} />
      <mesh geometry={m.esq} material={mats.lados} />
      <mesh geometry={m.dir} material={mats.lados} />
      {frenteViva && <group>
        <mesh geometry={m.frente} material={mats.topoF} renderOrder={2} />
        <mesh geometry={m.faceFr} material={mats.faceF} renderOrder={2} />
        <mesh geometry={m.esqF} material={mats.ladosF} renderOrder={2} />
        <mesh geometry={m.dirF} material={mats.ladosF} renderOrder={2} />
      </group>}
    </group>
  );
};

// pontos de gente (GHS-POP, pontos.json) dentro da faixa: acesos acima do mar, apagam (vermelho) quando o mar chega
const PT_V = /* glsl */ `
attribute float aNiv; uniform float uL, uTam; varying float vEst;
void main() { vEst = (aNiv - uL) / 120.0; vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = vEst < -1.0 ? 0.0 : uTam * (70.0 / -mv.z) * (vEst < 0.0 ? 1.0 + 1.4 * (1.0 + vEst) : 1.0); gl_Position = projectionMatrix * mv; }`;
const PT_F = /* glsl */ `
varying float vEst;
void main() { if (vEst < -1.0) discard; float r = length(gl_PointCoord - 0.5); if (r > 0.5) discard; float a = smoothstep(0.5, 0.12, r);
  vec3 c = vEst >= 0.0 ? vec3(1.0, 0.9, 0.62) : mix(vec3(1.0, 0.25, 0.18), vec3(1.0, 0.85, 0.7), clamp(1.0 + vEst, 0.0, 1.0));
  gl_FragColor = vec4(c * a, a * (vEst >= 0.0 ? 0.95 : 1.0 + vEst)); }`;
export const Gente: React.FC<{p: Perfil; L: number; tam: number}> = ({p, L, tam}) => {
  const g = useMemo(() => {
    const d = DADOS!, pos: number[] = [], niv: number[] = [];
    d.pontos.lon.forEach((lo, i) => { const la = d.pontos.lat[i], q = p.sa(lo, la); if (q.a < 1 || q.a > FUNDO - 2 || q.s < 0 || q.s > p.comp) return;
      pos.push(q.s * KM, p.dem(lo, la) * VE + 0.06, -q.a * KM); niv.push(d.pontos.nivel[i]); });
    const b = new THREE.BufferGeometry(); b.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); b.setAttribute('aNiv', new THREE.Float32BufferAttribute(niv, 1)); return b;
  }, [p]);
  const mat = useMemo(() => new THREE.ShaderMaterial({vertexShader: PT_V, fragmentShader: PT_F, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: {uL: {value: 0}, uTam: {value: 3}}}), []);
  mat.uniforms.uL.value = L; mat.uniforms.uTam.value = tam;
  return <points geometry={g} material={mat} frustumCulled={false} renderOrder={5} />;
};

// parcela de ar: bolha que cresce (expande) e esfria (cor quente -> fria); moleculas dentro se afastam e ficam mais lentas
const BOLHA_V = /* glsl */ `varying vec3 vN, vV; void main() { vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`;
const BOLHA_F = /* glsl */ `uniform vec3 uCor; uniform float uOp; varying vec3 vN, vV;
void main() { float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.6); gl_FragColor = vec4(mix(uCor * 0.9, vec3(1.0), f * 0.45), (0.42 + 0.58 * f) * uOp); }`;
export const corTemp = (k: number) => new THREE.Color(1.0, 0.45, 0.18).lerp(new THREE.Color(0.35, 0.68, 1.0), Math.max(0, Math.min(1, k)));
export const Bolha: React.FC<{pos: [number, number, number]; raio: number; frio: number; t: number; op: number}> = ({pos, raio, frio, t, op}) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({vertexShader: BOLHA_V, fragmentShader: BOLHA_F, transparent: true, depthWrite: false, uniforms: {uCor: {value: new THREE.Color()}, uOp: {value: 1}}}), []);
  mat.uniforms.uCor.value.copy(corTemp(frio)); mat.uniforms.uOp.value = op;
  const mol = useMemo(() => {
    let s = 91; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const base = Array.from({length: 46}, () => { const u = r() * 2 - 1, a = r() * Math.PI * 2, rr = Math.cbrt(r()) * 0.8; return [rr * Math.sqrt(1 - u * u) * Math.cos(a), rr * u, rr * Math.sqrt(1 - u * u) * Math.sin(a), r() * 6.28, 0.6 + r()]; });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(46 * 3), 3)); return {base, g};
  }, []);
  // agitacao termica: mais lenta quando esfria (fase = tempo * velocidade, sem estado)
  const vel = 3.2 - 1.8 * frio, P = mol.g.attributes.position as THREE.BufferAttribute;
  mol.base.forEach((b, i) => { const ph = b[3] + t * vel * b[4]; P.setXYZ(i, (b[0] + 0.09 * Math.sin(ph)) * raio, (b[1] + 0.09 * Math.cos(ph * 1.3)) * raio, (b[2] + 0.09 * Math.sin(ph * 0.7)) * raio); });
  P.needsUpdate = true;
  const corM = corTemp(frio).lerp(new THREE.Color(1, 1, 1), 0.5);
  return (
    <group position={pos}>
      <mesh material={mat} scale={raio} renderOrder={8}><sphereGeometry args={[1, 48, 32]} /></mesh>
      <points geometry={mol.g} renderOrder={9}><pointsMaterial color={corM} size={raio * 0.11} transparent opacity={0.95 * op} depthWrite={false} /></points>
    </group>
  );
};
