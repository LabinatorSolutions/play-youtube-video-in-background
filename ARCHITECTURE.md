# Architecture

## Overview

Play YouTube Video In Background is a Firefox extension that enables continuous video playback when Firefox is minimized, in the background, or when switching tabs. This document explains how the extension works technically.

## Core Mechanisms

The extension uses two primary techniques to enable background playback:

### 1. Page Visibility API Override

The extension overrides the Page Visibility API to trick websites into thinking the page is always visible.

**How it works**:
- Uses Firefox's `document.wrappedJSObject` to access the underlying page object
- Overrides `document.hidden` to always return `false`
- Overrides `document.visibilityState` to always return `'visible'`

**Code location**: Lines 49-59 in `play-youtube-video-in-background.js`

**Why Firefox-specific**: The `wrappedJSObject` property is part of Firefox's Xray vision security model, which allows extensions to interact with page objects while maintaining security boundaries.

### 2. Event Blocking

The extension prevents visibility change events from reaching the page scripts.

**How it works**:
- Listens for `visibilitychange` events in the capture phase
- Calls `stopImmediatePropagation()` to prevent the event from reaching page scripts
- For Vimeo, also blocks `fullscreenchange` events

**Code location**: Lines 61-75 in `play-youtube-video-in-background.js`

**Event flow**:
```
Browser detects tab switch
    ↓
Extension intercepts visibilitychange event (capture phase)
    ↓
Extension blocks event propagation
    ↓
Page scripts never receive the event
    ↓
Video continues playing
```

### 3. MediaSession API Integration

The extension integrates with the browser's MediaSession API for enhanced mobile support.

**How it works**:
- Registers action handlers for system media controls (play, pause, stop)
- Records a pause requested from the media controls as user-initiated, so auto-recovery stands down
- Ignores system stop requests
- Leaves metadata to the site: YouTube and Vimeo publish their own title, artist and artwork,
  and overwriting it would show the wrong media in the system notification

**Code location**: Lines 148-194 in `play-youtube-video-in-background.js`

**Why needed**: Mobile operating systems aggressively suspend background tabs. MediaSession integration signals that active media playback is occurring, reducing the likelihood of suspension.

### 4. Video Playback Recovery

Monitors video state and automatically resumes if unexpectedly paused.

**How it works**:
- Checks video element state every 3-5 seconds
- Classifies each pause with `navigator.userActivation.isActive` (Firefox 120+): a pause carrying
  transient activation came from the user, a pause without it came from the system or the page
- A user pause disables recovery until playback resumes by any means
- Requires 5 consecutive paused checks before recovery (15s mobile, 25s desktop)
- Caps recovery at 3 attempts per rolling 60-second window
- Automatically calls `video.play()` to resume

**Code location**: Lines 199-305 in `play-youtube-video-in-background.js`

**Video selection**: `findVideo()` (lines 100-124) picks the currently playing element, falling back
to the largest loaded one. Pages such as the YouTube home feed and Shorts hold several `<video>`
elements, so taking the first match in the DOM would often target a muted preview.

**Why needed**: Even with Page Visibility override, browsers may still pause videos due to resource management or OS-level suspension.

> **Note**: This extension focuses purely on background playback. For preventing YouTube's "Are you still watching?" timeout prompts, install the complementary [YouTube Uninterrupted](https://github.com/LabinatorSolutions/youtube-uninterrupted) extension.


## Site Detection

The extension uses regex patterns to detect supported sites:

### YouTube Detection
```javascript
const YOUTUBE_REGEX = /(?:^|.+\.)youtube(?:-nocookie)?\.com$/;
```

**Matches**:
- `youtube.com`
- `www.youtube.com`
- `m.youtube.com` (mobile)
- `youtube-nocookie.com`
- `www.youtube-nocookie.com`

### Vimeo Detection
```javascript
const VIMEO_REGEX = /(?:^|.+\.)vimeo\.com$/;
```

**Matches**:
- `vimeo.com`
- `www.vimeo.com`
- `player.vimeo.com`

## Platform-Specific Behavior

### Desktop YouTube
- Page Visibility override is **NOT** applied (Desktop YouTube handles background playback natively)
- MediaSession integration **IS** applied for consistency
- Video recovery monitoring **IS** applied

### Mobile YouTube / Android
- Page Visibility override **IS** applied
- MediaSession integration **IS** applied (critical for mobile)
- Video recovery **IS** applied with shorter intervals (3s vs 5s)

### iOS
- Page Visibility override **IS** applied  
- MediaSession integration **IS** applied
- Video recovery **IS** applied

### Vimeo (All platforms)
- Page Visibility override **IS** applied
- Fullscreen event blocking **IS** applied
- MediaSession integration **IS** applied
- Video recovery **IS** applied


## Code Flow Diagram

```mermaid
graph TD
    A[Extension Loads] --> B{Check wrappedJSObject}
    B -->|Not Available| C[Exit - Not Firefox]
    B -->|Available| D[Detect Current Site]
    D --> E{Site Type?}
    E -->|YouTube Desktop| F[Skip Visibility Override]
    E -->|YouTube Mobile/Android| G[Apply Visibility Override]
    E -->|Vimeo| H[Apply Visibility Override + Fullscreen Block]
    E -->|Other| I[Exit - Unsupported Site]
    F --> J[Add Visibility Event Blocker]
    G --> J
    H --> J
    J --> K[Initialize MediaSession API]
    K --> L[Start Video Recovery Monitoring]
    L --> M[Complete - Extension Active]
```

## Security Considerations

### Content Security Policy
The extension ships no extension pages (no popup, options page or background script), so it relies
on the Manifest V3 default policy: `script-src 'self'; object-src 'self';`. No remote code is
loaded and no `eval()` is used.

### Permissions
- **No special permissions required** beyond content script injection
- Extension only runs on YouTube and Vimeo domains
- No network requests made
- No data collection or storage

### Firefox Xray Vision
- `wrappedJSObject` access is sandboxed by Firefox
- Extension cannot access sensitive page data
- Page scripts cannot access extension code

## Performance Impact

### Memory
- Minimal: Single setInterval timer for video monitoring per tab
- MediaSession API has negligible memory footprint
- The timer and listeners live in the page's content script scope and are torn down with the page

### CPU
- Negligible: Video check runs every 3-5 seconds
- No continuous polling or heavy computations
- Event-driven architecture

### Network
- Zero: No external requests
- All processing happens locally

### Battery (Mobile)
- Minimal impact due to optimized intervals
- MediaSession integration is battery-efficient
- Shorter check intervals on mobile (3s) balanced against battery life

## Limitations

1. **Firefox Only**: Relies on `wrappedJSObject` which is Firefox-specific
2. **Supported Sites**: Only YouTube and Vimeo
3. **Desktop YouTube**: Background playback often works natively; extension adds recovery mechanism
4. **Browser Forks**: May not work on Firefox forks without `wrappedJSObject` support
5. **Timeout Prompts**: Does NOT prevent "Are you still watching?" dialogs - use [YouTube Uninterrupted](https://github.com/LabinatorSolutions/youtube-uninterrupted) for that


## Future Enhancements

Potential improvements for future versions:

1. **Additional Sites**: Twitch, Dailymotion, etc.
2. **User Preferences**: Options page for customization
3. **Cross-Browser**: Explore Chromium compatibility (limited by API differences)
4. **Wake Lock API**: Experimental support for preventing system sleep

## Complementary Extension

For a complete uninterrupted YouTube experience, consider pairing with:

**[YouTube Uninterrupted](https://github.com/LabinatorSolutions/youtube-uninterrupted)**
- Prevents "Continue watching?" timeout dialogs
- Activity simulation to reset YouTube's idle timer
- Focuses on dialog removal (this extension focuses on background playback)
- Together they provide seamless, uninterrupted playback


## Technical References

- [Page Visibility API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
- [Firefox Xray Vision](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts)
- [MediaSession API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/MediaSession)
- [HTMLMediaElement API](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement)
- [WebExtensions Content Scripts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts)
