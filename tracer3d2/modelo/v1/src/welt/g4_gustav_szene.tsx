// =====================================================================================================================
// g4_gustav_szene.tsx — Bausteine der Freiluft-Szenen des Videos 4 (Schwerer Gustav): Gelände mit Einschnitt (Aushub als f(p)),
// Schnittwand mit Gesteinsschichten, Licht nach Tageszeit, Zahlen-Overlays, Maschinen, Flak, Netze, Zäune, Jagdflugzeuge, Menschenmengen.
// Alles Funktion der Props (t kommt von außen), Zufall nur mit festen Samen. Keine Hoheitszeichen, keine Beschriftung auf Fahrzeugen.
//
// Koordinaten wie g4_gustav_modell: x = Gleisachse (Schussrichtung), y oben (0 = Gleisbett-Sohle), z seitlich; Einschnitt 10 m tief, 200 m lang
// (fakten.md §5: „10 m Tiefe, ~200 m Breite“ — die Breite 200 m ist hier die Länge entlang der Gleise, im Längsschnitt gesehen).
// =====================================================================================================================
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {Bild} from './f_szene';
import {KamDef, V3, HimmelDef} from './t_szene';
import {fahrt} from './f_gelaende';
import {Perfil} from '../look/Look';
import {C, F, fase, sichtbar} from '../ui/basis';
import {bx, zyl, vereine} from './m_moerser';
import {Leute, Figur, Pose} from './m_transport';
import {stab} from './t_geschuetz';
import {wortLokal} from '../tempo';
import {Stoss, ATLAS, StossTeil} from './t_vfx';
import {Gustav, GustavProps, Gleis} from './g4_gustav_modell';

export const W = (b: {s: number; kap: string}, w: string, nach = 0, dflt = 0) => { try { return wortLokal(b, w, nach); } catch { return dflt; } };
const nb = (g: THREE.BufferGeometry) => (g.index ? g.toNonIndexed() : g);
const sm = (a: number, b: number, x: number) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const h2 = (x: number, y: number) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
const vnoise = (x: number, y: number) => {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return h2(ix, iy) * (1 - u) * (1 - v) + h2(ix + 1, iy) * u * (1 - v) + h2(ix, iy + 1) * (1 - u) * v + h2(ix + 1, iy + 1) * u * v;
};
export const fbm = (x: number, y: number) => { let a = 0.5, s = 0, f = 1; for (let i = 0; i < 4; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; } return s; };

// ---------- Kamera ----------
export type KamKey = {t: number; pos: V3; ziel: V3; fov?: number};
export const kam = (keys: KamKey[], t: number, opt: {near?: number; far?: number; shake?: V3; roll?: number} = {}): KamDef => {
  const f = fahrt(keys as any, t), s = opt.shake ?? [0, 0, 0];
  return {pos: [f.pos[0] + s[0], f.pos[1] + s[1], f.pos[2] + s[2]], ziel: f.ziel as V3, fov: f.fov, near: opt.near ?? 0.3, far: opt.far ?? 9000, roll: opt.roll};
};
export const shake = (t: number, t0: number, amp = 0.6, abkl = 4.5): V3 => {
  if (t < t0) return [0, 0, 0];
  const a = amp * Math.exp(-(t - t0) * abkl), u = t - t0;
  return [Math.sin(u * 61) * a * 0.5, Math.sin(u * 47 + 1) * a, Math.sin(u * 53 + 2) * a * 0.5];
};

// ---------- Gelände ----------
export const TR = {halbL: 100, fw: 50, slope: 5.0, tiefe: 10};   // Sohle 100 m breit, Böschung 1:5, oben ≈ 200 m breit, 10 m tief, ≈ 200 m lang (Hügelrücken quer zu den Gleisen)
export const surf = (x: number, z: number) => {
  const hill = 10.2 * Math.exp(-Math.pow(x / 74, 2)) * Math.exp(-Math.pow(z / 300, 2)) + 1.0;
  const amp = 2.2 * sm(30, 220, Math.abs(z)) + 1.2 * sm(90, 300, Math.abs(x));
  const n = (fbm(x / 95 + 7, z / 95 + 3) - 0.5) * 2 * amp + (fbm(x / 23, z / 23) - 0.5) * 0.9;
  const fern = 26 * sm(520, 1500, Math.abs(z)) * fbm(x / 520 + 2, z / 520 + 9) + 16 * sm(700, 1800, Math.abs(x)) * fbm(x / 480 + 5, z / 480);
  return Math.max(0.4, hill + n + fern);
};
const cutProfile = (z: number) => Math.max(0, (Math.abs(z) - TR.fw) / TR.slope);
// p = Aushub 0..1 (Zeitraffer: wandert von x = -L bis +L)
export const hoehe = (x: number, z: number, p: number, flach = false) => {
  if (flach) { const f = (fbm(x / 140 + 4, z / 140) - 0.5) * 2.4 + (fbm(x / 26, z / 26) - 0.5) * 0.5 + 0.6; return {h: f, s: f, cut: 0}; }
  const s = surf(x, z), cut = Math.max(0, s - cutProfile(z)), u = Math.min(1, Math.max(0, (x + TR.halbL) / (2 * TR.halbL)));
  const pl = Math.min(1, Math.max(0, p * 1.7 - 0.7 * u));
  const abraum = pl * 2.4 * Math.exp(-Math.pow((Math.abs(z) - TR.fw - TR.slope * TR.tiefe - 14) / 9, 2)) * Math.exp(-Math.pow(x / 120, 2));
  return {h: s - pl * cut + abraum, s, cut: pl * cut};
};
const GN = {x: 300, z: 220}, GA = {x: 2300, z: 1700}, GK = 5;
const warp = (u: number, A: number) => A * Math.sinh(GK * u) / Math.sinh(GK);
const GX = Array.from({length: GN.x + 1}, (_, i) => warp((i / GN.x) * 2 - 1, GA.x)), GZ = Array.from({length: GN.z + 1}, (_, i) => warp((i / GN.z) * 2 - 1, GA.z));
const steppe = (x: number, z: number): [number, number, number] => {
  const n = fbm(x / 60 + 11, z / 60), m = fbm(x / 9, z / 9 + 4);
  const a = [0.22, 0.20, 0.09], b = [0.34, 0.29, 0.13], c = [0.17, 0.19, 0.08];
  const k1 = sm(0.3, 0.7, n), k2 = sm(0.4, 0.8, m) * 0.5;
  return [0, 1, 2].map((i) => lerp(lerp(a[i], b[i], k1), c[i], k2)) as [number, number, number];
};
const detailTex = (() => { let t: THREE.CanvasTexture | null = null; return () => {
  if (t) return t;
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d')!; c.fillStyle = '#b8b8b8'; c.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) { const g = 120 + h2(i, 3) * 120; c.fillStyle = `rgb(${g},${g},${g})`; c.fillRect(h2(i, 5) * 256, h2(i, 7) * 256, 1 + h2(i, 9) * 3, 1 + h2(i, 2) * 2); }
  t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace; return t; }; })();

export const Gelaende: React.FC<{p?: number; xc?: number | null; nass?: number; flach?: boolean}> = ({p = 1, xc = null, nass = 0, flach = false}) => {
  const pq = Math.round(p * 160) / 160;
  const geom = useMemo(() => {
    const nx = GN.x + 1, nz = GN.z + 1, pos = new Float32Array(nx * nz * 3), col = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = GX[i], z = GZ[j], k = j * nx + i, r = hoehe(x, z, pq, flach);
      const rand = (i === 0 || j === 0 || i === GN.x || j === GN.z);
      pos[k * 3] = x; pos[k * 3 + 1] = rand ? r.h - 6 : r.h; pos[k * 3 + 2] = z; uv[k * 2] = x / 6; uv[k * 2 + 1] = z / 6;
      let c = steppe(x, z);
      if (r.cut > 0.06) {                                                  // frisch angeschnitten: Kalkstein + dunkle Erde
        const tiefe = Math.min(1, r.cut / 9), kalk = [0.52, 0.47, 0.36], erde = [0.17, 0.12, 0.08], schicht = 0.5 + 0.5 * Math.sin(r.h * 1.9 + fbm(x / 30, z / 30) * 5);
        const base = [0, 1, 2].map((q) => lerp(erde[q], kalk[q], sm(0.1, 0.8, tiefe * 0.6 + schicht * 0.5))); const frisch = sm(0.05, 0.6, r.cut);
        c = [0, 1, 2].map((q) => lerp(c[q], base[q], frisch)) as [number, number, number];
        if (r.h < 0.35) c = [0.24, 0.21, 0.17];                              // Sohle: Schotterbett
      } else if (Math.abs(z) < TR.fw + 4 && Math.abs(x) < TR.halbL + 60) c = [c[0] * 0.85, c[1] * 0.82, c[2] * 0.75];
      col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
    }
    const idx = new Uint32Array(GN.x * GN.z * 6); let q = 0;
    for (let j = 0; j < GN.z; j++) for (let i = 0; i < GN.x; i++) { const a = j * nx + i, b = a + 1, c2 = a + nx, d = c2 + 1; idx.set([a, c2, b, b, c2, d], q); q += 6; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals(); g.computeBoundingSphere(); return g;
  }, [pq, flach]);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({vertexColors: true, map: detailTex(), roughness: 1, metalness: 0}), []);
  plane.constant = xc ?? 0; mat.clippingPlanes = xc === null ? null : [plane]; mat.roughness = 1 - 0.3 * nass;
  return <mesh geometry={geom} material={mat} receiveShadow castShadow={false} frustumCulled={false} />;
};

// Schnittwand (Querschnitt durch den Hügel) bei x = xc, von z0 bis z1; Blick von +x
export const Schnittwand: React.FC<{xc: number; z0?: number; z1?: number; p?: number}> = ({xc, z0 = -230, z1 = 230, p = 1}) => {
  const geom = useMemo(() => {
    const NZ = 300, NY = 64, pos: number[] = [], col: number[] = [], idx: number[] = [];
    for (let i = 0; i <= NZ; i++) {
      const z = lerp(z0, z1, i / NZ), top = hoehe(xc, z, p).h, bot = -26;
      for (let j = 0; j <= NY; j++) {
        const y = lerp(bot, top, j / NY), d = top - y;
        pos.push(xc, y, z);
        let c: number[];
        if (d < 0.8) c = [0.16, 0.11, 0.07];
        else {
          const band = Math.sin(d * 2.4 + fbm(z / 35, d / 2.5) * 6) + 0.6 * Math.sin(d * 5.3 + z * 0.03), basis = d < 3.4 ? [0.47, 0.35, 0.22] : d < 15 ? [0.74, 0.70, 0.58] : [0.58, 0.54, 0.45];
          const k = 0.86 + 0.12 * band + (fbm(z / 6, d * 1.3) - 0.5) * 0.18; c = basis.map((q) => q * k);
        }
        col.push(c[0], c[1], c[2]);
      }
    }
    for (let i = 0; i < NZ; i++) for (let j = 0; j < NY; j++) { const a = i * (NY + 1) + j, b = a + 1, c2 = a + NY + 1, d = c2 + 1; idx.push(a, c2, b, b, c2, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals(); return g;
  }, [xc, z0, z1, p]);
  return <mesh geometry={geom} receiveShadow><meshStandardMaterial vertexColors roughness={0.95} metalness={0} side={THREE.DoubleSide} /></mesh>;
};

// ---------- Licht nach Tageszeit ----------
export type Licht = {sonne: {azimut: number; hoehe: number; staerke: number; farbe: string} | null; himmel: HimmelDef; hemi: [string, string, number]; perfil: Perfil; env: number};
const mixC = (a: string, b: string, u: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), Math.min(1, Math.max(0, u))).getHexString();
// h = Stunde 0..24 (Sonne: 6 Uhr Aufgang, 18 Uhr Untergang); nebel = Dichte pro m
export const lichtFuer = (h: number, nebel = 1 / 900, dunst = 0): Licht => {
  const he = 58 * Math.sin(Math.PI * (h - 6) / 12), tag = sm(2, 22, he), daemmer = sm(-8, 6, he) * (1 - tag);
  const nacht = '#05070d', nachtH = '#141b28', daem = '#52618a', daemH = '#f0aa72', dayZ = '#6f8fb5', dayH = '#c9ccc4';
  const zenit = mixC(mixC(nacht, daem, sm(-10, 4, he)), dayZ, tag), horizont = mixC(mixC(nachtH, daemH, sm(-10, 3, he)), dayH, tag);
  const az = 90 + (h - 6) * 15, sonnenFarbe = mixC('#ff9a50', '#fff0dc', tag);
  const sonne = he > -3 ? {azimut: az, hoehe: Math.max(2, he), staerke: 3.4 * sm(-3, 9, he), farbe: sonnenFarbe} : {azimut: 250, hoehe: 38, staerke: 0.7, farbe: '#8aa2cf'};
  return {
    sonne: he > -3 ? sonne : sonne,
    himmel: {zenit, horizont, boden: mixC('#0c0e12', '#5a5446', Math.max(tag, daemmer * 0.6)), sonne: [0.5, 0.2, 0.5], sonnenFarbe, hof: he > 0 ? 1.1 : 0},
    hemi: [mixC('#3a4766', '#a9b8cc', Math.max(tag, daemmer)), mixC('#14161c', '#4a4030', Math.max(tag, daemmer)), lerp(0.5, 0.8, Math.max(tag, daemmer))],
    perfil: {ao: false, bloom: lerp(0.9, 0.5, tag), limiar: 0.82, vinheta: 0.5, saturacao: -0.1, contraste: 0.06, raios: 0,
      nevoa: {cor: mixC(mixC('#10141c', '#d4b090', daemmer), '#cfcdc2', tag), densidade: nebel * (1 + 3 * dunst), max: 0.88}},
    env: lerp(0.18, 0.4, Math.max(tag, daemmer)),
  };
};

export const Welt: React.FC<{k: KamDef; licht: Licht; perfil?: Perfil; mitte?: V3; radius?: number; schatten?: boolean; children?: React.ReactNode}> =
  ({k, licht, perfil, mitte = [0, 3, 0], radius = 120, schatten = true, children}) => (
  <Bild kam={k} perfil={perfil ?? licht.perfil} sonne={licht.sonne} himmel={licht.himmel} env={licht.env} hemi={licht.hemi} schatten={schatten} mitte={mitte} radius={radius} clipping>
    {children}
  </Bild>
);

// ---------- Overlays (HTML) ----------
const fmt = (n: number, d = 0) => n.toLocaleString('de-DE', {minimumFractionDigits: d, maximumFractionDigits: d});
export const Zahl: React.FC<{t: number; em: number; dur?: number; von?: number; bis: number; einheit?: string; kopf?: string; d?: number; x?: number | string; y?: number | string; cor?: string; gross?: boolean; ate?: number; rechts?: boolean; prefix?: string}> =
  ({t, em, dur = 1, von = 0, bis, einheit = '', kopf, d = 0, x = 64, y = 64, cor = C.signal, gross = false, ate, rechts = false, prefix = ''}) => {
  const o = sichtbar(t, em, 0.35, ate), v = lerp(von, bis, fase(t, em, em + dur));
  return (
    <div style={{position: 'absolute', ...(rechts ? {right: x} : {left: x}), top: y, opacity: o, transform: `translateY(${(1 - o) * 12}px)`, textAlign: rechts ? 'right' : 'left', pointerEvents: 'none'}}>
      {kopf && <div style={{fontFamily: F.mono, fontSize: 24, letterSpacing: 3, color: C.grau, textShadow: '0 2px 10px rgba(0,0,0,0.9)', textTransform: 'uppercase'}}>{kopf}</div>}
      <div style={{fontFamily: F.titel, fontWeight: 600, fontSize: gross ? 120 : 84, letterSpacing: 2, color: cor, fontVariantNumeric: 'tabular-nums', textShadow: '0 3px 24px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.9)'}}>
        {prefix}{fmt(v, d)}<span style={{fontSize: gross ? 56 : 40, marginLeft: 12, color: C.papier}}>{einheit}</span></div>
    </div>
  );
};
// Licht-/Blitzschleier über dem Bild (warm), f(Intensität 0..1)
export const Schleier: React.FC<{a: number; cor?: string}> = ({a, cor = '255,214,150'}) => a > 0.004
  ? <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse at 50% 45%, rgba(${cor},${Math.min(1, a)}) 0%, rgba(${cor},${Math.min(1, a * 0.7)}) 55%, rgba(${cor},${a * 0.35}) 100%)`}} /> : null;
export const Schwarz: React.FC<{a: number}> = ({a}) => a > 0.003 ? <div style={{position: 'absolute', inset: 0, background: '#000', opacity: a, pointerEvents: 'none'}} /> : null;

// ---------- Menschen ----------
export const POSEN: Pose[] = ['stehen', 'gehen', 'heben', 'schieben', 'buecken', 'tragen', 'kurbeln'];
export const menge = (n: number, seed: number, bereich: {x: [number, number]; z: [number, number]; y?: (x: number, z: number) => number}, t = 0, posen: Pose[] = POSEN): Figur[] =>
  Array.from({length: n}, (_, i) => {
    const x = lerp(bereich.x[0], bereich.x[1], h2(i, seed)), z = lerp(bereich.z[0], bereich.z[1], h2(i, seed + 1));
    const pose = posen[Math.floor(h2(i, seed + 2) * posen.length)];
    return {x, z, y: bereich.y ? bereich.y(x, z) : 0, ry: h2(i, seed + 3) * 6.28, pose, ph: (t * 1.6 + h2(i, seed + 4)) % 1, s: 0.97};
  });
export {Leute};

// ---------- Maschinen ----------
const baggerGeo = () => {
  const t: THREE.BufferGeometry[] = [];
  t.push(bx(5.2, 0.7, 1.0, 0, 0.6, -1.5), bx(5.2, 0.7, 1.0, 0, 0.6, 1.5), bx(3.4, 0.6, 3.0, 0, 1.15, 0));      // Raupen + Unterwagen
  t.push(bx(2.8, 1.8, 2.7, -0.6, 2.2, 0), bx(1.4, 0.4, 2.7, -1.5, 3.3, 0), bx(1.4, 1.0, 2.4, -2.7, 2.0, 0));   // Haus + Kabine + Gegengewicht
  return vereine(t);
};
export const Bagger: React.FC<{position?: V3; gier?: number; arm?: number; farbe?: string}> = ({position = [0, 0, 0], gier = 0, arm = 0, farbe = '#6f6a52'}) => {
  const g = useMemo(baggerGeo, []);
  const m = useMemo(() => new THREE.MeshStandardMaterial({color: farbe, roughness: 0.7, metalness: 0.4}), [farbe]);
  const a1 = 0.55 + 0.35 * Math.sin(arm), a2 = -1.2 + 0.7 * Math.sin(arm * 1.0 + 1.2);
  return (
    <group position={position} rotation={[0, gier, 0]}>
      <mesh geometry={g} material={m} castShadow receiveShadow />
      <group position={[0.9, 2.3, 0]} rotation={[0, 0, a1]}>
        <mesh material={m} position={[3.2, 0, 0]} castShadow><boxGeometry args={[6.4, 0.5, 0.5]} /></mesh>
        <group position={[6.4, 0, 0]} rotation={[0, 0, a2]}>
          <mesh material={m} position={[2.0, 0, 0]} castShadow><boxGeometry args={[4.0, 0.36, 0.36]} /></mesh>
          <mesh material={m} position={[4.1, -0.3, 0]} rotation={[0, 0, -0.6]} castShadow><boxGeometry args={[1.5, 0.9, 1.6]} /></mesh>
        </group>
      </group>
    </group>
  );
};
export {Lkw} from './m_bausteine';

// Flak 8,8 cm (Dreibein-Sockel, Rohr, Schild) und 2 cm (Vierling schlicht); neutral, ohne Abzeichen
const flakGeo = (gross: boolean) => {
  const t: THREE.BufferGeometry[] = [], s = gross ? 1 : 0.5;
  for (let i = 0; i < 3; i++) { const w = (i / 3) * Math.PI * 2; t.push(nb(stab(new THREE.Vector3(0, 0.9 * s, 0), new THREE.Vector3(Math.cos(w) * 2.4 * s, 0.1, Math.sin(w) * 2.4 * s), 0.1 * s + 0.03, 6))); }
  t.push(zyl(0.55 * s + 0.1, 0.9 * s, 'y', 0, 1.0 * s, 0, 14), bx(1.4 * s, 1.0 * s, 0.1, 0.5 * s, 1.9 * s, 0), nb(stab(new THREE.Vector3(0, 2.0 * s, 0), new THREE.Vector3(gross ? 3.6 : 1.6, gross ? 3.9 : 2.5, 0), 0.11 * s + 0.02, 8)));
  return vereine(t);
};
export const Flak: React.FC<{position?: V3; gier?: number; gross?: boolean; farbe?: string}> = ({position = [0, 0, 0], gier = 0, gross = true, farbe = '#5a5d4c'}) => {
  const g = useMemo(() => flakGeo(gross), [gross]);
  const m = useMemo(() => new THREE.MeshStandardMaterial({color: farbe, roughness: 0.7, metalness: 0.4}), [farbe]);
  return <mesh geometry={g} material={m} position={position} rotation={[0, gier, 0]} castShadow />;
};
// Jagdflugzeug als Silhouette (Einmotor, Tiefdecker; keine Abzeichen), Nase +x
export const Jaeger: React.FC<{position?: V3; gier?: number; roll?: number; nick?: number; skala?: number}> = ({position = [0, 0, 0], gier = 0, roll = 0, nick = 0, skala = 1}) => {
  const g = useMemo(() => {
    const t: THREE.BufferGeometry[] = [];
    const rumpf = new THREE.LatheGeometry([[0, 0], [0.45, 0.02], [0.55, 1.2], [0.46, 3.2], [0.26, 5.6], [0.12, 8.4], [0, 8.8]].map(([r, x]) => new THREE.Vector2(r, x)), 14); rumpf.rotateZ(-Math.PI / 2); rumpf.translate(-4.4, 0, 0); t.push(nb(rumpf));
    t.push(bx(1.9, 0.1, 9.8, 0.2, -0.15, 0), bx(1.1, 0.07, 3.6, -3.9, 0.15, 0), bx(1.1, 1.3, 0.07, -4.0, 0.7, 0), bx(0.9, 0.5, 0.7, 0.6, 0.55, 0));
    t.push(zyl(0.12, 0.4, 'x', 4.5, 0, 0, 10), bx(0.06, 1.1, 0.06, 4.55, 0, 0));
    return vereine(t);
  }, []);
  const m = useMemo(() => new THREE.MeshStandardMaterial({color: '#2c3036', roughness: 0.55, metalness: 0.5}), []);
  return <group position={position} rotation={[0, gier, 0]} scale={skala}><group rotation={[roll, 0, nick]}><mesh geometry={g} material={m} castShadow /></group></group>;
};

// Tarnnetz-Fläche (Rechteck, leicht durchhängend, über dem Einschnitt gespannt)
const netzTexG = (() => { let t: THREE.CanvasTexture | null = null; return () => {
  if (t) return t;
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d')!;
  for (let i = 0; i < 700; i++) { const g = h2(i, 11); c.fillStyle = g < 0.4 ? '#3c4630' : g < 0.75 ? '#55503a' : '#2c3324'; c.globalAlpha = 0.85; c.beginPath(); c.ellipse(h2(i, 1) * 256, h2(i, 2) * 256, 4 + h2(i, 3) * 16, 3 + h2(i, 4) * 8, h2(i, 5) * 3, 0, 6.3); c.fill(); }
  t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; }; })();
export const NetzFlaeche: React.FC<{position?: V3; w: number; l: number; sag?: number; gier?: number; anteil?: number}> = ({position = [0, 0, 0], w, l, sag = 1.2, gier = 0, anteil = 1}) => {
  const g = useMemo(() => {
    const nx = 24, nz = 10, pos: number[] = [], uv: number[] = [], idx: number[] = [];
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) { const u = i / nx - 0.5, v = j / nz - 0.5; pos.push(u * l, -sag * (1 - 4 * v * v) * (1 - 4 * u * u * 0.6) + Math.sin(i * 1.7 + j) * 0.12, v * w); uv.push(i * l / nx / 5, j * w / nz / 5); }
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const a = i * (nz + 1) + j, b = a + 1, c2 = a + nz + 1, d = c2 + 1; idx.push(a, c2, b, b, c2, d); }
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); gg.setIndex(idx); gg.computeVertexNormals(); return gg;
  }, [w, l, sag]);
  const m = useMemo(() => new THREE.MeshStandardMaterial({map: netzTexG(), transparent: true, opacity: 0.92, side: THREE.DoubleSide, roughness: 1}), []);
  return <mesh geometry={g} material={m} position={position} rotation={[0, gier, 0]} scale={[Math.max(0.001, anteil), 1, 1]} castShadow />;
};

// Zaun (gestrichelt) als Rechteckzug mit Pfosten; f(zeichne 0..1)
export const Zaun: React.FC<{pts: [number, number][]; y?: (x: number, z: number) => number; zeichne?: number; cor?: string; hoehe?: number}> = ({pts, y = () => 0, zeichne = 1, cor = '#f2c14e', hoehe = 2.4}) => {
  const g = useMemo(() => {
    const t: THREE.BufferGeometry[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.floor(L / 6));
      for (let k = 0; k < n; k++) { const x = lerp(a[0], b[0], k / n), z = lerp(a[1], b[1], k / n); const yy = y(x, z); t.push(bx(0.2, hoehe, 0.2, x, yy + hoehe / 2, z)); const x2 = lerp(a[0], b[0], (k + 0.8) / n), z2 = lerp(a[1], b[1], (k + 0.8) / n);
        t.push(nb(stab(new THREE.Vector3(x, yy + hoehe * 0.85, z), new THREE.Vector3(x2, y(x2, z2) + hoehe * 0.85, z2), 0.04, 4))); }
    }
    return vereine(t);
  }, [JSON.stringify(pts)]);   // eslint-disable-line
  const m = useMemo(() => new THREE.MeshBasicMaterial({color: cor, toneMapped: false}), [cor]);
  return zeichne > 0.01 ? <mesh geometry={g} material={m} /> : null;
};

// ---------- Stellung = Gelände + Gleise + Gustav ----------
export const Stellung: React.FC<{p?: number; xc?: number | null; gleis?: boolean; gleisBis?: number; gustav?: GustavProps | null; nass?: number}> = ({p = 1, xc = null, gleis = true, gleisBis, gustav = null, nass = 0}) => (
  <>
    <Gelaende p={p} xc={xc} nass={nass} />
    {xc !== null && xc < 190 && <Schnittwand xc={xc} p={p} />}
    {gleis && <Gleis laenge={300} bisX={gleisBis} />}
    {gustav && <Gustav position={[0, 0.55, 0]} {...gustav} />}
  </>
);

// Staubwelle (flach, radial) am Boden, einmalig ab t0
export const StaubWelle: React.FC<{p: V3; t0: number; t: number; R?: number; n?: number; seed?: number; cor?: string; groesse?: number; hoch?: number}> = ({p, t0, t, R = 1, n = 48, seed = 1, cor = '#b6a88b', groesse = 16, hoch = 0}) => {
  const teile = useMemo<StossTeil[]>(() => Array.from({length: n}, (_, i) => {
    const w = (i / n) * 6.283 + h2(i, seed) * 0.25, v = (12 + h2(i, seed + 2) * 14) * R;
    return {start: [p[0] + Math.cos(w) * 3, p[1] + 0.8, p[2] + Math.sin(w) * 3] as V3, dir: [Math.cos(w) * v, 1.5 + hoch * 4 * h2(i, seed + 6), Math.sin(w) * v] as V3, t0: t0 + h2(i, seed + 3) * 0.25, leben: 6 + h2(i, seed + 4) * 3, groesse: groesse * (0.7 + h2(i, seed + 5) * 0.7)};
  }), [p[0], p[1], p[2], t0, R, n, seed, groesse, hoch]);   // eslint-disable-line
  return <Stoss atlas={ATLAS.nuvem1} teile={teile} t={t} rauch cor={cor} cor2="#7d7058" forca={0.85} wachs={2.2} brems={0.9} auftrieb={0.5} />;
};

// ---------- Gleisbogen (Kurve) mit Schwellen; zeichne 0..1 lässt die Strecke wachsen ----------
export const Bogen: React.FC<{kurve: THREE.Curve<THREE.Vector3>; offs?: number[]; zeichne?: number; y?: (x: number, z: number) => number; cor?: string; schritt?: number; breit?: number}> =
  ({kurve, offs = [0], zeichne = 1, y = () => 0, cor, schritt = 2.0, breit = 1}) => {
  const L = kurve.getLength(), n = Math.max(2, Math.floor(L / schritt));
  const {geom, pro} = useMemo(() => {
    const t: THREE.BufferGeometry[] = [], tmp = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const u = i / n, u2 = (i + 1.02) / n, a = kurve.getPointAt(u), b = kurve.getPointAt(Math.min(1, u2)), dir = tmp.clone().subVectors(b, a); dir.y = 0; const len = dir.length() || 1, ang = Math.atan2(-dir.z, dir.x);
      for (const o of offs) {
        const nx = -dir.z / len, nz = dir.x / len, cx = (a.x + b.x) / 2 + nx * o, cz = (a.z + b.z) / 2 + nz * o, cy = y(cx, cz);
        const mk = (w: number, h: number, d: number, ox: number, oy: number, oz: number) => { const g = new THREE.BoxGeometry(w, h, d).toNonIndexed(); g.rotateY(ang); g.translate(cx + nx * oz, cy + oy, cz + nz * oz); return g; };
        t.push(mk(len, 0.16 * breit, 0.1 * breit, 0, 0.45, -0.7175), mk(len, 0.16 * breit, 0.1 * breit, 0, 0.45, 0.7175), mk(0.3 * breit, 0.18, 2.6, 0, 0.2, 0));
      }
    }
    const g = mergeGeometries(t.map((q) => { q.deleteAttribute('uv'); q.deleteAttribute('normal'); return q; }) as any)!; g.computeVertexNormals();
    return {geom: g, pro: 3 * offs.length * 36};
  }, [kurve, n, offs.join(), breit]);   // eslint-disable-line
  geom.setDrawRange(0, Math.floor(Math.min(1, Math.max(0, zeichne)) * n) * pro);
  const m = useMemo(() => new THREE.MeshStandardMaterial({color: cor ?? '#5a5148', roughness: 0.6, metalness: 0.6, emissive: cor ?? '#000000', emissiveIntensity: cor ? 0.8 : 0}), [cor]);
  return <mesh geometry={geom} material={m} frustumCulled={false} receiveShadow />;
};

// ---------- Zug (Wagen entlang einer Kurve) ----------
const wagenGeo = (art: 'lok' | 'gedeckt' | 'flach' | 'rohr') => {
  const t: THREE.BufferGeometry[] = [];
  if (art === 'lok') { t.push(bx(16, 3.4, 3.1, 0, 2.6, 0), bx(4.5, 1.4, 2.6, -5.2, 5.0, 0), bx(1.0, 1.0, 2.0, 6.3, 4.6, 0), bx(18, 0.5, 2.4, 0, 0.9, 0)); for (const x of [-6, -2, 2, 6]) for (const z of [-0.72, 0.72]) t.push(zyl(0.55, 0.14, 'z', x, 0.55, z, 14)); }
  else if (art === 'gedeckt') { t.push(bx(17, 2.8, 2.8, 0, 2.5, 0), bx(17.4, 0.25, 3.0, 0, 4.0, 0), bx(18.6, 0.4, 2.7, 0, 1.0, 0)); for (const x of [-6, 6]) for (const d of [-0.9, 0.9]) for (const z of [-0.72, 0.72]) t.push(zyl(0.46, 0.12, 'z', x + d, 0.46, z, 12)); }
  else if (art === 'flach') { t.push(bx(18.6, 0.4, 2.8, 0, 1.0, 0), bx(14, 2.0, 2.4, 0, 2.2, 0)); for (const x of [-6, 6]) for (const d of [-0.9, 0.9]) for (const z of [-0.72, 0.72]) t.push(zyl(0.46, 0.12, 'z', x + d, 0.46, z, 12)); }
  else { t.push(bx(18.6, 0.4, 2.8, 0, 1.0, 0), zyl(1.05, 18, 'x', 0, 2.5, 0, 18)); for (const x of [-6, 6]) for (const d of [-0.9, 0.9]) for (const z of [-0.72, 0.72]) t.push(zyl(0.46, 0.12, 'z', x + d, 0.46, z, 12)); }
  return vereine(t);
};
export const Zug: React.FC<{kurve: THREE.Curve<THREE.Vector3>; s0: number; anzahl?: number; abstand?: number; y?: (x: number, z: number) => number; sichtbarBis?: number}> = ({kurve, s0, anzahl = 75, abstand = 19.8, y = () => 0, sichtbarBis}) => {
  const L = kurve.getLength();
  const geos = useMemo(() => ({lok: wagenGeo('lok'), gedeckt: wagenGeo('gedeckt'), flach: wagenGeo('flach'), rohr: wagenGeo('rohr')}), []);
  const mats = useMemo(() => ({a: new THREE.MeshStandardMaterial({color: '#4c4a44', roughness: 0.8, metalness: 0.35}), b: new THREE.MeshStandardMaterial({color: '#3b3f40', roughness: 0.7, metalness: 0.45}), c: new THREE.MeshStandardMaterial({color: '#5d5f55', roughness: 0.7, metalness: 0.4})}), []);
  const out: React.ReactNode[] = [];
  for (let i = 0; i < anzahl; i++) {
    const s = s0 - i * abstand; if (s < 5 || s > L - 5 || (sichtbarBis !== undefined && i * abstand > sichtbarBis)) continue;
    const a = kurve.getPointAt(s / L), b = kurve.getPointAt(Math.min(1, (s + 6) / L)), ang = Math.atan2(-(b.z - a.z), b.x - a.x);
    const art = i < 2 ? 'lok' : i % 7 === 3 ? 'rohr' : i % 5 === 1 ? 'flach' : 'gedeckt';
    out.push(<mesh key={i} geometry={geos[art]} material={art === 'lok' ? mats.b : art === 'gedeckt' ? mats.a : mats.c} position={[a.x, y(a.x, a.z), a.z]} rotation={[0, ang, 0]} castShadow receiveShadow />);
  }
  return <>{out}</>;
};

// Winkelbogen (gelb) in einer Ebene z = z0 um das Zentrum, von Winkel a0 bis a1 (Grad, 0 = +x, nach oben positiv)
export const Winkelbogen: React.FC<{zentrum: V3; radius: number; von?: number; bis: number; z?: number; cor?: string; dicke?: number}> = ({zentrum, radius, von = 0, bis, z = 0, cor = '#f2c14e', dicke = 0.22}) => {
  const n = Math.max(2, Math.ceil(Math.abs(bis - von) / 2));
  const g = useMemo(() => {
    const pts = Array.from({length: n + 1}, (_, i) => { const a = (von + ((bis - von) * i) / n) * Math.PI / 180; return new THREE.Vector3(zentrum[0] + Math.cos(a) * radius, zentrum[1] + Math.sin(a) * radius, z); });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, dicke, 6, false);
  }, [zentrum[0], zentrum[1], radius, von, bis, z, dicke]);   // eslint-disable-line
  return Math.abs(bis - von) > 0.3 ? <mesh geometry={g}><meshBasicMaterial color={cor} toneMapped={false} /></mesh> : null;
};
// Laternen/Scheinwerfer in der Nacht (emissive Kugeln + wenige Punktlichter), f(Intensität)
export const Lampen: React.FC<{punkte: V3[]; an: number; mitLicht?: number}> = ({punkte, an, mitLicht = 2}) => an > 0.02 ? (
  <>{punkte.map((q, i) => <mesh key={i} position={q}><sphereGeometry args={[0.45, 8, 6]} /><meshBasicMaterial color="#ffd9a0" toneMapped={false} /></mesh>)}
    {punkte.slice(0, mitLicht).map((q, i) => <pointLight key={'l' + i} position={[q[0], q[1] + 1, q[2]]} intensity={an * 5000} distance={140} decay={2} color="#ffcf8a" />)}</>
) : null;
