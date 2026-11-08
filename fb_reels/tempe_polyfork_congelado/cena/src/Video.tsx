// Batedor Tempe x Polyfork: 3 stills (um por estagio). Cada estagio = 1 s da composicao; o still pega o quadro do meio (0,5 s / 1,5 s / 2,5 s).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import plano from './plano.json';
import {Cena} from './Cena';
import {Hud} from './hud/Hud';
import './hud/base';
import {estagioEm} from './mundo/estagios';

export const Video: React.FC = () => {
  const f = useCurrentFrame(), t = f / plano.fps, E = estagioEm(t);
  return <AbsoluteFill style={{background: '#000'}}><Cena E={E} /><Hud E={E} /></AbsoluteFill>;
};
