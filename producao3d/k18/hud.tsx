// HUD global do K18 (por cima das cenas, em Video.tsx). Funcao pura do tempo do video `t`.
//  - RELOGIO DE BOLSO a tinta + data/hora escritas pelo tegaki + REGUA que se enche de tinta. Vivo: entra quando a batida tem hora
//    (h0/h1 ou d0/d1), os ponteiros correm com horaDe(beat,u), a hora se reescreve quando muda, vai a LAPIS e encolhe quando a hora
//    fica parada > 4 s, some nas cenas sem hora. Zona: x 60..760, y 50..330.
//  - LUGAR (nome_1866 de dados/lugares.json via beat.reg) escrito no canto superior direito, com fio de pena.
//  - LEGENDA por bloco (src/tinta/legendas.json, gerado por gerar_legendas.py: numerais/datas, <= 2 x 42 c.), embaixo (y > 900).
//  - marca '@Kriegsmomente' discreta.
import React from 'react';
import plano from '../plano.json';
import {Beat} from '../cenas/tipos';
import {horaDe, minutos} from '../relogio';
import {DADOS} from '../dados';
import {COR, Escrita, FONTE, Folha, penaPath, Traco, larguraTexto} from './index';
import LEG from './legendas.json';

const BEATS = (plano.beats as Beat[]).slice().sort((a, b) => a.ini - b.ini);
const LEGS = LEG as {ini: number; fim: number; l: string[]}[];
const cl = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ss = (v: number) => { const x = cl(v); return x * x * (3 - 2 * x); };
const mix = (a: string, b: string, k: number) => {
  const p = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
};

// ---------- hora por batida (a familia telegrama nao tem h0 no plano: horas do dossie, OeK III p. 228)
const HORA_FASE: Record<string, [string, string]> = {
  'telegrama:linha_wien': ['01.07 11:20', '01.07 11:30'], 'telegrama:pedido': ['01.07 11:30', '01.07 11:30'],
  'telegrama:resposta': ['01.07 14:10', '01.07 14:10'], 'telegrama:rueckzug': ['01.07 14:10', '01.07 14:10'], 'telegrama:frage': ['01.07 14:10', '01.07 14:12'],
};
// batidas em que o plano traz 00:00 de placeholder e a cena `campo` usa hora propria (espelho de campo/receitas2.tsx, 06/11)
const HORA_BEAT: Record<string, [number, number]> = {b009: [660, 660], b013: [360, 900], b035: [360, 360]};
const easeH = (u: number) => 0.25 * u * u * (3 - 2 * u) + 0.75 * u;
type Modo = 'hora' | 'dia' | null;
const modo = (b?: Beat): Modo => {
  if (!b) return null;
  if (HORA_FASE[`${b.familia}:${b.fase}`]) return 'hora';
  if (b.h0) return 'hora';
  if (b.d0) return /\d:\d/.test(b.d0) ? 'hora' : 'dia';
  return null;
};
const minDe = (b: Beat, u: number) => {
  const hb = HORA_BEAT[b.id];
  if (hb) return hb[0] + (hb[1] - hb[0]) * easeH(cl(u));
  const f = HORA_FASE[`${b.familia}:${b.fase}`];
  if (f) { const a = minutos(f[0]), z = minutos(f[1]); return a + (z - a) * cl(u); }
  return horaDe(b, u);
};
const MES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const DIA0 = Date.UTC(1866, 6, 3);
const dataDe = (min: number, ano = false) => { const d = new Date(DIA0 + Math.floor(min / 1440) * 86400000); return `${d.getUTCDate()}. ${MES[d.getUTCMonth()]}${ano ? ' 1866' : ''}`; };
const hhmm = (min: number) => { const m = ((Math.round(min) % 1440) + 1440) % 1440; return `${Math.floor(m / 60)}.${String(m % 60).padStart(2, '0')}`; };
// passo do texto da hora: o menor que nao reescreva mais de 1x por 0,45 s
const passoDe = (b: Beat) => {
  const a = minDe(b, 0), z = minDe(b, 1), d = b.fim - b.ini, span = Math.abs(z - a);
  for (const p of [1, 5, 10, 15, 30, 60, 120]) if (span / p <= d / 0.45) return p;
  return 240;
};
const arred = (m: number, p: number) => Math.floor(m / p + 1e-6) * p;

// ---------- lugar
const NOME_REG: Record<string, string> = {gesamt: 'Schlachtfeld von Königgrätz', bistritz: 'An der Bistritz', elbe: 'An der Elbe', nordost: 'Die Höhen im Nordosten',
  boehmen: 'Böhmen', route: 'Gitschin – Königinhof', europa: 'Mitteleuropa'};
const BUSCA_REG: Record<string, string> = {lipa: 'Lipa', chlum: 'Chlum (Höhe', swiepwald: 'Swiepwald', rosberitz: 'Rosberitz', nedelist: 'Nedelist', horenowes: 'Horenowes (aldeia)',
  holawald: 'Holawald', sadowa: 'Sadowa', lochenitz: 'Lochenitz', stresetitz: 'Stresetitz', koeniginhof: 'Königinhof'};
const limpaNome = (s: string) => s.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+[—+].*$/, '').trim();
const nomeLugar = (reg?: string) => {
  if (!reg) return null;
  const k = BUSCA_REG[reg];
  if (k && DADOS?.lugares) { const l = DADOS.lugares.find((x: any) => String(x.nome_1866).startsWith(k)); if (l) return limpaNome(l.nome_1866); }
  return NOME_REG[reg] ?? (reg.charAt(0).toUpperCase() + reg.slice(1));
};

// ---------- relogio de bolso
const CX = 172, CY = 192, R = 96;
const circulo = (cx: number, cy: number, r: number, a0 = -Math.PI / 2, n = 72): [number, number][] =>
  Array.from({length: n + 1}, (_, i) => { const a = a0 + i / n * Math.PI * 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
const ROMANOS = ['XII', 'III', 'VI', 'IX'];
const Relogio: React.FC<{t: number; t0: number; min: number; cor: string; giro: number}> = ({t, t0, min, cor, giro}) => {
  const e = cl((t - t0) / 0.9);
  const am = ((min % 60) + 60) % 60 / 60 * Math.PI * 2 - Math.PI / 2 + giro * Math.PI * 2;
  const ah = ((min % 720) + 720) % 720 / 720 * Math.PI * 2 - Math.PI / 2 + giro * Math.PI * 2 / 12;
  const ponteiro = (a: number, L: number, larg: number) => penaPath([[CX - Math.cos(a) * L * 0.16, CY - Math.sin(a) * L * 0.16], [CX + Math.cos(a) * L, CY + Math.sin(a) * L]], {largura: larg, pressao: false, afina: false, semente: 0.2});
  const pm = cl((t - t0 - 0.55) / 0.35);
  return <g>
    <circle cx={CX} cy={CY} r={R + 2} fill={COR.papel} opacity={0.72 * ss(e * 2)} />
    <Traco t={t} t0={t0} dur={0.7} pontos={circulo(CX, CY, R)} largura={5.5} cor={cor} semente={0.31} />
    <Traco t={t} t0={t0 + 0.12} dur={0.7} pontos={circulo(CX, CY, R - 9, -Math.PI / 2 + 0.3)} largura={1.6} cor={cor} pressao={false} grao={false} semente={0.12} />
    {/* argola e coroa */}
    <Traco t={t} t0={t0 + 0.35} dur={0.35} pontos={circulo(CX, CY - R - 26, 15, Math.PI / 2, 40)} largura={3.6} cor={cor} semente={0.5} />
    <g opacity={ss((t - t0 - 0.3) / 0.3)}><rect x={CX - 7} y={CY - R - 12} width={14} height={11} fill={cor} rx={2} /></g>
    {Array.from({length: 60}, (_, i) => { const a = i / 60 * Math.PI * 2 - Math.PI / 2, h = i % 5 === 0, ok = cl((t - t0 - 0.25 - i * 0.006) / 0.15);
      if (ok <= 0) return null; const r0 = R - 14, r1 = h ? R - 24 : R - 17;
      return <line key={i} x1={CX + Math.cos(a) * r0} y1={CY + Math.sin(a) * r0} x2={CX + Math.cos(a) * r1} y2={CY + Math.sin(a) * r1} stroke={cor} strokeWidth={h ? 2.6 : 1} opacity={ok} />; })}
    {ROMANOS.map((n, i) => { const a = i / 4 * Math.PI * 2 - Math.PI / 2, rr = R - 40;
      return <text key={n} x={CX + Math.cos(a) * rr} y={CY + Math.sin(a) * rr + 8} fontFamily={FONTE.fellRom} fontSize={22} fill={cor} textAnchor="middle" opacity={ss((t - t0 - 0.45) / 0.3)}>{n}</text>; })}
    <g opacity={pm}><path d={ponteiro(ah, R * 0.5, 7)} fill={cor} /><path d={ponteiro(am, R * 0.78, 3.6)} fill={cor} />
      <circle cx={CX} cy={CY} r={6.5} fill={cor} /><circle cx={CX} cy={CY} r={2.2} fill={COR.papel} /></g>
  </g>;
};

// regua do dia (ou da campanha) que se enche de tinta
const RX0 = 312, RX1 = 742, RY = 286;
const Regua: React.FC<{t: number; t0: number; min: number; m: Modo; cor: string}> = ({t, t0, min, m, cor}) => {
  let a: number, z: number, marcas: {v: number; txt?: string; alta?: boolean}[] = [];
  if (m === 'hora') {
    const dia = Math.floor(min / 1440); a = dia * 1440; z = a + 1440;
    for (let h = 0; h <= 24; h += 1) marcas.push({v: a + h * 60, alta: h % 6 === 0, txt: h % 6 === 0 && h < 24 ? `${h}` : undefined});
  } else {
    const d = Math.floor(min / 1440); a = Math.min(-11, d - 1) * 1440; z = Math.max(1, d + 1) * 1440;
    const nd = Math.round((z - a) / 1440), passo = nd > 20 ? 7 : 1;
    for (let k = 0; k <= nd; k += passo) { const v = a + k * 1440, dd = new Date(DIA0 + Math.round(v / 1440) * 86400000);
      marcas.push({v, alta: k % (passo * 4) === 0 || k === nd, txt: k % (passo * 4) === 0 ? `${dd.getUTCDate()}.${dd.getUTCMonth() + 1}.` : undefined}); }
  }
  const X = (v: number) => RX0 + (RX1 - RX0) * cl((v - a) / (z - a));
  const e = cl((t - t0 - 0.4) / 0.6), xc = X(min);
  return <g>
    <Traco t={t} t0={t0 + 0.4} dur={0.6} pontos={[[RX0, RY], [RX1, RY]]} largura={2.2} cor={cor} pressao={false} grao={false} semente={0.7} />
    {marcas.map((k, i) => { const x = X(k.v), o = cl((e * (RX1 - RX0) - (x - RX0)) / 30);
      return o > 0 && <g key={i} opacity={o}><line x1={x} y1={RY} x2={x} y2={RY - (k.alta ? 12 : 6)} stroke={cor} strokeWidth={k.alta ? 1.8 : 1} />
        {k.txt && <text x={x} y={RY + 27} fontFamily={FONTE.fellRom} fontSize={24} fill={COR.sepia} textAnchor="middle">{k.txt}</text>}</g>; })}
    {/* a tinta que enche ate a hora atual */}
    {e > 0 && <path d={penaPath([[RX0, RY - 5], [RX0 + (xc - RX0) * ss(e), RY - 5]], {largura: 7, pressao: false, afina: false, afinaFim: false, semente: 0.9})} fill={cor} opacity={0.85} />}
    {e > 0.5 && <path d={`M${xc - 7},${RY - 26} L${xc + 7},${RY - 26} L${xc},${RY - 13} Z`} fill={cor} opacity={ss((e - 0.5) * 2)} />}
  </g>;
};

// ---------- legenda
const Legenda: React.FC<{t: number}> = ({t}) => {
  const L = LEGS.find((l) => t >= l.ini && t < l.fim);
  if (!L) return null;
  const o = Math.min(cl((t - L.ini) / 0.12), cl((L.fim - t) / 0.12));
  const tam = 42, lh = 50, n = L.l.length, w = Math.max(...L.l.map((s) => s.length)) * tam * 0.44 + 70, y0 = 1046 - (n - 1) * lh;
  return <g opacity={o}>
    <defs><filter id="k18-leg-borda" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="10" /></filter></defs>
    <rect x={960 - w / 2} y={y0 - tam - 6} width={w} height={(n - 1) * lh + tam + 26} rx={14} fill={COR.papel} opacity={0.86} filter="url(#k18-leg-borda)" />
    {L.l.map((s, i) => <text key={i} x={960} y={y0 + i * lh} fontFamily={FONTE.garamond} fontSize={tam} fill={COR.tinta} textAnchor="middle">{s}</text>)}
  </g>;
};

// ---------- HUD
const saidaL = (t: number, t0: number, ate?: number) => ss((t - t0 + 0.2) / 0.4) * (ate === undefined ? 1 : 1 - cl((t - ate) / 0.35));
const achaIdx = (t: number) => { let k = -1; for (let i = 0; i < BEATS.length; i++) { if (BEATS[i].ini <= t + 1e-6) k = i; else break; } return k; };
const contiguo = (a?: Beat, b?: Beat) => !!a && !!b && Math.abs(a.fim - b.ini) < 0.05;

export const Hud: React.FC<{t: number}> = ({t}) => {
  const i = achaIdx(t), b = BEATS[i];
  let relogio: React.ReactNode = null, lugar: React.ReactNode = null;
  if (b && t < b.fim + 0.05) {
    const u = cl((t - b.ini) / (b.fim - b.ini)), m = modo(b);
    // ---- relogio
    if (m) {
      let j = i; while (j > 0 && modo(BEATS[j - 1]) && contiguo(BEATS[j - 1], BEATS[j])) j--;
      const tEnt = BEATS[j].ini, prox = BEATS[i + 1], sai = !(prox && modo(prox) && contiguo(b, prox));
      const oSai = sai ? cl((b.fim - t) / 0.4) : 1;
      const min = minDe(b, u);
      // enfase: hora mexendo (ou acabou de saltar) = tinta cheia; parada > 4 s = lapis e menor
      let ult = tEnt;
      for (let k = i; k >= j; k--) {
        const bk = BEATS[k], muda = Math.abs(minDe(bk, 1) - minDe(bk, 0)) > 0.5;
        if (muda) { ult = k === i ? t : bk.fim; break; }
        const salto = k > j && Math.abs(minDe(BEATS[k - 1], 1) - minDe(bk, 0)) > 0.5;
        if (salto) { ult = bk.ini; break; }
      }
      const enf = 1 - ss((t - ult - 4) / 1.0);
      const cor = mix(COR.lapis, COR.tinta, enf), esc = 0.8 + 0.2 * enf;
      // giro extra dos ponteiros no modo dia (os dias correm)
      const giro = m === 'dia' ? (min - minDe(BEATS[j], 0)) / 1440 * 2 : 0;
      // texto: data (estavel no trecho) + hora (reescreve quando muda)
      const passo = passoDe(b), mr = arred(min, passo);
      let tHora = tEnt + 0.5;
      if (m === 'hora') {
        const m0 = arred(minDe(b, 0), passo), contAnt = j < i && arred(minDe(BEATS[i - 1], 1), passoDe(BEATS[i - 1])) === m0;
        if (mr !== m0 || !contAnt) {
          let lo = 0, hi = u; // primeiro u em que o valor arredondado chegou a mr
          for (let k = 0; k < 24; k++) { const mid = (lo + hi) / 2; if (arred(minDe(b, mid), passo) >= mr) hi = mid; else lo = mid; }
          tHora = Math.max(tEnt + 0.5, b.ini + hi * (b.fim - b.ini));
        } else tHora = -1e3;
      }
      const txtData = m === 'dia' ? dataDe(min, true) : dataDe(min) + ',';
      // na mudanca de data dentro do trecho, a data se reescreve
      let tData = tEnt + 0.3;
      if (j < i && dataDe(minDe(BEATS[j], 0)) !== dataDe(min)) tData = b.ini;
      const eFundo = ss((t - tEnt) / 0.5);
      relogio = <g opacity={oSai} transform={`translate(60 50) scale(${esc}) translate(-60 -50)`}>
        {/* fundo de papel macio: o HUD le sobre qualquer cena (mapa, 3D) */}
        <rect x={290} y={m === 'dia' ? 160 : 118} width={470} height={m === 'dia' ? 160 : 204} rx={22} fill={COR.papel} opacity={0.8 * eFundo} filter="url(#k18-hud-borda)" />
        <Relogio t={t} t0={tEnt} min={min} cor={cor} giro={giro} />
        <Escrita t={t} t0={tData} texto={txtData} x={312} y={m === 'dia' ? 228 : 182} tam={m === 'dia' ? 56 : 48} cor={cor} vel={22} />
        {m === 'hora' && <Escrita key={mr} t={t} t0={tHora} texto={hhmm(mr)} x={312} y={244} tam={62} cor={cor} vel={tHora < 0 ? 22 : 40} />}
        {m === 'hora' && <Escrita t={t} t0={tEnt + 0.8} texto="Uhr" x={312 + larguraTexto(hhmm(mr) + ' ', 62)} y={244} tam={62} cor={cor} vel={12} />}
        <Regua t={t} t0={tEnt} min={min} m={m} cor={cor} />
      </g>;
    }
    // ---- lugar
    const nome = nomeLugar(b.reg);
    if (nome) {
      let j = i; while (j > 0 && BEATS[j - 1].reg === b.reg && contiguo(BEATS[j - 1], BEATS[j])) j--;
      const t0 = BEATS[j].ini + 0.25, prox = BEATS[i + 1], sai = !(prox && prox.reg === b.reg && contiguo(b, prox));
      const ate = sai ? b.fim - 0.4 : undefined, w = larguraTexto(nome, 46);
      lugar = <g>
        <rect x={1858 - w - 34} y={44} width={w + 56} height={92} rx={20} fill={COR.papel} opacity={0.78 * saidaL(t, t0, ate)} filter="url(#k18-hud-borda)" />
        <Escrita t={t} t0={t0} texto={nome} x={1858} y={96} tam={46} ancora="end" vel={20} ate={ate} />
        <Traco t={t} t0={t0 + nome.length / 20 * 0.8} dur={0.45} pontos={[[1858 - w * 0.95, 116], [1858 - w * 0.4, 119], [1858, 114]]} largura={2.2} cor={COR.sepia} ate={ate} semente={0.4} />
      </g>;
    }
  }
  return <Folha>
    <defs><filter id="k18-hud-borda" x="-15%" y="-30%" width="130%" height="160%"><feGaussianBlur stdDeviation="9" /></filter></defs>
    {relogio}{lugar}
    <Legenda t={t} />
    <text x={1880} y={1062} fontFamily={FONTE.fell} fontSize={22} fill={COR.lapis} textAnchor="end" opacity={0.75}>@Kriegsmomente</text>
  </Folha>;
};
