# Application forms

The upstream backend samples define application types without form questions.
The types appear in the frontend, but users cannot submit them until each type
has a `form` value.

The configuration below provides short examples for the four upstream
application types. Review all questions, eligibility rules, cooldowns, and
required connections before you use them.

Replace `application_types` in `config/config.json` with this list:

```json
"application_types": [
    {
        "id": 1,
        "name": "Driver",
        "discord_role_change": [],
        "staff_role_ids": [20, 21],
        "message": "",
        "channel_id": "",
        "webhook_url": "",
        "required_connections": ["discord", "steam"],
        "required_member_state": 0,
        "required_either_user_role_ids": [],
        "required_all_user_role_ids": [],
        "prohibited_either_user_role_ids": [],
        "prohibited_all_user_role_ids": [],
        "cooldown_hours": 2,
        "allow_multiple_pending": false,
        "form": [
            {"type": "info", "text": "Tell us why you want to join the VTC."},
            {"type": "textarea", "label": "Why do you want to join?", "rows": 4, "min_length": 20, "must_input": true},
            {"type": "radio", "label": "Are you currently a member of another VTC?", "choices": ["Yes", "No"], "must_input": true},
            {"type": "radio", "label": "Do you agree to follow the VTC rules?", "choices": ["Yes", "No"], "must_input": true}
        ]
    },
    {
        "id": 2,
        "name": "Staff",
        "discord_role_change": [],
        "staff_role_ids": [20, 21],
        "message": "",
        "channel_id": "",
        "webhook_url": "",
        "required_connections": [],
        "required_member_state": -1,
        "required_either_user_role_ids": [],
        "required_all_user_role_ids": [],
        "prohibited_either_user_role_ids": [],
        "prohibited_all_user_role_ids": [],
        "cooldown_hours": 2,
        "allow_multiple_pending": false,
        "form": [
            {"type": "dropdown", "label": "Which team do you want to join?", "choices": ["Human Resources", "Events", "Community"], "must_input": true},
            {"type": "textarea", "label": "Why are you interested in this position?", "rows": 4, "min_length": 20, "must_input": true},
            {"type": "textarea", "label": "Describe relevant experience or skills.", "rows": 4, "min_length": 20, "must_input": true},
            {"type": "text", "label": "What is your usual availability?", "must_input": true}
        ]
    },
    {
        "id": 3,
        "name": "LOA",
        "discord_role_change": [],
        "staff_role_ids": [20, 21],
        "message": "",
        "channel_id": "",
        "webhook_url": "",
        "required_connections": [],
        "required_member_state": 1,
        "required_either_user_role_ids": [],
        "required_all_user_role_ids": [],
        "prohibited_either_user_role_ids": [],
        "prohibited_all_user_role_ids": [],
        "cooldown_hours": 2,
        "allow_multiple_pending": false,
        "form": [
            {"type": "date", "label": "Start date", "must_input": true},
            {"type": "date", "label": "Expected return date", "must_input": true},
            {"type": "textarea", "label": "Reason or additional information", "rows": 3, "must_input": true}
        ]
    },
    {
        "id": 4,
        "name": "Division",
        "discord_role_change": [],
        "staff_role_ids": [70, 71],
        "message": "",
        "channel_id": "",
        "webhook_url": "",
        "required_connections": [],
        "required_member_state": 1,
        "required_either_user_role_ids": [],
        "required_all_user_role_ids": [],
        "prohibited_either_user_role_ids": [],
        "prohibited_all_user_role_ids": [],
        "cooldown_hours": 2,
        "allow_multiple_pending": false,
        "form": [
            {"type": "dropdown", "label": "Which division do you want to join?", "choices": ["Construction", "Agriculture"], "must_input": true},
            {"type": "textarea", "label": "Why do you want to join this division?", "rows": 4, "min_length": 20, "must_input": true},
            {"type": "radio", "label": "Do you agree to follow the division requirements?", "choices": ["Yes", "No"], "must_input": true}
        ]
    }
]
```

The staff role IDs use the model in [ROLES.md](ROLES.md). Change them when the
Hub uses a different role model. `discord_role_change` contains Discord guild
role changes, not Drivers Hub role IDs. Leave it empty when the deployment does
not use a Discord bot for role management.

Use `channel_id`, `webhook_url`, and `message` only when new applications must
be forwarded to Discord. These values are not required for applications in the
Hub.
