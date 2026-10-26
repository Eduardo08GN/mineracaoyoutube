// Contador de efetivos do video 6 (o roteiro promete no cap. 2: "Unten im Bild läuft ab jetzt ein Zähler mit").
// Le a serie diaria tage.json (copia de fisica/tage.json). A data vem das batidas do plano: campo `datum` (ISO) na batida;
// `lauf: true` = a data corre ate a proxima batida datada; `zaehler: false` = esconde nesta batida. Funcao pura do tempo.
import React from 'react';
import {Easing, interpolate} from 'remotion';
import TAGE from './tage.json';
import {PLAN} from './tempo';
import {C, F} from './ui/basis';
import {F1870} from './look/epoche';

type Tag = {datum: string; de_feld: number; fr_feld: number; metz: number; paris: number; de_verl_kum: number; fr_verl_kum: number; fr_gef_int_kum: number};
const T: Tag[] = (TAGE as any).tage;
const MS = 86400000;
const tagNr = (iso: string) => Math.round((Date.parse(iso + 'T12:00:00Z') - Date.parse(T[0].datum + 'T12:00:00Z')) / MS);
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const DE = '#8fb0d6', FR = C.rot;

type DB = {s: number; tag: number; lauf: boolean};
const DATIERT: DB[] = (PLAN.beats as any[]).filter((b) => b.datum).map((b) => ({s: b.s, tag: tagNr(b.datum), lauf: !!b.lauf}));
const GLEIT = 1.2;   // s para os numeros correrem ate a nova data quando ela salta

const ruhe = (j: number): number => {   // dia em que o trecho j termina
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

const wert = (tag: number, f: keyof Tag): number => {
  const i = Math.max(0, Math.min(T.length - 1, Math.floor(tag))), j = Math.min(T.length - 1, i + 1), x = tag - Math.floor(tag);
  return (T[i][f] as number) * (1 - x) + (T[j][f] as number) * x;
};
const zahl = (n: number) => Math.round(n).toLocaleString('de-DE');
const datum = (tag: number) => {
  const d = new Date(Date.parse(T[0].datum + 'T12:00:00Z') + Math.round(tag) * MS);
  return `${d.getUTCDate()}. ${MONATE[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
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
  const tag = tagBei(tv);
  if (tag === null || !DATIERT.length) return null;
  const an = interpolate(tv - DATIERT[0].s, [0, 0.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const o = an * (beat.zaehler === false ? 0 : 1);
  if (o <= 0.001) return null;
  const ein = wert(tag, 'metz') + wert(tag, 'paris');
  return (
    <div style={{position: 'absolute', left: 40, right: 260, bottom: 26, height: 74, opacity: o, display: 'flex', alignItems: 'center', gap: 40,
      padding: '0 26px', background: 'linear-gradient(90deg, rgba(13,15,18,0.86), rgba(13,15,18,0.72))', borderTop: `1px solid ${C.sepia}`}}>
      <div style={{fontFamily: F1870.antiqua, fontSize: 30, color: C.signal, minWidth: 250}}>{datum(tag)}</div>
      <Seite name="DEUTSCHE" farbe={DE}>
        <Feld label="im Feld" n={wert(tag, 'de_feld')} farbe={DE} gross />
        <Feld label="Verluste" n={wert(tag, 'de_verl_kum')} />
      </Seite>
      <div style={{width: 1, alignSelf: 'stretch', margin: '14px 0', background: C.linie}} />
      <Seite name="FRANZOSEN" farbe={FR}>
        <Feld label="im Feld" n={wert(tag, 'fr_feld')} farbe={FR} gross />
        <Feld label="eingeschlossen" n={ein} />
        <Feld label="Verluste" n={wert(tag, 'fr_verl_kum')} />
        <Feld label="gefangen / interniert" n={wert(tag, 'fr_gef_int_kum')} />
      </Seite>
    </div>
  );
};
