// Bausteine der Kit-Familie ui: Szenenzeit, Zeitanker, Zahlenformat, Rich-Text, Kopfzeile.
// Alle Zeiten in den Props sind SEKUNDEN AB SZENENBEGINN (= Beginn der Batida, oder der Batida `ab`) oder {"wort": "...", "nach": 0, "plus": 0}.
import React from 'react';
import {C, F, fase, sichtbar} from '../../ui/basis';
import {BEAT, wort} from '../../tempo';
import {Zeit} from '../tipos';

export type Ctx = {
  ts: number;        // Szenenzeit (s)
  tv: number;        // Videozeit absolut (s)
  S0: number;        // Szenenbeginn (Videozeit)
  d: number;         // Dauer der Szene bis zum Ende dieser Batida
  b: any;
  z: (x: Zeit | undefined, fb?: number) => number;
  n: (v: number, stellen?: number) => string;
  dez: string; tsd: string;
};

const NB = String.fromCharCode(160), MINUS = String.fromCharCode(8722);
export const fmtZahl = (v: number, n = 0, dez = ',', tsd = NB): string => {
  const neg = v < 0 && Math.abs(v) >= Math.pow(10, -n) / 2;
  const [i, f] = Math.abs(v).toFixed(n).split('.');
  const g = i.length > 3 ? i.replace(/\B(?=(\d{3})+(?!\d))/g, tsd) : i;
  return (neg ? MINUS : '') + g + (f ? dez + f : '');
};

export const mkCtx = (b: any, t: number, p: any): Ctx => {
  let S0 = b.s;
  if (p && p.ab) { try { const a = BEAT(p.ab); if (a && a.s <= b.s) S0 = a.s; } catch { /* ignora */ } }
  const dez = p?.zahl?.dez ?? ',', tsd = p?.zahl?.tsd ?? '.';
  const z = (x: Zeit | undefined, fb = 0): number => {
    if (x === undefined || x === null) return fb;
    if (typeof x === 'number') return x;
    try { return wort(b.kap, x.wort, S0 - 0.3 + (x.nach ?? 0)) - S0 + (x.plus ?? 0); } catch { return fb; }
  };
  return {ts: t + (b.s - S0), tv: b.s + t, S0, d: b.e - S0, b, z, n: (v, k = 0) => fmtZahl(v, k, dez, tsd), dez, tsd};
};

export const FS = (s?: string) => (s === 'titel' ? F.titel : s === 'mono' ? F.mono : F.text);


// Glyphen, die in den Schriften fehlen (Tofu), als Inline-SVG: ⊥ (senkrecht) und ∥ (parallel)
const glyphen = (t: string): React.ReactNode[] =>
  t.split(/([⊥∥])/).map((x, k) => {
    if (x === '⊥') return <svg key={k} width="0.62em" height="0.8em" viewBox="0 0 10 13" style={{verticalAlign: '-0.08em', margin: '0 0.06em'}}><path d="M1 12H9M5 12V1" stroke="currentColor" strokeWidth={1.4} fill="none" strokeLinecap="round" /></svg>;
    if (x === '∥') return <svg key={k} width="0.5em" height="0.8em" viewBox="0 0 8 13" style={{verticalAlign: '-0.08em', margin: '0 0.06em'}}><path d="M2 1V12M6 1V12" stroke="currentColor" strokeWidth={1.4} fill="none" strokeLinecap="round" /></svg>;
    return <React.Fragment key={k}>{x}</React.Fragment>;
  });

// Rich-Text: *signal*  ~grau~  ^rot^   (n = Zahl der sichtbaren Zeichen, fuer Tipp-Effekt)
const RE = /(\*[^*]+\*|~[^~]+~|\^[^^]+\^)/g;
export const Rt: React.FC<{text: string; n?: number}> = ({text, n}) => {
  let rest = n === undefined ? Infinity : n;
  const out: React.ReactNode[] = [];
  text.split(RE).forEach((seg, i) => {
    if (!seg || rest <= 0) return;
    const m = seg[0];
    const farbig = (m === '*' || m === '~' || m === '^') && seg.length > 2 && seg[seg.length - 1] === m;
    const inhalt = farbig ? seg.slice(1, -1) : seg;
    const sicht = inhalt.slice(0, Math.max(0, Math.floor(rest)));
    rest -= inhalt.length;
    const teile = glyphen(sicht);
    out.push(farbig ? <span key={i} style={{color: m === '*' ? C.signal : m === '~' ? C.grau : C.rot}}>{teile}</span> : <React.Fragment key={i}>{teile}</React.Fragment>);
  });
  return <>{out}</>;
};
export const rtLaenge = (text: string) => text.replace(/[*~^]/g, '').length;

export const Caret: React.FC<{ts: number; hoehe: number; farbe?: string}> = ({ts, hoehe, farbe = C.signal}) => (
  <span style={{display: 'inline-block', width: Math.max(4, hoehe * 0.06), height: hoehe * 0.8, marginLeft: 8, background: farbe, verticalAlign: 'middle', opacity: Math.floor(ts * 2.4) % 2 === 0 ? 0.95 : 0.15}} />
);

// Kopfzeile oben links. Mit `nr`: 'TITEL · nr  THEMA' (Stil Mathe-Heft); ohne: Rubrik-Stil.
export const KopfK: React.FC<{c: Ctx; k: any; emStd?: number}> = ({c, k, emStd = 0}) => {
  const em = c.z(k.em, emStd), ate = k.ate !== undefined ? c.z(k.ate) : undefined;
  const o = sichtbar(c.ts, em, 0.5, ate);
  const linie = fase(c.ts, em + 0.1, em + 1.1);
  if (o <= 0) return null;
  const mathe = k.nr !== undefined && k.nr !== null && k.nr !== '';
  return (
    <div style={{position: 'absolute', left: 96, top: 66, right: 96, opacity: o}}>
      <div style={{display: 'flex', alignItems: 'baseline', gap: mathe ? 18 : 22}}>
        <span style={{fontFamily: F.titel, fontWeight: 500, fontSize: 34, letterSpacing: mathe ? 7 : 6, color: C.papier, textTransform: 'uppercase'}}>{k.titel}</span>
        {mathe && <span style={{fontFamily: F.titel, fontWeight: 400, fontSize: 34, color: C.signal}}>· {k.nr}</span>}
        {k.thema && <span style={{fontFamily: F.mono, fontSize: 20, letterSpacing: 3, color: C.grau, marginLeft: mathe ? 14 : 0, textTransform: 'uppercase'}}>{k.thema}</span>}
      </div>
      <div style={{marginTop: 12, height: 1.5, width: `${linie * 100}%`,
        background: mathe ? `linear-gradient(90deg, ${C.signal}, rgba(242,193,78,0.25) 30%, rgba(233,225,207,0.12))` : 'linear-gradient(90deg, rgba(233,225,207,0.55), rgba(233,225,207,0.08))'}} />
    </div>
  );
};
