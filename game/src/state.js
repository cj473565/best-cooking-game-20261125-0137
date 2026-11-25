// The game's state: orders on the rail, the clock, the coins, the streak.
// Everything the kitchen does reads and writes this one object.

import {
  DAY_SECONDS,
  MAX_TICKETS,
  RECIPES,
  orderInterval,
  ticketPatience,
  unlockedRecipes,
} from './config.js';

let nextTicketId = 1;

export function createGame() {
  return {
    screen: 'title', // title | playing | over
    time: 0, // seconds since the day started
    timeLeft: DAY_SECONDS,
    coins: 0,
    served: 0,
    lost: 0,
    streak: 0,
    bestStreak: 0,
    tickets: [],
    spawnIn: 2.5,
    flash: null, // { text, color, until }
    shakeUntil: 0,
    now: 0,
    muted: false,
  };
}

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

// Is this plate (a list of {kind, state}) exactly the recipe's needs?
export function plateMatches(needs, plate) {
  if (plate.length !== needs.length) return false;
  const key = (c) => `${c.kind}:${c.state || 'plain'}`;
  const a = needs.map(key).sort().join('|');
  const b = plate.map(key).sort().join('|');
  return a === b;
}

// Does the carried item belong on this plate? It does when some open ticket's
// recipe still needs that component and the plate does not have it yet.
export function plateAccepts(game, plate, item) {
  const key = (c) => `${c.kind}:${c.state || 'plain'}`;
  const itemKey = key(item);
  if (plate.some((c) => key(c) === itemKey)) return null;
  for (const t of game.tickets) {
    const recipe = recipeById(t.recipeId);
    if (recipe.needs.some((n) => key(n) === itemKey)) return recipe;
  }
  return null;
}

// Which recipe, if any, is this plate now a complete copy of?
export function recipeForPlate(plate) {
  for (const r of RECIPES) {
    if (plateMatches(r.needs, plate)) return r;
  }
  return null;
}

export function spawnTicket(game, recipeId) {
  const pool = unlockedRecipes(game.time);
  const recipe = recipeId ? recipeById(recipeId) : pool[Math.floor(Math.random() * pool.length)];
  if (!recipe) return null;
  const patience = ticketPatience(game.time);
  game.tickets.push({
    id: nextTicketId++,
    recipeId: recipe.id,
    patience,
    maxPatience: patience,
    bornAt: game.time,
  });
  return game.tickets[game.tickets.length - 1];
}

export function updateGame(game, dt) {
  if (game.screen !== 'playing') return;
  game.time += dt;
  game.timeLeft = Math.max(0, DAY_SECONDS - game.time);

  // Spawn orders on a quickening schedule, up to the rail's capacity.
  game.spawnIn -= dt;
  if (game.spawnIn <= 0 && game.tickets.length < MAX_TICKETS) {
    spawnTicket(game);
    game.spawnIn = orderInterval(game.time);
  }

  // Patience drains; a ticket at zero is lost.
  let lostAny = false;
  for (const t of game.tickets) {
    t.patience -= dt;
    if (t.patience <= 0) lostAny = true;
  }
  if (lostAny) {
    game.tickets = game.tickets.filter((t) => t.patience > 0);
    game.lost += 1;
    game.streak = 0;
    game.flash = { text: 'ORDER LOST!', color: '#c0392b', until: game.now + 1.4 };
  }

  if (game.timeLeft <= 0) {
    game.screen = 'over';
  }
}

export function serveDish(game, recipe, patienceLeft, maxPatience) {
  const tipFrac = Math.max(0, patienceLeft / maxPatience);
  const tip = Math.round(recipe.coins * 0.5 * tipFrac);
  const streakBonus = game.streak > 0 && game.streak % 3 === 2 ? 5 : 0;
  const earned = recipe.coins + tip + streakBonus;
  game.coins += earned;
  game.served += 1;
  game.streak += 1;
  game.bestStreak = Math.max(game.bestStreak, game.streak);
  // Drop the served ticket: the earliest one asking for this dish.
  const idx = game.tickets.findIndex((t) => t.recipeId === recipe.id);
  if (idx >= 0) game.tickets.splice(idx, 1);
  return { earned, tip, streakBonus };
}

export function starsFor(coins) {
  if (coins >= 260) return 3;
  if (coins >= 170) return 2;
  if (coins >= 90) return 1;
  return 0;
}
