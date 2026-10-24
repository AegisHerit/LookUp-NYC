// Builds the text message for a route and checks phone numbers.
// Kept separate from the server so it can be tested without sending anything.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const R = require('../dist/routes.js');

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

// Accepts "(212) 555-0123", "212-555-0123", "1 212 555 0123" (US) or "+44 20 7946 0958".
// Returns digits only with the country code, the way Vonage expects, or null.
function normalizePhone(input) {
  const raw = String(input || '').trim();
  if (!raw || raw.length > 25 || /[^\d\s().+-]/.test(raw)) return null;
  const digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+')) return digits.length >= 8 && digits.length <= 15 ? digits : null;
  if (digits.length === 10 && /^[2-9]\d{2}[2-9]/.test(digits)) return '1' + digits;
  if (digits.length === 11 && digits.startsWith('1') && /^1[2-9]\d{2}[2-9]/.test(digits)) return digits;
  return null;
}

function routeMessage(walk, places, siteUrl) {
  const byId = id => places.find(p => p.id === id);
  const lines = [
    `LookUp NYC: ${walk.title}`,
    `~${walk.minutes} min, ${walk.miles} mi, ${walk.stops.length} stops`,
    ...walk.stops.map((id, i) => `${i + 1}. ${byId(id).name}`),
    ''
  ];
  const links = R.mapsLinks(walk, byId);
  links.forEach(l => lines.push(links.length > 1 ? `Directions, stops ${l.from}-${l.to}: ${l.url}` : `Walking directions: ${l.url}`));
  if (siteUrl) lines.push('', `Stories for each stop: ${siteUrl.replace(/#.*$/, '')}#route/${walk.id}`);
  return plain(lines.join('\n'));
}

module.exports = { loadData, plain, normalizePhone, routeMessage };
