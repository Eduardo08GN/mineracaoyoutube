// Learjet parte 4 (Segundo a Segundo): batedor dos elementos NOVOS, no mesmo motor da prova aprovada (film_prova.js).
//  C1 raio-x   : a cauda em T em estúdio creme; a pele da deriva fica transparente e mostra pino, atuador de fuso e 2 motores
//  C2 trim     : o estabilizador INTEIRO gira; o indicador PITCH TRIM e a régua de Mach leem a mesma entrada (Mach trim)
//  C3 profundor: o profundor sobe e desce pelos cabos; o esquerdo acende e sai em 3 pedaços
//  A1 altímetros: o avião mergulhando; ALTITUD BAROMÉTRICA trava em 8.750 enquanto ALTITUD GPS segue caindo (dados reais)
//  M1 faixa    : mapa oblíquo; a trilha ADS-B, a faixa de 2,1–6,1 km dos pedaços e o ponto onde a barométrica trava (1,16 km)
import * as THREE from 'three';
import {gsap} from 'gsap';
import {CustomEase} from 'gsap/CustomEase';
import {CustomWiggle} from 'gsap/CustomWiggle';
import {runSim} from 'teardown-kit/runtime.js';
gsap.registerPlugin(CustomEase, CustomWiggle);
CustomWiggle.create('turbR', {wiggles: 38, type: 'uniform'});
CustomWiggle.create('turbP', {wiggles: 29, type: 'uniform'});
CustomWiggle.create('turbY', {wiggles: 23, type: 'uniform'});
// easing da SKILL teardown: entra cubic-bezier(0.16,1,0.3,1), sai (0.6,0,0.9,0.35)
CustomEase.create('entra', '0.16,1,0.3,1');
CustomEase.create('sai', '0.6,0,0.9,0.35');
const E_IN = gsap.parseEase('entra'), E_OUT = gsap.parseEase('sai');
import {clamp01, easeInOutCubic, keyed} from 'teardown-kit/util.js';
import chaoB64 from './assets/chao.glb';
import cidadeB64 from './assets/cidade.glb';
import jetB64 from './assets/learjet.glb';
import {PTS} from './adsb.js';
import {buildCauda} from './cauda.js';
import {buildLearjet60} from './learjet60.js';
import {ALT, SERIE} from './dados_p4.js';
import {createStage} from './stage.js';
import {buildWorld, loadGlb} from './world.js';

const D2R = Math.PI / 180;
const ss = (a, b, t) => easeInOutCubic(clamp01((t - a) / (b - a)));
const ent = (a, b, t) => E_IN(clamp01((t - a) / (b - a)));
const sai = (a, b, t) => E_OUT(clamp01((t - a) / (b - a)));
const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // 8.750 (o es-ES não agrupa 4 dígitos)
const lerpSerie = (S, tt, j) => {
  let i = 0;
  while (i < S.length - 2 && S[i + 1][0] <= tt) i++;
  const a = S[i], b = S[i + 1], k = clamp01((tt - a[0]) / Math.max(1e-6, b[0] - a[0]));
  return a[j] == null || b[j] == null ? a[j] ?? b[j] : a[j] + (b[j] - a[j]) * k;
};
const COR = {baro: '#ff7a1f', gps: '#2f6fd6', tinta: '#1d2329', creme: '#f4eee2'};

// ---------------------------------------------------------------- as tomadas
export const TAKES = [
  {
    id: 'C1_raiox', dur: 5.0, clima: 'estudio', mode: 'estudio',
    cam: [[0, {pos: [13.2, 4.6, 6.6], tgt: [7.4, 2.3, 0.3], fov: 32}], [5.0, {pos: [10.2, 3.9, 3.8], tgt: [7.6, 2.6, 0.1], fov: 30}]],
    cauda: (u) => ({raiox: ent(0.6, 2.0, u), roscaGiro: u * 2}),
    rotulos: [['pino', 'PERNO (EJE DEL GIRO)', 2.0, [160, -140]], ['atuador', 'ACTUADOR DE HUSILLO', 2.6, [-220, -170]], ['motor', '2 MOTORES ELÉCTRICOS', 3.2, [-240, 120]]],
  },
  {
    id: 'C2_trim', dur: 6.0, clima: 'estudio', mode: 'estudio',
    cam: [[0, {pos: [7.4, 3.5, 7.4], tgt: [8.7, 2.6, 0.0], fov: 26}], [6.0, {pos: [7.8, 3.6, 6.9], tgt: [8.8, 2.65, 0.0], fov: 25}]],
    // Mach sobe de 0,70 a 0,81 (dado do voo: 12:47:51 → 12:48:27); o Mach trim leva o indicador de 6,5 para o lado N UP
    mach: (u) => 0.66 + 0.15 * ss(0.6, 5.0, u),
    cauda: (u) => {
      const m = 0.66 + 0.15 * ss(0.6, 5.0, u);
      return {raiox: 0.85, fant: ent(0.3, 1.0, u), incid: 6.5 + 4.5 * clamp01((m - 0.7) / 0.11), roscaGiro: u * 3};
    },
    gauge: true,
  },
  {
    id: 'C3_profundor', dur: 6.0, clima: 'estudio', mode: 'estudio',
    cam: [[0, {pos: [13.6, 4.6, 5.6], tgt: [8.3, 2.8, 1.0], fov: 28}], [6.0, {pos: [14.4, 3.9, 3.8], tgt: [8.8, 2.8, 1.4], fov: 30}]],
    cauda: (u) => ({raiox: 0.3, prof: 16 * Math.sin(Math.min(u, 2.4) * 2.6) * (1 - ss(2.0, 2.4, u)), brilho: ss(2.4, 3.0, u), solta: Math.max(0, u - 3.6) * 1.1}),
    rotulos: [['profundor', 'TIMÓN DE PROFUNDIDAD IZQUIERDO', 2.6, [140, -150]]],
    nota: [3.8, 'Hallado en tres pedazos, a entre 2 y 6 km del cráter'],
  },
  {
    // 12:49:20 → 12:49:33 EST (t = 137,2 → 150): o mergulho final, no ritmo real
    id: 'A1_altimetros', dur: 6.5, clima: 'tormenta', mode: 'ceu', alt: 3000, speed: 160, sink: 260, rain: true, turb: [1.8, 1.2, 0.22],
    pose: (u) => ({pitch: 52 + 3 * u, roll: 58 + 4 * u, yaw: 0}),
    cam: [[0, {pos: [30, 20, -20], tgt: [0, 1, -9], fov: 36}], [6.5, {pos: [26, 18, -23], tgt: [0, 1, -9], fov: 36}]],
    altim: {from: 137.2, rate: 1.97},
  },
  {
    id: 'M1_faixa', dur: 6.5, clima: 'mapa', mode: 'mapa',
    cam: [[0, {pos: [-9000, 13500, 12500], tgt: [-3000, 0, -600], fov: 38, near: 20, far: 2e6}], [6.5, {pos: [-6500, 11500, 11500], tgt: [-1800, 0, -500], fov: 38, near: 20, far: 2e6}]],
    route: [0.0, 3.0],
    faixa: true,
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
const clockET = (tt) => {
  const s = 12 * 3600 + 47 * 60 + 2.8 + tt;
  const h = Math.floor(s / 3600), mi = Math.floor((s % 3600) / 60), se = Math.floor(s % 60);
  return `${h}:${String(mi).padStart(2, '0')}:${String(se).padStart(2, '0')}`;
};

// ---------------------------------------------------------------- camada 2D (SKILL: rótulos >= 34 px, texto dentro da caixa)
const CSS = `
  #lj{position:absolute;inset:0;pointer-events:none;font-family:'Inter',system-ui,sans-serif}
  #lj .lab{position:absolute;font-size:34px;letter-spacing:1px;font-weight:700;white-space:nowrap;opacity:0;color:${COR.tinta}}
  #lj .lab.ceu{color:#fff;text-shadow:0 1px 8px rgba(0,0,0,.45)}
  #lj .nota{position:absolute;left:0;right:0;bottom:70px;text-align:center;font-size:36px;font-weight:700;opacity:0;color:${COR.tinta}}
  #lj .alt{position:absolute;top:44px;left:0;right:0;display:flex;justify-content:center;gap:40px;opacity:0}
  #lj .alt div{width:520px;padding:16px 22px 18px;border-radius:10px;background:rgba(14,18,22,.62);text-align:left}
  #lj .alt i{display:block;font-style:normal;font-size:24px;letter-spacing:3px;font-weight:700;margin-bottom:4px}
  #lj .alt b{display:block;font-size:76px;font-weight:800;letter-spacing:-1px;color:#fff;font-variant-numeric:tabular-nums}
  #lj .alt small{display:block;font-size:24px;color:#fff;opacity:.85;height:30px}
  #lj .mapa{position:absolute;top:44px;left:56px;opacity:0;color:#fff;text-shadow:0 1px 8px rgba(0,0,0,.6)}
  #lj .mapa i{display:block;font-style:normal;font-size:24px;letter-spacing:3px;font-weight:700} #lj .mapa b{font-size:60px;font-weight:800}
  #lj svg,#lj canvas{position:absolute;inset:0;width:1600px;height:900px}`;

function createOverlay(app) {
  const st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);
  const el = document.createElement('div');
  el.id = 'lj';
  el.innerHTML = `<canvas width="1600" height="900"></canvas><svg viewBox="0 0 1600 900"></svg>
    <div class="alt"><div class="b"><i style="color:${COR.baro}">ALTITUD BAROMÉTRICA</i><b class="vb"></b><small class="sb"></small></div>
      <div class="g"><i style="color:#7fb0ff">ALTITUD GPS</i><b class="vg"></b><small class="sg"></small></div></div>
    <div class="mapa"><i>HORA (ESTE DE EE. UU.)</i><b class="hm"></b></div>
    ${[0, 1, 2].map((i) => `<div class="lab l${i}"></div>`).join('')}<div class="nota"></div>`;
  app.appendChild(el);
  const cv = el.querySelector('canvas').getContext('2d');
  const svg = el.querySelector('svg');
  const q = (s) => el.querySelector(s);
  return (s) => {
    svg.innerHTML = '';
    cv.clearRect(0, 0, 1600, 900);
    const tinta = s.ceu ? '#fff' : COR.tinta;
    // rótulos com linha de chamada (bolinha no ponto da peça)
    [0, 1, 2].forEach((i) => {
      const L = s.labs?.[i], lab = q(`.l${i}`);
      lab.style.opacity = L ? L.o : 0;
      lab.className = `lab l${i}${s.ceu ? ' ceu' : ''}`;
      if (!L) return;
      const [ax, ay] = L.at, lx = ax + L.off[0], ly = ay + L.off[1];
      lab.textContent = L.txt;
      const esq = L.off[0] < 0;
      lab.style.left = `${Math.min(1600 - 24 - lab.offsetWidth, Math.max(24, esq ? lx - 12 - lab.offsetWidth : lx + 12))}px`;
      lab.style.top = `${ly - 24}px`;
      svg.insertAdjacentHTML('beforeend', `<g opacity="${L.o}"><line x1="${ax}" y1="${ay}" x2="${lx}" y2="${ly}" stroke="${tinta}" stroke-width="2.2"/><circle cx="${ax}" cy="${ay}" r="7" fill="none" stroke="${COR.baro}" stroke-width="3"/></g>`);
    });
    q('.nota').style.opacity = s.nota ? s.nota.o : 0;
    if (s.nota) q('.nota').textContent = s.nota.txt;
    // indicador PITCH TRIM (réplica do mostrador: 1 a 12, troca de velocidade em 6,5, faixa de decolagem 5,7–8,75) + régua de Mach
    if (s.gauge) {
      const {incid, mach, o} = s.gauge, cx = 1300, cy = 300, R = 150;
      const ang = (v) => (-210 + ((v - 1) / 11) * 240) * D2R;
      const P = (v, r) => [cx + r * Math.cos(ang(v)), cy + r * Math.sin(ang(v))];
      const arco = (a, b, r) => { const [x0, y0] = P(a, r), [x1, y1] = P(b, r); return `M${x0} ${y0} A${r} ${r} 0 ${((b - a) / 11) * 240 > 180 ? 1 : 0} 1 ${x1} ${y1}`; };
      let g = `<g opacity="${o}"><circle cx="${cx}" cy="${cy}" r="${R + 26}" fill="${COR.creme}" stroke="${COR.tinta}" stroke-width="3"/>`;
      g += `<path d="${arco(5.7, 8.75, R - 8)}" stroke="#3f9b5a" stroke-width="16" fill="none"/>`;
      for (let v = 1; v <= 12; v++) {
        const [x0, y0] = P(v, R), [x1, y1] = P(v, R - 22), [tx, ty] = P(v, R - 50);
        g += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${COR.tinta}" stroke-width="3"/>`;
        if (v % 1 === 0 && [1, 4, 6, 8, 10, 12].includes(v)) g += `<text x="${tx}" y="${ty + 10}" font-size="28" font-weight="700" text-anchor="middle" fill="${COR.tinta}">${v}</text>`;
      }
      const [m0x, m0y] = P(6.5, R + 4), [m1x, m1y] = P(6.5, R - 30);
      g += `<line x1="${m0x}" y1="${m0y}" x2="${m1x}" y2="${m1y}" stroke="${COR.baro}" stroke-width="4"/>`;
      const [nx, ny] = P(incid, R - 14);
      g += `<line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="${COR.baro}" stroke-width="7" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="12" fill="${COR.tinta}"/>`;
      g += `<text x="${cx}" y="${cy + R + 70}" font-size="30" font-weight="800" letter-spacing="3" text-anchor="middle" fill="${COR.tinta}">PITCH TRIM</text>`;
      g += `<text x="${cx - 46}" y="${cy + 112}" font-size="22" font-weight="700" text-anchor="middle" fill="${COR.tinta}">N DN</text><text x="${cx + 46}" y="${cy + 112}" font-size="22" font-weight="700" text-anchor="middle" fill="${COR.tinta}">N UP</text>`;
      // régua de Mach: 0,60 a 0,90, marcas 0,70 (entra o Mach trim), 0,77 (limite sem Mach trim) e 0,81 (Mmo)
      const x0 = 1040, x1 = 1540, yr = 640, X = (m) => x0 + ((m - 0.6) / 0.3) * (x1 - x0);
      g += `<rect x="${x0}" y="${yr - 10}" width="${x1 - x0}" height="20" rx="10" fill="#d9cfbb"/><rect x="${x0}" y="${yr - 10}" width="${X(mach) - x0}" height="20" rx="10" fill="${COR.baro}"/>`;
      for (const [m, t, dy, an] of [[0.7, '0,70', 62, 'middle'], [0.77, '0,77', 62, 'end'], [0.81, '0,81', 62, 'start']]) g += `<line x1="${X(m)}" y1="${yr - 26}" x2="${X(m)}" y2="${yr + 26}" stroke="${COR.tinta}" stroke-width="3"/><text x="${X(m) + (an === 'end' ? -4 : an === 'start' ? 4 : 0)}" y="${yr + dy}" font-size="28" font-weight="700" text-anchor="${an}" fill="${COR.tinta}">${t}</text>`;
      g += `<text x="${x0}" y="${yr - 42}" font-size="30" font-weight="800" fill="${COR.tinta}">MACH ${mach.toFixed(2).replace('.', ',')}</text></g>`;
      svg.insertAdjacentHTML('beforeend', g);
    }
    if (s.angulo) {
      const {n, a, graus, o} = s.angulo;
      svg.insertAdjacentHTML('beforeend', `<g opacity="${o}"><line x1="${n[0][0]}" y1="${n[0][1]}" x2="${n[1][0]}" y2="${n[1][1]}" stroke="${COR.tinta}" stroke-width="2.5" stroke-dasharray="10 8"/>
        <line x1="${a[0][0]}" y1="${a[0][1]}" x2="${a[1][0]}" y2="${a[1][1]}" stroke="${COR.baro}" stroke-width="5"/>
        <text x="${a[1][0] + 12}" y="${a[1][1] - 14}" font-size="40" font-weight="800" fill="${COR.baro}" text-anchor="start">${graus >= 0 ? '+' : '−'}${Math.abs(graus).toFixed(1).replace('.', ',')}°</text>
        <text x="${n[1][0] + 12}" y="${n[1][1] + 30}" font-size="28" font-weight="700" fill="${COR.tinta}">neutro</text></g>`);
    }
    // dois altímetros lado a lado + o perfil das duas curvas embaixo (o "nivelamento" é a barométrica parada)
    q('.alt').style.opacity = s.alt ? 1 : 0;
    if (s.alt) {
      const {tt, baro, gps, trava} = s.alt;
      q('.vb').textContent = `${fmt(baro)} pies`;
      q('.vg').textContent = `${fmt(gps)} pies`;
      q('.sb').textContent = trava > 0 ? `sin cambio hace ${trava.toFixed(1).replace('.', ',')} s` : '';
      q('.sg').textContent = trava > 0 ? 'sigue cayendo' : '';
      q('.b').style.outline = trava > 0 ? `4px solid ${COR.baro}` : 'none';
      const gx = 860, gy = 600, gw = 660, gh = 230, T0 = 120, T1 = 150.5, A1 = 22000;
      const X = (t) => gx + ((t - T0) / (T1 - T0)) * gw, Y = (a) => gy + gh - (a / A1) * gh;
      cv.fillStyle = 'rgba(14,18,22,.55)';
      cv.fillRect(gx - 20, gy - 20, gw + 40, gh + 50);
      cv.lineWidth = 6;
      for (const [j, c] of [[2, COR.gps], [1, COR.baro]]) {
        cv.strokeStyle = c;
        cv.beginPath();
        let ini = false;
        for (const p of ALT) {
          if (p[0] < T0 || p[0] > tt) continue;
          ini ? cv.lineTo(X(p[0]), Y(p[j])) : (cv.moveTo(X(p[0]), Y(p[j])), (ini = true));
        }
        cv.lineTo(X(tt), Y(j === 1 ? baro : gps));
        cv.stroke();
      }
      cv.fillStyle = '#fff';
      cv.font = '700 22px Inter, system-ui, sans-serif';
      cv.fillText('20.000', gx - 8, Y(20000) - 6);
      cv.fillText('0 pies', gx - 8, Y(0) + 26);
    }
    q('.mapa').style.opacity = s.hora ? 1 : 0;
    if (s.hora) q('.hm').textContent = s.hora;
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
  runSim({duration: DURATION, fps: 30, theme: 'light', hud: {enabled: false, title: 'learjet p4', subtitle: ''}, director: {enabled: false}, watermark: ''}, async ({canvas, capture}) => {
    const [cidadeGltf, chaoGltf, jetGltf] = await Promise.all([loadGlb(cidadeB64), loadGlb(chaoB64), loadGlb(jetB64)]);
    const stage = await createStage({canvas});
    const W = buildWorld({cidadeGltf, chaoGltf, jetGltf});
    stage.scene.add(W.root);
    // a cauda em corte vive longe do mundo (estúdio próprio, chão de sombra)
    // estúdio: o Learjet 60 por código (o mesmo da prova) sem a empenagem horizontal dele; a cauda em corte entra no topo da
    // deriva (bordo de ataque da raiz em x 6,86, y 3,02; o pino fica 1,0 m atrás). A deriva dele é a pele que vira raio-x.
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
    ESTUDIO.add(LJ.root, CA.root);
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({opacity: 0.16}));
    piso.rotation.x = -Math.PI / 2;
    piso.position.y = -1.4;
    piso.receiveShadow = true;
    ESTUDIO.add(piso);
    stage.scene.add(ESTUDIO);
    // faixa dos pedaços: anel de 2,1 a 6,1 km em volta da cratera + marca onde a barométrica trava (1,16 km a ENE)
    const faixa = new THREE.Mesh(new THREE.RingGeometry(2100, 6100, 128), new THREE.MeshBasicMaterial({color: COR.baro, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide}));
    faixa.rotation.x = -Math.PI / 2;
    faixa.position.y = 30;
    const bordas = [2100, 6100].map((r) => {
      const l = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length: 256}, (_, i) => new THREE.Vector3(r * Math.cos((i / 256) * 6.283), 32, r * Math.sin((i / 256) * 6.283)))), new THREE.LineBasicMaterial({color: COR.baro}));
      return l;
    });
    const iTrava = PTS.findIndex((p) => p[0] >= 140.2);
    const pTrava = new THREE.Vector3(PTS[iTrava][1], PTS[iTrava][3], PTS[iTrava][2]);
    const marca = new THREE.Mesh(new THREE.SphereGeometry(140, 24, 16), new THREE.MeshBasicMaterial({color: COR.baro}));
    marca.position.copy(pTrava);
    stage.scene.add(faixa, ...bordas, marca);

    const overlay = createOverlay(document.getElementById('app'));
    const resize = () => stage.resize(1600, 900, capture ? devicePixelRatio || 1 : Math.min(devicePixelRatio || 1, 2));
    resize();
    window.LJ = {stage, W, CA, THREE, TAKES};
    const SH = {r: 0, p: 0, y: 0};
    const tl = gsap.timeline({paused: true});
    for (const k of TAKES) {
      const [ar, ap, ay] = k.turb || [0, 0, 0];
      tl.fromTo(SH, {r: 0}, {r: ar, duration: k.dur, ease: 'turbR', immediateRender: false}, k.t0)
        .fromTo(SH, {p: 0}, {p: ap, duration: k.dur, ease: 'turbP', immediateRender: false}, k.t0)
        .fromTo(SH, {y: 0}, {y: ay, duration: k.dur, ease: 'turbY', immediateRender: false}, k.t0);
    }
    const cena3d = (k, t, u, acc) => {
      const ceu = k.mode === 'ceu', est = k.mode === 'estudio', mapa = k.mode === 'mapa';
      W.jet.visible = ceu;
      W.chao.visible = mapa || k.mode === 'cidade';
      W.cidade.visible = k.mode === 'cidade';
      ESTUDIO.visible = est;
      faixa.visible = marca.visible = mapa && !!k.faixa;
      bordas.forEach((b) => (b.visible = faixa.visible));
      if (k.faixa) {
        faixa.material.opacity = 0.15 * ss(2.0, 3.0, u);
        bordas.forEach((b) => (b.material.opacity = ss(2.0, 3.0, u)));
        marca.scale.setScalar(ss(4.0, 4.6, u) + 1e-3);
      }
      W.elev.forEach((m) => (m.visible = !!m.userData.sempre));
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
      if (est) {
        const c = k.cauda(u);
        CA.set(c);
        derivaLJ.material.opacity = 1 - 0.8 * (c.raiox || 0);
        derivaLJ.material.depthWrite = (c.raiox || 0) < 0.5;
        P = [0, 50000, 0];
        cam = {...cam, pos: add(P, cam.pos), tgt: add(P, cam.tgt), near: 0.05, far: 500};
      }
      W.setSmoke(t, false);
      const r = W.setRoute(k.route ? ss(k.route[0], k.route[1], u) : 0, mapa);
      stage.frame(cam, k.clima, P, {run: ceu ? k.speed * (k.t0 + u) : 0, ao: ceu || est, t, ...acc});
      return {r, P};
    };
    return {
      resize,
      render(t) {
        const k = takeAt(t);
        const u = t - k.t0;
        const CF = window.__SIM_CONFIG || {};
        const N = CF.sub || 1, obt = (CF.obturador ?? 0.5) / (CF.fps || 24);
        let r = null;
        for (let i = 0; i < N; i++) {
          const d = N === 1 || i === N - 1 ? 0 : ((i + 0.5) / (N - 1) - 0.5) * obt;
          const ts = Math.min(Math.max(t + d, k.t0), k.t0 + k.dur - 1e-4);
          ({r} = cena3d(k, ts, ts - k.t0, {sub: i, subN: N, t}));
        }
        const s = {t, ceu: k.mode !== 'estudio', rain: !!k.rain};
        if (k.rotulos) {
          s.labs = k.rotulos.map(([a, txt, t0, off]) => {
            const at = stage.project(CA.anchors[a]());
            return at && u > t0 ? {at, off, txt, o: ent(t0, t0 + 0.5, u) * (1 - (k.nota ? ss(k.nota[0], k.nota[0] + 0.4, u) : 0))} : null;
          });
        }
        if (k.nota && u > k.nota[0]) s.nota = {txt: k.nota[1], o: ent(k.nota[0], k.nota[0] + 0.5, u)};
        if (k.gauge) {
          const c = k.cauda(u);
          s.gauge = {incid: c.incid, mach: k.mach(u), o: ent(0.2, 0.8, u)};
          const cd = CA.anchors.corda(1.7), pr = (v) => stage.project(v);
          const A = cd.atual.map(pr), N = cd.neutra.map(pr);
          if (A.every(Boolean) && N.every(Boolean)) s.angulo = {a: A, n: N, graus: c.incid - 6.5, o: ent(0.4, 1.0, u)};
        }
        if (k.altim) {
          const tt = k.altim.from + u * k.altim.rate;
          const baro = lerpSerie(ALT, tt, 1), gps = lerpSerie(ALT, tt, 2);
          s.alt = {tt, baro: baro >= 8750 && tt >= 140.2 ? 8750 : baro, gps, trava: tt >= 140.26 ? tt - 140.26 : 0};
        }
        if (k.mode === 'mapa' && r) {
          s.hora = clockET(r.tt);
          if (k.faixa && u > 3.0) {
            const at = stage.project(new THREE.Vector3(-4100 * 0.7, 30, -4100 * 0.7));
            s.labs = [at && {at, off: [-60, -170], txt: 'PEDAZOS: ENTRE 2,1 Y 6,1 KM', o: ent(3.0, 3.5, u)}];
            const am = stage.project(marca.position);
            if (am && u > 4.6) s.labs.push({at: am, off: [120, -120], txt: 'AQUÍ SE CONGELA LA BAROMÉTRICA', o: ent(4.6, 5.1, u)});
          }
        }
        overlay(s);
        void SERIE;
        return {};
      },
    };
  });
