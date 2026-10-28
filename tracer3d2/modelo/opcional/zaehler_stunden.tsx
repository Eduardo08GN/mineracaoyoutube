// Contador de efetivos (video 6, adaptado ao video 7) (o roteiro promete no cap. 2: "Unten im Bild läuft ab jetzt ein Zähler mit").
// Le a serie stunden.json (copia de fisica/stunden.json). A data vem das batidas do plano: campo `datum` (ISO) na batida;
// `lauf: true` = a data corre ate a proxima batida datada; `zaehler: false` = esconde nesta batida. Funcao pura do tempo.
import React from 'react';
import {Easing, interpolate} from 'remotion';
import STUNDEN from './stunden.json';
import {PLAN} from './tempo';
import {C, F} from './ui/basis';
import {F1870} from './look/epoche';

// Video 7 (Sedan): serie por HORA (stunden.json, copia de fisica/stunden.json, pontos irregulares). `datum` da batida aceita
// "1870-09-01T09:00" (hora) ou "1870-08-30" (dia, = 12:00). Em 1-2/set o relogio mostra a hora; antes, so a data.
type Pkt = {zeit: string; de_feld: number; de_gesch: number; fr_feld: number; de_verl_kum: number; fr_verl_kum: number; fr_gef_kum: number};
const T: Pkt[] = (STUNDEN as any).punkte;
const H = 3600000;
const ms = (iso: string) => Date.parse((iso.length <= 10 ? iso + 'T12:00' : iso) + ':00Z');
const T0 = ms(T[0].zeit);
const tagNr = (iso: string) => (ms(iso) - T0) / H;   // horas desde o 1o ponto (nome mantido do video 6)
const HX = T.map((p) => tagNr(p.zeit));
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const DE = '#8fb0d6', FR = C.rot;
const SCHLACHT = tagNr('1870-09-01T04:00'), RING = tagNr('1870-09-01T14:00'), STUNDE_BIS = tagNr('1870-09-02T23:59');

type DB = {s: number; tag: number; lauf: boolean};
const DATIERT: DB[] = (PLAN.beats as any[]).filter((b) => b.datum).map((b) => ({s: b.s, tag: tagNr(b.datum), lauf: !!b.lauf}));
const GLEIT = 1.2;   // s para os numeros correrem ate a nova hora quando ela salta

const ruhe = (j: number): number => {
  const a = DATIERT[j], b = DATIERT[j + 1];
  return a.lauf && b ? b.tag : a.tag;
};
const tagBei = (tv: number): number | null => {
  let j = -1;
  for (let i = 0; i < DATIERT.length && DATIERT[i].s <= tv; i++) j = i;
  if (j < 0) return null;
  const a = DATIERT[j], b = DATIERT[j + 1];
  let ziel = a.tag;
  if (a.lauf && b) ziel = interpolate(tv, [a.s, b.s], [a.tag, b.tag], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (j === 0) return ziel;
  const vor = ruhe(j - 1);
  if (vor === a.tag) return ziel;
  const k = interpolate(tv - a.s, [0, GLEIT], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  return vor + (ziel - vor) * k;
};

const wert = (h: number, f: keyof Pkt): number => {
  if (h <= HX[0]) return T[0][f] as number;
  for (let i = 0; i < T.length - 1; i++) if (h <= HX[i + 1]) {
    const x = (h - HX[i]) / (HX[i + 1] - HX[i]);
    return (T[i][f] as number) * (1 - x) + (T[i + 1][f] as number) * x;
  }
  return T[T.length - 1][f] as number;
};
const zahl = (n: number) => Math.round(n).toLocaleString('de-DE');
const datum = (h: number) => {
  const d = new Date(T0 + h * H);
  const tag = `${d.getUTCDate()}. ${MONATE[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  if (h < SCHLACHT - 4 || h > STUNDE_BIS) return tag;
  const min = Math.floor(d.getUTCMinutes() / 15) * 15;   // relogio em quartos de hora: nao "pisca" minuto a minuto
  return `${tag} · ${String(d.getUTCHours()).padStart(2, '0')}:${String(min).padStart(2, '0')} Uhr`;
};

const Feld: React.FC<{label: string; n: number; farbe?: string; gross?: boolean}> = ({label, n, farbe = C.papier, gross}) => (
  <div style={{display: 'flex', flexDirection: 'column', gap: 2}}>
    <div style={{fontFamily: F1870.antiqua, fontSize: 15, letterSpacing: 1.5, color: C.grau, fontVariant: 'small-caps'}}>{label}</div>
    <div style={{fontFamily: F.mono, fontSize: gross ? 27 : 22, fontWeight: 500, color: farbe}}>{zahl(n)}</div>
  </div>
);
const Seite: React.FC<{name: string; farbe: string; children: React.ReactNode}> = ({name, farbe, children}) => (
  <div style={{display: 'flex', alignItems: 'flex-end', gap: 26}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 9, alignSelf: 'center'}}>
      <div style={{width: 12, height: 12, background: farbe}} />
      <div style={{fontFamily: F1870.antiqua, fontWeight: 700, fontSize: 19, letterSpacing: 2, color: C.papier}}>{name}</div>
    </div>
    {children}
  </div>
);

export const Zaehler: React.FC<{tv: number; beat: any}> = ({tv, beat}) => {
  const h = tagBei(tv);
  if (h === null || !DATIERT.length) return null;
  const an = interpolate(tv - DATIERT[0].s, [0, 0.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const o = an * (beat.zaehler === false ? 0 : 1);
  if (o <= 0.001) return null;
  const kampf = h >= SCHLACHT;
  return (
    <div style={{position: 'absolute', left: 40, right: 260, bottom: 26, height: 74, opacity: o, display: 'flex', alignItems: 'center', gap: 36,
      padding: '0 26px', background: 'linear-gradient(90deg, rgba(13,15,18,0.86), rgba(13,15,18,0.72))', borderTop: `1px solid ${C.sepia}`}}>
      <div style={{fontFamily: F1870.antiqua, fontSize: 25, color: C.signal, minWidth: 360, whiteSpace: 'nowrap'}}>{datum(h)}</div>
      <Seite name="DEUTSCHE" farbe={DE}>
        <Feld label={kampf ? 'im Gefecht' : 'im Anmarsch'} n={wert(h, 'de_feld')} farbe={DE} gross />
        <Feld label={kampf ? 'Geschütze in Stellung' : 'Geschütze'} n={wert(h, 'de_gesch')} />
        <Feld label="Verluste" n={wert(h, 'de_verl_kum')} />
      </Seite>
      <div style={{width: 1, alignSelf: 'stretch', margin: '14px 0', background: C.linie}} />
      <Seite name="FRANZOSEN" farbe={FR}>
        <Feld label={h >= RING ? 'im Kessel' : 'im Feld'} n={wert(h, 'fr_feld')} farbe={FR} gross />
        <Feld label="Verluste" n={wert(h, 'fr_verl_kum')} />
        <Feld label="gefangen" n={wert(h, 'fr_gef_kum')} />
      </Seite>
    </div>
  );
};
