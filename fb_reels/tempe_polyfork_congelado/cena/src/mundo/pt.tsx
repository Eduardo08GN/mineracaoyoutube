// Luz global por path tracing (three-gpu-pathtracer 0.0.24, MIT) para os STILLS: acumula N amostras por quadro dentro de delayRender/continueRender.
// Da luz rebatida real, sombra macia e profundidade de campo fisica (PhysicalCamera). Depois, pos leve sobre o resultado linear (bloom, AgX, cor seletiva, grao).
// Plano B (gi = "barato" em modo.json): Look raster + AccumulativeShadows/ContactShadows + n8ao (ver Cena.tsx).
import React, {useEffect, useRef} from 'react';
import * as THREE from 'three';
import {useFrame, useThree} from '@react-three/fiber';
import {continueRender, delayRender} from 'remotion';
import {BloomEffect, BrightnessContrastEffect, Effect, EffectComposer, EffectPass, HueSaturationEffect, NoiseEffect, BlendFunction, ShaderPass, ToneMappingEffect, ToneMappingMode, VignetteEffect} from 'postprocessing';
import {PhysicalCamera, WebGLPathTracer} from 'three-gpu-pathtracer';
import {FS, skyUniforms} from './ceu';
import {Estagio} from './estagios';
import {SeletivaEffect} from './look';
import modo from '../modo.json';

class ExpoEffect extends Effect {
  constructor(ev: number) {
    super('ExpoEffect', `uniform float uK; void mainImage(const in vec4 c, const in vec2 uv, out vec4 o) { o = vec4(c.rgb * uK, c.a); }`, {uniforms: new Map<string, THREE.Uniform>([['uK', new THREE.Uniform(Math.pow(2, ev))]])});
  }
}

// ceu (o mesmo shader do domo) renderizado em equirect HDR 4096x2048 -> DataTexture half float (o path tracer le o CDF no CPU para amostrar sol/lua/brilho da cidade)
const ceuEquirect = (gl: THREE.WebGLRenderer, E: Estagio, W = 4096, H = 2048): THREE.DataTexture => {
  const mat = new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false, uniforms: skyUniforms(E),
    vertexShader: 'varying vec3 vD; varying vec2 vUv2; void main() { vUv2 = uv; float th = (uv.x - 0.5) * 6.28318530718; float ph = (1.0 - uv.y) * 3.14159265359; vD = vec3(sin(ph) * cos(th), cos(ph), sin(ph) * sin(th)); gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: FS,
  });
  const rt = new THREE.WebGLRenderTarget(W, H, {type: THREE.FloatType, format: THREE.RGBAFormat, depthBuffer: false});
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), sc = new THREE.Scene(); sc.add(quad);
  const og = gl.getRenderTarget(); gl.setRenderTarget(rt); gl.render(sc, cam); gl.setRenderTarget(og);
  const f = new Float32Array(W * H * 4); gl.readRenderTargetPixels(rt, 0, 0, W, H, f);
  const h = new Uint16Array(W * H * 4); for (let i = 0; i < h.length; i++) h[i] = THREE.DataUtils.toHalfFloat(Math.min(f[i], 60000));
  rt.dispose(); mat.dispose();
  const t = new THREE.DataTexture(h, W, H, THREE.RGBAFormat, THREE.HalfFloatType);
  t.mapping = THREE.EquirectangularReflectionMapping; t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
};

// fStop da PhysicalCamera por estagio (abertura em mm = distancia focal / fStop; ver 'bokehSize' do path tracer). Calibrar na G4 olhando o still.
const FSTOP: Record<string, number> = {A: 2.4, B: 2.0, C: 3.2};
const EXPO: Record<string, number> = {A: 1.3, B: 1.0, C: 0.3};   // ajuste fino de exposicao (EV) por estagio

export type PerfilPT = {bloom: number; limiar: number; sat: number; contraste: number; brilho: number; vinheta: number; seletiva?: number; ev?: number; grao?: number};

export const PathLook: React.FC<{E: Estagio; perfil: PerfilPT}> = ({E, perfil}) => {
  const {gl, scene, camera, size} = useThree();
  const feito = useRef(false);
  const handle = useRef<number | null>(null);
  if (handle.current === null) handle.current = delayRender('pathtracer ' + E.id, {timeoutInMilliseconds: 1_800_000});
  useFrame(() => {}, 1);   // prioridade 1: o R3F nao redesenha (apagaria o resultado)
  useEffect(() => {
    if (feito.current) return; feito.current = true;
    const dbg = (m: string) => console.log('PT ' + m);
    const t0 = performance.now();
    (async () => {
      try {
        await new Promise((r) => setTimeout(r, 400));   // deixa o React/R3F montar tudo
        const spp = Number((globalThis as any).__spp ?? modo.spp);
        // 1. ceu -> equirect; esconde o domo, a chuva e as luzes que o path tracer nao entende; MeshBasic vira emissivo
        const env = ceuEquirect(gl, E);
        const chuva: THREE.Object3D[] = [];
        scene.traverse((o: any) => {
          if (o.name === 'ceu') o.visible = false;
          if (o.name === 'chuva') { chuva.push(o); o.visible = false; }
          if (o.isMesh && o.material && o.material.isMeshBasicMaterial && o.name !== 'chuva') {
            const b = o.material; o.material = new THREE.MeshStandardMaterial({color: 0x000000, emissive: b.color.clone(), emissiveIntensity: 1, roughness: 1});
          }
          if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
        });
        scene.background = env; scene.environment = env;
        (scene as any).backgroundIntensity = 1; (scene as any).environmentIntensity = (modo as any).env ?? 1;
        // 2. camera fisica identica a do quadro
        const c = camera as THREE.PerspectiveCamera;
        const cam = new PhysicalCamera(E.cam.fov, size.width / size.height, 0.15, 20000);
        cam.position.set(...E.cam.pos); cam.lookAt(...E.cam.alvo); cam.fStop = FSTOP[E.id]; cam.focusDistance = E.look.dof.foco; cam.apertureBlades = 6; cam.updateMatrixWorld();
        // 3. path tracer
        const pt = new WebGLPathTracer(gl);
        pt.renderToCanvas = false; pt.rasterizeScene = false; pt.renderDelay = 0; pt.fadeDuration = 0; pt.minSamples = 0; pt.dynamicLowRes = false;
        pt.bounces = (modo as any).bounces ?? 5; pt.transmissiveBounces = 2; pt.filterGlossyFactor = 0.5; pt.multipleImportanceSampling = true;
        pt.tiles.set((modo as any).tiles ?? 2, (modo as any).tiles ?? 2);
        dbg('setScene...'); pt.setScene(scene, cam); dbg('bvh ' + ((performance.now() - t0) / 1000).toFixed(1) + ' s');
        // 4. amostras (cede ao navegador a cada poucas para nao estourar o watchdog da GPU)
        const t1 = performance.now(); let n = 0;
        while (pt.samples < spp) {
          pt.renderSample();
          if (++n % 8 === 0) { gl.getContext().finish(); await new Promise((r) => setTimeout(r, 0)); }
          if ((pt as any).isCompiling) await new Promise((r) => setTimeout(r, 50));
          if (performance.now() - t1 > 1_500_000) { dbg('TEMPO_ESGOTADO em ' + pt.samples.toFixed(1) + ' spp'); break; }
        }
        gl.getContext().finish();
        const seg = (performance.now() - t1) / 1000;
        dbg(`spp=${pt.samples.toFixed(1)} amostragem=${seg.toFixed(1)} s (${(seg / Math.max(1, pt.samples)).toFixed(3)} s/spp) total=${((performance.now() - t0) / 1000).toFixed(1)} s`);
        // 5. pos sobre o resultado linear HDR
        const comp = new EffectComposer(gl, {frameBufferType: THREE.HalfFloatType, multisampling: 0});
        const copia = new THREE.ShaderMaterial({uniforms: {tex: {value: pt.target.texture}, inputBuffer: {value: null}},
          vertexShader: 'varying vec2 vUv; void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 1.0, 1.0); }',
          fragmentShader: 'uniform sampler2D tex; varying vec2 vUv; void main() { vec4 c = texture2D(tex, vUv); bool ok = c.r == c.r && c.g == c.g && c.b == c.b; gl_FragColor = ok ? vec4(clamp(c.rgb, 0.0, 64.0), 1.0) : vec4(0.0, 0.0, 0.0, 1.0); }', depthTest: false, depthWrite: false});
        comp.addPass(new ShaderPass(copia, 'inputBuffer'));
        const ef: Effect[] = [
          new ExpoEffect((perfil.ev ?? 0) + EXPO[E.id]),
          new BloomEffect({mipmapBlur: true, luminanceThreshold: perfil.limiar, luminanceSmoothing: 0.2, intensity: perfil.bloom, radius: 0.72}),
          new ToneMappingEffect({mode: ToneMappingMode.AGX}),
        ];
        if (perfil.seletiva) ef.push(new SeletivaEffect(perfil.seletiva));
        ef.push(new HueSaturationEffect({saturation: perfil.sat}), new BrightnessContrastEffect({brightness: perfil.brilho, contrast: perfil.contraste}), new VignetteEffect({offset: 0.32, darkness: perfil.vinheta}));
        if (perfil.grao) { const g = new NoiseEffect({blendFunction: BlendFunction.OVERLAY}); g.blendMode.opacity.value = perfil.grao; ef.push(g); }
        comp.addPass(new EffectPass(c, ...ef));
        comp.setSize(size.width, size.height);
        comp.render(0);
        // 6. chuva por cima (raster, so as linhas)
        if (chuva.length) {
          const rs = new THREE.Scene(); chuva.forEach((o) => { o.visible = true; rs.add(o); });
          const ac = gl.autoClear; gl.autoClear = false; gl.render(rs, c); gl.autoClear = ac;
        }
        dbg('pronto');
      } catch (e) { console.error('PT_ERRO ' + String(e) + ' ' + ((e as any)?.stack ?? '')); }
      finally { continueRender(handle.current!); }
    })();
  }, []);
  return null;
};
