// Kit welt · camadas de Bahn/Globus: cada item de `camadas` ({tipo, ...}) vira elementos da camada 3D (overlay, sem iluminacao, cores exatas da UI)
// e/ou da camada HTML (ui). Todos os tempos (em, ate, ...) aceitam numero ou {wort, nach, plus}.
import React from 'react';
import * as THREE from 'three';
import {C, F, fase, sichtbar} from '../../ui/basis';
import {Marke} from '../../welt/g_ui';
import {Lineal, Plakette, Ziel} from '../../welt/g2_ui';
import {BahnLinie as _unused, FARBE, Granate, Leuchtpunkt, Linie} from '../../welt/g2_bahn';
import {Kreis, Pfeil, Rauchdecke} from '../../welt/g2_teile';
import {geodaetisch, welt, oben} from '../../welt/g2_geo';
import {Ctx, corC, corH} from './ctx';
import {amostra, destino, mundo, rumo, tsNoArco} from './curva';
import {Energia, Espectro, GraficoVt, Texto} from './widgets';
void _unused;

export type Saida = {ov?: React.ReactNode; ui?: React.ReactNode};
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const vis = (c: Ctx, it: any, dur = 0.4) => sichtbar(c.tl, c.z(it.em, 0), dur, it.ate !== undefined ? c.z(it.ate) : undefined);
const txt = (c: Ctx, s: any, ci = 0) => (typeof s === 'string' ? c.tpl(s, ci) : s);

// ---- helpers geometricos ----------------------------------------------------------------------------
const interp = (arr: number[], f: number) => { const x = Math.max(0, Math.min(1, f)) * (arr.length - 1), i = Math.min(arr.length - 2, Math.floor(x)); return arr[i] + (arr[i + 1] - arr[i]) * (x - i); };
const poligono = (c: Ctx, it: any): {lat: number; lon: number}[] => {
  if (it.pontos) return it.pontos;
  if (it.circulo) {
    const {lat, lon, raio_km} = it.circulo; const pts: {lat: number; lon: number}[] = [];
    for (let i = 0; i < 96; i++) { const [la, lo] = destino(lat, lon, (i / 96) * 360, raio_km * 1000); pts.push({lat: la, lon: lo}); }
    return pts;
  }
  if (it.arquivo) {
    const j = c.jsons[it.arquivo];
    let fs: any[] = j.features ?? [j];
    if (it.filtro) fs = fs.filter((f) => Object.entries(it.filtro).every(([k, v]) => f.properties?.[k] === v));
    const g = fs[0]?.geometry;
    if (!g) return [];
    const ring = g.type === 'MultiPolygon' ? g.coordinates[0][0] : g.coordinates[0];
    return ring.map(([lo, la]: number[]) => ({lat: la, lon: lo}));
  }
  return [];
};

// ---- camadas ------------------------------------------------------------------------------------------
export const CAMADAS: Record<string, (c: Ctx, it: any, k: string) => Saida> = {
  // rotulo com ponto e fio
  marca: (c, it, k) => ({ui: <Marke key={k} at={c.proj(c.ref(it.pos))} t={c.tl} em={c.z(it.em)} ate={it.ate !== undefined ? c.z(it.ate) : undefined} titel={txt(c, it.titulo ?? '')} unter={txt(c, it.sub)}
    cor={corH(it.cor, 'papier')} dx={it.dx} dy={it.dy} punkt={it.ponto} groesse={it.tam} align={it.align} />}),
  // mira circular que se fecha + rotulo
  alvo: (c, it, k) => ({ui: <Ziel key={k} at={c.proj(c.ref(it.pos, 'alvo'))} t={c.tl} em={c.z(it.em)} ate={it.ate !== undefined ? c.z(it.ate) : undefined} titel={txt(c, it.titulo ?? '')} unter={txt(c, it.sub)}
    cor={corH(it.cor, 'signal')} r0={it.r0} r1={it.r1} dx={it.dx} dy={it.dy} />}),
  // ponto luminoso (um Ref, uma lista [{lat,lon,h}] ou um geojson de pontos)
  ponto: (c, it, k) => {
    const o = vis(c, it); if (o < 0.01) return {};
    let ps: V3x[] = [];
    if (it.lista) ps = it.lista.map((r: any) => c.ref(r));
    else if (it.arquivo) ps = (c.jsons[it.arquivo].features ?? []).filter((f: any) => f.geometry?.type === 'Point').map((f: any) => welt(f.geometry.coordinates[1], f.geometry.coordinates[0], it.h ?? 0));
    else ps = [c.ref(it.pos)];
    const cor = corC(it.cor, 'signal');
    return {ov: <React.Fragment key={k}>{ps.map((p, i) => <Leuchtpunkt key={i} pose={c.pose} pos={p} px={it.px ?? 40} farbe={cor} kern={it.nucleo} staerke={(it.forca ?? 1) * o} />)}</React.Fragment>};
  },
  // linha 3D: pts [Ref...] ou de -> para (interpolada na superficie), com arco parabolico, perfil de alturas, tracejado, crescendo
  linha: (c, it, k) => {
    const o = vis(c, it, 0.3) * (it.opak ?? 1); if (o < 0.01) return {};
    let pts: V3x[] = [];
    if (it.pts) pts = it.pts.map((r: any) => c.ref(r));
    else {
      const A = geodaetisch(c.ref(it.de, 'origem')), B = geodaetisch(c.ref(it.para, 'alvo'));
      const n = it.n ?? 40, ate = it.crescer ? fase(c.tl, c.z(it.crescer[0]), c.z(it.crescer[1])) : 1;
      for (let i = 0; i <= n; i++) {
        const f = (i / n) * ate;
        const h = (it.alturas ? interp(it.alturas, f) : A.h + (B.h - A.h) * f) + (it.alto ?? 0) + (it.arco ? 4 * it.arco * f * (1 - f) : 0);
        pts.push(welt(A.lat + (B.lat - A.lat) * f, A.lon + (B.lon - A.lon) * f, h));
      }
    }
    if (pts.length < 2) return {};
    return {ov: <Linie key={k} pts={pts} farbe={corC(it.cor, 'papier')} breite={it.largura ?? 4} glow={it.brilho ?? 1} strich={it.tracejado} opak={o} pose={c.pose} />};
  },
  // circulo(s) que crescem e somem: onda de impacto, anel de som que sobe
  anel: (c, it, k) => {
    const n = it.n ?? 1, cada = it.cada ?? 0.4, vida = it.vida ?? 2, em = c.z(it.em);
    const out: React.ReactNode[] = [];
    for (let i = 0; i < n; i++) {
      const a = c.tl - (em + i * cada);
      if (a < 0 || a > vida) continue;
      const o = (it.opak ?? 0.95) * fase(a, 0, 0.2) * Math.max(0, 1 - a / vida);
      const base = c.ref(it.centro, 'alvo');
      const up = oben(base), h = (it.alto ?? 0) + (it.sobe ?? 0) * a;
      if (it.ate_proj) { const pj = c.ref('proj'); if (pj.clone().sub(base).dot(up) < h + (it.folga ?? 60)) continue; }
      if (o < 0.01) continue;
      out.push(<Kreis key={i} mitte={base.clone().addScaledVector(up, h)} radius={(it.raio ?? 100) + (it.vr ?? 0) * a} breite={it.largura ?? 4} farbe={corC(it.cor, 'cyan')} opak={o} glow={it.brilho ?? 1.1} pose={c.pose} />);
    }
    return {ov: <React.Fragment key={k}>{out}</React.Fragment>};
  },
  // frentes de onda de som que correm adiante do projetil ao longo da curva
  onda_som: (c, it, k) => {
    const tr = c.tracks[c.ci(it.curva)], ts = c.tss[c.ci(it.curva)];
    if (!tr) return {};
    const cs = it.c ?? 343, cada = it.cada ?? 4, ate = it.ate_ts ?? tr.fim, out: React.ReactNode[] = [];
    for (let e = 0; e <= ate + 1e-6; e += cada) {
      if (ts < e) continue;
      const tsr = tsNoArco(tr, cs * (ts - e));
      const o = Math.max(0, Math.min(1, 1 - (tsr - (tr.fim - 3)) / 3)) * Math.min(1, (ts - e) / 0.4);
      if (o < 0.02 || tsr >= tr.fim - 0.2) continue;
      out.push(<Kreis key={e} mitte={mundo(tr, tsr)} normal={rumo(tr, tsr)} radius={it.raio ?? 330} breite={it.largura ?? 3.6} farbe={corC(it.cor, 'cyan')} opak={(it.opak ?? 0.95) * o} glow={1} pose={c.pose} />);
    }
    return {ov: <React.Fragment key={k}>{out}</React.Fragment>};
  },
  // seta a partir do projetil (velocidade, horizontal, gravidade, vertical) com comprimento em px e rotulo opcional
  vetor: (c, it, k) => {
    const ci = c.ci(it.curva), tr = c.tracks[ci]; if (!tr) return {};
    const o = vis(c, it, it.dur ?? 0.6); if (o < 0.01) return {};
    const ts = c.tss[ci], shell = it.de ? c.ref(it.de) : mundo(tr, ts), D = c.dirs(shell), a = amostra(tr, ts);
    const dir = it.direcao === 'velocidade' ? rumo(tr, ts) : it.direcao === 'gravidade' ? D.alto.clone().multiplyScalar(-1) : it.direcao === 'vertical' ? D.alto : D.frente;
    const L = c.pxW(shell, it.comp_px ?? 150) * (it.v_ref ? a.v / it.v_ref : 1);
    const von = shell.clone().addScaledVector(dir, c.pxW(shell, it.inicio_px ?? 0)), nach = shell.clone().addScaledVector(dir, L);
    const rot = it.rotulo;
    const pt = c.proj(rot?.ref === 'proj' ? shell : nach);
    return {
      ov: <Pfeil key={k} von={von} nach={nach} farbe={corC(it.cor, 'signal')} breite={it.largura ?? 5} glow={it.brilho ?? 0.8} kopf={it.kopf ?? 0.15} ebene={D.lado} opak={o} pose={c.pose} />,
      ui: rot ? <Texto key={k} x={pt.x + (rot.dx ?? 26)} y={pt.y + (rot.dy ?? 0)} t={c.tl} em={c.z(rot.em ?? it.em)} cor={corH(rot.cor ?? it.cor, 'signal')} tam={rot.tam ?? 32} fonte={rot.fonte ?? 'mono'} tafel={rot.tafel ?? true}
        anker={rot.anker}>{txt(c, rot.texto, ci)}</Texto> : undefined,
    };
  },
  // regua 2D entre dois pontos (massband com tracos nas pontas)
  regua: (c, it, k) => ({ui: <Lineal key={k} a={c.proj(c.ref(it.de, 'origem'))} b={c.proj(c.ref(it.para, 'alvo'))} t={c.tl} em={c.z(it.em)} ate={it.ate !== undefined ? c.z(it.ate) : undefined}
    text={txt(c, it.texto ?? '')} cor={corH(it.cor, 'papier')} versatz={it.deslocamento ?? 34} groesse={it.tam ?? 40} anteil={it.anteil} />}),
  // regua vertical de altura sob o projetil, com marcas e plano de referencia do ponto de partida
  regua_h: (c, it, k) => {
    const ci = c.ci(it.curva), tr = c.tracks[ci]; if (!tr) return {};
    const ts = c.tss[ci], shell = mundo(tr, ts), D = c.dirs(shell), a = amostra(tr, ts);
    const o = fase(c.tl, c.z(it.em), c.z(it.em) + (it.dur ?? 0.8)); if (o < 0.01) return {};
    const basis = shell.clone().addScaledVector(D.alto, -a.h);
    const pl = it.plano ?? [-7400, 3600], tl2 = it.tick_larg ?? 90, cor = corC(it.cor, 'signal');
    const ticks: number[] = it.ticks ?? [];
    const pB = c.proj(basis), pS = c.proj(shell);
    const rot = it.rotulo;
    return {
      ov: <React.Fragment key={k}>
        {pl && <Linie pts={[basis.clone().addScaledVector(D.frente, pl[0]), basis.clone().addScaledVector(D.frente, pl[1])]} farbe={corC(it.cor_plano, 'grau')} breite={1.8} strich={[160, 120]} opak={0.8 * o} pose={c.pose} />}
        <Linie pts={[basis, shell]} farbe={cor} breite={3} opak={o} glow={0.6} pose={c.pose} />
        {ticks.map((h) => <Linie key={h} pts={[basis.clone().addScaledVector(D.alto, h).addScaledVector(D.frente, -tl2), basis.clone().addScaledVector(D.alto, h).addScaledVector(D.frente, tl2)]} farbe={cor} breite={3} opak={o} pose={c.pose} />)}
      </React.Fragment>,
      ui: rot ? <Texto key={k} x={(pB.x + pS.x) / 2 + (rot.dx ?? 28)} y={(pB.y + pS.y) / 2 + (rot.dy ?? 0)} t={c.tl} em={c.z(rot.em ?? it.em)} cor={corH(rot.cor ?? it.cor, 'signal')} tam={rot.tam ?? 42} tafel={rot.tafel ?? true}>{txt(c, rot.texto, ci)}</Texto> : undefined,
    };
  },
  // angulo de impacto: linha do chao, caminho final tracejado, arco com o valor e (opcional) projetil proximo
  angulo: (c, it, k) => {
    const ci = c.ci(it.curva), tr = c.tracks[ci]; if (!tr) return {};
    const imp = c.ref(it.pos, 'alvo'), D = c.dirs(imp);
    const graus = it.graus ?? Math.abs(amostra(tr, tr.fim).ang), th = (graus * Math.PI) / 180, R = it.raio ?? 620;
    const e1 = D.frente.clone().multiplyScalar(-1), e2 = D.alto;
    const dirR = e1.clone().multiplyScalar(Math.cos(th)).addScaledVector(e2, Math.sin(th));
    const kk = fase(c.tl, c.z(it.em_arco ?? c.z(it.em) + 0.7), c.z(it.em_arco ?? c.z(it.em) + 0.7) + 0.8);
    const arc: V3x[] = [];
    for (let i = 0; i <= 40; i++) { const a = th * (i / 40) * kk; arc.push(imp.clone().addScaledVector(e1, Math.cos(a) * R).addScaledVector(e2, Math.sin(a) * R)); }
    const aMid = th * 0.5 * kk, pw = c.proj(imp.clone().addScaledVector(e1, Math.cos(aMid) * (R + 130)).addScaledVector(e2, Math.sin(aMid) * (R + 130)));
    const em = c.z(it.em);
    const [g0, g1] = it.solo ?? [1700, -500], cam = it.caminho ?? 1900;
    return {
      ov: <React.Fragment key={k}>
        <Linie pts={[imp.clone().addScaledVector(e1, g0), imp.clone().addScaledVector(e1, g1)]} farbe={FARBE.papier} breite={3.4} glow={0.7} opak={fase(c.tl, em - 0.4, em + 0.2)} pose={c.pose} />
        <Linie pts={[imp.clone(), imp.clone().addScaledVector(dirR, cam)]} farbe={FARBE.orange} breite={3.4} strich={[60, 45]} opak={fase(c.tl, em - 0.2, em + 0.4)} pose={c.pose} />
        {arc.length > 1 && <Linie pts={arc} farbe={FARBE.signal} breite={5} glow={1} pose={c.pose} />}
        {it.projetil_dist && <Granate pos={imp.clone().addScaledVector(dirR, it.projetil_dist)} richtung={dirR.clone().multiplyScalar(-1)} skala={it.projetil_escala ?? 46} sonne={c.sun} />}
        <Leuchtpunkt pose={c.pose} pos={imp} px={30} farbe={FARBE.signal} />
      </React.Fragment>,
      ui: <Texto key={k} x={pw.x + 24} y={pw.y} t={c.tl} em={em + 0.7} cor={C.signal} tam={64} fonte="titulo" tafel>{txt(c, it.texto ?? '{ang|1}°', ci)}</Texto>,
    };
  },
  // texto livre (px) ou ancorado em um ponto
  texto: (c, it, k) => {
    const p = it.pos ? c.proj(c.ref(it.pos)) : {x: 0, y: 0, sichtbar: true};
    if (it.pos && !p.sichtbar) return {};
    return {ui: <Texto key={k} x={(it.x ?? 0) + p.x + (it.dx ?? 0)} y={(it.y ?? 0) + p.y + (it.dy ?? 0)} t={c.tl} em={c.z(it.em)} ate={it.ate !== undefined ? c.z(it.ate) : undefined} cor={corH(it.cor, 'papier')}
      tam={it.tam} fonte={it.fonte} peso={it.peso} espaco={it.espaco} anker={it.anker} tafel={it.tafel} sombra={it.sombra} opaco={it.opaco}>{txt(c, it.texto ?? '')}</Texto>};
  },
  plaqueta: (c, it, k) => ({ui: <Plakette key={k} t={c.tl} em={c.z(it.em)} ate={it.ate !== undefined ? c.z(it.ate) : undefined} text={txt(c, it.texto ?? '')} unter={txt(c, it.sub)} x={it.x} y={it.y} cor={corH(it.cor, 'signal')} />}),
  energia: (c, it, k) => ({ui: <Energia key={k} t={c.tl} em={c.z(it.em)} ate={it.ate !== undefined ? c.z(it.ate) : undefined} de={it.de} para={it.para} fa={c.z(it.fa)} fe={c.z(it.fe)} rotulo_de={it.rotulo_de}
    unidade={it.unidade} texto_perda={txt(c, it.texto_perda)} x={it.x} y={it.y} w={it.w} escala={it.escala} nf={c.nf} />}),
  vt: (c, it, k) => { const ci = c.ci(it.curva); const tr = c.tracks[ci]; if (!tr) return {};
    return {ui: <GraficoVt key={k} t={c.tl} em={c.z(it.em)} ate={it.ate !== undefined ? c.z(it.ate) : undefined} tr={tr} ts={c.tss[ci]} x={it.x} y={it.y} w={it.w} h={it.h} tmax={it.tmax ?? Math.ceil(tr.fim / 10) * 10}
      vmax={it.vmax ?? Math.ceil((Math.max(...tr.v) * 1.05) / 50) * 50} marca={it.marca} titulo={it.titulo} nf={c.nf} passo_v={it.passo_v} />}; },
  espectro: (c, it, k) => ({ui: <Espectro key={k} t={c.tl} em={c.z(it.em)} ate={it.ate !== undefined ? c.z(it.ate) : undefined} amp={Math.pow(fase(c.tl, 0, it.cresce ?? 3.0), 1.4)} pfeif={fase(c.tl, 0, c.d)}
    titulo={it.titulo} eixo={it.eixo} x={it.x} y={it.y} w={it.w} h={it.h} />}),
  fumaca: (c, it, k) => ({ov: <Rauchdecke key={k} mitte={c.ref(it.centro, 'alvo')} hoehe={it.alto ?? 650} radius={it.raio ?? 7000} glut={c.ref(it.brasa)} zeit={c.tl * (it.vento ?? 0.6)} dichte={it.densidade ?? 0.62} opak={vis(c, it, 0.6)} />}),
  flash: (c, it, k) => {
    const a = c.tl - c.z(it.em), dur = it.dur ?? 0.4; if (a < 0 || a > dur) return {};
    const f = (it.forca ?? 0.12) * (1 - fase(a, 0, dur)) * fase(a, 0, 0.2);
    return {ui: <div key={k} style={{position: 'absolute', inset: 0, background: `rgba(${it.cor ?? '255,240,210'},${f})`}} />};
  },
  vinheta: (c, it, k) => ({ui: <div key={k} style={{position: 'absolute', inset: 0, pointerEvents: 'none', opacity: vis(c, it, 0.6),
    background: `radial-gradient(ellipse at ${it.centro ?? '50% 40%'}, rgba(0,0,0,0) ${it.de ?? 45}%, ${it.cor ?? 'rgba(4,10,26,0.55)'} 100%)`}} />}),
  // regiao destacada no globo: contorno (+ preenchimento translucido) de poligono, circulo ou geojson
  regiao: (c, it, k) => {
    const o = vis(c, it, 0.8); if (o < 0.01) return {};
    const poly = poligono(c, it); if (poly.length < 3) return {};
    const alto = it.alto ?? 500, cor = corC(it.cor, 'signal'), n = poly.length;
    const loop = [...poly, poly[0]].map((p) => welt(p.lat, p.lon, alto));
    const R = 8, cl = poly.reduce((s, p) => s + p.lat, 0) / n, co = poly.reduce((s, p) => s + p.lon, 0) / n;
    const fill = it.preenche ?? 0.18;
    let malha: React.ReactNode = null;
    if (fill > 0) {
      const pos: number[] = [], idx: number[] = [];
      const v0 = welt(cl, co, alto);
      pos.push(v0.x, v0.y, v0.z);
      for (let r = 1; r <= R; r++) for (let i = 0; i < n; i++) { const q = welt(cl + (poly[i].lat - cl) * (r / R), co + (poly[i].lon - co) * (r / R), alto); pos.push(q.x, q.y, q.z); }
      const id = (r: number, i: number) => 1 + (r - 1) * n + (i % n);
      for (let i = 0; i < n; i++) idx.push(0, id(1, i), id(1, i + 1));
      for (let r = 1; r < R; r++) for (let i = 0; i < n; i++) idx.push(id(r, i), id(r + 1, i), id(r + 1, i + 1), id(r, i), id(r + 1, i + 1), id(r, i + 1));
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      const m = new THREE.MeshBasicMaterial({color: cor, transparent: true, opacity: fill * o, depthWrite: false, side: THREE.DoubleSide});
      malha = <mesh geometry={g} material={m} frustumCulled={false} />;
    }
    return {ov: <React.Fragment key={k}>{malha}<Linie pts={loop} farbe={cor} breite={it.largura ?? 3} glow={it.brilho ?? 1} opak={o} pose={c.pose} /></React.Fragment>};
  },
};
type V3x = THREE.Vector3;
