import type { MetadataRoute } from 'next';
import { getAllCategories, getPosts } from '@/lib/wp';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.peperoncinipiccanti.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const entries: MetadataRoute.Sitemap = [{ url: siteUrl, changeFrequency: 'daily', priority: 1 }];

	// Scorre tutte le pagine della REST API (100 alla volta) per includere
	// l'intero archivio, non solo gli ultimi articoli.
	let page = 1;
	let totalPages = 1;
	do {
		const result = await getPosts({ page, perPage: 100 });
		totalPages = result.totalPages;
		for (const post of result.posts) {
			entries.push({
				url: `${siteUrl}/${post.slug}`,
				lastModified: post.date,
				changeFrequency: 'monthly',
				priority: 0.8,
			});
		}
		page += 1;
	} while (page <= totalPages);

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
