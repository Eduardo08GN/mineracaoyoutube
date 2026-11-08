// Cena 'bsas' (Buenos Aires): Av. 9 de Julio e o Obelisco com o mar em metros reais.
//   cam 'obelisco' (cap. 03, L ~29,6 -> 30,1 m): dolly pela avenida ate o Obelisco; ~5 m de agua cobrem a base, carros boiando.
//   cam 'obelisco_topo' (cap. 04, L ~62 -> 70 m): a cidade "volta pior": rente a agua, orbitando a ponta do Obelisco que sobra
//     (~22 m fora d'agua a +70 m) e os topos dos predios mais altos como ilhas.
// Cota presa ao eixo do Obelisco (marcas a cada 10 m, parte afogada em azul) + rotulos. Funcao pura de (beat, t, u, L).
import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CenaProps} from './tipos';
import {Agua, Ambiente, AtualizaMatrizes, Cam, CameraDoQuadro, Ceu, Nuvens, Sol, atualizaAgua, easeCam, lerp, luzDe} from './salinas/base';
import {Look, Perfil} from './salinas/look';
import {Ancora, Cota, RotulosCena} from './salinas/rotulos';
import {ALT_OBELISCO, MundoBsAs, TOPO_OBELISCO, Y0} from './bsas/mundo';

export const camBsAs = (nome: string, u: number): Cam => {
  const k = easeCam(u);
  if (nome === 'obelisco_topo') {
    // orbita lenta em volta da ponta, a ~12-16 m acima da agua
    const ang = lerp(3.55, 4.05, k), r = lerp(70, 54, k), y = lerp(84, 81, k);
    return {pos: [Math.cos(ang) * r, y, Math.sin(ang) * r], alvo: [Math.cos(ang + 0.32) * 12, lerp(80, 79, k), Math.sin(ang + 0.32) * 12], fov: 50};
  }
  // dolly pela avenida (x -> 0), um pouco acima da agua; o Obelisco a direita do centro
  return {pos: [lerp(-175, -128, k), lerp(44, 41, k), lerp(-38, -30, k)], alvo: [0, lerp(54, 57, k), lerp(-30, -24, k)], fov: 47};
};

const PERFIL: Perfil = {ao: true, bloom: 0.22, limiar: 0.95, saturacao: 0.14, contraste: 0.08, brilho: 0, vinheta: 0.3,
  nevoa: {cor: '#d3e2ec', densidade: 0.0007, max: 0.5}, raios: 0};

export const Cena: React.FC<CenaProps> = ({beat, t, u, L}) => {
  const {width, height} = useVideoConfig();
  const topo = beat.cam === 'obelisco_topo';
  const c = camBsAs(topo ? 'obelisco_topo' : 'obelisco', u);
  const luz = luzDe(0.85, topo ? -2.2 : -1.15);
  atualizaAgua(L, t, {turb: 2.0, molhado: 1.1, esp: 2.1, espLarg: 0.35, fundo: '#0b3a44', tinta: '#7cbcbc'});
  const camV = new THREE.Vector3(...c.pos), alvo = new THREE.Vector3(...c.alvo);
  const dirH = alvo.clone().sub(camV).setY(0).normalize();
  // lado da cota: a direita do Obelisco na tela (perpendicular a direcao da camera), na face voltada a camera
  const dir = new THREE.Vector3(-camV.x, 0, -camV.z).normalize(), dirD = new THREE.Vector3(-dir.z, 0, dir.x);
  const lado: [number, number] = [dirD.x * 9 - dir.x * 2, dirD.z * 9 - dir.z * 2];
  const faceL = (h: number) => { const lh = 6.8 + (3.4 - 6.8) * Math.min(1, (h - Y0) / 63.5); return [-dir.x * (lh / 2 + 0.1), h, -dir.z * (lh / 2 + 0.1)] as [number, number, number]; };
  const idade = t - beat.ini;
  const fora = Math.max(0, TOPO_OBELISCO - L);
  const rot: Ancora[] = [
    {id: 'agua', pos: faceL(L), titulo: 'EL AGUA', valor: topo ? `+${Math.round(L)} m · quedan ${Math.round(fora)} m fuera` : `+${Math.round(L)} m`, dx: -190, dy: 110, ini: topo ? 0.9 : 0.6, agua: true},
    {id: 'obel', pos: [0, TOPO_OBELISCO, 0], titulo: 'OBELISCO', valor: `${String(ALT_OBELISCO).replace('.', ',')} m`, dx: 170, dy: -60, ini: topo ? 0.3 : 1.4},
  ];
  return (
    <AbsoluteFill style={{background: '#9cc8ea'}}>
      <ThreeCanvas width={width} height={height} shadows camera={{fov: 47, near: 0.3, far: 9000, position: [0, 60, -150]}}
        gl={{antialias: false, toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace}}>
        <CameraDoQuadro c={c} />
        <AtualizaMatrizes />
        <Ambiente intens={0.55} />
        <Ceu luz={luz} centro={c.pos} />
        <Sol luz={luz} foco={alvo} area={topo ? 180 : 170} forca={3.0} />
        <Nuvens t={t} centro={[camV.x, camV.z]} dir={[dirH.x, dirH.z]} dist={1000} largura={2600} altura={260} />
        <Agua t={t} L={L} sol={luz.sol} espuma={1.0} agit={topo ? 0.35 : 0.2} raso="#4fb3aa" medio="#258d97" fundo="#13627a" alfa={topo ? 0.9 : 0.84}
          corrente={[0.9, 0.25]} riscos={topo ? 0.5 : 0.35} />
        <MundoBsAs t={t} L={L} />
        <Look perfil={PERFIL} sol={luz.sol} />
      </ThreeCanvas>
      <Cota cam={c} idade={idade} eixo={[0, 0]} lado={lado} base={Y0} topo={TOPO_OBELISCO} L={L} passo={10} ini={topo ? 0.1 : 0.9} />
      <RotulosCena cam={c} idade={idade} lista={rot} />
    </AbsoluteFill>
  );
};
