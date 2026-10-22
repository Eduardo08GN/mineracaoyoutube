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
};
type Estado = {x: number; y: number; z: number; ry: number; clipe: string; tempo: number};

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

// troca a cor da roupa de banho (regioes escuras e pouco saturadas da textura) e o tom da pele, por pessoa
const recolorir = (m: THREE.MeshStandardMaterial, roupa: THREE.Color, pele: THREE.Color) => {
  const n = m.clone() as THREE.MeshStandardMaterial;
  n.userData.u = {uRoupa: {value: roupa}, uPele: {value: pele}};
  n.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, n.userData.u);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uRoupa; uniform vec3 uPele;')
      .replace('#include <map_fragment>', `#include <map_fragment>
  float mx = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b)), mn = min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b));
  float roupa = (1.0 - smoothstep(0.08, 0.16, mx)) * (1.0 - smoothstep(0.05, 0.12, mx - mn));
  diffuseColor.rgb = mix(diffuseColor.rgb * uPele, uRoupa * (0.55 + 4.0 * mx), roupa);`);
  };
  n.customProgramCacheKey = () => 'pessoa_recolor';
  return n;
};

type Montado = {raiz: THREE.Object3D; mixer: THREE.AnimationMixer; acoes: Record<string, THREE.AnimationAction>; atual?: string};

export const Multidao3D: React.FC<{lista: Pessoa3D[]; t: number; de: [number, number]; tFuga?: number; cam?: THREE.Vector3; raio?: number; escala?: number}> =
  ({lista, t, de, tFuga = 0, cam, raio = 8, escala = 1}) => {
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
    const roupa = new THREE.Color(ROUPAS[Math.floor(s(2) * ROUPAS.length)]), pele = new THREE.Color(PELES[Math.floor(s(3) * PELES.length)]);
    let esqueleto: THREE.Skeleton | null = null;
    raiz.traverse((o: any) => {
      if (o.isSkinnedMesh) { esqueleto = esqueleto ?? o.skeleton; o.castShadow = true; o.frustumCulled = false;
        if (/Superhero/.test(o.material?.name ?? '')) o.material = recolorir(o.material, roupa, pele);
        if (/Hair/.test(o.material?.name ?? '')) { o.material = o.material.clone(); o.material.color = new THREE.Color(CORES_CABELO[Math.floor(s(5) * CORES_CABELO.length)]); } }
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
        m.material = o.material.clone(); m.material.color = corCab; raiz.add(m);
      }
    });
    raiz.scale.setScalar(escala * (0.92 + s(6) * 0.14));
    const mixer = new THREE.AnimationMixer(raiz);
    return {raiz, mixer, acoes: {}};
  }), [lista, masc, fem, cabelos.hair_simpleparted, cabelos.hair_buzzed, cabelos.hair_long, cabelos.hair_buns, escala]);

  // pose deste quadro: um clipe por pessoa, tempo absoluto (sem acumular nada entre quadros)
  montados.forEach((m, k) => {
    const e = estadoPessoa(lista[k], t, de, tFuga);
    const perto = cam && Math.hypot(e.x - cam.x, e.z - cam.z) < raio;
    m.raiz.visible = !perto;
    m.raiz.position.set(e.x, e.y, e.z); m.raiz.rotation.set(0, e.ry, 0);
    const clip = clipes[e.clipe] ?? clipes.Idle_Loop;
    if (m.atual !== e.clipe) { m.mixer.stopAllAction(); m.acoes[e.clipe] = m.acoes[e.clipe] ?? m.mixer.clipAction(clip); m.acoes[e.clipe].play(); m.atual = e.clipe; }
    const a = m.acoes[e.clipe];
    const dur = clip.duration;
    // locomocao: tempo em ciclos (distancia/passada); clipes de uma vez: segundos com trava no fim; demais lacos: segundos em volta
    a.time = e.clipe in PASSADA ? (((e.tempo % 1) + 1) % 1) * dur : e.clipe === 'Death01' || e.clipe === 'Sitting_Exit' ? Math.min(dur - 1e-3, Math.max(0, e.tempo)) : ((e.tempo % dur) + dur) % dur;
    m.mixer.update(0);
  });
  return <group>{montados.map((m, k) => <primitive key={k} object={m.raiz} />)}</group>;
};
