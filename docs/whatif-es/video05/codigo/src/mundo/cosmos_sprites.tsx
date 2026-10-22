// Sprites instanciados do Cosmos: quads virados para a camera, tamanho no mundo com piso/teto em pixels (estrelas nao somem nem
// viram discos), mistura pre-multiplicada (rgb soma luz, alfa escurece o que esta atras: poeira). Tudo dirigido por uniforms de t.
import * as THREE from 'three';
import {RUIDO} from './cosmos_glsl';

export type Instancias = {n: number; pos: Float32Array; cor: Float32Array; par: Float32Array};
export const instancias = (n: number): Instancias => ({n, pos: new Float32Array(n * 3), cor: new Float32Array(n * 4), par: new Float32Array(n * 4)});
// cor = (r, g, b, intensidade); par = (tamanho no mundo, livre, alongamento, angulo)
export const poe = (I: Instancias, i: number, p: ArrayLike<number>, c: ArrayLike<number>, q: ArrayLike<number>) => {
  I.pos.set([p[0], p[1], p[2]], i * 3); I.cor.set([c[0], c[1], c[2], c[3]], i * 4); I.par.set([q[0], q[1], q[2], q[3]], i * 4);
};

export const geometriaSprites = (I: Instancias, dinamico = false) => {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const at = (a: Float32Array, k: number) => { const b = new THREE.InstancedBufferAttribute(a, k); if (dinamico) b.setUsage(THREE.DynamicDrawUsage); return b; };
  g.setAttribute('iPos', at(I.pos, 3)); g.setAttribute('iCor', at(I.cor, 4)); g.setAttribute('iPar', at(I.par, 4));
  g.instanceCount = I.n;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e7);
  return g;
};
export const atualiza = (g: THREE.InstancedBufferGeometry) => {
  for (const k of ['iPos', 'iCor', 'iPar']) (g.getAttribute(k) as THREE.InstancedBufferAttribute).needsUpdate = true;
};

// formas prontas do fragmento (vUv em [-1,1], vCor = rgb*intensidade, vPar = par)
export const FRAG_GAUSS = /* glsl */ `
  float r2 = dot(vUv, vUv); if (r2 > 1.0) discard;
  float g = exp(-r2 * 6.0) - 0.0025;
  gl_FragColor = vec4(vCor.rgb * vCor.a * max(g, 0.0), 0.0);`;
// estrela: nucleo + halo
export const FRAG_ESTRELA = /* glsl */ `
  float r2 = dot(vUv, vUv); if (r2 > 1.0) discard;
  float g = exp(-r2 * 14.0) + 0.18 * exp(-r2 * 3.0) * (1.0 - r2);
  gl_FragColor = vec4(vCor.rgb * vCor.a * g, 0.0);`;
// mancha macia (nebulosa, bokeh): disco suave
export const FRAG_BOLHA = /* glsl */ `
  float r2 = dot(vUv, vUv); if (r2 > 1.0) discard;
  float g = pow(1.0 - r2, 2.2);
  gl_FragColor = vec4(vCor.rgb * vCor.a * g, 0.0);`;
// risco (estrias): quad alongado, perfil fino
export const FRAG_RISCO = /* glsl */ `
  float a = 1.0 - abs(vUv.x); float b = exp(-vUv.y * vUv.y * 4.0);
  gl_FragColor = vec4(vCor.rgb * vCor.a * a * b, 0.0);`;
// galaxia pequena (campo de galaxias): elipse com nucleo e bracos sugeridos, borrada
export const FRAG_GALAXIA = /* glsl */ `
  float ca = cos(vPar.w), sa = sin(vPar.w);
  vec2 p = mat2(ca, sa, -sa, ca) * vUv; p.y /= max(0.12, vPar.z);
  float r = length(p); if (r > 1.0 && length(vUv) > 1.0) discard;
  float nucleo = exp(-r * r * 60.0) * 1.6;
  float disco = exp(-r * 4.2);
  float ang = atan(p.y, p.x);
  float bracos = 0.55 + 0.45 * cos(2.0 * ang - log(r + 0.02) * 4.5 + vPar.y * 6.28);
  float tipo = step(0.5, fract(vPar.y * 7.0));
  float brilho = nucleo + disco * mix(1.0, bracos, tipo * 0.9) * 0.55;
  brilho *= smoothstep(1.0, 0.7, length(vUv));
  vec3 c = mix(vCor.rgb, vec3(1.0, 0.92, 0.8), clamp(nucleo, 0.0, 1.0));
  gl_FragColor = vec4(c * vCor.a * brilho, 0.0);`;
// poeira escura (escurece o que esta atras)
export const FRAG_POEIRA = /* glsl */ `
  float r2 = dot(vUv, vUv); if (r2 > 1.0) discard;
  float g = pow(1.0 - r2, 2.0);
  gl_FragColor = vec4(vCor.rgb * g * vCor.a * 0.15, vCor.a * g);`;

export type OpcoesSprites = {frag: string; decl?: string; pos?: string; minPx?: number; maxPx?: number};
// pos: GLSL que pode alterar P (vec3), tam (float) e cor (vec4) antes da projecao
export const materialSprites = ({frag, decl = '', pos = '', minPx = 1.2, maxPx = 4000}: OpcoesSprites) => new THREE.ShaderMaterial({
  uniforms: {uRes: {value: new THREE.Vector2(1920, 1080)}, uT: {value: 0}, uEscala: {value: 1}, uAlfa: {value: 1}, uMinPx: {value: minPx}, uMaxPx: {value: maxPx},
    uA: {value: 0}, uB: {value: 0}, uC: {value: 0}},
  vertexShader: /* glsl */ `
    uniform vec2 uRes; uniform float uT, uEscala, uAlfa, uMinPx, uMaxPx, uA, uB, uC;
    attribute vec3 iPos; attribute vec4 iCor; attribute vec4 iPar;
    varying vec2 vUv; varying vec4 vCor; varying vec4 vPar;
    ${RUIDO}
    ${decl}
    void main() {
      vec3 P = iPos; float tam = iPar.x * uEscala; vec4 cor = iCor; cor.a *= uAlfa;
      ${pos}
      vec4 mv = modelViewMatrix * vec4(P, 1.0);
      if (-mv.z < 0.5 || cor.a <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
      vec4 clip = projectionMatrix * mv;
      float k = uRes.y / 1080.0;
      float px = projectionMatrix[1][1] * tam / (-mv.z) * uRes.y * 0.5;
      float pxc = clamp(px, uMinPx * max(k, 0.55), uMaxPx * k);
      cor.a *= min(1.0, (px * px) / (pxc * pxc));
      vec2 c = position.xy; c.x *= max(1.0, iPar.z);
      float a = iPar.w; c = mat2(cos(a), sin(a), -sin(a), cos(a)) * c;
      clip.xy += c * pxc * 2.0 / uRes * clip.w;
      gl_Position = clip; vUv = position.xy; vCor = cor; vPar = iPar;
    }`,
  fragmentShader: /* glsl */ `
    varying vec2 vUv; varying vec4 vCor; varying vec4 vPar;
    void main() { ${frag} }`,
  transparent: true, depthWrite: false, depthTest: false,
  blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
});
