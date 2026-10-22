// Praia do EQUADOR (dono: agente Praia) — Atacames, Ecuador. HUD: "EL ECUADOR". Capitulos 2, 11, 12 e 15 (tempos do ORIGINAL).
//   cap. 2  (4,1-29,9)    varanda a 18 m: calcadao com a FONTE redonda (jatos), palmeiras, banhistas em time-lapse, guarda-sois,
//                         posto de salva-vidas, rua com carros, mar com ondas e barcos; 4 ciclos dia/noite (ceu do agente Ceu).
//   cap. 11 (244,9-271,7) a mesma varanda SEM MAR (leito seco ate o horizonte, barcos encalhados), tilt forte para o ceu ate o
//                         Sol parado entrar pelo topo (257,5), tilt de volta ao horizonte.
//   cap. 12 (271,7-300,9) pan para a direita ate o Sol, que desce e se poe no LESTE com reflexo crescente no leito que umedece.
//   cap. 15 (357-390,1)   a ONDA GIGANTE volta: linha no horizonte (365,5), muralha com crista de espuma (368-381), borrifo cobre
//                         o quadro (381-383,3), 1 quadro escuro, "teto de agua" com estrias irradiando do horizonte (383,4-390,1).
// Orientacao: o mundo e montado num referencial LOCAL (mar para -z, camera na varanda em (0, 18, 0)) e girado para o mar olhar
// para NORDESTE (rumo 45). Assim o Sol (fisico, do agente Ceu, sem mexer no rumo dele) nasce a DIREITA sobre o mar no cap. 2,
// fica parado no alto a leste no cap. 11 e se poe no leste sobre o leito no cap. 12 — os mesmos lugares do quadro original.
// Agua: nivel do mar e retorno da onda tirados de fisica.ts (nivelMar). Chao: ChaoMolhado do agente Leito (praia + leito).
// Tudo e funcao de t (sem relogio, sem acumulo); aleatorio so por rnd(semente).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {useTexture} from '@react-three/drei';
import {staticFile} from 'remotion';
import {Perfil} from '../look/Look';
import {camEm, ChaveCam} from '../roteiro';
import {nivelMar} from '../fisica';
import {CeuLugar, corHorizonte, luzEm, solEm} from './ceu';
import {Palmeiras, PalmeiraItem} from './palmeiras';
import {Multidao3D, Pessoa3D} from './pessoas';
import {useChaoMolhado, AguaDistancia} from './chao_molhado';
import {useHDR} from './ambiente';
import {ATLAS} from './vfx';
import {rnd, smooth, clamp01} from './comum';

// ---------------------------------------------------------------- referencial
const RUMO_MAR = 45;                        // azimute (bussola) para onde o mar olha (local -z)
const LAT = 0.9;                            // Atacames
// direcao do mundo para um azimute A, na convencao do ceu (rumo padrao 270: -z = oeste, +x = norte, +z = leste)
const dirBussola = (A: number) => new THREE.Vector3(Math.cos((A * Math.PI) / 180), 0, Math.sin((A * Math.PI) / 180));
const G = (() => { const d = dirBussola(RUMO_MAR); return Math.atan2(-d.x, -d.z); })();   // giro em y: local (0,0,-1) -> d
const cG = Math.cos(G), sG = Math.sin(G);
const paraMundo = (x: number, y: number, z: number): [number, number, number] => [x * cG + z * sG, y, -x * sG + z * cG];
const paraLocal = (v: THREE.Vector3) => new THREE.Vector3(v.x * cG - v.z * sG, v.y, v.x * sG + v.z * cG);
const RAD = Math.PI / 180;
// direcao local por guinada (graus, + = esquerda) e inclinacao (graus, + = cima)
const dirDe = (yaw: number, pitch: number): [number, number, number] =>
  [-Math.sin(yaw * RAD) * Math.cos(pitch * RAD), Math.sin(pitch * RAD), -Math.cos(yaw * RAD) * Math.cos(pitch * RAD)];
const guinada = (d: THREE.Vector3) => Math.atan2(-d.x, -d.z) / RAD;
const inclinacao = (d: THREE.Vector3) => Math.asin(Math.max(-1, Math.min(1, d.y / (d.length() || 1)))) / RAD;

// ---------------------------------------------------------------- terreno (local): s = distancia da mureta para o mar
const Z_MURO = -62;
const sDe = (z: number) => Z_MURO - z;
const alturaPerfil = (s: number) => (s <= 0 ? 0 : s < 60 ? -0.9 - 0.03 * s : -2.7 - 0.012 * (s - 60));
const NIVEL0 = -1.75;
const sCosta = (nivel: number) => (nivel > -2.7 ? (-0.9 - nivel) / 0.03 : 60 + (-2.7 - nivel) / 0.012);
// nivel do mar no cap. 2 (fisica: a agua comeca a fugir do equador; aqui so uns palmos)
const nivelCap2 = (t: number) => NIVEL0 + Math.max(-0.3, nivelMar(t, LAT) / 4000);
// retorno da agua no cap. 15: P = 0 com a Terra parada (300 s), 1 com a rotacao de hoje (fisica.ts)
const N_MIN = nivelMar(300, LAT);
const retorno = (t: number) => clamp01(1 - nivelMar(t, LAT) / N_MIN);
// onda: distancia da frente (m, da camera para o mar) e altura em funcao de P (calibrado nos tempos do mapa de acoes)
const TAB_ONDA: [number, number, number][] = [[0.0, 7000, 8], [0.36, 4600, 22], [0.43, 2600, 70], [0.48, 1500, 110], [0.58, 1000, 125], [0.67, 700, 140],
  [0.76, 430, 165], [0.84, 220, 205], [0.9, 60, 235], [0.93, -80, 250], [1.0, -400, 250]];
const ondaEm = (P: number) => {
  let i = 0; while (i < TAB_ONDA.length - 2 && P > TAB_ONDA[i + 1][0]) i++;
  const a = TAB_ONDA[i], b = TAB_ONDA[i + 1], u = clamp01((P - a[0]) / (b[0] - a[0]));
  return {D: a[1] + (b[1] - a[1]) * u, H: a[2] + (b[2] - a[2]) * u};
};

// ---------------------------------------------------------------- capitulos deste mundo
type Fase = 'varanda' | 'solpara' | 'solvolta' | 'onda';
const faseDe = (t: number): Fase => (t < 100 ? 'varanda' : t < 271.7 ? 'solpara' : t < 330 ? 'solvolta' : 'onda');
const T_TETO = 383.3;

// ---------------------------------------------------------------- camera (chaves do mapa de acoes, em graus)
type K = [number, [number, number, number], number, number, number?];   // t, pos local, guinada, inclinacao, fov
const chaves = (ks: K[]): ChaveCam[] => ks.map(([t, p, yaw, pit, fov]) => {
  const d = dirDe(yaw, pit);
  return [t, paraMundo(p[0], p[1], p[2]), paraMundo(p[0] + d[0] * 200, p[1] + d[1] * 200, p[2] + d[2] * 200), fov ?? 50];
});
const VAR: [number, number, number] = [0, 18, 0];
const solLocal = (t: number) => paraLocal(solEm(t, 'ecuador'));
let _cam: Record<Fase, ChaveCam[]> | null = null;
const camChaves = () => {
  if (_cam) return _cam;
  // cap. 11: o Sol parado (257,5-271) — mira a guinada dele; inclinacao para ele entrar pelo topo em 257,5
  const s11 = solLocal(260), y11 = guinada(s11), e11 = inclinacao(s11);
  // fov 40 (meia abertura 20): com o Sol a ~40 graus, ele entra pelo topo justo quando o horizonte sai por baixo
  const p257 = Math.max(20, e11 - 20);
  // cap. 12: o ponto do poente (300,3) — o pan para a direita termina nele
  const s12 = solLocal(299.6), y12 = guinada(s12);
  _cam = {
    // deriva lenta: pan para a esquerda + tilt para cima (4-6 px / 2 s)
    varanda: chaves([[4.1, VAR, -3, -15, 50], [29.9, VAR, 4, -9.5, 50]]),
    solpara: chaves([[244.9, VAR, y11 + 14, -11, 50], [252, VAR, y11 + 2, p257 - 3, 42], [264, VAR, y11 - 7, p257 + 5, 40],
      [268, VAR, y11 - 8, (p257 + 5) * 0.6, 42], [271.1, VAR, y11 - 9, 2, 48], [271.7, VAR, y11 - 9, 0, 50]]),
    solvolta: chaves([[271.7, VAR, y12 + 26, -11, 50], [282, VAR, y12 + 11, 6.5, 50], [300.9, VAR, y12 - 1, 4.5, 50]]),
    onda: chaves([[357, VAR, 0, -14, 52], [364, [0, 18, -5], 0, -10.5, 47], [372, [0, 18, -5.5], 0, -9.5, 47], [383.3, [0, 18, -5.5], 0, -1, 58],
      [383.34, [0, 18, -5.5], 0, -4, 56], [390.1, [0, 18, -5.5], 0, 6, 56]]),
  };
  return _cam;
};
export const camPraia = (t: number) => camEm(camChaves()[faseDe(t)], t);

// ---------------------------------------------------------------- perfil do Look
export const perfilPraia = (t: number): Perfil => {
  const l = luzEm(t, 'ecuador'), h = corHorizonte(t, 'ecuador');
  const noite = 1 - l.dia, f = faseDe(t);
  const teto = f === 'onda' && t >= T_TETO;
  const sl = solLocal(t), baixo = sl.y > -0.02 && sl.y < 0.35 ? 1 : 0;
  return {
    bloom: 0.42 + 0.45 * noite, limiar: 0.88 - 0.2 * noite, vinheta: 0.38,
    saturacao: teto ? -0.05 : -0.04, contraste: 0.06, brilho: teto ? -0.08 : 0,
    nevoa: teto ? {cor: new THREE.Color(0.05, 0.16, 0.2), densidade: 0.0012, max: 0.85}
      : {cor: h, densidade: f === 'onda' ? 0.0003 : 0.0009, max: f === 'onda' ? 0.72 : 0.85},
    raios: teto ? 0 : 0.42 * baixo * (f === 'solvolta' || f === 'varanda' ? 1 : 0.4),
  };
};

// ================================================================ pecas
const mat4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), v4 = new THREE.Vector3(), s4 = new THREE.Vector3();
const compoe = (x: number, y: number, z: number, rx: number, ry: number, rz: number, sx: number, sy = sx, sz = sx) =>
  mat4.compose(v4.set(x, y, z), q4.setFromEuler(e4.set(rx, ry, rz)), s4.set(sx, sy, sz)).clone();
type Inst = {m: THREE.Matrix4; c?: THREE.ColorRepresentation};
const instancias = (geo: THREE.BufferGeometry, mat: THREE.Material, lista: Inst[], sombra = true) => {
  const im = new THREE.InstancedMesh(geo, mat, Math.max(1, lista.length));
  const c = new THREE.Color();
  lista.forEach((x, i) => { im.setMatrixAt(i, x.m); if (x.c !== undefined) im.setColorAt(i, c.set(x.c)); });
  im.count = lista.length; im.castShadow = sombra; im.receiveShadow = true; im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  return im;
};
const canvasTex = (w: number, h: number, desenha: (c: CanvasRenderingContext2D) => void, srgb = true) => {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; desenha(cv.getContext('2d')!);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
};

// ---------------------------------------------------------------- dados do lugar (fixos)
const PALMEIRAS: PalmeiraItem[] = (() => {
  const out: PalmeiraItem[] = [];
  let k = 0;
  const v = (i: number) => (['reta', 'reta', 'curva', 'reta', 'dupla', 'curva', 'reta', 'duplaCurva', 'reta', 'trio'] as const)[Math.floor(rnd(i) * 10)];
  // fileira de tras (lado da rua) e da frente (lado da areia) do calcadao
  for (let x = -260; x <= 260; x += 11) { if (Math.abs(x - 4) < 9) continue; out.push({x: x + (rnd(k) - 0.5) * 4, z: -33.5 + (rnd(k + 1) - 0.5) * 1.5, variante: v(k + 2), escala: 0.95 + rnd(k + 3) * 0.3}); k += 5; }
  for (let x = -255; x <= 260; x += 12.5) { out.push({x: x + (rnd(k) - 0.5) * 5, z: -58.5 + (rnd(k + 1) - 0.5) * 2, variante: v(k + 2), escala: 1.0 + rnd(k + 3) * 0.3}); k += 5; }
  // em volta da fonte
  for (const [x, z] of [[-6, -38], [14, -38], [-6, -51], [14, -50.5]]) out.push({x, z, variante: 'reta', escala: 0.9 + rnd(k++) * 0.2});
  // algumas na areia
  for (let i = 0; i < 22; i++) out.push({x: -200 + rnd(k + i * 3) * 400, z: -65 - rnd(k + i * 3 + 1) * 9, y: -1.1, variante: v(k + i * 3 + 2), escala: 0.9 + rnd(k + i * 7) * 0.35});
  return out;
})();
const FONTE: [number, number] = [4, -44];
const COR_GUARDA = ['#ff5f9e', '#e0359a', '#f4f1ea', '#ff8bb8', '#3fa7d6', '#f2c14e', '#e2457a', '#ffffff'];
const GUARDA = Array.from({length: 46}, (_, i) => ({x: -150 + rnd(i * 7 + 1) * 300, z: -66 - rnd(i * 7 + 2) * 17, c: COR_GUARDA[Math.floor(rnd(i * 7 + 3) * COR_GUARDA.length)],
  inc: (rnd(i * 7 + 4) - 0.5) * 0.3, ry: rnd(i * 7 + 5) * 6.28}));
const POSTE_XS = Array.from({length: 30}, (_, i) => -261 + i * 18);

// pessoas: calcadao (andando), areia (paradas/deitadas), agua (nadando, so cap. 2)
const PESSOAS_CAP2: Pessoa3D[] = (() => {
  const out: Pessoa3D[] = []; let i = 0;
  // gente em volta da fonte (o ponto de encontro do calcadao)
  for (let k = 0; k < 26; k++, i++) { const a = rnd(i * 3 + 1) * 6.28, r = 7.5 + rnd(i * 3 + 2) * 9; out.push({i, x: FONTE[0] + Math.cos(a) * r, z: FONTE[1] + Math.sin(a) * r * 0.55, rot: a + Math.PI, pose: rnd(i * 5) < 0.5 ? 'conversando' : 'andando', y: 0}); }
  for (let k = 0; k < 64; k++, i++) out.push({i, x: -130 + rnd(i * 3 + 1) * 260, z: -36 - rnd(i * 3 + 2) * 20, rot: 0, pose: rnd(i * 5) < 0.82 ? 'andando' : 'conversando', y: 0});
  for (let k = 0; k < 30; k++, i++) {
    const g = GUARDA[k % GUARDA.length], z = g.z + 1.5 + rnd(i) * 2;
    out.push({i, x: g.x + (rnd(i * 3 + 1) - 0.5) * 3, z, rot: rnd(i * 3 + 2) * 6.28, pose: rnd(i * 5) < 0.45 ? 'deitado' : 'conversando', y: alturaPerfil(sDe(z))});
  }
  // banhistas em pe no raso (agua pela canela/joelho)
  for (let k = 0; k < 10; k++, i++) { const z = Z_MURO - 31 - rnd(i) * 9; out.push({i, x: -60 + rnd(i * 3 + 1) * 120, z, rot: rnd(i * 3 + 2) * 6.28, pose: 'conversando', y: alturaPerfil(sDe(z)), camisa: undefined}); }
  return out;
})();
const PESSOAS_SEM_MAR: Pessoa3D[] = (() => {
  const out: Pessoa3D[] = PESSOAS_CAP2.slice(0, 120).map((p) => ({...p}));
  let i = 200;
  // curiosos parados no leito
  for (let k = 0; k < 14; k++, i++) { const z = -100 - rnd(i) * 80; out.push({i, x: -70 + rnd(i * 3 + 1) * 140, z, rot: rnd(i * 3 + 2) * 6.28, pose: 'conversando', y: alturaPerfil(sDe(z))}); }
  return out;
})();
// barcos (no mar no cap. 2; encalhados e tombados no leito nos cap. 11-15)
const BARCOS = Array.from({length: 14}, (_, i) => ({x: -500 + rnd(i * 11 + 1) * 1000, s: 140 + rnd(i * 11 + 2) * 900, ry: rnd(i * 11 + 3) * 6.28,
  c: ['#f4f1ea', '#f4f1ea', '#2f6db3', '#c0392b', '#f2c14e'][Math.floor(rnd(i * 11 + 4) * 5)], tomb: (rnd(i * 11 + 5) - 0.5) * 0.7, esc: 0.8 + rnd(i * 11 + 6) * 0.9}));
const PEDRAS = Array.from({length: 70}, (_, i) => ({x: -700 + rnd(i * 13 + 1) * 1400, s: 70 + Math.pow(rnd(i * 13 + 2), 1.5) * 1400, ry: rnd(i * 13 + 3) * 6.28,
  esc: 0.6 + rnd(i * 13 + 4) * 2.2}));

// ---------------------------------------------------------------- shaders
const NOISE = `
float pH(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float pN(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(pH(i), pH(i+vec2(1,0)), u.x), mix(pH(i+vec2(0,1)), pH(i+vec2(1,1)), u.x), u.y); }
float pF(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++){ s += a * pN(p); p = mat2(1.6,1.2,-1.2,1.6) * p + 3.7; a *= 0.5; } return s; }
vec3 pCeu(sampler2D env, vec3 d){ vec2 uv = vec2(atan(d.z, d.x) * 0.15915494 + 0.5, asin(clamp(d.y, -1.0, 1.0)) * 0.31830989 + 0.5); return texture2D(env, uv).rgb; }`;

// mar (local: a malha fica dentro do grupo girado, vL = posicao local)
const MAR_VS = `varying vec3 vW; varying vec3 vL;
void main(){ vL = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const MAR_FS = `
uniform sampler2D uN; uniform sampler2D uEnv; uniform float uT; uniform float uNivel; uniform float uCostaS; uniform float uCortaS;
uniform vec3 uSol; uniform vec3 uCorSol; uniform float uSolI; uniform vec3 uHoriz; uniform vec3 uZen; uniform float uDia; uniform float uEnvK;
varying vec3 vW; varying vec3 vL;
${NOISE}
float perfil(float s){ return s <= 0.0 ? 0.0 : (s < 60.0 ? -0.9 - 0.03 * s : -2.7 - 0.012 * (s - 60.0)); }
void main(){
  float s = ${Z_MURO.toFixed(1)} - vL.z;
  float prof = uNivel - perfil(s);
  float dCosta = s - uCostaS;                         // metros mar adentro a partir da linha d'agua
  vec2 p = vW.xz;
  vec3 n1 = texture2D(uN, p * 0.021 + vec2(uT * 0.011, uT * 0.008)).rgb * 2.0 - 1.0;
  vec3 n2 = texture2D(uN, p * 0.057 - vec2(uT * 0.017, -uT * 0.012)).rgb * 2.0 - 1.0;
  vec3 n3 = texture2D(uN, p * 0.0042 + vec2(uT * 0.004, 0.0)).rgb * 2.0 - 1.0;
  vec3 nn = n1 + n2 * 0.7 + n3 * 1.3;
  vec3 V = normalize(cameraPosition - vW);
  float dist = length(vW - cameraPosition);
  float agit = mix(0.42, 0.12, smoothstep(80.0, 1800.0, dist));   // ao longe a agua fica lisa (sem serrilhado)
  vec3 N = normalize(vec3(nn.x * agit, 1.0, nn.y * agit));
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  vec3 R = reflect(-V, N); R.y = abs(R.y);
  vec3 ceuR = mix(uHoriz, uZen, smoothstep(0.0, 0.45, R.y));
  ceuR = mix(ceuR, pCeu(uEnv, R) * uEnvK, 0.45 * uDia);
  // corpo da agua: raso turquesa -> fundo azul-petroleo, iluminado pelo ceu
  vec3 raso = vec3(0.10, 0.42, 0.40), medio = vec3(0.02, 0.20, 0.26), fundo = vec3(0.008, 0.06, 0.10);
  vec3 corpo = mix(raso, medio, smoothstep(0.0, 2.5, prof));
  corpo = mix(corpo, fundo, smoothstep(2.5, 25.0, prof));
  vec3 luz = uZen * 0.9 + uCorSol * uSolI * max(uSol.y, 0.0) * 0.35;
  vec3 col = corpo * luz;
  // causticas no raso
  float c1 = texture2D(uN, p * 0.11 + uT * 0.03).r, c2 = texture2D(uN, p * 0.085 - uT * 0.025).g;
  col += pow(clamp(1.0 - abs(c1 - c2) * 3.2, 0.0, 1.0), 7.0) * (1.0 - smoothstep(0.3, 2.0, prof)) * 0.25 * luz;
  col = mix(col, ceuR, fres);
  // brilho do Sol
  float sp = max(dot(R, normalize(uSol)), 0.0);
  col += uCorSol * uSolI * (pow(sp, 600.0) * 6.0 + pow(sp, 60.0) * 0.35) * step(-0.02, uSol.y);
  // espuma: arrebentacao (3 faixas chegando) + beira
  float br = pF(p * 0.18 + vec2(uT * 0.15, uT * 0.05));
  float f = smoothstep(2.2, 0.0, dCosta) * 0.9;
  for (int k = 0; k < 3; k++) {
    float fk = float(k), ph = fract(uT * 0.085 + fk / 3.0);
    float bd = mix(34.0, 1.0, ph);
    f += smoothstep(1.6 + ph * 2.0, 0.0, abs(dCosta - bd)) * (0.55 + 0.45 * sin(p.x * 0.05 + fk * 2.1 + vL.x * 0.031)) * (1.0 - ph * 0.5) * smoothstep(0.0, 0.25, ph);
  }
  f = clamp(f, 0.0, 1.0) * smoothstep(0.3, 0.62, br + 0.2);
  col = mix(col, vec3(0.92, 0.95, 0.96) * luz * 1.15, f);
  // corte (agua so depois de uCortaS) com espuma na borda
  float corte = smoothstep(uCortaS - 2.0, uCortaS + 6.0, s);
  col = mix(col, vec3(0.9, 0.94, 0.95) * luz, (1.0 - smoothstep(0.0, 25.0, s - uCortaS)) * step(1.0, uCortaS) * 0.8 * smoothstep(0.35, 0.6, br + 0.15));
  float a = smoothstep(-0.05, 0.5, prof) * corte;
  gl_FragColor = vec4(max(col, vec3(0.0)), a);
}`;

// onda: geometria refeita a cada quadro na CPU (perfil fechado em t); shader de agua com translucidez e espuma
const ONDA_VS = `attribute float aU; attribute float aY; varying vec3 vW; varying vec3 vNw; varying float vU; varying float vY; varying float vX;
void main(){ vU = aU; vY = aY; vX = position.x; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vNw = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w; }`;
const ONDA_FS = `
uniform sampler2D uEnv; uniform sampler2D uN; uniform float uT; uniform vec3 uSol; uniform vec3 uCorSol; uniform float uSolI; uniform vec3 uHoriz; uniform vec3 uZen;
uniform float uH; uniform float uEnvK;
varying vec3 vW; varying vec3 vNw; varying float vU; varying float vY; varying float vX;
${NOISE}
void main(){
  vec3 V = normalize(cameraPosition - vW);
  vec3 N = normalize(vNw); if (dot(N, V) < 0.0) N = -N;
  vec2 pp = vec2(vX, vY * uH);
  vec3 nm = texture2D(uN, pp * 0.012 + vec2(0.0, -uT * 0.05)).rgb * 2.0 - 1.0;
  N = normalize(N + nm * 0.18);
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  vec3 R = reflect(-V, N);
  vec3 ceuR = mix(uHoriz, uZen, smoothstep(0.0, 0.45, max(R.y, 0.0)));
  ceuR = mix(ceuR, pCeu(uEnv, vec3(R.x, abs(R.y), R.z)) * uEnvK, 0.4);
  vec3 L = normalize(uSol);
  vec3 luz = uZen * 0.85 + uCorSol * uSolI * (0.25 + 0.5 * max(dot(N, L), 0.0)) * step(-0.05, L.y);
  // corpo: azul-petroleo profundo; na crista (fina) a luz atravessa -> teal claro, mais forte em contraluz
  vec3 fundo = vec3(0.012, 0.075, 0.095), teal = vec3(0.06, 0.36, 0.38);
  float fino = smoothstep(0.45, 0.92, vY) * smoothstep(0.30, 0.55, vU);
  float contra = pow(max(dot(-V, L), 0.0), 2.0);
  vec3 col = mix(fundo, teal, 0.22 + 0.7 * fino) * luz;
  col += teal * uCorSol * uSolI * fino * (0.15 + 0.85 * contra) * 0.35;
  col = mix(col, ceuR, fres * 0.85);
  // espuma: crista, fiapos escorrendo pela face (estrias verticais), pe da onda
  float esc = pF(vec2(vX * 0.012, vY * 2.2 - uT * 0.35)) ;
  float estr = pF(vec2(vX * 0.11, vY * 0.9 + uT * 0.12));
  float crista = smoothstep(0.74, 0.95, vY) * (0.7 + 0.3 * esc);
  float face = smoothstep(0.66, 0.82, estr + 0.12 * vY) * smoothstep(0.35, 0.9, vY) * step(0.5, vU) * 0.4;
  float pe = (1.0 - smoothstep(0.0, 0.16, vY)) * smoothstep(0.75, 1.0, vU) * (0.55 + 0.45 * esc);
  float f = clamp(max(crista, max(face * esc * 1.3, pe)), 0.0, 1.0);
  vec3 espuma = vec3(0.93, 0.96, 0.97) * (uZen * 0.9 + uCorSol * uSolI * 0.55);
  col = mix(col, espuma, f);
  gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
}`;

// borrifo: particulas sem estado (fase por semente), atlas de nuvem CC0 (Unity Labs), presas a frente da onda
const BORRIFO_VS = `
attribute vec4 aS;   // fase, tamanho, posicao ao longo da frente (0..1), tipo (0 crista, 1 base)
uniform float uT; uniform float uH; uniform float uZF; uniform float uLarg; uniform float uVida; uniform float uFrames;
varying vec2 vUv; varying float vA; varying float vQ0; varying float vMix;
void main(){
  float vida = uVida * (0.7 + 0.6 * aS.y);
  float u = fract(uT / vida + aS.x);
  float xs = aS.z * 2.0 - 1.0; float x = sign(xs) * pow(abs(xs), 1.7) * uLarg * 0.5;
  vec3 c; float tam;
  if (aS.w < 0.5) { c = vec3(x, uH * (0.9 + 0.12 * aS.y) + u * uH * 0.32, uZF + uH * (0.05 + 0.28 * u)); tam = uH * (0.24 + 0.28 * aS.y) * (0.6 + 1.0 * u); }
  else { c = vec3(x, uH * (0.05 + 0.18 * u), uZF + uH * (0.32 + 0.45 * u)); tam = uH * (0.28 + 0.25 * aS.y) * (0.7 + 0.8 * u); }
  vec3 cw = (modelMatrix * vec4(c, 1.0)).xyz;
  vec3 dir = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  float ang = (fract(aS.x * 17.3) - 0.5) * 6.28 + u * (fract(aS.y * 7.1) - 0.5);
  vec2 q = vec2(position.x * cos(ang) - position.y * sin(ang), position.x * sin(ang) + position.y * cos(ang));
  vec3 p = cw + (dir * q.x + up * q.y) * tam;
  vUv = uv; float f = u * (uFrames - 1.0); vQ0 = floor(f); vMix = f - vQ0;
  vA = smoothstep(0.0, 0.15, u) * (1.0 - smoothstep(0.62, 1.0, u));
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const BORRIFO_FS = `
uniform sampler2D uAtlas; uniform float uCols; uniform float uRows; uniform vec3 uCor; uniform float uForca;
varying vec2 vUv; varying float vA; varying float vQ0; varying float vMix;
vec4 quadro(float k){ float cx = mod(k, uCols), cy = floor(k / uCols); return texture2D(uAtlas, (vec2(cx, uRows - 1.0 - cy) + vUv) / vec2(uCols, uRows)); }
void main(){
  vec4 c = mix(quadro(vQ0), quadro(min(vQ0 + 1.0, uCols * uRows - 1.0)), vMix);
  float l = dot(c.rgb, vec3(0.333));
  gl_FragColor = vec4(uCor * (0.55 + 0.75 * l), c.a * vA * uForca);
}`;

// teto de agua: plano acima da camera, estrias ao longo de -z (convergem para o ponto de fuga no horizonte), correndo para a terra
const TETO_FS = `
uniform float uT; uniform vec3 uHoriz; varying vec3 vL; varying vec3 vW;
${NOISE}
void main(){
  float dz = -vL.z;
  vec2 q = vec2(vL.x * 0.06, dz * 0.0035 - uT * 0.55);
  float e1 = pF(vec2(vL.x * 0.045, dz * 0.0022 - uT * 0.42));
  float e2 = pN(vec2(vL.x * 0.21, dz * 0.006 - uT * 0.9));
  float estria = pow(smoothstep(0.35, 0.85, e1 * 0.75 + e2 * 0.35), 2.0);
  float longe = smoothstep(60.0, 2600.0, dz);
  vec3 escuro = vec3(0.006, 0.05, 0.075), claro = vec3(0.05, 0.25, 0.30);
  vec3 col = mix(escuro, claro, longe * 0.85 + estria * 0.45);
  col += vec3(0.10, 0.32, 0.34) * estria * (0.35 + 0.65 * longe) * 0.7;
  col += vec3(0.05, 0.12, 0.12) * pF(q * 3.0) * 0.25;
  col = mix(col, uHoriz * 0.75, smoothstep(2200.0, 5200.0, dz));
  gl_FragColor = vec4(col, 1.0);
}`;
const TETO_VS = `varying vec3 vL; varying vec3 vW; void main(){ vL = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

// veu na frente da camera: nevoa de borrifo (381-383,3) e o quadro escuro do corte (383,3)
const VEU_FS = `
uniform float uT; uniform float uForca; uniform vec3 uCor; uniform float uPreto; varying vec2 vUv;
${NOISE}
void main(){
  float n = pF(vUv * vec2(3.0, 2.0) + vec2(uT * 0.25, -uT * 0.6)) * 0.7 + pF(vUv * 9.0 - uT * 0.9) * 0.3;
  // de cima para baixo: o borrifo cobre primeiro o alto do quadro; textura de nuvem com contraste
  float alto = smoothstep(-0.35, 0.95, vUv.y + uForca * 0.2);
  float nn = smoothstep(0.38, 0.68, n);
  float a = clamp(uForca * 1.25 * alto * (0.45 + 0.75 * nn) - (1.0 - uForca) * 0.25, 0.0, 0.97);
  vec3 c = uCor * (0.6 + 0.75 * nn);
  gl_FragColor = vec4(mix(c, vec3(0.0), uPreto), max(a, uPreto));
}`;

// ================================================================ componentes
const Fonte: React.FC<{t: number; noite: number; corLuz: THREE.Color}> = ({t, noite, corLuz}) => {
  const gota = useMemo(() => canvasTex(64, 64, (c) => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  }), []);
  const ladrilho = useMemo(() => canvasTex(256, 256, (c) => {
    c.fillStyle = '#1e7fc9'; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const v = 0.85 + rnd(i * 9 + j) * 0.3; c.fillStyle = `rgb(${Math.round(40 * v)},${Math.round(150 * v)},${Math.round(225 * v)})`; c.fillRect(i * 32 + 1, j * 32 + 1, 30, 30); }
  }), []);
  // gotas: jato central (7,5 m), 10 jatos em anel (2,4 m) e 20 arcos baixos
  const {geo, matG} = useMemo(() => {
    const jatos: [number, number, number, number, number][] = [];   // x, z, vy, abertura/alcance, angulo
    jatos.push([0, 0, Math.sqrt(2 * 9.8 * 7.5), 0.35, 0]);
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; jatos.push([Math.cos(a) * 3.4, Math.sin(a) * 3.4, Math.sqrt(2 * 9.8 * 2.4), 0.25, a]); }
    for (let k = 0; k < 20; k++) { const a = (k / 20) * Math.PI * 2; jatos.push([Math.cos(a) * 5.0, Math.sin(a) * 5.0, 3.2, -2.6, a]); }
    const N = 2600, base = new Float32Array(N * 4), d2 = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      const j = i < 1100 ? 0 : i < 2000 ? 1 + (i % 10) : 11 + (i % 20), J = jatos[j];
      base.set([J[0], J[1], J[2], J[4]], i * 4);
      d2.set([rnd(i * 3 + 1), rnd(i * 3 + 2), rnd(i * 3 + 3), J[3]], i * 4);
    }
    const g = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1) as any) as THREE.InstancedBufferGeometry;
    g.setAttribute('aJ', new THREE.InstancedBufferAttribute(base, 4)); g.setAttribute('aR', new THREE.InstancedBufferAttribute(d2, 4)); g.instanceCount = N;
    const m = new THREE.ShaderMaterial({transparent: true, depthWrite: false, uniforms: {uT: {value: 0}, uMap: {value: gota}, uCor: {value: new THREE.Color()}},
      vertexShader: `attribute vec4 aJ; attribute vec4 aR; uniform float uT; varying vec2 vUv; varying float vA;
        void main(){
          float vy = aJ.z * (0.92 + 0.12 * aR.y), voo = 2.0 * vy / 9.8;
          float tau = fract(uT / voo + aR.x) * voo;
          float lat = aR.w > 0.0 ? aR.w * (aR.z - 0.5) : 0.0;
          vec2 dirA = vec2(cos(aJ.w), sin(aJ.w));
          vec2 h = aR.w > 0.0 ? vec2(cos(aR.z * 6.283), sin(aR.z * 6.283)) * lat * tau : dirA * (-aR.w) * tau;
          vec3 c = vec3(aJ.x + h.x, 0.6 + vy * tau - 4.9 * tau * tau, aJ.y + h.y);
          vec3 cw = (modelMatrix * vec4(c, 1.0)).xyz;
          vec3 dx = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), dy = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
          float tam = 0.10 + 0.22 * aR.y + 0.12 * tau / voo;
          vUv = uv; vA = (1.0 - smoothstep(0.85, 1.0, tau / voo)) * 0.55;
          gl_Position = projectionMatrix * viewMatrix * vec4(cw + (dx * position.x + dy * position.y) * tam, 1.0);
        }`,
      fragmentShader: `uniform sampler2D uMap; uniform vec3 uCor; varying vec2 vUv; varying float vA;
        void main(){ float a = texture2D(uMap, vUv).a; gl_FragColor = vec4(uCor, min(1.0, a * vA * 1.6)); }`});
    const malha = new THREE.Mesh(g, m); malha.frustumCulled = false;
    return {geo: malha, matG: m};
  }, [gota]);
  matG.uniforms.uT.value = t;
  (matG.uniforms.uCor.value as THREE.Color).copy(corLuz).multiplyScalar(2.2).add(new THREE.Color(0.75, 0.88, 1.0).multiplyScalar(noite * 2.2));
  const aguaM = useMemo(() => new THREE.MeshStandardMaterial({map: ladrilho, roughness: 0.08, metalness: 0, color: '#9fd8ff', emissive: new THREE.Color('#2b9cff'), emissiveIntensity: 0}), [ladrilho]);
  aguaM.emissiveIntensity = 0.15 + noite * 1.6;
  const pedra = useMemo(() => new THREE.MeshStandardMaterial({color: '#e9e4da', roughness: 0.7}), []);
  // nucleo do jato central: coluna translucida com agua subindo (ruido rolando em t)
  const jato = useMemo(() => new THREE.ShaderMaterial({transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: {uT: {value: 0}, uCor: {value: new THREE.Color()}},
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uT; uniform vec3 uCor; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
${NOISE}
void main(){
  float n = pF(vec2(vUv.x * 6.0, vUv.y * 5.0 - uT * 2.6));
  float borda = pow(abs(dot(normalize(vN), vV)), 0.6);
  float a = (0.35 + 0.65 * smoothstep(0.35, 0.7, n)) * borda * smoothstep(1.0, 0.75, vUv.y) * 0.85;
  gl_FragColor = vec4(uCor * (0.85 + 0.4 * n), a);
}`}), []);
  jato.uniforms.uT.value = t; (jato.uniforms.uCor.value as THREE.Color).copy(matG.uniforms.uCor.value as THREE.Color);
  const borda = useMemo(() => new THREE.LatheGeometry([new THREE.Vector2(5.6, 0), new THREE.Vector2(6.3, 0), new THREE.Vector2(6.3, 0.7), new THREE.Vector2(5.6, 0.7), new THREE.Vector2(5.6, 0)], 64), []);
  return (
    <group position={[FONTE[0], 0, FONTE[1]]}>
      <mesh geometry={borda} material={pedra} castShadow receiveShadow />
      <mesh material={aguaM} rotation-x={-Math.PI / 2} position={[0, 0.5, 0]} receiveShadow><circleGeometry args={[5.6, 64]} /></mesh>
      <mesh material={pedra} position={[0, 0.6, 0]} castShadow><cylinderGeometry args={[0.7, 1.0, 0.6, 24]} /></mesh>
      <primitive object={geo} />
      <mesh material={jato} position={[0, 0.6 + 3.7, 0]} renderOrder={3}><cylinderGeometry args={[0.12, 0.38, 7.4, 16, 1, true]} /></mesh>
    </group>
  );
};

// carros na avenida (time-lapse)
const Carros: React.FC<{t: number; noite: number}> = ({t, noite}) => {
  const N = 12;
  const {corpo, cabine, farol} = useMemo(() => {
    const cores = ['#f4f1ea', '#c0392b', '#f2c14e', '#2c2f36', '#1f3f8f', '#f4f1ea', '#7f8c8d', '#16a085'];
    const corpo = new THREE.InstancedMesh(new THREE.BoxGeometry(4.3, 0.85, 1.85), new THREE.MeshStandardMaterial({roughness: 0.35, metalness: 0.4}), N);
    const cabine = new THREE.InstancedMesh(new THREE.BoxGeometry(2.3, 0.65, 1.65), new THREE.MeshStandardMaterial({color: '#20262e', roughness: 0.15, metalness: 0.6}), N);
    const farol = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.18, 1.5), new THREE.MeshStandardMaterial({color: '#fff', emissive: new THREE.Color('#fff2c8'), emissiveIntensity: 0}), N);
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) corpo.setColorAt(i, c.set(cores[i % cores.length]));
    for (const m of [corpo, cabine]) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; }
    farol.frustumCulled = false;
    return {corpo, cabine, farol};
  }, []);
  for (let i = 0; i < N; i++) {
    const faixa = i % 2, v = (faixa ? -1 : 1) * (11 + rnd(i * 5) * 4) * 2.5, x0 = rnd(i * 5 + 1) * 320;
    const x = ((x0 + v * t) % 320 + 320) % 320 - 160, z = faixa ? -24.2 : -27.6, ry = v > 0 ? 0 : Math.PI;
    corpo.setMatrixAt(i, compoe(x, 0.62, z, 0, ry, 0, 1));
    cabine.setMatrixAt(i, compoe(x - Math.sign(v) * 0.3, 1.35, z, 0, ry, 0, 1));
    farol.setMatrixAt(i, compoe(x + Math.sign(v) * 2.16, 0.7, z, 0, ry, 0, 1));
  }
  corpo.instanceMatrix.needsUpdate = cabine.instanceMatrix.needsUpdate = farol.instanceMatrix.needsUpdate = true;
  (farol.material as THREE.MeshStandardMaterial).emissiveIntensity = noite * 6;
  return <><primitive object={corpo} /><primitive object={cabine} /><primitive object={farol} /></>;
};

// calcadao, rua, mureta, postes, bancos, guarda-sois, posto de salva-vidas
const Cidade: React.FC<{noite: number}> = ({noite}) => {
  const tex = useMemo(() => {
    const lajota = canvasTex(512, 512, (c) => {
      c.fillStyle = '#c9bb9e'; c.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
        const v = 0.93 + rnd(i * 31 + j) * 0.1, claro = (i + j) % 2 === 0;
        c.fillStyle = claro ? `rgb(${Math.round(206 * v)},${Math.round(194 * v)},${Math.round(170 * v)})` : `rgb(${Math.round(186 * v)},${Math.round(170 * v)},${Math.round(143 * v)})`;
        c.fillRect(i * 64 + 1, j * 64 + 1, 62, 62);
      }
      c.strokeStyle = 'rgba(110,95,75,0.35)'; c.lineWidth = 2;
      for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64, 512); c.stroke(); c.beginPath(); c.moveTo(0, i * 64); c.lineTo(512, i * 64); c.stroke(); }
      for (let k = 0; k < 2500; k++) { c.fillStyle = `rgba(90,80,60,${rnd(k) * 0.07})`; c.fillRect(rnd(k + 1) * 512, rnd(k + 2) * 512, 2, 2); }
    });
    lajota.repeat.set(800 / 6, 32 / 6);
    const asfalto = canvasTex(512, 512, (c) => {
      c.fillStyle = '#3b3f47'; c.fillRect(0, 0, 512, 512);
      for (let k = 0; k < 6000; k++) { c.fillStyle = `rgba(255,255,255,${rnd(k) * 0.05})`; c.fillRect(rnd(k + 1) * 512, rnd(k + 2) * 512, 1.5, 1.5); }
      c.fillStyle = 'rgba(240,240,230,0.85)'; for (let x = 0; x < 512; x += 128) c.fillRect(x, 252, 70, 8);
    });
    asfalto.repeat.set(800 / 24, 1);
    const listras = canvasTex(64, 256, (c) => { const cs = ['#f2d22e', '#4caf50', '#ff6fae', '#f2d22e', '#4caf50', '#ff6fae', '#3fa7d6', '#ffffff']; cs.forEach((s, i) => { c.fillStyle = s; c.fillRect(0, i * 32, 64, 32); }); });
    const halo = canvasTex(128, 128, (c) => {
      const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.55)'); g.addColorStop(0.6, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, 128, 128);
    });
    halo.wrapS = halo.wrapT = THREE.ClampToEdgeWrapping;
    return {lajota, asfalto, listras, halo};
  }, []);
  const mats = useMemo(() => ({
    lajota: new THREE.MeshStandardMaterial({map: tex.lajota, roughness: 0.82}),
    asfalto: new THREE.MeshStandardMaterial({map: tex.asfalto, roughness: 0.9}),
    pedra: new THREE.MeshStandardMaterial({color: '#cfc7b8', roughness: 0.8}),
    metal: new THREE.MeshStandardMaterial({color: '#2a2e33', roughness: 0.45, metalness: 0.7}),
    lampada: new THREE.MeshStandardMaterial({color: '#fff6e0', emissive: new THREE.Color('#ffd89a'), emissiveIntensity: 0}),
    madeira: new THREE.MeshStandardMaterial({color: '#8a5a36', roughness: 0.8}),
    grama: new THREE.MeshStandardMaterial({color: '#4f7a3a', roughness: 0.9}),
    posto: new THREE.MeshStandardMaterial({map: tex.listras, roughness: 0.6}),
    branco: new THREE.MeshStandardMaterial({color: '#f4f1ea', roughness: 0.6}),
    poca: new THREE.MeshBasicMaterial({map: tex.halo, color: '#ffcf86', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending}),
  }), [tex]);
  mats.lampada.emissiveIntensity = noite * 9;
  mats.poca.opacity = noite * 0.34;
  const inst = useMemo(() => {
    const postes: Inst[] = [], cabecas: Inst[] = [], bancos: Inst[] = [], canteiros: Inst[] = [], pocas: Inst[] = [];
    for (const z of [-34.8, -60.5]) for (const x of POSTE_XS) {
      const xx = x + (z < -50 ? 9 : 0);
      postes.push({m: compoe(xx, 2.6, z, 0, 0, 0, 1)}); cabecas.push({m: compoe(xx, 5.25, z, 0, 0, 0, 1)});
      pocas.push({m: compoe(xx, 0.03, z, -Math.PI / 2, 0, 0, 5.5)});
    }
    for (let i = 0; i < 40; i++) { const x = -200 + i * 10 + rnd(i) * 3; if (Math.abs(x - FONTE[0]) < 9) continue; bancos.push({m: compoe(x, 0.25, i % 2 ? -37 : -55.8, 0, 0, 0, 1)}); }
    for (let i = 0; i < 16; i++) canteiros.push({m: compoe(-210 + i * 27 + 6, 0.3, -46 + (i % 2 ? 4 : -4), 0, 0, 0, 1)});
    // guarda-sois: mastro + copa (cone baixo) inclinados
    const mastros: Inst[] = [], copas: Inst[] = [], toalhas: Inst[] = [];
    GUARDA.forEach((g, i) => {
      const y = alturaPerfil(sDe(g.z));
      mastros.push({m: compoe(g.x, y + 1.1, g.z, g.inc * 0.5, 0, g.inc * 0.4, 1)});
      copas.push({m: compoe(g.x + g.inc * 0.8, y + 2.2, g.z, g.inc * 0.5, g.ry, g.inc * 0.4, 1), c: g.c});
      toalhas.push({m: compoe(g.x + 1.4, y + 0.03, g.z + 1.2, 0, g.ry, 0, 1), c: COR_GUARDA[(i * 3 + 2) % COR_GUARDA.length]});
    });
    const geoCopa = new THREE.ConeGeometry(1.5, 0.55, 12, 1, true);
    const matCopa = new THREE.MeshStandardMaterial({roughness: 0.7, side: THREE.DoubleSide});
    // gomos brancos e coloridos alternados (cor da instancia so nos gomos pares)
    matCopa.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vPg;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvPg = position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vPg;')
        .replace('#include <color_fragment>', `#if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
  float gomo = step(0.5, fract(atan(vPg.z, vPg.x) / 6.2831853 * 6.0));
  diffuseColor.rgb *= mix(vec3(1.0), vColor, gomo);
#endif`);
    };
    return {
      postes: instancias(new THREE.CylinderGeometry(0.07, 0.11, 5.2, 8), mats.metal, postes),
      cabecas: instancias(new THREE.SphereGeometry(0.28, 12, 8), mats.lampada, cabecas, false),
      pocas: instancias(new THREE.CircleGeometry(1, 24), mats.poca, pocas, false),
      bancos: instancias(new THREE.BoxGeometry(2.0, 0.5, 0.6), mats.madeira, bancos),
      canteiros: instancias(new THREE.BoxGeometry(4.5, 0.6, 2.2), mats.grama, canteiros),
      mastros: instancias(new THREE.CylinderGeometry(0.03, 0.03, 2.3, 6), mats.metal, mastros),
      copas: instancias(geoCopa, matCopa, copas),
      toalhas: instancias(new THREE.BoxGeometry(1.8, 0.04, 0.9), new THREE.MeshStandardMaterial({roughness: 0.9}), toalhas),
    };
  }, [mats]);
  const yP = alturaPerfil(sDe(-80));
  return (
    <group>
      {/* calcadao (z -30..-62), meio-fio, rua (z -21..-30) e calcada do outro lado */}
      <mesh material={mats.lajota} rotation-x={-Math.PI / 2} position={[0, 0, -46]} receiveShadow><planeGeometry args={[800, 32]} /></mesh>
      <mesh material={mats.pedra} position={[0, 0.08, -30.15]} receiveShadow castShadow><boxGeometry args={[800, 0.3, 0.4]} /></mesh>
      <mesh material={mats.asfalto} rotation-x={-Math.PI / 2} position={[0, -0.05, -25.9]} receiveShadow><planeGeometry args={[800, 8.4]} /></mesh>
      <mesh material={mats.lajota} rotation-x={-Math.PI / 2} position={[0, 0.02, -15]} receiveShadow><planeGeometry args={[800, 13.4]} /></mesh>
      {/* mureta e degrau para a areia */}
      <mesh material={mats.pedra} position={[0, -0.35, Z_MURO + 0.25]} receiveShadow castShadow><boxGeometry args={[800, 1.3, 0.5]} /></mesh>
      <primitive object={inst.postes} /><primitive object={inst.cabecas} /><primitive object={inst.pocas} />
      <primitive object={inst.bancos} /><primitive object={inst.canteiros} />
      <primitive object={inst.mastros} /><primitive object={inst.copas} /><primitive object={inst.toalhas} />
      {/* posto de salva-vidas listrado sobre palafitas */}
      <group position={[36, yP, -80]} rotation-y={0.15}>
        {[[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]].map(([x, z], i) => <mesh key={i} material={mats.branco} position={[x, 1.4, z]} castShadow><boxGeometry args={[0.18, 2.8, 0.18]} /></mesh>)}
        <mesh material={mats.posto} position={[0, 3.6, 0]} castShadow><boxGeometry args={[3.0, 1.8, 2.8]} /></mesh>
        <mesh material={mats.branco} position={[0, 4.65, 0]} castShadow><boxGeometry args={[3.6, 0.25, 3.4]} /></mesh>
        <mesh material={mats.madeira} position={[0, 1.4, 2.4]} rotation-x={0.6} castShadow><boxGeometry args={[0.9, 0.1, 3.2]} /></mesh>
      </group>
    </group>
  );
};

// barcos (no mar ou encalhados) e pedras escuras do leito
const BarcosPedras: React.FC<{t: number; noMar: boolean; nivel: number}> = ({t, noMar, nivel}) => {
  const geoCasco = useMemo(() => {
    const sh = new THREE.Shape(); sh.moveTo(-3, -1); sh.lineTo(2, -1); sh.quadraticCurveTo(3.4, 0, 2, 1); sh.lineTo(-3, 1); sh.lineTo(-3, -1);
    const g = new THREE.ExtrudeGeometry(sh, {depth: 1.2, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 2});
    g.rotateX(-Math.PI / 2); g.translate(0, -0.3, 0); return g;
  }, []);
  const mats = useMemo(() => ({casco: new THREE.MeshStandardMaterial({roughness: 0.5}), cab: new THREE.MeshStandardMaterial({color: '#e8e8e8', roughness: 0.5}),
    pedra: new THREE.MeshStandardMaterial({color: '#3d3a35', roughness: 0.85})}), []);
  const geoPedra = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 1), P = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), w = 1 + 0.25 * Math.sin(x * 4.1 + z * 2.3) + 0.15 * Math.cos(y * 5.7); P.setXYZ(i, x * w, Math.max(-0.3, y) * 0.55 * w, z * w); }
    g.computeVertexNormals(); return g;
  }, []);
  const {cascos, cabs, pedras} = useMemo(() => {
    const cascos = new THREE.InstancedMesh(geoCasco, mats.casco, BARCOS.length), cabs = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, 0.9, 1.2), mats.cab, BARCOS.length);
    const c = new THREE.Color(); BARCOS.forEach((b, i) => cascos.setColorAt(i, c.set(b.c)));
    for (const m of [cascos, cabs]) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; }
    const pedras = instancias(geoPedra, mats.pedra, PEDRAS.map((p) => ({m: compoe(p.x, alturaPerfil(p.s) - 0.15 * p.esc, Z_MURO - p.s, 0, p.ry, 0, p.esc, p.esc * 0.8, p.esc * 1.3)})));
    return {cascos, cabs, pedras};
  }, [geoCasco, geoPedra, mats]);
  const desloc = useMemo(() => new THREE.Matrix4().makeTranslation(-0.6, 0.85, 0), []);
  BARCOS.forEach((b, i) => {
    const s = noMar ? 200 + b.s : b.s, z = Z_MURO - s;
    const y = noMar ? nivel + 0.12 * Math.sin(t * 1.3 + i) : alturaPerfil(s) + 0.2;
    const rz = noMar ? 0.05 * Math.sin(t * 1.1 + i * 2) : b.tomb, rx = noMar ? 0.04 * Math.sin(t * 0.9 + i) : 0.08;
    const m = compoe(b.x, y, z, rx, b.ry, rz, b.esc);
    cascos.setMatrixAt(i, m); cabs.setMatrixAt(i, m.clone().multiply(desloc));
  });
  cascos.instanceMatrix.needsUpdate = cabs.instanceMatrix.needsUpdate = true;
  return <><primitive object={cascos} /><primitive object={cabs} />{!noMar && <primitive object={pedras} />}</>;
};

// uniformes de luz comuns (mar, onda)
const luzUniforms = (mat: THREE.ShaderMaterial, t: number) => {
  const l = luzEm(t, 'ecuador'), h = corHorizonte(t, 'ecuador'), u = mat.uniforms;
  if (u.uSol) u.uSol.value.copy(solEm(t, 'ecuador'));
  if (u.uCorSol) u.uCorSol.value.copy(l.corSol);
  if (u.uSolI) u.uSolI.value = Math.min(3, l.intensidade) * smooth(-0.03, 0.08, l.sol.y);
  if (u.uHoriz) u.uHoriz.value.copy(h);
  if (u.uZen) u.uZen.value.copy(l.ambiente).multiplyScalar(Math.max(0.02, l.ambienteForca));
  if (u.uDia) u.uDia.value = l.dia;
  if (u.uEnvK) u.uEnvK.value = 0.55 * l.dia;
};

// mar (cap. 2 e o mar de volta no horizonte em 383,4+)
const MarPraia: React.FC<{t: number; nivel: number; cortaS: number; env: THREE.Texture; tn: THREE.Texture}> = ({t, nivel, cortaS, env, tn}) => {
  const geo = useMemo(() => { const g = new THREE.PlaneGeometry(12000, 9000, 1, 1); g.rotateX(-Math.PI / 2); g.translate(0, 0, Z_MURO - 4500); return g; }, []);
  const mat = useMemo(() => new THREE.ShaderMaterial({vertexShader: MAR_VS, fragmentShader: MAR_FS, transparent: true, depthWrite: true,
    uniforms: {uN: {value: tn}, uEnv: {value: env}, uT: {value: 0}, uNivel: {value: 0}, uCostaS: {value: 0}, uCortaS: {value: 0}, uSol: {value: new THREE.Vector3()},
      uCorSol: {value: new THREE.Color()}, uSolI: {value: 1}, uHoriz: {value: new THREE.Color()}, uZen: {value: new THREE.Color()}, uDia: {value: 1}, uEnvK: {value: 0.5}}}), [env, tn]);
  luzUniforms(mat, t);
  const u = mat.uniforms; u.uT.value = t; u.uNivel.value = nivel; u.uCostaS.value = sCosta(nivel); u.uCortaS.value = cortaS;
  return <mesh geometry={geo} material={mat} position={[0, nivel, 0]} renderOrder={2} />;
};

// a onda gigante (cap. 15): faixa de malha com perfil animado + borrifo
const NX = 180, NU = 44;
// perfil (s para a terra, y) em unidades de H: costas -> crista -> face concava -> pe com espuma correndo na frente
const PERFIL_ONDA: [number, number][] = [[-3.2, 0.0], [-1.6, 0.42], [-0.7, 0.82], [-0.2, 0.97], [0.05, 1.0], [0.2, 0.93], [0.24, 0.7], [0.22, 0.42], [0.3, 0.16], [0.6, 0.03], [1.1, 0.0]];
const catmull = (P: [number, number][], u: number): [number, number] => {
  const n = P.length - 1, x = Math.min(n - 1e-6, Math.max(0, u * n)), i = Math.floor(x), f = x - i;
  const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n, i + 2)];
  const c = (a: number, b: number, cc: number, d: number) => 0.5 * (2 * b + (-a + cc) * f + (2 * a - 5 * b + 4 * cc - d) * f * f + (-a + 3 * b - 3 * cc + d) * f * f * f);
  return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])];
};
const mkBorrifo = (tex: THREE.Texture, n: number, tipo: number, semente: number) => {
  const g = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1) as any) as THREE.InstancedBufferGeometry;
  const a = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) a.set([rnd(semente + i * 4), rnd(semente + i * 4 + 1), rnd(semente + i * 4 + 2), tipo], i * 4);
  g.setAttribute('aS', new THREE.InstancedBufferAttribute(a, 4)); g.instanceCount = n;
  const m = new THREE.ShaderMaterial({vertexShader: BORRIFO_VS, fragmentShader: BORRIFO_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: {uT: {value: 0}, uH: {value: 1}, uZF: {value: 0}, uLarg: {value: 4000}, uVida: {value: 5}, uFrames: {value: 64}, uAtlas: {value: tex}, uCols: {value: 8}, uRows: {value: 8},
      uCor: {value: new THREE.Color()}, uForca: {value: 1}}});
  const malha = new THREE.Mesh(g, m); malha.frustumCulled = false; malha.renderOrder = 10;
  return malha;
};
const Onda: React.FC<{t: number; env: THREE.Texture; tn: THREE.Texture; camZ: number}> = ({t, env, tn, camZ}) => {
  const [atlas, fiapo] = useTexture([staticFile(ATLAS.nuvem2.arq), staticFile(ATLAS.nuvem1.arq)]);
  useMemo(() => { for (const x of [atlas, fiapo]) { x.colorSpace = THREE.NoColorSpace; x.needsUpdate = true; } }, [atlas, fiapo]);
  const {geo, pos, aY, mat} = useMemo(() => {
    const g = new THREE.BufferGeometry(), N = NX * NU;
    const pos = new Float32Array(N * 3), aU = new Float32Array(N), aY = new Float32Array(N), idx: number[] = [];
    for (let i = 0; i < NX; i++) for (let j = 0; j < NU; j++) aU[i * NU + j] = j / (NU - 1);
    for (let i = 0; i < NX - 1; i++) for (let j = 0; j < NU - 1; j++) { const a = i * NU + j, b = a + NU; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aU', new THREE.BufferAttribute(aU, 1)); g.setAttribute('aY', new THREE.BufferAttribute(aY, 1));
    g.setIndex(idx);
    const m = new THREE.ShaderMaterial({vertexShader: ONDA_VS, fragmentShader: ONDA_FS, side: THREE.DoubleSide,
      uniforms: {uEnv: {value: env}, uN: {value: tn}, uT: {value: 0}, uSol: {value: new THREE.Vector3()}, uCorSol: {value: new THREE.Color()}, uSolI: {value: 1},
        uHoriz: {value: new THREE.Color()}, uZen: {value: new THREE.Color()}, uH: {value: 1}, uEnvK: {value: 0.5}}});
    return {geo: g, pos, aY, mat: m};
  }, [env, tn]);
  const crista = useMemo(() => mkBorrifo(atlas, 520, 0, 101), [atlas]);
  const base = useMemo(() => mkBorrifo(fiapo, 300, 1, 907), [fiapo]);
  // ---- perfil deste quadro
  const P = retorno(t), {D, H} = ondaEm(P), zF = camZ - D;
  const lip = smooth(0.55, 0.85, P);
  for (let i = 0; i < NX; i++) {
    const xs = (i / (NX - 1)) * 2 - 1, x = Math.sign(xs) * Math.pow(Math.abs(xs), 1.8) * 3200;
    const hx = H * (1 + 0.07 * Math.sin(x * 0.0041 + 1.3) + 0.05 * Math.sin(x * 0.011 + t * 0.4) + 0.03 * Math.sin(x * 0.031 - t * 0.9));
    const zx = zF - 0.00004 * x * x + 6 * Math.sin(x * 0.006);
    for (let j = 0; j < NU; j++) {
      const [s0, y] = catmull(PERFIL_ONDA, j / (NU - 1));
      // labio: a crista avanca (a parede fica mais vertical e o topo debruca para a frente)
      const k = j / (NU - 1), w = Math.exp(-Math.pow((k - 0.5) / 0.12, 2));
      const s = s0 + lip * 0.22 * w, z = zx + s * hx;
      const id = (i * NU + j) * 3;
      pos[id] = x; pos[id + 1] = alturaPerfil(sDe(z)) * (1 - y) + y * hx - 0.3; pos[id + 2] = z;
      aY[i * NU + j] = y;
    }
  }
  geo.attributes.position.needsUpdate = true; geo.attributes.aY.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
  luzUniforms(mat, t); mat.uniforms.uT.value = t; mat.uniforms.uH.value = H;
  const l = luzEm(t, 'ecuador');
  const corB = new THREE.Color(0.78, 0.88, 0.9).multiply(new THREE.Color().copy(l.ambiente).multiplyScalar(Math.max(0.3, l.ambienteForca) * 1.4).add(l.corSol.clone().multiplyScalar(0.35)));
  for (const [m, vida, forca] of [[crista, 4.5, smooth(0.38, 0.5, P)], [base, 6.5, smooth(0.42, 0.6, P) * 0.85]] as [THREE.Mesh, number, number][]) {
    const u = (m.material as THREE.ShaderMaterial).uniforms;
    u.uT.value = t; u.uH.value = H; u.uZF.value = zF; u.uVida.value = vida; u.uForca.value = forca; (u.uCor.value as THREE.Color).copy(corB);
  }
  const visivel = P > 0.34 && t < T_TETO;
  return <group visible={visivel}><mesh geometry={geo} material={mat} frustumCulled={false} /><primitive object={crista} /><primitive object={base} /></group>;
};

// teto de agua (383,4-390,1)
const Teto: React.FC<{t: number; camZ: number}> = ({t, camZ}) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({vertexShader: TETO_VS, fragmentShader: TETO_FS, side: THREE.DoubleSide, uniforms: {uT: {value: 0}, uHoriz: {value: new THREE.Color()}}}), []);
  const geo = useMemo(() => { const g = new THREE.PlaneGeometry(14000, 6000, 1, 1); g.rotateX(Math.PI / 2); g.translate(0, 0, -2700); return g; }, []);
  mat.uniforms.uT.value = t; (mat.uniforms.uHoriz.value as THREE.Color).copy(corHorizonte(t, 'ecuador')).lerp(new THREE.Color(0.06, 0.22, 0.26), 0.6);
  // o teto desce um pouco com o tempo (a agua passa por cima e afunda)
  return <mesh geometry={geo} material={mat} position={[0, 46 - 6 * smooth(T_TETO, 390, t), camZ]} />;
};

// veu na frente da camera (mundo)
const Veu: React.FC<{t: number; forca: number; preto: number}> = ({t, forca, preto}) => {
  const {camera} = useThree();
  const mat = useMemo(() => new THREE.ShaderMaterial({vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: VEU_FS, transparent: true, depthTest: false, depthWrite: false,
    uniforms: {uT: {value: 0}, uForca: {value: 0}, uCor: {value: new THREE.Color(0.30, 0.52, 0.58)}, uPreto: {value: 0}}}), []);
  mat.uniforms.uT.value = t; mat.uniforms.uForca.value = forca; mat.uniforms.uPreto.value = preto;
  const d = new THREE.Vector3(); camera.getWorldDirection(d);
  const p = camera.position.clone().addScaledVector(d, 1.2);
  return <mesh material={mat} position={p.toArray()} quaternion={camera.quaternion.clone()} renderOrder={100} visible={forca > 0.001 || preto > 0}
    frustumCulled={false}><planeGeometry args={[6, 4]} /></mesh>;
};

// ================================================================ mundo
export const Praia: React.FC<{t: number}> = ({t}) => {
  const {camera} = useThree();
  const env = useHDR('praia');
  const tn = useTexture(staticFile('praia/waternormals.jpg'));
  useMemo(() => { tn.wrapS = tn.wrapT = THREE.RepeatWrapping; tn.colorSpace = THREE.NoColorSpace; tn.needsUpdate = true; }, [tn]);
  const f = faseDe(t);
  // ---- camera deste quadro
  const c = camPraia(t);
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...c.pos); cam.lookAt(...c.alvo); cam.fov = c.fov; cam.near = 0.5; cam.far = 2e5; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  const camL = paraLocal(cam.position);
  // ---- luz / tempo
  const l = luzEm(t, 'ecuador');
  const noite = clamp01(1 - l.dia * 1.25);
  const sol = solEm(t, 'ecuador');
  // ---- agua
  const nivel = f === 'varanda' ? nivelCap2(t) : NIVEL0;
  // cap. 15: a agua volta correndo na frente da muralha (lencol que cobre o leito) e, depois do teto, o mar fica no horizonte
  const P = retorno(t);
  const marVisivel = f === 'varanda' || (f === 'onda' && (t >= T_TETO || P > 0.37));
  const sFrente = Z_MURO - (camL.z - ondaEm(P).D);
  const cortaS = f !== 'onda' ? 0 : t >= T_TETO ? 340 - 60 * smooth(T_TETO, 390, t) : Math.max(20, sFrente * (0.45 - 0.36 * smooth(0.38, 0.52, P)));
  // ---- chao (ChaoMolhado do agente Leito): praia + leito, seca no cap. 3; umedece de novo no cap. 12 (reflexo do poente)
  const agua = useMemo<AguaDistancia>(() => {
    const o = paraMundo(0, 0, Z_MURO), d = paraMundo(0, 0, -1);
    const s30 = sCosta(nivelCap2(29.9));
    return {tipo: 'distancia', origem: [o[0], o[2]], dir: [d[0], d[2]],
      linha: (tt: number) => (tt < 30 ? sCosta(nivelCap2(tt)) : s30 + (5200 - s30) * smooth(34, 60, tt))};
  }, []);
  const molha = f === 'solvolta' ? smooth(283, 298, t) : 0;
  const {mat: matChao} = useChaoMolhado({t, agua, chave: 'praia_eq_v1', janela: [0, 120], lama: 0.35, pocas: 0.55 + 0.4 * molha, algas: 0.45, irregular: 6, espraiado: 6,
    repeticao: 3.2, reflexo: 1 + 1.2 * molha, secagem: molha > 0 ? {umido: 3 + 400 * molha, seco: 9 + 800 * molha, racha: 18 + 1600 * molha} : {umido: 3, seco: 9, racha: 18}});
  const geoChao = useMemo(() => {
    // faixas em s (densas perto da praia), poucas colunas (o relevo so depende de s); uv = (x, -z) do MUNDO
    const ss: number[] = []; for (let i = 0; i <= 40; i++) ss.push(i * 1.5); for (let i = 1; i <= 90; i++) ss.push(60 + Math.pow(i / 90, 2.2) * 7000);
    const xs: number[] = []; for (let i = 0; i <= 24; i++) xs.push(-7000 + (i / 24) * 14000);
    const pos: number[] = [], uv: number[] = [], idx: number[] = [];
    ss.forEach((s) => xs.forEach((x) => { const w = paraMundo(x, alturaPerfil(s), Z_MURO - s); pos.push(...w); uv.push(w[0], -w[2]); }));
    for (let i = 0; i < ss.length - 1; i++) for (let j = 0; j < xs.length - 1; j++) { const a = i * xs.length + j, b = a + xs.length; idx.push(a, a + 1, b, a + 1, b + 1, b); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals(); return g;
  }, []);
  // ---- pessoas: time-lapse no cap. 2; no cap. 15 fogem da onda (para +z local) a partir de 373
  const semMar = f !== 'varanda';
  const listaP = semMar ? PESSOAS_SEM_MAR : PESSOAS_CAP2;
  const tP = f === 'varanda' ? t * 3.2 : t * 1.4;
  const tFuga = f === 'onda' ? 373 * 1.4 : 0;
  // ---- vento: brisa; rajada forte com a onda chegando
  const vento = f === 'onda' ? 1 + 2.2 * smooth(372, 382, t) : f === 'varanda' ? 1.1 : 0.7;
  // ---- onda / teto / veu
  const veuForca = f === 'onda' && t < T_TETO ? smooth(380.6, 383.1, t) : 0;
  const preto = f === 'onda' && t >= T_TETO && t < T_TETO + 1 / 30 + 1e-4 ? 1 : 0;
  const corFonte = useMemo(() => new THREE.Color(), []);
  corFonte.copy(l.ambiente).multiplyScalar(l.ambienteForca * 0.6 + 0.08).add(l.corSol.clone().multiplyScalar(0.35 * l.dia));
  return (
    <>
      <CeuLugar t={t} lugar="ecuador" sombra={85} />
      <mesh geometry={geoChao} material={matChao} receiveShadow />
      <group rotation-y={G}>
        <Cidade noite={noite} />
        <Fonte t={t} noite={noite} corLuz={corFonte} />
        <Carros t={f === 'varanda' ? t * 3 : t} noite={noite} />
        <Palmeiras lista={PALMEIRAS} t={t} vento={vento} sol={sol.y > -0.05 ? sol : undefined} corSol={l.corSol} ventoDir={[0.3, 1]} />
        <Multidao3D lista={listaP} t={tP} de={[0, -4000]} tFuga={tFuga} cam={camL} raio={6} />
        <BarcosPedras t={t} noMar={f === 'varanda'} nivel={nivel} />
        {marVisivel && <MarPraia t={t} nivel={nivel} cortaS={cortaS} env={env} tn={tn} />}
        {f === 'onda' && <Onda t={t} env={env} tn={tn} camZ={camL.z} />}
        {f === 'onda' && t >= T_TETO && <Teto t={t} camZ={camL.z} />}
      </group>
      {f === 'onda' && <Veu t={t} forca={veuForca} preto={preto} />}
    </>
  );
};
