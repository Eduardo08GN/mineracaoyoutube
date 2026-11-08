// K17 Pioniere: o filme da máquina (a ponte de pontões no atelier creme, com o caderno do engenheiro ao lado).
// Mesmo método do telégrafo do K15: render(t) é função pura; o take vem de --config {"take": "..."}; a ponte lê UM
// eingang (bau(t)); o caderno escreve na palavra (as marcas em segundos virão do alinhamento na produção).
import * as THREE from 'three';
import {runSim} from 'teardown-kit/runtime.js';
import {easeInOutCubic, keyed} from 'teardown-kit/util.js';
import fellIt from './font/imfell-it.woff2';
import fellRm from './font/imfell-rm.woff2';
import garIt from './font/garamond-it.woff2';
import {createNotes} from './notes.js';
import {buildBruecke} from './ponton.js';
import {createStage, ENV} from './stage.js';
import {TAKES} from './takes.js';

const q = new URLSearchParams(location.search);
export const TAKE = (window.__SIM_CONFIG && window.__SIM_CONFIG.take) || q.get('take') || 'brueckenschlag';
const CF0 = window.__SIM_CONFIG || {};
// take inteiro por JSON (produção): âncora como texto "nome:i", formato do contador por nome
const FMT = {kg: (v) => `${Math.round(v).toLocaleString('de-DE')} kg`, m1: (v) => `${v.toFixed(1).replace('.', ',')} m`, ms2: (v) => `${v.toFixed(2).replace('.', ',')} m/s`,
  min: (v) => `${Math.round(v)} min`, d1: (v) => v.toFixed(1).replace('.', ','), n: (v) => String(Math.round(v)), t: (v) => `${(v / 1000).toFixed(1).replace('.', ',')} t`};
const deJSON = (sp) => ({...sp, notes: () => (sp.notes || []).map((it) => {
  const o = {...it};
  if (typeof it.a === 'string') { const [n, i] = it.a.split(':'); o.a = (A) => (i === undefined ? A[n]() : A[n](+i)); }
  if (typeof it.fmt === 'string') o.fmt = FMT[it.fmt];
  if (it.acc === true) o.acc = () => true;
  return o;
})});
const spec = CF0.spec ? deJSON(CF0.spec) : TAKES[TAKE];
const track = (keys, t, def = 0) => (keys ? keyed(keys, t, easeInOutCubic) : def);

async function loadFonts() {
  for (const [n, b] of [['IM Fell', fellIt], ['IM Fell Roman', fellRm], ['Garamond It', garIt]]) {
    const f = new FontFace(n, `url(data:font/woff2;base64,${b}) format('woff2')`); document.fonts.add(f); await f.load();
  }
}

export const run = () =>
  runSim({duration: spec.dur, fps: 24, theme: 'light', hud: {enabled: false, title: `ponton ${TAKE}`, subtitle: ''}, director: {enabled: false}, watermark: ''}, async ({canvas, capture}) => {
    await loadFonts();
    const stage = createStage({canvas, env: spec.env ?? 'tag', focus: spec.focus});
    const br = buildBruecke({felder: spec.felder ?? 6});
    stage.scene.add(br.root);
    const notes = createNotes(document.getElementById('app'), {paper: ENV[spec.env ?? 'tag'].bg, wash: spec.wash ?? 0.9});
    const items = spec.notes();
    const ctx = {project: (p) => stage.project(p), anchors: br.anchors};
    const M = {on: () => false, current: () => null, iv: []};
    const resize = () => stage.resize(1600, 900, capture ? devicePixelRatio || 1 : Math.min(devicePixelRatio || 1, 2));
    resize();
    window.PONTON = {stage, br, THREE};
    return {
      resize,
      render(t) {
        br.update({bau: track(spec.bau, t, br.felder), t, v: track(spec.v, t, 0.45), biege: track(spec.biege, t, 0)});
        const pick = (f) => keyed(spec.cam.map(([a, c]) => [a, f(c)]), t, easeInOutCubic);
        stage.frame({pos: pick((c) => c.pos), tgt: pick((c) => c.tgt), fov: pick((c) => c.fov)});
        for (const it of items) if (it.a) it.anchor = it.a(br.anchors);
        notes.update(t, items, M, ctx);
        return {};
      },
    };
  });
