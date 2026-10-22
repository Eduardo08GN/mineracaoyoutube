// Nebulosa planetaria (328,6+): casca rosa-magenta bipolar em grumos (volumetrico fingido por centenas de bolhas aditivas), nevoa
// verde-azulada, ponto branco no centro; casca laranja nova (330,6-337,5); ana branca; campo de galaxias (337,5-345) exportado em
// galaxiasCampo() para o agente Fim continuar em 345.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {rnd} from './comum';
import {poseCamera} from '../roteiro';
import {FRAG_BOLHA, FRAG_ESTRELA, FRAG_GALAXIA, geometriaSprites, instancias, materialSprites, poe} from './cosmos_sprites';

const gauss = (i: number) => { const u = Math.max(1e-6, rnd(i)), v = rnd(i + 0.5); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2831853 * v); };
const resolucao = (gl: THREE.WebGLRenderer) => gl.getDrawingBufferSize(new THREE.Vector2());
const esfera = (s: number) => { const z = 2 * rnd(s) - 1, a = rnd(s + 1) * 6.2832, r = Math.sqrt(1 - z * z); return new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), z); };

// casca em grumos: aglomerados na superficie de uma esfera (raio 1), achatada nos polos (forma de barril, tipo Helice/Anel)
const criaCasca = (semente: number, nGrupos: number, porGrupo: number, paleta: number[][], intens: number, tam: [number, number], espessura: number) => {
  const I = instancias(nGrupos * porGrupo);
  let k = 0;
  for (let g = 0; g < nGrupos; g++) {
    const c = esfera(semente + g * 13);
    c.y *= 1.18; c.normalize();
    for (let j = 0; j < porGrupo; j++, k++) {
      const s = semente + 10000 + k * 7;
      const p = c.clone().add(new THREE.Vector3(gauss(s), gauss(s + 1), gauss(s + 2)).multiplyScalar(0.16)).normalize()
        .multiplyScalar(1 + gauss(s + 3) * espessura);
      p.y *= 1.12;
      const cor = paleta[Math.floor(rnd(s + 4) * paleta.length)];
      poe(I, k, [p.x, p.y, p.z], [cor[0], cor[1], cor[2], intens * (0.6 + 0.8 * rnd(s + 5))], [tam[0] + (tam[1] - tam[0]) * rnd(s + 6), 0, 1, 0]);
    }
  }
  return I;
};
const ROSA = [[0.8, 0.0, 0.3], [0.9, 0.05, 0.42], [0.6, 0.0, 0.1], [0.7, 0.02, 0.5], [0.35, 0.05, 0.8]];
const LARANJA = [[1.05, 0.12, 0.0], [1.6, 0.4, 0.0], [0.8, 0.05, 0.0], [1.3, 0.25, 0.02]];

const criaNevoa = () => {
  const N = 70; const I = instancias(N);
  for (let i = 0; i < N; i++) {
    const s = 800000 + i * 7;
    const h = rnd(s + 3);
    const c = h < 0.45 ? [0.0, 0.16, 0.12] : h < 0.75 ? [0.02, 0.03, 0.36] : h < 0.9 ? [0.03, 0.13, 0.04] : [0.3, 0.0, 0.15];
    // x, y em fracoes do meio-quadro (convertidos no componente), z em fracao de D
    poe(I, i, [rnd(s) * 2.8 - 1.4, rnd(s + 1) * 2.8 - 1.4, (rnd(s + 2) - 0.5) * 0.2], [c[0], c[1], c[2], 0.16 * (0.5 + rnd(s + 4))], [0.12 + 0.2 * rnd(s + 5), 0, 1, 0]);
  }
  return I;
};

// ---------- campo de galaxias (337,5-345 e reaproveitado pelo agente Fim) ----------
export type GalaxiaCampo = {dir: THREE.Vector3; raio: number; cor: [number, number, number]; aspecto: number; angulo: number; fase: number; brilho: number};
let _campo: GalaxiaCampo[] | null = null;
// direcoes no MUNDO (a partir do olho), raio angular (rad), cor, aspecto (eixo menor/maior), angulo no quadro, fase (forma), brilho
export const galaxiasCampo = (): GalaxiaCampo[] => {
  if (_campo) return _campo;
  const q = poseCamera(340).quat;
  const out: GalaxiaCampo[] = [];
  const N = 96;
  for (let i = 0; i < N; i++) {
    const s = 900000 + i * 11;
    const dx = rnd(s) * 3.0 - 1.5, dy = rnd(s + 1) * 3.0 - 1.5;
    const dir = new THREE.Vector3(dx * 0.9255, dy * 0.5206, -1).normalize().applyQuaternion(q);
    const perto = rnd(s + 2);
    const px = perto < 0.12 ? 26 + 30 * rnd(s + 3) : perto < 0.45 ? 11 + 12 * rnd(s + 3) : 5 + 7 * rnd(s + 3);
    const h = rnd(s + 4);
    const cor: [number, number, number] = h < 0.35 ? [1.0, 0.7, 0.4] : h < 0.6 ? [0.55, 0.65, 1.1] : h < 0.8 ? [1.0, 0.4, 0.12] : [1.0, 0.45, 0.7];
    out.push({dir, raio: px / 1037, cor, aspecto: 0.3 + 0.7 * rnd(s + 5), angulo: rnd(s + 6) * 3.1416, fase: rnd(s + 7), brilho: (perto < 0.12 ? 1.3 : 2.2) * (0.6 + 0.7 * rnd(s + 8))});
  }
  _campo = out;
  return out;
};
// normal do grande circulo da Via Lactea (faixa no canto superior direito a partir de 329; o Fim pode continuar com ela)
export const faixaViaLactea = (): THREE.Vector3 => {
  const q = poseCamera(340).quat;
  const a = new THREE.Vector3(0.25 * 0.9255, 1.25 * 0.5206, -1).normalize().applyQuaternion(q);
  const b = new THREE.Vector3(1.25 * 0.9255, 0.05 * 0.5206, -1).normalize().applyQuaternion(q);
  return new THREE.Vector3().crossVectors(a, b).normalize();
};

export const CampoGalaxias: React.FC<{t: number; alfa: number; gl: THREE.WebGLRenderer}> = ({t, alfa, gl}) => {
  const D = 1000;
  const geo = useMemo(() => {
    const G = galaxiasCampo(); const I = instancias(G.length);
    G.forEach((g, i) => poe(I, i, [g.dir.x * D, g.dir.y * D, g.dir.z * D], [g.cor[0], g.cor[1], g.cor[2], g.brilho], [g.raio * D, g.fase, g.aspecto, g.angulo]));
    return geometriaSprites(I);
  }, []);
  const mat = useMemo(() => materialSprites({frag: FRAG_GALAXIA, minPx: 2, maxPx: 400}), []);
  mat.uniforms.uRes.value.copy(resolucao(gl)); mat.uniforms.uT.value = t; mat.uniforms.uAlfa.value = alfa;
  return <mesh geometry={geo} material={mat} renderOrder={3} frustumCulled={false} />;
};

export type PoseNebulosa = {ancora: THREE.Vector3; quat: THREE.Quaternion; desloc: THREE.Vector3; rRosa: number; aRosa: number; rLaranja: number; aLaranja: number;
  aNevoa: number; aCentro: number; pxCentro: number; giro: number};

export const Nebulosa: React.FC<{t: number; n: PoseNebulosa; gl: THREE.WebGLRenderer}> = ({t, n, gl}) => {
  const geoR = useMemo(() => geometriaSprites(criaCasca(1000, 46, 8, ROSA, 0.15, [0.16, 0.34], 0.09)), []);
  const geoL = useMemo(() => geometriaSprites(criaCasca(5000, 44, 8, LARANJA, 0.22, [0.14, 0.3], 0.07)), []);
  const geoN = useMemo(() => geometriaSprites(criaNevoa()), []);
  const geoI = useMemo(() => { const I = instancias(1); poe(I, 0, [0, 0, 0], [0.02, 0.12, 0.45, 0.35], [0.75, 0, 1, 0]); return geometriaSprites(I); }, []);
  const geoC = useMemo(() => { const I = instancias(1); poe(I, 0, [0, 0, 0], [0.9, 0.95, 1.2, 1], [1, 0, 1, 0]); return geometriaSprites(I); }, []);
  const mR = useMemo(() => materialSprites({frag: FRAG_BOLHA, minPx: 1.5, maxPx: 1500}), []);
  const mL = useMemo(() => materialSprites({frag: FRAG_BOLHA, minPx: 1.5, maxPx: 1500}), []);
  const mN = useMemo(() => materialSprites({frag: FRAG_BOLHA, minPx: 4, maxPx: 3000}), []);
  const mI = useMemo(() => materialSprites({frag: FRAG_BOLHA, minPx: 2, maxPx: 2000}), []);
  const mC = useMemo(() => materialSprites({frag: FRAG_ESTRELA, minPx: 1, maxPx: 600}), []);
  const res = resolucao(gl);
  for (const m of [mR, mL, mN, mI, mC]) { m.uniforms.uRes.value.copy(res); m.uniforms.uT.value = t; }
  const D = n.ancora.length(), W = 2 * D * 0.9255;   // largura do quadro na distancia D
  const RR = Math.max(1e-3, n.rRosa * W), RL = Math.max(1e-3, n.rLaranja * W);
  mR.uniforms.uEscala.value = RR; mR.uniforms.uAlfa.value = n.aRosa;
  mL.uniforms.uEscala.value = RL; mL.uniforms.uAlfa.value = n.aLaranja;
  mI.uniforms.uEscala.value = RR; mI.uniforms.uAlfa.value = n.aRosa;
  mN.uniforms.uEscala.value = W; mN.uniforms.uAlfa.value = n.aNevoa;
  mC.uniforms.uEscala.value = n.pxCentro * D / 1037; mC.uniforms.uAlfa.value = n.aCentro;
  return (
    <group position={n.ancora} quaternion={n.quat}>
      <group scale={[W / 2, D * 0.5206, D]}><mesh geometry={geoN} material={mN} renderOrder={3} frustumCulled={false} /></group>
      <group position={n.desloc}>
        <group scale={RR}><mesh geometry={geoI} material={mI} renderOrder={4} frustumCulled={false} /></group>
        <group scale={RR} rotation={[0.35, n.giro, 0.2]}><mesh geometry={geoR} material={mR} renderOrder={5} frustumCulled={false} /></group>
        {n.aLaranja > 0 && <group scale={RL} rotation={[-0.2, -n.giro * 1.5, 0.5]}><mesh geometry={geoL} material={mL} renderOrder={6} frustumCulled={false} /></group>}
        <mesh geometry={geoC} material={mC} renderOrder={7} frustumCulled={false} />
      </group>
    </group>
  );
};

// ponto brilhante solto (323-325,1 deriva para o topo)
export const Ponto: React.FC<{t: number; pos: THREE.Vector3; px: number; alfa: number; cor: [number, number, number]; gl: THREE.WebGLRenderer}> = ({t, pos, px, alfa, cor, gl}) => {
  const geo = useMemo(() => { const I = instancias(1); poe(I, 0, [0, 0, 0], [1, 1, 1, 1], [1, 0, 1, 0]); return geometriaSprites(I); }, []);
  const mat = useMemo(() => materialSprites({frag: FRAG_ESTRELA, minPx: 1, maxPx: 600, pos: 'cor.rgb *= vec3(uA, uB, uC);'}), []);
  const u = mat.uniforms;
  u.uRes.value.copy(resolucao(gl)); u.uT.value = t; u.uAlfa.value = alfa; u.uEscala.value = px * pos.length() / 1037;
  u.uA.value = cor[0]; u.uB.value = cor[1]; u.uC.value = cor[2];
  return <mesh geometry={geo} material={mat} position={pos} renderOrder={8} frustumCulled={false} />;
};
