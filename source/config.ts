import {readFileSync, writeFileSync, existsSync, unlinkSync} from 'fs';
import {homedir} from 'os';
import {join} from 'path';
import {DEFAULT_RSS_FEEDS} from './feeds/rss.js';

const CONFIG_PATH = join(homedir(), '.teed_feeds.json');

export function loadFeeds(): string[] {
	if (!existsSync(CONFIG_PATH)) return DEFAULT_RSS_FEEDS;
	try {
		const data = readFileSync(CONFIG_PATH, 'utf8');
		const arr = JSON.parse(data);
		return Array.isArray(arr) && arr.length > 0 ? arr : DEFAULT_RSS_FEEDS;
	} catch {
		return DEFAULT_RSS_FEEDS;
	}
}

function saveFeeds(feeds: string[]): void {
	writeFileSync(CONFIG_PATH, JSON.stringify(feeds, null, 2), 'utf8');
}

export function addFeed(url: string): string[] {
	const feeds = loadFeeds();
	if (!feeds.includes(url)) {
		feeds.push(url);
		saveFeeds(feeds);
	}
	return feeds;
}

export function removeFeed(target: string): string[] {
	if (target === '*') {
		if (existsSync(CONFIG_PATH)) unlinkSync(CONFIG_PATH);
		return DEFAULT_RSS_FEEDS;
	}
	let feeds = loadFeeds();
	feeds = feeds.filter(f => f !== target);
	saveFeeds(feeds);
	return feeds.length > 0 ? feeds : DEFAULT_RSS_FEEDS;
}
