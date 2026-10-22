// Andromeda (284-311): galaxia espiral de verdade feita de ~38 mil estrelas instanciadas (bojo amarelado, bracos azulados com
// regioes HII rosadas, poeira escura nos bracos), cauda de mare, o disco virando faixa; mais a mancha (261-274), os pontos coloridos
// (297+), as estrelas azuis novas (305-309) e as estrias de poeira que riscam o ceu.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {rnd} from './comum';
import {FRAG_ESTRELA, FRAG_GAUSS, FRAG_POEIRA, FRAG_RISCO, atualiza, geometriaSprites, instancias, materialSprites, poe} from './cosmos_sprites';

const gauss = (i: number) => { const u = Math.max(1e-6, rnd(i)), v = rnd(i + 0.5); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2831853 * v); };
const resolucao = (gl: THREE.WebGLRenderer) => gl.getDrawingBufferSize(new THREE.Vector2());

// ---------- estrelas da galaxia (raio 1, disco no plano xz) ----------
const PASSO = Math.tan((21 * Math.PI) / 180);
const criaAndromeda = () => {
  const NB = 5000, NA = 22000, ND = 7000, NH = 700;
  const I = instancias(NB + NA + ND + NH);
  let k = 0;
  for (let i = 0; i < NB; i++, k++) {     // bojo
    const s = 1000 + i * 3;
    const r = Math.abs(gauss(s)) * 0.075, th = rnd(s + 1) * 6.2832, ph = Math.acos(2 * rnd(s + 2) - 1);
    const x = r * Math.sin(ph) * Math.cos(th), y = r * Math.cos(ph) * 0.6, z = r * Math.sin(ph) * Math.sin(th);
    const q = 0.85 + 0.3 * rnd(s + 4);
    poe(I, k, [x, y, z], [1.0 * q, 0.68 * q, 0.35 * q, 0.85], [0.008, 0, 1, 0]);
  }
  for (let i = 0; i < NA; i++, k++) {     // bracos (espiral logaritmica)
    const s = 50000 + i * 5;
    const braco = i % 2;
    const r = 0.1 + 0.95 * Math.pow(rnd(s), 0.85);
    const th0 = braco * Math.PI + Math.log(r / 0.1) / PASSO;
    const esp = 0.025 + 0.045 * r;
    const th = th0 + gauss(s + 1) * esp / r * 0.6, rr = r + gauss(s + 2) * esp;
    const x = rr * Math.cos(th), z = rr * Math.sin(th), y = gauss(s + 3) * 0.02;
    const u = Math.min(1, r);
    const c = [1.0 - 0.35 * u, 0.9 - 0.12 * u, 0.78 + 0.25 * u];
    const b = (0.75 + 0.4 * rnd(s + 4)) * (1.1 - 0.5 * u);
    poe(I, k, [x, y, z], [c[0], c[1], c[2], b], [0.008, 0, 1, 0]);
  }
  for (let i = 0; i < ND; i++, k++) {     // disco difuso
    const s = 200000 + i * 4;
    const r = Math.min(1.15, -Math.log(Math.max(1e-4, rnd(s))) * 0.3), th = rnd(s + 1) * 6.2832;
    poe(I, k, [r * Math.cos(th), gauss(s + 2) * 0.03, r * Math.sin(th)], [0.92, 0.9, 0.95, 0.45], [0.008, 0, 1, 0]);
  }
  for (let i = 0; i < NH; i++, k++) {     // HII rosadas e aglomerados azuis nos bracos
    const s = 300000 + i * 4;
    const braco = i % 2, r = 0.25 + 0.75 * rnd(s);
    const th = braco * Math.PI + Math.log(r / 0.1) / PASSO + gauss(s + 1) * 0.08;
    const rosa = rnd(s + 2) < 0.5;
    poe(I, k, [r * Math.cos(th), 0, r * Math.sin(th)], rosa ? [1.0, 0.1, 0.4, 3.0] : [0.3, 0.42, 1.0, 3.0], [0.008, 0, 1, 0]);
  }
  return I;
};
const criaBrilho = () => {
  const N = 1400; const I = instancias(N);
  for (let i = 0; i < N; i++) {
    const s = 450000 + i * 5;
    if (i < 200) { const r = Math.abs(gauss(s)) * 0.08, th = rnd(s + 1) * 6.2832; poe(I, i, [r * Math.cos(th), 0, r * Math.sin(th)], [1.0, 0.7, 0.38, 0.05], [0.06, 0, 1, 0]); continue; }
    const braco = i % 2, r = 0.1 + 0.9 * Math.pow(rnd(s), 0.85);
    const th = braco * Math.PI + Math.log(r / 0.1) / PASSO + gauss(s + 1) * 0.05;
    const u = Math.min(1, r);
    poe(I, i, [r * Math.cos(th), 0, r * Math.sin(th)], [1.0 - 0.35 * u, 0.9 - 0.12 * u, 0.78 + 0.25 * u, 0.022 * (1.2 - 0.6 * u)], [0.05 + 0.03 * rnd(s + 2), 0, 1, 0]);
  }
  return I;
};
const criaPoeira = () => {
  const N = 3200; const I = instancias(N);
  for (let i = 0; i < N; i++) {
    const s = 400000 + i * 4;
    const braco = i % 2, r = 0.14 + 0.8 * Math.pow(rnd(s), 0.9);
    const th = braco * Math.PI + Math.log(r / 0.1) / PASSO - 0.22 + gauss(s + 1) * 0.05;
    poe(I, i, [r * Math.cos(th), 0.004, r * Math.sin(th)], [0.18, 0.08, 0.04, 0.1], [0.018 + 0.015 * rnd(s + 2), 0, 1, 0]);
  }
  return I;
};
// cauda de mare: em coordenadas do quadro (x direita, y cima), raio da galaxia = 1; param s em iPar.y
const criaCauda = () => {
  const N = 4000; const I = instancias(N);
  const p0 = new THREE.Vector2(-0.75, -0.25), p1 = new THREE.Vector2(-1.6, -0.35), p2 = new THREE.Vector2(-2.1, -1.1);
  for (let i = 0; i < N; i++) {
    const s = rnd(500000 + i * 3);
    const a = (1 - s) * (1 - s), b = 2 * (1 - s) * s, c = s * s;
    const x = a * p0.x + b * p1.x + c * p2.x, y = a * p0.y + b * p1.y + c * p2.y;
    const w = 0.07 + 0.12 * s;
    poe(I, i, [x + gauss(500001 + i * 3) * w, y + gauss(500002 + i * 3) * w, 0], [0.8, 0.86, 1.0, 0.7 * (1 - 0.6 * s)], [0.008, s, 1, 0]);
  }
  return I;
};

export type PoseGalaxia = {ancora: THREE.Vector3; quat: THREE.Quaternion; desloc: THREE.Vector3; escala: number; incl: number; giro: number; rolagem: number;
  brilho: number; cauda: number; caudaAlfa: number; poeira: number; prof: number; nucleo: number};

export const Andromeda: React.FC<{t: number; g: PoseGalaxia; gl: THREE.WebGLRenderer}> = ({t, g, gl}) => {
  const geo = useMemo(() => geometriaSprites(criaAndromeda()), []);
  const geoPo = useMemo(() => geometriaSprites(criaPoeira()), []);
  const geoBr = useMemo(() => geometriaSprites(criaBrilho()), []);
  const geoCa = useMemo(() => geometriaSprites(criaCauda()), []);
  const geoNu = useMemo(() => { const I = instancias(2); poe(I, 0, [0, 0, 0], [1.0, 0.7, 0.35, 1.2], [0.05, 0, 1, 0]); poe(I, 1, [0, 0, 0], [1.0, 0.95, 0.85, 5.0], [0.02, 0, 1, 0]); return geometriaSprites(I); }, []);
  const mat = useMemo(() => materialSprites({frag: FRAG_GAUSS, minPx: 1.1, maxPx: 7}), []);
  const matPo = useMemo(() => materialSprites({frag: FRAG_POEIRA, minPx: 1.5, maxPx: 60}), []);
  const matNu = useMemo(() => materialSprites({frag: FRAG_GAUSS, minPx: 2, maxPx: 900}), []);
  const matBr = useMemo(() => materialSprites({frag: FRAG_GAUSS, minPx: 1.5, maxPx: 900}), []);
  const matCa = useMemo(() => materialSprites({frag: FRAG_GAUSS, minPx: 1.1, maxPx: 7, pos: 'cor.a *= 1.0 - smoothstep(uA - 0.08, uA, iPar.y);'}), []);
  const res = resolucao(gl);
  for (const m of [mat, matPo, matNu, matCa, matBr]) { m.uniforms.uRes.value.copy(res); m.uniforms.uT.value = t; m.uniforms.uEscala.value = g.escala; }
  mat.uniforms.uAlfa.value = g.brilho; matNu.uniforms.uAlfa.value = g.brilho * g.nucleo; matPo.uniforms.uAlfa.value = Math.min(1, g.brilho) * g.poeira; matBr.uniforms.uAlfa.value = g.brilho;
  matCa.uniforms.uA.value = g.cauda; matCa.uniforms.uAlfa.value = g.caudaAlfa * g.brilho;
  const rot = new THREE.Euler(g.incl, g.giro, g.rolagem, 'ZXY');
  return (
    <group position={g.ancora} quaternion={g.quat}>
      <group position={g.desloc}>
        <group scale={[1, 1, g.prof]}>
        <group rotation={rot} scale={g.escala}>
          <mesh geometry={geo} material={mat} renderOrder={4} frustumCulled={false} />
          <mesh geometry={geoBr} material={matBr} renderOrder={4} frustumCulled={false} />
          <mesh geometry={geoPo} material={matPo} renderOrder={5} frustumCulled={false} />
          <mesh geometry={geoNu} material={matNu} renderOrder={6} frustumCulled={false} />
        </group>
        </group>
        {g.caudaAlfa > 0 && <group rotation={[0, 0, g.rolagem]} scale={g.escala}>
          <mesh geometry={geoCa} material={matCa} renderOrder={4} frustumCulled={false} />
        </group>}
      </group>
    </group>
  );
};

// ---------- mancha (Andromeda ao longe, 261-274) ----------
export const Mancha: React.FC<{t: number; ancora: THREE.Vector3; px: number; brilho: number; gl: THREE.WebGLRenderer}> = ({t, ancora, px, brilho, gl}) => {
  const geo = useMemo(() => { const I = instancias(2); poe(I, 0, [0, 0, 0], [1, 0.95, 0.88, 2.4], [1, 0, 2.6, 0.38]); poe(I, 1, [0, 0, 0], [0.9, 0.9, 1, 0.35], [2.6, 0, 1.8, 0.38]); return geometriaSprites(I); }, []);
  const mat = useMemo(() => materialSprites({frag: FRAG_GAUSS, minPx: 0.5, maxPx: 400}), []);
  mat.uniforms.uRes.value.copy(resolucao(gl)); mat.uniforms.uT.value = t; mat.uniforms.uAlfa.value = brilho;
  const D = ancora.length();
  mat.uniforms.uEscala.value = px * D / 1037;   // tamanho em px (a 1080p) -> mundo
  return <mesh geometry={geo} material={mat} position={ancora} renderOrder={4} frustumCulled={false} />;
};

// ---------- pontos coloridos (297+) e estrelas azuis novas (305-309), no quadro da galaxia ----------
const NC = 80, NA = 46;
export const EstrelasNovas: React.FC<{t: number; ancora: THREE.Vector3; quat: THREE.Quaternion; alfa: number; gl: THREE.WebGLRenderer}> = ({t, ancora, quat, alfa, gl}) => {
  const D = ancora.length(), W = D * 0.9255, H = D * 0.5206;
  const I = useMemo(() => instancias(NC + NA), []);
  const geo = useMemo(() => geometriaSprites(I, true), [I]);
  const mat = useMemo(() => materialSprites({frag: FRAG_ESTRELA, minPx: 1, maxPx: 200}), []);
  for (let i = 0; i < NC + NA; i++) {
    const s = 600000 + i * 7;
    const azul = i >= NC;
    const nasce = azul ? 305 + rnd(s) * 4 : 297 + rnd(s) * 2.6;
    const x = (rnd(s + 1) * 2.3 - 1.15) * W, y = (rnd(s + 2) * 2.3 - 1.15) * H;
    const h = rnd(s + 3);
    const c = azul ? [0.3, 0.48, 1.8] : h < 0.4 ? [1.3, 0.1, 0.35] : h < 0.7 ? [0.3, 0.45, 1.6] : h < 0.85 ? [1.5, 0.6, 0.15] : [1.3, 1.2, 1.1];
    const idade = t - nasce;
    const vis = idade < 0 ? 0 : Math.min(1, idade / (azul ? 0.25 : 0.6));
    const flash = azul && idade >= 0 ? 1 + 3 * Math.exp(-idade / 0.35) : 1;
    const px = (azul ? 7 + 9 * rnd(s + 4) : 5 + 9 * rnd(s + 4)) * (azul ? Math.min(1.6, 0.6 + idade) : 1);
    poe(I, i, [x, y, 0], [c[0], c[1], c[2], (azul ? 2.2 : 1.6) * vis * flash * (0.7 + 0.6 * rnd(s + 5))], [px * D / 1037, 0, 1, 0]);
  }
  atualiza(geo);
  mat.uniforms.uRes.value.copy(resolucao(gl)); mat.uniforms.uT.value = t; mat.uniforms.uAlfa.value = alfa;
  return <group position={ancora} quaternion={quat}><mesh geometry={geo} material={mat} renderOrder={7} frustumCulled={false} /></group>;
};

// ---------- estrias (riscos de poeira/estrelas que cruzam o quadro a cada fracao de segundo) ----------
const NE = 260;
export const Estrias: React.FC<{t: number; quat: THREE.Quaternion; alfa: number; cor: [number, number, number]; gl: THREE.WebGLRenderer; n?: number}> = ({t, quat, alfa, cor, gl, n = NE}) => {
  const D = 500, W = D * 0.9255, H = D * 0.5206;
  const I = useMemo(() => instancias(NE), []);
  const geo = useMemo(() => geometriaSprites(I, true), [I]);
  const mat = useMemo(() => materialSprites({frag: FRAG_RISCO, minPx: 0.6, maxPx: 1.2}), []);
  for (let i = 0; i < NE; i++) {
    const vida = 0.35 + 0.3 * rnd(i * 3.1);
    const fase = rnd(i * 5.7) * vida;
    const ciclo = Math.floor((t + fase) / vida), u = (t + fase) / vida - ciclo;
    const s = 700000 + i * 11 + ciclo * 3917;
    const ang = -0.6 + gauss(s) * 0.7;
    const L = 3 + 5 * rnd(s + 1);
    const x = (rnd(s + 2) * 2.2 - 1.1) * W + Math.cos(ang) * u * L * D / 1037 * 2, y = (rnd(s + 3) * 2.2 - 1.1) * H + Math.sin(ang) * u * L * D / 1037 * 2;
    const a = Math.sin(Math.PI * u) * (0.35 + 0.65 * rnd(s + 4));
    poe(I, i, [x, y, -D], [cor[0], cor[1], cor[2], a], [0.75 * D / 1037, 0, L / 0.75, ang]);
  }
  atualiza(geo); geo.instanceCount = Math.min(NE, n);
  mat.uniforms.uRes.value.copy(resolucao(gl)); mat.uniforms.uT.value = t; mat.uniforms.uAlfa.value = alfa;
  return <group quaternion={quat}><mesh geometry={geo} material={mat} renderOrder={9} frustumCulled={false} /></group>;
};
