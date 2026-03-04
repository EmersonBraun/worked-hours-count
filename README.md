# Worked Hours Count

A desktop application for tracking worked hours with Jira integration. Built with Tauri 2, React, and SQLite.

## Features

- **Timer** — Start/stop timer linked to a Jira issue, with periodic prompts asking what you're working on
- **Manual Entry** — Add time entries manually with date and time pickers
- **Run History** — View recorded runs in three modes:
  - **By Run** — Chronological list of all runs
  - **By Issue** — Runs grouped by Jira issue with notes timeline
  - **Calendar** — Monthly calendar view with daily totals
- **Jira Integration**
  - Fetch assigned issues
  - Sync worklogs to Jira
  - Send structured work log comments (ADF format with table, notes, and totals)
- **Issue Notes** — Add notes to issues at any time, independently of runs
- **Scheduled Prompts** — Configure specific times of day to trigger "what are you doing?" prompts
- **CSV Export** — Export run history with date range in the filename
- **SQLite Storage** — All data persisted locally

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install)
- Tauri 2 system dependencies — see [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)

## Getting Started

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## Project Structure

```
src/                    # React frontend
  pages/                # App pages (Home, List, Settings)
  components/           # UI components (RunTime, CalendarView, TimePicker, etc.)
  db/                   # SQLite database layer
  jira/                 # Jira API client and token management
  utils/                # Date formatting and CSV export utilities
src-tauri/              # Tauri backend (Rust)
```

## Configuration

1. Open **Settings** in the app
2. Enter your Jira domain, email, and API token
3. Configure prompt interval and/or scheduled prompt times
4. Click **Save & Connect**

## Tech Stack

- **Tauri 2** — Desktop runtime
- **React 19** + **React Router 7** — UI framework
- **Vite 6** — Build tool
- **Tailwind CSS 4** — Styling
- **SQLite** (via tauri-plugin-sql) — Local database
- **TypeScript 5** — Type safety

## License

This project is licensed under the [MIT License](LICENSE).
