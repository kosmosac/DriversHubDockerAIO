import fs from "node:fs";

const path = "src/functions.js";
let source = fs.readFileSync(path, "utf8");

if (source.includes("function clearInvalidSession(errorResponse)")) {
    console.log("Invalid-session handling is already present; no change required.");
    process.exit(0);
}

const interceptor = `customAxios.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        const errorResponse = error.response;
`;

const replacement = `function clearInvalidSession(errorResponse) {
    if (errorResponse?.status !== 401) return;

    const headers = errorResponse.config?.headers;
    const authorization = typeof headers?.get === "function"
        ? headers.get("Authorization")
        : headers?.Authorization || headers?.authorization;

    if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) return;

    localStorage.removeItem("token");
    eraseCookie("auth-mode");
    if (!["/auth", "/auth/login"].includes(window.location.pathname)) {
        window.location.replace("/auth/login");
    }
}

customAxios.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        const errorResponse = error.response;
        clearInvalidSession(errorResponse);
`;

if (!source.includes(interceptor)) {
    throw new Error("Unsupported Axios response interceptor implementation.");
}

source = source.replace(interceptor, replacement);
fs.writeFileSync(path, source);
