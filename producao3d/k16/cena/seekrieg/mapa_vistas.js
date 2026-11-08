// As 43 vistas de mapa do plano K16 → estado do mapa.js (câmera, trilhas, anéis, rótulos, navios, faixas do Jade, setas).
// Tudo é função de (u = tempo local da batida, dur). A câmera nunca para (parte linear + parte suave).
// Fora da extensão dos dados (47–60° N): Havana, La Seyne e Bordeaux viram SETA saindo do mapa com rótulo e distância.
import {clamp01, easeInOutCubic} from 'teardown-kit/util.js';
import {COR, mundoParaLonlat, naRota, rotaMundo} from './mapa.js';

const ss = (a, b, t) => easeInOutCubic(clamp01((t - a) / (b - a)));
const mov = (u, dur) => 0.45 * clamp01(u / dur) + 0.55 * ss(0, dur, u);
const lerp = (a, b, k) => (Array.isArray(a) ? a.map((v, i) => v + (b[i] - v) * k) : a + (b - a) * k);
const camEntre = (c0, c1, k) => Object.fromEntries(Object.keys(c0).map((n) => [n, lerp(c0[n], c1[n] ?? c0[n], k)]));

export const L = {
  cherbourg: [-1.6222, 49.6337], whv: [8.1333, 53.5167], helgoland: [7.8858, 54.1823], wangerooge: [7.899, 53.79], kiel: [10.1394, 54.3233],
  paris: [2.3522, 48.8566], chalons: [4.3631, 48.9566], sedan: [4.9403, 49.7019], reims: [4.0317, 49.2583], london: [0.0, 51.508],
  plymouth: [-4.142, 50.375], dunquerque: [2.377, 51.034], copenhague: [12.568, 55.676], koege: [12.25, 55.45], danzig: [18.646, 54.352],
  alsen: [9.9, 54.98], friedrichsort: [10.185, 54.392], sund: [12.65, 55.95], cuxhaven: [8.69, 53.87], kolberg: [15.58, 54.18],
  woerth: [7.75, 48.94], weissenburg: [7.94, 49.04], spichern: [6.97, 49.17], brest: [-4.486, 48.39],
  romainville: [2.43, 48.884], rosny: [2.49, 48.872], noisy: [2.46, 48.888], ivry: [2.39, 48.811], bicetre: [2.355, 48.808], montrouge: [2.318, 48.81],
};
const PLANO = [L.cherbourg, [-0.6, 50.15], [1.45, 50.95], [3.2, 52.4], [6.2, 55.3], [8.4, 57.45], [10.75, 57.95], [11.7, 57.0], [11.15, 56.05], [10.95, 55.45], [10.62, 54.95], [10.35, 54.6]];
const MARCHA = [L.cherbourg, [-0.37, 49.18], [1.1, 49.0], L.paris, [3.3, 48.9], L.chalons, L.reims, [4.55, 49.5], L.sedan];
const VOLTA = [[7.6, 54.2], [5.0, 53.6], [3.2, 52.2], [1.45, 50.95], [-0.6, 50.15], L.cherbourg];
const SUND = [L.kiel, [10.9, 54.6], [11.8, 55.2], [12.65, 55.6], L.sund, [12.0, 56.5], [10.6, 57.8], [8.5, 57.3], [7.7, 55.5], [8.2, 54.2], L.cuxhaven];
const FR7 = Array.from({length: 7}, (_, i) => [7.18 + (i % 4) * 0.13 + (i >= 4 ? 0.065 : 0), 54.3 - (i >= 4 ? 0.07 : 0) - (i % 4) * 0.012]);
const AL5 = Array.from({length: 5}, (_, i) => [8.12 + (i % 3) * 0.035, 53.55 + Math.floor(i / 3) * 0.03]);
const C = {
  europa: [{centro: [5.3, 53.75], alt_km: 2450, inclinacao_graus: 12, rumo_graus: 10, fov: 30}, {centro: [5.6, 53.8], alt_km: 2250, inclinacao_graus: 17, rumo_graus: 14, fov: 30}],
  europa_larga: [{centro: [4.5, 52.5], alt_km: 3600, inclinacao_graus: 10, rumo_graus: 0, fov: 30}, {centro: [4.2, 52.3], alt_km: 3300, inclinacao_graus: 14, rumo_graus: 4, fov: 30}],
  nordsee: [{centro: [7.82, 53.93], alt_km: 255, inclinacao_graus: 25, rumo_graus: -5, fov: 30}, {centro: [7.98, 53.84], alt_km: 205, inclinacao_graus: 31, rumo_graus: 4, fov: 30}],
  nordsee_largo: [{centro: [6.5, 54.4], alt_km: 900, inclinacao_graus: 18, rumo_graus: 0, fov: 30}, {centro: [6.8, 54.3], alt_km: 800, inclinacao_graus: 22, rumo_graus: 5, fov: 30}],
  jade: [{centro: [8.05, 53.74], alt_km: 56, inclinacao_graus: 27, rumo_graus: -2, fov: 30}, {centro: [8.03, 53.72], alt_km: 45, inclinacao_graus: 34, rumo_graus: 8, fov: 30}],
  franca: [{centro: [1.7, 49.28], alt_km: 610, inclinacao_graus: 19, rumo_graus: 2, fov: 30}, {centro: [2.15, 49.36], alt_km: 520, inclinacao_graus: 25, rumo_graus: -2, fov: 30}],
  fronteira: [{centro: [6.4, 49.2], alt_km: 420, inclinacao_graus: 22, rumo_graus: 0, fov: 30}, {centro: [6.9, 49.1], alt_km: 330, inclinacao_graus: 28, rumo_graus: 6, fov: 30}],
  baltico: [{centro: [11.5, 55.3], alt_km: 820, inclinacao_graus: 18, rumo_graus: 0, fov: 30}, {centro: [11.2, 55.0], alt_km: 700, inclinacao_graus: 24, rumo_graus: 6, fov: 30}],
  kiel: [{centro: [10.15, 54.42], alt_km: 70, inclinacao_graus: 25, rumo_graus: 0, fov: 30}, {centro: [10.17, 54.40], alt_km: 52, inclinacao_graus: 32, rumo_graus: 6, fov: 30}],
  dinamarca: [{centro: [10.0, 55.8], alt_km: 760, inclinacao_graus: 16, rumo_graus: 0, fov: 30}, {centro: [10.2, 55.6], alt_km: 640, inclinacao_graus: 22, rumo_graus: -4, fov: 30}],
  paris: [{centro: [2.38, 48.85], alt_km: 40, inclinacao_graus: 25, rumo_graus: 0, fov: 30}, {centro: [2.38, 48.85], alt_km: 30, inclinacao_graus: 32, rumo_graus: 8, fov: 30}],
  canal: [{centro: [0.5, 50.6], alt_km: 900, inclinacao_graus: 16, rumo_graus: 0, fov: 30}, {centro: [1.2, 50.8], alt_km: 760, inclinacao_graus: 22, rumo_graus: 4, fov: 30}],
};
const R = (lonlat, texto, o = 1, x = {}) => ({lonlat, texto, ancora: 'd', ponto: true, opacidade: o, ...x});
const T = (pontos, progresso, estilo = 'solida', cor = COR.trajetoria, x = {}) => ({pontos, progresso, estilo, cor, largura: 3, ...x});
const A = (centro, raio_km, progresso, rotulo, cor = COR.perigo, x = {}) => ({centro, raio_km, progresso, cor, rotulo, ...x});
const N = (lonlat, rumo, o = 1, cor = COR.perigo, esc = 0.6) => ({lonlat, rumo_graus: rumo, cor, escala: esc, opacidade: o});
// seta para fora do mapa (lugar fora da extensão dos dados): uma trilha do ponto de saída até a borda, com rótulo
const saida = (de, para, texto, p) => T([de, para], p, 'tracejada', COR.dado, {rotulo: {texto, ancora: 'd', tamanho: 28}});

export function estadoVista(nome, u, dur, ctx) {
  const k = mov(u, dur);
  const cam = (c) => camEntre(C[c][0], C[c][1], k);
  switch (nome) {
    case 'europa_helgoland': return {camera: camEntre(C.europa_larga[0], C.nordsee[1], ss(0, dur, u)), rotulos: [R(L.helgoland, 'Helgoland', ss(dur * 0.5, dur * 0.8, u))]};
    case 'helgoland': return {camera: cam('nordsee'), navios: FR7.map((p, i) => N(p, 100, ss(0.2 + i * 0.25, 0.5 + i * 0.25, u), COR.perigo, 0.55)), rotulos: [R(L.helgoland, 'Helgoland', 1)]};
    case 'helgoland_jade': return {camera: cam('nordsee'), navios: FR7.map((p) => N(p, 100, 1, COR.perigo, 0.55)), trilhas: [T([L.helgoland, L.whv], ss(0.3, 1.6, u), ctx.vazia ? 'tracejada' : 'solida', COR.dado, {suave: false, rotulo: {texto: '< 80 km', ancora: 'd', tamanho: 30}})], aneis: [A(L.whv, 7, ss(1.2, 2.0, u), 'Wilhelmshaven')], faixasJade: ctx.take.faixasJade ? {opacidade: 0.35 * ss(0.4, 1.4, u)} : undefined, rotulos: [R(L.helgoland, 'Helgoland', 1), R(L.wangerooge, 'Wangerooge', 0.8, {tamanho: 22, ancora: 's'})]};
    case 'jade_wilhelmshaven': return {camera: cam('jade'), navios: AL5.map((p, i) => N(p, 0, ss(0.2 + i * 0.15, 0.5 + i * 0.15, u), COR.trajetoria, 0.9)), aneis: [A(L.whv, 4, ss(0.2, 1.0, u), 'Wilhelmshaven')], rotulos: [R(L.wangerooge, 'Wangerooge', 0.8, {tamanho: 22, ancora: 's'})]};
    case 'nordsee_contagem': return {camera: cam('nordsee_largo'), navios: [...Array.from({length: 49}, (_, i) => N([3.0 + (i % 7) * 0.45, 55.6 - Math.floor(i / 7) * 0.32], 100, ss(i * 0.03, i * 0.03 + 0.3, u), COR.perigo, 0.5)), ...AL5.map((p) => N(p, 0, 1, COR.trajetoria, 0.6))], rotulos: [R([4.4, 56.0], '49', 1, {ponto: false, tamanho: 40}), R(L.whv, '5', 1, {tamanho: 40})]};
    case 'helgoland_cherbourg': return {camera: camEntre(C.nordsee_largo[0], C.canal[1], ss(0, dur, u)), trilhas: [T(VOLTA, ss(0.2, dur - 0.3, u), 'solida', COR.trajetoria, {rotulo: {texto: '11.08. → 12.09.', ancora: 'd', tamanho: 28}})], rotulos: [R(L.cherbourg, 'Cherbourg', ss(dur - 1, dur - 0.5, u))]};
    case 'cherbourg': return {camera: cam('canal'), aneis: [A(L.cherbourg, 18, ss(0.2, 0.9, u), 'Cherbourg', COR.dado)], trilhas: [T([L.cherbourg, L.paris, L.chalons], ss(0.8, dur, u), 'pontos', COR.trajetoria, {n: 120, coluna: 0.25})]};
    case 'jade_faixas': return {camera: cam('jade'), faixasJade: {opacidade: ss(0, 0.6, u)}, costa_opac: 1 - ss(0, 0.6, u), rotulos: [R([7.974, 53.753], 'Watt', ss(0.5, 1.0, u), {ponto: false, tamanho: 28}), R(L.wangerooge, 'Wangerooge', 0.8, {tamanho: 22, ancora: 's'})]};
    case 'tres_simbolos': return {camera: cam('europa'), aneis: [A(L.cherbourg, 60, ss(0.2, 0.8, u), 'Soldaten', COR.dado), A(L.wangerooge, 50, ss(0.8, 1.4, u), 'Wasser', COR.trajetoria), A(L.dunquerque, 50, ss(1.4, 2.0, u), 'Kohle', COR.perigo)]};
    case 'estaleiros': return {camera: cam('europa_larga'), trilhas: [T([L.london, [3.0, 52.5], L.whv], ss(0.2, 1.6, u)), saida([4.0, 47.3], [6.0, 52.0], 'La Seyne · Bordeaux', ss(1.0, 2.4, u))], rotulos: [R(L.london, 'London', ss(0, 0.4, u)), R(L.whv, 'Wilhelmshaven', ss(0.2, 0.6, u))]};
    case 'estaleiros_franca': return {camera: cam('europa_larga'), trilhas: [saida([-1.0, 47.2], [5.5, 53.2], 'Bordeaux', ss(0.1, 1.4, u)), saida([5.9, 47.1], [8.0, 53.4], 'La Seyne', ss(0.5, 1.8, u))], rotulos: [R(L.whv, 'Wilhelmshaven', 1)]};
    case 'plano_baltico': return {camera: cam('europa'), trilhas: [T(PLANO, ss(0.2, dur, u), 'tracejada')], rotulos: [R(L.cherbourg, 'Cherbourg', 1), R(L.kiel, 'Kiel', ss(dur * 0.6, dur, u))]};
    case 'plano_kiel': return {camera: cam('baltico'), trilhas: [T(PLANO, 1, 'tracejada'), T([[10.7, 55.0], L.kiel], ss(0.3, 1.4, u), 'solida', COR.perigo)], rotulos: [R(L.kiel, 'Kiel', 1)]};
    case 'dinamarca': return {camera: cam('dinamarca'), aneis: [A([9.4, 55.9], 150, ss(0.2, 1.0, u), ctx.take.mkTxt || 'Dänemark', COR.dado)], rotulos: [R([9.5, 54.6], 'Schleswig · Holstein', ss(0.8, 1.4, u), {ponto: false, tamanho: 26})]};
    case 'plymouth_jade': return {camera: cam('europa'), trilhas: [T([L.plymouth, [-1.0, 50.3], [1.45, 50.95], [3.2, 52.4], [6.0, 53.9], L.whv], ss(0.2, dur - 0.3, u))], navios: [N(L.whv, 60, ss(dur - 0.8, dur - 0.3, u), COR.trajetoria, 0.8)], rotulos: [R(L.plymouth, 'Plymouth', 1), R(L.whv, 'Wilhelmshaven', ss(dur - 1, dur - 0.5, u))]};
    case 'fronteira': return {camera: cam('fronteira'), aneis: [A(L.weissenburg, 12, ss(0.2, 0.7, u), 'Weißenburg'), A(L.woerth, 12, ss(0.8, 1.3, u), 'Wörth'), A(L.spichern, 12, ss(1.4, 1.9, u), 'Spichern')]};
    case 'divisao_cherbourg': case 'divisao_chalons': case 'divisao_sedan': {
      const fase = {divisao_cherbourg: [0, 0.45], divisao_chalons: [0.4, 0.75], divisao_sedan: [0.7, 1]}[nome];
      const p = lerp(fase[0], fase[1], ss(0, dur, u));
      return {camera: cam('franca'), trilhas: [T(MARCHA, p, 'pontos', COR.trajetoria, {n: 360, coluna: 0.3})], aneis: nome === 'divisao_sedan' ? [A(L.sedan, 28, ss(dur * 0.5, dur * 0.85, u), 'Sedan · 2. Sept.')] : [],
        rotulos: [R(L.cherbourg, 'Cherbourg', 1, {ancora: 's'}), R(L.paris, 'Paris', 1, {ancora: 's'}), R(L.chalons, 'Châlons', p > 0.5 ? 1 : 0, {ancora: 's'})]};
    }
    case 'baltico_apaga': return {camera: cam('baltico'), trilhas: [T(PLANO, 1, 'tracejada', COR.trajetoria, {opacidade: 1 - ss(0.3, dur, u)})]};
    case 'costa_nordsee': return {camera: cam('nordsee_largo'), rotulos: [R(L.wangerooge, 'Wangerooge', 1, {tamanho: 22}), R(L.cuxhaven, 'Elbe', 1, {tamanho: 22})]};
    case 'jade_canal': return {camera: cam('jade'), faixasJade: {opacidade: 1}, costa_opac: 0, trilhas: [T(ctx.canal, ss(0.2, dur, u), 'solida', COR.dado, {largura: 2.5})], rotulos: [R(L.whv, 'Wilhelmshaven', 1), R(ctx.canalMeio, 'Fahrwasser', ss(0.6, 1.1, u), {tamanho: 22})]};
    case 'jade_navio_para': return ctx.jadePara(u);
    case 'kiel_barreira': return {camera: cam('kiel'), aneis: [A(L.friedrichsort, 3, ss(0.2, 0.8, u), 'Sperre · Minen')], navios: ctx.take.frota ? FR7.map((_, i) => N([10.25 + i * 0.02, 54.6 - i * 0.01], 200, 1, COR.perigo, 0.5)) : [], rotulos: [R(L.kiel, 'Kiel', 1)]};
    case 'arminius_sund': case 'arminius_elba': {
      const p = nome === 'arminius_sund' ? ss(0, dur, u) * 0.55 : 0.55 + 0.45 * ss(0, dur, u);
      return {camera: cam('baltico'), trilhas: [T(SUND, p, 'solida', COR.trajetoria)], rotulos: [R(L.kiel, 'Kiel', 1), R(L.sund, 'Sund', p > 0.3 ? 1 : 0), R(L.cuxhaven, 'Elbe', p > 0.9 ? 1 : 0)]};
    }
    case 'jade_minas': return {camera: cam('jade'), aneis: Array.from({length: 6}, (_, i) => A([7.98 + (i % 3) * 0.05, 53.66 + Math.floor(i / 3) * 0.05], 1.6, ss(0.1 + i * 0.12, 0.5 + i * 0.12, u), i === 0 ? 'Minen' : '', COR.perigo))};
    case 'alsen': return {camera: cam('kiel'), aneis: [A(L.alsen, 3, ss(0.2, 1.0, u), '3 km')], navios: [N([9.95, 54.86], 0, 1, COR.perigo, 0.7)], rotulos: [R(L.alsen, 'Alsen', 1)]};
    case 'bloqueio': return {camera: cam('europa'), trilhas: [T([[6.0, 53.9], [8.6, 54.3]], ss(0.2, 1.2, u), 'tracejada', COR.perigo), T([[11.0, 54.6], [14.5, 54.7], [18.5, 54.6]], ss(0.6, 1.8, u), 'tracejada', COR.perigo)]};
    case 'bloqueio_capturas': return {camera: cam('nordsee_largo'), trilhas: [T([[6.0, 53.9], [8.6, 54.3]], 1, 'tracejada', COR.perigo)], navios: Array.from({length: 8}, (_, i) => N([5.5 + i * 0.4, 54.6 + (i % 2) * 0.2], 260, ss(i * 0.2, i * 0.2 + 0.3, u), COR.dado, 0.35))};
    case 'helgoland_britanica': return {camera: cam('nordsee'), aneis: [A(L.helgoland, 9, ss(0.2, 0.9, u), 'britisch · gesperrt', COR.dado)], rotulos: [R(L.helgoland, 'Helgoland', 1)]};
    case 'dinamarca_costa': return {camera: cam('dinamarca'), trilhas: [T([[8.6, 55.3], [8.1, 56.0], [8.2, 56.8], [8.6, 57.1]], ss(0.2, 1.4, u), 'tracejada', COR.dado, {rotulo: {texto: 'kein Hafen', ancora: 'd', tamanho: 28}})]};
    case 'carvao_dunquerque': return {camera: cam('nordsee_largo'), trilhas: [T([L.dunquerque, [3.2, 52.4], [6.0, 53.9], L.helgoland], ss(0.2, dur, u), 'tracejada', COR.perigo)], rotulos: [R(L.dunquerque, 'Dünkirchen', 1), R(L.helgoland, 'Helgoland', 1)]};
    case 'vendaval': return {camera: cam('nordsee_largo'), setas: Array.from({length: 7}, (_, i) => ({de: [2.0 + i * 0.6, 52.6 + (i % 3) * 0.6], para: [4.2 + i * 0.6, 54.3 + (i % 3) * 0.6], progresso: ss(0.1 + i * 0.12, 0.8 + i * 0.12, u), cor: COR.dado})), rotulos: [R([4.0, 53.3], 'Sturm aus Südwest', ss(0.6, 1.1, u), {ponto: false, tamanho: 30})]};
    case 'alcance_encolhe': return {camera: cam('europa'), aneis: [A(L.helgoland, 700 - 520 * ss(0.2, dur - 0.2, u), 1, 'Kohle', COR.perigo)], rotulos: [R(L.cherbourg, 'Cherbourg', 1), R(L.helgoland, 'Helgoland', 1)]};
    case 'volta_cherbourg': return {camera: cam('canal'), trilhas: [T(VOLTA, ss(0.1, dur, u))], rotulos: [R(L.cherbourg, 'Cherbourg', 1)]};
    case 'cherbourg_paris': return {camera: cam('franca'), trilhas: [T([L.cherbourg, [-0.37, 49.18], [1.1, 49.0], L.paris], ss(0.2, dur * 0.8, u), 'pontos', COR.trajetoria, {n: 200, coluna: 0.4})], rotulos: [R(L.cherbourg, 'Cherbourg', 1), R(L.paris, 'Paris', 1)]};
    case 'paris_fortes': {
      const sul = ctx.id === '10_06B' || ctx.id === '10_09';
      const F = [['Romainville', L.romainville], ['Rosny', L.rosny], ['Noisy', L.noisy], ['Ivry', L.ivry], ['Bicêtre', L.bicetre], ['Montrouge', L.montrouge]];
      return {camera: cam('paris'), aneis: F.map(([n, p], i) => A(p, 0.9, sul ? (i < 3 ? 1 : ss((i - 3) * 0.4, (i - 3) * 0.4 + 0.5, u)) : (i < 3 ? ss(i * 0.4, i * 0.4 + 0.5, u) : 0), n, COR.trajetoria)), rotulos: [R(L.paris, 'Paris', 1, {ponto: false, tamanho: 30})]};
    }
    case 'surtidas': return {camera: cam('nordsee_largo'), trilhas: [T([L.whv, [7.4, 54.6], [5.5, 55.0], [6.5, 54.4], L.whv], ss(0.1, dur * 0.5, u)), T([L.whv, [7.8, 54.7], [6.8, 55.3], [7.0, 54.5], L.whv], ss(dur * 0.45, dur, u))], rotulos: [R([5.5, 55.0], 'leer', ss(dur * 0.4, dur * 0.6, u), {ponto: false})]};
    case 'jade_cherbourg': return {camera: cam('europa'), trilhas: [T([L.whv, [6.0, 53.9], [3.2, 52.4], [1.45, 50.95], [-0.6, 50.15], L.cherbourg], ss(0.2, dur, u), 'tracejada', COR.trajetoria)], rotulos: [R(L.cherbourg, 'Cherbourg', 1)]};
    case 'havana_globo': return {camera: cam('europa_larga'), trilhas: [saida(L.whv, [-5.0, 48.0], 'Havanna · 8.000 km', ss(0.2, dur, u))]};
    case 'havana': return {camera: camEntre(C.europa_larga[1], C.canal[1], ss(0, dur, u)), rotulos: [R([-3.5, 48.6], '9. November 1870 · Havanna', ss(0.2, 0.8, u), {ponto: false, tamanho: 30})]};
    case 'baltico_incerto': return {camera: cam('baltico'), aneis: [A([11.6, 54.9], 160, ss(0.2, 1.0, u), 'unbekannt', COR.dado, {tracejado: true})]};
    default: return {camera: cam('europa')};
  }
}

// contexto que depende do mapa já construído (rota do Jade e onde a Provence de 8,4 m para)
export function contextoMapa(mapa, assets) {
  const ROTA_JADE = [[7.60, 54.06], [7.96, 53.79]];
  const rj = rotaMundo(ROTA_JADE, false);
  let pPara = 1;
  for (let x = 0; x <= rj.L; x += 0.1) { const pr = mapa.profJade(mundoParaLonlat(naRota(rj, x).p)); if (pr === null || (pr !== undefined && pr < 8.4)) { pPara = x / rj.L; break; } }
  const llPara = mundoParaLonlat(naRota(rj, pPara * rj.L).p);
  const canal = assets.info.canal_jade;
  return {
    canal, canalMeio: canal[Math.floor(canal.length * 0.55)],
    jadePara: (u) => {
      const prog = 0.12 + 0.88 * ss(0.2, 3.4, u), parado = prog >= pPara ? ss(0, 0.4, u - 3.4 * pPara) : 0;
      return {camera: camEntre(C.jade[0], C.jade[1], mov(u, 5)), faixasJade: {opacidade: 1, linha_m: 8.4, linha_opac: 0.9 * parado, linha_centro: llPara, linha_raio_km: 3.5}, costa_opac: 0,
        trilhas: [T(ROTA_JADE, ss(0.1, 1.1, u), 'tracejada', COR.trajetoria, {largura: 2.5, suave: false, ponta: false, opacidade: 0.8})],
        navios: [{rota: ROTA_JADE, progresso: prog, suave: false, calado_m: 8.4, cor: COR.perigo, escala: 1.1, parada_opac: parado}],
        rotulos: [R([7.974, 53.753], 'Watt', 1, {ponto: false, tamanho: 28}), R(llPara, '8,4 m Tiefgang', parado, {ancora: 'e', afasta_px: 34, tamanho: 28})]};
    },
  };
}
