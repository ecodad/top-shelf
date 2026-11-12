// Stage themes. Each stage supplies its orders, a backdrop painter, table colours and a song.
// Only the first stage is built; the rest are named so the menu can tease them.

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function skylineLayer(c, R, V, base, color, hMin, hMax, lit) {
  const u = V.u;
  let x = -12 * u;
  while (x < V.w + 12 * u) {
    const bw = (24 + R() * 34) * u;
    const bh = (hMin + R() * (hMax - hMin)) * u;
    const top = base - bh;
    c.fillStyle = color;
    c.fillRect(x, top, bw, bh + 2);
    const f = R();
    if (f < 0.22) {
      c.fillRect(x + bw * 0.5 - 0.8 * u, top - (14 + R() * 22) * u, 1.6 * u, 40 * u);
    } else if (f < 0.42) {
      c.fillRect(x + bw * 0.2, top - 9 * u, bw * 0.6, 10 * u);
      c.fillRect(x + bw * 0.36, top - 17 * u, bw * 0.28, 9 * u);
    } else if (f < 0.52) {
      // rooftop water tank
      c.fillRect(x + bw * 0.3, top - 12 * u, bw * 0.34, 9 * u);
      c.fillRect(x + bw * 0.34, top - 4 * u, 1.2 * u, 5 * u);
      c.fillRect(x + bw * 0.58, top - 4 * u, 1.2 * u, 5 * u);
    }
    const cw = 5.4 * u, ch = 7.2 * u;
    for (let wx = x + 3 * u; wx < x + bw - 4 * u; wx += cw) {
      for (let wy = top + 5 * u; wy < base - 6 * u; wy += ch) {
        const r = R();
        if (r < lit) {
          c.globalAlpha = 0.5 + R() * 0.5;
          c.fillStyle = r < lit * 0.2 ? '#9be7ff' : '#ffd98a';
          c.fillRect(wx, wy, 2.7 * u, 3.8 * u);
        }
      }
    }
    c.globalAlpha = 1;
    x += bw + (R() < 0.3 ? 3 * u : 0);
  }
}

const JAZZ = {
  bpm: 126,
  swing: 0.64,
  bars: [
    { bass: [50, 53, 57, 60], chord: [53, 57, 60, 64] },   // Dm7
    { bass: [55, 59, 62, 59], chord: [53, 57, 59, 64] },   // G13
    { bass: [48, 52, 55, 57], chord: [52, 55, 59, 62] },   // Cmaj9
    { bass: [57, 55, 53, 52], chord: [49, 55, 58, 64] },   // A7b9
    { bass: [50, 53, 57, 60], chord: [53, 57, 60, 64] },
    { bass: [55, 59, 62, 59], chord: [53, 57, 59, 64] },
    { bass: [48, 52, 55, 57], chord: [52, 55, 59, 62] },
    { bass: [57, 55, 53, 52], chord: [49, 55, 58, 64] },
  ],
  // [bar, beat, midi, beats]
  melody: [
    [0, 0, 74, 0.5], [0, 0.5, 77, 0.5], [0, 1, 81, 1], [0, 2.5, 79, 0.5], [0, 3, 77, 1],
    [1, 0, 76, 0.5], [1, 0.5, 74, 0.5], [1, 1, 71, 1], [1, 2.5, 74, 0.5], [1, 3, 77, 1],
    [2, 0, 76, 1.5], [2, 1.5, 79, 0.5], [2, 2, 76, 1], [2, 3, 72, 1],
    [3, 0, 73, 1], [3, 1, 76, 1], [3, 2, 79, 1], [3, 3, 81, 0.5], [3, 3.5, 79, 0.5],
    [4, 0, 77, 1], [4, 1, 74, 0.5], [4, 1.5, 77, 0.5], [4, 2, 81, 1.5], [4, 3.5, 81, 0.5],
    [5, 0, 79, 1], [5, 1, 77, 0.5], [5, 1.5, 74, 0.5], [5, 2, 71, 2],
    [6, 0, 72, 0.5], [6, 0.5, 76, 0.5], [6, 1, 79, 0.5], [6, 1.5, 83, 0.5], [6, 2, 81, 1], [6, 3, 79, 1],
    [7, 0, 76, 1.5], [7, 1.5, 73, 0.5], [7, 2, 69, 2],
  ],
};

export const STAGES = [
  {
    id: 'nyc',
    name: 'New York Nights',
    blurb: 'A rooftop bar over Manhattan',
    // Each level is a list of orders by drink number (0 = Tequila Shot ... 9 = Scorpion Bowl).
    // Stage 1 stays on the low end of the menu; later stages add the bigger drinks.
    // "fail" is where the "bar is full" line sits (0 = far end, 132 = player's end):
    // a smaller number means less room, which is the main difficulty dial besides
    // bigger drinks. Optional per level: shakes (default 3).
    levels: [
      { orders: [2, 2, 3, 2, 3], fail: 92 },
      { orders: [3, 2, 3, 4, 3, 4], fail: 88 },
      { orders: [3, 4, 3, 5, 4, 3], fail: 82 },
      { orders: [4, 3, 5, 4, 5, 3, 5], fail: 72 },
      { orders: [4, 5, 4, 6, 5, 4, 6], fail: 62 },
    ],
    song: JAZZ,
    accent: '#ff4fa3',
    table: {
      rim: ['#a9772a', '#f5d27a', '#b98632'],
      top: ['#3a170f', '#5c2717', '#7a3a20'],
      apron: ['#7a5318', '#3d2709'],
      line: '#ff4fa3',
      glowFar: 'rgba(255,79,163,0.20)',
      glowNear: 'rgba(90,200,255,0.10)',
    },
    paintBackdrop(c, V) {
      const { w, h, u } = V;
      const base = V.farY + 24 * u;
      let g = c.createLinearGradient(0, 0, 0, base);
      g.addColorStop(0, '#060920');
      g.addColorStop(0.5, '#1d1250');
      g.addColorStop(0.82, '#5a1d6b');
      g.addColorStop(1, '#d04a7c');
      c.fillStyle = g;
      c.fillRect(0, 0, w, base);

      const R = rng(20261112);
      c.fillStyle = '#ffffff';
      for (let i = 0; i < 110; i++) {
        c.globalAlpha = 0.25 + R() * 0.6;
        c.beginPath();
        c.arc(R() * w, R() * base * 0.62, (0.4 + R() * 0.9) * u, 0, 7);
        c.fill();
      }
      c.globalAlpha = 1;

      skylineLayer(c, R, V, base, '#2c2066', 110, 250, 0.2);
      skylineLayer(c, R, V, base, '#130e36', 40, 150, 0.3);

      g = c.createLinearGradient(0, base, 0, h);
      g.addColorStop(0, '#1e1445');
      g.addColorStop(1, '#07061a');
      c.fillStyle = g;
      c.fillRect(0, base, w, h - base);

      // soft party lights on the rooftop floor
      const cols = ['255,79,163', '90,200,255', '255,200,90', '170,120,255'];
      for (let i = 0; i < 16; i++) {
        const x = R() * w, y = base + R() * (h - base), r = (16 + R() * 44) * u;
        const col = cols[Math.floor(R() * cols.length)];
        const bg = c.createRadialGradient(x, y, 0, x, y, r);
        bg.addColorStop(0, `rgba(${col},${0.1 + R() * 0.12})`);
        bg.addColorStop(1, `rgba(${col},0)`);
        c.fillStyle = bg;
        c.fillRect(x - r, y - r, r * 2, r * 2);
      }
    },
  },
];

// Coins paid for serving each drink, by drink number.
export const COIN = [10, 25, 50, 100, 200, 300, 500, 750, 1000, 1500];

export const COMING_SOON =['Las Vegas Casino', 'California Beach Bar', 'Hawaiian Tiki Bar', 'New Orleans Jazz Club'];
export { rng };
