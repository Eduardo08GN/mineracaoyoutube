import React from 'react';
import {KitMap} from '../tipos';
import {Titel, Liste} from './titel';
import {Formel} from './formel';
import {Vergleich, Zahl, Balken} from './vergleich';
import {Kurve, Zitat, Zeitleiste, Foto} from './szenen';

const Hinweis: React.FC<any> = (a) => React.createElement(Liste, {...a, p: {deko: [{typ: 'schale', em: 0.3}], ...a.p}});

// Cenas da familia ui (cartoes 2D de explicador). Documentacao: API.md desta pasta.
export const KIT_UI: KitMap = {
  Titel: {C: Titel, doc: 'cartao tipografico: kicker, titulo (wipe ou letra a letra), teil, subtitulo; pode encolher para o cabecalho'},
  Liste: {C: Liste, doc: 'titulo hero opcional + linhas com icone (lista/checklist), valores a direita'},
  Hinweis: {C: Hinweis, doc: 'cartao de aviso (ex. SIMULATION): Liste com hero e wireframe de fundo'},
  Formel: {C: Formel, doc: 'formula KaTeX com termos que se revelam, destaques amarelos, legendas, contador; aceita balken e deko'},
  Balken: {C: Balken, doc: 'barras horizontais (linear/log), faixas von..bis, divisorias, linha-limite, moldura, fator'},
  Vergleich: {C: Vergleich, doc: 'colunas lado a lado (comparacao, conflito, certo/errado) com simbolo no meio'},
  Zahl: {C: Zahl, doc: 'numero grande com contador, unidade e linha de apoio'},
  Kurve: {C: Kurve, doc: 'grafico de linha/curva (expressao ou pontos), eixos que se desenham, marcadores'},
  Zeitleiste: {C: Zeitleiste, doc: 'linha do tempo com eventos, intervalos e marcador que corre'},
  Foto: {C: Foto, doc: 'foto de arquivo com Ken Burns, legenda e fonte'},
  Zitat: {C: Zitat, doc: 'cartao de papel envelhecido: citacao/depoimento ou ficha (kicker, nome grande, ano)'},
};
