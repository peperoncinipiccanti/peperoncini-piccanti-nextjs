import type { MetadataRoute } from 'next';
import { getAllCategories, getAllPostSlugs } from '@/lib/wp';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.peperoncinipiccanti.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const entries: MetadataRoute.Sitemap = [{ url: siteUrl, changeFrequency: 'daily', priority: 1 }];

	// getAllPostSlugs() (non getPosts()): la sitemap non ha bisogno di foto,
	// autore o tassonomie di ogni articolo, solo slug e data — vedi il
	// commento su getAllPostSlugs() in lib/wp.ts.
	const posts = await getAllPostSlugs();
	for (const post of posts) {
		entries.push({
			url: `${siteUrl}/${post.slug}`,
			lastModified: post.date,
			changeFrequency: 'monthly',
			priority: 0.8,
		});
	}

	const categories = await getAllCategories();
	for (const category of categories) {
		entries.push({
			url: `${siteUrl}/${category.slug}`,
			changeFrequency: 'weekly',
			priority: 0.6,
		});
	}

	return entries;
}
