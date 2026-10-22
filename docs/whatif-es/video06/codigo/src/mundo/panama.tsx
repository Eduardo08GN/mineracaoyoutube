// Capitulo 7 (132,9-159,9 s do original): CIUDAD DE PANAMA, PUENTE DE LAS AMERICAS (8,9 N), adaptacao da Golden Gate.
// "Ciudad de Panama, dias despues. El agua tambien se va de aqui." / "El Puente de las Americas queda sobre tierra firme."
// Mirante de concreto com guarda-corpo preto na margem oeste da entrada Pacifica do Canal. A ponte (arco trelicado de aco, vao
// central de 344 m, tabuleiro a ~61 m, arcos laterais e acessos sobre pilares) cruza o alto do quadro; o pilar principal oeste fica
// quase no centro. A agua RECUA (nivelMar no Panama desce): 133-146 surgem bancos de areia, 146-153 o leito vira areia bege,
// 153-159,9 a base do pilar fica em terra seca; um porta-conteineres que esperava no canal, rebocadores, veleiros e boias encalham e
// tombam. Ao fundo: ilhas da Calzada de Amador e o skyline da Cidade do Panama na nevoa.
// Ponte por gerador proprio (nenhum modelo livre; receita do batedor): barras instanciadas (cordas, montantes, diagonais, pendurais).
// Camera (mapa): pan lento para a ESQUERDA + push-in leve.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useTexture} from '@react-three/drei';
import {staticFile} from 'remotion';
import {Perfil} from '../look/Look';
import {CeuLugar} from './ceu';
import {Mar, rnd, smooth, clamp01} from './comum';
import {useHDR} from './ambiente';
import {nivelMar} from '../fisica';
import {Floresta, ItemFloresta} from './arvores';
import {ChaoMolhado, ModoAgua} from './chao_molhado';
import {ChaveGP, GLSL_RUIDO, camGP, corNevoa, luzMar, matTriplanar, useCamera, useEnvCostas, useTexCostas} from './gaztelugatxe';

type V3 = [number, number, number];
const T0 = 132.9, T1 = 159.9, LAT = 8.9;

// nivel visual (m): a fisica diz quanto a agua ja desceu (normalizado no capitulo); o desenho leva a 0 -> -17,5 m (a entrada do canal
// tem ~14 m dragados; os baixios secam antes). 140: bancos aparecem; 146: o leito domina; 150-153: base do pilar seca.
const fNivel = (t: number) => { const a = nivelMar(T0, LAT), b = nivelMar(T1, LAT); return clamp01((nivelMar(t, LAT) - a) / (b - a)); };
export const nivelPanama = (t: number) => { const g = fNivel(t); return -17.5 * (0.25 * g + 0.75 * g * g * (3 - 2 * g)); };
const TAXA = 0.8;   // m/s (para a idade do leito exposto: idade ~ (h - nivel) / TAXA)

// ---------- relevo: canal dragado, baixios, margens, morros (Cerro Ancon a leste), ilhas de Amador ao fundo ----------
const xOeste = (z: number) => -226 - Math.max(0, -z - 600) * 0.55 + 14 * Math.sin(z * 0.006);
const xLeste = (z: number) => 290 + Math.max(0, -z - 500) * 0.9 + 18 * Math.sin(z * 0.005 + 1);
const ILHAS: [number, number, number, number][] = [[260, -2750, 230, 95], [700, -3050, 170, 62], [1050, -3350, 260, 118], [-300, -3500, 200, 70]];
const ZP = -200;   // eixo da ponte
const MIR_Y = 14;  // laje do mirante (no alto da margem oeste)
const r1 = (x: number, z: number) => Math.sin(x * 0.013 + z * 0.007) * 0.5 + Math.sin(x * 0.031 - z * 0.019 + 2) * 0.3 + Math.sin(x * 0.071 + z * 0.053 + 4) * 0.2;
export const alturaPanama = (x: number, z: number) => {
  const xc = 8 + z * 0.02, dc = Math.abs(x - xc);
  let h = -6.4 + 1.6 * r1(x, z);
  h += 2.6 * Math.max(0, r1(x * 1.7 + 50, z * 1.3 - 80) - 0.25);                 // bancos de areia (os primeiros a aparecer)
  h = h + (-16.2 - 1.2 * r1(x * 2.1, z * 1.4) - h) * smooth(150, 85, dc);        // canal dragado
  for (const px of [-172, 172]) h -= 4.5 * Math.exp(-((x - px) ** 2 + (z - ZP) ** 2) / 1600);  // fossa de erosao em volta dos pilares
  const dw = x - xOeste(z), de = xLeste(z) - x;
  const terraO = 1.4 - 0.15 * dw + Math.max(0, -dw) * (0.1 + 0.08 * r1(x * 0.5, z * 0.5)) + 52 * smooth(-60, -420, dw) * (0.6 + 0.4 * r1(x * 0.3, z * 0.4));
  const terraL = 1.4 - 0.15 * de + Math.max(0, -de) * 0.12 + 150 * Math.exp(-((x - 1150) ** 2 + (z + 150) ** 2) / 260000);
  h = Math.max(h, terraO, terraL);
  if (x > -298 && x < -230 && z > 27 && z < 66) h = Math.min(h, MIR_Y - 0.6);   // corte do terreno sob o mirante
  for (const [ix, iz, r, ih] of ILHAS) { const d2 = ((x - ix) ** 2 + (z - iz) ** 2) / (r * r); if (d2 < 2.5) h = Math.max(h, -8 + (ih + 8) * Math.exp(-d2 * 1.6)); }
  return h;
};

// ---------- camera (mapa: pan lento para a ESQUERDA + push-in leve) ----------
const CAM: ChaveGP[] = [
  [T0, -262, MIR_Y + 1.65, 35, 23, 3.0, 47],
  [T1, -262.5, MIR_Y + 1.65, 31.5, 12.5, 1.8, 42],
];

// ---------- terreno com leito molhado -> umido -> seco -> rachado (idade de exposicao em formula fechada) ----------
const grade = (lo: number, hi: number, foco: number, raio: number, passo: number) => {
  const out: number[] = []; let x = lo;
  while (x < hi) { out.push(x); const d = Math.max(0, Math.abs(x - foco) - raio); x += passo + d * 0.035; }
  out.push(hi); return out;
};
const Terreno: React.FC<{nivel: {value: number}; env: THREE.Texture; t: number}> = ({nivel, env, t}) => {
  const [gDif, gNor, umDif, umNor, lmDif, lmNor, roDif] = useTexCostas(['sparse_grass_diff_2k.jpg', 'sparse_grass_nor_gl_2k.jpg', 'damp_beach_sand_02_diff_2k.jpg',
    'damp_beach_sand_02_nor_gl_2k.jpg', 'mud_cracked_dry_03_diff_2k.jpg', 'mud_cracked_dry_03_nor_gl_2k.jpg', 'rock_wall_02_diff_2k.jpg']);
  const seca = useTexture(staticFile('tex/coast_sand_01_diff_2k.jpg'));
  useMemo(() => { seca.wrapS = seca.wrapT = THREE.RepeatWrapping; seca.colorSpace = THREE.SRGBColorSpace; seca.anisotropy = 8; seca.needsUpdate = true; }, [seca]);
  const geo = useMemo(() => {
    const xs = grade(-2600, 4200, -60, 380, 3.2), zs = grade(-5200, 700, -260, 420, 3.2);
    const nx = xs.length, nz = zs.length, pos = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2), idx: number[] = [];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const k = j * nx + i; pos[k * 3] = xs[i]; pos[k * 3 + 1] = alturaPanama(xs[i], zs[j]); pos[k * 3 + 2] = zs[j];
      uv[k * 2] = xs[i] / 7; uv[k * 2 + 1] = -zs[j] / 7;
      if (i > 0 && j > 0) { const a = (j - 1) * nx + i - 1, b = a + 1, c = j * nx + i - 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    // triangulo com algum vertice abaixo de 1,5 m = leito (ou praia baixa); o resto = terra firme
    const iL: number[] = [], iT: number[] = [];
    for (let k = 0; k < idx.length; k += 3) {
      const y = Math.min(pos[idx[k] * 3 + 1], pos[idx[k + 1] * 3 + 1], pos[idx[k + 2] * 3 + 1]);
      (y < 1.5 ? iL : iT).push(idx[k], idx[k + 1], idx[k + 2]);
    }
    const gL = g.clone(); gL.setIndex(iL); const gT = g.clone(); gT.setIndex(iT);
    // uv do ChaoMolhado: (x, -z) em metros / repeticao (o shader dele usa as coordenadas de mundo; o uv so orienta o normal map)
    return {gL, gT};
  }, []);
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({roughness: 0.95, metalness: 0, normalMap: gNor, normalScale: new THREE.Vector2(0.9, 0.9), envMap: env, envMapIntensity: 0.7});
    const u = {uGrama: {value: gDif}, uUmida: {value: umDif}, uUmidaN: {value: umNor}, uLama: {value: lmDif}, uLamaN: {value: lmNor}, uSeca: {value: seca}, uRocha: {value: roDif},
      uNivel: nivel, uTaxa: {value: TAXA}};
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMundo; varying vec3 vNMundo;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvMundo = (modelMatrix * vec4(transformed, 1.0)).xyz; vNMundo = objectNormal;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform sampler2D uGrama; uniform sampler2D uUmida; uniform sampler2D uUmidaN; uniform sampler2D uLama; uniform sampler2D uLamaN; uniform sampler2D uSeca; uniform sampler2D uRocha;
uniform float uNivel; uniform float uTaxa;
varying vec3 vMundo; varying vec3 vNMundo; float gRough; float gLeito; float gRach; float gSec;
${GLSL_RUIDO}`)
        .replace('#include <map_fragment>', `#include <map_fragment>
  vec2 q = vMundo.xz; float h = vMundo.y; vec3 nW = normalize(vNMundo);
  float n1 = fbm2(q * 0.02), n2 = fbm2(q * 0.09 + 7.0), n3 = vn2(q * 0.5);
  vec3 gt = texture2D(uGrama, q / 8.0).rgb;
  vec3 gr = mix(gt, vec3(dot(gt, vec3(0.3, 0.59, 0.11))) * vec3(0.46, 0.95, 0.28) * 1.85, 0.78) * (0.62 + 0.55 * n1);
  vec3 ro = texture2D(uRocha, vec2(q.x * 0.7 + q.y * 0.7, h) / 18.0).rgb * vec3(1.05, 1.0, 0.95);
  float ingr = 1.0 - smoothstep(0.5, 0.8, nW.y + (n2 - 0.5) * 0.2);
  vec3 terra = mix(gr, ro, ingr);
  gLeito = 1.0 - smoothstep(0.3, 1.6 + n1, h);
  float idade = (h - uNivel) / uTaxa + (n2 - 0.5) * 3.5;
  vec3 molhada = texture2D(uUmida, q / 7.0).rgb * 0.6;
  vec3 secaC = texture2D(uSeca, q / 9.0).rgb * vec3(1.04, 1.0, 0.92);
  vec3 lama = texture2D(uLama, q / 10.0).rgb * vec3(0.9, 0.84, 0.74);
  gSec = smoothstep(1.5, 9.0, idade);
  vec3 fundo = mix(molhada, mix(molhada * 1.25, secaC, smoothstep(4.0, 9.0, idade)), smoothstep(1.5, 4.0, idade));
  gRach = smoothstep(9.0, 15.0, idade + (n1 - 0.5) * 6.0) * (1.0 - smoothstep(-8.0, -3.5, h));
  fundo = mix(fundo, lama, gRach);
  fundo *= 0.8 + 0.32 * n2;
  float faixa = smoothstep(-2.4, -0.7, h + (n3 - 0.5) * 0.4) * (1.0 - smoothstep(-0.2, 0.7, h));
  fundo = mix(fundo, fundo * vec3(0.48, 0.55, 0.40), faixa * 0.85);
  float poca = smoothstep(0.6, 0.66, fbm2(q * 0.03 + 3.1)) * (1.0 - smoothstep(7.0, 20.0, idade)) * step(0.0, idade) * gLeito;
  fundo = mix(fundo, vec3(0.06, 0.09, 0.11), poca * 0.8);
  vec3 c = mix(terra, fundo, gLeito);
  c *= mix(1.0, 0.5, 1.0 - smoothstep(uNivel - 1.2, uNivel + 0.02, h));
  diffuseColor.rgb = c;
  gRough = mix(0.95, mix(0.16, 0.92, gSec), gLeito); gRough = mix(gRough, 0.04, poca);`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  { vec3 nL = texture2D(uLamaN, q / 10.0).xyz * 2.0 - 1.0; vec3 nU = texture2D(uUmidaN, q / 7.0).xyz * 2.0 - 1.0;
    vec3 mapN2 = mix(nU, nL, gRach); mapN2.xy *= 1.2;
    vec3 nLeito = normalize(tbn * mapN2);
    normal = normalize(mix(normal, nLeito, gLeito)); }`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  roughnessFactor = gRough;`);
    };
    m.customProgramCacheKey = () => 'terreno_panama';
    return m;
  }, [gDif, gNor, umDif, umNor, lmDif, lmNor, roDif, seca, env, nivel]);
  return <>
    <mesh geometry={geo.gT} material={mat} receiveShadow />
    <ChaoMolhado t={t} tamanho={[1, 1]} centro={[0, 0]} agua={AGUA} janela={[T0 - 2, T1 + 1]} chave="panama_v1" geometria={geo.gL} lugar="panama"
      secagem={{umido: 3, seco: 8, racha: 14}} lama={0.55} pocas={0.6} algas={0.55} repeticao={4} irregular={5}
      tufos={{n: 220, area: [-240, -650, 60, -30], escala: 2.2}} />
  </>;
};
const AGUA: ModoAgua = {tipo: 'cota', nivel: (t: number) => nivelPanama(t)};

// ---------- ponte: barras instanciadas ----------
type Barra = {a: V3; b: V3; w: number; w2?: number};
const LH = 172, YS = 9, YCB = 103, DECK = 61, DT = 7, XA = 352, XEND = 900, MEIA = 11;
const yb = (x: number) => YS + (YCB - YS) * (1 - (x / LH) ** 2);
const yt = (x: number) => yb(x) + 8 + 10 * (x / LH) ** 2;
const yDeck = (x: number) => (Math.abs(x) < 420 ? DECK : DECK - (Math.abs(x) - 420) * 0.055);
const ybLat = (x: number) => YS + (DECK - DT - YS) * Math.pow((Math.abs(x) - LH) / (XA - LH), 0.75);
const montaPonte = () => {
  const aco: Barra[] = [], fino: Barra[] = [], conc: Barra[] = [];
  const zs = [ZP - MEIA, ZP + MEIA];
  // arco central (duas costelas trelicadas)
  const nA = 34;
  for (let i = 0; i < nA; i++) {
    const x0 = -LH + (i * 2 * LH) / nA, x1 = -LH + ((i + 1) * 2 * LH) / nA;
    for (const z of zs) {
      aco.push({a: [x0, yb(x0), z], b: [x1, yb(x1), z], w: 1.5}, {a: [x0, yt(x0), z], b: [x1, yt(x1), z], w: 1.5});
      aco.push({a: [x0, yb(x0), z], b: [x0, yt(x0), z], w: 0.8});
      aco.push(i % 2 ? {a: [x0, yb(x0), z], b: [x1, yt(x1), z], w: 0.7} : {a: [x0, yt(x0), z], b: [x1, yb(x1), z], w: 0.7});
      if (yb(x0) > yDeck(x0) + 1.5) fino.push({a: [x0, yb(x0), z], b: [x0, yDeck(x0) - DT, z], w: 0.35});         // pendurais
      else if (yt(x0) < yDeck(x0) - DT) aco.push({a: [x0, yt(x0), z], b: [x0, yDeck(x0) - DT, z], w: 0.9});          // montantes sobre o arco
    }
    // contraventamento entre as costelas (acima do gabarito do tabuleiro ou abaixo dele)
    const yy = yt(x0);
    if (yy > yDeck(x0) + 9 || yy < yDeck(x0) - DT - 1) {
      aco.push({a: [x0, yy, zs[0]], b: [x0, yy, zs[1]], w: 0.6});
      aco.push({a: [x0, yy, zs[0]], b: [x1, yt(x1), zs[1]], w: 0.4});
    }
  }
  for (const z of zs) aco.push({a: [LH, yb(LH), z], b: [LH, yt(LH), z], w: 0.8});
  // bracos laterais (corda inferior curva subindo do pilar principal ate o pilar de ancoragem)
  for (const s of [-1, 1]) {
    const n = 18;
    for (let i = 0; i < n; i++) {
      const xa = s * (LH + (i * (XA - LH)) / n), xb = s * (LH + ((i + 1) * (XA - LH)) / n);
      for (const z of zs) {
        aco.push({a: [xa, ybLat(xa), z], b: [xb, ybLat(xb), z], w: 1.4});
        aco.push({a: [xa, ybLat(xa), z], b: [xa, yDeck(xa) - DT, z], w: 0.8});
        aco.push(i % 2 ? {a: [xa, ybLat(xa), z], b: [xb, yDeck(xb) - DT, z], w: 0.6} : {a: [xa, yDeck(xa) - DT, z], b: [xb, ybLat(xb), z], w: 0.6});
      }
      aco.push({a: [xa, ybLat(xa), zs[0]], b: [xa, ybLat(xa), zs[1]], w: 0.5});
    }
  }
  // treliça do tabuleiro (as duas vigas laterais) de ponta a ponta + transversinas + laje + guarda-corpo
  const nD = Math.round((2 * XEND) / 10);
  for (let i = 0; i < nD; i++) {
    const x0 = -XEND + i * 10, x1 = x0 + 10;
    for (const z of zs) {
      aco.push({a: [x0, yDeck(x0), z], b: [x1, yDeck(x1), z], w: 0.9}, {a: [x0, yDeck(x0) - DT, z], b: [x1, yDeck(x1) - DT, z], w: 0.9});
      aco.push({a: [x0, yDeck(x0) - DT, z], b: [x0, yDeck(x0), z], w: 0.55});
      aco.push(i % 2 ? {a: [x0, yDeck(x0) - DT, z], b: [x1, yDeck(x1), z], w: 0.5} : {a: [x0, yDeck(x0), z], b: [x1, yDeck(x1) - DT, z], w: 0.5});
      fino.push({a: [x0, yDeck(x0) + 1.1, z + (z < ZP ? -0.6 : 0.6)], b: [x1, yDeck(x1) + 1.1, z + (z < ZP ? -0.6 : 0.6)], w: 0.18});
    }
    aco.push({a: [x0, yDeck(x0) - DT, zs[0]], b: [x0, yDeck(x0) - DT, zs[1]], w: 0.6});
    aco.push({a: [x0, yDeck(x0) - DT, zs[0]], b: [x1, yDeck(x1) - DT, zs[1]], w: 0.35});
    conc.push({a: [x0, yDeck(x0) + 0.35, ZP], b: [x1, yDeck(x1) + 0.35, ZP], w: 0.7, w2: 2 * MEIA + 3});
  }
  // pilares de concreto: ancoragem (XA) e acessos a cada 60 m (duas colunas + travessa)
  for (const s of [-1, 1]) {
    for (let x = XA; x <= XEND - 20; x += 60) {
      const X = s * x, base = Math.min(alturaPanama(X, ZP - MEIA), alturaPanama(X, ZP + MEIA)) - 2, topo = yDeck(X) - DT - 0.5;
      for (const z of zs) conc.push({a: [X, base, z], b: [X, topo, z], w: x === XA ? 6 : 3.4, w2: x === XA ? 7 : 3.4});
      conc.push({a: [X, topo - 1.2, zs[0] - 2], b: [X, topo - 1.2, zs[1] + 2], w: 2.6, w2: 3});
    }
  }
  return {aco, fino, conc};
};
const instancia = (lista: Barra[], mat: THREE.Material) => {
  const g = new THREE.BoxGeometry(1, 1, 1), im = new THREE.InstancedMesh(g, mat, lista.length);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), A = new THREE.Vector3(), B = new THREE.Vector3(), D = new THREE.Vector3();
  lista.forEach((r, k) => {
    A.set(...r.a); B.set(...r.b); D.subVectors(B, A); const L = D.length(); D.normalize();
    Q.setFromUnitVectors(Y, D);
    M.compose(A.clone().add(B).multiplyScalar(0.5), Q, new THREE.Vector3(r.w, L + r.w * 0.5, r.w2 ?? r.w));
    im.setMatrixAt(k, M);
  });
  im.instanceMatrix.needsUpdate = true; im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
  return im;
};
const Ponte: React.FC<{env: THREE.Texture}> = ({env}) => {
  const [cDif, cNor] = useTexCostas(['concrete_floor_02_diff_1k.jpg', 'concrete_floor_02_nor_gl_1k.jpg']);
  const d = useMemo(() => {
    const b = montaPonte();
    const mAco = new THREE.MeshStandardMaterial({color: '#71817b', metalness: 0.55, roughness: 0.48, envMap: env, envMapIntensity: 0.8});
    const mFino = new THREE.MeshStandardMaterial({color: '#5f6d68', metalness: 0.6, roughness: 0.45, envMap: env, envMapIntensity: 0.8});
    const mConc = matTriplanar({tex: cDif, esc: 0.12, cor: '#d5d1c8', chave: 'pontecon', env, nivel: {value: 0}});
    // pilares principais: blocos de concreto do leito ate o nascimento do arco, com a marca d'agua antiga (algas abaixo de 0 m)
    const mPilar = matTriplanar({tex: cDif, esc: 0.1, cor: '#cfcac0', chave: 'pilar', env, nivel: {value: 0.6}});
    void cNor;
    return {aco: instancia(b.aco, mAco), fino: instancia(b.fino, mFino), conc: instancia(b.conc, mConc), mPilar};
  }, [env, cDif, cNor]);
  return (
    <group>
      <primitive object={d.aco} /><primitive object={d.fino} /><primitive object={d.conc} />
      {[-LH, LH].map((x) => (
        <group key={x}>
          <mesh position={[x, (YS + 1 - 18) / 2, ZP]} material={d.mPilar} castShadow receiveShadow><boxGeometry args={[26, YS + 1 + 18, 34]} /></mesh>
          <mesh position={[x, YS + 0.5, ZP]} material={d.mPilar} castShadow receiveShadow><boxGeometry args={[18, 3, 2 * MEIA + 6]} /></mesh>
        </group>
      ))}
    </group>
  );
};

// ---------- mirante: laje de concreto e guarda-corpo preto (como no original) ----------
const Mirante: React.FC<{env: THREE.Texture}> = ({env}) => {
  const [cDif, cNor, cRou] = useTexCostas(['concrete_floor_02_diff_1k.jpg', 'concrete_floor_02_nor_gl_1k.jpg', 'concrete_floor_02_rough_1k.jpg']);
  const d = useMemo(() => {
    const rep = (x: THREE.Texture) => { const k = x.clone(); k.repeat.set(60 / 4, 40 / 4); k.needsUpdate = true; return k; };
    const laje = new THREE.MeshStandardMaterial({map: rep(cDif), normalMap: rep(cNor), roughnessMap: rep(cRou), color: '#e2ddd5', envMap: env, envMapIntensity: 0.4});
    const preto = new THREE.MeshStandardMaterial({color: '#141618', metalness: 0.6, roughness: 0.42, envMap: env, envMapIntensity: 0.6});
    const lista: Barra[] = [];
    const Y = MIR_Y, Z = 29.5, xa = -292, xb = -236;
    for (let x = xa; x <= xb + 0.01; x += 2.2) lista.push({a: [x, Y, Z], b: [x, Y + 1.1, Z], w: 0.07});
    for (const y of [1.1, 0.55]) lista.push({a: [xa, Y + y, Z], b: [xb, Y + y, Z], w: y > 1 ? 0.08 : 0.05});
    for (let z = Z; z <= 62; z += 2.2) lista.push({a: [xb, Y, z], b: [xb, Y + 1.1, z], w: 0.07});
    for (const y of [1.1, 0.55]) lista.push({a: [xb, Y + y, Z], b: [xb, Y + y, 62], w: y > 1 ? 0.08 : 0.05});
    return {laje, gr: instancia(lista, preto)};
  }, [cDif, cNor, cRou, env]);
  return (
    <group>
      <mesh position={[-264, MIR_Y - 0.5, 46]} material={d.laje} receiveShadow castShadow><boxGeometry args={[56, 1, 33]} /></mesh>
      <mesh position={[-264, MIR_Y - 7, 29.6]} receiveShadow castShadow material={d.laje}><boxGeometry args={[56, 14, 0.6]} /></mesh>
      <primitive object={d.gr} />
    </group>
  );
};

// ---------- embarcacoes: casco por secoes (proa afinada), linha d'agua vermelha, encalham e tombam quando a agua sai ----------
const casco = (L: number, B: number, D: number, corBaixo: string, corAlto: string, linha = 0.42) => {
  const est = 22, sec: [number, number][] = [[1, 1], [0.98, 0.55], [0.9, 0.22], [0.55, 0.04], [0, 0]];
  const pos: number[] = [], cor: number[] = [], idx: number[] = [];
  const cb = new THREE.Color(corBaixo), ca = new THREE.Color(corAlto);
  const larg = (u: number) => (B / 2) * Math.pow(Math.min(1, (1 - u) / 0.24), 0.62) * Math.min(1, 0.82 + u * 1.4);
  const nP = sec.length * 2 - 1;
  for (let i = 0; i <= est; i++) {
    const u = i / est, x = (u - 0.5) * L, w = larg(u);
    const pts: [number, number][] = [];
    for (let k = 0; k < sec.length; k++) pts.push([w * sec[k][0], D * sec[k][1]]);
    for (let k = sec.length - 2; k >= 0; k--) pts.push([-w * sec[k][0], D * sec[k][1]]);
    pts.forEach(([z, y]) => { pos.push(x, y, z); const c = y < D * linha ? cb : ca; cor.push(c.r, c.g, c.b); });
    if (i > 0) for (let k = 0; k < nP - 1; k++) { const a = (i - 1) * nP + k, b = i * nP + k; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  }
  // convés
  const base = pos.length / 3;
  for (let i = 0; i <= est; i++) { const u = i / est, x = (u - 0.5) * L, w = larg(u) * 0.98; pos.push(x, D, w, x, D, -w); cor.push(0.42, 0.38, 0.33, 0.42, 0.38, 0.33); if (i > 0) { const a = base + (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3));
  g.setIndex(idx); g.computeVertexNormals(); return g;
};
type Barco = {tipo: 'conteiner' | 'rebocador' | 'veleiro' | 'panga'; x: number; z: number; ry: number; seed: number};
const BARCOS: Barco[] = [
  {tipo: 'conteiner', x: 30, z: -1150, ry: -Math.PI / 2 + 0.05, seed: 1},
  {tipo: 'rebocador', x: -70, z: -560, ry: 0.7, seed: 2}, {tipo: 'rebocador', x: 135, z: -420, ry: -2.2, seed: 3},
  {tipo: 'veleiro', x: -175, z: -520, ry: 1.2, seed: 4}, {tipo: 'veleiro', x: -150, z: -760, ry: 2.6, seed: 5}, {tipo: 'veleiro', x: -205, z: -330, ry: 0.2, seed: 6},
  {tipo: 'panga', x: -208, z: -90, ry: 0.9, seed: 7}, {tipo: 'panga', x: -196, z: -150, ry: 2.0, seed: 8}, {tipo: 'panga', x: -120, z: -260, ry: -0.4, seed: 9},
];
const CALADO = {conteiner: 12.5, rebocador: 4.2, veleiro: 2.2, panga: 0.5};
const TOMBO = {conteiner: 0.09, rebocador: 0.3, veleiro: 0.5, panga: 0.32};
// pose: flutua no nivel ate tocar o fundo; depois assenta no leito e adorna (roll) enquanto a agua continua a sair
const poseBarco = (b: Barco, nivel: number, t: number) => {
  const fundo = alturaPanama(b.x, b.z), cal = CALADO[b.tipo];
  const quilha = Math.max(fundo, nivel - cal);
  const enc = smooth(fundo + cal, fundo + cal * 0.1 - 1.5, nivel);         // 0 flutuando -> 1 assentado
  const balanco = (1 - enc) * 0.012 * Math.sin(t * 0.9 + b.seed);
  const roll = (rnd(b.seed) < 0.5 ? -1 : 1) * TOMBO[b.tipo] * enc + balanco;
  return {y: quilha, roll, pitch: enc * (rnd(b.seed + 4) - 0.5) * 0.06};
};
const CORES_CONT = ['#b8382c', '#1f4f8f', '#d9822b', '#7a7f85', '#2f7a4f', '#e8e4da', '#1c7a8a', '#8b2f5a', '#c9a227'];
const Barcos: React.FC<{nivel: number; t: number; env: THREE.Texture}> = ({nivel, t, env}) => {
  const d = useMemo(() => {
    const mCasco = new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.6, metalness: 0.25, envMap: env, envMapIntensity: 0.6, side: THREE.DoubleSide});
    const branco = new THREE.MeshStandardMaterial({color: '#ecebe6', roughness: 0.55, envMap: env, envMapIntensity: 0.5});
    const escuro = new THREE.MeshStandardMaterial({color: '#20262c', roughness: 0.3, metalness: 0.4, envMap: env, envMapIntensity: 0.8});
    const g = {
      conteiner: casco(290, 42, 26, '#9a2d24', '#18202b', 0.48), rebocador: casco(32, 11, 5.5, '#a3271f', '#1b1d20', 0.5),
      veleiro: casco(12, 3.8, 2.0, '#2a3e66', '#f2f0ea', 0.35), panga: casco(7.5, 1.9, 0.9, '#2f6fa8', '#e8e2d2', 0.5),
    };
    // conteineres empilhados (instanciados, cor por instancia)
    const nB = 22, nR = 15, lista: {p: V3; c: string}[] = [];
    for (let i = 0; i < nB; i++) for (let r = 0; r < nR; r++) {
      const alt = 2 + Math.floor(rnd(i * 31 + r * 7) * 5);
      for (let k = 0; k < alt; k++) lista.push({p: [-110 + i * 12.6, 26 + 1.3 + k * 2.6, (r - (nR - 1) / 2) * 2.55], c: CORES_CONT[Math.floor(rnd(i * 131 + r * 17 + k * 3) * CORES_CONT.length)]});
    }
    const imC = new THREE.InstancedMesh(new THREE.BoxGeometry(12.1, 2.55, 2.45), new THREE.MeshStandardMaterial({roughness: 0.7, metalness: 0.3, envMap: env, envMapIntensity: 0.4}), lista.length);
    const M = new THREE.Matrix4();
    lista.forEach((c, k) => { M.makeTranslation(...c.p); imC.setMatrixAt(k, M); imC.setColorAt(k, new THREE.Color(c.c)); });
    imC.castShadow = true; imC.receiveShadow = true; imC.frustumCulled = false;
    // janelas da superestrutura
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const c2 = cv.getContext('2d')!;
    c2.fillStyle = '#f0efe9'; c2.fillRect(0, 0, 64, 64); c2.fillStyle = '#29323b'; for (let y = 6; y < 64; y += 16) c2.fillRect(0, y, 64, 6);
    const tj = new THREE.CanvasTexture(cv); tj.colorSpace = THREE.SRGBColorSpace; tj.wrapS = tj.wrapT = THREE.RepeatWrapping; tj.repeat.set(3, 2);
    const ponteMat = new THREE.MeshStandardMaterial({map: tj, roughness: 0.5, envMap: env, envMapIntensity: 0.4});
    return {mCasco, branco, escuro, g, imC, ponteMat};
  }, [env]);
  return (
    <group>
      {BARCOS.map((b) => {
        const p = poseBarco(b, nivel, t);
        return (
          <group key={b.seed} position={[b.x, p.y, b.z]} rotation={[0, b.ry, 0]}>
            <group rotation={[p.roll, 0, p.pitch]}>
              <mesh geometry={d.g[b.tipo]} material={d.mCasco} castShadow receiveShadow />
              {b.tipo === 'conteiner' && <>
                <primitive object={d.imC} />
                <mesh position={[-128, 26 + 15, 0]} material={d.ponteMat} castShadow><boxGeometry args={[16, 30, 40]} /></mesh>
                <mesh position={[-140, 26 + 22, 0]} material={d.escuro} castShadow><boxGeometry args={[7, 18, 6]} /></mesh>
              </>}
              {b.tipo === 'rebocador' && <>
                <mesh position={[-2, 5.5 + 2, 0]} material={d.branco} castShadow><boxGeometry args={[11, 4, 8]} /></mesh>
                <mesh position={[1, 5.5 + 5.5, 0]} material={d.branco} castShadow><boxGeometry args={[5.5, 3, 7]} /></mesh>
                <mesh position={[1.5, 5.5 + 5.8, 0]} material={d.escuro}><boxGeometry args={[5.7, 1.1, 7.2]} /></mesh>
              </>}
              {b.tipo === 'veleiro' && <>
                <mesh position={[0.6, 2 + 7.5, 0]} material={d.branco} castShadow><cylinderGeometry args={[0.09, 0.12, 15, 6]} /></mesh>
                <mesh position={[-1, 2 + 0.5, 0]} material={d.branco} castShadow><boxGeometry args={[3.5, 1, 2.4]} /></mesh>
                <mesh position={[0.5, -0.9, 0]} material={d.escuro} castShadow><boxGeometry args={[1.6, 1.8, 0.3]} /></mesh>
              </>}
            </group>
          </group>
        );
      })}
    </group>
  );
};
// boias do canal (vermelhas a oeste, verdes a leste): flutuam; secas, deitam no leito
const BOIAS = [-700, -950, -1250, -1550].flatMap((z, k) => [{x: -140 + z * 0.02, z, cor: '#b3261e', s: k}, {x: 150 + z * 0.02, z, cor: '#1f7a3a', s: k + 10}]);
const Boias: React.FC<{nivel: number; t: number}> = ({nivel, t}) => (
  <group>
    {BOIAS.map((b) => {
      const fundo = alturaPanama(b.x, b.z), y = Math.max(fundo + 0.6, nivel - 1.2), enc = smooth(fundo + 1.8, fundo + 0.4, nivel);
      return (
        <group key={b.s} position={[b.x, y, b.z]} rotation={[enc * 1.25 * (rnd(b.s) < 0.5 ? 1 : -1) + (1 - enc) * 0.05 * Math.sin(t * 1.3 + b.s), rnd(b.s + 1) * 6, 0]}>
          <mesh position={[0, 1.6, 0]} castShadow><cylinderGeometry args={[0.9, 1.1, 3.2, 14]} /><meshStandardMaterial color={b.cor} roughness={0.5} /></mesh>
          <mesh position={[0, 3.9, 0]} castShadow><coneGeometry args={[0.6, 1.4, 10]} /><meshStandardMaterial color={b.cor} roughness={0.5} /></mesh>
        </group>
      );
    })}
  </group>
);

// ---------- skyline da Cidade do Panama (do outro lado da baia, na nevoa) ----------
const Skyline: React.FC<{env: THREE.Texture}> = ({env}) => {
  const im = useMemo(() => {
    const n = 46, mat = new THREE.MeshStandardMaterial({color: '#9fb0bd', roughness: 0.25, metalness: 0.6, envMap: env, envMapIntensity: 1.0});
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, n), M = new THREE.Matrix4(), Q = new THREE.Quaternion();
    for (let i = 0; i < n; i++) {
      const x = 1500 + rnd(i * 3) * 2000, z = -3900 - rnd(i * 3 + 1) * 800, h = 70 + Math.pow(rnd(i * 3 + 2), 1.6) * 230, w = 26 + rnd(i + 50) * 22;
      Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd(i + 70) * 1.2);
      M.compose(new THREE.Vector3(x, h / 2 - 2, z), Q, new THREE.Vector3(w, h, w * (0.7 + rnd(i + 90) * 0.6))); m.setMatrixAt(i, M);
      m.setColorAt(i, new THREE.Color().setHSL(0.57, 0.12, 0.62 + rnd(i + 30) * 0.25));
    }
    m.frustumCulled = false; return m;
  }, [env]);
  return <primitive object={im} />;
};

// ---------- vegetacao das margens ----------
const arvoresMargem = (): ItemFloresta[] => {
  const out: ItemFloresta[] = [];
  for (let i = 0; out.length < 70 && i < 600; i++) {
    const oeste = i % 3 !== 0;
    const z = 120 - rnd(i * 5 + 1) * 1100, x = oeste ? xOeste(z) - 25 - rnd(i * 5 + 2) * 380 : xLeste(z) + 30 + rnd(i * 5 + 2) * 500;
    if (oeste && x > -275 && z > -10) continue;                       // o mirante e a frente da camera ficam livres
    const y = alturaPanama(x, z);
    if (y < 3) continue;
    out.push({preset: rnd(i) < 0.6 ? 'Oak Medium' : 'Ash Medium', semente: rnd(i) < 0.6 ? 23 : 9, x, z, y: y - 0.5, altura: 11 + rnd(i + 3) * 9, rot: rnd(i + 4) * 6.28});
  }
  return out;
};
const ARVORES = arvoresMargem();

// =====================================================================================================================
export const perfilPanama = (t: number): Perfil => ({ao: true, bloom: 0.3, limiar: 0.95, vinheta: 0.3, saturacao: 0.04, contraste: 0.06,
  nevoa: {cor: corNevoa(t, 'panama'), densidade: 0.00028, max: 0.62}});

export const Panama: React.FC<{t: number}> = ({t}) => {
  const env = useEnvCostas();
  const hdr = useHDR('praia');
  const nivelU = useMemo(() => ({value: 0}), []);
  const nivel = nivelPanama(t);
  nivelU.value = nivel;
  const luz = luzMar(t, 'panama');
  useCamera(camGP(CAM, t), 0.5, 40000);
  return (
    <>
      <CeuLugar t={t} lugar="panama" />
      <Terreno nivel={nivelU} env={env} t={t} />
      <Ponte env={env} />
      <Mirante env={env} />
      <Barcos nivel={nivel} t={t} env={env} />
      <Boias nivel={nivel} t={t} />
      <Skyline env={env} />
      <Floresta lista={ARVORES} t={t} folhas={1} cor="#2f5a26" cor2="#3d6b2b" neve={0} vento={0.25} />
      <Mar t={t} luz={luz} costa={3200} nivel={nivel} env={hdr} tamanho={9600} centro={[600, 0]} espuma={0} agit={0.12} />
    </>
  );
};
