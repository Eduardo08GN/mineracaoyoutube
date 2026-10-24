// Kit welt · Modell: vitrine de um (ou mais) modelo(s) 3D do registro (modelos.tsx) em palco escuro com grade de metros, camera orbital por keyframes,
// rotulos com seta, cotas, graduacao (regua com marcas numeradas), barra de destaque, escala humana, chips e HUD.
// Tudo funcao pura de (t, props); o palco usa a luz/Look da Halle do video 2 (configuraveis por `luz` e `look`).
import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill} from 'remotion';
import {HalleM, PERFIL_HALLE} from '../../welt/m_szene';
import {KamDef, V3, orbit, projiziere, glatt, glatt2, zwischen} from '../../welt/t_szene';
import {Masslinie, Marke as MarkeT} from '../../welt/t_etiketten';
import {Marke as MarkeSeta} from '../../welt/g_ui';
import {Leute} from '../../welt/m_transport';
import {C, Chip, Hud, sichtbar} from '../../ui/basis';
import {monoton} from '../../welt/g2_geo';
import {fahrt} from '../../welt/f_gelaende';
import {KitProps, zeit} from '../tipos';
import {MODELOS, P3} from './modelos';
import {Perfil} from '../../look/Look';
import {Quelle} from '../../welt/f_ui';

const RAD = Math.PI / 180;
const EASES: Record<string, (x: number) => number> = {linear: (x) => x, glatt, glatt2};
const cor = (x: any, padrao: string) => { const n = x ?? padrao; return (C as any)[n] ?? n; };

export const Modell: React.FC<KitProps<any>> = ({t, d, b, p}) => {
  const z = (x: any, pad = 0) => zeit(b, x, pad);
  // ---- valores animados das opcoes ----
  const animVal = (a: any): number => {
    if (Array.isArray(a)) {
      const pares = a.map(([tt, v]: [any, number]) => [z(tt), v] as [number, number]).sort((q, r) => q[0] - r[0]);
      if (pares.length === 1) return pares[0][1];
      for (let i = 1; i < pares.length; i++) if (pares[i][0] <= pares[i - 1][0]) pares[i][0] = pares[i - 1][0] + 1e-3;
      if (pares.length === 2) { const u = Math.max(0, Math.min(1, (t - pares[0][0]) / (pares[1][0] - pares[0][0]))); return pares[0][1] + (pares[1][1] - pares[0][1]) * u; }
      return monoton(pares.map((q) => q[0]), pares.map((q) => q[1]))(t);
    }
    const u = (EASES[a.ease ?? 'glatt'] ?? glatt)(zwischen(t, z(a.de[0]), z(a.de[1])));
    return a.v[0] + (a.v[1] - a.v[0]) * u;
  };
  const lista: any[] = p.modelos ?? [{modelo: p.modelo, opcoes: p.opcoes, anim: p.anim}];
  const ops = lista.map((m) => { const o = {...(m.opcoes ?? {})}; for (const [k2, a] of Object.entries(m.anim ?? {})) o[k2] = animVal(a); return o; });
  const modeloIdx = (r: any) => (typeof r === 'string' ? Math.max(0, lista.findIndex((m) => m.modelo === r)) : r ?? 0);
  // ponto no palco: [x,y,z] ou {ancora, modelo?, arg?, dx,dy,dz}
  const ponto = (q: any): P3 => {
    if (Array.isArray(q)) return q as P3;
    const i = modeloIdx(q.modelo), def = MODELOS[lista[i].modelo], fn = def?.ancoras?.[q.ancora];
    if (!fn) throw new Error(`ancora '${q.ancora}' nao existe no modelo ${lista[i].modelo}`);
    const a = fn(ops[i], q.arg);
    return [a[0] + (q.dx ?? 0), a[1] + (q.dy ?? 0), a[2] + (q.dz ?? 0)];
  };

  // ---- camera ----
  const keys0: any[] = (Array.isArray(p.camera) ? p.camera : p.camera?.chaves).map((k: any) => ({...k, tt: z(k.t)})).sort((a: any, c2: any) => a.tt - c2.tt);
  if (keys0.length === 1) keys0.push({...keys0[0], tt: keys0[0].tt + 1});
  const todasOrbita = keys0.every((k) => k.orbita);
  const ks = keys0.map((k) => todasOrbita
    ? {t: k.tt, pos: [k.orbita.az, k.orbita.dist, k.orbita.alto] as V3, ziel: ponto(k.alvo ?? [0, 1, 0]) as V3, fov: k.fov ?? 40}
    : {t: k.tt, pos: k.orbita ? orbit(ponto(k.alvo ?? [0, 1, 0]) as V3, k.orbita.az, k.orbita.dist, k.orbita.alto) : ponto(k.pos) as V3, ziel: ponto(k.alvo ?? [0, 1, 0]) as V3, fov: k.fov ?? 40});
  for (let i = 1; i < ks.length; i++) if (ks[i].t <= ks[i - 1].t) ks[i].t = ks[i - 1].t + 1e-3;
  const f = fahrt(ks as any, t);
  const near = keys0[0].near ?? p.near ?? 0.3, far = keys0[0].far ?? p.far ?? 3000;
  const pos: V3 = todasOrbita ? orbit(f.ziel as V3, f.pos[0], f.pos[1], f.pos[2]) : (f.pos as V3);
  const k: KamDef = {pos, ziel: f.ziel as V3, fov: f.fov, near, far, roll: keys0[0].roll};

  // ---- palco ----
  const luz = p.luz ?? {};
  const perfil: Perfil = {...PERFIL_HALLE, ...(p.look ?? {})};
  const mitte: V3 = luz.centro ?? [0, 2, 0];

  // ---- graduacao ----
  const grad = p.graduacao;
  const gPts = (() => {
    if (!grad) return null;
    const A = new THREE.Vector3(...ponto(grad.de)), B = new THREE.Vector3(...ponto(grad.para)), n = grad.n ?? 10;
    const dir = B.clone().sub(A).normalize(), nrm = new THREE.Vector3(...(grad.normal ?? [0, 1, 0]));
    const eixo = nrm.clone().addScaledVector(dir, -nrm.dot(dir)).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), eixo);
    const anz = Math.min(n, Math.floor(glatt(zwischen(t, z(grad.em), z(grad.fim ?? (z(grad.em) + 1)))) * (n + 0.99)));
    return {A, B, n, q, anz, pts: Array.from({length: n + 1}, (_, i) => A.clone().lerp(B, i / n))};
  })();
  const barra = p.barra;

  return (
    <AbsoluteFill>
      <HalleM k={k} perfil={perfil} mitte={mitte} radius={luz.raio ?? 18} haupt={luz.haupt} gegen={luz.gegen} rasterMitte={p.grade_centro ?? [mitte[0], mitte[2]]}>
        {lista.map((m, i) => { const D = MODELOS[m.modelo]; if (!D) throw new Error(`modelo '${m.modelo}' nao esta no registro (modelos.tsx)`); const C2 = D.C; return <C2 key={i} t={t} {...ops[i]} />; })}
        {gPts && gPts.pts.map((q, i) => i <= gPts.anz && (
          <mesh key={i} position={q} quaternion={gPts.q}><boxGeometry args={[grad.espessura ?? 0.04, grad.altura ?? 0.9, grad.espessura ?? 0.04]} />
            <meshBasicMaterial color={(i === 0 || i === gPts.n) ? cor(grad.cor_pontas, 'signal') : cor(grad.cor, 'cyan')} toneMapped={false} /></mesh>
        ))}
        {barra && (() => {
          const A = new THREE.Vector3(...ponto(barra.de)), B = new THREE.Vector3(...ponto(barra.para)), L = A.distanceTo(B);
          const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), B.clone().sub(A).normalize());
          return <mesh position={A.clone().lerp(B, 0.5)} quaternion={q}><boxGeometry args={[L * Math.min(1, sichtbar(t, z(barra.em), barra.dur ?? 0.6)), barra.espessura ?? 0.03, barra.espessura ?? 0.03]} />
            <meshBasicMaterial color={cor(barra.cor, 'signal')} toneMapped={false} /></mesh>;
        })()}
        {p.humano && <Leute figuren={[{x: p.humano.pos?.[0] ?? 0, z: p.humano.pos?.[1] ?? 0, ry: p.humano.ry ?? 0, pose: p.humano.pose ?? 'stehen', s: (p.humano.altura ?? 1.75) / 1.75}]}
          farbe={p.humano.cor ?? '#8a9298'} sichtbar={sichtbar(t, z(p.humano.em), 0.5)} rim />}
      </HalleM>
      {(p.rotulos ?? []).map((r: any, i: number) => {
        const q = ponto(r.pos), pr = projiziere(k, q);
        const em = z(r.em), ate = r.ate !== undefined ? z(r.ate) : undefined;
        if ((r.seta ?? true) === false) return <MarkeT key={'r' + i} k={k} p={q} t={t} em={em} ate={ate} text={r.texto} unter={r.sub} cor={cor(r.cor, 'papier')} dx={r.dx} dy={r.dy} groesse={r.tam} mitte={r.mitte} />;
        return <MarkeSeta key={'r' + i} at={{x: pr.x, y: pr.y, sichtbar: pr.vorne}} t={t} em={em} ate={ate} titel={r.texto} unter={r.sub} cor={cor(r.cor, 'papier')} dx={r.dx ?? 40} dy={r.dy ?? -60} groesse={r.tam ?? 36} align={r.align} />;
      })}
      {(p.cotas ?? []).map((c: any, i: number) => <Masslinie key={'c' + i} k={k} a={ponto(c.de)} b={ponto(c.para)} text={c.texto} t={t} em={z(c.em)} ate={c.ate !== undefined ? z(c.ate) : undefined}
        cor={cor(c.cor, 'signal')} versatz={c.deslocamento ?? 0} groesse={c.tam ?? 34} unten={c.baixo} />)}
      {gPts && grad.rotulos !== false && Array.from({length: gPts.n}, (_, i) => i < gPts.anz && (
        <MarkeT key={'g' + i} k={k} p={gPts.A.clone().lerp(gPts.B, (i + 0.5) / gPts.n).toArray() as V3} t={t} em={z(grad.em) + (grad.atraso_num ?? 0.9) + i * (grad.passo_num ?? 0.04)} text={`${i + 1}`}
          cor={cor(grad.cor, 'cyan')} mitte dx={0} dy={grad.dy_num ?? -84} groesse={grad.tam_num ?? 30} />
      ))}
      {p.escala_humana && (() => {
        const h = p.escala_humana, base: P3 = [h.pos?.[0] ?? 0, 0, h.pos?.[1] ?? 0], topo: P3 = [base[0], h.altura ?? 1.75, base[2]];
        return <Masslinie k={k} a={base} b={topo} text={h.texto ?? ''} t={t} em={z(h.em)} cor={cor(h.cor, 'papier')} versatz={h.deslocamento ?? 60} groesse={h.tam ?? 30} />;
      })()}
      {(p.chips ?? []).map((c: any, i: number) => <Chip key={'ch' + i} t={t} em={z(c.em)} ate={c.ate !== undefined ? z(c.ate) : undefined} cor={cor(c.cor, 'papier')}
        style={{position: 'absolute', ...(c.pos ?? {left: 64, bottom: 90}), ...(c.tam ? {fontSize: c.tam} : {})}}>{c.texto}</Chip>)}
      {p.fonte && <Quelle t={t} em={z(p.fonte_em, 0.3)} text={p.fonte} />}
      {p.hud && <Hud t={t} em={z(p.hud.em)} titel={p.hud.titulo} zeilen={p.hud.linhas} />}
    </AbsoluteFill>
  );
};
void fahrt;
