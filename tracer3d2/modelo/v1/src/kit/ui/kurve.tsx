// Kurve: Funktionsgraph / Liniendiagramm, Achsen zeichnen sich, Kurve laeuft, Markierungen mit Fuehrungslinie.
import React from 'react';
import {C, F, fase, sichtbar} from '../../ui/basis';
import {zeichne} from '../../ui/u1_heft';
import {Ctx} from './lib';

const cache = new Map<string, (x: number) => number>();
export const mkFn = (expr: string): ((x: number) => number) => {
  let f = cache.get(expr);
  if (!f) {
    try {
      const g = new Function('x', 'log10', 'log', 'sqrt', 'pow', 'sin', 'cos', 'tan', 'exp', 'abs', 'min', 'max', 'PI', `return (${expr});`) as any;
      f = (x: number) => g(x, Math.log10, Math.log, Math.sqrt, Math.pow, Math.sin, Math.cos, Math.tan, Math.exp, Math.abs, Math.min, Math.max, Math.PI);
    } catch { f = () => 0; }
    cache.set(expr, f);
  }
  return f;
};

export const KurveEl: React.FC<{c: Ctx; e: any}> = ({c, e}) => {
  const em = c.z(e.em, 0), ate = e.ate !== undefined ? c.z(e.ate) : undefined;
  const o = sichtbar(c.ts, em, 0.5, ate);
  if (o <= 0) return null;
  const X = e.x ?? 1010, Y = e.y ?? 960, W = e.breite ?? 700, H = e.hoehe ?? 300;
  const xmin = e.xmin ?? 0, xmax = e.xmax ?? 350, ymin = e.ymin ?? 0, ymax = e.ymax ?? 1;
  const sx = (v: number) => X + ((v - xmin) / (xmax - xmin)) * W;
  const sy = (v: number) => Y - ((v - ymin) / (ymax - ymin)) * H;
  const kurven: any[] = e.kurven ?? [{ausdruck: e.ausdruck, punkte: e.punkte, farbe: e.farbe, em: e.kurvem, dur: e.dur, marken: e.marken}];
  const xticks: number[] = e.xticks ?? [xmin, xmin + (xmax - xmin) / 3, xmin + (2 * (xmax - xmin)) / 3];
  const yticks: number[] = e.yticks ?? [];
  const kfn = (k: any, i: number) => {
    const N = k.n ?? 70;
    const fn = mkFn(k.ausdruck ?? 'x');
    const pts: [number, number][] = k.punkte ?? Array.from({length: N + 1}, (_, j) => { const x = xmin + (j / N) * (xmax - xmin); return [x, fn(x)] as [number, number]; });
    const d = pts.map(([a, b], j) => `${j ? 'L' : 'M'}${sx(a).toFixed(1)} ${sy(b).toFixed(1)}`).join('');
    const ke = c.z(k.em, em + 0.55), p = fase(c.ts, ke, ke + (k.dur ?? 1.35));
    const farbe = k.farbe ?? (i === 0 ? C.cyan : C.signal);
    return (
      <g key={i}>
        <path d={d} fill="none" stroke={farbe} strokeWidth={k.strich ?? 5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={k.gestrichelt ? '12 9' : undefined} {...(k.gestrichelt ? {} : zeichne(p, d))} />
        {(k.marken ?? []).map((m: any, j: number) => {
          const me = c.z(m.em, ke + (k.dur ?? 1.35));
          const mo = fase(c.ts, me, me + 0.5);
          const my = m.y ?? fn(m.x), farb = m.farbe ?? C.signal;
          return (
            <g key={j} opacity={mo}>
              <circle cx={sx(m.x)} cy={sy(my)} r={9} fill={farb} />
              <line x1={sx(m.x)} x2={sx(m.x)} y1={sy(my)} y2={Y} stroke={farb} strokeWidth={1.5} strokeDasharray="5 5" />
              {m.text && <text x={sx(m.x) + 16} y={sy(my) + 40} fill={farb} fontFamily={F.mono} fontSize={22}>{m.text}</text>}
            </g>
          );
        })}
      </g>
    );
  };
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: o, overflow: 'visible'}}>
      <path d={`M${X} ${Y - H - 20}V${Y}H${X + W + 20}`} fill="none" stroke="rgba(233,225,207,0.6)" strokeWidth={2} />
      {xticks.map((v) => (
        <g key={'x' + v}>
          <line x1={sx(v)} x2={sx(v)} y1={Y} y2={Y + 9} stroke="rgba(233,225,207,0.6)" />
          <text x={sx(v)} y={Y + 34} fill={C.grau} fontFamily={F.mono} fontSize={20} textAnchor="middle">{c.n(v, e.xstellen ?? 0)}</text>
        </g>
      ))}
      {yticks.map((v) => (
        <g key={'y' + v}>
          <line x1={X - 9} x2={X} y1={sy(v)} y2={sy(v)} stroke="rgba(233,225,207,0.6)" />
          <text x={X - 16} y={sy(v) + 7} fill={C.grau} fontFamily={F.mono} fontSize={20} textAnchor="end">{c.n(v, e.ystellen ?? 0)}</text>
        </g>
      ))}
      {e.xlabel && <text x={X + W + 30} y={Y + 74} fill={C.grau} fontFamily={F.mono} fontSize={20} textAnchor="end">{e.xlabel}</text>}
      {e.titel && <text x={X + 12} y={Y - H - 28} fill={C.papier} fontFamily={F.text} fontSize={24} fontWeight={500}>{e.titel}</text>}
      {kurven.map(kfn)}
    </svg>
  );
};
