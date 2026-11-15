import fs from "node:fs";

const loginFile = "src/routes/auth/login.js";
let login = fs.readFileSync(loginFile, "utf8");

const labelBefore = '{tr("register_with")}: {apiConfig.register_methods.map(item => CONNECTION_NAME[item]).join(" / ")} | <span>{tr("or_login_with")}</span>:';
const labelAfter = '{tr("or_login_with")}:';

if (login.includes(labelBefore)) {
    login = login.replace(labelBefore, labelAfter);
} else if (!login.includes(labelAfter)) {
    throw new Error("Unsupported login method label implementation.");
}

fs.writeFileSync(loginFile, login);

const translations = {
    de: "Oder fortfahren mit",
    en: "Or continue with",
    es: "O continuar con",
    nl: "Of ga verder met",
    pt: "Ou continuar com",
};

for (const [language, value] of Object.entries(translations)) {
    const file = `src/languages/${language}.json`;
    const source = fs.readFileSync(file, "utf8");
    const expression = /(\"or_login_with\"\s*:\s*)\"(?:[^\"\\]|\\.)*\"/;
    const matches = source.match(new RegExp(expression.source, "g")) ?? [];
    if (matches.length !== 1) {
        throw new Error(`Expected one or_login_with translation in ${file}, found ${matches.length}.`);
    }
    fs.writeFileSync(file, source.replace(expression, `$1${JSON.stringify(value)}`));
}
