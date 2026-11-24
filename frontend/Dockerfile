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
COPY frontend/docker/dlog-event-presentation.patch /tmp/dlog-event-presentation.patch
COPY frontend/docker/merge-coach-arrival.mjs /tmp/merge-coach-arrival.mjs
COPY frontend/docker/handle-empty-trailers.mjs /tmp/handle-empty-trailers.mjs
COPY frontend/docker/remove-obsolete-radios.mjs /tmp/remove-obsolete-radios.mjs
COPY frontend/docker/use-config-url-api-path.mjs /tmp/use-config-url-api-path.mjs
COPY frontend/docker/configure-caddy-api-prefix.mjs /tmp/configure-caddy-api-prefix.mjs
COPY frontend/docker/configure-map-base-url.mjs /tmp/configure-map-base-url.mjs
COPY frontend/docker/configure-live-map-url.mjs /tmp/configure-live-map-url.mjs
COPY frontend/docker/fit-dlog-route.mjs /tmp/fit-dlog-route.mjs
COPY frontend/docker/set-map-initial-zoom.mjs /tmp/set-map-initial-zoom.mjs
COPY frontend/docker/simplify-login-methods.mjs /tmp/simplify-login-methods.mjs
COPY frontend/docker/stabilize-member-dismissal.patch /tmp/stabilize-member-dismissal.patch
COPY frontend/docker/fix-member-csv-export.mjs /tmp/fix-member-csv-export.mjs
COPY frontend/caddy/Caddyfile /tmp/Caddyfile
RUN grep -q 'VITE_HCAPTCHA_SITEKEY' src/routes/auth/login.js \
    && ! grep -q '1788882d-3695-4807-abac-7d7166ec6325' src/routes/auth/login.js \
    && grep -q 'headers: config.headers' src/functions.js \
    && test "$(grep -h 'proxy?url=' src/routes/announcement.js src/routes/application/all.js src/routes/event.js src/routes/member-list.js | grep -c 'Authorization:')" -eq 4

RUN if grep -q 'const EVENT_ICON =' src/routes/delivery.js; then \
        patch --batch --fuzz=0 -p1 < /tmp/dlog-event-presentation.patch; \
    elif grep -q 'function GetEventPresentation' src/routes/delivery.js; then \
        echo "Upstream already supports vehicle-aware delivery events; skip the deployment patch."; \
    else \
        echo "Unsupported upstream delivery event implementation." >&2; \
        exit 1; \
    fi \
    && grep -q 'DirectionsCarRounded' src/routes/delivery.js \
    && grep -q 'DepartureBoardRounded' src/routes/delivery.js \
    && grep -q 'satisfaction_increase' src/routes/delivery.js
RUN node /tmp/merge-coach-arrival.mjs \
    && grep -q 'tr("coach_departure")' src/routes/delivery.js \
    && grep -q 'tr("coach_arrival")' src/routes/delivery.js \
    && grep -q 'event.type === "job.delivered"' src/routes/delivery.js \
    && grep -q 'isDeparture || isArrival ? "lightgreen"' src/routes/delivery.js \
    && grep -q 'const segmentPassengers = e.meta?.coach_stop?.passengers' src/routes/delivery.js \
    && grep -q 'e.meta?.passengers_in' src/routes/delivery.js \
    && grep -q 'followingSegmentEvent' src/routes/delivery.js \
    && grep -q 'dlogDetail.events.map' src/routes/delivery.js \
    && ! grep -q 'dlogDetail.events.filter.*job.delivered' src/routes/delivery.js
RUN node /tmp/handle-empty-trailers.mjs \
    && grep -q 'Array.isArray(detail.trailers)' src/routes/delivery.js \
    && grep -q 'finally {' src/routes/delivery.js
RUN patch --batch --fuzz=0 -p1 < /tmp/stabilize-member-dismissal.patch \
    && grep -q 'membershipUseridRef.current = -1' src/components/usercard.js \
    && grep -q 'onDismiss={refreshMemberList}' src/routes/member-list.js
RUN node /tmp/fix-member-csv-export.mjs \
    && grep -q 'Papa.unparse' src/routes/member-list.js \
    && grep -q 'import Papa from "papaparse"' src/routes/member-list.js \
    && ! grep -q 'let csv = "uid,userid' src/routes/member-list.js

RUN grep -q 'const LEGAL_LINK_KEYS =' src/App.js \
    && grep -q 'essential_cookies_notice' src/App.js \
    && grep -q 'legal_urls' src/routes/config.js \
    && grep -q 'validatedSourceRepositories' src/App.js \
    && grep -q 'position: "relative", zIndex: 1' src/App.js \
    && ! grep -q 'source_repositories' src/routes/config.js \
    && if grep -q 'const GOOGLE_ANALYTICS_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;' src/App.js; then \
        grep -q 'if (GOOGLE_ANALYTICS_ID &&' src/App.js \
        && ! grep -q 'G-SLZ5TY9MVN' src/App.js; \
    else \
        ! grep -Eq 'googletagmanager|google-analytics|G-SLZ5TY9MVN|GOOGLE_ANALYTICS_ID' src/App.js; \
    fi
RUN node /tmp/remove-obsolete-radios.mjs
RUN node /tmp/use-config-url-api-path.mjs
RUN grep -q 'useMemo, useContext, useEffect' src/components/crashed.js \
    && grep -q 'componentDidCatch(error, errorInfo)' src/index.js \
    && grep -q 'Drivers Hub rendering failed' src/index.js
RUN grep -q 'alpha, useTheme' src/components/statcard.js \
    && test "$(grep -c 'alpha(color' src/components/statcard.js)" -eq 3 \
    && ! grep -q 'color + "75"' src/components/statcard.js
RUN test "$(grep -o 'PROFILE_COLOR\[theme.palette.mode\]' src/components/usercard.js | wc -l)" -eq 12 \
    && test "$(grep -o 'DEFAULT_BGCOLOR\[theme.palette.mode\]' src/routes/settings.js | wc -l)" -eq 8 \
    && ! grep -q '\[theme.mode\]' src/components/usercard.js src/routes/settings.js
RUN grep -q 'const avatar = new Image()' src/functions.js \
    && ! grep -q 'fetch(curUser.avatar' src/functions.js
RUN grep -q 'function clearInvalidSession(errorResponse)' src/functions.js \
    && grep -q 'eraseCookie("auth-mode")' src/functions.js \
    && grep -q 'window.location.replace("/auth/login")' src/functions.js

ARG VITE_CONFIG_URL
ARG VITE_HCAPTCHA_SITEKEY
ARG VITE_MAP_BASE_URL=https://map.charlws.com
ARG VITE_LIVE_MAP_URL=

ENV ASSETS_BASE="/" \
    VITE_USE_MULTIHUB=false \
    VITE_MULTIHUB_DISCOVERY="" \
    VITE_CONFIG_URL=${VITE_CONFIG_URL} \
    VITE_HCAPTCHA_SITEKEY=${VITE_HCAPTCHA_SITEKEY} \
    VITE_MAP_BASE_URL=${VITE_MAP_BASE_URL} \
    VITE_LIVE_MAP_URL=${VITE_LIVE_MAP_URL}

RUN test -n "$VITE_HCAPTCHA_SITEKEY" \
    || (echo "VITE_HCAPTCHA_SITEKEY must be set." >&2; exit 1)

RUN test -n "$VITE_MAP_BASE_URL" \
    || (echo "VITE_MAP_BASE_URL must be set." >&2; exit 1)

RUN node /tmp/configure-map-base-url.mjs
RUN node /tmp/configure-live-map-url.mjs \
    && grep -q 'VITE_LIVE_MAP_URL === undefined' src/routes/map.js \
    && grep -q 'tracker.ets2map.com/v3/area' src/routes/map.js
RUN node /tmp/fit-dlog-route.mjs \
    && grep -q 'fitRoute = false' src/components/tilemap.js \
    && grep -q 'getView().fit(routeGeometry' src/components/tilemap.js \
    && grep -q 'fitRoute' src/routes/delivery.js
RUN node /tmp/set-map-initial-zoom.mjs \
    && grep -q 'initialZoom = 1' src/components/tilemap.js \
    && grep -q 'zoom: initialZoom' src/components/tilemap.js \
    && test "$(grep -c 'initialZoom={2}' src/routes/map.js)" -eq 5
RUN node /tmp/simplify-login-methods.mjs \
    && grep -q '{tr("or_login_with")}:' src/routes/auth/login.js \
    && ! grep -q 'register_methods.map' src/routes/auth/login.js \
    && grep -q '"or_login_with": "Oder fortfahren mit"' src/languages/de.json \
    && grep -q '"or_login_with": "Or continue with"' src/languages/en.json
RUN grep -q 'const calendarLanguage = userSettings.language' src/routes/event.js \
    && grep -q 'firstDay % 7' src/routes/event.js \
    && grep -q 'firstDay={getFirstDay(calendarLanguage)}' src/routes/event.js

RUN if [ "$VITE_USE_MULTIHUB" != "true" ]; then \
        case "$VITE_CONFIG_URL" in \
            */client/config/global|*/client/config/global/) ;; \
            *) echo "VITE_CONFIG_URL must end with /client/config/global." >&2; exit 1 ;; \
        esac; \
    fi

RUN node /tmp/configure-caddy-api-prefix.mjs

RUN npm run build:dev \
    && test -n "$(find build/assets -type f -name '*.map' -print -quit)"

RUN grep -Eq '(src|href)="/assets/' build/index.html \
    && ! grep -Eq '(src|href)="assets/' build/index.html

# Electron entry points are not part of the web deployment.
RUN rm -f \
    build/electron-config.json \
    build/electron.js \
    build/preload.js

FROM caddy:2-alpine AS runtime

COPY --from=builder /tmp/Caddyfile /etc/caddy/Caddyfile
COPY frontend/caddy/geoip/ /etc/caddy/geoip/
COPY config/caddy/sites/00-placeholder.caddy /etc/caddy/sites/00-placeholder.caddy
COPY --from=builder /build/build/ /srv/

EXPOSE 80 443 443/udp 8080
