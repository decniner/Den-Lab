# Codex Usage Dashboard

A compact, CodexBar-inspired, mobile-friendly dashboard for keeping personal Codex usage notes and allowance snapshots.

## What it tracks

- Manually recorded input and output token counts for Web, CLI, and Desktop sessions.
- Manually recorded allowance snapshots by 5-hour, weekly, monthly, or custom window, with optional reset countdowns.
- Local summaries, recent history, JSON export, and JSON import.

The page does not connect to ChatGPT, CodexBar, Codex clients, or OpenAI APIs. A static GitHub Pages site cannot read local CodexBar/CLI files or browser sign-in sessions. Personal ChatGPT plan limits are not fetched automatically. Copy figures from CodexBar or the account usage view into the snapshot form. A session token count is not the same as remaining plan allowance.

## Privacy and device behavior

Entries are stored in the current browser's local storage. They are not uploaded, synchronized to other devices, or included in the GitHub Pages files. Use Export backup / Import backup to move records between browsers. Do not enter credentials, API keys, session tokens, or other secrets.

The page makes no background data requests and uses no external libraries.

## Open

Open `index.html` directly, or use the published GitHub Pages project URL:

`https://decniner.github.io/Den-Lab/05-codex-usage-dashboard/`
