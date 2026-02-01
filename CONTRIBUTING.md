# Contributing

Thank you for considering contributing to this project! We welcome bug reports, feature requests, and pull requests.

## Getting Started

1. **Fork the repository** on your code hosting platform.
2. **Clone your fork** locally.
3. **Install dependencies** using [Bun](https://bun.sh):
   ```bash
   bun install
   ```

## Development Workflow

1. Create a new branch for your feature or fix.
2. Make your changes.
3. Run the test suite to ensure no regressions:
   ```bash
   bun test
   ```
   This command runs both the linter and type checker.
4. Fix any linting errors:
   ```bash
   bun run lint:fix
   ```

## Pull Request Guidelines

- **Clean Code**: Ensure your code adheres to the project's coding standards (enforced by ESLint).
- **Documentation**: Update the README or other documentation if you are changing functionality.
- **Description**: Describe your changes clearly in the Pull Request description. explain *why* the change is needed and *how* it works.

## Code Style

This project uses ESLint with a specific configuration.
- We prioritize code readability and maintainability.
- Do not disable linting rules unless absolutely necessary and with a valid reason provided in comments.

## Reporting Issues

When reporting an issue, please include:
- The version of Firefox you are using.
- The version of the extension.
- Usage context (Desktop vs. Mobile/Android).
- Steps to reproduce the issue.
