// Every tuning number, colour and layout constant for Ember Pact, in one place.
// The table is a fixed 1280x720 logical area; the renderer scales it to the window,
// so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const PLAYER_LIFE = 20;
export const FOE_LIFE = 20;
export const START_HAND = 3;
export const MAX_ENERGY = 10;
export const MAX_HAND = 9;
/** A card drawn from a deck of 24: two copies of each of the twelve designs. */
export const DECK_COPIES = 2;

export const CARD = { width: 148, height: 208, radius: 12 };

/** Pixels a played card travels and how long its flight lasts. */
export const FLIGHT = { duration: 0.38, rise: 26 };
/** Seconds a floating damage number lives. */
export const FLOAT_LIFE = 1.1;

export const PALETTE = {
  felt: '#1d4a33',
  feltDark: '#143626',
  feltLight: '#276344',
  trim: '#c9a227',
  trimDark: '#8a6d1c',
  panel: '#101b16',
  panelEdge: '#2e4a3c',
  text: '#f4efe2',
  muted: '#a9b8ac',
  ink: '#1a1a1a',
  back: '#3a2f2a',
  backEdge: '#6b543d',
  button: '#c9a227',
  buttonText: '#241c05',
  buttonDim: '#5c5648',
  shadow: 'rgba(0, 0, 0, 0.45)',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'ember-pact.best';
