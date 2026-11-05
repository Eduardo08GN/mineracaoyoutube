// Die Pontonbrücke, aus Code gebaut, in Metern. Methode des Telegrafen (K15): EIN Eingang treibt alles.
// Eingang: bau = gebaute Brückenfelder (Gleitkommazahl). Feld i: Ponton fährt ein und setzt auf (0–0,3), Ankertau (0,3–0,45),
// fünf Streckbalken fallen auf die Bordwände (0,45–0,7), der Belag wird Brett für Brett gelegt (0,7–1). Dazu: Strömung (m/s)
// für die Fließlinien, biege (0..1) für den Halbmond von Novéant (11./12.9.1870).
// Maße (DOSSIE §3): hölzerner preußischer Ponton 7,21 × 1,52 × 0,76 m, 514 kg (Lovell, RUSI 1866); Querschnitt = Ellipsensegment,
// Bug und Heck gerundet; Feldweite 4,4 m (Juvisy: 141 m / 32 Stützen); 5 Streckbalken (Meyers 1907); Belag quer, ~3,4 m.
// Achsen: x = Brückenachse (Ufer bei x = 0, Fluss nach +x), y = oben (Wasserspiegel 0,02), z = Fließrichtung (stromab = +z).
import * as THREE from 'three';

const V3 = THREE.Vector3;
export const L = 7.21, B = 1.52, T = 0.76, FELD = 4.4, X0 = 3.2, FREIBORD = 0.36, WASSER = 0.02;
export const ACC = '#a4402a';
const BALKEN_Z = [-1.2, -0.6, 0, 0.6, 1.2];
const BRETTER = 14;

function rumpf() {
  // Gitter: nz Stationen entlang z, na Punkte über den Halbellipsen-Schnitt (offen nach oben)
  const nz = 48, na = 24, pos = [], idx = [];
  for (let i = 0; i <= nz; i++) {
    const s = -1 + (2 * i) / nz, z = (s * L) / 2;
    const e = Math.pow(Math.abs(s), 7);
    const w = (B / 2) * Math.sqrt(Math.max(0.04, 1 - e)), d = T * (1 - 0.55 * Math.pow(Math.abs(s), 5));
    for (let j = 0; j <= na; j++) {
      const a = Math.PI * (j / na);
      pos.push(Math.cos(a) * w, FREIBORD - Math.sin(a) * d, z);
    }
  }
  for (let i = 0; i < nz; i++) for (let j = 0; j < na; j++) {
    const p = i * (na + 1) + j, q = p + na + 1;
    idx.push(p, q, p + 1, q, q + 1, p + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function buildBruecke({felder = 6} = {}) {
  const root = new THREE.Group();
  const holz = new THREE.MeshStandardMaterial({color: '#7a5c40', roughness: 0.78, metalness: 0, side: THREE.DoubleSide});
  const eiche = new THREE.MeshStandardMaterial({color: '#5a4330', roughness: 0.7});
  const balkenM = new THREE.MeshStandardMaterial({color: '#a08060', roughness: 0.8});
  const brettM = new THREE.MeshStandardMaterial({color: '#b89a74', roughness: 0.85});
  const aktiv = new THREE.MeshStandardMaterial({color: '#b5624a', roughness: 0.75});
  const tauM = new THREE.LineBasicMaterial({color: '#3a3026'});
  const mesh = (g, m) => { const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = true; return o; };

  // Fluss: Band in Papier-Blaugrau, Ränder laufen ins Papier aus; Fließlinien wandern stromab (Shader, uZeit · uV)
  const flussM = new THREE.ShaderMaterial({transparent: true, depthWrite: false, uniforms: {uZeit: {value: 0}, uV: {value: 0.45}, uBreite: {value: X0 + FELD * felder + 4}},
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uZeit; uniform float uV; uniform float uBreite; varying vec3 vW;
      float h(float n){ return fract(sin(n) * 43758.5453); }
      void main(){
        float rand = smoothstep(0.0, 1.2, vW.x) * smoothstep(uBreite, uBreite - 1.2, vW.x);
        float laengs = smoothstep(30.0, 16.0, abs(vW.z));
        vec3 c = vec3(0.56, 0.64, 0.67);
        // Fließlinien: kurze Striche in Spalten, die mit der Strömung nach +z laufen
        float sp = floor(vW.x / 0.55); float off = h(sp) * 40.0;
        float zz = mod(vW.z - uZeit * uV * 2.2 + off, 6.0);
        float strich = smoothstep(0.06, 0.0, abs(fract(vW.x / 0.55) - 0.5) - 0.02) * smoothstep(0.0, 0.3, zz) * smoothstep(1.6, 0.9, zz) * step(0.55, h(sp * 3.1));
        c = mix(c, vec3(0.86, 0.90, 0.90), strich * 0.6);
        gl_FragColor = vec4(c, 0.62 * rand * laengs); }`});
  const fluss = new THREE.Mesh(new THREE.PlaneGeometry(X0 + FELD * felder + 4, 60).rotateX(-Math.PI / 2), flussM);
  fluss.position.set((X0 + FELD * felder + 4) / 2, WASSER, 0);
  fluss.renderOrder = 1;
  root.add(fluss);

  // Ufer: Erdband, etwas dunkler als das Papier, mit weichem Rand zum Fluss
  const ufer = new THREE.Mesh(new THREE.PlaneGeometry(10, 60).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({color: '#cbb894', roughness: 1}));
  ufer.position.set(-4.6, 0.012, 0); ufer.receiveShadow = true; root.add(ufer);
  // Bock am Ufer (Holm + zwei Beine), danach die Pontons
  const bock = new THREE.Group();
  bock.add(mesh(new THREE.BoxGeometry(0.2, 0.2, 3.4), eiche).translateY(FREIBORD + 0.05));
  for (const z of [-1.4, 1.4]) bock.add(mesh(new THREE.BoxGeometry(0.12, 1.4, 0.12), eiche).translateY(-0.3).translateZ(z));
  bock.position.x = 0.8;
  root.add(bock);

  const geo = rumpf();
  const P = [];
  for (let i = 0; i < felder; i++) {
    const g = new THREE.Group();
    const r = mesh(geo, holz.clone());
    g.add(r);
    for (const sx of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.07, 0.06, L * 0.96), eiche).translateX((sx * B) / 2).translateY(FREIBORD + 0.02));
    // Ankertau stromauf (zeichnet sich als Linie)
    const tau = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new V3(0, FREIBORD, -L / 2), new V3(0, -1.2, -L / 2 - 7)]), tauM);
    g.add(tau);
    root.add(g);
    // fünf Streckbalken vom vorigen Auflager zu diesem Ponton
    const balken = BALKEN_Z.map(() => { const b = mesh(new THREE.BoxGeometry(1, 0.13, 0.13), balkenM.clone()); root.add(b); return b; });
    const bretter = Array.from({length: BRETTER}, () => { const b = mesh(new THREE.BoxGeometry(0.29, 0.045, 3.4), brettM.clone()); root.add(b); return b; });
    P.push({g, r, tau, balken, bretter});
  }
  const xOf = (i) => X0 + i * FELD;
  let biegeAkt = 0;
  const zOf = (i) => biegeAkt * 3.2 * Math.sin((Math.PI * (i + 1)) / (felder + 1));
  const clamp = (x) => Math.min(1, Math.max(0, x));
  const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);

  const update = ({bau = felder, t = 0, v = 0.45, biege = 0} = {}) => {
    biegeAkt = biege;
    flussM.uniforms.uZeit.value = t;
    flussM.uniforms.uV.value = v;
    P.forEach((p, i) => {
      const f = bau - i;
      const fp = ease(f / 0.3), fa = clamp((f - 0.3) / 0.15), fb = clamp((f - 0.45) / 0.25), fd = clamp((f - 0.7) / 0.3);
      const z = zOf(i);
      p.g.visible = f > 0;
      // Ponton kommt stromauf herein und senkt sich auf die Wasserlinie
      p.g.position.set(xOf(i), WASSER + (1 - fp) * 0.9, z - (1 - fp) * 9);
      p.g.rotation.y = biege * 0.22 * Math.cos((Math.PI * (i + 1)) / (felder + 1));
      p.tau.visible = fa > 0;
      p.tau.geometry.setDrawRange(0, fa > 0.5 ? 2 : 0);
      const istAktiv = f > 0 && f < 1;
      p.r.material.color.set(istAktiv ? '#86604a' : '#7a5c40');
      // Balken: vom vorigen Auflager (Bock oder Ponton i-1) zu diesem
      const xa = i === 0 ? 0.8 : xOf(i - 1), za = i === 0 ? 0 : zOf(i - 1), xb = xOf(i), zb = z;
      const span = Math.hypot(xb - xa, zb - za), ang = Math.atan2(zb - za, xb - xa);
      p.balken.forEach((b, k) => {
        const kk = clamp(fb * 1.6 - k * 0.15);
        b.visible = kk > 0;
        b.scale.set(span, 1, 1);
        const cx = (xa + xb) / 2, cz = (za + zb) / 2 + BALKEN_Z[k];
        b.position.set(cx, WASSER + FREIBORD + 0.09 + (1 - ease(kk)) * 1.4, cz);
        b.rotation.set(0, -ang, 0);
        b.material.color.set(istAktiv && kk < 1 ? ACC : '#a08060');
      });
      p.bretter.forEach((b, k) => {
        const kk = clamp(fd * 1.15 * BRETTER - k);
        b.visible = kk > 0;
        const s = (k + 0.5) / BRETTER, x = xa + (xb - xa) * s, zz = za + (zb - za) * s;
        b.position.set(x, WASSER + FREIBORD + 0.18 + (1 - ease(kk)) * 0.6, zz);
        b.rotation.set(0, -ang, 0);
        b.material.color.set(istAktiv && kk < 1 ? '#c9846a' : '#b89a74');
      });
    });
  };
  update();
  const anchors = {
    ponton: (i) => P[i].g.localToWorld(new V3(0, FREIBORD, 0)),
    pontonBug: (i) => P[i].g.localToWorld(new V3(0, FREIBORD, -L / 2)),
    pontonSeite: (i) => P[i].g.localToWorld(new V3(B / 2, FREIBORD - 0.3, 0)),
    balken: (i) => P[i].balken[2].position.clone().add(new V3(0, 0.1, 0)),
    belag: (i) => P[i].bretter[7].position.clone(),
    anker: (i) => P[i].g.localToWorld(new V3(0, -0.6, -L / 2 - 3.5)),
    bock: () => new V3(0.8, WASSER + FREIBORD + 0.15, 1.7),
    ende: (bau) => new V3(xOf(Math.max(0, Math.min(felder - 1, Math.floor(bau)))), WASSER + FREIBORD + 0.3, 0),
  };
  return {root, update, anchors, xOf, felder};
}
