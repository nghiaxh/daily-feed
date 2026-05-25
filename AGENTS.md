# AGENTS.md — teed

## What it is

CLI news reader for Vietnamese RSS feeds. Ink (React for terminals) app that aggregates RSS feeds and searches by keyword. Built with TypeScript, bundled via `tsc` to `dist/`.

## Commands

```sh
npm run build          # tsc
npm run dev            # tsc --watch
npm run typecheck      # tsc --noEmit
npm test               # prettier --check . && xo && ava
```

## Entrypoints & structure

| Path                         | Role                                                                                                                                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `source/cli.tsx`             | CLI entrypoint (`bin` → `dist/cli.js`). Clears console, renders `<App>` via Ink.                                                                                                                                   |
| `source/app.tsx`             | Main app component: input handling, `/commands`, search with spinner animation, keyboard navigation (↑↓) through results, Enter to view details, `o` to open link. Exports `relativeTime`, `truncate` for testing. |
| `source/config.ts`           | Reads/writes custom feeds to `~/.teed_feeds.json`. Also manages settings (`~/.teed_settings.json`) for article limit. Falls back to 80+ built-in defaults.                                                         |
| `source/feeds/rss.ts`        | RSS fetching, HTML decoding, Vietnamese accent removal, stopword filtering, keyword matching. Concurrency-limited to 5 simultaneous requests.                                                                      |
| `source/feeds/aggregator.ts` | Orchestrates fetch: exact match first, then falls back to OR token search. Dedupes & limits results.                                                                                                               |
| `source/__tests__/ui.tsx`    | Tests. Uses `ava` + `ink-testing-library`.                                                                                                                                                                         |

## Testing

- **Framework**: `ava` with `--import=tsx` for TypeScript (not `ts-node`).
- Run: `npm test` (runs prettier, xo, then ava).
- Single test: `npx ava source/__tests__/ui.tsx`.
- Tests are in `source/__tests__/` (not root); ava config restricts to this path.

## Style & linting

- `prettier` — config `@vdemedes/prettier-config` (semi: true, singleQuote: true, tabs)
- `xo` — prettier integration enabled, many noisy unicorn/TS rules disabled in config
- Indent: tabs (`.editorconfig`)

## RSS fetching

Fetches use a concurrent pool (5 simultaneous requests) with 1 retry on failure. Each request has an 8s timeout. With 80+ feeds, max completion is bounded by pool size × slowest request.

## Config persistence

- Custom RSS feeds are stored at `~/.teed_feeds.json`. Deleting this file resets to defaults.
- Settings (article limit) are stored at `~/.teed_settings.json`. Configured via `/setup <5-10>`.

## Keyboard navigation

When search results are displayed:

- **↑/↓** — Navigate through articles
- **Enter** — View article details
- **o** — Open article link in browser (from detail view)
- **Esc/Enter** — Close detail view and return to list

## Debugging

Set `DEBUG` env var to see per-feed fetch results and rejected promises:

```sh
DEBUG=1 npm run dev
```

## Runtime

- Node >= 18.
- Published as `@nghiaxh/teed`, CLI binary: `teed`.
- Global install: `npm install -g @nghiaxh/teed`.
