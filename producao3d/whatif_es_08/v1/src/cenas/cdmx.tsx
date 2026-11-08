// Cena 'cdmx' (cap. 07): "Y a dos mil doscientos ochenta metros, el agua llega a la Ciudad de Mexico." (cam 'zocalo') e
// "Donde hace quinientos anos habia un lago, vuelve a haber agua." (cam 'lago'). Relevo real do Vale do Mexico (AWS Terrain
// Tiles), predios e ruas do OpenStreetMap, Zocalo por codigo com medidas reais, lagos de 1519 desenhados a tinta.
// Funcao pura de (beat, t, u, L): a agua da bacia segue o cronograma de cronoCdmx (tempo do video), a camera segue u.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CenaProps} from './tipos';
import plano from '../plano.json';
import {Rot, Rotulos} from '../hud/HudMar';
import {Cam, camera3, dolly, lerp, lerp3, projeta, smooth, useCarga} from './cdmx/comum';
import {Camera, DadosCdmx, MundoCdmx, carregaCdmx, cronoCdmx} from './cdmx/mundo';

const TC = (plano.ancoras as [number, number][]).find((a) => a[1] === 2280)?.[0] ?? 249.56;   // o mar passa o passo norte
const mil = (v: number) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const norm = (v: number[]) => { const k = Math.hypot(v[0], v[1], v[2]); return [v[0] / k, v[1] / k, v[2] / k]; };
const cameraDe = (d: DadosCdmx, cam: string | undefined, u: number): Cam => {
  if (cam === 'lago') {
    // alto, do sudoeste, olhando o sistema de lagos inteiro; desliza para leste e desce um pouco (orbita curta)
    const e = dolly(u, 0.45), ang = lerp(-0.42, -0.18, e), dist = lerp(78000, 60000, e);
    const alvo: [number, number, number] = [lerp(6500, 8500, e), 260, lerp(-8000, -10500, e)];
    const dir = norm([Math.sin(ang), lerp(0.95, 0.86, e), Math.cos(ang)]);
    return {pos: [alvo[0] + dir[0] * dist, alvo[1] + dir[1] * dist, alvo[2] + dir[2] * dist], alvo, fov: 38};
  }
  // 'zocalo': alto sobre o norte do vale (a agua passa o passo e invade a planicie), depois mergulha atras da frente ate a
  // fachada da Catedral; a camera fica ao sul do alvo, olhando para o norte (a agua vem na direcao do espectador)
  const e = 0.1 * u + 0.9 * Math.pow(smooth(0.3, 0.97, u), 1.3);
  const p = d.m.passo;
  const a0 = [p[0] + 2500, 300, p[1] + 9000], a1 = [-15, 262, -140];
  const dist = Math.exp(lerp(Math.log(26000), Math.log(400), e));
  const alvo = lerp3(a1, a0, (dist - 400) / (26000 - 400));     // o alvo converge junto com a distancia (log)
  const dir = norm(lerp3([0.10, 0.50, 1.0], [-0.12, 0.27, 1.0], e));
  return {pos: [alvo[0] + dir[0] * dist, alvo[1] + dir[1] * dist, alvo[2] + dir[2] * dist], alvo, fov: lerp(40, 48, e)};
};

export const Cena: React.FC<CenaProps> = ({beat, t, u, L}) => {
  const d = useCarga('cdmx', carregaCdmx);
  if (!d) return null;
  const c = cameraDe(d, beat.cam, u), cam3 = camera3(c), cr = cronoCdmx(d.m, TC);
  const lagoA = beat.cam === 'lago' ? smooth(0.0, 0.16, u) : 0;
  const rot: Rot[] = [];
  const poe = (id: string, p: [number, number, number], titulo: string, valor: string, afogado: boolean, idade: number, dx: number, dy: number) => {
    const s = projeta(cam3, p); if (s.ok && idade > 0) rot.push({id, x: s.x, y: s.y, titulo, valor, afogado, idade, dx, dy});
  };
  const idade = t - beat.ini;
  if (beat.cam === 'lago') {
    const [cx, cz] = [(-99.0 - d.m.olon) * d.m.kx, -(19.49 - d.m.olat) * d.m.kz];
    poe('lago', [cx, 300, cz], 'EL LAGO DE TEXCOCO', 'hace 500 años', false, idade - 0.35, 150, -150);
    poe('teno', [0, 250, 0], 'TENOCHTITLAN', 'hoy, el Zócalo', t >= cr.tZocalo, idade - 1.4, -170, 110);
  } else {
    poe('passo', [d.m.passo[0], d.m.passo[2] - 2000 + 30, d.m.passo[1]], 'EL AGUA ENTRA AL VALLE', `${mil(2280)} m`, L >= 2280, u < 0.62 ? idade - 0.25 : -1, 160, -130);
    poe('zocalo', [0, 252, 30], 'ZÓCALO', `${mil(2240)} m`, t >= cr.tZocalo, u >= 0.6 ? (u - 0.6) * (beat.fim - beat.ini) : -1, 170, -150);
  }
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #5f8fcf 0%, #9cc0e2 42%, #cfe1ee 62%, #d9e6ee 100%)'}}>
      <ThreeCanvas linear flat width={1920} height={1080} gl={{antialias: true, alpha: true, powerPreference: 'high-performance'}} camera={{fov: c.fov, near: 1, far: 300000, position: c.pos}}>
        <Camera c={c} />
        <MundoCdmx d={d} L={L} t={t} c={c} tc={TC} lago={lagoA} ilha={beat.cam === 'lago' ? smooth(0.12, 0.3, u) : 0} fantasma={lagoA} />
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 55%, rgba(8,16,30,0.38) 100%)'}} />
      <Rotulos lista={rot} />
    </AbsoluteFill>
  );
};

