// Leito (dono: agente Leito) — capitulo 3 (29,9-60,9 do original): praia do EQUADOR de perto, o mar recua e o fundo seca ao sol.
// Contrato: export const Leito: React.FC<{t: number}> (controla a propria camera) e export const perfilLeito(t): Perfil.
//
// Linha do tempo (mapa_acoes.md, cap. 3):
//   29,9-36  praia viva em time-lapse: banhistas andando, criancas correndo com a bola, gente nadando, ondas quebrando no posto
//            "SALVAVIDAS" (posto listrado amarelo/verde/rosa sobre palafitas), guarda-sois balancando. "Un dia dura solo dos horas mas".
//   36-44    o mar recua: a arrebentacao se afasta do posto e aparece areia molhada escura e brilhante; quem nadava fica em pe e anda
//            para a areia; o salva-vidas troca a bandeira para vermelha (38) e desce a rampa (40).
//   44-48    o mar vira uma faixa fina no horizonte; os barcos encostam no fundo e tombam; curiosos caminham para o leito.
//   48-60,9  leito exposto secando (molhado -> umido -> seco -> lama rachada), pocas encolhendo, conchas e algas, pedras, barcos
//            encalhados; sombras longas das palmeiras (atras da camera) entrando no quadro. A luz cai (ceu do agente Ceu).
// Camera (mapa): ~5 m acima da areia olhando o mar; pan continuo para a ESQUERDA com push-in ate 46, depois pan mais lento sem zoom.
//
// Coordenadas: o mar fica para -z, a direita da camera e +x (W e a identidade com LESTE = -1; LESTE = 1 giraria o mundo 180 graus).
// Ceu: CeuLugar com rumo = 90 (-z aponta para o LESTE): a tarde do cap. 3 (15,4 -> 17,55 h) poe o Sol atras da camera, um pouco a
// esquerda (norte), e as sombras das palmeiras e dos guarda-sois correm para o mar, como no original.
// O nivel da agua segue a linha d'agua do mapa (linhaAgua). O nivelMar de fisica.ts e o EQUILIBRIO global (ja da -1,1 km em 29,9 s):
// a agua leva tempo para escoar, entao aqui o nivel local e a cota do leito na linha d'agua: nivelLocal(t) = relevo(linhaAgua(t)).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {useTexture} from '@react-three/drei';
import {staticFile} from 'remotion';
import {Perfil} from '../look/Look';
import {camEm, ChaveCam} from '../roteiro';
import {CeuLugar, luzEm} from './ceu';
import {clamp01, rnd, smooth} from './comum';
import {ChaoMolhado, AguaDistancia, tabelaSaida} from './chao_molhado';
import {Multidao3D, Pessoa3D, Estado3D} from './pessoas';
import {Palmeiras, PalmeiraItem} from './palmeiras';

// ---------------------------------------------------------------- orientacao e relevo
const LESTE = -1;
export const RUMO_LEITO = 90;
const W = (x: number, y: number, z: number): [number, number, number] => [-LESTE * x, y, -LESTE * z];
const Z0 = 30;                                  // linha d'agua original em z = -30 (projeto)
const sDe = (zp: number) => -zp - Z0;           // distancia para o mar a partir da linha original (m)
// perfil do leito: praia sobe 2,5% para a terra; antepraia 1:45 ate 150 m; plataforma 1,2% ate 1,5 km; depois 0,4%
const relevoS = (s: number, x: number) => {
  let h = s < 0 ? -s * 0.025 : -(Math.min(s, 150) / 45) - Math.max(0, Math.min(s, 1500) - 150) * 0.012 - Math.max(0, s - 1500) * 0.004;
  // bancos de areia e sulcos (so no que era fundo): dao as pocas e a frente de secagem irregular
  const b = smooth(10, 60, s) * (1 - smooth(500, 1200, s));
  h += b * (0.22 * Math.sin(s * 0.11 + Math.sin(x * 0.03) * 1.5) + 0.12 * Math.sin(x * 0.07 + s * 0.025));
  return h;
};
// linha d'agua (m a partir da linha original) — tempos do mapa: recua 36-44, faixa fina 44-48, some no horizonte depois
const LINHA: [number, number][] = [[35.5, 0], [38, 8], [40, 35], [42, 90], [44, 170], [46, 500], [48, 1400], [50, 2500], [52, 3600], [56, 5200], [61, 7200]];
export const linhaAgua = (t: number) => {
  if (t <= LINHA[0][0]) return 0;
  for (let i = 0; i < LINHA.length - 1; i++) {
    const [a, va] = LINHA[i], [b, vb] = LINHA[i + 1];
    if (t <= b) { const u = (t - a) / (b - a), la = Math.log(va + 20), lb = Math.log(vb + 20); return Math.exp(la + (lb - la) * u) - 20; }
  }
  return LINHA[LINHA.length - 1][1];
};
export const nivelLocal = (t: number) => relevoS(linhaAgua(t), 0);
const AGUA: AguaDistancia = {tipo: 'distancia', origem: [0, LESTE * Z0], dir: [0, LESTE], linha: linhaAgua};
const JANELA: [number, number] = [29, 62];
const relevoMundo = (xw: number, zw: number) => relevoS(sDe(-LESTE * zw), -LESTE * xw);

// ---------------------------------------------------------------- camera (mapa: pan para a esquerda + push-in ate 46, depois mais lento)
const dirCam = (yaw: number, pitch: number, p: [number, number, number]): [number, number, number] => {
  const y = (yaw * Math.PI) / 180, q = (pitch * Math.PI) / 180;
  return [p[0] + Math.sin(y) * Math.cos(q) * 100, p[1] + Math.sin(q) * 100, p[2] - Math.cos(y) * Math.cos(q) * 100];
};
const chave = (t: number, p: [number, number, number], yaw: number, pitch: number, fov: number): ChaveCam => [t, W(...p), W(...dirCam(yaw, pitch, p)), fov];
const CAM: ChaveCam[] = [
  chave(29.9, [3.0, 5.6, 4.0], 4, -10.5, 50),
  chave(38, [2.6, 5.55, 3.4], -1.5, -9.6, 47.5),
  chave(46, [2.1, 5.5, 2.8], -6.5, -8.6, 45),
  chave(53, [1.9, 5.5, 2.6], -8.5, -7.8, 45),
  chave(60.9, [1.7, 5.5, 2.4], -10.5, -7.0, 45),
];
// camEm suaviza cada trecho (para nas chaves); aqui o tempo e reparametrizado para o pan seguir continuo entre as chaves
const easeInv = (y: number) => 0.5 - Math.sin(Math.asin(1 - 2 * clamp01(y)) / 3);
const camLeito = (t: number) => {
  const tc = Math.min(CAM[CAM.length - 1][0], Math.max(CAM[0][0], t));
  let i = 0; while (i < CAM.length - 2 && tc > CAM[i + 1][0]) i++;
  const a = CAM[i][0], b = CAM[i + 1][0];
  return camEm(CAM, a + (b - a) * easeInv((tc - a) / (b - a)));
};

// ---------------------------------------------------------------- mar (nivel local, espuma na linha, ondas quebrando, reflexo do ceu)
const MAR_VS = `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const MAR_FS = `
uniform sampler2D uN; uniform float uT; uniform float uNivel; uniform float uLinha; uniform float uLeste; uniform float uZ0; uniform float uSurf;
uniform vec3 uSol; uniform vec3 uCorSol; uniform vec3 uCeuH; uniform vec3 uCeuZ; uniform float uDia;
varying vec3 vW;
float smoothR(float a, float b, float x){ float u = clamp((x - a) / (b - a), 0.0, 1.0); return u * u * (3.0 - 2.0 * u); }
float relevo(float s, float x){
  float h = s < 0.0 ? -s * 0.025 : -(min(s, 150.0) / 45.0) - max(0.0, min(s, 1500.0) - 150.0) * 0.012 - max(0.0, s - 1500.0) * 0.004;
  float b = smoothR(10.0, 60.0, s) * (1.0 - smoothR(500.0, 1200.0, s));
  return h + b * (0.22 * sin(s * 0.11 + sin(x * 0.03) * 1.5) + 0.12 * sin(x * 0.07 + s * 0.025));
}
void main(){
  float s = uLeste * vW.z - uZ0, x = -uLeste * vW.x;
  float d = uNivel - relevo(s, x);
  if (d < -0.02) discard;
  vec2 p = vW.xz;
  vec3 n1 = texture2D(uN, p * 0.021 + vec2(uT * 0.016, uT * 0.011)).rgb * 2.0 - 1.0;
  vec3 n2 = texture2D(uN, p * 0.057 - vec2(uT * 0.019, -uT * 0.013)).rgb * 2.0 - 1.0;
  vec3 n3 = texture2D(uN, p * 0.0031 + vec2(uT * 0.004, 0.0)).rgb * 2.0 - 1.0;
  vec3 nn = n1 + n2 * 0.7 + n3 * 1.2;
  float dist = length(vW - cameraPosition);
  float forca = mix(0.16, 0.06, smoothR(60.0, 1500.0, dist));
  vec3 N = normalize(vec3(nn.x * forca, 1.0, nn.y * forca));
  vec3 V = normalize(cameraPosition - vW);
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  // cor da agua pela profundidade de verdade (raso turquesa -> azul petroleo)
  vec3 raso = vec3(0.02, 0.30, 0.34), medio = vec3(0.008, 0.15, 0.27), fundo = vec3(0.004, 0.065, 0.17);
  vec3 base = mix(raso, medio, smoothR(0.3, 4.0, d));
  base = mix(base, fundo, smoothR(4.0, 25.0, d));
  float luz = 0.25 + 0.75 * uDia;
  vec3 R = reflect(-V, N); R.y = abs(R.y);
  vec3 ceu = mix(uCeuH, uCeuZ, smoothR(0.0, 0.45, R.y)) * 0.75;
  vec3 col = mix(base * luz, ceu, fres * mix(0.3, 0.6, smoothR(300.0, 4000.0, dist)));
  col += pow(max(dot(R, normalize(uSol)), 0.0), 220.0) * uCorSol * 2.5 * uDia;
  // espuma: borda que lambe a areia + 4 ondas chegando (frentes paralelas a costa, com falhas)
  float fb = texture2D(uN, p * 0.09 + vec2(uT * 0.03, 0.0)).b;
  float fr = texture2D(uN, p * 0.31 - vec2(0.0, uT * 0.05)).g;
  float f = (1.0 - smoothR(0.0, 0.1, d)) * 0.95;
  for (int k = 0; k < 5; k++) {
    float fk = float(k);
    float ph = fract(uT * 0.13 + fk * 0.2 + 0.07 * sin(x * 0.013 + fk));
    float bs = uLinha + mix(70.0, 2.0, ph);
    float larg = mix(1.4, 3.2, ph);
    float fr0 = smoothR(larg, 0.0, abs(s - bs)) + smoothR(larg * 2.5, 0.0, s - bs) * step(bs, s) * 0.3;
    f += fr0 * smoothR(0.15, 0.55, ph) * (1.0 - smoothR(0.85, 1.0, ph)) * (0.55 + 0.45 * sin(x * 0.09 + fk * 2.1 + s * 0.02)) * uSurf;
  }
  f = clamp(f, 0.0, 1.0) * smoothR(0.4, 0.62, fr + 0.15 * (fb - 0.9));
  col = mix(col, vec3(0.92, 0.94, 0.95) * (0.3 + 0.75 * uDia), f);
  // agua bem rasa deixa ver o fundo (a areia molhada por baixo)
  float a = mix(0.8, 1.0, smoothR(0.0, 1.2, d));
  a = max(a, f);
  gl_FragColor = vec4(col, a * smoothR(-0.02, 0.12, d));
}`;
const MarLeito: React.FC<{t: number}> = ({t}) => {
  const tn = useTexture(staticFile('leito/waternormals.jpg'));
  const mat = useMemo(() => {
    tn.wrapS = tn.wrapT = THREE.RepeatWrapping; tn.needsUpdate = true;
    return new THREE.ShaderMaterial({transparent: true, vertexShader: MAR_VS, fragmentShader: MAR_FS, depthWrite: true,
      uniforms: {uN: {value: tn}, uT: {value: 0}, uNivel: {value: 0}, uLinha: {value: 0}, uLeste: {value: LESTE}, uZ0: {value: Z0}, uSurf: {value: 1},
        uSol: {value: new THREE.Vector3(0, 1, 0)}, uCorSol: {value: new THREE.Color()}, uCeuH: {value: new THREE.Color()}, uCeuZ: {value: new THREE.Color()}, uDia: {value: 1}}});
  }, [tn]);
  const l = luzEm(t, 'ecuador', RUMO_LEITO), u = mat.uniforms, nivel = nivelLocal(t);
  u.uT.value = t; u.uNivel.value = nivel; u.uLinha.value = linhaAgua(t);
  u.uSurf.value = 1 - 0.6 * smooth(44, 50, t);
  u.uSol.value.copy(l.sol); u.uCorSol.value.copy(l.corSol); u.uDia.value = l.dia;
  u.uCeuZ.value.copy(l.ambiente).multiplyScalar(0.35 + 0.75 * l.dia);
  u.uCeuH.value.copy(l.ambiente).lerp(new THREE.Color(1, 1, 1), 0.6).lerp(l.corSol, 0.2).multiplyScalar(0.35 + 0.9 * l.dia);
  return (
    <mesh material={mat} position={[0, nivel, LESTE * 7000]} rotation-x={-Math.PI / 2} renderOrder={2}>
      <planeGeometry args={[30000, 15000, 1, 1]} />
    </mesh>
  );
};

// ---------------------------------------------------------------- posto de salva-vidas (latino, listrado, placa SALVAVIDAS)
const texListras = () => {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256; const c = cv.getContext('2d')!;
  const cores = ['#f5c43a', '#53b86a', '#ef5d8f', '#f5c43a', '#36b4c9', '#ef8a3a'];
  cores.forEach((k, i) => { c.fillStyle = k; c.fillRect(0, i * 256 / cores.length, 256, 256 / cores.length + 1); });
  for (let i = 0; i < 1800; i++) { c.fillStyle = `rgba(255,255,255,${rnd(i) * 0.08})`; c.fillRect(rnd(i + 1) * 256, rnd(i + 2) * 256, 1 + rnd(i + 3) * 3, 1); }
  c.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = 0; x < 256; x += 16) c.fillRect(x, 0, 1, 256);   // tabuas verticais
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
};
const texPlaca = () => {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const c = cv.getContext('2d')!;
  c.fillStyle = '#d7262e'; c.fillRect(0, 0, 512, 128); c.strokeStyle = '#fff'; c.lineWidth = 8; c.strokeRect(6, 6, 500, 116);
  c.fillStyle = '#fff'; c.font = 'bold 76px Arial, Helvetica, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('SALVAVIDAS', 256, 68);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
const POSTO: [number, number] = [5.5, -17], ESC_POSTO = 0.82;
const Posto: React.FC<{t: number}> = ({t}) => {
  const tex = useMemo(() => ({listras: texListras(), placa: texPlaca()}), []);
  const [px, pz] = POSTO, H = 2.7;
  const madeira = '#e9e3d6';
  // bandeira: amarela ate 38 s; o salva-vidas troca para vermelha (desce e sobe de novo no mastro)
  const troca = smooth(37.6, 38.6, t), sobe = smooth(38.6, 39.6, t);
  const hBand = 6.2 - 1.6 * troca * (1 - sobe);
  const corBand = t < 38.6 ? '#f2d021' : '#e0262b';
  const ondula = (k: number) => Math.sin(t * 7 + k) * 0.25;
  return (
    <group position={W(px, relevoS(sDe(pz), px), pz)} rotation-y={LESTE > 0 ? Math.PI : 0} scale={ESC_POSTO}>
      {/* palafitas e travessas */}
      {[[-1.3, -1.2], [1.3, -1.2], [-1.3, 1.2], [1.3, 1.2]].map(([x, z], i) => (
        <mesh key={i} position={[x, H / 2 - 0.3, z]} castShadow receiveShadow><boxGeometry args={[0.2, H + 0.6, 0.2]} /><meshStandardMaterial color={madeira} roughness={0.8} /></mesh>))}
      {[[0, -1.2, 0], [0, 1.2, 0], [-1.3, 0, Math.PI / 2], [1.3, 0, Math.PI / 2]].map(([x, z, r], i) => (
        <mesh key={'x' + i} position={[x, 1.2, z]} rotation={[0, r, 0.72]} castShadow><boxGeometry args={[3.3, 0.1, 0.1]} /><meshStandardMaterial color={madeira} roughness={0.8} /></mesh>))}
      {/* plataforma, guarda-corpo */}
      <mesh position={[0, H, 0]} castShadow receiveShadow><boxGeometry args={[3.6, 0.16, 3.4]} /><meshStandardMaterial color="#d8cdb8" roughness={0.85} /></mesh>
      {[[-1.75, 0, 0.06, 3.4], [1.75, 0, 0.06, 3.4]].map(([x, z, w, d], i) => (
        <mesh key={'g' + i} position={[x, H + 0.55, z]} castShadow><boxGeometry args={[w, 0.06, d]} /><meshStandardMaterial color="#ffffff" roughness={0.6} /></mesh>))}
      {[-1.6, -0.8, 0, 0.8, 1.6].flatMap((z) => [-1.75, 1.75].map((x) => (
        <mesh key={`b${x}${z}`} position={[x, H + 0.3, z]} castShadow><boxGeometry args={[0.06, 0.55, 0.06]} /><meshStandardMaterial color="#ffffff" /></mesh>)))}
      {/* cabine listrada */}
      <mesh position={[0, H + 1.2, -0.25]} castShadow receiveShadow><boxGeometry args={[2.7, 2.2, 2.3]} /><meshStandardMaterial map={tex.listras} roughness={0.7} /></mesh>
      {/* janelas (lado do mar e laterais) */}
      <mesh position={[0, H + 1.45, -1.41]}><boxGeometry args={[2.1, 0.75, 0.04]} /><meshStandardMaterial color="#1d2a33" roughness={0.08} metalness={0.3} /></mesh>
      {[-1.36, 1.36].map((x) => <mesh key={'j' + x} position={[x, H + 1.45, -0.25]}><boxGeometry args={[0.04, 0.7, 1.6]} /><meshStandardMaterial color="#1d2a33" roughness={0.08} metalness={0.3} /></mesh>)}
      {/* porta e placa SALVAVIDAS (lado da praia, de frente para a camera) */}
      <mesh position={[0.65, H + 0.95, 0.91]}><boxGeometry args={[0.75, 1.6, 0.04]} /><meshStandardMaterial color="#2f8fbf" roughness={0.6} /></mesh>
      <mesh position={[0, H + 2.05, 0.93]}><planeGeometry args={[2.5, 0.62]} /><meshStandardMaterial map={tex.placa} roughness={0.5} emissive="#ffffff" emissiveMap={tex.placa} emissiveIntensity={0.08} /></mesh>
      {/* telhado em piramide com beiral */}
      <mesh position={[0, H + 2.75, -0.25]} rotation-y={Math.PI / 4} castShadow><coneGeometry args={[2.35, 1.0, 4]} /><meshStandardMaterial color="#f2b632" roughness={0.6} /></mesh>
      <mesh position={[0, H + 2.27, -0.25]} castShadow><boxGeometry args={[3.3, 0.08, 2.9]} /><meshStandardMaterial color="#e0452f" roughness={0.6} /></mesh>
      {/* rampa para a areia (lado da praia) */}
      <group position={[0.9, H / 2, 1.7 + 2.3]} rotation-x={Math.atan2(H, 4.6)}>
        <mesh castShadow receiveShadow><boxGeometry args={[1.0, 0.1, Math.hypot(H, 4.6)]} /><meshStandardMaterial color="#efe9dc" roughness={0.8} /></mesh>
      </group>
      {/* mastro e bandeira */}
      <mesh position={[-1.6, H + 2.0, 1.3]} castShadow><cylinderGeometry args={[0.04, 0.05, 4.2, 6]} /><meshStandardMaterial color="#cfd3d6" metalness={0.6} roughness={0.35} /></mesh>
      <group position={[-1.6, hBand + 0.45, 1.3]}>
        {[0, 1, 2, 3].map((k) => (
          <mesh key={'f' + k} position={[0.14 + k * 0.22, 0, ondula(k) * k * 0.25]} rotation-y={ondula(k + 0.5) * 0.6} castShadow>
            <boxGeometry args={[0.23, 0.55, 0.01]} /><meshStandardMaterial color={corBand} roughness={0.7} side={THREE.DoubleSide} /></mesh>))}
      </group>
      {/* boia salva-vidas pendurada */}
      <mesh position={[1.4, H + 0.9, 0.95]}><torusGeometry args={[0.28, 0.08, 8, 20]} /><meshStandardMaterial color="#f05a24" roughness={0.6} /></mesh>
    </group>
  );
};

// ---------------------------------------------------------------- moveis de praia (guarda-sois, cadeiras, toalhas, caixas termicas, bola)
const CORES_GS: [string, string][] = [['#ff5fa2', '#ffffff'], ['#d4146a', '#ff8fc2'], ['#ffffff', '#f2f2f2'], ['#b07ce8', '#ffffff'], ['#2f7fe0', '#ffffff'],
  ['#ff4f6a', '#ffd23a'], ['#e93b8f', '#5b3fd0'], ['#20b2aa', '#ffffff'], ['#ffb02e', '#e8402e']];
const geoGuardaSol = (a: string, b: string) => {
  const g = new THREE.ConeGeometry(1.25, 0.42, 16, 1, true).toNonIndexed();
  const P = g.attributes.position as THREE.BufferAttribute, C = new Float32Array(P.count * 3), ca = new THREE.Color(a), cb = new THREE.Color(b);
  for (let i = 0; i < P.count; i += 3) {
    const cx = (P.getX(i) + P.getX(i + 1) + P.getX(i + 2)) / 3, cz = (P.getZ(i) + P.getZ(i + 1) + P.getZ(i + 2)) / 3;
    const seg = Math.floor(((Math.atan2(cz, cx) + Math.PI) / (Math.PI * 2)) * 16) % 2, c = seg ? ca : cb;
    for (let k = 0; k < 3; k++) { C[(i + k) * 3] = c.r; C[(i + k) * 3 + 1] = c.g; C[(i + k) * 3 + 2] = c.b; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.computeVertexNormals(); return g;
};
type Movel = {tipo: 'gs' | 'cadeira' | 'toalha' | 'caixa' | 'bola' | 'prancha'; x: number; z: number; r: number; c: number};
const MOVEIS: Movel[] = (() => {
  const out: Movel[] = [];
  let k = 0;
  // fileiras soltas de guarda-sois entre a camera e o posto, mais densas perto da agua
  for (let i = 0; i < 34; i++) {
    const z = -3 - rnd(i * 3.1) * 21, x = -55 + rnd(i * 7.7) * 85;
    if (Math.abs(x - POSTO[0]) < 4 && Math.abs(z - POSTO[1]) < 5) continue;
    out.push({tipo: 'gs', x, z, r: rnd(i * 1.3) * 6.28, c: k++});
    if (rnd(i * 2.2) < 0.7) out.push({tipo: 'cadeira', x: x + 1.4, z: z + 0.6, r: (rnd(i * 4.4) - 0.5) * 1.2 + Math.PI, c: i});
    if (rnd(i * 5.5) < 0.6) out.push({tipo: 'toalha', x: x - 1.2, z: z + 1.0, r: (rnd(i * 6.6) - 0.5) * 0.8, c: i + 3});
    if (rnd(i * 8.8) < 0.3) out.push({tipo: 'caixa', x: x + 0.6, z: z - 1.1, r: rnd(i) * 3, c: i});
  }
  for (let i = 0; i < 26; i++) out.push({tipo: 'toalha', x: -60 + rnd(i * 9.1 + 4) * 95, z: -3 - rnd(i * 3.7 + 9) * 23, r: (rnd(i * 2.9) - 0.5) * 1.4, c: i + 11});
  for (let i = 0; i < 5; i++) out.push({tipo: 'prancha', x: -40 + rnd(i * 5.1 + 70) * 70, z: -12 - rnd(i * 2.1 + 71) * 12, r: rnd(i * 3.3) * 3, c: i});
  return out;
})();
const CORES_PANO = ['#ff5fa2', '#2f7fe0', '#ffd23a', '#27c08a', '#ffffff', '#ff7a2e', '#9b5de5', '#00bbf9', '#e63946'];
const Moveis: React.FC<{t: number}> = ({t}) => {
  const geos = useMemo(() => CORES_GS.map(([a, b]) => geoGuardaSol(a, b)), []);
  const y = (x: number, z: number) => relevoS(sDe(z), x);
  return (
    <group>
      {MOVEIS.map((m, i) => {
        const p = W(m.x, y(m.x, m.z), m.z), ry = m.r + (LESTE > 0 ? Math.PI : 0);
        if (m.tipo === 'gs') {
          // guarda-sol inclinado e balancando com o vento (rajadas em t)
          const inc = 0.12 + rnd(i * 3.3) * 0.18, bal = Math.sin(t * 2.3 + i) * 0.03 + Math.sin(t * 5.1 + i * 2) * 0.012;
          return (
            <group key={i} position={p} rotation={[inc + bal, ry, bal * 0.5]}>
              <mesh position={[0, 1.15, 0]} castShadow><cylinderGeometry args={[0.025, 0.03, 2.3, 6]} /><meshStandardMaterial color="#f4f4f4" roughness={0.5} /></mesh>
              <mesh position={[0, 2.2, 0]} geometry={geos[m.c % geos.length]} castShadow receiveShadow>
                <meshStandardMaterial vertexColors roughness={0.75} side={THREE.DoubleSide} /></mesh>
            </group>);
        }
        if (m.tipo === 'cadeira') return (
          <group key={i} position={p} rotation-y={ry}>
            <mesh position={[0, 0.28, 0]} castShadow receiveShadow><boxGeometry args={[0.62, 0.06, 1.25]} /><meshStandardMaterial color={['#2f7fe0', '#ffffff', '#ffd23a', '#27c08a'][m.c % 4]} roughness={0.7} /></mesh>
            <mesh position={[0, 0.58, -0.72]} rotation-x={-0.95} castShadow><boxGeometry args={[0.62, 0.06, 0.75]} /><meshStandardMaterial color={['#2f7fe0', '#ffffff', '#ffd23a', '#27c08a'][m.c % 4]} roughness={0.7} /></mesh>
            {[[-0.28, 0.5], [0.28, 0.5], [-0.28, -0.5], [0.28, -0.5]].map(([x, z], k) => <mesh key={k} position={[x, 0.13, z]}><boxGeometry args={[0.04, 0.26, 0.04]} /><meshStandardMaterial color="#dddddd" metalness={0.5} roughness={0.4} /></mesh>)}
          </group>);
        if (m.tipo === 'toalha') return (
          <mesh key={i} position={[p[0], p[1] + 0.012, p[2]]} rotation-y={ry} receiveShadow><boxGeometry args={[0.9, 0.012, 1.8]} /><meshStandardMaterial color={CORES_PANO[m.c % CORES_PANO.length]} roughness={0.95} /></mesh>);
        if (m.tipo === 'caixa') return (
          <group key={i} position={p} rotation-y={ry}>
            <mesh position={[0, 0.2, 0]} castShadow receiveShadow><boxGeometry args={[0.55, 0.4, 0.38]} /><meshStandardMaterial color={['#2f7fe0', '#e63946', '#27c08a'][m.c % 3]} roughness={0.5} /></mesh>
            <mesh position={[0, 0.42, 0]} castShadow><boxGeometry args={[0.58, 0.06, 0.41]} /><meshStandardMaterial color="#ffffff" roughness={0.5} /></mesh>
          </group>);
        if (m.tipo === 'prancha') return (
          <mesh key={i} position={[p[0], p[1] + 0.04, p[2]]} rotation-y={ry} scale={[0.28, 0.04, 1]} castShadow receiveShadow><sphereGeometry args={[1, 16, 8]} /><meshStandardMaterial color={['#ff5fa2', '#ffd23a', '#00bbf9', '#ffffff', '#ff7a2e'][m.c % 5]} roughness={0.3} /></mesh>);
        return null;
      })}
    </group>
  );
};

// bola de praia chutada (time-lapse): pula pela areia entre duas criancas
const Bola: React.FC<{t: number}> = ({t}) => {
  const ciclo = 1.6, k = Math.floor((t - 29.9) / ciclo), u = ((t - 29.9) / ciclo) - k;
  const ida = k % 2 === 0;
  const a: [number, number] = [-6, -14], b: [number, number] = [-1.5, -19];
  const [x0, z0] = ida ? a : b, [x1, z1] = ida ? b : a;
  const x = x0 + (x1 - x0) * u, z = z0 + (z1 - z0) * u, y = 0.25 + Math.abs(Math.sin(u * Math.PI)) * 2.2;
  const vis = t < 40;
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(0.25, 16, 12).toNonIndexed(), P = g.attributes.position as THREE.BufferAttribute, C = new Float32Array(P.count * 3);
    const cores = ['#ff3b3b', '#ffffff', '#2f7fe0', '#ffd23a', '#ffffff', '#27c08a'].map((c) => new THREE.Color(c));
    for (let i = 0; i < P.count; i += 3) {
      const ang = Math.atan2(P.getZ(i) + P.getZ(i + 1) + P.getZ(i + 2), P.getX(i) + P.getX(i + 1) + P.getX(i + 2));
      const c = cores[Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 6) % 6];
      for (let q = 0; q < 3; q++) { C[(i + q) * 3] = c.r; C[(i + q) * 3 + 1] = c.g; C[(i + q) * 3 + 2] = c.b; }
    }
    g.setAttribute('color', new THREE.BufferAttribute(C, 3)); return g;
  }, []);
  return <mesh visible={vis} geometry={geo} position={W(x, relevoS(sDe(z), x) + y, z)} rotation={[t * 6, t * 3, 0]} castShadow><meshStandardMaterial vertexColors roughness={0.35} /></mesh>;
};

// ---------------------------------------------------------------- barcos (flutuam, encostam no fundo quando a agua passa e tombam)
const geoCasco = () => {
  const L = 6.5, B = 1.9, Hc = 0.85;
  const g = new THREE.BoxGeometry(B, Hc, L, 4, 3, 16);
  const P = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
    const v = (y + Hc / 2) / Hc;                                   // 0 no fundo, 1 na borda
    const proa = clamp01((-z - L * 0.15) / (L * 0.35));            // proa para -z
    const larg = (0.45 + 0.55 * Math.sqrt(v)) * (1 - 0.92 * Math.pow(proa, 1.6));
    const sobe = proa * proa * 0.45;
    P.setXYZ(i, x * larg, y + sobe * (0.4 + 0.6 * v), z);
  }
  g.computeVertexNormals(); return g;
};
type Barco = {x: number; s: number; ry: number; cor: string; tomba: number};
const BARCOS: Barco[] = [
  {x: -16, s: 22, ry: 0.4, cor: '#2f6fd0', tomba: 0.32}, {x: 18, s: 55, ry: -0.9, cor: '#e8442e', tomba: -0.28},
  {x: -38, s: 95, ry: 1.3, cor: '#21a37a', tomba: 0.38}, {x: 4, s: 140, ry: 2.4, cor: '#f2c230', tomba: -0.3},
  {x: 34, s: 210, ry: 0.2, cor: '#ffffff', tomba: 0.34}, {x: -62, s: 260, ry: -0.6, cor: '#2f6fd0', tomba: -0.4},
  {x: -10, s: 380, ry: 1.0, cor: '#c23b8a', tomba: 0.3}, {x: 55, s: 520, ry: 2.0, cor: '#e8442e', tomba: 0.36},
  {x: -90, s: 700, ry: 0.7, cor: '#ffffff', tomba: -0.33}, {x: 20, s: 980, ry: -1.4, cor: '#21a37a', tomba: 0.3},
  {x: 120, s: 1500, ry: 0.3, cor: '#ffffff', tomba: 0.25}, {x: -160, s: 2100, ry: 1.9, cor: '#2f6fd0', tomba: -0.3},
];
const Barcos: React.FC<{t: number}> = ({t}) => {
  const casco = useMemo(() => geoCasco(), []);
  const tab = useMemo(() => tabelaSaida(AGUA, JANELA), []);
  const nivel = nivelLocal(t);
  return (
    <group>
      {BARCOS.map((b, i) => {
        const z = -(b.s + Z0), chao = relevoS(b.s, b.x);
        const tEnc = tab.tSaida(b.s - 6);                     // encosta no fundo um pouco antes da linha passar
        const idade = t - tEnc;
        const flut = idade < 0;
        const y = flut ? Math.max(nivel - 0.35, chao) + Math.sin(t * 1.9 + i) * 0.12 : chao - 0.12 * smooth(0, 3, idade);
        const roll = flut ? Math.sin(t * 1.3 + i * 2) * 0.05 : b.tomba * smooth(0, 2.2, idade);
        const pitch = flut ? Math.sin(t * 1.1 + i) * 0.03 : 0.06 * smooth(0, 2, idade);
        const ry = b.ry + (LESTE > 0 ? Math.PI : 0);
        return (
          <group key={i} position={W(b.x, y, z)} rotation={[0, ry, 0]}>
            <group rotation={[pitch, 0, roll]}>
              <mesh geometry={casco} position={[0, 0.42, 0]} castShadow receiveShadow><meshStandardMaterial color={b.cor} roughness={0.45} /></mesh>
              <mesh position={[0, 0.8, 0.4]} castShadow><boxGeometry args={[1.5, 0.06, 4.6]} /><meshStandardMaterial color="#f2efe6" roughness={0.7} /></mesh>
              <mesh position={[0, 0.2, 0]}><boxGeometry args={[1.0, 0.25, 4.5]} /><meshStandardMaterial color="#7a2e22" roughness={0.6} /></mesh>
              <mesh position={[0, 1.0, 2.7]} castShadow><boxGeometry args={[0.35, 0.55, 0.4]} /><meshStandardMaterial color="#222222" roughness={0.4} /></mesh>
              <mesh position={[0, 0.95, 0.1]} castShadow><boxGeometry args={[1.5, 0.12, 0.3]} /><meshStandardMaterial color="#d9c9a8" roughness={0.8} /></mesh>
            </group>
          </group>);
      })}
    </group>
  );
};

// pedras, pneu e ancora no leito (ficam a vista conforme a agua sai)
const Objetos: React.FC = () => {
  const pedras = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(1, 1), P = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), w = 1 + 0.25 * Math.sin(x * 4.1 + y * 3.3 + z * 2.7); P.setXYZ(i, x * w, y * w * 0.55, z * w); }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({color: '#6a6258', roughness: 0.5});
    const N = 130, im = new THREE.InstancedMesh(geo, mat, N), o = new THREE.Object3D(), c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const s = 15 + Math.pow(rnd(i * 3.7 + 1), 1.8) * 900, x = (rnd(i * 5.3 + 2) - 0.5) * (120 + s * 0.9);
      const r = (0.12 + Math.pow(rnd(i * 2.9 + 3), 3) * 1.1) * (1 + s / 600);
      o.position.set(...W(x, relevoS(s, x) + r * 0.1, -(s + Z0))); o.rotation.set(0, rnd(i) * 6.3, 0); o.scale.setScalar(r); o.updateMatrix();
      im.setMatrixAt(i, o.matrix); im.setColorAt(i, c.set('#4a4640').lerp(new THREE.Color('#6b5a44'), rnd(i * 1.1)).multiplyScalar(0.6 + rnd(i * 4.4) * 0.6));
    }
    im.castShadow = true; im.receiveShadow = true; return im;
  }, []);
  return (
    <group>
      <primitive object={pedras} />
      {/* pneu e ancora perto: objetos que o mar escondia */}
      <mesh position={W(-9, relevoS(48, -9) + 0.12, -(48 + Z0))} rotation-x={Math.PI / 2 - 0.15} castShadow receiveShadow><torusGeometry args={[0.38, 0.14, 10, 20]} /><meshStandardMaterial color="#1a1a1a" roughness={0.6} /></mesh>
      <group position={W(22, relevoS(75, 22) + 0.08, -(75 + Z0))} rotation={[0, 0.7, Math.PI / 2 - 0.2]}>
        <mesh castShadow><cylinderGeometry args={[0.07, 0.07, 1.6, 8]} /><meshStandardMaterial color="#5a3a26" roughness={0.6} metalness={0.4} /></mesh>
        <mesh position={[0, -0.75, 0]} rotation-z={Math.PI / 2} castShadow><torusGeometry args={[0.5, 0.06, 6, 16, Math.PI]} /><meshStandardMaterial color="#5a3a26" roughness={0.6} metalness={0.4} /></mesh>
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- palmeiras (atras da camera: so as sombras longas entram no quadro)
// modulo do agente Praia (src/mundo/palmeiras.tsx, Yughues CC0); escala 1 = 9 m. Duas ao fundo a esquerda entram no quadro com o pan.
const PALMAS: PalmeiraItem[] = ([
  {x: -7, z: 9, variante: 'reta', escala: 1.2, rot: 0.4}, {x: -15, z: 6, variante: 'curva', escala: 1.25, rot: 2.1}, {x: -3, z: 15, variante: 'dupla', escala: 1.1, rot: 4.0},
  {x: -22, z: 13, variante: 'reta', escala: 1.25, rot: 1.0}, {x: 6, z: 17, variante: 'trio', escala: 1.05, rot: 5.2}, {x: -29, z: 4, variante: 'duplaCurva', escala: 1.2, rot: 3.3},
  {x: 12, z: 10, variante: 'reta', escala: 1.1, rot: 0.9}, {x: -48, z: -8, variante: 'curva', escala: 1.15, rot: 2.6}, {x: -62, z: -14, variante: 'dupla', escala: 1.1, rot: 1.7},
  // fora do quadro a esquerda: as sombras das copas atravessam o primeiro plano (como no original)
  {x: -14, z: 1, variante: 'reta', escala: 1.3, rot: 1.3}, {x: -22, z: -3, variante: 'dupla', escala: 1.2, rot: 2.9}, {x: -10, z: 5, variante: 'curva', escala: 1.25, rot: 5.6},
  {x: -31, z: -7, variante: 'reta', escala: 1.25, rot: 0.2},
] as PalmeiraItem[]).map((p) => ({...p, y: relevoS(sDe(p.z), p.x) - 0.1}));

// ---------------------------------------------------------------- pessoas (time-lapse: andam rapido; descem atras da agua)
type Papel = {tipo: 'passeia' | 'banhista' | 'nadador' | 'curioso' | 'salva' | 'crianca'; x: number; z: number; v: number; t0: number; dir: number};
const PAPEIS: Papel[] = (() => {
  const out: Papel[] = [];
  for (let i = 0; i < 14; i++) out.push({tipo: 'passeia', x: -100 + rnd(i * 3.3 + 40) * 170, z: -5 - rnd(i * 5.1 + 41) * 21, v: 2.0 + rnd(i * 2.7 + 42) * 1.2, t0: 0, dir: rnd(i * 7.1 + 43) < 0.5 ? 1 : -1});
  for (let i = 0; i < 9; i++) out.push({tipo: 'banhista', x: -50 + rnd(i * 4.3 + 60) * 75, z: -5 - rnd(i * 6.1 + 61) * 20, v: 2.2 + rnd(i * 1.9 + 62) * 0.8, t0: 37 + rnd(i * 2.3 + 63) * 9, dir: 1});
  for (let i = 0; i < 6; i++) out.push({tipo: 'nadador', x: -30 + rnd(i * 3.9 + 80) * 60, z: -(Z0 + 6 + rnd(i * 2.2 + 81) * 20), v: 1.8, t0: 0, dir: 1});
  for (let i = 0; i < 8; i++) out.push({tipo: 'curioso', x: -45 + rnd(i * 5.9 + 90) * 80, z: -10 - rnd(i * 3.1 + 91) * 13, v: 2.4 + rnd(i * 4.7 + 92) * 0.9, t0: 41 + rnd(i * 1.3 + 93) * 8, dir: 1});
  out.push({tipo: 'salva', x: POSTO[0], z: POSTO[1], v: 3.2, t0: 40, dir: 1});
  out.push({tipo: 'crianca', x: -6, z: -14, v: 0, t0: 0, dir: 1}, {tipo: 'crianca', x: -1.5, z: -19, v: 0, t0: 0, dir: -1});
  return out;
})();
const PESSOAS: Pessoa3D[] = PAPEIS.map((p, i) => ({i: 500 + i, x: 0, z: 0, rot: 0, pose: 'parado' as const,
  camisa: p.tipo === 'salva' ? '#e0262b' : undefined, calca: p.tipo === 'salva' ? '#e0262b' : undefined, curta: p.tipo === 'salva' ? true : undefined}));
const PASSADA: Record<string, number> = {Walk_Loop: 1.45, Jog_Fwd_Loop: 2.6, Sprint_Loop: 3.9, Swim_Fwd_Loop: 1.2};
const est = (xp: number, zp: number, yExtra: number, hd: number, clipe: string, tempo: number, visivel = true): Estado3D => {
  const [x, y, z] = W(xp, relevoS(sDe(zp), xp) + yExtra, zp);
  // hd = direcao no projeto (atan2(dx, dz)); no mundo os eixos x e z trocam de sinal com LESTE = 1
  return {x, y, z, ry: LESTE > 0 ? hd + Math.PI : hd, clipe, tempo, visivel};
};
const estadoPapel = (p: Papel, t: number, k: number): Estado3D => {
  const s = (q: number) => rnd(k * 17 + q);
  const linhaZ = -(Z0 + linhaAgua(t));
  if (p.tipo === 'passeia') {
    const d = p.v * (t - 29.9) * p.dir, L = 190, x = ((p.x + d + 120) % L + L) % L - 120;
    return est(x, p.z + Math.sin(t * 0.3 + k) * 1.5, 0, p.dir > 0 ? Math.PI / 2 : -Math.PI / 2, p.v > 2.7 ? 'Jog_Fwd_Loop' : 'Walk_Loop', (p.v * (t - 29.9)) / PASSADA[p.v > 2.7 ? 'Jog_Fwd_Loop' : 'Walk_Loop']);
  }
  if (p.tipo === 'crianca') {
    // duas criancas trocando a bola ate 40 s (correm um pouco a cada passe), depois correm para a agua
    if (t < 40) { const bal = Math.sin((t - 29.9) * Math.PI / 1.6) * 0.8; return est(p.x + bal, p.z + bal * 0.5 * p.dir, 0, p.dir > 0 ? Math.PI * 0.8 : -Math.PI * 0.2, 'Jog_Fwd_Loop', (t * 2.1) % 1); }
    const d = 3.2 * (t - 40), zz = Math.max(p.z - d, linhaZ + 3);
    return est(p.x - d * 0.2 * p.dir, zz, 0, Math.PI, 'Jog_Fwd_Loop', d / PASSADA.Jog_Fwd_Loop);
  }
  if (p.tipo === 'nadador') {
    // nadam enquanto ha agua funda; quando a agua baixa ficam em pe e andam de volta para a areia
    const s0 = sDe(p.z), prof = nivelLocal(t) - relevoS(s0, p.x);
    if (prof > 0.9) return est(p.x + Math.sin(t * 0.7 + k) * 2, p.z, prof - 1.15, 0.3 * Math.sin(t + k), 'Swim_Idle_Loop', t + s(1) * 3);
    let t1 = 36; for (let q = 36; q < 46; q += 0.1) { if (nivelLocal(q) - relevoS(s0, p.x) <= 0.9) { t1 = q; break; } }
    const d = 1.6 * (t - t1), zz = p.z + d;
    return est(p.x, zz, 0, 0, 'Walk_Loop', d / PASSADA.Walk_Loop);
  }
  if (p.tipo === 'banhista') {
    // deitados na toalha ate t0; levantam e andam em time-lapse atras da agua que recua
    if (t < p.t0) return est(p.x, p.z, 0, 1.2 + s(2), s(3) < 0.5 ? 'Sitting_Idle_Loop' : 'Death01', s(3) < 0.5 ? t : 99);
    if (t < p.t0 + 0.9) return est(p.x, p.z, 0, Math.PI, 'Sitting_Exit', t - p.t0);
    const d = p.v * (t - p.t0 - 0.9), zz = p.z - d;
    return est(p.x + Math.sin(d * 0.05 + k) * 2, zz, 0, Math.PI, 'Walk_Loop', d / PASSADA.Walk_Loop);
  }
  if (p.tipo === 'curioso') {
    // andam pela praia ate t0; depois descem para o leito exposto (sempre atras da linha d'agua)
    if (t < p.t0) { const d = 1.7 * (t - 29.9); return est(p.x + ((d + k * 7) % 30) - 15, p.z, 0, Math.PI / 2, 'Walk_Loop', d / PASSADA.Walk_Loop); }
    const d = p.v * (t - p.t0), x0 = p.x + (((1.7 * (p.t0 - 29.9)) + k * 7) % 30) - 15;
    const zz = Math.max(p.z - d, linhaZ + 4), clip = p.v > 2.9 ? 'Jog_Fwd_Loop' : 'Walk_Loop';
    return est(x0 + (s(5) - 0.5) * d * 0.3, zz, 0, Math.PI + (s(5) - 0.5) * 0.3, clip, d / PASSADA[clip]);
  }
  // salva-vidas: na plataforma olhando o mar (troca a bandeira em 38), desce a rampa 40-42,4 e corre para a agua
  const [px, pz] = POSTO, H = 2.75 * ESC_POSTO, E = ESC_POSTO;
  if (t < 40) return est(px + (t < 37.6 ? 0.3 * Math.sin(t) : -0.9) * E, pz + (t < 37.6 ? -0.4 : 0.9) * E, H, t < 37.6 ? Math.PI : 0, t > 37.6 && t < 39.6 ? 'Interact' : 'Idle_Loop', t - 37.6);
  if (t < 42.4) { const u = (t - 40) / 2.4; return est(px + 0.9 * E, pz + (1.7 + 4.6 * u) * E, H * (1 - u), 0, 'Walk_Loop', (u * 5.3 * E) / PASSADA.Walk_Loop); }
  const d = p.v * (t - 42.4), zz = Math.max(pz + 6.3 * E - d, linhaZ + 2);
  return est(px + 0.9 * E - d * 0.1, zz, 0, Math.PI - 0.1, 'Jog_Fwd_Loop', d / PASSADA.Jog_Fwd_Loop);
};

// ---------------------------------------------------------------- gaivotas sobre o leito (comendo o que o mar deixou)
const Gaivotas: React.FC<{t: number}> = ({t}) => {
  const im = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.15, 0, 0, -0.25, -0.6, 0.12, 0, 0, 0, 0.15, 0, 0, -0.25, 0.6, 0.12, 0], 3));
    g.computeVertexNormals();
    const m = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({color: '#f4f4f4', roughness: 0.8, side: THREE.DoubleSide}), 18);
    m.castShadow = true; m.frustumCulled = false; return m;
  }, []);
  const o = new THREE.Object3D(), vis = smooth(45, 47, t);
  for (let i = 0; i < 18; i++) {
    const cx = -20 + rnd(i * 3.1 + 200) * 50, cs = 30 + rnd(i * 4.7 + 201) * 120, R = 6 + rnd(i * 5.3 + 202) * 10, w = 0.35 + rnd(i * 2.3 + 203) * 0.3;
    const a = t * w + rnd(i) * 6.28, x = cx + Math.cos(a) * R, s = cs + Math.sin(a) * R * 0.6, y = relevoS(s, x) + 4 + rnd(i * 6.1) * 6 + Math.sin(t * 0.9 + i) * 1.2;
    o.position.set(...W(x, y, -(s + Z0))); o.rotation.set(Math.sin(t * 9 + i) * 0.35, -a * (LESTE > 0 ? -1 : 1) + Math.PI, 0);
    o.scale.set(1.4, 1.4 * (0.4 + 0.6 * Math.abs(Math.sin(t * 9 + i * 1.3))), 1.4).multiplyScalar(vis); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
  }
  im.instanceMatrix.needsUpdate = true;
  return <primitive object={im} />;
};

// ---------------------------------------------------------------- malecon atras da camera (hoteis de ~30 m): com o Sol baixando, a
// sombra dos predios atravessa a praia (chega na camera em ~49 s e na antiga linha d'agua em ~54 s) — a luz cai como no original
const PREDIOS: [number, number, number, number][] = [[-60, 26, 32, 18], [-30, 31, 26, 16], [-2, 28, 30, 20], [26, 34, 24, 18], [52, 27, 28, 16], [80, 30, 22, 18], [-90, 29, 30, 18]];
const Malecon: React.FC = () => (
  <group>
    {PREDIOS.map(([x, h, w, d], i) => (
      <mesh key={i} position={W(x, h / 2 + relevoS(sDe(92), x), 92 + d / 2)} castShadow>
        <boxGeometry args={[w, h, d]} /><meshStandardMaterial color={['#f1e6d2', '#e8d3b0', '#f4f1ea'][i % 3]} roughness={0.8} />
      </mesh>))}
  </group>
);

// ---------------------------------------------------------------- mundo
export const perfilLeito = (t: number): Perfil => ({bloom: 0.35, limiar: 0.95, vinheta: 0.38, contraste: 0.06, saturacao: -0.04,
  nevoa: {cor: t < 52 ? '#c9d6e2' : '#b9bccb', densidade: 0.00045, max: 0.8}, raios: 0});

export const Leito: React.FC<{t: number}> = ({t}) => {
  const {camera} = useThree();
  const c = camLeito(t);
  const luz = luzEm(t, 'ecuador', RUMO_LEITO);
  const ceuRef = {zenite: luz.ambiente.clone().multiplyScalar(0.3 + 0.8 * luz.dia), horizonte: luz.ambiente.clone().lerp(new THREE.Color(1, 1, 1), 0.55).lerp(luz.corSol, 0.25).multiplyScalar(0.3 + 0.9 * luz.dia)};
  camera.position.set(...c.pos); camera.lookAt(...c.alvo);
  const pc = camera as THREE.PerspectiveCamera;
  if (pc.fov !== c.fov || pc.far < 20000) { pc.fov = c.fov; pc.near = 0.3; pc.far = 30000; pc.updateProjectionMatrix(); }
  camera.updateMatrixWorld();
  const chao = useMemo(() => ({centro: [0, LESTE * 4650] as [number, number], tamanho: [3200, 9600] as [number, number]}), []);
  return (
    <>
      <CeuLugar t={t} lugar="ecuador" rumo={RUMO_LEITO} sombra={75} />
      <ChaoMolhado t={t} tamanho={chao.tamanho} centro={chao.centro} segmentos={[120, 600]} agua={AGUA} janela={JANELA} chave="leito_v1"
        ceu={ceuRef} relevo={relevoMundo} secagem={{umido: 5, seco: 13, racha: 22}} lama={0.55} pocas={0.6} algas={0.55} irregular={5} espraiado={6} repeticao={2.6}
        conchas={{n: 260, area: [-60, LESTE * 20, 60, LESTE * 160], escala: 1.7}} tufos={{n: 260, area: [-80, LESTE * 45, 80, LESTE * 300], escala: 0.7}} />
      <MarLeito t={t} />
      <Posto t={t} />
      <Moveis t={t} />
      <Bola t={t} />
      <Barcos t={t} />
      <Objetos />
      <Palmeiras t={t} lista={PALMAS} vento={1.2} sol={luz.sol} corSol={luz.corSol} />
      <Gaivotas t={t} />
      <Malecon />
      <Multidao3D lista={PESSOAS} t={t} de={[0, 0]} estadoDe={(_p, k, tt) => estadoPapel(PAPEIS[k], tt, k)} />
    </>
  );
};
