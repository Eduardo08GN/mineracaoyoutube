// Chao da Terra (agente Terra): uma malha polar unica centrada em voce (0,5 m de passo aos pes, centenas de metros no horizonte,
// ate 150 km) deslocada no vertex shader por um campo de altura que muda com t: morro com lago, lencol de gelo em domo com fendas
// que fluem, parede de gelo, canion de 1,6 km com estratos, cordilheira (ridged multifractal) com neve por altura/inclinacao e
// erosao, colinas, dunas, mar no horizonte e salinas, curvatura da Terra. Materiais PBR CC0 (Poly Haven) em duas escalas,
// luz de luzEm(t) (agente Ceu), sombras de nuvem correndo, neve/poeira soprada e perspectiva aerea alem de 10 km
// (antes disso a nevoa do Look ja cobre). Agua desenhada no proprio shader (sem plano separado: nada de z-fighting a 10 km).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useTexture} from '@react-three/drei';
import {staticFile} from 'remotion';
import {EstadoTerra} from './terra_estado';
import {LuzTempo} from './ceu';

const TERRA_DBG = false;
export const NOISE_GLSL = `
vec2 hh2(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0; }
float gn(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(hh2(i), f), b = dot(hh2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(hh2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), d = dot(hh2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 1.6;
}
const mat2 ROT = mat2(0.8, -0.6, 0.6, 0.8);
float fbm3(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 3; i++) { s += a * gn(p); p = ROT * p * 2.03 + 1.7; a *= 0.5; } return s; }
float fbm5(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * gn(p); p = ROT * p * 2.03 + 1.7; a *= 0.5; } return s; }
float rid(vec2 p){
  float s = 0.0, a = 0.55, w = 1.0;
  for (int i = 0; i < 8; i++) { float n = 1.0 - abs(gn(p)); n *= n; n *= w; w = clamp(n * 1.8, 0.0, 1.0); s += n * a; p = ROT * p * 2.07 + 3.1; a *= 0.48; }
  return s;
}
`;

const COMUM = `
uniform float uT; uniform float uHc; uniform float uGelo; uniform float uParede; uniform float uFluxo;
uniform float uCan; uniform float uMont; uniform float uEros; uniform float uCapR; uniform float uColinas; uniform float uDunas; uniform float uMorro;
uniform float uAgua; uniform float uAguaNivel; uniform float uBaciaR; uniform float uBaciaProf; uniform float uOasis; uniform float uBase; uniform float uFendaPe; uniform float uEscF; uniform vec3 uGramaCor;
${NOISE_GLSL}
// fendas do gelo: isolinhas de ruido esticado ao longo de z (apontam para o horizonte), que serpenteiam e correm para voce (+z)
float campoFenda(vec2 p){
  vec2 q = p / uEscF - vec2(0.0, uFluxo);
  vec2 w = vec2(gn(q / 700.0 + vec2(uT * 0.11, 0.0)), gn(q / 900.0 + 7.3 - vec2(0.0, uT * 0.07)));
  return gn(vec2(q.x / 13.0, q.y / 95.0) + w * 0.9);
}
float campoFenda2(vec2 p){
  vec2 q = p / uEscF - vec2(0.0, uFluxo * 1.1);
  return gn(vec2(q.x / 70.0 + q.y / 260.0, q.y / 70.0) + 3.7 + 0.5 * gn(q / 150.0 - uT * 0.05));
}
// 0..1: dentro de uma fenda (largura em metros cresce com a distancia para as linhas seguirem ate o horizonte)
float fenda(vec2 p, float r, float extra){
  float e = 0.1 + r * 0.002;
  float n = campoFenda(p), nx = campoFenda(p + vec2(e, 0.0)) - n, nz = campoFenda(p + vec2(0.0, e)) - n;
  float d = abs(n) / max(length(vec2(nx, nz)) / e, 1e-4);
  float larg = 0.75 + r * 0.004 + extra;
  float f = 1.0 - smoothstep(larg * 0.45, larg, d);
  float m = campoFenda2(p), mx = campoFenda2(p + vec2(e, 0.0)) - m, mz = campoFenda2(p + vec2(0.0, e)) - m;
  float d2 = abs(m) / max(length(vec2(mx, mz)) / e, 1e-4);
  float f2 = (1.0 - smoothstep(larg * 0.3, larg * 0.7, d2)) * smoothstep(0.0, 0.35, gn(p / 250.0 + 2.0));
  float f3 = 0.0;
  if (uFendaPe > -50.0) {   // 138,2-140,8: uma fenda diagonal varre o gelo debaixo de voce
    float dp = dot(p, normalize(vec2(1.0, 0.55))) - uFendaPe + 0.35 * gn(p * 0.45);
    float lp = 0.55 + 0.25 * gn(p * 0.2 + 3.0);
    f3 = 1.0 - smoothstep(lp * 0.6, lp, abs(dp));
  }
  return max(max(f, f2), f3);
}
float paredeGelo(vec2 p){
  float x = p.x + 45.0 * gn(vec2(p.y / 320.0, 2.0));
  return 150.0 * smoothstep(150.0, 270.0, x) * (1.0 - smoothstep(700.0, 1600.0, x)) * (0.82 + 0.18 * gn(p / 140.0));
}
float dunas(vec2 p){
  float w = fbm3(p / 300.0);
  float s = sin(dot(p, vec2(0.8, 0.6)) / 38.0 + w * 4.0);
  return (pow(abs(s), 1.5) - 0.75) * (0.6 + 0.4 * gn(p / 500.0));
}
float relevoMont(vec2 p){
  vec2 q = p / 5200.0 + vec2(13.1, 7.7);
  vec2 w = vec2(fbm3(q * 0.7), fbm3(q * 0.7 + 5.2));
  float R = rid(q + 0.45 * w);
  float F = fbm5(q * 1.1) * 0.5 + 0.5;
  return mix(R, F * 0.7 + 0.12, uEros);
}
// ---- canion: borda perto quebrada em degraus, parede oposta com contrafortes/ravinas e bancadas, rio no fundo ----
float zBordaPerto(float x){ return -1.9 - 0.9 * gn(vec2(x * 0.11, 3.1)) - 0.45 * gn(vec2(x * 0.6, 9.4)) - 0.2 * gn(vec2(x * 2.3, 1.1)); }
float zBordaLonge(float x){
  float a = x / 560.0 + 0.35 * gn(vec2(x / 900.0, 6.1));
  float tri = abs(fract(a) * 2.0 - 1.0);                 // 0 no fundo da ravina, 1 no meio do contraforte
  return -2550.0 + 330.0 * pow(tri, 0.6) + 80.0 * gn(vec2(x / 260.0, 2.7)) + 40.0 * gn(vec2(x / 90.0, 8.3));
}
float zRio(float x){ return -1520.0 + 140.0 * gn(vec2(x / 900.0, 4.4)) + 40.0 * gn(vec2(x / 260.0, 1.9)); }
// profundidade relativa do canion (0 na borda, 1 no fundo; os degraus da borda perto em metros para 1,6 km)
float canionFrac(vec2 p){
  float dzN = zBordaPerto(p.x) - p.y;
  float perto = 0.0;
  if (dzN > 0.0) perto = (2.5 * smoothstep(0.0, 0.4, dzN) + 9.5 * smoothstep(2.4, 3.1, dzN)) / 1600.0
    + smoothstep(6.0, 260.0, dzN) * (1.0 - 12.0 / 1600.0);
  float s = clamp((p.y - zBordaLonge(p.x)) / 760.0, 0.0, 1.0);
  float u = s * 3.0;
  float longe = mix((floor(u) + smoothstep(0.25, 0.75, fract(u))) / 3.0, s, 0.15);   // 4 paredoes com bancadas entre eles
  return clamp(min(perto, longe), 0.0, 1.0);
}
// altura do chao em p (sem curvatura); m = (gelo, canion, profundidade da agua, bacia)
float alturaTerra(vec2 p, out vec4 m){
  float r = length(p);
  vec2 dir = p / max(r, 1e-3);
  float h = uBase - uMorro * smoothstep(250.0, 1500.0, r);
  float setor = smoothstep(-0.45, 0.1, -dir.y);
  // colinas no horizonte (somem no setor da bacia do mar: senao escondem o mar e as salinas)
  float semCol = uBaciaProf > 1.0 ? 1.0 - setor * smoothstep(800.0, uBaciaR, r) : 1.0;
  h += uColinas * (fbm5(p / 2600.0 + 3.7) * 0.5 + 0.5) * smoothstep(350.0, 4000.0, r) * semCol;
  float faixaOasis = smoothstep(18.0, 70.0, abs(p.x - 45.0 - 0.02 * p.y));
  if (uDunas > 0.0) h += uDunas * dunas(p) * smoothstep(30.0, 250.0, r) * faixaOasis;
  h -= uOasis * 3.0 * (1.0 - faixaOasis) * smoothstep(20.0, 60.0, r);
  float bac = setor * smoothstep(uBaciaR, uBaciaR * 1.35, r);
  // a planicie desce em rampa ate o mar (senao a borda da planicie esconde a faixa de agua/sal no horizonte)
  if (uBaciaProf > 1.0) h -= setor * pow(clamp((r - 30.0) / uBaciaR, 0.0, 1.0), 0.8) * max(0.0, uBase - 12.0);   // voce esta numa crista: o chao cai desde perto
  h -= uBaciaProf * bac;
  if (uMont > 0.0) {
    float L = uHc * (0.44 + 0.46 * relevoMont(p));
    float cap = uHc - r * r / (2.0 * uCapR);
    h = mix(h, max(cap, L), uMont);
  }
  float can = 0.0;
  if (uCan > 0.0) {
    can = canionFrac(p);
    h -= uCan * can;
    // leito do rio escavado no fundo
    h -= uCan / 1600.0 * 5.0 * smoothstep(0.97, 1.0, can) * (1.0 - smoothstep(8.0, 20.0, abs(p.y - zRio(p.x))));
  }
  float gM = 0.0;
  if (uGelo > 0.0) {
    float pr = pow(max(0.0, 1.0 - pow(r / 60000.0, 1.333)), 0.375);
    float ice = uHc * pr + uParede * paredeGelo(p);
    gM = uGelo * step(h, ice + 0.02);
    h = mix(h, max(h, ice), uGelo);
    h -= gM * 1.6 * smoothstep(3.0, 8.0, r) * (1.0 - smoothstep(60.0, 150.0, r)) * fenda(p, r, 0.0);
  }
  float ag = 0.0;
  if (uAgua > 0.01 && h < uAguaNivel) { ag = uAguaNivel - h; h = uAguaNivel; }
  m = vec4(gM, can, ag, bac);
  return h;
}
`;

const VS = `
#include <common>
#include <shadowmap_pars_vertex>
${COMUM}
varying vec3 vW; varying vec3 vN; varying vec4 vM; varying float vH; varying float vDbg;
void main(){
  vec2 p = position.xz;
  vDbg = uGelo + uCan / 2000.0;
  float r = length(p);
  vec4 m, m1, m2;
  float h = alturaTerra(p, m);
  float e = max(0.06, r * 0.006);
  float hx = alturaTerra(p + vec2(e, 0.0), m1), hz = alturaTerra(p + vec2(0.0, e), m2);
  vN = normalize(vec3(h - hx, e, h - hz));
  vM = m; vH = h;
  vec3 w = vec3(p.x, h - r * r / 12742000.0, p.y);
  vW = w;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
  vec4 worldPosition = vec4(w, 1.0);
  vec3 transformedNormal = normalize(mat3(viewMatrix) * vN);
  #include <shadowmap_vertex>
}`;

const FS = `
#include <common>
#include <packing>
#include <shadowmap_pars_fragment>
${COMUM}
uniform sampler2D tGramaD, tGramaN, tNeveD, tNeveN, tRochaD, tRochaN, tFalD, tFalN, tAreiaD, tAreiaN, tSecoD, tSecoN, tCinzaD, tCinzaN;
uniform vec3 uSol; uniform vec3 uSolCor; uniform vec3 uAmbCeu; uniform vec3 uAmbChao; uniform vec3 uCeuCor;
uniform float uGrama, uSeca, uAreia, uRocha, uCinza, uMorte, uGeada, uSal, uDegelo, uCamadas, uNeve, uRochaLinha, uSoprada, uPoeira;
uniform float uSombra, uVento; uniform vec3 uCorAgua;
uniform vec3 uNevCor; uniform float uNevDens, uNevMax, uNevDe; uniform float uExpo;
varying vec3 vW; varying vec3 vN; varying vec4 vM; varying float vH; varying float vDbg;

vec3 dif2(sampler2D s, vec2 uv){ return texture2D(s, uv).rgb * 0.62 + texture2D(s, uv * 0.173 + 0.37).rgb * 0.38; }
vec3 nor2(sampler2D s, vec2 uv){ vec3 a = texture2D(s, uv).xyz * 2.0 - 1.0; vec3 b = texture2D(s, uv * 0.173 + 0.37).xyz * 2.0 - 1.0; return normalize(vec3(a.xy + b.xy * 0.6, a.z * b.z)); }
// transicao salpicada: o novo material entra em manchas, nao como um degrade uniforme
float salpica(float prog, float n){ return smoothstep(n - 0.12, n + 0.12, prog * 1.3 - 0.15); }
float bandaPaleta(float i){ return fract(sin(i * 91.17 + 3.1) * 43758.55); }
vec3 estrato(float y, float x){
  float yy = y + 22.0 * gn(vec2(x / 500.0, 1.3)) + 6.0 * gn(vec2(x / 90.0, 5.1));
  float esp = mix(70.0, 34.0, uCamadas);
  float k = floor(yy / esp), f = fract(yy / esp);
  float a = bandaPaleta(k);
  vec3 verm = pow(vec3(150.0, 60.0, 38.0) / 255.0, vec3(2.2)), marrom = pow(vec3(104.0, 60.0, 40.0) / 255.0, vec3(2.2)), creme = pow(vec3(200.0, 165.0, 122.0) / 255.0, vec3(2.2)), ocre = pow(vec3(168.0, 96.0, 50.0) / 255.0, vec3(2.2));
  vec3 c = a < 0.34 ? verm : a < 0.6 ? marrom : a < 0.84 ? ocre : creme;
  c *= 0.8 + 0.3 * smoothstep(0.0, 0.2, f) - 0.45 * smoothstep(0.88, 1.0, f) - 0.15 * smoothstep(0.45, 0.5, f) * (1.0 - smoothstep(0.5, 0.55, f));   // juntas escuras entre camadas
  float prof = clamp(-y / 1600.0, 0.0, 1.0);
  return c * mix(1.0, mix(0.8, 0.35, uCamadas), prof);
}
void main(){
  vec3 p = vW; vec2 xz = p.xz;
  float r = length(xz);
  vec3 Ng = normalize(vN);
  float dist = length(p - cameraPosition);
  vec3 V = (cameraPosition - p) / max(dist, 1e-3);
  // base TBN do mapeamento planar (xz)
  vec3 T = normalize(vec3(1.0, 0.0, 0.0) - Ng * Ng.x), B = cross(T, Ng);
  vec3 alb = vec3(0.0); vec3 nt = vec3(0.0); float ws = 0.0; float esp = 0.0; float brilho = 0.0;
  float ruido = fbm3(xz / 9.0) * 0.5 + 0.5;
  float macro = fbm3(xz / 140.0) * 0.5 + 0.5;
  // ----- chao comum -----
  vec2 uvG = xz / 3.2;
  float wSeca = salpica(uSeca, ruido * 0.6 + macro * 0.4);
  float wAreia = salpica(uAreia, ruido * 0.5 + macro * 0.5);
  float wRocha = salpica(uRocha, ruido * 0.5 + macro * 0.5);
  float wCinza = uCinza;
  float wGrama = (1.0 - wAreia) * (1.0 - wRocha) * (1.0 - wCinza);
  wAreia *= (1.0 - wRocha) * (1.0 - wCinza);
  wRocha *= (1.0 - wCinza);
  if (wGrama > 0.001) {
    vec3 g = dif2(tGramaD, uvG);
    { float l = dot(g, vec3(0.3, 0.59, 0.11));   // mesma recoloracao do gramado da Rua (costura em 116-117)
      g = mix(g, uGramaCor * clamp(0.35 + l * 2.6, 0.4, 1.7) * (0.8 + 0.4 * macro), 0.82); }
    g = mix(g, vec3(dot(g, vec3(0.3, 0.6, 0.1))) * vec3(1.45, 1.2, 0.62), wSeca * 0.85);  // grama amarelando
    g = mix(g, mix(vec3(0.62, 0.66, 0.62), vec3(0.85, 0.88, 0.9), ruido), uGeada * smoothstep(0.2, 0.8, ruido + uGeada * 0.6));  // geada
    alb += g * wGrama; nt += nor2(tGramaN, uvG) * wGrama; ws += wGrama;
  }
  if (wAreia > 0.001) {
    vec2 uv = xz / 7.0;
    vec3 a0 = dif2(tAreiaD, uv); vec3 a = vec3(0.62, 0.36, 0.13) * (dot(a0, vec3(0.33)) / 0.22) * (0.88 + 0.24 * macro);
    alb += a * wAreia; nt += nor2(tAreiaN, uv) * wAreia; ws += wAreia;
  }
  if (wRocha > 0.001) {
    vec2 uv = xz / 4.5;
    vec3 a = dif2(tSecoD, uv) * mix(vec3(0.95, 0.78, 0.66), vec3(0.62, 0.45, 0.36), uMorte) * (0.85 + 0.3 * macro);
    alb += a * wRocha; nt += nor2(tSecoN, uv) * wRocha; ws += wRocha;
  }
  if (wCinza > 0.001) {
    vec2 uv = xz / 4.0;
    vec3 a = dif2(tCinzaD, uv) * vec3(1.25, 1.27, 1.3);
    alb += a * wCinza; nt += nor2(tCinzaN, uv) * wCinza; ws += wCinza;
  }
  alb /= max(ws, 1e-3); nt = normalize(nt + vec3(0.0, 0.0, 0.001));
  // ----- salinas (fundo da bacia) -----
  if (uSal > 0.001 && vM.w > 0.01) {
    float s = uSal * smoothstep(0.2, 0.8, vM.w);
    vec3 sal = dif2(tCinzaD, xz / 6.0) * vec3(2.3, 2.25, 2.15);
    alb = mix(alb, sal, s);
  }
  // ----- cordilheira: grama embaixo, rocha acima da linha / nas encostas, neve no alto e no plano -----
  if (uMont > 0.001) {
    float n = gn(xz / 180.0) * 120.0 + gn(xz / 37.0) * 35.0;
    float incl = Ng.y;
    float wR = uMont * max(smoothstep(uRochaLinha - 150.0, uRochaLinha + 150.0, vH + n), (1.0 - smoothstep(0.62, 0.82, incl)) * smoothstep(250.0, 600.0, vH));
    vec2 uvR = xz / 9.0;
    vec3 rocha = dif2(tRochaD, uvR) * vec3(0.95, 0.95, 1.0) * (0.75 + 0.4 * macro);
    alb = mix(alb, rocha, wR); nt = normalize(mix(nt, nor2(tRochaN, uvR), wR));
    float wN = uMont * smoothstep(uNeve - 120.0, uNeve + 120.0, vH + n * 1.4) * smoothstep(0.45, 0.72, incl);
    vec2 uvN = xz / 5.0;
    vec3 neve = dif2(tNeveD, uvN) * vec3(1.02, 1.03, 1.08);
    alb = mix(alb, neve, wN); nt = normalize(mix(nt, nor2(tNeveN, uvN), wN)); esp = max(esp, wN * 0.25);
  }
  // ----- paredao do canion: estratos com textura de falesia mapeada na vertical -----
  float paredeC = 0.0, fundoC = 0.0, rioC = 0.0;
  if (uCan > 0.5 && vM.y > 0.0004) {
    float c = vM.y;
    paredeC = smoothstep(0.0004, 0.003, c) * (1.0 - smoothstep(0.975, 0.995, c));
    fundoC = smoothstep(0.975, 0.995, c);
    // estratos na vertical (projecao biplanar pelo lado dominante da normal real)
    vec2 uvF = (abs(Ng.x) > abs(Ng.z) ? vec2(xz.y, p.y) : vec2(xz.x, p.y)) / 13.0;
    vec3 fal = texture2D(tFalD, uvF).rgb;
    vec3 est = estrato(p.y, xz.x + xz.y * 0.3) * (0.72 + 0.56 * dot(fal, vec3(0.33)) / 0.45);
    // topo das bancadas e dos degraus: poeira clara e mato seco (le a profundidade: camadas de luz e sombra)
    float banco = smoothstep(0.72, 0.9, Ng.y) * paredeC * smoothstep(0.02, 0.06, c);
    // degraus da borda perto: rocha quebrada com cascalho (nao poeira lisa)
    float degrau = paredeC * (1.0 - smoothstep(0.01, 0.03, c));
    vec3 rochaD = dif2(tRochaD, xz / 2.2) * pow(vec3(170.0, 112.0, 82.0) / 255.0, vec3(2.2)) * 2.2;
    vec3 poeiraB = mix(est * 1.35, pow(vec3(150.0, 128.0, 92.0) / 255.0, vec3(2.2)), 0.45) * (0.85 + 0.3 * ruido);
    alb = mix(alb, est, paredeC);
    alb = mix(alb, poeiraB, banco * 0.75);
    alb = mix(alb, rochaD, degrau);
    // fundo: cascalho escuro; rio estreito brilhando
    alb = mix(alb, vec3(0.05, 0.042, 0.036) * (0.8 + 0.4 * ruido), fundoC);
    rioC = fundoC * (1.0 - smoothstep(7.0, 13.0, abs(xz.y - zRio(xz.x))));
    // normal de detalhe da falesia sobre a normal REAL do relevo (contrafortes e ravinas fazem luz e sombra)
    vec3 nF = texture2D(tFalN, uvF).xyz * 2.0 - 1.0;
    vec3 tW = normalize(cross(vec3(0.0, 1.0, 0.0), Ng) + vec3(1e-4, 0.0, 0.0)), bW = cross(Ng, tW);
    Ng = normalize(mix(Ng, normalize(tW * nF.x * 0.8 + bW * nF.y * 0.8 + Ng * nF.z), paredeC * (1.0 - banco)));
    nt = normalize(mix(nt, vec3(0.0, 0.0, 1.0), max(paredeC, fundoC)));
  }
  vec3 N = normalize(T * nt.x + B * nt.y + Ng * nt.z);
  // ----- lencol de gelo: neve compactada branco-azulada, fendas azul-escuras, neve soprada -----
  float fendaV = 0.0;
  if (vM.x > 0.001) {
    vec2 uvI = xz / 6.0;
    vec3 g0 = dif2(tNeveD, uvI); vec3 gelo = vec3(0.80, 0.88, 0.97) * (0.82 + 0.3 * dot(g0, vec3(0.33)) / 0.75) * (0.94 + 0.08 * macro);
    vec3 nI = nor2(tNeveN, uvI);
    float aa = fwidth(r) * 1.5;
    fendaV = fenda(xz, r, aa);
    float borda = fenda(xz, r, aa + 0.9 + r * 0.004) - fendaV;
    vec3 azul = mix(vec3(0.05, 0.22, 0.48), vec3(0.18, 0.46, 0.72), smoothstep(0.0, 1.0, 1.0 - fendaV) + 0.25 * gn(xz / 3.0));
    vec3 ag = mix(gelo, vec3(0.62, 0.8, 0.95), borda * 0.6);
    ag = mix(ag, azul, fendaV);
    // parede de gelo: face mais azul (subsuperficie)
    ag = mix(ag, vec3(0.3, 0.55, 0.82), (1.0 - smoothstep(0.55, 0.9, Ng.y)) * 0.85);
    alb = mix(alb, ag, vM.x);
    N = normalize(mix(N, normalize(T * nI.x * 0.6 + B * nI.y * 0.6 + Ng * nI.z), vM.x));
    esp = max(esp, vM.x * (0.35 - fendaV * 0.3));
  }
  // ----- luz -----
  vec3 L = normalize(uSol);
  float sombra = 1.0;
  if (uSombra > 0.001) {
    vec2 q = xz / 2200.0 + vec2(uT * 0.055, uT * 0.03) * uVento;
    float c = fbm5(q);
    sombra = 1.0 - uSombra * 0.55 * smoothstep(-0.05, 0.35, c);
  }
  // sombra das arvores (luz direcional do Ceu com mapa de sombra)
  #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
  { DirectionalLightShadow ds = directionalLightShadows[0];
    sombra *= getShadow(directionalShadowMap[0], ds.shadowMapSize, ds.shadowIntensity, ds.shadowBias, ds.shadowRadius, vDirectionalShadowCoord[0]); }
  #endif
  float ndl = max(dot(N, L), 0.0);
  vec3 irr = uSolCor * ndl * sombra + mix(uAmbChao, uAmbCeu, 0.5 + 0.5 * N.y) * mix(1.0, 0.3 + 0.3 * (1.0 - vM.y), paredeC + fundoC);
  vec3 col = alb * irr / PI;
  // subsuperficie falsa do gelo: luz que atravessa as bordas das fendas
  if (vM.x > 0.001) col += vM.x * vec3(0.05, 0.16, 0.3) * fendaV * (uSolCor * 0.25 + uAmbCeu) / PI;
  // especular (gelo, neve molhada)
  if (esp > 0.0) {
    vec3 H = normalize(L + V);
    float fr = 0.04 + 0.96 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
    col += esp * (uSolCor * pow(max(dot(N, H), 0.0), 80.0) * 0.6 * sombra + uCeuCor * fr * 0.5);
  }
  // ----- agua (lago, degelo, mar no horizonte) -----
  if (vM.z > 0.0 && uAgua > 0.01) {
    vec3 Nw = normalize(vec3(gn(xz / 3.0 + uT * 0.4) * 0.04, 1.0, gn(xz / 3.7 - uT * 0.3) * 0.04));
    float fr = 0.03 + 0.97 * pow(1.0 - max(dot(Nw, V), 0.0), 5.0);
    vec3 fundo = uCorAgua * (uAmbCeu + uSolCor * 0.5) / PI * 2.4;
    vec3 w = mix(fundo, uCeuCor * vec3(0.7, 0.85, 1.15), fr * (uDegelo > 0.01 ? 0.5 : 0.22));
    w += uSolCor * pow(max(dot(reflect(-V, Nw), L), 0.0), 300.0) * 0.8;
    // degelo: placas de gelo boiando nas antigas fendas
    if (uDegelo > 0.01) { float pl = 1.0 - smoothstep(0.0, 0.25, abs(campoFenda(xz))); w = mix(w, vec3(0.9, 0.95, 1.0) * (uAmbCeu + uSolCor) / PI * 0.8, pl * 0.7); }
    col = mix(col, w, uAgua * smoothstep(0.0, 0.3, vM.z));
  }
  // ----- neve soprada / poeira: veus correndo rente ao chao em direcao a camera -----
  if (uSoprada > 0.01 || uPoeira > 0.01) {
    float s = fbm3(vec2(xz.x / 6.0, xz.y / 40.0 - uT * 1.1)) * 0.5 + 0.5;
    s *= fbm3(vec2(xz.x / 25.0 + uT * 0.3, xz.y / 90.0 - uT * 0.5)) * 0.5 + 0.5;
    s = smoothstep(0.25, 0.6, s) * (1.0 - smoothstep(30.0, 400.0, dist));
    col = mix(col, vec3(0.95, 0.97, 1.0) * (uAmbCeu + uSolCor * 0.6) / PI, s * 0.45 * uSoprada);
    col = mix(col, vec3(0.8, 0.6, 0.45) * (uAmbCeu + uSolCor * 0.6) / PI, s * 0.3 * uPoeira);
  }
  if (rioC > 0.001) {
    vec3 R = reflect(-V, vec3(0.0, 1.0, 0.0));
    vec3 agua = uCeuCor * 0.75 + uSolCor * pow(max(dot(R, L), 0.0), 60.0) * 0.6;
    col = mix(col, agua, rioC);
  }
  col *= uExpo;
  // nevoa crescendo com a distancia e com a profundidade do abismo
  if (uCan > 0.5) {
    float fz = (1.0 - exp(-dist * 0.00022)) * (0.04 + 0.22 * smoothstep(-30.0, -1500.0, p.y));
    col = mix(col, uNevCor * 0.92, fz);
  }
  // ----- perspectiva aerea alem do alcance da nevoa do Look (que para em ~10 km de profundidade) -----
  if (dist > uNevDe) {
    float f = (1.0 - exp(-uNevDens * dist)) * uNevMax * (vM.z > 0.0 && uAgua > 0.01 ? 0.6 : 1.0);
    float sl = pow(max(dot(-V, L), 0.0), 6.0);
    vec3 nc = uNevCor * (1.0 + sl * 0.5);
    col = mix(col, nc, f);
  }
  gl_FragColor = vec4(col, 1.0);
  #ifdef DBG
  gl_FragColor = vec4(step(0.001, vM.z), vM.w, clamp(vH / 150.0, 0.0, 1.0), 1.0);
  #endif
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// malha polar: anel 0 no centro, raios em progressao geometrica ate 150 km
const malhaPolar = (aneis = 560, setores = 1024, r0 = 0.3, rMax = 150000) => {
  const k = Math.pow(rMax / r0, 1 / (aneis - 2));
  const pos = new Float32Array((1 + (aneis - 1) * setores) * 3);
  let o = 3;
  for (let i = 1; i < aneis; i++) {
    const r = r0 * Math.pow(k, i - 1);
    for (let j = 0; j < setores; j++) {
      const a = (j / setores) * Math.PI * 2 + (i % 2) * (Math.PI / setores);
      pos[o++] = Math.cos(a) * r; pos[o++] = 0; pos[o++] = Math.sin(a) * r;
    }
  }
  const idx = new Uint32Array(setores * 3 + (aneis - 2) * setores * 6);
  let q = 0;
  for (let j = 0; j < setores; j++) { idx[q++] = 0; idx[q++] = 1 + ((j + 1) % setores); idx[q++] = 1 + j; }
  for (let i = 1; i < aneis - 1; i++) {
    const a0 = 1 + (i - 1) * setores, b0 = 1 + i * setores;
    for (let j = 0; j < setores; j++) {
      const j1 = (j + 1) % setores;
      idx[q++] = a0 + j; idx[q++] = a0 + j1; idx[q++] = b0 + j;
      idx[q++] = a0 + j1; idx[q++] = b0 + j1; idx[q++] = b0 + j;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), rMax);
  return g;
};

const TEX = ['sparse_grass', 'snow_02', 'rock_wall_02', 'cliff_side', 'aerial_sand', 'cracked_red_ground', 'dry_ground_01'];
const UNIF = ['tGrama', 'tNeve', 'tRocha', 'tFal', 'tAreia', 'tSeco', 'tCinza'];

export type NevoaTerra = {cor: THREE.Color; densidade: number; max: number; de: number};

export const ChaoTerra: React.FC<{e: EstadoTerra; luz: LuzTempo; nevoa: NevoaTerra; ceuCor: THREE.Color; gramaCor: THREE.Color; expo?: number}> = ({e, luz, nevoa, ceuCor, gramaCor, expo = 1}) => {
  const arqs = useMemo(() => TEX.flatMap((n) => [staticFile(`terra/${n}_diff_2k.jpg`), staticFile(`terra/${n}_nor_gl_2k.jpg`)]), []);
  const tex = useTexture(arqs) as THREE.Texture[];
  const geo = useMemo(() => malhaPolar(), []);
  const mat = useMemo(() => {
    const u: Record<string, THREE.IUniform> = {};
    tex.forEach((x, i) => {
      x.wrapS = x.wrapT = THREE.RepeatWrapping; x.anisotropy = 8;
      x.colorSpace = i % 2 === 0 ? THREE.SRGBColorSpace : THREE.NoColorSpace; x.needsUpdate = true;
      u[UNIF[i >> 1] + (i % 2 === 0 ? 'D' : 'N')] = {value: x};
    });
    for (const k of ['uT', 'uHc', 'uGelo', 'uParede', 'uFluxo', 'uCan', 'uMont', 'uEros', 'uCapR', 'uColinas', 'uDunas', 'uMorro', 'uAgua', 'uAguaNivel',
      'uBaciaR', 'uBaciaProf', 'uOasis', 'uBase', 'uFendaPe', 'uEscF', 'uGrama', 'uSeca', 'uAreia', 'uRocha', 'uCinza', 'uMorte', 'uGeada', 'uSal', 'uDegelo', 'uCamadas', 'uNeve',
      'uRochaLinha', 'uSoprada', 'uPoeira', 'uSombra', 'uVento', 'uNevDens', 'uNevMax', 'uNevDe', 'uExpo']) u[k] = {value: 0};
    for (const k of ['uGramaCor', 'uSol', 'uSolCor', 'uAmbCeu', 'uAmbChao', 'uCeuCor', 'uCorAgua', 'uNevCor']) u[k] = {value: new THREE.Vector3()};
    return new THREE.ShaderMaterial({vertexShader: VS, fragmentShader: FS, uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.lights), u), lights: true, extensions: {derivatives: true} as any, defines: TERRA_DBG ? {DBG: 1} : {}});
  }, [tex]);
  const u = mat.uniforms;
  const set = (k: string, v: number) => { u[k].value = v; };
  // 116-117: a Rua ainda desenha o chao dela por cima (gramado dela em -0,06; o meu fica em -0,14)
  set('uT', e.t); set('uHc', e.hc - (e.t < 117.05 ? 0.14 : 0)); set('uGelo', e.gelo); set('uParede', e.parede); set('uFluxo', e.fluxo); set('uCan', e.canion);
  set('uMont', e.mont); set('uEros', e.eros); set('uCapR', e.capR); set('uColinas', e.colinas); set('uDunas', e.dunas); set('uMorro', e.morro);
  set('uAgua', e.agua); set('uAguaNivel', e.aguaNivel); set('uBaciaR', e.baciaR); set('uBaciaProf', e.baciaProf); set('uOasis', e.oasis); set('uBase', e.base - (e.t < 117.05 ? 0.14 : 0)); set('uFendaPe', e.fendaPe); set('uEscF', 1);
  (u.uGramaCor.value as THREE.Vector3).set(gramaCor.r, gramaCor.g, gramaCor.b);
  set('uGrama', e.grama); set('uSeca', e.seca); set('uAreia', e.areia); set('uRocha', e.rocha); set('uCinza', e.cinza); set('uMorte', e.morte);
  set('uGeada', e.geada); set('uSal', e.sal); set('uDegelo', e.degelo); set('uCamadas', e.camadas); set('uNeve', e.neve); set('uRochaLinha', e.rochaLinha);
  set('uSoprada', e.soprada); set('uPoeira', e.poeira); set('uSombra', e.sombraNuvem); set('uVento', e.ventoNuvem);
  set('uNevDens', nevoa.densidade); set('uNevMax', nevoa.max); set('uNevDe', nevoa.de); set('uExpo', expo);
  (u.uSol.value as THREE.Vector3).copy(luz.sol).normalize();
  const cs = luz.corSol.clone().multiplyScalar(luz.intensidade);
  (u.uSolCor.value as THREE.Vector3).set(cs.r, cs.g, cs.b);
  const am = luz.ambiente.clone().multiplyScalar(luz.ambienteForca);
  (u.uAmbCeu.value as THREE.Vector3).set(am.r, am.g, am.b);
  (u.uAmbChao.value as THREE.Vector3).set(am.r * 0.45, am.g * 0.42, am.b * 0.36);
  (u.uCeuCor.value as THREE.Vector3).set(ceuCor.r, ceuCor.g, ceuCor.b);
  (u.uCorAgua.value as THREE.Vector3).set(...e.corAgua);
  (u.uNevCor.value as THREE.Vector3).set(nevoa.cor.r, nevoa.cor.g, nevoa.cor.b);
  return <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={-2} receiveShadow />;
};
