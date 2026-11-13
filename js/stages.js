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

// Fast big-band swing with brass stabs, and a casino floor murmuring underneath.
const VEGAS = {
  bpm: 164,
  swing: 0.66,
  lead: 'brass',
  comp: 'brass',
  ambience: 'casino',
  bars: [
    { bass: [53, 57, 60, 62], chord: [57, 60, 62, 65] },   // F6
    { bass: [50, 53, 57, 60], chord: [53, 57, 60, 64] },   // Dm9
    { bass: [55, 58, 62, 65], chord: [58, 62, 65, 69] },   // Gm9
    { bass: [48, 52, 55, 58], chord: [52, 58, 62, 69] },   // C13
    { bass: [53, 57, 60, 62], chord: [57, 60, 62, 65] },
    { bass: [50, 53, 57, 60], chord: [53, 57, 60, 64] },
    { bass: [55, 58, 62, 65], chord: [58, 62, 65, 69] },
    { bass: [48, 52, 55, 52], chord: [52, 58, 62, 69] },
  ],
  melody: [
    [0, 0, 72, 0.5], [0, 0.5, 77, 0.5], [0, 1, 81, 1], [0, 2.5, 84, 0.5], [0, 3, 81, 1],
    [1, 0, 77, 1.5], [1, 1.5, 74, 0.5], [1, 2, 77, 2],
    [2, 0, 70, 0.5], [2, 0.5, 74, 0.5], [2, 1, 79, 1], [2, 2.5, 82, 0.5], [2, 3, 79, 1],
    [3, 0, 76, 1.5], [3, 1.5, 72, 0.5], [3, 2, 76, 1], [3, 3, 79, 1],
    [4, 0, 81, 0.5], [4, 0.5, 84, 0.5], [4, 1, 86, 1], [4, 2, 84, 1], [4, 3, 81, 1],
    [5, 0, 77, 1], [5, 1, 74, 1], [5, 2, 69, 2],
    [6, 0, 74, 0.5], [6, 0.5, 77, 0.5], [6, 1, 79, 0.5], [6, 1.5, 82, 0.5], [6, 2, 81, 1], [6, 3, 79, 1],
    [7, 0, 76, 1], [7, 1, 72, 1], [7, 2, 77, 2],
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
    // Optional per level: props (obstacles on the bar: kind is shaker, lantern or bucket,
    // x across 0-100, y from the far end), note (shown under the level banner).
    levels: [
      { orders: [2, 2, 3, 2, 3], fail: 92 },
      { orders: [3, 2, 3, 4, 3, 4], fail: 84, note: 'A shaker is in the way',
        props: [{ kind: 'shaker', x: 50, y: 46 }] },
      { orders: [3, 4, 3, 5, 4, 3], fail: 78, note: 'Mind the ice bucket',
        props: [{ kind: 'bucket', x: 32, y: 40 }] },
      { orders: [4, 3, 5, 4, 5, 3, 5], fail: 72, note: 'Lantern left, shaker right',
        props: [{ kind: 'lantern', x: 30, y: 48 }, { kind: 'shaker', x: 70, y: 32 }] },
      { orders: [4, 5, 4, 6, 5, 4, 6], fail: 68, note: 'A crowded bar tonight',
        props: [{ kind: 'bucket', x: 50, y: 34 }, { kind: 'shaker', x: 7, y: 7 }, { kind: 'lantern', x: 93, y: 8 }] },
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
  {
    id: 'vegas',
    name: 'Las Vegas Strip',
    blurb: 'A high-roller table on the Strip',
    // Vegas twists: a roulette wheel that spins and flings drinks (spin: 1 clockwise,
    // -1 the other way), and one gold High Roller ticket per level.
    //   high: [which order (0 = first), slides allowed]  pays triple if served in time
    //   deal: [smallest, biggest] drink number dealt (default 0 up to one below the
    //         smallest order, at most 3)
    levels: [
      { orders: [4, 5, 4, 6, 5], fail: 80, note: 'Gold ticket pays triple',
        high: [3, 14], props: [{ kind: 'chips', x: 50, y: 44 }] },
      { orders: [5, 4, 6, 5, 6, 4], fail: 76, note: 'Chips and dice on the felt',
        high: [2, 13], props: [{ kind: 'dice', x: 32, y: 42 }, { kind: 'chips', x: 70, y: 28 }] },
      { orders: [5, 6, 5, 7, 6], fail: 78, deal: [1, 4], note: 'The wheel flings drinks left',
        high: [3, 12], props: [{ kind: 'roulette', x: 50, y: 40, spin: 1 }] },
      { orders: [6, 7, 6, 7, 6, 7], fail: 76, deal: [2, 5], note: 'This wheel spins the other way',
        high: [1, 10], props: [{ kind: 'roulette', x: 42, y: 42, spin: -1 }, { kind: 'chips', x: 93, y: 8 }] },
      { orders: [6, 7, 6, 8, 7, 6], fail: 80, deal: [2, 5], note: 'High stakes: the Mai Tai',
        high: [3, 12], props: [{ kind: 'roulette', x: 50, y: 38, spin: 1 }, { kind: 'dice', x: 8, y: 8 }, { kind: 'chips', x: 93, y: 7 }] },
    ],
    song: VEGAS,
    accent: '#ffd43b',
    table: {
      rim: ['#8a5a12', '#ffe08a', '#a8741a'],
      top: ['#0a4a30', '#0e6943', '#12824f'],
      apron: ['#6b3a12', '#2e1705'],
      line: '#ffd43b',
      glowFar: 'rgba(255,212,59,0.14)',
      glowNear: 'rgba(255,79,163,0.10)',
      felt: true,
      marquee: true,
    },
    paintBackdrop(c, V) {
      const { w, h, u } = V;
      const base = V.farY + 24 * u;
      let g = c.createLinearGradient(0, 0, 0, base);
      g.addColorStop(0, '#0b0630');
      g.addColorStop(0.5, '#3a0f5c');
      g.addColorStop(0.82, '#b0306e');
      g.addColorStop(1, '#ff8a3d');
      c.fillStyle = g;
      c.fillRect(0, 0, w, base);
      const R = rng(7777);
      c.fillStyle = '#ffffff';
      for (let i = 0; i < 60; i++) {
        c.globalAlpha = 0.25 + R() * 0.5;
        c.beginPath();
        c.arc(R() * w, R() * base * 0.5, (0.4 + R() * 0.8) * u, 0, 7);
        c.fill();
      }
      c.globalAlpha = 1;
      skylineLayer(c, R, V, base, '#3b1a6b', 110, 250, 0.4);
      skylineLayer(c, R, V, base, '#1a0c3a', 40, 150, 0.5);
      // neon strips up the towers
      const neon = ['#ff4fa3', '#66d9e8', '#ffd43b', '#b197fc'];
      for (let i = 0; i < 14; i++) {
        const x = R() * w, hgt = (40 + R() * 120) * u;
        c.fillStyle = neon[Math.floor(R() * neon.length)];
        c.globalAlpha = 0.85;
        c.fillRect(x, base - hgt, 1.6 * u, hgt * (0.5 + R() * 0.5));
      }
      c.globalAlpha = 1;
      g = c.createLinearGradient(0, base, 0, h);
      g.addColorStop(0, '#2a0f3a');
      g.addColorStop(1, '#0a0514');
      c.fillStyle = g;
      c.fillRect(0, base, w, h - base);
      const cols = ['255,212,59', '255,79,163', '90,200,255'];
      for (let i = 0; i < 16; i++) {
        const x = R() * w, y = base + R() * (h - base) * 0.5, r = (16 + R() * 40) * u;
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

export const COMING_SOON = ['California Beach Bar', 'Hawaiian Tiki Bar', 'New Orleans Jazz Club'];
export { rng };
