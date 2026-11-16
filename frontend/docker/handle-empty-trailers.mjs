import fs from "node:fs";

const path = "src/routes/delivery.js";
let source = fs.readFileSync(path, "utf8");

const modelStart = `    function GetTrailerModel(trailers) {
        let trailerString = "";`;
const safeModelStart = `    function GetTrailerModel(trailers) {
        if (!Array.isArray(trailers) || trailers.length === 0) return tr("unknown");
        let trailerString = "";`;
const unsafePlate = 'detail.trailers[0].license_plate_country !== null';
const safePlate = "Array.isArray(detail.trailers) && detail.trailers.length > 0 && detail.trailers[0].license_plate_country !== null";

if (!source.includes(safeModelStart)) {
    if (!source.includes(modelStart)) throw new Error("Unsupported trailer model renderer.");
    source = source.replace(modelStart, safeModelStart);
}
if (!source.includes(safePlate)) {
    if (!source.includes(unsafePlate)) throw new Error("Unsupported trailer plate renderer.");
    source = source.replace(unsafePlate, safePlate);
}

const loadStart = `            window.loading += 1;

            if (divisions === null) {`;
const safeLoadStart = `            window.loading += 1;

            try {
                if (divisions === null) {`;
const loadDecrement = `            window.loading -= 1;

            if (window.isElectron) {`;
const loadWithoutDecrement = `            if (window.isElectron) {`;
const loadEnd = `            }
        }
        doLoad();`;
const safeLoadEnd = `            }
            } finally {
                window.loading -= 1;
            }
        }
        doLoad();`;

if (!source.includes(safeLoadStart)) {
    if (!source.includes(loadStart) || !source.includes(loadDecrement) || !source.includes(loadEnd)) {
        throw new Error("Unsupported delivery loading implementation.");
    }
    source = source
        .replace(loadStart, safeLoadStart)
        .replace(loadDecrement, loadWithoutDecrement)
        .replace(loadEnd, safeLoadEnd);
}

const routeLoad = `        window.loading += 1;

        await axios({ url: \`\${apiPath}/tracksim/update/route\`, data: { logid: logid }, method: "POST", headers: { Authorization: \`Bearer \${getAuthToken()}\` } });

        window.loading -= 1;

        setDoReload(+new Date());`;
const safeRouteLoad = `        window.loading += 1;

        try {
            await axios({ url: \`\${apiPath}/tracksim/update/route\`, data: { logid: logid }, method: "POST", headers: { Authorization: \`Bearer \${getAuthToken()}\` } });
            setDoReload(+new Date());
        } finally {
            window.loading -= 1;
        }`;
if (!source.includes(safeRouteLoad)) {
    if (!source.includes(routeLoad)) throw new Error("Unsupported route loading implementation.");
    source = source.replace(routeLoad, safeRouteLoad);
}

fs.writeFileSync(path, source);
