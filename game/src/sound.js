// Tiny synthesized sound effects: no audio files, just a WebAudio oscillator.
// Everything is guarded, so a browser without audio (or a headless screenshot
// run) plays silently and the game never depends on sound.
let context = null;
let muted = false;

function ensure() {
  if (context || muted) return context;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      muted = true;
      return null;
    }
    context = new AudioContext();
  } catch {
    muted = true;
    context = null;
  }
  return context;
}

function tone(freq, at, dur, type, gain) {
  const ctx = ensure();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, ctx.currentTime + at);
    amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + at + dur);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(ctx.currentTime + at);
    osc.stop(ctx.currentTime + at + dur + 0.02);
  } catch {
    // A failed blip is never worth breaking the game over.
  }
}

/** Unlock audio on the first gesture; browsers block sound before one. */
export function unlockSound() {
  const ctx = ensure();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

const SOUNDS = {
  deal: () => tone(520, 0, 0.07, 'triangle', 0.08),
  play: () => {
    tone(392, 0, 0.09, 'triangle', 0.1);
    tone(587, 0.07, 0.12, 'triangle', 0.1);
  },
  hit: () => {
    tone(180, 0, 0.12, 'sawtooth', 0.1);
    tone(120, 0.05, 0.14, 'sawtooth', 0.08);
  },
  heal: () => {
    tone(523, 0, 0.1, 'sine', 0.09);
    tone(784, 0.09, 0.14, 'sine', 0.09);
  },
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.22, 'triangle', 0.11));
  },
  lose: () => {
    [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.13, 0.24, 'triangle', 0.1));
  },
};

export function playSound(name) {
  const fn = SOUNDS[name];
  if (fn) fn();
}
