// Pool-table physics for round drink bases on a flat bar top: no spin, no slope.
// Table space: x in [0, W], y in [0, L]; y = 0 is the far end, y = L is the player's end.
//
// - A drink keeps moving in a straight line and slows at a steady rate (felt-like friction).
// - Two drinks that touch exchange momentum like pool balls; heavier (bigger) drinks are
//   harder to move. `rest` is how much of the bounce survives (1 = perfectly elastic).
// - Walls and obstacles bounce drinks back. Bodies marked `fixed` are obstacles: they
//   never move and never merge.
// - `gravity` is an optional pull toward the far end. It is 0 by default (a level bar).
// - Only the launch area behind `zoneY` slopes, to hand stray drinks back to the bar.

export class World {
  constructor(W, L, opt = {}) {
    this.W = W;
    this.L = L;
    this.bodies = [];
    this.friction = opt.friction ?? 150;     // steady slow-down, table units per second squared
    this.rest = opt.rest ?? 0.8;             // drink on drink
    this.restWall = opt.restWall ?? 0.6;     // drink on wall
    this.restFixed = opt.restFixed ?? 0.5;   // drink on obstacle
    this.gravity = opt.gravity ?? 0;
    this.massPow = opt.massPow ?? 1;         // mass = radius ^ massPow (0 = all equal, like pool balls)
    // The launch area behind the "full" line slopes gently back onto the bar, like a ball
    // return, so a drink that bounces back toward the player is not stranded there.
    this.zoneY = opt.zoneY ?? Infinity;
    this.zonePull = opt.zonePull ?? 280;
    this.maxSpeed = 320;
    this.onMerge = null;   // (a, b) => new body spec or null
    this.onImpact = null;  // (speed, a, b|null)
    this._id = 1;
  }

  add(b) {
    b.id = this._id++;
    b.age = 0;
    b.vx ??= 0;
    b.vy ??= 0;
    b.rT ??= b.r;
    b.grow ??= 0;
    b.dead = false;
    this.bodies.push(b);
    return b;
  }

  clear() { this.bodies = []; }

  step(dt) {
    for (const b of this.bodies) {
      b.age += dt;
      if (b.r < b.rT) b.r = Math.min(b.rT, b.r + b.grow * dt);
    }
    const SUB = 4;
    for (let s = 0; s < SUB; s++) this._sub(dt / SUB);
  }

  _sub(h) {
    const B = this.bodies, n = B.length, W = this.W, L = this.L;
    const slow = this.friction * h;

    for (const b of B) {
      if (b.fixed) { b.vx = b.vy = 0; continue; }
      if (this.gravity) b.vy -= this.gravity * h;
      if (b.y + b.r > this.zoneY) b.vy -= this.zonePull * h;
      let sp = Math.hypot(b.vx, b.vy);
      if (sp > this.maxSpeed) { b.vx *= this.maxSpeed / sp; b.vy *= this.maxSpeed / sp; sp = this.maxSpeed; }
      if (sp <= slow) { b.vx = b.vy = 0; b.sliding = false; }
      else { const k = (sp - slow) / sp; b.vx *= k; b.vy *= k; }
      b.x += b.vx * h;
      b.y += b.vy * h;
    }

    const merges = [];
    for (let it = 0; it < 3; it++) {
      for (let i = 0; i < n; i++) {
        const a = B[i];
        if (a.dead) continue;
        for (let j = i + 1; j < n; j++) {
          const b = B[j];
          if (b.dead || (a.fixed && b.fixed)) continue;
          const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r;
          const d2 = dx * dx + dy * dy;
          if (d2 >= rr * rr) continue;
          if (a.tier === b.tier) {
            a.dead = b.dead = true;
            merges.push([a, b]);
            break;
          }
          const d = Math.sqrt(d2) || 0.001;
          const nx = dx / d, ny = dy / d;
          // inverse masses: bigger drinks are somewhat heavier; obstacles are immovable
          const ia = a.fixed ? 0 : 1 / Math.pow(a.r, this.massPow), ib = b.fixed ? 0 : 1 / Math.pow(b.r, this.massPow);
          const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (vn < 0) {
            const e = a.fixed || b.fixed ? this.restFixed : this.rest;
            const jn = (-(1 + e) * vn) / (ia + ib);
            a.vx -= jn * ia * nx; a.vy -= jn * ia * ny;
            b.vx += jn * ib * nx; b.vy += jn * ib * ny;
            this.onImpact?.(-vn, a, b);
          }
          // separate them so they never overlap
          const pen = rr - d, wa = ia / (ia + ib), wb = ib / (ia + ib);
          a.x -= nx * pen * wa; a.y -= ny * pen * wa;
          b.x += nx * pen * wb; b.y += ny * pen * wb;
          a.sliding = b.sliding = false;
          // A spinning obstacle (the roulette wheel) flings a drink sideways, the way its
          // rim is moving, but only when the drink actually runs into it, and not again
          // for a moment afterwards. A drink that is merely resting against the wheel, or
          // pinned there by its neighbours, is left alone; kicking it every instant made
          // trapped drinks vibrate.
          const sp = a.fixed ? a : b.fixed ? b : null;
          if (sp && sp.fling && vn < -20) {
            const m = sp === a ? b : a, s = sp === a ? 1 : -1;
            if (m.age - (m.flungAt ?? -9) > 0.5) {
              m.flungAt = m.age;
              const ox = nx * s, oy = ny * s;                       // from the wheel out to the drink
              const tx = -oy * sp.spinDir, ty = ox * sp.spinDir;    // the way the rim is moving there
              const vt = m.vx * tx + m.vy * ty;
              if (vt < sp.fling) { m.vx += tx * (sp.fling - vt); m.vy += ty * (sp.fling - vt); }
            }
          }
        }
      }
      const e = this.restWall;
      for (const b of B) {
        if (b.dead || b.fixed) continue;
        if (b.x < b.r) {
          b.x = b.r;
          if (b.vx < 0) { if (b.vx < -22) this.onImpact?.(-b.vx * 0.6, b, null); b.vx = -e * b.vx; b.sliding = false; }
        } else if (b.x > W - b.r) {
          b.x = W - b.r;
          if (b.vx > 0) { if (b.vx > 22) this.onImpact?.(b.vx * 0.6, b, null); b.vx = -e * b.vx; b.sliding = false; }
        }
        if (b.y < b.r) {
          b.y = b.r;
          if (b.vy < 0) { if (b.vy < -22) this.onImpact?.(-b.vy * 0.6, b, null); b.vy = -e * b.vy; b.sliding = false; }
        } else if (b.y > L - b.r) {
          b.y = L - b.r;
          if (b.vy > 0) { b.vy = -e * b.vy; b.sliding = false; }
        }
      }
    }

    if (merges.length) {
      this.bodies = B.filter((b) => !b.dead);
      for (const [a, b] of merges) {
        const nb = this.onMerge?.(a, b);
        if (nb) this.add(nb);
      }
    }
  }
}
