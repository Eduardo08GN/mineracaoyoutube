// Arvores de verdade com o EZ-Tree (@dgreenheck/ez-tree 1.1.0, MIT): estacoes, neve, crescimento e vento, tudo funcao de t.
// Dono: agente Rua. Os outros mundos (Terra, Cidade) usam este wrapper.
//
// ============================== API ==============================
// Presets: 'Oak'|'Ash'|'Aspen'|'Pine' + ' Small'|' Medium'|' Large'  (tipo PresetEZ)
//
// baseArvore(preset, semente) -> BaseArvore
//   Gera a arvore UMA vez por (preset, semente) e guarda em cache (geometria dos galhos + folhas, texturas, altura nativa).
//   Folhas ganham os atributos aRand (sorteio por folha) e aBase (ponto de apoio da folha) para a queda.
//
// estacao(t) -> Estacao {folhas, cor, cor2, neve, grama}
//   Estado das estacoes no segundo t do ORIGINAL a partir de diaDoAno(t) (tempo.ts). Quando o ano passa rapido demais
//   (logTaxa alta, a partir de ~70 s) vira a MEDIA (verde, sem neve), com neve em manchas em 73,5-76,5 s.
//   folhas 0..1 (fracao de folhas na copa), cor/cor2 (cores das folhas: cada folha sorteia entre as duas),
//   neve 0..1 (cobertura; < 1 = manchas no chao), grama (cor da grama para quem quiser casar o chao).
//
// <ArvoreEZ preset semente t pos? rot? altura? folhas? cor? cor2? neve? vento? fade? ladoFade? sombra? />
//   Uma arvore. altura em metros (o tamanho nativo do EZ-Tree e normalizado). Sem folhas/cor/neve explicitos usa estacao(t).
//   fade 0..1 = dissolve (pontilhado de tela), ladoFade 0/1 escolhe a metade complementar (para fundir duas arvores).
//
// <ArvoreCrescendo especie semente t c pos? rot? alturaMin? alturaMax? ...estacao />
//   Muda -> arvore: c 0..1. Small (c<0,4) -> Medium (0,4..0,75) -> Large, com fusao por dissolve de 0,03 entre presets e
//   altura continua alturaMin..alturaMax.
//
// <Floresta lista t folhas? cor? cor2? neve? vento? />
//   Dezenas de arvores: um InstancedMesh por (preset, semente) para galhos e outro para folhas (2 chamadas por variante).
//   ItemFloresta {preset, semente, x, z, altura, rot, nasce?, dur?}: se nasce existir, a arvore brota em [nasce, nasce+dur]
//   (escala 0 -> 1 com leve ultrapassagem); se morre existir, encolhe ate sumir em [morre, morre+durMorre].
//   Cada instancia sorteia sua propria queda de folhas e tom.
//
// florestaPerto() -> ItemFloresta[]
//   A floresta que brota onde era a rua (110,4-115,5 s, todas crescidas antes de 117). Deixa livre o setor de guinada -15..+45 graus
//   (a frente/esquerda: queda das torres e o mar), como no original, onde a floresta fica a direita. O agente Terra usa a MESMA lista a
//   partir de 116 s: <Floresta lista={florestaPerto()} t={t} />. Coordenadas do mundo (olho em 0,1.7,0; rua para -z; +x direita).
// ==================================================================
import React, {useMemo, useState} from 'react';
import * as THREE from 'three';
import {Tree, TreePreset} from '@dgreenheck/ez-tree';
import {continueRender, delayRender} from 'remotion';
import {diaDoAno, logTaxa} from '../tempo';
import {rnd, smooth, clamp01} from './comum';

export type EspecieEZ = 'Oak' | 'Ash' | 'Aspen' | 'Pine';
export type TamanhoEZ = 'Small' | 'Medium' | 'Large';
export type PresetEZ = `${EspecieEZ} ${TamanhoEZ}`;

export type BaseArvore = {galhos: THREE.BufferGeometry; folhas: THREE.BufferGeometry; altura: number;
  casca: {map?: THREE.Texture; normalMap?: THREE.Texture; roughnessMap?: THREE.Texture; aoMap?: THREE.Texture; cor: THREE.Color};
  folhaTex?: THREE.Texture; alphaTest: number; perene: boolean};

const CACHE = new Map<string, BaseArvore>();
export const baseArvore = (preset: PresetEZ, semente: number): BaseArvore => {
  const k = preset + '|' + semente;
  const c = CACHE.get(k);
  if (c) return c;
  const tr = new Tree();
  tr.options.copy(structuredClone((TreePreset as any)[preset]));   // (loadPreset geraria duas vezes)
  tr.options.seed = semente;
  // copas mais cheias que o padrao do EZ-Tree (o original tem copas densas)
  const fo = (tr.options as any).leaves;
  if (fo && !/Pine/.test(preset)) { fo.count = Math.round(fo.count * 1.5); fo.size *= 1.3; }
  tr.generate();
  const galhos = tr.branchesMesh.geometry, folhas = tr.leavesMesh.geometry;
  const mg = tr.branchesMesh.material as THREE.MeshPhongMaterial, mf = tr.leavesMesh.material as THREE.MeshPhongMaterial;
  // por folha (4 vertices por quad; 'double' = 2 quads por folha): sorteio e ponto de apoio (meio da base do primeiro quad)
  const pos = folhas.getAttribute('position') as THREE.BufferAttribute;
  const n = pos.count, porFolha = (tr.options as any).leaves?.billboard === 'double' ? 8 : 4;
  const aRand = new Float32Array(n), aBase = new Float32Array(n * 3);
  for (let f = 0; f * porFolha < n; f++) {
    const v0 = f * porFolha, r = rnd(f * 3.17 + semente * 0.013 + 1);
    const bx = (pos.getX(v0 + 1) + pos.getX(v0 + 2)) / 2, by = (pos.getY(v0 + 1) + pos.getY(v0 + 2)) / 2, bz = (pos.getZ(v0 + 1) + pos.getZ(v0 + 2)) / 2;
    for (let j = 0; j < porFolha && v0 + j < n; j++) { aRand[v0 + j] = r; aBase[(v0 + j) * 3] = bx; aBase[(v0 + j) * 3 + 1] = by; aBase[(v0 + j) * 3 + 2] = bz; }
  }
  folhas.setAttribute('aRand', new THREE.BufferAttribute(aRand, 1));
  folhas.setAttribute('aBase', new THREE.BufferAttribute(aBase, 3));
  galhos.computeBoundingBox(); folhas.computeBoundingBox();
  const bb = galhos.boundingBox!.clone().union(folhas.boundingBox!);
  // a copa pode passar do chao para baixo um pouco: a altura vale do chao (0) ate o topo
  const altura = Math.max(1e-3, bb.max.y);
  galhos.computeBoundingSphere(); folhas.computeBoundingSphere();
  const b: BaseArvore = {galhos, folhas, altura,
    casca: {map: mg.map ?? undefined, normalMap: mg.normalMap ?? undefined, roughnessMap: (mg as any).roughnessMap ?? undefined, aoMap: mg.aoMap ?? undefined, cor: mg.color.clone()},
    folhaTex: mf.map ?? undefined, alphaTest: mf.alphaTest || 0.5, perene: /Pine/.test(preset)};
  mg.dispose(); mf.dispose();
  CACHE.set(k, b);
  return b;
};

// as texturas do EZ-Tree vem embutidas (data URI) e carregam assincronas: segura o quadro ate todas existirem
const useEsperaTexturas = (texs: (THREE.Texture | undefined)[]) => {
  useState(() => {
    const pend = texs.filter((x): x is THREE.Texture => !!x && !(x as any).image);
    if (!pend.length) return null;
    const id = delayRender('ez-tree: texturas');
    let n = 0;
    const tick = () => { if (pend.every((x) => (x as any).image) || ++n > 400) continueRender(id); else setTimeout(tick, 25); };
    tick();
    return id;
  });
};

// ---------- estacoes ----------
export type Estacao = {folhas: number; cor: THREE.Color; cor2: THREE.Color; neve: number; grama: THREE.Color};
const VERDE = new THREE.Color('#4d7330'), VERDE2 = new THREE.Color('#6c8f3a'), BROTO = new THREE.Color('#8fbf4a'), BROTO2 = new THREE.Color('#a9cf5c');
const LARANJA = new THREE.Color('#d9761f'), AMARELO = new THREE.Color('#e3b230'), FERRUGEM = new THREE.Color('#a8481c');
const GRAMA_V = new THREE.Color('#68a03a'), GRAMA_S = new THREE.Color('#c0a65c'), GRAMA_P = new THREE.Color('#82b445');
// distancia circular em dias (d dentro de [a, b] no ano)
const fase = (d: number, a: number, b: number) => { let x = d - a; if (x < -180) x += 365.25; if (x > 185) x -= 365.25; return clamp01(x / (b - a)); };
export const estacaoBruta = (d: number): Estacao => {
  // folhas: viram (15/set-10/out), caem (5-29/nov), nua no inverno, brotam (28/mar-18/abr), escurecem ate maio
  const vira = smooth(0, 1, fase(d, 258, 290));
  const cai = d >= 300 ? fase(d, 309, 333) : d < 60 ? 1 : 0;
  const brota = d >= 60 && d < 200 ? fase(d, 86, 108) : 0;
  let folhas: number, cor: THREE.Color, cor2: THREE.Color;
  if (d >= 200 || d < 60) { // verao tardio -> outono -> inverno
    folhas = d >= 200 ? 1 - cai : 0;
    cor = VERDE.clone().lerp(LARANJA, vira).lerp(FERRUGEM, cai * 0.5);
    cor2 = VERDE2.clone().lerp(AMARELO, vira);
  } else {                  // primavera -> verao
    folhas = brota;
    const amadurece = fase(d, 108, 140);
    cor = BROTO.clone().lerp(VERDE, amadurece); cor2 = BROTO2.clone().lerp(VERDE2, amadurece);
  }
  // neve: cai 1-8/dez, derrete 17-27/mar
  const neve = d >= 300 ? fase(d, 335, 342) : d < 120 ? 1 - fase(d, 76, 86) : 0;
  const seca = d >= 290 || d < 100 ? (d >= 290 ? fase(d, 305, 329) : 1 - fase(d, 84, 110)) : 0;
  const grama = GRAMA_V.clone().lerp(GRAMA_S, seca).lerp(GRAMA_P, d >= 84 && d < 140 ? Math.sin(Math.PI * fase(d, 84, 140)) * 0.6 : 0);
  return {folhas, cor, cor2, neve, grama};
};
// mistura de dois estados (para borrar estacoes ou fundir)
export const misturaEstacao = (a: Estacao, b: Estacao, w: number): Estacao => ({folhas: a.folhas + (b.folhas - a.folhas) * w,
  cor: a.cor.clone().lerp(b.cor, w), cor2: a.cor2.clone().lerp(b.cor2, w), neve: a.neve + (b.neve - a.neve) * w, grama: a.grama.clone().lerp(b.grama, w)});
export const estacao = (t: number): Estacao => {
  const bruta = estacaoBruta(diaDoAno(t));
  const w = t >= 500 ? 0 : smooth(7.2, 7.55, logTaxa(t));      // o ano vira um borrao
  if (w <= 0) return bruta;
  const manchas = 0.42 * smooth(73.2, 74.2, t) * (1 - smooth(76, 77, t));
  const media: Estacao = {folhas: 0.9, cor: new THREE.Color('#557a33'), cor2: new THREE.Color('#7c8f3c'), neve: manchas, grama: new THREE.Color('#6f9a3e')};
  return misturaEstacao(bruta, media, w);
};

// ---------- materiais ----------
type Unis = Record<string, {value: any}>;
const HASH = 'float hashTela(vec2 p){ return fract(sin(dot(floor(p), vec2(12.9898, 78.233))) * 43758.5453); }';
const DISSOLVE = `{ float hh = hashTela(gl_FragCoord.xy); if (uLado < 0.5 ? hh >= uFade : hh < 1.0 - uFade) discard; }`;

export const criaMatGalhos = (b: BaseArvore) => {
  const m = new THREE.MeshStandardMaterial({map: b.casca.map, normalMap: b.casca.normalMap, roughnessMap: b.casca.roughnessMap, aoMap: b.casca.aoMap,
    color: b.casca.cor.clone().multiplyScalar(0.85), roughness: 0.95, metalness: 0});
  const u: Unis = {uNeve: {value: 0}, uFade: {value: 1}, uLado: {value: 0}};
  m.userData.u = u;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nuniform float uNeve; uniform float uFade; uniform float uLado;\n${HASH}`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>\n${DISSOLVE}`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  { vec3 upV = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
    float sn = uNeve * smoothstep(0.05, 0.55, dot(normal, upV) + 0.25 * (uNeve - 0.5));
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.95, 0.98), sn); }`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.6, uNeve * 0.5);');
  };
  m.customProgramCacheKey = () => 'ez_galhos';
  return m;
};

export const criaMatFolhas = (b: BaseArvore) => {
  const m = new THREE.MeshStandardMaterial({map: b.folhaTex, alphaTest: b.alphaTest, side: THREE.DoubleSide, roughness: 0.78, metalness: 0});
  const u: Unis = {uTempo: {value: 0}, uFolhas: {value: 1}, uCor: {value: VERDE.clone()}, uCor2: {value: VERDE2.clone()}, uNeve: {value: 0}, uVento: {value: 0.3},
    uFade: {value: 1}, uLado: {value: 0}, uAltura: {value: b.altura}, uPerene: {value: b.perene ? 1 : 0}};
  m.userData.u = u;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute float aRand; attribute vec3 aBase;
uniform float uTempo; uniform float uFolhas; uniform float uVento; uniform float uAltura; uniform float uPerene;
varying float vRand; varying float vQueda;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
  float ir = 0.0;
  #ifdef USE_INSTANCING
    ir = fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5453);
  #endif
  vRand = fract(aRand + ir);
  // vento: balanco suave de cada folha (fase pela posicao e pelo sorteio), mais forte na ponta da folha (uv.y)
  float ph = vRand * 6.2831 + dot(aBase.xz, vec2(0.11, 0.07));
  vec3 sway = vec3(sin(uTempo * 1.7 + ph) + 0.4 * sin(uTempo * 4.1 + ph * 1.7), 0.3 * sin(uTempo * 2.3 + ph), cos(uTempo * 1.3 + ph * 1.3));
  transformed += sway * uVento * uAltura * 0.006 * (0.4 + uv.y);
  // queda: a folha cujo sorteio passou do limiar desce ate o chao girando e some ao tocar
  float lim = mix(uFolhas, 1.0, uPerene);
  vQueda = clamp((vRand - lim) / 0.18, 0.0, 1.0);
  if (vQueda > 0.0) {
    float q = vQueda * vQueda;
    vec3 rel = transformed - aBase;
    float a = q * 5.0 * (vRand - 0.5);
    rel.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * rel.xz;
    vec3 b2 = aBase; b2.y = mix(aBase.y, 0.01 * uAltura, q); b2.xz += vec2(sin(ph), cos(ph)) * q * uAltura * 0.08;
    transformed = b2 + rel * (1.0 - 0.3 * q);
  }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform vec3 uCor; uniform vec3 uCor2; uniform float uNeve; uniform float uFade; uniform float uLado;
varying float vRand; varying float vQueda;
${HASH}`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>\nif (vQueda > 0.985) discard;\n${DISSOLVE}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
  { float l = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
    vec3 c = mix(uCor, uCor2, step(0.55, vRand)) * (0.35 + 1.25 * l) * (0.86 + 0.28 * fract(vRand * 7.31));
    diffuseColor.rgb = mix(c, vec3(0.92, 0.94, 0.98), uNeve * (0.45 + 0.4 * fract(vRand * 3.7))); }`);
  };
  m.customProgramCacheKey = () => 'ez_folhas';
  return m;
};

type ParamEst = {folhas?: number; cor?: THREE.ColorRepresentation; cor2?: THREE.ColorRepresentation; neve?: number; vento?: number};
const aplica = (mg: THREE.Material, mf: THREE.Material, t: number, p: ParamEst, fade = 1, lado = 0) => {
  const e = (p.folhas === undefined || p.cor === undefined || p.neve === undefined) ? estacao(t) : null;
  const ug = mg.userData.u as Unis, uf = mf.userData.u as Unis;
  const neve = p.neve ?? e!.neve;
  ug.uNeve.value = neve; ug.uFade.value = fade; ug.uLado.value = lado;
  uf.uTempo.value = t; uf.uFolhas.value = p.folhas ?? e!.folhas; uf.uNeve.value = neve; uf.uVento.value = p.vento ?? 0.3;
  (uf.uCor.value as THREE.Color).set(p.cor ?? e!.cor); (uf.uCor2.value as THREE.Color).set(p.cor2 ?? p.cor ?? e!.cor2);
  uf.uFade.value = fade; uf.uLado.value = lado;
};

// ---------- uma arvore ----------
export type PropsArvore = ParamEst & {preset: PresetEZ; semente: number; t: number; pos?: [number, number, number]; rot?: number; altura?: number;
  fade?: number; ladoFade?: number; sombra?: boolean};
export const ArvoreEZ: React.FC<PropsArvore> = ({preset, semente, t, pos = [0, 0, 0], rot = 0, altura = 8, fade = 1, ladoFade = 0, sombra = true, ...p}) => {
  const b = useMemo(() => baseArvore(preset, semente), [preset, semente]);
  useEsperaTexturas([b.casca.map, b.casca.normalMap, b.casca.roughnessMap, b.casca.aoMap, b.folhaTex]);
  const [mg, mf] = useMemo(() => [criaMatGalhos(b), criaMatFolhas(b)], [b]);
  aplica(mg, mf, t, p, fade, ladoFade);
  if (fade <= 0.001) return null;
  const s = altura / b.altura;
  return (
    <group position={pos} rotation={[0, rot, 0]} scale={s}>
      <mesh geometry={b.galhos} material={mg} castShadow={sombra} receiveShadow />
      <mesh geometry={b.folhas} material={mf} castShadow={sombra} receiveShadow />
    </group>
  );
};

// ---------- muda que vira arvore ----------
export const ArvoreCrescendo: React.FC<ParamEst & {especie: EspecieEZ; semente: number; t: number; c: number; pos?: [number, number, number]; rot?: number;
  alturaMin?: number; alturaMax?: number}> = ({especie, semente, t, c, pos, rot, alturaMin = 1.6, alturaMax = 14, ...p}) => {
  const h = alturaMin + (alturaMax - alturaMin) * Math.pow(clamp01(c), 1.15);
  const F = 0.03;
  const peso = (centro: number) => clamp01(0.5 + (c - centro) / F);  // 0 antes do limiar, 1 depois
  const kSM = peso(0.4), kML = peso(0.75);
  const fS = 1 - kSM, fM = kSM * (1 - kML), fL = kML;
  return (
    <>
      {fS > 0.001 && <ArvoreEZ preset={`${especie} Small` as PresetEZ} semente={semente} t={t} pos={pos} rot={rot} altura={h} fade={fS} ladoFade={0} {...p} />}
      {fM > 0.001 && <ArvoreEZ preset={`${especie} Medium` as PresetEZ} semente={semente} t={t} pos={pos} rot={rot} altura={h} fade={fS > 0.001 ? fM : fM} ladoFade={fS > 0.001 ? 1 : 0} {...p} />}
      {fL > 0.001 && <ArvoreEZ preset={`${especie} Large` as PresetEZ} semente={semente} t={t} pos={pos} rot={rot} altura={h} fade={fL} ladoFade={1} {...p} />}
    </>
  );
};

// ---------- floresta instanciada ----------
export type ItemFloresta = {preset: PresetEZ; semente: number; x: number; z: number; altura: number; rot: number; nasce?: number; dur?: number; y?: number;
  morre?: number; durMorre?: number};   // morre: encolhe ate sumir em [morre, morre+durMorre]
const VarianteFloresta: React.FC<ParamEst & {preset: PresetEZ; semente: number; itens: ItemFloresta[]; t: number}> = ({preset, semente, itens, t, ...p}) => {
  const b = useMemo(() => baseArvore(preset, semente), [preset, semente]);
  useEsperaTexturas([b.casca.map, b.casca.normalMap, b.casca.roughnessMap, b.casca.aoMap, b.folhaTex]);
  const [mg, mf] = useMemo(() => [criaMatGalhos(b), criaMatFolhas(b)], [b]);
  const [ig, iff] = useMemo(() => {
    const g = new THREE.InstancedMesh(b.galhos, mg, itens.length), f = new THREE.InstancedMesh(b.folhas, mf, itens.length);
    g.castShadow = f.castShadow = true; g.receiveShadow = f.receiveShadow = true;
    g.frustumCulled = f.frustumCulled = false;
    return [g, f];
  }, [b, mg, mf, itens.length]);
  aplica(mg, mf, t, p);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  itens.forEach((it, k) => {
    let g = 1;
    if (it.nasce !== undefined) {
      const u = clamp01((t - it.nasce) / (it.dur ?? 2));
      g = u <= 0 ? 0 : u < 1 ? (1 - Math.pow(1 - u, 3)) * (1 + 0.06 * Math.sin(u * Math.PI)) : 1;
    }
    if (it.morre !== undefined) g *= 1 - smooth(it.morre, it.morre + (it.durMorre ?? 0.4), t);
    const s = Math.max(1e-4, g) * it.altura / b.altura;
    M.compose(P.set(it.x, (it.y ?? 0) - (g <= 0 ? 1e3 : 0), it.z), Q.setFromAxisAngle(Y, it.rot), S.set(s, s, s));
    ig.setMatrixAt(k, M); iff.setMatrixAt(k, M);
  });
  ig.instanceMatrix.needsUpdate = true; iff.instanceMatrix.needsUpdate = true;
  return <><primitive object={ig} /><primitive object={iff} /></>;
};

export const Floresta: React.FC<ParamEst & {lista: ItemFloresta[]; t: number}> = ({lista, t, ...p}) => {
  const grupos = useMemo(() => {
    const m = new Map<string, ItemFloresta[]>();
    lista.forEach((it) => { const k = it.preset + '|' + it.semente; if (!m.has(k)) m.set(k, []); m.get(k)!.push(it); });
    return [...m.entries()];
  }, [lista]);
  return <>{grupos.map(([k, itens]) => <VarianteFloresta key={k} preset={itens[0].preset} semente={itens[0].semente} itens={itens} t={t} {...p} />)}</>;
};

// ---------- a floresta que brota onde era a rua (110,4-117) ----------
const VARIANTES: [PresetEZ, number][] = [['Oak Medium', 11], ['Oak Medium', 23], ['Ash Medium', 5], ['Aspen Medium', 7], ['Oak Large', 3], ['Ash Large', 9]];
let _floresta: ItemFloresta[] | null = null;
export const florestaPerto = (): ItemFloresta[] => {
  if (_floresta) return _floresta;
  const L: ItemFloresta[] = [];
  let i = 0;
  for (let gx = -70; gx <= 80; gx += 11) for (let gz = -8; gz >= -230; gz -= 11) {
    i++;
    const x = gx + (rnd(i * 5.1) - 0.5) * 9, z = gz + (rnd(i * 7.3) - 0.5) * 9;
    const d = Math.hypot(x, z);
    if (d < 13) continue;                                    // clareira em volta de voce (a grama do primeiro plano)
    if (Math.abs(x) < 9 && z > -45) continue;                 // corredor de vista para a frente
    // setor livre de guinada -15..+45 graus (a frente, puxando para a esquerda): la caem as torres (112,8-115,6) e aparece o mar
    // (114,2+). Margem = meia copa (~5 m) vista daquela distancia, para nenhuma copa invadir o setor.
    const g = (Math.atan2(-x, -z) * 180) / Math.PI, m = (Math.atan(5.5 / d) * 180) / Math.PI;
    if (g > -15 - m && g < 45 + m) continue;
    if (rnd(i * 2.9) < 0.3 + 0.3 * smooth(150, 230, d)) continue;   // mais rala no fundo
    const [preset, semente] = VARIANTES[Math.floor(rnd(i * 1.7) * VARIANTES.length)];
    const grande = /Large/.test(preset);
    // brota de perto para longe (a rua some primeiro aos seus pes): 110,4 -> 115
    const nasce = 110.4 + smooth(13, 200, d) * 3.6 + rnd(i * 4.3) * 1.0;
    L.push({preset, semente, x, z, altura: (grande ? 14 : 10) + rnd(i * 3.3) * 6, rot: rnd(i * 9.1) * Math.PI * 2, nasce, dur: 1.4 + rnd(i * 6.7) * 0.8});
  }
  _floresta = L;
  return L;
};
