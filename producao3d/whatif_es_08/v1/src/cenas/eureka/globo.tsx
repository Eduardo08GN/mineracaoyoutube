// Globo do eureka do gelo (huella gravitacional: Mitrovica, Gomez & Clark, Science 2009). Mascaras do Blue Marble topo+bathy
// (NASA, dominio publico; public/eureka/terra_*.{jpg,png}, feitas por D:/tmp/eureka/globo.py). Modelo didatico, nao o campo real:
//   antes  = morro de agua junto ao gelo (atracao) e um deficit leve longe dele;
//   depois = superficie sem o morro (sem gelo nao ha atracao) + a agua do degelo espalhada;
//   variacao = BAIXA perto da Antartida, sobe ~1,2x a media longe (costas da America Latina). Escala vertical exagerada.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {staticFile} from 'remotion';
import {sm} from './comum';

const D2R = Math.PI / 180;
export const geo = (lon: number, lat: number, r: number): [number, number, number] => {
  const ph = (lon + 180) * D2R, la = lat * D2R;
  return [-Math.cos(ph) * Math.cos(la) * r, Math.sin(la) * r, Math.sin(ph) * Math.cos(la) * r];
};

// ---------------------------------------------------------------- linha do tempo do take (tempo global do video)
export const R0 = 1.015;
export const TERRA_R = 1.072;                                  // continentes num planalto acima de qualquer mar do modelo
export const estadoGelo = (t: number) => {
  const B = 0.35 + 0.65 * sm(107.6, 119.5, t);                 // o gelo puxa: o morro de agua se forma
  const S = sm(121.0, 126.2, t);                               // derrete: o morro solta
  const R = sm(124.8, 131.2, t);                               // a agua vai embora para longe (sobe o resto do oceano)
  // velocidade do fluxo (graus/s ao longo do meridiano): -1 = para o polo, +1 = para o norte. Integral analitica (sem estado)
  const t0 = 107, t1 = 121.4, t2 = 123.6, k = 2.6;
  const I = (x: number) => {
    if (x <= t1) return -(x - t0);
    const a = -(t1 - t0); if (x <= t2) { const d = x - t1; return a - d + (d * d) / (t2 - t1); }
    return a + (x - t2);
  };
  return {B, S, R, gelo: 1 - S, desl: k * I(t), dir: t < 122.5 ? -1 : 1};
};
export const gN = (a: number) => Math.exp(-Math.pow(Math.max(a - 16, 0) / 18, 1.5));
export const hMar = (lat: number, e: {B: number; S: number; R: number}) => { const g = gN(lat + 90); return 0.12 * g * (e.B - e.S) - 0.012 * e.B + 0.06 * e.R; };
export const hAntes = (lat: number) => 0.12 * gN(lat + 90) - 0.012;
export const MEDIA = 0.048;                                   // subida media global no fim (unidades do globo)
// pontos da silhueta (tangentes ao raio r(lat)) vistos da camera; theta 0 = direita da tela, 90 = cima, 180 = esquerda, 270 = baixo
export type Limbo = {p: [number, number, number]; lat: number; lon: number; mar: boolean};
export const limbo = (cam: [number, number, number], raio: (lat: number) => number, th0: number, th1: number, n: number): Limbo[] => {
  const C = new THREE.Vector3(...cam), d = C.length(), nr = C.clone().normalize();
  const e1 = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), nr).normalize(), e2 = new THREE.Vector3().crossVectors(nr, e1);
  const out: Limbo[] = [];
  for (let i = 0; i <= n; i++) {
    const th = (th0 + ((th1 - th0) * i) / n) * D2R, dir = e1.clone().multiplyScalar(Math.cos(th)).addScaledVector(e2, Math.sin(th));
    let r = R0, q = new THREE.Vector3();
    for (let it = 0; it < 3; it++) { const k = r / d; q = nr.clone().multiplyScalar(k).addScaledVector(dir, Math.sqrt(1 - k * k)); const lat = Math.asin(q.y) / D2R; r = raio(lat); }
    const lat = Math.asin(q.y) / D2R, lon = Math.atan2(q.z, -q.x) / D2R - 180, lonN = ((lon + 540) % 360) - 180;
    const k = r / d; q = nr.clone().multiplyScalar(k).addScaledVector(dir, Math.sqrt(1 - k * k)).multiplyScalar(r);
    out.push({p: q.toArray() as [number, number, number], lat, lon: lonN, mar: !terraOk(lonN, lat)});
  }
  return out;
};
const terraOk = (lon: number, lat: number) => (TEX ? terra(lon, lat) : false);

const GLSL_H = /* glsl */ `
uniform float uB, uS, uR;
float gN(float a) { return exp(-pow(max(a - 16.0, 0.0) / 18.0, 1.5)); }
float hMar(float lat) { float g = gN(lat + 90.0); return 0.12 * g * (uB - uS) - 0.012 * uB + 0.06 * uR; }
vec3 geo(float lon, float lat, float r) { float ph = radians(lon + 180.0), la = radians(lat); return vec3(-cos(ph) * cos(la), sin(la), sin(ph) * cos(la)) * r; }
`;

// ---------------------------------------------------------------- terra + gelo
const TERRA_V = /* glsl */ `
uniform sampler2D uMask; uniform float uGelo, uT0;
varying vec2 vUv; varying vec3 vN, vP; varying float vEsp;
${GLSL_H}
vec3 borr(vec2 uv) {                      // (terra media ~1 grau, gelo medio ~1 grau, gelo medio ~5 graus): rampas suaves
  vec2 s = texture2D(uMask, uv).rg * 2.0; float g = 0.0;
  float kx = 1.0 / max(cos(radians(uv.y * 180.0 - 90.0)), 0.12);           // offsets em graus de arco, nao de longitude
  for (int j = 0; j < 8; j++) {
    float an = float(j) * 0.785 + 0.39; vec2 o = vec2(cos(an) * 0.0030 * kx, sin(an) * 0.0060);
    s += texture2D(uMask, uv + o).rg; g += texture2D(uMask, uv + o * 3.0).g + texture2D(uMask, uv + o * 6.0).g;
  }
  return vec3(s / 10.0, g / 16.0);
}
void main() {
  vUv = uv;
  float lon = uv.x * 360.0 - 180.0, lat = clamp(uv.y * 180.0 - 90.0, -89.6, 89.6), a = lat + 90.0;
  vec3 m = borr(uv);
  float terra = smoothstep(0.2, 0.9, m.x), gelo = smoothstep(0.2, 0.9, m.y) * smoothstep(0.5, 0.97, m.z) * step(lat, -58.0);
  float domo = uT0 * sqrt(max(0.0, 1.0 - pow(a / 31.0, 2.0)));
  float recuo = smoothstep(31.0 * uGelo + 1.0, 31.0 * uGelo + 6.0, a);       // o gelo recua da borda para dentro
  vEsp = domo * gelo * pow(uGelo, 0.55) * (1.0 - recuo);
  vec3 p0 = geo(lon, lat, 1.0 + (${TERRA_R.toFixed(3)} - 1.0) * terra + vEsp);
  vP = p0; vN = normalize(p0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p0, 1.0);
}`;
const TERRA_F = /* glsl */ `
uniform sampler2D uCor, uMask; uniform vec3 uSol, uCam; uniform float uGelo, uT;
varying vec2 vUv; varying vec3 vN, vP; varying float vEsp;
void main() {
  vec3 c = texture2D(uCor, vUv).rgb;
  float lat = vUv.y * 180.0 - 90.0;
  vec4 m = texture2D(uMask, vUv);
  if (lat < -58.0 && m.r > 0.5) {
    float temGelo = smoothstep(0.002, 0.014, vEsp);
    vec3 gelo = mix(vec3(0.80, 0.90, 1.0), vec3(0.97, 0.99, 1.0), smoothstep(0.02, 0.12, vEsp));
    vec3 rocha = vec3(0.36, 0.34, 0.33) + 0.05 * sin(vUv.x * 900.0) * sin(vUv.y * 700.0);
    c = mix(rocha, gelo, temGelo);
    // agua de degelo escorrendo (faixas que descem para a borda enquanto derrete)
    float derrete = (1.0 - uGelo) * uGelo * 4.0;
    c = mix(c, vec3(0.45, 0.78, 0.95), derrete * 0.35 * smoothstep(0.6, 1.0, sin((lat + 90.0) * 2.2 + uT * 3.0)) * temGelo);
  } else if (m.r < 0.5) {
    c = mix(vec3(0.02, 0.09, 0.22), vec3(0.06, 0.24, 0.42), m.b);       // fundo do mar (aparece na fatia cortada)
  }
  vec3 nF = normalize(cross(dFdx(vP), dFdy(vP))); if (dot(nF, vP) < 0.0) nF = -nF;
  vec3 nn = normalize(mix(vN, nF, 0.85));
  vec3 V = normalize(uCam - vP);
  float dif = max(dot(nn, uSol), 0.0);
  float rim = pow(1.0 - max(dot(nn, V), 0.0), 3.0);
  float amb = (lat < -58.0 && m.r > 0.5) ? 0.55 : 0.30;
  c = c * (amb + 0.8 * dif) + vec3(0.35, 0.6, 1.0) * rim * 0.25;
  gl_FragColor = vec4(c, 1.0);
}`;

// ---------------------------------------------------------------- casca de oceano (altura exagerada)
const MAR_V = /* glsl */ `
varying vec2 vUv; varying vec3 vN, vP; varying float vH;
${GLSL_H}
void main() {
  vUv = uv;
  float lon = uv.x * 360.0 - 180.0, lat = clamp(uv.y * 180.0 - 90.0, -89.6, 89.6), e = 0.4;
  vH = hMar(lat);
  vec3 p0 = geo(lon, lat, ${R0.toFixed(4)} + vH);
  vec3 p1 = geo(lon + e, lat, ${R0.toFixed(4)} + hMar(lat));
  vec3 p2 = geo(lon, lat + e, ${R0.toFixed(4)} + hMar(lat + e));
  vN = normalize(cross(p1 - p0, p2 - p0)); if (dot(vN, p0) < 0.0) vN = -vN;
  vP = p0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p0, 1.0);
}`;
const MAR_F = /* glsl */ `
uniform sampler2D uMask; uniform vec3 uSol, uCam; uniform float uT, uCosta, uMedia;
varying vec2 vUv; varying vec3 vN, vP; varying float vH;
void main() {
  float lon = vUv.x * 360.0 - 180.0, lat = vUv.y * 180.0 - 90.0;
  vec4 m = texture2D(uMask, vUv);
  // tinta da agua: raso ciano -> fundo azul-marinho (como o Continente) + quanto a superficie esta acima da media
  vec3 raso = vec3(0.36, 0.83, 0.90), medio = vec3(0.10, 0.52, 0.80), fundo = vec3(0.03, 0.15, 0.34);
  float viz = 0.0;
  for (int j = 0; j < 6; j++) { float an = float(j) * 1.047; viz = max(viz, texture2D(uMask, vUv + vec2(cos(an) * 0.0042, sin(an) * 0.0084)).r); }
  vec3 c = mix(fundo, medio, 0.55 + 0.45 * smoothstep(0.05, 0.6, m.b)); c = mix(c, raso, max(smoothstep(0.55, 1.0, m.b), viz) * 0.75);
  float anom = vH - uMedia;
  c = mix(c, vec3(0.30, 0.80, 0.95), clamp(anom * 9.0, 0.0, 0.75));
  c = mix(c, vec3(0.02, 0.07, 0.18), clamp(-anom * 14.0, 0.0, 0.6));
  // curvas de nivel da superficie (o morro de agua lido como topografia)
  float k = (vH - uMedia) / 0.012 + 0.5, f = abs(fract(k) - 0.5), w = max(fwidth(k), 0.002);
  float linha = 1.0 - smoothstep(0.0, w * 1.5, abs(f - 0.5));
  c = mix(c, vec3(0.80, 0.96, 1.0), linha * 0.45 * smoothstep(-0.005, 0.02, vH));
  // espuma na costa (borda da mascara)
  c = mix(c, vec3(0.95, 0.99, 1.0), smoothstep(0.18, 0.5, m.r) * 0.85);
  // costas da America Latina acendem quando a agua chega
  float sa = step(-57.0, lat) * step(lat, 14.0) * step(-84.0, lon) * step(lon, -33.0);
  float perto = smoothstep(0.02, 0.45, m.r);
  float onda = 0.6 + 0.4 * sin(uT * 5.0 - lat * 0.4);
  c = mix(c, vec3(1.0, 0.86, 0.45), sa * perto * uCosta * onda);
  vec3 V = normalize(uCam - vP), L = uSol;
  float dif = max(dot(vN, L), 0.0), esp = pow(max(dot(reflect(-L, vN), V), 0.0), 40.0);
  float rim = pow(1.0 - max(dot(vN, V), 0.0), 3.0);
  c = c * (0.42 + 0.7 * dif) + vec3(1.0) * esp * 0.12 + vec3(0.4, 0.7, 1.0) * rim * 0.35;
  gl_FragColor = vec4(c, 1.0);
}`;

// ---------------------------------------------------------------- atmosfera + estrelas
const ATM_V = /* glsl */ `varying vec3 vN, vP; void main() { vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vP = mv.xyz; gl_Position = projectionMatrix * mv; }`;
const ATM_F = /* glsl */ `varying vec3 vN, vP; void main() { float f = pow(1.0 - abs(dot(normalize(vN), normalize(-vP))), 3.0); gl_FragColor = vec4(vec3(0.35, 0.62, 1.0) * f * 0.6, f * 0.6); }`;

export type Tex = {cor: THREE.Texture; mask: THREE.Texture; mar: {w: number; h: number; terra: string}};
let TEX: Tex | null = null; let carregando: Promise<void> | null = null;
export const texGelo = () => TEX;
export const carregaGelo = () => carregando ?? (carregando = (async () => {
  const ld = (f: string) => new Promise<THREE.Texture>((ok, erro) => new THREE.TextureLoader().load(staticFile(f), ok, undefined, erro));
  const [cor, mask, mar] = await Promise.all([ld('eureka/terra_cor.jpg'), ld('eureka/terra_mask.png'), fetch(staticFile('eureka/mar.json')).then((r) => r.json())]);
  cor.colorSpace = THREE.NoColorSpace; cor.anisotropy = 4;
  mask.colorSpace = THREE.NoColorSpace; mask.generateMipmaps = false; mask.minFilter = THREE.LinearFilter; mask.magFilter = THREE.LinearFilter;
  TEX = {cor, mask, mar};
})());
export const terra = (lon: number, lat: number) => {
  const m = TEX!.mar; let x = Math.floor(((lon + 180) / 360) * m.w); x = ((x % m.w) + m.w) % m.w;
  const y = Math.min(m.h - 1, Math.max(0, Math.floor(((90 - lat) / 180) * m.h)));
  return m.terra.charCodeAt(y * m.w + x) === 49;
};
// latitude onde o oceano encontra a Antartida num meridiano (procura do sul para o norte)
export const costaSul = (lon: number) => { for (let lat = -85; lat < -40; lat += 0.5) if (!terra(lon, lat) && !terra(lon, lat + 0.5) && !terra(lon, lat + 1)) return lat + 0.5; return -60; };

export const Globo: React.FC<{t: number; cam: [number, number, number]; sol: [number, number, number]}> = ({t, cam, sol}) => {
  const tx = TEX!;
  const e = estadoGelo(t);
  const geoT = useMemo(() => new THREE.SphereGeometry(1, 600, 300), []);
  const geoM = useMemo(() => new THREE.SphereGeometry(1, 720, 360), []);
  const sun = useMemo(() => new THREE.Vector3(), []); sun.set(...sol).normalize();
  const camV = useMemo(() => new THREE.Vector3(), []); camV.set(...cam);
  const matT = useMemo(() => new THREE.ShaderMaterial({vertexShader: TERRA_V, fragmentShader: TERRA_F,
    uniforms: {uMask: {value: tx.mask}, uCor: {value: tx.cor}, uGelo: {value: 1}, uT0: {value: 0.15}, uSol: {value: sun}, uCam: {value: camV}, uT: {value: 0}, uB: {value: 0}, uS: {value: 0}, uR: {value: 0} }}), [tx]);
  const matM = useMemo(() => new THREE.ShaderMaterial({vertexShader: MAR_V, fragmentShader: MAR_F,
    uniforms: {uMask: {value: tx.mask}, uSol: {value: sun}, uCam: {value: camV}, uT: {value: 0}, uB: {value: 0}, uS: {value: 0}, uR: {value: 0}, uCosta: {value: 0}, uMedia: {value: 0}}}), [tx]);
  const matA = useMemo(() => new THREE.ShaderMaterial({vertexShader: ATM_V, fragmentShader: ATM_F, transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false}), []);
  const media = MEDIA * e.R;
  for (const m of [matT, matM]) { m.uniforms.uB.value = e.B; m.uniforms.uS.value = e.S; m.uniforms.uR.value = e.R; m.uniforms.uT.value = t; }
  matT.uniforms.uGelo.value = e.gelo; matM.uniforms.uCosta.value = sm(126.5, 129.5, t); matM.uniforms.uMedia.value = media;

  // silhueta: a borda do globo mostra a altura da agua contra o espaco. Linhas: superficie de ANTES (branca) e MEDIA (dourada)
  const linhas = useMemo(() => {
    const ant = new THREE.BufferGeometry(), med = new THREE.BufferGeometry();
    const mA = new THREE.LineBasicMaterial({color: '#ffffff', transparent: true, depthTest: false}), mM = new THREE.LineDashedMaterial({color: '#F6C453', transparent: true, depthTest: false, dashSize: 0.025, gapSize: 0.018});
    const oA = new THREE.LineSegments(ant, mA), oM = new THREE.LineSegments(med, mM); oA.frustumCulled = oM.frustumCulled = false; oA.renderOrder = oM.renderOrder = 4;
    return {ant, med, mA, mM, oA, oM};
  }, []);
  {
    const seg = (pts: Limbo[]) => { const out: number[] = []; for (let i = 0; i + 1 < pts.length; i++) if (pts[i].mar && pts[i + 1].mar) out.push(...pts[i].p, ...pts[i + 1].p); return out; };
    linhas.ant.setAttribute('position', new THREE.Float32BufferAttribute(seg(limbo(cam, (la) => R0 + hAntes(la), 100, 335, 240)), 3));
    linhas.med.setAttribute('position', new THREE.Float32BufferAttribute(seg(limbo(cam, () => R0 + media, 100, 335, 240)), 3));
    linhas.oM.computeLineDistances();
  }
  const fant = sm(121.6, 123.0, t), opMed = sm(125.5, 127.5, t);
  linhas.mA.opacity = 0.8 * fant; linhas.mM.opacity = 0.95 * opMed;

  // fluxo: tracos ao longo dos meridianos (linhas de campo): para o polo enquanto o gelo puxa, para o norte quando solta
  const fluxo = useMemo(() => {
    const r = mulb(77), N = 650, s = Array.from({length: N}, () => ({lon: -180 + 360 * r(), f: r(), l: 2.0 + 2.2 * r()}));
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 6), 3));
    return {s, g};
  }, []);
  {
    const P = fluxo.g.attributes.position as THREE.BufferAttribute, C = fluxo.g.attributes.color as THREE.BufferAttribute;
    const inten = 0.8 * (0.25 + 0.75 * Math.max(sm(108, 111, t) * (1 - sm(117, 118, t)) * 0.7, sm(116.4, 118, t), 0) * (1 - 0.6 * sm(129.5, 133, t)));
    fluxo.s.forEach((q, i) => {
      const span = 84, a = 13 + span * ((((q.f + e.desl / span) % 1) + 1) % 1), lat = a - 90;
      const lat2 = lat - e.dir * q.l;                                // cauda atras do movimento
      const ok = !terra(q.lon, lat) && !terra(q.lon, lat2) && lat < 12 && lat2 > -86;
      const fade = ok ? Math.sin(Math.PI * ((a - 13) / span)) * inten : 0;
      const p1 = geo(q.lon, lat, R0 + hMar(lat, e) + 0.004), p2 = geo(q.lon, lat2, R0 + hMar(lat2, e) + 0.004);
      P.setXYZ(i * 2, ...p1); P.setXYZ(i * 2 + 1, ...p2);
      const cab = e.dir < 0 ? [0.75, 0.95, 1.0] : [1.0, 0.92, 0.65];
      C.setXYZ(i * 2, cab[0] * fade, cab[1] * fade, cab[2] * fade); C.setXYZ(i * 2 + 1, 0, 0, 0);
    });
    P.needsUpdate = true; C.needsUpdate = true;
  }
  // aneis de atracao (o "ima"): circulos de latitude que se fecham sobre o gelo e depois se abrem
  const aneis = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(4 * 360 * 6), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(4 * 360 * 6), 3)); return g; }, []);
  {
    const P = aneis.attributes.position as THREE.BufferAttribute, C = aneis.attributes.color as THREE.BufferAttribute;
    const vis = sm(109, 111, t) * (1 - sm(127, 129.5, t));
    for (let k = 0; k < 4; k++) {
      const fr = ((((k / 4 + e.desl / 44) % 1) + 1) % 1), lat = 16 + 44 * fr - 90, al = Math.sin(Math.PI * fr) * vis * 0.55;
      for (let j = 0; j < 360; j++) {
        const l1 = -180 + j, l2 = l1 + 1, ok = !terra(l1, lat) && !terra(l2, lat);
        const i = (k * 360 + j) * 2, h = R0 + hMar(lat, e) + 0.003;
        P.setXYZ(i, ...geo(l1, lat, h)); P.setXYZ(i + 1, ...geo(l2, lat, h));
        const c = ok ? al : 0, cr = e.dir < 0 ? [0.7, 0.92, 1] : [1, 0.9, 0.6];
        C.setXYZ(i, cr[0] * c, cr[1] * c, cr[2] * c); C.setXYZ(i + 1, cr[0] * c, cr[1] * c, cr[2] * c);
      }
    }
    P.needsUpdate = true; C.needsUpdate = true;
  }
  const estrelas = useMemo(() => {
    const r = mulb(5), n = 900, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const z = 2 * r() - 1, a = 2 * Math.PI * r(), s = Math.sqrt(1 - z * z); p[i * 3] = 60 * s * Math.cos(a); p[i * 3 + 1] = 60 * z; p[i * 3 + 2] = 60 * s * Math.sin(a); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); return g;
  }, []);
  return (
    <group>
      <points geometry={estrelas}><pointsMaterial color="#9fb6d8" size={1.6} sizeAttenuation={false} transparent opacity={0.55} /></points>
      <mesh geometry={geoT} material={matT} frustumCulled={false} />
      <mesh geometry={geoM} material={matM} frustumCulled={false} />
      <lineSegments geometry={fluxo.g} frustumCulled={false} renderOrder={3}><lineBasicMaterial vertexColors transparent blending={THREE.AdditiveBlending} depthWrite={false} /></lineSegments>
      <lineSegments geometry={aneis} frustumCulled={false} renderOrder={3}><lineBasicMaterial vertexColors transparent blending={THREE.AdditiveBlending} depthWrite={false} /></lineSegments>
      <primitive object={linhas.oA} visible={fant > 0} />
      <primitive object={linhas.oM} visible={opMed > 0} />
      <mesh material={matA} scale={1.035}><sphereGeometry args={[1, 96, 48]} /></mesh>
    </group>
  );
};
const mulb = (seed: number) => { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let x = s; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; };
