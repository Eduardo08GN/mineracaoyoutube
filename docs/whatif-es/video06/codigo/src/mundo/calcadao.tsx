// Calcadao (dono: agente Calcadao): o malecon de Atacames (Esmeraldas, Ecuador) visto da praca, olhando a cidade (OESTE).
// Capitulo 1 (0-4,1, cold open = flash-forward de ~346-350) e capitulo 14 (329,9-357): noite com janelas acesas -> aurora lilas
// (340-345) -> o Sol NASCE NO OESTE (~345,5) no fim da rua transversal, entre os predios e "entre os carros" da avenida.
// Cena: praca com lajotas de granito (PBR Poly Haven), letras coloridas "ATACAMES", fonte, bancos, floreiras, postes acesos,
// ponto de onibus; avenida de 4 faixas com carros, taxis amarelos e onibus; predios brancos escalonados de varandas e telhado
// marrom (fachada procedural: janelas acesas por semente, apagando uma a uma no amanhecer); palmeiras (palmeiras.tsx).
// Coordenadas locais: a camera anda em x (travelling para a direita) olhando -z; o grupo inteiro gira (yaw) para que o -z local
// aponte para o azimute REAL do nascer do Sol do ceu (solEm), e a rua transversal (x = XS +- 8 m) fica alinhada com ele.
// Tudo e funcao de t: tMov (pessoas, carros, camera, fonte) e tLuz (janelas, postes, look). Nada acumula entre quadros.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useLoader, useThree} from '@react-three/fiber';
import {useTexture} from '@react-three/drei';
import {staticFile} from 'remotion';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {FontLoader, Font} from 'three/examples/jsm/loaders/FontLoader.js';
import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry.js';
import {Perfil} from '../look/Look';
import {CeuLugar, corHorizonte, solEm} from './ceu';
import {rnd, smooth} from './comum';
import {Multidao3D, Pessoa3D, Estado3D} from './pessoas';
import {Palmeiras, PalmeiraItem} from './palmeiras';

type V3 = [number, number, number];

// ---------------------------------------------------------------- tempos
const T_AB = 4.1;
// movimento (camera, pessoas, carros, fonte): o cold open repete o plano de 346-350 em velocidade normal
export const tMovCalcadao = (t: number) => (t < T_AB ? 346 + t * 0.98 : t);
// luz (janelas, postes, look): o mesmo mapa do ceu (ceu.tsx: o cold open = 345,3-347,3)
export const tLuzCalcadao = (t: number) => (t < T_AB ? 345.3 + (t / T_AB) * 2 : t);
const noiteDe = (tl: number) => 1 - smooth(340, 348.5, tl);          // 1 noite, 0 dia
const posteDe = (tl: number) => 1 - 0.6 * smooth(350, 357, tl);       // os postes seguem acesos no amanhecer (original)
const farolDe = (tl: number) => 0.35 + 0.65 * (1 - smooth(349, 354, tl));

// ---------------------------------------------------------------- geografia (local)
const XS = 0.6, MEIA = 7;                // rua transversal que aponta para o nascer do Sol (eixo -z)
const Z_AV0 = -15, Z_AV1 = -31.5, Z_CALC2 = -38;
const Y_RUA = -0.15;
const FAIXAS = [{z: -16.75, dir: 1, v: 9.0}, {z: -20.25, dir: 1, v: 11.5}, {z: -23.75, dir: -1, v: 10.5}, {z: -27.25, dir: -1, v: 8.2}];

// ---------------------------------------------------------------- camera (chaves locais, Hermite com velocidade continua)
type Chave = [number, V3, V3, number];
const CAM: Chave[] = [
  [329.9, [-4.6, 2.2, 3.2], [-3.0, 5.4, -40], 47],
  [335.5, [-3.0, 2.1, 2.4], [-1.2, 5.3, -40], 46],
  [339.5, [-1.8, 2.0, 1.0], [0.6, 5.1, -40], 45],
  [346, [0.0, 1.9, 0.3], [2.6, 5.0, -40], 45],
  [350, [1.3, 1.9, 0.0], [3.9, 5.4, -40], 45],
  [357, [3.6, 2.0, -0.4], [6.4, 6.4, -40], 45],
];
const camLocal = (tm: number) => {
  const K = CAM, n = K.length, t = Math.min(K[n - 1][0], Math.max(K[0][0], tm));
  let i = 0; while (i < n - 2 && t > K[i + 1][0]) i++;
  const b = K[i], c = K[i + 1], dt = c[0] - b[0], u = (t - b[0]) / dt;
  const vel = (j: number, f: (k: Chave) => number) => {
    const a = K[Math.max(0, j - 1)], d = K[Math.min(n - 1, j + 1)];
    return (f(d) - f(a)) / Math.max(1e-6, d[0] - a[0]);
  };
  const u2 = u * u, u3 = u2 * u;
  const h = (f: (k: Chave) => number) => (2 * u3 - 3 * u2 + 1) * f(b) + (u3 - 2 * u2 + u) * dt * vel(i, f) + (-2 * u3 + 3 * u2) * f(c) + (u3 - u2) * dt * vel(i + 1, f);
  const v = (k: 1 | 2): V3 => [0, 1, 2].map((j) => h((q) => (q[k] as V3)[j])) as V3;
  return {pos: v(1), alvo: v(2), fov: h((q) => q[3])};
};

// ---------------------------------------------------------------- utilidades de textura
const tela = (w: number, h: number, f: (c: CanvasRenderingContext2D) => void, srgb = true) => {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; f(cv.getContext('2d')!);
  const t = new THREE.CanvasTexture(cv); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
const FONTE_CV = 'Arial, Helvetica, "Liberation Sans", sans-serif';
const placa = (txt: string, fundo: string, cor: string, w = 1024, h = 160, borda = true) => tela(w, h, (c) => {
  c.fillStyle = fundo; c.fillRect(0, 0, w, h);
  if (borda) { c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 6; c.strokeRect(10, 10, w - 20, h - 20); }
  let px = Math.floor(h * 0.58); c.font = `bold ${px}px ${FONTE_CV}`;
  while (c.measureText(txt).width > w - 70 && px > 16) { px -= 3; c.font = `bold ${px}px ${FONTE_CV}`; }
  c.fillStyle = cor; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, w / 2, h / 2 + 3);
});
const radial = () => tela(256, 256, (c) => {
  const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 256, 256);
});

type Jogo = {map: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture};
const matPBR = (j: Jogo, L: number, P: number, metros: number, cor: THREE.ColorRepresentation, extra: THREE.MeshStandardMaterialParameters = {}) => {
  const m = new THREE.MeshStandardMaterial({color: cor, roughness: 1, metalness: 0, ...extra});
  (['map', 'normalMap', 'roughnessMap'] as const).forEach((k) => {
    const t = j[k].clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(L / metros, P / metros); t.needsUpdate = true; (m as any)[k] = t;
  });
  return m;
};
const useJogos = () => {
  const a = useTexture([
    'granite_tile_04_diff_2k.jpg', 'granite_tile_04_nor_gl_2k.jpg', 'granite_tile_04_rough_2k.jpg',
    'clean_asphalt_diff_1k.jpg', 'clean_asphalt_nor_gl_1k.jpg', 'clean_asphalt_rough_1k.jpg',
    'clay_roof_tiles_02_diff_1k.jpg', 'clay_roof_tiles_02_nor_gl_1k.jpg', 'clay_roof_tiles_02_rough_1k.jpg',
  ].map((f) => staticFile('calcadao/' + f)));
  return useMemo(() => {
    a.forEach((t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true; });
    a[0].colorSpace = a[3].colorSpace = a[6].colorSpace = THREE.SRGBColorSpace;
    return {granito: {map: a[0], normalMap: a[1], roughnessMap: a[2]}, asfalto: {map: a[3], normalMap: a[4], roughnessMap: a[5]},
      telha: {map: a[6], normalMap: a[7], roughnessMap: a[8]}};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a[0], a[3], a[6]]);
};

// ---------------------------------------------------------------- predios (geometria gerada uma vez)
type Ala = {x0: number; x1: number; z0: number; z1: number; and: number; recuo: number; loja: boolean; sem: number; varanda: boolean; fileira: number};
const H0 = 4.0, HA = 3.0, RECUO = 2.6;
const FILEIRAS = [
  {zf: -42, prof: [12, 15], and: [5, 7], larg: [24, 34], gap: [6, 10], loja: true},
  {zf: -64, prof: [13, 17], and: [7, 9], larg: [26, 38], gap: [7, 12], loja: false},
  {zf: -94, prof: [15, 19], and: [8, 11], larg: [28, 42], gap: [9, 15], loja: false},
  {zf: -132, prof: [17, 22], and: [10, 13], larg: [32, 48], gap: [10, 18], loja: false},
  {zf: -180, prof: [18, 24], and: [11, 16], larg: [36, 54], gap: [12, 22], loja: false},
];
const noCorredor = (x0: number, x1: number) => x1 > XS - MEIA - 0.5 && x0 < XS + MEIA + 0.5;
const gerarAlas = (): Ala[] => {
  const alas: Ala[] = [];
  FILEIRAS.forEach((F, fi) => {
    const lim = 150 + fi * 70;
    let x = -lim + rnd(fi * 91 + 1) * 12, b = 0;
    while (x < lim && b < 200) {
      const s = (k: number) => rnd(fi * 1013 + b * 71 + k);
      const W = F.larg[0] + (F.larg[1] - F.larg[0]) * s(1);
      if (noCorredor(x, x + W)) { x = XS + MEIA + 1 + s(2) * 2; b++; continue; }
      const n = 2 + Math.floor(s(3) * 2.99);
      const base = Math.round(F.and[0] + (F.and[1] - F.and[0]) * s(4));
      const D = F.prof[0] + (F.prof[1] - F.prof[0]) * s(5);
      const zf = F.zf - s(6) * 4;
      let wx = x;
      for (let k = 0; k < n; k++) {
        const ww = (W / n) * (0.85 + s(10 + k) * 0.3);
        if (noCorredor(wx, wx + ww)) break;
        const centro = 1 - Math.abs((k + 0.5) / n - 0.5) * 2;
        const and = Math.max(3, base - 2 + Math.round(centro * 2.5 + s(20 + k) * 1.4));
        const dz = (k % 2 ? -3.2 : 0) - s(30 + k) * 1.2;
        alas.push({x0: wx, x1: wx + ww, z0: zf + dz - D, z1: zf + dz, and, recuo: s(40 + k) < 0.55 ? 1 + Math.floor(s(50 + k) * 2) : 0,
          loja: F.loja, sem: fi * 100 + b * 7 + k, varanda: fi < 3 && s(70) < 0.8, fileira: fi});
        wx += ww;
      }
      x = wx + F.gap[0] + (F.gap[1] - F.gap[0]) * s(80);
      b++;
    }
  });
  return alas;
};

// paredes com coordenada de fachada (aU = metros ao longo da face) e info (semente, tipo)
class Paredes {
  p: number[] = []; n: number[] = []; u: number[] = []; info: number[] = [];
  quad(a: V3, b: V3, c: V3, d: V3, nr: V3, u0: number, u1: number, inf: number[]) {
    const vs = [a, b, c, a, c, d], us = [u0, u1, u1, u0, u1, u0];
    vs.forEach((v, k) => { this.p.push(...v); this.n.push(...nr); this.u.push(us[k]); this.info.push(...inf); });
  }
  caixa(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, inf: number[]) {
    const w = x1 - x0, d = z1 - z0;
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], 0, w, inf);
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], 0, w, inf);
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], 0, d, inf);
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], 0, d, inf);
    this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], 0, w, [inf[0], 0, 0, 0]);
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('aU', new THREE.Float32BufferAttribute(this.u, 1));
    g.setAttribute('aInfo', new THREE.Float32BufferAttribute(this.info, 4));
    g.computeBoundingSphere();
    return g;
  }
}
// telhado de quatro aguas com beiral (uv em metros/2,5: u ao longo do beiral, v subindo a agua)
class Telhados {
  p: number[] = []; n: number[] = []; uv: number[] = [];
  tri(a: V3, b: V3, c: V3, e0: V3, e1: V3) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), C = new THREE.Vector3(...c);
    const nr = B.clone().sub(A).cross(C.clone().sub(A)).normalize();
    const E0 = new THREE.Vector3(...e0), e = new THREE.Vector3(...e1).sub(E0).normalize(), up = nr.clone().cross(e).normalize();
    [A, B, C].forEach((P) => { this.p.push(P.x, P.y, P.z); this.n.push(nr.x, nr.y, nr.z); const q = P.clone().sub(E0); this.uv.push(q.dot(e) / 2.5, q.dot(up) / 2.5); });
  }
  quad(a: V3, b: V3, c: V3, d: V3) { this.tri(a, b, c, a, b); this.tri(a, c, d, a, b); }
  telhado(x0: number, x1: number, z0: number, z1: number, y0: number, ov = 0.8, incl = 0.42) {
    const X0 = x0 - ov, X1 = x1 + ov, Z0 = z0 - ov, Z1 = z1 + ov, W = X1 - X0, D = Z1 - Z0, yb = y0 - 0.12;
    const h = (Math.min(W, D) / 2) * Math.tan(incl), zc = (Z0 + Z1) / 2, xc = (X0 + X1) / 2;
    if (W >= D) {
      const r1: V3 = [X0 + D / 2, yb + h, zc], r2: V3 = [X1 - D / 2, yb + h, zc];
      this.quad([X0, yb, Z1], [X1, yb, Z1], r2, r1);
      this.quad([X1, yb, Z0], [X0, yb, Z0], r1, r2);
      this.tri([X0, yb, Z0], [X0, yb, Z1], r1, [X0, yb, Z0], [X0, yb, Z1]);
      this.tri([X1, yb, Z1], [X1, yb, Z0], r2, [X1, yb, Z1], [X1, yb, Z0]);
    } else {
      const r1: V3 = [xc, yb + h, Z0 + W / 2], r2: V3 = [xc, yb + h, Z1 - W / 2];
      this.quad([X1, yb, Z1], [X1, yb, Z0], r1, r2);
      this.quad([X0, yb, Z0], [X0, yb, Z1], r2, r1);
      this.tri([X0, yb, Z1], [X1, yb, Z1], r2, [X0, yb, Z1], [X1, yb, Z1]);
      this.tri([X1, yb, Z0], [X0, yb, Z0], r1, [X1, yb, Z0], [X0, yb, Z0]);
    }
    this.quad([X0, yb, Z0], [X1, yb, Z0], [X1, yb, Z1], [X0, yb, Z1]);   // forro do beiral (face para baixo)
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.computeBoundingSphere();
    return g;
  }
}
const caixaEm = (sx: number, sy: number, sz: number, x: number, y: number, z: number) => new THREE.BoxGeometry(sx, sy, sz).translate(x, y, z);

const LOJAS: [string, string, string][] = [
  ['FARMACIA', '#1e8f4e', '#ffffff'], ['PANADERÍA LA ESPIGA', '#b8322a', '#fff4d6'], ['CEVICHERÍA EL MANABA', '#1f6fb2', '#ffffff'],
  ['HOTEL MAR AZUL', '#22313f', '#f5d76e'], ['HELADERÍA COCO LOCO', '#d63c86', '#ffffff'], ['MINIMARKET LA COSTA', '#f0a020', '#222222'],
  ['MARISQUERÍA DON LUCHO', '#138a72', '#ffffff'], ['ARTESANÍAS DEL PACÍFICO', '#7b3fa0', '#ffffff'], ['CAMBIO · RECARGAS', '#cf5a12', '#ffffff'],
  ['HOSTAL LAS OLAS', '#2d4f8a', '#ffffff'], ['PIZZERÍA BAHÍA', '#a3201c', '#ffe9b0'], ['CAFÉ MALECÓN', '#4a2f1f', '#f3e1c0'],
];

const FACH_DECL = `
uniform float uTc; uniform vec3 uCeuH; uniform vec3 uCeuZ; uniform float uPreench;
varying float vU; varying vec4 vInfo; varying vec3 vPl; varying vec3 vMw; varying vec3 vNw;
float fh(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float fx(float x, float a, float b, float w){ return smoothstep(a - w, a + w, x) - smoothstep(b - w, b + w, x); }`;
const FACH_COR = `#include <color_fragment>
float f_tipo = vInfo.y, f_sem = vInfo.x;
float f_jan = 0.0, f_mold = 0.0, f_aceso = 0.0, f_loja = 0.0;
vec2 f_id = vec2(0.0);
float f_hb = fh(vec2(f_sem, 3.1));
vec3 f_par = mix(vec3(0.93, 0.915, 0.885), vec3(0.97, 0.955, 0.92), f_hb);
f_par = mix(f_par, vec3(0.96, 0.87, 0.78), step(0.88, f_hb));
if (f_tipo > 0.5) {
  float y = vPl.y;
  if (y < 4.0) {
    float cu = vU / 4.2; float cx = fract(cu); vec2 w = fwidth(vec2(cu, y)) + 1e-4;
    float vit = fx(cx, 0.07, 0.93, w.x) * fx(y, 0.3, 3.3, w.y);
    float ehLoja = step(1.5, f_tipo);
    f_loja = vit * ehLoja;
    f_jan = vit * max(ehLoja, step(0.55, fh(vec2(floor(cu), f_sem))));
    f_mold = (fx(cx, 0.04, 0.96, w.x) * fx(y, 0.2, 3.4, w.y) - vit) * ehLoja;
    f_id = vec2(floor(cu), -1.0);
  } else {
    float fa = (y - 4.0) / 3.0; float fy = fract(fa);
    float larg = mix(2.6, 3.3, fh(vec2(f_sem, 7.7)));
    float cu = vU / larg; float cx = fract(cu);
    vec2 w = fwidth(vec2(cu, fa)) + 1e-4;
    float alta = step(0.5, fh(vec2(f_sem, 9.9)));
    float y0 = mix(0.30, 0.07, alta), y1 = 0.84;
    f_jan = fx(cx, 0.16, 0.84, w.x) * fx(fy, y0, y1, w.y);
    f_mold = fx(cx, 0.12, 0.88, w.x) * fx(fy, y0 - 0.04, y1 + 0.04, w.y) - f_jan;
    f_jan *= 1.0 - fx(cx, 0.492, 0.508, w.x) * 0.85;
    float laje = 1.0 - smoothstep(0.0, 0.05 + w.y, fy);
    f_par *= 1.0 - 0.10 * laje;
    f_id = vec2(floor(cu), floor(fa));
  }
  float longe = smoothstep(0.3, 0.9, max(fwidth(vU / 2.8), fwidth(vPl.y / 3.0)));
  f_jan = mix(f_jan, 0.36, longe); f_mold *= 1.0 - longe;
  float hL = fh(f_id + f_sem * 13.7), hT = fh(f_id * 1.31 + vec2(f_sem * 5.1, 2.0));
  float lig = step(hL, 0.58) * step(uTc, 338.5 + hT * 15.0);
  float ligLoja = step(uTc, 349.5 + hT * 6.0);
  f_aceso = mix(lig, ligLoja, step(0.5, f_loja)) * f_jan;
  f_aceso = mix(f_aceso, f_jan * 0.55 * (1.0 - smoothstep(339.0, 353.0, uTc)), longe);
}
vec3 f_vid = mix(vec3(0.045, 0.06, 0.085), vec3(0.10, 0.12, 0.16), fh(f_id + 1.7));
vec3 f_base = mix(f_par, vec3(0.42, 0.40, 0.38), clamp(f_mold, 0.0, 1.0));
f_base = mix(f_base, f_vid, f_jan);
diffuseColor.rgb = f_base;`;
const FACH_EMI = `#include <emissivemap_fragment>
{
  vec3 V = normalize(cameraPosition - vMw); vec3 N = normalize(vNw); vec3 R = reflect(-V, N);
  float fr = 0.04 + 0.96 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  vec3 ceu = mix(uCeuH, uCeuZ, smoothstep(0.0, 0.6, R.y));
  totalEmissiveRadiance += ceu * (0.06 + fr * 0.9) * f_jan * (1.0 - f_aceso);
  vec3 qt = mix(vec3(1.0, 0.58, 0.26), vec3(1.0, 0.82, 0.55), step(0.55, fh(f_id + 3.1)));
  qt = mix(qt, vec3(0.70, 0.82, 1.0), step(0.9, fh(f_id + 5.3)));
  float cort = 0.45 + 0.55 * fh(f_id + 9.1);
  totalEmissiveRadiance += qt * f_aceso * mix(2.2 * cort, 3.0, step(0.5, f_loja));
  totalEmissiveRadiance += f_par * uCeuH * uPreench * (1.0 - f_jan);
}`;
type Uni = Record<string, {value: any}>;
const matFachada = (U: Uni) => {
  const m = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.86, metalness: 0});
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aU; attribute vec4 aInfo;\nvarying float vU; varying vec4 vInfo; varying vec3 vPl; varying vec3 vMw; varying vec3 vNw;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvU = aU; vInfo = aInfo; vPl = position; vMw = (modelMatrix * vec4(transformed, 1.0)).xyz; vNw = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + FACH_DECL)
      .replace('#include <color_fragment>', FACH_COR)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(0.86, 0.12, f_jan);')
      .replace('#include <emissivemap_fragment>', FACH_EMI);
  };
  m.customProgramCacheKey = () => 'calcadao_fachada_v1';
  return m;
};

// cores do ceu refletido nos vidros e luz de preenchimento das fachadas em contraluz (linear)
const KC: [number, V3, V3, number][] = [
  [338, [0.03, 0.04, 0.10], [0.01, 0.015, 0.05], 0.0],
  [343, [0.35, 0.25, 0.45], [0.10, 0.10, 0.25], 0.05],
  [347, [0.80, 0.62, 0.75], [0.30, 0.32, 0.55], 0.10],
  [352, [0.95, 0.85, 0.85], [0.40, 0.48, 0.70], 0.13],
  [357, [1.0, 0.92, 0.88], [0.42, 0.55, 0.78], 0.14],
];
const ceuVidro = (tl: number) => {
  let i = 0; while (i < KC.length - 2 && tl > KC[i + 1][0]) i++;
  const a = KC[i], b = KC[i + 1], u = smooth(a[0], b[0], tl);
  const L = (x: V3, y: V3) => new THREE.Color(x[0] + (y[0] - x[0]) * u, x[1] + (y[1] - x[1]) * u, x[2] + (y[2] - x[2]) * u);
  return {h: L(a[1], b[1]), z: L(a[2], b[2]), p: a[3] + (b[3] - a[3]) * u};
};

const Predios: React.FC<{tl: number; telha: Jogo}> = ({tl, telha}) => {
  const alas = useMemo(gerarAlas, []);
  const U = useMemo<Uni>(() => ({uTc: {value: 0}, uCeuH: {value: new THREE.Color()}, uCeuZ: {value: new THREE.Color()}, uPreench: {value: 0}}), []);
  const obj = useMemo(() => {
    const P = new Paredes(), T = new Telhados(), lajes: THREE.BufferGeometry[] = [], vidros: THREE.BufferGeometry[] = [], corrimao: THREE.BufferGeometry[] = [];
    const varandas = (x0: number, x1: number, zf: number, yBase: number, nAnd: number) => {
      const w = x1 - x0 - 0.4, cx = (x0 + x1) / 2;
      for (let f = 0; f < nAnd; f++) {
        const y = yBase + f * HA;
        lajes.push(caixaEm(w, 0.16, 1.0, cx, y - 0.08, zf + 0.5));
        vidros.push(caixaEm(w, 0.95, 0.03, cx, y + 0.475, zf + 0.985));
        corrimao.push(caixaEm(w, 0.05, 0.07, cx, y + 0.97, zf + 0.985));
        for (let xd = x0 + 0.2; xd <= x1 - 0.1; xd += 5.6) lajes.push(caixaEm(0.14, HA - 0.16, 1.0, xd, y + (HA - 0.16) / 2, zf + 0.5));
      }
    };
    for (const a of alas) {
      const tipo = a.loja && a.fileira === 0 ? 2 : 1, inf = [a.sem, tipo, 0, 0];
      const andBaixo = a.and - a.recuo, yTopo = H0 + a.and * HA, yMeio = H0 + andBaixo * HA;
      P.caixa(a.x0, a.x1, 0, yMeio, a.z0, a.z1, inf);
      let zTopo = a.z1;
      if (a.recuo > 0) { zTopo = a.z1 - RECUO; P.caixa(a.x0 + 0.3, a.x1 - 0.3, yMeio, yTopo, a.z0, zTopo, inf); }
      T.telhado(a.recuo > 0 ? a.x0 + 0.3 : a.x0, a.recuo > 0 ? a.x1 - 0.3 : a.x1, a.z0, zTopo, yTopo);
      if (a.varanda) {
        varandas(a.x0, a.x1, a.z1, H0, andBaixo);
        if (a.recuo > 0) {
          // terraco do recuo: guarda-corpo de vidro na borda + varandas dos andares de cima
          vidros.push(caixaEm(a.x1 - a.x0 - 0.2, 0.95, 0.03, (a.x0 + a.x1) / 2, yMeio + 0.475, a.z1 - 0.1));
          corrimao.push(caixaEm(a.x1 - a.x0 - 0.2, 0.05, 0.07, (a.x0 + a.x1) / 2, yMeio + 0.97, a.z1 - 0.1));
          varandas(a.x0 + 0.3, a.x1 - 0.3, zTopo, yMeio + HA, a.recuo - 1);
        }
      }
    }
    const U2 = U;
    const paredes = new THREE.Mesh(P.geo(), matFachada(U2)); paredes.castShadow = true; paredes.receiveShadow = true;
    const matT = matPBR(telha, 1, 1, 1, new THREE.Color(0.62, 0.47, 0.40), {roughness: 1}); matT.side = THREE.DoubleSide;
    const telhados = new THREE.Mesh(T.geo(), matT); telhados.castShadow = true; telhados.receiveShadow = true;
    const mLaje = new THREE.Mesh(mergeGeometries(lajes), new THREE.MeshStandardMaterial({color: '#f1efea', roughness: 0.8})); mLaje.castShadow = true; mLaje.receiveShadow = true;
    const mVidro = new THREE.Mesh(mergeGeometries(vidros), new THREE.MeshStandardMaterial({color: '#bcd3df', roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.38, depthWrite: false}));
    const mCorr = new THREE.Mesh(mergeGeometries(corrimao), new THREE.MeshStandardMaterial({color: '#d8dadc', roughness: 0.35, metalness: 0.6}));
    // letreiros das lojas (fileira da frente, sob a marquise das varandas)
    const placas: THREE.Mesh[] = [];
    let k = 0;
    for (const a of alas) {
      if (!(a.loja && a.fileira === 0) || rnd(a.sem * 3.7) < 0.25) continue;
      const [txt, fundo, cor] = LOJAS[k++ % LOJAS.length];
      const tx = placa(txt, fundo, cor);
      const w = Math.min(a.x1 - a.x0 - 1.4, 6.8);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 160 / 1024), new THREE.MeshStandardMaterial({map: tx, emissiveMap: tx, emissive: '#ffffff', emissiveIntensity: 0.3, roughness: 0.5}));
      m.position.set((a.x0 + a.x1) / 2, 3.42, a.z1 + 0.04);
      placas.push(m);
    }
    return {paredes, telhados, mLaje, mVidro, mCorr, placas};
  }, [alas, U, telha]);
  const c = ceuVidro(tl);
  U.uTc.value = tl; U.uCeuH.value.copy(c.h); U.uCeuZ.value.copy(c.z); U.uPreench.value = c.p;
  const luzPlaca = 0.25 + 1.1 * noiteDe(tl);
  obj.placas.forEach((m) => { (m.material as THREE.MeshStandardMaterial).emissiveIntensity = luzPlaca; });
  return (
    <group>
      <primitive object={obj.paredes} />
      <primitive object={obj.telhados} />
      <primitive object={obj.mLaje} />
      <primitive object={obj.mCorr} />
      <primitive object={obj.mVidro} />
      {obj.placas.map((m, i) => <primitive key={i} object={m} />)}
    </group>
  );
};

// ---------------------------------------------------------------- chao: praca, avenida, calcadas, rua transversal, faixas
const plano = (L: number, P: number, x: number, y: number, z: number, m: THREE.Material) => {
  const me = new THREE.Mesh(new THREE.PlaneGeometry(L, P).rotateX(-Math.PI / 2), m); me.position.set(x, y, z); me.receiveShadow = true; return me;
};
const Chao: React.FC<{j: ReturnType<typeof useJogos>}> = ({j}) => {
  const objs = useMemo(() => {
    const out: THREE.Object3D[] = [];
    const cPraca = new THREE.Color(1.3, 1.28, 1.3);
    out.push(plano(260, 60, 0, 0, 15, matPBR(j.granito, 260, 60, 2.6, cPraca)));
    out.push(plano(420, Z_AV0 - Z_AV1, 0, Y_RUA, (Z_AV0 + Z_AV1) / 2, matPBR(j.asfalto, 420, Z_AV0 - Z_AV1, 4.2, new THREE.Color(0.85, 0.85, 0.9))));
    const calcEsq = 210 + XS - 6, calcDir = 210 - XS - 6;
    out.push(plano(calcEsq, Z_AV1 - Z_CALC2, -210 + calcEsq / 2, 0, (Z_AV1 + Z_CALC2) / 2, matPBR(j.granito, calcEsq, 6.5, 2.6, cPraca)));
    out.push(plano(calcDir, Z_AV1 - Z_CALC2, 210 - calcDir / 2, 0, (Z_AV1 + Z_CALC2) / 2, matPBR(j.granito, calcDir, 6.5, 2.6, cPraca)));
    const LT = 1500;
    out.push(plano(12, LT, XS, Y_RUA, Z_AV1 - LT / 2, matPBR(j.asfalto, 12, LT, 4.2, new THREE.Color(0.85, 0.85, 0.9))));
    for (const sx of [-1, 1]) out.push(plano(2, 400, XS + sx * 7, 0, Z_CALC2 - 200, matPBR(j.granito, 2, 400, 2.6, cPraca)));
    out.push(plano(3000, 1500, 0, -0.2, Z_CALC2 - 750, matPBR(j.asfalto, 3000, 1500, 9, new THREE.Color(1.15, 1.12, 1.05))));
    // meios-fios
    const mf = new THREE.MeshStandardMaterial({color: '#d9d6cf', roughness: 0.85});
    const meioFio = (x0: number, x1: number, z: number, ax: 'x' | 'z') => {
      const L = x1 - x0, g = ax === 'x' ? new THREE.BoxGeometry(L, 0.18, 0.25) : new THREE.BoxGeometry(0.25, 0.18, L);
      const me = new THREE.Mesh(g, mf); if (ax === 'x') me.position.set((x0 + x1) / 2, -0.07, z); else me.position.set(z, -0.07, (x0 + x1) / 2);
      me.receiveShadow = true; return me;
    };
    out.push(meioFio(-130, 130, Z_AV0, 'x'));
    out.push(meioFio(-210, XS - 6, Z_AV1, 'x')); out.push(meioFio(XS + 6, 210, Z_AV1, 'x'));
    out.push(meioFio(-400, Z_AV1, XS - 6, 'z')); out.push(meioFio(-400, Z_AV1, XS + 6, 'z'));
    // faixas pintadas
    const branca = new THREE.MeshStandardMaterial({color: '#e8e6df', roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2});
    const amarela = new THREE.MeshStandardMaterial({color: '#e2b23a', roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2});
    const geoT = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const tracos: [number, number, number, number][] = [];   // x, z, L, P
    for (const z of [-18.5, -25.5]) for (let x = -200; x < 200; x += 9) if (Math.abs(x + 1.5 - XS) > 8) tracos.push([x + 1.5, z, 3, 0.14]);
    for (const zz of [-29.0]) for (let x = -200; x < 200; x += 20) if (Math.abs(x + 10 - XS) > 16) tracos.push([x + 10, zz, 19.6, 0.12]);
    for (let z = Z_AV0 - 0.8; z > Z_AV1 + 0.5; z -= 1.0) tracos.push([14, z, 4, 0.5]);                     // faixa de pedestres
    for (let z = Z_AV1 - 3; z > -400; z -= 9) tracos.push([XS, z - 1.5, 0.14, 3]);                      // eixo da transversal
    const imB = new THREE.InstancedMesh(geoT, branca, tracos.length), m4 = new THREE.Matrix4();
    tracos.forEach(([x, z, L, P], i) => { m4.makeScale(L, 1, P).setPosition(x, Y_RUA + 0.004, z); imB.setMatrixAt(i, m4); });
    imB.receiveShadow = true; out.push(imB);
    const amar: [number, number, number, number][] = [];
    for (const dz of [-0.13, 0.13]) { amar.push([-110 + (XS - 8) / 2 - 0, -22 + dz, 220 + (XS - 8), 0.1]); amar.push([(XS + 8 + 210) / 2, -22 + dz, 210 - XS - 8, 0.1]); }
    const imA = new THREE.InstancedMesh(geoT, amarela, amar.length);
    amar.forEach(([x, z, L, P], i) => { m4.makeScale(L, 1, P).setPosition(x, Y_RUA + 0.004, z); imA.setMatrixAt(i, m4); });
    imA.receiveShadow = true; out.push(imA);
    return out;
  }, [j]);
  return <>{objs.map((o, i) => <primitive key={i} object={o} />)}</>;
};

// ---------------------------------------------------------------- postes de luz
type PosteDef = [number, number, number];   // x, z, ry (o braco aponta para +x local girado de ry)
const POSTES: PosteDef[] = [
  ...[-46, -30, -14, 10, 26, 42].map((x) => [x, -13.8, Math.PI / 2] as PosteDef),
  [-10, -5.2, 0], [19, -4.6, Math.PI],
  ...[-42, -24, 20, 38].map((x) => [x, -33.2, -Math.PI / 2] as PosteDef),
  ...[-48, -78, -108, -138].flatMap((z) => [[XS - 6.6, z, 0], [XS + 6.6, z - 15, Math.PI]] as PosteDef[]),
];
const BRACO = 1.25, Y_LAMP = 6.0;
const pontoLampada = (p: PosteDef): V3 => [p[0] + Math.cos(p[2]) * BRACO, Y_LAMP - 0.05, p[1] - Math.sin(p[2]) * BRACO];
const Postes: React.FC<{tl: number}> = ({tl}) => {
  const obj = useMemo(() => {
    const metal = mergeGeometries([
      new THREE.CylinderGeometry(0.2, 0.24, 0.5, 12).translate(0, 0.25, 0),
      new THREE.CylinderGeometry(0.06, 0.1, Y_LAMP + 0.1, 10).translate(0, (Y_LAMP + 0.1) / 2, 0),
      new THREE.CylinderGeometry(0.035, 0.035, BRACO, 6).rotateZ(Math.PI / 2).translate(BRACO / 2, Y_LAMP + 0.05, 0),
      new THREE.BoxGeometry(0.62, 0.14, 0.34).translate(BRACO, Y_LAMP + 0.06, 0),
    ]);
    const vidro = new THREE.BoxGeometry(0.52, 0.05, 0.26).translate(BRACO, Y_LAMP - 0.02, 0);
    const mMetal = new THREE.MeshStandardMaterial({color: '#3b3f44', roughness: 0.45, metalness: 0.7});
    const mVidro = new THREE.MeshStandardMaterial({color: '#fff1d6', emissive: '#ffd9a0', emissiveIntensity: 6, roughness: 0.3});
    const imM = new THREE.InstancedMesh(metal, mMetal, POSTES.length), imV = new THREE.InstancedMesh(vidro, mVidro, POSTES.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), um = new THREE.Vector3(1, 1, 1);
    POSTES.forEach((p, i) => { q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p[2]); m4.compose(new THREE.Vector3(p[0], 0, p[1]), q, um); imM.setMatrixAt(i, m4); imV.setMatrixAt(i, m4); });
    imM.castShadow = true;
    // poca de luz no chao (decalque aditivo)
    const tex = radial();
    const mPoca = new THREE.MeshBasicMaterial({map: tex, color: '#ffc983', transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -4});
    const imP = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), mPoca, POSTES.length);
    POSTES.forEach((p, i) => { const l = pontoLampada(p); const y = Math.abs(p[1] + 23) < 9 ? Y_RUA + 0.02 : 0.02; m4.makeScale(11, 1, 11).setPosition(l[0], y, l[2]); imP.setMatrixAt(i, m4); });
    return {imM, imV, imP, mVidro, mPoca};
  }, []);
  const ps = posteDe(tl), nt = noiteDe(tl);
  obj.mVidro.emissiveIntensity = 1 + 7 * ps;
  obj.mPoca.opacity = 0.42 * ps * (0.25 + 0.75 * nt);
  return <><primitive object={obj.imM} /><primitive object={obj.imV} /><primitive object={obj.imP} /></>;
};
// luzes de verdade dos postes mais perto da camera (iluminam pessoas, bancos e chao)
const POSTES_LUZ = [2, 3, 6, 7];

// ---------------------------------------------------------------- mobiliario: bancos, lixeiras, floreiras, ponto de onibus, placas
const BANCOS = [-36, -26, -20, 16, 30, 36];
const FLOREIRAS: [number, number][] = [[-27, -6.5], [4.8, -12.4], [24, -9.5]];
const Mobiliario: React.FC = () => {
  const objs = useMemo(() => {
    const out: THREE.Object3D[] = [];
    const madeira = new THREE.MeshStandardMaterial({color: '#8a5a35', roughness: 0.7});
    const ferro = new THREE.MeshStandardMaterial({color: '#2e3236', roughness: 0.5, metalness: 0.6});
    const gMad = mergeGeometries([0, 1, 2].map((k) => new THREE.BoxGeometry(1.9, 0.05, 0.12).translate(0, 0.46, -0.2 + k * 0.14))
      .concat([0, 1].map((k) => new THREE.BoxGeometry(1.9, 0.12, 0.04).translate(0, 0.62 + k * 0.17, -0.3))));
    const gFer = mergeGeometries([-0.8, 0.8].flatMap((x) => [new THREE.BoxGeometry(0.06, 0.44, 0.48).translate(x, 0.22, -0.06), new THREE.BoxGeometry(0.05, 0.5, 0.05).translate(x, 0.65, -0.32)]));
    const imMad = new THREE.InstancedMesh(gMad, madeira, BANCOS.length), imFer = new THREE.InstancedMesh(gFer, ferro, BANCOS.length);
    const m4 = new THREE.Matrix4();
    BANCOS.forEach((x, i) => { m4.makeTranslation(x, 0, -11.6); imMad.setMatrixAt(i, m4); imFer.setMatrixAt(i, m4); });
    imMad.castShadow = imFer.castShadow = true; out.push(imMad, imFer);
    const lixo = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.24, 0.22, 0.85, 14).translate(0, 0.425, 0), new THREE.MeshStandardMaterial({color: '#1f6b46', roughness: 0.5, metalness: 0.3}), BANCOS.length);
    BANCOS.forEach((x, i) => { m4.makeTranslation(x + 1.45, 0, -11.7); lixo.setMatrixAt(i, m4); });
    lixo.castShadow = true; out.push(lixo);
    // floreiras com arbustos (esfera deformada por semente)
    const vaso = new THREE.MeshStandardMaterial({color: '#cfc8bb', roughness: 0.9});
    const folhagem = new THREE.MeshStandardMaterial({color: '#3f6b2c', roughness: 0.85, flatShading: true});
    FLOREIRAS.forEach(([x, z], i) => {
      const v = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.05, 0.6, 28), vaso); v.position.set(x, 0.3, z); v.castShadow = v.receiveShadow = true; out.push(v);
      const g = new THREE.IcosahedronGeometry(0.95, 3), pa = g.attributes.position;
      for (let k = 0; k < pa.count; k++) { const s = 0.82 + 0.3 * rnd(i * 977 + Math.round(pa.getX(k) * 40) * 31 + Math.round(pa.getY(k) * 40) * 7 + Math.round(pa.getZ(k) * 40)); pa.setXYZ(k, pa.getX(k) * s, pa.getY(k) * s * 0.8, pa.getZ(k) * s); }
      g.computeVertexNormals();
      const a = new THREE.Mesh(g, folhagem); a.position.set(x, 1.0, z); a.castShadow = true; out.push(a);
    });
    // ponto de onibus
    const vidroP = new THREE.MeshStandardMaterial({color: '#cfe3ee', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.3, depthWrite: false});
    const estr = new THREE.MeshStandardMaterial({color: '#7f8890', roughness: 0.4, metalness: 0.7});
    const ponto = new THREE.Group(); ponto.position.set(-6.4, 0, -14.1);
    for (const x of [-1.9, 1.9]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.6, 0.08), estr); c.position.set(x, 1.3, 0.55); ponto.add(c); }
    const teto = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.1, 1.6), estr); teto.position.set(0, 2.65, 0); teto.castShadow = true; ponto.add(teto);
    const fundo = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.0, 0.03), vidroP); fundo.position.set(0, 1.3, 0.6); ponto.add(fundo);
    const banco = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 0.4), estr); banco.position.set(0, 0.48, 0.35); ponto.add(banco);
    const txP = placa('PARADA DE BUS', '#1d4f91', '#ffffff', 1024, 160);
    const sinal = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.42, 0.06), [estr, estr, estr, estr, new THREE.MeshStandardMaterial({map: txP, emissiveMap: txP, emissive: '#fff', emissiveIntensity: 0.4}), new THREE.MeshStandardMaterial({map: txP})]);
    sinal.position.set(0, 2.95, 0.4); ponto.add(sinal);
    out.push(ponto);
    // placa de rua (verde) na esquina da faixa de pedestres
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.2, 8), estr); poste.position.set(16.6, 1.6, -14.2); out.push(poste);
    const tx1 = placa('Av. Malecón', '#1b6e3a', '#ffffff', 1024, 200), tx2 = placa('Calle Principal', '#1b6e3a', '#ffffff', 1024, 200);
    const p1 = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.27), new THREE.MeshStandardMaterial({map: tx1, side: THREE.DoubleSide, roughness: 0.4}));
    p1.position.set(16.6, 3.0, -14.18); out.push(p1);
    const p2 = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.27), new THREE.MeshStandardMaterial({map: tx2, side: THREE.DoubleSide, roughness: 0.4}));
    p2.position.set(16.6, 2.68, -14.2); p2.rotation.y = Math.PI / 2; out.push(p2);
    // placa de boas-vindas no canteiro da transversal
    const txB = placa('BIENVENIDOS A ATACAMES · ESMERALDAS', '#0f5f7a', '#ffffff', 2048, 200);
    const boas = new THREE.Mesh(new THREE.PlaneGeometry(9, 0.88), new THREE.MeshStandardMaterial({map: txB, emissiveMap: txB, emissive: '#fff', emissiveIntensity: 0.6, side: THREE.DoubleSide}));
    boas.position.set(XS, 5.6, -40); out.push(boas);
    for (const sx of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.18, 6.1, 0.18), estr); c.position.set(XS + sx * 4.6, 3.0, -40); out.push(c); }
    return out;
  }, []);
  return <>{objs.map((o, i) => <primitive key={i} object={o} />)}</>;
};

// ---------------------------------------------------------------- letras coloridas "ATACAMES" na praca
const LETRAS_X0 = -24.5, LETRAS_Z = -8.8;
const CORES_LETRAS = ['#e5383b', '#f39c12', '#f1c40f', '#27ae60', '#2e86de', '#8e44ad', '#e84393', '#16a085'];
const Letreiro: React.FC = () => {
  const fonte = useLoader(FontLoader, staticFile('calcadao/droid_sans_bold.typeface.json')) as Font;
  const grupo = useMemo(() => {
    const g = new THREE.Group(); let x = 0;
    'ATACAMES'.split('').forEach((ch, i) => {
      const geo = new TextGeometry(ch, {font: fonte, size: 1.5, depth: 0.42, curveSegments: 6, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 2});
      geo.computeBoundingBox(); const bb = geo.boundingBox!;
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({color: CORES_LETRAS[i % CORES_LETRAS.length], roughness: 0.35, metalness: 0.05}));
      m.position.set(x - bb.min.x, 0.12, -0.21); m.castShadow = true; m.receiveShadow = true; g.add(m);
      x += bb.max.x - bb.min.x + 0.12;
    });
    const base = new THREE.Mesh(new THREE.BoxGeometry(x + 0.6, 0.12, 0.9), new THREE.MeshStandardMaterial({color: '#e9e6df', roughness: 0.8}));
    base.position.set(x / 2 - 0.06, 0.06, 0); base.receiveShadow = true; g.add(base);
    g.position.set(LETRAS_X0, 0, LETRAS_Z); g.rotation.y = 0.12;
    return g;
  }, [fonte]);
  return <primitive object={grupo} />;
};

// ---------------------------------------------------------------- fonte (jatos balisticos em t)
const FONTE_C: [number, number] = [10.5, -6.6], R_FONTE = 3.2;
const N_CENTRO = 90, N_ANEL = 8, N_GOTA = 34;
const Fonte: React.FC<{tm: number}> = ({tm}) => {
  const obj = useMemo(() => {
    const g = new THREE.Group(); g.position.set(FONTE_C[0], 0, FONTE_C[1]);
    const pedra = new THREE.MeshStandardMaterial({color: '#d8d2c6', roughness: 0.8});
    const perfil = [[0, 0.04], [R_FONTE - 0.25, 0.04], [R_FONTE - 0.25, 0.48], [R_FONTE - 0.05, 0.55], [R_FONTE + 0.25, 0.55], [R_FONTE + 0.3, 0.45], [R_FONTE + 0.3, 0]].map(([r, y]) => new THREE.Vector2(r, y));
    const bacia = new THREE.Mesh(new THREE.LatheGeometry(perfil, 64), pedra); bacia.castShadow = bacia.receiveShadow = true; g.add(bacia);
    const fundo = new THREE.Mesh(new THREE.CircleGeometry(R_FONTE - 0.25, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({color: '#2b7fc0', roughness: 0.6}));
    fundo.position.y = 0.06; g.add(fundo);
    const agua = new THREE.Mesh(new THREE.CircleGeometry(R_FONTE - 0.25, 48).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({color: '#5fb6e0', roughness: 0.04, metalness: 0.2, transparent: true, opacity: 0.62, emissive: '#1b5e86', emissiveIntensity: 0.25}));
    agua.position.y = 0.4; g.add(agua);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.62, 1.0, 24), pedra); ped.position.y = 0.5; ped.castShadow = true; g.add(ped);
    const taca = new THREE.Mesh(new THREE.LatheGeometry([[0.2, 0], [1.0, 0.28], [1.08, 0.36], [0.98, 0.36], [0.2, 0.12]].map(([r, y]) => new THREE.Vector2(r, y)), 40), pedra);
    taca.position.y = 1.0; taca.castShadow = true; g.add(taca);
    const gotaMat = new THREE.MeshStandardMaterial({color: '#e8f6ff', emissive: '#a8d8f5', emissiveIntensity: 0.35, roughness: 0.1, transparent: true, opacity: 0.72, depthWrite: false});
    const N = N_CENTRO + N_ANEL * N_GOTA;
    const gotas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 8, 6), gotaMat, N); gotas.frustumCulled = false; g.add(gotas);
    // espuma onde a agua cai
    const esp = new THREE.Mesh(new THREE.RingGeometry(0.2, 1.6, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({map: radial(), color: '#ffffff', transparent: true, opacity: 0.35, depthWrite: false}));
    esp.position.y = 0.42; g.add(esp);
    return {g, gotas};
  }, []);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), G = 9.81;
  // jato central: sobe ~3 m acima da taca
  const v0 = 7.6, T0 = (2 * v0) / G;
  for (let j = 0; j < N_CENTRO; j++) {
    const ph = (((tm / T0 + j / N_CENTRO + rnd(j) * 0.02) % 1) + 1) % 1, tau = ph * T0;
    const vx = (rnd(j + 11) - 0.5) * 0.5, vz = (rnd(j + 23) - 0.5) * 0.5;
    p.set(vx * tau, 1.4 + v0 * tau - 0.5 * G * tau * tau, vz * tau);
    const vy = v0 - G * tau; sc.set(1, 1 + Math.min(2.5, Math.abs(vy) * 0.35), 1);
    m4.compose(p, q, sc); obj.gotas.setMatrixAt(j, m4);
  }
  // anel de jatos em arco para o centro
  for (let a = 0; a < N_ANEL; a++) {
    const ang = (a / N_ANEL) * Math.PI * 2, cx = Math.cos(ang), cz = Math.sin(ang), r0 = R_FONTE - 0.35;
    const vh = 1.45, vv = 4.0, Ta = 0.86;
    for (let j = 0; j < N_GOTA; j++) {
      const k = N_CENTRO + a * N_GOTA + j, ph = (((tm / Ta + j / N_GOTA + a * 0.13) % 1) + 1) % 1, tau = ph * Ta;
      const r = r0 - vh * tau; p.set(cx * r, 0.55 + vv * tau - 0.5 * G * tau * tau, cz * r);
      sc.set(1, 1 + Math.abs(vv - G * tau) * 0.3, 1);
      m4.compose(p, q, sc); obj.gotas.setMatrixAt(k, m4);
    }
  }
  obj.gotas.instanceMatrix.needsUpdate = true;
  return <primitive object={obj.g} />;
};

// ---------------------------------------------------------------- veiculos (carros, taxis, vans, onibus) em faixas, em t
type TipoV = 0 | 1 | 2 | 3;   // carro, taxi, van, onibus
type Veic = {tipo: TipoV; cor: string; faixa: number; x0: number; parado?: [number, number]};
const CORES_CARRO = ['#f2f2f0', '#c0262d', '#9aa1a8', '#16181c', '#1f4f9a', '#f2f2f0', '#6c7a85', '#8c1c1c'];
const gerarVeiculos = (): Veic[] => {
  const out: Veic[] = [];
  FAIXAS.forEach((_, f) => {
    for (let k = 0; k < 6; k++) {
      const s = (i: number) => rnd(4000 + f * 97 + k * 13 + i);
      const r = s(1), tipo: TipoV = r < 0.12 ? 3 : r < 0.36 ? 1 : r < 0.5 ? 2 : 0;
      out.push({tipo, cor: tipo === 1 ? '#f4c20d' : CORES_CARRO[Math.floor(s(2) * CORES_CARRO.length)], faixa: f, x0: k * 50 + s(3) * 16});
    }
  });
  [-62, -50, -38, 22, 34, 47, 60].forEach((x, i) => out.push({tipo: rnd(i + 900) < 0.25 ? 2 : 0, cor: CORES_CARRO[Math.floor(rnd(i + 950) * CORES_CARRO.length)], faixa: -1, x0: 0, parado: [x, -30.25]}));
  return out;
};
const formaDe = (pts: number[][]) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); return s; };
const extr = (pts: number[][], prof: number, bisel = 0) => {
  const g = new THREE.ExtrudeGeometry(formaDe(pts), {depth: prof, bevelEnabled: bisel > 0, bevelThickness: bisel, bevelSize: bisel * 0.7, bevelSegments: 2, curveSegments: 4});
  return g.translate(0, 0, -prof / 2);
};
// vidro numa agua inclinada (para-brisa / vigia): faixa fina afastada da carroceria
const vidroInclinado = (a: number[], b: number[], larg: number) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  let nx = -uy, ny = ux; if (ny < 0) { nx = -nx; ny = -ny; }
  const o = 0.06, e = 0.07;
  const A = [a[0] + ux * e + nx * o, a[1] + uy * e + ny * o], B = [b[0] - ux * e + nx * o, b[1] - uy * e + ny * o];
  return extr([A, B, [B[0] - nx * 0.03, B[1] - ny * 0.03], [A[0] - nx * 0.03, A[1] - ny * 0.03]], larg);
};
const PERFIS = {
  carro: {corpo: [[-2.2, 0.32], [2.2, 0.32], [2.26, 0.62], [2.12, 0.84], [1.05, 0.98], [0.42, 1.42], [-0.92, 1.44], [-1.45, 1.0], [-2.12, 0.95], [-2.26, 0.72]],
    lado: [[-1.36, 1.03], [1.0, 1.03], [0.42, 1.37], [-0.88, 1.39]], frente: [[1.05, 0.98], [0.42, 1.42]], tras: [[-0.92, 1.44], [-1.45, 1.0]], xF: 2.22, xT: -2.24, yF: 0.72, yT: 0.84, rodas: 1.35},
  van: {corpo: [[-2.4, 0.34], [2.4, 0.34], [2.46, 0.7], [2.25, 0.96], [1.55, 1.15], [1.0, 1.9], [-2.32, 1.95], [-2.46, 1.6]],
    lado: [[-2.1, 1.25], [1.25, 1.25], [0.95, 1.78], [-2.1, 1.8]], frente: [[1.55, 1.15], [1.0, 1.9]], tras: null as number[][] | null, xF: 2.42, xT: -2.44, yF: 0.78, yT: 1.2, rodas: 1.55},
};
const Veiculos: React.FC<{tm: number; tl: number}> = ({tm, tl}) => {
  const lista = useMemo(gerarVeiculos, []);
  const obj = useMemo(() => {
    const vidro = new THREE.MeshStandardMaterial({color: '#141c26', roughness: 0.06, metalness: 0.5});
    const pneu = new THREE.MeshStandardMaterial({color: '#141414', roughness: 0.85});
    const aro = new THREE.MeshStandardMaterial({color: '#9ea4aa', roughness: 0.3, metalness: 0.8});
    const farol = new THREE.MeshStandardMaterial({color: '#fff8ea', emissive: '#fff2d8', emissiveIntensity: 3});
    const lanterna = new THREE.MeshStandardMaterial({color: '#a01010', emissive: '#ff2a1a', emissiveIntensity: 2});
    const farolOff = new THREE.MeshStandardMaterial({color: '#e8e8e2', roughness: 0.2});
    const lanternaOff = new THREE.MeshStandardMaterial({color: '#7a1010', roughness: 0.3});
    const geo = {
      carro: {corpo: extr(PERFIS.carro.corpo, 1.68, 0.06), lado: extr(PERFIS.carro.lado, 1.83), fr: vidroInclinado(PERFIS.carro.frente[0], PERFIS.carro.frente[1], 1.56), tr: vidroInclinado(PERFIS.carro.tras[0], PERFIS.carro.tras[1], 1.56)},
      van: {corpo: extr(PERFIS.van.corpo, 1.78, 0.06), lado: extr(PERFIS.van.lado, 1.93), fr: vidroInclinado(PERFIS.van.frente[0], PERFIS.van.frente[1], 1.66), tr: null as THREE.BufferGeometry | null},
    };
    const roda = new THREE.CylinderGeometry(0.33, 0.33, 0.24, 18).rotateX(Math.PI / 2), calota = new THREE.CylinderGeometry(0.19, 0.19, 0.25, 12).rotateX(Math.PI / 2);
    const luz = new THREE.BoxGeometry(0.07, 0.14, 0.34);
    const matCor = new Map<string, THREE.MeshStandardMaterial>();
    const pintura = (c: string) => { if (!matCor.has(c)) matCor.set(c, new THREE.MeshStandardMaterial({color: c, roughness: 0.32, metalness: 0.25})); return matCor.get(c)!; };
    const txTaxi = placa('TAXI', '#111111', '#f4c20d', 256, 96, false);
    const mTaxi = new THREE.MeshStandardMaterial({map: txTaxi, emissiveMap: txTaxi, emissive: '#ffffff', emissiveIntensity: 0.8});
    const txBus = placa('ESMERALDAS', '#0b0b0b', '#ffa21a', 1024, 160, false);
    const mBus = new THREE.MeshStandardMaterial({map: txBus, emissiveMap: txBus, emissive: '#ffffff', emissiveIntensity: 1.6});
    const grupos = lista.map((v) => {
      const g = new THREE.Group(), off = !!v.parado;
      const add = (ge: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, sombra = true) => { const me = new THREE.Mesh(ge, m); me.position.set(x, y, z); me.castShadow = sombra; g.add(me); return me; };
      if (v.tipo === 3) {
        const branco = pintura('#f4f4f0');
        add(new RoundedBoxGeometry(11.6, 2.95, 2.5, 3, 0.2), branco, 0, 0.32 + 1.475, 0);
        add(new THREE.BoxGeometry(10.2, 0.95, 2.53), vidro, -0.5, 2.15, 0);
        add(new THREE.BoxGeometry(0.05, 1.35, 2.2), vidro, 5.81, 1.78, 0);
        add(new THREE.BoxGeometry(11.64, 0.3, 2.53), pintura(rnd(v.x0 * 7.1) < 0.5 ? '#1f8a4c' : '#c0262d'), 0, 1.15, 0);
        const sinal = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.33).rotateY(Math.PI / 2), mBus); sinal.position.set(5.84, 2.82, 0); g.add(sinal);
        for (const x of [-3.9, 3.7]) for (const z of [-1.08, 1.08]) { add(roda.clone().scale(1.45, 1.45, 1.1), pneu, x, 0.48, z); }
        for (const z of [-0.95, 0.95]) { add(luz, off ? farolOff : farol, 5.8, 0.75, z, false); add(luz, off ? lanternaOff : lanterna, -5.8, 0.9, z, false); }
        return g;
      }
      const P = v.tipo === 2 ? PERFIS.van : PERFIS.carro, G = v.tipo === 2 ? geo.van : geo.carro;
      add(G.corpo, pintura(v.cor));
      add(G.lado, vidro, 0, 0, 0, false); add(G.fr, vidro, 0, 0, 0, false); if (G.tr) add(G.tr, vidro, 0, 0, 0, false);
      for (const x of [-P.rodas, P.rodas]) for (const z of [-0.8, 0.8]) { add(roda, pneu, x, 0.33, z); add(calota, aro, x, 0.33, z, false); }
      for (const z of [-0.6, 0.6]) { add(luz, off ? farolOff : farol, P.xF, P.yF, z, false); add(luz, off ? lanternaOff : lanterna, P.xT, P.yT, z, false); }
      if (v.tipo === 1) {
        const s = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.95), [mTaxi, mTaxi, pintura('#f4c20d'), pintura('#f4c20d'), mTaxi, mTaxi]); s.position.set(-0.2, 1.53, 0); g.add(s);
      }
      return g;
    });
    return {grupos, farol, lanterna, mTaxi};
  }, [lista]);
  const ft = farolDe(tl);
  obj.farol.emissiveIntensity = 0.6 + 5 * ft; obj.lanterna.emissiveIntensity = 0.8 + 2.5 * ft; obj.mTaxi.emissiveIntensity = 0.3 + 0.8 * ft;
  lista.forEach((v, i) => {
    const g = obj.grupos[i];
    if (v.parado) { g.position.set(v.parado[0], Y_RUA, v.parado[1]); g.rotation.y = 0; return; }
    const F = FAIXAS[v.faixa], L = 300;
    const x = ((((v.x0 + F.dir * F.v * tm + 150) % L) + L) % L) - 150;
    g.position.set(x, Y_RUA, F.z); g.rotation.y = F.dir > 0 ? 0 : Math.PI;
  });
  return <>{obj.grupos.map((g, i) => <primitive key={i} object={g} />)}</>;
};

// ---------------------------------------------------------------- palmeiras (palmeiras.tsx, CC0)
const PALMEIRAS: PalmeiraItem[] = [
  {x: -1.2, z: -2.8, variante: 'reta', escala: 1.12, rot: 0.8},                                     // a palmeira do primeiro plano
  ...[-38, -22, 18, 34, 50].map((x, i) => ({x, z: -12.6, variante: (i % 2 ? 'reta' : 'curva') as PalmeiraItem['variante']})),
  {x: -9.5, z: -10.6, variante: 'dupla'}, {x: 15.2, z: -2.2, variante: 'dupla'}, {x: -16, z: -3.2, variante: 'reta'},
  ...[-48, -36, -20, -12, 14, 22, 32, 46, 58].map((x, i) => ({x, z: -36.4, variante: (['reta', 'curva', 'reta', 'dupla'] as const)[i % 4]})),
  ...[-62, -92, -122].flatMap((z) => [{x: XS - 6.8, z, variante: 'reta' as const}, {x: XS + 6.8, z: z - 6, variante: 'reta' as const}]),
  {x: -70, z: -57, variante: 'trio'}, {x: 40, z: -58, variante: 'duplaCurva'}, {x: -28, z: -86, variante: 'reta'}, {x: 30, z: -88, variante: 'curva'},
];

// ---------------------------------------------------------------- pedestres (Multidao3D, trajetos em formula fechada)
type Ped = {x0: number; z0: number; dx: number; dz: number; v: number; parado?: string; ry?: number; y?: number};
const T_REF = 343;
type Obst = {x: number; z: number; r: number} | {x0: number; x1: number; z0: number; z1: number};
const OBST: Obst[] = [
  {x0: LETRAS_X0 - 0.8, x1: LETRAS_X0 + 11.5, z0: LETRAS_Z - 1.6, z1: LETRAS_Z + 1.6},
  {x: FONTE_C[0], z: FONTE_C[1], r: R_FONTE + 0.9},
  ...FLOREIRAS.map(([x, z]) => ({x, z, r: 1.7})),
  ...BANCOS.map((x) => ({x0: x - 1.3, x1: x + 2.0, z0: -12.4, z1: -10.9})),
  {x0: -9, x1: -3.8, z0: -15, z1: -13.0},
  ...PALMEIRAS.filter((p) => p.z > -14).map((p) => ({x: p.x, z: p.z, r: 0.9})),
  ...POSTES.filter((p) => p[1] > -14).map((p) => ({x: p[0], z: p[1], r: 0.6})),
];
const livre = (x: number, z: number) => OBST.every((o) => ('r' in o ? Math.hypot(x - o.x, z - o.z) > o.r : x < o.x0 || x > o.x1 || z < o.z0 || z > o.z1));
const CAMISAS = ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71', '#9b59b6', '#e67e22', '#ecf0f1', '#1abc9c', '#e84393', '#34495e', '#f39c12', '#ffffff'];
const gerarPedestres = () => {
  const peds: Ped[] = [];
  // andando na praca: quase lateral (ate 20 graus), sem atravessar obstaculos nem a faixa da camera, em 329,5-357,5
  for (let i = 0; peds.length < 42 && i < 8000; i++) {
    const s = (k: number) => rnd(5000 + i * 17 + k);
    const ang = (s(1) < 0.5 ? 0 : Math.PI) + (s(2) - 0.5) * 0.7, dx = Math.cos(ang), dz = Math.sin(ang), v = 1.0 + s(3) * 0.5;
    const x0 = -36 + s(4) * 76, z0 = -13.3 + s(5) * 7.3;
    let ok = true;
    for (let tau = 329.5 - T_REF; tau <= 357.5 - T_REF && ok; tau += 0.5) {
      const x = x0 + dx * v * tau, z = z0 + dz * v * tau;
      if (z < -13.4 || z > -6.0 || !livre(x, z)) ok = false;
    }
    if (ok && peds.every((q) => q.parado || Math.hypot(q.x0 - x0, q.z0 - z0) > 1.0 || Math.abs(q.dx - dx) > 0.3)) peds.push({x0, z0, dx, dz, v});
  }
  // parados: pares conversando, alguem olhando as letras
  for (let i = 0, n = 0; n < 16 && i < 3000; i++) {
    const s = (k: number) => rnd(9000 + i * 23 + k);
    const x = -30 + s(1) * 56, z = -12.8 + s(2) * 6.6;
    if (!livre(x, z) || !livre(x + 0.9, z) || Math.abs(x - 1) < 3.5) continue;
    const ry = (s(3) - 0.5) * 2.2, fala = s(4) < 0.6;
    peds.push({x0: x, z0: z, dx: 0, dz: 0, v: 0, parado: fala ? 'Idle_Talking_Loop' : 'Idle_Loop', ry: Math.PI / 2 + ry * 0.3});
    peds.push({x0: x + 0.95, z0: z + 0.1, dx: 0, dz: 0, v: 0, parado: 'Idle_Loop', ry: -Math.PI / 2 + ry * 0.3});
    n += 2;
  }
  // calcada do outro lado da avenida
  for (let i = 0; i < 18; i++) {
    const s = (k: number) => rnd(7000 + i * 19 + k), dir = s(1) < 0.5 ? 1 : -1;
    peds.push({x0: -50 + s(2) * 100, z0: -33.0 - s(3) * 2.2, dx: dir, dz: 0, v: 1.05 + s(4) * 0.4});
  }
  return peds;
};
const Pedestres: React.FC<{tm: number}> = ({tm}) => {
  const peds = useMemo(gerarPedestres, []);
  const lista = useMemo<Pessoa3D[]>(() => peds.map((p, i) => ({i: 300 + i, x: p.x0, z: p.z0, rot: 0, pose: p.parado ? 'parado' : 'andando',
    camisa: CAMISAS[Math.floor(rnd(i * 5.3 + 1) * CAMISAS.length)], calca: ['#2c2f36', '#1f3f8f', '#d9cfb8', '#6b4a2f'][Math.floor(rnd(i * 3.1 + 2) * 4)], curta: rnd(i * 1.7) < 0.6})), [peds]);
  const estadoDe = useMemo(() => (p: Pessoa3D, k: number, t: number): Estado3D => {
    const d = peds[k];
    if (d.parado) return {x: d.x0, y: 0, z: d.z0, ry: d.ry ?? 0, clipe: d.parado, tempo: t + rnd(k) * 6};
    const s = d.v * (t - T_REF);
    return {x: d.x0 + d.dx * s, y: 0, z: d.z0 + d.dz * s, ry: Math.atan2(d.dx, d.dz), clipe: 'Walk_Loop', tempo: (s + 1000) / 1.45};
  }, [peds]);
  return <Multidao3D lista={lista} t={tm} de={[0, 0]} estadoDe={estadoDe} />;
};

// ---------------------------------------------------------------- mundo
export const Calcadao: React.FC<{t: number}> = ({t}) => {
  const tm = tMovCalcadao(t), tl = tLuzCalcadao(t);
  const {camera} = useThree();
  // o -z local aponta para o azimute do nascer do Sol (o mesmo ceu de ceu.tsx)
  const yaw = useMemo(() => { const s = solEm(350, 'ecuador'); return Math.hypot(s.x, s.z) < 1e-3 ? 0 : Math.atan2(-s.x, -s.z); }, []);
  const j = useJogos();
  const sol = useMemo(() => solEm(350, 'ecuador'), []);
  // camera
  const c = camLocal(tm), eixo = new THREE.Vector3(0, 1, 0);
  const pos = new THREE.Vector3(...c.pos).applyAxisAngle(eixo, yaw), alvo = new THREE.Vector3(...c.alvo).applyAxisAngle(eixo, yaw);
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(alvo);
  if (cam.fov !== c.fov || cam.near !== 0.15 || cam.far !== 5000) { cam.fov = c.fov; cam.near = 0.15; cam.far = 5000; cam.updateProjectionMatrix(); }
  const nt = noiteDe(tl), ps = posteDe(tl);
  return (
    <>
      <CeuLugar t={t} lugar="ecuador" sombra={70} />
      {/* brilho difuso da cidade a noite (preenche as sombras azuladas) */}
      <hemisphereLight args={['#4a5c96', '#2a2826', 0.3 * nt]} />
      <group rotation-y={yaw}>
        <Chao j={j} />
        <Predios tl={tl} telha={j.telha} />
        <Postes tl={tl} />
        {POSTES_LUZ.map((k) => { const l = pontoLampada(POSTES[k]); return <pointLight key={k} position={[l[0], l[1] - 0.3, l[2]]} color="#ffd29a" intensity={34 * ps * (0.25 + 0.75 * nt)} distance={30} decay={2} />; })}
        <Mobiliario />
        <Letreiro />
        <Fonte tm={tm} />
        <Veiculos tm={tm} tl={tl} />
        <Palmeiras lista={PALMEIRAS} t={tm} vento={0.8} sol={sol} corSol="#ffd8b0" />
        <Pedestres tm={tm} />
      </group>
    </>
  );
};

// look: nevoa com a cor do horizonte do ceu (degraus de 1 s so na transicao, para nao recompilar o compositor a cada quadro)
export const perfilCalcadao = (t: number): Perfil => {
  const tl = tLuzCalcadao(t);
  const q = Math.min(353, Math.max(338, Math.round(tl)));
  const nt = noiteDe(q);
  return {ao: true, bloom: 0.5 + 0.25 * nt, limiar: 0.85, nevoa: {cor: corHorizonte(q, 'ecuador'), densidade: 0.0032, max: 0.55},
    raios: q >= 345 ? 0.5 : 0, vinheta: 0.38, contraste: 0.05, saturacao: 0};
};
