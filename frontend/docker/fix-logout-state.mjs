import { readFileSync, writeFileSync } from "node:fs";

const topbarPath = "src/components/topbar.js";
let source = readFileSync(topbarPath, "utf8");

const brokenCall = "await FetchProfile({ setUsers, setCurUID, setCurUser, setCurUserPerm });";
const fixedCall = "await FetchProfile({ setUsers, setCurUID, setCurUser, setCurUserPerm, setCurUserBanner });";
const brokenContext = "curUserBanner, testRoleMode";
const fixedContext = "curUserBanner, setCurUserBanner, testRoleMode";
const brokenCallCount = source.split(brokenCall).length - 1;
const brokenContextCount = source.split(brokenContext).length - 1;
const hasFixedCall = source.includes(fixedCall);
const hasFixedContext = source.includes(fixedContext);

if (brokenCallCount === 1 && brokenContextCount === 1 && !hasFixedCall && !hasFixedContext) {
    source = source.replace(brokenContext, fixedContext).replace(brokenCall, fixedCall);
    if (!source.includes(fixedCall) || !source.includes(fixedContext) || source.includes(brokenCall) || source.includes(brokenContext)) {
        throw new Error("The logout state patch did not produce the expected implementation.");
    }
    writeFileSync(topbarPath, source);
    console.log("Fixed the incomplete profile state update after logout.");
} else if (brokenCallCount === 0 && brokenContextCount === 0 && hasFixedCall && hasFixedContext) {
    console.log("Upstream already provides the logout banner setter; skip the deployment patch.");
} else {
    throw new Error("Unsupported upstream logout implementation.");
}
