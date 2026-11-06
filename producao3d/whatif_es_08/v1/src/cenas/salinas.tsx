// Cena 'salinas' (Salinas, Equador): o malecon do batedor 07 com o mar em metros reais (L).
//   cam 'malecon' (b00, L 0 -> ~3 m): do alto do malecon olhando a praia; a agua engole a areia, sobe a mira de mare e o muro,
//     a multidao foge pelas escadas e, no fim, a agua passa por cima do malecon ("Y no se detiene").
//   cam 'praia' (cap. 02, L ~5,6 -> ~9,3 m): rente a agua, do mar para a cidade: onde era a orilla so restam palmeiras, postes,
//     carros boiando e os terreos dos predios afogando ("la orilla deja de existir").
// Funcao pura de (beat, t, u, L). HUD global por cima: o assunto fica no centro/direita.
import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CenaProps} from './tipos';
import {Agua, Ambiente, AtualizaMatrizes, Cam, CameraDoQuadro, Ceu, Nuvens, Sol, atualizaAgua, easeCam, fmtDec, lerp3, luzDe, tNivel} from './salinas/base';
import {Look, Perfil} from './salinas/look';
import {Ancora, RotulosCena} from './salinas/rotulos';
import {MIRA, MundoSalinas, Y_MAL, Z_ORILLA, zCosta} from './salinas/mundo';
import {Detritos} from './bsas/mundo';

export const camSalinas = (nome: string, u: number): Cam => {
  const k = easeCam(u);
  if (nome === 'praia') return {pos: lerp3([30, 10.5, -34], [6, 9.6, -21], k), alvo: lerp3([-20, 6.5, 14], [-34, 7.0, 20], k), fov: 48};
  return {pos: lerp3([-72, 21, 13], [-47, 16, 5], k), alvo: lerp3([-4, 0.2, -22], [7, 1.2, -14], k), fov: 47};
};

const PERFIL: Perfil = {ao: true, bloom: 0.22, limiar: 0.95, saturacao: 0.14, contraste: 0.08, brilho: 0, vinheta: 0.3,
  nevoa: {cor: '#d5e5ee', densidade: 0.0006, max: 0.42}, raios: 0};

export const Cena: React.FC<CenaProps> = ({beat, t, u, L}) => {
  const {width, height} = useVideoConfig();
  const praia = beat.cam === 'praia';
  const c = camSalinas(praia ? 'praia' : 'malecon', u);
  const luz = praia ? luzDe(0.95, 2.35) : luzDe(1.0, -0.75);
  atualizaAgua(L, t, {turb: 2.6, molhado: 0.4, esp: 2.1, espLarg: 0.2, fundo: '#06404c', tinta: '#8fd3d6'});
  const camV = new THREE.Vector3(...c.pos), alvo = new THREE.Vector3(...c.alvo);
  const dirH = alvo.clone().sub(camV).setY(0).normalize();
  const idade = t - beat.ini;
  const rot: Ancora[] = praia ? [
    {id: 'mal', pos: [-21.5, L, 1.2], titulo: 'EL AGUA SOBRE EL MALECÓN', valor: `${fmtDec(L - Y_MAL, 1)} m`, dx: 150, dy: -110, ini: 0.3, agua: true},
    {id: 'av', pos: [-34, L, 19], titulo: 'LA AVENIDA', valor: `bajo ${fmtDec(Math.max(0, L - 4.7), 1)} m de agua`, dx: 170, dy: 90, ini: 1.9, agua: true},
  ] : [
    {id: 'orilla', pos: [-12, 0.05, Z_ORILLA], titulo: 'LA ORILLA DE HOY', valor: '0 m', dx: 140, dy: -90, ini: 0.25, fim: 2.6},
    {id: 'mira', pos: [MIRA[0], Math.max(L, 0.6), MIRA[1]], titulo: 'NIVEL DEL MAR', valor: `+${fmtDec(L, 1)} m`, dx: 160, dy: -120, ini: 2.4, agua: true,
      fim: tNivel(Y_MAL + 0.02) - beat.ini - 0.4},
    {id: 'mal', pos: [-24, L, 4], titulo: 'EL AGUA SOBRE EL MALECÓN', valor: `${fmtDec(Math.max(0, L - Y_MAL), 1)} m`, dx: 160, dy: -120, ini: tNivel(Y_MAL + 0.02) - beat.ini, agua: true},
  ];
  return (
    <AbsoluteFill style={{background: '#9cc8ea'}}>
      <ThreeCanvas width={width} height={height} shadows camera={{fov: 48, near: 0.3, far: 9000, position: [0, 20, -40]}}
        gl={{antialias: false, toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace}}>
        <CameraDoQuadro c={c} />
        <AtualizaMatrizes />
        <Ambiente intens={0.55} />
        <Ceu luz={luz} centro={c.pos} />
        <Sol luz={luz} foco={alvo} area={praia ? 95 : 85} forca={3.1} />
        <Nuvens t={t} centro={[camV.x, camV.z]} dir={[dirH.x, dirH.z]} dist={900} largura={2200} altura={190} />
        <Agua t={t} L={L} sol={luz.sol} costa={zCosta(L)} espuma={1.1} agit={0.1 + 0.25 * Math.min(1, L / 6)}
          corrente={[0.15, praia ? 1.1 : 0.5]} riscos={praia ? 0.25 : 0.1} alfa={0.8} />
        <MundoSalinas t={t} L={L} gente={!praia} cam={camV} />
        {praia && <Detritos t={t} L={L} n={160} />}
        <Look perfil={PERFIL} sol={luz.sol} />
      </ThreeCanvas>
      <RotulosCena cam={c} idade={idade} lista={rot} />
    </AbsoluteFill>
  );
};
