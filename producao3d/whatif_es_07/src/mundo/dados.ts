// Dados e estados PUROS do malecon (sem React): listas por semente e o estado de cada coisa em funcao de (tw, p).
// O HUD importa daqui as ancoras dos rotulos presos aos objetos (mesma conta que o mundo usa para desenhar).
// Eixos: x ao longo da orla, y para cima, z para a terra (+) e para o mar (-, oeste).
import {rnd} from './comum';
import {DURACAO} from '../roteiro';
import {altChao, gEf, linhaAgua, nivelMar, pChegada, smooth} from '../fisica';
import type {Estado3D, Pessoa3D} from './pessoas';

export const FONTE: [number, number] = [0, 5];      // centro da fonte (x, z) no malecon
export const R_FONTE = 3.2;
export const Y_MAL = 0.75;
const cl = (a: number, b: number, x: number) => Math.min(b, Math.max(a, x));
const wrap = (x: number, L: number) => ((((x + L) % (2 * L)) + 2 * L) % (2 * L)) - L;

// ---------------------------------------------------------------- corrente: a agua entra pela praia e corre para dentro e ao longo da orla
export const CORRENTE: [number, number] = [0.9, 1.3];          // m/s quando a agua cobre o lugar
// deslocamento acumulado pela corrente desde p0 ate p (integral fechada: a forca cresce com a profundidade, aproximada por smooth)
export const derivaDesde = (p0: number, p: number, k = 1) => {
  if (p <= p0) return [0, 0] as [number, number];
  const dt = (p - p0) * DURACAO;
  const s = dt * (0.55 + 0.45 * smooth(0.5, 1, p)) * k;
  return [CORRENTE[0] * s, CORRENTE[1] * s] as [number, number];
};

// ---------------------------------------------------------------- gravidade integrada (fonte e pulos): G(tw) = integral de g dt
const PASSO = 1 / 240, NG = Math.ceil(DURACAO / PASSO) + 2;
const G_INT = (() => { const a = new Float64Array(NG); for (let i = 1; i < NG; i++) a[i] = a[i - 1] + gEf(((i - 0.5) * PASSO) / DURACAO) * PASSO; return a; })();
export const gIntegral = (tw: number) => { const x = cl(0, DURACAO, tw) / PASSO, i = Math.min(NG - 2, Math.floor(x)), f = x - i; return G_INT[i] * (1 - f) + G_INT[i + 1] * f + (tw > DURACAO ? (tw - DURACAO) * gEf(1) : 0); };
// lancamento balistico periodico com g variando: fase = G(t)/(2 v0); dentro do ciclo, tau com o g de agora
export const balistico = (tw: number, p: number, v0: number, fase0 = 0) => {
  const g = gEf(p), ph = (((gIntegral(tw) / (2 * v0) + fase0) % 1) + 1) % 1, T = (2 * v0) / g, tau = ph * T;
  return {tau, y: v0 * tau - 0.5 * g * tau * tau, vy: v0 - g * tau, T, ph};
};
export const V0_FONTE = 7.6;   // m/s: jato central de ~2,9 m hoje
export const alturaJato = (p: number) => (V0_FONTE * V0_FONTE) / (2 * gEf(p));

// ---------------------------------------------------------------- pessoas
export type Papel = 'passeio' | 'praia' | 'banho' | 'pulo' | 'voce';
export type Pessoa = Pessoa3D & {papel: Papel; dir: number; v: number; cai: boolean; reage: number};
export const PESSOAS: Pessoa[] = (() => {
  const L: Pessoa[] = []; let i = 0;
  const add = (o: Partial<Pessoa> & {x: number; z: number; papel: Papel}) => { L.push({i, rot: 0, pose: 'parado', dir: 1, v: 1.3, cai: false, reage: 0, y: Y_MAL, ...o} as Pessoa); i++; };
  // passeio no malecon (fora da fonte)
  for (let k = 0; k < 38; k++) {
    let x = -75 + rnd(k * 3 + 1) * 150, z = 2.4 + rnd(k * 3 + 2) * 7.2;
    if (Math.hypot(x - FONTE[0], z - FONTE[1]) < R_FONTE + 1.2) x += 9;
    const dir = rnd(k * 3 + 3) < 0.5 ? 1 : -1;
    add({x, z, papel: 'passeio', pose: 'andando', dir, v: 1.05 + rnd(k + 70) * 0.55, rot: dir > 0 ? Math.PI / 2 : -Math.PI / 2, cai: rnd(k + 90) < 0.3, reage: rnd(k + 110) * 0.05});
  }
  // praia: em pe, sentados e conversando perto dos guarda-sois
  for (let k = 0; k < 30; k++) {
    const x = -62 + rnd(k * 5 + 400) * 124, z = -26 + rnd(k * 5 + 401) * 22, r = rnd(k * 5 + 402);
    add({x, z, papel: 'praia', pose: r < 0.35 ? 'sentado' : r < 0.6 ? 'conversando' : 'parado', rot: rnd(k * 5 + 403) * Math.PI * 2, cai: rnd(k * 5 + 404) < 0.4,
      reage: 0.02 + rnd(k * 5 + 405) * 0.04, y: 0, fem: rnd(k * 5 + 406) < 0.5});
  }
  // banhistas
  for (let k = 0; k < 9; k++) add({x: -50 + rnd(k + 600) * 100, z: -44 + rnd(k + 610) * 9, papel: 'banho', pose: 'nadando', rot: rnd(k + 620) * 6.28, y: 0});
  // pulando perto da fonte (o pulo cresce quando o peso cai)
  [[-6.5, 9.2], [-6.0, 2.2], [6.6, 8.8]].forEach(([x, z], k) => add({x, z, papel: 'pulo', pose: 'parado', rot: -0.4 + k, reage: rnd(k + 700)}));
  // "voce": o boneco com o rotulo do peso
  add({x: 3.4, z: 8.9, papel: 'voce', pose: 'parado', rot: 2.4, camisa: '#f2b134', calca: '#1f3f8f', curta: true, fem: false});
  return L;
})();
export const IDX_VOCE = PESSOAS.findIndex((x) => x.papel === 'voce');

const PASSADA: Record<string, number> = {Walk_Loop: 1.45, Jog_Fwd_Loop: 2.6, Sprint_Loop: 3.9};
// corrida com aceleracao constante ate vMax (distancia em funcao do tempo, fechada)
const corrida = (tt: number, vMax: number, acel = 3.2) => { const tA = vMax / acel; return tt < tA ? 0.5 * acel * tt * tt : 0.5 * acel * tA * tA + vMax * (tt - tA); };

// estado de uma pessoa no quadro (tw = segundos do mundo, p = parametro)
export const estadoGente = (q: Pessoa, tw: number, p: number): Estado3D => {
  const s = (k: number) => rnd(q.i * 17 + k);
  const n = nivelMar(p);
  let x = q.x, z = q.z, ry = q.rot, clipe = 'Idle_Loop', tempo = tw + s(1) * 3;
  // antes da fuga
  if (q.papel === 'passeio') { x = wrap(q.x + q.dir * q.v * tw, 85); clipe = 'Walk_Loop'; tempo = (q.v * tw) / PASSADA.Walk_Loop + s(2); }
  else if (q.pose === 'sentado') clipe = 'Sitting_Idle_Loop';
  else if (q.pose === 'conversando') clipe = 'Idle_Talking_Loop';
  if (q.papel === 'banho') {
    const d = derivaDesde(0.25, p, 0.6);
    return {x: x + d[0], y: n - 1.15, z: z + d[1], ry: ry + 0.3 * Math.sin(tw * 0.4 + s(3) * 6), clipe: 'Swim_Idle_Loop', tempo: tw + s(4) * 3};
  }
  if (q.papel === 'pulo' || q.papel === 'voce') {
    // pulo de 3,0 m/s: 0,46 m hoje, ~2 m no fim; quem esta na agua funda flutua
    const b = balistico(tw, p, 3.0, s(5));
    const chao = Math.max(altChao(z), n - 1.0);
    const noAr = b.y > 0.08;
    return {x, y: chao + Math.max(0, b.y), z, ry, clipe: noAr ? 'Jump_Loop' : 'Jump_Land', tempo: noAr ? b.tau : 0.25 + b.ph * 0.4};
  }
  // fuga: a agua chega no lugar em pAgua; reage um pouco antes (quem esta na praia ve a agua subir; no malecon, quando ela passa o muro)
  const pAgua = pChegada(q.z);
  const p0 = pAgua - 0.05 - q.reage;
  if (p > p0) {
    const t0 = p0 * DURACAO, tt = tw - t0;
    // parte de onde estava quando reagiu (quem passeava parou de andar ali)
    if (q.papel === 'passeio') { x = wrap(q.x + q.dir * q.v * t0, 85); ry = q.dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
    const sx = (s(6) - 0.5) * 0.9;
    const levanta = q.pose === 'sentado' ? 0.8 : 0;
    if (tt < levanta) return {x, y: altChao(z), z, ry, clipe: 'Sitting_Exit', tempo: tt};
    const vMax = 4.4 + s(7) * 1.6, d = corrida(tt - levanta, vMax);
    // para dentro (+z) ate a calcada do outro lado (z = 21), depois ao longo da orla
    const dz = 21 - z, L1 = Math.hypot(dz, dz * sx);
    if (d < L1) { x += (sx * dz * d) / L1; z += (dz * d) / L1; ry = Math.atan2(sx, 1); }
    else { x += sx * dz + Math.sign(sx || 1) * (d - L1); z = 21; ry = Math.sign(sx || 1) * Math.PI / 2; }
    const v = Math.min(vMax, 3.2 * (tt - levanta));
    clipe = v > 4.0 ? 'Sprint_Loop' : v > 2 ? 'Jog_Fwd_Loop' : 'Walk_Loop'; tempo = d / PASSADA[clipe];
    // quem e alcancado cai e e arrastado: a agua chega no z atual
    if (q.cai) {
      const pCai = Math.max(p0 + 0.03, pChegada(z) + 0.01);
      if (p > pCai) {
        const tc = tw - pCai * DURACAO;
        // posicao congelada na queda (recalculada no instante pCai) + deriva da corrente
        const e0 = estadoGente({...q, cai: false}, pCai * DURACAO, pCai);
        const dr = derivaDesde(pCai, p, 1.0);
        const prof = Math.max(0, n - altChao(e0.z + dr[1]));
        return {x: e0.x + dr[0], y: Math.max(altChao(e0.z + dr[1]), n - 0.18 * smooth(0.2, 0.6, prof)), z: e0.z + dr[1], ry: e0.ry + tc * 0.6 * (s(8) - 0.5),
          clipe: tc < 2.4 ? 'Death01' : prof > 0.5 ? 'Swim_Idle_Loop' : 'Death01', tempo: tc < 2.4 ? tc : prof > 0.5 ? tc : 99};
      }
    }
  }
  return {x, y: altChao(z), z, ry, clipe, tempo};
};

// ---------------------------------------------------------------- guarda-sois, bolas, pranchas, carros
export type GuardaSol = {x: number; z: number; rot: number; cor: number};
export const GUARDA_SOIS: GuardaSol[] = (() => {
  const L: GuardaSol[] = [];
  for (let fila = 0; fila < 3; fila++) for (let k = 0; k < 15; k++) {
    const sd = fila * 100 + k;
    L.push({x: -63 + k * 9 + (rnd(sd) - 0.5) * 4 + fila * 3, z: -7.5 - fila * 6.5 + (rnd(sd + 50) - 0.5) * 2, rot: rnd(sd + 70) * 6.28, cor: Math.floor(rnd(sd + 90) * 5)});
  }
  return L;
})();
// guarda-sol: fincado; a agua chega e ele boia e gira; com pouco peso o vento o levanta e ele voa girando
export const estadoGuardaSol = (g: GuardaSol, k: number, tw: number, p: number) => {
  const s = (j: number) => rnd(k * 31 + j);
  const n = nivelMar(p);
  const pA = pChegada(g.z) + 0.01, pV = 0.74 + s(1) * 0.16;
  let x = g.x, z = g.z, y = altChao(g.z), rx = 0, rz = 0, ry = g.rot;
  if (p > pA) {
    const d = derivaDesde(pA, p, 0.8 + s(2) * 0.5), tc = (p - pA) * DURACAO;
    x += d[0]; z += d[1]; y = Math.max(y, n - 0.9 * smooth(0, 1.5, tc));
    rx = 0.9 * smooth(0, 2.5, tc) * (s(3) < 0.5 ? 1 : -1) + 0.15 * Math.sin(tw * 1.7 + s(4) * 6); rz = 0.2 * Math.sin(tw * 1.3 + s(5) * 6); ry += tc * 0.4 * (s(6) - 0.5);
  }
  if (p > pV) {
    const tv = (p - pV) * DURACAO;
    const sobe = 0.5 * (0.6 + 1.6 * (1 - gRelFim(p))) * tv * tv;
    x += 2.6 * tv + 0.4 * tv * tv; z += 1.4 * tv; y += sobe;
    rx += tv * (1.6 + s(7) * 2); rz += tv * (1.1 + s(8) * 1.5); ry += tv * 2.2;
  }
  return {x, y, z, rx, ry, rz};
};
const gRelFim = (p: number) => gEf(p) / gEf(0);

export const BOLAS = [[-22, -12], [14, -16], [38, -10], [-41, -18]].map(([x, z], k) => ({x, z, k}));
export const estadoBola = (b: {x: number; z: number; k: number}, tw: number, p: number) => {
  const n = nivelMar(p), pA = pChegada(b.z);
  const bl = balistico(tw, p, 3.4, b.k * 0.27);
  let x = b.x + Math.sin(tw * 0.9 + b.k) * 1.5, z = b.z, y = altChao(b.z) + 0.2 + Math.max(0, bl.y);
  if (p > pA) { const d = derivaDesde(pA, p, 1.3); x += d[0]; z += d[1]; y = Math.max(n + 0.12, altChao(z) + 0.2 + Math.max(0, bl.y)); }
  return {x, y, z, r: tw * 2.1 + b.k};
};

export const PRANCHAS = [[-30, -4.5, 0.4], [26, -5, -0.3]].map(([x, z, r], k) => ({x, z, r, k}));
export const VELEIRO = {x: 28, z: -78};
export const estadoVeleiro = (tw: number, p: number) => {
  const n = nivelMar(p);
  const vem = smooth(0.35, 1, p);
  return {x: VELEIRO.x + 30 * vem, z: VELEIRO.z + 42 * vem * vem, y: n - 0.55 + 0.18 * Math.sin(tw * 1.1), rx: 0.05 * Math.sin(tw * 0.9) + 0.12 * vem * Math.sin(tw * 2.3),
    rz: 0.07 * Math.sin(tw * 0.7 + 1) + 0.2 * vem * Math.sin(tw * 1.7), ry: -0.6 + 0.9 * vem};
};

// carros: 4 faixas; freiam quando a agua passa o muro e boiam quando a rua enche
export const FAIXAS = [{z: 12.6, dir: 1}, {z: 14.8, dir: 1}, {z: 16.6, dir: -1}, {z: 18.8, dir: -1}];
export const MODELOS_CARRO = ['car1', 'car3', 'car4', 'car5', 'car7', 'car8', 'car11', 'car20', 'car21', 'car24', 'car25', 'car19', 'car36'];
export const PALETAS = ['red', 'blue', 'white', 'yellow', 'green', 'orange', 'pearl', 'charcoal', 'oasis', 'pink'];
export type Carro = {f: number; x0: number; v: number; modelo: string; paleta: string; k: number};
export const CARROS: Carro[] = (() => {
  const L: Carro[] = []; let k = 0;
  FAIXAS.forEach((_, f) => { for (let j = 0; j < 5; j++) { const s = (i: number) => rnd(900 + f * 37 + j * 11 + i);
    L.push({f, x0: -100 + j * 42 + s(1) * 18, v: 8 + s(2) * 5, modelo: MODELOS_CARRO[Math.floor(s(3) * MODELOS_CARRO.length)], paleta: PALETAS[Math.floor(s(4) * PALETAS.length)], k: k++}); } });
  return L;
})();
const P_FREIA = 0.5, P_BOIA = 0.66;
export const estadoCarro = (c: Carro, tw: number, p: number) => {
  const F = FAIXAS[c.f], s = (j: number) => rnd(c.k * 13 + j);
  const tb = (P_FREIA + s(1) * 0.04) * DURACAO, a = 4.5;
  const tr = Math.min(tw, tb);
  let x = wrap(c.x0 + F.dir * c.v * tr, 110);
  if (tw > tb) { const dt = Math.min(tw - tb, c.v / a); x += F.dir * (c.v * dt - 0.5 * a * dt * dt); }
  let y = 0.6, z = F.z, ry = F.dir > 0 ? Math.PI / 2 : -Math.PI / 2, rx = 0, rz = 0;
  const pB = P_BOIA + s(2) * 0.05;
  if (p > pB) {
    const d = derivaDesde(pB, p, 0.35 + s(3) * 0.3), tc = (p - pB) * DURACAO, n = nivelMar(p);
    x += d[0]; z += d[1] * 0.5; y = Math.max(0.6, n - 0.75) + 0.05 * Math.sin(tw * 1.6 + s(4) * 6);
    ry += tc * 0.25 * (s(5) - 0.5); rx = 0.05 * Math.sin(tw * 1.2 + s(6) * 6); rz = 0.06 * Math.sin(tw * 1.5 + s(7) * 6);
  }
  return {x, y, z, rx, ry, rz};
};

// ---------------------------------------------------------------- palmeiras, bancos, postes, predios
export const PALMAS = (() => {
  const L: {x: number; z: number; variante: number; escala: number; rot: number; y: number}[] = [];
  for (let k = -9; k <= 9; k++) { const x = k * 8.5 + (rnd(k + 50) - 0.5) * 2; if (Math.abs(x - FONTE[0]) < 5) continue; L.push({x, z: 1.4, variante: Math.floor(rnd(k + 60) * 5), escala: 0.85 + rnd(k + 70) * 0.3, rot: rnd(k + 80) * 6.28, y: Y_MAL}); }
  for (let k = -7; k <= 7; k++) { const x = k * 11 + 4 + (rnd(k + 150) - 0.5) * 3; L.push({x, z: 10.3, variante: Math.floor(rnd(k + 160) * 2), escala: 0.9 + rnd(k + 170) * 0.25, rot: rnd(k + 180) * 6.28, y: Y_MAL}); }
  for (let k = -5; k <= 5; k++) { const x = k * 14 + 7; L.push({x, z: 22.5, variante: 0, escala: 1.0 + rnd(k + 250) * 0.2, rot: rnd(k + 260) * 6.28, y: Y_MAL}); }
  return L;
})();
export const BANCOS = Array.from({length: 12}, (_, k) => ({x: -66 + k * 12 + 3, z: 2.9}));
export const POSTES = Array.from({length: 10}, (_, k) => ({x: -81 + k * 18, z: 10.6}));
export const PREDIOS = (() => {
  // (sem buildings_12 'THRIFT SHOP' e buildings_14 'MOTEL': letreiro em ingles num malecon do Equador)
  const nomes = ['buildings_11', 'buildings_5', 'buildings_13', 'buildings_10', 'buildings_16', 'buildings_7', 'buildings_8'];
  const L: {nome: string; x: number; z: number; ry: number; e: number}[] = [];
  let x = -118;
  for (let k = 0; x < 118; k++) {
    const nome = nomes[Math.floor(rnd(k * 7 + 3) * nomes.length)];
    L.push({nome, x, z: 30 + rnd(k * 7 + 4) * 5, ry: Math.PI, e: 0.85 + rnd(k * 7 + 5) * 0.3});   // o GLB ja esta em metros (x3,9 no otimizar)
    x += 13 + rnd(k * 7 + 6) * 6;
  }
  return L;
})();
// quiosque de praia (buildings_4, toldo listrado) no malecon
export const QUIOSQUES = [{x: -30, z: 7.2}, {x: 34, z: 7.2}];

// linha d'agua visivel e nivel (reexport para o mundo)
export {linhaAgua, nivelMar};
