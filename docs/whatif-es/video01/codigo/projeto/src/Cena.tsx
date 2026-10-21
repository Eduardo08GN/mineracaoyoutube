// Escolhe o mundo do capitulo, posiciona a camera e traduz a fisica (duracao do dia) em parametros de cena.
// Recebe t e capitulo de fora: na fusao entre capitulos o Video renderiza dois mundos ao mesmo tempo.
import React from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {Easing, interpolate} from 'remotion';
import {noise3D} from '@remotion/noise';
import {CAPS, Cap, Chave} from './roteiro';
import {diaMin, fatorPeso, gEf} from './fisica';
import {Costa} from './mundo/Costa';
import {Oregon} from './mundo/Oregon';
import {Espaco} from './mundo/Espaco';
import {luzDe, smooth} from './mundo/comum';
import {Look, Perfil} from './look/Look';
import LUTS from './look/luts.json';
import CICLO_ORIG from './ciclo_original.json';

const ease = Easing.inOut(Easing.cubic);
export const camDe = (cap: Cap, t: number) => {
  const u = Math.min(1, Math.max(0, (t - cap.s) / (cap.e - cap.s)));
  const K = cap.cam, us = K.map((k) => k[0]);
  const lerp = (sel: (k: Chave) => number) => interpolate(u, us, K.map(sel), {easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return {
    p: new THREE.Vector3(lerp((k) => k[1][0]), lerp((k) => k[1][1]), lerp((k) => k[1][2])),
    a: new THREE.Vector3(lerp((k) => k[2][0]), lerp((k) => k[2][1]), lerp((k) => k[2][2])),
    roll: lerp((k) => k[3] ?? 0), fov: lerp((k) => k[4] ?? 55),
  };
};

// ciclo dia/noite de 2:33 a 4:53 guiado pela luminosidade do proprio original, medida a 10 fps (ritmo de nascer/por do sol
// identico ao dele; uma senoide fixa virava estroboscopio ou saia defasada). Santa Monica fica de dia, como no original.
const INICIO_CICLO = 153;
const CICLO = CICLO_ORIG as number[];
export const elevSol = (t: number, capId: string) => {
  if (t <= INICIO_CICLO || capId === 'santamonica' || capId === 'paredao') return 1.15;
  // a aerea da cidade e de dia no original (o mar escuro visto do alto enganava a leitura de luminancia)
  if (capId === 'cidade') return 0.75;
  const x = Math.min(CICLO.length - 1.001, Math.max(0, (t - INICIO_CICLO) * 10)), i = Math.floor(x), f = x - i;
  const d = CICLO[i] * (1 - f) + CICLO[i + 1] * f;
  return Math.asin(Math.max(-1, Math.min(1, d * 2 - 1))) * 0.55;
};
// giro visivel da Terra
export const giroTerra = (t: number) => {
  let g = 0;
  for (let x = 0; x < t; x += 0.25) g += Math.min(3.2, 0.06 * 1440 / diaMin(x)) * Math.min(0.25, t - x);
  return g;
};
// tremor deterministico (ruido por tempo, com semente)
const tremer = (t: number, a: number) => new THREE.Vector3(noise3D('tx', t * 9, 0, 0), noise3D('ty', 0, t * 9, 0) * 0.7, noise3D('tz', 0, 0, t * 9) * 0.8).multiplyScalar(a);

const L = LUTS as Record<string, number[] | undefined>;
const PERFIS: Record<string, Perfil> = {
  costa: {ao: true, bloom: 0.5, saturacao: 0.0, lut: L.costa ?? null, vinheta: 0.42},
  oregon: {ao: true, bloom: 0.35, saturacao: -0.05, lut: L.oregon ?? null, vinheta: 0.42},
  espaco: {ao: false, bloom: 0.45, limiar: 0.9, saturacao: -0.1, lut: L.espaco ?? null, vinheta: 0.5},
};

export const Cena: React.FC<{t: number; cap: Cap}> = ({t, cap}) => {
  const {camera} = useThree();
  const c = camDe(cap, t);
  const tl = t - cap.s, u = tl / (cap.e - cap.s);
  const T = diaMin(t);

  let shake = 0;
  if (cap.id === 'terremoto') shake = 0.32 * smooth(0.05, 0.2, u) * (1 - smooth(0.8, 1, u));
  if (cap.id === 'paredao') shake = 0.22 * smooth(0.45, 0.9, u);
  const p = c.p.clone().add(tremer(t, shake));
  camera.position.copy(p);
  camera.up.set(Math.sin(c.roll), Math.cos(c.roll), 0);
  camera.lookAt(c.a);
  const cp = camera as THREE.PerspectiveCamera;
  cp.fov = c.fov;
  if (cap.mundo === 'espaco') { cp.near = 0.01; cp.far = 1000; } else { cp.near = Math.max(0.5, p.y / 40); cp.far = 9000; }
  cp.updateProjectionMatrix(); camera.updateMatrixWorld();

  let cena: React.ReactNode = null;
  if (cap.mundo === 'espaco') {
    const sol = new THREE.Vector3(1, 0.25, 0.6).normalize();
    const giro = giroTerra(t);
    // achatamento a partir de 5:18, escombros saindo do equador a partir de 5:24 e virando um disco de ~4 raios
    const anelK = smooth(323, 352, t);
    const ids: Record<string, any> = {
      intro: {anel: 1, achata: 0.32, migr: 1},
      espaco1: {migr: smooth(0.05, 0.9, u)},
      achata: {migr: 1, achata: smooth(318, 347, t) * 0.32, anel: anelK, ar: smooth(0.2, 0.8, u)},
      anel: {migr: 1, achata: 0.32, anel: anelK, ar: 1 - u},
      crosta: {migr: 1, achata: 0.32, anel: 1, rasgo: smooth(376, 378, t), lava: smooth(376.2, 377, t)},
      lua: {migr: 1, achata: 0.32, anel: 1, lava: 1, lua: 1},
    };
    cena = <Espaco t={t} giro={giro} sol={sol} camPos={p} alvo={c.a} {...ids[cap.id]} />;
  } else if (cap.mundo === 'oregon') {
    const luz = luzDe(0.75, 2.2);
    const costa = cap.id === 'oregon' ? interpolate(u, [0, 0.15, 1], [-42, -42, -260], {easing: ease}) : -320;
    const tremor = cap.id === 'terremoto' ? smooth(0.06, 0.95, u) : 0;
    cena = <Oregon t={t} luz={luz} foco={c.a.clone().setY(0)} costa={costa} tremor={tremor} tq={tl} />;
  } else if (cap.mundo === 'costa') {
    const luz = luzDe(elevSol(t, cap.id), 0.9);
    const fp = fatorPeso(T, cap.lat);
    const props: any = {t, luz, foco: c.a.clone().setY(0), g: gEf(T), cam: p, praca: cap.id !== 'santamonica', semFonte: cap.id === 'santamonica'};
    if (cap.id === 'praia') {
      // o mar sobe e engole a praia entre 0:40 e 0:56
      const k = smooth(38, 56, t);
      props.costa = -14 + k * 22; props.nivel = 0.04 + k * 2.5; props.inunda = k; props.espuma = 1 + k * 2.5; props.agit = k * 0.5;
    }
    if (cap.id === 'cidade') props.cidade = true;
    if (['leve', 'fonte', 'sempeso', 'paredao', 'cidade'].includes(cap.id)) { props.costa = 2; props.nivel = 0.74; props.inunda = 1; }
    if (cap.id === 'sempeso') props.flutua = smooth(292, 300, t) * 0.4;
    if (cap.id === 'paredao') { props.flutua = 0.4 + smooth(296, 310, t) * 0.6; props.paredao = smooth(293, 316, t); }
    if (cap.id === 'santamonica') { props.pier = true; props.desliza = smooth(0.62, 1, u); }
    if (cap.id === 'leve' || cap.id === 'fonte') props.pulo = Math.max(0.08, fp);
    if (cap.id === 'fonte') props.jatos = true;
    if (cap.id === 'sempeso' || cap.id === 'paredao') props.jatoAlto = true;
    cena = <Costa {...props} />;
  } else {
    return <color attach="background" args={['#0b0d12']} />;
  }
  return <>{cena}<Look perfil={PERFIS[cap.mundo]} /></>;
};
export {CAPS};
