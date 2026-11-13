// The drink ladder and its original vector art.
// Every drink is drawn in a 200 x 250 design box. The point (AX, AY) is where the
// drink "stands" on the table, and FR design pixels equal the drink's footprint radius.

export const BOX = { w: 200, h: 250, ax: 100, ay: 192, fr: 78 };

export const DRINKS = [
  { id: 'tequila_shot', name: 'Tequila Shot', r: 5.3 },
  { id: 'whiskey_neat', name: 'Whiskey Neat', r: 6.8 },
  { id: 'gin_tonic', name: 'Gin & Tonic', r: 8.4 },
  { id: 'mojito', name: 'Mojito', r: 10.1 },
  { id: 'cosmopolitan', name: 'Cosmopolitan', r: 12.1 },
  { id: 'margarita', name: 'Margarita', r: 14.3 },
  { id: 'blue_hawaiian', name: 'Blue Hawaiian', r: 16.7 },
  { id: 'pina_colada', name: 'Piña Colada', r: 19.3 },
  { id: 'mai_tai', name: 'Mai Tai', r: 22.1 },
  { id: 'scorpion_bowl', name: 'Scorpion Bowl', r: 25.3 },
];

const INK = '#1b1f45';
const GLASS = 'rgba(214,236,255,0.34)';
const CX = 100;

// ---------- geometry helpers ----------

function cr(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

// Profile: [[halfWidth, y, sharp?], ...] from rim to base. Runs between sharp points are smoothed.
function dense(prof) {
  const out = [];
  let run = [prof[0]];
  const flush = () => {
    if (run.length < 3) {
      for (const p of run) out.push([p[0], p[1]]);
      return;
    }
    for (let i = 0; i < run.length - 1; i++) {
      const p0 = run[Math.max(0, i - 1)], p1 = run[i], p2 = run[i + 1], p3 = run[Math.min(run.length - 1, i + 2)];
      for (let s = 0; s < 8; s++) {
        const t = s / 8;
        out.push([Math.max(1, cr(p0[0], p1[0], p2[0], p3[0], t)), cr(p0[1], p1[1], p2[1], p3[1], t)]);
      }
    }
    const l = run[run.length - 1];
    out.push([l[0], l[1]]);
  };
  for (let i = 1; i < prof.length; i++) {
    run.push(prof[i]);
    if (prof[i][2] || i === prof.length - 1) { flush(); run = [prof[i]]; }
  }
  return out;
}

function hwAt(d, y) {
  for (let i = 0; i < d.length - 1; i++) {
    const a = d[i], b = d[i + 1];
    if (y >= a[1] && y <= b[1]) {
      const t = b[1] === a[1] ? 0 : (y - a[1]) / (b[1] - a[1]);
      return a[0] + (b[0] - a[0]) * t;
    }
  }
  return y < d[0][1] ? d[0][0] : d[d.length - 1][0];
}

function bodyPath(c, d, rimK, baseK) {
  const top = d[0], bot = d[d.length - 1];
  c.beginPath();
  c.moveTo(CX + top[0], top[1]);
  for (const p of d) c.lineTo(CX + p[0], p[1]);
  c.ellipse(CX, bot[1], bot[0], bot[0] * baseK, 0, 0, Math.PI);
  for (let i = d.length - 1; i >= 0; i--) c.lineTo(CX - d[i][0], d[i][1]);
  c.ellipse(CX, top[1], top[0], top[0] * rimK, 0, Math.PI, Math.PI * 2);
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

// ---------- the glass ----------

function vessel(c, o) {
  const d = dense(o.prof);
  const rimK = o.rimK ?? 0.2, baseK = o.baseK ?? 0.16;
  const top = d[0];
  c.lineJoin = 'round';

  if (o.behind) o.behind(c);

  if (o.foot) {
    const [fhw, fy] = o.foot;
    c.beginPath();
    c.ellipse(CX, fy, fhw, fhw * 0.2, 0, 0, Math.PI * 2);
    c.fillStyle = 'rgba(225,240,255,0.75)';
    c.fill();
    c.lineWidth = 4.5;
    c.strokeStyle = INK;
    c.stroke();
    c.beginPath();
    c.ellipse(CX, fy - 1, fhw * 0.7, fhw * 0.1, 0, Math.PI * 1.05, Math.PI * 1.6);
    c.strokeStyle = 'rgba(255,255,255,0.9)';
    c.lineWidth = 2.5;
    c.stroke();
  }

  bodyPath(c, d, rimK, baseK);
  c.fillStyle = o.glass || GLASS;
  c.fill();

  if (o.liquid) {
    const [lt, lb] = o.level;
    c.save();
    bodyPath(c, d, rimK, baseK);
    c.clip();
    const g = c.createLinearGradient(0, lt, 0, lb);
    o.liquid.forEach((col, i) => g.addColorStop(i / (o.liquid.length - 1), col));
    c.fillStyle = g;
    c.fillRect(0, lt, 200, lb - lt);
    const bhw = hwAt(d, lb);
    c.beginPath();
    c.ellipse(CX, lb, bhw, bhw * baseK, 0, 0, Math.PI * 2);
    c.fillStyle = o.liquid[o.liquid.length - 1];
    c.fill();
    if (o.inside) o.inside(c);
    c.restore();
    const shw = Math.max(2, hwAt(d, lt) - 2.5);
    c.beginPath();
    c.ellipse(CX, lt, shw, shw * rimK, 0, 0, Math.PI * 2);
    c.fillStyle = o.surface || '#ffffff';
    c.fill();
    if (o.onSurface) o.onSurface(c);
  }

  // side shine
  const y0 = top[1] + 14, y1 = (o.shineTo ?? (o.level ? o.level[1] : d[d.length - 1][1])) - 10;
  if (y1 > y0 + 8) {
    c.beginPath();
    for (let y = y0; y <= y1; y += 4) {
      const x = CX - hwAt(d, y) * 0.7;
      if (y === y0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.strokeStyle = 'rgba(255,255,255,0.6)';
    c.lineWidth = 6.5;
    c.lineCap = 'round';
    c.stroke();
  }

  bodyPath(c, d, rimK, baseK);
  c.strokeStyle = INK;
  c.lineWidth = 5;
  c.stroke();

  c.beginPath();
  c.ellipse(CX, top[1], top[0] - 1, (top[0] - 1) * rimK, 0, 0, Math.PI);
  c.strokeStyle = 'rgba(255,255,255,0.9)';
  c.lineWidth = 3;
  c.stroke();

  if (o.salt) {
    c.beginPath();
    c.ellipse(CX, top[1], top[0], top[0] * rimK, 0, 0, Math.PI * 2);
    c.strokeStyle = '#ffffff';
    c.lineWidth = 9;
    c.stroke();
    c.strokeStyle = 'rgba(27,31,69,0.4)';
    c.lineWidth = 1.6;
    c.setLineDash([2, 6]);
    c.stroke();
    c.setLineDash([]);
  }
}

// ---------- garnishes ----------

function wheel(c, x, y, r, rot, rind, flesh, pith = '#f6ffd9') {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.beginPath(); c.arc(0, 0, r, 0, 7);
  c.fillStyle = rind; c.fill();
  c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
  c.beginPath(); c.arc(0, 0, r * 0.8, 0, 7);
  c.fillStyle = pith; c.fill();
  c.fillStyle = flesh;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 + 0.07, b = (i + 1) * Math.PI / 4 - 0.07, m = (a + b) / 2;
    c.beginPath();
    c.moveTo(Math.cos(m) * r * 0.14, Math.sin(m) * r * 0.14);
    c.arc(0, 0, r * 0.7, a, b);
    c.closePath();
    c.fill();
  }
  c.restore();
}

function wedge(c, x, y, r, rot, rind, flesh) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.lineJoin = 'round';
  c.beginPath(); c.arc(0, 0, r, 0, Math.PI); c.closePath();
  c.fillStyle = rind; c.fill();
  c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
  c.beginPath(); c.arc(0, 0, r * 0.76, 0, Math.PI); c.closePath();
  c.fillStyle = flesh; c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.65)';
  c.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    const a = i * Math.PI / 4;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72); c.stroke();
  }
  c.restore();
}

function cherry(c, x, y, r) {
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x, y - r * 0.7);
  c.quadraticCurveTo(x + r * 0.5, y - r * 2.3, x + r * 1.5, y - r * 2.5);
  c.strokeStyle = INK; c.lineWidth = 5; c.stroke();
  c.strokeStyle = '#2f9e44'; c.lineWidth = 2.2; c.stroke();
  c.beginPath(); c.arc(x, y, r, 0, 7);
  c.fillStyle = '#e03131'; c.fill();
  c.lineWidth = 3.5; c.strokeStyle = INK; c.stroke();
  c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.28, 0, 7);
  c.fillStyle = 'rgba(255,255,255,0.85)'; c.fill();
}

function straw(c, x1, y1, x2, y2, w, c1, c2) {
  const line = () => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };
  c.lineCap = 'round';
  c.strokeStyle = INK; c.lineWidth = w + 5; line();
  c.strokeStyle = c1; c.lineWidth = w; line();
  if (c2) {
    c.lineCap = 'butt';
    c.strokeStyle = c2;
    c.setLineDash([7, 9]);
    line();
    c.setLineDash([]);
  }
}

function umbrella(c, x, y, s, rot, c1, c2) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath(); c.moveTo(0, -s * 0.2); c.lineTo(0, s * 1.5);
  c.strokeStyle = INK; c.lineWidth = 5; c.stroke();
  c.strokeStyle = '#e9c98a'; c.lineWidth = 2.4; c.stroke();
  const ap = -s * 0.62, N = 5;
  for (let i = 0; i < N; i++) {
    const xa = -s + i * 2 * s / N, xb = xa + 2 * s / N;
    c.beginPath();
    c.moveTo(0, ap);
    c.lineTo(xa, 0);
    c.quadraticCurveTo((xa + xb) / 2, s * 0.16, xb, 0);
    c.closePath();
    c.fillStyle = i % 2 ? c2 : c1;
    c.fill();
    c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
  }
  c.beginPath(); c.arc(0, ap, 3.6, 0, 7); c.fillStyle = INK; c.fill();
  c.restore();
}

function leaf(c, x, y, len, wid, rot, fill) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(wid, -len * 0.5, 0, -len);
  c.quadraticCurveTo(-wid, -len * 0.5, 0, 0);
  c.fillStyle = fill; c.fill();
  c.lineWidth = 3.5; c.strokeStyle = INK; c.stroke();
  c.beginPath(); c.moveTo(0, -len * 0.14); c.lineTo(0, -len * 0.8);
  c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 2; c.stroke();
  c.restore();
}

function mint(c, x, y, k = 1) {
  leaf(c, x, y, 34 * k, 15 * k, -0.8, '#2f9e44');
  leaf(c, x, y, 34 * k, 15 * k, 0.75, '#37b24d');
  leaf(c, x, y, 40 * k, 17 * k, -0.05, '#51cf66');
}

function pineapple(c, x, y, s, rot) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  leaf(c, -s * 0.18, -s * 0.98, s * 0.62, s * 0.17, -0.45, '#2f9e44');
  leaf(c, s * 0.16, -s * 0.98, s * 0.72, s * 0.18, 0.28, '#37b24d');
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(-s * 0.55, -s * 0.9);
  c.quadraticCurveTo(0, -s * 1.22, s * 0.55, -s * 0.9);
  c.closePath();
  c.fillStyle = '#ffd43b'; c.fill();
  c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
  c.beginPath();
  c.moveTo(-s * 0.47, -s * 0.9);
  c.quadraticCurveTo(0, -s * 1.15, s * 0.47, -s * 0.9);
  c.strokeStyle = '#c77d1a'; c.lineWidth = 5; c.stroke();
  c.strokeStyle = 'rgba(199,125,26,0.6)'; c.lineWidth = 1.8;
  for (const k of [-0.25, 0, 0.25]) {
    c.beginPath(); c.moveTo(0, -s * 0.12); c.lineTo(k * s, -s * 0.85); c.stroke();
  }
  c.restore();
}

function ice(c, x, y, s, rot) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  rr(c, -s / 2, -s / 2, s, s, s * 0.22);
  c.fillStyle = 'rgba(255,255,255,0.5)'; c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 2.5; c.stroke();
  c.restore();
}

function bubbles(c, pts) {
  c.strokeStyle = 'rgba(255,255,255,0.95)';
  c.lineWidth = 2;
  for (const [x, y, r] of pts) { c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke(); }
}

function flame(c, x, y, s) {
  const f = (k) => {
    c.beginPath();
    c.moveTo(x, y - s * k);
    c.bezierCurveTo(x + s * 0.6 * k, y - s * 0.45 * k, x + s * 0.5 * k, y, x, y);
    c.bezierCurveTo(x - s * 0.5 * k, y, x - s * 0.6 * k, y - s * 0.45 * k, x, y - s * k);
  };
  f(1); c.fillStyle = '#ff922b'; c.fill();
  c.lineWidth = 3.5; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke();
  f(0.6); c.fillStyle = '#ffe066'; c.fill();
}

const LIME = ['#3fa535', '#c9ee6a'];

// ---------- the ten drinks ----------

const DRAW = {
  tequila_shot(c) {
    vessel(c, {
      prof: [[58, 100, 1], [46, 216, 1]], level: [124, 202],
      liquid: ['#ffe680', '#f2a81e'], surface: '#fff3b0', salt: true,
    });
    wedge(c, 148, 98, 30, Math.PI + 0.5, LIME[0], LIME[1]);
  },

  whiskey_neat(c) {
    vessel(c, {
      prof: [[74, 116, 1], [64, 216, 1]], level: [160, 198],
      liquid: ['#f7b955', '#b5561a'], surface: '#ffd98f', shineTo: 216,
      inside(c) {
        c.strokeStyle = 'rgba(255,255,255,0.35)';
        c.lineWidth = 2.5;
        for (let i = -3; i <= 6; i++) {
          c.beginPath(); c.moveTo(20 + i * 26, 226); c.lineTo(46 + i * 26, 182); c.stroke();
          c.beginPath(); c.moveTo(46 + i * 26, 226); c.lineTo(20 + i * 26, 182); c.stroke();
        }
      },
    });
  },

  gin_tonic(c) {
    vessel(c, {
      prof: [[54, 66], [72, 104], [64, 140], [28, 164], [7, 177, 1], [7, 206, 1]],
      foot: [44, 212], level: [88, 172], shineTo: 160,
      liquid: ['#f3fffb', '#aee8da'], surface: '#ffffff',
      inside(c) {
        ice(c, 72, 122, 28, 0.3);
        ice(c, 122, 126, 26, -0.4);
        ice(c, 98, 104, 24, 0.12);
        wedge(c, 100, 146, 20, 0.5, LIME[0], LIME[1]);
        bubbles(c, [[60, 150, 3], [136, 146, 2.5], [84, 160, 2.2], [116, 162, 2.6]]);
      },
    });
    wheel(c, 152, 72, 24, 0.3, LIME[0], LIME[1]);
  },

  mojito(c) {
    vessel(c, {
      prof: [[58, 52, 1], [50, 218, 1]], level: [76, 206],
      liquid: ['#ecfdc9', '#93d65c'], surface: '#f6ffe0',
      behind(c) { straw(c, 96, 200, 152, 12, 9, '#ffffff', '#37b24d'); },
      inside(c) {
        ice(c, 118, 112, 26, 0.3);
        ice(c, 80, 104, 24, -0.2);
        ice(c, 100, 176, 24, 0.5);
        wedge(c, 76, 150, 20, -0.5, LIME[0], LIME[1]);
        wedge(c, 124, 186, 19, 2.4, LIME[0], LIME[1]);
        leaf(c, 112, 158, 24, 10, 0.9, '#37b24d');
        leaf(c, 70, 196, 22, 9, -1.1, '#2f9e44');
      },
    });
    mint(c, 64, 62, 1);
    wheel(c, 152, 60, 22, 0.2, LIME[0], LIME[1]);
  },

  cosmopolitan(c) {
    vessel(c, {
      prof: [[80, 78, 1], [6, 158, 1], [6, 206, 1]], foot: [46, 212], level: [93, 154],
      liquid: ['#ffa3c4', '#e62e6b'], surface: '#ffc6da', shineTo: 150,
    });
    wheel(c, 154, 76, 23, 0.3, '#f08a1c', '#ffb648', '#fff1d6');
  },

  margarita(c) {
    vessel(c, {
      prof: [[82, 84], [72, 106], [36, 120], [27, 130], [22, 144], [6, 160, 1], [6, 206, 1]],
      foot: [48, 212], level: [97, 153], shineTo: 128,
      liquid: ['#f4fca4', '#abd53e'], surface: '#fbffc8', salt: true,
    });
    wheel(c, 40, 80, 25, -0.3, LIME[0], LIME[1]);
  },

  blue_hawaiian(c) {
    vessel(c, {
      prof: [[46, 40], [40, 66], [60, 112], [44, 158], [16, 186], [9, 197, 1], [9, 206, 1]],
      foot: [46, 212], level: [56, 190], shineTo: 180,
      liquid: ['#a5f2ff', '#1b86e3'], surface: '#d2faff',
      behind(c) { straw(c, 100, 180, 122, 14, 8, '#ffe066', '#ff6b6b'); },
      inside(c) {
        ice(c, 84, 98, 26, 0.3);
        ice(c, 118, 124, 26, -0.3);
        ice(c, 92, 146, 22, 0.6);
      },
    });
    pineapple(c, 60, 68, 29, -0.35);
    cherry(c, 84, 42, 10);
    umbrella(c, 146, 50, 32, 0.45, '#ff6b6b', '#ffe066');
  },

  pina_colada(c) {
    vessel(c, {
      prof: [[60, 54], [76, 90], [70, 132], [30, 168], [8, 181, 1], [8, 206, 1]],
      foot: [50, 212], level: [66, 178], shineTo: 165,
      liquid: ['#fffef4', '#ffe690'], surface: '#ffffff',
      behind(c) { straw(c, 96, 180, 58, 8, 9, '#ffffff', '#e03131'); },
    });
    // froth
    const puffs = [[56, 56, 13], [76, 48, 15], [100, 44, 16], [124, 48, 15], [144, 56, 13]];
    c.strokeStyle = INK; c.lineWidth = 8;
    for (const [x, y, r] of puffs) { c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke(); }
    c.fillStyle = '#ffffff';
    for (const [x, y, r] of puffs) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
    c.fillStyle = 'rgba(255,230,144,0.5)';
    for (const [x, y, r] of puffs) { c.beginPath(); c.arc(x + 3, y + 5, r * 0.5, 0, 7); c.fill(); }
    pineapple(c, 150, 74, 36, 0.5);
    cherry(c, 106, 34, 11);
  },

  mai_tai(c) {
    vessel(c, {
      prof: [[80, 100, 1], [68, 216, 1]], level: [116, 204],
      liquid: ['#9e2f1a', '#ff8f2a', '#ffd04a'], surface: '#c95a2c',
      inside(c) {
        ice(c, 62, 142, 28, 0.2);
        ice(c, 104, 136, 26, -0.3);
        ice(c, 142, 150, 26, 0.4);
        ice(c, 82, 180, 26, -0.5);
        ice(c, 124, 184, 26, 0.3);
      },
    });
    umbrella(c, 132, 66, 38, 0.38, '#f783ac', '#ffffff');
    mint(c, 62, 106, 1.25);
    wheel(c, 156, 104, 24, 0.2, LIME[0], LIME[1]);
    cherry(c, 104, 96, 11);
  },

  scorpion_bowl(c) {
    vessel(c, {
      prof: [[92, 116], [88, 152], [62, 192], [42, 207, 1], [46, 219, 1]],
      level: [128, 198], rimK: 0.22, shineTo: 196,
      liquid: ['#ffa06e', '#e0356b'], surface: '#ffb994',
      behind(c) {
        straw(c, 72, 180, 30, 26, 9, '#f783ac', '#ffffff');
        straw(c, 128, 180, 174, 30, 9, '#66d9e8', '#ffffff');
        straw(c, 102, 180, 126, 10, 9, '#ffe066', '#ffffff');
      },
      inside(c) {
        ice(c, 56, 160, 26, 0.3);
        ice(c, 142, 164, 26, -0.3);
        ice(c, 100, 176, 26, 0.5);
      },
      onSurface(c) {
        for (const [x, y] of [[50, 128], [150, 130]]) {
          c.save(); c.translate(x, y); c.scale(1, 0.42);
          wheel(c, 0, 0, 22, 0.4, '#f08a1c', '#ffb648', '#fff1d6');
          c.restore();
        }
        c.beginPath(); c.ellipse(100, 126, 22, 9, 0, 0, 7);
        c.fillStyle = '#3fa535'; c.fill();
        c.lineWidth = 3.5; c.strokeStyle = INK; c.stroke();
        flame(c, 100, 124, 42);
      },
    });
    cherry(c, 76, 112, 10);
    umbrella(c, 152, 96, 30, 0.5, '#66d9e8', '#ffe066');
  },
};

// ---------- bar obstacles ----------
// Things that sit on the bar and never move. Drinks bounce off them.

export const PROPS = {
  shaker: { name: 'cocktail shaker', r: 5.6 },
  lantern: { name: 'candle lantern', r: 6.2 },
  bucket: { name: 'ice bucket', r: 9.6 },
  chips: { name: 'poker chips', r: 5.8 },
  dice: { name: 'dice', r: 7 },
  // flat: drawn from above and spun by the game; fling: sideways speed it gives a drink
  roulette: { name: 'roulette wheel', r: 11.5, flat: true, fling: 130 },
};

const STEEL = ['#8c9bb0', '#eef3f9', '#b9c5d4', '#f8fbff', '#93a2b6'];
const BRASS = ['#a9772a', '#f7dc8c', '#c99a3c', '#fbe9ae', '#9a6a22'];

function metal(c, x0, x1, tones) {
  const g = c.createLinearGradient(x0, 0, x1, 0);
  tones.forEach((t, i) => g.addColorStop(i / (tones.length - 1), t));
  return g;
}

function solid(c, prof, fill, o = {}) {
  const d = dense(prof), rimK = o.rimK ?? 0.2, baseK = o.baseK ?? 0.16;
  c.lineJoin = 'round';
  bodyPath(c, d, rimK, baseK);
  c.fillStyle = fill; c.fill();
  c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
  if (o.rim) {
    c.beginPath();
    c.ellipse(CX, d[0][1], d[0][0] - 1, (d[0][0] - 1) * rimK, 0, 0, Math.PI * 2);
    c.fillStyle = o.rim; c.fill();
    c.lineWidth = 3.5; c.strokeStyle = INK; c.stroke();
  }
  return d;
}

function shine(c, x, y0, y1, w = 6) {
  c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1);
  c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = w; c.lineCap = 'round'; c.stroke();
}

const DRAW_PROP = {
  shaker(c) {
    solid(c, [[64, 112, 1], [52, 218, 1]], metal(c, 36, 164, STEEL));
    solid(c, [[26, 66], [44, 74], [60, 92], [64, 112, 1]], metal(c, 36, 164, STEEL), { rim: '#dfe7f1' });
    solid(c, [[24, 40, 1], [26, 66, 1]], metal(c, 76, 124, STEEL), { rim: '#f3f7fb' });
    shine(c, 56, 126, 204, 7);
    c.strokeStyle = 'rgba(27,31,69,0.35)'; c.lineWidth = 2.5;
    c.beginPath(); c.ellipse(CX, 126, 62, 12, 0, 0.15, Math.PI - 0.15); c.stroke();
  },

  lantern(c) {
    const glow = c.createRadialGradient(100, 150, 4, 100, 150, 96);
    glow.addColorStop(0, 'rgba(255,214,102,0.75)');
    glow.addColorStop(1, 'rgba(255,214,102,0)');
    c.fillStyle = glow;
    c.fillRect(0, 50, 200, 200);
    solid(c, [[58, 198, 1], [62, 218, 1]], metal(c, 38, 162, BRASS), { rim: '#f7dc8c' });
    rr(c, 84, 150, 32, 50, 5);
    c.fillStyle = '#fff3d6'; c.fill();
    c.lineWidth = 3.5; c.strokeStyle = INK; c.stroke();
    flame(c, 100, 150, 38);
    const d = dense([[44, 98], [60, 142], [54, 198, 1]]);
    bodyPath(c, d, 0.2, 0.16);
    c.fillStyle = 'rgba(255,240,190,0.32)'; c.fill();
    c.lineWidth = 5; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke();
    shine(c, 62, 124, 184, 6);
    solid(c, [[18, 76, 1], [46, 98, 1]], metal(c, 54, 146, BRASS), { rim: '#f7dc8c' });
    c.beginPath(); c.arc(100, 64, 13, 0, 7);
    c.strokeStyle = INK; c.lineWidth = 9; c.stroke();
    c.strokeStyle = '#e8c05a'; c.lineWidth = 4; c.stroke();
  },

  bucket(c) {
    for (const x of [26, 174]) {
      c.beginPath(); c.arc(x, 150, 13, 0, 7);
      c.strokeStyle = INK; c.lineWidth = 9; c.stroke();
      c.strokeStyle = '#cdd7e3'; c.lineWidth = 4; c.stroke();
    }
    solid(c, [[78, 120, 1], [60, 218, 1]], metal(c, 22, 178, STEEL), { rim: '#7f8ea3' });
    // everything that pokes out of the bucket is clipped to "above the front rim"
    c.save();
    c.beginPath();
    c.rect(0, 0, 200, 120);
    c.ellipse(CX, 120, 76, 76 * 0.2, 0, 0, Math.PI * 2);
    c.clip();
    c.save();
    c.translate(118, 132);
    c.rotate(0.3);
    rr(c, -9, -116, 18, 64, 6);
    c.fillStyle = '#1f6b3a'; c.fill();
    c.lineWidth = 4.5; c.strokeStyle = INK; c.stroke();
    rr(c, -21, -62, 42, 90, 15);
    c.fillStyle = '#1f6b3a'; c.fill(); c.stroke();
    rr(c, -12, -122, 24, 30, 7);
    c.fillStyle = '#f2c94c'; c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-11, -46); c.lineTo(-11, -6);
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 5; c.lineCap = 'round'; c.stroke();
    c.restore();
    for (const [x, y, s, r] of [[52, 112, 30, 0.3], [84, 104, 30, -0.2], [70, 124, 28, 0.6], [148, 116, 30, -0.4], [104, 126, 28, 0.2], [132, 128, 26, 0.5]]) {
      c.save(); c.translate(x, y); c.rotate(r);
      rr(c, -s / 2, -s / 2, s, s, s * 0.22);
      c.fillStyle = '#e8f6ff'; c.fill();
      c.lineWidth = 3.5; c.strokeStyle = INK; c.stroke();
      c.restore();
    }
    c.restore();
    c.beginPath(); c.ellipse(CX, 120, 78, 78 * 0.2, 0, 0, Math.PI);
    c.strokeStyle = INK; c.lineWidth = 5; c.stroke();
    shine(c, 44, 140, 204, 8);
  },

  chips(c) {
    const cols = ['#e03131', '#1c7ed6', '#2f9e44', '#e03131', '#1c7ed6', '#e03131'];
    const hw = 62, th = 19;
    for (let i = 0; i < cols.length; i++) {
      const yb = 220 - i * th;
      solid(c, [[hw, yb - th, 1], [hw, yb, 1]], cols[i], { rimK: 0.22, baseK: 0.22 });
      c.fillStyle = '#ffffff';
      for (const x of [-44, -14, 16, 46]) c.fillRect(CX + x - 6, yb - th + 6 + (hw - Math.abs(x)) * 0.16, 12, th - 5);
    }
    const ty = 220 - cols.length * th;
    c.beginPath(); c.ellipse(CX, ty, hw - 1, (hw - 1) * 0.22, 0, 0, 7);
    c.fillStyle = '#e03131'; c.fill();
    c.lineWidth = 4.5; c.strokeStyle = INK; c.stroke();
    c.beginPath(); c.ellipse(CX, ty, hw * 0.62, hw * 0.62 * 0.22, 0, 0, 7);
    c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.stroke();
    shine(c, 48, ty + 16, 214, 6);
  },

  dice(c) {
    const die = (x, y, s, body, pip, pips) => {
      c.lineJoin = 'round';
      c.lineWidth = 5; c.strokeStyle = INK;
      c.beginPath();
      c.moveTo(x, y); c.lineTo(x + s * 0.22, y - s * 0.28); c.lineTo(x + s * 1.22, y - s * 0.28); c.lineTo(x + s, y);
      c.closePath();
      c.fillStyle = body[1]; c.fill(); c.stroke();
      c.beginPath();
      c.moveTo(x + s, y); c.lineTo(x + s * 1.22, y - s * 0.28); c.lineTo(x + s * 1.22, y + s * 0.72); c.lineTo(x + s, y + s);
      c.closePath();
      c.fillStyle = body[2]; c.fill(); c.stroke();
      rr(c, x, y, s, s, s * 0.14);
      c.fillStyle = body[0]; c.fill(); c.stroke();
      c.fillStyle = pip;
      for (const [px, py] of pips) { c.beginPath(); c.arc(x + px * s, y + py * s, s * 0.085, 0, 7); c.fill(); }
      c.beginPath(); c.ellipse(x + s * 0.72, y - s * 0.14, s * 0.09, s * 0.05, 0, 0, 7); c.fill();
    };
    die(92, 96, 74, ['#f8f9fa', '#ffffff', '#ced4da'], INK, [[0.28, 0.28], [0.72, 0.28], [0.5, 0.5], [0.28, 0.72], [0.72, 0.72]]);
    die(24, 138, 82, ['#e03131', '#ff6b6b', '#a51111'], '#ffffff', [[0.3, 0.3], [0.5, 0.5], [0.7, 0.7]]);
  },
};

// Flat obstacles are drawn from directly above as a circle; the game lays them on the
// bar and spins them.
const DRAW_FLAT = {
  roulette(c, S) {
    const R = S / 2, TAU = Math.PI * 2;
    c.translate(R, R);
    const disc = (r, fill, lw = 0) => {
      c.beginPath(); c.arc(0, 0, r, 0, TAU);
      c.fillStyle = fill; c.fill();
      if (lw) { c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); }
    };
    disc(R * 0.97, '#5a2d14', R * 0.035);
    disc(R * 0.86, '#f2c94c', R * 0.02);
    const n = 19;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU;
      c.beginPath();
      c.arc(0, 0, R * 0.82, a0, a1);
      c.arc(0, 0, R * 0.56, a1, a0, true);
      c.closePath();
      c.fillStyle = i === 0 ? '#2f9e44' : i % 2 ? '#e03131' : '#212529';
      c.fill();
      c.lineWidth = R * 0.014; c.strokeStyle = '#f2c94c'; c.stroke();
    }
    const cone = c.createRadialGradient(0, 0, R * 0.1, 0, 0, R * 0.56);
    cone.addColorStop(0, '#a3602f');
    cone.addColorStop(1, '#5a2d14');
    disc(R * 0.56, cone, R * 0.02);
    c.lineCap = 'round';
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2 + 0.4;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * R * 0.36, Math.sin(a) * R * 0.36);
      c.strokeStyle = INK; c.lineWidth = R * 0.085; c.stroke();
      c.strokeStyle = '#f2c94c'; c.lineWidth = R * 0.05; c.stroke();
      c.beginPath(); c.arc(Math.cos(a) * R * 0.36, Math.sin(a) * R * 0.36, R * 0.055, 0, TAU);
      c.fillStyle = '#f2c94c'; c.fill(); c.lineWidth = R * 0.018; c.strokeStyle = INK; c.stroke();
    }
    disc(R * 0.13, '#f2c94c', R * 0.025);
    c.beginPath(); c.arc(Math.cos(1.1) * R * 0.69, Math.sin(1.1) * R * 0.69, R * 0.06, 0, TAU);
    c.fillStyle = '#ffffff'; c.fill(); c.lineWidth = R * 0.018; c.strokeStyle = INK; c.stroke();
  },
};

// ---------- sprites ----------

function bounds(cv) {
  const s = 4, w = Math.ceil(cv.width / s), h = Math.ceil(cv.height / s);
  const t = document.createElement('canvas');
  t.width = w; t.height = h;
  const x = t.getContext('2d', { willReadFrequently: true });
  x.drawImage(cv, 0, 0, w, h);
  const px = x.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      if (px[(j * w + i) * 4 + 3] > 24) {
        if (i < x0) x0 = i;
        if (i > x1) x1 = i;
        if (j < y0) y0 = j;
        if (j > y1) y1 = j;
      }
    }
  }
  if (x1 < 0) return { x: 0, y: 0, w: cv.width, h: cv.height };
  return { x: x0 * s, y: y0 * s, w: (x1 - x0 + 1) * s, h: (y1 - y0 + 1) * s };
}

// White "sticker" edge so drinks read clearly on any table.
function sticker(src, t) {
  const w = src.width, h = src.height;
  const sil = document.createElement('canvas');
  sil.width = w; sil.height = h;
  const sx = sil.getContext('2d');
  for (let i = 0; i < 4; i++) sx.drawImage(src, 0, 0);
  sx.globalCompositeOperation = 'source-in';
  sx.fillStyle = '#ffffff';
  sx.fillRect(0, 0, w, h);
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const ox = out.getContext('2d');
  for (let k = 0; k < 16; k++) {
    const a = k * Math.PI / 8;
    ox.drawImage(sil, Math.cos(a) * t, Math.sin(a) * t);
  }
  ox.drawImage(sil, 0, 0);
  ox.drawImage(src, 0, 0);
  return out;
}

function finish(cv, ss) {
  const b = bounds(cv);
  cv.ss = ss;
  cv.bb = { x: b.x / ss, y: b.y / ss, w: b.w / ss, h: b.h / ss };
  return cv;
}

export function buildSprites(ss = 3) {
  return DRINKS.map((d) => {
    const cv = document.createElement('canvas');
    cv.width = BOX.w * ss; cv.height = BOX.h * ss;
    const c = cv.getContext('2d');
    c.scale(ss, ss);
    DRAW[d.id](c);
    return finish(sticker(cv, 4.5 * ss), ss);
  });
}

export function buildPropSprites(ss = 3) {
  const out = {};
  for (const kind of Object.keys(PROPS)) {
    const cv = document.createElement('canvas');
    if (PROPS[kind].flat) {
      const S = 128 * ss;
      cv.width = cv.height = S;
      DRAW_FLAT[kind](cv.getContext('2d'), S);
      out[kind] = cv;
      continue;
    }
    cv.width = BOX.w * ss; cv.height = BOX.h * ss;
    const c = cv.getContext('2d');
    c.scale(ss, ss);
    DRAW_PROP[kind](c);
    out[kind] = finish(sticker(cv, 4.5 * ss), ss);
  }
  return out;
}

async function loadImage(file) {
  const img = new Image();
  img.src = 'assets/' + file;
  await img.decode();
  const raw = document.createElement('canvas');
  raw.width = img.naturalWidth; raw.height = img.naturalHeight;
  raw.getContext('2d').drawImage(img, 0, 0);
  return raw;
}

// Stand an image on the standard footprint: trim it to its visible pixels, scale it so
// it is as wide as the footprint (or as tall as the box allows), and sit its base down.
async function spriteFromImage(file, widthK, edge, ss) {
  const raw = await loadImage(file);
  const b = bounds(raw);
  const baseY = 226, topMin = 8;
  const k = Math.min((2 * BOX.fr * widthK) / b.w, (baseY - topMin) / b.h);
  const cv = document.createElement('canvas');
  cv.width = BOX.w * ss; cv.height = BOX.h * ss;
  const c = cv.getContext('2d');
  c.scale(ss, ss);
  c.imageSmoothingQuality = 'high';
  c.drawImage(raw, b.x, b.y, b.w, b.h, BOX.ax - b.w * k / 2, baseY - b.h * k, b.w * k, b.h * k);
  return finish(edge ? sticker(cv, 4.5 * ss) : cv, ss);
}

// A top-down image of a flat obstacle: trim it and centre it in a square.
async function discFromImage(file, ss) {
  const raw = await loadImage(file);
  const b = bounds(raw), S = 128 * ss, k = S / Math.max(b.w, b.h);
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const c = cv.getContext('2d');
  c.imageSmoothingQuality = 'high';
  c.drawImage(raw, b.x, b.y, b.w, b.h, (S - b.w * k) / 2, (S - b.h * k) / 2, b.w * k, b.h * k);
  return cv;
}

// Optional swap-in art: assets/art.json lists PNGs that replace the built-in drawings
// of drinks ("drinks") and obstacles ("props"). Returns the parsed file, or null.
export async function loadArtOverrides(sprites, props, ss = 3) {
  let art;
  try {
    const res = await fetch('assets/art.json', { cache: 'no-cache' });
    if (!res.ok) return null;
    art = await res.json();
  } catch { return null; }
  const jobs = [];
  const keep = () => { /* keep the built-in drawing */ };
  DRINKS.forEach((d, i) => {
    const entry = (art.drinks || {})[d.id];
    if (!entry) return;
    const file = typeof entry === 'string' ? entry : entry.file;
    const widthK = (typeof entry === 'object' && entry.width) || 1.0;
    jobs.push(spriteFromImage(file, widthK, art.sticker !== false, ss).then((cv) => { sprites[i] = cv; }).catch(keep));
  });
  for (const kind of Object.keys(PROPS)) {
    const entry = (art.props || {})[kind];
    if (!entry) continue;
    const file = typeof entry === 'string' ? entry : entry.file;
    const widthK = (typeof entry === 'object' && entry.width) || 1.0;
    const job = PROPS[kind].flat ? discFromImage(file, ss) : spriteFromImage(file, widthK, art.sticker !== false, ss);
    jobs.push(job.then((cv) => { props[kind] = cv; }).catch(keep));
  }
  await Promise.all(jobs);
  return art;
}
