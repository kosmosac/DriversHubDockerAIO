# Drivers Hub: Docker Deployment

```text
    ____       _                         __  __      __
   / __ \_____(_)   _____  __________   / / / /_  __/ /_
  / / / / ___/ / | / / _ \/ ___/ ___/  / /_/ / / / / __ \
 / /_/ / /  / /| |/ /  __/ /  (__  )  / __  / /_/ / /_/ /
/_____/_/  /_/ |___/\___/_/  /____/  /_/ /_/\__,_/_.___/
```

Docker deployment for
[Drivers Hub: Backend](https://github.com/CharlesWithC/HubBackend) and
[Drivers Hub: Frontend](https://github.com/CharlesWithC/HubFrontend).

The deployment builds both applications from their upstream source. It runs the
backend, frontend, MariaDB, Valkey, and banner generator as one Docker Compose
project. Only the frontend Caddy ports are published on the Docker host. Caddy
serves the frontend and forwards `/api` requests to the backend.

## Tested upstream revisions

This deployment is tested with:

- Drivers Hub: Backend
  [`v2.12.1`](https://github.com/CharlesWithC/HubBackend/releases/tag/v2.12.1)
  at commit `a460eed`.
- Drivers Hub: Frontend `main` at commit
  [`7bf7cfb`](https://github.com/CharlesWithC/HubFrontend/commit/7bf7cfba5474f8699aa475a3e19b5ab4ec2d38fb),
  which declares package version `3.6.0`.

The clone commands below get the current upstream default branches. A newer
upstream revision can be incompatible with this deployment. If a build or
runtime error occurs after an upstream update, compare both checked-out
revisions with the tested revisions above.

## Requirements

- Docker Engine with Docker Compose
- a public domain that points to the reverse proxy
- either an existing TLS reverse proxy or free public ports 80 and 443
- an hCaptcha site for the public Hub domain

A backend build compiles the Python application with Nuitka and can take a long
time. It uses two concurrent compiler jobs by default and builds the backend
programs one after another. Set `BACKEND_BUILD_JOBS=1` in `.env` to reduce CPU
and memory pressure on a small host. A higher value can make the build faster
but uses more host resources.

For backend development or short-term testing, set
`BACKEND_BUILD_TARGET=source-runtime` in `.env`. This target runs the patched
Python source directly and avoids Nuitka compilation. It uses the same Compose
services, configuration, and AIO compatibility patches as the normal target.
The source runtime is not recommended for production. Keep
`BACKEND_BUILD_TARGET=runtime` for a production deployment.

After you change the target or the backend source, rebuild and recreate the
backend services:

```bash
docker compose build backend
docker compose up -d --force-recreate backend bannergen
```

## Get the source code

Clone both upstream projects into this deployment repository:

```bash
git clone https://github.com/CharlesWithC/HubBackend.git upstream/HubBackend
git clone https://github.com/CharlesWithC/HubFrontend.git upstream/HubFrontend
cp .env.example .env
cp upstream/HubBackend/config_sample.json config/config.json
```

## Configure the deployment

Set secure MariaDB passwords in `.env`. Replace `hub.example.com` in
`VITE_CONFIG_URL` with the public Hub domain. Set `VITE_HCAPTCHA_SITEKEY` to the
public hCaptcha site key for the same domain. The site key is included in the
frontend files and is not a secret. The related `captcha.secret` value in
`config/config.json` must remain secret.

Vite includes these values when it builds the frontend. Rebuild the frontend
image after you change `VITE_CONFIG_URL` or `VITE_HCAPTCHA_SITEKEY`.

Set at least these values in `config/config.json`:

```json
{
    "abbr": "vtc",
    "name": "Drivers Hub",
    "domain": "hub.example.com",
    "prefix": "/api",
    "server_host": "0.0.0.0",
    "server_port": 7777,
    "db_host": "mariadb",
    "db_user": "drivershub",
    "db_password": "use the DB_PASSWORD value from .env",
    "db_name": "drivershub",
    "db_data_directory": "/var/lib/mysqlext/",
    "redis_host": "valkey",
    "redis_port": 6379,
    "captcha": {
        "provider": "hcaptcha",
        "secret": "replace with your hCaptcha secret"
    },
    "plugins": [
        "announcement",
        "application",
        "banner",
        "challenge",
        "division",
        "downloads",
        "economy",
        "event",
        "poll",
        "route",
        "task"
    ],
    "external_plugins": ["client-config"]
}
```

The example shows only values that you must review. Keep all other values from
`config_sample.json`.

Use the same database name and password in `.env` and `config/config.json`.
The configured external MariaDB table directory is stored in
`data/mariadb-external` on the host.

Set `domain` to the public Hub host name without a protocol or path. Set `abbr`
to a short VTC identifier. The frontend derives the API base from
`VITE_CONFIG_URL`, so `abbr` does not have to match `prefix`.

The backend synchronizes `abbr`, `domain`, `api_host`, and the plugin list to
the stored frontend configuration when it starts. Other frontend settings in
MariaDB stay unchanged. Restart the backend after you change one of these
values.

## Optional configuration guides

The backend supports custom role definitions, application forms, multiple job
tracker integrations, and frontend branding. It does not impose a role model,
application workflow, tracker selection, or visual identity. Operators are
free to design and configure these functions from scratch. The following
guides are optional references and can be used, changed, or ignored:

- [ROLES.md](ROLES.md) defines an example role and permission model.
- [APPLICATIONS.md](APPLICATIONS.md) defines example forms for the standard
  application types.
- [TRACKERS.md](TRACKERS.md) documents the supported tracker integrations.
- [BRANDING.md](BRANDING.md) documents the frontend branding options.

## Start the deployment

### Behind an existing reverse proxy (recommended)

```bash
docker compose build
docker compose up -d
docker compose ps -a
```

The frontend is available at `http://127.0.0.1:18080` by default. The backend,
MariaDB, Valkey, and banner generator do not publish host ports.

All services use the Compose project network. Caddy reaches the backend as
`backend:7777`. Only the frontend publishes a host port. The backend therefore
accepts forwarded client information from its Compose network without a fixed
container address or Docker subnet.

### Directly with automatic HTTPS

Use `compose.direct.yaml` when this stack must terminate TLS itself. Set
`HUB_DOMAIN` in `.env` to the public Hub domain. Its DNS records must point to
the Docker host, and public TCP ports 80 and 443 must be free and reachable.

```bash
docker compose -f compose.direct.yaml build
docker compose -f compose.direct.yaml up -d
docker compose -f compose.direct.yaml ps -a
```

Caddy obtains and renews the TLS certificate automatically. It redirects HTTP
to HTTPS and stores its persistent certificate data under `data/caddy/`.

The two Compose files are complete alternatives. Do not combine them. For all
later commands in this README, direct-mode users must replace `docker compose`
with `docker compose -f compose.direct.yaml`.

## Configure a reverse proxy

This section applies to the recommended `compose.yaml` deployment. The external
proxy must replace incoming client-IP headers. The internal Caddy server trusts
these headers only from its private network and forwards the verified client
address to the backend. The examples below contain the required headers.

Replace `hub.example.com` with the public Hub domain. Keep
`HUB_BIND=127.0.0.1:18080` unless you also update the proxy target.

### Standalone Nginx

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name hub.example.com;

    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name hub.example.com;

    ssl_certificate /etc/letsencrypt/live/hub.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hub.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:18080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Test and reload Nginx after you add the configuration:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

See the [Nginx proxy module documentation](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
for additional proxy options.

### Caddy

```caddyfile
hub.example.com {
    reverse_proxy 127.0.0.1:18080 {
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

Caddy obtains and renews the TLS certificate automatically when DNS and inbound
ports are configured correctly.

Validate and reload the external Caddy configuration:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

See the [Caddy reverse proxy documentation](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)
for additional proxy options.

### Plesk Nginx

In Plesk, use a domain or subdomain with a valid TLS certificate:

1. Open **Domains**, select the Hub domain, and open **PHP**.
2. Disable **PHP Support** and apply the change.
3. Open **Apache & nginx Settings**.
4. Disable **Proxy mode** and apply the change.
5. Add this block to **Additional nginx directives**:

```nginx
location / {
    proxy_pass http://127.0.0.1:18080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Apply the configuration. Do not add a `server` block in this field. Plesk
creates that block and manages TLS. Proxy mode must be disabled before you add
`location /`, or Plesk can create a duplicate location.

See the [Plesk reverse proxy instructions](https://support.plesk.com/hc/en-us/articles/12388464421143-How-to-pass-requests-from-a-Plesk-hosted-domain-to-the-application-listening-on-a-local-port)
for additional information.

The internal Caddy server does not publish the API schema, interactive API
documentation, or the upstream restart endpoint. The restart endpoint cannot
manage a Docker container. All application API routes remain available.

## Configure external connections

The examples use `https://hub.example.com`. Replace it with the public Hub URL.

### Discord

Create an application in the
[Discord Developer Portal](https://discord.com/developers/applications).

1. Add `https://hub.example.com/auth/discord/callback` as an OAuth2 redirect
   URL.
2. Set `discord_client_id` in `config/config.json` to the application ID.
3. Set `discord_client_secret` to the application secret.

A Discord bot is optional. It is only necessary when the Hub must check guild
membership, use guild nicknames, manage roles, or send Discord messages. For
these functions, create a bot, set `discord_bot_token` and `discord_guild_id`,
and install the bot in the guild. Give it access to each channel where it must
send messages. Give it **Manage Roles** only when the Hub must change roles,
and put its role above every role that it must manage.

If you do not install a bot, use these settings:

```json
"must_join_guild": false,
"use_server_nickname": false,
"discord_guild_id": "",
"discord_bot_token": ""
```

The external `discord-member` plugin also requires the bot. The client secret
and bot token are secrets. Reset them immediately if they become public.

### Steam

Get a Steam Web API key from the
[Steam Web API key page](https://steamcommunity.com/dev/apikey). Use the public
Hub domain when Steam asks for a domain. Set `steam_api_key` in
`config/config.json`. Steam OpenID does not require a registered callback URL.
The frontend uses `https://hub.example.com/auth/steam/callback` automatically.
The Web API key lets the backend read Steam profile information.

### TruckersMP

TruckersMP account connections use the public TruckersMP API and do not require
an API key. After you create the initial administrator, set
`truckersmp_vtc_id` in the global client configuration through the Hub
administration interface. Use the numeric ID from the TruckersMP VTC page URL.

A user must connect Steam before connecting TruckersMP. The backend checks that
both connections use the same Steam ID.

### Email

Configure SMTP when users can register with email, change or confirm an email
address, or reset a password. Set these values in `config/config.json`:

```json
"smtp_host": "smtp.example.com",
"smtp_port": "587",
"smtp_encryption": "starttls",
"smtp_email": "hub@example.com",
"smtp_password": "replace with the SMTP password"
```

Use the host, submission port, login name, and password supplied by the email
provider. Some providers use an account name instead of an email address for
the SMTP login. Set `smtp_encryption` to `starttls` for a required STARTTLS
upgrade, `tls` for TLS from the start of the connection, or `none` for an
unencrypted connection to a trusted local relay. The encryption mode is
independent of the SMTP port.

Set the public confirmation URL and keep the `{secret}` placeholder:

```json
"frontend_urls": {
    "email_confirm": "https://hub.example.com/auth/email?secret={secret}"
}
```

Do not remove the other entries from `frontend_urls`. Set `from_email` in the
`register`, `update_email`, and `reset_password` templates to a valid sender,
for example:

```json
"from_email": "Drivers Hub <hub@example.com>"
```

Restart the backend after you change SMTP settings. Test registration and
password reset before you make email registration available to users.

### Registration and required connections

Use `register_methods` in `config/config.json` to select the available
registration methods. Supported values include `email`, `discord`, and
`steam`. Use `required_connections` to select the accounts that a user must
connect. Add `truckersmp` if a TruckersMP connection is mandatory. For example:

```json
"register_methods": ["discord", "steam"],
"required_connections": ["discord", "steam", "truckersmp"]
```

Restart the backend after you change these settings. You do not have to rebuild
an image for changes in `config/config.json`.

## Create the initial administrator

The sample configuration grants `administrator` to role `0`, named `root`:

```json
"perms": {
    "administrator": [0]
},
"roles": [
    {"id": 0, "order_id": 0, "name": "root", "discord_role_id": ""}
]
```

These are excerpts. Do not replace the complete `perms` object or `roles` list
with them. Keep this relation, or use the administrator role ID from your
modified configuration. Create the user after the deployment is running:

```bash
docker compose run --rm backend \
  drivershub --config /app/config/config.json setup create-user user@example.com
```

Enter a secure password. The command returns a `UID`. Accept the user:

```bash
docker compose run --rm backend \
  drivershub --config /app/config/config.json setup accept-user UID
```

The command returns a separate user ID. Assign role `0` to that user ID. Use
your selected administrator role ID instead of `0` if you changed it:

```bash
docker compose run --rm backend \
  drivershub --config /app/config/config.json setup update-roles USER_ID 0
```

Do not interchange `UID` and `USER_ID`. You can now sign in with the email
address and password from the first command.

## Edit the configuration in the Hub

The administration interface can save configuration changes. The backend
container gives its unprivileged user, UID and GID `10001`, ownership of the
bind-mounted `config/` directory when it starts. This lets it create
`config.json.saved` and replace `config.json`. Both files stay in the project
directory on the host.

The administrator needs `update_config` to save changes and `reload_config` to
apply them. The default `administrator` permission grants both operations. The
administrator must enable MFA before applying a saved configuration.
Reloadable settings take effect without a container restart. Use
`docker compose restart backend` for settings that require a process restart.

The start process can change the numeric owner of files in `config/` to
`10001:10001` on the host. Use an account with sufficient permissions when you
edit these files directly. Do not make the directory writable by all users.

## Persistent data and backups

The deployment stores its configuration and persistent data under this
repository:

- `.env`: deployment settings and database passwords
- `config/`: backend configuration
- `data/mariadb/`: MariaDB data
- `data/mariadb-external/`: MariaDB table data stored through
  `db_data_directory`
- `data/valkey/`: Valkey append-only data
- `data/caddy/`: TLS certificates and Caddy state in direct mode

Stop the stack before a file-level backup, then back up `.env`, `config/`, and
`data/` together. Also back up the external reverse proxy configuration when
the stack does not use direct mode. `docker compose down` removes containers
and networks but does not remove these files and directories.

## Migrate from the separate deployment repositories

This section applies to installations made with the previous separate
deployment repositories:

- [HubBackendDocker](https://gitea.kosmos.ac/kosmos/HubBackendDocker)
- [HubFrontendDocker](https://gitea.kosmos.ac/kosmos/HubFrontendDocker)

These repositories remain available for existing installations, but they are
no longer maintained. Use this combined repository for new installations.

Run `docker compose down` in both previous deployment repositories before
copying data. Keep a backup until the new deployment works. Removing the old
containers also prevents name and port conflicts with the new Compose project.

1. Copy the complete backend `config/` directory to this repository.
2. Copy the complete backend `data/` directory to this repository. This includes
   `mariadb`, `mariadb-external`, and `valkey`.
3. Copy the backend `DB_NAME`, `DB_PASSWORD`, and `DB_ROOT_PASSWORD` values into
   the new `.env`.
4. Copy the frontend `VITE_CONFIG_URL` and `VITE_HCAPTCHA_SITEKEY` values into
   the new `.env`.
5. Set `HUB_BIND` for an existing reverse proxy, or set `HUB_DOMAIN` for direct
   HTTPS operation.
6. Build and start the new Compose project.

## Update

Check this AIO deployment repository for updates regularly, even when you do
not plan to update the upstream applications. Fixes for the Docker setup and
workarounds for known upstream problems are released here. Always update this
repository before you update either upstream clone. Rebuild the images after
any AIO or upstream update so that the changes become part of the running
containers.

```bash
git pull --ff-only
git -C upstream/HubBackend pull --ff-only
git -C upstream/HubFrontend pull --ff-only
docker compose build
docker compose up -d
```

Review the tested revisions near the start of this README and the compatibility
notes in [UPSTREAM.md](UPSTREAM.md) before you deploy a new upstream revision.
Direct-mode users must use `docker compose -f compose.direct.yaml` as described
above.

## Operate the deployment

```bash
# Show all service states.
docker compose ps -a

# Follow frontend and backend logs.
docker compose logs -f frontend backend

# Restart the backend after a configuration change.
docker compose restart backend

# Rebuild the frontend after a Vite setting in .env changes.
docker compose build frontend
docker compose up -d frontend

# Stop the complete deployment.
docker compose down
```

## Upstream compatibility

The deployment applies checked compatibility adjustments while it builds the
upstream source. [UPSTREAM.md](UPSTREAM.md) lists each adjustment, its upstream
issue or pull request, and the checks required for an upstream update. The
build stops when a known upstream implementation changes unexpectedly.

## Authors and license

This Docker deployment is developed by [Kosmos](https://kosmos.ac) and is
licensed under the GNU Affero General Public License v3.0. See
[LICENSE](LICENSE).

[Drivers Hub: Backend](https://github.com/CharlesWithC/HubBackend) and
[Drivers Hub: Frontend](https://github.com/CharlesWithC/HubFrontend) are
developed by [CharlesWithC](https://charlws.com) and are licensed under the GNU
Affero General Public License v3.0. Drivers Hub remains a separate upstream
project.
