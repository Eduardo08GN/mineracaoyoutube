// A rua do bairro (dono: agente Rua). Adaptacao cultural: rua residencial de bairro hispanico — casas de reboco em cores suaves,
// telhado de telha ceramica (ou laje com caixa d'agua preta), grades de ferro nas janelas, sacadas, muro baixo com portao,
// ponto de onibus "PARADA" e a placa "CALLE 12 DE OCTUBRE" no poste (12 de outubro: o dia em que tudo comeca).
// Enquadramento do original: voce de pe na calcada (olho em 0,1.7,0) olhando para -z; banco, muda e poste a esquerda,
// a rua a direita (+x) com as casas do outro lado. O skyline e do agente Cidade.
// Contrato: export const Rua: React.FC<{t}> e export const perfilRua(t): Perfil. Tudo funcao de t (segundo do ORIGINAL).
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {useTexture} from '@react-three/drei';
import {staticFile} from 'remotion';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {Perfil} from '../look/Look';
import {CeuTempo, corHorizonte, luzEm} from './ceu';
import {rnd, smooth, clamp01} from './comum';
import {decorrido} from '../tempo';
import {Multidao3D, Pessoa3D, Estado3D} from './pessoas';
import {ArvoreCrescendo, Floresta, ItemFloresta, estacao, florestaPerto, PresetEZ} from './arvores';

// ---------- planta da rua (metros) ----------
const CAL0 = -0.9, CAL1 = 1.5;            // calcada onde voce esta
const MEIO0 = 1.5, MEIO1 = 1.68;          // meio-fio
const PISTA0 = 1.68, PISTA1 = 10.68;      // asfalto (duas faixas)
const CAL2_0 = 10.68, CAL2_1 = 13.2;      // calcada do outro lado
const FRENTE = 16.5;                      // fachada das casas
const Z_PERTO = 90, Z_LONGE = -900;
const ALT_CAL = 0.14;
const POSTE: [number, number] = [-0.7, -10];     // base do poste principal
const LAMPADA = new THREE.Vector3(1.3, 5.05, -10);
const BANCO: [number, number] = [-2.6, -6.8];
const MUDA: [number, number, number] = [-10, 0, -13];   // longe e a esquerda: em 80-105 s nao cobre o skyline do centro
const FAIXA_PERTO = 3.9, FAIXA_LONGE = 8.4;      // centro das faixas (perto: vem para voce, +z; longe: vai, -z)

const fator = (t: number, a: number, b: number) => 1 - smooth(a, b, t);   // 1 -> 0 (some)
const nasce = (t: number, a: number, b: number) => smooth(a, b, t);       // 0 -> 1 (surge)
const T_FIM = 522;

// ---------- uniforms compartilhados (estacoes, neve, vento) ----------
const U = {uNeve: {value: 0}, uGrama: {value: new THREE.Color('#5d7f34')}, uTempo: {value: 0}, uNeveLuz: {value: 0}};
const NOISE = `
float rh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(rh(i), rh(i + vec2(1, 0)), f.x), mix(rh(i + vec2(0, 1)), rh(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ return 0.5 * vn(p) + 0.3 * vn(p * 2.03 + 7.1) + 0.2 * vn(p * 4.1 + 3.3); }`;
// modo: 'grama' recolore pela estacao; neveMax: teto da neve (asfalto/calcada ficam com menos); macro: quebra a repeticao
const injeta = (m: THREE.MeshStandardMaterial, modo: 'grama' | 'chao' | 'calcada' | 'telhado', neveMax = 1) => {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uNeve = U.uNeve; sh.uniforms.uGrama = U.uGrama; sh.uniforms.uNeveMax = {value: neveMax}; sh.uniforms.uNeveLuz = U.uNeveLuz;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <project_vertex>', `#include <project_vertex>
  #ifdef USE_INSTANCING
    vWP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
  #else
    vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;
  #endif`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec3 vWP; uniform float uNeve; uniform vec3 uGrama; uniform float uNeveMax; uniform float uNeveLuz;\n${NOISE}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
  float macro = fbm(vWP.xz * 0.045);
  ${modo === 'grama' ? `{ float l = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
    vec3 g = uGrama * clamp(0.35 + l * 2.6, 0.4, 1.7) * (0.8 + 0.4 * macro);
    diffuseColor.rgb = mix(diffuseColor.rgb, g, 0.82); }` : modo === 'calcada' ? `{ float l = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
    diffuseColor.rgb = mix(vec3(l) * vec3(1.0, 0.99, 0.96), diffuseColor.rgb, 0.25) * (0.92 + 0.16 * macro); }` : 'diffuseColor.rgb *= 0.9 + 0.2 * macro;'}
  float nz = fbm(vWP.xz * 0.16) * 0.85 + 0.15 * vn(vWP.xz * 2.3);
  float cobre = smoothstep(nz - 0.05, nz + 0.05, uNeve * uNeveMax * 1.3 - 0.15);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.92, 0.96) * (0.94 + 0.06 * nz), cobre);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.62, cobre);')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize(mix(normal, nonPerturbedNormal, cobre * 0.85));')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += cobre * uNeveLuz * vec3(0.86, 0.9, 0.97);');
  };
  m.customProgramCacheKey = () => 'rua_' + modo + neveMax;
  return m;
};

// ---------- geometria auxiliar ----------
// caixa alinhada aos eixos com UV em metros (tile) e cor por vertice (para fundir varias casas num so mesh)
type Balde = Record<string, THREE.BufferGeometry[]>;
const poe = (b: Balde, k: string, g: THREE.BufferGeometry) => { (b[k] = b[k] ?? []).push(g); };
const caixa = (b: Balde, k: string, cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, cor: THREE.ColorRepresentation = '#ffffff', tile = 2, rot?: THREE.Euler) => {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  // faces: +x,-x,+y,-y,+z,-z (4 vertices cada): largura x altura de cada face
  const dims = [[sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = f * 4 + v; uv.setXY(i, uv.getX(i) * dims[f][0] / tile, uv.getY(i) * dims[f][1] / tile); }
  if (rot) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(rot));
  g.translate(cx, cy, cz);
  pinta(g, cor);
  poe(b, k, g);
};
const pinta = (g: THREE.BufferGeometry, cor: THREE.ColorRepresentation) => {
  const c = new THREE.Color(cor), n = g.getAttribute('position').count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
};
// triangulos soltos com UV planar (para telhados)
const tris = (b: Balde, k: string, pts: number[][], uvDe: (p: number[]) => [number, number], cor: THREE.ColorRepresentation = '#ffffff') => {
  const pos: number[] = [], uvs: number[] = [];
  pts.forEach((p) => { pos.push(p[0], p[1], p[2]); const [u, v] = uvDe(p); uvs.push(u, v); });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.computeVertexNormals();
  pinta(g, cor);
  poe(b, k, g);
};
const cilindro = (b: Balde, k: string, x: number, y: number, z: number, r: number, h: number, cor: THREE.ColorRepresentation, rot?: THREE.Euler, seg = 12) => {
  const g = new THREE.CylinderGeometry(r, r, h, seg).toNonIndexed();
  if (rot) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(rot));
  g.translate(x, y, z); pinta(g, cor); poe(b, k, g);
};
const funde = (b: Balde) => Object.fromEntries(Object.entries(b).map(([k, gs]) => [k, mergeGeometries(gs.map((g) => (g.index ? g.toNonIndexed() : g)), false)!]));

// ---------- casas ----------
type Casa = {z: number; larg: number; fundo: number; andares: number; cor: string; telhado: 'quatro' | 'plano'; s: number; x0?: number};
const CORES = ['#efe1c2', '#f1cdb0', '#cfe1d6', '#d5e1ea', '#f0d89c', '#e9c6c1', '#f4efe4', '#e7d3b8', '#c9dbc0'];
const BRANCO = '#f3efe6';

// janela (ou porta) numa parede de normal -x (frente) ou +z (lado). u = posicao ao longo da parede, y = base
const janela = (b: Balde, frente: boolean, plano: number, u: number, y: number, w: number, h: number, luz: boolean, grade: boolean) => {
  // coordenadas: frente -> parede em x = plano, u ao longo de z; lado -> parede em z = plano, u ao longo de x
  const P = (du: number, dy: number, dn: number, su: number, sy: number, sn: number, k: string, cor: THREE.ColorRepresentation = '#ffffff') =>
    frente ? caixa(b, k, plano - dn, y + dy, u + du, sn, sy, su, cor, 1) : caixa(b, k, u + du, y + dy, plano + dn, su, sy, sn, cor, 1);
  P(0, h / 2, 0.01, w, h, 0.04, luz ? 'vidroLuz' : 'vidro');
  // moldura branca e peitoril
  P(0, h + 0.06, 0.03, w + 0.24, 0.12, 0.08, 'parede', BRANCO);
  P(-w / 2 - 0.06, h / 2, 0.03, 0.12, h, 0.08, 'parede', BRANCO);
  P(w / 2 + 0.06, h / 2, 0.03, 0.12, h, 0.08, 'parede', BRANCO);
  P(0, -0.04, 0.07, w + 0.3, 0.08, 0.16, 'parede', BRANCO);
  // grade de ferro (reja): barras verticais + 3 travessas, um pouco para fora da parede
  if (grade) {
    const n = Math.max(4, Math.round(w / 0.13));
    for (let i = 0; i <= n; i++) P(-w / 2 + (i * w) / n, h / 2, 0.11, 0.022, h + 0.05, 0.022, 'ferro');
    for (const fy of [0.08, 0.5, 0.92]) P(0, h * fy, 0.11, w + 0.04, 0.03, 0.03, 'ferro');
  }
};

const geraCasa = (b: Balde, c: Casa) => {
  const x0 = c.x0 ?? FRENTE, H = c.andares * 3.0 + 0.35, z0 = c.z - c.larg / 2, z1 = c.z + c.larg / 2, x1 = x0 + c.fundo;
  const s = (k: number) => rnd(c.s * 17.3 + k);
  // corpo, rodape mais escuro, cimalha branca
  caixa(b, 'parede', x0 + c.fundo / 2, H / 2, c.z, c.fundo, H, c.larg, c.cor, 2.5);
  const rod = new THREE.Color(c.cor).multiplyScalar(0.72);
  caixa(b, 'parede', x0 + c.fundo / 2, 0.22, c.z, c.fundo + 0.06, 0.44, c.larg + 0.06, rod, 1.5);
  caixa(b, 'parede', x0 + c.fundo / 2, H + 0.08, c.z, c.fundo + 0.16, 0.16, c.larg + 0.16, BRANCO, 1.5);
  // fachada: janelas por andar, porta no terreo
  const n = Math.max(2, Math.floor(c.larg / 2.7)), slotPorta = Math.floor(s(1) * n);
  for (let a = 0; a < c.andares; a++) for (let i = 0; i < n; i++) {
    const u = z0 + (c.larg * (i + 0.5)) / n, yb = 0.35 + a * 3.0;
    if (a === 0 && i === slotPorta) {
      caixa(b, 'madeira', x0 - 0.02, yb + 1.08, u, 0.06, 2.15, 1.05, '#ffffff', 1);
      caixa(b, 'parede', x0 - 0.04, yb + 2.2, u, 0.1, 0.12, 1.3, BRANCO, 1);
      // tejadillo de telha sobre a porta
      tris(b, 'telhado', [[x0 - 0.75, yb + 2.45, u - 0.85], [x0 - 0.75, yb + 2.45, u + 0.85], [x0, yb + 2.85, u + 0.85], [x0 - 0.75, yb + 2.45, u - 0.85], [x0, yb + 2.85, u + 0.85], [x0, yb + 2.85, u - 0.85]],
        (p) => [p[2] / 1.2, p[0] / 1.0]);
      continue;
    }
    const sacada = a >= 1 && i === slotPorta && s(2) < 0.7;
    if (sacada) {
      // balcon: porta-janela alta + laje + guarda-corpo de ferro
      janela(b, true, x0, u, yb + 0.05, 1.0, 2.2, s(10 + i) < 0.75, false);
      caixa(b, 'parede', x0 - 0.35, yb - 0.02, u, 0.7, 0.12, 1.8, BRANCO, 1);
      for (let k = 0; k <= 14; k++) caixa(b, 'ferro', x0 - 0.68, yb + 0.5, u - 0.85 + k * (1.7 / 14), 0.02, 0.95, 0.02);
      caixa(b, 'ferro', x0 - 0.68, yb + 0.98, u, 0.04, 0.04, 1.75); caixa(b, 'ferro', x0 - 0.36, yb + 0.98, u - 0.875, 0.66, 0.04, 0.04); caixa(b, 'ferro', x0 - 0.36, yb + 0.98, u + 0.875, 0.66, 0.04, 0.04);
    } else janela(b, true, x0, u, yb + 0.95, 1.1, 1.3, s(20 + i + a * 7) < 0.7, a === 0 || s(30 + i) < 0.5);
  }
  // janelas do lado que da para voce (+z)
  const nl = Math.max(1, Math.floor(c.fundo / 3.2));
  for (let a = 0; a < c.andares; a++) for (let i = 0; i < nl; i++)
    janela(b, false, z1, x0 + (c.fundo * (i + 0.5)) / nl, 0.35 + a * 3.0 + 0.95, 1.0, 1.25, s(40 + i + a * 5) < 0.6, a === 0);
  // telhado
  if (c.telhado === 'quatro') {
    const ov = 0.45, xa = x0 - ov, xb = x1 + ov, za = z0 - ov, zb = z1 + ov, y0 = H + 0.12, xc = (xa + xb) / 2;
    const rh = 0.42 * (xb - xa) / 2, y1 = y0 + rh, r0 = za + (xb - xa) / 2, r1 = zb - (xb - xa) / 2;
    const k = 1.1;  // inclinacao no comprimento da telha
    tris(b, 'telhado', [[xa, y0, za], [xa, y0, zb], [xc, y1, r1], [xa, y0, za], [xc, y1, r1], [xc, y1, r0]], (p) => [p[2] / 1.6, (p[0] - xa) * k / 1.6]);
    tris(b, 'telhado', [[xb, y0, zb], [xb, y0, za], [xc, y1, r0], [xb, y0, zb], [xc, y1, r0], [xc, y1, r1]], (p) => [p[2] / 1.6, (xb - p[0]) * k / 1.6]);
    tris(b, 'telhado', [[xb, y0, za], [xa, y0, za], [xc, y1, r0]], (p) => [p[0] / 1.6, (p[2] - za) * k / 1.6]);
    tris(b, 'telhado', [[xa, y0, zb], [xb, y0, zb], [xc, y1, r1]], (p) => [p[0] / 1.6, (zb - p[2]) * k / 1.6]);
    // forro do beiral (escuro) para o telhado nao parecer uma folha de papel
    caixa(b, 'concreto', (xa + xb) / 2, y0 - 0.03, c.z, xb - xa, 0.06, zb - za, '#8a7f74', 2);
  } else {
    // laje com platibanda, caixa d'agua preta (tinaco) e um beiral de telha na frente
    caixa(b, 'concreto', x0 + c.fundo / 2, H + 0.2, c.z, c.fundo - 0.1, 0.06, c.larg - 0.1, '#9a948c', 2);
    caixa(b, 'parede', x0 + 0.08, H + 0.45, c.z, 0.16, 0.6, c.larg, c.cor, 2); caixa(b, 'parede', x1 - 0.08, H + 0.45, c.z, 0.16, 0.6, c.larg, c.cor, 2);
    caixa(b, 'parede', x0 + c.fundo / 2, H + 0.45, z0 + 0.08, c.fundo, 0.6, 0.16, c.cor, 2); caixa(b, 'parede', x0 + c.fundo / 2, H + 0.45, z1 - 0.08, c.fundo, 0.6, 0.16, c.cor, 2);
    caixa(b, 'parede', x0 + c.fundo / 2, H + 0.78, c.z, c.fundo + 0.1, 0.07, c.larg + 0.1, BRANCO, 2);
    if (s(3) < 0.85) {
      const tx = x0 + c.fundo * (0.55 + 0.25 * s(4)), tz = c.z + (s(5) - 0.5) * c.larg * 0.5;
      caixa(b, 'concreto', tx, H + 0.5, tz, 1.3, 0.6, 1.3, '#8d877f', 1);
      cilindro(b, 'tanque', tx, H + 1.35, tz, 0.55, 1.1, '#ffffff', undefined, 16);
      cilindro(b, 'tanque', tx, H + 1.95, tz, 0.3, 0.12, '#ffffff', undefined, 16);
    }
    if (s(6) < 0.6) tris(b, 'telhado', [[x0 - 0.8, H - 0.3, z0], [x0 - 0.8, H - 0.3, z1], [x0, H + 0.12, z1], [x0 - 0.8, H - 0.3, z0], [x0, H + 0.12, z1], [x0, H + 0.12, z0]],
      (p) => [p[2] / 1.6, (p[0] - x0 + 0.8) * 1.1 / 1.6]);
  }
  // muro baixo com portao de ferro na divisa (x = 13,6)
  const xm = 13.6, hm = 1.0, gz = c.z + (s(7) - 0.5) * c.larg * 0.5;
  caixa(b, 'parede', xm, hm / 2, (z0 - 0.5 + gz - 0.7) / 2, 0.22, hm, gz - 0.7 - (z0 - 0.5), c.cor, 2);
  caixa(b, 'parede', xm, hm / 2, (gz + 0.7 + z1 + 0.5) / 2, 0.22, hm, z1 + 0.5 - (gz + 0.7), c.cor, 2);
  caixa(b, 'parede', xm, hm + 0.04, c.z, 0.3, 0.08, c.larg + 1.0, BRANCO, 2);
  for (let k = 0; k <= 10; k++) caixa(b, 'ferro', xm, 0.62, gz - 0.7 + k * 0.14, 0.03, 1.15, 0.025);
  caixa(b, 'ferro', xm, 1.2, gz, 0.04, 0.04, 1.4); caixa(b, 'ferro', xm, 0.1, gz, 0.04, 0.04, 1.4);
  // muros laterais ate a casa
  caixa(b, 'parede', (xm + x0) / 2, hm / 2, z1 + 0.5, x0 - xm, hm, 0.2, c.cor, 2);
};

// lista das casas do outro lado (z de +70 a -420). H0 (a de frente para o pan de 66,5 s) e tratada a parte.
const H0: Casa = {z: -6.5, larg: 10, fundo: 8, andares: 2, cor: '#f1cdb0', telhado: 'quatro', s: 1};
const CASITA: Casa = {z: -6.5, larg: 8.5, fundo: 7, andares: 1, cor: '#f6f4ef', telhado: 'plano', s: 2, x0: FRENTE + 0.5};
const PREDIO: Casa = {z: 7.6, larg: 13, fundo: 10, andares: 3, cor: '#dcc7a0', telhado: 'plano', s: 3};
const CASAS: Casa[] = (() => {
  const L: Casa[] = [];
  let z = 70, i = 0;
  while (z > -420) {
    i++;
    const larg = 9 + rnd(i * 3.1) * 4.5, gap = 1.2 + rnd(i * 5.7) * 2.5;
    const zc = z - larg / 2;
    if (!(zc + larg / 2 > H0.z - H0.larg / 2 - 1 && zc - larg / 2 < H0.z + H0.larg / 2 + 1) && !(zc - larg / 2 < PREDIO.z + PREDIO.larg / 2 + 1 && zc + larg / 2 > PREDIO.z - PREDIO.larg / 2 - 1))
      L.push({z: zc, larg, fundo: 7.5 + rnd(i * 2.3) * 2, andares: rnd(i * 7.7) < 0.45 ? 2 : 1, cor: CORES[Math.floor(rnd(i * 4.9) * CORES.length)],
        telhado: rnd(i * 8.3) < 0.62 ? 'quatro' : 'plano', s: 10 + i});
    z -= larg + gap;
  }
  return L;
})();

// postes ao longo da rua (o principal em POSTE) — os da frente acendem junto
const POSTES: [number, number, number][] = [];   // [x da base, z, lado (+1 braco para +x, -1 para -x)]
for (let k = 0; k < 14; k++) POSTES.push([POSTE[0], POSTE[1] - k * 32, 1]);
for (let k = 0; k < 14; k++) POSTES.push([CAL2_0 + 0.35, POSTE[1] + 14 - k * 32, -1]);

const geraPoste = (b: Balde, x: number, z: number, lado: number) => {
  cilindro(b, 'ferro', x, 2.6, z, 0.07, 5.2, '#ffffff', undefined, 10);
  cilindro(b, 'ferro', x, 0.35, z, 0.12, 0.7, '#ffffff', undefined, 10);
  // braco curvo (3 segmentos)
  const L = Math.abs(LAMPADA.x - POSTE[0]);
  cilindro(b, 'ferro', x + lado * 0.25, 5.15, z, 0.045, 0.6, '#ffffff', new THREE.Euler(0, 0, lado * -1.0), 8);
  cilindro(b, 'ferro', x + lado * (0.5 + (L - 0.5) / 2), 5.32, z, 0.045, L - 0.45, '#ffffff', new THREE.Euler(0, 0, Math.PI / 2 + lado * 0.04), 8);
  // luminaria: carcaca + vidro emissivo por baixo
  caixa(b, 'ferro', x + lado * L, 5.22, z, 0.62, 0.14, 0.3, '#ffffff', 1);
  caixa(b, 'lampada', x + lado * L, 5.13, z, 0.5, 0.05, 0.22, '#ffffff', 1);
};

// ---------- texturas de canvas (placas, tufos de grama, halo) ----------
const canvasTex = (w: number, h: number, f: (c: CanvasRenderingContext2D) => void) => {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; f(cv.getContext('2d')!);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
const usePlacas = () => useMemo(() => {
  const calle = canvasTex(1024, 256, (c) => {
    c.fillStyle = '#1f4d8c'; c.fillRect(0, 0, 1024, 256);
    c.strokeStyle = '#f4f4f0'; c.lineWidth = 14; c.strokeRect(18, 18, 988, 220);
    c.fillStyle = '#f4f4f0'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'bold 54px Arial, Helvetica, sans-serif'; c.fillText('CALLE', 512, 78);
    c.font = 'bold 92px Arial, Helvetica, sans-serif'; c.fillText('12 DE OCTUBRE', 512, 165);
  });
  const parada = canvasTex(256, 384, (c) => {
    c.fillStyle = '#f2f2ee'; c.fillRect(0, 0, 256, 384);
    c.fillStyle = '#1f6fb8'; c.fillRect(10, 10, 236, 364);
    c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.font = 'bold 50px Arial, Helvetica, sans-serif'; c.fillText('PARADA', 128, 320);
    // pictograma do onibus
    c.fillStyle = '#ffffff'; c.beginPath(); (c as any).roundRect ? (c as any).roundRect(48, 60, 160, 170, 22) : c.rect(48, 60, 160, 170); c.fill();
    c.fillStyle = '#1f6fb8'; c.fillRect(66, 84, 124, 70); c.fillRect(60, 238, 0, 0);
    c.beginPath(); c.arc(84, 196, 13, 0, 7); c.fill(); c.beginPath(); c.arc(172, 196, 13, 0, 7); c.fill();
    c.fillStyle = '#ffffff'; c.fillRect(64, 228, 34, 26); c.fillRect(158, 228, 34, 26);
  });
  const anuncio = canvasTex(256, 512, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#f7c948'); g.addColorStop(1, '#e8613c');
    c.fillStyle = g; c.fillRect(0, 0, 256, 512);
    c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.font = 'bold 44px Arial, sans-serif'; c.fillText('FIESTAS', 128, 120); c.fillText('DEL', 128, 172); c.fillText('BARRIO', 128, 224);
    c.font = 'bold 30px Arial, sans-serif'; c.fillText('12 · OCT', 128, 300);
  });
  const tufo = canvasTex(256, 256, (c) => {
    c.clearRect(0, 0, 256, 256);
    for (let i = 0; i < 70; i++) {
      const x = 20 + rnd(i * 3.3) * 216, h = 110 + rnd(i * 5.1) * 140, curva = (rnd(i * 7.9) - 0.5) * 60, w = 3 + rnd(i * 2.2) * 5;
      const v = 0.45 + rnd(i * 9.4) * 0.55;
      c.fillStyle = `rgb(${Math.round(200 * v)},${Math.round(220 * v)},${Math.round(160 * v)})`;
      c.beginPath(); c.moveTo(x - w, 256); c.quadraticCurveTo(x + curva * 0.4, 256 - h * 0.6, x + curva, 256 - h); c.quadraticCurveTo(x + curva * 0.4 + w * 0.3, 256 - h * 0.6, x + w, 256); c.fill();
    }
  });
  const halo = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d')!;
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.12, 'rgba(255,235,200,0.75)'); g.addColorStop(0.35, 'rgba(255,190,120,0.22)'); g.addColorStop(1, 'rgba(255,160,90,0)');
    c.fillStyle = g; c.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(cv); return t;
  })();
  return {calle, parada, anuncio, tufo, halo};
}, []);

// ---------- materiais PBR ----------
const URLS = ['clean_asphalt', 'square_concrete_pavers', 'sparse_grass', 'white_stucco', 'clay_roof_tiles_02', 'concrete_floor_02']
  .flatMap((n) => ['diff', 'nor_gl', 'rough'].map((m) => staticFile(`rua/${n}_${m}_1k.jpg`)));
const useMateriais = () => {
  const tx = useTexture(URLS) as THREE.Texture[];
  return useMemo(() => {
    tx.forEach((t, i) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.colorSpace = i % 3 === 0 ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.needsUpdate = true; });
    const pbr = (k: number, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({map: tx[k * 3], normalMap: tx[k * 3 + 1], roughnessMap: tx[k * 3 + 2], ...extra});
    const asfalto = injeta(pbr(0, {color: '#b4b4b8', normalScale: new THREE.Vector2(0.6, 0.6)}), 'chao', 0.8);
    asfalto.polygonOffset = true; asfalto.polygonOffsetFactor = -1;
    const calcada = injeta(pbr(1, {color: '#f4f2ee'}), 'calcada', 0.95);
    const grama = injeta(pbr(2, {normalScale: new THREE.Vector2(1.2, 1.2)}), 'grama', 1);
    const parede = pbr(3, {vertexColors: true, normalScale: new THREE.Vector2(0.7, 0.7)});
    const telhado = injeta(pbr(4, {vertexColors: true, color: '#e8e0d8'}), 'telhado', 1);
    const concreto = injeta(pbr(5, {vertexColors: true}), 'chao', 0.9);
    const meiofio = injeta(pbr(5, {color: '#d8d6d0'}), 'chao', 0.9);
    const vidro = new THREE.MeshStandardMaterial({color: '#26323d', roughness: 0.12, metalness: 0.3, emissive: '#0d1520', emissiveIntensity: 0.4});
    const vidroLuz = new THREE.MeshStandardMaterial({color: '#26323d', roughness: 0.12, metalness: 0.3, emissive: '#ffc06a', emissiveIntensity: 0});
    const vidroAceso = new THREE.MeshStandardMaterial({color: '#26323d', roughness: 0.12, metalness: 0.3, emissive: '#ffc674', emissiveIntensity: 1.6});
    const ferro = new THREE.MeshStandardMaterial({color: '#1d1e21', roughness: 0.42, metalness: 0.65, vertexColors: true});
    const tanque = new THREE.MeshStandardMaterial({color: '#141414', roughness: 0.55, metalness: 0.0, vertexColors: true});
    const madeira = new THREE.MeshStandardMaterial({color: '#6e4426', roughness: 0.62, vertexColors: true});
    const lampada = new THREE.MeshStandardMaterial({color: '#fff3dc', emissive: '#ffb45e', emissiveIntensity: 0, roughness: 0.3});
    const pintura = new THREE.MeshStandardMaterial({color: '#f1f0e8', roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2});
    const pinturaAm = new THREE.MeshStandardMaterial({color: '#f0b62c', roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2});
    return {asfalto, calcada, grama, parede, telhado, concreto, meiofio, vidro, vidroLuz, vidroAceso, ferro, tanque, madeira, lampada, pintura, pinturaAm};
  }, [tx]);
};
type Mats = ReturnType<typeof useMateriais>;
const Fundido: React.FC<{g: Record<string, THREE.BufferGeometry>; m: Mats; luzJanelas?: 'vidroAceso'}> = ({g, m, luzJanelas}) => (
  <>{Object.entries(g).map(([k, geo]) => <mesh key={k} geometry={geo} material={(k === 'vidroLuz' && luzJanelas ? m[luzJanelas] : (m as any)[k]) ?? m.parede} castShadow receiveShadow />)}</>
);

// plano horizontal com UV em metros
const plano = (x0: number, x1: number, z0: number, z1: number, y: number, tile: number) => {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (x1 - x0) / tile, uv.getY(i) * (z1 - z0) / tile);
  return g;
};

// ---------- pessoas ----------
type Ped = {i: number; x: number; dir: number; tc: number; z0?: number; v: number; camisa: string; calca: string; fem: boolean; janela: [number, number]; ritmo: 'ini' | 'fim' | 'fantasma'};
// relogio "de rua": no inicio a historia ja corre um pouco mais rapido que voce (os pedestres vem rapido)
const sIni = (t: number) => 2.2 * Math.max(0, t - 6.4) + decorrido(t);
const PEDS: Ped[] = [
  {i: 1, x: 0.85, dir: 1, tc: 12.0, v: 1.45, camisa: '#9e2b22', calca: '#2c2f36', fem: false, janela: [6.4, 17.2], ritmo: 'ini'},   // rente a direita
  {i: 2, x: -0.62, dir: 1, tc: 12.75, v: 1.35, camisa: '#f4f1ea', calca: '#1f3f8f', fem: true, janela: [6.4, 17.2], ritmo: 'ini'},   // rente a esquerda
  {i: 3, x: 0.35, dir: 1, tc: 14.2, v: 1.4, camisa: '#1f3f8f', calca: '#d9cfb8', fem: true, janela: [6.4, 17.2], ritmo: 'ini'},
  {i: 4, x: 0.6, dir: -1, tc: 0, z0: -9, v: 1.3, camisa: '#16a085', calca: '#2c2f36', fem: false, janela: [6.4, 17.2], ritmo: 'ini'},
  {i: 5, x: -0.2, dir: 1, tc: 10.4, v: 1.5, camisa: '#e67e22', calca: '#6b4a2f', fem: false, janela: [6.4, 17.2], ritmo: 'ini'},
  {i: 6, x: 1.0, dir: -1, tc: 0, z0: -16, v: 1.4, camisa: '#7d5ba6', calca: '#2c2f36', fem: true, janela: [6.4, 17.2], ritmo: 'ini'},
  {i: 7, x: 0.1, dir: 1, tc: 15.8, v: 1.4, camisa: '#e2457a', calca: '#1f3f8f', fem: true, janela: [6.4, 17.2], ritmo: 'ini'},
  {i: 8, x: 0.55, dir: -1, tc: 0, z0: -24, v: 1.35, camisa: '#3b8fd0', calca: '#2c2f36', fem: false, janela: [6.4, 17.2], ritmo: 'ini'},
  {i: 9, x: -0.35, dir: 1, tc: 13.4, v: 1.3, camisa: '#c0392b', calca: '#6b4a2f', fem: true, janela: [6.4, 17.2], ritmo: 'ini'},
  {i: 10, x: 0.9, dir: 1, tc: 16.3, v: 1.5, camisa: '#f4f1ea', calca: '#2c2f36', fem: false, janela: [6.4, 17.2], ritmo: 'ini'},
  // fim (532,5-537,2): velocidade normal; branco rente em 536, vermelho enche o quadro em 536,5 (vindo de tras)
  {i: 11, x: 0.72, dir: 1, tc: 536.0, v: 1.4, camisa: '#d6d1c7', calca: '#2c2f36', fem: false, janela: [528.8, 537.3], ritmo: 'fim'},
  {i: 12, x: 0.32, dir: -1, tc: 0, z0: -0.9 + 1.45 * 536.5, v: 1.45, camisa: '#c0392b', calca: '#2c2f36', fem: true, janela: [528.8, 537.3], ritmo: 'fim'},
  {i: 13, x: 0.2, dir: 1, tc: 548, v: 1.3, camisa: '#1f3f8f', calca: '#d9cfb8', fem: true, janela: [528.8, 537.3], ritmo: 'fim'},
  {i: 14, x: 0.9, dir: -1, tc: 0, z0: 709, v: 1.35, camisa: '#16a085', calca: '#2c2f36', fem: false, janela: [528.8, 537.3], ritmo: 'fim'},
  {i: 15, x: -0.3, dir: 1, tc: 556, v: 1.4, camisa: '#f2b134', calca: '#2c2f36', fem: false, janela: [528.8, 537.3], ritmo: 'fim'},
];
const sDe = (p: Ped, t: number) => (p.ritmo === 'fim' ? t : sIni(t));
const zPed = (p: Ped, t: number) => p.z0 !== undefined ? p.z0 + p.dir * p.v * sDe(p, t) : p.dir * p.v * (sDe(p, t) - sDe(p, p.tc));
const PESSOAS_PED: Pessoa3D[] = PEDS.map((p) => ({i: p.i, x: p.x, z: 0, rot: 0, pose: 'andando', fem: p.fem, camisa: p.camisa, calca: p.calca, curta: false}));
const estadoPed = (pp: Pessoa3D, k: number, t: number): Estado3D => {
  const p = PEDS[k], z = zPed(p, t), d = Math.abs(p.v * sDe(p, t));
  const vis = t >= p.janela[0] && t < p.janela[1] && z > -140 && z < 3;
  return {x: p.x, y: ALT_CAL, z, ry: p.dir > 0 ? 0 : Math.PI, clipe: 'Walk_Loop', tempo: d / 1.45 + rnd(p.i) , visivel: vis};
};
// fantasmas (17-18,6): cada pessoa em 6 subtempos, semitransparentes (roxo e amarelo dominam, como no original)
const FANT_BASE = [
  {x: 0.7, dir: 1, z17: -38, camisa: '#7d5ba6', fem: false}, {x: -0.4, dir: 1, z17: -62, camisa: '#f2b134', fem: true},
  {x: 0.2, dir: -1, z17: 2, camisa: '#7d5ba6', fem: true}, {x: 1.0, dir: 1, z17: -90, camisa: '#f2b134', fem: false},
];
const N_SUB = 6, DT_SUB = 0.055;
const FANT: Pessoa3D[] = FANT_BASE.flatMap((f, j) => Array.from({length: N_SUB}, (_, k) => ({i: 100 + j, x: f.x, z: 0, rot: 0, pose: 'andando' as const, fem: f.fem, camisa: f.camisa, calca: '#2c2f36', curta: false})));
const estadoFant = (_p: Pessoa3D, k: number, t: number): Estado3D => {
  const f = FANT_BASE[Math.floor(k / N_SUB)], tt = t - (k % N_SUB) * DT_SUB;
  const d = 1.4 * (sIni(tt) - sIni(17)), z = f.z17 + f.dir * d;
  return {x: f.x, y: ALT_CAL, z, ry: f.dir > 0 ? 0 : Math.PI, clipe: 'Walk_Loop', tempo: Math.abs(d) / 1.45, visivel: z > -150 && z < -1.2 && tt > 16.6};   // nunca atravessando a camera (o rosto enchia o quadro por 1 quadro)
};

// roupa de rua para quem passa perto: jaqueta/camisa de manga comprida que cobre ombros, peito e bracos ate o punho, tecido de cor
// chapada (a textura do modelo base tem musculos pintados) e calca comprida. Troca o material do corpo que o Multidao3D monta
// (regioes na pose de bind, T-pose de 1,8 m: tronco |x|<0,27 de 0,9 m ao pescoco; bracos horizontais em 1,26-1,66 m ate |x| 0,72).
const vesteRua = (raiz: THREE.Object3D) => {
  raiz.traverse((o: any) => {
    if (!o.isSkinnedMesh || !/Superhero/.test(o.material?.name ?? '') || o.material.userData.rua) return;
    const u = o.material.userData.u;
    if (!u) return;
    const m = new THREE.MeshStandardMaterial({map: o.material.map, roughness: 0.82, metalness: 0, name: o.material.name + '_rua'});
    m.userData.rua = true; m.userData.u = u;
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vBindR;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvBindR = position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vBindR;\nuniform vec3 uPele; uniform vec3 uCamisa; uniform vec3 uCalca;')
        .replace('#include <map_fragment>', `#include <map_fragment>
  float lum = dot(diffuseColor.rgb, vec3(0.333));
  diffuseColor.rgb *= uPele;
  float ax = abs(vBindR.x), y = vBindR.y;
  float decote = mix(1.5, 1.57, smoothstep(0.07, 0.13, ax));
  float tronco = step(ax, 0.27) * step(0.9, y) * step(y, decote);
  float braco = step(0.17, ax) * step(ax, 0.72) * step(1.26, y) * step(y, 1.66);
  float camisa = max(tronco, braco);
  float calca = step(ax, 0.32) * step(0.07, y) * step(y, 0.98);
  float dobra = 0.94 + 0.06 * lum;   // quase chapado: esconde o relevo pintado
  diffuseColor.rgb = mix(diffuseColor.rgb, uCamisa * dobra, camisa);
  diffuseColor.rgb = mix(diffuseColor.rgb, uCalca * dobra, calca * (1.0 - camisa));`)
        // tecido folgado: na camisa a normal de sombreamento puxa para a camera (o relevo dos musculos quase some)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  { float axN = abs(vBindR.x), yN = vBindR.y;
    float tr = step(axN, 0.27) * step(0.9, yN) * step(yN, mix(1.5, 1.57, smoothstep(0.07, 0.13, axN)));
    float br = step(0.17, axN) * step(axN, 0.72) * step(1.26, yN) * step(yN, 1.66);
    normal = normalize(mix(normal, vec3(0.0, 0.0, 1.0), 0.6 * max(tr, br))); }`);
    };
    m.customProgramCacheKey = () => 'pessoa_rua_vestida';
    o.material = m;
  });
};
const Pedestres: React.FC<{t: number}> = ({t}) => {
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => { if (ref.current) vesteRua(ref.current); });
  const ini = (t >= 6.4 && t < 17.3) || t >= 528.8;
  return ini ? <group ref={ref}><Multidao3D lista={PESSOAS_PED} t={t} de={[0, 0]} estadoDe={estadoPed} /></group> : null;
};
const Fantasmas: React.FC<{t: number}> = ({t}) => {
  const ref = useRef<THREE.Group>(null);
  const a = smooth(16.8, 17.2, t) * (1 - smooth(18.3, 18.7, t));
  useLayoutEffect(() => {
    const g = ref.current; if (!g) return;
    const raizes = (g.children[0]?.children ?? []) as THREE.Object3D[];
    raizes.forEach((r, k) => {
      const op = a * (0.42 - 0.05 * (k % N_SUB));
      r.traverse((o: any) => {
        if (!o.isMesh) return;
        if (!o.userData.fantasma) { const nome = o.material?.name ?? ''; if (!/Superhero|Hair/.test(nome) && !o.userData.clonado) { o.material = o.material.clone(); o.userData.clonado = true; } o.userData.fantasma = true; }
        o.material.transparent = true; o.material.opacity = op; o.material.depthWrite = false;
      });
    });
  });
  if (a <= 0.001) return null;
  return <group ref={ref}><Multidao3D lista={FANT} t={t} de={[0, 0]} estadoDe={estadoFant} /></group>;
};

// ---------- carros ----------
type Carro = {cor: string; faixa: 1 | -1; tc: number; v: number; fim?: boolean};   // faixa 1: perto, vem (+z); -1: longe, vai (-z)
const CARROS: Carro[] = [
  // tc = quando cruza o seu plano (z = 0): quem vem cruza ~0,2 s depois do momento do mapa, quem vai ~0,2 s antes (assim no
  // segundo do mapa o carro esta na sua frente, borrado)
  {cor: '#f2c230', faixa: 1, tc: 9.2, v: 12}, {cor: '#3f8f4c', faixa: -1, tc: 10.8, v: 12}, {cor: '#f2c230', faixa: 1, tc: 13.7, v: 13},
  {cor: '#3f8f4c', faixa: -1, tc: 15.3, v: 13}, {cor: '#d9dadc', faixa: 1, tc: 16.4, v: 14}, {cor: '#a3312a', faixa: -1, tc: 17.1, v: 14},
  {cor: '#2b4f8a', faixa: 1, tc: 17.7, v: 14}, {cor: '#e8e6df', faixa: -1, tc: 18.2, v: 14},
  {cor: '#f2c230', faixa: 1, tc: 534, v: 11, fim: true}, {cor: '#3f8f4c', faixa: -1, tc: 535.8, v: 10, fim: true}, {cor: '#d9dadc', faixa: -1, tc: 531.5, v: 10, fim: true},
];
const sCarro = (c: Carro, t: number) => (c.fim ? t : 3 * Math.max(0, t - 6.4) + decorrido(t));
const zCarro = (c: Carro, t: number) => c.faixa * c.v * (sCarro(c, t) - sCarro(c, c.tc));
// carroceria de sedan por perfil extrudado (comprimento ao longo de z)
const PERFIL = [[-2.25, 0.32], [2.25, 0.32], [2.3, 0.62], [2.15, 0.88], [1.15, 0.98], [0.5, 1.42], [-0.95, 1.45], [-1.8, 1.0], [-2.28, 0.92]];
const PERFIL_VIDRO = [[1.05, 1.0], [0.52, 1.37], [-0.92, 1.4], [-1.68, 1.02]];
const extrudaPerfil = (pts: number[][], larg: number, bevel: number) => {
  const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(sh, {depth: larg, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 4});
  g.translate(0, 0, -larg / 2); g.rotateY(-Math.PI / 2);   // comprimento (x do perfil) -> -z; frente do perfil (+x) aponta para -z
  return g;
};
const useCarroGeo = () => useMemo(() => {
  const corpo = extrudaPerfil(PERFIL, 1.62, 0.07), vidro = extrudaPerfil(PERFIL_VIDRO, 1.7, 0.02);
  const roda = new THREE.CylinderGeometry(0.33, 0.33, 0.24, 18); roda.rotateZ(Math.PI / 2);
  const farol = new THREE.BoxGeometry(0.34, 0.12, 0.06);
  return {corpo, vidro, roda, farol};
}, []);
const CarroMesh: React.FC<{c: Carro; t: number; noite: number; geo: ReturnType<typeof useCarroGeo>}> = ({c, t, noite, geo}) => {
  const mats = useMemo(() => ({
    pintura: new THREE.MeshPhysicalMaterial({color: c.cor, roughness: 0.32, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.08}),
    vidro: new THREE.MeshStandardMaterial({color: '#1a2129', roughness: 0.05, metalness: 0.5}),
    pneu: new THREE.MeshStandardMaterial({color: '#151515', roughness: 0.85}),
    farol: new THREE.MeshStandardMaterial({color: '#ffffff', emissive: '#fff4dc', emissiveIntensity: 1}),
    lanterna: new THREE.MeshStandardMaterial({color: '#5a0c0c', emissive: '#ff2a1a', emissiveIntensity: 1}),
  }), [c.cor]);
  const z = zCarro(c, t), vel = (zCarro(c, t + 0.01) - zCarro(c, t - 0.01)) / 0.02;
  if (z < -260 || z > 30) return null;
  const x = c.faixa > 0 ? FAIXA_PERTO : FAIXA_LONGE, ry = c.faixa > 0 ? Math.PI : 0;   // perfil aponta para -z; quem vem (+z) gira 180
  const L = Math.abs(vel) / 60;   // obturador de 1/60 s
  const K = L < 0.25 ? 1 : Math.min(9, Math.ceil(L / 0.35) + 1);
  mats.farol.emissiveIntensity = 1 + 5 * noite; mats.lanterna.emissiveIntensity = 0.6 + 4 * noite;
  const transp = K > 1;
  Object.values(mats).forEach((m) => { m.transparent = transp; m.opacity = transp ? Math.min(1, 1.7 / K) : 1; m.depthWrite = !transp; });
  return <>{Array.from({length: K}, (_, k) => {
    const dz = K > 1 ? (k / (K - 1) - 0.5) * L * Math.sign(vel) : 0;
    return (
      <group key={k} position={[x, 0, z + dz]} rotation={[0, ry, 0]}>
        <mesh geometry={geo.corpo} material={mats.pintura} castShadow={k === 0} />
        <mesh geometry={geo.vidro} material={mats.vidro} />
        {[[-0.78, 1.45], [0.78, 1.45], [-0.78, -1.4], [0.78, -1.4]].map(([wx, wz], i) => <mesh key={i} geometry={geo.roda} material={mats.pneu} position={[wx, 0.33, -wz]} />)}
        {[-0.6, 0.6].map((wx, i) => <mesh key={'f' + i} geometry={geo.farol} material={mats.farol} position={[wx, 0.7, -2.3]} />)}
        {[-0.62, 0.62].map((wx, i) => <mesh key={'l' + i} geometry={geo.farol} material={mats.lanterna} position={[wx, 0.78, 2.27]} />)}
      </group>
    );
  })}</>;
};
const Carros: React.FC<{t: number; noite: number}> = ({t, noite}) => {
  const geo = useCarroGeo();
  const ativos = CARROS.filter((c) => (c.fim ? t >= 528.8 : t >= 6.4 && t < 19));
  return <>{ativos.map((c, i) => <CarroMesh key={CARROS.indexOf(c)} c={c} t={t} noite={noite} geo={geo} />)}</>;
};

// ---------- listras de farol (18,5 em diante) ----------
const LISTRA_VS = `varying float vZ; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vZ = w.z; gl_Position = projectionMatrix * viewMatrix * w; }`;
const LISTRA_FS = `uniform vec3 uCor; uniform float uDuty; uniform float uFase; uniform float uPer; uniform float uForca; varying float vZ;
float rh(float x){ return fract(sin(x * 91.17) * 43758.5453); }
void main(){
  float u = vZ / uPer + uFase; float cel = floor(u); float s = fract(u);
  float d = uDuty * (0.6 + 0.8 * rh(cel));
  float a = uDuty >= 0.995 ? 1.0 : smoothstep(0.0, 0.04, s) * (1.0 - smoothstep(d, d + 0.04, s));
  float longe = 1.0 - smoothstep(60.0, 420.0, -vZ) * 0.6;
  gl_FragColor = vec4(uCor * a * uForca * longe, 1.0);
}`;
const Listras: React.FC<{t: number; noite: number}> = ({t, noite}) => {
  const mats = useMemo(() => [new THREE.Color(2.2, 2.05, 1.8), new THREE.Color(2.2, 2.05, 1.8), new THREE.Color(2.4, 0.18, 0.1), new THREE.Color(2.4, 0.18, 0.1)].map((c, i) =>
    new THREE.ShaderMaterial({vertexShader: LISTRA_VS, fragmentShader: LISTRA_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: {uCor: {value: c}, uDuty: {value: 0.2}, uFase: {value: 0}, uPer: {value: 14 + i * 3}, uForca: {value: 1}}})), []);
  const geo = useMemo(() => { const g = new THREE.CylinderGeometry(0.045, 0.045, 1, 6, 1, true); g.rotateX(Math.PI / 2); return g; }, []);
  const ent = smooth(18.3, 19.6, t);
  const duty = t < 24.6 ? 0.12 + 0.55 * smooth(18.5, 24, t) : 1;
  const forca = ent * (t < 24.8 ? 0.35 + 0.4 * noite : t < 41 ? 0.45 + 1.6 * noite : 1.15) * fator(t, 105.8, 106.1);
  if (forca <= 0.001) return null;
  const pos: [number, number][] = [[FAIXA_PERTO - 0.62, 0.66], [FAIXA_PERTO + 0.62, 0.66], [FAIXA_LONGE - 0.64, 0.8], [FAIXA_LONGE + 0.64, 0.8]];
  return <>{pos.map(([x, y], i) => {
    const m = mats[i]; m.uniforms.uDuty.value = duty; m.uniforms.uForca.value = forca;
    m.uniforms.uFase.value = (i < 2 ? -1 : 1) * (t * 7.3 + i * 0.37) * (1 + smooth(18.5, 24, t) * 3);
    return <mesh key={i} geometry={geo} material={m} position={[x, y, (Z_PERTO + Z_LONGE) / 2 * 0 - 200]} scale={[1, 1, 520]} renderOrder={5} />;
  })}</>;
};

// ---------- tufos de grama (instanciados) ----------
const Tufos: React.FC<{tex: THREE.Texture; t: number; neve: number}> = ({tex, t, neve}) => {
  const mesh = useMemo(() => {
    const a = new THREE.PlaneGeometry(0.55, 0.32); a.translate(0, 0.16, 0);
    const b = a.clone(); b.rotateY(Math.PI / 2); const c = a.clone(); c.rotateY(Math.PI / 4);
    const g = mergeGeometries([a, b, c])!;
    const m = new THREE.MeshStandardMaterial({map: tex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.85});
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uGrama = U.uGrama; sh.uniforms.uNeve = U.uNeve; sh.uniforms.uTempo = U.uTempo;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTempo; uniform float uNeve; varying float vUvG;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
  float ph = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.4;
  transformed.x += uv.y * uv.y * 0.04 * sin(uTempo * 1.6 + ph);
  transformed.y *= 1.0 - 0.97 * smoothstep(0.08, 0.5, uNeve);
  vUvG = uv.y;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uGrama; uniform float uNeve; varying float vUvG;')
        .replace('#include <map_fragment>', `#include <map_fragment>
  { float l = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11)); diffuseColor.rgb = uGrama * (0.45 + 1.1 * l) * (0.55 + 0.6 * vUvG);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.92, 0.96), smoothstep(0.3, 0.8, uNeve)); }`);
    };
    m.customProgramCacheKey = () => 'rua_tufo';
    const N = 9000;
    const im = new THREE.InstancedMesh(g, m, N);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < N; i++) {
      let x: number, z: number;
      if (i < 7600) { const r = Math.pow(rnd(i * 1.31), 1.6); x = CAL0 - 0.12 - r * 34; z = 4 - rnd(i * 2.71) * 60 * (0.3 + 0.7 * rnd(i * 5.3)); }
      else { x = CAL2_1 + 0.2 + rnd(i * 3.7) * 0.25 * 0 + rnd(i * 3.7) * (13.4 - CAL2_1 - 0.3); z = 10 - rnd(i * 4.1) * 90; }
      if (Math.hypot(x - BANCO[0], z - BANCO[1]) < 0.9) { x -= 1.5; }
      const s = 0.7 + rnd(i * 6.1) * 0.8;
      M.compose(P.set(x, -0.05, z), Q.setFromAxisAngle(Y, rnd(i * 7.9) * 6.28), S.set(s, s * (0.8 + rnd(i * 8.3) * 0.5), s));
      im.setMatrixAt(i, M);
    }
    im.frustumCulled = false; im.receiveShadow = true;
    return im;
  }, [tex]);
  // sob a neve os tufos somem (deitados eles ficavam riscos escuros sobre o branco)
  mesh.visible = neve < 0.5;
  return <primitive object={mesh} />;
};

// ---------- arvores da rua ----------
const ARVORES_RUA: ItemFloresta[] = (() => {
  const L: ItemFloresta[] = [];
  const PR: [PresetEZ, number][] = [['Oak Medium', 41], ['Ash Medium', 17], ['Oak Medium', 58], ['Aspen Medium', 27]];
  // canteiro do outro lado (x = 12,1), uma a cada ~15 m — somem com as casas em 90 s
  for (let k = 0; k < 24; k++) {
    const z = 30 - k * 15.5 + (rnd(k * 3.3) - 0.5) * 3;
    const [preset, semente] = PR[k % 4];
    L.push({preset, semente, x: 12.15, z, altura: 7.5 + rnd(k * 2.1) * 2.5, rot: rnd(k * 9.7) * 6.28, morre: 89.65 + rnd(k) * 0.35, durMorre: 0.3});
  }
  // parque a esquerda: espalhadas, longe do banco e do poste
  for (let k = 0; k < 46; k++) {
    const x = -9 - Math.pow(rnd(k * 5.3), 1.3) * 120, z = 60 - rnd(k * 6.1) * 380;
    if (z > -16 && z < 14 && x > -14) continue;
    const [preset, semente] = PR[(k + 1) % 4];
    const d = Math.hypot(x, z);
    L.push({preset, semente, x, z, altura: 8 + rnd(k * 2.9) * 5, rot: rnd(k * 8.1) * 6.28, morre: 110.1 + Math.min(1.4, d / 250) + rnd(k * 1.9) * 0.2, durMorre: 0.35});
  }
  return L;
})();
const ARVORES_RUA_FIM: ItemFloresta[] = ARVORES_RUA.map(({morre, durMorre, ...it}) => it);   // na volta (522+) a rua esta inteira

// ---------- colinas distantes ----------
const useColinas = () => useMemo(() => {
  const N = 220, pos: number[] = [], idx: number[] = [];
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2, r = 3800;
    const h = 90 + 260 * Math.pow(0.5 + 0.5 * Math.sin(a * 3 + 1.1) * Math.cos(a * 7 + 0.3), 1.6) + 70 * Math.sin(a * 17 + 2) ** 2;
    pos.push(Math.sin(a) * r, -40, -Math.cos(a) * r, Math.sin(a) * r, h, -Math.cos(a) * r);
    if (i < N) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}, []);

// ---------- a rua ----------
export const Rua: React.FC<{t: number}> = ({t}) => {
  const m = useMateriais();
  const placas = usePlacas();
  const colinas = useColinas();
  const fim = t >= T_FIM;
  // a volta (522+): ceu e luz de 17:42 (o ceu do Cena so vai ate 321,4 s)
  const tLuz = fim ? 6.5 + Math.max(0, t - 531) * 0.15 : t;
  const luz = luzEm(tLuz);
  const noite = clamp01(1 - luz.dia);
  const est = estacao(t);
  U.uNeve.value = est.neve; U.uGrama.value.copy(est.grama); U.uTempo.value = t;
  // neve branca de verdade: um pouco de luz propria (o ceu medio de dia+noite deixa o chao cinza-rosado)
  U.uNeveLuz.value = (fim ? 0 : t >= 41 ? 0.42 : 0.12) * (0.35 + 0.65 * luz.dia);

  // ---- geometria fundida (uma vez) ----
  const g = useMemo(() => {
    const bCasas: Balde = {}, bH0: Balde = {}, bCasita: Balde = {}, bPredio: Balde = {}, bFixos: Balde = {}, bPostes: Balde = {};
    CASAS.forEach((c) => geraCasa(bCasas, c));
    geraCasa(bH0, H0); geraCasa(bCasita, CASITA); geraCasa(bPredio, PREDIO);
    POSTES.forEach(([x, z, lado], k) => geraPoste(k === 0 ? bFixos : bPostes, x, z, lado));
    // banco: ripas de madeira + pes de ferro fundido (de frente para a calcada, +x)
    const [bx, bz] = BANCO;
    for (let k = 0; k < 4; k++) caixa(bFixos, 'madeira', bx - 0.2 + k * 0.13, 0.46, bz, 0.1, 0.045, 1.9, '#ffffff', 1);
    for (let k = 0; k < 3; k++) caixa(bFixos, 'madeira', bx - 0.33 - k * 0.025, 0.66 + k * 0.14, bz, 0.04, 0.1, 1.9, '#ffffff', 1, new THREE.Euler(0, 0, 0.2));
    for (const s of [-0.8, 0.8]) {
      caixa(bFixos, 'ferro', bx - 0.02, 0.23, bz + s, 0.5, 0.06, 0.06); caixa(bFixos, 'ferro', bx + 0.2, 0.22, bz + s, 0.05, 0.46, 0.06);
      caixa(bFixos, 'ferro', bx - 0.24, 0.22, bz + s, 0.05, 0.46, 0.06); caixa(bFixos, 'ferro', bx - 0.33, 0.68, bz + s, 0.05, 0.5, 0.06, '#ffffff', 1, new THREE.Euler(0, 0, 0.2));
    }
    // estaca e amarras da muda
    caixa(bFixos, 'madeira', MUDA[0] + 0.16, 0.7, MUDA[2], 0.035, 1.4, 0.035, '#cfa57a', 1);
    // ponto de onibus: placa no meio-fio e abrigo do outro lado
    cilindro(bFixos, 'ferro', 1.28, 1.35, -24, 0.04, 2.7, '#8d9196');
    caixa(bFixos, 'ferro', 11.6, 1.25, -31, 0.08, 2.5, 0.08); caixa(bFixos, 'ferro', 11.6, 1.25, -27, 0.08, 2.5, 0.08);
    caixa(bFixos, 'ferro', 12.9, 1.25, -31, 0.08, 2.5, 0.08); caixa(bFixos, 'ferro', 12.9, 1.25, -27, 0.08, 2.5, 0.08);
    caixa(bFixos, 'vidro', 12.3, 2.53, -29, 1.7, 0.06, 4.4); caixa(bFixos, 'madeira', 12.6, 0.48, -29, 0.4, 0.06, 3.0, '#ffffff', 1);
    // pintura da pista: linha dupla amarela central tracejada e bordas brancas
    const bPint: Balde = {}, bPintAm: Balde = {};
    const zc = (Z_PERTO + Z_LONGE) / 2, zl = Z_PERTO - Z_LONGE;
    caixa(bPint, 'p', PISTA0 + 0.25, 0.03, zc, 0.12, 0.006, zl); caixa(bPint, 'p', PISTA1 - 0.25, 0.03, zc, 0.12, 0.006, zl);
    for (let z = Z_PERTO; z > Z_LONGE; z -= 9) { caixa(bPintAm, 'p', (PISTA0 + PISTA1) / 2 - 0.09, 0.03, z - 2, 0.1, 0.006, 4); caixa(bPintAm, 'p', (PISTA0 + PISTA1) / 2 + 0.09, 0.03, z - 2, 0.1, 0.006, 4); }
    // calcadas e meio-fio
    const bCal: Balde = {}, bCal2: Balde = {}, bMeio: Balde = {};
    poe(bCal, 'c', plano(CAL0, CAL1, Z_LONGE, Z_PERTO, ALT_CAL, 3.6)); caixa(bMeio, 'm', CAL0 - 0.06, 0.04, zc, 0.12, 0.2, zl, '#ffffff', 1);
    caixa(bMeio, 'm', (MEIO0 + MEIO1) / 2, ALT_CAL / 2 + 0.01, zc, MEIO1 - MEIO0, ALT_CAL + 0.02, zl, '#ffffff', 0.6);
    poe(bCal2, 'c', plano(CAL2_0 + 0.18, CAL2_1, Z_LONGE, Z_PERTO, ALT_CAL, 3.6)); caixa(bCal2, 'm', CAL2_1 + 0.05, 0.04, zc, 0.1, 0.2, zl, '#ffffff', 0.6); caixa(bCal2, 'm', CAL2_0 + 0.09, ALT_CAL / 2 + 0.01, zc, 0.18, ALT_CAL + 0.02, zl, '#ffffff', 0.6);
    // placa da parada no seu lado, chapas
    return {casas: funde(bCasas), h0: funde(bH0), casita: funde(bCasita), predio: funde(bPredio), fixos: funde(bFixos), postes: funde(bPostes),
      pint: funde(bPint).p, pintAm: funde(bPintAm).p, cal: mergeGeometries(bCal.c)!, cal2: funde(bCal2), meio: funde(bMeio).m,
      pista: plano(PISTA0, PISTA1, Z_LONGE, Z_PERTO, 0.02, 4),
      grama: plano(-2500, 2500, -2500, 2500, -0.06, 3.2)};
  }, []);

  // ---- tempos dos eventos ----
  // apagao (105,8-106,2): a luz da rua, das janelas e os farois morrem junto com a cidade
  const apagao = fim ? 1 : fator(t, 105.8, 106.1);
  const poste = (fim ? smooth(523.5, 524.2, t) : t < 24.8 ? 0 : Math.max(smooth(24.8, 25.0, t) * smooth(0.25, 0.5, noite), smooth(40, 41, t))) * apagao;
  const janelasLuz = fim ? 0 : t < 25.4 ? 0 : Math.max(smooth(25.4, 25.6, t) * smooth(0.25, 0.5, noite), t >= 41 ? 0.55 : 0) * (t >= 41 ? 1 : 1.6);
  m.vidroLuz.emissiveIntensity = janelasLuz * 1.6 * apagao;
  m.lampada.emissiveIntensity = poste * (fim ? 14 : 5 + 18 * noite);
  // casa da frente trocada (69,5-70,2), predio bege (70,8-71,2), casas da direita somem em 90 (o lado direito vira do agente Cidade)
  const kDir = fim ? 1 : fator(t, 89.6, 90.05);
  const kH0 = fim ? 1 : fator(t, 69.5, 69.85);
  const kCasita = fim ? 0 : nasce(t, 69.85, 70.2) * kDir;
  const kPredio = fim ? 0 : nasce(t, 70.8, 71.2) * kDir;
  // 109,4-109,6 a calcada some; 109,6-111,8 o resto some; floresta a partir de 110,4
  const kCal = fim ? 1 : fator(t, 109.4, 109.6);
  const kPista = fim ? 1 : fator(t, 109.7, 110.2);
  const kFixos = fim ? 1 : fator(t, 110.0, 110.5);
  const kMuda = fim ? 1 : fator(t, 110.6, 111.1);
  const cMuda = fim ? 0 : smooth(75, 81, t);
  const mostraTudo = !fim || t >= 528.8;
  const preto = fim ? 1 - smooth(528.8, 530, t) : 0;
  const esc = (k: number) => [1, Math.max(1e-3, k), 1] as [number, number, number];

  return (
    <>
      {fim && t < 528.8 && <color attach="background" args={['#000000']} />}
      {fim && t >= 528.8 && <CeuTempo t={tLuz} />}
      {mostraTudo && <>
        {/* chao: gramado do mundo inteiro (fica quando a rua some), colinas no horizonte */}
        <mesh geometry={g.grama} material={m.grama} receiveShadow />
        <mesh geometry={colinas}><meshStandardMaterial color="#6d7a6a" roughness={1} /></mesh>
        {kPista > 0.001 && <group scale={esc(kPista)}>
          <mesh geometry={g.pista} material={m.asfalto} receiveShadow />
          <mesh geometry={g.pint} material={m.pintura} />
          <mesh geometry={g.pintAm} material={m.pinturaAm} />
          <mesh geometry={g.cal2.c} material={m.calcada} receiveShadow />
          <mesh geometry={g.cal2.m} material={m.meiofio} receiveShadow />
        </group>}
        {kCal > 0.001 && <group scale={esc(kCal)}>
          <mesh geometry={g.cal} material={m.calcada} receiveShadow />
          <mesh geometry={g.meio} material={m.meiofio} receiveShadow />
        </group>}
        {kFixos > 0.001 && <group scale={esc(kFixos)}>
          <Fundido g={g.fixos} m={m} />
          <Fundido g={g.postes} m={m} />
          {/* placa CALLE 12 DE OCTUBRE no poste (virada para voce) e placa PARADA */}
          <mesh position={[POSTE[0] + 0.02, 2.85, POSTE[1] + 0.09]}><planeGeometry args={[1.4, 0.35]} /><meshStandardMaterial map={placas.calle} roughness={0.4} metalness={0.1} /></mesh>
          <mesh position={[1.28, 2.45, -23.97]}><planeGeometry args={[0.42, 0.63]} /><meshStandardMaterial map={placas.parada} roughness={0.4} side={THREE.DoubleSide} /></mesh>
          <mesh position={[12.95, 1.3, -29]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[3.6, 1.9]} /><meshStandardMaterial map={placas.anuncio} emissive="#ffffff" emissiveMap={placas.anuncio} emissiveIntensity={0.15 + janelasLuz * 0.5} /></mesh>
        </group>}
        <Tufos tex={placas.tufo} t={t} neve={est.neve} />
        {/* casas do outro lado */}
        {kDir > 0.001 && <group scale={esc(kDir)}><Fundido g={g.casas} m={m} /></group>}
        {kH0 > 0.001 && kDir > 0.001 && <group scale={esc(kH0 * kDir)}><Fundido g={g.h0} m={m} /></group>}
        {kCasita > 0.001 && <group scale={esc(kCasita)}><Fundido g={g.casita} m={m} /></group>}
        {kPredio > 0.001 && <group scale={esc(kPredio)}><Fundido g={g.predio} m={m} luzJanelas="vidroAceso" /></group>}
        {/* arvores: canteiro e parque (estacoes do arvores.tsx), a muda ao lado do banco e a floresta que brota em 110,4 */}
        <Floresta lista={fim ? ARVORES_RUA_FIM : ARVORES_RUA} t={t} folhas={est.folhas} cor={est.cor} cor2={est.cor2} neve={est.neve} />
        {kMuda > 0.001 && <group position={MUDA} scale={kMuda}>
          <ArvoreCrescendo especie="Oak" semente={77} t={t} c={cMuda} alturaMin={2.1} alturaMax={11} folhas={est.folhas} cor={est.cor} cor2={est.cor2} neve={est.neve} />
        </group>}
        {!fim && t >= 110.3 && <Floresta lista={florestaPerto()} t={t} folhas={est.folhas} cor={est.cor} cor2={est.cor2} neve={est.neve} />}
        <Pedestres t={t} />
        {!fim && t >= 16.5 && t < 18.8 && <Fantasmas t={t} />}
        <Carros t={t} noite={noite} />
        {!fim && <Listras t={t} noite={noite} />}
      </>}
      {/* luz do poste: spot quente no chao + halo na lampada */}
      {poste > 0.001 && kFixos > 0.001 && <>
        {mostraTudo && <spotLight position={LAMPADA.toArray()} angle={1.0} penumbra={0.7} decay={2} intensity={poste * (fim ? 30 : 25 + 70 * noite)} color="#ffb769"
          target-position={[LAMPADA.x - 0.5, 0, LAMPADA.z]} />}
        <sprite position={[LAMPADA.x, LAMPADA.y - 0.1, LAMPADA.z]} scale={fim && t < 528.8 ? [1.1, 1.1, 1] : [0.7 + 0.5 * noite, 0.7 + 0.5 * noite, 1]} renderOrder={20}>
          <spriteMaterial map={placas.halo} color={new THREE.Color('#ffb768').multiplyScalar(fim ? 2.4 : 0.4 + 1.5 * noite)} transparent depthWrite={false} depthTest={!(fim && t < 530)} blending={THREE.AdditiveBlending} opacity={poste} />
        </sprite>
        {/* os outros postes da rua: halos menores */}
        {mostraTudo && POSTES.slice(1).filter(([, z]) => z > -300 && z < 40).map(([x, z, lado], k) => (
          <sprite key={k} position={[x + lado * Math.abs(LAMPADA.x - POSTE[0]), LAMPADA.y - 0.1, z]} scale={[0.9 + 0.6 * noite, 0.9 + 0.6 * noite, 1]} renderOrder={20}>
            <spriteMaterial map={placas.halo} color={new THREE.Color('#ffb768').multiplyScalar(0.3 + 1.4 * noite)} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={poste} />
          </sprite>))}
      </>}
      {fim && t < 528.8 && poste > 0.001 && <mesh position={[LAMPADA.x, LAMPADA.y - 0.08, LAMPADA.z]}><sphereGeometry args={[0.09, 16, 12]} /><meshBasicMaterial color={new THREE.Color('#ffb05a').multiplyScalar(6 * poste)} /></mesh>}
      {/* fade-in da rua no fim: cupula preta em volta do olho (a lampada fica por cima) */}
      {preto > 0.001 && mostraTudo && <mesh position={[0, 1.7, 0]} renderOrder={10}>
        <sphereGeometry args={[2.5, 24, 16]} /><meshBasicMaterial color="#000000" side={THREE.BackSide} transparent opacity={preto} depthTest={false} depthWrite={false} />
      </mesh>}
    </>
  );
};

// ---------- look ----------
const CACHE_PERFIL = new Map<string, Perfil>();
const q = (x: number, n = 12) => Math.round(x * n) / n;
export const perfilRua = (t: number): Perfil => {
  const fim = t >= T_FIM;
  const l = luzEm(fim ? 6.5 : t);
  const dia = q(fim && t < 528.8 ? 0 : l.dia, 8);
  const neve = q(estacao(t).neve, 4);
  // nevoa: cor do horizonte (ambiente puxado para o sol); raios quando o sol esta baixo na frente (-z)
  const cor = fim && t < 528.8 ? new THREE.Color(0, 0, 0) : corHorizonte(fim ? 6.5 : t);
  const cq = [q(cor.r), q(cor.g), q(cor.b)];
  const solFrente = l.sol.z < 0 && l.sol.y > -0.02 && l.sol.y < 0.35 ? 1 : 0;
  const raios = fim && t < 528.8 ? 0 : solFrente ? 0.42 : t >= 41 && t < 117 ? 0.22 : 0;
  // 64-117: nevoa leve para nao desbotar o skyline a 1,5 km nem as silhuetas do apagao (pedido do agente Cidade)
  const cidade = t >= 64 && t < 117;
  const chave = [cq.join(','), dia, neve, raios, cidade].join('|');
  const c = CACHE_PERFIL.get(chave);
  if (c) return c;
  const p: Perfil = {bloom: 0.5, limiar: 0.88 + neve * 0.12, saturacao: -0.04, contraste: 0.06, vinheta: 0.38,
    nevoa: {cor: new THREE.Color(cq[0], cq[1], cq[2]), densidade: cidade ? 0.0006 : 0.0016, max: cidade ? 0.4 : 0.62}, raios};
  CACHE_PERFIL.set(chave, p);
  return p;
};
