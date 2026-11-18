import fs from "node:fs";

const path = "src/routes/map.js";
let source = fs.readFileSync(path, "utf8");

if (source.includes("VITE_LIVE_MAP_URL")) {
    console.log("Configurable live map endpoint already present; no frontend changes required.");
    process.exit(0);
}

const componentMarker = "const Map = () => {\n";
if (!source.includes(componentMarker)) {
    throw new Error("Could not find the map component.");
}

source = source.replace(
    componentMarker,
    `${componentMarker}    const LIVE_MAP_URL = import.meta.env.VITE_LIVE_MAP_URL === undefined\n        ? "https://tracker.ets2map.com/v3/area"\n        : import.meta.env.VITE_LIVE_MAP_URL;\n`,
);

const oldBlock = `            if (SERVER_ID[tabRef.current] !== undefined && boundaryRef.current.x1 !== undefined) {
                let server_id = SERVER_ID[tabRef.current];
                const response = await fetch(\`https://tracker.ets2map.com/v3/area?x1=\${boundaryRef.current.x1}&y1=\${boundaryRef.current.y2}&x2=\${boundaryRef.current.x2}&y2=\${boundaryRef.current.y1}&server=\${SERVER_ID[tabRef.current]}\`);
                const data = await response.json();
                if (server_id !== SERVER_ID[tabRef.current]) {
                    return;
                }
                if (data.Data !== null) {
                    const points = data.Data.map(item => ({ x: item.X, y: item.Y, color: memberTruckersMP.includes(item.MpId) ? "#f39621" : "#158CFB", info: { ...item } }));
                    setPoints(points);
                } else {
                    setPoints([]);
                }
            }`;

const newBlock = `            if (LIVE_MAP_URL && SERVER_ID[tabRef.current] !== undefined && boundaryRef.current.x1 !== undefined) {
                const server_id = SERVER_ID[tabRef.current];
                const requestUrl = new URL(LIVE_MAP_URL, window.location.origin);
                requestUrl.searchParams.set("x1", boundaryRef.current.x1);
                requestUrl.searchParams.set("y1", boundaryRef.current.y2);
                requestUrl.searchParams.set("x2", boundaryRef.current.x2);
                requestUrl.searchParams.set("y2", boundaryRef.current.y1);
                requestUrl.searchParams.set("server", server_id);

                try {
                    const response = await fetch(requestUrl);
                    if (!response.ok) {
                        throw new Error(\`Live map request failed with HTTP \${response.status}.\`);
                    }
                    const data = await response.json();
                    if (server_id !== SERVER_ID[tabRef.current]) {
                        return;
                    }
                    if (Array.isArray(data.Data)) {
                        const points = data.Data.map(item => ({ x: item.X, y: item.Y, color: memberTruckersMP.includes(item.MpId) ? "#f39621" : "#158CFB", info: { ...item } }));
                        setPoints(points);
                    } else {
                        setPoints([]);
                    }
                } catch (error) {
                    console.warn("Live map data could not be loaded.", error);
                    setPoints([]);
                }
            }`;

if (!source.includes(oldBlock)) {
    throw new Error("Could not find the expected live map request.");
}

source = source.replace(oldBlock, newBlock);
fs.writeFileSync(path, source);
console.log("Configured the optional live map endpoint.");
