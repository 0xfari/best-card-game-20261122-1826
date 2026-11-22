// Deck building, shuffling and drawing. A deck is two copies of each of the
// twelve designs; when it runs out, the discard pile is shuffled back in.
import { CARDS } from './cards.js';
import { shuffle } from './random.js';
import { DECK_COPIES } from './config.js';

let nextUid = 1;

/** A fresh shuffled deck: every card is { uid, defId }. */
export function buildDeck(random) {
  const deck = [];
  for (let copy = 0; copy < DECK_COPIES; copy += 1) {
    for (const def of CARDS) deck.push({ uid: nextUid, defId: def.id });
    nextUid += 1;
  }
  return shuffle(deck, random);
}

/**
 * Move up to `count` cards from `side`'s deck to its hand, reshuffling the
 * discard pile when the deck runs dry. Returns the cards drawn.
 */
export function drawCards(random, side, count) {
  const drawn = [];
  for (let i = 0; i < count; i += 1) {
    if (side.deck.length === 0) {
      if (side.discard.length === 0) break;
      side.deck = shuffle(side.discard, random);
      side.discard = [];
    }
    const card = side.deck.pop();
    side.hand.push(card);
    drawn.push(card);
  }
  return drawn;
}
