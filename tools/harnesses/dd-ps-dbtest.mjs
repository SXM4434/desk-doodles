import puppeteer from '/Users/sebs/Desktop/Projects/desk-doodles/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SUPA = 'https://revoukwqlisqdjteortc.supabase.co';
const KEY = 'sb_publishable_3YwGoTCMKQZFZhgKdvwu3w_GXfX3m80';
// Isolated throwaway identity → all writes are owner-scoped to this id, in
// negative (private) desk-index space, invisible on the public wall.
const SESSION = 'test-ps-' + Math.random().toString(36).slice(2, 10);

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new', args: ['--no-sandbox'],
  defaultViewport: { width: 1200, height: 800 },
});
const page = await browser.newPage();
// Load the app origin so Supabase CORS allows the fetches.
await page.goto('http://localhost:5182/', { waitUntil: 'domcontentloaded', timeout: 30000 });

const results = await page.evaluate(async (SUPA, KEY, SESSION) => {
  const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
  const out = [];
  const rpc = async (fn, body) => {
    const r = await fetch(`${SUPA}/rest/v1/rpc/${fn}`, { method: 'POST', headers: H, body: JSON.stringify(body) });
    let data = null; try { data = await r.json(); } catch { data = await r.text().catch(() => null); }
    return { status: r.status, ok: r.ok, data };
  };
  const sel = async (table, qs) => {
    const r = await fetch(`${SUPA}/rest/v1/${table}?${qs}`, { headers: H });
    let data = null; try { data = await r.json(); } catch { data = null; }
    return { status: r.status, ok: r.ok, data };
  };
  const note = (step, res, extra) => out.push({ step, status: res.status, ok: res.ok, ...(extra || {}), data: res.data });

  // 1) claim_handle
  const handle = 'doodled-test-' + Math.random().toString(36).slice(2, 6);
  const claim = await rpc('claim_handle', { p_id: SESSION, p_handle: handle, p_source: 'custom' });
  note('claim_handle', claim, { handle, claimed: claim.data === true });

  // 2) create_private_desk
  const desk = await rpc('create_private_desk', { p_session: SESSION, p_name: 'PS Test Desk' });
  const deskId = desk.data && desk.data.id ? desk.data.id : (Array.isArray(desk.data) && desk.data[0] && desk.data[0].id) || null;
  const deskIndex = desk.data && desk.data.desk_index !== undefined ? desk.data.desk_index : (Array.isArray(desk.data) && desk.data[0] && desk.data[0].desk_index);
  note('create_private_desk', desk, { deskId, deskIndex });

  // 3) list my desks
  const myDesks = await sel('desks', `owner_id=eq.${SESSION}&select=id,name,desk_index,owner_id`);
  note('listMyDesks', myDesks, { count: Array.isArray(myDesks.data) ? myDesks.data.length : null });

  // 4) stash_to_drawer
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>';
  const stash = await rpc('stash_to_drawer', {
    p_session: SESSION, p_svg: svg, p_content_hash: 'hash-' + Math.random().toString(36).slice(2),
    p_name: 'drawer test', p_why: null, p_render_config: null,
  });
  const drawerId = stash.data && stash.data.id ? stash.data.id : (Array.isArray(stash.data) && stash.data[0] && stash.data[0].id) || null;
  note('stash_to_drawer', stash, { drawerId });

  // 5) list my drawer (owner + desk_id null)
  const drawer = await sel('doodles', `owner_id=eq.${SESSION}&desk_id=is.null&select=id,name,is_public,desk_id`);
  note('listMyDrawer', drawer, { count: Array.isArray(drawer.data) ? drawer.data.length : null });

  // 6) share_to_shelf
  if (drawerId) {
    const share = await rpc('share_to_shelf', { p_id: drawerId, p_session: SESSION });
    note('share_to_shelf', share, { shared: share.data === true });
  } else {
    out.push({ step: 'share_to_shelf', skipped: 'no drawerId' });
  }

  // 7) list my shelf (owner + is_public true)
  const shelf = await sel('doodles', `owner_id=eq.${SESSION}&is_public=is.true&select=id,is_public`);
  note('listMyShelf', shelf, { count: Array.isArray(shelf.data) ? shelf.data.length : null });

  // 8) publish_to_private_desk
  if (deskId) {
    const pub = await rpc('publish_to_private_desk', {
      p_session: SESSION, p_desk_id: deskId, p_svg: svg,
      p_content_hash: 'hash2-' + Math.random().toString(36).slice(2),
      p_name: 'on private desk', p_why: null, p_render_config: null, p_x: 0, p_y: 0, p_rot: 0,
    });
    note('publish_to_private_desk', pub, { onDeskId: pub.data && (pub.data.id || (Array.isArray(pub.data) && pub.data[0] && pub.data[0].id)) });
    // 9) confirm it's on the private desk
    const onDesk = await sel('doodles', `desk_id=eq.${deskId}&select=id,desk_id,owner_id`);
    note('doodles_on_private_desk', onDesk, { count: Array.isArray(onDesk.data) ? onDesk.data.length : null });
  }

  // 10) NEGATIVE: the private desk must NOT show on the public gallery (owner_id null)
  const pubDesks = await sel('desks', `owner_id=is.null&select=id,desk_index&limit=3`);
  note('public_desks_sample', pubDesks, { count: Array.isArray(pubDesks.data) ? pubDesks.data.length : null });

  return out;
}, SUPA, KEY, SESSION);

console.log('TEST SESSION:', SESSION);
for (const r of results) {
  const head = `${r.step.padEnd(26)} status=${r.status ?? '-'} ok=${r.ok ?? '-'}`;
  const extra = Object.entries(r).filter(([k]) => !['step','status','ok','data'].includes(k)).map(([k,v]) => `${k}=${JSON.stringify(v)}`).join(' ');
  console.log(head, extra);
  if (r.ok === false || r.skipped) console.log('   ↳ data:', JSON.stringify(r.data).slice(0, 240));
}
await browser.close();
