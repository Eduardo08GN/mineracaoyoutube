// Look cinematografico padrao do canal (pos-processamento deterministico: nada temporal, nada acumulado entre quadros).
// Ordem: AO (so em cenas com geometria) -> bloom (so o que passa de 1.0) -> tone mapping AgX -> LUT do original -> saturacao/contraste -> vinheta.
// Compositor proprio, montado de forma sincrona: o EffectComposer do @react-three/postprocessing so fica pronto alguns ciclos
// depois de montar, e no render quadro a quadro o primeiro quadro de cada aba (e todo still) saia preto.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useFrame, useThree} from '@react-three/fiber';
import {BloomEffect, BrightnessContrastEffect, EffectComposer, EffectPass, HueSaturationEffect, LUT3DEffect, RenderPass,
  ShaderPass, ToneMappingEffect, ToneMappingMode, VignetteEffect} from 'postprocessing';
import {N8AOPostPass} from 'n8ao';

export type Perfil = {
  ao?: boolean;          // oclusao de ambiente (costa, cidade)
  bloom?: number;        // intensidade do bloom
  limiar?: number;       // luminancia minima para brilhar
  saturacao?: number;    // -1..1
  contraste?: number;    // -1..1
  brilho?: number;       // -1..1
  vinheta?: number;      // escuridao da vinheta
  lut?: number[] | null; // LUT 3D (N^3 * 3, valores 0..1) tirada do original
  lutN?: number;  // lado da LUT (17)
  lutForca?: number;     // 0..1
};

// Saneia o buffer HDR antes do bloom: um pixel NaN/Inf da cena (meia precisao estoura acima de 65504) virava um quadro
// inteiro preto na G4, porque o desfoque em mipmap do bloom espalha o NaN pela tela. No PC (8 bits) o buffer ja vinha preso.
const saneia = () => new ShaderPass(new THREE.ShaderMaterial({
  uniforms: {inputBuffer: {value: null}},
  vertexShader: 'varying vec2 vUv; void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 1.0, 1.0); }',
  fragmentShader: `uniform sampler2D inputBuffer; varying vec2 vUv;
    void main() {
      vec4 c = texture2D(inputBuffer, vUv);
      bool ok = c.r == c.r && c.g == c.g && c.b == c.b && c.a == c.a;
      gl_FragColor = ok ? clamp(c, 0.0, 32.0) : vec4(0.0, 0.0, 0.0, 1.0);
    }`,
  depthTest: false, depthWrite: false,
}), 'inputBuffer');

const lutTextura = (dados: number[], n: number) => {
  const arr = new Uint8Array(n * n * n * 4);
  for (let i = 0; i < n * n * n; i++) {
    arr[i * 4] = Math.round(dados[i * 3] * 255); arr[i * 4 + 1] = Math.round(dados[i * 3 + 1] * 255); arr[i * 4 + 2] = Math.round(dados[i * 3 + 2] * 255); arr[i * 4 + 3] = 255;
  }
  const t = new THREE.Data3DTexture(arr, n, n, n);
  t.format = THREE.RGBAFormat; t.type = THREE.UnsignedByteType; t.minFilter = t.magFilter = THREE.LinearFilter;
  t.wrapS = t.wrapT = t.wrapR = THREE.ClampToEdgeWrapping; t.unpackAlignment = 1; t.needsUpdate = true;
  return t;
};

export const Look: React.FC<{perfil: Perfil}> = ({perfil}) => {
  const {gl, scene, camera, size} = useThree();
  const composer = useMemo(() => {
    // se o Chrome caiu para WebGL por software (SwiftShader), buffers de meia precisao saem pretos: usa 8 bits e sem AO
    const ctx = gl.getContext(), ext = ctx.getExtension('WEBGL_debug_renderer_info');
    const rend = ext ? String(ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    const dbg = String((globalThis as any).__dbg ?? '');
    const soft = /swiftshader|llvmpipe|software/i.test(rend) || dbg.includes('fb8');
    if (soft) console.warn('LOOK_SOFTWARE ' + rend);
    const c = new EffectComposer(gl, {frameBufferType: soft ? THREE.UnsignedByteType : THREE.HalfFloatType, multisampling: soft ? 0 : 4});
    c.addPass(new RenderPass(scene, camera));
    if (perfil.ao && !soft && !dbg.includes('semAO')) {
      const ao = new N8AOPostPass(scene, camera, size.width, size.height);
      ao.configuration.aoRadius = 3; ao.configuration.distanceFalloff = 1.2; ao.configuration.intensity = 1.6; ao.configuration.halfRes = true;
      ao.setQualityMode('Medium');
      c.addPass(ao);
    }
    if (!soft) c.addPass(saneia());
    const efeitos: any[] = dbg.includes('semBloom') ? [new ToneMappingEffect({mode: ToneMappingMode.AGX})] : [
      new BloomEffect({mipmapBlur: true, luminanceThreshold: perfil.limiar ?? 0.9, luminanceSmoothing: 0.2, intensity: perfil.bloom ?? 0.55, radius: 0.72}),
      new ToneMappingEffect({mode: ToneMappingMode.AGX}),
    ];
    if (perfil.lut) {
      const lut = new LUT3DEffect(lutTextura(perfil.lut, perfil.lutN ?? 17));
      lut.blendMode.opacity.value = perfil.lutForca ?? 1;
      efeitos.push(lut);
    }
    efeitos.push(new HueSaturationEffect({saturation: perfil.saturacao ?? -0.1}));
    efeitos.push(new BrightnessContrastEffect({brightness: perfil.brilho ?? 0, contrast: perfil.contraste ?? 0.04}));
    efeitos.push(new VignetteEffect({offset: 0.32, darkness: perfil.vinheta ?? 0.45}));
    c.addPass(new EffectPass(camera, ...efeitos));
    c.setSize(size.width, size.height);
    return c;
  }, [gl, scene, camera, perfil]);
  // prioridade 1: o R3F deixa de desenhar sozinho e o compositor desenha a cena com os efeitos
  useFrame(() => { composer.render(0); }, (globalThis as any).__semLook ? 0 : 1);
  return null;
};
