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
test('nearest sort uses distance to the first stop',()=>{const origin={lat:40.7243,lng:-73.9954};const list=R.filterRoutes(routes,{sort:'nearest'},byId,origin);assert.equal(list[0].stops[0],'haughwout')});
test('shortest and longest sorts',()=>{assert.equal(R.filterRoutes(routes,{sort:'shortest'},byId,null)[0].id,'castiron');assert.equal(R.filterRoutes(routes,{sort:'longest'},byId,null)[0].id,'fifth')});
test('distance text and walk time',()=>{assert.equal(R.distanceText(0.05),'260 ft away');assert.equal(R.distanceText(1.234),'1.2 mi away');assert.equal(R.walkMinutes(1),25)});
test('maps link walks through every stop in order',()=>{const r=routes.find(r=>r.id==='fifth'),u=new URL(R.mapsLink(r,byId));const pt=id=>R.mapsPlace(byId(id));assert.equal(u.searchParams.get('travelmode'),'walking');assert.equal(u.searchParams.get('origin'),pt('plaza'));assert.equal(u.searchParams.get('destination'),pt('washington'));assert.equal(u.searchParams.get('waypoints'),[pt('nypl'),pt('flatiron')].join('|'))});
test('maps link from my location adds every stop as a waypoint',()=>{const r=routes.find(r=>r.id==='castiron'),u=new URL(R.mapsLink(r,byId,{lat:40.73,lng:-73.99}));assert.equal(u.searchParams.get('origin'),'40.73,-73.99');assert.equal(u.searchParams.get('waypoints'),'Haughwout Building, 488 Broadway, New York, NY')});
test('map place names are clean',()=>{assert.equal(R.mapsPlace(byId('puck')),'Puck Building, 295 Lafayette Street, New York, NY');assert.equal(R.mapsPlace(byId('washington')),'Washington Square Arch, New York, NY')});
