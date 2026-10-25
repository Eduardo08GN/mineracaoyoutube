// Identidade visual dos canais de guerra (Tracer3D) (todos os agentes usam): cores, fontes e pecas de HUD.
// Grafite escuro + papel envelhecido; amarelo de sinal para numeros; vermelho para perigo/erro; ciano para engenharia.
// Tudo funcao do tempo local t (segundos desde o inicio da batida): nada de estado, nada de relogio.
import React from 'react';
import {interpolate, Easing} from 'remotion';
import {loadFont as oswald} from '@remotion/google-fonts/Oswald';
import {loadFont as plexCond} from '@remotion/google-fonts/IBMPlexSansCondensed';
import {loadFont as plexMono} from '@remotion/google-fonts/IBMPlexMono';
import {loadFont as symbole} from '@remotion/google-fonts/NotoSansSymbols2';

// fallback para ✓ ✕ → etc.: o Chrome da G4 (Linux) nao tem esses glifos nas fontes do sistema
const SYM = symbole('normal', {weights: ['400']}).fontFamily;

export const F = {
  titel: oswald('normal', {weights: ['400', '500', '600', '700'], subsets: ['latin', 'latin-ext']}).fontFamily + ', ' + SYM,
  text: plexCond('normal', {weights: ['400', '500', '600'], subsets: ['latin', 'latin-ext']}).fontFamily + ', ' + SYM,
  mono: plexMono('normal', {weights: ['400', '500', '600'], subsets: ['latin', 'latin-ext']}).fontFamily + ', ' + SYM,
};

export const C = {
  grund: '#0d0f12',      // fundo
  grund2: '#161a1f',     // cartoes
  linie: '#2a3038',      // grades e bordas
  papier: '#e9e1cf',     // texto principal (papel envelhecido)
  grau: '#8d949c',       // texto secundario
  signal: '#f2c14e',     // numeros e destaque
  rot: '#d9483b',        // perigo, erro, "unerreichbar"
  cyan: '#5ec8e5',       // engenharia, ar rarefeito
  orange: '#e8873a',     // ar denso, arrasto
  gruen: '#7fbf6a',      // canhao / Crepy
  sepia: '#b8a27a',      // mapas de epoca
};

const cl = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
// 0..1 entre a e b (com suavizacao)
export const fase = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {...cl, easing: Easing.bezier(0.33, 0, 0.2, 1)});
// entra em `em` (dur s) e sai em `ate` (se dado)
export const sichtbar = (t: number, em = 0, dur = 0.35, ate?: number) =>
  Math.min(fase(t, em, em + dur), ate === undefined ? 1 : 1 - fase(t, ate - dur, ate));

// chip pequeno de HUD (ex.: 'FLUGZEUG ✕')
export const Chip: React.FC<{t: number; em?: number; ate?: number; cor?: string; riscado?: boolean; children: React.ReactNode; style?: React.CSSProperties}> =
  ({t, em = 0, ate, cor = C.papier, riscado, children, style}) => {
    const o = sichtbar(t, em, 0.3, ate);
    return (
      <div style={{display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', border: `1.5px solid ${cor}`, color: cor, background: 'rgba(13,15,18,0.72)',
        fontFamily: F.mono, fontSize: 26, letterSpacing: 1.5, textTransform: 'uppercase', opacity: o, transform: `translateY(${(1 - o) * 12}px)`,
        textDecoration: riscado ? 'line-through' : undefined, textDecorationColor: C.rot, textDecorationThickness: 3, ...style}}>{children}</div>
    );
  };

// rotulo com fio (para pinos de mapa e marcadores)
export const Etikett: React.FC<{t: number; em?: number; titel: string; unter?: string; cor?: string; style?: React.CSSProperties}> =
  ({t, em = 0, titel, unter, cor = C.papier, style}) => {
    const o = sichtbar(t, em);
    return (
      <div style={{opacity: o, color: cor, ...style}}>
        <div style={{fontFamily: F.titel, fontWeight: 500, fontSize: 40, letterSpacing: 1, textShadow: '0 2px 10px rgba(0,0,0,0.8)'}}>{titel}</div>
        {unter && <div style={{fontFamily: F.mono, fontSize: 22, color: C.grau, textShadow: '0 2px 8px rgba(0,0,0,0.8)'}}>{unter}</div>}
      </div>
    );
  };

// numero que conta de a ate b entre em e em+dur
export const zaehle = (t: number, a: number, b: number, em = 0, dur = 1) => a + (b - a) * fase(t, em, em + dur);

// painel de HUD de telemetria (canto superior esquerdo): linhas chave/valor em mono
export const Hud: React.FC<{t: number; em?: number; zeilen: [string, string][]; titel?: string; style?: React.CSSProperties}> = ({t, em = 0, zeilen, titel, style}) => {
  const o = sichtbar(t, em);
  return (
    <div style={{position: 'absolute', left: 64, top: 64, padding: '18px 24px', minWidth: 330, background: 'rgba(13,15,18,0.66)', borderLeft: `3px solid ${C.signal}`,
      fontFamily: F.mono, color: C.papier, opacity: o, ...style}}>
      {titel && <div style={{fontSize: 20, letterSpacing: 3, color: C.grau, marginBottom: 8}}>{titel}</div>}
      {zeilen.map(([k, v]) => (
        <div key={k} style={{display: 'flex', justifyContent: 'space-between', gap: 28, fontSize: 30, lineHeight: '44px'}}>
          <span style={{color: C.grau}}>{k}</span><span style={{color: C.signal, fontVariantNumeric: 'tabular-nums'}}>{v}</span>
        </div>
      ))}
    </div>
  );
};

// marca d'agua do canal e selo de simulacao (sempre que houver cena calculada)
// canal de destino do video: nome da marca d'agua e do CTA (Kriegsmomente desde o video 3, 24/10/2026)
export const KANAL = 'Kriegsmomente';
// creditos/licencas de dados NAO aparecem na imagem, so na descricao do video (pedido do Eduardo, 24/10/2026)
export const QUELLEN_IM_BILD = false;
// marca d'agua so com o nome do canal (sem 'SIMULATION', pedido de 24/10/2026)
export const Kanal: React.FC<{art?: string}> = ({art}) => (
  <div style={{position: 'absolute', right: 48, bottom: 36, fontFamily: F.mono, fontSize: 18, letterSpacing: 2, color: 'rgba(233,225,207,0.45)'}}>@{KANAL}{art ? ` · ${art}` : ''}</div>
);

// titulo de capitulo / cartao grande
export const Titel: React.FC<{t: number; em?: number; ate?: number; text: string; unter?: string; groesse?: number}> = ({t, em = 0, ate, text, unter, groesse = 96}) => {
  const o = sichtbar(t, em, 0.5, ate);
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: o}}>
      <div style={{fontFamily: F.titel, fontWeight: 600, fontSize: groesse, letterSpacing: 6, color: C.papier, textTransform: 'uppercase',
        transform: `translateY(${(1 - o) * 20}px)`, textShadow: '0 4px 30px rgba(0,0,0,0.9)'}}>{text}</div>
      {unter && <div style={{marginTop: 18, fontFamily: F.mono, fontSize: 30, letterSpacing: 4, color: C.signal}}>{unter}</div>}
    </div>
  );
};
