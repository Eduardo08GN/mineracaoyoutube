// Lista de Shorts/Reels: trechos do video final (tempo do VIDEO), gancho do topo e legendas re-escritas grandes.
import LEG5 from './leg_v5.json';
export type Linha = {s: number; e: number; txt: string};
export type Short = {id: string; arq: string; t0: number; dur: number; gancho: string; leg: Linha[]};
// video 5: tempo do original = tempo do video ate 386,5 s (depois do take, video = original + 30)
const leg5 = (t0: number, dur: number): Linha[] => (LEG5 as Linha[])
  .map((l) => (l.s >= 386.5 ? {...l, s: l.s + 30, e: l.e + 30} : l))
  .filter((l) => l.e > t0 && l.s < t0 + dur)
  .map((l) => ({s: Math.max(0, l.s - t0), e: Math.min(dur, l.e - t0), txt: l.txt}));
export const SHORTS: Short[] = [
  {id: 'v5_s1', arq: 'v5_s1.mp4', t0: 24, dur: 37.5, gancho: 'Te quedas quieto un minuto…\ny afuera pasa un año.', leg: leg5(24, 37.5)},
];
