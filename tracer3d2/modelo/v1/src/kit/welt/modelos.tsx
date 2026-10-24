// Kit welt · REGISTRO DE MODELOS 3D da cena Modell. Cada video novo registra aqui os modelos feitos pelo agente de codigo
// (componente R3F em metros, y para cima, origem no chao) e a cena Modell escolhe por nome: {"modelo": "MGeraet", "opcoes": {...}}.
//   registraModelo('Nome', {C: Componente, doc: 'opcoes', ancoras: {nome: (opcoes, arg) => [x, y, z]}})
// `ancoras` deixa o planejador apontar rotulos/cotas por nome ({"ancora": "boca"}) em vez de coordenadas.
// Modelos que ja existem (welt/m_*, video 2): MGeraet (M-Geraet 42 cm; gamma=true: Gamma-Geraet), Granate, Schlepper, Wagen, Moerser21Reihe,
// Kran, Lkw, Regal, RegalGranaten, Bohlenplatz, Leute (silhuetas).
import React from 'react';
import {MGeraet, Granate, MM, mundung, rohrPunkt} from '../../welt/m_moerser';
import {Schlepper, Wagen, Moerser21Reihe, Leute} from '../../welt/m_transport';
import {Kran, Lkw, Regal, RegalGranaten, Bohlenplatz} from '../../welt/m_bausteine';

export type P3 = [number, number, number];
export type ModeloDef = {C: React.FC<any>; doc: string; ancoras?: Record<string, (o: any, arg?: any) => P3>};
export const MODELOS: Record<string, ModeloDef> = {};
export const registraModelo = (nome: string, def: ModeloDef) => { MODELOS[nome] = def; };

const pos = (o: any): P3 => o.position ?? [0, 0, 0];
const soma = (a: P3, b: P3): P3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

registraModelo('MGeraet', {
  C: (o) => <MGeraet {...o} />,
  doc: 'obuseiro 42 cm: elev (graus 0..65), zerlegt (0..1 vista explodida), gamma (Gamma-Geraet maior), dunkel, rueck, keil, teile, skala, position, gier',
  ancoras: {
    boca: (o) => soma(mundung(o.elev ?? 0, o.rueck ?? 0), pos(o)),
    culatra: (o) => soma(rohrPunkt(MM.hinten, o.elev ?? 0), pos(o)),
    rohr: (o, a) => soma(rohrPunkt(a?.x ?? 1.5, o.elev ?? 0, a?.dy ?? 0), pos(o)),
    centro: (o) => soma([0.6, 3.3, 0], pos(o)),
    topo: (o) => soma([0.6, 6.6, 0], pos(o)),
  },
});
registraModelo('Granate', {C: (o) => <Granate {...o} />, doc: 'granada: kaliber 42|21, position, rotation, skala, farbe'});
registraModelo('Schlepper', {C: (o) => <Schlepper {...o} />, doc: 'trator de artilharia: position, gier, rollen, licht, farbe'});
registraModelo('Wagen', {C: (o) => <Wagen {...o} />, doc: 'carreta: position, gier, rollen, last (bettung|lafette|wiege|rohr|zubehoer), plane, farbe'});
registraModelo('Moerser21Reihe', {C: (o) => <Moerser21Reihe {...o} />, doc: 'fileira de morteiros 21 cm: liste [{x,z,ry,elev}]'});
registraModelo('Kran', {C: (o) => <Kran {...o} />, doc: 'guindaste de campanha: mast [x,z], ziel [x,y,z], hoehe, ausleger'});
registraModelo('Lkw', {C: (o) => <Lkw {...o} />, doc: 'caminhao: position, gier'});
registraModelo('Regal', {C: (o) => <Regal {...o} />, doc: 'prateleira de ferro: position'});
registraModelo('RegalGranaten', {C: (o) => <RegalGranaten {...o} />, doc: 'granadas na prateleira: regal [x,y,z], n'});
registraModelo('Bohlenplatz', {C: (o) => <Bohlenplatz {...o} />, doc: 'plataforma de pranchas: position, b, l'});
registraModelo('Leute', {C: (o) => <Leute {...o} />, doc: 'silhuetas de pessoas: figuren [{x,z,ry,pose,s}] (pose: stehen|gehen|tragen|buecken|kurbeln|zeigen|sitzen|heben|schieben)'});
