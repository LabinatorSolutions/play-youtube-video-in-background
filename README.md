# Play YouTube Video In Background

[![Firefox Add-on](https://img.shields.io/badge/Firefox_Add--on-Get_It_Now-blue.svg)](https://addons.mozilla.org/en-US/firefox/addon/play-yt-video-in-background/)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)

A Firefox extension that prevents YouTube and Vimeo from stopping video playback when the browser is in the background, minimized, or when switching tabs.

## Purpose

This extension ensures that videos on **YouTube** and **Vimeo** continue playing even when you switch tabs, minimize the browser, or lock your screen (on mobile). It eliminates the frustration of videos pausing automatically when they lose focus.

## Features

- **Background Playback**: Forces YouTube and Vimeo to continue playing even when the tab is not active.
- **Page Visibility API Override**: Tricks the websites into thinking the page is always visible (`document.hidden` is always `false`).
- **Mobile Support**: Includes logic for Android and iOS Firefox support with MediaSession API integration.
- **Video Recovery**: Automatically resumes playback if unexpectedly paused due to browser suspension.
- **Lightweight**: Minimal performance impact.

## How It Works

The extension uses a lightweight content script to override the [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API).

1.  **Visibility Override**: It intercepts visibility checks from the website, always reporting the page state as `visible` and `active`.
2.  **Event Blocking**: It stops `visibilitychange` events from propagating to the video player.
3.  **MediaSession Integration**: On mobile, it ensures the browser's media control center stays active.


## Installation

### From Firefox Add-ons (Recommended)

[Install from Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/play-yt-video-in-background/)

### From Source

1. Clone the repository:
   ```bash
   git clone https://github.com/LabinatorSolutions/play-youtube-video-in-background.git
   cd play-youtube-video-in-background
   ```
2. Install dependencies (requires [Bun](https://bun.sh)):
   ```bash
   bun install
   ```
3. Build the extension:
   ```bash
   bun run build
   ```
   The artifact (ZIP file) will be generated in the `web-ext-artifacts/` directory.

### Loading Temporarily in Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **"Load Temporary Add-on..."**.
3. Select the `manifest.json` file in the project directory.

## Troubleshooting

### Extension Not Working?

1. **Check if extension is enabled**: Navigate to `about:addons` and verify the extension is enabled.
2. **Verify you're on a supported site**: The extension only works on YouTube and Vimeo.
3. **Try reloading the page**: Sometimes a page refresh is needed after installing.
4. **Check browser console**: Press `F12` and look for any error messages from the extension.
5. **Firefox version**: Ensure you're running Firefox 147.0 or later.

## Usage

1.  **Install the extension**.
2.  **Open YouTube or Vimeo**.
3.  **Start a video**.
4.  **Switch tabs or minimize**: The audio/video will keep playing.

**To Verify:**
1.  Play a video.
2.  Switch to another tab or minimize Firefox.
3.  **Desktop**: The tab should show the "playing audio" speaker icon.
4.  **Android**: You should see the Firefox media control notification in your notification shade, and audio will continue.

> **Note**: This extension focuses purely on background playback. For preventing YouTube's "Are you still watching?" timeout prompts, consider pairing with the [YouTube Uninterrupted](https://github.com/LabinatorSolutions/youtube-uninterrupted) extension.

## Known Limitations

- **Desktop YouTube**: Background playback works natively in most cases; extension primarily helps with mobile.
- **Timeout Prompts**: This extension does NOT prevent YouTube's "Are you still watching?" prompts. Use [YouTube Uninterrupted](https://github.com/LabinatorSolutions/youtube-uninterrupted) for that.
- **Firefox forks**: May not work on Firefox forks that don't support `wrappedJSObject`.
- **Other extensions**: Ad blockers or privacy extensions might interfere.

## Development

This project uses [Bun](https://bun.sh) for dependency management and running scripts.

### Prerequisites

- [Bun](https://bun.sh) (v1.0 or later)
- Firefox (for testing)

### Commands

| Command             | Description                                        |
| :------------------ | :------------------------------------------------- |
| `bun run lint`      | Runs ESLint to check for code style and errors.    |
| `bun run lint:fix`  | Automatically fixes simple linting errors.         |
| `bun run typecheck` | Runs TypeScript compiler to check types (no emit). |
| `bun run test`      | Runs both linting and type checking validation.    |
| `bun run build`     | Packages the extension using `web-ext`.            |

## Permissions

The extension requests permissions for the following domains:

- `*://*.youtube.com/*`
- `*://*.youtube-nocookie.com/*`
- `*://*.vimeo.com/*`

These permissions are strictly required to inject the content script that overrides the Page Visibility API on these specific sites. No data is collected or transmitted.

## Support

- **Issues**: [Report a Bug](https://github.com/LabinatorSolutions/play-youtube-video-in-background/issues)
- **Source Code**: [GitHub Repository](https://github.com/LabinatorSolutions/play-youtube-video-in-background)

## Disclaimer

This extension is not affiliated with, endorsed by, or officially connected to YouTube, Vimeo, Google, or Mozilla. It is an independent project created for educational purposes and personal use.

The extension respects the terms of service of supported platforms by:
- Not downloading or modifying video content.
- Simply ensuring the browser reports "active" state to the player.

## Credits

Developed by [Labinator](https://Labinator.com).

## License

[AGPL-3.0](LICENSE)
