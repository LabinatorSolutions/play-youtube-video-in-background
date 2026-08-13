'use strict';

(function () {
    // Set to true to trace extension decisions in the page console.
    const DEBUG = false;

    /**
     * Logs a diagnostic message when DEBUG is enabled.
     * @param {string} message
     */
    function debugLog(message) {
        if (DEBUG) {
            console.log(`Play YouTube Video in Background: ${message}`);
        }
    }

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

    // Auto-recovery state.
    // userPaused stays true from a user-initiated pause until playback resumes,
    // so the recovery loop never fights a deliberate pause.
    let userPaused = false;
    let wasPlaying = false;

    // Start video playback monitoring for auto-recovery
    if (IS_YOUTUBE || IS_VIMEO) {
        monitorVideoPlayback();
        trackUserPauses();
    }

    /**
     * Returns the video element the page is most likely playing.
     * Pages such as the YouTube home feed and Shorts hold several video elements,
     * so the first match in the DOM is often a muted preview rather than the player.
     * @returns {HTMLVideoElement|null}
     */
    function findVideo() {
        const videos = Array.from(document.querySelectorAll('video'));
        if (videos.length <= 1) {
            return videos[0] || null;
        }

        const playing = videos.find(v => !v.paused && !v.ended && v.readyState >= 2);
        if (playing) {
            return playing;
        }

        // Fall back to the largest loaded video, which is the main player in practice.
        const loaded = videos.filter(v => v.readyState >= 2);
        const candidates = loaded.length > 0 ? loaded : videos;
        return candidates.reduce((best, v) => (visibleArea(v) > visibleArea(best) ? v : best));
    }

    /**
     * Rendered area of a video element in CSS pixels.
     * @param {HTMLVideoElement} video
     * @returns {number}
     */
    function visibleArea(video) {
        return video.clientWidth * video.clientHeight;
    }

    /**
     * Reports whether the pause that is being handled came from the user.
     * Firefox exposes transient activation through navigator.userActivation (Firefox 120+),
     * which is true only for a few seconds after a real interaction. A pause caused by
     * tab suspension or the page's own scripts carries no activation, so it stays eligible
     * for auto-recovery.
     * @returns {boolean}
     */
    function isUserInitiated() {
        const activation = navigator.userActivation;
        return activation ? activation.isActive : false;
    }

    /**
     * Records a pause the user asked for, disabling auto-recovery until playback resumes.
     */
    function markUserPause() {
        userPaused = true;
        wasPlaying = false;
        debugLog('User pause detected - auto-recovery disabled');
    }

    /**
     * Initializes the MediaSession API to integrate with the system's media controls.
     * This helps maintain playback on mobile devices by registering as a media player.
     * Metadata is deliberately left to the site: YouTube and Vimeo publish their own
     * title, artist and artwork, and overwriting it would show the wrong media in the
     * system notification.
     */
    function initializeMediaSession() {
        if (!('mediaSession' in navigator)) {
            return; // API not supported
        }

        try {
            // Handle pause requests from media controls.
            // System media controls grant no transient activation, so the pause is
            // recorded here instead of being inferred from the 'pause' event.
            // @ts-ignore: MediaSession API
            navigator.mediaSession.setActionHandler('pause', () => {
                debugLog('User paused via media controls');
                const video = findVideo();
                if (video && !video.paused) {
                    markUserPause();
                    video.pause();
                }
            });

            // Handle play requests
            // @ts-ignore: MediaSession API
            navigator.mediaSession.setActionHandler('play', () => {
                const video = findVideo();
                if (video && video.paused) {
                    video.play().catch(err => {
                        console.error('Play YouTube Video in Background: Failed to play video', err);
                    });
                }
            });

            // Handle stop requests (also ignore)
            // @ts-ignore: MediaSession API
            navigator.mediaSession.setActionHandler('stop', () => {
                debugLog('Ignoring system stop request');
            });

        } catch (e) {
            console.error('Play YouTube Video in Background: Failed to initialize MediaSession', e);
        }
    }

    /**
     * Tracks user-initiated pause and play events.
     */
    function trackUserPauses() {
        // Track pause events
        document.addEventListener('pause', (evt) => {
            // @ts-ignore: Type check for HTMLVideoElement
            const video = evt.target;
            if (video instanceof HTMLVideoElement && isUserInitiated()) {
                markUserPause();
            }
        }, true); // Capture phase

        // Track play events. Any resume clears the user pause, whether it came from the
        // user, the site or our own recovery attempt.
        document.addEventListener('play', (evt) => {
            // @ts-ignore: Type check for HTMLVideoElement
            const video = evt.target;
            if (video instanceof HTMLVideoElement) {
                if (userPaused) {
                    debugLog('Playback resumed - auto-recovery enabled');
                }
                userPaused = false;
                wasPlaying = true;
            }
        }, true); // Capture phase
    }

    /**
     * Monitors video playback and attempts to recover if unexpectedly paused.
     * Especially useful on mobile when system tries to suspend background tabs.
     */
    function monitorVideoPlayback() {
        let consecutivePauses = 0;
        let recoveryAttempts = 0;
        let attemptWindowStart = 0;
        const MAX_RECOVERY_ATTEMPTS = 3;
        const RECOVERY_ATTEMPT_WINDOW = 60000; // 1 minute
        const PAUSES_BEFORE_RECOVERY = 5; // 15 seconds on mobile, 25 seconds on desktop

        /**
         * Checks if video is playing and attempts recovery if needed
         */
        function checkPlayback() {
            const video = findVideo();
            if (!video) {
                return;
            }

            // A user pause stays in effect until playback resumes.
            if (userPaused) {
                consecutivePauses = 0;
                return;
            }

            if (!video.paused) {
                // Video is playing, reset counters
                wasPlaying = true;
                consecutivePauses = 0;
                recoveryAttempts = 0;
                attemptWindowStart = 0;
                return;
            }

            // Check if video is unexpectedly paused
            // Only auto-recover if video was actively playing before
            const isUnexpectedlyPaused = !video.ended &&
                video.readyState >= 2 && // HAVE_CURRENT_DATA
                wasPlaying; // Must have been playing before pause

            if (!isUnexpectedlyPaused) {
                return;
            }

            consecutivePauses++;
            if (consecutivePauses < PAUSES_BEFORE_RECOVERY) {
                return;
            }

            const now = Date.now();
            if (attemptWindowStart === 0 || now - attemptWindowStart > RECOVERY_ATTEMPT_WINDOW) {
                // Start a fresh attempt window
                attemptWindowStart = now;
                recoveryAttempts = 0;
            }

            // Limit recovery attempts to prevent infinite loops
            if (recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
                debugLog('Max recovery attempts reached, giving up');
                consecutivePauses = 0; // Reset to stop further attempts
                return;
            }

            recoveryAttempts++;
            debugLog('Video unexpectedly paused, attempting recovery');

            video.play().then(() => {
                // Recovery successful, reset counters
                consecutivePauses = 0;
                recoveryAttempts = 0;
                attemptWindowStart = 0;
            }).catch(err => {
                console.error('Play YouTube Video in Background: Failed to resume playback', err);
            });
        }

        // Check every 5 seconds on desktop, 3 seconds on mobile for more responsive recovery
        const CHECK_INTERVAL = IS_MOBILE ? 3000 : 5000;
        setInterval(checkPlayback, CHECK_INTERVAL);
    }

})();
