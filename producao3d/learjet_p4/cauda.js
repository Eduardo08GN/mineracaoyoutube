// A cauda em T do Learjet 60 em corte (método teardown: a peça que trabalha se abre). Construída por código com os números
// de assets/referencias/_corpo_REFERENCIAS.md: estabilizador 4,47 m de envergadura, corda 1,52 m na raiz e 0,71 m na ponta,
// enflechamento 25°; profundor 2,18 m por lado, corda 0,41 → 0,18 m, 3 dobradiças; o estabilizador INTEIRO gira num pino
// atrás e é empurrado na frente por um atuador de fuso com 2 motores (primário: trim + Mach trim; secundário: reserva +
// piloto automático). Medidas da empenagem: AMM do Learjet 35, que deu a empenagem ao 60 (no take: "aprox.").
// Eixos como no learjet60.js: x para trás, y para cima, z para a esquerda. Origem = pino do estabilizador.
// Uma entrada só: incid (escala do indicador PITCH TRIM, 1 a 12) e prof (graus do profundor, + = bordo de fuga para cima).
import * as THREE from 'three';
import {loftChord} from './learjet60.js';

const D2R = Math.PI / 180;
const SEMI = 2.235, CR = 1.52, CT = 0.71, SWEEP = Math.tan(25 * D2R);
const PSPAN = 2.18, PCR = 0.41, PCT = 0.18;
export const PINO_X = 1.0; // pino a 1,0 m do bordo de ataque da raiz (viga traseira, à frente do profundor)
export const ATU_X = 0.18; // atuador sob o bordo de ataque

export function buildCauda({comDeriva = true} = {}) {
  const root = new THREE.Group();
  root.name = 'cauda';
  const pele = new THREE.MeshStandardMaterial({color: '#d4d2cc', roughness: 0.62, metalness: 0.05, transparent: true, side: THREE.DoubleSide});
  const metal = new THREE.MeshStandardMaterial({color: '#7d848b', roughness: 0.35, metalness: 0.8});
  const escuro = new THREE.MeshStandardMaterial({color: '#2c3238', roughness: 0.5, metalness: 0.3});
  const destaque = new THREE.MeshStandardMaterial({color: '#d4d2cc', roughness: 0.55, metalness: 0.05, emissive: new THREE.Color('#ff6a1a'), emissiveIntensity: 0});
  const mesh = (g, m) => {
    const o = new THREE.Mesh(g, m);
    o.castShadow = o.receiveShadow = true;
    return o;
  };

  // deriva (só o terço de cima): perfil fino, enflechada 35,6°, corta embaixo
  const fs = (y, x, chord) => ({le: [x - PINO_X, y, 0], chord, t: 0.09});
  const deriva = mesh(loftChord([fs(-1.6, -1.15, 2.35), fs(0.0, 0.0, 1.45)], {th: [0, 0, 1]}), pele.clone());
  deriva.name = 'deriva';
  if (comDeriva) root.add(deriva);

  // o estabilizador gira inteiro em volta do pino (eixo z)
  const estab = new THREE.Group();
  estab.name = 'estab';
  root.add(estab);
  const elevs = [];
  for (const s of [1, -1]) {
    const sec = (k) => {
      const z = s * SEMI * k, chord = CR + (CT - CR) * k;
      return {le: [SWEEP * SEMI * k - PINO_X, 0.02, z], chord, t: 0.085};
    };
    const secs = s > 0 ? [sec(0), sec(1)] : [sec(1), sec(0)];
    // parte fixa até a linha de articulação (a corda do profundor varia de 0,41 a 0,18 m ao longo dos 2,18 m)
    const fixo = mesh(loftChord(secs, {th: [0, 1, 0], c1: 1 - (PCR + PCT) / (CR + CT) }), pele.clone());
    fixo.name = s > 0 ? 'estabE' : 'estabD';
    estab.add(fixo);
    // profundor em 3 pedaços, cada um com pivô na dobradiça (o esquerdo é a peça do vídeo)
    const lado = [];
    for (let i = 0; i < 3; i++) {
      const k0 = (i / 3) * (PSPAN / SEMI), k1 = ((i + 1) / 3) * (PSPAN / SEMI);
      const A = sec(k0), B = sec(k1);
      const cA = PCR + (PCT - PCR) * (i / 3), cB = PCR + (PCT - PCR) * ((i + 1) / 3);
      const hA = A.le[0] + A.chord - cA, hB = B.le[0] + B.chord - cB;
      const g = loftChord(s > 0 ? [{le: [hA, 0.02, A.le[2]], chord: cA, t: 0.06}, {le: [hB, 0.02, B.le[2]], chord: cB, t: 0.06}] : [{le: [hB, 0.02, B.le[2]], chord: cB, t: 0.06}, {le: [hA, 0.02, A.le[2]], chord: cA, t: 0.06}], {th: [0, 1, 0]});
      const hinge = new THREE.Vector3((hA + hB) / 2, 0.02, (A.le[2] + B.le[2]) / 2);
      g.translate(-hinge.x, -hinge.y, -hinge.z);
      const piv = new THREE.Group();
      piv.position.copy(hinge);
      piv.rotation.order = 'YXZ';
      piv.rotation.y = s * Math.atan2(hB - hA, Math.abs(B.le[2] - A.le[2])); // a dobradiça é enflechada
      const m = mesh(g, s > 0 ? destaque : pele.clone());
      // pivô (eixo = linha da dobradiça) > deflexão (gira em z local) > malha (desfaz o giro do pivô para ficar no lugar)
      const defl = new THREE.Group();
      m.rotation.y = -piv.rotation.y;
      defl.add(m);
      piv.add(defl);
      piv.userData.defl = defl;
      piv.userData.home = piv.position.clone();
      estab.add(piv);
      lado.push(piv);
      // dobradiça: 3 por lado (interna, central, externa) = uma em cada pedaço
      const dob = mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), pele);
      dob.position.copy(hinge).add(new THREE.Vector3(-0.03, -0.06, 0));
      estab.add(dob);
    }
    if (s > 0) elevs.push(...lado);
  }

  // pino traseiro (eixo do giro) e atuador de fuso na frente, dentro da deriva
  const pino = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.34, 20), metal);
  pino.rotation.x = Math.PI / 2;
  root.add(pino);
  const atu = new THREE.Group();
  atu.name = 'atuador';
  atu.position.set(ATU_X - PINO_X, 0, 0);
  root.add(atu);
  const fuso = mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.9, 16), metal);
  fuso.position.y = -0.45;
  atu.add(fuso);
  // rosca: hélice fina em volta do fuso (gira com o motor)
  const rosca = new THREE.Group();
  const hel = new THREE.CatmullRomCurve3(Array.from({length: 200}, (_, i) => new THREE.Vector3(0.032 * Math.cos(i * 0.6), -0.88 + i * 0.0043, 0.032 * Math.sin(i * 0.6))));
  rosca.add(mesh(new THREE.TubeGeometry(hel, 400, 0.006, 6), metal));
  atu.add(rosca);
  const porca = mesh(new THREE.BoxGeometry(0.12, 0.09, 0.12), escuro);
  atu.add(porca);
  const motores = [0.09, -0.09].map((z, i) => {
    const mo = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 24), escuro);
    mo.rotation.x = Math.PI / 2;
    mo.position.set(0, -0.98, z * 0.5);
    atu.add(mo);
    return mo;
  });
  // cabos do profundor: sobem pela deriva até o chifre do profundor
  const cabo = new THREE.MeshBasicMaterial({color: '#3a4047'});
  const cabos = new THREE.Group();
  for (const dz of [0.03, -0.03]) {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.9, -1.6, dz), new THREE.Vector3(-0.2, -0.7, dz), new THREE.Vector3(0.35, -0.12, dz), new THREE.Vector3(0.5, -0.02, dz)]);
    cabos.add(new THREE.Mesh(new THREE.TubeGeometry(c, 60, 0.008, 6), cabo));
  }
  root.add(cabos);

  // fantasma da posição neutra do estabilizador (traço), para o giro de poucos graus ser visto
  const fantasma = new THREE.LineSegments(new THREE.EdgesGeometry(estab.children[0].geometry, 20), new THREE.LineBasicMaterial({color: '#1d2329', transparent: true, opacity: 0}));
  root.add(fantasma);

  // estado: incid na escala do indicador (6,5 = meio), prof em graus, raio-x (0..1) abre a pele da deriva e da raiz
  const set = ({incid = 6.5, prof = 0, raiox = 0, brilho = 0, solta = 0, roscaGiro = 0, fant = 0} = {}) => {
    estab.rotation.z = (incid - 6.5) * D2R; // N UP (12) = bordo de ataque para baixo = cauda empurrada para baixo
    for (const p of estab.children) if (p.userData.defl) p.userData.defl.rotation.z = prof * D2R;
    deriva.material.opacity = 1 - 0.82 * raiox;
    deriva.material.depthWrite = raiox < 0.5;
    for (const o of estab.children) if (o.name?.startsWith('estab')) o.material.opacity = 1 - 0.35 * raiox;
    porca.position.y = -(incid - 6.5) * 0.04; // a porca anda no fuso: 4 cm por grau (desenho; o curso real não é público)
    rosca.rotation.y = roscaGiro;
    destaque.emissiveIntensity = brilho * 0.9;
    destaque.color.set(brilho > 0.01 ? '#ff7a1f' : '#d4d2cc');
    fantasma.material.opacity = fant * 0.55;
    elevs.forEach((p, i) => {
      const v = Math.max(0, solta - i * 0.15);
      const h = p.userData.home;
      p.position.set(h.x + 1.6 * v * v, h.y - 0.9 * v * v + 0.15 * v, h.z + (i - 1) * 0.9 * v);
      p.rotation.x = v * (1.9 + i * 0.6);
    });
  };
  set();
  const corda = (a, L) => [-L, L].map((x) => root.localToWorld(new THREE.Vector3(x * Math.cos(a), 0.02 + x * Math.sin(a), 0.05)));
  const anchors = {
    corda: (L = 1.6) => ({atual: corda(estab.rotation.z, L), neutra: corda(0, L)}),
    profundor: () => elevs[1].localToWorld(new THREE.Vector3(0.1, 0, 0)),
    pino: () => pino.localToWorld(new THREE.Vector3()),
    atuador: () => porca.localToWorld(new THREE.Vector3()),
    motor: () => motores[0].localToWorld(new THREE.Vector3()),
    estab: () => estab.children[0].localToWorld(new THREE.Vector3(0.2, 0, 1.2)),
  };
  return {root, set, anchors, estab, elevs};
}
