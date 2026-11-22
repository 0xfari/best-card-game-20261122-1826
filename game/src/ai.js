// The Warden's brain, and the greedy autopilot the screenshot scenes use for
// either side. Both pick cards by value over cost, on a simulated copy of the
// turn's energy and played suits, so the real state is untouched until the
// chosen cards are actually played.
import { cardById } from './cards.js';
import { MAX_HAND } from './config.js';

/** Value of playing the card at `handIndex` for `actorKey`, per energy spent. */
export function valueCard(state, actorKey, handIndex) {
  const actor = state[actorKey];
  const target = actorKey === 'player' ? state.foe : state.player;
  const def = cardById(actor.hand[handIndex].defId);
  if (!def || def.cost > actor.energy) return -1;
  if (def.dmg > 0 && def.dmg >= target.life + target.block) return 1000; // lethal
  let value = 0;
  value += def.dmg * 2;
  const hurt = actor.maxLife - actor.life;
  value += def.heal * (hurt > 0 ? 1.6 : 0.2);
  value += def.block * 1.1;
  value += def.draw * (actor.hand.length < MAX_HAND ? 3 : 0);
  value += def.energy * 2;
  value += (def.kindle || 0) * 1.5;
  if (actor.playedSuits.includes(def.suit)) value += 3; // Surge is worth chasing
  return value / def.cost;
}

/**
 * Greedily pick the cards `actorKey` would play this turn, best value first,
 * until nothing affordable is worth playing. Returns card uids in play order
 * (uids, not indices, because playing a card shifts the hand).
 */
export function greedyPicks(state, actorKey) {
  const actor = state[actorKey];
  const savedEnergy = actor.energy;
  const savedSuits = actor.playedSuits;
  const simSuits = [...savedSuits];
  const used = new Set();
  const picks = [];
  let energy = savedEnergy;
  for (;;) {
    actor.energy = energy;
    actor.playedSuits = simSuits;
    let best = -1;
    let bestValue = 0.6;
    for (let i = 0; i < actor.hand.length; i += 1) {
      if (used.has(i)) continue;
      const v = valueCard(state, actorKey, i);
      if (v > bestValue) {
        bestValue = v;
        best = i;
      }
    }
    if (best < 0) break;
    const def = cardById(actor.hand[best].defId);
    used.add(best);
    picks.push(actor.hand[best].uid);
    energy -= def.cost;
    simSuits.push(def.suit);
  }
  actor.energy = savedEnergy;
  actor.playedSuits = savedSuits;
  return picks;
}

/**
 * The same greedy pick, but attacks are never chosen: the side turtles behind
 * block and healing. The loss scene uses it, so the losing hand stays small
 * enough to read while the Warden still out-damages it.
 */
export function defensivePicks(state, actorKey) {
  const actor = state[actorKey];
  const savedEnergy = actor.energy;
  const savedSuits = actor.playedSuits;
  const simSuits = [...savedSuits];
  const used = new Set();
  const picks = [];
  let energy = savedEnergy;
  for (;;) {
    actor.energy = energy;
    actor.playedSuits = simSuits;
    let best = -1;
    let bestValue = 0.6;
    for (let i = 0; i < actor.hand.length; i += 1) {
      if (used.has(i)) continue;
      const def = cardById(actor.hand[i].defId);
      if (!def || def.dmg > 0) continue;
      const v = valueCard(state, actorKey, i);
      if (v > bestValue) {
        bestValue = v;
        best = i;
      }
    }
    if (best < 0) break;
    const def = cardById(actor.hand[best].defId);
    used.add(best);
    picks.push(actor.hand[best].uid);
    energy -= def.cost;
    simSuits.push(def.suit);
  }
  actor.energy = savedEnergy;
  actor.playedSuits = savedSuits;
  return picks;
}
