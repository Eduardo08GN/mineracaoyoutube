// Efeitos do video "You Got Hotter": chamas (billboard com ruido, instanciadas), fumaca/vapor, brilho da areia,
// maos que esquentam (pele -> vermelho -> branco), bola de fogo e galaxia com o clarao. Tudo dirigido pelo quadro.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {rnd, smooth} from './comum';

// ---------------- chamas ----------------
const CHAMA_VS = `
uniform float uAlt; varying vec2 vUv; varying float vSeed;
void main(){
  vec3 c = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  float s = length(instanceMatrix[0].xyz);
  vec3 dir = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 p = c + dir * position.x * s + vec3(0.0, 1.0, 0.0) * (position.y + 0.5) * s * uAlt;
  vUv = uv; vSeed = fract(c.x * 0.137 + c.z * 0.713);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const CHAMA_FS = `
uniform float uT; uniform float uForca; varying vec2 vUv; varying float vSeed;
float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ return n(p) * 0.55 + n(p * 2.1) * 0.3 + n(p * 4.3) * 0.15; }
void main(){
  float y = vUv.y, x = (vUv.x - 0.5) * 2.0;
  float nz = fbm(vec2(vUv.x * 3.0 + vSeed * 17.0, y * 2.2 - uT * (2.4 + vSeed)));
  float larg = (1.0 - y) * 0.85 + 0.08;
  float forma = 1.0 - smoothstep(larg * 0.55, larg, abs(x) + (nz - 0.5) * 0.7);
  forma *= smoothstep(0.0, 0.07, y) * (1.0 - smoothstep(0.45 + nz * 0.45, 1.0, y));
  vec3 col = mix(vec3(0.92, 0.32, 0.04), vec3(1.0, 0.62, 0.16), smoothstep(0.2, 0.8, forma));
  col = mix(col, vec3(1.0, 0.84, 0.42), smoothstep(0.75, 1.0, forma * (1.0 - y * 0.9)));
  gl_FragColor = vec4(col * (0.55 + 0.45 * uForca), clamp(forma * 1.2, 0.0, 0.92)); gl_FragColor.rgb = pow(max(gl_FragColor.rgb, vec3(0.0)), vec3(2.2));
}`;
export type Fogo = {x: number; y?: number; z: number; s: number; t0: number};
export const Chamas: React.FC<{lista: Fogo[]; t: number; forca?: number; alt?: number}> = ({lista, t, forca = 1.6, alt = 1.7}) => {
  const {malha, mat} = useMemo(() => {
    const mat = new THREE.ShaderMaterial({transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
      vertexShader: CHAMA_VS, fragmentShader: CHAMA_FS, uniforms: {uT: {value: 0}, uForca: {value: 1}, uAlt: {value: 1.7}}});
    const malha = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, Math.max(1, lista.length));
    malha.frustumCulled = false; malha.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    return {malha, mat};
  }, [lista]);
  const o = new THREE.Object3D();
  lista.forEach((f, k) => {
    const idade = t - f.t0;
    const cresce = idade <= 0 ? 0 : Math.min(1, idade / 1.5) * (0.85 + 0.15 * Math.sin(t * 7 + k));
    o.position.set(f.x, f.y ?? 0, f.z); o.scale.setScalar(Math.max(1e-4, f.s * cresce)); o.updateMatrix();
    malha.setMatrixAt(k, o.matrix);
  });
  malha.instanceMatrix.needsUpdate = true;
  mat.uniforms.uT.value = t; mat.uniforms.uForca.value = forca; mat.uniforms.uAlt.value = alt;
  return <primitive object={malha} />;
};

// ---------------- fumaca e vapor (sprites que sobem) ----------------
const texMacia = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d')!;
    const g = c.createRadialGradient(64, 64, 2, 64, 64, 62); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 128, 128); t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
})();
export const Fumaca: React.FC<{fontes: {x: number; z: number; y?: number}[]; t: number; t0?: number; cor?: string; n?: number; escala?: number; subida?: number; opac?: number}> =
  ({fontes, t, t0 = 0, cor = '#3b3532', n = 10, escala = 6, subida = 3, opac = 0.55}) => {
  const tex = texMacia();
  const els: React.ReactNode[] = [];
  fontes.forEach((f, i) => {
    for (let k = 0; k < n; k++) {
      const per = 6 + rnd(i * 31 + k) * 4, fase = rnd(i * 17 + k) * per;
      const idade = ((t - t0 + fase) % per + per) % per; if (t < t0) continue;
      const u = idade / per, y = (f.y ?? 0) + 1 + idade * subida, s = escala * (0.6 + u * 2.2);
      els.push(<sprite key={`${i}_${k}`} renderOrder={10 + i * 0.01 + k * 0.0001} position={[f.x + Math.sin(idade * 0.6 + k) * u * escala * 0.4, y, f.z + Math.cos(idade * 0.5 + i) * u * escala * 0.3]} scale={[s, s, 1]}>
        <spriteMaterial map={tex} color={cor} transparent opacity={opac * Math.sin(Math.PI * u)} depthWrite={false} /></sprite>);
    }
  });
  return <group>{els}</group>;
};

// ---------------- areia em brasa (disco aditivo que cresce em volta de voce) ----------------
export const BrasaAreia: React.FC<{centro: [number, number]; raio: number; forca: number; cor?: THREE.Color}> = ({centro, raio, forca, cor}) => {
  const tex = texMacia();
  if (forca <= 0.001 || raio <= 0.1) return null;
  const c = cor ?? new THREE.Color(1.0, 0.32, 0.08);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[centro[0], 0.06, centro[1]]} renderOrder={2}>
      <planeGeometry args={[raio * 2, raio * 2]} />
      <meshBasicMaterial map={tex} color={c.clone().multiplyScalar(forca)} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

// ---------------- maos (presas a camera): pele -> vermelho -> laranja -> branco incandescente ----------------
const corCalor = (q: number) => {
  const pele = new THREE.Color('#e7c39f');
  if (q <= 0) return {cor: pele, emis: new THREE.Color(0, 0, 0)};
  const verm = new THREE.Color(0.9, 0.12, 0.04), lar = new THREE.Color(1.0, 0.55, 0.12), bra = new THREE.Color(1.0, 0.97, 0.88);
  const e = q < 0.33 ? new THREE.Color(0, 0, 0).lerp(verm, q / 0.33) : q < 0.66 ? verm.clone().lerp(lar, (q - 0.33) / 0.33) : lar.clone().lerp(bra, (q - 0.66) / 0.34);
  return {cor: pele.clone().lerp(e, Math.min(1, q * 1.4)), emis: e.multiplyScalar(0.6 + q * 3.5)};
};
export const Maos: React.FC<{cam: THREE.Camera; t: number; op: number; calor: number; alto?: boolean}> = ({cam, t, op, calor, alto = false}) => {
  if (op <= 0) return null;
  const {cor, emis} = corCalor(calor);
  const m = <meshStandardMaterial color={cor} emissive={emis} roughness={0.7} transparent opacity={op} toneMapped={calor < 0.5} />;
  const tex = texMacia();
  const mao = (lado: 1 | -1) => (
    <group position={alto ? [lado * 0.085, 0.2, -0.42] : [lado * 0.1, 0.03, -0.4]} rotation={alto ? [0.25, -lado * 0.1, -lado * 0.05] : [0.08, -lado * 0.1, -lado * 0.1]}>
      <mesh><boxGeometry args={[0.092, 0.1, 0.03]} />{m}</mesh>
      {[-0.033, -0.011, 0.011, 0.033].map((x, i) => {
        const a = [0.05, 0.058, 0.055, 0.044][i];
        return (<group key={i} position={[x, 0.05, 0]} rotation={[0, 0, -lado * (i - 1.5) * 0.06]}>
          <mesh position={[0, a * 0.45, 0]}><capsuleGeometry args={[0.0105, a * 0.55, 4, 10]} />{m}</mesh>
          <mesh position={[0, a * 1.05, 0]}><capsuleGeometry args={[0.0098, a * 0.4, 4, 10]} />{m}</mesh></group>);
      })}
      <group position={[lado * 0.047, -0.02, 0.006]} rotation={[0.25, 0, -lado * 0.42]}>
        <mesh position={[0, 0.022, 0]}><capsuleGeometry args={[0.012, 0.03, 4, 10]} />{m}</mesh>
        <mesh position={[0, 0.058, 0]}><capsuleGeometry args={[0.011, 0.024, 4, 10]} />{m}</mesh>
      </group>
      <group position={[0, -0.05, 0.02]} rotation={[-0.75, 0, lado * 0.12]}>
        <mesh position={[0, -0.03, 0]}><boxGeometry args={[0.1, 0.06, 0.1]} /><meshStandardMaterial color="#141519" roughness={0.9} transparent opacity={op} /></mesh>
        <mesh position={[0, -0.24, 0]}><boxGeometry args={[0.088, 0.38, 0.088]} /><meshStandardMaterial color="#111216" roughness={0.9} transparent opacity={op} /></mesh>
      </group>
      {calor > 0.2 && <sprite position={[0, 0.06, 0.01]} scale={[0.25 + calor * 0.5, 0.25 + calor * 0.5, 1]}>
        <spriteMaterial map={tex} color={emis.clone().multiplyScalar(0.5)} transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={op * smooth(0.2, 0.6, calor)} toneMapped={false} /></sprite>}
    </group>
  );
  const tremor = Math.sin(t * 31) * 0.0015;
  if (alto) {
    const braco = (lado: 1 | -1) => {
      const B = new THREE.Vector3(lado * 0.2, -0.5, -0.62), T = new THREE.Vector3(lado * 0.075, 0.36, -0.95);
      const meio = B.clone().add(T).multiplyScalar(0.5), L = B.distanceTo(T);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), T.clone().sub(B).normalize());
      return (
        <group key={lado}>
          <mesh position={meio.toArray()} quaternion={q}><boxGeometry args={[0.1, L, 0.1]} /><meshBasicMaterial color="#121317" /></mesh>
          <mesh position={T.clone().add(new THREE.Vector3(0, 0.07, -0.02)).toArray()} quaternion={q}><boxGeometry args={[0.09, 0.1, 0.03]} />{m}</mesh>
        </group>
      );
    };
    return (
      <group position={cam.position.toArray()} quaternion={cam.quaternion}>
        <group position={[tremor, 0, 0]}>{braco(-1)}{braco(1)}</group>
        <sprite position={[0, 0.42, -0.95]} scale={[1.2 + calor * 0.8, 0.8 + calor * 0.5, 1]}>
          <spriteMaterial map={tex} color={new THREE.Color(1, 0.95, 0.85).multiplyScalar(1.4)} transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={op * (0.5 + calor * 0.5)} toneMapped={false} /></sprite>
        <pointLight position={[0, 0.3, -0.6]} intensity={calor * 60} distance={60} color={emis} />
      </group>
    );
  }
  return (
    <group position={cam.position.toArray()} quaternion={cam.quaternion}>
      <group position={[tremor, 0, 0]}>{mao(-1)}{mao(1)}</group>
      {calor > 0.5 && <pointLight position={[0, -0.05, -0.5]} intensity={calor * 25} distance={30} color={emis} />}
    </group>
  );
};

// ---------------- bola de fogo (esfera brilhante + coroa de chamas) ----------------
export const BolaFogo: React.FC<{centro: [number, number, number]; raio: number; t: number}> = ({centro, raio, t}) => {
  const lista = useMemo<Fogo[]>(() => Array.from({length: 90}, (_, k) => {
    const a = rnd(k) * Math.PI * 2, b = Math.acos(2 * rnd(k + 1) - 1);
    return {x: Math.sin(b) * Math.cos(a), y: Math.cos(b), z: Math.sin(b) * Math.sin(a), s: 0.7 + rnd(k + 2) * 0.6, t0: -10};
  }), []);
  const escal = lista.map((f) => ({...f, x: centro[0] + f.x * raio * 0.85, y: centro[1] + f.y * raio * 0.85, z: centro[2] + f.z * raio * 0.85, s: f.s * raio}));
  return (
    <group>
      <mesh position={centro}><sphereGeometry args={[raio * 0.8, 48, 32]} /><meshBasicMaterial color={new THREE.Color(1.6, 1.0, 0.45)} toneMapped={false} /></mesh>
      <Chamas lista={escal} t={t} forca={2.2} alt={1.4} />
    </group>
  );
};

// ---------------- galaxia em espiral + clarao ----------------
export const Galaxia: React.FC<{t: number; clarao: number; branco?: number}> = ({t, clarao, branco = 0}) => {
  const {geo, flareTex} = useMemo(() => {
    const N = 140000, p = new Float32Array(N * 3), c = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const braco = i % 2, bojo = rnd(i + 6) < 0.18;
      const r = bojo ? Math.pow(rnd(i), 2) * 2.2 : 0.8 + Math.pow(rnd(i), 1.3) * 9.5;
      const a = bojo ? rnd(i + 1) * Math.PI * 2 : braco * Math.PI + r * 0.62 + (rnd(i + 1) - 0.5) * 1.15 * (1.1 - r / 14);
      const esp = (rnd(i + 2) - 0.5) * (bojo ? 0.9 : 0.35) * (1.2 - r / 12);
      const sp = 0.25 + r * 0.06;
      p.set([Math.cos(a) * r + (rnd(i + 3) - 0.5) * sp, esp, Math.sin(a) * r + (rnd(i + 4) - 0.5) * sp], i * 3);
      const nucleo = Math.max(0, 1 - r / 3);
      c.set([0.75 + nucleo * 0.25, 0.78 + nucleo * 0.12, 0.95 - nucleo * 0.35], i * 3);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3)); geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
    return {geo, flareTex: texMacia()};
  }, []);
  const posFlare: [number, number, number] = [2.6, 0.05, 1.4];
  const s = 0.3 + clarao * 9;
  return (
    <group rotation={[0.55, t * 0.01, 0.15]}>
      <color attach="background" args={['#020306']} />
      <points geometry={geo}><pointsMaterial size={0.03} vertexColors transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></points>
      <sprite scale={[5, 5, 1]}><spriteMaterial map={flareTex} color={new THREE.Color(1, 0.86, 0.6)} transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.9} toneMapped={false} /></sprite>
      {clarao > 0 && <sprite position={posFlare} scale={[s, s, 1]}><spriteMaterial map={flareTex} color={new THREE.Color(1, 0.97, 0.9).multiplyScalar(1 + clarao * 2)} transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={Math.min(1, 0.4 + clarao)} toneMapped={false} /></sprite>}
      {branco > 0 && <sprite position={posFlare} scale={[60, 60, 1]}><spriteMaterial color="#ffffff" transparent opacity={branco} depthWrite={false} toneMapped={false} /></sprite>}
    </group>
  );
};

// ---------------- areia aquecida: rosa com manchas vermelhas, depois laranja incandescente, em volta de voce ----------------
const AREIA_VS = `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const AREIA_FS = `
uniform vec2 uEu; uniform float uR; uniform float uForca; uniform float uFase; uniform float uVidro; varying vec3 vW;
float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ return n(p) * 0.5 + n(p * 2.1) * 0.3 + n(p * 4.4) * 0.2; }
void main(){
  float d = length(vW.xz - uEu);
  float a = (1.0 - smoothstep(uR * 0.55, uR, d)) * uForca;
  float m = fbm(vW.xz * 0.22);
  float m2 = fbm(vW.xz * 0.9 + 7.0);
  vec3 rosa = mix(vec3(0.93, 0.66, 0.56), vec3(0.78, 0.33, 0.27), smoothstep(0.45, 0.62, m * 0.7 + m2 * 0.3));
  vec3 laranja = mix(vec3(1.25, 0.62, 0.22), vec3(1.05, 0.38, 0.12), smoothstep(0.4, 0.7, m));
  vec3 c = mix(rosa, laranja, uFase);
  // vidro escuro logo em volta de voce (a areia derreteu)
  float v = (1.0 - smoothstep(2.0, 9.0 + m * 4.0, d)) * uVidro;
  c = mix(c, vec3(0.13, 0.11, 0.1), v);
  gl_FragColor = vec4(c, clamp(a * (0.75 + 0.25 * m) + v, 0.0, 0.95)); gl_FragColor.rgb = pow(max(gl_FragColor.rgb, vec3(0.0)), vec3(2.2));
}`;
export const AreiaQuente: React.FC<{eu: [number, number]; raio: number; forca: number; fase: number; vidro?: number}> = ({eu, raio, forca, fase, vidro = 0}) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2,
    vertexShader: AREIA_VS, fragmentShader: AREIA_FS, uniforms: {uEu: {value: new THREE.Vector2()}, uR: {value: 1}, uForca: {value: 0}, uFase: {value: 0}, uVidro: {value: 0}}}), []);
  if (forca <= 0.001 && vidro <= 0.001) return null;
  mat.uniforms.uEu.value.set(eu[0], eu[1]); mat.uniforms.uR.value = raio; mat.uniforms.uForca.value = forca; mat.uniforms.uFase.value = fase; mat.uniforms.uVidro.value = vidro;
  return (
    <group>
      <mesh material={mat} rotation-x={-Math.PI / 2} position={[0, 0.03, -6]}><planeGeometry args={[900, 20]} /></mesh>
      <mesh material={mat} rotation-x={-Math.PI / 2} position={[0, 0.315, 16]}><planeGeometry args={[900, 28]} /></mesh>
    </group>
  );
};

// ---------------- parede de vapor sobre o mar (sprites grandes, brancos, na frente da camera) ----------------
export const Vapor: React.FC<{cam: THREE.Camera; t: number; forca: number}> = ({cam, t, forca}) => {
  if (forca <= 0.001) return null;
  const tex = texMacia();
  const fw = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).setY(0).normalize(), lado = new THREE.Vector3(-fw.z, 0, fw.x);
  const els: React.ReactNode[] = [];
  for (let k = 0; k < 36; k++) {
    const dist = 6 + rnd(k) * 60, lat = (rnd(k + 1) - 0.5) * dist * 1.8, y = 0.5 + rnd(k + 2) * 6 + ((t * 0.6 + rnd(k + 3) * 8) % 8);
    const p = cam.position.clone().add(fw.clone().multiplyScalar(dist)).add(lado.clone().multiplyScalar(lat + Math.sin(t * 0.3 + k) * 2)).setY(y);
    const s = 8 + dist * 0.6;
    els.push(<sprite key={k} renderOrder={20 - dist * 0.01} position={p.toArray()} scale={[s, s * 0.7, 1]}><spriteMaterial map={tex} color="#f4f1ea" transparent opacity={Math.min(1, forca * (0.55 + rnd(k + 4) * 0.4))} depthWrite={false} fog={false} /></sprite>);
  }
  return <group>{els}</group>;
};
