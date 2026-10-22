// Fisica do video 6 (tempos do ORIGINAL), lida do painel do original (src/hud_original.json, a cada 2 s):
// velocidade do solo no equador (mph -> km/h) com sinal (negativo = girando ao contrario, depois de ~311,6 s).
// A rotacao sideral sai da velocidade; o dia SOLAR combina rotacao e a volta anual em torno do Sol (por isso "FOREVER" com
// rotacao de 1 ano e "1 year" com rotacao zero). Use estas funcoes para o Sol, o mar e o painel.
import HUD from './hud_original.json';

type L = {t: number; dia_min: number | null; mph: number | null; sentido: string | null};
const PTS = (HUD as L[]).filter((x) => x.mph != null).map((x) => ({t: x.t, v: (x.mph as number) * (x.sentido === 'para tras' ? -1 : 1)}));
const ANO_DIAS = 365.25, CIRC_KM = 40075;
// velocidade do equador em km/h (com sinal) no segundo t do original
export const velEquador = (t: number): number => {
  if (t <= PTS[0].t) return PTS[0].v * 1.60934;
  for (let i = 0; i < PTS.length - 1; i++) {
    const a = PTS[i], b = PTS[i + 1];
    if (t <= b.t) return (a.v + (b.v - a.v) * ((t - a.t) / (b.t - a.t))) * 1.60934;
  }
  return PTS[PTS.length - 1].v * 1.60934;
};
// rotacao sideral (voltas por dia terrestre de hoje, com sinal) e dia solar em horas (Infinity quando o Sol para)
// calibrado: na velocidade de hoje (1.037 mph) a Terra da 1 + 1/365,25 voltas por dia (dia sideral de 23 h 56 min, dia solar de 24 h)
export const voltasPorDia = (t: number) => (velEquador(t) / (1037 * 1.60934)) * (1 + 1 / ANO_DIAS);
export const diaSolarHoras = (t: number) => {
  const w = voltasPorDia(t) - 1 / ANO_DIAS;           // voltas/dia em relacao ao Sol
  return Math.abs(w) < 1e-9 ? Infinity : 24 / Math.abs(w);
};
// sentido do Sol no ceu: +1 nasce no leste (normal), -1 nasce no oeste, 0 parado
export const sentidoSol = (t: number) => Math.sign(voltasPorDia(t) - 1 / ANO_DIAS);
// nivel do mar relativo por latitude (m): com a Terra girando mais devagar a agua migra do equador para os polos.
// Aproximacao do bojo equatorial: desnivel ~ 21,4 km * (1 - (w/w0)^2) distribuido como P2(sen lat).
export const nivelMar = (t: number, latGraus: number) => {
  const w0 = 1037 * 1.60934, f = 1 - Math.pow(velEquador(t) / w0, 2);
  const s = Math.sin((latGraus * Math.PI) / 180), p2 = (3 * s * s - 1) / 2;   // P2: -0,5 no equador, +1 no polo, media 0 na esfera
  return (21400 / 1.5) * f * p2;                                             // equador desce ~7 km, polos sobem ~14 km (rotacao zero)
};
