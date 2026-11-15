import fs from "node:fs";

const file = "src/routes/event.js";
let source = fs.readFileSync(file, "utf8");

const functionBefore = `function getFirstDay(language) {
    if (new Intl.Locale(language).getWeekInfo) return new Intl.Locale(language).getWeekInfo().firstDay;
    else {
        const fullLocale = navigator.language;
        const language = fullLocale.split("-")[0];

        if (LOCALE_FIRST_DAY[fullLocale] !== undefined) {
            return LOCALE_FIRST_DAY[fullLocale];
        }

        if (LOCALE_FIRST_DAY[language] !== undefined) {
            return LOCALE_FIRST_DAY[language];
        }
    }
}`;

const functionAfter = `function getFirstDay(language) {
    const requestedLocale = typeof language === "string" && language.trim() !== "" ? language.replaceAll("_", "-") : "en";

    try {
        const locale = new Intl.Locale(requestedLocale);
        const weekInfo = typeof locale.getWeekInfo === "function" ? locale.getWeekInfo() : locale.weekInfo;
        if (weekInfo?.firstDay !== undefined) return weekInfo.firstDay % 7;
    } catch (_) {
        // Fall back to the local table when the browser rejects the locale.
    }

    const fullLocale = requestedLocale;
    const baseLanguage = fullLocale.split("-")[0];
    return LOCALE_FIRST_DAY[fullLocale] ?? LOCALE_FIRST_DAY[baseLanguage] ?? 1;
}`;

if (source.includes(functionBefore)) {
    source = source.replace(functionBefore, functionAfter);
} else if (!source.includes('const requestedLocale = typeof language === "string"')) {
    throw new Error("Unsupported event week-start implementation.");
}

const translationBefore = "    const { t: tr } = useTranslation();\n    const { eventid: paramEventID } = useParams();";
const translationAfter = "    const { t: tr, i18n } = useTranslation();\n    const { eventid: paramEventID } = useParams();";

if (source.includes(translationBefore)) {
    source = source.replace(translationBefore, translationAfter);
} else if (!source.includes("const { t: tr, i18n } = useTranslation();")) {
    throw new Error("Unsupported event translation hook.");
}

const contextBefore = "    const { apiPath, curUID, curUser, userSettings } = useContext(AppContext);";
const contextAfter = `${contextBefore}
    const calendarLanguage = userSettings.language || i18n.resolvedLanguage || i18n.language || navigator.language || "en";`;

if (source.includes(contextBefore) && !source.includes("const calendarLanguage =")) {
    source = source.replace(contextBefore, contextAfter);
} else if (!source.includes("const calendarLanguage =")) {
    throw new Error("Unsupported event language context.");
}

const calendarBefore = 'locale={userSettings.language} firstDay={getFirstDay(userSettings.language)}';
const calendarAfter = 'locale={calendarLanguage} firstDay={getFirstDay(calendarLanguage)}';

if (source.includes(calendarBefore)) {
    source = source.replace(calendarBefore, calendarAfter);
} else if (!source.includes(calendarAfter)) {
    throw new Error("Unsupported FullCalendar locale configuration.");
}

fs.writeFileSync(file, source);
