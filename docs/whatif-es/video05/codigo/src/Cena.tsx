// Cena 3D: camera POV do trilho + o mundo de cada trecho. Cada mundo e um modulo proprio em mundo/ (dono: um agente),
// com contrato fixo: componente que recebe t (segundo do ORIGINAL) e funcao perfil(t) para o look.
import React from 'react';
import * as THREE from 'three';
import {useFrame, useThree} from '@react-three/fiber';
import {Look, Perfil} from './look/Look';
import {Cap, poseCamera} from './roteiro';
import {CeuTempo, luzEm} from './mundo/ceu';
import {Rua, perfilRua} from './mundo/rua';
import {Cidade} from './mundo/cidade';
import {Terra, perfilTerra} from './mundo/terra';
import {Cosmos, perfilCosmos} from './mundo/cosmos';
import {Fim, perfilFim} from './mundo/fim';
import {Corpo} from './mundo/corpo';
import {Take, perfilTake} from './mundo/take';

const CameraPOV: React.FC<{t: number}> = ({t}) => {
  const {camera} = useThree();
  useFrame(() => {
    const c = poseCamera(t);
    camera.position.copy(c.pos); camera.quaternion.copy(c.quat);
    const cam = camera as THREE.PerspectiveCamera;
    if (cam.fov !== 55) { cam.fov = 55; cam.updateProjectionMatrix(); }
    if (cam.far !== 2e6) { cam.near = 0.1; cam.far = 2e6; cam.updateProjectionMatrix(); }
  }, -1);
  return null;
};

export const Cena: React.FC<{t: number; cap: Cap; u?: number}> = ({t, cap, u = 0}) => {
  if (cap.mundo === 'take') return <><Take u={u} /><Look perfil={perfilTake(u)} /></>;
  const ceu = t >= 6.4 && t < 321.4;
  const luz = ceu ? luzEm(t) : null;
  const perfil: Perfil = cap.mundo === 'rua' ? perfilRua(t) : cap.mundo === 'terra' ? perfilTerra(t) : cap.mundo === 'cosmos' ? perfilCosmos(t) : perfilFim(t);
  return (
    <>
      <CameraPOV t={t} />
      {ceu && <CeuTempo t={t} />}
      {((t >= 6.4 && t < 117) || t >= 522) && <Rua t={t} />}
      {((t >= 6.4 && t < 117) || t >= 522) && <Cidade t={t} />}
      {t >= 116 && t < 309.6 && <Terra t={t} />}
      {(t < 6.4 || (t >= 260 && t < 345)) && <Cosmos t={t} />}
      {t >= 345 && t < 522 && <Fim t={t} />}
      <Corpo t={t} />
      {/* god rays so com disco de Sol de verdade (antes da listra e na volta a rua): depois de 41 s o sol e uma direcao media e o disco virava um circulo falso */}
      <Look perfil={perfil} sol={t < 41 || t >= 522 ? luz?.sol : undefined} />
    </>
  );
};
