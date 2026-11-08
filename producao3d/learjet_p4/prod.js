// Learjet parte 4: motor de PRODUÇÃO. Lê plano.json (gerado por ferramentas/plano_p4.py a partir do alinhamento): uma batida
// por frase, cada uma com take próprio (câmera, estado do objeto e camada 2D). Famílias:
//  ceu    : o avião no céu 2.5D (cruzeiro/tormenta), pose e câmera relativas ao avião
//  estudio: a cauda em corte no Learjet 60 por código, estúdio creme (raio-x, trim, profundor, solta)
//  altim  : o mergulho final com as duas altitudes do mesmo transponder (barométrica × GPS) e o perfil
//  mapa   : NAIP + trilha ADS-B, faixa dos pedaços, ponto onde a barométrica congela, trecho sobre a faixa, vento
// Camada 2D por batida (ui): rotulo, nota, titulo, gauge, angulo, pressao, vetores, marcas, relogio, reguas, vento, faixaTxt.
import * as THREE from 'three';
import {gsap} from 'gsap';
import {CustomEase} from 'gsap/CustomEase';
import {CustomWiggle} from 'gsap/CustomWiggle';
import {runSim} from 'teardown-kit/runtime.js';
import {clamp01, easeInOutCubic, keyed} from 'teardown-kit/util.js';
import chaoB64 from './assets/chao.glb';
import cidadeB64 from './assets/cidade.glb';
import jetB64 from './assets/learjet.glb';
import {PTS} from './adsb.js';
import {buildCauda} from './cauda.js';
import {ALT, SERIE} from './dados_p4.js';
import {buildLearjet60} from './learjet60.js';
import PLANO from './plano.json';
import {createStage} from './stage.js';
import {buildWorld, loadGlb} from './world.js';
gsap.registerPlugin(CustomEase, CustomWiggle);
CustomWiggle.create('turbR', {wiggles: 38, type: 'uniform'});
CustomWiggle.create('turbP', {wiggles: 29, type: 'uniform'});
CustomWiggle.create('turbY', {wiggles: 23, type: 'uniform'});
CustomEase.create('entra', '0.16,1,0.3,1');
const E_IN = gsap.parseEase('entra');

const D2R = Math.PI / 180;
const ss = (a, b, t) => easeInOutCubic(clamp01((t - a) / (b - a)));
const ent = (a, b, t) => E_IN(clamp01((t - a) / (b - a)));
const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const dec = (n, d = 1) => n.toFixed(d).replace('.', ',');
const lerpSerie = (S, tt, j) => {
  let i = 0;
  while (i < S.length - 2 && S[i + 1][0] <= tt) i++;
  const a = S[i], b = S[i + 1], k = clamp01((tt - a[0]) / Math.max(1e-6, b[0] - a[0]));
  return a[j] == null || b[j] == null ? a[j] ?? b[j] : a[j] + (b[j] - a[j]) * k;
};
const lin = (v, u, d) => (Array.isArray(v) ? v[0] + (v[1] - v[0]) * easeInOutCubic(clamp01(u / d)) : v ?? 0);
const COR = {baro: '#ff7a1f', gps: '#2f6fd6', tinta: '#1d2329', creme: '#f4eee2'};
const clockET = (tt) => {
  const s = 12 * 3600 + 47 * 60 + 2.8 + tt;
  const h = Math.floor(s / 3600), mi = Math.floor((s % 3600) / 60), se = Math.floor(s % 60);
  return `${h}:${String(mi).padStart(2, '0')}:${String(se).padStart(2, '0')}`;
};

const B = PLANO.batidas;
export const DURATION = PLANO.dur;
const batAt = (t) => {
  let lo = 0, hi = B.length - 1;
  while (lo < hi) {
    const m = (lo + hi + 1) >> 1;
    if (B[m].v0 <= t) lo = m;
    else hi = m - 1;
  }
  return B[lo];
};
const camAt = (b, u) => {
  const pick = (f) => keyed(b.cam.map(([a, c]) => [a, f(c)]), u, easeInOutCubic);
  return {pos: pick((c) => c.pos), tgt: pick((c) => c.tgt), fov: pick((c) => c.fov ?? 36), near: b.cam[0][1].near, far: b.cam[0][1].far};
};

// ---------------------------------------------------------------- camada 2D
const CSS = `
  #lj{position:absolute;inset:0;pointer-events:none;font-family:'Inter',system-ui,sans-serif}
  #lj .lab{position:absolute;font-size:34px;letter-spacing:1px;font-weight:700;white-space:nowrap;opacity:0;color:${COR.tinta}}
  #lj .lab.ceu{color:#fff;text-shadow:0 1px 8px rgba(0,0,0,.5)}
  #lj .nota{position:absolute;left:0;right:0;bottom:70px;text-align:center;font-size:36px;font-weight:700;opacity:0}
  #lj .tit{position:absolute;left:0;right:0;top:120px;text-align:center;font-size:66px;font-weight:800;letter-spacing:-0.5px;opacity:0;color:#fff;text-shadow:0 2px 18px rgba(0,0,0,.55)}
  #lj .alt{position:absolute;top:44px;left:0;right:0;display:flex;justify-content:center;gap:40px;opacity:0}
  #lj .alt div{width:520px;padding:16px 22px 18px;border-radius:10px;background:rgba(14,18,22,.62);text-align:left}
  #lj .alt i{display:block;font-style:normal;font-size:24px;letter-spacing:3px;font-weight:700;margin-bottom:4px}
  #lj .alt b{display:block;font-size:76px;font-weight:800;letter-spacing:-1px;color:#fff;font-variant-numeric:tabular-nums}
  #lj .alt small{display:block;font-size:24px;color:#fff;opacity:.85;height:30px}
  #lj .rel{position:absolute;top:44px;left:56px;opacity:0;color:#fff;text-shadow:0 1px 8px rgba(0,0,0,.6);display:flex;gap:56px}
  #lj .rel i{display:block;font-style:normal;font-size:22px;letter-spacing:3px;font-weight:700} #lj .rel b{font-size:56px;font-weight:800;font-variant-numeric:tabular-nums}
  #lj svg,#lj canvas{position:absolute;inset:0;width:1600px;height:900px}`;

// ícones das 3 perguntas (velocidade, cauda, relógio), 64 px
const ICONE = [
  (c) => `<path d="M-26 14 A30 30 0 1 1 26 14" fill="none" stroke="${c}" stroke-width="6"/><line x1="0" y1="6" x2="16" y2="-14" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`,
  (c) => `<path d="M-30 18 L22 18 L10 -8 L-2 -8 Z" fill="none" stroke="${c}" stroke-width="5"/><line x1="-8" y1="-24" x2="26" y2="-24" stroke="${c}" stroke-width="6"/><line x1="8" y1="-24" x2="8" y2="-8" stroke="${c}" stroke-width="5"/>`,
  (c) => `<circle r="28" fill="none" stroke="${c}" stroke-width="6"/><line x1="0" y1="0" x2="0" y2="-18" stroke="${c}" stroke-width="6" stroke-linecap="round"/><line x1="0" y1="0" x2="13" y2="8" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`,
];

function createOverlay(app) {
  const st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);
  const el = document.createElement('div');
  el.id = 'lj';
  el.innerHTML = `<canvas width="1600" height="900"></canvas><svg viewBox="0 0 1600 900"></svg>
    <div class="alt"><div class="b"><i style="color:${COR.baro}">ALTITUD BAROMÉTRICA</i><b class="vb"></b><small class="sb"></small></div>
      <div class="g"><i style="color:#7fb0ff">ALTITUD GPS</i><b class="vg"></b><small class="sg"></small></div></div>
    <div class="rel"><div><i class="r1l"></i><b class="r1"></b></div><div><i class="r2l"></i><b class="r2"></b></div></div>
    ${[0, 1, 2].map((i) => `<div class="lab l${i}"></div>`).join('')}<div class="nota"></div><div class="tit"></div>`;
  app.appendChild(el);
  const cv = el.querySelector('canvas').getContext('2d');
  const svg = el.querySelector('svg');
  const q = (s) => el.querySelector(s);
  return (s) => {
    svg.innerHTML = '';
    cv.clearRect(0, 0, 1600, 900);
    const tinta = s.claro ? COR.tinta : '#fff';
    [0, 1, 2].forEach((i) => {
      const L = s.labs?.[i], lab = q(`.l${i}`);
      lab.style.opacity = L ? L.o : 0;
      lab.className = `lab l${i}${s.claro ? '' : ' ceu'}`;
      if (!L) return;
      const [ax, ay] = L.at, lx = ax + L.off[0], ly = ay + L.off[1];
      lab.textContent = L.txt;
      const esq = L.off[0] < 0;
      lab.style.left = `${Math.min(1600 - 24 - lab.offsetWidth, Math.max(24, esq ? lx - 12 - lab.offsetWidth : lx + 12))}px`;
      lab.style.top = `${Math.min(860, Math.max(20, ly - 24))}px`;
      svg.insertAdjacentHTML('beforeend', `<g opacity="${L.o}"><line x1="${ax}" y1="${ay}" x2="${lx}" y2="${ly}" stroke="${tinta}" stroke-width="2.2"/><circle cx="${ax}" cy="${ay}" r="7" fill="none" stroke="${COR.baro}" stroke-width="3"/></g>`);
    });
    const nota = q('.nota');
    nota.style.opacity = s.nota ? s.nota.o : 0;
    nota.style.color = tinta;
    nota.style.textShadow = s.claro ? 'none' : '0 2px 12px rgba(0,0,0,.5)';
    if (s.nota) nota.textContent = s.nota.txt;
    q('.tit').style.opacity = s.tit ? s.tit.o : 0;
    if (s.tit) q('.tit').textContent = s.tit.txt;
    q('.rel').style.opacity = s.rel ? s.rel.o : 0;
    if (s.rel) {
      q('.r1l').textContent = s.rel.l1;
      q('.r1').textContent = s.rel.v1;
      q('.r2l').textContent = s.rel.l2 || '';
      q('.r2').textContent = s.rel.v2 || '';
    }
    let g = '';
    if (s.gauge) {
      const {incid, mach, o} = s.gauge, cx = 1300, cy = 300, R = 150;
      const ang = (v) => (-210 + ((v - 1) / 11) * 240) * D2R;
      const P = (v, r) => [cx + r * Math.cos(ang(v)), cy + r * Math.sin(ang(v))];
      const arco = (a, b, r) => { const [x0, y0] = P(a, r), [x1, y1] = P(b, r); return `M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`; };
      g += `<g opacity="${o}"><circle cx="${cx}" cy="${cy}" r="${R + 26}" fill="${COR.creme}" stroke="${COR.tinta}" stroke-width="3"/><path d="${arco(5.7, 8.75, R - 8)}" stroke="#3f9b5a" stroke-width="16" fill="none"/>`;
      for (let v = 1; v <= 12; v++) {
        const [x0, y0] = P(v, R), [x1, y1] = P(v, R - 22), [tx, ty] = P(v, R - 50);
        g += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${COR.tinta}" stroke-width="3"/>`;
        if ([1, 4, 6, 8, 10, 12].includes(v)) g += `<text x="${tx}" y="${ty + 10}" font-size="28" font-weight="700" text-anchor="middle" fill="${COR.tinta}">${v}</text>`;
      }
      const [m0x, m0y] = P(6.5, R + 4), [m1x, m1y] = P(6.5, R - 30), [nx, ny] = P(incid, R - 14);
      g += `<line x1="${m0x}" y1="${m0y}" x2="${m1x}" y2="${m1y}" stroke="${COR.baro}" stroke-width="4"/><line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="${COR.baro}" stroke-width="7" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="12" fill="${COR.tinta}"/>`;
      g += `<text x="${cx}" y="${cy + R + 70}" font-size="30" font-weight="800" letter-spacing="3" text-anchor="middle" fill="${COR.tinta}">PITCH TRIM</text>`;
      g += `<text x="${cx - 46}" y="${cy + 112}" font-size="22" font-weight="700" text-anchor="middle" fill="${COR.tinta}">N DN</text><text x="${cx + 46}" y="${cy + 112}" font-size="22" font-weight="700" text-anchor="middle" fill="${COR.tinta}">N UP</text>`;
      const x0 = 1040, x1 = 1540, yr = 640, X = (m) => x0 + ((m - 0.6) / 0.3) * (x1 - x0);
      g += `<rect x="${x0}" y="${yr - 10}" width="${x1 - x0}" height="20" rx="10" fill="#d9cfbb"/><rect x="${x0}" y="${yr - 10}" width="${Math.max(0, X(mach) - x0)}" height="20" rx="10" fill="${COR.baro}"/>`;
      for (const [m, t, an] of [[0.7, '0,70', 'middle'], [0.77, '0,77', 'end'], [0.81, '0,81', 'start']]) g += `<line x1="${X(m)}" y1="${yr - 26}" x2="${X(m)}" y2="${yr + 26}" stroke="${COR.tinta}" stroke-width="3"/><text x="${X(m) + (an === 'end' ? -4 : an === 'start' ? 4 : 0)}" y="${yr + 62}" font-size="28" font-weight="700" text-anchor="${an}" fill="${COR.tinta}">${t}</text>`;
      g += `<text x="${x0}" y="${yr - 42}" font-size="30" font-weight="800" fill="${COR.tinta}">MACH ${dec(mach, 2)}</text></g>`;
    }
    if (s.angulo) {
      const {n, a, graus, o} = s.angulo;
      g += `<g opacity="${o}"><line x1="${n[0][0]}" y1="${n[0][1]}" x2="${n[1][0]}" y2="${n[1][1]}" stroke="${COR.tinta}" stroke-width="2.5" stroke-dasharray="10 8"/><line x1="${a[0][0]}" y1="${a[0][1]}" x2="${a[1][0]}" y2="${a[1][1]}" stroke="${COR.baro}" stroke-width="5"/>
        <text x="${a[1][0] + 12}" y="${a[1][1] - 14}" font-size="40" font-weight="800" fill="${COR.baro}">${graus >= 0 ? '+' : '−'}${dec(Math.abs(graus))}°</text><text x="${n[1][0] + 12}" y="${n[1][1] + 30}" font-size="28" font-weight="700" fill="${COR.tinta}">neutro</text></g>`;
    }
    // pressão do ar contra o avião: barra presa ao avião (q / q-limite) + os 2 números lado a lado (velocidade × limite)
    if (s.pressao) {
      const {at, q: qv, eas, lim, o} = s.pressao;
      const x = Math.min(1180, Math.max(60, at[0] + 120)), y = Math.min(700, Math.max(140, at[1] - 40)), W = 340, k = Math.min(1, qv / 4);
      g += `<g opacity="${o}"><line x1="${at[0]}" y1="${at[1]}" x2="${x}" y2="${y + 40}" stroke="#fff" stroke-width="2"/><rect x="${x}" y="${y - 50}" width="${W + 40}" height="172" rx="10" fill="rgba(14,18,22,.62)"/>
        <text x="${x + 20}" y="${y - 16}" font-size="22" font-weight="700" letter-spacing="3" fill="#fff">PRESIÓN DEL AIRE</text>
        <rect x="${x + 20}" y="${y + 2}" width="${W}" height="22" rx="11" fill="rgba(255,255,255,.18)"/><rect x="${x + 20}" y="${y + 2}" width="${W * k}" height="22" rx="11" fill="${COR.baro}"/>
        <line x1="${x + 20 + W / 4}" y1="${y - 6}" x2="${x + 20 + W / 4}" y2="${y + 32}" stroke="#fff" stroke-width="3"/><text x="${x + 20 + W / 4}" y="${y + 56}" font-size="20" font-weight="700" text-anchor="middle" fill="#fff">límite</text>
        <text x="${x + 20 + W}" y="${y + 56}" font-size="34" font-weight="800" text-anchor="end" fill="${COR.baro}">×${dec(qv)}</text>
        <text x="${x + 20}" y="${y + 104}" font-size="30" font-weight="800" fill="#fff">${fmt(eas)} nudos <tspan fill="rgba(255,255,255,.7)" font-weight="600">· límite ${lim}</tspan></text></g>`;
    }
    // vetores: descida + avanço = resultante (a partir do avião), e a comparação com um avião de linha em cruzeiro
    if (s.vetores) {
      const {p, dn, fw, o, oR, oC} = s.vetores;
      const seta = (a, b, c, w, txt, dx = 14, dy = 0) => {
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), h = 22;
        return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/><path d="M${b[0]} ${b[1]} L${b[0] - h * Math.cos(ang - 0.45)} ${b[1] - h * Math.sin(ang - 0.45)} L${b[0] - h * Math.cos(ang + 0.45)} ${b[1] - h * Math.sin(ang + 0.45)} Z" fill="${c}"/>` + (txt ? `<text x="${b[0] + dx}" y="${b[1] + dy}" font-size="30" font-weight="800" fill="${c}" style="paint-order:stroke" stroke="rgba(0,0,0,.45)" stroke-width="4">${txt}</text>` : '');
      };
      const r = [p[0] + (dn[0] - p[0]) + (fw[0] - p[0]), p[1] + (dn[1] - p[1]) + (fw[1] - p[1])];
      g += `<g opacity="${o}">${seta(p, dn, '#fff', 6, '290 m/s ↓', 14, 0)}${seta(p, fw, '#fff', 6, '120 m/s', -60, -20)}</g>`;
      g += `<g opacity="${oR}">${seta(p, r, COR.baro, 9, '1.120 km/h', 16, 10)}</g>`;
      if (oC > 0) {
        const x0 = 980, y0 = 700, Wm = 520, X = (v) => (v / 1200) * Wm;
        g += `<g opacity="${oC}"><rect x="${x0 - 20}" y="${y0 - 50}" width="${Wm + 60}" height="170" rx="10" fill="rgba(14,18,22,.62)"/>
          <text x="${x0}" y="${y0 - 14}" font-size="24" font-weight="700" fill="#fff">ESTE AVIÓN, AL FINAL</text><rect x="${x0}" y="${y0}" width="${X(1120)}" height="24" rx="12" fill="${COR.baro}"/><text x="${x0 + X(1120) - 6}" y="${y0 + 21}" font-size="20" font-weight="800" text-anchor="end" fill="#111">1.120 km/h</text>
          <text x="${x0}" y="${y0 + 62}" font-size="24" font-weight="700" fill="#fff">AVIÓN DE LÍNEA EN CRUCERO</text><rect x="${x0}" y="${y0 + 76}" width="${X(900)}" height="24" rx="12" fill="rgba(255,255,255,.75)"/><text x="${x0 + X(900) - 6}" y="${y0 + 97}" font-size="20" font-weight="800" text-anchor="end" fill="#111">~900 km/h</text></g>`;
      }
    }
    // as 3 perguntas do vídeo (blocos 02 e 10): abertas (contorno) ou respondidas (cheias, com etiqueta)
    if (s.marcas) {
      const {o, est, claro} = s.marcas, cy = 690, xs = [440, 800, 1160], c0 = claro ? COR.tinta : '#fff';
      const NOME = ['¿QUÉ TAN RÁPIDO?', '¿QUÉ HACE LA PIEZA?', '¿CUÁNDO SE SOLTÓ?'];
      xs.forEach((x, i) => {
        const e = est[i] || {o: 0}, cor = e.tag === 'DESCONOCIDO' ? c0 : e.tag ? COR.baro : c0;
        g += `<g opacity="${o * (e.o ?? 1)}" transform="translate(${x} ${cy - 30 + 20 * (1 - (e.o ?? 1))})"><circle r="70" fill="${e.tag && e.tag !== 'DESCONOCIDO' ? 'rgba(255,122,31,.16)' : 'none'}" stroke="${cor}" stroke-width="4"/>${ICONE[i](cor)}
          <text y="118" font-size="28" font-weight="800" text-anchor="middle" fill="${c0}" style="paint-order:stroke" stroke="${claro ? 'none' : 'rgba(0,0,0,.4)'}" stroke-width="4">${NOME[i]}</text>
          ${e.tag ? `<text y="160" font-size="26" font-weight="800" letter-spacing="2" text-anchor="middle" fill="${cor}" style="paint-order:stroke" stroke="${claro ? 'none' : 'rgba(0,0,0,.4)'}" stroke-width="4">${e.tag}</text>` : ''}</g>`;
      });
    }
    // réguas de velocidade lado a lado (caso de 2006 × Florida)
    if (s.reguas) {
      const {o, k} = s.reguas, x0 = 220, W = 1160, X = (v) => (v / 650) * W;
      [[`LEARJET 36 · 2006 · ATERRIZÓ`, 380, 'rgba(29,35,41,.85)', 700], [`LEARJET 60 · FLORIDA`, 570, COR.baro, 800]].forEach(([t, v, c, y], i) => {
        const kk = clamp01(k * 1.6 - i * 0.6);
        g += `<g opacity="${o}"><text x="${x0}" y="${y - 16}" font-size="28" font-weight="800" fill="${COR.tinta}">${t}</text><rect x="${x0}" y="${y}" width="${W}" height="30" rx="15" fill="rgba(29,35,41,.1)"/>
          <rect x="${x0}" y="${y}" width="${X(v) * kk}" height="30" rx="15" fill="${c}"/><text x="${x0 + X(v) * kk + 14}" y="${y + 25}" font-size="30" font-weight="800" fill="${COR.tinta}" opacity="${clamp01(kk * 3)}">${i ? 'más de ' : ''}${v} nudos</text></g>`;
      });
    }
    svg.innerHTML = g;
    // dois altímetros + perfil
    q('.alt').style.opacity = s.alt ? s.alt.o : 0;
    if (s.alt) {
      const {tt, baro, gps, trava} = s.alt;
      q('.vb').textContent = `${fmt(baro)} pies`;
      q('.vg').textContent = `${fmt(gps)} pies`;
      q('.sb').textContent = trava > 0 ? `sin cambio hace ${dec(trava)} s` : '';
      q('.sg').textContent = trava > 0 ? 'sigue cayendo' : '';
      q('.b').style.outline = trava > 0 && !s.alt.soBaro ? `4px solid ${COR.baro}` : 'none';
      q('.g').style.opacity = s.alt.soBaro ? 0 : 1;
      if (s.alt.soBaro) q('.sb').textContent = '';
      if (s.alt.perfil) {
        const gx = 860, gy = 600, gw = 660, gh = 230, T0 = 120, T1 = 150.5, A1 = 22000;
        const X = (t) => gx + ((t - T0) / (T1 - T0)) * gw, Y = (a) => gy + gh - (a / A1) * gh;
        cv.globalAlpha = s.alt.o;
        cv.fillStyle = 'rgba(14,18,22,.55)';
        cv.fillRect(gx - 20, gy - 20, gw + 40, gh + 50);
        cv.lineWidth = 6;
        for (const [j, c] of s.alt.soBaro ? [[1, COR.baro]] : [[2, COR.gps], [1, COR.baro]]) {
          cv.strokeStyle = c;
          cv.beginPath();
          let ini = false;
          for (const p of ALT) {
            if (p[0] < T0 || p[0] > tt) continue;
            ini ? cv.lineTo(X(p[0]), Y(p[j])) : (cv.moveTo(X(p[0]), Y(p[j])), (ini = true));
          }
          if (ini) cv.lineTo(X(tt), Y(j === 1 ? baro : gps));
          cv.stroke();
        }
        cv.fillStyle = '#fff';
        cv.font = '700 22px Inter, system-ui, sans-serif';
        cv.fillText('20.000 pies', gx - 8, Y(20000) - 8);
        cv.fillText('0', gx - 8, Y(0) + 26);
        cv.globalAlpha = 1;
      }
    }
    // vento (mapa): setas de leste para oeste nas camadas baixas
    if (s.vento) {
      cv.globalAlpha = s.vento.o;
      cv.strokeStyle = '#fff';
      cv.fillStyle = '#fff';
      cv.lineWidth = 5;
      for (const [a, b] of s.vento.setas) {
        const off = ((s.t * 0.35) % 1) * 30;
        const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
        const A = [a[0] + ux * off, a[1] + uy * off], Bp = [b[0] + ux * off, b[1] + uy * off];
        cv.beginPath();
        cv.moveTo(...A);
        cv.lineTo(...Bp);
        cv.stroke();
        cv.beginPath();
        cv.moveTo(Bp[0] + ux * 18, Bp[1] + uy * 18);
        cv.lineTo(Bp[0] - uy * 12, Bp[1] + ux * 12);
        cv.lineTo(Bp[0] + uy * 12, Bp[1] - ux * 12);
        cv.fill();
      }
      cv.globalAlpha = 1;
    }
    if (s.rain) {
      cv.lineWidth = 1.2;
      for (let i = 0; i < 160; i++) {
        const ph = (i * 0.618) % 1, x = (i * 97.3) % 1700, off = (s.t * 1500 * (0.7 + ph) + ph * 2400) % 1300;
        cv.strokeStyle = `rgba(232,238,244,${(0.08 + 0.2 * ph).toFixed(3)})`;
        cv.beginPath();
        cv.moveTo(x - off * 0.3, off - 200);
        cv.lineTo(x - off * 0.3 - 60, off - 200 + 220);
        cv.stroke();
      }
    }
  };
}

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export const run = () =>
  runSim({duration: DURATION, fps: 24, theme: 'light', hud: {enabled: false, title: 'learjet p4', subtitle: ''}, director: {enabled: false}, watermark: ''}, async ({canvas, capture}) => {
    const [cidadeGltf, chaoGltf, jetGltf] = await Promise.all([loadGlb(cidadeB64), loadGlb(chaoB64), loadGlb(jetB64)]);
    const stage = await createStage({canvas});
    const W = buildWorld({cidadeGltf, chaoGltf, jetGltf});
    stage.scene.add(W.root);
    // estúdio: Learjet 60 por código sem a empenagem horizontal dele + a cauda em corte no topo da deriva
    const LJ = buildLearjet60();
    LJ.root.traverse((o) => { if (/^(estabE|estabD|profD)$/.test(o.name)) o.visible = false; });
    LJ.elev.forEach((p) => (p.visible = false));
    const derivaLJ = LJ.root.getObjectByName('deriva');
    derivaLJ.material = derivaLJ.material.clone();
    derivaLJ.material.transparent = true;
    const CA = buildCauda({comDeriva: false});
    CA.root.position.set(6.86 + 1.0, 3.02, 0);
    const ESTUDIO = new THREE.Group();
    ESTUDIO.position.set(0, 50000, 0);
    // arfagem do avião inteiro no estúdio ("la cola baja, el morro sube"), em volta do centro de gravidade (~x 0,6)
    const AVIAO = new THREE.Group();
    AVIAO.position.set(0.6, 0, 0);
    LJ.root.position.x = -0.6;
    CA.root.position.x -= 0.6;
    AVIAO.add(LJ.root, CA.root);
    ESTUDIO.add(AVIAO);
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({opacity: 0.16}));
    piso.rotation.x = -Math.PI / 2;
    piso.position.y = -1.4;
    piso.receiveShadow = true;
    ESTUDIO.add(piso);
    stage.scene.add(ESTUDIO);
    // mapa: faixa de 2,1–6,1 km, bordas, ponto onde a barométrica congela, trecho da trilha sobre a faixa (28.600 → 15.700 ft)
    const faixa = new THREE.Mesh(new THREE.RingGeometry(2100, 6100, 128), new THREE.MeshBasicMaterial({color: COR.baro, transparent: true, opacity: 0.15, depthWrite: false, side: THREE.DoubleSide}));
    faixa.rotation.x = -Math.PI / 2;
    faixa.position.y = 30;
    const bordas = [2100, 6100].map((r) => new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length: 256}, (_, i) => new THREE.Vector3(r * Math.cos((i / 256) * 6.283), 32, r * Math.sin((i / 256) * 6.283)))), new THREE.LineBasicMaterial({color: COR.baro, transparent: true})));
    const iTrava = PTS.findIndex((p) => p[0] >= 140.2);
    const marca = new THREE.Mesh(new THREE.SphereGeometry(140, 24, 16), new THREE.MeshBasicMaterial({color: COR.baro}));
    marca.position.set(PTS[iTrava][1], PTS[iTrava][3], PTS[iTrava][2]);
    const segPts = PTS.filter((p) => p[0] >= 109.2 && p[0] <= 132.2).map((p) => new THREE.Vector3(p[1], p[3], p[2]));
    const trecho = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(segPts), 200, 130, 10), new THREE.MeshBasicMaterial({color: COR.baro}));
    stage.scene.add(faixa, ...bordas, marca, trecho);

    const overlay = createOverlay(document.getElementById('app'));
    const resize = () => stage.resize(1600, 900, capture ? devicePixelRatio || 1 : Math.min(devicePixelRatio || 1, 2));
    resize();
    window.LJ = {stage, W, CA, THREE, B};
    // turbulência determinística por batida
    const SH = {r: 0, p: 0, y: 0};
    const tl = gsap.timeline({paused: true});
    for (const b of B) {
      const [ar, ap, ay] = b.turb || [0, 0, 0];
      const d = b.v1 - b.v0;
      tl.fromTo(SH, {r: 0}, {r: ar, duration: d, ease: 'turbR', immediateRender: false}, b.v0)
        .fromTo(SH, {p: 0}, {p: ap, duration: d, ease: 'turbP', immediateRender: false}, b.v0)
        .fromTo(SH, {y: 0}, {y: ay, duration: d, ease: 'turbY', immediateRender: false}, b.v0);
    }
    const caudaDe = (b, u) => {
      const c = b.cauda || {}, d = b.v1 - b.v0;
      const mach = c.mach ? lin(c.mach, u, d) : 0;
      const incid = c.machTrim ? 6.5 + 4.5 * clamp01((mach - 0.7) / 0.11) : lin(c.incid ?? 6.5, u, d);
      const prof = c.prof ? c.prof.amp * Math.sin(u * (c.prof.f ?? 2.6)) * (c.prof.ate ? 1 - ss(c.prof.ate - 0.4, c.prof.ate, u) : 1) : 0;
      return {raiox: lin(c.raiox ?? 0, u, Math.min(d, c.raioxDur ?? 1.6)), incid, prof, mach, brilho: c.brilho ? ss(c.brilho[0], c.brilho[1], u) : 0,
        solta: c.solta != null ? Math.max(0, u - c.solta) * 1.1 : 0, fant: c.fant ? 1 : 0, roscaGiro: u * (c.giro ?? 2)};
    };
    const cena3d = (b, t, u, acc) => {
      const f = b.fam, ceu = f === 'ceu' || f === 'altim', est = f === 'estudio', mapa = f === 'mapa';
      W.jet.visible = ceu;
      W.chao.visible = mapa;
      W.cidade.visible = false;
      ESTUDIO.visible = est;
      const fx = mapa && b.faixa ? b.faixa : null;
      faixa.visible = !!fx;
      bordas.forEach((x) => (x.visible = !!fx));
      marca.visible = mapa && b.marca != null;
      trecho.visible = mapa && b.trecho != null;
      if (fx) {
        const k = fx === true ? 1 : ss(fx, fx + 0.8, u);
        faixa.material.opacity = 0.15 * k;
        bordas.forEach((x) => (x.material.opacity = k));
      }
      if (marca.visible) marca.scale.setScalar(ss(b.marca, b.marca + 0.6, u) + 1e-3);
      if (trecho.visible) trecho.scale.setScalar(1), (trecho.material.opacity = 1), (trecho.visible = u >= b.trecho);
      W.elev.forEach((m) => (m.visible = !!m.userData.sempre));
      let P = [0, 0, 0];
      let cam = camAt(b, u);
      const d = b.v1 - b.v0;
      if (ceu) {
        const pose = b.pose || {};
        P = [-(b.speed ?? 200) * t, (b.alt ?? 10000) - (b.sink ?? 0) * u, 0];
        W.jet.position.set(...P);
        tl.seek(t, false);
        W.jet.position.y += SH.y;
        W.jet.rotation.set((lin(pose.roll, u, d) + SH.r) * D2R, 0, (lin(pose.pitch, u, d) + SH.p) * D2R);
        cam = {...cam, pos: add(P, cam.pos), tgt: add(P, cam.tgt)};
      }
      if (est) {
        const c = caudaDe(b, u);
        CA.set(c);
        AVIAO.rotation.z = -lin(b.arfagem ?? 0, u, d) * D2R - (b.arfOsc ? b.arfOsc * Math.sin(u * 2.6) : 0) * D2R;
        derivaLJ.material.opacity = 1 - 0.8 * c.raiox;
        derivaLJ.material.depthWrite = c.raiox < 0.5;
        P = [0, 50000, 0];
        cam = {...cam, pos: add(P, cam.pos), tgt: add(P, cam.tgt), near: 0.05, far: 500};
      }
      W.setSmoke(t, false);
      const r = W.setRoute(mapa && b.route ? b.route[0] + (b.route[1] - b.route[0]) * ss(0, Math.max(0.5, d - 0.3), u) : 0, mapa && !!b.route);
      if (mapa) W.crater.visible = true; // a cratera fica marcada em todo plano de mapa, com ou sem trilha
      stage.frame(cam, b.clima, P, {run: ceu ? (b.speed ?? 200) * t : 0, ao: ceu || est, t, ...acc});
      return {r, P};
    };
    return {
      resize,
      render(t) {
        const b = batAt(t);
        const u = t - b.v0, d = b.v1 - b.v0;
        const CF = window.__SIM_CONFIG || {};
        const N = CF.sub || 1, obt = (CF.obturador ?? 0.5) / (CF.fps || 24);
        let r = null, P = [0, 0, 0];
        for (let i = 0; i < N; i++) {
          const dd = N === 1 || i === N - 1 ? 0 : ((i + 0.5) / (N - 1) - 0.5) * obt;
          const ts = Math.min(Math.max(t + dd, b.v0), b.v1 - 1e-4);
          ({r, P} = cena3d(b, ts, ts - b.v0, {sub: i, subN: N, t}));
        }
        const est = b.fam === 'estudio';
        const s = {t, claro: est, rain: !!b.rain, labs: []};
        const fade = (t0, t1 = t0 + 0.5) => ent(t0, t1, u) * (1 - ss(d - 0.35, d, u));
        for (const ui of b.ui || []) {
          const o = fade(ui.t ?? 0.2);
          if (u < (ui.t ?? 0)) continue;
          if (ui.tipo === 'rotulo') {
            let v = null;
            if (ui.anc === 'aviao') v = W.jet.localToWorld(new THREE.Vector3(...(ui.p || [0, 0, 0])));
            else if (ui.anc === 'marca') v = marca.position.clone();
            else if (ui.anc === 'cratera') v = new THREE.Vector3(0, 30, 0);
            else if (ui.anc === 'faixa') v = new THREE.Vector3(-4100 * 0.7, 30, -4100 * 0.7);
            else if (ui.anc === 'lj') v = LJ.root.localToWorld(new THREE.Vector3(...ui.p));
            else if (ui.anc === 'trecho') v = segPts[Math.floor(segPts.length / 2)].clone();
            else if (CA.anchors[ui.anc]) v = CA.anchors[ui.anc]();
            const at = v && stage.project(v);
            if (at) s.labs.push({at, off: ui.off || [140, -140], txt: ui.txt, o});
          }
          if (ui.tipo === 'nota') s.nota = {txt: ui.txt, o};
          if (ui.tipo === 'titulo') s.tit = {txt: ui.txt, o};
          if (ui.tipo === 'gauge') {
            const c = caudaDe(b, u);
            s.gauge = {incid: c.incid, mach: c.mach, o};
          }
          if (ui.tipo === 'angulo') {
            const c = caudaDe(b, u), cd = CA.anchors.corda(1.3), pr = (v) => stage.project(v);
            const A = cd.atual.map(pr), Nn = cd.neutra.map(pr);
            if (A.every(Boolean) && Nn.every(Boolean)) s.angulo = {a: A, n: Nn, graus: c.incid - 6.5, o};
          }
          if (ui.tipo === 'relogio') {
            const tt = ui.tt[0] + (ui.tt[1] - ui.tt[0]) * clamp01(u / d);
            s.rel = {l1: 'HORA (ESTE DE EE. UU.)', v1: clockET(tt), l2: 'ALTITUD (GPS)', v2: `${fmt(lerpSerie(ALT, tt, 2))} pies`, o};
          }
          if (ui.tipo === 'hora' && r) s.rel = {l1: 'HORA (ESTE DE EE. UU.)', v1: clockET(r.tt), o};
          if (ui.tipo === 'pressao') {
            const tt = ui.tt[0] + (ui.tt[1] - ui.tt[0]) * clamp01(u / d);
            const at = stage.project(W.jet.localToWorld(new THREE.Vector3(0, 0, 0)));
            const altG = lerpSerie(ALT, tt, 2); // o limite (Vmo) muda a 8.000 pés: pela altitude GPS (a barométrica trava)
            if (at) s.pressao = {at, q: lerpSerie(SERIE, tt, 5), eas: lerpSerie(SERIE, tt, 4), lim: altG < 8000 ? 300 : 340, o};
          }
          if (ui.tipo === 'vetores') {
            const p0 = W.jet.position.clone(), k = 0.022;
            const pr = (v) => stage.project(v);
            const p = pr(p0), dn = pr(p0.clone().add(new THREE.Vector3(0, -290 * k, 0))), fw = pr(p0.clone().add(new THREE.Vector3(-120 * k, 0, 0)));
            if (p && dn && fw) s.vetores = {p, dn, fw, o, oR: fade(ui.tR ?? 1.6), oC: ui.tC != null ? fade(ui.tC) : 0};
          }
          if (ui.tipo === 'marcas') s.marcas = {o, claro: est, est: ui.est.map((e) => (e.hide ? {o: 0} : {...e, o: e.t != null ? ent(e.t, e.t + 0.5, u) : 1}))};
          if (ui.tipo === 'reguas') s.reguas = {o, k: ss(ui.t ?? 0.3, (ui.t ?? 0.3) + 2.2, u)};
          if (ui.tipo === 'vento') {
            const pr = (v) => stage.project(v);
            const setas = [[2600, -900], [3000, 400], [2300, 1500]].map(([x, z]) => [pr(new THREE.Vector3(x, 40, z)), pr(new THREE.Vector3(x - 1600, 40, z))]).filter(([a, c]) => a && c);
            s.vento = {setas, o};
            s.labs.push(...(setas[0] ? [{at: setas[0][0], off: [60, -110], txt: 'VIENTO BAJO, DEL ESTE', o}] : []));
          }
        }
        if (b.altim) {
          const tt = b.altim.from + u * b.altim.rate, baro = lerpSerie(ALT, tt, 1), gps = lerpSerie(ALT, tt, 2);
          s.alt = {tt, baro: tt >= 140.2 ? 8750 : baro, gps, trava: tt >= 140.26 ? tt - 140.26 : 0, perfil: b.altim.perfil !== false, soBaro: !!b.altim.soBaro, o: ent(0.1, 0.6, u)};
        }
        overlay(s);
        void P;
        return {};
      },
    };
  });
