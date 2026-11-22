// The screenshot scenes behind ?shot=start|play|win|loss. Each one plays the
// real rules forward from a fresh game with the greedy autopilot steering both
// sides, so the frame is what a real game looks like and the same seed always
// gives the same frame. The win scene lets the player press while the Warden
// holds back; the loss scene is the mirror.
import { newGame, startGame, playCard, endPlayerTurn, endFoeTurn } from './rules.js';
import { greedyPicks, defensivePicks } from './ai.js';
import { drawCards } from './deck.js';

function playUid(state, sideKey, uid) {
  const side = state[sideKey];
  const index = side.hand.findIndex((card) => card.uid === uid);
  if (index < 0) return false;
  return playCard(state, sideKey, index) !== null;
}

/**
 * One side's turn: play its picks, then pass. Mode 'greedy' plays the best
 * cards, 'defensive' only block and healing, 'passive' nothing at all.
 */
function runTurn(state, actorKey, mode) {
  if (mode !== 'passive') {
    const picks = mode === 'defensive' ? defensivePicks(state, actorKey) : greedyPicks(state, actorKey);
    for (const uid of picks) {
      if (state.phase === 'over') break;
      playUid(state, actorKey, uid);
    }
  }
  if (state.phase === 'over') return;
  if (actorKey === 'player') endPlayerTurn(state);
  else endFoeTurn(state);
}

/**
 * Stage the named scene and return the state to render. Floats are cleared so
 * the frame is clean and deterministic.
 */
export function stageShot(name, seed) {
  const state = newGame(seed);
  if (name !== 'play' && name !== 'win' && name !== 'loss') {
    state.phase = 'title';
    return { state, screen: 'title' };
  }
  startGame(state);
  let guard = 0;
  if (name === 'play') {
    for (let turn = 0; turn < 3 && state.phase !== 'over'; turn += 1) {
      runTurn(state, 'player', 'greedy');
      if (state.phase === 'over') break;
      runTurn(state, 'foe', 'greedy');
      guard += 1;
    }
    // Top the hand back up so the table reads rich and complete.
    while (state.player.hand.length < 5 && state.phase !== 'over') {
      drawCards(state.random, state.player, 1);
    }
  } else if (name === 'win') {
    while (state.phase !== 'over' && guard < 40) {
      runTurn(state, 'player', 'greedy');
      if (state.phase === 'over') break;
      runTurn(state, 'foe', 'passive');
      guard += 1;
    }
  } else {
    while (state.phase !== 'over' && guard < 40) {
      runTurn(state, 'player', 'defensive');
      if (state.phase === 'over') break;
      runTurn(state, 'foe', 'greedy');
      guard += 1;
    }
  }
  state.floats = [];
  return { state, screen: state.phase === 'over' ? 'over' : 'play' };
}
