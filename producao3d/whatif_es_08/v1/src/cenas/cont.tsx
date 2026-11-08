// Familia "cont": o continente em relevo com o mar subindo pelo dado real (mundo/Continente.tsx). Cada batida = uma regiao
// (alvo geografico + enquadramento) e um movimento de camera que nunca para. Rotulos presos as cidades da regiao.
import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {Continente, Janela} from '../mundo/Continente';
import {DADOS, mundo} from '../dados';
import {Rot, Rotulos} from '../hud/HudMar';
import {CenaProps} from './tipos';
import {tDoNivel} from '../nivel';

type V3 = [number, number, number];
// regiao: lon, lat, altitude do alvo (m), distancia (graus), azimute (0 = camera ao sul olhando norte), elevacao, nome, cidades
type Reg = {lon: number; lat: number; m: number; d: number; az: number; el: number; nome: string; cid?: string[]; extra?: {t: string; lon: number; lat: number; m: number; real?: number}[]};
const ACON = {t: 'ACONCAGUA', lon: -70.011, lat: -32.653, m: 6961, real: 6961};
export const REG: Record<string, Reg> = {
  latam: {lon: -66, lat: -14, m: 0, d: 70, az: 0, el: 55, nome: 'LATINOAMÉRICA'},
  latam_paises: {lon: -70, lat: -10, m: 0, d: 62, az: 15, el: 50, nome: 'VEINTE PAÍSES'},
  latam_alto: {lon: -66, lat: -16, m: 0, d: 74, az: -10, el: 62, nome: 'LATINOAMÉRICA'},
  andes_sul: {lon: -70, lat: -30, m: 2000, d: 14, az: 210, el: 28, nome: 'LOS ANDES', extra: [ACON]},
  aconcagua: {lon: -70.01, lat: -32.65, m: 4000, d: 4, az: 200, el: 24, nome: 'MENDOZA, ARGENTINA', extra: [ACON], cid: ['Mendoza']},
  aconcagua_perto: {lon: -70.01, lat: -32.65, m: 5000, d: 2.6, az: 230, el: 20, nome: 'ACONCAGUA', extra: [ACON]},
  aconcagua_ilha: {lon: -70.01, lat: -32.65, m: 5600, d: 3.4, az: 180, el: 22, nome: 'LOS ANDES', extra: [ACON]},
  aconcagua_cume: {lon: -70.01, lat: -32.65, m: 6700, d: 1.5, az: 250, el: 16, nome: 'ACONCAGUA · 6.961 m', extra: [ACON]},
  yucatan: {lon: -88, lat: 20.5, m: 0, d: 7, az: 160, el: 26, nome: 'YUCATÁN', cid: ['Cancún']},
  caribe: {lon: -77, lat: 19, m: 0, d: 12, az: 170, el: 35, nome: 'EL CARIBE', cid: ['La Habana', 'Santo Domingo', 'Puerto Príncipe', 'San Juan']},
  caribe_sul: {lon: -75, lat: 10.5, m: 0, d: 11, az: 10, el: 32, nome: 'EL CARIBE', cid: ['Cartagena', 'Ciudad de Panamá', 'Maracaibo']},
  rio: {lon: -43.2, lat: -22.9, m: 0, d: 3.2, az: 150, el: 24, nome: 'RÍO DE JANEIRO', cid: ['Rio de Janeiro']},
  montevideo: {lon: -56.2, lat: -34.9, m: 0, d: 5, az: -10, el: 30, nome: 'RÍO DE LA PLATA', cid: ['Montevideo', 'Buenos Aires']},
  plata_parana: {lon: -58.5, lat: -31, m: 0, d: 11, az: -20, el: 36, nome: 'RÍO DE LA PLATA', cid: ['Buenos Aires', 'Montevideo', 'Asunción']},
  cone_sul: {lon: -60, lat: -30, m: 0, d: 26, az: 0, el: 45, nome: 'EL CONO SUR', cid: ['Buenos Aires', 'Santiago', 'São Paulo']},
  brasil_costa: {lon: -45, lat: -20, m: 0, d: 14, az: 120, el: 34, nome: 'BRASIL', cid: ['Rio de Janeiro', 'São Paulo']},
  uruguai: {lon: -56, lat: -32.5, m: 0, d: 8, az: -15, el: 34, nome: 'URUGUAY', cid: ['Montevideo']},
  uruguai_perto: {lon: -55.8, lat: -31.5, m: 100, d: 4.5, az: 30, el: 28, nome: 'URUGUAY', extra: [{t: 'RIVERA', lon: -55.55, lat: -30.9, m: 222}, {t: 'TACUAREMBÓ', lon: -55.98, lat: -31.71, m: 220}]},
  rivera: {lon: -55.5, lat: -30.9, m: 200, d: 2.6, az: 60, el: 22, nome: 'RIVERA, URUGUAY', extra: [{t: 'RIVERA', lon: -55.55, lat: -30.9, m: 222}]},
  cuba: {lon: -79, lat: 21.8, m: 0, d: 6, az: 150, el: 28, nome: 'CUBA', cid: ['La Habana']},
  amazonas: {lon: -60, lat: -4, m: 0, d: 24, az: 30, el: 40, nome: 'LA AMAZONÍA', extra: [{t: 'MANAOS', lon: -60.02, lat: -3.12, m: 92}]},
  paraguai: {lon: -57, lat: -24, m: 200, d: 8, az: 200, el: 32, nome: 'PARAGUAY', cid: ['Asunción']},
  hispaniola: {lon: -70.8, lat: 18.8, m: 400, d: 5, az: 160, el: 28, nome: 'LA ESPAÑOLA', cid: ['Santo Domingo', 'Puerto Príncipe']},
  america_central: {lon: -86, lat: 13.5, m: 500, d: 9, az: 140, el: 32, nome: 'CENTROAMÉRICA', cid: ['San Salvador', 'Managua', 'Tegucigalpa', 'San José', 'Ciudad de Guatemala']},
  brasilia: {lon: -47.9, lat: -15.8, m: 800, d: 6, az: 30, el: 30, nome: 'MESETA DE BRASILIA', cid: ['Brasilia']},
  argentina: {lon: -64, lat: -36, m: 0, d: 22, az: -10, el: 42, nome: 'ARGENTINA', cid: ['Buenos Aires', 'Mendoza'], extra: [ACON]},
  haiti: {lon: -72.5, lat: 18.8, m: 600, d: 3.6, az: 120, el: 26, nome: 'HAITÍ', cid: ['Puerto Príncipe']},
  venezuela: {lon: -68, lat: 8.5, m: 800, d: 9, az: 10, el: 34, nome: 'VENEZUELA', cid: ['Caracas', 'Maracaibo']},
  atacama: {lon: -68.9, lat: -22.5, m: 2000, d: 4.5, az: 250, el: 22, nome: 'DESIERTO DE ATACAMA', extra: [{t: 'CALAMA', lon: -68.93, lat: -22.46, m: 2257}]},
  bogota: {lon: -74.1, lat: 4.7, m: 2400, d: 3.2, az: 200, el: 24, nome: 'BOGOTÁ', cid: ['Bogotá']},
  tres: {lon: -84, lat: 12, m: 1500, d: 32, az: 30, el: 44, nome: 'MÉXICO · GUATEMALA · COLOMBIA', cid: ['Toluca', 'Quetzaltenango', 'Bogotá']},
  toluca: {lon: -99.6, lat: 19.3, m: 2500, d: 3.0, az: 160, el: 24, nome: 'TOLUCA, MÉXICO', cid: ['Toluca', 'Ciudad de México']},
  colombia_andes: {lon: -75.2, lat: 4.5, m: 2500, d: 6, az: 130, el: 30, nome: 'LOS ANDES DE COLOMBIA', cid: ['Bogotá', 'Medellín']},
  guatemala: {lon: -91.6, lat: 15.0, m: 2600, d: 3.6, az: 200, el: 26, nome: 'ALTIPLANO DE GUATEMALA', cid: ['Quetzaltenango']},
  andes: {lon: -72, lat: -12, m: 2500, d: 26, az: 60, el: 40, nome: 'LOS ANDES', cid: ['Quito', 'La Paz', 'Cusco']},
  andes_pessoas: {lon: -75, lat: -8, m: 2500, d: 14, az: 70, el: 32, nome: 'LOS ANDES', cid: ['Quito', 'Cusco', 'Cerro de Pasco']},
  quito: {lon: -78.5, lat: -0.2, m: 2900, d: 3.2, az: 120, el: 24, nome: 'QUITO, ECUADOR', cid: ['Quito']},
  cusco: {lon: -72, lat: -13.5, m: 3200, d: 3.4, az: 140, el: 24, nome: 'CUSCO, PERÚ', cid: ['Cusco']},
  altiplano: {lon: -68.5, lat: -17, m: 3600, d: 9, az: 140, el: 30, nome: 'EL ALTIPLANO', cid: ['La Paz', 'Puno', 'Oruro', 'Potosí'], extra: [{t: 'LAGO TITICACA', lon: -69.4, lat: -15.9, m: 3851}]},
  titicaca: {lon: -69.4, lat: -15.9, m: 3800, d: 3.6, az: 200, el: 20, nome: 'LAGO TITICACA', cid: ['Puno', 'Juliaca'], extra: [{t: 'LAGO TITICACA', lon: -69.4, lat: -15.9, m: 3851}]},
  bolivia: {lon: -66.5, lat: -18.5, m: 3500, d: 10, az: 160, el: 34, nome: 'BOLIVIA', cid: ['El Alto', 'Potosí', 'Oruro']},
  cerro_pasco: {lon: -76.25, lat: -10.68, m: 4000, d: 3.0, az: 120, el: 22, nome: 'CERRO DE PASCO, PERÚ', cid: ['Cerro de Pasco']},
  peru: {lon: -74, lat: -12, m: 3500, d: 14, az: 80, el: 34, nome: 'PERÚ', cid: ['Cerro de Pasco', 'La Rinconada', 'Puno']},
  puna: {lon: -70, lat: -14.5, m: 4200, d: 5, az: 120, el: 24, nome: 'LA PUNA', cid: ['La Rinconada']},
  rinconada: {lon: -69.45, lat: -14.63, m: 4600, d: 2.4, az: 160, el: 20, nome: 'LA RINCONADA · 5.100 m', extra: [{t: 'LA RINCONADA', lon: -69.45, lat: -14.63, m: 5100}]},
  andes_ilhas: {lon: -70, lat: -25, m: 5000, d: 14, az: 190, el: 28, nome: 'LOS ANDES', extra: [ACON, {t: 'OJOS DEL SALADO', lon: -68.54, lat: -27.11, m: 6893, real: 6893}]},
  oceano: {lon: -66, lat: -20, m: 6500, d: 50, az: 0, el: 40, nome: 'LATINOAMÉRICA', extra: [ACON]},
};
export const lugarDe = (reg?: string) => (reg && REG[reg] ? REG[reg].nome : 'LATINOAMÉRICA');

const easeIO = (u: number) => u * u * (3 - 2 * u);
const mov = (r: Reg, tipo: string | undefined, u: number, n = 0, dur = 5) => {
  // 05/11: a 1a versao media 0,86 de movimento (meta >= 2): amplitude ~2,5x e proporcional a duracao da batida
  const k = 0.2 * easeIO(u) + 0.8 * u, A = Math.min(2.6, Math.max(1, dur / 5));
  let {az, el, d, lon, lat} = r;
  az += ((n * 47) % 50) - 25; el += ((n * 13) % 10) - 5;   // cada batida com angulo proprio (regiao repetida nunca repete o take)
  const lado = ((az + 90) * Math.PI) / 180, trav = (f: number) => { lon += Math.sin(lado) * r.d * f; lat -= Math.cos(lado) * r.d * f; };
  if (tipo === 'push') { d *= 1.3 - 0.5 * k * Math.min(1.3, A); el -= 8 * k; az += 10 * A * k; }
  else if (tipo === 'pull') { d *= 0.7 + 0.55 * k * Math.min(1.4, A); el += 10 * k; az -= 10 * A * k; }
  else if (tipo === 'orbita') { az += (-32 + 64 * k) * A; }
  else if (tipo === 'travelling') trav(0.75 * A * (k - 0.5));
  else if (tipo === 'rasante') { el = 10 + 12 * k; d *= 1.05 - 0.3 * k; az += 26 * A * k; trav(0.3 * A * (k - 0.5)); }
  else if (tipo === 'revela') { el = 64 - 40 * k; d *= 1.15 - 0.25 * k; az += 12 * A * k; }
  else { az += 30 * A * k; d *= 1.12 - 0.25 * k; trav(0.3 * A * (k - 0.5)); }   // dolly
  const alvo = mundo(lon, lat, r.m), a = (az * Math.PI) / 180, e = (el * Math.PI) / 180;
  const pos: V3 = [alvo[0] + d * Math.cos(e) * Math.sin(a), alvo[1] + d * Math.sin(e), alvo[2] + d * Math.cos(e) * Math.cos(a)];
  return {pos, alvo, fov: r.d > 30 ? 38 : 44, lon, lat};
};
const Camara: React.FC<{pos: V3; alvo: V3; fov: number}> = ({pos, alvo, fov}) => {
  const {camera} = useThree() as {camera: THREE.PerspectiveCamera};
  const dist = Math.hypot(pos[0] - alvo[0], pos[1] - alvo[1], pos[2] - alvo[2]);
  camera.position.set(...pos); camera.fov = fov; camera.near = Math.max(0.02, dist * 0.02); camera.far = Math.max(400, dist * 25);   // far curto cortava o oceano em arco nos planos abertos
  camera.lookAt(...alvo); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  return null;
};
const CEU = new THREE.Color('#9fc4de');
const fmt = (m: number) => Math.round(m).toLocaleString('es-ES');

export const Cena: React.FC<CenaProps> = ({beat, t, u, L}) => {
  const {width, height} = useVideoConfig();
  const d = DADOS!, r = REG[beat.reg ?? 'latam'] ?? REG.latam;
  const c = mov(r, beat.mov, u, parseInt(beat.id.slice(1)) || 0, beat.fim - beat.ini);
  const w = Math.min(14, Math.max(2.5, r.d * 0.9));
  const fina: Janela | undefined = r.d < 30 ? [c.lon - w * 1.3, c.lat - w, c.lon + w * 1.3, c.lat + w] : undefined;
  // pais em foco (o que acabou de cair) pinta de vermelho no relevo
  const caiu = Object.keys(d.paises).filter((k) => k !== 'PRI').map((k) => ({k, tc: tDoNivel(d.paises[k].l99)})).filter((x) => x.tc <= t && t - x.tc < 2.6).sort((a, b) => b.tc - a.tc)[0];
  // rotulos: cidades da regiao + extras
  const pc = new THREE.PerspectiveCamera(c.fov, width / height, 0.05, 600); pc.position.set(...c.pos); pc.lookAt(...c.alvo); pc.updateMatrixWorld();
  const itens = [...(r.cid ?? []).map((n) => d.cidades.find((x) => x.nome === n)).filter(Boolean).map((x) => ({t: x!.nome.toUpperCase(), lon: x!.lon, lat: x!.lat, m: x!.nivel, real: undefined as number | undefined})),
    ...(r.extra ?? [])];
  const rots: Rot[] = itens.map((x, i) => {
    const p = new THREE.Vector3(...mundo(x.lon, x.lat, Math.max(x.m, 0))).project(pc), af = L >= x.m;
    const lado = (p.x > 0.35 ? -1 : 1), dy = (i % 2 ? 1 : -1) * (60 + 18 * (i % 3));
    return {id: x.t, x: (p.x * 0.5 + 0.5) * width, y: (-p.y * 0.5 + 0.5) * height, titulo: x.t,
      valor: x.real ? `${fmt(x.real)} m` : af ? `bajo el agua desde +${fmt(x.m)} m` : `a ${fmt(x.m)} m`, afogado: af && !x.real, idade: (t - beat.ini) - 0.4 - 0.35 * i, dx: 150 * lado, dy};
  });
  const caixas: number[][] = [];
  for (const q of rots) for (let k = 0; k < 6; k++) {   // colisao: empurra o rotulo que bate em outro ja posto
    const ex = q.x + q.dx, ey = q.y + q.dy, x0 = q.dx >= 0 ? ex : ex - 340, cx = [x0, ey - 34, x0 + 340, ey + 30];
    if (!caixas.some((b) => cx[0] < b[2] && cx[2] > b[0] && cx[1] < b[3] && cx[3] > b[1])) { caixas.push(cx); break; }
    q.dy += q.dy >= 0 ? 70 : -70;
  }
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #5d8fb8 0%, #9fc4de 55%, #c9dceb 100%)'}}>
      <ThreeCanvas width={width} height={height} gl={{antialias: true, toneMapping: THREE.NoToneMapping, alpha: true}}>
        <Camara pos={c.pos} alvo={c.alvo} fov={c.fov} />
        <Continente L={L} t={t} foco={caiu?.k} focoA={caiu ? Math.max(0, 1 - (t - caiu.tc) / 2.6) : 0} neblina={[r.d * 1.2, r.d * 3.4]} ceu={CEU} janela={Math.max(4, L * 0.04)} fina={fina} />
      </ThreeCanvas>
      <Rotulos lista={rots.filter((q) => q.x > 980 * 0 + 40 && !(q.x < 920 && q.y < 450))} />
    </AbsoluteFill>
  );
};
