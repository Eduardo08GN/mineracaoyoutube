// Kit editorial 16:9 dirigido por JSON (src/batidas.json). Estilo da v1 aprovada + paralaxe 3 camadas, transições, look de cinema.
import React from 'react';
import {AbsoluteFill, Sequence, Audio, interpolate, staticFile, getStaticFiles, useCurrentFrame, useVideoConfig} from 'remotion';
import batidasJson from './batidas.json';
import {C, F, fonte, Fundo, Frente, Look, Legenda, cl, out3, io2} from './kit/base';
import {Numero, Titulo, Mapa, Relogio, Cano} from './kit/cenas1';
import {Take} from './kit/take';
import {Foto25d} from './kit/foto25d';
import {Nuvem, Comparacao, Cita, Lista, Explosao, Saldo} from './kit/cenas2';

const KIT: Record<string, React.FC<any>> = {numero: Numero, titulo: Titulo, mapa: Mapa, relogio: Relogio, cano: Cano, nuvem: Nuvem, comparacao: Comparacao, cita: Cita, lista: Lista, explosao: Explosao, saldo: Saldo};
KIT.take = (p: any) => <Take {...p} kit={KIT} />;
KIT.foto25d = (p: any) => <Foto25d {...p} kit={KIT} />;
const TR = 14; // frames de transição (10–18)

type Batida = {ini: number; fim: number; tipo: string; leg?: string; dest?: string; trans?: 'whip' | 'zoom' | 'corte' | 'fumaca' | 'tinta' | 'luz' | 'glitch'; cap?: string; hora?: string; [k: string]: any};

const rnd = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

/** Aberração cromática: filtro SVG que desloca os canais R e B em dx */
const CA: React.FC<{id: string; dx: number}> = ({id, dx}) => (
  <svg width="0" height="0" style={{position: 'absolute'}}>
    <filter id={id} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
      <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
      <feOffset in="r" dx={dx} result="r2" />
      <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
      <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
      <feOffset in="b" dx={-dx} result="b2" />
      <feBlend in="r2" in2="g" mode="screen" result="rg" />
      <feBlend in="rg" in2="b2" mode="screen" />
    </filter>
  </svg>
);

/** Máscara de noise animada: fumaça = borda mole subindo; tinta = gotas duras que crescem */
const Mascara: React.FC<{id: string; t: number; modo: 'fumaca' | 'tinta'; f: number}> = ({id, t, modo, f}) => {
  const n = 9;
  return (
    <svg width="0" height="0" style={{position: 'absolute'}}>
      <defs>
        <filter id={id + 'n'} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency={modo === 'fumaca' ? 0.006 : 0.012} numOctaves="3" seed={3} result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale={modo === 'fumaca' ? 320 : 200} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation={modo === 'fumaca' ? 38 : 3} />
        </filter>
        <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080">
          <rect width="1920" height="1080" fill="#000" />
          <g filter={`url(#${id}n)`}>
            {Array.from({length: n}).map((_, i) => {
              const cx = modo === 'fumaca' ? (i + 0.5) * (1920 / n) : 300 + rnd(i + 1) * 1320;
              const cy = modo === 'fumaca' ? 1150 - t * 120 + rnd(i + 5) * 60 : 200 + rnd(i + 9) * 680;
              const r = t * (modo === 'fumaca' ? 700 + rnd(i + 3) * 500 : 900 + rnd(i + 3) * 600) + (f % 2);
              return <circle key={i} cx={cx} cy={cy} r={r} fill="#fff" />;
            })}
          </g>
        </mask>
      </defs>
    </svg>
  );
};

/** Entrada da batida: whip, zoom-through, corte, fumaça, tinta, luz, glitch. A cena que sai também se move (zoom/whip). */
const Entrada: React.FC<{idx: number; trans?: string; saida?: string; children: React.ReactNode}> = ({idx, trans = 'corte', saida, children}) => {
  const f = useCurrentFrame(); const {durationInFrames: dur} = useVideoConfig();
  const t = interpolate(f, [0, TR], [0, 1], {...cl, easing: io2});
  const id = 'ca' + idx;
  let style: React.CSSProperties = {};
  let dx = 0;
  let over: React.ReactNode = null;
  let overTop = false;
  if (f >= TR && (trans === 'whip' || trans === 'zoom' || trans === 'luz')) {
    style = {};
  } else if (trans === 'whip') {
    style = {transform: `translateX(${(1 - t) * 1920}px) skewX(${(1 - t) * -8}deg)`, filter: `url(#${id}) blur(${(1 - t) * 30}px)`};
    dx = 18 * (1 - t);
  } else if (trans === 'zoom') {
    style = {transform: `scale(${1 + (1 - t) * 1.6})`, filter: `url(#${id}) blur(${(1 - t) * 22}px)`, opacity: interpolate(f, [0, 5], [0, 1], cl)};
    dx = 12 * (1 - t);
  } else if (trans === 'fumaca' || trans === 'tinta') {
    const ativo = f < TR;
    const tt = interpolate(f, [0, TR], [0, 1.15], {...cl, easing: out3});
    style = ativo ? {mask: `url(#${id}m)`, WebkitMask: `url(#${id}m)`, filter: `url(#${id})`} : {};
    dx = 7 * Math.sin(Math.PI * t);
    over = ativo ? <Mascara id={id + 'm'} t={tt} modo={trans} f={f} /> : null;
  } else if (trans === 'luz') {
    const k = Math.sin(Math.PI * Math.min(1, f / (TR + 4)));
    style = {filter: `brightness(${1 + k * 1.3}) blur(${(1 - t) * 6}px)`, opacity: interpolate(f, [0, 6], [0, 1], cl)};
    overTop = true;
    over = f < TR + 4 ? <AbsoluteFill style={{background: `radial-gradient(ellipse at ${20 + t * 70}% 40%, rgba(255,214,150,${0.95 * k}) 0%, rgba(255,120,40,${0.5 * k}) 35%, transparent 70%)`, mixBlendMode: 'screen'}} /> : null;
  } else if (trans === 'glitch') {
    const g = f < TR;
    const j = (a: number) => rnd(f * 3 + a) - 0.5;
    style = g ? {transform: `translate(${j(1) * 90}px, ${j(2) * 16}px) skewX(${j(3) * 18}deg) scaleY(${1 + j(4) * 0.06})`, filter: `url(#${id}) ${f % 3 === 0 ? 'invert(0.15) hue-rotate(40deg)' : ''}`} : {};
    dx = g ? 14 + 18 * Math.abs(j(5)) : 0;
    overTop = true;
    over = g ? (
      <AbsoluteFill style={{mixBlendMode: 'difference'}}>
        {Array.from({length: 5}).map((_, i) => <div key={i} style={{position: 'absolute', left: 0, right: 0, top: rnd(f + i * 7) * 1000, height: 10 + rnd(f * 2 + i) * 50, background: i % 2 ? '#0ff' : '#f0f', opacity: 0.5, transform: `translateX(${j(i + 9) * 200}px)`}} />)}
      </AbsoluteFill>
    ) : null;
  } else if (f < 5) {
    style = {transform: `translate(${(f % 2 ? 1 : -1) * (5 - f) * 8}px, ${(5 - f) * 4}px) scale(${1 + (5 - f) * 0.012})`, filter: `url(#${id}) brightness(${1 + (5 - f) * 0.3})`};
    dx = (5 - f) * 2;
  }
  // saída da cena anterior (últimos TR quadros)
  const resto = dur - f;
  let ext: React.CSSProperties = {};
  if (saida && resto < TR) {
    const u = 1 - resto / TR;
    if (saida === 'zoom') ext = {transform: `scale(${1 + u * 1.3})`, opacity: 1 - u * 0.9, filter: `blur(${u * 14}px)`};
    else if (saida === 'whip') ext = {transform: `translateX(${-u * 700}px)`, filter: `blur(${u * 24}px)`};
  }
  return (
    <AbsoluteFill style={ext}>
      <CA id={id} dx={dx} />
      {!overTop && over}
      <AbsoluteFill style={style}>{children}</AbsoluteFill>
      {overTop && over}
    </AbsoluteFill>
  );
};

/** Câmera virtual: push-in + leve rotação + drift, nunca parada */
const Camera: React.FC<{children: React.ReactNode; seed: number}> = ({children, seed}) => {
  const f = useCurrentFrame(); const {durationInFrames: dur} = useVideoConfig();
  const p = f / dur;
  return (
    <AbsoluteFill style={{transform: `translate(${Math.sin(f / 70 + seed) * 14 - p * 20}px, ${Math.cos(f / 85 + seed) * 8}px) rotate(${Math.sin(f / 110 + seed) * 0.7}deg) scale(${1.02 + p * 0.05})`}}>
      {children}
    </AbsoluteFill>
  );
};

const Hud: React.FC<{b: Batida[]}> = ({b}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const s = f / fps;
  let cap = '', hora = '';
  for (const x of b) {
    if (x.ini > s) break;
    if (x.cap) cap = x.cap; else if (x.tipo === 'titulo') cap = x.titulo;
    if (x.hora) hora = x.hora; else if (x.tipo === 'relogio') hora = x.de;
  }
  const live = 0.55 + 0.45 * Math.abs(Math.sin(f / 12));
  return (
    <>
      <div style={{position: 'absolute', top: 40, left: 48, display: 'flex', alignItems: 'center', gap: 20, fontFamily: F}}>
        <div style={{width: 12, height: 12, borderRadius: 6, background: C.fogo, opacity: live, boxShadow: `0 0 12px ${C.fogo}`}} />
        <div style={{fontWeight: 700, fontSize: 22, letterSpacing: 5, color: C.ouro, textShadow: `0 0 14px ${C.ouro}66`}}>{cap.toUpperCase()}</div>
        {hora && <div style={{fontWeight: 800, fontSize: 26, letterSpacing: 2, color: C.txt, borderLeft: `2px solid ${C.linha}`, paddingLeft: 20}}>{hora}</div>}
      </div>
      <div style={{position: 'absolute', top: 42, right: 48, fontFamily: F, fontWeight: 700, fontSize: 20, color: C.sub, letterSpacing: 3}}>¿QUÉ PASARÍA SI? 3D</div>
      <div style={{position: 'absolute', top: 1030, width: '100%', textAlign: 'center', fontFamily: F, fontSize: 20, color: '#5d6878', letterSpacing: 5}}>RECONSTRUCCIÓN · BASADA EN HECHOS REALES</div>
    </>
  );
};

export const Video: React.FC = () => {
  const {fps} = useVideoConfig();
  const bs = (batidasJson as any).batidas as Batida[];
  const temVoz = getStaticFiles().some((x) => x.name === 'voz.wav');
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <style>{fonte}</style>
      {temVoz && <Audio src={staticFile('voz.wav')} />}
      {bs.map((b, i) => {
        const {ini, fim, tipo, leg, dest, trans, cap, hora, ...props} = b;
        const Comp = KIT[tipo];
        if (!Comp) return null;
        const from = Math.round(ini * fps);
        const dur = Math.round((fim - ini) * fps) + (i < bs.length - 1 ? TR : 0);
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <Entrada idx={i} trans={trans} saida={bs[i + 1]?.trans}>
              <Fundo />
              <Camera seed={i}><Comp {...props} _i={i} /></Camera>
              <Frente />
              <Legenda t={leg} dest={dest} />
            </Entrada>
          </Sequence>
        );
      })}
      <Look />
      <Hud b={bs} />
    </AbsoluteFill>
  );
};
