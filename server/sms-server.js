// LookUp NYC text-message server.
// The website is static (GitHub Pages), so it cannot hold the Vonage secret.
// This small server holds it and sends one route per request through the Vonage SMS API.
//
//   POST /api/send-route   {"phone":"(212) 555-0123","routeId":"fifth"}
//   GET  /health
//
// No npm packages needed: Node 18+ has fetch built in.
'use strict';
const http = require('http');
const { loadData, normalizePhone, routeMessage } = require('./message.js');

const env = process.env;
const PORT = Number(env.PORT) || 8787;
const SITE_URL = env.SITE_URL || 'https://aegisherit.github.io/LookUp-NYC/';
const DRY_RUN = env.DRY_RUN === '1';
const ALLOWED = (env.ALLOWED_ORIGINS || 'https://aegisherit.github.io')
  .split(',').map(s => s.trim()).filter(Boolean);
const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

if (!DRY_RUN && !(env.VONAGE_API_KEY && env.VONAGE_API_SECRET && env.VONAGE_FROM)) {
  console.error('Set VONAGE_API_KEY, VONAGE_API_SECRET and VONAGE_FROM (or DRY_RUN=1 to test without sending).');
  process.exit(1);
}

const { places, walks } = loadData();

// Simple in-memory limits so the endpoint can't be used to spam someone.
const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now();
  const list = (hits.get(key) || []).filter(t => now - t < windowMs);
  if (list.length >= max) { hits.set(key, list); return true; }
  list.push(now); hits.set(key, list); return false;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (v.every(t => now - t > 3600e3)) hits.delete(k); }, 600e3).unref();

async function sendSms(to, text) {
  if (DRY_RUN) { console.log(`[dry run] to ${to}:\n${text}\n`); return { id: 'dry-run' }; }
  const res = await fetch('https://rest.nexmo.com/sms/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: env.VONAGE_API_KEY, api_secret: env.VONAGE_API_SECRET, from: env.VONAGE_FROM, to, text })
  });
  const data = await res.json().catch(() => ({}));
  const failed = (data.messages || []).find(m => m.status !== '0');
  if (!res.ok || !data.messages || failed) {
    const err = new Error((failed && failed['error-text']) || `Vonage responded ${res.status}`);
    err.vonageStatus = failed && failed.status;
    throw err;
  }
  return { id: data.messages[0]['message-id'], parts: data['message-count'] };
}

function reply(res, status, body, origin) {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin' };
  if (origin) Object.assign(headers, {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '600'
  });
  res.writeHead(status, headers);
  res.end(status === 204 ? undefined : JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0, body = '';
    req.on('data', chunk => { size += chunk.length; if (size > 2048) { reject(new Error('too large')); req.destroy(); } else body += chunk; });
    req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('bad json')); } });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const reqOrigin = req.headers.origin;
  const origin = reqOrigin && (ALLOWED.includes(reqOrigin) || LOCAL.test(reqOrigin)) ? reqOrigin : null;
  const url = new URL(req.url, 'http://x');

  if (url.pathname === '/health') return reply(res, 200, { ok: true, dryRun: DRY_RUN }, origin);
  if (url.pathname !== '/api/send-route') return reply(res, 404, { error: 'Not found.' }, origin);
  if (req.method === 'OPTIONS') return reply(res, origin ? 204 : 403, {}, origin);
  if (req.method !== 'POST') return reply(res, 405, { error: 'Use POST.' }, origin);
  if (reqOrigin && !origin) return reply(res, 403, { error: 'This site is not allowed to send texts.' }, null);

  let body;
  try { body = await readJson(req); } catch { return reply(res, 400, { error: 'Something went wrong with that request.' }, origin); }

  const walk = walks.find(w => w.id === body.routeId);
  if (!walk) return reply(res, 400, { error: 'We couldn’t find that route.' }, origin);
  const to = normalizePhone(body.phone);
  if (!to) return reply(res, 400, { error: 'Enter a 10-digit US number, or a number starting with + and a country code.' }, origin);

  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (limited('ip:' + ip, 5, 10 * 60e3) || limited('to:' + to, 3, 60 * 60e3))
    return reply(res, 429, { error: 'That’s a lot of texts. Please wait a little and try again.' }, origin);

  try {
    const sent = await sendSms(to, routeMessage(walk, places, SITE_URL));
    console.log(`Sent ${walk.id} to ***${to.slice(-4)} (${sent.id})`);
    return reply(res, 200, { ok: true, last4: to.slice(-4) }, origin);
  } catch (err) {
    console.error(`Vonage error for ***${to.slice(-4)}:`, err.vonageStatus || '', err.message);
    const msg = err.vonageStatus === '29'
      ? 'This number isn’t on the Vonage trial’s test list yet. Add it in the Vonage dashboard first.'
      : 'The text couldn’t be sent right now. Please try again in a moment.';
    return reply(res, 502, { error: msg }, origin);
  }
});

server.listen(PORT, () => console.log(`LookUp NYC SMS server on :${PORT}${DRY_RUN ? ' (dry run: texts are printed, not sent)' : ''}`));
