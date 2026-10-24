(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.LookUpRoutes=factory();
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  // Straight-line distance in miles between two {lat,lng} points.
  function miles(a,b){
    const r=Math.PI/180,dl=(b.lat-a.lat)*r,dn=(b.lng-a.lng)*r;
    const x=Math.sin(dl/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dn/2)**2;
    return 3958.8*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
  }
  // Rough walking time: city blocks add about a quarter to the straight line, at 3 mph.
  function walkMinutes(straightMiles){return Math.max(1,Math.round(straightMiles*1.25/3*60))}
  function distanceText(straightMiles){
    if(straightMiles<0.1)return `${Math.max(10,Math.round(straightMiles*5280/10)*10)} ft away`;
    return `${straightMiles.toFixed(1)} mi away`;
  }

  const LENGTHS={any:()=>true,short:m=>m<1,medium:m=>m>=1&&m<=2,long:m=>m>2};
  const TIMES={any:()=>true,quick:m=>m<45,hour:m=>m>=45&&m<=75,long:m=>m>75};

  // filters: {length, time, region, theme, sort}; origin: {lat,lng} or null; byId: id => place
  function filterRoutes(routes,filters,byId,origin){
    const f={length:'any',time:'any',region:'All',theme:'All',sort:'recommended',...filters};
    const startDistance=r=>origin?miles(origin,byId(r.stops[0])):null;
    const list=routes.filter(r=>(LENGTHS[f.length]||LENGTHS.any)(Number(r.miles))
      &&(TIMES[f.time]||TIMES.any)(r.minutes)
      &&(f.region==='All'||(r.region||[]).includes(f.region))
      &&(f.theme==='All'||r.tags.includes(f.theme)));
    const sorters={
      nearest:(a,b)=>origin?startDistance(a)-startDistance(b):0,
      shortest:(a,b)=>Number(a.miles)-Number(b.miles),
      longest:(a,b)=>Number(b.miles)-Number(a.miles)
    };
    if(sorters[f.sort])list.sort(sorters[f.sort]);
    return list;
  }

  // How a stop is named for Google Maps: building name plus street address, so the
  // directions list shows "Puck Building" instead of a dropped pin.
  // "488–492 Broadway" becomes "488 Broadway"; addresses like "X at Y" use the name alone.
  function mapsPlace(p){
    const street=p.address.replace(/^(\d+)[–-]\d+/,'$1');
    return / at /.test(street)?`${p.name}, New York, NY`:`${p.name}, ${street}, New York, NY`;
  }
  function dirLink(points){
    const params=new URLSearchParams({api:'1',origin:points[0],destination:points[points.length-1],travelmode:'walking'});
    if(points.length>2)params.set('waypoints',points.slice(1,-1).join('|'));
    return 'https://www.google.com/maps/dir/?'+params.toString();
  }
  // Google Maps walking directions through every stop, in order.
  // Google's phone apps allow at most 3 stops between start and end, so longer routes
  // are split into even parts that share a stop: 6 stops become 1–4 and 4–6.
  function mapsLinks(route,byId){
    const names=route.stops.map(id=>mapsPlace(byId(id))),legs=names.length-1,parts=Math.max(1,Math.ceil(legs/4)),out=[];
    let start=0;
    for(let k=0;k<parts;k++){const end=start+Math.ceil((legs-start)/(parts-k));out.push({url:dirLink(names.slice(start,end+1)),from:start+1,to:end+1});start=end}
    return out;
  }
  // Walking directions from a {lat,lng} point to the route's first stop.
  function mapsToStart(route,byId,origin){return dirLink([`${origin.lat},${origin.lng}`,mapsPlace(byId(route.stops[0]))])}

  return {miles,walkMinutes,distanceText,filterRoutes,mapsPlace,mapsLinks,mapsToStart};
});
