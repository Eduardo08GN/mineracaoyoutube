// Assets do mapa escuro (para buildMapa). A fonte (Barlow Condensed 600, OFL, @fontsource/barlow-condensed) é copiada
// para assets/ na G4 antes do build (g4_mapa.py); os demais saem de prep_dados.py.
import geo from './assets/mapa_geo.json';
import info from './assets/mapa_info.json';
import mar from './assets/mar_prof8.png';
import jade from './assets/jade_prof8.png';
import terra from './assets/terra_mask.png';
import jadeTerra from './assets/jade_terra.png';
import fonte from './assets/barlow_cond_600.woff2';

export const MAPA_ASSETS = {geo, info, mar, jade, terra, jadeTerra, fonte};
