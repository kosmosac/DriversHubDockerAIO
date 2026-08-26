import { readFileSync, writeFileSync } from "node:fs";

const appPath = "src/App.js";
let source = readFileSync(appPath, "utf8");

const analyticsStart = "    const [cookieSettings, setCookieSettings] = useState(localStorage.getItem(\"cookie-settings\"));";
const analyticsEnd = "    const hasSpeedDial =";
const analyticsConfig = "const GOOGLE_ANALYTICS_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;\n";
const consentStarts = [
    "                        {!window.isElectron && cookieSettings === null && !sidebarForceHidden && (",
    "                        {GOOGLE_ANALYTICS_ID && !window.isElectron && cookieSettings === null && !sidebarForceHidden && (",
];
const consentEnd = "                        <SimpleBar ";

const hasKnownAnalytics = source.includes("G-SLZ5TY9MVN") || source.includes(analyticsConfig);
const hasKnownState = source.includes(analyticsStart);
const consentStart = consentStarts.find(marker => source.includes(marker));
const hasKnownConsent = consentStart !== undefined;

if (hasKnownState && hasKnownConsent) {
    const analyticsStartIndex = source.indexOf(analyticsStart);
    const analyticsEndIndex = source.indexOf(analyticsEnd, analyticsStartIndex);
    const consentStartIndex = source.indexOf(consentStart);
    const consentEndIndex = source.indexOf(consentEnd, consentStartIndex);

    if (analyticsEndIndex === -1 || consentEndIndex === -1) {
        throw new Error("Cannot locate the complete upstream Analytics implementation.");
    }

    source = source.slice(0, analyticsStartIndex) + source.slice(analyticsEndIndex);

    const updatedConsentStartIndex = source.indexOf(consentStart);
    const updatedConsentEndIndex = source.indexOf(consentEnd, updatedConsentStartIndex);
    source = source.slice(0, updatedConsentStartIndex) + source.slice(updatedConsentEndIndex);

    const materialImport = "Typography, Button, Grid";
    if (!source.includes(materialImport)) {
        throw new Error("Cannot remove the Button import used by the upstream consent dialog.");
    }
    source = source.replace(materialImport, "Typography, Grid");
    source = source.replace(analyticsConfig, "");

    console.log("Removed the upstream Google Analytics integration and consent dialog.");
} else if (hasKnownAnalytics || hasKnownState || hasKnownConsent) {
    throw new Error("Unsupported upstream Analytics implementation.");
} else {
    console.log("Upstream does not contain the known Analytics implementation; skip removal.");
}

const unsupportedAnalytics = [
    /googletagmanager\.com/i,
    /google-analytics\.com/i,
    /\bgtag\s*\(/,
    /\bdataLayer\b/,
    /cookie-settings/,
];

if (unsupportedAnalytics.some(pattern => pattern.test(source))) {
    throw new Error("An unsupported Analytics implementation remains in src/App.js.");
}

writeFileSync(appPath, source);
