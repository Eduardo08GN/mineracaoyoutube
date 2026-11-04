// Prova da stack nova do Segundo a Segundo (Learjet de Palm Beach): 6 tomadas, uma por tipo de plano do Reconstructed,
// no teardown (three.js) com céu, luz e nuvens volumétricas prontos (@takram), render(t) puro. Cada tomada mostra algo
// mudando enquanto a fala explicaria:
//  A nariz      : câmera colada no nariz, o avião atravessando o céu sobre o mar de nuvens
//  B pequeno    : o avião pequeno no céu imenso, inclinando
//  F rota       : a trilha ADS-B real se desenha em 3D sobre a NAIP, com altitude e hora correndo, até a cratera
//  C mergulho   : nariz para baixo dentro das nuvens de tormenta, altitude e descida reais (barométricas) contando
//  D profundor  : o profundor esquerdo acende, é nomeado e se solta em 3 pedaços
//  E bairro     : Greenacres oblíqua (OSM + NAIP) com a coluna de fumaça na cratera, sob o teto de nuvens
import * as THREE from 'three';
import {gsap} from 'gsap';
import {CustomEase} from 'gsap/CustomEase';
import {CustomWiggle} from 'gsap/CustomWiggle';
import {runSim} from 'teardown-kit/runtime.js';
gsap.registerPlugin(CustomEase, CustomWiggle);
// tremor de turbulência: wiggles uniformes (determinísticos) com frequências diferentes por eixo
CustomWiggle.create('turbR', {wiggles: 38, type: 'uniform'});
CustomWiggle.create('turbP', {wiggles: 29, type: 'uniform'});
CustomWiggle.create('turbY', {wiggles: 23, type: 'uniform'});
import {clamp01, easeInOutCubic, keyed, rng} from 'teardown-kit/util.js';
import chaoB64 from './assets/chao.glb';
import cidadeB64 from './assets/cidade.glb';
import jetB64 from './assets/learjet.glb';
import {PTS} from './adsb.js';
import {createStage} from './stage.js';
import {buildWorld, loadGlb} from './world.js';

const D2R = Math.PI / 180;
const ss = (a, b, t) => easeInOutCubic(clamp01((t - a) / (b - a)));
const fmt = (n) => Math.round(n).toLocaleString('es-ES').replace(/ /g, '.');

// ---------------------------------------------------------------- as tomadas
// Nas tomadas de céu o avião voa a `speed` m/s para oeste (-x) na altitude `alt`; a câmera (`cam`) é relativa ao avião.
// Nas de chão/mapa a câmera é absoluta (metros, origem na cratera).
export const TAKES = [
  {
    id: 'A_nariz', dur: 4.5, clima: 'cruzeiro', mode: 'ceu', alt: 10700, speed: 225, rain: true, turb: [0.35, 0.25, 0.05],
    pose: (u) => ({pitch: 1.5, roll: 4 * Math.sin(u * 0.9), yaw: 0}),
    cam: [[0, {pos: [-19.0, 2.7, 8.4], tgt: [-4.6, 0.25, 0.0], fov: 22}], [4.5, {pos: [-17.4, 2.4, 7.6], tgt: [-4.0, 0.25, 0.0], fov: 21}]],
  },
  {
    id: 'B_pequeno', dur: 4.5, clima: 'cruzeiro', mode: 'ceu', alt: 10700, speed: 225,
    pose: (u) => ({pitch: 0, roll: -6 - 6 * ss(0, 4.5, u), yaw: 0}),
    cam: [[0, {pos: [42, 16, 98], tgt: [2, 0, 0], fov: 22}], [4.5, {pos: [30, 14, 100], tgt: [-6, 0, 0], fov: 22}]],
  },
  {
    // a descida real neste trecho é ~200 m/s; a câmera cai junto com o avião
    id: 'C_mergulho', dur: 4.5, clima: 'tormenta', mode: 'ceu', alt: 6500, speed: 160, sink: 190, rain: true, turb: [1.8, 1.2, 0.22], hud5: true,
    pose: (u) => ({pitch: 38 + 4 * u, roll: 24 + 5 * u, yaw: 0}),
    cam: [[0, {pos: [17, 15, -10], tgt: [0, -1.2, 0], fov: 40}], [4.5, {pos: [14, 12.5, -12], tgt: [0, -1.6, 0], fov: 40}]],
    hud: {from: 122.5}, // 17:49:05.3Z (t desde 17:47:02.8Z): altitude barométrica e descida reais
  },
  {
    id: 'D_profundor', dur: 5.5, clima: 'cruzeiro', mode: 'ceu', alt: 9800, speed: 225,
    pose: (u) => ({pitch: 2, roll: 2 * Math.sin(u * 1.3), yaw: 0}),
    cam: [[0, {pos: [17.5, 7.4, 11.5], tgt: [7.5, 2.6, 1.4], fov: 22}], [5.5, {pos: [16.0, 6.8, 10.2], tgt: [7.6, 2.6, 1.5], fov: 21}]],
    elev: {glow: [0.5, 1.1], label: 1.0, solta: 2.6, nota: 3.3},
  },
  {
    id: 'E_bairro', dur: 5.0, clima: 'cidade', mode: 'cidade',
    cam: [[0, {pos: [-1350, 430, 1300], tgt: [150, 40, -80], fov: 40, near: 2, far: 1e6}], [5.0, {pos: [-1150, 390, 1120], tgt: [170, 50, -80], fov: 40, near: 2, far: 1e6}]],
  },
  {
    // revisão de forma (portão 3): perfil esquerdo quase ortográfico, nariz à esquerda como no desenho de referência; não entra no vídeo
    id: 'Z_perfil', dur: 1.0, clima: 'cruzeiro', mode: 'ceu', alt: 10700, speed: 0,
    pose: () => ({pitch: 0, roll: 0, yaw: 0}),
    cam: [[0, {pos: [0, 0.6, 140], tgt: [0, 0.6, 0], fov: 8.2}], [1.0, {pos: [0, 0.6, 140], tgt: [0, 0.6, 0], fov: 8.2}]],
  },
];
let acc = 0;
for (const k of TAKES) (k.t0 = acc), (acc += k.dur);
export const DURATION = acc;
const takeAt = (t) => TAKES.filter((k) => k.t0 <= t).pop();
const camAt = (k, u) => {
  const pick = (f) => keyed(k.cam.map(([a, c]) => [a, f(c)]), u, easeInOutCubic);
  return {pos: pick((c) => c.pos), tgt: pick((c) => c.tgt), fov: pick((c) => c.fov ?? 36), near: k.cam[0][1].near, far: k.cam[0][1].far};
};
const adsbAt = (tt) => {
  let i = 0;
  while (i < PTS.length - 2 && PTS[i + 1][0] <= tt) i++;
  const a = PTS[i], b = PTS[i + 1], k = clamp01((tt - a[0]) / Math.max(1e-6, b[0] - a[0]));
  const m = (j) => (a[j] == null || b[j] == null ? a[j] ?? b[j] : a[j] + (b[j] - a[j]) * k);
  return {alt: m(4), vz: m(5)};
};
const extraAt = (tt) => {
  let i = 0;
  while (i < PTS.length - 2 && PTS[i + 1][0] <= tt) i++;
  const a = PTS[i], b = PTS[i + 1], k = clamp01((tt - a[0]) / Math.max(1e-6, b[0] - a[0]));
  const m = (j) => (a[j] == null || b[j] == null ? a[j] ?? b[j] ?? 0 : a[j] + (b[j] - a[j]) * k);
  return {gs: m(6), trk: m(7)};
};
const clockET = (tt) => {
  const s = 12 * 3600 + 47 * 60 + 2.8 + tt; // 17:47:02.8Z = 12:47:02.8 hora do leste (UTC-5)
  const h = Math.floor(s / 3600), mi = Math.floor((s % 3600) / 60), se = Math.floor(s % 60);
  return `${h}:${String(mi).padStart(2, '0')}:${String(se).padStart(2, '0')} p. m.`;
};

// ---------------------------------------------------------------- a camada 2D: HUD de dois números, rótulo com linha, chuva
const CSS = `
  #lj{position:absolute;inset:0;pointer-events:none;font-family:'Inter',system-ui,sans-serif;color:#fff}
  #lj .hud{position:absolute;top:58px;left:0;right:0;display:flex;justify-content:center;gap:86px;opacity:0}
  #lj .hud5{position:absolute;top:46px;left:0;right:0;display:flex;justify-content:center;gap:58px;opacity:0}
  #lj .hud5 div{text-align:center} #lj .hud5 b{display:block;font-size:34px;font-weight:600;letter-spacing:-0.3px;text-shadow:0 1px 8px rgba(0,0,0,.4)}
  #lj .hud5 i{display:block;font-style:normal;font-size:12px;letter-spacing:4px;margin-bottom:6px;opacity:.85;text-shadow:0 1px 6px rgba(0,0,0,.4)}
  #lj .hud div{text-align:center} #lj .hud b{display:block;font-size:44px;font-weight:600;letter-spacing:-0.5px;text-shadow:0 1px 8px rgba(0,0,0,.35)}
  #lj .hud i{display:block;font-style:normal;font-size:15px;letter-spacing:5px;margin-bottom:6px;text-shadow:0 1px 6px rgba(0,0,0,.4)}
  #lj .lab{position:absolute;font-size:21px;letter-spacing:3px;font-weight:600;white-space:nowrap;opacity:0;text-shadow:0 1px 6px rgba(0,0,0,.4)}
  #lj .nota{position:absolute;left:0;right:0;bottom:92px;text-align:center;font-size:30px;font-weight:600;opacity:0;text-shadow:0 2px 12px rgba(0,0,0,.45)}
  #lj svg,#lj canvas{position:absolute;inset:0;width:1600px;height:900px}`;

function createOverlay(app) {
  const st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);
  const el = document.createElement('div');
  el.id = 'lj';
  el.innerHTML = `<canvas width="1600" height="900"></canvas><svg viewBox="0 0 1600 900"><line stroke="#fff" stroke-width="1.6"/><circle r="5" fill="none" stroke="#fff" stroke-width="1.6"/></svg>
    <div class="hud"><div><i>ALTITUD</i><b class="v1"></b></div><div><i class="l2">DESCENSO</i><b class="v2"></b></div></div>
    <div class="hud5">${['SEGUNDO', 'ALTITUD', 'VELOCIDAD VERTICAL', 'VELOCIDAD TERRESTRE', 'RUMBO'].map((l, i) => `<div><i>${l}</i><b class="h5_${i}"></b></div>`).join('')}</div>
    <div class="lab"></div><div class="nota"></div>`;
  app.appendChild(el);
  const cv = el.querySelector('canvas').getContext('2d');
  const q = (s) => el.querySelector(s);
  const R = rng(5);
  const DROPS = Array.from({length: 260}, () => [R() * 1700, R() * 1000, 0.6 + R() * 0.8, R()]);
  return (s) => {
    q('.hud').style.opacity = s.hud && !s.hud5 ? 1 : 0;
    q('.hud5').style.opacity = s.hud5 ? 1 : 0;
    if (s.hud5) s.hud5.forEach((v, i) => (q(`.h5_${i}`).textContent = v));
    if (s.hud) {
      q('.v1').textContent = s.hud.v1;
      q('.v2').textContent = s.hud.v2;
      q('.l2').textContent = s.hud.l2;
    }
    const lab = q('.lab'), line = q('line'), dot = q('circle');
    lab.style.opacity = s.lab ? s.lab.o : 0;
    line.style.opacity = dot.style.opacity = s.lab ? s.lab.o : 0;
    if (s.lab) {
      const [ax, ay] = s.lab.at, [lx, ly] = s.lab.to;
      lab.textContent = s.lab.txt;
      lab.style.left = `${lx}px`;
      lab.style.top = `${ly - 22}px`;
      line.setAttribute('x1', ax), line.setAttribute('y1', ay), line.setAttribute('x2', lx - 8), line.setAttribute('y2', ly - 12);
      dot.setAttribute('cx', ax), dot.setAttribute('cy', ay);
    }
    q('.nota').style.opacity = s.nota ? s.nota.o : 0;
    if (s.nota) q('.nota').textContent = s.nota.txt;
    cv.clearRect(0, 0, 1600, 900);
    if (s.rain) {
      // linhas de velocidade: saem do ponto de fuga do voo e correm para fora, mais longas e claras perto da borda
      const [vx, vy] = s.vp || [800, 450];
      cv.lineWidth = 1.0;
      for (const [x0, y0, sp, ph] of DROPS) {
        // direção do fluxo: do ponto de fuga para o centro da tela e além; cada linha nasce num ponto da tela e corre nesse sentido
        let fx = 800 - vx, fy = 450 - vy; const fl = Math.hypot(fx, fy) || 1; fx /= fl; fy /= fl;
        if (fl < 60) { fx = 0.55; fy = 0.83; }
        const off = (s.t * 1400 * sp + ph * 2400) % 2400;
        const px = ((x0 * 1.3 + 2400) % 2400) - 400 + fx * off - fx * 1200, py = ((y0 * 1.7 + 1600) % 1600) - 350 + fy * off - fy * 1200;
        const len = 140 + 280 * sp;
        cv.strokeStyle = `rgba(232,238,244,${(0.08 + 0.22 * ph).toFixed(3)})`;
        cv.beginPath();
        cv.moveTo(px, py);
        cv.lineTo(px + fx * len, py + fy * len);
        cv.stroke();
      }
    }
  };
}

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export const run = () =>
  runSim({duration: DURATION, fps: 30, theme: 'light', hud: {enabled: false, title: 'learjet', subtitle: ''}, director: {enabled: false}, watermark: ''}, async ({canvas, capture}) => {
    const MODELO = (window.__SIM_CONFIG && window.__SIM_CONFIG.modelo) || 'sketchfab'; // 04/11: modelo pronto por padrão (o do Reconstructed)
    const [cidadeGltf, chaoGltf, jetGltf] = await Promise.all([loadGlb(cidadeB64), loadGlb(chaoB64), MODELO === 'sketchfab' ? loadGlb(jetB64) : null]);
    const stage = await createStage({canvas});
    const W = buildWorld({cidadeGltf, chaoGltf, jetGltf});
    stage.scene.add(W.root);
    const overlay = createOverlay(document.getElementById('app'));
    const resize = () => stage.resize(1600, 900, capture ? devicePixelRatio || 1 : Math.min(devicePixelRatio || 1, 2));
    resize();
    window.LJ = {stage, W, THREE, TAKES};
    const SH = {r: 0, p: 0, y: 0};
    const tl = gsap.timeline({paused: true});
    for (const k of TAKES) {
      const [ar, ap, ay] = k.turb || [0, 0, 0];
      tl.fromTo(SH, {r: 0}, {r: ar, duration: k.dur, ease: 'turbR', immediateRender: false}, k.t0)
        .fromTo(SH, {p: 0}, {p: ap, duration: k.dur, ease: 'turbP', immediateRender: false}, k.t0)
        .fromTo(SH, {y: 0}, {y: ay, duration: k.dur, ease: 'turbY', immediateRender: false}, k.t0);
    }
    return {
      resize,
      render(t) {
        const k = takeAt(t);
        const u = t - k.t0;
        const ceu = k.mode === 'ceu';
        W.jet.visible = ceu;
        W.chao.visible = W.cidade.visible = !ceu;
        let P = [0, 0, 0];
        let cam = camAt(k, u);
        if (ceu) {
          const p = k.pose(u);
          P = [-k.speed * (k.t0 + u), k.alt - (k.sink ?? 0) * u, 0];
          W.jet.position.set(...P);
          tl.seek(t, false);
          W.jet.position.y += SH.y;
          W.jet.rotation.set((p.roll + SH.r) * D2R, p.yaw * D2R, (p.pitch + SH.p) * D2R);
          cam = {...cam, pos: add(P, cam.pos), tgt: add(P, cam.tgt)};
        }
        // profundor: acende, se solta em 3 pedaços que ficam para trás e caem girando (só na tomada D)
        const E = k.elev;
        W.elevMat.emissiveIntensity = E ? ss(E.glow[0], E.glow[1], u) * (0.85 + 0.15 * Math.sin(u * 6)) : 0;
        W.elev.forEach((m, i) => {
          m.visible = !!E;
          const h = m.userData.home;
          const v = E ? Math.max(0, u - E.solta - i * 0.12) : 0;
          const vib = E ? 0.12 * ss(E.glow[1], E.solta, u) * Math.sin(u * 38 + i) * (v > 0 ? 0 : 1) : 0;
          m.position.set(h.x + 4.9 * v * v, h.y - 2.2 * v * v + 0.2 * v, h.z + (i - 1) * 3.5 * v);
          m.rotation.set(v * (2.2 + i), v * (1.1 - i * 0.7), -vib + v * (1.6 - i * 0.5));
        });
        W.setSmoke(t, k.mode === 'cidade');
        const r = W.setRoute(k.route ? ss(k.route[0], k.route[1], u) : 0, k.mode === 'mapa');
        stage.frame(cam, k.clima, P, {run: ceu ? k.speed * (k.t0 + u) : 0, ao: ceu, t});
        // ponto de fuga do voo: um ponto bem à frente do avião na direção do voo (-x), projetado na tela
        const vp = ceu ? stage.project(new THREE.Vector3(P[0] - 1e5, P[1] - (k.sink ?? 0) * 400, P[2])) : null;
        // 2D
        const s = {t, rain: !!k.rain, vp};
        if (k.hud5) {
          const tt = k.hud.from + u, a = adsbAt(tt), e = extraAt(tt);
          s.hud5 = [`${Math.round(tt - 84.1)} / 62`, `${fmt(a.alt)} ft`, `${fmt(a.vz)} ft/min`, `${fmt(e.gs)} kt`, `${Math.round(e.trk)}°`];
        }
        if (k.hud) {
          const a = adsbAt(k.hud.from + u);
          s.hud = {v1: `${fmt(a.alt)} pies`, l2: 'DESCENSO', v2: `${fmt(a.vz)} pies/min`};
        }
        if (k.mode === 'mapa' && r) s.hud = {v1: `${fmt(r.altFt)} pies`, l2: 'HORA (ESTE DE EE. UU.)', v2: clockET(r.tt)};
        if (E && u > E.label) {
          const at = stage.project(W.anchors.elev());
          if (at) s.lab = {at, to: [at[0] + 140, at[1] - 130], txt: 'TIMÓN DE PROFUNDIDAD IZQUIERDO', o: ss(E.label, E.label + 0.4, u) * (1 - ss(E.solta + 1.6, E.solta + 2.0, u))};
        }
        if (E && u > E.nota) s.nota = {txt: 'Hallado en tres pedazos, hasta a 6 km del cráter', o: ss(E.nota, E.nota + 0.5, u)};
        overlay(s);
        return {};
      },
    };
  });
