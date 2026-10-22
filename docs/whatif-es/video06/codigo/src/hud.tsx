// Painel (UN DÍA DURA), legendas, titulo, cold open e telas finais do video 6 (dono: agente HUD).
// Layout medido nos quadros do original (ref/hd, ref/q10, 1080p): painel em x=92; rotulo com centro em y~88, numero serifado com
// centro em ~160, linhas em ~260 / 292 / 328. Legendas em italico serifado com centro em ~90% da altura. Cold open italico no meio.
// Telas finais: fundo #080b10, serifa centralizada; a ultima tela fica no terco de cima (o de baixo e dos cards do YouTube).
import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {loadFont as plex} from '@remotion/google-fonts/IBMPlexSans';
import {loadFont as serif} from '@remotion/google-fonts/SourceSerif4';
import {hudEm} from './hud_dados';
import LEG from './legendas.json';

const {fontFamily: sans} = plex('normal', {weights: ['400', '500', '600'], subsets: ['latin', 'latin-ext']});
const {fontFamily: num} = serif('normal', {weights: ['400'], subsets: ['latin', 'latin-ext']});
const {fontFamily: ital} = serif('italic', {weights: ['400'], subsets: ['latin', 'latin-ext']});

export type Linha = {s: number; e: number; txt: string};
const TODAS = LEG as Linha[];
const tag = (x: Linha) => (x.txt.startsWith('[TITULO]') ? 'titulo' : x.txt.startsWith('[TELA]') ? 'tela' : x.s < 4.1 ? 'frio' : 'base');
const limpa = (s: string) => s.replace(/^\[(TITULO|TELA)\]\s*/, '');
// legendas da base (tempo do original)
export const LEGENDAS: Linha[] = TODAS.filter((x) => tag(x) === 'base');
const FRIO = TODAS.find((x) => tag(x) === 'frio')!;
const TIT = TODAS.find((x) => tag(x) === 'titulo')!;
const TELAS = TODAS.filter((x) => tag(x) === 'tela').map((x) => ({...x, txt: limpa(x.txt)}));
export const TITULO = limpa(TIT.txt);

// take inedito (tempo dentro do take, 0-30 s). PLACEHOLDERS: o agente Take passa os textos definitivos.
export const LEG_TAKE: Linha[] = [
  {s: 0.6, e: 6.0, txt: 'Pausa: esto ya está pasando de verdad.'},
  {s: 6.3, e: 12.0, txt: 'La Luna frena la Tierra con las mareas.'},
  {s: 12.3, e: 18.0, txt: 'Cada siglo, el día dura casi 2 milisegundos más.'},
  {s: 18.3, e: 24.0, txt: 'Hace 400 millones de años, un año tenía unos 400 días.'},
  {s: 24.3, e: 29.6, txt: 'Lo dejaron escrito los corales fósiles.'},
];

const cl = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
export const op = (t: number, a: number, b: number, f = 0.2, g = f) => interpolate(t, [a, a + f, b - g, b], [0, 1, 1, 0], cl);
const SOMBRA = '0 1px 12px rgba(0,0,0,.45), 0 0 2px rgba(0,0,0,.35)';
const linhaSt: React.CSSProperties = {fontFamily: sans, fontWeight: 500, fontSize: 18, lineHeight: '18px', letterSpacing: '0.21em', whiteSpace: 'nowrap'};

// t: segundo do ORIGINAL (no take, congelado em 244,9); opacidade: entrada 4,1-4,3 e fusoes do take
export const Painel: React.FC<{t: number; opacidade: number}> = ({t, opacidade}) => {
  if (opacidade <= 0.001) return null;
  const h = hudEm(t);
  return (
    <>
      <div style={{position: 'absolute', inset: 0, opacity: opacidade, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 30% 26% at 15% 18%, rgba(6,9,15,.5) 0%, rgba(6,9,15,.26) 50%, rgba(6,9,15,0) 100%)'}} />
      <div style={{position: 'absolute', left: 92, top: 78, color: 'white', opacity: opacidade, textShadow: SOMBRA}}>
        <div style={{fontFamily: sans, fontWeight: 600, fontSize: 18, lineHeight: '20px', letterSpacing: '0.24em', color: 'rgba(255,255,255,.9)', whiteSpace: 'nowrap'}}>UN DÍA DURA</div>
        <div style={{fontFamily: num, fontSize: 76, lineHeight: '76px', marginTop: 24, whiteSpace: 'nowrap', fontVariantNumeric: 'lining-nums'}}>{h.dia}</div>
        <div style={{...linhaSt, marginTop: 53, color: 'rgba(255,255,255,.93)'}}>{h.vel}</div>
        <div style={{...linhaSt, marginTop: 14, color: 'rgba(222,226,232,.7)', opacity: h.opLocal}}>{h.local}</div>
        <div style={{...linhaSt, marginTop: 16, color: '#f2a65a', opacity: h.opCmp}}>{h.cmp}</div>
      </div>
    </>
  );
};

// legenda da base ativa em t (mesma escala de tempo da lista); fade de 0,2 s como no original
export const Legenda: React.FC<{t: number; lista: Linha[]}> = ({t, lista}) => {
  const l = lista.find((x) => t >= x.s && t < x.e);
  if (!l) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 64, display: 'flex', justifyContent: 'center', opacity: op(t, l.s, l.e)}}>
      <div style={{position: 'relative', padding: '14px 56px', maxWidth: 1560}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: 60, background: 'radial-gradient(ellipse, rgba(12,14,20,.48) 0%, rgba(12,14,20,0) 72%)'}} />
        <div style={{position: 'relative', fontFamily: ital, fontStyle: 'italic', fontSize: 44, lineHeight: 1.18, color: 'white', textAlign: 'center',
          textShadow: '0 2px 12px rgba(0,0,0,.6), 0 0 2px rgba(0,0,0,.35)'}}>{l.txt}</div>
      </div>
    </div>
  );
};

// texto centralizado com halo escuro (cold open, titulo)
const Centro: React.FC<{a: number; children: React.ReactNode; tam: number; top: string; italico?: boolean}> = ({a, children, tam, top, italico}) =>
  a <= 0 ? null : (
    <div style={{position: 'absolute', left: 0, right: 0, top, transform: 'translateY(-50%)', display: 'flex', justifyContent: 'center', opacity: a}}>
      <div style={{fontFamily: italico ? ital : num, fontStyle: italico ? 'italic' : 'normal', fontSize: tam, lineHeight: 1.2, color: 'white', textAlign: 'center',
        whiteSpace: 'pre-line', padding: '22px 90px', borderRadius: 80,
        background: 'radial-gradient(ellipse, rgba(10,12,18,.5) 0%, rgba(10,12,18,.22) 50%, rgba(10,12,18,0) 72%)',
        textShadow: '0 2px 22px rgba(0,0,0,.55), 0 0 3px rgba(0,0,0,.3)'}}>{children}</div>
    </div>
  );

// cold open (0,5-4,1, sai no corte seco) e titulo (4,4-6,9), tempo do original
export const Abertura: React.FC<{t: number}> = ({t}) => (
  <>
    {t < FRIO.e && <Centro a={op(t, FRIO.s, FRIO.e + 1, 0.3)} tam={50} top="46%" italico>{FRIO.txt}</Centro>}
    <Centro a={op(t, TIT.s, TIT.e, 0.3)} tam={60} top="45%">{TITULO}</Centro>
  </>
);

// telas finais (mundo 'telas', 390,1-412 do original). Tempos e textos de legendas.json ([TELA]).
export const Fim: React.FC<{t: number}> = ({t}) => {
  const [comeco, real, par, cta, agora, inscr] = TELAS;
  const linhas = par.txt.split('\n');
  const fimBloco = real.e; // 401,7
  return (
    <AbsoluteFill style={{background: '#080b10'}}>
      {/* 390,1-393,6: entra no corte seco */}
      <div style={{position: 'absolute', left: 0, right: 0, top: '46%', transform: 'translateY(-50%)', textAlign: 'center', opacity: op(t, comeco.s, comeco.e + 0.1, 0.01, 0.15),
        fontFamily: num, fontSize: 58, color: 'white'}}>{comeco.txt}</div>
      {/* 393,8-401,7: pergunta, paragrafo linha a linha e CTA dos comentarios */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, opacity: op(t, real.s, fimBloco, 0.5, 0.3)}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 236, textAlign: 'center', fontFamily: num, fontSize: 60, color: 'white'}}>{real.txt}</div>
        {linhas.map((l, i) => (
          <div key={i} style={{position: 'absolute', left: 0, right: 0, top: 398 + i * 48, textAlign: 'center', fontFamily: sans, fontWeight: 500, fontSize: 25,
            color: 'rgba(214,220,228,.88)', opacity: interpolate(t, [par.s + i * 0.6, par.s + i * 0.6 + 0.4], [0, 1], cl)}}>{l}</div>
        ))}
        <div style={{position: 'absolute', left: 0, right: 0, top: 690, textAlign: 'center', fontFamily: sans, fontWeight: 600, fontSize: 25, color: 'white',
          opacity: interpolate(t, [cta.s, cta.s + 0.4], [0, 1], cl)}}>{cta.txt}</div>
      </div>
      {/* 402,3-412: proximo video + inscricao, no terco de cima */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 104, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: interpolate(t, [agora.s, agora.s + 0.5], [0, 1], cl)}}>
        <div style={{fontFamily: num, fontSize: 70, lineHeight: 1.3, color: 'white', textAlign: 'center', whiteSpace: 'pre-line'}}>{agora.txt}</div>
        <div style={{fontFamily: sans, fontWeight: 600, fontSize: 17, letterSpacing: '0.24em', color: '#9db6e6', marginTop: 46}}>{inscr.txt}</div>
      </div>
    </AbsoluteFill>
  );
};
