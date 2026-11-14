import fs from "node:fs";

const path = "src/functions.js";
let source = fs.readFileSync(path, "utf8");

const oldImplementation = `                let avatarOk = true;
                fetch(curUser.avatar, {
                    method: "HEAD",
                    mode: "no-cors",
                })
                    .then(response => {
                        if (!response.ok) {
                            avatarOk = false;
                        }
                    })
                    .catch(error => {
                        avatarOk = false;
                    })
                    .finally(async () => {
                        if (!avatarOk) {
                            let resp = await customAxios({ url: \`${'${apiPath}'}/user/profile${'${sync_to}'}\`, method: "PATCH", headers: { Authorization: \`Bearer ${'${getAuthToken()}'}\` } });
                            if (resp.status === 200) {
                                setUsers(users => ({ ...users, [curUser.uid]: resp.data }));
                            }
                        }
                    });`;

const fixedImplementation = `                const avatar = new Image();
                avatar.onerror = async () => {
                    const resp = await customAxios({ url: \`${'${apiPath}'}/user/profile${'${sync_to}'}\`, method: "PATCH", headers: { Authorization: \`Bearer ${'${getAuthToken()}'}\` } });
                    if (resp.status === 200) {
                        setUsers(users => ({ ...users, [curUser.uid]: resp.data }));
                    }
                };
                avatar.src = curUser.avatar;`;

if (source.includes(oldImplementation)) {
    source = source.replace(oldImplementation, fixedImplementation);
} else if (!source.includes(fixedImplementation)) {
    throw new Error("Unsupported avatar refresh implementation.");
}

fs.writeFileSync(path, source);
