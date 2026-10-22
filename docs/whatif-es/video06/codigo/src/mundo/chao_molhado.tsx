// ChaoMolhado (dono: agente Leito) — material unico de praia / leito do mar que SECA com o tempo. Reusado por: leito (equador,
// 29,9-60,9), praia sem mar (244-300), Canal do Panama secando (133-159).
//
// IDEIA. A agua sai de cada ponto num instante proprio, tSaida(ponto), tirado de uma tabela montada a partir da linha d'agua que voce
// passa (funcao pura de t). A idade seca  a = t - tSaida  decide o estado do ponto:
//   submerso (a < 0) -> MOLHADO brilhante (filme d'agua refletindo o ceu) -> UMIDO (areia escura, fosca) -> SECO -> RACHADO (lama).
// Pocas (reflexo de espelho) encolhem com a idade; manchas de alga no que era fundo; conchas (Poly Haven lambis_shell) e tufos
// de alga instanciados. O que nunca ficou debaixo d'agua dentro da janela e PRAIA (areia seca coast_sand_01), com a faixa do
// espraiado molhada na frente da linha atual.
//
// API
//   <ChaoMolhado t tamanho={[L, P]} centro={[x, z]} agua={...} />            plano L x P m (x, z), centrado em (x, z)
//   agua (como medir "onde esta a agua"):
//     {tipo: 'distancia', origem: [x, z], dir: [dx, dz], linha: (t) => s}
//         s = (xz - origem) . dir (metros para o mar). Ha agua onde s > linha(t). linha cresce quando o mar recua.
//     {tipo: 'cota', nivel: (t) => y}
//         ha agua onde a altura do chao < nivel(t) (bom para canal/bacia: o fundo mais baixo seca por ultimo).
//   opcionais:
//     janela=[t0, t1]   intervalo de t em que a tabela tSaida e montada (padrao [0, 450]); fora dela o estado congela.
//     chave='...'       mude quando trocar linha/nivel/relevo (as funcoes sao memorizadas por esta chave, nao pela identidade).
//     relevo=(x, z) => y  altura do chao (padrao 0). segmentos=[nx, nz] (padrao [160, 160]). geometria=BufferGeometry propria
//                       (precisa de uv alinhado a x/-z; o relevo nao e aplicado nela).
//     secagem={umido, seco, racha}  idades (s de t) em que termina cada fase (padrao 3 / 9 / 18).
//     lama=0..1         quanto do leito vira lama rachada (padrao 0,6). pocas=0..1 (padrao 0,5). algas=0..1 (manchas, padrao 0,5).
//     irregular=m       ruido somado a s (ou a cota*20) para a frente de secagem nao ser reta (padrao 4).
//     espraiado=m       faixa de praia molhada pelas ondas na frente da linha atual (padrao 5).
//     repeticao=m       metros por repeticao das texturas de areia (padrao 3); a lama repete a cada 2,5x isso.
//     corAreia=[r,g,b]  multiplica a areia seca (padrao [1,3, 1,3, 1,32]: clareia a coast_sand_01). corLama (padrao [0,62, 0,64, 0,7], lama acinzentada).
//     ceu={horizonte, zenite}  cores (lineares) refletidas no molhado; padrao: tiradas de luzEm(t, lugar) (lugar padrao 'ecuador').
//     reflexo=0..2      forca do reflexo do ceu (padrao 1). sombras=true (recebe sombra).
//     conchas={n, area: [x0, z0, x1, z1], escala?}  conchas espalhadas (so onde era fundo do mar ou no espraiado).
//     tufos={n, area, escala?}                       tufos de alga (so no que era fundo).
//   ajudantes (CPU, para posicionar barcos/pessoas pelo mesmo relogio da agua):
//     tabelaSaida(agua, janela) -> {tSaida(q), linhaAgora(t), qMin, qMax};  qDoPonto(agua, x, z, y) -> q
//     idadeSeca(agua, janela, x, z, y, t) -> t - tSaida (negativo = ainda submerso).
//   Ex.: barco aparece quando idadeSeca(...) > 0;  pessoa so anda ate onde linha(t) ja passou.
//
// Texturas: public/leito (Poly Haven CC0: damp_beach_sand_02, mud_cracked_dry_03, lambis_shell) e public/tex/coast_sand_01 (CC0).
// Tudo deterministico: so funcoes de t e sementes fixas.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {useGLTF, useTexture} from '@react-three/drei';
import {staticFile} from 'remotion';
import {rnd} from './comum';
import {luzEm, Lugar} from './ceu';

export type AguaDistancia = {tipo: 'distancia'; origem: [number, number]; dir: [number, number]; linha: (t: number) => number};
export type AguaCota = {tipo: 'cota'; nivel: (t: number) => number};
export type ModoAgua = AguaDistancia | AguaCota;
export type Espalhar = {n: number; area: [number, number, number, number]; escala?: number};
export type PropsChao = {
  t: number; tamanho: [number, number]; centro: [number, number]; agua: ModoAgua;
  janela?: [number, number]; chave?: string; relevo?: (x: number, z: number) => number; segmentos?: [number, number];
  geometria?: THREE.BufferGeometry;
  secagem?: {umido: number; seco: number; racha: number}; lama?: number; pocas?: number; algas?: number; irregular?: number;
  espraiado?: number; repeticao?: number; corAreia?: [number, number, number]; corLama?: [number, number, number]; ceu?: {horizonte: THREE.Color; zenite: THREE.Color}; lugar?: Lugar; reflexo?: number;
  sombras?: boolean; conchas?: Espalhar; tufos?: Espalhar;
};

// ---------------------------------------------------------------- tabela tSaida (CPU)
const N_AMOSTRAS = 4096, N_LUT = 1024;
const dirUnit = (d: [number, number]) => { const L = Math.hypot(d[0], d[1]) || 1; return [d[0] / L, d[1] / L] as [number, number]; };
// q: coordenada que cresce para "mais fundo" (distancia para o mar, ou -cota)
export const qDoPonto = (agua: ModoAgua, x: number, z: number, y = 0) => {
  if (agua.tipo === 'cota') return -y;
  const d = dirUnit(agua.dir);
  return (x - agua.origem[0]) * d[0] + (z - agua.origem[1]) * d[1];
};
const linhaQ = (agua: ModoAgua, t: number) => (agua.tipo === 'cota' ? -agua.nivel(t) : agua.linha(t));

export type Tabela = {qMin: number; qMax: number; lut: Float32Array; j0: number; j1: number; tSaida: (q: number) => number; linhaAgora: (t: number) => number};
export const tabelaSaida = (agua: ModoAgua, janela: [number, number] = [0, 450]): Tabela => {
  const [j0, j1] = janela, ts = new Float64Array(N_AMOSTRAS), Ls = new Float64Array(N_AMOSTRAS);
  let m = -Infinity;
  for (let i = 0; i < N_AMOSTRAS; i++) { const t = j0 + ((j1 - j0) * i) / (N_AMOSTRAS - 1); m = Math.max(m, linhaQ(agua, t)); ts[i] = t; Ls[i] = m; }
  const qMin = Ls[0], qMax = Math.max(Ls[N_AMOSTRAS - 1], qMin + 1e-3);
  const lut = new Float32Array(N_LUT);
  let k = 0;
  for (let j = 0; j < N_LUT; j++) {
    const q = qMin + ((qMax - qMin) * j) / (N_LUT - 1);
    while (k < N_AMOSTRAS - 1 && Ls[k] < q) k++;
    // interpola entre a amostra anterior e esta para nao escadear
    if (k > 0 && Ls[k] > Ls[k - 1]) { const u = (q - Ls[k - 1]) / (Ls[k] - Ls[k - 1]); lut[j] = ts[k - 1] + (ts[k] - ts[k - 1]) * Math.min(1, Math.max(0, u)); }
    else lut[j] = ts[k];
  }
  const tSaida = (q: number) => {
    if (q <= qMin) return -1e4;
    if (q > qMax) return 1e5;
    const x = ((q - qMin) / (qMax - qMin)) * (N_LUT - 1), i = Math.floor(x), f = x - i;
    return lut[i] + (lut[Math.min(i + 1, N_LUT - 1)] - lut[i]) * f;
  };
  const linhaAgora = (t: number) => {
    const u = ((Math.min(j1, Math.max(j0, t)) - j0) / (j1 - j0)) * (N_AMOSTRAS - 1), i = Math.floor(u), f = u - i;
    return Ls[i] + (Ls[Math.min(i + 1, N_AMOSTRAS - 1)] - Ls[i]) * f;
  };
  return {qMin, qMax, lut, j0, j1, tSaida, linhaAgora};
};
export const idadeSeca = (agua: ModoAgua, janela: [number, number], x: number, z: number, y: number, t: number, tab?: Tabela) =>
  t - (tab ?? tabelaSaida(agua, janela)).tSaida(qDoPonto(agua, x, z, y));

// ---------------------------------------------------------------- shader
const VERT_PARS = `#include <common>
varying vec3 vMundo;`;
const FRAG_PARS = `#include <common>
varying vec3 vMundo;
uniform float uT; uniform sampler2D uLUT; uniform vec2 uQ; uniform float uLinha;
uniform float uModo; uniform vec2 uOrig; uniform vec2 uDir;
uniform vec3 uSec; uniform float uLama; uniform float uPoca; uniform float uAlga; uniform float uIrreg; uniform float uEspr;
uniform float uRep; uniform vec3 uCorAreia; uniform vec3 uCorLama; uniform vec3 uCeuH; uniform vec3 uCeuZ; uniform float uReflexo;
uniform sampler2D tSD; uniform sampler2D tSN; uniform sampler2D tMD; uniform sampler2D tMN; uniform sampler2D tMR;
uniform sampler2D tLD; uniform sampler2D tLN; uniform sampler2D tLR;
float cmH(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float cmN(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(cmH(i), cmH(i+vec2(1.0,0.0)), u.x), mix(cmH(i+vec2(0.0,1.0)), cmH(i+vec2(1.0,1.0)), u.x), u.y); }
float cmF(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++){ s += a * cmN(p); p = mat2(1.6,1.2,-1.2,1.6) * p + 7.3; a *= 0.5; } return s; }
float cmSaida(float q){
  if (q <= uQ.x) return -1e4;
  if (q > uQ.y) return 1e5;
  float x = (q - uQ.x) / (uQ.y - uQ.x) * ${N_LUT - 1}.0;
  float i = floor(x), f = x - i;
  float a = texture2D(uLUT, vec2((i + 0.5) / ${N_LUT}.0, 0.5)).r;
  float b = texture2D(uLUT, vec2((min(i + 1.0, ${N_LUT - 1}.0) + 0.5) / ${N_LUT}.0, 0.5)).r;
  return mix(a, b, f);
}`;
// pesos e albedo (no lugar do map_fragment): variaveis ficam visiveis no resto do main()
const FRAG_MAP = `
  vec2 cmXZ = vMundo.xz;
  vec2 cmUV = vec2(cmXZ.x, -cmXZ.y) / uRep;
  vec2 cmUVL = vec2(cmXZ.x, -cmXZ.y) / (uRep * 2.5);
  float cmQ = (uModo < 0.5 ? dot(cmXZ - uOrig, uDir) : -vMundo.y);
  float cmRuido = (cmF(cmXZ * 0.045) - 0.5) + 0.3 * (cmN(cmXZ * 0.31) - 0.5);
  float cmQr = cmQ + cmRuido * uIrreg * (uModo < 0.5 ? 1.0 : 0.05);
  float cmIdade = uT - cmSaida(cmQr);
  float cmLeito = smoothstep(uQ.x, uQ.x + max(uIrreg * (uModo < 0.5 ? 0.6 : 0.03), 0.05), cmQr);
  float cmSub = 1.0 - smoothstep(-0.02, 0.0, cmIdade);
  // espraiado: as ondas molham a faixa na frente da linha atual (respiram com o tempo)
  float cmDl = (uLinha - cmQr) * (uModo < 0.5 ? 1.0 : 20.0);
  float cmOnda = 0.5 + 0.5 * sin(uT * 1.7 + cmXZ.x * 0.07 + cmXZ.y * 0.02);
  float cmEspr = (1.0 - smoothstep(0.0, uEspr * (0.55 + 0.45 * cmOnda), cmDl)) * step(-0.5, cmDl);
  float cmMolh = max(cmSub, max(cmEspr, cmLeito * (1.0 - smoothstep(0.0, uSec.x, cmIdade))));
  float cmUmido = cmLeito * (1.0 - smoothstep(uSec.x, uSec.y, cmIdade));
  float cmMascLama = smoothstep(0.62 - uLama * 0.75, 0.70 - uLama * 0.75, cmF(cmXZ * 0.018 + 3.1) * 0.7 + 0.3 * cmN(cmXZ * 0.12));
  float cmRacha = cmLeito * smoothstep(uSec.y, uSec.z, cmIdade) * cmMascLama;
  // pocas: depressoes (fbm) que vao encolhendo com a idade
  float cmLim = mix(0.52, 0.86, smoothstep(0.0, uSec.z * 1.3, cmIdade)) + (1.0 - uPoca) * 0.3;
  float cmPoca = cmLeito * (1.0 - cmSub) * smoothstep(cmLim, cmLim + 0.025, cmF(cmXZ * 0.07 + 11.0) * 0.8 + 0.2 * cmN(cmXZ * 0.9));
  float cmAlga = cmLeito * uAlga * smoothstep(0.58, 0.72, cmF(cmXZ * 0.11 + 5.0));
  // albedo
  vec3 cmSeca = texture2D(tSD, cmUV).rgb * uCorAreia;
  vec3 cmMol = texture2D(tMD, cmUV).rgb;
  vec3 cmLam = texture2D(tLD, cmUVL).rgb;
  cmLam = mix(vec3(dot(cmLam, vec3(0.3, 0.59, 0.11))), cmLam, 0.45) * uCorLama;
  vec3 cmLeitoSeco = mix(cmMol * vec3(0.86, 0.9, 0.98), cmSeca * 0.72, 0.25);
  vec3 cmCor = mix(cmSeca, cmLeitoSeco, cmLeito);
  cmCor = mix(cmCor, cmMol * 0.8, cmUmido);
  cmCor = mix(cmCor, cmLam * vec3(0.95, 0.93, 0.9), cmRacha);
  cmCor *= mix(vec3(1.0), vec3(0.42, 0.45, 0.32), cmAlga * (1.0 - cmRacha * 0.6));
  cmCor *= mix(1.0, 0.55, cmMolh);                         // filme d'agua escurece
  cmCor = mix(cmCor, vec3(0.035, 0.045, 0.05), cmPoca * 0.85);
  cmCor *= 0.86 + 0.28 * cmN(cmXZ * 0.021);                 // quebra a repeticao
  diffuseColor.rgb = cmCor;`;
const FRAG_ROUGH = `
  float cmRS = 0.95, cmRM = texture2D(tMR, cmUV).g, cmRL = texture2D(tLR, cmUVL).g;
  float roughnessFactor = mix(cmRS, cmRM * 0.9, max(cmLeito * 0.5, cmUmido));
  roughnessFactor = mix(roughnessFactor, cmRL, cmRacha);
  roughnessFactor = mix(roughnessFactor, 0.16, cmMolh);
  roughnessFactor = mix(roughnessFactor, 0.03, cmPoca);`;
const FRAG_NORMAL = `
#if defined( USE_NORMALMAP_TANGENTSPACE )
  vec3 cmNS = texture2D(tSN, cmUV).xyz * 2.0 - 1.0;
  vec3 cmNM = texture2D(tMN, cmUV).xyz * 2.0 - 1.0;
  vec3 cmNL = texture2D(tLN, cmUVL).xyz * 2.0 - 1.0;
  vec3 mapN = mix(cmNS, cmNM, max(cmLeito * 0.6, cmUmido));
  mapN = mix(mapN, cmNL * vec3(1.4, 1.4, 1.0), cmRacha);
  mapN.xy *= mix(1.0, 0.35, cmMolh) * (1.0 - cmPoca);
  mapN.xy *= normalScale;
  normal = normalize( tbn * mapN );
#endif`;
// reflexo do ceu no filme d'agua e nas pocas (Fresnel), somado a luz que sai
const FRAG_OUT = `
  {
    vec3 cmV = normalize(cameraPosition - vMundo);
    vec3 cmNw = normalize(mix(vec3(0.0, 1.0, 0.0), inverseTransformDirection(normal, viewMatrix), 0.35));
    vec3 cmR = reflect(-cmV, cmNw);
    float cmFr = 0.02 + 0.98 * pow(1.0 - max(dot(cmNw, cmV), 0.0), 5.0);
    vec3 cmCeu = mix(uCeuH, uCeuZ, smoothstep(0.0, 0.5, cmR.y));
    outgoingLight += cmCeu * cmFr * uReflexo * (cmMolh * 0.55 + cmPoca * 0.9) * (1.0 - cmRacha);
  }
  #include <opaque_fragment>`;

// ---------------------------------------------------------------- texturas
export const useTexturasChao = () => {
  const tx = useTexture([
    staticFile('tex/coast_sand_01_diff_2k.jpg'), staticFile('tex/coast_sand_01_nor_gl_2k.jpg'),
    staticFile('leito/damp_beach_sand_02_diff_2k.jpg'), staticFile('leito/damp_beach_sand_02_nor_gl_2k.jpg'), staticFile('leito/damp_beach_sand_02_rough_2k.jpg'),
    staticFile('leito/mud_cracked_dry_03_diff_2k.jpg'), staticFile('leito/mud_cracked_dry_03_nor_gl_2k.jpg'), staticFile('leito/mud_cracked_dry_03_rough_2k.jpg'),
  ]);
  return useMemo(() => {
    tx.forEach((x, i) => { x.wrapS = x.wrapT = THREE.RepeatWrapping; x.anisotropy = 8; x.colorSpace = i === 0 || i === 2 || i === 5 ? THREE.SRGBColorSpace : THREE.NoColorSpace; x.needsUpdate = true; });
    const [sd, sn, md, mn, mr, ld, ln, lr] = tx;
    return {sd, sn, md, mn, mr, ld, ln, lr};
  }, [tx]);
};

// material (hook): use direto se ja tiver a sua malha (precisa de uv alinhado a x/-z para o normal map)
export const useChaoMolhado = (p: Omit<PropsChao, 'tamanho' | 'centro' | 'segmentos' | 'geometria' | 'conchas' | 'tufos' | 'relevo'>) => {
  const T = useTexturasChao();
  const janela = p.janela ?? [0, 450];
  const tab = useMemo(() => tabelaSaida(p.agua, janela), [p.chave ?? '', p.agua.tipo, janela[0], janela[1]]);  // eslint-disable-line
  const lutTex = useMemo(() => {
    const d = new THREE.DataTexture(tab.lut, N_LUT, 1, THREE.RedFormat, THREE.FloatType);
    d.minFilter = d.magFilter = THREE.NearestFilter; d.generateMipmaps = false; d.needsUpdate = true; return d;
  }, [tab]);
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 1, metalness: 0, normalMap: T.sn, normalScale: new THREE.Vector2(1, 1)});
    const u = {
      uT: {value: 0}, uLUT: {value: lutTex}, uQ: {value: new THREE.Vector2()}, uLinha: {value: 0}, uModo: {value: 0},
      uOrig: {value: new THREE.Vector2()}, uDir: {value: new THREE.Vector2(0, -1)}, uSec: {value: new THREE.Vector3(3, 9, 18)},
      uLama: {value: 0.6}, uPoca: {value: 0.5}, uAlga: {value: 0.5}, uIrreg: {value: 4}, uEspr: {value: 5}, uRep: {value: 3}, uCorAreia: {value: new THREE.Color()}, uCorLama: {value: new THREE.Color()},
      uCeuH: {value: new THREE.Color()}, uCeuZ: {value: new THREE.Color()}, uReflexo: {value: 1},
      tSD: {value: T.sd}, tSN: {value: T.sn}, tMD: {value: T.md}, tMN: {value: T.mn}, tMR: {value: T.mr}, tLD: {value: T.ld}, tLN: {value: T.ln}, tLR: {value: T.lr},
    };
    m.userData.u = u;
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', VERT_PARS)
        .replace('#include <project_vertex>', '#include <project_vertex>\nvMundo = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', FRAG_PARS)
        .replace('#include <map_fragment>', FRAG_MAP)
        .replace('#include <roughnessmap_fragment>', FRAG_ROUGH)
        .replace('#include <normal_fragment_maps>', FRAG_NORMAL)
        .replace('#include <opaque_fragment>', FRAG_OUT);
    };
    m.customProgramCacheKey = () => 'chao_molhado_v1';
    return m;
  }, [T, lutTex]);
  // uniforms do quadro
  const u = mat.userData.u;
  u.uLUT.value = lutTex; u.uT.value = p.t; u.uQ.value.set(tab.qMin, tab.qMax); u.uLinha.value = tab.linhaAgora(p.t);
  if (p.agua.tipo === 'distancia') { const d = dirUnit(p.agua.dir); u.uModo.value = 0; u.uOrig.value.set(p.agua.origem[0], p.agua.origem[1]); u.uDir.value.set(d[0], d[1]); }
  else u.uModo.value = 1;
  const s = p.secagem ?? {umido: 3, seco: 9, racha: 18};
  u.uSec.value.set(s.umido, s.seco, s.racha);
  u.uLama.value = p.lama ?? 0.6; u.uPoca.value = p.pocas ?? 0.5; u.uAlga.value = p.algas ?? 0.5; u.uIrreg.value = p.irregular ?? 4;
  u.uEspr.value = p.espraiado ?? 5; u.uRep.value = p.repeticao ?? 3;
  u.uCorAreia.value.setRGB(...(p.corAreia ?? [1.3, 1.3, 1.32])); u.uCorLama.value.setRGB(...(p.corLama ?? [0.62, 0.64, 0.7])); u.uReflexo.value = p.reflexo ?? 1;
  if (p.ceu) { u.uCeuH.value.copy(p.ceu.horizonte); u.uCeuZ.value.copy(p.ceu.zenite); }
  else {
    const l = luzEm(p.t, p.lugar ?? 'ecuador');
    u.uCeuZ.value.copy(l.ambiente).multiplyScalar(0.25 + 0.75 * l.dia);
    u.uCeuH.value.copy(l.ambiente).lerp(new THREE.Color(1, 1, 1), 0.55).lerp(l.corSol, 0.25).multiplyScalar(0.3 + 0.9 * l.dia);
  }
  return {mat, tab};
};

// grade do chao (com relevo aplicado) — uv = (x, -z) normalizado, alinhado com as texturas em metros
const gradeChao = (tam: [number, number], c: [number, number], seg: [number, number], relevo?: (x: number, z: number) => number) => {
  const g = new THREE.PlaneGeometry(tam[0], tam[1], seg[0], seg[1]);
  g.rotateX(-Math.PI / 2); g.translate(c[0], 0, c[1]);
  if (relevo) {
    const P = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < P.count; i++) P.setY(i, relevo(P.getX(i), P.getZ(i)));
    g.computeVertexNormals();
  }
  return g;
};

// espalha instancias so onde era fundo do mar (ou no espraiado, no caso das conchas)
const espalhar = (e: Espalhar, agua: ModoAgua, tab: Tabela, relevo: ((x: number, z: number) => number) | undefined, semente: number, praiaTambem: number) => {
  const out: {x: number; y: number; z: number; ry: number; rx: number; s: number}[] = [];
  const [x0, z0, x1, z1] = e.area;
  for (let i = 0, k = 0; i < e.n && k < e.n * 6; k++) {
    const x = x0 + (x1 - x0) * rnd(semente + k * 3.1), z = z0 + (z1 - z0) * rnd(semente + k * 5.7 + 1);
    const y = relevo ? relevo(x, z) : 0;
    const q = qDoPonto(agua, x, z, y);
    const leito = q > tab.qMin;
    if (!leito && rnd(semente + k * 7.3 + 2) > praiaTambem) continue;
    out.push({x, y, z, ry: rnd(semente + k * 1.7) * Math.PI * 2, rx: (rnd(semente + k * 2.9) - 0.5) * 0.5, s: (0.7 + rnd(semente + k * 4.3) * 0.7) * (e.escala ?? 1)});
    i++;
  }
  return out;
};

const Conchas: React.FC<{e: Espalhar; agua: ModoAgua; tab: Tabela; relevo?: (x: number, z: number) => number; sombras: boolean}> = ({e, agua, tab, relevo, sombras}) => {
  const g = useGLTF(staticFile('leito/concha/lambis_shell_1k.gltf'));
  const malha = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null, mat: THREE.Material | null = null;
    g.scene.traverse((o: any) => { if (o.isMesh && !geo) { geo = o.geometry; mat = o.material; } });
    const pts = espalhar(e, agua, tab, relevo, 71, 0.15);
    const im = new THREE.InstancedMesh(geo!, mat!, Math.max(1, pts.length));
    const o = new THREE.Object3D();
    pts.forEach((p, i) => { o.position.set(p.x, p.y + 0.005, p.z); o.rotation.set(p.rx, p.ry, p.rx * 0.6); o.scale.setScalar(p.s); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    im.count = pts.length; im.castShadow = sombras; im.receiveShadow = sombras; im.instanceMatrix.needsUpdate = true;
    return im;
  }, [g, e.n, e.area[0], e.area[1], e.area[2], e.area[3], e.escala, tab]);  // eslint-disable-line
  return <primitive object={malha} />;
};

const Tufos: React.FC<{e: Espalhar; agua: ModoAgua; tab: Tabela; relevo?: (x: number, z: number) => number; sombras: boolean}> = ({e, agua, tab, relevo, sombras}) => {
  const malha = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const P = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i); const w = 1 + 0.35 * Math.sin(x * 5.1 + z * 3.7); P.setXYZ(i, x * w, Math.max(-0.2, y) * 0.16, z * w * 0.7); }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({color: '#3a4426', roughness: 0.35, metalness: 0});
    const pts = espalhar(e, agua, tab, relevo, 913, 0);
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, pts.length));
    const o = new THREE.Object3D(), c = new THREE.Color();
    pts.forEach((p, i) => {
      o.position.set(p.x, p.y + 0.01, p.z); o.rotation.set(0, p.ry, 0); o.scale.set(p.s * 0.6, p.s, p.s * 0.6); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
      im.setColorAt(i, c.set('#3a4426').lerp(new THREE.Color('#5a4a2a'), rnd(i * 3.3)).multiplyScalar(0.7 + rnd(i * 1.9) * 0.5));
    });
    im.count = pts.length; im.castShadow = sombras; im.receiveShadow = sombras; im.instanceMatrix.needsUpdate = true;
    return im;
  }, [e.n, e.area[0], e.area[1], e.area[2], e.area[3], e.escala, tab]);  // eslint-disable-line
  return <primitive object={malha} />;
};

export const ChaoMolhado: React.FC<PropsChao> = (p) => {
  const {scene} = useThree();
  const {mat, tab} = useChaoMolhado(p);
  // com IBL na cena (CeuFoto/HDRI) o reflexo do ambiente ja aparece: o nosso fica mais fraco
  mat.userData.u.uReflexo.value = (p.reflexo ?? 1) * (scene.environment ? 0.5 : 1);
  const seg = p.segmentos ?? [160, 160];
  const geo = useMemo(() => p.geometria ?? gradeChao(p.tamanho, p.centro, seg, p.relevo),
    [p.geometria, p.tamanho[0], p.tamanho[1], p.centro[0], p.centro[1], seg[0], seg[1], p.chave ?? '']);  // eslint-disable-line
  const sombras = p.sombras ?? true;
  return (
    <group>
      <mesh geometry={geo} material={mat} receiveShadow={sombras} />
      {p.conchas && p.conchas.n > 0 && <Conchas e={p.conchas} agua={p.agua} tab={tab} relevo={p.relevo} sombras={sombras} />}
      {p.tufos && p.tufos.n > 0 && <Tufos e={p.tufos} agua={p.agua} tab={tab} relevo={p.relevo} sombras={sombras} />}
    </group>
  );
};
