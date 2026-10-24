import {KitMap} from '../tipos';
import React from 'react';
import {Motor} from './motor';
import {Flug} from './flug';
import {Modell} from './modell';

// Cenas da familia welt (documentadas em API.md desta pasta)
const Bahn: React.FC<any> = (props) => React.createElement(Motor, {...props, modo: 'bahn'});
const Globus: React.FC<any> = (props) => React.createElement(Motor, {...props, modo: 'globus'});

export const KIT_WELT: KitMap = {
  Modell: {C: Modell, doc: 'vitrine de modelo 3D do registro (modelos.tsx) com camera orbital, rotulos com seta, cotas, graduacao e escala humana'},
  Flug: {C: Flug, doc: 'voo sobre terreno real (satelite/ortofoto + relevo) com camera por keyframes, rotulos, pontos, arcos e setas'},
  Bahn: {C: Bahn, doc: 'trajetoria balistica sobre globo/terreno: curva (arquivo, pontos ou parametros), camera por keyframes, HUD de telemetria, rastro, eventos e camadas'},
  Globus: {C: Globus, doc: 'globo da Terra com camera orbital, arco, regiao destacada, marcas e camadas'},
};
