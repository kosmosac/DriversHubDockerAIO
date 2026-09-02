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
COPY backend/docker/client-config.patch ./docker/client-config.patch
COPY backend/docker/client-config-upstream-domain.patch ./docker/client-config-upstream-domain.patch
COPY backend/docker/frontend-domain.patch ./docker/frontend-domain.patch
COPY backend/docker/nuitka-jobs.patch ./docker/nuitka-jobs.patch
COPY backend/docker/smtp-encryption.patch ./docker/smtp-encryption.patch
COPY backend/docker/tracksim-validation.patch ./docker/tracksim-validation.patch

RUN if grep -q 'def normalize_client_config(config, plugins, abbr, frontend_domain, api_host):' src/external_plugins/client-config.py \
        && grep -q 'config\["domain"\] = frontend_domain' src/external_plugins/client-config.py \
        && grep -q 'config\["api_host"\] = api_host' src/external_plugins/client-config.py \
        && grep -q 'frontend_conf\["api_host"\] = api_host' src/external_plugins/client-config.py; then \
        echo "Compatible upstream client-config implementation detected."; \
    elif grep -q 'def normalize_client_config(config, frontend_member_url):' src/external_plugins/client-config.py; then \
        patch --batch --fuzz=0 -p1 < docker/client-config-upstream-domain.patch; \
    elif ! grep -q 'def normalize_client_config' src/external_plugins/client-config.py; then \
        patch --batch --fuzz=0 -p1 < docker/client-config.patch; \
    else \
        echo "Unsupported upstream client-config implementation." >&2; \
        exit 1; \
    fi \
    && test "$(grep -c 'normalize_client_config(json.loads' src/external_plugins/client-config.py)" -eq 2 \
    && grep -q 'def normalize_client_config(config, plugins, abbr, frontend_domain, api_host):' src/external_plugins/client-config.py \
    && grep -q 'config\["domain"\] = frontend_domain' src/external_plugins/client-config.py \
    && grep -q 'config\["api_host"\] = api_host' src/external_plugins/client-config.py \
    && grep -q '"api_host": f"https://{config' src/external_plugins/client-config.py \
    && grep -q 'frontend_conf\["abbr"\] = config\["abbr"\]' src/external_plugins/client-config.py \
    && grep -q 'frontend_conf\["plugins"\] = config\["plugins"\]' src/external_plugins/client-config.py \
    && grep -q 'frontend_conf\["domain"\] = frontend_domain' src/external_plugins/client-config.py \
    && grep -q 'frontend_conf\["api_host"\] = api_host' src/external_plugins/client-config.py \
    && if grep -q 'cfg\["frontend_urls"\]\[key\] = cfg\["frontend_urls"\]\[key\].replace("{domain}", cfg\["domain"\])' src/config.py; then \
        echo "Upstream frontend domain expansion detected; patch is not required."; \
    else \
        patch --batch --fuzz=0 -p1 < docker/frontend-domain.patch; \
    fi \
    && grep -q 'cfg\["frontend_urls"\]\[key\] = cfg\["frontend_urls"\]\[key\].replace("{domain}", cfg\["domain"\])' src/config.py \
    && patch --batch --fuzz=0 -p1 < docker/nuitka-jobs.patch \
    && test "$(grep -c -- '--jobs=$(NUITKA_JOBS)' makefile)" -eq 2 \
    && if grep -q '"smtp_encryption": "starttls"' src/config.py \
        && grep -q 'use_tls = smtp_encryption == "tls"' src/functions/mail.py \
        && grep -q 'start_tls = smtp_encryption == "starttls"' src/functions/mail.py; then \
        echo "Upstream SMTP encryption support detected; patch is not required."; \
    elif ! grep -q 'smtp_encryption' src/config.py \
        && ! grep -q 'smtp_encryption' src/functions/mail.py; then \
        patch --batch --fuzz=0 -p1 < docker/smtp-encryption.patch; \
    else \
        echo "Unsupported upstream SMTP implementation." >&2; \
        exit 1; \
    fi \
    && grep -q '"smtp_encryption": "starttls"' src/config.py \
    && grep -q 'use_tls = smtp_encryption == "tls"' src/functions/mail.py \
    && grep -q 'start_tls = smtp_encryption == "starttls"' src/functions/mail.py \
    && grep -q 'hostname=app.config.smtp_host' src/functions/mail.py \
    && if grep -q 'def valid_job_payload(data):' src/apis/tracker/tracksim.py \
        && grep -q '"Invalid TrackSim webhook payload."' src/apis/tracker/tracksim.py; then \
        echo "Upstream TrackSim payload validation detected; patch is not required."; \
    elif ! grep -q 'valid_job_payload' src/apis/tracker/tracksim.py \
        && ! grep -q 'Invalid TrackSim webhook payload' src/apis/tracker/tracksim.py; then \
        patch --batch --fuzz=0 -p1 < docker/tracksim-validation.patch; \
    else \
        echo "Unsupported upstream TrackSim validation implementation." >&2; \
        exit 1; \
    fi \
    && grep -q 'def valid_job_payload(data):' src/apis/tracker/tracksim.py \
    && grep -q 'response.status_code = 422' src/apis/tracker/tracksim.py \
    && grep -q '"Invalid TrackSim webhook payload."' src/apis/tracker/tracksim.py

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
COPY --from=builder --chown=drivershub:drivershub /build/src/external_plugins/ ./external_plugins/
COPY --chown=root:root backend/docker/entrypoint.sh /usr/local/bin/drivershub-entrypoint

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

ENV DRIVERSHUB_SOURCE_RUNTIME=1

EXPOSE 7777 8700

ENTRYPOINT ["drivershub-entrypoint"]
CMD ["drivershub", "--config", "/app/config/config.json", "--banner-service-url", "http://bannergen:8700/banner"]
