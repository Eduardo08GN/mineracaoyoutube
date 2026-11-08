// Fisica do batedor "¿Qué pasaría si la Tierra girara cada vez más rápido?" no malecon do equador.
// UM parametro manda em tudo: p (0 -> 1). Dele saem a duracao do dia, o peso, a velocidade do chao, o nivel do mar, a hora do Sol.
// Tudo funcao pura (nada acumula entre quadros). Numeros reais: R equatorial 6.378,137 km; g gravitacional no equador 9,814 m/s2
// (o 9,780 medido ja desconta os 0,034 da rotacao de hoje). Ingravidez quando omega^2 R = g: dia de 2*pi*sqrt(R/g) = 84,4 min.

export const R_M = 6378137;            // m
export const G0 = 9.814;               // m/s2 (gravitacao pura no equador)
export const DIA_HOJE_H = 24;          // h (dia solar ~ sideral, diferenca irrelevante aqui)
export const DIA_FIM_H = 1.6;          // h no fim do batedor (96 min: pesa 23% do normal)
export const PESO_KG = 82;             // massa de referencia do espectador
export const DIA_INGRAVIDEZ_MIN = (2 * Math.PI * Math.sqrt(R_M / G0)) / 60;   // 84,4 min

const cl01 = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (a: number, b: number, x: number) => { const u = cl01((x - a) / (b - a)); return u * u * (3 - 2 * u); };

// duracao do dia: interpolacao geometrica (cada passo de p encurta o dia na mesma proporcao)
export const diaH = (p: number) => DIA_HOJE_H * Math.pow(DIA_FIM_H / DIA_HOJE_H, cl01(p));
export const omega = (p: number) => (2 * Math.PI) / (diaH(p) * 3600);
// aceleracao centrifuga e gravidade efetiva no equador
export const gEf = (p: number) => G0 - omega(p) ** 2 * R_M;
export const G_HOJE = gEf(0);
export const gRel = (p: number) => gEf(p) / G_HOJE;            // 1 hoje, 0,23 no fim
export const pesoKg = (p: number) => PESO_KG * gRel(p);
export const velChaoKmh = (p: number) => (omega(p) * R_M) * 3.6;   // 1.670 km/h hoje

// comparacoes (km/h): a mais alta ja superada vira o rotulo dourado
export const COMPARACOES: {kmh: number; texto: string}[] = [
  {kmh: 1235, texto: 'MÁS RÁPIDO QUE EL SONIDO'},
  {kmh: 2180, texto: 'MÁS RÁPIDO QUE EL CONCORDE'},
  {kmh: 3000, texto: 'MÁS RÁPIDO QUE UNA BALA DE FUSIL'},
  {kmh: 3540, texto: 'MÁS RÁPIDO QUE CUALQUIER AVIÓN'},
  {kmh: 11000, texto: 'MÁS RÁPIDO QUE UN COHETE AL DESPEGAR'},
  {kmh: 20000, texto: 'CASI COMO LA ESTACIÓN ESPACIAL'},
];
export const comparacaoIdx = (p: number) => { const v = velChaoKmh(p); let k = 0; COMPARACOES.forEach((c, i) => { if (v >= c.kmh) k = i; }); return k; };
// p em que a velocidade cruza um limiar (bissecao pura; para animar a troca do rotulo no instante certo)
export const pDaVelocidade = (kmh: number) => { let a = 0, b = 1; if (velChaoKmh(0) >= kmh) return 0; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (velChaoKmh(m) < kmh) a = m; else b = m; } return b; };

// ---------------------------------------------------------------- mar: a agua corre para o equador e sobe pela praia
// Praia em rampa: y = Y_TOPO_PRAIA * (z - Z_PRAIA0) / (0 - Z_PRAIA0) para z em [Z_PRAIA0, 0]; o malecon comeca em z = 0 com y = Y_MALECON.
export const Z_PRAIA0 = -32, Y_TOPO_PRAIA = 0.55, Y_MALECON = 0.75, Y_RUA = 0.6;
export const nivelMar = (p: number) => 0.04 + 1.75 * Math.pow(smooth(0.1, 0.97, p), 1.25);   // m acima do zero de hoje
export const alturaPraia = (z: number) => z <= Z_PRAIA0 ? 0 : z >= 0 ? Y_TOPO_PRAIA : (Y_TOPO_PRAIA * (z - Z_PRAIA0)) / -Z_PRAIA0;
// linha d'agua (z) na rampa; acima do malecon a agua toma tudo (linha bem para dentro da terra)
export const linhaAgua = (p: number) => {
  const n = nivelMar(p);
  if (n < Y_TOPO_PRAIA) return Z_PRAIA0 + (n / Y_TOPO_PRAIA) * -Z_PRAIA0;
  if (n < Y_MALECON) return 0.2;
  return 0.2 + 120 * smooth(Y_MALECON, Y_MALECON + 0.25, n);
};
// profundidade da agua num ponto (0 = seco)
export const altChao = (z: number) => (z < 0 ? alturaPraia(z) : z < 11 ? Y_MALECON : z < 20 ? Y_RUA : Y_MALECON);
export const profundidade = (p: number, z: number) => Math.max(0, nivelMar(p) - altChao(z));
// p em que a agua chega num ponto (z): bissecao pura
export const pChegada = (z: number) => { let a = 0, b = 1; if (profundidade(1, z) <= 0.02) return 2; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (profundidade(m, z) > 0.02) b = m; else a = m; } return b; };

// ---------------------------------------------------------------- Sol: o dia acelerado
// hora do Sol (angulo horario h, rad; 0 = meio-dia, +pi/2 = poente no oeste/-z). h(p) = h0 + 2*pi*C * F(p)/F(1),
// com F(p) = integral de (24/dia)^2: quase parado no comeco e varias voltas no fim (o que o espectador ve acelerar).
const H0 = (30 * Math.PI) / 180, CICLOS = 1.0, DECL = (-16 * Math.PI) / 180;   // novembro: Sol ~16 graus ao sul
const kF = Math.log(DIA_HOJE_H / DIA_FIM_H) * 2;
const F = (p: number) => (Math.exp(kF * cl01(p)) - 1) / kF;
export const anguloHorario = (p: number) => H0 + 2 * Math.PI * CICLOS * (F(p) / F(1));
// direcao PARA o Sol no mundo (x = norte, y = cima, z = leste; o mar fica a oeste, em -z)
export const dirSol = (p: number): [number, number, number] => {
  const h = anguloHorario(p);
  return [Math.sin(DECL), Math.cos(DECL) * Math.cos(h), -Math.cos(DECL) * Math.sin(h)];
};

// formato es-ES
// (toLocaleString('es-ES') NAO agrupa 4 digitos: 1670 sairia sem ponto; por isso o agrupamento e manual)
export const fmtMil = (v: number) => { const s = String(Math.round(v)); return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
export const fmtDec = (v: number, n = 1) => v.toFixed(n).replace('.', ',');
