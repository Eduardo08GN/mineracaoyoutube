import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, staticFile, Easing} from 'remotion';

export const C = {bg: '#0a0c10', painel: '#12161d', linha: '#232a35', txt: '#eef0f3', sub: '#9aa3b0', ouro: '#d9b46a', gas: '#c8e04a', fogo: '#ff5a2a', cano: '#e8b81c'};
export const fonte = `@font-face{font-family:'Inter Tight';src:url(${staticFile('fontes/InterTight-Var.ttf')});font-weight:100 900}
@font-face{font-family:'Instrument Serif';font-style:italic;src:url(${staticFile('fontes/InstrumentSerif-Italic.ttf')})}`;
export const F = "'Inter Tight', Arial, sans-serif";
export const S = "'Instrument Serif', Georgia, serif";
export const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const out3 = Easing.out(Easing.cubic);
export const io2 = Easing.inOut(Easing.quad);

/** progresso 0..1 da batida */
export const useP = () => {
  const f = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return {f, p: Math.min(1, f / Math.max(1, durationInFrames - 1)), dur: durationInFrames};
};
export const fade = (f: number, a: number, b = 8) => interpolate(f, [a, a + b], [0, 1], {...cl, easing: out3});

/** Câmera: push-in + drift lento; prof (0 fundo .. 1 frente) dá o parallax entre camadas */
export const Cam: React.FC<{children: React.ReactNode; zoom?: number; dx?: number; dy?: number; prof?: number}> = ({children, zoom = 0.07, dx = 30, dy = 14, prof = 0.5}) => {
  const {p} = useP();
  const k = 0.6 + prof * 0.8;
  return (
    <AbsoluteFill style={{transform: `translate(${(-dx * p + dx / 2) * k}px, ${(dy * p - dy / 2) * k}px) scale(${1 + zoom * p * k})`}}>
      {children}
    </AbsoluteFill>
  );
};

/** Camada de FUNDO: gradiente + poeira em 3 profundidades, deriva própria */
export const Fundo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at ${50 + Math.sin(f / 90) * 8}% ${40 + Math.cos(f / 110) * 6}%, #1a2130 0%, ${C.bg} 70%)`}}>
      <svg width="1920" height="1080" style={{position: 'absolute', opacity: 0.5}}>
        {Array.from({length: 90}).map((_, i) => {
          const d = 1 + (i % 3);
          return <circle key={i} cx={(((i * 263) % 1920) + f * 0.25 * d + 1920) % 1920} cy={(((i * 491) % 1080) - f * 0.12 * d + 1080 * 4) % 1080} r={0.6 + d * 0.5} fill="#9aa8bd" opacity={0.25 + 0.2 * d} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** Camada da FRENTE: partículas desfocadas e fumaça leve, a velocidade maior que o conteúdo */
export const Frente: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width="1920" height="1080" style={{position: 'absolute', filter: 'blur(14px)', opacity: 0.55}}>
        {Array.from({length: 14}).map((_, i) => (
          <circle key={i} cx={(((i * 397) % 1920) + f * (1.4 + (i % 4) * 0.6) + 1920) % 1920} cy={((i * 233) % 1080) + Math.sin(f / 40 + i) * 40} r={14 + (i % 5) * 9} fill="#c9d1dc" opacity={0.08 + (i % 3) * 0.04} />
        ))}
      </svg>
      <svg width="1920" height="1080" style={{position: 'absolute', filter: 'blur(60px)', opacity: 0.6}}>
        {Array.from({length: 5}).map((_, i) => (
          <ellipse key={i} cx={(((i * 520) + f * (0.8 + i * 0.25)) % 2400) - 240} cy={760 + Math.sin(f / 70 + i * 2) * 90 + (i % 2) * 120} rx={280} ry={90} fill="#8a96a8" opacity={0.09} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

/** Look de cinema: grão, vinheta, letterbox sutil */
export const Look: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.65) 100%)'}} />
      <svg width="1920" height="1080" style={{position: 'absolute', mixBlendMode: 'overlay', opacity: 0.22}}>
        <filter id="grao"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 12} /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="1920" height="1080" filter="url(#grao)" />
      </svg>
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 22, background: '#000'}} />
      <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 22, background: '#000'}} />
    </AbsoluteFill>
  );
};

/** Cartão com profundidade: perspectiva 3D animada, sombra, borda com reflexo */
export const Card: React.FC<{children: React.ReactNode; style?: React.CSSProperties; delay?: number; acento?: string; seed?: number}> = ({children, style, delay = 0, acento, seed = 0}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const s = spring({frame: f - delay, fps, config: {damping: 9, stiffness: 120, mass: 0.8}});
  const ry = Math.sin(f / 55 + seed) * 5 + (1 - s) * -50;
  const rx = Math.cos(f / 65 + seed) * 3 + (1 - s) * 25;
  const glint = (f * 2 + seed * 80) % 300 - 60;
  return (
    <div style={{perspective: 1400, ...style, opacity: f - delay < 0 ? 0 : Math.max(0.5, Math.min(1, s * 1.6))}}>
      <div style={{width: '100%', height: '100%', transform: `translateY(${(1 - s) * 90}px) scale(${0.6 + 0.4 * s}) rotateX(${rx}deg) rotateY(${ry}deg)`, transformStyle: 'preserve-3d', borderRadius: 18, background: `linear-gradient(145deg, #1a202b, ${C.painel})`, border: '1px solid rgba(255,255,255,0.12)', borderTop: acento ? `5px solid ${acento}` : '1px solid rgba(255,255,255,0.28)', boxShadow: `0 ${30 + ry * 2}px 70px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18)${acento ? `, 0 0 40px ${acento}22` : ''}`, position: 'relative', overflow: 'hidden', boxSizing: 'border-box'}}>
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(105deg, transparent ${glint}px, rgba(255,255,255,0.09) ${glint + 50}px, transparent ${glint + 110}px)`, pointerEvents: 'none'}} />
        {children}
      </div>
    </div>
  );
};

/** Texto cinético palavra a palavra, spring com overshoot */
export const Palavras: React.FC<{t: string; dest?: string; style?: React.CSSProperties; delay?: number; passo?: number; corDest?: string}> = ({t, dest, style, delay = 0, passo = 3, corDest = C.ouro}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const palavras = t.split(' ');
  const d = dest ? dest.split(' ') : [];
  return (
    <div style={style}>
      {palavras.map((w, i) => {
        const s = spring({frame: f - delay - i * passo, fps, config: {damping: 8, stiffness: 160, mass: 0.6}});
        const hl = d.length > 0 && d.some((x) => w.replace(/[.,;:!?¿¡…"]/g, '') === x.replace(/[.,;:!?¿¡…"]/g, ''));
        return <span key={i} style={{display: 'inline-block', marginRight: '0.28em', opacity: Math.min(1, Math.max(0, s * 2)), transform: `translateY(${(1 - Math.min(1, s)) * 8}px)`, color: hl ? corDest : undefined, textShadow: hl ? `0 0 24px ${corDest}88, 0 2px 14px #000` : undefined}}>{w}</span>;
      })}
    </div>
  );
};

export const Kicker: React.FC<{t?: string; y?: number}> = ({t, y = 130}) => {
  const f = useCurrentFrame();
  if (!t) return null;
  return <div style={{position: 'absolute', top: y, width: '100%', textAlign: 'center', fontFamily: F, fontWeight: 600, fontSize: 28, letterSpacing: 7, color: C.ouro, opacity: fade(f, 0), transform: `translateY(${(1 - fade(f, 0)) * -14}px)`}}>{t}</div>;
};

export const Legenda: React.FC<{t?: string; dest?: string}> = ({t, dest}) => {
  if (!t) return null;
  return <Palavras t={t} dest={dest} delay={4} style={{position: 'absolute', top: 890, left: 180, right: 180, textAlign: 'center', fontFamily: S, fontStyle: 'italic', fontSize: 54, lineHeight: 1.12, color: C.txt, textShadow: '0 2px 14px #000'}} />;
};
