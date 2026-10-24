// Kit welt · curvas de trajetoria (balistica) normalizadas + carregamento de JSON de public/ (delayRender, funciona em still e render).
// Formatos aceitos em `curva`:
//   {serie: "nome", arquivo?: "bahn.json"}          caso dentro de {faelle:{nome:{t_s,x_m|x_km,h_m|h_km,v_ms,mach,lat,lon,winkel_grad}}}
//   {arquivo: "g2/bahn_815.json"}                  arquivo plano com as mesmas colunas
//   {pontos: [{t,lat,lon,alt}] | [{t,x,y,z}]}      x = alcance (m), y = altura (m), z = lateral (m, a direita do tiro); precisa origem+azimute
//   {params: {v0, angulo, g?, arrasto?, h0?}}      tiro calculado (parabola ou arrasto quadratico k [1/m]); precisa origem+azimute
// Tudo funcao pura dos props: nada de estado.
import * as THREE from 'three';
import {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {monoton, welt} from '../../welt/g2_geo';

const R_T = 6371008.8, K = Math.PI / 180;
export type Geo = {lat: number; lon: number; h?: number};

// ---- geodesia simples -----------------------------------------------------------------------------
export const destino = (lat: number, lon: number, azDeg: number, dist: number): [number, number] => {
  const d = dist / R_T, a = azDeg * K, la = lat * K, lo = lon * K;
  const la2 = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(a));
  const lo2 = lo + Math.atan2(Math.sin(a) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(la2));
  return [la2 / K, lo2 / K];
};
export const rumoEntre = (a: Geo, b: Geo) => {
  const f1 = a.lat * K, f2 = b.lat * K, dl = (b.lon - a.lon) * K;
  const y = Math.sin(dl) * Math.cos(f2), x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl);
  return ((Math.atan2(y, x) / K) + 360) % 360;
};
export const distGeo = (a: Geo, b: Geo) => {
  const f1 = a.lat * K, f2 = b.lat * K, dl = (b.lon - a.lon) * K, df = f2 - f1;
  const h = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
  return 2 * R_T * Math.asin(Math.min(1, Math.sqrt(h)));
};

// ---- carregamento de JSON -------------------------------------------------------------------------------
const CACHE = new Map<string, any>();
const PEND = new Map<string, Promise<any>>();
const carrega = (url: string) => {
  if (CACHE.has(url)) return Promise.resolve(CACHE.get(url));
  let p = PEND.get(url);
  if (!p) {
    p = fetch(staticFile(url)).then((r) => { if (!r.ok) throw new Error(`json nao achado: ${url}`); return r.json(); }).then((j) => { CACHE.set(url, j); return j; });
    PEND.set(url, p);
  }
  return p;
};
// null enquanto carrega (o render espera pelo delayRender)
export const useJsons = (urls: string[]): any[] | null => {
  const chave = urls.join('|');
  const pronto = urls.every((u) => CACHE.has(u));
  const [, setN] = useState(0);
  const [h] = useState(() => (pronto ? null : delayRender('kit-json ' + chave)));
  useEffect(() => {
    if (pronto) { if (h !== null) continueRender(h); return; }
    let vivo = true;
    Promise.all(urls.map(carrega)).then(() => { if (vivo) setN((n) => n + 1); if (h !== null) continueRender(h); }, (e) => { console.error(e); if (h !== null) continueRender(h); });
    return () => { vivo = false; };
  }, [chave]);
  return pronto ? urls.map((u) => CACHE.get(u)) : null;
};

// ---- Track -------------------------------------------------------------------------------------------------
export type CurvaSpec = {
  id?: string; serie?: string; arquivo?: string; pontos?: any[]; params?: {v0: number; angulo: number; g?: number; arrasto?: number; h0?: number; c?: number};
  origem?: Geo; azimute?: number;
  solo?: [number, number];             // altura do terreno [na origem, no impacto] em m (a curva e deformada linearmente por alcance para coincidir)
  [k: string]: any;
};
export type Track = {
  id: string; n: number; dt: number; fim: number;
  t: number[]; x: number[]; h: number[]; hw: number[]; v: number[]; mach: number[]; ang: number[]; lat: number[]; lon: number[];
  origem: Geo; alvo: Geo; tApogeu: number; hApogeu: number; wcache: (THREE.Vector3 | undefined)[];
};

const soloH = (h: number, x: number, xFim: number, hFim: number, solo: [number, number]) => {
  const f = xFim > 0 ? Math.max(0, Math.min(1, x / xFim)) : 0;
  return h + solo[0] + f * (solo[1] - hFim - solo[0]);
};

type Cru = {t: number[]; lat: number[]; lon: number[]; h: number[]; x?: number[]; v?: number[]; mach?: number[]; ang?: number[]};
const constroi = (id: string, c: Cru, solo: [number, number]): Track => {
  let { t } = c;
  const n0 = t.length;
  const dt0 = (t[n0 - 1] - t[0]) / (n0 - 1);
  const uniforme = t.every((v, i) => Math.abs(v - (t[0] + i * dt0)) < dt0 * 1e-3 + 1e-9) && Math.abs(t[0]) < 1e-9;
  const lerpA = (arr: number[], ts: number[], tt: number) => {
    let i = 0; while (i < ts.length - 2 && ts[i + 1] < tt) i++;
    const a = (tt - ts[i]) / ((ts[i + 1] - ts[i]) || 1);
    return arr[i] + (arr[i + 1] - arr[i]) * Math.max(0, Math.min(1, a));
  };
  let res: Cru = c;
  if (!uniforme) {
    const T = t[n0 - 1] - t[0], dt = Math.min(0.25, T / 200), n = Math.ceil(T / dt) + 1;
    const tt = Array.from({length: n}, (_, i) => Math.min(T, i * dt) + t[0]);
    // spline monotona (Fritsch-Carlson) entre os pontos dados: o pico da parabola sai liso mesmo com poucos pontos
    const m = (arr?: number[]) => { if (!arr) return undefined; const f = n0 >= 3 ? monoton(t, arr) : null; return tt.map((q) => (f ? f(q) : lerpA(arr, t, q))); };
    res = {t: tt.map((q) => q - t[0]), lat: m(c.lat)!, lon: m(c.lon)!, h: m(c.h)!, x: m(c.x), v: m(c.v), mach: m(c.mach), ang: m(c.ang)};
    t = res.t;
  }
  const n = t.length, dt = n > 1 ? t[1] - t[0] : 1;
  const P = (i: number) => welt(res.lat[i], res.lon[i], res.h[i]);
  // x (alcance) e v/mach/angulo derivados quando faltam
  let x = res.x;
  if (!x) { x = [0]; for (let i = 1; i < n; i++) { const a = P(i - 1), b = P(i); const dx = Math.hypot(b.x - a.x, b.z - a.z); x.push(x[i - 1] + dx); } }
  let v = res.v;
  if (!v) { v = []; for (let i = 0; i < n; i++) { const a = P(Math.max(0, i - 1)), b = P(Math.min(n - 1, i + 1)); v.push(a.distanceTo(b) / (dt * (Math.min(n - 1, i + 1) - Math.max(0, i - 1) || 1))); } }
  const mach = res.mach ?? v.map((q) => q / 343);
  const ang = res.ang ?? Array.from({length: n}, (_, i) => { const i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1); const dx = x![i1] - x![i0]; return (Math.atan2(res.h[i1] - res.h[i0], dx || 1e-6) / K); });
  const xFim = x[n - 1], hFim = res.h[n - 1];
  const hw = res.h.map((h, i) => soloH(h, x![i], xFim, hFim, solo));
  let ia = 0; for (let i = 1; i < n; i++) if (res.h[i] > res.h[ia]) ia = i;
  return {
    id, n, dt, fim: t[n - 1], t, x, h: res.h, hw, v, mach, ang, lat: res.lat, lon: res.lon,
    origem: {lat: res.lat[0], lon: res.lon[0], h: hw[0]}, alvo: {lat: res.lat[n - 1], lon: res.lon[n - 1], h: hw[n - 1]},
    tApogeu: t[ia], hApogeu: res.h[ia], wcache: new Array(n).fill(undefined),
  };
};

// tiro calculado: alcance/altura/velocidade ao longo de (x, y), integrado com passo fixo (deterministico)
const integra = (p: NonNullable<CurvaSpec['params']>) => {
  const g = p.g ?? 9.81, k = p.arrasto ?? 0, c = p.c ?? 343, h0 = p.h0 ?? 0, a = p.angulo * K;
  let x = 0, y = h0, vx = p.v0 * Math.cos(a), vy = p.v0 * Math.sin(a), t = 0;
  const dtI = 0.01, saida = 0.25;
  const out = {t: [0], x: [0], h: [h0], v: [p.v0], mach: [p.v0 / c], ang: [p.angulo]};
  let prox = saida;
  for (let it = 0; it < 200000; it++) {
    const vq = Math.hypot(vx, vy);
    const ax = -k * vq * vx, ay = -g - k * vq * vy;
    const vx2 = vx + ax * dtI, vy2 = vy + ay * dtI;
    const x2 = x + (vx + vx2) / 2 * dtI, y2 = y + (vy + vy2) / 2 * dtI;
    t += dtI;
    if (y2 <= 0 && vy2 < 0) {
      const f = y / (y - y2 || 1e-9);
      const xe = x + (x2 - x) * f, te = t - dtI + dtI * f;
      out.t.push(te); out.x.push(xe); out.h.push(0); const ve = Math.hypot(vx + (vx2 - vx) * f, vy + (vy2 - vy) * f);
      out.v.push(ve); out.mach.push(ve / c); out.ang.push(Math.atan2(vy2, vx2) / K);
      break;
    }
    x = x2; y = y2; vx = vx2; vy = vy2;
    if (t >= prox - 1e-9) { const vv = Math.hypot(vx, vy); out.t.push(t); out.x.push(x); out.h.push(y); out.v.push(vv); out.mach.push(vv / c); out.ang.push(Math.atan2(vy, vx) / K); prox += saida; }
  }
  return out;
};

const col = (f: any, nome: string, alt?: string) => f[nome] ?? (alt ? f[alt] : undefined);
export const montaTrack = (spec: CurvaSpec, jsons: Record<string, any>, idx: number): Track => {
  const id = spec.id ?? 'c' + idx;
  const solo: [number, number] = spec.solo ?? [0, 0];
  let f: any = null;
  if (spec.params || spec.pontos) {
    const o = spec.origem;
    if (!o) throw new Error(`curva ${id}: 'origem' e obrigatoria com pontos/params`);
    const az = spec.azimute ?? 0;
    const geoDe = (x: number, z: number): [number, number] => {
      let [la, lo] = x ? destino(o.lat, o.lon, az, x) : [o.lat, o.lon];
      if (z) [la, lo] = destino(la, lo, az + 90, z);
      return [la, lo];
    };
    if (spec.params) {
      const r = integra(spec.params);
      const ll = r.x.map((x) => geoDe(x, 0));
      return constroi(id, {t: r.t, lat: ll.map((q) => q[0]), lon: ll.map((q) => q[1]), h: r.h, x: r.x, v: r.v, mach: r.mach, ang: r.ang}, spec.solo ?? [o.h ?? 0, o.h ?? 0]);
    }
    const ps = spec.pontos!;
    if ('x' in ps[0]) {
      const ll = ps.map((q: any) => geoDe(q.x, q.z ?? 0));
      return constroi(id, {t: ps.map((q: any) => q.t), lat: ll.map((q) => q[0]), lon: ll.map((q) => q[1]), h: ps.map((q: any) => q.y), x: ps.map((q: any) => q.x)}, spec.solo ?? [o.h ?? 0, o.h ?? 0]);
    }
    const alts = ps.map((q: any) => q.alt ?? q.h ?? 0);   // altitude absoluta (m): nao deformar pelo terreno
    return constroi(id, {t: ps.map((q: any) => q.t), lat: ps.map((q: any) => q.lat), lon: ps.map((q: any) => q.lon), h: alts}, spec.solo ?? [0, alts[alts.length - 1]]);
  }
  const arq = spec.arquivo ?? 'bahn.json';
  const j = jsons[arq];
  if (!spec.serie && (Array.isArray(j) || j.pontos)) return montaTrack({...spec, arquivo: undefined, pontos: j.pontos ?? j, origem: spec.origem ?? j.origem, azimute: spec.azimute ?? j.azimute, solo: spec.solo ?? j.solo}, jsons, idx);
  f = spec.serie ? (j.faelle ?? j.casos ?? j)[spec.serie] : j;
  if (!f) throw new Error(`curva ${id}: serie '${spec.serie}' nao existe em ${arq}`);
  const km = (nome: string, m: string) => col(f, nome) ? col(f, nome).map((q: number) => q * 1000) : col(f, m);
  return constroi(id, {t: col(f, 't_s', 't'), lat: f.lat, lon: f.lon, h: km('h_km', 'h_m') ?? f.alt, x: km('x_km', 'x_m'), v: col(f, 'v_ms', 'v'), mach: f.mach, ang: col(f, 'winkel_grad', 'angulo')}, solo);
};
export const arquivosDe = (specs: CurvaSpec[]) => Array.from(new Set(specs.filter((s) => !s.params && !s.pontos).map((s) => s.arquivo ?? 'bahn.json')));

// ---- amostragem -------------------------------------------------------------------------------------------------
export type Amostra = {t: number; x: number; h: number; v: number; mach: number; ang: number; lat: number; lon: number; hw: number};
export const amostra = (tr: Track, ts: number): Amostra => {
  const tt = Math.max(0, Math.min(tr.fim, ts));
  const i = Math.max(0, Math.min(tr.n - 2, Math.floor(tt / tr.dt + 1e-9)));
  const a = Math.max(0, Math.min(1, (tt - tr.t[i]) / ((tr.t[i + 1] - tr.t[i]) || 1)));
  const m = (arr: number[]) => arr[i] + (arr[i + 1] - arr[i]) * a;
  return {t: tt, x: m(tr.x), h: m(tr.h), v: m(tr.v), mach: m(tr.mach), ang: m(tr.ang), lat: m(tr.lat), lon: m(tr.lon), hw: m(tr.hw)};
};
const wk = (tr: Track, k: number) => {
  const i = Math.max(0, Math.min(tr.n - 1, k));
  return (tr.wcache[i] ??= welt(tr.lat[i], tr.lon[i], tr.hw[i]));
};
// posicao no mundo: Catmull-Rom pelos pontos do raster (camera e direcao suaves)
export const mundo = (tr: Track, ts: number, out = new THREE.Vector3()) => {
  const tt = Math.max(0, Math.min(tr.fim, ts));
  const i = Math.min(tr.n - 2, Math.floor(tt / tr.dt + 1e-9)), u = (tt - tr.t[i]) / (tr.t[i + 1] - tr.t[i]);
  const p0 = wk(tr, i - 1), p1 = wk(tr, i), p2 = wk(tr, i + 1), p3 = wk(tr, i + 2);
  const u2 = u * u, u3 = u2 * u;
  out.set(0, 0, 0);
  out.addScaledVector(p0, 0.5 * (-u3 + 2 * u2 - u)).addScaledVector(p1, 0.5 * (3 * u3 - 5 * u2 + 2)).addScaledVector(p2, 0.5 * (-3 * u3 + 4 * u2 + u)).addScaledVector(p3, 0.5 * (u3 - u2));
  return out;
};
export const rumo = (tr: Track, ts: number) => {
  const a = Math.max(0, Math.min(tr.fim - 0.6, ts - 0.3)), b = a + 0.6;
  return mundo(tr, b).sub(mundo(tr, a)).normalize();
};
// pontos da curva de ts0 a ts1 (raster 0,5 s + extremos exatos); hs = altura em km (regra de cor)
export const pontosCurva = (tr: Track, ts1: number, ts0 = 0, passo = 0.5) => {
  const pts: THREE.Vector3[] = [], hs: number[] = [];
  const e = Math.min(ts1, tr.fim);
  if (e <= ts0) return {pts, hs};
  for (let t = ts0; t < e; t += passo) { pts.push(mundo(tr, t)); hs.push(amostra(tr, t).h / 1000); }
  pts.push(mundo(tr, e)); hs.push(amostra(tr, e).h / 1000);
  return {pts, hs};
};
// ts em que a curva atinge o comprimento de arco s (para frentes de onda)
const ARCO = new WeakMap<Track, {ts: number[]; S: number[]}>();
export const arcoDe = (tr: Track) => {
  let r = ARCO.get(tr);
  if (!r) {
    const ts: number[] = [], S: number[] = [];
    let acc = 0, prev = mundo(tr, 0);
    for (let x = 0; x <= tr.fim + 1e-6; x += 0.25) { const p = mundo(tr, x); acc += p.distanceTo(prev); prev = p; ts.push(x); S.push(acc); }
    r = {ts, S}; ARCO.set(tr, r);
  }
  return r;
};
export const tsNoArco = (tr: Track, s: number) => {
  const {ts, S} = arcoDe(tr);
  if (s <= 0) return 0;
  if (s >= S[S.length - 1]) return ts[ts.length - 1];
  let i = 1; while (S[i] < s) i++;
  return ts[i - 1] + ((s - S[i - 1]) / (S[i] - S[i - 1])) * (ts[i] - ts[i - 1]);
};
