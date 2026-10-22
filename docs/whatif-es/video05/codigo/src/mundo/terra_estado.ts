// Estado da paisagem (agente Terra): tudo o que o chao faz em cada segundo do ORIGINAL (116-309,6 s), como funcao pura de t.
// O shader do chao (terra_chao.tsx), as arvores (terra_arvores.tsx) e o perfil do look (terra.tsx) leem daqui.
import {alturaOlho} from '../roteiro';

// interpolacao por chaves [t, valor] com suavizacao (smoothstep) entre chaves vizinhas
export const chaves = (t: number, K: [number, number][]) => {
  if (t <= K[0][0]) return K[0][1];
  for (let i = 0; i < K.length - 1; i++) {
    const [a, va] = K[i], [b, vb] = K[i + 1];
    if (t <= b) { const u = Math.min(1, Math.max(0, (t - a) / Math.max(1e-6, b - a))); return va + (vb - va) * u * u * (3 - 2 * u); }
  }
  return K[K.length - 1][1];
};
// janela [a sobe ate b] ... [c desce ate d]
const jan = (t: number, a: number, b: number, c: number, d: number) =>
  t < a || t > d ? 0 : t < b ? (t - a) / (b - a) : t > c ? 1 - (t - c) / (d - c) : 1;
const soma = (...v: number[]) => Math.min(1, v.reduce((x, y) => x + y, 0));

// fases de gelo (estrobo glacial incluso): lencol cobre o chao
export const geloEm = (t: number) => soma(
  jan(t, 129.0, 129.3, 141.38, 141.45), jan(t, 142.95, 143.05, 144.0, 144.1),
  jan(t, 147.05, 147.15, 147.75, 147.85), jan(t, 149.15, 149.25, 150.15, 150.25));

export type EstadoTerra = {
  t: number;
  hc: number;          // altura do chao debaixo da camera (m)
  base: number;
  marCid: boolean;     // desenhar o MarHorizonte do agente Cidade        // altura da terra firme (0 nas fases de gelo: o lencol e que te levanta)
  fendaPe: number;     // posicao (m) da fenda que passa debaixo dos pes; -99 = nenhuma
  // superficie do chao "comum" (pesos 0..1; a transicao e salpicada por ruido no shader)
  grama: number; seca: number; areia: number; rocha: number; cinza: number; morte: number; geada: number;
  gelo: number; parede: number; fluxo: number; soprada: number;   // lencol de gelo, parede azul a direita, fendas, neve soprada
  degelo: number;      // agua de degelo turquesa por cima de tudo
  canion: number; camadas: number;   // profundidade do canion (m) e quantas camadas/escurecimento
  mont: number; eros: number; capR: number; neve: number; rochaLinha: number;   // cordilheira
  morro: number; colinas: number; dunas: number;   // o morro onde voce esta, colinas no horizonte, dunas
  agua: number; aguaNivel: number; baciaR: number; baciaProf: number; corAgua: [number, number, number]; sal: number;   // lago/mar no horizonte, salinas
  oasis: number;       // faixa do oasis (umidade/verde no deserto)
  sombraNuvem: number; ventoNuvem: number;   // sombras de nuvem correndo no chao
  poeira: number;      // poeira soprada rente ao chao
  nuvemBaixa: number;  // mar de nuvens abaixo do cume
  chuva: number; flash: number;
  arvores: number;     // floresta (0 some, 1 inteira)
  brancoArvores: number; // geada nas copas
};

export const estadoTerra = (t: number): EstadoTerra => {
  const hc = Math.max(0, alturaOlho(t) - 1.7);
  const gelo = geloEm(t);
  const degelo = jan(t, 141.36, 141.42, 141.78, 141.86);
  const cinza = jan(t, 141.78, 141.86, 142.95, 143.05);
  const canion = chaves(t, [[162.5, 0], [162.72, 380], [164.2, 1250], [166.2, 1600], [187.2, 1600], [187.6, 0]]);
  // superficie: grama ate 206, amarela 206-208, areia 208-231,5, rocha 231,5-235, morte depois de 252
  const seca = chaves(t, [[206, 0], [207.6, 1], [209, 1]]);
  const areia = chaves(t, [[207.4, 0], [209.2, 1], [231.5, 1], [235, 0]]);
  const rocha = chaves(t, [[231.5, 0], [235, 1]]);
  const morte = chaves(t, [[251, 0], [258, 1]]);
  const geada = t < 129.6 ? chaves(t, [[127.5, 0], [129, 1]]) : 0;
  const grama = 1;
  // agua: lago no horizonte (116-129, 144-162,5), degelo, mar fino (228,5-244), salinas (245-256)
  const lago = false;   // 116-162,5: o mar do agente Cidade (MarHorizonte) continua no horizonte; o lago proprio ficou desligado
  const mar = chaves(t, [[228.55, 0], [229.3, 1], [240, 1], [245.5, 0]]);
  const sal = chaves(t, [[243.5, 0], [246, 1], [251, 1], [257, 0]]);
  let agua = 0, aguaNivel = -1e5, baciaR = 1e6, baciaProf = 0;
  let corAgua: [number, number, number] = [0.32, 0.5, 0.62];
  if (degelo > 0) { agua = degelo; aguaNivel = hc - 0.35; corAgua = [0.12, 0.62, 0.66]; }
  else if (lago) { agua = 1; aguaNivel = -43; baciaR = 1250; baciaProf = 10; }
  else if (t >= 228.55 && t < 262) {
    // mar a ~8 km, abaixo da planicie (118 m). Ferve 239,5-246: o nivel baixa e sobra a bacia de sal
    agua = mar; aguaNivel = chaves(t, [[239.5, 0], [246, -60]]); baciaR = 4500; baciaProf = 200; corAgua = [0.02, 0.13, 0.5];
  }
  if (t >= 245.5 && t < 262) { baciaR = 3200; baciaProf = 200; }
  const morro = t < 202.3 ? 40 : chaves(t, [[202.3, 40], [205, 25]]);
  const colinas = chaves(t, [[116, 30], [162.5, 30], [175, 0], [182.5, 0], [186.5, 260], [187.6, 260], [202.5, 220], [206, 160], [209, 60], [231, 30], [260, 15]]);
  const dunas = chaves(t, [[207.5, 0], [210, 2.2], [231, 2.2], [235, 0.8]]);
  const mont = chaves(t, [[187.25, 0], [187.7, 1], [200.8, 1], [202.2, 0]]);
  const eros = chaves(t, [[196, 0], [200.5, 1]]);
  const capR = chaves(t, [[188.5, 60], [189.5, 48], [196, 48], [201.5, 900]]);
  // neve: linha fixa na subida (cume nevado em 189,3); na erosao acompanha o cume que baixa, e some em 200,5
  const neve = t < 196 ? 2650 : t < 200.4 ? Math.min(2650, hc - 250) : chaves(t, [[200.4, Math.min(2650, hc - 250)], [200.8, 9000]]);
  const sombraNuvem = t < 129 ? 0.9 : t < 150.4 ? (gelo > 0.5 ? 0.35 : 0.6) : t < 202 ? 0.8 : t < 239 ? 0.55 : t < 251 ? 1 : chaves(t, [[251, 1], [253, 0.15]]);
  const ventoNuvem = t < 239 ? 1 : 2.4;
  const poeira = t < 209 ? 0 : chaves(t, [[209, 0.35], [235, 0.5], [252, 0.7]]);
  const nuvemBaixa = chaves(t, [[190.2, 0], [191.4, 1], [196.2, 1], [197.6, 0]]);
  const chuva = chaves(t, [[200.4, 0], [200.6, 1], [201.2, 1], [201.6, 0]]);
  const flash = t >= 145.5 && t < 145.95 ? Math.pow(1 - (t - 145.5) / 0.45, 1.6) : 0;
  // floresta: ate a geada; volta na grama do estrobo; some quando o chao cai no canion
  const arvores = t < 129.25 ? chaves(t, [[127.9, 1], [129.2, 0]]) :
    t < 144.1 ? 0 : t < 162.5 ? (1 - gelo) : 0;
  const brancoArvores = chaves(t, [[127.4, 0], [128.6, 1]]);
  const oasis = chaves(t, [[205.5, 0], [208, 1], [224.5, 1], [228.5, 0]]);
  const base = gelo > 0.001 || degelo > 0.001 ? 0 : hc;
  const fendaPe = t > 137.6 && t < 141.2 ? chaves(t, [[137.6, -9], [138.2, -5], [140.8, 5], [141.2, 9]]) : -99;
  // mar do agente Cidade no horizonte (116-162,5), escondido quando o gelo/degelo/planicie cinza cobre o chao
  const marCid = t < 162.55 && !(t > 128.9 && t < 144.1) && gelo < 0.5;
  return {t, hc, base, marCid, fendaPe, grama, seca, areia, rocha, cinza, morte, geada, gelo, parede: gelo * chaves(t, [[131.6, 0], [132.6, 1]]) * (t < 141.5 ? 1 : 0),
    fluxo: (t - 129) * 7.5, soprada: gelo, degelo, canion, camadas: chaves(t, [[162.7, 0], [166.2, 1]]), mont, eros, capR, neve, rochaLinha: t < 196 ? 900 : Math.min(900, Math.max(250, hc * 0.35)),
    morro, colinas, dunas, agua, aguaNivel, baciaR, baciaProf, corAgua, sal, oasis, sombraNuvem, ventoNuvem, poeira, nuvemBaixa, chuva, flash,
    arvores, brancoArvores};
};
