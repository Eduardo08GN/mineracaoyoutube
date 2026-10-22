// Chao de lava (cold open e 309,5-321,3): magma amarelo e laranja emissivo (HDR) com placas escuras de crosta que derivam e racham
// (Voronoi deformado por ruido), ondulacao lenta, nevoa quente no horizonte e anti-serrilhado por distancia.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RUIDO} from './cosmos_glsl';

const VERT = /* glsl */ `
varying vec2 vP; varying float vDist;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vP = position.xy; vDist = length(position.xy); gl_Position = projectionMatrix * viewMatrix * w; }`;

const FRAG = /* glsl */ `
uniform float uT, uGanho, uEscuro, uOndula, uRacha, uCalor;
varying vec2 vP; varying float vDist;
${RUIDO}
// Voronoi: distancia a borda da celula e id
vec3 voronoi(vec2 p, float t) {
  vec2 ip = floor(p), fp = fract(p);
  float d1 = 8.0, d2 = 8.0; vec2 id = vec2(0.0); vec2 r1 = vec2(0.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 o = hash22(ip + g);
    o = 0.5 + 0.38 * sin(t * 0.25 + 6.2831 * o);
    vec2 r = g + o - fp; float dd = dot(r, r);
    if (dd < d1) { d2 = d1; d1 = dd; id = ip + g; r1 = r; } else if (dd < d2) { d2 = dd; }
  }
  return vec3(sqrt(d2) - sqrt(d1), hash2(id), hash2(id + 7.3));
}
void main() {
  float t = uT;
  vec2 P = vP;
  // ondulacao (a "faixa de fusao" respira)
  P.y += uOndula * (sin(P.x * 0.045 + t * 1.1) * 2.2 + sin(P.x * 0.11 - t * 0.7) * 0.9);
  vec2 p = P / 13.0 + vec2(t * 0.06, -t * 0.035);
  vec2 wq = vec2(fbm3(vec3(p * 0.45, t * 0.03)), fbm3(vec3(p * 0.45 + 4.1, t * 0.03)));
  vec3 vo = voronoi(p + wq * 0.85, t);
  float fw = length(fwidth(p));
  float n = 0.5 + 0.5 * fbm5(vec3(P * 0.035, t * 0.08));
  float n2 = 0.5 + 0.5 * fbm3(vec3(P * 0.12 + 3.0, t * 0.15));
  // magma: amarelo quente nas correntes, laranja onde esfria
  vec3 quente = mix(vec3(2.0, 0.75, 0.0), vec3(2.8, 1.45, 0.1), smoothstep(0.5, 0.85, n2));
  vec3 morno = vec3(0.95, 0.11, 0.0);
  vec3 c = mix(morno, quente, smoothstep(0.38, 0.72, n));
  // placas de crosta (60% das celulas), rachaduras amarelas nas bordas, que alargam com o tempo
  float temPlaca = smoothstep(0.36, 0.42, vo.y);
  float larg = 0.05 + 0.1 * uRacha + 0.06 * vo.z;
  float dentro = smoothstep(larg, larg + 0.05 + fw * 1.5, vo.x);
  float vein = 1.0 - abs(snoise(vec3(P * 0.2, t * 0.2)));
  vec3 crosta = mix(vec3(0.26, 0.016, 0.0), vec3(0.8, 0.075, 0.0), smoothstep(0.2, 0.9, 0.6 * vo.z + 0.4 * n2) + 0.25 * pow(vein, 8.0));
  crosta *= 0.75 + 0.5 * (0.5 + 0.5 * fbm3(vec3(P * 0.5, 1.0)));
  float placa = temPlaca * dentro;
  c = mix(c, crosta, placa);
  c = mix(c, vec3(2.3, 0.95, 0.02), temPlaca * (1.0 - dentro) * 0.85);
  // longe: anti-serrilhado (media) e a faixa de fusao amarela antes do horizonte
  vec3 media = mix(c, vec3(1.5, 0.38, 0.0), 0.55);
  c = mix(c, media, smoothstep(0.3, 1.0, fw));
  float faixa = smoothstep(25.0, 90.0, vDist) * (1.0 - smoothstep(500.0, 1250.0, vDist));
  c *= 0.75 + 0.5 * faixa;
  c = mix(c, vec3(1.7, 0.26, 0.0), smoothstep(500.0, 1250.0, vDist) * 0.8);
  // perto: liso e mais escuro (laranja), como no original
  float perto = smoothstep(18.0, 3.0, vDist);
  c = mix(c, mix(morno, quente, 0.25 + 0.4 * n) * 0.7, perto * 0.7);
  c *= uCalor;
  c *= 1.0 - uEscuro;
  gl_FragColor = vec4(c * uGanho, 1.0);
}`;

export const Lava: React.FC<{t: number; altura: number; ganho: number; escuro: number; ondula: number; racha: number; calor: number; depthTest: boolean}> =
  ({t, altura, ganho, escuro, ondula, racha, calor, depthTest}) => {
    const mat = useMemo(() => new THREE.ShaderMaterial({
      uniforms: {uT: {value: 0}, uGanho: {value: 1}, uEscuro: {value: 0}, uOndula: {value: 0}, uRacha: {value: 0}, uCalor: {value: 1}},
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    }), []);
    const geo = useMemo(() => new THREE.CircleGeometry(1300, 96), []);
    const u = mat.uniforms;
    u.uT.value = t; u.uGanho.value = ganho; u.uEscuro.value = escuro; u.uOndula.value = ondula; u.uRacha.value = racha; u.uCalor.value = calor;
    mat.depthTest = depthTest;
    return <mesh geometry={geo} material={mat} position={[0, -altura, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2} frustumCulled={false} />;
  };
