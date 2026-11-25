// Particles and floating score text: the little puffs of steam, the sizzle
// sparks and the "+18" that floats up when a dish is served.

export function makeParticles() {
  return { list: [], texts: [] };
}

export function spawnSteam(p, x, y, n = 1) {
  for (let i = 0; i < n; i++) {
    p.list.push({
      kind: 'steam',
      x: x + (Math.random() - 0.5) * 30,
      y: y + (Math.random() - 0.5) * 10,
      vy: -26 - Math.random() * 18,
      vx: (Math.random() - 0.5) * 10,
      life: 0.9 + Math.random() * 0.5,
      age: 0,
      r: 5 + Math.random() * 6,
    });
  }
}

export function spawnSpark(p, x, y, n = 1) {
  for (let i = 0; i < n; i++) {
    p.list.push({
      kind: 'spark',
      x,
      y,
      vy: -30 - Math.random() * 40,
      vx: (Math.random() - 0.5) * 60,
      life: 0.4 + Math.random() * 0.3,
      age: 0,
      r: 2 + Math.random() * 2,
    });
  }
}

export function spawnBurst(p, x, y, color) {
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    p.list.push({
      kind: 'burst',
      x,
      y,
      vx: Math.cos(a) * (60 + Math.random() * 60),
      vy: Math.sin(a) * (60 + Math.random() * 60) - 30,
      life: 0.6 + Math.random() * 0.3,
      age: 0,
      r: 3 + Math.random() * 3,
      color,
    });
  }
}

export function floatText(p, x, y, text, color = '#2b7a3d') {
  p.texts.push({ x, y, text, color, life: 1.1, age: 0 });
}

export function updateParticles(p, dt) {
  for (const q of p.list) {
    q.age += dt;
    q.x += (q.vx || 0) * dt;
    q.y += q.vy * dt;
    if (q.kind === 'steam') q.r += 12 * dt;
  }
  p.list = p.list.filter((q) => q.age < q.life);
  for (const t of p.texts) {
    t.age += dt;
    t.y -= 34 * dt;
  }
  p.texts = p.texts.filter((t) => t.age < t.life);
}

export function drawParticles(ctx, p) {
  for (const q of p.list) {
    const a = 1 - q.age / q.life;
    if (q.kind === 'steam') {
      ctx.globalAlpha = a * 0.45;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
      ctx.fill();
    } else if (q.kind === 'spark') {
      ctx.globalAlpha = a;
      ctx.fillStyle = '#ffb703';
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalAlpha = a;
      ctx.fillStyle = q.color;
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  for (const t of p.texts) {
    const a = 1 - t.age / t.life;
    ctx.globalAlpha = a;
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = t.color;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 4;
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}
