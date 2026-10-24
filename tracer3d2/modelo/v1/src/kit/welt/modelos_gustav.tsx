// Kit welt · modelos do video 4 (Schwerer Gustav, 24/10/2026): registrados em modelos.tsx via registraModelo, usados pela cena Modell.
//   Gustav        canhao 80 cm completo: elev 0..48, rueck (m) | tiro (s desde o disparo), zerlegt 0..1 (vista explodida), verladen 0..1 (pecas nos vagoes),
//                 tarn 0..1 (rede de camuflagem), glow 0..1, bauplan 0..1 (0 = so linhas de projeto, 1 = solido), truckAn 0..8 (trucks acesos), achsenAn (0|1),
//                 transp 0..1, rohrGlow 0..1, skala, position, gier; ancoras: boca culatra rohr(arg.s) zapfen centro topo truck(arg.i) deck
//   GustavRohr    corte longitudinal do tubo (origem = culatra, eixo +x): granateS (s da base da granada), granate beton|spreng|keine, pulver 0..1, glut 0..1,
//                 druck 0..1, verschleiss 0..1, rohrGlow, schnitt (bool), ladung (m de comprimento da carga); ancoras: culatra boca kammer granate
//   Betongranate / Sprenggranate  granada de 7,1 t (6,79 m) / 4,8 t: stehend, ry (graus), schnitt, mantelGlow, hoehleGlow, skala; ancoras: boden spitze mitte
//   Kleinwagen    carros pequenos em fila: n (0..5, float = entrando um a um), abstand, skala
//   Haus4         predio de 4 andares em aramado translucido: wire 0..1
//   Portal        portico de montagem: katzeX, hakenY, spann, hoehe
//   Flachwagen    vagao plataforma de 19 m;  VerladeZug  2 fileiras de vagoes de plataforma + vias (destino do Gustav desmontado)
import React from 'react';
import {Muendungsfeuer} from '../../welt/m_moerser';
import {registraModelo, P3} from './modelos';
import {Gustav, GustavRohr, GranateG, Kleinwagen, Haus4, Portal, Flachwagen, Gleis, Anel, Kriecher, G, mundungG, verschlussG, rohrWelt, rueckweg, granateLaenge, ZW, WAGEN_X} from '../../welt/g4_gustav_modell';

const pos = (o: any): P3 => o.position ?? [0, 0, 0];
const mais = (a: P3, b: P3): P3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const rk = (o: any) => o.rueck ?? rueckweg(o.tiro ?? -1);

registraModelo('Gustav', {
  C: (o) => <Gustav {...o} />,
  doc: 'Schwerer Gustav: elev 0..48, rueck|tiro, zerlegt, verladen, tarn, glow, bauplan, truckAn, achsenAn, transp, rohrGlow, skala, position, gier',
  ancoras: {
    boca: (o) => mais(mundungG(o.elev ?? 0, rk(o)), pos(o)),
    culatra: (o) => mais(verschlussG(o.elev ?? 0, rk(o)), pos(o)),
    rohr: (o, a) => mais(rohrWelt(-G.sT + (a?.s ?? 16) - rk(o), a?.dy ?? 0, o.elev ?? 0), pos(o)),
    zapfen: (o) => mais([0, G.yT, 0], pos(o)),
    centro: (o) => mais([-4, 5, 0], pos(o)),
    topo: (o) => mais([0, G.H, 0], pos(o)),
    deck: (o, a) => mais([a?.x ?? 0, 3.7, a?.z ?? 0], pos(o)),
    truck: (o, a) => mais([G.truckX[(a?.i ?? 0) % 4], 0.9, (a?.i ?? 0) < 4 ? -G.zSpur : G.zSpur], pos(o)),
  },
});
registraModelo('GustavRohr', {
  C: (o) => <GustavRohr {...o} />,
  doc: 'Rohr im Laengsschnitt (Ursprung Verschlussflaeche): granateS, granate, pulver, glut, druck, verschleiss, rohrGlow, schnitt, ladung, elev, position',
  ancoras: {
    culatra: (o) => pos(o),
    boca: (o) => mais([G.rohrL, 0, 0], pos(o)),
    kammer: (o) => mais([3, 0, 0], pos(o)),
    granate: (o, a) => mais([(o.granateS ?? 5.2) + (a?.dx ?? 0), a?.dy ?? 0, a?.dz ?? 0], pos(o)),
    rohr: (o, a) => mais([a?.s ?? 16, a?.dy ?? 0, a?.dz ?? 0], pos(o)),
  },
});
const granateModell = (typ: 'beton' | 'spreng') => ({
  C: (o: any) => {
    const {stehend = true, ry = 0, position = [0, 0, 0], skala = 1, ...r} = o;
    return <group position={position} rotation={[0, ry * Math.PI / 180, 0]} scale={skala}><GranateG granate={typ} rotation={stehend ? [0, 0, Math.PI / 2] : [0, 0, 0]} {...r} /></group>;
  },
  doc: 'granada ' + typ + ': stehend (true = em pe), ry (graus), schnitt, mantelGlow, hoehleGlow, skala, position',
  ancoras: {
    boden: (o: any) => mais([0, 0, 0], pos(o)), spitze: (o: any) => mais(o.stehend === false ? [granateLaenge(typ) * (o.skala ?? 1), 0, 0] : [0, granateLaenge(typ) * (o.skala ?? 1), 0], pos(o)),
    mitte: (o: any) => mais(o.stehend === false ? [granateLaenge(typ) * (o.skala ?? 1) / 2, 0, 0] : [0, granateLaenge(typ) * (o.skala ?? 1) / 2, 0], pos(o)),
    rand: (o: any, a: any) => mais([0.4 * (o.skala ?? 1) + (a?.dx ?? 0), (a?.y ?? 0.5) * granateLaenge(typ) * (o.skala ?? 1), 0], pos(o)),
  },
});
registraModelo('Betongranate', granateModell('beton'));
registraModelo('Sprenggranate', granateModell('spreng'));
registraModelo('Kleinwagen', {C: (o) => <Kleinwagen {...o} />, doc: 'carros pequenos (~1,4 t): n (0..5), abstand, farben, position, gier, skala'});
registraModelo('Haus4', {C: (o) => <Haus4 {...o} />, doc: 'predio de 4 andares (12 m) em aramado: wire 0..1, position, breite, tiefe',
  ancoras: {topo: (o) => mais([0, o.hoehe ?? 12, 0], pos(o)), fuss: (o) => pos(o)}});
registraModelo('Anel', {C: (o) => <Anel {...o} />, doc: 'anel de destaque (torus) em torno do eixo +x: position, raio, cor, sichtbar, elev'});
registraModelo('Portal', {C: (o) => <Portal {...o} />, doc: 'portico de montagem: spann, hoehe, katzeX, hakenY, position, gier'});
registraModelo('Flachwagen', {C: (o) => <Flachwagen {...o} />, doc: 'vagao plataforma 19 m: position, gier, farbe'});
registraModelo('GleisG4', {C: (o) => <Gleis {...o} />, doc: 'duas vias (4 trilhos S49) com dormentes e lastro: laenge, zentren, glow, cor, rot, position'});
registraModelo('VerladeZug', {
  C: ({sichtbar = 1}: any) => (
    <group visible={sichtbar > 0.01}>
      {[ZW, -ZW].map((z) => <Gleis key={z} laenge={150} zentren={[z]} position={[0, 0, 0]} />)}
      {[ZW, -ZW].map((z) => WAGEN_X.map((x) => <Flachwagen key={z + ':' + x} position={[x, 0.55, z]} />))}
    </group>
  ),
  doc: 'duas fileiras de vagoes de plataforma (z = +-17,5 m) com vias; destino de Gustav {verladen: 1}',
});
registraModelo('Kriecher', {C: (o) => <Kriecher {...o} />, doc: 'figura humana de 1,80 m engatinhando (+x): position, ry, lauf (m percorridos), skala, sichtbar'});
registraModelo('Feuer', {C: ({t, t0 = 0, pos = [0, 0, 0], dir = [1, 0, 0], skala = 2, zeit = 1, licht = 1, boden = false, rauchMenge = 1}: any) => <Muendungsfeuer t={t} t0={t0} pos={pos} dir={dir} skala={skala} zeit={zeit} licht={licht} boden={boden} rauchMenge={rauchMenge} />,
  doc: 'clarao de boca + fumaca (flipbook): t0 (s), pos, dir, skala, zeit (camera lenta < 1), licht, boden, rauchMenge'});
