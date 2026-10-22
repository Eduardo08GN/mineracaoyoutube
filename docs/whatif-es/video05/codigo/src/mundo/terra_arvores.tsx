// Arvores da Terra (agente Terra), com o wrapper do EZ-Tree do agente Rua (arvores.tsx):
// - 117-129,2: a MESMA floresta que brotou na rua (florestaPerto), que embranquece na geada e some no branco;
// - 144,1-162,5: floresta nas laterais da campina (o lago fica livre no horizonte), ausente nas fases de gelo do estrobo;
// - 205,5-228,5: a fileira do oasis brota da direita para a esquerda, encolhe (224,5-227,5) e as ultimas somem uma a uma;
//   a ULTIMA ARVORE (perto, a direita) perde as folhas e cai por ultimo (228,4).
import React, {useMemo} from 'react';
import {ArvoreEZ, Floresta, ItemFloresta, PresetEZ, estacao, florestaPerto} from './arvores';
import {rnd, smooth} from './comum';
import {EstadoTerra} from './terra_estado';
import {marCidade} from './cidade';

// ---------- porta em JS do ruido do shader (terra_chao.tsx) para pousar as arvores no chao ----------
const fr = (x: number) => x - Math.floor(x);
const hh2 = (px: number, py: number): [number, number] => {
  let a = fr(px * 0.1031), b = fr(py * 0.1030), c = fr(px * 0.0973);
  const d = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33);
  a += d; b += d; c += d;
  return [fr((a + b) * c) * 2 - 1, fr((a + c) * b) * 2 - 1];
};
const gn = (x: number, y: number) => {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10), uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  const g = (i: number, j: number) => { const h = hh2(ix + i, iy + j); return h[0] * (fx - i) + h[1] * (fy - j); };
  const a = g(0, 0), b = g(1, 0), c = g(0, 1), d = g(1, 1);
  return (a + (b - a) * ux + (c - a + (a - b - c + d) * ux) * uy) * 1.6;
};
const fbm5 = (x: number, y: number) => {
  let s = 0, a = 0.5;
  for (let i = 0; i < 5; i++) { s += a * gn(x, y); const nx = 0.8 * x + 0.6 * y, ny = -0.6 * x + 0.8 * y; x = nx * 2.03 + 1.7; y = ny * 2.03 + 1.7; a *= 0.5; }
  return s;
};
const ss = (a: number, b: number, x: number) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
// mesma formula do shader (parte da planicie): morro, colinas, sulco do oasis
export const alturaPlanicie = (x: number, z: number, e: EstadoTerra) => {
  const r = Math.hypot(x, z);
  let h = e.hc - e.morro * ss(250, 1500, r);
  h += e.colinas * (fbm5(x / 2600 + 3.7, z / 2600 + 3.7) * 0.5 + 0.5) * ss(350, 4000, r);
  const faixa = ss(18, 70, Math.abs(x - 45 - 0.02 * z));
  h -= e.oasis * 3 * (1 - faixa) * ss(20, 60, r);
  return h;
};

const VAR: [PresetEZ, number][] = [['Oak Medium', 11], ['Oak Medium', 23], ['Ash Medium', 5], ['Aspen Medium', 7], ['Oak Large', 3], ['Ash Large', 9]];

// floresta da campina depois do gelo: duas massas laterais e arvores soltas, lago livre no centro-esquerda
const florestaCampina = (): ItemFloresta[] => {
  const L: ItemFloresta[] = [];
  for (let i = 0; i < 150; i++) {
    const lado = i % 3 === 0 ? -1 : 1;
    const a = lado < 0 ? -0.35 - rnd(i * 3.1) * 1.1 : 0.05 + rnd(i * 3.1) * 1.25;   // azimute a partir de -z (positivo = direita)
    const d = 70 + Math.pow(rnd(i * 5.7), 0.7) * 380;
    const x = Math.sin(a) * d, z = -Math.cos(a) * d;
    if (lado > 0 && a < 0.28 && d < 260) continue;
    // nada de arvore dentro do mar do agente Cidade (costa reta a ~110 m na frente-esquerda)
    const mc = marCidade(150), az = Math.atan2(-x, -z);
    if (az > mc.azMin - 0.1 && az < mc.azMax + 0.1 && x * -Math.sin(mc.azNormal) + z * -Math.cos(mc.azNormal) > mc.costa - 12) continue;
    const [preset, semente] = VAR[Math.floor(rnd(i * 1.7) * VAR.length)];
    L.push({preset, semente, x, z, altura: (/Large/.test(preset) ? 15 : 11) + rnd(i * 3.3) * 6, rot: rnd(i * 9.1) * 6.283});
  }
  return L;
};

// fileira do oasis: de perto (direita) para longe (centro), ao longo de x = 45 + 0,02 z
type ItemOasis = ItemFloresta & {d: number};
const fileiraOasis = (): ItemOasis[] => {
  const L: ItemOasis[] = [];
  for (let i = 0; i < 70; i++) {
    const z = -70 - Math.pow(i / 69, 1.35) * 1250 - rnd(i * 2.3) * 12;
    const x = 45 + 0.02 * z + (rnd(i * 4.1) - 0.5) * 22;
    const d = Math.hypot(x, z);
    const [preset, semente] = VAR[Math.floor(rnd(i * 1.3 + 4) * VAR.length)];
    // brotam da direita (perto) para a esquerda (longe): 205,5 -> 207,8; encolhem 224,5-227,5; as ultimas somem uma a uma ate 228,3
    const ordem = i / 69;
    const nasce = 205.5 + ordem * 2.3 + rnd(i * 6.1) * 0.25;
    const ultimas = i < 6;
    const morre = ultimas ? 227.5 + (5 - i) * 0.15 : 224.5 + rnd(i * 8.3) * 2.6;
    L.push({preset, semente, x, z, d, altura: (/Large/.test(preset) ? 14 : 10) + rnd(i * 3.7) * 5, rot: rnd(i * 9.7) * 6.283, nasce, dur: 0.9,
      morre, durMorre: ultimas ? 0.3 : 1.2});
  }
  return L;
};
// a ultima arvore: perto, a direita do quadro (guinada -18), destaque
const ULTIMA = {x: 38, z: -42, altura: 15, rot: 1.1};

export const ArvoresTerra: React.FC<{t: number; e: EstadoTerra}> = ({t, e}) => {
  const perto = useMemo(() => florestaPerto(), []);
  const campina = useMemo(() => florestaCampina(), []);
  const oasis = useMemo(() => fileiraOasis(), []);
  // alturas do chao (as listas sao fixas; a altura acompanha o chao do trecho)
  const campinaY = useMemo(() => campina.map((it) => ({...it, y: alturaPlanicie(it.x, it.z, {...e, hc: 0, morro: 40, colinas: 30, oasis: 0})})), [campina]);
  const oasisY = useMemo(() => oasis.map((it) => ({...it, y: alturaPlanicie(it.x, it.z, {...e, hc: 118.3, morro: 25, colinas: 90, oasis: 1}) - 0.3})), [oasis]);
  const verde = '#4f7232', verde2 = '#6f8f3c';
  const neve = smooth(127.4, 128.6, t);
  const est = estacao(t);   // mesmas folhas da Rua (costura em 117)
  // a ultima arvore: perde as folhas 226,6-228,0 e cai/afunda 228,0-228,45
  const folhasUlt = 1 - smooth(226.6, 228.0, t);
  const caiUlt = smooth(228.0, 228.45, t);
  const ultY = alturaPlanicie(ULTIMA.x, ULTIMA.z, {...e, hc: 118.3, morro: 25, colinas: 90, oasis: 1}) - 0.3;
  return (
    <>
      {t >= 117 && t < 129.2 && <Floresta lista={perto} t={t} folhas={est.folhas} cor={est.cor} cor2={est.cor2} neve={Math.max(est.neve, neve)} />}
      {t >= 144.1 && t < 162.55 && e.arvores > 0.5 && <Floresta lista={campinaY} t={t} folhas={1} cor={verde} cor2={verde2} neve={0} vento={0.6} />}
      {t >= 205.4 && t < 228.6 && <Floresta lista={oasisY} t={t} folhas={1} cor={'#56772f'} cor2={'#7d8e3a'} neve={0} vento={0.7} />}
      {t >= 205.4 && t < 228.5 && (
        <ArvoreEZ preset="Oak Large" semente={31} t={t} pos={[ULTIMA.x, ultY - caiUlt * 6, ULTIMA.z]} rot={ULTIMA.rot + caiUlt * 0.3}
          altura={ULTIMA.altura * smooth(205.4, 206.4, t) * (1 - 0.35 * caiUlt)} folhas={folhasUlt} cor={'#5c7a30'} cor2={'#a08a3a'} neve={0} vento={0.8}
          fade={1 - smooth(228.2, 228.48, t)} />
      )}
    </>
  );
};
