import React, {useState, useCallback, useEffect} from 'react';
import {Text, Box, useStdout, useInput} from 'ink';
import TextInput from 'ink-text-input';
import {aggregateNews} from './feeds/aggregator.js';
import {
	loadFeeds,
	addFeed,
	removeFeed,
	loadSettings,
	saveSettings,
} from './config.js';
import type {Article} from './feeds/rss.js';
import {exec} from 'node:child_process';

const COMMANDS_LIST = `
  /list              List all feeds
  /add <url>         Add a new feed
  /remove <url|*>    Remove a feed
  /setfeed <n>       Set max articles (5-10)
  /q                 Quit the program
`;

const SPINNER_CHARS = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function openUrl(url: string): void {
	const quoted = url.replace(/"/g, '\\"');
	if (process.platform === 'win32') {
		exec(`start "" "${quoted}"`);
	} else if (process.platform === 'darwin') {
		exec(`open "${quoted}"`);
	} else {
		exec(`xdg-open "${quoted}"`);
	}
}

export function relativeTime(dateStr: string): string {
	if (!dateStr) return '';
	const date = new Date(dateStr);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const minutes = Math.floor(diffMs / 60000);
	if (minutes < 1) return 'Just now';
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	return date.toLocaleDateString('en-US');
}

export function truncate(str: string, maxLen: number): string {
	if (!str || maxLen <= 0) return '';
	if (str.length <= maxLen) return str;
	return str.slice(0, maxLen - 1) + '\u2026';
}

const ArticleRow = ({
	article,
	index,
	width,
	isSelected,
}: {
	article: Article;
	index: number;
	width: number;
	isSelected: boolean;
}) => {
	const titleMax = Math.max(width - 8, 20);
	const prefix = isSelected ? '>' : ' ';
	const fgColor = isSelected ? 'green' : undefined;

	return (
		<Box flexDirection="column" marginY={0}>
			<Box>
				<Text bold color={fgColor ?? 'yellow'}>
					{prefix}[{index + 1}]
				</Text>
				<Text bold wrap="truncate" color={fgColor}>
					{' '}
					{truncate(article.title, titleMax)}
				</Text>
			</Box>
			<Text dimColor>
				{'  '}
				{article.source}
				{article.date ? ` · ${relativeTime(article.date)}` : ''}
			</Text>
		</Box>
	);
};

const FeedRow = ({
	url,
	index,
	isSelected,
}: {
	url: string;
	index: number;
	isSelected: boolean;
}) => {
	const prefix = isSelected ? '>' : ' ';
	return (
		<Box>
			<Text bold color={isSelected ? 'green' : 'yellow'}>
				{prefix}[{index + 1}]
			</Text>
			<Text color={isSelected ? 'green' : undefined} wrap="truncate">
				{' '}
				{url}
			</Text>
		</Box>
	);
};

const DetailView = ({article}: {article: Article}) => (
	<Box flexDirection="column" paddingX={1}>
		<Text bold color="green">
			{article.title}
		</Text>
		<Text dimColor>
			{article.source}
			{article.date ? ` · ${relativeTime(article.date)}` : ''}
		</Text>
		<Box marginY={1}>
			<Text color="cyan" wrap="wrap">
				{article.link}
			</Text>
		</Box>
		{article.snippet && <Text wrap="wrap">{article.snippet}</Text>}
		<Box marginTop={1}>
			<Text dimColor>[Enter] Back [o] Open link</Text>
		</Box>
	</Box>
);

const App = () => {
	const [input, setInput] = useState('');
	const [feeds, setFeeds] = useState<string[]>(() => loadFeeds());
	const [settings, setSettings] = useState(() => loadSettings());
	const [articles, setArticles] = useState<Article[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [message, setMessage] = useState('');
	const [searched, setSearched] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [detailArticle, setDetailArticle] = useState<Article | undefined>(
		undefined,
	);
	const [showFeedList, setShowFeedList] = useState(false);
	const [feedSelectedIndex, setFeedSelectedIndex] = useState(0);
	const [spinnerFrame, setSpinnerFrame] = useState(0);

	const {stdout} = useStdout();
	const columns = stdout?.columns ?? 80;
	const rows = stdout?.rows ?? 24;
	const contentMaxHeight = rows - 2;

	useEffect(() => {
		if (!loading) {
			setSpinnerFrame(0);
			return;
		}

		const timer = setInterval(() => {
			setSpinnerFrame(i => (i + 1) % SPINNER_CHARS.length);
		}, 80);

		return () => clearInterval(timer);
	}, [loading]);

	useInput((char, key) => {
		if (detailArticle) {
			if (key.return || key.escape) {
				setDetailArticle(undefined);
			} else if (char === 'o') {
				openUrl(detailArticle.link);
			}

			return;
		}

		if (showFeedList) {
			if (key.escape) {
				setShowFeedList(false);
			} else if (key.upArrow) {
				setFeedSelectedIndex(i => Math.max(0, i - 1));
			} else if (key.downArrow) {
				setFeedSelectedIndex(i => Math.min(feeds.length - 1, i + 1));
			}

			return;
		}

		if (!articles.length || input.trim()) {
			return;
		}

		if (key.upArrow) {
			setSelectedIndex(i => Math.max(0, i - 1));
		} else if (key.downArrow) {
			setSelectedIndex(i => Math.min(articles.length - 1, i + 1));
		} else if (key.return && selectedIndex >= 0) {
			setDetailArticle(articles[selectedIndex]);
		}
	});

	const handleSubmit = useCallback(
		async (value: string) => {
			const trimmed = value.trim();
			if (!trimmed) {
				setInput('');
				return;
			}

			if (trimmed.startsWith('/')) {
				const parts = trimmed.slice(1).split(/\s+/);
				const cmd = parts[0]?.toLowerCase() ?? '';
				setError('');
				setArticles([]);
				setSearched(false);
				setLoading(false);
				setDetailArticle(undefined);
				setShowFeedList(false);

				if (cmd === 'q') {
					process.exit(0);
				} else if (cmd === 'help') {
					setMessage(COMMANDS_LIST);
				} else if (cmd === 'list') {
					setShowFeedList(true);
					setFeedSelectedIndex(0);
				} else if (cmd === 'add' && parts[1]) {
					const newFeeds = addFeed(parts[1]);
					setFeeds(newFeeds);
					setMessage(`Added: ${parts[1]}`);
				} else if (cmd === 'remove') {
					const target = parts[1];
					if (!target) {
						setMessage('Need a URL or * to remove all custom feeds.');
					} else {
						const newFeeds = removeFeed(target);
						setFeeds(newFeeds);
						setMessage(
							target === '*'
								? 'Removed all custom feeds.'
								: `Removed: ${target}`,
						);
					}
				} else if (cmd === 'setfeed') {
					const n = Number(parts[1]);
					if (Number.isInteger(n) && n >= 5 && n <= 10) {
						const updated = {limit: n};
						saveSettings(updated);
						setSettings(updated);
						setMessage(`Max articles set to ${n}.`);
					} else {
						setMessage('Usage: /setfeed <5-10>');
					}
				} else {
					setMessage('Invalid command.');
				}

				setInput('');
				return;
			}

			setMessage('');
			setError('');
			setArticles([]);
			setLoading(true);
			setSearched(true);
			setSelectedIndex(0);
			setDetailArticle(undefined);
			setShowFeedList(false);
			try {
				const result = await aggregateNews(trimmed, settings.limit, feeds);
				setArticles(result);
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Unknown error');
			} finally {
				setLoading(false);
				setInput('');
			}
		},
		[feeds, settings.limit],
	);

	const showCommands = input.startsWith('/');

	return (
		<Box height={rows} flexDirection="column">
			<Box
				flexGrow={1}
				height={contentMaxHeight}
				overflow="hidden"
				flexDirection="column"
			>
				{showCommands && (
					<Box flexDirection="column">
						<Text>{COMMANDS_LIST}</Text>
					</Box>
				)}

				{detailArticle && <DetailView article={detailArticle} />}

				{showFeedList && !detailArticle && (
					<Box flexDirection="column" minHeight={contentMaxHeight - 2}>
						<Text bold color="green">
							Feeds ({feeds.length}):
						</Text>
						{feeds.map((f, i) => (
							<FeedRow
								key={f}
								url={f}
								index={i}
								isSelected={i === feedSelectedIndex}
							/>
						))}
						<Box marginTop={1}>
							<Text dimColor>[Esc] Back</Text>
						</Box>
					</Box>
				)}

				{!showCommands && !showFeedList && !detailArticle && message && (
					<Box flexDirection="column">
						<Text>{message}</Text>
					</Box>
				)}

				{!showCommands &&
					!showFeedList &&
					!detailArticle &&
					!loading &&
					searched &&
					articles.length === 0 &&
					!error && <Text>No articles found.</Text>}

				{!showCommands &&
					!showFeedList &&
					!detailArticle &&
					articles.length > 0 &&
					articles.map((a, i) => (
						<ArticleRow
							key={a.link || String(i)}
							article={a}
							index={i}
							width={columns}
							isSelected={i === selectedIndex}
						/>
					))}

				{!showCommands && !showFeedList && !detailArticle && loading && (
					<Box>
						<Text color="yellow" bold>
							{SPINNER_CHARS[spinnerFrame]} Searching...
						</Text>
					</Box>
				)}

				{!showCommands && !showFeedList && !detailArticle && error && (
					<Box flexDirection="column">
						<Text color="red">{error}</Text>
						<Text dimColor> Try a different keyword.</Text>
					</Box>
				)}
			</Box>

			{!showFeedList && (
				<Box
					flexShrink={0}
					borderStyle="round"
					borderColor="green"
					paddingX={1}
				>
					<Text bold color="green">
						{'>'}
					</Text>
					<Text> </Text>
					<TextInput
						value={input}
						onChange={setInput}
						onSubmit={handleSubmit}
					/>
				</Box>
			)}
		</Box>
	);
};

export default App;
