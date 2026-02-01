# Security Policy

## Supported Versions

Use the latest version of the extension to ensure you have the most up-to-date security fixes.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.0+  | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please bring it to our attention.

### How to Report

Please do **NOT** report security vulnerabilities through public GitHub issues.

Instead, please report them through our contact form at https://labinator.com/contact

You should expect to receive a response within 48 hours. If for some reason you do not, please follow up with us to ensure we received your original message.

### Process

1. **Triage:** We will review your report and confirm the specific behavior.
2. **Fix:** We will prepare a patch for the issue.
3. **Release:** We will release a new version of the extension.
4. **Disclosure:** Once the fix is released, we will publicly disclose the vulnerability if appropriate.

## Security Best Practices

This project follows strict security guidelines:
- Minimal permissions (no storage, no network access)
- No external code execution (`eval`, etc.)
- Content Security Policy (CSP) compliance
- No data collection or transmission
- Firefox Xray Vision security model compliance

See [CONTRIBUTING.md](CONTRIBUTING.md) for more development security guidelines.
