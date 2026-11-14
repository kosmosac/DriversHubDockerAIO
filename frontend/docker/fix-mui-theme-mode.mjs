import fs from "node:fs";

const replacements = [
    {
        path: "src/components/usercard.js",
        oldValue: "PROFILE_COLOR[theme.mode]",
        newValue: "PROFILE_COLOR[theme.palette.mode]",
        expected: 12,
    },
    {
        path: "src/routes/settings.js",
        oldValue: "DEFAULT_BGCOLOR[theme.mode]",
        newValue: "DEFAULT_BGCOLOR[theme.palette.mode]",
        expected: 8,
    },
];

for (const replacement of replacements) {
    let source = fs.readFileSync(replacement.path, "utf8");
    const oldCount = source.split(replacement.oldValue).length - 1;
    const newCount = source.split(replacement.newValue).length - 1;

    if (oldCount === replacement.expected && newCount === 0) {
        source = source.replaceAll(replacement.oldValue, replacement.newValue);
        fs.writeFileSync(replacement.path, source);
    } else if (oldCount !== 0 || newCount !== replacement.expected) {
        throw new Error(`Unsupported MUI theme mode usage in ${replacement.path}.`);
    }
}
