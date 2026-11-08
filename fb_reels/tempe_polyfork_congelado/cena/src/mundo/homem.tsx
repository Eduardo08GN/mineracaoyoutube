// O homem: Hiker do Polyfork (.mjs com knobs: adulto, cansado, sem mochila, jaqueta #E63B2E), esqueleto Mixamo em T-pose, posado por codigo.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {createAsset} from '../pf/hiker-3d1a41.mjs';
import {preparar} from './pf';
import {V3} from './util';

export type Modo = 'sentado' | 'abraco' | 'galho';
export const VERMELHO = '#E63B2E';

const pose = (o: THREE.Object3D, modo: Modo) => {
  const r = (n: string, x = 0, y = 0, z = 0) => { const b = o.getObjectByName(n); if (b) b.rotation.set(x, y, z); };
  // convencoes (T-pose, +Z a frente): UpLeg x<0 levanta a perna a frente; Leg x>0 dobra o joelho; Arm z<0 (esq) / z>0 (dir) baixa o braco;
  // Arm y<0 (esq) / y>0 (dir) leva o braco a frente; Head x<0 olha para cima
  if (modo === 'sentado') {
    r('Spine1', -0.08); r('Head', -0.6, 0.12, 0);
    r('LeftUpLeg', -1.5, 0, 0.1); r('RightUpLeg', -1.5, 0, -0.1); r('LeftLeg', 1.5); r('RightLeg', 1.5); r('LeftFoot', -0.1); r('RightFoot', -0.1);
    r('LeftArm', 0.25, -0.15, -1.2); r('RightArm', 0.25, 0.15, 1.2); r('LeftForeArm', 0, -0.9, 0); r('RightForeArm', 0, 0.9, 0);
  } else if (modo === 'abraco') {
    r('Spine1', -0.2); r('Head', 0.95, 0.05, 0);
    r('LeftUpLeg', -0.7, 0, 0.08); r('RightUpLeg', -0.3, 0, -0.08); r('LeftLeg', 0.9); r('RightLeg', 0.5); r('LeftFoot', 0.3); r('RightFoot', 0.2);
    // pendurado: bracos erguidos acima da cabeca, agarrados na forquilha/tronco (Arm z>0 esq / z<0 dir sobe acima da horizontal)
    r('LeftArm', 0, -1.0, 1.15); r('RightArm', 0, 1.0, -1.15); r('LeftForeArm', 0, -0.7, 0); r('RightForeArm', 0, 0.7, 0);
  } else {
    r('Spine1', 0.1); r('Head', 0.18, 0.55, 0);
    r('LeftUpLeg', -1.45, 0, 0.12); r('RightUpLeg', -1.45, 0, -0.12); r('LeftLeg', 1.35); r('RightLeg', 1.35); r('LeftFoot', 0.1); r('RightFoot', 0.1);
    r('LeftArm', 0.1, -0.1, -1.4); r('RightArm', 0.1, 0.1, 1.4); r('LeftForeArm', 0, -0.35, 0); r('RightForeArm', 0, 0.35, 0);
  }
};

export const Homem: React.FC<{modo: Modo; pos: V3; rotY: number; quadrilY?: number}> = ({modo, pos, rotY, quadrilY}) => {
  const {obj, shift} = useMemo(() => {
    const o = createAsset({figure: 'masculine', age: 'adult', expression: 'weary', pack: 0, hair: '#14110e', beard: '#14110e', stache: '#14110e', coat: VERMELHO, coatTrim: '#d23527', cuff: VERMELHO,
      denim: '#2e3b47', waistband: '#232c35', cap: '#2b2d31', capTrim: '#232528', hatBand: '#232528', glove: '#6e5238', gloveCuff: '#5f462f'}) as THREE.Group;
    o.traverse((x: any) => { if (/^attach-(back|righthand|lefthand)/.test(x.name) || /pack|pole/i.test(x.name)) x.visible = false; });
    preparar(o, 0.8);
    o.updateMatrixWorld(true);
    const hips = o.getObjectByName('Hips'); const v = new THREE.Vector3(); hips?.getWorldPosition(v);
    const restY = v.y;
    pose(o, modo);
    return {obj: o, shift: quadrilY !== undefined ? quadrilY - restY : 0};
  }, [modo, quadrilY]);
  return <group position={[pos[0], pos[1] + shift, pos[2]]} rotation={[0, rotY, 0]}><primitive object={obj} /></group>;
};
