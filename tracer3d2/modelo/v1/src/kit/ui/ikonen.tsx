// Ikonen (100 x 100) fuer Liste/Checkliste. p = Einblendung 0..1 (zeichnet sich), tv = Szenenzeit (fuer Pulsieren).
import React from 'react';
import {C, F, fase} from '../../ui/basis';
import {zeichne} from '../../ui/u1_heft';

type IK = React.FC<{p: number; tv: number; farbe?: string}>;

const Rechner: IK = ({p}) => (
  <svg width={100} height={100}>
    <rect x={14} y={8} width={72} height={84} rx={6} fill="none" stroke={C.papier} strokeWidth={3} {...zeichne(p, 'M20 8H80Q86 8 86 14V86Q86 92 80 92H20Q14 92 14 86V14Q14 8 20 8Z')} />
    <rect x={24} y={18} width={52} height={20} fill={C.papier} fillOpacity={0.2 * p} stroke={C.papier} strokeOpacity={0.5 * p} />
    {[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => <rect key={r * 3 + c} x={24 + c * 18} y={48 + r * 14} width={12} height={8} fill={C.papier} fillOpacity={0.6 * fase(p, 0.3 + (r * 3 + c) * 0.05, 0.8)} />))}
  </svg>
);
const Atmo: IK = ({p, farbe = C.cyan}) => {
  const d = 'M90 88 C 60 82, 40 70, 30 50 C 22 34, 16 22, 12 8';
  return (
    <svg width={100} height={100}>
      {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={6} x2={96} y1={90 - i * 20} y2={90 - i * 20} stroke={farbe} strokeOpacity={(0.55 - i * 0.09) * p} strokeWidth={2} />)}
      <path d={d} fill="none" stroke={farbe} strokeWidth={3.5} strokeLinecap="round" {...zeichne(p, d)} />
    </svg>
  );
};
const Kurve: IK = ({p, farbe = C.orange}) => {
  const d = 'M6 78 C 26 78, 34 74, 40 26 C 44 12, 50 14, 56 34 S 76 56, 96 60';
  return (
    <svg width={100} height={100}>
      <path d="M6 6V92H96" fill="none" stroke="rgba(233,225,207,0.45)" strokeWidth={2} {...zeichne(p, 'M6 6V92H96')} />
      <line x1={44} x2={44} y1={10} y2={92} stroke={farbe} strokeOpacity={0.35 * p} strokeDasharray="4 4" strokeWidth={1.5} />
      <path d={d} fill="none" stroke={farbe} strokeWidth={3.5} strokeLinecap="round" {...zeichne(p, d)} />
    </svg>
  );
};
const Beton: IK = ({p, farbe = C.signal}) => {
  const riss = 'M52 10 L46 30 L58 44 L48 62 L56 90';
  return (
    <svg width={100} height={100}>
      <rect x={10} y={14} width={80} height={72} fill="rgba(233,225,207,0.08)" stroke={C.papier} strokeWidth={3} strokeOpacity={0.9} />
      {[[22, 30], [70, 26], [30, 70], [74, 66], [40, 48], [66, 48]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3.2} fill={C.papier} fillOpacity={0.35 * p} />)}
      <path d={riss} fill="none" stroke={farbe} strokeWidth={3.2} strokeLinecap="round" {...zeichne(fase(p, 0.3, 1), riss)} />
    </svg>
  );
};
const Quellen: IK = ({p, tv, farbe = C.signal}) => (
  <svg width={100} height={100}>
    <line x1={12} x2={88} y1={80} y2={80} stroke={farbe} strokeOpacity={0.5 * p} strokeWidth={2} />
    <circle cx={28 - 6 * p} cy={46} r={14} fill="none" stroke={farbe} strokeWidth={3.4} opacity={p} />
    <circle cx={72 + 6 * p} cy={46} r={14} fill={farbe} fillOpacity={0.28} stroke={farbe} strokeWidth={3.4} opacity={p} />
    <path d="M38 46H62" stroke={farbe} strokeWidth={2.4} strokeDasharray="4 5" opacity={p * (0.5 + 0.5 * Math.sin(tv * 6))} />
    <text x={50} y={24} fill={farbe} fontFamily={F.titel} fontSize={30} textAnchor="middle" fontWeight={600} opacity={p}>≠</text>
  </svg>
);
const Schaetzung: IK = ({p, farbe = C.grau}) => (
  <svg width={100} height={100}>
    <rect x={14} y={38} width={72 * p} height={24} fill="none" stroke={farbe} strokeWidth={3} strokeDasharray="8 6" />
    <path d="M14 26V74M86 26V74M14 50H86" stroke={farbe} strokeWidth={2.4} strokeDasharray="5 5" opacity={p} />
  </svg>
);
const Haken: IK = ({p, farbe = C.gruen}) => {
  const d = 'M16 54 L40 78 L86 22';
  return <svg width={100} height={100}><path d={d} fill="none" stroke={farbe} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" {...zeichne(p, d)} /></svg>;
};
const Kreuz: IK = ({p, farbe = C.rot}) => (
  <svg width={100} height={100}>
    <path d="M22 22L78 78" stroke={farbe} strokeWidth={9} strokeLinecap="round" {...zeichne(fase(p, 0, 0.55), 'M22 22L78 78')} />
    <path d="M78 22L22 78" stroke={farbe} strokeWidth={9} strokeLinecap="round" {...zeichne(fase(p, 0.45, 1), 'M78 22L22 78')} />
  </svg>
);
const Warnung: IK = ({p, farbe = C.signal}) => {
  const d = 'M50 12 L92 86 H8 Z';
  return (
    <svg width={100} height={100}>
      <path d={d} fill={farbe} fillOpacity={0.12 * p} stroke={farbe} strokeWidth={4} strokeLinejoin="round" {...zeichne(p, d)} />
      <path d="M50 38V62" stroke={farbe} strokeWidth={6} strokeLinecap="round" opacity={fase(p, 0.5, 1)} />
      <circle cx={50} cy={74} r={4.5} fill={farbe} opacity={fase(p, 0.5, 1)} />
    </svg>
  );
};
const Info: IK = ({p, farbe = C.cyan}) => (
  <svg width={100} height={100}>
    <circle cx={50} cy={50} r={38} fill="none" stroke={farbe} strokeWidth={4} {...zeichne(p, 'M12 50a38 38 0 1 0 76 0a38 38 0 1 0 -76 0')} />
    <circle cx={50} cy={32} r={4.5} fill={farbe} opacity={fase(p, 0.5, 1)} />
    <path d="M50 46V70" stroke={farbe} strokeWidth={6} strokeLinecap="round" opacity={fase(p, 0.5, 1)} />
  </svg>
);
const Punkt: IK = ({p, farbe = C.papier}) => <svg width={100} height={100}><circle cx={50} cy={50} r={14 * p} fill={farbe} /></svg>;
const Bogen: IK = ({p, farbe = C.orange}) => {
  const d = 'M10 80 C 26 6, 70 6, 92 78';
  return <svg width={100} height={100}><path d={d} fill="none" stroke={farbe} strokeWidth={4} strokeDasharray="8 7" opacity={p} /><circle cx={10} cy={80} r={6} fill={farbe} opacity={p} /></svg>;
};

export const IKONEN: Record<string, IK> = {rechner: Rechner, atmo: Atmo, kurve: Kurve, beton: Beton, quellen: Quellen, schaetzung: Schaetzung, haken: Haken, kreuz: Kreuz, warnung: Warnung, info: Info, punkt: Punkt, bogen: Bogen};
export const Ikon: React.FC<{name: string; p: number; tv: number; farbe?: string; groesse?: number}> = ({name, p, tv, farbe, groesse = 100}) => {
  const K = IKONEN[name] ?? Punkt;
  return <div style={{width: groesse, height: groesse}}><div style={{transform: `scale(${groesse / 100})`, transformOrigin: '0 0', width: 100, height: 100}}><K p={p} tv={tv} farbe={farbe} /></div></div>;
};
