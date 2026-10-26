// Fontes de epoca do video 6 (1870/71), OFL, servidas de public/fonts (batedor 25/10/2026):
// antiqua (Old Standard TT) para mapas, rotulos e contador; Fraktur (UnifrakturMaguntia) so em titulos de capitulo e abertura.
import {continueRender, delayRender, staticFile} from 'remotion';

const FONTES: [string, string, string, string][] = [
  ['Antiqua1870', 'fonts/OldStandard-Regular.ttf', '400', 'normal'],
  ['Antiqua1870', 'fonts/OldStandard-Bold.ttf', '700', 'normal'],
  ['Antiqua1870', 'fonts/OldStandard-Italic.ttf', '400', 'italic'],
  ['Fraktur1870', 'fonts/UnifrakturMaguntia-Book.ttf', '400', 'normal'],
];

if (typeof document !== 'undefined' && !(window as any).__fontes1870) {
  (window as any).__fontes1870 = true;
  const h = delayRender('fontes 1870');
  Promise.all(FONTES.map(([n, u, w, st]) => {
    const f = new FontFace(n, `url(${staticFile(u)})`, {weight: w, style: st});
    document.fonts.add(f);
    return f.load();
  })).then(() => continueRender(h), () => continueRender(h));
}

export const F1870 = {antiqua: 'Antiqua1870, Georgia, serif', fraktur: 'Fraktur1870, Antiqua1870, serif'};
