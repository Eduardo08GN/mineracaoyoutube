// Cannon Beach, Oregon: Haystack Rock (72 m) facetado, casa de tijolo, estrada, praia larga.
// costa: linha d'agua (recua quando o Pacifico escoa para o equador). tremor 0..1: terremoto, poeira, a casa desaba.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Ceu, Cirros, Luz, Mar, Nuvens, Sol, rnd, smooth, useTexturas} from './comum';
import {MultidaoR, Pessoa, gerarPessoas, estadoPadrao} from './objetos';

const rocha = (raio: number, alt: number, seed: number, det = 2, rug = 0.18) => {
  const g = new THREE.IcosahedronGeometry(1, det);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i));
    const f = 1 + (rnd(seed + Math.round(v.x * 37 + v.y * 91 + v.z * 13)) - 0.5) * rug;
    p.setXYZ(i, v.x * raio * f, Math.max(-0.2, v.y) * alt * f, v.z * raio * 0.8 * f);
  }
  const ng = g.toNonIndexed(); ng.computeVertexNormals();
  const pp = ng.attributes.position, cor = new Float32Array(pp.count * 3);
  for (let i = 0; i < pp.count; i += 3) {
    const y = (pp.getY(i) + pp.getY(i + 1) + pp.getY(i + 2)) / 3, nY = ng.attributes.normal.getY(i);
    const verde = y > alt * 0.55 && nY > 0.45 && rnd(i + seed) < 0.7;
    const c = verde ? [0.42, 0.52, 0.32] : [0.52 + rnd(i) * 0.06, 0.52 + rnd(i) * 0.06, 0.5 + rnd(i) * 0.06];
    for (let k = 0; k < 3; k++) cor.set(c, (i + k) * 3);
  }
  ng.setAttribute('color', new THREE.BufferAttribute(cor, 3));
  return ng;
};

export const Oregon: React.FC<{t: number; luz: Luz; foco: THREE.Vector3; costa: number; tremor: number; tq: number}> = ({t, luz, foco, costa, tremor, tq}) => {
  const tx = useTexturas();
  useMemo(() => { tx.areia.repeat.set(60, 20); tx.asfalto.repeat.set(60, 1); tx.grama.repeat.set(80, 4); }, [tx]);
  const geoRocha = useMemo(() => rocha(38, 64, 3, 4, 0.06), []);  // domo arredondado como a Haystack Rock do original
  const pilares = useMemo(() => [rocha(5, 16, 7), rocha(3.5, 10, 9), rocha(4, 12, 11)], []);
  const gente = useMemo(() => gerarPessoas(46, {x0: -90, x1: 90, z0: -70, z1: -20}, 7, [['andando', 0.6], ['parado', 0.4]]), []);
  const naEstrada = useMemo(() => gerarPessoas(6, {x0: -40, x1: 40, z0: 0, z1: 6}, 8, [['andando', 1]]), []);
  const estado = (p: Pessoa, tt: number) => {
    const e = estadoPadrao(p, tt, -120, 120);
    if (tremor > 0.25 && rnd(p.i + 5) < 0.85) { e.caido = true; e.rz = (rnd(p.i) - 0.5) * 0.6; }
    return e;
  };
  // casa: inteira -> pecas caindo
  const pecas = useMemo(() => Array.from({length: 60}, (_, k) => ({x: (rnd(k) - 0.5) * 7, y: rnd(k + 1) * 5, z: (rnd(k + 2) - 0.5) * 5, s: 0.6 + rnd(k + 3) * 1.2, r: rnd(k + 4) * 6})), []);
  const colapso = smooth(0.15, 0.55, tremor);
  const casaPos: [number, number, number] = [-6, 0, -16];
  const poeira = useMemo(() => Array.from({length: 80}, (_, k) => ({a: rnd(k) * 6.28, r: rnd(k + 1), h: rnd(k + 2)})), []);
  const dust = useMemo(() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d')!;
    const g = c.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(205,185,150,0.85)'); g.addColorStop(1, 'rgba(205,185,150,0)');
    c.fillStyle = g; c.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  return (
    <>
      <Ceu luz={luz} centro={[foco.x, 0, foco.z]} nublado={0.75} />
      <Cirros luz={luz} tex={tx.cirros} centro={[foco.x, 0, foco.z]} />
      <Nuvens t={t} luz={luz} n={60} area={1800} centro={[foco.x, foco.z - 250]} altura={120} />
      <Sol luz={luz} foco={foco} area={110} />
      <fog attach="fog" args={[new THREE.Color(0.82, 0.84, 0.86), 120, 1600]} />
      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0, -700]}><planeGeometry args={[2400, 1400]} /><meshStandardMaterial map={tx.areia} color="#b7ad9f" roughness={1} /></mesh>
      {/* fundo exposto do mar: mais escuro e molhado, aparece conforme a agua recua */}
      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0.01, -320]}><planeGeometry args={[2400, 520]} /><meshStandardMaterial color="#8d8576" roughness={0.6} transparent opacity={smooth(-60, -200, costa) * 0.8} /></mesh>
      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0.02, 3]}><planeGeometry args={[2400, 8]} /><meshStandardMaterial map={tx.asfalto} roughness={0.9} /></mesh>
      {[-0.12, 0.12].map((d) => <mesh key={d} rotation-x={-Math.PI / 2} position={[0, 0.03, 3 + d]}><planeGeometry args={[2400, 0.12]} /><meshBasicMaterial color="#e2b93b" /></mesh>)}
      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0.02, 12]}><planeGeometry args={[2400, 10]} /><meshStandardMaterial map={tx.grama} roughness={1} /></mesh>
      <Mar t={t} luz={luz} costa={costa} nivel={0.05} espuma={0.8} />
      <mesh geometry={geoRocha} castShadow receiveShadow position={[18, 0, -150]}><meshStandardMaterial vertexColors flatShading roughness={0.95} /></mesh>
      {pilares.map((g, k) => <mesh key={k} geometry={g} castShadow position={[[-30, 52, 70][k], 0, [-170, -140, -190][k]]}><meshStandardMaterial vertexColors flatShading roughness={0.95} /></mesh>)}
      {/* casa */}
      {colapso < 0.02 ? (
        <group position={casaPos}>
          <mesh castShadow receiveShadow position={[0, 2.6, 0]}><boxGeometry args={[8, 5.2, 6]} /><meshStandardMaterial map={tx.tijolo} roughness={0.9} /></mesh>
          <mesh castShadow position={[0, 6.2, 0]} rotation={[0, 0, 0]}><cylinderGeometry args={[0.01, 4.8, 2.2, 4, 1]} /><meshStandardMaterial color="#5a2a22" flatShading /></mesh>
          {[[-2.2, 3.6], [2.2, 3.6], [-2.2, 1.6], [2.2, 1.6]].map(([x, y], k) => <mesh key={k} position={[x, y, 3.01]}><planeGeometry args={[1.1, 1.2]} /><meshStandardMaterial color="#1d2430" /></mesh>)}
          {[[3.6], [1.5]].map(([y], k) => <mesh key={k} position={[4.01, y, 0]} rotation-y={Math.PI / 2}><planeGeometry args={[1.1, 1.2]} /><meshStandardMaterial color="#1d2430" /></mesh>)}
        </group>
      ) : (
        <group position={casaPos}>
          {pecas.map((p, k) => {
            const q = Math.min(1, colapso * (1.2 + rnd(k) * 0.6));
            const y = p.y * (1 - q) + 0.3 * q, x = p.x * (1 + q * 0.5), z = p.z * (1 + q * 0.4);
            return <mesh key={k} castShadow position={[x, y, z]} rotation={[p.r * q, p.r, p.r * q * 0.5]}><boxGeometry args={[p.s * 1.4, p.s * 0.5, p.s]} /><meshStandardMaterial map={tx.tijolo} /></mesh>;
          })}
        </group>
      )}
      {tremor > 0.08 && poeira.map((d, k) => {
        const q = smooth(0.08, 0.5, tremor), r = 3 + d.r * 12 * q, deriva = -q * (6 + d.r * 20);
        return <sprite key={k} renderOrder={5 + k * 0.001} position={[casaPos[0] + Math.cos(d.a) * r + deriva, 1.5 + d.h * 7 * q, casaPos[2] + Math.sin(d.a) * r * 0.6 + q * 10]} scale={[5 + q * 8, 4 + q * 6, 1]}>
          <spriteMaterial map={dust} transparent opacity={0.3 * (1 - smooth(0.75, 1, tremor) * 0.7)} depthWrite={false} /></sprite>;
      })}
      <MultidaoR lista={gente} t={t} estado={estado} />
      <MultidaoR lista={naEstrada} t={t} estado={estado} />
    </>
  );
};
