// O palco na receita do Reconstructed, só three.js: o avião é um "produto bem renderizado" (reflexo de estúdio do
// RoomEnvironment, luz-chave suave de cima, AO nas junções, tonemap neutro, SMAA) e o fundo é um céu cinza encoberto
// com listras horizontais de nuvem correndo (o "motion blur" barato deles). Tudo numa paleta cinza só.
// 04/11: as nuvens volumétricas (@takram) foram testadas e reprovadas pelo Eduardo: realistas demais e fora da harmonia.
import * as THREE from 'three';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import hdrB64 from './assets/sky.hdr';
import stormB64 from './assets/storm.hdr';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {N8AOPass} from 'n8ao';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {SMAAPass} from 'three/addons/postprocessing/SMAAPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';

// céu por clima: alto, horizonte, baixo; força e escala das listras; neblina (só cidade)
export const CLIMA = {
  cruzeiro: {hdriFundo: 'storm', fundoInt: 0.3, envInt: 1.0, fogCeu: [0.006, '#8e959c'], giro: 0.012, grade: [0.35, 1.12, [0.96, 0.99, 1.04]], top: '#a1a7ad', hor: '#b9bec3', bot: '#959ba2', streak: 0.15, fog: 0},
  tormenta: {hdriFundo: 'storm', fundoInt: 0.32, envInt: 0.9, fogCeu: [0.005, '#4d545b'], giro: 0.05, blur: 0.3, grade: [0.25, 1.18, [0.94, 0.98, 1.05]], top: '#59616a', hor: '#7a838b', bot: '#454c53', streak: 0.22, fog: 0},
  cidade: {grade: [0.85, 1.08, [1.02, 1.0, 0.97]], top: '#a9afb5', hor: '#bcc1c6', bot: '#bcc1c6', streak: 0.0, fog: 0.00016},
};

const SKY_VERT = /* glsl */ `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`;
const SKY_FRAG = /* glsl */ `uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uBot; uniform float uStreak; uniform float uOff; varying vec3 vD;
  float h1(float n){ return fract(sin(n) * 43758.5453); }
  float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
  float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++){ s += a * n2(p); p = p * vec2(1.9, 2.3) + 3.1; a *= 0.5; } return s; }
  void main(){
    vec3 d = normalize(vD);
    float y = d.y;
    vec3 c = y > 0.0 ? mix(uHor, uTop, pow(clamp(y, 0.0, 1.0), 0.6)) : mix(uHor, uBot, pow(clamp(-y, 0.0, 1.0), 0.7));
    // listras: ruído esticado ao longo do eixo do voo (x), fino na vertical; corre com uOff
    // listras retas: quase nada de variação ao longo do voo (x), muita na vertical (y)
    // linhas de velocidade: constantes ao longo do eixo do voo (x) -> retas que fogem para o ponto de fuga do voo
    float ang = atan(d.y, d.z);
    vec2 q = vec2(d.x * 0.3 + uOff, ang * 18.0);
    float s = fbm(q) - 0.5 + 0.5 * (fbm(vec2(q.x * 0.6 + 7.0, ang * 46.0)) - 0.5);
    float band = 1.0 - smoothstep(0.15, 0.85, abs(y));
    float big = fbm(vec2(d.x * 0.08 + uOff * 0.3, ang * 2.2)) - 0.5;
    c *= 1.0 + uStreak * s * 2.0 * (0.4 + 0.6 * band) + uStreak * 2.2 * big;
    gl_FragColor = vec4(c, 1.0);
  }`;

export async function createStage({canvas}) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance'});
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 16 / 9, 0.5, 2e5);

  // PBR com HDRI real de céu encoberto (Poly Haven, kloofendal_overcast_puresky, CC0): reflexo coerente e degradês sutis
  const hdr = await new HDRLoader().loadAsync(`data:application/octet-stream;base64,${hdrB64}`);
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer);
  const envSky = pm.fromEquirectangular(hdr).texture;
  scene.environment = envSky;
  const storm = await new HDRLoader().loadAsync(`data:application/octet-stream;base64,${stormB64}`);
  storm.mapping = THREE.EquirectangularReflectionMapping;
  const envStorm = pm.fromEquirectangular(storm).texture;
  const FUNDOS = {storm: [storm, envStorm]};
  scene.environmentIntensity = 0.85;
  pm.dispose();

  const skyMat = new THREE.ShaderMaterial({
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    uniforms: {uTop: {value: new THREE.Color()}, uHor: {value: new THREE.Color()}, uBot: {value: new THREE.Color()}, uStreak: {value: 0}, uOff: {value: 0}},
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), skyMat);
  sky.frustumCulled = false;
  sky.renderOrder = -10;
  scene.add(sky);
  scene.fog = new THREE.FogExp2('#cfd3d6', 0);

  const KEY = new THREE.Vector3(0.25, 1.0, 0.35).normalize();
  const key = new THREE.DirectionalLight('#ffffff', 1.35);
  key.castShadow = true;
  Object.assign(key.shadow.camera, {left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 120});
  key.shadow.mapSize.set(4096, 4096);
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.06;
  scene.add(key, key.target);
  // luz de contorno (rim) atrás do avião, oposta à câmera: desenha a linha de brilho nas bordas, como no Reconstructed
  const rim = new THREE.DirectionalLight('#eef3ff', 0);
  scene.add(rim, rim.target);
  const hemi = new THREE.HemisphereLight('#f4f6f8', '#4f565d', 0.3);
  scene.add(hemi);

  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, {type: THREE.HalfFloatType, samples: 8}));
  // N8AO (ISC, ativo): AO de contato nas junções asa-fuselagem e motor-cauda; também desenha a cena (substitui o RenderPass)
  const n8 = new N8AOPass(scene, camera, 4, 4);
  Object.assign(n8.configuration, {aoRadius: 1.4, distanceFalloff: 0.5, intensity: 2.4, aoSamples: 16, denoiseSamples: 8, denoiseRadius: 12, halfRes: false, gammaCorrection: false});
  composer.addPass(n8);
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(4, 4), 0.35, 0.3, 8.0));
  composer.addPass(new OutputPass());
  // correção de cor por clima (dessatura, contraste, tom): une avião, céu e cidade numa família só, como o Reconstructed
  const grade = new ShaderPass({uniforms: {tDiffuse: {value: null}, uSat: {value: 1}, uCon: {value: 1}, uTint: {value: new THREE.Vector3(1, 1, 1)}},
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform sampler2D tDiffuse; uniform float uSat; uniform float uCon; uniform vec3 uTint; varying vec2 vUv;\n      void main(){ vec4 c = texture2D(tDiffuse, vUv); float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));\n        vec3 g = mix(vec3(l), c.rgb, uSat); g = (g - 0.5) * uCon + 0.5; gl_FragColor = vec4(clamp(g * uTint, 0.0, 1.0), c.a); }'});
  composer.addPass(grade);
  const smaa = new SMAAPass();
  composer.addPass(smaa);

  const size = {w: 1600, h: 900};
  const resize = (w, h, pr) => {
    size.w = w;
    size.h = h;
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(pr);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  // cam: {pos, tgt, fov, near, far}; climaK: chave de CLIMA; foco: centro da sombra (o avião); run: metros voados (listras)
  const frame = (cam, climaK, foco = [0, 0, 0], {run = 0, ao = true, t = 0} = {}) => {
    const C = CLIMA[climaK];
    skyMat.uniforms.uTop.value.set(C.top);
    skyMat.uniforms.uHor.value.set(C.hor);
    skyMat.uniforms.uBot.value.set(C.bot);
    skyMat.uniforms.uStreak.value = C.streak;
    const F = C.hdriFundo ? FUNDOS[C.hdriFundo] : null;
    sky.visible = !F;
    scene.background = F ? F[0] : null;
    scene.environment = F ? F[1] : envSky;
    scene.backgroundBlurriness = C.blur ?? 0.12;
    scene.backgroundRotation.set(C.giro ? t * C.giro * 0.6 : 0, C.giro ? t * C.giro : 0, 0);
    scene.environmentRotation.copy(scene.backgroundRotation);
    scene.backgroundIntensity = C.fundoInt ?? 0.85;
    scene.environmentIntensity = C.envInt ?? 0.6;
    const [gs, gc, gt] = C.grade || [1, 1, [1, 1, 1]];
    grade.uniforms.uSat.value = gs;
    grade.uniforms.uCon.value = gc;
    grade.uniforms.uTint.value.set(...gt);
    skyMat.uniforms.uOff.value = run * 0.004;
    scene.fog.color.set(C.fogCeu ? C.fogCeu[1] : C.hor);
    scene.fog.density = C.fogCeu ? C.fogCeu[0] : C.fog;
    n8.configuration.intensity = ao ? 2.4 : 0.0;
    n8.setSize(size.w * renderer.getPixelRatio(), size.h * renderer.getPixelRatio());
    camera.position.set(...cam.pos);
    camera.near = cam.near ?? 0.5;
    camera.far = cam.far ?? 2e5;
    camera.fov = cam.fov ?? 36;
    camera.updateProjectionMatrix();
    camera.lookAt(...cam.tgt);
    camera.updateMatrixWorld();
    sky.position.copy(camera.position);
    sky.scale.setScalar(camera.far * 0.9);
    key.target.position.set(...foco);
    key.position.copy(key.target.position).addScaledVector(KEY, 60);
    key.target.updateMatrixWorld();
    const fwd = new THREE.Vector3(...foco).sub(camera.position).normalize();
    rim.intensity = C.hdriFundo ? 0.5 : 0;
    rim.target.position.set(...foco);
    rim.position.set(...foco).addScaledVector(fwd, 60).add(new THREE.Vector3(0, 25, 0));
    rim.target.updateMatrixWorld();
    composer.render();
  };
  const pv = new THREE.Vector3();
  const project = (p) => {
    pv.copy(p).project(camera);
    if (pv.z > 1) return null;
    return [(pv.x * 0.5 + 0.5) * size.w, (-pv.y * 0.5 + 0.5) * size.h];
  };
  return {renderer, scene, camera, resize, frame, project, size};
}
