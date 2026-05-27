# Design — teed

## App flow

```
CLI start (teed <keyword>)
        │
        ▼
  Clear console, show header
        │
        ▼
  Read config (~/.teed_feeds.json + ~/.teed_settings.json)
        │
        ▼
  Fetch all RSS feeds concurrently (pool of 5)
        │
        ▼
  Filter & rank by keyword (exact match → OR token search)
        │
        ▼
  Display results (title + source + relative time)
        │
        ▼
  Keyboard navigation (↑↓ to select, Enter for detail)
        │
        ├──→ Detail view (full text preview + link)
        │       └──→ Press 'o' to open in browser
        │
        └──→ Press 'q' or Esc to quit
```

## Component tree (Ink/React for terminal)

```
<App>
├── <Header>           — App name, version, search keyword
├── <SearchResults>    — Scrollable list of matching articles
│   └── <ResultItem>   — Title, source name, relative time
├── <DetailView>       — Full article preview (shown on Enter)
└── <Spinner>          — Loading animation during fetch
```

## Data flow

```
RSS feeds (80+ built-in + custom)
       │
       ▼
rss-parser → HTML decode → Remove accents → Tokenize
       │
       ▼
Keyword matching (exact first, then OR tokens)
       │
       ▼
Deduplicate by URL → Sort by date → Limit
       │
       ▼
Display in terminal via Ink
```

- Concurrency: 5 simultaneous requests max
- Timeout: 8s per request, 1 retry on failure
- Accent-insensitive: Vietnamese diacritics removed before matching

## Keyboard navigation

| Key | Action |
|---|---|
| `↑` / `k` | Move selection up |
| `↓` / `j` | Move selection down |
| `Enter` | Open article detail view |
| `o` | Open article URL in default browser |
| `Esc` / `q` | Close detail / Quit app |
| `/` | New search (from detail view) |

## Config persistence

| File | Location | Purpose |
|---|---|---|
| `~/.teed_feeds.json` | User home | Custom RSS feeds (array of `{name, url}`). Deleted = reset to defaults. |
| `~/.teed_settings.json` | User home | Settings: `articleLimit` (5-10). Configured via `/setup <5-10>`. |

80+ built-in feeds covering major Vietnamese news outlets.

## CLI arguments

```
teed <keyword>   — Search articles by keyword
```

Parsed via `meow` package. Single positional argument.

## Visual design (terminal)

- Clean Ink layout with proper box-drawing characters
- Header bar with app name and search term
- Results list: alternating row colors for readability
- Selected item highlighted with inverse/reversed colors
- Detail view: scrollable text area with article title, source, date, and content preview
- Spinner animation during fetch

## Testing

- Framework: Ava + `ink-testing-library`
- Test file: `source/__tests__/ui.tsx`
- Run: `npm test` (prettier → xo → ava)
- Snapshot testing for UI components
