// Ceu fotografico: esfera presa a camera com o JPG do HDRI (Poly Haven, CC0; convertido para linear no shader) e luz de ambiente (IBL) do .hdr
// pelo PMREM. Copiado do `CeuFoto` do Eddie3D (mundo/ambiente.tsx), trocando a tabela de HDRIs pelo clima de guerra (clima.ts) e
// acrescentando `rot`: o panorama gira para o sol do HDRI cair no azimute da cena (ver rotParaAzimute). Deterministico.
// Convencao de direcao = a do three (equirectUv): u = atan(z, x)/2pi + 0.5, v = asin(y)/pi + 0.5.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useFrame, useLoader, useThree} from '@react-three/fiber';
import {useTexture} from '@react-three/drei';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js';
import {staticFile} from 'remotion';
import {CLIMAS, Clima} from './clima';

const FUNDO_VS = `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; gl_Position.z = gl_Position.w; }`;
const FUNDO_FS = `
uniform sampler2D uMapa; uniform float uRot; uniform float uExp; uniform float uNevoa; uniform vec3 uCorNevoa; uniform float uSat; varying vec3 vW;
void main(){
  vec3 d = normalize(vW - cameraPosition);
  vec2 uv = vec2(atan(d.z, d.x) * 0.15915494 + 0.5 + uRot, asin(clamp(d.y, -1.0, 1.0)) * 0.31830989 + 0.5);
  vec3 c = pow(texture2D(uMapa, uv).rgb, vec3(2.2)) * uExp;   // JPG ja em tom de tela -> linear
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, uSat);
  // perto do horizonte o ceu some na nevoa (junta com o chao)
  c = mix(c, uCorNevoa, uNevoa * (1.0 - smoothstep(0.0, 0.16, d.y)));
  gl_FragColor = vec4(c, 1.0);
}`;

export const CeuFoto: React.FC<{clima: Clima; rot?: number; exposicao?: number; nevoa?: number; luzAmbiente?: number; sat?: number}> =
  ({clima, rot = 0, exposicao, nevoa = 0.5, luzAmbiente, sat = 0.9}) => {
  const C = CLIMAS[clima];
  const {camera, scene, gl} = useThree();
  const fundo = useTexture(staticFile(C.fundo));
  const hdr = useLoader(RGBELoader, staticFile(C.hdr));
  useMemo(() => { fundo.colorSpace = THREE.NoColorSpace; fundo.anisotropy = 8; fundo.generateMipmaps = true; fundo.needsUpdate = true; }, [fundo]);
  // luz de ambiente (IBL) a partir do .hdr: o PBR dos soldados, arvores e do chao e iluminado pelo ceu fotografado
  const env = useMemo(() => {
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    const pm = new THREE.PMREMGenerator(gl); const rt = pm.fromEquirectangular(hdr); pm.dispose();
    return rt.texture;
  }, [hdr, gl]);
  scene.environment = env; (scene as any).environmentIntensity = luzAmbiente ?? C.ibl;
  (scene as any).environmentRotation = new THREE.Euler(0, -rot * Math.PI * 2, 0);
  const mat = useMemo(() => new THREE.ShaderMaterial({vertexShader: FUNDO_VS, fragmentShader: FUNDO_FS, depthWrite: false, side: THREE.BackSide, toneMapped: false, fog: false,
    uniforms: {uMapa: {value: fundo}, uRot: {value: 0}, uExp: {value: 1}, uNevoa: {value: 0}, uCorNevoa: {value: new THREE.Color(C.nevoa.cor)}, uSat: {value: 1}}}), [fundo, C.nevoa.cor]);
  mat.uniforms.uRot.value = rot; mat.uniforms.uExp.value = exposicao ?? C.exposicao; mat.uniforms.uNevoa.value = nevoa; mat.uniforms.uSat.value = sat;
  const ref = React.useRef<THREE.Mesh>(null);
  useFrame(() => { if (ref.current) ref.current.position.copy(camera.position); }, -0.5);   // depois da Kamera (-1)
  return <mesh ref={ref} material={mat} position={camera.position.toArray()} renderOrder={-1000} frustumCulled={false}><sphereGeometry args={[5000, 64, 32]} /></mesh>;
};
