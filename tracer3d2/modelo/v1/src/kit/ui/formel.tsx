// Formel: KaTeX-Formel(n) mit Termen, die sich nacheinander einblenden, gelben Hervorhebungen und Beschriftungen unter den Termen. Plus Balken, Kurve, Deko ueber die gemeinsamen Ebenen.
import React from 'react';
import {C, F, fase, sichtbar} from '../../ui/basis';
import {FormelK as FormelKatex} from './formelk';
import {mix} from '../../ui/u1_heft';
import {KitProps} from '../tipos';
import {Ctx, mkCtx} from './lib';
import {Rahmen, zaehl} from './deko';
import {BalkenEl} from './balken';

const texNum = (c: Ctx, v: number, n: number) => c.n(v, n).split(c.dez).join('{' + c.dez + '}').split(c.tsd).join('\\,');

const FormelZeile: React.FC<{c: Ctx; f: any}> = ({c, f}) => {
  const {ts} = c;
  let tex: string = f.tex;
  if (f.zaehler) {
    const zz = f.zaehler, st = zz.stellen ?? 0;
    const cur = texNum(c, zaehl(c, zz, 0), st), fin = texNum(c, zz.bis ?? 0, st);
    tex = tex.split('{{z}}').join(`\\mathrlap{\\mathbf{${cur}}}\\phantom{\\mathbf{${fin}}}`);
  }
  const terme = (f.terme ?? []).map((t: any) => ({em: c.z(t.em, 0), ate: t.ate !== undefined ? c.z(t.ate) : undefined, hi: t.hi ? [c.z(t.hi[0]), c.z(t.hi[1])] as [number, number] : undefined, farbe: t.farbe}));
  const marken = (f.marken ?? []).map((m: any) => ({n: m.n, text: m.text, em: c.z(m.em, 0), ate: m.ate !== undefined ? c.z(m.ate) : undefined, stufe: m.stufe, oben: m.oben, farbe: m.farbe}));
  const o = f.em !== undefined ? sichtbar(ts, c.z(f.em), 0.5, f.ate !== undefined ? c.z(f.ate) : undefined) : 1;
  let tr: string | undefined;
  if (f.schrumpf) {
    const s = f.schrumpf, se = c.z(s.em, 0), k = fase(ts, se, se + (s.dauer ?? 0.9));
    tr = `translateY(${mix(s.vonY ?? 120, s.nachY ?? 0, k)}px) scale(${mix(s.vonS ?? 1.15, s.nachS ?? 0.8, k)})`;
  }
  const gl = f.groesse ?? 72;
  const inner = <div style={{opacity: o, transform: tr, transformOrigin: '50% 0%'}}><FormelKatex tv={ts} tex={tex} terme={terme} marken={marken.length ? marken : undefined} groesse={gl} farbe={f.farbe ?? C.papier} /></div>;
  if (f.x === undefined) return <div style={{position: 'absolute', left: 0, right: 0, top: f.y ?? 400, display: 'flex', justifyContent: 'center'}}>{inner}</div>;
  return <div style={{position: 'absolute', left: f.x, top: f.y ?? 400}}>{inner}</div>;
};

export const Formel: React.FC<KitProps<any>> = ({t, b, p}) => {
  const c = mkCtx(b, t, p);
  const fo: any[] = p.formeln ?? (p.tex ? [{tex: p.tex, terme: p.terme, marken: p.marken, groesse: p.groesse, y: p.y, x: p.x, zaehler: p.zaehler, schrumpf: p.schrumpf}] : []);
  const et = p.etikett;
  const bal = p.balken;
  return (
    <Rahmen c={c} p={p}>
      {et && (
        <div style={{position: 'absolute', left: et.x ?? 96, top: et.y ?? 170, opacity: sichtbar(c.ts, c.z(et.em, 0.1), 0.4)}}>
          <div style={{display: 'inline-block', padding: '10px 28px', border: `2px solid ${C.papier}`, fontFamily: F.mono, fontSize: 34, letterSpacing: 6, color: C.papier}}>{et.text}</div>
          {et.unter && <div style={{marginTop: 14, fontFamily: F.text, fontWeight: 500, fontSize: 38, color: C.grau, opacity: sichtbar(c.ts, c.z(et.unterEm, 0.9), 0.5)}}>{et.unter}</div>}
        </div>
      )}
      {fo.map((f, i) => <FormelZeile key={i} c={c} f={f} />)}
      {bal && <BalkenEl c={c} e={bal} />}
    </Rahmen>
  );
};
