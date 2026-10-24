# Cityside — complete source code

This is the Cityside mobile web app with the updated cobalt, aqua, and lilac colors and the audio guide. All required images and client-side dependencies are included.

## Run locally

1. Unzip this download.
2. Open Terminal inside the `cityside` folder.
3. With Python 3 installed, run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

4. Open http://localhost:8000 in your browser. Keep Terminal running.

There is no install command, build step, API key, database, or paid service required. Serve `dist` as the web root; asset paths are relative, so the site also works from a subfolder such as GitHub Pages (`https://<user>.github.io/LookUp-NYC/`).



## Files to edit

- `dist/index.html`: page shell and script loading.
- `dist/styles.css`: colors, layout, and responsive phone styles.
- `dist/app.js`: navigation, search, saved places, maps, and walking routes.
- `dist/data.js`: all seven landmarks and two walks.
- `dist/audio-engine.js`: device narration, pause/resume, section skipping, and playback settings.
- `dist/audio-ui.js`: audio panel, voice selector, transcript, and persistent mini-player.
- `dist/credits.js`: photo attribution and source links.
- `dist/assets/`: included photographs, icons, and Leaflet files.
- `dist/manifest.webmanifest`: home-screen app metadata.
- `tests/narration.test.cjs`: eight audio behavior tests.
- `fetch_assets.py`, `image-metadata.json`, `image-credits.json`: original image collection helper and metadata. Images are already included; you do not need to run the helper. Its base directory is made portable in this export. It downloads source JPEGs, not replacements for the already included optimized WebP assets.

## Optional tests

With Node.js installed, run from the `cityside` folder:

```sh
node --test tests/narration.test.cjs
```

## Hosting

Publish the contents of `dist` to a static web host, with HTTPS for location access on phones. The included `.openai/hosting.json` belongs to your existing Cityside Site. Remove its `project_id` before using it to create a separate Site.

## Audio and scope

Narration uses available browser/device voices, not MP3 recordings or an AI voice API. Start it with a tap and keep the app open. Voice availability varies by device. Physical-phone sound output has not been verified. Audio controls, cancellation, and sequencing have been tested.

This is a mobile web app, not an iOS or Android native project. Saved places, walking progress, and voice preferences stay in the current browser. Location sorting is opt-in; this version does not provide background GPS-triggered narration. Map land outlines are schematic, and walking directions open Google Maps.

Google Fonts and external visitor/directions links require an internet connection. Retain the supplied photography credits and third-party license notices when reusing the project.

The runtime source matches published revision 53c96796a95ee127c44e8f5de5b8c015f460c736. This export adds this guide and makes the optional image-fetch helper portable. No credentials or Git history are included.
