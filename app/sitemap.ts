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
		// Next.js scrive `lastModified` nell'XML cosi' com'e' se e' una
		// stringa, e la chiama con .toISOString() solo se e' un'istanza Date
		// (vedi resolve-route-data.js nel pacchetto next). Il campo `date` di
		// WordPress arriva pero' senza timezone (es. "2012-05-25T10:41:54",
		// niente "Z" ne' offset): scritto cosi' direttamente in <lastmod> non
		// e' un W3C Datetime valido, ed e' esattamente l'errore "Data non
		// valida" segnalato da Search Console su 137 URL. Passando un
		// oggetto Date si forza sempre la conversione in ISO 8601 completo
		// con "Z" — con un controllo di validita' perche' .toISOString() su
		// una Date invalida lancia un'eccezione che farebbe fallire l'intera
		// sitemap, non solo la singola voce.
		const lastModified = new Date(post.date);
		entries.push({
			url: `${siteUrl}/${post.slug}`,
			...(Number.isNaN(lastModified.getTime()) ? {} : { lastModified }),
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
