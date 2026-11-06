// Pecas comuns das cenas de cidade (cdmx, lapaz): carga de assets com delayRender, texturas float16, grade do relevo,
// casas por instancia ao longo das ruas reais (OSM), camera do quadro e projecao dos rotulos. Tudo funcao pura do quadro.
import {useEffect, useState} from 'react';
import * as THREE from 'three';
import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';

// o Chrome do render compila shaders em paralelo e o primeiro quadro de cada aba saia sem materiais (licao do video 6, batedor 07)
for (const C of [typeof WebGL2RenderingContext !== 'undefined' ? WebGL2RenderingContext : null, typeof WebGLRenderingContext !== 'undefined' ? WebGLRenderingContext : null]) {
  if (!C || (C.prototype as any).__semParalelo) continue;
  const orig = C.prototype.getExtension;
  (C.prototype as any).getExtension = function (this: WebGLRenderingContext, nome: string) { return nome === 'KHR_parallel_shader_compile' ? null : orig.call(this, nome); };
  (C.prototype as any).__semParalelo = true;
}

// ---------------------------------------------------------------- carga (uma vez por aba; o quadro espera)
const cache: Record<string, unknown> = {};
const pend: Record<string, Promise<unknown>> = {};
export function useCarga<T>(chave: string, fn: () => Promise<T>): T | null {
  const [v, setV] = useState<T | null>(() => (cache[chave] as T) ?? null);
  const [h] = useState(() => (cache[chave] ? null : delayRender(`cidade ${chave}`, {timeoutInMilliseconds: 180000})));
  useEffect(() => {
    if (v) { if (h !== null) continueRender(h); return; }
    (pend[chave] ??= fn().then((r) => { cache[chave] = r; return r; })).then((r) => setV(r as T), (e) => { console.error('CIDADE_FALHOU', chave, e); cancelRender(e); });
  }, [v, h]);
  return v;
}
export const buscaBin = async (arq: string) => (await fetch(staticFile(arq))).arrayBuffer();
export const buscaJson = async (arq: string) => (await fetch(staticFile(arq))).json();
export const texF16 = (buf: ArrayBuffer, w: number, h: number, canais: 1 | 4 = 1) => {
  const t = new THREE.DataTexture(new Uint16Array(buf), w, h, canais === 1 ? THREE.RedFormat : THREE.RGBAFormat, THREE.HalfFloatType);
  t.magFilter = t.minFilter = THREE.LinearFilter; t.flipY = false; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true; return t;
};

// ---------------------------------------------------------------- utilidades puras
export const cl = (a: number, b: number, x: number) => Math.min(b, Math.max(a, x));
export const smooth = (a: number, b: number, x: number) => { const u = cl(0, 1, (x - a) / (b - a)); return u * u * (3 - 2 * u); };
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const lerp3 = (a: number[], b: number[], k: number): [number, number, number] => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
// dolly que nunca para: parte linear + parte suave (a camera anda do primeiro ao ultimo quadro)
export const dolly = (u: number, lin = 0.3) => lin * u + (1 - lin) * (u * u * (3 - 2 * u));
export const rnd = (k: number) => { const s = Math.sin(k * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
// piecewise linear por nos (x crescente)
export const pl = (xs: number[], ys: number[], x: number) => {
  if (x <= xs[0]) return ys[0];
  for (let i = 1; i < xs.length; i++) if (x <= xs[i]) return lerp(ys[i - 1], ys[i], (x - xs[i - 1]) / (xs[i] - xs[i - 1]));
  return ys[ys.length - 1];
};

// ---------------------------------------------------------------- grade do relevo (uv em position.xz; o shader poe x, y, z)
const grades: Record<string, THREE.BufferGeometry> = {};
export const grade = (nx: number, ny: number) => {
  const k = `${nx}x${ny}`; if (grades[k]) return grades[k];
  const pos = new Float32Array((nx + 1) * (ny + 1) * 3);
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const o = (j * (nx + 1) + i) * 3; pos[o] = i / nx; pos[o + 1] = 0; pos[o + 2] = j / ny; }
  const idx = new Uint32Array(nx * ny * 6); let o = 0;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
    idx[o++] = a; idx[o++] = c; idx[o++] = b; idx[o++] = b; idx[o++] = c; idx[o++] = d;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9); grades[k] = g; return g;
};

// caixa unitaria (x,z em -0.5..0.5, y em 0..1) com normais, para as casas instanciadas
export const caixaInstanciada = (inst: Float32Array) => {
  const b = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const g = new THREE.InstancedBufferGeometry();
  g.index = b.index; g.setAttribute('position', b.attributes.position); g.setAttribute('normal', b.attributes.normal);
  g.setAttribute('aI', new THREE.InstancedBufferAttribute(inst, 4));
  g.instanceCount = inst.length / 4; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);
  return g;
};

// ---------------------------------------------------------------- camera do quadro + projecao para os rotulos (mesma conta)
export type Cam = {pos: [number, number, number]; alvo: [number, number, number]; fov: number};
export const camera3 = (c: Cam) => {
  const d = Math.hypot(c.pos[0] - c.alvo[0], c.pos[1] - c.alvo[1], c.pos[2] - c.alvo[2]);
  const cam = new THREE.PerspectiveCamera(c.fov, 1920 / 1080, Math.max(0.5, d * 0.004), d * 6 + 90000);
  cam.position.set(...c.pos); cam.lookAt(...c.alvo); cam.updateProjectionMatrix(); cam.updateMatrixWorld(); return cam;
};
export const aplicaCamera = (alvo: THREE.Camera, c: Cam) => {
  const ref = camera3(c), cam = alvo as THREE.PerspectiveCamera;
  cam.position.copy(ref.position); cam.quaternion.copy(ref.quaternion); cam.fov = ref.fov; cam.near = ref.near; cam.far = ref.far; cam.aspect = ref.aspect;
  cam.updateProjectionMatrix(); cam.updateMatrixWorld();
};
export const projeta = (cam: THREE.PerspectiveCamera, p: [number, number, number]) => {
  const v = new THREE.Vector3(...p).project(cam);
  const atras = new THREE.Vector3(...p).applyMatrix4(cam.matrixWorldInverse).z > 0;
  return {x: (v.x * 0.5 + 0.5) * 1920, y: (-v.y * 0.5 + 0.5) * 1080, ok: !atras && Math.abs(v.z) <= 1};
};

// ---------------------------------------------------------------- GLSL comum: luz estilizada, ceu e nevoa de perspectiva aerea
export const GLSL_LUZ = /* glsl */ `
uniform vec3 uSol, uCeuH, uCeuZ; uniform float uNev0, uNev1;
vec3 iluminar(vec3 alb, vec3 n) {
  float d = max(dot(n, uSol), 0.0);
  float hemi = 0.5 + 0.5 * n.y;
  return alb * (vec3(1.05, 0.98, 0.88) * d * 1.05 + mix(vec3(0.30, 0.31, 0.36), vec3(0.50, 0.60, 0.74), hemi) * 0.62);
}
vec3 nevoa(vec3 c, float dist, vec3 wp, vec3 cp) {
  float f = smoothstep(uNev0, uNev1, dist);
  float alt = clamp((wp.y - cp.y) / (dist + 1.0) * 2.0 + 0.5, 0.0, 1.0);
  return mix(c, mix(uCeuH, uCeuZ, alt * 0.35), f * 0.88);
}`;
