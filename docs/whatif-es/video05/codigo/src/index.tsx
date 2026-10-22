import './teste_flags';
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Video} from './Video';
import {DURACAO} from './roteiro';

const Raiz: React.FC = () => <Composition id="Video" component={Video} width={1920} height={1080} fps={30} durationInFrames={Math.round(DURACAO * 30)} />;
registerRoot(Raiz);
