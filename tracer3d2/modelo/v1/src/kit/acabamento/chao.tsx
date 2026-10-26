// Chao PBR fotografico (Poly Haven, CC0) em coordenadas de MUNDO: sem UV do modelo, com quebra de repeticao (duas amostras em escalas e
// rotacoes diferentes misturadas por ruido de baixa frequencia) e variacao de tom. Tres usos:
//   materialPBR('lama', {metros})          -> MeshStandardMaterial novo, para planos/ruas/plataformas sem textura propria
//   detalharChao(material, 'lama', {...})  -> acrescenta DETALHE (albedo + normal + rugosidade) a um material existente (satelite, atlas...)
//   <DetalheNaCena nome="lama" />          -> acha os terrenos da cena (malhas grandes) e aplica `detalharChao` neles
// Texturas: public/acabamento/tex/<id>_{diff_2k,nor_gl_1k,rough_1k}.jpg (<raiz>/assets\polyhaven\tex). Determinista: nada depende de relogio.
import React from 'react';
import * as THREE from 'three';
import {useFrame, useThree} from '@react-three/fiber';
import {continueRender, delayRender, staticFile} from 'remotion';

export type NomeChao = 'lama' | 'grama' | 'neve' | 'pedra';
// metros = lado de uma repeticao; med = luminancia media do albedo (para o detalhe nao mudar o brilho geral); rug = rugosidade base
export const CHAOS: Record<NomeChao, {id: string; metros: number; med: number; rug: number}> = {
  lama: {id: 'muddy_tracks', metros: 7, med: 0.30, rug: 0.95},
  grama: {id: 'grass_path_2', metros: 6, med: 0.28, rug: 0.92},
  neve: {id: 'snow_02', metros: 8, med: 0.62, rug: 0.7},
  pedra: {id: 'cobblestone_floor_01', metros: 4, med: 0.30, rug: 0.88},
};

// ---- carregamento: o quadro espera as texturas (delayRender) e elas ficam em cache por arquivo
const CACHE = new Map<string, THREE.Texture>();
const PEND = new Map<string, Promise<void>>();   // texturas ainda carregando
const tex = (arq: string, srgb: boolean) => {
  const k = arq + (srgb ? '|s' : '|l');
  let t = CACHE.get(k);
  if (!t) {
    const h = delayRender('acabamento: ' + arq);
    // o R3F do Remotion roda em 'demand': depois que a textura chega nao ha quadro novo sozinho. Pede um quadro (invalidate) e so entao libera o screenshot.
    const livre = () => { try { (globalThis as any).__acabInvalidate?.(); } catch { /* sem canvas ainda */ } setTimeout(() => continueRender(h), 150); };
    let ok!: () => void; PEND.set(k, new Promise<void>((r) => { ok = r; }));
    const fim = () => { PEND.delete(k); ok(); livre(); };
    t = new THREE.TextureLoader().load(staticFile(arq), fim, undefined, fim);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    CACHE.set(k, t);
  }
  return t;
};
const mapas = (nome: NomeChao) => {
  const id = CHAOS[nome].id;
  return {dif: tex(`acabamento/tex/${id}_diff_2k.jpg`, true), nor: tex(`acabamento/tex/${id}_nor_gl_1k.jpg`, false), rug: tex(`acabamento/tex/${id}_rough_1k.jpg`, false)};
};

const GLSL_FUNC = `
varying vec3 vAcW; uniform sampler2D uAcDif; uniform sampler2D uAcNor; uniform sampler2D uAcRugT;
uniform float uAcM; uniform float uAcForca; uniform float uAcNormal; uniform float uAcMed; uniform vec3 uAcTinta; uniform float uAcRug;
float acH(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5); }
float acN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(acH(i), acH(i+vec2(1,0)), f.x), mix(acH(i+vec2(0,1)), acH(i+vec2(1,1)), f.x), f.y); }
vec2 acUv2(vec2 uv){ return mat2(0.8, -0.6, 0.6, 0.8) * uv * 0.37 + vec2(0.31, 0.17); }
float acMix(vec2 w){ return smoothstep(0.30, 0.70, acN(w * 0.045) * 0.65 + acN(w * 0.17) * 0.35); }
vec3 acAmostra(sampler2D t, vec2 uv, float k){ return mix(texture2D(t, uv).rgb, texture2D(t, acUv2(uv)).rgb, k); }`;

// detalhe = true: multiplica o albedo existente por (textura / media); false: substitui o albedo
const patch = (sh: any, detalhe: boolean) => {
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vAcW;')
    .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvAcW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  const cor = detalhe
    ? 'float lum = dot(d, vec3(0.299, 0.587, 0.114)); vec3 rel = d / max(uAcMed, 0.02); diffuseColor.rgb *= mix(vec3(1.0), mix(vec3(lum / max(uAcMed, 0.02)), rel, 0.35) * uAcTinta, uAcForca);'
    : 'diffuseColor.rgb = d * uAcTinta * tom;';
  const rug = detalhe ? 'mix(roughnessFactor, uAcRug * r, uAcForca * 0.6)' : 'clamp(uAcRug * (0.55 + 0.6 * r), 0.3, 1.0)';
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + GLSL_FUNC)
    .replace('#include <map_fragment>', `#include <map_fragment>
{ vec2 uvw = vec2(vAcW.x, -vAcW.z) / uAcM; float k = acMix(vAcW.xz);
  vec3 d = acAmostra(uAcDif, uvw, k);
  float tom = 0.82 + 0.36 * (acN(vAcW.xz * 0.021) * 0.6 + acN(vAcW.xz * 0.09) * 0.4);
  ${cor} }`)
    .replace('#include <roughnessmap_fragment>', `float roughnessFactor = roughness;
{ vec2 uvr = vec2(vAcW.x, -vAcW.z) / uAcM; float r = acAmostra(uAcRugT, uvr, acMix(vAcW.xz)).r; roughnessFactor = ${rug}; }`)
    .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
{ vec2 uvn = vec2(vAcW.x, -vAcW.z) / uAcM; vec3 nm = acAmostra(uAcNor, uvn, acMix(vAcW.xz)) * 2.0 - 1.0;
  vec3 Nw = normalize((vec4(normal, 0.0) * viewMatrix).xyz);
  vec3 T = normalize(vec3(1.0, 0.0, 0.0) - Nw * Nw.x), B = normalize(vec3(0.0, 0.0, -1.0) - Nw * Nw.z);
  vec3 nW = normalize(Nw + (T * nm.x + B * nm.y) * uAcNormal);
  normal = normalize((viewMatrix * vec4(nW, 0.0)).xyz); }`);
};

export type OpcChao = {metros?: number; forca?: number; normal?: number; tinta?: THREE.ColorRepresentation; rugosidade?: number};
const unis = (nome: NomeChao, o: OpcChao) => {
  const m = mapas(nome), d = CHAOS[nome];
  return {uAcDif: {value: m.dif}, uAcNor: {value: m.nor}, uAcRugT: {value: m.rug}, uAcM: {value: o.metros ?? d.metros}, uAcForca: {value: o.forca ?? 1},
    uAcNormal: {value: o.normal ?? 1}, uAcMed: {value: d.med}, uAcTinta: {value: new THREE.Color(o.tinta ?? '#ffffff')}, uAcRug: {value: o.rugosidade ?? d.rug}};
};

// material novo (planos, ruas, plataformas, chao de cenas sem terreno proprio)
const MATS = new Map<string, THREE.MeshStandardMaterial>();
export const materialPBR = (nome: NomeChao, o: OpcChao = {}): THREE.MeshStandardMaterial => {
  const k = nome + JSON.stringify(o);
  const c = MATS.get(k); if (c) return c;
  const m = new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 1, metalness: 0});
  const u = unis(nome, o);
  m.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, u); patch(sh, false); };
  m.customProgramCacheKey = () => 'acab_chao_pbr';
  m.userData.acab = true;
  MATS.set(k, m);
  return m;
};

// detalhe sobre material existente (terreno com satelite, atlas de papel, shader de neve...). Idempotente.
export const detalharChao = (mat: THREE.Material, nome: NomeChao, o: OpcChao = {}) => {
  if (mat.userData.acabDet) return mat;
  mat.userData.acabDet = nome;
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey?.bind(mat);
  const u = unis(nome, {forca: 0.85, ...o});
  mat.onBeforeCompile = (sh, r) => { prev?.call(mat, sh, r); Object.assign(sh.uniforms, u); patch(sh, true); };
  mat.customProgramCacheKey = () => (prevKey ? prevKey() : mat.type) + '+acabdet' + nome;
  mat.needsUpdate = true;
  return mat;
};

// acha os terrenos (malhas de raio > `raioMin` m) e aplica o detalhe; roda a cada quadro, mas cada material so e tocado uma vez
export const DetalheNaCena: React.FC<OpcChao & {nome: NomeChao; raioMin?: number; filtro?: (m: THREE.Mesh) => boolean}> = ({nome, raioMin = 150, filtro, ...o}) => {
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  (globalThis as any).__acabInvalidate = invalidate;
  mapas(nome);
  if (PEND.size) throw Promise.all([...PEND.values()]);   // suspende o canvas ate as texturas chegarem (senao o 1o quadro sai com detalhe preto)
  // pre-carrega no render do React (delayRender antes do 1o quadro); dentro do useFrame o quadro saia antes das texturas
  useFrame(() => {
    scene.traverse((ob) => {
      const m = ob as THREE.Mesh;
      if (!(m as any).isMesh || (m as any).isInstancedMesh || (m as any).isSkinnedMesh) return;
      const mat = m.material as THREE.Material;
      if (!mat || Array.isArray(mat) || mat.userData.acabDet || mat.userData.acab) return;
      if (!(mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshLambertMaterial || mat instanceof THREE.MeshPhongMaterial)) return;
      const g = m.geometry; if (!g.boundingSphere) g.computeBoundingSphere();
      if (filtro ? !filtro(m) : g.boundingSphere!.radius < raioMin) return;
      detalharChao(mat, nome, o);
    });
  }, -2);
  return null;
};
