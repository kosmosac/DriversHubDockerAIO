import fs from "node:fs";

const path = "src/components/statcard.js";
let source = fs.readFileSync(path, "utf8");

const oldImport = 'import { useTheme } from "@mui/material/styles";';
const fixedImport = 'import { alpha, useTheme } from "@mui/material/styles";';
if (source.includes(oldImport)) {
    source = source.replace(oldImport, fixedImport);
} else if (!source.includes(fixedImport)) {
    throw new Error("Unsupported StatCard MUI import.");
}

const oldStops = `    gradient.addColorStop(0, color + "75");
    gradient.addColorStop(0.382, color + "25");
    gradient.addColorStop(0.618, color + "10");`;
const fixedStops = `    gradient.addColorStop(0, alpha(color, 0x75 / 255));
    gradient.addColorStop(0.382, alpha(color, 0x25 / 255));
    gradient.addColorStop(0.618, alpha(color, 0x10 / 255));`;

if (source.includes(oldStops)) {
    source = source.replace(oldStops, fixedStops);
} else if (!source.includes(fixedStops)) {
    throw new Error("Unsupported StatCard gradient implementation.");
}

fs.writeFileSync(path, source);
