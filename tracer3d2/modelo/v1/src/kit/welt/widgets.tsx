// Kit welt · widgets HTML sobre a cena 3D (copias generalizadas de welt/g2_ui.tsx: textos e numeros vem das props, locale configuravel).
import React from 'react';
import {C, F, fase, sichtbar} from '../../ui/basis';
import {Track, amostra} from './curva';

const hash = (a: number, b: number) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
const vrausch = (i: number, tt: number) => { const k = Math.floor(tt), f = tt - k, u = f * f * (3 - 2 * f); return hash(i, k) * (1 - u) + hash(i, k + 1) * u; };

// barras de espectro (ruido deterministico); amp 0..1 cresce com o tempo, pfeif sobe o tom agudo
export const Espectro: React.FC<{t: number; em?: number; ate?: number; amp: number; titulo?: string; eixo?: string; x?: number; y?: number; w?: number; h?: number; pfeif?: number; cor?: string}> =
  ({t, em = 0, ate, amp, titulo = '', eixo = '', x = 64, y = 800, w = 760, h = 190, pfeif = 0.3, cor = C.cyan}) => {
    const o = sichtbar(t, em, 0.4, ate);
    if (o <= 0.001) return null;
    const n = 44, bw = w / n;
    const bars = [];
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1);
      const form = Math.exp(-f * 2.6) * 0.85 + 0.12;
      const pf = Math.exp(-Math.pow((f - (0.18 + pfeif * 0.5)) / 0.06, 2)) * 0.9;
      const v = Math.min(1, (form * (0.55 + 0.45 * vrausch(i, t * 9)) + pf * (0.7 + 0.3 * vrausch(i + 99, t * 7))) * amp);
      const bh = Math.max(2, v * (h - 40));
      bars.push(<rect key={i} x={i * bw + 2} y={h - bh} width={bw - 4} height={bh} fill={v > 0.75 ? C.signal : cor} fillOpacity={0.35 + 0.6 * v} />);
    }
    return (
      <div style={{position: 'absolute', left: x, top: y, width: w + 48, padding: '14px 24px 16px', background: 'rgba(13,15,18,0.62)', borderLeft: `3px solid ${cor}`, opacity: o}}>
        <div style={{fontFamily: F.mono, fontSize: 21, letterSpacing: 4, color: C.papier, marginBottom: 8, display: 'flex', justifyContent: 'space-between'}}>
          <span>{titulo}</span><span style={{color: C.grau}}>{eixo}</span></div>
        <svg width={w} height={h}>
          <line x1={0} y1={h - 0.5} x2={w} y2={h - 0.5} stroke={C.linie} strokeWidth={2} />
          {bars}
        </svg>
      </div>
    );
  };

// barra de energia: valor inicial (barra fantasma) -> final, perda hachurada
export const Energia: React.FC<{t: number; em?: number; ate?: number; de: number; para: number; fa: number; fe: number; rotulo_de?: string; unidade?: string; texto_perda?: string;
  x?: number; y?: number; w?: number; escala?: number; nf: (v: number, c?: number) => string}> =
  ({t, em = 0, ate, de, para, fa, fe, rotulo_de = '', unidade = 'MJ', texto_perda, x = 1000, y = 880, w = 800, escala = 50, nf}) => {
    const o = sichtbar(t, em, 0.4, ate);
    if (o <= 0.001) return null;
    const k = fase(t, fa, fe);
    const val = de + (para - de) * k;
    const X = (v: number) => (v / escala) * w;
    const verl = fase(t, fe - 0.1, fe + 0.5);
    return (
      <div style={{position: 'absolute', left: x - 30, top: y - 90, width: w + 60, height: 190, background: 'rgba(13,15,18,0.66)', opacity: o}}>
        <svg width={w + 60} height={190} style={{position: 'absolute', left: 0, top: 0}}>
          <g transform="translate(30,90)">
            <defs><pattern id="kit-hatch" width="10" height="10" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="10" stroke={C.orange} strokeWidth="4" /></pattern></defs>
            <rect x={0} y={0} width={X(de)} height={46} fill="none" stroke={C.grau} strokeWidth={1.5} strokeDasharray="6 5" />
            <rect x={X(val)} y={0} width={Math.max(0, X(de) - X(val))} height={46} fill="url(#kit-hatch)" opacity={verl * 0.9} />
            <rect x={0} y={0} width={X(val)} height={46} fill={C.cyan} fillOpacity={0.8} />
            <line x1={X(de)} y1={-14} x2={X(de)} y2={60} stroke={C.signal} strokeWidth={2.5} />
            <text x={X(de)} y={-22} fill={C.signal} fontFamily={F.mono} fontSize={22} textAnchor="end">{rotulo_de} {nf(de, 1)} {unidade}</text>
            <text x={Math.min(X(val) - 12, w)} y={34} fill={C.grund} fontFamily={F.mono} fontWeight={600} fontSize={30} textAnchor="end">{nf(val, 1)} {unidade}</text>
            {texto_perda && <text x={(X(val) + X(de)) / 2} y={90} fill={C.orange} fontFamily={F.mono} fontSize={26} textAnchor="middle" opacity={verl} letterSpacing={1}>{texto_perda}</text>}
          </g>
        </svg>
      </div>
    );
  };

// grafico v(t) desenhado ate o instante ts da curva
export const GraficoVt: React.FC<{t: number; em?: number; ate?: number; tr: Track; ts: number; x?: number; y?: number; w?: number; h?: number; tmax?: number; vmax?: number; marca?: number;
  titulo?: string; nf: (v: number, c?: number) => string; passo_v?: number}> =
  ({t, em = 0, ate, tr, ts, x = 1130, y = 560, w = 660, h = 330, tmax = 60, vmax = 350, marca, titulo = 'v (m/s) / t (s)', nf, passo_v = 100}) => {
    const o = sichtbar(t, em, 0.4, ate);
    if (o <= 0.001) return null;
    const X = (s: number) => x + (s / tmax) * w, Y = (v: number) => y + h - (v / vmax) * h;
    let dpath = '';
    for (let s = 0; s <= ts; s += 0.5) dpath += `${dpath ? 'L' : 'M'} ${X(s).toFixed(1)} ${Y(amostra(tr, s).v).toFixed(1)} `;
    const pv = amostra(tr, ts).v;
    dpath += `L ${X(ts).toFixed(1)} ${Y(pv).toFixed(1)}`;
    const vs: number[] = []; for (let v = 0; v < vmax; v += passo_v) vs.push(v);
    const passoT = tmax <= 30 ? 5 : 10;
    const tsx: number[] = []; for (let s = 0; s <= tmax + 1e-6; s += passoT) tsx.push(s);
    return (
      <div style={{position: 'absolute', inset: 0, opacity: o, pointerEvents: 'none'}}>
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <rect x={x - 90} y={y - 70} width={w + 150} height={h + 140} fill="rgba(13,15,18,0.68)" />
          <text x={x - 66} y={y - 30} fill={C.grau} fontSize={22} fontFamily={F.mono} letterSpacing={2}>{titulo}</text>
          {vs.map((v) => <g key={v}><line x1={x} x2={x + w} y1={Y(v)} y2={Y(v)} stroke={C.linie} strokeWidth={1.2} />
            <text x={x - 12} y={Y(v) + 7} fill={C.grau} fontSize={20} fontFamily={F.mono} textAnchor="end">{v}</text></g>)}
          {tsx.map((s) => <text key={s} x={X(s)} y={y + h + 30} fill={C.grau} fontSize={20} fontFamily={F.mono} textAnchor="middle">{s}</text>)}
          {marca !== undefined && <line x1={X(marca)} x2={X(marca)} y1={y} y2={y + h} stroke={C.signal} strokeWidth={1.5} strokeDasharray="5 6" strokeOpacity={0.7} />}
          <path d={dpath} stroke={C.signal} strokeWidth={4} fill="none" />
          <circle cx={X(ts)} cy={Y(pv)} r={8} fill={C.signal} />
          <text x={X(ts) + 16} y={Y(pv) - 14} fill={C.signal} fontSize={26} fontFamily={F.mono}>{nf(Math.round(pv))} m/s</text>
        </svg>
      </div>
    );
  };

// texto livre sobre a cena (posicao em px)
export const Texto: React.FC<{x: number; y: number; t: number; em?: number; ate?: number; cor?: string; tam?: number; fonte?: 'mono' | 'titulo' | 'texto'; peso?: number; espaco?: number;
  anker?: 'mitte' | 'links' | 'rechts'; tafel?: boolean; sombra?: string; opaco?: number; children: React.ReactNode}> =
  ({x, y, t, em = 0, ate, cor = C.papier, tam = 26, fonte = 'mono', peso, espaco, anker = 'links', tafel, sombra, opaco = 1, children}) => {
    const o = sichtbar(t, em, 0.4, ate) * opaco;
    if (o <= 0.001 || !isFinite(x) || !isFinite(y)) return null;
    const tx = anker === 'mitte' ? '-50%' : anker === 'rechts' ? '-100%' : '0';
    return <div style={{position: 'absolute', left: x, top: y, transform: `translate(${tx}, -50%)`, opacity: o, color: cor, fontFamily: (F as any)[fonte === 'mono' ? 'mono' : fonte === 'titulo' ? 'titel' : 'text'],
      fontSize: tam, fontWeight: peso, letterSpacing: espaco ?? (fonte === 'mono' ? 1.5 : 1), whiteSpace: 'nowrap', textShadow: sombra ?? '0 2px 10px rgba(0,0,0,0.95)',
      ...(tafel ? {background: 'rgba(13,15,18,0.66)', padding: '6px 14px', borderLeft: `3px solid ${cor}`} : {})}}>{children}</div>;
  };
