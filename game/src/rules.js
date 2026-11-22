// The rules of Ember Pact: turns, energy, playing cards, Surge, and winning.
// Nothing here draws anything — it only changes the state, so the screenshot
// scenes can run the same rules forward and the renderer shows the result.
import { cardById } from './cards.js';
import { createRandom } from './random.js';
import { buildDeck, drawCards } from './deck.js';
import { PLAYER_LIFE, FOE_LIFE, START_HAND, MAX_ENERGY, MAX_HAND } from './config.js';

export function newSide(name, life) {
  return {
    name, life, maxLife: life,
    block: 0, energy: 0,
    deck: [], hand: [], discard: [],
    playedSuits: [], kindle: 0,
  };
}

export function newGame(seed) {
  const random = createRandom(seed);
  const state = {
    seed, random,
    turn: 1,
    phase: 'title', // title | play | ai | over
    player: newSide('You', PLAYER_LIFE),
    foe: newSide('Cinder Warden', FOE_LIFE),
    log: [],
    score: 0,
    damageDealt: 0,
    cardsPlayed: 0,
    winner: null, // 'player' | 'foe'
    floats: [],
    flights: [],
    lastPlayed: { player: null, foe: null },
  };
  state.player.deck = buildDeck(random);
  state.foe.deck = buildDeck(random);
  drawCards(random, state.player, START_HAND);
  drawCards(random, state.foe, START_HAND);
  return state;
}

export function addLog(state, line) {
  state.log.push(line);
  if (state.log.length > 6) state.log.shift();
}

export function startGame(state) {
  state.phase = 'play';
  beginTurn(state, 'player');
  addLog(state, 'The pact is sealed. Play a card, then end your turn.');
}

/**
 * Open a side's turn: last turn's block fades, energy refills to the turn
 * number (capped), and one card is drawn.
 */
export function beginTurn(state, sideKey) {
  const side = state[sideKey];
  side.block = 0;
  side.playedSuits = [];
  side.energy = Math.min(state.turn, MAX_ENERGY);
  if (side.hand.length < MAX_HAND) drawCards(state.random, side, 1);
  if (sideKey === 'player') addLog(state, `Turn ${state.turn} — ${side.energy} energy, a card drawn.`);
}

/**
 * Play the card at `handIndex` for `sideKey`. Surge: the second card of a suit
 * played in one turn gains +2 to its first number. Kindle (from Phoenix Brand)
 * adds its stored bonus to the next Ember card. Returns the play's details, or
 * null when the card cannot be played.
 */
export function playCard(state, sideKey, handIndex) {
  const side = state[sideKey];
  const other = sideKey === 'player' ? state.foe : state.player;
  const card = side.hand[handIndex];
  if (!card) return null;
  const def = cardById(card.defId);
  if (side.energy < def.cost) return null;

  const surge = side.playedSuits.includes(def.suit);
  const kindleBonus = def.suit === 'ember' ? side.kindle : 0;
  const bonus = (surge ? 2 : 0) + kindleBonus;
  const dmg = def.dmg + (def.dmg > 0 ? bonus : 0);
  const heal = def.heal + (def.dmg === 0 && def.heal > 0 ? bonus : 0);
  const block = def.block + (def.dmg === 0 && def.heal === 0 && def.block > 0 ? bonus : 0);

  side.energy -= def.cost;
  side.hand.splice(handIndex, 1);
  side.discard.push(card);
  side.playedSuits.push(def.suit);
  if (def.suit === 'ember') side.kindle = 0;
  if (def.kindle) side.kindle = def.kindle;

  if (dmg > 0) {
    applyDamage(state, other, dmg);
    if (sideKey === 'player') {
      state.score += dmg * 10;
      state.damageDealt += dmg;
    }
  }
  if (heal > 0) side.life = Math.min(side.maxLife, side.life + heal);
  if (block > 0) side.block += block;
  if (def.draw > 0) drawCards(state.random, side, def.draw);
  if (def.energy > 0) side.energy = Math.min(MAX_ENERGY, side.energy + def.energy);

  state.cardsPlayed += 1;
  if (sideKey === 'player') state.score += 5;
  state.lastPlayed[sideKey] = { card, def, surge, bonus, dmg, heal, block };

  const who = sideKey === 'player' ? 'You play' : 'Warden plays';
  const parts = [];
  if (dmg > 0) parts.push(`${dmg} damage`);
  if (heal > 0) parts.push(`heal ${heal}`);
  if (block > 0) parts.push(`+${block} block`);
  if (def.draw > 0) parts.push(`draw ${def.draw}`);
  if (def.energy > 0) parts.push(`+${def.energy} energy`);
  addLog(state, `${who} ${def.name}${surge ? ' — SURGE +2' : ''} (${parts.join(', ')}).`);

  checkOver(state);
  return { card, def, surge, bonus, dmg, heal, block };
}

/** Damage first eats block, then life; a floating number marks the hit. */
export function applyDamage(state, target, amount) {
  let left = amount;
  if (target.block > 0) {
    const absorbed = Math.min(target.block, left);
    target.block -= absorbed;
    left -= absorbed;
  }
  target.life -= left;
  state.floats.push({
    target: target === state.player ? 'player' : 'foe',
    text: `-${amount}`,
    color: amount > 0 ? '#ff6b5e' : '#f4efe2',
    t: 0,
  });
}

export function checkOver(state) {
  if (state.phase === 'over') return;
  if (state.foe.life <= 0) {
    state.foe.life = 0;
    state.winner = 'player';
    state.phase = 'over';
    state.score += 500;
    addLog(state, 'The Warden falls. Victory is yours!');
  } else if (state.player.life <= 0) {
    state.player.life = 0;
    state.winner = 'foe';
    state.phase = 'over';
    addLog(state, 'Your pact breaks. The Warden wins this one.');
  }
}

/** Close the player's turn and open the Warden's. */
export function endPlayerTurn(state) {
  if (state.phase !== 'play') return false;
  state.phase = 'ai';
  beginTurn(state, 'foe');
  addLog(state, "The Warden takes its turn.");
  return true;
}

/** Close the Warden's turn and open the player's next one. */
export function endFoeTurn(state) {
  if (state.phase !== 'ai') return false;
  state.turn += 1;
  state.phase = 'play';
  beginTurn(state, 'player');
  return true;
}
