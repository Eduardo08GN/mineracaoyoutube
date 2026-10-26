// LookAcab: copia do Look padrao (src/look/Look.tsx) + GRAO de pelicula, limiar de bloom so em emissivos e AO configuravel.
// O Look original fica intocado; este e o compositor do Acabamento. Look cinematografico padrao do canal (pos-processamento deterministico: nada temporal, nada acumulado entre quadros).
// Ordem: AO (so em cenas com geometria) -> nevoa atmosferica (perspectiva aerea, pela profundidade) -> raios de sol (god rays)
// -> bloom (so o que passa de 1.0) -> tone mapping AgX -> LUT do original -> saturacao/contraste -> vinheta.
// Compositor proprio, montado de forma sincrona: o EffectComposer do @react-three/postprocessing so fica pronto alguns ciclos
// depois de montar, e no render quadro a quadro o primeiro quadro de cada aba (e todo still) saia preto.
import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {useFrame, useThree} from '@react-three/fiber';
import {BlendFunction, BloomEffect, BrightnessContrastEffect, Effect, EffectAttribute, EffectComposer, EffectPass, GodRaysEffect, HueSaturationEffect, KernelSize,
  LUT3DEffect, RenderPass, ShaderPass, ToneMappingEffect, ToneMappingMode, VignetteEffect} from 'postprocessing';
import {N8AOPostPass} from 'n8ao';
import {useCurrentFrame} from 'remotion';
import type {Perfil} from '../../look/Look';

export type PerfilAcab = Perfil & {
  grao?: number;         // forca do grao de pelicula (0 desliga; ~0,03-0,06)
  aoRaio?: number;       // raio do N8AO em metros (padrao 3)
  aoForca?: number;      // intensidade do N8AO (padrao 1,6)
};

// nevoa de perspectiva aerea: mistura a cor do horizonte pela distancia (lida da profundidade); o ceu (profundidade 1) fica intacto
class NevoaEffect extends Effect {
  constructor(cor: THREE.Color, densidade: number, max: number) {
    super('NevoaEffect', `uniform vec3 uCor; uniform float uDens; uniform float uMax;
void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  if (depth >= 0.99999) { outputColor = inputColor; return; }
  float d = (cameraNear * cameraFar) / (cameraFar - depth * (cameraFar - cameraNear));
  float f = (1.0 - exp(-uDens * d)) * uMax;
  outputColor = vec4(mix(inputColor.rgb, uCor, f), inputColor.a);
}`, {attributes: EffectAttribute.DEPTH, uniforms: new Map<string, THREE.Uniform>([['uCor', new THREE.Uniform(cor)], ['uDens', new THREE.Uniform(densidade)], ['uMax', new THREE.Uniform(max)]])});
  }
}


// grao de pelicula: ruido por pixel que muda a cada quadro (funcao do numero do quadro: deterministico), mais forte nos meios-tons
class GraoEffect extends Effect {
  constructor(forca: number, largura: number, altura: number) {
    super('GraoEffect', `uniform float uForca; uniform float uQuadro; uniform vec2 uRes;
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 p = floor(uv * uRes / 1.35);
  float n = h21(p + uQuadro * 17.0) + h21(p * 1.7 + uQuadro * 31.0 + 5.0) - 1.0;
  float l = dot(inputColor.rgb, vec3(0.299, 0.587, 0.114));
  float meio = 1.0 - pow(abs(l * 2.0 - 1.0), 2.0) * 0.7;
  outputColor = vec4(inputColor.rgb + n * uForca * meio, inputColor.a);
}`, {uniforms: new Map<string, THREE.Uniform>([['uForca', new THREE.Uniform(forca)], ['uQuadro', new THREE.Uniform(0)], ['uRes', new THREE.Uniform(new THREE.Vector2(largura, altura))]])});
  }
}

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

export const LookAcab: React.FC<{perfil: PerfilAcab; sol?: THREE.Vector3}> = ({perfil: perfilBruto, sol}) => {
  let perfil = perfilBruto;
  const quadro = useCurrentFrame();
  const {gl, scene, camera, size} = useThree();
  // perfil arredondado a 2 algarismos: transicoes suaves mudavam o perfil a cada quadro e recriavam a cadeia (recompila shaders)
  // THREE.Color tem toJSON() (vira numero hex ANTES do replacer): le o valor original no objeto pai, senao o arredondamento
  // estragava a cor (a nevoa malva virava vermelha). So numeros de verdade sao arredondados.
  const chave = JSON.stringify(perfilBruto, function (this: any, k: string, v: any) {
    const orig = k === '' ? v : this[k];
    if (orig instanceof THREE.Color) return '#' + orig.getHexString();
    return typeof v === 'number' && v !== 0 ? Number(v.toPrecision(2)) : v;
  });
  perfil = useMemo(() => JSON.parse(chave) as PerfilAcab, [chave]);
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
      ao.configuration.aoRadius = perfil.aoRaio ?? 3; ao.configuration.distanceFalloff = 1.2; ao.configuration.intensity = perfil.aoForca ?? 1.6; ao.configuration.halfRes = true;
      ao.setQualityMode('Medium');
      c.addPass(ao);
    }
    if (!soft) c.addPass(saneia());
    if (perfil.nevoa && !dbg.includes('semNevoa'))
      c.addPass(new EffectPass(camera, new NevoaEffect(new THREE.Color(perfil.nevoa.cor), perfil.nevoa.densidade, perfil.nevoa.max ?? 0.75)));
    // raios de sol: disco do sol posicionado a cada quadro na direcao da luz (fica longe, so a mascara dos raios o enxerga)
    if (perfil.raios && !dbg.includes('semRaios')) {
      const disco = new THREE.Mesh(new THREE.SphereGeometry(40, 24, 16), new THREE.MeshBasicMaterial({color: new THREE.Color(1, 0.92, 0.75), transparent: true, depthWrite: false, fog: false}));
      disco.frustumCulled = false; scene.add(disco); (c as any).__disco = disco;
      c.addPass(new EffectPass(camera, new GodRaysEffect(camera, disco, {blendFunction: BlendFunction.SCREEN, samples: 60, density: 0.96, decay: 0.92,
        weight: perfil.raios, exposure: 0.55, clampMax: 1, kernelSize: KernelSize.SMALL, blur: true, resolutionScale: 0.5})));
    }
    const efeitos: any[] = dbg.includes('semBloom') ? [new ToneMappingEffect({mode: ToneMappingMode.AGX})] : [
      new BloomEffect({mipmapBlur: true, luminanceThreshold: perfil.limiar ?? 0.9, luminanceSmoothing: 0.08, intensity: perfil.bloom ?? 0.55, radius: 0.72}),
      new ToneMappingEffect({mode: ToneMappingMode.AGX}),
    ];
    if (perfil.lut) {
      const lut = new LUT3DEffect(lutTextura(perfil.lut, perfil.lutN ?? 17));
      lut.blendMode.opacity.value = perfil.lutForca ?? 1;
      efeitos.push(lut);
    }
    efeitos.push(new HueSaturationEffect({saturation: perfil.saturacao ?? -0.1}));
    efeitos.push(new BrightnessContrastEffect({brightness: perfil.brilho ?? 0, contrast: perfil.contraste ?? 0.04}));
    if (perfil.grao) { const gr = new GraoEffect(perfil.grao, size.width, size.height); (c as any).__grao = gr; efeitos.push(gr); }
    efeitos.push(new VignetteEffect({offset: 0.32, darkness: perfil.vinheta ?? 0.45}));
    c.addPass(new EffectPass(camera, ...efeitos));
    c.setSize(size.width, size.height);
    return c;
  // chave pelo CONTEUDO do perfil: um objeto novo a cada quadro reconstruia a cadeia inteira (lento e piscava)
  }, [gl, scene, camera, chave]);
  // prioridade 1: o R3F deixa de desenhar sozinho e o compositor desenha a cena com os efeitos
  // o disco do sol e de cada compositor: sai da cena quando o perfil muda (senao sobrava uma esfera branca no ceu)
  useEffect(() => () => { const d = (composer as any).__disco; if (d) { scene.remove(d); d.geometry.dispose(); d.material.dispose(); } composer.dispose(); }, [composer, scene]);
  useFrame(() => {
    const disco = (composer as any).__disco as THREE.Mesh | undefined;
    if (disco) { const d = (sol ?? new THREE.Vector3(0.5, 0.6, -0.6)).clone().normalize(); disco.position.copy(camera.position).addScaledVector(d, 2500); disco.visible = !!sol && d.y > -0.05; }
    const gr = (composer as any).__grao as GraoEffect | undefined;
    if (gr) gr.uniforms.get('uQuadro')!.value = quadro % 997;
    composer.render(0);
  }, (globalThis as any).__semLook ? 0 : 1);
  return null;
};
