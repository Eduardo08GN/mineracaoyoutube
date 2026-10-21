// Pecas compartilhadas: ceu (dia/noite/estrelas), nuvens em tufo, cirros, luz do sol, mar, texturas de canvas.
// Tudo dirigido pelos parametros recebidos (sem useFrame, sem Math.random): deterministico quadro a quadro.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useTexture} from '@react-three/drei';
import {staticFile} from 'remotion';

export const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (a: number, b: number, x: number) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };

// ---------- iluminacao do dia ----------
export type Luz = {dia: number; ocaso: number; sol: THREE.Vector3};
// elev em radianos (positivo = dia), azimute em radianos
export const luzDe = (elev: number, azim = 0.9): Luz => {
  const sol = new THREE.Vector3(Math.cos(elev) * Math.sin(azim), Math.sin(elev), Math.cos(elev) * Math.cos(azim)).normalize();
  const dia = smooth(-0.12, 0.22, Math.sin(elev));
  const ocaso = Math.max(0, 1 - Math.abs(Math.sin(elev)) / 0.38) * smooth(-0.3, 0.0, Math.sin(elev));
  return {dia, ocaso, sol};
};

// ---------- texturas de canvas (geradas uma vez, com seed fixa) ----------
const canvasTex = (w: number, h: number, desenha: (c: CanvasRenderingContext2D) => void, repetir = true) => {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  desenha(cv.getContext('2d')!);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repetir) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

export const useTexturas = () => useMemo(() => {
  const areia = canvasTex(512, 512, (c) => {
    c.fillStyle = '#c9b89c'; c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) {
      const v = rnd(i) ; c.fillStyle = v < 0.5 ? `rgba(120,100,75,${0.10 + rnd(i + 3) * 0.12})` : `rgba(255,248,230,${0.10 + rnd(i + 5) * 0.12})`;
      c.fillRect(rnd(i + 7) * 512, rnd(i + 11) * 512, 1 + rnd(i + 13) * 2, 1 + rnd(i + 17) * 2);
    }
    c.strokeStyle = 'rgba(110,90,65,0.10)'; c.lineWidth = 3;
    for (let k = 0; k < 14; k++) { c.beginPath(); for (let x = 0; x <= 512; x += 16) c.lineTo(x, k * 37 + Math.sin(x * 0.03 + k) * 6); c.stroke(); }
  });
  const lajota = canvasTex(512, 512, (c) => {
    const n = 8, s = 512 / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const v = 0.92 + rnd(i * 31 + j) * 0.1;
      c.fillStyle = `rgb(${Math.round(222 * v)},${Math.round(205 * v)},${Math.round(170 * v)})`; c.fillRect(i * s, j * s, s, s);
    }
    c.strokeStyle = 'rgba(120,100,80,0.55)'; c.lineWidth = 3;
    for (let i = 0; i <= n; i++) { c.beginPath(); c.moveTo(i * s, 0); c.lineTo(i * s, 512); c.stroke(); c.beginPath(); c.moveTo(0, i * s); c.lineTo(512, i * s); c.stroke(); }
  });
  const asfalto = canvasTex(256, 256, (c) => {
    c.fillStyle = '#3d4250'; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 3000; i++) { c.fillStyle = `rgba(255,255,255,${rnd(i) * 0.06})`; c.fillRect(rnd(i + 1) * 256, rnd(i + 2) * 256, 1, 1); }
  });
  const grama = canvasTex(256, 256, (c) => {
    c.fillStyle = '#4f5a35'; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 5000; i++) { c.fillStyle = `rgba(${90 + rnd(i) * 60},${100 + rnd(i + 1) * 50},40,0.35)`; c.fillRect(rnd(i + 2) * 256, rnd(i + 3) * 256, 1, 2); }
  });
  // folha de palmeira: nervura central + foliolos finos (alpha)
  const folha = canvasTex(128, 512, (c) => {
    c.clearRect(0, 0, 128, 512);
    for (let k = 0; k < 70; k++) {
      const y = 20 + k * 6.8, L = 58 * Math.sin(Math.PI * (0.08 + 0.92 * k / 70)) + 6;
      const g = 95 + Math.round(rnd(k) * 40);
      c.strokeStyle = `rgb(${40 + Math.round(rnd(k + 2) * 25)},${g},${35})`; c.lineWidth = 3.2;
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(64, y); c.quadraticCurveTo(64 + s * L * 0.5, y + 6, 64 + s * L, y + 22); c.stroke(); }
    }
    c.strokeStyle = '#5b6b2e'; c.lineWidth = 4; c.beginPath(); c.moveTo(64, 0); c.lineTo(64, 512); c.stroke();
  }, false);
  // cirros: riscos longos e suaves
  const cirros = canvasTex(1024, 512, (c) => {
    c.clearRect(0, 0, 1024, 512);
    c.filter = 'blur(6px)';
    for (let i = 0; i < 70; i++) {
      const x = rnd(i) * 1024, y = 60 + rnd(i + 1) * 400, L = 120 + rnd(i + 2) * 320, a = -0.35 + rnd(i + 3) * 0.2;
      c.strokeStyle = `rgba(255,255,255,${0.10 + rnd(i + 4) * 0.25})`; c.lineWidth = 3 + rnd(i + 5) * 9;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + L * 0.5, y + L * a * 0.3 - 10, x + L, y + L * a); c.stroke();
    }
  }, false);
  // janelas de predio (dia e noite)
  const janela = canvasTex(256, 512, (c) => {
    c.fillStyle = '#b9c2cc'; c.fillRect(0, 0, 256, 512);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 16; j++) {
      c.fillStyle = rnd(i * 41 + j) < 0.5 ? '#3d5670' : '#58748f'; c.fillRect(10 + i * 41, 10 + j * 31, 28, 20);
    }
  });
  const janelaNoite = canvasTex(256, 512, (c) => {
    c.fillStyle = '#000'; c.fillRect(0, 0, 256, 512);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 16; j++) {
      if (rnd(i * 41 + j + 900) < 0.42) { c.fillStyle = rnd(i + j) < 0.5 ? '#ffd27a' : '#fff0c0'; c.fillRect(10 + i * 41, 10 + j * 31, 28, 20); }
    }
  });
  const tijolo = canvasTex(256, 256, (c) => {
    c.fillStyle = '#8a4a36'; c.fillRect(0, 0, 256, 256);
    for (let j = 0; j < 16; j++) for (let i = 0; i < 8; i++) {
      const v = 0.85 + rnd(i * 17 + j) * 0.25;
      c.fillStyle = `rgb(${Math.round(160 * v)},${Math.round(78 * v)},${Math.round(56 * v)})`;
      c.fillRect(i * 32 + (j % 2) * 16 + 1, j * 16 + 1, 30, 14);
    }
  });
  return {areia, lajota, asfalto, grama, folha, cirros, janela, janelaNoite, tijolo};
}, []);

// ---------- ceu ----------
const CEU_VS = `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const CEU_FS = `
uniform float uDia; uniform float uOcaso; uniform vec3 uSol; uniform float uNublado; varying vec3 vD;
float h21(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453); }
void main(){
  vec3 d = normalize(vD); float h = max(d.y, 0.0);
  // ceu de dia enevoado como o do original: horizonte quase branco, azul palido, zenite azul medio
  vec3 dia = mix(vec3(0.86,0.89,0.92), vec3(0.60,0.72,0.87), smoothstep(0.0,0.25,h));
  dia = mix(dia, vec3(0.36,0.54,0.80), smoothstep(0.25,0.9,h));
  vec3 noite = mix(vec3(0.10,0.15,0.26), vec3(0.02,0.035,0.08), smoothstep(0.0,0.5,h));
  dia = mix(dia, mix(vec3(0.84,0.86,0.88), vec3(0.66,0.70,0.75), smoothstep(0.0,0.7,h)), uNublado);
  vec3 c = mix(noite, dia, uDia);
  vec3 sh = normalize(vec3(uSol.x, 0.0, uSol.z) + 1e-4);
  float lado = pow(max(dot(normalize(vec3(d.x,0.0,d.z)+1e-4), sh), 0.0), 2.0);
  c += uOcaso * (vec3(1.1,0.52,0.22) * lado * (1.0 - smoothstep(0.0,0.45,h)) * 1.3 + vec3(0.45,0.16,0.32) * (1.0 - smoothstep(0.0,0.7,h)) * 0.6);
  float s = max(dot(d, normalize(uSol)), 0.0);
  c += (pow(s, 900.0) * 4.0 + pow(s, 12.0) * 0.25) * max(uDia, uOcaso);
  vec3 q = floor(d * 520.0); float e = h21(q);
  c += step(0.9975, e) * (1.0 - uDia) * smoothstep(0.02, 0.15, h) * (0.5 + 0.5 * h21(q + 3.0));
  gl_FragColor = vec4(c, 1.0); gl_FragColor.rgb = pow(max(gl_FragColor.rgb, vec3(0.0)), vec3(2.2));
}`;
export const Ceu: React.FC<{luz: Luz; raio?: number; centro?: [number, number, number]; nublado?: number}> = ({luz, raio = 4000, centro = [0, 0, 0], nublado = 0}) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
    uniforms: {uDia: {value: 1}, uOcaso: {value: 0}, uSol: {value: new THREE.Vector3(0, 1, 0)}, uNublado: {value: 0}}, vertexShader: CEU_VS, fragmentShader: CEU_FS}), []);
  mat.uniforms.uDia.value = luz.dia; mat.uniforms.uOcaso.value = luz.ocaso; mat.uniforms.uSol.value.copy(luz.sol); mat.uniforms.uNublado.value = nublado;
  return <mesh material={mat} position={centro} scale={raio} renderOrder={-10}><sphereGeometry args={[1, 48, 24]} /></mesh>;
};

// ---------- nuvens em tufo (base achatada e mais escura) + cirros ----------
// textura de tufo gerada aqui (substitui o cloud.png, que nao tem licenca): bolhas sobrepostas, topo iluminado, base acinzentada
let _texNuvem: THREE.Texture | null = null;
export const texNuvem = () => {
  if (_texNuvem) return _texNuvem;
  const W = 256, cv = document.createElement('canvas'); cv.width = cv.height = W; const c = cv.getContext('2d')!;
  const bolhas: [number, number, number][] = [];
  for (let i = 0; i < 14; i++) bolhas.push([64 + rnd(i) * 128, 110 + rnd(i + 1) * 60 - (i % 3) * 18, 26 + rnd(i + 2) * 34]);
  for (const [x, y, r] of bolhas) {
    const g = c.createRadialGradient(x - r * 0.25, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.55, 'rgba(236,240,246,0.85)'); g.addColorStop(1, 'rgba(205,214,228,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  }
  // base mais escura e achatada
  const img = c.getImageData(0, 0, W, W), d = img.data;
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, k = Math.min(1, Math.max(0, (y - 120) / 80));
    d[i] *= 1 - 0.28 * k; d[i + 1] *= 1 - 0.24 * k; d[i + 2] *= 1 - 0.16 * k;
    const borda = Math.min(1, Math.max(0, (y - 175) / 18)); d[i + 3] *= 1 - borda;
  }
  c.putImageData(img, 0, 0);
  _texNuvem = new THREE.CanvasTexture(cv); _texNuvem.colorSpace = THREE.SRGBColorSpace; return _texNuvem;
};
export const Nuvens: React.FC<{t: number; luz: Luz; n?: number; area?: number; altura?: number; centro?: [number, number]}> = ({t, luz, n = 34, area = 1400, altura = 160, centro = [0, -500]}) => {
  const tex = texNuvem();
  const tufos = useMemo(() => {
    const out: {p: [number, number, number]; s: number; base: boolean}[] = [];
    for (let i = 0; i < n; i++) {
      const cx = centro[0] - area / 2 + rnd(i + 3) * area, cy = altura + rnd(i + 7) * altura * 0.6, cz = centro[1] - rnd(i + 11) * area * 0.6;
      const m = 6 + Math.floor(rnd(i + 21) * 7), larg = 40 + rnd(i + 31) * 60;
      for (let k = 0; k < m; k++) {
        const dy = (rnd(i * 13 + k) - 0.3) * 12;
        out.push({p: [cx + (rnd(i * 7 + k) - 0.5) * larg, cy + Math.max(-3, dy), cz + (rnd(i * 5 + k) - 0.5) * 18], s: 30 + rnd(i * 3 + k) * 36, base: dy < 0});
      }
    }
    // ordem de desenho fixa (do mais distante ao mais proximo do mar para a terra): sprites transparentes que trocam
    // de ordem a cada quadro piscam onde se sobrepoem
    return out.sort((a, b) => a.p[2] - b.p[2]);
  }, [n, area, altura, centro[0], centro[1]]);
  const claro = new THREE.Color(1, 1, 1).lerp(new THREE.Color(1, 0.72, 0.62), luz.ocaso * 0.8).multiplyScalar(0.25 + 0.75 * luz.dia + 0.2 * luz.ocaso);
  const escuro = claro.clone().multiply(new THREE.Color(0.72, 0.76, 0.84));
  return (
    <group position={[t * 1.2, 0, 0]}>
      {tufos.map((u, k) => (
        <sprite key={k} position={u.p} scale={[u.s, u.s * 0.62, 1]} renderOrder={-8 + k * 0.0001}>
          <spriteMaterial map={tex} color={u.base ? escuro : claro} transparent opacity={0.9} depthWrite={false} fog={false} toneMapped={false} />
        </sprite>
      ))}
    </group>
  );
};
export const Cirros: React.FC<{luz: Luz; tex: THREE.Texture; centro?: [number, number, number]}> = ({luz, tex, centro = [0, 0, 0]}) => (
  <mesh position={[centro[0], 900, centro[2] - 900]} rotation={[-Math.PI / 2 + 0.25, 0, 0]} renderOrder={-9}>
    <planeGeometry args={[5200, 2600]} />
    <meshBasicMaterial map={tex} transparent opacity={0.85 * luz.dia} depthWrite={false} fog={false} toneMapped={false} />
  </mesh>
);

// ---------- sol (luz direcional com sombra acompanhando um centro) + ambiente ----------
export const Sol: React.FC<{luz: Luz; foco: THREE.Vector3; area?: number; noiteLuz?: number}> = ({luz, foco, area = 70, noiteLuz = 0.95}) => {
  const alvo = useMemo(() => new THREE.Object3D(), []);
  // o centro da sombra anda em passos de um texel no espaco da luz: sem isso a sombra "ferve" quando a camera anda
  const dir = luz.sol.clone().normalize(), dr = new THREE.Vector3(0, 1, 0).cross(dir).normalize(), du = dir.clone().cross(dr);
  const tx = (2 * area) / 4096, snap = (v: number) => Math.round(v / tx) * tx;
  const centro = dr.clone().multiplyScalar(snap(foco.dot(dr))).add(du.clone().multiplyScalar(snap(foco.dot(du)))).add(dir.clone().multiplyScalar(foco.dot(dir)));
  alvo.position.copy(centro); alvo.updateMatrixWorld();
  const pos = centro.clone().add(dir.clone().multiplyScalar(220));
  const corSol = new THREE.Color(1, 0.96, 0.88).lerp(new THREE.Color(1, 0.55, 0.3), luz.ocaso);
  return (
    <>
      <primitive object={alvo} />
      <directionalLight position={pos.toArray()} target={alvo} intensity={3.0 * luz.dia + 1.2 * luz.ocaso} color={corSol} castShadow
        shadow-mapSize={[4096, 4096]} shadow-camera-left={-area} shadow-camera-right={area} shadow-camera-top={area} shadow-camera-bottom={-area}
        shadow-camera-near={1} shadow-camera-far={600} shadow-bias={-0.0004} shadow-normalBias={0.02} />
      <hemisphereLight args={[new THREE.Color(0.75, 0.85, 1).multiplyScalar(0.25 + luz.dia), new THREE.Color(0.55, 0.5, 0.42), 0.9 * luz.dia + noiteLuz]} />
      <ambientLight intensity={noiteLuz * (1 - luz.dia)} color="#5a6f9a" />
    </>
  );
};

// ---------- mar (raso turquesa com causticas, espuma na costa, ondas de espuma chegando) ----------
const MAR_VS = `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const MAR_FS = `
uniform sampler2D uN; uniform float uT; uniform float uCosta; uniform vec3 uSol; uniform float uDia; uniform float uOcaso; uniform float uEspuma; uniform float uAgit;
varying vec3 vW;
void main(){
  float d = uCosta - vW.z;
  vec2 p = vW.xz;
  vec3 n1 = texture2D(uN, p * 0.030 + vec2(uT * 0.020, uT * 0.013)).rgb * 2.0 - 1.0;
  vec3 n2 = texture2D(uN, p * 0.047 - vec2(uT * 0.017, -uT * 0.011)).rgb * 2.0 - 1.0;
  vec3 nn = n1 + n2;
  vec3 N = normalize(vec3(nn.x * (0.32 + uAgit), 1.0, nn.y * (0.32 + uAgit)));
  vec3 V = normalize(cameraPosition - vW);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 4.0);
  vec3 raso = vec3(0.22, 0.78, 0.78), medio = vec3(0.05, 0.56, 0.68), fundo = vec3(0.03, 0.28, 0.50);
  vec3 base = mix(raso, medio, smoothstep(0.0, 7.0, d));
  base = mix(base, fundo, smoothstep(7.0, 70.0, d));
  float luz = 0.30 + 0.70 * uDia + 0.25 * uOcaso;
  vec3 ceu = mix(vec3(0.04, 0.07, 0.13), vec3(0.72, 0.84, 0.96), uDia) + vec3(0.6, 0.25, 0.1) * uOcaso;
  vec3 col = mix(base * luz, ceu, fres * 0.65);
  float c1 = texture2D(uN, p * 0.13 + uT * 0.030).r, c2 = texture2D(uN, p * 0.10 - uT * 0.026).g;
  float caus = pow(clamp(1.0 - abs(c1 - c2) * 3.2, 0.0, 1.0), 7.0);
  col += caus * (1.0 - smoothstep(1.5, 16.0, d)) * 0.45 * (0.35 + 0.65 * uDia);
  vec3 R = reflect(-V, N);
  col += pow(max(dot(R, normalize(uSol)), 0.0), 180.0) * 2.2 * (uDia + uOcaso);
  float br = texture2D(uN, p * 0.21 + vec2(uT * 0.05, 0.0)).b;
  float f = smoothstep(1.1, 0.0, d);
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    float ph = fract(uT * 0.11 + fk / 3.0);
    float bd = mix(16.0, 0.4, ph);
    f += smoothstep(0.55, 0.0, abs(d - bd)) * (0.55 + 0.45 * sin(p.x * 0.21 + fk * 2.1)) * (1.0 - ph * 0.35);
  }
  f = clamp(f * uEspuma, 0.0, 1.0) * smoothstep(0.25, 0.6, br + 0.25);
  col = mix(col, vec3(0.97) * luz, f);
  float dist = length(vW - cameraPosition);
  col = mix(col, mix(vec3(0.06, 0.09, 0.15), vec3(0.80, 0.88, 0.95), uDia), smoothstep(250.0, 2600.0, dist) * 0.85);
  gl_FragColor = vec4(col, smoothstep(-0.05, 0.6, d)); gl_FragColor.rgb = pow(max(gl_FragColor.rgb, vec3(0.0)), vec3(2.2));
}`;
export const Mar: React.FC<{t: number; luz: Luz; costa: number; nivel?: number; espuma?: number; agit?: number; tamanho?: number; centro?: [number, number]}> = ({t, luz, costa, nivel = 0.04, espuma = 1, agit = 0, tamanho = 6000, centro = [0, 0]}) => {
  const tn = useTexture(staticFile('waternormals.jpg'));
  tn.wrapS = tn.wrapT = THREE.RepeatWrapping;
  const mat = useMemo(() => new THREE.ShaderMaterial({transparent: true, toneMapped: false, vertexShader: MAR_VS, fragmentShader: MAR_FS,
    uniforms: {uN: {value: tn}, uT: {value: 0}, uCosta: {value: 0}, uSol: {value: new THREE.Vector3()}, uDia: {value: 1}, uOcaso: {value: 0}, uEspuma: {value: 1}, uAgit: {value: 0}}}), [tn]);
  const u = mat.uniforms;
  u.uT.value = t; u.uCosta.value = costa; u.uSol.value.copy(luz.sol); u.uDia.value = luz.dia; u.uOcaso.value = luz.ocaso; u.uEspuma.value = espuma; u.uAgit.value = agit;
  return (
    <mesh material={mat} rotation-x={-Math.PI / 2} position={[centro[0], nivel, costa + 3 - tamanho / 2]} receiveShadow>
      <planeGeometry args={[tamanho, tamanho, 1, 1]} />
    </mesh>
  );
};
