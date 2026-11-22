// Mouse and keyboard input for Ember Pact. Pointer positions are mapped from
// the canvas's screen rectangle back into the 1280x720 logical table, and
// clicks are hit-tested against the same rectangles render.js draws, so what
// you see is what you can click. Keys 1-7 play a card, Enter ends the turn.
import { layout } from './render.js';
import { FIELD } from './config.js';

function hit(rect, p) {
  return p.x >= rect.x && p.x <= rect.x + rect.w && p.y >= rect.y && p.y <= rect.y + rect.h;
}

export function attachInput(canvas, getState, ui, hooks) {
  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / FIELD.width, rect.height / FIELD.height);
    const ox = (rect.width - FIELD.width * scale) / 2;
    const oy = (rect.height - FIELD.height * scale) / 2;
    return { x: (event.clientX - rect.left - ox) / scale, y: (event.clientY - rect.top - oy) / scale };
  }

  function handHit(state, p) {
    const rects = layout(state, ui).handRects;
    for (let i = rects.length - 1; i >= 0; i -= 1) {
      if (hit(rects[i], p)) return rects[i].uid;
    }
    return null;
  }

  canvas.addEventListener('pointermove', (event) => {
    const state = getState();
    ui.hover = state.phase === 'play' ? handHit(state, toLogical(event)) : null;
  });

  canvas.addEventListener('pointerdown', (event) => {
    const state = getState();
    const p = toLogical(event);
    const rects = layout(state, ui);
    hooks.onGesture();
    if (state.phase === 'title') {
      hooks.onStart();
      return;
    }
    if (state.phase === 'over') {
      if (hit(rects.againButton, p)) hooks.onAgain();
      return;
    }
    if (state.phase !== 'play') return;
    const uid = handHit(state, p);
    if (uid !== null) {
      hooks.onPlayCard(uid);
      return;
    }
    if (hit(rects.endTurn, p)) hooks.onEndTurn();
  });

  window.addEventListener('keydown', (event) => {
    const state = getState();
    if (event.repeat) return;
    hooks.onGesture();
    if (state.phase === 'title' && (event.code === 'Enter' || event.code === 'Space')) {
      hooks.onStart();
      event.preventDefault();
      return;
    }
    if (state.phase === 'over' && (event.code === 'Enter' || event.code === 'Space' || event.code === 'KeyR')) {
      hooks.onAgain();
      event.preventDefault();
      return;
    }
    if (state.phase !== 'play') return;
    if (event.code === 'Enter' || event.code === 'Space') {
      hooks.onEndTurn();
      event.preventDefault();
      return;
    }
    const digit = /^Digit([1-9])$/.exec(event.code);
    if (digit) {
      const card = state.player.hand[Number(digit[1]) - 1];
      if (card) hooks.onPlayCard(card.uid);
    }
  });
}
