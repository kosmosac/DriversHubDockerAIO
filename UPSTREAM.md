# Upstream compatibility tracking

This file lists the changes that this deployment applies to the Drivers Hub
source during a build and links them to related upstream discussions and pull
requests.

Local compatibility patches remain in the repository after an upstream fix is
merged. The build skips them when the checked-out upstream source already
contains the fix and still applies them to older source checkouts.

## Upstream changes and proposals

| Component | Local implementation | Purpose | Upstream |
| --- | --- | --- | --- |
| Frontend | `frontend/docker/hcaptcha-sitekey.patch` | Read the hCaptcha site key from `VITE_HCAPTCHA_SITEKEY`. The build skips the patch when upstream provides the variable. | [Issue #12](https://github.com/CharlesWithC/HubFrontend/issues/12), [merged PR #13](https://github.com/CharlesWithC/HubFrontend/pull/13) |
| Frontend | `frontend/docker/remove-analytics.mjs` | Remove Google Analytics and its consent dialog. The upstream proposal makes Analytics optional; this deployment intentionally keeps it disabled. | [Issue #14](https://github.com/CharlesWithC/HubFrontend/issues/14), [PR #15](https://github.com/CharlesWithC/HubFrontend/pull/15) |
| Frontend | `frontend/docker/replace-fallback-avatar.mjs` | Replace the external fallback avatar with the bundled `logo.png`. The script skips the replacement when the known URL is absent. | [Issue #16](https://github.com/CharlesWithC/HubFrontend/issues/16), [merged PR #17](https://github.com/CharlesWithC/HubFrontend/pull/17) |
| Frontend | `frontend/docker/fix-logout-state.mjs` | Clear all profile state after logout. The script skips the change when upstream contains the corrected implementation. | [Issue #19](https://github.com/CharlesWithC/HubFrontend/issues/19), [merged PR #20](https://github.com/CharlesWithC/HubFrontend/pull/20) |
| Frontend and backend | `frontend/docker/proxy-auth.patch` and `backend/docker/proxy-auth.patch` | Enable the TruckersMP proxy for its existing frontend integrations while requiring an authenticated Hub member. The build skips both patches when compatible upstream implementations are present. | [Backend issue #23](https://github.com/CharlesWithC/HubBackend/issues/23), [Backend PR #24](https://github.com/CharlesWithC/HubBackend/pull/24), [Frontend PR #21](https://github.com/CharlesWithC/HubFrontend/pull/21) |
| Backend | `backend/docker/client-config.patch`, `backend/docker/client-config-upstream-domain.patch`, and `backend/docker/frontend-domain.patch` | Normalize runtime client metadata, expand `{domain}` in frontend URLs, and keep database-backed client configuration consistent with backend configuration. The build skips changes that upstream already provides. | [Issue #11](https://github.com/CharlesWithC/HubBackend/issues/11), [PR #12](https://github.com/CharlesWithC/HubBackend/pull/12) |
| Backend | `backend/docker/smtp-encryption.patch` | Add explicit `starttls`, `tls`, and `none` SMTP encryption modes, preserve certificate validation, and log SMTP failures. The build skips the patch when upstream provides this implementation. | [Issue #14](https://github.com/CharlesWithC/HubBackend/issues/14), [PR #15](https://github.com/CharlesWithC/HubBackend/pull/15) |
| Backend | `backend/docker/tracksim-job-types.patch` | Normalize TrackSim Truck, Car, and Coach Job payloads for the existing delivery pipeline, keep their independent ID sequences collision-free, and retrieve every route through TrackSim's official v2 API with the matching job type. The build skips the patch when compatible support is available upstream. | [PR #25](https://github.com/CharlesWithC/HubBackend/pull/25) |
| Backend | `backend/docker/tracksim-cancelled-meta.patch` | Accept TrackSim `job.cancelled` events that omit an empty `meta` object. The build skips the patch when upstream provides this implementation. | [Issue #16](https://github.com/CharlesWithC/HubBackend/issues/16), [PR #18](https://github.com/CharlesWithC/HubBackend/pull/18) |
| Backend | `backend/docker/trucky-validation.patch` | Return HTTP 422 when a Trucky webhook is structurally invalid or cannot be converted. Extra payload fields remain supported. | [PR #19](https://github.com/CharlesWithC/HubBackend/pull/19) |
| Backend | `backend/docker/unitracker-validation.patch` | Return HTTP 422 when a UniTracker webhook cannot be converted because required data is missing or invalid. Extra payload fields remain supported. | [PR #20](https://github.com/CharlesWithC/HubBackend/pull/20) |
| Backend | `backend/docker/dlog-export-multiplayer.patch` | Keep delivery CSV exports working when an optional `multiplayer.type` field is missing. The build skips the patch when upstream provides this implementation. | [Issue #21](https://github.com/CharlesWithC/HubBackend/issues/21), [PR #22](https://github.com/CharlesWithC/HubBackend/pull/22) |

## Deployment-specific adjustments

These changes do not currently have matching upstream pull requests. They
implement requirements that are specific to this Docker deployment.

| Component | Local implementation | Purpose |
| --- | --- | --- |
| Frontend | `frontend/docker/use-config-url-api-path.mjs` | Derive the API base path from `VITE_CONFIG_URL` for a single-hub deployment instead of treating the VTC abbreviation as the API prefix. |
| Backend | `backend/docker/nuitka-jobs.patch` | Pass `BACKEND_BUILD_JOBS` to Nuitka to limit compiler load on small hosts. |
| Frontend | `ASSETS_BASE=/` and the post-build check in `frontend/Dockerfile` | Use root-relative assets so that client-side routes such as OAuth callbacks can load the application bundle. |
| Frontend | Cleanup in `frontend/Dockerfile` | Exclude Electron entry points from the web-only runtime image. Upstream discussion: [Issue #18](https://github.com/CharlesWithC/HubFrontend/issues/18). |
