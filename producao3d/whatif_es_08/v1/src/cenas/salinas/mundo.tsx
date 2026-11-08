// Malecon de Salinas (Equador) com o nivel do mar REAL em metros (L, 0..9 m). Mundo do batedor 07 (praia, malecon, fonte,
// palmeiras, guarda-sois, multidao Quaternius, carros e predios do Fab) refeito nas alturas reais:
//   praia em rampa de 0 m (z = -40, a orilla de hoje) a 1,5 m (z = 0, pe do muro); muro de 1,5 m; malecon a 3,0 m;
//   talude ate a avenida (4,4 -> 5,0 m); calcada a 5,2 m; o bairro sobe 5 cm por metro (9 m em z ~ 100).
// Eixos: x ao longo da orla, y para cima, z para a terra (+) e para o mar (-). Tudo funcao pura de (t, L).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useTexture} from '@react-three/drei';
import {staticFile} from 'remotion';
import {Palmeiras, PalmeiraItem} from './palmeiras';
import {Estado3D, Multidao3D, Pessoa3D} from './pessoas';
import {aguaEmTudo, caixaDe, clonar, comAgua, comPaleta, lerp, repete, rnd, smooth, tNivel, tingir, tingirTudo, torresDoSmallTown, useFab, usePaletas, uvMundo} from './base';

// ---------------------------------------------------------------- perfil do terreno (m acima do mar de hoje)
export const Z_ORILLA = -40, Y_PRAIA = 1.5, Y_MAL = 3.0, Y_AV0 = 4.4, Y_AV1 = 5.0, Y_CALC = 5.2;
const INC_PRAIA = Y_PRAIA / -Z_ORILLA;   // 1:27
export const altChao = (z: number) => {
  if (z < Z_ORILLA) return Math.max(-8, (z - Z_ORILLA) * 0.03);
  if (z < 0) return (z - Z_ORILLA) * INC_PRAIA;
  if (z < 12) return Y_MAL;
  if (z < 14) return Y_MAL + ((z - 12) / 2) * (Y_AV0 - Y_MAL);
  if (z < 24) return Y_AV0 + ((z - 14) / 10) * (Y_AV1 - Y_AV0);
  if (z < 28) return Y_CALC;
  return Y_CALC + (z - 28) * 0.05;
};
// linha d'agua (z) para um nivel L: a primeira posicao (do mar para a terra) com chao acima de L
export const zCosta = (L: number) => {
  if (L < Y_PRAIA) return Z_ORILLA + L / INC_PRAIA;
  if (L < Y_MAL) return 0;
  let a = 0, b = 400; if (altChao(b) <= L) return b;
  for (let i = 0; i < 40; i++) { const c = (a + b) / 2; if (altChao(c) > L) b = c; else a = c; }
  return b;
};
// escadas do malecon para a praia (z de -5 a 0)
export const ESCADAS = [-100, -60, -20, 20, 60, 100];
const Z_ESC = -5;
const yCaminho = (z: number) => (z >= Z_ESC && z <= 0 ? lerp(altChao(Z_ESC), Y_MAL, (z - Z_ESC) / -Z_ESC) : altChao(z));
export const FONTE: [number, number] = [0, 6];
export const MIRA: [number, number] = [-22, -21];   // mira de mare (regua de 0 a 5 m) na praia

// ---------------------------------------------------------------- chao
const faixa = (x0: number, x1: number, z0: number, z1: number, n: number, ladrilho: number, mat: THREE.Material, f = altChao, sombra = true) => {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, 1, n).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const z = p.getZ(i); p.setY(i, f(Math.min(z1 - 1e-4, Math.max(z0 + 1e-4, z)))); }
  g.computeVertexNormals(); uvMundo(g, ladrilho);
  const m = new THREE.Mesh(g, mat); m.receiveShadow = sombra; return m;
};
const Chao: React.FC = () => {
  const tx = useTexture(['salinas/tex/coast_sand_01_diff_2k.jpg', 'salinas/tex/coast_sand_01_nor_gl_2k.jpg', 'salinas/tex/coast_sand_01_rough_2k.jpg',
    'salinas/tex/granite_tile_04_diff_2k.jpg', 'salinas/tex/granite_tile_04_nor_gl_2k.jpg', 'salinas/tex/granite_tile_04_rough_2k.jpg',
    'salinas/tex/clean_asphalt_diff_1k.jpg', 'salinas/tex/clean_asphalt_nor_gl_1k.jpg', 'salinas/tex/clean_asphalt_rough_1k.jpg'].map((f) => staticFile(f)));
  const g = useMemo(() => {
    const [sD, sN, sR, gD, gN, gR, aD, aN, aR] = tx;
    [sD, gD, aD].forEach((t) => repete(t, true)); [sN, sR, gN, gR, aN, aR].forEach((t) => repete(t));
    const X0 = -420, X1 = 420;
    const areia = comAgua(new THREE.MeshStandardMaterial({map: sD, normalMap: sN, roughnessMap: sR, color: '#fff6e6', normalScale: new THREE.Vector2(1.1, 1.1)}));
    const granito = comAgua(new THREE.MeshStandardMaterial({map: gD, normalMap: gN, roughnessMap: gR, color: '#fbf3e6'}));
    const calcada = comAgua(new THREE.MeshStandardMaterial({map: gD, normalMap: gN, roughnessMap: gR, color: '#d9d4cc'}));
    const asf = comAgua(new THREE.MeshStandardMaterial({map: aD, normalMap: aN, roughnessMap: aR, color: '#8d939c'}));
    const grama = comAgua(new THREE.MeshStandardMaterial({color: '#6f9a45', roughness: 0.95}));
    const bairro = comAgua(new THREE.MeshStandardMaterial({map: gD, normalMap: gN, color: '#c9c2b6', roughness: 0.9}));
    const concreto = comAgua(new THREE.MeshStandardMaterial({color: '#e9e2d6', roughness: 0.8}));
    const grupo = new THREE.Group();
    grupo.add(faixa(X0, X1, -700, 0, 160, 6, areia));                // fundo do mar + praia
    grupo.add(faixa(X0, X1, 0, 12, 1, 3.2, granito));               // malecon
    grupo.add(faixa(X0, X1, 12, 14, 2, 2, grama));                   // talude gramado
    grupo.add(faixa(X0, X1, 14, 24, 2, 6, asf));                     // avenida
    grupo.add(faixa(X0, X1, 24, 28, 1, 3, calcada, () => Y_CALC));   // calcada
    grupo.add(faixa(X0, X1, 28, 700, 40, 5, bairro));                // bairro subindo
    // muro do malecon (1,5 m) e meio-fio da calcada
    const muro = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Y_MAL - Y_PRAIA + 0.6).rotateY(Math.PI), concreto);
    muro.position.set(0, (Y_MAL + Y_PRAIA - 0.6) / 2, -0.01); muro.receiveShadow = true; grupo.add(muro);
    const borda = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0, 0.18, 0.45), concreto); borda.position.set(0, Y_MAL + 0.09, 0.2); borda.castShadow = borda.receiveShadow = true; grupo.add(borda);
    const meio = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0, 0.5, 0.3), concreto); meio.position.set(0, Y_AV1 - 0.05, 24.1); grupo.add(meio);
    // escadas para a praia (degraus de granito)
    ESCADAS.forEach((x) => {
      const n = 9;
      for (let k = 0; k < n; k++) {
        const z0 = Z_ESC + (k / n) * -Z_ESC, y = lerp(altChao(Z_ESC), Y_MAL, (k + 1) / n);
        const d = new THREE.Mesh(new THREE.BoxGeometry(4.2, y, -Z_ESC / n + 0.02), granito); d.position.set(x, y / 2, z0 + (-Z_ESC / n) / 2); d.castShadow = d.receiveShadow = true; grupo.add(d);
      }
      [-2.2, 2.2].forEach((dx) => { const w = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.0, -Z_ESC), concreto); w.position.set(x + dx, (Y_MAL + altChao(Z_ESC)) / 2 + 0.3, Z_ESC / 2); w.rotation.x = Math.atan2(Y_MAL - altChao(Z_ESC), -Z_ESC); w.castShadow = true; grupo.add(w); });
    });
    // faixas da avenida (tracejado) sobre a inclinacao
    const fx = new THREE.InstancedMesh(new THREE.PlaneGeometry(3, 0.16).rotateX(-Math.PI / 2), comAgua(new THREE.MeshStandardMaterial({color: '#f3f1ea', roughness: 0.6})), 3 * 140);
    const m4 = new THREE.Matrix4(); let k = 0;
    for (const z of [16.5, 19, 21.5]) for (let x = X0 + 2; x < X1 - 2; x += 6) { m4.makeTranslation(x, altChao(z) + 0.02, z); fx.setMatrixAt(k++, m4); }
    fx.count = k; fx.receiveShadow = true; grupo.add(fx);
    // "a orilla de hoje": tracejado branco na areia em y = 0 (o zero da regua)
    const tr = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.6, 0.35).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.25, roughness: 0.5}), 300);
    k = 0; for (let x = -240; x < 240; x += 3) { m4.makeTranslation(x, 0.03, Z_ORILLA + 0.4); tr.setMatrixAt(k++, m4); }
    tr.count = k; comAgua(tr.material as THREE.Material); grupo.add(tr);
    return grupo;
  }, [tx]);
  return <primitive object={g} />;
};

// ---------------------------------------------------------------- mira de mare: pilar com regua de 0 a 5 m (numeros a cada metro)
const texRegua = () => {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 1536; const c = cv.getContext('2d')!;
  const pxm = 1536 / 6;   // 6 m de pilar (de -0,5 a 5,5)
  c.fillStyle = '#f7f3ea'; c.fillRect(0, 0, 256, 1536);
  const yDe = (m: number) => 1536 - (m + 0.5) * pxm;
  for (let k = 0; k <= 50; k++) {
    const m = k / 10, y = yDe(m), grande = k % 10 === 0, meio = k % 5 === 0;
    c.fillStyle = k % 10 < 5 ? '#c8352b' : '#1d2a3a';
    c.fillRect(grande ? 0 : meio ? 30 : 60, y - (grande ? 5 : 3), grande ? 256 : meio ? 140 : 90, grande ? 10 : 6);
  }
  c.font = 'bold 120px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
  for (let m = 1; m <= 5; m++) { c.fillStyle = '#1d2a3a'; c.fillText(String(m), 175, yDe(m - 0.5)); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
const Mira: React.FC = () => {
  const g = useMemo(() => {
    const grupo = new THREE.Group();
    const face = comAgua(new THREE.MeshStandardMaterial({map: texRegua(), roughness: 0.6}));
    const lado = comAgua(new THREE.MeshStandardMaterial({color: '#e8e1d4', roughness: 0.8}));
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.7, 6, 0.4), [lado, lado, lado, lado, face, face]);
    p.position.set(MIRA[0], 2.5, MIRA[1]); p.rotation.y = -0.95; p.castShadow = p.receiveShadow = true; grupo.add(p);
    const topo = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.3, 0.7), comAgua(new THREE.MeshStandardMaterial({color: '#c8352b', roughness: 0.6})));
    topo.position.set(MIRA[0], 5.6, MIRA[1]); topo.rotation.y = -0.95; topo.castShadow = true; grupo.add(topo);
    return grupo;
  }, []);
  return <primitive object={g} />;
};

// ---------------------------------------------------------------- predios: Small Town (torres de condominio) + Large Low Poly + Flat Style
type Lugar = {tipo: 'torre' | 'grande' | 'flat'; i: number; x: number; z: number; ry: number; e: number};
const FLAT = ['buildings_11', 'buildings_5', 'buildings_13', 'buildings_10', 'buildings_16', 'buildings_7', 'buildings_8', 'buildings_9'];
const PREDIOS: Lugar[] = (() => {
  const L: Lugar[] = [];
  let x = -260, k = 0;
  // 1a fila de frente para o mar: torres altas intercaladas com predios baixos (Salinas: condominios de 15-25 andares no malecon)
  while (x < 260) {
    const r = rnd(k * 7 + 1);
    if (r < 0.42) { const i = Math.floor(rnd(k * 7 + 2) * 8); L.push({tipo: 'torre', i, x, z: 44, ry: 0, e: 1}); x += 34 + rnd(k * 7 + 3) * 10; }
    else if (r < 0.55) { L.push({tipo: 'grande', i: 0, x, z: 46, ry: Math.PI / 2, e: 1}); x += 36; }
    else { const i = Math.floor(rnd(k * 7 + 4) * FLAT.length); L.push({tipo: 'flat', i, x, z: 36 + rnd(k * 7 + 5) * 3, ry: Math.PI, e: 1.15}); x += 17 + rnd(k * 7 + 6) * 6; }
    k++;
  }
  // 2a e 3a filas mais altas e mais acima no morro
  for (let f = 0; f < 2; f++) for (let j = 0; j < 12; j++) {
    const s = 500 + f * 50 + j;
    L.push({tipo: 'torre', i: Math.floor(rnd(s) * 8), x: -250 + j * 45 + rnd(s + 1) * 14, z: 105 + f * 65 + rnd(s + 2) * 14, ry: (rnd(s + 3) < 0.5 ? 0 : Math.PI / 2), e: 1});
  }
  return L;
})();
const TINTAS = ['#ffffff', '#ffe4c4', '#d6eaff', '#ffd6c2', '#e0f4e4', '#fff3d6'];
const Predios: React.FC = () => {
  const town = useFab('salinas/fab/small_town.glb'), grande = useFab('salinas/fab/large_low_poly_building.glb');
  const flats = FLAT.map((n) => useFab(`salinas/fab/veic/${n}.glb`));
  const g = useMemo(() => {
    const grupo = new THREE.Group();
    const torres = torresDoSmallTown(town.scene);
    torres.forEach((t) => comAgua(t.mat));
    PREDIOS.forEach((p) => {
      let o: THREE.Object3D, prof = 12;
      const cor = TINTAS[Math.floor(rnd(p.x * 3.7 + p.z) * TINTAS.length)];
      if (p.tipo === 'torre') { const t = torres[p.i % torres.length]; o = new THREE.Mesh(t.geo, tingir(t.mat, cor)); o.castShadow = o.receiveShadow = true; prof = Math.max(t.larg, t.prof); }
      else if (p.tipo === 'grande') { o = tingirTudo(clonar(grande.scene), cor); prof = 30; }
      else { o = clonar(flats[p.i].scene); prof = 10; }
      aguaEmTudo(o);
      o.scale.setScalar(p.e); o.rotation.y = p.ry;
      // a base acompanha o morro: assenta pela frente (o fundo entra no chao)
      o.position.set(p.x, altChao(p.z - prof / 2) - 0.25, p.z);
      grupo.add(o);
    });
    return grupo;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [town, grande, ...flats]);
  return <primitive object={g} />;
};

// ---------------------------------------------------------------- mobiliario do malecon: bancos, postes, quiosques
const Mobiliario: React.FC = () => {
  const banco = useFab('salinas/fab/modern_street_props.glb'), poste = useFab('salinas/fab/veic/enviroment_Pole.glb'), quiosque = useFab('salinas/fab/veic/buildings_4.glb');
  const g = useMemo(() => {
    const grupo = new THREE.Group();
    for (let k = 0; k < 22; k++) { const x = -150 + k * 14 + 4; if (Math.abs(x - FONTE[0]) < 7) continue; const o = aguaEmTudo(clonar(banco.scene)); o.position.set(x, Y_MAL, 2.6); o.rotation.y = Math.PI / 2; grupo.add(o); }
    for (let k = 0; k < 18; k++) { const o = aguaEmTudo(clonar(poste.scene)); o.scale.setScalar(1.25); o.position.set(-153 + k * 18, Y_MAL, 11.0); o.rotation.y = Math.PI / 2; grupo.add(o); }
    [[-38, 8.0], [42, 8.0], [-130, 8.0], [118, 8.0]].forEach(([x, z], i) => { const o = aguaEmTudo(clonar(quiosque.scene)); o.scale.setScalar(0.72); o.position.set(x, Y_MAL, z); o.rotation.y = i % 2 ? Math.PI : 0; grupo.add(o); });
    return grupo;
  }, [banco, poste, quiosque]);
  return <primitive object={g} />;
};

// ---------------------------------------------------------------- fonte (bacia + jatos balisticos de fase fixa: funcao de t)
const N_GOTAS = 160;
const Fonte: React.FC<{t: number}> = ({t}) => {
  const obj = useMemo(() => {
    const g = new THREE.Group(); g.position.set(FONTE[0], Y_MAL, FONTE[1]);
    const pedra = comAgua(new THREE.MeshStandardMaterial({color: '#e2dccf', roughness: 0.75}));
    const R = 3.2;
    const perfil = [[0, 0.04], [R - 0.25, 0.04], [R - 0.25, 0.48], [R - 0.05, 0.55], [R + 0.25, 0.55], [R + 0.3, 0.45], [R + 0.3, 0]].map(([r, y]) => new THREE.Vector2(r, y));
    const bacia = new THREE.Mesh(new THREE.LatheGeometry(perfil, 64), pedra); bacia.castShadow = bacia.receiveShadow = true; g.add(bacia);
    const agua = new THREE.Mesh(new THREE.CircleGeometry(R - 0.25, 48).rotateX(-Math.PI / 2), comAgua(new THREE.MeshStandardMaterial({color: '#3aa6d8', roughness: 0.08, metalness: 0.2, emissive: '#145f88', emissiveIntensity: 0.25})));
    agua.position.y = 0.42; g.add(agua);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.62, 1.0, 24), pedra); ped.position.y = 0.5; ped.castShadow = true; g.add(ped);
    const taca = new THREE.Mesh(new THREE.LatheGeometry([[0.2, 0], [1.0, 0.28], [1.08, 0.36], [0.98, 0.36], [0.2, 0.12]].map(([r, y]) => new THREE.Vector2(r, y)), 40), pedra);
    taca.position.y = 1.0; taca.castShadow = true; g.add(taca);
    const gotas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshStandardMaterial({color: '#effaff', emissive: '#bfe6ff', emissiveIntensity: 0.4, roughness: 0.1, transparent: true, opacity: 0.85, depthWrite: false}), N_GOTAS);
    gotas.frustumCulled = false; g.add(gotas);
    return {g, gotas};
  }, []);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3();
  const v0 = 7.2, gr = 9.78, T = (2 * v0) / gr;
  for (let j = 0; j < N_GOTAS; j++) {
    const ph = (((t / T + j / N_GOTAS + rnd(j) * 0.02) % 1) + 1) % 1, tau = ph * T, vy = v0 - gr * tau;
    pos.set((rnd(j + 11) - 0.5) * 0.6 * tau, 1.4 + v0 * tau - 0.5 * gr * tau * tau, (rnd(j + 23) - 0.5) * 0.6 * tau);
    sc.set(1, 1 + Math.min(2.5, Math.abs(vy) * 0.35), 1); m4.compose(pos, q, sc); obj.gotas.setMatrixAt(j, m4);
  }
  obj.gotas.instanceMatrix.needsUpdate = true;
  return <primitive object={obj.g} />;
};

// ---------------------------------------------------------------- objetos que boiam: guarda-sois, bolas, pranchas, veleiro
// boia quando a agua passa ~0,25 m do chao dele; a corrente leva para a terra; contra o muro eles se amontoam ate o mar passar do malecon
const deriva = (z0: number, tA: number, t: number, v: number) => {
  if (t <= tA) return z0;
  const livre = z0 + v * (t - tA);
  const tM = tNivel(Y_MAL + 0.25);
  const lim = t < tM ? -0.9 : -0.9 + v * 0.8 * (t - tM);
  return Math.max(z0, Math.min(livre, z0 < 0 ? lim + rnd(z0 * 13) * -1.5 : 1e9));
};
type Boia = {x: number; z: number; r: number; k: number};
const GUARDA_SOIS: (Boia & {cor: number})[] = (() => {
  const L: (Boia & {cor: number})[] = [];
  for (let f = 0; f < 3; f++) for (let k = 0; k < 26; k++) { const s = f * 100 + k; L.push({x: -120 + k * 9.5 + (rnd(s) - 0.5) * 4 + f * 3, z: -8 - f * 6.5 + (rnd(s + 50) - 0.5) * 2, r: rnd(s + 70) * 6.28, k: s, cor: Math.floor(rnd(s + 90) * 5)}); }
  return L;
})();
export const estadoBoia = (b: Boia, t: number, L: number, alt = 0, v = 0.55) => {
  const s = (j: number) => rnd(b.k * 31 + j);
  const ch = altChao(b.z), tA = tNivel(ch + 0.25);
  if (t <= tA) return {x: b.x, y: ch, z: b.z, rx: 0, ry: b.r, rz: 0, boiando: false};
  const tc = t - tA;
  const z = deriva(b.z, tA, t, v * (0.7 + s(1) * 0.6));
  const x = b.x + Math.sin(tc * 0.3 + s(2) * 6) * 0.8 + tc * (s(3) - 0.5) * 0.4;
  const y = Math.max(altChao(z), L - alt * smooth(0, 1.5, tc)) + 0.06 * Math.sin(t * 1.6 + s(4) * 6);
  return {x, y, z, rx: 1.2 * smooth(0, 2.5, tc) * (s(5) < 0.5 ? 1 : -1) + 0.12 * Math.sin(t * 1.7 + s(6) * 6), ry: b.r + tc * 0.3 * (s(7) - 0.5), rz: 0.2 * Math.sin(t * 1.3 + s(8) * 6), boiando: true};
};
// guarda-sol fincado: com agua no pe ele inclina com a corrente; quando a agua cobre a lona (~2,2 m) ele solta e boia de cabeca
// para baixo (a lona como uma tigela, o cabo para cima), levado para a terra
const estadoGS = (g: Boia, t: number, L: number) => {
  const s = (j: number) => rnd(g.k * 31 + j), ch = altChao(g.z);
  const tA = tNivel(ch + 0.2), tD = tNivel(ch + 2.2 + s(1) * 0.5);
  const inc = 0.2 * smooth(tA, tA + 3, t) * (s(2) < 0.5 ? 1 : 0.6) + 0.04 * Math.sin(t * 1.4 + s(3) * 6) * smooth(tA, tA + 1, t);
  // so 1 em 3 se solta (os outros ficam fincados e somem debaixo d'agua)
  if (t <= tD || s(10) > 0.33) return {x: g.x, y: ch, z: g.z, rx: inc, ry: g.r, rz: 0.1 * inc * Math.sin(s(4) * 6)};
  const tc = t - tD, z = deriva(g.z, tD, t, 0.35 + s(5) * 0.5);
  return {x: g.x + tc * (s(6) - 0.5) * 1.2, y: Math.max(altChao(z), L) - 2.35 + 0.08 * Math.sin(t * 1.5 + s(7) * 6), z, rx: 0.3 * Math.sin(t * 0.8 + s(8) * 6) + 0.25, ry: g.r + tc * 0.2, rz: 0.2 * Math.sin(t * 0.9 + s(9) * 6)};
};
const CORES_GS = ['#e8433a', '#f2b134', '#2a9d8f', '#e2457a', '#3b6fd0'];
const GuardaSois: React.FC<{t: number; L: number}> = ({t, L}) => {
  const gl = useFab('salinas/fab/beach_umbrella.glb');
  const im = useMemo(() => {
    let m: THREE.Mesh | null = null; gl.scene.updateMatrixWorld(true); gl.scene.traverse((o: any) => { if (!m && o.isMesh) m = o; });
    const mesh = m as unknown as THREE.Mesh;
    const geo = mesh.geometry.clone(); geo.applyMatrix4(mesh.matrixWorld);
    const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aCor; varying vec3 vCorGS;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvCorGS = aCor;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vCorGS;').replace('#include <map_fragment>', `#include <map_fragment>
  float azul = smoothstep(0.05, 0.25, diffuseColor.b - max(diffuseColor.r, diffuseColor.g));
  float lum = dot(diffuseColor.rgb, vec3(0.3, 0.5, 0.2));
  diffuseColor.rgb = mix(diffuseColor.rgb, vCorGS * (0.55 + 0.9 * lum), azul);`);
    };
    mat.customProgramCacheKey = () => 'guarda_sol_cor';
    comAgua(mat);
    const cores = new Float32Array(GUARDA_SOIS.length * 3); const c = new THREE.Color();
    GUARDA_SOIS.forEach((g, i) => { c.set(CORES_GS[g.cor]).convertSRGBToLinear(); cores.set([c.r, c.g, c.b], i * 3); });
    geo.setAttribute('aCor', new THREE.InstancedBufferAttribute(cores, 3));
    const im = new THREE.InstancedMesh(geo, mat, GUARDA_SOIS.length); im.castShadow = im.receiveShadow = true; im.frustumCulled = false;
    return im;
  }, [gl]);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1.9, 1.9, 1.9), v = new THREE.Vector3();
  GUARDA_SOIS.forEach((g, k) => { const st = estadoGS(g, t, L); e.set(st.rx, st.ry, st.rz, 'YXZ'); q.setFromEuler(e); v.set(st.x, st.y, st.z); m4.compose(v, q, s); im.setMatrixAt(k, m4); });
  im.instanceMatrix.needsUpdate = true;
  return <primitive object={im} />;
};
const BOLAS: Boia[] = [[-42, -14], [-8, -17], [14, -12], [38, -19], [-70, -11], [66, -15]].map(([x, z], k) => ({x, z, r: 0, k: 300 + k}));
const PRANCHAS: Boia[] = [[-30, -4.5], [26, -5], [-84, -6]].map(([x, z], k) => ({x, z, r: 0.4 + k, k: 400 + k}));
const Soltos: React.FC<{t: number; L: number}> = ({t, L}) => {
  const bola = useFab('salinas/fab/beach_ball.glb'), prancha = useFab('salinas/fab/surfboards.glb'), barco = useFab('salinas/fab/wooden_sailboat.glb');
  const objs = useMemo(() => ({
    bolas: BOLAS.map(() => aguaEmTudo(clonar(bola.scene))),
    pranchas: PRANCHAS.map(() => aguaEmTudo(clonar(prancha.scene))),
    barco: aguaEmTudo(clonar(barco.scene)),
  }), [bola, prancha, barco]);
  BOLAS.forEach((b, k) => { const st = estadoBoia(b, t, L, -0.05, 0.8); const o = objs.bolas[k]; o.scale.setScalar(1.6);
    const quica = st.boiando ? 0 : Math.abs(Math.sin(t * 3.1 + k)) * 0.8; o.position.set(st.x + (st.boiando ? 0 : Math.sin(t * 0.9 + k) * 1.5), st.y + quica, st.z); o.rotation.set(t * 2.1 + k, t * 1.3, 0); });
  PRANCHAS.forEach((b, k) => { const st = estadoBoia(b, t, L, 0.1, 0.6); const o = objs.pranchas[k]; o.position.set(st.x, st.y - 0.05, st.z); o.rotation.set(st.boiando ? -1.45 + 0.1 * Math.sin(t + k) : 0, st.ry, st.rz * 0.5, 'YXZ'); });
  // veleiro: vem do largo empurrado pela agua que entra (z sobe ~2,2 m/s); flutua no nivel do mar
  const zb = -110 + 2.75 * t, xb = 20 - 0.8 * t;
  objs.barco.position.set(xb, Math.max(altChao(zb) + 0.3, L - 0.55) + 0.15 * Math.sin(t * 1.1), zb);
  objs.barco.rotation.set(0.05 * Math.sin(t * 0.9), -0.5 + 0.02 * t, 0.07 * Math.sin(t * 0.7 + 1), 'YXZ');
  return <>{objs.bolas.map((o, k) => <primitive key={'b' + k} object={o} />)}{objs.pranchas.map((o, k) => <primitive key={'p' + k} object={o} />)}<primitive object={objs.barco} /></>;
};

// ---------------------------------------------------------------- carros (Flat Style, escala NORMALIZADA: 4,3 m de comprimento e ~1,5 m de altura)
const MODELOS = ['car1', 'car4', 'car5', 'car7', 'car8', 'car11', 'car20', 'car21', 'car24', 'car22'];
const PALETAS = ['red', 'blue', 'white', 'yellow', 'green', 'orange', 'pearl', 'charcoal', 'oasis', 'pink'];
const FAIXAS_AV = [{z: 15.3, dir: 1}, {z: 17.8, dir: 1}, {z: 20.3, dir: -1}, {z: 22.8, dir: -1}];
type Carro = {f: number; x0: number; v: number; m: number; pal: string; k: number};
const CARROS: Carro[] = (() => {
  const L: Carro[] = []; let k = 0;
  FAIXAS_AV.forEach((_, f) => { for (let j = 0; j < 7; j++) { const s = (i: number) => rnd(900 + f * 37 + j * 11 + i); const m = s(3) < 0.08 ? MODELOS.length - 1 : Math.floor(s(3) * (MODELOS.length - 1));
    L.push({f, x0: -160 + j * 46 + s(1) * 20, v: 8 + s(2) * 5, m, pal: PALETAS[Math.floor(s(4) * PALETAS.length)], k: k++}); } });
  return L;
})();
const wrap = (x: number, L: number) => ((((x + L) % (2 * L)) + 2 * L) % (2 * L)) - L;
// o transito freia quando a agua chega no pe do muro (as pessoas correm) e o carro abandonado boia quando a agua passa 0,6 m do chao dele
const T_FREIA = () => tNivel(Y_PRAIA + 0.6);
const estadoCarro = (c: Carro, t: number, L: number) => {
  const F = FAIXAS_AV[c.f], s = (j: number) => rnd(c.k * 13 + j), a = 4.5;
  const tb = T_FREIA() + s(1) * 1.5, tr = Math.min(t, tb);
  let x = wrap(c.x0 + F.dir * c.v * tr, 180);
  if (t > tb) { const dt = Math.min(t - tb, c.v / a); x += F.dir * (c.v * dt - 0.5 * a * dt * dt); }
  const ch = altChao(F.z);
  let y = ch, z = F.z, ry = F.dir > 0 ? Math.PI / 2 : -Math.PI / 2, rx = 0, rz = 0;
  const tB = tNivel(ch + 0.6 + s(2) * 0.3);
  if (t > tB) {
    const tc = t - tB;
    x += tc * (s(3) - 0.5) * 0.5; z += Math.min(tc * (0.35 + s(4) * 0.3), 60);
    y = Math.max(altChao(z), L - 0.95) + 0.05 * Math.sin(t * 1.6 + s(5) * 6);
    ry += tc * 0.06 * (s(6) - 0.5) * 4; rx = 0.05 * Math.sin(t * 1.2 + s(7) * 6) + 0.06; rz = 0.07 * Math.sin(t * 1.5 + s(8) * 6);
  }
  return {x, y, z, rx, ry, rz};
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
  CARROS.forEach((c, k) => { const st = estadoCarro(c, t, L); objs[k].position.set(st.x, st.y, st.z); objs[k].rotation.set(st.rx, st.ry, st.rz, 'YXZ'); });
  return <>{objs.map((o, k) => <primitive key={k} object={o} />)}</>;
};

// ---------------------------------------------------------------- pessoas: passeio no malecon, praia (foge pelas escadas), banhistas
type Papel = 'passeio' | 'praia' | 'banho';
type Pessoa = Pessoa3D & {papel: Papel; dir: number; v: number; reage: number; esc: number; destX: number; destZ: number};
const PESSOAS: Pessoa[] = (() => {
  const L: Pessoa[] = []; let i = 0;
  const add = (o: Partial<Pessoa> & {x: number; z: number; papel: Papel}) => { L.push({i, rot: 0, pose: 'parado', dir: 1, v: 1.3, reage: 0, esc: 0, destX: 0, destZ: 0, y: 0, ...o} as Pessoa); i++; };
  for (let k = 0; k < 34; k++) {
    let x = -95 + rnd(k * 3 + 1) * 190; const z = 1.8 + rnd(k * 3 + 2) * 8.4;
    if (Math.hypot(x - FONTE[0], z - FONTE[1]) < 4.5) x += 9;
    const dir = rnd(k * 3 + 3) < 0.5 ? 1 : -1;
    add({x, z, papel: 'passeio', pose: 'andando', dir, v: 1.05 + rnd(k + 70) * 0.5, rot: dir > 0 ? Math.PI / 2 : -Math.PI / 2, reage: rnd(k + 110) * 1.2, y: Y_MAL});
  }
  for (let k = 0; k < 40; k++) {
    const x = -95 + rnd(k * 5 + 400) * 190, z = -30 + rnd(k * 5 + 401) * 26, r = rnd(k * 5 + 402);
    const esc = ESCADAS.reduce((b, e) => (Math.abs(e - x) < Math.abs(b - x) ? e : b), ESCADAS[0]);
    add({x, z, papel: 'praia', pose: r < 0.35 ? 'sentado' : r < 0.6 ? 'conversando' : 'parado', rot: rnd(k * 5 + 403) * Math.PI * 2, reage: 0.2 + rnd(k * 5 + 405) * 1.4,
      fem: rnd(k * 5 + 406) < 0.5, esc, destX: esc + (rnd(k * 5 + 407) - 0.5) * 12, destZ: 3 + rnd(k * 5 + 408) * 6});
  }
  for (let k = 0; k < 9; k++) add({x: -60 + rnd(k + 600) * 120, z: -52 + rnd(k + 610) * 9, papel: 'banho', pose: 'nadando', rot: rnd(k + 620) * 6.28});
  return L;
})();
const PASSADA: Record<string, number> = {Walk_Loop: 1.45, Jog_Fwd_Loop: 2.6, Sprint_Loop: 3.9, Swim_Fwd_Loop: 1.2};
const corrida = (tt: number, vMax: number, acel = 3.0) => { if (tt <= 0) return 0; const tA = vMax / acel; return tt < tA ? 0.5 * acel * tt * tt : 0.5 * acel * tA * tA + vMax * (tt - tA); };
// posicao ao longo de uma polilinha (x, z) a distancia d
const naLinha = (P: [number, number][], d: number) => {
  for (let k = 1; k < P.length; k++) {
    const [xa, za] = P[k - 1], [xb, zb] = P[k], Lk = Math.hypot(xb - xa, zb - za);
    if (d <= Lk || k === P.length - 1) { const u = Math.min(1, d / Math.max(1e-6, Lk)); return {x: lerp(xa, xb, u), z: lerp(za, zb, u), ry: Math.atan2(xb - xa, zb - za), fim: d >= Lk && k === P.length - 1}; }
    d -= Lk;
  }
  const [x, z] = P[P.length - 1]; return {x, z, ry: 0, fim: true};
};
const estadoGente = (q: Pessoa, t: number, L: number): Estado3D => {
  const s = (k: number) => rnd(q.i * 17 + k);
  if (q.papel === 'banho') return {x: q.x + Math.sin(t * 0.2 + s(1) * 6) * 1.5, y: L - 1.15, z: q.z + t * 0.3, ry: q.rot + 0.3 * Math.sin(t * 0.4 + s(3) * 6), clipe: 'Swim_Idle_Loop', tempo: t + s(4) * 3};
  if (q.papel === 'passeio') {
    // andam; com a agua batendo no muro param e olham o mar; quando ela chega perto do topo, correm para a avenida
    const tPara = tNivel(Y_PRAIA + 0.4) + q.reage, tFoge = tNivel(Y_MAL - 0.45) + q.reage * 0.6;
    const xParou = wrap(q.x + q.dir * q.v * Math.min(t, tPara), 110);
    if (t < tPara) return {x: xParou, y: Y_MAL, z: q.z, ry: q.rot, clipe: 'Walk_Loop', tempo: (q.v * t) / PASSADA.Walk_Loop + s(2)};
    if (t < tFoge) return {x: xParou, y: Y_MAL, z: q.z, ry: Math.PI + (s(5) - 0.5) * 0.8, clipe: s(6) < 0.4 ? 'Idle_Talking_Loop' : 'Idle_Loop', tempo: t + s(1) * 3};
    const d = corrida(t - tFoge, 3.6 + s(7) * 1.4), sx = (s(8) - 0.5) * 0.5;
    const P: [number, number][] = [[xParou, q.z], [xParou + sx * 20, 30], [xParou + sx * 20 + Math.sign(sx || 1) * 60, 34]];
    const p = naLinha(P, d), v = Math.min(5, 3 * (t - tFoge));
    const clipe = v > 4 ? 'Sprint_Loop' : v > 2 ? 'Jog_Fwd_Loop' : 'Walk_Loop';
    return {x: p.x, y: altChao(p.z), z: p.z, ry: p.ry, clipe, tempo: d / PASSADA[clipe]};
  }
  // praia
  const ch0 = altChao(q.z);
  const t0 = tNivel(ch0 - 0.7) + q.reage;
  const pose = q.pose === 'sentado' ? 'Sitting_Idle_Loop' : q.pose === 'conversando' ? 'Idle_Talking_Loop' : 'Idle_Loop';
  if (t < t0) return {x: q.x, y: ch0, z: q.z, ry: q.rot, clipe: pose, tempo: t + s(1) * 3};
  const levanta = q.pose === 'sentado' ? 0.9 : 0;
  if (t < t0 + levanta) return {x: q.x, y: ch0, z: q.z, ry: q.rot, clipe: 'Sitting_Exit', tempo: t - t0};
  const vMax = 3.6 + s(7) * 1.6, tt = t - t0 - levanta, d = corrida(tt, vMax);
  const P: [number, number][] = [[q.x, q.z], [q.esc + (s(9) - 0.5) * 2.4, Z_ESC - 0.6], [q.esc + (s(9) - 0.5) * 2.4, 0.4], [q.destX, q.destZ]];
  const p = naLinha(P, d), ch = yCaminho(p.z);
  if (p.fim) return {x: p.x, y: ch, z: p.z, ry: Math.PI + (s(10) - 0.5) * 0.9, clipe: s(11) < 0.5 ? 'Idle_Loop' : 'Idle_Talking_Loop', tempo: t + s(2) * 3};
  const fundo = L - ch;
  if (fundo > 0.95) return {x: p.x, y: L - 1.15, z: p.z, ry: p.ry, clipe: 'Swim_Fwd_Loop', tempo: d / PASSADA.Swim_Fwd_Loop};
  const v = Math.min(vMax, 3 * tt) * (fundo > 0.4 ? 0.5 : 1);
  const clipe = v > 4 ? 'Sprint_Loop' : v > 2 ? 'Jog_Fwd_Loop' : 'Walk_Loop';
  return {x: p.x, y: ch, z: p.z, ry: p.ry, clipe, tempo: d / PASSADA[clipe]};
};

// ---------------------------------------------------------------- palmeiras (Yughues/Nobiax, CC0)
const PALMAS: PalmeiraItem[] = (() => {
  const L: PalmeiraItem[] = [];
  for (let k = -16; k <= 16; k++) { const x = k * 9 + (rnd(k + 50) - 0.5) * 2; if (Math.abs(x - FONTE[0]) < 5 || ESCADAS.some((e) => Math.abs(e - x) < 3)) continue; L.push({x, z: 1.2, variante: Math.floor(rnd(k + 60) * 5), escala: 0.85 + rnd(k + 70) * 0.3, rot: rnd(k + 80) * 6.28, y: Y_MAL}); }
  for (let k = -12; k <= 12; k++) { const x = k * 12 + 4 + (rnd(k + 150) - 0.5) * 3; L.push({x, z: 10.4, variante: Math.floor(rnd(k + 160) * 2), escala: 0.9 + rnd(k + 170) * 0.25, rot: rnd(k + 180) * 6.28, y: Y_MAL}); }
  for (let k = -9; k <= 9; k++) { const x = k * 15 + 7; L.push({x, z: 26.2, variante: 0, escala: 1.0 + rnd(k + 250) * 0.2, rot: rnd(k + 260) * 6.28, y: Y_CALC}); }
  return L;
})();

// ---------------------------------------------------------------- mundo
export const MundoSalinas: React.FC<{t: number; L: number; gente: boolean; cam: THREE.Vector3}> = ({t, L, gente, cam}) => {
  const vento = 1 + 1.4 * smooth(2, 8, L);
  return (
    <>
      <Chao />
      <Mira />
      <Predios />
      <Mobiliario />
      <Fonte t={t} />
      <Palmeiras lista={PALMAS} t={t} vento={vento} corSol="#fff1dc" ventoDir={[0.4, 1]} patch={comAgua} />
      <GuardaSois t={t} L={L} />
      <Soltos t={t} L={L} />
      <Carros t={t} L={L} />
      {gente && <Multidao3D lista={PESSOAS} t={t} de={[0, 0]} cam={cam} raio={2} estadoDe={(q, k, tt) => estadoGente(PESSOAS[k], tt, L)} patch={comAgua} />}
    </>
  );
};
