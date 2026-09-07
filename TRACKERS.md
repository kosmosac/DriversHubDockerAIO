# Job trackers

Drivers Hub receives completed and cancelled jobs from a separate game tracker.
It supports Trucky, TrackSim, UniTracker, and custom trackers that use the
TrackSim webhook format. The tracker software is not part of this deployment.

## Requirements

Before a driver can submit jobs:

- the driver must connect a Steam account to the Hub;
- an administrator must accept the user as a member and assign a role with the
  `driver` permission;
- the driver must select one of the configured trackers in the profile
  settings; and
- the tracker must send its webhook to the public Hub URL.

The Hub identifies drivers by their Steam ID. When multiple trackers are
configured, each driver still selects one tracker. Jobs received from another
tracker are discarded to prevent duplicate delivery logs.

## Webhook URLs

Replace `hub.example.com` with the public Hub domain:

| Tracker | Webhook URL |
| --- | --- |
| Trucky | `https://hub.example.com/api/trucky/update` |
| TrackSim | `https://hub.example.com/api/tracksim/update` |
| UniTracker | `https://hub.example.com/api/unitracker/update` |
| Custom | `https://hub.example.com/api/custom-tracker/update` |

## Backend configuration

> **Important:** When you save the tracker configuration through the
> administration interface, enter the secrets for **every** configured tracker.
> An empty secret field overwrites the existing value. It does not keep the
> current secret.

Each enabled service is one object in the `trackers` list in
`config/config.json`:

```json
"trackers": [
    {
        "type": "trucky",
        "company_id": "",
        "api_token": "replace with the Trucky company access token",
        "webhook_secret": "replace with the Trucky webhook secret",
        "ip_whitelist": []
    }
]
```

The fields have these functions:

| Field | Function |
| --- | --- |
| `type` | Selects `trucky`, `tracksim`, `unitracker`, or `custom`. |
| `company_id` | Retained for compatibility. The current backend does not use it. Use an empty string. |
| `api_token` | Lets the Hub add or remove drivers in Trucky or TrackSim. It is not used for UniTracker or a custom tracker. |
| `webhook_secret` | Verifies signed Trucky, TrackSim, or custom webhooks. An empty value disables signature verification for that tracker. |
| `ip_whitelist` | Accepts webhooks only from the listed source IP addresses. An empty list allows all source IP addresses. |

Use a webhook secret when the tracker supports one. Keep `ip_whitelist` empty
unless the provider confirms stable sender addresses. A changed sender address
causes the Hub to reject valid jobs.

After you change the tracker configuration, apply the saved configuration in
the administration interface or restart the backend:

```bash
docker compose restart backend
```

## Trucky

Trucky provides the most complete public setup information.

1. Open the company settings in the Trucky VTC Hub.
2. Open the **API** tab.
3. Create a company access token in Trucky. Enter it as `api_token` in the
   Drivers Hub tracker configuration.
4. Create a webhook secret in Trucky. Enter the same value as
   `webhook_secret` in the Drivers Hub tracker configuration.
5. Enter `https://hub.example.com/api/trucky/update` as the webhook URL in
   Trucky.
6. Enable the `job_completed` and `job_canceled` events. The backend rejects
   unrelated Trucky event types.

The access token lets Drivers Hub add a driver to the Trucky company when a
Hub role with the `driver` permission is assigned. It also lets the Hub remove
the driver when that permission is removed. The driver must have a connected
Steam account for these operations.

See the official
[Trucky API and external Drivers Hub guide](https://truckyapp.com/kb/vtc-hub-api-and-external-drivers-hub-integration/)
for the current location and names of these settings.

## TrackSim

Add a `tracksim` object to the list:

```json
{
    "type": "tracksim",
    "company_id": "",
    "api_token": "replace with the TrackSim API key",
    "webhook_secret": "replace with the TrackSim webhook secret",
    "ip_whitelist": []
}
```

Configure the TrackSim webhook URL as
`https://hub.example.com/api/tracksim/update`. The API key is used for driver
membership and for route retrieval. The public TrackSim documentation is not
currently available. Obtain the API key, webhook secret, and current setup
steps from the TrackSim service or its support channel.

## UniTracker

Add a `unitracker` object to the list. Keep all fields other than `type` empty:

```json
{
    "type": "unitracker",
    "company_id": "",
    "api_token": "",
    "webhook_secret": "",
    "ip_whitelist": []
}
```

Configure the **API Endpoint** in UniTracker as
`https://hub.example.com/api/unitracker/update`. Leave
`company_id`, `api_token`, `webhook_secret`, and `ip_whitelist` empty in Drivers
Hub. The UniTracker integration does not require additional credentials in the
Hub configuration.

### UniTracker example payload

This example contains the fields read by the current UniTracker converter. Set
`steamID` to the Steam ID of a Hub member who selected UniTracker. Use a unique
value for `id` and `jobID` for each job.

```json
{
    "JobData": {
        "id": "100001",
        "jobID": "example-unitracker-job-100001",
        "steamID": "76561198000000000",
        "realTimeStarted": "2026-09-07 18:00:00",
        "realTimeEnded": "2026-09-07 18:45:00",
        "realTimeTaken": "2700",
        "plannedDistance": "120",
        "distanceDriven": "125",
        "fuelStartJob": "500",
        "truckRefueledAmount": "0",
        "fuelEndJob": "455",
        "isSpecial": "0",
        "isLate": "0",
        "jobMarket": "cargo_market",
        "cargoID": "apples",
        "cargo": "Apples",
        "cargoMass": "18000",
        "cargoDamage": "0",
        "gameID": "ETS2",
        "hasPoliceEnabled": "1",
        "isMultiplayer": "0",
        "serverName": "",
        "sourceCityID": "berlin",
        "sourceCity": "Berlin",
        "sourceCompanyID": "eurogoodies",
        "sourceCompany": "EuroGoodies",
        "destinationCityID": "dresden",
        "destinationCity": "Dresden",
        "destinationCompanyID": "tradeaux",
        "destinationCompany": "Tradeaux",
        "truckModelID": "vehicle.scania.s_2016",
        "truck": "S",
        "truckMakeID": "scania",
        "truckMake": "Scania",
        "truckRealConsumption": "36.0",
        "odometerStartJob": "100000",
        "odometerEndJob": "100125",
        "truckWheelsCount": "6",
        "truckLicensePlate": "EXAMPLE",
        "truckLicensePlateCountryID": "germany",
        "truckLicensePlateCountry": "Germany",
        "topSpeed": "90",
        "truckRealAverageSpeed": "70",
        "trailerModelID": "trailer.scs.box",
        "trailerModel": "Box Trailer",
        "trailerBodyType": "dryvan",
        "trailerChainType": "single",
        "trailerWheelsCount": "6",
        "trailerMakeID": "",
        "trailerLicensePlate": "TRAILER",
        "trailerLicensePlateCountryID": "germany",
        "trailerLicensePlateCountry": "Germany",
        "autoLoadUsed": "0",
        "autoParkUsed": "0",
        "income": "12500",
        "earnedXP": "650",
        "job_damage": "{\"truck_cabin\":0,\"truck_chassis\":0,\"truck_engine\":0,\"truck_transmission\":0,\"truck_wheels\":0,\"trailer_body\":0,\"trailer_cargo\":0,\"trailer_chassis\":0,\"trailer_wheels\":0}",
        "current_damage": "{\"truck_cabin\":0,\"truck_chassis\":0,\"truck_engine\":0,\"truck_transmission\":0,\"truck_wheels\":0,\"trailer_body\":0,\"trailer_cargo\":0,\"trailer_chassis\":0,\"trailer_wheels\":0}"
    },
    "Events": [
        {
            "name": "player.job.started",
            "mapX": 1000,
            "mapZ": 2000,
            "currentTime": "2026-09-07 18:00:00"
        },
        {
            "name": "player.job.delivered",
            "mapX": 1100,
            "mapZ": 2100,
            "currentTime": "2026-09-07 18:45:00"
        }
    ]
}
```

### Minimal UniTracker payload

The UniTracker converter reads most job fields directly. Its minimum payload is
therefore still comparatively large. This example removes the separate job
start event and all route data, but contains the fields required to convert a
completed job.

```json
{
    "JobData": {
        "id": "100002",
        "jobID": "example-unitracker-job-100002",
        "steamID": "76561198000000000",
        "realTimeStarted": "2026-09-07 18:00:00",
        "realTimeEnded": "2026-09-07 18:45:00",
        "realTimeTaken": "2700",
        "plannedDistance": "120",
        "distanceDriven": "125",
        "fuelStartJob": "500",
        "truckRefueledAmount": "0",
        "fuelEndJob": "455",
        "isSpecial": "0",
        "isLate": "0",
        "jobMarket": "cargo_market",
        "cargoID": "apples",
        "cargo": "Apples",
        "cargoMass": "18000",
        "cargoDamage": "0",
        "gameID": "ETS2",
        "hasPoliceEnabled": "1",
        "isMultiplayer": "0",
        "sourceCityID": "berlin",
        "sourceCity": "Berlin",
        "sourceCompanyID": "eurogoodies",
        "sourceCompany": "EuroGoodies",
        "destinationCityID": "dresden",
        "destinationCity": "Dresden",
        "destinationCompanyID": "tradeaux",
        "destinationCompany": "Tradeaux",
        "truckModelID": "vehicle.scania.s_2016",
        "truck": "S",
        "truckMakeID": "scania",
        "truckMake": "Scania",
        "truckRealConsumption": "36",
        "odometerStartJob": "100000",
        "odometerEndJob": "100125",
        "truckWheelsCount": "6",
        "truckLicensePlate": "EXAMPLE",
        "truckLicensePlateCountryID": "germany",
        "truckLicensePlateCountry": "Germany",
        "topSpeed": "90",
        "truckRealAverageSpeed": "70",
        "trailerModelID": "trailer.scs.box",
        "trailerModel": "Box Trailer",
        "trailerBodyType": "dryvan",
        "trailerChainType": "single",
        "trailerWheelsCount": "6",
        "trailerMakeID": "",
        "trailerLicensePlate": "TRAILER",
        "trailerLicensePlateCountryID": "germany",
        "trailerLicensePlateCountry": "Germany",
        "autoParkUsed": "0",
        "income": "12500",
        "earnedXP": "650",
        "job_damage": "{\"truck_cabin\":0,\"truck_chassis\":0,\"truck_engine\":0,\"truck_transmission\":0,\"truck_wheels\":0,\"trailer_body\":0,\"trailer_cargo\":0,\"trailer_chassis\":0,\"trailer_wheels\":0}",
        "current_damage": "{\"truck_cabin\":0,\"truck_chassis\":0,\"truck_engine\":0,\"truck_transmission\":0,\"truck_wheels\":0,\"trailer_body\":0,\"trailer_cargo\":0,\"trailer_chassis\":0,\"trailer_wheels\":0}"
    },
    "Events": [
        {
            "name": "player.job.delivered",
            "mapX": 1100,
            "mapZ": 2100,
            "currentTime": "2026-09-07 18:45:00"
        }
    ]
}
```

## Custom tracker

A custom tracker must send the TrackSim-compatible payload documented in the
upstream backend's `docs/dlog.md`. Configure its endpoint as
`https://hub.example.com/api/custom-tracker/update`.

```json
{
    "type": "custom",
    "company_id": "",
    "api_token": "",
    "webhook_secret": "replace with a shared secret",
    "ip_whitelist": []
}
```

For signed requests, the sender must put the hexadecimal HMAC-SHA256 signature
in the `signature` header. Both systems must use the same `webhook_secret`.

### Custom tracker example payload

The Custom Tracker endpoint accepts the TrackSim webhook format. Set
`steam_id` to the Steam ID of a Hub member who selected Custom as the tracker.
Use a unique job `id` for each request. Speeds are supplied in metres per
second and distances in kilometres.

```json
{
    "object": "event",
    "type": "job.delivered",
    "data": {
        "object": {
            "id": 100001,
            "uuid": "9ea49330-7e9a-4ea7-b655-50b5b4129241",
            "object": "job",
            "driver": {
                "steam_id": "76561198000000000",
                "username": "ExampleDriver",
                "profile_photo_url": "https://example.com/avatar.png"
            },
            "start_time": "2026-09-07T18:00:00Z",
            "stop_time": "2026-09-07T18:45:00Z",
            "time_spent": 2700,
            "planned_distance": 120,
            "driven_distance": 125,
            "adblue_used": 2.5,
            "fuel_used": 45,
            "is_special": false,
            "is_late": false,
            "market": "cargo_market",
            "cargo": {
                "unique_id": "apples",
                "name": "Apples",
                "mass": 18000,
                "damage": 0
            },
            "game": {
                "short_name": "eut2",
                "language": "en_gb",
                "had_police_enabled": true,
                "realistic_settings": {}
            },
            "multiplayer": null,
            "source_city": {
                "unique_id": "berlin",
                "name": "Berlin"
            },
            "source_company": {
                "unique_id": "eurogoodies",
                "name": "EuroGoodies"
            },
            "destination_city": {
                "unique_id": "dresden",
                "name": "Dresden"
            },
            "destination_company": {
                "unique_id": "tradeaux",
                "name": "Tradeaux"
            },
            "truck": {
                "unique_id": "vehicle.scania.s_2016",
                "name": "S",
                "brand": {
                    "unique_id": "scania",
                    "name": "Scania"
                },
                "odometer": 100125,
                "initial_odometer": 100000,
                "total_damage": {
                    "cabin": 0,
                    "chassis": 0,
                    "engine": 0,
                    "transmission": 0,
                    "wheels": 0
                },
                "top_speed": 25,
                "average_speed": 19.4
            },
            "trailers": [],
            "events": [
                {
                    "type": "job.started",
                    "time": 1788804000,
                    "real_time": "2026-09-07T18:00:00Z",
                    "location": null,
                    "meta": {
                        "autoLoaded": false
                    }
                },
                {
                    "type": "job.delivered",
                    "time": 1788806700,
                    "real_time": "2026-09-07T18:45:00Z",
                    "location": null,
                    "meta": {
                        "revenue": 12500,
                        "distance": 125,
                        "earnedXP": 650,
                        "autoParked": false
                    }
                }
            ],
            "mods": []
        }
    }
}
```

### Minimal Custom Tracker payload

This is the minimum TrackSim-compatible structure accepted and stored by the
current AIO implementation for a completed job. It omits optional descriptive
data. Integrations that want jobs to participate fully in challenges, economy,
notifications, and other plugin features should send the complete structure
shown above.

```json
{
    "type": "job.delivered",
    "data": {
        "object": {
            "id": 100002,
            "driver": {
                "steam_id": "76561198000000000"
            },
            "driven_distance": 125,
            "fuel_used": 45,
            "game": {
                "short_name": "eut2"
            },
            "truck": {
                "top_speed": 25
            },
            "source_city": null,
            "source_company": null,
            "destination_city": null,
            "destination_company": null,
            "cargo": null,
            "events": [
                {
                    "type": "job.delivered",
                    "meta": {
                        "revenue": 12500,
                        "distance": 125
                    }
                }
            ]
        }
    }
}
```

## Verify the integration

1. Restart the backend after a direct edit to `config/config.json`.
2. Open the user profile and select the configured tracker.
3. Confirm that the user has a connected Steam account and a Hub role with the
   `driver` permission.
4. Complete a short test job with the tracker.
5. Confirm that the job appears in the delivery list.

The audit log records rejected webhook signatures and source IP addresses.
Delivery rules can also block or discard an otherwise valid job. Review
`delivery_rules` in `config/config.json` when the webhook arrives but no job is
stored.
