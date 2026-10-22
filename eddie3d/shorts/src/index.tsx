import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ShortV} from './Short';
import {SHORTS} from './shorts';

const Raiz: React.FC = () => <>{SHORTS.map((s) => (
  <Composition key={s.id} id={s.id.replace(/_/g, '-')} component={ShortV as any} width={1080} height={1920} fps={30}
    durationInFrames={Math.round(s.dur * 30)} defaultProps={{s}} />))}</>;
registerRoot(Raiz);
