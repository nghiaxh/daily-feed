import {
	fetchRSSFeeds,
	fetchRSSFeedsByWords,
	extractKeywords,
	type Article,
} from './rss.js';

export async function aggregateNews(
	keyword: string,
	limit: number,
	customFeeds?: string[],
): Promise<Article[]> {
	// Try exact keyword match first
	let raw = await fetchRSSFeeds(keyword, customFeeds);

	// Fall back to OR search with extracted tokens
	if (raw.length === 0) {
		const tokens = extractKeywords(keyword);
		if (tokens.length > 0) {
			raw = await fetchRSSFeedsByWords(tokens, customFeeds);
		}
	}

	const seen = new Set<string>();
	const deduped = raw.filter(a => {
		const key = a.link.toLowerCase();
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});

	deduped.sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	);

	return deduped.slice(0, limit);
}
