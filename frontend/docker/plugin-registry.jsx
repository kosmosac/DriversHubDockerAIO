import { useContext } from "react";
import { Navigate, Route, Link } from "react-router-dom";
import { Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { ExtensionRounded } from "@mui/icons-material";
import { AppContext } from "./context";

const modules = import.meta.glob("./external_plugins/*/index.jsx", { eager: true });
const plugins = Object.entries(modules).map(([file, module]) => {
  const plugin = module.default;
  const directory = file.split("/").at(-2);
  if (!plugin || plugin.id !== directory || !/^[a-z][a-z0-9_-]*$/.test(directory)) {
    throw new Error(`Invalid frontend plugin entry: ${file}`);
  }
  if (!Array.isArray(plugin.routes) || !Array.isArray(plugin.menu)) {
    throw new Error(`Frontend plugin ${directory} must define routes and menu arrays`);
  }
  const prefix = `/ext/${directory}`;
  for (const route of plugin.routes) {
    if (typeof route.path !== "string" || (route.path !== prefix && !route.path.startsWith(`${prefix}/`)) || !route.component) {
      throw new Error(`Invalid route in frontend plugin ${directory}`);
    }
  }
  for (const item of plugin.menu) {
    if (!plugin.routes.some(route => route.path === item.path) || typeof item.label !== "string") {
      throw new Error(`Invalid menu entry in frontend plugin ${directory}`);
    }
  }
  return plugin;
});

const visible = (entry, curUID, curUserPerm) =>
  (entry.requiresLogin === false || curUID !== null) &&
  (!entry.permissionsAny || entry.permissionsAny.some(permission => curUserPerm.includes(permission)));

function PluginPage({ plugin, route }) {
  const { webConfig, curUID, curUserPerm } = useContext(AppContext);
  if (!webConfig?.external_plugins?.includes(plugin.id)) return <Navigate to="/404" replace />;
  if (route.requiresLogin !== false && curUID === null) return <Navigate to="/auth/login" replace />;
  if (!visible(route, curUID, curUserPerm)) return <Navigate to="/404" replace />;
  const Component = route.component;
  return <Component />;
}

export function frontendPluginRoutes() {
  return plugins.flatMap(plugin => plugin.routes.map(route =>
    <Route key={`${plugin.id}:${route.path}`} path={route.path} element={<PluginPage plugin={plugin} route={route} />} />
  ));
}

export function FrontendPluginNavigation() {
  const { webConfig, curUID, curUserPerm } = useContext(AppContext);
  const items = plugins.flatMap(plugin =>
    webConfig?.external_plugins?.includes(plugin.id)
      ? plugin.menu.filter(item => visible(item, curUID, curUserPerm)).map(item => ({ ...item, pluginId: plugin.id }))
      : []
  );
  if (items.length === 0) return null;
  return <>
    <Divider />
    <List sx={{ margin: "0px 10px 0 10px" }}>
      {items.map(item => <Link key={`${item.pluginId}:${item.path}`} to={item.path}>
        <ListItem disablePadding>
          <ListItemButton selected={window.location.pathname === item.path}>
            <ListItemIcon sx={{ minWidth: "40px" }}>{item.icon || <ExtensionRounded />}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        </ListItem>
      </Link>)}
    </List>
  </>;
}
