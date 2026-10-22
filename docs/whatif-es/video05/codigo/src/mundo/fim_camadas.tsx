// Camadas do Fim no plano do ceu: nevoa/faixa da galaxia, estrelas (vivas, mortas, reveladas), galaxias do campo,
// sprites de brilho, Sol morto em graos e o flash final. Tudo funcao de t (uniforms), sem acumulacao.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {rnd, smooth} from './comum';
import {ASP, COLISAO, DIST, SOL_C, SOL_R, TREF, U, brilhos, chaves, flashColisao, quadro} from './fim_comum';
import {galaxiasCampo} from './cosmos';
import {RUIDO} from './fim_glsl';

const usePx = () => {
  const {gl} = useThree();
  return gl.getDrawingBufferSize(new THREE.Vector2()).y / 1080;
};
const aditivo = {transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending};

// ---------------- ceu: faixa da Via Lactea, manchas avermelhadas, restos acobreados, halo da colisao ----------------
const CEU_FRAG = /* glsl */ `
uniform float uT, uFlash, uVia, uHaze, uCobre;
uniform vec3 uViaCor;
uniform vec2 uCol;
varying vec2 vP;
${RUIDO}
void main() {
  vec2 p = vP;
  float dr = (uT - 345.0) * 0.004;
  vec3 c = vec3(0.0);
  // faixa da galaxia no canto superior direito
  vec2 a = vec2(0.444, 1.25), b = vec2(2.222, 0.05);   // mesma faixa do Cosmos (faixaViaLactea)
  vec2 ab = normalize(b - a), nr = vec2(-ab.y, ab.x);
  float s = dot(p - a, ab), d = dot(p - a, nr);
  float n = fbm2(vec2(s * 2.0 + dr, d * 5.0));
  float m = fbm2(vec2(s * 4.5 - dr, d * 11.0) + 7.0);
  float banda = exp(-d * d / 0.05) * (0.35 + 1.0 * n);
  float poeira = 1.0 - 0.8 * smoothstep(0.42, 0.72, m) * exp(-pow((d + 0.04) / 0.13, 2.0));
  float grao = pow(n2(p * 230.0 + 3.0), 12.0) * 2.2 * exp(-d * d / 0.1);
  c += uViaCor * uVia * (banda * poeira * 0.22 + grao);
  // restos acobreados: fiapos esticados ao longo da faixa
  float fio = fbm2(vec2(s * 1.6 + dr * 3.0, d * 9.0) + 2.0);
  c += vec3(0.62, 0.32, 0.14) * uCobre * pow(smoothstep(0.35, 0.85, fio), 2.0) * exp(-d * d / 0.25) * smoothstep(-0.6, 0.6, p.x);
  // manchas avermelhadas (galaxias desfocadas) 345-357
  float hz = smoothstep(0.5, 0.8, fbm2(p * 2.3 + vec2(3.0 + dr, 1.0))) * smoothstep(0.3, 0.6, fbm2(p * 0.8 + 11.0));
  c += mix(vec3(0.5, 0.18, 0.2), vec3(0.6, 0.36, 0.26), n) * hz * uHaze * 0.2;
  // colisao: halo grande branco-azulado que clareia o ceu
  float r = length(p - uCol);
  c += vec3(0.74, 0.85, 1.0) * uFlash * (2.0 * exp(-r / 0.04) + 0.5 * exp(-r / 0.16) + 0.1 * exp(-r / 0.6));
  c += vec3(0.5, 0.58, 0.75) * uFlash * 0.018;
  gl_FragColor = vec4(c, 1.0);
}`;
const PLANO_VERT = /* glsl */ `uniform float uU; varying vec2 vP; void main() { vP = position.xy / uU; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

export const CeuFim: React.FC<{t: number}> = ({t}) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({vertexShader: PLANO_VERT, fragmentShader: CEU_FRAG, ...aditivo,
    uniforms: {uU: {value: U}, uT: {value: 0}, uFlash: {value: 0}, uVia: {value: 0}, uHaze: {value: 0}, uCobre: {value: 0},
      uViaCor: {value: new THREE.Color()}, uCol: {value: new THREE.Vector2(...COLISAO)}}}), []);
  const geo = useMemo(() => new THREE.PlaneGeometry(2.5 * ASP * U, 3.4 * U), []);
  const u = mat.uniforms;
  u.uT.value = t; u.uFlash.value = flashColisao(t);
  u.uVia.value = chaves([[345, 1], [352, 0.75], [360, 0.5], [375, 0.32], [384.3, 0.2], [385, 0.07], [430, 0.04], [446, 0]], t);
  u.uViaCor.value.setRGB(1.0, 0.86, 0.68).lerp(new THREE.Color(0.75, 0.42, 0.22), smooth(360, 385, t));
  u.uHaze.value = 1 - smooth(346, 357.5, t);
  u.uCobre.value = chaves([[345, 0], [380, 0.08], [384.6, 0.05], [388, 0.12], [409.5, 0.14], [412, 0.3], [418, 0.24], [426, 0.08], [440, 0]], t);
  if (t > 446) return null;
  return <mesh geometry={geo} material={mat} position={[0, 0, -DIST]} renderOrder={1} frustumCulled={false} />;
};

// ---------------- estrelas: vivas (morrem 369-384,3), mortas cinzas (387,5+), reveladas pela colisao ----------------
const EST_VERT = /* glsl */ `
uniform float uT, uPx, uFlash, uDrift;
attribute vec3 aCor; attribute float aB, aTam, aSem, aTipo, aMorte;
varying vec3 vCor; varying float vI;
void main() {
  vec3 p = position; p.x += uDrift;
  float I = 0.0;
  if (aTipo < 0.5) {
    float tw = 1.0 + 0.16 * sin(uT * (2.5 + aSem * 6.0) + aSem * 40.0) + 0.08 * sin(uT * (9.0 + aSem * 7.0) + aSem * 13.0);
    // algumas piscam forte (360-369)
    if (aSem > 0.972) tw *= mix(1.0, 0.15 + 3.2 * pow(0.5 + 0.5 * sin(uT * (1.6 + aSem * 3.0) + aSem * 91.0), 6.0), smoothstep(359.0, 360.5, uT) * (1.0 - smoothstep(368.0, 369.5, uT)));
    float vida = 1.0 - smoothstep(aMorte, aMorte + 0.3, uT);
    float flare = 1.0 + 3.5 * smoothstep(aMorte - 0.7, aMorte, uT) * step(0.6, aB);   // as grandes brilham antes de sumir
    I = aB * tw * vida * flare;
  } else if (aTipo < 1.5) {
    I = aB * smoothstep(387.5, 389.5, uT) * (1.0 + 2.5 * uFlash) * (1.0 - smoothstep(446.0, 461.0, uT)) * (0.8 + 0.2 * sin(uT * 1.3 + aSem * 50.0));
  } else {
    I = aB * (uFlash + 0.2 * smoothstep(401.7, 402.2, uT) * (1.0 - smoothstep(437.0, 452.0, uT))) * (0.8 + 0.2 * sin(uT * 2.1 + aSem * 70.0));
  }
  vI = I; vCor = aCor;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = max(1.2, aTam * uPx * (1.0 + 0.5 * clamp(I - 1.0, 0.0, 4.0)));
  if (I < 0.003) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;
const EST_FRAG = /* glsl */ `
varying vec3 vCor; varying float vI;
void main() {
  float d = length(gl_PointCoord * 2.0 - 1.0);
  float pr = exp(-d * d * 9.0) + 0.12 * exp(-d * 4.0);
  pr *= 1.0 - smoothstep(0.85, 1.0, d);
  gl_FragColor = vec4(vCor * vI * pr, 1.0);
}`;
const corEstrela = (k: number): [number, number, number] =>
  k < 0.15 ? [0.72, 0.82, 1.0] : k < 0.55 ? [1.0, 0.98, 0.94] : k < 0.8 ? [1.0, 0.88, 0.7] : k < 0.95 ? [1.0, 0.72, 0.48] : [1.0, 0.5, 0.35];

export const EstrelasFim: React.FC<{t: number}> = ({t}) => {
  const px = usePx();
  const {geo, mat} = useMemo(() => {
    const NV = 1900, NM = 520, NR = 3400, N = NV + NM + NR;
    const pos = new Float32Array(N * 3), cor = new Float32Array(N * 3), B = new Float32Array(N), tam = new Float32Array(N),
      sem = new Float32Array(N), tipo = new Float32Array(N), morte = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const tp = i < NV ? 0 : i < NV + NM ? 1 : 2;
      const x = (rnd(i * 3 + 1) * 2 - 1) * (ASP + 0.45), y = (rnd(i * 3 + 2) * 2 - 1) * 1.35;
      pos.set([x * U, y * U, -DIST], i * 3);
      const r = rnd(i * 3 + 3), k = rnd(i * 7 + 11);
      let c = corEstrela(k), b = 0, s = 0, m = 0;
      if (tp === 0) {
        const grande = r > 0.965, media = r > 0.8;
        b = grande ? 1.6 + 1.6 * rnd(i + 0.5) : media ? 0.45 + 0.6 * rnd(i + 0.7) : 0.1 + 0.35 * Math.pow(rnd(i + 0.9), 2);
        s = grande ? 5.5 : media ? 3.4 : 2.2 + rnd(i + 1.3);
        m = grande ? 369 + 7 * rnd(i * 5 + 0.3) : media ? 370.5 + 10 * rnd(i * 5 + 0.4) : 371 + 13.2 * Math.pow(rnd(i * 5 + 0.6), 0.7);
      } else if (tp === 1) {
        c = k < 0.5 ? [0.7, 0.7, 0.72] : [0.85, 0.7, 0.55];
        b = 0.05 + 0.1 * Math.pow(r, 2); s = 2.0;
      } else {
        b = 0.06 + 0.32 * Math.pow(r, 3); s = 1.7 + 1.2 * Math.pow(r, 3);
      }
      cor.set(c, i * 3); B[i] = b; tam[i] = s; sem[i] = rnd(i * 13 + 0.77); tipo[i] = tp; morte[i] = m;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aCor', new THREE.BufferAttribute(cor, 3));
    g.setAttribute('aB', new THREE.BufferAttribute(B, 1)); g.setAttribute('aTam', new THREE.BufferAttribute(tam, 1));
    g.setAttribute('aSem', new THREE.BufferAttribute(sem, 1)); g.setAttribute('aTipo', new THREE.BufferAttribute(tipo, 1));
    g.setAttribute('aMorte', new THREE.BufferAttribute(morte, 1));
    const mt = new THREE.ShaderMaterial({vertexShader: EST_VERT, fragmentShader: EST_FRAG, ...aditivo,
      uniforms: {uT: {value: 0}, uPx: {value: 1}, uFlash: {value: 0}, uDrift: {value: 0}}});
    return {geo: g, mat: mt};
  }, []);
  const u = mat.uniforms;
  u.uT.value = t; u.uPx.value = px; u.uFlash.value = flashColisao(t); u.uDrift.value = (t - 345) * 0.0011 * U;
  if (t > 461) return null;
  return <points geometry={geo} material={mat} renderOrder={2} frustumCulled={false} />;
};

// ---------------- galaxias do campo (345-359): continuam as do Cosmos (galaxiasCampo, 337,5-345);
// ficam pequenas e vermelhas e somem uma a uma ----------------
const GAL_VERT = /* glsl */ `
uniform float uT, uPx;
attribute vec3 aCor; attribute float aB, aTam, aAng, aEl, aMorte, aSem;
varying vec3 vCor; varying float vI, vAng, vEl, vSem, vK;
void main() {
  float k = clamp((uT - 345.0) / max(0.1, aMorte - 345.0), 0.0, 1.0);
  vK = k;
  vCor = mix(aCor, vec3(1.0, 0.28, 0.12), smoothstep(0.15, 1.0, k));
  vI = aB * (1.0 - smoothstep(aMorte - 0.25, aMorte + 0.45, uT)) * (1.0 - 0.3 * k);
  vAng = aAng; vEl = aEl; vSem = aSem;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = clamp(aTam * uPx * mix(1.0, 0.35, k), 2.0, 400.0);
  if (vI < 0.003) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;
// mesmo perfil do FRAG_GALAXIA do Cosmos (nucleo + disco + bracos), para a troca em 345 nao saltar
const GAL_FRAG = /* glsl */ `
varying vec3 vCor; varying float vI, vAng, vEl, vSem, vK;
void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0; uv.y = -uv.y;
  float ca = cos(vAng), sa = sin(vAng);
  vec2 p = mat2(ca, sa, -sa, ca) * uv; p.y /= max(0.12, vEl);
  float r = length(p);
  float nucleo = exp(-r * r * 60.0) * 1.6;
  float disco = exp(-r * 4.2);
  float ang = atan(p.y, p.x);
  float bracos = 0.55 + 0.45 * cos(2.0 * ang - log(r + 0.02) * 4.5 + vSem * 6.28);
  float tipo = step(0.5, fract(vSem * 7.0));
  float br = nucleo + disco * mix(1.0, bracos, tipo * 0.9) * 0.55;
  br *= smoothstep(1.0, 0.7, length(uv));
  vec3 c = mix(vCor, mix(vec3(1.0, 0.92, 0.8), vec3(1.0, 0.45, 0.25), vK), clamp(nucleo, 0.0, 1.0));
  gl_FragColor = vec4(c * vI * br, 1.0);
}`;
export const GalaxiasFim: React.FC<{t: number}> = ({t}) => {
  const px = usePx();
  const {geo, mat} = useMemo(() => {
    const G = galaxiasCampo(), N = G.length;
    const qi = quadro(TREF).quat.invert();
    const pos = new Float32Array(N * 3), cor = new Float32Array(N * 3), at = (n: number) => new Float32Array(N * n);
    const B = at(1), tam = at(1), ang = at(1), el = at(1), morte = at(1), sem = at(1);
    G.forEach((g, i) => {
      const d = g.dir.clone().applyQuaternion(qi);
      const k = DIST / Math.max(1e-3, -d.z);
      pos.set([d.x * k, d.y * k, -DIST], i * 3); cor.set(g.cor, i * 3);
      B[i] = g.brilho; tam[i] = 2 * g.raio * 1037; ang[i] = g.angulo; el[i] = g.aspecto; sem[i] = g.fase;
      morte[i] = 346.2 + 12.6 * ((i * 0.6180339 + 0.13) % 1);   // uma a uma, espalhadas de 346 a 359
    });
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); gg.setAttribute('aCor', new THREE.BufferAttribute(cor, 3));
    for (const [n, a] of [['aB', B], ['aTam', tam], ['aAng', ang], ['aEl', el], ['aMorte', morte], ['aSem', sem]] as [string, Float32Array][])
      gg.setAttribute(n, new THREE.BufferAttribute(a, 1));
    const mt = new THREE.ShaderMaterial({vertexShader: GAL_VERT, fragmentShader: GAL_FRAG, ...aditivo, uniforms: {uT: {value: 0}, uPx: {value: 1}}});
    return {geo: gg, mat: mt};
  }, []);
  mat.uniforms.uT.value = t; mat.uniforms.uPx.value = px;
  if (t > 359.5) return null;
  return <points geometry={geo} material={mat} renderOrder={3} frustumCulled={false} />;
};

// ---------------- sprites de brilho (instanciados; lista calculada por quadro em fim_comum.brilhos) ----------------
const MAXB = 64;
const BR_VERT = /* glsl */ `
attribute vec3 aPos; attribute vec2 aEsc; attribute float aRot, aForma; attribute vec3 aCor;
varying vec2 vUv; varying vec3 vCor; varying float vForma;
void main() {
  vUv = position.xy; vCor = aCor; vForma = aForma;
  vec2 o = position.xy * aEsc;
  float c = cos(aRot), s = sin(aRot);
  o = vec2(c * o.x - s * o.y, s * o.x + c * o.y);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(aPos + vec3(o, 0.0), 1.0);
}`;
const BR_FRAG = /* glsl */ `
varying vec2 vUv; varying vec3 vCor; varying float vForma;
void main() {
  float pr;
  if (vForma < 0.5) {
    float r = length(vUv);
    pr = exp(-r * r * 60.0) + 0.22 * exp(-r * 7.0) + 0.05 * exp(-r * 2.8);
    pr *= 1.0 - smoothstep(0.75, 1.0, r);
  } else {
    float x = vUv.x, y = vUv.y;
    float corpo = pow(clamp((x + 1.0) / 1.85, 0.0, 1.0), 2.2) * (1.0 - smoothstep(0.85, 1.0, x));
    pr = corpo * (exp(-y * y * 18.0) + 0.15 * exp(-abs(y) * 3.0) * (1.0 - smoothstep(0.6, 1.0, abs(y))));
  }
  gl_FragColor = vec4(vCor * pr, 1.0);
}`;
export const BrilhosFim: React.FC<{t: number}> = ({t}) => {
  const {geo, mat, at} = useMemo(() => {
    const base = new THREE.PlaneGeometry(2, 2);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index; g.setAttribute('position', base.getAttribute('position'));
    const mk = (n: number) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(MAXB * n), n); a.setUsage(THREE.DynamicDrawUsage); return a; };
    const at = {aPos: mk(3), aEsc: mk(2), aRot: mk(1), aCor: mk(3), aForma: mk(1)};
    for (const [n, a] of Object.entries(at)) g.setAttribute(n, a);
    const mt = new THREE.ShaderMaterial({vertexShader: BR_VERT, fragmentShader: BR_FRAG, ...aditivo});
    return {geo: g, mat: mt, at};
  }, []);
  const L = brilhos(t).slice(0, MAXB);
  L.forEach((b, i) => {
    (at.aPos.array as Float32Array).set([b.x * U, b.y * U, -DIST], i * 3);
    (at.aEsc.array as Float32Array).set([b.sx * U, b.sy * U], i * 2);
    (at.aRot.array as Float32Array)[i] = b.rot; (at.aForma.array as Float32Array)[i] = b.forma;
    (at.aCor.array as Float32Array).set(b.cor, i * 3);
  });
  for (const a of Object.values(at)) a.needsUpdate = true;
  geo.instanceCount = L.length;
  if (!L.length) return null;
  return <mesh geometry={geo} material={mat} renderOrder={8} frustumCulled={false} />;
};

// ---------------- Sol morto (446,3-461,5): bola laranja granulada que se desfaz grao a grao em luz ----------------
const SOL_VERT = /* glsl */ `
uniform float uT, uPx, uR;
attribute vec2 aOff; attribute float aSem, aSolta, aB;
varying vec3 vCor; varying float vI;
void main() {
  float ap = smoothstep(446.3, 447.0, uT);
  float sol = uT - aSolta;
  vec2 dv = normalize(aOff + 0.45 * vec2(sin(aSem * 61.0), cos(aSem * 47.0)) + 1e-3);
  vec2 o = aOff * (0.55 + 0.45 * ap);
  o += 0.018 * vec2(sin(uT * 3.1 + aSem * 30.0), cos(uT * 2.7 + aSem * 20.0));          // fervura
  float fl = 0.0;
  if (sol > 0.0) { o += dv * sol * (0.35 + 0.6 * fract(aSem * 7.3)); fl = exp(-sol * 2.6); }
  float limbo = sqrt(max(0.0, 1.0 - dot(aOff, aOff)));
  float I = aB * (0.3 + 0.7 * limbo) * ap * (0.75 + 0.25 * sin(uT * 5.0 + aSem * 90.0));
  if (sol > 0.0) I = aB * (0.6 + 4.0 * fl) * exp(-sol * 0.9) * (1.0 - smoothstep(1.8, 2.4, sol));
  I *= 1.0 - smoothstep(460.6, 461.5, uT);
  vCor = mix(vec3(1.0, 0.5, 0.18), vec3(1.0, 0.9, 0.7), clamp(fl * 1.4 + 0.25 * limbo, 0.0, 1.0));
  vI = I;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position + vec3(o * uR, 0.0), 1.0);
  gl_PointSize = max(1.3, (2.6 + 2.2 * fl) * uPx);
  if (I < 0.003) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;
export const SolMorto: React.FC<{t: number}> = ({t}) => {
  const px = usePx();
  const {geo, mat} = useMemo(() => {
    const N = 2600;
    const pos = new Float32Array(N * 3), off = new Float32Array(N * 2), sem = new Float32Array(N), solta = new Float32Array(N), B = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const r = Math.sqrt(rnd(i * 5 + 0.1)), a = rnd(i * 5 + 0.2) * Math.PI * 2;
      off.set([r * Math.cos(a), r * Math.sin(a)], i * 2);
      pos.set([SOL_C[0] * U, SOL_C[1] * U, -DIST], i * 3);
      sem[i] = rnd(i * 5 + 0.3);
      solta[i] = 452 + 7.8 * Math.min(1, Math.pow(rnd(i * 5 + 0.4), 0.75) * 0.85 + (1 - r) * 0.15);
      B[i] = 0.35 + 0.9 * Math.pow(rnd(i * 5 + 0.5), 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aOff', new THREE.BufferAttribute(off, 2));
    g.setAttribute('aSem', new THREE.BufferAttribute(sem, 1)); g.setAttribute('aSolta', new THREE.BufferAttribute(solta, 1));
    g.setAttribute('aB', new THREE.BufferAttribute(B, 1));
    const mt = new THREE.ShaderMaterial({vertexShader: SOL_VERT, fragmentShader: EST_FRAG, ...aditivo,
      uniforms: {uT: {value: 0}, uPx: {value: 1}, uR: {value: SOL_R * U}}});
    return {geo: g, mat: mt};
  }, []);
  mat.uniforms.uT.value = t; mat.uniforms.uPx.value = px;
  if (t < 446.2 || t > 461.6) return null;
  return <points geometry={geo} material={mat} renderOrder={7} frustumCulled={false} />;
};

// ---------------- flash final (505,5-512): branco em tela cheia -> esfera -> anel azulado que se expande ----------------
const FLASH_FRAG = /* glsl */ `
uniform float uT, uCheio, uEsf, uRaioE, uCinza, uRaioA, uLarA, uAnel, uNucleo;
varying vec2 vP;
${RUIDO}
void main() {
  float r = length(vP) / ${(2 * ASP).toFixed(4)};       // fracao da largura
  vec3 c = vec3(1.0) * uCheio * 9.0;
  c += vec3(1.0, 1.0, 1.02) * uEsf * (7.0 * (1.0 - smoothstep(uRaioE * 0.82, uRaioE * 1.04, r)) + 1.4 * exp(-r / 0.2));
  c += vec3(0.8, 0.83, 0.9) * uCinza * (0.55 + 0.45 * exp(-r / 0.45));
  float dA = (r - uRaioA) / uLarA;
  float an = atan(vP.y, vP.x);
  float tex = 0.85 + 0.15 * n2(vec2(an * 6.0, uT * 2.0));
  c += vec3(0.72, 0.78, 1.0) * uAnel * exp(-dA * dA) * tex;
  c += vec3(0.85, 0.9, 1.0) * uNucleo * exp(-r / 0.05);
  gl_FragColor = vec4(c, 1.0);
}`;
export const FlashFinal: React.FC<{t: number}> = ({t}) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({vertexShader: PLANO_VERT, fragmentShader: FLASH_FRAG, ...aditivo,
    uniforms: {uU: {value: U * 0.5}, uT: {value: 0}, uCheio: {value: 0}, uEsf: {value: 0}, uRaioE: {value: 0.1}, uCinza: {value: 0},
      uRaioA: {value: 0}, uLarA: {value: 0.03}, uAnel: {value: 0}, uNucleo: {value: 0}}}), []);
  const geo = useMemo(() => new THREE.PlaneGeometry(2.3 * ASP * U * 0.5, 2.4 * U * 0.5), []);
  const u = mat.uniforms;
  u.uT.value = t;
  u.uCheio.value = smooth(505.42, 505.5, t) * (1 - smooth(505.58, 505.78, t));
  u.uEsf.value = smooth(505.52, 505.62, t) * (1 - smooth(505.95, 506.6, t));
  u.uRaioE.value = chaves([[505.6, 0.17], [506, 0.105], [506.5, 0.06]], t);
  u.uCinza.value = chaves([[505.5, 0], [505.6, 0.6], [506, 0.36], [506.5, 0.3], [507, 0.21], [508, 0.08], [509, 0.03], [510.5, 0]], t);
  u.uRaioA.value = chaves([[505.9, 0.02], [506.5, 0.13], [507, 0.19], [508, 0.3], [509, 0.42], [510, 0.54], [511, 0.64], [512.5, 0.8]], t);
  u.uLarA.value = 0.022 + 0.045 * smooth(506, 511, t);
  u.uAnel.value = chaves([[505.85, 0], [506.3, 3.2], [507, 1.7], [508, 0.85], [509, 0.5], [510.5, 0.25], [512.5, 0]], t);
  u.uNucleo.value = chaves([[506, 0], [506.4, 2.5], [507, 1.2], [508, 0.35], [509, 0]], t);
  if (t < 505.4 || t > 512.6) return null;
  return <mesh geometry={geo} material={mat} position={[0, 0, -DIST * 0.5]} renderOrder={10} frustumCulled={false} />;
};
