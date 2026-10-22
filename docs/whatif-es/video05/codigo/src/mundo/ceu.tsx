// Ceu em lapso de tempo (dono: agente Ceu). Contrato: CeuTempo (cupula + luz direcional + luz ambiente) e luzEm(t).
// Tudo e funcao de t (segundo do ORIGINAL). Geometria real: latitude 40 N, oeste = -z (o Sol se poe a frente), leste = +z,
// norte = +x, sul = -x. O Sol anda no seu circulo de declinacao; o "obturador" (janela de tempo que cada quadro integra)
// cresce com a velocidade do tempo: o disco vira traco (35-41 s), o traco vira arco (41 s), e quando a janela passa de um ano
// o arco vira a faixa entre os dois solsticios (bordas brilhantes = o Sol demora nos solsticios), que olhando para cima
// aparece como dois arcos que se cruzam em sela/ampulheta (167 s, 260 s). O ceu e a media do ceu ao longo da janela
// (dia + noite = crepusculo uniforme). Estrelas: rastros em torno do polo celeste (+x, 40 graus), precessao (a Polar sai do
// norte), movimento proprio ("as estrelas jorram"). Nuvens procedurais (fbm com auto-sombra na direcao do Sol).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {horaDoDia, diaDoAno, logTaxa} from '../tempo';
import {poseCamera} from '../roteiro';

export type LuzTempo = {sol: THREE.Vector3; dia: number; corSol: THREE.Color; intensidade: number; ambiente: THREE.Color; ambienteForca: number};

// ---------------------------------------------------------------- utilidades
const PI2 = Math.PI * 2;
const cl01 = (x: number) => Math.min(1, Math.max(0, x));
const sm = (a: number, b: number, x: number) => { const u = cl01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const hashR = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
// tabela [t, v] interpolada com suavizacao entre chaves
const tab = (K: [number, number][], t: number) => {
  if (t <= K[0][0]) return K[0][1];
  for (let i = 0; i < K.length - 1; i++) {
    const [a, va] = K[i], [b, vb] = K[i + 1];
    if (t <= b) { const u = cl01((t - a) / Math.max(1e-6, b - a)); return va + (vb - va) * u * u * (3 - 2 * u); }
  }
  return K[K.length - 1][1];
};
type C3 = [number, number, number];
const tabC = (K: [number, C3][], t: number): C3 => [0, 1, 2].map((k) => tab(K.map(([a, c]) => [a, c[k]] as [number, number]), t)) as C3;

// ---------------------------------------------------------------- astronomia
const LAT = (40 * Math.PI) / 180, SF = Math.sin(LAT), CF = Math.cos(LAT);
const EPS = (23.44 * Math.PI) / 180;
const RELOGIO_SOLAR = 0.71;  // horas: relogio (horario de verao) - hora solar. Por do sol 18:15:42, nascer 7:10 (como no original)
const decl = (dia: number) => -EPS * Math.cos((PI2 * (dia + 10)) / 365.25);
const raSol = (dia: number) => (PI2 * (dia - 79)) / 365.25;
// sistema horario h = (cosd cosH, cosd sinH, sind) (H = angulo horario, cresce para oeste) -> mundo
const A = new THREE.Matrix3().set(-SF, 0, CF, CF, 0, SF, 0, -1, 0);     // colunas: h.x, h.y, h.z
const AT = A.clone().transpose();
const F = new THREE.Matrix3().set(1, 0, 0, 0, -1, 0, 0, 0, 1);
const AF = A.clone().multiply(F);
const dirH = (H: number, d: number) => new THREE.Vector3(Math.cos(d) * Math.cos(H), Math.cos(d) * Math.sin(H), Math.sin(d)).applyMatrix3(A);
const rotZ = (a: number) => { const c = Math.cos(a), s = Math.sin(a); return new THREE.Matrix3().set(c, -s, 0, s, c, 0, 0, 0, 1); };
const eqv = (raG: number, deG: number) => { const r = (raG * Math.PI) / 180, d = (deG * Math.PI) / 180; return new THREE.Vector3(Math.cos(d) * Math.cos(r), Math.cos(d) * Math.sin(r), Math.sin(d)); };
const POLO_ECL = eqv(270, 66.56);
const POLAR = eqv(37.95, 89.264);
// precessao (rotacao em torno do polo da ecliptica): artistica, para a Polar sair do norte em 120,8-123,2
const precAng = (t: number) => tab([[0, 0], [119.6, 0], [121.0, 0.3], [123.2, 1.05], [140, 2.0], [330, 9]], t);
const precM = (t: number) => new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationAxis(POLO_ECL, -precAng(t)));
// eq (J2000, precessado) -> mundo para um tempo sideral
const eqMundo = (lst: number, P: THREE.Matrix3) => AF.clone().multiply(rotZ(-lst)).multiply(P);


// Giro da faixa (artistico) nos dois trechos olhando para cima: o equador celeste passa pelo centro do quadro, entao as
// bordas da faixa (solsticios, declinacao +-23,4) aparecem como dois arcos que se cruzam em sela (167-174,3) e em
// ampulheta (260-274). Fora desses trechos o ceu fica na geometria real.
const EQ0 = new THREE.Vector3(-SF, CF, 0);   // ponto do equador no meridiano (sul, 50 graus de altura)
const giroAlvo = (tc: number, incl: number) => {
  const c = poseCamera(tc), C = c.dir.clone().normalize();
  const q1 = new THREE.Quaternion().setFromUnitVectors(EQ0, C);
  const T1 = new THREE.Vector3(0, 0, 1).applyQuaternion(q1);
  const R = new THREE.Vector3(1, 0, 0).applyQuaternion(c.quat), U = new THREE.Vector3(0, 1, 0).applyQuaternion(c.quat);
  const Tw = R.clone().multiplyScalar(Math.cos(incl)).addScaledVector(U, Math.sin(incl));
  const a = Math.atan2(T1.clone().cross(Tw).dot(C), T1.dot(Tw));
  return new THREE.Quaternion().setFromAxisAngle(C, a).multiply(q1);
};
const GIRO_SELA = giroAlvo(170, 0.6), GIRO_AMP = giroAlvo(267, -0.62);
const giroEm = (t: number) => {
  const w1 = sm(166.2, 167, t) * (1 - sm(174.3, 174.8, t)), w2 = sm(260, 261, t) * (1 - sm(274, 275.5, t));
  if (w1 > 0) return new THREE.Quaternion().slerp(GIRO_SELA, w1);
  if (w2 > 0) return new THREE.Quaternion().slerp(GIRO_AMP, w2);
  return null;
};

// ---------------------------------------------------------------- relogio do ceu
const taxaDias = (t: number) => Math.pow(10, logTaxa(t)) / 86400;          // dias la fora por segundo do video
// obturador das horas (traco do Sol, media dia/noite, rastros) e das estacoes (largura da faixa)
const S1 = (t: number) => tab([[0, 0.02], [26, 0.03], [28, 0.07], [30, 0.07], [31, 0.1], [38.5, 0.1], [40, 0.3], [41, 0.9], [42.5, 1.5]], t);
const S2 = (t: number) => 0.12 + 0.88 * sm(66, 75, t);
const solarH = (t: number) => ((horaDoDia(t) - RELOGIO_SOLAR - 12) / 24) * PI2;  // angulo horario do Sol
// tempo sideral "visivel": real ate 41 s; depois os rastros sao circulos completos e o ceu gira devagar (sem pulos)
const T_LIVRE = 41;
const lstReal = (t: number) => solarH(t) + raSol(diaDoAno(t));
const LST_41 = lstReal(T_LIVRE);
const lstVis = (t: number) => (t < T_LIVRE ? lstReal(t) : LST_41 + 0.04 * (t - T_LIVRE) + 1.85 * sm(119, 120.5, t));

// ---------------------------------------------------------------- nuvens: deslocamento integrado (tabela fixa)
const VEL_NUV: [number, number][] = [[6.4, 0.006], [18.5, 0.012], [24, 0.45], [41, 0.7], [116, 0.7], [129, 0.7], [235, 0.8], [239.5, 2.2], [252.5, 2.2], [330, 0.5]];
const NUV_DT = 0.05;
const NUV_INT = (() => { const n = Math.ceil(340 / NUV_DT) + 2, a = new Float64Array(n); for (let i = 1; i < n; i++) a[i] = a[i - 1] + tab(VEL_NUV, (i - 0.5) * NUV_DT) * NUV_DT; return a; })();
const nuvOff = (t: number) => { const x = Math.max(0, Math.min(339, t)) / NUV_DT, i = Math.floor(x), f = x - i; return NUV_INT[i] * (1 - f) + NUV_INT[i + 1] * f; };

// ---------------------------------------------------------------- atmosfera: LUT de espalhamento simples (Nishita + ozonio)
// 3D: azimute relativo ao Sol x altura da visada x altura do Sol. Fase (Rayleigh/Mie) aplicada no shader (exata).
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
let _lut: {R: THREE.Data3DTexture; M: THREE.Data3DTexture} | null = null;
const lutAtmos = () => {
  if (_lut) return _lut;
  const n = NA * NV * NS, R = new Uint16Array(n * 4), M = new Uint16Array(n * 4), res = [0, 0, 0, 0, 0, 0];
  const h = THREE.DataUtils.toHalfFloat;
  for (let z = 0; z < NS; z++) for (let y = 0; y < NV; y++) for (let x = 0; x < NA; x++) {
    integra(veDe(y / (NV - 1)), seDe(z / (NS - 1)), (Math.PI * x) / (NA - 1), 16, 6, res);
    const i = (x + y * NA + z * NA * NV) * 4;
    // escala 1e3 para nao perder precisao no meio-float
    R[i] = h(res[0] * 1e3); R[i + 1] = h(res[1] * 1e3); R[i + 2] = h(res[2] * 1e3); R[i + 3] = h(1);
    M[i] = h(res[3] * 1e3); M[i + 1] = h(res[4] * 1e3); M[i + 2] = h(res[5] * 1e3); M[i + 3] = h(1);
  }
  const mk = (d: Uint16Array) => {
    const t = new THREE.Data3DTexture(d, NA, NV, NS);
    t.format = THREE.RGBAFormat; t.type = THREE.HalfFloatType; t.minFilter = t.magFilter = THREE.LinearFilter;
    t.wrapS = t.wrapT = t.wrapR = THREE.ClampToEdgeWrapping; t.unpackAlignment = 1; t.needsUpdate = true; return t;
  };
  _lut = {R: mk(R), M: mk(M)};
  return _lut;
};
// transmitancia ate o Sol (Kasten-Young + espessuras oticas ajustadas ao LUT): cor do Sol perto do horizonte
const TAU = [0.062, 0.139, 0.27];
const massaAr = (y: number) => {
  const e = (Math.asin(Math.max(-1, Math.min(1, y))) * 180) / Math.PI;
  return e < -1 ? 1e4 : 1 / (Math.max(0, Math.sin((e * Math.PI) / 180)) + 0.50572 * Math.pow(Math.max(0.01, e + 6.07995), -1.6364));
};
const transSol = (y: number) => { const m = massaAr(y); return new THREE.Color(Math.exp(-TAU[0] * m), Math.exp(-TAU[1] * m), Math.exp(-TAU[2] * m)); };


// ---------------------------------------------------------------- cor/intensidade do Sol por altura
const corSolAlt = (y: number) => {
  const c = transSol(Math.max(0, y) + 0.004), m = Math.max(1e-4, c.r, c.g, c.b);
  return c.multiplyScalar(1 / m).lerp(new THREE.Color(1, 1, 1), 0.12);
};
const intSolAlt = (y: number) => 3.3 * sm(-0.035, 0.1, y) * (0.4 + 0.6 * sm(0.0, 0.5, y));

// ---------------------------------------------------------------- estado do ceu em t
const K = 16;   // amostras do Sol na janela (media do ceu)
const ND = 16;  // declinacoes da faixa (janela parcial do ano)
type Estado = {
  amostras: THREE.Vector3[]; diaMedio: number; Hsol: number; decSol: number; trail: number; decs: number[]; sig: number; sigG: number;
  anual: number; bandaI: number; bandaCor: C3; solDir: THREE.Vector3; discoI: number; ar: number;
  nuv: number; nuvEst: number; vapor: number; nuvOff: number; faixa: number; tinta: C3; fundo: C3; fundoTopo: C3;
  estrelas: number; dH: number; pm: number; lst: number; P: THREE.Matrix3; via: number; viaLst: number; luz: LuzTempo; noiteBase: number;
};

const estadoDe = (t: number): Estado => {
  const taxa = taxaDias(t);
  const Wh = taxa * S1(t);                      // dias integrados no quadro (horas)
  const Wd = Math.min(400, taxa * S2(t));       // dias integrados (estacoes)
  const fy = Wd / 365.25;
  const dia = t < 80 ? diaDoAno(t) : 172;       // depois de 80 s a janela ja e maior que um ano
  const Hsol = t < T_LIVRE ? solarH(t) : 0;
  const decSol = decl(dia);
  // amostras do Sol na janela: horas espalhadas por igual; estacoes espalhadas pela janela (ou pelo ano inteiro)
  const amostras: THREE.Vector3[] = [];
  for (let i = 0; i < K; i++) {
    const fh = (i + 0.5) / K, fs = (((i * 7) % K) + 0.5) / K;
    const H = Wh < 1 ? Hsol - Wh * fh * PI2 : (t < T_LIVRE ? Hsol : 0) - fh * PI2;
    const d = fy >= 1 ? EPS * Math.sin(PI2 * fs) : decl(dia - Wd * fs);
    amostras.push(dirH(H, d));
  }
  const decs: number[] = [];
  for (let k = 0; k < ND; k++) decs.push(fy >= 1 ? EPS * Math.sin(Math.PI * ((k + 0.5) / ND) - Math.PI / 2) : decl(dia - Wd * ((k + 0.5) / ND)));
  const faixaDec = Math.max(...decs) - Math.min(...decs);
  const trail = Math.min(PI2 + 0.01, Wh * PI2);
  const sig0 = tab([[0, 0.006], [64, 0.006], [72.5, 0.006], [76, 0.011], [116, 0.011], [167, 0.012], [217, 0.014], [224, 0.04], [235, 0.035],
    [252, 0.02], [260, 0.012], [297, 0.016], [309, 0.03]], t);
  const sig = Math.max(sig0, (faixaDec / ND) * 0.9 * (1 - sm(0.6, 1, fy)));
  const sigG = tab([[0, 0.02], [41, 0.022], [64, 0.03], [75, 0.07], [217, 0.075], [224, 0.15], [240, 0.12], [260, 0.06], [309, 0.1]], t);
  const anual = sm(0.6, 1, fy);
  const bandaI = tab([[0, 9], [41, 8], [64, 7], [75, 3.0], [116, 2.8], [150, 2.5], [217, 2.6], [224, 5], [235, 4.5], [252, 3], [260, 2.2], [297, 2.1], [305, 1.2], [309, 1.0], [321.4, 0.8]], t);
  const bandaCor = tabC([[0, [1, 0.95, 0.86]], [252, [1, 0.93, 0.8]], [260, [1, 0.8, 0.5]], [297, [1, 0.78, 0.5]], [302, [1, 0.6, 0.62]], [309, [1, 0.45, 0.32]], [321, [1, 0.35, 0.2]]], t);
  const solDir = dirH(Hsol, decSol);
  const discoI = 60 * (1 - sm(0.03, 0.4, trail)) * (t < T_LIVRE ? 1 : 0);
  // ar (some em 252,5-258: o ceu fica negro)
  const ar = tab([[0, 1], [252.5, 1], [258, 0]], t);
  // nuvens
  const nuv = tab([[0, 0.42], [18.5, 0.46], [24, 0.42], [30, 0.46], [39, 0.4], [42, 0.26], [64, 0.26], [72, 0.15], [75, 0.1], [116, 0.1], [116.4, 0.56], [129, 0.5],
    [131, 0.3], [150, 0.3], [160, 0.26], [199.8, 0.26], [200.4, 0.97], [201.2, 0.97], [201.8, 0.26], [208, 0.16], [216, 0.06], [234.5, 0.06], [235, 0.2],
    [239, 0.82], [239.5, 1.0], [250.5, 1.0], [252.5, 0]], t);
  const nuvEst = tab([[0, 1], [18.5, 1], [24, 1.8], [41, 2.0], [116, 2.0], [116.4, 1.5], [129, 1.8], [235, 1.6], [239.5, 2.0]], t);
  const vapor = tab([[0, 0], [199.8, 0], [200.4, 0.55], [201.2, 0.55], [201.8, 0], [234.5, 0], [237, 0.45], [239.5, 1], [250.5, 1], [252.5, 0]], t);
  const faixa = tab([[0, 0], [238.5, 0], [240, 1], [246, 1], [248, 0.7], [251, 0.5], [253, 0]], t);
  // fim: brilho dourado no topo (299-309), ceu vermelho-alaranjado (305-309), vermelho-escuro (309,3-321,4)
  const fundo = tabC([[0, [0, 0, 0]], [300, [0, 0, 0]], [305, [0.16, 0.05, 0.015]], [309, [0.34, 0.08, 0.025]], [310.5, [0.2, 0.035, 0.012]], [314, [0.24, 0.045, 0.014]],
    [321.4, [0.42, 0.09, 0.02]]], t);
  const fundoTopo = tabC([[0, [0, 0, 0]], [298, [0, 0, 0]], [300.5, [0.3, 0.19, 0.06]], [305, [0.4, 0.2, 0.06]], [309, [0.3, 0.09, 0.03]], [312, [0.1, 0.02, 0.01]]], t);
  const tinta = tabC([[0, [1, 1, 1]], [234.5, [1, 1, 1]], [239.5, [0.85, 0.72, 0.6]], [250.5, [0.85, 0.72, 0.6]], [252.5, [1, 1, 1]]], t);
  // estrelas
  let diaMedio = 0, crep = 0; for (const s of amostras) { diaMedio += sm(-0.08, 0.12, s.y) / K; crep += sm(-0.24, 0.02, s.y) / K; }
  const noiteBase = 1 - diaMedio;
  const estMult = tab([[0, 1], [41, 1], [44, 0.35], [72, 0.35], [117.4, 0.35], [118, 1.8], [119.2, 1.8], [120, 0.5], [150, 0.35], [166.5, 0.35], [167, 0.75],
    [174.3, 0.75], [175, 0.3], [234, 0.3], [237, 0], [251, 0], [253, 0.5], [258, 0.9], [300, 0.9], [309, 0.6], [321.4, 0.4]], t);
  const estrelas = estMult * Math.max(Math.pow(1 - crep, 1.5) * ar, 1 - ar) * (1 - 0.85 * nuv);
  const dH = t < 150 ? Math.min(PI2, trail * tab([[0, 0.35], [40, 0.35], [43, 1]], t)) : tab([[150, PI2], [151.5, 0.25], [251, 0.25], [254, 0.0]], t);
  // movimento proprio: o "jorro" de riscos so em 167-174,3; fora disso estrelas pontuais
  const pm = tab([[0, 0], [166.2, 0], [167, 0.22], [174.3, 0.22], [175, 0]], t);
  const P = precM(t);
  const via = tab([[0, 0], [252.5, 0], [258, 0.5], [264.5, 0.7], [265, 1], [268, 1], [270, 0.75], [297, 0.6], [305, 0]], t);
  const viaLst = lstVis(t) + 2.6 * sm(265, 268, t);

  // ------------------------------------------------ luz (media das amostras)
  const sd = new THREE.Vector3(); let I = 0; const cor = new THREE.Color(0, 0, 0);
  for (const s of amostras) {
    const i = intSolAlt(s.y) / K; I += i; sd.addScaledVector(s, i); cor.add(corSolAlt(s.y).multiplyScalar(i));
  }
  const lua = new THREE.Vector3(0.25, 0.85, 0.45).normalize();
  const noite = 1 - sm(0.05, 0.6, I);
  const sol = sd.lengthSq() > 1e-8 ? sd.normalize() : lua.clone();
  if (sol.y < 0.12) sol.y = 0.12;
  sol.lerp(lua, noite * 0.85).normalize();
  if (I > 1e-5) cor.multiplyScalar(1 / I); else cor.setRGB(1, 1, 1);
  cor.lerp(new THREE.Color(0.55, 0.65, 1.0), noite);
  let intensidade = I + 0.14 * noite;
  const amb = new THREE.Color(0.08, 0.11, 0.22).lerp(new THREE.Color(0.62, 0.74, 1.0), diaMedio);
  amb.lerp(new THREE.Color(0.95, 0.62, 0.55), 0.35 * diaMedio * (1 - diaMedio) * 4 * 0.5);
  let ambF = 0.16 + 0.55 * diaMedio;
  // depois de 41 s a luz e a MEDIA de dias inteiros: branco-quente neutro (o por do sol e so uma fracao do dia), vinda de um
  // Sol medio alto; ambiente um pouco mais frio. Sem isto a media ponderada puxava para laranja e tingia o horizonte de vermelho.
  {
    const w = sm(39.5, 42, t);
    if (w > 0) {
      cor.lerp(new THREE.Color('#ffeedd'), w);
      intensidade = intensidade * (1 - w) + w * 1.9;
      const alto = sol.clone(); if (alto.y < 0.55) { alto.y = 0.55; alto.normalize(); }
      sol.lerp(alto, w).normalize();
      amb.lerp(new THREE.Color(0.66, 0.74, 0.92), w); ambF = ambF * (1 - w) + w * 0.55;
    }
  }
  // fases: nuvens escuras/vapor, sem ar, gigante vermelha
  const escuro = vapor * nuv;
  intensidade *= 1 - 0.55 * escuro; cor.lerp(new THREE.Color(1.0, 0.68, 0.45), escuro * 0.7);
  amb.lerp(new THREE.Color(0.55, 0.42, 0.33), escuro * 0.8); ambF *= 1 - 0.3 * escuro;
  const semAr = 1 - ar;
  const f252 = sm(251, 253, t) * (1 - sm(258.5, 260.5, t));                              // 252-260: escura
  const f260 = sm(258.5, 260.5, t);
  intensidade = intensidade * (1 - f252 * 0.75);
  if (t >= 258.5) intensidade = intensidade * (1 - f260) + f260 * tab([[258.5, 2.4], [297, 2.4], [303, 1.7], [309, 2.6], [312, 3.4], [321.4, 6.5]], t);
  cor.lerp(new THREE.Color(1.0, 0.93, 0.82), semAr * f260);
  cor.lerp(new THREE.Color(1.0, 0.6, 0.62), sm(299, 305, t) * (1 - sm(305, 309, t)));
  cor.lerp(new THREE.Color(1.0, 0.36, 0.14), sm(304, 310, t));
  amb.lerp(new THREE.Color(0.25, 0.26, 0.32), semAr); ambF = ambF * (1 - semAr) + semAr * 0.06;
  amb.lerp(new THREE.Color(1.0, 0.4, 0.18), sm(303, 311, t)); ambF += sm(303, 311, t) * 0.35 + sm(312, 321.4, t) * 0.5;
  if (t >= 258.5) { const alto = new THREE.Vector3(-0.55, 0.78, -0.3).normalize(); sol.lerp(alto, f260).normalize(); }
  const luz: LuzTempo = {sol, dia: diaMedio * ar, corSol: cor, intensidade, ambiente: amb, ambienteForca: ambF};
  return {amostras, diaMedio, Hsol, decSol, trail, decs, sig, sigG, anual, bandaI, bandaCor, solDir, discoI, ar, nuv, nuvEst, vapor, nuvOff: nuvOff(t), faixa,
    tinta, fundo, fundoTopo, estrelas, dH, pm, lst: lstVis(t), P, via, viaLst, luz, noiteBase};
};
// cache curto (luzEm e chamado por varios mundos no mesmo quadro)
const _cache = new Map<number, Estado>();
const estado = (t: number) => {
  let e = _cache.get(t);
  if (!e) { e = estadoDe(t); if (_cache.size > 8) _cache.clear(); _cache.set(t, e); }
  return e;
};

export const luzEm = (t: number): LuzTempo => {
  const l = estado(t).luz;
  return {sol: l.sol.clone(), dia: l.dia, corSol: l.corSol.clone(), intensidade: l.intensidade, ambiente: l.ambiente.clone(), ambienteForca: l.ambienteForca};
};
// extra (fora do contrato): cor do horizonte para a nevoa dos mundos
export const corHorizonte = (t: number): THREE.Color => {
  const e = estado(t), d = e.diaMedio * e.ar;
  const c = new THREE.Color(0.05, 0.06, 0.1).lerp(new THREE.Color(0.72, 0.78, 0.9), d);
  c.lerp(new THREE.Color(0.93, 0.6, 0.55), 0.6 * d * (1 - d) * 4 * 0.5 + 0.55 * (1 - sm(23.5, 26, t)));
  c.lerp(new THREE.Color(0.45, 0.36, 0.3), e.vapor * e.nuv);
  c.lerp(new THREE.Color(e.fundo[0] * 1.5, e.fundo[1] * 1.5, e.fundo[2] * 1.5), sm(300, 309, t));
  return c;
};

// ---------------------------------------------------------------- shaders
const NOISE = /* glsl */ `
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*f*(f*(f*6.0-15.0)+10.0);
  return mix(mix(hash12(i), hash12(i+vec2(1.0,0.0)), u.x), mix(hash12(i+vec2(0.0,1.0)), hash12(i+vec2(1.0,1.0)), u.x), u.y); }
const mat2 RO = mat2(1.6, 1.2, -1.2, 1.6);
float fbm6(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 6; i++){ s += a * vnoise(p); p = RO * p + vec2(1.7, 9.2); a *= 0.5; } return s; }
float fbm3(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 3; i++){ s += a * vnoise(p); p = RO * p + vec2(3.1, 4.7); a *= 0.5; } return s; }
`;

const CEU_VS = /* glsl */ `
varying vec3 vDir;
void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const CEU_FS = /* glsl */ `
precision highp float;
precision highp sampler3D;
varying vec3 vDir;
uniform vec3 uS[${K}];
uniform float uExpo, uAr, uNoiteBase, uTeto;
uniform mat3 uW2H, uW2Eq;
uniform float uHsol, uTrail, uSig, uSigG, uGlowI, uBandaI, uAnual, uEps, uDiscoI;
uniform float uDec[${ND}];
uniform vec3 uBandaCor, uSolDir;
uniform float uNuv, uNuvEst, uVapor, uNuvOff, uFaixa, uVia, uSat, uPx, uRosa, uMie;
uniform vec3 uLuzDir, uNuvLuz, uNuvAmb, uTinta, uFundo, uFundoTopo;
${NOISE}
uniform highp sampler3D uLutR, uLutM;
const float PI = 3.14159265;
float lc(float p, float n){ return (p * (n - 1.0) + 0.5) / n; }
vec3 kasten(float y){ float e = degrees(asin(clamp(y, -1.0, 1.0))); float m = e < -1.0 ? 1e4 : 1.0 / (max(0.0, sin(radians(e))) + 0.50572 * pow(max(e + 6.07995, 0.01), -1.6364));
  return exp(-vec3(0.062, 0.139, 0.27) * m); }
// ceu de espalhamento simples (LUT) para a visada d e o Sol s
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
  // 20 (irradiancia do Sol) x 1e-3 (escala do LUT); termo isotropico ~ espalhamento multiplo
  return 0.02 * (R * (pr + 0.025) + M * pm * uMie);
}
float g(float x, float s){ return exp(-0.5 * x * x / (s * s)); }
// densidade do arco-seno suavizada (Sol ao longo do ano: demora nos solsticios)
float anual(float ad, float s){
  float e = uEps;
  float edge = 1.0 / sqrt(2.0 * e * s);
  float v = ad < e ? 1.0 / sqrt(e * e - ad * ad + 2.0 * e * s) : edge * g(ad - e, s);
  return v / edge;  // borda = 1
}
float densNuv(vec2 p){
  vec2 w = normalize(vec2(0.3, 1.0));
  vec2 q = vec2(dot(p, vec2(w.y, -w.x)), dot(p, w) / uNuvEst);
  q.y -= uNuvOff;
  float warp = fbm3(q * 0.55 + vec2(5.2, 1.3) - vec2(0.0, uNuvOff * 0.2));
  float n = fbm6(q + 0.9 * vec2(warp, -warp));
  float c = min(uNuv, 1.0 - 0.3 * uVapor);
  return smoothstep(1.0 - c * 0.95 - 0.06, 1.0 - c * 0.95 + 0.26, n);
}
void main(){
  vec3 d = normalize(vDir);
  vec3 dh = normalize(vec3(d.x, max(d.y, 0.0015), d.z));
  vec3 ceu = vec3(0.0);
  for (int i = 0; i < ${K}; i++) { vec3 a = atmos(dh, uS[i]); ceu += a / (1.0 + a * uTeto); }
  ceu *= uExpo / float(${K});
  // ceu noturno (azul profundo, mais claro no horizonte)
  ceu += mix(vec3(0.012, 0.018, 0.04), vec3(0.002, 0.004, 0.012), sqrt(dh.y)) * uNoiteBase;
  // por do sol rosado (como no original): faixa rosa-alaranjada no horizonte, mais forte do lado do Sol
  { float lado = 0.5 + 0.5 * dot(normalize(dh.xz + 1e-5), normalize(uSolDir.xz + 1e-5));
    ceu += uRosa * (vec3(0.55, 0.22, 0.2) * exp(-dh.y / 0.09) * (0.35 + 0.65 * lado) + vec3(0.12, 0.06, 0.12) * exp(-dh.y / 0.35)); }
  ceu *= uAr;
  { float lum = dot(ceu, vec3(0.2126, 0.7152, 0.0722)); ceu = max(vec3(0.0), mix(vec3(lum), ceu, uSat)); }
  // Via Lactea (plano galactico), visivel sem ar
  if (uVia > 0.001) {
    vec3 e = uW2Eq * d;
    const vec3 GNP = vec3(-0.8676, -0.1981, 0.4560);
    const vec3 GC = vec3(-0.0548, -0.8734, -0.4838);
    float b = dot(e, GNP);
    vec3 ex = normalize(GC), ey = cross(GNP, ex);
    float l = atan(dot(e, ey), dot(e, ex));
    vec2 uv = vec2(l * 7.0, b * 22.0);
    float m = fbm6(uv) ;
    float lane = 1.0 - 0.75 * g(b - 0.012 * sin(l * 3.0), 0.018) * smoothstep(0.35, 0.7, fbm3(uv * 1.7 + 4.0));
    float banda = g(b, 0.07 + 0.03 * fbm3(uv * 0.5)) * (0.35 + 0.8 * smoothstep(0.3, 0.8, m)) * lane;
    banda *= 0.75 + 0.5 * fbm3(uv * 6.0);
    float bojo = g(length(vec2(l, b * 1.6)), 0.35);
    ceu += vec3(0.85, 0.8, 0.74) * (banda * (0.45 + 1.0 * bojo)) * 0.16 * uVia * smoothstep(-0.02, 0.05, d.y);
  }
  // listra / faixa do Sol (no sistema horario)
  vec3 h = uW2H * d;
  float dd = asin(clamp(h.z, -1.0, 1.0));
  float cd = sqrt(max(1e-6, 1.0 - h.z * h.z));
  float faixaS = 0.0;
  if (uAnual < 0.999) {
    float along = 1.0;
    if (uTrail < 6.2832) {
      float Hd = atan(h.y, h.x);
      float a = mod(uHsol - Hd, 6.2832);
      float front = 6.2832 - a;
      float sg = uSig;
      if (a <= uTrail) along = pow(1.0 - 0.8 * a / max(uTrail, 1e-4), 1.6);
      else along = max(g(front * cd, sg * 1.2), 0.2 * pow(0.2, 1.6) * g((a - uTrail) * cd, sg * 4.0));
      along *= 1.0 + 1.5 * g(a * cd, sg * 2.0) * (1.0 - smoothstep(0.05, 0.6, uTrail));
    }
    float s = 0.0;
    float sgc = max(uSig, 1.3 * uPx);
    for (int k = 0; k < ${ND}; k++){ float x = dd - uDec[k]; s += g(x, sgc) * (uSig / sgc) + uGlowI * g(x, uSigG); }
    float n = uTrail < 6.2832 ? 1.0 : float(${ND});
    faixaS += (1.0 - uAnual) * along * s / (uTrail < 6.2832 ? float(${ND}) : n);
  }
  if (uAnual > 0.001) { float sgc2 = max(uSig, 1.3 * uPx); faixaS += uAnual * (pow(anual(abs(dd), sgc2), 3.5) + uGlowI * 1.6 * pow(anual(abs(dd), uSigG), 7.0)); }
  float horiz = smoothstep(-0.012, 0.02, d.y);
  vec3 tr = kasten(max(d.y, 0.0));
  vec3 corF = uBandaCor * mix(vec3(1.0), tr / max(tr.r, 1e-3) * (0.35 + 0.65 * tr.r), uAr);
  vec3 sol = corF * faixaS * uBandaI * horiz;
  // disco do Sol (so quando o traco e curto)
  float cs = dot(d, uSolDir);
  float ang = acos(clamp(cs, -1.0, 1.0));
  sol += uDiscoI * (smoothstep(0.0105, 0.0085, ang) + 0.03 * exp(-ang / 0.02) + 0.006 * exp(-ang / 0.08)) * horiz * kasten(max(uSolDir.y, 0.0));
  ceu += sol * 0.7;
  // nuvens (camada a ~2 km; auto-sombra marchando na direcao da luz)
  ceu = mix(ceu, vec3(0.16, 0.12, 0.09) * (0.6 + 0.6 * uFaixa), uVapor * 0.85);
  if (uNuv > 0.003 && d.y > -0.02) {
    vec2 p = d.xz / (max(d.y, 0.0) + 0.045) * 1.6;
    float dn = densNuv(p);
    if (dn > 0.002) {
      vec2 lp = normalize(uLuzDir.xz + vec2(1e-4)) * 0.11;
      float acc = densNuv(p + lp) + densNuv(p + lp * 2.2) + densNuv(p + lp * 3.6);
      float tr = exp(-acc * (1.0 + uVapor));
      float mu = dot(d, uLuzDir);
      float fase = 0.6 + 1.6 * pow(max(mu, 0.0), 6.0) + 0.25 * mu;
      vec3 corN = uNuvAmb * (0.55 + 0.45 * (1.0 - dn)) + uNuvLuz * (tr * fase + 0.12 * (1.0 - dn));
      // vapor: base marrom-acinzentada, borda de baixo alaranjada perto do horizonte
      corN = mix(corN, corN * vec3(0.75, 0.62, 0.52) * (0.6 + 0.4 * (1.0 - dn)), uVapor);
      corN += vec3(1.0, 0.45, 0.15) * uFaixa * 0.5 * exp(-max(d.y, 0.0) * 14.0);
      float alfa = dn * mix(smoothstep(-0.005, 0.09, d.y), smoothstep(-0.01, 0.02, d.y), uVapor);
      corN = mix(corN, ceu, exp(-max(d.y, 0.0) * 18.0) * 0.55 * (1.0 - uVapor));
      ceu = mix(ceu, corN, clamp(alfa, 0.0, 1.0));
    }
  }
  ceu += sol * 0.3 * (1.0 - uVapor);
  // faixa laranja no horizonte (oceanos fervendo)
  ceu += vec3(1.0, 0.42, 0.12) * uFaixa * 1.4 * exp(-abs(d.y) / 0.025);
  ceu *= uTinta;
  ceu += uFundo * (0.65 + 0.6 * (1.0 - dh.y)) + uFundoTopo * pow(dh.y, 3.0);
  // abaixo do horizonte: o chao dos mundos cobre; aqui so uma bruma escura
  if (d.y < 0.0) ceu *= mix(1.0, 0.45, smoothstep(0.0, 0.25, -d.y));
  gl_FragColor = vec4(max(ceu, vec3(0.0)), 1.0);
}`;

// rastros de estrelas: fitas instanciadas; u = 0 agora, u = 1 o ponto mais antigo da janela
const EST_VS = /* glsl */ `
attribute vec3 aE; attribute vec3 aPM; attribute vec4 aCor;
uniform mat3 uAF, uP; uniform float uLST, uDH, uPM, uW;
varying float vV; varying float vU; varying vec4 vCor;
vec3 rz(vec3 v, float a){ float c = cos(a), s = sin(a); return vec3(c * v.x - s * v.y, s * v.x + c * v.y, v.z); }
vec3 dirEm(float u){ vec3 e = normalize(aE + aPM * (uPM * u)); e = uP * e; return uAF * rz(e, -uLST + u * uDH * aCor.w); }
void main(){
  float u = position.x, v = position.y;
  vec3 p = dirEm(u);
  vec3 T = dirEm(u + 0.004) - dirEm(u - 0.004);
  if (dot(T, T) < 1e-12) T = cross(p, vec3(0.0, 1.0, 0.0));
  T = normalize(T);
  vec3 N = normalize(cross(p, T));
  float w = uW * (0.8 + 0.6 * aCor.w);
  p = normalize(p + N * v * w + T * (u < 0.001 ? -w : (u > 0.999 ? w : 0.0)));
  vV = v; vU = u; vCor = aCor;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p * 80000.0, 1.0);
}`;
const EST_FS = /* glsl */ `
precision highp float;
uniform float uBrilho;
varying float vV; varying float vU; varying vec4 vCor;
void main(){
  float a = exp(-vV * vV * 2.5) * (1.0 - 0.55 * vU);
  gl_FragColor = vec4(vCor.rgb * a * uBrilho, 1.0);
}`;

// ---------------------------------------------------------------- texturas de canvas (sprites)
const texBrilho = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d')!;
  const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.05, 'rgba(255,255,255,0.95)'); g.addColorStop(0.12, 'rgba(255,255,255,0.45)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.12)'); g.addColorStop(0.6, 'rgba(255,255,255,0.03)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 256, 256);
  // raios finos (estrela de difracao suave)
  c.globalCompositeOperation = 'lighter';
  for (const a of [0, Math.PI / 2]) {
    c.save(); c.translate(128, 128); c.rotate(a);
    const l = c.createLinearGradient(-128, 0, 128, 0);
    l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(0.5, 'rgba(255,255,255,0.35)'); l.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = l; c.fillRect(-128, -1.2, 256, 2.4); c.restore();
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
};
// marcador: circulo fino + traco + rotulo em caixa alta espacado. O centro do circulo e o ancora do sprite.
const MW = 1024, MH = 160, MC = 60;
const texMarcador = (txt: string, esq = false) => {
  const cv = document.createElement('canvas'); cv.width = MW; cv.height = MH; const c = cv.getContext('2d')!;
  c.clearRect(0, 0, MW, MH);
  if (esq) { c.translate(MW, 0); c.scale(-1, 1); }
  c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 6;
  c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 3;
  c.beginPath(); c.arc(MC, MH / 2, 22, 0, PI2); c.stroke();
  c.beginPath(); c.moveTo(MC + 22 * 0.75, MH / 2 - 22 * 0.66); c.lineTo(MC + 64, MH / 2 - 44); c.lineTo(MC + 92, MH / 2 - 44); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.97)';
  c.font = '600 34px "Inter", "Helvetica Neue", "Segoe UI", Arial, sans-serif';
  (c as any).letterSpacing = '7px';
  c.textBaseline = 'middle';
  if (esq) { c.setTransform(1, 0, 0, 1, 0, 0); c.textAlign = 'right'; c.fillText(txt, MW - MC - 102, MH / 2 - 44); }
  else c.fillText(txt, MC + 102, MH / 2 - 44);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};

// ---------------------------------------------------------------- objetos pontuais no ceu
const D_SPR = 6000;
const dirTela = (tp: number, dx: number, dy: number) => new THREE.Vector3(dx, dy, -1).applyQuaternion(poseCamera(tp).quat).normalize();
// Lua (29,0-29,8): presa ao ceu, gira com a Terra (o ponto cruza o quadro)
const LUA_EQ = (() => { const D0 = dirTela(29.4, 0.36, 0.16); return D0.applyMatrix3(eqMundo(lstReal(29.4), new THREE.Matrix3()).transpose()); })();
// estrela que passa (152,5-155,5), supernova (125,3-126,3)
const PASSA_A = dirTela(154, 0.42, 0.44), PASSA_B = dirTela(154, 0.3, -0.14);
const SN_A = dirTela(125.8, -0.02, 0.15), SN_B = dirTela(125.8, -0.07, 0.1);

type Ponto = {dir: THREE.Vector3; tam: number; cor: C3; alfa: number; rot?: string; rotAlfa?: number};
const pontosEm = (t: number, e: Estado): Ponto[] => {
  const out: Ponto[] = [];
  const aLua = sm(28.6, 29.0, t) * (1 - sm(29.8, 30.1, t));
  if (aLua > 0) out.push({dir: LUA_EQ.clone().applyMatrix3(eqMundo(lstReal(t), new THREE.Matrix3())).normalize(), tam: 0.05, cor: [1, 0.97, 0.9], alfa: aLua * 1.6});
  const aP = sm(152.3, 152.8, t) * (1 - sm(155.2, 155.6, t));
  if (aP > 0) out.push({dir: PASSA_A.clone().lerp(PASSA_B, sm(152.5, 155.5, t)).normalize(), tam: 0.09 + 0.04 * Math.sin(Math.PI * cl01((t - 152.5) / 3)), cor: [0.92, 0.96, 1.0], alfa: aP * 2.2});
  const aS = sm(125.2, 125.45, t) * (1 - sm(126.0, 126.4, t));
  if (aS > 0) out.push({dir: SN_A.clone().lerp(SN_B, sm(125.3, 126.4, t)).normalize(), tam: 0.07 + 0.05 * sm(125.3, 125.6, t), cor: [0.82, 0.9, 1.0], alfa: aS * 2.6, rot: 'BETELGEUSE', rotAlfa: aS});
  return out;
};

// ---------------------------------------------------------------- componente
const N_EST = 3200, SEG = 48;
export const CeuTempo: React.FC<{t: number}> = ({t}) => {
  const {size} = useThree();
  const e = estado(t);
  const cam = poseCamera(t);

  const matCeu = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: CEU_VS, fragmentShader: CEU_FS, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false, toneMapped: false,
    uniforms: {
      uS: {value: Array.from({length: K}, () => new THREE.Vector3(0, 1, 0))}, uExpo: {value: 1}, uTeto: {value: 0}, uLutR: {value: lutAtmos().R}, uLutM: {value: lutAtmos().M}, uAr: {value: 1}, uNoiteBase: {value: 0},
      uW2H: {value: new THREE.Matrix3()}, uW2Eq: {value: new THREE.Matrix3()}, uHsol: {value: 0}, uTrail: {value: 0}, uSig: {value: 0.005}, uSigG: {value: 0.04},
      uGlowI: {value: 0.2}, uBandaI: {value: 1}, uAnual: {value: 0}, uEps: {value: EPS}, uDiscoI: {value: 0}, uDec: {value: new Array(ND).fill(0)},
      uBandaCor: {value: new THREE.Vector3(1, 1, 1)}, uSolDir: {value: new THREE.Vector3(0, 1, 0)}, uNuv: {value: 0}, uNuvEst: {value: 1}, uVapor: {value: 0},
      uNuvOff: {value: 0}, uFaixa: {value: 0}, uVia: {value: 0}, uSat: {value: 1.3}, uRosa: {value: 0}, uMie: {value: 0.55}, uPx: {value: 0.001}, uLuzDir: {value: new THREE.Vector3(0, 1, 0)}, uNuvLuz: {value: new THREE.Vector3(1, 1, 1)},
      uNuvAmb: {value: new THREE.Vector3(0.5, 0.5, 0.5)}, uTinta: {value: new THREE.Vector3(1, 1, 1)}, uFundo: {value: new THREE.Vector3()}, uFundoTopo: {value: new THREE.Vector3()},
    },
  }), []);

  // fitas sem instanciamento (atributos instanciados chegavam zerados no ANGLE/SwiftShader): cada estrela = (SEG+1) x 2 vertices
  const estrelasGeo = useMemo(() => {
    const nv = (SEG + 1) * 2, NVt = N_EST * nv;
    const P = new Float32Array(NVt * 3), E = new Float32Array(NVt * 3), PM = new Float32Array(NVt * 3), COR = new Float32Array(NVt * 4);
    const idx = new Uint32Array(N_EST * SEG * 6);
    let q = 0;
    for (let i = 0; i < N_EST; i++) {
      const z = hashR(i * 3 + 1) * 2 - 1, a = hashR(i * 3 + 2) * PI2, r = Math.sqrt(1 - z * z);
      const v = new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), z);
      const tg = new THREE.Vector3(hashR(i * 7 + 3) - 0.5, hashR(i * 7 + 4) - 0.5, hashR(i * 7 + 5) - 0.5);
      tg.addScaledVector(v, -tg.dot(v)).normalize().multiplyScalar(0.2 + 1.6 * Math.pow(hashR(i * 7 + 6), 2));
      const m = Math.pow(hashR(i * 11 + 9), 7);              // poucas estrelas fortes, muitas fracas
      const b = 0.12 + 2.6 * m;
      const temp = hashR(i * 13 + 5);
      const c = temp < 0.2 ? [1.0, 0.72, 0.5] : temp < 0.45 ? [1.0, 0.9, 0.78] : temp < 0.85 ? [0.95, 0.97, 1.0] : [0.72, 0.82, 1.0];
      const w4 = 0.85 + 0.3 * hashR(i * 17 + 2);
      const b0 = i * nv;
      for (let k = 0; k <= SEG; k++) for (let sd = 0; sd < 2; sd++) {
        const vi = b0 + k * 2 + sd;
        P[vi * 3] = k / SEG; P[vi * 3 + 1] = sd ? 1 : -1;
        E[vi * 3] = v.x; E[vi * 3 + 1] = v.y; E[vi * 3 + 2] = v.z;
        PM[vi * 3] = tg.x; PM[vi * 3 + 1] = tg.y; PM[vi * 3 + 2] = tg.z;
        COR[vi * 4] = c[0] * b; COR[vi * 4 + 1] = c[1] * b; COR[vi * 4 + 2] = c[2] * b; COR[vi * 4 + 3] = w4;
      }
      for (let k = 0; k < SEG; k++) {
        const a0 = b0 + k * 2, a1 = a0 + 1, c0 = a0 + 2, c1 = a0 + 3;
        idx[q++] = a0; idx[q++] = c0; idx[q++] = a1; idx[q++] = a1; idx[q++] = c0; idx[q++] = c1;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3));
    g.setAttribute('aE', new THREE.BufferAttribute(E, 3));
    g.setAttribute('aPM', new THREE.BufferAttribute(PM, 3));
    g.setAttribute('aCor', new THREE.BufferAttribute(COR, 4));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    return g;
  }, []);
  const matEst = useMemo(() => { const m = new THREE.ShaderMaterial({
    vertexShader: EST_VS, fragmentShader: EST_FS, side: THREE.DoubleSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true, fog: false, toneMapped: false,
    uniforms: {uAF: {value: AF.clone()}, uP: {value: new THREE.Matrix3()}, uLST: {value: 0}, uDH: {value: 0}, uPM: {value: 0}, uW: {value: 0.002}, uBrilho: {value: 1}},
  });
    // atributo 0 = position (instanciado no atributo 0 quebra em alguns ANGLE)
    (m as any).index0AttributeName = 'position'; return m; }, []);

  const brilho = useMemo(() => texBrilho(), []);
  const marcas = useMemo(() => ({norte: texMarcador('NORTE'), polar: texMarcador('LA ESTRELLA POLAR'), betel: texMarcador('BETELGEUSE')}), []);
  const luzDir = useMemo(() => {
    const l = new THREE.DirectionalLight();
    l.castShadow = true; l.shadow.mapSize.set(2048, 2048);
    const c = l.shadow.camera; c.left = -45; c.right = 45; c.top = 45; c.bottom = -45; c.near = 1; c.far = 500;
    l.shadow.bias = -0.0004; l.shadow.normalBias = 0.03;
    return l;
  }, []);
  const hemi = useMemo(() => new THREE.HemisphereLight(), []);

  // ---------------- uniforms do quadro
  const u = matCeu.uniforms;
  const giro = giroEm(t);
  for (let i = 0; i < K; i++) { u.uS.value[i].copy(e.amostras[i]); if (giro) u.uS.value[i].applyQuaternion(giro); }
  const expo = 0.62;
  u.uExpo.value = expo * tab([[0, 1], [35, 1], [38, 0.72], [41, 0.68], [72, 0.66], [76, 0.58], [150, 0.5], [252, 0.5]], t);
  u.uSat.value = tab([[0, 1.3], [41, 1.4], [76, 1.5]], t);
  u.uTeto.value = tab([[0, 0], [38, 0], [42, 0.25], [76, 0.5]], t);
  u.uMie.value = tab([[0, 0.55], [36, 0.55], [41, 0.3], [76, 0.12]], t);
  u.uRosa.value = tab([[0, 1], [24.8, 1], [25.6, 0.25], [26.5, 0]], t) * 1.1; u.uAr.value = e.ar; u.uNoiteBase.value = e.noiteBase;
  u.uW2H.value.copy(AT);
  if (giro) u.uW2H.value.multiply(new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(giro.clone().invert())));
  // mundo -> eq (Via Lactea): P^T Rz(lst) F A^T
  u.uW2Eq.value.copy(eqMundo(e.viaLst, e.P).transpose());
  u.uHsol.value = e.Hsol; u.uTrail.value = e.trail; u.uSig.value = e.sig; u.uSigG.value = e.sigG; u.uBandaI.value = e.bandaI; u.uAnual.value = e.anual;
  for (let k = 0; k < ND; k++) u.uDec.value[k] = e.decs[k];
  u.uBandaCor.value.set(...e.bandaCor); u.uSolDir.value.copy(e.solDir); u.uDiscoI.value = e.discoI;
    u.uNuv.value = String((globalThis as any).__dbg ?? '').includes('semNuvem') ? 0 : e.nuv; u.uNuvEst.value = e.nuvEst; u.uVapor.value = e.vapor; u.uNuvOff.value = e.nuvOff; u.uFaixa.value = e.faixa; u.uVia.value = e.via;
  // luz das nuvens: o Sol real (mesmo abaixo do horizonte, para a base rosada no por do sol) ou a luz media
  const l = e.luz;
  const solN = t < T_LIVRE ? e.solDir.clone() : l.sol.clone();
  u.uLuzDir.value.copy(solN);
  const cs = t < T_LIVRE ? corSolAlt(e.solDir.y) : l.corSol;
  const kSol = t < T_LIVRE ? Math.max(0.0, sm(-0.12, 0.05, e.solDir.y)) * (0.55 + 0.6 * sm(0, 0.4, e.solDir.y)) : 0.35 + 0.5 * e.diaMedio;
  const kN = Math.max(kSol, 0.0) * e.ar * expo;
  u.uNuvLuz.value.set(cs.r * kN * 1.25, cs.g * kN * 1.2, cs.b * kN * 1.15);
  const ambN = 0.02 + 0.5 * e.diaMedio * e.ar;
  u.uNuvAmb.value.set(0.62 * ambN + 0.02, 0.68 * ambN + 0.025, 0.82 * ambN + 0.04);
  u.uTinta.value.set(...e.tinta); u.uFundo.value.set(...e.fundo); u.uFundoTopo.value.set(...e.fundoTopo);

  const ue = matEst.uniforms;
  ue.uP.value.copy(e.P); ue.uLST.value = e.lst; ue.uDH.value = e.dH; ue.uPM.value = e.pm;
  const pxAng = (2 * Math.tan((27.5 * Math.PI) / 180)) / Math.max(200, size.height);
  ue.uW.value = Math.max(0.0011, 1.1 * pxAng);
  u.uPx.value = pxAng;
  const ganho = Math.pow(Math.min(1, 0.05 / (0.05 + e.dH * 0.6 + e.pm * 0.8)), 0.55);
  ue.uBrilho.value = e.estrelas * ganho * 1.4;

  // luz da cena
  luzDir.color.copy(l.corSol); luzDir.intensity = l.intensidade;
  luzDir.position.copy(cam.pos).addScaledVector(l.sol, 200); luzDir.target.position.copy(cam.pos);
  luzDir.target.updateMatrixWorld();
  hemi.color.copy(l.ambiente); hemi.groundColor.copy(l.ambiente).multiply(new THREE.Color(0.45, 0.4, 0.33)); hemi.intensity = l.ambienteForca;

  // marcadores (120,8-123,2): NORTE no polo celeste, a Polar precessando para longe dele
  const aMarca = sm(120.7, 121.0, t) * (1 - sm(123.0, 123.3, t));
  const polo = new THREE.Vector3(CF, SF, 0);
  const polar = POLAR.clone().applyMatrix3(eqMundo(e.lst, e.P)).normalize();
  const pontos = pontosEm(t, e);
  const escMarca = 0.07 * D_SPR;
  return (
    <>
      <mesh position={cam.pos} material={matCeu} renderOrder={-1000} frustumCulled={false}>
        <sphereGeometry args={[90000, 64, 32]} />
      </mesh>
      {e.estrelas > 0.002 && <mesh position={cam.pos} geometry={estrelasGeo} material={matEst} renderOrder={-990} frustumCulled={false} />}
      {pontos.map((p, i) => (
        <group key={i}>
          <sprite position={cam.pos.clone().addScaledVector(p.dir, D_SPR)} scale={[p.tam * D_SPR, p.tam * D_SPR, 1]} renderOrder={-980}>
            <spriteMaterial map={brilho} color={new THREE.Color(p.cor[0] * p.alfa, p.cor[1] * p.alfa, p.cor[2] * p.alfa)} transparent blending={THREE.AdditiveBlending}
              depthWrite={false} fog={false} toneMapped={false} />
          </sprite>
          {p.rot && <sprite position={cam.pos.clone().addScaledVector(p.dir, D_SPR)} scale={[escMarca * MW / MH, escMarca, 1]} center={new THREE.Vector2(MC / MW, 0.5)} renderOrder={9500}>
            <spriteMaterial map={marcas.betel} transparent opacity={p.rotAlfa ?? 1} depthWrite={false} depthTest={false} fog={false} toneMapped={false} />
          </sprite>}
        </group>
      ))}
      {aMarca > 0.001 && <>
        <sprite position={cam.pos.clone().addScaledVector(polo, D_SPR)} scale={[escMarca * MW / MH, escMarca, 1]} center={new THREE.Vector2(MC / MW, 0.5)} renderOrder={9500}>
          <spriteMaterial map={marcas.norte} transparent opacity={aMarca} depthWrite={false} depthTest={false} fog={false} toneMapped={false} />
        </sprite>
        <sprite position={cam.pos.clone().addScaledVector(polar, D_SPR)} scale={[escMarca * MW / MH, escMarca, 1]} center={new THREE.Vector2(MC / MW, 0.5)} renderOrder={9500}>
          <spriteMaterial map={marcas.polar} transparent opacity={aMarca} depthWrite={false} depthTest={false} fog={false} toneMapped={false} />
        </sprite>
        <sprite position={cam.pos.clone().addScaledVector(polar, D_SPR)} scale={[0.03 * D_SPR, 0.03 * D_SPR, 1]} renderOrder={-980}>
          <spriteMaterial map={brilho} color={new THREE.Color(1.6 * aMarca, 1.6 * aMarca, 1.7 * aMarca)} transparent blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} fog={false} toneMapped={false} />
        </sprite>
      </>}
      <primitive object={luzDir} />
      <primitive object={luzDir.target} />
      <primitive object={hemi} />
    </>
  );
};
