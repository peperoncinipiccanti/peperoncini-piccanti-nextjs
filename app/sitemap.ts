import type { MetadataRoute } from 'next';
import { getAllCategories, getAllPostSlugs, getCategoryPath, type PostSitemapRef } from '@/lib/wp';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.peperoncinipiccanti.com';

/**
 * Data dell'ultima modifica di un articolo, per <lastmod>.
 *
 * Si usa `modified_gmt` (l'ultima modifica reale in WordPress) e non piu'
 * `date` (la pubblicazione): con la data di pubblicazione un articolo
 * aggiornato oggi risultava fermo al 2015, e Google non aveva motivo di
 * riscansionarlo. `modified_gmt` e' in UTC ma arriva senza "Z": la si
 * aggiunge, altrimenti verrebbe letta come ora locale del server.
 *
 * Si restituisce sempre un oggetto Date (o null): Next.js scrive
 * `lastModified` nell'XML cosi' com'e' se e' una stringa e lo converte con
 * .toISOString() solo se e' una Date. Le date di WordPress senza fuso orario
 * scritte direttamente in <lastmod> non sono un W3C Datetime valido: e'
 * l'errore "Data non valida" che Search Console segnalava su 137 URL. Il
 * controllo di validita' evita che una data rotta (su cui .toISOString()
 * lancia un'eccezione) faccia fallire l'intera sitemap.
 */
function lastModifiedOf(post: PostSitemapRef): Date | null {
	const raw = post.modified_gmt ? `${post.modified_gmt}Z` : post.date;
	const date = new Date(raw);
	return Number.isNaN(date.getTime()) ? null : date;
}

/** La piu' recente tra le date valide, o null se non ce n'e' nessuna. */
function latest(dates: (Date | null)[]): Date | null {
	return dates.reduce<Date | null>((max, d) => (d && (!max || d > max) ? d : max), null);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	// getAllPostSlugs() (non getPosts()): la sitemap non ha bisogno di foto
	// o autore, solo slug, date e categorie — vedi il commento su
	// getAllPostSlugs() in lib/wp.ts.
	const [posts, categories] = await Promise.all([getAllPostSlugs(), getAllCategories()]);

	// Percorso gerarchico di ogni categoria, lo stesso del canonical (vedi
	// getCategoryPath() in lib/wp.ts): /varieta-peperoncino/peperoncini-piu-piccanti-al-mondo,
	// non /peperoncini-piu-piccanti-al-mondo che e' un redirect.
	const categoryPaths = new Map(
		await Promise.all(categories.map(async (category) => [category.id, await getCategoryPath(category)] as const))
	);

	const postsWithDates = posts.map((post) => ({
		post,
		lastModified: lastModifiedOf(post),
		paths: (post.categories ?? []).flatMap((id) => categoryPaths.get(id) ?? []),
	}));

	const homeLastModified = latest(postsWithDates.map((p) => p.lastModified));
	const entries: MetadataRoute.Sitemap = [
		{
			url: siteUrl,
			...(homeLastModified ? { lastModified: homeLastModified } : {}),
			changeFrequency: 'daily',
			priority: 1,
		},
	];

	for (const { post, lastModified } of postsWithDates) {
		entries.push({
			url: `${siteUrl}/${post.slug}`,
			...(lastModified ? { lastModified } : {}),
			changeFrequency: 'monthly',
			priority: 0.8,
		});
	}

	// Un archivio cambia quando cambia uno dei suoi articoli, compresi quelli
	// delle sottocategorie (come in WordPress, l'archivio di una categoria
	// madre elenca anche gli articoli delle figlie).
	for (const path of categoryPaths.values()) {
		const archiveLastModified = latest(
			postsWithDates
				.filter((p) => p.paths.some((postPath) => postPath === path || postPath.startsWith(`${path}/`)))
				.map((p) => p.lastModified)
		);
		entries.push({
			url: `${siteUrl}${path}`,
			...(archiveLastModified ? { lastModified: archiveLastModified } : {}),
			changeFrequency: 'weekly',
			priority: 0.6,
		});
	}

	return entries;
}
