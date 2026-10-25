// Karte (kit): mapa 2D/2,5D dirigido por JSON. Ver API.md.
//  base (raster/relevo/simples) + camera por keyframes ancoraveis em palavras + lista de camadas + titulo + linha de fonte.
//  Tudo e funcao pura de t. Nenhum dado de video especifico aqui: coordenadas, arquivos, textos e cores vem das props.
import React from 'react';
import {C, F, fase, sichtbar, QUELLEN_IM_BILD} from '../../ui/basis';
import {de} from '../../daten';
import {
  Atlas, Ort, Marke, Linie, Kreis, Pfeil, Lineal, Ziel, Blitz, Rahmen, KartenTitel, Gradnetz, Svg, projektion, kamFahrt, Proj, LL, XY, pfad, azimut, ziel as zielPkt, zufall, ausMetern, schneide, xyPfad, W, H,
} from '../../karten/basis';
import {Text2, Stempel, Zahl, Strahl, Bogen, Hauch, Flamme, Credit, RingLinie} from '../../karten/k2_bausteine';
import RASTER from '../../../public/karten2/raster.json';
import {KitProps} from '../tipos';
import KARTEN from '../../cenas/karten.json';
import {
  mkZt, ZT, useDateien, sammleDateien, mkRef, teile, linieAus, kappeOst, resample, kfWert, prop, Dat,
} from './dados';
import {
  RasterK, BlitzK, GrenzenK, FluesseK, SymK, SymName, Gebiet, Fleck, Zeichen, DatumK, ZeitleisteK, Uhr, gleit, Anker, Zust,
} from './bauteile';

// ---------- Vorlagen (cenas/karten.json -> "_vorlagen") ----------
const VORL: Record<string, any> = (KARTEN as any)._vorlagen || {};
const mergeEbenen = (a: any[] = [], b: any[] = []): any[] => {
  const out = a.slice();
  for (const l of b) {
    const i = l.id ? out.findIndex((x) => x.id === l.id) : -1;
    if (i >= 0) { if (l.weg) out.splice(i, 1); else if (l.erbt) { const {erbt, ...r} = l; out[i] = {...out[i], ...r}; } else out[i] = l; } else if (!l.weg) out.push(l);
  }
  return out;
};
export const loesVorlage = (p: any, tiefe = 0): any => {
  if (!p || !p.vorlage || tiefe > 6) return p || {};
  const base = loesVorlage(VORL[p.vorlage] || {}, tiefe + 1);
  const {vorlage, ...rest} = p;
  const out: any = {...base, ...rest, ebenen: mergeEbenen(base.ebenen, rest.ebenen)};
  for (const k of ['grund', 'titel', 'rahmen']) if (base[k] && rest[k] && typeof rest[k] === 'object' && typeof base[k] === 'object') out[k] = {...base[k], ...rest[k]};
  return out;
};

// ---------- Kontext ----------
type Ctx = {p: Proj; t: number; d: number; zt: ZT; dat: Dat; ll: (v: any) => LL; pts: (v: any) => LL[]; ebenen: any[]};
type Pt = {ll: LL; id?: string; props?: any; name?: string};

const sicht = (c: Ctx, e: any, em: number, o?: any) => {
  const bei = e.blende ?? 0.4, aus = e.blendeAus ?? bei;
  const ate = e.ate !== undefined ? c.zt(e.ate) : undefined;
  return Math.min(fase(c.t, em, em + bei), ate === undefined ? 1 : 1 - fase(c.t, ate - aus, ate)) * kfWert(c.zt, o ?? e.o, c.t, 1);
};
const nurAus = (c: Ctx, e: any) => {
  const aus = e.blendeAus ?? e.blende ?? 0.4;
  return (e.ate !== undefined ? 1 - fase(c.t, c.zt(e.ate) - aus, c.zt(e.ate)) : 1) * kfWert(c.zt, e.o, c.t, 1);
};
const winkelVon = (m: LL, q: LL) => (Math.atan2((q[0] - m[0]) * Math.cos(m[1] * Math.PI / 180), q[1] - m[1]) * 180 / Math.PI + 360) % 360;
const SCHLUESSEL = new Set(['typ', 'id', 'liste', 'n', 'stufe', 'bis', 'datei', 'filter', 'kranz', 'aus', 'ordnung', 'reihenfolge', 'je', 'letzte', 'ereignisse', 'namen']);

// Punkte einer Ebene (Datei / kranz / aus / liste); null = Ebene hat keine Punktquelle
const punkte = (e: any, c: Ctx): Pt[] | null => {
  let pts: Pt[] | null = null;
  if (e.aus) { const l = c.ebenen.find((x) => x.id === e.aus); pts = l ? punkte(l, c) : []; }
  else if (e.datei && e.art !== 'linie') {
    pts = teile(c.dat(e.datei), e.filter).filter((x) => x.art === 'punkt').map((x) => ({ll: x.ringe[0][0], id: x.props.id, props: x.props, name: x.props.name}));
  } else if (e.kranz) {
    const k = e.kranz, r = zufall(k.saat ?? 1), m = c.ll(k.mitte), streu = k.streu ?? 0.12, n = k.n ?? 8;
    pts = Array.from({length: n}, (_, i) => { const a = (i / n) * 2 * Math.PI + (k.phase ?? 0.3), dd = k.km * (1 - streu + 2 * streu * r()); return {ll: ausMetern(m, Math.sin(a) * dd * 1000, Math.cos(a) * dd * 1000)}; });
  } else if (e.liste) pts = e.liste.map((x: any) => ({ll: c.ll(x.ll), id: x.id, props: x, name: x.name}));
  if (pts && e.reihenfolge) { const R: string[] = e.reihenfolge; pts = pts.slice().sort((a, b) => (R.indexOf(a.id!) + 1 || 999) - (R.indexOf(b.id!) + 1 || 999)); }
  if (pts && e.ordnung?.winkel) { const m = c.ll(e.ordnung.winkel); pts = pts.slice().sort((a, b) => winkelVon(m, a.ll) - winkelVon(m, b.ll)); }
  return pts;
};
// Elemente einer Ebene: Basis-Props + Einzelwerte, mit Einsatzzeit _em (Staffelung stufe / bis)
const expandiere = (e: any, c: Ctx): any[] => {
  const base: any = {}; for (const [k, v] of Object.entries(e)) if (!SCHLUESSEL.has(k)) base[k] = v;
  const pts = punkte(e, c);
  let raw: any[];
  if (e.liste && !e.aus && !e.datei && !e.kranz) raw = e.liste.map((x: any) => ({...base, ...x}));
  else if (pts) raw = pts.map((q, i) => ({...base, ...(e.je?.[q.id!] || {}), ll: q.ll, id: q.id, props: q.props, name: (e.je?.[q.id!]?.name) ?? q.name}));
  else if (e.n) raw = Array.from({length: e.n}, () => ({...base}));
  else raw = [{...base}];
  const n = raw.length, em0 = c.zt(e.em, 0);
  const stufe = e.stufe !== undefined ? e.stufe : e.bis !== undefined && n > 1 ? (c.zt(e.bis) - em0) / (n - 1) : 0;
  return raw.map((it, i) => {
    const x = i === n - 1 && e.letzte ? {...it, ...e.letzte} : it;
    return {...x, _i: i, _n: n, _stufe: stufe, _em: x.em !== undefined && x.em !== e.em ? c.zt(x.em, 0) : em0 + i * stufe};
  });
};

// ---------- Ebenen ----------
type L = React.FC<{e: any; c: Ctx}>;
const EOrt: L = ({e, c}) => <>{expandiere(e, c).map((it, i) => <Ort key={i} p={c.p} ll={c.ll(it.ll)} name={it.name ?? ''} o={sicht(c, e, it._em, it.o)} seite={it.seite ?? 'r'} gross={it.gross ?? 21} />)}</>;
const EMarke: L = ({e, c}) => <>{expandiere(e, c).map((it, i) => <Marke key={i} p={c.p} ll={c.ll(it.ll)} titel={it.titel} unter={it.unter} farbe={it.farbe ?? C.papier} o={sicht(c, e, it._em, it.o)}
  r={it.r ?? 7} seite={it.seite ?? 'r'} gross={it.gross ?? 30} ring={it.ring ?? true} dx={it.dx ?? 0} dy={it.dy ?? 0} />)}</>;
const EZiel: L = ({e, c}) => <>{expandiere(e, c).map((it, i) => {
  const ll = c.ll(it.ll), o = sicht(c, e, it._em, it.o), tr = it.treffer !== undefined ? c.zt(it.treffer) : undefined;
  return (
    <React.Fragment key={i}>
      <Ziel p={c.p} ll={ll} o={o} r={it.r ?? 46} farbe={it.farbe ?? C.signal} dreh={(c.t - it._em) * (it.drehen ?? 0)} />
      {tr !== undefined && <Svg><BlitzK p={c.p} ll={ll} t0={tr} t={c.t} farbe={it.treffFarbe ?? C.rot} r={it.treffR ?? 8} ringR={it.ringR ?? 60} rest={0.85} dauer={it.treffDauer ?? 1.1} /></Svg>}
    </React.Fragment>
  );
})}</>;
const EBlitz: L = ({e, c}) => <Svg>{expandiere(e, c).map((it, i) => <BlitzK key={i} p={c.p} ll={c.ll(it.ll)} t0={it._em} t={c.t} farbe={it.farbe ?? C.signal} r={it.r ?? 5} ringR={it.ringR ?? 40} rest={it.rest ?? 0.85} dauer={it.dauer ?? 1.1} />)}</Svg>;
const EKreis: L = ({e, c}) => <>{expandiere(e, c).map((it, i) => {
  const m = c.ll(it.ll), dauer = it.dauer ?? 0.9, o = nurAus(c, e);
  if (it.modus === 'puls') {
    const periode = it.periode ?? 2.4, nr = it.ringe ?? 3;
    return <React.Fragment key={i}>{Array.from({length: nr}, (_, k) => {
      const tt = c.t - it._em; if (tt < 0) return null;
      const u = (((tt / periode) + k / nr) % 1);
      return <Kreis key={k} p={c.p} m={m} km={it.km * (0.15 + 0.85 * Math.sqrt(u))} farbe={it.farbe ?? C.cyan} breite={it.breite ?? 2.5} fill={it.fill ?? 'none'} opacity={o * (1 - u) * sichtbar(c.t, it._em, 0.3)} />;
    })}</React.Fragment>;
  }
  const f = fase(c.t, it._em, it._em + dauer);
  const wachsen = it.modus === 'wachsen';
  const [tx, ty] = c.p(...zielPkt(m, it.az ?? 215, it.km));
  return (
    <React.Fragment key={i}>
      <Kreis p={c.p} m={m} km={wachsen ? Math.max(0.0001, it.km * f) : it.km} fort={wachsen ? (f > 0 ? 1 : 0) : f} farbe={it.farbe ?? C.signal} breite={it.breite ?? 2.5} fill={it.fill} dash={it.dash} opacity={o * (wachsen ? sichtbar(c.t, it._em, 0.2) : 1)} />
      {it.text && <Text2 x={tx - 14} y={ty + 4} gross={it.text} o={sichtbar(c.t, it._em + dauer * 0.8, 0.4, e.ate !== undefined ? c.zt(e.ate) : undefined)} groesse={it.textGroesse ?? 40} farbe={it.textFarbe ?? it.farbe ?? C.signal} align="r" />}
    </React.Fragment>
  );
})}</>;
const ELineal: L = ({e, c}) => {
  const em = c.zt(e.em, 0), f = fase(c.t, em, em + (e.dauer ?? 1.2)), o = nurAus(c, e);
  return <div style={{position: 'absolute', inset: 0, opacity: o}}><Lineal p={c.p} a={c.ll(e.a)} b={c.ll(e.b)} fort={f} schrittKm={e.schrittKm ?? 10} farbe={e.farbe ?? C.signal} text={e.text} textOpacity={sichtbar(c.t, em + (e.dauer ?? 1.2), 0.4)}
    zaehler={e.zaehler ?? true} seite={e.seite ?? 1} textGroesse={e.textGroesse ?? 44} textPos={e.textPos ?? 0.5} textAbstand={e.textAbstand ?? 50} zSeite={e.zSeite ?? 1} /></div>;
};
const ELinie: L = ({e, c}) => {
  const em = c.zt(e.em, 0), pts = c.pts(e.pts);
  const f = e.verlauf ? kfWert(c.zt, e.verlauf, c.t, 1, true) : fase(c.t, em, em + (e.dauer ?? 1));
  return <Linie p={c.p} pts={pts} fort={f} farbe={e.farbe ?? C.rot} breite={e.breite ?? 3} dash={e.dash} glow={e.glow ?? 0} opacity={sicht(c, e, em - 0.1, e.o) * 1} kopf={e.kopf ?? false} />;
};
// Frontverlauf: Linie waechst, danach "wandert" sie (Morph) zu einer zweiten Linie; die alte bleibt als Spur
const EFront: L = ({e, c}) => {
  const em = c.zt(e.em, 0), A = c.pts(e.pts), n = e.punkte ?? 160;
  const Ar = resample(A, n);
  const stufen: LL[][] = [Ar, ...((e.dann || []) as any[]).map((s) => resample(c.pts(s.pts), n))];
  const wechsel: number[] = ((e.dann || []) as any[]).map((s) => c.zt(s.t, 0)), dauern: number[] = ((e.dann || []) as any[]).map((s) => s.dauer ?? 1.6);
  let cur = stufen[0]; let k = -1;
  for (let i = 0; i < wechsel.length; i++) if (c.t >= wechsel[i]) { const u = fase(c.t, wechsel[i], wechsel[i] + dauern[i]); cur = stufen[i].map((q, j) => [q[0] + (stufen[i + 1][j][0] - q[0]) * u, q[1] + (stufen[i + 1][j][1] - q[1]) * u] as LL); k = i; }
  const f = k >= 0 ? 1 : fase(c.t, em, em + (e.dauer ?? 1.6));
  const o = sicht(c, e, em - 0.1, e.o);
  return (
    <>
      {e.spur !== false && k >= 0 && <Linie p={c.p} pts={stufen[k]} fort={1} farbe={e.farbe ?? C.rot} breite={(e.breite ?? 3.5) * 0.6} dash="8 7" opacity={o * 0.45} />}
      <Linie p={c.p} pts={cur} fort={f} farbe={e.farbe ?? C.rot} breite={e.breite ?? 3.5} dash={e.dash} glow={e.glow ?? 1} opacity={o} kopf />
    </>
  );
};
const EPfeil: L = ({e, c}) => {
  const em = c.zt(e.em, 0), f = e.verlauf ? kfWert(c.zt, e.verlauf, c.t, 1, true) : fase(c.t, em, em + (e.dauer ?? 1.5));
  return <Pfeil p={c.p} pts={c.pts(e.pts)} fort={f} breite={e.breite ?? 46} farbe={e.farbe ?? C.papier} fill={e.fill ?? 'rgba(233,225,207,0.16)'} opacity={nurAus(c, e)} glatt={e.glatt ?? true} />;
};
const EStrahl: L = ({e, c}) => <>{expandiere(e, c).map((it, i) => {
  const pts = it.pts ? c.pts(it.pts) : null, a = pts ? pts[0] : c.ll(it.a), b = pts ? pts[pts.length - 1] : c.ll(it.b);
  return <Strahl key={i} p={c.p} a={a} b={b} fort={fase(c.t, it._em, it._em + (it.dauer ?? 0.9))} farbe={it.farbe ?? C.papier} breite={it.breite ?? 3} dash={it.dash} bog={it.bog ?? 0} o={nurAus(c, e)} spitze={it.spitze ?? true} glow={it.glow ?? false} />;
})}</>;
const bogenWerte = (e: any, c: Ctx) => expandiere(e, c).map((it) => {
  const m = c.ll(it.ll), zentrum = it.zentrum ? c.ll(it.zentrum) : null;
  const az = typeof it.az === 'number' ? it.az : zentrum ? azimut(zentrum, m) : 0, halb = it.halb ?? 55;
  return {it, m, az, halb, km: it.km};
});
const EBogen: L = ({e, c}) => <>{bogenWerte(e, c).map(({it, m, az, halb, km}, i) => (
  <Bogen key={i} p={c.p} m={m} km={km} a0={az - halb} a1={az + halb} fort={fase(c.t, it._em, it._em + (it.dauer ?? 0.6))} farbe={it.farbe ?? C.orange} breite={it.breite ?? 2.6} o={nurAus(c, e) * 0.9} dash={it.dash} />
))}</>;
const ERing: L = ({e, c}) => {
  const em = c.zt(e.em, 0), pts = (punkte(e, c) || []).map((q) => ({ll: q.ll})) as any[];
  const f = e.verlauf ? kfWert(c.zt, e.verlauf, c.t, 1, true) : fase(c.t, em, em + (e.dauer ?? 1.5));
  const glow = (e.glow ?? 0) + (e.puls ? (0.5 + 0.5 * Math.sin(c.t * e.puls)) : 0);
  return <RingLinie p={c.p} ring={pts} fort={f} farbe={e.farbe ?? C.papier} breite={e.breite ?? 2.5} dash={e.dash} o={sicht(c, {...e, blende: e.blende ?? 0.1}, em, e.o)} fill={e.fill} glow={glow} />;
};
// Polygone / Linien / Punkte aus Datei oder pts. stil: {fill, stroke, breite, dash, glow, r}
const EGeo: L = ({e, c}) => {
  const em = c.zt(e.em, 0), o = sicht(c, e, em, e.o), s = e.stil || {};
  let teileL = e.pts ? [{art: (e.art ?? 'flaeche') as any, ringe: [c.pts(e.pts)], props: {}}] : teile(c.dat(e.datei), e.filter);
  if (e.kappeOst) teileL = teileL.map((t) => (t.art === 'flaeche' ? {...t, ringe: t.ringe.map((r, i) => (i === 0 ? kappeOst(r, e.kappeOst) : r))} : t));
  const f = e.dauer ? fase(c.t, em, em + e.dauer) : 1;
  if (o <= 0.005 || f <= 0) return null;
  const flaechen = teileL.filter((t) => t.art === 'flaeche'), linien = teileL.filter((t) => t.art === 'linie'), punktE = teileL.filter((t) => t.art === 'punkt');
  const dF = flaechen.map((t) => t.ringe.map((r) => pfad(c.p, r, true)).join('')).join('');
  const dL = linien.map((t) => t.ringe.map((r) => xyPfad(schneide(r.map((q) => c.p(q[0], q[1])), f))).join('')).join('');
  const stroke = s.stroke ?? (flaechen.length ? 'rgba(233,225,207,0.6)' : 'rgba(233,225,207,0.5)');
  return (
    <Svg style={{opacity: o}}>
      {dF && <path d={dF} fillRule="evenodd" fill={s.fill ?? 'rgba(233,225,207,0.10)'} stroke={s.stroke === null ? 'none' : stroke} strokeWidth={s.breite ?? 2} strokeDasharray={s.dash} strokeLinejoin="round" />}
      {dL && s.glow > 0 && <path d={dL} fill="none" stroke={stroke} strokeOpacity={0.25 * s.glow} strokeWidth={(s.breite ?? 2) * 4} strokeLinejoin="round" strokeLinecap="round" />}
      {dL && <path d={dL} fill="none" stroke={stroke} strokeWidth={s.breite ?? 2} strokeDasharray={s.dash} strokeLinejoin="round" strokeLinecap="round" />}
      {punktE.map((t, i) => t.ringe.flat().map((q, j) => { const [x, y] = c.p(q[0], q[1]); return <circle key={i + '_' + j} cx={x} cy={y} r={s.r ?? 4} fill={s.fill ?? stroke} />; }))}
    </Svg>
  );
};
const EFleck: L = ({e, c}) => { const em = c.zt(e.em, 0); return <Fleck p={c.p} ll={c.ll(e.ll)} km={e.km ?? 3} fort={fase(c.t, em, em + (e.dauer ?? 1.2))} farbe={e.farbe} o={nurAus(c, e)} id={e.id ?? 'x'} />; };
const EHauch: L = ({e, c}) => { const em = c.zt(e.em, 0); return <Hauch p={c.p} m={c.ll(e.ll)} a={e.a ?? 1.4} b={e.b ?? 0.85} winkel={e.winkel ?? 0} t={c.t} o={sicht(c, e, em, e.o)} id={e.id ?? 'h'} fragen={e.fragen ?? 6} />; };
const EFlamme: L = ({e, c}) => {
  const em = c.zt(e.em, 0), [x, y] = c.p(...c.ll(e.ll));
  const o = c.t > em ? Math.max(0, 1 - (c.t - em) / (e.dauer ?? 4)) : 0;
  return <Svg>{o > 0 && <Flamme x={x + (e.dx ?? 0)} y={y + (e.dy ?? 0)} s={e.s ?? 24} o={o} />}</Svg>;
};
const EZeichen: L = ({e, c}) => { const em = c.zt(e.em, 0), [x, y] = c.p(...c.ll(e.ll)); return <Zeichen x={x + (e.dx ?? 0)} y={y + (e.dy ?? 0)} text={e.text} r={e.r} farbe={e.farbe} o={sicht(c, e, em, e.o)} groesse={e.groesse} />; };

// Symbole mit Zustaenden (Forts, Orte, Einheiten). ereignisse: [{ids|wo, art: fall|rot|hell|dim|intakt|blitz|name, t, dauer, wert, bis, puls:{freq,tief}}]
const symBerechne = (e: any, c: Ctx) => {
  const items = expandiere(e, c);
  const ev = ((e.ereignisse || []) as any[]).map((x) => ({...x, T0: c.zt(x.t, 0), B: x.bis !== undefined ? c.zt(x.bis) : undefined}));
  const stag = items.length > 0 && items[0]._stufe > 0;
  return items.map((it) => {
    const z: Zust = {}; let nameO: number | undefined; let fallT: number | undefined;
    for (const x of ev) {
      if (x.ids ? !x.ids.includes(it.id) : x.wo ? Object.entries(x.wo).some(([k, v]) => prop(it.props, k) !== v) : false) continue;
      const dauer = x.dauer ?? 0.9, w = x.wert ?? 1, T = x.T0 + (x.stufe ?? 0) * it._i;   // stufe: Staffelung je Element
      let u = fase(c.t, T, T + dauer) * w;
      if (x.B !== undefined) u *= 1 - fase(c.t, x.B - (x.bisDauer ?? 0.4), x.B);
      if (x.puls) u *= (x.puls.tief ?? 0.2) + (1 - (x.puls.tief ?? 0.2)) * (0.5 + 0.5 * Math.sin(c.t * (x.puls.freq ?? 8)));
      switch (x.art) {
        case 'fall': z.fall = Math.max(z.fall ?? 0, u); fallT = fallT === undefined ? T : Math.min(fallT, T); break;
        case 'rot': z.rot = Math.max(z.rot ?? 0, u); break;
        case 'hell': z.hell = Math.max(z.hell ?? 0, u); break;
        case 'dim': z.dim = Math.max(z.dim ?? 0, u); break;
        case 'intakt': z.intakt = Math.max(z.intakt ?? 0, u); break;
        case 'blitz': z.blitz = c.t >= T ? Math.max(z.blitz ?? 0, Math.max(0, 1 - (c.t - T) / dauer)) : z.blitz; break;
        case 'name': nameO = u; break;
      }
    }
    if (z.hell) z.hell *= 1 - (z.fall ?? 0);
    const nr = e.reihenfolge ? (e.reihenfolge as string[]).indexOf(it.id) + 1 : undefined;
    const pop = stag ? fase(c.t, it._em, it._em + 0.35) : 1;
    const o = stag ? nurAus(c, e) : sicht(c, e, it._em, e.o);
    const tag = e.tagProp && it.props ? +String(prop(it.props, e.tagProp) ?? '').slice(8, 10) || undefined : undefined;
    return {it, z, nameO, fallT, nr, pop, o, tag, da: c.t >= it._em};
  });
};
const sFuer = (km: number) => (km < 0.02 ? 17 : km < 0.05 ? 14 : km < 0.12 ? 11 : 8);
const ESymbol: L = ({e, c}) => {
  const L_ = symBerechne(e, c), s = e.s ?? sFuer(c.p.kam.km), nm = e.namen;
  const formVon = (it: any) => (it.form ?? (e.formen && e.formProp ? e.formen[prop(it.props, e.formProp)] : undefined) ?? e.form ?? 'dreieck');
  const gefVon = (it: any) => (it.gefuellt ?? (e.gefuelltProp ? prop(it.props, e.gefuelltProp) === e.gefuelltWert : undefined) ?? e.gefuellt ?? true);
  const zentrum = nm?.zentrum ? c.ll(nm.zentrum) : undefined;
  const nameIn = nm ? sichtbar(c.t, c.zt(nm.em, 0), 0.5, nm.ate !== undefined ? c.zt(nm.ate) : undefined) : 0;
  const text = (it: any) => {
    if (it.text) return it.text;
    if (nm?.kurz?.[it.id]) return nm.kurz[it.id];
    const n: string = it.name ?? it.id ?? '';
    return nm?.sub ? n.replace(new RegExp(nm.sub[0]), nm.sub[1]) : n;
  };
  return (
    <>
      <Svg>
        {L_.map(({it, z, nr, pop, o}, i) => { const [x, y] = c.p(it.ll[0], it.ll[1]); return <SymK key={i} x={x} y={y} s={it.s ?? s} form={formVon(it)} gefuellt={gefVon(it)} z={z} o={o} pop={pop} farbe={it.farbe ?? e.farbe} zahl={e.zahl === 'nr' ? nr : undefined} />; })}
      </Svg>
      {nm && L_.map(({it, nameO, pop, o}, i) => <SymName key={i} p={c.p} ll={it.ll} zentrum={zentrum} text={text(it)} o={nameIn * (nameO ?? nm.o ?? 1) * pop ** 2 * o} gross={nm.groesse ?? 21} farbe={nm.farbe} abstand={(it.s ?? s) + 16} seite={it.nameSeite ?? nm.seite} />)}
    </>
  );
};
const zaehlPop = (layer: any, c: Ctx) => expandiere(layer, c).filter((it) => c.t >= it._em).length;

// Schnitt von Routen (Polylinien) mit den Reichweitenbogen (Kreis um m, nur im Azimutfenster)
const schnittpunkte = (routen: LL[][], bogen: {m: LL; km: number; az: number; halb: number}[]): LL[] => {
  const out: LL[] = [], kmLat = 111.195, kmLon = (lat: number) => 111.195 * Math.cos(lat * Math.PI / 180);
  bogen.forEach(({m, km, az, halb}) => {
    for (const r of routen) for (let i = 0; i < r.length - 1; i++) {
      const A: XY = [(r[i][0] - m[0]) * kmLon(m[1]), (r[i][1] - m[1]) * kmLat], B: XY = [(r[i + 1][0] - m[0]) * kmLon(m[1]), (r[i + 1][1] - m[1]) * kmLat];
      const dx = B[0] - A[0], dy = B[1] - A[1], aa = dx * dx + dy * dy, bb = 2 * (A[0] * dx + A[1] * dy), cc = A[0] * A[0] + A[1] * A[1] - km * km, disc = bb * bb - 4 * aa * cc;
      if (disc < 0) continue;
      for (const s of [(-bb - Math.sqrt(disc)) / (2 * aa), (-bb + Math.sqrt(disc)) / (2 * aa)]) {
        if (s < 0 || s > 1) continue;
        const q: XY = [A[0] + dx * s, A[1] + dy * s], a2 = (Math.atan2(q[0], q[1]) * 180 / Math.PI + 360) % 360;
        if (Math.abs(((a2 - az + 540) % 360) - 180) <= halb) out.push([m[0] + q[0] / kmLon(m[1]), m[1] + q[1] / kmLat]);
      }
    }
  });
  return out;
};
const EKreuz: L = ({e, c}) => {
  const bl = c.ebenen.find((x) => x.id === e.bogen);
  const sp = React.useMemo(() => (bl ? schnittpunkte((e.routen as any[]).map((r) => c.pts(r)), bogenWerte(bl, c)) : []), [bl, c.dat]);
  const em = c.zt(e.em, 0), st = e.stufe ?? 0.05;
  return <Svg>{sp.map(([lo, la], i) => { const [x, y] = c.p(lo, la); const u = fase(c.t, em + i * st, em + 0.6 + i * st) * nurAus(c, e); return u > 0 ? <g key={i} transform={`translate(${x} ${y}) scale(${0.5 + 0.5 * u})`} opacity={u}><circle r={13} fill="rgba(217,72,59,0.30)" stroke={e.farbe ?? C.rot} strokeWidth={3} /><path d="M-6 -6L6 6M6 -6L-6 6" stroke={e.farbe ?? C.rot} strokeWidth={3.5} /></g> : null; })}</Svg>;
};

// ---------- Texte / HUD ----------
const platz = (e: any, c: Ctx): [number, number] => {
  if (e.ll) { const [x, y] = c.p(...c.ll(e.ll)); return [x + (e.dx ?? 0), y + (e.dy ?? 0)]; }
  return e.xy || [960, 540];
};
const fuellN = (txt: string | undefined, n: number | undefined) => (txt !== undefined && n !== undefined ? txt.replace('{n}', String(n)) : txt);
const ETexto: L = ({e, c}) => {
  const em = c.zt(e.em, 0), [x, y] = platz(e, c), l = e.zaehltAus ? c.ebenen.find((q) => q.id === e.zaehltAus) : null, n = l ? zaehlPop(l, c) : undefined;
  const atmen = e.atmen ? 0.75 + 0.2 * Math.sin(c.t * e.atmen) : 1;
  return <Text2 x={x} y={y} klein={fuellN(e.klein, n)} gross={fuellN(e.gross, n)} o={sicht(c, e, em, e.o) * atmen} groesse={e.groesse ?? 54} farbe={e.farbe ?? C.signal} align={e.align === 'c' ? 'c' : e.align === 'r' ? 'r' : 'l'} breite={e.breite} mono={e.mono} />;
};
const EStempel: L = ({e, c}) => { const [x, y] = platz(e, c); return <Stempel x={x} y={y} t={c.t} em={c.zt(e.em, 0)} text={e.text} unter={e.unter} farbe={e.farbe ?? C.signal} dreh={e.dreh ?? -4} groesse={e.groesse ?? 70} ate={e.ate !== undefined ? c.zt(e.ate) : undefined} />; };
const EGebiet: L = ({e, c}) => <Gebiet p={c.p} ll={c.ll(e.ll)} text={e.text} o={sicht(c, e, c.zt(e.em, 0), e.o)} groesse={e.groesse ?? 54} farbe={e.farbe} dreh={e.dreh ?? 0} />;
const EZahl: L = ({e, c}) => {
  const em = c.zt(e.em, 0), z = e.zaehlt;
  let wert: string = e.wert ?? '', farbe = e.farbe ?? C.signal;
  if (e.zaehltAus) { const l = c.ebenen.find((q) => q.id === e.zaehltAus); wert = String(l ? zaehlPop(l, c) : 0); }
  else if (z) {
    const e0 = z.em !== undefined ? c.zt(z.em) : em, dauer = z.endeT !== undefined ? c.zt(z.endeT) - e0 : z.dauer ?? 1;
    let v: number;
    if (z.stufen) { const sch = (z.bis - z.von); v = c.t < e0 ? z.von : Math.min(z.bis, z.von + Math.floor((c.t - e0) / (dauer / sch) + 1e-6)); }
    else v = z.von + (z.bis - z.von) * fase(c.t, e0, e0 + dauer);
    wert = (z.praefix ?? '') + de(v, z.dec ?? 0) + (z.suffix ?? '');
  }
  for (const ph of (e.phasen || []) as any[]) if (c.t >= c.zt(ph.t)) { if (ph.farbe) farbe = ph.farbe; if (ph.suffix) wert += ph.suffix; }
  return <Zahl o={sicht(c, e, em, e.o)} label={e.label ?? ''} wert={wert} unter={e.unter} groesse={e.groesse ?? 150} farbe={farbe} top={e.top ?? 110} right={e.right ?? 80} />;
};
const ankerVon = (e: any, c: Ctx): Anker => ((e.anker || []) as any[]).map((a) => ({t: c.zt(a.t, 0), wert: a.wert})).sort((a, b) => a.t - b.t);
const EDatum: L = ({e, c}) => <DatumK t={c.t} anker={ankerVon(e, c)} fmt={e.fmt} kopf={e.kopf} unter={e.unter} o={sicht(c, e, c.zt(e.em, 0), e.o)} right={e.right} top={e.top} groesse={e.groesse} />;
const zeitleisteSicht = (e: any, c: Ctx) => sicht(c, e, c.zt(e.em, 0), e.o);
const EZeitleiste: L = ({e, c}) => {
  const dl = c.ebenen.find((q) => q.id === e.datum), sl = c.ebenen.find((q) => q.id === e.symbole);
  const wert = dl ? gleit(ankerVon(dl, c), c.t) : e.wert ?? e.von;
  const ereignisse = sl ? symBerechne(sl, c).filter((x) => x.fallT !== undefined && x.tag).map((x) => ({tag: x.tag!, t: x.fallT!, form: formDes(sl, x.it)})) : [];
  const baender = ((e.baender || []) as any[]).map((b) => { const t0 = c.zt(b.em, 0); return {a: b.a, b: b.b, text: b.text, farbe: b.farbe, hoch: b.hoch, fort: fase(c.t, t0, t0 + (b.dauer ?? 1.4))}; });
  const m = e.marke && c.t > c.zt(e.marke.em, 0) ? {tag: e.marke.tag, text: e.marke.text} : undefined;
  const ticks: number[] = e.ticks ?? Array.from({length: Math.floor(e.bis - e.von) + 1}, (_, i) => Math.ceil(e.von) + i).filter((x) => x <= e.bis);
  return <ZeitleisteK t={c.t} o={zeitleisteSicht(e, c)} wert={wert} von={e.von} bis={e.bis} ticks={ticks} fmt={e.fmt} kopf={e.kopf} baender={baender} ereignisse={ereignisse} marke={m} zeiger={e.zeiger ?? true} />;
};
const formDes = (sl: any, it: any) => (it.form ?? (sl.formen && sl.formProp ? sl.formen[prop(it.props, sl.formProp)] : undefined) ?? sl.form ?? 'dreieck');
const EUhr: L = ({e, c}) => {
  const st = ((e.schritte || []) as any[]).map((s) => ({T: c.zt(s.t, 0), wert: s.wert, text: s.text, dauer: s.dauer ?? 1})).sort((a, b) => a.T - b.T);
  let wert = st[0]?.wert ?? 0, text = st[0]?.text ?? '';
  for (let i = 1; i < st.length; i++) if (c.t >= st[i].T) { wert = st[i - 1].wert + (st[i].wert - st[i - 1].wert) * fase(c.t, st[i].T, st[i].T + st[i].dauer); text = st[i].text; }
  return <Uhr o={sicht(c, e, c.zt(e.em, 0), e.o)} wert={wert} text={text} x={e.x} y={e.y} marken={e.marken} />;
};

const EBENEN: Record<string, L> = {
  ort: EOrt, marke: EMarke, ziel: EZiel, blitz: EBlitz, kreis: EKreis, lineal: ELineal, linie: ELinie, front: EFront, pfeil: EPfeil, strahl: EStrahl, bogen: EBogen, ring: ERing,
  geojson: EGeo, flaeche: EGeo, fleck: EFleck, hauch: EHauch, flamme: EFlamme, zeichen: EZeichen, symbol: ESymbol, kreuz: EKreuz,
  text: ETexto, stempel: EStempel, gebiet: EGebiet, zahl: EZahl, datum: EDatum, zeitleiste: EZeitleiste, uhr: EUhr,
};

// ---------- Grund ----------
type RasterDef = {bild: string; b: {west: number; east: number; south: number; north: number}; o?: number; rand?: number; filter?: string; px?: [number, number]};
const autoRaster = (): RasterDef[] => {
  const R: Record<string, any> = RASTER as any, ks = Object.keys(R);
  const gross = ks.reduce((a, k) => (R[k].east - R[k].west > R[a].east - R[a].west ? k : a), ks[0]);
  return ks.map((k) => (k === gross ? {bild: 'karten2/' + k, b: R[k], rand: 0.01} : {bild: 'karten2/' + k, b: R[k], px: [337, 675] as [number, number], o: k.endsWith('.png') ? 0.9 : 1, rand: k.endsWith('.png') ? 0 : 0.2}));
};
const GrundK: React.FC<{p: Proj; g: any; c: Ctx}> = ({p, g, c}) => {
  const km = p.kam.km, heller = g.heller !== undefined ? kfWert(c.zt, g.heller, c.t, 1) : 1;
  const filt = (r: RasterDef) => [r.filter, heller !== 1 ? `brightness(${heller})` : ''].filter(Boolean).join(' ') || undefined;
  const rasters: RasterDef[] = g.modus === 'einfach' ? [] : (g.rasters as RasterDef[] | undefined)?.map((r: any) => ({...r, b: r.grenzen ? {west: r.grenzen[0], south: r.grenzen[1], east: r.grenzen[2], north: r.grenzen[3]} : r.b})) ?? autoRaster();
  const netz = kfWert(c.zt, g.netz, c.t, 0.7), grenzen = kfWert(c.zt, g.grenzen, c.t, 0.8);
  const flAuto = km > 0.07 ? 1 : km > 0.03 ? Math.min(1, (km - 0.03) / 0.04) : 0;
  const fluesse = g.fluesse === undefined || g.fluesse === 'auto' ? flAuto : kfWert(c.zt, g.fluesse, c.t, 0);
  return (
    <>
      {rasters.map((r, i) => {
        const [x0] = p(r.b.west, r.b.north), [x1] = p(r.b.east, r.b.south), w = x1 - x0;
        const o = (r.o ?? 1) * (r.px ? Math.min(1, Math.max(0, (w - r.px[0]) / (r.px[1] - r.px[0]))) : 1);
        return <RasterK key={i} p={p} src={r.bild} b={r.b} opacity={o} rand={r.rand ?? 0.03} filter={filt(r)} />;
      })}
      {netz > 0 && <Gradnetz p={p} opacity={netz} />}
      <GrenzenK p={p} json={grenzen > 0 ? c.dat(g.grenzenDatei ?? 'grenzen.geojson') : null} opacity={grenzen} />
      <FluesseK p={p} json={fluesse > 0 ? c.dat(g.fluesseDatei ?? 'fluesse.geojson') : null} opacity={fluesse} breite={km < 0.1 ? 2.2 : 1.6} />
    </>
  );
};

// ---------- Kamera ----------
const kamKeys = (k: any, zt: ZT, d: number): [number, number, number, number][] => {
  if (Array.isArray(k)) {
    const ks = k.map((x: any) => (Array.isArray(x) ? [zt(x[0]), x[1], x[2], x[3]] : [zt(x.t, 0), x.lon, x.lat, x.km]) as [number, number, number, number]);
    return ks.sort((a, b) => a[0] - b[0]);
  }
  const z = k.zoom ?? 0.93, dr = k.drift ?? [0, 0];   // Einzelkamera: langsame Fahrt (Deriva) ueber die Dauer der Batida
  return [[0, k.lon, k.lat, k.km], [d + 0.4, k.lon + dr[0], k.lat + dr[1], k.km * z]];
};

// ---------- Karte ----------
export const Karte: React.FC<KitProps<any>> = ({t, d, b, p: raw}) => {
  const P = React.useMemo(() => loesVorlage(raw), [raw]);
  const g = P.grund || {};
  const dateien = React.useMemo(() => {
    const s = new Set(sammleDateien(P));
    if (g.modus !== 'einfach') { if ((g.grenzen ?? 0.8) !== 0) s.add(g.grenzenDatei ?? 'grenzen.geojson'); if (g.fluesse !== 0 && g.fluesse !== false) s.add(g.fluesseDatei ?? 'fluesse.geojson'); }
    return [...s];
  }, [P]);
  const dat = useDateien(dateien);
  const zt = React.useMemo(() => mkZt(b), [b.id]);
  const keys = kamKeys(P.kamera || {lon: 5, lat: 50, km: 1}, zt, d);
  const p = projektion(kamFahrt(keys, t), P.phi0 ?? keys[0][2]);
  const {ll, pts} = mkRef(dat);
  const ebenen: any[] = P.ebenen || [];
  const c: Ctx = {p, t, d, zt, dat, ll, pts, ebenen};
  const ti = typeof P.titel === 'string' ? {text: P.titel} : P.titel;
  const zlSicht = Math.max(0, ...ebenen.filter((e) => e.typ === 'zeitleiste').map((e) => zeitleisteSicht(e, c)));
  const rh = P.rahmen === false ? null : (P.rahmen || {});
  return (
    <Atlas vignette={P.vignette} korn={P.korn}>
      <GrundK p={p} g={g} c={c} />
      {ebenen.map((e, i) => { const R = EBENEN[e.typ]; return R ? <R key={e.id ?? i} e={e} c={c} /> : null; })}
      {ti && <KartenTitel t={t} em={zt(ti.em, 0.15)} ate={ti.ate !== undefined ? zt(ti.ate) : undefined} titel={ti.text} unter={ti.unter} />}
      {rh && <Rahmen p={p} massstab={(rh.massstab ?? true) && zlSicht < 0.5} koord={rh.koord ?? false} />}
      {P.quelle && QUELLEN_IM_BILD && <Credit text={P.quelle} />}
    </Atlas>
  );
};
