// Pecas do mundo por estagio: tudo Polyfork (kits roadside-americana, frontier-town, campground-lake + 2 de apoio), posicionadas por codigo.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {createAsset as criaArvore} from '../pf/lakeside-swing-tree-02c084.mjs';
import {createAsset as criaBarraca} from '../pf/canvas-ridge-tent-f0df0d.mjs';
import {Objeto, Pf, preparar} from './pf';
import {TS, TX, TZ, AGUA_B, AGUA_C} from './estagios';
import {hChao} from './terra';
import {rnd, V3} from './util';

const y0 = (x: number, z: number) => hChao(x, z);

// o alamo: Lakeside Swing Tree (.mjs, colorway grey-alder = casca cinza + copa oliva, sem inclinacao)
export const Alamo: React.FC<{ver: 'A' | 'B' | 'C'}> = ({ver}) => {
  const obj = useMemo(() => preparar(criaArvore({colorway: 'grey-alder', season: 'summer', wear: ver === 'C' ? 0.5 : 0.25, lean: 0})), [ver]);
  return <Objeto obj={obj} pos={[TX, y0(TX, TZ), TZ]} s={TS} />;
};
export const Barraca: React.FC<{pos: V3; rot: V3 | number; s?: number}> = ({pos, rot, s = 1.25}) => {
  const obj = useMemo(() => preparar(criaBarraca({colorway: 'khaki', wear: 0.55, season: 'summer'})), []);
  return <Objeto obj={obj} pos={pos} rot={rot} s={s} />;
};

export const Lanterna: React.FC<{pos: V3; luz?: number; s?: number; dist?: number}> = ({pos, luz = 28, s = 2.2, dist = 14}) => (
  <group position={pos}>
    <Pf id="camping-lantern-21d14b" s={s} />
    <mesh position={[0, 0.2 * s, 0]}><sphereGeometry args={[0.05 * s, 12, 8]} /><meshBasicMaterial color={new THREE.Color(7, 4.2, 1.4)} toneMapped={false} /></mesh>
    <pointLight position={[0, 0.2 * s, 0]} color="#ffb25c" intensity={luz} distance={dist} decay={2} />
  </group>
);

// vegetacao e rocha do deserto (roadside-americana + frontier-town), no mesmo lugar nos tres estagios
const SAGUAROS: [number, number, number][] = [[5.5, -6, 0.9], [-8, -9, 1.1], [11, -14, 1.2], [-15, -22, 1.4], [20, -30, 1.3], [-26, -38, 1.5], [-6.5, 8, 0.8]];
const CREOSOTE: [number, number][] = [[3, -1], [-5.5, -2.5], [6, 1.5], [-7, 3], [8, -3], [-3, -7.5], [13, -6]];
const SAGE: [number, number][] = [[-2, -5], [4, -7], [-9, 1], [1.5, -9], [7.5, 5], [-4.5, 6.5], [-12, -4]];
const TUMBLE: [number, number][] = [[3.3, 1.0], [-4.5, 4], [6.5, 3.5], [9, -8]];
const ROCHAS: [number, number, number][] = [[-45, -70, 6], [38, -85, 7], [-85, -110, 8], [70, -120, 8], [5, -140, 9], [-12, -12, 1.5], [14, -10, 1.8], [-22, -20, 2.5], [28, -24, 2.8], [-34, -34, 3.2]];
const MESAS: [number, number, number, number][] = [[-120, -170, 0.3, 3], [40, -210, -0.2, 3.6], [170, -90, -1.2, 3], [-190, -60, 1.2, 3.2], [-60, -260, 0.1, 4]];

export const Deserto: React.FC<{submerso: number; tint?: string; evita?: V3}> = ({tint, evita}) => {
  const ok = (x: number, z: number) => !evita || Math.hypot(x - evita[0], z - evita[2]) > 7;
  return (
  <group>
    {SAGUAROS.filter(([x, z]) => ok(x, z)).map(([x, z, s], i) => <Pf key={'sg' + i} id="saguaro-cactus-8b588d" pos={[x, y0(x, z), z]} rot={rnd(i + 1) * 6.28} s={s} />)}
    {CREOSOTE.filter(([x, z]) => ok(x, z)).map(([x, z], i) => <Pf key={'cr' + i} id="creosote-bush-5b17d5" pos={[x, y0(x, z), z]} rot={rnd(i + 11) * 6.28} s={1.1 + rnd(i) * 0.5} />)}
    {SAGE.filter(([x, z]) => ok(x, z)).map(([x, z], i) => <Pf key={'sa' + i} id="sagebrush-700b03" pos={[x, y0(x, z), z]} rot={rnd(i + 21) * 6.28} s={1.2 + rnd(i + 2) * 0.6} />)}
    {TUMBLE.filter(([x, z]) => ok(x, z)).map(([x, z], i) => <Pf key={'tw' + i} id="tumbleweed-077954" pos={[x, y0(x, z) + 0.02, z]} rot={rnd(i + 31) * 6.28} s={1.3} />)}
    {ROCHAS.map(([x, z, s], i) => <Pf tint={tint} key={'ro' + i} id="sandstone-outcrop-75800b" pos={[x, y0(x, z) - 0.05, z]} rot={rnd(i + 41) * 6.28} s={s} />)}
    {Array.from({length: 38}, (_, i) => {
      const a = rnd(i * 2 + 100) * 6.283, r = 2.5 + rnd(i * 2 + 101) * 9, x = 0.5 + Math.cos(a) * r, z = -1 + Math.sin(a) * r * 0.9;
      return <Pf key={'pb' + i} id="lake-pebbles-6c0359" pos={[x, y0(x, z) + 0.01, z]} rot={rnd(i + 120) * 6.28} s={0.6 + rnd(i + 130) * 0.6} />;
    })}
    {MESAS.map(([x, z, r, s], i) => <Pf tint={tint} key={'ms' + i} id="mesa-backdrop-cbadea" pos={[x, -2, z]} rot={r} s={s} />)}
  </group>
  );
};

// arvores vizinhas: em pe (A, B) ou caidas na agua (C)
const VIZ: [number, number, number][] = [[-17, -12, 1.2], [14, -16, 1.4], [-28, -6, 1.1], [30, -5, 1.3], [-9, -26, 1.5]];
export const Vizinhas: React.FC<{caidas: boolean}> = ({caidas}) => (
  <group>
    {VIZ.map(([x, z, s], i) => caidas
      ? <Pf key={i} id="broad-canopy-shade-tree-e7c4a2" pos={[x, AGUA_C + 0.15, z]} rot={[0.1 * (i - 2), i * 1.3, (i % 2 ? 1 : -1) * (1.38 + 0.05 * i)]} s={s} />
      : <Pf key={i} id="broad-canopy-shade-tree-e7c4a2" pos={[x, y0(x, z), z]} rot={rnd(i + 5) * 6.28} s={s} />)}
    <Pf id="dead-cottonwood-edbde8" pos={caidas ? [7, AGUA_C - 0.4, -10] : [9, y0(9, -5), -5]} rot={caidas ? [0.2, 0.5, 0.55] : 0.8} s={1.0} />
  </group>
);

// acampamento: intacto (A), a deriva (B), levado (C: so destrocos distantes)
export const Acampamento: React.FC<{ver: 'A' | 'B' | 'C'}> = ({ver}) => {
  if (ver === 'A') return (
    <group>
      <Barraca pos={[-3.3, y0(-3.3, -2.2), -2.2]} rot={0.45} />
      <Pf id="sleeping-bag-730d7d" pos={[-1.7, 0.02, -0.7]} rot={1.3} s={1.25} />
      <Lanterna pos={[-0.05, 0, -0.3]} />
      <Pf id="camp-cooler-8ba941" pos={[0.9, 0, 0.1]} rot={0.5} s={1.0} />
      <Pf id="camp-cooler-8ba941" pos={[-0.9, 0, -1.9]} rot={-0.4} s={1.0} />
    </group>
  );
  const L = ver === 'B' ? AGUA_B : AGUA_C;
  if (ver === 'B') return (
    <group>
      <Barraca pos={[-6.2, L - 0.2, -0.4]} rot={[0.2, -0.6, 0.25]} s={1.9} />
      <Pf id="sleeping-bag-730d7d" pos={[-3.0, L - 0.05, 0.6]} rot={[0.1, 0.4, 0.15]} s={1.25} />
      <Lanterna pos={[-4.9, L - 0.12, -1.5]} luz={16} dist={6} />
      <Pf id="camp-cooler-8ba941" pos={[3.8, L - 0.1, -4.0]} rot={[0.1, 1.0, 0.2]} s={1.0} />
      <Pf id="driftwood-log-90340b" pos={[-5.5, L - 0.1, -1.0]} rot={[0.1, 0.2, 0.1]} s={1.9} />
      <Pf id="fallen-log-1685fb" pos={[-2.6, L - 0.1, -4.2]} rot={[0, 0.1, 0.15]} s={1.6} />
      <Pf id="driftwood-log-90340b" pos={[-3.6, L - 0.1, -2.5]} rot={[0, 0.5, 0.1]} s={1.6} />
      <Pf id="fallen-log-1685fb" pos={[0.8, L - 0.1, -6.2]} rot={[0, -0.8, 0.1]} s={1.5} />
    </group>
  );
  return (
    <group>
      <Barraca pos={[-14, L - 0.5, -14]} rot={[0.5, 1.3, 0.9]} />
      <Pf id="camp-cooler-8ba941" pos={[2.5, L - 0.1, -1.5]} rot={[0.1, 1.0, 0.2]} s={1.0} />
      <Pf id="driftwood-log-90340b" pos={[-6, L - 0.1, 1.5]} rot={[0, 0.5, 0.1]} s={1.8} />
      <Pf id="fallen-log-1685fb" pos={[3.5, L - 0.1, -6]} rot={[0, -0.8, 0.1]} s={1.8} />
      <Pf id="driftwood-log-90340b" pos={[1.2, L - 0.1, 3.5]} rot={[0, 1.9, 0.1]} s={1.5} />
      <Pf id="driftwood-log-90340b" pos={[-9, L - 0.1, -5]} rot={[0, 0.2, 0.1]} s={2.2} />
      <Pf id="fallen-log-1685fb" pos={[-4.5, L - 0.1, 3]} rot={[0, 0.1, 0.1]} s={2.0} />
      <Pf id="driftwood-log-90340b" pos={[5, L - 0.1, 1]} rot={[0, 0.3, 0.1]} s={2.2} />
      <Pf id="fallen-log-1685fb" pos={[-12, L - 0.1, -2]} rot={[0, 0.2, 0.1]} s={2.4} />
    </group>
  );
};
