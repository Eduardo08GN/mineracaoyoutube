// Relogio da historia: quanto tempo passou "la fora" em cada segundo do ORIGINAL (lido do painel do original, mapa_acoes.json).
// Inicio: segunda-feira, 12 de outubro de 2026, 17:42:07 (em 6,5 s). Tabela em log10(segundos decorridos + 1), interpolada linear
// em log (o original acelera de forma suave). Em 531 s a rua volta: o relogio reinicia em 17:42:07 a velocidade normal.
export const ANO = 31557600;  // s
export const T0_RUA = 6.5;    // primeiro quadro com o relogio parado em 17:42:07
export const T_VOLTA = 531;   // o painel volta a 17:42:07

// [t do original, log10(segundos decorridos + 1)]
const L: [number, number][] = [
  [6.5, 0], [12.5, 1.079], [18.5, 2.149], [24.5, 3.308], [30.5, 4.646], [36.5, 5.104], [42.5, 5.618], [48.5, 6.468], [54.5, 7.029],
  [60.5, 7.5], [66.5, 7.93], [72.5, 8.255], [78.5, 8.636], [84.5, 9.064], [90.5, 9.507], [96.5, 9.952], [102.5, 10.401], [108.5, 10.851],
  [114.5, 11.302], [120.5, 11.722], [126.5, 12.114], [132.5, 12.49], [138.5, 12.835], [144.5, 13.15], [150.5, 13.457], [156.5, 13.762],
  [162.5, 14.063], [168.5, 14.366], [174.5, 14.661], [180.5, 14.939], [186.5, 15.189], [192.5, 15.413], [198.5, 15.613], [204.5, 15.787],
  [210.5, 15.939], [216.5, 16.071], [222.5, 16.189], [228.5, 16.296], [234.5, 16.393], [240.5, 16.481], [246.5, 16.564], [252.5, 16.639],
  [258.5, 16.717], [264.5, 16.789], [270.5, 16.863], [276.5, 16.934], [282.5, 17.004], [288.5, 17.073], [294.5, 17.141], [300.5, 17.204],
  [306.5, 17.263], [312.5, 17.319], [318.5, 17.371], [324.5, 17.421], [330.5, 17.468], [336.5, 17.52], [342.5, 17.596], [348.5, 17.725],
  [354.5, 17.982], [360.5, 18.469], [366.5, 19.122], [372.5, 19.9], [378.5, 20.757], [384.5, 21.616], [390.5, 22.443], [396.5, 23.313],
  [402.5, 24.359], [408.5, 25.745], [414.5, 27.438], [420.5, 28.499], [426.5, 30.499], [432.5, 32.499], [438.5, 35.499], [444.5, 37.499],
  [450.5, 40.499], [456.5, 43.499], [462.5, 48.499], [468.5, 54.499], [474.5, 63.499], [480.5, 71.499], [486.5, 81.499], [492.5, 92.499],
  [498.5, 101.499], [504.5, 106.499], [510.5, 112.499], [516.5, 240.499], [522.5, 638.499], [528.5, 2299.499], [531, 2400],
];

// log10(segundos decorridos + 1) no segundo t do original (antes de 6,5 s e depois de 531 s: ver relogioRua)
export const logDecorrido = (t: number): number => {
  if (t <= L[0][0]) return 0;
  for (let i = 0; i < L.length - 1; i++) {
    const [a, la] = L[i], [b, lb] = L[i + 1];
    if (t <= b) return la + ((t - a) / (b - a)) * (lb - la);
  }
  return L[L.length - 1][1];
};
// segundos decorridos (so faz sentido ate ~1e300; depois disso use logDecorrido)
export const decorrido = (t: number) => Math.pow(10, Math.min(300, logDecorrido(t))) - 1;
export const anos = (t: number) => decorrido(t) / ANO;
// velocidade: segundos la fora por segundo do video (derivada numerica), em log10
export const logTaxa = (t: number) => {
  const h = 0.05, a = logDecorrido(t - h), b = logDecorrido(t + h);
  // d/dt 10^L = 10^L * ln10 * dL/dt
  return b + Math.log10(Math.max(1e-9, Math.LN10 * (b - a) / (2 * h)));
};
// hora do dia (0..24) e dia do ano (0..365) da historia: o Sol, as estacoes e as luzes da rua dependem disto
const HORA0 = 17 + 42 / 60 + 7 / 3600, DIA0 = 284; // 12/out = dia 284 do ano contando de 0 (0 = 1/jan, meia-noite)
export const horaDoDia = (t: number) => { const s = t >= T_VOLTA ? (t - T_VOLTA) : decorrido(t); return ((HORA0 + s / 3600) % 24 + 24) % 24; };
export const diaDoAno = (t: number) => { const s = t >= T_VOLTA ? 0 : decorrido(t); return ((DIA0 + (HORA0 + s / 3600) / 24) % 365.25 + 365.25) % 365.25; };
