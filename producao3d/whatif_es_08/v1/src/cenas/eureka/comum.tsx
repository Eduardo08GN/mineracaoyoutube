// Pecas comuns dos dois takes eureka: camera sincronizada (a mesma camera projeta os rotulos), espera de assets com
// delayRender, aleatorio com semente e etiquetas presas ao 3D. Tudo funcao do quadro: nada de estado acumulado.
import React, {useEffect, useState} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {continueRender, delayRender} from 'remotion';
import {BRANCO, OURO, SANS, SOMBRA, cl, easeOut} from '../../hud/base';

// o Chrome do render compila shaders em paralelo e o primeiro quadro de cada aba saia sem materiais (licao do video 6/07)
for (const C of [typeof WebGL2RenderingContext !== 'undefined' ? WebGL2RenderingContext : null, typeof WebGLRenderingContext !== 'undefined' ? WebGLRenderingContext : null]) {
  if (!C || (C.prototype as any).__semParalelo) continue;
  const orig = C.prototype.getExtension;
  (C.prototype as any).getExtension = function (this: WebGLRenderingContext, nome: string) { return nome === 'KHR_parallel_shader_compile' ? null : orig.call(this, nome); };
  (C.prototype as any).__semParalelo = true;
}

export const W = 1920, H = 1080;
export const sm = (a: number, b: number, x: number) => { const u = cl(0, 1, (x - a) / (b - a)); return u * u * (3 - 2 * u); };
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const rnd = (seed: number) => { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

// ---------------------------------------------------------------- camera pura: {pos, alvo, fov, desloc (fracao da largura)}
export type Cam = {pos: [number, number, number]; alvo: [number, number, number]; fov: number; desloc?: number; near?: number; far?: number; up?: [number, number, number]};
export const montaCam = (c: Cam, k = new THREE.PerspectiveCamera()) => {
  k.fov = c.fov; k.aspect = W / H; k.near = c.near ?? 0.05; k.far = c.far ?? 2000;
  k.up.set(...(c.up ?? [0, 1, 0])); k.position.set(...c.pos); k.lookAt(...c.alvo);
  // filmOffset em mm sobre filmGauge 35: desloca o conteudo para a direita por `desloc` da largura
  k.filmOffset = -(c.desloc ?? 0) * 70 * Math.tan((c.fov * Math.PI) / 360) * k.aspect;
  k.updateProjectionMatrix(); k.updateMatrixWorld(); return k;
};
export const CamSync: React.FC<{c: Cam}> = ({c}) => {
  const {camera} = useThree();
  montaCam(c, camera as THREE.PerspectiveCamera);
  return null;
};
const _k = new THREE.PerspectiveCamera();
export const projetor = (c: Cam) => {
  const k = montaCam(c, _k), v = new THREE.Vector3();
  return (p: [number, number, number]) => { v.set(...p).project(k); return {x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, ok: v.z > -1 && v.z < 1}; };
};

// ---------------------------------------------------------------- espera de assets (o quadro so sai com tudo carregado)
export const useEspera = (chave: string, carrega: () => Promise<unknown>, pronto: () => boolean) => {
  const [ok, setOk] = useState(pronto());
  const [h] = useState(() => (pronto() ? null : delayRender(chave, {timeoutInMilliseconds: 120000})));
  useEffect(() => { if (!ok) carrega().then(() => setOk(true), (e) => { console.error('EUREKA_FALHOU', chave, e); throw e; }); }, [ok]);
  useEffect(() => { if (ok && h !== null) continueRender(h); }, [ok, h]);
  return ok;
};

// ---------------------------------------------------------------- etiqueta presa ao 3D (ponto + linha-guia + titulo/valor)
// zonas do HUD global: painel (alto a esquerda), lugar (alto a direita), cartao/legenda (embaixo no centro)
export const ZONAS: [number, number, number, number][] = [[0, 0, 930, 450], [1360, 0, 1920, 170], [150, 840, 1770, 1080]];
export type Etq = {id: string; x: number; y: number; ok: boolean; titulo: string; valor?: string; idade: number; dx: number; dy: number; cor?: string; seta?: 'baixo' | 'cima'; sai?: number; grande?: boolean};
const ALT = 70;
const largura = (e: Etq) => Math.max(e.titulo.length * (e.grande ? 30 : 23) * 0.66, (e.valor ?? '').length * (e.grande ? 25 : 20) * 0.52) + (e.seta ? 60 : 30);
const bate = (x: number, y: number, dx: number, LARG: number) => {
  const x0 = dx >= 0 ? x : x - LARG, x1 = x0 + LARG, y0 = y - ALT / 2, y1 = y + ALT / 2;
  return ZONAS.some(([a, b, c, d]) => x0 < c && x1 > a && y0 < d && y1 > b) || x0 < 16 || x1 > 1904 || y0 < 16 || y1 > 1064;
};
const desvio = (e: Etq) => {
  const c: [number, number][] = [[e.dx, e.dy], [-e.dx, e.dy], [e.dx, -e.dy], [-e.dx, -e.dy], [e.dx * 1.5, e.dy * 0.3], [-e.dx * 1.5, e.dy * 0.3]];
  const L = largura(e);
  for (const [dx, dy] of c) if (!bate(e.x + dx, e.y + dy, dx, L)) return [dx, dy];
  return [e.dx, e.dy];
};
const Seta: React.FC<{x: number; y: number; dir: 'baixo' | 'cima'; cor: string; t: number; tam?: number}> = ({x, y, dir, cor, t, tam = 1}) => {
  const s = dir === 'baixo' ? 1 : -1, o = ((t * 1.3) % 1) * 10 * s * tam;
  return <g transform={`translate(${x},${y + o}) scale(${tam})`} opacity={0.65 + 0.35 * Math.sin(t * 6)}>
    <line x1={0} y1={-16 * s} x2={0} y2={10 * s} stroke={cor} strokeWidth={5} strokeLinecap="round" />
    <path d={`M -11 ${2 * s} L 0 ${16 * s} L 11 ${2 * s}`} fill="none" stroke={cor} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
  </g>;
};
export const Etiquetas: React.FC<{lista: Etq[]; t: number}> = ({lista, t}) => (
  <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    {lista.map((e) => {
      const ent = easeOut(e.idade / 0.55), sai = e.sai === undefined ? 1 : 1 - cl(0, 1, e.sai / 0.4);
      if (!e.ok || ent <= 0 || sai <= 0 || e.x < -40 || e.x > W + 40 || e.y < -40 || e.y > H + 40) return null;
      const [dx, dy] = desvio(e), lx = e.x + dx * ent, ly = e.y + dy * ent, cor = e.cor ?? BRANCO, dir = dx >= 0 ? 1 : -1;
      const fT = e.grande ? 30 : 23, fV = e.grande ? 25 : 20, xs = lx + dir * (e.seta ? 44 : 12);
      const pulso = (e.idade * 0.9) % 1;
      return <g key={e.id} opacity={Math.min(1, e.idade / 0.25) * sai}>
        <circle cx={e.x} cy={e.y} r={6.5} fill={cor} stroke="rgba(0,0,0,0.45)" strokeWidth={2} />
        <circle cx={e.x} cy={e.y} r={7 + 20 * pulso} fill="none" stroke={cor} strokeWidth={2} opacity={0.8 * (1 - pulso)} />
        <polyline points={`${e.x},${e.y} ${lx},${ly} ${lx + dir * 22 * ent},${ly}`} fill="none" stroke={cor} strokeWidth={2.4} strokeOpacity={0.92} />
        {e.seta && <Seta x={lx + dir * 26} y={ly + (e.valor ? 6 : 0)} dir={e.seta} cor={cor} t={t} />}
        <text x={xs} y={ly - (e.valor ? 7 : -8)} textAnchor={dir > 0 ? 'start' : 'end'} style={{fontFamily: SANS, fontWeight: 760, fontSize: fT, letterSpacing: '0.09em', fill: cor, paintOrder: 'stroke', stroke: 'rgba(4,10,20,0.6)', strokeWidth: 6}}>{e.titulo}</text>
        {e.valor && <text x={xs} y={ly + fV + 2} textAnchor={dir > 0 ? 'start' : 'end'} style={{fontFamily: SANS, fontWeight: 600, fontSize: fV, fill: 'rgba(247,245,240,0.92)', paintOrder: 'stroke', stroke: 'rgba(4,10,20,0.6)', strokeWidth: 5}}>{e.valor}</text>}
      </g>;
    })}
  </svg>
);

// rotulo pequeno de canto: "escala vertical exagerada"
export const Escala: React.FC<{texto: string; op: number}> = ({texto, op}) => (
  <div style={{position: 'absolute', right: 40, bottom: 26, opacity: op * 0.8, fontFamily: SANS, fontWeight: 600, fontSize: 17, letterSpacing: '0.16em', color: 'rgba(247,245,240,0.85)', textShadow: SOMBRA, textTransform: 'uppercase'}}>{texto}</div>
);
export {OURO, BRANCO, SANS};
