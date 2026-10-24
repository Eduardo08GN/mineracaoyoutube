// Balken: horizontale Balkenvergleiche (linear oder logarithmisch), Bereiche (von..bis), Teilstriche, Grenzlinie, Rahmen, Faktor-Zeile.
import React from 'react';
import {C, F, fase, sichtbar} from '../../ui/basis';
import {Ctx, FS, Rt} from './lib';
import {Ikon} from './ikonen';

const autoStellen = (v: number) => (Number.isInteger(v) ? 0 : Number.isInteger(v * 10) ? 1 : 2);

export const BalkenEl: React.FC<{c: Ctx; e: any}> = ({c, e}) => {
  const {ts} = c;
  const X0 = e.x ?? 330, BW = e.breite ?? 1250, H = e.hoehe ?? 62, log = e.skala === 'log';
  const max = e.max ?? 100, min = e.min ?? max / 10;
  const stil = e.stil ?? (log ? 'links' : 'oben');
  const X = (v: number) => X0 + (log ? (Math.log10(Math.max(v, min) / min) / Math.log10(max / min)) * BW : (v / max) * BW);
  const bars: any[] = e.balken ?? [];
  const y0 = e.y0 ?? 300, ab = e.abstand ?? 150;
  const wertpt = e.wertpt ?? Math.round(H * 0.72);
  const ach = e.achse;
  const lastY = bars.length ? Math.max(...bars.map((b, i) => (b.y ?? y0 + i * ab))) + H : y0;
  const AY = ach ? (ach.y ?? lastY + 70) : 0;
  const gr = e.grenze;
  const rb = e.rahmenbox;
  const fa = e.faktor;
  const rbEm = rb ? c.z(rb.em, 0) : 0;
  const rbP = rb ? fase(ts, rbEm - 0.1, rbEm + 0.9) : 0;
  const gruen = rb && rb.gruen !== undefined ? fase(ts, c.z(rb.gruen) - 0.1, c.z(rb.gruen) + 0.4) : 0;
  const rbCol = gruen > 0 ? C.gruen : (rb?.farbe ?? C.signal);
  return (
    <>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {rb && <rect x={rb.x ?? 90} y={rb.y ?? 250} width={rb.w ?? 1740} height={rb.h ?? 600} fill={gruen > 0 ? 'rgba(127,191,106,0.06)' : 'none'} stroke={rbCol} strokeWidth={4} strokeDasharray={`${rbP * 2 * ((rb.w ?? 1740) + (rb.h ?? 600))} 9999`} opacity={0.95} />}
        {ach && (
          <g opacity={sichtbar(ts, c.z(ach.em, 0.1), 0.5)}>
            <line x1={X0} x2={X0 + BW} y1={AY} y2={AY} stroke="rgba(233,225,207,0.6)" strokeWidth={2} />
            {(ach.ticks ?? []).map((v: number) => (
              <g key={v}>
                {ach.gitter !== false && <line x1={X(v)} x2={X(v)} y1={ach.gitterOben ?? y0 - 20} y2={AY} stroke="rgba(233,225,207,0.10)" strokeWidth={1} />}
                <line x1={X(v)} x2={X(v)} y1={AY} y2={AY + 12} stroke="rgba(233,225,207,0.6)" strokeWidth={2} />
                <text x={X(v)} y={AY + 48} fill={C.grau} fontFamily={F.mono} fontSize={26} textAnchor="middle">{c.n(v, ach.stellen ?? autoStellen(v))}{ach.einheit ? ' ' + ach.einheit : ''}</text>
              </g>
            ))}
            {ach.label && <text x={X0 + BW} y={AY + 84} fill={C.grau} fontFamily={F.mono} fontSize={20} textAnchor="end">{ach.label}</text>}
          </g>
        )}
        {gr && (
          <g opacity={sichtbar(ts, c.z(gr.em, 1), 0.5)}>
            <line x1={X(gr.wert)} x2={X(gr.wert)} y1={gr.y1 ?? 290} y2={gr.y2 ?? (ach ? AY : 740)} stroke={gr.farbe ?? C.rot} strokeWidth={4} />
            {gr.label && <text x={X(gr.wert) - 14} y={(gr.y1 ?? 290) + 32} fill={gr.farbe ?? C.rot} fontFamily={F.text} fontSize={32} fontWeight={600} textAnchor="end">{gr.label}</text>}
            {gr.text && <text x={X(gr.wert) - 14} y={(gr.y1 ?? 290) + 72} fill={gr.farbe ?? C.rot} fontFamily={F.mono} fontSize={34} fontWeight={600} textAnchor="end">{gr.text}</text>}
          </g>
        )}
        {bars.map((b, i) => {
          const em = c.z(b.em, 0.2 + i * 0.3), y = b.y ?? y0 + i * ab;
          const o = sichtbar(ts, em, 0.4, b.ate !== undefined ? c.z(b.ate) : undefined);
          if (o <= 0.001) return null;
          const p = fase(ts, em, em + (b.dur ?? 0.9)), col = b.farbe ?? C.signal;
          const von = b.von ?? (log ? min : 0), v = von + (b.wert - von) * p;
          const x1 = X(von), x2 = X(v), w = Math.max(0, x2 - x1);
          const st = b.stellen ?? e.stellen ?? 0;
          const wertText = b.text !== undefined ? b.text : (b.pfx ?? '') + (p >= 0.999 ? (b.pfxEnde ?? '') : '') + c.n(v, st);
          const dim = b.dim ?? 1;
          return (
            <g key={i} opacity={o * dim}>
              {(e.spur ?? stil === 'oben') && <rect x={X0} y={y} width={BW} height={H} fill="none" stroke="rgba(233,225,207,0.14)" />}
              <rect x={x1} y={y} width={w} height={H} fill={col} fillOpacity={b.gestrichelt ? 0.08 : 0.9} stroke={b.gestrichelt ? col : 'none'} strokeWidth={b.gestrichelt ? 2.5 : 0} strokeDasharray={b.gestrichelt ? '12 8' : undefined} />
              {b.teilung && (() => {
                const te = c.z(b.teilungEm, em + 0.8), n = Math.floor(b.wert / b.teilung.schritt - 1e-9);
                return Array.from({length: n}, (_, k) => {
                  const xv = X((k + 1) * b.teilung.schritt);
                  return <line key={k} x1={xv} x2={xv} y1={y} y2={y + H} stroke={C.grund} strokeWidth={b.teilung.strich ?? 4} opacity={fase(ts, te + k * 0.1, te + 0.3 + k * 0.1)} />;
                });
              })()}
              {b.von !== undefined && b.vonText !== false && <text x={x1 - 14} y={y + H * 0.5 + wertpt * 0.35} fill={col} fontFamily={F.mono} fontWeight={600} fontSize={wertpt} textAnchor="end" opacity={p}>{c.n(b.von, st)}</text>}
              {b.innen ? (
                <>
                  <text x={x2 - 18} y={y + H * 0.5 + wertpt * 0.35} fill={C.grund} fontFamily={F.mono} fontWeight={600} fontSize={wertpt} textAnchor="end" opacity={p > 0.2 ? 1 : 0}>{wertText}</text>
                  {b.einheit && <text x={x2 + 20} y={y + H * 0.5 + wertpt * 0.35} fill={C.grau} fontFamily={F.mono} fontSize={Math.round(wertpt * 0.6)} opacity={p > 0.9 ? 1 : 0}>{b.einheit}</text>}
                </>
              ) : (
                <text x={x2 + 18} y={y + H * 0.5 + wertpt * 0.35} fill={b.wertfarbe ?? col} fontFamily={F.mono} fontWeight={e.wertGewicht ?? 500} fontSize={wertpt} opacity={b.von !== undefined ? p : 1}>
                  {wertText}{b.einheit && <tspan fontSize={b.einheitGross ? wertpt : Math.round(wertpt * 0.6)} fill={b.einheitGross ? (b.wertfarbe ?? col) : C.grau} dx={b.einheitGross ? 8 : 10}>{b.einheit}</tspan>}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {bars.map((b, i) => {
        const em = c.z(b.em, 0.2 + i * 0.3), y = b.y ?? y0 + i * ab;
        const o = sichtbar(ts, em, 0.4, b.ate !== undefined ? c.z(b.ate) : undefined) * (b.dim ?? 1);
        if (o <= 0.001 || (!b.label && !b.unter)) return null;
        const lf = b.labelfarbe ?? (b.schrift === 'mono' ? (b.farbe ?? C.signal) : C.papier);
        if (stil === 'links') {
          return (
            <div key={'l' + i} style={{position: 'absolute', left: X0 - 30 - 600, width: 600, top: y + H / 2, transform: 'translateY(-50%)', textAlign: 'right', opacity: o}}>
              <div style={{fontFamily: FS(b.schrift ?? 'text'), fontSize: b.labelpt ?? 38, fontWeight: 500, color: lf, lineHeight: 1.1}}>{b.label}</div>
              {b.unter && <div style={{fontFamily: F.mono, fontSize: b.unterpt ?? 22, color: C.grau, marginTop: 4}}>{b.unter}</div>}
            </div>
          );
        }
        return (
          <div key={'l' + i} style={{position: 'absolute', left: X0, top: y - 10, transform: 'translateY(-100%)', opacity: o, display: 'flex', alignItems: 'center', gap: 20, whiteSpace: 'nowrap'}}>
            {b.ikon && <Ikon name={b.ikon} p={fase(ts, em, em + 0.9)} tv={ts} groesse={b.ikonpt ?? 56} />}
            <div>
              <span style={{fontFamily: FS(b.schrift ?? 'text'), fontSize: b.labelpt ?? 34, fontWeight: 500, color: lf, letterSpacing: b.schrift === 'mono' ? 1 : 0}}><Rt text={b.label} /></span>
              {b.unter && <span style={{fontFamily: F.mono, fontSize: b.unterpt ?? 24, color: C.grau, marginLeft: 16}}>{b.unter}</span>}
            </div>
          </div>
        );
      })}
      {rb && (rb.label || rb.label2) && (
        <div style={{position: 'absolute', left: (rb.x ?? 90) + 30, top: (rb.y ?? 250) + 20, fontFamily: F.mono, fontSize: 24, letterSpacing: 4, color: rbCol, opacity: sichtbar(ts, c.z(rb.labelEm, rbEm + 0.3), 0.4)}}>
          {gruen > 0.5 && rb.label2 ? rb.label2 : rb.label}
        </div>
      )}
      {rb && rb.haken && gruen > 0 && <div style={{position: 'absolute', left: (rb.x ?? 90) + (rb.w ?? 1740) - 100, top: (rb.y ?? 250) + 12, opacity: gruen, fontFamily: F.titel, fontSize: 60, color: C.gruen}}>✓</div>}
      {fa && (() => {
        const fem = c.z(fa.em, 1), o = sichtbar(ts, fem, 0.5);
        return (
          <div style={{position: 'absolute', left: fa.x ?? X0, top: fa.y ?? 800, opacity: o, transform: `translateY(${(1 - o) * 14}px)`, whiteSpace: 'nowrap'}}>
            <span style={{fontFamily: F.titel, fontWeight: 600, fontSize: fa.groesse ?? 104, letterSpacing: 3, color: fa.farbe ?? C.signal}}>{fa.text}</span>
            {fa.unter && <span style={{fontFamily: F.text, fontWeight: 500, fontSize: fa.unterpt ?? 54, color: C.papier, marginLeft: 36, opacity: sichtbar(ts, c.z(fa.unterEm, fem + 0.6), 0.5)}}>{fa.unter}</span>}
          </div>
        );
      })()}
    </>
  );
};
