// Kit welt · contexto compartilhado entre o motor (Bahn/Globus) e as camadas.
import * as THREE from 'three';
import {Beat} from '../../tempo';
import {Pose} from '../../welt/g2_geo';
import {Proj} from '../../welt/g_ui';
import {Track} from './curva';
import {FARBE} from '../../welt/g2_bahn';
import {C} from '../../ui/basis';

export type V3 = THREE.Vector3;
// Ref = ponto no mundo: "origem" | "alvo" | "meio" | "proj" | "apogeu" | {ancora, curva?, ts?, lat, lon, h, lado, frente, alto, norte, leste}
//   lado = para a direita do tiro (onde fica a camera lateral), frente = sentido do tiro, alto = vertical local, norte/leste = absolutos (m)
export type Ref = string | {ancora?: string; curva?: string | number; ts?: number; lat?: number; lon?: number; h?: number; lado?: number; frente?: number; alto?: number; norte?: number; leste?: number};

export type Ctx = {
  t: number; d: number; tl: number; b: Beat; pose: Pose; proj: (p: V3) => Proj; pxW: (p: V3, px: number) => number;
  tracks: Track[]; tss: number[]; az: number; sun: V3; loc: string; jsons: Record<string, any>;
  z: (x: any, pad?: number) => number;
  ref: (r: Ref | undefined, padrao?: string) => V3;
  dirs: (p: V3) => {lado: V3; frente: V3; alto: V3};
  nf: (v: number, c?: number) => string;
  tpl: (s: string, ci?: number) => string;
  ci: (id?: string | number) => number;
  tDeTs: (ci: number, ts: number) => number;
  P: any;
};

// nomes de cor do canal (ui/basis) ou qualquer css
export const corC = (x: any, padrao: string = 'signal'): THREE.Color => {
  const n = x ?? padrao;
  if (n instanceof THREE.Color) return n;
  return (FARBE as any)[n]?.clone() ?? new THREE.Color(n);
};
export const corH = (x: any, padrao: string = 'signal'): string => {
  const n = x ?? padrao;
  return (C as any)[n] ?? n;
};
