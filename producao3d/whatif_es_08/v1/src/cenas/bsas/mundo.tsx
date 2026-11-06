// Buenos Aires, Av. 9 de Julio com o Obelisco, com o mar em metros reais (L). O chao fica a 25 m acima do mar de hoje
// (Plaza de la Republica); o Obelisco tem 67,5 m (topo a 92,5 m): a +30 m o mar cobre a base com ~5 m de agua; a +70 m sobram
// ~22 m fora d'agua; a +92,5 m ele some. Obelisco por codigo com as medidas reais (secao de 6,8 m na base afinando ate ~3,4 m,
// piramidion de 4 m). Predios do Fab (Small Town, Large Low Poly Building, Flat Style), arvores Low Poly Nature (Fab),
// carros Flat Style boiando. Eixos: x ao longo da avenida, z atravessando (140 m de largura), y para cima.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useTexture} from '@react-three/drei';
import {getInputProps, staticFile} from 'remotion';
import {aguaEmTudo, caixaDe, clonar, comAgua, comPaleta, repete, rnd, tNivel, tingir, tingirTudo, torresDoSmallTown, useFab, usePaletas, uvMundo} from '../salinas/base';

export const Y0 = 25, ALT_OBELISCO = 67.5, TOPO_OBELISCO = Y0 + ALT_OBELISCO;
const LADO_BASE = 6.8, LADO_TOPO = 3.4, H_PIRAM = 4.0, H_FUSTE = ALT_OBELISCO - H_PIRAM;
const X0 = -900, X1 = 900;
export const RUAS_X = [-390, -260, -130, 0, 130, 260, 390];   // transversais (Corrientes em x = 0)

// ---------------------------------------------------------------- Obelisco
const texPedra = () => {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 2048; const c = cv.getContext('2d')!;
  c.fillStyle = '#f2ede2'; c.fillRect(0, 0, 256, 2048);
  for (let i = 0; i < 4000; i++) { c.fillStyle = `rgba(${rnd(i) < 0.5 ? '120,110,95' : '255,255,250'},${0.04 + rnd(i + 1) * 0.05})`; c.fillRect(rnd(i + 2) * 256, rnd(i + 3) * 2048, 2 + rnd(i + 4) * 4, 2); }
  c.strokeStyle = 'rgba(120,108,92,0.35)'; c.lineWidth = 2;
  for (let k = 0; k < 44; k++) { const y = k * (2048 / 44); c.beginPath(); c.moveTo(0, y); c.lineTo(256, y); c.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
const Obelisco: React.FC = () => {
  const g = useMemo(() => {
    const grupo = new THREE.Group();
    const mat = comAgua(new THREE.MeshStandardMaterial({map: texPedra(), color: '#ffffff', roughness: 0.7, flatShading: true}));
    // fuste: tronco de piramide de base quadrada (CylinderGeometry de 4 lados girado 45 graus: raio = lado / raiz de 2)
    const fuste = new THREE.CylinderGeometry(LADO_TOPO / Math.SQRT2, LADO_BASE / Math.SQRT2, H_FUSTE, 4, 1, true).rotateY(Math.PI / 4).translate(0, H_FUSTE / 2, 0);
    const piram = new THREE.ConeGeometry(LADO_TOPO / Math.SQRT2, H_PIRAM, 4, 1).rotateY(Math.PI / 4).translate(0, H_FUSTE + H_PIRAM / 2, 0);
    const mF = new THREE.Mesh(fuste, mat), mP = new THREE.Mesh(piram, mat);
    [mF, mP].forEach((m) => { m.position.y = Y0; m.castShadow = m.receiveShadow = true; grupo.add(m); });
    // janelinha de cada face perto do topo
    const jan = comAgua(new THREE.MeshStandardMaterial({color: '#2a2a30', roughness: 0.4}));
    const hJ = H_FUSTE - 3.2, lJ = LADO_BASE + (LADO_TOPO - LADO_BASE) * (hJ / H_FUSTE);
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2, m = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.3), jan);
      m.position.set(Math.sin(a) * (lJ / 2 + 0.03), Y0 + hJ, Math.cos(a) * (lJ / 2 + 0.03)); m.rotation.y = a; grupo.add(m);
    }
    // embasamento (dois degraus) e o canteiro oval da Plaza de la Republica
    const base = comAgua(new THREE.MeshStandardMaterial({color: '#d8d0c2', roughness: 0.85}));
    [[13, 0.45], [9.5, 0.9]].forEach(([l, h]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(l, h, l), base); b.position.set(0, Y0 + h / 2 - 0.4, 0); b.castShadow = b.receiveShadow = true; grupo.add(b); });
    return grupo;
  }, []);
  return <primitive object={g} />;
};

// ---------------------------------------------------------------- avenida: asfalto, canteiros, calcadas, faixas, praca
const Chao: React.FC = () => {
  const tx = useTexture(['salinas/tex/clean_asphalt_diff_1k.jpg', 'salinas/tex/clean_asphalt_nor_gl_1k.jpg', 'salinas/tex/granite_tile_04_diff_2k.jpg', 'salinas/tex/granite_tile_04_nor_gl_2k.jpg'].map((f) => staticFile(f)));
  const g = useMemo(() => {
    const [aD, aN, gD, gN] = tx; repete(aD, true); repete(aN); repete(gD, true); repete(gN);
    const asf = comAgua(new THREE.MeshStandardMaterial({map: aD, normalMap: aN, color: '#8b9099', roughness: 0.9}));
    const calc = comAgua(new THREE.MeshStandardMaterial({map: gD, normalMap: gN, color: '#d6d0c6', roughness: 0.85}));
    const grama = comAgua(new THREE.MeshStandardMaterial({color: '#6c9b44', roughness: 0.95}));
    const faixaMat = comAgua(new THREE.MeshStandardMaterial({color: '#f1efe8', roughness: 0.6}));
    const grupo = new THREE.Group();
    const plano = (x0: number, x1: number, z0: number, z1: number, y: number, mat: THREE.Material, lad: number) => {
      const geo = uvMundo(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, y, (z0 + z1) / 2), lad);
      const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; grupo.add(m);
    };
    plano(X0, X1, -1200, 1200, Y0 - 0.02, asf, 7);
    for (const s of [-1, 1]) {
      // canteiros com arvores e calcadas (meio-fio de 15 cm), quarteiroes cortados pelas transversais
      for (const [a, b, mat, y] of [[20, 29, grama, 0.15], [56, 61, grama, 0.15], [70, 77, calc, 0.15]] as [number, number, THREE.Material, number][]) {
        const z0 = s > 0 ? a : -b, z1 = s > 0 ? b : -a;
        let x = X0;
        for (const rx of [...RUAS_X, X1 + 40]) { const xa = x, xb = Math.min(X1, rx - 9); if (xb > xa) plano(xa, xb, z0, z1, Y0 + y, mat, 4); x = rx + 9; }
      }
      // chao dos quarteiroes (atras das calcadas)
      let x = X0; for (const rx of [...RUAS_X, X1 + 40]) { const xa = x, xb = Math.min(X1, rx - (rx === 0 ? 14 : 8)); if (xb > xa) plano(xa, xb, s > 0 ? 77 : -700, s > 0 ? 700 : -77, Y0 + 0.15, calc, 5); x = rx + (rx === 0 ? 14 : 8); }
    }
    // praca oval do Obelisco (grama com anel de calcada)
    const anel = new THREE.Mesh(new THREE.CircleGeometry(1, 64).rotateX(-Math.PI / 2), calc); anel.scale.set(36, 1, 22); anel.position.y = Y0 + 0.12; grupo.add(anel);
    const verde = new THREE.Mesh(new THREE.CircleGeometry(1, 64).rotateX(-Math.PI / 2), grama); verde.scale.set(31, 1, 17.5); verde.position.y = Y0 + 0.16; grupo.add(verde);
    // faixas (tracejado) das pistas
    const fx = new THREE.InstancedMesh(new THREE.PlaneGeometry(3, 0.18).rotateX(-Math.PI / 2), faixaMat, 16 * Math.ceil((X1 - X0) / 7 + 1));
    const m4 = new THREE.Matrix4(); let k = 0;
    for (const z of [-15.5, -11, -6.5, 6.5, 11, 15.5, -51, -46, -41, -36, 36, 41, 46, 51, -66, 66]) for (let x = X0; x < X1; x += 7) { if (Math.abs(x) < 40 && Math.abs(z) < 25) continue; m4.makeTranslation(x, Y0 + 0.01, z); fx.setMatrixAt(k++, m4); }
    fx.count = k; fx.receiveShadow = true; grupo.add(fx);
    return grupo;
  }, [tx]);
  return <primitive object={g} />;
};

// ---------------------------------------------------------------- predios ao longo da avenida (30-80 m) e mais atras
type Lugar = {tipo: 'torre' | 'grande' | 'flat'; i: number; x: number; z: number; ry: number; e: number};
const FLAT: [string, number][] = [['buildings_11', 1.8], ['buildings_5', 2.0], ['buildings_9', 2.2], ['buildings_13', 2.0], ['buildings_6', 2.4]];
const PREDIOS: Lugar[] = (() => {
  const L: Lugar[] = [];
  for (const s of [-1, 1]) for (let f = 0; f < 3; f++) {
    let k = 0;
    for (let q = 0; q < RUAS_X.length + 1; q++) {
      const xa = (q === 0 ? X0 : RUAS_X[q - 1] + (RUAS_X[q - 1] === 0 ? 14 : 8)) + 2, xb = (q === RUAS_X.length ? X1 : RUAS_X[q] - (RUAS_X[q] === 0 ? 14 : 8)) - 2;
      let x = xa;
      while (x < xb - 10) {
        const sd = (s + 2) * 1000 + f * 200 + k * 7, r = rnd(sd);
        const zf = s * (79 + f * 62 + rnd(sd + 1) * (f ? 14 : 2));
        if (r < 0.55) { const i = Math.floor((1 - Math.pow(rnd(sd + 2), 1.8)) * 7.999); L.push({tipo: 'torre', i, x: x + 15, z: zf + s * 16, ry: rnd(sd + 3) < 0.5 ? 0 : Math.PI / 2, e: 1}); x += 30 + rnd(sd + 4) * 8; }
        else if (r < 0.7) { L.push({tipo: 'grande', i: 0, x: x + 17, z: zf + s * 16, ry: s > 0 ? Math.PI / 2 : -Math.PI / 2, e: 1.35}); x += 36; }
        else { const i = Math.floor(rnd(sd + 5) * FLAT.length); L.push({tipo: 'flat', i, x: x + 13, z: zf + s * 13, ry: s > 0 ? Math.PI : 0, e: FLAT[i][1]}); x += 26 + rnd(sd + 6) * 6; }
        k++;
      }
    }
  }
  return L;
})();
const TINTAS = ['#f6ead2', '#e9dcc2', '#ffffff', '#e2d8ca', '#f2dcc4', '#dfe6ec'];
const Predios: React.FC = () => {
  const town = useFab('salinas/fab/small_town.glb'), grande = useFab('salinas/fab/large_low_poly_building.glb');
  const flats = FLAT.map(([n]) => useFab(`salinas/fab/veic/${n}.glb`));
  const g = useMemo(() => {
    const grupo = new THREE.Group();
    const torres = torresDoSmallTown(town.scene).filter((t) => t.alt > 22);
    torres.forEach((t) => comAgua(t.mat));
    PREDIOS.forEach((p) => {
      let o: THREE.Object3D;
      const cor = TINTAS[Math.floor(rnd(p.x * 3.7 + p.z) * TINTAS.length)];
      if (p.tipo === 'torre') { const t = torres[p.i % torres.length]; o = new THREE.Mesh(t.geo, tingir(t.mat, cor)); o.castShadow = o.receiveShadow = true; }
      else if (p.tipo === 'grande') o = tingirTudo(clonar(grande.scene), cor);
      else o = clonar(flats[p.i].scene);
      aguaEmTudo(o); o.scale.setScalar(p.e); o.rotation.y = p.ry; o.position.set(p.x, Y0 - 0.2, p.z);
      grupo.add(o);
    });
    return grupo;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [town, grande, ...flats]);
  return <primitive object={g} />;
};

// ---------------------------------------------------------------- arvores dos canteiros (Low Poly Nature, Fab)
const ARV = ['bsas/fab/GenericTreeD.glb', 'bsas/fab/GenericTreeB.glb', 'bsas/fab/OakAdultD.glb'];
const Arvores: React.FC = () => {
  const glbs = ARV.map((a) => useFab(a));
  const g = useMemo(() => {
    const grupo = new THREE.Group();
    let k = 0;
    for (const zc of [-58.5, -24.5, 24.5, 58.5]) for (let x = X0 + 6; x < X1; x += 13) {
      if (RUAS_X.some((r) => Math.abs(x - r) < 12)) continue;
      const s = (j: number) => rnd(k * 11 + j); k++;
      const v = s(1) < 0.55 ? 0 : s(1) < 0.85 ? 1 : 2, o = aguaEmTudo(clonar(glbs[v].scene));
      o.scale.setScalar([1.7, 2.0, 0.85][v] * (0.85 + s(2) * 0.3)); o.position.set(x + (s(3) - 0.5) * 4, Y0 + 0.15, zc + (s(4) - 0.5) * 2.5); o.rotation.y = s(5) * 6.28;
      grupo.add(o);
    }
    return grupo;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...glbs]);
  return <primitive object={g} />;
};

// ---------------------------------------------------------------- carros abandonados boiando (Flat Style, escala normalizada)
const MODELOS = ['car1', 'car4', 'car5', 'car7', 'car8', 'car11', 'car20', 'car21', 'car24', 'car22'];
const PALETAS = ['red', 'blue', 'white', 'yellow', 'green', 'orange', 'pearl', 'charcoal', 'oasis', 'pink'];
type Carro = {x: number; z: number; ry: number; m: number; pal: string; k: number};
const CARROS: Carro[] = (() => {
  const L: Carro[] = []; let k = 0;
  for (const z of [-15.5, -11, -6.5, 6.5, 11, 15.5, -51, -46, -41, 36, 41, 46, -66, 66]) for (let j = 0; j < 9; j++) {
    const s = (i: number) => rnd(2000 + k * 13 + i);
    const x = -330 + j * 75 + s(1) * 40; if (Math.abs(x) < 42 && Math.abs(z) < 22) { k++; continue; }
    const m = s(3) < 0.07 ? MODELOS.length - 1 : Math.floor(s(3) * (MODELOS.length - 1));
    L.push({x, z: z + (s(2) - 0.5), ry: (z > 0 ? -1 : 1) * Math.PI / 2 + (s(4) - 0.5) * 0.3, m, pal: PALETAS[Math.floor(s(5) * PALETAS.length)], k: k++});
  }
  return L;
})();
// boiam desde que a agua passou 0,6 m do chao; a corrente leva todos devagar no sentido +x e para o lado
const estadoCarro = (c: Carro, t: number, L: number) => {
  const s = (j: number) => rnd(c.k * 17 + j);
  const tB = tNivel(Y0 + 0.6 + s(1) * 0.4);
  if (t <= tB) return {x: c.x, y: Y0, z: c.z, rx: 0, ry: c.ry, rz: 0, visivel: true};
  const tc = t - tB, prof = L - Y0;
  // carro afunda quando a agua fica funda (a +70 m ja nao ha carro na superficie, so os que a corrente juntou contra os predios)
  const afunda = prof > 12 + s(9) * 8;
  return {x: c.x + tc * (0.25 + s(2) * 0.3), y: L - 0.95 + 0.06 * Math.sin(t * 1.4 + s(3) * 6), z: c.z + Math.sin(tc * 0.05 + s(4) * 6) * 4,
    rx: 0.06 * Math.sin(t * 1.1 + s(5) * 6) + 0.05, ry: c.ry + tc * 0.02 * (s(6) - 0.5) * 4, rz: 0.08 * Math.sin(t * 1.3 + s(7) * 6), visivel: !afunda};
};
const Carros: React.FC<{t: number; L: number}> = ({t, L}) => {
  const glbs = MODELOS.map((m) => useFab(`salinas/fab/veic/${m}.glb`));
  const pal = usePaletas(PALETAS);
  const objs = useMemo(() => CARROS.map((c) => {
    const o = comPaleta(clonar(glbs[c.m].scene), pal[MODELOS[c.m] === 'car24' ? 'yellow' : c.pal]);
    const {s} = caixaDe(glbs[c.m].scene);
    const onibus = MODELOS[c.m] === 'car22', comp = Math.max(s.x, s.z), k = (onibus ? 11 : 4.3) / comp, ky = Math.min(1, (onibus ? 3.2 : 1.5) / (s.y * k));
    const pivo = new THREE.Group(); o.scale.set(k, k * ky, k); pivo.add(o); return pivo;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [pal, ...glbs]);
  CARROS.forEach((c, k) => { const st = estadoCarro(c, t, L); const o = objs[k]; o.visible = st.visivel; o.position.set(st.x, st.y, st.z); o.rotation.set(st.rx, st.ry, st.rz, 'YXZ'); });
  return <>{objs.map((o, k) => <primitive key={k} object={o} />)}</>;
};

// ---------------------------------------------------------------- detritos boiando (tabuas e caixas), em funcao de t: le-se a corrente
const N_DET = 260;
export const Detritos: React.FC<{t: number; L: number; n?: number}> = ({t, L, n = N_DET}) => {
  const im = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.18, 0.35), comAgua(new THREE.MeshStandardMaterial({color: '#8a6f52', roughness: 0.9})), N_DET);
    m.castShadow = true; m.frustumCulled = false;
    const c = new THREE.Color(); for (let i = 0; i < N_DET; i++) { c.set(['#8a6f52', '#b9a27f', '#5d6a72', '#c8c2b5', '#a05a3c'][i % 5]); m.setColorAt(i, c); }
    return m;
  }, []);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
  im.count = Math.min(N_DET, n);
  for (let i = 0; i < im.count; i++) {
    const s = (j: number) => rnd(i * 7 + 5000 + j);
    const x = ((s(1) * 900 + t * (0.6 + s(2) * 0.5) + 450) % 900) - 450, z = (s(3) - 0.5) * 300;
    p.set(x, L + 0.02, z); e.set(0.08 * Math.sin(t + s(4) * 6), s(5) * 6.28 + t * 0.05 * (s(6) - 0.5), 0.08 * Math.sin(t * 1.3 + s(7) * 6)); q.setFromEuler(e);
    sc.set(0.6 + s(8) * 2.4, 1, 0.6 + s(9) * 1.2); m4.compose(p, q, sc); im.setMatrixAt(i, m4);
  }
  im.instanceMatrix.needsUpdate = true;
  return <primitive object={im} />;
};

const DBG = String((getInputProps() as any).dbg ?? '');
export const MundoBsAs: React.FC<{t: number; L: number}> = ({t, L}) => (
  <>
    {!DBG.includes('semChao') && <Chao />}
    <Obelisco />
    {!DBG.includes('semPredios') && <Predios />}
    {!DBG.includes('semArv') && <Arvores />}
    {!DBG.includes('semCarros') && <Carros t={t} L={L} />}
    {!DBG.includes('semDet') && <Detritos t={t} L={L} />}
  </>
);
