
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, d) => cl((t - a) / d);
const ease = x => { x = cl(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const out = x => 1 - Math.pow(1 - cl(x), 3);
const back = x => { x = cl(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const $ = id => document.getElementById(id);
// stop-motion: tremidinha a 12 qps, determinada pelo tempo e pelo nome
function rnd(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }
// ⛔ (Eduardo, 09/10) nada de tremida: antes era um sorteio novo a cada 1/12 s (o "flicker" de stop-motion). Agora cada
//    elemento flutua devagar (ondas de 5-9 s, 2 px e 0,3 grau no maximo), com fase propria, sem nenhum salto.
function jit(id, t, amp = 1) {
  const h = hash(id), f1 = .11 + rnd(h) * .07, f2 = .13 + rnd(h + 3) * .07, f3 = .09 + rnd(h + 5) * .05;
  const w = (f, k) => Math.sin(2 * Math.PI * f * t + rnd(h + k) * 6.283);
  return { x: w(f1, 7) * 2 * amp, y: w(f2, 11) * 2 * amp, r: w(f3, 13) * .3 * amp };
}
function put(id, t, o) {
  const e = $(id); if (!e) return;
  const j = o.jit === false ? { x: 0, y: 0, r: 0 } : jit(id, t, o.amp || 1);
  e.style.opacity = o.op ?? 1;
  e.style.transform = `translate(${(o.x || 0) + j.x}px, ${(o.y || 0) + j.y}px) rotate(${(o.r || 0) + j.r}deg) scale(${o.s ?? 1})`;
  e.style.filter = o.blur ? `blur(${o.blur}px)` : (e.classList.contains('cut') ? '' : '');
}
// entrada "batendo": chega grande e desfocada, assenta com repique
function slam(id, t, a, d = .45, extra = {}) {
  const p = prog(t, a, d);
  put(id, t, Object.assign({ op: p > 0 ? 1 : 0, s: 1 + (1 - back(p)) * 0.6, blur: (1 - out(p)) * 10 }, extra));
}
function pop(id, t, a, d = .5, extra = {}) {
  const p = prog(t, a, d);
  put(id, t, Object.assign({ op: out(p * 2), s: back(p) * (extra.s0 || 1) }, extra));
}
// traco que se desenha
const comp = {};
function draw(id, t, a, d) {
  const e = $(id); if (!e) return;
  if (!(id in comp)) { comp[id] = e.getTotalLength ? e.getTotalLength() : 1000; e.style.strokeDasharray = e.classList.contains('strich') ? '' : comp[id]; }
  const p = ease(prog(t, a, d));
  if (e.classList.contains('strich')) { e.style.opacity = p > 0 ? 1 : 0; e.style.clipPath = `inset(0 0 ${100 - 100 * p}% 0)`; return; }
  e.style.strokeDashoffset = comp[id] * (1 - p); e.style.opacity = p > 0 ? 1 : 0;
}
function cena(id, t, ini, fim) {
  // corte em empurrao: a cena entra da direita e sai pela esquerda com rastro
  const e = $(id), T = .4;
  if (t < ini - T || t > fim + T) { e.style.display = 'none'; return false; }
  e.style.display = 'block';
  let x = 0, blur = 0;
  if (t < ini) { const p = ease(prog(t, ini - T, T)); x = (1 - p) * 1920; blur = (1 - p) * 18; }
  else if (t > fim) { const p = ease(prog(t, fim, T)); x = -p * 1920; blur = p * 18; }
  const push = 1 + 0.03 * prog(t, ini, fim - ini);
  e.style.transform = `translateX(${x}px) scale(${push})`; e.style.filter = blur ? `blur(${blur}px)` : 'none';
  return true;
}
(function () { const s = $('voegel'); for (let i = 0; i < 5; i++) { const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.id = 'V' + i; p.setAttribute('fill', 'none'); p.setAttribute('stroke', '#2f2a22'); p.setAttribute('stroke-width', '4'); p.setAttribute('stroke-linecap', 'round'); s.appendChild(p); } })();
// ⛔ (Eduardo, 09/10) sem passaros: as gaivotas de traco nao tinham nada a ver com o tema. voegel() ficou sem efeito
//    (as paginas antigas ainda chamam); motion graphics novos nao usam.
function voegel() { semVoegel(); }
function semVoegel() { for (let i = 0; i < 5; i++) { const e = $('V' + i); if (e) e.style.opacity = 0; } }

// gotas, pontos e raios sob demanda
function criar(pai, n, fn) { const c = $(pai); for (let i = 0; i < n; i++) c.appendChild(fn(i)); }
