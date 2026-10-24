// Titel (Kapitel-/Typokarte) und Liste (Hero-Titel + Zeilen mit Ikone / Checkliste). Hinweis = Liste mit Hero.
import React from 'react';
import {C, F, fase, sichtbar} from '../../ui/basis';
import {mix} from '../../ui/u1_heft';
import {KitProps} from '../tipos';
import {Ctx, mkCtx, Rt, rtLaenge, Caret} from './lib';
import {Rahmen} from './deko';
import {Ikon} from './ikonen';

// ---------- Hero: grosses Wort mit Wipe + Unterzeile (Segmente mit eigener Einsatzzeit) ----------
export const Hero: React.FC<{c: Ctx; h: any}> = ({c, h}) => {
  const em = c.z(h.em, 0.1);
  const g = h.groesse ?? 190, ab = h.abstand ?? 34;
  const o = fase(c.ts, em - 0.1, em + 0.7), wipe = h.wipe === false ? 1 : fase(c.ts, em - 0.1, em + 0.9);
  const hq = h.hoch !== undefined ? Math.max(0, Math.min(1, (c.ts - c.z(h.hoch)) / (h.hochDauer ?? 1.8))) : 0;
  const hoch = 0.5 - 0.5 * Math.cos(Math.PI * hq);
  const unter: any[] = typeof h.unter === 'string' ? [{text: h.unter, em: em + 0.6}] : (h.unter ?? []);
  const nTipp = h.tippen ? Math.max(0, Math.floor((c.ts - em) * h.tippen)) : undefined;
  const text: string = h.titel ?? '';
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: h.y ?? 380, textAlign: 'center',
      transform: `translate3d(0, ${mix(0, h.hochY ?? -250, hoch).toFixed(3)}px, 0) scale(${mix(1, h.hochScale ?? 0.56, hoch).toFixed(4)})`, transformOrigin: '50% 0%'}}>
      {h.kicker && <div style={{fontFamily: F.mono, fontSize: 26, letterSpacing: 8, color: C.grau, marginBottom: 18, opacity: sichtbar(c.ts, em - 0.2, 0.5)}}>{h.kicker}</div>}
      <div style={{display: 'inline-block', clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`, opacity: o}}>
        <div style={{fontFamily: F.titel, fontWeight: 600, fontSize: g, letterSpacing: ab, color: h.farbe ?? C.papier, lineHeight: 1, paddingLeft: ab}}>
          <Rt text={text} n={nTipp} />{nTipp !== undefined && nTipp < rtLaenge(text) + 12 && <Caret ts={c.ts} hoehe={g} />}
        </div>
      </div>
      {unter.length > 0 && (
        <div style={{marginTop: 26, fontFamily: F.mono, fontSize: h.unterpt ?? 40, letterSpacing: 3, color: h.unterfarbe ?? C.signal}}>
          {unter.map((u, i) => <span key={i} style={{opacity: sichtbar(c.ts, c.z(u.em, em + 0.6 + i * 0.4), 0.4), fontWeight: u.fett ? 600 : undefined, color: u.farbe}}>{u.text}</span>)}
        </div>
      )}
    </div>
  );
};

// ---------- Titel ----------
export const Titel: React.FC<KitProps<any>> = ({t, b, p}) => {
  const c = mkCtx(b, t, p);
  const em = c.z(p.em, 0.1);
  const stil = p.stil ?? 'kapitel';
  const aus = p.aus !== undefined ? c.z(p.aus) : undefined;
  const k = aus === undefined ? 0 : fase(c.ts, aus, aus + 0.9);
  const nTipp = p.tippen ? Math.max(0, Math.floor((c.ts - em) * p.tippen)) : undefined;
  let inhalt: React.ReactNode;
  if (stil === 'gross') {
    inhalt = <Hero c={c} h={{...p, titel: p.titel, em: p.em ?? 0.1}} />;
  } else if (stil === 'zeile') {
    const y = p.y ?? 250;
    const kO = sichtbar(c.ts, c.z(p.kickerEm, em), 0.5, p.kickerAte !== undefined ? c.z(p.kickerAte) : undefined);
    const tO = sichtbar(c.ts, c.z(p.titelEm, em), 0.6);
    const g = p.groesse ?? 96;
    inhalt = (
      <>
        {p.kicker && <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', fontFamily: F.mono, fontSize: p.kickerpt ?? 30, letterSpacing: 9, color: p.kickerfarbe ?? C.signal, opacity: kO}}>{p.kicker}</div>}
        <div style={{position: 'absolute', left: 0, right: 0, top: y + (p.kicker ? 80 : 0), textAlign: 'center', fontFamily: F.titel, fontWeight: 500, fontSize: g, letterSpacing: 3, color: C.papier, opacity: tO, transform: `translateY(${(1 - tO) * 14}px)`}}>
          <Rt text={p.titel ?? ''} n={nTipp} />{nTipp !== undefined && <Caret ts={c.ts} hoehe={g} />}
        </div>
        {p.unter && <div style={{position: 'absolute', left: 0, right: 0, top: y + (p.kicker ? 80 : 0) + g * 1.4, textAlign: 'center', fontFamily: F.text, fontWeight: 500, fontSize: 44, color: C.grau, opacity: sichtbar(c.ts, c.z(p.unterEm, em + 0.8), 0.5)}}>{p.unter}</div>}
      </>
    );
  } else {
    const o = fase(c.ts, em, em + 0.7), wipe = fase(c.ts, em, em + 0.9), zahl = fase(c.ts, em + 0.25, em + 1.2), th = p.unter ? fase(c.ts, em + 0.9, em + 1.6) : 0;
    const g = p.groesse ?? 132;
    inhalt = (
      <div style={{position: 'absolute', inset: 0, opacity: o * (1 - k), transform: `translateY(${-k * 120}px) scale(${1 - 0.25 * k})`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: p.y ?? 330, textAlign: 'center'}}>
          {p.kicker && <div style={{fontFamily: F.mono, fontSize: 24, letterSpacing: 10, color: C.grau, opacity: o}}>{p.kicker}</div>}
          <div style={{marginTop: 18, display: 'inline-flex', alignItems: 'center', clipPath: nTipp !== undefined ? undefined : `inset(0 ${(1 - wipe) * 100}% 0 0)`}}>
            <span style={{fontFamily: F.titel, fontWeight: 600, fontSize: g, letterSpacing: g * 0.106, color: C.papier}}><Rt text={p.titel ?? ''} n={nTipp} />{nTipp !== undefined && <Caret ts={c.ts} hoehe={g} />}</span>
          </div>
          {p.teil && (
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28, marginTop: 8}}>
              <div style={{height: 1.5, width: 260 * zahl, background: C.signal, opacity: 0.8}} />
              <span style={{fontFamily: F.titel, fontWeight: 400, fontSize: 64, letterSpacing: 8, color: C.signal, opacity: zahl}}>{p.teil}</span>
              <div style={{height: 1.5, width: 260 * zahl, background: C.signal, opacity: 0.8}} />
            </div>
          )}
          {p.unter && <div style={{marginTop: 30, fontFamily: F.text, fontWeight: 500, fontSize: 40, letterSpacing: 2, color: C.papier, opacity: th * 0.85, transform: `translateY(${(1 - th) * 10}px)`}}>{p.unter}</div>}
        </div>
      </div>
    );
  }
  // Kopfzeile: bei `aus` faehrt der Titel in die Kopfzeile (kopf.em Standard = aus + 0.5)
  return <Rahmen c={c} p={p} kopfEm={aus !== undefined ? aus + 0.5 : 0}>{inhalt}</Rahmen>;
};

// ---------- Liste ----------
const IkonZeile: React.FC<{c: Ctx; z: any; i: number; y: number; x: number; x2: number}> = ({c, z, i, y, x, x2}) => {
  const em = c.z(z.em, 0.5 + i * 1.2);
  const o = sichtbar(c.ts, em, 0.5);
  if (o <= 0.001) return null;
  const p = fase(c.ts, em, em + 1.0), scan = fase(c.ts, em + 0.2, em + 1.3);
  const farbe = z.farbe ?? C.grau, tf = z.titelfarbe ?? C.papier;
  const r = z.rechts;
  const re = r ? c.z(r.em, em + 0.8) : 0;
  const qp = r ? fase(c.ts, re, re + 1.0) : 0;
  return (
    <>
      <div style={{position: 'absolute', left: x, top: y, width: 1000, height: 112, opacity: o}}>
        <div style={{position: 'absolute', left: 0, top: 6}}><Ikon name={z.ikon ?? 'punkt'} p={z.ikon === 'quellen' ? Math.max(p, qp) : p} tv={c.ts} farbe={z.ikonfarbe} groesse={100} /></div>
        <div style={{position: 'absolute', left: 140, top: 4, transform: `translateX(${(1 - o) * -24}px)`}}>
          <div style={{fontFamily: F.titel, fontWeight: 500, fontSize: 48, letterSpacing: 2, color: tf}}><Rt text={z.titel ?? ''} /></div>
          {z.detail && <div style={{fontFamily: F.mono, fontSize: 27, color: farbe, marginTop: 2, letterSpacing: 0.5}}><Rt text={z.detail} /></div>}
        </div>
        <div style={{position: 'absolute', left: 140, right: 0, bottom: -6, height: 1, background: 'rgba(233,225,207,0.12)'}} />
        <div style={{position: 'absolute', left: 140 + scan * 840, bottom: -7, width: 60, height: 3, background: farbe, opacity: Math.sin(scan * Math.PI) * 0.9}} />
      </div>
      {r && r.typ === 'vergleich' && (
        <div style={{position: 'absolute', left: x2, top: y + 8, display: 'flex', alignItems: 'center', gap: 22, opacity: sichtbar(c.ts, re, 0.5)}}>
          <div style={{fontFamily: F.mono, fontWeight: 600, fontSize: 46, color: r.farbeA ?? C.signal, transform: `translateX(${(1 - qp) * 30}px)`}}>{r.a}</div>
          <div style={{fontFamily: F.titel, fontSize: 52, color: C.signal, opacity: 0.55 + 0.45 * Math.sin(c.ts * 5)}}>{r.symbol ?? '≠'}</div>
          <div style={{fontFamily: F.mono, fontWeight: 600, fontSize: 46, color: r.farbeB ?? C.papier, transform: `translateX(${(qp - 1) * 30}px)`}}>{r.b}</div>
        </div>
      )}
      {r && r.typ === 'fehler' && (
        <div style={{position: 'absolute', left: x2, top: y + 28, opacity: sichtbar(c.ts, re, 0.6)}}>
          <svg width={500} height={70}>
            <rect x={6} y={14} width={150 * fase(c.ts, re, re + 0.8)} height={40} fill="none" stroke={C.grau} strokeWidth={3} strokeDasharray="9 7" />
            <path d="M6 6V62M156 6V62" stroke={C.grau} strokeWidth={2.4} strokeDasharray="5 5" opacity={fase(c.ts, re + 0.4, re + 0.9)} />
            <text x={176} y={46} fill={C.grau} fontFamily={F.mono} fontSize={28}>{r.text ?? '± ?'}</text>
          </svg>
        </div>
      )}
      {r && r.typ === 'text' && (
        <div style={{position: 'absolute', left: x2, top: y + 12, opacity: sichtbar(c.ts, re, 0.5), fontFamily: F.mono, fontWeight: 600, fontSize: 46, color: r.farbe ?? C.signal}}><Rt text={r.text} /></div>
      )}
    </>
  );
};

export const Liste: React.FC<KitProps<any>> = ({t, b, p}) => {
  const c = mkCtx(b, t, p);
  const zeilen: any[] = p.zeilen ?? [];
  const x = p.x ?? 250, x2 = p.x2 ?? 1180, y0 = p.y0 ?? (p.held ? 310 : 300), ab = p.abstand ?? 124;
  const sch = p.schluss;
  let huelle: React.CSSProperties | undefined;
  if (sch) {
    const atem = sch.atem !== undefined ? c.z(sch.atem) : undefined;
    const aus = sch.aus !== undefined ? c.z(sch.aus) : undefined;
    const sc = atem !== undefined ? 1 + 0.006 * Math.sin((c.ts - atem) * 3.2) * fase(c.ts, atem, atem + 0.5) : 1;
    const op = aus !== undefined ? 1 - 0.55 * fase(c.ts, aus, aus + 0.64) : 1;
    huelle = {opacity: op, transform: `scale(${sc})`};
  }
  return (
    <Rahmen c={c} p={p} huelle={huelle}>
      {p.held && <Hero c={c} h={p.held} />}
      {zeilen.map((z, i) => <IkonZeile key={i} c={c} z={z} i={i} y={z.y ?? y0 + i * ab} x={x} x2={x2} />)}
    </Rahmen>
  );
};
