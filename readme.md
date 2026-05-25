# teed — Terminal news reader

**teed** is a CLI tool that lets you search and read news from popular Vietnamese sources (VnExpress, Tuổi Trẻ, Thanh Niên, 24h, and more) right in your terminal.

## Requirements

- Node.js >= 18

## Installation

```bash
npm install -g @nghiaxh/teed
```

## Development

```bash
# Clone repository
git clone https://github.com/nghiaxh/teed
cd teed

# Install dependencies
npm install

# Link the command
npm link

# Run in dev mode (auto-compile on changes)
npm run dev

# In another terminal, start the app
teed
```

## Usage

Start the app, type a keyword, and press **Enter** to search for news.

### Commands

| Command            | Description                        |
| ------------------ | ---------------------------------- |
| `/list`            | List all available RSS feeds       |
| `/add <url>`       | Add a new RSS feed                 |
| `/remove <url\|*>` | Remove a feed, or use `*` to reset |
| `/exit`            | Exit the program                   |
| `Ctrl+C`           | Quick exit                         |

## Feed management

- Ships with 80+ built-in feeds from major Vietnamese news outlets.
- Add custom feeds via `/add <url>`. They are persisted across sessions.
- Use `/remove <url>` to delete a specific feed, or `/remove *` to reset to defaults.

## Project structure

```
teed/
├── source/
│   ├── app.tsx               # Main app component
│   ├── cli.tsx               # CLI entry point
│   ├── config.ts             # Feed config file management
│   └── feeds/
│       ├── aggregator.ts     # Aggregates news by keyword
│       └── rss.ts            # RSS fetching, search, stopword removal
├── package.json
└── readme.md
```

## Uninstall

```bash
npm uninstall -g @nghiaxh/teed
```
