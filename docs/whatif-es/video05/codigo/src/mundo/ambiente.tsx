// Ambiente fotografico (stack de qualidade de 21/10/2026): ceu HDRI da Poly Haven (CC0) como fundo, luz e reflexo,
// areia PBR fotografica e o mar refletindo o ceu de verdade. Tudo deterministico (nada depende de relogio).
// Convencao de direcao = a do three (equirectUv): u = atan(z, x)/2pi + 0.5, v = asin(y)/pi + 0.5.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useLoader, useThree} from '@react-three/fiber';
import {useTexture} from '@react-three/drei';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js';
import {staticFile} from 'remotion';

// HDRIs disponiveis (arquivos em public/hdri; o sol de cada um medido no pico de luminancia do .hdr)
export const HDRIS = {
  praia: {hdr: 'hdri/kloofendal_48d_partly_cloudy_puresky_2k.hdr', fundo: 'hdri/kloofendal_48d_partly_cloudy_puresky_8k_tonemapped.jpg', elev: 0.836, azim: 0.973},
} as const;
export type NomeHDRI = keyof typeof HDRIS;

// sol do HDRI no formato do luzDe (elevacao, azimute em rad) para as sombras baterem com o ceu fotografado
export const solDoHDRI = (nome: NomeHDRI) => ({elev: HDRIS[nome].elev, azim: HDRIS[nome].azim});

const FUNDO_VS = `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; gl_Position.z = gl_Position.w; }`;
const FUNDO_FS = `
uniform sampler2D uMapa; uniform float uRot; uniform float uExp; uniform float uNevoa; uniform vec3 uCorNevoa; varying vec3 vW;
void main(){
  vec3 d = normalize(vW - cameraPosition);
  vec2 uv = vec2(atan(d.z, d.x) * 0.15915494 + 0.5 + uRot, asin(clamp(d.y, -1.0, 1.0)) * 0.31830989 + 0.5);
  vec3 c = pow(texture2D(uMapa, uv).rgb, vec3(2.2)) * uExp;   // JPG ja em tom de tela -> linear
  // perto do horizonte o ceu some na nevoa (junta com o mar e o chao)
  c = mix(c, uCorNevoa, uNevoa * (1.0 - smoothstep(0.0, 0.12, d.y)));
  gl_FragColor = vec4(c, 1.0);
}`;

// fundo: esfera presa a camera, desenhada atras de tudo
export const CeuFoto: React.FC<{nome?: NomeHDRI; rot?: number; exposicao?: number; nevoa?: number; luzAmbiente?: number}> =
  ({nome = 'praia', rot = 0, exposicao = 1, nevoa = 0.35, luzAmbiente = 0.7}) => {
  const {camera, scene, gl} = useThree();
  const fundo = useTexture(staticFile(HDRIS[nome].fundo));
  const hdr = useLoader(RGBELoader, staticFile(HDRIS[nome].hdr));
  useMemo(() => { fundo.colorSpace = THREE.NoColorSpace; fundo.anisotropy = 8; fundo.generateMipmaps = true; fundo.needsUpdate = true; }, [fundo]);
  // luz de ambiente (IBL) a partir do .hdr: o PBR das areias, pessoas e predios passa a ser iluminado pelo ceu fotografado
  const env = useMemo(() => {
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    const pm = new THREE.PMREMGenerator(gl); const rt = pm.fromEquirectangular(hdr); pm.dispose();
    return rt.texture;
  }, [hdr, gl]);
  scene.environment = env; (scene as any).environmentIntensity = luzAmbiente;
  (scene as any).environmentRotation = new THREE.Euler(0, -rot * Math.PI * 2, 0);
  const mat = useMemo(() => new THREE.ShaderMaterial({vertexShader: FUNDO_VS, fragmentShader: FUNDO_FS, depthWrite: false, side: THREE.BackSide, toneMapped: false, fog: false,
    uniforms: {uMapa: {value: fundo}, uRot: {value: 0}, uExp: {value: 1}, uNevoa: {value: 0}, uCorNevoa: {value: new THREE.Color(0.78, 0.84, 0.9)}}}), [fundo]);
  mat.uniforms.uRot.value = rot; mat.uniforms.uExp.value = exposicao; mat.uniforms.uNevoa.value = nevoa;
  return <mesh material={mat} position={camera.position.toArray()} renderOrder={-1000} frustumCulled={false}><sphereGeometry args={[5000, 64, 32]} /></mesh>;
};

// o .hdr para o mar refletir (mesma textura, sem PMREM: o reflexo da agua precisa ser nitido)
export const useHDR = (nome: NomeHDRI = 'praia') => useLoader(RGBELoader, staticFile(HDRIS[nome].hdr));

// areia fotografica PBR (Poly Haven coast_sand_01, CC0: areia de praia vista do chao; a aerial_beach_03 tinha sulcos de pneu de perto): cor, normal, rugosidade e AO, com repeticao em metros
export const useAreiaPBR = (metros = 30) => {
  const [diff, nor, rough, ao] = useTexture([
    staticFile('tex/coast_sand_01_diff_2k.jpg'), staticFile('tex/coast_sand_01_nor_gl_2k.jpg'),
    staticFile('tex/coast_sand_01_rough_2k.jpg'), staticFile('tex/coast_sand_01_ao_2k.jpg')]);
  return useMemo(() => {
    for (const x of [diff, nor, rough, ao]) { x.wrapS = x.wrapT = THREE.RepeatWrapping; x.anisotropy = 8; x.needsUpdate = true; }
    diff.colorSpace = THREE.SRGBColorSpace;
    return {metros, mapas: {map: diff, normalMap: nor, roughnessMap: rough, aoMap: ao}};
  }, [diff, nor, rough, ao, metros]);
};
// material da areia para um plano de L x P metros (cada plano ganha a sua repeticao)
export const materialAreia = (pbr: ReturnType<typeof useAreiaPBR>, L: number, P: number) => {
  const m = new THREE.MeshStandardMaterial({...pbr.mapas, roughness: 1, normalScale: new THREE.Vector2(1.2, 1.2), aoMapIntensity: 0.8});
  for (const k of ['map', 'normalMap', 'roughnessMap', 'aoMap'] as const) { const t = (m as any)[k].clone(); t.repeat.set(L / pbr.metros, P / pbr.metros); t.needsUpdate = true; (m as any)[k] = t; }
  // quebra a repeticao vista do alto: o tom varia devagar com um ruido de baixa frequencia
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMundo;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvMundo = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vMundo;
float hh(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5); }
float nn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(hh(i), hh(i+vec2(1,0)), f.x), mix(hh(i+vec2(0,1)), hh(i+vec2(1,1)), f.x), f.y); }`)
      .replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb *= 0.86 + 0.28 * (nn(vMundo.xz * 0.025) * 0.6 + nn(vMundo.xz * 0.11) * 0.4);');
  };
  return m;
};
