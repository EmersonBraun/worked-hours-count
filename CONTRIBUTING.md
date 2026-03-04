# Contributing

Thanks for your interest in contributing to Worked Hours Count!

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/<your-username>/worked-hours-count.git
   cd worked-hours-count
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Make sure you have Rust and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) installed
5. Start the dev server:
   ```bash
   npm run tauri dev
   ```

## Development Workflow

1. Create a branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```
2. Make your changes
3. Test locally with `npm run tauri dev`
4. Verify the build passes:
   ```bash
   npm run build
   ```
5. Commit your changes with a clear message
6. Push and open a Pull Request

## Code Style

- TypeScript for all frontend code
- Tailwind CSS for styling — follow existing class patterns
- Keep components small and focused
- Use the existing database layer (`src/db/database.ts`) for data access
- Use the Jira client (`src/jira/client.ts`) for API calls

## Project Structure

- `src/pages/` — Top-level page components
- `src/components/` — Reusable UI components
- `src/db/` — SQLite database functions
- `src/jira/` — Jira API integration
- `src/utils/` — Shared utilities
- `src-tauri/` — Tauri backend (Rust)

## Reporting Issues

Open an issue on GitHub with:
- Steps to reproduce
- Expected vs actual behavior
- OS and app version

## Pull Requests

- Keep PRs focused on a single change
- Include a description of what and why
- Make sure existing functionality isn't broken
