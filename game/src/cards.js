// The card catalogue: every card Ember Pact can deal, and the four suits they
// belong to. A suit is told apart by colour AND by its drawn shape, never by
// text alone: ember is a red flame, tide a blue droplet, gale a green leaf,
// stone an amber mountain.
//
// Each card's effect is data: damage to the other side, healing for its owner,
// block that absorbs the next hits, cards drawn, or energy gained. Surge (see
// rules.js) adds +2 to a card's first number when it is the second card of its
// suit played in the same turn.
export const SUITS = {
  ember: { key: 'ember', name: 'Ember', color: '#e5534b', dark: '#8f2b25', light: '#ff9a8a', shape: 'flame' },
  tide: { key: 'tide', name: 'Tide', color: '#4fc3f7', dark: '#1d6f9e', light: '#a8dcf5', shape: 'drop' },
  gale: { key: 'gale', name: 'Gale', color: '#7ed957', dark: '#3f7a24', light: '#b8ec9e', shape: 'leaf' },
  stone: { key: 'stone', name: 'Stone', color: '#f2c94c', dark: '#96790f', light: '#ffe9a3', shape: 'peak' },
};

/**
 * id, name, suit, cost in energy, and the effect numbers.
 * kind is the card's main job, for the AI and the log line.
 */
export const CARDS = [
  { id: 'cinder', name: 'Cinder Strike', suit: 'ember', cost: 1, kind: 'attack', dmg: 3, heal: 0, block: 0, draw: 0, energy: 0, text: 'Deal 3 damage.' },
  { id: 'wildfire', name: 'Wildfire', suit: 'ember', cost: 3, kind: 'attack', dmg: 6, heal: 0, block: 0, draw: 0, energy: 0, text: 'Deal 6 damage.' },
  { id: 'phoenix', name: 'Phoenix Brand', suit: 'ember', cost: 2, kind: 'attack', dmg: 2, heal: 0, block: 0, draw: 0, energy: 0, kindle: 2, text: 'Deal 2 damage. Your next Ember card gains +2.' },
  { id: 'spring', name: 'Spring Mend', suit: 'tide', cost: 1, kind: 'heal', dmg: 0, heal: 4, block: 0, draw: 0, energy: 0, text: 'Restore 4 life.' },
  { id: 'current', name: 'Deep Current', suit: 'tide', cost: 2, kind: 'heal', dmg: 0, heal: 3, block: 0, draw: 1, energy: 0, text: 'Restore 3 life. Draw a card.' },
  { id: 'floodwall', name: 'Floodwall', suit: 'tide', cost: 3, kind: 'heal', dmg: 0, heal: 2, block: 6, draw: 0, energy: 0, text: 'Restore 2 life. Gain 6 block.' },
  { id: 'quill', name: 'Swift Quill', suit: 'gale', cost: 1, kind: 'draw', dmg: 0, heal: 0, block: 0, draw: 2, energy: 0, text: 'Draw 2 cards.' },
  { id: 'storm', name: 'Storm Call', suit: 'gale', cost: 2, kind: 'draw', dmg: 0, heal: 0, block: 0, draw: 1, energy: 2, text: 'Draw a card. Gain 2 energy.' },
  { id: 'zephyr', name: 'Zephyr Cut', suit: 'gale', cost: 2, kind: 'attack', dmg: 3, heal: 0, block: 0, draw: 1, energy: 0, text: 'Deal 3 damage. Draw a card.' },
  { id: 'bulwark', name: 'Bulwark', suit: 'stone', cost: 1, kind: 'block', dmg: 0, heal: 0, block: 5, draw: 0, energy: 0, text: 'Gain 5 block.' },
  { id: 'avalanche', name: 'Avalanche', suit: 'stone', cost: 3, kind: 'attack', dmg: 4, heal: 0, block: 4, draw: 0, energy: 0, text: 'Deal 4 damage. Gain 4 block.' },
  { id: 'granite', name: 'Granite Oath', suit: 'stone', cost: 2, kind: 'block', dmg: 0, heal: 2, block: 3, draw: 0, energy: 0, text: 'Gain 3 block. Restore 2 life.' },
];

export function cardById(id) {
  for (const card of CARDS) if (card.id === id) return card;
  return null;
}

export function suitOf(card) {
  return SUITS[card.suit];
}
