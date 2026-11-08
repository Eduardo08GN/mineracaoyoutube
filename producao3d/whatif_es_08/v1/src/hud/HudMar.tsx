// HUD do video 08: o numero que manda (NIVEL DEL MAR), barra em escala log ate o Aconcagua, paises em pe, gente debaixo d'agua,
// comparacao dourada que troca girando, cartao do pais que cai, rotulos presos ao relevo e frase cinetica. Tudo funcao do quadro.
import React from 'react';
import {BRANCO, OURO, SANS, SERIF, SOMBRA, OdoNumero, cl, easeIn, easeOut, fmtMil} from './base';
import {CONTA, DADOS, Dados, curva, emPe} from '../dados';

export const ESCADA: {m: number; t: string}[] = [
  {m: 0, t: 'EL MAR EMPIEZA A SUBIR'},
  {m: 10, t: 'MÁS ALTO QUE UNA CASA DE TRES PISOS'},
  {m: 68, t: 'MÁS ALTO QUE EL OBELISCO DE BUENOS AIRES'},
  {m: 300, t: 'MÁS ALTO QUE LA GRAN TORRE SANTIAGO'},
  {m: 979, t: 'MÁS QUE LA CAÍDA DEL SALTO ÁNGEL'},
  {m: 2240, t: 'MÁS ALTO QUE LA CIUDAD DE MÉXICO'},
  {m: 2850, t: 'MÁS ALTO QUE QUITO'},
  {m: 3812, t: 'MÁS ALTO QUE EL LAGO TITICACA'},
  {m: 5100, t: 'MÁS ALTO QUE EL PUEBLO MÁS ALTO DEL MUNDO'},
  {m: 6961, t: 'MÁS ALTO QUE EL ACONCAGUA'},
];
const Rotulo: React.FC<{children: React.ReactNode; cor?: string}> = ({children, cor = 'rgba(247,245,240,0.78)'}) =>
  <div style={{fontFamily: SANS, fontWeight: 650, fontSize: 20, letterSpacing: '0.2em', color: cor, textTransform: 'uppercase', whiteSpace: 'nowrap'}}>{children}</div>;

// barra vertical? nao: horizontal em escala log (1 m .. 7.000 m) com marcas de referencia
const lg = (m: number) => Math.log10(1 + Math.max(0, m)) / Math.log10(7001);
const MARCAS = [{m: 70, t: 'TODO EL HIELO'}, {m: 1000, t: '1.000'}, {m: 4221, t: 'ÚLTIMO PAÍS'}];

export const Painel: React.FC<{L: number; Lant: number; tVideo: number; tTroca: (m: number) => number}> = ({L, Lant, tVideo, tTroca}) => {
  const d = DADOS as Dados;
  const ent = easeOut((tVideo - 0.05) / 0.5);
  const pe = emPe(d, L).length, tot = CONTA(d).length;
  const fr = curva(d.latam.pop, d.latam.niveis, L), abs = curva(d.latam.pessoas_abs, d.latam.niveis, L) / 1e6;
  const absAnt = curva(d.latam.pessoas_abs, d.latam.niveis, Lant) / 1e6;
  const W = 540, x = W * lg(L);
  return (
    <div style={{position: 'absolute', left: 84, top: 64, opacity: ent, transform: `translateY(${(1 - ent) * -14}px)`, textShadow: SOMBRA}}>
      <Rotulo>Nivel del mar</Rotulo>
      <div style={{display: 'flex', alignItems: 'flex-end', marginTop: 2}}>
        <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 96, color: BRANCO, marginRight: 6, lineHeight: 1}}>+</span>
        <OdoNumero V={L} Vant={Lant} digitos={4} px={112} />
        <span style={{fontFamily: SANS, fontWeight: 500, fontSize: 44, color: BRANCO, marginLeft: 10, marginBottom: 14}}>m</span>
      </div>
      <div style={{position: 'relative', width: W, height: 40, marginTop: 4}}>
        <div style={{position: 'absolute', left: 0, top: 9, width: W, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.22)'}} />
        <div style={{position: 'absolute', left: 0, top: 9, width: x, height: 6, borderRadius: 3, background: 'linear-gradient(90deg, #7fe3f0, #2b8fd6)', boxShadow: '0 0 12px #2b8fd688'}} />
        {MARCAS.map((k) => <div key={k.m} style={{position: 'absolute', left: W * lg(k.m), top: 3, width: 2, height: 18, background: L >= k.m ? OURO : 'rgba(255,255,255,0.7)'}}>
          <div style={{position: 'absolute', left: -60, width: 120, top: 20, textAlign: 'center', fontFamily: SANS, fontSize: 15, fontWeight: 700, letterSpacing: '0.1em', color: L >= k.m ? OURO : 'rgba(247,245,240,0.6)'}}>{k.t}</div>
        </div>)}
        <div style={{position: 'absolute', left: x - 7, top: 5, width: 14, height: 14, borderRadius: 7, background: '#bff4ff', boxShadow: '0 0 0 4px rgba(127,227,240,0.3)'}} />
      </div>
      <div style={{display: 'flex', gap: 54, marginTop: 30}}>
        <div>
          <Rotulo>Países en pie</Rotulo>
          <div style={{display: 'flex', alignItems: 'flex-end'}}>
            <OdoNumero V={pe} Vant={pe} digitos={2} px={60} milhar={false} cor={pe <= 1 ? OURO : BRANCO} />
            <span style={{fontFamily: SANS, fontWeight: 500, fontSize: 30, color: 'rgba(247,245,240,0.7)', marginLeft: 8, marginBottom: 8}}>/ {tot}</span>
          </div>
          <div style={{display: 'flex', gap: 5, marginTop: 6, width: 260, flexWrap: 'wrap'}}>
            {CONTA(d).sort((a, b) => d.paises[a].l99 - d.paises[b].l99).map((k) => {
              const caiu = d.paises[k].l99 <= L, ha = (L - d.paises[k].l99);
              return <div key={k} style={{width: 20, height: 20, borderRadius: 10, background: caiu ? 'rgba(255,255,255,0.12)' : '#F7F5F0', border: `1.5px solid ${caiu ? 'rgba(255,255,255,0.25)' : OURO}`,
                transform: `scale(${caiu && ha < 40 ? 1 + 0.4 * (1 - ha / 40) : 1})`}} />;
            })}
          </div>
        </div>
        <div>
          <Rotulo>Bajo el agua</Rotulo>
          <div style={{display: 'flex', alignItems: 'flex-end'}}>
            <OdoNumero V={abs} Vant={absAnt} digitos={3} px={60} milhar={false} />
            <span style={{fontFamily: SANS, fontWeight: 500, fontSize: 26, color: BRANCO, marginLeft: 8, marginBottom: 9}}>millones</span>
          </div>
          <div style={{fontFamily: SANS, fontSize: 19, fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(247,245,240,0.7)', marginTop: 2}}>{Math.round(fr * 100)} % DE LOS LATINOAMERICANOS</div>
        </div>
      </div>
      <Comparacao L={L} tTroca={tTroca} tVideo={tVideo} />
    </div>
  );
};

const Comparacao: React.FC<{L: number; tTroca: (m: number) => number; tVideo: number}> = ({L, tTroca, tVideo}) => {
  let k = 0; ESCADA.forEach((e, i) => { if (L >= e.m) k = i; });
  const dt = tVideo - tTroca(ESCADA[k].m), troca = k > 0 && dt >= 0 && dt < 0.6;
  const entra = troca ? easeOut((dt - 0.12) / 0.32) : 1, sai = troca ? easeIn(dt / 0.14) : 1;
  const pill = (txt: string, rot: number, op: number) => (
    <div style={{position: 'absolute', left: 0, top: 0, transform: `perspective(600px) rotateX(${rot}deg)`, opacity: op, display: 'inline-flex', alignItems: 'center', gap: 12,
      padding: '10px 18px 10px 14px', borderRadius: 999, background: 'linear-gradient(90deg, rgba(246,196,83,0.24), rgba(246,196,83,0.06))', border: `1.5px solid ${OURO}`, whiteSpace: 'nowrap'}}>
      <span style={{width: 10, height: 10, borderRadius: 5, background: OURO, boxShadow: `0 0 10px ${OURO}`}} />
      <span style={{fontFamily: SANS, fontWeight: 750, fontSize: 23, letterSpacing: '0.1em', color: OURO}}>{txt}</span>
    </div>);
  return (
    <div style={{position: 'relative', height: 54, marginTop: 24, width: 820}}>
      {troca && sai < 1 && pill(ESCADA[k - 1].t, -90 * sai, 1 - sai)}
      {pill(ESCADA[k].t, troca ? 90 * (1 - entra) : 0, troca ? entra : 1)}
    </div>);
};

// cartao do pais que cai (embaixo, centro): bandeira em circulo (cores), nome, nivel, posicao, onde resistem os ultimos
const CORES: Record<string, string[]> = {URY: ['#fff', '#0038a8'], CUB: ['#002a8f', '#fff', '#cf142b'], PRY: ['#d52b1e', '#fff', '#0038a8'], DOM: ['#002d62', '#fff', '#ce1126'],
  SLV: ['#0f47af', '#fff', '#0f47af'], NIC: ['#0067c6', '#fff', '#0067c6'], PAN: ['#fff', '#d21034', '#005293'], BRA: ['#009c3b', '#ffdf00', '#002776'], ARG: ['#74acdf', '#fff', '#74acdf'],
  HTI: ['#00209f', '#d21034'], VEN: ['#ffcc00', '#00247d', '#cf142b'], HND: ['#0073cf', '#fff', '#0073cf'], CRI: ['#002b7f', '#fff', '#ce1126', '#fff', '#002b7f'], CHL: ['#fff', '#d52b1e'],
  MEX: ['#006847', '#fff', '#ce1126'], COL: ['#fcd116', '#fcd116', '#003893', '#ce1126'], GTM: ['#4997d0', '#fff', '#4997d0'], ECU: ['#ffdd00', '#ffdd00', '#034ea2', '#ed1c24'],
  BOL: ['#d52b1e', '#f9e300', '#007934'], PER: ['#d91023', '#fff', '#d91023'], PRI: ['#ed0000', '#fff', '#ed0000']};
export const CartaoPais: React.FC<{k: string; idade: number; lugar: string; posicao: number}> = ({k, idade, lugar, posicao}) => {
  const d = DADOS as Dados, p = d.paises[k]; if (!p || idade < 0 || idade > 2.6) return null;
  const e = easeOut(idade / 0.35), s = 1 - easeIn((idade - 2.25) / 0.35);
  const cores = CORES[k] ?? ['#888'], ultimo = posicao === 1;
  return (
    <div style={{position: 'absolute', left: '50%', bottom: 96, transform: `translateX(-50%) translateY(${(1 - e) * 40}px) scale(${0.96 + 0.04 * e})`, opacity: e * s,
      display: 'flex', alignItems: 'center', gap: 22, padding: '18px 30px 18px 20px', borderRadius: 22, background: 'rgba(8,16,30,0.78)', border: `1.5px solid ${ultimo ? OURO : 'rgba(255,255,255,0.18)'}`,
      boxShadow: '0 18px 50px rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)'}}>
      <div style={{width: 74, height: 74, borderRadius: 37, overflow: 'hidden', display: 'flex', flexDirection: ['MEX', 'PER', 'GTM'].includes(k) ? 'row' : 'column', border: '3px solid rgba(255,255,255,0.85)'}}>
        {cores.map((c, i) => <div key={i} style={{flex: 1, background: c}} />)}
      </div>
      <div style={{textShadow: SOMBRA}}>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 14}}>
          <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 44, color: BRANCO}}>{p.nome}</span>
          <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 22, letterSpacing: '0.12em', color: ultimo ? OURO : '#ff6b5a'}}>{ultimo ? '★ ÚLTIMO EN PIE' : `CAE · #${posicao}`}</span>
        </div>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 23, color: 'rgba(247,245,240,0.85)', marginTop: 2}}>
          {ultimo ? `resiste hasta +${fmtMil(p.l99)} m` : `99 % de su gente bajo el agua a +${fmtMil(p.l99)} m`}
        </div>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 26, color: OURO, marginTop: 2}}>{lugar}</div>
      </div>
    </div>);
};

export const Lugar: React.FC<{texto: string; idade: number}> = ({texto, idade}) => {
  const e = easeOut((idade - 0.2) / 0.5);
  return <div style={{position: 'absolute', right: 84, top: 70, opacity: e, transform: `translateX(${(1 - e) * 20}px)`, textAlign: 'right', textShadow: SOMBRA}}>
    <div style={{fontFamily: SANS, fontWeight: 650, fontSize: 18, letterSpacing: '0.22em', color: 'rgba(247,245,240,0.7)'}}>DÓNDE ESTAMOS</div>
    <div style={{fontFamily: SANS, fontWeight: 750, fontSize: 34, letterSpacing: '0.06em', color: BRANCO}}>{texto}</div>
  </div>;
};

// rotulo preso: ponto no relevo + linha-guia que se desenha + etiqueta
export type Rot = {id: string; x: number; y: number; titulo: string; valor: string; afogado: boolean; idade: number; dx: number; dy: number};
export const Rotulos: React.FC<{lista: Rot[]}> = ({lista}) => (
  <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    {lista.map((r) => {
      const e = easeOut(r.idade / 0.6); if (e <= 0 || r.x < -50 || r.x > 1970 || r.y < -50 || r.y > 1130) return null;
      const ex = r.x + r.dx * e, ey = r.y + r.dy * e, cor = r.afogado ? '#7fe3f0' : BRANCO;
      return <g key={r.id} opacity={Math.min(1, r.idade / 0.25)}>
        <circle cx={r.x} cy={r.y} r={7} fill={cor} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
        {r.afogado && <circle cx={r.x} cy={r.y} r={7 + 18 * ((r.idade * 1.2) % 1)} fill="none" stroke={cor} strokeWidth={2} opacity={1 - ((r.idade * 1.2) % 1)} />}
        <line x1={r.x} y1={r.y} x2={ex} y2={ey} stroke={cor} strokeWidth={2.2} />
        <text x={ex + (r.dx >= 0 ? 10 : -10)} y={ey - 6} textAnchor={r.dx >= 0 ? 'start' : 'end'} style={{fontFamily: SANS, fontWeight: 750, fontSize: 24, letterSpacing: '0.1em', fill: BRANCO, paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.55)', strokeWidth: 5}}>{r.titulo}</text>
        <text x={ex + (r.dx >= 0 ? 10 : -10)} y={ey + 22} textAnchor={r.dx >= 0 ? 'start' : 'end'} style={{fontFamily: SANS, fontWeight: 650, fontSize: 21, fill: cor, paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.55)', strokeWidth: 5}}>{r.valor}</text>
      </g>;
    })}
  </svg>);

// frase cinetica palavra a palavra (heroi em dourado)
export const Frase: React.FC<{texto: string; idade: number; dur: number; heroi?: number[]}> = ({texto, idade, dur, heroi = []}) => {
  if (idade < 0 || idade > dur) return null;
  const pal = texto.split(' '), sai = easeIn((idade - (dur - 0.3)) / 0.3);
  return <div style={{position: 'absolute', left: 0, right: 0, bottom: 300, textAlign: 'center', opacity: 1 - sai}}>
    {pal.map((w, i) => {
      const e = easeOut((idade - 0.06 * i) / 0.35);
      return <span key={i} style={{display: 'inline-block', margin: '0 0.18em', fontFamily: SERIF, fontStyle: 'italic', fontSize: 58, color: heroi.includes(i) ? OURO : BRANCO,
        opacity: e, transform: `translateY(${(1 - e) * 24}px)`, filter: `blur(${(1 - e) * 6}px)`, textShadow: SOMBRA}}>{w}</span>;
    })}
  </div>;
};
export {cl};
