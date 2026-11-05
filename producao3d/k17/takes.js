// K17 batedor da máquina: 3 takes, cada um com câmera, estado da ponte e notas próprias.
// bau: [t, campos construídos]; v: [t, m/s]; biege: [t, 0..1]; notes: o que se escreve no caderno (em = segundo no take).
const de = (x, d = 1) => x.toFixed(d).replace('.', ',');
const TITLE = (txt, em = 0.15, extra = {}) => ({type: 'text', key: 'title', x: 70, y: 96, txt, size: 50, em, ...extra});
const FOL = (txt) => ({type: 'text', key: 'fol', x: 1534, y: 866, txt, size: 23, font: 'gar', align: 'r', col: 'ink2', em: 0, dur: 0.01});

export const TAKES = {
  // ---------------------------------------------------------------- o pontão sozinho: entra, assenta, as medidas se escrevem
  ponton: {
    dur: 6, felder: 6,
    focus: {c: [3.2, 0.3, 0], ext: 5, ao: 0.12, fade: 30},
    bau: [[0, 0.02], [3.2, 0.3], [6, 0.3]],
    cam: [[0, {pos: [10.5, 3.6, 8.5], tgt: [3.2, 0.1, -0.4], fov: 32}], [6, {pos: [9.2, 3.0, 7.0], tgt: [3.2, 0.15, -0.2], fov: 30}]],
    notes: () => [
      TITLE('Der preußische Ponton'),
      {type: 'label', key: 'lL', a: (A) => A.pontonBug(0), x: 560, y: 250, txt: '7,21 m lang', size: 38, em: 2.4},
      {type: 'label', key: 'lB', a: (A) => A.pontonSeite(0), x: 1080, y: 640, txt: '1,52 m breit · 0,76 m tief', size: 34, em: 3.2},
      {type: 'text', key: 'n1', x: 72, y: 730, txt: 'aus Holz: 514 kg', size: 34, em: 3.8},
      {type: 'text', key: 'n2', x: 72, y: 790, txt: 'er trägt', size: 34, em: 4.4},
      {type: 'zahl', key: 'z1', x: 210, y: 790, de: 0, ate: 4638, em: 4.6, dur: 1.2, size: 40, col: 'acc', fmt: (v) => `${Math.round(v).toLocaleString('de-DE')} kg`},
      FOL('Lovell, RUSI 1866'),
    ],
  },
  // ---------------------------------------------------------------- o lançamento: campo a campo, a estrada atravessa o rio
  brueckenschlag: {
    dur: 8, felder: 5,
    focus: {c: [12, 0.3, 0], ext: 16, ao: 0.3, fade: 60},
    bau: [[0, 0.15], [8, 4.7]],
    cam: [[0, {pos: [24, 10.5, 19], tgt: [10, 0, -1], fov: 34}], [8, {pos: [30, 9.5, 15], tgt: [14, 0, -1], fov: 34}]],
    notes: () => [
      TITLE('Brückenschlag – Feld um Feld'),
      {type: 'label', key: 'lb', a: (A) => A.bock(), x: 300, y: 330, txt: 'Bock', size: 34, em: 0.6, until: 3.0},
      {type: 'label', key: 'la', a: (A) => A.anker(1), x: 640, y: 210, txt: 'Anker gegen die Strömung', size: 32, em: 2.0, until: 5.5},
      {type: 'label', key: 'll', a: (A) => A.balken(2), x: 1040, y: 250, txt: 'fünf Streckbalken', size: 32, em: 3.3, until: 6.6},
      {type: 'label', key: 'lr', a: (A) => A.belag(3), x: 1150, y: 640, txt: 'der Belag', size: 34, em: 5.0},
      {type: 'text', key: 'n1', x: 72, y: 730, txt: 'Brückenlänge', size: 30, em: 0.4},
      {type: 'zahl', key: 'z1', x: 72, y: 790, de: 0.15 * 4.4, ate: 4.7 * 4.4, em: 0.4, dur: 7.4, size: 44, col: 'acc', fmt: (v) => `${de(v, 1)} m`},
      {type: 'text', key: 'n2', x: 420, y: 730, txt: 'Pontons', size: 30, em: 0.8},
      {type: 'tally', key: 't1', x: 420, y: 760, em: 1.4, n: 5, step: 1.45},
      FOL('Juvisy: 141 m in 1¾ Stunden'),
    ],
  },
  // ---------------------------------------------------------------- Novéant: a cheia dobra a ponte em meia-lua
  halbmond: {
    dur: 7, felder: 5,
    focus: {c: [12, 0.3, 1], ext: 16, ao: 0.3, fade: 60},
    bau: [[0, 5], [7, 5]], v: [[0, 0.45], [4.2, 1.25], [7, 1.25]], biege: [[0, 0], [1.2, 0], [4.6, 1], [7, 1]],
    cam: [[0, {pos: [13, 21, 24], tgt: [13, 0, 1], fov: 36}], [7, {pos: [17, 18, 22], tgt: [13, 0, 2], fov: 36}]],
    notes: () => [
      TITLE('Novéant, 11. September 1870'),
      {type: 'text', key: 'n1', x: 72, y: 730, txt: 'Strömung', size: 30, em: 0.5},
      {type: 'zahl', key: 'z1', x: 72, y: 790, de: 0.45, ate: 1.25, em: 0.6, dur: 3.8, size: 44, col: 'acc', fmt: (v) => `${de(v, 2)} m/s`},
      {type: 'label', key: 'lh', a: (A) => A.ponton(2), x: 980, y: 210, txt: 'die Brücke biegt sich zum Halbmond', size: 32, em: 3.6, acc: () => true},
      FOL('Gesch. d. Pomm. Pionier-Bat. Nr. 2, S. 66'),
    ],
  },
};
