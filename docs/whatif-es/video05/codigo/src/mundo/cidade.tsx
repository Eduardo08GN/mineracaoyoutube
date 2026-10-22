// Cidade (dono: agente Cidade). Montada pela Cena de 64 a 117 s junto com a Rua.
// Skyline ao fundo (a cidade fica a -z e um pouco a esquerda, de ~1,1 a 2,9 km), predios do lado direito da rua (a partir de 84,5 s),
// muro contra o mar (aneis, arcos, faixa translucida), torres de uma milha, cupula, arcologia, apagao, queda das torres com poeira
// e o mar que sobe onde a cidade estava (plano de mar exportado para a Terra continuar: marCidade / MarHorizonte).
// Tudo e funcao de t: o lote, a geracao e a altura de cada predio saem de rnd(semente); as matrizes das instancias sao refeitas
// a cada quadro a partir de t (nada acumulado). Janelas por shader (grade por andar, acesas por semente e hora, reflexo do ceu no
// vidro, media de cobertura quando a janela fica menor que um pixel), PBR (MeshStandardMaterial) e nevoa de perspectiva aerea propria.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {luzEm, LuzTempo} from './ceu';
import {perfilRua} from './rua';
import {rnd, smooth, clamp01} from './comum';
import {Flipbook, ATLAS, Emissor} from './vfx';

const DEG = Math.PI / 180;
const easeOut = (u: number) => 1 - (1 - u) * (1 - u);
const easeIn = (u: number) => u * u;
const ease = (u: number) => u * u * (3 - 2 * u);

// ---------- geografia ----------
const AZ_C = 10 * DEG, DIST_C = 1550;            // centro da cidade: 10 graus a esquerda de -z, a 1,55 km
export const CENTRO_CIDADE = new THREE.Vector3(-Math.sin(AZ_C) * DIST_C, 0, -Math.cos(AZ_C) * DIST_C);
const C = CENTRO_CIDADE;
const E_LAT = new THREE.Vector3(Math.cos(AZ_C), 0, -Math.sin(AZ_C));   // lateral (direita de quem olha a cidade)
const E_PROF = new THREE.Vector3(-Math.sin(AZ_C), 0, -Math.cos(AZ_C)); // profundidade (para longe)
const RA = 820, RB = 620;                        // semi-eixos da cidade (lateral, profundidade)
const TH = 32 * DEG;                              // giro da grade de quadras
const X_RUA = 16.5;                               // fachada das casas da Rua (FRENTE = 16,5 m)

// ---------- mar que sobe (exportado para a Terra continuar depois de 116 s) ----------
// mar no semiplano dot(p.xz, n) > costa, n apontando para 50 graus a esquerda; mascara de azimute evita o lado direito.
export const marCidade = (t: number) => {
  let costa = 3400;
  costa += (2300 - 3400) * ease(clamp01((t - 95) / 4));                  // o mar sobe ate o muro (95-99)
  costa += (110 - costa) * easeOut(clamp01((t - 114.2) / 2.6));           // a cidade cai e o mar entra (114,2-116,8)
  return {nivel: 0.35, costa, azNormal: 50 * DEG, azMin: -22 * DEG, azMax: 125 * DEG};
};

// ---------- uniforms compartilhados ----------
type Uni = Record<string, {value: any}>;
const novosUniforms = (): Uni => ({
  uT: {value: 0}, uPreench: {value: 0}, uApagao: {value: 0}, uLuzes: {value: 1}, uFrac: {value: 0.42}, uForcaJan: {value: 2.0}, uRefl: {value: 1},
  uNevCor: {value: new THREE.Color(0.6, 0.65, 0.72)}, uNevDens: {value: 0.00045}, uNevMax: {value: 0.7},
  uPostCor: {value: new THREE.Color(0.6, 0.65, 0.72)}, uPostDens: {value: 0}, uPostMax: {value: 0},
  uCeuZ: {value: new THREE.Color(0.35, 0.45, 0.65)}, uCeuH: {value: new THREE.Color(0.6, 0.65, 0.72)}, uChao: {value: new THREE.Color(0.03, 0.035, 0.03)},
  uSol: {value: new THREE.Vector3(0, 1, 0)}, uDia: {value: 1},
});

const GLSL_NEVOA = `
uniform vec3 uNevCor; uniform float uNevDens; uniform float uNevMax;
float c_nevoa(vec3 w){
  float d = length(w - cameraPosition);
  float dh = max(w.y - cameraPosition.y, 0.0);
  float k = 1.0 / 650.0;
  float hf = dh > 1.0 ? (1.0 - exp(-k * dh)) / (k * dh) : 1.0;   // densidade media num ar que rareia com a altura
  return (1.0 - exp(-uNevDens * d * hf)) * uNevMax;
}
// so a nevoa propria (azulada, mais fraca no alto das torres); a nevoa de pos do Look entra por cima normalmente (sem desconto)
uniform vec3 uPostCor; uniform float uPostDens; uniform float uPostMax;
vec3 c_final(vec3 c, vec3 w){ return clamp(mix(c, uNevCor, c_nevoa(w)), vec3(0.0), vec3(64.0)); }`;
const VS_MUNDO = `#include <project_vertex>
{
  mat4 c_mi = mat4(1.0);
  #ifdef USE_INSTANCING
  c_mi = instanceMatrix;
  #endif
  vec4 c_wq = modelMatrix * c_mi * vec4(transformed, 1.0);
  vMundo = c_wq.xyz;
  vNw = normalize(mat3(modelMatrix) * (mat3(c_mi) * objectNormal));
  vEsc = vec3(length(c_mi[0].xyz), length(c_mi[1].xyz), length(c_mi[2].xyz));
  vLoc = position; vNo = normal; vInfo = aInfo;
  // janelas legiveis de longe: a grade engorda por potencia de 2 com a distancia horizontal da base (estavel: a camera nao anda)
  vec3 c_o = (modelMatrix * vec4(c_mi[3].xyz, 1.0)).xyz;
  vLod = clamp(exp2(floor(log2(max(1.0, length(c_o.xz - cameraPosition.xz) / 260.0)))), 1.0, 8.0);
}`;

// ---------- material dos predios (fachada procedural) ----------
// tipos: 0 concreto bege, 1 branco, 2 cinza-azulado, 3 cortina de vidro azul, 4 residencial escura, 5 vidro ciano, 6 ocre, 7 arcologia
const TIPOS: {fach: string; andar: number; col: number; jx: number; jy: number; vidro: number; corVidro: string}[] = [
  {fach: '#a8916f', andar: 3.3, col: 3.0, jx: 0.52, jy: 0.52, vidro: 0.65, corVidro: '#26384a'},
  {fach: '#b9b8b0', andar: 3.3, col: 2.7, jx: 0.58, jy: 0.55, vidro: 0.65, corVidro: '#2c4054'},
  {fach: '#6f7c8a', andar: 3.6, col: 3.2, jx: 0.68, jy: 0.6, vidro: 0.75, corVidro: '#22374c'},
  {fach: '#46586b', andar: 3.8, col: 1.6, jx: 0.86, jy: 0.8, vidro: 1.0, corVidro: '#2f4d68'},
  {fach: '#2d3037', andar: 3.0, col: 3.4, jx: 0.5, jy: 0.5, vidro: 0.6, corVidro: '#1b2430'},
  {fach: '#6f91a6', andar: 3.9, col: 1.5, jx: 0.9, jy: 0.86, vidro: 1.0, corVidro: '#4f7f98'},
  {fach: '#8f624a', andar: 3.2, col: 3.0, jx: 0.5, jy: 0.5, vidro: 0.6, corVidro: '#2a3542'},
  {fach: '#6d7b88', andar: 4.6, col: 4.2, jx: 0.74, jy: 0.42, vidro: 0.8, corVidro: '#34536b'},
];
const uniformsTipos = () => {
  const A: THREE.Vector4[] = [], B: THREE.Vector4[] = [], Cc: THREE.Vector4[] = [];
  for (const k of TIPOS) {
    const f = new THREE.Color(k.fach), v = new THREE.Color(k.corVidro);
    A.push(new THREE.Vector4(f.r, f.g, f.b, k.andar)); B.push(new THREE.Vector4(k.col, k.jx, k.jy, k.vidro)); Cc.push(new THREE.Vector4(v.r, v.g, v.b, 0));
  }
  return {uTipoA: {value: A}, uTipoB: {value: B}, uTipoC: {value: Cc}};
};

const FS_DECL = `
uniform float uT; uniform float uPreench; uniform float uApagao; uniform float uLuzes; uniform float uFrac; uniform float uForcaJan; uniform float uRefl;
uniform vec3 uCeuZ; uniform vec3 uCeuH; uniform vec3 uChao;
uniform vec4 uTipoA[8]; uniform vec4 uTipoB[8]; uniform vec4 uTipoC[8];
varying vec3 vMundo; varying vec3 vNw; varying vec3 vEsc; varying vec3 vLoc; varying vec3 vNo; varying vec4 vInfo; varying float vLod;
float c_h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
${GLSL_NEVOA}`;

const FS_COR = `#include <color_fragment>
int c_k = int(clamp(vInfo.y + 0.5, 0.0, 7.0));
vec4 c_A = uTipoA[c_k]; vec4 c_B = uTipoB[c_k]; vec4 c_C = uTipoC[c_k];
float c_teto = step(0.5, abs(vNo.y));
#ifdef CILINDRO
float c_larg = 3.14159 * vEsc.x;
float c_u = (atan(vLoc.z, vLoc.x) / 6.28318 + 0.5) * c_larg;
#else
float c_lx = step(0.5, abs(vNo.x));
float c_larg = mix(vEsc.x, vEsc.z, c_lx);
float c_u = (mix(vLoc.x, vLoc.z, c_lx) + 0.5) * c_larg;
#endif
float c_nc = max(1.0, floor(c_larg / (c_B.x * vLod) + 0.5));
vec2 c_cc = vec2(c_u / (c_larg / c_nc), vMundo.y / (c_A.w * vLod));
vec2 c_id = floor(c_cc); vec2 c_f = fract(c_cc);
vec2 c_fw = max(fwidth(c_cc), vec2(1e-4));
float c_jx = c_B.y * 0.5, c_y0 = 0.56 - c_B.z * 0.5, c_y1 = c_y0 + c_B.z;
float c_mx = smoothstep(0.5 - c_jx - c_fw.x, 0.5 - c_jx + c_fw.x, c_f.x) - smoothstep(0.5 + c_jx - c_fw.x, 0.5 + c_jx + c_fw.x, c_f.x);
float c_my = smoothstep(c_y0 - c_fw.y, c_y0 + c_fw.y, c_f.y) - smoothstep(c_y1 - c_fw.y, c_y1 + c_fw.y, c_f.y);
float c_longe = smoothstep(0.22, 0.7, max(c_fw.x, c_fw.y));
float c_bloco = step(1.5, vInfo.z);
float c_jan = mix(clamp(c_mx * c_my, 0.0, 1.0), c_B.y * c_B.z, c_longe) * (1.0 - c_teto) * (1.0 - c_bloco);
float c_terreo = (1.0 - smoothstep(4.0, 4.4, vMundo.y)) * step(0.25, vMundo.y) * (1.0 - c_teto) * (1.0 - c_bloco) * (1.0 - c_longe);
float c_hc = c_h21(c_id + vInfo.x * 97.0);
float c_tr = floor(uT * 0.55 + c_hc * 13.0);                      // cada janela troca de estado na sua hora
float c_on = step(c_h21(c_id * 1.37 + vec2(c_tr, vInfo.x * 31.0)), uFrac);
c_on = mix(c_on, uFrac, c_longe);
float c_liga = smoothstep(0.85, 1.0, clamp(vInfo.z, 0.0, 1.0)) * vInfo.w * uLuzes * (1.0 - c_bloco);
vec3 c_fach = c_A.rgb * (0.86 + 0.26 * c_h21(vec2(c_id.y, vInfo.x * 7.0)));
float c_laje = (1.0 - smoothstep(0.0, 0.07 + c_fw.y, c_f.y)) * (1.0 - c_longe);
c_fach *= 1.0 - 0.3 * c_laje;
vec3 c_vid = c_C.rgb * (0.75 + 0.5 * c_hc);
vec3 c_base = mix(c_fach, c_vid, max(c_jan, c_terreo * 0.9));
c_base = mix(c_base, vec3(0.12, 0.125, 0.13) * (0.8 + 0.4 * vInfo.x), c_teto);
c_base = mix(c_base, c_A.rgb * 0.45, c_bloco);
c_base = mix(c_base, vec3(0.016, 0.018, 0.024), uApagao);
diffuseColor.rgb = c_base;`;

const FS_RUG = `#include <roughnessmap_fragment>
roughnessFactor = mix(0.85, 0.16, max(c_jan, c_terreo) * c_B.w);
roughnessFactor = mix(roughnessFactor, 0.92, uApagao);`;

const FS_EMI = `#include <emissivemap_fragment>
{
  vec3 c_V = normalize(cameraPosition - vMundo);
  vec3 c_N = normalize(vNw);
  vec3 c_R = reflect(-c_V, c_N);
  float c_fr = 0.04 + 0.96 * pow(1.0 - max(dot(c_N, c_V), 0.0), 5.0);
  vec3 c_ceu = c_R.y > 0.0 ? mix(uCeuH, uCeuZ, smoothstep(0.0, 0.45, c_R.y)) : uChao;
  float c_aceso = c_on * c_liga;
  float c_vd = max(c_jan, c_terreo) * c_B.w * (1.0 - c_aceso);
  totalEmissiveRadiance += c_ceu * (c_fr * mix(0.1, 1.0, c_vd) + 0.05 * c_vd) * (0.8 + 0.4 * c_hc) * 0.4 * uRefl * (1.0 - uApagao) * (1.0 - 0.7 * c_teto);
  vec3 c_cl = mix(vec3(1.0, 0.6, 0.26), vec3(1.0, 0.86, 0.62), step(0.62, c_h21(c_id + 3.1)));
  totalEmissiveRadiance += c_cl * uForcaJan * c_jan * c_aceso;
  totalEmissiveRadiance += vec3(1.0, 0.82, 0.58) * uForcaJan * 0.7 * c_terreo * c_liga;
  // de longe a fachada recebe a luz difusa do ceu e do chao (o skyline se destaca das colinas mesmo contra o sol)
  totalEmissiveRadiance += c_base * uPreench * smoothstep(1.5, 2.5, vLod) * (1.0 - 0.5 * c_teto);
}`;

const FS_NEVOA = `#include <fog_fragment>
gl_FragColor.rgb = c_final(gl_FragColor.rgb, vMundo);`;

const matPredio = (U: Uni, cil: boolean) => {
  const m = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.8, metalness: 0});
  const T = uniformsTipos();
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, U, T);
    if (cil) s.defines = {...(s.defines ?? {}), CILINDRO: 1};
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 aInfo;\nvarying vec3 vMundo; varying vec3 vNw; varying vec3 vEsc; varying vec3 vLoc; varying vec3 vNo; varying vec4 vInfo; varying float vLod;')
      .replace('#include <project_vertex>', VS_MUNDO);
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\n' + FS_DECL)
      .replace('#include <color_fragment>', FS_COR)
      .replace('#include <roughnessmap_fragment>', FS_RUG)
      .replace('#include <emissivemap_fragment>', FS_EMI)
      .replace('#include <fog_fragment>', FS_NEVOA);
  };
  m.customProgramCacheKey = () => 'cidade-predio-' + (cil ? 'cil' : 'caixa');
  return m;
};

// material PBR comum + so a nevoa aerea (guindastes, agulhas, chao, colinas)
const comNevoa = <M extends THREE.Material>(m: M, U: Uni, chave: string): M => {
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, {uNevCor: U.uNevCor, uNevDens: U.uNevDens, uNevMax: U.uNevMax, uPostCor: U.uPostCor, uPostDens: U.uPostDens, uPostMax: U.uPostMax});
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMundoN;')
      .replace('#include <project_vertex>', `#include <project_vertex>
{ mat4 c_mi = mat4(1.0);
  #ifdef USE_INSTANCING
  c_mi = instanceMatrix;
  #endif
  vMundoN = (modelMatrix * c_mi * vec4(transformed, 1.0)).xyz; }`);
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vMundoN;\n' + GLSL_NEVOA)
      .replace('#include <fog_fragment>', '#include <fog_fragment>\ngl_FragColor.rgb = c_final(gl_FragColor.rgb, vMundoN);');
  };
  m.customProgramCacheKey = () => 'cidade-nevoa-' + chave;
  return m;
};

// ---------- material de luz translucida (aneis, arcos, muro, cupula): fresnel aditivo com revelacao ----------
const VS_ANEL = `varying vec3 vW; varying vec3 vN; varying vec2 vUv;
void main(){
  vec4 p = vec4(position, 1.0); vec3 n = normal;
  #ifdef USE_INSTANCING
  p = instanceMatrix * p; n = mat3(instanceMatrix) * n;
  #endif
  vec4 w = modelMatrix * p; vW = w.xyz; vN = normalize(mat3(modelMatrix) * n); vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const FS_ANEL = `uniform vec3 uCor; uniform float uForca; uniform float uProg; uniform float uBase; uniform float uExp; uniform float uGrade;
uniform float uCorteY; uniform float uGradV; uniform float uApagao;
varying vec3 vW; varying vec3 vN; varying vec2 vUv;
${GLSL_NEVOA}
void main(){
  vec3 V = normalize(cameraPosition - vW);
  float fres = pow(1.0 - abs(dot(normalize(vN), V)), uExp);
  float a = uBase + (1.0 - uBase) * fres;
  if (uGrade > 0.0) {
    vec2 q = vUv * vec2(72.0, 18.0); vec2 g = abs(fract(q) - 0.5); vec2 fw = fwidth(q) * 1.2;
    float l = max(1.0 - smoothstep(0.0, fw.x, 0.5 - g.x), 1.0 - smoothstep(0.0, fw.y, 0.5 - g.y));
    a += l * uGrade * (1.0 - smoothstep(0.3, 1.0, max(fw.x, fw.y)));
  }
  if (uGradV > 0.0) a *= mix(1.0, 1.0 - vUv.y, uGradV) * (0.6 + 0.4 * smoothstep(0.85, 1.0, vUv.y) + 0.4 * (1.0 - smoothstep(0.0, 0.06, vUv.y)));
  float rev = 1.0 - smoothstep(uProg - 0.004, uProg, vUv.x);
  float cab = (1.0 - smoothstep(0.0, 0.03, uProg - vUv.x)) * rev * (1.0 - step(0.999, uProg));
  a *= rev * (1.0 + 3.0 * cab) * (1.0 - smoothstep(uCorteY - 30.0, uCorteY, vW.y));
  vec3 col = uCor * uForca * a * (1.0 - uApagao) * (1.0 - 0.8 * c_nevoa(vW));
  gl_FragColor = vec4(col, 1.0);
}`;
const matAnel = (U: Uni, o: {cor?: string; forca?: number; base?: number; exp?: number; grade?: number; gradV?: number}) => new THREE.ShaderMaterial({
  vertexShader: VS_ANEL, fragmentShader: FS_ANEL, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
  uniforms: {uCor: {value: new THREE.Color(o.cor ?? '#e8f2ff')}, uForca: {value: o.forca ?? 2.2}, uProg: {value: 0}, uBase: {value: o.base ?? 0.35},
    uExp: {value: o.exp ?? 1.5}, uGrade: {value: o.grade ?? 0}, uCorteY: {value: 1e5}, uGradV: {value: o.gradV ?? 0},
    uApagao: U.uApagao, uNevCor: U.uNevCor, uNevDens: U.uNevDens, uNevMax: U.uNevMax, uPostCor: U.uPostCor, uPostDens: U.uPostDens, uPostMax: U.uPostMax},
});

// ---------- mar ----------
const VS_MAR = `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const FS_MAR = `uniform float uT; uniform float uCosta; uniform float uAzMin; uniform float uAzMax; uniform vec2 uNorm;
uniform vec3 uSol; uniform vec3 uCeuZ; uniform vec3 uCeuH; uniform float uDia;
varying vec3 vW;
${GLSL_NEVOA}
float ond(vec2 p){ return sin(p.x * 0.21 + uT * 1.3) * 0.5 + sin(p.y * 0.17 - uT * 1.1 + p.x * 0.05) * 0.5
  + sin((p.x + p.y) * 0.53 + uT * 2.1) * 0.25 + sin((p.x * 0.8 - p.y) * 1.1 - uT * 2.7) * 0.12 + sin((p.x * 1.7 + p.y * 1.3) * 1.9 + uT * 3.3) * 0.06; }
void main(){
  vec2 p = vW.xz - cameraPosition.xz;
  float az = atan(-p.x, -p.y);
  float m = smoothstep(uAzMin, uAzMin + 0.15, az) * (1.0 - smoothstep(uAzMax - 0.15, uAzMax, az));
  float dn = dot(vW.xz, uNorm);
  m *= smoothstep(uCosta, uCosta + 3.0 + 0.012 * uCosta, dn);
  if (m < 0.003) discard;
  float h0 = ond(vW.xz), hx = ond(vW.xz + vec2(0.4, 0.0)), hz = ond(vW.xz + vec2(0.0, 0.4));
  vec3 N = normalize(vec3(-(hx - h0) * 0.9, 1.0, -(hz - h0) * 0.9));
  float dist = length(vW - cameraPosition);
  N = normalize(mix(N, vec3(0.0, 1.0, 0.0), smoothstep(120.0, 1400.0, dist)));
  vec3 V = normalize(cameraPosition - vW);
  float fr = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  vec3 R = reflect(-V, N);
  vec3 ceu = mix(uCeuH, uCeuZ, 0.55 + 0.45 * smoothstep(0.0, 0.2, R.y));
  vec3 agua = vec3(0.01, 0.045, 0.085);
  vec3 col = mix(agua, ceu * 0.85, min(fr, 0.7));
  vec3 S = normalize(uSol);
  col += vec3(1.0, 0.86, 0.62) * pow(max(dot(R, S), 0.0), 260.0) * 5.0 * clamp(S.y * 4.0 + 0.4, 0.0, 1.0);
  col = c_final(col, vW);
  gl_FragColor = vec4(col, m);
}`;
const matMar = (U: Uni) => new THREE.ShaderMaterial({vertexShader: VS_MAR, fragmentShader: FS_MAR, transparent: true, depthWrite: true, toneMapped: false,
  uniforms: {uT: U.uT, uCosta: {value: 3400}, uAzMin: {value: -0.4}, uAzMax: {value: 2.2}, uNorm: {value: new THREE.Vector2(0, -1)},
    uSol: U.uSol, uCeuZ: U.uCeuZ, uCeuH: U.uCeuH, uDia: U.uDia, uNevCor: U.uNevCor, uNevDens: U.uNevDens, uNevMax: U.uNevMax,
    uPostCor: U.uPostCor, uPostDens: U.uPostDens, uPostMax: U.uPostMax}});

// ---------- predios ----------
type Pred = {
  x: number; z: number; rot: number; w: number; d: number;
  H: number; t0: number; dur: number; tMorre: number;
  H2: number; tS: number; durS: number;
  tQ: number; durQ: number; hRes: number; tilt: number; tiltAz: number;
  tSome: number; tipo: number; sem: number;
  cam: [number, number][];
  agulha: boolean; guind: boolean;
  slot: number; gslot: number; aslot: number;
};
type Base = Partial<Pred> & {x: number; z: number; w: number; d: number; H: number; t0: number; dur: number; tipo: number; sem: number};
const novo = (o: Base): Pred => ({rot: -TH, tMorre: Infinity, H2: o.H, tS: Infinity, durS: 1, tQ: Infinity, durQ: 0.4, hRes: 30, tilt: 0, tiltAz: 0,
  tSome: Infinity, cam: [[0, 1]], agulha: false, guind: false, slot: 0, gslot: -1, aslot: -1, ...o});

const camadasDe = (H: number, s: number, agulha: boolean): [number, number][] =>
  agulha ? [[0, 1], [0.3, 0.8], [0.55, 0.62], [0.75, 0.44], [0.9, 0.28]]
    : H > 140 ? (s < 0.5 ? [[0, 1], [0.62, 0.8], [0.86, 0.58]] : [[0, 1], [0.5, 0.86]])
      : H > 55 && s < 0.5 ? [[0, 1], [0.82, 0.72]] : [[0, 1]];

const altura = (b: Pred, t: number) => {
  if (t < b.t0 || t > b.tMorre + 0.3) return {h: 0, Hc: b.H, p: 0, q: 0, s: 0};
  const s = ease(clamp01((t - b.tS) / b.durS));
  const Hc = b.H + (b.H2 - b.H) * s;
  const p = clamp01((t - b.t0) / b.dur);
  let h = Hc * easeOut(p);
  if (t > b.tMorre) h *= 1 - (t - b.tMorre) / 0.3;
  const q = easeIn(clamp01((t - b.tQ) / b.durQ));
  if (q > 0) h += (Math.min(h, b.hRes) - h) * q;
  // fim: os tocos viram blocos baixos (114,2-114,6) e somem (ate 115,6)
  h += (Math.min(h, 34 + b.sem * 18) - h) * smooth(114.2, 114.6, t);
  h *= 1 - smooth(114.6 + b.sem * 0.45, 115.6, t);
  h *= 1 - easeIn(clamp01((t - b.tSome) / 0.6));
  return {h, Hc, p, q, s};
};

const gerar = () => {
  const longe: Pred[] = [], perto: Pred[] = [];
  const g1 = new THREE.Vector3(Math.cos(TH), 0, Math.sin(TH)), g2 = new THREE.Vector3(-Math.sin(TH), 0, Math.cos(TH));
  type Lote = {p: THREE.Vector3; r: number; k: number};
  const lotes: Lote[] = [];
  let k = 0;
  for (let i = -26; i <= 26; i++) for (let j = -26; j <= 26; j++) {
    k++;
    const p = C.clone().addScaledVector(g1, i * 75).addScaledVector(g2, j * 75);
    const v = p.clone().sub(C);
    lotes.push({p, r: Math.hypot(v.dot(E_LAT) / RA, v.dot(E_PROF) / RB), k});
  }
  // agulhas (torres de uma milha): os 12 lotes mais centrais
  const centrais = new Set(lotes.filter((l) => l.r < 0.4).sort((a, b) => a.r - b.r).slice(0, 12).map((l) => l.k));
  const ultimas: Pred[] = [];
  for (const L of lotes) {
    const {p, r, k} = L;
    const s = (n: number) => rnd(k * 13.37 + n * 1.618);
    const az = Math.atan2(-p.x, -p.z), dc = Math.hypot(p.x, p.z);
    const jx = (s(40) - 0.5) * 10, jz = (s(41) - 0.5) * 10;
    if (r < 1) {
      const cf = 1 - r, gens: Pred[] = [];
      if (s(1) < 0.9) {
        const H = 12 + 25 * s(2) + 110 * cf * cf * s(3) + (s(4) < 0.18 ? 150 * Math.pow(cf, 1.5) : 0);
        gens.push(novo({x: p.x + jx, z: p.z + jz, w: 24 + 28 * s(5), d: 24 + 28 * s(6), H, t0: s(7) < 0.15 ? 64 + 12.5 * s(8) : -100, dur: 1.4,
          tipo: [0, 1, 2, 6][Math.floor(s(9) * 4)], sem: s(10), cam: camadasDe(H, s(11), false)}));
      }
      if (r < 0.8 && s(12) < 0.2 + 0.55 * cf) {
        const H = 85 + 330 * Math.pow(cf, 1.5) * (0.45 + 0.55 * s(13));
        gens.push(novo({x: p.x + jx, z: p.z + jz, w: 28 + 22 * s(15), d: 28 + 22 * s(16), H, t0: 77 + 10 * Math.pow(s(14), 1.25), dur: 1.3 + 1.4 * s(17),
          tipo: [0, 1, 2, 3][Math.floor(s(18) * 4)], sem: s(19), cam: camadasDe(H, s(11), false), guind: true}));
      }
      const agulha = centrais.has(k);
      if ((r < 0.88 && s(20) < 0.15 + 0.6 * cf) || agulha) {
        const prev = gens.length ? gens[gens.length - 1].H : 0;
        const H = agulha ? 480 + 220 * s(23) : Math.max(prev * 1.1, 160 + 520 * Math.pow(cf, 1.3) * (0.5 + 0.5 * s(23)));
        const w = agulha ? 36 + 10 * s(24) : 30 + 25 * s(24);
        gens.push(novo({x: p.x + jx, z: p.z + jz, w, d: agulha ? w : 30 + 25 * s(25), H, t0: 90 + (agulha ? 3.5 : 5) * s(21), dur: 0.9 + 0.6 * s(22),
          tipo: agulha ? [3, 5, 2][Math.floor(s(26) * 3)] : [3, 2, 5, 3, 1][Math.floor(s(26) * 5)], sem: s(27), cam: camadasDe(H, s(28), agulha), guind: true, agulha,
          H2: agulha ? 1150 + 750 * s(29) : H, tS: agulha ? 97 + 1.6 * s(30) : Infinity, durS: 2.2 + 0.6 * s(31)}));
      }
      for (let g = 0; g < gens.length - 1; g++) gens[g].tMorre = gens[g + 1].t0;
      if (gens.length) {
        const u = gens[gens.length - 1];
        u.tQ = u.agulha ? 113.2 + 0.5 * s(32) : u.H > 300 ? 113.0 + 0.6 * s(32) : 112.8 + 0.55 * s(32);
        u.durQ = 0.35 + 0.2 * s(33); u.hRes = 18 + 28 * s(34); u.tilt = (4 + 9 * s(35)) * DEG; u.tiltAz = s(36) * Math.PI * 2;
        ultimas.push(u);
      }
      longe.push(...gens);
    } else if (r < 1.9 && dc > 600 && az > -28 * DEG && az < 62 * DEG && s(50) < 0.75) {
      // a cidade se espalha pela planicie (80-88): casas e predios baixos, de dentro para fora
      const H = 6 + 18 * s(51) * s(51);
      longe.push(novo({x: p.x + jx, z: p.z + jz, w: 14 + 26 * s(52), d: 14 + 26 * s(53), H, t0: 80 + 7.5 * clamp01((r - 1) / 0.9) + 0.8 * s(54), dur: 0.5,
        tipo: [0, 1, 6, 1][Math.floor(s(55) * 4)], sem: s(56), tSome: 109.6 + 2.0 * s(57)}));
    }
  }
  // 3 agulhas sobreviventes (as mais altas): caem por ultimo e viram tocos
  const sobre = ultimas.filter((b) => b.agulha).sort((a, b) => b.H2 - a.H2).slice(0, 3);
  sobre.forEach((b, i) => { b.tQ = 113.78 + i * 0.04; b.durQ = 0.4; b.hRes = 0.15 * b.H2; b.tilt = 2 * DEG; });

  // ---------- lado direito da rua (perto) ----------
  // [x0 (frente), zc, largura em x, comprimento em z, H, tipo, t0, dur, H2, tS]
  const P: [number, number, number, number, number, number, number, number, number, number][] = [
    [X_RUA + 4, -425, 30, 32, 92, 4, 84.5, 1.0, 92, Infinity],          // torre residencial escura (84,5-85,5)
    [X_RUA + 1, -135, 20, 34, 30, 1, 88.0, 0.7, 96, 91.0],               // predios ao longo da rua (88-90), sobem de novo em 91-93,5
    [X_RUA + 2, -180, 22, 36, 44, 2, 88.25, 0.7, 128, 91.4],
    [X_RUA + 1, -228, 18, 32, 26, 1, 88.5, 0.7, 84, 91.8],
    [X_RUA + 3, -272, 24, 38, 52, 0, 88.7, 0.7, 150, 92.2],
    [X_RUA + 1, -320, 20, 34, 36, 1, 88.9, 0.7, 110, 92.6],
    [X_RUA + 2, -365, 26, 36, 58, 2, 89.1, 0.7, 170, 93.0],
    [X_RUA, 22, 26, 44, 118, 2, 90.0, 0.9, 118, Infinity],                // fileira alta que substitui as casas (90-93,5)
    [X_RUA, -21, 24, 36, 152, 1, 90.25, 0.9, 152, Infinity],
    [X_RUA + 1, -108, 24, 30, 104, 0, 90.6, 0.9, 104, Infinity],
    [X_RUA + 6, 66, 30, 40, 96, 6, 90.4, 0.9, 96, Infinity],
    [X_RUA, -76, 30, 28, 430, 5, 93.5, 1.5, 430, Infinity],              // vidro muito alto colado a direita (93,5-95)
    [X_RUA + 40, -60, 34, 40, 210, 3, 91.2, 1.1, 210, Infinity],         // segunda fileira, atras
    [X_RUA + 44, -150, 30, 36, 260, 2, 91.8, 1.1, 260, Infinity],
    [X_RUA + 42, -250, 36, 40, 300, 3, 92.4, 1.2, 300, Infinity],
    [X_RUA + 46, -340, 30, 34, 190, 1, 92.9, 1.1, 190, Infinity],
  ];
  P.forEach(([x0, zc, wx, dz, H, tipo, t0, dur, H2, tS], i) => {
    const sem = rnd(500 + i * 7);
    perto.push(novo({x: x0 + wx / 2, z: zc, w: wx, d: dz, H, t0, dur, tipo, sem, rot: 0, H2, tS, durS: 1.0,
      cam: H2 > 150 ? [[0, 1], [0.8, 0.8]] : [[0, 1]], tSome: 109.6 + 1.6 * rnd(600 + i * 3)}));
  });

  // slots das instancias
  let n = 0, g = 0, a = 0;
  for (const b of longe) { b.slot = n; n += b.cam.length; if (b.guind) b.gslot = g++; if (b.agulha) b.aslot = a++; }
  let np = 0;
  for (const b of perto) { b.slot = np; np += b.cam.length; }
  // poeira: um foco por torre alta que cai
  const poeira: Emissor[] = ultimas.filter((b) => Math.max(b.H, b.H2) >= 170).map((b) => ({x: b.x, y: 0, z: b.z,
    s: Math.min(360, Math.max(90, 0.32 * Math.max(b.H, b.H2))), t0: b.tQ, t1: b.tQ + 0.9}));
  return {longe, perto, nTiers: n, nGuind: g, nAgulha: a, nPerto: np, poeira};
};

// ---------- arcologia (101,5-105,5) ----------
const ARC_POS = C.clone().addScaledVector(E_PROF, 300).addScaledVector(E_LAT, 90);
const ARC_N = 8, ARC_ANDAR = 120;
const ARC: Pred = novo({x: ARC_POS.x, z: ARC_POS.z, w: 0, d: 0, H: ARC_N * ARC_ANDAR, t0: 101.5, dur: 3.6, tipo: 7, sem: 0.37, tQ: 113.15, durQ: 0.5, hRes: 60});
const arcRaio = (k: number) => 210 * (1 - 0.075 * k);

// ---------- muro contra o mar (95,5-99) ----------
const ANEIS = [{y: 16, s: 1.1, ti: 0.01}, {y: 44, s: 1.13, ti: -0.02}, {y: 86, s: 1.08, ti: 0.03}, {y: 140, s: 1.16, ti: -0.035}, {y: 212, s: 1.04, ti: 0.045}, {y: 300, s: 1.12, ti: -0.05}, {y: 410, s: 0.98, ti: 0.06}];
const N_ARCOS = 44;

// ---------- montagem ----------
const montar = () => {
  const U = novosUniforms();
  const D = gerar();
  const raiz = new THREE.Group();
  const caixa = () => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const info = (n: number) => new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const instanciado = (geo: THREE.BufferGeometry, mat: THREE.Material, n: number, comInfo: boolean) => {
    if (comInfo) geo.setAttribute('aInfo', info(n));
    const m = new THREE.InstancedMesh(geo, mat, Math.max(1, n));
    m.frustumCulled = false;
    for (let i = 0; i < Math.max(1, n); i++) m.setMatrixAt(i, zero);
    raiz.add(m);
    return m;
  };
  const mPred = matPredio(U, false);
  const mLonge = instanciado(caixa(), mPred, D.nTiers, true);
  const mPerto = instanciado(caixa(), mPred, D.nPerto, true);
  mPerto.castShadow = true; mPerto.receiveShadow = true;
  const mArc = instanciado(new THREE.CylinderGeometry(0.44, 0.5, 1, 64, 1).translate(0, 0.5, 0), matPredio(U, true), ARC_N, true);
  const mGuind = instanciado(caixa(), comNevoa(new THREE.MeshStandardMaterial({color: '#d6a326', roughness: 0.55, metalness: 0.3}), U, 'guind'), D.nGuind * 2, false);
  const mAgulha = instanciado(new THREE.ConeGeometry(0.5, 1, 8).translate(0, 0.5, 0),
    comNevoa(new THREE.MeshStandardMaterial({color: '#b8c2cc', roughness: 0.3, metalness: 0.8}), U, 'agulha'), D.nAgulha, false);
  // informacao estatica (semente, tipo)
  const preencher = (m: THREE.InstancedMesh, lista: Pred[]) => {
    const at = m.geometry.getAttribute('aInfo') as THREE.InstancedBufferAttribute;
    for (const b of lista) for (let c = 0; c < b.cam.length; c++) at.setXYZW(b.slot + c, b.sem, b.tipo, 1, 1);
  };
  preencher(mLonge, D.longe); preencher(mPerto, D.perto);
  {
    const at = mArc.geometry.getAttribute('aInfo') as THREE.InstancedBufferAttribute;
    for (let k = 0; k < ARC_N; k++) at.setXYZW(k, 0.37 + k * 0.07, 7, 1, 1);
  }

  // aneis da arcologia (bordas brancas de cada camada)
  const geoAnelFino = new THREE.TorusGeometry(1, 0.012, 4, 160).rotateX(-Math.PI / 2);
  const matAnelArc = matAnel(U, {forca: 1.8, base: 0.35, exp: 1.2});
  matAnelArc.uniforms.uProg.value = 1;
  const anelArc = new THREE.InstancedMesh(geoAnelFino, matAnelArc, ARC_N); anelArc.frustumCulled = false;
  for (let k = 0; k < ARC_N; k++) anelArc.setMatrixAt(k, zero);
  raiz.add(anelArc);

  // muro: aneis horizontais (eliptico em torno da base), arcos em pe, faixa translucida
  const geoAnel = new THREE.TorusGeometry(1, 0.0048, 4, 480).rotateX(-Math.PI / 2);
  const aneis = ANEIS.map((a, i) => {
    const mat = matAnel(U, {forca: 2.4, base: 0.22, exp: 1.4});
    const m = new THREE.Mesh(geoAnel, mat); m.frustumCulled = false;
    m.position.set(C.x, a.y, C.z);
    m.rotation.set(a.ti, AZ_C + i * 0.7, 0, 'YXZ');
    m.scale.set(RA * a.s, 1000, RB * a.s);
    raiz.add(m);
    return m;
  });
  const geoArco = new THREE.TorusGeometry(1, 0.05, 5, 28, Math.PI);
  const matArco = matAnel(U, {forca: 1.0, base: 0.18, exp: 1.6}); matArco.uniforms.uProg.value = 1;
  const arcos = new THREE.InstancedMesh(geoArco, matArco, N_ARCOS); arcos.frustumCulled = false; raiz.add(arcos);
  const arcoBase = Array.from({length: N_ARCOS}, (_, i) => {
    const th = (i / N_ARCOS) * Math.PI * 2, a = RA * 1.1, bb = RB * 1.1;
    const pos = C.clone().addScaledVector(E_LAT, a * Math.cos(th)).addScaledVector(E_PROF, bb * Math.sin(th));
    const tan = E_LAT.clone().multiplyScalar(-a * Math.sin(th)).addScaledVector(E_PROF, bb * Math.cos(th)).normalize();
    return {pos, rot: Math.atan2(-tan.z, tan.x), r: 48 + 34 * rnd(900 + i), t0: 96 + 3 * ((i * 7) % N_ARCOS) / N_ARCOS};
  });
  const matMuro = matAnel(U, {forca: 0.32, base: 0.1, exp: 2.0, gradV: 0.85, cor: '#dcecff'});
  const muro = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 200, 1, true).translate(0, 0.5, 0), matMuro);
  muro.frustumCulled = false; muro.position.copy(C); muro.rotation.y = AZ_C; muro.scale.set(RA * 1.1, 70, RB * 1.1);
  raiz.add(muro);
  // cupula (101,5-105,8)
  const matCup = matAnel(U, {forca: 0.7, base: 0.012, exp: 3.0, grade: 0.22, cor: '#cfe4ff'}); matCup.uniforms.uProg.value = 1;
  const cupula = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 36, 0, Math.PI * 2, 0, Math.PI / 2), matCup);
  cupula.frustumCulled = false; cupula.position.copy(C).addScaledVector(E_PROF, 100); cupula.rotation.y = AZ_C; cupula.scale.set(RA * 1.22, 1050, RB * 1.25);
  raiz.add(cupula);

  // mar e chao distante (as colinas do horizonte sao da Rua, a 3,8 km)
  const mar = new THREE.Mesh(new THREE.PlaneGeometry(60000, 60000).rotateX(-Math.PI / 2), matMar(U));
  mar.frustumCulled = false; mar.renderOrder = 2; raiz.add(mar);
  const chao = new THREE.Mesh(new THREE.RingGeometry(380, 30000, 96, 1).rotateX(-Math.PI / 2),
    comNevoa(new THREE.MeshStandardMaterial({color: '#4c6534', roughness: 1}), U, 'chao'));
  chao.position.y = -0.08; chao.receiveShadow = false; raiz.add(chao);
  return {U, D, raiz, mLonge, mPerto, mArc, mGuind, mAgulha, anelArc, aneis, arcos, arcoBase, muro, matMuro, cupula, matCup, mar, zero};
};
type Montagem = ReturnType<typeof montar>;

// ---------- atualizacao por quadro (so funcao de t) ----------
const _B = new THREE.Matrix4(), _L = new THREE.Matrix4(), _O = new THREE.Matrix4(), _R = new THREE.Matrix4(), _T = new THREE.Matrix4();
const _eixo = new THREE.Vector3();

// nevoa propria (cor do horizonte da Rua) + a nevoa de pos que o Look aplica por cima (para descontar no shader)
const ajustaNevoa = (U: Uni, t: number, luz: LuzTempo) => {
  const nv = perfilRua(t).nevoa;
  const cor = nv ? new THREE.Color(nv.cor) : new THREE.Color(0.66, 0.7, 0.78).lerp(luz.corSol, 0.15).multiplyScalar(0.3 + 0.7 * luz.dia);
  const azul = cor.clone().lerp(new THREE.Color(0.32, 0.42, 0.6).multiplyScalar(0.3 + 0.7 * luz.dia), 0.35);   // a cidade fica azulada ao longe
  (U.uNevCor.value as THREE.Color).copy(azul);
  (U.uCeuH.value as THREE.Color).copy(cor);
  (U.uPostCor.value as THREE.Color).copy(cor);
  U.uPostDens.value = 0; U.uPostMax.value = 0;
};

const posePredio = (b: Pred, q: number) => {
  _B.makeRotationY(b.rot);
  if (q > 0 && b.tilt) { _eixo.set(Math.cos(b.tiltAz), 0, Math.sin(b.tiltAz)); _R.makeRotationAxis(_eixo, b.tilt * q); _B.multiply(_R); }
  _B.setPosition(b.x, 0, b.z);
};

const atualizarPredios = (m: THREE.InstancedMesh, lista: Pred[], t: number, M: Montagem | null) => {
  const at = m.geometry.getAttribute('aInfo') as THREE.InstancedBufferAttribute;
  for (const b of lista) {
    const {h, Hc, p, q, s} = altura(b, t);
    const bloco = t > b.tSome - 0.35 ? 2 : p;
    if (h <= 0.05) {
      for (let c = 0; c < b.cam.length; c++) m.setMatrixAt(b.slot + c, M ? M.zero : _O.makeScale(0, 0, 0));
    } else {
      posePredio(b, q);
      for (let c = 0; c < b.cam.length; c++) {
        const y0 = b.cam[c][0] * Hc, y1 = c + 1 < b.cam.length ? b.cam[c + 1][0] * Hc : Hc, top = Math.min(y1, h), k = b.cam[c][1];
        if (top <= y0 + 0.01) { _O.makeScale(0, 0, 0); }
        else { _L.makeScale(b.w * k, top - y0, b.d * k); _L.setPosition(0, y0, 0); _O.multiplyMatrices(_B, _L); }
        m.setMatrixAt(b.slot + c, _O);
        at.setZ(b.slot + c, bloco);
      }
    }
    if (!M) continue;
    // guindaste no topo enquanto a torre sobe (ou estica)
    if (b.gslot >= 0) {
      const cresce = (p > 0.01 && p < 0.97) || (s > 0.01 && s < 0.97);
      if (cresce && h > 5 && t < b.tMorre) {
        const kk = b.cam[b.cam.length - 1][1], cx = b.w * kk * 0.3, cz = b.d * kk * 0.3, esc = Math.min(1, 0.4 + h / 300);
        _L.makeScale(4.5 * esc, 58 * esc, 4.5 * esc); _L.setPosition(cx, h - 20 * esc, cz); _O.multiplyMatrices(_B, _L);
        M.mGuind.setMatrixAt(b.gslot * 2, _O);
        const ang = b.sem * 6.28 + t * 0.9;
        _T.makeTranslation(cx, h + 34 * esc, cz); _R.makeRotationY(ang); _T.multiply(_R);
        _L.makeScale(100 * esc, 3.5 * esc, 3.5 * esc); _L.setPosition(22 * esc, 0, 0); _T.multiply(_L);
        _O.multiplyMatrices(_B, _T);
        M.mGuind.setMatrixAt(b.gslot * 2 + 1, _O);
      } else { M.mGuind.setMatrixAt(b.gslot * 2, M.zero); M.mGuind.setMatrixAt(b.gslot * 2 + 1, M.zero); }
    }
    // agulha (mastro) no topo das torres de uma milha
    if (b.aslot >= 0) {
      if (h > 0.985 * Hc && q <= 0) {
        const kk = b.cam[b.cam.length - 1][1];
        _L.makeScale(b.w * kk * 0.55, Hc * 0.1, b.d * kk * 0.55); _L.setPosition(0, h, 0); _O.multiplyMatrices(_B, _L);
        M.mAgulha.setMatrixAt(b.aslot, _O);
      } else M.mAgulha.setMatrixAt(b.aslot, M.zero);
    }
  }
  m.instanceMatrix.needsUpdate = true; at.needsUpdate = true;
};

const atualizar = (M: Montagem, t: number, luz: LuzTempo) => {
  const U = M.U;
  const apagao = smooth(105.8, 106.2, t);
  U.uT.value = t; U.uApagao.value = apagao; U.uLuzes.value = 1 - apagao; U.uDia.value = luz.dia;
  U.uSol.value.copy(luz.sol);
  ajustaNevoa(U, t, luz);
  (U.uCeuZ.value as THREE.Color).copy(luz.ambiente).multiplyScalar(0.55 + 0.45 * luz.dia);
  U.uNevDens.value = 0.00045 * (1 - 0.55 * apagao);      // as silhuetas apagadas ficam mais pretas contra o ceu
  U.uRefl.value = 0.45 + 0.55 * luz.dia;
  U.uPreench.value = (0.15 + 0.7 * luz.dia) * (1 - apagao);

  atualizarPredios(M.mLonge, M.D.longe, t, M);
  atualizarPredios(M.mPerto, M.D.perto, t, null);
  M.mGuind.instanceMatrix.needsUpdate = true; M.mAgulha.instanceMatrix.needsUpdate = true;

  // arcologia: camada por camada; cai com as torres
  {
    const {h, q} = altura(ARC, t);
    posePredio({...ARC, tilt: 3 * DEG, tiltAz: 1.1}, q);
    const at = M.mArc.geometry.getAttribute('aInfo') as THREE.InstancedBufferAttribute;
    for (let k = 0; k < ARC_N; k++) {
      const y0 = k * ARC_ANDAR, top = Math.min(y0 + ARC_ANDAR, h), r = arcRaio(k);
      if (top <= y0 + 0.5) { M.mArc.setMatrixAt(k, M.zero); M.anelArc.setMatrixAt(k, M.zero); continue; }
      _L.makeScale(2 * r, top - y0, 2 * r); _L.setPosition(0, y0, 0); _O.multiplyMatrices(_B, _L); M.mArc.setMatrixAt(k, _O);
      at.setZ(k, clamp01((h - y0) / ARC_ANDAR));
      if (h >= y0 + ARC_ANDAR - 1) { _L.makeScale(r * 0.9, 1000, r * 0.9); _L.setPosition(0, y0 + ARC_ANDAR, 0); _O.multiplyMatrices(_B, _L); M.anelArc.setMatrixAt(k, _O); }
      else M.anelArc.setMatrixAt(k, M.zero);
    }
    M.mArc.instanceMatrix.needsUpdate = true; at.needsUpdate = true; M.anelArc.instanceMatrix.needsUpdate = true;
  }

  // muro contra o mar: aneis se desenham em volta da base (95,5-98), arcos brotam (96-99), faixa translucida sobe
  M.aneis.forEach((m, i) => { (m.material as THREE.ShaderMaterial).uniforms.uProg.value = ease(clamp01((t - 95.5 - i * 0.32) / 1.6)); m.visible = t > 95.4 && t < 106.3; });
  M.arcoBase.forEach((a, i) => {
    const u = easeOut(clamp01((t - a.t0) / 0.45));
    if (u <= 0 || t > 106.3) { M.arcos.setMatrixAt(i, M.zero); return; }
    _L.makeRotationY(a.rot); _L.scale(new THREE.Vector3(a.r, a.r * u, a.r)); _L.setPosition(a.pos.x, 0, a.pos.z);
    M.arcos.setMatrixAt(i, _L);
  });
  M.arcos.instanceMatrix.needsUpdate = true;
  M.matMuro.uniforms.uProg.value = ease(clamp01((t - 95.6) / 2.2));
  M.muro.visible = t > 95.5 && t < 106.3;
  // cupula: sobe de baixo para cima (101,5-102,7) e some no apagao
  M.matCup.uniforms.uCorteY.value = 1100 * ease(clamp01((t - 101.5) / 1.2));
  M.cupula.visible = t > 101.5 && t < 106.3;

  // mar
  const mc = marCidade(t), mu = (M.mar.material as THREE.ShaderMaterial).uniforms;
  mu.uCosta.value = mc.costa; mu.uAzMin.value = mc.azMin; mu.uAzMax.value = mc.azMax;
  mu.uNorm.value.set(-Math.sin(mc.azNormal), -Math.cos(mc.azNormal));
  M.mar.position.y = mc.nivel;
};

// mar sozinho, para quem continuar a cena depois de 116 s (mesmo shader, mesma costa)
export const MarHorizonte: React.FC<{t: number}> = ({t}) => {
  const {U, mesh} = useMemo(() => {
    const U = novosUniforms();
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(60000, 60000).rotateX(-Math.PI / 2), matMar(U));
    mesh.frustumCulled = false; mesh.renderOrder = 2;
    return {U, mesh};
  }, []);
  const luz = luzEm(t), mc = marCidade(t), mu = (mesh.material as THREE.ShaderMaterial).uniforms;
  U.uT.value = t; U.uSol.value.copy(luz.sol); U.uDia.value = luz.dia;
  ajustaNevoa(U, t, luz); U.uPostDens.value = 0;   // depois de 116 s a nevoa de pos e de outro perfil: sem desconto
  (U.uCeuZ.value as THREE.Color).copy(luz.ambiente).multiplyScalar(0.55 + 0.45 * luz.dia);
  mu.uCosta.value = mc.costa; mu.uAzMin.value = mc.azMin; mu.uAzMax.value = mc.azMax; mu.uNorm.value.set(-Math.sin(mc.azNormal), -Math.cos(mc.azNormal));
  mesh.position.y = mc.nivel;
  return <primitive object={mesh} />;
};

// Montada de 6,4 a 117 s e de 522 s em diante. Antes de 64 s e na volta (522+) e o skyline modesto do inicio, parado (o mesmo de
// antes de 77 s); na volta a Rua so mostra o mundo a partir de 528,8 s (antes disso e preto) e a luz e a das 17:42 (mesma conta da Rua).
const T_VOLTA_CID = 522, T_MOSTRA_VOLTA = 528.8;
export const Cidade: React.FC<{t: number}> = ({t}) => {
  const M = useMemo(() => montar(), []);
  const volta = t >= T_VOLTA_CID;
  const tg = volta || t < 64 ? 63 : t;                                   // tempo da historia da cidade (crescimento, queda, mar)
  const luz = luzEm(volta ? 6.5 + Math.max(0, t - 531) * 0.15 : t);
  atualizar(M, tg, luz);
  M.U.uT.value = t;                                                      // janelas trocam de estado no tempo do quadro
  M.U.uFrac.value = 0.42 * (1 - 0.45 * luz.dia);
  if (volta && t < T_MOSTRA_VOLTA) return null;
  return (
    <>
      <primitive object={M.raiz} />
      <Flipbook atlas={ATLAS.nuvem1} emissores={M.D.poeira} t={tg} porEmissor={3} vida={2.2} sobe={45} cresce={1.3} espalha={0.7}
        cor="#b5aa98" fumaca luz={0.35 + 0.45 * luz.dia} forca={0.9} />
    </>
  );
};
