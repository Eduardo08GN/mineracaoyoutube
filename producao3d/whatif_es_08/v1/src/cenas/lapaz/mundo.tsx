// Mundo de La Paz / El Alto: canion real (AWS Terrain Tiles z13, 1536 x 784, ~39 m) com a agua pelo dado (priority-flood fino
// semeado pelo nivel do video: entra pelo rio La Paz, do leste; o altiplano enche a partir de 3.851 m), casas de tijolo ao longo
// das ruas do OSM e as 10 linhas do Mi Teleferico (tracado OSM) com cabines que andam pelo tempo do video.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {DADOS} from '../../dados';
import {buscaBin, buscaJson, caixaInstanciada, grade, rnd, texF16} from '../cdmx/comum';
import {ALB_LAPAZ, ANEL_F, ANEL_V, ESTADO_LAPAZ, GLSL_BASE, PREDIO_F, PREDIO_V, TERRENO_F, TERRENO_V} from '../cdmx/glsl';
import {CEU_H, CEU_Z} from '../cdmx/mundo';

type Linha = {nome: string; cor: string; p: [number, number, number][]};
export type MetaLapaz = {W: number; H: number; base: number; x: [number, number]; z: [number, number]; kx: number; kz: number; olon: number; olat: number;
  ncasas: number; passo_casas: number; prof_casas: [number, number]; linhas: Linha[]; estacoes: [number, number, number][]};
type Cabo = {cor: THREE.Color; pts: THREE.Vector3[]; acum: number[]; L: number};
export type DadosLapaz = {m: MetaLapaz; dem: THREE.DataTexture; niv: THREE.DataTexture; casas: THREE.InstancedBufferGeometry; cabos: Cabo[];
  tubos: THREE.BufferGeometry; vazio: THREE.DataTexture};

const COR_LINHA: Record<string, string> = {skyblue: '#5ec8f2', brown: '#8a5a3c', silver: '#c9ced6'};
const ALT_CABO = 24;
// exagero vertical do canion (1x nao lia como canion, 05/11): y = (alt - REF) * EXAG + REF - base. Predios e cabos nao esticam.
export const EXAG = 1.8, REF = 3600;
export const vyLapaz = (altRel: number, base = 3000) => (altRel + base - REF) * EXAG + REF - base;

export const carregaLapaz = async (): Promise<DadosLapaz> => {
  const m: MetaLapaz = await buscaJson('lapaz/meta.json');
  const [d, n, cs] = await Promise.all([buscaBin('lapaz/dem.f16.bin'), buscaBin('lapaz/nivel.f16.bin'), buscaBin('lapaz/casas.f32.bin')]);
  // cabos: catenaria rasa entre os vertices OSM (torres), 24 m acima do chao nas torres
  const cabos: Cabo[] = m.linhas.map((l) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < l.p.length - 1; i++) {
      const [ax, az, ay] = l.p[i], [bx, bz, by] = l.p[i + 1], seg = Math.hypot(bx - ax, bz - az), n = Math.max(2, Math.ceil(seg / 40));
      for (let k = 0; k < n; k++) { const s = k / n; pts.push(new THREE.Vector3(ax + (bx - ax) * s, vyLapaz(ay + (by - ay) * s) + ALT_CABO - 0.035 * seg * 4 * s * (1 - s), az + (bz - az) * s)); }
    }
    const [lx, lz, ly] = l.p[l.p.length - 1]; pts.push(new THREE.Vector3(lx, vyLapaz(ly) + ALT_CABO, lz));
    const acum = [0]; for (let i = 1; i < pts.length; i++) acum.push(acum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    return {cor: new THREE.Color(COR_LINHA[l.cor] ?? l.cor), pts, acum, L: acum[acum.length - 1]};
  });
  // tubos coloridos (o cabo engrossado para ler de longe) + torres + estacoes, num so buffer com cor por vertice
  const pos: number[] = [], nor: number[] = [], cor: number[] = [];
  const add = (g: THREE.BufferGeometry, c: THREE.Color) => {
    const ng = g.index ? g.toNonIndexed() : g, p = ng.attributes.position, nn = ng.attributes.normal;
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(nn.getX(i), nn.getY(i), nn.getZ(i)); cor.push(c.r, c.g, c.b); }
  };
  cabos.forEach((c) => add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(c.pts, false, 'centripetal'), Math.max(8, c.pts.length * 2), 3.5, 6, false), c.cor));
  const cinza = new THREE.Color('#e9e6df'), aco = new THREE.Color('#6d7178');
  m.linhas.forEach((l) => l.p.slice(1, -1).forEach(([x, z, y]) => add(new THREE.CylinderGeometry(1.8, 3.2, ALT_CABO + 6, 8).translate(x, vyLapaz(y) + (ALT_CABO + 6) / 2 - 6, z), aco)));
  m.estacoes.forEach(([x, z, y], k) => {
    add(new THREE.BoxGeometry(34, 16, 26).translate(x, vyLapaz(y) + 6, z), cinza);
    add(new THREE.BoxGeometry(36, 3, 28).translate(x, vyLapaz(y) + 15, z), new THREE.Color(['#e23b3b', '#f2c230', '#2fae4e', '#8e2c8d', '#2a5fb8'][k % 5]));
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aCor', new THREE.Float32BufferAttribute(cor, 3)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);
  const vazio = new THREE.DataTexture(new Float32Array([0, 1e5, 1e5, 0]), 1, 1, THREE.RGBAFormat, THREE.FloatType); vazio.needsUpdate = true;
  return {m, dem: texF16(d, m.W, m.H), niv: texF16(n, m.W, m.H), casas: caixaInstanciada(new Float32Array(cs)), cabos, tubos: g, vazio};
};

// ponto no cabo pela distancia (s em metros, ciclico)
const noCabo = (c: Cabo, s: number) => {
  s = ((s % c.L) + c.L) % c.L;
  let lo = 0, hi = c.acum.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (c.acum[mid] <= s) lo = mid; else hi = mid; }
  const k = (s - c.acum[lo]) / Math.max(1e-6, c.acum[hi] - c.acum[lo]);
  return {p: c.pts[lo].clone().lerp(c.pts[hi], k), dir: c.pts[hi].clone().sub(c.pts[lo]).setY(0).normalize()};
};

const SOL = new THREE.Vector3(0.35, 0.72, 0.6).normalize();   // sol da manha vindo do nordeste/norte (hemisferio sul)

export const MundoLapaz: React.FC<{d: DadosLapaz; L: number; t: number; dist: number}> = ({d, L, t, dist}) => {
  const {m} = d;
  const comuns = useMemo(() => ({
    uDem: {value: d.dem}, uNiv: {value: d.niv}, uAgua: {value: d.vazio}, uAguaB: {value: d.vazio},
    uX: {value: new THREE.Vector4(m.x[0], m.x[1], m.z[0], m.z[1])}, uTexel: {value: new THREE.Vector2(1 / m.W, 1 / m.H)},
    uPx: {value: new THREE.Vector2((m.x[1] - m.x[0]) / (m.W - 1), (m.z[1] - m.z[0]) / (m.H - 1))}, uBase: {value: m.base},
    uSol: {value: SOL}, uCeuH: {value: CEU_H}, uCeuZ: {value: CEU_Z}, uExag: {value: EXAG}, uRef: {value: REF},
  }), [d]);
  const novo = () => ({uL: {value: 0}, uT: {value: 0}, uNev0: {value: 1}, uNev1: {value: 2}, uLago: {value: 0}, uIlha: {value: 0}, uEsc: {value: 30}, uFantasma: {value: 0},
    uLarg: {value: 1}, uProf: {value: new THREE.Vector2(8, 6)}, uJanelas: {value: 1}});
  const CASA = /* glsl */ `
float altura(float s, vec2 c) {
  float h = 5.5 + 6.5 * fract(s * 3.71);                                    // 2 a 4 andares de tijolo
  float centro = 1.0 - smoothstep(700.0, 1900.0, length(c - vec2(600.0, 900.0)));   // centro e El Prado: predios altos
  if (fract(s * 91.7) > 0.9995 - 0.22 * centro) h = 22.0 + 55.0 * fract(s * 17.3);
  return h;
}
vec3 paleta(float s, vec2 c) {
  float k = fract(s * 5.31); vec3 p = vec3(0.74, 0.39, 0.26);
  if (k < 0.26) p = vec3(0.80, 0.45, 0.30); else if (k < 0.44) p = vec3(0.64, 0.33, 0.22); else if (k < 0.58) p = vec3(0.86, 0.57, 0.38);
  else if (k < 0.67) p = vec3(0.62, 0.60, 0.57); else if (k < 0.73) p = vec3(0.92, 0.90, 0.86); else if (k < 0.77) p = vec3(0.46, 0.64, 0.80);
  else if (k < 0.80) p = vec3(0.90, 0.78, 0.40);
  return p;
}`;
  const ESTADO = ESTADO_LAPAZ.replace('(uL - niv) / 3.0', '(uL - niv) / 40.0');
  const mats = useMemo(() => {
    const mk = (v: string, f: string, extra: Record<string, unknown> = {}) => new THREE.ShaderMaterial({vertexShader: v, fragmentShader: f, uniforms: {...comuns, ...novo()}, ...extra});
    const terreno = mk(TERRENO_V(ESTADO), TERRENO_F(ESTADO, ALB_LAPAZ));
    const casas = mk(PREDIO_V(ESTADO, CASA, true), PREDIO_F);
    const tele = mk(/* glsl */ `
${GLSL_BASE}
${ESTADO}
attribute vec3 aCor; varying vec3 vWp, vN, vAlb; varying float vSurf, vIdade, vH, vChao, vJan;
void main() { vJan = 0.0; vec4 e = estado(uvDe(position.xz)); vWp = position; vN = normal; vSurf = vy(e.y); vIdade = e.z; vH = 1e4; vChao = -1e4; vAlb = aCor;
  gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`, PREDIO_F);
    const cab = mk(/* glsl */ `
${GLSL_BASE}
attribute vec3 aCor; varying vec3 vWp, vN, vAlb; varying float vSurf, vIdade, vH, vChao, vJan;
void main() { vJan = 0.0; vec4 w = instanceMatrix * vec4(position, 1.0); vWp = w.xyz; vN = normalize(mat3(instanceMatrix) * normal);
  vSurf = vy(uL); vIdade = vy(uL) > w.y ? 1.0 : -1.0; vH = 1e4; vChao = -1e4;
  vAlb = position.y > -2.2 ? vec3(0.96) : instanceColor;
  gl_Position = projectionMatrix * viewMatrix * w; }`, PREDIO_F);
    return {terreno, casas, tele, cab};
  }, [d]);
  for (const x of Object.values(mats)) {
    const u = x.uniforms; u.uL.value = L; u.uT.value = t; u.uNev0.value = dist * 1.2 + 3000; u.uNev1.value = dist * 4 + 60000;
    u.uLarg.value = m.passo_casas * 0.82; u.uProf.value.set(...m.prof_casas);
  }
  // cabines: 1 a cada 140 m, ida e volta, 5 m/s (funcao de t); tamanho exagerado (~2,5x) para ler de longe
  const cabines = useMemo(() => {
    const n = d.cabos.reduce((a, c) => a + 2 * Math.floor(c.L / 140), 0);
    const g = new THREE.BoxGeometry(13, 10, 13).translate(0, -6.5, 0);
    const im = new THREE.InstancedMesh(g, mats.cab, n); im.frustumCulled = false;
    im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    return im;
  }, [d]);
  {
    let k = 0; const M = new THREE.Matrix4(), q = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1);
    d.cabos.forEach((c, ci) => {
      const nc = Math.floor(c.L / 140);
      for (let j = 0; j < nc; j++) for (const sent of [1, -1]) {
        const s = sent > 0 ? t * 5 + j * 140 + rnd(ci) * 140 : c.L - (t * 5 + j * 140 + 70 + rnd(ci + 7) * 140);
        const {p, dir} = noCabo(c, s);
        const lat = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(sent * 5);
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(-dir.z, dir.x));
        M.compose(p.add(lat), q, S); cabines.setMatrixAt(k, M); cabines.setColorAt(k, c.cor); k++;
      }
    });
    cabines.instanceMatrix.needsUpdate = true; if (cabines.instanceColor) cabines.instanceColor.needsUpdate = true;
  }
  return (
    <group>
      <mesh geometry={grade(m.W - 1, m.H - 1)} material={mats.terreno} frustumCulled={false} />
      <mesh geometry={d.casas} material={mats.casas} frustumCulled={false} />
      <mesh geometry={d.tubos} material={mats.tele} frustumCulled={false} />
      <primitive object={cabines} />
      <AnelLapaz m={m} L={L} dist={dist} />
    </group>
  );
};

const AnelLapaz: React.FC<{m: MetaLapaz; L: number; dist: number}> = ({m, L, dist}) => {
  const D = DADOS!;
  const mat = useMemo(() => new THREE.ShaderMaterial({vertexShader: ANEL_V, fragmentShader: ANEL_F(ALB_LAPAZ), uniforms: {
    uDemG: {value: D.tex.dem}, uNivG: {value: D.tex.nivel}, uBG: {value: new THREE.Vector4(...D.bounds)},
    uJ: {value: new THREE.Vector4(m.olon - 2.0, m.olat - 2.0, m.olon + 2.0, m.olat + 2.0)}, uL: {value: 0}, uBase: {value: m.base},
    uExag: {value: EXAG}, uRef: {value: REF}, uOlon: {value: m.olon}, uOlat: {value: m.olat}, uKx: {value: m.kx}, uKz: {value: m.kz},
    uFino: {value: new THREE.Vector4(m.x[0] + 300, m.x[1] - 300, m.z[0] + 300, m.z[1] - 300)}, uTexelG: {value: new THREE.Vector2(1 / D.tw, 1 / D.th)},
    uSol: {value: SOL}, uCeuH: {value: CEU_H}, uCeuZ: {value: CEU_Z}, uNev0: {value: 1}, uNev1: {value: 2}}}), [m]);
  mat.uniforms.uL.value = L; mat.uniforms.uNev0.value = dist * 1.2 + 3000; mat.uniforms.uNev1.value = dist * 4 + 60000;
  return <mesh geometry={grade(240, 240)} material={mat} frustumCulled={false} />;
};
