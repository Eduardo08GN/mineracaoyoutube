// Fogo e fumaca com flipbooks de simulacao real (Unity Labs, CC0, feitos no Houdini) num motor de particulas proprio e sem estado:
// tudo e funcao do tempo (uT) e da semente de cada particula, entao qualquer quadro sai igual em qualquer aba do render.
// Fogo: billboard cilindrico (fica em pe), mistura entre dois quadros do atlas, aditivo. Fumaca: billboard esferico que sobe,
// cresce, gira devagar e some; o atlas ja vem iluminado e recebe a cor (marrom, cinza, vapor) e a luz da cena.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useTexture} from '@react-three/drei';
import {staticFile} from 'remotion';

export type Emissor = {x: number; y?: number; z: number; s: number; t0: number; t1?: number};
type Atlas = {arq: string; cols: number; rows: number; aspecto: number};
export const ATLAS = {
  chamaPequena: {arq: 'vfx/SmallFlame01_16x4.png', cols: 16, rows: 4, aspecto: 0.5},
  chama: {arq: 'vfx/Flame02_16x4.png', cols: 16, rows: 4, aspecto: 0.5},
  chamaOca: {arq: 'vfx/Flame03_16x4.png', cols: 16, rows: 4, aspecto: 0.5},
  nuvem1: {arq: 'vfx/Cloud01_8x8.png', cols: 8, rows: 8, aspecto: 1},
  nuvem2: {arq: 'vfx/Cloud02_8x8.png', cols: 8, rows: 8, aspecto: 1},
  fiapo: {arq: 'vfx/WispySmoke01_8x8.png', cols: 8, rows: 8, aspecto: 1},
  explosao: {arq: 'vfx/Explosion01_5x5.png', cols: 5, rows: 5, aspecto: 1},
  bola: {arq: 'vfx/FireBall01_8x8.png', cols: 8, rows: 8, aspecto: 1},
} satisfies Record<string, Atlas>;

const VS = `
attribute vec3 aBase; attribute vec4 aDados; attribute vec4 aDados2;   // aDados: t0, t1, escala, semente | aDados2: fase, dx, dz, vida
uniform float uT; uniform float uSobe; uniform float uCresce; uniform float uCilindro; uniform float uAspecto; uniform float uFrames;
varying vec2 vUv; varying float vQ0; varying float vMix; varying float vA; varying float vSeed; varying float vVida;
float h(float x){ return fract(sin(x * 91.7) * 43758.5); }
void main(){
  float t0 = aDados.x, t1 = aDados.y, esc = aDados.z, seed = aDados.w, fase = aDados2.x, vida = aDados2.w;
  float idadeAbs = uT - t0;
  float vivo = step(0.0, idadeAbs) * (t1 > 0.0 ? step(uT, t1 + vida) : 1.0);
  float u = fract(idadeAbs / vida + fase);            // 0..1 dentro da vida desta particula (laco continuo)
  float cresceIn = clamp(idadeAbs / 1.2, 0.0, 1.0);    // o foco nasce pequeno
  float apaga = t1 > 0.0 ? 1.0 - clamp((uT - t1) / vida, 0.0, 1.0) : 1.0;
  float s = esc * (1.0 + uCresce * u) * cresceIn * vivo * apaga;
  vec3 c = aBase + vec3(aDados2.y, 0.0, aDados2.z) * esc + vec3(sin(seed * 20.0 + uT * 0.7), 0.0, cos(seed * 13.0 + uT * 0.5)) * 0.15 * esc * u
         + vec3(0.0, uSobe * u * vida, 0.0);
  // billboard: cilindrico (fogo em pe) ou esferico (fumaca), com rotacao lenta da fumaca
  vec3 dir = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 up = mix(vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]), vec3(0.0, 1.0, 0.0), uCilindro);
  float ang = (1.0 - uCilindro) * (h(seed) - 0.5) * 6.28 + (1.0 - uCilindro) * u * (h(seed + 3.0) - 0.5) * 1.2;
  vec2 q = vec2(position.x * cos(ang) - position.y * sin(ang), position.x * sin(ang) + position.y * cos(ang));
  vec3 p = c + dir * q.x * s * uAspecto + up * (q.y + 0.5 * uCilindro) * s;
  vUv = uv; vSeed = seed; vVida = u;
  float f = u * (uFrames - 1.0); vQ0 = floor(f); vMix = f - vQ0;
  vA = vivo * smoothstep(0.0, 0.12, u) * (1.0 - smoothstep(0.7, 1.0, u)) * apaga;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const FS = `
uniform sampler2D uAtlas; uniform float uCols; uniform float uRows; uniform vec3 uCor; uniform float uForca; uniform float uFumaca; uniform vec3 uLuz;
varying vec2 vUv; varying float vQ0; varying float vMix; varying float vA; varying float vSeed; varying float vVida;
vec4 quadro(float k){ float cx = mod(k, uCols), cy = floor(k / uCols); vec2 uv = (vec2(cx, uRows - 1.0 - cy) + vUv) / vec2(uCols, uRows); return texture2D(uAtlas, uv); }
void main(){
  vec4 a = quadro(vQ0), b = quadro(min(vQ0 + 1.0, uCols * uRows - 1.0));
  vec4 c = mix(a, b, vMix);
  if (uFumaca > 0.5) {
    // fumaca: a textura ja tem a luz embutida (tons de cinza); vira a cor pedida e recebe a luz da cena, base mais escura
    float l = dot(c.rgb, vec3(0.333));
    vec3 col = uCor * (0.6 + 0.8 * l) * uLuz;   // o lado iluminado da pluma fica claro, a base mais escura
    gl_FragColor = vec4(col, c.a * vA * uForca);
  } else {
    // fogo: aditivo, a cor do atlas (laranja/amarelo) com a forca pedida
    // atlas sem alfa (bola de fogo e RGB): o cinza escuro da borda do quadro somava luz e virava um disco palido
    float lum = max(c.r, max(c.g, c.b));
    gl_FragColor = vec4(c.rgb * smoothstep(0.06, 0.3, lum) * uCor * uForca * vA * c.a, 1.0);
  }
  gl_FragColor.rgb = pow(max(gl_FragColor.rgb, vec3(0.0)), vec3(2.2));
}`;

type Props = {atlas: Atlas; emissores: Emissor[]; t: number; porEmissor?: number; vida?: number; sobe?: number; cresce?: number;
  cor?: THREE.ColorRepresentation; forca?: number; fumaca?: boolean; luz?: number; espalha?: number};

// porEmissor particulas por foco, com fases espalhadas: o foco queima sem parar e sem "piscar"
export const Flipbook: React.FC<Props> = ({atlas, emissores, t, porEmissor = 3, vida = 1.4, sobe = 0.2, cresce = 0.2, cor = '#ffffff', forca = 1, fumaca = false, luz = 1, espalha = 0.35}) => {
  const tex = useTexture(staticFile(atlas.arq));
  useMemo(() => { tex.colorSpace = THREE.NoColorSpace; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4; tex.needsUpdate = true; }, [tex]);
  const {malha, mat} = useMemo(() => {
    const n = Math.max(1, emissores.length * porEmissor);
    const geo = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1) as any) as THREE.InstancedBufferGeometry;
    const base = new Float32Array(n * 3), d1 = new Float32Array(n * 4), d2 = new Float32Array(n * 4);
    emissores.forEach((e, i) => {
      for (let k = 0; k < porEmissor; k++) {
        const j = i * porEmissor + k, sd = (i * 7.31 + k * 1.37) % 97.0;
        const hh = (x: number) => { const v = Math.sin(x * 91.7) * 43758.5; return v - Math.floor(v); };
        base.set([e.x, e.y ?? 0, e.z], j * 3);
        d1.set([e.t0, e.t1 ?? -1, e.s * (0.75 + hh(sd + 1) * 0.5), sd], j * 4);
        d2.set([k / porEmissor + hh(sd + 2) * 0.2, (hh(sd + 3) - 0.5) * espalha, (hh(sd + 4) - 0.5) * espalha, vida * (0.8 + hh(sd + 5) * 0.4)], j * 4);
      }
    });
    geo.setAttribute('aBase', new THREE.InstancedBufferAttribute(base, 3));
    geo.setAttribute('aDados', new THREE.InstancedBufferAttribute(d1, 4));
    geo.setAttribute('aDados2', new THREE.InstancedBufferAttribute(d2, 4));
    geo.instanceCount = n;
    const mat = new THREE.ShaderMaterial({vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
      blending: fumaca ? THREE.NormalBlending : THREE.AdditiveBlending,
      uniforms: {uT: {value: 0}, uSobe: {value: sobe}, uCresce: {value: cresce}, uCilindro: {value: fumaca ? 0 : 1}, uAspecto: {value: atlas.aspecto},
        uFrames: {value: atlas.cols * atlas.rows}, uAtlas: {value: tex}, uCols: {value: atlas.cols}, uRows: {value: atlas.rows},
        uCor: {value: new THREE.Color(cor)}, uForca: {value: forca}, uFumaca: {value: fumaca ? 1 : 0}, uLuz: {value: new THREE.Color(luz, luz, luz)}}});
    const malha = new THREE.Mesh(geo, mat); malha.frustumCulled = false;
    return {malha, mat};
  }, [emissores, porEmissor, vida, espalha, tex, fumaca, atlas]);
  const u = mat.uniforms;
  u.uT.value = t; u.uSobe.value = sobe; u.uCresce.value = cresce; u.uForca.value = forca; (u.uCor.value as THREE.Color).set(cor); (u.uLuz.value as THREE.Color).setScalar(luz);
  return <primitive object={malha} renderOrder={fumaca ? 12 : 14} />;
};
