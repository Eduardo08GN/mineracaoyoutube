// Duracao do dia ao longo do video (lida do original a cada 2 s) e grandezas derivadas, em unidades metricas.
// [segundo do video, minutos do dia]
// lido do painel do original por OCR a cada 1 s (mediana movel, nunca crescente)
const PONTOS: [number, number][] = [
  [0, 1440], [4, 1440], [6, 1440], [8, 1440], [10, 1440], [12, 1439], [14, 1437], [16, 1433], [18, 1427], [20, 1421], [22, 1414], [24, 1406], [26, 1397], [28, 1388], [30, 1374], [32, 1366], [34, 1359], [36, 1351], [38, 1343], [40, 1336], [42, 1328], [45, 1317], [47, 1309], [49, 1302], [51, 1295], [54, 1284], [57, 1273], [59, 1266], [62, 1241], [64, 1226], [66, 1210], [68, 1195], [70, 1181], [72, 1166], [74, 1152], [76, 1137], [78, 1123], [80, 1110], [82, 1096], [84, 1082], [87, 1062], [89, 1049], [91, 1036], [93, 1012], [96, 959], [99, 910], [101, 878], [103, 848], [105, 818], [107, 790], [109, 762], [111, 736], [113, 710], [115, 686], [117, 662], [119, 639], [122, 597], [124, 584], [126, 571], [128, 558], [130, 546], [132, 534], [134, 528], [137, 505], [139, 494], [141, 483], [143, 472], [145, 462], [148, 447], [150, 437], [152, 427], [156, 392], [158, 377], [160, 362], [164, 334], [166, 321], [168, 308], [170, 296], [172, 285], [174, 273], [176, 263], [179, 247], [181, 232], [183, 222], [186, 207], [188, 197], [190, 188], [192, 180], [195, 168], [197, 160], [199, 153], [201, 146], [203, 140], [205, 133], [207, 127], [209, 120], [211, 118], [213, 117], [216, 115], [218, 113], [220, 113], [222, 111], [224, 109], [226, 108], [228, 107], [230, 105], [232, 104], [234, 103], [236, 102], [239, 99], [241, 99], [243, 98], [245, 97], [247, 96], [249, 95], [251, 95], [253, 94], [255, 93], [257, 92], [259, 92], [261, 91], [263, 90], [265, 90], [267, 89], [269, 89], [271, 88], [273, 88], [275, 88], [277, 87], [279, 87], [281, 87], [283, 86], [285, 86], [287, 85], [289, 85], [291, 85], [293, 84], [295, 84], [297, 84], [299, 83], [301, 83], [303, 83], [305, 82], [307, 82], [309, 82], [315, 81], [317, 80], [319, 78], [321, 76], [323, 73], [325, 71], [327, 69], [329, 67], [331, 65], [333, 63], [335, 61], [337, 59], [339, 57], [341, 55], [343, 54], [345, 52], [347, 50], [349, 48], [351, 46], [353, 45], [355, 43], [357, 42], [359, 40], [361, 39], [363, 38], [365, 37], [367, 35], [369, 34], [371, 33], [373, 32], [375, 31], [377, 28], [379, 26], [381, 25], [383, 23], [385, 21], [387, 20], [389, 18], [391, 17], [393, 16], [395, 15], [397, 14], [399, 13], [401, 12], [403, 11], [405, 10], [407, 8], [409, 7], [413, 5], [415, 4], [417, 4], [419, 3], [421, 3], [423, 2], [425, 2], [427, 2], [429, 2], [431, 1], [433, 1], [436, 1], [460, 0.8],
];

export const diaMin = (t: number): number => {
  if (t <= PONTOS[0][0]) return PONTOS[0][1];
  for (let i = 1; i < PONTOS.length; i++) {
    const [t1, v1] = PONTOS[i];
    if (t <= t1) {
      const [t0, v0] = PONTOS[i - 1];
      const u = (t - t0) / (t1 - t0);
      return Math.exp(Math.log(v0) + (Math.log(v1) - Math.log(v0)) * u);
    }
  }
  return PONTOS[PONTOS.length - 1][1];
};

export const fmtDia = (m: number): string => {
  if (m >= 60) {
    const h = Math.floor(m / 60), mm = Math.floor(m - h * 60);
    return `${h} h ${String(mm).padStart(2, '0')} min`;
  }
  return `${Math.max(1, Math.floor(m))} min`;  // o original nunca passa para segundos
};

// aceleracao centrifuga hoje no equador / g = 0,00346
export const fatorPeso = (m: number, latGraus = 0) => {
  const c = Math.cos((latGraus * Math.PI) / 180);
  return 1 - (1440 / m) ** 2 * 0.00346 * c * c;
};
export const PESO_KG = 82;
export const pesoTxt = (m: number, lat = 0): string => {
  const f = fatorPeso(m, lat);
  return f <= 0.005 ? 'NO PESAS NADA' : `PESAS ${Math.round(PESO_KG * f)} KG`;
};

export const velEquador = (m: number) => 40075 / (m / 60); // km/h

const COMPARA: [number, string][] = [
  [692000, 'MÁS RÁPIDO QUE LA NAVE MÁS RÁPIDA JAMÁS CONSTRUIDA'],
  [40270, 'MÁS RÁPIDO QUE LA VELOCIDAD DE ESCAPE'],
  [39897, 'MÁS RÁPIDO QUE EL APOLO 10, LO MÁS RÁPIDO QUE HA VIAJADO UN HUMANO'],
  [27600, 'TAN RÁPIDO COMO LA ESTACIÓN ESPACIAL'],
  [7274, 'MÁS RÁPIDO QUE EL AVIÓN MÁS RÁPIDO JAMÁS PILOTADO'],
  [4300, 'MÁS RÁPIDO QUE UNA BALA DE RIFLE'],
  [3540, 'MÁS RÁPIDO QUE EL SR-71 BLACKBIRD'],
  [1235, 'MÁS RÁPIDO QUE EL SONIDO'],
];
export const comparaTxt = (m: number): string => {
  const v = velEquador(m);
  for (const [lim, txt] of COMPARA) if (v >= lim) return `EL ECUADOR SE MUEVE ${txt}`;
  return 'EL ECUADOR SE MUEVE';
};
export const velTxt = (m: number) => `EL ECUADOR SE MUEVE A ${Math.round(velEquador(m)).toLocaleString('es-ES')} KM/H`;

// gravidade efetiva no equador (m/s2), usada pela fonte e pelos objetos
export const gEf = (m: number) => Math.max(0, 9.81 * fatorPeso(m, 0));

// Fase das gotas de um jato: integral de dt / vida(t), com vida = min(2 v / g, vidaMax) e g = gEf do dia daquele instante.
// Usar fract(t / vida) com vida mudando a cada quadro fazia cada gota pular para outro ponto do arco a cada quadro
// (aos 244 s, 1% de mudanca na vida desloca a fase em 2,4 voltas). Integrada, a fase anda suave e continua deterministica.
const FASES = new Map<string, Float64Array>();
export const faseJato = (t: number, v: number, gMin: number, vidaMax: number) => {
  const chave = `${v}|${gMin}|${vidaMax}`, dt = 1 / 30;
  let F = FASES.get(chave);
  if (!F) {
    F = new Float64Array(Math.ceil(470 / dt) + 2);
    for (let i = 1; i < F.length; i++) {
      const g = Math.max(gEf(diaMin((i - 0.5) * dt)), gMin);
      F[i] = F[i - 1] + dt / Math.min((2 * v) / g, vidaMax);
    }
    FASES.set(chave, F);
  }
  const x = Math.max(0, Math.min(t / dt, F.length - 2)), i = Math.floor(x);
  return F[i] + (F[i + 1] - F[i]) * (x - i);
};
