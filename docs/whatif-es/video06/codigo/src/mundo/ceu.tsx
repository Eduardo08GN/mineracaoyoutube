// Ceu fisico por lugar (dono: agente Ceu). Contrato: Lugar, LuzTempo, luzEm(t, lugar), solDaCena(t, mundo), corHorizonte(t, lugar),
// <CeuLugar t lugar />. Tudo e funcao de t (segundo do ORIGINAL).
//
// Geometria: y = cima; por padrao -z = oeste (mar), +z = leste, +x = norte, -x = sul. LUGARES[l].rumo = azimute (bussola) para onde
// aponta -z (270 = oeste; Acapulco 225 = sudoeste, a baia). Um mundo pode passar outro rumo (prop rumo / 3o argumento de luzEm).
//
// O Sol anda pela ROTACAO desta Terra (src/fisica.ts): a hora solar de cada capitulo e uma interpolacao monotona (Fritsch-Carlson)
// entre ancoras medidas no original, feita no dominio de I(t) = integral de |w(t)| dt, onde w = voltas/dia em relacao ao Sol. Assim
// a VELOCIDADE do Sol segue a fisica (desacelera, para em ~272 s quando w = 0, volta ao contrario e acelera) e as ancoras fazem a
// fase bater com o original (nasceres/poentes do cap. 2 medidos pela luminancia dos q10; Sol parado no alto a leste no cap. 11;
// poente no LESTE em 300,3; nascer no OESTE em ~345,5 e o cold open = 345,3-347,3).
// Atmosfera: espalhamento simples Rayleigh/Mie/ozonio em LUT 3D (calculada uma vez), fase exata no shader; a mesma LUT e lida
// na CPU para a cor do horizonte (nevoa) e a luz ambiente. Nuvens procedurais (fbm com dominio torcido, auto-sombra na direcao
// da luz, borda prateada, cumulos ou cirros por capitulo) correndo com a velocidade do tempo. Noite: estrelas nitidas
// procedurais + Via Lactea extraida do HDRI CC0 qwantani_night_puresky (Poly Haven) em public/ceu/, girando com o ceu.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useFrame, useThree} from '@react-three/fiber';
import {useTexture} from '@react-three/drei';
import {staticFile} from 'remotion';
import {voltasPorDia} from '../fisica';

export type Lugar = 'ecuador' | 'gaztelugatxe' | 'madrid' | 'panama' | 'acapulco';
export type LuzTempo = {sol: THREE.Vector3; dia: number; corSol: THREE.Color; intensidade: number; ambiente: THREE.Color; ambienteForca: number};

export const LUGARES: Record<Lugar, {lat: number; lon: number; rumo: number}> = {
  ecuador: {lat: 0.9, lon: -79.8, rumo: 270},
  gaztelugatxe: {lat: 43.4, lon: -2.8, rumo: 270},
  madrid: {lat: 40.4, lon: -3.7, rumo: 270},
  panama: {lat: 8.9, lon: -79.6, rumo: 270},
  acapulco: {lat: 16.9, lon: -99.9, rumo: 225},
};
// mundo (roteiro.ts) -> lugar do ceu
export const lugarDoMundo = (m: string): Lugar | undefined =>
  m === 'calcadao' || m === 'praia' || m === 'leito' ? 'ecuador' : m === 'gaztelugatxe' || m === 'madrid' || m === 'panama' || m === 'acapulco' ? m : undefined;

// ---------------------------------------------------------------- utilidades
const PI2 = Math.PI * 2, RAD = Math.PI / 180;
const cl01 = (x: number) => Math.min(1, Math.max(0, x));
const sm = (a: number, b: number, x: number) => { const u = cl01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const tab = (K: [number, number][], t: number) => {
  if (t <= K[0][0]) return K[0][1];
  for (let i = 0; i < K.length - 1; i++) {
    const [a, va] = K[i], [b, vb] = K[i + 1];
    if (t <= b) { const u = cl01((t - a) / Math.max(1e-6, b - a)); return va + (vb - va) * u * u * (3 - 2 * u); }
  }
  return K[K.length - 1][1];
};

// ---------------------------------------------------------------- hora solar (rotacao)
// w(t): voltas por dia em relacao ao Sol (fisica.ts). I(t) = integral de |w| (+ piso pequeno para nunca ficar parado no dominio).
const DT_I = 0.02, T_MAX = 420;
const wSol = (t: number) => voltasPorDia(t) - 1 / 365.25;
const I_ARR = (() => {
  const n = Math.ceil(T_MAX / DT_I) + 2, a = new Float64Array(n);
  for (let i = 1; i < n; i++) a[i] = a[i - 1] + (Math.abs(wSol((i - 0.5) * DT_I)) + 2e-4) * DT_I;
  return a;
})();
const Iw = (t: number) => { const x = cl01(t / T_MAX) * (T_MAX / DT_I), i = Math.min(I_ARR.length - 2, Math.floor(x)), f = x - i; return I_ARR[i] * (1 - f) + I_ARR[i + 1] * f; };

// interpolacao monotona (Fritsch-Carlson): extremos viram tangente zero (o Sol para suavemente)
const monotona = (xs: number[], ys: number[]) => {
  const n = xs.length, d: number[] = [], m: number[] = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / Math.max(1e-9, xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]);
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], s = (x - xs[i]) / h, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * ys[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * ys[i + 1] + (s3 - s2) * h * m[i + 1];
  };
};
// capitulos com ceu: [inicio, fim, ancoras (t, hora solar desenrolada; 6 = nascer, 12 = meio-dia, 18 = poente, 30 = nascer seguinte)]
type Seg = {s: number; e: number; k: [number, number][]};
const SEGS: Seg[] = [
  // cap. 2: 4 ciclos (nasceres 7,0 / 10,9 / 15,25 / 21,2; poentes 5,8 / 9,7 / 13,9 / 19,3 medidos no chao dos q10) e o dia longo
  {s: 4.1, e: 29.9, k: [[4.1, 11.0], [4.7, 12], [5.8, 18], [7.0, 30], [8.35, 36], [9.7, 42], [10.9, 54], [12.4, 60], [13.9, 66], [15.25, 78], [17.3, 84],
    [19.3, 90], [21.2, 102], [24.8, 108], [29.2, 114], [29.9, 114.15]]},
  {s: 29.9, e: 60.9, k: [[29.9, 15.4], [60.9, 17.55]]},           // cap. 3: tarde; a luz cai em 52-60
  {s: 60.9, e: 74.9, k: [[60.9, 14.6], [74.9, 14.85]]},           // cap. 4: Gaztelugatxe, tarde clara
  {s: 74.9, e: 103.9, k: [[74.9, 11.2], [103.9, 11.7]]},          // cap. 5: Madrid, fim da manha
  {s: 132.9, e: 159.9, k: [[132.9, 10.0], [159.9, 10.35]]},       // cap. 7: Panama, manha
  {s: 159.9, e: 188.9, k: [[159.9, 15.7], [188.9, 16.1]]},        // cap. 8: a tarde que nao acaba
  {s: 188.9, e: 217.9, k: [[188.9, 23.2], [217.9, 23.7]]},        // cap. 9: noite de semanas
  // cap. 11-12: o Sol sobe a leste, PARA no alto (~42 graus) e volta para tras ate se por no LESTE em 300,3
  {s: 244.9, e: 300.9, k: [[244.9, 8.35], [257.5, 8.72], [272, 8.8], [300.3, 6.0], [300.9, 5.93]]},
  // cap. 14: noite -> aurora lilas (340-345) -> o Sol nasce no OESTE em ~345,5 (rotacao ao contrario: a hora DESCE)
  {s: 329.9, e: 357.0, k: [[329.9, 21.2], [340.0, 19.05], [345.5, 18.0], [357, 17.35]]},
  // cap. 15: dia, Sol alto a oeste (contraluz na onda), andando para tras
  {s: 357.0, e: 390.1, k: [[357, 14.6], [390.1, 13.4]]},
];
const SEG_F = SEGS.map((g) => ({...g, f: monotona(g.k.map(([t]) => Iw(t)), g.k.map(([, h]) => h))}));
const segDe = (t: number) => SEG_F.find((g) => t >= g.s && t < g.e);
// hora solar desenrolada em t (o cold open 0-4,1 repete 345,3-347,3)
export const horaSolar = (t: number): number => {
  if (t < 4.1) return horaSolar(345.3 + (t / 4.1) * 2.0);
  const g = segDe(t);
  return g ? g.f(Iw(t)) : 12;
};

// ---------------------------------------------------------------- astronomia (ENU -> mundo)
const DEC_SOL = 12 * RAD;   // fim de agosto
const RA_SOL = 2.9;
const baseMundo = (rumo: number) => {
  // vetor horizontal do azimute A (bussola): f(A) = (cos(A - rumo + 270), 0, sin(A - rumo + 270))
  const f = (A: number) => { const a = (A - rumo + 270) * RAD; return new THREE.Vector3(Math.cos(a), 0, Math.sin(a)); };
  return {E: f(90), N: f(0), U: new THREE.Vector3(0, 1, 0)};
};
// direcao (mundo) de um astro de angulo horario H (rad, 0 = meridiano, + = oeste) e declinacao d
const dirAstro = (H: number, d: number, lat: number, rumo: number) => {
  const p = lat * RAD, B = baseMundo(rumo);
  const e = -Math.cos(d) * Math.sin(H), n = Math.cos(p) * Math.sin(d) - Math.sin(p) * Math.cos(d) * Math.cos(H), u = Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(H);
  return B.E.clone().multiplyScalar(e).addScaledVector(B.N, n).addScaledVector(B.U, u).normalize();
};
const Hdo = (hora: number) => ((hora - 12) / 24) * PI2;
// matriz mundo -> equatorial (estrelas): mundo -> ENU -> horario (A^T) -> equatorial (Rz(-LST), y espelhado)
const mundoParaEq = (hora: number, lat: number, rumo: number) => {
  const B = baseMundo(rumo), p = lat * RAD;
  const W2ENU = new THREE.Matrix3().set(B.E.x, B.E.y, B.E.z, B.N.x, B.N.y, B.N.z, B.U.x, B.U.y, B.U.z);
  const AT = new THREE.Matrix3().set(0, -Math.sin(p), Math.cos(p), -1, 0, 0, 0, Math.cos(p), Math.sin(p));
  const lst = Hdo(hora) + RA_SOL, c = Math.cos(-lst), s = Math.sin(-lst);
  const R = new THREE.Matrix3().set(c, -s, 0, s, c, 0, 0, 0, 1);
  const F = new THREE.Matrix3().set(1, 0, 0, 0, -1, 0, 0, 0, 1);
  return F.multiply(R).multiply(AT).multiply(W2ENU);
};

// ---------------------------------------------------------------- atmosfera: LUT de espalhamento simples (Nishita + ozonio)
const NV = 48, NS = 64, NA = 24;
const RE = 6360e3, RA = 6420e3, HR = 8000, HM = 1200;
const BR = [5.802e-6, 13.558e-6, 33.1e-6], BMS = 3.996e-6, BME = 4.44e-6, BO = [0.65e-6, 1.881e-6, 0.085e-6];
const SE_MIN = 0.35;
const veDe = (u: number) => u * u * Math.PI / 2;
const seDe = (w: number) => { const x = w * 2 - 1; return x >= 0 ? x * x * Math.PI / 2 : -x * x * SE_MIN; };
const topo = (px: number, py: number, pz: number, dx: number, dy: number, dz: number) => {
  const b = px * dx + py * dy + pz * dz, c = px * px + py * py + pz * pz - RA * RA; return -b + Math.sqrt(Math.max(0, b * b - c));
};
const bateChao = (px: number, py: number, pz: number, dx: number, dy: number, dz: number) => {
  const b = px * dx + py * dy + pz * dz, c = px * px + py * py + pz * pz - RE * RE, D = b * b - c; return D > 0 && -b - Math.sqrt(D) > 0;
};
const profOtica = (px: number, py: number, pz: number, dx: number, dy: number, dz: number, n: number, out: number[]) => {
  const L = topo(px, py, pz, dx, dy, dz); let r = 0, m = 0, o = 0;
  for (let i = 0; i < n; i++) {
    const a = (i / n) ** 2 * L, b = ((i + 1) / n) ** 2 * L, t = (a + b) / 2, ds = b - a;
    const x = px + dx * t, y = py + dy * t, z = pz + dz * t, h = Math.sqrt(x * x + y * y + z * z) - RE;
    r += Math.exp(-h / HR) * ds; m += Math.exp(-h / HM) * ds; o += Math.max(0, 1 - Math.abs(h - 25000) / 15000) * ds;
  }
  out[0] = r; out[1] = m; out[2] = o;
};
const integra = (ve: number, se: number, az: number, nv: number, nl: number, res: number[]) => {
  const dx = Math.cos(ve), dy = Math.sin(ve);
  const sx = Math.cos(se) * Math.cos(az), sy = Math.sin(se), sz = Math.cos(se) * Math.sin(az);
  const py0 = RE + 2, L = topo(0, py0, 0, dx, dy, 0);
  let vr = 0, vm = 0, vo = 0; const sR = [0, 0, 0], sM = [0, 0, 0], l = [0, 0, 0];
  for (let i = 0; i < nv; i++) {
    const a = (i / nv) ** 2 * L, b = ((i + 1) / nv) ** 2 * L, t = (a + b) / 2, ds = b - a;
    const x = dx * t, y = py0 + dy * t, h = Math.sqrt(x * x + y * y) - RE;
    const dr = Math.exp(-h / HR) * ds, dm = Math.exp(-h / HM) * ds, dO = Math.max(0, 1 - Math.abs(h - 25000) / 15000) * ds;
    vr += dr / 2; vm += dm / 2; vo += dO / 2;
    if (!bateChao(x, y, 0, sx, sy, sz)) {
      profOtica(x, y, 0, sx, sy, sz, nl, l);
      for (let k = 0; k < 3; k++) {
        const at = Math.exp(-(BR[k] * (vr + l[0]) + BME * (vm + l[1]) + BO[k] * (vo + l[2])));
        sR[k] += dr * at; sM[k] += dm * at;
      }
    }
    vr += dr / 2; vm += dm / 2; vo += dO / 2;
  }
  for (let k = 0; k < 3; k++) { res[k] = sR[k] * BR[k]; res[k + 3] = sM[k] * BMS; }
};
let _lut: {R: THREE.Data3DTexture; M: THREE.Data3DTexture; fR: Float32Array; fM: Float32Array} | null = null;
const lutAtmos = () => {
  if (_lut) return _lut;
  const n = NA * NV * NS, R = new Uint16Array(n * 4), M = new Uint16Array(n * 4), fR = new Float32Array(n * 3), fM = new Float32Array(n * 3);
  const res = [0, 0, 0, 0, 0, 0], h = THREE.DataUtils.toHalfFloat;
  for (let z = 0; z < NS; z++) for (let y = 0; y < NV; y++) for (let x = 0; x < NA; x++) {
    integra(veDe(y / (NV - 1)), seDe(z / (NS - 1)), (Math.PI * x) / (NA - 1), 16, 6, res);
    const j = x + y * NA + z * NA * NV, i = j * 4;
    for (let k = 0; k < 3; k++) { fR[j * 3 + k] = res[k] * 1e3; fM[j * 3 + k] = res[k + 3] * 1e3; R[i + k] = h(res[k] * 1e3); M[i + k] = h(res[k + 3] * 1e3); }
    R[i + 3] = h(1); M[i + 3] = h(1);
  }
  const mk = (d: Uint16Array) => {
    const t = new THREE.Data3DTexture(d, NA, NV, NS);
    t.format = THREE.RGBAFormat; t.type = THREE.HalfFloatType; t.minFilter = t.magFilter = THREE.LinearFilter;
    t.wrapS = t.wrapT = t.wrapR = THREE.ClampToEdgeWrapping; t.unpackAlignment = 1; t.needsUpdate = true; return t;
  };
  _lut = {R: mk(R), M: mk(M), fR, fM};
  return _lut;
};
// mesma consulta do shader, na CPU (trilinear)
const lc = (p: number, n: number) => (p * (n - 1) + 0.5) / n;
const amostra3 = (arr: Float32Array, cx: number, cy: number, cz: number, out: number[]) => {
  const fx = cl01(cx) * NA - 0.5, fy = cl01(cy) * NV - 0.5, fz = cl01(cz) * NS - 0.5;
  const x0 = Math.max(0, Math.min(NA - 1, Math.floor(fx))), y0 = Math.max(0, Math.min(NV - 1, Math.floor(fy))), z0 = Math.max(0, Math.min(NS - 1, Math.floor(fz)));
  const x1 = Math.min(NA - 1, x0 + 1), y1 = Math.min(NV - 1, y0 + 1), z1 = Math.min(NS - 1, z0 + 1);
  const ax = cl01(fx - x0), ay = cl01(fy - y0), az = cl01(fz - z0);
  for (let k = 0; k < 3; k++) {
    const g = (x: number, y: number, z: number) => arr[(x + y * NA + z * NA * NV) * 3 + k];
    const c00 = g(x0, y0, z0) * (1 - ax) + g(x1, y0, z0) * ax, c10 = g(x0, y1, z0) * (1 - ax) + g(x1, y1, z0) * ax;
    const c01 = g(x0, y0, z1) * (1 - ax) + g(x1, y0, z1) * ax, c11 = g(x0, y1, z1) * (1 - ax) + g(x1, y1, z1) * ax;
    out[k] = (c00 * (1 - ay) + c10 * ay) * (1 - az) + (c01 * (1 - ay) + c11 * ay) * az;
  }
};
const MIE = 0.45;
const atmosCPU = (d: THREE.Vector3, s: THREE.Vector3): THREE.Color => {
  const se = Math.asin(Math.max(-1, Math.min(1, s.y)));
  if (se < -SE_MIN) return new THREE.Color(0, 0, 0);
  const ve = Math.asin(cl01(d.y)), u = Math.sqrt(ve / (Math.PI / 2));
  const x = se >= 0 ? Math.sqrt(se / (Math.PI / 2)) : -Math.sqrt(Math.min(1, -se / SE_MIN)), w = (x + 1) / 2;
  const dl = Math.hypot(d.x, d.z), sl = Math.hypot(s.x, s.z);
  const caz = dl < 1e-4 || sl < 1e-4 ? 1 : (d.x * s.x + d.z * s.z) / (dl * sl);
  const az = Math.acos(Math.max(-1, Math.min(1, caz))) / Math.PI;
  const L = lutAtmos(), r = [0, 0, 0], m = [0, 0, 0];
  amostra3(L.fR, lc(az, NA), lc(u, NV), lc(w, NS), r); amostra3(L.fM, lc(az, NA), lc(u, NV), lc(w, NS), m);
  const mu = d.dot(s), pr = 0.0596831 * (1 + mu * mu), G = 0.76;
  const pm = (0.1193662 * ((1 - G * G) * (1 + mu * mu))) / ((2 + G * G) * Math.pow(1 + G * G - 2 * G * mu, 1.5));
  return new THREE.Color(0.02 * (r[0] * (pr + 0.025) + m[0] * pm * MIE), 0.02 * (r[1] * (pr + 0.025) + m[1] * pm * MIE), 0.02 * (r[2] * (pr + 0.025) + m[2] * pm * MIE));
};
// transmitancia ate o Sol (Kasten-Young)
const TAU = [0.062, 0.139, 0.27];
const massaAr = (y: number) => {
  const e = (Math.asin(Math.max(-1, Math.min(1, y))) * 180) / Math.PI;
  return e < -1 ? 1e4 : 1 / (Math.max(0, Math.sin((e * Math.PI) / 180)) + 0.50572 * Math.pow(Math.max(0.01, e + 6.07995), -1.6364));
};
const transSol = (y: number) => { const m = massaAr(y); return new THREE.Color(Math.exp(-TAU[0] * m), Math.exp(-TAU[1] * m), Math.exp(-TAU[2] * m)); };
const corSolAlt = (y: number) => {
  const c = transSol(Math.max(0, y) + 0.004), m = Math.max(1e-4, c.r, c.g, c.b);
  return c.multiplyScalar(1 / m).lerp(new THREE.Color(1, 1, 1), 0.12);
};
const intSolAlt = (y: number) => 3.3 * sm(-0.035, 0.1, y) * (0.4 + 0.6 * sm(0.0, 0.5, y));

// ---------------------------------------------------------------- nuvens por capitulo
// cum = cobertura de cumulos (volume) 0..1, cir = cirros altos (camada fina) 0..1, est = alongamento dos cirros, ang = rumo do vento (rad, mundo)
type NuvCfg = {cum: number; cir: number; est: number; ang: number};
const NUV_K: [number, NuvCfg][] = [
  [0, {cum: 0.22, cir: 0.45, est: 2.2, ang: 0.4}],      // cold open (lilas, poucas)
  [4.1, {cum: 0.4, cir: 0.3, est: 2.0, ang: 0.4}],      // cap. 2
  [29.9, {cum: 0.32, cir: 0.45, est: 2.4, ang: 0.4}],   // cap. 3
  [60.9, {cum: 0.55, cir: 0.15, est: 2.0, ang: 0.9}],   // cap. 4 Gaztelugatxe: cumulos fofos
  [74.9, {cum: 0.42, cir: 0.25, est: 2.0, ang: 0.6}],   // cap. 5 Madrid
  [132.9, {cum: 0.52, cir: 0.15, est: 2.0, ang: 0.5}],  // cap. 7 Panama
  [159.9, {cum: 0.24, cir: 0.55, est: 2.6, ang: 0.7}],  // cap. 8 tarde
  [188.9, {cum: 0.2, cir: 0.35, est: 2.6, ang: 0.7}],   // cap. 9 noite
  [244.9, {cum: 0.07, cir: 1.0, est: 3.0, ang: 0.8}],   // cap. 11-12: cirros em faixas diagonais
  [329.9, {cum: 0.26, cir: 0.4, est: 2.2, ang: 0.4}],   // cap. 14
  [357.0, {cum: 0.42, cir: 0.25, est: 2.0, ang: 0.4}],  // cap. 15
];
const nuvCfg = (t: number): NuvCfg => {
  let i = 0; while (i < NUV_K.length - 1 && t >= NUV_K[i + 1][0]) i++;
  return NUV_K[i][1];
};
// deslocamento das nuvens: vento base + proporcional as horas que passam por segundo (time-lapse), integrado (tabela fixa)
const NUV_DT = 0.05;
const NUV_INT = (() => {
  const n = Math.ceil(T_MAX / NUV_DT) + 2, a = new Float64Array(n);
  for (let i = 1; i < n; i++) {
    const t = (i - 0.5) * NUV_DT;
    const g = segDe(t), dh = g ? Math.abs(g.f(Iw(Math.min(g.e - 1e-3, t + 0.01))) - g.f(Iw(Math.max(g.s, t - 0.01)))) / 0.02 : 0;
    a[i] = a[i - 1] + (0.006 + 0.025 * Math.min(8, dh)) * NUV_DT;
  }
  return a;
})();
const nuvOff = (t: number) => { const x = cl01(t / T_MAX) * (T_MAX / NUV_DT), i = Math.min(NUV_INT.length - 2, Math.floor(x)), f = x - i; return NUV_INT[i] * (1 - f) + NUV_INT[i + 1] * f; };

// ---------------------------------------------------------------- estado do ceu em (t, lugar)
type Estado = {
  sol: THREE.Vector3; lua: THREE.Vector3; hora: number; dia: number; rosa: number; estrelas: number; luaI: number; W2Eq: THREE.Matrix3; domo: THREE.Matrix3;
  nuv: NuvCfg; nuvOff: number; luz: LuzTempo; horiz: THREE.Color; expo: number;
};
const EXPO = 0.62;
const estadoDe = (t: number, lugar: Lugar, rumo: number): Estado => {
  const L = LUGARES[lugar], hora = horaSolar(t);
  const sol = dirAstro(Hdo(hora), DEC_SOL, L.lat, rumo);
  // Lua cheia-ish deslocada 3 h do anti-Sol: a noite tem luz de lua com sombras
  const lua = dirAstro(Hdo(hora + 15), -DEC_SOL * 0.5, L.lat, rumo);
  const y = sol.y;
  const dia = sm(-0.1, 0.1, y);
  const rosa = sm(-0.3, -0.06, y) * (1 - sm(0.04, 0.16, y));
  const noite = 1 - sm(-0.2, -0.05, y);
  const luaI = sm(-0.05, 0.2, lua.y) * noite;
  const nuv = nuvCfg(t);
  const estrelas = (1 - sm(-0.22, -0.08, y)) * (1 - 0.5 * nuv.cum);
  // luz direcional: Sol (de dia) ou Lua (de noite)
  const iSol = intSolAlt(y), iLua = 0.38 * luaI;
  let dir: THREE.Vector3, cor: THREE.Color, inten: number;
  if (iSol >= iLua) { dir = sol.clone(); if (dir.y < 0.03) { dir.y = 0.03; dir.normalize(); } cor = corSolAlt(y); inten = iSol + 0.0; }
  else { dir = lua.clone(); if (dir.y < 0.05) { dir.y = 0.05; dir.normalize(); } cor = new THREE.Color(0.55, 0.66, 1.0); inten = iLua; }
  // ambiente e horizonte lidos da mesma atmosfera (CPU)
  const zen = atmosCPU(new THREE.Vector3(0, 1, 0), sol);
  const ceuMed = new THREE.Color(0, 0, 0), horiz = new THREE.Color(0, 0, 0);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * PI2;
    ceuMed.add(atmosCPU(new THREE.Vector3(Math.cos(a) * 0.8, 0.6, Math.sin(a) * 0.8).normalize(), sol).multiplyScalar(1 / 8));
    horiz.add(atmosCPU(new THREE.Vector3(Math.cos(a), 0.035, Math.sin(a)).normalize(), sol).multiplyScalar(1 / 8));
  }
  ceuMed.add(zen).multiplyScalar(0.5 * EXPO); horiz.multiplyScalar(EXPO);
  const noiteCor = new THREE.Color(0.012, 0.018, 0.04);
  horiz.add(noiteCor.clone().multiplyScalar(noite)).add(new THREE.Color(0.25, 0.12, 0.18).multiplyScalar(rosa * 0.35));
  horiz.add(new THREE.Color(0.02, 0.03, 0.06).multiplyScalar(luaI));
  // a cor do ambiente: normalizada (o tom vem do ceu, a forca vem da altura do Sol)
  const amb = ceuMed.clone(); { const m = Math.max(1e-5, amb.r, amb.g, amb.b); amb.multiplyScalar(1 / m); }
  amb.lerp(new THREE.Color(0.66, 0.74, 0.92), 0.35);
  amb.lerp(new THREE.Color(0.18, 0.24, 0.45), noite);
  amb.lerp(new THREE.Color(0.75, 0.55, 0.75), rosa * 0.5);
  const ambF = 0.12 + 0.5 * dia + 0.08 * luaI;
  const luz: LuzTempo = {sol: dir, dia, corSol: cor, intensidade: inten, ambiente: amb, ambienteForca: ambF};
  const W2Eq = mundoParaEq(hora, L.lat, rumo);
  // cupula da Via Lactea: a foto fica presa ao ceu (gira com as estrelas) a partir da orientacao no inicio do capitulo
  const gRef = segDe(t < 4.1 ? 345.3 : t), hRef = gRef ? gRef.f(Iw(gRef.s)) : 12;
  const domo = mundoParaEq(hRef, L.lat, rumo).transpose().multiply(W2Eq.clone());
  return {sol, lua, hora, dia, rosa, estrelas, luaI, W2Eq, domo, nuv, nuvOff: nuvOff(t), luz, horiz, expo: EXPO};
};
const _cache = new Map<string, Estado>();
const estado = (t: number, lugar: Lugar, rumo?: number) => {
  const r = rumo ?? LUGARES[lugar].rumo, ch = `${t.toFixed(4)}|${lugar}|${r}`;
  let e = _cache.get(ch);
  if (!e) { e = estadoDe(t, lugar, r); if (_cache.size > 24) _cache.clear(); _cache.set(ch, e); }
  return e;
};

export const luzEm = (t: number, lugar: Lugar, rumo?: number): LuzTempo => {
  const l = estado(t, lugar, rumo).luz;
  return {sol: l.sol.clone(), dia: l.dia, corSol: l.corSol.clone(), intensidade: l.intensidade, ambiente: l.ambiente.clone(), ambienteForca: l.ambienteForca};
};
// direcao REAL do Sol (unitaria, pode estar abaixo do horizonte) para quem precisar (reflexo no mar, sombras longas)
export const solEm = (t: number, lugar: Lugar, rumo?: number) => estado(t, lugar, rumo).sol.clone();
// cor do horizonte (linear) para a nevoa dos mundos
export const corHorizonte = (t: number, lugar: Lugar, rumo?: number): THREE.Color => estado(t, lugar, rumo).horiz.clone();
// direcao do Sol para os god rays: so com o disco acima do horizonte
// rumo usado por cada MUNDO (para os god rays sairem do Sol certo): o leito usa rumo 90. Um mundo que passar outro rumo ao
// CeuLugar deve chamar registraRumo('<mundo>', rumo) no topo do proprio modulo (efeito no import, deterministico).
const RUMO_DO_MUNDO: Record<string, number> = {leito: 90};
export const registraRumo = (mundo: string, rumo: number) => { RUMO_DO_MUNDO[mundo] = rumo; };
export const solDaCena = (t: number, mundo: string): THREE.Vector3 | undefined => {
  const l = lugarDoMundo(mundo);
  if (!l) return undefined;
  const e = estado(t, l, RUMO_DO_MUNDO[mundo]);
  return e.sol.y > -0.005 ? e.sol.clone() : undefined;
};

// ---------------------------------------------------------------- shaders
const NOISE = /* glsl */ `
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*f*(f*(f*6.0-15.0)+10.0);
  return mix(mix(hash12(i), hash12(i+vec2(1.0,0.0)), u.x), mix(hash12(i+vec2(0.0,1.0)), hash12(i+vec2(1.0,1.0)), u.x), u.y); }
const mat2 RO = mat2(1.6, 1.2, -1.2, 1.6);
float fbm6(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 6; i++){ s += a * vnoise(p); p = RO * p + vec2(1.7, 9.2); a *= 0.5; } return s; }
float fbm4(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++){ s += a * vnoise(p); p = RO * p + vec2(1.7, 9.2); a *= 0.5; } return s; }
float fbm3(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 3; i++){ s += a * vnoise(p); p = RO * p + vec2(3.1, 4.7); a *= 0.5; } return s; }
`;

const CEU_VS = /* glsl */ `
varying vec3 vDir;
void main(){ vDir = position; vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0); gl_Position = p.xyww; }`;

const CEU_FS = /* glsl */ `
precision highp float;
precision highp sampler3D;
varying vec3 vDir;
uniform highp sampler3D uLutR, uLutM;
uniform sampler2D uVia;
uniform vec3 uSol, uLua;
uniform float uExpo, uMie, uSat, uRosa, uNoite, uDisco, uLuaI, uEstrelas, uPx;
uniform mat3 uW2Eq, uDomo;
uniform float uCum, uCir, uEst, uAng;
uniform vec2 uVento;
uniform vec3 uNuvLuz, uNuvAmb, uNuvTopo;
${NOISE}
const float PI = 3.14159265;
float lc(float p, float n){ return (p * (n - 1.0) + 0.5) / n; }
vec3 kasten(float y){ float e = degrees(asin(clamp(y, -1.0, 1.0))); float m = e < -1.0 ? 1e4 : 1.0 / (max(0.0, sin(radians(e))) + 0.50572 * pow(max(e + 6.07995, 0.01), -1.6364));
  return exp(-vec3(0.062, 0.139, 0.27) * m); }
vec3 atmos(vec3 d, vec3 s){
  float se = asin(clamp(s.y, -1.0, 1.0));
  if (se < -${SE_MIN.toFixed(3)}) return vec3(0.0);
  float ve = asin(clamp(d.y, 0.0, 1.0));
  float u = sqrt(ve / (PI * 0.5));
  float x = se >= 0.0 ? sqrt(se / (PI * 0.5)) : -sqrt(min(1.0, -se / ${SE_MIN.toFixed(3)}));
  float w = (x + 1.0) * 0.5;
  vec2 dxz = d.xz, sxz = s.xz;
  float caz = (dot(dxz, dxz) < 1e-8 || dot(sxz, sxz) < 1e-8) ? 1.0 : dot(normalize(dxz), normalize(sxz));
  float az = acos(clamp(caz, -1.0, 1.0)) / PI;
  vec3 c = vec3(lc(az, ${NA}.0), lc(u, ${NV}.0), lc(w, ${NS}.0));
  vec3 R = texture(uLutR, c).rgb, M = texture(uLutM, c).rgb;
  float mu = dot(d, s);
  float pr = 0.0596831 * (1.0 + mu * mu);
  const float G = 0.76;
  float pm = 0.1193662 * ((1.0 - G * G) * (1.0 + mu * mu)) / ((2.0 + G * G) * pow(1.0 + G * G - 2.0 * G * mu, 1.5));
  return 0.02 * (R * (pr + 0.025) + M * pm * uMie);
}
// estrelas nitidas: uma por celula numa grade sobre as faces do cubo (coordenadas equatoriais: giram com o ceu)
float estrelas(vec3 e){
  vec3 a = abs(e); vec2 uv; float f;
  if (a.x >= a.y && a.x >= a.z){ uv = e.yz / a.x; f = e.x > 0.0 ? 0.0 : 1.0; }
  else if (a.y >= a.z){ uv = e.xz / a.y; f = e.y > 0.0 ? 2.0 : 3.0; }
  else { uv = e.xy / a.z; f = e.z > 0.0 ? 4.0 : 5.0; }
  float s = 0.0;
  for (int k = 0; k < 2; k++){
    float N = k == 0 ? 70.0 : 200.0;
    vec2 g = (uv * 0.5 + 0.5) * N, c = floor(g);
    vec2 h = hash22(c + f * 37.0 + float(k) * 113.0);
    vec2 p = c + 0.15 + 0.7 * h;
    float r = length(g - p) / N * 2.0;
    float m = hash12(c * 1.7 + f * 11.0 + float(k) * 7.0);
    float b = k == 0 ? pow(m, 7.0) * 2.5 : pow(m, 12.0) * 0.8;
    float sig = max(uPx * 0.7, 0.0004);
    s += b * exp(-0.5 * r * r / (sig * sig));
  }
  return s;
}
// ---- nuvens volumetricas (cumulos numa camada de 1500-2900 m), marcha de raio com luz em 4 passos
float hash13(vec3 p3){ p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
float vnoise3(vec3 p){
  vec3 i = floor(p), f = fract(p); vec3 u = f * f * (3.0 - 2.0 * f);
  float a = hash13(i), b = hash13(i + vec3(1,0,0)), c = hash13(i + vec3(0,1,0)), d = hash13(i + vec3(1,1,0));
  float e = hash13(i + vec3(0,0,1)), f1 = hash13(i + vec3(1,0,1)), g = hash13(i + vec3(0,1,1)), h = hash13(i + vec3(1,1,1));
  return mix(mix(mix(a, b, u.x), mix(c, d, u.x), u.y), mix(mix(e, f1, u.x), mix(g, h, u.x), u.y), u.z);
}
float fbm3d(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 3; i++){ s += a * vnoise3(p); p = p * 2.03 + vec3(1.3, 7.1, 3.7); a *= 0.5; } return s; }
const float H0 = 1500.0, H1 = 3000.0;
float billow3(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 3; i++){ s += a * abs(2.0 * vnoise3(p) - 1.0); p = p * 2.07 + vec3(1.3, 7.1, 3.7); a *= 0.5; } return s / 0.875; }
float remap(float v, float a, float b){ return clamp((v - a) / max(1e-4, b - a), 0.0, 1.0); }
// presenca (2D): campo de cobertura com dominio torcido; devolve 0..1 (miolo grosso = 1)
float cobertura(vec2 xz){
  vec2 q = xz / 2800.0;
  float w = fbm3(q * 0.6 + vec2(3.1, 8.4));
  float n = fbm4(q + 0.9 * vec2(w, -w));
  return clamp((n - (1.0 - uCum * 0.8 - 0.1)) / 0.2, 0.0, 1.0);
}
float densidade(vec3 p, float c, bool detalhe){
  float hf = (p.y - H0) / (H1 - H0);
  float topo = 0.3 + 0.7 * c;
  float perfil = smoothstep(0.0, 0.05, hf) * (1.0 - smoothstep(topo * 0.5, topo, hf));
  float d = c * perfil;
  if (d <= 0.0) return 0.0;
  // forma: torre arredondada (ruido 3D grosso), base plana
  float n1 = vnoise3(p / 850.0 + vec3(4.0, 0.0, 9.0));
  d = remap(d + 0.45 * (n1 - 0.5) * smoothstep(0.0, 0.3, hf), 0.12, 0.6);
  if (!detalhe || d <= 0.0) return d;
  // erosao "couve-flor": ruido billow 3D fino, mais forte no alto e nas bordas
  float nd = billow3(p / 210.0);
  return remap(d, nd * (0.42 + 0.25 * hf), 1.0);
}
vec4 cumulos(vec3 d, vec3 Ld, float px){
  if (d.y < 0.012 || uCum < 0.01) return vec4(0.0, 0.0, 0.0, 1.0);
  float t0 = H0 / d.y, t1 = H1 / d.y;
  if (t0 > 70000.0) return vec4(0.0, 0.0, 0.0, 1.0);
  t1 = min(t1, t0 + 9000.0);
  const int N = 32;
  float dt = (t1 - t0) / float(N);
  float j = hash12(gl_FragCoord.xy + 0.5);
  vec3 col = vec3(0.0); float T = 1.0;
  float sig = 0.0055;
  float mu = dot(d, Ld);
  float g1 = 0.7, g2 = -0.2;
  float hg1 = (1.0 - g1 * g1) / pow(1.0 + g1 * g1 - 2.0 * g1 * mu, 1.5), hg2 = (1.0 - g2 * g2) / pow(1.0 + g2 * g2 - 2.0 * g2 * mu, 1.5);
  float fase = 0.0796 * (0.7 * hg1 + 0.3 * hg2);
  vec3 Lc = normalize(vec3(Ld.x, max(Ld.y, 0.06), Ld.z));
  for (int i = 0; i < N; i++){
    float t = t0 + (float(i) + j) * dt;
    vec3 p = d * t; p.xz += uVento;
    float c = cobertura(p.xz);
    if (c <= 0.0) continue;
    float den = densidade(p, c, true);
    if (den <= 0.001) continue;
    // luz: 4 amostras em cone ate ~1 km na direcao do Sol/Lua (a 1a com detalhe)
    float od = 0.0;
    od += densidade(p + Lc * 50.0, c, true) * 100.0;
    vec3 q = p + Lc * 200.0; od += densidade(q, cobertura(q.xz), false) * 200.0;
    q = p + Lc * 450.0; od += densidade(q, cobertura(q.xz), false) * 300.0;
    q = p + Lc * 900.0; od += densidade(q, cobertura(q.xz), false) * 500.0;
    float tau = sig * od;
    // espalhamento multiplo aproximado (oitavas: extincao e fase cada vez mais suaves)
    float ms = exp(-tau) * fase + 0.5 * exp(-tau * 0.3) * mix(fase, 0.0796, 0.5) + 0.25 * exp(-tau * 0.09) * 0.0796;
    float po = 1.0 - exp(-den * 6.0);                       // "powder": o miolo escuro na borda virada para a luz
    float hf = clamp((p.y - H0) / (H1 - H0), 0.0, 1.0);
    vec3 luz = uNuvLuz * ms * mix(0.45, 1.0, po) * 20.0;
    vec3 amb = mix(uNuvAmb * 0.7, uNuvTopo, hf * hf) * (0.45 + 0.55 * hf);
    float a = 1.0 - exp(-sig * den * dt);
    col += T * a * (luz + amb);
    T *= 1.0 - a;
    if (T < 0.02) break;
  }
  float fade = smoothstep(30000.0, 70000.0, t0);
  return vec4(col * (1.0 - fade), mix(T, 1.0, fade));
}
// cirros: camada fina alta (fibrosa, alongada no vento)
float cirros(vec2 p){
  vec2 w = vec2(cos(uAng), sin(uAng));
  vec2 q = vec2(dot(p, vec2(w.y, -w.x)), dot(p, w) / uEst);
  float warp = fbm3(q * 0.45 + vec2(5.2, 1.3));
  float n = fbm4(q * 0.6 + 1.1 * vec2(warp, -warp));
  // fibras: ruido esticado ao longo do vento, torcido pelo mesmo campo (nada de pente regular)
  vec2 r = vec2(q.x * 3.0 + 1.6 * warp, q.y * 0.45 + 0.8 * n);
  float fib = fbm4(r);
  float banda = smoothstep(0.58 - 0.2 * uCir, 0.82 - 0.14 * uCir, n);
  float tufos = smoothstep(0.4, 0.75, fbm3(q * 2.2 + warp));
  return banda * smoothstep(0.36, 0.72, fib) * (0.5 + 0.5 * tufos);
}
void main(){
  vec3 d = normalize(vDir);
  vec3 dh = normalize(vec3(d.x, max(d.y, 0.0015), d.z));
  vec3 ceu = atmos(dh, uSol) * uExpo;
  // ceu noturno (azul profundo, mais claro no horizonte) + luar
  ceu += mix(vec3(0.010, 0.016, 0.036), vec3(0.002, 0.004, 0.012), sqrt(dh.y)) * uNoite;
  ceu += uLuaI * mix(vec3(0.02, 0.035, 0.07), vec3(0.008, 0.014, 0.035), sqrt(dh.y)) * (1.0 + 2.0 * pow(max(dot(d, uLua), 0.0), 24.0));
  // crepusculo lilas (o original puxa para lilas/rosa): faixa rosa-alaranjada do lado do Sol, malva no alto
  { float lado = 0.5 + 0.5 * dot(normalize(dh.xz + 1e-5), normalize(uSol.xz + 1e-5));
    ceu += uRosa * (vec3(0.42, 0.17, 0.16) * exp(-dh.y / 0.09) * (0.3 + 0.7 * lado) + vec3(0.11, 0.07, 0.15) * exp(-dh.y / 0.45)); }
  { float lum = dot(ceu, vec3(0.2126, 0.7152, 0.0722)); ceu = max(vec3(0.0), mix(vec3(lum), ceu, uSat)); }
  vec3 ceuLimpo = ceu;
  // estrelas + Via Lactea (some com o ceu claro)
  if (uEstrelas > 0.002) {
    float horiz = smoothstep(0.0, 0.14, d.y);
    vec3 v = uDomo * d;                            // direcao no ceu de referencia do capitulo (y = cima)
    float acima = smoothstep(-0.05, 0.12, v.y);
    vec3 vv = normalize(vec3(v.x, abs(v.y), v.z));
    vec2 uv = vec2(atan(vv.z, vv.x) * 0.15915494 + 0.5, 1.0 - asin(clamp(vv.y, 0.0, 1.0)) / (PI * 0.5));
    vec4 tv = texture2D(uVia, uv);
    ceu += vec3(0.55, 0.6, 0.78) * pow(tv.rgb, vec3(2.2)) * 0.09 * acima * uEstrelas * horiz;
    ceu += vec3(0.95, 0.97, 1.0) * estrelas(uW2Eq * d) * 0.8 * uEstrelas * horiz;
  }
  // disco do Sol (com escurecimento do limbo) e Lua
  float horizS = smoothstep(-0.006, 0.006, d.y);
  vec3 trS = kasten(max(uSol.y, 0.0));
  float ang = acos(clamp(dot(d, uSol), -1.0, 1.0));
  float R0 = 0.0085;
  float limbo = ang < R0 ? 0.55 + 0.45 * sqrt(1.0 - (ang / R0) * (ang / R0)) : 0.0;
  vec3 disco = uDisco * trS * (smoothstep(R0 + uPx, R0 - uPx, ang) * limbo * 60.0 + 0.6 * exp(-ang / 0.012) + 0.05 * exp(-ang / 0.06)) * horizS;
  float angL = acos(clamp(dot(d, uLua), -1.0, 1.0));
  vec3 lua = vec3(0.9, 0.92, 1.0) * uLuaI * smoothstep(0.0075 + uPx, 0.0075 - uPx, angL) * 2.2 * horizS * (0.85 + 0.15 * vnoise(d.xy * 900.0));
  ceu += lua;
  vec3 Ld = uSol.y > -0.06 ? uSol : uLua;
  // cirros (atras dos cumulos)
  if (uCir > 0.003 && d.y > 0.0) {
    vec2 p = d.xz / (d.y + 0.03) * 1.5 + uVento / 9000.0;
    float c = cirros(p) * smoothstep(0.0, 0.1, d.y);
    float mu = dot(d, Ld);
    vec3 corC = uNuvTopo * 0.9 + uNuvLuz * (1.1 + 4.0 * pow(max(mu, 0.0), 6.0));
    corC = mix(corC, ceuLimpo, exp(-d.y * 10.0) * 0.6);
    ceu = mix(ceu, corC, clamp(c * 0.62, 0.0, 1.0));
    disco *= 1.0 - 0.6 * c;
  }
  // cumulos volumetricos
  vec4 cu = cumulos(d, Ld, uPx);
  float dist = H0 / max(d.y, 0.012);
  float aer = 1.0 - exp(-dist / 22000.0);
  vec3 cuCor = mix(cu.rgb, ceuLimpo * (1.0 - cu.a), aer * 0.85);
  ceu = ceu * cu.a + cuCor;
  disco *= cu.a;
  ceu += disco;
  // abaixo do horizonte: o chao dos mundos cobre; aqui so uma bruma escura
  if (d.y < 0.0) ceu *= mix(1.0, 0.5, smoothstep(0.0, 0.25, -d.y));
  gl_FragColor = vec4(max(ceu, vec3(0.0)), 1.0);
}`;

// ---------------------------------------------------------------- componente
// env (padrao true): o proprio ceu (com nuvens) vira scene.environment a cada quadro (cubo 64 px + PMREM), para o PBR e a agua
// refletirem o ceu certo; com env, a luz hemisferica cai para 35%. Um mundo com IBL proprio passa env={false}.
export const CeuLugar: React.FC<{t: number; lugar: Lugar; rumo?: number; sombra?: number; env?: boolean; envForca?: number}> =
  ({t, lugar, rumo, sombra = 60, env = true, envForca = 1}) => {
  const {size, gl, scene} = useThree();
  const via = useTexture(staticFile('ceu/via_lactea_2048x512.png'));
  useMemo(() => { via.colorSpace = THREE.NoColorSpace; via.wrapS = THREE.RepeatWrapping; via.generateMipmaps = true; via.needsUpdate = true; }, [via]);
  const e = estado(t, lugar, rumo);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: CEU_VS, fragmentShader: CEU_FS, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false, toneMapped: false,
    uniforms: {
      uLutR: {value: lutAtmos().R}, uLutM: {value: lutAtmos().M}, uVia: {value: null},
      uSol: {value: new THREE.Vector3(0, 1, 0)}, uLua: {value: new THREE.Vector3(0, 1, 0)},
      uExpo: {value: EXPO}, uMie: {value: MIE}, uSat: {value: 1.3}, uRosa: {value: 0}, uNoite: {value: 0}, uDisco: {value: 1}, uLuaI: {value: 0},
      uEstrelas: {value: 0}, uPx: {value: 0.001}, uW2Eq: {value: new THREE.Matrix3()}, uDomo: {value: new THREE.Matrix3()},
      uCum: {value: 0.4}, uCir: {value: 0}, uEst: {value: 1}, uAng: {value: 0}, uVento: {value: new THREE.Vector2()},
      uNuvLuz: {value: new THREE.Vector3(1, 1, 1)}, uNuvAmb: {value: new THREE.Vector3(0.5, 0.5, 0.5)}, uNuvTopo: {value: new THREE.Vector3(0.5, 0.5, 0.5)},
    },
  }), []);
  const luzDir = useMemo(() => {
    const l = new THREE.DirectionalLight();
    l.castShadow = true; l.shadow.mapSize.set(2048, 2048);
    l.shadow.bias = -0.0004; l.shadow.normalBias = 0.03;
    return l;
  }, []);
  const hemi = useMemo(() => new THREE.HemisphereLight(), []);
  const ibl = useMemo(() => {
    const tipo = ((globalThis as any).__fb8 ?? THREE.HalfFloatType) as THREE.TextureDataType;
    const rt = new THREE.WebGLCubeRenderTarget(64, {type: tipo, generateMipmaps: false});
    const cam = new THREE.CubeCamera(0.1, 100, rt);
    const cena = new THREE.Scene();
    const m = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), mat); m.frustumCulled = false; cena.add(m);
    const pm = new THREE.PMREMGenerator(gl);
    return {rt, cam, cena, pm, saida: null as THREE.WebGLRenderTarget | null};
  }, [gl, mat]);
  React.useEffect(() => () => { ibl.rt.dispose(); ibl.pm.dispose(); ibl.saida?.dispose(); }, [ibl]);

  // ---------------- uniforms do quadro
  const u = mat.uniforms;
  const dbg = String((globalThis as any).__dbg ?? '');
  u.uVia.value = via;
  u.uSol.value.copy(e.sol); u.uLua.value.copy(e.lua);
  u.uRosa.value = e.rosa; u.uNoite.value = 1 - sm(-0.2, -0.05, e.sol.y); u.uLuaI.value = e.luaI; u.uEstrelas.value = e.estrelas;
  u.uDisco.value = 1;
  u.uW2Eq.value.copy(e.W2Eq); u.uDomo.value.copy(e.domo);
  u.uCum.value = dbg.includes('semNuvem') ? 0 : e.nuv.cum; u.uCir.value = dbg.includes('semNuvem') ? 0 : e.nuv.cir;
  u.uEst.value = e.nuv.est; u.uAng.value = e.nuv.ang;
  u.uVento.value.set(Math.cos(e.nuv.ang), Math.sin(e.nuv.ang)).multiplyScalar(-e.nuvOff * 4000);
  const pxAng = (2 * Math.tan((25 * Math.PI) / 180)) / Math.max(200, size.height);
  u.uPx.value = pxAng;
  // luz das nuvens: Sol (com a cor do caminho pela atmosfera; um pouco abaixo do horizonte ainda pinta a base de rosa) ou Lua
  const ys = e.sol.y;
  const cs = corSolAlt(ys);
  const kSol = sm(-0.1, 0.04, ys) * (0.5 + 0.65 * sm(0, 0.4, ys)) * EXPO * 1.25;
  const kLua = e.luaI * 0.014 * (1 - sm(-0.1, 0.0, ys));
  u.uNuvLuz.value.set(cs.r * kSol + 0.6 * kLua, cs.g * kSol + 0.7 * kLua, cs.b * kSol + 1.0 * kLua);
  // ambiente das nuvens: base = cor do horizonte (luz refletida de baixo), topo = ceu do alto
  const zen = atmosCPU(new THREE.Vector3(0, 1, 0), e.sol).multiplyScalar(EXPO * 1.6);
  const base = e.horiz.clone().multiplyScalar(0.55);
  const noiteA = new THREE.Color(0.003, 0.005, 0.011).multiplyScalar(1 + 2 * e.luaI);
  u.uNuvAmb.value.set(base.r + noiteA.r, base.g + noiteA.g, base.b + noiteA.b);
  u.uNuvTopo.value.set(zen.r + noiteA.r, zen.g + noiteA.g, zen.b + noiteA.b);

  const l = e.luz;
  luzDir.color.copy(l.corSol); luzDir.intensity = l.intensidade;
  hemi.color.copy(l.ambiente); hemi.groundColor.copy(l.ambiente).multiply(new THREE.Color(0.45, 0.4, 0.33)); hemi.intensity = l.ambienteForca * (env ? 0.35 : 1);
  {
    const c = luzDir.shadow.camera; c.left = -sombra; c.right = sombra; c.top = sombra; c.bottom = -sombra; c.near = 1; c.far = 2000; c.updateProjectionMatrix();
  }
  // a luz acompanha a camera (o mundo posiciona a camera no proprio useFrame, prioridade 0; este roda depois e antes do Look)
  useFrame(({camera}) => {
    const fw = new THREE.Vector3(); camera.getWorldDirection(fw); fw.y = 0;
    if (fw.lengthSq() < 1e-6) fw.set(0, 0, -1);
    fw.normalize();
    const alvo = camera.position.clone().addScaledVector(fw, sombra * 0.6); alvo.y = 0;
    luzDir.target.position.copy(alvo); luzDir.target.updateMatrixWorld();
    luzDir.position.copy(alvo).addScaledVector(l.sol, 800);
    if (env) {
      ibl.cam.update(gl, ibl.cena);
      ibl.saida = ibl.pm.fromCubemap(ibl.rt.texture, ibl.saida ?? undefined);
      scene.environment = ibl.saida.texture; (scene as any).environmentIntensity = envForca;
    }
  }, 0.5);

  return (
    <>
      <mesh material={mat} renderOrder={-1000} frustumCulled={false}>
        <sphereGeometry args={[10, 64, 32]} />
      </mesh>
      <primitive object={luzDir} />
      <primitive object={luzDir.target} />
      <primitive object={hemi} />
    </>
  );
};
