// Composicao de teste de UMA batida: props {beat: 'b07', u?: 0.5} (ou {familia: 'bsas'} = primeira batida da familia).
// Stills de depuracao: npx remotion still src/index.tsx Teste out.jpg --props='{"beat":"b07","u":0.5}'
import React from 'react';
import {AbsoluteFill, getInputProps} from 'remotion';
import plano from './plano.json';
import {CENAS} from './cenas';
import {Beat} from './cenas/tipos';
import {nivelEm} from './nivel';
import {Pronto} from './Pronto';
export const Teste: React.FC = () => {
  const p = getInputProps() as {beat?: string; familia?: string; u?: number};
  const b = (plano.beats as Beat[]).find((x) => x.id === p.beat || (!p.beat && x.familia === p.familia)) ?? (plano.beats as Beat[])[0];
  const u = p.u ?? 0.5, t = b.ini + u * (b.fim - b.ini), C = CENAS[b.familia];
  return <Pronto><AbsoluteFill style={{background: '#000'}}><C beat={b} t={t} u={u} L={nivelEm(t)} Lant={nivelEm(t - 1 / 30)} /></AbsoluteFill></Pronto>;
};
