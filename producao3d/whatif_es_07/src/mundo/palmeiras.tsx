// Palmeiras de verdade (stack de qualidade do video 6): "Free palm treeZ v3" de Yughues/Nobiax (CC0, public/palmeiras/LICENCA.txt).
// 5 modelos OBJ (470-1410 tris) + atlas 2k (casca do tronco em u<0,5; folha recortada por alfa em u>0,5, base v=0 -> ponta v=1).
//
// API ------------------------------------------------------------------------------------------------------------------------------
//   import {Palmeiras, PalmeiraItem} from './palmeiras';
//   <Palmeiras t={t} lista={itens} vento={1} geada={0} sol={dirSol} corSol="#fff1dc" sombra />
//   - lista: PalmeiraItem[] = {x, z, variante, escala?, rot?, y?}
//       variante: 'reta' | 'curva' | 'dupla' | 'duplaCurva' | 'trio'  (ou 0..4 na mesma ordem)
//       escala:   1 = palmeira reta com 9 m de altura (as outras variantes na mesma proporcao do pacote:
//                 curva 7,6 m de altura e 6 m de inclinacao; dupla 9 m; duplaCurva 6,6 m e 8 m de alcance; trio 8,6 m).
//                 Sem escala: 0,85..1,15 por semente.  rot: giro em torno de y (rad; sem rot: por semente).  y: altura da base (0).
//       Monte a lista com useMemo (a lista nova a cada quadro recria as instancias).
//   - t: segundos (o vento e funcao fechada de t: nada acumula entre quadros).
//   - vento: 0 parado, 1 brisa de praia (padrao), 2-3 ventania (tronco inclina e as folhas chicoteiam; use na chegada da onda).
//   - geada: 0..1 embranquece o lado de cima das folhas (e um pouco o tronco), com cintilacao fixa no espaco (Acapulco congelando).
//   - sol: direcao PARA o Sol (mundo). Opcional: liga a translucidez das folhas no contraluz (o mapa de translucidez do pacote).
//   - corSol: cor da luz do Sol para a translucidez (padrao branco-quente). sombra: projeta e recebe sombra (padrao true).
//   Desempenho: um InstancedMesh por variante usada (5 draw calls no maximo + 5 de sombra), geometria e texturas carregadas uma vez.
// -----------------------------------------------------------------------------------------------------------------------------------
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useLoader} from '@react-three/fiber';
import {useTexture} from '@react-three/drei';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
import {staticFile} from 'remotion';
import {rnd} from './comum';

export type VariantePalmeira = 'reta' | 'curva' | 'dupla' | 'duplaCurva' | 'trio';
export type PalmeiraItem = {x: number; z: number; variante: VariantePalmeira | number; escala?: number; rot?: number; y?: number};
export const VARIANTES_PALMEIRA: VariantePalmeira[] = ['reta', 'curva', 'dupla', 'duplaCurva', 'trio'];
const ARQ = ['palm_straight', 'palm_bend', 'palm_dual', 'palm_dual_bend', 'palm_trio'];
const M_POR_UNIDADE = 9 / 214;   // a reta tem ~214 unidades de altura no pacote -> 9 m

// geometria pronta (em metros, base em y=0) + atributo aPalma = (altura 0..1, folha 0/1, ponta da folha 0..1, lado da folha -1..1)
const cacheGeo = new WeakMap<object, THREE.BufferGeometry>();
const prepara = (g: THREE.Group) => {
  const pronta = cacheGeo.get(g);
  if (pronta) return pronta;
  let src: THREE.BufferGeometry | null = null;
  g.traverse((o: any) => { if (!src && o.isMesh) src = o.geometry; });
  const geo = (src as unknown as THREE.BufferGeometry).clone();
  geo.scale(M_POR_UNIDADE, M_POR_UNIDADE, M_POR_UNIDADE);
  geo.computeBoundingBox();
  const pos = geo.attributes.position, uv = geo.attributes.uv, n = pos.count;
  const yMax = geo.boundingBox!.max.y, a = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const u = uv.getX(i), v = uv.getY(i), folha = u > 0.52 ? 1 : 0;
    a[i * 4] = Math.max(0, pos.getY(i)) / yMax;
    a[i * 4 + 1] = folha;
    a[i * 4 + 2] = folha ? Math.min(1, Math.max(0, v)) : 0;
    a[i * 4 + 3] = folha ? (u - 0.7582) / 0.2171 : 0;
  }
  geo.setAttribute('aPalma', new THREE.BufferAttribute(a, 4));
  geo.computeBoundingSphere();
  cacheGeo.set(g, geo);
  return geo;
};

// vento (objeto, em metros, antes da matriz da instancia). Direcao do vento no MUNDO convertida para o espaco da instancia.
const VENTO_VS = `
  vec3 wObj = transpose(mat3(instanceMatrix)) * vec3(uVentoDir.x, 0.0, uVentoDir.y);
  wObj = normalize(vec3(wObj.x, 0.0, wObj.z) + 1e-5);
  float fase = dot(instanceMatrix[3].xz, vec2(0.37, 0.61));
  float hP = aPalma.x;
  float sway = (0.35 + sin(uT * 1.1 + fase) * 0.45 + sin(uT * 2.3 + fase * 1.7) * 0.2) * uVento + 0.18 * uVento * uVento;
  transformed += wObj * sway * 0.45 * hP * hP;
  transformed.y -= abs(sway) * 0.05 * hP * hP;
  float fl = aPalma.y * aPalma.z * aPalma.z;
  float ph = uT * (3.6 + 0.8 * uVento) + position.x * 1.9 + position.z * 1.3 + fase;
  transformed.y += sin(ph) * 0.16 * fl * (0.4 + uVento);
  transformed += wObj * (0.22 + 0.12 * cos(uT * 3.1 + position.z * 1.5 + fase)) * fl * uVento * (0.6 + 0.4 * uVento);
  transformed.y += aPalma.w * sin(uT * 7.0 + position.x * 2.3 + position.y * 1.1 + fase) * 0.07 * fl * (0.3 + uVento);
`;
const DECL_VS = 'uniform float uT; uniform float uVento; uniform vec2 uVentoDir; attribute vec4 aPalma;\n';

const criaMateriais = (map: THREE.Texture, normalMap: THREE.Texture, transl: THREE.Texture) => {
  const u = {uT: {value: 0}, uVento: {value: 1}, uVentoDir: {value: new THREE.Vector2(1, 0.3).normalize()}, uGeada: {value: 0},
    uSol: {value: new THREE.Vector3(0, 1, 0)}, uCorSol: {value: new THREE.Color('#fff1dc')}, uTransl: {value: 0}, uTranslMap: {value: transl}};
  const mat = new THREE.MeshStandardMaterial({map, normalMap, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.78, metalness: 0,
    normalScale: new THREE.Vector2(0.9, 0.9)});
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = DECL_VS + 'varying vec4 vPalma; varying vec3 vNw; varying vec3 vPw;\n' + sh.vertexShader
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + VENTO_VS)
      .replace('#include <project_vertex>', `#include <project_vertex>
  vPalma = aPalma;
  mat4 mI = modelMatrix * instanceMatrix;
  vNw = normalize(mat3(mI) * objectNormal);
  vPw = (mI * vec4(transformed, 1.0)).xyz;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform float uGeada; uniform vec3 uSol; uniform vec3 uCorSol; uniform float uTransl; uniform sampler2D uTranslMap;
varying vec4 vPalma; varying vec3 vNw; varying vec3 vPw;
float hP3(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }
float nP3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hP3(i), hP3(i + vec3(1,0,0)), f.x), mix(hP3(i + vec3(0,1,0)), hP3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hP3(i + vec3(0,0,1)), hP3(i + vec3(1,0,1)), f.x), mix(hP3(i + vec3(0,1,1)), hP3(i + vec3(1,1,1)), f.x), f.y), f.z); }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
  float ehFolha = step(0.5, vPalma.y);
  // casca: o atlas e escuro demais (o batedor viu o tronco quase preto) -> mais claro, cinza-quente de coqueiro
  // (albedo linear medio do atlas: casca 0,05 e folha 0,026 -> casca ~0,22 cinza-quente e folha ~(0,09; 0,14; 0,025))
  vec3 cC = pow(max(diffuseColor.rgb, vec3(0.0)), vec3(0.75));
  float lumC = dot(cC, vec3(0.333));
  vec3 casca = mix(cC, vec3(lumC) * vec3(1.06, 0.97, 0.84), 0.4) * 1.9;
  // folha: verde-amarelado de coqueiro ao sol (o atlas e verde-escuro), mais clara para a ponta
  vec3 folha = diffuseColor.rgb * vec3(3.4, 5.4, 2.6) * (0.9 + 0.25 * vPalma.z);
  diffuseColor.rgb = mix(casca, folha, ehFolha);
  // geada: lado de cima (normal do mundo, a face que a camera ve) + ruido em mundo; cintilacao fixa no espaco
  vec3 nG = normalize(vNw) * (gl_FrontFacing ? 1.0 : -1.0);
  float gN = nP3(vPw * 1.7) * 0.6 + nP3(vPw * 6.0) * 0.4;
  float gMask = uGeada > 0.0 ? clamp(uGeada * 1.6 - 0.25 + (gN - 0.5) * 0.8, 0.0, 1.0) * smoothstep(-0.25, 0.55, nG.y) * mix(0.55, 1.0, ehFolha) : 0.0;
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.91, 0.97), gMask);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, 0.92, gMask);')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  // contraluz: a folha fina deixa o Sol passar (mapa de translucidez do pacote), so quando a camera olha para o Sol
  if (uTransl > 0.0) {
    vec3 V = normalize(cameraPosition - vPw);
    float atras = pow(max(dot(-V, normalize(uSol)), 0.0), 3.0);
    float tr = texture2D(uTranslMap, vMapUv).r;
    totalEmissiveRadiance += ehFolha * (1.0 - gMask) * tr * atras * uTransl * uCorSol * vec3(0.55, 0.75, 0.25);
  }
  float brilho = step(0.988, hP3(floor(vPw * 38.0))) * gMask;
  totalEmissiveRadiance += brilho * 0.9 * vec3(0.9, 0.95, 1.0);`);
  };
  mat.customProgramCacheKey = () => 'palmeira_v1';
  const dep = new THREE.MeshDepthMaterial({depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.5, side: THREE.DoubleSide});
  dep.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = DECL_VS + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + VENTO_VS);
  };
  dep.customProgramCacheKey = () => 'palmeira_sombra_v1';
  return {mat, dep, u};
};

const idVariante = (v: VariantePalmeira | number) => typeof v === 'number' ? Math.max(0, Math.min(4, Math.round(v))) : Math.max(0, VARIANTES_PALMEIRA.indexOf(v));

export const Palmeiras: React.FC<{lista: PalmeiraItem[]; t: number; vento?: number; geada?: number; sol?: THREE.Vector3; corSol?: THREE.ColorRepresentation;
  sombra?: boolean; ventoDir?: [number, number]}> = ({lista, t, vento = 1, geada = 0, sol, corSol = '#fff1dc', sombra = true, ventoDir = [1, 0.3]}) => {
  const grupos = useLoader(OBJLoader, ARQ.map((a) => staticFile(`palmeiras/${a}.obj`))) as THREE.Group[];
  const [map, normalMap, transl] = useTexture([staticFile('palmeiras/palmeira_diff_2k.png'), staticFile('palmeiras/palmeira_normal_2k.jpg'),
    staticFile('palmeiras/palmeira_translucency_2k.jpg')]);
  const {mat, dep, u} = useMemo(() => {
    for (const x of [map, normalMap, transl]) { x.wrapS = x.wrapT = THREE.RepeatWrapping; x.anisotropy = 8; x.needsUpdate = true; }
    map.colorSpace = THREE.SRGBColorSpace; transl.colorSpace = THREE.NoColorSpace; normalMap.colorSpace = THREE.NoColorSpace;
    return criaMateriais(map, normalMap, transl);
  }, [map, normalMap, transl]);
  const malhas = useMemo(() => {
    const porVar: number[][] = [[], [], [], [], []];
    lista.forEach((p, i) => porVar[idVariante(p.variante)].push(i));
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), cor = new THREE.Color(), eixo = new THREE.Vector3(0, 1, 0);
    return porVar.map((idx, v) => {
      if (!idx.length) return null;
      const im = new THREE.InstancedMesh(prepara(grupos[v]), mat, idx.length);
      idx.forEach((i, k) => {
        const p = lista[i], sd = Math.round(p.x * 13.1 + p.z * 7.7) + i * 31;
        const e = p.escala ?? 0.85 + rnd(sd + 1) * 0.3;
        q.setFromAxisAngle(eixo, p.rot ?? rnd(sd + 2) * Math.PI * 2); s.setScalar(e);
        m4.compose(new THREE.Vector3(p.x, p.y ?? 0, p.z), q, s); im.setMatrixAt(k, m4);
        const l = 0.9 + rnd(sd + 3) * 0.2; cor.setRGB(l * (0.97 + rnd(sd + 4) * 0.06), l, l * (0.95 + rnd(sd + 5) * 0.05)); im.setColorAt(k, cor);
      });
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.customDepthMaterial = dep; im.frustumCulled = false;
      return im;
    });
  }, [lista, grupos, mat, dep]);
  // uniformes do quadro (funcao de t e das props)
  u.uT.value = t; u.uVento.value = vento; u.uGeada.value = geada; u.uVentoDir.value.set(ventoDir[0], ventoDir[1]).normalize();
  u.uTransl.value = sol ? 0.8 : 0; if (sol) u.uSol.value.copy(sol).normalize(); (u.uCorSol.value as THREE.Color).set(corSol);
  return <>{malhas.map((m, k) => m && <primitive key={k} object={m} castShadow={sombra} receiveShadow={sombra} />)}</>;
};
