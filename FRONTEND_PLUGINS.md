# Frontend plugins

The AIO frontend can include additional React pages from
`frontend_plugins/` when its image is built. Each plugin has its own directory
and an `index.jsx` entry point. This is useful for self-contained features
that need their own pages, without changing the Hub's existing pages.

A compiled plugin is shown only when the matching backend external plugin is
loaded. Add the backend plugin to `external_plugins` in `config/config.json`.
Rebuild the frontend image after adding or changing frontend plugin code; a
backend-only plugin update still only needs a backend restart.

## Try the frontend plugin example

This repository includes a frontend plugin in
`frontend_plugins/frontend-plugin-example/` and a matching, minimal backend
plugin in `external_plugins/frontend-plugin-example.py`. The backend plugin
adds only the read-only `/frontend-plugin-example/message` endpoint. It does
not replace built-in routes or register global handlers.

Add `"frontend-plugin-example"` to the `external_plugins` array in
`config/config.json`, keeping its existing entries. Build both images and
restart the services:

```bash
docker compose build backend frontend
docker compose up -d backend frontend
```

Log in and open **Frontend plugin example** in the sidebar. The page shows the
Hub name returned by the backend. Check `/api/client/config/global` for the
`external_plugins` field if the menu does not appear (replace `/api` if your
backend uses a different prefix).

The frontend example remains bundled into the image even when its backend
counterpart is disabled. To stop using it, remove `"frontend-plugin-example"`
from `config/config.json` and restart the backend.

## Plugin entry point

For a backend plugin named `sample`, add
`frontend_plugins/sample/index.jsx`:

```jsx
import { Typography } from "@mui/material";

function ExamplePage() {
  return <Typography variant="h4">Sample plugin</Typography>;
}

export default {
  id: "sample",
  routes: [
    { path: "/ext/sample", component: ExamplePage },
  ],
  menu: [
    { path: "/ext/sample", label: "Sample" },
  ],
};
```

The `id` must match the backend external plugin name. Route and menu paths
must start with `/ext/<id>`; this namespace avoids collisions with built-in
Hub routes. `routes` contains React components, not rendered elements. A menu
entry must point to one of the plugin's routes. `menu` may be empty for pages
reached only through links. An optional `icon` can be a React element; otherwise
the frontend displays a generic extension icon.

By default a route or menu entry requires a logged-in user. Set
`requiresLogin: false` on an entry for a public page, or `permissionsAny` to
an array of Hub permission names for a restricted page. Set the same access
requirements on both the menu entry and its route. These checks control the
UI only: the backend plugin must authenticate and authorize every protected
API request itself.

Plugin components can use the existing `AppContext` to obtain `apiPath`, the
current user, and other Hub state. Call backend endpoints under `apiPath` so
the same frontend works with each Hub's API prefix. Plugins share the Hub's
React, MUI, and router dependencies; packages not already present in the
frontend image need explicit build support.

This mechanism deliberately provides independent pages and navigation, not
hooks for modifying built-in pages. It does not load arbitrary JavaScript into
an already built frontend: plugin code is reviewed and bundled during the
image build.
