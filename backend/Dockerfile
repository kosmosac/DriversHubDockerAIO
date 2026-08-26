# syntax=docker/dockerfile:1

# Keep the compiler base stable so that runtime-only updates reuse the Nuitka layer.
FROM python:3.12-trixie@sha256:ef1735ee20f31133880795148379e68f8fe12f4b7a1872075477567f022edc1f AS builder

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
COPY upstream/HubBackend/src ./src
COPY upstream/HubBackend/config_sample.json upstream/HubBackend/openapi.json ./
COPY backend/docker/client-config.patch ./docker/client-config.patch
COPY backend/docker/client-config-upstream-domain.patch ./docker/client-config-upstream-domain.patch
COPY backend/docker/nuitka-jobs.patch ./docker/nuitka-jobs.patch

RUN if grep -q 'def normalize_client_config(config, frontend_member_url):' src/external_plugins/client-config.py; then \
        patch --batch --fuzz=0 -p1 < docker/client-config-upstream-domain.patch; \
    elif ! grep -q 'def normalize_client_config' src/external_plugins/client-config.py; then \
        patch --batch --fuzz=0 -p1 < docker/client-config.patch; \
    else \
        echo "Unsupported upstream client-config implementation." >&2; \
        exit 1; \
    fi \
    && test "$(grep -c 'normalize_client_config(json.loads' src/external_plugins/client-config.py)" -eq 2 \
    && grep -q 'def normalize_client_config(config, plugins, abbr, domain):' src/external_plugins/client-config.py \
    && grep -q '"api_host": f"https://{config' src/external_plugins/client-config.py \
    && grep -q 'frontend_conf\["abbr"\] = config\["abbr"\]' src/external_plugins/client-config.py \
    && grep -q 'frontend_conf\["plugins"\] = config\["plugins"\]' src/external_plugins/client-config.py \
    && grep -Eq 'frontend_conf\["domain"\] = (config\["domain"\]|frontend_domain)' src/external_plugins/client-config.py \
    && patch --batch --fuzz=0 -p1 < docker/nuitka-jobs.patch \
    && test "$(grep -c -- '--jobs=$(NUITKA_JOBS)' makefile)" -eq 2

ARG BACKEND_BUILD_JOBS=2

RUN case "$BACKEND_BUILD_JOBS" in \
        ''|*[!0-9]*|0) echo "BACKEND_BUILD_JOBS must be a positive integer." >&2; exit 1 ;; \
    esac

# Compile the binaries from the backend source code. Cache the build data.
RUN --mount=type=cache,target=/root/.cache/pip \
    --mount=type=cache,target=/root/.cache/ccache \
    make install-python \
    && make -j1 NUITKA_JOBS="$BACKEND_BUILD_JOBS" build

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
