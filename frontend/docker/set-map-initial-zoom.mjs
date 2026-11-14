import fs from "node:fs";

const tileMapFile = "src/components/tilemap.js";
const mapFile = "src/routes/map.js";

let tileMap = fs.readFileSync(tileMapFile, "utf8");
let mapRoute = fs.readFileSync(mapFile, "utf8");

const componentBefore = "showOrangeOnly, fitRoute = false }) => {";
const componentAfter = "showOrangeOnly, fitRoute = false, initialZoom = 1 }) => {";

if (tileMap.includes(componentBefore)) {
    tileMap = tileMap.replace(componentBefore, componentAfter);
} else if (!tileMap.includes(componentAfter)) {
    throw new Error("Unsupported TileMap component signature.");
}

const zoomBefore = "            zoom: 1, // Set the initial zoom level";
const zoomAfter = "            zoom: initialZoom, // Set the initial zoom level";

if (tileMap.includes(zoomBefore)) {
    tileMap = tileMap.replace(zoomBefore, zoomAfter);
} else if (!tileMap.includes(zoomAfter)) {
    throw new Error("Unsupported TileMap initial zoom implementation.");
}

const loadBefore = "    doLoad({ tilesUrl, route, points, showOrangeOnly });";
const loadAfter = "    doLoad({ tilesUrl, route, points, showOrangeOnly, initialZoom });";

if (tileMap.includes(loadBefore)) {
    tileMap = tileMap.replace(loadBefore, loadAfter);
} else if (!tileMap.includes(loadAfter)) {
    throw new Error("Unsupported TileMap load call.");
}

const functionBefore = "    async function doLoad({ tilesUrl, route, points, showOrangeOnly }) {";
const functionAfter = "    async function doLoad({ tilesUrl, route, points, showOrangeOnly, initialZoom }) {";

if (tileMap.includes(functionBefore)) {
    tileMap = tileMap.replace(functionBefore, functionAfter);
} else if (!tileMap.includes(functionAfter)) {
    throw new Error("Unsupported TileMap load function.");
}

const effectBefore = "  }, [tilesUrl, route, points, showOrangeOnly, fitRoute]);";
const effectAfter = "  }, [tilesUrl, route, points, showOrangeOnly, fitRoute, initialZoom]);";

if (tileMap.includes(effectBefore)) {
    tileMap = tileMap.replace(effectBefore, effectAfter);
} else if (!tileMap.includes(effectAfter)) {
    throw new Error("Unsupported TileMap effect dependencies.");
}

if (!mapRoute.includes("initialZoom={2}")) {
    const matches = mapRoute.match(/(\s+)points=\{points\}/g) ?? [];
    if (matches.length !== 5) {
        throw new Error(`Expected five general map instances, found ${matches.length}.`);
    }
    mapRoute = mapRoute.replace(/(\s+)points=\{points\}/g, "$1initialZoom={2}$1points={points}");
} else if ((mapRoute.match(/initialZoom=\{2\}/g) ?? []).length !== 5) {
    throw new Error("Expected all five general map instances to define initialZoom={2}.");
}

fs.writeFileSync(tileMapFile, tileMap);
fs.writeFileSync(mapFile, mapRoute);
