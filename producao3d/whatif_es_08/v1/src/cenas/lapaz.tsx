// Cena 'lapaz' (cap. 10): "El agua sube desde la selva por el canon de La Paz." (cam 'canion') e "El Alto, Potosi." (cam
// 'elalto'). Relevo real (AWS Terrain Tiles), agua pelo nivel de alagamento fino (entra pelo rio La Paz, do leste/sudeste),
// casas de tijolo ao longo das ruas do OSM, Mi Teleferico pelo tracado do OSM. Funcao pura de (beat, t, u, L).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CenaProps} from './tipos';
import {Rot, Rotulos} from '../hud/HudMar';
import {Cam, camera3, dolly, lerp3, projeta, useCarga} from './cdmx/comum';
import {Camera} from './cdmx/mundo';
import {DadosLapaz, MundoLapaz, carregaLapaz, vyLapaz} from './lapaz/mundo';

const loc = (d: DadosLapaz, lon: number, lat: number, alt: number): [number, number, number] => [(lon - d.m.olon) * d.m.kx, vyLapaz(alt - d.m.base), -(lat - d.m.olat) * d.m.kz];

const cameraDe = (cam: string | undefined, u: number): Cam => {
  // y em unidades da cena (exagero 1,8x em torno de 3.600 m): centro ~690, borda de El Alto ~1.500, Zona Sur ~100
  if (cam === 'elalto') {
    // por cima do canion ja afogado, a leste do centro, olhando para o oeste: a Ceja, os teleferiscos e o planalto de El Alto
    const e = dolly(u, 0.5);
    return {pos: lerp3([-1300, 2750, 2300], [-2300, 2550, 1500], e), alvo: lerp3([-5800, 1400, -200], [-6300, 1400, -500], e), fov: 46};
  }
  // 'canion': do sul, sobre o vale baixo (Obrajes), olhando canion acima para o centro e a parede de El Alto; avanca e sobe
  const e = dolly(u, 0.4);
  return {pos: lerp3([3400, 1720, 4500], [2500, 1600, 3400], e), alvo: lerp3([-1100, 620, -500], [-1500, 680, -800], e), fov: 50};
};

export const Cena: React.FC<CenaProps> = ({beat, t, u, L}) => {
  const d = useCarga('lapaz', carregaLapaz);
  if (!d) return null;
  const c = cameraDe(beat.cam, u), cam3 = camera3(c);
  const dist = Math.hypot(c.pos[0] - c.alvo[0], c.pos[1] - c.alvo[1], c.pos[2] - c.alvo[2]);
  const rot: Rot[] = [];
  const poe = (id: string, p: [number, number, number], titulo: string, valor: string, afogado: boolean, idade: number, dx: number, dy: number) => {
    const s = projeta(cam3, p); if (s.ok && idade > 0) rot.push({id, x: s.x, y: s.y, titulo, valor, afogado, idade, dx, dy});
  };
  const idade = t - beat.ini;
  if (beat.cam === 'elalto') {
    poe('alto', loc(d, -68.19, -16.508, 4060), 'EL ALTO', '4.050 m', L >= 4050, idade - 0.15, -40, -170);
    const azul = d.m.linhas.find((l) => /Azul/.test(l.nome)) ?? d.m.linhas[0];   // a Linea Azul corre sobre El Alto
    const q = azul.p[Math.floor(azul.p.length * 0.6)];
    poe('tele', [q[0], vyLapaz(q[2]) + 40, q[1]], 'MI TELEFÉRICO', '10 líneas', false, idade - 0.6, 150, -120);
  } else {
    poe('lapaz', loc(d, -68.1336, -16.4958, 3660), 'LA PAZ', '3.640 m', L >= 3650, idade - 0.2, 150, -150);
    poe('selva', loc(d, -68.112, -16.513, L), 'EL AGUA SUBE POR EL CAÑÓN', 'desde la selva', true, idade - 0.7, -60, 120);
  }
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #3f78c6 0%, #86b4e2 40%, #c9def0 62%, #d9e6ee 100%)'}}>
      <ThreeCanvas linear flat width={1920} height={1080} gl={{antialias: true, alpha: true, powerPreference: 'high-performance'}} camera={{fov: c.fov, near: 1, far: 300000, position: c.pos}}>
        <Camera c={c} />
        <MundoLapaz d={d} L={L} t={t} dist={dist} />
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 55%, rgba(8,16,30,0.38) 100%)'}} />
      <Rotulos lista={rot} />
    </AbsoluteFill>
  );
};

