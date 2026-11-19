import React from 'react';
import {AbsoluteFill, interpolate, spring, useVideoConfig} from 'remotion';
import {C, F, cl, out3, io2, useP, fade, Cam, Kicker, Card} from './base';

export type PNumero = {valor: number; rotulo?: string; nota?: string; sufixo?: string; kicker?: string};
export const Numero: React.FC<PNumero> = ({valor, rotulo, nota, sufixo, kicker}) => {
  const {f, dur} = useP(); const {fps} = useVideoConfig();
  const fim = dur - 16, voo = interpolate(f, [fim - 14, fim], [0, 1], {...cl, easing: io2});
  const n = Math.round(interpolate(f, [4, Math.min(60, dur * 0.5)], [0, valor], {...cl, easing: out3}));
  const s = spring({frame: f, fps, config: {damping: 7, stiffness: 110, mass: 0.9}});
  const sc = (0.3 + 0.7 * s) * (1 - 0.82 * voo);
  return (
    <AbsoluteFill>
      <Kicker t={kicker} y={110} />
      <Cam zoom={0.1} prof={0.4}>
        <div style={{position: 'absolute', top: 220, width: '100%', textAlign: 'center', transformOrigin: '50% 40%', transform: `translate(${-780 * voo}px, ${-300 * voo}px) scale(${sc}) rotate(${(1 - s) * -6}deg)`, opacity: 1 - 0.3 * voo}}>
          <div style={{fontFamily: F, fontWeight: 800, fontSize: 380, lineHeight: 1, color: C.txt, letterSpacing: -10, textShadow: `0 0 60px ${C.ouro}40, 0 20px 50px #000`}}>{n.toLocaleString('es-AR')}{sufixo}</div>
          <div style={{fontFamily: F, fontWeight: 700, fontSize: 84, letterSpacing: 14, color: C.ouro, marginTop: 6, opacity: fade(f, 10) * (1 - voo), textShadow: `0 0 30px ${C.ouro}66`}}>{rotulo}</div>
        </div>
      </Cam>
      <Cam zoom={0.02} dx={-40} prof={1}>
        <div style={{position: 'absolute', top: 790, width: '100%', textAlign: 'center', fontFamily: F, fontSize: 28, letterSpacing: 4, color: C.sub, opacity: fade(f, 30)}}>{nota}</div>
      </Cam>
    </AbsoluteFill>
  );
};

export type PTitulo = {kicker?: string; titulo: string};
export const Titulo: React.FC<PTitulo> = ({kicker, titulo}) => {
  const {f, p} = useP();
  const m = interpolate(f, [4, 24], [100, 0], {...cl, easing: out3});
  return (
    <AbsoluteFill>
      <Kicker t={kicker} y={300} />
      <Cam zoom={0.08} prof={0.6}>
        <div style={{position: 'absolute', top: 390, left: 120, right: 120, textAlign: 'center', clipPath: `inset(0 ${m}% 0 0)`}}>
          <div style={{fontFamily: F, fontWeight: 800, fontSize: 130, lineHeight: 1.02, color: C.txt, letterSpacing: -2, textTransform: 'uppercase'}}>{titulo}</div>
        </div>
        <div style={{position: 'absolute', top: 350, left: 960 - 160 * fade(f, 6, 20), width: 320 * fade(f, 6, 20), height: 3, background: C.ouro}} />
        <div style={{position: 'absolute', top: 750 + p * 10, left: 960 - 160 * fade(f, 12, 20), width: 320 * fade(f, 12, 20), height: 3, background: C.ouro}} />
      </Cam>
    </AbsoluteFill>
  );
};

export type PMapa = {rotulo?: string; sub?: string; kicker?: string};
export const Mapa: React.FC<PMapa> = ({rotulo, sub, kicker}) => {
  const {f, p} = useP();
  const pulso = (f % 36) / 36;
  const z = 1 + 0.6 * out3(p);
  const ruas: number[][] = [[0, 200, 1920, 260], [0, 520, 1920, 480], [0, 820, 1920, 780], [300, 0, 340, 1080], [900, 0, 860, 1080], [1500, 0, 1560, 1080], [1200, 0, 1240, 1080]];
  return (
    <AbsoluteFill>
      <Kicker t={kicker} y={80} />
      <Card style={{position: 'absolute', top: 140, left: 160, width: 1600, height: 640}}>
        <svg width="1600" height="640" viewBox="0 0 1920 768" style={{transformOrigin: '47% 63%', transform: `scale(${z}) translate(${-p * 30}px, ${p * 12}px)`}}>
          {Array.from({length: 14}).map((_, i) => <rect key={i} x={(i % 7) * 280 + 40} y={Math.floor(i / 7) * 400 + 40} width="200" height="130" fill="#161c25" />)}
          {ruas.map((r, i) => <line key={i} x1={r[0]} y1={r[1] * 0.71} x2={r[2]} y2={r[3] * 0.71} stroke="#2c3542" strokeWidth={i === 1 ? 30 : 16} />)}
          <text x="1000" y="340" fill="#5d6878" fontFamily={F} fontSize="30" letterSpacing="4">AV. HIPÓLITO YRIGOYEN</text>
          <circle cx="900" cy="360" r={24 + pulso * 120} fill="none" stroke={C.fogo} strokeWidth="5" opacity={1 - pulso} />
          <circle cx="900" cy="360" r="22" fill={C.fogo} />
        </svg>
      </Card>
      <div style={{position: 'absolute', top: 800, width: '100%', textAlign: 'center', fontFamily: F, fontWeight: 800, fontSize: 40, letterSpacing: 4, color: C.txt, opacity: fade(f, 14)}}>{rotulo}</div>
      <div style={{position: 'absolute', top: 852, width: '100%', textAlign: 'center', fontFamily: F, fontWeight: 600, fontSize: 24, letterSpacing: 5, color: C.sub, opacity: fade(f, 24)}}>{sub}</div>
    </AbsoluteFill>
  );
};

export type PRelogio = {de: string; ate: string; eventos?: {h: string; t: string}[]; kicker?: string};
const toMin = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
export const Relogio: React.FC<PRelogio> = ({de, ate, eventos = [], kicker}) => {
  const {p} = useP();
  const a = toMin(de), b = toMin(ate);
  const t = a + (b - a) * Math.min(1, p * 1.05);
  const m = Math.round(t);
  const hh = String(Math.floor(m / 60)).padStart(2, '0'), mm = String(m % 60).padStart(2, '0');
  return (
    <AbsoluteFill>
      <Kicker t={kicker} y={80} />
      <Cam zoom={0.05} prof={0.5}>
        <div style={{position: 'absolute', left: 80, top: 260, width: 860, textAlign: 'center', fontFamily: F, fontWeight: 800, fontSize: 300, color: C.txt, letterSpacing: -6}}>{hh}:{mm}</div>
      </Cam>
      <div style={{position: 'absolute', left: 1050, top: 150, width: 4, height: 640 * Math.min(1, p * 1.05), background: C.linha}} />
      {eventos.map((e, i) => {
        const on = toMin(e.h) <= t;
        const k = on ? Math.min(1, (t - toMin(e.h)) * 2 + 0.2) : 0;
        const y = 150 + (eventos.length > 1 ? (i / (eventos.length - 1)) * 600 : 0);
        return (
          <div key={i} style={{position: 'absolute', top: y, left: 1030, display: 'flex', gap: 30, alignItems: 'center', opacity: 0.25 + 0.75 * k, transform: `translateX(${(1 - k) * 30}px)`}}>
            <div style={{width: 40, height: 40, borderRadius: 20, background: on ? C.fogo : C.linha, boxShadow: on ? `0 0 ${24 * k}px ${C.fogo}` : 'none'}} />
            <div><div style={{fontFamily: F, fontWeight: 700, fontSize: 28, letterSpacing: 3, color: C.sub}}>{e.h}</div>
              <div style={{fontFamily: F, fontWeight: 700, fontSize: 40, color: on ? C.txt : C.sub}}>{e.t}</div></div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export type PCano = {fase?: number; fase_ini?: number; kicker?: string};
export const Cano: React.FC<PCano> = ({fase = 1, fase_ini = 0, kicker}) => {
  const {f, p} = useP();
  const ph = fase_ini + (fase - fase_ini) * p;
  const xBroca = interpolate(ph, [0, 0.5], [-300, 900], {...cl, easing: io2});
  const rompeu = ph > 0.5;
  const fl = Math.max(0, (ph - 0.5) / 0.5);
  return (
    <AbsoluteFill>
      <Kicker t={kicker ?? 'BAJO LA CALLE · RECONSTRUCCIÓN'} y={70} />
      <Cam zoom={0.08} dx={50} prof={0.3}>
        <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
          <rect x="-100" y="190" width="2100" height="36" fill="#3a4250" />
          <text x="120" y="170" fill={C.sub} fontFamily={F} fontSize="28" letterSpacing="4">CALLE</text>
          <rect x="-100" y="226" width="2100" height="620" fill="#1a1612" />
          {Array.from({length: 90}).map((_, i) => <circle key={i} cx={(i * 197) % 1920} cy={250 + (i * 131) % 580} r={3 + (i % 4)} fill="#2a231c" />)}
          <rect x="-100" y="560" width="2100" height="64" rx="8" fill={C.cano} />
          <text x="1200" y="670" fill={C.cano} fontFamily={F} fontWeight="700" fontSize="28" letterSpacing="3">CAÑO DE GAS · MEDIA PRESIÓN</text>
          <g transform={`translate(${xBroca},515)`}>
            <rect x="-300" y="20" width="300" height="110" rx="10" fill="#7d8796" />
            <polygon points="0,20 76,75 0,130" fill="#c9d1dc" />
            <rect x="-300" y={75 + Math.sin(f) * 3} width="300" height="6" fill="#4b5563" />
          </g>
        </svg>
      </Cam>
      <Cam zoom={0.14} dx={-30} prof={1}>
        <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
          {rompeu && Array.from({length: 34}).map((_, i) => {
            const t = ((f + i * 4) % 70) / 70;
            return <circle key={i} cx={1000 + Math.sin(i * 1.7) * 40 * (1 + t * 6)} cy={570 - t * 380 * Math.min(1, fl * 2)} r={12 + t * 46} fill={C.gas} opacity={0.5 * (1 - t) * Math.min(1, fl * 3)} />;
          })}
        </svg>
      </Cam>
    </AbsoluteFill>
  );
};
