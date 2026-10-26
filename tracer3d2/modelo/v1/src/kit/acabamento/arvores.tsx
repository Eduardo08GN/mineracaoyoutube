// <Arvores>: floresta de EZ-Tree (MIT) no lugar de cones. Sorteia posicoes com semente fixa num anel/retangulo, deixa o chao decidir a
// altura (`y`), aplica folhas/cor/neve do clima e usa InstancedMesh por variante (2 chamadas de desenho por variante). Funcao pura de t.
import React, {useMemo} from 'react';
import {Floresta, ItemFloresta, PresetEZ} from './arvores_ez';
import type {Clima} from './clima';

export type EspecieArv = 'conifera' | 'folhosa' | 'mista';
const VAR: Record<EspecieArv, [PresetEZ, number][]> = {
  conifera: [['Pine Medium', 3], ['Pine Medium', 8], ['Pine Large', 5]],
  folhosa: [['Oak Medium', 11], ['Ash Medium', 5], ['Aspen Medium', 7]],
  mista: [['Pine Medium', 3], ['Oak Medium', 11], ['Pine Large', 5], ['Ash Medium', 5]],
};
// aparencia por clima (1870/71: tons apagados; inverno = galhos nus e neve)
const ESTADO: Record<Clima, {folhas: number; cor: string; cor2: string; neve: number}> = {
  nublado: {folhas: 1, cor: '#566a3a', cor2: '#6e7b42', neve: 0},
  entardecer: {folhas: 1, cor: '#66693a', cor2: '#8b7c3d', neve: 0},
  inverno: {folhas: 0, cor: '#4f5e45', cor2: '#5f6c4e', neve: 0.8},
};

export type ArvoresProps = {
  clima: Clima; t: number; especie?: EspecieArv;
  lista?: ItemFloresta[];                        // lista pronta (x, z, altura...) em vez de sortear
  n?: number; centro?: [number, number]; raio?: number; raioMin?: number;   // sorteio em anel (raioMin..raio) em volta de `centro`
  altura?: [number, number];                     // m
  y?: (x: number, z: number) => number;          // altura do terreno
  evitar?: (x: number, z: number) => boolean;    // true = nao plantar aqui (estrada, coluna, trilho)
  semente?: number; vento?: number;
};

export const sortearArvores = (o: Pick<ArvoresProps, 'n' | 'centro' | 'raio' | 'raioMin' | 'altura' | 'y' | 'evitar' | 'semente' | 'especie'>): ItemFloresta[] => {
  const {n = 60, centro = [0, 0], raio = 120, raioMin = 6, altura = [9, 15], y, evitar, semente = 1, especie = 'mista'} = o;
  const h = (i: number, s: number) => { const v = Math.sin(i * 127.1 + s * 311.7 + semente * 17.3) * 43758.5453; return v - Math.floor(v); };
  const V = VAR[especie], L: ItemFloresta[] = [];
  for (let i = 0, k = 0; L.length < n && k < n * 8; k++, i++) {
    const a = h(i, 1) * Math.PI * 2, r = Math.sqrt(raioMin * raioMin + h(i, 2) * (raio * raio - raioMin * raioMin));
    const x = centro[0] + Math.cos(a) * r, z = centro[1] + Math.sin(a) * r;
    if (evitar && evitar(x, z)) continue;
    const [preset, sem] = V[Math.floor(h(i, 3) * V.length)];
    L.push({preset, semente: sem, x, z, y: y ? y(x, z) : 0, altura: altura[0] + h(i, 4) * (altura[1] - altura[0]), rot: h(i, 5) * Math.PI * 2});
  }
  return L;
};

export const Arvores: React.FC<ArvoresProps> = ({clima, t, vento = 0.3, lista, ...o}) => {
  const L = useMemo(() => lista ?? sortearArvores(o), [lista, JSON.stringify([o.n, o.centro, o.raio, o.raioMin, o.altura, o.semente, o.especie])]);   // eslint-disable-line react-hooks/exhaustive-deps
  const e = ESTADO[clima];
  return <Floresta lista={L} t={t} folhas={e.folhas} cor={e.cor} cor2={e.cor2} neve={e.neve} vento={vento} />;
};
