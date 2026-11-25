// Sizzle & Serve — boot, the game loop and the action dispatch.
// The kitchen is real: this file only wires the pieces together.

import { W, H, DAY_SECONDS } from './config.js';
import { createGame, updateGame } from './state.js';
import { createKitchen, updateKitchen, useStation } from './kitchen.js';
import { createChef, updateChef, walkTo, standPoint } from './chef.js';
import { createInput, attachInput, applyKeys, nearestStation } from './input.js';
import { drawGame } from './render.js';
import {
  makeParticles,
  updateParticles,
  spawnSteam,
  spawnSpark,
  spawnBurst,
  floatText,
} from './particles.js';
import { ensureAudio, sfx, toggleMute, updateSizzle } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

const game = createGame();
const kitchen = createKitchen();
const chef = createChef();
const input = createInput();
const fx = makeParticles();

let last = performance.now();
let lastTickSecond = -1;

function reset() {
  const fresh = createGame();
  Object.assign(game, fresh, { screen: 'playing', muted: game.muted });
  const k2 = createKitchen();
  Object.assign(kitchen, k2);
  const c2 = createChef();
  Object.assign(chef, c2);
  fx.list.length = 0;
  fx.texts.length = 0;
  lastTickSecond = -1;
  sfx.start();
}

function deny(text) {
  if (!text) return;
  game.flash = { text, color: '#c0392b', until: game.now + 1.1 };
  sfx.error();
}

function onAction(action) {
  ensureAudio();
  if (action.kind === 'start') {
    reset();
    return;
  }
  if (action.kind === 'restart') {
    reset();
    return;
  }
  if (action.kind === 'mute') {
    game.muted = toggleMute();
    return;
  }
  if (action.kind === 'use-nearest') {
    const st = nearestStation(kitchen, chef);
    if (st) handleStation(st);
  }
}

function handleStation(station) {
  const ev = useStation(game, kitchen, chef, station, fx);
  const c = station.center;
  if (ev.kind === 'deny') {
    deny(ev.text);
  } else if (ev.kind === 'served') {
    const { earned, tip, streakBonus } = ev.result;
    spawnBurst(fx, c.x, c.y - 20, '#ffd97a');
    floatText(fx, c.x, c.y - 30, `+$${earned}`, '#2b7a3d');
    if (tip > 0) floatText(fx, c.x, c.y - 58, `tip +$${tip}`, '#b8860b');
    if (streakBonus > 0) floatText(fx, c.x, c.y - 86, `streak +$${streakBonus}`, '#e4572e');
    game.flash = { text: `${ev.recipe.name} served!`, color: '#2b7a3d', until: game.now + 1.2 };
  } else if (ev.kind === 'dish-ready') {
    spawnBurst(fx, ev.at.x, ev.at.y, '#7cc98a');
    game.flash = { text: `${ev.recipe.name} is ready!`, color: '#1f7a33', until: game.now + 1.2 };
  } else if (ev.kind === 'trash') {
    floatText(fx, c.x, c.y - 20, 'trashed', '#6e7a85');
  }
}

attachInput(canvas, input, game, chef, kitchen, onAction);

// --- Screenshot staging -----------------------------------------------------
// The maker takes the entry's screenshots by loading the game with ?shot=:
//   ?shot=title — the title screen over the empty kitchen
//   ?shot=mid   — mid-rush: three tickets, a dish half-built, a patty grilling
//   ?shot=serve — a finished plate, the chef carrying it to the pass
// These are the game's own states, rendered by its own code.
function stageShot(shot) {
  if (shot === 'title') {
    game.screen = 'title';
    return;
  }
  reset();
  if (shot === 'mid') {
    game.time = 62;
    game.timeLeft = DAY_SECONDS - 62;
    game.coins = 34;
    game.streak = 2;
    game.tickets = [
      { id: 1, recipeId: 'burger', patience: 52, maxPatience: 70, bornAt: 40 },
      { id: 2, recipeId: 'pasta', patience: 30, maxPatience: 60, bornAt: 48 },
      { id: 3, recipeId: 'salad', patience: 18, maxPatience: 55, bornAt: 55 },
    ];
    kitchen.grill.slots[0] = { kind: 'patty', state: 'cooking', progress: 0.6 };
    kitchen.boards[0].item = { kind: 'tomato', state: 'chopped', progress: 1, chopping: false };
    kitchen.plates[0].items = [
      { kind: 'bun' },
      { kind: 'patty', state: 'grilled' },
    ];
    chef.carrying = { kind: 'lettuce', state: 'chopped' };
    chef.x = 700;
    chef.y = 480;
  } else if (shot === 'serve') {
    game.time = 105;
    game.timeLeft = DAY_SECONDS - 105;
    game.coins = 86;
    game.streak = 3;
    game.tickets = [
      { id: 1, recipeId: 'cheeseburger', patience: 40, maxPatience: 65, bornAt: 80 },
      { id: 2, recipeId: 'pasta-deluxe', patience: 55, maxPatience: 70, bornAt: 90 },
    ];
    kitchen.grill.slots[1] = { kind: 'patty', state: 'done', progress: 0.3 };
    kitchen.pot.item = { kind: 'pasta', state: 'boiling', progress: 0.45 };
    kitchen.boards[1].item = { kind: 'lettuce', state: 'chopped', progress: 1, chopping: false };
    chef.carrying = { kind: 'dish', recipeId: 'cheeseburger' };
    chef.x = 860;
    chef.y = 490;
    chef.dir = 1;
  }
}

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  stageShot(shot);
  // Freeze the staged frame: no ticking, no wandering.
  drawGame(ctx, game, kitchen, chef, fx);
} else {
  requestAnimationFrame(loop);
}

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.now += dt;

  if (game.screen === 'playing') {
    // Last-10-seconds tick.
    const sec = Math.ceil(game.timeLeft);
    if (sec <= 10 && sec !== lastTickSecond && sec > 0) {
      lastTickSecond = sec;
      sfx.tick();
    }
    applyKeys(input, chef, dt);
    const arrived = updateChef(chef, dt);
    if (arrived && input.pendingStation) {
      const st = input.pendingStation;
      input.pendingStation = null;
      handleStation(st);
    }
    updateGame(game, dt);
    const hot = updateKitchen(kitchen, dt, fx);
    updateSizzle(hot);
    updateParticles(fx, dt);
    // Ambient steam over hot stations.
    if (Math.random() < dt * 8) {
      if (kitchen.grill.slots.some((s) => s)) {
        spawnSteam(fx, kitchen.grill.x + 105, kitchen.grill.y + 40, 1);
      }
      if (kitchen.pot.item) {
        spawnSteam(fx, kitchen.pot.x + 105, kitchen.pot.y + 40, 1);
        if (Math.random() < 0.5) spawnSpark(fx, kitchen.pot.x + 105, kitchen.pot.y + 50, 1);
      }
    }
  }

  drawGame(ctx, game, kitchen, chef, fx);
}
