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

    // Track user-initiated pauses to prevent auto-resume
    let lastUserPauseTime = 0;
    let wasPlayingBeforePause = false;

    // Start video playback monitoring for auto-recovery
    if (IS_YOUTUBE || IS_VIMEO) {
        monitorVideoPlayback();
        trackUserPauses();
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

            // Handle pause requests from media controls
            // @ts-ignore: MediaSession API
            navigator.mediaSession.setActionHandler('pause', () => {
                console.log('Play YouTube Video in Background: User paused via media controls');
                const video = document.querySelector('video');
                if (video && !video.paused) {
                    // Mark this as a user-initiated pause
                    lastUserPauseTime = Date.now();
                    video.pause();
                }
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
     * Tracks user-initiated pause and play events.
     */
    function trackUserPauses() {
        // Track pause events
        document.addEventListener('pause', (evt) => {
            // @ts-ignore: Type check for HTMLVideoElement
            const video = evt.target;
            if (video && video instanceof HTMLVideoElement) {
                // Mark as user pause - this disables auto-recovery permanently
                const timeSinceLastPause = Date.now() - lastUserPauseTime;
                if (timeSinceLastPause > 1000) { // More than 1 second
                    lastUserPauseTime = Date.now();
                    wasPlayingBeforePause = false; // Disable auto-recovery
                    console.log('Play YouTube Video in Background: User paused - auto-recovery disabled');
                }
            }
        }, true); // Capture phase

        // Track play events to detect manual resume
        document.addEventListener('play', (evt) => {
            // @ts-ignore: Type check for HTMLVideoElement
            const video = evt.target;
            if (video && video instanceof HTMLVideoElement) {
                // Check if this is a user resume after a pause
                const timeSinceLastPause = Date.now() - lastUserPauseTime;
                if (lastUserPauseTime > 0 && timeSinceLastPause < 5000) {
                    // Recent resume after pause = user manually resumed
                    lastUserPauseTime = 0;
                    wasPlayingBeforePause = true;
                    console.log('Play YouTube Video in Background: User resumed - auto-recovery enabled');
                } else if (lastUserPauseTime === 0) {
                    // Video started playing naturally (auto-recovery or initial play)
                    wasPlayingBeforePause = true;
                }
            }
        }, true); // Capture phase
    }

    /**
     * Monitors video playback and attempts to recover if unexpectedly paused.
     * Especially useful on mobile when system tries to suspend background tabs.
     */
    function monitorVideoPlayback() {
        let consecutivePauses = 0;
        let lastRecoveryAttemptTime = 0;
        const MAX_RECOVERY_ATTEMPTS = 3;
        const RECOVERY_ATTEMPT_WINDOW = 60000; // 1 minute

        /**
         * Checks if video is playing and attempts recovery if needed
         */
        function checkPlayback() {
            const video = document.querySelector('video');
            if (!video) {
                return;
            }

            // If user manually paused, NEVER auto-resume (permanent pause)
            if (lastUserPauseTime > 0) {
                consecutivePauses = 0;
                return; // User pause is permanent until user manually resumes
            }

            // Track if video is currently playing
            if (!video.paused && !wasPlayingBeforePause) {
                wasPlayingBeforePause = true;
            }

            // Check if video is unexpectedly paused
            // Only auto-recover if video was actively playing before
            const isUnexpectedlyPaused = video.paused &&
                !video.ended &&
                video.readyState >= 2 && // HAVE_CURRENT_DATA
                wasPlayingBeforePause; // Must have been playing before pause

            if (isUnexpectedlyPaused) {
                consecutivePauses++;

                // Increased threshold to prevent interfering with user pauses
                // 5 consecutive pauses = 15 seconds on mobile, 25 seconds on desktop
                if (consecutivePauses >= 5) {
                    // Check if we've exceeded max recovery attempts in the time window
                    const timeSinceLastAttempt = Date.now() - lastRecoveryAttemptTime;

                    if (timeSinceLastAttempt > RECOVERY_ATTEMPT_WINDOW) {
                        // Reset attempt tracking after time window expires
                        lastRecoveryAttemptTime = 0;
                    }

                    // Limit recovery attempts to prevent infinite loops
                    const shouldAttemptRecovery =
                        lastRecoveryAttemptTime === 0 ||
                        consecutivePauses - 5 < MAX_RECOVERY_ATTEMPTS;

                    if (shouldAttemptRecovery) {
                        console.warn('Play YouTube Video in Background: Video unexpectedly paused, attempting recovery');
                        lastRecoveryAttemptTime = Date.now();

                        video.play().then(() => {
                            // Recovery successful, reset counters
                            consecutivePauses = 0;
                            lastRecoveryAttemptTime = 0;
                        }).catch(err => {
                            console.error('Play YouTube Video in Background: Failed to resume playback', err);
                        });
                    } else {
                        console.log('Play YouTube Video in Background: Max recovery attempts reached, giving up');
                        consecutivePauses = 0; // Reset to stop further attempts
                    }
                }
            } else if (!video.paused) {
                // Video is playing, reset counter
                consecutivePauses = 0;
                lastRecoveryAttemptTime = 0;
            }
        }

        // Check every 5 seconds on desktop, 3 seconds on mobile for more responsive recovery
        const CHECK_INTERVAL = IS_MOBILE ? 3000 : 5000;
        setInterval(checkPlayback, CHECK_INTERVAL);
    }

})();