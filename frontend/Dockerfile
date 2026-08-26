# syntax=docker/dockerfile:1

FROM node:25-bookworm-slim AS builder

WORKDIR /build

ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1

RUN apt-get update \
    && apt-get install --yes --no-install-recommends patch \
    && rm -rf /var/lib/apt/lists/*

COPY upstream/HubFrontend/package.json upstream/HubFrontend/package-lock.json upstream/HubFrontend/.npmrc ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY upstream/HubFrontend/ ./
COPY frontend/docker/hcaptcha-sitekey.patch /tmp/hcaptcha-sitekey.patch
COPY frontend/docker/remove-analytics.mjs /tmp/remove-analytics.mjs
COPY frontend/docker/replace-fallback-avatar.mjs /tmp/replace-fallback-avatar.mjs
COPY frontend/docker/use-config-url-api-path.mjs /tmp/use-config-url-api-path.mjs

RUN if grep -q 'sitekey="1788882d-3695-4807-abac-7d7166ec6325"' src/routes/auth/login.js; then \
        patch -p1 < /tmp/hcaptcha-sitekey.patch; \
    elif grep -q 'VITE_HCAPTCHA_SITEKEY' src/routes/auth/login.js; then \
        echo "Upstream already supports VITE_HCAPTCHA_SITEKEY; skip the deployment patch."; \
    else \
        echo "Unsupported upstream hCaptcha configuration." >&2; \
        exit 1; \
    fi

RUN node /tmp/remove-analytics.mjs
RUN node /tmp/replace-fallback-avatar.mjs
RUN node /tmp/use-config-url-api-path.mjs

ARG VITE_CONFIG_URL
ARG VITE_HCAPTCHA_SITEKEY

ENV ASSETS_BASE="" \
    VITE_USE_MULTIHUB=false \
    VITE_MULTIHUB_DISCOVERY="" \
    VITE_CONFIG_URL=${VITE_CONFIG_URL} \
    VITE_HCAPTCHA_SITEKEY=${VITE_HCAPTCHA_SITEKEY}

RUN test -n "$VITE_HCAPTCHA_SITEKEY" \
    || (echo "VITE_HCAPTCHA_SITEKEY must be set." >&2; exit 1)

RUN if [ "$VITE_USE_MULTIHUB" != "true" ]; then \
        case "$VITE_CONFIG_URL" in \
            */client/config/global|*/client/config/global/) ;; \
            *) echo "VITE_CONFIG_URL must end with /client/config/global." >&2; exit 1 ;; \
        esac; \
    fi

RUN npm run build

# Electron entry points are not part of the web deployment.
RUN rm -f \
    build/electron-config.json \
    build/electron.js \
    build/preload.js

FROM caddy:2-alpine AS runtime

COPY frontend/caddy/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /build/build/ /srv/

EXPOSE 80 443 443/udp 8080
