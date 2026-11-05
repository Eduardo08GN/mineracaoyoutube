import './teste_flags';
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Video} from './Video';
import {DURACAO, FPS} from './roteiro';

const Raiz: React.FC = () => <Composition id="Video" component={Video} width={1920} height={1080} fps={FPS} durationInFrames={Math.round(DURACAO * FPS)} />;
registerRoot(Raiz);
