import fs from "node:fs";


const path = "src/routes/member-list.js";
let source = fs.readFileSync(path, "utf8");

const importAnchor = 'import Portal from "@mui/material/Portal";\n';
if (!source.includes(importAnchor) || source.includes('import Papa from "papaparse";')) {
    throw new Error("Unsupported member-list imports.");
}
source = source.replace(importAnchor, `${importAnchor}import Papa from "papaparse";\n`);

const start = source.indexOf("    const exportMemberList = useCallback(async () => {");
const endMarker = "    }, [allMembers, allRoles]);";
const end = source.indexOf(endMarker, start);
if (start === -1 || end === -1) {
    throw new Error("Could not find the member CSV export callback.");
}

const replacement = `    const exportMemberList = useCallback(async () => {
        const csv = Papa.unparse({
            fields: ["uid", "userid", "name", "email", "avatar_url", "discordid", "steamid", "truckersmpid", "join_date", "roles", "tracker"],
            data: allMembers.map(user => [
                user.uid,
                user.userid,
                user.name,
                user.email,
                user.avatar,
                \`\${String(user.discordid)}\\t\`,
                \`\${String(user.steamid)}\\t\`,
                \`\${String(user.truckersmpid)}\\t\`,
                new Date(user.join_timestamp * 1000).toISOString(),
                user.roles.map(roleid => (allRoles[roleid] !== undefined ? \`\${allRoles[roleid].name} (\${roleid})\` : \`Unknown Role (\${roleid})\`)).join(", "),
                user.tracker,
            ]),
        }, { quotes: true, newline: "\\n" });
        downloadLocal("members.csv", csv);
    }, [allMembers, allRoles]);`;

source = source.slice(0, start) + replacement + source.slice(end + endMarker.length);
fs.writeFileSync(path, source);
