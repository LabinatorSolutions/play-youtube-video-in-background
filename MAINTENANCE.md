# Maintenance Guide

## Renovate Integration

This repository is configured to use [Renovate](https://docs.renovatebot.com/) for automated dependency updates.

### How to Enable Renovate

1. Navigate to the [Renovate GitHub App page](https://github.com/apps/renovate).
2. Click **Install**.
3. Select your organization or personal account.
4. Choose "Only select repositories" and select `play-youtube-video-in-background` (or "All repositories" if preferred).
5. Click **Install** / **Save**.

Once installed, Renovate will detect the `renovate.json` file in this repository and create an Onboarding Pull Request. Merge this PR to activate Renovate.

### What Renovate Manages

- **NPM Dependencies**: Checks `package.json` for updates to `web-ext`, `eslint`, and other dependencies.
- **GitHub Actions**: Checks `.github/workflows/ci.yml` for updates to actions like `checkout` and `setup-node`.

### Configuration

Renovate is configured in `renovate.json`. It is currently set to:
- Extend generic base configuration.
- Group minor and patch updates for all packages into a single PR (`all-non-major`) to reduce noise.
- Automatically merge these minor/patch updates if CI passes (Automerge).
