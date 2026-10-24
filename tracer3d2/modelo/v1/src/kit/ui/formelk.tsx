// FormelK: KaTeX-Formel mit Termen (htmlClass T1..Tn), die sich einblenden/hervorgehoben werden, plus Beschriftungen (Klammer + Text) unter/ueber Termen.
// Kopie von ui/u1_formel.Formel mit robuster Messung (Union der Kindboxen statt offsetHeight; funktioniert auch bei Bruechen und unter transform: scale).
import React, {useEffect, useLayoutEffect, useMemo, useRef, useState, useId} from 'react';
import {delayRender, continueRender, interpolateColors} from 'remotion';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {C, F, fase, sichtbar} from '../../ui/basis';

let fontsVersprechen: Promise<unknown> | null = null;
const ladeFonts = () => {
  if (!fontsVersprechen) {
    const arten = ['40px KaTeX_Main', 'italic 40px KaTeX_Main', 'bold 40px KaTeX_Main', 'italic 40px KaTeX_Math', '40px KaTeX_Size1', '40px KaTeX_Size2', '40px KaTeX_AMS'];
    fontsVersprechen = document.fonts.ready.then(() => Promise.all(arten.map((a) => document.fonts.load(a).catch(() => null))));
  }
  return fontsVersprechen;
};
const cache = new Map<string, string>();
const render = (tex: string) => {
  let s = cache.get(tex);
  if (s === undefined) {
    s = katex.renderToString(tex, {throwOnError: false, strict: false, trust: true, output: 'html', displayMode: false});
    if (cache.size > 4000) cache.clear();
    cache.set(tex, s);
  }
  return s;
};

export type FTeil = {em: number; ate?: number; hi?: [number, number]; farbe?: string};
export type FMarke = {n: number; text: string; em: number; ate?: number; stufe?: number; oben?: boolean; farbe?: string};
type Box = {x: number; y: number; w: number; h: number};

const hiWert = (tv: number, hi?: [number, number]) => (hi ? Math.min(fase(tv, hi[0], hi[0] + 0.25), 1 - fase(tv, hi[1] - 0.4, hi[1])) : 0);

const messe = (el: HTMLElement, root: HTMLElement): Box | null => {
  const rr = root.getBoundingClientRect();
  const sk = root.offsetWidth > 0 ? rr.width / root.offsetWidth : 1;
  let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
  const nodes: Element[] = [el, ...Array.from(el.querySelectorAll('*'))];
  for (const n of nodes) {
    const cls = (n as HTMLElement).className ?? '';
    if (n.tagName.toLowerCase() === 'svg' || n.tagName.toLowerCase() === 'path') continue;
    if (typeof cls === 'string' && (cls.includes('strut') || cls.includes('vlist-s') || cls.includes('pstrut') || cls.includes('svg-align') || cls.includes('hide-tail') || cls.includes('stretchy'))) continue;
    const q = n.getBoundingClientRect();
    if (q.width < 0.5 || q.height < 0.5) continue;
    l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom);
  }
  if (!isFinite(l)) return null;
  return {x: (l - rr.left) / sk, y: (t - rr.top) / sk, w: (r - l) / sk, h: (b - t) / sk};
};

export const FormelK: React.FC<{tv: number; tex: string; terme: FTeil[]; groesse?: number; farbe?: string; marken?: FMarke[]; style?: React.CSSProperties}> =
  ({tv, tex, terme, groesse = 72, farbe = C.papier, marken, style}) => {
    const pfx = 'fk' + useId().replace(/[^a-zA-Z0-9]/g, '');
    const html = useMemo(() => render(tex.replace(/\\htmlClass\{T(\d+)\}/g, (_m, n) => `\\htmlClass{${pfx}t${n}}`)), [tex, pfx]);
    const [h] = useState(() => delayRender('kit-formel', {timeoutInMilliseconds: 60000}));
    const [fontsOk, setFontsOk] = useState(false);
    const [boxen, setBoxen] = useState<Record<number, Box>>({});
    const root = useRef<HTMLSpanElement>(null);
    const fertig = useRef(false);
    useEffect(() => { ladeFonts().then(() => setFontsOk(true)); }, []);
    const schluessel = marken ? marken.map((m) => m.n).join(',') : '';
    useLayoutEffect(() => {
      if (!fontsOk) return;
      if (marken && marken.length && root.current) {
        const b: Record<number, Box> = {};
        for (const m of marken) {
          const el = root.current.querySelector(`.${pfx}t${m.n}`) as HTMLElement | null;
          const bx = el ? messe(el, root.current) : null;
          if (bx) b[m.n] = bx;
        }
        setBoxen((alt) => (JSON.stringify(alt) === JSON.stringify(b) ? alt : b));
      }
      if (!fertig.current) { fertig.current = true; requestAnimationFrame(() => continueRender(h)); }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fontsOk, html, schluessel, groesse]);
    const css = terme.map((tm, i) => {
      const o = sichtbar(tv, tm.em, 0.45, tm.ate);
      const hw = hiWert(tv, tm.hi);
      const col = interpolateColors(hw, [0, 1], [tm.farbe ?? farbe, C.signal]);
      return `.${pfx}t${i + 1}{opacity:${o.toFixed(3)};color:${col};filter:blur(${((1 - o) * 5).toFixed(2)}px);text-shadow:0 0 ${(18 * hw).toFixed(1)}px rgba(242,193,78,${(0.6 * hw).toFixed(2)});}`;
    }).join('');
    return (
      <span ref={root} style={{position: 'relative', display: 'inline-block', fontSize: groesse, color: farbe, whiteSpace: 'nowrap', ...style}}>
        <style>{css}</style>
        <span dangerouslySetInnerHTML={{__html: html}} />
        {marken && marken.map((m) => {
          const b = boxen[m.n];
          if (!b) return null;
          const o = sichtbar(tv, m.em, 0.45, m.ate);
          const l = fase(tv, m.em, m.em + 0.6);
          const tief = 26 + (m.stufe ?? 0) * 58;
          const col = m.farbe ?? C.grau;
          const cx = b.x + b.w / 2;
          const top = m.oben ? b.y - tief - 40 : b.y + b.h + 6;
          const st = {background: 'rgba(233,225,207,0.5)'};
          return (
            <span key={m.n} style={{position: 'absolute', left: 0, top: 0, opacity: o, pointerEvents: 'none'}}>
              <span style={{position: 'absolute', left: b.x + 4, width: Math.max(0, b.w - 8) * l, top: m.oben ? b.y - 6 : b.y + b.h + 4, height: 2, ...st}} />
              <span style={{position: 'absolute', left: cx - 1, top: m.oben ? b.y - 6 - tief * l : b.y + b.h + 4, width: 2, height: tief * l, ...st}} />
              <span style={{position: 'absolute', left: cx, top: m.oben ? top : top + tief, transform: 'translateX(-50%)', fontFamily: F.text, fontWeight: 500, fontSize: 28, lineHeight: '34px', color: col, whiteSpace: 'nowrap', letterSpacing: 0.3}}>{m.text}</span>
            </span>
          );
        })}
      </span>
    );
  };
