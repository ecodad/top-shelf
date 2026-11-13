import { World } from './physics.js';
import { DRINKS, PROPS, BOX, buildSprites, buildPropSprites, loadArtOverrides } from './drinks.js';
import { STAGES, COMING_SOON, COIN, rng } from './stages.js';
import { Sound } from './audio.js';
import { BUILD } from './build.js';

// Table space: 100 wide, 132 long. y = 0 is the far end; FAIL is the "bar is full" line.
const T = { W: 100, L: 132, FAIL: 92, LAUNCH: 115 };
// Feel of the bar: slide speed, how fast drinks slow down, and how bouncy things are.
const PHYS = { speed: 215, friction: 150, rest: 0.8, restWall: 0.6, restFixed: 0.5, massPow: 1, zonePull: 280 };
const DANGER_SECONDS = 3;
const FONT = '"Avenir Next", "Nunito", "Segoe UI", system-ui, sans-serif';
const INK = '#1b1f45';
const SAVE_KEY = 'topshelf.v1';

const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeBack = (t) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);

// Running from the home screen (installed) rather than in a browser tab?
const standalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
const IOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

const canvas = $('#game');
const ctx = canvas.getContext('2d');
const sound = new Sound();
const sprites = buildSprites(3);
const propSprites = buildPropSprites(3);

// ---------- save ----------

function loadSave() {
  const base = { coins: 0, music: true, sfx: true, cleared: {}, progress: {} };
  try { return Object.assign(base, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); }
  catch { return base; }
}
function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* private mode */ }
}
const save = loadSave();
sound.music = save.music;
sound.sfx = save.sfx;

// ---------- state ----------

const G = {
  mode: 'title', stage: 0, level: 0, orders: [], minOrder: 2, world: null,
  shakes: 0, shakeCd: 0, shakeFx: 0, dangerHold: 0, serveGate: 0,
  orderIdx: 0, shownIdx: 0, held: null, next: 0, cooldown: 0, queued: false,
  aimX: 50, aiming: false, pid: -1,
  danger: 0, lastWarn: 0, launches: 0, stageCoins: 0, coinsShown: save.coins,
  fx: [], banner: null, tAnim: null, clearAt: 0, fireAt: 0, time: 0,
  dealLo: 0, dealHi: 1, highLeft: 0,
};
let V = null;
let bg = null;

const stage = () => STAGES[G.stage];
const targetTier = () => (G.orders[G.orderIdx] ? G.orders[G.orderIdx].tier : 99);
const unlocked = () => Math.min(stage().levels.length - 1, save.progress[stage().id] || 0);
// Adding ?unlock to the address opens every stage, for trying things out.
const UNLOCK_ALL = new URLSearchParams(location.search).has('unlock');
// A stage opens once the last level of the stage before it has been cleared.
const stageOpen = (i) => i === 0 || UNLOCK_ALL || (save.cleared[STAGES[i - 1].id] || 0) > 0;

// ---------- layout and projection ----------

function insets() {
  const cs = getComputedStyle($('#probe'));
  return { top: parseFloat(cs.paddingTop) || 0, bottom: parseFloat(cs.paddingBottom) || 0 };
}

function layout() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const w = window.innerWidth;
  let h = window.innerHeight;
  // An installed iPhone app reports a height that is short by the status bar, which
  // left a dead strip along the bottom of the screen. Use the real screen height there.
  if (standalone && IOS && window.screen && screen.width === w) {
    const gap = screen.height - h;
    if (gap > 0 && gap < 90) h = screen.height;
  }
  document.documentElement.style.setProperty('--app-h', `${h}px`);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ins = insets();
  const gw = Math.min(w, (h - ins.top - ins.bottom) * 0.58);
  const gx = (w - gw) / 2, u = gw / 390;
  const hudY = ins.top + 8 * u;
  const lad = { x: gx + 10 * u, y: hudY + 44 * u, w: gw - 20 * u, h: 38 * u };
  const railY = lad.y + lad.h + 14 * u;
  const cur = { cx: gx + 16 * u + 69 * u, y: railY, w: 138 * u, h: 128 * u };
  const nxt = { cx: gx + 16 * u + 138 * u + 12 * u + 48 * u, y: railY, w: 96 * u, h: 98 * u };
  const nb = { x: gx + gw - 14 * u - 82 * u, y: railY + 8 * u, w: 82 * u, h: 86 * u };
  const farY = railY + 128 * u + 36 * u;
  const nearY = h - ins.bottom - 18 * u;
  const nearW = gw - 22 * u;
  const zF = 1 / 0.7;
  const K = (nearY - farY) / (1 - 1 / zF);
  V = {
    w, h, dpr, u, gx, gw, cx: gx + gw / 2, hudY, lad, railY, cur, nxt, nb, farY, nearY,
    ppu: nearW / T.W, zF, K, yH: nearY - K,
    pill: { x: gx + 12 * u, y: hudY, w: 118 * u, h: 34 * u },
  };
  const pb = $('#btnPause');
  pb.style.left = `${gx + gw - 12 * u - 36 * u}px`;
  pb.style.top = `${hudY - 1 * u}px`;
  pb.style.width = pb.style.height = `${36 * u}px`;
  pb.style.fontSize = `${13 * u}px`;
  // Shake sits in the gap beside the far end of the bar, clear of the aiming area.
  const sb = $('#btnShake');
  sb.style.left = `${gx + 4 * u}px`;
  sb.style.top = `${farY + 4 * u}px`;
  sb.style.width = sb.style.height = `${46 * u}px`;
  sb.style.fontSize = `${9.5 * u}px`;
  paintStatic();
}

const zAt = (y) => V.zF + (1 - V.zF) * (y / T.L);
function proj(x, y) {
  const z = zAt(y);
  return { x: V.cx + (x - T.W / 2) * V.ppu / z, y: V.yH + V.K / z, s: 1 / z };
}

function quad(c, pts) {
  c.beginPath();
  pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
  c.closePath();
}

function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

// Backdrop and table never change during a stage, so they are painted once per resize.
function paintStatic() {
  bg = document.createElement('canvas');
  bg.width = canvas.width;
  bg.height = canvas.height;
  const c = bg.getContext('2d');
  c.scale(V.dpr, V.dpr);
  stage().paintBackdrop(c, V);
  const img = stage().backdropImg;
  if (img) {
    // Cover the game column, anchored to the top so the skyline stays behind the order rail.
    const k = Math.max(V.h / img.naturalHeight, V.gw / img.naturalWidth);
    const iw = img.naturalWidth * k, ih = img.naturalHeight * k;
    c.drawImage(img, V.cx - iw / 2, 0, iw, ih);
  }
  paintTable(c);
}

function paintTable(c) {
  const st = stage().table, u = V.u, M = 4;
  const A = proj(-M, -M), B = proj(T.W + M, -M), C = proj(T.W + M, T.L + 3), D = proj(-M, T.L + 3);

  c.fillStyle = 'rgba(0,0,0,0.38)';
  quad(c, [
    { x: A.x - 4 * u, y: A.y + 12 * u }, { x: B.x + 4 * u, y: B.y + 12 * u },
    { x: C.x + 8 * u, y: C.y + 24 * u }, { x: D.x - 8 * u, y: D.y + 24 * u },
  ]);
  c.fill();

  const ap = 13 * u;
  let g = c.createLinearGradient(0, C.y, 0, C.y + ap);
  g.addColorStop(0, st.apron[0]);
  g.addColorStop(1, st.apron[1]);
  c.fillStyle = g;
  quad(c, [D, C, { x: C.x - 3 * u, y: C.y + ap }, { x: D.x + 3 * u, y: D.y + ap }]);
  c.fill();

  g = c.createLinearGradient(A.x, 0, B.x, 0);
  g.addColorStop(0, st.rim[0]);
  g.addColorStop(0.5, st.rim[1]);
  g.addColorStop(1, st.rim[2]);
  c.fillStyle = g;
  quad(c, [A, B, C, D]);
  c.fill();

  const a = proj(0, 0), b = proj(T.W, 0), cc = proj(T.W, T.L), d = proj(0, T.L);
  g = c.createLinearGradient(0, a.y, 0, cc.y);
  st.top.forEach((col, i) => g.addColorStop(i / (st.top.length - 1), col));
  c.fillStyle = g;
  quad(c, [a, b, cc, d]);
  c.fill();

  c.save();
  quad(c, [a, b, cc, d]);
  c.clip();
  const R = rng(99);
  if (st.felt) {
    // card-table markings instead of wood grain
    c.lineWidth = 1.5 * u;
    for (const [k, alpha] of [[0, 0.22], [9, 0.12]]) {
      const p0 = proj(6 + k, 34 + k), pm = proj(50, -14 + k * 2.4), p1 = proj(94 - k, 34 + k);
      c.strokeStyle = `rgba(255,236,170,${alpha})`;
      c.beginPath(); c.moveTo(p0.x, p0.y); c.quadraticCurveTo(pm.x, pm.y, p1.x, p1.y); c.stroke();
    }
  } else for (let i = 0; i < 26; i++) {
    const x0 = R() * T.W, x1 = x0 + (R() - 0.5) * 5, xm = (x0 + x1) / 2 + (R() - 0.5) * 4;
    const p0 = proj(x0, 0), pm = proj(xm, T.L * 0.5), p1 = proj(x1, T.L);
    c.strokeStyle = R() < 0.5 ? `rgba(0,0,0,${0.06 + R() * 0.1})` : `rgba(255,190,130,${0.03 + R() * 0.05})`;
    c.lineWidth = (0.6 + R() * 1.8) * u;
    c.beginPath();
    c.moveTo(p0.x, p0.y);
    c.quadraticCurveTo(pm.x, pm.y, p1.x, p1.y);
    c.stroke();
  }
  let rg = c.createRadialGradient(V.cx, a.y, 0, V.cx, a.y, (cc.y - a.y) * 0.75);
  rg.addColorStop(0, st.glowFar);
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = rg;
  c.fillRect(d.x, a.y, cc.x - d.x, cc.y - a.y);
  rg = c.createRadialGradient(cc.x, cc.y, 0, cc.x, cc.y, (cc.y - a.y) * 0.6);
  rg.addColorStop(0, st.glowNear);
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = rg;
  c.fillRect(d.x, a.y, cc.x - d.x, cc.y - a.y);
  c.fillStyle = 'rgba(0,0,0,0.24)';
  quad(c, [proj(0, T.FAIL), proj(T.W, T.FAIL), cc, d]);
  c.fill();
  c.restore();

  c.strokeStyle = 'rgba(255,240,200,0.4)';
  c.lineWidth = 1.2 * u;
  quad(c, [a, b, cc, d]);
  c.stroke();

  // where the marquee bulbs sit, all the way round the rail
  V.bulbs = [];
  if (st.marquee) {
    const o = 2.1, y1 = T.L + 1.6;
    const run = (x0, y0, x1, yEnd, n) => {
      for (let i = 0; i < n; i++) V.bulbs.push(proj(lerp(x0, x1, i / n), lerp(y0, yEnd, i / n)));
    };
    run(-o, -o, T.W + o, -o, 12);
    run(T.W + o, -o, T.W + o, y1, 17);
    run(T.W + o, y1, -o, y1, 12);
    run(-o, y1, -o, -o, 17);
  }
}

function drawMarquee() {
  if (!V.bulbs || !V.bulbs.length) return;
  const u = V.u, phase = Math.floor(G.time * 5);
  for (let i = 0; i < V.bulbs.length; i++) {
    const p = V.bulbs[i], lit = (i + phase) % 3 === 0, r = 2.3 * u * p.s;
    if (lit) {
      ctx.fillStyle = 'rgba(255,236,150,0.35)';
      ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.4, 0, 7); ctx.fill();
    }
    ctx.fillStyle = lit ? '#fff7cf' : '#9a6a12';
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill();
  }
}

// ---------- game flow ----------

function show(id) {
  for (const el of document.querySelectorAll('.overlay')) el.classList.toggle('show', '#' + el.id === id);
  $('#btnPause').hidden = !(G.mode === 'play' || G.mode === 'clearing');
  $('#btnShake').hidden = G.mode !== 'play';
}

function deal() {
  // Regular deals stay below the smallest drink on this level's order list (unless the
  // level sets its own range), so everything on an order has to be made by merging.
  const lo = G.dealLo, hi = G.dealHi;
  // A rare bigger drink for variety. If it happens to match the order, lucky you.
  if (Math.random() < 0.045) return Math.min(DRINKS.length - 2, hi + (Math.random() < 0.2 ? 2 : 1));
  const weights = [34, 30, 22, 14, 10].slice(0, hi - lo + 1);
  let roll = Math.random() * weights.reduce((s, v) => s + v, 0);
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return lo + i;
  }
  return lo;
}

function setStage(i) {
  G.stage = clamp(i, 0, STAGES.length - 1);
  G.level = unlocked();
  T.FAIL = stage().levels[G.level].fail ?? 92;
  paintStatic();
  refreshTitle();
}

function startLevel(n = G.level) {
  G.level = clamp(n, 0, stage().levels.length - 1);
  const lv = stage().levels[G.level];
  // A High Roller order pays triple if it is served within its allowance of slides.
  G.orders = lv.orders.map((tier, i) => ({ tier, coins: COIN[tier], high: lv.high && lv.high[0] === i ? lv.high[1] : 0 }));
  G.minOrder = Math.min(...lv.orders);
  [G.dealLo, G.dealHi] = lv.deal || [0, Math.min(3, G.minOrder - 1)];
  G.highLeft = G.orders[0].high;
  save.stage = G.stage;
  G.shakes = lv.shakes ?? 3;
  const fail = lv.fail ?? 92;
  if (fail !== T.FAIL) { T.FAIL = fail; paintStatic(); }
  G.shakeCd = 0; G.shakeFx = 0; G.dangerHold = 0; G.serveGate = 0;
  G.world = new World(T.W, T.L, PHYS);
  G.world.zoneY = T.FAIL;
  G.world.onMerge = onMerge;
  G.world.onImpact = (speed, a, b) => {
    if (speed <= 30) return;
    if (a.fixed || (b && b.fixed)) sound.knock(speed / 230);
    else sound.clink(speed / 230, a.tier);
  };
  // Obstacles get unique negative drink numbers so they can never merge.
  (lv.props || []).forEach((p, i) => G.world.add({
    tier: -1 - i, kind: p.kind, x: p.x, y: p.y, r: PROPS[p.kind].r, fixed: true, born: -9,
    flat: !!PROPS[p.kind].flat, fling: PROPS[p.kind].fling || 0, spinDir: p.spin || 1, angle: 0,
  }));
  G.orderIdx = 0; G.shownIdx = 0;
  G.danger = 0; G.launches = 0; G.stageCoins = 0;
  G.fx = []; G.tAnim = null; G.clearAt = 0;
  G.banner = { text: `LEVEL ${G.level + 1}`, sub: lv.note || `${lv.orders.length} orders to fill`, t: 0, dur: 1.7 };
  G.held = null; G.queued = false; G.cooldown = 0.3; G.aimX = 50;
  G.next = deal();
  G.mode = 'play';
  show(null);
  syncShake();
  sound.startMusic(stage().song);
}

// Give the whole bar a jolt: every drink scoots off in a random direction (leaning
// toward the far end) and they knock into each other like a pool break. The way to
// free a glass stuck between two others.
function shake() {
  if (G.mode !== 'play' || G.shakes <= 0 || G.shakeCd > 0 || !G.world.bodies.some((b) => !b.fixed)) return;
  G.shakes--;
  G.shakeCd = 1.0;
  G.shakeFx = 0.45;
  G.dangerHold = 1.8;
  for (const b of G.world.bodies) {
    if (b.fixed) continue;
    b.sliding = false;
    const ang = Math.random() * Math.PI * 2, sp = 90 + Math.random() * 90;
    b.vx += Math.cos(ang) * sp;
    b.vy += Math.sin(ang) * sp - 45;
  }
  sound.rattle();
  syncShake();
}

function syncShake() {
  const sb = $('#btnShake');
  sb.innerHTML = `Shake<b>&times;${G.shakes}</b>`;
  sb.disabled = G.shakes <= 0;
}

function launch() {
  if (G.mode !== 'play') return;
  if (!G.held) { G.queued = true; return; }
  const d = DRINKS[G.held.tier];
  G.world.add({
    tier: G.held.tier, x: clamp(G.aimX, d.r, T.W - d.r), y: T.LAUNCH,
    vx: 0, vy: -PHYS.speed, r: d.r, sliding: true, born: -9,
  });
  G.held = null;
  G.queued = false;
  G.cooldown = 0.42;
  G.launches++;
  // count this slide against a High Roller ticket's allowance
  const cur = G.orders[G.orderIdx];
  if (cur && cur.high && !cur.missed) {
    if (G.highLeft <= 0) cur.missed = true;
    else G.highLeft--;
  }
  sound.slide();
}

function onMerge(a, b) {
  const ma = a.r * a.r, mb = b.r * b.r;
  const x = (a.x * ma + b.x * mb) / (ma + mb), y = (a.y * ma + b.y * mb) / (ma + mb);
  const p = proj(x, y);
  const tier = a.tier + 1;
  sound.merge(tier);
  G.fx.push({ kind: 'ring', x: p.x, y: p.y, t: 0, dur: 0.4, r: a.r * V.ppu * p.s * 2.4 });
  sparkle(p.x, p.y, 8 + tier * 2);

  if (tier >= DRINKS.length) {
    save.coins += 1000; G.stageCoins += 1000; persist();
    floater('TOP SHELF! +1000', p.x, p.y, '#ffe066');
    confetti(p.x, p.y, 60);
    return null;
  }
  if (G.mode === 'play' && tier === targetTier() && G.time >= G.serveGate) {
    deliver(tier, x, y);
    return null;
  }
  floater(DRINKS[tier].name, p.x, p.y - DRINKS[tier].r * V.ppu * p.s * 1.2, '#ffffff');
  // Start small and swell to full size: a full-size drink appearing between its
  // neighbours would shove them away violently.
  const nr = DRINKS[tier].r, r0 = Math.max(a.r, b.r) * 0.35;
  return { tier, x, y, vx: (a.vx * ma + b.vx * mb) / (ma + mb), vy: (a.vy * ma + b.vy * mb) / (ma + mb), r: r0, rT: nr, grow: (nr - r0) / 0.2, born: G.time };
}

function deliver(tier, x, y) {
  const idx = G.orderIdx, order = G.orders[idx];
  order.jackpot = !!order.high && !order.missed;
  G.orderIdx++;
  G.highLeft = G.orders[G.orderIdx] ? G.orders[G.orderIdx].high : 0;
  G.serveGate = G.time + 0.6;
  if (G.orderIdx >= G.orders.length) { G.mode = 'clearing'; G.held = null; G.aiming = false; show(null); }
  const p = proj(x, y), rpx = DRINKS[tier].r * V.ppu * p.s, tk = V.cur;
  G.fx.push({
    kind: 'fly', tier, t: 0, dur: 0.75,
    x0: p.x, y0: p.y - rpx * 0.5, s0: rpx * 2.6,
    x1: tk.cx, y1: tk.y + tk.h * 0.45, s1: tk.h * 0.5,
    done: () => payout(order, idx),
  });
}

function payout(order, idx) {
  const pay = order.jackpot ? order.coins * 3 : order.coins;
  save.coins += pay;
  G.stageCoins += pay;
  persist();
  if (order.jackpot) sound.jackpot(); else sound.orderUp();
  const tk = V.cur, x = tk.cx, y = tk.y + tk.h * 0.5, u = V.u;
  confetti(x, y, order.jackpot ? 130 : 70);
  const px = V.pill.x + 17 * u, py = V.pill.y + V.pill.h / 2;
  for (let i = 0; i < (order.jackpot ? 26 : 10); i++) {
    G.fx.push({
      kind: 'coin', t: -i * 0.06, dur: 0.6, x0: x + (Math.random() - 0.5) * 40 * u, y0: y + (Math.random() - 0.5) * 30 * u,
      x1: px, y1: py, bend: (Math.random() - 0.5) * 120 * u,
    });
    if (i % 3 === 0) sound.coin(0.45 + i * 0.06);
  }
  G.banner = { text: order.jackpot ? 'JACKPOT!' : 'ORDER UP!', sub: `${DRINKS[order.tier].name}  +${pay}`, t: 0, dur: order.jackpot ? 2.1 : 1.6 };
  G.tAnim = { t: 0, old: idx };
  G.shownIdx = idx + 1;
  if (idx + 1 >= G.orders.length) G.clearAt = G.time + 1.7;
}

function levelClear() {
  G.mode = 'clear';
  G.clearAt = 0;
  const id = stage().id, n = stage().levels.length, last = G.level >= n - 1;
  save.progress[id] = Math.max(save.progress[id] || 0, Math.min(G.level + 1, n - 1));
  if (last) save.cleared[id] = (save.cleared[id] || 0) + 1;
  persist();
  sound.stageClear();
  $('#clearTitle').textContent = last ? 'Stage Clear!' : `Level ${G.level + 1} Clear!`;
  $('#clearInfo').textContent = last
    ? `${stage().name}: all ${n} levels served`
    : `${stage().name}: ${G.orders.length} orders served`;
  $('#clearCoins').textContent = `+${G.stageCoins.toLocaleString()}`;
  const nextStage = STAGES[G.stage + 1];
  $('#btnNext').hidden = last && !nextStage;
  $('#btnNext').textContent = last ? `On to ${nextStage ? nextStage.name : ''}` : 'Next level';
  $('#clearSoon').textContent = !last ? '' : nextStage ? `${nextStage.name} is now open!` : `Next stop: ${COMING_SOON[0]} (coming soon)`;
  show('#clear');
}

function lose() {
  G.mode = 'lost';
  G.aiming = false;
  sound.lose();
  const n = G.shownIdx;
  $('#lostInfo').textContent = n ? `You served ${n} of ${G.orders.length} orders and kept ${G.stageCoins.toLocaleString()} coins.` : 'No orders served this time.';
  show('#lost');
}

function toTitle() {
  G.mode = 'title';
  G.world = null;
  G.fx = [];
  G.banner = null;
  G.level = unlocked();
  refreshTitle();
  show('#title');
}

function refreshTitle() {
  const st = stage(), open = stageOpen(G.stage), prev = STAGES[G.stage - 1];
  $('#titleCoins').textContent = save.coins.toLocaleString();
  $('#stageK').textContent = `STAGE ${G.stage + 1} OF ${STAGES.length}`;
  $('#stageName').textContent = st.name;
  $('#stageBlurb').textContent = open
    ? `${st.blurb}. ${st.levels.length} levels, and the orders get bigger as you go.`
    : `Locked. Clear level ${prev.levels.length} of ${prev.name} to open it.`;
  $('#btnPrevStage').disabled = G.stage === 0;
  $('#btnNextStage').disabled = G.stage >= STAGES.length - 1;
  const box = $('#levels');
  box.innerHTML = '';
  st.levels.forEach((lv, i) => {
    const b = document.createElement('button');
    b.className = 'lv' + (open && i === G.level ? ' on' : '');
    b.textContent = String(i + 1);
    b.disabled = !open || i > unlocked();
    b.setAttribute('aria-label', `Level ${i + 1}${b.disabled ? ' (locked)' : ''}`);
    b.addEventListener('click', () => { sound.unlock(); sound.tap(); G.level = i; refreshTitle(); });
    box.appendChild(b);
  });
  $('#btnPlay').disabled = !open;
  $('#btnPlay').textContent = open ? `Play level ${G.level + 1}` : 'Locked';
}

function pause() {
  if (G.mode !== 'play') return;
  G.mode = 'paused';
  G.aiming = false;
  syncToggles();
  show('#pause');
}
function resume() {
  if (G.mode !== 'paused') return;
  G.mode = 'play';
  show(null);
}

function syncToggles() {
  $('#btnMusic').textContent = `Music: ${save.music ? 'On' : 'Off'}`;
  $('#btnSfx').textContent = `Sound: ${save.sfx ? 'On' : 'Off'}`;
}

// ---------- effects ----------

const PARTY = ['#ff4fa3', '#ffd43b', '#66d9e8', '#b197fc', '#69db7c', '#ff922b', '#ffffff'];

function confetti(x, y, n) {
  const u = V.u;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6, sp = (160 + Math.random() * 420) * u;
    G.fx.push({
      kind: 'conf', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14,
      w: (4 + Math.random() * 5) * u, h: (6 + Math.random() * 6) * u, col: PARTY[(Math.random() * PARTY.length) | 0],
      t: 0, dur: 1.5 + Math.random() * 1.1,
    });
  }
}

function sparkle(x, y, n, cols = PARTY, power = 1) {
  const u = V.u;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = (60 + Math.random() * 200) * u * power;
    G.fx.push({
      kind: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: (1.6 + Math.random() * 2.6) * u,
      col: cols[(Math.random() * cols.length) | 0], t: 0, dur: 0.45 + Math.random() * 0.5 * power,
    });
  }
}

function floater(text, x, y, col) {
  G.fx.push({ kind: 'float', text, x, y, col, t: 0, dur: 1.1 });
}

function updateFx(dt) {
  const u = V.u;
  for (const f of G.fx) {
    f.t += dt;
    if (f.kind === 'conf') {
      f.vy += 780 * u * dt;
      f.vx *= Math.exp(-1.2 * dt);
      f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt;
    } else if (f.kind === 'spark') {
      f.vy += 220 * u * dt;
      f.vx *= Math.exp(-2.5 * dt); f.vy *= Math.exp(-2.5 * dt);
      f.x += f.vx * dt; f.y += f.vy * dt;
    }
    if (f.t >= f.dur && f.done) { const d = f.done; f.done = null; d(); }
  }
  G.fx = G.fx.filter((f) => f.t < f.dur);
}

function drawFx() {
  const u = V.u;
  for (const f of G.fx) {
    const p = clamp(f.t / f.dur, 0, 1);
    if (f.kind === 'conf') {
      ctx.save();
      ctx.globalAlpha = p > 0.75 ? (1 - p) / 0.25 : 1;
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      ctx.scale(1, Math.cos(f.rot * 1.7));
      ctx.fillStyle = f.col;
      ctx.fillRect(-f.w / 2, -f.h / 2, f.w, f.h);
      ctx.restore();
    } else if (f.kind === 'spark') {
      ctx.globalAlpha = 1 - p;
      ctx.fillStyle = f.col;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    } else if (f.kind === 'ring') {
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4 * u * (1 - p) + 1;
      ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * (0.4 + easeOut(p) * 0.8), f.r * (0.4 + easeOut(p) * 0.8) * 0.8, 0, 0, 7); ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (f.kind === 'float') {
      ctx.globalAlpha = p > 0.6 ? (1 - p) / 0.4 : 1;
      label(f.text, f.x, f.y - easeOut(p) * 34 * u, 14 * u, f.col, 4 * u, 800);
      ctx.globalAlpha = 1;
    } else if (f.kind === 'coin') {
      if (f.t < 0) continue;
      const e = easeInOut(p);
      const x = lerp(f.x0, f.x1, e) + Math.sin(e * Math.PI) * f.bend;
      const y = lerp(f.y0, f.y1, e) - Math.sin(e * Math.PI) * 40 * u;
      drawCoin(x, y, 8 * u);
    } else if (f.kind === 'fly') {
      const e = easeInOut(p);
      const x = lerp(f.x0, f.x1, e), y = lerp(f.y0, f.y1, e) - Math.sin(e * Math.PI) * 60 * u;
      const s = lerp(f.s0, f.s1, e) * (1 + Math.sin(e * Math.PI) * 0.35);
      drawFit(f.tier, x, y, s, s);
    }
  }
}

// ---------- drawing helpers ----------

function label(text, x, y, size, fill, stroke, weight = 800) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  if (stroke) { ctx.strokeStyle = INK; ctx.lineWidth = stroke; ctx.strokeText(text, x, y); }
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

function drawCoin(x, y, r) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7);
  ctx.fillStyle = '#ffc93c'; ctx.fill();
  ctx.lineWidth = r * 0.22; ctx.strokeStyle = '#a86a00'; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r * 0.66, 0, 7);
  ctx.strokeStyle = '#ffe9a3'; ctx.lineWidth = r * 0.14; ctx.stroke();
  // a tiny cocktail glass as the coin's mark
  ctx.fillStyle = '#a86a00';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.38, y - r * 0.32); ctx.lineTo(x + r * 0.38, y - r * 0.32); ctx.lineTo(x, y + r * 0.1);
  ctx.closePath(); ctx.fill();
  ctx.fillRect(x - r * 0.05, y + r * 0.05, r * 0.1, r * 0.3);
  ctx.fillRect(x - r * 0.24, y + r * 0.33, r * 0.48, r * 0.09);
}

// Draw a drink's visible pixels fitted inside a box centred on (cx, cy).
function drawFit(tier, cx, cy, bw, bh) {
  const sp = sprites[tier], bb = sp.bb, ss = sp.ss;
  const s = Math.min(bw / bb.w, bh / bb.h);
  ctx.drawImage(sp, bb.x * ss, bb.y * ss, bb.w * ss, bb.h * ss, cx - bb.w * s / 2, cy - bb.h * s / 2, bb.w * s, bb.h * s);
}

// Draw a drink standing on the table at table position (x, y).
function drawDrink(tier, x, y, r, scale = 1, rot = 0) {
  const p = proj(x, y), sp = sprites[tier];
  const k = (r * V.ppu * p.s) / BOX.fr;
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 27 * k, 60 * k, 16 * k, 0, 0, 7); ctx.fill();
  const ks = k * scale, by = p.y + 27 * k;
  ctx.save();
  ctx.translate(p.x, by);
  if (rot) ctx.rotate(rot);
  ctx.drawImage(sp, -BOX.ax * ks, -(BOX.ay + 27) * ks, BOX.w * ks, BOX.h * ks);
  ctx.restore();
}

// ---------- HUD ----------

function drawHud() {
  const u = V.u, p = V.pill;
  rr(ctx, p.x, p.y, p.w, p.h, p.h / 2);
  ctx.fillStyle = 'rgba(10,8,34,0.72)'; ctx.fill();
  ctx.lineWidth = 1.6 * u; ctx.strokeStyle = '#ffc93c'; ctx.stroke();
  drawCoin(p.x + 17 * u, p.y + p.h / 2, 12 * u);
  ctx.font = `800 ${17 * u}px ${FONT}`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(Math.round(G.coinsShown).toLocaleString(), p.x + 35 * u, p.y + p.h / 2 + 1 * u);

  const tx = (p.x + p.w + V.gx + V.gw - 52 * u) / 2;
  ctx.shadowColor = stage().accent; ctx.shadowBlur = 10 * V.dpr;
  label(stage().name.toUpperCase(), tx, p.y + p.h / 2 - 6 * u, 11.5 * u, '#ffe3f1', 0, 800);
  ctx.shadowBlur = 0;
  const n = G.orders.length || 1;
  label(`Level ${G.level + 1}  ·  Order ${Math.min(G.shownIdx + 1, n)} of ${n}`, tx, p.y + p.h / 2 + 9 * u, 10 * u, 'rgba(255,255,255,0.7)', 0, 600);
}

function drawLadder() {
  const u = V.u, L = V.lad;
  rr(ctx, L.x, L.y, L.w, L.h, L.h / 2);
  ctx.fillStyle = 'rgba(10,8,34,0.62)'; ctx.fill();
  ctx.lineWidth = 1.2 * u; ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.stroke();
  const n = DRINKS.length, sw = (L.w - 14 * u) / n, tt = targetTier();
  for (let i = 0; i < n; i++) {
    const cx = L.x + 7 * u + sw * (i + 0.5), cy = L.y + L.h / 2;
    if (i === tt) {
      ctx.beginPath(); ctx.arc(cx, cy, 16.5 * u, 0, 7);
      ctx.fillStyle = 'rgba(255,201,60,0.3)'; ctx.fill();
      ctx.lineWidth = 2 * u; ctx.strokeStyle = '#ffc93c'; ctx.stroke();
    }
    drawFit(i, cx, cy, sw * 0.8, L.h - 9 * u);
    if (i < n - 1) {
      ctx.font = `800 ${10 * u}px ${FONT}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillText('›', cx + sw / 2, cy - 1 * u);
    }
  }
}

function paperPath(w, h, u) {
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.lineTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  const n = Math.max(6, Math.round(w / (7 * u)));
  for (let i = 1; i <= n; i++) {
    const x = w / 2 - (w * i) / n;
    ctx.lineTo(x + w / (2 * n), h - 3.5 * u);
    ctx.lineTo(x, h);
  }
  ctx.closePath();
}

function drawTicket(r, order, o) {
  const u = V.u, k = r.w / (138 * u), q = u * k;
  ctx.save();
  ctx.translate(r.cx, r.y);
  ctx.rotate(o.rot || 0);
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 9 * V.dpr; ctx.shadowOffsetY = 3 * V.dpr;
  const gold = order.jackpot || (order.high > 0 && !order.missed);
  paperPath(r.w, r.h, u);
  if (gold) {
    const gg = ctx.createLinearGradient(0, 0, 0, r.h);
    gg.addColorStop(0, o.dim ? '#e6cf7a' : '#fff3b0');
    gg.addColorStop(0.55, o.dim ? '#d9b23a' : '#ffd43b');
    gg.addColorStop(1, o.dim ? '#c08a16' : '#f59f00');
    ctx.fillStyle = gg;
  } else ctx.fillStyle = o.dim ? '#d6cdba' : '#fff8ea';
  ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  rr(ctx, -9 * q, -7 * u, 18 * q, 13 * u, 3 * u);
  ctx.fillStyle = '#e8c05a'; ctx.fill();
  ctx.lineWidth = 1.4 * u; ctx.strokeStyle = '#8a5f16'; ctx.stroke();

  label(gold ? 'HIGH ROLLER ×3' : o.label, 0, 15 * q, 10 * q, gold ? '#7a3f00' : '#c0392b', 0, 800);
  ctx.strokeStyle = 'rgba(60,40,20,0.35)';
  ctx.lineWidth = 1 * u;
  ctx.setLineDash([3 * u, 3 * u]);
  ctx.beginPath(); ctx.moveTo(-r.w / 2 + 8 * q, 24 * q); ctx.lineTo(r.w / 2 - 8 * q, 24 * q); ctx.stroke();
  ctx.setLineDash([]);

  const dh = r.h - 24 * q - 41 * q;
  drawFit(order.tier, 0, 27 * q + dh / 2, r.w - 26 * q, dh);
  if (gold && o.current && !order.jackpot) {
    const left = G.highLeft;
    label(left > 0 ? `${left} slide${left === 1 ? '' : 's'} left` : 'Last chance!', 0, r.h - 31 * q, 11 * q, '#b02a00', 0, 800);
  } else label(DRINKS[order.tier].name, 0, r.h - 31 * q, 10.5 * q, '#3b2a1a', 0, 700);

  const txt = String(gold ? order.coins * 3 : order.coins);
  ctx.font = `800 ${15 * q}px ${FONT}`;
  const tw = ctx.measureText(txt).width, total = 16 * q + 4 * q + tw;
  drawCoin(-total / 2 + 8 * q, r.h - 15 * q, 8 * q);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#3b2a1a';
  ctx.fillText(txt, -total / 2 + 20 * q, r.h - 14 * q);

  if (o.stamp) {
    ctx.rotate(-0.28);
    ctx.font = `900 ${22 * q}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 2.5 * q; ctx.strokeStyle = '#2f9e44';
    rr(ctx, -50 * q, 44 * q, 100 * q, 34 * q, 5 * q); ctx.stroke();
    ctx.fillStyle = '#2f9e44';
    ctx.fillText('SERVED', -6 * q, 62 * q);
  }
  ctx.restore();
}

function drawOrders() {
  const u = V.u, orders = G.orders, n = orders.length;
  // brass rail
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#8a5f16'; ctx.lineWidth = 5 * u;
  ctx.beginPath(); ctx.moveTo(V.gx + 8 * u, V.railY); ctx.lineTo(V.gx + V.gw - 8 * u, V.railY); ctx.stroke();
  ctx.strokeStyle = '#f0cf78'; ctx.lineWidth = 2 * u;
  ctx.beginPath(); ctx.moveTo(V.gx + 8 * u, V.railY - 1 * u); ctx.lineTo(V.gx + V.gw - 8 * u, V.railY - 1 * u); ctx.stroke();

  const i = G.shownIdx, sway = (k) => Math.sin(G.time * 1.3 + k * 1.7) * 0.014;
  const a = G.tAnim;
  if (a) {
    const e = easeInOut(clamp(a.t / 0.55, 0, 1));
    if (orders[i + 1]) drawTicket(V.nxt, orders[i + 1], { label: 'ON DECK', dim: true, alpha: e, rot: sway(i + 1) });
    if (orders[i]) {
      const r = { cx: lerp(V.nxt.cx, V.cur.cx, e), y: V.railY, w: lerp(V.nxt.w, V.cur.w, e), h: lerp(V.nxt.h, V.cur.h, e) };
      drawTicket(r, orders[i], { label: e > 0.5 ? `ORDER ${i + 1} OF ${n}` : 'ON DECK', dim: e < 0.5, rot: sway(i), current: e > 0.5 });
    }
    const old = { cx: V.cur.cx - e * 20 * u, y: V.railY + e * e * 90 * u, w: V.cur.w, h: V.cur.h };
    drawTicket(old, orders[a.old], { label: `ORDER ${a.old + 1} OF ${n}`, alpha: 1 - e, rot: -e * 0.35, stamp: true });
  } else {
    if (orders[i + 1]) drawTicket(V.nxt, orders[i + 1], { label: 'ON DECK', dim: true, rot: sway(i + 1) });
    if (orders[i]) drawTicket(V.cur, orders[i], { label: `ORDER ${i + 1} OF ${n}`, rot: sway(i), current: true });
  }
}

function drawNextBox() {
  const u = V.u, b = V.nb;
  ctx.strokeStyle = '#8a5f16'; ctx.lineWidth = 2 * u;
  ctx.beginPath(); ctx.moveTo(b.x + b.w / 2, V.railY); ctx.lineTo(b.x + b.w / 2, b.y); ctx.stroke();
  rr(ctx, b.x, b.y, b.w, b.h, 14 * u);
  ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill();
  ctx.lineWidth = 3 * u; ctx.strokeStyle = '#ffc93c'; ctx.stroke();
  if (G.mode !== 'title' && G.orderIdx < G.orders.length) drawFit(G.next, b.x + b.w / 2, b.y + b.h / 2, b.w - 24 * u, b.h - 22 * u);
  label('NEXT', b.x + b.w / 2, b.y + b.h + 13 * u, 14 * u, '#ffffff', 4.5 * u, 900);
}

// ---------- table contents ----------

function drawFailLine() {
  const u = V.u, a = proj(0, T.FAIL), b = proj(T.W, T.FAIL);
  const hot = G.danger > 0 && Math.sin(G.time * 16) > 0;
  ctx.save();
  ctx.setLineDash([9 * u, 8 * u]);
  ctx.lineCap = 'round';
  ctx.lineWidth = 2.8 * u;
  ctx.strokeStyle = G.danger > 0 ? (hot ? '#ff3b3b' : '#ffd6d6') : stage().table.line;
  ctx.shadowColor = ctx.strokeStyle;
  ctx.shadowBlur = 10 * V.dpr;
  ctx.beginPath(); ctx.moveTo(a.x + 4 * u, a.y); ctx.lineTo(b.x - 4 * u, b.y); ctx.stroke();
  ctx.restore();
}

function heldX() {
  const r = DRINKS[G.held.tier].r;
  return clamp(G.aimX, r, T.W - r);
}

function drawAim() {
  if (!G.held) return;
  const u = V.u, r = DRINKS[G.held.tier].r, x = heldX();
  let hitY = r;
  for (const b of G.world.bodies) {
    const dx = Math.abs(b.x - x), rr2 = b.r + r;
    if (dx < rr2) hitY = Math.max(hitY, b.y + Math.sqrt(rr2 * rr2 - dx * dx));
  }
  hitY = Math.min(hitY, T.LAUNCH - r);
  const a = proj(x, T.LAUNCH - r * 0.6), b = proj(x, hitY);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = G.aiming ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2.4 * u;
  ctx.setLineDash([2 * u, 7 * u]);
  ctx.lineDashOffset = -G.time * 30 * u;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  ctx.setLineDash([]);
  const rx = r * V.ppu * b.s;
  ctx.lineWidth = 1.8 * u;
  ctx.beginPath(); ctx.ellipse(b.x, b.y, rx, rx * 0.8, 0, 0, 7); ctx.stroke();
  ctx.restore();
}

function drawProp(b) {
  const p = proj(b.x, b.y), sp = propSprites[b.kind], k = (b.r * V.ppu * p.s) / BOX.fr;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 27 * k, 66 * k, 19 * k, 0, 0, 7); ctx.fill();
  ctx.drawImage(sp, p.x - BOX.ax * k, p.y - BOX.ay * k, BOX.w * k, BOX.h * k);
}

// A flat obstacle lies on the bar and turns (the roulette wheel).
function drawFlatProp(b) {
  const p = proj(b.x, b.y), sp = propSprites[b.kind];
  const rx = b.r * V.ppu * p.s, ry = rx * 0.9, th = rx * 0.17;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + th * 1.7, rx * 1.05, ry * 1.05, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#3a1d0d';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + th, rx, ry, 0, 0, 7); ctx.fill();
  ctx.lineWidth = 2 * V.u; ctx.strokeStyle = INK; ctx.stroke();
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(1, ry / rx);
  ctx.rotate(b.angle || 0);
  ctx.drawImage(sp, -rx, -rx, rx * 2, rx * 2);
  ctx.restore();
}

function drawBodies() {
  const list = G.world.bodies.slice().sort((a, b) => a.y - b.y);
  for (const b of list) {
    if (b.flat) { drawFlatProp(b); continue; }
    if (b.fixed) { drawProp(b); continue; }
    const tau = G.time - b.born;
    const pop = tau < 0.28 ? 1 + 0.2 * Math.sin((tau / 0.28) * Math.PI) : 1;
    drawDrink(b.tier, b.x, b.y, b.r, pop, clamp(b.vx * 0.0035, -0.22, 0.22));
  }
}

function drawHeld() {
  if (!G.held) return;
  const u = V.u, d = DRINKS[G.held.tier], x = heldX();
  const p = proj(x, T.LAUNCH), rx = d.r * V.ppu * p.s;
  ctx.beginPath(); ctx.ellipse(p.x, p.y + rx * 0.34, rx * 1.12, rx * 0.5, 0, 0, 7);
  ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill();
  ctx.lineWidth = 1.5 * u; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.stroke();
  const tau = G.time - G.held.born;
  drawDrink(G.held.tier, x, T.LAUNCH, d.r, tau < 0.16 ? easeBack(tau / 0.16) : 1, Math.sin(G.time * 3) * 0.03);
}

function drawBanner() {
  const b = G.banner;
  if (!b) return;
  const u = V.u, p = b.t / b.dur;
  const s = p < 0.16 ? easeBack(p / 0.16) : p > 0.82 ? 1 - (p - 0.82) / 0.18 : 1;
  const y = lerp(V.farY, V.nearY, 0.4);
  ctx.save();
  ctx.translate(V.cx, y);
  ctx.scale(s, s);
  ctx.globalAlpha = clamp(s, 0, 1);
  ctx.font = `900 ${46 * u}px ${FONT}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.strokeStyle = INK; ctx.lineWidth = 11 * u; ctx.strokeText(b.text, 0, 0);
  const g = ctx.createLinearGradient(0, -24 * u, 0, 24 * u);
  g.addColorStop(0, '#fff3b0'); g.addColorStop(1, '#ff9f1a');
  ctx.fillStyle = g; ctx.fillText(b.text, 0, 0);
  ctx.restore();
  ctx.globalAlpha = clamp(s, 0, 1);
  label(b.sub, V.cx, y + 40 * u, 17 * u, '#ffffff', 5 * u, 800);
  ctx.globalAlpha = 1;
}

function drawDanger() {
  if (G.danger <= 0 || G.mode !== 'play') return;
  const u = V.u, k = clamp(G.danger / DANGER_SECONDS, 0, 1);
  const a = proj(0, 0), cc = proj(T.W, T.L);
  ctx.fillStyle = `rgba(255,40,40,${(0.08 + 0.1 * k) * (0.6 + 0.4 * Math.sin(G.time * 12))})`;
  ctx.fillRect(0, a.y - 20 * u, V.w, cc.y - a.y + 40 * u);
  const p = proj(T.W / 2, T.FAIL);
  label(String(Math.max(1, Math.ceil(DANGER_SECONDS - G.danger))), p.x, p.y - 30 * u, 44 * u, '#ff5a5a', 8 * u, 900);
  label('Too full! Merge to clear space', p.x, p.y - 62 * u, 13 * u, '#ffffff', 4 * u, 800);
}

function drawHint() {
  if (G.mode !== 'play' || G.level !== 0 || G.launches >= 3 || G.banner) return;
  const u = V.u, y = lerp(V.farY, V.nearY, 0.5);
  ctx.globalAlpha = G.launches === 2 ? 0.55 : 0.95;
  label('Drag to aim, let go to slide', V.cx, y, 16 * u, '#ffffff', 4.5 * u, 800);
  label('Two matching drinks merge into a bigger one', V.cx, y + 22 * u, 11.5 * u, '#ffe3f1', 3.5 * u, 700);
  ctx.globalAlpha = 1;
}

// ---------- loop ----------

let acc = 0;

function update(dt) {
  if (G.mode === 'paused') return;
  G.time += dt;

  if (G.mode === 'play' || G.mode === 'clearing') {
    acc += dt;
    while (acc >= 1 / 60) { G.world.step(1 / 60); acc -= 1 / 60; }
    for (const b of G.world.bodies) if (b.fling) b.angle += b.spinDir * 2.6 * dt;
  }

  if (G.mode === 'play') {
    if (!G.held) {
      G.cooldown -= dt;
      if (G.cooldown <= 0) {
        G.held = { tier: G.next, born: G.time };
        G.next = deal();
        if (G.queued) launch();
      }
    }
    // Serve the ordered drink as soon as one is standing on the bar.
    if (G.time >= G.serveGate) {
      const tt = targetTier();
      let pick = null;
      for (const b of G.world.bodies) {
        if (b.tier === tt && !b.sliding && b.age > 0.25 && (!pick || b.y > pick.y)) pick = b;
      }
      if (pick) {
        G.world.bodies = G.world.bodies.filter((b) => b !== pick);
        deliver(pick.tier, pick.x, pick.y);
      }
    }
    if (G.shakeCd > 0) G.shakeCd -= dt;
    if (G.dangerHold > 0) G.dangerHold -= dt;
    let over = false;
    if (G.dangerHold <= 0 && G.mode === 'play') for (const b of G.world.bodies) {
      // Only a drink that has come to rest past the line counts; one drifting through does not.
      if (!b.fixed && !b.sliding && b.age > 1.1 && b.y + b.r > T.FAIL && Math.hypot(b.vx, b.vy) < 30) { over = true; break; }
    }
    if (over) {
      G.danger += dt;
      if (G.time - G.lastWarn > 0.7) { sound.warn(); G.lastWarn = G.time; }
      if (G.danger >= DANGER_SECONDS) lose();
    } else {
      G.danger = Math.max(0, G.danger - dt * 2.5);
    }
  }

  if (G.mode === 'clearing' && G.clearAt && G.time >= G.clearAt) levelClear();

  if (G.mode === 'clear' && G.time >= G.fireAt) {
    G.fireAt = G.time + 0.35 + Math.random() * 0.4;
    const x = V.gx + V.gw * (0.12 + Math.random() * 0.76), y = V.h * (0.1 + Math.random() * 0.5);
    const col = PARTY[(Math.random() * PARTY.length) | 0];
    sparkle(x, y, 44, [col, '#ffffff', col], 1.7);
    if (Math.random() < 0.5) confetti(V.cx + (Math.random() - 0.5) * V.gw * 0.6, V.h * 0.3, 24);
  }

  if (G.shakeFx > 0) G.shakeFx -= dt;
  updateFx(dt);
  if (G.banner) { G.banner.t += dt; if (G.banner.t >= G.banner.dur) G.banner = null; }
  if (G.tAnim) { G.tAnim.t += dt; if (G.tAnim.t >= 0.55) G.tAnim = null; }
  G.coinsShown += (save.coins - G.coinsShown) * Math.min(1, dt * 7);
  if (Math.abs(save.coins - G.coinsShown) < 0.6) G.coinsShown = save.coins;
}

function render() {
  const sh = G.shakeFx > 0 ? G.shakeFx / 0.45 : 0;
  ctx.setTransform(V.dpr, 0, 0, V.dpr, Math.sin(G.time * 95) * 7 * V.u * sh * V.dpr, Math.cos(G.time * 71) * 5 * V.u * sh * V.dpr);
  ctx.drawImage(bg, 0, 0, V.w, V.h);
  drawMarquee();
  drawHud();
  drawLadder();
  if (G.mode === 'title') return;
  drawOrders();
  drawNextBox();
  drawFailLine();
  if (G.mode === 'play') drawAim();
  drawBodies();
  if (G.mode === 'play' || G.mode === 'paused') drawHeld();
  drawDanger();
  drawFx();
  drawBanner();
  drawHint();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

// ---------- input ----------

function setAim(clientX) {
  G.aimX = T.W / 2 + (clientX - V.cx) * zAt(T.LAUNCH) / V.ppu;
}

canvas.addEventListener('pointerdown', (e) => {
  if (G.mode !== 'play') return;
  sound.unlock();
  G.aiming = true;
  G.pid = e.pointerId;
  setAim(e.clientX);
  try { canvas.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
  e.preventDefault();
});
canvas.addEventListener('pointermove', (e) => {
  if (G.aiming && e.pointerId === G.pid) setAim(e.clientX);
});
canvas.addEventListener('pointerup', (e) => {
  if (!G.aiming || e.pointerId !== G.pid) return;
  G.aiming = false;
  setAim(e.clientX);
  launch();
});
canvas.addEventListener('pointercancel', () => { G.aiming = false; });
// Stop the page itself from scrolling, zooming or showing the long-press menu.
for (const ev of ['touchmove', 'gesturestart', 'dblclick', 'contextmenu']) {
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
}

window.addEventListener('keydown', (e) => {
  if (G.mode === 'play') {
    if (e.key === 'ArrowLeft') G.aimX = clamp(G.aimX - 3, 0, T.W);
    else if (e.key === 'ArrowRight') G.aimX = clamp(G.aimX + 3, 0, T.W);
    else if (e.key === ' ') { sound.unlock(); launch(); e.preventDefault(); }
    else if (e.key === 's') shake();
    else if (e.key === 'Escape' || e.key === 'p') pause();
  } else if (G.mode === 'paused' && (e.key === 'Escape' || e.key === 'p')) resume();
});

function tapButton(sel, fn) {
  const el = $(sel);
  el.addEventListener('click', () => { sound.unlock(); sound.tap(); fn(); });
}

tapButton('#btnPlay', () => startLevel(G.level));
tapButton('#btnShake', shake);
tapButton('#btnNext', () => {
  if (G.level >= stage().levels.length - 1) { setStage(G.stage + 1); startLevel(0); }
  else startLevel(G.level + 1);
});
tapButton('#btnPrevStage', () => setStage(G.stage - 1));
tapButton('#btnNextStage', () => setStage(G.stage + 1));
tapButton('#btnPause', pause);
tapButton('#btnResume', resume);
tapButton('#btnRestart', () => startLevel(G.level));
tapButton('#btnRetry', () => startLevel(G.level));
tapButton('#btnAgain', () => startLevel(G.level));
tapButton('#btnQuit', toTitle);
tapButton('#btnLostQuit', toTitle);
tapButton('#btnClearQuit', toTitle);
tapButton('#btnMusic', () => { save.music = !save.music; sound.setMusic(save.music); persist(); syncToggles(); });
tapButton('#btnSfx', () => { save.sfx = !save.sfx; sound.setSfx(save.sfx); persist(); syncToggles(); });

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { pause(); sound.suspend(); }
  else sound.resume();
});
window.addEventListener('resize', layout);
window.addEventListener('orientationchange', () => setTimeout(layout, 200));

// ---------- boot ----------

if (save.stage > 0 && save.stage < STAGES.length && stageOpen(save.stage)) G.stage = save.stage;
$('#soon').textContent = `Coming soon: ${COMING_SOON.join(' · ')}`;
$('#build').textContent = `Build: ${BUILD}`;
if (!standalone && IOS) $('#a2hs').hidden = false;

layout();
toTitle();
requestAnimationFrame(frame);
loadArtOverrides(sprites, propSprites).then((art) => {
  for (const st of STAGES) {
    const file = art && art.stages && art.stages[st.id] && art.stages[st.id].backdrop;
    if (!file) continue;
    const img = new Image();
    img.onload = () => { st.backdropImg = img; if (st === stage()) paintStatic(); };
    img.src = 'assets/' + file;
  }
});

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Handy for testing from the console.
window.__topshelf = { tick: update, STAGES, G, T, V: () => V, DRINKS, sprites, save, launchAt(x) { G.aimX = x; launch(); }, PHYS, startLevel, setStage, shake, sound, propSprites };
