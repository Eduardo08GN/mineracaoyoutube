// Kit welt · motor das cenas Bahn e Globus: curvas (ou nenhuma) + camera por keyframes ancoraveis + atmosfera fisica (takram) + camadas.
// Tudo funcao pura de (t, props). Bahn e Globus so mudam os padroes.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill} from 'remotion';
import {GLook, GWelt} from '../../welt/g2_atmosphaere';
import {ErdVerdecker} from '../../welt/g2_globus';
import {Pose, geodaetisch, monoton, oben, projektor, sonneEcef, E2W, welt} from '../../welt/g2_geo';
import {Key, azimut, kamera, lokalAchsen} from '../../welt/g2_szene';
import {FARBE, Granate, Leuchtpunkt, Linie, hoehenFarbe, pxZuWelt} from '../../welt/g2_bahn';
import {Kreis} from '../../welt/g2_teile';
import {Marke} from '../../welt/g_ui';
import {SchussHud} from '../../welt/g2_ui';
import {Quelle} from '../../welt/f_ui';
import {C, F, fase, sichtbar} from '../../ui/basis';
import {KitProps, zeit} from '../tipos';
import {Terra} from './erde';
import {CurvaSpec, Track, amostra, arquivosDe, montaTrack, mundo, pontosCurva, rumo, rumoEntre, useJsons} from './curva';
import {Ctx, Ref, corC, corH} from './ctx';
import {CAMADAS, Saida} from './camadas';

const K = Math.PI / 180;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

// ---- presets de Look (configuraveis por props.look) -------------------------------------------------------
const LOOKS: Record<string, GLook> = {
  dia: {belichtung: 7.5, bloom: 0.5, saturacao: 0.2, kontrast: 0.14, vinheta: 0.45, sterne: 0},
  espaco: {belichtung: 7, bloom: 0.5, saturacao: 0.25, kontrast: 0.14, vinheta: 0.5, sterne: 0.9},
  crepusculo: {belichtung: 16, bloom: 0.8, saturacao: 0.1, kontrast: 0.12, vinheta: 0.6, sterne: 0.35, sonne: false},
  dramatico: {belichtung: 5.4, bloom: 0.5, saturacao: 0.45, kontrast: 0.2, vinheta: 0.7, sterne: 0},
};
const resolveLook = (l: any = {}): GLook => {
  const base = LOOKS[l.preset ?? 'dia'] ?? LOOKS.dia;
  const o: GLook = {...base};
  if (l.exposicao !== undefined) o.belichtung = l.exposicao;
  if (l.bloom !== undefined) o.bloom = l.bloom;
  if (l.saturacao !== undefined) o.saturacao = l.saturacao;
  if (l.contraste !== undefined) o.kontrast = l.contraste;
  if (l.vinheta !== undefined) o.vinheta = l.vinheta;
  if (l.estrelas !== undefined) o.sterne = l.estrelas;
  if (l.sol !== undefined) o.sonne = l.sol;
  return o;
};

// ---- data/sol ----------------------------------------------------------------------------------------------
const elevSol = (ms: number, lat: number, lon: number) => {
  const n = new THREE.Vector3(Math.cos(lat * K) * Math.cos(lon * K), Math.cos(lat * K) * Math.sin(lon * K), Math.sin(lat * K));
  return Math.asin(clamp(sonneEcef(ms).dot(n), -1, 1)) / K;
};
// {data: ISO} ou {dia: 'AAAA-MM-DD', elevacao: graus, lado: 'tarde'|'manha'} (acha a hora UTC em que o sol tem essa altura no centro da cena)
export const resolveData = (sol: any = {}, centro: {lat: number; lon: number}): number => {
  if (sol.data !== undefined) return typeof sol.data === 'number' ? sol.data : Date.parse(sol.data);
  const dia = Date.parse((sol.dia ?? '2000-04-15') + 'T00:00:00Z'), alvo = sol.elevacao ?? 38, tarde = (sol.lado ?? 'tarde') === 'tarde';
  let melhor = dia + 12 * 3600e3, erro = 1e9;
  const fim = Math.round(24 * 6);
  for (let i = 0; i <= fim; i++) {
    const ms = dia + i * 600e3, el = elevSol(ms, centro.lat, centro.lon), el2 = elevSol(ms + 600e3, centro.lat, centro.lon);
    const sobe = el2 > el;
    if (sobe === tarde) continue;
    const e = Math.abs(el - alvo);
    if (e < erro) { erro = e; melhor = ms; }
  }
  return melhor;
};

// ---- camera ---------------------------------------------------------------------------------------------------
type ChaveCam = {t: any; pos?: Ref; alvo?: Ref; orbita?: {dist: number; elev: number; az: number}; fov?: number; roll?: number};

const Cena: React.FC<{p: any; t: number; d: number; b: any; jsons: Record<string, any>; modo: 'bahn' | 'globus'}> = ({p, t, d, b, jsons, modo}) => {
  const z = (x: any, pad = 0) => zeit(b, x, pad);
  const tl = t + (p.t0 ?? 0);
  const loc = p.locale ?? 'de-DE';
  const nf = (v: number, c = 0) => v.toLocaleString(loc, {minimumFractionDigits: c, maximumFractionDigits: c});

  // ---- curvas ----
  const specs: CurvaSpec[] = (p.curvas ?? (p.curva ? [p.curva] : [])).map((s: CurvaSpec) => ({origem: p.origem, azimute: p.azimute, solo: p.solo, ...s}));
  const chave = JSON.stringify(specs);
  const tracks = useMemo(() => specs.map((s, i) => montaTrack(s, jsons, i)), [chave]);
  const tr0: Track | undefined = tracks[0];

  // fluxo: tempo local -> segundo de voo
  const tss = specs.map((s, i) => {
    const tr = tracks[i], f = s.fluxo ?? (i === 0 ? p.fluxo : undefined);
    if (!f || f === 'linear') return clamp(((tl) / d) * tr.fim, 0, tr.fim);
    const pares: [number, number][] = (f as any[]).map(([a, v]) => [z(a), v] as [number, number]).sort((a, c2) => a[0] - c2[0]);
    for (let j = 1; j < pares.length; j++) if (pares[j][0] <= pares[j - 1][0]) pares[j][0] = pares[j - 1][0] + 1e-3;
    if (pares.length === 1) return clamp(pares[0][1] + (tl - pares[0][0]), 0, tr.fim);
    return clamp(monoton(pares.map((q) => q[0]), pares.map((q) => q[1]))(tl), 0, tr.fim);
  });
  const ci = (id?: string | number) => (id === undefined ? 0 : typeof id === 'number' ? id : Math.max(0, specs.findIndex((s, i) => (s.id ?? 'c' + i) === id)));
  const tDeTs = (c: number, ts: number) => {
    // primeiro tempo local em que o fluxo da curva c atinge ts (varredura; funcao pura dos props)
    const f = specs[c].fluxo ?? (c === 0 ? p.fluxo : undefined), T = tracks[c].fim;
    if (!f || f === 'linear') return (ts / T) * d;
    const pares: [number, number][] = (f as any[]).map(([a, v]) => [z(a), v] as [number, number]).sort((a, c2) => a[0] - c2[0]);
    if (pares.length === 1) return pares[0][0] + (ts - pares[0][1]);
    for (let j = 1; j < pares.length; j++) if (pares[j][0] <= pares[j - 1][0]) pares[j][0] = pares[j - 1][0] + 1e-3;
    const fn = monoton(pares.map((q) => q[0]), pares.map((q) => q[1]));
    for (let x = -2; x < d + 3; x += 0.01) if (fn(x) >= ts - 1e-6) return x;
    return d;
  };

  // ---- geometria base ----
  const origemG = p.origem ?? tr0?.origem ?? p.alvo_cam ?? p.alvo ?? {lat: 0, lon: 0};
  const alvoG = p.alvo ?? tr0?.alvo ?? origemG;
  const hOr = origemG.h ?? tr0?.origem.h ?? 0, hAl = alvoG.h ?? tr0?.alvo.h ?? 0;
  const az = p.azimute ?? ((origemG.lat === alvoG.lat && origemG.lon === alvoG.lon) ? 0 : rumoEntre(origemG, alvoG));
  const dirs = (q: THREE.Vector3) => ({lado: azimut(q, az + 90), frente: azimut(q, az), alto: oben(q)});
  const ancora = (nome: string, cid?: string | number): THREE.Vector3 => {
    const i = ci(cid), T = tracks[i];
    switch (nome) {
      case 'proj': return T ? mundo(T, tss[i]) : welt(origemG.lat, origemG.lon, hOr);
      case 'origem': return T ? welt(T.origem.lat, T.origem.lon, T.origem.h ?? 0) : welt(origemG.lat, origemG.lon, hOr);
      case 'alvo': case 'impacto': return T ? welt(T.alvo.lat, T.alvo.lon, T.alvo.h ?? 0) : welt(alvoG.lat, alvoG.lon, hAl);
      case 'meio': return ancora('origem', cid).lerp(ancora('alvo', cid), 0.5);
      case 'apogeu': return T ? mundo(T, T.tApogeu) : ancora('origem', cid);
      default: throw new Error(`ancora desconhecida: ${nome}`);
    }
  };
  const ref = (r: Ref | undefined, padrao = 'proj'): THREE.Vector3 => {
    let o: any = r === undefined ? padrao : r;
    if (typeof o === 'string') o = {ancora: o};
    let base: THREE.Vector3;
    if (o.lat !== undefined) base = welt(o.lat, o.lon, o.h ?? 0);
    else if (o.ts !== undefined) base = mundo(tracks[ci(o.curva)], o.ts);
    else base = ancora(o.ancora ?? padrao, o.curva);
    if (o.lado || o.frente || o.alto || o.norte || o.leste) {
      const D = dirs(base), ax = lokalAchsen(base);
      base.addScaledVector(D.lado, o.lado ?? 0).addScaledVector(D.frente, o.frente ?? 0).addScaledVector(D.alto, o.alto ?? 0).addScaledVector(ax.nord, o.norte ?? 0).addScaledVector(ax.ost, o.leste ?? 0);
    }
    return base;
  };

  // ---- camera ----
  const camSpec: any = p.camera ?? padraoCamera(p, tr0, modo);
  const chavesBrutas: ChaveCam[] = Array.isArray(camSpec) ? camSpec : camSpec.chaves;
  const tremor = (Array.isArray(camSpec) ? undefined : camSpec.tremor) ?? p.tremor ?? 0;
  const ks = chavesBrutas.map((k) => ({...k, tt: z(k.t)})).sort((a, c2) => a.tt - c2.tt);
  for (let j = 1; j < ks.length; j++) if (ks[j].tt <= ks[j - 1].tt) ks[j].tt = ks[j - 1].tt + 1e-3;
  if (ks.length === 1) ks.push({...ks[0], tt: ks[0].tt + 1});
  const todasOrbita = ks.every((k) => k.orbita);
  let fovAnt = 40;
  const resolvidas: Key[] = ks.map((k) => {
    const fov = k.fov ?? fovAnt; fovAnt = fov;
    const ziel = ref(k.alvo, 'meio');
    if (todasOrbita) return {t: k.tt, pos: new THREE.Vector3(Math.log(k.orbita!.dist), k.orbita!.elev, k.orbita!.az), ziel, fov, roll: k.roll};
    if (k.orbita) return {t: k.tt, pos: orbitaPos(ziel, k.orbita, ref), ziel, fov, roll: k.roll};
    return {t: k.tt, pos: ref(k.pos, 'meio'), ziel, fov, roll: k.roll};
  });
  let pose: Pose = kamera(resolvidas, tl, tremor);
  if (todasOrbita) { const e = pose.pos; pose = {...pose, pos: orbitaPos(pose.ziel, {dist: Math.exp(e.x), elev: e.y, az: e.z}, ref)}; }

  // ---- data/sol, look ----
  const centroSol = {lat: origemG.lat, lon: origemG.lon};
  const datum = resolveData(p.sol ?? {}, p.sol?.centro ?? (modo === 'globus' ? {lat: alvoG.lat, lon: alvoG.lon} : {lat: (origemG.lat + alvoG.lat) / 2, lon: (origemG.lon + alvoG.lon) / 2}));
  void centroSol;
  const sunW = useMemo(() => sonneEcef(datum).transformDirection(E2W).clone(), [datum]);
  const look = resolveLook(p.look ?? (modo === 'globus' ? {preset: 'espaco'} : {}));
  const proj = projektor(pose);
  const pxW = (q: THREE.Vector3, px: number) => pxZuWelt(pose, q, px);

  // ---- templates de texto ----
  const tpl = (s: string, c0 = 0) => s.replace(/\{(?:([A-Za-z0-9_]+):)?([A-Za-z0-9_]+)(?:\|(\d))?\}/g, (_m, id, nome, dec) => {
    const i = id ? ci(id) : c0, T = tracks[i]; if (!T) return '';
    const a = amostra(T, tss[i]);
    const fim = amostra(T, T.fim);
    const dd = dec === undefined ? undefined : +dec;
    const v: Record<string, [number, number]> = {
      t: [a.t, 1], h: [a.h, 0], h_km: [a.h / 1000, 1], x: [a.x / 1000, 1], x_m: [a.x, 0], v: [a.v, 0], mach: [a.mach, 2], ang: [Math.abs(a.ang), 1], vh: [a.v * Math.cos(a.ang * K), 0],
      hmax: [T.hApogeu, 0], vmin: [Math.min(...T.v), 0], tmax: [T.tApogeu, 1], T: [T.fim, 1], vfim: [fim.v, 0], alcance_km: [fim.x / 1000, 1], alcance_m: [fim.x, 0], angfim: [Math.abs(fim.ang), 1],
    };
    const e = v[nome]; if (!e) return `{${nome}?}`;
    return nf(e[0], dd ?? e[1]);
  });

  const ctx: Ctx = {t, d, tl, b, pose, proj, pxW, tracks, tss, az, sun: sunW, loc, jsons, z, ref, dirs, nf, tpl, ci, tDeTs, P: p};

  // ---- montagem de overlay (3D) e ui (HTML) ----
  const ov: React.ReactNode[] = [], ui: React.ReactNode[] = [];
  const add = (s: Saida) => { if (s.ov) ov.push(s.ov); if (s.ui) ui.push(s.ui); };

  // curvas: fantasma, rastro, cabeca
  specs.forEach((s: any, i) => {
    const T = tracks[i], ts = tss[i];
    if (s.visivel === false) return;
    const m = s.muda ? fase(tl, z(s.muda.em), z(s.muda.ate ?? (z(s.muda.em) + 0.7))) : 0;
    const cor = s.cor ? corC(s.cor) : undefined;
    const corM = s.muda?.cor ? corC(s.muda.cor) : undefined;
    const corF = cor && corM ? cor.clone().lerp(corM, m) : (cor ?? corM);
    const opak = (s.opak ?? 1) + ((s.muda?.opak ?? s.opak ?? 1) - (s.opak ?? 1)) * m;
    const glow = (s.brilho ?? 1) + ((s.muda?.brilho ?? s.brilho ?? 1) - (s.brilho ?? 1)) * m;
    const larg = (s.largura ?? (i === 0 ? 4 : 5)) + ((s.muda?.largura ?? s.largura ?? 4) - (s.largura ?? 4)) * (s.muda?.largura ? m : 0);
    const strich = s.muda?.tracejado && m > 0.5 ? s.muda.tracejado : s.tracejado;
    const lim = s.limite_km ?? 20;
    const de0 = s.de === undefined ? 0 : s.de < 0 ? Math.max(0, T.fim + s.de) : s.de;
    if (s.fantasma) {
      const g = pontosCurva(T, T.fim, de0);
      ov.push(<Linie key={'fg' + i} pts={g.pts} farbe={corF ?? FARBE.orange} breite={s.fantasma.largura ?? 3.2} glow={s.fantasma.brilho ?? 0.7} opak={s.fantasma.opak ?? 0.5} pose={pose} />);
    }
    if (s.rastro !== false && ts - (s.atraso ?? 0) > de0 + 1e-6) {
      const r = pontosCurva(T, ts - (s.atraso ?? 0), de0);
      ov.push(<Linie key={'rs' + i} pts={r.pts} farbe={corF} farben={corF ? undefined : r.hs.map((h) => hoehenFarbe(h, lim))} breite={larg} glow={glow} opak={opak} strich={strich} pose={pose} />);
    }
    const cab = s.cabeca ?? (i === 0 && modo === 'bahn' && !p.projetil ? {} : null);
    if (cab && ts > 0 && ts < T.fim - 0.1 && (cab.ate === undefined || tl < z(cab.ate))) ov.push(<Leuchtpunkt key={'cb' + i} pose={pose} pos={mundo(T, ts)} px={cab.px ?? 44} farbe={corC(cab.cor, 'signal')} />);
  });

  // projetil 3D / disco 2D (curva principal)
  if (tr0 && p.projetil && p.projetil.tipo !== 'nenhum') {
    const pj = p.projetil, shell = mundo(tr0, tss[0]);
    if (pj.tipo === 'ponto') ov.push(<Leuchtpunkt key="pj" pose={pose} pos={shell} px={pj.px ?? 44} farbe={corC(pj.cor, 'signal')} />);
    else if (pj.tipo === 'disco') {
      const pr = proj(shell), r = pj.raio_px ? pj.raio_px[0] + (pj.raio_px[1] - pj.raio_px[0]) * fase(tl, 0, d) : 6;
      if (pr.sichtbar) ui.push(<div key="pj" style={{position: 'absolute', left: pr.x - r, top: pr.y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', background: pj.cor ?? '#0a0b0d',
        boxShadow: '0 0 7px rgba(8,8,10,0.9)', opacity: 0.55 + 0.45 * fase(tl, 0, 1.2)}} />);
    } else {
      const sk = pj.escala ?? pxZuWelt(pose, shell, pj.px ?? 60) / 1.05;
      ov.push(<Granate key="pj" pos={shell} richtung={rumo(tr0, tss[0])} skala={sk} drall={pj.giro !== undefined ? tss[0] * pj.giro : 0} sonne={sunW} />);
    }
  }

  // HUD de telemetria
  if (tr0 && p.hud !== false) {
    const h = p.hud ?? {};
    const hi = ci(h.curva), T = tracks[hi], a = amostra(T, tss[hi]);
    const unid = h.h_unid ?? 'auto';
    const val = (k: any): [string, string, string?] => {
      if (Array.isArray(k)) return [k[0], tpl(k[1], hi), k[2] ? corH(k[2]) : undefined];
      switch (k) {
        case 't': return ['t', `${nf(a.t, 1)} s`];
        case 'h': return ['h', (unid === 'km' || (unid === 'auto' && a.h >= 10000)) ? `${nf(a.h / 1000, 1)} km` : `${nf(Math.round(a.h))} m`];
        case 'x': return ['x', `${nf(a.x / 1000, 1)} km`];
        case 'v': return ['v', `${nf(Math.round(a.v))} m/s`];
        case 'mach': return ['Mach', nf(a.mach, 2)];
        case 'ang': return ['∠', `${nf(a.ang, 1)}°`];
        default: return [String(k), '?'];
      }
    };
    ui.push(<SchussHud key="hud" t={tl} em={z(h.em, 0.1)} ate={h.ate !== undefined ? z(h.ate) : undefined} zeilen={(h.linhas ?? ['t', 'h', 'v', 'mach']).map(val)} titel={h.titulo} x={h.x} y={h.y} breite={h.largura} />);
  }

  // eventos prontos
  (p.eventos ?? (tr0 && modo === 'bahn' ? [{tipo: 'impacto'}] : [])).forEach((ev: any, j: number) => {
    const i = ci(ev.curva), T = tracks[i]; if (!T) return;
    if (ev.tipo === 'impacto') {
      const em = ev.em !== undefined ? z(ev.em) : tDeTs(i, T.fim - 1e-3);
      const a = tl - em; if (a < 0) return;
      const base = ancora('alvo', i), up = oben(base);
      const raio = ev.raio ?? 520, dur = ev.dur ?? 1.3;
      const ro = (1 - fase(a, 0.4, dur + 0.4)) * fase(a, 0, 0.1);
      if (ro > 0.01) ov.push(<Kreis key={'ev' + j + 'k'} mitte={base.clone().addScaledVector(up, 12)} radius={40 + raio * fase(a, 0, dur)} breite={4} farbe={FARBE.signal} opak={ro} glow={1} pose={pose} />);
      ov.push(<Leuchtpunkt key={'ev' + j + 'g'} pose={pose} pos={base.clone().addScaledVector(up, 30)} px={90 * (1 - fase(a, 0, 1.5)) + 26} staerke={1.1 * (1 - 0.5 * fase(a, 0, 1.5))} farbe={FARBE.signal} />);
      const fl = 0.12 * (1 - fase(a, 0, 0.4)) * fase(a, 0, 0.2);
      if (ev.flash !== false && fl > 0.001) ui.push(<div key={'ev' + j + 'f'} style={{position: 'absolute', inset: 0, background: `rgba(255,240,210,${fl})`}} />);
      if (ev.rotulo) ui.push(<Marke key={'ev' + j + 'm'} at={proj(base.clone().addScaledVector(up, 20))} t={tl} em={em + 0.2} titel={tpl(ev.rotulo, i)} unter={ev.sub ? tpl(ev.sub, i) : undefined}
        cor={corH(ev.cor, 'papier')} dx={ev.dx ?? -90} dy={ev.dy ?? -130} align={ev.align ?? 'rechts'} />);
    } else if (ev.tipo === 'apogeu') {
      const em = ev.em !== undefined ? z(ev.em) : tDeTs(i, T.tApogeu);
      const pa = proj(mundo(T, T.tApogeu));
      ov.push(<Leuchtpunkt key={'ev' + j + 'p'} pose={pose} pos={mundo(T, T.tApogeu)} px={ev.px ?? 26} farbe={corC(ev.cor, 'signal')} staerke={sichtbar(tl, em, 0.4)} />);
      if (ev.rotulo) ui.push(<Marke key={'ev' + j + 'm'} at={pa} t={tl} em={em} titel={tpl(ev.rotulo, i)} unter={ev.sub ? tpl(ev.sub, i) : undefined} cor={corH(ev.cor, 'papier')} dx={ev.dx ?? 40} dy={ev.dy ?? -70} align={ev.align} />);
    }
  });

  // camadas livres
  (p.camadas ?? []).forEach((it: any, j: number) => {
    const f = CAMADAS[it.tipo];
    if (!f) { ui.push(<div key={'x' + j} style={{position: 'absolute', left: 40, top: 40 + 40 * j, color: C.rot, fontFamily: F.mono, fontSize: 24}}>camada desconhecida: {String(it.tipo)}</div>); return; }
    add(f(ctx, it, 'c' + j));
  });

  if (p.fonte) ui.push(<Quelle key="fonte" t={tl} em={z(p.fonte_em, 0.3)} text={tpl(p.fonte)} />);
  const pacotes = p.detalhes ?? [];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <GWelt pose={pose} datum={datum} look={look} overlay={<><ErdVerdecker />{ov}</>}>
        <Terra europa={p.europa ?? true} pacotes={pacotes} sonneWelt={sunW} hell={p.brilho_terra ?? 1.45} relief={p.relevo ?? 1} alpha={p.alpha_detalhe ?? 1} envelhece={p.envelhece ?? 1} />
      </GWelt>
      {ui}
    </AbsoluteFill>
  );
};

const orbitaPos = (ziel: THREE.Vector3, o: {dist: number; elev: number; az: number}, ref: Ctx['ref']) => {
  const ax = lokalAchsen(ziel), el = o.elev * K, azr = o.az * K;
  const hor = ax.nord.clone().multiplyScalar(Math.cos(azr)).addScaledVector(ax.ost, Math.sin(azr));
  return ziel.clone().addScaledVector(hor, o.dist * Math.cos(el)).addScaledVector(ax.up, o.dist * Math.sin(el));
};

// camera padrao bonita: lateral, a meia distancia, com leve deriva
const padraoCamera = (p: any, tr: Track | undefined, modo: string) => {
  if (modo === 'globus' || !tr) {
    const alvo = p.alvo ?? p.origem ?? {lat: 0, lon: 0, h: 0};
    return [
      {t: 0, alvo, orbita: {dist: 1.6e7, elev: 70, az: 200}, fov: 30},
      {t: 1.4, alvo, orbita: {dist: 2.2e6, elev: 55, az: 208}, fov: 34},
      {t: 3.5, alvo, orbita: {dist: 6e4, elev: 36, az: 218}, fov: 42},
      {t: 6, alvo, orbita: {dist: 2.5e4, elev: 33, az: 220}, fov: 42},
    ];
  }
  const L = Math.max(2000, tr.x[tr.n - 1]);
  return [
    {t: 0, pos: {ancora: 'meio', lado: 1.5 * L, alto: 0.3 * L + 0.4 * tr.hApogeu, frente: 0.15 * L}, alvo: {ancora: 'meio', alto: 0.45 * tr.hApogeu}, fov: 40},
    {t: 6, pos: {ancora: 'meio', lado: 1.3 * L, alto: 0.25 * L + 0.4 * tr.hApogeu, frente: -0.1 * L}, alvo: {ancora: 'meio', alto: 0.45 * tr.hApogeu}, fov: 40},
  ];
};

export const Motor: React.FC<KitProps<any> & {modo: 'bahn' | 'globus'}> = ({t, d, b, p, modo}) => {
  const specs: CurvaSpec[] = (p.curvas ?? (p.curva ? [p.curva] : []));
  const arqs = Array.from(new Set([...arquivosDe(specs), ...(p.camadas ?? []).filter((c: any) => c.arquivo).map((c: any) => c.arquivo as string)]));
  const js = useJsons(arqs);
  if (!js) return <AbsoluteFill style={{background: '#000'}} />;
  const jsons: Record<string, any> = {};
  arqs.forEach((a, i) => { jsons[a] = js[i]; });
  return <Cena p={p} t={t} d={d} b={b} jsons={jsons} modo={modo} />;
};
