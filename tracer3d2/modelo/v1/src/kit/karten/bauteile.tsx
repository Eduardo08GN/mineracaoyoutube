// Karte (kit): Bauteile, die in den alten Szenen auf Ort/Datum zugeschnitten waren, hier ohne feste Texte.
//  RasterK (Rasterbild mit Grenzen aus raster.json oder aus den Props), GrenzenK/FluesseK (Datei waehlbar),
//  SymK/SymName (Fort-/Ortssymbole mit Zustaenden), Datum, Zeitleiste, Uhr, Gebiet, Fleck, Zeichen
import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, F, fase, sichtbar} from '../../ui/basis';
import {de} from '../../daten';
import {W, H, Proj, LL, XY, Svg, geoPfad} from '../../karten/basis';

// ---------- Raster ----------
export type Grenzen4 = {west: number; east: number; south: number; north: number};
export const RasterK: React.FC<{p: Proj; src: string; b: Grenzen4; opacity?: number; rand?: number; filter?: string}> = ({p, src, b, opacity = 1, rand = 0.03, filter}) => {
  const [x0, y0] = p(b.west, b.north), [x1, y1] = p(b.east, b.south);
  const w = x1 - x0, h = y1 - y0;
  const vx0 = Math.max(0, x0), vy0 = Math.max(0, y0), vx1 = Math.min(W, x1), vy1 = Math.min(H, y1);
  if (opacity <= 0.001 || vx1 <= vx0 || vy1 <= vy0) return null;
  const rx = rand * w, ry = rand * h;
  const mx = `linear-gradient(to right, transparent ${x0 - vx0}px, #000 ${x0 - vx0 + rx}px, #000 ${x1 - vx0 - rx}px, transparent ${x1 - vx0}px)`;
  const my = `linear-gradient(to bottom, transparent ${y0 - vy0}px, #000 ${y0 - vy0 + ry}px, #000 ${y1 - vy0 - ry}px, transparent ${y1 - vy0}px)`;
  return (
    <div style={{position: 'absolute', left: vx0, top: vy0, width: vx1 - vx0, height: vy1 - vy0, overflow: 'hidden', opacity,
      maskImage: rand > 0 ? `${mx}, ${my}` : undefined, WebkitMaskImage: rand > 0 ? `${mx}, ${my}` : undefined, maskComposite: 'intersect', WebkitMaskComposite: 'source-in'} as any}>
      <Img src={staticFile(src)} style={{position: 'absolute', left: x0 - vx0, top: y0 - vy0, width: w, height: h, filter}} />
    </div>
  );
};

export const GrenzenK: React.FC<{p: Proj; json: any; opacity?: number}> = ({p, json, opacity = 1}) => {
  if (!json || opacity <= 0) return null;
  return <Svg style={{opacity}}>{json.features.map((f: any, i: number) => <path key={i} d={geoPfad(p, f.geometry)} fill="none" stroke="rgba(233,225,207,0.22)" strokeWidth={1.2} strokeDasharray="6 5" />)}</Svg>;
};
export const FluesseK: React.FC<{p: Proj; json: any; opacity?: number; breite?: number}> = ({p, json, opacity = 1, breite = 1.6}) => {
  if (!json || opacity <= 0) return null;
  return <Svg style={{opacity}}>{json.features.map((f: any, i: number) => <path key={i} d={geoPfad(p, f.geometry)} fill="none" stroke="rgba(94,200,229,0.30)" strokeWidth={breite} strokeLinejoin="round" strokeLinecap="round" />)}</Svg>;
};

// Einschlag (wie basis.Blitz), aber mit rest = 0 bleibt nach dem Einschlag nichts stehen
export const BlitzK: React.FC<{p: Proj; ll: LL; t0: number; t: number; farbe?: string; r?: number; ringR?: number; rest?: number; dauer?: number}> =
  ({p, ll, t0, t, farbe = C.signal, r = 5, ringR = 40, rest = 0.85, dauer = 1.1}) => {
    const dt = t - t0;
    if (dt < 0) return null;
    const [x, y] = p(ll[0], ll[1]);
    const u = Math.min(1, dt / dauer), blitz = Math.max(0, 1 - dt / 0.35);
    return (
      <g>
        {u < 1 && <circle cx={x} cy={y} r={r + (ringR - r) * Math.sqrt(u)} fill="none" stroke={farbe} strokeWidth={2} strokeOpacity={(1 - u) * 0.9} />}
        {blitz > 0 && <circle cx={x} cy={y} r={r * (1.5 + 2.5 * blitz)} fill="#fff6dc" fillOpacity={blitz * 0.8} />}
        {(rest > 0 || blitz > 0) && <circle cx={x} cy={y} r={r} fill={farbe} fillOpacity={rest + (1 - rest) * blitz} stroke="#0d0f12" strokeWidth={1.2} />}
      </g>
    );
  };

// ---------- Symbole ----------
export type Zust = {fall?: number; rot?: number; hell?: number; dim?: number; blitz?: number; intakt?: number};
const mixc = (a: string, b: string, u: number) => {
  const pa = a.match(/\w\w/g)!.map((h) => parseInt(h, 16)), pb = b.match(/\w\w/g)!.map((h) => parseInt(h, 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * u)).join(',')})`;
};
// form: dreieck | quadrat | kreis | raute ; gefuellt = ausgefuellte Variante ("grosses" Werk)
export const SymK: React.FC<{x: number; y: number; s?: number; form?: string; gefuellt?: boolean; z?: Zust; o?: number; pop?: number; zahl?: number; farbe?: string}> =
  ({x, y, s = 17, form = 'dreieck', gefuellt = true, z = {}, o = 1, pop = 1, zahl, farbe}) => {
    const {fall = 0, rot = 0, hell = 0, dim = 0, blitz = 0, intakt = 0} = z;
    if (o <= 0.01 || pop <= 0) return null;
    const sc = pop < 1 ? 0.3 + 0.7 * pop + 0.35 * Math.sin(pop * Math.PI) : 1;
    const norm = '#e9e1cf', dunkel = '#2a2d32', rand = '#7b8189';
    let fill = gefuellt ? mixc(norm.slice(1), dunkel.slice(1), fall) : 'rgba(233,225,207,0.10)';
    let stroke = farbe ?? mixc(norm.slice(1), rand.slice(1), fall * (1 - intakt));
    if (farbe && fall > 0) stroke = mixc(farbe.replace('#', ''), rand.slice(1), fall * (1 - intakt));
    if (!gefuellt && fall > 0) fill = `rgba(42,45,50,${0.10 + 0.82 * fall})`;
    if (form === 'kreis') fill = 'rgba(13,15,18,0.6)';
    if (rot > 0) { fill = gefuellt ? mixc(dunkel.slice(1), 'd9483b', rot) : `rgba(217,72,59,${0.2 + 0.5 * rot})`; stroke = mixc(rand.slice(1), 'f06a5c', rot); }
    const op = o * (1 - 0.72 * dim);
    const shape = form === 'dreieck' ? `M0 ${-s * 1.05}L${s * 0.98} ${s * 0.72}L${-s * 0.98} ${s * 0.72}Z`
      : form === 'raute' ? `M0 ${-s}L${s} 0L0 ${s}L${-s} 0Z`
      : form === 'kreis' ? `M${-s * 0.8} 0A${s * 0.8} ${s * 0.8} 0 1 0 ${s * 0.8} 0A${s * 0.8} ${s * 0.8} 0 1 0 ${-s * 0.8} 0Z`
      : `M${-s * 0.8} ${-s * 0.8}H${s * 0.8}V${s * 0.8}H${-s * 0.8}Z`;
    return (
      <g transform={`translate(${x} ${y}) scale(${sc})`} opacity={op}>
        {hell > 0 && <circle r={s * (2.1 + 0.4 * hell)} fill="none" stroke={C.signal} strokeOpacity={0.55 * hell} strokeWidth={2} />}
        {hell > 0 && <circle r={s * 1.5} fill={C.signal} fillOpacity={0.12 * hell} />}
        {blitz > 0 && <circle r={s * (1.6 + 2.6 * (1 - blitz))} fill="#ffb347" fillOpacity={0.55 * blitz} />}
        <path d={shape} fill={fill} stroke={stroke} strokeWidth={gefuellt ? 2.6 : 3} strokeLinejoin="round" />
        {form === 'kreis' && gefuellt && <circle r={s * 0.25} fill={farbe ?? norm} />}
        {rot > 0 && <path d={`M${-s * 0.3} ${-s * 0.55}L${s * 0.1} ${-s * 0.05}L${-s * 0.2} ${s * 0.2}L${s * 0.25} ${s * 0.6}`} fill="none" stroke="#0d0f12" strokeWidth={2.4} opacity={rot} />}
        {fall > 0.5 && rot < 0.5 && <path d={`M${-s * 0.42} ${-s * 0.1}L${s * 0.42} ${s * 0.1}M${-s * 0.42} ${s * 0.1}L${s * 0.42} ${-s * 0.1}`} stroke="#9aa0a6" strokeWidth={2} opacity={(fall - 0.5) * 2} transform={form === 'dreieck' && gefuellt ? `translate(0 ${s * 0.15})` : undefined} />}
        {zahl !== undefined && <text y={form === 'dreieck' ? s * 0.5 : s * 0.38} textAnchor="middle" fontFamily={F.titel} fontWeight={600} fontSize={s * 1.05} fill={fall > 0.5 || rot > 0.5 ? '#f4efe2' : '#14161a'}>{zahl}</text>}
      </g>
    );
  };

// Beschriftung nach aussen (vom Zentrum weg) oder fest (seite)
export const SymName: React.FC<{p: Proj; ll: LL; zentrum?: LL; text: string; o?: number; gross?: number; farbe?: string; abstand?: number; seite?: 'r' | 'l' | 'o' | 'u'}> =
  ({p, ll, zentrum, text, o = 1, gross = 23, farbe = C.papier, abstand = 30, seite}) => {
    if (o <= 0.01) return null;
    const [x, y] = p(ll[0], ll[1]);
    const [cx, cy] = zentrum ? p(zentrum[0], zentrum[1]) : [x, y + 1];
    let dx = x - cx, dy = y - cy; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    let sx = dx * abstand, sy = dy * abstand * 0.8;
    if (seite) { sx = seite === 'r' ? abstand : seite === 'l' ? -abstand : 0; sy = seite === 'o' ? -abstand * 0.9 : seite === 'u' ? abstand * 0.9 : 0; }
    const ax = Math.abs(sx) < 8 ? '-50%' : sx > 0 ? '0%' : '-100%';
    return (
      <div style={{position: 'absolute', left: x + sx, top: y + sy, transform: `translate(${ax}, -50%)`, opacity: o, whiteSpace: 'nowrap', fontFamily: F.text, fontWeight: 600, fontSize: gross,
        letterSpacing: 2, textTransform: 'uppercase', color: farbe, textShadow: '0 1px 8px #000, 0 0 3px #000, 0 0 12px rgba(0,0,0,0.9)'}}>{text}</div>
    );
  };

// ---------- Beschriftungen ----------
export const Gebiet: React.FC<{p: Proj; ll: LL; text: string; o?: number; groesse?: number; farbe?: string; dreh?: number}> = ({p, ll, text, o = 1, groesse = 54, farbe = C.sepia, dreh = 0}) => {
  if (o <= 0.01) return null;
  const [x, y] = p(ll[0], ll[1]);
  return <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${dreh}deg)`, opacity: o, whiteSpace: 'nowrap', fontFamily: F.titel, fontWeight: 500, fontSize: groesse,
    letterSpacing: groesse * 0.28, textTransform: 'uppercase', color: farbe, textShadow: '0 2px 14px rgba(0,0,0,0.9)'}}>{text}</div>;
};

// weicher Fleck (z. B. Stadtflaeche): radialer Verlauf, Radius in km
export const Fleck: React.FC<{p: Proj; ll: LL; km: number; fort?: number; farbe?: string; o?: number; id: string}> = ({p, ll, km, fort = 1, farbe = '#9aa0a6', o = 1, id}) => {
  if (fort <= 0.001 || o <= 0.01) return null;
  const [x, y] = p(ll[0], ll[1]);
  return (
    <Svg style={{opacity: o}}>
      <defs><radialGradient id={'fl' + id}><stop offset="0%" stopColor={farbe} stopOpacity={0.5} /><stop offset="70%" stopColor={farbe} stopOpacity={0.28} /><stop offset="100%" stopColor={farbe} stopOpacity={0} /></radialGradient></defs>
      <circle cx={x} cy={y} r={(km / p.kam.km) * fort} fill={`url(#fl${id})`} />
    </Svg>
  );
};

// Kreis mit Zeichen (z. B. gestrichelter Ring mit "0")
export const Zeichen: React.FC<{x: number; y: number; text: string; r?: number; farbe?: string; o?: number; groesse?: number; dash?: string}> = ({x, y, text, r = 28, farbe = C.papier, o = 1, groesse = 36, dash = '6 5'}) => {
  if (o <= 0.01) return null;
  return <Svg style={{opacity: o}}><circle cx={x} cy={y} r={r} fill="none" stroke={farbe} strokeWidth={3} strokeDasharray={dash} /><text x={x} y={y + groesse * 0.33} textAnchor="middle" fontFamily={F.titel} fontWeight={600} fontSize={groesse} fill={farbe}>{text}</text></Svg>;
};

// ---------- Datum / Zahlenreihe ----------
// anker: [{t, wert}] (t in s lokal, aufsteigend). Wert gleitet nie rueckwaerts.
export type Anker = {t: number; wert: number}[];
export const gleit = (a: Anker, t: number, dauer = 0.9): number => {
  if (!a.length) return 0;
  let d = a[0].wert;
  for (let i = 1; i < a.length; i++) if (t >= a[i].t) d = a[i].wert - (a[i].wert - a[i - 1].wert) * (1 - fase(t, a[i].t, a[i].t + dauer));
  return d;
};
export const laufend = (a: Anker, t: number): [number, number] => {
  let r: [number, number] = [a[0]?.wert ?? 0, a[0]?.t ?? 0];
  for (const x of a) if (t >= x.t && x.wert !== r[0]) r = [x.wert, x.t];
  return r;
};
export const fmtN = (fmt: string, n: number) => fmt.replace('{nn}', String(Math.round(n)).padStart(2, '0')).replace('{n}', String(Math.round(n)));

export const DatumK: React.FC<{t: number; anker: Anker; fmt?: string; kopf?: string; unter?: string; o?: number; right?: number; top?: number; groesse?: number}> =
  ({t, anker, fmt = '{nn}.', kopf, unter, o = 1, right = 80, top = 96, groesse = 124}) => {
    if (o <= 0.01 || !anker.length) return null;
    const [n, seit] = laufend(anker, t);
    const u = fase(t, seit, seit + 0.35);
    return (
      <div style={{position: 'absolute', right, top, textAlign: 'right', opacity: o}}>
        {kopf && <div style={{fontFamily: F.mono, fontSize: 24, letterSpacing: 5, color: C.grau}}>{kopf}</div>}
        <div style={{fontFamily: F.titel, fontWeight: 600, fontSize: groesse, lineHeight: 1.0, color: C.signal, textShadow: '0 4px 24px rgba(0,0,0,0.9)', transform: `translateY(${(1 - u) * 14}px)`, opacity: 0.35 + 0.65 * u}}>{fmtN(fmt, n)}</div>
        {unter && <div style={{fontFamily: F.text, fontSize: 30, color: 'rgba(233,225,207,0.85)', textShadow: '0 2px 10px #000'}}>{unter}</div>}
      </div>
    );
  };

// ---------- Zeitleiste ----------
export type Band = {a: number; b: number; text: string; farbe?: string; fort?: number; hoch?: number};
export type Ereignis = {tag: number; t: number; form?: string; gefuellt?: boolean};
export const ZeitleisteK: React.FC<{t: number; o?: number; wert: number; von: number; bis: number; ticks: number[]; fmt?: string; kopf?: string; baender?: Band[]; ereignisse?: Ereignis[];
  marke?: {tag: number; text: string}; zeiger?: boolean; x0?: number; x1?: number; y?: number}> =
  ({t, o = 1, wert, von, bis, ticks, fmt = '{nn}.', kopf, baender = [], ereignisse = [], marke, zeiger = true, x0 = 470, x1 = 1790, y = 958}) => {
    if (o <= 0.01) return null;
    const X = (d: number) => x0 + ((d - von) / (bis - von)) * (x1 - x0);
    const proTag: Record<number, number> = {};
    return (
      <div style={{position: 'absolute', inset: 0, opacity: o, pointerEvents: 'none'}}>
        <Svg>
          <rect x={x0 - 40} y={y - 74} width={x1 - x0 + 80} height={118} fill="rgba(13,15,18,0.7)" />
          <line x1={x0} y1={y} x2={x1} y2={y} stroke="rgba(233,225,207,0.55)" strokeWidth={2} />
          {ticks.map((d) => (
            <g key={d}>
              <line x1={X(d)} y1={y - 7} x2={X(d)} y2={y + 7} stroke="rgba(233,225,207,0.7)" strokeWidth={2} />
              <text x={X(d)} y={y + 30} textAnchor="middle" fontFamily={F.mono} fontSize={18} fill="rgba(233,225,207,0.62)">{fmtN(fmt, d)}</text>
            </g>
          ))}
          {baender.map((band, i) => {
            const fo = band.fort ?? 1;
            const a = X(band.a), b2 = X(band.a + (band.b - band.a) * fo);
            const yy = y - (band.hoch ?? 0);
            return <g key={i}><rect x={a} y={yy - 7} width={Math.max(0, b2 - a)} height={14} fill={band.farbe ?? C.cyan} fillOpacity={0.88} />
              {fo > 0.9 && <text x={(a + b2) / 2} y={yy - 18} textAnchor="middle" fontFamily={F.text} fontWeight={600} fontSize={25} letterSpacing={1.5} fill={band.farbe ?? C.cyan}>{band.text}</text>}</g>;
          })}
          {ereignisse.filter((e) => t >= e.t).map((e, k) => {
            const i = proTag[e.tag] = (proTag[e.tag] ?? -1) + 1;
            const x = X(e.tag) + (i % 2 === 0 ? -9 : 9), yy = y - 26 - Math.floor(i / 2) * 20;
            const fresh = fase(t, e.t, e.t + 0.4);
            return <g key={k} transform={`translate(${x} ${yy}) scale(${0.6 + 0.4 * fresh})`} opacity={fresh}>
              {e.form === 'quadrat' || e.gefuellt === false ? <rect x={-7} y={-7} width={14} height={14} fill="#8d949c" /> : <path d="M0 -8L8 6H-8Z" fill="#8d949c" />}
            </g>;
          })}
          {marke && <g><circle cx={X(marke.tag)} cy={y} r={8} fill={C.signal} /><text x={X(marke.tag)} y={y - 42} textAnchor="middle" fontFamily={F.titel} fontWeight={600} fontSize={32} fill={C.signal}>{marke.text}</text></g>}
          {zeiger && <g>
            <line x1={X(wert)} y1={y - 44} x2={X(wert)} y2={y + 10} stroke={C.signal} strokeWidth={3} />
            <path d={`M${X(wert) - 8} ${y - 44}L${X(wert) + 8} ${y - 44}L${X(wert)} ${y - 32}Z`} fill={C.signal} />
          </g>}
        </Svg>
        {kopf && <div style={{position: 'absolute', left: x0 - 34, top: y - 66, fontFamily: F.mono, fontSize: 17, letterSpacing: 3, color: C.grau}}>{kopf}</div>}
      </div>
    );
  };

// ---------- Tageszeit-Uhr (Halbkreis, Abschnitte) ----------
export const Uhr: React.FC<{o: number; wert: number; text: string; x?: number; y?: number; marken?: [string, string, string]}> = ({o, wert, text, x = 1700, y = 470, marken = ['MORGEN', 'MITTAG', 'ABEND']}) => {
  if (o <= 0.01) return null;
  const R = 92, a = Math.PI * (1 - wert), px = x + Math.cos(a) * (R - 12), py = y - Math.sin(a) * (R - 12);
  const arc = (r: number) => `M${x - r} ${y}A${r} ${r} 0 0 1 ${x + r} ${y}`;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o, pointerEvents: 'none'}}>
      <Svg>
        <path d={arc(R)} fill="none" stroke="rgba(233,225,207,0.45)" strokeWidth={3} />
        <path d={arc(R - 22)} fill="none" stroke="rgba(233,225,207,0.18)" strokeWidth={1.5} />
        {[0, 0.5, 1].map((u) => { const aa = Math.PI * (1 - u); return <line key={u} x1={x + Math.cos(aa) * (R - 8)} y1={y - Math.sin(aa) * (R - 8)} x2={x + Math.cos(aa) * (R + 10)} y2={y - Math.sin(aa) * (R + 10)} stroke="rgba(233,225,207,0.7)" strokeWidth={2.5} />; })}
        <line x1={x} y1={y} x2={px} y2={py} stroke={C.signal} strokeWidth={4} strokeLinecap="round" />
        <circle cx={x} cy={y} r={7} fill={C.signal} />
      </Svg>
      <div style={{position: 'absolute', left: x - R - 40, top: y + 12, width: 2 * R + 80, textAlign: 'center', fontFamily: F.titel, fontWeight: 600, fontSize: 40, letterSpacing: 3, color: C.signal, textTransform: 'uppercase', textShadow: '0 2px 10px #000'}}>{text}</div>
      <div style={{position: 'absolute', left: x - R - 20, top: y - 28, fontFamily: F.mono, fontSize: 15, color: C.grau, transform: 'translateX(-50%)'}}>{marken[0]}</div>
      <div style={{position: 'absolute', left: x, top: y - R - 40, fontFamily: F.mono, fontSize: 15, color: C.grau, transform: 'translateX(-50%)'}}>{marken[1]}</div>
      <div style={{position: 'absolute', left: x + R + 20, top: y - 28, fontFamily: F.mono, fontSize: 15, color: C.grau, transform: 'translateX(-50%)'}}>{marken[2]}</div>
    </div>
  );
};

export {de, sichtbar};
