// Builds the text message for a route and checks phone numbers.
// Kept separate from the server so it can be tested without sending anything.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load the same landmark and walk data the website uses.
function loadData(dir = path.join(__dirname, '..', 'dist')) {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(dir, 'data.js'), 'utf8') + ';this.PLACES=PLACES;this.WALKS=WALKS', ctx);
  return { places: ctx.PLACES, walks: ctx.WALKS };
}

// Curly quotes, dashes and arrows push a text into Unicode mode, which cuts each
// SMS part from 160 to 70 characters. Swap them for plain equivalents.
function plain(text) {
  return String(text)
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-').replace(/→/g, 'to').replace(/…/g, '...')
    .normalize('NFKD').replace(/[^\x20-\x7E\n]/g, '');
}

// Accepts "(212) 555-0123", "212-555-0123", "1 212 555 0123" or "+1 212 555 0123".
// Returns digits only with the country code, the way Vonage expects, or null.
// Only US/Canada numbers by default: open SMS endpoints get abused to text premium
// international numbers ("SMS pumping"). Pass allowInternational to accept "+44 ..." etc.
function normalizePhone(input, { allowInternational = false } = {}) {
  const raw = String(input || '').trim();
  if (!raw || raw.length > 25 || /[^\d\s().+-]/.test(raw)) return null;
  const digits = raw.replace(/\D/g, '');
  let n = null;
  if (digits.length === 10) n = '1' + digits;
  else if (digits.length === 11 && digits.startsWith('1')) n = digits;
  else if (raw.startsWith('+') && allowInternational && digits.length >= 8 && digits.length <= 15 && !digits.startsWith('1')) return digits;
  if (!n || !/^1[2-9]\d{2}[2-9]\d{6}$/.test(n)) return null;
  if (/^1(900|976)/.test(n) || /^1[2-9]11/.test(n)) return null; // premium-rate and service codes
  return n;
}

function routeMessage(walk, places, siteUrl) {
  const byId = id => places.find(p => p.id === id);
  const lines = [
    `LookUp NYC: ${walk.title}`,
    `~${walk.minutes} min, ${walk.miles} mi, ${walk.stops.length} stops`,
    ...walk.stops.map((id, i) => `${i + 1}. ${byId(id).name}`)
  ];
  // One short link: the route page has the map, walking directions, stories and audio.
  // (A full Google Maps link with every stop is 400+ characters and makes the text cost 5-6 parts.)
  if (siteUrl) lines.push(`Map, directions & stories: ${siteUrl.replace(/#.*$/, '')}#route/${walk.id}`);
  return plain(lines.join('\n'));
}

// The caller's IP for rate limits. Behind a host's proxy (Render, Railway, Fly) set trustProxy:
// the proxy appends the real address as the LAST X-Forwarded-For entry, while earlier entries
// can be anything the caller sent. Without a proxy, use the connection's own address.
function clientIp(req, trustProxy) {
  if (trustProxy) {
    const list = String(req.headers['x-forwarded-for'] || '').split(',').map(s => s.trim()).filter(Boolean);
    if (list.length) return list[list.length - 1];
  }
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

// Counts recent hits per key; returns true once a key is over its limit.
function createLimiter(now = () => Date.now()) {
  const hits = new Map();
  const limited = (key, max, windowMs) => {
    const t = now(), list = (hits.get(key) || []).filter(x => t - x < windowMs);
    if (list.length >= max) { hits.set(key, list); return true; }
    list.push(t); hits.set(key, list); return false;
  };
  limited.prune = () => { const t = now(); for (const [k, v] of hits) if (v.every(x => t - x > 24 * 3600e3)) hits.delete(k); };
  return limited;
}

module.exports = { loadData, plain, normalizePhone, routeMessage, clientIp, createLimiter };
