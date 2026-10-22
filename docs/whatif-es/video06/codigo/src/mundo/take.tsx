// Take inedito (dono: agente Take), 30 s em 244,9 s do video: "A Terra JA esta girando mais devagar" (atrito das mares).
// u = segundos dentro do take (0..30). Camera propria (useThree), tudo funcao de u. Fontes: public/take/FONTES_TAKE.txt
//  0-6    a Terra e a Lua no espaco, de verdade, hoje: a Terra girando (seta ROTACION), o bojo de mare (exagerado) adiantado
//         a frente da linha Terra-Lua, e a seta FRENO DE MAREA contra o giro (3,2 s)
//  6-12   a Lua puxa o bojo (linha de tracao), o freio pulsa; laser das Apollo vai e volta (6,5-10,5); a Lua se afasta com
//         a regua "+3,8 cm / ANO" (7,5 s); o giro da Terra desacelera
//  12-18  contador DURACION DEL DIA "24 h 00 min 00,0000 s" ganhando 1,8 ms por seculo; camera aproxima da Terra; escurece
//  18-30  coral fossil do Devoniano em close (linhas diarias finas como os aneis de um tronco); uma luz conta as linhas de
//         1 a 400 entre dois aneis anuais (19,6-23,6); colchete "1 ANO"; "~400 DIAS POR ANO · HACE 400 MILLONES DE ANOS";
//         "1 DIA ~ 22 h"; "J. W. WELLS · NATURE · 1963"; escurece no fim
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useFrame, useThree} from '@react-three/fiber';
import {useTexture} from '@react-three/drei';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {staticFile} from 'remotion';
import {loadFont as plex} from '@remotion/google-fonts/IBMPlexSans';
import {loadFont as serif} from '@remotion/google-fonts/SourceSerif4';
import {Perfil} from '../look/Look';
import {rnd, smooth, clamp01} from './comum';

const {fontFamily: SANS} = plex('normal', {weights: ['500', '600'], subsets: ['latin', 'latin-ext']});
const {fontFamily: SERIF} = serif('normal', {weights: ['400'], subsets: ['latin', 'latin-ext']});
const fSans = (px: number, w = 600) => `${w} ${px}px "${SANS}", "Helvetica Neue", Arial, sans-serif`;
const fSerif = (px: number) => `400 ${px}px "${SERIF}", Georgia, "Times New Roman", serif`;

// perfil constante (o compositor do Look e recriado quando o objeto muda)
const PERFIL: Perfil = {bloom: 0.7, limiar: 0.62, vinheta: 0.5, saturacao: 0, contraste: 0.06};
export const perfilTake = (_u: number): Perfil => PERFIL;

// ---------------------------------------------------------------- utilidades
const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
const pulso = (a: number, b: number, x: number) => smooth(a, a + 0.5, x) * (1 - smooth(b - 0.5, b, x));
const CIMA = new THREE.Vector3(0, 1, 0);

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
type Linha = {txt: string; font: string; cor: string; y: number; esp?: number; brilho?: number; x?: number; alinha?: CanvasTextAlign};
const desenhaRot = (r: Rot, linhas: Linha[], extra?: (c: CanvasRenderingContext2D) => void, chaveExtra = '') => {
  const chave = linhas.map((l) => l.txt + l.cor).join('|') + chaveExtra + fontesProntas();
  if (chave === r.chave) return;
  r.chave = chave;
  const c = r.cv.getContext('2d')!; c.clearRect(0, 0, r.cv.width, r.cv.height);
  c.textBaseline = 'middle';
  for (const l of linhas) {
    c.textAlign = l.alinha ?? 'center';
    c.font = l.font; (c as any).letterSpacing = `${l.esp ?? 0}px`;
    (c as any).letterSpacing = '0px';
    const glifos = c.measureText(l.txt).width, extra = (l.esp ?? 0) * l.txt.length, lim = r.cv.width * 0.94;
    if (glifos + extra > lim) c.font = l.font.replace(/(\d+)px/, (_m, n) => `${Math.floor(Number(n) * Math.max(0.3, (lim - extra) / glifos))}px`);
    (c as any).letterSpacing = `${l.esp ?? 0}px`;
    c.shadowColor = l.cor; c.shadowBlur = l.brilho ?? 10; c.fillStyle = l.cor;
    c.fillText(l.txt, (l.x ?? 0.5) * r.cv.width, l.y * r.cv.height);
  }
  c.shadowBlur = 0;
  extra?.(c);
  r.tex.needsUpdate = true;
};
// rotulo com um fio fino em cima (estilo holografico)
const filete = (cor: string, y = 0.08, x0 = 0.3, x1 = 0.7) => (c: CanvasRenderingContext2D) => {
  const W = c.canvas.width, H = c.canvas.height;
  c.strokeStyle = cor; c.globalAlpha = 0.7; c.lineWidth = 3; c.shadowColor = cor; c.shadowBlur = 8;
  c.beginPath(); c.moveTo(W * x0, H * y); c.lineTo(W * x1, H * y); c.stroke(); c.globalAlpha = 1; c.shadowBlur = 0;
};
const opac = (r: Rot, a: number) => { r.spr.material.opacity = clamp01(a); r.spr.visible = a > 0.004; };

// ---------------------------------------------------------------- materiais do espaco
const terraMat = (dia: THREE.Texture, noite: THREE.Texture, sol: THREE.Vector3) => new THREE.ShaderMaterial({
  uniforms: {uDia: {value: dia}, uNoite: {value: noite}, uSol: {value: sol.clone()}, uOp: {value: 1}},
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
  cor += vec3(0.035, 0.09, 0.21) * smoothstep(-0.05, 0.6, l) * (0.6 + 0.6 * oceano);
  vec3 h = normalize(uSol + v); cor += oceano * pow(max(dot(n, h), 0.0), 60.0) * 0.9 * dia * vec3(1.0, 0.92, 0.8);
  cor += nt * vec3(1.0, 0.75, 0.45) * 1.4 * (1.0 - smoothstep(-0.25, 0.05, l));
  float fr = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  cor += vec3(0.30, 0.55, 1.0) * fr * (0.15 + 1.2 * smoothstep(-0.3, 0.4, l));
  gl_FragColor = vec4(cor * uOp, 1.0);
}`,
});
const atmosferaMat = (sol: THREE.Vector3) => new THREE.ShaderMaterial({
  uniforms: {uSol: {value: sol.clone()}, uOp: {value: 1}},
  vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform vec3 uSol; uniform float uOp; varying vec3 vN; varying vec3 vW;
void main(){ vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vW);
  float k = pow(clamp(1.0 + dot(n, v) * 1.05, 0.0, 1.0), 4.0);
  float lado = smoothstep(-0.4, 0.5, dot(n, uSol));
  gl_FragColor = vec4(vec3(0.35, 0.6, 1.0) * k * (0.2 + 1.3 * lado) * uOp, 1.0); }`,
  side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
});
// bojo de mare: casca de agua translucida (elipsoide), iluminada pelo Sol, com borda brilhante e ondulacao fina
const bojoMat = (sol: THREE.Vector3) => new THREE.ShaderMaterial({
  uniforms: {uSol: {value: sol.clone()}, uOp: {value: 0}, uT: {value: 0}},
  vertexShader: `varying vec3 vN; varying vec3 vW; varying vec3 vP; void main(){ vP = position; vN = normalize(mat3(modelMatrix) * normal);
    vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform vec3 uSol; uniform float uOp; uniform float uT; varying vec3 vN; varying vec3 vW; varying vec3 vP;
void main(){ vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vW);
  float fr = pow(1.0 - abs(dot(n, v)), 2.2);
  float l = max(dot(n, uSol), 0.0);
  float alto = smoothstep(0.3, 0.95, abs(vP.x));           // cristas do bojo (eixo x local)
  float onda = 0.5 + 0.5 * sin(vP.x * 26.0 - uT * 3.0 + sin(vP.z * 9.0) * 1.5);
  vec3 fundo = vec3(0.02, 0.16, 0.42), raso = vec3(0.25, 0.70, 1.0);
  vec3 c = mix(fundo, raso, 0.35 + 0.65 * fr) * (0.25 + 1.1 * l);
  c += vec3(0.3, 0.7, 1.0) * fr * 0.6 * (0.4 + 0.6 * alto);
  c += vec3(0.6, 0.9, 1.0) * onda * alto * 0.10;
  vec3 h = normalize(uSol + v); c += pow(max(dot(n, h), 0.0), 80.0) * vec3(1.0, 0.95, 0.85) * 1.4;
  float esp = length(vW) - 1.0;                              // espessura da agua acima da superficie
  float vis = smoothstep(0.0, 0.07, esp);
  c = mix(c, c * vec3(0.7, 0.95, 1.2), smoothstep(0.05, 0.2, esp));
  float a = (0.05 + 0.55 * fr + 0.16 * alto) * vis * uOp;
  gl_FragColor = vec4(c, a); }`,
  transparent: true, depthWrite: false,
});

const texBrilho = () => {
  const S = 128, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d')!, g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.15, 'rgba(255,255,255,0.6)'); g.addColorStop(0.4, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
};
const texTraco = () => {
  const cv = document.createElement('canvas'); cv.width = 8; cv.height = 64; const c = cv.getContext('2d')!;
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, 8, 36); const t = new THREE.CanvasTexture(cv); t.wrapT = THREE.RepeatWrapping; return t;
};
const matLuz = (cor: string, k: number, op = 1) => new THREE.MeshBasicMaterial({color: new THREE.Color(cor).multiplyScalar(k), transparent: true, opacity: op,
  blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false});

// seta em arco (tubo + ponta conica); angulo a: ponto (R cos a, h, -R sin a) => a crescente = sentido da rotacao (rotation.y)
type Seta = {g: THREE.Group; tubo: THREE.Mesh; ponta: THREE.Mesh; mat: THREE.MeshBasicMaterial; n: number};
const criaSeta = (R: number, h: number, a0: number, a1: number, raio: number, cor: string, k: number): Seta => {
  const pt = (a: number) => new THREE.Vector3(R * Math.cos(a), h, -R * Math.sin(a));
  const curva = new THREE.CatmullRomCurve3(Array.from({length: 41}, (_, i) => pt(lerp(a0, a1, i / 40))));
  const n = 96, mat = matLuz(cor, k);
  const tubo = new THREE.Mesh(new THREE.TubeGeometry(curva, n, raio, 8, false), mat);
  const ponta = new THREE.Mesh(new THREE.ConeGeometry(raio * 3.2, raio * 9, 16), mat);
  const fim = pt(a1), s = Math.sign(a1 - a0);
  const dir = new THREE.Vector3(-Math.sin(a1), 0, -Math.cos(a1)).multiplyScalar(s).normalize();
  ponta.position.copy(fim).addScaledVector(dir, raio * 3); ponta.quaternion.setFromUnitVectors(CIMA, dir);
  const g = new THREE.Group(); g.add(tubo, ponta);
  return {g, tubo, ponta, mat, n};
};
const revela = (s: Seta, f: number, op: number) => {
  const k = Math.round(clamp01(f) * s.n);
  s.tubo.geometry.setDrawRange(0, k * 8 * 6);
  s.ponta.visible = f > 0.97; s.g.visible = op > 0.004 && k > 0; s.mat.opacity = op;
};
// cilindro (tracejado) entre dois pontos
const liga = (m: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3, esp: number) => {
  const d = b.clone().sub(a), L = d.length();
  m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(CIMA, d.normalize()); m.scale.set(esp, L, esp);
  return L;
};

// ---------------------------------------------------------------- coral fossil (coral rugoso "chifre" do Devoniano)
// fase = numero da linha de crescimento diaria ao longo do eixo (s = 0 ponta .. 1 calice); aneis anuais nas fases ANUAIS
const NL = 1100;
const ANUAIS = [150, 550, 950];
const faseDe = (s: number) => s * NL + 1.5 * Math.sin(s * 23.0) + 0.6 * Math.sin(s * 71.0);
const sDaFase = (f: number) => { let a = 0, b = 1; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (faseDe(m) < f) a = m; else b = m; } return (a + b) / 2; };
const LC = 1.0;
const eixoCoral = (s: number) => new THREE.Vector3((s - 0.5) * LC, 0.16 * LC * s * s, 0.07 * LC * Math.sin(s * Math.PI));
const raioCoral = (s: number) => {
  const f = faseDe(s);
  let r = 0.19 * (0.035 + 0.965 * Math.pow(s, 0.78));
  for (const b of ANUAIS) r *= 1 - 0.09 * Math.exp(-Math.pow((f - b) / 12, 2)) + 0.03 * Math.exp(-Math.pow((f - b - 40) / 30, 2));
  r *= 1 + 0.018 * Math.sin(s * 55 + 1.3) + 0.012 * Math.sin(s * 131);
  return r;
};
const quadro = (s: number) => {
  const e = 1e-3, T = eixoCoral(Math.min(1, s + e)).sub(eixoCoral(Math.max(0, s - e))).normalize();
  const N = CIMA.clone().addScaledVector(T, -T.dot(CIMA)).normalize(), B = new THREE.Vector3().crossVectors(T, N);
  return {T, N, B};
};
const geoCoral = () => {
  const NS = 420, NA = 96, pos: number[] = [], uv: number[] = [], eixo: number[] = [], idx: number[] = [];
  for (let i = 0; i <= NS; i++) {
    const s = i / NS, C = eixoCoral(s), {T, N, B} = quadro(s), r = raioCoral(s);
    for (let j = 0; j <= NA; j++) {
      const a = (j / NA) * Math.PI * 2;
      const irr = 1 + 0.03 * Math.sin(3 * a + 0.7) + 0.018 * Math.sin(7 * a + s * 9) + 0.01 * Math.sin(13 * a);
      const p = C.clone().addScaledVector(N, Math.cos(a) * r * irr).addScaledVector(B, Math.sin(a) * r * irr);
      pos.push(p.x, p.y, p.z); uv.push(j / NA, s); eixo.push(T.x, T.y, T.z);
    }
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NA; j++) {
    const a = i * (NA + 1) + j, b = a + NA + 1;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('eixo', new THREE.Float32BufferAttribute(eixo, 3)); g.setIndex(idx); g.computeVertexNormals();
  // costura (coluna 0 = coluna NA): normais iguais
  const nm = g.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i <= NS; i++) {
    const a = i * (NA + 1), b = a + NA, v = new THREE.Vector3(nm.getX(a) + nm.getX(b), nm.getY(a) + nm.getY(b), nm.getZ(a) + nm.getZ(b)).normalize();
    nm.setXYZ(a, v.x, v.y, v.z); nm.setXYZ(b, v.x, v.y, v.z);
  }
  return g;
};
// calice: taca rasa com os septos radiais
const geoCalice = () => {
  const NR = 30, NA = 240, pos: number[] = [], uv: number[] = [], eixo: number[] = [], idx: number[] = [];
  const C = eixoCoral(1), {T, N, B} = quadro(1), R = raioCoral(1);
  for (let i = 0; i <= NR; i++) {
    const p = i / NR;
    for (let j = 0; j <= NA; j++) {
      const a = (j / NA) * Math.PI * 2;
      const irr = 1 + 0.03 * Math.sin(3 * a + 0.7) + 0.018 * Math.sin(7 * a + 9) + 0.01 * Math.sin(13 * a);
      const sept = Math.pow(0.5 + 0.5 * Math.cos(a * 38), 5) * smooth(0.1, 0.4, p) * (1 - smooth(0.93, 1, p));
      const fundo = -0.42 * R * (1 - p * p) + 0.05 * R * sept * (0.4 + 0.6 * p) - 0.012 * R * (1 - smooth(0.95, 1, p));
      const q = C.clone().addScaledVector(T, fundo).addScaledVector(N, Math.cos(a) * R * irr * p).addScaledVector(B, Math.sin(a) * R * irr * p);
      pos.push(q.x, q.y, q.z); uv.push(0.5 + 0.22 * p * Math.cos(a), 0.5 + 0.22 * p * Math.sin(a)); eixo.push(N.x, N.y, N.z);
    }
  }
  for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) {
    const a = i * (NA + 1) + j, b = a + NA + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('eixo', new THREE.Float32BufferAttribute(eixo, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
};
// material da pedra do coral: PBR (rocha CC0) + linhas diarias e aneis anuais no shader (com antisserrilhado por fwidth)
type CoralU = {uFase0: {value: number}; uFaseC: {value: number}; uConta: {value: number}; uLinhas: {value: number}};
const coralMat = (d: THREE.Texture, n: THREE.Texture, r: THREE.Texture, env: THREE.Texture, U: CoralU) => {
  const m = new THREE.MeshStandardMaterial({map: d, normalMap: n, roughnessMap: r, color: new THREE.Color('#e9dcc4'), roughness: 0.9, metalness: 0,
    envMap: env, envMapIntensity: 0.35, normalScale: new THREE.Vector2(0.7, 0.7)});
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'attribute vec3 eixo;\nvarying float vS;\nvarying vec3 vEixo;\n' + sh.vertexShader.replace('#include <uv_vertex>',
      '#include <uv_vertex>\n  vS = uv.y; vEixo = normalize(normalMatrix * eixo);');
    sh.fragmentShader = `uniform float uFase0; uniform float uFaseC; uniform float uConta; uniform float uLinhas; varying float vS; varying vec3 vEixo;
float faseDe(float s){ return s * ${NL.toFixed(1)} + 1.5 * sin(s * 23.0) + 0.6 * sin(s * 71.0); }
` + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
  float ph = faseDe(vS);
  float aaL = (1.0 - smoothstep(0.22, 0.6, fwidth(ph))) * uLinhas;
  float crista = 0.5 + 0.5 * cos(6.28318 * ph);
  float mes = 0.5 + 0.5 * cos(6.28318 * ph / 29.5);
  float anel = 0.0;
  ${ANUAIS.map((b) => `anel = max(anel, exp(-pow((ph - ${b.toFixed(1)}) / 9.0, 2.0)));`).join('\n  ')}
  float aaM = 1.0 - smoothstep(0.08, 0.3, fwidth(ph / 29.5));
  float faixa = pow(0.5 + 0.5 * cos(6.28318 * ph / 29.5), 3.0);   // bandas mensais (visiveis de longe)
  diffuseColor.rgb *= mix(1.0, 0.62 + 0.38 * crista, aaL * (0.75 + 0.25 * mes));
  diffuseColor.rgb *= 1.0 - 0.16 * faixa * aaM * uLinhas;
  diffuseColor.rgb *= 1.0 - 0.5 * anel;
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.05, 0.97, 0.88), 0.5 * (1.0 - vS));`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  if (vS < 0.999) normal = normalize(normal + vEixo * ((-sin(6.28318 * ph)) * 0.5 * aaL * (0.7 + 0.3 * mes) - sin(6.28318 * ph / 29.5) * 0.18 * aaM));`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  if (uConta > 0.001 && vS < 0.999) {
    float ja = step(uFase0, ph) * step(ph, uFaseC);
    float linha = pow(crista, 6.0);
    float agora = exp(-pow((ph - uFaseC) * 0.9, 2.0));
    totalEmissiveRadiance += vec3(0.30, 0.78, 1.0) * uConta * (ja * (0.06 + 0.07 * (1.0 - aaL) + 0.20 * linha * aaL) + agora * 2.2);
  }`);
  };
  m.customProgramCacheKey = () => 'coral-take-v1';
  return m;
};

// ---------------------------------------------------------------- componente
export const Take: React.FC<{u: number}> = ({u}) => {
  const {gl, camera} = useThree();
  const [dia, noite, lua, cD, cN, cR, pD, pN, pR] = useTexture([
    staticFile('take/terra_dia_2k.jpg'), staticFile('take/terra_noite_2k.jpg'), staticFile('take/lua_2k.jpg'),
    staticFile('take/rock_boulder_dry_diff_2k.jpg'), staticFile('take/rock_boulder_dry_nor_gl_2k.jpg'), staticFile('take/rock_boulder_dry_rough_2k.jpg'),
    staticFile('take/dark_rock_diff_2k.jpg'), staticFile('take/dark_rock_nor_gl_2k.jpg'), staticFile('take/dark_rock_rough_2k.jpg'),
  ]);
  const env = useMemo(() => { const p = new THREE.PMREMGenerator(gl); const e = p.fromScene(new RoomEnvironment(), 0.04).texture; p.dispose(); return e; }, [gl]);

  const M = useMemo(() => {
    dia.colorSpace = THREE.NoColorSpace; noite.colorSpace = THREE.NoColorSpace; dia.anisotropy = 8;
    lua.colorSpace = THREE.SRGBColorSpace; lua.anisotropy = 8;
    for (const t of [cD, pD]) t.colorSpace = THREE.SRGBColorSpace;
    for (const t of [cD, cN, cR]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 2.2); t.anisotropy = 8; }
    for (const t of [pD, pN, pR]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.5, 2.5); t.anisotropy = 8; }
    const brilho = texBrilho();
    // Sol: da direita-frente da camera (camera do lado -z, de onde o bojo adiantado vem na direcao dela) (terminador visivel na Terra, Lua gibosa)
    const SOL = new THREE.Vector3(-0.75, 0.33, -0.57).normalize();

    // ---- estrelas (cupula que acompanha a camera)
    const NE = 2600, pos = new Float32Array(NE * 3), cor = new Float32Array(NE * 3);
    for (let i = 0; i < NE; i++) {
      const z = rnd(i * 3 + 1) * 2 - 1, a = rnd(i * 3 + 2) * Math.PI * 2, r = Math.sqrt(1 - z * z);
      pos.set([r * Math.cos(a) * 900, z * 900, r * Math.sin(a) * 900], i * 3);
      const b = Math.pow(rnd(i * 7 + 5), 6) * 1.6 + 0.08, q = rnd(i * 11);
      cor.set([b * (q < 0.2 ? 1.0 : 0.85), b * 0.9, b * (q > 0.7 ? 1.1 : 0.95)], i * 3);
    }
    const geoE = new THREE.BufferGeometry(); geoE.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geoE.setAttribute('color', new THREE.BufferAttribute(cor, 3));
    const estrelas = new THREE.Points(geoE, new THREE.PointsMaterial({size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
    estrelas.frustumCulled = false; estrelas.renderOrder = -10;

    // ---- conjunto A: Terra, Lua, mares (1 unidade = 1 raio da Terra; distancia da Lua comprimida)
    const A = new THREE.Group();
    const matT = terraMat(dia, noite, SOL), matAt = atmosferaMat(SOL);
    const terra = new THREE.Group();
    const globo = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), matT); terra.add(globo);
    A.add(terra);
    const atm = new THREE.Mesh(new THREE.SphereGeometry(1.05, 96, 64), matAt); A.add(atm);
    const matB = bojoMat(SOL);
    const bojoG = new THREE.Group(); A.add(bojoG);
    const bojo = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 64), matB); bojo.renderOrder = 5; bojoG.add(bojo);
    const lunar = new THREE.Mesh(new THREE.SphereGeometry(0.27, 96, 64), new THREE.MeshStandardMaterial({map: lua, roughness: 1, metalness: 0, color: new THREE.Color(1.1, 1.08, 1.05)}));
    A.add(lunar);
    // orbita (anel fino)
    const orbita = new THREE.Mesh(new THREE.TorusGeometry(1, 0.0035, 4, 360), matLuz('#8fb8e8', 0.45, 0.14)); orbita.rotation.x = Math.PI / 2; A.add(orbita);
    // setas
    const setaRot = criaSeta(0.78, 0.86, 0.6, 0.6 + 4.4, 0.016, '#7fd4ff', 1.5); A.add(setaRot.g);
    const setaFreio = criaSeta(1.5, 0.0, 0.85, -0.55, 0.028, '#ff9a3c', 1.8); bojoG.add(setaFreio.g);
    // tracao Lua -> bojo (tracejada, correndo para a Lua)
    const tTr = texTraco(); const matTr = new THREE.MeshBasicMaterial({map: tTr, color: new THREE.Color('#ffb36b').multiplyScalar(1.7), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false});
    const tracao = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 8, 1, true), matTr); tracao.frustumCulled = false; A.add(tracao);
    // laser das Apollo (feixe verde + pulso)
    const matLaser = matLuz('#4dff7a', 1.6, 0);
    const laser = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 8, 1, true), matLaser); laser.frustumCulled = false; A.add(laser);
    const pulsoL = new THREE.Sprite(new THREE.SpriteMaterial({map: brilho, color: new THREE.Color('#7dff9a').multiplyScalar(3), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
    A.add(pulsoL);
    const refl = new THREE.Sprite(new THREE.SpriteMaterial({map: brilho, color: new THREE.Color('#9dffb0').multiplyScalar(2.5), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
    A.add(refl);
    // regua Terra -> Lua (em coordenadas locais: eixo x de 0 a 1; marcas no eixo z)
    const regua = new THREE.Group(); A.add(regua);
    const ptsR: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0)];
    for (let i = 0; i <= 40; i++) { const L = i % 10 === 0 ? 0.16 : i % 5 === 0 ? 0.1 : 0.05; ptsR.push(new THREE.Vector3(i / 40, 0, 0), new THREE.Vector3(i / 40, 0, -L)); }
    const matRegua = matLuz('#bfe3ff', 1.1, 0);
    { const barra = new THREE.Mesh(new THREE.BoxGeometry(1, 0.012, 0.012), matRegua); barra.position.x = 0.5; regua.add(barra);
      for (let i = 0; i < ptsR.length; i += 2) { if (i < 2) continue; const L = -ptsR[i + 1].z;
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.0022, 0.01, L), matRegua); m.position.set(ptsR[i].x, 0, -L / 2); regua.add(m); } }
    const ext = new THREE.Mesh(new THREE.BoxGeometry(1, 0.03, 0.05), matLuz('#ffa24a', 2.2, 0)); A.add(ext);
    const rTag = novoRot(1024, 160), rRot = novoRot(512, 128), rFreio = novoRot(768, 160), rMarea = novoRot(512, 160), rLuna = novoRot(512, 128),
      rLaser = novoRot(1024, 160), rRegla = novoRot(1024, 320), rDia = novoRot(1400, 420);
    for (const r of [rTag, rRot, rFreio, rMarea, rLuna, rLaser, rRegla, rDia]) A.add(r.spr);

    // ---- conjunto B: coral fossil sobre a laje (unidades ~ 10 cm)
    const B = new THREE.Group();
    const UC: CoralU = {uFase0: {value: ANUAIS[1]}, uFaseC: {value: ANUAIS[1]}, uConta: {value: 0}, uLinhas: {value: 1}};
    const matC = coralMat(cD, cN, cR, env, UC);
    const coral = new THREE.Group(); B.add(coral);
    const matCal = new THREE.MeshStandardMaterial({map: cD, normalMap: cN, roughnessMap: cR, color: new THREE.Color('#e3d4ba'), roughness: 0.95, envMap: env, envMapIntensity: 0.3});
    coral.add(new THREE.Mesh(geoCoral(), matC), new THREE.Mesh(geoCalice(), matCal));
    let baixo = 1e9; for (let i = 0; i <= 100; i++) { const s = i / 100; baixo = Math.min(baixo, eixoCoral(s).y - raioCoral(s) * 0.97); }
    const laje = new THREE.Mesh(new THREE.PlaneGeometry(7, 7, 1, 1), new THREE.MeshStandardMaterial({map: pD, normalMap: pN, roughnessMap: pR, roughness: 0.8,
      color: new THREE.Color('#9a8f80'), envMap: env, envMapIntensity: 0.25}));
    laje.rotation.x = -Math.PI / 2; laje.position.y = baixo + 0.012; B.add(laje);
    // poeira fina sobre a laje (graos) — instanciada
    const NG = 380, graos = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({color: '#7d6f5a', roughness: 1, envMap: env, envMapIntensity: 0.15}), NG);
    { const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
      for (let i = 0; i < NG; i++) { const r = 0.25 + Math.pow(rnd(i * 5 + 1), 0.7) * 1.4, a = rnd(i * 5 + 2) * Math.PI * 2, sc = 0.002 + Math.pow(rnd(i * 5 + 3), 3) * 0.007;
        e.set(rnd(i * 5 + 4) * 6, rnd(i * 5 + 6) * 6, 0); q.setFromEuler(e);
        m4.compose(new THREE.Vector3(Math.cos(a) * r, laje.position.y + sc * 0.3, Math.sin(a) * r * 0.8), q, new THREE.Vector3(sc, sc * 0.6, sc)); graos.setMatrixAt(i, m4); } }
    B.add(graos);
    // colchete "1 ANO" sobre o anel 550-950 (segue o eixo, acima do coral)
    const s0 = sDaFase(ANUAIS[1]), s1 = sDaFase(ANUAIS[2]);
    const ptsC: THREE.Vector3[] = [];
    const sobre = (s: number, k: number) => { const {N, B} = quadro(s); return eixoCoral(s).addScaledVector(N.multiplyScalar(0.85).addScaledVector(B, 0.5).normalize(), 0.19 * (0.035 + 0.965 * Math.pow(s, 0.78)) * 1.1 + 0.045 + k); };
    ptsC.push(sobre(s0, -0.06));
    for (let i = 0; i <= 40; i++) ptsC.push(sobre(lerp(s0, s1, i / 40), 0));
    ptsC.push(sobre(s1, -0.06));
    const matCol = matLuz('#9fe0ff', 1.6, 0);
    const colchete = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ptsC, false, 'catmullrom', 0.1), 160, 0.004, 6, false), matCol); B.add(colchete);
    const rCoral = novoRot(1024, 256), rConta = novoRot(1024, 360), rAno = novoRot(512, 140), rGrande = novoRot(1600, 440), rHoras = novoRot(1024, 220), rWells = novoRot(1024, 120);
    for (const r of [rCoral, rConta, rAno, rGrande, rHoras, rWells]) B.add(r.spr);

    // ---- luzes
    const solA = new THREE.DirectionalLight('#fff4e6', 0); solA.position.copy(SOL).multiplyScalar(50);
    const ambA = new THREE.HemisphereLight('#4a5a78', '#000000', 0);
    const chave = new THREE.SpotLight('#ffe6c8', 0, 0, 0.5, 0.75, 2); const alvo = new THREE.Object3D(); chave.target = alvo;
    const recorte = new THREE.SpotLight('#9cc8ff', 0, 0, 0.55, 0.9, 2); const alvo2 = new THREE.Object3D(); recorte.target = alvo2;
    const ambB = new THREE.HemisphereLight('#5d6a80', '#0a0806', 0);
    // ---- cortina preta presa a camera (fades)
    const cortina = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({color: '#000000', transparent: true, opacity: 1, depthTest: false, depthWrite: false}));
    cortina.renderOrder = 9999; cortina.frustumCulled = false;
    return {SOL, estrelas, A, terra, atm, bojoG, bojo, matB, lunar, orbita, setaRot, setaFreio, tracao, tTr, matTr, laser, matLaser, pulsoL, refl, regua, matRegua, ext,
      rTag, rRot, rFreio, rMarea, rLuna, rLaser, rRegla, rDia, B, UC, coral, colchete, matCol, s0, s1, rCoral, rConta, rAno, rGrande, rHoras, rWells,
      solA, ambA, chave, alvo, recorte, alvo2, ambB, cortina, matT, matAt};
  }, [dia, noite, lua, cD, cN, cR, pD, pN, pR, env]);

  // ---------------- estado deste quadro
  const segA = u < 18;
  M.A.visible = segA; M.B.visible = !segA; M.estrelas.visible = segA;
  const preto = Math.max(1 - smooth(0, 0.6, u), segA ? smooth(17.55, 18.0, u) : 1 - smooth(18.0, 18.5, u), smooth(28.6, 29.85, u));
  (M.cortina.material as THREE.MeshBasicMaterial).opacity = clamp01(preto);
  M.solA.intensity = segA ? 3.2 : 0; M.ambA.intensity = segA ? 0.06 : 0;
  M.chave.intensity = 0; M.recorte.intensity = 0; M.ambB.intensity = 0;

  // geometria do espaco (calculada aqui e usada tambem pela camera)
  const phi = 0.3 + 0.022 * u;                                 // angulo orbital da Lua
  const D = 7.0 + 2.6 * smooth(7.6, 17.5, u);                 // distancia Terra-Lua (exagerada, "se aleja")
  const dirL = new THREE.Vector3(Math.cos(phi), 0, -Math.sin(phi));
  const posL = dirL.clone().multiplyScalar(D);
  const DELTA = 0.42;                                         // bojo adiantado (exagerado; o real e ~3 graus)

  if (segA) {
    // giro da Terra: rapido no inicio, desacelera (exagerado) a partir de 7 s; integral deterministica
    let ang = 2.2; const passo = 1 / 60;
    for (let x = 0; x < u; x += passo) ang += (1.1 - 0.62 * smooth(7, 17, x)) * Math.min(passo, u - x);
    M.terra.rotation.y = ang;
    M.lunar.position.copy(posL); M.lunar.rotation.y = phi + Math.PI; // face visivel voltada para a Terra
    M.orbita.scale.set(D, D, 1);
    // bojo de mare
    const fb = smooth(0.8, 2.6, u);
    const ond = 0.006 * Math.sin(u * 2.4);
    M.bojoG.rotation.y = phi + DELTA;
    M.bojo.scale.set(lerp(1.0, 1.19, fb) + ond, lerp(1.0, 0.92, fb), lerp(1.0, 0.94, fb));
    M.matB.uniforms.uOp.value = smooth(0.6, 2.0, u) * (1 - 0.6 * smooth(12.5, 15, u)); M.matB.uniforms.uT.value = u;
    // setas
    revela(M.setaRot, smooth(1.2, 2.6, u), 0.9 * smooth(1.2, 1.6, u));
    const pulsoF = u > 6.2 && u < 12 ? 0.75 + 0.25 * Math.sin((u - 6.2) * 6.5) : 1;
    revela(M.setaFreio, smooth(3.0, 4.4, u), smooth(3.0, 3.4, u) * pulsoF * (1 - 0.35 * smooth(12.5, 13.5, u)));
    // tracao Lua -> crista do bojo
    {
      const crista = new THREE.Vector3(Math.cos(phi + DELTA), 0, -Math.sin(phi + DELTA)).multiplyScalar(1.24);
      const fim = posL.clone().addScaledVector(dirL, -0.3);
      const L = liga(M.tracao, crista, fim, 0.012);
      M.tTr.repeat.set(1, L / 0.22); M.tTr.offset.set(0, -u * 0.9);
      M.matTr.opacity = 0.9 * smooth(6.0, 6.8, u) * (1 - smooth(8.6, 9.2, u)); M.tracao.visible = M.matTr.opacity > 0.004;
    }
    // laser das Apollo: duas idas e voltas (6,5-10,5)
    {
      const ini = new THREE.Vector3().copy(dirL).multiplyScalar(1.0), fim = posL.clone().addScaledVector(dirL, -0.25);
      liga(M.laser, ini, fim, 0.006);
      const vis = smooth(8.4, 8.8, u) * (1 - smooth(11.8, 12.3, u));
      M.matLaser.opacity = 0.35 * vis; M.laser.visible = vis > 0.004;
      const k = clamp01((u - 8.5) / 3.4), ida = (k * 2) % 1, f = Math.floor(k * 2) % 2 === 0 ? ida : 1 - ida;
      const tri = k >= 1 ? 0 : (ida < 0.5 ? ida * 2 : 2 - ida * 2);
      M.pulsoL.position.copy(ini).lerp(fim, tri); M.pulsoL.scale.setScalar(0.32); M.pulsoL.material.opacity = vis; M.pulsoL.visible = vis > 0.004 && k < 1;
      M.refl.position.copy(fim); M.refl.scale.setScalar(0.5 + 0.5 * Math.exp(-Math.pow((tri - 1) * 6, 2)));
      M.refl.material.opacity = vis * (0.35 + 0.65 * Math.exp(-Math.pow((tri - 1) * 5, 2))); M.refl.visible = vis > 0.004; void f;
    }
    // regua e a parte que cresce (+3,8 cm/ano)
    {
      const lado = new THREE.Vector3(Math.sin(phi), 0, Math.cos(phi));
      const a0 = dirL.clone().multiplyScalar(1.15).addScaledVector(lado, -0.55);
      const op = smooth(7.4, 8.2, u) * (1 - smooth(13.0, 14.0, u));
      M.regua.position.copy(a0); M.regua.rotation.set(0, phi, 0); M.regua.scale.set(7.0 - 1.15 - 0.3, 1, 1);
      M.matRegua.opacity = 0.75 * op; M.regua.visible = op > 0.004;
      const extL = Math.max(0.001, D - 7.0);
      M.ext.position.copy(dirL).multiplyScalar(7.0 - 0.3 + extL / 2).addScaledVector(lado, -0.55);
      M.ext.rotation.set(0, phi, 0); M.ext.scale.set(extL, 1, 1);
      (M.ext.material as THREE.MeshBasicMaterial).opacity = op; M.ext.visible = op > 0.004 && extL > 0.01;
    }
    M.matT.uniforms.uOp.value = 1; M.matAt.uniforms.uOp.value = 1;
  } else {
    // ---------------- coral
    const v = u - 18;
    M.chave.position.set(1.1, 1.9, 1.5); M.alvo.position.set(0.05, 0.05, 0); M.chave.intensity = 9;
    M.recorte.position.set(-1.4, 1.1, -1.6); M.alvo2.position.set(0.1, 0.1, 0); M.recorte.intensity = 7;
    M.ambB.intensity = 0.18;
    // contagem das linhas diarias 550 -> 950 (19,6-23,6 s)
    const kc = clamp01((v - 1.6) / 4);
    const fc = ANUAIS[1] + 400 * clamp01(kc);
    M.UC.uFaseC.value = fc; M.UC.uConta.value = smooth(1.4, 1.8, v) * (1 - 0.6 * smooth(8.5, 10, v));
    M.matCol.opacity = smooth(5.4, 6.0, v) * (1 - smooth(7.8, 8.4, v));
  }

  // ---------------- camera do take (e os rotulos presos ao quadro)
  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    let p: THREE.Vector3, alvo: THREE.Vector3, fov = 36, near = 0.05, far = 5000;
    if (u < 18) {
      const lado = new THREE.Vector3(Math.sin(phi), 0, Math.cos(phi));
      // alvo entre a Terra e a Lua (mais perto da Terra); fim: aproxima da Terra com o contador
      const mix = lerp(0.42, 0.05, smooth(11.5, 17.5, u));
      alvo = posL.clone().multiplyScalar(mix);
      const dist = lerp(10.2, 9.0, smooth(0, 6, u)) + 2.4 * smooth(6, 11.5, u) - 5.6 * smooth(11.5, 17.8, u);
      const el = lerp(0.95, 0.55, smooth(4, 10, u)) - 0.25 * smooth(11.5, 17.5, u);
      const giro = 0.35 - 0.05 * u;
      const off = lado.clone().multiplyScalar(-Math.cos(giro)).addScaledVector(dirL, -Math.sin(giro));
      p = alvo.clone().addScaledVector(off, dist * Math.cos(el)).addScaledVector(CIMA, dist * Math.sin(el));
      alvo.y -= 0.6 * (1 - smooth(11.5, 16, u)) - 0.45 * smooth(11.5, 16, u);
    } else {
      const v = u - 18;
      const cS = (s: number) => eixoCoral(s);
      if (v < 1.6) {
        alvo = new THREE.Vector3(0.05, 0.07, 0.02); p = new THREE.Vector3(lerp(0.15, 0.25, v / 1.6), 0.45, lerp(1.35, 1.2, v / 1.6)); fov = 34;
      } else if (v < 6) {
        // macro acompanhando a luz que conta (passa a linha 400 por volta de 5,6)
        const k = clamp01((v - 1.6) / 4), sC = lerp(M.s0, M.s1, k);
        const vai = smooth(1.6, 2.6, v);
        const a = cS(sC), {N, B} = quadro(sC);
        const macroP = a.clone().addScaledVector(N, raioCoral(sC) + 0.09).addScaledVector(B, 0.27).add(new THREE.Vector3(-0.05, 0, 0));
        const largoP = new THREE.Vector3(0.25, 0.45, 1.2), largoA = new THREE.Vector3(0.05, 0.07, 0.02);
        p = largoP.lerp(macroP, vai); alvo = largoA.lerp(a.clone().addScaledVector(N, raioCoral(sC) * 0.5), vai); fov = lerp(34, 30, vai);
      } else {
        // recua para mostrar o ano inteiro (colchete) e gira ate o calice
        const meio = cS((M.s0 + M.s1) / 2);
        const k1 = smooth(6, 7.4, v), k2 = smooth(8.2, 11.6, v);
        const sF = M.s1, a = cS(sF), {N, B} = quadro(sF);
        const macroP = a.clone().addScaledVector(N, raioCoral(sF) + 0.09).addScaledVector(B, 0.27).add(new THREE.Vector3(-0.05, 0, 0));
        const meioP = meio.clone().add(new THREE.Vector3(-0.05, 0.42, 0.9));
        const caliceA = cS(1), caliceP = caliceA.clone().add(new THREE.Vector3(0.75, 0.42, 0.62));
        p = macroP.lerp(meioP, k1).lerp(caliceP, k2);
        alvo = a.clone().lerp(meio.clone().add(new THREE.Vector3(0, 0.08, 0)), k1).lerp(caliceA.clone().add(new THREE.Vector3(-0.12, -0.02, 0)), k2);
        fov = lerp(30, 34, k1);
      }
      near = 0.01; far = 200;
    }
    cam.position.copy(p); cam.up.set(0, 1, 0); cam.lookAt(alvo);
    if (cam.fov !== fov || cam.near !== near || cam.far !== far) { cam.fov = fov; cam.near = near; cam.far = far; cam.updateProjectionMatrix(); }
    cam.updateMatrixWorld();
    M.estrelas.position.copy(cam.position);
    const frente = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion), cima = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion),
      direita = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
    M.cortina.position.copy(cam.position).addScaledVector(frente, Math.max(near * 2, 0.03)); M.cortina.quaternion.copy(cam.quaternion);
    M.cortina.scale.setScalar(Math.max(near * 2, 0.03) / 0.2);
    // posicao presa ao quadro: x, y em fracoes da meia-altura (y = 1 no topo)
    const noQuadro = (r: Rot, x: number, y: number, alt: number) => {
      const d = u < 18 ? 4 : 0.4, h = 2 * d * Math.tan((fov * Math.PI) / 360);
      r.spr.position.copy(cam.position).addScaledVector(frente, d).addScaledVector(cima, (h / 2) * y).addScaledVector(direita, (h / 2) * x);
      r.spr.scale.set(h * alt * r.asp, h * alt, 1);
    };
    const tam = (r: Rot, pos: THREE.Vector3, alt: number) => { const d = pos.distanceTo(cam.position); r.spr.position.copy(pos); r.spr.scale.set(d * alt * r.asp, d * alt, 1); };

    if (u < 18) {
      // etiqueta "de verdade, hoje"
      desenhaRot(M.rTag, [{txt: 'TIERRA Y LUNA · HOY · DE VERDAD', font: fSans(52), cor: '#cfe6ff', y: 0.55, esp: 18}], filete('#cfe6ff', 0.12, 0.38, 0.62));
      noQuadro(M.rTag, 0, 0.8, 0.06); opac(M.rTag, pulso(0.7, 6.2, u));
      // ROTACION
      desenhaRot(M.rRot, [{txt: 'ROTACIÓN', font: fSans(64), cor: '#8fdcff', y: 0.5, esp: 14}]);
      tam(M.rRot, new THREE.Vector3(-0.2, 1.42, -0.2), 0.03); opac(M.rRot, smooth(1.8, 2.5, u) * (1 - smooth(12, 13, u)));
      // MAREA (crista do bojo)
      const crista = new THREE.Vector3(Math.cos(phi + DELTA), 0, -Math.sin(phi + DELTA));
      desenhaRot(M.rMarea, [{txt: 'MAREA', font: fSans(66), cor: '#9fdcff', y: 0.42, esp: 16}, {txt: 'adelantada', font: fSerif(48), cor: '#d8efff', y: 0.8}]);
      tam(M.rMarea, crista.clone().multiplyScalar(1.95).add(new THREE.Vector3(0, 0.42, 0)), 0.042); opac(M.rMarea, smooth(2.0, 2.8, u) * (1 - smooth(9.5, 10.5, u)));
      // FRENO DE MAREA (perto da seta laranja)
      const af = phi + DELTA + 0.15;
      desenhaRot(M.rFreio, [{txt: 'FRENO DE MAREA', font: fSans(70), cor: '#ffb066', y: 0.42, esp: 14}, {txt: 'contra el giro', font: fSerif(50), cor: '#ffd9b0', y: 0.8}]);
      tam(M.rFreio, new THREE.Vector3(Math.cos(af) * 2.15, -0.55, -Math.sin(af) * 2.15), 0.048); opac(M.rFreio, smooth(3.6, 4.3, u) * (1 - smooth(12.5, 13.5, u)));
      // LUNA
      desenhaRot(M.rLuna, [{txt: 'LUNA', font: fSans(66), cor: '#e6e6e6', y: 0.5, esp: 18}]);
      tam(M.rLuna, posL.clone().add(new THREE.Vector3(0, 0.6, 0)), 0.03); opac(M.rLuna, smooth(1.0, 1.8, u) * (1 - smooth(7.2, 7.8, u)));
      // LASER
      desenhaRot(M.rLaser, [{txt: 'LÁSER  →  REFLECTORES DEL APOLO', font: fSans(52), cor: '#7dff9a', y: 0.42, esp: 10}, {txt: 'midiendo la distancia', font: fSerif(44), cor: '#c9ffd5', y: 0.8}]);
      tam(M.rLaser, posL.clone().multiplyScalar(0.5).add(new THREE.Vector3(0, 0.75, 0)), 0.045); opac(M.rLaser, smooth(8.5, 9.1, u) * (1 - smooth(11.6, 12.2, u)));
      // +3,8 cm / ANO
      desenhaRot(M.rRegla, [{txt: 'LA LUNA SE ALEJA', font: fSans(50), cor: '#ffc690', y: 0.2, esp: 14},
        {txt: '+3,8 cm / AÑO', font: fSerif(130), cor: '#ffffff', y: 0.6, brilho: 18}], filete('#ffa24a', 0.92, 0.25, 0.75));
      tam(M.rRegla, posL.clone().add(new THREE.Vector3(0, 0.95, 0)), 0.075); opac(M.rRegla, smooth(7.8, 8.6, u) * (1 - smooth(12.0, 12.6, u)));
      // contador da duracao do dia (preso ao quadro, terco de cima)
      const sec = Math.floor(clamp01((u - 11.6) / 5.8) * 25 + 1e-6);
      const ms = sec * 1.8, salto = sec > 0 ? Math.exp(-((u - 11.6) - (sec / 25) * 5.8) * 6) : 0;
      const txtS = `24 h 00 min 00,${String(Math.round(ms * 10)).padStart(4, '0')} s`;
      desenhaRot(M.rDia, [
        {txt: 'DURACIÓN DEL DÍA', font: fSans(46), cor: '#bfe3ff', y: 0.14, esp: 18},
        {txt: txtS, font: fSerif(124), cor: '#ffffff', y: 0.46, brilho: 18},
        {txt: `+1,8 ms POR SIGLO   ·   DENTRO DE ${sec} SIGLO${sec === 1 ? '' : 'S'}`, font: fSans(42, 500), cor: '#ffc690', y: 0.80, esp: 8},
      ], filete('#bfe3ff', 0.03, 0.4, 0.6));
      noQuadro(M.rDia, 0, 0.7, 0.24); opac(M.rDia, smooth(11.3, 12.0, u) * (0.88 + 0.12 * clamp01(salto)));
    } else {
      const v = u - 18;
      desenhaRot(M.rCoral, [{txt: 'CORAL FÓSIL · DEVÓNICO', font: fSans(60), cor: '#ffe2b8', y: 0.32, esp: 18},
        {txt: 'hace unos 400 millones de años', font: fSerif(62), cor: '#ffffff', y: 0.72}], filete('#ffe2b8', 0.06, 0.35, 0.65));
      noQuadro(M.rCoral, 0, 0.72, 0.13); opac(M.rCoral, smooth(0.6, 1.2, v) * (1 - smooth(1.8, 2.4, v)));
      // contador das linhas diarias
      const n = Math.max(1, Math.min(400, Math.round(M.UC.uFaseC.value - ANUAIS[1])));
      desenhaRot(M.rConta, [{txt: 'LÍNEAS DIARIAS DE CRECIMIENTO', font: fSans(44), cor: '#9fe0ff', y: 0.15, esp: 14},
        {txt: `${n}`, font: fSerif(170), cor: '#ffffff', y: 0.55, brilho: 20},
        {txt: 'entre dos anillos anuales', font: fSerif(48), cor: '#cfeeff', y: 0.88}]);
      noQuadro(M.rConta, 0, 0.62, 0.22); opac(M.rConta, smooth(1.7, 2.2, v) * (1 - smooth(5.9, 6.4, v)));
      // 1 ANO (sobre o colchete)
      desenhaRot(M.rAno, [{txt: '1 AÑO', font: fSans(80), cor: '#bdeaff', y: 0.5, esp: 16}]);
      { const sm = (M.s0 + M.s1) / 2, q = quadro(sm); tam(M.rAno, eixoCoral(sm).addScaledVector(q.N.multiplyScalar(0.85).addScaledVector(q.B, 0.5).normalize(), raioCoral(sm) * 1.1 + 0.12), 0.04); }
      opac(M.rAno, smooth(5.6, 6.2, v) * (1 - smooth(7.8, 8.4, v)));
      // grande: ~400 dias por ano
      desenhaRot(M.rGrande, [{txt: '≈ 400 DÍAS POR AÑO', font: fSerif(150), cor: '#ffffff', y: 0.38, brilho: 22},
        {txt: 'HACE 400 MILLONES DE AÑOS', font: fSans(56), cor: '#ffd9a0', y: 0.80, esp: 18}], filete('#ffd9a0', 0.03, 0.42, 0.58));
      noQuadro(M.rGrande, 0, 0.66, 0.2); opac(M.rGrande, smooth(6.2, 7.0, v) * (1 - smooth(10.6, 11.2, v)));
      // 1 dia ~ 22 h
      desenhaRot(M.rHoras, [{txt: 'UN DÍA DURABA', font: fSans(46), cor: '#ffd9a0', y: 0.25, esp: 16}, {txt: '≈ 22 horas', font: fSerif(110), cor: '#ffffff', y: 0.68, brilho: 18}]);
      noQuadro(M.rHoras, -1.15, 0.58, 0.1); opac(M.rHoras, smooth(8.4, 9.1, v) * (1 - smooth(10.8, 11.4, v)));
      desenhaRot(M.rWells, [{txt: 'JOHN W. WELLS · NATURE · 1963', font: fSans(48, 500), cor: '#cfd8e6', y: 0.5, esp: 14}]);
      noQuadro(M.rWells, 0.6, -0.56, 0.05); opac(M.rWells, smooth(8.6, 9.4, v) * (1 - smooth(10.8, 11.4, v)));
    }
  }, -1);

  return (
    <>
      <color attach="background" args={['#020306']} />
      <primitive object={M.estrelas} />
      <primitive object={M.A} />
      <primitive object={M.B} />
      <primitive object={M.solA} />
      <primitive object={M.ambA} />
      <primitive object={M.chave} /><primitive object={M.alvo} />
      <primitive object={M.recorte} /><primitive object={M.alvo2} />
      <primitive object={M.ambB} />
      <primitive object={M.cortina} />
    </>
  );
};
