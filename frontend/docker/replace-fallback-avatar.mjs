import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";

const sourceRoot = "src";
const upstreamAvatar = "https://charlws.com/me.gif";
const localAvatar = "/logo.png";
const sourceExtensions = new Set([".js", ".jsx", ".ts", ".tsx"]);
let replacementCount = 0;

function updateDirectory(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
            updateDirectory(path);
        } else if (sourceExtensions.has(extname(entry.name))) {
            const source = readFileSync(path, "utf8");
            const occurrences = source.split(upstreamAvatar).length - 1;
            if (occurrences > 0) {
                writeFileSync(path, source.replaceAll(upstreamAvatar, localAvatar));
                replacementCount += occurrences;
            }
        }
    }
}

updateDirectory(sourceRoot);

if (replacementCount === 0) {
    console.log("Upstream does not contain the known fallback avatar; skip replacement.");
} else {
    console.log(`Replaced ${replacementCount} upstream fallback avatar reference(s).`);
}
