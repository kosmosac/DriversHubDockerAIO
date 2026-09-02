# Frontend branding

Drivers Hub stores its frontend branding in the client configuration and in
the MariaDB database. You can manage it through the administration interface.
You do not have to add image files to the Docker image or the project
directory.

## Open the branding settings

1. Sign in with an administrator account.
2. Open **Configuration**.
3. Select the **WEB** tab.
4. Change the required fields or select the image files.
5. Select **Save**.
6. Reload the page if an updated image does not appear immediately.

## Images

The image fields accept PNG files. Each file must be smaller than 2 MiB.

| Field | Use |
| --- | --- |
| **Logo** | Shown on the loading screen and used as the browser icon. The frontend also uses it for supported presence integrations. |
| **Banner** | Shown above the navigation and on the login page. A wide image is suitable for this position. |
| **Background** | Provides the shared VTC background that users can select in their appearance settings. |

The frontend scales the banner to the available width without cropping it. A
wide image with an aspect ratio of approximately 4:1 works well in both the
desktop navigation and the login page. For example, use 1040 x 260 pixels or
800 x 200 pixels. Keep important content near the center and leave some space
around it. The banner is not shown in the mobile navigation.

Selecting no file leaves the stored image unchanged. Uploading a new file
replaces the image of that type.

## Names and colors

The **WEB** tab also provides these options:

| Field | Use |
| --- | --- |
| **Company Name** | Sets the VTC name shown by the frontend. |
| **Theme Color** | Sets the main VTC accent color. |
| **Name Color** | Provides the VTC name color that users can select for their profile. |
| **Use highest role color** | Uses the color of a user's highest role when the user has no custom name color. |
| **Theme Main Color** | Sets the main surface color of the VTC theme. |
| **Theme Background Color** | Sets the background color of the VTC theme. |
| **Theme Opacity** | Controls how strongly the VTC background image is darkened. |

The VTC theme and background are shared options. Each user can select the VTC
theme or VTC background in their own appearance settings.

## Configuration ownership

The web configuration is separate from `config/config.json`. The backend uses
`name` and `hex_color` from that file only when it creates the initial client
configuration. Later changes made on the **WEB** tab remain in MariaDB across
container restarts and image rebuilds.

Include `data/` in the deployment backup to preserve the web configuration and
uploaded branding images.
