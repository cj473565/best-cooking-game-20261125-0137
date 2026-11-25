// Sizzle & Serve — Rush Hour Bistro: tuning, recipes and the kitchen layout.
// One file, one job: every number the game plays by lives here.

export const W = 1280;
export const H = 720;

export const DAY_SECONDS = 180;
export const CHEF_SPEED = 430; // px per second
export const MAX_TICKETS = 4;

// --- Ingredients -----------------------------------------------------------
export const INGREDIENTS = {
  lettuce: { name: 'Lettuce', chop: 2.2, color: '#58b368' },
  tomato: { name: 'Tomato', chop: 2.2, color: '#e4572e' },
  bun: { name: 'Bun', chop: 0, color: '#e8a94f' },
  patty: { name: 'Patty', grill: 6, burnAfter: 4, color: '#8a5a3b' },
  pasta: { name: 'Pasta', boil: 7, burnAfter: 5, color: '#f2c14e' },
  cheese: { name: 'Cheese', chop: 0, color: '#f7d154' },
  sauce: { name: 'Sauce', chop: 0, color: '#c0392b' },
};

// A component on a plate is one of:
//   { kind: 'lettuce', state: 'chopped' }  — must be chopped first
//   { kind: 'patty', state: 'grilled' }    — must be grilled first
//   { kind: 'pasta', state: 'boiled' }     — must be boiled first
//   { kind: 'bun' | 'cheese' | 'sauce' }   — used as-is
export const RECIPES = [
  {
    id: 'salad',
    name: 'Garden Salad',
    coins: 10,
    needs: [
      { kind: 'lettuce', state: 'chopped' },
      { kind: 'tomato', state: 'chopped' },
    ],
  },
  {
    id: 'pasta',
    name: 'Tomato Pasta',
    coins: 12,
    needs: [
      { kind: 'pasta', state: 'boiled' },
      { kind: 'sauce' },
    ],
  },
  {
    id: 'burger',
    name: 'Classic Burger',
    coins: 16,
    needs: [
      { kind: 'bun' },
      { kind: 'patty', state: 'grilled' },
      { kind: 'lettuce', state: 'chopped' },
    ],
  },
  {
    id: 'pasta-deluxe',
    name: 'Pasta Deluxe',
    coins: 18,
    needs: [
      { kind: 'pasta', state: 'boiled' },
      { kind: 'sauce' },
      { kind: 'cheese' },
    ],
  },
  {
    id: 'cheeseburger',
    name: 'Cheese Burger',
    coins: 20,
    needs: [
      { kind: 'bun' },
      { kind: 'patty', state: 'grilled' },
      { kind: 'cheese' },
      { kind: 'tomato', state: 'chopped' },
    ],
  },
  {
    id: 'veggie-stack',
    name: 'Veggie Stack',
    coins: 26,
    needs: [
      { kind: 'bun' },
      { kind: 'patty', state: 'grilled' },
      { kind: 'cheese' },
      { kind: 'lettuce', state: 'chopped' },
      { kind: 'tomato', state: 'chopped' },
    ],
  },
];

// Recipes unlock as the day goes on, so the rush grows.
export function unlockedRecipes(elapsed) {
  if (elapsed < 30) return RECIPES.slice(0, 2);
  if (elapsed < 70) return RECIPES.slice(0, 4);
  return RECIPES;
}

export function orderInterval(elapsed) {
  return Math.max(10, 17 - elapsed / 25);
}

export function ticketPatience(elapsed) {
  return Math.max(50, 78 - Math.floor(elapsed / 60) * 8);
}

// --- Kitchen layout (canvas pixels) ---------------------------------------
export const STATIONS = {
  bins: [
    { kind: 'lettuce', x: 24, y: 128, w: 116, h: 76 },
    { kind: 'tomato', x: 152, y: 128, w: 116, h: 76 },
    { kind: 'bun', x: 24, y: 216, w: 116, h: 76 },
    { kind: 'patty', x: 152, y: 216, w: 116, h: 76 },
    { kind: 'pasta', x: 24, y: 304, w: 116, h: 76 },
    { kind: 'cheese', x: 152, y: 304, w: 116, h: 76 },
    { kind: 'sauce', x: 24, y: 392, w: 116, h: 76 },
  ],
  boards: [
    { id: 'board0', x: 300, y: 128, w: 210, h: 118 },
    { id: 'board1', x: 530, y: 128, w: 210, h: 118 },
  ],
  grill: { x: 300, y: 286, w: 210, h: 132, slots: 2 },
  pot: { x: 530, y: 286, w: 210, h: 132 },
  plates: [
    { id: 'plate0', x: 790, y: 128, w: 210, h: 128 },
    { id: 'plate1', x: 1020, y: 128, w: 210, h: 128 },
  ],
  serve: { x: 790, y: 286, w: 210, h: 132 },
  trash: { x: 1020, y: 286, w: 210, h: 132 },
};

export const CHEF_START = { x: 620, y: 560 };

// --- Colours ---------------------------------------------------------------
export const COLORS = {
  floorA: '#e8d9b8',
  floorB: '#dfcfa6',
  wall: '#7a4a2b',
  counter: '#b0713c',
  counterTop: '#d9a05b',
  steel: '#8f9aa5',
  steelDark: '#6e7a85',
  board: '#e9c893',
  plate: '#f4f1e8',
  ink: '#2b2118',
  paper: '#fff8e7',
  red: '#c0392b',
  green: '#3d8b4f',
  gold: '#e8a94f',
  ticket: '#fffdf5',
};
