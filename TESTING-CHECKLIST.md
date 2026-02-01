# Testing Checklist

Use this checklist to verify the Play YouTube Video In Background extension is working correctly.

## Pre-Installation Tests

- [ ] **Files Present**
  - [ ] manifest.json exists
  - [ ] play-youtube-video-in-background.js present  
  - [ ] All icon files present (icon.svg)
  - [ ] LICENSE file present

- [ ] **Manifest Validation**
  - [ ] manifest.json is valid JSON (test with JSON validator)
  - [ ] All paths in manifest are correct
  - [ ] Version number matches latest release
  - [ ] Permissions are minimal (no storage, no network)

## Installation Tests

### Firefox Desktop

- [ ] **Load Extension**
  - [ ] Navigate to `about:debugging#/runtime/this-firefox`
  - [ ] Click "Load Temporary Add-on"
  - [ ] Select manifest.json
  - [ ] Extension loads without errors

- [ ] **Verify Installation**
  - [ ] Extension appears installed
  - [ ] No console errors on load
  - [ ] Extension logs show initialization (if debug mode enabled)

### Firefox Android (if applicable)

- [ ] **Collection Setup**
  - [ ] Firefox account created
  - [ ] User ID obtained
  - [ ] Collection created on AMO
  - [ ] Collection is public

- [ ] **Mobile Configuration**
  - [ ] Debug menu enabled (5 taps)
  - [ ] Custom collection configured
  - [ ] Firefox restarted
  - [ ] Extension appears in Add-ons menu

## Functional Tests

### YouTube Desktop

- [ ] **Background Playback - Tab Switch**
  - [ ] Navigate to youtube.com
  - [ ] Start playing any video
  - [ ] Switch to a different tab
  - [ ] Audio continues playing without interruption
  - [ ] Switch back - video still playing

- [ ] **Background Playback - Minimize Window**
  - [ ] Start playing video
  - [ ] Minimize Firefox window
  - [ ] Audio continues playing
  - [ ] Restore window - video still playing

- [ ] **Long Playback Test**
  - [ ] Start a long video or playlist
  - [ ] Let it play in background for 15+ minutes
  - [ ] Audio continues without interruption

### YouTube Mobile (m.youtube.com)

- [ ] **Mobile Browser Test**
  - [ ] Open m.youtube.com in Firefox desktop
  - [ ] Extension should work the same
  - [ ] Background playback works

- [ ] **Firefox Android Test** (if available)
  - [ ] Open youtube.com in Firefox Android
  - [ ] Play video
  - [ ] Switch to another app
  - [ ] Audio continues (result may vary by OS)

### Vimeo (All Variants)

- [ ] **Vimeo Desktop Test**
  - [ ] Navigate to vimeo.com
  - [ ] Play any video
  - [ ] Switch tabs
  - [ ] Audio continues playing

- [ ] **Vimeo Embedded Player**
  - [ ] Find a page with embedded Vimeo
  - [ ] Play video
  - [ ] Switch tabs
  - [ ] Audio continues

## Performance Test

s

- [ ] **CPU Usage**
  - [ ] Open browser task manager (Shift+Esc)
  - [ ] Extension should use negligible CPU (<1%)
  - [ ] No continuous high CPU usage

- [ ] **Memory Usage**
  - [ ] Check memory in task manager
  - [ ] Extension should use < 5MB
  - [ ] No memory leaks over extended playback

- [ ] **Battery Impact** (Mobile only)
  - [ ] Monitor battery usage
  - [ ] Extension should have minimal impact
  - [ ] No excessive battery drain

## Edge Cases & Error Handling

- [ ] **Page Navigation**
  - [ ] Navigate from one YouTube video to another
  - [ ] Extension continues to work
  - [ ] No console errors

- [ ] **Multiple Tabs**
  - [ ] Open multiple YouTube tabs simultaneously
  - [ ] Each tab's playback works independently
  - [ ] No cross-tab interference

- [ ] **Incognito/Private Mode**
  - [ ] Open YouTube in private window
  - [ ] Extension works (if enabled for private browsing)
  - [ ] Same functionality as normal mode

- [ ] **Browser Restart**
  - [ ] Close and reopen Firefox
  - [ ] Extension still works on YouTube
  - [ ] No errors on fresh start

- [ ] **Extension Update**
  - [ ] Update version number in manifest
  - [ ] Reload extension
  - [ ] No errors in console
  - [ ] Functionality still works

## Console Testing (Debug Mode)

- [ ] **Check Console Logs**
  - [ ] Open YouTube
  - [ ] Open browser console (F12)
  - [ ] Look for extension initialization messages
  - [ ] Verify MediaSession integration logs
  - [ ] Check for video recovery monitoring logs

- [ ] **Monitor During Playback**
  - [ ] Watch console during background playback
  - [ ] Should see periodic recovery checks
  - [ ] No error messages
  - [ ] No unexpected warnings

## Compatibility Tests

- [ ] **Firefox Versions**
  - [ ] Test on Firefox 147+ (minimum version)
  - [ ] Test on latest Firefox release
  - [ ] (Optional) Test on Firefox Nightly

- [ ] **Site Variants**
  - [ ] www.youtube.com (standard desktop)
  - [ ] m.youtube.com (mobile web)
  - [ ] youtube.com/embed/* (embedded players)
  - [ ] youtube-nocookie.com
  - [ ] vimeo.com
  - [ ] player.vimeo.com

- [ ] **Operating Systems**
  - [ ] Linux (if applicable)
  - [ ] Windows (if applicable)
  - [ ] macOS (if applicable)
  - [ ] Android (if applicable)
  - [ ] iOS (if applicable - note: limited Firefox iOS support)

## MediaSession API Tests

- [ ] **Mobile OS Integration**
  - [ ] Play video on mobile
  - [ ] Check notification controls appear
  - [ ] Test play/pause from notification
  - [ ] Verify metadata shows in notification

- [ ] **System Media Controls**
  - [ ] Test hardware media keys (if available)
  - [ ] Test Bluetooth headset controls
  - [ ] Verify all controls work as expected

## Video Recovery Tests

- [ ] **Unexpected Pause Recovery**
  - [ ] Play video in background
  - [ ] Trigger system resource constraints (if possible)
  - [ ] Extension should auto-resume if paused unexpectedly

- [ ] **User Pause Respect**
  - [ ] Manually pause video
  - [ ] Extension should NOT auto-resume user pauses
  - [ ] Only auto-resume unexpected pauses

## Privacy & Security Tests

- [ ] **Network Monitoring**
  - [ ] Open browser DevTools → Network tab
  - [ ] Use extension
  - [ ] No outgoing network requests from extension
  - [ ] No data sent to external servers

- [ ] **Permissions Verification**
  - [ ] Extension requests minimal permissions
  - [ ] No storage permission requested
  - [ ] Only content script injection on YouTube/Vimeo
  - [ ] No unnecessary permissions

- [ ] **Code Inspection**
  - [ ] No eval() usage
  - [ ] No external script loading
  - [ ] CSP compliance verified
  - [ ] Xray vision properly used

## Final Validation

- [ ] **Complete Workflow Test**
  - [ ] Install extension fresh
  - [ ] Open YouTube
  - [ ] Start playing a music playlist
  - [ ] Minimize Firefox
  - [ ] Leave playing for 30+ minutes
  - [ ] Uninterrupted playback - no pauses
  - [ ] Extension working as expected

- [ ] **Vimeo Workflow Test**
  - [ ] Open Vimeo
  - [ ] Play video
  - [ ] Switch tabs
  - [ ] Verify continuous playback

- [ ] **User Acceptance**
  - [ ] Ask someone else to test
  - [ ] Get feedback on functionality
  - [ ] Verify it solves the background playback problem

## Known Issues Checklist

Document any issues found:

| Issue | Severity | Reproducible? | Notes |
| ----- | -------- | ------------- | ----- |
|       |          |               |       |

## Test Results Summary

Date: _______________  
Firefox Version: _______________  
OS: _______________  

**Overall Result:** ☐ Pass ☐ Fail ☐ Partial

**Critical Issues:** _______________

**Minor Issues:** _______________

**Ready for Release:** ☐ Yes ☐ No

## Notes

Additional observations:
```
[Your notes here]
```

---

**Testing completed by:** _______________  
**Date:** _______________  
**Sign-off:** ☐ Approved for deployment
