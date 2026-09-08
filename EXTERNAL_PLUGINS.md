# External plugins

Drivers Hub can load Python plugins in addition to its built-in plugins. This
deployment provides `external_plugins/` for operator-supplied plugin files.

Place the plugin entry file directly in this directory. Keep any directories
required by that plugin below it. For example:

```text
external_plugins/
├── example-plugin.py
└── example-plugin-files/
    └── helper.py
```

Add the entry file name without `.py` to `external_plugins` in
`config/config.json`:

```json
"external_plugins": [
    "client-config",
    "example-plugin"
]
```

Keep `client-config`; the web frontend depends on it. Restart the backend after
you add, remove, or update an external plugin:

```bash
docker compose restart backend
docker compose logs --tail=100 backend
```

A backend image rebuild is not required. At container start, the deployment
copies the external plugins supplied by the upstream backend into the mounted
directory. Additional operator-supplied files remain in place.

External plugins run as part of the backend and have access to its application
state and credentials. Use only plugins from a source that you trust and
review updates before you install them.
