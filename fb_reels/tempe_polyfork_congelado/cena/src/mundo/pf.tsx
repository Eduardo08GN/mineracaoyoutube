// Carregador dos assets Polyfork (GLB do CDN, baixados para public/polyfork/). Clona (inclusive esqueleto), liga sombras e flat shading.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useGLTF} from '@react-three/drei';
import {staticFile} from 'remotion';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {V3} from './util';

export const preparar = (o: THREE.Object3D, rough = 0.88) => {
  o.traverse((m: any) => {
    if (!m.isMesh) return;
    m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
    const ms = Array.isArray(m.material) ? m.material : [m.material];
    ms.forEach((x: any) => { if (x.name !== 'glass') { x.flatShading = true; x.roughness = rough; x.metalness = 0; } x.needsUpdate = true; });
  });
  return o;
};
const esc = (s: number | V3 | undefined): V3 => (s === undefined ? [1, 1, 1] : typeof s === 'number' ? [s, s, s] : s);
export const Objeto: React.FC<{obj: THREE.Object3D; pos?: V3; rot?: V3 | number; s?: number | V3}> = ({obj, pos = [0, 0, 0], rot = 0, s}) => (
  <group position={pos} rotation={typeof rot === 'number' ? [0, rot, 0] : rot} scale={esc(s)}><primitive object={obj} /></group>
);
export const Pf: React.FC<{id: string; pos?: V3; rot?: V3 | number; s?: number | V3; tint?: string}> = ({id, pos, rot, s, tint}) => {
  const g = useGLTF(staticFile(`polyfork/${id}.glb`), false);
  const obj = useMemo(() => {
    const o = preparar(clone(g.scene));
    if (tint) o.traverse((m: any) => { if (m.isMesh) { m.material = m.material.clone(); m.material.color = new THREE.Color(tint); } });
    return o;
  }, [g, tint]);
  return <Objeto obj={obj} pos={pos} rot={rot} s={s} />;
};
