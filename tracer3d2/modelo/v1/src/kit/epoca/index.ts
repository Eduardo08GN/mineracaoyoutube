import {KitMap} from '../tipos';
import {Gemaelde} from './Gemaelde';

// Familia "epoca" do kit: imagens de epoca em 2.5D com paralaxe. Documentacao: API.md desta pasta.
export const KIT_EPOCA: KitMap = {
  Gemaelde: {C: Gemaelde, doc: 'pintura/gravura/foto de epoca em 2.5D (2 camadas por profundidade, camera lenta, fumaca/poeira/chuva, rotulo ZEITGENOESSISCHE DARSTELLUNG, manchete); mapa/carta sem profundidade = Ken Burns'},
};
