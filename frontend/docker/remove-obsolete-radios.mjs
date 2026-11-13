import { readFileSync, writeFileSync } from "node:fs";

const topbarPath = "src/components/topbar.js";
const settingsPath = "src/routes/settings.js";

let topbar = readFileSync(topbarPath, "utf8");
let settings = readFileSync(settingsPath, "utf8");

const upstreamRadioURLs = 'const radioURLs = { tfm: "https://live.truckers.fm/", simhit: "https://radio.simulatorhits.com/radio/8000/stream" };';
const upstreamRadioNames = 'const radioNames = { tfm: "TruckersFM", simhit: "SimulatorHits" };';
const upstreamRadioImages = 'const radioImages = { tfm: "https://truckersfm.s3.fr-par.scw.cloud/static/tfm-2020.png", simhit: "https://simulatorhits.com/images/SH_Logo.jpg" };';
const simulatorHitsMetadata = `          } else if (userSettings.radio_type === "simhit") {
            let resp = await axios({ url: \`https://api.simulatorhits.com/now-playing\` });
            setRadioSongName(resp.data.song.title);
            if (!userSettings.data_saver) setRadioImage(resp.data.song.artwork);
            else setRadioImage(radioImages[userSettings.radio_type]);
            setRadioSpotifyId(resp.data.song.identifier.spotify);
            navigator.mediaSession.metadata = new MediaMetadata({
              title: resp.data.song.title,
              artist: resp.data.song.artist,
              artwork: userSettings.data_saver ? [] : [{ src: resp.data.song.artwork, sizes: "640x640", type: "image/jpeg" }],
            });`;
const upstreamRadioTypes = 'const RADIO_TYPES = { "tfm": "TruckersFM", "simhit": "SimulatorHits", "custom-pean": "[Custom] PeanFM" };';
const upstreamCustomRadio = 'const CUSTOM_RADIO_URL = { "custom-pean": "https://radio.plvtc.com/listen/peanfm/radio.mp3" };';

const alreadyUpdated =
  !topbar.includes("simulatorhits.com") &&
  !settings.includes("SimulatorHits") &&
  !settings.includes("radio.plvtc.com");

if (!alreadyUpdated) {
  const expectedMarkers = [
    upstreamRadioURLs,
    upstreamRadioNames,
    upstreamRadioImages,
    simulatorHitsMetadata,
    upstreamRadioTypes,
    upstreamCustomRadio,
  ];
  const missingMarkers = expectedMarkers.filter(marker => !(topbar.includes(marker) || settings.includes(marker)));
  if (missingMarkers.length > 0) {
    throw new Error("Unsupported upstream radio implementation.");
  }

  topbar = topbar
    .replace(upstreamRadioURLs, 'const radioURLs = { tfm: "https://live.truckers.fm/" };')
    .replace(upstreamRadioNames, 'const radioNames = { tfm: "TruckersFM" };')
    .replace(upstreamRadioImages, 'const radioImages = { tfm: "https://truckersfm.s3.fr-par.scw.cloud/static/tfm-2020.png" };')
    .replace(simulatorHitsMetadata, "");

  settings = settings
    .replace(upstreamRadioTypes, 'const RADIO_TYPES = { "tfm": "TruckersFM" };')
    .replace(`${upstreamCustomRadio}\n`, "");

  writeFileSync(topbarPath, topbar);
  writeFileSync(settingsPath, settings);
  console.log("Removed the discontinued SimulatorHits integration and the bundled custom radio preset.");
} else {
  console.log("Upstream does not contain the obsolete radio integrations; skip removal.");
}

const unsupportedRadioReferences = [
  /simulatorhits\.com/i,
  /\bSimulatorHits\b/,
  /radio\.plvtc\.com/i,
  /custom-pean/,
];

if (unsupportedRadioReferences.some(pattern => pattern.test(topbar) || pattern.test(settings))) {
  throw new Error("An obsolete radio integration remains after cleanup.");
}
