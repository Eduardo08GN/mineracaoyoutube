import React from 'react';
import {AbsoluteFill, interpolate, spring, useVideoConfig} from 'remotion';
import {C, F, S, cl, out3, useP, fade, Cam, Kicker, Card, Palavras} from './base';

const norm = (a: any): {valor: string; rotulo: string}[] => (Array.isArray(a) ? a : []).map((x: any) => typeof x === 'string' ? {valor: x, rotulo: ''} : {valor: String(x.valor ?? x.v ?? x.numero ?? ''), rotulo: String(x.rotulo ?? x.r ?? x.label ?? x.texto ?? '')});

export type PNuvem = {conc?: number; conc_ini?: number; lojas?: string[]; kicker?: string};
export const Nuvem: React.FC<PNuvem> = ({conc = 12, conc_ini = 0, lojas = ['FARMACIA', 'KIOSCO', 'PELUQUERÍA', 'LIBRERÍA', 'ROTISERÍA', 'ÓPTICA'], kicker}) => {
  const {f, p} = useP();
  const c = conc_ini + (conc - conc_ini) * p;
  const esp = Math.min(1, c / 15);
  const explosivo = c >= 5 && c <= 15;
  const cor = explosivo ? C.fogo : C.gas;
  const bx = 140, by = 130;
  const lj = lojas.slice(0, 6).map((n, i) => ({n, x: bx + (i % 3) * 340, y: by + Math.floor(i / 3) * 300}));
  return (
    <AbsoluteFill>
      <Kicker t={kicker ?? 'VISTA DESDE ARRIBA · LA ESQUINA'} y={60} />
      <Cam zoom={0.07} dx={40} prof={0.3}>
        <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
          <rect x={bx - 40} y={by - 30} width="1100" height="640" fill="#10141b" stroke={C.linha} />
          {lj.map((l, i) => (
            <g key={i}>
              <rect x={l.x} y={l.y} width="300" height="250" fill="#161c25" stroke="#2c3542" strokeWidth="3" />
              <text x={l.x + 150} y={l.y + 140} fill="#5d6878" fontFamily={F} fontWeight="700" fontSize="24" letterSpacing="3" textAnchor="middle">{l.n}</text>
            </g>
          ))}
          <rect x={bx - 40} y={by + 260} width="1100" height="34" fill="#0a0c10" />
        </svg>
      </Cam>
      <Cam zoom={0.12} dx={-30} prof={1}>
        <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
          <defs><radialGradient id="gg"><stop offset="0" stopColor={cor} stopOpacity="0.75" /><stop offset="1" stopColor={cor} stopOpacity="0" /></radialGradient></defs>
          {Array.from({length: 16}).map((_, i) => {
            const a = i * 2.4 + f * 0.01 * (i % 2 ? 1 : -1);
            const rr = (60 + (i % 5) * 70) * esp * 1.6 + 30;
            const cx = 440 + Math.cos(a) * rr * 0.9 + Math.sin(f / 40 + i) * 14;
            const cy = 400 + Math.sin(a) * rr * 0.6 + Math.cos(f / 50 + i) * 12;
            return <circle key={i} cx={cx} cy={cy} r={50 + 90 * esp + (i % 4) * 15} fill="url(#gg)" opacity={0.25 + 0.5 * esp} />;
          })}
          <circle cx="440" cy="400" r="14" fill={C.cano} />
        </svg>
      </Cam>
      {/* medidor */}
      <div style={{position: 'absolute', left: 1400, top: 130, width: 380, height: 640}}>
        <div style={{position: 'absolute', left: 0, top: 0, fontFamily: F, fontWeight: 800, fontSize: 130, color: cor, letterSpacing: -3}}>{c.toFixed(1).replace('.', ',')}%</div>
        <div style={{position: 'absolute', left: 4, top: 150, fontFamily: F, fontWeight: 600, fontSize: 22, letterSpacing: 4, color: C.sub}}>GAS EN EL AIRE</div>
        <div style={{position: 'absolute', left: 20, top: 210, width: 60, height: 420, border: `2px solid ${C.linha}`, borderRadius: 8, overflow: 'hidden', background: '#10141b'}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: `${(1 - 15 / 20) * 100}%`, height: `${(10 / 20) * 100}%`, background: 'rgba(255,90,42,0.22)'}} />
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: `${Math.min(100, (c / 20) * 100)}%`, background: cor}} />
        </div>
        <div style={{position: 'absolute', left: 100, top: 210 + 420 * (1 - 15 / 20) - 2, fontFamily: F, fontSize: 22, color: C.fogo, fontWeight: 700}}>15%</div>
        <div style={{position: 'absolute', left: 100, top: 210 + 420 * (1 - 5 / 20) - 14, fontFamily: F, fontSize: 22, color: C.fogo, fontWeight: 700}}>5%</div>
        <div style={{position: 'absolute', left: 100, top: 210 + 420 * 0.42, fontFamily: F, fontWeight: 800, fontSize: 30, letterSpacing: 3, color: C.fogo, opacity: 0.6 + 0.4 * Math.abs(Math.sin(f / 8))}}>ZONA<br />EXPLOSIVA</div>
      </div>
    </AbsoluteFill>
  );
};

export type PComparacao = {itens: {valor: string; rotulo: string}[]; kicker?: string};
export const Comparacao: React.FC<PComparacao> = ({itens, kicker}) => {
  const {f} = useP();
  const its = norm(itens).slice(0, 4);
  const w = (1680 - (its.length - 1) * 36) / its.length;
  return (
    <AbsoluteFill>
      <Kicker t={kicker} y={110} />
      <Cam zoom={0.05} prof={0.5}>
        {its.map((it, i) => (
          <Card key={i} delay={6 + i * 12} seed={i} acento={i === its.length - 1 ? C.ouro : undefined} style={{position: 'absolute', left: 120 + i * (w + 36), top: 220, width: w, height: 520}}>
            <div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24}}>
              <div style={{fontFamily: F, fontWeight: 800, fontSize: its.length > 3 ? 90 : 120, color: C.txt, letterSpacing: -2, textAlign: 'center', lineHeight: 1, textShadow: `0 0 30px ${C.ouro}33`}}>{it.valor}</div>
              <div style={{fontFamily: F, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.ouro, marginTop: 28, textAlign: 'center'}}>{it.rotulo}</div>
            </div>
          </Card>
        ))}
      </Cam>
    </AbsoluteFill>
  );
};

export type PCita = {texto: string; fonte?: string};
export const Cita: React.FC<PCita & {frase?: string; cita?: string}> = ({texto: t0, frase, cita, fonte}) => {
  const texto = String(t0 ?? frase ?? cita ?? '');
  const {f} = useP();
  return (
    <AbsoluteFill>
      <Cam zoom={0.08} dx={-24} prof={0.4}>
        <div style={{position: 'absolute', left: 200, top: 40, fontFamily: S, fontStyle: 'italic', fontSize: 420, color: C.ouro, opacity: 0.25}}>“</div>
        <Palavras t={texto} delay={2} passo={4} style={{position: 'absolute', left: 240, right: 240, top: 230, textAlign: 'center', fontFamily: S, fontStyle: 'italic', fontSize: 92, lineHeight: 1.1, color: C.txt}} />
      </Cam>
      <div style={{position: 'absolute', top: 730, width: '100%', textAlign: 'center', fontFamily: F, fontWeight: 600, fontSize: 26, letterSpacing: 5, color: C.sub, opacity: fade(f, 24)}}>{fonte}</div>
    </AbsoluteFill>
  );
};

export type PLista = {itens: string[]; titulo?: string; kicker?: string};
export const Lista: React.FC<PLista> = ({itens, titulo, kicker}) => {
  const {f, dur} = useP(); const {fps} = useVideoConfig();
  const its = itens.slice(0, 5);
  const gap = Math.max(10, (dur - 30) / its.length);
  return (
    <AbsoluteFill>
      <Kicker t={kicker ?? titulo} y={90} />
      <Cam zoom={0.05} dx={24} prof={0.5}>
        {its.map((t, i) => {
          const k = Math.min(1.25, spring({frame: f - 8 - i * gap, fps, config: {damping: 8, stiffness: 140}}));
          return (
            <div key={i} style={{position: 'absolute', left: 300, top: 190 + i * 125, display: 'flex', alignItems: 'center', gap: 36, opacity: 0.18 + 0.82 * k, transform: `translateX(${(1 - k) * 90}px) scale(${0.9 + 0.1 * k})`}}>
              <div style={{width: 56, fontFamily: F, fontWeight: 800, fontSize: 54, color: k > 0.5 ? C.ouro : C.linha}}>{i + 1}</div>
              <div style={{width: 12, height: 12, borderRadius: 6, background: k > 0.5 ? C.ouro : C.linha, boxShadow: k > 0.5 ? `0 0 18px ${C.ouro}` : 'none'}} />
              <div style={{fontFamily: F, fontWeight: 700, fontSize: 56, color: k > 0.5 ? C.txt : C.sub}}>{t}</div>
            </div>
          );
        })}
      </Cam>
    </AbsoluteFill>
  );
};

export type PExplosao = {hora?: string; rotulo?: string};
export const Explosao: React.FC<PExplosao> = ({hora, rotulo}) => {
  const {f, p} = useP();
  const t0 = 14;
  const flash = interpolate(f, [t0, t0 + 3, t0 + 18], [0, 1, 0], cl);
  const shake = f > t0 && f < t0 + 40 ? Math.sin(f * 3.1) * (t0 + 40 - f) * 0.7 : (f <= t0 ? Math.sin(f * 2) * 1.2 : 0);
  const r = interpolate(f, [t0, t0 + 50], [0, 1700], {...cl, easing: out3});
  return (
    <AbsoluteFill style={{transform: `translate(${shake}px, ${shake * 0.6}px) scale(${1 + 0.05 * p})`}}>
      {f < t0 && <div style={{position: 'absolute', top: 330, width: '100%', textAlign: 'center', fontFamily: F, fontWeight: 800, fontSize: 340, color: C.txt, opacity: 0.8 + 0.2 * Math.sin(f)}}>{hora}</div>}
      <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
        <defs><radialGradient id="eg"><stop offset="0" stopColor="#fff" /><stop offset="0.25" stopColor={C.fogo} /><stop offset="0.7" stopColor="#5a1405" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient></defs>
        {f >= t0 && <circle cx="960" cy="480" r={r * 0.6} fill="url(#eg)" opacity={interpolate(f, [t0, t0 + 80], [1, 0.35], cl)} />}
        {f >= t0 && [0, 1, 2].map((i) => <circle key={i} cx="960" cy="480" r={Math.max(0, r - i * 140)} fill="none" stroke={i === 0 ? '#fff' : C.fogo} strokeWidth={10 - i * 3} opacity={interpolate(r - i * 140, [0, 1700], [0.9, 0], cl)} />)}
      </svg>
      {f >= t0 + 20 && <div style={{position: 'absolute', top: 440, width: '100%', textAlign: 'center', fontFamily: F, fontWeight: 800, fontSize: 120, letterSpacing: 10, color: C.txt, opacity: fade(f, t0 + 20, 8)}}>{rotulo}</div>}
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
    </AbsoluteFill>
  );
};

export type PSaldo = {itens: {valor: string; rotulo: string}[]; kicker?: string};
export const Saldo: React.FC<PSaldo> = ({itens, kicker}) => {
  const {f} = useP();
  const its = norm(itens).slice(0, 4);
  const w = (1560 - (its.length - 1) * 30) / its.length;
  const cores = [C.txt, C.ouro, C.fogo, C.sub];
  return (
    <AbsoluteFill>
      <Kicker t={kicker ?? 'SALDO'} y={110} />
      <Cam zoom={0.06} prof={0.6}>
        {its.map((it, i) => (
          <Card key={i} delay={4 + i * 10} seed={i + 2} acento={cores[i]} style={{position: 'absolute', left: 180 + i * (w + 30), top: 250, width: w, height: 440}}>
            <div style={{height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 20}}>
              <div style={{fontFamily: F, fontWeight: 800, fontSize: 150, color: cores[i], lineHeight: 1, textShadow: `0 0 40px ${cores[i]}66`}}>{it.valor}</div>
              <div style={{fontFamily: F, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: C.sub, marginTop: 24, textAlign: 'center'}}>{it.rotulo}</div>
            </div>
          </Card>
        ))}
      </Cam>
    </AbsoluteFill>
  );
};
