// Terra (agente Terra): o CHAO e a paisagem de 116 a 309,6 s do original. Floresta onde era a rua, geada, lencol de gelo com fendas
// que fluem, degelo, estrobo glacial e flash do asteroide, cânion com estratos, colinas, cordilheira com cume nevado e mar de nuvens,
// erosao e chuva, planicie, oasis e a ultima arvore, deserto, rocha morta, mar no horizonte e salinas.
// O ceu (Sol, listras, estrelas, nuvens de vapor) e do agente Ceu; daqui so a luz (luzEm) e usada.
import React from 'react';
import * as THREE from 'three';
import {useMemo} from 'react';
import {Perfil} from '../look/Look';
import {luzEm} from './ceu';
import {ChaoTerra, NevoaTerra, NOISE_GLSL} from './terra_chao';
import {estadoTerra, chaves} from './terra_estado';
import {ArvoresTerra} from './terra_arvores';
import {estacao} from './arvores';
import {MarHorizonte} from './cidade';

// ---------- cores por trecho (lidas dos quadros do original) ----------
type Cor3 = [number, number, number];
const hex = (h: string): Cor3 => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
const corChaves = (t: number, K: [number, string][]) => {
  const ks = K.map(([tt, h]) => [tt, hex(h)] as [number, Cor3]);
  const r = chaves(t, ks.map(([tt, c]) => [tt, c[0]])), g = chaves(t, ks.map(([tt, c]) => [tt, c[1]])), b = chaves(t, ks.map(([tt, c]) => [tt, c[2]]));
  return new THREE.Color(r, g, b);
};
// cor da nevoa de perspectiva aerea (horizonte) por trecho
const NEVOA_COR: [number, string][] = [
  [116, '#c3c9d2'], [127, '#c9ccd2'], [128.8, '#e4e8ee'], [129.4, '#cfd8e4'], [141, '#d5dbe4'], [141.8, '#c9c4c4'], [150.5, '#b9b4b6'],
  [162.5, '#c2aea3'], [186.5, '#c7ab98'], [189.5, '#a9a9b4'], [200.2, '#a8a2a4'], [200.6, '#9a9ca0'], [201.4, '#9a9ca0'], [202.4, '#c4ad9c'],
  [209, '#d8b694'], [230, '#d0a07c'], [239, '#a68a76'], [246, '#9c8170'], [252, '#8d6a54'], [258, '#4d3e38'], [275, '#3a302c'],
  [297, '#3f3230'], [305, '#7a4434'], [309.6, '#8c4a34']];
// densidade (por metro) e teto da nevoa
const NEVOA_DENS: [number, number][] = [[116, 0.00022], [128.6, 0.0016], [129.3, 0.00016], [137.5, 0.00009], [141.8, 0.0002], [162.4, 0.00016], [162.8, 0.00007], [186.8, 0.00007],
  [187.5, 0.00012], [190, 0.00006], [196, 0.00006], [200.2, 0.00008], [200.6, 0.0012], [201.4, 0.0012], [202.4, 0.00018], [209, 0.00014], [228, 0.00011], [239, 0.0003], [252, 0.00012],
  [260, 0.00006], [309.6, 0.00006]];
const NEVOA_MAX: [number, number][] = [[116, 0.7], [128.6, 0.95], [129.3, 0.78], [162.5, 0.75], [190, 0.88], [200.6, 0.95], [202.4, 0.75], [209, 0.8],
  [252, 0.7], [260, 0.55], [309.6, 0.6]];
// cor do ceu refletida no gelo/agua
const CEU_REFL: [number, string][] = [[116, '#a9bfdc'], [129, '#c4d3e6'], [150.5, '#b3b6c4'], [190, '#c8c4cc'], [209, '#c9b9b0'], [240, '#9a8478'],
  [252, '#5b4a44'], [260, '#2e2828'], [305, '#7a4434']];

export const nevoaEm = (t: number): NevoaTerra => ({cor: corChaves(t, NEVOA_COR), densidade: chaves(t, NEVOA_DENS), max: chaves(t, NEVOA_MAX), de: 9800});

// ---------- perfil do look ----------
const cache = new Map<string, Perfil>();
const q = (x: number, n = 100) => Math.round(x * n) / n;
export const perfilTerra = (t: number): Perfil => {
  const nv = nevoaEm(t);
  const e = estadoTerra(t);
  // contraste por trecho: gelo e cume claros (menos contraste), canion e deserto mais duros, terra morta escura
  const contraste = chaves(t, [[116, 0.06], [129.3, 0.0], [150.5, 0.06], [162.5, 0.1], [187.5, 0.06], [190, 0.02], [202.5, 0.06], [209, 0.1], [252, 0.12], [309.6, 0.1]]);
  const saturacao = chaves(t, [[116, -0.05], [129.3, -0.12], [150.5, -0.04], [190, -0.1], [202.5, -0.04], [252, -0.1]]);
  const raios = t >= 252 ? 0 : chaves(t, [[116, 0.32], [190, 0.4], [209, 0.38], [239, 0.15], [251, 0.15], [252, 0]]);
  const bloom = 0.42 + e.flash * 1.4;
  const p: Perfil = {bloom: q(bloom), limiar: q(0.88 - e.flash * 0.5), saturacao: q(saturacao), contraste: q(contraste), vinheta: 0.34,
    nevoa: {cor: '#' + nv.cor.getHexString(), densidade: q(nv.densidade, 1e6), max: q(nv.max)}, raios: q(raios)};
  const k = JSON.stringify(p);
  let c = cache.get(k);
  if (!c) { c = p; if (cache.size > 400) cache.clear(); cache.set(k, c); }
  return c;
};

// ---------- veu em volta da camera: flash do asteroide (branco-bege que decai como nevoa) e chuva ----------
const VEU_FS = `
uniform vec3 uCor; uniform float uA; uniform float uChuva; uniform float uT; varying vec3 vD;
${NOISE_GLSL}
void main(){
  vec3 d = normalize(vD);
  float a = uA;
  // nevoa do flash mais densa perto do horizonte e embaixo
  a *= mix(1.0, 0.82, smoothstep(-0.1, 0.6, d.y));
  vec3 c = uCor;
  if (uChuva > 0.0) {
    float ang = atan(d.z, d.x);
    vec2 uv = vec2(ang * 140.0, d.y * 9.0 + uT * 26.0);
    float risco = smoothstep(0.82, 0.98, gn(vec2(uv.x, uv.y * 0.12 + floor(uv.x) * 7.1)) * 0.5 + 0.5);
    c = mix(c, c * 1.35, risco * 0.6);
    a = clamp(a + risco * 0.15 * uChuva, 0.0, 1.0);
  }
  gl_FragColor = vec4(c, a);
}`;
const Veu: React.FC<{cor: THREE.Color; a: number; chuva: number; t: number; pos: THREE.Vector3}> = ({cor, a, chuva, t, pos}) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({side: THREE.BackSide, transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: VEU_FS, uniforms: {uCor: {value: new THREE.Color()}, uA: {value: 0}, uChuva: {value: 0}, uT: {value: 0}}}), []);
  (mat.uniforms.uCor.value as THREE.Color).copy(cor); mat.uniforms.uA.value = a; mat.uniforms.uChuva.value = chuva; mat.uniforms.uT.value = t;
  return <mesh material={mat} position={pos.toArray()} renderOrder={9000} frustumCulled={false}><sphereGeometry args={[20, 32, 16]} /></mesh>;
};

// ---------- mar de nuvens abaixo do cume (190-199 s) ----------
const NUV_FS = `
uniform float uT; uniform float uA; uniform vec3 uLuz; uniform vec3 uSombra; uniform vec3 uNev; varying vec3 vW;
${NOISE_GLSL}
void main(){
  vec2 p = vW.xz;
  float d = length(vW - cameraPosition);
  vec2 q = p / 3800.0 + vec2(uT * 0.06, uT * 0.02);
  float n = fbm5(q + 0.6 * vec2(fbm3(q * 0.5 + 3.0), fbm3(q * 0.5 - 2.0))) + 0.25 * fbm3(p / 600.0 + uT * 0.2);
  float dens = smoothstep(0.08, 0.42, n);
  float topo = smoothstep(0.1, 0.7, n);
  vec3 c = mix(uSombra, uLuz, 0.25 + 0.75 * topo);
  float a = dens * uA * (1.0 - smoothstep(25000.0, 70000.0, d)) * smoothstep(800.0, 3000.0, d);
  c = mix(c, uNev, smoothstep(5000.0, 60000.0, d) * 0.85);
  gl_FragColor = vec4(c, a);
}`;
const NuvensBaixas: React.FC<{t: number; a: number; y: number; luz: THREE.Color; nev: THREE.Color}> = ({t, a, y, luz, nev}) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: NUV_FS, uniforms: {uT: {value: 0}, uA: {value: 0}, uLuz: {value: new THREE.Color()}, uSombra: {value: new THREE.Color()}, uNev: {value: new THREE.Color()}}}), []);
  mat.uniforms.uT.value = t; mat.uniforms.uA.value = a;
  (mat.uniforms.uLuz.value as THREE.Color).copy(luz); (mat.uniforms.uSombra.value as THREE.Color).copy(luz).multiplyScalar(0.62).lerp(new THREE.Color(0.45, 0.47, 0.55), 0.3);
  (mat.uniforms.uNev.value as THREE.Color).copy(nev);
  return <mesh material={mat} position={[0, y, 0]} rotation-x={-Math.PI / 2} renderOrder={5} frustumCulled={false}><circleGeometry args={[80000, 96]} /></mesh>;
};

const smooth01 = (x: number) => { const u = Math.min(1, Math.max(0, x)); return u * u * (3 - 2 * u); };

export const Terra: React.FC<{t: number}> = ({t}) => {
  const e = estadoTerra(t);
  const luz = luzEm(t);
  const nv = nevoaEm(t);
  const ceuCor = corChaves(t, CEU_REFL);
  const olho = new THREE.Vector3(0, e.hc + 1.7, 0);
  // compensa ceus escuros (oceanos fervendo: o Sol some atras do vapor) para o chao nao virar breu
  const irr = luz.intensidade * Math.max(0.2, luz.sol.y) + luz.ambienteForca * 0.8;
  const comp = Math.min(2.0, Math.max(1, 1.6 / Math.max(0.1, irr)));
  // exposicao do chao por trecho (gelo e neve brancos como no original; o resto um pouco acima da luz media do ceu)
  const expo = chaves(t, [[117, 1], [121, 1.12]]) + 0.75 * Math.max(e.gelo, e.degelo) + 0.3 * e.cinza + 0.35 * e.mont * smooth01(e.hc / 3000) + 0.1 * e.areia;
  // a floresta some no branco (128,2-129,3): nevasca que cobre tudo e abre no lencol de gelo
  const veuNeve = chaves(t, [[128.1, 0], [128.95, 0.72], [129.12, 0.72], [129.4, 0]]);
  // brilho das nuvens baixas: luz do Sol + ceu
  const luzNuvem = luz.corSol.clone().multiplyScalar(luz.intensidade * 0.55).add(luz.ambiente.clone().multiplyScalar(luz.ambienteForca * 0.8));
  return (
    <>
      <ChaoTerra e={e} luz={luz} nevoa={nv} ceuCor={ceuCor} gramaCor={estacao(t).grama} expo={expo * comp} />
      <ArvoresTerra t={t} e={e} />
      {e.marCid && <MarHorizonte t={t} />}
      {e.nuvemBaixa > 0.001 && <NuvensBaixas t={t} a={e.nuvemBaixa * 0.92} y={e.hc * 0.71} luz={luzNuvem} nev={nv.cor} />}
      {e.flash > 0.001 && <Veu cor={new THREE.Color(4.2, 3.7, 2.9)} a={Math.min(1, e.flash * 1.05)} chuva={0} t={t} pos={olho} />}
      {veuNeve > 0.001 && <Veu cor={new THREE.Color(1.25, 1.3, 1.38)} a={veuNeve} chuva={0} t={t} pos={olho} />}
      {e.chuva > 0.001 && <Veu cor={new THREE.Color(0.36, 0.37, 0.39)} a={e.chuva * 0.62} chuva={e.chuva} t={t} pos={olho} />}
    </>
  );
};
