// Input: mouse clicks and keyboard. Clicking a station sends the chef there
// and works it on arrival; clicking open floor just walks. WASD and arrows
// drive the chef directly; Space works the nearest station; R restarts.

import { stationAt } from './kitchen.js';
import { walkTo } from './chef.js';
import { STATIONS } from './config.js';

export function createInput() {
  return {
    pendingStation: null, // station to work when the chef arrives
    keys: {},
  };
}

export function attachInput(canvas, input, game, chef, kitchen, onAction) {
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    if (game.screen === 'title') {
      onAction({ kind: 'start' });
      return;
    }
    if (game.screen === 'over') {
      onAction({ kind: 'restart' });
      return;
    }
    const station = stationAt(kitchen, x, y);
    if (station) {
      const sp = {
        x: station.center.x,
        y: station.center.y + station.def.h / 2 + 34,
      };
      walkTo(chef, sp.x, sp.y);
      input.pendingStation = station;
    } else {
      walkTo(chef, x, y);
      input.pendingStation = null;
    }
  });

  window.addEventListener('keydown', (e) => {
    input.keys[e.key.toLowerCase()] = true;
    if (game.screen === 'title' && (e.key === 'Enter' || e.key === ' ')) {
      onAction({ kind: 'start' });
    } else if (game.screen === 'over' && (e.key === 'r' || e.key === 'R' || e.key === 'Enter')) {
      onAction({ kind: 'restart' });
    } else if (game.screen === 'playing' && e.key === ' ') {
      e.preventDefault();
      onAction({ kind: 'use-nearest' });
    } else if (e.key === 'm' || e.key === 'M') {
      onAction({ kind: 'mute' });
    }
  });
  window.addEventListener('keyup', (e) => {
    input.keys[e.key.toLowerCase()] = false;
  });
}

// WASD / arrows: direct drive, overriding any walk target.
export function applyKeys(input, chef, dt) {
  const k = input.keys;
  let dx = 0;
  let dy = 0;
  if (k['a'] || k['arrowleft']) dx -= 1;
  if (k['d'] || k['arrowright']) dx += 1;
  if (k['w'] || k['arrowup']) dy -= 1;
  if (k['s'] || k['arrowdown']) dy += 1;
  if (dx === 0 && dy === 0) return;
  const len = Math.hypot(dx, dy);
  const speed = 430;
  chef.x = Math.max(30, Math.min(1250, chef.x + (dx / len) * speed * dt));
  chef.y = Math.max(120, Math.min(690, chef.y + (dy / len) * speed * dt));
  chef.moving = false;
  chef.tx = chef.x;
  chef.ty = chef.y;
  if (dx !== 0) chef.dir = dx > 0 ? 1 : -1;
  chef.bob += dt * 14;
  input.pendingStation = null;
}

// The station nearest the chef, within reach.
export function nearestStation(kitchen, chef) {
  const all = [];
  for (const b of STATIONS.bins) {
    all.push({ type: 'bin', def: b, center: { x: b.x + b.w / 2, y: b.y + b.h / 2 } });
  }
  for (const b of kitchen.boards) {
    all.push({ type: 'board', def: b, center: { x: b.x + b.w / 2, y: b.y + b.h / 2 } });
  }
  all.push({
    type: 'grill',
    def: kitchen.grill,
    center: { x: kitchen.grill.x + kitchen.grill.w / 2, y: kitchen.grill.y + kitchen.grill.h / 2 },
  });
  all.push({
    type: 'pot',
    def: kitchen.pot,
    center: { x: kitchen.pot.x + kitchen.pot.w / 2, y: kitchen.pot.y + kitchen.pot.h / 2 },
  });
  for (const p of kitchen.plates) {
    all.push({ type: 'plate', def: p, center: { x: p.x + p.w / 2, y: p.y + p.h / 2 } });
  }
  all.push({
    type: 'serve',
    def: STATIONS.serve,
    center: { x: STATIONS.serve.x + STATIONS.serve.w / 2, y: STATIONS.serve.y + STATIONS.serve.h / 2 },
  });
  all.push({
    type: 'trash',
    def: STATIONS.trash,
    center: { x: STATIONS.trash.x + STATIONS.trash.w / 2, y: STATIONS.trash.y + STATIONS.trash.h / 2 },
  });
  let best = null;
  let bestD = 130;
  for (const s of all) {
    const d = Math.hypot(s.center.x - chef.x, s.center.y - chef.y);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}
