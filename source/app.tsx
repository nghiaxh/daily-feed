import React from 'react';
import {Text, Box} from 'ink';
import type {Article} from './feeds/rss.js';

interface AppProps {
	keyword: string;
	articles: Article[];
	errorMsg?: string;
}

const App = ({keyword, articles, errorMsg}: AppProps) => {
	return (
		<Box flexDirection="column">
			<Text bold backgroundColor="cyan" color="white">
				Tìm kiếm: {keyword}
			</Text>
			{errorMsg && <Text color="red">✖ {errorMsg}</Text>}
			{articles.length === 0 && !errorMsg && (
				<Text>Không tìm thấy bài nào cho "{keyword}"</Text>
			)}
			{articles.map((a, i) => (
				<Box key={a.link || String(i)} flexDirection="column" marginY={1}>
					<Text bold>
						[{i + 1}] {a.title}
					</Text>
					<Text dimColor>
						{a.source} – {a.date || 'Không rõ ngày'}
					</Text>
					<Text>{a.snippet}</Text>
					<Text color="cyan">{a.link}</Text>
				</Box>
			))}
		</Box>
	);
};

export default App;
