import { readFileSync, writeFileSync } from "node:fs";

function insertOnce(path, marker, addition) {
  const source = readFileSync(path, "utf8");
  if (source.includes(addition)) return;
  if (source.split(marker).length !== 2) throw new Error(`Unsupported upstream frontend source: ${path}`);
  writeFileSync(path, source.replace(marker, addition + marker));
}

insertOnce("src/App.js", 'import { readLS } from "./functions.js";', 'import { frontendPluginRoutes } from "./frontend-plugin-registry";\n');
insertOnce("src/App.js", '                                        <Route path="*" element={<NotFound />}></Route>', '                                        {frontendPluginRoutes()}\n');
insertOnce("src/components/sidebar.js", 'import SimpleBar from "simplebar-react";', 'import { FrontendPluginNavigation } from "../frontend-plugin-registry";\n');
insertOnce("src/components/sidebar.js", '    </SimpleBar>\n  );', '      <FrontendPluginNavigation />\n');
