// The chef: a little cook who walks where you point and carries one thing.

import { CHEF_SPEED, CHEF_START } from './config.js';

export function createChef() {
  return {
    x: CHEF_START.x,
    y: CHEF_START.y,
    tx: CHEF_START.x, // walk target
    ty: CHEF_START.y,
    moving: false,
    dir: 1, // facing: 1 right, -1 left
    carrying: null, // { kind, state } or { kind:'dish', recipeId }
    bob: 0,
  };
}

export function walkTo(chef, x, y) {
  chef.tx = Math.max(30, Math.min(1250, x));
  chef.ty = Math.max(120, Math.min(690, y));
  chef.moving = true;
}

export function updateChef(chef, dt) {
  if (!chef.moving) return false;
  const dx = chef.tx - chef.x;
  const dy = chef.ty - chef.y;
  const dist = Math.hypot(dx, dy);
  const step = CHEF_SPEED * dt;
  if (dist <= step) {
    chef.x = chef.tx;
    chef.y = chef.ty;
    chef.moving = false;
    return true; // arrived
  }
  chef.x += (dx / dist) * step;
  chef.y += (dy / dist) * step;
  if (Math.abs(dx) > 4) chef.dir = dx > 0 ? 1 : -1;
  chef.bob += dt * 14;
  return false;
}

// Where the chef should stand to work a station: just below its centre.
export function standPoint(station) {
  const c = station.center;
  return { x: c.x, y: c.y + station.def.h / 2 + 34 };
}
