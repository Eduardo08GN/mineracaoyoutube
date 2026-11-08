// Learjet P4: batedor (film.js) ou produção (prod.js, lê plano.json), escolhido pelo --config {"modo": "producao"}.
import {run as batedor} from './film.js';
import {run as producao} from './prod.js';

((window.__SIM_CONFIG || {}).modo === 'producao' ? producao : batedor)();
