// Soldados de 1870 com ESQUELETO (nivel `heroi`): corpo da Quaternius (Universal Base Characters, CC0) + clipes da Universal Animation Library
// (CC0), recoloridos por regiao do corpo como infantaria prussiana ou francesa, com Pickelhaube / kepi, mochila e fuzil presos aos OSSOS
// (cabeca, coluna, mao). Mesmo contrato do `Heer` do k6 (a funcao fig(i) devolve x/z/ry/gait/fall/sit/aim/grau), entao e troca direta nas
// cenas de massa. Deterministico: um clipe por soldado, tempo absoluto (nada de mixer.update(delta)); o passo vem da cadencia da cena.
// Coordenadas: a mesma do Heer (rotation.y = giro(dx, dz) com a figura olhando para +x). Aqui o modelo olha para +z, entao ry' = ry + PI/2.
// Custo: ~10 draw calls por soldado (corpo, olhos, sobrancelha, chapeu, mochila...). Use ate ~60 por cena (os de perto), o resto em bloco.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useGLTF} from '@react-three/drei';
import {clone as clonarComEsqueleto} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {staticFile} from 'remotion';

export type FigRig = {x: number; z: number; y?: number; ry: number; sc?: number; vis?: number; gait?: number; fall?: number; grau?: number; sit?: number; aim?: number};
export type Exercito = 'pr' | 'fr';

const hash = (i: number, s = 0): number => { const x = Math.sin(i * 127.1 + s * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };

// uniformes (cores de 1870)
export const UNIFORMES: Record<Exercito, {casaco: string; calca: string; gola: string}> = {
  pr: {casaco: '#27375f', calca: '#2b2f3d', gola: '#a8322c'},   // Waffenrock azul-escuro, calca escura, gola vermelha
  fr: {casaco: '#2f3d6e', calca: '#b0372c', gola: '#d8d2bd'},   // capote azul, calca garance (vermelha)
};

// ---------- material: roupa por regiao do corpo (pose de bind em T de 1,8 m; o modelo olha para +z; bracos em |x| ate 0,93) ----------
const recolorir = (m: THREE.MeshStandardMaterial, ex: Exercito, semente: number) => {
  const n = m.clone() as THREE.MeshStandardMaterial;
  const U = UNIFORMES[ex];
  const u = {uCasaco: {value: new THREE.Color(U.casaco)}, uCalca: {value: new THREE.Color(U.calca)}, uGola: {value: new THREE.Color(U.gola)},
    uPele: {value: new THREE.Color().setHSL(0.07 + 0.02 * hash(semente, 1), 0.38, 0.55 + 0.1 * hash(semente, 2))}, uCinza: {value: 0}, uTom: {value: 0.85 + 0.3 * hash(semente, 3)}};
  n.userData.u = u;
  n.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vBind;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvBind = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vBind;\nuniform vec3 uCasaco; uniform vec3 uCalca; uniform vec3 uGola; uniform vec3 uPele; uniform float uCinza; uniform float uTom;')
      .replace('#include <map_fragment>', `#include <map_fragment>
  { float ax = abs(vBind.x), y = vBind.y, z = vBind.z;
    float lum = dot(diffuseColor.rgb, vec3(0.333));
    float tecido = (0.62 + 1.3 * lum) * uTom;
    float tronco = step(ax, 0.24) * step(0.80, y) * step(y, 1.50);
    float manga = step(0.18, ax) * step(ax, 0.70) * step(1.28, y) * step(y, 1.62);
    float casaco = max(tronco, manga);
    float calca = step(ax, 0.30) * step(y, 0.84) * step(0.10, y);
    float bota = step(y, 0.13);
    float gola = step(1.46, y) * step(y, 1.56) * step(ax, 0.12) * step(0.0, z);   // gola/passadeira
    vec3 c = diffuseColor.rgb * uPele * 1.15;                               // pele (mao, rosto, pescoco)
    c = mix(c, uCalca * tecido, calca);
    c = mix(c, vec3(0.045, 0.035, 0.03), bota * (1.0 - casaco));
    c = mix(c, uCasaco * tecido, casaco);
    c = mix(c, uGola * 0.8, gola * casaco * 0.9);
    // correias brancas cruzadas no peito (frente: z > 0): duas diagonais
    float diag = min(abs(abs(vBind.x) - (y - 1.0) * 0.5 - 0.02), 1.0);
    c = mix(c, vec3(0.78, 0.74, 0.62), step(diag, 0.03) * tronco * step(0.04, z) * step(1.04, y) * step(y, 1.44));
    // cinto
    c = mix(c, vec3(0.05, 0.04, 0.035), step(0.93, y) * step(y, 1.0) * tronco);
    // barra do capote/calca suja de lama
    c *= 1.0 - 0.45 * (1.0 - smoothstep(0.1, 0.55, y)) * (1.0 - bota);
    c = mix(c, vec3(dot(c, vec3(0.333))) * vec3(0.8, 0.78, 0.74), uCinza);
    diffuseColor.rgb = c; }`);
  };
  n.customProgramCacheKey = () => 'acab_soldado';
  return n;
};

// ---------- pecas presas aos ossos (geometria desenhada no espaco de bind do corpo e convertida para o espaco do osso) ----------
const lathe = (pts: number[][], seg = 14) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
const caixa = (w: number, h: number, d: number, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) => {
  const g = new THREE.BoxGeometry(w, h, d); g.rotateX(rx); g.rotateY(ry); g.rotateZ(rz); g.translate(x, y, z); return g;
};
type Pecas = {chapeu: THREE.Mesh[]; costas: THREE.Mesh[]; fuzil: THREE.Mesh[]};
const M_COURO = () => new THREE.MeshStandardMaterial({color: '#17130f', roughness: 0.42, metalness: 0.05});
const M_LATAO = () => new THREE.MeshStandardMaterial({color: '#c29a3c', roughness: 0.32, metalness: 0.85});
const M_LONA = () => new THREE.MeshStandardMaterial({color: '#5d4a33', roughness: 0.9});
const M_CAPOTE = () => new THREE.MeshStandardMaterial({color: '#85806b', roughness: 0.95});
const M_MADEIRA = () => new THREE.MeshStandardMaterial({color: '#3d2b1b', roughness: 0.6});
const M_ACO = () => new THREE.MeshStandardMaterial({color: '#8d9096', roughness: 0.35, metalness: 0.9});
const M_KEPI = () => new THREE.MeshStandardMaterial({color: '#9b2f28', roughness: 0.85});

const montarPecas = (sk: THREE.Skeleton, ex: Exercito): Pecas => {
  const osso = (nome: string) => sk.bones.findIndex((b) => b.name === nome);
  const paraOsso = (i: number, g: THREE.BufferGeometry) => g.applyMatrix4(sk.boneInverses[i]);
  const mesh = (i: number, g: THREE.BufferGeometry, m: THREE.Material) => { const me = new THREE.Mesh(paraOsso(i, g), m); me.castShadow = true; me.receiveShadow = true; me.frustumCulled = false; return me; };
  const iH = osso('Head'), iS = osso('spine_03'), iM = osso('hand_r');
  const cabeca = 1.70;   // centro da cabeca no espaco de bind
  const chapeu: THREE.Mesh[] = [], costas: THREE.Mesh[] = [], fuzil: THREE.Mesh[] = [];
  if (ex === 'pr') {   // Pickelhaube: calota de couro, ponta de latao, placa frontal, pala, jugular
    chapeu.push(mesh(iH, lathe([[0, 0.17], [0.05, 0.165], [0.1, 0.125], [0.14, 0.05], [0.155, 0.0], [0.17, -0.02]]).translate(0, cabeca + 0.065, 0.005), M_COURO()));
    chapeu.push(mesh(iH, new THREE.ConeGeometry(0.02, 0.15, 8).translate(0, cabeca + 0.065 + 0.245, 0.005), M_LATAO()));
    chapeu.push(mesh(iH, caixa(0.1, 0.11, 0.015, 0, cabeca + 0.13, 0.15, -0.15), M_LATAO()));
    chapeu.push(mesh(iH, caixa(0.2, 0.01, 0.07, 0, cabeca + 0.05, 0.17, -0.12), M_COURO()));
  } else {   // kepi vermelho de topo plano e pala
    chapeu.push(mesh(iH, lathe([[0, 0.105], [0.12, 0.105], [0.14, 0.07], [0.15, 0.0], [0.15, -0.015]]).translate(0, cabeca + 0.06, 0.005), M_KEPI()));
    chapeu.push(mesh(iH, caixa(0.19, 0.01, 0.075, 0, cabeca + 0.055, 0.16, -0.18), M_COURO()));
  }
  // mochila (Tornister), capote enrolado por cima e fuzil a tiracolo nas costas
  costas.push(mesh(iS, caixa(0.34, 0.30, 0.15, 0, 1.28, -0.16), M_LONA()));
  const rolo = new THREE.CylinderGeometry(0.07, 0.07, 0.38, 10).rotateZ(Math.PI / 2).translate(0, 1.46, -0.16);
  costas.push(mesh(iS, rolo, M_CAPOTE()));
  costas.push(mesh(iS, caixa(0.045, 1.22, 0.05, 0.1, 1.22, -0.27, 0, 0, 0.16), M_MADEIRA()));
  costas.push(mesh(iS, caixa(0.012, 0.3, 0.012, 0.12, 1.88, -0.27, 0, 0, 0.16), M_ACO()));
  // fuzil na mao direita (modelo olha +z: a direita do soldado fica em -x; os dedos apontam para fora de x)
  const hand = new THREE.Vector3().setFromMatrixPosition(sk.boneInverses[iM].clone().invert());
  fuzil.push(mesh(iM, caixa(1.15, 0.05, 0.05, hand.x + 0.1, hand.y, hand.z + 0.02), M_MADEIRA()));
  fuzil.push(mesh(iM, caixa(0.5, 0.025, 0.025, hand.x - 0.75, hand.y, hand.z + 0.02), M_ACO()));
  return {chapeu, costas, fuzil};
};

type Montado = {raiz: THREE.Object3D; mixer: THREE.AnimationMixer; acoes: Record<string, THREE.AnimationAction>; atual?: string; mat: THREE.MeshStandardMaterial; fuzil: THREE.Mesh[]; altura: number; off: number};
const CLIPES = {anda: 'Walk_Formal_Loop', parado: 'Idle_Loop', cai: 'Death01', senta: 'Sitting_Idle_Loop', mira: 'Pistol_Aim_Neutral'};

export const SoldadosRig: React.FC<{kind: Exercito; n: number; t: number; fig: (i: number) => FigRig | null; seed?: number; cadencia?: number; sombra?: boolean; quais?: (i: number) => boolean; fuzilNaMao?: boolean}> =
  ({kind, n, t, fig, seed = 1, cadencia = 0.9, sombra = true, quais, fuzilNaMao = false}) => {
  const corpo = useGLTF(staticFile('acabamento/pessoas/masc.gltf')), anim = useGLTF(staticFile('acabamento/pessoas/anim.glb'));
  const clipes = useMemo(() => Object.fromEntries(anim.animations.map((c) => [c.name, c])), [anim]);
  const montados = useMemo<Montado[]>(() => {
    // pecas: desenhadas uma vez no esqueleto-base (as boneInverses sao iguais nos clones)
    let skBase: THREE.Skeleton | null = null;
    corpo.scene.traverse((o: any) => { if (o.isSkinnedMesh && !skBase) skBase = o.skeleton; });
    const pecas = montarPecas(skBase as unknown as THREE.Skeleton, kind);
    const lista: Montado[] = [];
    for (let i = 0; i < n; i++) {
      if (quais && !quais(i)) { lista.push(null as any); continue; }
      const raiz = clonarComEsqueleto(corpo.scene) as THREE.Object3D;
      let mat!: THREE.MeshStandardMaterial;
      raiz.traverse((o: any) => {
        if (o.isSkinnedMesh) {
          o.frustumCulled = false; o.castShadow = sombra; o.receiveShadow = true;
          if (/Superhero/i.test(o.material?.name ?? '')) { mat = recolorir(o.material, kind, seed * 997 + i); o.material = mat; }
          if (/Hair/i.test(o.material?.name ?? '')) { o.material = o.material.clone(); o.material.color = new THREE.Color('#2a1f17'); }
        }
      });
      const ossos: Record<string, THREE.Object3D> = {}; raiz.traverse((o) => { if ((o as any).isBone) ossos[o.name] = o; });
      for (const p of pecas.chapeu) ossos.Head.add(p.clone());
      for (const p of pecas.costas) ossos.spine_03.add(p.clone());
      const fz = pecas.fuzil.map((p) => { const c = p.clone(); c.visible = false; ossos.hand_r.add(c); return c; });
      raiz.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).frustumCulled = false; });
      lista.push({raiz, mixer: new THREE.AnimationMixer(raiz), acoes: {}, mat, fuzil: fz, altura: 0.95 + 0.1 * hash(i, seed + 5), off: hash(i, seed + 6)});
    }
    return lista;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corpo, kind, n, seed]);

  montados.forEach((m, i) => {
    if (!m) return;
    const f = fig(i);
    if (!f || (f.vis ?? 1) <= 0.001) { m.raiz.visible = false; return; }
    m.raiz.visible = true;
    const sc = (f.sc ?? 1) * (f.vis ?? 1) * m.altura;
    m.raiz.position.set(f.x, f.y ?? 0, f.z); m.raiz.rotation.set(0, f.ry + Math.PI / 2, 0); m.raiz.scale.setScalar(sc);
    const clipeNome = (f.fall ?? 0) > 0.001 ? CLIPES.cai : (f.sit ?? 0) > 0.5 ? CLIPES.senta : (f.aim ?? 0) > 0.5 ? CLIPES.mira : (f.gait ?? 0) > 0.5 ? CLIPES.anda : CLIPES.parado;
    const clip = clipes[clipeNome] ?? clipes[CLIPES.parado];
    if (m.atual !== clipeNome) { m.mixer.stopAllAction(); m.acoes[clipeNome] = m.acoes[clipeNome] ?? m.mixer.clipAction(clip); m.acoes[clipeNome].play(); m.atual = clipeNome; }
    const dur = clip.duration;
    let tempo: number;
    if (clipeNome === CLIPES.cai) tempo = Math.min(dur - 1e-3, (f.fall ?? 0) * dur * 0.9);
    else if (clipeNome === CLIPES.anda) tempo = (((t * cadencia * (0.94 + 0.12 * m.off) + m.off) % 1 + 1) % 1) * dur;
    else tempo = ((t * 0.5 + m.off * dur) % dur + dur) % dur;
    m.acoes[clipeNome].time = tempo; m.mixer.update(0);
    m.mat.userData.u.uCinza.value = f.grau ?? 0;
    for (const fz of m.fuzil) fz.visible = fuzilNaMao || (f.aim ?? 0) > 0.5;
  });
  return <group>{montados.map((m, i) => (m ? <primitive key={i} object={m.raiz} /> : null))}</group>;
};

// escolhe os `quantos` mais proximos de `ponto` (x, z) numa formacao: para dar o esqueleto so a quem aparece de perto. Determinista:
// use um instante de referencia fixo para a formacao (a ordem de proximidade nao muda enquanto o bloco marcha junto).
export const escolherPerto = (figRef: (i: number) => {x: number; z: number} | null, n: number, ponto: [number, number], quantos: number): ((i: number) => boolean) => {
  const d: [number, number][] = [];
  for (let i = 0; i < n; i++) { const f = figRef(i); if (f) d.push([Math.hypot(f.x - ponto[0], f.z - ponto[1]), i]); }
  d.sort((a, b) => a[0] - b[0]);
  const S = new Set(d.slice(0, quantos).map((e) => e[1]));
  return (i) => S.has(i);
};
