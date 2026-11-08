// Mundo da Cidade do Mexico: Vale do Mexico em relevo real (AWS Terrain Tiles, 1024 x 1316, ~70 m), agua que entra pelo passo
// norte e corre pelos lagos de 1519, cidade (pegadas OSM no centro + casas ao longo das ruas OSM), Zocalo por codigo e bandeira.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {DADOS} from '../../dados';
import {Cam, aplicaCamera, buscaBin, buscaJson, caixaInstanciada, grade, texF16} from './comum';
import {ALB_CDMX, ANEL_F, ANEL_V, ESTADO_CDMX, GLSL_BASE, PREDIO_F, PREDIO_V, TERRENO_F, TERRENO_V} from './glsl';
import {extruda, marcosZocalo} from './geo';

export type MetaCdmx = {W: number; H: number; base: number; x: [number, number]; z: [number, number]; kx: number; kz: number; olon: number; olat: number;
  passo: [number, number, number]; Tentrada: number; Tzocalo: number; Tlago: number; ncasas: number; passo_casas: number; prof_casas: [number, number]; lagos: Record<string, [number, number][]>};
export type DadosCdmx = {m: MetaCdmx; dem: THREE.DataTexture; niv: THREE.DataTexture; agua: THREE.DataTexture; predios: THREE.BufferGeometry;
  casas: THREE.InstancedBufferGeometry; marcos: THREE.BufferGeometry};

export const carregaCdmx = async (): Promise<DadosCdmx> => {
  const m: MetaCdmx = await buscaJson('cdmx/meta.json');
  const [d, n, a, pr, cs] = await Promise.all([buscaBin('cdmx/dem.f16.bin'), buscaBin('cdmx/nivel.f16.bin'), buscaBin('cdmx/agua.f16.bin'), buscaJson('cdmx/predios.json'), buscaBin('cdmx/casas.f32.bin')]);
  return {m, dem: texF16(d, m.W, m.H), niv: texF16(n, m.W, m.H), agua: texF16(a, m.W, m.H, 4), predios: extruda(pr), casas: caixaInstanciada(new Float32Array(cs)),
    marcos: marcosZocalo(240)};
};

// cronograma da agua dentro da bacia (funcao pura do tempo): o mar passa o passo norte (2.280 m) em tc; a frente chega ao
// lago de Xaltocan em 1 s, ao Zocalo em 2,5 s, completa o desenho dos lagos de 1519 em 4,4 s; de 5,7 a 8,9 s cobre o resto do vale
export const cronoCdmx = (m: MetaCdmx, tc: number) => ({
  Tk: [tc, tc + 1.0, tc + 2.5, tc + 4.4, tc + 30, tc + 1000], Fk: [0, m.Tentrada, m.Tzocalo, m.Tlago, m.Tlago * 2, 1e6],
  G0: tc + 5.7, G1: tc + 8.9, Gmax: 14000, tZocalo: tc + 2.5,
});

const SOL = new THREE.Vector3(-0.42, 0.74, 0.52).normalize();
export const CEU_H = new THREE.Color(0.80, 0.88, 0.94), CEU_Z = new THREE.Color(0.38, 0.60, 0.86);

const pegaFrame = (mats: THREE.ShaderMaterial[], f: (u: Record<string, THREE.IUniform>) => void) => mats.forEach((x) => f(x.uniforms));

const Cidade: React.FC<{d: DadosCdmx; L: number; t: number; c: Cam; tc: number; lago: number; ilha: number; fantasma: number}> = ({d, L, t, c, tc, lago, ilha, fantasma}) => {
  const {m} = d;
  const cr = cronoCdmx(m, tc);
  const comuns = useMemo(() => ({
    uDem: {value: d.dem}, uNiv: {value: d.niv}, uAgua: {value: d.agua}, uAguaB: {value: d.agua},
    uX: {value: new THREE.Vector4(m.x[0], m.x[1], m.z[0], m.z[1])}, uTexel: {value: new THREE.Vector2(1 / m.W, 1 / m.H)},
    uPx: {value: new THREE.Vector2((m.x[1] - m.x[0]) / (m.W - 1), (m.z[1] - m.z[0]) / (m.H - 1))}, uBase: {value: m.base},
    uSol: {value: SOL}, uCeuH: {value: CEU_H}, uCeuZ: {value: CEU_Z}, uExag: {value: 1}, uRef: {value: 0},
  }), [d]);
  const novo = () => ({uL: {value: 0}, uT: {value: 0}, uTent: {value: m.Tentrada}, uFk: {value: [0, 0, 0, 0, 0, 0]}, uTk: {value: [0, 0, 0, 0, 0, 0]},
    uG0: {value: 0}, uG1: {value: 0}, uGmax: {value: 1}, uNev0: {value: 1}, uNev1: {value: 2}, uLago: {value: 0}, uIlha: {value: 0}, uEsc: {value: 60}, uFantasma: {value: 0},
    uLarg: {value: 1}, uProf: {value: new THREE.Vector2(14, 14)}, uJanelas: {value: 1}});
  const ALT = /* glsl */ `
float altura(float s, vec2 c) {
  float h = 6.0 + 10.0 * fract(s * 3.71);
  if (fract(s * 91.7) > 0.986) h = 24.0 + 50.0 * fract(s * 17.3);
  return h;
}
vec3 paleta(float s, vec2 c) {
  float k = fract(s * 5.31); vec3 p = vec3(0.88, 0.82, 0.72);
  if (k < 0.18) p = vec3(0.72, 0.36, 0.28); else if (k < 0.33) p = vec3(0.92, 0.76, 0.44); else if (k < 0.44) p = vec3(0.90, 0.64, 0.62);
  else if (k < 0.56) p = vec3(0.94, 0.93, 0.90); else if (k < 0.64) p = vec3(0.58, 0.66, 0.76); else if (k < 0.70) p = vec3(0.58, 0.74, 0.62);
  return p;
}`;
  const mats = useMemo(() => {
    const mk = (v: string, f: string, extra: Record<string, unknown> = {}) => new THREE.ShaderMaterial({vertexShader: v, fragmentShader: f, uniforms: {...comuns, ...novo()}, ...extra});
    const terreno = mk(TERRENO_V(ESTADO_CDMX), TERRENO_F(ESTADO_CDMX, ALB_CDMX));
    const casas = mk(PREDIO_V(ESTADO_CDMX, ALT, true), PREDIO_F);
    const predios = mk(PREDIO_V(ESTADO_CDMX, ALT, false), PREDIO_F, {side: THREE.DoubleSide});
    const marcos = mk(/* glsl */ `
${GLSL_BASE}
${ESTADO_CDMX}
attribute vec3 aCor; attribute float aJan; varying vec3 vWp, vN, vAlb; varying float vSurf, vIdade, vH, vChao, vJan;
void main() { vJan = aJan; vec4 e = estado(uvDe(position.xz)); vWp = position; vN = normal; vSurf = vy(e.y); vIdade = e.z; vH = 1e4; vChao = 240.0; vAlb = aCor;
  gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`, PREDIO_F);
    const bandeira = new THREE.ShaderMaterial({side: THREE.DoubleSide, uniforms: {...comuns, ...novo()}, vertexShader: /* glsl */ `
${GLSL_BASE}
varying vec2 vU; varying vec3 vWp; varying float vSh;
void main() { vU = uv; float x = uv.x * 25.0;
  float ond = sin(x * 0.32 - uT * 4.6) * (0.15 + x * 0.075) + sin(x * 0.71 - uT * 7.1 + uv.y * 2.0) * x * 0.02;
  vSh = cos(x * 0.32 - uT * 4.6);
  vWp = vec3(0.8 + x, 240.0 + 35.7 + uv.y * 14.3 - x * 0.04 * (1.0 - uv.y), ond);
  gl_Position = projectionMatrix * viewMatrix * vec4(vWp, 1.0); }`, fragmentShader: /* glsl */ `
${GLSL_BASE}
varying vec2 vU; varying vec3 vWp; varying float vSh;
void main() { vec3 c = vU.x < 0.333 ? vec3(0.0, 0.45, 0.30) : (vU.x < 0.667 ? vec3(0.97, 0.97, 0.95) : vec3(0.84, 0.10, 0.17));
  float r = length((vU - vec2(0.5, 0.5)) * vec2(25.0, 14.3)); c = mix(c, vec3(0.55, 0.38, 0.18), 1.0 - smoothstep(1.6, 2.0, r));
  c *= 0.78 + 0.3 * vSh; gl_FragColor = vec4(nevoa(c, length(vWp - cameraPosition), vWp, cameraPosition), 1.0); }`});
    return {terreno, casas, predios, marcos, bandeira};
  }, [d]);
  const dist = Math.hypot(c.pos[0] - c.alvo[0], c.pos[1] - c.alvo[1], c.pos[2] - c.alvo[2]);
  pegaFrame(Object.values(mats), (u) => {
    u.uL.value = L; u.uT.value = t; u.uFk.value = cr.Fk; u.uTk.value = cr.Tk; u.uG0.value = cr.G0; u.uG1.value = cr.G1; u.uGmax.value = cr.Gmax;
    u.uNev0.value = dist * 0.9 + 4000; u.uNev1.value = dist * 3.2 + 70000; u.uLago.value = lago; u.uIlha.value = ilha; u.uFantasma.value = fantasma;
    u.uEsc.value = Math.max(14, dist * 0.0032); u.uLarg.value = d.m.passo_casas * 0.9; u.uProf.value.set(...d.m.prof_casas);
  });
  const gTer = grade(m.W - 1, m.H - 1);
  const bandeiraG = useMemo(() => new THREE.PlaneGeometry(1, 1, 40, 14).translate(0.5, 0.5, 0), []);
  return (
    <group>
      <mesh geometry={gTer} material={mats.terreno} frustumCulled={false} />
      <mesh geometry={d.casas} material={mats.casas} frustumCulled={false} />
      <mesh geometry={d.predios} material={mats.predios} frustumCulled={false} />
      <mesh geometry={d.marcos} material={mats.marcos} frustumCulled={false} />
      <mesh geometry={bandeiraG} material={mats.bandeira} frustumCulled={false} />
      <Anel m={m} L={L} dist={dist} />
    </group>
  );
};

// horizonte: relevo grosso do continente (o mesmo dado do video) ao redor do recorte fino (Popocatepetl, Iztaccihuatl, Toluca)
const Anel: React.FC<{m: MetaCdmx; L: number; dist: number}> = ({m, L, dist}) => {
  const D = DADOS!;
  const mat = useMemo(() => new THREE.ShaderMaterial({vertexShader: ANEL_V, fragmentShader: ANEL_F(ALB_CDMX), uniforms: {
    uDemG: {value: D.tex.dem}, uNivG: {value: D.tex.nivel}, uBG: {value: new THREE.Vector4(...D.bounds)},
    uJ: {value: new THREE.Vector4(m.olon - 2.4, m.olat - 2.2, m.olon + 2.4, m.olat + 2.2)}, uL: {value: 0}, uBase: {value: m.base},
    uExag: {value: 1}, uRef: {value: 0}, uOlon: {value: m.olon}, uOlat: {value: m.olat}, uKx: {value: m.kx}, uKz: {value: m.kz},
    uFino: {value: new THREE.Vector4(m.x[0] + 400, m.x[1] - 400, m.z[0] + 400, m.z[1] - 400)}, uTexelG: {value: new THREE.Vector2(1 / D.tw, 1 / D.th)},
    uSol: {value: SOL}, uCeuH: {value: CEU_H}, uCeuZ: {value: CEU_Z}, uNev0: {value: 1}, uNev1: {value: 2}}}), [m]);
  mat.uniforms.uL.value = L; mat.uniforms.uNev0.value = dist * 0.9 + 4000; mat.uniforms.uNev1.value = dist * 3.2 + 70000;
  return <mesh geometry={grade(260, 260)} material={mat} frustumCulled={false} />;
};

export const Camera: React.FC<{c: Cam}> = ({c}) => { const {camera} = useThree(); aplicaCamera(camera, c); return null; };
export const MundoCdmx = Cidade;
