// Pecas prontas do Fab (assets/fab, catalogo em D:/whatif_es/assets/fab/catalogo.json): carregar, clonar com sombra,
// trocar a paleta dos carros (Flat Style Vehicles: o mesmo atlas em 16 cores) e tirar a geometria em float para instanciar.
// Os GLB vem com meshopt (decoder embutido no drei, sem rede) e quantizacao: para instanciar, a geometria e convertida para
// float ja com a matriz do no aplicada.
import * as THREE from 'three';
import {useGLTF, useTexture} from '@react-three/drei';
import {staticFile} from 'remotion';
import {useMemo} from 'react';

export const useFab = (arq: string) => useGLTF(staticFile(`fab/${arq}`), false) as unknown as {scene: THREE.Group; animations: THREE.AnimationClip[]};

export const clonar = (cena: THREE.Object3D, sombra = true) => {
  const c = cena.clone(true);
  c.traverse((o: any) => { if (o.isMesh) { o.castShadow = sombra; o.receiveShadow = true; } });
  return c;
};

// geometria em float (desfaz a quantizacao) com a matriz do mundo do no aplicada
export const paraFloat = (geo: THREE.BufferGeometry, m: THREE.Matrix4) => {
  const g = new THREE.BufferGeometry();
  for (const nome of Object.keys(geo.attributes)) {
    const a: any = geo.attributes[nome], n = a.count, k = a.itemSize, arr = new Float32Array(n * k);
    const get = [a.getX, a.getY, a.getZ, a.getW];
    for (let i = 0; i < n; i++) for (let c = 0; c < k; c++) arr[i * k + c] = get[c].call(a, i);
    g.setAttribute(nome, new THREE.BufferAttribute(arr, k));
  }
  if (geo.index) g.setIndex(Array.from(geo.index.array as ArrayLike<number>));
  g.applyMatrix4(m);
  g.computeBoundingSphere();
  return g;
};
// todas as malhas da cena (geometria em float + material), para virar InstancedMesh
export const malhasDe = (cena: THREE.Object3D) => {
  cena.updateMatrixWorld(true);
  const out: {geo: THREE.BufferGeometry; mat: THREE.Material; nome: string}[] = [];
  cena.traverse((o: any) => { if (o.isMesh) out.push({geo: paraFloat(o.geometry, o.matrixWorld), mat: o.material, nome: o.name}); });
  return out;
};

// paletas dos carros (texturas glTF: flipY = false)
export const usePaletas = (nomes: string[]) => {
  const tex = useTexture(nomes.map((n) => staticFile(`fab/paletas/${n}.png`)));
  return useMemo(() => {
    const m: Record<string, THREE.Texture> = {};
    tex.forEach((t, i) => { t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.needsUpdate = true; m[nomes[i]] = t; });
    return m;
  }, [tex]);
};
export const comPaleta = (obj: THREE.Object3D, mapa: THREE.Texture) => {
  obj.traverse((o: any) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const novos = mats.map((mm: THREE.MeshStandardMaterial) => { const n = mm.clone(); if (n.map) { n.map = mapa; n.needsUpdate = true; } n.roughness = 0.45; n.metalness = 0.1; return n; });
    o.material = Array.isArray(o.material) ? novos : novos[0];
  });
  return obj;
};
