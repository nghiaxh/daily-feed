import React, {useState, useCallback} from 'react';
import {Text, Box, useStdout} from 'ink';
import TextInput from 'ink-text-input';
import {aggregateNews} from './feeds/aggregator.js';
import {loadFeeds, addFeed, removeFeed} from './config.js';
import type {Article} from './feeds/rss.js';

const COMMANDS_LIST = `
  /list              Xem danh sách feeds
  /add <url>         Thêm feed mới
  /remove <url|*>    Xóa feed
  /exit              Thoát chương trình
  Ctrl+C             Thoát
`;

const sanitizeInput = (raw: string): string => {
	return raw
		.normalize('NFC')
		.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
		.trim();
};

const App = () => {
	const [input, setInput] = useState('');
	const [feeds, setFeeds] = useState<string[]>(() => loadFeeds());
	const [articles, setArticles] = useState<Article[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [message, setMessage] = useState('');
	const [searched, setSearched] = useState(false);

	const {stdout} = useStdout();
	const rows = stdout?.rows ?? 24;
	const inputHeight = 3;
	const contentMaxHeight = rows - inputHeight;

	const handleSubmit = useCallback(
		async (value: string) => {
			const trimmed = sanitizeInput(value);
			if (!trimmed) return;

			if (trimmed === '/') {
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

				if (cmd === 'exit') {
					process.exit(0);
				} else if (cmd === 'list') {
					const maxShow = 20;
					const shown = feeds.slice(0, maxShow);
					let msg = `Feeds (${feeds.length}):\n${shown
						.map((f, i) => `${i + 1}. ${f}`)
						.join('\n')}`;
					if (feeds.length > maxShow) {
						msg += `\n... và ${feeds.length - maxShow} feed khác.`;
					}
					setMessage(msg);
				} else if (cmd === 'add' && parts[1]) {
					const newFeeds = addFeed(parts[1]);
					setFeeds(newFeeds);
					setMessage(`Đã thêm: ${parts[1]}`);
				} else if (cmd === 'remove') {
					const target = parts[1];
					if (!target) {
						setMessage('Cần URL hoặc * để xóa tất cả.');
					} else {
						const newFeeds = removeFeed(target);
						setFeeds(newFeeds);
						setMessage(
							target === '*'
								? 'Đã xóa tất cả feed tùy chỉnh.'
								: `Đã xóa: ${target}`,
						);
					}
				} else {
					setMessage('Lệnh không hợp lệ.');
				}
				setInput('');
				return;
			}

			setMessage('');
			setError('');
			setArticles([]);
			setLoading(true);
			setSearched(true);
			try {
				const result = await aggregateNews(trimmed, 5, feeds);
				setArticles(result);
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Lỗi không xác định');
			} finally {
				setLoading(false);
				setInput('');
			}
		},
		[feeds],
	);

	const showHelp = input.startsWith('/');

	return (
		<Box height={rows} flexDirection="column">
			<Box
				flexGrow={1}
				height={contentMaxHeight}
				overflow="hidden"
				flexDirection="column"
			>
				{showHelp && (
					<Box flexDirection="column">
						<Text>{COMMANDS_LIST}</Text>
					</Box>
				)}

				{!showHelp && message && (
					<Box flexDirection="column">
						<Text>{message}</Text>
					</Box>
				)}

				{!showHelp &&
					searched &&
					!loading &&
					articles.length === 0 &&
					!error && <Text>Không tìm thấy bài nào.</Text>}

				{!showHelp &&
					articles.length > 0 &&
					articles.map((a, i) => (
						<Box key={a.link || String(i)} flexDirection="column" marginY={0.5}>
							<Text bold>
								[{i + 1}] {a.title}
							</Text>
							<Text dimColor>
								{a.source} - {a.date || 'Không rõ ngày'}
							</Text>
							<Text>{a.snippet}</Text>
							<Text color="cyan">{a.link}</Text>
						</Box>
					))}

				{!showHelp && loading && (
					<Text color="yellow" bold>
						Đang tìm kiếm...
					</Text>
				)}

				{!showHelp && error && <Text color="red">{error}</Text>}
			</Box>

			<Box
				borderStyle="round"
				borderColor="white"
				paddingX={0.5}
				flexShrink={0}
			>
				<TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
			</Box>
		</Box>
	);
};

export default App;
