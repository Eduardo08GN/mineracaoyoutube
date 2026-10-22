// Buraco negro do Fim (410-505,5): raymarching de Schwarzschild num quad no plano do ceu.
// Geodesicas de luz pela forma "newtoniana" exata (a = -3/2 h^2 r/r^5, com rs = 1), disco fino com turbulencia girando em
// velocidade kepleriana, beaming Doppler + desvio gravitacional (lado esquerdo vem na sua direcao: mais brilhante e mais azul),
// anel de fotons no raio critico (b = 3*sqrt(3)/2 rs), lente (a parte de tras do disco aparece por cima e por baixo da sombra),
// halo granulado dourado, e depois o anel violeta que vira branco-azulado (radiacao Hawking).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {BC, DIST, HX, HY, U, estadoBN, larg} from './fim_comum';
import {RUIDO} from './fim_glsl';

const VERT = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAG = /* glsl */ `
uniform float uT, uDisco, uAroI, uHaloI, uGrao, uPix, uIncl;
uniform vec3 uAroCor, uHaloCor;
varying vec2 vUv;
#define HX ${HX.toFixed(1)}
#define HY ${HY.toFixed(1)}
#define BC ${BC.toFixed(4)}
${RUIDO}
vec3 rampa(float x) {
  x = clamp(x, 0.0, 2.6);
  vec3 c0 = vec3(0.22, 0.03, 0.0), c1 = vec3(0.95, 0.33, 0.05), c2 = vec3(1.0, 0.70, 0.30), c3 = vec3(1.0, 0.91, 0.70), c4 = vec3(0.82, 0.90, 1.0);
  if (x < 0.5) return mix(c0, c1, x / 0.5);
  if (x < 1.0) return mix(c1, c2, (x - 0.5) / 0.5);
  if (x < 1.6) return mix(c2, c3, (x - 1.0) / 0.6);
  return mix(c3, c4, clamp((x - 1.6) / 1.0, 0.0, 1.0));
}
void main() {
  vec2 p = (vUv * 2.0 - 1.0) * vec2(HX, HY);
  float R = 40.0;
  vec3 cam = R * vec3(0.0, sin(uIncl), cos(uIncl));
  vec3 fw = -normalize(cam);
  vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(rt, fw);
  vec3 dir = normalize(fw * R + p.x * rt + p.y * up);
  vec3 pos = cam, vel = dir;
  vec3 hv = cross(pos, vel);
  float h2 = dot(hv, hv), b = sqrt(h2);
  float tt = uT - 400.0;
  vec3 col = vec3(0.0);
  float A = 0.0, nc = 0.0;
  if (uDisco > 0.002) {
    for (int i = 0; i < 240; i++) {
      float r2 = dot(pos, pos);
      if (r2 < 1.0 || A > 0.985) break;
      if (r2 > R * R * 1.1 && dot(pos, vel) > 0.0) break;
      float r = sqrt(r2);
      float dt = clamp(0.045 * r, 0.012, 2.0);
      vec3 prev = pos;
      vel += -1.5 * h2 * pos / (r2 * r2 * r) * dt;
      pos += vel * dt;
      if (prev.y * pos.y < 0.0) {
        vec3 hp = mix(prev, pos, prev.y / (prev.y - pos.y));
        float rr = length(hp.xz);
        if (rr > 2.4 && rr < 13.0) {
          float ang = atan(hp.z, hp.x);
          float a0 = ang + 2.4 * pow(rr, -1.5) * tt;           // material girando (kepleriano)
          float n = fbm3(vec3(rr * 3.0, cos(a0) * 4.5, sin(a0) * 4.5));
          float nf = n3(vec3(rr * 12.0, cos(a0) * 16.0, sin(a0) * 16.0));
          float dens = smoothstep(2.5, 3.3, rr) * (1.0 - smoothstep(7.0, 12.5, rr));
          dens *= (0.3 + 1.15 * n) * (0.7 + 0.6 * nf) * (0.78 + 0.22 * sin(rr * 6.5 + n * 5.0));
          float T = pow(3.0 / rr, 0.75);
          float beta = min(sqrt(0.5 / (rr - 1.0)), 0.7);
          float gam = 1.0 / sqrt(1.0 - beta * beta);
          vec3 vd = normalize(vec3(hp.z, 0.0, -hp.x));
          float D = 1.0 / (gam * (1.0 - beta * dot(vd, -normalize(vel))));
          float g = D * sqrt(1.0 - 1.0 / rr);
          float I = min(pow(g, 3.0), 6.0);
          vec3 e = rampa(T * g * 1.05) * I * (0.5 + 1.5 * T) * 2.2 * uDisco;
          float a = clamp(dens * (nc < 0.5 ? 0.95 : 0.6), 0.0, 0.9) * min(uDisco, 1.0);
          nc += 1.0;
          col += (1.0 - A) * a * e;
          A += (1.0 - A) * a;
        }
      }
    }
  }
  float pix = uPix;
  float sombra = 1.0 - smoothstep(BC - pix, BC + pix, b);
  float wr = max(0.035, 1.1 * pix);
  float dr = b - BC;
  float aro = dr > 0.0 ? exp(-dr / wr) + 0.22 * exp(-dr / (wr * 7.0)) : exp(dr / (wr * 0.35));
  vec3 em = uAroCor * uAroI * aro;
  float an = atan(p.y, p.x);
  float gr = n3(vec3(cos(an) * 40.0, sin(an) * 40.0, b * 9.0 + tt * 0.8));
  gr = 0.3 + 1.4 * gr * gr;
  em += vec3(1.0, 0.74, 0.38) * exp(-pow((b - 4.2) / 1.2, 2.0)) * gr * uGrao * 0.6;      // halo granulado
  em += uHaloCor * uHaloI * (dr > 0.0 ? exp(-dr / 1.9) : 0.0);                           // halo violeta / Hawking
  vec2 e2 = abs(vUv * 2.0 - 1.0);
  float borda = (1.0 - smoothstep(0.8, 1.0, e2.x)) * (1.0 - smoothstep(0.72, 1.0, e2.y));
  vec3 rgb = (col + (1.0 - 0.55 * A) * em) * borda;   // o anel de fotons vaza por cima do disco (nao some atras dele)
  float alfa = (A + (1.0 - A) * sombra) * borda;
  gl_FragColor = vec4(rgb, alfa);
}`;

export const BuracoNegro: React.FC<{t: number}> = ({t}) => {
  const {gl} = useThree();
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, depthTest: true,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: {uT: {value: 0}, uDisco: {value: 0}, uAroI: {value: 0}, uHaloI: {value: 0}, uGrao: {value: 0}, uPix: {value: 0.05}, uIncl: {value: 0.09},
      uAroCor: {value: new THREE.Color()}, uHaloCor: {value: new THREE.Color()}},
  }), []);
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const e = estadoBN(t);
  const W = (larg(e.S) * HX) / BC, H = (W * HY) / HX;           // tamanho do quad em unidades de tela
  const bw = gl.getDrawingBufferSize(new THREE.Vector2()).x;
  const u = mat.uniforms;
  u.uT.value = t; u.uDisco.value = e.disco; u.uAroI.value = e.aroI; u.uHaloI.value = e.haloI; u.uGrao.value = e.grao;
  u.uPix.value = (2 * HX) / Math.max(1, (W / larg(1)) * bw);
  u.uAroCor.value.copy(e.aro); u.uHaloCor.value.copy(e.halo);
  if (!e.vis) return null;
  return <mesh geometry={geo} material={mat} position={[e.x * U, e.y * U, -DIST]} scale={[W * U, H * U, 1]} renderOrder={6} frustumCulled={false} />;
};
