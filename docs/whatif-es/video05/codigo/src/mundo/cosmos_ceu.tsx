// Cupula do Cosmos (esfera em volta do olho): ceu de chama da gigante vermelha (cold open e 314-320), ceu vermelho-escuro com raios
// (310,5-314), plasma claro (319-320), interior do Sol espelhado (321,4-325,4), plasma esfriando (325,4-328,2), espaco com estrelas,
// nevoa verde-azulada e a faixa da Via Lactea (328,4-345). Antes de 309,3 so sobreposicoes no ceu do agente Ceu (brilho dourado,
// tinta vermelha), mascaradas abaixo do horizonte. Saida pre-multiplicada: rgb soma luz, alfa cobre o que esta atras.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RUIDO} from './cosmos_glsl';

export type ParCeu = {
  opaco: number;       // 0..1: quanto o ceu proprio cobre o fundo
  mascara: number;     // 1: nada abaixo do horizonte (chao de outro dono)
  ganho: number;       // fade geral (pretos de corte)
  chama: number; brilho: number; raios: number; plasmaClaro: number; sol: number; esfria: number;
  glow: number; tinta: number; teal: number; via: number; estrelas: number;
  base: THREE.Matrix3;         // colunas: direita, cima, frente da vista de referencia
  glowDir: THREE.Vector3; faixaN: THREE.Vector3; solDir: THREE.Vector3;
};

const VERT = /* glsl */ `
varying vec3 vDir;
void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const FRAG = /* glsl */ `
uniform float uT, uOpaco, uMascara, uGanho, uChama, uBrilho, uRaios, uPlasmaClaro, uSol, uEsfria, uGlow, uTinta, uTeal, uVia, uEstrelas;
uniform mat3 uBase; uniform vec3 uGlowDir, uFaixaN, uSolDir;
varying vec3 vDir;
${RUIDO}
float estrelas(vec3 d, float escala, float dens) {
  vec3 p = d * escala; vec3 i = floor(p); vec3 f = fract(p);
  if (hash3(i) > dens) return 0.0;
  vec3 c = vec3(hash3(i + 1.7), hash3(i + 3.1), hash3(i + 5.9)) * 0.6 + 0.2;
  vec3 dd = f - c; dd -= dot(dd, d) * d;
  float px = length(fwidth(p));
  float r = max(px * 0.75, 0.015);
  float b = pow(hash3(i + 7.3), 5.0) * 5.0 + 0.25;
  return b * exp(-dot(dd, dd) / (r * r)) * min(1.0, 0.03 / r);
}
vec3 corEstrela(vec3 i) { float h = hash3(i + 11.0); return h < 0.2 ? vec3(0.7, 0.8, 1.2) : h < 0.35 ? vec3(1.2, 0.85, 0.6) : vec3(1.0); }
void main() {
  vec3 d = normalize(vDir);
  vec3 v = vec3(dot(d, uBase[0]), dot(d, uBase[1]), dot(d, uBase[2]));
  float e = d.y;
  float t = uT;
  vec3 op = vec3(0.0);   // camada opaca (o ceu proprio)
  vec3 ad = vec3(0.0);   // luz somada por cima

  // ---------- ceu de chama da gigante vermelha ----------
  if (uChama > 0.001 || uRaios > 0.001 || uPlasmaClaro > 0.001) {
    float az = atan(v.x, v.z);
    vec2 uv = vec2(az, e);
    float ca = cos(0.5), sa = sin(0.5);
    vec2 q = vec2(ca * uv.x - sa * uv.y, sa * uv.x + ca * uv.y);
    float alt = clamp(e, 0.0, 1.0);
    vec3 w = vec3(uv * vec2(1.6, 2.4), t * 0.05);
    vec2 warp = vec2(fbm3(w + vec3(0.0, -t * 0.12, 0.0)), fbm3(w + vec3(5.2, 1.3 - t * 0.12, 2.0)));
    float chama = 0.5 + 0.5 * fbm5(vec3(uv * vec2(2.4, 3.6) + warp * 1.5 + vec2(t * 0.04, -t * 0.2), t * 0.09));
    chama = smoothstep(0.18, 0.85, chama);
    float fumo = 0.5 + 0.5 * fbm3(vec3(uv * vec2(1.1, 1.8) + warp * 0.6 + vec2(0.0, -t * 0.05), t * 0.03 + 4.0));
    float estria = 0.5 + 0.5 * fbm3(vec3(q.x * 1.1 - t * 0.06 + warp.y * 0.3, q.y * 16.0, t * 0.04));
    float lingua = 1.0 - abs(snoise(vec3(q.x * 0.7 + warp.x * 0.4, q.y * 13.0 - t * 0.25, t * 0.1)));
    vec3 base = mix(vec3(1.5, 0.16, 0.0), vec3(0.75, 0.05, 0.0), smoothstep(0.0, 0.16, alt));
    base = mix(base, vec3(0.34, 0.02, 0.0), smoothstep(0.14, 0.5, alt));
    base = mix(base, vec3(0.13, 0.009, 0.002), smoothstep(0.45, 1.0, alt));
    vec3 c = base * (0.3 + 1.15 * chama) * (0.55 + 0.75 * fumo);
    c += vec3(0.95, 0.12, 0.0) * pow(estria, 3.0) * 0.5 * smoothstep(0.03, 0.35, alt) * (0.4 + 0.6 * chama);
    c += vec3(1.2, 0.2, 0.01) * pow(lingua, 16.0) * 0.3 * smoothstep(0.05, 0.3, alt);
    // faixa clara diagonal no alto (a borda do Sol inchado passando pelo alto do quadro)
    float fd = q.y - 0.42 - 0.04 * sin(q.x * 3.0 + t * 0.2);
    c += vec3(1.3, 0.3, 0.06) * exp(-fd * fd / 0.003) * (0.3 + 0.7 * estria) * 0.75;
    c *= uBrilho;
    // raios diagonais sobre ceu vermelho-escuro (o Sol inchado fora do quadro, no alto a esquerda)
    vec3 s = normalize(uSolDir);
    vec3 eixo1 = normalize(cross(s, vec3(0.0, 1.0, 0.0))); vec3 eixo2 = cross(eixo1, s);
    float ang = atan(dot(d, eixo2), dot(d, eixo1));
    float dist = acos(clamp(dot(d, s), -1.0, 1.0));
    float raio = pow(0.5 + 0.5 * fbm3(vec3(ang * 9.0, dist * 0.6 - t * 0.15, t * 0.05)), 3.0);
    vec3 cr = mix(vec3(0.17, 0.01, 0.0), vec3(0.4, 0.03, 0.0), smoothstep(1.4, 0.4, dist));
    cr += vec3(0.9, 0.08, 0.0) * raio * 0.9 * smoothstep(1.7, 0.5, dist);
    cr += vec3(0.5, 0.04, 0.0) * (0.5 + 0.5 * fbm3(vec3(uv * 4.0, t * 0.1))) * 0.25;
    cr = mix(cr, vec3(1.3, 0.14, 0.0), smoothstep(0.12, 0.0, alt) * 0.7);
    c = mix(c, cr, uRaios);
    // plasma claro e turbulento (319-320)
    vec3 pw = vec3(uv * vec2(1.6, 2.2), t * 0.18);
    vec2 w2 = vec2(fbm3(pw * 1.3), fbm3(pw * 1.3 + 7.7));
    float nub = 0.5 + 0.5 * fbm5(pw + vec3(w2 * 0.7, 0.0));
    vec3 cp = mix(vec3(1.6, 0.6, 0.06), vec3(0.95, 0.1, 0.0), smoothstep(0.35, 0.7, nub));
    cp = mix(cp, vec3(0.5, 0.03, 0.0), smoothstep(0.62, 0.85, nub) * 0.7);
    c = mix(c, cp, uPlasmaClaro);
    op += c * max(uChama, max(uRaios, uPlasmaClaro));
  }

  // ---------- interior do Sol: plasma espelhado (simetria radial) ----------
  if (uSol > 0.001) {
    float th = acos(clamp(v.z, -1.0, 1.0));
    vec2 f = abs(v.xy) + 1e-4;
    float ph = atan(f.y, f.x);
    float lr = log(th + 0.04);
    vec3 P = vec3(lr * 0.95 - t * 0.22, ph * 2.8, t * 0.05);
    vec2 wr = vec2(fbm3(P * 0.8), fbm3(P * 0.8 + 3.7));
    float n = 0.5 + 0.5 * fbm5(P + vec3(wr * 0.9, 0.0));
    float n2 = 0.5 + 0.5 * fbm3(vec3(lr * 1.3 - t * 0.28, atan(v.y, v.x) * 1.6, t * 0.06 + 9.0));
    n = mix(n, n2, 0.22);
    float veia = pow(1.0 - abs(snoise(vec3(lr * 1.4 - t * 0.3, ph * 4.0 + wr.x, t * 0.1))), 10.0);
    vec3 c = mix(vec3(0.36, 0.022, 0.0), vec3(0.95, 0.1, 0.0), smoothstep(0.3, 0.6, n));
    c = mix(c, vec3(1.25, 0.55, 0.14), smoothstep(0.6, 0.88, n) * 0.8);
    c += vec3(1.1, 0.5, 0.13) * veia * 0.15;
    c *= 0.85 + 0.35 * smoothstep(1.2, 0.1, th);
    // esfriando: marrom e depois preto
    float k1 = smoothstep(0.0, 0.45, uEsfria), k2 = smoothstep(0.35, 1.0, uEsfria);
    c = mix(c, vec3(0.2, 0.05, 0.01) * (0.4 + 1.1 * n), k1);
    c *= 1.0 - k2;
    op += c * uSol;
  }

  // ---------- espaco: estrelas, nevoa verde-azulada, Via Lactea ----------
  if (uEstrelas > 0.001) {
    vec3 p = d * 260.0; vec3 i = floor(p);
    ad += corEstrela(i) * estrelas(d, 260.0, 0.07) * uEstrelas;
    ad += estrelas(d, 90.0, 0.05) * uEstrelas * vec3(1.0, 0.95, 0.9) * 1.6;
  }
  if (uTeal > 0.001) {
    float h = 0.5 + 0.5 * fbm5(d * 2.6 + vec3(0.0, 0.0, t * 0.01));
    float m = 0.5 + 0.5 * fbm3(d * 1.7 + 5.0);
    vec3 ct = mix(vec3(0.0, 0.14, 0.1), vec3(0.01, 0.05, 0.2), smoothstep(0.45, 0.7, m));
    ct = mix(ct, vec3(0.03, 0.14, 0.04), smoothstep(0.62, 0.8, m) * 0.6);
    ad += ct * smoothstep(0.45, 0.9, h) * 0.32 * uTeal;
  }
  if (uVia > 0.001) {
    float bd = dot(d, normalize(uFaixaN));
    float banda = exp(-bd * bd / 0.02);
    float nucleo = exp(-bd * bd / 0.0035);
    float tx = 0.5 + 0.5 * fbm5(d * 7.0);
    float poeira = smoothstep(0.45, 0.75, 0.5 + 0.5 * fbm5(d * 13.0 + 2.0));
    vec3 cv = mix(vec3(0.4, 0.42, 0.75), vec3(1.0, 0.5, 0.25), nucleo) * banda * (0.35 + 0.8 * tx);
    cv *= 1.0 - 0.75 * poeira * nucleo;
    float gr = estrelas(d, 520.0, 0.5 * banda) * banda;
    ad += (cv * 0.5 + vec3(1.0, 0.95, 0.9) * gr * 1.1) * uVia;
  }

  // ---------- sobreposicoes no ceu de outro dono ----------
  float glow = exp(-pow(acos(clamp(dot(d, normalize(uGlowDir)), -1.0, 1.0)), 2.0) / 0.12);
  ad += vec3(1.0, 0.55, 0.12) * glow * uGlow * (0.85 + 0.15 * fbm3(d * 5.0 + t * 0.05));
  vec3 tinta = vec3(0.45, 0.03, 0.0) * (0.75 + 0.35 * (0.5 + 0.5 * fbm3(d * 3.0 + vec3(0.0, t * 0.05, 0.0))));

  float m = mix(1.0, smoothstep(-0.005, 0.03, e), uMascara);
  float a = uOpaco;
  vec3 cor = op * uOpaco;
  // tinta vermelha: cobre parcialmente
  cor = cor * (1.0 - uTinta * 0.55) + tinta * uTinta * 0.55; a = a + (1.0 - a) * uTinta * 0.55;
  cor += ad;
  gl_FragColor = vec4(cor * m * uGanho, clamp(a * m + (1.0 - uGanho), 0.0, 1.0));
}`;

export const CeuCosmos: React.FC<{t: number; p: ParCeu; raio?: number; depthTest: boolean}> = ({t, p, raio = 1400, depthTest}) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {uT: {value: 0}, uOpaco: {value: 0}, uMascara: {value: 1}, uGanho: {value: 1}, uChama: {value: 0}, uBrilho: {value: 1}, uRaios: {value: 0},
      uPlasmaClaro: {value: 0}, uSol: {value: 0}, uEsfria: {value: 0}, uGlow: {value: 0}, uTinta: {value: 0}, uTeal: {value: 0}, uVia: {value: 0},
      uEstrelas: {value: 0}, uBase: {value: new THREE.Matrix3()}, uGlowDir: {value: new THREE.Vector3(0, 1, 0)}, uFaixaN: {value: new THREE.Vector3(0, 0, 1)},
      uSolDir: {value: new THREE.Vector3(0, 1, 0)}},
    vertexShader: VERT, fragmentShader: FRAG, side: THREE.BackSide, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  }), []);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 96, 64), []);
  const u = mat.uniforms;
  u.uT.value = t; u.uOpaco.value = p.opaco; u.uMascara.value = p.mascara; u.uGanho.value = p.ganho; u.uChama.value = p.chama; u.uBrilho.value = p.brilho;
  u.uRaios.value = p.raios; u.uPlasmaClaro.value = p.plasmaClaro; u.uSol.value = p.sol; u.uEsfria.value = p.esfria; u.uGlow.value = p.glow;
  u.uTinta.value = p.tinta; u.uTeal.value = p.teal; u.uVia.value = p.via; u.uEstrelas.value = p.estrelas;
  u.uBase.value.copy(p.base); u.uGlowDir.value.copy(p.glowDir); u.uFaixaN.value.copy(p.faixaN); u.uSolDir.value.copy(p.solDir);
  mat.depthTest = depthTest;
  return <mesh geometry={geo} material={mat} scale={raio} renderOrder={1} frustumCulled={false} />;
};
