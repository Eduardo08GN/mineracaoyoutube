// Papierkarte (Zitat, Karteikarte, Archivvermerk) im Stil des gealterten Papiers; kann in eine Ecke schrumpfen.
import React from 'react';
import {F, fase, sichtbar} from '../../ui/basis';
import {zeichne, mix} from '../../ui/u1_heft';
import {Papier, FELL, FELL_I, TINTE} from '../../ui/b2_basis';
import {Ctx} from './lib';

export const PapierEl: React.FC<{c: Ctx; e: any}> = ({c, e}) => {
  const em = c.z(e.em, 0), ate = e.ate !== undefined ? c.z(e.ate) : undefined;
  const o = sichtbar(c.ts, em + 0.05, 0.5, ate);
  if (o <= 0) return null;
  const w = e.w ?? 1000, h = e.h ?? 560;
  const x0 = e.x ?? (1920 - w) / 2, y0 = e.y ?? (1080 - h) / 2 - 20, w0 = e.winkel ?? -1.2;
  let x = x0, y = y0, sc = 1, rot = w0;
  if (e.schrumpf) {
    const s = e.schrumpf, se = c.z(s.em, 0), k = fase(c.ts, se, se + (s.dauer ?? 1.0));
    x = mix(x0, s.x ?? 96, k); y = mix(y0, s.y ?? 168, k); sc = mix(1, s.scale ?? 0.3, k); rot = mix(w0, s.winkel ?? -2.4, k);
  }
  const f = (t: any, fb: number) => sichtbar(c.ts, c.z(t, fb), 0.45);
  const ink = 'rgba(43,33,25,0.7)';
  const zitat = typeof e.text === 'string' && e.text.length > 0;
  const gross: string = e.gross ?? '';
  const gfs = Math.min(e.grosspt ?? 200, Math.floor(870 / Math.max(1, gross.length * 0.68)));
  const tl = (e.text ?? '').length;
  const tfs = e.textpt ?? (tl < 80 ? 62 : tl < 160 ? 50 : 40);
  const strichD = 'M300 528 C 400 470, 500 548, 700 496';
  const ke = c.z(e.kleinEm, 1.2);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, transformOrigin: '0 0', transform: `rotate(${rot}deg) scale(${sc})`, opacity: o}}>
      <Papier style={{left: 0, top: 0, width: w, height: h}} winkel={0}>
        {e.kicker && <div style={{position: 'absolute', left: 64, top: 44, fontFamily: F.mono, fontSize: 22, letterSpacing: 6, color: ink, textTransform: 'uppercase'}}>{e.kicker}</div>}
        <div style={{position: 'absolute', left: 64, right: 64, top: 86, height: 2, background: 'rgba(43,33,25,0.45)'}} />
        {!zitat && e.zeile && <div style={{position: 'absolute', left: 0, right: 0, top: 112, textAlign: 'center', fontFamily: FELL_I, fontSize: 54, color: TINTE, opacity: f(e.zeileEm, 0.3)}}>{e.zeile}</div>}
        {!zitat && gross && <div style={{position: 'absolute', left: 0, right: 0, top: 196 + (200 - gfs) * 0.4, textAlign: 'center', fontFamily: FELL, fontSize: gfs, lineHeight: 1, letterSpacing: gfs * 0.05, color: TINTE,
          opacity: f(e.grossEm, 0.6), transform: `translateY(${(1 - f(e.grossEm, 0.6)) * 20}px)`}}>{gross}</div>}
        {!zitat && e.klein && <div style={{position: 'absolute', left: 0, right: 0, top: 410, textAlign: 'center', fontFamily: FELL_I, fontSize: 112, lineHeight: 1, color: TINTE, opacity: f(e.kleinEm, 1.2)}}>{e.klein}</div>}
        {!zitat && e.klein && e.strich !== false && (
          <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
            <path d={strichD} fill="none" stroke={TINTE} strokeWidth={5} strokeLinecap="round" opacity={0.75} {...zeichne(fase(c.ts, ke + 0.1, ke + 1.0), strichD)} />
          </svg>
        )}
        {zitat && (
          <>
            <div style={{position: 'absolute', left: 64, top: 96, fontFamily: FELL, fontSize: 200, lineHeight: 1, color: 'rgba(43,33,25,0.28)'}}>{'„'}</div>
            <div style={{position: 'absolute', left: 120, right: 100, top: 150, bottom: 150, display: 'flex', alignItems: 'center', fontFamily: FELL_I, fontSize: tfs, lineHeight: 1.22, color: TINTE,
              opacity: f(e.textEm, 0.3), transform: `translateY(${(1 - f(e.textEm, 0.3)) * 14}px)`}}>{e.text}</div>
            {e.autor && <div style={{position: 'absolute', right: 80, bottom: 70, textAlign: 'right', opacity: f(e.autorEm, 1.2)}}>
              <div style={{fontFamily: FELL, fontSize: 46, color: TINTE, letterSpacing: 2}}>{'— ' + e.autor}</div>
              {e.quelle && <div style={{marginTop: 6, fontFamily: F.mono, fontSize: 22, letterSpacing: 2, color: ink}}>{e.quelle}</div>}
            </div>}
          </>
        )}
      </Papier>
    </div>
  );
};
