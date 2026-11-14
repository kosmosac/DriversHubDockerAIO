import { readFileSync, writeFileSync } from "node:fs";

function replaceOnce(source, oldValue, newValue, description) {
    const count = source.split(oldValue).length - 1;
    if (count !== 1) throw new Error(`Expected one ${description}, found ${count}.`);
    return source.replace(oldValue, newValue);
}

const appPath = "src/App.js";
let app = readFileSync(appPath, "utf8");

if (app.includes("const LEGAL_LINK_KEYS =")) {
    console.log("Compatible privacy notice and legal-link support detected; no frontend changes required.");
    process.exit(0);
}

app = replaceOnce(
    app,
    'const CONNECTIONS = { email: "email", discord: "Discord", steam: "Steam", truckersmp: "TruckersMP" };\n',
    `const CONNECTIONS = { email: "email", discord: "Discord", steam: "Steam", truckersmp: "TruckersMP" };
const LEGAL_LINK_KEYS = ["privacy_policy", "cookie_policy", "imprint"];

function validatedLegalUrl(value) {
    if (typeof value !== "string" || value === "") return "";
    try {
        const url = new URL(value);
        if (url.protocol === "https:" || (url.protocol === "http:" && url.hostname === "localhost")) return url.href;
    } catch (_) {
        // Invalid or incomplete URLs are not rendered.
    }
    return "";
}
`,
    "connection constant",
);

const analyticsConfig = "const GOOGLE_ANALYTICS_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;\n";
app = app.replace(analyticsConfig, "");

const stateMarker = '    const [cookieSettings, setCookieSettings] = useState(localStorage.getItem("cookie-settings"));';
const analyticsStart = app.indexOf("    useEffect(() => {", app.indexOf(stateMarker));
const analyticsEndMarker = "\n\n    const hasSpeedDial =";
const analyticsEnd = app.indexOf(analyticsEndMarker, analyticsStart);
if (app.indexOf(stateMarker) === -1 || analyticsStart === -1 || analyticsEnd === -1) {
    throw new Error("Cannot locate the upstream Analytics implementation.");
}

const legalState = `    const legalLinks = LEGAL_LINK_KEYS.map(key => ({
        key,
        label: tr(key),
        url: validatedLegalUrl(webConfig?.legal_urls?.[key]),
    })).filter(link => link.url !== "");
    const cookieNoticeLink = legalLinks.find(link => link.key === "cookie_policy") || legalLinks.find(link => link.key === "privacy_policy");`;
app = app.slice(0, analyticsStart) + legalState + app.slice(analyticsEnd);

const consentStartMarker = "                        {!window.isElectron && cookieSettings === null && !sidebarForceHidden && (";
const consentStart = app.indexOf(consentStartMarker);
const contentStartMarker = '                        <SimpleBar style={{ padding: "20px"';
const contentStart = app.indexOf(contentStartMarker, consentStart);
if (consentStart === -1 || contentStart === -1) throw new Error("Cannot locate the upstream cookie dialog.");

const essentialNotice = `                        {!window.isElectron && cookieSettings === null && (
                            <Card sx={{ position: "fixed", zIndex: 100000, bottom: "10px", right: "10px", width: window.innerWidth <= 420 ? "calc(100vw - 20px) !important" : "400px" }}>
                                <CardContent>
                                    <Typography variant="h6" fontWeight="bold">
                                        {tr("we_value_your_privacy")}
                                    </Typography>
                                    <Typography variant="body2" sx={{ marginBottom: "10px" }}>
                                        {tr("essential_cookies_notice")}
                                        {cookieNoticeLink !== undefined && (
                                            <>
                                                <br />
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                                                    <FontAwesomeIcon icon={faLink} />
                                                    <a href={cookieNoticeLink.url} target="_blank" rel="noreferrer" style={{ fontWeight: 700, textDecoration: "underline" }}>
                                                        {cookieNoticeLink.label}
                                                    </a>
                                                </span>
                                            </>
                                        )}
                                    </Typography>
                                    <Button
                                        onClick={() => updateCookieSettings("essential")}
                                        variant="contained"
                                        color="primary"
                                        sx={{ width: "100%" }}>
                                        {tr("understood")}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
`;
app = app.slice(0, consentStart) + essentialNotice + app.slice(contentStart);

const footerStart = '<footer style={{ display: ["/auth", "/auth/login", "/auth/email", "/auth/discord/callback", "/auth/discord/redirect", "/auth/steam/callback", "/auth/steam/redirect", "/auth/mfa"].includes(location.pathname) ? "none" : "block", marginTop: "auto", fontSize: "0.9em" }}>';
app = replaceOnce(
    app,
    footerStart,
    '<footer style={{ display: ["/auth", "/auth/login", "/auth/email", "/auth/discord/callback", "/auth/discord/redirect", "/auth/steam/callback", "/auth/steam/redirect", "/auth/mfa"].includes(location.pathname) && legalLinks.length === 0 ? "none" : "block", marginTop: "auto", fontSize: "0.9em" }}>',
    "footer visibility rule",
);

const footerEnd = "                                </footer>";
const legalFooter = `                                    {legalLinks.length > 0 && (
                                        <Typography variant="body2" sx={{ marginTop: "8px", fontWeight: 800 }}>
                                            {legalLinks.map((link, index) => (
                                                <span key={link.key}>
                                                    {index > 0 && " · "}
                                                    <a href={link.url} target="_blank" rel="noreferrer">
                                                        {link.label}
                                                    </a>
                                                </span>
                                            ))}
                                        </Typography>
                                    )}
                                </footer>`;
app = replaceOnce(app, footerEnd, legalFooter, "footer end");

const unsupportedAnalytics = [
    /googletagmanager\.com/i,
    /google-analytics\.com/i,
    /\bgtag\s*\(/,
    /\bdataLayer\b/,
    /G-SLZ5TY9MVN/,
    /GOOGLE_ANALYTICS_ID/,
];
if (unsupportedAnalytics.some(pattern => pattern.test(app))) {
    throw new Error("An Analytics implementation remains in src/App.js.");
}
writeFileSync(appPath, app);

const configPath = "src/routes/config.js";
let config = readFileSync(configPath, "utf8");
config = replaceOnce(
    config,
    "const [webConfig, setWebConfig] = useState({ ...curWebConfig, name_color:",
    'const [webConfig, setWebConfig] = useState({ ...curWebConfig, legal_urls: { privacy_policy: "", cookie_policy: "", imprint: "", ...curWebConfig.legal_urls }, name_color:',
    "web configuration state",
);

const logoField = `                        <Grid
                            size={{
                                xs: 12,
                                sm: 12,
                                md: 4,
                                lg: 4,
                            }}>
                            <TextField
                                label={tr("logo")}`;
const legalFields = `                        {LEGAL_LINK_KEYS.map(key => (
                            <Grid
                                key={key}
                                size={{
                                    xs: 12,
                                    md: 4,
                                }}>
                                <TextField
                                    label={tr(key)}
                                    value={webConfig.legal_urls[key]}
                                    onChange={event => {
                                        setWebConfig({ ...webConfig, legal_urls: { ...webConfig.legal_urls, [key]: event.target.value } });
                                    }}
                                    type="url"
                                    fullWidth
                                />
                            </Grid>
                        ))}
`;
config = replaceOnce(config, logoField, legalFields + logoField, "logo upload field");
config = replaceOnce(
    config,
    'const LANGUAGES = {',
    'const LEGAL_LINK_KEYS = ["privacy_policy", "cookie_policy", "imprint"];\n\nconst LANGUAGES = {',
    "language declaration",
);
writeFileSync(configPath, config);

const translations = {
    de: {
        cookie_policy: "Cookie-Richtlinie",
        essential_cookies_notice: "Diese Website verwendet notwendige Cookies und lokalen Speicher für Anmeldung, Sicherheit, Spracheinstellungen und grundlegende Funktionen.",
        imprint: "Impressum",
        privacy_policy: "Datenschutzerklärung",
        understood: "Verstanden",
    },
    en: {
        cookie_policy: "Cookie Policy",
        essential_cookies_notice: "This site uses essential cookies and local storage for authentication, security, language preferences, and core functionality.",
        imprint: "Imprint",
        privacy_policy: "Privacy Policy",
        understood: "Understood",
    },
    es: {
        cookie_policy: "Política de cookies",
        essential_cookies_notice: "Este sitio utiliza cookies esenciales y almacenamiento local para la autenticación, la seguridad, las preferencias de idioma y las funciones principales.",
        imprint: "Aviso legal",
        privacy_policy: "Política de privacidad",
        understood: "Entendido",
    },
    nl: {
        cookie_policy: "Cookiebeleid",
        essential_cookies_notice: "Deze site gebruikt essentiële cookies en lokale opslag voor authenticatie, beveiliging, taalvoorkeuren en kernfunctionaliteit.",
        imprint: "Colofon",
        privacy_policy: "Privacybeleid",
        understood: "Begrepen",
    },
    pt: {
        cookie_policy: "Política de cookies",
        essential_cookies_notice: "Este site utiliza cookies essenciais e armazenamento local para autenticação, segurança, preferências de idioma e funcionalidades principais.",
        imprint: "Aviso legal",
        privacy_policy: "Política de privacidade",
        understood: "Entendido",
    },
};

for (const [language, values] of Object.entries(translations)) {
    const path = `src/languages/${language}.json`;
    const data = JSON.parse(readFileSync(path, "utf8"));
    Object.assign(data, values);
    const sorted = Object.fromEntries(Object.entries(data).sort(([left], [right]) => left.localeCompare(right)));
    writeFileSync(path, JSON.stringify(sorted, null, 2) + "\n");
}

console.log("Removed Analytics and added the essential-cookie notice with configurable legal links.");
