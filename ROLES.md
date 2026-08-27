# Roles and permissions

Drivers Hub uses numeric role IDs in its role list, permission assignments,
application types, announcement types, and divisions. All references must use
IDs that exist in `roles`.

The upstream backend samples contain a small role list, while several other
sample settings use IDs from the larger frontend role model. The configuration
below provides the complete frontend role model and adds the two division roles
used by the backend samples. It is an optional starting point for a new Hub.

Review the role names and permission assignments before you use them. Set
`discord_role_id` only when the Hub must associate an internal role with a
Discord guild role.

## Role list

Replace the `roles` value in `config/config.json` with this list:

```json
"roles": [
    {"id": 0, "name": "Owner", "order_id": 0, "discord_role_id": ""},
    {"id": 10, "name": "Leadership", "order_id": 10, "discord_role_id": ""},
    {"id": 20, "name": "Human Resources Manager", "order_id": 20, "discord_role_id": ""},
    {"id": 21, "name": "Human Resources Staff", "order_id": 21, "discord_role_id": ""},
    {"id": 30, "name": "Events Manager", "order_id": 30, "discord_role_id": ""},
    {"id": 31, "name": "Events Staff", "order_id": 31, "discord_role_id": ""},
    {"id": 40, "name": "Convoy Supervisor", "order_id": 40, "discord_role_id": ""},
    {"id": 41, "name": "Convoy Control", "order_id": 41, "discord_role_id": ""},
    {"id": 70, "name": "Division Manager", "order_id": 70, "discord_role_id": ""},
    {"id": 71, "name": "Division Supervisor", "order_id": 71, "discord_role_id": ""},
    {"id": 80, "name": "Community Manager", "order_id": 80, "discord_role_id": ""},
    {"id": 81, "name": "Community Team", "order_id": 81, "discord_role_id": ""},
    {"id": 99, "name": "Trial Staff", "order_id": 99, "discord_role_id": ""},
    {"id": 100, "name": "Driver", "order_id": 100, "discord_role_id": ""},
    {"id": 200, "name": "Staff of the Month", "order_id": 200, "discord_role_id": "", "display_order_id": "-100"},
    {"id": 201, "name": "Driver of the Month", "order_id": 201, "discord_role_id": "", "display_order_id": "-100"},
    {"id": 202, "name": "Leave of absence", "order_id": 202, "discord_role_id": "", "display_order_id": "-1"},
    {"id": 251, "name": "Construction Division", "order_id": 251, "discord_role_id": ""},
    {"id": 252, "name": "Agriculture Division", "order_id": 252, "discord_role_id": ""}
]
```

Lower `order_id` values have more authority when the Hub compares roles. Keep
role ID `0` on the initial administrator.

## Permission assignments

Replace the `perms` value at the same time. This block is based on the frontend
permission defaults and includes the current backend permission keys:

```json
"perms": {
    "administrator": [0, 10],
    "update_config": [],
    "reload_config": [],
    "restart_service": [],
    "accept_members": [20, 21],
    "dismiss_members": [20, 21],
    "update_roles": [20, 21],
    "update_points": [20, 21],
    "update_connections": [20, 21],
    "disable_mfa": [20],
    "delete_notifications": [20],
    "manage_profiles": [20, 21],
    "view_sensitive_profile": [20, 21],
    "view_privacy_protected_data": [20, 21],
    "view_global_note": [20, 21],
    "update_global_note": [20, 21],
    "view_external_user_list": [20, 21],
    "ban_users": [20, 21],
    "delete_users": [20, 21],
    "import_dlogs": [20],
    "delete_dlogs": [20],
    "view_audit_log": [20, 21],
    "manage_announcements": [20],
    "manage_applications": [20, 21, 70, 71],
    "delete_applications": [20],
    "manage_challenges": [20, 80, 81],
    "manage_divisions": [70, 71],
    "manage_downloads": [],
    "manage_economy": [],
    "manage_economy_balance": [],
    "manage_economy_truck": [],
    "manage_economy_garage": [],
    "manage_economy_merch": [],
    "manage_events": [40, 41],
    "manage_polls": [],
    "manage_public_tasks": [],
    "driver": [100],
    "staff_of_the_month": [200],
    "driver_of_the_month": [201]
}
```

An empty list grants the permission to no regular role. `administrator` grants
all administrative permissions, but it does not grant the special `driver`
flag.

## Existing installations

Do not replace role IDs without checking the roles already assigned to users.
Keep every ID that is in use, or update the affected users before you remove
it. Save and apply `roles` and `perms` together. Then review the role references
in `announcement_types`, `application_types`, and `divisions`.

The related upstream inconsistency is tracked in
[HubBackend issue #13](https://github.com/CharlesWithC/HubBackend/issues/13).
