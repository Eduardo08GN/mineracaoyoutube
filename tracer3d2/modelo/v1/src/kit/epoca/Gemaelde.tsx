// Gemaelde: pintura / gravura / foto de epoca em 2.5D com paralaxe (familia "epoca" do kit). Ver API.md desta pasta.
// Duas camadas deslocadas pelo mapa de profundidade (Depth Anything V2 Small, Apache-2.0, preparado em public/geo/tiefe):
//   frente = malha deslocada em z, com `discard` onde o gradiente de profundidade e alto (nenhum rasgo esticado);
//   fundo  = a mesma imagem com o primeiro plano inpintado (Telea), a -0,012.
// Imagem sem mapa (mapas, cartas): mesma cena, Ken Burns simples sobre geo/fotos/<arquivo>.
// Tudo e funcao pura de t (e do numero do quadro para o grao); sem estado, sem relogio, sem Math.random.
import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import {useTexture} from '@react-three/drei';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C} from '../../ui/basis';
import {F1870} from '../../look/epoche';
import {Flipbook} from '../../welt/t_vfx';
import type {Emissor} from '../../welt/t_vfx';
import {ATLAS_ACAB} from '../acabamento/fumaca';
import {KitProps, Zeit, zeit} from '../tipos';
import INDICE from './indice.json';

type Foco = {x?: number; y?: number; zoom?: number};
export type GemaeldeProps = {
  bild: string;                       // nome sem extensao (chave de geo/fotos/fotos.json)
  von?: Foco; nach?: Foco;            // enquadramento inicial/final: x,y = centro na imagem (0..1, y=0 topo), zoom 1 = cover
  ab?: Zeit; bis?: Zeit;              // quando o movimento comeca/termina (padrao: 0 .. duracao da batida)
  ken?: 'push' | 'pull' | 'pan';      // padrao dos focos e do sentido da paralaxe
  staerke?: number;                   // 0..1, intensidade da paralaxe (padrao 0,6; acima de 0,9 aparece o fundo inpintado)
  partikel?: 'rauch' | 'staub' | 'regen' | null; partikelEm?: Zeit; partikelStaerke?: number;
  label?: string | 'auto' | null; labelEm?: Zeit; labelAus?: Zeit;
  kopf?: {titel: string; sub?: string; em?: Zeit; aus?: Zeit};
  modus?: 'auto' | 'fuellen' | 'karte';   // fuellen = cover; karte = figura inteira sobre fundo desfocado (auto: cover se cortar <= 28 %)
  dauer?: number;                     // duracao do movimento em s (sobrepoe bis)
  schnitt?: number;                   // limiar do gradiente de profundidade que descarta a frente (menor = mais buracos, maior = mais esticao). Padrao 0,25
  korn?: number; vinheta?: number;    // padroes da camada `leve`: 0,045 e 0,5
};

const TELA = 16 / 9, FOV = 30, SOBRESCAN = 1.05, ALTURA_KARTE = 0.88;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (k: number) => k * k * (3 - 2 * k) * 0.6 + k * 0.4;   // mesmo suavizado do Foto
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
const mul = (a: number) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const KEN: Record<string, {von: Foco; nach: Foco; dir: number}> = {
  push: {von: {x: 0.5, y: 0.5, zoom: 1.0}, nach: {x: 0.5, y: 0.5, zoom: 1.12}, dir: 1},
  pull: {von: {x: 0.5, y: 0.5, zoom: 1.12}, nach: {x: 0.5, y: 0.5, zoom: 1.0}, dir: -1},
  pan: {von: {x: 0.32, y: 0.5, zoom: 1.12}, nach: {x: 0.68, y: 0.5, zoom: 1.12}, dir: 1},
};

// ---------------------------------------------------------------- camera (funcao pura de t)
type Plano = {asp: number; ww: number; vh0: number};
type Cam = {fx: number; fy: number; ox: number; oy: number; dist: number};
const calcCam = (p: GemaeldeProps, plano: Plano, modus: 'fuellen' | 'karte', t: number, d: number, b: any, amp: number): Cam => {
  const base = KEN[p.ken ?? 'push'] ?? KEN.push;
  const von = {...base.von, ...p.von}, nach = {...base.nach, ...p.nach};
  const t0 = zeit(b, p.ab, 0), t1 = p.dauer ? t0 + p.dauer : zeit(b, p.bis, Math.max(t0 + 0.5, d));
  const k = clamp((t - t0) / Math.max(0.1, t1 - t0)), e = ease(k);
  const zoom = von.zoom! + (nach.zoom! - von.zoom!) * e;
  const cx = von.x! + (nach.x! - von.x!) * e, cy = von.y! + (nach.y! - von.y!) * e;
  const zef = zoom * (modus === 'fuellen' ? SOBRESCAN : 1);
  const vhz = plano.vh0 / zef, hv = vhz / 2, hw = hv * TELA;
  const margem = amp * 0.5 + 0.004;
  const lx = Math.max(0, plano.ww / 2 - hw - margem), ly = Math.max(0, 0.5 - hv - margem);
  const fx = clamp((cx - 0.5) * plano.ww, -lx, lx), fy = clamp((0.5 - cy) * 1, -ly, ly);
  // paralaxe: varredura monotona -A..+A durante o movimento (depois fica no fim), mais um balanco vertical lento
  const s = -Math.cos(Math.PI * k) * (p.ken === 'pull' ? -1 : 1) * base.dir;
  return {fx, fy, ox: amp * s, oy: amp * 0.22 * Math.sin(t * 0.55 + 1.0), dist: hv / Math.tan((FOV / 2) * Math.PI / 180)};
};

const CameraRig: React.FC<{cam: Cam}> = ({cam}) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const set = () => { camera.position.set(cam.fx + cam.ox, cam.fy + cam.oy, cam.dist); camera.lookAt(cam.fx, cam.fy, 0); camera.updateMatrixWorld(); };
  useLayoutEffect(set);
  useFrame(set, -1);
  return null;
};

// ---------------------------------------------------------------- camadas
const VS_CAMADA = `uniform sampler2D dep; uniform float uD; uniform vec2 uTx; uniform float uZ0; varying vec2 vUv; varying float vE;
void main(){ vUv = uv; float c = texture2D(dep, uv).r;
  float a = texture2D(dep, uv + vec2(uTx.x * 3., 0.)).r, b = texture2D(dep, uv - vec2(uTx.x * 3., 0.)).r, e = texture2D(dep, uv + vec2(0., uTx.y * 3.)).r, f = texture2D(dep, uv - vec2(0., uTx.y * 3.)).r;
  vE = max(max(a, b), max(e, f)) - min(min(a, b), min(e, f));
  vec3 p = position; p.z += (c - 0.5) * uD + uZ0; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`;
const FS_CAMADA = `uniform sampler2D map; uniform float uCut; uniform float uLim; uniform float uTom; varying vec2 vUv; varying float vE;
void main(){ if (uCut > 0.5 && vE > uLim) discard; vec4 c = texture2D(map, vUv); gl_FragColor = vec4(c.rgb * uTom, 1.);
#include <colorspace_fragment>
}`;

const prepCor = (t: THREE.Texture) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.minFilter = THREE.LinearMipmapLinearFilter; t.needsUpdate = true; };
const prepDep = (t: THREE.Texture) => { t.colorSpace = THREE.NoColorSpace; t.generateMipmaps = false; t.minFilter = t.magFilter = THREE.LinearFilter; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true; };

const Camada: React.FC<{plano: Plano; map: THREE.Texture; dep: THREE.Texture; cut: boolean; z0: number; amp: number; lim?: number}> = ({plano, map, dep, cut, z0, amp, lim = 0.075}) => {
  const geo = useMemo(() => new THREE.PlaneGeometry(plano.ww, 1, Math.round(300 * plano.asp), 300), [plano.ww, plano.asp]);
  const mat = useMemo(() => new THREE.ShaderMaterial({vertexShader: VS_CAMADA, fragmentShader: FS_CAMADA, side: THREE.DoubleSide, toneMapped: false,
    uniforms: {map: {value: map}, dep: {value: dep}, uD: {value: 0}, uTx: {value: new THREE.Vector2(1 / dep.image.width, 1 / dep.image.height)}, uCut: {value: cut ? 1 : 0}, uZ0: {value: z0}, uLim: {value: lim}, uTom: {value: 1}}}), [map, dep, cut, z0, lim]);
  mat.uniforms.uD.value = amp;
  return <mesh geometry={geo} material={mat} frustumCulled={false} />;
};

// imagem sem profundidade: um plano, sem deslocamento
const PlanoFlat: React.FC<{plano: Plano; map: THREE.Texture}> = ({plano, map}) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform sampler2D map; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(map, vUv).rgb, 1.);
#include <colorspace_fragment>
}`, uniforms: {map: {value: map}}, toneMapped: false}), [map]);
  return <mesh material={mat} frustumCulled={false}><planeGeometry args={[plano.ww, 1]} /></mesh>;
};

// fundo desfocado da propria imagem (modo karte): 16 pontos em espiral sobre um mip alto, escurecido e dessaturado
const FundoDesfocado: React.FC<{asp: number; map: THREE.Texture}> = ({asp, map}) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform sampler2D map; uniform vec2 uEsc; varying vec2 vUv;
void main(){ vec2 uv = 0.5 + (vUv - 0.5) * uEsc; vec3 s = vec3(0.); float w = 0.;
  for (int i = 0; i < 16; i++) { float a = float(i) * 2.39996, r = sqrt((float(i) + 0.5) / 16.) * 0.035; vec2 o = vec2(cos(a), sin(a)) * r * vec2(1., ${TELA.toFixed(4)}); s += textureLod(map, uv + o, 2.5).rgb; w += 1.; }
  vec3 c = s / w; float l = dot(c, vec3(0.299, 0.587, 0.114)); c = mix(vec3(l), c, 0.75) * 0.5; gl_FragColor = vec4(c, 1.);
#include <colorspace_fragment>
}`, uniforms: {map: {value: map}, uEsc: {value: new THREE.Vector2(asp < TELA ? 1 : TELA / asp, asp < TELA ? asp / TELA : 1)}}, toneMapped: false}), [map, asp]);
  return <mesh material={mat} position={[0, 0, -0.45]} frustumCulled={false}><planeGeometry args={[2.6 * TELA, 2.6]} /></mesh>;
};
const SombraCartao: React.FC<{ww: number}> = ({ww}) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({transparent: true, depthWrite: false, toneMapped: false,
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform vec2 uH; varying vec2 vP; void main(){ vec2 q = abs(vP) - uH; float d = length(max(q, 0.)) + min(max(q.x, q.y), 0.); gl_FragColor = vec4(0., 0., 0., 0.65 * (1. - smoothstep(-0.01, 0.1, d))); }`,
    uniforms: {uH: {value: new THREE.Vector2(ww / 2, 0.5)}}}), [ww]);
  return <mesh material={mat} position={[0, -0.012, -0.14]} frustumCulled={false}><planeGeometry args={[ww + 0.5, 1.5]} /></mesh>;
};

// ---------------------------------------------------------------- particulas
const emissores = (semente: string, ww: number, tipo: 'rauch' | 'staub', t0: number): Emissor[] => {
  const R = mul(Math.floor(hash(semente + tipo) * 1e9)), n = tipo === 'rauch' ? 6 : 6, out: Emissor[] = [];
  for (let i = 0; i < n; i++) {
    const x = (-0.5 + (i + 0.25 + R() * 0.5) / n) * ww * 1.1;
    out.push(tipo === 'rauch' ? {x, y: -0.5 + R() * 0.55, z: 0.12 + R() * 0.2, s: 0.28 + R() * 0.22, t0}
                              : {x, y: -0.5 + R() * 0.3, z: 0.1 + R() * 0.25, s: 0.5 + R() * 0.35, t0});
  }
  return out;
};
const Fumacas: React.FC<{tipo: 'rauch' | 'staub'; semente: string; ww: number; t: number; em: number; forca: number}> = ({tipo, semente, ww, t, em, forca}) => {
  const ems = useMemo(() => emissores(semente, ww, tipo, 0), [semente, ww, tipo]);
  const fade = clamp((t - em) / 1.2);
  if (fade <= 0) return null;
  // o Flipbook escreve pow(cor, 2.2) em saida bruta (pensado para o Look linear): aqui a cor ja vai compensada
  return tipo === 'rauch'
    ? <Flipbook atlas={ATLAS_ACAB.fiapo} emissores={ems} t={t} porEmissor={3} vida={7} sobe={0.22} cresce={0.7} cor="#e9e6df" forca={0.32 * forca * fade} fumaca luz={1.0} espalha={0.7} />
    : <Flipbook atlas={ATLAS_ACAB.nuvem1} emissores={ems} t={t} porEmissor={3} vida={8} sobe={0.06} cresce={0.9} cor="#d8c8a8" forca={0.12 * forca * fade} fumaca luz={1.0} espalha={1.4} />;
};

const VS_CHUVA = `attribute vec4 aS; uniform float uT; uniform vec2 uBox; uniform float uVento; varying float vA;
float h(float x){ return fract(sin(x * 91.7) * 43758.5); }
void main(){ float fim = position.x; // 0 = cabeca, 1 = cauda
  float vel = 0.55 + h(aS.z) * 0.35, len = 0.035 + h(aS.z + 3.) * 0.03;
  float y = fract(aS.y - uT * vel * 0.6) , x = fract(aS.x + uT * uVento * 0.05 * vel);
  vec3 p = vec3((x - 0.5) * uBox.x, (y - 0.5) * uBox.y, 0.05 + h(aS.z + 7.) * 0.35);
  p.x += fim * len * uVento * 0.9; p.y += fim * len;
  vA = (0.25 + 0.35 * h(aS.z + 11.)) * (1. - fim * 0.8);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.); }`;
const Chuva: React.FC<{ww: number; t: number; forca: number}> = ({ww, t, forca}) => {
  const {geo, mat} = useMemo(() => {
    const N = 700, R = mul(4242), pos = new Float32Array(N * 2 * 3), s = new Float32Array(N * 2 * 4);
    for (let i = 0; i < N; i++) { const a = R(), b = R(), c = i + R(); for (let j = 0; j < 2; j++) { pos[(i * 2 + j) * 3] = j; s.set([a, b, c, 0], (i * 2 + j) * 4); } }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aS', new THREE.BufferAttribute(s, 4));
    const mat = new THREE.ShaderMaterial({vertexShader: VS_CHUVA, fragmentShader: 'varying float vA; uniform float uF; void main(){ gl_FragColor = vec4(0.85, 0.88, 0.92, vA * uF); }',
      transparent: true, depthWrite: false, toneMapped: false, uniforms: {uT: {value: 0}, uBox: {value: new THREE.Vector2(ww * 1.5, 1.5)}, uVento: {value: 0.5}, uF: {value: 1}}});
    return {geo, mat};
  }, [ww]);
  mat.uniforms.uT.value = t; mat.uniforms.uF.value = forca;
  return <lineSegments geometry={geo} material={mat} frustumCulled={false} />;
};

// ---------------------------------------------------------------- camada `leve`: grao de pelicula + vinheta (mesmas formulas do LookAcab / GraoEffect / VignetteEffect)
const VS_TELA = 'void main(){ gl_Position = vec4(position.xy, 0., 1.); }';
const Acabamento: React.FC<{korn: number; vinheta: number; quadro: number}> = ({korn, vinheta, quadro}) => {
  const {size} = useThree();
  const grao = useMemo(() => new THREE.ShaderMaterial({vertexShader: VS_TELA, transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
    fragmentShader: `uniform float uF; uniform float uQ; uniform vec2 uRes;
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){ vec2 p = floor(gl_FragCoord.xy / 1.35 * (1920. / uRes.x)); float n = h21(p + uQ * 17.) + h21(p * 1.7 + uQ * 31. + 5.) - 1.;
  gl_FragColor = vec4(vec3(n > 0. ? 1. : 0.), min(1., abs(n) * uF * 1.6)); }`,
    uniforms: {uF: {value: korn}, uQ: {value: 0}, uRes: {value: new THREE.Vector2(size.width, size.height)}}}), [korn, size.width, size.height]);
  grao.uniforms.uQ.value = quadro % 997;
  const vig = useMemo(() => new THREE.ShaderMaterial({vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }', transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
    fragmentShader: `uniform float uD; varying vec2 vUv; void main(){ float d = distance(vUv, vec2(0.5)); float f = smoothstep(0.8, 0.32 * 0.799, d * (uD + 0.32)); gl_FragColor = vec4(0., 0., 0., 1. - f); }`,
    uniforms: {uD: {value: vinheta}}}), [vinheta]);
  return (
    <>
      <mesh material={vig} renderOrder={90} frustumCulled={false}><planeGeometry args={[2, 2]} /></mesh>
      <mesh material={grao} renderOrder={91} frustumCulled={false}><planeGeometry args={[2, 2]} /></mesh>
    </>
  );
};

// ---------------------------------------------------------------- cena
const Mundo: React.FC<{p: GemaeldeProps; t: number; d: number; b: any; quadro: number; tem: boolean; arquivo: string; asp: number}> = ({p, t, d, b, quadro, tem, arquivo, asp}) => {
  const stem = p.bild;
  const urls = tem
    ? ['_p_rgb.jpg', '_p_d.png', '_p_bgrgb.jpg', '_p_bgd.png'].map((s) => staticFile(`geo/tiefe/${stem}${s}`))
    : [staticFile(`geo/fotos/${arquivo}`)];
  const tex = useTexture(urls) as THREE.Texture[];
  useMemo(() => { prepCor(tex[0]); if (tem) { prepDep(tex[1]); prepCor(tex[2]); prepDep(tex[3]); } }, [tex, tem]);
  const aspReal = tex[0].image ? tex[0].image.width / tex[0].image.height : asp;
  const modo: 'fuellen' | 'karte' = p.modus === 'fuellen' || p.modus === 'karte' ? p.modus : (1 - Math.min(1, aspReal / TELA) > 0.28 ? 'karte' : 'fuellen');
  const vh0 = modo === 'fuellen' ? Math.min(1, aspReal / TELA) : 1 / ALTURA_KARTE;
  const plano: Plano = {asp: aspReal, ww: aspReal, vh0};
  const staerke = tem ? clamp(p.staerke ?? 0.6, 0, 1) : 0;
  const amp = tem ? 0.16 * staerke : 0, profundidade = 0.24 * staerke;
  const cam = calcCam(p, plano, modo, t, d, b, amp);
  const part = p.partikel ?? null, pEm = zeit(b, p.partikelEm, 0);
  return (
    <>
      <color attach="background" args={['#0b0a08']} />
      <CameraRig cam={cam} />
      {modo === 'karte' && <><FundoDesfocado asp={aspReal} map={tex[0]} /><SombraCartao ww={aspReal} /></>}
      {tem ? (
        <>
          <Camada plano={plano} map={tex[2]} dep={tex[3]} cut={false} z0={-0.012} amp={profundidade} />
          <Camada plano={plano} map={tex[0]} dep={tex[1]} cut z0={0} amp={profundidade} lim={p.schnitt ?? 0.25} />
        </>
      ) : <PlanoFlat plano={plano} map={tex[0]} />}
      {(part === 'rauch' || part === 'staub') && <Fumacas tipo={part} semente={stem} ww={aspReal} t={t} em={pEm} forca={p.partikelStaerke ?? 1} />}
      {part === 'regen' && <Chuva ww={aspReal} t={t} forca={clamp(t - pEm, 0, 1) * (p.partikelStaerke ?? 1)} />}
      <Acabamento korn={p.korn ?? 0.045} vinheta={p.vinheta ?? 0.5} quadro={quadro} />
    </>
  );
};

const fase = (t: number, a: number, dur = 0.6, ate?: number) => clamp((t - a) / dur) * (ate === undefined ? 1 : clamp((ate - t) / dur));

export const Gemaelde: React.FC<KitProps<GemaeldeProps>> = ({t, d, b, p}) => {
  const {width, height} = useVideoConfig();
  const quadro = useCurrentFrame();
  const meta = (INDICE.fotos as any)[p.bild];
  const tem = (INDICE.tiefe as string[]).includes(p.bild);
  if (!meta) return <AbsoluteFill style={{background: '#0b0a08', color: C.papier, fontFamily: F1870.antiqua, fontSize: 40, padding: 80}}>Gemaelde: bild '{p.bild}' nao esta em geo/fotos/fotos.json</AbsoluteFill>;
  const label = p.label === 'auto' ? meta.rotulo_vorschlag : p.label ?? null;
  const lEm = zeit(b, p.labelEm, 0.4), lAus = p.labelAus !== undefined ? zeit(b, p.labelAus, d) : undefined;
  const k = p.kopf, kEm = k ? zeit(b, k.em, 0.9) : 0, kAus = k && k.aus !== undefined ? zeit(b, k.aus, d) : undefined;
  const lo = fase(t, lEm, 0.7, lAus), ko = fase(t, kEm, 0.7, kAus);
  return (
    <AbsoluteFill style={{background: '#0b0a08'}}>
      <ThreeCanvas width={width} height={height} camera={{fov: FOV, near: 0.01, far: 20, position: [0, 0, 2]}} gl={{antialias: true, toneMapping: THREE.NoToneMapping, preserveDrawingBuffer: false, powerPreference: 'high-performance'}}
        style={{position: 'absolute', inset: 0}}>
        <Mundo p={p} t={t} d={d} b={b} quadro={quadro} tem={tem} arquivo={meta.arquivo} asp={(meta.px?.[0] ?? 1600) / (meta.px?.[1] ?? 900)} />
      </ThreeCanvas>
      {k && <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 440, opacity: ko, background: 'linear-gradient(to top, rgba(8,7,5,0.78), rgba(8,7,5,0))'}} />}
      {label && lo > 0 && <div style={{position: 'absolute', left: 0, top: 0, width: 1250, height: 170, opacity: lo, background: 'radial-gradient(ellipse 80% 100% at 0% 0%, rgba(8,7,5,0.62), rgba(8,7,5,0) 100%)'}} />}
      {label && lo > 0 && (
        <div style={{position: 'absolute', left: 72, top: 54, opacity: lo, transform: `translateY(${(1 - lo) * -8}px)`, fontFamily: F1870.antiqua, fontSize: 27, letterSpacing: 2.6, color: C.papier,
          textShadow: '0 2px 10px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.8)'}}>{label}</div>
      )}
      {k && ko > 0 && (
        <div style={{position: 'absolute', left: 96, bottom: 168, maxWidth: 1450, opacity: ko, transform: `translateY(${(1 - ko) * 14}px)`}}>
          <div style={{fontFamily: F1870.antiqua, fontWeight: 700, fontSize: 60, lineHeight: 1.1, color: C.papier, textShadow: '0 3px 18px rgba(0,0,0,0.95)'}}>{k.titel}</div>
          {k.sub && <div style={{fontFamily: F1870.antiqua, fontStyle: 'italic', fontSize: 32, marginTop: 10, color: C.sepia, textShadow: '0 2px 12px rgba(0,0,0,0.95)'}}>{k.sub}</div>}
        </div>
      )}
    </AbsoluteFill>
  );
};
