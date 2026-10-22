// Corpo em primeira pessoa (dono: agente Corpo): o braco esquerdo com o relogio (5 vezes) e o corpo inteiro (pernas, pes, maos)
// quando a camera olha para baixo (inclinacao < -45 graus). Tudo preso a poseCamera(t); nada acumulado entre quadros.
// Corpo = humano Quaternius (CC0) com roupa pintada no shader pela regiao do corpo na pose de bind (camisa cinza de manga longa
// arregacada, calca jeans, tenis claros). Braco do relogio: o mesmo modelo, so o antebraco e a mao (o resto e descartado no shader),
// com os ossos posados por direcao (ombro -> cotovelo -> punho) e os dedos fechados em punho (pose dos dedos do clipe Punch_Cross).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useGLTF} from '@react-three/drei';
import {useThree} from '@react-three/fiber';
import {clone as clonarComEsqueleto} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {staticFile} from 'remotion';
import {poseCamera} from '../roteiro';
import {smooth} from './comum';

// ---------------------------------------------------------------- modelo "voce" (compartilhado com o take)
export type ModoVoce = 0 | 1 | 2;   // 0 = corpo sem cabeca (camera dentro da cabeca), 1 = so o antebraco esquerdo, 2 = corpo inteiro
export type Voce = {raiz: THREE.Object3D; mixer: THREE.AnimationMixer; ossos: Record<string, THREE.Bone>; acoes: Record<string, THREE.AnimationAction>;
  punho: Record<string, THREE.Quaternion>; repouso: Record<string, THREE.Quaternion>; bindQ: Record<string, THREE.Quaternion>; mat: THREE.MeshStandardMaterial};

const matVoce = (base: THREE.MeshStandardMaterial, modo: ModoVoce) => {
  const m = base.clone();
  m.side = THREE.DoubleSide;
  m.normalScale = new THREE.Vector2(0.3, 0.3);   // o relevo de 'super-heroi' do modelo base some debaixo da roupa
  const u = {uPele: {value: new THREE.Color('#d9a483')}, uCamisa: {value: new THREE.Color('#8b9097')}, uCalca: {value: new THREE.Color('#2e4d7c')},
    uTenis: {value: new THREE.Color('#eeebe4')}, uModo: {value: modo}, uManga: {value: 0.545}};
  m.userData.u = u;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vBind;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBind = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vBind;
uniform vec3 uPele; uniform vec3 uCamisa; uniform vec3 uCalca; uniform vec3 uTenis; uniform float uModo; uniform float uManga;
// regioes na pose de bind (T-pose de 1,81 m, braco esquerdo em +x): camisa, calca, tenis
float mCamisa(){ float ax = abs(vBind.x), y = vBind.y;
  return max(step(ax, 0.27) * step(0.93, y) * step(y, 1.565), step(0.12, ax) * step(ax, uManga) * step(1.22, y) * step(y, 1.66)); }
float mCalca(){ return step(abs(vBind.x), 0.33) * step(vBind.y, 0.975) * step(0.105, vBind.y); }
float mTenis(){ return step(abs(vBind.x), 0.33) * step(vBind.y, 0.105); }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
  if (uModo > 0.5 && uModo < 1.5 && vBind.x < 0.40) discard;
  if (uModo < 0.5 && vBind.y > 1.56 && abs(vBind.x) < 0.17) discard;
  float lum = dot(diffuseColor.rgb, vec3(0.333));
  float ax = abs(vBind.x);
  // pele: tom fixo com um pouco do relevo da textura (o traje escuro do modelo some)
  vec3 cor = uPele * (0.93 + 0.12 * smoothstep(0.05, 0.6, lum));
  // unhas/nós mais claros nas pontas dos dedos
  cor = mix(cor, uPele * 1.08, smoothstep(0.86, 0.92, ax) * step(1.3, vBind.y));
  float cam = mCamisa(), cal = mCalca(), ten = mTenis();
  // camisa: malha com trama fina e a dobra da manga arregacada (faixa mais clara com sombra na borda)
  float trama = 0.95 + 0.05 * sin(vBind.y * 900.0) * sin(vBind.x * 900.0 + vBind.z * 700.0);
  float dobra = smoothstep(uManga - 0.045, uManga - 0.03, ax) * step(1.2, vBind.y);
  vec3 camisa = uCamisa * trama * (1.0 + 0.12 * dobra) * (1.0 - 0.35 * smoothstep(uManga - 0.006, uManga, ax));
  // jeans: sarja diagonal + desbotado nos joelhos e nas coxas
  float sarja = 0.94 + 0.06 * sin((vBind.x * 0.8 + vBind.y) * 1300.0);
  float desb = 0.18 * exp(-pow((vBind.y - 0.55) / 0.12, 2.0)) + 0.10 * exp(-pow((vBind.y - 0.8) / 0.10, 2.0));
  vec3 jeans = mix(uCalca, vec3(0.55, 0.66, 0.82), desb) * sarja;
  vec3 tenis = mix(uTenis, vec3(0.55, 0.55, 0.56), step(vBind.y, 0.022));
  tenis = mix(tenis, uTenis * 0.82, step(0.07, vBind.y) * step(vBind.y, 0.085));   // costura do cano
  cor = mix(cor, camisa, cam);
  cor = mix(cor, jeans, cal * (1.0 - cam));
  cor = mix(cor, tenis, ten);
  diffuseColor.rgb = cor;`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  { float pano = max(mCamisa(), max(mCalca(), mTenis())); roughnessFactor = mix(roughnessFactor, 0.88, pano); }`);
  };
  m.customProgramCacheKey = () => 'voce_corpo';
  return m;
};

const DEDOS = /^(index|middle|ring|pinky|thumb)_0[1-3]_[lr]$/;

// tenis claro (o modelo base e descalco): elipsoide com sola reta, biqueira afilada, cano mais alto no calcanhar, cores por vertice
const geoTenis = (() => {
  let g: THREE.BufferGeometry | null = null;
  return () => {
    if (g) return g;
    g = new THREE.SphereGeometry(1, 40, 28);
    const P = g.attributes.position as THREE.BufferAttribute, cor: number[] = [];
    const branco = new THREE.Color('#f2f0eb'), sola = new THREE.Color('#b9b6b0'), cadarco = new THREE.Color('#d9d6cf'), faixa = new THREE.Color('#c9ced6');
    for (let i = 0; i < P.count; i++) {
      const xu = P.getX(i), yu = P.getY(i), zu = P.getZ(i);
      const f = (zu + 1) / 2;   // 0 calcanhar .. 1 biqueira
      const larg = 0.051 * (zu > 0 ? 1 - 0.32 * zu * zu : 1 - 0.18 * zu * zu);
      const alt = 0.105 - 0.06 * f;
      const yy = Math.max(yu, -0.55), y = ((yy + 0.55) / 1.55) * alt;
      const x = xu * larg, z = zu * 0.152 + 0.012;
      P.setXYZ(i, x, y, z);
      let c = branco;
      if (y < 0.021) c = sola;
      else if (Math.abs(x) < 0.022 && y > alt * 0.78 && f > 0.35 && f < 0.75) c = cadarco;
      else if (y > 0.028 && y < 0.04 && Math.abs(x) > 0.035) c = faixa;
      cor.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3));
    g.computeVertexNormals();
    return g;
  };
})();

export const criaVoce = (cena: THREE.Object3D, clipes: Record<string, THREE.AnimationClip>, modo: ModoVoce, cabelo?: THREE.Object3D): Voce => {
  const raiz = clonarComEsqueleto(cena) as THREE.Object3D;
  let mat: THREE.MeshStandardMaterial | null = null;
  const ossos: Record<string, THREE.Bone> = {};
  raiz.traverse((o: any) => {
    if (o.isBone) ossos[o.name] = o;
    if (o.isSkinnedMesh || o.isMesh) {
      o.frustumCulled = false; o.castShadow = false; o.receiveShadow = false;
      if (/Superhero/.test(o.material?.name ?? '')) { mat = mat ?? matVoce(o.material, modo); o.material = mat; }
      else if (modo !== 2) o.visible = false;   // olhos e sobrancelhas: so no corpo inteiro (take)
    }
  });
  if (cabelo && modo === 2) {
    const cab = clonarComEsqueleto(cabelo) as THREE.Object3D;
    cab.traverse((o: any) => {
      if (o.isSkinnedMesh) {
        const sk = new THREE.Skeleton(o.skeleton.bones.map((b: THREE.Bone) => ossos[b.name] ?? b), o.skeleton.boneInverses);
        const m = o.clone(); m.bind(sk, o.bindMatrix); m.frustumCulled = false;
        m.material = o.material.clone(); m.material.color = new THREE.Color('#2b1d14'); raiz.add(m);
      }
    });
  }
  // orientacao de bind (mundo do modelo) do antebraco e da mao: o dorso da mao aponta para +y na T-pose
  raiz.updateMatrixWorld(true);
  if (modo !== 1) {
    const matT = new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.72, metalness: 0});
    for (const [lado, x] of [['l', 0.114], ['r', -0.114]] as const) {
      const pe = ossos['foot_' + lado]; if (!pe) continue;
      const m = new THREE.Mesh(geoTenis(), matT); m.castShadow = false; m.frustumCulled = false;
      const T = new THREE.Matrix4().makeTranslation(x, -0.004, 0);
      m.applyMatrix4(pe.matrixWorld.clone().invert().multiply(T));
      pe.add(m);
    }
  }
  const bindQ: Record<string, THREE.Quaternion> = {};
  const repouso: Record<string, THREE.Quaternion> = {};
  for (const n in ossos) repouso[n] = ossos[n].quaternion.clone();
  for (const n of ['upperarm_l', 'lowerarm_l', 'hand_l']) bindQ[n] = ossos[n].getWorldQuaternion(new THREE.Quaternion());
  // dedos em punho: pose dos dedos do clipe de soco
  const mixer = new THREE.AnimationMixer(raiz);
  const punho: Record<string, THREE.Quaternion> = {};
  const soco = clipes.Punch_Cross;
  if (soco) {
    const a = mixer.clipAction(soco); a.play(); a.time = 0.15; mixer.update(0);
    for (const n in ossos) if (DEDOS.test(n)) punho[n] = ossos[n].quaternion.clone();
    mixer.stopAllAction();
  }
  return {raiz, mixer, ossos, acoes: {}, punho, repouso, bindQ, mat: mat!};
};

// toca um clipe num tempo absoluto (sem acumular nada)
export const poseClipe = (v: Voce, clipes: Record<string, THREE.AnimationClip>, nome: string, tempo: number) => {
  const clip = clipes[nome] ?? clipes.Idle_Loop;
  if (!v.acoes[nome]) { v.mixer.stopAllAction(); v.acoes = {[nome]: v.mixer.clipAction(clip)}; v.acoes[nome].play(); }
  const a = v.acoes[nome];
  a.time = ((tempo % clip.duration) + clip.duration) % clip.duration;
  v.mixer.update(0);
};

// orienta um osso no mundo: eixo local +y (comprimento do osso) para 'dir'; o eixo local que era o dorso (+y do mundo na bind) para 'dorso'
const _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _qp = new THREE.Quaternion();
const orientaOsso = (b: THREE.Bone, bindQ: THREE.Quaternion, dir: THREE.Vector3, dorso: THREE.Vector3) => {
  const ly = new THREE.Vector3(0, 1, 0);
  const lb = new THREE.Vector3(0, 1, 0).applyQuaternion(bindQ.clone().invert());       // dorso no espaco local
  lb.addScaledVector(ly, -lb.dot(ly)).normalize();
  const lz = new THREE.Vector3().crossVectors(ly, lb);
  const wy = dir.clone().normalize();
  const wb = dorso.clone().addScaledVector(wy, -dorso.dot(wy)).normalize();
  const wz = new THREE.Vector3().crossVectors(wy, wb);
  _m1.makeBasis(ly, lb, lz); _m2.makeBasis(wy, wb, wz);
  _q.setFromRotationMatrix(_m2.multiply(_m1.transpose()));
  b.parent!.getWorldQuaternion(_qp);
  b.quaternion.copy(_qp.invert().multiply(_q));
  b.updateMatrixWorld(true);
};

// ---------------------------------------------------------------- relogio
const texMostrador = () => {
  const S = 1024, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d')!, R = S / 2;
  const g = c.createRadialGradient(R, R * 0.8, R * 0.1, R, R, R);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.85, '#f2f2ef'); g.addColorStop(1, '#d9d9d4');
  c.fillStyle = g; c.beginPath(); c.arc(R, R, R, 0, Math.PI * 2); c.fill();
  c.translate(R, R);
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2, h = i % 5 === 0;
    c.save(); c.rotate(a);
    c.fillStyle = h ? '#1b1c1f' : '#55575c';
    if (h) c.fillRect(-9, -R * 0.93, 18, R * 0.12); else c.fillRect(-3, -R * 0.93, 6, R * 0.05);
    c.restore();
  }
  c.fillStyle = '#1b1c1f'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = `600 ${Math.round(R * 0.2)}px "Helvetica Neue", Arial, sans-serif`;
  for (let h = 1; h <= 12; h++) {
    const a = (h / 12) * Math.PI * 2; c.fillText(String(h), Math.sin(a) * R * 0.66, -Math.cos(a) * R * 0.66);
  }
  c.font = `500 ${Math.round(R * 0.065)}px "Helvetica Neue", Arial, sans-serif`;
  c.fillStyle = '#6a6c72';
  (c as any).letterSpacing = '6px';
  c.fillText('QUARTZ', 0, R * 0.36);
  c.font = `600 ${Math.round(R * 0.075)}px Georgia, "Times New Roman", serif`; c.fillStyle = '#2a2b30';
  c.fillText('WHAT IF', 0, -R * 0.34);
  // pontos luminescentes nas horas
  c.fillStyle = 'rgba(160,220,170,0.9)';
  for (let h = 0; h < 12; h++) { const a = (h / 12) * Math.PI * 2; c.beginPath(); c.arc(Math.sin(a) * R * 0.97 * 0.9, -Math.cos(a) * R * 0.97 * 0.9, 7, 0, 7); c.fill(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
const texReflexo = () => {
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d')!;
  c.translate(S / 2, S / 2); c.rotate(-0.7);
  const g = c.createLinearGradient(0, -S * 0.5, 0, S * 0.5);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.28, 'rgba(255,255,255,0.0)'); g.addColorStop(0.33, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.42, 'rgba(255,255,255,0.12)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(0.62, 'rgba(255,255,255,0.18)'); g.addColorStop(0.66, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(-S, -S, 2 * S, 2 * S);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
};

type Relogio = {grupo: THREE.Group; hora: THREE.Object3D; minuto: THREE.Object3D; segundo: THREE.Object3D; pulseira: THREE.Mesh;
  matLume: THREE.MeshStandardMaterial; matSeg: THREE.MeshStandardMaterial; matFace: THREE.MeshStandardMaterial};
const RC = 0.019;   // raio da caixa (m)
const criaRelogio = (env: THREE.Texture): Relogio => {
  const grupo = new THREE.Group();
  const prata = new THREE.MeshStandardMaterial({color: '#e3e5ea', metalness: 1, roughness: 0.2, envMap: env, envMapIntensity: 1.3});
  const prataEsc = new THREE.MeshStandardMaterial({color: '#a9adb5', metalness: 1, roughness: 0.32, envMap: env});
  // caixa (eixo local z = normal do mostrador)
  const caixa = new THREE.Mesh(new THREE.CylinderGeometry(RC, RC * 1.04, 0.009, 64), prataEsc); caixa.rotation.x = Math.PI / 2; caixa.position.z = -0.0036; grupo.add(caixa);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(RC * 0.97, 0.0018, 16, 72), prata); aro.position.z = 0.002; grupo.add(aro);
  const coroa = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.004, 16), prata); coroa.rotation.z = Math.PI / 2; coroa.position.set(RC + 0.002, 0, -0.001); grupo.add(coroa);
  // alcas
  for (const s of [-1, 1]) for (const k of [-1, 1]) {
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.0022, 0.006, 0.003), prataEsc); a.position.set(k * 0.0068, s * (RC + 0.002), -0.003); grupo.add(a);
  }
  const matFace = new THREE.MeshStandardMaterial({map: texMostrador(), roughness: 0.45, metalness: 0, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0});
  const face = new THREE.Mesh(new THREE.CircleGeometry(RC * 0.9, 64), matFace); face.position.z = 0.0015; grupo.add(face);
  const preto = new THREE.MeshStandardMaterial({color: '#141519', roughness: 0.4, metalness: 0.3});
  const matLume = new THREE.MeshStandardMaterial({color: '#e9f3ea', emissive: new THREE.Color('#9dffb4'), emissiveIntensity: 0, roughness: 0.5});
  const matSeg = new THREE.MeshStandardMaterial({color: '#d01c1c', roughness: 0.4, emissive: new THREE.Color('#ff2a1a'), emissiveIntensity: 0});
  const ponteiro = (comp: number, larg: number, z: number, mat: THREE.Material, lume?: boolean, cauda = 0.18) => {
    const p = new THREE.Group(); p.position.z = z;
    const h = new THREE.Mesh(new THREE.BoxGeometry(larg, comp * (1 + cauda), 0.0005), mat); h.position.y = comp * (1 - cauda) / 2; p.add(h);
    if (lume) { const l = new THREE.Mesh(new THREE.BoxGeometry(larg * 0.45, comp * 0.55, 0.0003), matLume); l.position.set(0, comp * 0.55, 0.0004); p.add(l); }
    grupo.add(p); return p;
  };
  const hora = ponteiro(RC * 0.5, 0.0016, 0.0022, preto, true, 0.15);
  const minuto = ponteiro(RC * 0.76, 0.0011, 0.0027, preto, true, 0.15);
  const segundo = ponteiro(RC * 0.84, 0.00045, 0.0032, matSeg, false, 0.25);
  const pino = new THREE.Mesh(new THREE.CylinderGeometry(0.0009, 0.0009, 0.0012, 16), matSeg); pino.rotation.x = Math.PI / 2; pino.position.z = 0.0037; grupo.add(pino);
  // vidro: leve abaulado com reflexo do ambiente + faixa de reflexo
  const vidro = new THREE.Mesh(new THREE.SphereGeometry(RC * 3.2, 48, 12, 0, Math.PI * 2, 0, Math.asin(0.9 / 3.2)),
    new THREE.MeshPhysicalMaterial({color: '#ffffff', metalness: 0, roughness: 0.02, transparent: true, opacity: 0.16, envMap: env, envMapIntensity: 2.2, clearcoat: 1, depthWrite: false}));
  vidro.rotation.x = Math.PI / 2; vidro.position.z = 0.0042 - RC * 3.2; grupo.add(vidro);
  const refl = new THREE.Mesh(new THREE.CircleGeometry(RC * 0.88, 48), new THREE.MeshBasicMaterial({map: texReflexo(), transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending}));
  refl.position.z = 0.0046; grupo.add(refl);
  // pulseira de couro preto: anel achatado em volta do punho (eixo local x = ao longo do antebraco)
  const pulseira = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 48, 1, true), new THREE.MeshStandardMaterial({color: '#18181a', roughness: 0.55, metalness: 0, side: THREE.DoubleSide}));
  grupo.add(pulseira);
  // fivela/passador visivel na borda
  return {grupo, hora, minuto, segundo, pulseira, matLume, matSeg, matFace};
};

// ---------------------------------------------------------------- momentos
// a: braco ja dentro do quadro; b: comeca a sair. luz: forca da luz de preenchimento; lume: ponteiros luminescentes; esc: escuridao
const RELOGIOS = [
  {a: 14.3, b: 17.0, luz: 0.9, lume: 0, var: 0},
  {a: 254.3, b: 257.2, luz: 0.8, lume: 0, var: 1},
  {a: 391.3, b: 394.6, luz: 0.45, lume: 1, var: 2},
  {a: 489.8, b: 492.3, luz: 0.55, lume: 0.6, var: 3},
  {a: 517.6, b: 520.7, luz: 0.4, lume: 1, var: 4},
];
const HORA0 = 17 * 3600 + 42 * 60 + 7;   // 5:42:07 PM em t = 6,5 s

const pesoRelogio = (t: number) => {
  for (const r of RELOGIOS) if (t > r.a - 0.6 && t < r.b + 0.6) return {r, e: smooth(r.a - 0.5, r.a, t) * (1 - smooth(r.b, r.b + 0.5, t))};
  return null;
};

const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export const Corpo: React.FC<{t: number}> = ({t}) => {
  const {gl} = useThree();
  const masc = useGLTF(staticFile('pessoas/masc.gltf')), anim = useGLTF(staticFile('pessoas/anim.glb'));
  const clipes = useMemo(() => Object.fromEntries(anim.animations.map((c) => [c.name, c])) as Record<string, THREE.AnimationClip>, [anim]);
  const env = useMemo(() => { const p = new THREE.PMREMGenerator(gl); const e = p.fromScene(new RoomEnvironment(), 0.04).texture; p.dispose(); return e; }, [gl]);
  const braco = useMemo(() => criaVoce(masc.scene, clipes, 1), [masc, clipes]);
  const corpo = useMemo(() => criaVoce(masc.scene, clipes, 0), [masc, clipes]);
  const rel = useMemo(() => criaRelogio(env), [env]);
  // luzes sempre montadas (intensidade 0 quando fora de uso): o numero de luzes nao muda e nada recompila
  const luzes = useMemo(() => {
    const chave = new THREE.PointLight('#fff4e6', 0, 1.6, 2), recorte = new THREE.PointLight('#cfe0ff', 0, 1.6, 2), pes = new THREE.PointLight('#ffe9d6', 0, 4, 2);
    return {chave, recorte, pes};
  }, []);

  const cam = poseCamera(t);
  const camQ = cam.quat, camP = cam.pos;
  const aMundo = (p: THREE.Vector3) => p.clone().applyQuaternion(camQ).add(camP);
  const dMundo = (d: THREE.Vector3) => d.clone().applyQuaternion(camQ);

  // ---------- braco com relogio
  const pr = pesoRelogio(t);
  const mostraBraco = !!pr && pr.e > 0.001;
  braco.raiz.visible = mostraBraco; rel.grupo.visible = mostraBraco;
  luzes.chave.intensity = 0; luzes.recorte.intensity = 0; luzes.pes.intensity = 0;
  if (pr && mostraBraco) {
    const {r, e} = pr;
    const k = r.var;
    // pose base no espaco da camera (x direita, y cima, -z frente): punho no centro-baixo, antebraco subindo da esquerda
    const W = v3(-0.05 + 0.006 * Math.sin(k * 2.1), -0.10 + 0.006 * Math.cos(k * 1.7), -0.40);
    let dir = v3(0.58, 0.32 + 0.03 * Math.sin(k), -0.76).normalize();
    // balanco leve (respiracao / mao segurando no ar)
    W.x += 0.0035 * Math.sin(t * 1.3 + k) + 0.002 * Math.sin(t * 2.9);
    W.y += 0.0030 * Math.sin(t * 1.7 + 1 + k) + 0.0015 * Math.sin(t * 3.3);
    dir.applyAxisAngle(v3(0, 0, 1), 0.015 * Math.sin(t * 1.1 + k));
    // entrada/saida: sobe de baixo-esquerda girando
    const fora = 1 - e;
    W.add(v3(-0.10, -0.30, 0.05).multiplyScalar(fora));
    dir = dir.add(v3(0, -0.5 * fora, 0.1 * fora)).normalize();
    const LANTE = 0.2436, LBRACO = 0.2511;
    const E = W.clone().addScaledVector(dir, -LANTE);
    const u = v3(0.32, 0.30, -0.90).normalize();
    const S = E.clone().addScaledVector(u, -LBRACO);
    // dorso da mao/antebraco virado para a camera (o mostrador olha para voce), um pouco para cima
    const paraCam = W.clone().multiplyScalar(-1).normalize().add(v3(0, 0.25, 0)).normalize();
    const dorso = paraCam.clone().addScaledVector(dir, -paraCam.dot(dir)).normalize();
    // pose do clipe parado e depois os ossos do braco
    poseClipe(braco, clipes, 'Idle_Loop', 0.5);
    const R = braco.raiz;
    R.scale.setScalar(1); R.quaternion.copy(camQ).multiply(new THREE.Quaternion().setFromAxisAngle(v3(0, 1, 0), Math.PI));
    R.position.set(0, 0, 0); R.updateMatrixWorld(true);
    const U = braco.ossos.upperarm_l.getWorldPosition(new THREE.Vector3());
    R.position.copy(aMundo(S)).sub(U); R.updateMatrixWorld(true);
    orientaOsso(braco.ossos.upperarm_l, braco.bindQ.upperarm_l, dMundo(u), dMundo(dorso));
    orientaOsso(braco.ossos.lowerarm_l, braco.bindQ.lowerarm_l, dMundo(dir), dMundo(dorso));
    const dirMao = dir.clone().addScaledVector(dorso, 0.22).normalize();   // punho levemente dobrado para tras
    orientaOsso(braco.ossos.hand_l, braco.bindQ.hand_l, dMundo(dirMao), dMundo(dorso));
    for (const n in braco.punho) if (n.endsWith('_l')) braco.ossos[n].quaternion.copy(braco.punho[n]);
    R.updateMatrixWorld(true);
    // relogio: no dorso do punho, 3,5 cm antes da articulacao; eixo x local = ao longo do antebraco (coroa para a mao)
    const RAIO_PUNHO = 0.026;
    const eixo = W.clone().addScaledVector(dir, -0.04);
    const C = eixo.clone().addScaledVector(dorso, RAIO_PUNHO + 0.004);
    const zx = dir.clone(), zz = dorso.clone(), zy = new THREE.Vector3().crossVectors(zz, zx);
    const qRel = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(zx, zy, zz));
    rel.grupo.position.copy(aMundo(C)); rel.grupo.quaternion.copy(camQ).multiply(qRel);
    // pulseira: cilindro ao longo do antebraco (eixo y do cilindro -> x local), centrado no eixo do punho
    rel.pulseira.position.set(0, 0, -(RAIO_PUNHO + 0.004)); rel.pulseira.rotation.set(0, 0, Math.PI / 2);
    rel.pulseira.scale.set(RAIO_PUNHO + 0.0025, 0.018, (RAIO_PUNHO + 0.0025) * 0.82);
    // ponteiros (tempo normal: o seu tempo nao acelera). Segundos em tique de quartzo.
    const s = HORA0 + (t - 6.5);
    const sInt = Math.floor(s), tique = sInt + smooth(0, 0.07, s - sInt);
    rel.segundo.rotation.z = -((tique % 60) / 60) * Math.PI * 2;
    rel.minuto.rotation.z = -(((s / 60) % 60) / 60) * Math.PI * 2;
    rel.hora.rotation.z = -(((s / 3600) % 12) / 12) * Math.PI * 2;
    rel.matLume.emissiveIntensity = 1.6 * r.lume; rel.matSeg.emissiveIntensity = 0.25 * r.lume;
    rel.matFace.emissiveIntensity = 0.03 * r.lume;
    // luz de preenchimento so perto do braco (alcance 1,6 m)
    luzes.chave.position.copy(aMundo(v3(0.22, 0.20, -0.12))); luzes.chave.intensity = 0.55 * r.luz * e;
    luzes.recorte.position.copy(aMundo(v3(-0.30, 0.10, -0.75))); luzes.recorte.intensity = 0.35 * r.luz * e;
  }

  // ---------- corpo (pernas e pes) quando a camera olha para baixo
  const mostraCorpo = cam.inclinacao < -45;
  corpo.raiz.visible = mostraCorpo;
  if (mostraCorpo) {
    const flutua = t > 300 && t < 345;
    // pose neutra simetrica a partir da T-pose (o Idle do pacote tem um pe a frente e cruzava as pernas na visao de cima)
    corpo.mixer.stopAllAction(); corpo.acoes = {};
    for (const n in corpo.repouso) corpo.ossos[n].quaternion.copy(corpo.repouso[n]);
    const g = (cam.guinada * Math.PI) / 180;
    const deriva = flutua ? 0.07 * Math.sin(t * 0.55) + 0.03 * (t - 326.8) : 0;
    // enquadramento do original: quadril na base do quadro, pes perto do centro. O corpo inclina ~8 graus para tras em torno
    // do olho (os olhos ficam a frente da barriga, a cabeca dobrada para baixo) e os quadris flexionam ~10 graus.
    const inclina = -0.14 + (flutua ? 0.035 * Math.sin(t * 0.7) : 0);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(inclina, g + Math.PI + deriva, flutua ? 0.03 * Math.sin(t * 0.45 + 1) : 0, 'YXZ'));
    corpo.raiz.quaternion.copy(q);
    const olho = v3(0, 1.62, 0.20).applyQuaternion(q);
    corpo.raiz.position.copy(camP).sub(olho);
    if (flutua) corpo.raiz.position.y += 0.02 * Math.sin(t * 0.9);
    corpo.raiz.updateMatrixWorld(true);
    // gira um osso no referencial do corpo (eixos do corpo: x lateral esquerdo, y cima, z frente)
    const o = corpo.ossos, qp = new THREE.Quaternion(), qw = new THREE.Quaternion();
    const gira = (n: string, eixo: THREE.Vector3, a: number) => {
      const b = o[n]; if (!b) return;
      b.getWorldQuaternion(qw); b.parent!.getWorldQuaternion(qp);
      const ew = eixo.clone().applyQuaternion(q);
      b.quaternion.copy(qp.invert().multiply(new THREE.Quaternion().setFromAxisAngle(ew, a).multiply(qw)));
      b.updateMatrixWorld(true);
    };
    const X = v3(1, 0, 0), Z = v3(0, 0, 1);
    // flutuando: pernas soltas (joelhos dobrados, pes afastados) e bracos abertos, com balanco lento
    const ab = flutua ? 0.13 + 0.03 * Math.sin(t * 0.8) : 0.10;
    gira('thigh_l', X, -0.13); gira('thigh_r', X, -0.13 + (flutua ? 0.08 * Math.sin(t * 0.6) : 0));
    gira('thigh_l', Z, ab); gira('thigh_r', Z, -ab);
    gira('calf_l', X, flutua ? 0.18 + 0.05 * Math.sin(t * 0.6) : 0.04); gira('calf_r', X, flutua ? 0.26 + 0.05 * Math.sin(t * 0.6 + 2) : 0.04);
    const resp = 0.015 * Math.sin(t * 1.4);
    gira('upperarm_l', Z, -1.33 + (flutua ? 0.38 : 0.12) + resp); gira('upperarm_r', Z, 1.33 - (flutua ? 0.38 : 0.12) - resp);
    gira('lowerarm_l', X, -0.28); gira('lowerarm_r', X, -0.28);
    // maos relaxadas: meio caminho entre a mao aberta e o punho
    for (const n in corpo.punho) { corpo.ossos[n].quaternion.slerp(corpo.punho[n], 0.5); }
    corpo.raiz.updateMatrixWorld(true);
    gira('upperarm_l', X, -0.06); gira('upperarm_r', X, -0.06);
    corpo.raiz.updateMatrixWorld(true);
    luzes.pes.position.copy(aMundo(v3(0.0, 0.25, 0.1)));
    luzes.pes.intensity = flutua ? 1.4 : 0.5;
  }

  return (
    <>
      <primitive object={braco.raiz} />
      <primitive object={corpo.raiz} />
      <primitive object={rel.grupo} />
      <primitive object={luzes.chave} />
      <primitive object={luzes.recorte} />
      <primitive object={luzes.pes} />
    </>
  );
};
