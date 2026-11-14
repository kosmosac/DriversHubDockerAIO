import fs from "node:fs";

const tileMapFile = "src/components/tilemap.js";
const deliveryFile = "src/routes/delivery.js";

let tileMap = fs.readFileSync(tileMapFile, "utf8");
let delivery = fs.readFileSync(deliveryFile, "utf8");

const componentBefore =
    "const TileMap = ({ tilesUrl, title, style, route, points, onPointClick, onBoundaryChange, showOrangeOnly }) => {";
const componentAfter =
    "const TileMap = ({ tilesUrl, title, style, route, points, onPointClick, onBoundaryChange, showOrangeOnly, fitRoute = false }) => {";

if (tileMap.includes(componentBefore)) {
    tileMap = tileMap.replace(componentBefore, componentAfter);
} else if (!tileMap.includes(componentAfter)) {
    throw new Error("Unsupported TileMap component signature.");
}

const layerBefore = `        map.addLayer(vectorLayer);
      }`;
const layerAfter = `        map.addLayer(vectorLayer);

        if (fitRoute) {
          const routeGeometry = new LineString(route.map(([x, y]) => [x, -y]));
          map.updateSize();
          map.getView().fit(routeGeometry, {
            size: map.getSize(),
            padding: [30, 30, 30, 30],
            maxZoom: map.getView().getMaxZoom(),
          });
        }
      }`;

if (tileMap.includes(layerBefore)) {
    tileMap = tileMap.replace(layerBefore, layerAfter);
} else if (!tileMap.includes("if (fitRoute) {")) {
    throw new Error("Unsupported TileMap route-layer implementation.");
}

const effectBefore = "  }, [tilesUrl, route, points, showOrangeOnly]);";
const effectAfter = "  }, [tilesUrl, route, points, showOrangeOnly, fitRoute]);";

if (tileMap.includes(effectBefore)) {
    tileMap = tileMap.replace(effectBefore, effectAfter);
} else if (!tileMap.includes(effectAfter)) {
    throw new Error("Unsupported TileMap effect dependencies.");
}

const deliveryBefore = `                                        route={dlogRoute}
                                        style={{ height: "100%", minHeight: "380px" }}`;
const deliveryAfter = `                                        route={dlogRoute}
                                        fitRoute
                                        style={{ height: "100%", minHeight: "380px" }}`;

if (delivery.includes(deliveryBefore)) {
    delivery = delivery.replace(deliveryBefore, deliveryAfter);
} else if (!delivery.includes("                                        fitRoute\n")) {
    throw new Error("Unsupported delivery route-map implementation.");
}

fs.writeFileSync(tileMapFile, tileMap);
fs.writeFileSync(deliveryFile, delivery);
