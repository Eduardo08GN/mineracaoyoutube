// Capitulo 4 (60,9-74,9 s do original): SAN JUAN DE GAZTELUGATXE (Bizkaia, 43,4 N), adaptacao de Cannon Beach / Haystack Rock.
// "Muy al norte. Aqui el agua esta llegando." A agua SOBE (a linha d'agua avanca pela cala ate perto do caserio) e "algo se esta
// formando mar adentro": uma muralha de onda cresce no horizonte (70-74,9).
// Cena: estrada (linhas brancas, Espanha) com pedestres no 1o plano, prado, cala de areia, caserio basco (pedra + reboco + madeira,
// telhado de duas aguas), pinheiro e farola a direita (revelados em ~70,5), ao fundo a ilhota com a ermida no topo e a escadaria em
// ziguezague que vem do promontorio pela crista e pela ponte de pedra em arcos. Rochas = Poly Haven boulder_01 / namaqualand_cliff_01
// (CC0) com detalhe triplanar (cliff_side) e topo verde (sparse_grass) por normal.y.
// Camera (mapa de acoes): ~3 m acima da beira da estrada; 60,9-68 pan para a ESQUERDA + push-in; 68-74,9 pan para a DIREITA + pull-back.
// Este arquivo tambem exporta os utilitarios de costa usados por panama.tsx (mesmo dono).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {useGLTF, useTexture} from '@react-three/drei';
import {staticFile} from 'remotion';
import {Perfil} from '../look/Look';
import {CeuLugar, corHorizonte, luzEm, Lugar} from './ceu';
import {Mar, Luz, rnd, smooth, clamp01} from './comum';
import {useHDR} from './ambiente';
import {nivelMar} from '../fisica';
import {Multidao3D, Pessoa3D, Estado3D} from './pessoas';
import {ArvoreEZ, Floresta, ItemFloresta} from './arvores';
import {Flipbook, ATLAS} from './vfx';

type V3 = [number, number, number];

// =====================================================================================================================
// Utilitarios de costa (compartilhados com panama.tsx)
// =====================================================================================================================
export const GLSL_RUIDO = `
float hh2(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(hh2(i), hh2(i+vec2(1,0)), f.x), mix(hh2(i+vec2(0,1)), hh2(i+vec2(1,1)), f.x), f.y); }
float fbm2(vec2 p){ float a = 0.5, s = 0.0; for (int k = 0; k < 4; k++){ s += a * vn2(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; } return s; }`;

// texturas de public/costas/tex (repeticao livre; difusas em sRGB)
export const useTexCostas = (nomes: string[]) => {
  const tx = useTexture(nomes.map((n) => staticFile('costas/tex/' + n))) as THREE.Texture[];
  useMemo(() => {
    tx.forEach((x, i) => { x.wrapS = x.wrapT = THREE.RepeatWrapping; x.anisotropy = 8; x.colorSpace = /_diff_/.test(nomes[i]) ? THREE.SRGBColorSpace : THREE.NoColorSpace; x.needsUpdate = true; });
  }, [tx]);
  return tx;
};

// reflexo de ambiente (HDRI CC0 da praia) por material: nao mexe no scene.environment de ninguem
export const useEnvCostas = () => {
  const hdr = useHDR('praia');
  const gl = useThree((s) => s.gl);
  return useMemo(() => { const pm = new THREE.PMREMGenerator(gl); const rt = pm.fromEquirectangular(hdr); pm.dispose(); return rt.texture; }, [hdr, gl]);
};

// luz do lugar no formato do Mar
// cor de nevoa = horizonte do ceu, quantizada (o Look recompila a cadeia quando o perfil muda)
export const corNevoa = (t: number, l: Lugar) => { const c = corHorizonte(Math.floor(t / 4) * 4 + 2, l); const q = (x: number) => Math.round(Math.min(1, x) * 24) / 24; return new THREE.Color(q(c.r), q(c.g), q(c.b)); };
export const luzMar = (t: number, lugar: Lugar): Luz => { const l = luzEm(t, lugar); return {dia: l.dia, ocaso: 0, sol: l.sol.clone().normalize()}; };

// camera por chaves [t, x, y, z, guinada(graus, + = direita), arfagem(graus), fov vertical]; meio linear, meio suave (pan continuo)
export type ChaveGP = [number, number, number, number, number, number, number];
export const camGP = (K: ChaveGP[], t: number) => {
  let i = 0;
  while (i < K.length - 2 && t > K[i + 1][0]) i++;
  const a = K[i], b = K[i + 1];
  const w = clamp01((t - a[0]) / (b[0] - a[0])), u = 0.45 * w + 0.55 * (w * w * (3 - 2 * w));
  const L = (k: number) => a[k] + (b[k] - a[k]) * u;
  const yaw = (L(4) * Math.PI) / 180, pit = (L(5) * Math.PI) / 180;
  const pos = new THREE.Vector3(L(1), L(2), L(3));
  const dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(pit), Math.sin(pit), -Math.cos(yaw) * Math.cos(pit));
  return {pos, alvo: pos.clone().addScaledVector(dir, 100), fov: L(6)};
};
export const useCamera = (c: {pos: THREE.Vector3; alvo: THREE.Vector3; fov: number}, near = 0.5, far = 40000) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  camera.position.copy(c.pos); camera.up.set(0, 1, 0); camera.lookAt(c.alvo);
  camera.fov = c.fov; camera.near = near; camera.far = far; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  return camera;
};

// material com textura TRIPLANAR em coordenadas de mundo (rochas escaladas 40x, pedra de muros e pontes): detalhe sem esticar,
// topo verde por normal.y + ruido, faixa molhada/escura e algas perto do nivel da agua (uNivel)
export type OptTri = {tex: THREE.Texture; esc: number; cor?: THREE.ColorRepresentation; grama?: THREE.Texture; verde?: number; env?: THREE.Texture | null;
  rough?: number; nivel?: {value: number}; chave: string; normal?: THREE.Texture | null; roughMap?: THREE.Texture | null; lado?: THREE.Side; envForca?: number};
export const matTriplanar = (o: OptTri) => {
  const m = new THREE.MeshStandardMaterial({color: o.cor ?? '#ffffff', roughness: o.rough ?? 0.92, metalness: 0, envMap: o.env ?? null, envMapIntensity: o.envForca ?? 0.5, side: o.lado ?? THREE.FrontSide});
  if (o.normal) { m.normalMap = o.normal; m.normalScale = new THREE.Vector2(1.3, 1.3); }
  if (o.roughMap) m.roughnessMap = o.roughMap;
  const u = {uTex: {value: o.tex}, uEsc: {value: o.esc}, uGrama: {value: o.grama ?? o.tex}, uVerde: {value: o.verde ?? 0}, uNivel: o.nivel ?? {value: -1e4}};
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMundo; varying vec3 vNMundo;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
  { mat4 mm = modelMatrix;
    #ifdef USE_INSTANCING
    mm = modelMatrix * instanceMatrix;
    #endif
    vMundo = (mm * vec4(transformed, 1.0)).xyz; vNMundo = normalize(transpose(inverse(mat3(mm))) * objectNormal); }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform sampler2D uTex; uniform sampler2D uGrama; uniform float uEsc; uniform float uVerde; uniform float uNivel;
varying vec3 vMundo; varying vec3 vNMundo;
${GLSL_RUIDO}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
  vec3 nW = normalize(vNMundo);
  vec3 bw = pow(abs(nW), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
  vec3 tri = texture2D(uTex, vMundo.zy * uEsc).rgb * bw.x + texture2D(uTex, vMundo.xz * uEsc).rgb * bw.y + texture2D(uTex, vMundo.xy * uEsc).rgb * bw.z;
  vec3 tri2 = texture2D(uTex, vMundo.zy * uEsc * 0.23).rgb * bw.x + texture2D(uTex, vMundo.xz * uEsc * 0.23).rgb * bw.y + texture2D(uTex, vMundo.xy * uEsc * 0.23).rgb * bw.z;
  float macro = 0.78 + 0.44 * fbm2(vMundo.xz * 0.018 + vMundo.y * 0.013);
  diffuseColor.rgb *= mix(tri, tri2, 0.4) * macro * 1.25;
  float ng = fbm2(vMundo.xz * 0.05 + vec2(vMundo.y * 0.02));
  float g = uVerde * smoothstep(0.30, 0.62, nW.y + (ng - 0.5) * 0.6) * smoothstep(uNivel + 4.0, uNivel + 10.0, vMundo.y);
  vec3 gt = texture2D(uGrama, vMundo.xz * 0.16).rgb; vec3 gr = mix(gt, vec3(dot(gt, vec3(0.3, 0.59, 0.11))) * vec3(0.62, 1.05, 0.34) * 1.9, 0.75) * (0.7 + 0.6 * ng);
  diffuseColor.rgb = mix(diffuseColor.rgb, gr, g);
  float molh = 1.0 - smoothstep(uNivel + 0.2, uNivel + 3.0, vMundo.y);
  diffuseColor.rgb *= mix(1.0, 0.48, molh);
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.62, 0.70, 0.45), (1.0 - smoothstep(uNivel - 0.6, uNivel + 1.2, vMundo.y)));`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  roughnessFactor = mix(roughnessFactor, 0.3, 1.0 - smoothstep(uNivel + 0.2, uNivel + 2.2, vMundo.y));`);
  };
  m.customProgramCacheKey = () => 'tri_costas_' + o.chave;
  return m;
};

// geometria de um modelo glTF levada ao mundo (para raycast e para desenhar sem matriz)
export const geoMundo = (g: THREE.BufferGeometry, pos: V3, esc: V3, ry: number) => {
  const M = new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(...esc));
  const out = g.clone(); out.applyMatrix4(M); out.computeBoundingSphere(); out.computeBoundingBox();
  return out;
};
// mapa de alturas "visto de cima" a partir dos vertices de geometrias ja no mundo (maior y por celula; buracos = media dos vizinhos)
export const mapaAlturas = (geos: THREE.BufferGeometry[], cel: number) => {
  const m = new Map<number, number>(), K = (i: number, j: number) => i * 131072 + j;
  for (const g of geos) {
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let v = 0; v < p.count; v++) { const k = K(Math.floor(p.getX(v) / cel), Math.floor(p.getZ(v) / cel)), y = p.getY(v), o = m.get(k); if (o === undefined || y > o) m.set(k, y); }
  }
  return (x: number, z: number): number | null => {
    const i = Math.floor(x / cel), j = Math.floor(z / cel), c = m.get(K(i, j));
    if (c !== undefined) return c;
    let s = 0, n = 0;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const v = m.get(K(i + a, j + b)); if (v !== undefined) { s += v; n++; } }
    return n >= 3 ? s / n : null;
  };
};
export const primeiraMalha = (o: THREE.Object3D) => { let m: THREE.Mesh | null = null; o.traverse((x: any) => { if (!m && x.isMesh) m = x; }); return m as unknown as THREE.Mesh; };

// =====================================================================================================================
// Gaztelugatxe
// =====================================================================================================================
const T0 = 60.9, T1 = 74.9, LAT = 43.4, ROAD = 8.6;
// nivel visual da agua (m): a fisica (nivelMar) diz quanto ja subiu entre 60,9 e 74,9; o desenho comprime para metros de cena
// (de -0,2 a +1,9 m numa praia 1:26 = a linha d'agua anda ~55 m). Mais o vai-e-vem das ondas (deterministico).
const fNivel = (t: number) => { const a = nivelMar(T0, LAT), b = nivelMar(T1, LAT); return clamp01((nivelMar(t, LAT) - a) / (b - a)); };
export const nivelGaz = (t: number) => {
  const f = clamp01((fNivel(t) - 0.14) / 0.8);
  return -0.2 + 2.1 * (0.35 * f + 0.65 * f * f * (3 - 2 * f)) + 0.12 * Math.sin(t * 1.25) + 0.06 * Math.sin(t * 2.9 + 1.0);
};

// relevo (m): estrada a 6 m, prado descendo ate a cala, praia 1:26, fundo; promontorio verde a direita (a costa curva em direcao a camera)
const bordaPromontorio = (z: number) => 52 + 0.0012 * (z + 440) * (z + 440);
export const alturaGaz = (x: number, z: number) => {
  let h: number;
  const ond = 0.35 * Math.sin(x * 0.045 + z * 0.02) + 0.25 * Math.sin(x * 0.11 - z * 0.07);
  if (z > -4) h = ROAD + Math.max(0, z - 10) * 0.12 + (z > 6 ? ond * 0.3 : 0);
  else if (z > -30) h = 2.8 + (ROAD - 2.8) * smooth(-34, -4, z) + ond * 0.6 * smooth(-30, -18, z) * (1 - smooth(-10, -4, z));
  else if (z > -150) h = 2.8 + (z + 30) * 0.039 + ond * 0.12;
  else h = Math.max(-18, -1.88 + (z + 150) * 0.06);
  // promontorio (a direita, ao fundo): borda ingreme e morro verde
  const dx = x - bordaPromontorio(z);
  if (dx > -40) {
    const morro = -14 + 18 * smooth(-40, 0, dx) + 26 * smooth(0, 200, dx) * (0.75 + 0.25 * Math.sin(z * 0.012 + x * 0.008));
    h = Math.max(h, morro);
  }
  // cabo distante a esquerda
  const dl = -(x + 620) + (z + 700) * 0.4;
  if (dl > -40) h = Math.max(h, -14 + 18 * smooth(-40, 0, dl) + 38 * smooth(0, 160, dl));
  return h;
};

const ISLA = {pos: [-104, -12, -440] as V3, esc: [82, 108, 58] as V3, ry: 0.55};
const CALCADA = {pos: [8, -9, -444] as V3, esc: [9.5, 5.8, 6.5] as V3, ry: 0.06};
const PONTE = {x0: -44, x1: -20, z: -440, base: -8, topo: 17};
const CASA = {x: -22, z: -46};
const PINHO: V3 = [31, 0, -50], FAROLA: V3 = [40, 0, -51];
const MURO = {z0: -1750, z1: -850, t0: 69.6, t1: 74.6, H: 66};

// camera (mapa): ~3 m acima da beira da estrada. 60,9-68 pan ESQUERDA + push-in (+4-6 %/2 s); 68-74,9 pan DIREITA + pull-back
const CAM: ChaveGP[] = [
  [T0, 1.0, ROAD + 3.3, 9.5, -9.0, -3.6, 41],
  [68.0, 0.2, ROAD + 3.1, 6.5, -18.0, -3.2, 35],
  [T1, 1.8, ROAD + 3.5, 11.0, 3.0, -3.8, 46],
];

// pessoas: 3 na estrada (1o plano) e 6 na praia, que se afastam da agua que sobe
type Andante = {x0: number; z0: number; x1: number; z1: number; v?: number};
const NA_ESTRADA: Andante[] = [{x0: -14, z0: 2.6, x1: 30, z1: 2.6}, {x0: 22, z0: -1.4, x1: -22, z1: -1.4}, {x0: -40, z0: 3.4, x1: 10, z1: 3.4}];
const NA_PRAIA: Andante[] = [
  {x0: -60, z0: -96, x1: -52, z1: -64}, {x0: -38, z0: -90, x1: -34, z1: -60}, {x0: 6, z0: -98, x1: 0, z1: -62},
  {x0: 26, z0: -88, x1: 30, z1: -58}, {x0: 52, z0: -95, x1: 58, z1: -66}, {x0: -84, z0: -84, x1: -80, z1: -58},
];
const ROUPA = ['#2b4c7e', '#7a2e2e', '#3d5a40', '#c9a227', '#5a5f66', '#e7e2d6', '#24384f', '#8a4f2a', '#46628a'];
const LISTA_PESSOAS: Pessoa3D[] = [...NA_ESTRADA, ...NA_PRAIA].map((_, i) => ({i: 600 + i * 7, x: 0, z: 0, rot: 0, pose: 'andando' as const,
  camisa: ROUPA[i % ROUPA.length], calca: ['#2c2f36', '#3b3f5c', '#6b5a45'][i % 3], curta: false}));
const estadoGaz = (_p: Pessoa3D, k: number, t: number): Estado3D => {
  const estrada = k < NA_ESTRADA.length;
  const a = estrada ? NA_ESTRADA[k] : NA_PRAIA[k - NA_ESTRADA.length];
  const L = Math.hypot(a.x1 - a.x0, a.z1 - a.z0), v = estrada ? 1.25 + rnd(k) * 0.3 : 1.0 + rnd(k + 9) * 0.5;
  const t0 = estrada ? T0 - 3 : 63 + rnd(k + 3) * 2.5;            // na praia: comecam a sair quando a agua chega
  const d = Math.min(L, Math.max(0, (t - t0) * v));
  const x = a.x0 + ((a.x1 - a.x0) * d) / L, z = a.z0 + ((a.z1 - a.z0) * d) / L;
  const parado = d <= 0 || d >= L;
  return {x, z, y: estrada ? ROAD + 0.02 : alturaGaz(x, z), ry: Math.atan2(a.x1 - a.x0, a.z1 - a.z0), clipe: parado ? 'Idle_Loop' : 'Walk_Loop', tempo: parado ? t + k : d / 1.45};
};

// ---------- terreno (estrada a parte) ----------
const Terreno: React.FC<{nivel: {value: number}; env: THREE.Texture}> = ({nivel, env}) => {
  const [gDif, gNor, uDif, rDif] = useTexCostas(['sparse_grass_diff_2k.jpg', 'sparse_grass_nor_gl_2k.jpg', 'damp_beach_sand_02_diff_2k.jpg', 'rock_wall_02_diff_2k.jpg']);
  const areiaSeca = useTexture(staticFile('tex/coast_sand_01_diff_2k.jpg'));
  useMemo(() => { areiaSeca.wrapS = areiaSeca.wrapT = THREE.RepeatWrapping; areiaSeca.colorSpace = THREE.SRGBColorSpace; areiaSeca.anisotropy = 8; areiaSeca.needsUpdate = true; }, [areiaSeca]);
  const geo = useMemo(() => {
    const W = 1700, P = 1250, g = new THREE.PlaneGeometry(W, P, 340, 250);
    g.rotateX(-Math.PI / 2); g.translate(80, 0, -460);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setY(i, alturaGaz(p.getX(i), p.getZ(i)));
    g.computeVertexNormals();
    return g;
  }, []);
  const mat = useMemo(() => {
    const nor = gNor.clone(); nor.repeat.set(1700 / 7, 1250 / 7); nor.needsUpdate = true;
    const m = new THREE.MeshStandardMaterial({roughness: 0.95, metalness: 0, normalMap: nor, normalScale: new THREE.Vector2(0.9, 0.9), envMap: env, envMapIntensity: 0.45});
    const u = {uGrama: {value: gDif}, uAreia: {value: areiaSeca}, uUmida: {value: uDif}, uRocha: {value: rDif}, uNivel: nivel};
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMundo; varying vec3 vNMundo;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvMundo = (modelMatrix * vec4(transformed, 1.0)).xyz; vNMundo = objectNormal;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform sampler2D uGrama; uniform sampler2D uAreia; uniform sampler2D uUmida; uniform sampler2D uRocha; uniform float uNivel;
varying vec3 vMundo; varying vec3 vNMundo; float gMolh;
${GLSL_RUIDO}`)
        .replace('#include <map_fragment>', `#include <map_fragment>
  vec2 q = vMundo.xz; float h = vMundo.y; vec3 nW = normalize(vNMundo);
  float n1 = fbm2(q * 0.03), n2 = vn2(q * 0.35);
  vec3 gt = texture2D(uGrama, q / 7.0).rgb; vec3 gr = mix(gt, vec3(dot(gt, vec3(0.3, 0.59, 0.11))) * vec3(0.60, 1.05, 0.32) * 1.85, 0.72) * (0.74 + 0.5 * n1);
  gr = mix(gr, gr * vec3(1.12, 1.04, 0.75), smoothstep(0.55, 0.8, fbm2(q * 0.012)) * 0.5);
  vec3 ar = texture2D(uAreia, q / 9.0).rgb * vec3(1.0, 0.98, 0.93);
  vec3 um = texture2D(uUmida, q / 6.0).rgb * 0.8;
  vec3 ro = texture2D(uRocha, vec2(q.x * 0.7 + q.y * 0.7, h) / 22.0).rgb;
  float praia = (1.0 - smoothstep(2.45 + n1 * 0.7, 3.0 + n1 * 0.7, h)) * step(vMundo.z, -18.0);
  vec3 c = mix(gr, ar, praia);
  float ingreme = 1.0 - smoothstep(0.5, 0.78, nW.y + (n1 - 0.5) * 0.2);
  c = mix(c, ro * vec3(1.1, 1.1, 1.05), ingreme);
  gMolh = 1.0 - smoothstep(uNivel + 0.12, uNivel + 0.9 + 0.5 * n2, h);
  c = mix(c, um, gMolh * (1.0 - ingreme * 0.5));
  c *= mix(1.0, 0.62, 1.0 - smoothstep(uNivel - 0.8, uNivel + 0.05, h));
  diffuseColor.rgb = c;`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  roughnessFactor = mix(roughnessFactor, 0.22, gMolh);`);
    };
    m.customProgramCacheKey = () => 'terreno_gaz';
    return m;
  }, [gDif, gNor, uDif, rDif, areiaSeca, env, nivel]);
  return <mesh geometry={geo} material={mat} receiveShadow />;
};

// ---------- estrada com linhas brancas (Espanha: bordas continuas, eixo tracejado) ----------
const Estrada: React.FC<{env: THREE.Texture}> = ({env}) => {
  const [dif, nor, rou] = useTexCostas(['clean_asphalt_diff_1k.jpg', 'clean_asphalt_nor_gl_1k.jpg', 'clean_asphalt_rough_1k.jpg']);
  const mat = useMemo(() => {
    const c = (x: THREE.Texture) => { const k = x.clone(); k.repeat.set(1600 / 5, 8 / 5); k.needsUpdate = true; return k; };
    return new THREE.MeshStandardMaterial({map: c(dif), normalMap: c(nor), roughnessMap: c(rou), color: '#c9c9c9', envMap: env, envMapIntensity: 0.3});
  }, [dif, nor, rou, env]);
  const tracejado = useMemo(() => {
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 4; const g = cv.getContext('2d')!;
    g.fillStyle = '#000'; g.fillRect(0, 0, 64, 4); g.fillStyle = '#fff'; g.fillRect(0, 0, 28, 4);
    const tx = new THREE.CanvasTexture(cv); tx.wrapS = THREE.RepeatWrapping; tx.repeat.set(1600 / 12, 1); return tx;
  }, []);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, ROAD + 0.02, 0.5]} material={mat} receiveShadow><planeGeometry args={[1600, 8]} /></mesh>
      {[-3.25, 4.25].map((z) => (
        <mesh key={z} rotation-x={-Math.PI / 2} position={[0, ROAD + 0.035, z]} receiveShadow><planeGeometry args={[1600, 0.16]} /><meshStandardMaterial color="#e9e9e4" roughness={0.6} /></mesh>
      ))}
      <mesh rotation-x={-Math.PI / 2} position={[0, ROAD + 0.035, 0.5]} receiveShadow>
        <planeGeometry args={[1600, 0.13]} /><meshStandardMaterial color="#e9e9e4" roughness={0.6} alphaMap={tracejado} transparent alphaTest={0.5} />
      </mesh>
      {/* meio-fio de pedra do lado do mar */}
      <mesh position={[0, ROAD, -3.75]} receiveShadow castShadow><boxGeometry args={[1600, 0.22, 0.5]} /><meshStandardMaterial color="#9d9a92" roughness={0.9} /></mesh>
    </group>
  );
};

// ---------- caserio basco: terreo de pedra, reboco branco, madeira escura, varanda corrida, telhado de duas aguas com telha ----------
const Caserio: React.FC<{env: THREE.Texture}> = ({env}) => {
  const [pedra, reb, rebN, tel, telN] = useTexCostas(['rock_wall_02_diff_2k.jpg', 'white_stucco_diff_1k.jpg', 'white_stucco_nor_gl_1k.jpg', 'clay_roof_tiles_02_diff_1k.jpg', 'clay_roof_tiles_02_nor_gl_1k.jpg']);
  const L = 13, P = 12, H1 = 3.1, H2 = 2.9, cume = 3.0;   // largura (frente), profundidade, terreo, andar, altura do cume acima das paredes
  const y0 = alturaGaz(CASA.x, CASA.z) + 0.15;
  const m = useMemo(() => {
    const pedraM = matTriplanar({tex: pedra, esc: 0.35, cor: '#d9d2c4', chave: 'casapedra', env, rough: 0.95});
    const rebM = matTriplanar({tex: reb, esc: 0.3, cor: '#f4f1ea', chave: 'casareb', env, rough: 0.9});
    const telC = tel.clone(); telC.repeat.set(4, 3); telC.needsUpdate = true;
    const telNC = telN.clone(); telNC.repeat.set(4, 3); telNC.needsUpdate = true;
    const telhaM = new THREE.MeshStandardMaterial({map: telC, normalMap: telNC, color: '#c98a74', roughness: 0.85, envMap: env, envMapIntensity: 0.35, side: THREE.DoubleSide});
    const madeira = new THREE.MeshStandardMaterial({color: '#4a2f1d', roughness: 0.8});
    const verde = new THREE.MeshStandardMaterial({color: '#2f5d3a', roughness: 0.7});
    const vidro = new THREE.MeshStandardMaterial({color: '#1b2229', roughness: 0.15, metalness: 0.3, envMap: env, envMapIntensity: 1.0});
    void rebN;
    return {pedraM, rebM, telhaM, madeira, verde, vidro};
  }, [pedra, reb, rebN, tel, telN, env]);
  // telhado: duas aguas com o cume perpendicular a fachada (a empena olha para a camera, como os caserios)
  const telhado = useMemo(() => {
    const beiral = 0.9, w = L / 2 + beiral, comp = P + 2 * beiral, inc = Math.atan2(cume, L / 2), larg = w / Math.cos(inc);
    return {inc, larg, comp};
  }, []);
  const empena = useMemo(() => { const s = new THREE.Shape(); s.moveTo(-L / 2, 0); s.lineTo(L / 2, 0); s.lineTo(0, cume); s.closePath(); return new THREE.ShapeGeometry(s); }, []);
  const janelas: [number, number][] = [[-4.2, 1.6], [4.2, 1.6], [-4.2, H1 + 1.4], [-1.4, H1 + 1.4], [1.4, H1 + 1.4], [4.2, H1 + 1.4], [0, H1 + H2 + 1.1]];
  return (
    <group position={[CASA.x, y0, CASA.z]} rotation-y={0.12}>
      {/* plataforma de pedra */}
      <mesh position={[0, -0.4, 0.6]} material={m.pedraM} receiveShadow castShadow><boxGeometry args={[L + 3, 1.2, P + 4]} /></mesh>
      <mesh position={[0, H1 / 2 + 0.2, 0]} material={m.pedraM} castShadow receiveShadow><boxGeometry args={[L, H1, P]} /></mesh>
      <mesh position={[0, H1 + H2 / 2 + 0.2, 0]} material={m.rebM} castShadow receiveShadow><boxGeometry args={[L - 0.1, H2, P - 0.1]} /></mesh>
      {/* empenas (frente e fundo) */}
      {[P / 2 - 0.05, -P / 2 + 0.05].map((z, k) => <mesh key={k} geometry={empena} material={m.rebM} position={[0, H1 + H2 + 0.2, z]} rotation-y={k ? Math.PI : 0} castShadow />)}
      {/* cunhais de pedra */}
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * (L / 2 - 0.25), (H1 + H2) / 2 + 0.2, sz * (P / 2 - 0.25)]} material={m.pedraM} castShadow><boxGeometry args={[0.62, H1 + H2, 0.62]} /></mesh>)))}
      {/* telhado */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={m.telhaM} castShadow receiveShadow position={[s * (L / 4 + 0.45), H1 + H2 + 0.2 + cume / 2 - 0.42, 0]} rotation={[0, 0, -s * telhado.inc]}>
          <boxGeometry args={[telhado.larg, 0.22, telhado.comp]} />
        </mesh>))}
      {/* madeiramento da fachada (vigas) e varanda corrida */}
      <mesh position={[0, H1 + 0.25, P / 2 + 0.06]} material={m.madeira} castShadow><boxGeometry args={[L + 0.2, 0.3, 0.25]} /></mesh>
      {[-3, 0, 3].map((x) => <mesh key={x} position={[x, H1 + H2 / 2, P / 2 + 0.07]} material={m.madeira}><boxGeometry args={[0.24, H2, 0.18]} /></mesh>)}
      <mesh position={[0, H1 + 0.35, P / 2 + 0.75]} material={m.madeira} castShadow><boxGeometry args={[L - 1.4, 0.16, 1.4]} /></mesh>
      <mesh position={[0, H1 + 1.25, P / 2 + 1.42]} material={m.madeira} castShadow><boxGeometry args={[L - 1.4, 0.1, 0.1]} /></mesh>
      {Array.from({length: 22}, (_, k) => <mesh key={k} position={[-(L - 1.6) / 2 + k * ((L - 1.6) / 21), H1 + 0.8, P / 2 + 1.42]} material={m.madeira}><boxGeometry args={[0.06, 0.9, 0.06]} /></mesh>)}
      {/* janelas com portadas verdes */}
      {janelas.map(([x, y], k) => (
        <group key={k} position={[x, y + 0.2, P / 2 + 0.03]}>
          <mesh material={m.vidro}><boxGeometry args={[1.0, 1.25, 0.08]} /></mesh>
          <mesh position={[-0.82, 0, 0.05]} material={m.verde}><boxGeometry args={[0.55, 1.3, 0.06]} /></mesh>
          <mesh position={[0.82, 0, 0.05]} material={m.verde}><boxGeometry args={[0.55, 1.3, 0.06]} /></mesh>
        </group>))}
      {/* portal em arco (entrada) */}
      <mesh position={[0, 1.35, P / 2 + 0.04]} material={m.madeira}><boxGeometry args={[2.2, 2.3, 0.1]} /></mesh>
      <mesh position={[0, 2.5, P / 2 + 0.05]} rotation-x={Math.PI / 2} material={m.madeira}><cylinderGeometry args={[1.1, 1.1, 0.1, 20, 1, false, -Math.PI / 2, Math.PI]} /></mesh>
      {/* chamine */}
      <mesh position={[-2.6, H1 + H2 + cume - 0.2, -2]} material={m.pedraM} castShadow><boxGeometry args={[0.9, 2.6, 0.9]} /></mesh>
    </group>
  );
};

// ---------- farola (poste de rua) ----------
const Farola: React.FC<{p: V3}> = ({p}) => (
  <group position={p}>
    <mesh position={[0, 3.6, 0]} castShadow><cylinderGeometry args={[0.07, 0.12, 7.2, 10]} /><meshStandardMaterial color="#2c2e31" roughness={0.5} metalness={0.6} /></mesh>
    <mesh position={[-0.6, 7.1, 0]} rotation-z={Math.PI / 2} castShadow><cylinderGeometry args={[0.05, 0.05, 1.3, 8]} /><meshStandardMaterial color="#2c2e31" roughness={0.5} metalness={0.6} /></mesh>
    <mesh position={[-1.2, 6.95, 0]} castShadow><boxGeometry args={[0.6, 0.18, 0.32]} /><meshStandardMaterial color="#3a3c40" roughness={0.4} metalness={0.5} /></mesh>
  </group>
);

// ---------- ilhota, crista (calcada), ponte de pedra, escadaria em ziguezague, ermida e arvores do topo ----------
const Ilhota: React.FC<{nivel: {value: number}; env: THREE.Texture; t: number}> = ({nivel, env, t}) => {
  const pedra = useGLTF(staticFile('costas/modelos/boulder_01/boulder_01_1k.gltf'));
  const fal = useGLTF(staticFile('costas/modelos/namaqualand_cliff_01/namaqualand_cliff_01_1k.gltf'));
  const [rocha, grama, muro] = useTexCostas(['rock_wall_02_diff_2k.jpg', 'sparse_grass_diff_2k.jpg', 'rock_wall_02_diff_2k.jpg']);
  const [tel] = useTexCostas(['clay_roof_tiles_02_diff_1k.jpg']);
  const d = useMemo(() => {
    const mp = primeiraMalha(pedra.scene), mf = primeiraMalha(fal.scene);
    const gIsla = geoMundo(mp.geometry, ISLA.pos, ISLA.esc, ISLA.ry);
    const gCal = geoMundo(mf.geometry, CALCADA.pos, CALCADA.esc, CALCADA.ry);
    // promontorio: falesias ao longo da borda do morro (viradas para a cala / para o mar aberto)
    const gFal: THREE.BufferGeometry[] = [];
    [[-560, 0.9, 13, 10], [-470, 1.1, 12, 11], [-380, 1.35, 13, 9], [-300, 1.55, 11, 8], [-640, 0.6, 14, 12]].forEach(([z, ry, s, sy]) => {
      const x = bordaPromontorio(z) - 6;
      gFal.push(geoMundo(mf.geometry, [x, -14, z], [s, sy, s * 0.8], -Math.PI / 2 + ry));
    });
    gFal.push(geoMundo(mf.geometry, [-640, -14, -720], [16, 9, 12], Math.PI / 2 - 0.4));
    const matRocha = (verde: number, chave: string, src: THREE.Mesh) => {
      const sm = src.material as THREE.MeshStandardMaterial;
      return matTriplanar({tex: rocha, esc: 0.03, cor: '#c4c6c2', grama, verde, nivel, env, chave, normal: sm.normalMap, roughMap: sm.roughnessMap, lado: THREE.DoubleSide});
    };
    const mIsla = matRocha(1, 'isla', mp), mFal = matRocha(1, 'fal', mf);
    const mPedra = matTriplanar({tex: muro, esc: 0.3, cor: '#cfc6b4', chave: 'muro', env, nivel});
    // ponte de pedra com dois arcos (ExtrudeGeometry: retangulo menos dois arcos)
    const W = PONTE.x1 - PONTE.x0, Hh = PONTE.topo - PONTE.base;
    const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(W, 0); s.lineTo(W, Hh); s.lineTo(0, Hh); s.closePath();
    for (const cx of [W * 0.3, W * 0.72]) {
      const r = 3.6, b = 9.5 - PONTE.base * 0;  // base dos arcos acima da agua
      const hole = new THREE.Path(); hole.moveTo(cx - r, 0); hole.lineTo(cx - r, b); hole.absarc(cx, b, r, Math.PI, 0, true); hole.lineTo(cx + r, 0); hole.closePath();
      s.holes.push(hole);
    }
    const gPonte = new THREE.ExtrudeGeometry(s, {depth: 3.2, bevelEnabled: false});
    gPonte.translate(PONTE.x0, PONTE.base, PONTE.z - 1.6);
    // superficie vista de cima (mapa de alturas pelos vertices, celula de 1,5 m): substitui o raycast em 124k triangulos
    const mapa = mapaAlturas([gIsla, gCal], 1.5);
    const desce = (x: number, z: number) => (x >= PONTE.x0 && x <= PONTE.x1 && Math.abs(z - PONTE.z) < 1.7) ? PONTE.topo : mapa(x, z);
    // pico da ilhota
    const pp = gIsla.attributes.position as THREE.BufferAttribute; let topo = new THREE.Vector3(0, -1e9, 0);
    for (let i = 0; i < pp.count; i++) if (pp.getY(i) > topo.y) topo = new THREE.Vector3(pp.getX(i), pp.getY(i), pp.getZ(i));
    // caminho: promontorio -> crista -> ponte -> ziguezague na face da ilhota virada para a camera -> ermida
    const ctrl: [number, number][] = [[bordaPromontorio(-440) + 30, -438], [bordaPromontorio(-440) + 4, -440], [40, -441], [20, -441], [PONTE.x1 + 1, -440], [PONTE.x0 - 1, -440]];
    const N = 7, ini = new THREE.Vector2(PONTE.x0 - 6, -432);
    for (let k = 1; k <= N; k++) {
      const u = k / N, bx = ini.x + (topo.x - ini.x) * u, bz = ini.y + (topo.z + 6 - ini.y) * u + 28 * Math.sin(Math.PI * u);
      const lado = k % 2 ? 1 : -1;
      ctrl.push([bx + lado * 22 * (1 - u * 0.75), bz]);
    }
    ctrl.push([topo.x, topo.z + 9]);
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k < ctrl.length - 1; k++) {
      const [ax, az] = ctrl[k], [bx, bz] = ctrl[k + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / 2.5));
      for (let j = 0; j < n; j++) {
        const x = ax + ((bx - ax) * j) / n, z = az + ((bz - az) * j) / n;
        const y = k < 2 ? alturaGaz(x, z) : desce(x, z);
        if (y !== null && y > -2) pts.push(new THREE.Vector3(x, y + 0.25, z));
      }
    }
    // fita do caminho (degraus por textura) + mureta dos dois lados
    const pos: number[] = [], uv: number[] = [], idx: number[] = [], mpos: number[] = [], midx: number[] = [];
    let acum = 0;
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const tg = new THREE.Vector3(b.x - a.x, 0, b.z - a.z).normalize(), ld = new THREE.Vector3(-tg.z, 0, tg.x).multiplyScalar(1.6);
      if (i > 0) acum += p.distanceTo(pts[i - 1]);
      pos.push(p.x - ld.x, p.y, p.z - ld.z, p.x + ld.x, p.y, p.z + ld.z); uv.push(0, acum / 0.9, 1, acum / 0.9);
      for (const s2 of [-1.1, 1.1]) mpos.push(p.x + ld.x * s2, p.y - 0.2, p.z + ld.z * s2, p.x + ld.x * s2, p.y + 0.85, p.z + ld.z * s2);
      if (i > 0) {
        const o = (i - 1) * 2; idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3);
        const q = (i - 1) * 4; midx.push(q, q + 4, q + 1, q + 1, q + 4, q + 5, q + 2, q + 6, q + 3, q + 3, q + 6, q + 7);
      }
    });
    const gCam = new THREE.BufferGeometry(); gCam.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gCam.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); gCam.setIndex(idx); gCam.computeVertexNormals();
    const gMur = new THREE.BufferGeometry(); gMur.setAttribute('position', new THREE.Float32BufferAttribute(mpos, 3)); gMur.setIndex(midx); gMur.computeVertexNormals();
    const cv = document.createElement('canvas'); cv.width = 32; cv.height = 32; const c = cv.getContext('2d')!;
    c.fillStyle = '#c4bcab'; c.fillRect(0, 0, 32, 32); c.fillStyle = '#7d7568'; c.fillRect(0, 26, 32, 6); c.fillStyle = '#ebe5d8'; c.fillRect(0, 0, 32, 4);
    const tDeg = new THREE.CanvasTexture(cv); tDeg.wrapS = tDeg.wrapT = THREE.RepeatWrapping; tDeg.colorSpace = THREE.SRGBColorSpace;
    const mCam = new THREE.MeshStandardMaterial({map: tDeg, roughness: 0.9, side: THREE.DoubleSide});
    const mMur = new THREE.MeshStandardMaterial({color: '#b8af9d', roughness: 0.95, side: THREE.DoubleSide});
    // arvores no topo e nas encostas suaves da ilhota (azinheiras: carvalho pequeno, verde-escuro)
    const arv: ItemFloresta[] = [];
    for (let i = 0; arv.length < 34 && i < 200; i++) {
      const ang = rnd(i * 3 + 1) * Math.PI * 2, r = 8 + Math.sqrt(rnd(i * 3 + 2)) * 46;
      const x = topo.x + Math.cos(ang) * r * 1.2, z = topo.z + Math.sin(ang) * r;
      if (Math.hypot(x - topo.x, z - topo.z - 9) < 13) continue;   // deixa a ermida livre
      const y = desce(x, z);
      if (y === null || y < topo.y - 34) continue;
      arv.push({preset: rnd(i) < 0.5 ? 'Oak Medium' : 'Ash Medium', semente: rnd(i) < 0.5 ? 11 : 5, x, z, y: y - 0.6, altura: 7 + rnd(i + 5) * 6, rot: rnd(i + 7) * 6.28});
    }
    return {gIsla, gCal, gFal, gPonte, mIsla, mFal, mPedra, gCam, gMur, mCam, mMur, topo, arv};
  }, [pedra, fal, rocha, grama, muro, nivel, env]);
  const telhaM = useMemo(() => new THREE.MeshStandardMaterial({map: tel, color: '#c27a62', roughness: 0.85}), [tel]);
  const eY = d.topo.y - 3.2;
  return (
    <group>
      <mesh geometry={d.gIsla} material={d.mIsla} castShadow receiveShadow />
      <mesh geometry={d.gCal} material={d.mFal} castShadow receiveShadow />
      {d.gFal.map((g, k) => <mesh key={k} geometry={g} material={d.mFal} castShadow receiveShadow />)}
      <mesh geometry={d.gPonte} material={d.mPedra} castShadow receiveShadow />
      <mesh geometry={d.gCam} material={d.mCam} receiveShadow />
      <mesh geometry={d.gMur} material={d.mMur} castShadow receiveShadow />
      {/* ermida de San Juan: nave de pedra, telhado de telha, espadana com sino, adro murado */}
      <group position={[d.topo.x, eY, d.topo.z + 9]} rotation-y={0.35}>
        <mesh position={[0, -3.2, 0]} material={d.mPedra} receiveShadow castShadow><boxGeometry args={[22, 7.6, 14]} /></mesh>
        <mesh position={[0, 3.2, 0]} material={d.mPedra} castShadow receiveShadow><boxGeometry args={[15, 6.4, 8]} /></mesh>
        {[-1, 1].map((s) => <mesh key={s} position={[0, 7.2, s * 2.1]} rotation-x={s * 0.62} material={telhaM} castShadow><boxGeometry args={[15.8, 0.3, 5.3]} /></mesh>)}
        <mesh position={[7.9, 7.6, 0]} material={d.mPedra} castShadow><boxGeometry args={[1.2, 9.6, 4.4]} /></mesh>
        <mesh position={[8.3, 9.6, 0]}><boxGeometry args={[0.5, 2.0, 1.4]} /><meshStandardMaterial color="#20242a" /></mesh>
        <mesh position={[8.4, 9.4, 0]}><sphereGeometry args={[0.55, 12, 8]} /><meshStandardMaterial color="#8a6a2e" metalness={0.8} roughness={0.35} /></mesh>
        <mesh position={[0, 0.8, 6.9]} material={d.mMur}><boxGeometry args={[22, 1.2, 0.5]} /></mesh>
      </group>
      <Floresta lista={d.arv} t={t} folhas={1} cor="#3a5a2a" cor2="#2c4a24" neve={0} vento={0.2} />
    </group>
  );
};

// ---------- muralha de agua no horizonte (70-74,9): faixa extrudada com perfil parametrico, crista de espuma, translucidez teal ----------
const MURO_VS = `
attribute vec3 aP;        // dz, dy do perfil (altura 1) e s = 0 (costas) .. 1 (base da frente)
uniform float uH; uniform float uZ; uniform float uT;
varying vec3 vW; varying float vY; varying float vS;
float hh(float x){ return fract(sin(x * 12.9898) * 43758.5); }
float vn(float x){ float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(hh(i), hh(i + 1.0), f); }
void main(){
  float x = position.x;
  float H = uH * (0.72 + 0.28 * vn(x * 0.004 + 3.0) + 0.1 * vn(x * 0.021)) * (1.0 - smoothstep(2300.0, 3300.0, abs(x)));
  float zc = uZ + 140.0 * (vn(x * 0.0013) - 0.5) + x * x * 0.000025;
  vec3 p = vec3(x, aP.y * H - 0.6, zc + aP.x * max(H, 2.0) * 1.4);
  vW = (modelMatrix * vec4(p, 1.0)).xyz; vY = aP.y; vS = aP.z;
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
}`;
const MURO_FS = `
uniform float uT; uniform sampler2D uEnv; uniform vec3 uSol; uniform float uDia;
varying vec3 vW; varying float vY; varying float vS;
${GLSL_RUIDO}
vec3 ceuHDRI(vec3 d){ vec2 uv = vec2(atan(d.z, d.x) * 0.15915494 + 0.5, asin(clamp(d.y, -1.0, 1.0)) * 0.31830989 + 0.5); return texture2D(uEnv, uv).rgb; }
void main(){
  vec3 N = normalize(cross(dFdx(vW), dFdy(vW)));
  vec3 V = normalize(cameraPosition - vW); if (dot(N, V) < 0.0) N = -N;
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  float crista = smoothstep(0.45, 0.95, vY) * smoothstep(0.3, 0.55, vS);
  vec3 col = mix(vec3(0.015, 0.10, 0.13), vec3(0.07, 0.42, 0.43), crista * 0.9 + smoothstep(0.35, 0.7, vY) * step(0.5, vS) * 0.35);
  col *= 0.55 + 0.45 * max(dot(N, normalize(uSol)), 0.0) + 0.25;
  vec3 R = reflect(-V, N); R.y = abs(R.y);
  vec3 ceu = pow(min(ceuHDRI(R) * 0.55, vec3(1.6)), vec3(1.0 / 2.2));
  col = mix(col, ceu, 0.05 + 0.3 * fres);
  float n = fbm2(vec2(vW.x * 0.012, vY * 3.0 - uT * 0.35));
  float esp = smoothstep(0.55, 0.78, vY + (n - 0.5) * 0.35) * smoothstep(0.1, 0.35, vS);
  float rastro = smoothstep(0.5, 0.7, fbm2(vec2(vW.x * 0.022, vY * 4.0 + uT * 0.6))) * smoothstep(0.08, 0.5, vY) * step(0.45, vS) * 0.95;
  float base = (1.0 - smoothstep(0.0, 0.14, vY)) * step(0.6, vS) * (0.5 + 0.5 * n);
  col = mix(col, vec3(1.0) * (0.85 + 0.3 * uDia), clamp(esp + rastro + base, 0.0, 1.0));
  gl_FragColor = vec4(col * (0.35 + 0.65 * uDia), 1.0);
  gl_FragColor.rgb = pow(max(gl_FragColor.rgb, vec3(0.0)), vec3(2.2));
}`;
const PERFIL: [number, number][] = [[-70, 0], [-44, 0.22], [-26, 0.5], [-12, 0.8], [-4, 0.97], [1, 1.0], [5, 0.96], [8, 0.86], [8.5, 0.74], [6.5, 0.62], [7.5, 0.45], [11, 0.26], [17, 0.1], [26, 0.0]];
export const alturaMuro = (t: number) => MURO.H * smooth(MURO.t0, MURO.t1, t) ** 1.2;
export const zMuro = (t: number) => MURO.z0 + (MURO.z1 - MURO.z0) * smooth(MURO.t0, 76, t);
const Muralha: React.FC<{t: number; env: THREE.Texture; luz: Luz}> = ({t, env, luz}) => {
  const {geo, mat} = useMemo(() => {
    const NX = 260, M = PERFIL.length, pos: number[] = [], ap: number[] = [], idx: number[] = [];
    for (let i = 0; i <= NX; i++) {
      const x = -3400 + (6800 * i) / NX;
      PERFIL.forEach(([dz, dy], j) => { pos.push(x, 0, 0); ap.push(dz / 26, dy, j / (M - 1)); });
      if (i > 0) for (let j = 0; j < M - 1; j++) { const a = (i - 1) * M + j, b = i * M + j; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aP', new THREE.Float32BufferAttribute(ap, 3)); g.setIndex(idx);
    const m = new THREE.ShaderMaterial({vertexShader: MURO_VS, fragmentShader: MURO_FS, side: THREE.DoubleSide, toneMapped: false,
      uniforms: {uH: {value: 0}, uZ: {value: MURO.z0}, uT: {value: 0}, uEnv: {value: env}, uSol: {value: new THREE.Vector3(0, 1, 0)}, uDia: {value: 1}}});
    return {geo: g, mat: m};
  }, [env]);
  const H = alturaMuro(t);
  mat.uniforms.uH.value = H; mat.uniforms.uZ.value = zMuro(t); mat.uniforms.uT.value = t; mat.uniforms.uSol.value.copy(luz.sol); mat.uniforms.uDia.value = luz.dia;
  // spray na crista (flipbook CC0) e nevoa baixa a frente
  const emSpray = useMemo(() => Array.from({length: 34}, (_, k) => {
    const x = -1650 + k * 100 + rnd(k) * 40;
    return {x, y: 50, z: -1150 + 140 * (vnJS(x * 0.0013) - 0.5) + x * x * 0.000025, s: 120, t0: 71.0 + rnd(k + 3) * 1.2};
  }), []);
  if (H < 0.05) return null;
  return (
    <group>
      <mesh geometry={geo} material={mat} frustumCulled={false} />
      <group>
        <Flipbook atlas={ATLAS.nuvem1} emissores={emSpray} t={t} porEmissor={3} vida={3.2} sobe={3} cresce={0.7}
          cor="#f2f7fa" forca={smooth(71, 73, t)} fumaca luz={0.95} espalha={1.4} />
      </group>
    </group>
  );
};
// mesmo ruido do vertex shader (para o spray acompanhar a curva da crista)
const hhJS = (x: number) => { const v = Math.sin(x * 12.9898) * 43758.5; return v - Math.floor(v); };
const vnJS = (x: number) => { const i = Math.floor(x); let f = x - i; f = f * f * (3 - 2 * f); return hhJS(i) + (hhJS(i + 1) - hhJS(i)) * f; };

// =====================================================================================================================
export const perfilGaztelugatxe = (t: number): Perfil => ({ao: true, bloom: 0.32, limiar: 0.95, vinheta: 0.3, saturacao: 0.04, contraste: 0.06,
  nevoa: {cor: corNevoa(t, 'gaztelugatxe'), densidade: 0.00032, max: 0.55}});

export const Gaztelugatxe: React.FC<{t: number}> = ({t}) => {
  const env = useEnvCostas();
  const hdr = useHDR('praia');
  const nivelU = useMemo(() => ({value: 0}), []);
  const nivel = nivelGaz(t);
  nivelU.value = nivel;
  const luz = luzMar(t, 'gaztelugatxe');
  const cam = useCamera(camGP(CAM, t), 0.5, 40000);
  // linha da costa da cala (onde o relevo da praia cruza o nivel): z = -30 - (2,8 - nivel)/0,039
  const costa = -30 - (2.8 - nivel) / 0.039;
  return (
    <>
      <CeuLugar t={t} lugar="gaztelugatxe" />
      <Terreno nivel={nivelU} env={env} />
      <Estrada env={env} />
      <Caserio env={env} />
      <ArvoreEZ preset="Pine Medium" semente={4} t={t} pos={[PINHO[0], alturaGaz(PINHO[0], PINHO[2]) - 0.2, PINHO[2]]} altura={11} folhas={1} cor="#34512a" cor2="#2a4422" neve={0} vento={0.25} />
      <Farola p={[FAROLA[0], alturaGaz(FAROLA[0], FAROLA[2]), FAROLA[2]]} />
      <Ilhota nivel={nivelU} env={env} t={t} />
      <Mar t={t} luz={luz} costa={costa} nivel={nivel} env={hdr} tamanho={9000} centro={[0, 0]} espuma={1.25} agit={0.18 + 0.2 * smooth(66, 74, t)} />
      <Muralha t={t} env={hdr} luz={luz} />
      <Multidao3D lista={LISTA_PESSOAS} t={t} de={[0, 0]} cam={cam.position} raio={3} estadoDe={estadoGaz} />
    </>
  );
};
