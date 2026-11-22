// Everything the eye sees: the felt table, both hands, the cards, the HUD, the
// log, the title and end screens. Nothing here changes the rules — it only
// reads the state and the layout it computes, so input.js can hit-test the
// same rectangles this file draws.
import { FIELD, CARD, PALETTE, FONT, MAX_ENERGY } from './config.js';
import { cardById, suitOf } from './cards.js';

const W = FIELD.width;
const H = FIELD.height;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Where every clickable thing sits this frame, for input.js to hit-test. */
export function layout(state, ui) {
  const hand = state.player.hand;
  const n = hand.length;
  const spacing = n <= 1 ? 0 : Math.min(CARD.width + 14, 920 / Math.max(1, n - 1) - 40);
  const total = CARD.width + Math.max(0, n - 1) * spacing;
  const startX = W / 2 - total / 2;
  const handRects = hand.map((card, i) => {
    const lift = ui.hover === card.uid ? 20 : 0;
    return { uid: card.uid, x: startX + i * spacing, y: 496 - lift, w: CARD.width, h: CARD.height };
  });
  return {
    handRects,
    endTurn: { x: 1092, y: 528, w: 172, h: 56 },
    centerSlots: {
      player: { x: 300, y: 178, w: CARD.width, h: CARD.height },
      foe: { x: 832, y: 178, w: CARD.width, h: CARD.height },
    },
    titleButton: { x: W / 2 - 170, y: 560, w: 340, h: 64 },
    againButton: { x: W / 2 - 170, y: 540, w: 340, h: 64 },
  };
}

/** A suit's shape, drawn in paths so colour and shape tell suits apart. */
export function drawSuitShape(ctx, shape, cx, cy, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  if (shape === 'flame') {
    ctx.moveTo(cx, cy - size);
    ctx.bezierCurveTo(cx + size * 0.7, cy - size * 0.2, cx + size * 0.55, cy + size * 0.45, cx, cy + size * 0.75);
    ctx.bezierCurveTo(cx - size * 0.55, cy + size * 0.45, cx - size * 0.7, cy - size * 0.2, cx, cy - size);
  } else if (shape === 'drop') {
    ctx.moveTo(cx, cy - size);
    ctx.bezierCurveTo(cx + size * 0.75, cy + size * 0.1, cx + size * 0.6, cy + size, cx, cy + size);
    ctx.bezierCurveTo(cx - size * 0.6, cy + size, cx - size * 0.75, cy + size * 0.1, cx, cy - size);
  } else if (shape === 'leaf') {
    ctx.moveTo(cx, cy - size);
    ctx.bezierCurveTo(cx + size, cy - size * 0.4, cx + size * 0.6, cy + size, cx, cy + size);
    ctx.bezierCurveTo(cx - size * 0.6, cy + size, cx - size, cy - size * 0.4, cx, cy - size);
    ctx.moveTo(cx, cy - size * 0.7);
    ctx.lineTo(cx, cy + size * 0.7);
  } else {
    // peak: two mountain triangles
    ctx.moveTo(cx - size, cy + size * 0.7);
    ctx.lineTo(cx - size * 0.25, cy - size * 0.7);
    ctx.lineTo(cx + size * 0.15, cy + size * 0.1);
    ctx.lineTo(cx + size * 0.55, cy - size * 0.35);
    ctx.lineTo(cx + size, cy + size * 0.7);
    ctx.closePath();
  }
  ctx.fill();
}

/** The number a card leads with, and what it counts. */
function primaryNumber(def) {
  if (def.dmg > 0) return { value: def.dmg, label: 'DAMAGE' };
  if (def.heal > 0) return { value: def.heal, label: 'HEAL' };
  if (def.block > 0) return { value: def.block, label: 'BLOCK' };
  if (def.draw > 0) return { value: def.draw, label: 'DRAW' };
  return { value: def.energy, label: 'ENERGY' };
}

export function drawCardFace(ctx, def, x, y, w, h, opts = {}) {
  const suit = suitOf(def);
  const scale = w / CARD.width;
  ctx.save();
  if (opts.dim) ctx.globalAlpha = 0.55;
  // Paper
  rr(ctx, x, y, w, h, CARD.radius * scale);
  ctx.fillStyle = '#f4efe2';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = opts.gold ? PALETTE.trim : suit.dark;
  ctx.stroke();
  // Suit band
  rr(ctx, x + 3, y + 3, w - 6, 30 * scale, 8 * scale);
  ctx.fillStyle = suit.color;
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${13 * scale}px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(suit.name.toUpperCase(), x + 12 * scale, y + 19 * scale);
  // Cost gem, top right
  ctx.beginPath();
  ctx.arc(x + w - 22 * scale, y + 22 * scale, 17 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#1d4a33';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#f4efe2';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${19 * scale}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(String(def.cost), x + w - 22 * scale, y + 23 * scale);
  // Suit shape
  drawSuitShape(ctx, suit.shape, x + w / 2, y + 78 * scale, 26 * scale, suit.color);
  // Big number
  const primary = primaryNumber(def);
  ctx.fillStyle = suit.dark;
  ctx.font = `bold ${40 * scale}px ${FONT}`;
  ctx.fillText(String(primary.value), x + w / 2, y + 128 * scale);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `bold ${10 * scale}px ${FONT}`;
  ctx.fillText(primary.label, x + w / 2, y + 152 * scale);
  // Name + text
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `bold ${14 * scale}px ${FONT}`;
  ctx.fillText(def.name, x + w / 2, y + 172 * scale);
  ctx.fillStyle = '#4a4a44';
  ctx.font = `${10.5 * scale}px ${FONT}`;
  const lines = wrapText(ctx, def.text, w - 20 * scale);
  lines.slice(0, 2).forEach((line, i) => {
    ctx.fillText(line, x + w / 2, y + (188 + i * 13) * scale);
  });
  ctx.restore();
}

export function drawCardBack(ctx, x, y, w, h) {
  rr(ctx, x, y, w, h, 10);
  ctx.fillStyle = PALETTE.back;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = PALETTE.backEdge;
  ctx.stroke();
  rr(ctx, x + 6, y + 6, w - 12, h - 12, 7);
  ctx.strokeStyle = PALETTE.trim;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  drawSuitShape(ctx, 'flame', x + w / 2, y + h / 2, Math.min(w, h) * 0.22, PALETTE.trim);
}

function drawLifeBar(ctx, x, y, w, label, life, maxLife, block) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  rr(ctx, x - 8, y - 8, w + 16, 44, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 13px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y + 6);
  rr(ctx, x + 110, y - 2, w - 110, 16, 8);
  ctx.fillStyle = '#3a0d0b';
  ctx.fill();
  rr(ctx, x + 110, y - 2, Math.max(0, (w - 110) * (life / maxLife)), 16, 8);
  ctx.fillStyle = life <= 6 ? '#e5534b' : '#58b368';
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `bold 12px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(`${life} / ${maxLife}`, x + 110 + (w - 110) / 2, y + 6);
  if (block > 0) {
    ctx.beginPath();
    ctx.arc(x + w - 4, y + 26, 13, 0, Math.PI * 2);
    ctx.fillStyle = '#4fc3f7';
    ctx.fill();
    ctx.fillStyle = '#06283d';
    ctx.font = 'bold 13px ' + FONT;
    ctx.fillText(String(block), x + w - 4, y + 27);
  }
}

function drawTable(ctx) {
  const g = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 760);
  g.addColorStop(0, PALETTE.feltLight);
  g.addColorStop(0.6, PALETTE.felt);
  g.addColorStop(1, PALETTE.feltDark);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = PALETTE.trimDark;
  ctx.lineWidth = 4;
  rr(ctx, 10, 10, W - 20, H - 20, 18);
  ctx.stroke();
  // Centre emblem
  ctx.save();
  ctx.globalAlpha = 0.1;
  drawSuitShape(ctx, 'flame', W / 2, 300, 90, '#ffffff');
  ctx.restore();
  ctx.fillStyle = 'rgba(244, 239, 226, 0.5)';
  ctx.font = `bold 15px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('E M B E R   P A C T', W / 2, 452);
}

function drawLog(ctx, state) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  rr(ctx, 1024, 160, 240, 300, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.trim;
  ctx.font = `bold 13px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('TABLE LOG', 1040, 180);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `12px ${FONT}`;
  state.log.slice(-6).forEach((line, i) => {
    const lines = wrapText(ctx, line, 208);
    lines.slice(0, 2).forEach((part, j) => {
      ctx.fillText(part, 1040, 206 + (i * 2 + j) * 17);
    });
  });
}

function drawFoeHand(ctx, state) {
  const n = Math.min(state.foe.hand.length, 7);
  const w = 62;
  const h = 86;
  const spacing = 70;
  const startX = W / 2 - (n * spacing - (spacing - w)) / 2;
  for (let i = 0; i < n; i += 1) {
    drawCardBack(ctx, startX + i * spacing, 60, w, h);
  }
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `12px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(`${state.foe.hand.length} cards in hand`, W / 2, 158);
}

function drawPlayerHand(ctx, state, ui, rects) {
  state.player.hand.forEach((card, i) => {
    const rect = rects[i];
    const def = cardById(card.defId);
    const affordable = def.cost <= state.player.energy;
    const hover = ui.hover === card.uid;
    drawCardFace(ctx, def, rect.x, rect.y, rect.w, rect.h, {
      dim: state.phase === 'play' && !affordable,
      gold: hover,
    });
  });
}

function drawEnergy(ctx, state) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  rr(ctx, 16, 520, 210, 64, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 13px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('ENERGY', 30, 540);
  for (let i = 0; i < MAX_ENERGY; i += 1) {
    const x = 30 + i * 18;
    const y = 564;
    ctx.beginPath();
    ctx.moveTo(x, y - 7);
    ctx.lineTo(x + 7, y);
    ctx.lineTo(x, y + 7);
    ctx.lineTo(x - 7, y);
    ctx.closePath();
    ctx.fillStyle = i < state.player.energy ? '#f2c94c' : 'rgba(255,255,255,0.18)';
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 13px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText(`${state.player.energy}/${MAX_ENERGY}`, 212, 540);
}

function drawHud(ctx, state) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  rr(ctx, 16, 16, 250, 64, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 15px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`SCORE  ${state.score}`, 30, 36);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `13px ${FONT}`;
  ctx.fillText(`Turn ${state.turn}   ·   Deck ${state.player.deck.length}   ·   Discard ${state.player.discard.length}`, 30, 60);
  try {
    const best = Number(window.localStorage.getItem('ember-pact.best') || 0);
    if (best > 0) {
      ctx.fillStyle = PALETTE.trim;
      ctx.font = `13px ${FONT}`;
      ctx.fillText(`Best ${best}`, 30, 78);
    }
  } catch {
    // Private mode: no best score, no problem.
  }
}

function drawTurnBanner(ctx, state) {
  const label = state.phase === 'play' ? 'YOUR TURN — play a card' : state.phase === 'ai' ? "WARDEN'S TURN…" : '';
  if (!label) return;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  rr(ctx, W / 2 - 130, 166, 260, 26, 13);
  ctx.fill();
  ctx.fillStyle = state.phase === 'play' ? '#ffe9a3' : PALETTE.muted;
  ctx.font = `bold 13px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, W / 2, 179);
}

function drawEndTurn(ctx, state, rect) {
  const enabled = state.phase === 'play';
  ctx.fillStyle = enabled ? PALETTE.button : PALETTE.buttonDim;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.fill();
  ctx.fillStyle = enabled ? PALETTE.buttonText : '#cfc9b8';
  ctx.font = `bold 17px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('END TURN', rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `11px ${FONT}`;
  ctx.fillText('or press Enter', rect.x + rect.w / 2, rect.y + rect.h + 16);
}

function drawFloats(ctx, state) {
  for (const f of state.floats) {
    const base = f.target === 'player' ? { x: 240, y: 470 } : { x: 640, y: 60 };
    const age = f.t / 1.1;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - age);
    ctx.fillStyle = f.color;
    ctx.font = `bold 30px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(f.text, base.x, base.y - age * 46);
    ctx.restore();
  }
}

function drawFlights(ctx, state) {
  for (const flight of state.flights) {
    const p = Math.min(1, flight.t / flight.dur);
    const ease = 1 - (1 - p) * (1 - p);
    const x = flight.from.x + (flight.to.x - flight.from.x) * ease;
    const y = flight.from.y + (flight.to.y - flight.from.y) * ease - Math.sin(p * Math.PI) * 26;
    drawCardFace(ctx, flight.def, x, y, CARD.width, CARD.height, {});
  }
}

function drawCenterSlots(ctx, state, slots) {
  const flying = new Set(state.flights.map((f) => f.side));
  for (const sideKey of ['player', 'foe']) {
    const slot = slots[sideKey];
    const played = state.lastPlayed[sideKey];
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#f4efe2';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;
    rr(ctx, slot.x, slot.y, slot.w, slot.h, CARD.radius);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(244,239,226,0.6)';
    ctx.font = `bold 12px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(sideKey === 'player' ? 'YOUR LAST CARD' : "WARDEN'S LAST CARD", slot.x + slot.w / 2, slot.y - 10);
    if (played && !flying.has(sideKey)) {
      drawCardFace(ctx, played.def, slot.x, slot.y, slot.w, slot.h, { gold: played.surge });
      if (played.surge) {
        ctx.fillStyle = PALETTE.trim;
        ctx.font = `bold 14px ${FONT}`;
        ctx.fillText('SURGE +2', slot.x + slot.w / 2, slot.y + slot.h + 18);
      }
    }
  }
  ctx.fillStyle = PALETTE.trim;
  ctx.beginPath();
  ctx.arc(W / 2, 282, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#241c05';
  ctx.font = `bold 20px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VS', W / 2, 283);
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(10, 18, 13, 0.82)';
  ctx.fillRect(0, 0, W, H);
  // A fan of cards behind the title.
  const defs = ['wildfire', 'floodwall', 'storm', 'avalanche', 'phoenix'].map((id) => cardById(id));
  defs.forEach((def, i) => {
    ctx.save();
    ctx.translate(W / 2 + (i - 2) * 120, 240);
    ctx.rotate((i - 2) * 0.09);
    drawCardFace(ctx, def, -74, -104, CARD.width, CARD.height, {});
    ctx.restore();
  });
  ctx.fillStyle = PALETTE.trim;
  ctx.font = `bold 64px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EMBER PACT', W / 2, 420);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `21px ${FONT}`;
  ctx.fillText('A duel of elemental cards against the Cinder Warden.', W / 2, 462);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `15px ${FONT}`;
  ctx.fillText('Spend energy to play cards. Two of a suit in one turn surges +2. First to 0 life loses.', W / 2, 492);
  ctx.fillStyle = PALETTE.button;
  rr(ctx, W / 2 - 170, 560, 340, 64, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.buttonText;
  ctx.font = `bold 22px ${FONT}`;
  ctx.fillText('CLICK TO BEGIN', W / 2, 592);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `13px ${FONT}`;
  ctx.fillText('Mouse or keys 1–7 to play · Enter to end turn', W / 2, 648);
}

function drawOver(ctx, state) {
  ctx.fillStyle = 'rgba(10, 18, 13, 0.78)';
  ctx.fillRect(0, 0, W, H);
  const win = state.winner === 'player';
  ctx.fillStyle = win ? PALETTE.trim : '#e5534b';
  ctx.font = `bold 72px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(win ? 'VICTORY' : 'DEFEAT', W / 2, 220);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `22px ${FONT}`;
  ctx.fillText(
    win ? 'The Cinder Warden bows. The pact is yours.' : 'The Warden keeps the embers — this time.',
    W / 2, 280,
  );
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 30px ${FONT}`;
  ctx.fillText(`FINAL SCORE  ${state.score}`, W / 2, 350);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `16px ${FONT}`;
  ctx.fillText(
    `${state.turn} turns  ·  ${state.damageDealt} damage dealt  ·  ${state.cardsPlayed} cards played`,
    W / 2, 392,
  );
  try {
    const best = Number(window.localStorage.getItem('ember-pact.best') || 0);
    if (state.score >= best && state.score > 0) {
      ctx.fillStyle = PALETTE.trim;
      ctx.font = `bold 18px ${FONT}`;
      ctx.fillText('NEW BEST SCORE', W / 2, 428);
    } else if (best > 0) {
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `16px ${FONT}`;
      ctx.fillText(`Best ${best}`, W / 2, 428);
    }
  } catch {
    // Private mode: skip the best line.
  }
  ctx.fillStyle = PALETTE.button;
  rr(ctx, W / 2 - 170, 540, 340, 64, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.buttonText;
  ctx.font = `bold 22px ${FONT}`;
  ctx.fillText('PLAY AGAIN', W / 2, 572);
}

/** Draw one frame. `ui` carries the hover card and the clock. */
export function draw(ctx, state, ui) {
  ctx.clearRect(0, 0, W, H);
  drawTable(ctx);
  const rects = layout(state, ui);
  if (state.phase === 'title') {
    drawTitle(ctx, state);
    return;
  }
  drawHud(ctx, state);
  drawLifeBar(ctx, 470, 26, 340, 'WARDEN', state.foe.life, state.foe.maxLife, state.foe.block);
  drawLifeBar(ctx, 24, 452, 292, 'YOU', state.player.life, state.player.maxLife, state.player.block);
  drawFoeHand(ctx, state);
  drawTurnBanner(ctx, state);
  drawCenterSlots(ctx, state, rects.centerSlots);
  drawLog(ctx, state);
  drawEnergy(ctx, state);
  drawEndTurn(ctx, state, rects.endTurn);
  drawPlayerHand(ctx, state, ui, rects.handRects);
  drawFlights(ctx, state);
  drawFloats(ctx, state);
  if (state.phase === 'over') drawOver(ctx, state);
}
