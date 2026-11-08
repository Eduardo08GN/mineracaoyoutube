// Ceu: domo com gradiente + brilho do horizonte (por do sol / cidade / amanhecer) + lua + estrelas; nuvens low-poly facetadas (mesma linguagem do kit); IBL (HDRI CC0 Poly Haven).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useLoader, useThree} from '@react-three/fiber';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js';
import {staticFile} from 'remotion';
import {Estagio} from './estagios';
import {cor, rnd} from './util';

export const VS = `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
export const FS = `
uniform vec3 uHor; uniform vec3 uMeio; uniform vec3 uZen; uniform vec3 uGlow; uniform vec3 uGlowDir; uniform float uGlowF; uniform vec3 uSol; uniform float uSolF; uniform vec3 uSolC;
uniform vec3 uLua; uniform float uLuaF; uniform float uEst; varying vec3 vD;
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  vec3 d = normalize(vD); float h = max(d.y, 0.0);
  vec3 c = mix(uHor, uMeio, smoothstep(0.0, 0.22, h)); c = mix(c, uZen, smoothstep(0.18, 0.85, h));
  float g = max(dot(d, normalize(uGlowDir)), 0.0);
  c += uGlow * (pow(g, 5.0) * 0.55 + pow(g, 40.0) * 0.5) * (1.0 - smoothstep(0.0, 0.5, h)) * uGlowF;
  if (uSolF > 0.0) { float s = max(dot(d, normalize(uSol)), 0.0); c += (pow(s, 260.0) * 9.0 + pow(s, 14.0) * 0.6) * uSolC * uSolF; }
  if (uEst > 0.01 && d.y > 0.02) {
    vec2 q = d.xz / (d.y + 0.35) * 80.0; vec2 gg = floor(q); float r = h2(gg);
    float st = step(0.986, r) * smoothstep(0.5, 0.0, length(fract(q) - 0.5 - (h2(gg + 3.0) - 0.5) * 0.5));
    c += st * (0.5 + 0.8 * h2(gg + 9.0)) * uEst * smoothstep(0.02, 0.3, d.y);
  }
  float m = dot(d, normalize(uLua));
  c += (smoothstep(0.9993, 0.9996, m) * vec3(1.0, 0.97, 0.9) * 5.0 + pow(max(m, 0.0), 90.0) * vec3(0.5, 0.6, 0.95) * 0.45) * uLuaF;
  gl_FragColor = vec4(max(c, vec3(0.0)), 1.0);
}`;
export const skyUniforms = (E: Estagio) => ({uHor: {value: cor(E.hor)}, uMeio: {value: cor(E.meio)}, uZen: {value: cor(E.zen)}, uGlow: {value: cor(E.glow)}, uGlowDir: {value: new THREE.Vector3(...E.glowDir)}, uGlowF: {value: E.glowForca},
  uSol: {value: new THREE.Vector3(...(E.sol ?? [0, -1, 0]))}, uSolF: {value: E.sol ? 1 : 0}, uSolC: {value: cor(E.solCor)},
  uLua: {value: new THREE.Vector3(...(E.lua ?? [0, -1, 0]))}, uLuaF: {value: E.lua ? 1 : 0}, uEst: {value: E.estrelas}});
export const Ceu: React.FC<{E: Estagio}> = ({E}) => {
  const {camera} = useThree();
  const mat = useMemo(() => new THREE.ShaderMaterial({side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false, vertexShader: VS, fragmentShader: FS,
    uniforms: {uHor: {value: cor(E.hor)}, uMeio: {value: cor(E.meio)}, uZen: {value: cor(E.zen)}, uGlow: {value: cor(E.glow)}, uGlowDir: {value: new THREE.Vector3(...E.glowDir)}, uGlowF: {value: E.glowForca},
      uSol: {value: new THREE.Vector3(...(E.sol ?? [0, -1, 0]))}, uSolF: {value: E.sol ? 1 : 0}, uSolC: {value: cor(E.solCor)},
      uLua: {value: new THREE.Vector3(...(E.lua ?? [0, -1, 0]))}, uLuaF: {value: E.lua ? 1 : 0}, uEst: {value: E.estrelas}}}), [E]);
  return <mesh name="ceu" material={mat} position={camera.position.toArray()} scale={9000} renderOrder={-10} frustumCulled={false}><sphereGeometry args={[1, 48, 24]} /></mesh>;
};

// nuvens: blocos facetados achatados, cor por vertice (base escura, topo claro), na frente da camera (-z)
export const Nuvens: React.FC<{E: Estagio}> = ({E}) => {
  const grupos = useMemo(() => {
    const base = cor(E.nuvem), topo = cor(E.nuvemTopo), out: THREE.Group[] = [];
    const mat = new THREE.MeshStandardMaterial({vertexColors: true, flatShading: true, roughness: 1, metalness: 0});
    for (let i = 0; i < E.nuvens; i++) {
      const az = (-1.1 + 2.2 * rnd(i * 3 + 1)) + Math.PI, dist = 900 + 600 * rnd(i * 3 + 2), alt = 90 + 200 * rnd(i * 3 + 3);
      const g = new THREE.Group();
      const nb = 5 + Math.floor(rnd(i + 40) * 5);
      for (let k = 0; k < nb; k++) {
        const geo = new THREE.IcosahedronGeometry(1, 1), p = geo.attributes.position, col = new Float32Array(p.count * 3);
        for (let v = 0; v < p.count; v++) {
          const w = THREE.MathUtils.clamp((p.getY(v) + 0.4) / 1.4, 0, 1), c = base.clone().lerp(topo, w * w);
          col[v * 3] = c.r; col[v * 3 + 1] = c.g; col[v * 3 + 2] = c.b;
        }
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        const m = new THREE.Mesh(geo, mat); const sc = 70 + 80 * rnd(i * 17 + k);
        m.scale.set(sc * 1.6, sc * 0.45, sc); m.position.set((k - nb / 2) * 100 + rnd(i + k) * 40, rnd(i * 5 + k) * 26, (rnd(i * 7 + k) - 0.5) * 70); g.add(m);
      }
      g.position.set(Math.sin(az) * dist, alt, Math.cos(az) * dist); g.rotation.y = az; out.push(g);
    }
    return out;
  }, [E]);
  return <group>{grupos.map((g, i) => <primitive key={i} object={g} />)}</group>;
};

const HDR = {dia: 'hdri/kloofendal_48d_partly_cloudy_puresky_2k.hdr', noite: 'hdri/qwantani_night_puresky_2k.hdr'};
export const Ambiente: React.FC<{E: Estagio}> = ({E}) => {
  const {scene, gl} = useThree();
  const hdr = useLoader(RGBELoader, staticFile(HDR[E.env]));
  const env = useMemo(() => { hdr.mapping = THREE.EquirectangularReflectionMapping; const pm = new THREE.PMREMGenerator(gl); const rt = pm.fromEquirectangular(hdr); pm.dispose(); return rt.texture; }, [hdr, gl]);
  scene.environment = env; (scene as any).environmentIntensity = E.envF;
  return null;
};

// luzes: chave lateral com sombra, contraluz de recorte (sem sombra), hemisferica de preenchimento
export const Luz: React.FC<{E: Estagio; foco: THREE.Vector3; area?: number}> = ({E, foco, area = 14}) => {
  const alvo = useMemo(() => { const o = new THREE.Object3D(); o.position.copy(foco); o.updateMatrixWorld(); return o; }, [foco.x, foco.y, foco.z]);
  const kp = foco.clone().addScaledVector(new THREE.Vector3(...E.key.dir), 80), rp = foco.clone().addScaledVector(new THREE.Vector3(...E.rim.dir), 80);
  return (
    <>
      <primitive object={alvo} />
      <directionalLight position={kp.toArray()} target={alvo} intensity={E.key.f} color={E.key.cor} castShadow shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-area} shadow-camera-right={area} shadow-camera-top={area} shadow-camera-bottom={-area} shadow-camera-near={1} shadow-camera-far={300} shadow-bias={-0.0004} shadow-normalBias={0.03} />
      <directionalLight position={rp.toArray()} target={alvo} intensity={E.rim.f} color={E.rim.cor} />
      <hemisphereLight args={[E.hemi.ceu, E.hemi.chao, E.hemi.f]} />
    </>
  );
};
