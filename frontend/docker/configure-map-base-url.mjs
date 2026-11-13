import fs from "node:fs";

const files = [
    "src/routes/delivery.js",
    "src/routes/economy.js",
    "src/routes/map.js",
];
const upstreamBaseUrl = "https://map.charlws.com";
const configuredBaseUrl = process.env.VITE_MAP_BASE_URL?.replace(/\/$/, "");
let replacements = 0;

if (!configuredBaseUrl || !/^https?:\/\//.test(configuredBaseUrl)) {
    throw new Error("VITE_MAP_BASE_URL must be an HTTP or HTTPS URL.");
}

for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    const matches = source.split(upstreamBaseUrl).length - 1;
    replacements += matches;
    fs.writeFileSync(file, source.replaceAll(upstreamBaseUrl, configuredBaseUrl));
}

if (replacements !== 16) {
    throw new Error(`Expected 16 map URL replacements, found ${replacements}.`);
}
