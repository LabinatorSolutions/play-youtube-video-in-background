'use strict';

(function () {
    // Check if we are in a Firefox environment with access to wrappedJSObject
    // This is required to override the Page Visibility API seen by the page's scripts.
    // @ts-ignore: Firefox-specific Xray vision property
    if (!document.wrappedJSObject) {
        console.warn('Play YouTube Video in Background: document.wrappedJSObject is not available.');
        return;
    }

    const currentHostname = window.location.hostname;

    // Detection Regex
    const YOUTUBE_REGEX = /(?:^|.+\.)youtube(?:-nocookie)?\.com$/;
    const VIMEO_REGEX = /(?:^|.+\.)vimeo\.com$/;

    const IS_YOUTUBE = YOUTUBE_REGEX.test(currentHostname);
    const IS_VIMEO = VIMEO_REGEX.test(currentHostname);

    // Enhanced mobile detection - catches more mobile configurations
    const IS_MOBILE = /Mobile|Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const IS_ANDROID = /Android/i.test(navigator.userAgent);
    const IS_IOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    // Mobile YouTube can be m.youtube.com OR regular YouTube accessed from mobile browser
    const IS_MOBILE_YOUTUBE = currentHostname === 'm.youtube.com' || (IS_YOUTUBE && IS_MOBILE);
    const IS_DESKTOP_YOUTUBE = IS_YOUTUBE && !IS_MOBILE_YOUTUBE;

    // Page Visibility API Override
    // We overwrite 'hidden' and 'visibilityState' on the underlying page object
    // so the website scripts (YouTube/Vimeo) think the page is always visible.
    // This is the core logic that prevents the video from stopping.
    // Note: Desktop YouTube is excluded because it generally supports background audio
    // natively, and the 'Keep-Alive' loop below handles the timeout check.
    if (IS_ANDROID || IS_IOS || !IS_DESKTOP_YOUTUBE) {
        try {
            // @ts-ignore: Firefox-specific Xray vision property
            Object.defineProperties(document.wrappedJSObject, {
                'hidden': { value: false, writable: true },
                'visibilityState': { value: 'visible', writable: true }
            });
        } catch (e) {
            console.error('Play YouTube Video in Background: Failed to override visibility API', e);
        }
    }

    // Stop 'visibilitychange' events from propagating to the page
    window.addEventListener(
        'visibilitychange',
        evt => evt.stopImmediatePropagation(),
        true // Capture phase
    );

    // Fullscreen API Override for Vimeo
    if (IS_VIMEO) {
        window.addEventListener(
            'fullscreenchange',
            evt => evt.stopImmediatePropagation(),
            true // Capture phase
        );
    }

    // Initialize MediaSession API for better mobile integration
    if (IS_YOUTUBE || IS_VIMEO) {
        initializeMediaSession();
    }

    // Start video playback monitoring for auto-recovery
    if (IS_YOUTUBE || IS_VIMEO) {
        monitorVideoPlayback();
    }

    /**
     * Initializes the MediaSession API to integrate with the system's media controls.
     * This helps maintain playback on mobile devices by registering as a media player.
     */
    function initializeMediaSession() {
        if (!('mediaSession' in navigator)) {
            return; // API not supported
        }

        try {
            // Set metadata for media notification
            // @ts-ignore: MediaSession API
            navigator.mediaSession.metadata = new MediaMetadata({
                title: 'YouTube Background Playback',
                artist: 'Playing in background',
                album: 'Firefox Extension',
                artwork: [
                    { src: 'https://www.youtube.com/favicon.ico', sizes: '96x96', type: 'image/x-icon' }
                ]
            });

            // Prevent default pause behavior
            // @ts-ignore: MediaSession API
            navigator.mediaSession.setActionHandler('pause', () => {
                // Intentionally ignore pause requests from system
                console.log('Play YouTube Video in Background: Ignoring system pause request');
            });

            // Handle play requests
            // @ts-ignore: MediaSession API
            navigator.mediaSession.setActionHandler('play', () => {
                const video = document.querySelector('video');
                if (video && video.paused) {
                    video.play().catch(err => {
                        console.error('Play YouTube Video in Background: Failed to play video', err);
                    });
                }
            });

            // Handle stop requests (also ignore)
            // @ts-ignore: MediaSession API
            navigator.mediaSession.setActionHandler('stop', () => {
                console.log('Play YouTube Video in Background: Ignoring system stop request');
            });

        } catch (e) {
            console.error('Play YouTube Video in Background: Failed to initialize MediaSession', e);
        }
    }

    /**
     * Monitors video playback and attempts to recover if unexpectedly paused.
     * Especially useful on mobile when system tries to suspend background tabs.
     */
    function monitorVideoPlayback() {
        let consecutivePauses = 0;

        /**
         * Checks if video is playing and attempts recovery if needed
         */
        function checkPlayback() {
            const video = document.querySelector('video');
            if (!video) {
                return;
            }

            // Check if video is unexpectedly paused
            const isUnexpectedlyPaused = video.paused &&
                !video.ended &&
                video.readyState >= 2 && // HAVE_CURRENT_DATA
                !document.hidden; // Our override makes this always false

            if (isUnexpectedlyPaused) {
                consecutivePauses++;

                // Only attempt recovery if we've seen multiple consecutive pauses
                // This prevents interfering with user-initiated pauses
                if (consecutivePauses >= 2) {
                    console.warn('Play YouTube Video in Background: Video unexpectedly paused, attempting recovery');

                    video.play().catch(err => {
                        console.error('Play YouTube Video in Background: Failed to resume playback', err);
                    });
                }
            } else if (!video.paused) {
                // Video is playing, reset counter
                consecutivePauses = 0;
            }
        }

        // Check every 5 seconds on desktop, 3 seconds on mobile for more responsive recovery
        const CHECK_INTERVAL = IS_MOBILE ? 3000 : 5000;
        setInterval(checkPlayback, CHECK_INTERVAL);
    }

})();