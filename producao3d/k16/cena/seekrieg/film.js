// K16 Seekrieg 1870 (Kriegsmomente), stack nova: teardown + three.js + GSAP, céu em camadas 2.5D, acabamento por subquadros.
// Modos (window.__SIM_CONFIG.modo):
//   'diag'    : cada material numa cor, 4 vistas, legenda com a faixa de altura (decidiu os papéis do navio)
//   'batedor' : as tomadas de prova da assinatura (navio chapado no mar Gerstner, céu em camadas, depois Jade e mapa escuro)
import * as THREE from 'three';
import {gsap} from 'gsap';
import {CustomEase} from 'gsap/CustomEase';
import {CustomWiggle} from 'gsap/CustomWiggle';
import {runSim} from 'teardown-kit/runtime.js';
import {clamp01, easeInOutCubic} from 'teardown-kit/util.js';
import navioB64 from './assets/navio.glb';
import {DESTAQUE, buildNavio, loadGlb} from './navio.js';
import {buildNevoa} from './nevoa.js';
import {createStage} from './stage.js';
import {DURACAO, producao} from './producao.js';
gsap.registerPlugin(CustomEase, CustomWiggle);

const ss = (a, b, t) => easeInOutCubic(clamp01((t - a) / (b - a)));
const lerp3 = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

const VISTAS = [['lado', [0, 12, 120], 10], ['3/4 proa', [-90, 30, 80], 10], ['cima', [0, 140, 1], 0], ['3/4 popa', [90, 25, -80], 10]];

// batedor v2 (04/11, Eduardo: anatomia, não oceano): palco neutro, plano d'água translúcido PARADO, câmera mudando de ângulo,
// peças que acendem com rótulo, corte/vista explodida. cam relativa ao centro do navio (proa em -x, bombordo em +z).
const TAKES = [
  // chega/sai: o navio entra deslizando (proa à frente, -x) e freia; no fim acelera e sai. fov0→fov1 = zoom; cam0→cam1 = troca de ângulo
  {id: 'A_anatomia', dur: 4, cam0: [-120, 20, 95], cam1: [-30, 14, 128], tgt: [-4, 6, 0], fov0: 32, fov1: 28, chega: 150, sai: 150, nevoa: 0.5},
  {id: 'B_cinta', dur: 4, cam0: [-46, 4, 52], cam1: [-30, 3, 44], tgt: [-8, 0.5, 4], fov0: 34, fov1: 22, cinta: true, chega: 60, nevoa: 0.3},
  {id: 'C_calado', dur: 4, cam0: [-34, 8, 118], cam1: [-14, -2, 96], tgt: [-14, -1.5, 0], fov0: 24, fov1: 20, calado: true, nevoa: 0.15},
  {id: 'D_explodido', dur: 4, cam0: [-30, 5, 22], cam1: [-22, 3.5, 17], tgt: [-10, 2.5, 14], fov0: 30, fov1: 24, explodido: true, sai: 120, nevoa: 0.15},
];
let acc = 0;
for (const k of TAKES) { k.t0 = acc; acc += k.dur; }
const takeAt = (t) => TAKES.find((k) => t < k.t0 + k.dur) || TAKES[TAKES.length - 1];

export const run = () => {
  const CF = window.__SIM_CONFIG || {};
  const diag = CF.modo === 'diag';
  const prod = CF.modo === 'producao';
  return runSim({duration: diag ? VISTAS.length : prod ? DURACAO : acc, fps: 24, theme: 'light', hud: {enabled: false, title: 'seekrieg', subtitle: ''}, director: {enabled: false}, watermark: ''}, async ({canvas, capture}) => {
    const gltf = await loadGlb(navioB64);
    const stage = await createStage({canvas});
    const {navio, legenda, altura, linhaDagua} = buildNavio(gltf, {diag, comprimento: 82, proa: CF.proa ?? 1});
    const casco = new THREE.Group();   // o navio flutua: casco = posição/balanço; navio dentro, com a linha d'água em y=0
    casco.rotation.order = 'YXZ';
    navio.position.y = -linhaDagua - 0.8;   // carregado: linha d'água um pouco acima do topo das obras vivas
    casco.add(navio);
    stage.scene.add(casco);
    const resize = () => stage.resize(1600, 900, capture ? devicePixelRatio || 1 : Math.min(devicePixelRatio || 1, 2));
    resize();
    const el = document.getElementById('app');
    const rot = document.createElement('div');
    rot.style.cssText = 'position:absolute;right:18px;top:18px;font:20px monospace;color:#fff;text-shadow:0 1px 3px #000';
    el.append(rot);
    window.K16 = {stage, navio, casco, altura, linhaDagua, THREE};

    if (prod) {
      const P = await producao({stage, casco, navio, linhaDagua, el, CF});
      return {resize, render(t) { rot.textContent = ''; return P.render(t); }};
    }
    if (diag) {
      casco.position.y = linhaDagua;
      const leg = document.createElement('div');
      leg.style.cssText = 'position:absolute;left:18px;top:18px;font:13px/1.35 monospace;color:#fff;text-shadow:0 1px 3px #000;pointer-events:none';
      leg.innerHTML = [...legenda].map(([n, v]) => { const [c, info] = v.split('|'); return `<div><span style="display:inline-block;width:14px;height:14px;background:${c};margin-right:6px"></span>${n} <span style="opacity:.8">${info || ''}</span></div>`; }).join('');
      el.append(leg);
      return {resize, render(t) {
        const [nome, p, ay] = VISTAS[Math.min(VISTAS.length - 1, Math.floor(t))];
        rot.textContent = `${nome} · altura ${altura.toFixed(1)} m · linha d'água ${linhaDagua.toFixed(1)} m`;
        stage.frame({pos: p, tgt: [0, ay, 0], fov: 32}, 'cidade', [0, 0, 0], {run: 0, ao: true, t});
        return {};
      }};
    }

    const nevoa = buildNevoa(stage.scene);
    // plano d'água translúcido e parado: o que está abaixo dele é o calado
    const agua = new THREE.Mesh(new THREE.PlaneGeometry(260, 120), new THREE.MeshBasicMaterial({color: '#5b7182', transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide}));
    agua.rotation.x = -Math.PI / 2;
    stage.scene.add(agua);
    const borda = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(260, 120)), new THREE.LineBasicMaterial({color: '#8fa6b6'}));
    borda.rotation.x = -Math.PI / 2;
    stage.scene.add(borda);
    // a cinta em corte (teardown): ferro 15 cm sobre madeira ~76 cm, numa fatia de 4 m × 3 m que sai do costado
    const fatia = new THREE.Group();
    const ferro = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 0.15), new THREE.MeshStandardMaterial({color: '#e8742a', roughness: 0.5, metalness: 0.3, emissive: '#5a2a0c'}));
    const madeira = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 0.76), new THREE.MeshStandardMaterial({color: '#8a6a48', roughness: 0.85}));
    ferro.position.z = 0.455; fatia.add(ferro, madeira);
    fatia.visible = false;
    stage.scene.add(fatia);
    // 2D por cima: linhas e rótulos projetados (marcadores provisórios do batedor; a pipeline oficial vem depois)
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 1600 900');
    svg.style.cssText = 'position:absolute;inset:0;width:1600px;height:900px;pointer-events:none';
    el.append(svg);
    const proj = (p) => stage.project(new THREE.Vector3(...p));
    const linha = (a, b, cor = '#f1efe9', w = 2) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${cor}" stroke-width="${w}"/>`;
    const rotulo = (p, txt, o = 1, cor = '#f1efe9') => `<text x="${p[0]}" y="${p[1]}" fill="${cor}" opacity="${o}" font-family="Barlow Condensed, Oswald, sans-serif" font-weight="600" font-size="30" letter-spacing="2">${txt}</text>`;

    // o 3D de um instante (subquadro); o 2D é desenhado uma vez só, no instante central (último subquadro)
    const cena3d = (k, t, u, accOpts) => {
      const cp = lerp3(k.cam0, k.cam1, ss(0, k.dur, u));
      const cam = {pos: cp, tgt: k.tgt, fov: k.fov0 + (k.fov1 - k.fov0) * ss(0, k.dur, u)};
      // chegada (ease-out) e saída (ease-in): deslocamento em x; sem física, só deslizar
      const chega = k.chega ? k.chega * Math.pow(1 - clamp01(u / 1.2), 3) : 0;
      const sai = k.sai ? -k.sai * Math.pow(clamp01((u - (k.dur - 1.1)) / 1.1), 3) : 0;
      casco.position.set(chega + sai, 0, 0);
      // destaque: cinta (faixa em volta da linha d'água) ou obras vivas (tudo abaixo d'água)
      DESTAQUE.amt.value = k.cinta ? ss(0.4, 1.0, u) : k.calado ? ss(0.6, 1.2, u) * 0.4 : 0;
      if (k.cinta) { DESTAQUE.y0.value = -1.0; DESTAQUE.y1.value = 1.6; }
      if (k.calado) { DESTAQUE.y0.value = -30; DESTAQUE.y1.value = 0; }
      fatia.visible = !!k.explodido;
      if (k.explodido) { fatia.position.set(-10, 2.6, 7.6 + 6 * ss(0.3, 1.6, u)); ferro.position.z = 0.455 + 1.1 * ss(1.4, 2.2, u); }   // a chapa de ferro se separa da madeira
      stage.frame(cam, 'palco', [0, 6, 0], {run: 0, ao: true, t, ...accOpts, antes: (c) => nevoa.set(c, t, k.nevoa ?? 0.25, '#5d6873')});
    };
    return {resize, render(t) {
      const k = takeAt(t), u = t - k.t0;
      const N = CF.sub || 1, obt = (CF.obturador ?? 0.5) / (CF.fps || 24);
      for (let i = 0; i < N; i++) {
        const d = N === 1 || i === N - 1 ? 0 : ((i + 0.5) / (N - 1) - 0.5) * obt;
        const ts = Math.min(Math.max(t + d, k.t0), k.t0 + k.dur - 1e-4);
        cena3d(k, ts, ts - k.t0, {sub: i, subN: N});
      }
      let g = '';
      if (k.cinta && u > 1.0) {
        const a = proj([-10, 1.5, 7.6]); const b = a && [a[0] + 120, a[1] - 150];
        if (a) g += linha(a, b) + rotulo([b[0] + 8, b[1] - 6], 'PANZERGÜRTEL', ss(1.0, 1.4, u));
      }
      if (k.calado && u > 0.8) {
        const top = proj([-12, 0, 8]), bot = proj([-12, -(linhaDagua + 0.8), 8]);
        if (top && bot) {
          const x = top[0] - 40;
          g += linha([x, top[1]], [x, bot[1]], '#e8742a', 3) + linha([x - 10, top[1]], [x + 10, top[1]], '#e8742a', 3) + linha([x - 10, bot[1]], [x + 10, bot[1]], '#e8742a', 3);
          g += rotulo([x - 250, (top[1] + bot[1]) / 2 + 10], '8,4 m TIEFGANG', ss(1.0, 1.4, u));
        }
      }
      if (k.explodido && u > 1.6) {
        const pf = ferro.getWorldPosition(new THREE.Vector3()), pw = madeira.getWorldPosition(new THREE.Vector3());
        const f = proj([pf.x, pf.y + 1.5, pf.z]), w = proj([pw.x, pw.y - 1.5, pw.z]);
        if (f) g += linha(f, [f[0] + 90, f[1] - 70]) + rotulo([f[0] + 98, f[1] - 76], 'EISEN · 15 cm', ss(1.6, 2.0, u), '#e8742a');
        if (w) g += linha(w, [w[0] + 90, w[1] + 60]) + rotulo([w[0] + 98, w[1] + 72], 'HOLZ · 76 cm', ss(1.8, 2.2, u));
      }
      svg.innerHTML = g;
      rot.textContent = '';
      return {};
    }};
  });
};
