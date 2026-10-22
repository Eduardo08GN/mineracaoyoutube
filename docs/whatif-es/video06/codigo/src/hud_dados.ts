// Dados do painel do video 6 (dono: agente HUD). Tempos do ORIGINAL (mapa_acoes.md, secao HUD; leituras em hud_original.json).
// UN DÍA DURA: dia solar a partir da velocidade do equador lida do original (fisica.velEquador), normalizado para dar 24 h 00 min
// na velocidade de hoje: w = r (1 + 1/ano) - 1/ano, r = v / v0 (com sinal). Bate com as leituras do original (39 h 57 min em 104 s,
// 1,8 anos em 256 s, 2,0 anos em 286 s, 1 ano com a Terra parada, 23 h 58 min em 388 s). Os FORMATOS trocam nos segundos do mapa.
import {velEquador} from './fisica';

const V0 = 1037 * 1.60934;          // km/h no equador hoje (velEquador devolve mph * 1,60934)
const KMH0 = 1670;                  // mostrado no painel (1.037 mph)
const ANO = 365.25;

// milhar com ponto, decimal com virgula (espanhol)
export const fmtNum = (x: number, dec = 0): string => {
  const s = x.toFixed(dec);
  const [ii, dd] = s.split('.');
  const mil = ii.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return dd ? `${mil},${dd}` : mil;
};

// dia solar em minutos (Infinity se o Sol para)
export const diaMinutos = (t: number): number => {
  const r = velEquador(t) / V0;
  const w = r * (1 + 1 / ANO) - 1 / ANO;
  return Math.abs(w) < 1e-9 ? Infinity : 1440 / Math.abs(w);
};

const cl = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const hm = (m: number) => {
  const tot = Math.floor(m), h = Math.floor(tot / 60), mm = tot - h * 60;
  return `${h} h ${String(mm).padStart(2, '0')} min`;
};
const diasDec = (m: number) => `${fmtNum(cl(Math.floor((m / 1440) * 10) / 10, 3, 9.9), 1)} días`;
const diasInt = (m: number, a: number, b: number) => `${cl(Math.round(m / 1440), a, b)} días`;
const meses = (m: number) => `${cl(Math.round(m / 1440 / 30.44), 2, 11)} meses`;
const anos = (m: number, max: number) => {
  const a = cl(Math.round((m / 1440 / ANO) * 10) / 10, 1, max);
  return a < 1.05 ? '1 año' : `${fmtNum(a, 1)} años`;
};

// numero grande, com os formatos do original (tabela do mapa)
export const diaTxt = (t: number): string => {
  if (t < 11) return '24 h 00 min';
  const m = diaMinutos(t);
  if (t < 128.5) return hm(m);
  if (t < 178.2) return diasDec(m);
  if (t < 213.2) return diasInt(m, 10, 60);
  if (t < 245.6) return meses(m);
  if (t < 257.8) return anos(m, 2.0);
  if (t < 286.2) return 'PARA SIEMPRE';
  if (t < 294) return anos(m, 2.0);
  if (t < 312) return '1 año';
  if (t < 317.8) return meses(m);
  if (t < 334.8) return diasInt(m, 10, 58);
  if (t < 345.4) return diasDec(m);
  return hm(m);
};

// linha 3: velocidade do solo (km/h); parada em 0 de ~300 a 311,5; HACIA ATRÁS a partir de 311,6
export const velTxt = (t: number): string => {
  let v = velEquador(t) / V0 * KMH0;
  if (t < 11) v = KMH0;
  if (t < 311.6 && v < 0) v = 0;
  const a = Math.abs(v);
  const n = a >= 10 ? fmtNum(Math.round(a)) : a < 0.05 ? '0' : fmtNum(a, 1);
  return `EL SUELO EN EL ECUADOR: ${n} KM/H${v < 0 ? ' HACIA ATRÁS' : ''}`;
};

// linha 4: local (cinza). Troca com piscada de 0,2 s centrada no segundo do mapa; tambem pisca sem trocar em 188,1, 271,1 e 356,3.
const LOCAIS: [number, string][] = [
  [0, 'EL ECUADOR'], [60.1, 'SAN JUAN DE GAZTELUGATXE, ESPAÑA'], [74.1, 'MADRID'], [103.5, 'LA TIERRA'], [132.5, 'CIUDAD DE PANAMÁ'],
  [159.1, 'ACAPULCO, MÉXICO'], [217.5, 'LA TIERRA'], [244.5, 'EL ECUADOR'], [300.5, 'LA TIERRA'], [329.5, 'EL ECUADOR'],
];
const PISCA_LOCAL = [60.1, 74.1, 103.5, 132.5, 159.1, 188.1, 217.5, 244.5, 271.1, 300.5, 329.5, 356.3];

// linha 5: comparacao (laranja)
const QUE = 'EL ECUADOR VA MÁS RÁPIDO QUE ';
const COMPARA: [number, string][] = [
  [0, QUE + 'EL SONIDO'], [74.2, QUE + 'UN AVIÓN DE LÍNEA'], [107.6, QUE + 'UN TREN BALA'], [160.0, QUE + 'UN COCHE EN LA AUTOPISTA'],
  [188.8, QUE + 'UNA BICICLETA'], [225.0, 'EL ECUADOR VA AL PASO DE UNA PERSONA'], [257.8, 'EL SOL SE DETUVO EN EL CIELO'],
  [286.2, 'EL SOL SALE POR EL OESTE'],
];
const PISCA_CMP = [74.1, 107.6, 160.0, 188.8, 225.0, 257.8, 286.2];

const ultimo = (L: [number, string][], t: number) => {
  let s = L[0][1];
  for (const [a, x] of L) if (t >= a) s = x;
  return s;
};
// opacidade da linha: 0 por 0,2 s em volta da troca, com bordas de 1 quadro
const pisca = (P: number[], t: number) => {
  let o = 1;
  for (const p of P) {
    const d = Math.abs(t - p);
    if (d < 0.1) o = 0;
    else if (d < 0.1 + 1 / 30) o = Math.min(o, (d - 0.1) * 30);
  }
  return o;
};

export type Hud = {dia: string; vel: string; local: string; opLocal: number; cmp: string; opCmp: number};
export const hudEm = (t: number): Hud => ({
  dia: diaTxt(t),
  vel: velTxt(t),
  local: ultimo(LOCAIS, t),
  opLocal: pisca(PISCA_LOCAL, t),
  cmp: ultimo(COMPARA, t),
  opCmp: pisca(PISCA_CMP, t),
});
