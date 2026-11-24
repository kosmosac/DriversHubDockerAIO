# syntax=docker/dockerfile:1

# Keep the compiler base stable so that runtime-only updates reuse the Nuitka layer.
FROM python:3.12-trixie@sha256:ef1735ee20f31133880795148379e68f8fe12f4b7a1872075477567f022edc1f AS build-base

WORKDIR /build

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ccache \
        gcc \
        g++ \
        libmariadb-dev \
        make \
        patch \
        patchelf \
        python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY upstream/HubBackend/requirements.txt upstream/HubBackend/makefile ./

FROM build-base AS dependencies

RUN --mount=type=cache,target=/root/.cache/pip \
    make install-python

FROM build-base AS patched-source

COPY upstream/HubBackend/src ./src
COPY upstream/HubBackend/config_sample.json upstream/HubBackend/openapi.json ./
COPY upstream/HubBackend/docs/config.jsonc ./docs/config.jsonc
COPY examples/economy-garages.json ./docker/economy-garages.json
COPY backend/docker/configure-legal-links.py ./docker/configure-legal-links.py
COPY backend/docker/update-economy-garages.py ./docker/update-economy-garages.py
COPY backend/docker/nuitka-jobs.patch ./docker/nuitka-jobs.patch
COPY backend/docker/normalize-empty-trailers.py ./docker/normalize-empty-trailers.py
COPY backend/docker/normalize-coach-stops.py ./docker/normalize-coach-stops.py
COPY backend/docker/coach-statistics-name.patch ./docker/coach-statistics-name.patch
COPY backend/docker/geoip-session-transition.patch ./docker/geoip-session-transition.patch
COPY backend/docker/trucky-job-types.patch ./docker/trucky-job-types.patch
COPY backend/docker/preserve-worker-arguments.patch ./docker/preserve-worker-arguments.patch
COPY backend/docker/fix-csv-exports.py ./docker/fix-csv-exports.py

RUN test "$(grep -c 'normalize_client_config(json.loads' src/external_plugins/client-config.py)" -eq 2 \
    && grep -q 'def normalize_client_config(config, plugins, frontend_domain, api_host, source_repositories):' src/external_plugins/client-config.py \
    && grep -q 'config\["domain"\] = frontend_domain' src/external_plugins/client-config.py \
    && grep -q 'config\["api_host"\] = api_host' src/external_plugins/client-config.py \
    && grep -q '"api_host": f"https://{config' src/external_plugins/client-config.py \
    && grep -q '"abbr": config\["abbr"\]' src/external_plugins/client-config.py \
    && grep -q 'frontend_conf\["plugins"\] = config\["plugins"\]' src/external_plugins/client-config.py \
    && grep -q 'frontend_conf\["domain"\] = frontend_domain' src/external_plugins/client-config.py \
    && grep -q 'frontend_conf\["api_host"\] = api_host' src/external_plugins/client-config.py \
    && grep -q 'cfg\["frontend_urls"\]\[key\] = cfg\["frontend_urls"\]\[key\].replace("{domain}", cfg\["domain"\])' src/config.py \
    && patch --batch --fuzz=0 -p1 < docker/nuitka-jobs.patch \
    && test "$(grep -c -- '--jobs=$(NUITKA_JOBS)' makefile)" -eq 2 \
    && grep -q '"smtp_encryption": "starttls"' src/config.py \
    && grep -q 'use_tls = smtp_encryption == "tls"' src/functions/mail.py \
    && grep -q 'start_tls = None if smtp_encryption == "auto" else smtp_encryption == "starttls"' src/functions/mail.py \
    && grep -q 'hostname=app.config.smtp_host' src/functions/mail.py \
    && grep -q 'case "car_job.delivered" | "car_job.cancelled":' src/apis/tracker/tracksim.py \
    && grep -q 'case "bus_job.completed" | "bus_job.cancelled":' src/apis/tracker/tracksim.py \
    && grep -q 'api.tracksim.app/v2/jobs/{trackerid}/route?job_type={route_job_type}' src/apis/tracker/tracksim.py \
    && grep -q 'event\["meta"\].setdefault("max_speed", event\["meta"\].get("speed"))' src/apis/tracker/tracksim.py \
    && grep -q 'event_meta = data\["events"\]\[-1\].get("meta", {})' src/functions/tracker.py \
    && patch --batch --fuzz=0 -p1 < docker/trucky-job-types.patch \
    && patch --batch --fuzz=0 -p1 < docker/preserve-worker-arguments.patch \
    && grep -q 'DRIVERSHUB_WORKER_ARGUMENTS' src/main.py \
    && grep -q 'is_coach_job = d.get("stats_type") == "coaches_real_miles"' src/apis/tracker/trucky.py \
    && grep -q 'startswith("road_trip_")' src/apis/tracker/trucky.py \
    && grep -q '"penalty": abs(d\["income"\])' src/apis/tracker/trucky.py \
    && test "$(grep -c '"Invalid Trucky webhook payload."' src/apis/tracker/trucky.py)" -eq 3 \
    && grep -q 'response.status_code = 422' src/apis/tracker/unitracker.py \
    && grep -q '"Invalid UniTracker webhook payload."' src/apis/tracker/unitracker.py \
    && grep -q 'data\["multiplayer"\] is not None and "type" in data\["multiplayer"\].keys()' src/apis/dlog/export.py \
    && grep -q 'DOMAIN_WHITELIST = \["api.truckersmp.com"\]' src/external_plugins/proxy.py \
    && grep -q 'authorization: str = Header(None)' src/external_plugins/proxy.py \
    && grep -q 'au = await auth(authorization, request)' src/external_plugins/proxy.py \
    && if grep -q 'country == "XX" and curCountry in ISO_COUNTRIES' src/functions/security.py; then \
        echo "Compatible unknown-to-known session country transition detected."; \
    elif grep -q 'if curCountry != country and country != "":' src/functions/security.py; then \
        patch --batch --fuzz=0 -p1 < docker/geoip-session-transition.patch; \
    else \
        echo "Unsupported session country validation implementation." >&2; \
        exit 1; \
    fi \
    && grep -q 'country == "XX" and curCountry in ISO_COUNTRIES' src/functions/security.py \
    && python docker/configure-legal-links.py \
    && grep -q 'LEGAL_URL_KEYS =' src/external_plugins/client-config.py \
    && grep -q 'newconfig\["legal_urls"\] = normalized_legal_urls' src/external_plugins/client-config.py \
    && grep -Eq 'SOURCE_REPOSITORIES =|app.config.source_repositories' src/external_plugins/client-config.py \
    && grep -Rq 'DriversHubDockerAIO' src/config.py src/external_plugins/client-config.py \
    && python docker/update-economy-garages.py \
        --garages docker/economy-garages.json \
        --config config_sample.json \
        --python-source src/config.py \
    && test "$(python -c 'import json; print(len(json.load(open("config_sample.json"))["economy"]["garages"]))')" -eq 361

RUN python docker/normalize-empty-trailers.py \
    && grep -q 'job.setdefault("trailers", \[\])' src/apis/tracker/tracksim.py \
    && grep -q 'job\["trailers"\] = \[\]' src/apis/tracker/tracksim.py

RUN python docker/fix-csv-exports.py \
    && test "$(grep -c 'csv_writer.writerow(single_line_csv_row(data))' src/apis/dlog/export.py)" -eq 1 \
    && test "$(grep -c 'csv_writer.writerow(single_line_csv_row(data))' src/plugins/economy/balance.py)" -eq 1 \
    && ! grep -Fq 'f.write(",".join(data)' src/apis/dlog/export.py src/plugins/economy/balance.py

RUN python docker/normalize-coach-stops.py \
    && grep -q 'coach_stop_events = \[\]' src/apis/tracker/tracksim.py \
    && grep -q '"type": "coach.stop"' src/apis/tracker/tracksim.py \
    && grep -q 'merged_satisfaction_events' src/apis/tracker/tracksim.py \
    && grep -q 'time_anchors.sort()' src/apis/tracker/tracksim.py \
    && grep -q 'progress = (arrival_game_time - previous_anchor\[0\])' src/apis/tracker/tracksim.py

RUN if grep -q 'cargo_name = "Coach Passengers" if cargo\["unique_id"\] == "coach_passengers"' src/apis/dlog/statistics.py; then \
        echo "Compatible Coach statistics naming detected; skip the deployment patch."; \
    else \
        patch --batch --fuzz=0 -p1 < docker/coach-statistics-name.patch; \
    fi \
    && test "$(grep -Rh 'cargo_name = "Coach Passengers" if cargo\["unique_id"\] == "coach_passengers"' src/apis/dlog/statistics.py src/threads.py | wc -l)" -eq 3

FROM patched-source AS builder

COPY --from=dependencies /build/.venv-build/ ./.venv-build/

ARG BACKEND_BUILD_JOBS=2

RUN case "$BACKEND_BUILD_JOBS" in \
        ''|*[!0-9]*|0) echo "BACKEND_BUILD_JOBS must be a positive integer." >&2; exit 1 ;; \
    esac

# Compile the binaries from the backend source code. Cache the build data.
RUN --mount=type=cache,target=/root/.cache/pip \
    --mount=type=cache,target=/root/.cache/ccache \
    make -j1 NUITKA_JOBS="$BACKEND_BUILD_JOBS" build

FROM debian:trixie-slim AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates gosu \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 10001 drivershub \
    && useradd --system --uid 10001 --gid drivershub --home-dir /app drivershub

WORKDIR /app

COPY --from=builder --chown=drivershub:drivershub /build/dist/ ./
COPY --from=builder --chown=drivershub:drivershub /build/src/external_plugins/ /usr/local/share/drivershub/external_plugins/
COPY --chown=root:root backend/docker/entrypoint.sh /usr/local/bin/drivershub-entrypoint

RUN mkdir -p /app/external_plugins \
    && chown drivershub:drivershub /app/external_plugins

EXPOSE 7777 8700

ENTRYPOINT ["drivershub-entrypoint"]
CMD ["drivershub", "--config", "/app/config/config.json", "--banner-service-url", "http://bannergen:8700/banner"]

FROM python:3.12-trixie@sha256:ef1735ee20f31133880795148379e68f8fe12f4b7a1872075477567f022edc1f AS source-runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates gosu \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 10001 drivershub \
    && useradd --system --uid 10001 --gid drivershub --home-dir /app drivershub

WORKDIR /app

COPY --from=dependencies --chown=drivershub:drivershub /build/.venv-build/ ./.venv/
COPY --from=patched-source --chown=drivershub:drivershub /build/src/ ./
COPY --from=patched-source --chown=drivershub:drivershub /build/openapi.json ./openapi.json
COPY --chown=root:root backend/docker/entrypoint.sh /usr/local/bin/drivershub-entrypoint

RUN mkdir -p /usr/local/share/drivershub/external_plugins \
    && cp -a /app/external_plugins/. /usr/local/share/drivershub/external_plugins/ \
    && rm -rf /app/external_plugins \
    && mkdir /app/external_plugins \
    && chown -R drivershub:drivershub /app/external_plugins /usr/local/share/drivershub/external_plugins

ENV DRIVERSHUB_SOURCE_RUNTIME=1

EXPOSE 7777 8700

ENTRYPOINT ["drivershub-entrypoint"]
CMD ["drivershub", "--config", "/app/config/config.json", "--banner-service-url", "http://bannergen:8700/banner"]
