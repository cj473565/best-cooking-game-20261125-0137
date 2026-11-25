// The kitchen itself: stations, what sits on them, and the rules for using
// them. The chef walks to a station and this module does the work.

import { INGREDIENTS, STATIONS } from './config.js';
import { plateAccepts, recipeForPlate, serveDish, recipeById } from './state.js';
import { sfx } from './audio.js';

export function createKitchen() {
  return {
    boards: STATIONS.boards.map((b) => ({
      ...b,
      item: null, // { kind, state: 'raw'|'chopped', progress, chopping }
    })),
    grill: {
      ...STATIONS.grill,
      slots: [null, null], // { kind:'patty', state:'raw'|'cooking'|'done'|'burnt', progress }
    },
    pot: {
      ...STATIONS.pot,
      item: null, // { kind:'pasta', state, progress }
    },
    plates: STATIONS.plates.map((p) => ({
      ...p,
      items: [], // components on the plate
      ready: false,
      recipeId: null,
    })),
  };
}

function stationCenter(s) {
  return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
}

// Find the station whose rect contains the point (or null).
export function stationAt(kitchen, x, y) {
  for (const b of STATIONS.bins) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      return { type: 'bin', def: b, center: stationCenter(b) };
    }
  }
  for (const b of kitchen.boards) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      return { type: 'board', def: b, center: stationCenter(b) };
    }
  }
  const g = kitchen.grill;
  if (x >= g.x && x <= g.x + g.w && y >= g.y && y <= g.y + g.h) {
    return { type: 'grill', def: g, center: stationCenter(g) };
  }
  const p = kitchen.pot;
  if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) {
    return { type: 'pot', def: p, center: stationCenter(p) };
  }
  for (const pl of kitchen.plates) {
    if (x >= pl.x && x <= pl.x + pl.w && y >= pl.y && y <= pl.y + pl.h) {
      return { type: 'plate', def: pl, center: stationCenter(pl) };
    }
  }
  const s = STATIONS.serve;
  if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) {
    return { type: 'serve', def: s, center: stationCenter(s) };
  }
  const t = STATIONS.trash;
  if (x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h) {
    return { type: 'trash', def: t, center: stationCenter(t) };
  }
  return null;
}

// Advance chopping / grilling / boiling. Returns true when anything is hot.
export function updateKitchen(kitchen, dt, fx) {
  let hot = false;
  for (const b of kitchen.boards) {
    if (b.item && b.item.chopping) {
      b.item.progress += dt / INGREDIENTS[b.item.kind].chop;
      if (Math.random() < dt * 6) sfx.chop();
      if (b.item.progress >= 1) {
        b.item.state = 'chopped';
        b.item.chopping = false;
        sfx.chopped();
      }
    }
  }
  for (const slot of kitchen.grill.slots) {
    if (!slot) continue;
    hot = true;
    if (slot.state === 'cooking') {
      slot.progress += dt / INGREDIENTS.patty.grill;
      if (slot.progress >= 1) {
        slot.state = 'done';
        slot.progress = 0;
        sfx.ready();
      }
    } else if (slot.state === 'done') {
      slot.progress += dt / INGREDIENTS.patty.burnAfter;
      if (slot.progress >= 1) {
        slot.state = 'burnt';
        slot.progress = 0;
      }
    }
  }
  const pot = kitchen.pot.item;
  if (pot) {
    hot = true;
    if (pot.state === 'boiling') {
      pot.progress += dt / INGREDIENTS.pasta.boil;
      if (pot.progress >= 1) {
        pot.state = 'done';
        pot.progress = 0;
        sfx.ready();
      }
    } else if (pot.state === 'done') {
      pot.progress += dt / INGREDIENTS.pasta.burnAfter;
      if (pot.progress >= 1) {
        pot.state = 'burnt';
        pot.progress = 0;
      }
    }
  }
  return hot;
}

// The chef arrived at a station: do the right thing with what is in hand.
// Returns an event for the main loop: { kind, ... }.
export function useStation(game, kitchen, chef, station, fx) {
  const hand = chef.carrying;
  switch (station.type) {
    case 'bin': {
      if (hand) return { kind: 'deny', text: 'Hands full!' };
      chef.carrying = { kind: station.def.kind, state: 'raw' };
      sfx.pickup();
      return { kind: 'pickup' };
    }
    case 'board': {
      const b = station.def;
      if (b.item && b.item.state === 'chopped' && !hand) {
        chef.carrying = { kind: b.item.kind, state: 'chopped' };
        b.item = null;
        sfx.pickup();
        return { kind: 'pickup' };
      }
      if (!b.item && hand && INGREDIENTS[hand.kind].chop > 0 && hand.state === 'raw') {
        b.item = { kind: hand.kind, state: 'raw', progress: 0, chopping: true };
        chef.carrying = null;
        sfx.place();
        return { kind: 'place' };
      }
      return { kind: 'deny', text: b.item ? 'Board is busy' : 'Nothing to chop' };
    }
    case 'grill': {
      const g = station.def;
      const free = g.slots.findIndex((s) => s === null);
      if (hand && hand.kind === 'patty' && hand.state === 'raw' && free >= 0) {
        g.slots[free] = { kind: 'patty', state: 'cooking', progress: 0 };
        chef.carrying = null;
        sfx.grillOn();
        return { kind: 'place' };
      }
      const done = g.slots.findIndex((s) => s && (s.state === 'done' || s.state === 'burnt'));
      if (!hand && done >= 0) {
        const slot = g.slots[done];
        chef.carrying = {
          kind: 'patty',
          state: slot.state === 'done' ? 'grilled' : 'burnt',
        };
        g.slots[done] = null;
        sfx.pickup();
        return { kind: 'pickup' };
      }
      return { kind: 'deny', text: hand ? 'Grill is full' : 'Nothing ready' };
    }
    case 'pot': {
      const p = station.def;
      if (hand && hand.kind === 'pasta' && hand.state === 'raw' && !p.item) {
        p.item = { kind: 'pasta', state: 'boiling', progress: 0 };
        chef.carrying = null;
        sfx.place();
        return { kind: 'place' };
      }
      if (!hand && p.item && (p.item.state === 'done' || p.item.state === 'burnt')) {
        chef.carrying = {
          kind: 'pasta',
          state: p.item.state === 'done' ? 'boiled' : 'burnt',
        };
        p.item = null;
        sfx.pickup();
        return { kind: 'pickup' };
      }
      return { kind: 'deny', text: hand ? 'Pot is busy' : 'Nothing ready' };
    }
    case 'plate': {
      const pl = station.def;
      if (pl.ready && !hand) {
        chef.carrying = { kind: 'dish', recipeId: pl.recipeId };
        pl.items = [];
        pl.ready = false;
        pl.recipeId = null;
        sfx.pickup();
        return { kind: 'pickup' };
      }
      if (hand && hand.kind !== 'dish' && hand.state !== 'burnt') {
        // On a plate, a raw bun/cheese/sauce counts as plain; chopped, grilled
        // and boiled items keep their prepared state.
        const comp = {
          kind: hand.kind,
          state: hand.state === 'raw' ? undefined : hand.state,
        };
        const recipe = plateAccepts(game, pl.items, comp);
        if (!recipe) return { kind: 'deny', text: 'No order needs that' };
        pl.items.push(comp);
        chef.carrying = null;
        sfx.place();
        const done = recipeForPlate(pl.items);
        if (done) {
          pl.ready = true;
          pl.recipeId = done.id;
          sfx.ready();
          return { kind: 'dish-ready', recipe: done, at: stationCenter(pl) };
        }
        return { kind: 'place' };
      }
      return { kind: 'deny', text: pl.ready ? 'Plate is ready — pick it up' : 'Nothing to add' };
    }
    case 'serve': {
      if (hand && hand.kind === 'dish') {
        const recipe = recipeById(hand.recipeId);
        const ticket = game.tickets.find((t) => t.recipeId === recipe.id);
        if (!ticket) return { kind: 'deny', text: 'No order for this dish' };
        const result = serveDish(game, recipe, ticket.patience, ticket.maxPatience);
        chef.carrying = null;
        sfx.serve();
        return { kind: 'served', recipe, result, at: stationCenter(station.def) };
      }
      return { kind: 'deny', text: 'Bring a finished dish' };
    }
    case 'trash': {
      if (!hand) return { kind: 'deny', text: 'Nothing to throw away' };
      chef.carrying = null;
      sfx.place();
      return { kind: 'trash' };
    }
    default:
      return { kind: 'deny', text: '' };
  }
}
