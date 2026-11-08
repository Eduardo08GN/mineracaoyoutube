// Fontes OFL (Playfair Display, Google Fonts) carregadas antes do primeiro quadro: nada de fallback no still.
import {continueRender, delayRender, staticFile} from 'remotion';

const FONTES: [string, string, FontFaceDescriptors?][] = [
  ['PfSerif', 'fontes/PlayfairDisplay-VF.ttf', {weight: '400 900'}],
  ['PfItalic', 'fontes/PlayfairDisplay-Italic-VF.ttf', {weight: '400 900', style: 'italic'}],
  ['PfSC', 'fontes/PlayfairDisplaySC-Bold.ttf', {weight: '700'}],
];
if (typeof document !== 'undefined') {
  const h = delayRender('fontes do HUD');
  Promise.all(FONTES.map(([n, a, d]) => new FontFace(n, `url(${staticFile(a)})`, d).load().then((f) => { (document.fonts as any).add(f); })))
    .then(() => continueRender(h), () => continueRender(h));
}
export const SERIF = 'PfSerif, "Playfair Display", Georgia, serif';
export const ITALICO = 'PfItalic, "Playfair Display", Georgia, serif';
export const VERSALETE = 'PfSC, "Playfair Display SC", "Playfair Display", Georgia, serif';
export const VERMELHO = '#E63B2E';
export const BRANCO = '#F7F4EE';
