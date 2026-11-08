// Malecon tropical no equador (Salinas, Ecuador): calcadao de granito, palmeiras, fonte, quiosques, avenida com carros, predios
// low poly ao fundo, praia com guarda-sois, bolas e pranchas, veleiro, mar estilizado com espuma. UM parametro (p) dirige tudo:
// o mar sobe pela praia e invade o malecon, a multidao foge/cai/e arrastada, os guarda-sois boiam e depois voam (peso caindo),
// o dia gira cada vez mais rapido. Tudo funcao de (tw, p, plano): nada acumula entre quadros.
// Pecas do Fab (assets/fab): Small Town, Large Low Poly Building, Flat Style Vehicles (carros, predios, poste), Beach Umbrella,
// Beach Ball, Free Surfboards, Coastal Skiff Sailboat, Modern Street Props (banco). Pessoas Quaternius (pessoas.tsx), palmeiras
// CC0 (palmeiras.tsx), mar e ceu de comum.tsx, nuvens <Clouds> do drei (seed fixa, speed 0, deriva por t), Look.tsx.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useFrame, useThree} from '@react-three/fiber';
import {Cloud, Clouds, useTexture} from '@react-three/drei';
import {staticFile} from 'remotion';
import {Ceu, Luz, Mar, Sol, rnd} from './comum';
import {Multidao3D} from './pessoas';
import {Palmeiras, PalmeiraItem} from './palmeiras';
import {materialAreia, useAreiaPBR, useHDR} from './ambiente';
import {Fonte} from './fonte';
import {clonar, comPaleta, malhasDe, useFab, usePaletas} from './fab';
import {Perfil} from '../look/Look';
import {Plano} from '../roteiro';
import {Z_PRAIA0, Y_TOPO_PRAIA, Y_RUA, dirSol, smooth, pChegada} from '../fisica';
import {DURACAO} from '../roteiro';
import {BANCOS, BOLAS, CARROS, GUARDA_SOIS, IDX_VOCE, PALETAS, PALMAS, PESSOAS, POSTES, PRANCHAS, PREDIOS, QUIOSQUES, Y_MAL,
  estadoBola, estadoCarro, estadoGente, estadoGuardaSol, estadoVeleiro, linhaAgua, nivelMar, derivaDesde} from './dados';

// ---------------------------------------------------------------- luz do quadro
export const luzDoP = (p: number): Luz => {
  const s = new THREE.Vector3(...dirSol(p)).normalize();
  const dia = smooth(-0.12, 0.22, s.y);
  const ocaso = Math.max(0, 1 - Math.abs(s.y) / 0.38) * smooth(-0.3, 0.0, s.y);
  return {dia, ocaso, sol: s};
};
export const corHorizonte = (l: Luz) => new THREE.Color(0.06, 0.08, 0.14).lerp(new THREE.Color(0.80, 0.87, 0.95), l.dia).lerp(new THREE.Color(1.0, 0.64, 0.45), l.ocaso * 0.75);
export const perfilMalecon = (p: number, plano: Plano): Perfil => {
  const l = luzDoP(p);
  return {ao: true, bloom: 0.42 + 0.35 * (1 - l.dia), limiar: 0.82, saturacao: 0.1, contraste: 0.07, brilho: 0.06 * (1 - l.dia), vinheta: 0.38,
    nevoa: {cor: corHorizonte(l), densidade: plano.id === 'A' ? 0.0016 : 0.0022, max: 0.62},
    // god rays so no plano que olha para o Sol (C, para o mar/oeste). Com o Sol atras da camera o GodRaysEffect desenha um disco
    // enorme no meio do quadro (A e B). Valor fixo por plano: mudar a forca a cada quadro recompilaria a cadeia do Look.
    raios: plano.id === 'C' ? 0.32 : 0};
};

// ---------------------------------------------------------------- camera
const Camera: React.FC<{plano: Plano; u: number}> = ({plano, u}) => {
  const {camera} = useThree();
  const c = plano.cam(u), cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...c.pos); cam.fov = c.fov; cam.near = 0.2; cam.far = 6000; cam.lookAt(...c.alvo); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  return null;
};

// ---------------------------------------------------------------- chao: praia em rampa, muro, malecon de granito, avenida, calcada
const Chao: React.FC = () => {
  const areia = useAreiaPBR(24);
  const [gD, gN, gR, aD, aN, aR] = useTexture(['tex/granite_tile_04_diff_2k.jpg', 'tex/granite_tile_04_nor_gl_2k.jpg', 'tex/granite_tile_04_rough_2k.jpg',
    'tex/clean_asphalt_diff_1k.jpg', 'tex/clean_asphalt_nor_gl_1k.jpg', 'tex/clean_asphalt_rough_1k.jpg'].map((f) => staticFile(f)));
  const malhas = useMemo(() => {
    const rep = (t: THREE.Texture, x: number, y: number, srgb = false) => { const c = t.clone(); c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(x, y); c.anisotropy = 8; if (srgb) c.colorSpace = THREE.SRGBColorSpace; c.needsUpdate = true; return c; };
    const L = 280;
    // praia: plano com a rampa nos vertices; abaixo de Z_PRAIA0 o fundo desce devagar (o mar escurece com a profundidade)
    const gp = new THREE.PlaneGeometry(L, 140, 1, 140).rotateX(-Math.PI / 2).translate(0, 0, -70);
    const pos = gp.attributes.position;
    for (let i = 0; i < pos.count; i++) { const z = pos.getZ(i); pos.setY(i, z >= Z_PRAIA0 ? (Y_TOPO_PRAIA * (z - Z_PRAIA0)) / -Z_PRAIA0 : 0.06 * (z - Z_PRAIA0)); }
    gp.computeVertexNormals(); gp.setAttribute('uv2', gp.attributes.uv);
    const praia = new THREE.Mesh(gp, materialAreia(areia, L, 140)); praia.receiveShadow = true;
    // malecon (granito) de z 0 a 11, topo em Y_MAL; muro de frente para a praia
    const granito = new THREE.MeshStandardMaterial({map: rep(gD, L / 3.2, 11 / 3.2, true), normalMap: rep(gN, L / 3.2, 11 / 3.2), roughnessMap: rep(gR, L / 3.2, 11 / 3.2), color: '#f4ece0'});
    const mal = new THREE.Mesh(new THREE.BoxGeometry(L, Y_MAL, 11), granito); mal.position.set(0, Y_MAL / 2, 5.5); mal.receiveShadow = true;
    const muro = new THREE.Mesh(new THREE.BoxGeometry(L, 0.35, 0.5), new THREE.MeshStandardMaterial({color: '#efe7da', roughness: 0.7}));
    muro.position.set(0, Y_MAL + 0.12, 0.1); muro.castShadow = muro.receiveShadow = true;
    // avenida (asfalto) z 11..20 e calcada do outro lado z 20..120
    const asf = new THREE.MeshStandardMaterial({map: rep(aD, L / 6, 9 / 6, true), normalMap: rep(aN, L / 6, 9 / 6), roughnessMap: rep(aR, L / 6, 9 / 6), color: '#9aa0aa'});
    const rua = new THREE.Mesh(new THREE.BoxGeometry(L, Y_RUA, 9), asf); rua.position.set(0, Y_RUA / 2, 15.5); rua.receiveShadow = true;
    const calc = new THREE.Mesh(new THREE.BoxGeometry(L, Y_MAL, 100), new THREE.MeshStandardMaterial({map: rep(gD, L / 4, 100 / 4, true), color: '#cfc9c0', roughness: 0.9}));
    calc.position.set(0, Y_MAL / 2, 70); calc.receiveShadow = true;
    // faixas da avenida (tracejado branco) e meio-fio
    const faixa = new THREE.InstancedMesh(new THREE.PlaneGeometry(3, 0.16).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({color: '#f3f1ea', roughness: 0.6}), 3 * 47);
    const m4 = new THREE.Matrix4(); let k = 0;
    for (const z of [13.7, 15.7, 17.7]) for (let x = -138; x < 138; x += 6) { m4.makeTranslation(x, Y_RUA + 0.01, z + (z === 15.7 ? 0 : 0)); if (k < 141) faixa.setMatrixAt(k++, m4); }
    faixa.count = k; faixa.receiveShadow = true;
    const meio = new THREE.Mesh(new THREE.BoxGeometry(L, 0.1, 0.3), new THREE.MeshStandardMaterial({color: '#d9d3c8'}));
    meio.position.set(0, Y_RUA + 0.05, 15.7);
    const g = new THREE.Group(); [praia, mal, muro, rua, calc, faixa, meio].forEach((o) => g.add(o));
    return g;
  }, [areia, gD, gN, gR, aD, aN, aR]);
  return <primitive object={malhas} />;
};

// ---------------------------------------------------------------- cidade: predios do Flat Style + Large Low Poly Building + Small Town no fundo
const NOMES_PREDIOS = ['buildings_11', 'buildings_5', 'buildings_13', 'buildings_10', 'buildings_16', 'buildings_7', 'buildings_8'];
const Cidade: React.FC = () => {
  const glbs = NOMES_PREDIOS.map((n) => useFab(`veic/${n}.glb`));
  const grande = useFab('large_low_poly_building.glb'), town = useFab('small_town.glb'), quiosque = useFab('veic/buildings_4.glb');
  const g = useMemo(() => {
    const grupo = new THREE.Group();
    PREDIOS.forEach((pr) => { const o = clonar(glbs[NOMES_PREDIOS.indexOf(pr.nome)].scene); o.scale.setScalar(pr.e); o.position.set(pr.x, Y_MAL, pr.z); o.rotation.y = pr.ry; grupo.add(o); });
    [[-58, 52], [46, 56]].forEach(([x, z], i) => { const o = clonar(grande.scene); o.position.set(x, Y_MAL, z); o.rotation.y = i * 1.2 + 0.3; grupo.add(o); });
    const t = clonar(town.scene, false); t.position.set(10, Y_MAL, 150); grupo.add(t);
    QUIOSQUES.forEach((q, i) => { const o = clonar(quiosque.scene); o.scale.setScalar(0.75); o.position.set(q.x, Y_MAL, q.z); o.rotation.y = i ? Math.PI * 0.5 : -Math.PI * 0.5; grupo.add(o); });
    return grupo;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grande, town, quiosque, ...glbs]);
  return <primitive object={g} />;
};

// ---------------------------------------------------------------- mobiliario: bancos e postes (lampadas acendem a noite)
const Mobiliario: React.FC<{noite: number}> = ({noite}) => {
  const banco = useFab('modern_street_props.glb'), poste = useFab('veic/enviroment_Pole.glb');
  const {g, lamp} = useMemo(() => {
    const g = new THREE.Group();
    BANCOS.forEach((b) => { const o = clonar(banco.scene); o.position.set(b.x, Y_MAL, b.z); o.rotation.y = Math.PI / 2; g.add(o); });
    const lamp = new THREE.MeshStandardMaterial({color: '#fff3d6', emissive: '#ffd58a', emissiveIntensity: 0});
    POSTES.forEach((pt) => {
      const o = clonar(poste.scene); o.scale.setScalar(1.15); o.position.set(pt.x, Y_MAL, pt.z); o.rotation.y = Math.PI / 2; g.add(o);
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 10), lamp); l.position.set(pt.x, Y_MAL + 6.9, pt.z - 1.25); g.add(l);
    });
    return {g, lamp};
  }, [banco, poste]);
  lamp.emissiveIntensity = 0.2 + 7 * noite;
  return <primitive object={g} />;
};

// ---------------------------------------------------------------- guarda-sois (instanciados, cor por instancia), bolas, pranchas, veleiro
const CORES_GS = ['#e8433a', '#f2b134', '#2a9d8f', '#e2457a', '#3b6fd0'];
const GuardaSois: React.FC<{tw: number; p: number}> = ({tw, p}) => {
  const gl = useFab('beach_umbrella.glb');
  const im = useMemo(() => {
    const [m] = malhasDe(gl.scene);
    const mat = (m.mat as THREE.MeshStandardMaterial).clone();
    // a lona azul do pacote vira a cor da instancia (o branco fica branco)
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aCor; varying vec3 vCorGS;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvCorGS = aCor;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vCorGS;').replace('#include <map_fragment>', `#include <map_fragment>
  float azul = smoothstep(0.05, 0.25, diffuseColor.b - max(diffuseColor.r, diffuseColor.g));
  float lum = dot(diffuseColor.rgb, vec3(0.3, 0.5, 0.2));
  diffuseColor.rgb = mix(diffuseColor.rgb, vCorGS * (0.55 + 0.9 * lum), azul);`);
    };
    mat.customProgramCacheKey = () => 'guarda_sol_cor';
    const geo = m.geo.clone();
    const cores = new Float32Array(GUARDA_SOIS.length * 3); const c = new THREE.Color();
    GUARDA_SOIS.forEach((g, i) => { c.set(CORES_GS[g.cor]).convertSRGBToLinear(); cores.set([c.r, c.g, c.b], i * 3); });
    geo.setAttribute('aCor', new THREE.InstancedBufferAttribute(cores, 3));
    const im = new THREE.InstancedMesh(geo, mat, GUARDA_SOIS.length); im.castShadow = im.receiveShadow = true; im.frustumCulled = false;
    return im;
  }, [gl]);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1.9, 1.9, 1.9), v = new THREE.Vector3();
  GUARDA_SOIS.forEach((g, k) => {
    const st = estadoGuardaSol(g, k, tw, p);
    e.set(st.rx, st.ry, st.rz, 'YXZ'); q.setFromEuler(e); v.set(st.x, st.y, st.z); m4.compose(v, q, s); im.setMatrixAt(k, m4);
  });
  im.instanceMatrix.needsUpdate = true;
  return <primitive object={im} />;
};
const Bolas: React.FC<{tw: number; p: number}> = ({tw, p}) => {
  const gl = useFab('beach_ball.glb');
  const objs = useMemo(() => BOLAS.map(() => clonar(gl.scene)), [gl]);
  BOLAS.forEach((b, k) => { const st = estadoBola(b, tw, p); objs[k].position.set(st.x, st.y - 0.2, st.z); objs[k].rotation.set(st.r, st.r * 0.6, 0); objs[k].scale.setScalar(1.6); });
  return <>{objs.map((o, k) => <primitive key={k} object={o} />)}</>;
};
const Pranchas: React.FC<{tw: number; p: number}> = ({tw, p}) => {
  const gl = useFab('surfboards.glb');
  const sets = useMemo(() => PRANCHAS.map((pr) => { const o = clonar(gl.scene); o.position.set(pr.x, Y_TOPO_PRAIA * (pr.z - Z_PRAIA0) / -Z_PRAIA0 - 0.05, pr.z); o.rotation.y = pr.r;
    const tabuas: THREE.Object3D[] = []; o.traverse((n) => { if (/Surfboard_0\d_Surfboard/.test(n.name)) tabuas.push(n); });
    return {o, tabuas, base: tabuas.map((t) => ({p: t.position.clone(), r: t.rotation.clone()}))}; }), [gl]);
  const n = nivelMar(p);
  sets.forEach((st, i) => {
    const pr = PRANCHAS[i], pA = pChegada(pr.z) + 0.01;
    st.tabuas.forEach((t, k) => {
      const b = st.base[k]; t.position.copy(b.p); t.rotation.copy(b.r);
      if (p <= pA) return;
      // a agua chega: a prancha deita, boia no nivel do mar e vai com a corrente (no espaco do conjunto, que nao gira com o mar)
      const sd = rnd(i * 9 + k), tc = (p - pA) * DURACAO, d = derivaDesde(pA, p, 0.9 + sd * 0.6), deita = smooth(0, 1.2, tc);
      t.rotation.x = b.r.x - 1.5 * deita; t.rotation.z = b.r.z + 0.25 * Math.sin(tw * 1.3 + sd * 6) * deita;
      t.position.set(b.p.x + d[0], Math.max(b.p.y, n - st.o.position.y + 0.05) * deita + b.p.y * (1 - deita), b.p.z + d[1]);
    });
  });
  return <>{sets.map((st, k) => <primitive key={k} object={st.o} />)}</>;
};
const Veleiro: React.FC<{tw: number; p: number}> = ({tw, p}) => {
  const gl = useFab('wooden_sailboat.glb');
  const o = useMemo(() => clonar(gl.scene), [gl]);
  const st = estadoVeleiro(tw, p);
  o.position.set(st.x, st.y, st.z); o.rotation.set(st.rx, st.ry, st.rz, 'YXZ');
  return <primitive object={o} />;
};

// ---------------------------------------------------------------- carros (Flat Style Vehicles, paleta por carro)
const Carros: React.FC<{tw: number; p: number}> = ({tw, p}) => {
  const modelos = Array.from(new Set(CARROS.map((c) => c.modelo)));
  const glbs = modelos.map((m) => useFab(`veic/${m}.glb`));
  const pal = usePaletas(PALETAS);
  const objs = useMemo(() => CARROS.map((c) => { const o = comPaleta(clonar(glbs[modelos.indexOf(c.modelo)].scene), pal[c.modelo === 'car24' ? 'yellow' : c.paleta]); o.scale.setScalar(0.92); return o; }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
    [pal, ...glbs]);
  CARROS.forEach((c, k) => { const st = estadoCarro(c, tw, p); objs[k].position.set(st.x, st.y, st.z); objs[k].rotation.set(st.rx, st.ry, st.rz, 'YXZ'); });
  return <>{objs.map((o, k) => <primitive key={k} object={o} />)}</>;
};

// as nuvens do drei leem matrixWorld no useFrame; num still (quadro unico) ela ainda era a identidade e as nuvens nasciam no chao.
// Atualiza as matrizes ANTES (prioridade negativa roda primeiro).
const AtualizaMatrizes: React.FC = () => { const {scene} = useThree(); useFrame(() => { scene.updateMatrixWorld(true); }, -1); return null; };

// ---------------------------------------------------------------- nuvens (drei <Clouds>: seed fixa, speed 0; a deriva e funcao de t)
const Nuvens: React.FC<{tw: number; p: number; luz: Luz}> = ({tw, p, luz}) => {
  const cor = new THREE.Color('#ffffff').lerp(new THREE.Color('#ffb48a'), luz.ocaso * 0.7);
  const vento = tw * (2 + 10 * p);
  return (
    <Clouds material={THREE.MeshLambertMaterial} texture={staticFile('nuvem_tufo.png')} limit={260} frustumCulled={false}>
      {Array.from({length: 11}, (_, k) => {
        const x = ((-420 + k * 85 + vento + rnd(k) * 40 + 520) % 1040) - 520, z = -380 - rnd(k + 5) * 420, y = 90 + rnd(k + 9) * 70;
        return <Cloud key={k} seed={k + 1} segments={22} bounds={[38 + rnd(k + 3) * 30, 9, 16]} volume={34 + rnd(k + 7) * 20} smallestVolume={0.4}
          growth={4} speed={0} fade={60} opacity={0.95} color={cor} position={[x, y, z]} />;
      })}
    </Clouds>
  );
};

// ---------------------------------------------------------------- mundo
export const Malecon: React.FC<{tw: number; p: number; plano: Plano; u: number}> = ({tw, p, plano, u}) => {
  const {scene, camera} = useThree();
  const luz = luzDoP(p);
  const hdr = useHDR('praia');
  useMemo(() => { hdr.mapping = THREE.EquirectangularReflectionMapping; }, [hdr]);
  scene.environment = hdr; (scene as any).environmentIntensity = 0.12 + 0.55 * luz.dia + 0.15 * luz.ocaso;
  const noite = 1 - smooth(0.0, 0.5, luz.dia + luz.ocaso * 0.6);
  const palmas = useMemo<PalmeiraItem[]>(() => PALMAS.map((x) => ({...x})), []);
  const c = plano.cam(u);
  const foco = new THREE.Vector3(...c.alvo);
  const n = nivelMar(p), costa = linhaAgua(p);
  // quem esta muito perto da camera some (evita boneco gigante cortado na frente da lente)
  const camV = new THREE.Vector3(...c.pos);
  return (
    <>
      <Camera plano={plano} u={u} />
      <AtualizaMatrizes />
      <Ceu luz={luz} centro={[camV.x, 0, camV.z]} raio={4500} />
      <Sol luz={luz} foco={foco} area={plano.id === 'A' ? 75 : 45} noiteLuz={1.15} />
      {!String((globalThis as any).__dbg ?? '').includes('semNuvem') && <Nuvens tw={tw} p={p} luz={luz} />}
      <Chao />
      <Mar t={tw * (1 + 1.5 * p)} luz={luz} costa={costa} nivel={n} espuma={1.1 + 0.8 * p} agit={0.08 + 0.45 * p} tamanho={3000} centro={[0, 0]} />
      <Cidade />
      <Mobiliario noite={noite} />
      <Fonte tw={tw} p={p} />
      <Palmeiras lista={palmas} t={tw} vento={1 + 2.2 * smooth(0.3, 1, p)} sol={luz.sol} corSol={luz.ocaso > 0.3 ? '#ffc08a' : '#fff1dc'} ventoDir={[1, 0.5]} />
      <GuardaSois tw={tw} p={p} />
      <Bolas tw={tw} p={p} />
      <Pranchas tw={tw} p={p} />
      <Veleiro tw={tw} p={p} />
      <Carros tw={tw} p={p} />
      <Multidao3D lista={PESSOAS} t={tw} de={[0, 0]} cam={camV} raio={plano.id === 'A' ? 0 : 1.6}
        estadoDe={(q, k, t) => estadoGente(PESSOAS[k], t, p)} />
    </>
  );
};
export {IDX_VOCE};
