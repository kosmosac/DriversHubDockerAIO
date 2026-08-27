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
2. Open the API or integrations section.
3. Create a company access token and put it in `api_token`.
4. Create a webhook secret and put it in `webhook_secret`.
5. Add `https://hub.example.com/api/trucky/update` as an API webhook.
6. Enable the `job_completed` and `job_canceled` events. The backend rejects
   unrelated Trucky event types.

The optional `user_joined_company` event can accept the matching Hub account as
a member and add its configured driver role. Enable this event only when Trucky
must control that part of the membership workflow.

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

Add a `unitracker` object to the list:

```json
{
    "type": "unitracker",
    "company_id": "",
    "api_token": "",
    "webhook_secret": "",
    "ip_whitelist": []
}
```

Configure the UniTracker webhook URL as
`https://hub.example.com/api/unitracker/update`. The current backend does not
verify a UniTracker webhook signature and does not use an API token for this
integration. Use `ip_whitelist` only when UniTracker gives you a complete list
of stable webhook sender addresses. Obtain the remaining setup steps from the
tracker provider.

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

## Verify the integration

1. Restart the backend after a direct edit to `config/config.json`.
2. Open the user profile and select the configured tracker.
3. Confirm that the user has a connected Steam account and a Hub role with the
   `driver` permission.
4. Complete a short test job with the tracker.
5. Check the delivery list and the backend log:

```bash
docker compose logs --tail=200 backend
```

The audit log records rejected webhook signatures and source IP addresses.
Delivery rules can also block or discard an otherwise valid job. Review
`delivery_rules` in `config/config.json` when the webhook arrives but no job is
stored.
