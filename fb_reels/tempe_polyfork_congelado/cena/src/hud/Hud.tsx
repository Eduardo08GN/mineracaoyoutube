// HUD editorial serifado (DOM por cima da cena, como no No Sleep): etapa + 3 pontos, bloco em tres niveis, legenda em itálico, rodape.
// Zonas livres do personagem: topo (<= 400 px) e a faixa da legenda (1390-1560 px); o personagem fica no miolo.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Estagio} from '../mundo/estagios';
import {BRANCO, ITALICO, SERIF, VERMELHO, VERSALETE} from './base';

const SOMBRA = '0 2px 16px rgba(0,0,0,0.6), 0 0 3px rgba(0,0,0,0.55)';
const SOMBRA_FORTE = '0 2px 4px rgba(0,0,0,0.85), 0 3px 22px rgba(0,0,0,0.85), 0 0 3px rgba(0,0,0,0.9)';

export const Hud: React.FC<{E: Estagio}> = ({E}) => (
  <AbsoluteFill style={{color: BRANCO}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 520, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0))'}} />
    <div style={{position: 'absolute', left: 0, top: 120, width: 760, height: 360, background: 'radial-gradient(ellipse at 30% 40%, rgba(0,0,0,0.5), rgba(0,0,0,0) 70%)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 1240, bottom: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5), rgba(0,0,0,0))'}} />
    {/* topo central: ETAPA n / 3 + 3 pontos (o ativo em vermelho) */}
    <div style={{position: 'absolute', top: 78, left: 0, right: 0, textAlign: 'center'}}>
      <div style={{fontFamily: VERSALETE, fontSize: 25, letterSpacing: '0.34em', textShadow: SOMBRA, opacity: 0.92}}>ETAPA {E.n} / 3</div>
      <div style={{display: 'flex', justifyContent: 'center', gap: 16, marginTop: 20}}>
        {[1, 2, 3].map((i) => <div key={i} style={{width: 13, height: 13, borderRadius: 13, background: i === E.n ? VERMELHO : 'rgba(247,244,238,0.5)', boxShadow: '0 0 6px rgba(0,0,0,0.5)'}} />)}
      </div>
    </div>
    {/* topo esquerdo: tres niveis */}
    <div style={{position: 'absolute', top: 178, left: 66, textShadow: SOMBRA}}>
      <div style={{fontFamily: VERSALETE, fontSize: 23, letterSpacing: '0.24em', opacity: 1}}>{E.hud.kicker}</div>
      <div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 92, lineHeight: 1.0, marginTop: 10}}>{E.hud.hora}</div>
      <div style={{fontFamily: VERSALETE, fontSize: 21, letterSpacing: '0.24em', opacity: 0.95, marginTop: 14}}>{E.hud.sub}</div>
    </div>
    {/* legenda: terco inferior, acima dos 18% de baixo (y < 1574) */}
    <div style={{position: 'absolute', left: 96, right: 96, top: 1398, textAlign: 'center', fontFamily: ITALICO, fontStyle: 'italic', fontWeight: 800, fontSize: 52, lineHeight: 1.2, textShadow: SOMBRA_FORTE}}>
      {E.hud.legenda}
    </div>
    {/* rodape discreto */}
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 74, textAlign: 'center', fontFamily: VERSALETE, fontSize: 19, letterSpacing: '0.28em', opacity: 0.6, textShadow: SOMBRA}}>
      RECONSTRUCCIÓN · BASADA EN HECHOS REALES
    </div>
  </AbsoluteFill>
);
