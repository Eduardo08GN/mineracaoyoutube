// Kit welt · Terra para as cenas Bahn/Globus: Blue Marble global + Europa + pacotes de detalhe (satelite + relevo) por props.
// Copia generalizada de welt/g2_globus.tsx: `pacotes` aceita os nomes prontos ('regiao', 'loncin') OU um objeto de pacote:
//   {box: {w,e,s,n}, farbe: 'geo/x.jpg', hoehe: 'geo/x_hoehe_rg.png', hmin, hmax, hPix, n?, lift?, order?}
// (hoehe = PNG RG de 8 bits, valor = R*256+G, h = hmin + valor/65535*(hmax-hmin); ver public/geo/manifest.json).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useLoader, useThree} from '@react-three/fiber';
import {staticFile} from 'remotion';
import {Ellipsoid, Geodetic, radians} from '@takram/three-geospatial';
import {E2W, welt} from '../../welt/g2_geo';
import {lokalAchsen} from '../../welt/g2_szene';
import {BOX_EUROPA, GEBIETE} from '../../welt/g2_globus';

type Box = {w: number; e: number; s: number; n: number};
export type Pacote = {box: Box; farbe: string; hoehe: string; hmin: number; hmax: number; hPix: number; n?: number; lift?: number; order?: number};
export const PACOTES: Record<string, Pacote> = {
  regiao: GEBIETE.region as any,
  loncin: GEBIETE.loncin as any,
};

const gitter = (b: Box, nLon: number, nLat: number, h = 0) => {
  const N = (nLon + 1) * (nLat + 1);
  const pos = new Float32Array(N * 3), nor = new Float32Array(N * 3), geo = new Float32Array(N * 2);
  const g = new Geodetic(), v = new THREE.Vector3(), n = new THREE.Vector3();
  const rot = new THREE.Matrix4().extractRotation(E2W);
  let k = 0;
  for (let j = 0; j <= nLat; j++) {
    const lat = b.s + (b.n - b.s) * (j / nLat);
    for (let i = 0; i <= nLon; i++) {
      const lon = b.w + (b.e - b.w) * (i / nLon);
      g.set(radians(lon), radians(lat), h).toECEF(v);
      Ellipsoid.WGS84.getSurfaceNormal(v, n).applyMatrix4(rot);
      v.applyMatrix4(E2W);
      pos.set([v.x, v.y, v.z], k * 3); nor.set([n.x, n.y, n.z], k * 3); geo.set([lon, lat], k * 2);
      k++;
    }
  }
  const idx = new Uint32Array(nLon * nLat * 6);
  let q = 0;
  for (let j = 0; j < nLat; j++) for (let i = 0; i < nLon; i++) {
    const a = j * (nLon + 1) + i, b2 = a + 1, c = a + nLon + 1, d = c + 1;
    idx.set([a, b2, d, a, d, c], q); q += 6;
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geom.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geom.setAttribute('geo', new THREE.BufferAttribute(geo, 2));
  geom.setIndex(new THREE.BufferAttribute(idx, 1));
  geom.computeBoundingSphere();
  return geom;
};
const _cache: Record<string, THREE.BufferGeometry> = {};
const gitterC = (key: string, b: Box, nLon: number, nLat: number, h = 0) => (_cache[key] ??= gitter(b, nLon, nLat, h));

const VERT = `
#include <common>
#include <logdepthbuf_pars_vertex>
attribute vec2 geo;
varying vec2 vGeo;
varying vec3 vN;
void main() {
  vGeo = geo;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #include <logdepthbuf_vertex>
}`;
const GLOBUS_FRAG = `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform sampler2D tWelt;
uniform sampler2D tEuropa;
uniform vec4 bEuropa; // w, e, s, n
uniform float uEuropa;
uniform float uHell;
varying vec2 vGeo;
varying vec3 vN;
vec3 meer(vec3 c) {
  float w = smoothstep(1.25, 1.9, c.b / max(max(c.r, c.g), 0.002));
  vec3 tief = vec3(0.006, 0.016, 0.040) + c * vec3(0.05, 0.10, 0.16);
  return mix(c, tief, w * 0.9);
}
void main() {
  #include <logdepthbuf_fragment>
  vec3 c = texture2D(tWelt, vec2((vGeo.x + 180.0) / 360.0, (vGeo.y + 90.0) / 180.0)).rgb;
  if (uEuropa > 0.5) {
    vec2 uv = vec2((vGeo.x - bEuropa.x) / (bEuropa.y - bEuropa.x), (vGeo.y - bEuropa.z) / (bEuropa.w - bEuropa.z));
    float r = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
    if (r > 0.0) c = mix(c, texture2D(tEuropa, uv).rgb, smoothstep(0.0, 0.06, r));
  }
  gl_FragColor = vec4(meer(c) * uHell, 1.0);
}`;
const REGION_VERT = `
#include <common>
#include <logdepthbuf_pars_vertex>
attribute vec2 geo;
uniform sampler2D tHoehe;
uniform float uHmin, uHmax, uUeber;
varying vec2 vGeo;
varying vec3 vN;
varying vec2 vUv;
float hoehe(vec2 uv) { vec3 t = texture2D(tHoehe, uv).rgb; return uHmin + (t.r * 255.0 * 256.0 + t.g * 255.0) / 65535.0 * (uHmax - uHmin); }
void main() {
  vGeo = geo;
  vUv = uv;
  vN = normalize(mat3(modelMatrix) * normal);
  vec3 p = position + normal * hoehe(uv) * uUeber;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  #include <logdepthbuf_vertex>
}`;
const REGION_FRAG = `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform sampler2D tFarbe;
uniform sampler2D tHoehe;
uniform float uHmin, uHmax, uUeber, uRelief, uHell, uAlpha, uAlt;
uniform vec3 uSonne;
uniform vec3 uNord, uOst;
uniform vec2 uPix;
uniform vec2 uTexel;
varying vec2 vGeo;
varying vec3 vN;
varying vec2 vUv;
float hoehe(vec2 uv) { vec3 t = texture2D(tHoehe, uv).rgb; return uHmin + (t.r * 255.0 * 256.0 + t.g * 255.0) / 65535.0 * (uHmax - uHmin); }
void main() {
  #include <logdepthbuf_fragment>
  vec3 c = texture2D(tFarbe, vUv).rgb;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(c, mix(vec3(l), c, 0.62) * vec3(1.06, 1.0, 0.86), uAlt);
  vec2 d = uTexel * 1.5;
  float hx = (hoehe(vUv + vec2(d.x, 0.0)) - hoehe(vUv - vec2(d.x, 0.0))) * uUeber * uRelief / (2.0 * 1.5 * uPix.x);
  float hy = (hoehe(vUv + vec2(0.0, d.y)) - hoehe(vUv - vec2(0.0, d.y))) * uUeber * uRelief / (2.0 * 1.5 * uPix.y);
  vec3 nT = normalize(vN - uOst * hx - uNord * hy);
  float le = max(dot(vN, uSonne), 0.03), lt = max(dot(nT, uSonne), 0.0);
  float k = clamp(lt / le, 0.25, 2.2);
  c *= mix(1.0, k, smoothstep(-0.02, 0.06, dot(vN, uSonne)));
  float r = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
  gl_FragColor = vec4(c * uHell, smoothstep(0.0, 0.07, r) * uAlpha);
}`;

const ladeTex = (t: THREE.Texture, gl: THREE.WebGLRenderer, srgb = true) => {
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.needsUpdate = true;
  return t;
};

export type PacoteRef = string | (Pacote & {id?: string});
export const Terra: React.FC<{europa?: boolean; pacotes?: PacoteRef[]; sonneWelt?: THREE.Vector3; hell?: number; relief?: number; alpha?: number; envelhece?: number}> =
  ({europa = true, pacotes = [], sonneWelt, hell = 1.45, relief = 1, alpha = 1, envelhece = 1}) => {
    const gl = useThree((s) => s.gl);
    const urls = [staticFile('geo/erde_bluemarble_maerz_8k.jpg'), staticFile('geo/europa_bluemarble_maerz.jpg')];
    const [tWelt, tEur] = useLoader(THREE.TextureLoader, urls) as THREE.Texture[];
    useMemo(() => { ladeTex(tWelt, gl); ladeTex(tEur, gl); tWelt.wrapS = THREE.RepeatWrapping; }, [tWelt, tEur, gl]);
    const mat = useMemo(() => new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: GLOBUS_FRAG,
      uniforms: {tWelt: {value: tWelt}, tEuropa: {value: tEur}, bEuropa: {value: new THREE.Vector4(BOX_EUROPA.w, BOX_EUROPA.e, BOX_EUROPA.s, BOX_EUROPA.n)},
        uEuropa: {value: europa ? 1 : 0}, uHell: {value: hell}},
    }), [tWelt, tEur]);
    mat.uniforms.uEuropa.value = europa ? 1 : 0; mat.uniforms.uHell.value = hell;
    const grob = gitterC('grob', {w: -180, e: 180, s: -90, n: 90}, 512, 256, -150);
    const fein = gitterC('fein', {w: -16, e: 28, s: 36, n: 62}, 440, 260, 0);
    return (
      <group>
        <mesh geometry={grob} material={mat} frustumCulled={false} />
        {europa && <mesh geometry={fein} material={mat} frustumCulled={false} />}
        {pacotes.map((p, i) => {
          const spec = typeof p === 'string' ? PACOTES[p] : p;
          if (!spec) throw new Error(`pacote de terreno desconhecido: ${String(p)}`);
          const id = typeof p === 'string' ? p : (p.id ?? `pk${i}_${spec.farbe}`);
          return <Flaeche key={id} id={id} G={spec} gl={gl} sonneWelt={sonneWelt} hell={hell} relief={relief} alpha={alpha} alt={envelhece} />;
        })}
      </group>
    );
  };

const Flaeche: React.FC<{id: string; G: Pacote; gl: THREE.WebGLRenderer; sonneWelt?: THREE.Vector3; hell: number; relief: number; alpha: number; alt: number}> = ({id, G, gl, sonneWelt, hell, relief, alpha, alt}) => {
  const [tF, tH] = useLoader(THREE.TextureLoader, [staticFile(G.farbe), staticFile(G.hoehe)]) as THREE.Texture[];
  useMemo(() => {
    ladeTex(tF, gl);
    ladeTex(tH, gl, false); tH.anisotropy = 1; tH.generateMipmaps = false; tH.minFilter = THREE.LinearFilter; tH.magFilter = THREE.LinearFilter;
  }, [tF, tH, gl]);
  const n = G.n ?? 320, lift = G.lift ?? 0, box = G.box;
  const geom = useMemo(() => {
    const g = gitterC('pk_' + id, box, n, n, lift);
    if (!g.getAttribute('uv')) {
      const geo = g.getAttribute('geo') as THREE.BufferAttribute, uv = new Float32Array(geo.count * 2);
      for (let i = 0; i < geo.count; i++) { uv[i * 2] = (geo.getX(i) - box.w) / (box.e - box.w); uv[i * 2 + 1] = (geo.getY(i) - box.s) / (box.n - box.s); }
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    }
    return g;
  }, [id]);
  const mat = useMemo(() => {
    const lat0 = (box.s + box.n) / 2;
    const pixO = ((box.e - box.w) * 111195 * Math.cos((lat0 * Math.PI) / 180)) / G.hPix, pixN = ((box.n - box.s) * 111195) / G.hPix;
    return new THREE.ShaderMaterial({
      vertexShader: REGION_VERT, fragmentShader: REGION_FRAG, transparent: true, depthWrite: true,
      uniforms: {tFarbe: {value: tF}, tHoehe: {value: tH}, uHmin: {value: G.hmin}, uHmax: {value: G.hmax}, uUeber: {value: 1},
        uRelief: {value: 1}, uHell: {value: 1}, uAlpha: {value: 1}, uAlt: {value: 1}, uSonne: {value: new THREE.Vector3(0, 1, 0)},
        uNord: {value: new THREE.Vector3(1, 0, 0)}, uOst: {value: new THREE.Vector3(0, 0, 1)}, uPix: {value: new THREE.Vector2(pixO, pixN)},
        uTexel: {value: new THREE.Vector2(1 / G.hPix, 1 / G.hPix)}},
    });
  }, [tF, tH, id]);
  { const ax = lokalAchsen(welt((box.s + box.n) / 2, (box.w + box.e) / 2, 0)); mat.uniforms.uNord.value.copy(ax.nord); mat.uniforms.uOst.value.copy(ax.ost); }
  if (sonneWelt) mat.uniforms.uSonne.value.copy(sonneWelt).normalize();
  mat.uniforms.uRelief.value = relief; mat.uniforms.uHell.value = hell; mat.uniforms.uAlpha.value = alpha; mat.uniforms.uAlt.value = alt;
  return <mesh geometry={geom} material={mat} frustumCulled={false} renderOrder={G.order ?? 2} />;
};
