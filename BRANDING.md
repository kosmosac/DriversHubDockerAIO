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
| **Banner** | Shown above the desktop navigation. A wide image is suitable for this position. |
| **Background** | Provides the shared VTC background that users can select in their appearance settings. |

Recommended image properties:

| Field | Recommended format | Display behavior |
| --- | --- | --- |
| **Logo** | Square PNG, for example 512 x 512 pixels. Use transparency if required. | The loading screen displays it at 100 x 100 pixels. A square image also works well as the browser and touch icon. |
| **Banner** | Wide PNG with an aspect ratio of approximately 4:1, for example 1040 x 260 or 800 x 200 pixels. | The desktop navigation scales it to its available width without cropping it. Keep important content near the center. It is not shown in the mobile navigation. |
| **Background** | Landscape PNG with an aspect ratio of approximately 16:9, for example 1920 x 1080 pixels. | The frontend centers the image and uses `cover`. Parts near the edges can be cropped on screens with a different aspect ratio. Keep important content away from the edges. |

The dimensions are recommendations, not upload requirements. The frontend
does not require an exact width or height.

Selecting no file leaves the stored image unchanged. Uploading a new file
replaces the image of that type.

## Names and colors

The **WEB** tab also provides these options:

| Field | Use |
| --- | --- |
| **Company Name** | Sets the VTC name shown by the frontend. |
| **Theme Color** | Stores the client configuration value named `color`. The current frontend does not use this value for its visual theme. |
| **Name Color** | Provides the VTC name color that users can select for their profile. |
| **Use highest role color** | Uses the color of a user's highest role when the user has no custom name color. |
| **Theme Main Color** | Sets the secondary surface color of the optional VTC theme. |
| **Theme Background Color** | Sets the main background color of the optional VTC theme. |
| **Theme Opacity** | Controls the darkening used with the optional VTC theme. |

The color fields do not replace each user's active appearance settings:

- **Name Color** becomes a VTC color option in the user's profile color
  settings. Changing it does not recolor all names immediately.
- **Theme Main Color** and **Theme Background Color** are visible only after a
  user selects the VTC theme in their appearance settings.
- **Theme Opacity** applies only to the VTC theme. It is not a default opacity
  for new users or for the VTC background.
- **Background** becomes available after a user selects the VTC background in
  their appearance settings. The frontend initially uses 40 percent darkening
  for this option. The user's later changes are stored in the browser.
- **Theme Color** has no visible effect in the current frontend implementation.

The **Hex Color** field on the backend configuration page is different. It is
the backend `hex_color` value. The backend uses it for generated banners and
Discord embed colors. It supplies the initial client `color` and **Name Color**
when the client configuration is first created, but later changes do not
replace the client branding stored in MariaDB.

## Configuration ownership

The web configuration is separate from `config/config.json`. The backend uses
`name` and `hex_color` from that file only when it creates the initial client
configuration. Later changes made on the **WEB** tab remain in MariaDB across
container restarts and image rebuilds.

Include `data/` in the deployment backup to preserve the web configuration and
uploaded branding images.
