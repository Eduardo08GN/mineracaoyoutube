// K17: imagens de época e páginas-prova em 2.5D (família "bild"), no tema creme do Kriegsmomente.
// Reaproveita a época 2.5D do K16 (paralaxe pela profundidade, Depth Anything V2 na G4). O take vem de
// --config {"spec": {imagem, foco[u0,v0,u1,v1], paralaxe, lado, zoomMax, dur, titulo}}; sem spec, roda a lista de batedor.
// Fundo e moldura: papel creme com vinheta (a imagem fica DENTRO da página, como no caderno do K15); o título se escreve à pena.
import {runSim} from 'teardown-kit/runtime.js';
import {buildEpoca} from './epoca.js';
import fellIt from './font/imfell-it.woff2';
import {CLIMA, createStage} from './stage.js';
import c01 from './assets/epoca/e01.bin'; import p01 from './assets/epoca/e01_prof8.png';
import c02 from './assets/epoca/e02.bin'; import p02 from './assets/epoca/e02_prof8.png';
import c03 from './assets/epoca/e03.bin'; import p03 from './assets/epoca/e03_prof8.png';
import c04 from './assets/epoca/e04.bin'; import p04 from './assets/epoca/e04_prof8.png';
import c05 from './assets/epoca/e05.bin'; import p05 from './assets/epoca/e05_prof8.png';
import c06 from './assets/epoca/e06.bin'; import p06 from './assets/epoca/e06_prof8.png';
import c08 from './assets/epoca/e08.bin'; import p08 from './assets/epoca/e08_prof8.png';
import c09 from './assets/epoca/e09.bin'; import p09 from './assets/epoca/e09_prof8.png';
import c12 from './assets/epoca/e12.bin'; import p12 from './assets/epoca/e12_prof8.png';
import c13 from './assets/epoca/e13.bin'; import p13 from './assets/epoca/e13_prof8.png';
import c14 from './assets/epoca/e14.bin'; import p14 from './assets/epoca/e14_prof8.png';
import c15 from './assets/epoca/e15.bin'; import p15 from './assets/epoca/e15_prof8.png';

const IMG = {e01: [c01, p01], e02: [c02, p02], e03: [c03, p03], e04: [c04, p04], e05: [c05, p05], e06: [c06, p06], e08: [c08, p08], e09: [c09, p09],
  e12: [c12, p12], e13: [c13, p13], e14: [c14, p14], e15: [c15, p15]};
const PAPIER = '#e9e1d0';
// clima "epoca" no creme: o fundo atrás da imagem é papel
CLIMA.epoca = {fundoInt: 0, envInt: 0.8, rim: 0, grade: [1, 1, [1, 1, 1]], top: PAPIER, hor: PAPIER, bot: PAPIER, streak: 0, fog: 0};
const CF = window.__SIM_CONFIG || {};
const TAKES = CF.spec ? [CF.spec] : [
  {imagem: 'e01', foco: [0.2, 0.25, 0.8, 0.75], paralaxe: 0.8, dur: 5, titulo: 'Suresnes, Pontonbrücke'},
  {imagem: 'e13', foco: [0.1, 0.55, 0.9, 0.8], paralaxe: 0.15, dur: 5, titulo: 'Generalstabswerk, S. 1115'},
  {imagem: 'e03', foco: [0.15, 0.2, 0.85, 0.8], paralaxe: 0.9, dur: 5, lado: -1, titulo: 'Pont-à-Mousson, 14. August 1870'},
];
let acc = 0;
for (const k of TAKES) { k.t0 = acc; acc += k.dur; }
const takeAt = (t) => TAKES.find((k) => t < k.t0 + k.dur) || TAKES[TAKES.length - 1];

export const run = () =>
  runSim({duration: acc, fps: 24, theme: 'light', hud: {enabled: false, title: 'k17 bild', subtitle: ''}, director: {enabled: false}, watermark: ''}, async ({canvas, capture}) => {
    const f = new FontFace('IM Fell', `url(data:font/woff2;base64,${fellIt}) format('woff2')`); document.fonts.add(f); await f.load();
    const stage = await createStage({canvas});
    const usados = [...new Set(TAKES.map((k) => k.imagem))];
    const epoca = buildEpoca(stage.scene, Object.fromEntries(usados.map((id) => [id, {cor: IMG[id][0], prof: IMG[id][1]}])));
    await epoca.pronto;
    const app = document.getElementById('app');
    const st = document.createElement('style');
    st.textContent = `#pg{position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 0 46px ${PAPIER}, inset 0 0 120px 70px rgba(233,225,208,.95)}
      #pap{position:absolute;inset:0;pointer-events:none;mix-blend-mode:multiply;background:radial-gradient(ellipse 80% 75% at 50% 48%, rgba(0,0,0,0) 62%, rgba(120,86,44,.28) 100%)}
      #tit{position:absolute;left:78px;bottom:70px;font:italic 46px 'IM Fell',serif;color:#2a2622;white-space:nowrap;overflow:hidden;text-shadow:0 0 6px ${PAPIER},0 0 14px ${PAPIER}}`;
    document.head.appendChild(st);
    app.insertAdjacentHTML('beforeend', '<div id="pg"></div><div id="pap"></div><div id="tit"></div>');
    const tit = document.getElementById('tit');
    const resize = () => stage.resize(1600, 900, capture ? devicePixelRatio || 1 : Math.min(devicePixelRatio || 1, 2));
    resize();
    const cena = (k, t, u, acc2) => {
      const s = u / k.dur, zoom = (k.zoomMax ?? 0.8) * (s * s * (3 - 2 * s));
      const cam = epoca.set(u, {imagem: k.imagem, foco: k.foco, paralaxe: k.paralaxe ?? 0.7, lado: k.lado ?? 1, dur: k.dur, zoom, grao: 0.02, vinheta: 0.12});
      stage.frame(cam, 'epoca', cam.tgt, {ao: false, t, ...acc2});
    };
    return {resize, render(t) {
      const k = takeAt(t), u = t - k.t0;
      const N = CF.sub || 1, obt = (CF.obturador ?? 0.5) / (CF.fps || 24);
      for (let i = 0; i < N; i++) {
        const d = N === 1 || i === N - 1 ? 0 : ((i + 0.5) / (N - 1) - 0.5) * obt;
        const ts = Math.min(Math.max(t + d, k.t0), k.t0 + k.dur - 1e-4);
        cena(k, ts, ts - k.t0, {sub: i, subN: N});
      }
      tit.textContent = k.titulo || '';
      tit.style.clipPath = `inset(0 ${100 - 100 * Math.min(1, Math.max(0, (u - 0.4) / 1.2))}% 0 0)`;
      return {};
    }};
  });
