// Familie karten: mapas 2D/2,5D dirigidos por JSON. Documentacao: API.md.
import React from 'react';
import {KitMap, KitProps} from '../tipos';
import {Karte, loesVorlage} from './Karte';

// Predefinicoes finas: mesmo motor, outro ponto de partida (o JSON da batida sempre vence)
const mit = (pre: any): React.FC<KitProps<any>> => (a) => React.createElement(Karte, {...a, p: {...pre, ...a.p, grund: {...pre.grund, ...(a.p?.grund || {})}}} as any);

// Detalhe: ortofoto aproximada (dessaturada/escurecida) com sobreposicao vetorial; o raster vem de p.grund.rasters (padrao: ortofoto de Loncin 2021)
const DETAIL = {
  kamera: {lon: 5.4925, lat: 50.6745, km: 0.0021},
  grund: {
    rasters: [{bild: 'geo/loncin_ortho_2021.jpg', grenzen: [5.463998, 50.656574, 5.520762, 50.692546], filter: 'grayscale(1) sepia(0.5) brightness(0.62) contrast(1.18)', rand: 0.02}],
    netz: 0, grenzen: 0, fluesse: 0,
  },
};
// Mundo / contexto regional: Blue Marble 8k, bordas e rios por cima
const WELT = {
  kamera: {lon: 12, lat: 35, km: 24, zoom: 0.9},
  phi0: 30,
  grund: {rasters: [{bild: 'geo/erde_bluemarble_maerz_8k.jpg', grenzen: [-180, -90, 180, 90], rand: 0, filter: 'brightness(0.7) saturate(0.8)'}], netz: 0.5, grenzen: 0.7, fluesse: 0},
};

export const KIT_KARTEN: KitMap = {
  Karte: {C: Karte, doc: 'Mapa 2D dirigido por JSON: base, camera por keyframes, camadas (ort, marke, ziel, linie, front, pfeil, kreis, lineal, blitz, geojson, symbol, texto...), titulo e fonte'},
  KarteDetail: {C: mit(DETAIL), doc: 'Karte com ortofoto aproximada (zoom de local) e camadas vetoriais por cima; mesmas props de Karte'},
  KarteWelt: {C: mit(WELT), doc: 'Karte de contexto: mapa-mundi/regional (Blue Marble) com bordas; mesmas props de Karte'},
};
export {loesVorlage};
