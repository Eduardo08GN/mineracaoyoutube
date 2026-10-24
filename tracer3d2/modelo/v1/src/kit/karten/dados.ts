// Karte (kit): tempo, carga de dados e geometria. Tudo generico: nada de Luettich/Paris aqui dentro.
//  mkZt(b)        -> resolve uma "Zeit" (numero local | {wort,s,k,nach,plus,fb} | {s} | {k}) em segundos locais da batida
//  useDateien(..) -> carrega arquivos de public/ (GeoJSON ou JSON em metros) uma vez, com delayRender
//  ref/ll         -> coordenada [lon,lat] | "@arquivo:Nome" (ponto/feature do arquivo) | {von, az, km}
//  teile / linieAus -> geometrias de um arquivo (filtro, recorte, ordenar, suavizar)
import {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';
import {Beat, PLAN, wort} from '../../tempo';
import {LL, ausMetern, ziel as zielPkt} from '../../karten/basis';

// ---------- tempo ----------
export type ZT = (z: any, def?: number) => number;
export const mkZt = (b: Beat): ZT => {
  const kap = PLAN.kapitel.find((k) => k.id === b.kap);
  const k0 = kap ? kap.s : b.s;
  return (z: any, def = 0): number => {
    if (z === undefined || z === null) return def;
    if (typeof z === 'number') return z;
    const plus = z.plus ?? 0;
    if (z.wort !== undefined) {
      try {
        const nach = z.s !== undefined ? z.s : z.k !== undefined ? k0 + z.k : b.s + (z.nach ?? 0);
        return wort(b.kap, z.wort, nach) - b.s + plus;
      } catch { return z.fb !== undefined ? z.fb - b.s + plus : def; }
    }
    if (z.s !== undefined) return z.s - b.s + plus;
    if (z.k !== undefined) return k0 + z.k - b.s + plus;
    return def;
  };
};

// ---------- carga ----------
const CACHE: Record<string, any> = {};
const PROM: Record<string, Promise<any>> = {};
export const pfadVon = (d: string) => (d.includes('/') ? d : 'geo/' + d);
const lade = (d: string) => {
  const pf = pfadVon(d);
  return (PROM[pf] ||= fetch(staticFile(pf)).then((r) => r.json()).then((j) => { CACHE[pf] = j; return j; }));
};
export type Dat = (d: string) => any;
export const useDateien = (dateien: string[]): Dat => {
  const key = dateien.join('|');
  const fehlt = dateien.filter((d) => !CACHE[pfadVon(d)]);
  const [, setN] = useState(0);
  const [h] = useState(() => (fehlt.length ? delayRender('Karte dados ' + key) : null));
  useEffect(() => {
    if (!fehlt.length) { if (h !== null) continueRender(h); return; }
    Promise.all(dateien.map(lade)).then(() => { setN((n) => n + 1); if (h !== null) continueRender(h); }).catch((e) => cancelRender(e));
  }, [key, h]);
  return (d: string) => CACHE[pfadVon(d)] ?? null;
};
// sammelt alle Dateinamen in den Props: Schluessel "datei" und Strings "@datei:Name"
export const sammleDateien = (o: any, out = new Set<string>()): string[] => {
  if (typeof o === 'string') { if (o[0] === '@') out.add(o.slice(1).split(':')[0]); }
  else if (Array.isArray(o)) o.forEach((x) => sammleDateien(x, out));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (k === 'datei' && typeof v === 'string') out.add(v); else sammleDateien(v, out); }
  return [...out];
};

// ---------- Geometrie aus Dateien ----------
export type Teil = {art: 'linie' | 'flaeche' | 'punkt'; ringe: LL[][]; props: any};
const norm = (x: any) => String(x ?? '').toLowerCase().normalize('NFC').replace(/[^a-zäöüßé0-9]/g, '');
export const prop = (o: any, pfad: string) => pfad.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const passt = (props: any, filter: any): boolean => {
  if (!filter) return true;
  return Object.entries(filter).every(([k, v]: [string, any]) => {
    const x = prop(props, k);
    if (Array.isArray(v)) return v.includes(x);
    if (v && typeof v === 'object') return (v.min === undefined || x >= v.min) && (v.max === undefined || x <= v.max);
    return x === v;
  });
};
const geomTeile = (g: any, props: any): Teil[] => {
  if (!g) return [];
  switch (g.type) {
    case 'LineString': return [{art: 'linie', ringe: [g.coordinates], props}];
    case 'MultiLineString': return [{art: 'linie', ringe: g.coordinates, props}];
    case 'Polygon': return [{art: 'flaeche', ringe: g.coordinates, props}];
    case 'MultiPolygon': return g.coordinates.map((pl: LL[][]) => ({art: 'flaeche' as const, ringe: pl, props}));
    case 'Point': return [{art: 'punkt', ringe: [[g.coordinates]], props}];
    case 'MultiPoint': return [{art: 'punkt', ringe: [g.coordinates], props}];
    case 'GeometryCollection': return g.geometries.flatMap((x: any) => geomTeile(x, props));
  }
  return [];
};
const metrisch = (o: {lon: number; lat: number}, p: number[]): LL[] => { const out: LL[] = []; for (let i = 0; i + 1 < p.length; i += 2) out.push(ausMetern([o.lon, o.lat], p[i], p[i + 1])); return out; };
// spec: {datei, filter?, geom?}
export const teile = (json: any, filter?: any): Teil[] => {
  if (!json) return [];
  let out: Teil[] = [];
  const gt = filter?.geom; if (filter && gt) { filter = {...filter}; delete filter.geom; }
  if (json.type === 'FeatureCollection') out = json.features.flatMap((f: any) => (passt(f.properties, filter) && (!gt || f.geometry.type === gt) ? geomTeile(f.geometry, f.properties) : []));
  else if (json.type === 'Feature') out = passt(json.properties, filter) ? geomTeile(json.geometry, json.properties) : [];
  else if (json.type) out = geomTeile(json, {});
  else if (json.ursprung && json.linien) out = json.linien.filter((l: any) => passt(l, filter)).map((l: any) => ({art: 'linie' as const, ringe: [metrisch(json.ursprung, l.p)], props: l}));
  else if (json.ursprung && json.polygone) out = json.polygone.filter((l: any) => passt(l, filter)).map((q: any) => ({art: 'flaeche' as const, ringe: [metrisch(json.ursprung, q.p), ...(q.l || []).map((h: number[]) => metrisch(json.ursprung, h))], props: q}));
  return out;
};
// Ostgrenze (Kappe): Profil [[lat, lonMax], ...]; Punkte oestlich davon werden auf die Grenze gelegt (schematische historische Grenze)
export const kappeOst = (ring: LL[], prof: [number, number][]): LL[] => {
  const g = (lat: number) => {
    if (lat <= prof[0][0]) return prof[0][1];
    for (let i = 0; i < prof.length - 1; i++) if (lat <= prof[i + 1][0]) { const u = (lat - prof[i][0]) / (prof[i + 1][0] - prof[i][0]); return prof[i][1] + (prof[i + 1][1] - prof[i][1]) * u; }
    return prof[prof.length - 1][1];
  };
  return ring.map(([lon, lat]) => [Math.min(lon, g(lat)), lat] as LL);
};

// ---------- Referenzen ----------
export const mkRef = (dat: Dat) => {
  const ort = (r: string): LL => {
    const [datei, name] = r.slice(1).split(':');
    const j = dat(datei);
    const q = norm(name);
    for (const t of teile(j)) if (t.art === 'punkt' && (norm(t.props.id) === q || norm(t.props.name).startsWith(q) || norm(t.props.name_de).startsWith(q))) return t.ringe[0][0];
    return [0, 0];
  };
  const ll = (v: any): LL => {
    if (Array.isArray(v)) return [v[0], v[1]];
    if (typeof v === 'string') return v[0] === '@' ? ort(v) : [0, 0];
    if (v && v.von !== undefined) { const a = ll(v.von); return zielPkt(a, v.az ?? 0, v.km ?? 0); }
    return [0, 0];
  };
  const pts = (v: any): LL[] => (Array.isArray(v) ? v.map(ll) : v && v.datei ? linieAus(dat(v.datei), v) : []);
  return {ll, pts};
};
// Linie aus Datei: Teile filtern, verketten; lat/lon: [min,max] beschneiden; sortiere: 'lat'|'lon'; glatten: n; umkehren
export const linieAus = (json: any, s: any): LL[] => {
  let pts: LL[] = teile(json, s.filter).flatMap((t) => t.ringe.flat());
  if (s.lat) pts = pts.filter((q) => q[1] > s.lat[0] && q[1] < s.lat[1]);
  if (s.lon) pts = pts.filter((q) => q[0] > s.lon[0] && q[0] < s.lon[1]);
  if (s.sortiere === 'lat') pts = pts.slice().sort((a, b) => a[1] - b[1]);
  if (s.sortiere === 'lon') pts = pts.slice().sort((a, b) => a[0] - b[0]);
  let q = pts;
  for (let k = 0; k < (s.glatten ?? 0); k++) { const r = q; q = r.map((c, i) => (i === 0 || i === r.length - 1 ? c : [(r[i - 1][0] + c[0] * 2 + r[i + 1][0]) / 4, (r[i - 1][1] + c[1] * 2 + r[i + 1][1]) / 4] as LL)); }
  return s.umkehren ? q.slice().reverse() : q;
};
// zwei Polylinien auf n Punkte gleichmaessig (Bogenlaenge) umrechnen und mischen (Frontverlauf)
export const resample = (pts: LL[], n: number): LL[] => {
  if (pts.length < 2) return pts;
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const out: LL[] = []; let j = 1;
  for (let i = 0; i < n; i++) {
    const z = (L[L.length - 1] * i) / (n - 1);
    while (j < pts.length - 1 && L[j] < z) j++;
    const u = (z - L[j - 1]) / (L[j] - L[j - 1] || 1);
    out.push([pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * u, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * u]);
  }
  return out;
};
// Keyframes eines Wertes: numero | [[Zeit, v], ...]
export const kfWert = (zt: ZT, o: any, t: number, def = 1, linear = false): number => {
  if (o === undefined || o === null) return def;
  if (typeof o === 'number') return o;
  if (!Array.isArray(o) || !o.length) return def;
  const ks = o.map(([z, v]: [any, number]) => [zt(z, 0), v] as [number, number]);
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) if (t <= ks[i + 1][0]) { const u = (t - ks[i][0]) / (ks[i + 1][0] - ks[i][0] || 1); const e = linear ? Math.min(1, Math.max(0, u)) : u * u * (3 - 2 * u); return ks[i][1] + (ks[i + 1][1] - ks[i][1]) * e; }
  return ks[ks.length - 1][1];
};
