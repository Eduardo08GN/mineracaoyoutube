import React from 'react';
import {Composition, registerRoot} from 'remotion';
import plano from './plano.json';
import {Video} from './Video';
const Raiz: React.FC = () => (
  <Composition id="Video" component={Video} width={1080} height={1920} fps={plano.fps} durationInFrames={Math.round(plano.dauer * plano.fps)} />
);
registerRoot(Raiz);
