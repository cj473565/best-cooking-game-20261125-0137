// Sound effects, synthesized with WebAudio — no audio files, no network.
// Everything is a short oscillator or noise burst; the kitchen sizzles
// while something cooks.

let ctx = null;
let muted = false;
let sizzleNodes = null;

export function ensureAudio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function toggleMute() {
  muted = !muted;
  if (muted) stopSizzle();
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type = 'sine', vol = 0.12, when = 0) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + when;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noiseBurst(dur, vol = 0.15, freq = 1200) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(ctx.destination);
  src.start(t0);
}

export const sfx = {
  pickup() {
    tone(520, 0.07, 'triangle', 0.1);
  },
  place() {
    tone(340, 0.08, 'triangle', 0.1);
    tone(220, 0.09, 'sine', 0.08, 0.03);
  },
  chop() {
    noiseBurst(0.06, 0.2, 900);
  },
  chopped() {
    tone(660, 0.08, 'triangle', 0.1);
    tone(880, 0.1, 'triangle', 0.1, 0.06);
  },
  grillOn() {
    noiseBurst(0.25, 0.12, 2500);
  },
  ready() {
    tone(740, 0.1, 'sine', 0.12);
    tone(988, 0.14, 'sine', 0.12, 0.09);
  },
  serve() {
    tone(523, 0.1, 'triangle', 0.12);
    tone(659, 0.1, 'triangle', 0.12, 0.08);
    tone(784, 0.18, 'triangle', 0.12, 0.16);
  },
  error() {
    tone(160, 0.16, 'square', 0.07);
  },
  lost() {
    tone(330, 0.2, 'sawtooth', 0.07);
    tone(220, 0.3, 'sawtooth', 0.07, 0.15);
  },
  tick() {
    tone(980, 0.04, 'square', 0.04);
  },
  start() {
    tone(392, 0.1, 'triangle', 0.12);
    tone(523, 0.1, 'triangle', 0.12, 0.09);
    tone(659, 0.16, 'triangle', 0.12, 0.18);
  },
};

// A soft looping sizzle while the grill or the pot is busy.
export function updateSizzle(active) {
  if (!ctx || muted) {
    if (sizzleNodes) stopSizzle();
    return;
  }
  if (active && !sizzleNodes) {
    const len = ctx.sampleRate;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 3000;
    const g = ctx.createGain();
    g.gain.value = 0.015;
    src.connect(f).connect(g).connect(ctx.destination);
    src.start();
    sizzleNodes = { src, g };
  } else if (!active && sizzleNodes) {
    stopSizzle();
  }
}

function stopSizzle() {
  if (!sizzleNodes) return;
  try {
    sizzleNodes.src.stop();
  } catch {
    /* already stopped */
  }
  sizzleNodes = null;
}
