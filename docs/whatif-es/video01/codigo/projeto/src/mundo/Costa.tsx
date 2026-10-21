// Orla equatorial: praia, calcadao com fonte, palmeiras, multidao, avenida com carros e cidade.
// O mar fica em z < costa. Parametros controlam a subida da agua, a gravidade, a ausencia de peso e o paredao de agua.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Ceu, Cirros, Luz, Mar, Nuvens, Sol, rnd, smooth, useTexturas} from './comum';
import {Estado, Fonte, Item, ItensR, MultidaoR, PalmeirasR, Pessoa, Predios, gerarPessoas, estadoPadrao} from './objetos';
import {faseJato} from '../fisica';

export type CostaP = {
  t: number; luz: Luz; foco: THREE.Vector3;
  costa?: number; nivel?: number;      // linha d'agua (z) e altura do mar
  g?: number;                          // gravidade efetiva (m/s2) para a fonte
  flutua?: number;                     // 0..1 ausencia de peso: objetos e pessoas sobem
  inunda?: number;                     // 0..1 a agua avancou sobre a praia: objetos boiando, gente correndo
  paredao?: number;                    // 0..1 o paredao de agua chegando
  cidade?: boolean;
  pier?: boolean;
  cam?: THREE.Vector3;
  pulo?: number;       // g efetiva relativa (0..1): parte dos parados pula, mais alto quanto menor
  desliza?: number;    // 0..1 tudo escorrega (Santa Monica)
  eu?: [number, number];  // onde voce esta (x, z)
  fugaT?: number;      // segundos desde que todos comecaram a fugir de voce (0 = ninguem foge)
  nevoa?: number;      // 0..1 vapor do mar fechando a vista
  agit?: number; espuma?: number;  // mar fervendo
  torres?: boolean;    // predios altos colados no calcadao (Honolulu)
  nuvensBaixas?: boolean;
  semFonte?: boolean;
  praca?: boolean;     // praca redonda com espelho d'agua em volta do chafariz (marco das aereas do original)
  jatos?: boolean;     // os 7 jatos verticais em fila
  jatoAlto?: boolean;  // um jato altissimo (sem peso)
};

// palmeiras do calcadao (exportadas para o fogo saber onde estao as copas)
export const posPalmeiras = () => {
  const out: {x: number; z: number; h: number; rot: number}[] = [];
  for (let x = -120; x <= 120; x += 9) { out.push({x: x + rnd(x) * 2, z: 3.2, h: 8 + rnd(x + 1) * 4, rot: rnd(x + 2) * 6}); out.push({x: x + 4 + rnd(x + 3) * 2, z: 27.5, h: 7.5 + rnd(x + 4) * 4, rot: rnd(x + 5) * 6}); }
  return out;
};

const PRAIA_Z0 = -14;

export const Costa: React.FC<CostaP> = ({t, luz, foco, costa = PRAIA_Z0, nivel = 0.04, g = 9.81, flutua = 0, inunda = 0, paredao = 0, cidade = false, pier = false, cam, pulo = 0, desliza = 0, eu = [14, -4], fugaT = 0, nevoa = 0, agit = 0, espuma = 1, torres = false, nuvensBaixas = false, semFonte = false, praca = false, jatos = false, jatoAlto = false}) => {
  const tx = useTexturas();
  useMemo(() => {
    tx.areia.repeat.set(60, 8); tx.lajota.repeat.set(150, 14); tx.asfalto.repeat.set(80, 3);
  }, [tx]);

  // ---------- elenco ----------
  const praia = useMemo(() => gerarPessoas(150, {x0: -90, x1: 90, z0: -12.5, z1: 0}, 1, [['andando', 0.3], ['parado', 0.3], ['deitado', 0.25], ['sentado', 0.15]]), []);
  const calcada = useMemo(() => gerarPessoas(170, {x0: -90, x1: 90, z0: 3, z1: 29}, 2, [['andando', 0.55], ['parado', 0.45]])
    .filter((p) => Math.hypot(p.x, p.z - 14) > 4.2), []);
  const nadando = useMemo(() => gerarPessoas(28, {x0: -70, x1: 70, z0: -24, z1: -16}, 3, [['parado', 1]]), []);

  const palmeiras = useMemo(posPalmeiras, []);
  const livre = (it: Item) => Math.hypot(it.x - eu[0], it.z - eu[1]) > 9;
  const cores = ['#e94b3c', '#f5c518', '#2fa6d9', '#e2457a', '#7d5ba6', '#3fbf8f', '#f08a24'];
  const guardasois = useMemo<Item[]>(() => Array.from({length: 46}, (_, k) => ({x: -95 + rnd(k + 300) * 190, z: -11 + rnd(k + 301) * 10, rot: rnd(k + 302) * 6, cor: cores[k % cores.length], rx: (rnd(k + 303) - 0.5) * 0.15})), []);
  const cadeiras = useMemo<Item[]>(() => Array.from({length: 40}, (_, k) => ({x: -95 + rnd(k + 400) * 190, z: -10 + rnd(k + 401) * 9, rot: rnd(k + 402) * 0.6 + Math.PI, cor: ['#2fa6d9', '#ffffff', '#3fbf8f'][k % 3]})), []);
  const toalhas = useMemo<Item[]>(() => Array.from({length: 60}, (_, k) => ({x: -95 + rnd(k + 500) * 190, z: -11 + rnd(k + 501) * 10, rot: rnd(k + 502) * 6, cor: cores[(k + 2) % cores.length]})), []);
  const bancos = useMemo<Item[]>(() => [...Array.from({length: 26}, (_, k) => ({x: -110 + k * 9, z: 6.5, rot: 0, cor: '#7a5a3a'})), ...Array.from({length: 26}, (_, k) => ({x: -106 + k * 9, z: 24.5, rot: Math.PI, cor: '#7a5a3a'}))], []);
  const postes = useMemo<Item[]>(() => [...Array.from({length: 22}, (_, k) => ({x: -105 + k * 10, z: 2.4, rot: -Math.PI / 2, cor: '#3b3f46'})), ...Array.from({length: 22}, (_, k) => ({x: -100 + k * 10, z: 29.2, rot: Math.PI / 2, cor: '#3b3f46'}))], []);
  const carros = useMemo<Item[]>(() => Array.from({length: 34}, (_, k) => ({x: -200 + rnd(k + 600) * 400, z: k % 2 ? 32.8 : 36.6, rot: 0, cor: ['#d9d9d9', '#c0392b', '#2c3e50', '#f1c40f', '#ecf0f1', '#2980b9', '#16a085'][k % 7]})), []);
  const predios = useMemo(() => {
    if (!cidade) return [];
    const out: {x: number; z: number; w: number; d: number; h: number}[] = [];
    for (let bx = -420; bx < 420; bx += 34) for (let bz = 48; bz < 330; bz += 34) {
      const k = bx * 7 + bz; if (rnd(k) < 0.08) continue;
      out.push({x: bx + 14, z: bz + 12, w: 16 + rnd(k + 1) * 12, d: 14 + rnd(k + 2) * 12, h: torres && bz < 160 ? 45 + rnd(k + 3) * 95 : 8 + rnd(k + 3) * (bz < 120 ? 34 : 22)});
    }
    return out;
  }, [cidade, torres]);

  // ---------- estados ----------
  const fl = flutua;
  const subir = (k: number, base: number) => fl > 0 ? Math.max(0, fl - rnd(k) * 0.35) * (6 + rnd(k + 1) * 30) * fl : 0;
  // todos correm para longe de voce (quem estava deitado ou sentado levanta)
  const fugir = (p: Pessoa, e: Estado) => {
    if (fugaT <= 0) return;
    const dx = e.x - eu[0], dz = e.z - eu[1], d = Math.hypot(dx, dz) || 1;
    const reage = Math.max(0, fugaT - rnd(p.i + 71) * 1.2), v = 4 + rnd(p.i + 72) * 1.5;
    if (reage <= 0) return;
    e.x += dx / d * v * reage; e.z += dz / d * v * reage; e.ry = Math.atan2(dx, dz); e.caido = false; e.corre = true;
  };
  const estadoPraia = (p: Pessoa, tt: number) => {
    const e = estadoPadrao(p, tt, -120, 120);
    fugir(p, e);
    escorrega(p, e, tt);
    if (inunda > 0) {
      // gente sai correndo para o calcadao; quem fica e alcancado pela agua e boia
      const fuga = Math.min(1, inunda * 1.4) * (rnd(p.i + 33) < 0.75 ? 1 : 0);
      e.z = e.z + fuga * (18 + rnd(p.i) * 10) * smooth(0, 1, inunda);
      e.caido = e.caido && fuga === 0;
      if (fuga === 0 && costa > e.z) { e.y = Math.max(0, nivel - 0.9); e.balanco = Math.sin(tt * 2 + p.i) * 0.1; e.caido = true; }
    }
    if (fl > 0) { e.y += subir(p.i, 0); e.rx = fl * (rnd(p.i + 9) - 0.5) * 3 * fl; e.rz = fl * (rnd(p.i + 8) - 0.5) * 3 * fl; e.caido = false; }
    return e;
  };
  const pular = (p: Pessoa, e: {y: number}, tt: number) => {
    if (pulo <= 0 || p.pose !== 'parado' || rnd(p.i + 44) > 0.35) return;
    const g = 9.81 * Math.max(0.08, pulo), h = 0.45 / Math.max(0.08, pulo), ar = 2 * Math.sqrt(2 * h / g), ciclo = ar + 0.6;
    const k = ((tt + rnd(p.i) * ciclo) % ciclo);
    if (k < ar) e.y = Math.max(e.y, (Math.sqrt(2 * g * h) * k - 0.5 * g * k * k));
  };
  const escorrega = (p: Pessoa, e: {x: number; caido?: boolean; rz?: number}, tt: number) => {
    if (desliza <= 0) return;
    if (rnd(p.i + 61) < 0.6) { e.caido = true; e.rz = (rnd(p.i) - 0.5) * 1.2; }
    e.x -= desliza * desliza * (6 + rnd(p.i + 3) * 10);
  };
  const estadoCalcada = (p: Pessoa, tt: number) => {
    const e = estadoPadrao(p, tt, -120, 120);
    pular(p, e, tt); escorrega(p, e, tt); fugir(p, e);
    if (fl > 0) { e.y += subir(p.i + 1, 0); e.rx = fl * (rnd(p.i + 19) - 0.5) * 2.5 * fl; e.rz = fl * (rnd(p.i + 18) - 0.5) * 2.5 * fl; }
    if (paredao > 0.55) { const k = smooth(0.55, 1, paredao); e.y += k * (4 + rnd(p.i) * 20); e.z -= k * (10 + rnd(p.i + 2) * 30); e.rx = k * rnd(p.i) * 6; }
    return e;
  };
  const estadoNado = (p: Pessoa, tt: number) => fugaT > 40 ? {x: 0, y: -200, z: 0, ry: 0} : ({x: p.x + Math.sin(tt * 0.3 + p.i) * 0.6, y: nivel - 1.05 + Math.sin(tt * 1.6 + p.i) * 0.06, z: p.z + (costa - PRAIA_Z0) + Math.cos(tt * 0.25 + p.i) * 0.5, ry: p.rot});

  if (String((globalThis as any).__dbg ?? '').includes('semFonte')) { semFonte = true; jatos = false; jatoAlto = false; }
  const longe = (it: Item): Item => (cam && Math.hypot(it.x - cam.x, (it.y ?? 0) - cam.y, it.z - cam.z) < 9 ? {...it, y: -300} : it);
  const boia0 = (it: Item, k: number): Item => {
    let y = 0, x = it.x, z = it.z, rx = it.rx ?? 0, rz = 0;
    if (costa > z + 0.3) { y = nivel - 0.15 + Math.sin(t * 1.7 + k) * 0.12; x += Math.sin(t * 0.4 + k) * 1.5; z += (costa - it.z) * 0.15; rx += Math.sin(t + k) * 0.25; rz = Math.cos(t * 0.8 + k) * 0.25; }
    if (fl > 0) { y += subir(k + 70, 0); rx += fl * k; rz += fl * k * 0.7; }
    if (desliza > 0) x -= desliza * desliza * (4 + rnd(k + 5) * 8);
    if (paredao > 0.6) { const q = smooth(0.6, 1, paredao); y += q * (5 + rnd(k) * 25); z -= q * (15 + rnd(k + 1) * 30); rx += q * k; }
    return {...it, x, y, z, rx, rz};
  };
  const boia = (it: Item, k: number) => longe(boia0(it, k));
  const moveCarro = (it: Item, k: number): Item => {
    const v = (k % 2 ? 1 : -1) * (9 + rnd(k) * 5);
    let x = it.x + v * t; x = ((x + 200) % 400 + 400) % 400 - 200;
    const fly = fl > 0.4 ? smooth(0.4, 1, fl) * (3 + rnd(k) * 18) : 0;
    return {...it, x, y: fly, rot: v > 0 ? Math.PI / 2 : -Math.PI / 2, rx: fly * 0.1 * k, rz: fly * 0.05};
  };

  const guardasoisL = useMemo(() => guardasois.filter(livre), [guardasois]);
  const cadeirasL = useMemo(() => cadeiras.filter(livre), [cadeiras]);
  const toalhasL = useMemo(() => [...toalhas.filter(livre), {x: eu[0] + 0.7, z: eu[1] - 3.3, rot: 0.3, cor: '#2f7fd0'}], [toalhas]);
  const molhado = Math.max(costa, PRAIA_Z0) + 2.2;
  return (
    <>
      <Ceu luz={luz} centro={[foco.x, 0, foco.z]} />
      <Cirros luz={luz} tex={tx.cirros} centro={[foco.x, 0, foco.z]} />
      <Nuvens t={t} luz={luz} centro={[foco.x, foco.z - 300]} />
      <Sol luz={luz} foco={foco} area={cidade ? 160 : 70} />
      <fog attach="fog" args={[new THREE.Color(0.80, 0.87, 0.94).multiplyScalar(0.12 + 0.88 * luz.dia).lerp(new THREE.Color(0.93, 0.92, 0.88), nevoa), 260 * (1 - nevoa) + 4 * nevoa, 2600 * (1 - nevoa) + 90 * nevoa]} />
      {nuvensBaixas && <Nuvens t={t} luz={luz} n={70} area={1000} altura={50} centro={[100, -40]} />}

      {/* areia, faixa molhada, calcadao, gramado, avenida, quarteiroes */}
      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0, -40]}><planeGeometry args={[1800, 86]} /><meshStandardMaterial map={tx.areia} roughness={1} /></mesh>
      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0.04, molhado - 1.6]}><planeGeometry args={[1800, 3.2]} /><meshStandardMaterial color="#9a8a72" roughness={0.35} transparent opacity={0.55} depthWrite={false} polygonOffset polygonOffsetFactor={-2} /></mesh>
      <mesh receiveShadow position={[0, 0.15, 16]}><boxGeometry args={[1800, 0.3, 28]} /><meshStandardMaterial map={tx.lajota} roughness={0.85} /></mesh>
      <mesh receiveShadow position={[0, 0.35, 2.15]}><boxGeometry args={[1800, 0.7, 0.3]} /><meshStandardMaterial color="#d8d2c4" /></mesh>
      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0.02, 34.7]}><planeGeometry args={[1800, 9.4]} /><meshStandardMaterial map={tx.asfalto} roughness={0.9} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.06, 34.7]}><planeGeometry args={[1800, 0.18]} /><meshBasicMaterial color="#e8c547" polygonOffset polygonOffsetFactor={-2} /></mesh>
      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0.01, 190]}><planeGeometry args={[1800, 300]} /><meshStandardMaterial color={cidade ? '#8d9096' : '#9b9890'} roughness={0.95} /></mesh>

      <Mar t={t} luz={luz} costa={costa} nivel={nivel} centro={[foco.x, 0]} agit={agit} espuma={espuma} />
      <PalmeirasR pos={palmeiras} tex={tx.folha} />
      {praca && <Praca />}
      {!semFonte && !jatos && <Fonte t={t} g={g} dia={Math.max(luz.dia, 0.35)} pos={[0, 0.3, 14]} escala={jatoAlto ? 260 : 190} />}
      {jatos && <JatosFila t={t} g={g} dia={Math.max(luz.dia, 0.35)} />}
      {jatoAlto && <JatoAlto t={t} g={g} dia={Math.max(luz.dia, 0.35)} />}
      <MultidaoR lista={praia} t={t} estado={estadoPraia} cam={cam} />
      <MultidaoR lista={calcada} t={t} estado={estadoCalcada} cam={cam} />
      <MultidaoR lista={nadando} t={t} estado={estadoNado} />
      <ItensR tipo="guardasol" lista={guardasoisL} mover={boia} />
      <ItensR tipo="cadeira" lista={cadeirasL} mover={boia} />
      <ItensR tipo="toalha" lista={toalhasL} mover={(it, k) => ({...boia(it, k), rx: 0, rz: 0})} />
      <ItensR tipo="banco" lista={bancos} mover={(it) => longe(it)} />
      <ItensR tipo="poste" lista={postes} />
      <ItensR tipo="carro" lista={carros} mover={(it, k) => longe(moveCarro(it, k))} />
      <PostoSalvaVidas x={-37} z={-12} t={t} costa={costa} nivel={nivel} fl={fl} />
      <PostoSalvaVidas x={52} z={-7} t={t} costa={costa} nivel={nivel} fl={fl} cor="#f39c3a" />
      <Barcos t={t} />
      {cidade && <Predios lista={predios} dia={luz.dia} tex={tx.janela} texN={tx.janelaNoite} />}
      {paredao > 0 && <Paredao t={t} p={paredao} luz={luz} />}
      <LuzesPostes noite={1 - luz.dia} />
      {pier && <PierSM t={t} />}
    </>
  );
};

const PostoSalvaVidas: React.FC<{x: number; z: number; t: number; costa: number; nivel: number; fl: number; cor?: string}> = ({x, z, t, costa, nivel, fl, cor = '#5fc4d0'}) => {
  let y = 0, r = 0;
  if (costa > z) { y = Math.max(0, nivel - 0.5) + Math.sin(t * 1.3) * 0.15; r = Math.sin(t * 0.9) * 0.08; }
  if (fl > 0.5) { y += smooth(0.5, 1, fl) * 14; r += fl * 0.6; }
  return (
    <group position={[x, y, z]} rotation={[r, 0.2, r * 0.5]}>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], k) => <mesh key={k} castShadow position={[a * 1.1, 1, b * 1.1]}><boxGeometry args={[0.15, 2, 0.15]} /><meshStandardMaterial color="#e8e2d6" /></mesh>)}
      <mesh castShadow position={[0, 2.9, 0]}><boxGeometry args={[3, 1.8, 2.8]} /><meshStandardMaterial map={texListras()} /></mesh>
      <mesh castShadow position={[0, 3.25, 0.01]}><boxGeometry args={[3.02, 0.35, 2.82]} /><meshStandardMaterial color="#f4d03f" /></mesh>
      <mesh castShadow position={[0, 4.2, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[2.4, 0.9, 4]} /><meshStandardMaterial color="#e74c3c" /></mesh>
      <mesh castShadow position={[0, 1.6, 2.4]} rotation={[0.9, 0, 0]}><boxGeometry args={[1, 0.08, 2.4]} /><meshStandardMaterial color="#e8e2d6" /></mesh>
    </group>
  );
};

const Barcos: React.FC<{t: number}> = ({t}) => (
  <group>
    {Array.from({length: 9}, (_, k) => (
      <group key={k} position={[-300 + rnd(k + 900) * 600 + t * (0.5 + rnd(k) * 1.5), 0.3, -160 - rnd(k + 901) * 500]} rotation={[0, rnd(k) * 3, 0]}>
        <mesh><boxGeometry args={[3, 1.2, 9]} /><meshStandardMaterial color="#f4f6f8" /></mesh>
        <mesh position={[0, 1.1, -1]}><boxGeometry args={[2.2, 1, 3.5]} /><meshStandardMaterial color="#dfe6ee" /></mesh>
      </group>
    ))}
  </group>
);

// a noite: pequenas luzes quentes nos postes (emissivas, sem custo de luz real)
const LuzesPostes: React.FC<{noite: number}> = ({noite}) => noite < 0.05 ? null : (
  <group>
    {Array.from({length: 22}, (_, k) => <mesh key={`a${k}`} position={[-105 + k * 10 + 0.8, 4.86, 2.4]}><sphereGeometry args={[0.22, 8, 6]} /><meshBasicMaterial color={new THREE.Color(1, 0.86, 0.55).multiplyScalar(0.4 + 2.2 * noite)} toneMapped={false} /></mesh>)}
    {Array.from({length: 22}, (_, k) => <mesh key={`b${k}`} position={[-100 + k * 10 - 0.8, 4.86, 29.2]}><sphereGeometry args={[0.22, 8, 6]} /><meshBasicMaterial color={new THREE.Color(1, 0.86, 0.55).multiplyScalar(0.4 + 2.2 * noite)} toneMapped={false} /></mesh>)}
  </group>
);

// paredao: a agua de todos os oceanos chegando (frente curva, nevoa na base, crista branca)
const PAR_FS = `uniform float uT; uniform float uDia; varying vec2 vUv; varying vec3 vW;
float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
void main(){
  float y = vUv.y;
  float st = n(vec2(vUv.x * 40.0, y * 6.0 - uT * 1.5)) * 0.6 + n(vec2(vUv.x * 120.0, y * 20.0 - uT * 3.0)) * 0.4;
  // corpo verde-azulado escuro com estrias verticais, crista branca espumando e nevoa na base, como no original
  float estria = n(vec2(vUv.x * 260.0, y * 3.0 - uT * 2.0));
  vec3 c = mix(vec3(0.07, 0.27, 0.32), vec3(0.36, 0.62, 0.64), smoothstep(0.1, 0.85, y));
  c *= 0.85 + 0.3 * estria;
  float crista = smoothstep(0.86, 0.95, y + (st - 0.5) * 0.08);
  c = mix(c, vec3(0.93, 0.96, 0.97), crista);
  c += st * 0.06;
  float nev = (1.0 - smoothstep(0.0, 0.3, y)) * (0.55 + 0.4 * st);
  c = mix(c, vec3(0.8, 0.86, 0.88), nev);
  gl_FragColor = vec4(c * (0.35 + 0.65 * uDia), 0.96); gl_FragColor.rgb = pow(max(gl_FragColor.rgb, vec3(0.0)), vec3(2.2));
}`;
const PAR_VS = `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const Paredao: React.FC<{t: number; p: number; luz: Luz}> = ({t, p, luz}) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({transparent: true, side: THREE.DoubleSide, toneMapped: false, vertexShader: PAR_VS, fragmentShader: PAR_FS, uniforms: {uT: {value: 0}, uDia: {value: 1}}}), []);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(2400, 1, 200, 40);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) { const v = pos.getY(i) + 0.5; pos.setXYZ(i, pos.getX(i), v, -Math.pow(v, 2.2) * 0.35); }
    g.computeVertexNormals(); return g;
  }, []);
  mat.uniforms.uT.value = t; mat.uniforms.uDia.value = luz.dia;
  // a crista fica no terco de cima do quadro com ceu acima dela (antes passava da borda e o paredao parecia ceu)
  const z = -520 + p * 540, altura = 30 + p * 62;
  return <mesh geometry={geo} material={mat} position={[0, -2, z]} scale={[1, altura, altura]} />;
};

// pier de Santa Monica com roda-gigante (caixas e cilindros)
const PierSM: React.FC<{t: number}> = ({t}) => {
  const X = -12, Y = 5.5;
  const pilares = Array.from({length: 40}, (_, k) => -2 - k * 7);
  const cores = ['#e6476b', '#f7b733', '#41b3a3', '#7d5ba6', '#e27d60'];
  return (
    <group>
      <mesh castShadow receiveShadow position={[X, Y, -140]}><boxGeometry args={[12, 0.6, 280]} /><meshStandardMaterial color="#8a7a66" roughness={0.9} /></mesh>
      {pilares.map((z) => [-5, 0, 5].map((dx) => (
        <mesh key={`${z}_${dx}`} castShadow position={[X + dx, Y / 2 - 1, z]}><cylinderGeometry args={[0.3, 0.3, Y + 2, 8]} /><meshStandardMaterial color="#5f5346" roughness={0.95} /></mesh>
      )))}
      {[-5.8, 5.8].map((dx) => <mesh key={dx} position={[X + dx, Y + 0.9, -140]}><boxGeometry args={[0.12, 0.12, 280]} /><meshStandardMaterial color="#efe9df" /></mesh>)}
      {Array.from({length: 28}, (_, k) => <mesh key={k} castShadow position={[X + (k % 2 ? 5.6 : -5.6), Y + 2.6, -4 - Math.floor(k / 2) * 12]}><cylinderGeometry args={[0.07, 0.09, 4.4, 6]} /><meshStandardMaterial color="#2c2f36" /></mesh>)}
      <group position={[X + 1, Y + 16, -70]} rotation={[0, Math.PI / 2, t * 0.05]}>
        <mesh><torusGeometry args={[14, 0.32, 8, 64]} /><meshStandardMaterial color="#f2f2f2" roughness={0.5} /></mesh>
        <mesh><torusGeometry args={[10.5, 0.16, 8, 64]} /><meshStandardMaterial color="#f2f2f2" roughness={0.5} /></mesh>
        {Array.from({length: 20}, (_, k) => {
          const a = (k / 20) * Math.PI * 2;
          return (
            <group key={k}>
              <mesh rotation={[0, 0, a]} position={[Math.cos(a) * 7, Math.sin(a) * 7, 0]}><boxGeometry args={[14, 0.1, 0.1]} /><meshStandardMaterial color="#eaeaea" /></mesh>
              <mesh position={[Math.cos(a) * 14.6, Math.sin(a) * 14.6, 0]}><sphereGeometry args={[0.85, 12, 10]} /><meshStandardMaterial color={cores[k % 5]} roughness={0.6} /></mesh>
            </group>
          );
        })}
      </group>
      {[-1, 1].map((s) => <mesh key={s} position={[X + 1 + s * 4, Y + 8, -70]} rotation={[0, 0, s * 0.28]}><boxGeometry args={[0.5, 17, 0.5]} /><meshStandardMaterial color="#eaeaea" /></mesh>)}
    </group>
  );
};

// faixas coloridas da torre de salva-vidas
let _listras: THREE.Texture | null = null;
const texListras = () => {
  if (_listras) return _listras;
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128; const c = cv.getContext('2d')!;
  const cs = ['#f2c230', '#e2453a', '#2f8fd6', '#43b36a', '#f2c230', '#e2453a'];
  cs.forEach((k, i) => { c.fillStyle = k; c.fillRect(0, i * 128 / cs.length, 64, 128 / cs.length + 1); });
  _listras = new THREE.CanvasTexture(cv); _listras.colorSpace = THREE.SRGBColorSpace; return _listras;
};

// praca redonda em volta do chafariz: piso claro em aneis, borda branca e espelho d'agua azul
const Praca: React.FC = () => (
  <group position={[0, 0.31, 14]}>
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, 0]} receiveShadow><circleGeometry args={[11, 64]} /><meshStandardMaterial color="#d9d2c4" roughness={0.85} /></mesh>
    {[10.6, 8.2].map((r, k) => <mesh key={k} rotation-x={-Math.PI / 2} position={[0, 0.012, 0]}><ringGeometry args={[r - 0.25, r, 64]} /><meshStandardMaterial color="#b9b0a0" /></mesh>)}
    <mesh position={[0, 0.25, 0]} castShadow receiveShadow><cylinderGeometry args={[6.2, 6.4, 0.5, 64]} /><meshStandardMaterial color="#f1eee8" roughness={0.6} /></mesh>
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.51, 0]}><circleGeometry args={[5.8, 64]} /><meshStandardMaterial color="#2c8fd0" roughness={0.12} metalness={0.15} /></mesh>
  </group>
);

// jatos de agua verticais (sem estado: cada gota e funcao do tempo); a altura cresce quando a gravidade efetiva cai
const JATO_VS = `
attribute float aS; uniform float uF; uniform float uG; uniform float uV0; uniform float uEsc; uniform float uN; varying float vA;
float h(float x){ return fract(sin(x * 91.7) * 43758.5); }
void main(){
  float jato = floor(aS * uN), s = fract(aS * uN);
  float x0 = (jato - (uN - 1.0) * 0.5) * 3.2;
  float g = max(uG, 0.15), v = uV0 * (0.92 + 0.12 * h(s * 7.0)), vida = min(2.0 * v / g, 9.0);
  // uF = integral de dt/vida da gota de referencia (velocidade uV0); cada gota anda na proporcao uV0/v
  float idade = fract(uF * uV0 / v + h(s * 13.0)) * vida;
  float abre = 0.35 + 1.8 * smoothstep(0.35, 1.0, idade / vida);   // o jato abre em leque no alto, como no original
  vec3 p = vec3(x0 + (h(s * 3.0) - 0.5) * abre * idade, v * idade - 0.5 * g * idade * idade, (h(s * 5.0) - 0.5) * abre * idade);
  vA = smoothstep(0.0, 0.1, idade) * (1.0 - smoothstep(vida * 0.85, vida, idade)) * step(-0.1, p.y);
  vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
  gl_PointSize = uEsc * (0.6 + h(s * 17.0) * 0.8) / -mv.z;
}`;
const JATO_FS = `uniform float uDia; varying float vA; void main(){ vec2 q = gl_PointCoord - 0.5; float r = dot(q, q); if (r > 0.25) discard;
  gl_FragColor = vec4(vec3(0.85, 0.9, 0.97) * (0.5 + 0.6 * uDia), vA * (1.0 - r * 3.0) * 0.85); gl_FragColor.rgb = pow(max(gl_FragColor.rgb, vec3(0.0)), vec3(2.2)); }`;
const useJato = (n: number, nj: number, v0: number, esc: number) => useMemo(() => {
  const geo = new THREE.BufferGeometry(); const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = (i + 0.5) / n;
  geo.setAttribute('aS', new THREE.BufferAttribute(a, 1)); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const mat = new THREE.ShaderMaterial({transparent: true, depthWrite: false, vertexShader: JATO_VS, fragmentShader: JATO_FS,
    uniforms: {uF: {value: 0}, uG: {value: 9.81}, uV0: {value: v0}, uEsc: {value: esc}, uN: {value: nj}, uDia: {value: 1}}});
  return {geo, mat};
}, [n, nj, v0, esc]);
const JatosFila: React.FC<{t: number; g: number; dia: number}> = ({t, g, dia}) => {
  const {geo, mat} = useJato(14000, 7, 9, 240);
  mat.uniforms.uF.value = faseJato(t, 9, 0.15, 9); mat.uniforms.uG.value = g; mat.uniforms.uDia.value = dia;
  return <points geometry={geo} material={mat} position={[0, 0.8, 14]} frustumCulled={false} />;
};
const JatoAlto: React.FC<{t: number; g: number; dia: number}> = ({t, g, dia}) => {
  const {geo, mat} = useJato(8000, 1, 20, 320);
  mat.uniforms.uF.value = faseJato(t, 20, 0.15, 9); mat.uniforms.uG.value = g; mat.uniforms.uDia.value = dia;
  return <points geometry={geo} material={mat} position={[0, 0.8, 14]} frustumCulled={false} />;
};
