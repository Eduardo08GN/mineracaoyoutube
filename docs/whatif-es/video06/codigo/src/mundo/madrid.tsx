// Capitulo 5 (74,9-103,9 do original): Times Square vira MADRID, Gran Via vista da Plaza del Callao (40,4 N).
// Plano A (74,9-97,8): camera no alto da escadaria de granito da praca, olhando a Gran Via. Telões animados (anuncios genericos ->
// "ULTIMA HORA" 80,6 -> mapa "AQUI" 86 -> "EVACUACION" 92,6), taxis brancos com a faixa vermelha, onibus vermelhos, multidao andando e
// depois correndo; a PAREDE DE AGUA aparece no fim da avenida (90,5), cresce entre os predios, engole carros e gente, e o spray toma o
// quadro (96,7-97,7). Corte seco em 97,8. Plano B (97,8-103,9): camera baixa na faixa de pedestres, grande-angular, o ceu virou um TETO
// DE AGUA com estrias correndo para o ponto de fuga; cardume passando por cima (99,8). Tudo e funcao de t (sem relogio, sem acumulo).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {useTexture} from '@react-three/drei';
import {staticFile} from 'remotion';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {Perfil} from '../look/Look';
import {camEm, ChaveCam} from '../roteiro';
import {CeuLugar, corHorizonte, luzEm} from './ceu';
import {Multidao3D, Pessoa3D, Estado3D} from './pessoas';
import {rnd, smooth, clamp01} from './comum';

// ======================================================================================================================
// tempo dos eventos
// ======================================================================================================================
const T0 = 74.9, T_CORTE = 97.8, T_ALERTA = 80.6, T_MAPA = 86.0, T_EVAC = 92.6, T_CORRE = 91.3;
const planoB = (t: number) => t >= T_CORTE;
// frente da onda (z, a camera do plano A esta em z=38): longe e rapida, freando perto da camera
export const frenteOnda = (t: number) => { const u = clamp01((t - 90.4) / 7.6); return -2000 + 2040 * (1 - Math.pow(1 - u, 2)); };
export const alturaOnda = (t: number) => 50 + 95 * smooth(90.4, 96.8, t);
const labioOnda = (t: number) => alturaOnda(t) * (0.03 + 0.09 * smooth(92, 96.5, t));
const ondaVisivel = (t: number) => t >= 90.3 && t < T_CORTE;
const Y_TETO = 58;

// ======================================================================================================================
// fontes (OFL, em public/madrid/fontes): carregadas por Suspense antes do primeiro quadro (o ThreeCanvas espera)
// ======================================================================================================================
const FONTES: [string, string, FontFaceDescriptors?][] = [
  ['MAnton', 'madrid/fontes/Anton-Regular.ttf'], ['MBebas', 'madrid/fontes/BebasNeue-Regular.ttf'],
  ['MOswald', 'madrid/fontes/Oswald-Var.ttf', {weight: '200 700'}], ['MPacifico', 'madrid/fontes/Pacifico-Regular.ttf'],
];
let fontesOk = false; let fontesP: Promise<void> | null = null;
const useFontes = () => {
  if (fontesOk) return;
  if (!fontesP) fontesP = Promise.all(FONTES.map(([n, a, d]) => new FontFace(n, `url(${staticFile(a)})`, d).load().then((f) => { (document.fonts as any).add(f); })))
    .then(() => { fontesOk = true; }, () => { fontesOk = true; });
  throw fontesP;
};

// ======================================================================================================================
// texturas de canvas (uma vez)
// ======================================================================================================================
const novoCanvas = (w: number, h: number) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
const texDe = (cv: HTMLCanvasElement, repetir = true) => {
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repetir) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; return t;
};
const ruido = (c: CanvasRenderingContext2D, w: number, h: number, n: number, a: number, semente: number) => {
  for (let i = 0; i < n; i++) {
    const v = rnd(semente + i); c.fillStyle = v < 0.5 ? `rgba(0,0,0,${a * rnd(semente + i + 7)})` : `rgba(255,255,255,${a * rnd(semente + i + 9)})`;
    c.fillRect(rnd(semente + i + 3) * w, rnd(semente + i + 5) * h, 1 + rnd(semente + i + 11) * 3, 1 + rnd(semente + i + 13) * 3);
  }
};

// fachada: ladrilho de 12 m x 7,2 m (3 vaos, 2 andares de 3,6 m). 6 estilos da Gran Via.
const FACH_W = 12, FACH_H = 7.2;
const ESTILOS = ['clasico', 'ladrillo', 'racional', 'blanco', 'ocre', 'granito'] as const;
const fachada = (est: number) => {
  const W = 1024, H = 640, cv = novoCanvas(W, H), c = cv.getContext('2d')!;
  const mx = W / 12, my = H / 7.2;
  const fundo = ['#e2d2b0', '#a4573d', '#dcd5c8', '#eeeae2', '#d3a467', '#a9a7a2'][est];
  c.fillStyle = fundo; c.fillRect(0, 0, W, H);
  if (est === 1) { // tijolo
    for (let j = 0; j < H / 12; j++) for (let i = 0; i < W / 36 + 1; i++) {
      const v = 0.85 + rnd(i * 31 + j * 7) * 0.25; c.fillStyle = `rgb(${Math.round(168 * v)},${Math.round(86 * v)},${Math.round(60 * v)})`;
      c.fillRect(i * 36 - (j % 2) * 18 + 1, j * 12 + 1, 34, 10);
    }
  }
  ruido(c, W, H, 9000, 0.06, est * 1000);
  const pedra = ['#efe5cf', '#e9dfc8', '#e7e2d8', '#f7f5f0', '#f1e6d2', '#c4c2bd'][est];
  for (let f = 0; f < 2; f++) {
    const yT = f * 320, yB = yT + 320;
    // cornija de andar
    c.fillStyle = pedra; c.fillRect(0, yT, W, 16); c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(0, yT + 16, W, 5);
    if (est === 2) { // racional: janela em fita
      const y0 = yB - 2.3 * my, y1 = yB - 0.8 * my;
      c.fillStyle = '#c9c3b6'; c.fillRect(0, y1, W, 10);
      const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#71859a'); g.addColorStop(1, '#1d2732');
      c.fillStyle = g; c.fillRect(10, y0, W - 20, y1 - y0);
      c.fillStyle = '#2a2a2a'; for (let k = 0; k <= 12; k++) c.fillRect(10 + k * (W - 20) / 12 - 3, y0, 6, y1 - y0);
      c.fillRect(10, y0 + (y1 - y0) * 0.3, W - 20, 4);
      continue;
    }
    if (est === 0) for (let b = 0; b <= 3; b++) { c.fillStyle = 'rgba(255,250,235,0.35)'; c.fillRect(b * W / 3 - 14, yT + 21, 28, 299); }
    const nj = est === 5 ? 4 : 1;
    for (let b = 0; b < 3; b++) for (let q = 0; q < nj; q++) {
      const cx = est === 5 ? (b * 4 + q + 0.5) * W / 12 : (b + 0.5) * W / 3;
      const ww = (est === 5 ? 0.85 : est === 3 ? 1.45 : 1.3) * mx, hh = (est === 3 ? 2.6 : est === 5 ? 2.2 : 2.3) * my;
      const yb = yB - (est === 3 ? 0.35 : 0.7) * my, yt = yb - hh, x0 = cx - ww / 2;
      // moldura de pedra
      if (est !== 5) { c.fillStyle = pedra; c.fillRect(x0 - 14, yt - 14, ww + 28, hh + 24); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x0 - 14, yb + 10, ww + 28, 4); }
      if (est === 0 && f === 0) { c.fillStyle = pedra; c.beginPath(); c.moveTo(x0 - 24, yt - 14); c.lineTo(cx, yt - 52); c.lineTo(x0 + ww + 24, yt - 14); c.fill();
        c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 3; c.stroke(); }
      // vidro
      c.save(); c.beginPath();
      if (est === 4) { c.moveTo(x0, yb); c.lineTo(x0, yt + ww / 2); c.arc(cx, yt + ww / 2, ww / 2, Math.PI, 0); c.lineTo(x0 + ww, yb); c.closePath(); }
      else c.rect(x0, yt, ww, hh);
      c.clip();
      const g = c.createLinearGradient(x0, yt, x0 + ww * 0.6, yb);
      const r = rnd(est * 97 + f * 13 + b * 7 + q);
      g.addColorStop(0, r < 0.5 ? '#8396ab' : '#6d8197'); g.addColorStop(0.45, '#33424f'); g.addColorStop(1, '#161d25');
      c.fillStyle = g; c.fillRect(x0, yt, ww, hh);
      c.fillStyle = 'rgba(255,255,255,0.10)'; c.beginPath(); c.moveTo(x0 + ww * 0.15, yt); c.lineTo(x0 + ww * 0.45, yt); c.lineTo(x0 + ww * 0.05, yb); c.lineTo(x0 - ww * 0.25, yb); c.fill();
      // persiana meio baixada
      if (r > 0.62 && est !== 5) { const ph = hh * (0.2 + rnd(r * 100) * 0.5); c.fillStyle = est === 3 ? '#4c6a52' : '#c8b48c'; c.fillRect(x0, yt, ww, ph);
        c.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = yt; y < yt + ph; y += 7) c.fillRect(x0, y, ww, 2); }
      c.restore();
      // caixilho
      c.fillStyle = est === 5 ? '#3b3f44' : '#f4f1ea';
      c.fillRect(x0, yt, ww, 6); c.fillRect(x0, yb - 6, ww, 6); c.fillRect(x0, yt, 6, hh); c.fillRect(x0 + ww - 6, yt, 6, hh);
      c.fillRect(cx - 3, yt, 6, hh); c.fillRect(x0, yt + hh * 0.28, ww, 5);
      // venezianas verdes abertas (blanco)
      if (est === 3) { c.fillStyle = '#3f5f4a'; c.fillRect(x0 - 50, yt, 34, hh); c.fillRect(x0 + ww + 16, yt, 34, hh);
        c.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = yt; y < yb; y += 9) { c.fillRect(x0 - 50, y, 34, 2); c.fillRect(x0 + ww + 16, y, 34, 2); } }
      // balcao de ferro
      const temBalcao = est === 0 || est === 3 || (est === 1 && f === 1) || (est === 4 && f === 0);
      if (temBalcao) {
        const bx0 = est === 3 ? 0 : x0 - 30, bx1 = est === 3 ? W : x0 + ww + 30, by = yb + 4;
        c.fillStyle = pedra; c.fillRect(bx0, by, bx1 - bx0, 12); c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(bx0, by + 12, bx1 - bx0, 5);
        c.fillStyle = '#1b1c1e'; const top = by - 0.95 * my;
        c.fillRect(bx0, top, bx1 - bx0, 5); c.fillRect(bx0, by - 18, bx1 - bx0, 3);
        for (let x = bx0 + 4; x < bx1; x += 9) c.fillRect(x, top, 2.5, by - top);
      }
    }
  }
  return texDe(cv);
};

// terreo: 2 fileiras x 4 lojas, cada loja 12 m x 5,5 m
const LOJA_W = 12, LOJA_H = 11;
const LOJAS = ['CAFETERÍA', 'MODA', 'LIBRERÍA', 'FARMACIA', 'ZAPATERÍA', 'JOYERÍA', 'PERFUMERÍA', 'CHURRERÍA'];
const CORES_LOJA = ['#7b2d26', '#1f2f4a', '#2f4a2f', '#0f6b3a', '#5a3b22', '#1b1b1b', '#6a2c5a', '#a8641a'];
const lojas = () => {
  const W = 2048, H = 1024, cv = novoCanvas(W, H), c = cv.getContext('2d')!;
  c.fillStyle = '#d6cab1'; c.fillRect(0, 0, W, H); ruido(c, W, H, 12000, 0.07, 777);
  for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) {
    const i = r * 4 + k, x0 = k * 512, y0 = r * 512;
    c.fillStyle = CORES_LOJA[i]; c.fillRect(x0 + 30, y0 + 36, 452, 84);
    c.fillStyle = i === 3 ? '#e9fff0' : '#f3e2b0'; c.font = '600 54px MOswald'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(LOJAS[i], x0 + 256, y0 + 80);
    if (i === 3) { c.fillStyle = '#21d36a'; c.fillRect(x0 + 52, y0 + 60, 40, 12); c.fillRect(x0 + 66, y0 + 46, 12, 40); }
    let gy = y0 + 132;
    if (i % 3 === 0) { // toldo listrado
      for (let s = 0; s < 14; s++) { c.fillStyle = s % 2 ? '#f2efe6' : CORES_LOJA[i]; c.fillRect(x0 + 30 + s * 452 / 14, y0 + 126, 452 / 14 + 1, 46); }
      c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x0 + 30, y0 + 172, 452, 8); gy = y0 + 180;
    }
    const g = c.createLinearGradient(0, gy, 0, y0 + 492); g.addColorStop(0, '#f6dfae'); g.addColorStop(0.6, '#d6a565'); g.addColorStop(1, '#8a5b2c');
    c.fillStyle = g; c.fillRect(x0 + 40, gy, 432, y0 + 492 - gy);
    for (let m = 0; m < 7; m++) { // vitrine: objetos/manequins
      const mxp = x0 + 60 + m * 60 + rnd(i * 17 + m) * 20, hh = 60 + rnd(i * 11 + m) * 120;
      c.fillStyle = `hsl(${Math.round(rnd(i * 5 + m) * 360)},35%,${30 + rnd(i + m) * 30}%)`; c.fillRect(mxp, y0 + 492 - hh, 26 + rnd(m + i) * 20, hh);
    }
    c.fillStyle = 'rgba(255,255,255,0.13)'; c.beginPath(); c.moveTo(x0 + 80, gy); c.lineTo(x0 + 200, gy); c.lineTo(x0 + 120, y0 + 492); c.lineTo(x0 + 10, y0 + 492); c.fill();
    c.fillStyle = '#2a2622'; c.fillRect(x0 + 40, gy, 432, 6); c.fillRect(x0 + 252, gy, 8, y0 + 492 - gy); c.fillRect(x0 + 40, gy, 6, y0 + 492 - gy); c.fillRect(x0 + 466, gy, 6, y0 + 492 - gy);
    c.fillStyle = 'rgba(25,20,15,0.55)'; c.fillRect(x0 + 216, gy + 40, 80, y0 + 492 - gy - 40);
    c.fillStyle = '#4a4744'; c.fillRect(x0, y0 + 492, 512, 20);
  }
  return texDe(cv);
};

const lajotas = (W: number, nx: number, ny: number, base: [number, number, number], vari: number, semente: number, junta = 'rgba(60,55,50,0.55)') => {
  const cv = novoCanvas(W, W), c = cv.getContext('2d')!, sx = W / nx, sy = W / ny;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const v = 1 - vari / 2 + rnd(semente + i * 131 + j) * vari;
    c.fillStyle = `rgb(${Math.round(base[0] * v)},${Math.round(base[1] * v)},${Math.round(base[2] * v)})`; c.fillRect(i * sx, j * sy, sx, sy);
  }
  ruido(c, W, W, 14000, 0.09, semente);
  c.fillStyle = junta; for (let i = 0; i <= nx; i++) c.fillRect(i * sx - 1, 0, 2, W); for (let j = 0; j <= ny; j++) c.fillRect(0, j * sy - 1, W, 2);
  return texDe(cv);
};
const asfalto = () => {
  const W = 512, cv = novoCanvas(W, W), c = cv.getContext('2d')!;
  c.fillStyle = '#45484d'; c.fillRect(0, 0, W, W);
  for (let i = 0; i < 26; i++) { c.fillStyle = `rgba(${rnd(i) < 0.5 ? '20,20,22' : '90,92,96'},${0.08 + rnd(i + 1) * 0.1})`; c.beginPath();
    c.ellipse(rnd(i + 2) * W, rnd(i + 3) * W, 20 + rnd(i + 4) * 70, 10 + rnd(i + 5) * 40, rnd(i + 6) * 3, 0, Math.PI * 2); c.fill(); }
  ruido(c, W, W, 26000, 0.12, 4242);
  return texDe(cv);
};

// ======================================================================================================================
// acumulador de geometria (posicao, normal, uv em metros, cor por vertice)
// ======================================================================================================================
class Acum {
  p: number[] = []; n: number[] = []; uv: number[] = []; cor: number[] = [];
  quad(a: number[], b: number[], c: number[], d: number[], n: number[], uv: number[][], cor: THREE.Color) {
    for (const [v, w] of [[a, uv[0]], [b, uv[1]], [c, uv[2]], [a, uv[0]], [c, uv[2]], [d, uv[3]]] as [number[], number[]][]) {
      this.p.push(v[0], v[1], v[2]); this.n.push(n[0], n[1], n[2]); this.uv.push(w[0], w[1]); this.cor.push(cor.r, cor.g, cor.b);
    }
  }
  // caixa com uv em metros (tw x th por ladrilho); faces: '+x','-x','+z','-z','top'
  caixa(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, tw: number, th: number, cor: THREE.Color, uo = 0, vo = 0, faces = 'xXzZt') {
    const v0 = vo, v1 = vo + (y1 - y0) / th;
    if (faces.includes('X')) this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], [[uo, v0], [uo + (z1 - z0) / tw, v0], [uo + (z1 - z0) / tw, v1], [uo, v1]], cor);
    if (faces.includes('x')) this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], [[uo, v0], [uo + (z1 - z0) / tw, v0], [uo + (z1 - z0) / tw, v1], [uo, v1]], cor);
    if (faces.includes('Z')) this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], [[uo, v0], [uo + (x1 - x0) / tw, v0], [uo + (x1 - x0) / tw, v1], [uo, v1]], cor);
    if (faces.includes('z')) this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], [[uo, v0], [uo + (x1 - x0) / tw, v0], [uo + (x1 - x0) / tw, v1], [uo, v1]], cor);
    if (faces.includes('t')) this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], [[x0 / tw, z1 / tw], [x1 / tw, z1 / tw], [x1 / tw, z0 / tw], [x0 / tw, z0 / tw]], cor);
  }
  geo(extra: THREE.BufferGeometry[] = []) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.cor, 3));
    if (!extra.length) return g;
    return mergeGeometries([g, ...extra.map((e) => (e.index ? e.toNonIndexed() : e))]) ?? g;
  }
}
const comCor = (g: THREE.BufferGeometry, cor: THREE.ColorRepresentation) => {
  const c = new THREE.Color(cor), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  return g.index ? g.toNonIndexed() : g;
};
const escalaUV = (g: THREE.BufferGeometry, su: number, sv: number) => { const uv = g.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return g; };

// ======================================================================================================================
// cidade: Gran Via (eixo -z), faces dos predios em |x| = 17, praca do Callao (|x| <= 30) para z > -15
// ======================================================================================================================
type Predio = {lado: number; z0: number; z1: number; h: number; est: number; tom: number; cupula: boolean; fundo?: number};
const RUA = 12, FACE = 17, FUNDO_PREDIO = 28, TERREO = 5.5;
const gerarPredios = (): Predio[] => {
  const out: Predio[] = [];
  for (const lado of [-1, 1]) {
    let z = -15, k = 0, desdeRua = 0;
    while (z > -760) {
      k++;
      if (lado < 0 && z <= -15 && z > -45) { z = -45; continue; }                        // Palacio de la Prensa (especial)
      if (lado > 0 && z <= -15 && z > -45) { z = -45; continue; }                        // edificio das telas do Callao (especial)
      if (lado < 0 && z <= -112 && z > -200) { z = -200; continue; }                     // Jacometrezo + Edificio Carrion (especial)
      if (desdeRua > 110 && rnd(lado * 71 + k * 3) < 0.35) { z -= 10; desdeRua = 0; out[out.length - 1].cupula = rnd(k * 5 + lado) < 0.8; continue; }
      let w = Math.min(14 + rnd(lado * 13 + k) * 18, z + 760 > 10 ? 99 : 10);
      if (lado < 0 && z > -112 && z - w < -112) w = z + 112;
      const andares = 6 + Math.floor(rnd(lado * 29 + k * 7) * 5);
      out.push({lado, z0: z - w, z1: z, h: TERREO + andares * 3.6, est: Math.floor(rnd(lado * 41 + k * 11) * 5.6), tom: 0.88 + rnd(k * 17 + lado) * 0.22, cupula: false});
      z -= w; desdeRua += w;
    }
  }
  return out;
};

type Tela = {c: [number, number, number]; ry: number; h: number; k: number; arco?: boolean};
// desenhos do atlas de telões (4 x 4 celulas de 512 px; a = largura/altura do desenho)
const DES = [
  {id: 'cine', a: 1.5}, {id: 'musical', a: 1.33}, {id: 'rebajas', a: 2}, {id: 'reloj', a: 2},
  {id: 'abierto', a: 1}, {id: 'verano', a: 1}, {id: 'estanoche', a: 3}, {id: 'proximamente', a: 1.33},
  {id: 'lamCine', a: 0.28}, {id: 'lamHotel', a: 0.28}, {id: 'lamTeatro', a: 0.28}, {id: 'letrero', a: 4},
  {id: 'moda', a: 0.75}, {id: 'entradas', a: 1.5}, {id: 'tapas', a: 2}, {id: 'callao', a: 1.4},
];
const SEM_ALERTA = new Set([3, 8, 9, 10, 11, 14]);
const ORDEM_ALERTA = [0, 4, 15, 1, 7, 5, 12, 13, 2, 6];
const ATLAS = 2048, CEL = 512;
const rectCel = (k: number) => {
  const a = DES[k].a, w = a >= 1 ? CEL : CEL * a, h = a >= 1 ? CEL / a : CEL;
  return {x: (k % 4) * CEL + (CEL - w) / 2, y: Math.floor(k / 4) * CEL + (CEL - h) / 2, w, h};
};

const telasLista = (): Tela[] => {
  const T: Tela[] = [];
  const fac = (lado: number, z: number, y: number, h: number, k: number) => {
    const w = h * DES[k].a, ry = lado > 0 ? -1.2566 : 1.2566;  // 72 graus: de frente para a rua, virado 18 graus para a praca
    T.push({c: [lado * (FACE - 0.35 - 0.155 * w), y, z], ry, h, k});
  };
  const lam = (lado: number, z: number, y: number, h: number, k: number) => T.push({c: [lado * (FACE - 0.2 - h * DES[k].a / 2), y, z], ry: 0, h, k});
  // lado direito (x > 0)
  ([[-50, 11, 7, 0], [-51, 19.5, 6, 4], [-66, 9.5, 4.5, 2], [-68, 17, 8, 12], [-86, 12, 7, 1], [-104, 9.5, 3.6, 6], [-106, 17, 7, 5], [-126, 12, 6, 13],
    [-150, 10, 4.5, 2], [-152, 18, 7, 7], [-176, 13, 7, 0], [-200, 12, 6, 4], [-226, 13, 7, 1], [-256, 12, 6, 13], [-290, 12, 5, 6], [-320, 13, 6, 5]] as number[][])
    .forEach(([z, y, h, k]) => fac(1, z, y, h, k));
  ([[-58, 11, 7, 7], [-60, 20, 6, 4], [-78, 9.5, 3.6, 6], [-82, 17, 7, 5], [-100, 12, 7, 0], [-104, 20.5, 4.5, 2],
    [-214, 12, 7, 12], [-240, 12, 6, 1], [-268, 12, 6, 5], [-300, 13, 6, 0], [-330, 12, 5, 13]] as number[][])
    .forEach(([z, y, h, k]) => fac(-1, z, y, h, k));
  // lambreques verticais (perpendiculares a fachada, de frente para a camera)
  lam(1, -40, 15, 9, 8); lam(1, -96, 15, 9, 10); lam(1, -162, 15, 9, 9); lam(-1, -72, 15, 9, 9); lam(-1, -208, 15, 9, 8); lam(-1, -96, 16, 8, 10);
  // praca: telas grandes do Callao (predio da direita, face z = -15), Palacio de la Prensa (CINE vertical), laterais da praca
  T.push({c: [23.5, 11.6, -14.6], ry: 0, h: 8.4, k: 15});
  T.push({c: [23.5, 22.4, -14.6], ry: 0, h: 7.5, k: 7});
  T.push({c: [-23.5, 21, -14.6], ry: 0, h: 20, k: 8});
  T.push({c: [29.2 - 0.155 * 12.6, 12, 2], ry: -1.2566, h: 9, k: 15});
  T.push({c: [29.2 - 0.155 * 7, 22.5, 4], ry: -1.2566, h: 7, k: 1});
  T.push({c: [-(29.2 - 0.155 * 14), 11, 4], ry: 1.2566, h: 7, k: 14});
  T.push({c: [-(29.2 - 0.155 * 9), 20, 2], ry: 1.2566, h: 4.5, k: 3});
  // letreiro curvo no alto da proa do Edificio Carrion
  T.push({c: [-26, 61.3, -143], ry: 0, h: 5.5, k: 11, arco: true});
  return T;
};

// geometria dos telões: um quad (ou arco) por tela, uv apontando para a celula do atlas; e as molduras
const geoTelas = (T: Tela[]) => {
  const geos: THREE.BufferGeometry[] = [], mold = new Acum(), escuro = new THREE.Color('#1a1b1e');
  for (const s of T) {
    const r = rectCel(s.k), u0 = (r.x + 2) / ATLAS, u1 = (r.x + r.w - 2) / ATLAS, v0 = 1 - (r.y + r.h - 2) / ATLAS, v1 = 1 - (r.y + 2) / ATLAS;
    let g: THREE.BufferGeometry;
    if (s.arco) { g = new THREE.CylinderGeometry(12, 12, s.h, 40, 1, true, -0.785, 1.85); }   // virado para a praca
    else g = new THREE.PlaneGeometry(s.h * DES[s.k].a, s.h);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
    g.rotateY(s.ry); g.translate(s.c[0], s.c[1], s.c[2]);
    geos.push(g.index ? g.toNonIndexed() : g);
    if (!s.arco) { // moldura: caixa fina atras da tela
      const w = s.h * DES[s.k].a + 0.5, b = new THREE.BoxGeometry(w, s.h + 0.5, 0.3);
      b.translate(0, 0, -0.2); b.rotateY(s.ry); b.translate(s.c[0], s.c[1], s.c[2]);
      geos.push(comCor(b, escuro));
    }
  }
  const telas = mergeGeometries(geos.filter((g) => !g.attributes.color)) as THREE.BufferGeometry;
  const molduras = mergeGeometries(geos.filter((g) => !!g.attributes.color).map((g) => { g.deleteAttribute('uv'); return g; })) as THREE.BufferGeometry;
  void mold;
  return {telas, molduras};
};

// ======================================================================================================================
// desenho dos telões (canvas 2048 x 2048, redesenhado a cada quadro em funcao de t)
// ======================================================================================================================
type R = {x: number; y: number; w: number; h: number};
const cabe = (c: CanvasRenderingContext2D, s: string, fam: string, maxW: number, maxH: number, peso = '') => {
  c.font = `${peso} 100px ${fam}`; const w = c.measureText(s).width || 1;
  return Math.min(maxH, (100 * maxW) / w);
};
const texto = (c: CanvasRenderingContext2D, s: string, fam: string, x: number, y: number, maxW: number, maxH: number, cor: string, peso = '', brilho = 0) => {
  const tam = cabe(c, s, fam, maxW, maxH, peso);
  c.font = `${peso} ${tam}px ${fam}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  if (brilho > 0) { c.shadowColor = cor; c.shadowBlur = brilho; }
  c.fillStyle = cor; c.fillText(s, x, y); c.shadowBlur = 0;
  return tam;
};
const fundoGrad = (c: CanvasRenderingContext2D, r: R, cores: string[], ang: number) => {
  const cx = r.w / 2, cy = r.h / 2, L = Math.max(r.w, r.h) * 0.75;
  const g = c.createLinearGradient(cx - Math.cos(ang) * L, cy - Math.sin(ang) * L, cx + Math.cos(ang) * L, cy + Math.sin(ang) * L);
  cores.forEach((k, i) => g.addColorStop(i / (cores.length - 1), k)); c.fillStyle = g; c.fillRect(0, 0, r.w, r.h);
};
const seta = (c: CanvasRenderingContext2D, x: number, y: number, s: number, cor: string) => {
  c.fillStyle = cor; c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s * 0.7, y - s * 0.2); c.lineTo(x + s * 0.28, y - s * 0.2); c.lineTo(x + s * 0.28, y + s);
  c.lineTo(x - s * 0.28, y + s); c.lineTo(x - s * 0.28, y - s * 0.2); c.lineTo(x - s * 0.7, y - s * 0.2); c.closePath(); c.fill();
};
// contorno simplificado da Peninsula Iberica (lon, lat)
const IBERIA = [[-9.3, 43.2], [-8.0, 43.7], [-5.8, 43.6], [-3.8, 43.5], [-1.8, 43.4], [0.0, 42.7], [3.2, 42.4], [3.2, 41.9], [2.0, 41.3], [0.8, 40.7], [0.0, 39.9],
  [-0.3, 39.4], [0.2, 38.8], [-0.7, 37.6], [-1.6, 37.0], [-2.2, 36.7], [-4.4, 36.7], [-5.6, 36.0], [-6.3, 36.8], [-7.4, 37.2], [-8.9, 37.0], [-8.8, 38.7],
  [-9.5, 38.8], [-8.9, 40.2], [-8.7, 41.8]];

const desenhaAlerta = (c: CanvasRenderingContext2D, r: R, t: number, k: number) => {
  const S = Math.min(r.w, r.h);
  if (t >= T_EVAC) { // fase 3: EVACUACION piscando
    const pisca = Math.floor((t - T_EVAC) * 5 + k * 0.5) % 2 === 0;
    c.fillStyle = pisca ? '#d4161b' : '#f4f1ea'; c.fillRect(0, 0, r.w, r.h);
    c.save(); c.beginPath(); c.rect(0, 0, r.w, r.h); c.rect(S * 0.07, S * 0.07, r.w - S * 0.14, r.h - S * 0.14); c.clip('evenodd');
    for (let i = -20; i < 40; i++) { c.fillStyle = i % 2 ? '#111' : '#f2c21b'; c.beginPath(); const x = i * S * 0.08 + ((t * 60) % (S * 0.16));
      c.moveTo(x, 0); c.lineTo(x + S * 0.08, 0); c.lineTo(x + S * 0.08 - r.h, r.h); c.lineTo(x - r.h, r.h); c.fill(); }
    c.restore();
    texto(c, 'EVACUACIÓN', 'MAnton', r.w / 2, r.h * 0.44, r.w * 0.8, r.h * 0.4, pisca ? '#ffffff' : '#c3141a');
    texto(c, '¡ALÉJESE DE LA AVENIDA!', 'MOswald', r.w / 2, r.h * 0.74, r.w * 0.78, r.h * 0.13, pisca ? '#ffe9a8' : '#111111', '600');
    return;
  }
  if (t >= T_MAPA + (k % 5) * 0.15) { // fase 2: mapa, o mar subindo para o norte, MADRID = AQUI
    c.fillStyle = '#0c3d63'; c.fillRect(0, 0, r.w, r.h);
    const banda = r.h * 0.17; c.fillStyle = '#c8161d'; c.fillRect(0, 0, r.w, banda);
    texto(c, 'HACIA AQUÍ', 'MAnton', r.w / 2, banda * 0.52, r.w * 0.8, banda * 0.75, '#ffffff');
    const mw = r.w * 0.92, mh = r.h - banda - S * 0.06, sc = Math.min(mw / 14, mh / 9.2), ox = r.w / 2 - 7 * sc, oy = banda + S * 0.03 + (mh - 9.2 * sc) / 2;
    const P = (lon: number, lat: number) => [ox + (lon + 10) * sc, oy + (44.2 - lat) * sc];
    // mar animado (linhas subindo)
    c.strokeStyle = 'rgba(120,200,255,0.35)'; c.lineWidth = Math.max(1, sc * 0.08);
    for (let i = 0; i < 12; i++) { const y = oy + ((i * 0.8 - (t - T_MAPA) * 1.6) % 9.6 + 9.6) % 9.6 * sc; c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= r.w; x += 8) c.lineTo(x, y + Math.sin(x * 0.05 + i) * sc * 0.12); c.stroke(); }
    c.fillStyle = '#e9dcb8'; c.beginPath(); IBERIA.forEach(([lo, la], i) => { const [x, y] = P(lo, la); if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.closePath(); c.fill();
    c.strokeStyle = '#7d6b45'; c.lineWidth = Math.max(1, sc * 0.06); c.stroke();
    // setas vindo do sul e do Mediterraneo
    const [mxp, myp] = P(-3.7, 40.4);
    for (let i = 0; i < 5; i++) {
      const u = ((t - T_MAPA) * 0.45 + i / 5) % 1, ang = -Math.PI / 2 + (i - 2) * 0.32, d0 = sc * 5.2, d = d0 * (1 - u);
      const x = mxp - Math.cos(ang) * d, y = myp - Math.sin(ang) * d;
      c.save(); c.translate(x, y); c.rotate(ang + Math.PI / 2); c.globalAlpha = Math.min(1, u * 3) * (1 - u * 0.4); seta(c, 0, 0, sc * 0.55, '#2fc3ff'); c.restore();
    }
    c.globalAlpha = 1;
    const pulso = 0.5 + 0.5 * Math.sin((t - T_MAPA) * 7);
    c.fillStyle = `rgba(255,40,40,${0.35 * pulso})`; c.beginPath(); c.arc(mxp, myp, sc * (0.6 + 0.5 * pulso), 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ff2b2b'; c.beginPath(); c.arc(mxp, myp, sc * 0.32, 0, Math.PI * 2); c.fill();
    texto(c, 'MADRID · AQUÍ', 'MOswald', mxp, myp - sc * 0.95, sc * 6, sc * 0.9, '#ffffff', '700');
    return;
  }
  // fase 1: ULTIMA HORA, o oceano avanca para o norte
  c.fillStyle = '#0b1a33'; c.fillRect(0, 0, r.w, r.h);
  const banda = r.h * 0.2; c.fillStyle = '#c8161d'; c.fillRect(0, 0, r.w, banda);
  if (Math.floor(t * 2) % 2) { c.fillStyle = '#fff'; c.beginPath(); c.arc(banda * 0.5, banda * 0.5, banda * 0.16, 0, Math.PI * 2); c.fill(); }
  texto(c, 'ÚLTIMA HORA', 'MAnton', r.w / 2 + banda * 0.2, banda * 0.52, r.w * 0.72, banda * 0.72, '#ffffff');
  const sy = r.h * 0.55 + Math.sin(t * 5) * r.h * 0.03;
  if (r.w > r.h * 1.15) {
    texto(c, 'EL OCÉANO AVANZA', 'MAnton', r.w * 0.58, r.h * 0.43, r.w * 0.72, r.h * 0.2, '#ffffff');
    texto(c, 'HACIA EL NORTE', 'MAnton', r.w * 0.58, r.h * 0.66, r.w * 0.72, r.h * 0.2, '#ffd23a');
    seta(c, r.w * 0.12, sy, r.h * 0.2, '#2fc3ff');
  } else {
    seta(c, r.w / 2, r.h * 0.42 + Math.sin(t * 5) * r.h * 0.02, S * 0.17, '#2fc3ff');
    texto(c, 'EL OCÉANO', 'MAnton', r.w / 2, r.h * 0.67, r.w * 0.85, r.h * 0.12, '#ffffff');
    texto(c, 'AVANZA AL NORTE', 'MAnton', r.w / 2, r.h * 0.79, r.w * 0.85, r.h * 0.1, '#ffd23a');
  }
  const tick = 'LOS MARES SE DESPLAZAN HACIA LOS POLOS   ·   ';
  c.fillStyle = '#ffd23a'; c.fillRect(0, r.h * 0.9, r.w, r.h * 0.1);
  c.font = `600 ${r.h * 0.07}px MOswald`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = '#0b1a33';
  const tw = c.measureText(tick).width, off = ((t - T_ALERTA) * 90) % tw;
  for (let x = -off; x < r.w; x += tw) c.fillText(tick, x, r.h * 0.951);
};

const lampada = (c: CanvasRenderingContext2D, r: R, letras: string, cor: string, t: number, k: number) => {
  c.fillStyle = '#121214'; c.fillRect(0, 0, r.w, r.h);
  c.strokeStyle = '#3a3a3e'; c.lineWidth = 6; c.strokeRect(5, 5, r.w - 10, r.h - 10);
  // lampadas na borda, em perseguicao
  const n = 30, per = 2 * (r.w + r.h) - 40;
  for (let i = 0; i < n; i++) {
    let d = (i / n) * per, x = 0, y = 0;
    if (d < r.w - 20) { x = 10 + d; y = 12; } else if ((d -= r.w - 20) < r.h - 20) { x = r.w - 12; y = 10 + d; } else if ((d -= r.h - 20) < r.w - 20) { x = r.w - 10 - d; y = r.h - 12; } else { d -= r.w - 20; x = 12; y = r.h - 10 - d; }
    const on = (i + Math.floor(t * 8)) % 3 === 0;
    c.fillStyle = on ? '#fff3c4' : '#6d5a35'; c.beginPath(); c.arc(x, y, 4.5, 0, Math.PI * 2); c.fill();
  }
  const L = letras.split(''), lh = (r.h - 60) / L.length;
  L.forEach((ch, i) => {
    const flick = rnd(Math.floor(t * 9) * 13 + i + k * 7) < 0.04 ? 0.35 : 1;
    c.globalAlpha = flick; texto(c, ch, 'MAnton', r.w / 2, 32 + lh * (i + 0.5), r.w * 0.7, lh * 0.9, cor, '', 18); c.globalAlpha = 1;
  });
};

const desenhaCelula = (c: CanvasRenderingContext2D, k: number, t: number) => {
  const r = rectCel(k);
  c.save(); c.translate(r.x, r.y); c.beginPath(); c.rect(0, 0, r.w, r.h); c.clip();
  const ord = ORDEM_ALERTA.indexOf(k), tA = T_ALERTA + (ord < 0 ? 99 : ord * 0.55);
  if (!SEM_ALERTA.has(k) && t >= tA) {
    // plano B (debaixo d'agua): metade das telas perde o sinal
    if (planoB(t) && (k % 2 === 1)) {
      const cores = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
      cores.forEach((cc, i) => { c.fillStyle = cc; c.fillRect((i * r.w) / 7, 0, r.w / 7 + 1, r.h * 0.7); });
      c.fillStyle = '#101010'; c.fillRect(0, r.h * 0.7, r.w, r.h * 0.3);
      for (let i = 0; i < 40; i++) { const y = rnd(Math.floor(t * 15) * 41 + i + k) * r.h; c.fillStyle = `rgba(255,255,255,${0.15 + rnd(i * 3 + k) * 0.3})`; c.fillRect(0, y, r.w, 2 + rnd(i) * 4); }
      texto(c, 'SIN SEÑAL', 'MBebas', r.w / 2, r.h * 0.85, r.w * 0.7, r.h * 0.2, '#ffffff');
    } else desenhaAlerta(c, r, t, k);
    c.restore(); return;
  }
  const id = DES[k].id;
  if (id === 'cine') {
    fundoGrad(c, r, ['#1a0f3d', '#4b1560', '#120a26'], 0.3);
    for (let i = 0; i < 3; i++) { const a = -1.3 + Math.sin(t * 0.8 + i * 2.1) * 0.5; c.fillStyle = 'rgba(255,240,200,0.10)';
      c.beginPath(); c.moveTo(r.w * (0.2 + i * 0.3), r.h); c.lineTo(r.w * (0.2 + i * 0.3) + Math.cos(a - 0.12) * r.h * 1.4, r.h + Math.sin(a - 0.12) * r.h * 1.4);
      c.lineTo(r.w * (0.2 + i * 0.3) + Math.cos(a + 0.12) * r.h * 1.4, r.h + Math.sin(a + 0.12) * r.h * 1.4); c.fill(); }
    c.fillStyle = '#0a0a0a'; c.fillRect(0, 0, r.w, 34); c.fillRect(0, r.h - 34, r.w, 34);
    c.fillStyle = '#d9d2c0'; const off = (t * 80) % 40; for (let x = -off; x < r.w; x += 40) { c.fillRect(x + 8, 9, 22, 16); c.fillRect(x + 8, r.h - 25, 22, 16); }
    texto(c, 'CINE', 'MAnton', r.w / 2, r.h * 0.45, r.w * 0.7, r.h * 0.45, '#ffd56b', '', 20);
    texto(c, 'GRAN ESTRENO · 22:00', 'MOswald', r.w / 2, r.h * 0.74, r.w * 0.8, r.h * 0.11, '#ffffff', '500');
  } else if (id === 'musical') {
    fundoGrad(c, r, ['#5a0710', '#a3121f', '#3a0409'], 1.2);
    for (let i = 0; i < 60; i++) { const tw = 0.5 + 0.5 * Math.sin(t * 4 + i * 1.7); c.fillStyle = `rgba(255,225,150,${0.8 * tw})`;
      c.beginPath(); c.arc(rnd(i * 3) * r.w, rnd(i * 3 + 1) * r.h, 1.5 + 3 * tw * rnd(i), 0, Math.PI * 2); c.fill(); }
    texto(c, 'El Musical', 'MPacifico', r.w / 2, r.h * 0.4, r.w * 0.85, r.h * 0.34, '#ffd77a', '', 14);
    texto(c, '¡ÚLTIMAS SEMANAS!', 'MOswald', r.w / 2, r.h * 0.73, r.w * 0.75, r.h * 0.12, '#ffffff', '600');
  } else if (id === 'rebajas') {
    const fase = Math.floor(t * 2) % 2;
    c.fillStyle = fase ? '#ffd400' : '#e1001a'; c.fillRect(0, 0, r.w, r.h);
    texto(c, fase ? '-50%' : 'REBAJAS', 'MAnton', r.w / 2, r.h * 0.5, r.w * 0.85, r.h * 0.75, fase ? '#e1001a' : '#ffd400');
  } else if (id === 'reloj') {
    c.fillStyle = '#05080c'; c.fillRect(0, 0, r.w, r.h);
    const seg = 18 * 3600 + 42 * 60 + 7 + (t - T0), hh = Math.floor(seg / 3600) % 24, mm = Math.floor(seg / 60) % 60, ss = Math.floor(seg) % 60;
    const p = (n: number) => String(n).padStart(2, '0');
    texto(c, `${p(hh)}:${p(mm)}:${p(ss)}`, 'MBebas', r.w / 2, r.h * 0.42, r.w * 0.86, r.h * 0.62, '#bff3ff', '', 16);
    texto(c, 'MADRID   31 °C', 'MOswald', r.w / 2, r.h * 0.83, r.w * 0.6, r.h * 0.17, '#ffb347', '500');
  } else if (id === 'abierto') {
    const hue = (t * 25) % 360; fundoGrad(c, r, [`hsl(${hue},80%,78%)`, `hsl(${(hue + 70) % 360},75%,72%)`, `hsl(${(hue + 150) % 360},70%,80%)`], t * 0.4);
    texto(c, 'ABIERTO', 'MAnton', r.w / 2, r.h * 0.38, r.w * 0.8, r.h * 0.3, '#ffffff', '', 10);
    texto(c, '24 H', 'MAnton', r.w / 2, r.h * 0.68, r.w * 0.6, r.h * 0.26, '#1d2a6b');
  } else if (id === 'verano') {
    fundoGrad(c, r, ['#ffb3c7', '#ffe0a3', '#a8f0e6'], 0.8);
    for (let i = 0; i < 7; i++) { c.fillStyle = `hsla(${(i * 50 + t * 20) % 360},80%,70%,0.5)`; c.beginPath();
      c.arc(r.w * (0.5 + 0.4 * Math.sin(t * 0.6 + i * 1.3)), r.h * (0.5 + 0.4 * Math.cos(t * 0.5 + i * 2.1)), r.w * (0.12 + rnd(i) * 0.12), 0, Math.PI * 2); c.fill(); }
    texto(c, 'Verano', 'MPacifico', r.w / 2, r.h * 0.45, r.w * 0.8, r.h * 0.35, '#ffffff', '', 12);
    texto(c, 'NUEVA TEMPORADA', 'MOswald', r.w / 2, r.h * 0.75, r.w * 0.7, r.h * 0.1, '#5a2a6b', '600');
  } else if (id === 'estanoche') {
    fundoGrad(c, r, ['#ff3d7f', '#ff9a3c'], 0); const s = 'ESTA NOCHE  ·  GRAN ESTRENO  ·  ENTRADAS YA  ·  ';
    c.font = `${r.h * 0.6}px MAnton`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = '#ffffff';
    const tw = c.measureText(s).width, off = (t * 140) % tw; for (let x = -off; x < r.w; x += tw) c.fillText(s, x, r.h * 0.53);
  } else if (id === 'proximamente') {
    fundoGrad(c, r, ['#0e6e7a', '#3a2a8c', '#120b3a'], 2.2 + t * 0.2);
    const n = 3 - (Math.floor(t * 1.2) % 4);
    texto(c, 'PRÓXIMAMENTE', 'MBebas', r.w / 2, r.h * 0.35, r.w * 0.86, r.h * 0.3, '#ffffff', '', 10);
    texto(c, n > 0 ? String(n) : '¡YA!', 'MAnton', r.w / 2, r.h * 0.7, r.w * 0.5, r.h * 0.3, '#7ff7ff', '', 16);
  } else if (id === 'lamCine') lampada(c, r, 'CINE', '#ff3a3a', t, k);
  else if (id === 'lamHotel') lampada(c, r, 'HOTEL', '#4fb6ff', t, k);
  else if (id === 'lamTeatro') lampada(c, r, 'TEATRO', '#ffd23a', t, k);
  else if (id === 'letrero') {
    c.fillStyle = '#0d1320'; c.fillRect(0, 0, r.w, r.h);
    const L = 'Gran Vía'.split(''); c.font = `${r.h * 0.72}px MPacifico`; c.textAlign = 'left'; c.textBaseline = 'middle';
    const tot = c.measureText('Gran Vía').width; let x = (r.w - tot) / 2;
    L.forEach((ch, i) => { const w = c.measureText(ch).width, on = rnd(Math.floor(t * 7) * 3 + i) > 0.03;
      c.shadowColor = '#2a7bff'; c.shadowBlur = 22; c.strokeStyle = '#3b8bff'; c.lineWidth = 6; c.strokeText(ch, x, r.h * 0.52);
      c.shadowColor = '#ffe066'; c.shadowBlur = on ? 26 : 4; c.fillStyle = on ? '#fff2a0' : '#7a6a30'; c.fillText(ch, x, r.h * 0.52); x += w; });
    c.shadowBlur = 0;
  } else if (id === 'moda') {
    fundoGrad(c, r, ['#ff8fb1', '#ff9d5c', '#ffd1a1'], 1.9);
    c.fillStyle = 'rgba(40,20,40,0.85)'; const bx = r.w * 0.5 + Math.sin(t * 0.7) * r.w * 0.05;
    c.beginPath(); c.ellipse(bx, r.h * 0.3, r.w * 0.09, r.w * 0.11, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(bx - r.w * 0.16, r.h * 0.42); c.lineTo(bx + r.w * 0.16, r.h * 0.42); c.lineTo(bx + r.w * 0.24, r.h * 0.95); c.lineTo(bx - r.w * 0.24, r.h * 0.95); c.fill();
    texto(c, 'MODA', 'MAnton', r.w / 2, r.h * 0.12, r.w * 0.7, r.h * 0.14, '#ffffff');
    texto(c, 'NUEVA COLECCIÓN', 'MOswald', r.w / 2, r.h * 0.6, r.w * 0.8, r.h * 0.06, '#ffffff', '600');
  } else if (id === 'entradas') {
    fundoGrad(c, r, ['#0d5c4a', '#1aa37a'], 0.6 + Math.sin(t) * 0.3);
    c.save(); c.translate(r.w * 0.24, r.h * 0.52); c.rotate(-0.25 + Math.sin(t * 2) * 0.08); c.fillStyle = '#ffe9a8'; c.fillRect(-r.w * 0.14, -r.h * 0.2, r.w * 0.28, r.h * 0.4);
    c.fillStyle = '#0d5c4a'; c.beginPath(); c.arc(-r.w * 0.14, 0, r.h * 0.06, 0, Math.PI * 2); c.arc(r.w * 0.14, 0, r.h * 0.06, 0, Math.PI * 2); c.fill(); c.restore();
    texto(c, 'ENTRADAS', 'MAnton', r.w * 0.66, r.h * 0.4, r.w * 0.55, r.h * 0.28, '#ffffff');
    texto(c, 'TAQUILLA ABIERTA', 'MOswald', r.w * 0.66, r.h * 0.68, r.w * 0.55, r.h * 0.12, '#ffe9a8', '600');
  } else if (id === 'tapas') {
    c.fillStyle = '#3a1e14'; c.fillRect(0, 0, r.w, r.h);
    for (let j = 0; j < 12; j++) for (let i = 0; i < 14; i++) { c.fillStyle = `rgba(150,70,45,${0.3 + rnd(i * 13 + j) * 0.3})`; c.fillRect(i * 38 - (j % 2) * 19, j * 22, 35, 19); }
    const on = Math.sin(t * 3) > -0.8;
    texto(c, 'Tapas', 'MPacifico', r.w * 0.33, r.h * 0.5, r.w * 0.45, r.h * 0.6, on ? '#ff5bbd' : '#6a2a50', '', on ? 22 : 0);
    texto(c, 'VERMÚ', 'MBebas', r.w * 0.75, r.h * 0.5, r.w * 0.35, r.h * 0.5, '#52f0ff', '', 20);
  } else if (id === 'callao') {
    const f = Math.floor((t - T0) / 3) % 3;
    if (f === 0) { fundoGrad(c, r, ['#ff5f6d', '#ffc371'], 0.5 + t * 0.1); texto(c, 'FESTIVAL', 'MAnton', r.w / 2, r.h * 0.38, r.w * 0.8, r.h * 0.3, '#ffffff', '', 12); texto(c, 'DE VERANO · MADRID', 'MOswald', r.w / 2, r.h * 0.66, r.w * 0.8, r.h * 0.12, '#3a0b3a', '600'); }
    else if (f === 1) { fundoGrad(c, r, ['#1e3c72', '#2a5298', '#6dd5ed'], 2.0); c.fillStyle = '#e8eef7';
      const px = r.w * (0.3 + 0.03 * Math.sin(t * 2)); c.fillRect(px - r.w * 0.09, r.h * 0.2, r.w * 0.18, r.h * 0.62); c.fillStyle = '#111'; c.fillRect(px - r.w * 0.08, r.h * 0.24, r.w * 0.16, r.h * 0.5);
      texto(c, 'NUEVO', 'MAnton', r.w * 0.67, r.h * 0.4, r.w * 0.5, r.h * 0.25, '#ffffff'); texto(c, 'MÁS LUZ. MÁS TODO.', 'MOswald', r.w * 0.67, r.h * 0.62, r.w * 0.5, r.h * 0.09, '#bfe9ff', '500'); }
    else { fundoGrad(c, r, ['#0f0c29', '#302b63', '#24243e'], 1.0); for (let i = 0; i < 9; i++) { c.fillStyle = `hsla(${(i * 40 + t * 60) % 360},90%,60%,0.35)`;
        c.beginPath(); c.moveTo(r.w * (i + 0.5) / 9, r.h); c.lineTo(r.w * (i + 0.5) / 9 + Math.sin(t * 2 + i) * r.w * 0.3, 0); c.lineTo(r.w * (i + 0.5) / 9 + Math.sin(t * 2 + i) * r.w * 0.3 + 30, 0); c.fill(); }
      texto(c, 'CONCIERTO', 'MAnton', r.w / 2, r.h * 0.45, r.w * 0.85, r.h * 0.3, '#ffffff', '', 18); texto(c, 'SÁBADO · PLAZA DEL CALLAO', 'MOswald', r.w / 2, r.h * 0.7, r.w * 0.8, r.h * 0.09, '#ffd6ff', '500'); }
  }
  c.restore();
};

// ======================================================================================================================
// veiculos: taxi de Madri (branco, faixa vermelha diagonal na porta, luz verde), carro, onibus vermelho
// ======================================================================================================================
const pecas = (lista: [THREE.BufferGeometry, THREE.ColorRepresentation][]) => mergeGeometries(lista.map(([g, c]) => { const gg = comCor(g, c); gg.deleteAttribute('uv'); return gg; })) as THREE.BufferGeometry;
const caixaG = (w: number, h: number, d: number, x: number, y: number, z: number, rx = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (rx) g.rotateX(rx); g.translate(x, y, z); return g; };
const roda = (x: number, z: number, r = 0.33) => { const g = new THREE.CylinderGeometry(r, r, 0.26, 14); g.rotateZ(Math.PI / 2); g.translate(x, r, z); return g; };
const geoCarro = (taxi: boolean) => {
  const P: [THREE.BufferGeometry, THREE.ColorRepresentation][] = [
    [caixaG(1.8, 0.72, 4.4, 0, 0.72, 0), '#ffffff'], [caixaG(1.62, 0.56, 2.3, 0, 1.36, -0.25), '#1f2730'], [caixaG(1.58, 0.06, 2.1, 0, 1.66, -0.25), '#ffffff'],
    [caixaG(1.82, 0.12, 4.42, 0, 0.42, 0), '#2a2a2a'],
    [caixaG(0.35, 0.12, 0.05, -0.6, 0.85, 2.21), '#fff7d6'], [caixaG(0.35, 0.12, 0.05, 0.6, 0.85, 2.21), '#fff7d6'],
    [caixaG(0.35, 0.12, 0.05, -0.62, 0.85, -2.21), '#c4141a'], [caixaG(0.35, 0.12, 0.05, 0.62, 0.85, -2.21), '#c4141a'],
    [roda(-0.84, 1.4), '#141414'], [roda(0.84, 1.4), '#141414'], [roda(-0.84, -1.35), '#141414'], [roda(0.84, -1.35), '#141414'],
  ];
  if (taxi) {
    P.push([caixaG(0.03, 0.8, 0.22, 0.915, 0.78, 0.55, 0.55), '#d0121a'], [caixaG(0.03, 0.8, 0.22, -0.915, 0.78, 0.55, 0.55), '#d0121a']);
    P.push([caixaG(0.5, 0.16, 0.2, 0, 1.76, -0.1), '#f4f4f4'], [caixaG(0.14, 0.14, 0.14, 0.32, 1.76, -0.1), '#33ff66']);
  }
  return pecas(P);
};
const geoOnibus = () => pecas([
  [caixaG(2.55, 1.05, 12, 0, 0.88, 0), '#d2232a'], [caixaG(2.5, 1.2, 11.6, 0, 2.0, 0), '#1c252d'], [caixaG(2.55, 0.42, 12, 0, 2.81, 0), '#d2232a'],
  [caixaG(2.58, 0.12, 12.02, 0, 1.38, 0), '#f2f2f2'], [caixaG(1.6, 0.3, 0.06, 0, 2.75, 6.01), '#ffb000'],
  [roda(-1.2, 4.2, 0.5), '#141414'], [roda(1.2, 4.2, 0.5), '#141414'], [roda(-1.2, -3.4, 0.5), '#141414'], [roda(1.2, -3.4, 0.5), '#141414'],
]);
type Veic = {tipo: number; x: number; z0: number; v: number; sentido: number; para: number; cor: string; sd: number};
const VEICULOS: Veic[] = (() => {
  const out: Veic[] = [], CORES = ['#ffffff', '#ffffff', '#1d1f24', '#8c96a3', '#a3262a', '#203a6b', '#d9d9d9', '#3b4b3a'];
  // sentido +z (vem para a camera, x < 0): fila parada no sinal da faixa de pedestres (z = -28)
  for (const [x, onibus] of [[-2.2, false], [-6.0, false], [-9.8, true]] as [number, boolean][]) {
    let para = -28 - rnd(x * 7) * 3;
    for (let k = 0; k < (onibus ? 3 : 7); k++) {
      const tipo = onibus ? 2 : rnd(x * 13 + k) < 0.55 ? 0 : 1, L = tipo === 2 ? 12 : 4.4;
      para -= L / 2; out.push({tipo, x, z0: para - 40 - k * 25 - rnd(k + x) * 40, v: 9, sentido: 1, para, cor: CORES[Math.floor(rnd(k * 3 + x) * 8)], sd: k + x});
      para -= L / 2 + 1.6 + rnd(k * 5 + x) * 1.5;
    }
  }
  // sentido -z (x > 0): transito lento (anda e para), espalhado pela avenida
  for (const [x, onibus] of [[2.2, false], [6.0, false], [9.8, true]] as [number, boolean][]) {
    let z = -34 - rnd(x) * 10;
    for (let k = 0; k < (onibus ? 4 : 10); k++) {
      const tipo = onibus ? 2 : rnd(x * 17 + k) < 0.5 ? 0 : 1;
      out.push({tipo, x, z0: z, v: 2.5 + rnd(k * 7 + x) * 2.5, sentido: -1, para: 0, cor: CORES[Math.floor(rnd(k * 11 + x) * 8)], sd: k * 1.7 + x});
      z -= (tipo === 2 ? 22 : 9) + rnd(k * 3 + x) * (onibus ? 60 : 30);
    }
  }
  return out;
})();
const softplus = (x: number, k = 3) => (x > 40 ? x : k * Math.log1p(Math.exp(x / k)));
const estadoVeic = (v: Veic, t: number) => {
  const tt = (planoB(t) ? 91.8 : t) - T0;
  let z: number;
  if (v.sentido > 0) { const livre = v.z0 + v.v * tt; z = v.para - softplus(v.para - livre); }
  else { const tb = 91.8 - T0, te = tt < tb ? tt : tb + (1 - Math.exp(-(tt - tb) / 0.7)) * 0.7; z = v.z0 - v.v * te - 1.0 * Math.sin(0.5 * te + v.sd); }
  let y = 0, rx = 0, rz = 0, vis = true, ry = v.sentido > 0 ? 0 : Math.PI;
  if (!planoB(t) && ondaVisivel(t)) { // a onda chega: o carro e levantado pela espuma e engolido
    const perto = z - frenteOnda(t) - 4 * Math.sin(v.x * 0.3);
    if (perto < 28) { const k = clamp01((28 - perto) / 28); y = k * k * 16; z += k * 20; rx = k * 1.6 * (v.sd % 2 ? 1 : -1); rz = k * 0.9; ry += k * 1.2 * Math.sin(v.sd); }
    if (perto < -3) vis = false;
  }
  return {x: v.x, y, z, rx, ry, rz, vis};
};

// ======================================================================================================================
// pessoas: multidao perto (Quaternius, com rig) + figurantes distantes instanciados
// ======================================================================================================================
const PASSADA: Record<string, number> = {Walk_Loop: 1.45, Jog_Fwd_Loop: 2.6, Sprint_Loop: 3.9};
// escadaria da praca: plataforma da camera y = 3,0 (z > 33), 13 degraus de 1 m ate z = 20
const yEscada = (x: number, z: number) => (Math.abs(x) > 9 || z < 20 ? 0 : z >= 33 ? 3.0 : 3.0 - Math.ceil(33 - z) * 0.23);
type Gente = {x0: number; z0: number; y0?: number; dir: number; v: number; modo: 'anda' | 'conversa' | 'sentado' | 'olha'; tOlha: number; tRun: number; dirRun: number; vRun: number};
const GENTE_A: Gente[] = (() => {
  const G: Gente[] = []; let i = 0;
  const r = (k: number) => rnd(i * 37 + k);
  const corre = (x: number, z: number) => { // foge para +z (para longe da onda), abrindo para os lados da escadaria
    let d = (r(9) - 0.5) * 0.7; if (Math.abs(x) < 10 && z > 5) d += Math.sign(x || 1) * 0.6; return d;
  };
  // praca (andando em varias direcoes)
  for (let k = 0; k < 16; k++, i++) { const x = (r(1) - 0.5) * 50, z = 16 - r(2) * 26; const ok = !(Math.abs(x) < 10 && z > 18);
    G.push({x0: ok ? x : x + 20 * Math.sign(x || 1), z0: z, dir: r(3) * 6.283, v: 1.1 + r(4) * 0.5, modo: r(5) < 0.2 ? 'conversa' : 'anda', tOlha: r(6) < 0.4 ? 88 + r(7) * 2.5 : 99, tRun: T_CORRE + 0.6 + r(8) * 1.4, dirRun: corre(x, z), vRun: 5.2 + r(10) * 1.6}); }
  // sentados na escadaria
  for (const [x, deg] of [[-5.5, 6], [3.8, 8], [6.4, 5]] as number[][]) { i++; const z = 33 - deg - 0.6;
    G.push({x0: x, z0: z, y0: yEscada(x, z + 0.6) - 0.42, dir: Math.PI, v: 0, modo: 'sentado', tOlha: 99, tRun: T_CORRE + 1.4 + r(1), dirRun: Math.sign(x) * 0.9, vRun: 5}); }
  // atravessando a faixa (z -20..-25)
  for (let k = 0; k < 12; k++, i++) { const s = r(1) < 0.5 ? 1 : -1;
    G.push({x0: -s * (13 + r(2) * 4) + s * r(3) * 6, z0: -21 - r(4) * 4, dir: s > 0 ? Math.PI / 2 : -Math.PI / 2, v: 1.2 + r(5) * 0.4, modo: 'anda', tOlha: r(6) < 0.5 ? 89 + r(7) * 2 : 99, tRun: T_CORRE + 0.3 + r(8), dirRun: corre(0, -20), vRun: 5.5 + r(10)}); }
  // calcadas
  for (let k = 0; k < 16; k++, i++) { const lado = r(1) < 0.5 ? 1 : -1, s = r(2) < 0.5 ? 1 : -1;
    G.push({x0: lado * (13 + r(3) * 3.2), z0: -30 - r(4) * 70, dir: s > 0 ? 0 : Math.PI, v: 1.2 + r(5) * 0.4, modo: r(6) < 0.15 ? 'conversa' : 'anda', tOlha: r(7) < 0.5 ? 88.5 + r(8) * 2 : 99, tRun: T_CORRE + r(9) * 0.8, dirRun: (r(10) - 0.5) * 0.3, vRun: 5.5 + r(11) * 1.2}); }
  return G;
})();
const estadoGente = (g: Gente, t: number): Estado3D => {
  const tw = Math.min(t, g.tOlha, g.tRun) - T0, anda = g.modo === 'anda' ? Math.max(0, tw) * g.v : 0;
  let x = g.x0 + Math.sin(g.dir) * anda, z = g.z0 + Math.cos(g.dir) * anda, ry = g.dir, y = g.modo === 'sentado' ? (g.y0 ?? 0) : 0;
  let clipe = 'Idle_Loop', tempo = t + g.x0;
  if (g.modo === 'anda' && t < g.tOlha && t < g.tRun) { clipe = 'Walk_Loop'; tempo = anda / PASSADA.Walk_Loop; }
  else if (g.modo === 'conversa') clipe = 'Idle_Talking_Loop';
  else if (g.modo === 'sentado') clipe = 'Sitting_Idle_Loop';
  if (t >= g.tOlha && t < g.tRun) ry = Math.PI + (rnd(g.x0) - 0.5) * 0.5;  // para e olha para o fim da avenida
  if (t >= g.tRun) {
    const lev = g.modo === 'sentado' ? 0.9 : 0.3, tt = t - g.tRun - lev;
    if (tt < 0) { if (g.modo === 'sentado') { clipe = 'Sitting_Exit'; tempo = t - g.tRun; } else ry = g.dirRun; }
    else {
      const a = 3.5, tA = g.vRun / a, d = tt < tA ? 0.5 * a * tt * tt : 0.5 * a * tA * tA + g.vRun * (tt - tA), v = Math.min(g.vRun, a * tt);
      x += Math.sin(g.dirRun) * d; z += Math.cos(g.dirRun) * d; ry = g.dirRun;
      clipe = v > 4.2 ? 'Sprint_Loop' : v > 2 ? 'Jog_Fwd_Loop' : 'Walk_Loop'; tempo = d / PASSADA[clipe];
      y = yEscada(x, z);
    }
  }
  if (g.modo !== 'sentado' || t >= g.tRun + 0.9) y = Math.max(y, yEscada(x, z));
  const vis = planoB(t) || z > frenteOnda(t) + 1.5;
  return {x, y, z, ry, clipe, tempo, visivel: vis};
};
// plano B: gente atravessando a faixa correndo, gente vindo pela calcada, dois parados olhando para cima
type GenteB = {x0: number; z: number; dir: number; v: number; t0: number; para?: boolean};
const GENTE_B: GenteB[] = (() => {
  const G: GenteB[] = [];
  for (let k = 0; k < 12; k++) { const s = rnd(k * 3) < 0.5 ? 1 : -1; G.push({x0: -s * (15 + rnd(k * 5) * 6), z: -20.6 - rnd(k * 7) * 4.2, dir: s, v: 4.2 + rnd(k * 11) * 2.4, t0: 97.3 + rnd(k * 13) * 4.5}); }
  for (let k = 0; k < 5; k++) { const lado = k % 2 ? 1 : -1; G.push({x0: lado * (13 + rnd(k * 19) * 3), z: -40 - rnd(k * 23) * 40, dir: 0, v: 5 + rnd(k * 29) * 1.5, t0: 97.8 - rnd(k) * 2}); }
  G.push({x0: 9.5, z: -31, dir: 0, v: 0, t0: 0, para: true}); G.push({x0: -11.5, z: -36, dir: 0, v: 0, t0: 0, para: true});
  return G;
})();
const estadoGenteB = (g: GenteB, t: number): Estado3D => {
  if (g.para) return {x: g.x0, y: 0, z: g.z, ry: Math.PI * 0.85 + rnd(g.x0), clipe: 'Idle_Loop', tempo: t + g.x0};
  const d = Math.max(0, t - g.t0) * g.v;
  if (g.dir === 0) { const z = g.z + d; return {x: g.x0, y: 0, z, ry: 0, clipe: 'Sprint_Loop', tempo: d / PASSADA.Sprint_Loop, visivel: z < -17.5}; }
  const x = g.x0 + g.dir * d;
  return {x, y: 0, z: g.z, ry: g.dir * Math.PI / 2, clipe: g.v > 4.2 ? 'Sprint_Loop' : 'Jog_Fwd_Loop', tempo: d / PASSADA[g.v > 4.2 ? 'Sprint_Loop' : 'Jog_Fwd_Loop'], visivel: Math.abs(x) < 26};
};
const CAMISAS = ['#1f3f8f', '#c0392b', '#f2b134', '#16a085', '#e2457a', '#2c2f36', '#f4f1ea', '#7d5ba6', '#e67e22', '#3b8fd0'];
const PESSOAS_A: Pessoa3D[] = GENTE_A.map((g, i) => ({i: 500 + i, x: g.x0, z: g.z0, rot: g.dir, pose: 'andando', curta: rnd(i * 3) < 0.6, camisa: CAMISAS[Math.floor(rnd(i * 7 + 1) * 10)]}));
const PESSOAS_B: Pessoa3D[] = GENTE_B.map((g, i) => ({i: 700 + i, x: g.x0, z: g.z, rot: 0, pose: 'andando', curta: rnd(i * 5) < 0.6, camisa: CAMISAS[Math.floor(rnd(i * 11 + 2) * 10)]}));

// figurantes distantes: corpo + cabeca instanciados
const N_FIG = 240;
const FIG = Array.from({length: N_FIG}, (_, i) => {
  const lado = rnd(i * 3 + 1) < 0.5 ? 1 : -1, cruz = rnd(i * 3 + 2) < 0.12;
  return {x0: cruz ? (rnd(i * 5) - 0.5) * 22 : lado * (12.8 + rnd(i * 7) * 3.6), z0: cruz ? -298 - rnd(i * 9) * 5 : -45 - rnd(i * 11) * 660, cruz,
    s: rnd(i * 13) < 0.5 ? 1 : -1, v: 1.1 + rnd(i * 17) * 0.5, tRun: 90.7 + rnd(i * 19) * 1.0, vRun: 5 + rnd(i * 23) * 1.5, cor: `hsl(${Math.round(rnd(i * 29) * 360)},${40 + Math.round(rnd(i * 31) * 40)}%,${25 + Math.round(rnd(i * 37) * 45)}%)`};
});

// ======================================================================================================================
// shaders
// ======================================================================================================================
const RUIDO_GLSL = `
float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(hs(i), hs(i+vec2(1,0)), f.x), mix(hs(i+vec2(0,1)), hs(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ s += a * vn(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s; }`;

const ONDA_VS = `attribute vec2 aP; varying vec3 vW; varying vec3 vN; varying vec2 vP;
void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vP = aP; gl_Position = projectionMatrix * viewMatrix * w; }`;
const ONDA_FS = `uniform float uT; uniform float uDbg; uniform vec3 uSol; uniform vec3 uCeu; varying vec3 vW; varying vec3 vN; varying vec2 vP;
${RUIDO_GLSL}
void main(){
  vec3 N = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0);
  vec3 V = normalize(cameraPosition - vW), L = normalize(uSol);
  float u = vP.x, yr = clamp(vP.y, 0.0, 1.2);
  vec3 fundo = vec3(0.02, 0.24, 0.30), meio = vec3(0.04, 0.40, 0.44), claro = vec3(0.16, 0.66, 0.64);
  vec3 col = mix(fundo, meio, smoothstep(0.05, 0.85, yr));
  col = mix(col, claro, smoothstep(0.6, 0.98, yr) * smoothstep(5.0, 7.5, u) * 0.75);   // agua fina no alto da face: translucida
  // estrias verticais (a agua subindo a face) e veios claros
  float st = fbm(vec2(vW.x * 0.07, vW.y * 0.012 - uT * 0.45));
  float st2 = vn(vec2(vW.x * 0.32, vW.y * 0.018 - uT * 0.9));
  col *= 0.8 + 0.45 * st;
  col += pow(st2, 7.0) * 0.35 * vec3(0.55, 0.9, 0.9) * smoothstep(6.5, 8.5, u);
  float dif = 0.55 + 0.45 * max(dot(N, L), 0.0);
  col *= dif;
  float tr = pow(max(dot(-V, L), 0.0), 3.0) * smoothstep(0.55, 0.95, yr);
  col += claro * tr * 0.8;
  float fres = pow(1.0 - abs(dot(N, V)), 4.0);
  col = mix(col, uCeu * 0.85, fres * 0.55);
  col += pow(max(dot(reflect(-V, N), L), 0.0), 90.0) * 1.2;
  // espuma: crista e labio, cortina caindo do labio, base revolta
  float nC = fbm(vec2(vW.x * 0.045 + u * 0.4, u * 1.6 - uT * 1.3));
  float crista = smoothstep(2.4, 3.0, u) * (1.0 - smoothstep(5.0, 5.8, u));
  float esp = crista * smoothstep(0.3, 0.55, nC + 0.1);
  float cai = smoothstep(6.8, 7.2, u) * (1.0 - smoothstep(7.5, 8.3, u)) * smoothstep(0.6, 0.78, fbm(vec2(vW.x * 0.12, vW.y * 0.035 + uT * 2.2)));
  float nb = fbm(vec2(vW.x * 0.05, vW.z * 0.05 - uT * 1.4) + vW.y * 0.04);
  float base = smoothstep(9.55, 10.2, u) * smoothstep(0.25, 0.5, nb + (u - 10.0) * 0.25);
  esp = clamp(max(max(esp, cai * 0.85), base), 0.0, 1.0);
  vec3 branco = vec3(0.92, 0.95, 0.96) * (0.72 + 0.28 * dif);
  col = mix(col, vec3(0.06, 0.48, 0.52), smoothstep(400.0, 1800.0, length(vW - cameraPosition)) * 0.5);   // de longe ainda le como agua
  col = mix(col, branco, esp);
  gl_FragColor = vec4(pow(max(col, vec3(0.0)), vec3(2.2)), 1.0);
  if (uDbg > 0.5) gl_FragColor = vec4(u / 12.0, yr, fres, 1.0);
}`;

const SPRAY_VS = `attribute vec4 aA; attribute vec4 aB;   // aA: x0, tipo, fase, semente | aB: tamanho, vida, deriva x, vy
uniform float uT; uniform float uZF; uniform float uH; uniform float uL; uniform float uLiga;
varying vec2 vUv; varying float vQ0; varying float vMix; varying float vA; varying float vSeed;
float h(float x){ return fract(sin(x * 91.7) * 43758.5); }
void main(){
  float vida = aB.y, u = fract(uT / vida + aA.z), age = u * vida, seed = aA.w;
  float esc = clamp(uH / 120.0, 0.3, 1.25);
  vec3 c; float s;
  if (aA.y < 0.5) {        // spray na crista
    c = vec3(aA.x + aB.z * age, uH * 0.97 + aB.w * age * esc - 3.0 * age * age, uZF + uL + uH * 0.04 + 16.0 * age * esc);
    s = aB.x * (0.55 + 1.4 * u) * esc;
  } else if (aA.y < 1.5) { // nevoa na base
    c = vec3(aA.x + aB.z * age, 1.0 + aB.w * age + seed * 3.0, uZF + uH * 0.12 + 4.0 + 10.0 * age);
    s = aB.x * (0.7 + 0.8 * u);
  } else {                 // plumas subindo nas fachadas quando a agua bate
    c = vec3(aA.x, aB.w * age - 5.0 * age * age, uZF + 5.0 + 9.0 * age);
    s = aB.x * (0.4 + 1.5 * u);
  }
  vec3 dir = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  float ang = (h(seed) - 0.5) * 6.28 + u * (h(seed + 3.0) - 0.5) * 1.5;
  vec2 q = vec2(position.x * cos(ang) - position.y * sin(ang), position.x * sin(ang) + position.y * cos(ang));
  vec3 p = c + (dir * q.x + up * q.y) * s;
  vUv = uv; vSeed = seed; float f = u * 63.0; vQ0 = floor(f); vMix = f - vQ0;
  vA = uLiga * smoothstep(0.0, 0.15, u) * (1.0 - smoothstep(0.6, 1.0, u));
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const SPRAY_FS = `uniform sampler2D uAtlas; uniform float uForca; varying vec2 vUv; varying float vQ0; varying float vMix; varying float vA; varying float vSeed;
vec4 quadro(float k){ float cx = mod(k, 8.0), cy = floor(k / 8.0); return texture2D(uAtlas, (vec2(cx, 7.0 - cy) + vUv) / 8.0); }
void main(){
  vec4 c = mix(quadro(vQ0), quadro(min(vQ0 + 1.0, 63.0)), vMix);
  float l = dot(c.rgb, vec3(0.333));
  vec3 col = mix(vec3(0.30, 0.55, 0.58), vec3(0.93, 0.97, 0.98), smoothstep(0.2, 0.85, l));
  gl_FragColor = vec4(pow(col, vec3(2.2)), c.a * vA * uForca);
}`;

const TELA_CHEIA_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const BRANCO_FS = `uniform float uT; uniform float uW; varying vec2 vUv;
${RUIDO_GLSL}
void main(){
  // cortina de agua caindo sobre a camera: massas de espuma esticadas na vertical, descendo rapido, com veios de gotas
  float n = fbm(vec2(vUv.x * 4.5 + sin(vUv.y * 3.0 + uT) * 0.3, vUv.y * 1.3 + uT * 2.6));
  float n2 = fbm(vec2(vUv.x * 9.0, vUv.y * 2.6 + uT * 4.8) + 3.7);
  float gotas = pow(vn(vec2(vUv.x * 70.0, vUv.y * 2.5 + uT * 9.0)), 8.0);
  float m = clamp(uW * 1.6 - 0.35 + (n * 0.6 + n2 * 0.4 - 0.5) * 1.5, 0.0, 1.0);
  vec3 col = mix(vec3(0.03, 0.22, 0.27), vec3(0.86, 0.92, 0.93), smoothstep(0.45, 0.72, n * 0.6 + n2 * 0.4));
  col += gotas * 0.5 * vec3(0.8, 0.95, 1.0);
  gl_FragColor = vec4(pow(col, vec3(2.2)), m);
}`;
const TETO_VS = `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const TETO_FS = `uniform float uT; varying vec3 vW;
${RUIDO_GLSL}
void main(){
  float d = length(vW.xz - cameraPosition.xz);
  float lonj = smoothstep(30.0, 1100.0, d);
  float s1 = fbm(vec2(vW.x * 0.05, (vW.z + uT * 80.0) * 0.0045));
  float s2 = vn(vec2(vW.x * 0.55, (vW.z + uT * 105.0) * 0.0022));
  float s3 = vn(vec2(vW.x * 1.6 + 7.0, (vW.z + uT * 130.0) * 0.004));
  float estria = pow(1.0 - abs(s2 * 2.0 - 1.0), 10.0) + 0.6 * pow(1.0 - abs(s3 * 2.0 - 1.0), 16.0);
  estria *= 0.6 + 0.4 * vn(vec2(vW.x * 0.05, (vW.z + uT * 120.0) * 0.03));   // pulsos de fluxo correndo para o fundo
  vec3 escuro = vec3(0.04, 0.18, 0.24), claro = vec3(0.30, 0.55, 0.58);
  vec3 col = mix(escuro, claro, clamp(lonj * 0.85 + (s1 - 0.5) * 0.35, 0.0, 1.0));
  col += estria * 0.20 * vec3(0.55, 0.88, 0.92) * (1.0 - lonj * 0.7);
  float c1 = vn(vW.xz * 0.16 + vec2(uT * 0.5, uT * 2.4)), c2 = vn(vW.xz * 0.21 - vec2(uT * 0.4, -uT * 1.8));
  col += pow(1.0 - abs(c1 - c2), 12.0) * 0.07 * (1.0 - lonj);
  gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);
}`;
const CAUSTICA_FS = `uniform float uT; varying vec3 vW;
${RUIDO_GLSL}
void main(){
  vec2 p = vW.xz * 0.22;
  float c1 = vn(p + vec2(uT * 0.4, uT * 1.6)), c2 = vn(p * 1.37 - vec2(uT * 0.3, -uT * 1.2));
  float c = pow(1.0 - abs(c1 - c2), 10.0);
  float d = length(vW - cameraPosition);
  gl_FragColor = vec4(pow(vec3(0.55, 0.9, 1.0) * c * 0.45 * (1.0 - smoothstep(20.0, 160.0, d)), vec3(2.2)), 1.0);
}`;

// ======================================================================================================================
// componentes
// ======================================================================================================================
// perfil da onda (d = avanco a partir da base, y = altura) com o labio curvando para a frente
const NX = 150, NV = 84;
const XS = Array.from({length: NX}, (_, i) => { const u = (i / (NX - 1)) * 2 - 1; return Math.sign(u) * Math.pow(Math.abs(u), 1.7) * 1700; });
const perfilOnda = (H: number, L: number): number[][] => [
  [-3000, 0.78 * H], [-1.2 * H, 0.86 * H], [-0.45 * H, 0.95 * H], [L - 0.12 * H, H], [L + 0.02 * H, 0.985 * H], [L + 0.09 * H, 0.9 * H],
  [L + 0.065 * H, 0.82 * H], [L * 0.4 - 0.02 * H, 0.7 * H], [-0.06 * H, 0.45 * H], [-0.04 * H, 0.18 * H], [0, 0.04 * H], [0.1 * H, 0.012 * H], [0.22 * H, -0.2],
];
const Onda: React.FC<{t: number}> = ({t}) => {
  const {geo, mat} = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NX * NV * 3), 3));
    g.setAttribute('aP', new THREE.BufferAttribute(new Float32Array(NX * NV * 2), 2));
    const idx: number[] = [];
    for (let i = 0; i < NX - 1; i++) for (let j = 0; j < NV - 1; j++) { const a = i * NV + j, b = (i + 1) * NV + j; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    g.setIndex(idx);
    const m = new THREE.ShaderMaterial({vertexShader: ONDA_VS, fragmentShader: ONDA_FS, side: THREE.DoubleSide, toneMapped: false,
      uniforms: {uT: {value: 0}, uDbg: {value: 0}, uSol: {value: new THREE.Vector3(0, 1, 0)}, uCeu: {value: new THREE.Color(0.72, 0.82, 0.92)}}});
    return {geo: g, mat: m};
  }, []);
  const H = alturaOnda(t), L = labioOnda(t), zF = frenteOnda(t);
  const pos = geo.attributes.position as THREE.BufferAttribute, ap = geo.attributes.aP as THREE.BufferAttribute;
  for (let i = 0; i < NX; i++) {
    const x = XS[i];
    const Hx = H * (1 + 0.05 * Math.sin(0.011 * x + 0.7 * t) + 0.035 * Math.sin(0.027 * x - 1.3 * t + 1) + 0.02 * Math.sin(0.07 * x + 2.1 * t));
    const Lx = L * (1 + 0.3 * Math.sin(0.017 * x - 0.9 * t));
    const zx = zF + 6 * Math.sin(0.009 * x + 0.4 * t) + 3 * Math.sin(0.031 * x - 1.1 * t);
    const P = perfilOnda(Hx, Lx), nS = P.length - 1;
    for (let j = 0; j < NV; j++) {
      const s = (j / (NV - 1)) * nS, sg = Math.min(nS - 1, Math.floor(s)), f = s - sg;
      let d: number, y: number;
      if (sg === 0) { d = P[0][0] + (P[1][0] - P[0][0]) * f; y = P[0][1] + (P[1][1] - P[0][1]) * f; }
      else {
        const p0 = P[sg - 1], p1 = P[sg], p2 = P[sg + 1], p3 = P[Math.min(nS, sg + 2)], f2 = f * f, f3 = f2 * f;
        const cr = (a: number, b: number, c: number, e: number) => 0.5 * (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - e) * f2 + (-a + 3 * b - 3 * c + e) * f3);
        d = cr(p0[0], p1[0], p2[0], p3[0]); y = cr(p0[1], p1[1], p2[1], p3[1]);
      }
      pos.setXYZ(i * NV + j, x, y, zx + d); ap.setXY(i * NV + j, s, y / Hx);
    }
  }
  pos.needsUpdate = true; ap.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
  mat.uniforms.uT.value = t; mat.uniforms.uSol.value.copy(luzEm(t, 'madrid').sol);
  mat.uniforms.uDbg.value = String((globalThis as any).__dbg ?? '').includes('ondaCor') ? 1 : 0;
  { const h = corHorizonte(t, 'madrid'); (mat.uniforms.uCeu.value as THREE.Color).setRGB(Math.pow(h.r, 1 / 2.2), Math.pow(h.g, 1 / 2.2), Math.pow(h.b, 1 / 2.2)); }
  return <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={2} />;
};

const Spray: React.FC<{t: number}> = ({t}) => {
  const tex = useTexture(staticFile('vfx/Cloud01_8x8.png'));
  const {malha, mat} = useMemo(() => {
    tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
    const lista: number[][] = [];
    for (let i = 0; i < 170; i++) lista.push([(rnd(i * 3 + 1) - 0.5) * 520, 0, rnd(i * 3 + 2), rnd(i * 3 + 3), 10 + rnd(i * 7) * 14, 2.2 + rnd(i * 11) * 1.4, (rnd(i * 13) - 0.5) * 6, 10 + rnd(i * 17) * 16]);
    for (let i = 0; i < 90; i++) lista.push([(rnd(i * 5 + 1) - 0.5) * 300, 1, rnd(i * 5 + 2), rnd(i * 5 + 3), 6 + rnd(i * 19) * 8, 2.0 + rnd(i * 23) * 1.2, (rnd(i * 29) - 0.5) * 8, 1 + rnd(i * 31) * 3]);
    for (let i = 0; i < 50; i++) lista.push([(i % 2 ? 1 : -1) * (15 + rnd(i * 37) * 5), 2, rnd(i * 41), rnd(i * 43), 5 + rnd(i * 47) * 6, 1.6 + rnd(i * 53) * 1.0, 0, 16 + rnd(i * 59) * 16]);
    const n = lista.length, A = new Float32Array(n * 4), B = new Float32Array(n * 4);
    lista.forEach((l, i) => { A.set(l.slice(0, 4), i * 4); B.set(l.slice(4, 8), i * 4); });
    const geo = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1) as any) as THREE.InstancedBufferGeometry;
    geo.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 4)); geo.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4)); geo.instanceCount = n;
    const m = new THREE.ShaderMaterial({vertexShader: SPRAY_VS, fragmentShader: SPRAY_FS, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
      uniforms: {uT: {value: 0}, uZF: {value: 0}, uH: {value: 0}, uL: {value: 0}, uLiga: {value: 0}, uAtlas: {value: tex}, uForca: {value: 0.9}}});
    const ms = new THREE.Mesh(geo, m); ms.frustumCulled = false;
    return {malha: ms, mat: m};
  }, [tex]);
  const u = mat.uniforms;
  u.uT.value = t; u.uZF.value = frenteOnda(t); u.uH.value = alturaOnda(t); u.uL.value = labioOnda(t); u.uLiga.value = smooth(91.0, 93.0, t);
  return <primitive object={malha} renderOrder={12} />;
};

const BrancoDeAgua: React.FC<{t: number}> = ({t}) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({vertexShader: TELA_CHEIA_VS, fragmentShader: BRANCO_FS, transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
    uniforms: {uT: {value: 0}, uW: {value: 0}}}), []);
  mat.uniforms.uT.value = t; mat.uniforms.uW.value = smooth(96.6, 97.65, t);
  if (t < 96.6) return null;
  return <mesh material={mat} frustumCulled={false} renderOrder={1000}><planeGeometry args={[2, 2]} /></mesh>;
};

const Teto: React.FC<{t: number}> = ({t}) => {
  const {mt, mc} = useMemo(() => ({
    mt: new THREE.ShaderMaterial({vertexShader: TETO_VS, fragmentShader: TETO_FS, side: THREE.DoubleSide, toneMapped: false, uniforms: {uT: {value: 0}}}),
    mc: new THREE.ShaderMaterial({vertexShader: TETO_VS, fragmentShader: CAUSTICA_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
      polygonOffset: true, polygonOffsetFactor: -2, uniforms: {uT: {value: 0}}}),
  }), []);
  mt.uniforms.uT.value = t; mc.uniforms.uT.value = t;
  return <>
    <mesh material={mt} position={[0, Y_TETO, -2500]} rotation-x={Math.PI / 2}><planeGeometry args={[9000, 9000]} /></mesh>
    <mesh material={mc} position={[0, 0.2, -150]} rotation-x={-Math.PI / 2} renderOrder={3}><planeGeometry args={[60, 400]} /></mesh>
  </>;
};

// cardume passando por baixo da superficie (silhuetas vistas atraves da agua)
const Cardume: React.FC<{t: number}> = ({t}) => {
  const N = 160;
  const malha = useMemo(() => {
    const sh = new THREE.Shape(); sh.moveTo(0, 1); sh.quadraticCurveTo(0.32, 0.3, 0.12, -0.45); sh.lineTo(0.3, -0.8); sh.lineTo(0, -0.62); sh.lineTo(-0.3, -0.8); sh.lineTo(-0.12, -0.45); sh.quadraticCurveTo(-0.32, 0.3, 0, 1);
    const g = new THREE.ShapeGeometry(sh, 6); g.rotateX(-Math.PI / 2);  // deitado, cabeca para -z
    const m = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({color: '#01080b', transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false, toneMapped: false}), N);
    m.frustumCulled = false; return m;
  }, []);
  const o = new THREE.Object3D(), u = t - 99.6;
  const cz = -45 - u * 14, cx = 2 + 6 * Math.sin(u * 0.5);
  for (let i = 0; i < N; i++) {
    const a = rnd(i * 3) * 6.283, r = Math.sqrt(rnd(i * 3 + 1)) * 22, grande = i < 3;
    const x = cx + Math.cos(a + u * 0.15) * r * 1.3 + Math.sin(u * 1.3 + i) * 0.6, z = cz + Math.sin(a + u * 0.15) * r * 2.2 + (grande ? 25 : 0);
    o.position.set(x, Y_TETO - 0.6 - rnd(i * 7) * 1.5, z); o.rotation.set(0, Math.sin(u * 7 + i) * 0.25 + (grande ? 0.1 : 0), 0);
    o.scale.setScalar(u < 0 ? 0 : grande ? 10 : 2.8 + rnd(i * 5) * 1.8); o.updateMatrix(); malha.setMatrixAt(i, o.matrix);
  }
  malha.instanceMatrix.needsUpdate = true;
  return <primitive object={malha} renderOrder={4} />;
};

const Veiculos: React.FC<{t: number}> = ({t}) => {
  const ms = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.35, metalness: 0.25});
    const geos = [geoCarro(true), geoCarro(false), geoOnibus()];
    return geos.map((g, k) => { const n = VEICULOS.filter((v) => (k === 0 ? v.tipo === 0 : k === 1 ? v.tipo === 1 : v.tipo === 2)).length;
      const m = new THREE.InstancedMesh(g, mat, Math.max(1, n)); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; return m; });
  }, []);
  const o = new THREE.Object3D(), cont = [0, 0, 0];
  VEICULOS.forEach((v) => {
    const k = v.tipo, e = estadoVeic(v, t);
    o.position.set(e.x, e.y, e.z); o.rotation.set(e.rx, e.ry, e.rz); o.scale.setScalar(e.vis ? 1 : 0); o.updateMatrix();
    ms[k].setMatrixAt(cont[k], o.matrix); if (k === 1) ms[k].setColorAt(cont[k], new THREE.Color(v.cor)); cont[k]++;
  });
  ms.forEach((m) => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
  return <>{ms.map((m, i) => <primitive key={i} object={m} />)}</>;
};

const Figurantes: React.FC<{t: number}> = ({t}) => {
  const m = useMemo(() => {
    const corpo = new THREE.CapsuleGeometry(0.22, 0.95, 3, 8); corpo.translate(0, 0.72, 0);
    const cab = new THREE.SphereGeometry(0.13, 10, 8); cab.translate(0, 1.6, 0);
    const g = mergeGeometries([corpo.toNonIndexed(), cab.toNonIndexed()]) as THREE.BufferGeometry;
    const im = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({roughness: 0.8}), N_FIG); im.frustumCulled = false; im.castShadow = true;
    FIG.forEach((f, i) => im.setColorAt(i, new THREE.Color(f.cor)));
    return im;
  }, []);
  const o = new THREE.Object3D(), zF = frenteOnda(t);
  FIG.forEach((f, i) => {
    const tw = Math.min(t, f.tRun) - T0, d = tw * f.v;
    let x = f.cruz ? f.x0 + f.s * d : f.x0, z = f.cruz ? f.z0 : f.z0 + f.s * d, ry = f.cruz ? f.s * Math.PI / 2 : f.s > 0 ? 0 : Math.PI, lean = 0, bob = Math.abs(Math.sin(d * 4.3)) * 0.05;
    if (t > f.tRun) { const tt = t - f.tRun, dd = tt < 1.4 ? 0.5 * (f.vRun / 1.4) * tt * tt : 0.5 * f.vRun * 1.4 + f.vRun * (tt - 1.4); z += dd; ry = 0; lean = 0.25; bob = Math.abs(Math.sin(dd * 2.4)) * 0.12; }
    const vis = planoB(t) ? z < -20 : z > zF + 1;
    o.position.set(x, bob, z); o.rotation.set(lean, ry, 0); o.scale.setScalar(vis ? 1 : 0); o.updateMatrix(); m.setMatrixAt(i, o.matrix);
  });
  m.instanceMatrix.needsUpdate = true;
  return <primitive object={m} />;
};

// cidade estatica: predios, praca, escadaria, rua, postes, cupulas, Carrion, Palacio de la Prensa, torres da Plaza de Espana
const Cidade: React.FC = () => {
  const objs = useMemo(() => {
    const texF = ESTILOS.map((_, i) => fachada(i)), texL = lojas();
    const texPraca = lajotas(512, 6, 12, [176, 168, 164], 0.16, 31), texCalcada = lajotas(512, 10, 10, [178, 178, 176], 0.12, 57), texAsf = asfalto();
    const acF = ESTILOS.map(() => new Acum()), acL = new Acum(), acLiso = new Acum(), acTelhado = new Acum();
    const extrasF: THREE.BufferGeometry[][] = ESTILOS.map(() => []), extrasL: THREE.BufferGeometry[] = [], extrasLiso: THREE.BufferGeometry[] = [];
    const cupulas: THREE.BufferGeometry[] = [], ouro: THREE.BufferGeometry[] = [];
    const tomC = (tom: number, base = '#ffffff') => new THREE.Color(base).multiplyScalar(tom);
    const predio = (x0: number, x1: number, z0: number, z1: number, h: number, est: number, tom: number, faces = 'xXzZ', mansarda = true) => {
      const uo = rnd(x0 * 3 + z0) * 4;
      acL.caixa(x0, x1, 0, TERREO, z0, z1, LOJA_W, LOJA_H, tomC(1), Math.floor(rnd(z0 * 7 + x0) * 4), rnd(z1 + x1) < 0.5 ? 0 : 0.5, faces);
      acF[est].caixa(x0, x1, TERREO, h, z0, z1, FACH_W, FACH_H, tomC(tom), uo, 0, faces);
      const cc = tomC(tom * 0.92, ['#e7dcc3', '#e3d7bf', '#ddd8cc', '#f0eee8', '#eadbbf', '#b5b3ae'][est]);
      acLiso.caixa(x0 - 0.6, x1 + 0.6, h, h + 1.1, z0 - 0.6, z1 + 0.6, 1, 1, cc);                 // cornija
      acLiso.caixa(x0 - 0.2, x1 + 0.2, TERREO - 0.15, TERREO + 0.35, z0 - 0.2, z1 + 0.2, 1, 1, cc.clone().multiplyScalar(0.95)); // faixa sobre o terreo
      if (mansarda) acTelhado.caixa(x0 + 1.2, x1 - 1.2, h + 1.1, h + 4.2, z0 + 1.2, z1 - 1.2, 1, 1, new THREE.Color('#4d535c'), 0, 0, 'xXzZt');
      else acTelhado.caixa(x0, x1, h + 1.1, h + 1.2, z0, z1, 1, 1, new THREE.Color('#5d5a56'), 0, 0, 't');
    };
    const cupula = (x: number, z: number, y: number, r: number) => {
      const tambor = new THREE.CylinderGeometry(r, r, r * 0.9, 28); tambor.translate(x, y + r * 0.45, z); extrasLiso.push(comCor(tambor, '#e2d6bd'));
      const dom = new THREE.SphereGeometry(r * 1.02, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2); dom.scale(1, 1.25, 1); dom.translate(x, y + r * 0.9, z); cupulas.push(dom);
      const lan = new THREE.CylinderGeometry(r * 0.22, r * 0.25, r * 0.6, 12); lan.translate(x, y + r * 0.9 + r * 1.25 + r * 0.3, z); extrasLiso.push(comCor(lan, '#e8dcc4'));
      const ag = new THREE.ConeGeometry(r * 0.12, r * 0.9, 10); ag.translate(x, y + r * 0.9 + r * 1.25 + r * 0.6 + r * 0.45, z); ouro.push(ag);
    };
    for (const p of gerarPredios()) {
      const x0 = p.lado > 0 ? FACE : -(FACE + FUNDO_PREDIO), x1 = p.lado > 0 ? FACE + FUNDO_PREDIO : -FACE;
      predio(x0, x1, p.z0, p.z1, p.h, p.est, p.tom, 'xXzZ', rnd(p.z0) < 0.6);
      if (p.cupula) cupula(p.lado * (FACE + 6), p.z0 + 6, p.h + 1.1, 5.2);
    }
    // praca do Callao: laterais (|x| = 30) e predios de frente (z = -15)
    predio(-62, -30, -15, 70, 33.8, 0, 1.0); predio(30, 62, -15, 70, 30.2, 3, 1.0);
    predio(FACE, 45, -45, -15, 36, 5, 0.95, 'xXzZ', false);                                          // predio das telas
    // Palacio de la Prensa: corpo + torre escalonada de tijolo e pedra
    predio(-45, -FACE, -45, -15, 41, 1, 1.0, 'xXzZ', false);
    acF[1].caixa(-31, -FACE - 1, 42.1, 50, -40, -16.5, FACH_W, FACH_H, tomC(1)); acLiso.caixa(-31.5, -FACE - 0.5, 50, 51, -40.5, -16, 1, 1, tomC(0.9, '#e3d7bf'));
    acF[1].caixa(-28, -FACE - 4, 51, 57, -36, -19.5, FACH_W, FACH_H, tomC(1)); acLiso.caixa(-28.5, -FACE - 3.5, 57, 58, -36.5, -19, 1, 1, tomC(0.9, '#e3d7bf'));
    { const mastro = new THREE.CylinderGeometry(0.12, 0.12, 8, 8); mastro.translate(-23, 62, -28); extrasLiso.push(comCor(mastro, '#d8d8d8')); }
    // Edificio Carrion: proa curva de frente para a praca, faixas de janela horizontais, letreiro luminoso no alto
    {
      const cx = -26, cz = -143, r = 9;
      const terreo = new THREE.CylinderGeometry(r, r, TERREO, 40, 1, true); escalaUV(terreo, (2 * Math.PI * r) / LOJA_W, TERREO / LOJA_H); terreo.translate(cx, TERREO / 2, cz);
      extrasL.push(comCor(terreo, '#ffffff'));
      const corpo = new THREE.CylinderGeometry(r, r, 52 - TERREO, 40, 1, true); escalaUV(corpo, (2 * Math.PI * r) / FACH_W, (52 - TERREO) / FACH_H); corpo.translate(cx, TERREO + (52 - TERREO) / 2, cz);
      extrasF[2].push(comCor(corpo, '#ffffff'));
      const topo = new THREE.CylinderGeometry(r - 1.5, r - 1.5, 6, 40, 1, true); escalaUV(topo, (2 * Math.PI * (r - 1.5)) / FACH_W, 6 / FACH_H); topo.translate(cx, 52 + 3, cz);
      extrasF[2].push(comCor(topo, '#ffffff'));
      for (const [y, rr] of [[52, r + 0.6], [58, r - 0.9]] as number[][]) { const tp = new THREE.CylinderGeometry(rr, rr, 1, 40); tp.translate(cx, y + 0.5, cz); extrasLiso.push(comCor(tp, '#d9d3c5')); }
      predio(-60, -FACE, -200, cz, 52, 2, 1.0, 'xXzZ', false);
      predio(-60, cx - r + 0.5, cz - 2, cz + 4, 46, 2, 1.0, 'xXzZ', false);
      const haste = new THREE.BoxGeometry(20, 0.4, 0.4); haste.translate(cx + 2, 58.6, cz + 11); extrasLiso.push(comCor(haste, '#2a2a2a'));
      // predios do outro lado da Jacometrezo (a rua abre para a esquerda)
      predio(-95, -48, -150, -118, 34, 0, 0.95);
    }
    // torres da Plaza de Espana no fim da avenida
    acF[5].caixa(24, 46, TERREO, 142, -872, -852, FACH_W, FACH_H, tomC(1)); acL.caixa(24, 46, 0, TERREO, -872, -852, LOJA_W, LOJA_H, tomC(1));
    acLiso.caixa(26, 44, 142, 147, -870, -854, 1, 1, tomC(1, '#c9c6c0'));
    acF[1].caixa(-80, -30, TERREO, 88, -850, -812, FACH_W, FACH_H, tomC(1)); acL.caixa(-80, -30, 0, TERREO, -850, -812, LOJA_W, LOJA_H, tomC(1));
    acF[1].caixa(-66, -44, 88, 117, -842, -820, FACH_W, FACH_H, tomC(1)); acLiso.caixa(-67, -43, 117, 119, -843, -819, 1, 1, tomC(1, '#e3d7bf'));
    // enchimento do horizonte (quarteiroes atras das fachadas)
    for (let i = 0; i < 46; i++) {
      const lado = i % 2 ? 1 : -1, x0 = lado * (52 + rnd(i * 3) * 160), w = 25 + rnd(i * 5) * 40, z1 = -40 - rnd(i * 7) * 900, d = 25 + rnd(i * 11) * 40, h = 18 + rnd(i * 13) * 34;
      predio(Math.min(x0, x0 + lado * w), Math.max(x0, x0 + lado * w), z1 - d, z1, h, Math.floor(rnd(i * 17) * 6), 0.9 + rnd(i) * 0.15, 'xXzZ', rnd(i * 19) < 0.5);
    }
    // escadaria de granito da praca (no lugar da escada vermelha do TKTS) e plataforma da camera
    const gran = new THREE.Color('#9a928b'), granEsc = new THREE.Color('#4f4945');
    acLiso.caixa(-9, 9, 0, 3.0, 33, 50, 1, 1, gran);
    for (let k = 0; k < 13; k++) { const top = 3.0 - (k + 1) * 0.23; if (top <= 0) break;
      acLiso.caixa(-9, 9, 0, top, 33 - (k + 1), 33 - k, 1, 1, gran.clone().multiplyScalar(k % 2 ? 0.97 : 1.03), 0, 0, 'xXzt');
      acLiso.caixa(-9, 9, top - 0.05, top + 0.004, 33 - (k + 1), 33 - (k + 1) + 0.3, 1, 1, granEsc, 0, 0, 'zt'); }
    // postes (farola fernandina) nas calcadas e na praca
    const postes: [number, number][] = [];
    for (let z = -22; z > -760; z -= 24) { postes.push([-RUA - 1.2, z]); postes.push([RUA + 1.2, z - 12]); }
    for (const p of [[-20, 10], [20, 10], [-20, -8], [20, -8], [-14, 24], [14, 24]]) postes.push(p as [number, number]);
    const geoPoste = mergeGeometries([
      (() => { const g = new THREE.CylinderGeometry(0.22, 0.3, 0.8, 10); g.translate(0, 0.4, 0); return g.toNonIndexed(); })(),
      (() => { const g = new THREE.CylinderGeometry(0.08, 0.12, 4.0, 8); g.translate(0, 2.8, 0); return g.toNonIndexed(); })(),
      (() => { const g = new THREE.BoxGeometry(0.5, 0.75, 0.5); g.translate(0, 5.15, 0); return g.toNonIndexed(); })(),
      (() => { const g = new THREE.ConeGeometry(0.42, 0.45, 4); g.rotateY(Math.PI / 4); g.translate(0, 5.75, 0); return g.toNonIndexed(); })(),
    ]) as THREE.BufferGeometry;
    const im = new THREE.InstancedMesh(geoPoste, new THREE.MeshStandardMaterial({color: '#1f2622', roughness: 0.5, metalness: 0.5}), postes.length);
    const o = new THREE.Object3D(); postes.forEach(([x, z], i) => { o.position.set(x, 0, z); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); im.castShadow = true;
    // chao: asfalto, calcadas (com meio-fio), praca; marcas viarias
    const chao: THREE.Mesh[] = [];
    const plano = (w: number, d: number, x: number, y: number, z: number, tex: THREE.Texture, tile: number, cor = '#ffffff', rough = 0.95) => {
      const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); escalaUV(g, w / tile, d / tile); g.translate(x, y, z);
      const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({map: tex, color: cor, roughness: rough})); m.receiveShadow = true; chao.push(m);
    };
    plano(2 * RUA, 1200, 0, 0, -15 - 600, texAsf, 6);
    plano(400, 1200, 0, -0.05, -15 - 600, texAsf, 6, '#9a9a9a');
    for (const s of [-1, 1]) { plano(FACE - RUA, 1200, s * (RUA + FACE) / 2, 0.15, -15 - 600, texCalcada, 4); acLiso.caixa(s > 0 ? RUA : -RUA - 0.25, s > 0 ? RUA + 0.25 : -RUA, 0, 0.16, -1215, -15, 1, 1, new THREE.Color('#a8a39c')); }
    plano(60, 120, 0, 0.02, 45, texPraca, 6);
    const marcas = new Acum(), branco = new THREE.Color('#e8e8e2');
    for (let z = -32; z > -800; z -= 9) for (const x of [-4.1, 4.1, -7.9, 7.9]) marcas.caixa(x - 0.08, x + 0.08, 0.01, 0.03, z - 4, z, 1, 1, branco, 0, 0, 't');
    for (const x of [-0.18, 0.18]) marcas.caixa(x - 0.08, x + 0.08, 0.01, 0.03, -800, -27, 1, 1, branco, 0, 0, 't');
    for (const zc of [-22.5, -300]) for (let x = -11.4; x < 11.5; x += 1.0) marcas.caixa(x, x + 0.5, 0.01, 0.03, zc - 2.6, zc + 2.6, 1, 1, branco, 0, 0, 't');
    marcas.caixa(-12, 0, 0.01, 0.03, -27.6, -27.2, 1, 1, branco, 0, 0, 't');
    const mMarcas = new THREE.Mesh(marcas.geo(), new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.7})); mMarcas.receiveShadow = true; chao.push(mMarcas);
    // malhas finais
    const mats = texF.map((tx) => new THREE.MeshStandardMaterial({map: tx, vertexColors: true, roughness: 0.82}));
    const out: THREE.Object3D[] = [];
    acF.forEach((a, i) => { const m = new THREE.Mesh(a.geo(extrasF[i]), mats[i]); m.castShadow = m.receiveShadow = true; out.push(m); });
    { const m = new THREE.Mesh(acL.geo(extrasL), new THREE.MeshStandardMaterial({map: texL, vertexColors: true, roughness: 0.6, emissiveMap: texL, emissive: new THREE.Color(0.35, 0.3, 0.22)})); m.receiveShadow = true; out.push(m); }
    { const m = new THREE.Mesh(acLiso.geo(extrasLiso), new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.85})); m.castShadow = m.receiveShadow = true; out.push(m); }
    { const m = new THREE.Mesh(acTelhado.geo(), new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.7, metalness: 0.2})); m.castShadow = true; out.push(m); }
    { const m = new THREE.Mesh(mergeGeometries(cupulas.map((g) => g.toNonIndexed())) as THREE.BufferGeometry, new THREE.MeshStandardMaterial({color: '#2f3640', roughness: 0.4, metalness: 0.6})); m.castShadow = true; out.push(m); }
    { const m = new THREE.Mesh(mergeGeometries(ouro.map((g) => g.toNonIndexed())) as THREE.BufferGeometry, new THREE.MeshStandardMaterial({color: '#d4a63a', roughness: 0.3, metalness: 1})); out.push(m); }
    out.push(im, ...chao);
    return out;
  }, []);
  return <>{objs.map((o, i) => <primitive key={i} object={o} />)}</>;
};

const Teloes: React.FC<{t: number}> = ({t}) => {
  const {cv, ctx, tex, malha, mold} = useMemo(() => {
    const cv = novoCanvas(ATLAS, ATLAS), ctx = cv.getContext('2d')!;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.generateMipmaps = true;
    const {telas, molduras} = geoTelas(telasLista());
    const malha = new THREE.Mesh(telas, new THREE.MeshBasicMaterial({map: tex, color: new THREE.Color(1.45, 1.45, 1.45), toneMapped: false, side: THREE.DoubleSide}));
    const mold = new THREE.Mesh(molduras, new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.6, metalness: 0.4})); mold.castShadow = true;
    return {cv, ctx, tex, malha, mold};
  }, []);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
  for (let k = 0; k < DES.length; k++) desenhaCelula(ctx, k, t);
  tex.needsUpdate = true;
  return <><primitive object={malha} /><primitive object={mold} /></>;
};

// ======================================================================================================================
// camera
// ======================================================================================================================
const alvoDe = (pos: [number, number, number], yawGraus: number, pitchGraus: number): [number, number, number] => {
  const y = (yawGraus * Math.PI) / 180, p = (pitchGraus * Math.PI) / 180;
  return [pos[0] + Math.sin(y) * 300, pos[1] + Math.tan(p) * 300, pos[2] - Math.cos(y) * 300];
};
const PA: [number, number, number] = [0, 4.6, 34.6];   // na borda do patamar: os degraus aparecem na base do quadro
const CAM_A: ChaveCam[] = [
  [74.9, PA, alvoDe(PA, -1.5, -3.0), 55], [80.0, PA, alvoDe(PA, 1.8, -2.5), 55], [88.0, [0, 4.6, 34.3], alvoDe(PA, -0.6, 8.5), 55], [97.8, [0, 4.6, 34], alvoDe(PA, 0.8, 15), 55],
];
const PB: [number, number, number] = [0.5, 1.0, -15.5];
const CAM_B: ChaveCam[] = [[97.8, PB, alvoDe(PB, -4, 18), 80], [103.9, [0.5, 1.0, -16.5], alvoDe(PB, -1.5, 25), 80]];
const camMadrid = (t: number) => {
  if (!planoB(t)) {
    const c = camEm(CAM_A, t);
    const treme = smooth(94.5, 97.5, t) * 0.35;
    const roll = smooth(88, 97.8, t) * 13 + treme * Math.sin(t * 23.0) * 1.2;
    c.alvo[1] += treme * Math.sin(t * 17.3) * 2.0; c.alvo[0] += treme * Math.sin(t * 13.1 + 1) * 2.0;
    return {...c, fov: 55 + 12 * smooth(91, 97.6, t), roll};
  }
  const c = camEm(CAM_B, t);
  return {...c, roll: -3 - 3.5 * smooth(97.8, 103.9, t)};
};

// ======================================================================================================================
// mundo
// ======================================================================================================================
const PERFIL_A: Perfil = {ao: true, bloom: 0.55, limiar: 0.85, vinheta: 0.35, saturacao: 0.05, contraste: 0.06, nevoa: {cor: '#c6d3e0', densidade: 0.00035, max: 0.75}};
const PERFIL_B: Perfil = {ao: true, bloom: 0.75, limiar: 0.8, vinheta: 0.45, saturacao: -0.04, contraste: 0.08, brilho: -0.02, nevoa: {cor: '#3a7482', densidade: 0.0042, max: 0.9}};
export const perfilMadrid = (t: number): Perfil => (planoB(t) ? PERFIL_B : {...PERFIL_A, nevoa: {...PERFIL_A.nevoa, cor: corHorizonte(t, 'madrid')}});

export const Madrid: React.FC<{t: number}> = ({t}) => {
  useFontes();
  const {camera, scene} = useThree();
  const B = planoB(t);
  const c = camMadrid(t), cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.alvo); cam.rotateZ((c.roll * Math.PI) / 180);
  cam.fov = c.fov; cam.near = 0.3; cam.far = 12000; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  if (B) scene.environment = null;   // debaixo do teto de agua: sem o ceu como IBL (o CeuLugar nao e montado)
  const camV = useMemo(() => new THREE.Vector3(), []); camV.set(...c.pos);
  const estA = useMemo(() => (p: Pessoa3D, k: number, tt: number) => estadoGente(GENTE_A[k], tt), []);
  const estB = useMemo(() => (p: Pessoa3D, k: number, tt: number) => estadoGenteB(GENTE_B[k], tt), []);
  return (
    <>
      {!B && <CeuLugar t={t} lugar="madrid" sombra={110} />}
      {B && <>
        <color attach="background" args={['#2c5d69']} />
        <hemisphereLight args={['#86bcc6', '#1d2a31', 1.7]} />
        <directionalLight position={[30, 120, -40]} intensity={1.3} color="#bfe6ea" />
        <ambientLight intensity={0.25} color="#5d8f99" />
        <Teto t={t} />
        {t >= 99.6 && <Cardume t={t} />}
      </>}
      <Cidade />
      <Teloes t={t} />
      <Veiculos t={t} />
      <Figurantes t={t} />
      {!B && <Multidao3D lista={PESSOAS_A} t={t} de={[0, 0]} cam={camV} raio={1.2} estadoDe={estA} />}
      {B && <Multidao3D lista={PESSOAS_B} t={t} de={[0, 0]} cam={camV} raio={1.4} estadoDe={estB} />}
      {ondaVisivel(t) && <><Onda t={t} />{!String((globalThis as any).__dbg ?? '').includes('semSpray') && <Spray t={t} />}</>}
      {!B && <BrancoDeAgua t={t} />}
    </>
  );
};
