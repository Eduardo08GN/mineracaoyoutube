// Utilitarios: desvio do KHR_parallel_shader_compile do Chrome do render (G4) e funcoes puras.
import * as THREE from 'three';

for (const C of [typeof WebGL2RenderingContext !== 'undefined' ? WebGL2RenderingContext : null, typeof WebGLRenderingContext !== 'undefined' ? WebGLRenderingContext : null]) {
  if (!C || (C.prototype as any).__semParalelo) continue;
  const orig = C.prototype.getExtension;
  (C.prototype as any).getExtension = function (this: WebGLRenderingContext, nome: string) { return nome === 'KHR_parallel_shader_compile' ? null : orig.call(this, nome); };
  (C.prototype as any).__semParalelo = true;
}
export const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (a: number, b: number, x: number) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
export type V3 = [number, number, number];
const h2 = (x: number, z: number) => rnd(Math.floor(x) * 57 + Math.floor(z) * 131);
export const vnoise = (x: number, z: number) => {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = h2(ix, iz), b = h2(ix + 1, iz), c = h2(ix, iz + 1), d = h2(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
};
export const fbm = (x: number, z: number) => vnoise(x, z) * 0.55 + vnoise(x * 2.1 + 5, z * 2.1 + 9) * 0.3 + vnoise(x * 4.3 + 11, z * 4.3 + 3) * 0.15;
export const cor = (h: string) => new THREE.Color(h);
