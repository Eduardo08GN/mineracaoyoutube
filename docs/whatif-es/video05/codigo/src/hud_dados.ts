// Dados do painel (dono: agente HUD). Tabelas lidas do original; formatos em espanhol (escala longa).
// log10(segundos decorridos + 1) lido do painel do original a cada 3 s (teste/mapa/hud_*.jpg)
const LOG_E: [number, number][] = [
  [6.5, 0.0000], [9.5, 0.6021], [12.5, 1.0792], [15.5, 1.5798], [18.5, 2.1492], [21.5, 2.6758], [24.5, 3.3084], [27.5, 4.0746],
  [30.5, 4.6461], [33.5, 4.9046], [36.5, 5.1041], [39.5, 5.3617], [42.5, 5.6180], [45.5, 6.0086], [48.5, 6.4683], [51.5, 6.7076],
  [54.5, 7.0294], [57.5, 7.2577], [60.5, 7.4997], [63.5, 7.6978], [66.5, 7.9305], [69.5, 8.0554], [72.5, 8.2550], [75.5, 8.4396],
  [78.5, 8.6364], [81.5, 8.8360], [84.5, 9.0640], [87.5, 9.2824], [90.5, 9.5065], [93.5, 9.7288], [96.5, 9.9520], [99.5, 10.1765],
  [102.5, 10.4010], [105.5, 10.6255], [108.5, 10.8505], [111.5, 11.0767], [114.5, 11.3023], [117.5, 11.5184], [120.5, 11.7224], [123.5, 11.9194],
  [126.5, 12.1145], [129.5, 12.3073], [132.5, 12.4902], [135.5, 12.6663], [138.5, 12.8315], [141.5, 12.9918], [144.5, 13.1484], [147.5, 13.3025],
  [150.5, 13.4557], [153.5, 13.6090], [156.5, 13.7611], [159.5, 13.9104], [162.5, 14.0623], [165.5, 14.2141], [168.5, 14.3659], [171.5, 14.5161],
  [174.5, 14.6604], [177.5, 14.8023], [180.5, 14.9384], [183.5, 15.0673], [186.5, 15.1893], [189.5, 15.3046], [192.5, 15.4134], [195.5, 15.5161],
  [198.5, 15.6130], [201.5, 15.7032], [204.5, 15.7869], [207.5, 15.8665], [210.5, 15.9384], [213.5, 16.0070], [216.5, 16.0708], [219.5, 16.1316],
  [222.5, 16.1893], [225.5, 16.2434], [228.5, 16.2957], [231.5, 16.3454], [234.5, 16.3929], [237.5, 16.4381], [240.5, 16.4814], [243.5, 16.5244],
  [246.5, 16.5636], [249.5, 16.6029], [252.5, 16.6390], [255.5, 16.6781], [258.5, 16.7166], [261.5, 16.7520], [264.5, 16.7891], [267.5, 16.8254],
  [270.5, 16.8627], [273.5, 16.8988], [276.5, 16.9337], [279.5, 16.9689], [282.5, 17.0043], [285.5, 17.0394], [288.5, 17.0731], [291.5, 17.1076],
  [294.5, 17.1406], [297.5, 17.1730], [300.5, 17.2041], [303.5, 17.2339], [306.5, 17.2633], [309.5, 17.2915], [312.5, 17.3186], [315.5, 17.3454],
  [318.5, 17.3713], [321.5, 17.3962], [324.5, 17.4208], [327.5, 17.4446], [330.5, 17.4681], [333.5, 17.4921], [336.5, 17.5203], [339.5, 17.5522],
  [342.5, 17.5960], [345.5, 17.6514], [348.5, 17.7244], [351.5, 17.8275], [354.5, 17.9820], [357.5, 18.1963], [360.5, 18.4685], [363.5, 18.7801],
  [366.5, 19.1224], [369.5, 19.4978], [372.5, 19.9005], [375.5, 20.3239], [378.5, 20.7568], [381.5, 21.1928], [384.5, 21.6164], [387.5, 22.0319],
  [390.5, 22.4431], [393.5, 22.8646], [396.5, 23.3134], [399.5, 23.8045], [402.5, 24.3594], [405.5, 25.0056], [408.5, 25.7446], [411.5, 26.5598],
  [414.5, 27.4376], [417.5, 28.3546], [420.5, 28.9491], [423.5, 29.9491], [426.5, 30.9491], [429.5, 31.9491], [432.5, 32.9491], [435.5, 34.9491],
  [438.5, 35.9491], [441.5, 36.9491], [444.5, 37.9491], [447.5, 39.9491], [450.5, 40.9491], [453.5, 42.9491], [456.5, 43.9491], [459.5, 45.9491],
  [462.5, 48.9491], [465.5, 51.9491], [468.5, 54.9491], [471.5, 58.9491], [474.5, 63.9491], [477.5, 67.9491], [480.5, 71.9491], [483.5, 76.9491],
  [486.5, 81.9491], [489.5, 86.9491], [492.5, 92.9491], [495.5, 97.9491], [498.5, 101.9491], [501.5, 104.9491], [504.5, 106.9491], [507.5, 108.9491],
  [510.5, 112.9491], [513.5, 151.9491], [516.5, 240.9491], [519.5, 371.9491], [522.5, 638.9491], [525.5, 1259.9491], [528.5, 2299.9491], [531, 2407.4991],
];
// log10(segundos la fora por segundo seu): a subline "ONE SECOND FOR YOU = X" lida a cada 3 s
const LOG_R: [number, number][] = [
  [6.5, 0.0000], [9.5, 0.1461], [12.5, 0.6335], [15.5, 1.2041], [18.5, 1.7924], [21.5, 2.3487], [24.5, 3.0615], [27.5, 3.9525],
  [30.5, 4.0434], [33.5, 4.0878], [36.5, 4.3423], [39.5, 4.6898], [42.5, 5.0392], [45.5, 5.4362], [48.5, 5.7932], [51.5, 6.0918],
  [54.5, 6.3379], [57.5, 6.5472], [60.5, 6.7274], [63.5, 6.8763], [66.5, 7.0274], [69.5, 7.1952], [72.5, 7.3837], [75.5, 7.6074],
  [78.5, 7.8376], [81.5, 8.0626], [84.5, 8.2873], [87.5, 8.5119], [90.5, 8.7372], [93.5, 8.9630], [96.5, 9.1875], [99.5, 9.4124],
  [102.5, 9.6390], [105.5, 9.8627], [108.5, 10.0857], [111.5, 10.3180], [114.5, 10.5337], [117.5, 10.7254], [120.5, 10.9077], [123.5, 11.0953],
  [126.5, 11.2887], [129.5, 11.4717], [132.5, 11.6326], [135.5, 11.7824], [138.5, 11.9256], [141.5, 12.0754], [144.5, 12.2250], [147.5, 12.3747],
  [150.5, 12.5244], [153.5, 12.6752], [156.5, 12.8254], [159.5, 12.9748], [162.5, 13.1275], [165.5, 13.2809], [168.5, 13.4301], [171.5, 13.5673],
  [174.5, 13.7032], [177.5, 13.8295], [180.5, 13.9478], [183.5, 14.0506], [186.5, 14.1475], [189.5, 14.2395], [192.5, 14.3252], [195.5, 14.4022],
  [198.5, 14.4704], [201.5, 14.5285], [204.5, 14.5783], [207.5, 14.6262], [210.5, 14.6723], [213.5, 14.7139], [216.5, 14.7520], [219.5, 14.7869],
  [222.5, 14.8213], [225.5, 14.8551], [228.5, 14.8865], [231.5, 14.9157], [234.5, 14.9431], [237.5, 14.9689], [240.5, 14.9933], [243.5, 15.0189],
  [246.5, 15.0469], [249.5, 15.0754], [252.5, 15.1055], [255.5, 15.1386], [258.5, 15.1721], [261.5, 15.2067], [264.5, 15.2403], [267.5, 15.2736],
  [270.5, 15.3053], [273.5, 15.3367], [276.5, 15.3689], [279.5, 15.4006], [282.5, 15.4321], [285.5, 15.4624], [288.5, 15.4908], [291.5, 15.5161],
  [294.5, 15.5405], [297.5, 15.5598], [300.5, 15.5783], [303.5, 15.5925], [306.5, 15.6063], [309.5, 15.6197], [312.5, 15.6326], [315.5, 15.6483],
  [318.5, 15.6635], [321.5, 15.6752], [324.5, 15.6866], [327.5, 15.7005], [330.5, 15.7244], [333.5, 15.7824], [336.5, 15.8829], [339.5, 16.0123],
  [342.5, 16.1637], [345.5, 16.3284], [348.5, 16.5405], [351.5, 16.8151], [354.5, 17.1295], [357.5, 17.4718], [360.5, 17.8254], [363.5, 18.1794],
  [366.5, 18.5636], [369.5, 18.9733], [372.5, 19.4033], [375.5, 19.8415], [378.5, 20.2823], [381.5, 20.7139], [384.5, 21.1244], [387.5, 21.5285],
  [390.5, 21.9463], [393.5, 22.3862], [396.5, 22.8665], [399.5, 23.4038], [402.5, 24.0215], [405.5, 24.7321], [408.5, 25.5203], [411.5, 26.3753],
  [414.5, 27.2765], [417.5, 28.2092], [420.5, 28.9491], [423.5, 29.9491], [426.5, 30.9491], [429.5, 31.9491], [432.5, 32.9491], [435.5, 34.9491],
  [438.5, 35.9491], [441.5, 36.9491], [444.5, 37.9491], [447.5, 39.9491], [450.5, 40.9491], [453.5, 42.9491], [456.5, 44.9491], [459.5, 46.9491],
  [462.5, 48.9491], [465.5, 51.9491], [468.5, 55.9491], [471.5, 59.9491], [474.5, 63.9491], [477.5, 67.9491], [480.5, 72.9491], [483.5, 76.9491],
  [486.5, 82.9491], [489.5, 87.9491], [492.5, 92.9491], [495.5, 97.9491], [498.5, 101.9491], [501.5, 104.9491], [504.5, 106.9491], [507.5, 108.9491],
  [510.5, 113.9491], [513.5, 153.9491], [516.5, 242.9491], [519.5, 374.9491], [522.5, 641.9491], [525.5, 1262.9491], [528.5, 2302.9491], [531, 2407.4991],
];

// ---------------------------------------------------------------------------------------------------------------------
// Painel (HUD) do video 5 em espanhol. Tudo aqui e funcao pura de t (segundo do ORIGINAL). Escala longa do espanhol:
// 1e6 millones, 1e9 mil millones, 1e12 billones, 1e15 mil billones, 1e18 trillones; de 1e21 em diante, potencia de 10.
// ---------------------------------------------------------------------------------------------------------------------
export const ANO_S = 31557600;
const LOG_ANO = Math.log10(ANO_S);
const Y0 = 2026.7806; // segunda-feira, 12/out/2026, 17:42:07 em anos decimais
const BASE_MS = Date.UTC(2026, 9, 12, 17, 42, 7);
export const T_COLD = 312.5; // o cold open mostra o painel de 312,5 s adiante (6,66 -> 7,37 mil millones; 5 min 06 s)
export const T_VOLTA_HUD = 531;

const interpTab = (K: [number, number][], t: number) => {
  if (t <= K[0][0]) return K[0][1];
  for (let i = 0; i < K.length - 1; i++) {
    const [a, la] = K[i], [b, lb] = K[i + 1];
    if (t <= b) return la + ((t - a) / (b - a)) * (lb - la);
  }
  return K[K.length - 1][1];
};
// tempo do painel: no cold open adianta 312,5 s; depois de 531 s o relogio recomeca em 17:42:07
const tPainel = (t: number) => (t < 6.4 ? t + T_COLD : t >= T_VOLTA_HUD ? 6.5 + 0.86 * (t - T_VOLTA_HUD) : t); // 534,5 s: 5:42:10 e 1,4 s como o original
export const logE = (t: number) => interpTab(LOG_E, tPainel(t));
export const logR = (t: number) => interpTab(LOG_R, tPainel(t));

// ---------- numeros ----------
export type Seg = {t: string; sup?: boolean};
const dec = (s: string) => s.replace('.', ',');
const sep = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const sig3 = (v: number) => { const p = Math.pow(10, Math.floor(Math.log10(v)) - 2); return Math.round(v / p) * p; };
const mant = (m: number) => dec(m < 10 ? m.toFixed(2) : m < 100 ? m.toFixed(1) : m.toFixed(0));
const ESC: [number, string][] = [[1e6, 'millones'], [1e9, 'mil millones'], [1e12, 'billones'], [1e15, 'mil billones'], [1e18, 'trillones']];
// v >= 1e6 e < 1e21 -> "1,83 millones", "6,66 mil millones", "100,0 trillones"
const grande = (v: number) => {
  let i = ESC.length - 1;
  while (i > 0 && v < ESC[i][0]) i--;
  if (v / ESC[i][0] >= 999.5 && i < ESC.length - 1) i++;
  return `${mant(v / ESC[i][0])} ${ESC[i][1]}`;
};
const potencia = (logv: number): Seg[] => [{t: '10'}, {t: sep(Math.floor(logv + 1e-12)), sup: true}];

// ano do calendario a partir de log10(segundos decorridos)
const anoSegs = (le: number): Seg[] => {
  const la = le - LOG_ANO;
  if (la >= 21) return potencia(la);
  const y = Y0 + Math.pow(10, la);
  if (y < 1e4) return [{t: String(Math.floor(y))}];
  if (y < 1e5) return [{t: sep(Math.round(y / 10) * 10)}];
  if (y < 1e6) return [{t: sep(Math.round(y / 1000) * 1000)}];
  return [{t: grande(y)}];
};
// quantidade de anos (taxa e contagem): "872 años", "6.635 años", "19.500 años", "48,2 millones de años", "10^40 años"
const anosSegs = (la: number, maiusc: boolean): Seg[] => {
  const A = maiusc ? ' AÑOS' : ' años', DE = maiusc ? ' DE AÑOS' : ' de años';
  if (la >= 21) return [...potencia(la), {t: A}];
  const y = Math.pow(10, la);
  const up = (s: string) => (maiusc ? s.toUpperCase() : s);
  if (y < 100) return [{t: up(dec(y < 10 ? y.toFixed(2) : y.toFixed(1))) + A}];
  if (y < 1e4) return [{t: sep(y) + A}];
  if (y < 1e6) return [{t: sep(sig3(y)) + A}];
  return [{t: up(grande(y)) + DE}];
};
const f3 = (x: number) => dec(x < 10 ? x.toFixed(2) : x < 100 ? x.toFixed(1) : x.toFixed(0));

// "UN SEGUNDO PARA TI = X"
export const taxaSegs = (lr: number): Seg[] => {
  const r = Math.pow(10, Math.min(300, lr));
  if (r < 10) { const s = dec(r.toFixed(1)); return [{t: s === '1,0' ? '1 SEGUNDO' : `${s} SEGUNDOS`}]; }
  if (r < 100) return [{t: `${Math.round(r)} SEGUNDOS`}];
  if (r < 7200) return [{t: `${f3(r / 60)} MINUTOS`}];
  if (r < 172800) return [{t: `${f3(r / 3600)} HORAS`}];
  if (r < 60 * 86400) return [{t: `${f3(r / 86400)} DÍAS`}];
  if (r < 2 * ANO_S) return [{t: `${f3(r / (ANO_S / 12))} MESES`}];
  const la = lr - LOG_ANO;
  if (la < 2) return [{t: `${f3(Math.pow(10, la))} AÑOS`}];
  return anosSegs(la, true);
};

// ---------- linha PROXIMO ----------
type Ev = {nome: string; alvo: number; un: 's' | 'd' | 'a'}; // alvo: log10(segundos decorridos) do evento
const S = (s: number) => Math.log10(s), Dd = (d: number) => Math.log10(d * 86400), A = (a: number) => Math.log10(a) + LOG_ANO;
const EVENTOS: Ev[] = [
  {nome: 'ATARDECER', alvo: S(2019), un: 's'},              // 18:15:46 (o original: Sunset in 33 min 39 s)
  {nome: 'AMANECER', alvo: S(47000), un: 's'},              // ~6:45 do dia 13 (a cena nasce em 30,6-31,2)
  {nome: 'LA PRIMERA NEVADA', alvo: Dd(48), un: 'd'},       // a neve cobre tudo em 50,3
  {nome: 'AÑO NUEVO', alvo: Dd(80.262), un: 'd'},
  {nome: 'PRIMAVERA', alvo: Dd(158.3), un: 'd'},            // 20/mar/2027: o degelo da cena em 55,8-56,2
  {nome: 'EL AÑO 2030', alvo: A(2030 - Y0), un: 'a'},
  {nome: 'EL AÑO 2050', alvo: A(2050 - Y0), un: 'a'},
  {nome: 'EL AÑO 2100', alvo: A(2100 - Y0), un: 'a'},
  {nome: 'EL AÑO 3000', alvo: A(3000 - Y0), un: 'a'},
  {nome: 'EL AÑO 10.000', alvo: A(10000 - Y0), un: 'a'},
  {nome: 'UNA ESTRELLA EXPLOTA', alvo: A(31500), un: 'a'},  // supernova em 125,3
  {nome: 'VUELVE EL HIELO', alvo: A(58050), un: 'a'},       // gelo em 129
  {nome: 'UN ASTEROIDE', alvo: A(499500), un: 'a'},         // flash em 145,5
  {nome: 'UNA ESTRELLA PASA CERCA', alvo: A(1.2917e6), un: 'a'},
  {nome: 'NUEVAS MONTAÑAS', alvo: A(50.0e6), un: 'a'},
  {nome: 'UN SOLO SUPERCONTINENTE', alvo: A(250e6), un: 'a'},
  {nome: 'EL ÚLTIMO ÁRBOL', alvo: A(600e6), un: 'a'},
  {nome: 'LOS OCÉANOS HIERVEN', alvo: A(1.10e9), un: 'a'},
  {nome: 'EL ÚLTIMO SER VIVO', alvo: A(2.80e9), un: 'a'},
  {nome: 'LLEGA ANDRÓMEDA', alvo: A(4.50e9), un: 'a'},
  {nome: 'EL SOL TE ALCANZA', alvo: A(7.59e9), un: 'a'},
  {nome: 'LA ÚLTIMA GALAXIA SE APAGA', alvo: A(150e9), un: 'a'},
  {nome: 'LA ÚLTIMA ESTRELLA SE APAGA', alvo: A(100e12), un: 'a'},
  {nome: 'LA GALAXIA SE DESHACE', alvo: A(1e20), un: 'a'},
  {nome: 'EL ÚLTIMO ÁTOMO', alvo: A(1e40), un: 'a'},
  {nome: 'EL ÚLTIMO AGUJERO NEGRO', alvo: A(1e100), un: 'a'},
];
const pad2 = (n: number) => String(n).padStart(2, '0');
const hms = (c: number) => {
  if (c < 60) return `${Math.max(1, Math.floor(c))} s`;
  if (c < 3600) return `${Math.floor(c / 60)} min ${pad2(Math.floor(c % 60))} s`;
  return `${Math.floor(c / 3600)} h ${pad2(Math.floor((c % 3600) / 60))} min`;
};
const dias = (d: number) => { const n = Math.max(1, Math.round(d)); return n === 1 ? '1 día' : `${n} días`; };
export const proximo = (le: number): {evento: string; em: Seg[]; nunca?: boolean} => {
  const ev = EVENTOS.find((e) => e.alvo > le);
  if (!ev) return {evento: 'NADA', em: [{t: 'nunca'}], nunca: true};
  if (ev.un === 's') return {evento: ev.nome, em: [{t: hms(Math.pow(10, ev.alvo) - Math.pow(10, le))}]};
  if (ev.un === 'd') { const c = Math.pow(10, ev.alvo) - Math.pow(10, le); return {evento: ev.nome, em: [{t: c < 86400 ? hms(c) : dias(c / 86400)}]}; }
  // anos: contagem = alvo - decorrido, em anos (a subtracao em double reproduz o 10^40 -> 10^39 do original)
  const c = Math.pow(10, ev.alvo - LOG_ANO) - Math.pow(10, le - LOG_ANO);
  if (c < 1 / 12) return {evento: ev.nome, em: [{t: dias(c * 365.25)}]};
  if (c < 2) { const m = Math.max(1, Math.round(c * 12)); return {evento: ev.nome, em: [{t: m === 1 ? '1 mes' : `${m} meses`}]}; }
  if (c < 100) return {evento: ev.nome, em: [{t: `${Math.round(c)} años`}]};
  return {evento: ev.nome, em: anosSegs(Math.log10(c), false)};
};

// ---------- relogio e calendario (primeiros 65 s e a volta em 531 s) ----------
const DIAS = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const data = (le: number) => new Date(BASE_MS + (Math.pow(10, le) - 1) * 1000);
const h12 = (h: number) => (h % 12 === 0 ? 12 : h % 12);
const ampm = (h: number) => (h < 12 ? 'a. m.' : 'p. m.');

// ---------- sublines da direita (instantes do mapa de acoes) ----------
const FORA: [number, string][] = [
  [36, 'AHÍ FUERA: UN DÍA ENTERO'], [60, 'AHÍ FUERA: UN AÑO ENTERO'], [89, 'AHÍ FUERA: UNA VIDA HUMANA'],
  [114, 'AHÍ FUERA: MÁS QUE LA HISTORIA DE LA ESCRITURA'], [140, 'AHÍ FUERA: MÁS QUE LA HISTORIA DE LA HUMANIDAD'],
  [192, 'AHÍ FUERA: MÁS QUE DESDE LOS DINOSAURIOS'], [225, 'AHÍ FUERA: MÁS QUE LA EXISTENCIA DE LOS ANIMALES'],
  [296, 'AHÍ FUERA: MÁS QUE LA EDAD DE LA TIERRA'], [345, 'AHÍ FUERA: MÁS QUE LA EDAD DEL UNIVERSO'],
  [378, 'AHÍ FUERA: MIL VECES LA EDAD DEL UNIVERSO'], [418, 'AHÍ FUERA: YA NO HAY COMPARACIÓN'],
];
const segundosDePe = (n: number) => (n < 60 ? (n === 1 ? '1 segundo' : `${n} segundos`) : `${Math.floor(n / 60)} min ${pad2(n % 60)} s`);

export type Hud = {
  rotulo: string; valor: Seg[]; taxa: Seg[]; prox: {evento: string; em: Seg[]; nunca?: boolean} | null;
  dirRotulo: string; dirValor: string; dirSub: string | null;
};
// estado completo do painel no segundo t do original
export const hudEm = (t: number): Hud => {
  const le = logE(t), lr = logR(t);
  const tp = tPainel(t); // fase do relogio/calendario
  let rotulo = 'EL AÑO', valor: Seg[];
  if (tp < 65.5) {
    const d = data(le), h = d.getUTCHours(), dia = DIAS[d.getUTCDay()], mes = MESES[d.getUTCMonth()];
    if (tp < 27) {
      rotulo = `${dia}, ${d.getUTCDate()} DE ${mes.toUpperCase()}`;
      const seg = lr < 2 ? `:${pad2(d.getUTCSeconds())}` : '';
      valor = [{t: `${h12(h)}:${pad2(d.getUTCMinutes())}${seg} ${ampm(h)}`}];
    } else if (tp < 46.5) {
      rotulo = tp < 38 ? `${dia} · ${h12(h)} ${ampm(h).toUpperCase()}` : dia;
      valor = [{t: `${d.getUTCDate()} de ${mes}`}];
    } else {
      rotulo = 'LA FECHA';
      valor = [{t: `${mes} de ${d.getUTCFullYear()}`}];
    }
  } else valor = anoSegs(le);
  const dePe = Math.max(0, Math.floor(t < 6.4 ? 306 + t : t - 6.5));
  let dirSub: string | null = 'NO TE HAS MOVIDO';
  if (t < 6.4) dirSub = 'AHÍ FUERA: MÁS QUE LA EDAD DE LA TIERRA';
  else if (t >= T_VOLTA_HUD) dirSub = null;
  else for (const [a, s] of FORA) if (t >= a) dirSub = s;
  const prox = t < 6.4 || t >= T_VOLTA_HUD ? null : proximo(le);
  return {rotulo, valor, taxa: taxaSegs(lr), prox, dirRotulo: 'LLEVAS AQUÍ DE PIE', dirValor: segundosDePe(dePe), dirSub};
};

// fundo claro (neve, gelo, cume nevado): pilula escura atras da legenda e vinheta atras do painel. 0..1
const CLARO: [number, number][] = [[50.3, 56.2], [61.5, 62.6], [129, 150.4], [189, 198]];
export const claro = (t: number) => {
  let v = 0;
  for (const [a, b] of CLARO) v = Math.max(v, Math.min(1, Math.max(0, Math.min((t - a + 0.3) / 0.6, (b + 0.3 - t) / 0.6))));
  return v;
};
