# LookUp NYC

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

## Text me this route (Vonage SMS)

Each route page has a **Text me this route** button. The visitor enters a phone number and gets the stops, a Google Maps walking link, and a link back to the route's stories.

GitHub Pages can't keep secrets, so texts go through a small server in `server/` that holds the Vonage credentials. It has no npm dependencies (Node 18+).

1. **Vonage account.** In the [Vonage dashboard](https://dashboard.nexmo.com) copy your API key and secret, and get a Vonage number to send from. On a trial account you can only text numbers you've added and verified as test numbers; texting the US outside the trial needs 10DLC or toll-free registration.
2. **Try it locally without sending:** `npm run dev:sms`, then set `<meta name="lookup-sms-api" content="http://localhost:8787">` in `dist/index.html` and serve `dist/`. Texts print in the terminal.
3. **Deploy the server** to any Node host (Render, Railway, Fly). Start command `npm start`; set the variables in `server/.env.example`.
4. **Point the site at it:** put the server's URL in the `lookup-sms-api` meta tag in `dist/index.html` and push. Leave it empty to hide the button.

The server builds the message itself from the route ID (it never relays text from the browser), only accepts requests from `ALLOWED_ORIGINS`, and limits each visitor to 5 texts per 10 minutes, each number to 3 per hour, and the whole server to `DAILY_LIMIT` texts a day (default 100). Only US/Canada numbers are accepted unless `ALLOW_INTERNATIONAL=1`, because open SMS endpoints are a common target for fraud that texts premium international numbers. Behind a hosting proxy, set `TRUST_PROXY=1` so limits use the real visitor address. Each text is about 2 SMS parts: the stops plus one link to the route page. Phone numbers aren't stored; logs show only the last four digits.
