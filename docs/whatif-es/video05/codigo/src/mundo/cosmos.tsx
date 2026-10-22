// Cosmos (dono: agente Cosmos). Monta em t < 6,4 (cold open: ceu de dentro da gigante vermelha) e em 260 <= t < 345:
// mancha e Andromeda por cima do ceu do agente Ceu (260-309,3), fusao das galaxias, chao de lava e gigante vermelha (309,3-321,4),
// interior do Sol e plasma esfriando (321,4-328,4), nebulosa planetaria, ana branca e campo de galaxias (328,4-345).
// Tudo e funcao de t. Os objetos ficam num grupo preso ao olho; no cold open o grupo gira para simular inclinacao de 7 graus
// (o trilho manda 22 graus ali, e o original mostra a lava no terco inferior).
import React from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {Perfil} from '../look/Look';
import {poseCamera} from '../roteiro';
import {CeuCosmos, ParCeu} from './cosmos_ceu';
import {Lava} from './cosmos_lava';
import {Andromeda, Estrias, EstrelasNovas, Mancha, PoseGalaxia} from './cosmos_galaxia';
import {CampoGalaxias, Nebulosa, Ponto, PoseNebulosa, faixaViaLactea} from './cosmos_nebulosa';

export {galaxiasCampo, faixaViaLactea} from './cosmos_nebulosa';
export type {GalaxiaCampo} from './cosmos_nebulosa';

// ---------- chaves de tempo ----------
type K = [number, number][];
const ss = (u: number) => u * u * (3 - 2 * u);
const kf = (t: number, K: K) => {
  if (t <= K[0][0]) return K[0][1];
  for (let i = 0; i < K.length - 1; i++) if (t <= K[i + 1][0]) {
    const [a, va] = K[i], [b, vb] = K[i + 1];
    return va + (vb - va) * ss((t - a) / Math.max(1e-6, b - a));
  }
  return K[K.length - 1][1];
};
const kfLog = (t: number, K: K) => Math.exp(kf(t, K.map(([a, v]) => [a, Math.log(v)] as [number, number])));
const RAD = Math.PI / 180;
const TAN_H = 0.9255, TAN_V = 0.5206;

// ---------- vistas de referencia ----------
const Q_FRIO = new THREE.Quaternion().setFromEuler(new THREE.Euler(7 * RAD, 0, 0, 'YXZ'));
const cacheQ = new Map<number, THREE.Quaternion>();
const qEm = (t: number) => { let q = cacheQ.get(t); if (!q) { q = poseCamera(t).quat.clone(); cacheQ.set(t, q); } return q; };
// direcao (unitaria) de um ponto do quadro da vista q: dx, dy em fracoes do meio-quadro
const noQuadro = (q: THREE.Quaternion, dx: number, dy: number) => new THREE.Vector3(dx * TAN_H, dy * TAN_V, -1).normalize().applyQuaternion(q);
const base = (q: THREE.Quaternion) => {
  const r = new THREE.Vector3(1, 0, 0).applyQuaternion(q), u = new THREE.Vector3(0, 1, 0).applyQuaternion(q), f = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
  return new THREE.Matrix3().set(r.x, u.x, f.x, r.y, u.y, f.y, r.z, u.z, f.z);
};
const FAIXA = faixaViaLactea();

// ---------- perfis (objetos fixos: o Look reconstroi o compositor quando o perfil muda) ----------
const P_FRIO: Perfil = {bloom: 0.7, limiar: 0.85, vinheta: 0.42, saturacao: 0.2, contraste: 0.06};
const P_LAVA: Perfil = {bloom: 0.7, limiar: 0.85, vinheta: 0.45, saturacao: 0.2, contraste: 0.06};
const P_SOL: Perfil = {bloom: 0.65, limiar: 0.9, vinheta: 0.38, saturacao: 0.15, contraste: 0.05};
const P_ESPACO: Perfil = {bloom: 1.0, limiar: 0.55, vinheta: 0.55, saturacao: 0.18, contraste: 0.08};
export const perfilCosmos = (t: number): Perfil => (t < 6.4 ? P_FRIO : t < 321.4 ? P_LAVA : t < 328.4 ? P_SOL : P_ESPACO);

// ---------- parametros do ceu por instante ----------
const parCeu = (t: number): ParCeu => {
  const p: ParCeu = {opaco: 0, mascara: 1, ganho: 1, chama: 0, brilho: 1, raios: 0, plasmaClaro: 0, sol: 0, esfria: 0, glow: 0, tinta: 0, teal: 0, via: 0,
    estrelas: 0, base: base(qEm(315)), glowDir: noQuadro(qEm(300), 0.05, 0.9), faixaN: FAIXA, solDir: noQuadro(qEm(315), -1.5, 2.2)};
  if (t < 6.4) {
    p.opaco = 1; p.mascara = 0; p.ganho = kf(t, [[0, 0], [0.4, 1]]) * (t < 5.9 ? 1 : 0);
    p.chama = 1; p.brilho = 1.0 + 0.06 * Math.sin(t * 1.7); p.base = base(Q_FRIO); p.solDir = noQuadro(Q_FRIO, -1.5, 2.2);
  } else if (t < 309.3) {
    p.glow = kf(t, [[299, 0], [301.5, 1], [309.3, 1]]);
    p.tinta = kf(t, [[304.6, 0], [307.5, 1]]);
  } else if (t < 321.4) {
    p.opaco = kf(t, [[309.3, 0.3], [312.5, 1]]); p.mascara = 0;
    p.tinta = kf(t, [[309.3, 1], [312, 0]]);
    p.glow = kf(t, [[309.3, 1], [311.5, 0]]);
    p.chama = 1;
    p.raios = kf(t, [[313.4, 1], [314.6, 0]]);
    p.brilho = kf(t, [[313.5, 0.6], [314.5, 0.72], [318.5, 1.45]]);
    p.plasmaClaro = kf(t, [[318.6, 0], [319.4, 1]]);
  } else if (t < 328.4) {
    p.opaco = 1; p.mascara = 0; p.sol = 1; p.base = base(qEm(322));
    p.esfria = kf(t, [[325.4, 0], [328.2, 1]]);
    p.estrelas = kf(t, [[325.6, 0], [327.5, 1]]);
  } else {
    p.opaco = 1; p.mascara = 0; p.estrelas = 1;
    p.teal = kf(t, [[328.3, 0], [328.8, 1], [336, 0.8], [338, 0.3]]);
    p.via = kf(t, [[328.3, 0.4], [337, 1]]);
  }
  return p;
};

const D_GAL = 1300;
const poseAndromeda = (t: number): PoseGalaxia => {
  const q = qEm(290);
  const f = kfLog(t, [[284, 0.05], [286, 0.075], [288, 0.095], [290, 0.12], [292, 0.165], [293, 0.21], [294, 0.27], [295.5, 0.5], [296.2, 0.68], [297, 0.88], [299, 0.93]]);
  const dx = kf(t, [[284, 0], [297, 0.06]]), dy = kf(t, [[284, 0.12], [288, 0], [297, 0], [299, 0.04], [303, 0.42], [309, 0.55]]);
  return {
    ancora: noQuadro(q, 0, 0).multiplyScalar(D_GAL), quat: q, desloc: new THREE.Vector3(dx * D_GAL * TAN_H, dy * D_GAL * TAN_V, 0),
    escala: f * D_GAL * TAN_H, incl: kf(t, [[294, 24], [295.5, 15], [296.4, 7], [297.2, 2.5], [300, 2]]) * RAD, giro: (t - 284) * 0.03,
    rolagem: kf(t, [[284, 6], [292, 10], [297, 16], [303, 12]]) * RAD,
    brilho: kf(t, [[283.8, 0], [284.2, 1], [305, 1], [309, 0.6], [311.5, 0]]),
    cauda: kf(t, [[294, 0], [295.5, 1.05]]), poeira: kf(t, [[295.5, 1], [297.3, 0]]), prof: kf(t, [[294.5, 1], [297, 0.15]]), nucleo: kf(t, [[295, 1], [297.5, 1.4], [305, 1.1]]), caudaAlfa: kf(t, [[293.9, 0], [294.1, 1], [296, 1], [297.5, 0]]),
  };
};
const poseNebulosa = (t: number): PoseNebulosa => {
  const q = qEm(340), D = 1000;
  return {
    ancora: noQuadro(q, 0, 0).multiplyScalar(D), quat: q, desloc: new THREE.Vector3(0, kf(t, [[328.3, 0.25], [329.2, 0]]) * D * TAN_V, 0),
    rRosa: kfLog(t, [[328.4, 0.06], [329.2, 0.075], [330.5, 0.16], [332.4, 0.22], [335, 0.33], [337.5, 0.45], [345, 0.6]]),
    aRosa: kf(t, [[328.5, 0], [328.7, 1], [331.5, 0.9], [333.5, 0.6], [336.5, 0.35], [338, 0.12], [345, 0.08]]),
    rLaranja: kfLog(t, [[330.6, 0.008], [331, 0.03], [331.6, 0.055], [332.4, 0.11], [333.5, 0.2], [335, 0.36], [336.5, 0.55], [337.5, 0.7]]),
    aLaranja: t < 330.6 ? 0 : kf(t, [[330.6, 0], [330.9, 1.4], [332.4, 1.2], [335, 0.95], [336.5, 0.5], [337.5, 0.1], [345, 0.06]]),
    aNevoa: kf(t, [[328.3, 0], [328.8, 0.8], [335, 0.7], [338, 0.25]]),
    aCentro: kf(t, [[328.4, 2.5], [336.5, 2.5], [337.5, 4]]), pxCentro: kf(t, [[328.5, 7], [336.5, 7], [337.5, 11]]), giro: (t - 328) * 0.02,
  };
};

const COR_ESTRIA: [number, number, number] = [1.0, 0.45, 0.15];

export const Cosmos: React.FC<{t: number}> = ({t}) => {
  const {gl} = useThree();
  const pose = poseCamera(t);
  const frio = t < 6.4;
  const qVirt = frio ? Q_FRIO : pose.quat;
  const qG = frio ? pose.quat.clone().multiply(Q_FRIO.clone().invert()) : new THREE.Quaternion();
  const dt = t >= 321.4;
  const p = parCeu(t);
  const temLava = (frio && t < 5.9) || (t >= 309.3 && t < 321.4);
  const lavaGanho = frio ? kf(t, [[0, 0], [0.4, 1]]) : kf(t, [[309.3, 0], [309.6, 1]]);
  // riscos de poeira so no cold open (fracos); de 260 em diante os rastros de estrela sao do agente Ceu
  const estrias = frio && t >= 0.4 && t < 5.9 ? 0.25 : 0;
  return (
    <group position={pose.pos} quaternion={qG}>
      <CeuCosmos t={t} p={p} depthTest={dt} />
      {temLava && <Lava t={t} altura={3} ganho={lavaGanho} escuro={kf(t, [[320.3, 0], [321.3, 1]])} ondula={frio ? 1 : 0.45}
        racha={frio ? 0.5 : kf(t, [[309.5, 0], [319, 1]])} calor={frio ? 1.1 : kf(t, [[309.3, 0.6], [310.5, 0.85], [314, 1], [318.5, 1.25]])} depthTest={false} />}
      {t >= 260.5 && t < 274.6 && <Mancha t={t} gl={gl} ancora={noQuadro(qEm(268), -0.04, 0.06).multiplyScalar(1000)} px={kf(t, [[261, 5], [274, 11]])}
        brilho={kf(t, [[260.5, 0], [261.5, 1]])} />}
      {t >= 283.8 && t < 311.5 && <Andromeda t={t} gl={gl} g={poseAndromeda(t)} />}
      {t >= 297 && t < 313.5 && <EstrelasNovas t={t} gl={gl} ancora={noQuadro(qEm(290), 0, 0).multiplyScalar(1200)} quat={qEm(290)}
        alfa={kf(t, [[311, 1], [313.4, 0]])} />}
      {t >= 323 && t < 325.6 && <Ponto t={t} gl={gl} pos={noQuadro(qEm(322), 0.02, kf(t, [[323, 0], [325.1, 0.85]])).multiplyScalar(1000)} px={15}
        alfa={kf(t, [[323, 0], [323.3, 1], [325.1, 1], [325.6, 0]])} cor={[2.6, 2.3, 1.8]} />}
      {t >= 328.3 && <Nebulosa t={t} gl={gl} n={poseNebulosa(t)} />}
      {t >= 336.5 && <CampoGalaxias t={t} gl={gl} alfa={kf(t, [[336.5, 0], [338, 1]])} />}
      {estrias > 0 && <Estrias t={t} gl={gl} quat={qVirt} alfa={estrias} cor={COR_ESTRIA} n={40} />}
    </group>
  );
};
