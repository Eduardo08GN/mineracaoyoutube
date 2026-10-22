// A Terra vista do espaco (capitulos 6, 10 e 13; tempos do ORIGINAL). Dono: agente Globo.
// - Relevo NOAA ETOPO 2022 (topo + batimetria, km, meia precisao) no shader do planeta. O NIVEL DO MAR vem de fisica.ts:
//   lvl(lat, t) = nivelMar(t, lat) = A(t) * P2(sen lat), com A(t) = nivelMar(t, 90). O mar foge do equador (cinturao de terra
//   nova) e invade as latitudes altas (Canada, Europa, Siberia afundam sob os mares polares).
// - Cada ponto sabe QUANDO mudou de estado (tabela A -> t): o leito recem-exposto passa por lamina rasa (turquesa) -> lama
//   molhada -> leito seco bege/sal, com ~16 s de atraso para escoar/secar; a terra inundada passa por agua barrenta -> azul.
// - Rotacao pela fisica: angulo = 2*pi * D * integral(voltasPorDia), D = dias terrestres por segundo de video (fixo em cada
//   capitulo). O Sol gira no referencial inercial pela volta anual (por isso, com rotacao zero, o terminador ainda anda devagar).
// - Dias/noites de meses (cap. 10 e 13): o lado da tarde vira deserto claro, o lado noturno congela (neve e mar congelado),
//   e a faixa logo depois do amanhecer ainda tem geada.
// - Atmosfera: espalhamento simples Rayleigh + Mie (marcha de 16 passos na casca, Chapman analitico para o Sol); estrelas.
// Tudo funcao de t (sem useFrame, sem Math.random).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useLoader, useThree} from '@react-three/fiber';
import {useTexture} from '@react-three/drei';
import {staticFile} from 'remotion';
import {Perfil} from '../look/Look';
import {nivelMar, voltasPorDia} from '../fisica';
import {rnd, smooth} from './comum';

export const perfilGlobo = (_t: number): Perfil => ({bloom: 0.32, limiar: 0.92, vinheta: 0.38, saturacao: 0.0, contraste: 0.08});

// ---------------- fisica derivada (tabelas preparadas uma vez) ----------------
const DT = 0.05, TMAX = 412;
const NA = 1024;
const tab = (() => {
  const n = Math.round(TMAX / DT) + 1;
  const cum = new Float64Array(n), A = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i * DT;
    A[i] = nivelMar(t, 90) / 1000;                                    // km (P2 = 1 no polo)
    if (i > 0) cum[i] = cum[i - 1] + 0.5 * (voltasPorDia(t - DT) + voltasPorDia(t)) * DT;
  }
  let amax = 0;
  for (let i = 0; i < n; i++) amax = Math.max(amax, A[i]);
  // primeiro instante em que A(t) >= a (a em fracoes de amax)
  const tOf = new Float32Array(NA);
  let j = 0;
  for (let k = 0; k < NA; k++) {
    const a = (k / (NA - 1)) * amax;
    while (j < n && A[j] < a) j++;
    tOf[k] = j < n ? j * DT : 1e4;
  }
  return {cum, A, amax: Math.max(amax, 1e-6), tOf};
})();
const interp = (arr: Float64Array, t: number) => {
  const x = Math.min(Math.max(t / DT, 0), arr.length - 1.001), i = Math.floor(x), u = x - i;
  return arr[i] + (arr[i + 1] - arr[i]) * u;
};
const nivelA = (t: number) => nivelMar(t, 90) / 1000;
const voltasAte = (t: number) => interp(tab.cum, t);

// ---------------- capitulos ----------------
type CfgCap = {tRef: number; D: number; lon0: number; latCam: number; alfa: number; solY: number; d0: number; d1: number; dur: number; kl: (t: number) => number; nuv: number};
const R2D = Math.PI / 180;
const CAP6: CfgCap = {tRef: 103.9, D: 0.0217, lon0: -62, latCam: 14, alfa: 70, solY: 0.2, d0: 4.45, d1: 4.33, dur: 29, kl: () => 0, nuv: 0.0011};
const CAP10: CfgCap = {tRef: 217.9, D: 0.06, lon0: 80, latCam: 17, alfa: 70, solY: 0.24, d0: 4.42, d1: 4.3, dur: 27, kl: (t) => 0.5 + 0.5 * smooth(217.9, 242, t), nuv: 0.0007};
const CAP13: CfgCap = {tRef: 300.9, D: 0.31, lon0: -55, latCam: 9, alfa: 68, solY: 0.12, d0: 4.45, d1: 4.36, dur: 29, kl: () => 1, nuv: 0.0007};
const cfgDe = (t: number) => (t < 180 ? CAP6 : t < 280 ? CAP10 : CAP13);

// estado do globo no instante t: guinada do planeta, direcao do Sol (inercial), camera
export const estadoGlobo = (t: number) => {
  const c = cfgDe(t);
  const giro = 2 * Math.PI * c.D * (voltasAte(t) - voltasAte(c.tRef));          // rotacao sideral acumulada (rad)
  const guinada = -Math.PI / 2 - c.lon0 * R2D + giro;                          // lon0 de frente para a camera em tRef
  const orbita = 2 * Math.PI * (c.D / 365.25) * (t - c.tRef);                   // o Sol anda para leste no referencial inercial
  const a = c.alfa * R2D + orbita;
  const sol = new THREE.Vector3(Math.sin(a), c.solY, Math.cos(a)).normalize();
  const u = Math.min(1, Math.max(0, (t - c.tRef) / c.dur));
  const dist = c.d0 + (c.d1 - c.d0) * (u * u * (3 - 2 * u));
  const lc = c.latCam * R2D;
  const cam = new THREE.Vector3(0, Math.sin(lc), Math.cos(lc)).multiplyScalar(dist);
  return {guinada, sol, cam, kl: c.kl(t), nuvOff: -c.nuv * (t - c.tRef), A: nivelA(t)};
};

// ---------------- GLSL ----------------
const ATMOS = `
const float RP = 1.0;
const float HR = 0.0016;
const float HM = 0.00028;
const float RA = 1.022;
const vec3 BR = vec3(36.9, 86.0, 210.9);
const float BM = 105.0;
// Chapman (Schuler 2012): coluna de densidade de um ponto a altura h (em alturas de escala) ate o infinito, X = R/H
float chH(float X, float h, float c) {
  float s = sqrt(X + h);
  if (c >= 0.0) return s / (s * c + 1.0) * exp(-h);
  float x0 = sqrt(max(1.0 - c * c, 0.0)) * (X + h);
  float c0 = sqrt(x0);
  return 2.0 * c0 * exp(min(X - x0, 60.0)) - s / (1.0 - s * c) * exp(-h);
}
vec2 coluna(float alt, float mu) { return vec2(HR * chH(RP / HR, alt / HR, mu), HM * chH(RP / HM, alt / HM, mu)); }
vec3 extinc(vec2 od) { return exp(-(BR * od.x + BM * 1.1 * od.y)); }
`;

const NOISE = `
float hs(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// ruido de gradiente (sem a grade quadriculada do ruido de valor) com dominio girado a cada oitava
float gn(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float ra = hs(i) * 6.2831853, rb = hs(i + vec2(1.0, 0.0)) * 6.2831853, rc = hs(i + vec2(0.0, 1.0)) * 6.2831853, rd = hs(i + vec2(1.0, 1.0)) * 6.2831853;
  float a = dot(vec2(cos(ra), sin(ra)), f), b = dot(vec2(cos(rb), sin(rb)), f - vec2(1.0, 0.0));
  float c = dot(vec2(cos(rc), sin(rc)), f - vec2(0.0, 1.0)), d = dot(vec2(cos(rd), sin(rd)), f - vec2(1.0, 1.0));
  return 0.5 + 0.75 * mix(mix(a, b, u.x), mix(c, d, u.x), u.y); }
float fbm(vec2 p) { float a = 0.5, s = 0.0; mat2 R = mat2(0.8, -0.6, 0.6, 0.8);
  for (int k = 0; k < 4; k++) { s += a * gn(p); p = R * p * 2.03 + 17.1; a *= 0.5; } return s / 0.9375; }
`;

const PLANETA_VS = `
varying vec2 vUv; varying vec3 vN; varying vec3 vP; varying vec3 vE;
void main() {
  vUv = uv;
  vec3 n = normalize(position);
  vec3 e = normalize(vec3(n.z, 0.0, -n.x) + vec3(1e-6, 0.0, 0.0));
  vN = normalize(mat3(modelMatrix) * n);
  vE = normalize(mat3(modelMatrix) * e);
  vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const PLANETA_FS = `
uniform sampler2D uDia; uniform sampler2D uLuz; uniform sampler2D uNuv; uniform sampler2D uAlt; uniform sampler2D uTOf;
uniform vec3 uSol; uniform float uE; uniform float uA; uniform float uAmax; uniform float uT; uniform float uKL; uniform float uSent; uniform float uNuvOff;
varying vec2 vUv; varying vec3 vN; varying vec3 vP; varying vec3 vE;
${ATMOS}
${NOISE}
vec3 lin(vec3 c) { return pow(c, vec3(2.2)); }
const float PI = 3.14159265;
void main() {
  vec3 N = normalize(vN), E = normalize(vE), NN = normalize(cross(N, E));
  vec3 L = normalize(uSol), V = normalize(cameraPosition - vP);
  float lat = (vUv.y - 0.5) * PI, cl = max(cos(lat), 0.05), s = sin(lat);
  float P2 = 1.5 * s * s - 0.5;
  float lvl = uA * P2;                                   // nivel do mar local (km), igual a fisica.nivelMar
  // relevo (km) + detalhe fractal fino para a costa nova nao ficar borrada
  vec2 tx = vec2(1.0 / 2048.0, 1.0 / 1024.0);
  float h = texture2D(uAlt, vUv).r;
  float hE = texture2D(uAlt, vUv + vec2(tx.x, 0.0)).r - texture2D(uAlt, vUv - vec2(tx.x, 0.0)).r;
  float hN = texture2D(uAlt, vUv + vec2(0.0, tx.y)).r - texture2D(uAlt, vUv - vec2(0.0, tx.y)).r;
  float sE = hE / (2.0 * 2.0 * PI * 6371.0 * cl / 2048.0), sN = hN / (2.0 * PI * 6371.0 / 1024.0);
  float n1 = fbm(vUv * vec2(260.0, 130.0)), n2 = fbm(vUv * vec2(1500.0, 750.0));
  float hd = h + (n2 - 0.5) * 0.05 + (n1 - 0.5) * 0.1;
  // mapa NASA (oceano azul-marinho escuro): costa nitida de hoje
  vec3 bm = texture2D(uDia, vUv).rgb;
  float marHoje = 1.0 - smoothstep(0.055, 0.1, max(bm.r, bm.g));
  float hEf = mix(max(hd, 0.003), min(hd, -0.003), marHoje);
  float molh = lvl - hEf;                                // > 0: debaixo d'agua
  float aa = max(fwidth(molh) * 0.75, 1e-4);
  float agua = smoothstep(-aa, aa, molh);
  // quando este ponto mudou de estado (A(t) passou de hEf / P2)
  float aNec = hEf / (abs(P2) < 1e-3 ? 1e-3 : P2);
  float tMud = aNec > 0.0 ? texture2D(uTOf, vec2(clamp(aNec / uAmax, 0.0, 1.0) * (1023.0 / 1024.0) + 0.5 / 1024.0, 0.5)).r : 1e4;
  float idade = uT - tMud;
  float leito = (1.0 - agua) * marHoje;                  // fundo do mar exposto
  float inund = agua * (1.0 - marHoje);                  // terra inundada pelos mares polares
  // ---- cor da superficie ----
  vec3 terra = pow(bm, vec3(1.65)) * 1.45;
  float prof = max(molh, 0.0);
  vec3 FUNDO = vec3(0.0035, 0.014, 0.042), RASO = vec3(0.012, 0.075, 0.105), LAGOA = vec3(0.03, 0.2, 0.21), BARRO = vec3(0.085, 0.07, 0.045);
  vec3 cAgua = mix(FUNDO, RASO, exp(-prof * 2.2));
  cAgua = mix(cAgua, BARRO, inund * (1.0 - smoothstep(2.0, 9.0, idade)) * exp(-prof * 0.6));
  // leito: bege/sal nas planicies, rocha nas encostas das dorsais, crosta de sal nas bacias mais fundas
  float decl = length(vec2(sE, sN));
  vec3 SAL = lin(vec3(0.92, 0.91, 0.87)), SED = lin(vec3(0.80, 0.77, 0.70)), ROCHA = lin(vec3(0.45, 0.40, 0.34)), LAMA = lin(vec3(0.42, 0.40, 0.34));
  vec3 cLeito = mix(SED, SAL, smoothstep(0.42, 0.72, n1 + (-h - 4.2) * 0.12));
  cLeito = mix(cLeito, ROCHA, smoothstep(0.012, 0.05, decl) * 0.8);
  cLeito *= 0.82 + 0.32 * n2;
  // escoamento: o leito recem-exposto fica sob uma lamina d'agua que vai secando em manchas (~12 s), depois lama (~8 s)
  float idN = idade + (n1 - 0.5) * 9.0 + (n2 - 0.5) * 3.0;
  float lagoa = 1.0 - smoothstep(7.0, 13.0, idN), lama = 1.0 - smoothstep(13.0, 21.0, idN);
  cLeito = mix(cLeito, LAMA, lama * 0.85);
  cLeito = mix(cLeito, mix(LAGOA, RASO, smoothstep(-2.0, 4.0, -idN + 4.0)), lagoa);
  vec3 alb = mix(terra, cLeito, marHoje);
  // ---- dias e noites de meses: deserto no lado da tarde, gelo no lado da noite, geada logo depois do amanhecer ----
  vec2 pq = normalize(N.xz + 1e-5), sq = normalize(L.xz + 1e-5);
  float ang = atan(pq.y * sq.x - pq.x * sq.y, dot(pq, sq));           // quanto o Sol esta a leste do ponto
  float tau = mod(PI * 0.5 - uSent * ang, 2.0 * PI);                   // 0 = amanhecer, PI/2 = meio-dia, PI = anoitecer
  float geada = tau > PI ? smoothstep(PI + 0.05, PI + 0.55 - 0.25 * uKL, tau) : 1.0 - smoothstep(0.04, 0.16 + 0.38 * uKL, tau);
  geada *= smoothstep(0.0, 0.5, uKL) * (0.8 + 0.2 * smoothstep(0.3, 0.7, n1));
  float assa = smoothstep(0.35, 1.7, tau) * (1.0 - smoothstep(PI + 0.1, PI + 0.9, tau)) * uKL;
  float terraFirme = (1.0 - agua);
  // deserto claro: a vegetacao seca mas o desenho dos continentes continua legivel; o leito embranquece (sal)
  float lumT = dot(terra, vec3(0.3, 0.5, 0.2));
  vec3 DESERTO = clamp(vec3(lumT) * vec3(1.45, 1.1, 0.68) * 1.7 + lin(vec3(0.45, 0.33, 0.18)) * 0.25, 0.0, 1.0);
  alb = mix(alb, DESERTO, assa * terraFirme * (1.0 - marHoje) * 0.6);
  alb = mix(alb, SAL * 1.04, assa * terraFirme * marHoje * 0.35);
  vec3 NEVE = vec3(0.80, 0.86, 0.95);
  // ---- iluminacao ----
  float ex = mix(10.0, 18.0, marHoje);
  vec3 Np = normalize(N - ex * (sE * E + sN * NN));
  float muS = dot(N, L);
  vec3 Ts = extinc(coluna(0.0, muS));
  float porta = smoothstep(-0.02, 0.08, muS);
  // sombra das nuvens (amostra deslocada na direcao do Sol)
  vec2 dsol = vec2(dot(L, E) / (2.0 * PI * cl), dot(L, NN) / PI) * (0.006 / max(muS, 0.2));
  float nuvS = texture2D(uNuv, vUv + vec2(uNuvOff, 0.0) + dsol).r;
  float sombra = 1.0 - 0.5 * smoothstep(0.15, 0.8, nuvS);
  vec3 cor;
  // gelo: neve na terra, mar congelado com fissuras
  float fiss = smoothstep(0.08, 0.0, abs(fbm(vUv * vec2(900.0, 450.0)) - 0.5));
  vec3 GELO = mix(vec3(0.55, 0.64, 0.72), vec3(0.32, 0.4, 0.48), fiss);
  vec3 albF = mix(alb, NEVE, geada * terraFirme);
  vec3 cAguaF = mix(cAgua, GELO, geada * 0.9 * agua);
  float gelado = geada * agua * 0.9;
  vec3 dif = mix(albF, cAguaF, agua) * uE * max(dot(Np, L), 0.0) * porta * Ts * sombra;
  // brilho do Sol na agua (aberta) + reflexo do ceu na borda
  vec3 H = normalize(L + V);
  float ndh = max(dot(N, H), 0.0), ndv = max(dot(N, V), 0.0);
  float fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
  float brilho = pow(ndh, 1400.0) * 5.0 + pow(ndh, 90.0) * 0.12;
  vec3 esp = agua * (1.0 - gelado) * uE * Ts * porta * sombra * (brilho * (0.3 + fres) * vec3(1.0, 0.95, 0.85) + fres * vec3(0.05, 0.1, 0.2) * smoothstep(-0.1, 0.3, muS));
  cor = dif + esp;
  // luar fraco: deixa ver o gelo no lado escuro
  float noite = 1.0 - smoothstep(-0.14, 0.03, muS);
  cor += mix(albF, cAguaF, agua) * vec3(0.022, 0.03, 0.06) * noite * (0.4 + 1.8 * geada);
  cor += vec3(0.0025, 0.005, 0.012) * noite * agua;
  // luzes das cidades (somem sob a agua nova; nao existem no leito novo)
  float luz = texture2D(uLuz, vUv).r;
  luz = luz * luz * 1.3 + luz * 0.25;
  float apaga = (1.0 - agua) * (1.0 - marHoje);
  cor += vec3(1.0, 0.68, 0.36) * luz * 4.5 * noite * apaga * (1.0 - 0.35 * geada);
  // atmosfera entre a superficie e a camera (a luz espalhada vem da casca)
  cor *= extinc(coluna(0.0, max(dot(N, V), 0.02)));
  gl_FragColor = vec4(cor, 1.0);
}`;

const NUVEM_FS = `
uniform sampler2D uNuv; uniform vec3 uSol; uniform float uE; uniform float uNuvOff; uniform float uKL; uniform float uSent;
varying vec2 vUv; varying vec3 vN; varying vec3 vP; varying vec3 vE;
${ATMOS}
const float PI = 3.14159265;
void main() {
  vec3 N = normalize(vN), E = normalize(vE), NN = normalize(cross(N, E)), L = normalize(uSol), V = normalize(cameraPosition - vP);
  vec2 uv = vUv + vec2(uNuvOff, 0.0);
  float c = texture2D(uNuv, uv).r;
  float lat = (vUv.y - 0.5) * PI, cl = max(cos(lat), 0.05);
  float cE = texture2D(uNuv, uv + vec2(1.0 / 4096.0, 0.0)).r - texture2D(uNuv, uv - vec2(1.0 / 4096.0, 0.0)).r;
  float cN = texture2D(uNuv, uv + vec2(0.0, 1.0 / 2048.0)).r - texture2D(uNuv, uv - vec2(0.0, 1.0 / 2048.0)).r;
  vec3 Nc = normalize(N - 1.2 * (cE / cl * E + cN * NN));
  // no lado que assa ha meses as nuvens se dissipam
  vec2 pq = normalize(N.xz + 1e-5), sq = normalize(L.xz + 1e-5);
  float ang = atan(pq.y * sq.x - pq.x * sq.y, dot(pq, sq));
  float tau = mod(PI * 0.5 - uSent * ang, 2.0 * PI);
  float assa = smoothstep(0.35, 1.7, tau) * (1.0 - smoothstep(PI + 0.1, PI + 0.9, tau)) * uKL;
  float a = smoothstep(0.28, 0.92, c) * 0.9 * (1.0 - 0.8 * assa);
  float muS = dot(N, L);
  vec3 Ts = extinc(coluna(0.006, muS));
  float lam = max(dot(Nc, L) * 0.75 + 0.25, 0.0) * smoothstep(-0.06, 0.1, muS);
  vec3 cor = vec3(0.92, 0.94, 0.97) * uE * lam * Ts + vec3(0.01, 0.013, 0.022) * (1.0 - smoothstep(-0.1, 0.05, muS));
  cor *= extinc(coluna(0.006, max(dot(N, V), 0.02)));
  gl_FragColor = vec4(cor * a, a);
}`;

const CASCA_VS = `varying vec3 vP; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const CASCA_FS = `
uniform vec3 uSol; uniform float uE;
varying vec3 vP;
${ATMOS}
vec2 esfera(vec3 ro, vec3 rd, float r) { float b = dot(ro, rd), c = dot(ro, ro) - r * r, d = b * b - c; if (d < 0.0) return vec2(1e9, -1e9); d = sqrt(d); return vec2(-b - d, -b + d); }
void main() {
  vec3 ro = cameraPosition, rd = normalize(vP - cameraPosition), L = normalize(uSol);
  vec2 ta = esfera(ro, rd, RA);
  if (ta.y < 0.0) discard;
  float t0 = max(ta.x, 0.0), t1 = ta.y;
  vec2 tp = esfera(ro, rd, RP);
  if (tp.x < tp.y && tp.x > 0.0) t1 = tp.x;
  const int NS = 16;
  float ds = (t1 - t0) / float(NS);
  vec2 odV = vec2(0.0);
  vec3 sR = vec3(0.0), sM = vec3(0.0);
  for (int i = 0; i < NS; i++) {
    vec3 p = ro + rd * (t0 + (float(i) + 0.5) * ds);
    float r = length(p), alt = max(r - RP, 0.0);
    float dR = exp(-alt / HR), dM = exp(-alt / HM);
    vec2 d = vec2(dR, dM) * ds;
    odV += d * 0.5;
    vec3 T = extinc(odV + coluna(alt, dot(p / r, L)));
    odV += d * 0.5;
    sR += T * d.x; sM += T * d.y;
  }
  float mu = dot(rd, L), g = 0.76;
  float fR = 3.0 / (16.0 * 3.14159265) * (1.0 + mu * mu);
  float fM = 3.0 / (8.0 * 3.14159265) * ((1.0 - g * g) * (1.0 + mu * mu)) / ((2.0 + g * g) * pow(1.0 + g * g - 2.0 * g * mu, 1.5));
  vec3 cor = uE * (sR * BR * fR + sM * BM * fM);
  // brilho fraco do ar (airglow): o anel fino aparece tambem do lado da noite
  cor += vec3(0.25, 0.45, 0.9) * odV.x * 2.5;
  gl_FragColor = vec4(cor, 1.0);
}`;

const ESTRELA_VS = `
attribute float aMag; attribute vec3 aCor; uniform float uPx; varying float vMag; varying vec3 vCor;
void main() { vMag = aMag; vCor = aCor; gl_PointSize = (1.2 + 2.8 * aMag) * uPx; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const ESTRELA_FS = `
varying float vMag; varying vec3 vCor;
void main() { vec2 q = gl_PointCoord - 0.5; float r = length(q) * 2.0; float a = exp(-r * r * 4.0) * (0.12 + 0.9 * vMag * vMag);
  gl_FragColor = vec4(vCor * a * 1.4, 1.0); }`;

// ---------------- recursos ----------------
const useRecursos = () => {
  const [dia, luz, nuv] = useTexture([staticFile('globo/terra_dia_4k.jpg'), staticFile('globo/luzes_4k.jpg'), staticFile('globo/nuvens_4k.jpg')]);
  const bin = useLoader(THREE.FileLoader, staticFile('globo/altura_2048x1024_km_f16.bin'), (l) => { (l as THREE.FileLoader).setResponseType('arraybuffer'); }) as unknown as ArrayBuffer;
  return useMemo(() => {
    for (const x of [dia, luz, nuv]) { x.colorSpace = THREE.NoColorSpace; x.anisotropy = 8; x.wrapS = THREE.RepeatWrapping; x.wrapT = THREE.ClampToEdgeWrapping; x.needsUpdate = true; }
    const alt = new THREE.DataTexture(new Uint16Array(bin), 2048, 1024, THREE.RedFormat, THREE.HalfFloatType);
    alt.minFilter = THREE.LinearFilter; alt.magFilter = THREE.LinearFilter; alt.wrapS = THREE.RepeatWrapping; alt.wrapT = THREE.ClampToEdgeWrapping;
    alt.generateMipmaps = false; alt.needsUpdate = true;
    const tof = new THREE.DataTexture(tab.tOf, NA, 1, THREE.RedFormat, THREE.FloatType);
    tof.minFilter = tof.magFilter = THREE.NearestFilter; tof.generateMipmaps = false; tof.needsUpdate = true;
    return {dia, luz, nuv, alt, tof};
  }, [dia, luz, nuv, bin]);
};

const E_SOL = 2.1;

export const Globo: React.FC<{t: number}> = ({t}) => {
  const {camera, gl, size} = useThree();
  const R = useRecursos();
  const est = estadoGlobo(t);
  const sentido = Math.sign(voltasPorDia(t) - 1 / 365.25) || 1;

  const planeta = useMemo(() => new THREE.ShaderMaterial({vertexShader: PLANETA_VS, fragmentShader: PLANETA_FS, toneMapped: false,
    uniforms: {uDia: {value: R.dia}, uLuz: {value: R.luz}, uNuv: {value: R.nuv}, uAlt: {value: R.alt}, uTOf: {value: R.tof}, uSol: {value: new THREE.Vector3()},
      uE: {value: E_SOL}, uA: {value: 0}, uAmax: {value: tab.amax}, uT: {value: 0}, uKL: {value: 0}, uSent: {value: 1}, uNuvOff: {value: 0}}}), [R]);
  const nuvem = useMemo(() => new THREE.ShaderMaterial({vertexShader: PLANETA_VS, fragmentShader: NUVEM_FS, toneMapped: false, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: {uNuv: {value: R.nuv}, uSol: {value: new THREE.Vector3()}, uE: {value: E_SOL}, uNuvOff: {value: 0}, uKL: {value: 0}, uSent: {value: 1}}}), [R]);
  const casca = useMemo(() => new THREE.ShaderMaterial({vertexShader: CASCA_VS, fragmentShader: CASCA_FS, toneMapped: false, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, uniforms: {uSol: {value: new THREE.Vector3()}, uE: {value: E_SOL * 1.15}}}), []);
  const estrelas = useMemo(() => {
    const n = 4500, g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), m = new Float32Array(n), c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = rnd(i * 3 + 11) * 2 - 1, a = rnd(i * 3 + 12) * Math.PI * 2, s = Math.sqrt(1 - u * u);
      p.set([s * Math.cos(a) * 80, u * 80, s * Math.sin(a) * 80], i * 3);
      m[i] = Math.pow(rnd(i * 3 + 13), 6);
      const k = rnd(i * 7 + 5);
      c.set(k < 0.25 ? [1.0, 0.82, 0.62] : k < 0.6 ? [0.95, 0.95, 1.0] : [0.75, 0.84, 1.0], i * 3);
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aMag', new THREE.BufferAttribute(m, 1)); g.setAttribute('aCor', new THREE.BufferAttribute(c, 3));
    const mat = new THREE.ShaderMaterial({vertexShader: ESTRELA_VS, fragmentShader: ESTRELA_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
      uniforms: {uPx: {value: 1}}});
    return {g, mat};
  }, []);

  // uniforms do instante
  planeta.uniforms.uSol.value.copy(est.sol); planeta.uniforms.uA.value = est.A; planeta.uniforms.uT.value = t; planeta.uniforms.uKL.value = est.kl;
  planeta.uniforms.uSent.value = sentido; planeta.uniforms.uNuvOff.value = est.nuvOff;
  nuvem.uniforms.uSol.value.copy(est.sol); nuvem.uniforms.uNuvOff.value = est.nuvOff; nuvem.uniforms.uKL.value = est.kl; nuvem.uniforms.uSent.value = sentido;
  casca.uniforms.uSol.value.copy(est.sol);
  estrelas.mat.uniforms.uPx.value = gl.getPixelRatio() * (size.height / 1080) * 1.0;

  // camera (deterministica em t)
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.copy(est.cam); cam.up.set(0, 1, 0); cam.lookAt(0, 0, 0);
  if (cam.fov !== 30 || cam.near !== 0.01) { cam.fov = 30; cam.near = 0.01; cam.far = 500; cam.updateProjectionMatrix(); }

  return (
    <>
      <color attach="background" args={['#010103']} />
      <points geometry={estrelas.g} material={estrelas.mat} frustumCulled={false} renderOrder={-10} />
      <group rotation={[0, est.guinada, 0]}>
        <mesh material={planeta}><sphereGeometry args={[1, 256, 128]} /></mesh>
        <mesh material={nuvem} scale={1.006} renderOrder={1}><sphereGeometry args={[1, 192, 96]} /></mesh>
      </group>
      <mesh material={casca} scale={1.026} renderOrder={2}><sphereGeometry args={[1, 128, 64]} /></mesh>
    </>
  );
};
