# Changelog

All notable changes to Play YouTube Video in Background are documented here.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- The package is smaller: development files (lock file, configs, Markdown docs) are no longer included in the AMO
  upload. The 1.1.1 build on AMO was uploaded before this change and still contains them; they are never loaded.

## [1.1.1] - 2026-11-06

### Changed

- **Requires Firefox 159 or newer** (desktop and Android). `strict_min_version` is now `159.0`, up from `153.0`.
  Older Firefox releases carry known, unpatched security vulnerabilities. Users on an older Firefox stay on 1.1.0
  until they update their browser.
- New toolbar icon in the Labinator icon system: a white play triangle on a front window, with a second window
  behind it, on an ultramarine square. It replaces the gradient icon.
- Development dependencies updated (ESLint, web-ext, globals, type definitions). None of them ship in the add-on.

### Unchanged

- Extension code is identical to 1.1.0. No new permissions.

## [1.1.0] - 2026-08-13

### Changed

- **Requires Firefox 153 or newer**, up from 147.
- More reliable playback monitoring and recovery:
  - the correct video element is targeted when a page has several;
  - recovery attempts are capped, so a stubborn page can no longer cause an endless retry loop;
  - pauses you make yourself are respected and never auto-recovered;
  - better integration with media keys and system media controls (MediaSession API).
- Debug logging for diagnosing problems, off by default.

## [1.0.2] - 2026-02-04

### Changed

- Pausing a video yourself is now permanent until you press play again. Before, auto-recovery could resume it
  after a 30-second cooldown.

## [1.0.1] - 2026-02-04

### Fixed

- A video could start playing again after you paused it by hand.

## [1.0.0] - 2026-02-01

### Added

- First release: keeps YouTube (including youtube-nocookie.com embeds) and Vimeo videos playing when you switch
  tabs, minimize the browser, or lock the screen on mobile.
