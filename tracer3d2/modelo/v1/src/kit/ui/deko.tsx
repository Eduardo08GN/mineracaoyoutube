// Zeichnung/Deko: freie Elemente (1920 x 1080 px) mit Einsatzzeit; plus Rahmen (Heft-Hintergrund, Kopfzeile, Fortschritt, Fuss) fuer alle Szenen der Familie ui.
// Element-Typen: text zahl tex kreis rechteck linie pfeil bogen wuerfel ikon chip siegel raster skala lkw schale kurve karte balken rahmen pfad
import React from 'react';
import {C, F, fase, sichtbar, QUELLEN_IM_BILD} from '../../ui/basis';
import {Heft, Siegel, Pfeil, zeichne, federn, mix} from '../../ui/u1_heft';
import {Tex} from '../../ui/u1_formel';
import {Fortschritt, Lkw, Schale} from '../../ui/b1_basis';
import {bogen} from '../../ui/b2_basis';
import {Ctx, FS, Rt, rtLaenge, KopfK} from './lib';
import {Ikon} from './ikonen';
import {KurveEl} from './kurve';
import {PapierEl} from './papier';
import {BalkenEl} from './balken';

const wasEm = (c: Ctx, e: any, dflt = 0) => c.z(e.em, dflt);
const wasAte = (c: Ctx, e: any) => (e.ate !== undefined && e.ate !== null ? c.z(e.ate) : undefined);
const NF = (e: any) => (e.farbe ?? C.signal) as string;

// Verankerung: Element wird bei (x, y) ausgerichtet (l = links, m = Mitte, r = rechts)
const Anker: React.FC<{x: number; y: number; ausr?: string; breite?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({x, y, ausr = 'l', breite, children, style}) => (
  <div style={{position: 'absolute', left: breite && ausr === 'm' ? x - breite / 2 : x, top: y, width: breite, ...style}}>
    <div style={{transform: breite ? undefined : `translateX(${ausr === 'm' ? -50 : ausr === 'r' ? -100 : 0}%)`, whiteSpace: breite ? undefined : 'nowrap', textAlign: ausr === 'm' ? 'center' : ausr === 'r' ? 'right' : 'left', width: breite ? '100%' : undefined}}>{children}</div>
  </div>
);

// Zaehlwert (von -> bis) ab Einsatz
export const zaehl = (c: Ctx, zz: any, em: number) => {
  const a = c.z(zz.em, em);
  return (zz.von ?? 0) + ((zz.bis ?? 0) - (zz.von ?? 0)) * fase(c.ts, a, a + (zz.dauer ?? 1.2));
};

const TextEl: React.FC<{c: Ctx; e: any}> = ({c, e}) => {
  const em = wasEm(c, e), o = sichtbar(c.ts, em, e.dur ?? 0.45, wasAte(c, e));
  if (o <= 0.001) return null;
  let txt: string = String(e.text ?? '');
  if (e.zaehler) txt = txt.replace('{z}', c.n(zaehl(c, e.zaehler, em), e.zaehler.stellen ?? 0));
  const nTipp = e.tippen ? Math.max(0, Math.floor((c.ts - em) * e.tippen)) : undefined;
  const q = e.pop ? (() => { const k = Math.max(0, Math.min(1, (c.ts - em) / 0.5)); return k < 1 ? 1.5 - 0.5 * (1 - Math.pow(1 - k, 3)) : 1; })() : 1;
  const puls = e.puls ? 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(c.ts * 5)) : 1;
  return (
    <Anker x={e.x ?? 0} y={e.y ?? 0} ausr={e.ausr} breite={e.breite}>
      <div style={{opacity: o * puls, transform: `translateY(${(1 - o) * (e.hub ?? 10)}px) scale(${q}) rotate(${e.winkel ?? 0}deg)`, transformOrigin: '50% 60%',
        fontFamily: FS(e.schrift), fontWeight: e.gewicht ?? (e.schrift === 'titel' ? 600 : e.schrift === 'mono' ? 400 : 500), fontSize: e.groesse ?? 36, letterSpacing: e.abstand ?? 0,
        lineHeight: e.zeilenhoehe ?? 1.15, color: e.farbe ?? C.papier, fontVariantNumeric: 'tabular-nums', textTransform: e.versal ? 'uppercase' : undefined,
        textShadow: e.glow ? '0 0 60px rgba(242,193,78,0.35)' : undefined, whiteSpace: txt.includes(String.fromCharCode(10)) ? 'pre' : undefined}}>
        <Rt text={txt} n={nTipp} />
      </div>
    </Anker>
  );
};

// grosse Zahl mit Kicker, Einheit, Zeile darunter; zaehlt hoch wenn `bis` oder `zaehler`
export const ZahlEl: React.FC<{c: Ctx; e: any}> = ({c, e}) => {
  const em = wasEm(c, e), o = sichtbar(c.ts, em, e.dur ?? 0.5, wasAte(c, e));
  if (o <= 0.001) return null;
  const g = e.groesse ?? 210, farbe = e.farbe ?? C.signal;
  let wert = e.wert;
  if (typeof e.wert === 'number' && (e.bis !== undefined || e.zaehler)) {
    const von = e.bis !== undefined ? e.wert : 0, bis = e.bis !== undefined ? e.bis : e.wert;
    wert = c.n(zaehl(c, {von, bis, em: e.zaehlEm, dauer: e.zaehlDauer ?? 1.2}, em), e.stellen ?? 0);
    if (e.pfx) wert = e.pfx + wert;
  } else if (typeof wert === 'number') wert = c.n(wert, e.stellen ?? 0);
  const pulse = e.puls ? 0.5 + 0.5 * Math.sin(c.ts * 5) : 0;
  const ue = e.untenEm !== undefined ? c.z(e.untenEm) : em + 0.6;
  return (
    <Anker x={e.x ?? 960} y={e.y ?? 300} ausr={e.ausr ?? 'l'}>
      <div style={{opacity: o, transform: `translateY(${(1 - o) * 14}px)`, textAlign: e.ausr === 'm' ? 'center' : e.ausr === 'r' ? 'right' : 'left'}}>
        {e.kicker && <div style={{fontFamily: F.mono, fontSize: e.kickerpt ?? 26, letterSpacing: e.kickerabstand ?? 5, color: e.kickerfarbe ?? C.grau, textTransform: 'uppercase'}}>{e.kicker}</div>}
        {e.label && <div style={{marginTop: 14, fontFamily: F.text, fontWeight: 500, fontSize: e.labelpt ?? 46, color: C.papier}}>{e.label}</div>}
        <div style={{display: 'flex', alignItems: 'baseline', justifyContent: e.ausr === 'm' ? 'center' : e.ausr === 'r' ? 'flex-end' : 'flex-start', gap: g * 0.08}}>
          <span style={{fontFamily: F.titel, fontWeight: 600, fontSize: g, letterSpacing: e.abstand ?? 2, color: farbe, lineHeight: e.zeilenhoehe ?? 1.05, fontVariantNumeric: 'tabular-nums', textShadow: e.glow ? '0 0 60px rgba(242,193,78,0.35)' : undefined}}>{wert}</span>
          {e.einheit && e.einheitInline && <span style={{fontFamily: F.titel, fontWeight: 600, fontSize: g * 0.37, color: C.papier}}>{e.einheit}</span>}
        </div>
        {e.einheit && !e.einheitInline && <div style={{fontFamily: e.einheitMono ? F.mono : F.text, fontWeight: 500, fontSize: e.einheitpt ?? Math.round(g * 0.3), color: e.einheitMono ? farbe : C.papier, marginTop: 2}}>{e.einheit}</div>}
        {e.unter && <div style={{marginTop: e.untenAbstand ?? 22, fontFamily: F.mono, fontSize: e.unterpt ?? 28, letterSpacing: e.unterabstand ?? 1, color: C.grau, opacity: sichtbar(c.ts, ue, 0.5)}}>{e.unter}</div>}
      </div>
      {pulse > 0 && null}
    </Anker>
  );
};

const KreisEl: React.FC<{c: Ctx; e: any}> = ({c, e}) => {
  const em = wasEm(c, e), o = sichtbar(c.ts, em - 0.1, 0.3, wasAte(c, e));
  if (o <= 0.001) return null;
  const p = fase(c.ts, em, em + (e.dur ?? 0.55)), r = e.r ?? 60, col = NF(e);
  return (
    <g opacity={o}>
      <circle cx={e.x} cy={e.y} r={r * p} fill={e.fuell === 0 ? 'none' : col} fillOpacity={e.fuell ?? 0.2} stroke={col} strokeWidth={e.strich ?? 4} strokeDasharray={e.gestrichelt ? '10 8' : undefined} />
      {e.ring && <circle cx={e.x} cy={e.y} r={r * (e.ringR ?? 0.62) * fase(c.ts, em + 0.2, em + 0.8)} fill="none" stroke={col} strokeWidth={2.5} opacity={0.6} />}
      {e.text && <text x={e.x} y={e.y + (e.textpt ?? 52) * 0.35} fill={e.textfarbe ?? col} fontFamily={FS(e.schrift ?? 'titel')} fontWeight={600} fontSize={e.textpt ?? 52} textAnchor="middle" opacity={sichtbar(c.ts, em + 0.25, 0.4)}>{e.text}</text>}
      {e.unter && <text x={e.x} y={e.y + r + 46} fill={e.unterfarbe ?? col} fontFamily={F.mono} fontSize={e.unterpt ?? 24} letterSpacing={e.unterabstand ?? 0} textAnchor="middle" opacity={sichtbar(c.ts, em + 0.2, 0.4)}>{e.unter}</text>}
    </g>
  );
};

const RechteckEl: React.FC<{c: Ctx; e: any}> = ({c, e}) => {
  const em = wasEm(c, e), o = sichtbar(c.ts, em, 0.3, wasAte(c, e));
  if (o <= 0.001) return null;
  const p = e.dur === 0 ? 1 : fase(c.ts, em, em + (e.dur ?? 0.7)), col = NF(e);
  const pid = 'sch' + Math.round(e.x) + '_' + Math.round(e.y);
  return (
    <g opacity={o}>
      {e.schraffur && <defs><pattern id={pid} width={16} height={16} patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width={16} height={16} fill="rgba(233,225,207,0.08)" /><line x1={0} y1={0} x2={0} y2={16} stroke="rgba(233,225,207,0.38)" strokeWidth={2} /></pattern></defs>}
      {e.schraffur && <rect x={e.x} y={e.y} width={e.w * p} height={e.h} fill={`url(#${pid})`} />}
      <rect x={e.x} y={e.y} width={e.w * p} height={e.h} rx={e.rx ?? 0} fill={e.fuell === 0 || e.fuell === undefined ? 'none' : col} fillOpacity={e.fuell ?? 0} stroke={e.strich === 0 ? 'none' : col} strokeWidth={e.strich ?? 3} strokeDasharray={e.gestrichelt ? '12 8' : undefined} />
      {e.text && <text x={e.x + e.w / 2} y={e.y + e.h / 2 + (e.textpt ?? 34) * 0.35} fill={e.textfarbe ?? col} fontFamily={FS(e.schrift ?? 'mono')} fontWeight={600} fontSize={e.textpt ?? 34} letterSpacing={e.abstand ?? 0} textAnchor="middle" opacity={p}>{e.text}</text>}
    </g>
  );
};

const LinieEl: React.FC<{c: Ctx; e: any}> = ({c, e}) => {
  const em = wasEm(c, e), o = sichtbar(c.ts, em, 0.2, wasAte(c, e));
  if (o <= 0.001) return null;
  const p = fase(c.ts, em, em + (e.dur ?? 0.6));
  return <line x1={e.x1} y1={e.y1} x2={e.x1 + (e.x2 - e.x1) * p} y2={e.y1 + (e.y2 - e.y1) * p} stroke={e.farbe ?? C.papier} strokeWidth={e.strich ?? 3} strokeDasharray={e.gestrichelt ? '8 7' : undefined} opacity={o * (e.deckkraft ?? 1)} strokeLinecap="round" />;
};

const BogenEl: React.FC<{c: Ctx; e: any}> = ({c, e}) => {
  const em = wasEm(c, e), o = sichtbar(c.ts, em, 0.2, wasAte(c, e));
  if (o <= 0.001) return null;
  const d = bogen(e.x, e.y, e.r ?? 100, e.von ?? 180, e.bis ?? 270);
  return <path d={d} fill="none" stroke={e.farbe ?? C.cyan} strokeWidth={e.strich ?? 4} opacity={o} {...zeichne(fase(c.ts, em, em + (e.dur ?? 0.6)), d)} />;
};

const WuerfelEl: React.FC<{c: Ctx; e: any}> = ({c, e}) => {
  const em = wasEm(c, e), n = e.stapel ?? 1, u = e.u ?? 58, col = NF(e);
  const a = u * 0.866, b = u * 0.5;
  const cube = (x: number, y: number, op: number, k: string) => (
    <g key={k} opacity={op} stroke={C.grund} strokeWidth={2} strokeLinejoin="round">
      <polygon points={`${x - a},${y - u - b} ${x},${y - u} ${x},${y} ${x - a},${y - b}`} fill={col} fillOpacity={0.55} />
      <polygon points={`${x},${y - u} ${x + a},${y - u - b} ${x + a},${y - b} ${x},${y}`} fill={col} fillOpacity={0.8} />
      <polygon points={`${x},${y - u} ${x + a},${y - u - b} ${x},${y - u - 2 * b} ${x - a},${y - u - b}`} fill={col} fillOpacity={1} />
    </g>
  );
  const cells: [number, number, number][] = [];
  for (let k = 0; k < n; k++) for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) cells.push([i, j, k]);
  cells.sort((p, q) => (p[0] + p[1]) - (q[0] + q[1]) || p[2] - q[2]);
  const per = e.versatz ?? 0.1;
  return (
    <g>
      {cells.map(([i, j, k], idx) => {
        const q = fase(c.ts, em + idx * per, em + idx * per + 0.35);
        if (q <= 0) return null;
        const px = e.x + (i - j) * u * 0.866, py = e.y + (i + j) * u * 0.5 - k * u;
        return cube(px, py - (1 - q) * 30, q, 'c' + idx);
      })}
      {e.text && <text x={e.x} y={e.y + (e.texty ?? 50) + (n > 1 ? 20 : 0)} fill={e.textfarbe ?? col} fontFamily={F.mono} fontSize={24} textAnchor="middle" opacity={sichtbar(c.ts, em + 0.2, 0.4)}>{e.text}</text>}
    </g>
  );
};

const ChipEl: React.FC<{c: Ctx; e: any}> = ({c, e}) => {
  const em = wasEm(c, e), o = sichtbar(c.ts, em, 0.4, wasAte(c, e));
  if (o <= 0.001) return null;
  const col = NF(e);
  return (
    <Anker x={e.x ?? 0} y={e.y ?? 0} ausr={e.ausr}>
      <div style={{display: 'inline-block', opacity: o, transform: `translateY(${(1 - o) * 10}px)`, padding: e.pad ?? '8px 18px', border: `${e.strich ?? 1.5}px solid ${col}`, color: col, background: e.fuell ? `rgba(242,193,78,0.12)` : 'rgba(13,15,18,0.4)',
        fontFamily: FS(e.schrift ?? 'mono'), fontWeight: e.schrift === 'titel' ? 500 : undefined, fontSize: e.groesse ?? 30, letterSpacing: e.abstand ?? 2}}>{e.text}</div>
    </Anker>
  );
};

const SiegelEl: React.FC<{c: Ctx; e: any}> = ({c, e}) => (
  <Siegel tv={c.ts} em={wasEm(c, e)} ate={wasAte(c, e)} text={e.text} unter={e.unter} farbe={e.farbe ?? C.signal} groesse={e.groesse ?? 100} drehung={e.drehung ?? -7} style={{left: e.x, top: e.y}} />
);

const RasterEl: React.FC<{c: Ctx; e: any}> = ({c, e}) => {
  const em = wasEm(c, e), sp = e.spalten ?? 4, ze = e.zeilen ?? 2, w = e.w ?? 164, h = e.h ?? 84, ab = e.abstand ?? 12, N = sp * ze, col = e.farbe ?? C.rot, dauer = e.dauer ?? 1.2;
  return (
    <g>
      {Array.from({length: N}, (_, i) => {
        const pop = federn(c.ts, em + (i * dauer) / N, 0.35);
        if (pop <= 0.001) return null;
        const x = e.x + (i % sp) * (w + ab), y = e.y + Math.floor(i / sp) * (h + ab);
        return (
          <g key={i} transform={`translate(${x + w / 2},${y + h / 2}) scale(${0.7 + 0.3 * pop})`} opacity={Math.min(1, pop * 1.5)}>
            <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={4} fill={col} fillOpacity={0.22} stroke={col} strokeWidth={3.5} />
            {e.text && <text x={0} y={(e.textpt ?? 34) * 0.35} fill={col} fontFamily={F.mono} fontWeight={600} fontSize={e.textpt ?? 34} textAnchor="middle" letterSpacing={4}>{e.text}</text>}
          </g>
        );
      })}
    </g>
  );
};

// Zahlenstrahl mit Bereichen (Unsicherheit, Wertebereich)
const SkalaEl: React.FC<{c: Ctx; e: any}> = ({c, e}) => {
  const em = wasEm(c, e), o = sichtbar(c.ts, em, 0.5, wasAte(c, e));
  if (o <= 0.001) return null;
  const X0 = e.x ?? 520, W = e.breite ?? 880, Y = e.y ?? 790, mn = e.min ?? 5, mx = e.max ?? 35;
  const fx = (v: number) => X0 + ((v - mn) / (mx - mn)) * W;
  return (
    <g>
      <g opacity={o}>
        {e.label && <text x={X0} y={Y - 70} fill={C.papier} fontFamily={F.text} fontSize={30} fontWeight={500}>{e.label}</text>}
        <line x1={X0} x2={X0 + W} y1={Y} y2={Y} stroke="rgba(233,225,207,0.6)" strokeWidth={2} />
        {(e.ticks ?? []).map((m: number) => (
          <g key={m}>
            <line x1={fx(m)} x2={fx(m)} y1={Y} y2={Y + 12} stroke="rgba(233,225,207,0.6)" strokeWidth={2} />
            <text x={fx(m)} y={Y + 46} fill={C.grau} fontFamily={F.mono} fontSize={24} textAnchor="middle">{c.n(m, e.stellen ?? 0)}</text>
          </g>
        ))}
        {e.einheit && <text x={X0 + W + 20} y={Y + 46} fill={C.grau} fontFamily={F.mono} fontSize={24}>{e.einheit}</text>}
      </g>
      {(e.bereiche ?? []).map((b: any, i: number) => {
        const be = c.z(b.em, em + 0.5), p = fase(c.ts, be, be + (b.dur ?? 1.1)), col = b.farbe ?? C.signal, hh = b.hoehe ?? 22, yy = Y - 34 - hh;
        return (
          <g key={i} opacity={p > 0 ? 1 : 0}>
            <rect x={fx(b.von)} y={yy} width={Math.max(0, (fx(b.bis) - fx(b.von)) * p)} height={hh} fill={col} fillOpacity={0.08} stroke={col} strokeWidth={2.5} strokeDasharray={b.gestrichelt === false ? undefined : '12 8'} />
            {b.kern && <rect x={fx(b.kern[0])} y={yy} width={Math.max(0, (fx(b.kern[1]) - fx(b.kern[0])) * p)} height={hh} fill={col} fillOpacity={0.35} />}
            <path d={`M${fx(b.von)} ${yy - 14}V${yy + hh + 14}M${fx(b.bis)} ${yy - 14}V${yy + hh + 14}`} stroke={col} strokeWidth={4} opacity={p} />
            {b.text && <text x={fx(b.von)} y={yy - 34} fill={col} fontFamily={F.mono} fontSize={24} letterSpacing={1} opacity={sichtbar(c.ts, be + 0.8, 0.5)}>{b.text}</text>}
          </g>
        );
      })}
    </g>
  );
};

const LkwEl: React.FC<{c: Ctx; e: any}> = ({c, e}) => {
  const em = wasEm(c, e), p = fase(c.ts, em, em + 0.6);
  if (p <= 0) return null;
  return <Lkw x={e.x + (1 - p) * -40} y={e.y} gr={e.gr ?? 0.95} tv={c.ts} fahrt={p > 0.99 ? 1 : 0} o={p} />;
};
const SchaleEl: React.FC<{c: Ctx; e: any}> = ({c, e}) => {
  const em = wasEm(c, e);
  return <Schale tv={c.tv} x={e.x ?? 1530} y={e.y ?? 620} laenge={e.laenge ?? 640} radius={e.radius ?? 120} p={fase(c.ts, em, em + (e.dur ?? 2))} o={e.o ?? 0.3} neigung={e.neigung ?? -14} />;
};

const TexEl: React.FC<{c: Ctx; e: any}> = ({c, e}) => {
  const em = wasEm(c, e), o = sichtbar(c.ts, em, 0.45, wasAte(c, e));
  if (o <= 0.001) return null;
  const pu = e.puls ? Math.max(0, 1 - Math.abs(c.ts - c.z(e.puls, em + 0.3)) / 0.9) : 0;
  const col = e.farbe ?? C.papier;
  const inner = <Tex tex={e.tex} groesse={e.groesse ?? 64} farbe={col} />;
  return (
    <Anker x={e.x ?? 960} y={e.y ?? 500} ausr={e.ausr}>
      <div style={{opacity: o, transform: `translateY(${(1 - o) * 14}px)`}}>
        {e.rahmen ? <div style={{display: 'inline-flex', padding: '10px 34px', border: `3px solid ${e.rahmenfarbe ?? col}`, background: `rgba(242,193,78,${0.08 + 0.16 * pu})`, boxShadow: `0 0 ${30 * pu}px rgba(242,193,78,${0.45 * pu})`}}>{inner}</div> : inner}
        {e.unter && <div style={{marginTop: 18, fontFamily: F.mono, fontSize: 24, color: C.grau, letterSpacing: 1}}>{e.unter}</div>}
      </div>
    </Anker>
  );
};

const PfeilEl: React.FC<{c: Ctx; e: any}> = ({c, e}) => {
  const em = wasEm(c, e), o = sichtbar(c.ts, em, 0.2, wasAte(c, e));
  if (o <= 0.001) return null;
  const p = fase(c.ts, em, em + (e.dur ?? 0.6));
  if (e.offen) {
    const col = e.farbe ?? C.papier, sw = e.strich ?? 3, sp = e.spitze ?? 18;
    const kopf = (xa: number, ya: number, xb: number, yb: number) => {
      const a = Math.atan2(yb - ya, xb - xa);
      return `M${xb + sp * Math.cos(a + Math.PI - 0.5)} ${yb + sp * Math.sin(a + Math.PI - 0.5)}L${xb} ${yb}L${xb + sp * Math.cos(a + Math.PI + 0.5)} ${yb + sp * Math.sin(a + Math.PI + 0.5)}`;
    };
    const xe = e.x1 + (e.x2 - e.x1) * p, ye = e.y1 + (e.y2 - e.y1) * p;
    return (
      <g opacity={o} fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M${e.x1} ${e.y1}L${xe} ${ye}`} strokeDasharray={e.gestrichelt ? '8 6' : undefined} />
        {p > 0.05 && <path d={kopf(e.x1, e.y1, xe, ye)} />}
        {e.doppelt && p > 0.05 && <path d={kopf(xe, ye, e.x1, e.y1)} />}
      </g>
    );
  }
  return (
    <g opacity={o}>
      <Pfeil x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} p={p} farbe={e.farbe ?? C.papier} breite={e.strich ?? 4} spitze={e.spitze ?? 18} gestrichelt={e.gestrichelt} />
      {e.doppelt && <Pfeil x1={e.x2} y1={e.y2} x2={e.x1} y2={e.y1} p={p} farbe={e.farbe ?? C.papier} breite={e.strich ?? 4} spitze={e.spitze ?? 18} gestrichelt={e.gestrichelt} />}
    </g>
  );
};

const IkonElem: React.FC<{c: Ctx; e: any}> = ({c, e}) => {
  const em = wasEm(c, e), o = sichtbar(c.ts, em, 0.3, wasAte(c, e));
  if (o <= 0.001) return null;
  return <div style={{position: 'absolute', left: e.x, top: e.y, opacity: o}}><Ikon name={e.name} p={fase(c.ts, em, em + 0.9)} tv={c.ts} farbe={e.farbe} groesse={e.groesse ?? 100} /></div>;
};


// freier SVG-Pfad (Silhouetten, Symbole): d in lokalen Koordinaten, an (x, y) gesetzt, gedreht um `drehung` Grad
const PfadEl: React.FC<{c: Ctx; e: any}> = ({c, e}) => {
  const em = wasEm(c, e), o = sichtbar(c.ts, em, 0.3, wasAte(c, e));
  if (o <= 0.001) return null;
  const col = e.farbe ?? C.papier;
  return (
    <g transform={`translate(${e.x ?? 0},${e.y ?? 0}) rotate(${e.drehung ?? 0}) scale(${e.skala ?? 1})`} opacity={o}>
      <path d={e.d} fill={e.fuell ? col : 'none'} fillOpacity={e.fuell ?? 0} stroke={col} strokeWidth={e.strich ?? 3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={e.gestrichelt ? '8 7' : undefined} />
    </g>
  );
};

// gestrichelter Rahmen mit Eckwinkeln (Hinweis-/Warnkasten)
const RahmenEl: React.FC<{c: Ctx; e: any}> = ({c, e}) => {
  const em = wasEm(c, e), p = fase(c.ts, em, em + (e.dur ?? 1.05));
  if (p <= 0) return null;
  const x = e.x ?? 150, y = e.y ?? 200, w = e.w ?? 1620, h = e.h ?? 700, col = e.farbe ?? C.signal, per = 2 * (w + h);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={col} fillOpacity={e.fuell ?? 0.05} stroke={col} strokeWidth={3} strokeDasharray={`${p * per} ${per}`} />
      {e.ecken !== false && [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].map(([a, b, sa, sb], i) => (
        <path key={i} d={`M${a} ${b + 40 * sb}V${b}H${a + 40 * sa}`} fill="none" stroke={col} strokeWidth={8} opacity={p} />
      ))}
    </g>
  );
};

const SVG_TYPEN: Record<string, React.FC<{c: Ctx; e: any}>> = {kreis: KreisEl, rechteck: RechteckEl, linie: LinieEl, pfeil: PfeilEl, bogen: BogenEl, wuerfel: WuerfelEl, raster: RasterEl, skala: SkalaEl, rahmen: RahmenEl, pfad: PfadEl};
const DIV_TYPEN: Record<string, React.FC<{c: Ctx; e: any}>> = {text: TextEl, zahl: ZahlEl, tex: TexEl, chip: ChipEl, siegel: SiegelEl, ikon: IkonElem, lkw: LkwEl, schale: SchaleEl, karte: PapierEl, balken: BalkenEl};

export const Deko: React.FC<{c: Ctx; el?: any[]}> = ({c, el}) => {
  if (!el || !el.length) return null;
  return (
    <>
      {el.map((e, i) => {
        if (SVG_TYPEN[e.typ]) {
          const K = SVG_TYPEN[e.typ];
          return <svg key={i} width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}><K c={c} e={e} /></svg>;
        }
        if (e.typ === 'kurve') return <KurveEl key={i} c={c} e={e} />;
        const D = DIV_TYPEN[e.typ];
        return D ? <D key={i} c={c} e={e} /> : null;
      })}
    </>
  );
};

// Rahmen: Heft-Hintergrund + Kopfzeile + Fortschritt + Fuss/Quelle + Deko. children = Inhalt der Szene.
export const Rahmen: React.FC<{c: Ctx; p: any; children?: React.ReactNode; kopfEm?: number; huelle?: React.CSSProperties}> = ({c, p, children, kopfEm, huelle}) => {
  const f = p.fortschritt;
  const idx = f ? (f.von ?? 0) + ((f.bis ?? f.von ?? 0) - (f.von ?? 0)) * fase(c.ts, c.z(f.ab, 0), c.z(f.ende, c.d)) : 0;
  return (
    <Heft tv={c.tv} t0={c.S0} zoom={p.zoom ?? 0.0014} rand={p.fuss}>
      <div style={{position: 'absolute', inset: 0, ...huelle}}>
        {p.kopf && <KopfK c={c} k={p.kopf} emStd={kopfEm ?? 0} />}
        {f && <Fortschritt tv={c.ts} idx={idx} labels={f.labels} em={c.z(f.em, 0)} ate={f.ate !== undefined ? c.z(f.ate) : undefined} />}
        {children}
        <Deko c={c} el={p.deko} />
      </div>
      {p.quelle && QUELLEN_IM_BILD && <div style={{position: 'absolute', right: 56, bottom: 36, fontFamily: F.mono, fontSize: 18, letterSpacing: 1.5, color: 'rgba(233,225,207,0.45)', opacity: sichtbar(c.ts, 0.5, 0.6), textAlign: 'right'}}>{p.quelle}</div>}
    </Heft>
  );
};

export {mix, rtLaenge};
