// Rendering: the whole kitchen is drawn in code — no image assets. Every
// station, every ingredient and the chef are vector shapes on one canvas.

import { COLORS, INGREDIENTS, STATIONS, W, H } from './config.js';
import { recipeById, starsFor } from './state.js';
import { drawParticles } from './particles.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, font, color, align = 'center') {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

// --- Food, drawn as vector shapes ------------------------------------------
export function drawFood(ctx, kind, state, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 36, s / 36);
  if (kind === 'lettuce') {
    ctx.fillStyle = '#58b368';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7cc98a';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 8, Math.sin(a) * 8, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#3d8b4f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(0, 12);
    ctx.stroke();
  } else if (kind === 'tomato') {
    ctx.fillStyle = '#e4572e';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff8a5c';
    ctx.beginPath();
    ctx.arc(-4, -5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3d8b4f';
    ctx.beginPath();
    ctx.arc(0, -13, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-5, -11, 4, 2, -0.5, 0, Math.PI * 2);
    ctx.ellipse(5, -11, 4, 2, 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'bun') {
    ctx.fillStyle = '#e8a94f';
    ctx.beginPath();
    ctx.arc(0, 2, 15, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-15, 2, 30, 5);
    ctx.fillStyle = '#fff3d6';
    for (const [dx, dy] of [[-7, -6], [0, -10], [7, -6], [-3, -3], [4, -2]]) {
      ctx.beginPath();
      ctx.arc(dx, dy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'patty') {
    ctx.fillStyle = state === 'burnt' ? '#1f1a17' : state === 'grilled' ? '#6b4226' : '#a06a4a';
    rr(ctx, -16, -8, 32, 16, 8);
    ctx.fill();
    if (state === 'grilled') {
      ctx.strokeStyle = '#4a2c17';
      ctx.lineWidth = 2;
      for (const dx of [-8, 0, 8]) {
        ctx.beginPath();
        ctx.moveTo(dx, -8);
        ctx.lineTo(dx, 8);
        ctx.stroke();
      }
    }
  } else if (kind === 'pasta') {
    ctx.strokeStyle = state === 'burnt' ? '#5a4632' : '#f2c14e';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-14, i * 9);
      ctx.bezierCurveTo(-7, i * 9 - 7, 0, i * 9 + 7, 7, i * 9 - 4);
      ctx.bezierCurveTo(10, i * 9 - 7, 12, i * 9, 14, i * 9);
      ctx.stroke();
    }
  } else if (kind === 'cheese') {
    ctx.fillStyle = '#f7d154';
    ctx.beginPath();
    ctx.moveTo(-15, 10);
    ctx.lineTo(15, 10);
    ctx.lineTo(0, -12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8a94f';
    for (const [dx, dy] of [[-6, 4], [3, 0], [6, 6]]) {
      ctx.beginPath();
      ctx.arc(dx, dy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'sauce') {
    ctx.fillStyle = '#c0392b';
    rr(ctx, -7, -8, 14, 22, 5);
    ctx.fill();
    ctx.fillStyle = '#7e2318';
    ctx.fillRect(-4, -14, 8, 7);
    ctx.fillStyle = '#fff3d6';
    ctx.fillRect(-7, 0, 14, 6);
  } else if (kind === 'dish') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d8d2c0';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawProgressBar(ctx, x, y, w, frac, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  rr(ctx, x, y, w, 9, 4);
  ctx.fill();
  ctx.fillStyle = color;
  if (frac > 0.01) {
    rr(ctx, x, y, Math.max(9, w * Math.min(1, frac)), 9, 4);
    ctx.fill();
  }
}

// --- Stations ---------------------------------------------------------------
function drawBins(ctx) {
  text(ctx, 'PANTRY', 146, 112, 'bold 13px sans-serif', '#6b4a2f');
  for (const b of STATIONS.bins) {
    ctx.fillStyle = '#a06838';
    rr(ctx, b.x, b.y, b.w, b.h, 8);
    ctx.fill();
    ctx.fillStyle = '#d9a05b';
    rr(ctx, b.x + 4, b.y + 4, b.w - 8, b.h - 8, 6);
    ctx.fill();
    drawFood(ctx, b.kind, 'raw', b.x + 30, b.y + b.h / 2, 34);
    text(ctx, INGREDIENTS[b.kind].name, b.x + 62, b.y + b.h / 2 - 8, 'bold 14px sans-serif', COLORS.ink, 'left');
    text(
      ctx,
      INGREDIENTS[b.kind].chop ? `chop ${INGREDIENTS[b.kind].chop}s` : INGREDIENTS[b.kind].grill
        ? `grill ${INGREDIENTS[b.kind].grill}s`
        : INGREDIENTS[b.kind].boil
          ? `boil ${INGREDIENTS[b.kind].boil}s`
          : 'ready',
      b.x + 62,
      b.y + b.h / 2 + 12,
      '12px sans-serif',
      '#6b4a2f',
      'left',
    );
  }
}

function drawBoards(ctx, kitchen) {
  for (const b of kitchen.boards) {
    ctx.fillStyle = '#8a6a45';
    rr(ctx, b.x, b.y, b.w, b.h, 8);
    ctx.fill();
    ctx.fillStyle = COLORS.board;
    rr(ctx, b.x + 5, b.y + 5, b.w - 10, b.h - 10, 6);
    ctx.fill();
    text(ctx, 'CHOP', b.x + b.w / 2, b.y + 16, 'bold 12px sans-serif', '#8a6a45');
    if (b.item) {
      drawFood(ctx, b.item.kind, b.item.state, b.x + b.w / 2, b.y + b.h / 2 + 8, 44);
      if (b.item.chopping) {
        drawProgressBar(ctx, b.x + 30, b.y + b.h - 16, b.w - 60, b.item.progress, '#3d8b4f');
      }
    }
  }
}

function drawGrill(ctx, kitchen) {
  const g = kitchen.grill;
  ctx.fillStyle = COLORS.steelDark;
  rr(ctx, g.x, g.y, g.w, g.h, 8);
  ctx.fill();
  ctx.fillStyle = '#3a3f45';
  rr(ctx, g.x + 8, g.y + 8, g.w - 16, g.h - 16, 6);
  ctx.fill();
  ctx.strokeStyle = '#5a636d';
  ctx.lineWidth = 2;
  for (let i = 1; i < 6; i++) {
    const y = g.y + 8 + ((g.h - 16) / 6) * i;
    ctx.beginPath();
    ctx.moveTo(g.x + 10, y);
    ctx.lineTo(g.x + g.w - 10, y);
    ctx.stroke();
  }
  text(ctx, 'GRILL', g.x + g.w / 2, g.y + 16, 'bold 12px sans-serif', '#c8cfd6');
  g.slots.forEach((slot, i) => {
    const cx = g.x + 55 + i * 100;
    const cy = g.y + 72;
    if (slot) {
      drawFood(ctx, 'patty', slot.state, cx, cy, 44);
      if (slot.state === 'cooking') {
        drawProgressBar(ctx, cx - 32, cy + 26, 64, slot.progress, '#e8a94f');
      } else if (slot.state === 'done') {
        text(ctx, 'READY!', cx, cy + 34, 'bold 13px sans-serif', '#7CFC9A');
        drawProgressBar(ctx, cx - 32, cy + 44, 64, slot.progress, '#c0392b');
      } else if (slot.state === 'burnt') {
        text(ctx, 'BURNT!', cx, cy + 34, 'bold 13px sans-serif', '#ff6b5e');
      }
    }
  });
}

function drawPot(ctx, kitchen) {
  const p = kitchen.pot;
  ctx.fillStyle = COLORS.steelDark;
  rr(ctx, p.x, p.y, p.w, p.h, 8);
  ctx.fill();
  ctx.fillStyle = '#c8cfd6';
  rr(ctx, p.x + 30, p.y + 30, p.w - 60, p.h - 50, 12);
  ctx.fill();
  ctx.fillStyle = '#7fb3d5';
  rr(ctx, p.x + 36, p.y + 36, p.w - 72, p.h - 62, 10);
  ctx.fill();
  text(ctx, 'POT — BOIL', p.x + p.w / 2, p.y + 16, 'bold 12px sans-serif', '#c8cfd6');
  const item = p.item;
  if (item) {
    drawFood(ctx, 'pasta', item.state, p.x + p.w / 2, p.y + 68, 46);
    if (item.state === 'boiling') {
      drawProgressBar(ctx, p.x + 40, p.y + p.h - 14, p.w - 80, item.progress, '#e8a94f');
    } else if (item.state === 'done') {
      text(ctx, 'READY!', p.x + p.w / 2, p.y + p.h - 8, 'bold 13px sans-serif', '#1f7a33');
      drawProgressBar(ctx, p.x + 40, p.y + p.h - 26, p.w - 80, item.progress, '#c0392b');
    } else if (item.state === 'burnt') {
      text(ctx, 'MUSH!', p.x + p.w / 2, p.y + p.h - 8, 'bold 13px sans-serif', '#c0392b');
    }
  }
}

function drawPlates(ctx, kitchen, now) {
  for (const pl of kitchen.plates) {
    ctx.fillStyle = '#a06838';
    rr(ctx, pl.x, pl.y, pl.w, pl.h, 8);
    ctx.fill();
    ctx.fillStyle = '#d9a05b';
    rr(ctx, pl.x + 4, pl.y + 4, pl.w - 8, pl.h - 8, 6);
    ctx.fill();
    if (pl.ready) {
      const pulse = 0.6 + 0.4 * Math.sin(now * 5);
      ctx.strokeStyle = `rgba(232,169,79,${pulse})`;
      ctx.lineWidth = 4;
      rr(ctx, pl.x - 2, pl.y - 2, pl.w + 4, pl.h + 4, 10);
      ctx.stroke();
    }
    // the plate itself
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(pl.x + pl.w / 2, pl.y + 62, 62, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d8d2c0';
    ctx.lineWidth = 2;
    ctx.stroke();
    pl.items.forEach((c, i) => {
      const dx = [-28, 28, -8, 12, 0][i % 5];
      const dy = [-8, -10, 10, 8, -2][i % 5];
      drawFood(ctx, c.kind, c.state, pl.x + pl.w / 2 + dx, pl.y + 62 + dy, 30);
    });
    text(
      ctx,
      pl.ready ? 'READY — PICK UP!' : pl.items.length ? 'PLATING…' : 'PLATE',
      pl.x + pl.w / 2,
      pl.y + pl.h - 12,
      'bold 12px sans-serif',
      pl.ready ? '#1f7a33' : '#6b4a2f',
    );
  }
}

function drawServeTrash(ctx) {
  const s = STATIONS.serve;
  ctx.fillStyle = '#5a3d2b';
  rr(ctx, s.x, s.y, s.w, s.h, 8);
  ctx.fill();
  ctx.fillStyle = '#2b1a12';
  rr(ctx, s.x + 10, s.y + 26, s.w - 20, s.h - 36, 6);
  ctx.fill();
  ctx.fillStyle = '#ffb703';
  ctx.beginPath();
  ctx.arc(s.x + s.w / 2, s.y + 22, 8, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, 'SERVE', s.x + s.w / 2, s.y + s.h - 12, 'bold 13px sans-serif', '#ffd97a');
  const t = STATIONS.trash;
  ctx.fillStyle = '#6e7a85';
  rr(ctx, t.x, t.y, t.w, t.h, 8);
  ctx.fill();
  ctx.fillStyle = '#8f9aa5';
  rr(ctx, t.x + 14, t.y + 18, t.w - 28, t.h - 36, 6);
  ctx.fill();
  text(ctx, 'TRASH', t.x + t.w / 2, t.y + t.h - 12, 'bold 13px sans-serif', '#e8ecf0');
}

// --- Chef --------------------------------------------------------------------
function drawChef(ctx, chef) {
  const bob = chef.moving ? Math.sin(chef.bob) * 2 : 0;
  const x = chef.x;
  const y = chef.y + bob;
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(x, chef.y + 26, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // body (apron)
  ctx.fillStyle = '#f4f1e8';
  rr(ctx, x - 16, y - 6, 32, 34, 10);
  ctx.fill();
  ctx.fillStyle = '#3d8b4f';
  ctx.fillRect(x - 16, y + 14, 32, 8);
  // head
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(x, y - 16, 13, 0, Math.PI * 2);
  ctx.fill();
  // toque
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - 8, y - 26, 8, 0, Math.PI * 2);
  ctx.arc(x + 8, y - 26, 8, 0, Math.PI * 2);
  ctx.arc(x, y - 30, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 11, y - 28, 22, 6);
  // eyes
  ctx.fillStyle = '#2b2118';
  ctx.beginPath();
  ctx.arc(x - 5 + chef.dir * 2, y - 17, 1.8, 0, Math.PI * 2);
  ctx.arc(x + 5 + chef.dir * 2, y - 17, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // carried item above the hat
  if (chef.carrying) {
    const c = chef.carrying;
    if (c.kind === 'dish') {
      const recipe = recipeById(c.recipeId);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(x, y - 46, 24, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d8d2c0';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (recipe) {
        recipe.needs.forEach((n, i) => {
          const dx = (i - (recipe.needs.length - 1) / 2) * 13;
          drawFood(ctx, n.kind, n.state, x + dx, y - 46, 15);
        });
      }
    } else {
      drawFood(ctx, c.kind, c.state, x, y - 44, 34);
    }
  }
}

// --- Tickets + HUD ------------------------------------------------------------
function drawTicket(ctx, t, x, y, w, now) {
  const recipe = recipeById(t.recipeId);
  const frac = Math.max(0, t.patience / t.maxPatience);
  const urgent = t.patience < 15;
  const pulse = urgent ? 0.75 + 0.25 * Math.sin(now * 8) : 1;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = COLORS.ticket;
  rr(ctx, x, y, w, 86, 8);
  ctx.fill();
  ctx.strokeStyle = urgent ? '#c0392b' : '#d8cdb2';
  ctx.lineWidth = urgent ? 3 : 1.5;
  ctx.stroke();
  ctx.restore();
  text(ctx, recipe.name.toUpperCase(), x + 10, y + 14, 'bold 13px sans-serif', COLORS.ink, 'left');
  // component chips
  let cx = x + 10;
  for (const n of recipe.needs) {
    drawFood(ctx, n.kind, n.state, cx + 12, y + 38, 22);
    cx += 28;
  }
  text(ctx, `${Math.ceil(t.patience)}s`, x + w - 8, y + 14, 'bold 13px sans-serif', urgent ? '#c0392b' : '#6b4a2f', 'right');
  const barColor = frac > 0.5 ? '#3d8b4f' : frac > 0.25 ? '#e8a94f' : '#c0392b';
  drawProgressBar(ctx, x + 10, y + 66, w - 20, frac, barColor);
}

export function drawGame(ctx, game, kitchen, chef, fx) {
  // floor
  ctx.fillStyle = COLORS.floorA;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COLORS.floorB;
  const ts = 64;
  for (let y = 100; y < H; y += ts) {
    for (let x = 0; x < W; x += ts) {
      if (((x / ts) | 0) % 2 === ((y / ts) | 0) % 2) ctx.fillRect(x, y, ts, ts);
    }
  }
  // top band
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, W, 100);
  ctx.fillStyle = '#5a3d2b';
  ctx.fillRect(0, 96, W, 4);
  text(ctx, 'ORDER BOARD', 16, 16, 'bold 12px sans-serif', '#e8c98a', 'left');
  game.tickets.forEach((t, i) => drawTicket(ctx, t, 16 + i * 182, 22, 172, game.now));
  for (let i = game.tickets.length; i < 4; i++) {
    ctx.strokeStyle = 'rgba(232,201,138,0.4)';
    ctx.setLineDash([6, 6]);
    rr(ctx, 16 + i * 182, 22, 172, 86, 8);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'waiting…', 16 + i * 182 + 86, 64, '13px sans-serif', 'rgba(232,201,138,0.6)');
  }
  // timer, coins, streak
  const mins = Math.floor(game.timeLeft / 60);
  const secs = Math.floor(game.timeLeft % 60);
  const timeText = `${mins}:${String(secs).padStart(2, '0')}`;
  const lowTime = game.timeLeft <= 30 && game.screen === 'playing';
  text(ctx, timeText, 830, 42, 'bold 44px sans-serif', lowTime ? '#ff6b5e' : '#fff8e7');
  text(ctx, 'TIME LEFT', 830, 82, 'bold 11px sans-serif', '#e8c98a');
  // coins: a drawn gold coin, no emoji font needed
  ctx.fillStyle = '#ffd97a';
  ctx.beginPath();
  ctx.arc(948, 42, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, '$', 948, 42, 'bold 18px sans-serif', '#8a6d1f');
  text(ctx, `${game.coins}`, 972, 42, 'bold 30px sans-serif', '#ffd97a', 'left');
  text(ctx, 'COINS', 990, 82, 'bold 11px sans-serif', '#e8c98a');
  if (game.streak >= 2) {
    text(ctx, `STREAK ×${game.streak}`, 1150, 42, 'bold 22px sans-serif', '#ff9f5a');
    text(ctx, 'IN A ROW', 1150, 82, 'bold 11px sans-serif', '#e8c98a');
  }

  // stations
  drawBins(ctx);
  drawBoards(ctx, kitchen);
  drawGrill(ctx, kitchen);
  drawPot(ctx, kitchen);
  drawPlates(ctx, kitchen, game.now);
  drawServeTrash(ctx);

  // chef + particles
  drawChef(ctx, chef);
  drawParticles(ctx, fx);

  // flash message
  if (game.flash && game.now < game.flash.until) {
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = game.flash.color;
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 6;
    ctx.strokeText(game.flash.text, W / 2, 150);
    ctx.fillText(game.flash.text, W / 2, 150);
  }

  // hint bar (only while playing)
  const hint = hintFor(game, kitchen, chef);
  if (hint) {
    ctx.fillStyle = 'rgba(43,33,24,0.75)';
    rr(ctx, 300, 692, 680, 22, 11);
    ctx.fill();
    text(ctx, hint, 640, 703, '13px sans-serif', '#fff8e7');
  }

  if (game.screen === 'title') drawTitle(ctx);
  if (game.screen === 'over') drawOver(ctx, game);
}

function hintFor(game, kitchen, chef) {
  if (game.screen !== 'playing') return '';
  if (chef.carrying) {
    if (chef.carrying.kind === 'dish') return 'Dish ready — click the SERVE window to send it out!';
    if (chef.carrying.state === 'burnt') return 'Burnt! Click the TRASH to throw it away.';
    if (chef.carrying.state === 'raw' && (chef.carrying.kind === 'lettuce' || chef.carrying.kind === 'tomato'))
      return 'Click a CHOP board to chop it.';
    if (chef.carrying.kind === 'patty') return 'Click the GRILL to cook the patty — take it off before it burns!';
    if (chef.carrying.kind === 'pasta') return 'Click the POT to boil the pasta.';
    return 'Click a PLATE to add it to the dish.';
  }
  const readyPlate = kitchen.plates.find((p) => p.ready);
  if (readyPlate) return 'A plate is READY — click it to pick the dish up.';
  if (game.tickets.length === 0) return 'Click a PANTRY bin to grab an ingredient. Orders arrive soon!';
  return 'Click a PANTRY bin to grab an ingredient, then prep it and plate it.';
}

function drawTitle(ctx) {
  ctx.fillStyle = 'rgba(43,33,24,0.72)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, 'SIZZLE & SERVE', W / 2, 190, 'bold 72px sans-serif', '#ffd97a');
  text(ctx, '— RUSH HOUR BISTRO —', W / 2, 250, 'bold 22px sans-serif', '#fff8e7');
  text(ctx, 'The lunch rush is on. Read the tickets, run the kitchen, serve before patience runs out.', W / 2, 310, '20px sans-serif', '#fff8e7');
  text(ctx, 'CLICK a station to send the chef there — chop, grill, boil, plate, serve.', W / 2, 360, '19px sans-serif', '#ffd97a');
  text(ctx, 'WASD / arrows move the chef · SPACE works the nearest station · M mutes', W / 2, 392, '17px sans-serif', '#e8c98a');
  text(ctx, 'Burnt food goes in the TRASH. Serve fast for tips — three in a row earns a bonus.', W / 2, 424, '17px sans-serif', '#e8c98a');
  const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 300);
  ctx.globalAlpha = pulse;
  text(ctx, '▶  CLICK TO START  ◀', W / 2, 510, 'bold 30px sans-serif', '#ffffff');
  ctx.globalAlpha = 1;
}

function drawOver(ctx, game) {
  ctx.fillStyle = 'rgba(43,33,24,0.78)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, 'SERVICE OVER!', W / 2, 170, 'bold 64px sans-serif', '#ffd97a');
  const stars = starsFor(game.coins);
  let sx = W / 2 - (stars * 56) / 2;
  for (let i = 0; i < 3; i++) {
    drawStar(ctx, sx + 28, 240, 24, i < stars ? '#ffd97a' : 'rgba(255,255,255,0.25)');
    sx += 56;
  }
  text(ctx, `Coins earned: ${game.coins}`, W / 2, 310, 'bold 30px sans-serif', '#fff8e7');
  text(ctx, `Dishes served: ${game.served}   ·   Orders lost: ${game.lost}   ·   Best streak: ×${game.bestStreak}`, W / 2, 360, '20px sans-serif', '#e8c98a');
  const verdict =
    stars === 3
      ? 'Three stars — the bistro sings your name!'
      : stars === 2
        ? 'Two stars — a fine service. The rush can be beaten!'
        : stars === 1
          ? 'One star — the kitchen survived. Aim higher!'
          : 'No stars yet — the lunch rush is a harsh teacher.';
  text(ctx, verdict, W / 2, 410, '19px sans-serif', '#fff8e7');
  const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 300);
  ctx.globalAlpha = pulse;
  text(ctx, 'CLICK OR PRESS R TO COOK AGAIN', W / 2, 490, 'bold 26px sans-serif', '#ffffff');
  ctx.globalAlpha = 1;
}

function drawStar(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(ang) * rad;
    const py = y + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}
