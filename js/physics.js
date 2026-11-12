// Tiny position-based physics for round drink bases sliding on a bar top.
// Table space: x in [0, W], y in [0, L]; y = 0 is the far end, y = L is the player's end.
// A gentle pull toward the far end keeps the pile packed, like a bar that slopes away from you.

export class World {
  constructor(W, L, opt = {}) {
    this.W = W;
    this.L = L;
    this.bodies = [];
    this.gravity = opt.gravity ?? 160;
    this.damp = opt.damp ?? 1.4;
    this.rest = opt.rest ?? 0.22;
    this.maxSpeed = 250;
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
    const B = this.bodies, n = B.length, W = this.W;
    const k = Math.exp(-this.damp * h);

    for (const b of B) {
      if (!b.sliding) {
        b.vy -= this.gravity * h;
        b.vx *= k;
        b.vy *= k;
      }
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > this.maxSpeed) { b.vx *= this.maxSpeed / sp; b.vy *= this.maxSpeed / sp; }
      b.px = b.x; b.py = b.y; b.pvx = b.vx; b.pvy = b.vy;
      b.x += b.vx * h;
      b.y += b.vy * h;
    }

    const merges = [];
    const contacts = [];
    for (let it = 0; it < 5; it++) {
      for (let i = 0; i < n; i++) {
        const a = B[i];
        if (a.dead) continue;
        for (let j = i + 1; j < n; j++) {
          const b = B[j];
          if (b.dead) continue;
          const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r;
          const d2 = dx * dx + dy * dy;
          if (d2 >= rr * rr) continue;
          if (a.tier === b.tier) {
            a.dead = b.dead = true;
            merges.push([a, b]);
            break;
          }
          const d = Math.sqrt(d2) || 0.001;
          const nx = dx / d, ny = dy / d, pen = rr - d;
          const ma = a.r * a.r, mb = b.r * b.r;
          const wa = mb / (ma + mb), wb = ma / (ma + mb);
          a.x -= nx * pen * wa; a.y -= ny * pen * wa;
          b.x += nx * pen * wb; b.y += ny * pen * wb;
          if (it === 0) contacts.push([a, b, nx, ny, wa, wb]);
          a.sliding = b.sliding = false;
        }
      }
      for (const b of B) {
        if (b.dead) continue;
        if (b.x < b.r) b.x = b.r;
        else if (b.x > W - b.r) b.x = W - b.r;
        if (b.y < b.r) { b.y = b.r; b.sliding = false; }
        else if (b.y > this.L - b.r) b.y = this.L - b.r;
      }
    }

    for (const b of B) {
      if (b.dead) continue;
      b.vx = (b.x - b.px) / h;
      b.vy = (b.y - b.py) / h;
      // Squeezed-out drinks should scoot, not teleport.
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > this.maxSpeed) { b.vx *= this.maxSpeed / sp; b.vy *= this.maxSpeed / sp; }
    }

    // A little bounce so glasses clink instead of thudding.
    const e = this.rest;
    for (const [a, b, nx, ny, wa, wb] of contacts) {
      if (a.dead || b.dead) continue;
      const pre = (b.pvx - a.pvx) * nx + (b.pvy - a.pvy) * ny;
      if (pre > -22) continue;
      const cur = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      const dv = -e * pre - cur;
      if (dv > 0) {
        a.vx -= nx * dv * wa; a.vy -= ny * dv * wa;
        b.vx += nx * dv * wb; b.vy += ny * dv * wb;
      }
      this.onImpact?.(-pre, a, b);
    }
    for (const b of B) {
      if (b.dead) continue;
      if (b.x <= b.r + 1e-6 && b.pvx < -22) { b.vx = -e * b.pvx; this.onImpact?.(-b.pvx * 0.6, b, null); }
      else if (b.x >= W - b.r - 1e-6 && b.pvx > 22) { b.vx = -e * b.pvx; this.onImpact?.(b.pvx * 0.6, b, null); }
      if (b.y <= b.r + 1e-6 && b.pvy < -22) { b.vy = -e * 0.6 * b.pvy; this.onImpact?.(-b.pvy * 0.6, b, null); }
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
