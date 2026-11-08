// Os tres estagios do batedor (dados puros). Mundo em metros; a arvore (alamo) e o ancora: base em (TX, TZ).
import plano from '../plano.json';
import type {V3} from './util';

export const TX = -0.6, TZ = -3.4;                 // base do tronco
export const TS: V3 = [1.45, 1.15, 1.45];          // escala (achatada em y: copa mais baixa, cabe no quadro)
export const GALHO: V3 = [TX - 2.0 * TS[0], 3.95 * TS[1], TZ];   // topo do galho horizontal (x local -2,0; y local 3,95)
export const AGUA_B = 2.0, AGUA_C = 3.0;          // nivel da agua (cintura / quase no galho)

export type Estagio = {
  id: 'A' | 'B' | 'C'; n: number; mundo: 'seco' | 'meianoite' | 'amanhecer';
  cam: {pos: V3; alvo: V3; fov: number};
  // ceu
  hor: string; meio: string; zen: string; glow: string; glowDir: V3; glowForca: number; sol: V3 | null; solCor: string; lua: V3 | null; estrelas: number;
  nuvem: string; nuvemTopo: string; nuvens: number;
  // luz
  key: {dir: V3; cor: string; f: number}; rim: {dir: V3; cor: string; f: number}; hemi: {ceu: string; chao: string; f: number};
  env: 'dia' | 'noite'; envF: number;
  // look
  look: {raios?: number; bloom: number; limiar: number; sat: number; contraste: number; brilho: number; vinheta: number; nevoa: string; nevoaD: number; nevoaMax: number; seletiva?: number;
    dof: {foco: number; faixa: number; bokeh: number}};
  chuva: number;
  // hud
  hud: {kicker: string; hora: string; sub: string; legenda: string};
};

const norm = (v: V3): V3 => { const l = Math.hypot(...v); return [v[0] / l, v[1] / l, v[2] / l]; };

export const ESTAGIOS: Estagio[] = [
  {id: 'A', n: 1, mundo: 'seco',
   cam: {pos: [5.2, 1.7, 10.5], alvo: [-0.6, 3.4, -3], fov: 63},
   hor: '#f08a4c', meio: '#4f7d93', zen: '#1b3a52', glow: '#ff8a3c', glowDir: norm([-0.6, 0, -1]), glowForca: 0.9, sol: null, solCor: '#ffb070', lua: null, estrelas: 0.2,
   nuvem: '#2f4352', nuvemTopo: '#b86a52', nuvens: 7,
   key: {dir: norm([-1, 0.32, 0.45]), cor: '#ff9a55', f: 3.4}, rim: {dir: norm([0.5, 0.3, -1]), cor: '#7fd6e8', f: 2.6}, hemi: {ceu: '#3b6e8c', chao: '#7a5238', f: 0.8},
   env: 'noite', envF: 0.35,
   look: {bloom: 0.55, limiar: 0.85, sat: 0.14, contraste: 0.14, brilho: 0.0, vinheta: 0.42, nevoa: '#6f8797', nevoaD: 0.0016, nevoaMax: 0.55, dof: {foco: 11.3, faixa: 4.5, bokeh: 5}},
   chuva: 0,
   hud: {kicker: 'LECHO SECO · ARIZONA', hora: 'HORA 0', sub: 'TODO TRANQUILO', legenda: 'Estás en el lecho seco de un río, en el desierto de Arizona.'}},
  {id: 'B', n: 2, mundo: 'meianoite',
   cam: {pos: [6.4, 3.1, 0.6], alvo: [-1.3, 2.7, -3.0], fov: 58},
   hor: '#0d1630', meio: '#070d1f', zen: '#02040b', glow: '#ff8a40', glowDir: norm([-1, 0, -0.35]), glowForca: 0.7, sol: null, solCor: '#fff', lua: norm([-0.8, 0.42, -0.3]), estrelas: 1,
   nuvem: '#0b1224', nuvemTopo: '#2b3a60', nuvens: 6,
   key: {dir: norm([-0.8, 0.42, -0.3]), cor: '#8fb3ff', f: 3.2}, rim: {dir: norm([-0.9, 0.18, 0.2]), cor: '#ff8f4a', f: 2.2}, hemi: {ceu: '#1a2a5a', chao: '#0b1018', f: 0.45},
   env: 'noite', envF: 0.22,
   look: {bloom: 0.7, limiar: 0.8, sat: 0.1, contraste: 0.2, brilho: -0.04, vinheta: 0.55, nevoa: '#08102a', nevoaD: 0.0075, nevoaMax: 0.9, dof: {foco: 7.0, faixa: 4.2, bokeh: 3.0}},
   chuva: 1,
   hud: {kicker: 'MEDIANOCHE', hora: 'HORA 1', sub: 'EL AGUA SUBE', legenda: 'Medianoche. El agua llega sin avisar.'}},
  {id: 'C', n: 3, mundo: 'amanhecer',
   cam: {pos: [4.8, 6.6, 3.8], alvo: [-6.2, 3.3, -4.6], fov: 60},
   hor: '#e2c2ae', meio: '#b3b3b8', zen: '#7d8798', glow: '#ffd2a8', glowDir: norm([-0.7, 0, -1]), glowForca: 0.5, sol: norm([-0.51, 0.02, -0.856]), solCor: '#ffe0bd', lua: null, estrelas: 0,
   nuvem: '#8d8f9a', nuvemTopo: '#d9c4bb', nuvens: 8,
   key: {dir: norm([-0.51, 0.22, -0.856]), cor: '#ffd8b0', f: 1.5}, rim: {dir: norm([-0.5, 0.2, -1]), cor: '#fff0e0', f: 2.4}, hemi: {ceu: '#a9b0bd', chao: '#6e6258', f: 0.8},
   env: 'dia', envF: 0.6,
   look: {bloom: 0.45, limiar: 0.85, sat: -0.02, contraste: 0.18, brilho: -0.05, raios: 0.12, vinheta: 0.34, nevoa: '#bfb2a6', nevoaD: 0.0018, nevoaMax: 0.7, seletiva: 0.15, dof: {foco: 11.8, faixa: 8, bokeh: 2.2}},
   chuva: 0,
   hud: {kicker: 'AMANECE', hora: 'HORA 11', sub: 'SIGUE ARRIBA', legenda: 'Once horas después, sigues agarrado al árbol.'}},
];
export const estagioEm = (t: number): Estagio => {
  const s = plano.shots.findIndex((x: any) => t >= x.ini && t < x.fim);
  return ESTAGIOS[s < 0 ? ESTAGIOS.length - 1 : s];
};
