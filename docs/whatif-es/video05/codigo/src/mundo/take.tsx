// Take inedito (dono: agente Corpo), 30 s em 386,5 s do video: "Tu cabeza envejece mas rapido que tus pies" (dilatacao
// temporal gravitacional). u = segundos dentro do take (0..30). Camera propria (sem o TRILHO), tudo funcao de u.
//  0-6   voce de pe num vazio escuro, luz suave, grade do espaco-tempo embaixo
//  6-18  relogios holograficos na cabeca e nos pes (CABEZA adianta: +5,85 ns por ano de vida = g*h/c^2 com h = 1,7 m);
//        a grade afunda num poco de gravidade e a Terra aparece embaixo (12-18)
//  18-24 laboratorio: dois relogios atomicos de aluminio, um 33 cm acima do outro (NIST, 2010)
//  24-30 a Terra do espaco com as 6 orbitas GPS (20.200 km, 55 graus): "+38 us / DIA"; escurece no fim
// Fontes dos numeros: public/corpo/FONTES_TAKE.txt
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useFrame, useThree} from '@react-three/fiber';
import {useGLTF, useTexture} from '@react-three/drei';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {staticFile} from 'remotion';
import {loadFont as plex} from '@remotion/google-fonts/IBMPlexSans';
import {loadFont as serif} from '@remotion/google-fonts/SourceSerif4';
import {Perfil} from '../look/Look';
import {criaVoce, poseClipe} from './corpo';
import {rnd, smooth, clamp01} from './comum';

const {fontFamily: SANS} = plex('normal', {weights: ['500', '600'], subsets: ['latin', 'latin-ext']});
const {fontFamily: SERIF} = serif('normal', {weights: ['400'], subsets: ['latin', 'latin-ext']});
const fSans = (px: number, w = 600) => `${w} ${px}px "${SANS}", "Helvetica Neue", Arial, sans-serif`;
const fSerif = (px: number) => `400 ${px}px "${SERIF}", Georgia, "Times New Roman", serif`;

// perfil constante (o compositor do Look e recriado quando o objeto muda)
const PERFIL: Perfil = {bloom: 0.75, limiar: 0.62, vinheta: 0.5, saturacao: 0, contraste: 0.06};
export const perfilTake = (_u: number): Perfil => PERFIL;

// ---------------------------------------------------------------- utilidades
const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
type Chave = [number, number[]];
// interpolacao suave por chaves (smoothstep entre chaves)
const trilha = (K: Chave[], u: number) => {
  let i = 0; while (i < K.length - 2 && u > K[i + 1][0]) i++;
  const [ta, a] = K[i], [tb, b] = K[i + 1];
  const x = smooth(ta, tb, u);
  return a.map((v, k) => lerp(v, b[k], x));
};

// rotulo em canvas (sprite): redesenha so quando o texto (ou a fonte carregada) muda
type Rot = {spr: THREE.Sprite; cv: HTMLCanvasElement; tex: THREE.CanvasTexture; chave: string; asp: number};
const novoRot = (w: number, h: number): Rot => {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({map: tex, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending}));
  spr.renderOrder = 50;
  return {spr, cv, tex, chave: '', asp: w / h};
};
const fontesProntas = () => { try { return document.fonts.check(`20px "${SANS}"`) && document.fonts.check(`20px "${SERIF}"`) ? '1' : '0'; } catch { return '0'; } };
type Linha = {txt: string; font: string; cor: string; y: number; esp?: number; brilho?: number};
const desenhaRot = (r: Rot, linhas: Linha[], extra?: (c: CanvasRenderingContext2D) => void, chaveExtra = '') => {
  const chave = linhas.map((l) => l.txt + l.cor).join('|') + chaveExtra + fontesProntas();
  if (chave === r.chave) return;
  r.chave = chave;
  const c = r.cv.getContext('2d')!; c.clearRect(0, 0, r.cv.width, r.cv.height);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const l of linhas) {
    c.font = l.font; (c as any).letterSpacing = `${l.esp ?? 0}px`;
    c.shadowColor = l.cor; c.shadowBlur = l.brilho ?? 10; c.fillStyle = l.cor;
    c.fillText(l.txt, r.cv.width / 2, l.y * r.cv.height);
  }
  c.shadowBlur = 0;
  extra?.(c);
  r.tex.needsUpdate = true;
};

// mostrador holografico (canvas redesenhado por quadro)
const desenhaHolo = (r: Rot, cor: string, rotulo: string, numero: string, sub: string, ang: number) => {
  desenhaRot(r, [
    {txt: rotulo, font: fSans(50), cor, y: 0.585, esp: 16, brilho: 14},
    {txt: numero, font: fSerif(124), cor: '#ffffff', y: 0.75, brilho: 18},
    {txt: sub, font: fSans(34, 500), cor, y: 0.905, esp: 9, brilho: 8},
  ], (c) => {
    const S = r.cv.width, cx = S / 2, cy = S * 0.27, R = S * 0.2;
    c.strokeStyle = cor; c.shadowColor = cor; c.shadowBlur = 16;
    c.lineWidth = 4; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke();
    c.globalAlpha = 0.35; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, R * 1.12, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1;
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2, L = i % 5 === 0 ? 0.16 : 0.07;
      c.lineWidth = i % 5 === 0 ? 4 : 2;
      c.beginPath(); c.moveTo(cx + Math.sin(a) * R * 0.95, cy - Math.cos(a) * R * 0.95); c.lineTo(cx + Math.sin(a) * R * (0.95 - L), cy - Math.cos(a) * R * (0.95 - L)); c.stroke();
    }
    // arco do quanto o ponteiro ja andou nesta volta
    c.globalAlpha = 0.25; c.lineWidth = R * 0.5; c.beginPath(); c.arc(cx, cy, R * 0.45, -Math.PI / 2, -Math.PI / 2 + (ang % (Math.PI * 2))); c.stroke(); c.globalAlpha = 1;
    c.strokeStyle = '#ffffff'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.sin(ang) * R * 0.86, cy - Math.cos(ang) * R * 0.86); c.stroke();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(cx, cy, 9, 0, Math.PI * 2); c.fill();
    c.shadowBlur = 0;
  }, ang.toFixed(3));
};

// ---------------------------------------------------------------- materiais
const gradeMat = () => new THREE.ShaderMaterial({
  uniforms: {uA: {value: 0.5}, uR0: {value: 3.5}, uY0: {value: -0.02}, uOp: {value: 1}, uS: {value: 0.5}, uRmax: {value: 26},
    uC1: {value: new THREE.Color('#5fb8ff')}, uC2: {value: new THREE.Color('#ffb36b')}},
  vertexShader: `uniform float uA; uniform float uR0; uniform float uY0; varying vec3 vW; varying float vD;
void main(){ vec3 p = position; float r = length(p.xz); float d = uA / sqrt(1.0 + (r / uR0) * (r / uR0));
  p.y = uY0 - d; vD = d / max(uA, 0.001) * smoothstep(0.3, 4.0, uA);
  vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform float uOp; uniform float uS; uniform vec3 uC1; uniform vec3 uC2; uniform float uRmax; varying vec3 vW; varying float vD;
float grade(vec2 g){ vec2 fw = max(fwidth(g), vec2(1e-4)); vec2 l = abs(fract(g - 0.5) - 0.5) / fw; return 1.0 - min(min(l.x, l.y), 1.0); }
void main(){
  vec2 g = vW.xz / uS;
  float linha = grade(g) * 0.9 + grade(g * 4.0) * 0.12;
  float r = length(vW.xz);
  float fade = 1.0 - smoothstep(uRmax * 0.35, uRmax, r);
  vec3 c = mix(uC1, uC2, clamp(vD, 0.0, 1.0));
  float a = linha * fade * uOp * (0.55 + 0.6 * vD);
  gl_FragColor = vec4(c * a * 1.6, 1.0);
}`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
});

const terraMat = (dia: THREE.Texture, noite: THREE.Texture) => new THREE.ShaderMaterial({
  uniforms: {uDia: {value: dia}, uNoite: {value: noite}, uSol: {value: new THREE.Vector3(1, 0.25, 0.6).normalize()}, uOp: {value: 1}},
  vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform sampler2D uDia; uniform sampler2D uNoite; uniform vec3 uSol; uniform float uOp; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main(){
  vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vW);
  float l = dot(n, uSol);
  vec3 d = pow(texture2D(uDia, vUv).rgb, vec3(2.2));
  vec3 nt = pow(texture2D(uNoite, vUv).rgb, vec3(2.2));
  float dia = smoothstep(-0.12, 0.25, l);
  float oceano = smoothstep(0.02, 0.10, d.b - max(d.r, d.g));
  vec3 cor = d * (0.08 + 1.9 * max(l, 0.0)) * dia;
  // espalhamento da atmosfera: o oceano visto do espaco e azul claro, nao preto
  cor += vec3(0.035, 0.09, 0.21) * smoothstep(-0.05, 0.6, l) * (0.6 + 0.6 * oceano);
  // brilho especular do Sol no mar
  vec3 h = normalize(uSol + v); cor += oceano * pow(max(dot(n, h), 0.0), 60.0) * 0.9 * dia * vec3(1.0, 0.92, 0.8);
  cor += nt * vec3(1.0, 0.75, 0.45) * 1.4 * (1.0 - smoothstep(-0.25, 0.05, l));
  // atmosfera na borda
  float fr = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  cor += vec3(0.30, 0.55, 1.0) * fr * (0.15 + 1.2 * smoothstep(-0.3, 0.4, l));
  gl_FragColor = vec4(cor * uOp, 1.0);
}`,
});
const atmosferaMat = () => new THREE.ShaderMaterial({
  uniforms: {uSol: {value: new THREE.Vector3(1, 0.25, 0.6).normalize()}, uOp: {value: 1}},
  vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform vec3 uSol; uniform float uOp; varying vec3 vN; varying vec3 vW;
void main(){ vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vW);
  float k = pow(clamp(1.0 + dot(n, v) * 1.05, 0.0, 1.0), 4.0);
  float lado = smoothstep(-0.4, 0.5, dot(n, uSol));
  gl_FragColor = vec4(vec3(0.35, 0.6, 1.0) * k * (0.2 + 1.3 * lado) * uOp, 1.0); }`,
  side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
});

const texBrilho = () => {
  const S = 128, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d')!, g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.15, 'rgba(255,255,255,0.6)'); g.addColorStop(0.4, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
};

// relogio atomico de laboratorio (camara de vacuo com o ion de aluminio preso e o laser de interrogacao)
const criaRelogioAtomico = (env: THREE.Texture, brilho: THREE.Texture) => {
  const g = new THREE.Group();
  const prata = new THREE.MeshStandardMaterial({color: '#cfd3da', metalness: 1, roughness: 0.22, envMap: env, envMapIntensity: 1.2});
  const escuro = new THREE.MeshStandardMaterial({color: '#23262d', metalness: 0.8, roughness: 0.35, envMap: env, envMapIntensity: 0.8});
  const cobre = new THREE.MeshStandardMaterial({color: '#d8935a', metalness: 1, roughness: 0.3, envMap: env});
  const vidro = new THREE.MeshPhysicalMaterial({color: '#dfe9ff', metalness: 0, roughness: 0.04, transparent: true, opacity: 0.16, envMap: env, envMapIntensity: 2.0, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide});
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, rx = 0, rz = 0) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); g.add(m); return m;
  };
  add(new THREE.CylinderGeometry(0.17, 0.18, 0.035, 48), escuro, 0, 0.0175, 0);
  add(new THREE.CylinderGeometry(0.16, 0.16, 0.025, 48), prata, 0, 0.047, 0);
  add(new THREE.CylinderGeometry(0.13, 0.13, 0.25, 48, 1, true), vidro, 0, 0.185, 0);
  add(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 48), prata, 0, 0.325, 0);
  add(new THREE.CylinderGeometry(0.06, 0.08, 0.05, 32), escuro, 0, 0.365, 0);
  for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + Math.PI / 4; add(new THREE.CylinderGeometry(0.008, 0.008, 0.28, 12), prata, Math.cos(a) * 0.15, 0.185, Math.sin(a) * 0.15); }
  // janelas laterais do laser
  for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 24), prata, s * 0.14, 0.185, 0, 0, Math.PI / 2);
  // armadilha de ions: 4 eletrodos dourados
  for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; add(new THREE.CylinderGeometry(0.004, 0.004, 0.16, 8), cobre, Math.cos(a) * 0.018, 0.185, Math.sin(a) * 0.018); }
  // ion + laser
  const ion = new THREE.Sprite(new THREE.SpriteMaterial({map: brilho, color: new THREE.Color('#c7b6ff').multiplyScalar(2.5), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
  ion.position.set(0, 0.185, 0); ion.scale.setScalar(0.1); g.add(ion);
  const laserMat = new THREE.MeshBasicMaterial({color: new THREE.Color('#8f6bff').multiplyScalar(2.2), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false});
  const laser = add(new THREE.CylinderGeometry(0.0022, 0.0022, 1.0, 8), laserMat, 0, 0.185, 0, 0, Math.PI / 2);
  return {g, ion, laser, laserMat};
};

// regua vertical de 33 cm (canvas)
const texRegua = () => {
  const W = 128, H = 1024, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d')!;
  c.strokeStyle = '#ffffff'; c.shadowColor = '#9fd6ff'; c.shadowBlur = 6;
  c.lineWidth = 4; c.beginPath(); c.moveTo(W * 0.3, 8); c.lineTo(W * 0.3, H - 8); c.stroke();
  for (let i = 0; i <= 33; i++) {
    const y = 8 + (H - 16) * (1 - i / 33), L = i % 10 === 0 ? 0.6 : i % 5 === 0 ? 0.42 : 0.25;
    c.lineWidth = i % 5 === 0 ? 3 : 2; c.beginPath(); c.moveTo(W * 0.3, y); c.lineTo(W * (0.3 + L), y); c.stroke();
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
};

// ---------------------------------------------------------------- componente
export const Take: React.FC<{u: number}> = ({u}) => {
  const {gl, camera} = useThree();
  const masc = useGLTF(staticFile('pessoas/masc.gltf')), anim = useGLTF(staticFile('pessoas/anim.glb')), cabelo = useGLTF(staticFile('pessoas/hair_simpleparted.gltf'));
  const [dia, noite] = useTexture([staticFile('corpo/terra_dia_2k.jpg'), staticFile('corpo/terra_noite_2k.jpg')]);
  const clipes = useMemo(() => Object.fromEntries(anim.animations.map((c) => [c.name, c])) as Record<string, THREE.AnimationClip>, [anim]);
  const env = useMemo(() => { const p = new THREE.PMREMGenerator(gl); const e = p.fromScene(new RoomEnvironment(), 0.04).texture; p.dispose(); return e; }, [gl]);
  const voce = useMemo(() => criaVoce(masc.scene, clipes, 2, cabelo.scene), [masc, clipes, cabelo]);

  const M = useMemo(() => {
    dia.colorSpace = THREE.NoColorSpace; noite.colorSpace = THREE.NoColorSpace; dia.anisotropy = 8;
    const brilho = texBrilho();
    // ---- estrelas (cupula que acompanha a camera)
    const N = 2600, pos = new Float32Array(N * 3), cor = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const z = rnd(i * 3 + 1) * 2 - 1, a = rnd(i * 3 + 2) * Math.PI * 2, r = Math.sqrt(1 - z * z);
      pos.set([r * Math.cos(a) * 900, z * 900, r * Math.sin(a) * 900], i * 3);
      const b = Math.pow(rnd(i * 7 + 5), 6) * 1.6 + 0.08, q = rnd(i * 11);
      cor.set([b * (q < 0.2 ? 1.0 : 0.85), b * 0.9, b * (q > 0.7 ? 1.1 : 0.95)], i * 3);
    }
    const geoE = new THREE.BufferGeometry(); geoE.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geoE.setAttribute('color', new THREE.BufferAttribute(cor, 3));
    const estrelas = new THREE.Points(geoE, new THREE.PointsMaterial({size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
    estrelas.frustumCulled = false; estrelas.renderOrder = -10;

    // ---- conjunto A: voce, a grade, os hologramas, a Terra embaixo
    const A = new THREE.Group();
    const geoG = new THREE.PlaneGeometry(60, 60, 260, 260); geoG.rotateX(-Math.PI / 2);
    const matG = gradeMat();
    const grade = new THREE.Mesh(geoG, matG); grade.frustumCulled = false; grade.renderOrder = 1; A.add(grade);
    // chao de luz sob os pes (circulo suave)
    const poca = new THREE.Mesh(new THREE.CircleGeometry(0.9, 48), new THREE.MeshBasicMaterial({map: brilho, color: new THREE.Color('#7fc4ff').multiplyScalar(0.45), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
    poca.rotation.x = -Math.PI / 2; poca.position.y = 0.005; A.add(poca);
    A.add(voce.raiz);
    const holoCab = novoRot(512, 512), holoPes = novoRot(512, 512), rotIdade = novoRot(1024, 256), rotEixo = novoRot(1024, 512);
    for (const r of [holoCab, holoPes, rotIdade, rotEixo]) A.add(r.spr);
    // fios do holograma ate a cabeca e os pes
    const fioMat = new THREE.LineBasicMaterial({color: new THREE.Color('#9fd6ff'), transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false});
    const fioCab = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), fioMat.clone());
    const fioPes = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), fioMat.clone());
    (fioCab.material as THREE.LineBasicMaterial).color = new THREE.Color('#ffd28a');
    A.add(fioCab, fioPes);
    // linha tracejada dos pes ao centro da Terra (a distancia que decide o ritmo do relogio)
    const texTraco = (() => { const cv = document.createElement('canvas'); cv.width = 8; cv.height = 64; const c = cv.getContext('2d')!;
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, 8, 38); const t = new THREE.CanvasTexture(cv); t.wrapT = THREE.RepeatWrapping; return t; })();
    const prumo = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 8, 1, true), new THREE.MeshBasicMaterial({map: texTraco, color: new THREE.Color('#ffd28a').multiplyScalar(1.6),
      transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false}));
    prumo.frustumCulled = false; A.add(prumo);
    const matT = terraMat(dia, noite), matAt = atmosferaMat();
    const terraA = new THREE.Group();
    const tA = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), matT); terraA.add(tA);
    const atA = new THREE.Mesh(new THREE.SphereGeometry(1.06, 64, 48), matAt); terraA.add(atA);
    A.add(terraA);

    // ---- conjunto B: laboratorio
    const B = new THREE.Group();
    const piso = new THREE.Mesh(new THREE.CircleGeometry(7, 64), new THREE.MeshStandardMaterial({color: '#0c0e13', roughness: 0.28, metalness: 0.4, envMap: env, envMapIntensity: 0.25}));
    piso.rotation.x = -Math.PI / 2; B.add(piso);
    const pedMat = new THREE.MeshStandardMaterial({color: '#2b2f37', roughness: 0.4, metalness: 0.6, envMap: env, envMapIntensity: 0.6});
    const ped1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.62, 0.42), pedMat); ped1.position.set(-0.42, 0.31, 0); B.add(ped1);
    const ped2 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.95, 0.42), pedMat); ped2.position.set(0.42, 0.475, 0); B.add(ped2);
    const rel1 = criaRelogioAtomico(env, brilho), rel2 = criaRelogioAtomico(env, brilho);
    rel1.g.position.set(-0.42, 0.62, 0); rel2.g.position.set(0.42, 0.95, 0); B.add(rel1.g, rel2.g);
    const regua = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.33 * 1024 / 1008), new THREE.MeshBasicMaterial({map: texRegua(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(1.3, 1.4, 1.5)}));
    regua.position.set(0.02, 0.62 + 0.185 + 0.165, 0.25); B.add(regua);
    const traco = (y: number, x0: number, x1: number) => {
      const pts: THREE.Vector3[] = []; for (let x = x0; x < x1; x += 0.03) pts.push(new THREE.Vector3(x, y, 0.25), new THREE.Vector3(Math.min(x + 0.017, x1), y, 0.25));
      const l = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({color: '#bfe3ff', transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false}));
      B.add(l); return l;
    };
    traco(0.62 + 0.185, -0.42, 0.02); traco(0.95 + 0.185, 0.02, 0.42);
    const rot33 = novoRot(512, 256), rotLab = novoRot(1024, 256), rotRapido = novoRot(1024, 256), rotLento = novoRot(1024, 256);
    for (const r of [rot33, rotLab, rotRapido, rotLento]) B.add(r.spr);

    // ---- conjunto C: a Terra do espaco com as orbitas GPS (1 unidade = 1000 km)
    const C = new THREE.Group();
    const terraC = new THREE.Group();
    const tC = new THREE.Mesh(new THREE.SphereGeometry(6.371, 128, 96), matT); terraC.add(tC);
    const atC = new THREE.Mesh(new THREE.SphereGeometry(6.371 * 1.035, 96, 64), matAt); terraC.add(atC);
    C.add(terraC);
    const RO = 6.371 + 20.2;
    const planos: THREE.Group[] = [], sats: THREE.Sprite[] = [];
    const orbMat = new THREE.MeshBasicMaterial({color: new THREE.Color('#62b6ff').multiplyScalar(0.55), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false});
    const corpoSat = new THREE.MeshStandardMaterial({color: '#e8d9a8', metalness: 0.8, roughness: 0.3, envMap: env});
    const painel = new THREE.MeshStandardMaterial({color: '#1d3f8a', metalness: 0.4, roughness: 0.25, envMap: env, emissive: new THREE.Color('#1a3366'), emissiveIntensity: 0.4});
    for (let p = 0; p < 6; p++) {
      const pl = new THREE.Group();
      pl.rotation.set(0, (p / 6) * Math.PI * 2, 0); // RAAN
      const inc = new THREE.Group(); inc.rotation.x = (55 * Math.PI) / 180; pl.add(inc);
      const anel = new THREE.Mesh(new THREE.TorusGeometry(RO, 0.035, 6, 256), orbMat); anel.rotation.x = Math.PI / 2; inc.add(anel);
      for (let s = 0; s < 4; s++) {
        const sat = new THREE.Group();
        const caixa = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), corpoSat); sat.add(caixa);
        const pn = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.02, 0.32), painel); sat.add(pn);
        const gl_ = new THREE.Sprite(new THREE.SpriteMaterial({map: brilho, color: new THREE.Color('#bfe2ff').multiplyScalar(1.6), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
        gl_.scale.setScalar(1.6); sat.add(gl_);
        sat.userData = {fase: (s / 4) * Math.PI * 2 + p * 0.55}; inc.add(sat); sats.push(gl_);
      }
      planos.push(pl); C.add(pl);
    }
    const rotGPS = novoRot(1024, 256), rot38 = novoRot(1024, 512);
    for (const r of [rotGPS, rot38]) C.add(r.spr);

    // ---- luzes (sempre montadas)
    const chave = new THREE.SpotLight('#fff1e0', 0, 0, 0.55, 0.85, 2); const alvo = new THREE.Object3D(); chave.target = alvo;
    const recorte = new THREE.SpotLight('#8cc8ff', 0, 0, 0.6, 0.9, 2); const alvo2 = new THREE.Object3D(); recorte.target = alvo2;
    const amb = new THREE.HemisphereLight('#6d86b0', '#0b0d12', 0);
    const solC = new THREE.DirectionalLight('#ffffff', 0);
    // ---- cortina preta presa a camera (fades)
    const cortina = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({color: '#000000', transparent: true, opacity: 1, depthTest: false, depthWrite: false}));
    cortina.renderOrder = 9999; cortina.frustumCulled = false;
    return {estrelas, A, prumo, grade, matG, poca, holoCab, holoPes, rotIdade, rotEixo, fioCab, fioPes, terraA, matT, matAt, B, rel1, rel2, rot33, rotLab, rotRapido, rotLento,
      C, terraC, planos, rotGPS, rot38, chave, alvo, recorte, alvo2, amb, solC, cortina};
  }, [dia, noite, env, voce]);

  // ---------------- estado deste quadro
  const segA = u < 18, segB = u >= 18 && u < 24, segC = u >= 24;
  M.A.visible = segA; M.B.visible = segB; M.C.visible = segC;
  const preto = Math.max(1 - smooth(0, 0.9, u), u < 18 ? smooth(17.55, 18.0, u) : 0, u >= 18 && u < 24 ? 1 - smooth(18.0, 18.45, u) : 0,
    u >= 18 && u < 24 ? smooth(23.55, 24.0, u) : 0, u >= 24 ? 1 - smooth(24.0, 24.45, u) : 0, smooth(28.6, 29.85, u));
  (M.cortina.material as THREE.MeshBasicMaterial).opacity = clamp01(preto);

  // luzes padrao
  M.chave.intensity = 0; M.recorte.intensity = 0; M.amb.intensity = 0; M.solC.intensity = 0;

  if (segA) {
    // voce: parado, respirando; um leve giro para a camera
    poseClipe(voce, clipes, 'Idle_Loop', u * 0.9 + 0.3);
    voce.raiz.position.set(0, 0, 0); voce.raiz.rotation.set(0, 0.32, 0); voce.raiz.updateMatrixWorld(true);
    M.chave.position.set(1.6, 4.2, 2.6); M.alvo.position.set(0, 1.0, 0); M.chave.intensity = 26;
    M.recorte.position.set(-1.8, 2.8, -2.6); M.alvo2.position.set(0, 1.2, 0); M.recorte.intensity = 22;
    M.amb.intensity = 0.25;
    // poco de gravidade: quase plano no inicio, afunda 12-17 rumo a Terra que aparece embaixo
    const fundo = lerp(0.35, 9, smooth(11.5, 16.5, u));
    M.matG.uniforms.uA.value = fundo; M.matG.uniforms.uR0.value = lerp(3.0, 4.5, smooth(11.5, 16.5, u));
    M.matG.uniforms.uOp.value = smooth(0.2, 2.2, u) * 0.9; M.matG.uniforms.uRmax.value = lerp(14, 30, smooth(11, 16, u));
    (M.poca.material as THREE.MeshBasicMaterial).opacity = 1 - smooth(11, 14, u);
    const rT = 4.2;
    M.terraA.position.set(0, -fundo - rT - 0.6, 0); M.terraA.scale.setScalar(rT); M.terraA.rotation.y = 2.4 + u * 0.03;
    M.terraA.visible = u > 10.5;
    {
      const yc = M.terraA.position.y, L = -yc;
      M.prumo.position.set(0, yc / 2, 0); M.prumo.scale.set(1 + L * 0.02, L, 1 + L * 0.02);
      const mp = M.prumo.material as THREE.MeshBasicMaterial; mp.map!.repeat.set(1, L / 0.7); mp.map!.offset.set(0, -u * 0.6);
      (M.prumo.material as THREE.MeshBasicMaterial).opacity = 0.85 * smooth(12.3, 13.5, u);
      M.prumo.visible = u > 12.3;
    }
    M.matT.uniforms.uOp.value = smooth(10.5, 13.5, u); M.matAt.uniforms.uOp.value = smooth(10.5, 13.5, u);
    M.matT.uniforms.uSol.value.set(0.8, 0.5, 0.6).normalize(); M.matAt.uniforms.uSol.value.copy(M.matT.uniforms.uSol.value);

    // hologramas (6-18): cabeca adianta 5,85 ns por ano de vida (h = 1,7 m); 80 anos em 7-17 s
    const apar = smooth(6.0, 6.9, u);
    const anos = 80 * smooth(7.0, 16.5, u);
    const ns = anos * 5.85;
    const volta = Math.max(0, u - 6) * 1.6;
    const escH = 1.12 * apar * lerp(1, 2.2, smooth(12, 16.5, u));
    const lado = lerp(1.2, 2.6, smooth(12, 16.5, u));
    desenhaHolo(M.holoCab, '#ffd28a', 'CABEZA', `+${ns.toFixed(ns < 100 ? 1 : 0).replace('.', ',')} ns`, 'MÁS RÁPIDO', volta + (ns / 468) * 0.9);
    desenhaHolo(M.holoPes, '#8fd8ff', 'PIES', '0 ns', 'REFERENCIA', volta);
    M.holoCab.spr.position.set(lado * 0.9, 1.72 + (escH - 1.12) * 0.2, 0.3); M.holoCab.spr.scale.set(escH, escH, 1);
    M.holoPes.spr.position.set(lado * 0.9, 0.36 - (escH - 1.12) * 0.35, 0.3); M.holoPes.spr.scale.set(escH, escH, 1);
    M.holoCab.spr.material.opacity = apar; M.holoPes.spr.material.opacity = apar;
    const pc = (M.fioCab.geometry.attributes.position as THREE.BufferAttribute), pp = (M.fioPes.geometry.attributes.position as THREE.BufferAttribute);
    pc.setXYZ(0, 0.12, 1.66, 0.05); pc.setXYZ(1, M.holoCab.spr.position.x - escH * 0.22, M.holoCab.spr.position.y + escH * 0.23, 0.3); pc.needsUpdate = true;
    pp.setXYZ(0, 0.14, 0.08, 0.1); pp.setXYZ(1, M.holoPes.spr.position.x - escH * 0.22, M.holoPes.spr.position.y + escH * 0.23, 0.3); pp.needsUpdate = true;
    (M.fioCab.material as THREE.LineBasicMaterial).opacity = 0.7 * apar; (M.fioPes.material as THREE.LineBasicMaterial).opacity = 0.7 * apar;
    M.fioCab.visible = M.fioPes.visible = apar > 0.01;
    // idade vivida (acima)
    desenhaRot(M.rotIdade, [
      {txt: 'TIEMPO VIVIDO', font: fSans(40), cor: '#cfe6ff', y: 0.28, esp: 16},
      {txt: `${Math.floor(anos)} AÑOS`, font: fSerif(110), cor: '#ffffff', y: 0.68, esp: 4, brilho: 16},
    ]);
    const escI = 1.5 * lerp(1, 2.2, smooth(12, 16.5, u));
    M.rotIdade.spr.position.set(-lado * 0.85, 2.0 + (escI - 1.5) * 0.25, 0); M.rotIdade.spr.scale.set(escI, escI / M.rotIdade.asp, 1);
    M.rotIdade.spr.material.opacity = smooth(6.8, 7.6, u);
    // eixo "mais longe do centro = mais rapido" (12-18)
    desenhaRot(M.rotEixo, [
      {txt: '↑  MÁS LEJOS DEL CENTRO', font: fSans(44), cor: '#ffd28a', y: 0.22, esp: 10},
      {txt: 'MÁS RÁPIDO', font: fSerif(96), cor: '#ffffff', y: 0.46, brilho: 16},
      {txt: '↓  CENTRO DE LA TIERRA: MÁS LENTO', font: fSans(40), cor: '#8fd8ff', y: 0.80, esp: 10},
    ]);
    M.rotEixo.spr.position.set(-8.5, -1.2, 0); M.rotEixo.spr.scale.set(7, 7 / M.rotEixo.asp, 1);
    M.rotEixo.spr.material.opacity = smooth(12.6, 13.6, u);
  }

  if (segB) {
    const v = u - 18;
    M.chave.position.set(1.4, 3.2, 2.2); M.alvo.position.set(0, 0.8, 0); M.chave.intensity = 30;
    M.recorte.position.set(-1.5, 2.4, -2.0); M.alvo2.position.set(0, 0.9, 0); M.recorte.intensity = 26;
    M.amb.intensity = 0.3;
    for (const [r, k] of [[M.rel1, 0], [M.rel2, 1]] as const) {
      const pulso = 0.8 + 0.2 * Math.sin(u * (k ? 9.0 : 8.6) * Math.PI);
      r.ion.scale.setScalar(0.09 * pulso + 0.04); r.laserMat.opacity = 0.55 + 0.25 * pulso;
      r.laser.scale.set(1, smooth(0.6, 1.4, v) * 1.0 + 0.001, 1);
    }
    desenhaRot(M.rot33, [{txt: '33 cm', font: fSerif(150), cor: '#ffffff', y: 0.5, brilho: 20}]);
    M.rot33.spr.position.set(0.0, 0.62 + 0.185 + 0.165, 0.36); M.rot33.spr.scale.set(0.4, 0.2, 1);
    M.rot33.spr.material.opacity = smooth(1.2, 2.0, v);
    M.rot33.spr.position.set(-0.17, 1.16, 0.3);
    desenhaRot(M.rotLab, [
      {txt: 'NIST · 2010', font: fSans(44), cor: '#bfe3ff', y: 0.28, esp: 18},
      {txt: 'Relojes atómicos de aluminio', font: fSerif(66), cor: '#ffffff', y: 0.68, brilho: 14},
    ]);
    M.rotLab.spr.position.set(0, 1.74, -0.1); M.rotLab.spr.scale.set(1.2, 1.2 / M.rotLab.asp, 1); M.rotLab.spr.material.opacity = smooth(0.4, 1.2, v);
    desenhaRot(M.rotRapido, [{txt: 'MÁS ARRIBA → MÁS RÁPIDO', font: fSans(46), cor: '#ffd28a', y: 0.35, esp: 10}, {txt: '+90 ns en 79 años', font: fSerif(70), cor: '#ffffff', y: 0.72}]);
    M.rotRapido.spr.position.set(0.66, 1.47, 0.1); M.rotRapido.spr.scale.set(0.85, 0.85 / M.rotRapido.asp, 1); M.rotRapido.spr.material.opacity = smooth(2.6, 3.4, v);
    desenhaRot(M.rotLento, [{txt: 'MÁS ABAJO', font: fSans(46), cor: '#8fd8ff', y: 0.5, esp: 10}]);
    M.rotLento.spr.position.set(-0.86, 1.06, 0.1); M.rotLento.spr.scale.set(0.75, 0.75 / M.rotLento.asp, 1); M.rotLento.spr.material.opacity = smooth(2.6, 3.4, v);
  }

  if (segC) {
    const v = u - 24;
    M.solC.position.set(60, 20, 35); M.solC.intensity = 2.5;
    M.matT.uniforms.uOp.value = 1; M.matAt.uniforms.uOp.value = 1;
    M.matT.uniforms.uSol.value.set(0.75, 0.35, 0.9).normalize(); M.matAt.uniforms.uSol.value.copy(M.matT.uniforms.uSol.value);
    M.terraC.rotation.y = 1.2 + v * 0.05;
    M.planos.forEach((pl) => {
      const inc = pl.children[0];
      inc.children.forEach((s) => { if (s.userData.fase === undefined) return;
        const a = s.userData.fase + v * 0.32; const R = 6.371 + 20.2;
        s.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); s.lookAt(0, 0, 0); });
    });
    desenhaRot(M.rotGPS, [{txt: 'GPS · 20.200 KM', font: fSans(56), cor: '#9fd6ff', y: 0.5, esp: 16}]);
    M.rotGPS.spr.material.opacity = smooth(0.5, 1.3, v);
  }

  // ---------------- camera do take (e a cortina e os rotulos presos ao quadro)
  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    let p: number[], alvo: number[], fov = 38;
    if (u < 18) {
      const K: Chave[] = [[0, [1.0, 1.45, 3.0, 0, 1.15, 0]], [6, [1.6, 1.2, 3.9, 0.3, 1.0, 0]], [11.5, [2.2, 0.9, 4.6, 0.3, 0.9, 0]],
        [16.5, [12.5, 5.0, 26, 0, -4.4, 0]], [18, [13.5, 4.8, 28.5, 0, -4.8, 0]]];
      const s = trilha(K, u); p = s.slice(0, 3); alvo = s.slice(3);
    } else if (u < 24) {
      const v = u - 18, a = lerp(0.55, 0.12, smooth(0, 6, v)), R = lerp(3.0, 2.7, smooth(0, 6, v));
      p = [Math.sin(a) * R, lerp(1.4, 1.25, smooth(0, 6, v)), Math.cos(a) * R]; alvo = [0, 1.05, 0];
    } else {
      const v = u - 24, R = lerp(40, 64, smooth(0, 6, v)), a = 0.5 + v * 0.03;
      p = [Math.sin(a) * R, R * 0.22, Math.cos(a) * R]; alvo = [0, 2.5, 0]; fov = 40;
    }
    cam.position.set(p[0], p[1], p[2]); cam.up.set(0, 1, 0); cam.lookAt(alvo[0], alvo[1], alvo[2]);
    if (cam.fov !== fov || cam.near !== 0.05 || cam.far !== 5000) { cam.fov = fov; cam.near = 0.05; cam.far = 5000; cam.updateProjectionMatrix(); }
    cam.updateMatrixWorld();
    M.estrelas.position.copy(cam.position);
    const frente = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion), cima = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
    M.cortina.position.copy(cam.position).addScaledVector(frente, 0.2); M.cortina.quaternion.copy(cam.quaternion);
    if (u >= 24) {
      // "+38 us / DIA" preso ao quadro, no terco de cima
      const v = u - 24, d = 10, h = 2 * d * Math.tan((fov * Math.PI) / 360);
      desenhaRot(M.rot38, [
        {txt: 'RELOJES GPS', font: fSans(44), cor: '#bfe3ff', y: 0.16, esp: 18},
        {txt: '+38 µs / DÍA', font: fSerif(170), cor: '#ffffff', y: 0.46, brilho: 22},
        {txt: '+45 GRAVEDAD   ·   −7 VELOCIDAD', font: fSans(40, 500), cor: '#ffd28a', y: 0.78, esp: 10},
      ]);
      M.rot38.spr.position.copy(cam.position).addScaledVector(frente, d).addScaledVector(cima, h * 0.27);
      M.rot38.spr.scale.set(h * 0.62, (h * 0.62) / M.rot38.asp, 1); M.rot38.spr.material.opacity = smooth(1.0, 1.9, v);
      const direita = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
      M.rotGPS.spr.position.copy(cam.position).addScaledVector(frente, d).addScaledVector(direita, h * 0.55).addScaledVector(cima, -h * 0.08);
      M.rotGPS.spr.scale.set(h * 0.36, (h * 0.36) / M.rotGPS.asp, 1);
    }
  }, -1);

  return (
    <>
      <color attach="background" args={['#020306']} />
      <primitive object={M.estrelas} />
      <primitive object={M.A} />
      <primitive object={M.B} />
      <primitive object={M.C} />
      <primitive object={M.chave} /><primitive object={M.alvo} />
      <primitive object={M.recorte} /><primitive object={M.alvo2} />
      <primitive object={M.amb} />
      <primitive object={M.solC} />
      <primitive object={M.cortina} />
    </>
  );
};
