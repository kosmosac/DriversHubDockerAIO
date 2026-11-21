import fs from "node:fs";

const configUrl = new URL(process.env.VITE_CONFIG_URL);
const suffix = "/client/config/global";
const pathname = configUrl.pathname.replace(/\/$/, "");

if (!pathname.endsWith(suffix)) {
    throw new Error("VITE_CONFIG_URL must end with /client/config/global.");
}

const apiPrefix = pathname.slice(0, -suffix.length);
if (!/^\/[A-Za-z0-9._~-]+$/.test(apiPrefix)) {
    throw new Error("VITE_CONFIG_URL must contain a single valid API prefix.");
}

const path = "/tmp/Caddyfile";
const source = fs.readFileSync(path, "utf8");
fs.writeFileSync(path, source.replaceAll("/api", apiPrefix));

console.log(`Configured Caddy API prefix ${apiPrefix}.`);
