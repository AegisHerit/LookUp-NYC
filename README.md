# Cityside

A mobile-first NYC landmark guide for residents and visitors. Static HTML, CSS, and JavaScript; no API key or backend required.

## Included

- Seven Manhattan landmarks with brief architectural stories, things to spot, and accurately labeled film/literary connections.
- Two self-guided walks with ordered stops, external walking directions, and device-local progress.
- Search, thematic filters, resident/visitor starting points, saved places, optional device narration, and opt-in proximity sorting.
- Leaflet landmark overview with schematic land outlines, responsive navigation, and home-screen web-app metadata.
- Three audio sections per landmark, play/pause, section skipping, speed and device-voice selection, a persistent mini-player, and a full read-along transcript. Audio starts only after a tap; it continues through in-app navigation, but not after leaving the app.
- Cool cobalt, aqua, and lilac colors across discovery, walks, maps, and audio controls.

## Run

Serve `dist/` over HTTP. Sites preview uses the static directory in `.openai/hosting.json`.

## Content and photography

Landmark content is in `dist/data.js`; story and visitor links are attached to each place. `dist/credits.js` contains photographer attribution, source links, and licenses. Photographs are Wikimedia Commons images displayed with layout cropping. Retain attribution and original licenses when reusing the images.

## Product limits

This is a mobile web app, not an App Store binary. The first collection covers Manhattan only. Walking times/distances are estimates, not live routing. Interior access is not guaranteed; official visitor links are supplied. Google Maps handles walking directions. Device voice and location depend on browser support/permission. Saved places and progress are local to a browser, without account sync. The landmark overview is schematic, not a street map; pins use geographic coordinates. Fonts and Google Maps directions require connectivity.

## Validation

JavaScript syntax checks and browser checks for search, saving, walk progress, map rendering, landmark details, and the 390-pixel phone layout. No live GPS or physical-phone voice-output verification performed.

Run `node --test tests/*.test.cjs` for audio sequencing, pause/resume, cancellation, speed changes, missing-voice recovery, recorded narration, and route filters. Narration uses the browser SpeechSynthesis API and available device voices, except for places with a recorded narration in `dist/assets/audio/`. Keep the page open while listening. Displayed times are estimates, and progress follows completed sentences.
