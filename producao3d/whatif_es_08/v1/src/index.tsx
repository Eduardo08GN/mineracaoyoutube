import React from 'react';
import {Composition, registerRoot} from 'remotion';
import './dados';
import plano from './plano.json';
import {Video} from './Video';
import {Teste} from './Teste';
const Raiz: React.FC = () => (<>
  <Composition id="Video" component={Video} width={1920} height={1080} fps={plano.fps} durationInFrames={Math.round(plano.dauer * plano.fps)} />
  <Composition id="Teste" component={Teste} width={1920} height={1080} fps={plano.fps} durationInFrames={1} />
</>);
registerRoot(Raiz);
