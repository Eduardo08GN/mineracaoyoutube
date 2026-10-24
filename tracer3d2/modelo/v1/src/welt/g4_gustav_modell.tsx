// =====================================================================================================================
// g4_gustav_modell.tsx — SCHWERER GUSTAV, prozedural aus den Maßen (Video 4, Tracer3D 2.0).
// =====================================================================================================================
// Maße (BATEDOR_gustav §1b/§4, fakten.md): 47,3 × 7,1 × 11,6 m, 1.350 t, Rohr 32,48 m (Kaliber 800 mm, L/40,6), 8 Drehgestelle × 5 Achsen
// = 40 Achsen = 80 Räder auf ZWEI Gleisen (vier Schienen, Spur 1.435 mm), Erhöhung 0…48°. Referenz für die Proportionen: die acht US-Army-
// Aufnahmen von 1945 (geo/fotos) und die Commons-Fotos; die Konstruktion (Seitenträger, Schildzapfentürme, Wiege, Ladeschale, Aufzug) ist
// SCHEMATISCH: kein Konstruktionsplan ist gemeinfrei. Keine Hoheitszeichen, keine Beschriftung.
//
// Koordinaten (Meter): Ursprung = Boden (Schienenoberkante) unter dem Schildzapfen; x = Schussrichtung, y oben, z seitlich.
//   Rohr bei 0° von x = -9,5 (Verschluss) bis x = +22,98 (Mündung); Schildzapfen bei (0, 9,6, 0); Rahmen x -24,3 … +13,0.
//
// Bausteine (alle f(Props), ohne Zustand):
//   <Gustav elev rueck tiro zerlegt verladen tarn glow bauplan truckAn achsenAn transp rohrGlow position gier skala />
//   <GustavRohr … />   Längsschnitt des Rohrs (Ursprung = Verschlussfläche, Achse +x) mit Granate, Ladung, Gasdruck, Verschleiß
//   <GranateG granate=beton|spreng schnitt stehend ry mantelGlow hoehleGlow />, <Gleis/>, <Kleinwagen/>, <Haus4/>, <Portal/> (Montage-Portalkran)
// =====================================================================================================================
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {drehkoerper, usePbr, stahl, stab, Gas} from './t_geschuetz';
import {bx, zyl, vereine} from './m_moerser';
import {glatt, zwischen} from './t_szene';

export type V3 = [number, number, number];
type P2 = [number, number][];
const RAD = Math.PI / 180;
const nb = (g: THREE.BufferGeometry) => (g.index ? g.toNonIndexed() : g);
const cache: Record<string, THREE.BufferGeometry> = {};
const geo = (k: string, f: () => THREE.BufferGeometry) => cache[k] ?? (cache[k] = f());
const vec = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const strebe = (a: V3, b: V3, r: number) => nb(stab(vec(...a), vec(...b), r, 8));
// UV in Metern auf einer Drehkörper-/Zylinder-Geometrie ist schon da; für alles andere liefert bx() Meter-UVs.

export const G = {
  L: 47.3, B: 7.1, H: 11.6, rohrL: 32.48, kal: 0.8, sT: 9.5, yT: 9.6, spur: 1.435, zSpur: 2.75, tonnen: 1350, rohrT: 400,
  truckX: [-18, -9, 0, 9] as number[], achsAbst: 1.45, radR: 0.5, rahmenX0: -24.3, rahmenX1: 13.0, elevMax: 48,
};
// Weltpunkt im Gustav-Rahmen: Punkt (xl, yl) im Rohrrahmen (Ursprung Schildzapfen, +x Seelenachse) bei Erhöhung elev (Grad)
export const rohrWelt = (xl: number, yl: number, elev: number, off: V3 = [0, 0, 0]): V3 => {
  const c = Math.cos(elev * RAD), s = Math.sin(elev * RAD);
  return [off[0] + xl * c - yl * s, G.yT + off[1] + xl * s + yl * c, off[2]];
};
export const mundungG = (elev: number, rueck = 0): V3 => rohrWelt(G.rohrL - G.sT - rueck, 0, elev);
export const verschlussG = (elev: number, rueck = 0): V3 => rohrWelt(-G.sT - rueck, 0, elev);
// Rücklauf nach dem Schuss: schnell nach hinten (0,3 s), langsam zurück (Rücklaufbremse + Vorholer); R in m
export const rueckweg = (tiro: number, R = 1.6) => (tiro <= 0 ? 0 : tiro < 0.3 ? R * Math.sin((tiro / 0.3) * Math.PI / 2) : R * Math.exp(-(tiro - 0.3) / 1.7));

// ---------- Rohr-Profile (s ab Verschlussfläche, Radius): 400 t auf 32,48 m ----------
const ROHR_AUSSEN: P2 = [[0, 0.9], [0.15, 0.98], [1.2, 1.03], [8, 1.06], [8.12, 1.0], [14, 0.93], [14.12, 0.88], [20, 0.77], [26, 0.65], [26.1, 0.62], [31.3, 0.55], [31.5, 0.62], [32.1, 0.62], [32.48, 0.57]];
const BOHRUNG: P2 = [[32.48, 0.4], [12.2, 0.4], [12.0, 0.43], [0, 0.43]];
const AUSSEN_OFFEN: P2 = [...ROHR_AUSSEN, [32.48, 0.4]];

// ---------- Texturen (Canvas, feste Samen) ----------
const TEX: Record<string, THREE.CanvasTexture> = {};
const canvasTex = (k: string, w: number, h: number, f: (c: CanvasRenderingContext2D) => void, rep = true) => {
  if (TEX[k]) return TEX[k];
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; f(cv.getContext('2d')!);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = rep ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping; t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true;
  return (TEX[k] = t);
};
const hs = (x: number) => { const y = Math.sin(x * 127.1 + 311.7) * 43758.5453; return y - Math.floor(y); };
// 96 Züge (Felder/Züge abwechselnd) rund um den Umfang der Bohrung
export const zuegeTex = (stufe = 0) => { const t = zuegeTex0(stufe); t.repeat.set(0.398, 0.2); return t; };
const zuegeTex0 = (stufe = 0) => canvasTex('zuege' + stufe, 384, 8, (c) => {
  const hell = ['#9a9488', '#a39e92', '#b4afa4'][stufe], dunkel = ['#3a3733', '#6a665e', '#a29d92'][stufe];
  for (let i = 0; i < 96; i++) { c.fillStyle = hell; c.fillRect(i * 4, 0, 2, 8); c.fillStyle = dunkel; c.fillRect(i * 4 + 2, 0, 2, 8); }
});
export const kiesTex = () => canvasTex('kies', 256, 256, (c) => {
  c.fillStyle = '#8b8579'; c.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3200; i++) { const g = 90 + hs(i) * 90; c.fillStyle = `rgb(${g},${g - 4},${g - 12})`; c.beginPath(); c.arc(hs(i + 5) * 256, hs(i + 9) * 256, 1 + hs(i + 3) * 2.4, 0, 6.3); c.fill(); }
});
export const netzTex = () => canvasTex('netz', 256, 256, (c) => {
  c.clearRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    const x = hs(i) * 256, y = hs(i + 7) * 256, r = 4 + hs(i + 3) * 14, g = hs(i + 11);
    c.fillStyle = g < 0.4 ? '#3c4630' : g < 0.75 ? '#4f4a34' : '#2c3324'; c.globalAlpha = 0.85; c.beginPath(); c.ellipse(x, y, r, r * 0.55, hs(i + 1) * 3, 0, 6.3); c.fill();
  }
  c.globalAlpha = 1; c.strokeStyle = 'rgba(30,34,24,0.9)'; c.lineWidth = 1;
  for (let i = 0; i <= 256; i += 16) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, 256); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(256, i); c.stroke(); }
});

// ---------- Geometrien ----------
// ein Drehgestell (5 Achsen, lokal um die Gleismitte, y = 0 Schienenoberkante)
export const geoDrehgestell = () => geo('dreh', () => {
  const t: THREE.BufferGeometry[] = [], zr = G.spur / 2;
  for (let k = -2; k <= 2; k++) {
    const x = k * G.achsAbst;
    t.push(zyl(0.1, 2 * zr + 0.1, 'z', x, G.radR, 0, 12));
    for (const z of [-zr, zr]) {
      t.push(zyl(G.radR, 0.14, 'z', x, G.radR, z, 28), zyl(G.radR + 0.05, 0.03, 'z', x, G.radR, z + Math.sign(z) * -0.06, 28), zyl(0.2, 0.22, 'z', x, G.radR, z + Math.sign(z) * 0.1, 12));
      t.push(bx(0.34, 0.3, 0.22, x, G.radR, z + Math.sign(z) * 0.2));            // Achslager
    }
  }
  for (const z of [-0.5, 0.5]) t.push(bx(7.6, 0.3, 0.3, 0, 1.05, z), bx(7.2, 0.16, 0.5, 0, 0.78, z * 1.9));
  for (const x of [-3.5, 3.5]) t.push(bx(0.4, 0.32, 1.3, x, 1.05, 0));
  t.push(bx(2.0, 0.4, 1.7, 0, 1.2, 0), zyl(0.5, 0.22, 'y', 0, 1.5, 0, 20));                     // Drehzapfen
  for (let k = -2; k <= 2; k++) for (const z of [-0.5, 0.5]) t.push(zyl(0.1, 0.34, 'y', k * G.achsAbst, 1.0, z, 8));   // Federn
  return vereine(t);
});

// Rahmen aus Seitenträgern (Kastenträger), Querträgern, Deck, Geländer, Maschinenhaus, Nieten
export const geoRahmen = () => geo('rahmen', () => {
  const t: THREE.BufferGeometry[] = [], x0 = G.rahmenX0, x1 = G.rahmenX1, Lx = x1 - x0, xm = (x0 + x1) / 2, zs = G.zSpur;
  for (const s of [-1, 1]) {
    t.push(bx(Lx, 2.4, 1.6, xm, 2.45, s * zs));                                                      // Kastenträger y 1,25 … 3,65
    t.push(bx(Lx + 0.1, 0.1, 1.74, xm, 3.7, s * zs), bx(Lx + 0.1, 0.1, 1.74, xm, 1.2, s * zs));    // Gurte
    for (let x = x0 + 1.2; x < x1; x += 2.4) t.push(bx(0.12, 2.3, 0.1, x, 2.45, s * (zs + 0.84)));  // Steifen außen
    for (let x = x0 + 0.5; x < x1; x += 0.42) { t.push(bx(0.07, 0.07, 0.07, x, 1.5, s * (zs + 0.82)), bx(0.07, 0.07, 0.07, x, 3.4, s * (zs + 0.82))); }   // Nietreihen (Würfel statt Kugeln)
    for (let x = x0; x <= x1 + 0.1; x += 2.8) { t.push(bx(0.08, 1.1, 0.08, x, 4.25, s * (zs + 0.74)), bx(2.8, 0.07, 0.07, x + 1.4, 4.8, s * (zs + 0.74))); }   // Geländer
  }
  for (const x of [x0 + 1.0, x1 - 1.0]) t.push(bx(2.0, 1.5, 2 * zs - 1.6, x, 1.9, 0));            // Kopfträger
  for (const x of [-16, -12.2]) t.push(bx(1.2, 1.0, 2 * zs - 1.6, x, 1.75, 0));                    // untere Querträger hinten (außerhalb des Rohrschwenks)
  t.push(bx(11.6, 0.15, 2 * zs - 1.5, -18.55, 3.72, 0));                                           // Arbeitsbühne hinten
  t.push(bx(3.0, 0.15, 2 * zs - 1.5, x1 - 1.6, 3.72, 0));
  for (let x = -24.0; x < -13.0; x += 0.55) t.push(bx(0.05, 0.03, 3.9, x, 3.82, 0));              // Gitterrost (Rippen)
  t.push(bx(5.2, 3.0, 3.2, -21.5, 5.3, -2.0), bx(5.4, 0.15, 3.4, -21.5, 6.88, -2.0));            // Maschinenhaus (Antriebe/Kompressor), schräg: Pultdach
  t.push(bx(3.0, 2.4, 2.6, -14.8, 5.0, 2.1), bx(3.2, 0.14, 2.8, -14.8, 6.27, 2.1));              // Kanzel/Schalthaus
  t.push(zyl(0.18, 2.4, 'y', -22.8, 8.0, -2.4, 10));                                                // Abgasrohr
  return vereine(t);
});
// Schildzapfentürme (links/rechts), Streben, Lager
export const geoTurm = (s: 1 | -1) => geo('turm' + s, () => {
  const t: THREE.BufferGeometry[] = [], z = G.zSpur * s;
  t.push(bx(3.2, 7.2, 1.5, 0, 7.25, z), bx(3.9, 0.75, 1.9, 0, 11.225, z));                           // Säule + Kopf (y bis 11,6)
  t.push(bx(2.7, 2.6, 0.7, 0, G.yT, z - s * 1.0), zyl(0.8, 0.5, 'z', 0, G.yT, z - s * 1.4, 28));    // Zapfenlager
  for (const x of [-1.4, 1.4]) t.push(bx(0.14, 7.2, 0.1, x, 7.25, z + s * 0.8));
  for (const dz of [-0.45, 0.45]) {
    t.push(strebe([9.2, 3.7, z + dz], [1.3, 9.6, z + dz], 0.19), strebe([-9.2, 3.7, z + dz], [-1.3, 9.6, z + dz], 0.19));
  }
  t.push(bx(3.0, 0.15, 1.1, 0, 7.4, z + s * 1.2));                                                 // Laufsteg am Turm
  return vereine(t);
});
// Aufzug/Kran hinten (Munitionsaufzug mit Schrägbahn bis zur Ladeschale)
export const geoAufzug = () => geo('aufzug', () => {
  const t: THREE.BufferGeometry[] = [];
  for (const x of [-22.2, -17.4]) for (const z of [-3.05, 3.05]) t.push(strebe([x, 3.7, z], [x, 10.7, z], 0.2));
  for (const y of [6.0, 8.4, 10.7]) { t.push(strebe([-22.2, y, -3.05], [-17.4, y, -3.05], 0.12), strebe([-22.2, y, 3.05], [-17.4, y, 3.05], 0.12), strebe([-22.2, y, -3.05], [-22.2, y, 3.05], 0.12), strebe([-17.4, y, -3.05], [-17.4, y, 3.05], 0.12)); }
  for (const z of [-3.05, 3.05]) { t.push(strebe([-22.2, 3.7, z], [-17.4, 6.0, z], 0.1), strebe([-17.4, 6.0, z], [-22.2, 8.4, z], 0.1), strebe([-22.2, 8.4, z], [-17.4, 10.7, z], 0.1)); }
  t.push(bx(5.6, 0.55, 7.0, -19.8, 11.0, 0));                                                      // Kopfträger
  for (const z of [-0.8, 0.8]) t.push(strebe([-20.5, 3.9, z], [-13.6, 8.9, z], 0.16));               // Schrägbahn
  t.push(bx(1.4, 0.5, 1.9, -17.0, 6.35, 0, 0, 0, 0.62), strebe([-17.0, 6.6, 0], [-19.4, 10.8, 0], 0.05));   // Förderwagen (schräg) + Seil
  return vereine(t);
});
// Wiege (im Rohrrahmen: Ursprung Schildzapfen, x entlang der Seele)
export const geoWiegeG = () => geo('wiegeG', () => {
  const t: THREE.BufferGeometry[] = [], s0 = 2.6 - G.sT, s1 = 16.8 - G.sT;
  const hulse = drehkoerper([[s0, 1.5], [s1, 1.5], [s1, 1.12], [s0, 1.12]], 64, true);
  t.push(nb(hulse));
  for (const x of [s0 + 0.15, s1 - 0.15, -1.2, 1.2]) t.push(nb(drehkoerper([[x - 0.25, 1.62], [x + 0.25, 1.62], [x + 0.25, 1.48], [x - 0.25, 1.48]], 48, true)));
  t.push(zyl(0.55, 5.8, 'z', 0, 0, 0, 24));                                                        // Schildzapfen (bis in die Lager)
  for (const z of [-1.1, 1.1]) t.push(bx(3.4, 3.2, 0.5, 0, 0, z * 1.15));                           // Wangen
  for (const z of [-0.65, 0.65]) { t.push(zyl(0.27, 10.5, 'x', 1.3, 1.62, z, 16), zyl(0.27, 10.5, 'x', 1.3, -1.55, z, 16)); }   // Bremszylinder
  const arc = new THREE.TorusGeometry(5.6, 0.16, 6, 36, 62 * RAD); arc.rotateZ(-(150) * RAD); arc.translate(0, 0, 0);   // Höhenrichtbogen (Zahnsegment)
  for (const z of [-1.7, 1.7]) { const a = arc.clone(); a.translate(0, 0, z); t.push(nb(a)); }
  return vereine(t);
});
// Verschluss + Ladeschale (am Rohr: bewegt sich beim Rücklauf mit)
export const geoVerschlussG = () => geo('verschlussG', () => {
  const t: THREE.BufferGeometry[] = [], x0 = -G.sT;
  t.push(bx(2.2, 2.1, 2.1, x0 - 0.8, 0, 0), bx(0.3, 2.3, 2.3, x0 - 1.95, 0, 0));
  t.push(zyl(0.28, 0.9, 'x', x0 - 2.4, 0, 0, 14), zyl(0.1, 1.1, 'z', x0 - 2.5, 0.0, 0.0, 8));
  for (const z of [-0.85, 0.85]) t.push(bx(7.2, 0.22, 0.2, x0 - 5.6, -0.95, z), strebe([x0 - 2.6, -0.95, z], [x0 - 4.3, -2.2, z], 0.06));   // Ladeschale (Schienen)
  t.push(bx(6.4, 0.12, 1.8, x0 - 5.4, -1.08, 0));
  return vereine(t);
});
// Rohr außen (offen am Verschluss; Mündungsring) und Bohrung
const rohrAussen = () => geo('rohrA', () => { const g = drehkoerper(AUSSEN_OFFEN, 96, false); g.translate(-G.sT, 0, 0); return g; });
const rohrBohr = () => geo('rohrB', () => { const g = drehkoerper(BOHRUNG, 96, false); g.translate(-G.sT, 0, 0); return g; });
const rohrAussenS = () => geo('rohrAS', () => drehkoerper([...AUSSEN_OFFEN, ...BOHRUNG.slice(1), [0, 0.9]] as P2, 96, true));       // Schnitt: Ring geschlossen, Ursprung = Verschlussfläche
const rohrBohrS = () => geo('rohrBS', () => drehkoerper(BOHRUNG, 96, false));

// ---------- Material-Satz ----------
const mkStahl = (farbe: string, pbr: any, o: {rauh?: number; metall?: number; kappe?: string; ns?: number} = {}) => stahl({farbe, pbr: {...pbr, map: undefined}, rauh: o.rauh ?? 0.6, metall: o.metall ?? 0.4, kappe: o.kappe, normalStaerke: o.ns ?? 0.5});
export const useGMat = () => {
  const p1 = usePbr('metal_plate', 3.0, true), p2 = usePbr('green_metal_rust', 3.0);
  return useMemo(() => {
    const kies = kiesTex(); kies.repeat.set(1 / 3, 1 / 3);
    return {
      rahmen: mkStahl('#6a7178', p1, {rauh: 0.65, ns: 0.7}), turm: mkStahl('#656c73', p1, {rauh: 0.65, ns: 0.7}),
      rohr: mkStahl('#5c636a', p1, {rauh: 0.45, metall: 0.7}), wiege: mkStahl('#6a7178', p1, {rauh: 0.5, metall: 0.65}), dreh: mkStahl('#4d5154', p1, {rauh: 0.6, metall: 0.6}),
      rohrS: mkStahl('#6a7178', p1, {rauh: 0.5, metall: 0.7, kappe: '#b9b2a0'}),
      bohr: new THREE.MeshStandardMaterial({map: zuegeTex(), color: '#6b6760', roughness: 0.6, metalness: 0.7, side: THREE.DoubleSide}),
      netz: new THREE.MeshStandardMaterial({map: netzTex(), transparent: true, alphaTest: 0.12, side: THREE.DoubleSide, roughness: 1, metalness: 0}),
      kies, linien: new THREE.LineBasicMaterial({color: '#5ec8e5', transparent: true, depthWrite: false, toneMapped: false}),
    };
  }, [p1, p2]);
};
export type GMat = ReturnType<typeof useGMat>;
const setGlow = (m: THREE.MeshStandardMaterial, cor: string, k: number) => { m.emissive.set(cor); m.emissiveIntensity = k; };
const setOpa = (m: THREE.Material, o: number) => { m.transparent = o < 0.999; m.opacity = o; m.depthWrite = o > 0.6; };

const kanten = (g: THREE.BufferGeometry, grad = 30) => new THREE.EdgesGeometry(g, grad);

// ---------- Hauptbaustein ----------
export type GustavProps = {
  elev?: number; rueck?: number; tiro?: number; zerlegt?: number; verladen?: number; tarn?: number; glow?: number; glowCor?: string; bauplan?: number;
  truckAn?: number; achsenAn?: number; transp?: number; rohrGlow?: number; skala?: number; position?: V3; gier?: number; sichtbar?: number; ohneTrucks?: boolean; granate?: number;
  zt?: Record<string, number>;   // zerlegt je Teil (rohr, verschluss, wiege, turmL, turmR, rahmen, aufzug, truck), ueberschreibt `zerlegt`
};
// Offsets der Teile in der Explosionsansicht (m) und Ladeposition auf den Flachwagen (Reihe A bei z = +ZW, Reihe B bei z = -ZW; Wagen alle 20 m)
export const ZW = 17.5;
export const EXPL = {rohr: [15, 5, 0], verschluss: [-10, 3.5, 0], wiege: [0, 9.5, 0], turmL: [0, 6.5, -6], turmR: [0, 6.5, 6], rahmen: [0, 2.2, 0], aufzug: [-9, 6, 0]} as Record<string, V3>;
const LOAD = {rohr: [3.26, -6.95, ZW], verschluss: [-5.7, -6.9, ZW], wiege: [40, -6.55, -ZW], turmL: [-64, -2.1, ZW + 2.75], turmR: [-56, -2.1, ZW - 2.75], rahmen: [55.65, 0.35, ZW], aufzug: [37.8, -2.2, ZW]} as Record<string, V3>;
const TRUCK_X = [-44, -36, -24, -16, -4, 4, 16, 24];
export const WAGEN_X = [-60, -40, -20, 0, 20, 40, 60];

export const Gustav: React.FC<GustavProps> = ({elev = 0, rueck, tiro = -1, zerlegt = 0, verladen = 0, tarn = 0, glow = 0, glowCor = '#5ec8e5', bauplan = 1, truckAn = 0, achsenAn = 0, transp = 0,
  rohrGlow = 0, skala = 1, position = [0, 0, 0], gier = 0, sichtbar = 1, ohneTrucks = false, granate = 0, zt}) => {
  const m = useGMat();
  const rk = rueck ?? rueckweg(tiro);
  const trucks = useMemo(() => Array.from({length: 8}, () => null), []);
  const drehMats = useMemo(() => trucks.map(() => mkStahlKlon(m.dreh)), [m.dreh, trucks]);
  const geoD = geoDrehgestell(), geoR = geoRahmen(), geoTL = geoTurm(-1), geoTR = geoTurm(1), geoA = geoAufzug(), geoW = geoWiegeG(), geoV = geoVerschlussG();
  const kantenG = useMemo(() => [geoR, geoTL, geoTR, geoA, geoW, geoV, rohrAussen()].map((g) => kanten(g, 35)), [geoR, geoTL, geoTR, geoA, geoW, geoV]);
  // Zustandswerte
  const ge = Math.max(0, Math.min(1, glow));
  const feste = [m.rahmen, m.turm, m.rohr, m.wiege];
  for (const f of feste) setGlow(f, glowCor, ge * 0.55);
  setGlow(m.rohr, rohrGlow > 0 ? '#ff7a22' : glowCor, rohrGlow > 0 ? rohrGlow * 1.4 : ge * 0.55);
  const solid = Math.max(0, Math.min(1, bauplan)) * Math.max(0, Math.min(1, sichtbar));
  const opak = solid * (1 - 0.8 * transp);
  for (const f of [...feste, m.dreh, ...drehMats]) setOpa(f, opak);
  m.linien.opacity = (1 - solid * 0.92) * (bauplan < 0.999 ? 1 : 0);
  const showLines = bauplan < 0.999 && sichtbar > 0.01;
  const q = verladen;
  const zk = (k: string) => zt?.[k] ?? zerlegt;
  const ladeT = (k: string): V3 => (EXPL[k] ?? [0, 0, 0]).map((e, i) => e * zk(k) * (1 - q) + (LOAD[k] ?? [0, 0, 0])[i] * q) as V3;
  const off = (k: string): V3 => ladeT(k);
  const piece = (k: string, children: React.ReactNode) => <group position={off(k)}>{children}</group>;
  const pivot = (k: string, children: React.ReactNode) => <group position={[0, G.yT, 0]}><group position={off(k)}>{children}</group></group>;
  // Drehgestelle: in der Explosionsansicht seitlich weg, beim Verladen auf die Flachwagen der Reihe B
  const truckOff = (i: number): V3 => {
    const s = i < 4 ? -1 : 1, kx = G.truckX[i % 4], u = zk('truck') * (1 - q);
    return [(TRUCK_X[i] - kx) * q, 1.55 * q + 1.2 * u, (-ZW - s * G.zSpur) * q + s * 4.5 * u];
  };
  return (
    <group position={position} rotation={[0, gier * RAD, 0]} scale={skala} visible={sichtbar > 0.01}>
      {!ohneTrucks && trucks.map((_, i) => {
        const s = i < 4 ? -1 : 1, kx = G.truckX[i % 4], mat = drehMats[i];
        const an = Math.min(1, Math.max(0, truckAn - i));
        setGlow(mat, achsenAn > 0.5 ? '#f2c14e' : '#5ec8e5', an * (achsenAn > 0.5 ? 0.55 : 0.9) + ge * 0.5);
        const o = truckOff(i);
        return <mesh key={i} geometry={geoD} material={mat} position={[kx + o[0], o[1], s * G.zSpur + o[2]]} castShadow receiveShadow />;
      })}
      {piece('rahmen', <>
        <mesh geometry={geoR} material={m.rahmen} castShadow receiveShadow />
        {showLines && <lineSegments geometry={kantenG[0]} material={m.linien} />}
      </>)}
      {piece('aufzug', <>
        <mesh geometry={geoA} material={m.rahmen} castShadow receiveShadow />
        {showLines && <lineSegments geometry={kantenG[3]} material={m.linien} />}
      </>)}
      {piece('turmL', <><mesh geometry={geoTL} material={m.turm} castShadow receiveShadow />{showLines && <lineSegments geometry={kantenG[1]} material={m.linien} />}</>)}
      {piece('turmR', <><mesh geometry={geoTR} material={m.turm} castShadow receiveShadow />{showLines && <lineSegments geometry={kantenG[2]} material={m.linien} />}</>)}
      {pivot('wiege', <group rotation={[0, 0, elev * RAD]}>
        <mesh geometry={geoW} material={m.wiege} castShadow receiveShadow />
        {showLines && <lineSegments geometry={kantenG[4]} material={m.linien} />}
      </group>)}
      {pivot('rohr', <group rotation={[0, 0, elev * RAD]}><group position={[-rk, 0, 0]}>
        <mesh geometry={rohrAussen()} material={m.rohr} castShadow receiveShadow />
        <mesh geometry={rohrBohr()} material={m.bohr} />
        {showLines && <lineSegments geometry={kantenG[6]} material={m.linien} />}
        {granate > 0 && <mesh position={[G.rohrL - G.sT + 0.01, 0, 0]} rotation={[0, 0, 0]}><circleGeometry args={[0.4, 24]} /><meshBasicMaterial color="#05060a" /></mesh>}
      </group></group>)}
      {pivot('verschluss', <group rotation={[0, 0, elev * RAD]}><group position={[-rk, 0, 0]}>
        <mesh geometry={geoV} material={m.wiege} castShadow receiveShadow />
        {showLines && <lineSegments geometry={kantenG[5]} material={m.linien} />}
      </group></group>)}
      {tarn > 0 && <Tarnnetz anteil={tarn} mat={m.netz} />}
    </group>
  );
};
const mkStahlKlon = (m: THREE.MeshStandardMaterial) => { const c = m.clone(); c.onBeforeCompile = m.onBeforeCompile; c.customProgramCacheKey = m.customProgramCacheKey; return c; };

// Tarnnetz (zwei Bahnen über den Seitenträgern, Mitte frei für das Rohr), deckt von hinten nach vorn `anteil` 0..1 der Länge
const Tarnnetz: React.FC<{anteil: number; mat: THREE.Material}> = ({anteil, mat}) => {
  const n = Math.max(2, Math.round(60 * Math.min(1, anteil))), x0 = G.rahmenX0, x1 = x0 + (G.rahmenX1 - x0) * Math.min(1, anteil);
  const g = useMemo(() => {
    const pos: number[] = [], uv: number[] = [], idx: number[] = [], nz = 6;
    const bump = (x: number) => 3.0 * Math.exp(-Math.pow(x / 2.6, 2));
    for (const s of [-1, 1]) {
      const base = pos.length / 3;
      for (let i = 0; i <= n; i++) {
        const x = x0 + ((x1 - x0) * i) / n, yr = 8.2 + bump(x) + 0.6 * Math.sin(x * 0.7);
        for (let j = 0; j <= nz; j++) {
          const u = j / nz, z = s * (3.62 - u * 1.55), y = 4.0 + (yr - 4.0) * Math.pow(u, 0.8) + 0.18 * Math.sin(x * 2.1 + j * 1.7) * (1 - u);
          pos.push(x, y, z); uv.push(x / 6, u * 1.2);
        }
      }
      for (let i = 0; i < n; i++) for (let j = 0; j < nz; j++) { const a = base + i * (nz + 1) + j, b = a + 1, c = a + nz + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    }
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); gg.setIndex(idx); gg.computeVertexNormals(); return gg;
  }, [n, x0, x1]);
  return <mesh geometry={g} material={mat} castShadow />;
};

// ---------- Längsschnitt des Rohrs ----------
// Ursprung = Verschlussfläche, Achse +x, y oben; Schnittebene z = position[2]; Blick von +z.
export type RohrSchnittProps = {granateS?: number; granate?: 'beton' | 'spreng' | 'keine'; pulver?: number; druck?: number; glut?: number; verschleiss?: number; rohrGlow?: number; schnitt?: boolean;
  elev?: number; position?: V3; t?: number; sichtbar?: number; gasBis?: number; pulverStart?: number; ladung?: number; pulverEnde?: number; glatte?: number};
const GRN = {beton: {L: 6.79, m: 7100}, spreng: {L: 3.75, m: 4800}};
export const GustavRohr: React.FC<RohrSchnittProps> = ({granateS = 5.2, granate = 'beton', pulver = 1, druck = 0, glut = 0, verschleiss = 0, rohrGlow = 0, schnitt = true, elev = 0, position = [0, 0, 0], t = 0, sichtbar = 1,
  gasBis, pulverStart = 0.5, ladung = 6, pulverEnde, glatte = 0}) => {
  const m = useGMat();
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, -1), 0), []);
  plane.constant = position[2];
  const aus = rohrAussenS(), bohr = rohrBohrS();
  const mats = useMemo(() => ({
    wand: mkStahlKlon(m.rohrS), bohr: m.bohr.clone(),
    pulver: new THREE.MeshStandardMaterial({color: '#b79a62', roughness: 0.95, metalness: 0, side: THREE.DoubleSide}),
    glut: new THREE.MeshBasicMaterial({color: '#ff8a2a', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide}),
  }), [m]);
  const ge = rohrGlow;
  setGlow(mats.wand, '#ff7a22', ge * 1.3);
  mats.bohr.map = zuegeTex(glatte < 0.34 ? 0 : glatte < 0.67 ? 1 : 2); mats.bohr.color.set(verschleiss > 0 ? new THREE.Color('#6b6760').lerp(new THREE.Color('#8a4a24'), verschleiss * 0.8) : '#6b6760');
  mats.bohr.emissive.set(verschleiss > 0 ? '#ff5a10' : '#4a463e'); mats.bohr.emissiveIntensity = verschleiss > 0 ? 0.3 + verschleiss * 0.5 : 0.55;
  for (const k of [mats.wand, mats.bohr]) { k.clippingPlanes = schnitt ? [plane] : null; k.clipShadows = true; setOpa(k, sichtbar); }
  mats.pulver.clippingPlanes = schnitt ? [plane] : null; mats.glut.clippingPlanes = schnitt ? [plane] : null;
    const beutel = useMemo(() => Array.from({length: 4}), []);
  const bBis = (pulverEnde ?? granateS) - 0.05, bVon = Math.max(0.2, bBis - ladung), bl = (bBis - bVon) / beutel.length;
  return (
    <group position={position} rotation={[0, 0, elev * RAD]}>
      <mesh geometry={aus} material={mats.wand} castShadow receiveShadow />
      <mesh geometry={bohr} material={mats.bohr} />
      {granate !== 'keine' && <group position={[granateS, 0, 0]}><GranateG granate={granate} schnitt={schnitt} clip={plane} /></group>}
      {pulver > 0 && beutel.map((_, i) => {
        const sicht = zwischen(pulver * beutel.length, i, i + 1);
        return sicht > 0 ? <mesh key={i} material={mats.pulver} position={[bVon + bl * (i + 0.5), 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.37, 0.37, bl * 0.94 * sicht, 24, 1, false]} /></mesh> : null;
      })}
      {glut > 0 && <mesh material={mats.glut} position={[bVon + (bBis - bVon) * glut * 0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 1]}>
        <cylinderGeometry args={[0.39, 0.39, Math.max(0.01, (bBis - bVon) * glut), 24, 1, false]} /></mesh>}
      {druck > 0 && <Gas von={0.12} bis={Math.max(0.3, gasBis ?? granateS - 0.02)} radius={0.39} druck={druck} t={t} schnitt={schnitt ? plane : null} />}
    </group>
  );
};

// ---------- Granaten (Betongranate 7,1 t / Sprenggranate 4,8 t), Achse +x, Boden bei x = 0 ----------
const granProfil = (typ: 'beton' | 'spreng'): P2 => {
  const L = GRN[typ].L, r = 0.4, og = typ === 'beton' ? 1.9 : 1.6, pts: P2 = [[0, 0], [0, r * 0.9], [0.05, r * 0.99], [0.12, r]];
  pts.push([L - og, r]);
  for (let i = 1; i <= 14; i++) { const u = i / 14; pts.push([L - og + og * u, r * Math.sqrt(Math.max(0, 1 - Math.pow(u, 1.75))) * (1 - 0.1 * u)]); }
  pts[pts.length - 1] = [L, 0];
  return pts;
};
export const GranateG: React.FC<{granate?: 'beton' | 'spreng'; schnitt?: boolean; clip?: THREE.Plane | null; mantelGlow?: number; hoehleGlow?: number; position?: V3; rotation?: V3; skala?: number; sichtbar?: number; dunkel?: boolean}> =
  ({granate = 'beton', schnitt = false, clip = null, mantelGlow = 0, hoehleGlow = 0, position = [0, 0, 0], rotation = [0, 0, 0], skala = 1, sichtbar = 1, dunkel = false}) => {
  const p1 = usePbr('metal_plate', 3.0, true);
  const L = GRN[granate].L;
  const ownPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, -1), 0), []);
  const clipP = clip ?? (schnitt ? ownPlane : null);
  const g = useMemo(() => drehkoerper(granProfil(granate), 72, true), [granate]);
  const band = useMemo(() => drehkoerper([[0.62, 0.4], [0.62, 0.418], [1.0, 0.418], [1.0, 0.4]], 56, true), []);
  const hoehle = useMemo(() => {
    const hl = granate === 'beton' ? 1.7 : 1.9, hr = granate === 'beton' ? 0.17 : 0.27, s0 = 0.5;
    return drehkoerper([[s0, 0], [s0, hr], [s0 + hl, hr], [s0 + hl, 0]], 40, true);
  }, [granate]);
  const mats = useMemo(() => ({
    hull: stahl({farbe: dunkel ? '#2a2d30' : '#8d949a', pbr: {...p1, map: undefined}, rauh: 0.55, metall: 0.3, kappe: '#c7c1ae'}),
    band: new THREE.MeshStandardMaterial({color: '#b0703f', roughness: 0.35, metalness: 0.9}),
    hoehle: new THREE.MeshStandardMaterial({color: '#e0b020', emissive: '#e8a010', emissiveIntensity: 0.6, roughness: 0.8, side: THREE.DoubleSide}),
  }), [p1, dunkel]);
  setGlow(mats.hull, '#f2c14e', mantelGlow * 1.5); setGlow(mats.hoehle, '#ffb020', 0.5 + hoehleGlow * 2.2);
  for (const k of [mats.hull, mats.hoehle, mats.band]) { k.clippingPlanes = clipP ? [clipP] : null; setOpa(k, sichtbar); }
  return (
    <group position={position} rotation={rotation} scale={skala} visible={sichtbar > 0.01}>
      <mesh geometry={g} material={mats.hull} castShadow receiveShadow />
      <mesh geometry={band} material={mats.band} castShadow />
      {(schnitt || hoehleGlow > 0) && <mesh geometry={hoehle} material={mats.hoehle} rotation={[0, 0, 0]} />}
    </group>
  );
};
export const granateLaenge = (t: 'beton' | 'spreng') => GRN[t].L;

// ---------- Gleis (2 Gleise = 4 Schienen S49), Lastwagen-/Zugbausteine ----------
const schieneGeo = (L: number) => geo('schiene' + L, () => {
  const h = 0.0625, p: P2 = [[-h, 0], [h, 0], [h, 0.014], [0.0225, 0.03], [0.007, 0.05], [0.007, 0.1], [0.0335, 0.115], [0.0335, 0.149], [-0.0335, 0.149], [-0.0335, 0.115], [-0.007, 0.1], [-0.007, 0.05], [-0.0225, 0.03], [-h, 0.014]];
  const sh = new THREE.Shape(p.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(sh, {depth: L, bevelEnabled: false}); g.rotateY(Math.PI / 2);
  g.translate(-L / 2, 0, 0);
  return nb(g);
});
const schwellenGeo = (L: number) => geo('schwellen' + L, () => {
  const t: THREE.BufferGeometry[] = [];
  for (let x = -L / 2 + 0.3; x < L / 2; x += 0.6) { const b = new THREE.BoxGeometry(0.26, 0.2, 2.6); b.translate(x, 0.0, 0); t.push(nb(b)); }
  return mergeGeometries(t)!;
});
export const Gleis: React.FC<{laenge?: number; zentren?: number[]; glow?: number; cor?: string; sichtbar?: number; position?: V3; rot?: number; bisX?: number}> =
  ({laenge = 80, zentren = [-G.zSpur, G.zSpur], glow = 0, cor = '#5ec8e5', sichtbar = 1, position = [0, 0, 0], rot = 0, bisX}) => {
  const p1 = usePbr('metal_plate', 3.0, true);
  const mats = useMemo(() => ({
    schiene: new THREE.MeshStandardMaterial({color: '#6a6056', roughness: 0.45, metalness: 0.85, map: p1.map}),
    schwelle: new THREE.MeshStandardMaterial({color: '#4b4036', roughness: 0.95}),
    kies: new THREE.MeshStandardMaterial({map: kiesTex().clone(), roughness: 1, color: '#9a9488'}),
    leucht: new THREE.MeshBasicMaterial({color: cor, toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false}),
  }), [p1, cor]);
  mats.leucht.opacity = glow; mats.leucht.color.set(rot > 0 ? '#ff3a2a' : cor);
  const clipX = useMemo(() => new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0), []);
  clipX.constant = (bisX ?? 1e9) - position[0];
  for (const mt of Object.values(mats)) (mt as THREE.Material).clippingPlanes = bisX === undefined ? null : [clipX];
  mats.kies.map!.repeat.set(laenge / 3, 1.4); mats.kies.map!.needsUpdate = true;
  return (
    <group position={position} visible={sichtbar > 0.01}>
      {zentren.map((zc, i) => (
        <group key={i} position={[0, 0, zc]}>
          <mesh position={[0, 0.14, 0]} receiveShadow material={mats.kies}><boxGeometry args={[laenge, 0.28, 4.4]} /></mesh>
          <mesh geometry={schwellenGeo(laenge)} material={mats.schwelle} position={[0, 0.3, 0]} receiveShadow />
          {[-G.spur / 2, G.spur / 2].map((z) => <mesh key={z} geometry={schieneGeo(laenge)} material={mats.schiene} position={[0, 0.4, z]} castShadow receiveShadow />)}
          {glow > 0.01 && [-G.spur / 2, G.spur / 2].map((z) => <mesh key={'g' + z} position={[0, 0.58, z]} material={mats.leucht}><boxGeometry args={[laenge, 0.07, 0.2]} /></mesh>)}
        </group>
      ))}
    </group>
  );
};

// ---------- Maßstab: Kleinwagen (~1,4 t), vierstöckiges Haus (Drahtgitter), Kranportal ----------
const kleinGeo = () => geo('klein', () => {
  const t: THREE.BufferGeometry[] = [];
  t.push(bx(3.7, 0.7, 1.62, 0, 0.62, 0), bx(2.0, 0.55, 1.5, -0.1, 1.2, 0), bx(0.9, 0.3, 1.5, 1.25, 0.9, 0));
  for (const x of [-1.15, 1.2]) for (const z of [-0.78, 0.78]) t.push(zyl(0.29, 0.2, 'z', x, 0.29, z, 18));
  return vereine(t);
});
export const Kleinwagen: React.FC<{n?: number; abstand?: number; farben?: string[]; position?: V3; gier?: number; skala?: number; reihe?: number}> =
  ({n = 1, abstand = 2.6, farben = ['#8a2f2a', '#3b5a78', '#c9c2ae', '#4d6a46', '#a97d2a'], position = [0, 0, 0], gier = 0, skala = 1}) => {
  const g = kleinGeo();
  const mats = useMemo(() => farben.map((c) => new THREE.MeshStandardMaterial({color: c, roughness: 0.4, metalness: 0.5})), [farben.join()]);   // eslint-disable-line
  const gl = useMemo(() => new THREE.MeshStandardMaterial({color: '#1c2228', roughness: 0.2, metalness: 0.6}), []);
  return (
    <group position={position} rotation={[0, gier * RAD, 0]} scale={skala}>
      {mats.map((mt, i) => {
        const u = glatt(Math.max(0, Math.min(1, n - i)));
        if (u <= 0.001) return null;
        return <group key={i} position={[(1 - u) * 14, 0, i * abstand]} rotation={[0, (1 - u) * 0.3, 0]}>
          <mesh geometry={g} material={mt} castShadow receiveShadow />
          <mesh position={[-0.1, 1.2, 0]} material={gl}><boxGeometry args={[1.9, 0.38, 1.54]} /></mesh>
        </group>;
      })}
    </group>
  );
};
export const Haus4: React.FC<{position?: V3; wire?: number; breite?: number; tiefe?: number; geschosse?: number; hoehe?: number}> = ({position = [0, 0, 0], wire = 1, breite = 18, tiefe = 10, geschosse = 4, hoehe = 12}) => {
  const lin = useMemo(() => {
    const t: THREE.BufferGeometry[] = [];
    const b = new THREE.BoxGeometry(breite, hoehe, tiefe); b.translate(0, hoehe / 2, 0); t.push(new THREE.EdgesGeometry(b));
    const h = hoehe / geschosse;
    for (let i = 1; i < geschosse; i++) { const e = new THREE.BoxGeometry(breite, 0.02, tiefe); e.translate(0, i * h, 0); t.push(new THREE.EdgesGeometry(e)); }
    for (let i = 0; i < geschosse; i++) for (let j = 0; j < 6; j++) { const f = new THREE.BoxGeometry(1.5, 1.3, 0.05); f.translate(-breite / 2 + (j + 0.5) * (breite / 6), i * h + h * 0.55, tiefe / 2 + 0.03); t.push(new THREE.EdgesGeometry(f)); }
    return mergeGeometries(t as any)!;
  }, [breite, tiefe, geschosse, hoehe]);
  return (
    <group position={position}>
      <mesh position={[0, hoehe / 2, 0]}><boxGeometry args={[breite, hoehe, tiefe]} /><meshBasicMaterial color="#5ec8e5" transparent opacity={0.08 * wire} depthWrite={false} toneMapped={false} /></mesh>
      <lineSegments geometry={lin}><lineBasicMaterial color="#9fe3f5" transparent opacity={0.8 * wire} toneMapped={false} depthWrite={false} /></lineSegments>
    </group>
  );
};

// Montage-Portalkran (zwei Beine auf Schienen beiderseits der Grube, Fahrbalken, Laufkatze + Haken)
export const Portal: React.FC<{position?: V3; spann?: number; hoehe?: number; katzeX?: number; hakenY?: number; last?: boolean; gier?: number}> = ({position = [0, 0, 0], spann = 14, hoehe = 15, katzeX = 0, hakenY = 8, gier = 0}) => {
  const m = useMemo(() => new THREE.MeshStandardMaterial({color: '#8a6d3a', roughness: 0.6, metalness: 0.55}), []);
  const dk = useMemo(() => new THREE.MeshStandardMaterial({color: '#2b2d2f', roughness: 0.6, metalness: 0.5}), []);
  const g = useMemo(() => {
    const t: THREE.BufferGeometry[] = [], z = spann / 2;
    for (const s of [-1, 1]) {
      t.push(strebe([-2.2, 0.5, s * z], [0, hoehe, s * z], 0.22), strebe([2.2, 0.5, s * z], [0, hoehe, s * z], 0.22), bx(5.6, 0.5, 0.9, 0, 0.4, s * z), strebe([-2.0, 4.0, s * z], [2.0, 4.0, s * z], 0.1));
      for (const x of [-2.2, 2.2]) t.push(zyl(0.35, 0.3, 'z', x, 0.35, s * z, 14));
    }
    t.push(bx(1.2, 1.2, spann + 2, 0, hoehe + 0.2, 0), bx(0.6, 0.5, spann + 2.6, 0, hoehe + 1.0, 0));
    return vereine(t);
  }, [spann, hoehe]);
  const seilL = Math.max(0.2, hoehe - hakenY);
  return (
    <group position={position} rotation={[0, gier * RAD, 0]}>
      <mesh geometry={g} material={m} castShadow receiveShadow />
      <group position={[0, hoehe + 0.2, katzeX]}>
        <mesh material={dk} castShadow><boxGeometry args={[1.6, 0.9, 2.2]} /></mesh>
        <mesh material={dk} position={[0, -seilL / 2, 0]}><cylinderGeometry args={[0.04, 0.04, seilL, 6]} /></mesh>
        <mesh material={dk} position={[0, -seilL - 0.25, 0]} castShadow><boxGeometry args={[0.5, 0.5, 0.5]} /></mesh>
      </group>
    </group>
  );
};

// Flachwagen (Rs-Typ ≈ 19 m), eine Geometrie
const flachGeo = () => geo('flach', () => {
  const t: THREE.BufferGeometry[] = [];
  t.push(bx(19, 0.4, 2.8, 0, 1.25, 0), bx(18.6, 0.1, 2.9, 0, 1.5, 0));
  for (const x of [-6.5, 6.5]) { t.push(bx(3.6, 0.3, 1.9, x, 0.85, 0)); for (const d of [-0.9, 0.9]) for (const z of [-0.72, 0.72]) t.push(zyl(0.46, 0.12, 'z', x + d, 0.46, z, 18)); }
  for (const x of [-9.7, 9.7]) for (const z of [-0.85, 0.85]) t.push(zyl(0.16, 0.14, 'x', x, 1.2, z, 10));
  return vereine(t);
});
export const Flachwagen: React.FC<{position?: V3; farbe?: string; gier?: number}> = ({position = [0, 0, 0], farbe = '#4a4741', gier = 0}) => {
  const m = useMemo(() => new THREE.MeshStandardMaterial({color: farbe, roughness: 0.8, metalness: 0.4}), [farbe]);
  return <mesh geometry={flachGeo()} material={m} position={position} rotation={[0, gier * RAD, 0]} castShadow receiveShadow />;
};

// Hervorhebungsring (Torus) um die Rohrachse (Achse +x des Elternrahmens, mit elev gedreht), f(sichtbar)
export const Anel: React.FC<{position?: V3; raio?: number; cor?: string; sichtbar?: number; elev?: number; dicke?: number}> = ({position = [0, 0, 0], raio = 0.7, cor = '#f2c14e', sichtbar = 1, elev = 0, dicke = 0.045}) => (
  sichtbar > 0.01 ? <group position={position} rotation={[0, 0, elev * RAD]}><mesh rotation={[0, Math.PI / 2, 0]} scale={1 + 0.06 * Math.sin(sichtbar * 6)}>
    <torusGeometry args={[raio, dicke, 10, 64]} /><meshBasicMaterial color={cor} transparent opacity={Math.min(1, sichtbar)} toneMapped={false} depthTest={false} /></mesh></group> : null
);

// Krabbelnde Figur (Silhouette, 1,80-m-Mensch auf allen Vieren, Blick +x); lauf = zurückgelegte Strecke (m) steuert den Gang
const Glied: React.FC<{a: V3; b: V3; r: number; mat: THREE.Material}> = ({a, b, r, mat}) => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 0.01;
  const q = new THREE.Quaternion().setFromUnitVectors(vec(0, 1, 0), vec(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize());
  return <mesh material={mat} position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} quaternion={q} castShadow><capsuleGeometry args={[r, Math.max(0.01, L - 2 * r), 3, 8]} /></mesh>;
};
export const Kriecher: React.FC<{position?: V3; ry?: number; lauf?: number; skala?: number; farbe?: string; sichtbar?: number}> = ({position = [0, 0, 0], ry = 0, lauf = 0, skala = 1, farbe = '#8d959b', sichtbar = 1}) => {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({color: farbe, roughness: 0.9}), [farbe]);
  const w = lauf * 5.2, s1 = Math.sin(w), s2 = Math.sin(w + Math.PI);
  const y0 = 0.62;
  const arm = (z: number, s: number): [V3, V3, V3] => [[0.3, y0 - 0.02, z], [0.3 + 0.2 * s + 0.12, y0 - 0.3, z * 1.1], [0.3 + 0.38 * s + 0.2, 0.04, z * 1.1]];
  const bein = (z: number, s: number): [V3, V3, V3] => [[-0.32, y0 - 0.06, z], [-0.5 + 0.22 * s, y0 - 0.3, z * 1.3], [-0.5 + 0.34 * s - 0.28, 0.09, z * 1.3]];
  const gl = [arm(0.22, s1), arm(-0.22, s2), bein(0.13, s2), bein(-0.13, s1)];
  return (
    <group position={[position[0] - lauf, position[1], position[2]]} rotation={[0, ry, 0]} scale={skala} visible={sichtbar > 0.01}>
      <Glied a={[-0.34, y0 - 0.04, 0]} b={[0.34, y0 + 0.02, 0]} r={0.17} mat={mat} />
      <mesh material={mat} position={[0.56, y0 + 0.06, 0]} castShadow><sphereGeometry args={[0.115, 12, 8]} /></mesh>
      {gl.map((g, i) => <React.Fragment key={i}><Glied a={g[0]} b={g[1]} r={0.06} mat={mat} /><Glied a={g[1]} b={g[2]} r={0.052} mat={mat} /></React.Fragment>)}
    </group>
  );
};
