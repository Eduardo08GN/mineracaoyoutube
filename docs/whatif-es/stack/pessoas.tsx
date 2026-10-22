// Pessoas de verdade (stack de qualidade de 21/10/2026): corpos com rig da Quaternius (Universal Base Characters, CC0),
// 43 animacoes da Universal Animation Library (mesmo esqueleto de 65 ossos), cabelo preso ao esqueleto do corpo.
// Tudo e funcao do tempo: posicao por formula fechada (andar, fugir), clipe escolhido pelo estado/velocidade,
// fase do passo = distancia percorrida / passada (o pe nao desliza). Nada de mixer.update(delta) com relogio.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useGLTF} from '@react-three/drei';
import {clone as clonarComEsqueleto} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {staticFile} from 'remotion';
import {rnd} from './comum';

export type Pose = 'andando' | 'parado' | 'conversando' | 'sentado' | 'deitado' | 'nadando';
export type Pessoa3D = {i: number; x: number; z: number; rot: number; pose: Pose; y?: number;
  fem?: boolean; reage?: number;  // atraso (s) para comecar a fugir
  camisa?: string; calca?: string; curta?: boolean;   // roupa (camisa de manga curta + calca ou short); sem camisa = roupa de banho
  carbonizado?: boolean;
};
export type Estado3D = {x: number; y: number; z: number; ry: number; clipe: string; tempo: number; visivel?: boolean};
type Estado = Estado3D;

const CABELOS_M = ['hair_simpleparted', 'hair_buzzed'], CABELOS_F = ['hair_long', 'hair_buns'];
const ROUPAS = ['#1f3f8f', '#c0392b', '#f2b134', '#16a085', '#e2457a', '#2c2f36', '#f4f1ea', '#7d5ba6', '#e67e22', '#3b8fd0'];
const PELES = ['#ffffff', '#f3d6c2', '#e8bfa0', '#c99a78', '#a7764f', '#7a5236'];
const CORES_CABELO = ['#2a1d14', '#4a3222', '#121212', '#8a6038', '#c9a46a'];

// passada (m por ciclo do clipe) de cada clipe de locomocao: fase = distancia / passada
const PASSADA: Record<string, number> = {Walk_Loop: 1.45, Jog_Fwd_Loop: 2.6, Sprint_Loop: 3.9, Swim_Fwd_Loop: 1.2};

// estado de uma pessoa no tempo t (segundos do original). fuga: a partir de tFuga todos correm para longe de 'de'
export const estadoPessoa = (p: Pessoa3D, t: number, de: [number, number], tFuga: number): Estado => {
  const s = (k: number) => rnd(p.i * 13 + k);
  let x = p.x, z = p.z, ry = p.rot, y = p.y ?? 0, clipe = 'Idle_Loop', tempo = t + s(1) * 5;
  // antes da fuga
  if (p.pose === 'andando') {
    const v = 1.1 + s(2) * 0.5, dir = s(3) < 0.5 ? 1 : -1;
    const d = v * t; x = p.x + dir * d; ry = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    x = ((x + 130) % 260 + 260) % 260 - 130;   // a calcada e longa: quem sai de um lado entra do outro (fora do quadro)
    clipe = 'Walk_Loop'; tempo = d / PASSADA.Walk_Loop;
  } else if (p.pose === 'conversando') { clipe = 'Idle_Talking_Loop'; }
  else if (p.pose === 'sentado') { clipe = 'Sitting_Idle_Loop'; }
  else if (p.pose === 'deitado') { clipe = 'Death01'; tempo = 99; }        // ultima pose da queda = deitado de costas
  else if (p.pose === 'nadando') { clipe = 'Swim_Idle_Loop'; y = -1.15; }
  // fuga: reage com atraso, levanta (se estava sentado/deitado), acelera ate o sprint, sempre para longe de voce
  const t0 = tFuga + (p.reage ?? s(4) * 1.5);
  if (tFuga > 0 && t > t0 && p.pose !== 'nadando') {
    const levanta = p.pose === 'sentado' || p.pose === 'deitado' ? 0.9 : 0;
    const dx = x - de[0], dz = z - de[1], L = Math.hypot(dx, dz) || 1;
    // foge para longe e um pouco para o calcadao (+z), com desvio proprio
    let ux = dx / L, uz = dz / L + 0.35; const desv = (s(5) - 0.5) * 0.6;
    const c = Math.cos(desv), sn = Math.sin(desv); [ux, uz] = [ux * c - uz * sn, ux * sn + uz * c]; const n = Math.hypot(ux, uz); ux /= n; uz /= n;
    const tt = t - t0 - levanta;
    if (tt < 0) { clipe = p.pose === 'deitado' ? 'Death01' : 'Sitting_Exit'; tempo = p.pose === 'deitado' ? Math.max(0, 1.6 + tt * 1.8) : (t - t0); }
    else {
      const vMax = 5.2 + s(6) * 1.5, acel = 3.5;            // m/s, m/s^2
      const tA = vMax / acel, d = tt < tA ? 0.5 * acel * tt * tt : 0.5 * acel * tA * tA + vMax * (tt - tA);
      const v = Math.min(vMax, acel * tt);
      x += ux * d; z += uz * d; ry = Math.atan2(ux, uz); y = 0;
      clipe = v > 4.2 ? 'Sprint_Loop' : v > 2 ? 'Jog_Fwd_Loop' : 'Walk_Loop'; tempo = d / PASSADA[clipe];
    }
  }
  return {x, y, z, ry, clipe, tempo};
};

// cores por pessoa: roupa de banho (regioes escuras da textura), tom de pele, e camisa/calca desenhadas pela regiao do corpo
// na pose de bind (T-pose de 1,8 m: torso |x|<0,24 entre 0,98 e 1,47 m; manga curta ate |x|<0,5; pernas abaixo de 1,0 m)
type Roupa = {banho: THREE.Color; pele: THREE.Color; camisa: THREE.Color; calca: THREE.Color; modo: number; carvao: number};
const recolorir = (m: THREE.MeshStandardMaterial, r: Roupa) => {
  const n = m.clone() as THREE.MeshStandardMaterial;
  n.userData.u = {uRoupa: {value: r.banho}, uPele: {value: r.pele}, uCamisa: {value: r.camisa}, uCalca: {value: r.calca}, uModo: {value: r.modo}, uCarvao: {value: r.carvao}};
  n.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, n.userData.u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vBind;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvBind = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vBind;\nuniform vec3 uRoupa; uniform vec3 uPele; uniform vec3 uCamisa; uniform vec3 uCalca; uniform float uModo; uniform float uCarvao;')
      .replace('#include <map_fragment>', `#include <map_fragment>
  float mx = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b)), mn = min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b));
  float banho = (1.0 - smoothstep(0.08, 0.16, mx)) * (1.0 - smoothstep(0.05, 0.12, mx - mn));
  float lum = dot(diffuseColor.rgb, vec3(0.333));
  diffuseColor.rgb = mix(diffuseColor.rgb * uPele, uRoupa * (0.55 + 4.0 * mx), banho);
  float ax = abs(vBind.x), y = vBind.y;
  float camisa = step(0.5, uModo) * max(step(ax, 0.24) * step(0.98, y) * step(y, 1.47), step(0.2, ax) * step(ax, 0.5) * step(1.3, y) * step(y, 1.6));
  float calca = step(0.5, uModo) * step(ax, 0.3) * step(y, 1.0) * step(mix(0.1, 0.52, step(1.5, uModo)), y);
  vec3 tecido = vec3(0.7 + 0.6 * lum);
  diffuseColor.rgb = mix(diffuseColor.rgb, uCamisa * tecido, camisa);
  diffuseColor.rgb = mix(diffuseColor.rgb, uCalca * tecido, calca * (1.0 - camisa));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.045, 0.038, 0.032) * (0.6 + 0.8 * lum), uCarvao);`);
  };
  n.customProgramCacheKey = () => 'pessoa_roupa';
  return n;
};

type Montado = {raiz: THREE.Object3D; mixer: THREE.AnimationMixer; acoes: Record<string, THREE.AnimationAction>; atual?: string};

export const Multidao3D: React.FC<{lista: Pessoa3D[]; t: number; de: [number, number]; tFuga?: number; cam?: THREE.Vector3; raio?: number; escala?: number;
  estadoDe?: (p: Pessoa3D, k: number, t: number) => Estado3D}> =
  ({lista, t, de, tFuga = 0, cam, raio = 8, escala = 1, estadoDe}) => {
  const masc = useGLTF(staticFile('pessoas/masc.gltf')), fem = useGLTF(staticFile('pessoas/fem.gltf')), anim = useGLTF(staticFile('pessoas/anim.glb'));
  const cabelos = {
    hair_simpleparted: useGLTF(staticFile('pessoas/hair_simpleparted.gltf')), hair_buzzed: useGLTF(staticFile('pessoas/hair_buzzed.gltf')),
    hair_long: useGLTF(staticFile('pessoas/hair_long.gltf')), hair_buns: useGLTF(staticFile('pessoas/hair_buns.gltf')),
  } as Record<string, any>;
  const clipes = useMemo(() => Object.fromEntries(anim.animations.map((c) => [c.name, c])), [anim]);
  const montados = useMemo<Montado[]>(() => lista.map((p) => {
    const s = (k: number) => rnd(p.i * 7 + k);
    const fem_ = p.fem ?? s(1) < 0.5;
    const raiz = clonarComEsqueleto((fem_ ? fem : masc).scene) as THREE.Object3D;
    const naCalcada = (p.y ?? 0) > 0.1 || p.pose === 'andando';
    const vestido = !!p.camisa || (naCalcada && s(8) < 0.85) || (!naCalcada && p.pose !== 'nadando' && s(8) < 0.3);
    const r: Roupa = {banho: new THREE.Color(ROUPAS[Math.floor(s(2) * ROUPAS.length)]), pele: new THREE.Color(PELES[Math.floor(s(3) * PELES.length)]),
      camisa: new THREE.Color(p.camisa ?? ROUPAS[Math.floor(s(9) * ROUPAS.length)]), calca: new THREE.Color(p.calca ?? ['#6b4a2f', '#2c2f36', '#1f3f8f', '#d9cfb8'][Math.floor(s(10) * 4)]),
      modo: vestido ? (p.curta ?? s(11) < 0.5 ? 2 : 1) : 0, carvao: p.carbonizado ? 1 : 0};
    let esqueleto: THREE.Skeleton | null = null;
    raiz.traverse((o: any) => {
      if (o.isSkinnedMesh) { esqueleto = esqueleto ?? o.skeleton; o.castShadow = true; o.frustumCulled = false;
        if (/Superhero/.test(o.material?.name ?? '')) o.material = recolorir(o.material, r);
        if (/Hair/.test(o.material?.name ?? '')) { o.material = o.material.clone(); o.material.color = p.carbonizado ? new THREE.Color('#0a0908') : new THREE.Color(CORES_CABELO[Math.floor(s(5) * CORES_CABELO.length)]); } }
    });
    // cabelo: o SkinnedMesh do cabelo passa a usar os ossos do corpo (mesmos 65 nomes)
    const nomeCab = (fem_ ? CABELOS_F : CABELOS_M)[Math.floor(s(4) * 2)];
    const cab = clonarComEsqueleto(cabelos[nomeCab].scene) as THREE.Object3D;
    const ossos: Record<string, THREE.Bone> = {}; (esqueleto as THREE.Skeleton | null)?.bones.forEach((b) => { ossos[b.name] = b; });
    const corCab = new THREE.Color(CORES_CABELO[Math.floor(s(5) * CORES_CABELO.length)]);
    cab.traverse((o: any) => {
      if (o.isSkinnedMesh) {
        const sk = new THREE.Skeleton(o.skeleton.bones.map((b: THREE.Bone) => ossos[b.name] ?? b), o.skeleton.boneInverses);
        const m = o.clone(); m.bind(sk, o.bindMatrix); m.frustumCulled = false; m.castShadow = true;
        m.material = o.material.clone(); m.material.color = p.carbonizado ? new THREE.Color('#0a0908') : corCab; raiz.add(m);
      }
    });
    raiz.scale.setScalar(escala * (0.92 + s(6) * 0.14));
    const mixer = new THREE.AnimationMixer(raiz);
    return {raiz, mixer, acoes: {}};
  }), [lista, masc, fem, cabelos.hair_simpleparted, cabelos.hair_buzzed, cabelos.hair_long, cabelos.hair_buns, escala]);

  // pose deste quadro: um clipe por pessoa, tempo absoluto (sem acumular nada entre quadros)
  montados.forEach((m, k) => {
    const e = estadoDe ? estadoDe(lista[k], k, t) : estadoPessoa(lista[k], t, de, tFuga);
    const perto = cam && Math.hypot(e.x - cam.x, e.z - cam.z) < raio;
    m.raiz.visible = !perto && e.visivel !== false;
    if (!m.raiz.visible) return;
    m.raiz.position.set(e.x, e.y, e.z); m.raiz.rotation.set(0, e.ry, 0);
    const clip = clipes[e.clipe] ?? clipes.Idle_Loop;
    if (m.atual !== e.clipe) { m.mixer.stopAllAction(); m.acoes[e.clipe] = m.acoes[e.clipe] ?? m.mixer.clipAction(clip); m.acoes[e.clipe].play(); m.atual = e.clipe; }
    const a = m.acoes[e.clipe];
    const dur = clip.duration;
    // locomocao: tempo em ciclos (distancia/passada); clipes de uma vez: segundos com trava no fim; demais lacos: segundos em volta
    a.time = e.clipe in PASSADA ? (((e.tempo % 1) + 1) % 1) * dur : e.clipe === 'Death01' || e.clipe === 'Sitting_Exit' ? Math.min(dur - 1e-3, Math.max(0, e.tempo < 0 ? dur + e.tempo : e.tempo)) : ((e.tempo % dur) + dur) % dur;
    m.mixer.update(0);
  });
  return <group>{montados.map((m, k) => <primitive key={k} object={m.raiz} />)}</group>;
};

// ---------- figurantes do mapa de acoes: trajeto por pontos, clipe pela velocidade, passo casado com a distancia ----------
export type FiguranteMundo = {pts: [number, number, number][]; levanta?: number; modo?: string; some?: number};
export const estadoFigurante = (f: FiguranteMundo, t: number): Estado3D => {
  const P = f.pts, t0 = P[0][0];
  if (f.modo === 'carbonizado' || f.modo === 'carbonizado_deitado')
    return {x: P[0][1], y: 0, z: P[0][2], ry: 0.6, clipe: f.modo === 'carbonizado' ? 'Sitting_Idle_Loop' : 'Death01', tempo: f.modo === 'carbonizado' ? 0.4 : 99, visivel: t >= t0};
  if (f.some !== undefined && t > f.some) return {x: 0, y: 0, z: 0, ry: 0, clipe: 'Idle_Loop', tempo: 0, visivel: false};
  if (t < t0 && f.levanta === undefined) return {x: 0, y: 0, z: 0, ry: 0, clipe: 'Idle_Loop', tempo: 0, visivel: false};
  if (f.modo === 'parado' || P.length === 1) return {x: P[0][1], y: 0, z: P[0][2], ry: 0, clipe: 'Idle_Loop', tempo: t, visivel: t >= t0};
  // deitado ate 'levanta'; levanta em 0,7 s (a queda tocada ao contrario); depois segue o trajeto
  if (f.levanta !== undefined && t < f.levanta + 0.7) {
    const ry0 = Math.atan2(P[P.length - 1][1] - P[0][1], P[P.length - 1][2] - P[0][2]);
    return {x: P[0][1], y: 0, z: P[0][2], ry: ry0, clipe: 'Death01', tempo: t < f.levanta ? 99 : -(t - f.levanta) / 0.7 * 2.0, visivel: true};
  }
  // distancia percorrida ao longo dos pontos (continua na mesma direcao por 6 s depois do ultimo ponto)
  let d = 0, x = P[0][1], z = P[0][2], ry = 0, v = 0;
  for (let k = 1; k < P.length; k++) {
    const [ta, xa, za] = P[k - 1], [tb, xb, zb] = P[k], L = Math.hypot(xb - xa, zb - za), dt = Math.max(1e-3, tb - ta);
    const fim = k === P.length - 1;
    if (t <= tb || fim) {
      const u = Math.min(fim ? (t - ta) / dt : 1, (t - ta) / dt);
      if (fim && t > tb + 6) return {x: 0, y: 0, z: 0, ry: 0, clipe: 'Idle_Loop', tempo: 0, visivel: false};
      const uu = Math.max(0, u);
      x = xa + (xb - xa) * uu; z = za + (zb - za) * uu; d += L * uu; ry = Math.atan2(xb - xa, zb - za); v = L / dt; break;
    }
    d += L;
  }
  const clipe = v > 3.6 ? 'Sprint_Loop' : v > 1.9 ? 'Jog_Fwd_Loop' : 'Walk_Loop';
  return {x, y: 0, z, ry, clipe, tempo: d / PASSADA[clipe], visivel: true};
};
