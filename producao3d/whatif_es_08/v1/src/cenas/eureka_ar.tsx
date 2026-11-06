// EUREKA 2 (cap. 09_eureka, b49-b54): por que os andinos moram no alto. O ar que sobe se expande e esfria ~4 °C por km na encosta
// (atmosfera padrao ICAO). Corte REAL dos Andes (dem.f16): Guayaquil -> Quito -> Amazonia (fases corte/sobe/guayaquil/quito)
// e o altiplano: Arica -> Tiwanaku -> El Alto/La Paz -> Yungas (fases tiwanaku/cielo), onde o mar do video (L ~3.000 m) sobe
// pelos dois lados e as cidades altas ficam acima. Funcao pura de (beat, t, u, L); camera sempre em movimento.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {CenaProps} from './tipos';
import {BRANCO, OURO, OdoNumero, SANS, SERIF, SOMBRA, cl, easeOut, fmtDec, fmtMil} from '../hud/base';
import {DADOS} from '../dados';
import {Cam, CamSync, Escala, Etiquetas, Etq, lerp, projetor, sm} from './eureka/comum';
import {Bolha, Corte, EstadoCorte, Gente, KM, Perfil, VE, chaoEm, corTemp, perfil} from './eureka/corte';

const ECU: [number, number][] = [[-81.3, -2.32], [-79.9, -2.19], [-78.51, -0.22], [-77.0, -0.4], [-76.2, -0.46]];
const BOL: [number, number][] = [[-71.0, -18.65], [-70.31, -18.48], [-68.67, -16.55], [-68.13, -16.5], [-67.75, -16.2], [-67.6, -15.0]];
const GYE: [number, number] = [-79.9, -2.19], UIO: [number, number] = [-78.51, -0.22], TIW: [number, number] = [-68.67, -16.55];
const ALTO: [number, number] = [-68.19, -16.5], LPZ: [number, number] = [-68.13, -16.5];
const LAPSO = 4.2;                                                   // °C por km na encosta (Guayaquil 26 °C -> Quito 14 °C em ~2,85 km; 05/11: 6,5 da atmosfera padrao nao fechava a conta)
const QUITO_MES = [14.0, 13.9, 13.9, 14.0, 14.1, 14.0, 14.0, 14.3, 14.3, 14.0, 13.9, 14.0];   // medias mensais aprox. (°C)
const MESES = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const ez = (x: number) => { const u = cl(0, 1, x); return u * u * (3 - 2 * u); };
const SOL: [number, number, number] = [-0.45, 0.85, 0.55];

// ---------------------------------------------------------------- bolha: sobe a encosta de Guayaquil ate a crista
const bolhaEm = (p: Perfil, u: number) => {
  const sG = p.sa(...GYE).s, sQ = p.sa(...UIO).s;
  let sR = sG, mx = -1e9; for (let s = sG; s < sQ; s += 2) { const h = chaoEm(p, s); if (h > mx) { mx = h; sR = s; } }
  const k = 0.12 * u + 0.88 * ez((u - 0.05) / 0.85), s = lerp(sG + 4, sR + 6, k);
  let teto = 0; for (let x = sG; x <= s; x += 1.5) teto = Math.max(teto, chaoEm(p, x));
  const alt = Math.max(teto + 420, 260 + 900 * k);
  return {s, alt, raio: 1.9 * (1 + 0.45 * alt / 4000), dT: -LAPSO * alt / 1000};
};

type Est = {perfil: Perfil; e: EstadoCorte; cam: Cam; gente: number};
const estado = (fase: string, u: number, t: number, L: number): Est => {
  const ecu = perfil('ECU', ECU), bol = perfil('BOL', BOL);
  const fim = 1e6;
  if (fase === 'corte') {
    const p = ecu, XM = p.comp * KM / 2, XQ = p.sa(...UIO).s * KM, k = ez(u);
    return {perfil: p, gente: 5, e: {Lw: 0, lamina: lerp(-6, p.comp * KM + 10, ez((u - 0.1) / 0.62)), ar: 0.2, iso: 0, t, pontosL: 0, sol: SOL},
      cam: {pos: [lerp(XQ - 6, XM + 3, k), lerp(34, 10, k), lerp(50, 76, k)], alvo: [lerp(XQ - 4, XM + 1, k), lerp(1, 3.6, k), lerp(-5, -2, k)], fov: 28}};
  }
  if (fase === 'sobe') {
    const p = ecu, b = bolhaEm(p, u), bx = b.s * KM, by = b.alt * VE;
    return {perfil: p, gente: 4.5, e: {Lw: 0, lamina: fim, ar: 0.35 + 0.65 * sm(0.05, 0.35, u), iso: sm(0.15, 0.45, u), t, pontosL: 0, sol: SOL},
      cam: {pos: [bx - 13 + 3 * u, by * 0.55 + 6, 46 - 4 * u], alvo: [bx + 4, by * 0.55 + 3.6, -3], fov: 30, desloc: -0.06}};
  }
  if (fase === 'guayaquil') {
    const p = ecu, XG = p.sa(...GYE).s * KM, k = ez(u);
    return {perfil: p, gente: 5, e: {Lw: 0, lamina: fim, ar: 0.75, iso: 0.45, t, pontosL: 0, sol: SOL},
      cam: {pos: [lerp(XG - 11, XG - 6, k), lerp(7.5, 6.5, k), lerp(36, 30, k)], alvo: [XG + 3, 2.6, -3], fov: 30, desloc: -0.06}};
  }
  if (fase === 'quito') {
    const p = ecu, XG = p.sa(...GYE).s * KM, XQ = p.sa(...UIO).s * KM, k = ez(u);
    return {perfil: p, gente: 5, e: {Lw: 0, lamina: fim, ar: 0.7, iso: 0.4, t, pontosL: 0, sol: SOL},
      cam: {pos: [lerp(XG + 2, XQ - 6, k), lerp(9, 14, k), lerp(50, 46, k)], alvo: [lerp(XG + 9, XQ + 3, k), lerp(3.5, 6.0, k), -3], fov: 30, desloc: -0.05}};
  }
  const p = bol, XT = p.sa(...TIW).s * KM, XM = p.comp * KM / 2, k = ez(u);
  if (fase === 'tiwanaku') {
    return {perfil: p, gente: 5, e: {Lw: 0, lamina: lerp(-6, p.comp * KM + 10, ez(u / 0.42)), ar: 0.45, iso: 0.25, t, pontosL: 0, sol: SOL},
      cam: {pos: [lerp(XT - 18, XT - 8, k), lerp(20, 16, k), lerp(60, 54, k)], alvo: [lerp(XT - 3, XT + 3, k), 5.5, -3], fov: 30, desloc: -0.06}};
  }
  // cielo: o mar do video sobe pelos dois lados do corte
  const Lw = L * ez(u / 0.72);
  return {perfil: p, gente: 5, e: {Lw, lamina: fim, ar: 0.4, iso: 0.15, t, pontosL: Lw, sol: SOL},
    cam: {pos: [lerp(XT + 1, XM + 2, k), lerp(15, 20, k), lerp(52, 78, k)], alvo: [lerp(XT + 3, XM + 2, k), lerp(5.5, 3.5, k), -3], fov: 30}};
};

// ---------------------------------------------------------------- instrumentos de tela (coluna direita)
const Termometro: React.FC<{titulo: string; valor: number; sub: string; delta: boolean; op: number; alt?: number}> = ({titulo, valor, sub, delta, op, alt}) => {
  if (op <= 0) return null;
  const H = 300, lo = -30, hi = 30, y = (v: number) => H - ((v - lo) / (hi - lo)) * H, cor = '#' + corTemp(delta ? -valor / 26 : (26 - valor) / 26).getHexString();
  return (
    <div style={{position: 'absolute', right: 70, top: 205, width: 330, opacity: op, transform: `translateX(${(1 - op) * 24}px)`, textShadow: SOMBRA, display: 'flex', gap: 22}}>
      <svg width={60} height={H + 50} style={{overflow: 'visible'}}>
        <rect x={18} y={0} width={24} height={H + 10} rx={12} fill="rgba(255,255,255,0.10)" stroke="rgba(247,245,240,0.6)" strokeWidth={2} />
        <rect x={23} y={y(valor)} width={14} height={Math.max(0, H + 8 - y(valor))} rx={7} fill={cor} />
        <circle cx={30} cy={H + 22} r={20} fill={cor} stroke="rgba(247,245,240,0.6)" strokeWidth={2} />
        {[-30, -20, -10, 0, 10, 20, 30].map((v) => <g key={v}><line x1={44} x2={52} y1={y(v)} y2={y(v)} stroke="rgba(247,245,240,0.7)" strokeWidth={2} />
          <text x={56} y={y(v) + 5} style={{fontFamily: SANS, fontSize: 13, fontWeight: 600, fill: 'rgba(247,245,240,0.75)'}}>{v}</text></g>)}
        {delta && <line x1={10} x2={50} y1={y(0)} y2={y(0)} stroke={OURO} strokeWidth={2} strokeDasharray="4 3" />}
      </svg>
      <div style={{paddingTop: 6}}>
        <div style={{fontFamily: SANS, fontWeight: 650, fontSize: 18, letterSpacing: '0.2em', color: 'rgba(247,245,240,0.78)'}}>{titulo}</div>
        <div style={{fontFamily: SANS, fontWeight: 760, fontSize: 64, color: cor, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums'}}>{delta ? (valor < -0.05 ? '−' : '') + fmtDec(Math.abs(valor), 1) : fmtDec(valor, 0)}<span style={{fontSize: 34, fontWeight: 600}}> °C</span></div>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 18, color: 'rgba(247,245,240,0.82)', marginTop: 2, maxWidth: 230}}>{sub}</div>
        {alt !== undefined && <div style={{marginTop: 18}}>
          <div style={{fontFamily: SANS, fontWeight: 650, fontSize: 16, letterSpacing: '0.2em', color: 'rgba(247,245,240,0.7)'}}>ALTITUD</div>
          <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 38, color: BRANCO, fontVariantNumeric: 'tabular-nums'}}>{fmtMil(alt)} <span style={{fontSize: 22}}>m</span></div>
        </div>}
        {delta && <div style={{marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 10, padding: '7px 14px', borderRadius: 999, border: `1.5px solid ${OURO}`, background: 'rgba(246,196,83,0.14)'}}>
          <span style={{fontFamily: SANS, fontWeight: 760, fontSize: 19, color: OURO, letterSpacing: '0.06em'}}>−4 °C POR KM</span></div>}
      </div>
    </div>);
};

const Dial: React.FC<{t: number; t0: number; op: number; prim: number}> = ({t, t0, op, prim}) => {
  if (op <= 0) return null;
  const R = 92, cx = 120, cy = 120, ano = Math.max(0, (t - t0) / 5.2), fr = ano % 1, mes = Math.floor(fr * 12), fm = fr * 12 - mes;
  const v = QUITO_MES[mes] * (1 - fm) + QUITO_MES[(mes + 1) % 12] * fm, ang = fr * Math.PI * 2 - Math.PI / 2;
  const varridos = Math.min(12, Math.floor(ano * 12) + 1);
  return (
    <div style={{position: 'absolute', left: 96, top: 500, opacity: op, textShadow: SOMBRA}}>
      <svg width={240} height={240}>
        <circle cx={cx} cy={cy} r={R} fill="rgba(8,16,30,0.45)" stroke="rgba(247,245,240,0.3)" strokeWidth={2} />
        {MESES.map((m, i) => {
          const a0 = (i / 12) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / 12) * Math.PI * 2 - Math.PI / 2 - 0.06, on = i < varridos;
          const arc = `M ${cx + Math.cos(a0) * R} ${cy + Math.sin(a0) * R} A ${R} ${R} 0 0 1 ${cx + Math.cos(a1) * R} ${cy + Math.sin(a1) * R}`;
          const am = a0 + Math.PI / 12;
          return <g key={i}>
            <path d={arc} stroke={on ? '#9fe0a0' : 'rgba(255,255,255,0.12)'} strokeWidth={10} fill="none" strokeLinecap="round" />
            <text x={cx + Math.cos(am) * (R - 24)} y={cy + Math.sin(am) * (R - 24) + 5} textAnchor="middle" style={{fontFamily: SANS, fontSize: 14, fontWeight: 700, fill: i === mes ? OURO : 'rgba(247,245,240,0.6)'}}>{m}</text>
          </g>;
        })}
        <line x1={cx} y1={cy} x2={cx + Math.cos(ang) * (R - 8)} y2={cy + Math.sin(ang) * (R - 8)} stroke={OURO} strokeWidth={3} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={5} fill={OURO} />
        <text x={cx} y={cy + 38} textAnchor="middle" style={{fontFamily: SANS, fontSize: 26, fontWeight: 760, fill: BRANCO}}>{fmtDec(v, 1)} °C</text>
      </svg>
      <div style={{textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 17, letterSpacing: '0.2em', color: 'rgba(247,245,240,0.8)', marginTop: -2}}>QUITO, TODO EL AÑO</div>
      <div style={{textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 40, color: OURO, opacity: prim, transform: `translateY(${(1 - prim) * 12}px)`}}>primavera eterna</div>
    </div>);
};

const LinhaTempo: React.FC<{u: number; op: number}> = ({u, op}) => {
  if (op <= 0) return null;
  const ano = Math.round(lerp(2026, 800, ez((u - 0.12) / 0.55))), anoA = Math.round(lerp(2026, 800, ez((u - 0.02 - 0.12) / 0.55)));
  const W = 300, x = (a: number) => (a / 2026) * W;
  return (
    <div style={{position: 'absolute', right: 80, top: 220, width: 340, opacity: op, textShadow: SOMBRA}}>
      <div style={{fontFamily: SANS, fontWeight: 650, fontSize: 18, letterSpacing: '0.2em', color: 'rgba(247,245,240,0.78)'}}>HACE MÁS DE MIL AÑOS</div>
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 10}}>
        <span style={{fontFamily: SANS, fontWeight: 600, fontSize: 30, color: 'rgba(247,245,240,0.8)', marginBottom: 10}}>año</span>
        <OdoNumero V={ano} Vant={anoA} digitos={4} px={70} milhar={false} cor={ano < 1100 ? OURO : BRANCO} />
      </div>
      <svg width={W + 20} height={70} style={{overflow: 'visible', marginTop: 6}}>
        <line x1={0} x2={W} y1={20} y2={20} stroke="rgba(247,245,240,0.4)" strokeWidth={3} />
        <rect x={x(500)} y={13} width={x(1000) - x(500)} height={14} rx={7} fill="rgba(246,196,83,0.5)" stroke={OURO} strokeWidth={1.5} />
        <circle cx={x(ano)} cy={20} r={8} fill={BRANCO} />
        {[0, 1000, 2026].map((a) => <text key={a} x={x(a)} y={52} textAnchor="middle" style={{fontFamily: SANS, fontSize: 15, fontWeight: 650, fill: 'rgba(247,245,240,0.7)'}}>{a === 2026 ? 'hoy' : a}</text>)}
        <text x={(x(500) + x(1000)) / 2} y={4} textAnchor="middle" style={{fontFamily: SANS, fontSize: 13, fontWeight: 750, letterSpacing: '0.12em', fill: OURO}}>TIWANAKU</text>
      </svg>
    </div>);
};

// cota vertical presa ao corte: do nivel do mar ate a altura, com marcas por km
type Pt = {x: number; y: number; ok: boolean};
const Cota: React.FC<{a: Pt; b: Pt; marcas: {p: Pt; txt: string}[]; titulo?: string; cor?: string; op: number}> = ({a, b, marcas, titulo, cor = BRANCO, op}) => {
  if (op <= 0 || !a.ok || !b.ok) return null;
  const yb = a.y + (b.y - a.y) * op;
  return <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: Math.min(1, op * 2)}}>
    <line x1={a.x} y1={a.y} x2={a.x + (b.x - a.x) * op} y2={yb} stroke={cor} strokeWidth={2.5} />
    <line x1={a.x - 10} x2={a.x + 10} y1={a.y} y2={a.y} stroke={cor} strokeWidth={2.5} />
    {op > 0.98 && <line x1={b.x - 10} x2={b.x + 10} y1={b.y} y2={b.y} stroke={cor} strokeWidth={2.5} />}
    {marcas.map((m, i) => (m.p.y >= yb - 1 && m.p.ok) ? <g key={i}>
      <line x1={m.p.x - 7} x2={m.p.x + 7} y1={m.p.y} y2={m.p.y} stroke={cor} strokeWidth={2} />
      <text x={m.p.x - 14} y={m.p.y + 6} textAnchor="end" style={{fontFamily: SANS, fontSize: 18, fontWeight: 650, fill: cor, paintOrder: 'stroke', stroke: 'rgba(4,10,20,0.6)', strokeWidth: 5}}>{m.txt}</text>
    </g> : null)}
    {titulo && op > 0.6 && <text x={b.x + 16} y={(a.y + b.y) / 2} style={{fontFamily: SANS, fontSize: 26, fontWeight: 780, fill: cor, paintOrder: 'stroke', stroke: 'rgba(4,10,20,0.6)', strokeWidth: 6}}>{titulo}</text>}
  </svg>;
};

// mosquitos estilizados (baixada quente e umida), posicoes por funcao do tempo
const Mosquitos: React.FC<{lista: {x: number; y: number; ok: boolean}[]; t: number; op: number}> = ({lista, t, op}) => op <= 0 ? null : (
  <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, opacity: op}}>
    {lista.map((m, i) => !m.ok ? null : <g key={i} transform={`translate(${m.x},${m.y}) rotate(${-20 + 40 * Math.sin(t * 3 + i)})`}>
      <ellipse cx={-5} cy={-4} rx={6} ry={2.4 + 1.6 * Math.abs(Math.sin(t * 40 + i))} fill="rgba(230,240,255,0.7)" transform="rotate(-35)" />
      <ellipse cx={5} cy={-4} rx={6} ry={2.4 + 1.6 * Math.abs(Math.cos(t * 40 + i))} fill="rgba(230,240,255,0.7)" transform="rotate(35)" />
      <ellipse cx={0} cy={0} rx={2.6} ry={6.5} fill="#2b1d14" stroke="rgba(255,255,255,0.65)" strokeWidth={1} />
      <line x1={0} y1={6} x2={0} y2={12} stroke="#2b1d14" strokeWidth={1.4} />
    </g>)}
  </svg>);

// calor: ondas que sobem da baixada
const Calor: React.FC<{x: number; y: number; t: number; op: number}> = ({x, y, t, op}) => op <= 0 ? null : (
  <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, opacity: op, pointerEvents: 'none'}}>
    {Array.from({length: 7}, (_, i) => {
      const fr = ((t * 0.55 + i / 7) % 1), x0 = x - 210 + i * 70, y0 = y - fr * 170;
      let d = `M ${x0} ${y0}`; for (let k = 1; k <= 8; k++) d += ` L ${x0 + 9 * Math.sin(k * 1.1 + t * 4 + i)} ${y0 - k * 11}`;
      return <path key={i} d={d} fill="none" stroke="#ffb066" strokeWidth={3} strokeLinecap="round" opacity={0.55 * Math.sin(Math.PI * fr)} />;
    })}
  </svg>);

export const Cena: React.FC<CenaProps> = ({beat, t, u, L}) => {
  const fase = beat.fase ?? 'corte';
  if (!DADOS) return null;
  const E0 = estado(fase, u, t, L);
  // vida de camera: aproxima 22% e desliza de lado ao longo da batida (nunca parar; 05/11: fases mediam 0,6 de movimento)
  const [px, py, pz] = E0.cam.pos, [ax, ay, az] = E0.cam.alvo, f = 1.12 - 0.22 * u, lado = (u - 0.5) * 7;
  const E = {...E0, cam: {...E0.cam, pos: [ax + (px - ax) * f + lado, ay + (py - ay) * f, az + (pz - az) * f] as [number, number, number], alvo: [ax + lado * 0.6, ay, az] as [number, number, number]}};
  const p = E.perfil, pr = projetor(E.cam), tb = t - beat.ini;
  const P3 = (lon: number, lat: number, dm = 0, z = 0): Pt => { const q = p.pos(lon, lat); return pr([q[0], q[1] + dm * VE, q[2] + z]); };
  const em = (ll: [number, number], m: number) => pr([p.sa(...ll).s * KM, m * VE, 0.05]);
  const etq: Etq[] = []; let extra: React.ReactNode = null; let painel: React.ReactNode = null; let bolha: React.ReactNode = null;
  const altG = Math.round(Math.max(0, p.dem(...GYE))), altQ = 2850;
  if (fase === 'corte') {
    etq.push({id: 'q', ...P3(...UIO), titulo: 'QUITO', valor: `${fmtMil(altQ)} m`, idade: t - 298.0, dx: 90, dy: -110});
    etq.push({id: 'g', ...P3(...GYE), titulo: 'GUAYAQUIL', valor: 'junto al mar', idade: t - 298.8, dx: -60, dy: -120});
    extra = <Cota a={em(UIO, 0)} b={em(UIO, altQ)} marcas={[1, 2].map((k) => ({p: em(UIO, k * 1000), txt: `${k} km`}))} op={ez((t - 299.2) / 1.0)} cor={OURO} />;
  }
  if (fase === 'sobe') {
    const b = bolhaEm(p, u), bA = bolhaEm(p, Math.max(0, u - 0.01)), pos: [number, number, number] = [b.s * KM, b.alt * VE, 1.6];
    bolha = <Bolha pos={pos} raio={b.raio} frio={-b.dT / 26} t={t} op={ez(tb / 0.4)} />;
    const base = pr([b.s * KM - b.raio - 0.8, 0, 1.6]), topo = pr([b.s * KM - b.raio - 0.8, b.alt * VE, 1.6]);
    const marcas = [1, 2, 3, 4].filter((k) => k * 1000 <= b.alt).map((k) => ({p: pr([b.s * KM - b.raio - 0.8, k * 1000 * VE, 1.6]), txt: `${k} km · −${fmtDec(k * LAPSO, 1)} °C`}));
    extra = <Cota a={base} b={topo} marcas={marcas} op={ez((tb - 0.2) / 0.5)} cor={OURO} />;
    etq.push({id: 'exp', ...pr([pos[0] + b.raio * 0.7, pos[1] + b.raio * 0.7, pos[2]]), titulo: 'SE EXPANDE', valor: 'y al expandirse, se enfría', idade: tb - 1.0, dx: 120, dy: -80, cor: '#' + corTemp(-b.dT / 26).getHexString()});
    painel = <Termometro titulo="AIRE QUE SUBE" valor={b.dT} sub="cambio de temperatura" delta op={ez(tb / 0.5)} alt={Math.round(b.alt)} />;
    void bA;
  }
  if (fase === 'guayaquil') {
    etq.push({id: 'g', ...P3(...GYE), titulo: 'GUAYAQUIL · 26 °C', valor: `costa de Ecuador · ${altG} m`, idade: tb - 0.3, dx: 70, dy: -150, grande: true, cor: '#ffb066'});
    const g = P3(...GYE);
    extra = <Calor x={g.x} y={g.y - 30} t={t} op={ez((tb - 0.2) / 0.6)} />;
    painel = <Termometro titulo="GUAYAQUIL" valor={26} sub="temperatura media del año" delta={false} op={ez((tb - 0.3) / 0.5)} />;
  }
  if (fase === 'quito') {
    etq.push({id: 'q', ...P3(...UIO), titulo: 'QUITO · ~14 °C', valor: `${fmtMil(altQ)} m sobre el mar`, idade: t - 318.6, dx: -110, dy: -140, grande: true, cor: '#9fe0a0'});
    etq.push({id: 'g', ...P3(...GYE), titulo: 'GUAYAQUIL · 26 °C', idade: tb + 1, dx: -60, dy: -90, cor: '#ffb066'});
    etq.push({id: 's', ...P3(-76.6, -0.4), titulo: 'SELVA', valor: 'calor y mosquitos', idade: t - 323.0, dx: 60, dy: -110, cor: '#ffb066'});
    extra = <Cota a={em(UIO, 0)} b={em(UIO, altQ)} marcas={[1, 2].map((k) => ({p: em(UIO, k * 1000), txt: `${k} km`}))} titulo="casi 3 km" op={ez((t - 316.8) / 1.4)} cor={OURO} />;
    const vQ = t < 318.6 ? lerp(26, 14, ez((t - 316.8) / 1.8)) : 14;
    painel = <>
      <Termometro titulo={t < 318.6 ? 'SUBIENDO' : 'QUITO'} valor={vQ} sub="temperatura media del año" delta={false} op={1} />
      <Dial t={t} t0={319.3} op={ez((t - 319.3) / 0.6)} prim={ez((t - 322.3) / 0.6)} />
    </>;
  }
  if (fase === 'tiwanaku') {
    etq.push({id: 'tw', ...P3(...TIW), titulo: 'TIWANAKU · ~3.850 m', valor: 'ciudad de piedra, Bolivia', idade: tb - 1.2, dx: -80, dy: -150, grande: true, cor: OURO});
    const xa = pr([0, 3850 * VE, 0.1]), xb = pr([p.comp * KM, 3850 * VE, 0.1]);
    const op = ez((t - 327.6) / 0.9);
    extra = op > 0 ? <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
      <line x1={xa.x} y1={xa.y} x2={xa.x + (xb.x - xa.x) * op} y2={xa.y + (xb.y - xa.y) * op} stroke={OURO} strokeWidth={2.5} strokeDasharray="12 8" />
      <text x={xa.x + 30} y={xa.y - 12} style={{fontFamily: SANS, fontSize: 22, fontWeight: 760, fill: OURO, opacity: op, paintOrder: 'stroke', stroke: 'rgba(4,10,20,0.6)', strokeWidth: 5}}>CASI 4.000 m</text>
    </svg> : null;
    painel = <LinhaTempo u={u} op={ez((tb - 0.6) / 0.5)} />;
  }
  if (fase === 'cielo') {
    const Lw = E.e.Lw;
    etq.push({id: 'alto', ...P3(...ALTO), titulo: 'EL ALTO · 4.050 m', idade: tb - 1.4, dx: 80, dy: -150, cor: OURO});
    etq.push({id: 'lpz', ...P3(...LPZ), titulo: 'LA PAZ · 3.650 m', idade: tb - 1.8, dx: 140, dy: -60, cor: OURO});
    etq.push({id: 'tw', ...P3(...TIW), titulo: 'TIWANAKU', idade: tb - 2.1, dx: -100, dy: -120, cor: OURO});
    const sM = p.sa(-70.0, -18.15).s;
    etq.push({id: 'mar', ...pr([sM * KM, Lw * VE, 0.1]), titulo: 'EL MAR', valor: `+${fmtMil(Lw)} m`, idade: tb - 0.6, dx: -60, dy: -120, cor: '#7fe3f0'});
    const ceu = ez((t - 333.3) / 0.8);
    extra = ceu > 0 ? <div style={{position: 'absolute', right: 110, top: 250, opacity: ceu, transform: `translateY(${(1 - ceu) * 16}px)`, textAlign: 'right', textShadow: SOMBRA}}>
      <div style={{fontFamily: SANS, fontWeight: 650, fontSize: 19, letterSpacing: '0.2em', color: 'rgba(247,245,240,0.8)'}}>SOBRE EL AGUA</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 64, color: OURO, lineHeight: 1.05}}>viven en el cielo</div>
    </div> : null;
  }
  // mosquitos: baixada da costa (e selva na fase quito)
  let mosq: React.ReactNode = null;
  if (fase === 'guayaquil' || fase === 'quito') {
    const sG = p.sa(...GYE).s, lista: Pt[] = [];
    const zonas: [number, number][] = fase === 'quito' ? [[sG - 50, sG + 55], [p.comp - 150, p.comp - 15]] : [[sG - 45, sG + 60]];
    zonas.forEach(([s0, s1], z) => { for (let i = 0; i < 14; i++) {
      const f = ((i * 0.618 + z * 0.3) % 1), s = s0 + (s1 - s0) * f + 6 * Math.sin(t * 1.7 + i * 2.1), h = Math.max(0, chaoEm(p, s)) + 250 + 220 * Math.sin(t * 2.3 + i), zz = 0.8 - 2.5 * ((i * 0.37) % 1);
      lista.push(pr([s * KM, h * VE, zz]));
    } });
    mosq = <Mosquitos lista={lista} t={t} op={fase === 'guayaquil' ? ez((tb - 0.8) / 0.6) : 0.85} />;
  }
  const fade = ez(tb / 0.25);
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #0a1628 0%, #13304e 55%, #24496a 100%)'}}>
      <AbsoluteFill style={{opacity: fade}}>
        <ThreeCanvas width={1920} height={1080} gl={{antialias: true, alpha: true, toneMapping: THREE.NoToneMapping}} camera={{fov: 30, near: 0.05, far: 2000, position: [0, 10, 60]}}>
          <CamSync c={E.cam} />
          <Corte p={p} e={E.e} />
          <Gente p={p} L={E.e.pontosL} tam={E.gente} />
          {bolha}
        </ThreeCanvas>
      </AbsoluteFill>
      {mosq}
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(5,12,24,0) 70%, rgba(5,12,24,0.42) 100%)', opacity: painel ? 1 : 0}} />
      {extra}
      <Etiquetas lista={etq} t={t} />
      {painel}
      <Escala texto="relieve real · escala vertical ×21" op={fade} />
    </AbsoluteFill>
  );
};
