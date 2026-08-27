# Upstream compatibility tracking

This file lists the changes that this deployment applies to the Drivers Hub
source during a build. Review the linked upstream changes before updating an
upstream checkout. Remove a local adjustment only after the build supports the
new upstream implementation and the resulting images have been tested.

## Changes proposed upstream

| Component | Local implementation | Purpose | Upstream |
| --- | --- | --- | --- |
| Frontend | `frontend/docker/hcaptcha-sitekey.patch` | Read the hCaptcha site key from `VITE_HCAPTCHA_SITEKEY`. The build skips the patch when upstream provides the variable. | [Issue #12](https://github.com/CharlesWithC/HubFrontend/issues/12), [PR #13](https://github.com/CharlesWithC/HubFrontend/pull/13) |
| Frontend | `frontend/docker/remove-analytics.mjs` | Remove Google Analytics and its consent dialog. The upstream proposal makes Analytics optional; this deployment intentionally keeps it disabled. | [Issue #14](https://github.com/CharlesWithC/HubFrontend/issues/14), [PR #15](https://github.com/CharlesWithC/HubFrontend/pull/15) |
| Frontend | `frontend/docker/replace-fallback-avatar.mjs` | Replace the external fallback avatar with the bundled `logo.png`. The script skips the replacement when the known URL is absent. | [Issue #16](https://github.com/CharlesWithC/HubFrontend/issues/16), [PR #17](https://github.com/CharlesWithC/HubFrontend/pull/17) |
| Frontend | `frontend/docker/fix-logout-state.mjs` | Clear all profile state after logout. The script skips the change when upstream contains the corrected implementation. | [Issue #19](https://github.com/CharlesWithC/HubFrontend/issues/19), [PR #20](https://github.com/CharlesWithC/HubFrontend/pull/20) |
| Backend | `backend/docker/client-config.patch` and `backend/docker/client-config-upstream-domain.patch` | Normalize runtime client metadata and keep database-backed client configuration consistent with backend configuration. The second variant supports the implementation proposed upstream. | [Issue #11](https://github.com/CharlesWithC/HubBackend/issues/11), [PR #12](https://github.com/CharlesWithC/HubBackend/pull/12) |

## Deployment-specific adjustments

These changes do not currently have matching upstream pull requests. They
implement requirements that are specific to this Docker deployment.

| Component | Local implementation | Purpose |
| --- | --- | --- |
| Frontend | `frontend/docker/use-config-url-api-path.mjs` | Derive the API base path from `VITE_CONFIG_URL` for a single-hub deployment instead of treating the VTC abbreviation as the API prefix. |
| Backend | `backend/docker/nuitka-jobs.patch` | Pass `BACKEND_BUILD_JOBS` to Nuitka to limit compiler load on small hosts. |
| Frontend | `ASSETS_BASE=/` and the post-build check in `frontend/Dockerfile` | Use root-relative assets so that client-side routes such as OAuth callbacks can load the application bundle. |
| Frontend | Cleanup in `frontend/Dockerfile` | Exclude Electron entry points from the web-only runtime image. Upstream discussion: [Issue #18](https://github.com/CharlesWithC/HubFrontend/issues/18). |

## Update checklist

1. Read the changes in both upstream repositories since the tested revisions.
2. Check the state and contents of every linked issue and pull request.
3. Build both images. Compatibility checks intentionally stop the build when a
   known upstream implementation changed unexpectedly.
4. Test login, logout, OAuth callbacks, client configuration, enabled plugins,
   nested frontend routes, and frontend asset loading.
5. Remove an adjustment only when its behavior is present upstream or is no
   longer required by this deployment.
