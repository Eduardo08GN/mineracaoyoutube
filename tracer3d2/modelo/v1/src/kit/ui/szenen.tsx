// Weitere Szenen der Familie ui: Kurve, Zitat, Zeitleiste, Foto.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, F, fase, sichtbar, QUELLEN_IM_BILD} from '../../ui/basis';
import {Korn, Vignette} from '../../ui/u2_basis';
import {KitProps} from '../tipos';
import {Ctx, mkCtx, Rt} from './lib';
import {Rahmen, Deko, zaehl} from './deko';
import {KurveEl} from './kurve';
import {PapierEl} from './papier';

export const Kurve: React.FC<KitProps<any>> = ({t, b, p}) => {
  const c = mkCtx(b, t, p);
  return <Rahmen c={c} p={p}><KurveEl c={c} e={{x: 360, y: 880, breite: 1200, hoehe: 560, ...p}} /></Rahmen>;
};

export const Zitat: React.FC<KitProps<any>> = ({t, b, p}) => {
  const c = mkCtx(b, t, p);
  return <Rahmen c={c} p={p}><PapierEl c={c} e={p} /></Rahmen>;
};

// ---------- Zeitleiste ----------
export const Zeitleiste: React.FC<KitProps<any>> = ({t, b, p}) => {
  const c = mkCtx(b, t, p);
  const {ts} = c;
  const mn = p.min ?? 1900, mx = p.max ?? 1920, X0 = p.x0 ?? 260, X1 = p.x1 ?? 1660, AY = p.y ?? 640;
  const xv = (v: number) => X0 + ((v - mn) / (mx - mn)) * (X1 - X0);
  const schritt = p.schritt ?? 1, beschr = p.beschriftung ?? 5;
  const axEm = c.z(p.em, 0.1), axP = fase(ts, axEm, axEm + 0.9);
  const ticks: number[] = [];
  for (let v = mn; v <= mx + 1e-9; v += schritt) ticks.push(v);
  const ereignisse: any[] = p.ereignisse ?? [], spannen: any[] = p.spannen ?? [];
  const lauf = p.lauf;
  let lp = 0, lv = 0;
  if (lauf) { const le = c.z(lauf.em, 1); lp = fase(ts, le, le + (lauf.dauer ?? 1.8)); lv = (lauf.von ?? mn) + ((lauf.bis ?? mx) - (lauf.von ?? mn)) * lp; }
  return (
    <Rahmen c={c} p={p}>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <path d={`M${X0 - 20} ${AY}H${X1 + 20}`} stroke="rgba(233,225,207,0.65)" strokeWidth={2.5} fill="none" strokeDasharray="1 1" pathLength={1} strokeDashoffset={1 - axP} />
        {ticks.map((v, i) => {
          const gross = Math.round((v - mn) / schritt) % (beschr * 2) === 0, mittel = Math.round((v - mn) / schritt) % beschr === 0;
          const q = fase(ts, axEm + 0.2 + i * 0.012, axEm + 0.6 + i * 0.012);
          return (
            <g key={v} opacity={q}>
              <line x1={xv(v)} x2={xv(v)} y1={AY} y2={AY + (gross ? 34 : mittel ? 24 : 13)} stroke={C.papier} strokeOpacity={gross ? 0.9 : 0.5} strokeWidth={gross ? 2.5 : 1.5} />
              {mittel && <text x={xv(v)} y={AY + 72} fill={gross ? C.papier : C.grau} fontFamily={F.mono} fontSize={gross ? 30 : 22} textAnchor="middle">{p.rohzahl === false ? c.n(v, 0) : String(Math.round(v * 100) / 100).replace('.', c.dez)}</text>}
            </g>
          );
        })}
        {spannen.map((s, i) => {
          const se = c.z(s.em, 1 + i * 0.5), q = fase(ts, se, se + 0.8), col = s.farbe ?? C.signal, ya = AY - 70 - (s.stufe ?? 0) * 70;
          return (
            <g key={'s' + i} opacity={sichtbar(ts, se, 0.4)}>
              <rect x={xv(s.von)} y={AY - 6} width={(xv(s.bis) - xv(s.von)) * q} height={12} fill={col} opacity={0.35} />
              <path d={`M${xv(s.von)} ${ya + 28}V${ya}H${xv(s.bis)}V${ya + 28}`} fill="none" stroke={col} strokeWidth={3} strokeDasharray="1 1" pathLength={1} strokeDashoffset={1 - q} />
              {s.text && <text x={(xv(s.von) + xv(s.bis)) / 2} y={ya - 18} fill={col} fontFamily={F.mono} fontSize={26} letterSpacing={2} textAnchor="middle" opacity={fase(ts, se + 0.5, se + 1)}>{s.text}</text>}
            </g>
          );
        })}
        {ereignisse.map((e, i) => {
          const ee = c.z(e.em, 0.8 + i * 0.7), o = sichtbar(ts, ee, 0.5), col = e.farbe ?? C.papier, up = e.oben !== false, len = e.laenge ?? 100;
          const x = xv(e.wert), y2 = up ? AY - len : AY + len + 40, q = fase(ts, ee, ee + 0.5);
          return (
            <g key={'e' + i} opacity={o}>
              <line x1={x} x2={x} y1={AY} y2={AY + (y2 - AY) * q} stroke={col} strokeWidth={3} />
              <circle cx={x} cy={AY} r={10} fill={col} />
              <text x={x} y={up ? y2 - 54 : y2 + 56} fill={col} fontFamily={F.titel} fontWeight={600} fontSize={e.datumpt ?? 60} letterSpacing={2} textAnchor="middle">{e.datum}</text>
              {e.text && <text x={x} y={up ? y2 - 16 : y2 + 94} fill={e.textfarbe ?? C.grau} fontFamily={F.mono} fontSize={e.textpt ?? 24} letterSpacing={1} textAnchor="middle">{e.text}</text>}
            </g>
          );
        })}
        {lauf && lp > 0 && (
          <g>
            <line x1={xv(lauf.von ?? mn)} x2={xv(lauf.von ?? mn)} y1={AY} y2={AY - 60} stroke={C.papier} strokeWidth={3} />
            <rect x={Math.min(xv(lv), xv(lauf.von ?? mn))} y={AY - 6} width={Math.abs(xv(lv) - xv(lauf.von ?? mn))} height={12} fill={lauf.farbe ?? C.signal} opacity={0.4} />
            <line x1={xv(lv)} x2={xv(lv)} y1={AY} y2={AY - 60} stroke={lauf.farbe ?? C.signal} strokeWidth={3} />
            <circle cx={xv(lv)} cy={AY} r={11} fill={lauf.farbe ?? C.signal} />
            {lp > 0.97 && <text x={xv(lv)} y={AY - 80} fill={lauf.farbe ?? C.signal} fontFamily={F.titel} fontWeight={600} fontSize={60} letterSpacing={2} textAnchor="middle">{String(lauf.bis)}</text>}
          </g>
        )}
      </svg>
      {lauf && lauf.label && (
        <div style={{position: 'absolute', left: 0, right: 0, top: lauf.y ?? 250, textAlign: 'center', opacity: sichtbar(ts, c.z(lauf.em, 1), 0.5)}}>
          <div style={{fontFamily: F.titel, fontWeight: 600, fontSize: 130, letterSpacing: 5, color: lauf.farbe ?? C.signal, fontVariantNumeric: 'tabular-nums'}}>{lauf.label.replace('{z}', c.n(Math.abs(lv - (lauf.von ?? mn)), 0))}</div>
          {lauf.unter && <div style={{fontFamily: F.mono, fontSize: 30, letterSpacing: 6, color: C.grau, opacity: sichtbar(ts, c.z(lauf.unterEm, 1.5), 0.5)}}>{lauf.unter}</div>}
        </div>
      )}
    </Rahmen>
  );
};

// ---------- Foto (Archivfoto mit Ken Burns, Legende, Quelle) ----------
export const Foto: React.FC<KitProps<any>> = ({t, b, p}) => {
  const c = mkCtx(b, t, p);
  const {ts} = c;
  const dauer = Math.max(1, p.dauer ?? c.d);
  const k = Math.max(0, Math.min(1, ts / dauer));
  const e = k * k * (3 - 2 * k) * 0.6 + k * 0.4;
  const v = p.von ?? {zoom: 1.0, x: 0.5, y: 0.5}, n = p.bis ?? {zoom: 1.12, x: 0.5, y: 0.5};
  const zoom = v.zoom + (n.zoom - v.zoom) * e, fx = (v.x ?? 0.5) + ((n.x ?? 0.5) - (v.x ?? 0.5)) * e, fy = (v.y ?? 0.5) + ((n.y ?? 0.5) - (v.y ?? 0.5)) * e;
  const filter = p.filter === 'keiner' ? undefined : (p.filter ?? 'grayscale(0.55) sepia(0.28) contrast(1.08) brightness(0.92)');
  const rahmen = p.stil === 'rahmen';
  const W = p.w ?? 1300, H = p.h ?? 820, X = (1920 - W) / 2, Y = p.y ?? 110;
  const bildStyle: React.CSSProperties = {position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter,
    transformOrigin: `${fx * 100}% ${fy * 100}%`, transform: `scale(${zoom})`};
  const lo = sichtbar(ts, c.z(p.legendeEm, 0.6), 0.6);
  const bo = sichtbar(ts, 0, 0.5);
  return (
    <AbsoluteFill style={{background: C.grund, overflow: 'hidden'}}>
      {rahmen ? (
        <>
          <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 50% 46%, rgba(70,82,96,0.22), rgba(13,15,18,0) 70%)'}} />
          <div style={{position: 'absolute', left: X, top: Y, width: W, height: H, padding: 18, background: '#e9e1cf', boxShadow: '0 30px 80px rgba(0,0,0,0.7)', opacity: bo, transform: `rotate(${p.winkel ?? -0.6}deg)`}}>
            <div style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden'}}><Img src={staticFile(p.bild)} style={bildStyle} /></div>
          </div>
        </>
      ) : (
        <div style={{position: 'absolute', inset: 0, overflow: 'hidden', opacity: bo}}><Img src={staticFile(p.bild)} style={bildStyle} /></div>
      )}
      {!rahmen && <Vignette staerke={0.65} />}
      {!rahmen && p.korn !== false && <Korn staerke={0.07} />}
      <Deko c={c} el={p.deko} />
      {p.legende && (
        <div style={{position: 'absolute', left: rahmen ? X : 96, bottom: rahmen ? 40 : 96, opacity: lo, transform: `translateY(${(1 - lo) * 12}px)`, maxWidth: 1300}}>
          {p.legendeKicker && <div style={{fontFamily: F.mono, fontSize: 22, letterSpacing: 5, color: C.signal, textTransform: 'uppercase', marginBottom: 8}}>{p.legendeKicker}</div>}
          <div style={{fontFamily: F.text, fontWeight: 500, fontSize: 44, color: C.papier, textShadow: rahmen ? undefined : '0 2px 14px rgba(0,0,0,0.9)', lineHeight: 1.15}}><Rt text={p.legende} /></div>
        </div>
      )}
      {p.quelle && QUELLEN_IM_BILD && <div style={{position: 'absolute', right: 56, bottom: 36, fontFamily: F.mono, fontSize: 18, letterSpacing: 1.5, color: 'rgba(233,225,207,0.6)', textShadow: '0 1px 6px rgba(0,0,0,0.9)', opacity: sichtbar(ts, 0.5, 0.6), textAlign: 'right'}}>{p.quelle}</div>}
    </AbsoluteFill>
  );
};
