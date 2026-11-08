// Normal map procedural e ladrilhavel (soma de ondas senoidais periodicas): agua barrenta com ondulacao fina, sem baixar textura.
import * as THREE from 'three';
import {rnd} from './util';

export const normalAgua = (N = 256, forca = 1): THREE.DataTexture => {
  // ondas (i, j) inteiros => periodicas em [0,1]; amplitude cai com a frequencia; a corrente corre ao longo de u (frequencias em u mais baixas)
  const ondas: {i: number; j: number; a: number; f: number}[] = [];
  for (let k = 0; k < 14; k++) { const i = 1 + Math.floor(rnd(k * 3 + 1) * 5), j = 2 + Math.floor(rnd(k * 3 + 2) * 9) * (rnd(k) < 0.5 ? 1 : -1); ondas.push({i, j, a: 1 / Math.hypot(i, j * 0.6), f: rnd(k * 3 + 3) * 6.283}); }
  const d = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N; let gx = 0, gy = 0;
    for (const o of ondas) { const c = Math.cos(6.283 * (o.i * u + o.j * v) + o.f) * o.a; gx += c * o.i; gy += c * o.j; }
    const nx = -gx * 0.09 * forca, ny = -gy * 0.09 * forca, nz = 1, l = Math.hypot(nx, ny, nz), k = (y * N + x) * 4;
    d[k] = Math.round((nx / l * 0.5 + 0.5) * 255); d[k + 1] = Math.round((ny / l * 0.5 + 0.5) * 255); d[k + 2] = Math.round((nz / l * 0.5 + 0.5) * 255); d[k + 3] = 255;
  }
  const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true; return t;
};
