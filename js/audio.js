// All sound is synthesised with Web Audio: no audio files to load or license.

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class Sound {
  constructor() {
    this.ctx = null;
    this.music = true;
    this.sfx = true;
    this.song = null;
    this._timer = null;
    this._lastClink = 0;
  }

  // Must be called from a tap: browsers only start audio after a user gesture.
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const c = (this.ctx = new AC());
      this.master = c.createDynamicsCompressor();
      this.master.connect(c.destination);
      this.sfxBus = c.createGain();
      this.sfxBus.gain.value = 0.9;
      this.sfxBus.connect(this.master);
      this.musBus = c.createGain();
      this.musBus.gain.value = this.music ? 0.55 : 0;
      this.musBus.connect(this.master);
      const len = c.sampleRate;
      this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
  }

  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {}); }
  resume() { if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().catch(() => {}); }

  setMusic(on) {
    this.music = on;
    if (this.musBus) this.musBus.gain.setTargetAtTime(on ? 0.55 : 0, this.ctx.currentTime, 0.05);
  }
  setSfx(on) { this.sfx = on; }

  get now() { return this.ctx ? this.ctx.currentTime : 0; }
  get ready() { return !!this.ctx && this.ctx.state === 'running'; }

  _tone(bus, type, f, t, dur, vol, o = {}) {
    const c = this.ctx, osc = c.createOscillator(), g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (o.attack || 0.004));
    if (o.hold) g.gain.setValueAtTime(vol, t + o.hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let out = g;
    if (o.lp) {
      const f2 = c.createBiquadFilter();
      f2.type = 'lowpass';
      f2.frequency.value = o.lp;
      g.connect(f2);
      out = f2;
    }
    osc.connect(g);
    out.connect(bus);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  _noise(bus, t, dur, vol, type, freq, q = 0.8) {
    const c = this.ctx, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = this.noiseBuf;
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(bus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  // ---------- effects ----------

  _clinkAt(t, strength, tier) {
    const f0 = (2250 - tier * 95) * (0.95 + Math.random() * 0.1);
    const v = 0.2 * strength;
    this._tone(this.sfxBus, 'sine', f0, t, 0.26, v);
    this._tone(this.sfxBus, 'sine', f0 * 2.76, t, 0.16, v * 0.5);
    this._tone(this.sfxBus, 'sine', f0 * 5.4, t, 0.08, v * 0.22);
    this._noise(this.sfxBus, t, 0.012, v * 0.6, 'highpass', 5000);
  }

  clink(strength = 0.6, tier = 0) {
    if (!this.ready || !this.sfx) return;
    const t = this.now;
    if (t - this._lastClink < 0.045) return;
    this._lastClink = t;
    this._clinkAt(t, Math.min(1, strength), tier);
  }

  slide() {
    if (!this.ready || !this.sfx) return;
    this._noise(this.sfxBus, this.now, 0.3, 0.1, 'bandpass', 1100, 0.7);
  }

  merge(tier) {
    if (!this.ready || !this.sfx) return;
    const t = this.now;
    this._clinkAt(t, 0.9, tier);
    this._clinkAt(t + 0.07, 0.7, Math.max(0, tier - 2));
    const f = 380 * Math.pow(1.09, tier);
    this._tone(this.sfxBus, 'sine', f, t, 0.18, 0.2, { to: f * 1.9 });
    this._lastClink = t + 0.07;
  }

  coin(delay = 0) {
    if (!this.ready || !this.sfx) return;
    const t = this.now + delay;
    this._tone(this.sfxBus, 'triangle', 1568, t, 0.07, 0.12);
    this._tone(this.sfxBus, 'triangle', 2093, t + 0.06, 0.2, 0.12);
  }

  orderUp() {
    if (!this.ready || !this.sfx) return;
    const t = this.now;
    [72, 76, 79, 84].forEach((m, i) => {
      this._tone(this.sfxBus, 'triangle', hz(m), t + i * 0.085, 0.32, 0.16);
      this._tone(this.sfxBus, 'sine', hz(m + 12), t + i * 0.085, 0.22, 0.07);
    });
    this._clinkAt(t + 0.36, 1, 2);
  }

  // A High Roller ticket served in time: bell, fanfare and a cascade of coins.
  jackpot() {
    if (!this.ready || !this.sfx) return;
    const t = this.now;
    for (let k = 0; k < 14; k++) this._tone(this.sfxBus, 'sine', 1976, t + k * 0.05, 0.07, 0.09);
    [72, 76, 79, 84, 88].forEach((m, i) => {
      this._tone(this.sfxBus, 'sawtooth', hz(m), t + 0.1 + i * 0.09, 0.3, 0.07, { attack: 0.01, lp: 2600 });
      this._tone(this.sfxBus, 'triangle', hz(m + 12), t + 0.1 + i * 0.09, 0.3, 0.08);
    });
    for (let k = 0; k < 16; k++) {
      this._tone(this.sfxBus, 'triangle', 2200 + Math.random() * 2200, t + 0.5 + k * 0.05, 0.06, 0.06);
    }
  }

  stageClear() {
    if (!this.ready || !this.sfx) return;
    const t = this.now;
    const seq = [[60, 64, 67], [65, 69, 72], [67, 71, 74], [72, 76, 79, 84]];
    seq.forEach((ch, i) => {
      const at = t + i * 0.26, dur = i === 3 ? 1.3 : 0.3;
      ch.forEach((m) => {
        this._tone(this.sfxBus, 'triangle', hz(m + 12), at, dur, 0.11);
        this._tone(this.sfxBus, 'sine', hz(m + 24), at, dur * 0.7, 0.05);
      });
    });
    for (let i = 0; i < 5; i++) this._clinkAt(t + 0.9 + i * 0.13, 0.7, i);
  }

  lose() {
    if (!this.ready || !this.sfx) return;
    const t = this.now;
    [67, 64, 60, 55].forEach((m, i) => this._tone(this.sfxBus, 'triangle', hz(m), t + i * 0.2, 0.45, 0.16));
    this._noise(this.sfxBus, t + 0.75, 0.5, 0.12, 'lowpass', 500);
  }

  // A drink hitting an obstacle: duller and lower than glass on glass.
  knock(strength = 0.6) {
    if (!this.ready || !this.sfx) return;
    const t = this.now;
    if (t - this._lastClink < 0.045) return;
    this._lastClink = t;
    const v = 0.22 * Math.min(1, strength);
    this._tone(this.sfxBus, 'triangle', 620, t, 0.16, v, { to: 410 });
    this._tone(this.sfxBus, 'sine', 1480, t, 0.1, v * 0.5);
    this._noise(this.sfxBus, t, 0.02, v * 0.5, 'bandpass', 1800, 1);
  }

  rattle() {
    if (!this.ready || !this.sfx) return;
    const t = this.now;
    for (let i = 0; i < 7; i++) this._clinkAt(t + Math.random() * 0.4, 0.5 + Math.random() * 0.4, (Math.random() * 8) | 0);
    this._noise(this.sfxBus, t, 0.35, 0.1, 'bandpass', 420, 0.8);
  }

  warn() {
    if (!this.ready || !this.sfx) return;
    this._tone(this.sfxBus, 'square', 660, this.now, 0.09, 0.06);
  }

  tap() {
    if (!this.ready || !this.sfx) return;
    this._tone(this.sfxBus, 'sine', 880, this.now, 0.06, 0.08);
  }

  // ---------- music ----------

  startMusic(song) {
    if (!this.ctx) return;
    if (this.song === song && this._timer) return;
    this.stopMusic();
    this.song = song;
    this._step = 0;
    this._nextT = this.ctx.currentTime + 0.12;
    this._mel = new Map();
    for (const [bar, beat, midi, len] of song.melody) this._mel.set(bar * 8 + Math.round(beat * 2), [midi, len]);
    this._timer = setInterval(() => this._schedule(), 40);
  }

  stopMusic() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
    this.song = null;
  }

  _schedule() {
    const c = this.ctx;
    if (!c || c.state !== 'running' || !this.music) {
      if (c) this._nextT = c.currentTime + 0.12;
      return;
    }
    if (this._nextT < c.currentTime) this._nextT = c.currentTime + 0.05;
    const song = this.song, beat = 60 / song.bpm, total = song.bars.length * 8;
    while (this._nextT < c.currentTime + 0.25) {
      this._playStep(this._step, this._nextT, beat);
      this._nextT += beat * (this._step % 2 === 0 ? song.swing : 1 - song.swing);
      this._step = (this._step + 1) % total;
    }
  }

  _playStep(i, t, beat) {
    const song = this.song, bus = this.musBus;
    const bar = song.bars[Math.floor(i / 8)], e = i % 8;

    if (e % 2 === 0) {
      const f = hz(bar.bass[e / 2] - 12);
      this._tone(bus, 'triangle', f, t, beat * 0.92, 0.3, { attack: 0.008, lp: 900 });
      this._tone(bus, 'sawtooth', f, t, beat * 0.5, 0.05, { attack: 0.008, lp: 1400 });
    }
    // ride cymbal: ding, ding-a-ding
    if (e === 0 || e === 2 || e === 3 || e === 4 || e === 6 || e === 7) {
      this._noise(bus, t, e % 2 ? 0.05 : 0.11, e % 2 ? 0.02 : 0.035, 'highpass', 7500);
    }
    if (e === 2 || e === 6) this._noise(bus, t, 0.05, 0.05, 'bandpass', 2400, 1.2);
    if (e === 0) this._tone(bus, 'sine', 95, t, 0.14, 0.2, { to: 48 });

    // comping: long chord on one, short stab on the "and" of two
    if (song.comp === 'brass') {
      // big-band section hits: short and punchy
      if (e === 0 || e === 3 || e === 6) {
        const dur = e === 0 ? beat * 0.7 : beat * 0.4;
        for (const m of bar.chord) {
          this._tone(bus, 'sawtooth', hz(m), t, dur, 0.03, { attack: 0.012, lp: 1700 });
          this._tone(bus, 'triangle', hz(m), t, dur, 0.02, { attack: 0.012 });
        }
      }
    } else if (e === 0 || e === 3) {
      const dur = e === 0 ? beat * 1.5 : beat * 0.55;
      for (const m of bar.chord) {
        this._tone(bus, 'sine', hz(m), t, dur, 0.055, { attack: 0.006 });
        this._tone(bus, 'triangle', hz(m), t, dur * 0.6, 0.025, { attack: 0.006 });
      }
    }

    const mel = this._mel.get(i);
    if (mel) {
      const [m, len] = mel, f = hz(m), dur = Math.max(0.22, len * beat * 1.1);
      if (song.lead === 'brass') {
        this._tone(bus, 'sawtooth', f, t, dur * 0.85, 0.085, { attack: 0.02, hold: dur * 0.4, lp: 2300 });
        this._tone(bus, 'triangle', f, t, dur * 0.85, 0.05, { attack: 0.02 });
        this._tone(bus, 'sawtooth', f * 1.004, t, dur * 0.85, 0.03, { attack: 0.03, lp: 1800 });
      } else {
        this._tone(bus, 'sine', f, t, dur, 0.13, { attack: 0.005 });
        this._tone(bus, 'sine', f * 4, t, Math.min(dur, 0.18), 0.03, { attack: 0.003 });
        this._tone(bus, 'triangle', f, t, dur * 0.5, 0.035, { attack: 0.005 });
      }
    }
    if (song.ambience === 'casino') this._casino(t);
  }

  // Casino floor in the background: slot chimes, coins in a tray, a far-off jackpot bell.
  _casino(t) {
    const bus = this.musBus, r = Math.random();
    if (r < 0.035) {
      const base = 84 + ((Math.random() * 5) | 0);
      [0, 4, 7, 12, 7, 12].forEach((d, k) => this._tone(bus, 'square', hz(base + d), t + k * 0.07, 0.09, 0.012));
    } else if (r < 0.06) {
      for (let k = 0; k < 9; k++) {
        this._tone(bus, 'triangle', 2400 + Math.random() * 1800, t + k * 0.055 + Math.random() * 0.02, 0.05, 0.02);
      }
    } else if (r < 0.068) {
      for (let k = 0; k < 10; k++) this._tone(bus, 'sine', 1760, t + k * 0.06, 0.07, 0.016);
    }
  }
}
