// Smoke test: exercises the API calls behind the UI buttons.
const BASE = process.env.BASE || 'http://localhost:3001';
let pass = 0, fail = 0;
const results = [];
async function step(name, fn) {
  try {
    const detail = await fn();
    pass++;
    results.push(`  PASS  ${name}${detail ? ' — ' + detail : ''}`);
  } catch (e) {
    fail++;
    results.push(`  FAIL  ${name} — ${e.message}`);
  }
}
async function req(method, path, { token, body } = {}) {
  const r = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const b = await r.json().catch(() => null);
  return { status: r.status, body: b };
}
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

async function main() {
  let adminTok;
  await step('Login (admin)', async () => {
    const r = await req('POST', '/api/auth/login', { body: { email: 'admin@waste2goods.ph', password: 'Admin123!' } });
    expect(r.status === 200 && r.body && r.body.accessToken, `status ${r.status}`);
    adminTok = r.body.accessToken;
    return `200, role=${r.body.user && r.body.user.role}`;
  });

  let resTok, resId;
  await step('Login (resident)', async () => {
    const r = await req('POST', '/api/auth/login', { body: { email: 'resident@cabantian.ph', password: 'Resident123!' } });
    expect(r.status === 200 && r.body && r.body.accessToken, `status ${r.status}`);
    resTok = r.body.accessToken;
    resId = r.body.user && (r.body.user.id || r.body.user.userId);
    return `200, userId=${resId}`;
  });

  await step('GET /api/users (admin users screen)', async () => {
    const r = await req('GET', '/api/users', { token: adminTok });
    expect(r.status === 200 && Array.isArray(r.body), `status ${r.status}`);
    return `${r.body.length} users`;
  });

  await step('GET /api/analytics/summary (dashboard)', async () => {
    const r = await req('GET', '/api/analytics/summary', { token: adminTok });
    expect(r.status === 200, `status ${r.status}`);
    return '200';
  });

  await step('GET /api/analytics/weekly + /monthly (charts)', async () => {
    const w = await req('GET', '/api/analytics/weekly', { token: adminTok });
    const m = await req('GET', '/api/analytics/monthly', { token: adminTok });
    expect(w.status === 200 && m.status === 200, `weekly=${w.status} monthly=${m.status}`);
    return '200/200';
  });

  let rewardId;
  await step('GET /api/rewards (rewards screen)', async () => {
    const r = await req('GET', '/api/rewards', { token: adminTok });
    expect(r.status === 200, `status ${r.status}`);
    const items = Array.isArray(r.body) ? r.body : r.body.items || [];
    rewardId = items[0] && (items[0].rewardId || items[0].id);
    return `${items.length} rewards`;
  });

  await step('POST /api/rewards (create reward)', async () => {
    const r = await req('POST', '/api/rewards', { token: adminTok, body: { rewardName: 'SmokeTest Eco Bag', pointsCost: 10, stockQuantity: 5 } });
    expect(r.status === 200 && r.body && r.body.ok, `status ${r.status}`);
    rewardId = r.body.reward.rewardId;
    return `created id=${rewardId}`;
  });

  await step('PUT /api/rewards/:id (edit reward)', async () => {
    const r = await req('PUT', '/api/rewards/' + rewardId, { token: adminTok, body: { pointsCost: 15 } });
    expect(r.status === 200 && r.body && r.body.ok, `status ${r.status}`);
    expect(r.body.reward.pointsCost === 15, 'points not updated');
    return 'points 10 → 15';
  });

  await step('DELETE /api/rewards/:id (delete reward)', async () => {
    const r = await req('DELETE', '/api/rewards/' + rewardId, { token: adminTok });
    expect(r.status === 200 && r.body && r.body.deleted, `status ${r.status}`);
    return 'deleted';
  });

  await step('POST /api/transactions (submit recyclables)', async () => {
    const r = await req('POST', '/api/transactions', { token: adminTok, body: { userId: resId, materialId: 1, weightKg: 2.5 } });
    expect(r.status === 200 && r.body && r.body.pointsEarned === 125, `status ${r.status}, earned=${r.body && r.body.pointsEarned}`);
    return '+125 points';
  });

  await step('POST /api/rewards/redeem (redeem reward)', async () => {
    // Create a cheap reward first so the resident (who just earned ~175 pts) can afford it.
    const c = await req('POST', '/api/rewards', { token: adminTok, body: { rewardName: 'SmokeTest Cheap ' + Date.now(), pointsCost: 5, stockQuantity: 5 } });
    expect(c.status === 200 && c.body && c.body.ok, `create status ${c.status}`);
    const rid = c.body.reward.rewardId;
    const re = await req('POST', '/api/rewards/redeem', { token: resTok, body: { userId: resId, rewardId: rid, quantity: 1 } });
    expect([200, 201].includes(re.status), `status ${re.status}: ${JSON.stringify(re.body)}`);
    return `redeemed reward ${rid} for 5 pts, new balance=${re.body.newBalance}`;
  });

  await step('GET /api/notifications (admin bell)', async () => {
    const r = await req('GET', '/api/notifications', { token: adminTok });
    expect(r.status === 200 && typeof r.body.count === 'number', `status ${r.status}`);
    return `${r.body.count} items, ${r.body.unread} unread`;
  });

  await step('GET /api/users/:id/notifications (mobile bell)', async () => {
    const r = await req('GET', `/api/users/${resId}/notifications`, { token: resTok });
    expect(r.status === 200 && typeof r.body.count === 'number', `status ${r.status}`);
    return `${r.body.count} items`;
  });

  await step('GET /api/leaderboard', async () => {
    const r = await req('GET', '/api/leaderboard', { token: adminTok });
    expect(r.status === 200, `status ${r.status}`);
    return '200';
  });

  await step('POST /api/auth/logout', async () => {
    const r = await req('POST', '/api/auth/logout', { token: adminTok });
    expect([200, 204].includes(r.status), `status ${r.status}`);
    return '200';
  });

  await step('GET /api/users without token → 401', async () => {
    const r = await req('GET', '/api/users');
    expect(r.status === 401, `status ${r.status}`);
    return '401';
  });

  console.log(results.join('\n'));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
