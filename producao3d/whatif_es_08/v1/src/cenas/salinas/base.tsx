// Base comum das cenas de cidade costeira do video 08 (salinas e bsas): palco 3D, camera por funcao, ceu, sol, nuvens,
// agua em L (metros reais) e o "remendo da agua" que todo material recebe (tinta debaixo d'agua, faixa molhada, espuma na
// linha d'agua de qualquer objeto que fura a superficie: os aneis de espuma dos predios saem daqui, sem lista de pegadas).
// Pecas do batedor 07 (D:/whatif_es/07_batedor_fab: comum.tsx, malecon.tsx, fab.tsx) adaptadas. Tudo funcao pura de (t, u, L).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useFrame, useLoader, useThree} from '@react-three/fiber';
import {Cloud, Clouds, useGLTF, useTexture} from '@react-three/drei';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js';
import {staticFile} from 'remotion';
import plano from '../../plano.json';
import {nivelEm} from '../../nivel';

// o Chrome do render compila shaders em paralelo e o primeiro quadro de cada aba saia sem materiais (licao do video 6)
for (const C of [typeof WebGL2RenderingContext !== 'undefined' ? WebGL2RenderingContext : null, typeof WebGLRenderingContext !== 'undefined' ? WebGLRenderingContext : null]) {
  if (!C || (C.prototype as any).__semParalelo) continue;
  const orig = C.prototype.getExtension;
  (C.prototype as any).getExtension = function (this: WebGLRenderingContext, nome: string) { return nome === 'KHR_parallel_shader_compile' ? null : orig.call(this, nome); };
  (C.prototype as any).__semParalelo = true;
}

export const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (a: number, b: number, x: number) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const lerp3 = (a: number[], b: number[], u: number): [number, number, number] => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
export const fmtDec = (v: number, n = 1) => v.toFixed(n).replace('.', ',');
// ease suave que nunca para (camera em dolly continuo: velocidade minima 40% da media)
export const easeCam = (u: number) => { const x = clamp01(u); return 0.4 * x + 0.6 * x * x * (3 - 2 * x); };

// ---------------------------------------------------------------- tempo em que o mar chega a um nivel (tabela pura, busca binaria)
const PASSO = 1 / 120, NT = Math.ceil(plano.dauer / PASSO) + 2;
const TAB = (() => { const a = new Float32Array(NT); for (let i = 0; i < NT; i++) a[i] = nivelEm(i * PASSO); return a; })();
export const tNivel = (m: number) => {
  if (TAB[0] >= m) return 0;
  if (TAB[NT - 1] < m) return 1e9;
  let a = 0, b = NT - 1;
  while (b - a > 1) { const c = (a + b) >> 1; if (TAB[c] >= m) b = c; else a = c; }
  const f = (m - TAB[a]) / Math.max(1e-9, TAB[b] - TAB[a]);
  return (a + f) * PASSO;
};

// ---------------------------------------------------------------- camera do quadro (a MESMA conta serve aos rotulos 2D)
export type Cam = {pos: [number, number, number]; alvo: [number, number, number]; fov: number};
export const CameraDoQuadro: React.FC<{c: Cam; far?: number}> = ({c, far = 9000}) => {
  const {camera} = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...c.pos); cam.fov = c.fov; cam.near = 0.3; cam.far = far; cam.aspect = 16 / 9;
  cam.lookAt(...c.alvo); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  return null;
};
const _cam = new THREE.PerspectiveCamera(50, 16 / 9, 0.3, 9000);
export const projetar = (c: Cam, w: [number, number, number]) => {
  _cam.fov = c.fov; _cam.aspect = 16 / 9; _cam.position.set(...c.pos); _cam.lookAt(...c.alvo); _cam.updateProjectionMatrix(); _cam.updateMatrixWorld();
  const v = new THREE.Vector3(...w).project(_cam);
  return {x: (v.x * 0.5 + 0.5) * 1920, y: (-v.y * 0.5 + 0.5) * 1080, frente: v.z < 1 && v.z > -1};
};

// as nuvens do drei leem matrixWorld no useFrame; num still ainda era a identidade. Atualiza ANTES (prioridade negativa).
export const AtualizaMatrizes: React.FC = () => { const {scene} = useThree(); useFrame(() => { scene.updateMatrixWorld(true); }, -1); return null; };

// ---------------------------------------------------------------- luz do dia
export type Luz = {dia: number; ocaso: number; sol: THREE.Vector3};
export const luzDe = (elev: number, azim: number): Luz => ({dia: 1, ocaso: 0,
  sol: new THREE.Vector3(Math.cos(elev) * Math.sin(azim), Math.sin(elev), Math.cos(elev) * Math.cos(azim)).normalize()});

// ceu de dia estilizado (gradiente saturado + disco do sol); do batedor 07 (comum.tsx), so a parte do dia
const CEU_VS = `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const CEU_FS = `
uniform vec3 uSol; uniform vec3 uHor; uniform vec3 uMeio; uniform vec3 uZen; varying vec3 vD;
void main(){
  vec3 d = normalize(vD); float h = max(d.y, 0.0);
  vec3 c = mix(uHor, uMeio, smoothstep(0.0, 0.22, h));
  c = mix(c, uZen, smoothstep(0.22, 0.85, h));
  float s = max(dot(d, normalize(uSol)), 0.0);
  c += pow(s, 900.0) * 4.0 + pow(s, 10.0) * 0.18 * vec3(1.0, 0.95, 0.85);
  gl_FragColor = vec4(pow(max(c, vec3(0.0)), vec3(2.2)), 1.0);
}`;
export const Ceu: React.FC<{luz: Luz; centro: [number, number, number]; raio?: number; hor?: string; meio?: string; zen?: string}> =
  ({luz, centro, raio = 6000, hor = '#e4eef3', meio = '#9cc8ea', zen = '#4a8fd6'}) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false, vertexShader: CEU_VS, fragmentShader: CEU_FS,
    uniforms: {uSol: {value: new THREE.Vector3(0, 1, 0)}, uHor: {value: new THREE.Color()}, uMeio: {value: new THREE.Color()}, uZen: {value: new THREE.Color()}}}), []);
  mat.uniforms.uSol.value.copy(luz.sol); mat.uniforms.uHor.value.set(hor); mat.uniforms.uMeio.value.set(meio); mat.uniforms.uZen.value.set(zen);
  return <mesh material={mat} position={centro} scale={raio} renderOrder={-10} frustumCulled={false}><sphereGeometry args={[1, 48, 24]} /></mesh>;
};

// sol com sombra que acompanha um foco (centro em passos de texel: a sombra nao "ferve" com a camera andando)
export const Sol: React.FC<{luz: Luz; foco: THREE.Vector3; area?: number; forca?: number; ceu?: number}> = ({luz, foco, area = 80, forca = 3.0, ceu = 1.0}) => {
  const alvo = useMemo(() => new THREE.Object3D(), []);
  const dir = luz.sol.clone().normalize(), dr = new THREE.Vector3(0, 1, 0).cross(dir).normalize(), du = dir.clone().cross(dr);
  const tx = (2 * area) / 4096, snap = (v: number) => Math.round(v / tx) * tx;
  const centro = dr.clone().multiplyScalar(snap(foco.dot(dr))).add(du.clone().multiplyScalar(snap(foco.dot(du)))).add(dir.clone().multiplyScalar(foco.dot(dir)));
  alvo.position.copy(centro); alvo.updateMatrixWorld();
  const pos = centro.clone().add(dir.clone().multiplyScalar(400));
  return (
    <>
      <primitive object={alvo} />
      <directionalLight position={pos.toArray()} target={alvo} intensity={forca} color="#fff4e2" castShadow
        shadow-mapSize={[4096, 4096]} shadow-camera-left={-area} shadow-camera-right={area} shadow-camera-top={area} shadow-camera-bottom={-area}
        shadow-camera-near={1} shadow-camera-far={1000} shadow-bias={-0.0004} shadow-normalBias={0.03} />
      <hemisphereLight args={[new THREE.Color(0.78, 0.88, 1.0), new THREE.Color(0.55, 0.5, 0.42), 1.25 * ceu]} />
    </>
  );
};

// nuvens do drei (seed fixa, speed 0; a deriva e funcao de t). Textura de tufo do batedor 07 (nossa).
export const Nuvens: React.FC<{t: number; n?: number; centro: [number, number]; dir: [number, number]; dist?: number; largura?: number; altura?: number}> =
  ({t, n = 12, centro, dir, dist = 700, largura = 1600, altura = 160}) => {
  const vento = t * 3;
  const px = -dir[1], pz = dir[0];
  return (
    <Clouds material={THREE.MeshLambertMaterial} texture={staticFile('salinas/nuvem_tufo.png')} limit={300} frustumCulled={false}>
      {Array.from({length: n}, (_, k) => {
        const lado = -largura / 2 + ((k + rnd(k) * 0.8) / n) * largura + vento;
        const prof = dist + rnd(k + 5) * dist * 0.8;
        const x = centro[0] + dir[0] * prof + px * lado, z = centro[1] + dir[1] * prof + pz * lado, y = altura + rnd(k + 9) * altura * 0.5;
        return <Cloud key={k} seed={k + 1} segments={20} bounds={[50 + rnd(k + 3) * 40, 10, 20]} volume={44 + rnd(k + 7) * 26} smallestVolume={0.4}
          growth={4} speed={0} fade={80} opacity={0.95} color="#ffffff" position={[x, y, z]} />;
      })}
    </Clouds>
  );
};

// ambiente HDRI (Poly Haven, CC0): luz de ceu e reflexo dos materiais PBR
export const useHDR = () => useLoader(RGBELoader, staticFile('salinas/hdri/kloofendal_48d_partly_cloudy_puresky_2k.hdr'));
export const Ambiente: React.FC<{intens?: number}> = ({intens = 0.55}) => {
  const {scene} = useThree();
  const hdr = useHDR();
  useMemo(() => { hdr.mapping = THREE.EquirectangularReflectionMapping; }, [hdr]);
  scene.environment = hdr; (scene as any).environmentIntensity = intens;
  return null;
};

// ---------------------------------------------------------------- remendo da agua em qualquer material (L real em metros)
// debaixo d'agua: tinta da agua que escurece com a profundidade; logo acima: faixa molhada; na linha d'agua: espuma com ruido.
export const AGUA = {
  uL: {value: 0}, uT: {value: 0}, uTurb: {value: 3.0}, uMolhado: {value: 0.35}, uEspBrilho: {value: 2.0}, uEspLarg: {value: 0.22},
  uCorFundo: {value: new THREE.Color(0.02, 0.16, 0.22)}, uTinta: {value: new THREE.Color(0.45, 0.78, 0.82)},
};
export const comAgua = (m: THREE.Material) => {
  if ((m as any).__agua || !(m as any).isMaterial) return m;
  (m as any).__agua = true;
  const antes = m.onBeforeCompile?.bind(m);
  const chave = m.customProgramCacheKey?.bind(m);
  m.onBeforeCompile = (sh, r) => {
    if (antes) antes(sh, r);
    Object.assign(sh.uniforms, AGUA);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vAguaW;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
  { vec4 aw = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    aw = instanceMatrix * aw;
  #endif
    vAguaW = (modelMatrix * aw).xyz; }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vAguaW;
uniform float uL; uniform float uT; uniform float uTurb; uniform float uMolhado; uniform float uEspBrilho; uniform float uEspLarg; uniform vec3 uCorFundo; uniform vec3 uTinta;
float hA(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5); }
float nA(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(hA(i), hA(i+vec2(1,0)), f.x), mix(hA(i+vec2(0,1)), hA(i+vec2(1,1)), f.x), f.y); }`)
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>
  {
    float dz = vAguaW.y - uL;
    vec2 q = vAguaW.xz + vec2(vAguaW.y * 0.7);
    float ru = nA(q * 0.9 + vec2(uT * 0.35, -uT * 0.22)) * 0.6 + nA(q * 3.1 - vec2(uT * 0.5, uT * 0.3)) * 0.4;
    float onda = (ru - 0.5) * 0.16 + 0.05 * sin(uT * 1.7 + dot(vAguaW.xz, vec2(0.21, 0.17)));
    vec3 c = gl_FragColor.rgb;
    if (dz < onda) {
      float k = 1.0 - exp((dz - onda) / uTurb);
      c = mix(c * uTinta, uCorFundo, clamp(k, 0.0, 0.97));
    } else {
      float molh = 1.0 - smoothstep(0.0, uMolhado * (0.6 + 0.8 * ru), dz - onda);
      c *= 1.0 - 0.42 * molh;
    }
    float e = 1.0 - smoothstep(0.0, uEspLarg * (0.5 + ru), abs(dz - onda - 0.02));
    e *= smoothstep(0.25, 0.55, ru + 0.2);
    // piso horizontal rente a agua (lamina rasa): espuma so em manchas, senao o piso inteiro virava espuma branca
    vec3 nW = normalize(cross(dFdx(vAguaW), dFdy(vAguaW)));
    float hor = smoothstep(0.8, 0.97, abs(nW.y));
    e *= mix(1.0, 0.45 * smoothstep(0.5, 0.8, ru), hor);
    c = mix(c, vec3(uEspBrilho), e * 0.9);
    gl_FragColor.rgb = c;
  }`);
  };
  m.customProgramCacheKey = () => (chave ? chave() : '') + '|agua1';
  m.needsUpdate = true;
  return m;
};
export const aguaEmTudo = (o: THREE.Object3D) => {
  o.traverse((x: any) => {
    if (!x.isMesh) return;
    if (Array.isArray(x.material)) x.material.forEach(comAgua); else comAgua(x.material);
  });
  return o;
};
export const atualizaAgua = (L: number, t: number, o: Partial<{turb: number; molhado: number; esp: number; espLarg: number; fundo: string; tinta: string}> = {}) => {
  AGUA.uL.value = L; AGUA.uT.value = t; AGUA.uTurb.value = o.turb ?? 3; AGUA.uMolhado.value = o.molhado ?? 0.35; AGUA.uEspBrilho.value = o.esp ?? 2.0;
  AGUA.uEspLarg.value = o.espLarg ?? 0.22; AGUA.uCorFundo.value.set(o.fundo ?? '#06303c'); AGUA.uTinta.value.set(o.tinta ?? '#7fc6cf');
};

// ---------------------------------------------------------------- superficie da agua (do Mar do batedor 07, parametrizada)
// costa: z da linha d'agua na praia (ondas de espuma chegando e agua rasa transparente); sem costa = mar aberto em toda parte.
const MAR_VS = `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const MAR_FS = `
uniform sampler2D uN; uniform float uT; uniform float uCosta; uniform float uTemCosta; uniform vec3 uSol; uniform float uEspuma; uniform float uAgit;
uniform vec3 uRaso; uniform vec3 uMedio; uniform vec3 uFundo; uniform vec3 uCeu; uniform float uAlfa; uniform vec2 uCorr; uniform float uRiscos;
varying vec3 vW;
void main(){
  float d = uTemCosta > 0.5 ? (uCosta - vW.z) : 40.0;
  vec2 p = vW.xz;
  vec3 n1 = texture2D(uN, p * 0.030 + vec2(uT * 0.020, uT * 0.013) - uCorr * uT * 0.01).rgb * 2.0 - 1.0;
  vec3 n2 = texture2D(uN, p * 0.047 - vec2(uT * 0.017, -uT * 0.011)).rgb * 2.0 - 1.0;
  vec3 N = normalize(vec3((n1.x + n2.x) * (0.30 + uAgit), 1.0, (n1.y + n2.y) * (0.30 + uAgit)));
  vec3 V = normalize(cameraPosition - vW);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 4.0);
  vec3 base = mix(uRaso, uMedio, smoothstep(0.0, 7.0, d));
  base = mix(base, uFundo, smoothstep(7.0, 70.0, d));
  vec3 col = mix(base, uCeu, fres * 0.5 + 0.03);
  float c1 = texture2D(uN, p * 0.13 + uT * 0.030).r, c2 = texture2D(uN, p * 0.10 - uT * 0.026).g;
  float caus = pow(clamp(1.0 - abs(c1 - c2) * 3.2, 0.0, 1.0), 7.0);
  col += caus * (1.0 - smoothstep(1.5, 16.0, d)) * 0.4;
  vec3 R = reflect(-V, N);
  col += pow(max(dot(R, normalize(uSol)), 0.0), 160.0) * 2.0;
  float br = texture2D(uN, p * 0.21 + vec2(uT * 0.05, 0.0)).b;
  float f = 0.0;
  if (uTemCosta > 0.5) {
    f = smoothstep(1.2, 0.0, d);
    for (int k = 0; k < 3; k++) {
      float fk = float(k); float ph = fract(uT * 0.11 + fk / 3.0); float bd = mix(18.0, 0.4, ph);
      f += smoothstep(0.6, 0.0, abs(d - bd)) * (0.55 + 0.45 * sin(p.x * 0.21 + fk * 2.1)) * (1.0 - ph * 0.35);
    }
  }
  // riscos de espuma arrastados pela corrente (a agua entra na terra: le-se o movimento)
  vec2 pc = p - uCorr * uT;
  float ri = texture2D(uN, vec2(pc.x * 0.012, pc.y * 0.05)).b * 0.6 + texture2D(uN, pc * 0.031 + 0.37).r * 0.4;
  f += smoothstep(0.7, 0.82, ri) * uRiscos;
  f = clamp(f * uEspuma, 0.0, 1.0) * smoothstep(0.25, 0.6, br + 0.25);
  col = mix(col, vec3(0.97), f);
  float a = uTemCosta > 0.5 ? smoothstep(-0.05, 0.9, d) : 1.0;
  a *= mix(uAlfa, 1.0, fres);
  a = max(a, f * 0.95);
  gl_FragColor = vec4(pow(max(col, vec3(0.0)), vec3(2.2)), a);
}`;
export const Agua: React.FC<{t: number; L: number; sol: THREE.Vector3; costa?: number; tamanho?: number; centro?: [number, number]; espuma?: number; agit?: number;
  raso?: string; medio?: string; fundo?: string; ceu?: string; alfa?: number; corrente?: [number, number]; riscos?: number}> =
  ({t, L, sol, costa, tamanho = 8000, centro = [0, 0], espuma = 1, agit = 0.1, raso = '#3fd0cf', medio = '#139bb3', fundo = '#0a5a86', ceu = '#a9d0ea', alfa = 0.82,
    corrente = [0, 0], riscos = 0}) => {
  const tn = useTexture(staticFile('salinas/waternormals.jpg'));
  const mat = useMemo(() => {
    tn.wrapS = tn.wrapT = THREE.RepeatWrapping;
    return new THREE.ShaderMaterial({transparent: true, toneMapped: false, vertexShader: MAR_VS, fragmentShader: MAR_FS, depthWrite: true,
      uniforms: {uN: {value: tn}, uT: {value: 0}, uCosta: {value: 0}, uTemCosta: {value: 0}, uSol: {value: new THREE.Vector3()}, uEspuma: {value: 1}, uAgit: {value: 0},
        uRaso: {value: new THREE.Color()}, uMedio: {value: new THREE.Color()}, uFundo: {value: new THREE.Color()}, uCeu: {value: new THREE.Color()}, uAlfa: {value: 0.8},
        uCorr: {value: new THREE.Vector2()}, uRiscos: {value: 0}}});
  }, [tn]);
  const u = mat.uniforms;
  u.uT.value = t; u.uCosta.value = costa ?? 0; u.uTemCosta.value = costa === undefined ? 0 : 1; u.uSol.value.copy(sol); u.uEspuma.value = espuma; u.uAgit.value = agit;
  u.uRaso.value.set(raso); u.uMedio.value.set(medio); u.uFundo.value.set(fundo); u.uCeu.value.set(ceu); u.uAlfa.value = alfa; u.uCorr.value.set(corrente[0], corrente[1]); u.uRiscos.value = riscos;
  return (
    <mesh material={mat} rotation-x={-Math.PI / 2} position={[centro[0], L, centro[1]]} renderOrder={2}>
      <planeGeometry args={[tamanho, tamanho, 1, 1]} />
    </mesh>
  );
};

// ---------------------------------------------------------------- pecas prontas do Fab (catalogo D:/whatif_es/assets/fab/catalogo.json)
export const useFab = (arq: string) => useGLTF(staticFile(arq), false) as unknown as {scene: THREE.Group};
export const clonar = (cena: THREE.Object3D, sombra = true) => {
  const c = cena.clone(true);
  c.traverse((o: any) => { if (o.isMesh) { o.castShadow = sombra; o.receiveShadow = true; } });
  return c;
};
export const usePaletas = (nomes: string[]) => {
  const tex = useTexture(nomes.map((n) => staticFile(`salinas/fab/paletas/${n}.png`)));
  return useMemo(() => {
    const m: Record<string, THREE.Texture> = {};
    tex.forEach((t, i) => { t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.needsUpdate = true; m[nomes[i]] = t; });
    return m;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tex]);
};
export const comPaleta = (obj: THREE.Object3D, mapa: THREE.Texture) => {
  obj.traverse((o: any) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const novos = mats.map((mm: THREE.MeshStandardMaterial) => { const n = mm.clone(); if (n.map) { n.map = mapa; n.needsUpdate = true; } n.roughness = 0.42; n.metalness = 0.1; return comAgua(n); });
    o.material = Array.isArray(o.material) ? novos : novos[0];
  });
  return obj;
};
// tamanho do objeto (m) para normalizar escala pelo catalogo (carro ~1,5 m de altura e 4,3 m de comprimento)
export const caixaDe = (o: THREE.Object3D) => { o.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(o); const s = new THREE.Vector3(); b.getSize(s); return {b, s}; };

// predios soltos do "Small Town" (Pedram Ashoori): cada torre vira uma peca com a base centrada na origem
export type Torre = {geo: THREE.BufferGeometry; mat: THREE.Material; larg: number; prof: number; alt: number; nome: string};
export const torresDoSmallTown = (cena: THREE.Object3D): Torre[] => {
  cena.updateMatrixWorld(true);
  const vistos = new Set<string>(), out: Torre[] = [];
  cena.traverse((o: any) => {
    if (!o.isMesh || /Plane|markaz/i.test(o.name)) return;
    const g = (o.geometry as THREE.BufferGeometry).clone();
    // desfaz quantizacao (meshopt) para float e aplica a matriz do no
    const ng = new THREE.BufferGeometry();
    for (const nome of Object.keys(g.attributes)) {
      const a: any = g.attributes[nome], n = a.count, k = a.itemSize, arr = new Float32Array(n * k);
      const get = [a.getX, a.getY, a.getZ, a.getW];
      for (let i = 0; i < n; i++) for (let c = 0; c < k; c++) arr[i * k + c] = get[c].call(a, i);
      ng.setAttribute(nome, new THREE.BufferAttribute(arr, k));
    }
    if (g.index) ng.setIndex(Array.from(g.index.array as ArrayLike<number>));
    ng.applyMatrix4(o.matrixWorld); ng.computeBoundingBox();
    const bb = ng.boundingBox!, chave = `${o.geometry.uuid}`;
    if (vistos.has(chave)) return; vistos.add(chave);
    const cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2;
    ng.translate(-cx, -bb.min.y, -cz); ng.computeBoundingBox(); ng.computeBoundingSphere();
    if (!ng.attributes.normal) ng.computeVertexNormals();
    out.push({geo: ng, mat: o.material, larg: bb.max.x - bb.min.x, prof: bb.max.z - bb.min.z, alt: bb.max.y - bb.min.y, nome: o.name});
  });
  return out.sort((a, b) => a.alt - b.alt);
};

// mesma peca com outra cor de fachada (multiplica a textura): variedade sem asset novo; cache por material + cor
const _tintas = new Map<string, THREE.Material>();
export const tingir = (m: THREE.Material, cor: string) => {
  const k = m.uuid + cor; let n = _tintas.get(k);
  if (!n) { n = (m as THREE.MeshStandardMaterial).clone(); (n as THREE.MeshStandardMaterial).color.multiply(new THREE.Color(cor)); comAgua(n); _tintas.set(k, n); }
  return n;
};
export const tingirTudo = (o: THREE.Object3D, cor: string) => { o.traverse((x: any) => { if (x.isMesh) x.material = Array.isArray(x.material) ? x.material.map((mm: THREE.Material) => tingir(mm, cor)) : tingir(x.material, cor); }); return o; };

// ---------------------------------------------------------------- textura de chao em metros (uv = coordenada do mundo / ladrilho)
export const uvMundo = (g: THREE.BufferGeometry, ladrilho: number, eixo: 'xz' | 'xy' | 'zy' = 'xz') => {
  const p = g.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const a = eixo === 'zy' ? p.getZ(i) : p.getX(i), b = eixo === 'xz' ? p.getZ(i) : p.getY(i);
    uv[i * 2] = a / ladrilho; uv[i * 2 + 1] = b / ladrilho;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
};
export const repete = (t: THREE.Texture, srgb = false) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t; };
