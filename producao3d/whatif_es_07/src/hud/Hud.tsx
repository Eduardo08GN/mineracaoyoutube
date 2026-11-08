// HUD do novo formato What If ES: tudo funcao do quadro (sem relogio do navegador, sem estado).
// - Odometro: digitos que ROLAM em base mista (minutos 0-59, horas), desfoque de movimento pela velocidade do valor.
//   Mecanica de coluna adaptada do `rolling-number` do Remocn (MIT, github.com/Remocn/remocn, commit fd2d301).
// - Painel: o numero que manda (UN DIA DURA), barra de dado ate a ingravidez, 2 grandezas derivadas, comparacao dourada que troca
//   com giro (flip swap, vocabulario do `kinetic-typography`, MIT), lugar no canto.
// - Rotulos presos a objetos 3D: a mesma camera do quadro projeta a ancora (ponto + linha-guia que se desenha + etiqueta).
// - Frase cinetica: palavra a palavra (sobe da mascara com desfoque, heroi em dourado), saida rapida.
// Fontes OFL em public/fontes: Inter Tight (digitos tabulares) e Instrument Serif Italic.
import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, continueRender, delayRender, staticFile} from 'remotion';
import {COMPARACOES, DIA_HOJE_H, DIA_INGRAVIDEZ_MIN, comparacaoIdx, diaH, fmtDec, fmtMil, pDaVelocidade, pesoKg, velChaoKmh, smooth} from '../fisica';
import {DURACAO, FPS, FRASES, Plano} from '../roteiro';

// ---------------------------------------------------------------- fontes (carregadas antes do primeiro quadro)
const FONTES: [string, string, FontFaceDescriptors?][] = [
  ['HudSans', 'fontes/InterTight-Var.ttf', {weight: '100 900'}],
  ['HudSerif', 'fontes/InstrumentSerif-Italic.ttf', {style: 'italic'}],
];
let fontesProntas = false;
if (typeof document !== 'undefined') {
  const h = delayRender('fontes do HUD');
  Promise.all(FONTES.map(([n, a, d]) => new FontFace(n, `url(${staticFile(a)})`, d).load().then((f) => { (document.fonts as any).add(f); })))
    .then(() => { fontesProntas = true; continueRender(h); }, () => { fontesProntas = true; continueRender(h); });
}
export const fontesOk = () => fontesProntas;

const SANS = 'HudSans, "Inter Tight", Arial, sans-serif', SERIF = 'HudSerif, Georgia, serif';
const OURO = '#F6C453', BRANCO = '#F7F5F0';
const SOMBRA = '0 2px 14px rgba(0,0,0,0.55), 0 0 2px rgba(0,0,0,0.6)';
const cl = (a: number, b: number, x: number) => Math.min(b, Math.max(a, x));
const easeOut = (x: number) => 1 - Math.pow(1 - cl(0, 1, x), 3);
const easeIn = (x: number) => Math.pow(cl(0, 1, x), 2);

// ---------------------------------------------------------------- odometro em base mista
// radices do digito menos significativo para o mais: minutos+horas = [10, 6, 10, 10]; numero comum = [10, 10, 10, ...]
// posicao continua do digito i: floor(V / W_i) + carry, onde o carry so anda no ultimo "1" antes da virada dos digitos de baixo
const posDigito = (V0: number, rad: number[], i: number) => {
  // o digito fica parado e so rola no ultimo quarto de cada unidade (le-se o numero em qualquer quadro; o giro continua visivel)
  const V = Math.floor(V0) + smooth(0.75, 1, V0 - Math.floor(V0));
  if (i === 0) return V;
  let W = 1; for (let k = 0; k < i; k++) W *= rad[k];
  const base = Math.floor(V / W), resto = V - base * W;
  return base + cl(0, 1, resto - (W - 1));
};
const Coluna: React.FC<{pos: number; radix: number; px: number; vel: number; larg: number; opac?: number}> = ({pos, radix, px, vel, larg, opac = 1}) => {
  const h = px * 1.04, av = Math.abs(vel);
  // digito lento: rola continuo. Digito rapido (> 0,35 digito por quadro): a meio caminho ele vira borrao ilegivel,
  // entao encaixa no inteiro e ganha um rastro vertical curto no sentido do giro (desfoque de movimento legivel)
  const rapido = av > 0.35;
  const val0 = ((pos % radix) + radix) % radix, val = rapido ? Math.round(val0) % radix : val0;
  const rastro = rapido ? Math.min(1, (av - 0.35) / 1.5) : 0, sinal = vel >= 0 ? 1 : -1;
  const col = (dy: number, a: number) => (
    <span style={{position: 'absolute', left: 0, top: 0, display: 'flex', flexDirection: 'column', transform: `translateY(${-val * h + dy}px)`, opacity: a}}>
      {Array.from({length: radix + 1}, (_, d) => <span key={d} style={{height: h, lineHeight: `${h}px`, textAlign: 'center', width: larg * px}}>{d % radix}</span>)}
    </span>
  );
  return (
    <span style={{position: 'relative', display: 'inline-block', overflow: 'hidden', height: h, width: larg * px, verticalAlign: 'top', opacity: opac,
      maskImage: 'linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)'}}>
      {rastro > 0 && col(sinal * h * 0.12 * (0.5 + rastro), 0.18 * rastro)}
      {rastro > 0 && col(sinal * h * 0.06 * (0.5 + rastro), 0.3 * rastro)}
      {col(0, 1)}
    </span>
  );
};
// odometro de um inteiro com separador de milhar es-ES
const OdoNumero: React.FC<{V: number; Vant: number; digitos: number; px: number; cor?: string; milhar?: boolean}> = ({V, Vant, digitos, px, cor = BRANCO, milhar = true}) => {
  const rad = Array(digitos).fill(10);
  const cels: React.ReactNode[] = [];
  const maxV = Math.max(V, 1);
  for (let i = digitos - 1; i >= 0; i--) {
    const vis = i === 0 ? 1 : smooth(Math.pow(10, i) * 0.92, Math.pow(10, i), maxV);   // zeros a esquerda somem
    if (vis <= 0.01) continue;
    cels.push(<Coluna key={i} pos={posDigito(V, rad, i)} radix={10} px={px} vel={posDigito(V, rad, i) - posDigito(Vant, rad, i)} larg={0.6 * vis} opac={vis} />);
    if (milhar && i % 3 === 0 && i > 0) cels.push(<span key={'s' + i} style={{display: 'inline-block', width: 0.24 * px, textAlign: 'center'}}>.</span>);
  }
  return <span style={{fontFamily: SANS, fontWeight: 700, fontSize: px, color: cor, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', lineHeight: 1.04, display: 'inline-flex'}}>{cels}</span>;
};
// odometro de duracao: "23 h 59 min" com minutos em base 60
const OdoDuracao: React.FC<{M: number; Mant: number; px: number}> = ({M, Mant, px}) => {
  const rad = [10, 6, 10, 10];
  const d = (i: number, larg = 0.6, opac = 1) => <Coluna pos={posDigito(M, rad, i)} radix={rad[i]} px={px} vel={posDigito(M, rad, i) - posDigito(Mant, rad, i)} larg={larg} opac={opac} />;
  const horas = M / 60, temDezena = smooth(9.6, 10.0, horas);
  const un = (t: string) => <span style={{fontSize: px * 0.42, fontWeight: 500, opacity: 0.85, margin: `0 ${px * 0.12}px 0 ${px * 0.06}px`, alignSelf: 'flex-end', lineHeight: `${px * 0.95}px`}}>{t}</span>;
  return (
    <span style={{fontFamily: SANS, fontWeight: 700, fontSize: px, color: BRANCO, display: 'inline-flex', alignItems: 'flex-start', letterSpacing: '-0.02em', whiteSpace: 'nowrap'}}>
      {temDezena > 0.01 && d(3, 0.6 * temDezena, temDezena)}{d(2)}{un('h')}{d(1)}{d(0)}{un('min')}
    </span>
  );
};

// ---------------------------------------------------------------- painel
const Rotulo: React.FC<{children: React.ReactNode; cor?: string}> = ({children, cor = 'rgba(247,245,240,0.78)'}) =>
  <div style={{fontFamily: SANS, fontWeight: 650, fontSize: 21, letterSpacing: '0.2em', color: cor, textTransform: 'uppercase'}}>{children}</div>;

export const Painel: React.FC<{p: number; pAnt: number; tVideo: number}> = ({p, pAnt, tVideo}) => {
  const M = diaH(p) * 60, Mant = diaH(pAnt) * 60;
  const ent = easeOut((tVideo - 0.05) / 0.5);
  // barra: quanto falta (em escala log) entre o dia de hoje e o dia em que nada pesa
  const lnA = Math.log(DIA_HOJE_H * 60), lnB = Math.log(DIA_INGRAVIDEZ_MIN), fr = cl(0, 1, (lnA - Math.log(M)) / (lnA - lnB));
  const kg = pesoKg(p), kgAnt = pesoKg(pAnt), v = velChaoKmh(p), vAnt = velChaoKmh(pAnt);
  return (
    <div style={{position: 'absolute', left: 84, top: 70, opacity: ent, transform: `translateY(${(1 - ent) * -14}px)`, textShadow: SOMBRA}}>
      <Rotulo>Un día dura</Rotulo>
      <div style={{marginTop: 4}}><OdoDuracao M={M} Mant={Mant} px={118} /></div>
      {/* barra de dado: do dia de hoje ate a ingravidez */}
      <div style={{position: 'relative', width: 520, height: 34, marginTop: 6}}>
        <div style={{position: 'absolute', left: 0, top: 9, width: 520, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.22)'}} />
        <div style={{position: 'absolute', left: 0, top: 9, width: 520 * fr, height: 6, borderRadius: 3, background: `linear-gradient(90deg, ${BRANCO}, ${OURO})`, boxShadow: `0 0 12px ${OURO}88`}} />
        <div style={{position: 'absolute', left: 520 * fr - 7, top: 5, width: 14, height: 14, borderRadius: 7, background: OURO, boxShadow: `0 0 0 4px rgba(246,196,83,0.25)`}} />
        <div style={{position: 'absolute', left: 517, top: 2, width: 2, height: 20, background: 'rgba(255,255,255,0.8)'}} />
        <div style={{position: 'absolute', left: 0, top: 22, fontFamily: SANS, fontSize: 19, fontWeight: 650, letterSpacing: '0.12em', color: 'rgba(247,245,240,0.6)'}}>HOY · 24 h</div>
        <div style={{position: 'absolute', right: 0, top: 22, fontFamily: SANS, fontSize: 19, fontWeight: 650, letterSpacing: '0.12em', color: 'rgba(247,245,240,0.6)', textAlign: 'right', whiteSpace: 'nowrap'}}>NADA PESA · 1 h 24 min</div>
      </div>
      <div style={{display: 'flex', gap: 56, marginTop: 26}}>
        <div>
          <Rotulo>Pesas</Rotulo>
          <div style={{display: 'flex', alignItems: 'flex-end'}}><OdoNumero V={kg} Vant={kgAnt} digitos={2} px={58} milhar={false} /><span style={{fontFamily: SANS, fontWeight: 500, fontSize: 28, color: BRANCO, marginLeft: 8, marginBottom: 8}}>kg</span></div>
        </div>
        <div>
          <Rotulo>El suelo se mueve a</Rotulo>
          <div style={{display: 'flex', alignItems: 'flex-end'}}><OdoNumero V={v} Vant={vAnt} digitos={5} px={58} /><span style={{fontFamily: SANS, fontWeight: 500, fontSize: 28, color: BRANCO, marginLeft: 8, marginBottom: 8}}>km/h</span></div>
        </div>
      </div>
      <Comparacao p={p} />
    </div>
  );
};

// comparacao dourada: troca com giro no instante em que a velocidade cruza o limiar
const Comparacao: React.FC<{p: number}> = ({p}) => {
  const k = comparacaoIdx(p);
  const pK = pDaVelocidade(COMPARACOES[k].kmh);
  const dt = (p - pK) * DURACAO;   // segundos desde a troca
  const troca = k > 0 && dt < 0.6;
  const entra = troca ? easeOut((dt - 0.12) / 0.32) : 1, sai = troca ? easeIn(dt / 0.14) : 1;
  const pill = (txt: string, rot: number, op: number) => (
    <div style={{position: 'absolute', left: 0, top: 0, transform: `perspective(600px) rotateX(${rot}deg)`, transformOrigin: '50% 50%', opacity: op,
      display: 'inline-flex', alignItems: 'center', gap: 12, padding: '10px 18px 10px 14px', borderRadius: 999,
      background: 'linear-gradient(90deg, rgba(246,196,83,0.22), rgba(246,196,83,0.06))', border: `1.5px solid ${OURO}`, whiteSpace: 'nowrap'}}>
      <span style={{width: 10, height: 10, borderRadius: 5, background: OURO, boxShadow: `0 0 10px ${OURO}`}} />
      <span style={{fontFamily: SANS, fontWeight: 750, fontSize: 25, letterSpacing: '0.1em', color: OURO}}>{txt}</span>
    </div>
  );
  // brilho que varre a pilula na troca
  const brilho = troca ? cl(0, 1, (dt - 0.15) / 0.45) : -1;
  return (
    <div style={{position: 'relative', height: 56, marginTop: 22, width: 760}}>
      {troca && sai < 1 && pill(COMPARACOES[k - 1].texto, -90 * sai, 1 - sai)}
      {pill(COMPARACOES[k].texto, troca ? 90 * (1 - entra) : 0, troca ? entra : 1)}
      {brilho >= 0 && brilho < 1 && <div style={{position: 'absolute', left: -40 + 720 * brilho, top: -4, width: 60, height: 60, background: 'radial-gradient(closest-side, rgba(255,240,200,0.9), rgba(255,240,200,0))', mixBlendMode: 'screen'}} />}
    </div>
  );
};

// lugar no canto
export const Lugar: React.FC<{tVideo: number}> = ({tVideo}) => {
  const e = easeOut((tVideo - 0.25) / 0.5);
  return (
    <div style={{position: 'absolute', right: 84, top: 78, textAlign: 'right', opacity: e, transform: `translateX(${(1 - e) * 20}px)`, textShadow: SOMBRA}}>
      <div style={{fontFamily: SANS, fontWeight: 750, fontSize: 30, letterSpacing: '0.16em', color: BRANCO}}>SALINAS, ECUADOR</div>
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 19, letterSpacing: '0.2em', color: 'rgba(247,245,240,0.7)', marginTop: 6}}>MALECÓN · LATITUD 2° S</div>
    </div>
  );
};

// ---------------------------------------------------------------- rotulos presos aos objetos (projecao da camera do quadro)
export type Ancora = {id: string; pos: [number, number, number]; titulo: string; valor: string; dx: number; dy: number; ini: number};
const _cam = new THREE.PerspectiveCamera(50, 16 / 9, 0.2, 6000);
export const projetar = (plano: Plano, u: number, w: [number, number, number], W = 1920, H = 1080) => {
  const c = plano.cam(u);
  _cam.fov = c.fov; _cam.aspect = W / H; _cam.position.set(...c.pos); _cam.lookAt(...c.alvo); _cam.updateProjectionMatrix(); _cam.updateMatrixWorld();
  const v = new THREE.Vector3(...w).project(_cam);
  return {x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, frente: v.z < 1 && v.z > -1};
};
// zonas reservadas (painel no alto a esquerda, lugar no alto a direita, frase embaixo): a etiqueta troca de lado em vez de cobrir o HUD
const ZONAS = [[0, 0, 820, 470], [1380, 0, 1920, 170], [160, 900, 1760, 1080]];
const LARG_ETIQ = 330, ALT_ETIQ = 80;
const bate = (x: number, y: number, dx: number) => { const x0 = dx >= 0 ? x + 34 : x - 34 - LARG_ETIQ, x1 = x0 + LARG_ETIQ, y0 = y - ALT_ETIQ / 2, y1 = y + ALT_ETIQ / 2;
  return ZONAS.some(([a, b, c, d]) => x0 < c && x1 > a && y0 < d && y1 > b) || x0 < 20 || x1 > 1900 || y0 < 20 || y1 > 1060; };
const desvio = (s: {x: number; y: number}, a: Ancora) => {
  const cands: [number, number][] = [[a.dx, a.dy], [-a.dx, a.dy], [a.dx, -a.dy], [-a.dx, -a.dy], [a.dx * 1.6, a.dy * 0.4], [-a.dx * 1.6, a.dy * 0.4]];
  for (const [dx, dy] of cands) if (!bate(s.x + dx, s.y + dy, dx)) return {dx, dy};
  return {dx: a.dx, dy: a.dy};
};
export const RotulosPresos: React.FC<{plano: Plano; u: number; tPlano: number; lista: Ancora[]}> = ({plano, u, tPlano, lista}) => (
  <AbsoluteFill>
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {lista.map((a) => {
        const s = projetar(plano, u, a.pos);
        const e = easeOut((tPlano - a.ini) / 0.45);
        if (!s.frente || e <= 0 || s.x < -50 || s.x > 1970 || s.y < -50 || s.y > 1130) return null;
        const {dx, dy} = desvio(s, a); const lx = s.x + dx * e, ly = s.y + dy * e;
        return (
          <g key={a.id} opacity={Math.min(1, e * 1.4)}>
            <circle cx={s.x} cy={s.y} r={6} fill={OURO} />
            <circle cx={s.x} cy={s.y} r={6 + 10 * (1 - e) + 4} fill="none" stroke={OURO} strokeOpacity={0.55 * (1 - e * 0.5)} strokeWidth={2} />
            <line x1={s.x} y1={s.y} x2={lx} y2={ly} stroke={BRANCO} strokeWidth={2.5} strokeOpacity={0.9} />
            <line x1={lx} y1={ly} x2={lx + (dx >= 0 ? 26 : -26) * e} y2={ly} stroke={BRANCO} strokeWidth={2.5} strokeOpacity={0.9} />
          </g>
        );
      })}
    </svg>
    {lista.map((a) => {
      const s = projetar(plano, u, a.pos);
      const e = easeOut((tPlano - a.ini - 0.12) / 0.4);
      if (!s.frente || e <= 0 || s.x < -50 || s.x > 1970 || s.y < -50 || s.y > 1130) return null;
      const {dx, dy} = desvio(s, a);
      const lx = s.x + dx + (dx >= 0 ? 34 : -34), ly = s.y + dy;
      return (
        <div key={a.id} style={{position: 'absolute', left: lx, top: ly, transform: `translate(${dx >= 0 ? 0 : -100}%, -50%) translateY(${(1 - e) * 10}px)`, opacity: e,
          padding: '9px 16px 10px', borderRadius: 14, background: 'rgba(12,16,24,0.58)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.18)', whiteSpace: 'nowrap'}}>
          <div style={{fontFamily: SANS, fontWeight: 650, fontSize: 17, letterSpacing: '0.18em', color: 'rgba(247,245,240,0.75)'}}>{a.titulo}</div>
          <div style={{fontFamily: SANS, fontWeight: 750, fontSize: 34, color: BRANCO, fontVariantNumeric: 'tabular-nums', marginTop: 1}}>{a.valor}</div>
        </div>
      );
    })}
  </AbsoluteFill>
);

// ---------------------------------------------------------------- frase cinetica (palavra a palavra)
export const FraseCinetica: React.FC<{tVideo: number}> = ({tVideo}) => {
  const f = FRASES.find((x) => tVideo >= x.ini && tVideo < x.fim);
  if (!f) return null;
  const pal = f.texto.split(' ');
  const tl = tVideo - f.ini, saida = easeIn((tVideo - (f.fim - 0.2)) / 0.2);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 92, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0 0.26em', padding: '0 180px',
      fontFamily: SERIF, fontStyle: 'italic', fontSize: 66, lineHeight: 1.15, color: BRANCO, textShadow: '0 3px 22px rgba(0,0,0,0.6), 0 0 3px rgba(0,0,0,0.5)',
      opacity: 1 - saida, transform: `translateY(${-saida * 18}px)`}}>
      {pal.map((w, i) => {
        const e = easeOut((tl - i * 0.075) / 0.3);
        const heroi = f.heroi?.includes(i);
        return (
          <span key={i} style={{display: 'inline-block', overflow: 'hidden', paddingBottom: 6}}>
            <span style={{display: 'inline-block', transform: `translateY(${(1 - e) * 60}%) scale(${heroi ? 1 + 0.08 * (1 - e) : 1})`, opacity: e, filter: `blur(${(1 - e) * 6}px)`,
              color: heroi ? OURO : BRANCO}}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};

// vinheta de leitura (canto do painel e base da frase), discreta
export const Leitura: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 900px 520px at 0% 0%, rgba(4,8,14,0.5), rgba(4,8,14,0) 70%), linear-gradient(to top, rgba(4,8,14,0.45), rgba(4,8,14,0) 26%)'}} />
);
export {fmtDec, fmtMil, FPS};
