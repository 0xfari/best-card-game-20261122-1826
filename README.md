[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/0xfari/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/0xfari/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

# Ember Pact

An original elemental card duel for the [best-card-game-20261122-1826 bounty](https://make.fun/bounty/best-card-game-20261122-1826). You face the Cinder Warden across a felt table: twenty life each, a shared deck of twelve original cards in four suits, and energy that grows one point a turn.

## How it plays

- **Four suits, told apart by colour and shape:** Ember (red flame) deals damage, Tide (blue droplet) heals, Gale (green leaf) draws cards and energy, Stone (amber mountain) raises block.
- **Surge:** play two cards of the same suit in one turn and the second gains +2 to its first number. Phoenix Brand kindles your next Ember card for +2 more.
- **Block** absorbs damage until your next turn. **Energy** refills to the turn number, capped at 10. Draw a card every turn.
- **Win** by bringing the Warden's life to 0. **Lose** when yours reaches 0. Score is damage dealt × 10, +5 per card played, +500 for the win.
- The Warden plays greedily and reads your life total: it takes lethal when it sees it, heals when it is hurt, and chases Surge like you do.

## Controls

Mouse or keys `1–7` to play a card, `Enter`/`Space` to end your turn, `R` to play again after the game ends. Cards you cannot afford are dimmed; hover lifts a card.

## Run it

```sh
node serve.ts        # serves game/ at http://localhost:8080
```

No build step, no network request, no library: plain static files under `game/`, with the entry point `main.ts` copying `game/` and `screenshots/` to `/output` and writing `dossier.json`.

## Layout

- `game/src/config.js` — tuning numbers, palette, layout constants
- `game/src/cards.js` — the twelve card designs and the four suits
- `game/src/deck.js` — deck building, shuffling, drawing
- `game/src/rules.js` — turns, energy, playing cards, Surge, winning
- `game/src/ai.js` — the Warden's brain and the greedy autopilot
- `game/src/render.js` — the table, the cards, the HUD, the screens
- `game/src/input.js` — mouse and keyboard input
- `game/src/shots.js` — the four screenshot scenes (`?shot=start|play|win|loss`)
- `game/src/sound.js` — synthesized sound effects (WebAudio, no files)
- `game/src/main.js` — boot and the one loop

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
