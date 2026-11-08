// Kit de TINTA do K18: o contrato comum a todas as cenas. Tudo e SVG numa <Folha> 1920x1080 por cima da cena e e funcao
// pura do tempo `t` (segundos do video, o mesmo `t` de CenaProps) e de `t0` (quando o gesto comeca, em segundos do video).
// Regra do canal: <= 3 elementos em tinta cheia por tela; o resto a lapis (COR.lapis), apagado pela cor.
//
// ===================================== API FINAL (06/11, frente tinta) =====================================
// Assinaturas originais INTACTAS (so props opcionais acrescentadas, marcadas com +):
//   COR, FONTE, prog(t,t0,dur), saida(t,ate), fmtDe(v,casas)
//   <Folha>                                   svg 1920x1080 por cima da cena
//   <Papel +textura?=true>                    papel ambientCG (Paper001 fibras + Paper003 amassado, CC0) + grao estatico, assado em public/papel
//   <Escrita t t0 texto x y tam cor ancora vel ate fonte rot peso  +pena?=1.2 +contorno?=true>
//        IM Fell Italic escrita TRACO A TRACO pelo tegaki 1.1.0 (pacote src/tinta/imfell_it, 107 glifos + espaco), pontas afinando
//        (taperPlugin), ritmo natural do tegaki escalado para durar texto.length/vel s; deterministica por t (o SMIL do tegaki e
//        avaliado aqui, sem animacao do navegador); ids de mascara prefixados por instancia (useId); a tinta e recortada pelo
//        contorno real das letras (clip com IMFeENit28P.ttf, a fonte-mae do pacote, sem kerning/ligadura: o layout do tegaki e por avanco).
//        `fonte` diferente de FONTE.fell (romana, Garamond) cai na revelacao por pena (mascara com borda macia).
//   <Guia t t0 de para dur cor ate  +larg?=1.7>       linha-guia a pena (perfect-freehand), nasce fina, termina em PONTO (gota de tinta)
//   <Traco t t0 pontos dur largura cor seta ate tracejado  +pressao?=true +grao?=true +semente?>
//        corpo de pena com pressao (perfect-freehand 1.2.3: ataque leve, barriga, alivio), ponta de seta a tinta com farpas
//        (ink-arrow do Remocn, MIT, adaptado), tracejado = tracos de pena separados; grao de tinta por feDisplacement (Remocn brush)
//   <Rotulo t t0 texto alvo em tam cor ate sub>      Escrita + Guia (o padrao de toda anotacao)
//   <Numero t t0 valor de dur casas unidade x y tam cor ancora ate  +sublinhado?=false>
//        conta em algarismos de epoca (IM Fell Roman), separador alemao; `sublinhado` passa um traco de pena embaixo no fim da conta
//   <Bloco x y frente lado larg alt nome perda o  +sombra?=true>
//        unidade Brockhaus 1866: retangulo cheio a tinta, filete claro interno; PERDA = hachura que esvazia o bloco pela retaguarda
// + Novos exports:
//   larguraTexto(texto, tam)    largura em px da Escrita (para diagramar)
//   duracaoEscrita(texto, vel)  quanto a Escrita leva para terminar (s)
//   penaPath(pontos, opc)       contorno (path d) de um traco de pena: para cenas que queiram desenhar a tinta sem animar
//   <GraoPapel opacidade?>      grao/fibra do papel em soft-light, por cima de cenas 3D (une o 3D ao papel)
//   hash01(s), FONTE.tegaki
// ==========================================================================================================
import React, {useId} from 'react';
import {AbsoluteFill, continueRender, delayRender, Img, staticFile} from 'remotion';
import {getStroke} from 'perfect-freehand';
import {taperPlugin, textToSvg} from 'tegaki/core';
import glyphData from './imfell_it/glyphData.json';

export const COR = {
  papel: '#e9e1d0', papel2: '#ddd2bb', tinta: '#2a2622', lapis: '#8a7f6c', sepia: '#6b5a44',
  preussen: '#24384f', oesterreich: '#9b2f2a', sachsen: '#4f6b3a', wasser: '#5d7f93',
  acento: '#c8641e', // o UNICO acento: a peca que trabalha / o numero-chave da frase
};
export const FONTE = {fell: '"IM Fell Italic", Georgia, serif', fellRom: '"IM Fell Roman", Georgia, serif', garamond: '"EB Garamond", Georgia, serif',
  tegaki: '"IM Fell Italic", Georgia, serif'};

let fontesOk: Promise<void> | null = null;
const carregaFontes = () => {
  if (fontesOk || typeof window === 'undefined') return fontesOk;
  const h = delayRender('fontes K18');
  const f = [new FontFace('IM Fell Italic', `url(${staticFile('fontes/IMFeENit28P.ttf')})`), new FontFace('IM Fell Roman', `url(${staticFile('fontes/IMFeENrm28P.ttf')})`),
    new FontFace('EB Garamond', `url(${staticFile('fontes/EBGaramond.ttf')})`)];
  fontesOk = Promise.all(f.map((x) => x.load().then((y) => { (document.fonts as any).add(y); }))).then(() => continueRender(h));
  return fontesOk;
};
carregaFontes();

// 0..1 entre t0 e t0+dur com saida suave (cubica)
export const prog = (t: number, t0: number, dur: number) => { const u = Math.min(1, Math.max(0, (t - t0) / Math.max(1e-6, dur))); return 1 - Math.pow(1 - u, 3); };
// some em 0.35 s depois de `ate` (undefined = nunca)
export const saida = (t: number, ate?: number) => (ate === undefined ? 1 : 1 - Math.min(1, Math.max(0, (t - ate) / 0.35)));
type P = [number, number];
const cl = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// hash deterministico (FNV-1a) -> [0,1)
export const hash01 = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000003) / 1000003; };
const idLimpo = (s: string) => 'k' + s.replace(/[^a-zA-Z0-9]/g, '');

export const Folha: React.FC<{children?: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, overflow: 'visible', ...style}}>{children}</svg>
);

// ------------------------------------------------------------------ papel
// Papel assado (ferramenta: D:/tmp/k18_tinta/papel.py): base creme x fibras ambientCG Paper001 x amassado Paper003 (CC0) x grao.
export const Papel: React.FC<{textura?: boolean}> = ({textura = true}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 80% at 50% 45%, ${COR.papel} 0%, ${COR.papel2} 100%)`}}>
    {textura && <Img src={staticFile('papel/papel_k18.jpg')} style={{width: 1920, height: 1080}} />}
  </AbsoluteFill>
);
// fibra do papel por cima de uma cena 3D (soft-light): o 3D passa a "estar no papel"
export const GraoPapel: React.FC<{opacidade?: number}> = ({opacidade = 0.55}) => (
  <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'soft-light', opacity: opacidade}}><Img src={staticFile('papel/grao_k18.jpg')} style={{width: 1920, height: 1080}} /></AbsoluteFill>
);

// ------------------------------------------------------------------ escrita (tegaki)
const UPM = 2048, ASC = 1854, DESC = -744, FS = 100;
const GLIFOS = glyphData as Record<string, {w: number}>;
const BUNDLE: any = {version: 1, family: 'K18 Fell Tegaki', lineCap: 'round', fontUrl: '', unitsPerEm: UPM, ascender: ASC, descender: DESC, glyphData: GLIFOS};
const TROCA: Record<string, string> = {'\u00a0': ' ', '\u2009': ' ', '\u202f': ' ', '→': '-', '←': '-', '−': '-', '≈': '~', '\t': ' '};
const limpa = (s: string) => [...s.normalize('NFC')].map((c) => (GLIFOS[c] ? c : TROCA[c] && GLIFOS[TROCA[c]] ? TROCA[c] : c === '\n' ? ' ' : GLIFOS[c] ? c : '·')).join('');
type Slot = {k: 'off'; v0: number; v1: number; b: number; d: number; ks: number[]} | {k: 'op'; b: number} | {k: 'id'};
type Molde = {w: number; h: number; padH: number; base: number; larg: number; durNat: number; partes: (string | Slot)[]};
const MOLDES = new Map<string, Molde>();
const ESC_PENA = 1.2;
const molde = (texto: string, pena = 1): Molde => {
  const chave = pena === 1 ? texto : `${pena}|${texto}`;
  let m = MOLDES.get(chave);
  if (m) return m;
  let svg = textToSvg(texto, BUNDLE, {fontSize: FS, mode: 'once', crop: false, color: 'currentColor', pressure: 1, plugins: [taperPlugin()], seed: Math.floor(hash01(texto) * 1000)});
  const vb = svg.match(/viewBox="([\d.\-]+) ([\d.\-]+) ([\d.]+) ([\d.]+)"/)!;
  const w = parseFloat(vb[3]), h = parseFloat(vb[4]);
  const larg = [...texto].reduce((a, c) => a + (GLIFOS[c]?.w ?? UPM / 2) / UPM * FS, 0);
  const lineH = (ASC - DESC) / UPM * FS, padV = (h - lineH) / 2, padH = (w - larg) / 2;
  svg = svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>'))
    .replace(/stroke-width="([\d.]+)"/g, (_, v) => `stroke-width="${(parseFloat(v) * ESC_PENA * pena).toFixed(2)}"`)
    .replace(/ r(x|y)?="([\d.]+)"/g, (_, a, v) => ` r${a ?? ''}="${(parseFloat(v) * ESC_PENA * pena).toFixed(2)}"`);
  const re = /stroke-dashoffset="[\d.]+"><animate [^>]*?values="([\d.\-]+);([\d.\-]+)"[^>]*?keySplines="([^"]+)" dur="([\d.]+)s" begin="([\d.]+)s"[^>]*?\/>|opacity="0"><set [^>]*?begin="([\d.]+)s"[^>]*?\/>|tk-/g;
  const partes: (string | Slot)[] = []; let ult = 0, durNat = 0, r: RegExpExecArray | null;
  while ((r = re.exec(svg))) {
    partes.push(svg.slice(ult, r.index)); ult = r.index + r[0].length;
    if (r[1] !== undefined) { const s: Slot = {k: 'off', v0: +r[1], v1: +r[2], ks: r[3].split(/\s+/).map(Number), d: +r[4], b: +r[5]}; durNat = Math.max(durNat, s.b + s.d); partes.push(s); }
    else if (r[6] !== undefined) { durNat = Math.max(durNat, +r[6]); partes.push({k: 'op', b: +r[6]}); }
    else partes.push({k: 'id'});
  }
  partes.push(svg.slice(ult));
  m = {w, h, padH, base: padV + ASC / UPM * FS, larg, durNat: Math.max(0.01, durNat), partes};
  MOLDES.set(chave, m);
  return m;
};
// curva cubic-bezier (x1,y1,x2,y2) avaliada em p (como o calcMode="spline" do SMIL)
const bez = (ks: number[], p: number) => {
  const [x1, y1, x2, y2] = ks; let lo = 0, hi = 1, s = p;
  for (let i = 0; i < 22; i++) { s = (lo + hi) / 2; const x = 3 * (1 - s) * (1 - s) * s * x1 + 3 * (1 - s) * s * s * x2 + s * s * s; if (x < p) lo = s; else hi = s; }
  return 3 * (1 - s) * (1 - s) * s * y1 + 3 * (1 - s) * s * s * y2 + s * s * s;
};
const quadro = (m: Molde, tn: number, pref: string) => {
  let out = '';
  for (const p of m.partes) {
    if (typeof p === 'string') { out += p; continue; }
    if (p.k === 'id') out += pref + '-';
    else if (p.k === 'op') out += `opacity="${tn >= p.b ? 1 : 0}">`;
    else { const q = cl((tn - p.b) / p.d), v = q <= 0 ? p.v0 : q >= 1 ? p.v1 : p.v0 + (p.v1 - p.v0) * bez(p.ks, q); out += `stroke-dashoffset="${v.toFixed(2)}">`; }
  }
  return out;
};
export const larguraTexto = (texto: string, tam = 44) => [...limpa(texto)].reduce((a, c) => a + (GLIFOS[c]?.w ?? UPM / 2) / UPM * tam, 0);
export const duracaoEscrita = (texto: string, vel = 16) => texto.length / Math.max(0.1, vel);

// Texto em serifa italica que SE ESCREVE (vel = caracteres/s)
export const Escrita: React.FC<{t: number; t0: number; texto: string; x: number; y: number; tam?: number; cor?: string; ancora?: 'start' | 'middle' | 'end';
  vel?: number; ate?: number; fonte?: string; rot?: number; peso?: number; pena?: number; contorno?: boolean}> =
  ({t, t0, texto, x, y, tam = 44, cor = COR.tinta, ancora = 'start', vel = 16, ate, fonte = FONTE.fell, rot = 0, peso = 400, pena = 1, contorno = true}) => {
  const pref = idLimpo(useId());
  const o = saida(t, ate);
  if (t < t0 || o <= 0 || !texto) return null;
  if (fonte !== FONTE.fell && fonte !== FONTE.tegaki) return <EscritaPena t={t} t0={t0} texto={texto} x={x} y={y} tam={tam} cor={cor} ancora={ancora} vel={vel} o={o} fonte={fonte} rot={rot} peso={peso} pref={pref} />;
  const largPena = Math.round(pena * (peso > 400 ? 1 + (peso - 400) / 1000 : 1) * 20) / 20;
  const tx = limpa(texto), m = molde(tx, largPena), k = tam / FS;
  const tn = (t - t0) * m.durNat / Math.max(0.05, duracaoEscrita(tx, vel));
  const fr = ancora === 'start' ? 0 : ancora === 'middle' ? 0.5 : 1;
  const x0 = x - (m.padH + m.larg * fr) * k, y0 = y - m.base * k;
  const corpo = quadro(m, tn, pref);
  return <g opacity={o} transform={rot ? `rotate(${rot} ${x} ${y})` : undefined} style={{color: cor}}>
    <g transform={`translate(${x0.toFixed(2)} ${y0.toFixed(2)}) scale(${k.toFixed(4)})`}>
      {contorno && <defs><clipPath id={`${pref}-letra`}><text x={m.padH} y={m.base} fontFamily="IM Fell Italic" fontSize={FS}
        style={{fontKerning: 'none', fontVariantLigatures: 'none', fontFeatureSettings: '"kern" 0, "liga" 0, "clig" 0, "calt" 0, "dlig" 0, "hist" 0, "swsh" 0, "salt" 0'}}>{tx}</text></clipPath></defs>}
      <g clipPath={contorno ? `url(#${pref}-letra)` : undefined} dangerouslySetInnerHTML={{__html: corpo}} />
    </g></g>;
};
// revelacao por pena para fontes sem pacote tegaki: mascara com borda macia que corre na linha de escrita
const EscritaPena: React.FC<{t: number; t0: number; texto: string; x: number; y: number; tam: number; cor: string; ancora: 'start' | 'middle' | 'end'; vel: number; o: number;
  fonte: string; rot: number; peso: number; pref: string}> = ({t, t0, texto, x, y, tam, cor, ancora, vel, o, fonte, rot, peso, pref}) => {
  const n = texto.length, u = cl((t - t0) * vel / Math.max(1, n));
  const w = n * tam * 0.5, x0 = ancora === 'start' ? x : ancora === 'middle' ? x - w / 2 : x - w, borda = tam * 0.9;
  return <g opacity={o} transform={rot ? `rotate(${rot} ${x} ${y})` : undefined}>
    <defs><linearGradient id={`${pref}-g`} x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#fff" /><stop offset={Math.max(0, 1 - borda / (w * u + borda))} stopColor="#fff" /><stop offset="1" stopColor="#000" /></linearGradient>
      <mask id={`${pref}-m`} maskUnits="userSpaceOnUse"><rect x={x0 - 10} y={y - tam * 1.3} width={(w + 20) * u + borda} height={tam * 1.8} fill={`url(#${pref}-g)`} /></mask></defs>
    <text x={x} y={y} fontFamily={fonte} fontSize={tam} fill={cor} textAnchor={ancora} fontWeight={peso} mask={`url(#${pref}-m)`}>{texto}</text></g>;
};

// ------------------------------------------------------------------ pena (perfect-freehand)
type Pt3 = [number, number, number];
const reamostra = (pts: P[], passo: number): {p: P[]; L: number} => {
  if (pts.length < 2) return {p: pts.slice(), L: 0};
  const out: P[] = [pts[0]]; let resto = 0, L = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]); L += d;
    let s = passo - resto;
    while (s <= d) { const k = s / d; out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]); s += passo; }
    resto = d - (s - passo);
  }
  const f = pts[pts.length - 1], g = out[out.length - 1];
  if (Math.hypot(f[0] - g[0], f[1] - g[1]) > passo * 0.25) out.push(f);
  return {p: out, L};
};
// contorno -> path (media quadratica, como o exemplo do perfect-freehand)
const contornoD = (c: number[][]) => {
  if (c.length < 3) return '';
  const r = (v: number) => v.toFixed(1);
  let d = `M${r(c[0][0])},${r(c[0][1])} Q`;
  for (let i = 0; i < c.length; i++) { const a = c[i], b = c[(i + 1) % c.length]; d += `${r(a[0])},${r(a[1])} ${r((a[0] + b[0]) / 2)},${r((a[1] + b[1]) / 2)} `; }
  return d + 'Z';
};
// pressao da pena ao longo do traco (0..1 do comprimento TOTAL: nao muda enquanto o traco cresce)
const pressao = (f: number, sem: number, i: number) => {
  const ataque = 0.38 + 0.62 * Math.min(1, f / 0.12), alivio = f > 0.82 ? 1 - (f - 0.82) * 1.4 : 1;
  return cl(ataque * alivio * (0.9 + 0.1 * Math.sin(f * 9 + sem * 6)) + (hash01(`${sem}:${i}`) - 0.5) * 0.06, 0.15, 1);
};
export type OpcPena = {largura?: number; ate?: number; inicio?: number; pressao?: boolean; afina?: boolean; afinaFim?: boolean; semente?: number};
// contorno de pena dos `pontos` entre os comprimentos `inicio`..`ate` (px). Pura e cacheada por chamada (barata).
export const penaPath = (pontos: P[], o: OpcPena = {}) => {
  const larg = o.largura ?? 6, sem = o.semente ?? hash01(JSON.stringify(pontos.slice(0, 3)) + pontos.length);
  const {p, L} = reamostra(pontos, Math.max(1.5, Math.min(6, larg * 0.6)));
  if (p.length < 2) return '';
  const passo = L / Math.max(1, p.length - 1), a = o.inicio ?? 0, z = o.ate ?? L;
  const sel: Pt3[] = [];
  p.forEach((q, i) => { const s = i * passo; if (s >= a - 1e-6 && s <= z + 1e-6) sel.push([q[0], q[1], o.pressao === false ? 0.75 : pressao(s / Math.max(1, L), sem, i)]); });
  if (z < L && sel.length) { const i = Math.min(p.length - 1, Math.floor(z / passo)), j = Math.min(p.length - 1, i + 1), k = cl(z / passo - i);
    sel.push([p[i][0] + (p[j][0] - p[i][0]) * k, p[i][1] + (p[j][1] - p[i][1]) * k, sel[sel.length - 1][2]]); }
  if (sel.length < 2) return '';
  const c = getStroke(sel, {size: larg, thinning: o.pressao === false ? 0.1 : 0.55, smoothing: 0.6, streamline: 0.25, simulatePressure: false, last: true,
    start: {taper: o.afina === false ? 0 : larg * 2.2, cap: true}, end: {taper: o.afinaFim === false ? 0 : larg * 2.8, cap: true}});
  return contornoD(c);
};
const GRAO_ID = 'k18-grao-tinta';
const GraoDef: React.FC<{escala: number}> = ({escala}) => (
  <filter id={`${GRAO_ID}-${Math.round(escala * 10)}`} x="-20%" y="-20%" width="140%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency={0.7} numOctaves={2} seed={18} result="g" />
    <feDisplacementMap in="SourceGraphic" in2="g" scale={escala} xChannelSelector="R" yChannelSelector="G" /></filter>
);
const grao = (larg: number) => Math.round(cl(larg * 0.35, 1, 4) * 10) / 10;

// Linha-guia fina que nasce no texto (`de`) e termina num PONTO sobre o objeto (`para`)
export const Guia: React.FC<{t: number; t0: number; de: P; para: P; dur?: number; cor?: string; ate?: number; larg?: number}> = ({t, t0, de, para, dur = 0.45, cor = COR.tinta, ate, larg = 1.7}) => {
  const u = prog(t, t0, dur), o = saida(t, ate);
  if (u <= 0 || o <= 0) return null;
  const L = Math.hypot(para[0] - de[0], para[1] - de[1]);
  const d = penaPath([de, para], {largura: larg * 1.6, ate: L * u, afinaFim: false, semente: 0.37});
  const pu = cl((u - 0.9) / 0.1), r = 5.2 * (0.6 + 0.4 * pu);
  return <g opacity={o}><path d={d} fill={cor} />
    {pu > 0 && <g transform={`translate(${para[0]} ${para[1]})`}><circle r={r} fill={cor} /><circle r={r * 0.45} cx={r * 0.55} cy={-r * 0.35} fill={cor} opacity={0.35} /></g>}</g>;
};

// Traco de tinta ao longo de `pontos` (px), crescendo de t0 a t0+dur; `seta` poe a ponta. Largura em px.
export const Traco: React.FC<{t: number; t0: number; pontos: P[]; dur?: number; largura?: number; cor?: string; seta?: boolean; ate?: number; tracejado?: boolean;
  pressao?: boolean; grao?: boolean; semente?: number}> =
  ({t, t0, pontos, dur = 1, largura = 6, cor = COR.tinta, seta = false, ate, tracejado = false, pressao: comPressao = true, grao: comGrao = true, semente}) => {
  const u = prog(t, t0, dur), o = saida(t, ate);
  if (u <= 0 || o <= 0 || pontos.length < 2) return null;
  const sem = semente ?? hash01(pontos.map((p) => p.join(',')).join(';'));
  const {p, L} = reamostra(pontos, 2);
  const z = L * u, ds: string[] = [];
  if (tracejado) {
    const on = largura * 2.4, off = largura * 2;
    for (let s = 0; s < z; s += on + off) ds.push(penaPath(pontos, {largura, inicio: s, ate: Math.min(z, s + on), pressao: comPressao, semente: sem}));
  } else ds.push(penaPath(pontos, {largura, ate: z, pressao: comPressao, semente: sem, afinaFim: !seta}));
  // ponta: farpas de pena no fim do que ja foi tracado (segue a ponta enquanto cresce)
  let cabeca: React.ReactNode = null;
  if (seta && u > 0.04) {
    const i = Math.min(p.length - 1, Math.round(z / Math.max(1e-6, L) * (p.length - 1))), j = Math.max(0, i - Math.max(2, Math.round(largura * 2.5 / 2)));
    const fim = p[i], ant = p[j], ang = Math.atan2(fim[1] - ant[1], fim[0] - ant[0]);
    const s = Math.max(largura * 3.4, 16) * cl(u / 0.15, 0.4, 1), ca = Math.cos(ang), sa = Math.sin(ang);
    const P2 = (fx: number, fy: number): P => [fim[0] + ca * fx - sa * fy, fim[1] + sa * fx + ca * fy];
    const tip = P2(s * 0.75, 0), l = P2(-s * 0.55, -s * 0.62), r = P2(-s * 0.55, s * 0.62), nl = P2(-s * 0.18, -largura * 0.35), nr = P2(-s * 0.18, largura * 0.35);
    const q = (a: P, c: P, b: P) => `Q${c[0].toFixed(1)},${c[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`;
    const d = `M${tip[0].toFixed(1)},${tip[1].toFixed(1)} ${q(tip, P2(-s * 0.05, -s * 0.22), l)} ${q(l, P2(-s * 0.3, -s * 0.28), nl)} L${nr[0].toFixed(1)},${nr[1].toFixed(1)} ${q(nr, P2(-s * 0.3, s * 0.28), r)} ${q(r, P2(-s * 0.05, s * 0.22), tip)} Z`;
    cabeca = <path d={d} fill={cor} />;
  }
  const esc = grao(largura);
  return <g opacity={o}>
    {comGrao && <defs><GraoDef escala={esc} /></defs>}
    <g filter={comGrao ? `url(#${GRAO_ID}-${Math.round(esc * 10)})` : undefined} fill={cor}>{ds.map((d, i) => <path key={i} d={d} />)}{cabeca}</g></g>;
};

// Rotulo = Escrita + Guia: o texto fica em `em` e a guia vai ate `alvo` (o objeto). O padrao de toda anotacao do canal.
export const Rotulo: React.FC<{t: number; t0: number; texto: string; alvo: P; em: P; tam?: number; cor?: string; ate?: number; sub?: string}> = ({t, t0, texto, alvo, em, tam = 40, cor = COR.tinta, ate, sub}) => {
  const esq = em[0] > alvo[0];
  return <g><Guia t={t} t0={t0} de={[em[0] + (esq ? -12 : 12), em[1] - tam * 0.3]} para={alvo} cor={cor} ate={ate} />
    <Escrita t={t} t0={t0 + 0.15} texto={texto} x={em[0]} y={em[1]} tam={tam} cor={cor} ancora={esq ? 'start' : 'end'} ate={ate} />
    {sub && <Escrita t={t} t0={t0 + 0.4} texto={sub} x={em[0]} y={em[1] + tam * 0.9} tam={tam * 0.62} cor={COR.sepia} ancora={esq ? 'start' : 'end'} ate={ate} />}</g>;
};

// Numero que conta de `de` ate `valor` em `dur` s, com separador alemao (1.500) e unidade em italico
export const fmtDe = (v: number, casas = 0) => v.toLocaleString('de-DE', {minimumFractionDigits: casas, maximumFractionDigits: casas});
export const Numero: React.FC<{t: number; t0: number; valor: number; de?: number; dur?: number; casas?: number; unidade?: string; x: number; y: number; tam?: number; cor?: string;
  ancora?: 'start' | 'middle' | 'end'; ate?: number; sublinhado?: boolean}> = ({t, t0, valor, de = 0, dur = 1.2, casas = 0, unidade, x, y, tam = 72, cor = COR.tinta, ancora = 'start', ate, sublinhado = false}) => {
  const u = prog(t, t0, dur), o = saida(t, ate) * cl((t - t0) / 0.2);
  if (o <= 0) return null;
  const txt = fmtDe(de + (valor - de) * u, casas), w = (txt.length * 0.52 + (unidade ? unidade.length * 0.24 + 0.15 : 0)) * tam;
  const xa = ancora === 'start' ? x : ancora === 'middle' ? x - w / 2 : x - w;
  // a tinta "assenta": o numero sai um pouco mais claro enquanto conta e escurece ao parar
  return <g opacity={o}>
    <text x={x} y={y} fontFamily={FONTE.fellRom} fontSize={tam} fill={cor} textAnchor={ancora} style={{fontVariantNumeric: 'oldstyle-nums'}} fillOpacity={0.82 + 0.18 * u}>{txt}
      {unidade && <tspan fontFamily={FONTE.fell} fontSize={tam * 0.5} dx={tam * 0.15}>{unidade}</tspan>}</text>
    {sublinhado && <Traco t={t} t0={t0 + dur * 0.85} dur={0.35} pontos={[[xa, y + tam * 0.16], [xa + w * 0.55, y + tam * 0.2], [xa + w, y + tam * 0.14]]} largura={Math.max(2.5, tam * 0.05)} cor={cor} />}</g>;
};

// Unidade no estilo Brockhaus 1866: bloco cheio pequeno virado para `frente` (graus, 0 = norte, horario), numero/nome em italico.
// `perda` 0..1: a retaguarda do bloco esvazia em hachura (o que sobrou fica cheio, na frente).
export const Bloco: React.FC<{x: number; y: number; frente?: number; lado: 'P' | 'O' | 'S'; larg?: number; alt?: number; nome?: string; perda?: number; o?: number; sombra?: boolean}> =
  ({x, y, frente = 0, lado, larg = 56, alt = 16, nome, perda = 0, o = 1, sombra = true}) => {
  const cor = lado === 'P' ? COR.preussen : lado === 'O' ? COR.oesterreich : COR.sachsen;
  const pid = idLimpo(useId());
  const pr = cl(perda), hc = alt * pr; // a frente (topo, -y) fica cheia; a retaguarda esvazia
  return <g opacity={o} transform={`translate(${x} ${y}) rotate(${frente})`}>
    {sombra && <rect x={-larg / 2 + 1.5} y={-alt / 2 + 2} width={larg} height={alt} fill={COR.tinta} opacity={0.18} />}
    <defs><clipPath id={`${pid}-c`}><rect x={-larg / 2} y={alt / 2 - hc} width={larg} height={hc} /></clipPath></defs>
    <rect x={-larg / 2} y={-alt / 2} width={larg} height={alt - hc} fill={cor} />
    {pr > 0 && <g clipPath={`url(#${pid}-c)`} stroke={cor} strokeWidth={1.3}>{Array.from({length: Math.ceil((larg + alt) / 4.5) + 1}, (_, i) => { const a = -larg / 2 - alt + i * 4.5; return <line key={i} x1={a} y1={alt / 2} x2={a + alt} y2={-alt / 2} />; })}</g>}
    <rect x={-larg / 2 + 2.2} y={-alt / 2 + 2.2} width={larg - 4.4} height={Math.max(0, alt - 4.4 - hc)} fill="none" stroke="#fff" strokeOpacity={0.28} strokeWidth={0.9} />
    <rect x={-larg / 2} y={-alt / 2} width={larg} height={alt} fill="none" stroke={COR.tinta} strokeWidth={1.3} />
    {nome && <text y={-alt / 2 - 6} fontFamily={FONTE.fell} fontSize={22} fill={cor} textAnchor="middle" transform={`rotate(${-frente} 0 ${-alt / 2 - 6})`}>{nome}</text>}</g>;
};
