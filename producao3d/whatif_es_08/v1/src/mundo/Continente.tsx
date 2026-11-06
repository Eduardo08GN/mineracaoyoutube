// Continente em relevo com o mar subindo pelo DADO REAL: cada pixel sabe em que nivel alaga (nivel.f16: a agua entra pelo
// oceano, priority-flood na G4). O mar e plano em L; a terra acima de L fica no relevo. Tudo funcao de (L, t): determinístico.
// Ideias do levantamento (docs/levantamentos/mar-latam-2026-11-05.md): cor por altitude estilo monolith-terrain (MIT),
// agua por profundidade com espuma na margem estilo flood-insights (MIT); escrito do zero aqui.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {DADOS, LON0, UM, xy} from '../dados';

const VERT = /* glsl */ `
uniform sampler2D uNivel, uDem; uniform float uL, uUM, uLon0; uniform vec4 uB, uJan;
varying vec2 vUv; varying float vDist;
void main() {
  vec2 st = mix(uJan.xy, uJan.zw, uv); vUv = st;  // uJan: recorte de uv que esta malha cobre (a fina cobre a janela do plano)
  float lon = mix(uB.x, uB.z, st.x), lat = mix(uB.w, uB.y, st.y);
  float dem = texture2D(uDem, st).r, niv = texture2D(uNivel, st).r;
  float h = niv <= uL ? uL : dem;                 // alagado: superficie do mar em L; seco: relevo
  if (niv > uL && dem < 0.0) h = dem;             // bacia interior abaixo do mar ainda seca (Laguna del Carbon)
  vec3 p = vec3((lon - uLon0) * cos(radians(lat)), max(h, -50.0) * uUM, -lat);
  vec4 mv = modelViewMatrix * vec4(p, 1.0); vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */ `
uniform sampler2D uNivel, uDem, uSombra, uPais; uniform float uL, uT, uFoco, uFocoA, uNeblina0, uNeblina1;
uniform float uCaidos[24]; uniform vec2 uTexel; uniform vec3 uCeu; uniform vec4 uFura; uniform float uRel;
varying vec2 vUv; varying float vDist;
vec3 hips(float m) {                 // tinta hipsometrica estilizada (planicie verde -> altiplano ocre -> neve)
  vec3 c = vec3(0.47, 0.64, 0.35);
  c = mix(c, vec3(0.62, 0.70, 0.40), smoothstep(0.0, 400.0, m));
  c = mix(c, vec3(0.80, 0.72, 0.47), smoothstep(400.0, 1500.0, m));
  c = mix(c, vec3(0.72, 0.60, 0.42), smoothstep(1500.0, 3000.0, m));
  c = mix(c, vec3(0.66, 0.62, 0.46), smoothstep(3000.0, 4100.0, m));     // puna: ocre esverdeado
  c = mix(c, vec3(0.58, 0.50, 0.46), smoothstep(4100.0, 4900.0, m));
  return mix(c, vec3(0.96, 0.97, 0.99), smoothstep(4800.0, 5800.0, m));
}
float pid(vec2 uv) { return floor(texture2D(uPais, uv).r * 255.0 + 0.5); }
float luz(vec2 uv) {                 // relevo pela normal do pixel (independe da malha): luz do noroeste, exagero uRel
  float a = texture2D(uDem, uv - vec2(uTexel.x, 0.0)).r, b = texture2D(uDem, uv + vec2(uTexel.x, 0.0)).r;
  float c = texture2D(uDem, uv - vec2(0.0, uTexel.y)).r, d = texture2D(uDem, uv + vec2(0.0, uTexel.y)).r;
  vec3 n = normalize(vec3((a - b) * uRel, 2.0 * 2300.0, (c - d) * uRel));
  return clamp(dot(n, normalize(vec3(-0.6, 0.75, -0.45))), 0.0, 1.0);
}
void main() {
  if (vUv.x > uFura.x && vUv.y > uFura.y && vUv.x < uFura.z && vUv.y < uFura.w) discard;   // a malha fina cobre aqui
  float dem = texture2D(uDem, vUv).r, niv = texture2D(uNivel, vUv).r, sh = mix(texture2D(uSombra, vUv).r, luz(vUv), 0.65);
  float id = pid(vUv); vec3 col;
  if (niv <= uL) {
    float prof = uL - dem;                                       // profundidade total
    vec3 raso = vec3(0.36, 0.83, 0.90), medio = vec3(0.10, 0.52, 0.80), fundo = vec3(0.03, 0.15, 0.34);
    float k = 1.0 - exp(-prof / (120.0 + uL * 0.35));
    col = mix(raso, medio, smoothstep(0.0, 0.5, k)); col = mix(col, fundo, smoothstep(0.45, 1.0, k));
    col *= mix(1.0, 0.72 + 0.5 * sh, exp(-prof / (60.0 + uL * 0.08)));        // relevo afogado aparece no raso
    float dS = uL - niv, wF = max(1.2, 1.5 + uL * 0.012);        // quanto faz que alagou (m) e largura da espuma
    float espuma = 1.0 - smoothstep(0.0, wF, dS);
    float ondas = smoothstep(0.82, 1.0, sin(dS / wF * 4.0 - uT * 2.2)) * (1.0 - smoothstep(wF, 6.0 * wF, dS));
    col = mix(col, vec3(0.97, 0.99, 1.0), clamp(espuma * 0.85 + ondas * 0.35, 0.0, 1.0));
    // ondulacao do mar aberto (funcao de uv e t): da vida ao oceano liso dos planos finais; some quando a frequencia
    // passa do pixel (fwidth), para nao cintilar de longe
    vec2 q = vUv * vec2(2600.0, 2400.0);
    float fw = max(fwidth(q.x), fwidth(q.y)), amp = 0.07 * (1.0 - smoothstep(0.25, 0.9, fw)) * (1.0 - espuma);
    float onda = sin(q.x * 0.9 + uT * 1.3) * sin(q.y * 0.8 - uT * 1.05) + 0.5 * sin((q.x + q.y) * 1.7 + uT * 2.1);
    float largo = sin(vUv.x * 300.0 + uT * 0.35) * sin(vUv.y * 260.0 - uT * 0.3);           // marulho largo, visivel de longe
    col *= 1.0 + amp * onda + 0.035 * largo * (1.0 - espuma);
  } else {
    col = hips(dem) * (0.42 + 0.78 * sh);
    int i = int(id); float caido = (id > 0.5 && id < 23.5 && uCaidos[i] <= uL) ? 1.0 : 0.0;
    float cinza = dot(col, vec3(0.3, 0.59, 0.11));
    col = mix(col, vec3(cinza) * vec3(0.78, 0.8, 0.86), 0.78 * caido);            // pais que caiu: apagado
    if (abs(id - uFoco) < 0.5) col = mix(col, vec3(1.0, 0.3, 0.22), uFocoA * (0.32 + 0.12 * sin(uT * 9.0)));
    // fronteira: vizinho com outro pais
    float b = 0.0;
    for (int j = 0; j < 4; j++) {
      vec2 o = j == 0 ? vec2(uTexel.x, 0.0) : j == 1 ? vec2(-uTexel.x, 0.0) : j == 2 ? vec2(0.0, uTexel.y) : vec2(0.0, -uTexel.y);
      float v = pid(vUv + o * 1.5); if (v != id && (v > 0.5 || id > 0.5)) b = 1.0;
    }
    col = mix(col, vec3(1.0, 0.98, 0.94), b * 0.6);
    col *= 1.0 - 0.25 * (1.0 - smoothstep(0.0, 25.0 + uL * 0.02, niv - uL));     // margem molhada escurece
  }
  float n = smoothstep(uNeblina0, uNeblina1, vDist);
  gl_FragColor = vec4(mix(col, uCeu, n * 0.85), 1.0);
}`;

const PONTO_V = /* glsl */ `
attribute float aNiv; uniform float uL, uTam, uJan; varying float vEst;
void main() {
  vEst = (aNiv - uL) / uJan;                                     // >0 seco; 0..-1 acabando de afundar
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = vEst < -1.0 ? 0.0 : uTam * (60.0 / -mv.z) * (vEst < 0.0 ? 1.0 + 1.6 * (1.0 + vEst) : 1.0);
  gl_Position = projectionMatrix * mv;
}`;
const PONTO_F = /* glsl */ `
varying float vEst;
void main() {
  if (vEst < -1.0) discard;
  float r = length(gl_PointCoord - 0.5); if (r > 0.5) discard;
  float a = smoothstep(0.5, 0.1, r);
  vec3 c = vEst >= 0.0 ? vec3(1.0, 0.92, 0.68) : mix(vec3(1.0, 0.25, 0.18), vec3(1.0, 0.85, 0.7), clamp(1.0 + vEst, 0.0, 1.0));
  float alpha = vEst >= 0.0 ? 0.85 : (1.0 + vEst);
  gl_FragColor = vec4(c * a, a * alpha);
}`;

export type Janela = [number, number, number, number];   // lonMin, latMin, lonMax, latMax da malha fina
export const Continente: React.FC<{L: number; t: number; foco?: string; focoA?: number; neblina?: [number, number]; ceu: THREE.Color; janela: number; fina?: Janela}> = ({L, t, foco, focoA = 0, neblina = [60, 160], ceu, janela, fina}) => {
  const d = DADOS!;
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1, 1100, 1160).rotateX(0), []);
  const geoF = useMemo(() => new THREE.PlaneGeometry(1, 1, 1100, 1100), []);
  useMemo(() => { for (const g of [geo, geoF]) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i)); } }, [geo, geoF]);
  const caidos = useMemo(() => { const a = new Array(24).fill(1e9); d.ordem.forEach((k, i) => { if (d.paises[k]) a[i + 1] = d.paises[k].l99; }); return a; }, [d]);
  const fazMat = () => new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG,
    uniforms: {uNivel: {value: d.tex.nivel}, uDem: {value: d.tex.dem}, uSombra: {value: d.tex.sombra}, uPais: {value: d.tex.pais},
      uL: {value: 0}, uT: {value: 0}, uUM: {value: UM}, uLon0: {value: LON0}, uB: {value: new THREE.Vector4(...d.bounds)},
      uCaidos: {value: caidos}, uTexel: {value: new THREE.Vector2(1 / d.tw, 1 / d.th)}, uFoco: {value: -1}, uFocoA: {value: 0},
      uNeblina0: {value: 60}, uNeblina1: {value: 160}, uCeu: {value: new THREE.Color()}, uJan: {value: new THREE.Vector4(0, 0, 1, 1)}, uFura: {value: new THREE.Vector4(2, 2, 2, 2)}, uRel: {value: 14}},
  });
  const mat = useMemo(fazMat, [d, caidos]); const matF = useMemo(fazMat, [d, caidos]);
  const [O, S, Lo, N] = d.bounds, u = (lon: number) => (lon - O) / (Lo - O), v = (lat: number) => (N - lat) / (N - S);
  const jan = fina ? new THREE.Vector4(u(fina[0]), v(fina[3]), u(fina[2]), v(fina[1])) : null;
  const fi = foco ? d.ordem.indexOf(foco) + 1 : -1;
  for (const m of [mat, matF]) {
    m.uniforms.uL.value = L; m.uniforms.uT.value = t; m.uniforms.uFoco.value = fi; m.uniforms.uFocoA.value = focoA;
    m.uniforms.uNeblina0.value = neblina[0]; m.uniforms.uNeblina1.value = neblina[1]; m.uniforms.uCeu.value.copy(ceu);
  }
  // malha grossa fura a janela (margem de 1 texel para nao abrir fresta); a fina cobre so a janela
  if (jan) { mat.uniforms.uFura.value.set(jan.x + 1 / d.tw, jan.y + 1 / d.th, jan.z - 1 / d.tw, jan.w - 1 / d.th); matF.uniforms.uJan.value.copy(jan); }
  else mat.uniforms.uFura.value.set(2, 2, 2, 2);

  const pontos = useMemo(() => {
    const p = d.pontos, n = p.lon.length, pos = new Float32Array(n * 3), niv = new Float32Array(n);
    for (let i = 0; i < n; i++) { const [x, z] = xy(p.lon[i], p.lat[i]); pos[i * 3] = x; pos[i * 3 + 1] = p.nivel[i] * UM + 0.012; pos[i * 3 + 2] = z; niv[i] = p.nivel[i]; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aNiv', new THREE.BufferAttribute(niv, 1));
    return g;
  }, [d]);
  const matP = useMemo(() => new THREE.ShaderMaterial({vertexShader: PONTO_V, fragmentShader: PONTO_F, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {uL: {value: 0}, uTam: {value: 3}, uJan: {value: 10}}}), []);
  matP.uniforms.uL.value = L; matP.uniforms.uJan.value = janela;

  // oceano fora do recorte (horizonte)
  return (
    <group>
      <mesh geometry={geo} material={mat} frustumCulled={false} />
      {jan && <mesh geometry={geoF} material={matF} frustumCulled={false} />}
      <points geometry={pontos} material={matP} frustumCulled={false} />
      {/* oceano fora do recorte: FUNDO (desenhado antes, sem profundidade). 05/11: a 4 mm abaixo do mar do continente dava
          z-fighting listrado nos planos abertos (camera longe, near pequeno) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, L * UM, 0]} renderOrder={-10}>
        <planeGeometry args={[2000, 2000]} />
        <shaderMaterial depthTest={false} depthWrite={false} uniforms={{uCeu: {value: ceu}, uN0: {value: neblina[0]}, uN1: {value: neblina[1]}}}
          vertexShader={`varying float vD; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`}
          fragmentShader={`uniform vec3 uCeu; uniform float uN0, uN1; varying float vD; void main(){ vec3 c = vec3(0.03, 0.15, 0.34); gl_FragColor = vec4(mix(c, uCeu, smoothstep(uN0, uN1, vD) * 0.85), 1.0); }`} />
      </mesh>
    </group>
  );
};
