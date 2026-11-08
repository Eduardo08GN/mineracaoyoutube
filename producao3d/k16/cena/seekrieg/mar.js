// O mar da assinatura nova: um plano que segue a câmera, ondas Gerstner (3 ondas, coordenadas de mundo, então o plano anda e
// as ondas ficam), 2 tons chapados (cava escura, crista clara), listras de espuma correndo contra o movimento do navio e,
// opcional, cor por profundidade (3 faixas: fundo, raso, banco) a partir do PNG do EMODnet. Nada de reflexo/refração.
// ondaY(x, z, t) é a MESMA fórmula em JS: o navio sobe e desce com a água, nunca descola.
import * as THREE from 'three';

// [direção (graus), comprimento de onda (m), amplitude (m), inclinação Q]
const ONDAS = [[200, 60, 1.0, 0.55], [235, 31, 0.45, 0.6], [170, 17, 0.22, 0.5]];
const G = 9.8;
const prep = (amp) => ONDAS.map(([dg, L, A, Q]) => {
  const k = (2 * Math.PI) / L;
  return {dx: Math.cos(dg * Math.PI / 180), dz: Math.sin(dg * Math.PI / 180), k, c: Math.sqrt(G / k), A: A * amp, Q};
});

export function ondaY(x, z, t, amp = 1) {
  let y = 0;
  for (const w of prep(amp)) y += w.A * Math.sin(w.k * (w.dx * x + w.dz * z - w.c * t));
  return y;
}
// inclinação local (para o balanço do navio): derivadas da altura em x e z
export function ondaInclina(x, z, t, amp = 1) {
  let gx = 0, gz = 0;
  for (const w of prep(amp)) {
    const f = Math.cos(w.k * (w.dx * x + w.dz * z - w.c * t)) * w.A * w.k;
    gx += f * w.dx; gz += f * w.dz;
  }
  return {gx, gz};
}

export function buildMar({tamanho = 6000, seg = 384} = {}) {
  const geo = new THREE.PlaneGeometry(tamanho, tamanho, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const U = {
    uT: {value: 0}, uAmp: {value: 1}, uRun: {value: 0},
    uCava: {value: new THREE.Color('#26313a')}, uCrista: {value: new THREE.Color('#46545e')}, uEspuma: {value: new THREE.Color('#8f9ba3')},
    uEspAmt: {value: 0.35},
    uProf: {value: null}, uUsaProf: {value: 0}, uProfBox: {value: new THREE.Vector4(0, 0, 1, 1)},   // xmin, zmin, largura, altura (m)
    uFundo: {value: new THREE.Color('#2c3640')}, uRaso: {value: new THREE.Color('#5d6f78')}, uBanco: {value: new THREE.Color('#b9a98a')},
    uCalado: {value: 8.4},   // profundidade (m) que separa "fundo" de "raso" para o navio da história
  };
  const W = prep(1);
  const mat = new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 0.95, metalness: 0.0, envMapIntensity: 0.12});   // quase sem reflexo: o branco de céu na água virava neve (batedor 1)
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    const ondasGLSL = W.map((w, i) => `ondas[${i}] = vec4(${w.dx.toFixed(5)}, ${w.dz.toFixed(5)}, ${w.k.toFixed(5)}, ${w.c.toFixed(5)}); ampq[${i}] = vec2(${ONDAS[i][2].toFixed(4)}, ${ONDAS[i][3].toFixed(3)});`).join('\n');
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
uniform float uT; uniform float uAmp; varying vec3 vMundo; varying float vAlt;
void gerstner(vec2 p, out vec3 d, out vec3 n){
  vec4 ondas[3]; vec2 ampq[3];
  ${ondasGLSL}
  d = vec3(0.0); vec3 tx = vec3(1.0, 0.0, 0.0); vec3 tz = vec3(0.0, 0.0, 1.0);
  for (int i = 0; i < 3; i++){
    vec2 dir = ondas[i].xy; float k = ondas[i].z; float c = ondas[i].w; float A = ampq[i].x * uAmp; float Q = ampq[i].y;
    float f = k * (dot(dir, p) - c * uT); float co = cos(f), si = sin(f);
    d += vec3(Q * A * dir.x * co, A * si, Q * A * dir.y * co);
    tx += vec3(-Q * A * k * dir.x * dir.x * si, A * k * dir.x * co, -Q * A * k * dir.x * dir.y * si);
    tz += vec3(-Q * A * k * dir.x * dir.y * si, A * k * dir.y * co, -Q * A * k * dir.y * dir.y * si);
  }
  n = normalize(cross(tz, tx));
}`)
      .replace('#include <beginnormal_vertex>', `vec3 gD, gN; vec4 mw0 = modelMatrix * vec4(position, 1.0); gerstner(mw0.xz, gD, gN);
vec3 objectNormal = gN;
#ifdef USE_TANGENT
vec3 objectTangent = vec3(tangent.xyz);
#endif`)
      .replace('#include <begin_vertex>', `vec3 transformed = position + gD; vMundo = (modelMatrix * vec4(transformed, 1.0)).xyz; vAlt = gD.y;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
uniform float uRun; uniform vec3 uCava; uniform vec3 uCrista; uniform vec3 uEspuma; uniform float uEspAmt; uniform float uAmp;
uniform sampler2D uProf; uniform float uUsaProf; uniform vec4 uProfBox; uniform vec3 uFundo; uniform vec3 uRaso; uniform vec3 uBanco; uniform float uCalado;
varying vec3 vMundo; varying float vAlt;
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++){ s += a * n2(p); p *= 2.03; a *= 0.5; } return s; }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
float crista = smoothstep(-0.6, 1.2, vAlt / max(uAmp, 0.05));
vec3 agua = mix(uCava, uCrista, crista);
if (uUsaProf > 0.5) {
  vec2 uv = (vMundo.xz - uProfBox.xy) / uProfBox.zw;
  float prof = texture2D(uProf, clamp(uv, 0.0, 1.0)).r * 40.0;   // PNG normalizado: 0..1 = 0..40 m
  vec3 c = prof < 0.3 ? uBanco : (prof < uCalado ? uRaso : uFundo);
  agua = mix(c, uCrista, crista * 0.25);
}
// listras de espuma: ruído esticado no sentido do fluxo (x), correndo contra o navio (uRun); só nas cristas
vec2 q = vec2((vMundo.x + uRun) * 0.012, vMundo.z * 0.09);
float esp = smoothstep(0.62, 0.8, fbm(q) * (0.6 + 0.8 * crista)) * uEspAmt;
diffuseColor.rgb = mix(agua, uEspuma, esp);`);
    mat.userData.shader = sh;
  };
  const mar = new THREE.Mesh(geo, mat);
  mar.receiveShadow = true;
  mar.frustumCulled = false;
  // segue a câmera em passos da malha (as ondas usam coordenada de mundo, então não "andam" com o plano)
  const passo = tamanho / seg;
  const seguir = (cam) => mar.position.set(Math.round(cam.position.x / passo) * passo, 0, Math.round(cam.position.z / passo) * passo);
  const set = ({t = 0, amp = 1, run = 0, espuma = 0.35, prof = null, profBox = null, calado = 8.4} = {}) => {
    U.uT.value = t; U.uAmp.value = amp; U.uRun.value = run; U.uEspAmt.value = espuma; U.uCalado.value = calado;
    if (prof) { U.uProf.value = prof; U.uUsaProf.value = 1; U.uProfBox.value.set(...profBox); } else U.uUsaProf.value = 0;
  };
  return {mar, set, seguir, U};
}
