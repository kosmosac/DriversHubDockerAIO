import { readFileSync, writeFileSync } from "node:fs";

const topbarPath = "src/components/topbar.js";
let source = readFileSync(topbarPath, "utf8");

const brokenCall = "await FetchProfile({ setUsers, setCurUID, setCurUser, setCurUserPerm });";
const fixedCall = "await FetchProfile({ setUsers, setCurUID, setCurUser, setCurUserPerm, setCurUserBanner });";
const brokenContext = "curUserBanner, testRoleMode";
const fixedContext = "curUserBanner, setCurUserBanner, testRoleMode";

if (source.includes(brokenCall)) {
    if (!source.includes(brokenContext)) {
        throw new Error("Cannot locate the logout banner setter in the upstream context declaration.");
    }

    source = source.replace(brokenContext, fixedContext);
    source = source.replace(brokenCall, fixedCall);
    writeFileSync(topbarPath, source);
    console.log("Fixed the incomplete profile state update after logout.");
} else if (source.includes(fixedCall) || source.includes(fixedContext)) {
    console.log("Upstream already provides the logout banner setter; skip the deployment patch.");
} else {
    throw new Error("Unsupported upstream logout implementation.");
}
