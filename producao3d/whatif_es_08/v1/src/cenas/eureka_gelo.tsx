// EUREKA 1 (cap. 04_hielo, b17-b19): a huella gravitacional del hielo (Mitrovica, Gomez & Clark, Science 2009).
// O gelo da Antartida ATRAI o oceano (morro de agua junto dele); ao derreter, solta: perto dele o mar BAIXA e a agua vai
// para longe, onde sobe MAIS que a media (costas da America Latina). Globo com a fatia de oceano cortada (perfil da agua),
// linhas de campo/fluxo, gelo encolhendo, tres medidores vivos. Funcao pura de t: camera gira o tempo todo.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {CenaProps} from './tipos';
import {BRANCO, OURO, SANS, SOMBRA, cl, easeOut} from '../hud/base';
import {Cam, CamSync, Escala, Etiquetas, Etq, projetor, sm, lerp, useEspera} from './eureka/comum';
import {Globo, MEDIA, R0, TERRA_R, carregaGelo, estadoGelo, geo, hMar, limbo, texGelo} from './eureka/globo';

const T0 = 107.13, T1 = 133.17;
const camEm = (t: number): Cam => {
  const u = cl(0, 1, (t - T0) / (T1 - T0)), e = u * u * (3 - 2 * u) * 0.5 + u * 0.5;
  const lon = lerp(-104, -44, e), lat = lerp(-38, -20, e), dist = lerp(6.1, 4.7, e);   // 05/11: -76..-58 dava 0,2 de movimento (quase parado)
  const p = geo(lon, lat, dist);
  return {pos: p, alvo: [0, -0.16, 0], fov: 30, desloc: 0.12, near: 0.05, far: 200};
};
// sol fixo no mundo, vindo do alto a esquerda da camera do meio do take
const SOL: [number, number, number] = (() => {
  const cd = new THREE.Vector3(...camEm((T0 + T1) / 2).pos).normalize(), dir = new THREE.Vector3().crossVectors(cd.clone().negate(), new THREE.Vector3(0, 1, 0)).normalize();
  return cd.multiplyScalar(0.8).add(new THREE.Vector3(0, 0.55, 0)).addScaledVector(dir, -0.5).normalize().toArray() as [number, number, number];
})();

// medidores: variacao do nivel do mar (relativa ao inicio do degelo), em unidades da media global (media = 1)
const Medidores: React.FC<{t: number}> = ({t}) => {
  const e = estadoGelo(t), ent = easeOut((t - 121.2) / 0.7);
  if (ent <= 0) return null;
  const media = MEDIA * e.R;
  const d = (lat: number) => hMar(lat, e) - hMar(lat, {B: 1, S: 0, R: 0});
  const itens = [
    {nome: 'Junto al hielo', v: d(-72) / MEDIA, cor: '#7fe3f0'},
    {nome: 'Promedio mundial', v: media / MEDIA, cor: 'rgba(247,245,240,0.85)'},
    {nome: 'Nuestras costas', v: d(-25) / MEDIA, cor: OURO},
  ];
  const Hb = 110, esc = 70;                                    // px por "1 media"
  return (
    <div style={{position: 'absolute', left: 84, top: 520, opacity: ent, transform: `translateY(${(1 - ent) * 16}px)`, textShadow: SOMBRA}}>
      <div style={{fontFamily: SANS, fontWeight: 650, fontSize: 19, letterSpacing: '0.2em', color: 'rgba(247,245,240,0.78)'}}>CUÁNTO CAMBIA EL MAR</div>
      <div style={{position: 'relative', width: 470, height: 2 * Hb + 70, marginTop: 10}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: Hb, height: 2, background: 'rgba(247,245,240,0.45)'}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: Hb - esc * (media / MEDIA), height: 0, borderTop: `2px dashed ${OURO}`, opacity: sm(125.5, 127.5, t)}} />
        {itens.map((it, i) => {
          const v = Math.max(-1.55, Math.min(1.55, it.v)), h = Math.abs(v) * esc, x = 22 + i * 150;
          const cima = v >= 0;
          return <div key={i}>
            <div style={{position: 'absolute', left: x, width: 70, top: cima ? Hb - h : Hb, height: h, borderRadius: cima ? '8px 8px 2px 2px' : '2px 2px 8px 8px',
              background: cima ? `linear-gradient(0deg, ${it.cor}55, ${it.cor})` : 'linear-gradient(180deg, #7fe3f055, #2b8fd6)', boxShadow: `0 0 18px ${cima ? it.cor : '#2b8fd6'}55`}} />
            <div style={{position: 'absolute', left: x - 30, width: 130, top: 2 * Hb + 8, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 16, letterSpacing: '0.1em', color: it.cor, textTransform: 'uppercase', lineHeight: 1.15}}>{it.nome}</div>
            <div style={{position: 'absolute', left: x - 20, width: 110, top: cima ? Hb - h - 34 : Hb + h + 4, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 24, color: it.cor, opacity: Math.min(1, Math.abs(it.v) * 3)}}>
              {Math.abs(it.v) < 0.03 ? '' : cima ? '▲' : '▼'}
            </div>
          </div>;
        })}
      </div>
    </div>
  );
};

export const Cena: React.FC<CenaProps> = ({t}) => {
  const ok = useEspera('eureka gelo texturas', carregaGelo, () => !!texGelo());
  const c = camEm(t), pr = projetor(c), e = estadoGelo(t);
  const camV = new THREE.Vector3(...c.pos);
  // ponto visivel? (lado do globo voltado para a camera)
  const vis = (p: [number, number, number]) => { const v = new THREE.Vector3(...p); return v.clone().normalize().dot(camV.clone().sub(v).normalize()) > 0.08; };
  const ponto = (lon: number, lat: number, r: number) => { const p = geo(lon, lat, r), s = pr(p); return {...s, ok: s.ok && vis(p)}; };
  let lista: Etq[] = [];
  if (ok) {
    const borda = (th: number, r: (la: number) => number) => { const q = limbo(c.pos, r, th, th, 1)[0]; return pr(q.p); };
    const rAg = (la: number) => R0 + hMar(la, e);
    lista = [
      {id: 'ant', ...ponto(-60, -84, TERRA_R + 0.14 * Math.pow(e.gelo, 0.55)), titulo: 'ANTÁRTIDA', valor: t < 121 ? 'el hielo más pesado del mundo' : 'el hielo se derrite', idade: t - 108.0, dx: 150, dy: 40, cor: BRANCO},
      {id: 'atrai', ...borda(232, rAg), titulo: 'SU GRAVEDAD ATRAE EL MAR', valor: 'el agua se amontona junto al hielo', idade: t - 116.5, dx: -170, dy: -60, cor: '#bff4ff', sai: t - 121.6},
      {id: 'baja', ...borda(244, rAg), titulo: 'EL MAR BAJA', valor: 'cerca de la Antártida', idade: t - (t < 116.23 ? 114.6 : 123.0), dx: -190, dy: 30, cor: '#7fe3f0', seta: 'baixo', grande: true,
        sai: t < 116.23 ? t - 115.9 : undefined},
      {id: 'prom', ...borda(203, () => R0 + MEDIA * e.R), titulo: 'PROMEDIO', idade: t - 126.2, dx: -36, dy: 70, cor: OURO},
      {id: 'sube', ...ponto(-77.3, -12.0, TERRA_R), titulo: 'SUBE MÁS QUE EL PROMEDIO', valor: 'en nuestras costas', idade: t - 127.6, dx: 150, dy: -60, cor: OURO, seta: 'cima', grande: true},
    ];
    if (t < 116.23) lista[2].titulo = '¿EL MAR BAJA?';
  }
  const fadeIn = sm(T0 - 0.2, T0 + 0.5, t);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 62% 55%, #0d2240 0%, #060d1b 55%, #03060d 100%)'}}>
      {ok && <AbsoluteFill style={{opacity: fadeIn}}>
        <ThreeCanvas width={1920} height={1080} gl={{antialias: true, alpha: true, toneMapping: THREE.NoToneMapping}} camera={{fov: 30, near: 0.05, far: 200, position: [0, 0, 5]}}>
          <CamSync c={c} />
          <Globo t={t} cam={c.pos} sol={SOL} />
        </ThreeCanvas>
      </AbsoluteFill>}
      {ok && <Etiquetas lista={lista} t={t} />}
      {ok && <Medidores t={t} />}
      <Escala texto="escala vertical exagerada" op={fadeIn} />
    </AbsoluteFill>
  );
};

