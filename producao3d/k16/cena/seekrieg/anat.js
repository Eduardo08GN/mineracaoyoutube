// Família 'anat' do plano K16: a anatomia do couraçado num palco neutro (Eduardo, 04/11: o 3D mostra a máquina, não o oceano).
// Cada preset de câmera do plano.json vira cam0→cam1 (dolly contínuo), tgt0→tgt1, fov0→fov1, mais chegada/saída, destaque por
// faixa (y e x do mundo), régua do calado, fatia da cinta e frotas de silhuetas (49 contra 5) com o navio fundido.
import * as THREE from 'three';
import {clamp01, easeInOutCubic} from 'teardown-kit/util.js';
import {DESTAQUE, fundir} from './navio.js';

const ss = (a, b, t) => easeInOutCubic(clamp01((t - a) / (b - a)));
const lerp3 = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

// destaques: [y0, y1, x0, x1, cor]  (proa em -x, linha d'água em y=0)
const DEST = {
  cinta: [-1.0, 1.6, -1e4, 1e4, '#ff7a1f'], vivas: [-30, 0, -1e4, 1e4, '#ff7a1f'], bateria: [1.6, 4.6, -32, 30, '#ff7a1f'],
  maquina: [-3, 3, -4, 10, '#ff7a1f'], bunker: [-4, 1.5, -12, 12, '#ff7a1f'], bewachsen: [-30, 0, -1e4, 1e4, '#7d9a4f'],
};
// presets: c0/c1 = câmera, g0/g1 = alvo, f0/f1 = fov (graus). Opcionais: chega, sai, orbita [ang0, ang1, raio, alt], frota
const PRE = {
  chega: {c0: [-120, 20, 95], c1: [-40, 14, 120], g0: [-4, 6, 0], f0: 30, f1: 28, chega: 150},
  sai: {c0: [-50, 12, 110], c1: [-30, 10, 120], g0: [-4, 6, 0], f0: 28, sai: 160},
  perfil: {c0: [6, 6, 150], c1: [-10, 6, 146], g0: [-4, 5, 0], f0: 30},
  perfil_vazio: {c0: [6, 6, 150], c1: [-6, 6, 148], g0: [-4, 5, 0], f0: 30, vazio: true},
  perfil_lento: {c0: [24, 8, 150], c1: [-24, 8, 150], g0: [-4, 6, 0], f0: 30},
  perfil_lento2: {c0: [-10, 8, 140], c1: [-14, 1, 110], g0: [-10, 0, 0], f0: 28},
  perfil_marcas: {c0: [-14, 2, 118], c1: [-8, 2, 112], g0: [-8, -1, 0], f0: 26},
  orbita: {orbita: [-2.2, -1.2, 130, 22], g0: [-4, 6, 0], f0: 30},
  orbita_escura: {orbita: [-1.0, -0.6, 95, 6], g0: [-4, 4, 0], f0: 30},
  tres_quartos: {c0: [-90, 16, 80], c1: [-75, 12, 70], g0: [-6, 6, 0], f0: 30},
  cinta: {c0: [-46, 4, 52], c1: [-30, 3, 44], g0: [-8, 0.5, 4], f0: 34, f1: 22},
  bateria: {c0: [-40, 6, 48], c1: [-25, 5, 40], g0: [-6, 3, 4], f0: 30},
  maquina: {c0: [-10, 10, 60], c1: [0, 8, 50], g0: [2, 2, 0], f0: 30},
  bunker: {c0: [-14, 8, 62], c1: [-6, 6, 52], g0: [-2, 0, 0], f0: 30},
  mastros: {c0: [-20, 10, 90], c1: [-20, 40, 80], g0: [-4, 10, 0], g1: [-4, 32, 0], f0: 32},
  calado: {c0: [-34, 8, 118], c1: [-14, -2, 96], g0: [-14, -1.5, 0], f0: 24, f1: 20},
  calado_faixa: {c0: [-30, 6, 112], c1: [-16, -2, 98], g0: [-14, -1.5, 0], f0: 24, f1: 20},
  fatia: {c0: [-30, 5, 22], c1: [-22, 3.5, 17], g0: [-10, 2.5, 14], f0: 30, f1: 24, fatia: true},
  vivas_sujas: {c0: [-30, -6, 70], c1: [-10, -4, 60], g0: [-6, -3, 0], f0: 30},
  tripulacao: {c0: [-90, 16, 80], c1: [-70, 12, 66], g0: [-6, 6, 0], f0: 30},
  comparacao: {c0: [-30, 10, 170], c1: [-10, 8, 160], g0: [-6, 4, 20], f0: 30, meteor: true},
  contorno14: {c0: [-60, 40, 260], c1: [-30, 34, 240], g0: [40, 4, -60], f0: 32, fantasmas: 14},
  frota49: {c0: [-520, 70, 330], c1: [-470, 60, 300], g0: [-60, 12, -120], f0: 32, frota: [49, 0]},
  frota49_5: {c0: [-430, 110, 420], c1: [-380, 95, 390], g0: [40, 10, -120], f0: 34, frota: [49, 5]},
  frota5: {c0: [300, 40, 220], c1: [330, 34, 190], g0: [420, 8, -90], f0: 30, frota: [0, 5]},
};

export function buildAnat(stage, casco, navio, linhaDagua) {
  const g = new THREE.Group();
  stage.scene.add(g);
  // plano d'água translúcido parado (grande: serve às frotas)
  const agua = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshBasicMaterial({color: '#5b7182', transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide}));
  agua.rotation.x = -Math.PI / 2; g.add(agua);
  // fatia da cinta: ferro 15 cm sobre madeira 76 cm
  const fatia = new THREE.Group();
  const ferro = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 0.15), new THREE.MeshStandardMaterial({color: '#e8742a', roughness: 0.5, metalness: 0.3, emissive: '#5a2a0c'}));
  const madeira = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 0.76), new THREE.MeshStandardMaterial({color: '#8a6a48', roughness: 0.85}));
  ferro.position.z = 0.455; fatia.add(ferro, madeira); g.add(fatia);
  // frota: navio fundido (uma malha por papel), instâncias em grade; 49 franceses (azul-acinzentado) e 5 alemães (escuros)
  const base = fundir(navio);
  base.position.y = -linhaDagua - 0.8;
  const frota = new THREE.Group(); g.add(frota);
  const fr = [], al = [];
  for (let i = 0; i < 49; i++) { const c = base.clone(); c.position.set((i % 7) * 100 - 300, 0, -Math.floor(i / 7) * 45); frota.add(c); fr.push(c); }
  for (let i = 0; i < 5; i++) { const c = base.clone(); c.position.set(420, 0, -i * 45); frota.add(c); al.push(c); }   // os 5 alemães logo à direita da grade francesa
  // fantasmas (contornos tracejados dos 14 prometidos) e o Meteor (canhoneira, ~0,6 do comprimento)
  const fantMat = new THREE.MeshBasicMaterial({color: '#8fa6b6', transparent: true, opacity: 0.18, depthWrite: false});
  const fant = [];
  for (let i = 0; i < 14; i++) { const c = base.clone(); c.traverse((o) => { if (o.isMesh) o.material = fantMat; }); c.position.set((i % 7) * 95 - 120, 0, -110 - Math.floor(i / 7) * 50); g.add(c); fant.push(c); }
  const meteor = base.clone(); meteor.scale.setScalar(0.6); meteor.position.set(-20, 0, 34); g.add(meteor);

  // o que o 2D precisa (pontos para rótulo/régua) + a câmera do instante
  return {
    grupo: g,
    set(t, u, dur, take, accOpts, nevoa) {
      const p = PRE[take.cam] || PRE.perfil;
      const k = ss(0, dur, u);
      let pos;
      if (p.orbita) { const [a0, a1, r, h] = p.orbita; const a = a0 + (a1 - a0) * k; pos = [Math.cos(a) * r, h, -Math.sin(a) * r]; }
      else pos = lerp3(p.c0, p.c1 || p.c0, k);
      const tgt = lerp3(p.g0, p.g1 || p.g0, k);
      const fov = p.f0 + ((p.f1 ?? p.f0) - p.f0) * k;
      const chega = (take.chega || p.chega) ? (p.chega || 150) * Math.pow(1 - clamp01(u / 1.2), 3) : 0;
      const sai = (take.sai || p.sai) ? -(p.sai || 150) * Math.pow(clamp01((u - (dur - 1.1)) / 1.1), 3) : 0;
      const fq = take.frota || p.frota;
      casco.visible = !p.vazio && !fq;
      casco.position.set(chega + sai, 0, 0);
      frota.visible = !!fq;
      if (fq) {
        const n = Math.round(fq[0] * clamp01(u / 1.2));   // a fila francesa se enche em 1,2 s (contagem visível)
        fr.forEach((c, i) => (c.visible = i < n));
        al.forEach((c, i) => (c.visible = i < fq[1]));
      }
      fant.forEach((c, i) => (c.visible = !!p.fantasmas && i < Math.round(14 * ss(0.2, Math.max(0.4, dur - 0.6), u))));
      meteor.visible = !!p.meteor;
      // destaque
      const d = DEST[take.destaque === 'vivas' && take.cam === 'vivas_sujas' ? 'bewachsen' : take.destaque];
      if (d) { DESTAQUE.y0.value = d[0]; DESTAQUE.y1.value = d[1]; DESTAQUE.x0.value = d[2]; DESTAQUE.x1.value = d[3]; DESTAQUE.cor.value.set(d[4]); }
      DESTAQUE.amt.value = d ? ss(0.3, 0.9, u) * (take.destaque === 'vivas' ? 0.45 : 1) * (take.cam === 'tripulacao' ? 0.6 + 0.4 * Math.sin(u * 5) : 1) : 0;
      fatia.visible = !!(take.fatia || p.fatia);
      if (fatia.visible) { fatia.position.set(-10, 2.6, 7.6 + 6 * ss(0.3, 1.6, u)); ferro.position.z = 0.455 + 1.1 * ss(1.4, 2.2, u); }
      const cam = {pos, tgt, fov};
      stage.frame(cam, 'palco', [0, 6, 0], {run: 0, ao: true, t, ...accOpts, antes: (c) => nevoa.set(c, t, take.nevoa ?? 0.25, '#5d6873')});
      return {regua: !!(take.regua), fatia: fatia.visible ? {ferro, madeira} : null};
    },
  };
}
