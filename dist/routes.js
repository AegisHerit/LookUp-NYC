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
  // Google Maps walking directions through every stop, in order, as one link.
  function mapsLinks(route,byId){
    return [{url:dirLink(route.stops.map(id=>mapsPlace(byId(id)))),from:1,to:route.stops.length}];
  }
  // Walking directions from a {lat,lng} point to the route's first stop.
  function mapsToStart(route,byId,origin){return dirLink([`${origin.lat},${origin.lng}`,mapsPlace(byId(route.stops[0]))])}

  // Step estimates. An average walking stride is about 2.5 feet, so a mile is about 2,100 steps.
  // A route's total uses its published distance; each leg gets a share based on how far apart its stops are.
  const STRIDE_FT=2.5,STEPS_PER_MIN=105;
  function routeSteps(route,byId){
    const pts=route.stops.map(byId),straight=pts.map((p,i)=>i?miles(pts[i-1],p):0),sum=straight.reduce((a,b)=>a+b,0)||1;
    const total=Math.round(Number(route.miles)*5280/STRIDE_FT/50)*50;
    const legs=straight.map(d=>Math.round(total*d/sum/10)*10);
    return {total,legs,legMinutes:legs.map(n=>n?Math.max(1,Math.round(n/STEPS_PER_MIN)):0),strideFt:STRIDE_FT};
  }

  return {miles,walkMinutes,routeSteps,distanceText,filterRoutes,mapsPlace,mapsLinks,mapsToStart};
});
