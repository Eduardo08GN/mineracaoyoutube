// Roteiro do batedor: 14 s, 3 planos com dolly lento continuo; o mundo (p) nunca para entre os planos.
// p(t) = t / DURACAO. Props de entrada (render da G4 / stills): {p?: number, plano?: 'A'|'B'|'C'} forcam o estado do mundo e o plano.
import {getInputProps} from 'remotion';

export const FPS = 30;
export const DURACAO = 14;

export type IdPlano = 'A' | 'B' | 'C';
export type Plano = {id: IdPlano; ini: number; fim: number; nome: string;
  cam: (u: number) => {pos: [number, number, number]; alvo: [number, number, number]; fov: number}};

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const lerp3 = (a: number[], b: number[], u: number) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)] as [number, number, number];
// dolly com velocidade quase constante (comeca e termina em movimento: nada de parada no corte)
const dolly = (u: number) => 0.12 * u * u * (3 - 2 * u) + 0.88 * u;

export const PLANOS: Plano[] = [
  // A: aerea sobre o mar olhando a cidade: mar embaixo (a agua avanca para cima no quadro), praia, malecon com a fonte, avenida e predios
  //    no alto. O Sol baixo do oeste fica atras da camera e acende as fachadas (luz quente de frente).
  {id: 'A', ini: 0, fim: 5, nome: 'aérea', cam: (u) => {
    const k = dolly(u);
    return {pos: lerp3([-18, 30, -74], [-5, 28.5, -70], k), alvo: lerp3([-2, 3, 12], [6, 3, 13], k), fov: 48};
  }},
  // B: rente ao calcadao, na altura dos olhos, olhando ao longo do malecon (+x): mar a esquerda, avenida e predios a direita;
  //    a multidao foge da agua atravessando o quadro
  {id: 'B', ini: 5, fim: 10, nome: 'rente ao calçadão', cam: (u) => {
    const k = dolly(u);
    return {pos: lerp3([-24, 2.4, 6.5], [-17, 2.5, 6.2], k), alvo: lerp3([10, 1.8, 1.5], [16, 2.0, 1.0], k), fov: 46};
  }},
  // C: perto da fonte e dos guarda-sois, olhando para o mar; o ceu gira dia/noite
  {id: 'C', ini: 10, fim: 14, nome: 'close na fonte', cam: (u) => {
    const k = dolly(u);
    return {pos: lerp3([9.5, 3.4, 15.5], [7.2, 3.3, 12.8], k), alvo: lerp3([-1.5, 4.8, -2], [-2.5, 5.6, -4], k), fov: 44};
  }},
];

const props = (() => { try { return getInputProps() as {p?: number; plano?: IdPlano}; } catch { return {}; } })();

// estado do quadro: tempo do mundo (tw, s), p, plano e u (0..1 dentro do plano)
export const estadoQuadro = (frame: number) => {
  const t = frame / FPS;
  const tw = typeof props.p === 'number' ? props.p * DURACAO : t;
  const p = Math.min(1, Math.max(0, tw / DURACAO));
  const plano = props.plano ? PLANOS.find((x) => x.id === props.plano)! : PLANOS.find((x) => t < x.fim) ?? PLANOS[PLANOS.length - 1];
  const tc = props.plano ? Math.min(plano.fim, Math.max(plano.ini, tw)) : t;
  const u = Math.min(1, Math.max(0, (tc - plano.ini) / (plano.fim - plano.ini)));
  return {t, tw, p, plano, u, tPlano: tc - plano.ini};
};

// frases da legenda cinetica (tempo do video). heroi = indice da palavra destacada (dourada)
export type Frase = {ini: number; fim: number; texto: string; heroi?: number[]};
export const FRASES: Frase[] = [
  {ini: 0.2, fim: 2.6, texto: 'La Tierra gira cada vez más rápido.', heroi: [5, 6]},
  {ini: 2.7, fim: 4.9, texto: 'Los océanos corren hacia el ecuador.', heroi: [2]},
  {ini: 5.15, fim: 7.4, texto: 'El mar sube por la playa. No es una ola.', heroi: [2]},
  {ini: 7.5, fim: 9.9, texto: 'Y no deja de subir.', heroi: [4]},
  {ini: 10.15, fim: 12.0, texto: 'Pesas menos. El agua de la fuente casi no baja.', heroi: [0, 1]},
  {ini: 12.1, fim: 13.95, texto: 'Un día entero dura menos de tres horas.', heroi: [6, 7]},
];
