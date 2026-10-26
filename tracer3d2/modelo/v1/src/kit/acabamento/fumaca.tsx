// Fumaca / poeira em flipbook (Unity Labs, CC0, simulacao feita no Houdini) com a cor e a luz do CLIMA. Envolve o `Flipbook` do projeto
// (welt/t_vfx.tsx, motor de particulas sem estado: tudo funcao de t). Atlas em public/acabamento/vfx.
import React from 'react';
import {Flipbook} from '../../welt/t_vfx';
import type {Emissor} from '../../welt/t_vfx';
import {CLIMAS, Clima} from './clima';

export const ATLAS_ACAB = {
  nuvem1: {arq: 'acabamento/vfx/Cloud01_8x8.png', cols: 8, rows: 8, aspecto: 1},
  nuvem2: {arq: 'acabamento/vfx/Cloud02_8x8.png', cols: 8, rows: 8, aspecto: 1},
  fiapo: {arq: 'acabamento/vfx/WispySmoke01_8x8.png', cols: 8, rows: 8, aspecto: 1},
  explosao: {arq: 'acabamento/vfx/Explosion01_5x5.png', cols: 5, rows: 5, aspecto: 1},
};
// tipos prontos: tamanho/subida/crescimento tipicos de cada fumaca
const TIPOS = {
  polvora: {atlas: ATLAS_ACAB.nuvem1, vida: 2.6, sobe: 0.8, cresce: 0.8, espalha: 0.5, porEmissor: 4, forca: 0.55, tinta: 1.0},     // polvora negra: nuvem baixa e densa
  locomotiva: {atlas: ATLAS_ACAB.nuvem2, vida: 3.2, sobe: 2.2, cresce: 1.2, espalha: 0.3, porEmissor: 3, forca: 0.7, tinta: 1.0},   // coluna que sobe
  poeira: {atlas: ATLAS_ACAB.fiapo, vida: 3.0, sobe: 0.4, cresce: 1.0, espalha: 1.2, porEmissor: 3, forca: 0.35, tinta: 0.9},        // poeira da marcha
  incendio: {atlas: ATLAS_ACAB.nuvem1, vida: 3.6, sobe: 2.6, cresce: 1.4, espalha: 0.6, porEmissor: 4, forca: 0.7, tinta: 0.35},     // fumaca escura de incendio
};
export type TipoFumaca = keyof typeof TIPOS;

export const Fumaca: React.FC<{clima: Clima; tipo?: TipoFumaca; emissores: Emissor[]; t: number; forca?: number; escala?: number}> = ({clima, tipo = 'polvora', emissores, t, forca, escala = 1}) => {
  const C = CLIMAS[clima].fumaca, T = TIPOS[tipo];
  const em = escala === 1 ? emissores : emissores.map((e) => ({...e, s: e.s * escala}));
  return <Flipbook atlas={T.atlas} emissores={em} t={t} porEmissor={T.porEmissor} vida={T.vida} sobe={T.sobe} cresce={T.cresce} cor={C.cor} forca={forca ?? T.forca} fumaca luz={C.luz * T.tinta} espalha={T.espalha} />;
};
