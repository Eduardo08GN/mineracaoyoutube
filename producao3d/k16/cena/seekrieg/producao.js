// Motor de produção do K16: lê plano.json (149 batidas, tempos do alinhamento) e desenha cada batida pela família.
//   anat  → anat.js (pronto) · mapa → mapa.js · epoca → epoca.js · lapis → lapis.js (componentes das frentes paralelas;
//   enquanto não chegam, a batida sai como espaço reservado com etiqueta, para conferir tempo e ritmo).
// Marcadores 2D (pipeline oficial) entram NA palavra: rotulo, numero, contador, regua. Os do mapa (trilha, anel, cota) são do mapa.js.
// O 3D roda N subquadros (obturador 180°); o 2D é desenhado uma vez, no instante central.
import * as THREE from 'three';
import {clamp01, easeInOutCubic} from 'teardown-kit/util.js';
import {buildAnat} from './anat.js';
import {buildNevoa} from './nevoa.js';
import PLANO from './plano.json';
import {buildEpoca} from './epoca.js';
import {buildLapis} from './lapis.js';
import {FONTE, FUNDOS, IMAGENS} from './epoca_assets.js';

// recortes de foco nas imagens (u0, v0, u1, v1; v de cima para baixo). Padrão: o miolo da imagem.
const FOCO = {mastros: [0.0, 0.3, 0.44, 0.8], caldeira: [0.25, 0.35, 0.7, 0.85], fila: [0.1, 0.35, 0.9, 0.75]};
// documento do lápis → fundo
const DOC = {carta_ordens: 'carta', comissao: 'papel', chevalier: 'papel', calculo: 'papel', efetivos: 'papel', plano_nota: 'papel', regra_24h: 'papel', lista: 'papel', diario_carvao: 'diario', calendario: 'diario'};

const ss = (a, b, t) => easeInOutCubic(clamp01((t - a) / (b - a)));
const fmt = (n) => Math.round(n).toLocaleString('de-DE');
export const DURACAO = PLANO.dur;

export async function producao({stage, casco, navio, linhaDagua, el, CF}) {
  const ep = buildEpoca(stage.scene, IMAGENS);
  const lp = buildLapis(stage.scene, {fonte: FONTE, fundos: FUNDOS});
  await Promise.all([ep.pronto, lp.pronto]);
  let lado = 1;
  const familias = {
    epoca: {
      esconder: () => ep.set(0, null),
      set: (t, u, dur, take, accOpts) => {
        const cam = ep.set(u, {imagem: take.img, foco: FOCO[take.foco] || [0.15, 0.2, 0.85, 0.8], paralaxe: 0.6, dur, lado: take.lado ?? lado});
        stage.frame(cam, 'epoca', cam.tgt, {ao: false, t, ...accOpts});
        return {};
      },
    },
    lapis: {
      esconder: () => lp.set(0, null),
      set: (t, u, dur, take, accOpts) => {
        const n = take.linhas.length, passo = Math.max(0.6, (dur * 0.75) / n);
        const linhas = take.linhas.map((texto, i) => ({texto, inicio_s: 0.15 + i * passo, dur_s: passo * 0.9}));
        const sub = (take.sublinhar || []).map((i) => ({linha: i, de: 0, ate: take.linhas[i].length, inicio_s: 0.15 + (i + 0.95) * passo}));
        const ris = take.riscar ? take.linhas.map((x, i) => ({linha: i, de: 0, ate: x.length, inicio_s: Math.min(dur - 0.6, 0.15 + n * passo)})) : [];
        const cam = lp.set(u, {fundo: DOC[take.doc] || 'papel', linhas, sublinhar: sub, riscar: ris, dur});
        stage.frame(cam, 'epoca', cam.tgt, {ao: false, t, ...accOpts});
        return {};
      },
    },
  };
  const nevoa = buildNevoa(stage.scene);
  const anat = buildAnat(stage, casco, navio, linhaDagua);
  const B = PLANO.batidas;
  const achar = (t) => { let lo = 0, hi = B.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (B[m].v0 <= t) lo = m; else hi = m - 1; } return B[lo]; };
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 1600 900');
  svg.style.cssText = 'position:absolute;inset:0;width:1600px;height:900px;pointer-events:none';
  el.append(svg);
  const FONTE = 'font-family="Barlow Condensed, Oswald, Arial Narrow, sans-serif" font-weight="600" letter-spacing="2"';
  const txt = (x, y, s, tam, cor, o, anc = 'start') => `<text x="${x}" y="${y}" fill="${cor}" opacity="${o.toFixed(3)}" ${FONTE} font-size="${tam}" text-anchor="${anc}">${s}</text>`;
  const lin = (a, b, cor = '#f1efe9', w = 2, o = 1) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${cor}" stroke-width="${w}" opacity="${o.toFixed(3)}"/>`;
  const proj = (p) => stage.project(new THREE.Vector3(...p));

  const desenhar3d = (b, t, u, dur, accOpts) => {
    const outros = ['mapa', 'epoca', 'lapis'];
    for (const f of outros) familias[f]?.esconder?.();
    anat.grupo.visible = b.fam === 'anat';
    if (b.fam === 'anat') return anat.set(t, u, dur, b.take, accOpts, nevoa);
    casco.visible = false;
    const F = familias[b.fam];
    if (F) return F.set(t, u, dur, b.take, accOpts, nevoa) || {};
    // espaço reservado: palco vazio, para conferir ritmo
    stage.frame({pos: [Math.cos(u * 0.2) * 120, 20, Math.sin(u * 0.2) * 120], tgt: [0, 0, 0], fov: 30}, 'palco', [0, 0, 0], {run: 0, ao: false, t, ...accOpts, antes: (c) => nevoa.set(c, t, 0.4, '#5d6873')});
    return {reservado: true};
  };

  return {
    render(t) {
      const b = achar(t), u = t - b.v0, dur = b.v1 - b.v0;
      lado = (B.indexOf(b) % 2) ? 1 : -1;
      const N = CF.sub || 1, obt = (CF.obturador ?? 0.5) / (CF.fps || 24);
      let info = {};
      for (let i = 0; i < N; i++) {
        const d = N === 1 || i === N - 1 ? 0 : ((i + 0.5) / (N - 1) - 0.5) * obt;
        const us = Math.min(Math.max(u + d, 0), dur - 1e-4);
        info = desenhar3d(b, b.v0 + us, us, dur, {sub: i, subN: N}) || {};
      }
      // ---- 2D: marcadores na palavra ----
      let g = '';
      if (info.reservado) g += txt(60, 80, `${b.fam.toUpperCase()} · ${b.take.vista || b.take.img || b.take.doc || ''} · ${b.id}`, 30, '#8fa6b6', 0.8);
      if (info.regua) {
        const top = proj([-12, 0, 8]), bot = proj([-12, -(8.4 * 0.62 + 0.3), 8]);
        if (top && bot) {
          const x = top[0] - 40, o = ss(0.4, 0.9, u);
          g += lin([x, top[1]], [x, bot[1]], '#ff7a1f', 3, o) + lin([x - 10, top[1]], [x + 10, top[1]], '#ff7a1f', 3, o) + lin([x - 10, bot[1]], [x + 10, bot[1]], '#ff7a1f', 3, o);
          const r = (b.mk.find((m) => m.tipo === 'regua') || {}).txt || '8,4 m';
          g += txt(x - 24, (top[1] + bot[1]) / 2 + 10, `${r} TIEFGANG`, 30, '#f1efe9', o, 'end');
        }
      }
      if (info.fatia) {
        const pf = info.fatia.ferro.getWorldPosition(new THREE.Vector3()), pw = info.fatia.madeira.getWorldPosition(new THREE.Vector3());
        const f = proj([pf.x, pf.y + 1.5, pf.z]), w = proj([pw.x, pw.y - 1.5, pw.z]);
        if (f) g += lin(f, [f[0] + 90, f[1] - 70], '#f1efe9', 2, ss(1.6, 2.0, u)) + txt(f[0] + 98, f[1] - 76, 'EISEN · 15 cm', 30, '#ff7a1f', ss(1.6, 2.0, u));
        if (w) g += lin(w, [w[0] + 90, w[1] + 60], '#f1efe9', 2, ss(1.8, 2.2, u)) + txt(w[0] + 98, w[1] + 72, 'HOLZ · 76 cm', 30, '#f1efe9', ss(1.8, 2.2, u));
      }
      let fila = 0;
      for (const m of b.mk) {
        if (t < m.t || ['regua', 'trilha', 'anel', 'cota'].includes(m.tipo) && b.fam !== 'anat') continue;
        const o = ss(m.t, m.t + 0.35, t);
        if (m.tipo === 'rotulo') { g += txt(96, 790 - fila * 52, m.txt, 40, '#f1efe9', o); fila++; }
        if (m.tipo === 'numero') g += txt(1480, 560, m.txt, 150, '#ff7a1f', o, 'end');
        if (m.tipo === 'contador') g += txt(1480, 560, fmt(m.de + (m.ate - m.de) * ss(m.t, m.t + 1.1, t)), 150, '#ff7a1f', o, 'end');
      }
      svg.innerHTML = g;
      return {};
    },
  };
}
