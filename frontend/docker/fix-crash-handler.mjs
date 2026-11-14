import fs from "node:fs";

const crashedPath = "src/components/crashed.js";
let crashed = fs.readFileSync(crashedPath, "utf8");
const oldImport = 'import { useMemo, useContext } from "react";';
const fixedImport = 'import { useMemo, useContext, useEffect } from "react";';

if (crashed.includes(oldImport)) {
    crashed = crashed.replace(oldImport, fixedImport);
} else if (!crashed.includes(fixedImport)) {
    throw new Error("Unsupported crash component React import.");
}
fs.writeFileSync(crashedPath, crashed);

const indexPath = "src/index.js";
let index = fs.readFileSync(indexPath, "utf8");
if (!index.includes("componentDidCatch(error, errorInfo)")) {
    const renderMarker = `    render() {
        if (this.state.hasError) {`;
    const replacement = `    componentDidCatch(error, errorInfo) {
        console.error("Drivers Hub rendering failed", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {`;
    if (!index.includes(renderMarker)) {
        throw new Error("Unsupported ErrorBoundary implementation.");
    }
    index = index.replace(renderMarker, replacement);
}
fs.writeFileSync(indexPath, index);
