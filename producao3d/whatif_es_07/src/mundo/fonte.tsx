// Fonte do malecon: porte da fonte do video 6 (06_spun_slower/v1/src/mundo/calcadao.tsx, jatos balisticos em t) com a
// gravidade variando: a fase de cada gota vem da gravidade INTEGRADA (dados.balistico), entao o jato sobe mais alto e
// demora mais para cair quando o peso diminui, sem nada acumular entre quadros.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {rnd} from './comum';
import {balistico, FONTE, R_FONTE, V0_FONTE, Y_MAL} from './dados';

const N_CENTRO = 120, N_ANEL = 8, N_GOTA = 36;

const radial = () => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(64, 64, 8, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};

export const Fonte: React.FC<{tw: number; p: number}> = ({tw, p}) => {
  const obj = useMemo(() => {
    const g = new THREE.Group(); g.position.set(FONTE[0], Y_MAL, FONTE[1]);
    const pedra = new THREE.MeshStandardMaterial({color: '#e2dccf', roughness: 0.75});
    const perfil = [[0, 0.04], [R_FONTE - 0.25, 0.04], [R_FONTE - 0.25, 0.48], [R_FONTE - 0.05, 0.55], [R_FONTE + 0.25, 0.55], [R_FONTE + 0.3, 0.45], [R_FONTE + 0.3, 0]].map(([r, y]) => new THREE.Vector2(r, y));
    const bacia = new THREE.Mesh(new THREE.LatheGeometry(perfil, 64), pedra); bacia.castShadow = bacia.receiveShadow = true; g.add(bacia);
    const fundo = new THREE.Mesh(new THREE.CircleGeometry(R_FONTE - 0.25, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({color: '#1f86c9', roughness: 0.5}));
    fundo.position.y = 0.06; g.add(fundo);
    const agua = new THREE.Mesh(new THREE.CircleGeometry(R_FONTE - 0.25, 48).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({color: '#62c2ec', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.65, emissive: '#1b6e9a', emissiveIntensity: 0.3}));
    agua.position.y = 0.4; g.add(agua);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.62, 1.0, 24), pedra); ped.position.y = 0.5; ped.castShadow = true; g.add(ped);
    const taca = new THREE.Mesh(new THREE.LatheGeometry([[0.2, 0], [1.0, 0.28], [1.08, 0.36], [0.98, 0.36], [0.2, 0.12]].map(([r, y]) => new THREE.Vector2(r, y)), 40), pedra);
    taca.position.y = 1.0; taca.castShadow = true; g.add(taca);
    const gotaMat = new THREE.MeshStandardMaterial({color: '#effaff', emissive: '#bfe6ff', emissiveIntensity: 0.45, roughness: 0.1, transparent: true, opacity: 0.8, depthWrite: false});
    const gotas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 8, 6), gotaMat, N_CENTRO + N_ANEL * N_GOTA); gotas.frustumCulled = false; g.add(gotas);
    const esp = new THREE.Mesh(new THREE.RingGeometry(0.2, 1.7, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({map: radial(), color: '#ffffff', transparent: true, opacity: 0.4, depthWrite: false}));
    esp.position.y = 0.42; g.add(esp);
    return {g, gotas};
  }, []);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3();
  // jato central: cada gota tem a sua fase dentro do ciclo (fase0), o ciclo inteiro cresce com 1/g
  for (let j = 0; j < N_CENTRO; j++) {
    const b = balistico(tw, p, V0_FONTE, j / N_CENTRO + rnd(j) * 0.02);
    const vx = (rnd(j + 11) - 0.5) * 0.55, vz = (rnd(j + 23) - 0.5) * 0.55;
    pos.set(vx * b.tau, 1.4 + b.y, vz * b.tau);
    sc.set(1, 1 + Math.min(2.5, Math.abs(b.vy) * 0.35), 1);
    m4.compose(pos, q, sc); obj.gotas.setMatrixAt(j, m4);
  }
  for (let a = 0; a < N_ANEL; a++) {
    const ang = (a / N_ANEL) * Math.PI * 2, cx = Math.cos(ang), cz = Math.sin(ang), r0 = R_FONTE - 0.35;
    for (let j = 0; j < N_GOTA; j++) {
      const k = N_CENTRO + a * N_GOTA + j, b = balistico(tw, p, 4.0, j / N_GOTA + a * 0.13);
      const r = r0 - 1.45 * b.tau; pos.set(cx * r, 0.55 + b.y, cz * r);
      sc.set(1, 1 + Math.abs(b.vy) * 0.3, 1);
      m4.compose(pos, q, sc); obj.gotas.setMatrixAt(k, m4);
    }
  }
  obj.gotas.instanceMatrix.needsUpdate = true;
  return <primitive object={obj.g} />;
};
