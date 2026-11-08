// Chao e agua facetados (low-poly flat-shaded) na paleta do kit roadside-americana (areia #cfa273, #caaa82, #b99366; cascalho #968173).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {cor, fbm, rnd, smooth} from './util';
import {normalAgua} from './normal';

export const hChao = (x: number, z: number) => 0.05 * (fbm(x * 0.35, z * 0.35) - 0.5) * 2 + 0.9 * smooth(30, 120, Math.hypot(x * 0.7, z + 20) - 20) * (0.6 + fbm(x * 0.02, z * 0.02));

const PAL = ['#cfa273', '#caaa82', '#c49a6c', '#b99366', '#a99a92', '#968173'].map(cor);
export const Chao: React.FC = () => {
  const geo = useMemo(() => {
    const N = 150, L = 300, g = new THREE.PlaneGeometry(L, L, N, N); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i); p.setY(i, hChao(x, z));
      const k = fbm(x * 0.2, z * 0.2), r = rnd(i), c = PAL[Math.min(PAL.length - 1, Math.floor((k * 0.7 + r * 0.5) * PAL.length * 0.9))].clone().multiplyScalar(0.92 + 0.16 * rnd(i + 99));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
  }, []);
  return (
    <group>
      <mesh geometry={geo} receiveShadow castShadow><meshStandardMaterial vertexColors flatShading roughness={0.95} metalness={0} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.12}><planeGeometry args={[30000, 30000]} /><meshStandardMaterial color="#b08a62" roughness={1} /></mesh>
    </group>
  );
};

export type AguaCfg = {fosco?: boolean; vesp?: [number, number]; espumaLim?: number; fluxo?: number; nivel: number; fundo: string; meio: string; crista: string; espuma: string; amp: number; comp: number; circulos: [number, number, number][]; frente?: {z: number; larg: number}; rough?: number; env?: number; ana?: {bandas: number; stream: number; anel: number; ph: number; lmin?: number}; esteiras?: [number, number, number][]};
export const hAgua = (x: number, z: number, c: AguaCfg) => {
  const k = 1 / c.comp, f = c.fluxo ?? 1;   // fluxo < 1 alonga as cristas na direcao x (a correnteza corre ao longo de x)
  return c.amp * (0.6 * Math.sin(x * k * f * 0.9 + z * k * 0.55 + 1.3) + 0.4 * Math.sin(x * k * f * 2.1 - z * k * 1.3 + 4.0) + 0.3 * Math.sin(z * k * 2.4 + x * k * f * 0.6) + (fbm(x * k * f * 1.4, z * k * 1.4) - 0.5) * 1.5);
};
// malha com ondas por vertice (CPU, funcao pura), cor por vertice (fundo -> crista -> espuma): espuma nas cristas, em volta dos obstaculos e na frente da enchente

// Receita threejs-water-optics (rio raso): bandas direcionais analiticas, normal derivada da MESMA soma de ondas, filtradas por derivada (sem sparkle);
// bandas com vetor de onda cruzando a correnteza (+x) => cristas alongadas na direcao do fluxo; espuma em faixas (stream lines) e anel em volta do tronco.
const GLSL_FUNCS = `
uniform vec2 uTrunk; uniform float uBandas; uniform float uStream; uniform float uAnel; uniform float uPh; uniform float uLmin; varying vec3 vWP;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
vec2 gradBandas(vec2 p, float fw) {
  vec2 g = vec2(0.0);
  for (int i = 0; i < 7; i++) {
    float fi = float(i), ang = 1.5708 + (fi - 3.0) * 0.2 + 0.18 * sin(fi * 2.3);
    vec2 d = vec2(cos(ang), sin(ang)); float lam = mix(3.2, uLmin, fi / 6.0), k = 6.2832 / lam;
    float fade = 1.0 - smoothstep(0.2, 0.7, fw * k);
    float sl = uBandas * (0.07 + 0.06 * fi / 6.0);
    float drift = 0.9 * sqrt(9.81 * k) * 0.35;   // fase da correnteza (still: uPh fixo)
    g += d * sl * cos(k * dot(d, p) + fi * 1.7 - drift * uPh) * fade;
  }
  return g;
}
float espumaFaixas(vec2 p) {
  float s = smoothstep(0.56, 0.76, vn2(vec2(p.x * 0.16, p.y * 2.4)) * 0.75 + vn2(vec2(p.x * 0.5, p.y * 5.0)) * 0.35);
  float tr = smoothstep(0.35, 0.8, vn2(p * vec2(0.22, 0.9) + 7.0));
  return s * tr;
}
float anelTronco(vec2 p) {
  float d = length(p - uTrunk), r = 0.0;
  r += 1.0 - smoothstep(0.0, 0.32, abs(d - 2.05));
  r += 0.7 * (1.0 - smoothstep(0.0, 0.26, abs(d - 2.9)));
  r += 1.0 - smoothstep(1.55, 2.0, d);
  r += 1.0 - smoothstep(0.0, 0.2, abs(d - 0.8));
  return clamp(r, 0.0, 1.0) * (0.55 + 0.45 * vn2(p * 2.6));
}`;
const patchAgua = (sh: any, u: Record<string, {value: any}>) => {
  Object.assign(sh.uniforms, u);
  sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  sh.fragmentShader = GLSL_FUNCS + '\n' + sh.fragmentShader
    .replace('#include <color_fragment>', `#include <color_fragment>
  { float fs = espumaFaixas(vWP.xz) * uStream + anelTronco(vWP.xz) * uAnel; diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.94, 0.89, 0.78), clamp(fs, 0.0, 1.0) * 0.8); }`)
    .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  { vec2 g = gradBandas(vWP.xz, length(fwidth(vWP.xz))); normal = normalize(normal + (viewMatrix * vec4(-g.x, 0.0, -g.y, 0.0)).xyz); }`);
};

export const Agua: React.FC<{c: AguaCfg}> = ({c}) => {
  const geo = useMemo(() => {
    const N = 330, L = 170, g = new THREE.PlaneGeometry(L, L, N, N); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, col = new Float32Array(p.count * 3), fu = cor(c.fundo), me = cor(c.meio), cr = cor(c.crista), es = cor(c.espuma), tmp = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), h = hAgua(x, z, c); p.setY(i, c.nivel + h);
      const u = THREE.MathUtils.clamp((h / (c.amp * 2.2)) * 0.5 + 0.5, 0, 1);
      tmp.copy(fu).lerp(me, smooth(0.15, 0.55, u)).lerp(cr, smooth(0.55, 0.95, u)).multiplyScalar(0.9 + 0.2 * rnd(i));
      let f = smooth(c.espumaLim ?? 0.8, (c.espumaLim ?? 0.8) + 0.2, u + 0.12 * (rnd(i + 5) - 0.5)) * 0.85;
      for (const [cx, cz, r] of c.circulos) { const d = Math.hypot(x - cx, z - cz); f = Math.max(f, (1 - smooth(r * 0.7, r + 1.1, d)) * (0.7 + 0.3 * rnd(i + 17))); }
      for (const v of [c.vesp, ...(c.esteiras ?? [])]) { if (!v) continue; const dx = v[0] - x; if (dx > 0 && dx < 16) { const d = Math.abs(z - v[1]); const larg = (v[2] ?? 1.75) * 0.4 + 0.32 * dx; f = Math.max(f, (1 - smooth(larg * 0.55, larg, d)) * (1 - smooth(8, 16, dx)) * (0.7 + 0.3 * rnd(i + 23))); } }
      if (c.frente) { const d = Math.abs(z - (c.frente.z + 1.4 * Math.sin(x * 0.18) + 0.8 * Math.sin(x * 0.53))); f = Math.max(f, (1 - smooth(0, c.frente.larg, d)) * (0.75 + 0.25 * rnd(i + 3))); }
      tmp.lerp(es, Math.min(1, f)); col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
  }, [c]);
  // normal map ladrilhavel (UV do plano 0..1 repetido a cada ~4 m): ondulacao fina sobre as facetas; lama fosca (C) = normal mais suave e rugosa
  const nmap = useMemo(() => { const t = normalAgua(256, c.fosco ? 0.6 : 1); t.repeat.set(24, 24); return t; }, [c.fosco]);
  const nsc = useMemo(() => new THREE.Vector2(0.3, 0.3), []);
  const onBC = useMemo(() => (sh: any) => { const a = c.ana ?? {bandas: 0, stream: 0, anel: 0, ph: 0}; patchAgua(sh, {uTrunk: {value: new THREE.Vector2(...(c.vesp ?? [0, 0]))}, uBandas: {value: a.bandas}, uStream: {value: a.stream}, uAnel: {value: a.anel}, uPh: {value: a.ph}, uLmin: {value: a.lmin ?? 0.3}}); }, [c]);
  return (
    <group>
      <mesh geometry={geo} receiveShadow><meshPhysicalMaterial vertexColors flatShading roughness={c.rough ?? 0.3} metalness={0} transmission={0} envMapIntensity={c.env ?? 1.2} normalMap={nmap} normalScale={nsc} onBeforeCompile={onBC} customProgramCacheKey={() => 'agua' + (c.ana ? 1 : 0)} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={c.nivel - 0.25}><planeGeometry args={[30000, 30000]} /><meshStandardMaterial color={c.fundo} roughness={0.5} /></mesh>
    </group>
  );
};

export const Chuva: React.FC<{centro: THREE.Vector3; n?: number; cor?: string; op?: number; eixo?: 'x' | 'z'}> = ({centro, eixo = 'z', n = 1300, cor: c = '#cfe0ff', op = 0.4}) => {
  const geo = useMemo(() => {
    let a = 123456789; const R = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };   // mulberry32: sem padrao de colunas
    const pos = new Float32Array(n * 12), idx: number[] = [];
    for (let i = 0; i < n; i++) {
      const ax = eixo === 'z', x = ax ? centro.x - 10 + R() * 14 : centro.x - 3 - R() * 22, y = centro.y - 3 + R() * 10, z = ax ? centro.z - 4 - R() * 20 : centro.z - 9 + R() * 16, l = 0.5 + R() * 1.1, w = 0.002 + 0.0022 * R(), tilt = 0.1 + 0.08 * R();
      pos.set([x - w, y, z, x + w, y, z, x - w - tilt * l, y - 1.3 * l, z, x + w - tilt * l, y - 1.3 * l, z], i * 12);
      const b = i * 4; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); return g;
  }, [centro.x, centro.y, centro.z, n]);
  return <mesh name="chuva" geometry={geo} frustumCulled={false}><meshBasicMaterial color={c} transparent opacity={op} fog={false} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} /></mesh>;
};

// Respingos da chuva (receita threejs-precipitation-surfaces: anel de impacto so em superficie voltada para cima, na mesma regiao da chuva): aneis concentricos finos pousados na agua
export const Respingos: React.FC<{c: AguaCfg; n?: number; x: [number, number]; z: [number, number]; cor?: string; op?: number}> = ({c, n = 260, x, z, cor: cr = '#d6e4ff', op = 0.32}) => {
  const geo = useMemo(() => {
    const SEG = 20, pos: number[] = [], idx: number[] = [];
    const anel = (cx: number, cy: number, cz: number, r: number, w: number) => {
      const b = pos.length / 3;
      for (let i = 0; i <= SEG; i++) { const a = (i / SEG) * 6.2832, ca = Math.cos(a), sa = Math.sin(a); pos.push(cx + ca * (r - w), cy, cz + sa * (r - w), cx + ca * (r + w), cy, cz + sa * (r + w)); }
      for (let i = 0; i < SEG; i++) { const k = b + i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    };
    for (let i = 0; i < n; i++) {
      const px = x[0] + rnd(i * 4 + 1) * (x[1] - x[0]), pz = z[0] + rnd(i * 4 + 2) * (z[1] - z[0]), py = c.nivel + hAgua(px, pz, c) + 0.04, r = 0.035 + 0.1 * rnd(i * 4 + 3) * rnd(i * 4 + 3);
      anel(px, py, pz, r, 0.008 + 0.01 * r); if (rnd(i + 900) < 0.6) anel(px, py, pz, r * 0.55, 0.005);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
  }, [c, n, x[0], x[1], z[0], z[1]]);
  return <mesh geometry={geo} frustumCulled={false}><meshBasicMaterial color={cr} transparent opacity={op} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} fog={false} /></mesh>;
};
