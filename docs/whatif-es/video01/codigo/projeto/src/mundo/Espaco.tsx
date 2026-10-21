// A Terra vista do espaco: dia/noite com luzes das cidades, oceanos migrando para o equador, achatamento,
// anel de rochas arrancadas do equador, crosta derretida e a Lua em primeiro plano.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useTexture} from '@react-three/drei';
import {staticFile} from 'remotion';
import {rnd} from './comum';

const TERRA_VS = `varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const TERRA_FS = `
uniform sampler2D uDia; uniform sampler2D uNoite; uniform vec3 uSol; uniform float uMigr; uniform float uLava; uniform float uT; uniform float uRasgo;
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
void main(){
  vec3 d = texture2D(uDia, vUv).rgb;
  float lat = abs(vUv.y - 0.5) * 180.0;
  float oceano = smoothstep(0.02, 0.10, d.b - max(d.r, d.g));
  d = mix(min(d * 1.45, vec3(1.0)), vec3(0.07, 0.25, 0.52) + d * 0.7, oceano);
  // oceanos deixam os polos (fundo exposto) e se acumulam no equador (cobre a terra perto do equador)
  float sai = oceano * smoothstep(70.0 - uMigr * 45.0, 75.0 - uMigr * 45.0, lat);
  d = mix(d, vec3(0.55, 0.52, 0.47), sai * smoothstep(0.0, 0.15, uMigr));
  float cobre = (1.0 - oceano) * (1.0 - smoothstep(uMigr * 18.0, uMigr * 18.0 + 4.0, lat));
  d = mix(d, vec3(0.08, 0.27, 0.54), cobre * 0.85);
  vec3 N = normalize(vN), L = normalize(uSol);
  float lam = dot(N, L);
  float luz = smoothstep(-0.15, 0.35, lam);
  vec3 noite = texture2D(uNoite, vUv).rgb * vec3(1.0, 0.82, 0.55) * 1.6;
  vec3 c = d * (0.06 + 1.05 * max(lam, 0.0)) + noite * (1.0 - luz) * (1.0 - uLava);
  vec3 V = normalize(cameraPosition - vW);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  c += vec3(0.35, 0.6, 1.0) * fres * (0.25 + 0.9 * max(lam + 0.2, 0.0)) * (1.0 - uLava);
  c += pow(max(dot(reflect(-L, N), V), 0.0), 40.0) * oceano * 0.5 * luz;
  // rasgos na crosta (incandescentes) e depois a bola de magma
  float k = n(vUv * vec2(40.0, 20.0) + uT * 0.05) * 0.7 + n(vUv * vec2(120.0, 60.0)) * 0.3;
  float rasgo = smoothstep(0.52 - uRasgo * 0.08, 0.50 - uRasgo * 0.08, abs(k - 0.5)) * uRasgo;
  c = mix(c, vec3(1.6, 0.6, 0.15), rasgo);
  float pl = n(vUv * vec2(14.0, 7.0) + 2.0) * 0.6 + n(vUv * vec2(40.0, 20.0)) * 0.4;
  vec3 lava = mix(vec3(1.45, 1.0, 0.45), vec3(1.6, 1.25, 0.65), smoothstep(0.3, 0.8, k));
  lava = mix(lava, vec3(0.55, 0.28, 0.1), smoothstep(0.52, 0.6, pl) * 0.9);
  c = mix(c, lava * (0.8 + 0.3 * max(lam, 0.0)), uLava);
  gl_FragColor = vec4(c, 1.0); gl_FragColor.rgb = pow(max(gl_FragColor.rgb, vec3(0.0)), vec3(2.2));
}`;
const HALO_FS = `uniform vec3 uSol; uniform float uForca; varying vec3 vN; varying vec3 vW;
void main(){ vec3 N = normalize(vN), V = normalize(cameraPosition - vW); float f = pow(1.0 - abs(dot(N, V)), 3.0);
  float l = smoothstep(-0.3, 0.5, dot(N, normalize(uSol))); gl_FragColor = vec4(vec3(0.35, 0.6, 1.0) * f * l * uForca, f * l * uForca); gl_FragColor.rgb = pow(max(gl_FragColor.rgb, vec3(0.0)), vec3(2.2)); }`;
const HALO_VS = `varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

export type EspacoP = {
  t: number; giro: number; sol: THREE.Vector3; camPos: THREE.Vector3; alvo: THREE.Vector3;
  migr?: number; achata?: number; anel?: number; rasgo?: number; lava?: number; lua?: number; ar?: number; escalaTerra?: number;
};

export const Espaco: React.FC<EspacoP> = ({t, giro, sol, migr = 0, achata = 0, anel = 0, rasgo = 0, lava = 0, lua = 0, ar = 0, escalaTerra = 1}) => {
  const [dia, noite, luaTex] = useTexture([staticFile('terra_dia.jpg'), staticFile('terra_noite.jpg'), staticFile('lua.jpg')]);
  useMemo(() => { for (const x of [dia, noite]) { x.colorSpace = THREE.NoColorSpace; x.anisotropy = 8; x.needsUpdate = true; } luaTex.colorSpace = THREE.SRGBColorSpace; }, [dia, noite, luaTex]);
  const mat = useMemo(() => new THREE.ShaderMaterial({toneMapped: false, vertexShader: TERRA_VS, fragmentShader: TERRA_FS,
    uniforms: {uDia: {value: dia}, uNoite: {value: noite}, uSol: {value: new THREE.Vector3()}, uMigr: {value: 0}, uLava: {value: 0}, uT: {value: 0}, uRasgo: {value: 0}}}), [dia, noite]);
  const halo = useMemo(() => new THREE.ShaderMaterial({transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: HALO_VS, fragmentShader: HALO_FS, uniforms: {uSol: {value: new THREE.Vector3()}, uForca: {value: 1}}}), []);
  mat.uniforms.uSol.value.copy(sol); mat.uniforms.uMigr.value = migr; mat.uniforms.uLava.value = lava; mat.uniforms.uT.value = t; mat.uniforms.uRasgo.value = rasgo;
  halo.uniforms.uSol.value.copy(sol); halo.uniforms.uForca.value = 0.6 * (1 - lava);

  // anel: rochas instanciadas, espalhadas num disco que cresce a partir do equador
  const N = 16000;
  const {rochas, base} = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 0);
    const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({roughness: 0.95, flatShading: true}), N);
    m.frustumCulled = false;
    const c = new THREE.Color(), base = [] as {r: number; a: number; y: number; s: number; w: number}[];
    for (let i = 0; i < N; i++) {
      base.push({r: 1.12 + Math.pow(rnd(i), 0.8) * 2.9, a: rnd(i + 1) * Math.PI * 2, y: (rnd(i + 2) - 0.5) * 0.06, s: 0.006 + Math.pow(rnd(i + 3), 3) * 0.03, w: 0.5 + rnd(i + 4)});
      const v = 0.6 + rnd(i + 5) * 0.4; m.setColorAt(i, c.setRGB(0.7 * v, 0.6 * v, 0.47 * v));
    }
    m.instanceColor!.needsUpdate = true;
    return {rochas: m, base};
  }, []);
  if (anel > 0) {
    const o = new THREE.Object3D();
    base.forEach((b, i) => {
      const aparece = Math.min(1, Math.max(0, (anel * 1.3 - rnd(i + 9) * 0.3)));
      const r = 1.0 + (b.r - 1.0) * aparece;
      const a = b.a + t * 0.25 / Math.pow(b.r, 1.5) * b.w;
      o.position.set(Math.cos(a) * r, b.y * (0.3 + aparece), Math.sin(a) * r);
      o.rotation.set(i, i * 0.7 + t * b.w, 0); o.scale.setScalar(aparece > 0 ? b.s : 0.00001); o.updateMatrix();
      rochas.setMatrixAt(i, o.matrix);
    });
    rochas.instanceMatrix.needsUpdate = true;
    (rochas.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(1, 0.4, 0.1);
    (rochas.material as THREE.MeshStandardMaterial).emissiveIntensity = lava * 0.25;
    (rochas.material as THREE.MeshStandardMaterial).color.setRGB(1, 1 - lava * 0.25, 1 - lava * 0.45);
  }
  // nevoa de ar escapando pelo equador
  const arPts = useMemo(() => {
    const g = new THREE.BufferGeometry(), n = 6000, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const a = rnd(i + 50) * Math.PI * 2, r = 1.02 + Math.pow(rnd(i + 51), 2) * 0.6; p.set([Math.cos(a) * r, (rnd(i + 52) - 0.5) * 0.12 * r, Math.sin(a) * r], i * 3); }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3)); return g;
  }, []);
  const estrelas = useMemo(() => {
    const g = new THREE.BufferGeometry(), n = 5000, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const u = rnd(i + 700) * 2 - 1, a = rnd(i + 701) * Math.PI * 2, s = Math.sqrt(1 - u * u); p.set([s * Math.cos(a) * 400, u * 400, s * Math.sin(a) * 400], i * 3); }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3)); return g;
  }, []);
  return (
    <>
      <color attach="background" args={['#030304']} />
      <Nebulosa />
      <points geometry={estrelas}><pointsMaterial color="#cfd8ff" size={0.9} sizeAttenuation={false} transparent opacity={0.8} toneMapped={false} /></points>
      <directionalLight position={sol.clone().multiplyScalar(50).toArray()} intensity={3.2} />
      <ambientLight intensity={0.04} />
      <group scale={escalaTerra}>
        <group scale={[1 + achata * 0.35, 1 - achata * 0.4, 1 + achata * 0.35]}>
          <mesh material={mat} rotation={[0, giro, 0]}><sphereGeometry args={[1, 128, 64]} /></mesh>
          <mesh material={halo} scale={1.06}><sphereGeometry args={[1, 64, 32]} /></mesh>
        </group>
        {ar > 0 && <points geometry={arPts} rotation={[0, giro * 0.3, 0]}><pointsMaterial color="#9ec6ff" size={1.6} sizeAttenuation={false} transparent opacity={0.35 * ar} depthWrite={false} toneMapped={false} /></points>}
        {anel > 0 && <primitive object={rochas} />}
      </group>
      {lua > 0 && (
        <mesh position={[-2.75, -0.15, 3.65]} rotation={[0, 2.6, 0]}>
          <sphereGeometry args={[0.95, 96, 48]} />
          <meshStandardMaterial map={luaTex} roughness={1} />
        </mesh>
      )}
    </>
  );
};

// nevoa de nebulosa cinza muito sutil no fundo (o espaco do original nao e preto chapado)
const NEB_FS = `varying vec3 vD;
float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }
float n(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(h(i), h(i+vec3(1,0,0)), f.x), mix(h(i+vec3(0,1,0)), h(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(h(i+vec3(0,0,1)), h(i+vec3(1,0,1)), f.x), mix(h(i+vec3(0,1,1)), h(i+vec3(1,1,1)), f.x), f.y), f.z); }
void main(){ vec3 d = normalize(vD); float v = n(d * 3.0) * 0.55 + n(d * 7.0) * 0.3 + n(d * 15.0) * 0.15;
  float m = smoothstep(0.45, 0.85, v) * smoothstep(-0.2, 0.6, -d.x * 0.6 - d.y * 0.5 + 0.2);
  gl_FragColor = vec4(vec3(0.03, 0.03, 0.034) * m, 1.0); gl_FragColor.rgb = pow(max(gl_FragColor.rgb, vec3(0.0)), vec3(2.2)); }`;
const Nebulosa: React.FC = () => {
  const mat = useMemo(() => new THREE.ShaderMaterial({side: THREE.BackSide, depthWrite: false, toneMapped: false,
    vertexShader: `varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`, fragmentShader: NEB_FS}), []);
  return <mesh material={mat} scale={500} renderOrder={-20}><sphereGeometry args={[1, 32, 16]} /></mesh>;
};
