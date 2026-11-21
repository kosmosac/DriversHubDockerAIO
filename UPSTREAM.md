# Upstream compatibility tracking

This AIO release targets these exact upstream revisions:

- HubBackend `809cde5c6d7e48ab451d8dfa9a6aa3a6ce0f3843`
- HubFrontend `1c24488095ea6fb4a2fb7292ee907d16924df3cd`

Older upstream revisions are supported by the AIO `v1.0.0` legacy release.
The current build no longer applies compatibility patches for changes that are
part of the revisions above.

## Deployment-specific adjustments

| Component | Local implementation | Purpose |
| --- | --- | --- |
| Frontend | `frontend/docker/remove-obsolete-radios.mjs` | Remove the discontinued SimulatorHits integration and the deployment-specific PeanFM preset while retaining TruckersFM and user-provided stream URLs. |
| Frontend | `frontend/docker/simplify-login-methods.mjs` | Replace the contradictory registration and login-method sentence with a neutral, localized label for Discord and Steam. |
| Frontend | `frontend/docker/fit-dlog-route.mjs` and `frontend/docker/set-map-initial-zoom.mjs` | Fit delivery maps to the recorded route and use a practical initial heatmap zoom. |
| Frontend | `frontend/docker/dlog-event-presentation.patch` and `frontend/docker/merge-coach-arrival.mjs` | Present Truck, Car, and Coach lifecycle, stop, satisfaction, and unknown events consistently, label Coach departures and arrivals, and avoid a duplicate final Coach event. |
| Backend | `backend/docker/normalize-coach-stops.py` | Complete TrackSim Coach timelines from the webhook stop list, merge matching satisfaction events, and interpolate missing stop timestamps from surrounding in-game and real-time anchors. |
| Backend | `backend/docker/coach-statistics-name.patch` | Store the stable `Coach Passengers` category name in delivery statistics while retaining per-job Coach details in each delivery. |
| Backend | `backend/docker/trucky-job-types.patch` | Normalize Trucky Car and Coach jobs, preserve their vehicle types, and handle cancellation penalties correctly. |
| Frontend and backend | `frontend/docker/handle-empty-trailers.mjs` and `backend/docker/normalize-empty-trailers.py` | Treat jobs without trailers as valid and always release the delivery-page loading state. |
| Frontend | `frontend/docker/use-config-url-api-path.mjs` | Derive the single-Hub API base path from `VITE_CONFIG_URL`. |
| Frontend | `frontend/docker/configure-map-base-url.mjs` | Make the map tile service configurable for the deployment. |
| Frontend | `frontend/docker/configure-live-map-url.mjs` | Make the TruckersMP live-player and heatmap endpoint configurable and allow operators to disable these browser requests. |
| Frontend | Source-map-preserving build | Retain the source maps referenced by browser bundles. |
| Frontend | `ASSETS_BASE=/` and the post-build check | Use root-relative assets on client-side routes such as OAuth callbacks. |
| Frontend | Web runtime cleanup | Exclude Electron entry points from the web-only image. |
| Backend | `backend/docker/configure-legal-links.py` | Add the public DriversHubDockerAIO repository to the upstream source repository metadata. |
| Backend | `backend/docker/nuitka-jobs.patch` | Pass `BACKEND_BUILD_JOBS` to Nuitka to limit compiler load. |
| Backend | `backend/docker/geoip-session-transition.patch` | Preserve sessions when an unknown `XX` country becomes a known ISO country. |
| Backend | `examples/economy-garages.*` and `backend/docker/update-economy-garages.py` | Provide current ETS2 and ATS economy garages while preserving operator-defined values. |
