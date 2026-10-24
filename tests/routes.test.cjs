const {test}=require('node:test');
const assert=require('node:assert/strict');
const R=require('../dist/routes.js');
const fs=require('fs'),vm=require('vm');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/../dist/data.js','utf8')+';this.PLACES=PLACES;this.WALKS=WALKS',ctx);
const places=ctx.PLACES,routes=ctx.WALKS;
const byId=id=>places.find(p=>p.id===id);

test('every route has a leg for each stop and known places',()=>{for(const r of routes){assert.equal(r.legs.length,r.stops.length,r.id);r.stops.forEach(id=>assert.ok(byId(id),id));assert.ok(r.region&&r.region.length,r.id)}});
test('filters by length, time, area and theme',()=>{
 const ids=f=>Array.from(R.filterRoutes(routes,f,byId,null),r=>r.id);
 assert.deepEqual(ids({length:'short'}),['castiron']);
 assert.ok(ids({length:'long'}).includes('fifth'));
 assert.ok(ids({time:'quick'}).every(id=>routes.find(r=>r.id===id).minutes<45));
 assert.ok(ids({region:'Midtown'}).includes('fifth')&&!ids({region:'Midtown'}).includes('castiron'));
 assert.ok(ids({theme:'Hidden gems'}).every(id=>routes.find(r=>r.id===id).tags.includes('Hidden gems')));
 assert.equal(ids({}).length,routes.length);
});
test('nearest sort uses distance to the first stop',()=>{const origin={lat:40.7215,lng:-73.9995};const d=r=>R.miles(origin,byId(r.stops[0]));const list=R.filterRoutes(routes,{sort:'nearest'},byId,origin);for(let i=1;i<list.length;i++)assert.ok(d(list[i-1])<=d(list[i]));assert.equal(list[0].stops[0],'haughwout')});
test('shortest and longest sorts',()=>{assert.equal(R.filterRoutes(routes,{sort:'shortest'},byId,null)[0].id,'castiron');assert.equal(R.filterRoutes(routes,{sort:'longest'},byId,null)[0].id,'fifth')});
test('distance text and walk time',()=>{assert.equal(R.distanceText(0.05),'260 ft away');assert.equal(R.distanceText(1.234),'1.2 mi away');assert.equal(R.walkMinutes(1),25)});
test('maps link walks through every stop in order',()=>{const r=routes.find(r=>r.id==='fifth'),l=R.mapsLinks(r,byId);assert.equal(l.length,1);const u=new URL(l[0].url),pt=id=>R.mapsPlace(byId(id));assert.equal(u.searchParams.get('travelmode'),'walking');assert.equal(u.searchParams.get('origin'),pt('plaza'));assert.equal(u.searchParams.get('destination'),pt('washington'));assert.equal(u.searchParams.get('waypoints'),[pt('nypl'),pt('flatiron')].join('|'))});
test('every route opens as one Google Maps link through all its stops',()=>{for(const r of routes){const l=R.mapsLinks(r,byId);assert.equal(l.length,1);const u=new URL(l[0].url),w=u.searchParams.get('waypoints');assert.equal(u.searchParams.get('origin'),R.mapsPlace(byId(r.stops[0])));assert.equal(u.searchParams.get('destination'),R.mapsPlace(byId(r.stops.at(-1))));assert.equal(w?w.split('|').length:0,r.stops.length-2,r.id)}});
test('directions to the start go from your location to the first stop',()=>{const u=new URL(R.mapsToStart(routes.find(r=>r.id==='castiron'),byId,{lat:40.73,lng:-73.99}));assert.equal(u.searchParams.get('origin'),'40.73,-73.99');assert.equal(u.searchParams.get('destination'),R.mapsPlace(byId('haughwout')));assert.equal(u.searchParams.get('waypoints'),null)});
test('map place names are clean',()=>{assert.equal(R.mapsPlace(byId('puck')),'Puck Building, 295 Lafayette Street, New York, NY');assert.equal(R.mapsPlace(byId('washington')),'Washington Square Arch, New York, NY')});
