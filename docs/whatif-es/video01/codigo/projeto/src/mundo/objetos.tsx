// Objetos instanciados (multidao, palmeiras, mobiliario de praia, carros, predios) e a fonte de particulas.
// Padrao: o objeto three e criado uma vez (useMemo) e atualizado na propria renderizacao (deterministico por quadro).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {rnd} from './comum';
import {faseJato} from '../fisica';

const tmp = new THREE.Object3D();
const M = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const E = new THREE.Euler();
const V = new THREE.Vector3();
const S1 = new THREE.Vector3(1, 1, 1);

const instanciado = (geo: THREE.BufferGeometry, mat: THREE.Material, n: number, sombra = true) => {
  const m = new THREE.InstancedMesh(geo, mat, n);
  m.castShadow = sombra; m.receiveShadow = true; m.frustumCulled = false;
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  return m;
};

// ---------------- multidao ----------------
export type Pose = 'andando' | 'parado' | 'deitado' | 'sentado' | 'correndo';
export type Pessoa = {i: number; x: number; z: number; rot: number; pose: Pose; vel: number};
export type Estado = {x: number; y: number; z: number; rx?: number; ry: number; rz?: number; caido?: boolean; balanco?: number; corre?: boolean};
const CAMISA = ['#e45b3a', '#2f6fd6', '#f2f2f2', '#2fa66a', '#e8b52c', '#9b4dca', '#d23b5f', '#1f9fb5', '#f08a24', '#3a3f4b'];
const CALCA = ['#3a3f4b', '#7b6b5a', '#2d4a73', '#55606e', '#c9b38f', '#1f2a44'];
const PELE = ['#e9c39d', '#c8956b', '#8d5a3b', '#f1d2b4', '#a87148'];
const CABELO = ['#2b2018', '#1a1a1a', '#6b4a2b', '#c9a35e', '#3b2a1c'];

export const gerarPessoas = (n: number, area: {x0: number; x1: number; z0: number; z1: number}, semente = 0, poses: [Pose, number][] = [['andando', 0.35], ['parado', 0.45], ['deitado', 0.2]]) => {
  const out: Pessoa[] = [];
  const total = poses.reduce((a, p) => a + p[1], 0);
  for (let i = 0; i < n; i++) {
    const s = i + semente * 1000;
    let r = rnd(s + 77) * total, pose: Pose = poses[0][0];
    for (const [p, w] of poses) { if (r < w) { pose = p; break; } r -= w; }
    const vel = pose === 'andando' ? 1.1 + rnd(s + 5) * 0.4 : pose === 'correndo' ? 3.2 + rnd(s + 5) : 0;
    out.push({i: s, x: area.x0 + rnd(s) * (area.x1 - area.x0), z: area.z0 + rnd(s + 50) * (area.z1 - area.z0),
      rot: pose === 'andando' || pose === 'correndo' ? (rnd(s + 13) < 0.5 ? Math.PI / 2 : -Math.PI / 2) + (rnd(s + 14) - 0.5) * 0.5 : rnd(s + 9) * Math.PI * 2, pose, vel});
  }
  return out;
};

// estado padrao: anda em linha reta (dentro da faixa x), parado oscila, deitado no chao
export const estadoPadrao = (p: Pessoa, t: number, x0 = -200, x1 = 200): Estado => {
  let x = p.x + Math.sin(p.rot) * p.vel * t, z = p.z + Math.cos(p.rot) * p.vel * t;
  const L = x1 - x0; x = ((x - x0) % L + L) % L + x0;
  return {x, y: 0, z, ry: p.rot, caido: p.pose === 'deitado'};
};

export class Multidao {
  pernas: THREE.InstancedMesh; torsos: THREE.InstancedMesh; cabecas: THREE.InstancedMesh; cabelos: THREE.InstancedMesh; bracos: THREE.InstancedMesh;
  grupo = new THREE.Group();
  constructor(public lista: Pessoa[]) {
    const n = lista.length, mat = new THREE.MeshStandardMaterial({roughness: 0.85});
    this.pernas = instanciado(new THREE.CylinderGeometry(0.075, 0.065, 0.86, 6).translate(0, -0.43, 0), mat, n * 2);
    this.torsos = instanciado(new THREE.CylinderGeometry(0.17, 0.2, 0.58, 8), mat, n);
    // cabeca arredondada (low-poly, como a do original) e cabelo em calota
    this.cabecas = instanciado(new THREE.IcosahedronGeometry(0.135, 1).scale(1, 1.1, 1), mat, n);
    this.cabelos = instanciado(new THREE.SphereGeometry(0.142, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5).translate(0, -0.05, 0), mat, n);
    this.bracos = instanciado(new THREE.CylinderGeometry(0.055, 0.05, 0.62, 6).translate(0, -0.31, 0), mat, n * 2);
    const c = new THREE.Color();
    lista.forEach((p, k) => {
      const camisa = CAMISA[Math.floor(rnd(p.i + 1) * CAMISA.length)], calca = CALCA[Math.floor(rnd(p.i + 2) * CALCA.length)];
      const pele = PELE[Math.floor(rnd(p.i + 3) * PELE.length)], cab = CABELO[Math.floor(rnd(p.i + 4) * CABELO.length)];
      this.torsos.setColorAt(k, c.set(camisa)); this.cabecas.setColorAt(k, c.set(pele)); this.cabelos.setColorAt(k, c.set(cab));
      for (const s of [0, 1]) { this.pernas.setColorAt(k * 2 + s, c.set(calca)); this.bracos.setColorAt(k * 2 + s, c.set(rnd(p.i + 6) < 0.5 ? pele : camisa)); }
    });
    for (const m of [this.pernas, this.torsos, this.cabecas, this.cabelos, this.bracos]) { m.instanceColor!.needsUpdate = true; this.grupo.add(m); }
  }
  atualizar(t: number, estado: (p: Pessoa, t: number) => Estado) {
    const base = new THREE.Matrix4(), parte = new THREE.Matrix4();
    this.lista.forEach((p, k) => {
      const e = estado(p, t);
      const corre = !!e.corre && !e.caido;
      const anda = (corre || p.pose === 'andando' || p.pose === 'correndo') && !e.caido;
      const cad = corre || p.pose === 'correndo' ? 2.6 : 1.8;
      const amp = anda ? Math.asin(Math.min(0.9, (corre ? 4.5 : p.vel) / cad / 2 / 0.9)) : 0;
      const fase = 2 * Math.PI * cad * t + p.i;
      const sw = anda ? Math.sin(fase) * amp : 0;
      const ocioso = !anda ? Math.sin(t * 1.3 + p.i) * 0.05 + (e.balanco ?? 0) : 0;
      const quique = anda ? Math.abs(Math.cos(fase)) * 0.03 : 0;
      E.set(e.rx ?? 0, e.ry, e.rz ?? 0, 'YXZ'); Q.setFromEuler(E);
      base.compose(V.set(e.x, e.y + quique, e.z), Q, S1);
      if (e.caido) base.multiply(parte.makeTranslation(0, 0.13, 0)).multiply(parte.makeRotationX(-Math.PI / 2)).multiply(parte.makeTranslation(0, -0.9, 0)).multiply(parte.makeTranslation(0, 0.9, 0));
      const at = (dx: number, dy: number, rx: number, rz = 0) => M.copy(base).multiply(parte.compose(V.set(dx, dy, 0), Q.setFromEuler(E.set(rx, 0, rz)), S1));
      const sentado = p.pose === 'sentado' && !corre;
      for (const s of [-1, 1]) {
        this.pernas.setMatrixAt(k * 2 + (s > 0 ? 1 : 0), at(s * 0.1, sentado ? 0.5 : 0.9, sentado ? -1.5 : s * sw));
        this.bracos.setMatrixAt(k * 2 + (s > 0 ? 1 : 0), at(s * 0.28, (sentado ? 1.02 : 1.42), -s * sw * 0.8 + ocioso * s, s * (0.06 + (e.balanco ?? 0) * 2)));
      }
      const dy = sentado ? -0.4 : 0;
      this.torsos.setMatrixAt(k, at(0, 1.19 + dy, 0)); this.cabecas.setMatrixAt(k, at(0, 1.62 + dy, 0)); this.cabelos.setMatrixAt(k, at(0, 1.77 + dy, 0));
    });
    for (const m of [this.pernas, this.torsos, this.cabecas, this.cabelos, this.bracos]) m.instanceMatrix.needsUpdate = true;
  }
}
export const MultidaoR: React.FC<{lista: Pessoa[]; t: number; estado: (p: Pessoa, t: number) => Estado; cam?: THREE.Vector3}> = ({lista, t, estado, cam}) => {
  const m = useMemo(() => new Multidao(lista), [lista]);
  m.atualizar(t, cam ? (p, tt) => { const e = estado(p, tt); if (Math.hypot(e.x - cam.x, e.z - cam.z) < 3.5 && e.y < cam.y + 1) e.y = -200; return e; } : estado);
  return <primitive object={m.grupo} />;
};

// ---------------- palmeiras ----------------
const geoPalmeira = (h: number, curva: number) => {
  const pts: THREE.Vector3[] = [];
  for (let k = 0; k <= 10; k++) { const u = k / 10; pts.push(new THREE.Vector3(curva * u * u * 1.6, u * h, 0)); }
  const curvaT = new THREE.CatmullRomCurve3(pts);
  const tronco = new THREE.TubeGeometry(curvaT, 24, 0.17, 7, false);
  // aneis do tronco por cor de vertice
  const pos = tronco.attributes.position, cores = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); const v = 0.78 + 0.22 * (Math.sin(y * 9) > 0.6 ? 0.55 : 1); cores.set([0.42 * v, 0.33 * v, 0.22 * v], i * 3); }
  tronco.setAttribute('color', new THREE.BufferAttribute(cores, 3));
  const topo = curvaT.getPoint(1);
  const folhas: THREE.BufferGeometry[] = [];
  const nf = 11;
  for (let f = 0; f < nf; f++) {
    const comp = 3.6 + rnd(f + h) * 1.2, larg = 1.25, seg = 10;
    const g = new THREE.PlaneGeometry(larg, comp, 1, seg);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) + comp / 2, u = y / comp;
      const queda = -Math.pow(u, 1.8) * comp * (0.55 + rnd(f) * 0.3);
      const x = p.getX(i) * (1 - u * 0.25);
      p.setXYZ(i, x, queda + u * 0.6, y);
      // vinco central
      p.setY(i, p.getY(i) - Math.abs(x) * 0.25);
    }
    g.computeVertexNormals();
    const ang = (f / nf) * Math.PI * 2 + rnd(f * 3) * 0.3, inc = -0.15 + rnd(f * 7) * 0.5;
    g.rotateX(-inc); g.rotateY(ang); g.translate(topo.x, topo.y, topo.z);
    folhas.push(g);
  }
  return {tronco, folha: mergeGeometries(folhas)};
};

export class Palmeiras {
  grupo = new THREE.Group();
  constructor(posicoes: {x: number; z: number; h: number; rot: number}[], folhaTex: THREE.Texture) {
    const variantes = [geoPalmeira(9, 1.4), geoPalmeira(11, -1.0), geoPalmeira(7.5, 0.8)];
    const matT = new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.95});
    const matF = new THREE.MeshStandardMaterial({map: folhaTex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.75, color: '#d8e8c0'});
    const prof = new THREE.MeshDepthMaterial({depthPacking: THREE.RGBADepthPacking, map: folhaTex, alphaTest: 0.45});
    variantes.forEach((v, k) => {
      const lista = posicoes.filter((_, i) => i % 3 === k);
      if (!lista.length) return;
      const tr = instanciado(v.tronco, matT, lista.length), fo = instanciado(v.folha, matF, lista.length);
      fo.customDepthMaterial = prof;
      lista.forEach((p, i) => {
        tmp.position.set(p.x, 0, p.z); tmp.rotation.set(0, p.rot, 0); tmp.scale.setScalar(p.h / [9, 11, 7.5][k]); tmp.updateMatrix();
        tr.setMatrixAt(i, tmp.matrix); fo.setMatrixAt(i, tmp.matrix);
      });
      this.grupo.add(tr, fo);
    });
  }
}
export const PalmeirasR: React.FC<{pos: {x: number; z: number; h: number; rot: number}[]; tex: THREE.Texture}> = ({pos, tex}) => {
  const p = useMemo(() => new Palmeiras(pos, tex), [pos, tex]);
  return <primitive object={p.grupo} />;
};

// ---------------- mobiliario e veiculos (objetos simples instanciados, com estado opcional por instancia) ----------------
export type Item = {x: number; z: number; rot: number; cor?: string; y?: number; rx?: number; rz?: number};
const geoGuardaSol = () => mergeGeometries([new THREE.CylinderGeometry(0.03, 0.03, 2.3, 6).translate(0, 1.15, 0), new THREE.ConeGeometry(1.25, 0.5, 10, 1, true).translate(0, 2.3, 0)]);
const geoCadeira = () => mergeGeometries([new THREE.BoxGeometry(0.65, 0.06, 1.3).translate(0, 0.32, 0.15), new THREE.BoxGeometry(0.65, 0.06, 0.65).rotateX(-1.0).translate(0, 0.55, -0.6),
  new THREE.BoxGeometry(0.05, 0.3, 0.05).translate(0.28, 0.15, 0.7), new THREE.BoxGeometry(0.05, 0.3, 0.05).translate(-0.28, 0.15, 0.7), new THREE.BoxGeometry(0.05, 0.3, 0.05).translate(0.28, 0.15, -0.4), new THREE.BoxGeometry(0.05, 0.3, 0.05).translate(-0.28, 0.15, -0.4)]);
const geoBanco = () => mergeGeometries([new THREE.BoxGeometry(1.8, 0.08, 0.5).translate(0, 0.45, 0), new THREE.BoxGeometry(1.8, 0.45, 0.08).translate(0, 0.72, -0.22),
  new THREE.BoxGeometry(0.08, 0.45, 0.45).translate(0.8, 0.22, 0), new THREE.BoxGeometry(0.08, 0.45, 0.45).translate(-0.8, 0.22, 0)]);
const geoPoste = () => mergeGeometries([new THREE.CylinderGeometry(0.06, 0.08, 5, 8).translate(0, 2.5, 0), new THREE.BoxGeometry(0.9, 0.08, 0.12).translate(0.4, 5, 0), new THREE.BoxGeometry(0.4, 0.12, 0.3).translate(0.8, 4.94, 0)]);
const geoCarro = () => mergeGeometries([new THREE.BoxGeometry(1.8, 0.65, 4.2).translate(0, 0.55, 0), new THREE.BoxGeometry(1.6, 0.55, 2.2).translate(0, 1.15, -0.2)]);
const geoToalha = () => new THREE.BoxGeometry(0.9, 0.04, 1.8).translate(0, 0.02, 0);
const GEO: Record<string, () => THREE.BufferGeometry> = {guardasol: geoGuardaSol, cadeira: geoCadeira, banco: geoBanco, poste: geoPoste, carro: geoCarro, toalha: geoToalha};

export class Itens {
  malha: THREE.InstancedMesh;
  constructor(tipo: string, public lista: Item[], corPadrao = '#ffffff') {
    const mat = new THREE.MeshStandardMaterial({roughness: tipo === 'carro' ? 0.35 : 0.8, metalness: tipo === 'carro' ? 0.3 : 0, side: tipo === 'guardasol' ? THREE.DoubleSide : THREE.FrontSide});
    this.malha = instanciado(GEO[tipo](), mat, lista.length);
    const c = new THREE.Color();
    lista.forEach((it, k) => this.malha.setColorAt(k, c.set(it.cor ?? corPadrao)));
    this.malha.instanceColor!.needsUpdate = true;
    this.atualizar(lista);
  }
  atualizar(lista: Item[]) {
    lista.forEach((it, k) => {
      tmp.position.set(it.x, it.y ?? 0, it.z); tmp.rotation.set(it.rx ?? 0, it.rot, it.rz ?? 0); tmp.scale.setScalar(1); tmp.updateMatrix();
      this.malha.setMatrixAt(k, tmp.matrix);
    });
    this.malha.instanceMatrix.needsUpdate = true;
  }
}
export const ItensR: React.FC<{tipo: string; lista: Item[]; mover?: (it: Item, k: number) => Item; cor?: string}> = ({tipo, lista, mover, cor}) => {
  const it = useMemo(() => new Itens(tipo, lista, cor), [tipo, lista, cor]);
  if (mover) it.atualizar(lista.map(mover));
  return <primitive object={it.malha} />;
};

// ---------------- fonte de particulas (balistica com a gravidade efetiva) ----------------
const FONTE_VS = `
attribute float aS; uniform float uF; uniform float uG; uniform float uEsc; varying float vA;
void main(){
  float s = aS, jato = floor(s * 9.0);
  float ang = jato / 8.0 * 6.2831853;
  bool centro = jato > 7.5;
  vec3 noz = centro ? vec3(0.0, 0.6, 0.0) : vec3(cos(ang) * 2.2, 0.5, sin(ang) * 2.2);
  float vy = centro ? 11.5 : 7.2;
  vec3 vh = centro ? vec3(0.0) : vec3(-cos(ang), 0.0, -sin(ang)) * 0.9;
  float jit = fract(s * 913.17);
  vy *= 0.94 + 0.12 * jit; vh += vec3(fract(s * 57.3) - 0.5, 0.0, fract(s * 91.7) - 0.5) * 0.35;
  float g = max(uG, 0.12);
  float vida = min(2.0 * vy / g, 16.0);
  // uF = integral de dt/vida de uma gota de referencia (8 m/s); cada gota anda na proporcao 8/vy (ver faseJato)
  float idade = fract(uF * 8.0 / vy + fract(s * 173.3)) * vida;
  vec3 p = noz + vh * idade + vec3(0.0, vy * idade - 0.5 * g * idade * idade, 0.0);
  vA = smoothstep(0.0, 0.15, idade) * (1.0 - smoothstep(vida * 0.85, vida, idade)) * step(-0.2, p.y);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uEsc * (0.6 + jit * 0.8) / -mv.z;
}`;
const FONTE_FS = `uniform float uDia; varying float vA; void main(){ vec2 q = gl_PointCoord - 0.5; float r = dot(q, q); if (r > 0.25) discard;
  gl_FragColor = vec4(mix(vec3(0.75,0.82,0.92), vec3(1.0), 0.6) * (0.45 + 0.55 * uDia), vA * (1.0 - r * 3.0) * 0.9); gl_FragColor.rgb = pow(max(gl_FragColor.rgb, vec3(0.0)), vec3(2.2)); }`;
export const Fonte: React.FC<{t: number; g: number; dia: number; pos: [number, number, number]; n?: number; escala?: number}> = ({t, g, dia, pos, n = 6000, escala = 190}) => {
  const {geo, mat} = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = (i + 0.5) / n;
    geo.setAttribute('aS', new THREE.BufferAttribute(a, 1));
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const mat = new THREE.ShaderMaterial({transparent: true, depthWrite: false, toneMapped: false, vertexShader: FONTE_VS, fragmentShader: FONTE_FS,
      uniforms: {uF: {value: 0}, uG: {value: 9.81}, uEsc: {value: 900}, uDia: {value: 1}}});
    return {geo, mat};
  }, [n]);
  mat.uniforms.uF.value = faseJato(t, 8, 0.12, 16); mat.uniforms.uG.value = g; mat.uniforms.uEsc.value = escala; mat.uniforms.uDia.value = dia;
  return (
    <group position={pos}>
      <points geometry={geo} material={mat} frustumCulled={false} />
      <mesh receiveShadow castShadow position={[0, 0.25, 0]}><cylinderGeometry args={[3.4, 3.6, 0.5, 40]} /><meshStandardMaterial color="#d7d2c8" roughness={0.7} /></mesh>
      <mesh position={[0, 0.46, 0]} rotation-x={-Math.PI / 2}><circleGeometry args={[3.1, 40]} /><meshStandardMaterial color="#2f8fd6" roughness={0.15} metalness={0.1} /></mesh>
      <mesh castShadow position={[0, 0.7, 0]}><cylinderGeometry args={[0.35, 0.45, 0.5, 16]} /><meshStandardMaterial color="#cfc8bb" /></mesh>
    </group>
  );
};

// ---------------- predios (caixas com janelas; acendem a noite) ----------------
export const Predios: React.FC<{lista: {x: number; z: number; w: number; d: number; h: number}[]; dia: number; tex: THREE.Texture; texN: THREE.Texture}> = ({lista, dia, tex, texN}) => {
  const {malha, mat} = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({map: tex, emissiveMap: texN, emissive: new THREE.Color(1, 1, 1), roughness: 0.6});
    const geo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    const malha = instanciado(geo, mat, lista.length);
    lista.forEach((b, k) => { tmp.position.set(b.x, 0, b.z); tmp.rotation.set(0, 0, 0); tmp.scale.set(b.w, b.h, b.d); tmp.updateMatrix(); malha.setMatrixAt(k, tmp.matrix); });
    return {malha, mat};
  }, [lista, tex, texN]);
  mat.emissiveIntensity = 1.4 * (1 - dia);
  return <primitive object={malha} />;
};
