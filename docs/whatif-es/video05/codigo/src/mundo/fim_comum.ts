// Fim (345-522 do original): constantes, conversoes de tela e linha do tempo compartilhadas pelos modulos fim_*.
// Tudo pendurado num "plano do ceu" a DIST metros da camera, preso ao quadro com relCam (camera fixa olhando o ceu).
// Unidades de tela: x em [-ASP, ASP] (esquerda -> direita), y em [-1, 1] (baixo -> cima); 1 unidade = meia altura da tela.
import * as THREE from 'three';
import {poseCamera, relCam} from '../roteiro';
import {rnd, smooth} from './comum';

export const TREF = 400;                         // pose de referencia (camera parada de 328,8 a 489,5 e de 493 a 505,4)
export const DIST = 1e5;
export const TANH = Math.tan((27.5 * Math.PI) / 180);
export const U = DIST * TANH;                    // metros por unidade de tela no plano do ceu
export const ASP = 16 / 9;
// fracao de tela (0..1, y medido de cima, como nos quadros do original) -> unidades de tela
export const tela = (fx: number, fy: number): [number, number] => [(fx - 0.5) * 2 * ASP, (0.5 - fy) * 2];
export const larg = (f: number) => f * 2 * ASP;  // fracao da largura -> unidades
export const quadro = (t: number) => ({pos: relCam(t, 0, 0, 0), quat: poseCamera(t).quat.clone()});

// interpolacao por chaves [t, v] (suave entre chaves); log=true interpola o logaritmo (crescimento exponencial)
export const chaves = (K: [number, number][], t: number, log = false) => {
  if (t <= K[0][0]) return K[0][1];
  if (t >= K[K.length - 1][0]) return K[K.length - 1][1];
  let i = 0;
  while (t > K[i + 1][0]) i++;
  const [a, va] = K[i], [b, vb] = K[i + 1];
  const u = smooth(a, b, t);
  return log ? Math.exp(Math.log(va) + (Math.log(vb) - Math.log(va)) * u) : va + (vb - va) * u;
};

// ---------- buraco negro ----------
// S = diametro da sombra em fracao da largura da tela (lido dos quadros do original)
const S_K: [number, number][] = [[410.5, 0.007], [417.5, 0.011], [423, 0.026], [426, 0.04], [429, 0.058], [433, 0.098], [435.5, 0.13],
  [438, 0.14], [442, 0.148], [450, 0.155], [480, 0.155], [485, 0.13], [490, 0.098], [495, 0.055], [500, 0.034], [504, 0.018], [505.45, 0.008]];
const X_K: [number, number][] = [[410.5, 0.40], [418, 0.41], [423, 0.42], [433, 0.455], [438, 0.45], [442, 0.43], [448, 0.40], [468, 0.40], [480, 0.44], [490, 0.47], [505.5, 0.48]];
const Y_K: [number, number][] = [[410.5, 0.47], [423, 0.47], [433, 0.5], [505.5, 0.5]];
export const BC = 2.598;   // raio critico (sombra) em raios de Schwarzschild
export const HX = 14, HY = 9;  // meia largura/altura do quad do buraco negro em rs
export type EstadoBN = {vis: boolean; x: number; y: number; S: number; disco: number; aro: THREE.Color; aroI: number; halo: THREE.Color; haloI: number; grao: number};
const OURO = new THREE.Color(1.0, 0.78, 0.42), VIOLETA = new THREE.Color(0.52, 0.32, 1.0), AZULB = new THREE.Color(0.78, 0.88, 1.0);
export const estadoBN = (t: number): EstadoBN => {
  const vis = t >= 410.3 && t < 505.5;
  const [x, y] = tela(chaves(X_K, t), chaves(Y_K, t));
  const S = chaves(S_K, t, true);
  // disco: acende pequeno, maximo 434-436, apaga em 440-441,6
  const disco = smooth(410.3, 411.5, t) * (0.75 + 0.25 * smooth(414, 424, t) + 0.35 * smooth(431, 434, t) * (1 - smooth(436, 439, t))) * (1 - smooth(440, 441.6, t));
  const viol = smooth(440.6, 442, t), hawk = smooth(480, 505.3, t);
  const aro = OURO.clone().lerp(VIOLETA, viol).lerp(AZULB, Math.pow(hawk, 0.8));
  const aroI = (1 - viol) * 1.6 * Math.min(1, disco + 0.2) + viol * (1.3 + 9 * Math.pow(hawk, 1.6));
  const halo = OURO.clone().lerp(VIOLETA, viol).lerp(AZULB, hawk);
  const haloI = viol * (0.22 + 1.6 * Math.pow(hawk, 1.8));
  return {vis, x, y, S, disco, aro, aroI, halo, haloI, grao: disco};
};

// ---------- flash da colisao ----------
export const COLISAO = tela(0.60, 0.37);
export const flashColisao = (t: number) => (t < 401.68 ? 0 : t < 401.75 ? smooth(401.68, 401.75, t) : Math.exp(-(t - 401.75) / 1.5));

// ---------- sol morto ----------
export const SOL_C = tela(0.565, 0.47);
export const SOL_R = larg(0.031);

// ---------- flashes de evaporacao (buracos negros pequenos) ----------
export const EVAPORA = [462.9, 464.4, 465.6, 471.4, 473.0, 474.4, 475.0, 476.0, 476.5, 477.5, 480.5, 486.0, 488.5, 493.5, 495.0, 496.5, 498.5, 499.5, 503.0, 504.0];

// ---------- sprites de brilho (pontos que se movem: ana vermelha, par em orbita, colisao, riscos, evaporacao) ----------
export type Brilho = {x: number; y: number; sx: number; sy: number; rot: number; cor: [number, number, number]; forma: number};
export const brilhos = (t: number): Brilho[] => {
  const L: Brilho[] = [];
  const pt = (x: number, y: number, s: number, c: [number, number, number], I: number) => {
    if (I > 0.003) L.push({x, y, sx: s, sy: s, rot: 0, cor: [c[0] * I, c[1] * I, c[2] * I], forma: 0});
  };
  // ana vermelha (367-384,4), fixa no centro-direita; apaga em 384,3-384,5
  if (t >= 366.5 && t < 384.6) {
    const [x, y] = tela(0.60, 0.38);
    const I = 2.6 * smooth(366.8, 368, t) * (1 - smooth(384.28, 384.48, t)) * (1 + 0.07 * Math.sin(t * 2.3) + 0.04 * Math.sin(t * 7.1)) * (1 + 0.6 * smooth(383.6, 384.25, t));
    pt(x, y, 0.075, [1.0, 0.26, 0.08], I);
  }
  // dois pontos laranja orbitam e se aproximam (396,5-401,7)
  if (t >= 396.3 && t < 401.76) {
    const [cx, cy] = COLISAO;
    const tau = Math.max(401.72 - t, 0.0005);
    const d = larg(0.024) * Math.pow(tau / 5.22, 0.25);
    const ph = 7.5 * Math.pow(tau, 0.625) + 0.4;
    const I = 1.5 * smooth(396.4, 397.3, t) * (1 + 1.6 * smooth(400.3, 401.7, t));
    for (const s of [1, -1]) pt(cx + s * 0.5 * d * Math.cos(ph), cy + s * 0.5 * d * Math.sin(ph) * 0.55, 0.05, [1.0, 0.52, 0.2], I);
  }
  // colisao: nucleo branco-azulado (o halo grande fica no ceu)
  if (t >= 401.68 && t < 409) {
    const e = flashColisao(t);
    const [cx, cy] = COLISAO;
    pt(cx, cy, 0.14, [0.86, 0.93, 1.0], 30 * e);
    pt(cx, cy, 0.5, [0.7, 0.82, 1.0], 2.2 * e);
    pt(cx, cy, 0.22, [0.55, 0.65, 1.0], 0.5 * Math.exp(-(t - 401.75) / 2.6) * (1 - smooth(406, 407.5, t)));
  }
  // riscos laranja: estrelas ejetadas (410-418, 1-2 por segundo) e duas que caem no buraco negro (419-424)
  for (let k = 0; k < 15; k++) {
    const caem = k >= 13;
    const t0 = caem ? (k === 13 ? 419.3 : 422.2) : 409.9 + k * 0.6 + 0.25 * rnd(k * 3.1);
    const dur = caem ? 1.3 : 0.55 + 0.4 * rnd(k * 5.7);
    if (t < t0 || t > t0 + dur) continue;
    const u = (t - t0) / dur;
    let x0: number, y0: number, a: number, v: number;
    if (caem) {
      const bn = estadoBN(t0 + dur);
      x0 = bn.x - (k === 13 ? 0.8 : 0.65); y0 = bn.y + 0.12 * (k === 13 ? 1 : -0.6);
      a = Math.atan2(bn.y - y0, bn.x + 0.04 - x0); v = Math.hypot(bn.x - x0, bn.y - y0) / dur;
    } else {
      [x0, y0] = tela(0.12 + 0.8 * rnd(k * 7.3), 0.08 + 0.7 * rnd(k * 9.1));
      a = (rnd(k * 2.9) < 0.75 ? -1 : 1) * (0.35 + 0.6 * rnd(k * 4.3)) + (rnd(k * 6.1) < 0.5 ? 0 : Math.PI);
      v = 1.6 + 1.6 * rnd(k * 8.7);
    }
    const len = caem ? 0.16 : 0.12 + 0.2 * rnd(k * 1.7);
    const dt = t - t0;
    const x = x0 + Math.cos(a) * v * dt, y = y0 + Math.sin(a) * v * dt;
    const I = 3.2 * Math.sin(Math.PI * Math.min(1, u * 1.15)) * (caem ? (1 - u * 0.5) : 1);
    if (I > 0.003) L.push({x: x - Math.cos(a) * len * 0.6, y: y - Math.sin(a) * len * 0.6, sx: len, sy: 0.016, rot: a, cor: [1.0 * I, 0.48 * I, 0.17 * I], forma: 1});
  }
  // brilho do sol morto (some junto com os graos)
  if (t >= 446.2 && t < 461.6) {
    const I = 0.5 * smooth(446.3, 447.0, t) * (1 - smooth(452.5, 460.5, t));
    pt(SOL_C[0], SOL_C[1], SOL_R * 3.2, [1.0, 0.55, 0.25], I);
  }
  // flashes de buracos negros pequenos evaporando
  const bn = estadoBN(t);
  EVAPORA.forEach((tf, i) => {
    const d = t - tf;
    if (d < -0.06 || d > 1.3) return;
    let [x, y] = tela(0.1 + 0.8 * rnd(i * 7 + 1), 0.1 + 0.72 * rnd(i * 7 + 2));
    const dx = x - bn.x, dy = y - bn.y, dd = Math.hypot(dx, dy), minD = larg(bn.S) * 0.9 + 0.12;
    if (dd < minD) { x = bn.x + (dx / (dd || 1)) * minD; y = bn.y + (dy / (dd || 1)) * minD; }
    const I = (d < 0.05 ? smooth(-0.06, 0.05, d) : Math.exp(-(d - 0.05) / 0.3)) * (5 + 4 * rnd(i * 7 + 3));
    pt(x, y, 0.07, [0.88, 0.93, 1.0], I);
    pt(x, y, 0.3, [0.6, 0.7, 1.0], I * 0.08);
  });
  // o buraco negro, ja minusculo, vira um ponto que arde (500-505,5)
  if (bn.vis && t > 488) {
    const I = 0.25 * smooth(488, 500, t) + 4.5 * Math.pow(smooth(499, 505.4, t), 2);
    pt(bn.x, bn.y, larg(bn.S) * 1.6 + 0.06, [0.85, 0.92, 1.0], I);
  }
  return L;
};
