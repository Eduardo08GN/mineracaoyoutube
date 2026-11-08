// Base do HUD (copiada do batedor 07): fontes OFL carregadas antes do 1o quadro e odometro de digitos que rolam
// (mecanica do `rolling-number` do Remocn, MIT, commit fd2d301). Tudo funcao do quadro.
import React from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile} from 'remotion';

export const smooth = (a: number, b: number, x: number) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
export const fmtMil = (v: number) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const fmtDec = (v: number, n = 1) => v.toFixed(n).replace('.', ',');

// ---------------------------------------------------------------- fontes (carregadas antes do primeiro quadro)
const FONTES: [string, string, FontFaceDescriptors?][] = [
  ['HudSans', 'fontes/InterTight-Var.ttf', {weight: '100 900'}],
  ['HudSerif', 'fontes/InstrumentSerif-Italic.ttf', {style: 'italic'}],
];
let fontesProntas = false;
if (typeof document !== 'undefined') {
  const h = delayRender('fontes do HUD');
  Promise.all(FONTES.map(([n, a, d]) => new FontFace(n, `url(${staticFile(a)})`, d).load().then((f) => { (document.fonts as any).add(f); })))
    .then(() => { fontesProntas = true; continueRender(h); }, () => { fontesProntas = true; continueRender(h); });
}
export const fontesOk = () => fontesProntas;

export const SANS = 'HudSans, "Inter Tight", Arial, sans-serif';
export const SERIF = 'HudSerif, Georgia, serif';
export const OURO = '#F6C453';
export const BRANCO = '#F7F5F0';
export const SOMBRA = '0 2px 14px rgba(0,0,0,0.55), 0 0 2px rgba(0,0,0,0.6)';
export const cl = (a: number, b: number, x: number) => Math.min(b, Math.max(a, x));
export const easeOut = (x: number) => 1 - Math.pow(1 - cl(0, 1, x), 3);
export const easeIn = (x: number) => Math.pow(cl(0, 1, x), 2);

// ---------------------------------------------------------------- odometro em base mista
// radices do digito menos significativo para o mais: minutos+horas = [10, 6, 10, 10]; numero comum = [10, 10, 10, ...]
// posicao continua do digito i: floor(V / W_i) + carry, onde o carry so anda no ultimo "1" antes da virada dos digitos de baixo
const posDigito = (V0: number, rad: number[], i: number) => {
  // o digito fica parado e so rola no ultimo quarto de cada unidade (le-se o numero em qualquer quadro; o giro continua visivel)
  const V = Math.floor(V0) + smooth(0.75, 1, V0 - Math.floor(V0));
  if (i === 0) return V;
  let W = 1; for (let k = 0; k < i; k++) W *= rad[k];
  const base = Math.floor(V / W), resto = V - base * W;
  return base + cl(0, 1, resto - (W - 1));
};
const Coluna: React.FC<{pos: number; radix: number; px: number; vel: number; larg: number; opac?: number}> = ({pos, radix, px, vel, larg, opac = 1}) => {
  const h = px * 1.04, av = Math.abs(vel);
  // digito lento: rola continuo. Digito rapido (> 0,35 digito por quadro): a meio caminho ele vira borrao ilegivel,
  // entao encaixa no inteiro e ganha um rastro vertical curto no sentido do giro (desfoque de movimento legivel)
  const rapido = av > 0.35;
  const val0 = ((pos % radix) + radix) % radix, val = rapido ? Math.round(val0) % radix : val0;
  const rastro = rapido ? Math.min(1, (av - 0.35) / 1.5) : 0, sinal = vel >= 0 ? 1 : -1;
  const col = (dy: number, a: number) => (
    <span style={{position: 'absolute', left: 0, top: 0, display: 'flex', flexDirection: 'column', transform: `translateY(${-val * h + dy}px)`, opacity: a}}>
      {Array.from({length: radix + 1}, (_, d) => <span key={d} style={{height: h, lineHeight: `${h}px`, textAlign: 'center', width: larg * px}}>{d % radix}</span>)}
    </span>
  );
  return (
    <span style={{position: 'relative', display: 'inline-block', overflow: 'hidden', height: h, width: larg * px, verticalAlign: 'top', opacity: opac,
      maskImage: 'linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)'}}>
      {rastro > 0 && col(sinal * h * 0.12 * (0.5 + rastro), 0.18 * rastro)}
      {rastro > 0 && col(sinal * h * 0.06 * (0.5 + rastro), 0.3 * rastro)}
      {col(0, 1)}
    </span>
  );
};
// odometro de um inteiro com separador de milhar es-ES
export const OdoNumero: React.FC<{V: number; Vant: number; digitos: number; px: number; cor?: string; milhar?: boolean}> = ({V, Vant, digitos, px, cor = BRANCO, milhar = true}) => {
  const rad = Array(digitos).fill(10);
  const cels: React.ReactNode[] = [];
  const maxV = Math.max(V, 1);
  for (let i = digitos - 1; i >= 0; i--) {
    const vis = i === 0 ? 1 : smooth(Math.pow(10, i) * 0.92, Math.pow(10, i), maxV);   // zeros a esquerda somem
    if (vis <= 0.01) continue;
    cels.push(<Coluna key={i} pos={posDigito(V, rad, i)} radix={10} px={px} vel={posDigito(V, rad, i) - posDigito(Vant, rad, i)} larg={0.6 * vis} opac={vis} />);
    if (milhar && i % 3 === 0 && i > 0) cels.push(<span key={'s' + i} style={{display: 'inline-block', width: 0.24 * px, textAlign: 'center'}}>.</span>);
  }
  return <span style={{fontFamily: SANS, fontWeight: 700, fontSize: px, color: cor, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', lineHeight: 1.04, display: 'inline-flex'}}>{cels}</span>;
};
// odometro de duracao: "23 h 59 min" com minutos em base 60
const OdoDuracao: React.FC<{M: number; Mant: number; px: number}> = ({M, Mant, px}) => {
  const rad = [10, 6, 10, 10];
  const d = (i: number, larg = 0.6, opac = 1) => <Coluna pos={posDigito(M, rad, i)} radix={rad[i]} px={px} vel={posDigito(M, rad, i) - posDigito(Mant, rad, i)} larg={larg} opac={opac} />;
  const horas = M / 60, temDezena = smooth(9.6, 10.0, horas);
  const un = (t: string) => <span style={{fontSize: px * 0.42, fontWeight: 500, opacity: 0.85, margin: `0 ${px * 0.12}px 0 ${px * 0.06}px`, alignSelf: 'flex-end', lineHeight: `${px * 0.95}px`}}>{t}</span>;
  return (
    <span style={{fontFamily: SANS, fontWeight: 700, fontSize: px, color: BRANCO, display: 'inline-flex', alignItems: 'flex-start', letterSpacing: '-0.02em', whiteSpace: 'nowrap'}}>
      {temDezena > 0.01 && d(3, 0.6 * temDezena, temDezena)}{d(2)}{un('h')}{d(1)}{d(0)}{un('min')}
    </span>
  );
};

