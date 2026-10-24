// Vergleich: Spalten/Karten nebeneinander (Gegenueberstellung, Konflikt, Soll/Ist) mit Symbol in der Mitte. Zahl: grosse Zahl(en) mit Zaehler. Balken: Balkenvergleich.
import React from 'react';
import {C, F, fase, sichtbar} from '../../ui/basis';
import {KitProps} from '../tipos';
import {Ctx, mkCtx, Rt} from './lib';
import {Rahmen, ZahlEl, zaehl} from './deko';
import {BalkenEl} from './balken';

const Spalte: React.FC<{c: Ctx; s: any; i: number; n: number}> = ({c, s, i, n}) => {
  const {ts} = c;
  const gap = n === 2 ? 140 : 60, w = s.w ?? (1660 - gap * (n - 1)) / n;
  const x = s.x ?? 130 + i * (w + gap), y = s.y ?? 300;
  const em = c.z(s.em, 0.2 + i * 0.4), o = sichtbar(ts, em, 0.5, s.ate !== undefined ? c.z(s.ate) : undefined) * (s.dim ?? 1);
  if (o <= 0.001) return null;
  const farbe = s.farbe, rahmen = s.rahmen ?? (farbe ? 3 : 0), mitte = s.mitte;
  const pulse = s.puls ? 0.5 + 0.5 * Math.sin(ts * 5) : 0;
  const fe = (z: any, fb: number) => sichtbar(ts, c.z(z, fb), 0.5);
  const al = mitte ? 'center' : 'left';
  const fall = s.anhang && s.anhang.ate !== undefined ? fase(ts, c.z(s.anhang.ate) - 0.05, c.z(s.anhang.ate) + 0.55) : 0;
  let wert = s.wert;
  if (typeof wert === 'number') {
    const v = s.bis !== undefined ? zaehl(c, {von: s.wert, bis: s.bis, em: s.wertEm, dauer: s.zaehlDauer ?? 1.1}, em) : s.wert;
    wert = c.n(v, s.stellen ?? 0);
  }
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: s.h, boxSizing: 'border-box', padding: s.pad ?? (rahmen ? '30px 38px' : 0), border: rahmen ? `${rahmen}px solid ${farbe}` : undefined,
      background: s.fuell ?? (rahmen ? 'rgba(22,26,31,0.7)' : undefined), opacity: o, transform: `translateY(${(1 - o) * 14}px)`, textAlign: al,
      boxShadow: pulse > 0 ? `0 0 ${20 + 18 * pulse}px rgba(242,193,78,${0.12 + 0.1 * pulse})` : undefined}}>
      {s.kicker && <div style={{fontFamily: F.mono, fontSize: s.kickerpt ?? 24, letterSpacing: s.kickerabstand ?? 5, color: s.kickerfarbe ?? farbe ?? C.grau, textTransform: 'uppercase'}}>{s.kicker}</div>}
      {s.klein && <div style={{marginTop: 30, fontFamily: F.text, fontWeight: 500, fontSize: s.kleinpt ?? 46, color: C.papier, letterSpacing: 1, opacity: fe(s.kleinEm, em)}}>{s.klein}</div>}
      {s.label && <div style={{marginTop: 20, fontFamily: F.text, fontWeight: 500, fontSize: s.labelpt ?? 46, color: s.labelfarbe ?? C.papier, opacity: fe(s.labelEm, em + 0.2)}}>{s.label}</div>}
      {s.titel && (
        <div style={{marginTop: s.titelabstand ?? 10, fontFamily: F.titel, fontWeight: 600, fontSize: s.titelpt ?? 96, letterSpacing: s.titelabstandx ?? 2, lineHeight: 1.05, color: s.titelfarbe ?? C.papier, opacity: fe(s.titelEm, em + 0.3)}}>
          <Rt text={s.titel} />
          {s.anhang && <span style={{display: 'inline-block', opacity: 1 - fall, transform: `translateY(${fall * 320}px) rotate(${fall * 24}deg)`, marginLeft: 14}}>{s.anhang.text}</span>}
        </div>
      )}
      {wert !== undefined && <div style={{marginTop: 18, fontFamily: F.titel, fontWeight: 600, fontSize: s.wertpt ?? 210, color: s.wertfarbe ?? C.papier, lineHeight: 1, letterSpacing: 2, fontVariantNumeric: 'tabular-nums', opacity: fe(s.wertEm, em + 0.4)}}>{wert}</div>}
      {s.einheit && <div style={{fontFamily: F.mono, fontSize: s.einheitpt ?? 44, color: s.einheitfarbe ?? s.wertfarbe ?? C.grau, marginTop: 4, opacity: fe(s.wertEm, em + 0.4)}}>{s.einheit}</div>}
      {s.label2 && <div style={{fontFamily: F.text, fontWeight: 500, fontSize: s.label2pt ?? 76, color: s.label2farbe ?? C.papier, letterSpacing: 2, opacity: fe(s.label2Em, em + 0.3)}}>{s.label2}</div>}
      {s.unter && <div style={{marginTop: s.unterabstand ?? 22, fontFamily: F.mono, fontSize: s.unterpt ?? 24, letterSpacing: 3, color: C.grau, opacity: fe(s.unterEm, em + 0.6)}}>{s.unter}</div>}
      {(s.zeilen ?? []).map((z: any, k: number) => {
        const ze = c.z(z.em, em + 0.6 + k * 0.4), zo = sichtbar(ts, ze, 0.4);
        return (
          <div key={k} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18, fontFamily: F.mono, fontSize: 30, opacity: zo, transform: `translateX(${(1 - zo) * 16}px)`}}>
            <span style={{color: C.grau}}>{z.k}</span><span style={{color: z.farbe ?? C.papier, fontSize: 40, fontWeight: 500}}><Rt text={z.v} /></span>
          </div>
        );
      })}
      {s.notiz && <div style={{marginTop: 22, fontFamily: F.mono, fontSize: 22, color: C.grau, opacity: fe(s.notizEm, em + 2)}}>{s.notiz}</div>}
    </div>
  );
};

export const Vergleich: React.FC<KitProps<any>> = ({t, b, p}) => {
  const c = mkCtx(b, t, p);
  const sp: any[] = p.spalten ?? [];
  const m = p.mitte;
  let mitteNode: React.ReactNode = null;
  if (m) {
    const me = c.z(m.em, 1), mo = sichtbar(c.ts, me, 0.4, m.ate !== undefined ? c.z(m.ate) : undefined), pulse = 0.5 + 0.5 * Math.sin(c.ts * 5);
    const mx = m.x ?? 960, my = m.y ?? 520;
    if (m.typ === 'chevron') {
      mitteNode = (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <g opacity={mo} transform={`translate(${mx + (1 - mo) * -20}, ${my})`} fill="none" stroke={m.farbe ?? C.signal} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round">
            <path d="M-50 -60L10 0L-50 60" /><path d="M10 -60L70 0L10 60" />
          </g>
        </svg>
      );
    } else {
      mitteNode = (
        <div style={{position: 'absolute', left: mx - 100, top: my - (m.groesse ?? 250) * 0.6, width: 200, textAlign: 'center', fontFamily: F.titel, fontWeight: 600, fontSize: m.groesse ?? 250, color: m.farbe ?? C.signal,
          opacity: mo * (m.puls === false ? 1 : 0.7 + 0.3 * pulse), transform: `scale(${0.8 + 0.2 * mo})`, textShadow: '0 0 30px rgba(0,0,0,0.9)'}}>{m.text}</div>
      );
    }
  }
  return (
    <Rahmen c={c} p={p}>
      {sp.map((s, i) => <Spalte key={i} c={c} s={s} i={i} n={sp.length} />)}
      {mitteNode}
    </Rahmen>
  );
};

export const Zahl: React.FC<KitProps<any>> = ({t, b, p}) => {
  const c = mkCtx(b, t, p);
  const zahlen: any[] = p.zahlen ?? [{...p, typ: 'zahl', x: p.x ?? 960, y: p.y ?? 300, ausr: p.ausr ?? 'm'}];
  return (
    <Rahmen c={c} p={p}>
      {zahlen.map((z, i) => <ZahlEl key={i} c={c} e={z} />)}
    </Rahmen>
  );
};

export const Balken: React.FC<KitProps<any>> = ({t, b, p}) => {
  const c = mkCtx(b, t, p);
  return <Rahmen c={c} p={p}><BalkenEl c={c} e={p} /></Rahmen>;
};
