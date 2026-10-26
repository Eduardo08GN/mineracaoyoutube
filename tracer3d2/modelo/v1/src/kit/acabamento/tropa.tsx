// Tropa: soldados de 1870 com ESQUELETO em media distancia e bloco instanciado ao longe (LOD), numa unica API.
//   <Tropa lado="de" n={180} t={t} formacao={bloco({cols: 30, ox, oz, ry, v: 2})} acao="marsch" lod={{dist: 80, max: 150}} cadencia={0.9} />
//   <Tropa lado="fr" n={n} t={t} fig={(i) => ({x, z, ry, gait: 1, fall})} />        // mesmo contrato do `Heer` (troca direta)
// Escala real: o corpo mede `altura` (1,75 m) com variacao de +-4%; os blocos do `Heer` usam a mesma altura (sc * altura/1,8).
// LOD por quadro (funcao pura da camera e das figuras, sem estado entre quadros): as `lod.max` figuras mais proximas da camera, dentro de
// `lod.dist` metros e dentro do frustum, viram soldados com esqueleto; o resto fica no `Heer` instanciado. O aspecto de cada soldado
// (pele, tom do tecido, altura, fase do passo) vem do indice da FIGURA, nao do slot do pool: nao pisca quando a figura troca de slot.
// Custo: 1 draw call por soldado com esqueleto (corpo + olhos + cabelo + capacete + mochila + fuzil fundidos numa malha so) + 1 de sombra.
// Animacao: Quaternius Universal Animation Library (CC0) por `action.time` + `mixer.update(0)` (deterministico, nada de relogio).
// Coordenadas: as do Heer (rotation.y = giro(dx, dz), figura olhando para +x); o modelo olha para +z, entao ry' = ry + PI/2.
import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import {clone as clonarComEsqueleto} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {staticFile} from 'remotion';
import {Heer, Fig, CORES_DE, CORES_FR} from './heer_bloco';
import type {Exercito} from './soldados';

// uniformes de 1870 (mesma leitura de cor do bloco `Heer`: o PBR escurece, entao o tom base e um pouco mais claro que o do SoldadosRig)
export const UNIFORMES_TROPA: Record<Exercito, {casaco: string; calca: string; gola: string}> = {
  pr: {casaco: '#2f4b88', calca: '#2c3556', gola: '#a8322c'},   // Waffenrock azul-escuro, calca escura, gola vermelha
  fr: {casaco: '#3a4f93', calca: '#c23a2e', gola: '#d8d2bd'},   // capote azul, calca garance (vermelha)
};

export type Lado = 'de' | 'fr';
export type Acao = 'marsch' | 'sturm' | 'steht' | 'fallen' | 'zielen' | 'sitzt';
export type FigT = Fig & {acao?: Acao};
export type Formacao = (i: number, t: number) => FigT | null;
export type LodTropa = {dist?: number; max?: number; sombra?: number; folga?: number};

const hash = (i: number, s = 0): number => { const x = Math.sin(i * 127.1 + s * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const suave = (u: number) => { const x = clamp01(u); return x * x * (3 - 2 * x); };

// ---------------------------------------------------------------- formacoes (funcoes puras de i e t)
export type OpcFormacao = {
  cols: number; ox: number; oz: number; ry: number;   // origem (x, z) e rumo (rotation.y do Heer: o rumo e (cos ry, -sin ry) em (x, z))
  dx?: number; dz?: number;                           // espacamento entre fileiras (ao longo do rumo) e entre colunas (lateral), metros
  v?: number;                                         // velocidade de avanco (m/s); a formacao anda como bloco
  h?: (x: number, z: number) => number;               // altura do terreno
  jitter?: number; semente?: number;                  // desordem (m) por soldado
  ondula?: number;                                    // ondulacao da linha (m): avanco desigual entre colunas
  t0?: number; dt?: number;                           // entrada escalonada: soldado i aparece em t0 + (i / n) * dt (vis cresce em 0,3 s)
  n?: number;
};
// bloco regular de `cols` colunas; fileira 0 na frente (rumo). Soldados andam em marcha ao avancar.
export const bloco = (o: OpcFormacao): Formacao => {
  const dx = o.dx ?? 1.0, dz = o.dz ?? 0.9, jit = o.jitter ?? 0.12, s = o.semente ?? 1;
  const d = [Math.cos(o.ry), -Math.sin(o.ry)], p = [Math.sin(o.ry), Math.cos(o.ry)];
  return (i, t) => {
    const r = Math.floor(i / o.cols), c = i % o.cols;
    const avanco = (o.v ?? 0) * t + (o.ondula ?? 0) * Math.sin(c * 1.7 + s);
    const a = avanco - r * dx + (hash(i, s) - 0.5) * jit * 2, l = (c - (o.cols - 1) / 2) * dz + (hash(i, s + 1) - 0.5) * jit * 2;
    const x = o.ox + d[0] * a + p[0] * l, z = o.oz + d[1] * a + p[1] * l;
    const vis = o.dt ? suave((t - ((o.t0 ?? 0) + (i / Math.max(1, (o.n ?? o.cols * 8))) * o.dt)) / 0.3) : 1;
    return {x, z, y: o.h ? o.h(x, z) : 0, ry: o.ry, sc: 1, vis, gait: (o.v ?? 0) > 0.05 ? 1 : 0};
  };
};
// linha unica (frente de batalha): `cols` soldados lado a lado
export const linha = (o: Omit<OpcFormacao, 'cols'> & {n: number}): Formacao => bloco({...o, cols: o.n});
// coluna de marcha: fileiras de `larg` homens (4 em 1870) que seguem o rumo; `v` ja anda
export const coluna = (o: Omit<OpcFormacao, 'cols'> & {larg?: number}): Formacao => bloco({...o, cols: o.larg ?? 4, dz: o.dz ?? 0.8});

// ---------------------------------------------------------------- geometria fundida: corpo + olhos + cabelo + capacete + mochila + fuzil
const lathe = (pts: number[][], seg = 12) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
const caixa = (w: number, h: number, d: number, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) => {
  const g = new THREE.BoxGeometry(w, h, d); g.rotateX(rx); g.rotateY(ry); g.rotateZ(rz); g.translate(x, y, z); return g;
};
type Peca = {g: THREE.BufferGeometry; cor: string; rug: number; met: number; osso: string; fuzil?: boolean};
const pecasDe = (sk: THREE.Skeleton, ex: Exercito): Peca[] => {
  const cabeca = 1.70, P: Peca[] = [];
  const couro = '#17130f', latao = '#c29a3c', lona = '#5d4a33', capote = '#85806b', madeira = '#3d2b1b', aco = '#5a5d63';
  if (ex === 'pr') {   // Pickelhaube: calota de couro, ponta de latao, placa frontal, pala
    P.push({g: lathe([[0, 0.17], [0.05, 0.165], [0.1, 0.125], [0.14, 0.05], [0.155, 0.0], [0.17, -0.02]]).translate(0, cabeca + 0.065, 0.005), cor: couro, rug: 0.42, met: 0.05, osso: 'Head'});
    P.push({g: new THREE.ConeGeometry(0.02, 0.15, 8).translate(0, cabeca + 0.065 + 0.245, 0.005), cor: latao, rug: 0.32, met: 0.85, osso: 'Head'});
    P.push({g: caixa(0.1, 0.11, 0.015, 0, cabeca + 0.13, 0.15, -0.15), cor: latao, rug: 0.32, met: 0.85, osso: 'Head'});
    P.push({g: caixa(0.2, 0.01, 0.07, 0, cabeca + 0.05, 0.17, -0.12), cor: couro, rug: 0.42, met: 0.05, osso: 'Head'});
  } else {   // kepi vermelho de topo plano e pala
    P.push({g: lathe([[0, 0.105], [0.12, 0.105], [0.14, 0.07], [0.15, 0.0], [0.15, -0.015]]).translate(0, cabeca + 0.06, 0.005), cor: '#9b2f28', rug: 0.85, met: 0, osso: 'Head'});
    P.push({g: caixa(0.19, 0.01, 0.075, 0, cabeca + 0.055, 0.16, -0.18), cor: couro, rug: 0.42, met: 0.05, osso: 'Head'});
  }
  P.push({g: caixa(0.34, 0.30, 0.15, 0, 1.28, -0.16), cor: lona, rug: 0.9, met: 0, osso: 'spine_03'});                                    // mochila
  P.push({g: new THREE.CylinderGeometry(0.07, 0.07, 0.38, 10).rotateZ(Math.PI / 2).translate(0, 1.46, -0.16), cor: capote, rug: 0.95, met: 0, osso: 'spine_03'});   // capote
  P.push({g: caixa(0.045, 1.22, 0.05, 0.1, 1.22, -0.27, 0, 0, 0.16), cor: madeira, rug: 0.6, met: 0, osso: 'spine_03'});                      // fuzil nas costas
  P.push({g: caixa(0.012, 0.3, 0.012, 0.12, 1.88, -0.27, 0, 0, 0.16), cor: aco, rug: 0.5, met: 0.45, osso: 'spine_03'});
  const iM = sk.bones.findIndex((b) => b.name === 'hand_r');   // fuzil na mao (aparece ao mirar / assaltar)
  const hand = new THREE.Vector3().setFromMatrixPosition(sk.boneInverses[iM].clone().invert());
  P.push({g: caixa(1.15, 0.05, 0.05, hand.x + 0.1, hand.y, hand.z + 0.02), cor: madeira, rug: 0.6, met: 0, osso: 'hand_r', fuzil: true});
  P.push({g: caixa(0.5, 0.025, 0.025, hand.x - 0.75, hand.y, hand.z + 0.02), cor: aco, rug: 0.5, met: 0.45, osso: 'hand_r', fuzil: true});
  return P;
};

const fundir = (partes: {g: THREE.BufferGeometry; cor: THREE.Color; surf: [number, number, number]; osso?: number}[]): THREE.BufferGeometry => {
  let nv = 0, ni = 0;
  for (const p of partes) { nv += p.g.attributes.position.count; ni += p.g.index ? p.g.index.count : p.g.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), si = new Float32Array(nv * 4), sw = new Float32Array(nv * 4);
  const vc = new Float32Array(nv * 3).fill(1), cor = new Float32Array(nv * 3), sf = new Float32Array(nv * 3), idx = new Uint32Array(ni);
  let ov = 0, oi = 0;
  for (const p of partes) {
    const g = p.g, n = g.attributes.position.count, A = g.attributes;
    for (let k = 0; k < n; k++) {
      pos[(ov + k) * 3] = A.position.getX(k); pos[(ov + k) * 3 + 1] = A.position.getY(k); pos[(ov + k) * 3 + 2] = A.position.getZ(k);
      if (A.normal) { nor[(ov + k) * 3] = A.normal.getX(k); nor[(ov + k) * 3 + 1] = A.normal.getY(k); nor[(ov + k) * 3 + 2] = A.normal.getZ(k); }
      if (A.uv) { uv[(ov + k) * 2] = A.uv.getX(k); uv[(ov + k) * 2 + 1] = A.uv.getY(k); }
      if (p.osso !== undefined) { si[(ov + k) * 4] = p.osso; sw[(ov + k) * 4] = 1; }
      else { for (let c = 0; c < 4; c++) { si[(ov + k) * 4 + c] = A.skinIndex.getComponent(k, c); sw[(ov + k) * 4 + c] = A.skinWeight.getComponent(k, c); } }
      if (A.color) { vc[(ov + k) * 3] = A.color.getX(k); vc[(ov + k) * 3 + 1] = A.color.getY(k); vc[(ov + k) * 3 + 2] = A.color.getZ(k); }   // COLOR_0 do corpo (o material usa vertexColors)
      cor[(ov + k) * 3] = p.cor.r; cor[(ov + k) * 3 + 1] = p.cor.g; cor[(ov + k) * 3 + 2] = p.cor.b;
      sf[(ov + k) * 3] = p.surf[0]; sf[(ov + k) * 3 + 1] = p.surf[1]; sf[(ov + k) * 3 + 2] = p.surf[2];
    }
    if (g.index) for (let k = 0; k < g.index.count; k++) idx[oi++] = g.index.getX(k) + ov; else for (let k = 0; k < n; k++) idx[oi++] = ov + k;
    ov += n;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); out.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
  out.setAttribute('color', new THREE.BufferAttribute(vc, 3)); out.setAttribute('aCor', new THREE.BufferAttribute(cor, 3)); out.setAttribute('aSurf', new THREE.BufferAttribute(sf, 3));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  out.computeBoundingSphere(); return out;
};

// ---------------------------------------------------------------- material do soldado (regioes do corpo por posicao de bind + pecas por vertice)
const recolorir = (m: THREE.MeshStandardMaterial, ex: Exercito): THREE.MeshStandardMaterial => {
  const n = m.clone() as THREE.MeshStandardMaterial;
  const U = UNIFORMES_TROPA[ex];
  const u = {uCasaco: {value: new THREE.Color(U.casaco)}, uCalca: {value: new THREE.Color(U.calca)}, uGola: {value: new THREE.Color(U.gola)},
    uPele: {value: new THREE.Color('#b98a6c')}, uCinza: {value: 0}, uTom: {value: 1}, uFz: {value: 0}};
  n.userData.u = u;
  n.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aCor; attribute vec3 aSurf; varying vec3 vBind; varying vec3 vCor; varying vec3 vSurf;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBind = position; vCor = aCor; vSurf = aSurf;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vBind; varying vec3 vCor; varying vec3 vSurf;\nuniform vec3 uCasaco; uniform vec3 uCalca; uniform vec3 uGola; uniform vec3 uPele; uniform float uCinza; uniform float uTom; uniform float uFz;')
      .replace('#include <map_fragment>', `#include <map_fragment>
  { if (vSurf.x > 1.5 && uFz < 0.5) discard;
    float ax = abs(vBind.x), y = vBind.y, z = vBind.z;
    float lum = dot(diffuseColor.rgb, vec3(0.333));
    float tecido = (0.62 + 1.3 * lum) * uTom;
    float tronco = step(ax, 0.24) * step(0.80, y) * step(y, 1.50);
    float manga = step(0.18, ax) * step(ax, 0.70) * step(1.28, y) * step(y, 1.62);
    float casaco = max(tronco, manga);
    float calca = step(ax, 0.30) * step(y, 0.84) * step(0.10, y);
    float bota = step(y, 0.13);
    float gola = step(1.46, y) * step(y, 1.56) * step(ax, 0.12) * step(0.0, z);
    vec3 c = diffuseColor.rgb * uPele * 1.15;
    c = mix(c, uCalca * tecido, calca);
    c = mix(c, vec3(0.045, 0.035, 0.03), bota * (1.0 - casaco));
    c = mix(c, uCasaco * tecido, casaco);
    c = mix(c, uGola * 0.8, gola * casaco * 0.9);
    float diag = min(abs(abs(vBind.x) - (y - 1.0) * 0.5 - 0.02), 1.0);
    c = mix(c, vec3(0.62, 0.58, 0.48), step(diag, 0.03) * tronco * step(0.04, z) * step(1.04, y) * step(y, 1.44));
    c = mix(c, vec3(0.05, 0.04, 0.035), step(0.93, y) * step(y, 1.0) * tronco);
    c *= 1.0 - 0.45 * (1.0 - smoothstep(0.1, 0.55, y)) * (1.0 - bota);
    c = mix(c, vCor, step(0.5, vSurf.x));                          // pecas (capacete, mochila, fuzil), olhos e cabelo: cor do vertice
    c = mix(c, vec3(dot(c, vec3(0.333))) * vec3(0.8, 0.78, 0.74), uCinza);
    diffuseColor.rgb = c; }`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, vSurf.y, step(0.5, vSurf.x));')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, vSurf.z, step(0.5, vSurf.x));');
  };
  n.customProgramCacheKey = () => 'tropa_soldado';
  return n;
};

// ---------------------------------------------------------------- pool de soldados com esqueleto
const CLIPES = {anda: 'Walk_Formal_Loop', corre: 'Jog_Fwd_Loop', parado: 'Idle_Loop', cai: 'Death01', senta: 'Sitting_Idle_Loop', mira: 'Pistol_Aim_Neutral'};
type Slot = {raiz: THREE.Object3D; mixer: THREE.AnimationMixer; acoes: Record<string, THREE.AnimationAction>; atual?: string; mat: THREE.MeshStandardMaterial; mesh: THREE.SkinnedMesh};
const ALT_MODELO = 1.81;   // altura do corpo da Quaternius sem capacete (m)

type Estado = {figs: (FigT | null)[]; rig: Int32Array; nRig: number; t: number; mask: Uint8Array};

const Seletor: React.FC<{S: {current: Estado}; n: number; t: number; formacao: (i: number) => FigT | null; dist: number; max: number}> = ({S, n, t, formacao, dist, max}) => {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    const figs: (FigT | null)[] = new Array(n);
    camera.updateMatrixWorld(true);
    const fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    const cand: [number, number][] = [], c = camera.position, esf = new THREE.Sphere();
    for (let i = 0; i < n; i++) {
      const f = formacao(i); figs[i] = f;
      if (!f || (f.vis ?? 1) <= 0.001) continue;
      const sc = f.sc ?? 1, y = (f.y ?? 0) + 0.9 * sc;
      const d = Math.hypot(f.x - c.x, y - c.y, f.z - c.z);
      if (d > dist) continue;
      esf.set(new THREE.Vector3(f.x, y, f.z), 1.4 * sc);
      if (!fr.intersectsSphere(esf)) continue;
      cand.push([d, i]);
    }
    cand.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const k = Math.min(max, cand.length), rig = new Int32Array(k);
    for (let j = 0; j < k; j++) rig[j] = cand[j][1];
    const mask = new Uint8Array(n); for (let j = 0; j < k; j++) mask[rig[j]] = 1;
    S.current = {figs, rig, nRig: k, t, mask};
  });
  return null;
};

const PoolRig: React.FC<{S: {current: Estado}; lado: Lado; max: number; seed: number; cadencia: number; altura: number; sombraDist: number}> = ({S, lado, max, seed, cadencia, altura, sombraDist}) => {
  const ex: Exercito = lado === 'de' ? 'pr' : 'fr';
  const camera = useThree((s) => s.camera);
  const corpo = useGLTF(staticFile('acabamento/pessoas/masc.gltf')), anim = useGLTF(staticFile('acabamento/pessoas/anim.glb'));
  const clipes = useMemo(() => Object.fromEntries(anim.animations.map((c) => [c.name, c])), [anim]);
  const slots = useMemo<Slot[]>(() => {
    // 1) base: corpo + olhos + cabelo + pecas fundidos numa malha so (1 draw call por soldado)
    const base = clonarComEsqueleto(corpo.scene) as THREE.Object3D;
    const sms: THREE.SkinnedMesh[] = []; base.traverse((o: any) => { if (o.isSkinnedMesh) sms.push(o); });
    const corpoMesh = sms.find((m) => /Superhero/i.test((m.material as any)?.name ?? '')) ?? sms[sms.length - 1];
    const sk = corpoMesh.skeleton, ossoIdx = (nome: string) => sk.bones.findIndex((b) => b.name === nome);
    const partes: Parameters<typeof fundir>[0] = [{g: corpoMesh.geometry, cor: new THREE.Color(0), surf: [0, 0, 0]}];
    for (const m of sms) {
      if (m === corpoMesh) continue;
      const olho = /Eyes/i.test((m.material as any)?.name ?? '');
      partes.push({g: m.geometry, cor: new THREE.Color(olho ? '#1a1410' : '#2a1f17'), surf: [1, olho ? 0.3 : 0.9, 0]});
      m.parent?.remove(m);
    }
    for (const p of pecasDe(sk, ex)) partes.push({g: p.g, cor: new THREE.Color(p.cor), surf: [p.fuzil ? 2 : 1, p.rug, p.met], osso: ossoIdx(p.osso)});
    corpoMesh.geometry = fundir(partes);
    const matBase = corpoMesh.material as THREE.MeshStandardMaterial;
    // 2) pool
    const lista: Slot[] = [];
    for (let k = 0; k < max; k++) {
      const raiz = clonarComEsqueleto(base) as THREE.Object3D;
      let mat!: THREE.MeshStandardMaterial, mesh!: THREE.SkinnedMesh;
      raiz.traverse((o: any) => { if (o.isSkinnedMesh) { o.frustumCulled = false; o.receiveShadow = true; o.castShadow = true; mat = recolorir(matBase, ex); o.material = mat; mesh = o; } });
      raiz.visible = false;
      lista.push({raiz, mixer: new THREE.AnimationMixer(raiz), acoes: {}, mat, mesh});
    }
    return lista;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corpo, ex, max]);

  useLayoutEffect(() => {
    const st = S.current, t = st.t, cam = camera.position;
    for (let k = 0; k < slots.length; k++) {
      const m = slots[k];
      if (k >= st.nRig) { m.raiz.visible = false; continue; }
      const i = st.rig[k], f = st.figs[i]!;
      m.raiz.visible = true;
      const h1 = hash(i, seed + 1), h2 = hash(i, seed + 2), h3 = hash(i, seed + 3), h4 = hash(i, seed + 5), off = hash(i, seed + 6);
      const sc = (f.sc ?? 1) * (f.vis ?? 1) * (altura / ALT_MODELO) * (0.97 + 0.07 * h4);
      m.raiz.position.set(f.x, f.y ?? 0, f.z); m.raiz.rotation.set(0, f.ry + Math.PI / 2, 0); m.raiz.scale.setScalar(sc);
      const u = m.mat.userData.u;
      u.uPele.value.setHSL(0.07 + 0.02 * h1, 0.38, 0.55 + 0.1 * h2); u.uTom.value = 0.85 + 0.3 * h3; u.uCinza.value = f.grau ?? 0;
      // acao -> clipe
      const gait = f.gait ?? 0, ac = f.acao;
      const cai = (f.fall ?? 0) > 0.001 || ac === 'fallen', corre = gait > 1.5 || ac === 'sturm', anda = gait > 0.5 || ac === 'marsch';
      const nome = cai ? CLIPES.cai : (f.sit ?? 0) > 0.5 || ac === 'sitzt' ? CLIPES.senta : (f.aim ?? 0) > 0.5 || ac === 'zielen' ? CLIPES.mira : corre ? CLIPES.corre : anda ? CLIPES.anda : CLIPES.parado;
      const clip = clipes[nome] ?? clipes[CLIPES.parado];
      if (m.atual !== nome) { m.mixer.stopAllAction(); m.acoes[nome] = m.acoes[nome] ?? m.mixer.clipAction(clip); m.acoes[nome].play(); m.atual = nome; }
      const dur = clip.duration;
      let tempo: number;
      if (nome === CLIPES.cai) tempo = Math.min(dur - 1e-3, (ac === 'fallen' && (f.fall ?? 0) <= 0.001 ? 1 : f.fall ?? 0) * dur * 0.9);
      else if (nome === CLIPES.anda || nome === CLIPES.corre) tempo = (((t * cadencia * (corre ? 1.35 : 1) * (0.94 + 0.12 * h2) + off) % 1 + 1) % 1) * dur;
      else tempo = ((t * 0.5 + off * dur) % dur + dur) % dur;
      m.acoes[nome].time = tempo; m.mixer.update(0);
      m.mat.userData.u.uFz.value = (f.aim ?? 0) > 0.5 || corre || ac === 'zielen' ? 1 : 0;
      m.mesh.castShadow = Math.hypot(f.x - cam.x, f.z - cam.z) < sombraDist;
    }
  });
  return <group>{slots.map((m, k) => <primitive key={k} object={m.raiz} />)}</group>;
};

// ---------------------------------------------------------------- componente
export type TropaProps = {
  lado: Lado; n: number; t: number;
  formacao?: Formacao;                  // (i, t) -> figura (bloco/coluna/linha ou propria)
  fig?: (i: number) => FigT | null;     // alternativa com o mesmo contrato do `Heer` (a figura ja no instante t)
  acao?: Acao | ((i: number, t: number) => Acao);   // acao padrao quando a figura nao diz gait/fall/aim/sit
  queda?: (i: number) => number | undefined;         // instante (s) em que o soldado i cai (fall sobe 0->1 em 0,55 s e fica deitado, cinza)
  lod?: LodTropa | false;               // dist (m, padrao 80), max (soldados com esqueleto, padrao 150), sombra (m, padrao 50); false = so bloco
  seed?: number; cadencia?: number; altura?: number; tAnim?: number;
};

export const Tropa: React.FC<TropaProps> = ({lado, n, t, formacao, fig, acao = 'steht', queda, lod = {}, seed = 1, cadencia = 0.9, altura = 1.75, tAnim}) => {
  const L = lod === false ? null : {dist: 80, max: 150, sombra: 50, ...lod};
  const S = React.useRef<Estado>({figs: [], rig: new Int32Array(0), nRig: 0, t, mask: new Uint8Array(0)});
  const base = (i: number): FigT | null => {
    const f0 = formacao ? formacao(i, t) : fig ? fig(i) : null;
    if (!f0) return null;
    const f: FigT = {...f0};
    const a = f.acao ?? (typeof acao === 'function' ? acao(i, t) : acao);
    f.acao = a;
    if (f.gait === undefined || (formacao && f.gait === 0 && a !== 'steht')) f.gait = a === 'marsch' ? 1 : a === 'sturm' ? 2 : f.gait ?? 0;
    if (a === 'zielen' && f.aim === undefined) f.aim = 1;
    if (a === 'sitzt' && f.sit === undefined) f.sit = 1;
    const tq = queda?.(i);
    if (tq !== undefined && t > tq) { const u = clamp01((t - tq) / 0.55); f.fall = u * u * (3 - 2 * u); f.gait = 0; f.grau = clamp01((t - tq - 0.4) / 0.9); }
    if (a === 'fallen' && f.fall === undefined) { f.fall = 1; f.grau = 0.9; f.gait = 0; }
    return f;
  };
  const escBloco = altura / 1.8;
  if (!L) return <Heer kind={lado === 'de' ? 'pr' : 'fr'} n={n} t={t} tAnim={tAnim} fig={(i) => { const f = base(i); return f ? {...f, sc: (f.sc ?? 1) * escBloco, gait: Math.min(1, f.gait ?? 0)} : null; }} seed={seed} cadencia={cadencia} />;
  return (
    <>
      <Seletor S={S} n={n} t={t} formacao={base} dist={L.dist} max={L.max} />
      <Heer kind={lado === 'de' ? 'pr' : 'fr'} n={n} t={t} tAnim={tAnim} seed={seed} cadencia={cadencia} cores={lado === 'de' ? CORES_DE : CORES_FR}
        fig={(i) => { const f = S.current.figs[i]; if (!f || S.current.mask[i]) return null; return {...f, sc: (f.sc ?? 1) * escBloco, gait: Math.min(1, f.gait ?? 0)}; }} />
      <PoolRig S={S} lado={lado} max={L.max} seed={seed} cadencia={cadencia} altura={altura} sombraDist={L.sombra} />
    </>
  );
};
