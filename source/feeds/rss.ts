import Parser from 'rss-parser';
import {decode} from 'html-entities';
import removeAccents from 'remove-accents';
import {removeStopwords, vie} from 'stopword';

const parser = new Parser({timeout: 8000});
const CONCURRENCY = 5;

export interface Article {
	title: string;
	link: string;
	snippet: string;
	source: string;
	date: string;
}

export const DEFAULT_RSS_FEEDS: string[] = [
	'https://vnexpress.net/rss/tin-xem-nhieu.rss',
	'https://vnexpress.net/rss/tin-moi-nhat.rss',
	'https://vnexpress.net/rss/vne-go.rss',
	'https://vnexpress.net/rss/spotlight.rss',
	'https://vnexpress.net/rss/thoi-su.rss',
	'https://vnexpress.net/rss/the-gioi.rss',
	'https://vnexpress.net/rss/kinh-doanh.rss',
	'https://vnexpress.net/rss/khoa-hoc.rss',
	'https://vnexpress.net/rss/giai-tri.rss',
	'https://vnexpress.net/rss/the-thao.rss',
	'https://vnexpress.net/rss/phap-luat.rss',
	'https://vnexpress.net/rss/giao-duc.rss',
	'https://vnexpress.net/rss/suc-khoe.rss',
	'https://vnexpress.net/rss/du-lich.rss',
	'https://vnexpress.net/rss/so-hoa.rss',
	'https://vnexpress.net/rss/oto-xe-may.rss',

	'https://tuoitre.vn/rss/tin-moi-nhat.rss',
	'https://tuoitre.vn/rss/thoi-su.rss',
	'https://tuoitre.vn/rss/the-gioi.rss',
	'https://tuoitre.vn/rss/phap-luat.rss',
	'https://tuoitre.vn/rss/kinh-doanh.rss',
	'https://tuoitre.vn/rss/nhip-song-so.rss',
	'https://tuoitre.vn/rss/the-thao.rss',
	'https://tuoitre.vn/rss/giao-duc.rss',
	'https://tuoitre.vn/rss/suc-khoe.rss',
	'https://tuoitre.vn/rss/du-lich.rss',
	'https://tuoitre.vn/rss/van-hoa.rss',
	'https://tuoitre.vn/rss/giai-tri.rss',
	'https://tuoitre.vn/rss/khoa-hoc.rss',
	'https://tuoitre.vn/rss/xe.rss',

	'https://thanhnien.vn/rss/home.rss',
	'https://thanhnien.vn/rss/thoi-su.rss',
	'https://thanhnien.vn/rss/the-gioi.rss',
	'https://thanhnien.vn/rss/kinh-te.rss',
	'https://thanhnien.vn/rss/cong-nghe.rss',
	'https://thanhnien.vn/rss/the-thao.rss',
	'https://thanhnien.vn/rss/giao-duc.rss',
	'https://thanhnien.vn/rss/suc-khoe.rss',
	'https://thanhnien.vn/rss/du-lich.rss',
	'https://thanhnien.vn/rss/van-hoa.rss',
	'https://thanhnien.vn/rss/giai-tri.rss',
	'https://thanhnien.vn/rss/gioi-tre.rss',
	'https://thanhnien.vn/rss/xe.rss',

	'https://www.24h.com.vn/upload/rss/tintuctrongngay.rss',
	'https://www.24h.com.vn/upload/rss/bongda.rss',
	'https://www.24h.com.vn/upload/rss/anninhhinhsu.rss',
	'https://www.24h.com.vn/upload/rss/thoitrang.rss',
	'https://www.24h.com.vn/upload/rss/taichinhbatdongsan.rss',
	'https://www.24h.com.vn/upload/rss/amthuc.rss',
	'https://www.24h.com.vn/upload/rss/phim.rss',
	'https://www.24h.com.vn/upload/rss/giaoducduhoc.rss',
	'https://www.24h.com.vn/upload/rss/bantrecuocsong.rss',
	'https://www.24h.com.vn/upload/rss/thethao.rss',
	'https://www.24h.com.vn/upload/rss/congnghethongtin.rss',
	'https://www.24h.com.vn/upload/rss/oto.rss',
	'https://www.24h.com.vn/upload/rss/thitruongtieudung.rss',
	'https://www.24h.com.vn/upload/rss/suckhoedoisong.rss',
	'https://www.24h.com.vn/upload/rss/cuoi24h.rss',

	'https://infonet.vietnamnet.vn/rss/doi-song.rss',
	'https://infonet.vietnamnet.vn/rss/thi-truong.rss',
	'https://infonet.vietnamnet.vn/rss/the-gioi.rss',
	'https://infonet.vietnamnet.vn/rss/gia-dinh.rss',
	'https://infonet.vietnamnet.vn/rss/gioi-tre.rss',
	'https://infonet.vietnamnet.vn/rss/khoe-dep.rss',
	'https://infonet.vietnamnet.vn/rss/chuyen-la.rss',
	'https://infonet.vietnamnet.vn/rss/quan-su.rss',
];

function cleanText(text: string): string {
	return decode(text)
		.replace(/&apos;/g, "'")
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&#39;/g, "'")
		.replace(/&#x27;/g, "'");
}

function removeVietnameseTones(str: string): string {
	return removeAccents(str).toLowerCase();
}

export function extractKeywords(keyword: string): string[] {
	const noTone = removeVietnameseTones(keyword.trim());
	const tokens = noTone.split(/\s+/).filter(t => t.length >= 2);
	const meaningfulTokens = removeStopwords(tokens, vie);
	return meaningfulTokens;
}

async function concurrentFetch<T>(
	items: string[],
	fn: (item: string) => Promise<T[]>,
	concurrency: number,
): Promise<T[]> {
	const results: T[] = [];
	let index = 0;

	async function worker(): Promise<void> {
		while (index < items.length) {
			const i = index++;
			try {
				const item = items[i]!;
				const value = await fn(item);
				results.push(...value);
			} catch (error) {
				if (process.env['DEBUG']) {
					console.error(`[concurrentFetch] Error at index ${i}:`, error);
				}
			}
		}
	}

	await Promise.all(
		Array.from({length: Math.min(concurrency, items.length)}, () => worker()),
	);

	return results;
}

async function fetchOneFeed(url: string, kw: string): Promise<Article[]> {
	const maxRetries = 1;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			const feed = await parser.parseURL(url);
			const kwNoTone = removeVietnameseTones(kw.trim());

			const articles = (feed.items ?? [])
				.filter(item => {
					if (!kw.trim()) return true;
					const titleNoTone = removeVietnameseTones(item.title ?? '');
					const snippetNoTone = removeVietnameseTones(
						item.contentSnippet ?? item.summary ?? '',
					);
					return (
						titleNoTone.includes(kwNoTone) || snippetNoTone.includes(kwNoTone)
					);
				})
				.map(item => ({
					title: cleanText(item.title ?? '(No title)'),
					link: item.link ?? '',
					snippet: cleanText(
						(item.contentSnippet ?? item.summary ?? '').slice(0, 250),
					),
					source: feed.title ?? new URL(url).hostname,
					date: item.pubDate ?? item.isoDate ?? '',
				}));

			if (process.env['DEBUG']) {
				console.error(`[DEBUG] ${url} -> ${articles.length} articles`);
			}

			return articles;
		} catch (e) {
			if (attempt < maxRetries) {
				await new Promise(r => setTimeout(r, 1000));
				continue;
			}

			console.error(
				`Error fetching feed ${url}:`,
				e instanceof Error ? e.message : e,
			);
			return [];
		}
	}

	return [];
}

async function fetchOneFeedByWords(
	url: string,
	keywords: string[],
): Promise<Article[]> {
	const maxRetries = 1;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			const feed = await parser.parseURL(url);
			const kwNoTones = keywords
				.map(k => removeVietnameseTones(k))
				.filter(Boolean);

			if (kwNoTones.length === 0) return [];

			const articles = (feed.items ?? [])
				.filter(item => {
					const titleNoTone = removeVietnameseTones(item.title ?? '');
					const snippetNoTone = removeVietnameseTones(
						item.contentSnippet ?? item.summary ?? '',
					);
					return kwNoTones.some(
						kw => titleNoTone.includes(kw) || snippetNoTone.includes(kw),
					);
				})
				.map(item => ({
					title: cleanText(item.title ?? '(No title)'),
					link: item.link ?? '',
					snippet: cleanText(
						(item.contentSnippet ?? item.summary ?? '').slice(0, 250),
					),
					source: feed.title ?? new URL(url).hostname,
					date: item.pubDate ?? item.isoDate ?? '',
				}));

			if (process.env['DEBUG']) {
				console.error(
					`[DEBUG] ${url} -> ${articles.length} articles (by words)`,
				);
			}

			return articles;
		} catch (e) {
			if (attempt < maxRetries) {
				await new Promise(r => setTimeout(r, 1000));
				continue;
			}

			console.error(
				`Error fetching feed ${url}:`,
				e instanceof Error ? e.message : e,
			);
			return [];
		}
	}

	return [];
}

export async function fetchRSSFeeds(
	keyword: string,
	customFeeds?: string[],
): Promise<Article[]> {
	const feeds = customFeeds?.length ? customFeeds : DEFAULT_RSS_FEEDS;
	return concurrentFetch(feeds, url => fetchOneFeed(url, keyword), CONCURRENCY);
}

export async function fetchRSSFeedsByWords(
	keywords: string[],
	customFeeds?: string[],
): Promise<Article[]> {
	const feeds = customFeeds?.length ? customFeeds : DEFAULT_RSS_FEEDS;
	return concurrentFetch(
		feeds,
		url => fetchOneFeedByWords(url, keywords),
		CONCURRENCY,
	);
}
