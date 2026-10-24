const PLACES = [
  {
    id:'flatiron', name:'Flatiron Building', neighborhood:'Flatiron', address:'175 Fifth Avenue', year:'1902', style:'A skyscraper shaped by its street', lat:40.74106, lng:-73.98970, tags:['Film & TV','Architecture'], time:8,
    teaser:'A slice of New York. A superhero’s day job.', hook:'You know the silhouette. Here’s the story.',
    story:'That impossibly narrow point is the result of Broadway cutting across Fifth Avenue. Daniel Burnham’s building fits its triangular plot like a ship’s bow. When it opened in 1902, its unusual shape drew plenty of skepticism. Today, it is one of the city’s most recognizable faces.',
    looks:['Stand in the pedestrian area north of 23rd Street to see the narrow tip.','Follow the rows of windows around the corner: the building suddenly seems much wider.','Look for the richly decorated top above the long, repeating middle.'],
    culture:[{type:'On screen · exterior',title:'Spider-Man (2002)',text:'Peter Parker’s workplace has a real New York address: the Flatiron’s exterior stands in for the fictional Daily Bugle. You’re looking at a movie newspaper office, not the home of an actual Daily Bugle.'}],
    tip:'Enjoy this stop from the public sidewalk or pedestrian plaza. Interior access is not part of the walk.',
    sources:[['Flatiron NoMad · building history','https://flatironnomad.nyc/history/the-flatiron-building/'],['Flatiron NoMad · film connections','https://flatironnomad.nyc/history/film-television-in-the-district/']]
  },
  {
    id:'nypl', name:'New York Public Library', neighborhood:'Midtown', address:'476 Fifth Avenue', year:'1911', style:'A palace for public knowledge', lat:40.75318,lng:-73.98225,tags:['Film & TV','Books','Architecture'],time:12,
    teaser:'Two stone lions. Millions of stories. A familiar ghost.',hook:'The grandest invitation to pick up a book.',
    story:'The Stephen A. Schwarzman Building turns a public library into a civic palace. Its broad steps, enormous windows, and marble entrance make reading feel like an occasion. You can enjoy the building’s exterior on a quick walk, or check the library’s visitor information to explore inside.',
    looks:['Meet the two stone lions on either side of the Fifth Avenue steps.','Notice how the three tall entrance arches make a busy street feel ceremonial.','Step back on the sidewalk and follow the building’s long, balanced façade.'],
    culture:[{type:'On screen · filming location',title:'Ghostbusters (1984)',text:'The library appears in the film’s opening encounter with a ghost. Recognize the exterior, but remember that a movie’s interiors and exteriors can come from different places.'},{type:'On screen · filming location',title:'Breakfast at Tiffany’s (1961)',text:'Holly and Paul’s day in the city includes a visit to this library. It is one of several real New York places woven into the film.'}],
    tip:'The exterior is an easy walking stop. Reading-room access and tours have their own rules; check the library before planning an indoor visit.',
    sources:[['NYPL · visiting the Schwarzman Building','https://www.nypl.org/locations/schwarzman'],['NYPL · movies filmed at the library','https://www.nypl.org/press/popular-movies-filmed-new-york-public-library']]
  },
  {
    id:'grandcentral',name:'Grand Central Terminal',neighborhood:'Midtown',address:'89 East 42nd Street',year:'1913',style:'A station with a sky of its own',lat:40.75273,lng:-73.97723,tags:['Architecture','Hidden gems'],time:15,
    teaser:'A little wonder, even when you’re running for a train.',hook:'Give your commute a five-minute detour.',
    story:'Grand Central was built to make arriving in New York feel extraordinary. Above the busy Main Concourse, a turquoise ceiling opens onto a painted sky. The information-booth clock offers a meeting point below it. Even a familiar commute can become a small architectural adventure if you pause and look up.',
    looks:['From a clear spot in the Main Concourse, look up at the painted constellations.','Find the four-faced clock above the information booth.','By the Oyster Bar on the lower level, the vaulted Whispering Gallery carries sound between opposite corners. Try it with a friend without blocking the passage.'],
    culture:[{type:'City life · a small ritual',title:'Meet me under the clock',text:'A train terminal can also be a shared living room. Watch the arrivals, reunions, and commuters circling its central information booth.'}],
    tip:'This is a working terminal. Keep paths clear and follow posted access information. Indoor stops depend on current access.',
    sources:[['Grand Central Terminal · what to see','https://m.grandcentralterminal.com/what-to-see/'],['Grand Central Terminal · history','https://m.grandcentralterminal.com/history/']]
  },
  {
    id:'plaza',name:'The Plaza',neighborhood:'Central Park South',address:'768 Fifth Avenue',year:'1907',style:'A hotel with a storybook life',lat:40.76450,lng:-73.97436,tags:['Film & TV','Books','Architecture'],time:8,
    teaser:'Kevin’s New York adventure. Eloise’s entire world.',hook:'Some of its most famous guests are fictional.',
    story:'At the corner of Fifth Avenue and Central Park South, the Plaza’s pale façade and steep roof turn a hotel into a landmark. Its reputation lives as much in stories as in its guest rooms: for generations of readers and moviegoers, this is where a New York adventure begins.',
    looks:['View the steep roof and ornate upper floors from the public space across Fifth Avenue.','Compare the grand hotel entrance with the park directly across the street.','Notice how the building’s corner anchors the meeting of avenue and park.'],
    culture:[{type:'On the page · fictional setting',title:'Eloise',text:'Kay Thompson’s mischievous six-year-old, illustrated by Hilary Knight, makes the Plaza her home. The hotel is the setting of her fictional adventures.'},{type:'On screen · filming location',title:'Home Alone 2 (1992)',text:'Kevin McCallister checks in to the Plaza in the film. The hotel’s own history records filming in its 59th Street lobby.'}],
    tip:'This stop works from public outdoor space. Hotel interiors, dining, and experiences may require reservations or have access restrictions.',
    sources:[['The Plaza · faces, films, and moments','https://www.theplazany.com/history/faces-films-moments/'],['The Plaza · historical timeline','https://www.theplazany.com/history/timeline-history-of-the-plaza-hotel/']]
  },
  {
    id:'jefferson',name:'Jefferson Market Library',neighborhood:'Greenwich Village',address:'425 Sixth Avenue',year:'1877',style:'A courthouse with a second chapter',lat:40.73469,lng:-73.99958,tags:['Books','Hidden gems','Architecture'],time:10,
    teaser:'It looks like a castle. It used to be a courthouse.',hook:'A neighborhood helped this building begin again.',
    story:'The clock tower and red brick might suggest a storybook castle. This was actually a courthouse, completed in 1877. When the building faced an uncertain future, neighbors campaigned to save it. It reopened as a library in 1967, giving rooms once used for trials a new life filled with books.',
    looks:['Pick out the clock high in the tower.','Look for pointed arches and the contrasting colors of brick and stone.','Walk around the corner to see how the building fits its irregular site.'],
    culture:[{type:'Neighborhood story · a new life',title:'From courtroom to reading room',text:'Its change of use is part of a larger Village story: residents deciding that a familiar building deserved another chapter. The building’s form survived while its public purpose changed.'}],
    tip:'Enjoy the exterior from Sixth Avenue and West 10th Street. Check branch hours before planning to enter.',
    sources:[['NYPL · Jefferson Market history','https://www.nypl.org/about/locations/jefferson-market'],['NYPL · branch and visitor information','https://www.nypl.org/locations/jefferson-market']]
  },
  {
    id:'washington',name:'Washington Square Arch',neighborhood:'Greenwich Village',address:'Washington Square North at Fifth Avenue',year:'1890s',style:'A gateway to the Village',lat:40.73123,lng:-73.99708,tags:['Books','Hidden gems','Architecture'],time:10,
    teaser:'A marble arch, a literary neighborhood, a place to linger.',hook:'The city’s grandest doorway has no door.',
    story:'Stanford White’s temporary arch for the 1889 centennial of Washington’s inauguration was so popular that a permanent marble version followed. Today it frames Fifth Avenue on one side and the life of the park on the other. Its surroundings have welcomed writers, performers, protests, and everyday pauses.',
    looks:['Stand south of the arch and use it to frame Fifth Avenue.','Compare the two sculptures of Washington on its north-facing side.','Turn toward the row houses along Washington Square North to see a very different scale of city.'],
    culture:[{type:'On the page · neighborhood setting',title:'Washington Square · Henry James',text:'James’s novel is connected to the neighborhood around the square. He visited his grandmother’s home on Washington Square North as a child. The literary connection is to the neighborhood, rather than the later arch.'}],
    tip:'An outdoor stop with room to pause in the park. Follow posted park rules and keep paths open.',
    sources:[['Washington Square Park Conservancy · history','https://www.washingtonsqpark.org/history'],['NYC Parks · Washington Square Arch','https://nycgovparks.org/parks/washington-square-park/monuments/1657']]
  },
  {
    id:'haughwout',name:'Haughwout Building',neighborhood:'SoHo',address:'488–492 Broadway',year:'1857',style:'An elegant storefront made of iron',lat:40.72249,lng:-73.99966,tags:['Hidden gems','Architecture'],time:8,
    teaser:'Luxury shopping helped give the elevator a lift.',hook:'Look past the shop windows. Then look up.',
    story:'This Broadway corner was built for a luxury store selling china, glass, and silver. Its repeated arches and columns were made with cast iron, giving a commercial building the elegance of a grand palace. In 1857, it also introduced customers to an early passenger elevator—an innovation that would help change how cities grew upward.',
    looks:['Follow the repeating arched windows across the Broadway façade.','Turn the corner onto Broome Street to see the pattern continue.','Notice how the upper stories form orderly rows above the storefronts.'],
    culture:[{type:'City life · an everyday invention',title:'Shopping, but upstairs',text:'Before elevators became ordinary, reaching upper floors was part of the challenge of selling goods. Here, a shopping trip offered customers a new way to move through a building.'}],
    tip:'This is an exterior stop on busy sidewalks. The historic elevator is not offered as a visitor attraction.',
    sources:[['Historic Districts Council · Haughwout Building','https://hdc.org/buildings/e-v-haughwout-building/'],['SAH Archipedia · Haughwout Building','https://sah-archipedia.org/buildings/NY-01-061-0008']]
  }
];
const WALKS = [
 {id:'midtown',title:'A little movie magic',subtitle:'Familiar scenes. A whole new way to see them.',area:'Midtown',minutes:65,miles:'1.5',image:'plaza',tags:['Film & TV','First-time favorites'],stops:['plaza','nypl','grandcentral'],description:'From Eloise’s hotel to a ghostly library and a station full of stars. An easy-to-follow introduction to three New York favorites, with time to stop and look.',legs:['Begin outside The Plaza at Fifth Avenue and Central Park South.','Follow Fifth Avenue south to the library at 42nd Street.','Walk east on 42nd Street toward Grand Central Terminal.']},
 {id:'village',title:'Another side of downtown',subtitle:'A castle, a literary square, and a little invention.',area:'Village → SoHo',minutes:55,miles:'1.1',image:'jefferson',tags:['Hidden gems','Everyday discoveries'],stops:['jefferson','washington','haughwout'],description:'Take the slower way through the Village and into SoHo. Meet a courthouse turned library, a neighborhood from a novel, and a storefront with a surprising place in the city’s story.',legs:['Begin at Jefferson Market Library, Sixth Avenue and West 10th Street.','Walk south on Sixth Avenue, east on West 8th Street, then south on Fifth Avenue to the arch.','Leave the park toward Broadway, then continue south to Broome Street.']}
];
