import { readFileSync, writeFileSync } from "node:fs";

const loaderPath = "src/components/loader.js";
let source = readFileSync(loaderPath, "utf8");

const upstreamApiPath = "`${webConfig.api_host}/${webConfig.abbr}`";
const deploymentApiPath = "getApiPath(webConfig)";
const helperMarker = "function getApiPath(webConfig) {";
const insertBefore = "function sleep(ms) {";
const occurrences = source.split(upstreamApiPath).length - 1;

if (occurrences === 3 && !source.includes(helperMarker)) {
    const helper = `function getApiPath(webConfig) {
  if (import.meta.env.VITE_USE_MULTIHUB == "true") {
    return \`${upstreamApiPath.slice(1, -1)}\`;
  }

  const configUrl = new URL(import.meta.env.VITE_CONFIG_URL);
  const endpoint = "/client/config/global";
  const pathname = configUrl.pathname.replace(/\\/+$/, "");
  if (!pathname.endsWith(endpoint)) {
    throw new Error("VITE_CONFIG_URL must end with /client/config/global.");
  }

  configUrl.pathname = pathname.slice(0, -endpoint.length) || "/";
  configUrl.search = "";
  configUrl.hash = "";
  return configUrl.toString().replace(/\\/$/, "");
}

`;

    if (!source.includes(insertBefore)) {
        throw new Error("Cannot locate the API path helper insertion point.");
    }

    source = source.replace(insertBefore, helper + insertBefore);
    source = source.replaceAll(upstreamApiPath, deploymentApiPath);
    console.log("Use VITE_CONFIG_URL as the single-hub API path source.");
} else if (occurrences === 0 && !/api_host[^;\n]{0,80}abbr/.test(source)) {
    console.log("Upstream does not contain the known API path dependency; skip the patch.");
} else {
    throw new Error(`Unsupported upstream API path implementation (${occurrences} known references).`);
}

if (source.includes(upstreamApiPath) && !source.includes("VITE_USE_MULTIHUB")) {
    throw new Error("The upstream API path dependency remains without a multihub fallback.");
}

writeFileSync(loaderPath, source);
