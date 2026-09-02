# Upstream compatibility tracking

This file lists the changes that this deployment applies to the Drivers Hub
source during a build and links them to related upstream discussions and pull
requests.

## Changes proposed upstream

| Component | Local implementation | Purpose | Upstream |
| --- | --- | --- | --- |
| Frontend | `frontend/docker/hcaptcha-sitekey.patch` | Read the hCaptcha site key from `VITE_HCAPTCHA_SITEKEY`. The build skips the patch when upstream provides the variable. | [Issue #12](https://github.com/CharlesWithC/HubFrontend/issues/12), [PR #13](https://github.com/CharlesWithC/HubFrontend/pull/13) |
| Frontend | `frontend/docker/remove-analytics.mjs` | Remove Google Analytics and its consent dialog. The upstream proposal makes Analytics optional; this deployment intentionally keeps it disabled. | [Issue #14](https://github.com/CharlesWithC/HubFrontend/issues/14), [PR #15](https://github.com/CharlesWithC/HubFrontend/pull/15) |
| Frontend | `frontend/docker/replace-fallback-avatar.mjs` | Replace the external fallback avatar with the bundled `logo.png`. The script skips the replacement when the known URL is absent. | [Issue #16](https://github.com/CharlesWithC/HubFrontend/issues/16), [PR #17](https://github.com/CharlesWithC/HubFrontend/pull/17) |
| Frontend | `frontend/docker/fix-logout-state.mjs` | Clear all profile state after logout. The script skips the change when upstream contains the corrected implementation. | [Issue #19](https://github.com/CharlesWithC/HubFrontend/issues/19), [PR #20](https://github.com/CharlesWithC/HubFrontend/pull/20) |
| Backend | `backend/docker/client-config.patch`, `backend/docker/client-config-upstream-domain.patch`, and `backend/docker/frontend-domain.patch` | Normalize runtime client metadata, expand `{domain}` in frontend URLs, and keep database-backed client configuration consistent with backend configuration. The build skips changes that upstream already provides. | [Issue #11](https://github.com/CharlesWithC/HubBackend/issues/11), [PR #12](https://github.com/CharlesWithC/HubBackend/pull/12) |
| Backend | `backend/docker/smtp-encryption.patch` | Add explicit `starttls`, `tls`, and `none` SMTP encryption modes, preserve certificate validation, and log SMTP failures. The build skips the patch when upstream provides this implementation. | [Issue #14](https://github.com/CharlesWithC/HubBackend/issues/14), [PR #15](https://github.com/CharlesWithC/HubBackend/pull/15) |
| Backend | `backend/docker/tracksim-validation.patch` | Validate required TrackSim webhook fields before job processing and return HTTP 422 for incomplete payloads. The build skips the patch when upstream provides this implementation. | [Issue #16](https://github.com/CharlesWithC/HubBackend/issues/16), [PR #17](https://github.com/CharlesWithC/HubBackend/pull/17) |

## Additional compatibility fixes

These functional fixes do not currently have matching upstream pull requests.

| Component | Local implementation | Purpose |
| --- | --- | --- |
| Backend | `backend/docker/custom-validation.patch`, `backend/docker/trucky-validation.patch`, and `backend/docker/unitracker-validation.patch` | Return HTTP 422 for structurally incomplete webhook payloads before job processing. Extra payload fields remain supported. |

## Deployment-specific adjustments

These changes do not currently have matching upstream pull requests. They
implement requirements that are specific to this Docker deployment.

| Component | Local implementation | Purpose |
| --- | --- | --- |
| Frontend | `frontend/docker/use-config-url-api-path.mjs` | Derive the API base path from `VITE_CONFIG_URL` for a single-hub deployment instead of treating the VTC abbreviation as the API prefix. |
| Backend | `backend/docker/nuitka-jobs.patch` | Pass `BACKEND_BUILD_JOBS` to Nuitka to limit compiler load on small hosts. |
| Frontend | `ASSETS_BASE=/` and the post-build check in `frontend/Dockerfile` | Use root-relative assets so that client-side routes such as OAuth callbacks can load the application bundle. |
| Frontend | Cleanup in `frontend/Dockerfile` | Exclude Electron entry points from the web-only runtime image. Upstream discussion: [Issue #18](https://github.com/CharlesWithC/HubFrontend/issues/18). |
