// Copia do `Heer` do video 6 (welt/k6_massen_heer.tsx): bloco instanciado com marcha no vertex shader. Auto-contido para o Tropa (LOD longe).
// k6_massen_heer.tsx — o exercito como massa (video 6, 1870/71): soldados instanciados, ciclo de marcha no vertex shader.
// Base: prova do batedor (batedor_tmp/1870/h/crowd.ts, 25/10/2026), com acabamento: mochila (Tornister) e capote enrolado, correias
// brancas cruzadas, cinto, Pickelhaube (lathe + ponta + placa) ou kepi, variacao por semente (cor, altura, mochila, cadencia, fase),
// poses por instancia: marcha/parado, sentado, mirando, caido (gira para tras, cinza).
// Tudo funcao pura de (t, fig(i)): a posicao de cada figura vem de uma funcao do tempo calculada na CPU a cada quadro; o ciclo
// de marcha e so `uTime` no vertex shader. Sem relogio, sem Math.random.
//
// Coordenadas da figura: +x = frente, y = cima, z = lateral; 1,8 m de altura; rotation.y = atan2(-dz, dx) (ver `giro`).
import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// ---------- aleatorio com semente ----------
export const hash = (i: number, s = 0): number => { const x = Math.sin(i * 127.1 + s * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
export const giro = (dx: number, dz: number) => Math.atan2(-dz, dx);
export const suave = (u: number) => { const x = Math.min(1, Math.max(0, u)); return x * x * (3 - 2 * x); };

export type Fig = {
  x: number; z: number; y?: number; ry: number;
  sc?: number;        // escala (1 = 1,8 m)
  vis?: number;       // 0..1 (nasce / some): multiplica a escala
  gait?: number;      // 0 parado .. 1 marchando
  fall?: number;      // 0..1 cai para tras
  grau?: number;      // 0..1 tinge de cinza
  sit?: number;       // 0..1 sentado
  aim?: number;       // 0..1 mirando
};

// ---------- geometria ----------
const nb = (g: THREE.BufferGeometry) => (g.index ? g.toNonIndexed() : g);
const parte = (g: THREE.BufferGeometry, id: number, col: number) => {
  g = nb(g); const n = g.attributes.position.count;
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(new Array(n).fill(id), 1));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(new Array(n).fill(col), 1));
  g.deleteAttribute('uv'); return g;
};
// aCol: 0 casaco, 1 couro preto, 2 pele, 3 latao, 4 calca, 5 mochila (por semente), 6 capote enrolado, 7 correia branca, 8 madeira/aco
const cap = (r: number, a: number[], b: number[], id: number, col: number, seg = 6) => {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b); const L = A.distanceTo(B);
  const g = new THREE.CapsuleGeometry(r, Math.max(0.01, L), 2, seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
  const m = A.clone().add(B).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); return parte(g, id, col);
};
const caixa = (w: number, h: number, d: number, x: number, y: number, z: number, id: number, col: number, rz = 0, ry = 0, rx = 0) => {
  const g = new THREE.BoxGeometry(w, h, d); if (rx) g.rotateX(rx); if (rz) g.rotateZ(rz); if (ry) g.rotateY(ry); g.translate(x, y, z); return parte(g, id, col);
};

const soldat = (kind: 'pr' | 'fr') => {
  const t: THREE.BufferGeometry[] = [];
  // pernas (pivo no quadril y=0,92); botas
  t.push(cap(0.085, [0, 0.07, 0.1], [0, 0.92, 0.1], 1, 4), cap(0.085, [0, 0.07, -0.1], [0, 0.92, -0.1], 2, 4));
  t.push(caixa(0.28, 0.1, 0.13, 0.06, 0.05, 0.1, 1, 1), caixa(0.28, 0.1, 0.13, 0.06, 0.05, -0.1, 2, 1));
  if (kind === 'fr') { t.push(caixa(0.14, 0.14, 0.15, 0.03, 0.17, 0.1, 1, 7), caixa(0.14, 0.14, 0.15, 0.03, 0.17, -0.1, 2, 7)); }   // polainas brancas
  // tronco: casaco; Waffenrock (prussiano) curto, capote (frances) mais longo
  t.push(cap(0.2, [0, 0.98, 0], [0, 1.4, 0], 0, 0, 7));
  t.push(cap(0.19, [0, 0.8, 0], [0, 1.0, 0], 0, 0, 7));
  // cinto e correias cruzadas (couro branco / preto)
  t.push(parte(new THREE.CylinderGeometry(0.205, 0.205, 0.07, 10).translate(0, 0.98, 0), 0, 1));
  t.push(caixa(0.04, 0.62, 0.05, 0.19, 1.2, 0.0, 0, 7, 0, 0, 0.55), caixa(0.04, 0.62, 0.05, 0.19, 1.2, 0.0, 0, 7, 0, 0, -0.55));
  // mochila (calf) e capote enrolado por cima
  t.push(caixa(0.16, 0.38, 0.34, -0.25, 1.22, 0, 0, 5));
  t.push(parte(new THREE.CylinderGeometry(0.075, 0.075, 0.44, 8).rotateX(Math.PI / 2).translate(-0.27, 1.5, 0), 0, 6));
  // bracos (pivo no ombro y=1,42)
  t.push(cap(0.055, [0, 1.42, 0.25], [0.02, 0.86, 0.25], 3, 0), cap(0.055, [0, 1.42, -0.25], [0.02, 0.86, -0.25], 4, 0));
  t.push(parte(new THREE.SphereGeometry(0.06, 6, 5).translate(0.02, 0.83, 0.25), 3, 2), parte(new THREE.SphereGeometry(0.06, 6, 5).translate(0.02, 0.83, -0.25), 4, 2));
  // fuzil ao ombro (inclinado), baioneta
  const rifle = new THREE.BoxGeometry(0.05, 0.05, 1.3); rifle.rotateY(Math.PI / 2); rifle.rotateZ(1.2); rifle.translate(0.05, 1.28, 0.2); t.push(parte(rifle, 0, 8));
  // cabeca + capacete
  t.push(parte(new THREE.SphereGeometry(0.105, 8, 6).translate(0, 1.64, 0), 0, 2));
  if (kind === 'pr') {   // Pickelhaube: calota de couro (lathe), ponta de latao, placa frontal, jugular
    const pts = [[0, 0.17], [0.05, 0.165], [0.1, 0.125], [0.135, 0.05], [0.15, 0.0], [0.175, -0.015]].map(([r, y]) => new THREE.Vector2(r, y));
    t.push(parte(new THREE.LatheGeometry(pts, 10).translate(0, 1.73, 0), 0, 1), parte(new THREE.ConeGeometry(0.02, 0.16, 6).translate(0, 2.0, 0), 0, 3));
    t.push(caixa(0.02, 0.1, 0.09, 0.14, 1.8, 0, 0, 3), caixa(0.2, 0.012, 0.06, 0.17, 1.72, 0, 0, 1));
  } else {   // kepi vermelho com cobertura de topo plano e pala
    const pts = [[0, 0.1], [0.11, 0.1], [0.125, 0.06], [0.135, 0.0], [0.135, -0.02]].map(([r, y]) => new THREE.Vector2(r, y));
    t.push(parte(new THREE.LatheGeometry(pts, 10).translate(0, 1.73, 0), 0, 4), caixa(0.1, 0.012, 0.2, 0.14, 1.71, 0, 0, 1));
  }
  const g = mergeGeometries(t)!; g.computeVertexNormals(); return g;
};

// ---------- material ----------
export type CoresHeer = {casaco: string; calca: string};
export const CORES_DE: CoresHeer = {casaco: '#2c4a86', calca: '#233256'};     // azul prussiano (um pouco mais claro que o #27385e do batedor, para ler a media distancia)
export const CORES_FR: CoresHeer = {casaco: '#34488a', calca: '#d03a2e'};     // casaco azul, calca vermelha

const criaMaterial = (c: CoresHeer) => {
  const m = new THREE.MeshStandardMaterial({roughness: 0.86, metalness: 0});
  const u = {
    uTime: {value: 0}, uCasaco: {value: new THREE.Color(c.casaco)}, uCalca: {value: new THREE.Color(c.calca)},
    uCouro: {value: new THREE.Color('#14120f')}, uPele: {value: new THREE.Color('#b98a6c')}, uLatao: {value: new THREE.Color('#d1a73e')},
    uMochA: {value: new THREE.Color('#5a4128')}, uMochB: {value: new THREE.Color('#6e6a5d')}, uCapote: {value: new THREE.Color('#8a8672')}, uBranco: {value: new THREE.Color('#d8d2bd')},
    uMadeira: {value: new THREE.Color('#3b2a1c')}, uCinza: {value: new THREE.Color('#7a7873')},
  };
  m.userData.u = u;
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, u);
    s.vertexShader = s.vertexShader
      .replace('#include <common>', `#include <common>
attribute float aPart; attribute float aCol; attribute vec4 iAnim; attribute vec4 iSt; attribute vec4 iPo;
uniform float uTime; uniform vec3 uCasaco; uniform vec3 uCalca; uniform vec3 uCouro; uniform vec3 uPele; uniform vec3 uLatao; uniform vec3 uMochA; uniform vec3 uMochB;
uniform vec3 uCapote; uniform vec3 uBranco; uniform vec3 uMadeira; uniform vec3 uCinza; varying vec3 vC;
mat2 rot2(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
{ float fa = iSt.y * 1.55; float c = cos(fa), s = sin(fa); objectNormal.xy = mat2(c, s, -s, c) * objectNormal.xy; }`)
      .replace('#include <begin_vertex>', `
float ph = 6.2831853 * (uTime * iAnim.y) + iAnim.x;
float gait = iSt.x, sit = iPo.x, aim = iPo.y;
float sw = 0.55 * gait * sin(ph) + 0.025 * sin(uTime * 1.3 + iAnim.x) * (1.0 - gait);
vec3 transformed = vec3(position);
if (aPart > 0.5 && aPart < 2.5) {
  float dir = aPart < 1.5 ? 1.0 : -1.0;
  float a = sw * dir * (1.0 - sit) + 1.45 * sit;
  vec2 q = rot2(a) * vec2(transformed.x, transformed.y - 0.92); transformed.x = q.x; transformed.y = q.y + 0.92;
} else if (aPart > 2.5) {
  float dir = aPart < 3.5 ? -0.7 : 0.7;
  float a = sw * dir * (1.0 - aim) + 1.35 * aim + 0.05 * aim * sin(uTime * 17.0 + iAnim.x);
  vec2 q = rot2(a) * vec2(transformed.x, transformed.y - 1.42); transformed.x = q.x; transformed.y = q.y + 1.42;
}
transformed.y += 0.035 * gait * abs(sin(ph)) - 0.62 * sit;
{ float fa = iSt.y * 1.55; transformed.xy = rot2(fa) * transformed.xy; transformed.y += 0.14 * iSt.y; }
transformed *= vec3(1.0 + 0.06 * (iAnim.w - 0.5), 1.0, 1.0 + 0.08 * (iAnim.z - 0.5));
vec3 base = aCol < 0.5 ? uCasaco : aCol < 1.5 ? uCouro : aCol < 2.5 ? uPele : aCol < 3.5 ? uLatao : aCol < 4.5 ? uCalca
  : aCol < 5.5 ? mix(uMochA, uMochB, step(0.62, iAnim.z)) : aCol < 6.5 ? uCapote : aCol < 7.5 ? uBranco : uMadeira;
float tom = 0.86 + 0.28 * iAnim.w;
vC = mix(base * tom, uCinza * (0.8 + 0.3 * iAnim.w), iSt.z);`);
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vC;')
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( vC, opacity );');
  };
  m.customProgramCacheKey = () => 'k6heer1';
  return m;
};

// ---------- componente ----------
export const Heer: React.FC<{kind: 'pr' | 'fr'; n: number; t: number; tAnim?: number; fig: (i: number) => Fig | null; seed?: number; schatten?: boolean; cores?: CoresHeer; cadencia?: number}> =
  ({kind, n, t, tAnim, fig, seed = 1, schatten = false, cores, cadencia = 0.9}) => {
  const obj = useMemo(() => {
    const geo = soldat(kind);
    const mat = criaMaterial(cores ?? (kind === 'pr' ? CORES_DE : CORES_FR));
    const N = Math.max(1, n);
    const mesh = new THREE.InstancedMesh(geo, mat, N);
    mesh.frustumCulled = false; mesh.castShadow = true; mesh.receiveShadow = true;
    const anim = new Float32Array(N * 4), st = new Float32Array(N * 4), po = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      anim[i * 4] = hash(i, seed) * 6.2832; anim[i * 4 + 1] = cadencia * (0.94 + 0.12 * hash(i, seed + 1)); anim[i * 4 + 2] = hash(i, seed + 2); anim[i * 4 + 3] = hash(i, seed + 3);
    }
    geo.setAttribute('iAnim', new THREE.InstancedBufferAttribute(anim, 4));
    const aSt = new THREE.InstancedBufferAttribute(st, 4), aPo = new THREE.InstancedBufferAttribute(po, 4);
    aSt.setUsage(THREE.DynamicDrawUsage); aPo.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('iSt', aSt); geo.setAttribute('iPo', aPo);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    return {mesh, geo, mat, st, po, aSt, aPo, d: new THREE.Object3D(), N};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, n, seed, cadencia]);
  
  useLayoutEffect(() => {
    const {mesh, d, st, po} = obj;
    obj.mat.userData.u.uTime.value = tAnim ?? t;
    for (let i = 0; i < obj.N; i++) {
      const f = i < n ? fig(i) : null;
      if (!f || (f.vis ?? 1) <= 0.001) { d.position.set(0, -1e4, 0); d.scale.setScalar(0.0001); d.rotation.set(0, 0, 0); }
      else { d.position.set(f.x, f.y ?? 0, f.z); d.rotation.set(0, f.ry, 0); d.scale.setScalar((f.sc ?? 1) * (f.vis ?? 1)); }
      d.updateMatrix(); mesh.setMatrixAt(i, d.matrix);
      st[i * 4] = f?.gait ?? 0; st[i * 4 + 1] = f?.fall ?? 0; st[i * 4 + 2] = f?.grau ?? 0; st[i * 4 + 3] = 0;
      po[i * 4] = f?.sit ?? 0; po[i * 4 + 1] = f?.aim ?? 0;
    }
    mesh.instanceMatrix.needsUpdate = true; obj.aSt.needsUpdate = true; obj.aPo.needsUpdate = true;
  });
  return <primitive object={obj.mesh} />;
};
