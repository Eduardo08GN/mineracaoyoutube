// Rotulos presos ao 3D (mesmo desenho do Rotulos do HudMar: ponto + linha-guia + titulo/valor) projetados pela camera do
// quadro, com entrada/saida e troca de lado para nao cobrir o HUD global (painel no alto a esquerda, lugar no alto a direita,
// frase e cartao do pais embaixo no centro). E a "cota" (linha de medida com marcas) presa a um eixo vertical do mundo.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BRANCO, OURO, SANS, easeOut} from '../../hud/base';
import {Cam, clamp01, projetar} from './base';

export type Ancora = {id: string; pos: [number, number, number]; titulo: string; valor: string; dx: number; dy: number;
  ini: number; fim?: number; agua?: boolean};   // ini/fim em segundos de idade da batida
const ZONAS = [[0, 0, 960, 460], [1320, 0, 1920, 210], [240, 680, 1680, 1080]];
const LARG = 360, ALT = 70;
const bate = (x: number, y: number, dx: number) => {
  const x0 = dx >= 0 ? x + 10 : x - 10 - LARG, x1 = x0 + LARG, y0 = y - 40, y1 = y + ALT - 40;
  return ZONAS.some(([a, b, c, d]) => x0 < c && x1 > a && y0 < d && y1 > b) || x0 < 30 || x1 > 1890 || y0 < 30 || y1 > 1050;
};
const lado = (x: number, y: number, a: Ancora) => {
  const c: [number, number][] = [[a.dx, a.dy], [-a.dx, a.dy], [a.dx, -a.dy], [-a.dx, -a.dy], [a.dx * 1.6, a.dy * 0.4], [-a.dx * 1.6, a.dy * 0.4],
    [a.dx, Math.abs(a.dy) * 2.2 + 60], [-a.dx, Math.abs(a.dy) * 2.2 + 60], [a.dx * 0.6, Math.abs(a.dy) * 3 + 120], [-a.dx * 0.6, Math.abs(a.dy) * 3 + 120]];
  for (const [dx, dy] of c) if (!bate(x + dx, y + dy, dx)) return {dx, dy};
  return {dx: a.dx, dy: a.dy};
};

export const RotulosCena: React.FC<{cam: Cam; idade: number; lista: Ancora[]}> = ({cam, idade, lista}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {lista.map((a) => {
        const s = projetar(cam, a.pos);
        const ida = idade - a.ini, e = easeOut(ida / 0.6), sai = a.fim === undefined ? 1 : 1 - clamp01((idade - a.fim) / 0.4);
        if (!s.frente || e <= 0 || sai <= 0 || s.x < -50 || s.x > 1970 || s.y < -50 || s.y > 1130) return null;
        const {dx, dy} = lado(s.x, s.y, a);
        const ex = s.x + dx * e, ey = s.y + dy * e, cor = a.agua ? '#7fe3f0' : BRANCO, ph = (ida * 1.2) % 1;
        return <g key={a.id} opacity={Math.min(1, ida / 0.25) * sai}>
          <circle cx={s.x} cy={s.y} r={7} fill={cor} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
          {a.agua && <circle cx={s.x} cy={s.y} r={7 + 18 * ph} fill="none" stroke={cor} strokeWidth={2} opacity={1 - ph} />}
          <line x1={s.x} y1={s.y} x2={ex} y2={ey} stroke={cor} strokeWidth={2.2} />
          <text x={ex + (dx >= 0 ? 10 : -10)} y={ey - 6} textAnchor={dx >= 0 ? 'start' : 'end'} style={{fontFamily: SANS, fontWeight: 750, fontSize: 24, letterSpacing: '0.1em', fill: BRANCO, paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.55)', strokeWidth: 5}}>{a.titulo}</text>
          <text x={ex + (dx >= 0 ? 10 : -10)} y={ey + 22} textAnchor={dx >= 0 ? 'start' : 'end'} style={{fontFamily: SANS, fontWeight: 650, fontSize: 21, fill: cor, paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.55)', strokeWidth: 5}}>{a.valor}</text>
        </g>;
      })}
    </svg>
  </AbsoluteFill>
);

// cota vertical: de base (m) ate topo (m) ao lado de um eixo (x, z) do mundo, marcas a cada 'passo' metros (numeradas pela altura
// do objeto), a parte debaixo do nivel L em azul-agua. Desenha-se de baixo para cima na entrada.
export const Cota: React.FC<{cam: Cam; idade: number; eixo: [number, number]; lado: [number, number]; base: number; topo: number; L: number; passo: number; ini: number; rotTopo?: string}> =
  ({cam, idade, eixo, lado: ld, base, topo, L, passo, ini, rotTopo}) => {
  const e = easeOut((idade - ini) / 0.9);
  if (e <= 0) return null;
  const P = (h: number) => projetar(cam, [eixo[0] + ld[0], h, eixo[1] + ld[1]]);
  const hTopo = base + (topo - base) * e, hL = Math.min(Math.max(L, base), hTopo);
  const a = P(base), b = P(hTopo), w = P(hL);
  if (!a.frente || !b.frente) return null;
  const marcas: React.ReactNode[] = [];
  for (let h = 0; base + h <= hTopo + 1e-3; h += passo) {
    const p = P(base + h), seco = base + h > L;
    marcas.push(<g key={h}><line x1={p.x - 9} y1={p.y} x2={p.x + 9} y2={p.y} stroke={seco ? BRANCO : '#7fe3f0'} strokeWidth={2} />
      {h > 0 && <text x={p.x + 16} y={p.y + 7} style={{fontFamily: SANS, fontWeight: 650, fontSize: 19, fill: seco ? BRANCO : '#7fe3f0', paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.55)', strokeWidth: 4}}>{h}</text>}</g>);
  }
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} opacity={Math.min(1, (idade - ini) / 0.3)}>
        <line x1={a.x} y1={a.y} x2={w.x} y2={w.y} stroke="#7fe3f0" strokeWidth={3} strokeDasharray="7 6" />
        <line x1={w.x} y1={w.y} x2={b.x} y2={b.y} stroke={BRANCO} strokeWidth={3} />
        <line x1={b.x - 16} y1={b.y} x2={b.x + 16} y2={b.y} stroke={OURO} strokeWidth={3} />
        {marcas}
        {rotTopo && e > 0.98 && <text x={b.x + 22} y={b.y - 10} style={{fontFamily: SANS, fontWeight: 750, fontSize: 22, letterSpacing: '0.08em', fill: OURO, paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.55)', strokeWidth: 5}}>{rotTopo}</text>}
      </svg>
    </AbsoluteFill>
  );
};
