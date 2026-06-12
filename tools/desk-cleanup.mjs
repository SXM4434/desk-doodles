// ONE-TIME DESK CLEANUP — run by Sebs (2026-06-11 approved plan):
//   1. DELETE 8 junk rows: 4 agent test strays (3 stacked on one pixel) +
//      4 broken 3px-wide seed doodles (invisible dead click targets).
//   2. PLANT 3 fresh, properly-sized seed doodles (foreign sessions, so
//      Sandbox stays testable) at clear spots.
//   3. NUDGE the 2 overlapping pairs of Sebs's own doodles apart.
// Run:  node tools/desk-cleanup.mjs
import { createClient } from '@supabase/supabase-js';

const c = createClient(
  'https://revoukwqlisqdjteortc.supabase.co',
  'sb_publishable_3YwGoTCMKQZFZhgKdvwu3w_GXfX3m80',
);

const open = await c.from('desks').select('id').eq('is_open', true).single();
const deskId = open.data.id;
const { data: rows } = await c
  .from('doodles')
  .select('id,session_id,name,x,y')
  .eq('desk_id', deskId);

// ── 1. delete junk ───────────────────────────────────────────────────────────
const strayPrefixes = ['65f21b25', 'a973e2b7', '05130373', 'f6c38f9d'];
const brokenSeedPrefixes = ['late_nig', 'anon_vis', 'maria_do', 'jun_runs'];
let deleted = 0;
for (const r of rows) {
  const junk =
    strayPrefixes.some((p) => r.session_id.startsWith(p)) ||
    brokenSeedPrefixes.some((p) => r.session_id.startsWith(p));
  if (!junk) continue;
  const res = await c.rpc('delete_my_doodle', { p_id: r.id, p_session: r.session_id });
  console.log('delete', (r.name || '(unnamed)').padEnd(12), r.id.slice(0, 8), '→', res.error ? 'ERR ' + res.error.message : res.data);
  if (!res.error && res.data) deleted++;
}

// ── 2. plant 3 proper seeds (visible ~170px doodles, foreign sessions) ───────
const seedDoodles = [
  {
    session: 'maria_doodles', name: 'Morning Mug', why: 'first sip, best sip', x: 220, y: 540,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="170" height="170" viewBox="0 0 170 170"><g fill="none" stroke="var(--dir-text-primary)" stroke-width="2" stroke-linecap="round"><path d="M45 60 Q42 120 55 130 Q85 140 110 130 Q120 120 118 62 Q85 52 45 60 Z"/><path d="M118 75 Q145 72 145 95 Q145 115 116 112"/><path d="M62 45 Q60 30 72 25 M85 42 Q86 26 97 22"/></g></svg>`,
  },
  {
    session: 'jun_runs_late', name: 'Lucky Star', why: 'found it on a receipt', x: 1050, y: 560,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="170" height="170" viewBox="0 0 170 170"><g fill="none" stroke="var(--dir-text-primary)" stroke-width="2" stroke-linecap="round"><path d="M85 22 L103 65 L150 68 L114 98 L126 145 L85 119 L44 145 L56 98 L20 68 L67 65 Z"/><path d="M80 30 L96 64"/></g></svg>`,
  },
  {
    session: 'anon_visitor_7', name: 'Paper Boat', why: 'for someone far away', x: 640, y: 120,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="170" height="170" viewBox="0 0 170 170"><g fill="none" stroke="var(--dir-text-primary)" stroke-width="2" stroke-linecap="round"><path d="M25 105 L145 105 L120 135 L50 135 Z"/><path d="M85 105 L85 45 Q110 60 85 75 M85 45 Q60 62 85 78"/><path d="M18 150 Q45 142 85 150 Q125 158 152 150"/></g></svg>`,
  },
];
for (const s of seedDoodles) {
  const res = await c.rpc('publish_to_open_desk', {
    p_session_id: s.session,
    p_svg: s.svg,
    p_content_hash: 'seed-' + s.name.toLowerCase().replace(/\s/g, '-'),
    p_x: s.x, p_y: s.y, p_rot: 0,
    p_name: s.name, p_why: s.why,
  });
  console.log('seed  ', s.name.padEnd(12), '→', res.error ? 'ERR ' + res.error.message : 'ok');
}

// ── 3. nudge Sebs's two overlapping pairs apart ──────────────────────────────
const { data: after } = await c
  .from('doodles')
  .select('id,session_id,x,y')
  .eq('desk_id', deskId);
const mine = after.filter((r) => r.session_id.startsWith('52281805'));
const MIN = 210;
for (let pass = 0; pass < 30; pass++) {
  let moved = false;
  for (let i = 0; i < mine.length; i++)
    for (let j = i + 1; j < mine.length; j++) {
      const a = mine[i], b = mine[j];
      let dx = b.x - a.x, dy = b.y - a.y;
      let d = Math.hypot(dx, dy);
      if (d < MIN) {
        if (d < 1) { dx = 1; dy = 1; d = Math.SQRT2; }
        const push = ((MIN - d) / 2 / d) * 1.05;
        a.x -= dx * push; a.y -= dy * push;
        b.x += dx * push; b.y += dy * push;
        moved = true;
      }
    }
  if (!moved) break;
}
for (const m of mine) {
  m.x = Math.max(70, Math.min(1170, m.x));
  m.y = Math.max(70, Math.min(660, m.y));
  const res = await c.rpc('move_my_doodle', { p_id: m.id, p_session: m.session_id, p_x: Math.round(m.x * 100) / 100, p_y: Math.round(m.y * 100) / 100, p_rotation: null });
  if (res.error) console.log('move ERR', m.id.slice(0, 8), res.error.message);
}
const { data: final } = await c.from('doodles').select('id').eq('desk_id', deskId);
console.log(`\nDONE — deleted ${deleted}, planted ${seedDoodles.length}, desk now ${final.length} doodles.`);
