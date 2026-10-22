// Painel (HUD), legendas e titulo do video 5 (dono: agente HUD). Layout medido nos quadros do original (ref/hd, teste/mapa/hud_*):
// esquerda em x=108, direita encostada a 108 da borda, rotulo pequeno em caixa alta, valor grande em serifa, subline espacada,
// fio fino e a linha PROXIMO. Legendas em italico serifado embaixo com halo radial; pilula escura quando o fundo fica claro.
import React from 'react';
import {interpolate} from 'remotion';
import {loadFont as plex} from '@remotion/google-fonts/IBMPlexSans';
import {loadFont as serif} from '@remotion/google-fonts/SourceSerif4';
import {Seg, claro, hudEm} from './hud_dados';
import LEG from './legendas.json';

const {fontFamily: sans} = plex('normal', {weights: ['400', '500', '600'], subsets: ['latin', 'latin-ext']});
const {fontFamily: num} = serif('normal', {weights: ['400'], subsets: ['latin', 'latin-ext']});
const {fontFamily: ital} = serif('italic', {weights: ['400'], subsets: ['latin', 'latin-ext']});

export type Linha = {s: number; e: number; txt: string};
export const LEGENDAS = LEG as Linha[];
// take inedito (tempo dentro do take, 0-30 s). O agente Corpo pode ajustar os numeros depois de checar as fontes.
export const LEG_TAKE: Linha[] = [
  {s: 0.6, e: 6.0, txt: 'Pausa. Aquí el tiempo nunca corrió igual para todos.'},
  {s: 6.3, e: 12.0, txt: 'Tu cabeza envejece más rápido que tus pies.'},
  {s: 12.3, e: 18.0, txt: 'Cuanto más lejos del centro de la Tierra, más rápido pasa el tiempo.'},
  {s: 18.3, e: 24.0, txt: 'En 2010 lo midieron con relojes atómicos separados por solo 33 cm.'},
  {s: 24.3, e: 29.6, txt: 'Los satélites GPS lo corrigen cada día: sin eso, fallarían unos 10 km diarios.'},
];
export const TITULO = '¿Qué pasaría si el tiempo\nse acelerara y no pudiera parar?';

const cl = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
export const op = (t: number, a: number, b: number, f = 0.3) => interpolate(t, [a, a + f, b - f, b], [0, 1, 1, 0], cl);
const SOMBRA = '0 1px 14px rgba(0,0,0,.42), 0 0 2px rgba(0,0,0,.3)';

const Segs: React.FC<{v: Seg[]}> = ({v}) => (
  <>{v.map((x, i) => x.sup
    ? <sup key={i} style={{fontSize: '0.56em', verticalAlign: 'baseline', position: 'relative', top: '-0.78em', marginLeft: '0.05em', lineHeight: 0}}>{x.t}</sup>
    : <span key={i}>{x.t}</span>)}</>
);

const rotuloSt: React.CSSProperties = {fontFamily: sans, fontWeight: 600, fontSize: 20, lineHeight: '20px', letterSpacing: '0.2em', color: 'rgba(255,255,255,.92)', whiteSpace: 'nowrap'};
const valorSt: React.CSSProperties = {fontFamily: num, fontSize: 68, lineHeight: '68px', marginTop: 12, whiteSpace: 'nowrap', fontVariantNumeric: 'lining-nums'};
const subSt: React.CSSProperties = {fontFamily: sans, fontWeight: 500, fontSize: 15, lineHeight: '15px', letterSpacing: '0.2em', marginTop: 20, color: 'rgba(255,255,255,.8)', whiteSpace: 'nowrap',
  textShadow: '0 0 6px rgba(0,0,0,.4), 0 1px 2px rgba(0,0,0,.35)'};

// t: segundo do ORIGINAL (no take, congelado em 386,5); opacidade: fusoes de entrada/saida
export const Painel: React.FC<{t: number; opacidade: number}> = ({t, opacidade}) => {
  if (opacidade <= 0.001) return null;
  const h = hudEm(t);
  const c = claro(t);
  return (
    <>
      {c > 0 && (
        <div style={{position: 'absolute', inset: 0, opacity: c * opacidade, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 34% 30% at 13% 14%, rgba(10,12,18,.62) 0%, rgba(10,12,18,.35) 45%, rgba(10,12,18,0) 100%),' +
            'radial-gradient(ellipse 34% 24% at 87% 11%, rgba(10,12,18,.6) 0%, rgba(10,12,18,.33) 45%, rgba(10,12,18,0) 100%)'}} />
      )}
      <div style={{position: 'absolute', left: 108, top: 96, color: 'white', opacity: opacidade, textShadow: SOMBRA}}>
        <div style={rotuloSt}>{h.rotulo}</div>
        <div style={valorSt}><Segs v={h.valor} /></div>
        <div style={subSt}>UN SEGUNDO PARA TI = <Segs v={h.taxa} /></div>
        {h.prox && (
          <>
            <div style={{width: 250, height: 1, marginTop: 27, background: 'rgba(255,255,255,.34)', boxShadow: '0 0 6px rgba(0,0,0,.25)'}} />
            <div style={{marginTop: 20, whiteSpace: 'nowrap', lineHeight: '15px'}}>
              <span style={{fontFamily: sans, fontWeight: 500, fontSize: 13, letterSpacing: '0.2em', color: 'rgba(255,255,255,.66)', textShadow: '0 0 6px rgba(0,0,0,.4), 0 1px 2px rgba(0,0,0,.35)'}}>PRÓXIMO</span>
              <span style={{fontFamily: sans, fontWeight: 600, fontSize: 15, letterSpacing: '0.16em', marginLeft: 14, color: 'rgba(255,255,255,.96)'}}>{h.prox.evento}</span>
            </div>
            <div style={{fontFamily: num, fontSize: 31, lineHeight: '31px', marginTop: 11, whiteSpace: 'nowrap'}}>
              {h.prox.nunca ? <Segs v={h.prox.em} /> : <>en <Segs v={h.prox.em} /></>}
            </div>
          </>
        )}
      </div>
      <div style={{position: 'absolute', right: 108, top: 96, color: 'white', opacity: opacidade, textShadow: SOMBRA, textAlign: 'right'}}>
        <div style={rotuloSt}>{h.dirRotulo}</div>
        <div style={valorSt}>{h.dirValor}</div>
        {h.dirSub && <div style={subSt}>{h.dirSub}</div>}
      </div>
    </>
  );
};

// legenda ativa em t (mesma escala de tempo da lista). reto: serifa normal (o cold open do original nao e italico)
export const Legenda: React.FC<{t: number; lista: Linha[]; escuro?: number; reto?: boolean}> = ({t, lista, escuro = 0, reto = false}) => {
  const l = lista.find((x) => t >= x.s && t < x.e);
  if (!l) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 86, display: 'flex', justifyContent: 'center', opacity: op(t, l.s, l.e)}}>
      <div style={{position: 'relative', padding: '16px 56px', maxWidth: 1500}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: 60,
          background: 'radial-gradient(ellipse, rgba(14,16,22,.5) 0%, rgba(14,16,22,0) 72%)'}} />
        {escuro > 0 && <div style={{position: 'absolute', inset: '-6px -10px', borderRadius: 999, opacity: escuro,
          background: 'rgba(22,24,30,.5)', filter: 'blur(18px)'}} />}
        <div style={{position: 'relative', fontFamily: reto ? num : ital, fontStyle: reto ? 'normal' : 'italic', fontSize: 50, lineHeight: 1.18,
          color: 'white', textAlign: 'center', textShadow: '0 2px 12px rgba(0,0,0,.55)'}}>{l.txt}</div>
      </div>
    </div>
  );
};

// titulo grande em serifa (7-11 s), como no original: centralizado, um pouco acima do meio
export const Titulo: React.FC<{t: number}> = ({t}) => {
  const a = op(t, 7, 11, 0.45);
  if (a <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: '41%', transform: 'translateY(-50%)', display: 'flex', justifyContent: 'center', opacity: a}}>
      <div style={{fontFamily: num, fontSize: 84, lineHeight: 1.16, color: 'white', textAlign: 'center', whiteSpace: 'pre-line', padding: '20px 80px',
        background: 'radial-gradient(ellipse, rgba(10,12,18,.32) 0%, rgba(10,12,18,0) 70%)', textShadow: '0 2px 26px rgba(0,0,0,.5), 0 0 3px rgba(0,0,0,.3)'}}>{TITULO}</div>
    </div>
  );
};
