// Boot and the one loop: input is read every frame, flights and floating
// numbers advance in real time, the Warden's queued plays step out one at a
// time, and the renderer paints what is there. The game moves between three
// screens: title, play and game over.
//
// ?seed=N fixes the shuffle. ?shot=start|play|win|loss (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, FIELD, FLIGHT, FLOAT_LIFE } from './config.js';
import { newGame, startGame, playCard, endPlayerTurn, endFoeTurn } from './rules.js';
import { greedyPicks } from './ai.js';
import { draw, layout } from './render.js';
import { attachInput } from './input.js';
import { stageShot } from './shots.js';
import { playSound, unlockSound } from './sound.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const ctx = canvas.getContext('2d');
const ui = { hover: null, time: 0 };

let state = newGame(seed);
let aiQueue = [];
let aiTimer = 0;
let best = readBest();
let view = { scale: 1, x: 0, y: 0 };

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

/** Screen readers (and anyone watching the page's text) hear the big moments. */
function announce(message) {
  status.textContent = message;
}

function finishGame() {
  if (state.score > best) {
    best = state.score;
    saveBest(best);
  }
  playSound(state.winner === 'player' ? 'win' : 'lose');
  announce(
    state.winner === 'player'
      ? `Victory. Final score ${state.score}. Best ${best}.`
      : `Defeat. Final score ${state.score}. Best ${best}.`,
  );
}

/**
 * Play a card and fly it from `from` to its centre slot. Sounds follow the
 * card's job: a hit thuds, a heal chimes, anything else clicks into place.
 */
function doPlay(sideKey, handIndex, from) {
  const result = playCard(state, sideKey, handIndex);
  if (!result) return false;
  const slots = layout(state, ui).centerSlots;
  const to = slots[sideKey];
  state.flights.push({
    side: sideKey,
    def: result.def,
    from: { x: from.x, y: from.y },
    to: { x: to.x, y: to.y },
    t: 0,
    dur: FLIGHT.duration,
  });
  if (result.dmg > 0) playSound('hit');
  else if (result.heal > 0) playSound('heal');
  else playSound('play');
  if (state.phase === 'over') finishGame();
  return true;
}

/** Where a Warden card flies from: the face-down row at the top. */
function foeMiniRect() {
  const n = Math.min(state.foe.hand.length, 7);
  const startX = FIELD.width / 2 - (n * 70 - 8) / 2;
  return { x: startX, y: 60, w: 62, h: 86 };
}

function restart() {
  state = newGame(Math.floor(Math.random() * 4294967296));
  aiQueue = [];
  aiTimer = 0;
  ui.hover = null;
  announce('Ember Pact. Click to begin.');
}

const hooks = {
  onGesture() {
    unlockSound();
  },
  onStart() {
    if (state.phase !== 'title') return;
    startGame(state);
    playSound('deal');
    announce('Playing. Spend energy to play cards, Enter ends your turn.');
  },
  onAgain() {
    if (state.phase !== 'over') return;
    restart();
  },
  onPlayCard(uid) {
    if (state.phase !== 'play') return;
    const index = state.player.hand.findIndex((card) => card.uid === uid);
    if (index < 0) return;
    const rect = layout(state, ui).handRects[index];
    doPlay('player', index, rect);
  },
  onEndTurn() {
    if (!endPlayerTurn(state)) return;
    aiQueue = greedyPicks(state, 'foe');
    aiTimer = 0.6;
  },
};

function stepAi(dt) {
  if (state.phase !== 'ai') return;
  aiTimer -= dt;
  if (aiTimer > 0) return;
  if (aiQueue.length > 0) {
    const uid = aiQueue.shift();
    const index = state.foe.hand.findIndex((card) => card.uid === uid);
    if (index >= 0) doPlay('foe', index, foeMiniRect());
    aiTimer = 0.55;
    return;
  }
  endFoeTurn(state);
}

function update(dt) {
  ui.time += dt;
  for (const flight of state.flights) flight.t += dt;
  state.flights = state.flights.filter((flight) => flight.t < flight.dur);
  for (const f of state.floats) f.t += dt;
  state.floats = state.floats.filter((f) => f.t < FLOAT_LIFE);
  stepAi(dt);
}

function resize() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(window.innerWidth * ratio);
  canvas.height = Math.round(window.innerHeight * ratio);
  view.scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
  view.x = (canvas.width - FIELD.width * view.scale) / 2;
  view.y = (canvas.height - FIELD.height * view.scale) / 2;
}

function frame(now, last) {
  requestAnimationFrame((next) => frame(next, now));
  const dt = Math.min((now - last) / 1000, 0.25);
  update(dt);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#101b16';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
  draw(ctx, state, ui);
}

function runShot(name) {
  const staged = stageShot(name, seed);
  state = staged.state;
  resize();
  let painted = 0;
  function paint() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#101b16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    draw(ctx, state, ui);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  attachInput(canvas, () => state, ui, hooks);
  window.addEventListener('resize', resize);
  resize();
  announce('Ember Pact. Click to begin.');
  requestAnimationFrame((now) => frame(now, now));
}

if (shot) runShot(shot);
else runGame();
