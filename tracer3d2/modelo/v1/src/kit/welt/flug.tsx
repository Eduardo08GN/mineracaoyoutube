// Kit welt · Flug: voo sobre terreno real (satelite/ortofoto + relevo de public/) com rotulos, pontos, arcos e vetores sobrepostos.
// Tudo funcao pura de (t, props). Camera por keyframes {t, pos, alvo, fov} com pontos em lat/lon/h (ou leste/norte/h em metros a partir do centro do pacote).
// Atmosfera, luz e Look por props `luz` (preset + overrides); pacote de terreno por nome ('loncin', 'regiao') ou objeto (ver API.md).
import React, {useEffect, useMemo, useState} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, continueRender, delayRender} from 'remotion';
import {HIMMEL_TAG} from '../../welt/f_szene';
import {BildAcab} from '../acabamento';
import type {Clima, NivelAcab} from '../acabamento';
import {Bogen3} from '../../welt/f_region';
import {Blende, Kopf, Legende, Quelle} from '../../welt/f_ui';
import {Marke, Fussnote} from '../../welt/t_etiketten';
import {GMat, fahrt, geloendeMaterial, useTex, wackel} from '../../welt/f_gelaende';
import {Bounds, GEBIETE, Hoehenfeld, Rahmen, gelaendeGeometrie, hoeheBei, lies, rahmen, useHoehenfeld, zuSzene} from '../../welt/t_gelaende';
import {KamDef} from '../../welt/t_szene';
import {C, F, fase, sichtbar} from '../../ui/basis';
import {Perfil} from '../../look/Look';
import {KitProps, zeit} from '../tipos';
import {useJsons} from './curva';
import {Texto} from './widgets';

// ---- pacotes de terreno ---------------------------------------------------------------------------------------
export type PacoteT = {
  id: string; bounds: Bounds; zentrum: {lat: number; lon: number}; hmin: number; hmax: number; hoehe: string; farbe: string; farbeMax?: number;
  hbase?: number; near?: number; far?: number; seg?: number; texG?: number;
  nah?: {farbe: string; raio_m: number; seg?: number};          // malha fina central (ex.: ortofoto de 0,5 m)
  variantes?: Record<string, {farbe: string; nah?: string}>;  // ex.: '1914', '2021', '2021sc'
  mat?: GMat;
};
export const PACOTES_T: Record<string, PacoteT> = {
  loncin: {
    id: 'loncin', bounds: {west: 5.463998, east: 5.520762, south: 50.656574, north: 50.692546}, zentrum: {lat: 50.67456, lon: 5.49238}, hmin: 138.5, hmax: 192.10000610351562,
    hoehe: 'geo/loncin_hoehe_rg.png', farbe: 'f/loncin_2021_semcasas_full.jpg', farbeMax: 4096, hbase: 168, near: 1, far: 60000, seg: 300, texG: 4096,
    nah: {farbe: 'f/loncin_2021_semcasas_nah.jpg', raio_m: 1000, seg: 560},
    variantes: {'1914': {farbe: 'f/loncin_1914_full.jpg', nah: 'f/loncin_1914_nah.jpg'}, '2021': {farbe: 'f/loncin_2021_full.jpg', nah: 'f/loncin_2021_nah.jpg'},
      '2021sc': {farbe: 'f/loncin_2021_semcasas_full.jpg', nah: 'f/loncin_2021_semcasas_nah.jpg'}},
    mat: {alt: 0.9, hell: 0.75},
  },
  regiao: {
    id: 'regiao', bounds: {west: 5.3, east: 6.0, south: 50.42808, north: 50.87192}, zentrum: {lat: 50.65, lon: 5.65}, hmin: 9.5, hmax: 598.0999755859375,
    hoehe: 'geo/regiao_hoehe_rg.png', farbe: 'geo/regiao_satellit_2017.jpg', farbeMax: 8192, hbase: 0, near: 20, far: 200000, seg: 768, texG: 8192,
    mat: {alt: 0.7, hell: 0.9, detail: 0},
  },
};
const registra = (s: PacoteT) => {
  (GEBIETE as any)['kit_' + s.id] = {bounds: s.bounds, zentrum: s.zentrum, hmin: s.hmin, hmax: s.hmax, hoehe: s.hoehe, farbe: s.farbe, farbeMax: s.farbeMax ?? 4096};
  return 'kit_' + s.id;
};
// pacotes de terreno do video ficam em DADOS (cenas/pacotes.json), nao em codigo: o batedor de dados so acrescenta entradas
import PACOTES_VIDEO from '../../cenas/pacotes.json';
const pacoteDe = (x: any): PacoteT => (typeof x === 'string' ? (PACOTES_T[x] ?? (PACOTES_VIDEO as any)[x]) : {...x});

// carregamento sincrono fora do canvas (delayRender): campo de alturas
const useCampo = (gid: string): Hoehenfeld | null => {
  const [, setN] = useState(0);
  let pronto: Hoehenfeld | null = null, prom: Promise<any> | null = null;
  try { pronto = useHoehenfeld(gid as any); } catch (e: any) { if (e && typeof e.then === 'function') prom = e; else throw e; }
  const [h] = useState(() => (prom ? delayRender('campo ' + gid) : null));
  useEffect(() => {
    if (!prom) return;
    prom.then(() => { setN((n) => n + 1); if (h !== null) continueRender(h); }, () => { if (h !== null) continueRender(h); });
  }, [!!prom, gid]);
  return pronto;
};

// ---- malha de terreno generica (copia generalizada de FGelaende) ---------------------------------------------------
const Malha: React.FC<{gid: string; r: Rahmen; farbe: string; seg: number; aus?: Bounds; texG: number; mat: GMat; offsetY?: number; uvRep?: [number, number]; uvOff?: [number, number]}> =
  ({gid, r, farbe, seg, aus, texG, mat, offsetY = 0, uvRep, uvOff}) => {
    const f = useHoehenfeld(gid as any);
    const tex0 = useTex(farbe, texG);
    const tex = useMemo(() => { if (!uvRep) return tex0; const t = tex0.clone(); t.repeat.set(...uvRep); t.offset.set(...(uvOff ?? [0, 0])); t.needsUpdate = true; return t; }, [tex0, uvRep, uvOff]);
    const rk = `${r.lat0},${r.lon0},${r.ueb},${r.hBasis}`;
    const geo = useMemo(() => {
      const g = gelaendeGeometrie(f as Hoehenfeld, r, seg, aus, null);
      if (offsetY) g.translate(0, offsetY, 0);
      return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [f, rk, seg, aus?.west, aus?.east, aus?.south, aus?.north, offsetY]);
    const m = useMemo(() => geloendeMaterial(tex, mat), [tex]);
    const u = m.userData.u;
    u.uAlt.value = mat.alt ?? 0.6; u.uHell.value = mat.hell ?? 1; u.uTon.value.set(mat.ton ?? '#ffffff'); u.uDetail.value = mat.detail ?? 1; u.uFort.value = 0;
    u.uLochAn.value = mat.loch ? 1 : 0; if (mat.loch) u.uLoch.value.set(...mat.loch);
    m.clippingPlanes = null;
    React.useEffect(() => () => geo.dispose(), [geo]);
    return <mesh geometry={geo} material={m} />;
  };

// ---- luz/atmosfera: presets ------------------------------------------------------------------------------------------
type Luz = {sol?: {azimute?: number; altura?: number; forca?: number; cor?: string} | null; ceu?: any; hemi?: [string, string, number]; env?: number;
  nevoa?: {cor: string; alcance_km?: number; densidade?: number; max?: number}; look?: any};
export const LUZES: Record<string, Luz> = {
  dia: {sol: {azimute: 150, altura: 48, forca: 3.2, cor: '#ffe6c4'}, ceu: HIMMEL_TAG, nevoa: {cor: '#b5bfc6', alcance_km: 20, max: 0.85}, look: {bloom: 0.35, limiar: 0.9, vinheta: 0.5, saturacao: -0.1, contraste: 0.06}},
  tarde_cinza: {sol: {azimute: 235, altura: 36, forca: 2.6, cor: '#ffe6c4'}, ceu: {...HIMMEL_TAG, zenit: '#55616e', horizont: '#a9afb0'}, nevoa: {cor: '#a3aaae', alcance_km: 9, max: 0.92},
    look: {bloom: 0.3, limiar: 0.9, vinheta: 0.62, saturacao: -0.35, contraste: 0.1, brilho: -0.05}},
  frio_azul: {sol: {azimute: 210, altura: 22, forca: 2.2, cor: '#d9e4ee'}, ceu: {zenit: '#364354', horizont: '#7e8d9e', boden: '#2a323c', sonne: [0.4, 0.3, 0.5], hof: 0.3}, hemi: ['#7f93a8', '#232b33', 0.8],
    nevoa: {cor: '#6f8093', alcance_km: 38, max: 0.9}, look: {bloom: 0.5, limiar: 0.8, vinheta: 0.65, saturacao: -0.4, contraste: 0.14}},
  tarde_quente: {sol: {azimute: 230, altura: 30, forca: 2.6, cor: '#ffe2bd'}, ceu: {zenit: '#4a5b70', horizont: '#9aa4a8', boden: '#2d3238', sonne: [0.5, 0.4, 0.4], hof: 0.5},
    nevoa: {cor: '#8e9ca6', alcance_km: 18, max: 0.9}, look: {bloom: 0.45, limiar: 0.85, vinheta: 0.6, saturacao: -0.3, contraste: 0.12}},
  entardecer: {sol: {azimute: 282, altura: 9, forca: 3.8, cor: '#ffb070'}, ceu: {zenit: '#3d4a5c', horizont: '#d49a62', boden: '#4a4033', sonne: [0.5, 0.1, 0.5], sonnenFarbe: '#ffb070', hof: 1.2}, hemi: ['#c9a98a', '#3a3128', 0.95],
    nevoa: {cor: '#b88a62', alcance_km: 12, max: 0.9}, look: {bloom: 0.55, limiar: 0.85, vinheta: 0.62, saturacao: -0.2, contraste: 0.12, raios: 0.35}},
};
const resolveLuz = (l: any = {}) => {
  const base = LUZES[l.preset ?? 'dia'] ?? LUZES.dia;
  const sol = l.sol === null ? null : {...base.sol, ...(l.sol ?? {})};
  const nev = {...base.nevoa, ...(l.nevoa ?? {})} as any;
  const lk = {...base.look, ...(l.look ?? {})};
  const perfil: Perfil = {bloom: lk.bloom, limiar: lk.limiar, saturacao: lk.saturacao, contraste: lk.contraste, brilho: lk.brilho, vinheta: lk.vinheta, raios: lk.raios, ao: lk.ao,
    nevoa: l.nevoa === null ? undefined : {cor: nev.cor, densidade: nev.densidade ?? 1 / ((nev.alcance_km ?? 20) * 1000), max: nev.max}};
  return {sonne: sol ? {azimut: sol.azimute!, hoehe: sol.altura!, staerke: sol.forca, farbe: sol.cor} : null, himmel: {...(base.ceu ?? HIMMEL_TAG), ...(l.ceu ?? {})}, hemi: (l.hemi ?? base.hemi ?? ['#8d9aa6', '#4a4a40', 0.5]) as [string, string, number],
    env: l.env ?? base.env ?? 0.35, perfil};
};

// ---- marcador luminoso ------------------------------------------------------------------------------------------------------
const HALO = (() => { let t: THREE.CanvasTexture | null = null; return () => { if (!t) { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d')!;
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.35, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); t = new THREE.CanvasTexture(c); } return t; }; })();

const Marcador: React.FC<{p: THREE.Vector3; t: number; em: number; halo: number; pulso: number; cor: string; contorno?: THREE.Vector3[]; altura: number; escuro?: string}> = ({p, t, em, halo, pulso, cor, contorno, altura, escuro = '#0b0d10'}) => {
  const o = Math.min(1, Math.max(0, (t - em) / 0.5)), pu = Math.max(0, 1 - (t - em) / 1.2);
  const hm = useMemo(() => new THREE.SpriteMaterial({map: HALO(), color: cor, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false}), [cor]);
  const dm = useMemo(() => new THREE.MeshStandardMaterial({color: escuro, roughness: 0.9, metalness: 0, emissive: '#05070a'}), [escuro]);
  const geo = useMemo(() => {
    if (!contorno || contorno.length < 3) return null;
    const sh = new THREE.Shape(contorno.map((q) => new THREE.Vector2(q.x, -q.z)));
    const g = new THREE.ExtrudeGeometry(sh, {depth: altura, bevelEnabled: false}); g.rotateX(-Math.PI / 2);
    return g;
  }, [contorno, altura]);
  if (o <= 0) return null;
  const s = halo + pulso * pu;
  return (
    <group>
      {geo ? <mesh geometry={geo} material={dm} position={[0, p.y - altura * 0.5, 0]} scale={[1, o, 1]} /> : <mesh material={dm} position={[p.x, p.y + altura * 0.25, p.z]} scale={[1, o, 1]}><cylinderGeometry args={[halo * 0.06, halo * 0.06, altura, 3]} /></mesh>}
      <sprite position={[p.x, p.y + altura * 1.5, p.z]} scale={[s, s, 1]} material={hm} />
    </group>
  );
};

// seta 3D reta (tubo + cone), crescendo
const Seta3: React.FC<{von: THREE.Vector3; bis: THREE.Vector3; wachs: number; cor: string; r: number; o?: number; cabeca?: boolean}> = ({von, bis, wachs, cor, r, o = 1, cabeca = true}) => {
  const w = Math.min(1, Math.max(0, wachs));
  const mat = useMemo(() => new THREE.MeshBasicMaterial({color: cor, transparent: true, depthWrite: false, toneMapped: false}), [cor]);
  mat.opacity = o;
  if (w < 0.001) return null;
  const dir = bis.clone().sub(von), L = dir.length(), dn = dir.clone().normalize();
  const ch = cabeca ? Math.min(L * 0.18, r * 9) : 0, corpo = Math.max(0.001, (L * w) - ch * w);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dn);
  const mid = von.clone().addScaledVector(dn, corpo / 2), tip = von.clone().addScaledVector(dn, corpo + ch * w / 2);
  return (
    <group>
      <mesh position={mid} quaternion={q} material={mat}><cylinderGeometry args={[r, r, corpo, 10]} /></mesh>
      {cabeca && <mesh position={tip} quaternion={q} material={mat}><coneGeometry args={[r * 2.8 * w, Math.max(0.001, ch * w), 14]} /></mesh>}
    </group>
  );
};

// nivel de acabamento padrao de todo Flug (props `acab.nivel` sobrepoe)
const ACAB_PADRAO: NivelAcab = 'leve';

// ---- cena ------------------------------------------------------------------------------------------------------------------
export const Flug: React.FC<KitProps<any>> = ({t, d, b, p}) => {
  const prim = pacoteDe(p.terreno?.pacote ?? p.pacote ?? 'loncin');
  const varNome = p.terreno?.variante ?? p.variante;
  const vari = varNome && prim.variantes ? prim.variantes[varNome] : undefined;
  const farbeFull = vari?.farbe ?? prim.farbe, farbeNah = vari?.nah ?? prim.nah?.farbe;
  const gid = registra(prim);
  const horizontes: PacoteT[] = (p.terreno?.horizonte ?? []).map(pacoteDe);
  const hids = horizontes.map(registra);
  const pa = p.pontos_arquivo;
  const arqs: string[] = pa ? [pa.arquivo, ...(pa.contornos ? [pa.contornos] : [])] : [];
  const js = useJsons(arqs);
  const campo = useCampo(gid);
  if (!campo || !js) return <AbsoluteFill style={{background: '#000'}} />;

  const z = (x: any, pad = 0) => zeit(b, x, pad);
  const ueb = p.ueb ?? p.terreno?.ueb ?? 1;
  const R = rahmen({lat0: prim.zentrum.lat, lon0: prim.zentrum.lon, ueb, kruemmung: false, skala: 1, hBasis: p.h_base ?? prim.hbase ?? 0});
  // ponto -> cena. {lat,lon,h|acima} ou {leste,norte,h} (metros do centro do pacote); h = altitude acima do nivel do mar
  const pt = (q: any): THREE.Vector3 => {
    if (q.lat !== undefined) {
      const hh = q.acima !== undefined ? (hoeheBei(campo, q.lat, q.lon) ?? prim.hmin) + q.acima / Math.max(1e-6, ueb) : (q.h ?? 0);
      return zuSzene(R, q.lat, q.lon, hh);
    }
    return new THREE.Vector3(q.leste ?? 0, ((q.h ?? 0) - R.hBasis) * ueb, -(q.norte ?? 0));
  };

  // camera
  const ks = (p.camera as any[]).map((k) => ({t: z(k.t), pos: pt(k.pos).toArray() as [number, number, number], ziel: pt(k.alvo).toArray() as [number, number, number], fov: k.fov ?? 40}));
  if (ks.length === 1) ks.push({...ks[0], t: ks[0].t + 1});
  ks.sort((a, c2) => a.t - c2.t);
  const f = fahrt(ks, t);
  const trem = p.tremor ?? 0;
  const wk = trem > 0 ? wackel(t, 0.15 * trem, 0.4) : [0, 0, 0];
  const k: KamDef = {pos: [f.pos[0] + wk[0], f.pos[1] + wk[1], f.pos[2] + wk[2]], ziel: f.ziel as any, fov: f.fov, near: p.near ?? prim.near ?? 5, far: p.far ?? prim.far ?? 100000};
  const luz = resolveLuz(p.luz);
  // acabamento (props `acab`): padrao `leve` (grao, LUT de epoca, vinheta, bloom so em emissivos) em todo Flug; `medio` = + ceu HDRI, nevoa de perspectiva, luz do clima
  const acab = p.acab ?? {};
  const nivelAcab: NivelAcab = acab.nivel ?? ACAB_PADRAO;
  const climaAcab: Clima = acab.clima ?? (p.luz?.preset === 'entardecer' ? 'entardecer' : p.luz?.preset === 'frio_azul' ? 'inverno' : 'nublado');

  // 3D: terreno + marcadores + arcos + vetores
  const mat: GMat = {...prim.mat, ...(p.terreno?.mat ?? {})};
  const nh = prim.nah;
  const bP = prim.bounds;
  const nahBox = (() => {
    if (!nh) return null;
    const dE = nh.raio_m / (Math.PI / 180 * 6371008.8 * Math.cos(prim.zentrum.lat * Math.PI / 180)), dN = nh.raio_m / (Math.PI / 180 * 6371008.8);
    return {west: prim.zentrum.lon - dE, east: prim.zentrum.lon + dE, south: prim.zentrum.lat - dN, north: prim.zentrum.lat + dN} as Bounds;
  })();
  const cantos = [zuSzene(R, bP.north, bP.west), zuSzene(R, bP.south, bP.east)];
  const loch: [number, number, number, number] = [Math.min(cantos[0].x, cantos[1].x) + 5, Math.min(cantos[0].z, cantos[1].z) + 5, Math.max(cantos[0].x, cantos[1].x) - 5, Math.max(cantos[0].z, cantos[1].z) - 5];

  const pontos: any[] = [...(p.pontos ?? [])];
  if (pa) {   // pontos (e contornos) lidos de geojson: ordem, tempos de entrada em sequencia, destaque de um id
    const feats: any[] = js[0].features, idp = pa.id ?? 'id';
    const cont: any[] = pa.contornos ? js[1].features : [];
    (pa.ordem ?? feats.map((f) => f.properties[idp])).forEach((id: string, i: number) => {
      const f = feats.find((q) => q.properties[idp] === id); if (!f) return;
      const c = cont.find((q) => q.properties[idp] === id);
      const dest = pa.destaque?.id === id;
      pontos.push({lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], contorno: c ? c.geometry.coordinates[0] : undefined, em: (pa.em0 ?? 0) + i * (pa.passo ?? 0),
        halo: (pa.halo ?? 600) + (dest ? pa.destaque.halo_extra ?? 0 : 0), pulso: pa.pulso ?? 1200, cor: pa.cor, altura: pa.altura, acima: 0});
    });
  }
  const cenaPts = pontos.map((q) => ({q, v: pt(q)}));
  const els: React.ReactNode[] = [];
  cenaPts.forEach(({q, v}, i) => {
    const cont = q.contorno ? (q.contorno as number[][]).map(([lo, la]) => zuSzene(R, la, lo, 0)) : undefined;
    els.push(<Marcador key={'p' + i} p={v} t={t} em={z(q.em, 0)} halo={q.halo ?? 600} pulso={q.pulso ?? 1200} cor={q.cor ?? '#9ec7e8'} contorno={cont} altura={(q.altura ?? 40) * ueb} />);
  });
  // ligacao em anel/cadeia entre os pontos (arcos que crescem em sequencia)
  if (p.ligar) {
    const L = p.ligar, n = cenaPts.length, a = z(L.de ?? 0), b2 = z(L.ate ?? 1), fech = L.fechar !== false;
    const seg = fech ? n : n - 1;
    for (let i = 0; i < seg; i++) {
      const A = pt({...cenaPts[i].q, acima: L.acima ?? 60}), B = pt({...cenaPts[(i + 1) % n].q, acima: L.acima ?? 60});
      const w = Math.min(1, Math.max(0, ((t - a) / (b2 - a)) * seg - i));
      els.push(<Bogen3 key={'l' + i} von={A} bis={B} hoehe={(L.altura ?? 60) * ueb} wachs={w} r={L.raio ?? 44} cor={L.cor ?? '#9cc6e6'} o={L.opak ?? 0.95} kopf={false} />);
    }
  }
  (p.arcos ?? []).forEach((a: any, i: number) => {
    const A = pt(a.de), B = pt(a.para), w = fase(t, z(a.em), z(a.em) + (a.dur ?? 1.6));
    els.push(<Bogen3 key={'a' + i} von={A} bis={B} hoehe={(a.altura ?? 500) * (a.escala_altura ?? 1)} wachs={w} r={a.raio ?? 14} cor={a.cor ?? '#f2c14e'} o={a.opak ?? 0.9} kopf={a.cabeca !== false} />);
  });
  (p.vetores ?? []).forEach((a: any, i: number) => {
    const w = fase(t, z(a.em), z(a.em) + (a.dur ?? 1.0)) * (a.ate !== undefined ? 1 - fase(t, z(a.ate) - 0.4, z(a.ate)) : 1);
    els.push(<Seta3 key={'v' + i} von={pt(a.de)} bis={pt(a.para)} wachs={w} cor={a.cor ?? '#f2c14e'} r={a.raio ?? 20} o={a.opak ?? 0.95} cabeca={a.cabeca !== false} />);
  });

  return (
    <AbsoluteFill>
      <BildAcab nivel={nivelAcab} clima={climaAcab} chao={acab.chao ?? false} ao={acab.ao ?? false} kam={k} sonne={luz.sonne} himmel={luz.himmel} hemi={luz.hemi} env={luz.env} perfil={luz.perfil}>
        <Malha gid={gid} r={R} farbe={farbeFull} seg={prim.seg ?? 512} texG={prim.texG ?? 4096} mat={mat} offsetY={nh ? -0.6 : 0} />
        {nh && nahBox && farbeNah && (() => {
          const bw = bP.east - bP.west, bh = bP.north - bP.south, Bw = nahBox.east - nahBox.west, Bh = nahBox.north - nahBox.south;
          return <Malha gid={gid} r={R} farbe={farbeNah} seg={nh.seg ?? 560} aus={nahBox} texG={prim.texG ?? 4096} mat={mat}
            uvRep={[bw / Bw, bh / Bh]} uvOff={[-(nahBox.west - bP.west) / Bw, -(nahBox.south - bP.south) / Bh]} />;
        })()}
        {horizontes.map((h, i) => <Malha key={h.id} gid={hids[i]} r={R} farbe={h.farbe} seg={p.terreno?.horizonte_seg ?? 420} texG={h.texG ?? 4096} mat={{...h.mat, ...(p.terreno?.horizonte_mat ?? {}), loch}} />)}
        {els}
      </BildAcab>
      {(p.rotulos ?? []).map((r: any, i: number) => <Marke key={'r' + i} k={k} p={pt(r).toArray() as [number, number, number]} t={t} em={z(r.em)} ate={r.ate !== undefined ? z(r.ate) : undefined} text={r.texto} unter={r.sub} cor={r.cor ? ((C as any)[r.cor] ?? r.cor) : C.papier}
        dx={r.dx} dy={r.dy} groesse={r.tam} mitte={r.mitte} />)}
      {p.cabecalho && <Kopf t={t} em={z(p.cabecalho.em, 0.4)} ate={p.cabecalho.ate !== undefined ? z(p.cabecalho.ate) : undefined} titel={p.cabecalho.titulo} zeilen={p.cabecalho.linhas} cor={p.cabecalho.cor ? ((C as any)[p.cabecalho.cor] ?? p.cabecalho.cor) : undefined} />}
      {p.legenda && <Legende t={t} em={z(p.legenda.em)} ate={p.legenda.ate !== undefined ? z(p.legenda.ate) : undefined} text={p.legenda.texto} unter={p.legenda.sub} groesse={p.legenda.tam} unten={p.legenda.baixo} />}
      {(p.notas ?? []).map((n: any, i: number) => <Fussnote key={'n' + i} t={t} em={z(n.em)} ate={n.ate !== undefined ? z(n.ate) : undefined} text={n.texto} />)}
      {(p.textos ?? []).map((n: any, i: number) => <Texto key={'x' + i} x={n.x} y={n.y} t={t} em={z(n.em)} ate={n.ate !== undefined ? z(n.ate) : undefined} cor={n.cor ? ((C as any)[n.cor] ?? n.cor) : C.papier} tam={n.tam} fonte={n.fonte}
        anker={n.anker} tafel={n.tafel}>{n.texto}</Texto>)}
      {p.fonte && <Quelle t={t} em={z(p.fonte_em, 0.3)} text={p.fonte} />}
      <Blende t={t} d={d} ein={p.entrada ?? 0} aus={p.saida ?? 0} />
    </AbsoluteFill>
  );
};
void F; void sichtbar; void lies;
