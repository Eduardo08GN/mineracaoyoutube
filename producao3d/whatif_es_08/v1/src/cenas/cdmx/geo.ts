// Geometrias montadas na carga (deterministicas): pegadas OSM extrudadas e marcos por codigo (Catedral, Palacio, Zocalo).
import * as THREE from 'three';

type Parte = {g: THREE.BufferGeometry; cor: string; jan?: number};
// junta varias geometrias (ja transformadas) numa so, com atributo aCor por vertice
export const junta = (partes: Parte[]) => {
  const pos: number[] = [], nor: number[] = [], cor: number[] = [], jan: number[] = [];
  for (const {g, cor: c, jan: j = 0} of partes) {
    const ng = g.index ? g.toNonIndexed() : g, p = ng.attributes.position, n = ng.attributes.normal, col = new THREE.Color(c);
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); cor.push(col.r, col.g, col.b); jan.push(j); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aCor', new THREE.Float32BufferAttribute(cor, 3)); g.setAttribute('aJan', new THREE.Float32BufferAttribute(jan, 1)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9); return g;
};
const caixa = (w: number, h: number, d: number, x: number, y0: number, z: number, cor: string): Parte => ({g: new THREE.BoxGeometry(w, h, d).translate(x, y0 + h / 2, z), cor});
const cil = (r0: number, r1: number, h: number, x: number, y0: number, z: number, cor: string, seg = 16): Parte => ({g: new THREE.CylinderGeometry(r1, r0, h, seg).translate(x, y0 + h / 2, z), cor});
const cupula = (r: number, x: number, y0: number, z: number, cor: string): Parte => ({g: new THREE.SphereGeometry(r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2).translate(x, y0, z), cor});

// Zocalo: praca ~230 x 240 m no nivel 240 (2.240 m). Catedral Metropolitana ao norte (fachada para o sul, 59 m de nave + Sagrario
// a leste = ~105 m de frente, torres de ~65 m), Palacio Nacional a leste (~200 m de fachada, ~22 m), mastro de 50 m no centro.
export const marcosZocalo = (Y: number) => {
  const CANT = '#d8c6a6', CANT2 = '#c4ae8c', ESC = '#4a3a31', TEZ = '#b5503a', TEZ2 = '#99412f', PRACA = '#ddd5c6', OURO = '#c9a24a';
  const p: Parte[] = [];
  p.push(caixa(232, 0.8, 236, 0, Y - 0.4, 0, PRACA));                                   // laje da praca
  p.push(caixa(7, 1.6, 7, 0, Y, 0, CANT2));                                            // base do mastro
  p.push(cil(0.75, 0.45, 50, 0, Y, 0, '#d9d9d9', 10));                                   // mastro
  // Catedral
  const cx = -15.5, zf = -132;
  p.push(caixa(59, 28, 118, cx, Y, zf - 59, CANT2));                                    // nave + capelas
  p.push(caixa(24, 12, 112, cx, Y + 28, zf - 59, CANT));                                // nave central alta
  p.push(caixa(27, 38, 5, cx, Y, zf + 1, CANT));                                        // corpo central da fachada
  p.push(caixa(17, 7, 5, cx, Y + 38, zf + 1, CANT));                                    // remate
  p.push(caixa(8, 15, 1.2, cx, Y, zf + 4, ESC));                                        // portal
  p.push(caixa(5, 7, 1.2, cx, Y + 19, zf + 4, ESC));                                    // janela do coro
  for (const tx of [cx - 23, cx + 23]) {                                                // torres
    p.push(caixa(14, 42, 14, tx, Y, zf - 6, CANT));
    p.push(caixa(11.5, 13, 11.5, tx, Y + 42, zf - 6, CANT2));
    p.push(caixa(5, 8, 11.9, tx, Y + 44.5, zf - 6, ESC)); p.push(caixa(11.9, 8, 5, tx, Y + 44.5, zf - 6, ESC));   // vaos dos sinos
    p.push(caixa(13, 1.2, 13, tx, Y + 55, zf - 6, CANT));
    p.push(cil(5.6, 2.2, 7.5, tx, Y + 56, zf - 6, CANT2, 12));                           // remate em sino
    p.push({g: new THREE.SphereGeometry(2.1, 10, 8).translate(tx, Y + 64.2, zf - 6), cor: OURO});
    p.push(caixa(0.5, 3.2, 0.5, tx, Y + 65.2, zf - 6, OURO));
  }
  p.push(cil(8.5, 8.5, 9, cx, Y + 38, zf - 76, CANT, 20));                              // tambor da cupula
  p.push(cupula(8.6, cx, Y + 47, zf - 76, '#9fb3a7'));                                   // cupula (azulejo esverdeado)
  p.push(cil(1.8, 1.4, 6, cx, Y + 55, zf - 76, CANT, 10));
  // Sagrario Metropolitano (leste da Catedral)
  p.push(caixa(30, 26, 3, 37, Y, -132.5, CANT));
  p.push(caixa(6, 11, 1.2, 37, Y, -130.6, ESC));
  // Palacio Nacional (lado leste, fachada para o oeste em x = 128)
  p.push({...caixa(200, 22, 205, 228, Y, 2, TEZ), jan: 1});
  p.push({...caixa(44, 21, 50, 37, Y, -158, TEZ), jan: 1});
  p.push(caixa(201, 1.6, 206, 228, Y + 22, 2, CANT));
  for (let k = -4; k <= 4; k++) p.push(caixa(1.2, 18, 1.2, 127.6, Y, 2 + k * 23, CANT));   // pilastras de cantera
  p.push(caixa(16, 14, 18, 131, Y + 22, 2, CANT));                                      // corpo do sino
  p.push(caixa(6, 7, 6, 131, Y + 36, 2, CANT2));
  for (const k of [-60, 0, 60]) p.push(caixa(1.2, 10, 6, 127.6, Y, 2 + k, ESC));         // portas
  for (const [x, z] of [[190, -55], [265, -55], [190, 60], [265, 60]]) p.push(caixa(42, 0.6, 46, x, Y + 22.4, z, TEZ2));   // patios
  return junta(p);
};

// pegadas OSM: [altura, chao, [x0,z0,x1,z1,...]] -> paredes + telhado; position.y = 0 (pe) / 1 (topo), aC = (cx, cz, h, semente)
export const extruda = (lista: [number, number, number[]][]) => {
  const pos: number[] = [], nor: number[] = [], ac: number[] = [];
  lista.forEach(([h, , pts], k) => {
    const n = pts.length / 2; if (n < 3) return;
    let cx = 0, cz = 0, area = 0;
    for (let i = 0; i < n; i++) { cx += pts[2 * i]; cz += pts[2 * i + 1]; const j = (i + 1) % n; area += pts[2 * i] * pts[2 * j + 1] - pts[2 * j] * pts[2 * i + 1]; }
    cx /= n; cz /= n; const s = ((k * 0.6180339) % 1), sg = area > 0 ? 1 : -1;
    const v = (x: number, y: number, z: number, nx: number, ny: number, nz: number) => { pos.push(x, y, z); nor.push(nx, ny, nz); ac.push(cx, cz, h, s); };
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, ax = pts[2 * i], az = pts[2 * i + 1], bx = pts[2 * j], bz = pts[2 * j + 1];
      const L = Math.hypot(bx - ax, bz - az) || 1, nx = ((bz - az) / L) * sg, nz = ((ax - bx) / L) * sg;   // normal para fora (lado direito do contorno anti-horario)
      v(ax, 0, az, nx, 0, nz); v(bx, 0, bz, nx, 0, nz); v(bx, 1, bz, nx, 0, nz);
      v(ax, 0, az, nx, 0, nz); v(bx, 1, bz, nx, 0, nz); v(ax, 1, az, nx, 0, nz);
    }
    const cont = Array.from({length: n}, (_, i) => new THREE.Vector2(pts[2 * i], pts[2 * i + 1]));
    for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(cont, [])) for (const q of [a, b, c]) v(cont[q].x, 1, cont[q].y, 0, 1, 0);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aC', new THREE.Float32BufferAttribute(ac, 4)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9); return g;
};
