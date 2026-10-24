// Contrato do kit (Tracer3D 2.0): uma cena do kit desenha a tela inteira a partir de props em JSON (cenas/*.json).
// t = segundos desde o inicio da batida; d = duracao; b = a batida (id, kap, s, e); p = props da cena.
// Todo tempo dentro de p pode ser numero (s locais) ou ancora na fala: {"wort": "Granate", "nach": 0, "plus": 0.2}.
import React from 'react';
import {Beat, wortLokal} from '../tempo';

export type Zeit = number | {wort: string; nach?: number; plus?: number};
export type KitProps<P = any> = {t: number; d: number; b: Beat; p: P};
export type KitEintrag = {C: React.FC<KitProps<any>>; doc: string};
export type KitMap = Record<string, KitEintrag>;

// resolve uma Zeit para segundos locais da batida (palavra nao achada = padrao, nunca derruba o render)
export const zeit = (b: {s: number; kap: string}, z: Zeit | undefined, padrao = 0): number => {
  if (z === undefined || z === null) return padrao;
  if (typeof z === 'number') return z;
  try { return wortLokal(b, z.wort, z.nach ?? 0) + (z.plus ?? 0); } catch { return padrao; }
};
