import type { Post, WPCategory, WPPost } from './types';

const WP_API_URL = (process.env.WP_API_URL ?? 'https://cms.peperoncinipiccanti.com').replace(/\/+$/, '');

/**
 * Wrapper minimo su fetch con i default corretti per Next.js:
 * - `next.revalidate`: ISR "di sicurezza" (rigenera al massimo ogni ora anche
 *   se nessuno chiama /api/revalidate).
 * - `next.tags`: permette la revalidazione on-demand mirata (vedi
 *   app/api/revalidate/route.ts) invece di invalidare tutto il sito.
 */
async function wpFetch<T>(
	path: string,
	{ tags = [], revalidate = 3600 }: { tags?: string[]; revalidate?: number } = {}
): Promise<T> {
	const res = await fetch(`${WP_API_URL}/wp-json/wp/v2${path}`, {
		next: { revalidate, tags: ['wp', ...tags] },
	});

	if (!res.ok) {
		throw new Error(`WordPress REST API error ${res.status} su ${path}`);
	}

	return res.json() as Promise<T>;
}

/** Come sopra ma restituisce anche gli header (servono per il totale pagine in paginazione). */
async function wpFetchWithHeaders<T>(
	path: string,
	opts: { tags?: string[]; revalidate?: number } = {}
): Promise<{ data: T; totalPages: number; total: number }> {
	const res = await fetch(`${WP_API_URL}/wp-json/wp/v2${path}`, {
		next: { revalidate: opts.revalidate ?? 3600, tags: ['wp', ...(opts.tags ?? [])] },
	});

	if (!res.ok) {
		throw new Error(`WordPress REST API error ${res.status} su ${path}`);
	}

	return {
		data: (await res.json()) as T,
		totalPages: Number(res.headers.get('X-WP-TotalPages') ?? 1),
		total: Number(res.headers.get('X-WP-Total') ?? 0),
	};
}

/**
 * Questo sito NON usa il campo nativo "Immagine in evidenza" di WordPress
 * (tutti i post hanno `featured_media: 0`): le immagini sono inserite a mano
 * dentro al corpo dell'articolo (`content.rendered`), tipicamente come primo
 * `<img>` avvolto in un link al lightbox. Quando manca l'embed di
 * `wp:featuredmedia` si estrae quindi la prima immagine dall'HTML del
 * contenuto, cosi' PostCard e HeroCarousel hanno comunque un'immagine da
 * mostrare invece di renderizzare il nulla.
 */
function extractFirstImageFromContent(html: string): { url: string; alt: string; width: number; height: number } | null {
	const imgMatch = html.match(/<img[^>]*>/i);
	if (!imgMatch) return null;
	const imgTag = imgMatch[0];

	const srcMatch = imgTag.match(/\bsrc=["']([^"']+)["']/i);
	const url = srcMatch?.[1];
	if (!url) return null;

	const altMatch = imgTag.match(/\balt=["']([^"']*)["']/i);
	const widthMatch = imgTag.match(/\bwidth=["']?(\d+)["']?/i);
	const heightMatch = imgTag.match(/\bheight=["']?(\d+)["']?/i);

	return {
		url,
		alt: altMatch?.[1] ?? '',
		width: widthMatch?.[1] ? Number(widthMatch[1]) : 1200,
		height: heightMatch?.[1] ? Number(heightMatch[1]) : 900,
	};
}

function normalizePost(raw: WPPost): Post {
	const media = raw._embedded?.['wp:featuredmedia']?.[0];
	const author = raw._embedded?.author?.[0];
	const terms = raw._embedded?.['wp:term']?.flat() ?? [];
	const ratingRaw = raw.meta?.piccantezza;
	const rating = ratingRaw === undefined || ratingRaw === '' ? null : Number(ratingRaw);

	const contentImage = media ? null : extractFirstImageFromContent(raw.content.rendered);

	return {
		id: raw.id,
		slug: raw.slug,
		link: raw.link,
		date: raw.date,
		title: decodeHtmlEntities(raw.title.rendered),
		excerpt: raw.excerpt.rendered,
		content: raw.content.rendered,
		rating: rating === null || Number.isNaN(rating) ? null : rating,
		featuredImage: media
			? {
					url: media.source_url,
					alt: media.alt_text || raw.title.rendered,
					width: media.media_details?.width ?? 1200,
					height: media.media_details?.height ?? 900,
				}
			: contentImage
				? {
						url: contentImage.url,
						alt: contentImage.alt || raw.title.rendered,
						width: contentImage.width,
						height: contentImage.height,
					}
				: null,
		categories: terms
			.filter((t) => t.taxonomy === 'category')
			.map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
		tags: terms.filter((t) => t.taxonomy === 'post_tag').map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
		author: author ? { name: author.name, bio: author.description ?? '' } : null,
	};
}

/** Le entita' HTML (&#8217; ecc.) arrivano codificate nei campi "rendered" dei title. */
function decodeHtmlEntities(input: string): string {
	return input
		.replace(/&#8217;/g, '’')
		.replace(/&#8211;/g, '–')
		.replace(/&#8220;/g, '“')
		.replace(/&#8221;/g, '”')
		.replace(/&amp;/g, '&');
}

export async function getPosts(
	{
		page = 1,
		perPage = 9,
		categoryId,
		exclude,
		offset,
		search,
	}: {
		page?: number;
		perPage?: number;
		categoryId?: number;
		exclude?: number[];
		offset?: number;
		search?: string;
	} = {}
): Promise<{ posts: Post[]; totalPages: number; total: number }> {
	const params = new URLSearchParams({
		_embed: '1',
		page: String(page),
		per_page: String(perPage),
		orderby: 'date',
		order: 'desc',
	});
	if (categoryId) params.set('categories', String(categoryId));
	if (exclude?.length) params.set('exclude', exclude.join(','));
	if (offset) params.set('offset', String(offset));
	if (search) params.set('search', search);

	const { data, totalPages, total } = await wpFetchWithHeaders<WPPost[]>(`/posts?${params.toString()}`, {
		tags: ['posts'],
	});

	return { posts: data.map(normalizePost), totalPages, total };
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
	const posts = await wpFetch<WPPost[]>(`/posts?slug=${encodeURIComponent(slug)}&_embed=1`, {
		tags: [`post:${slug}`],
	});
	return posts[0] ? normalizePost(posts[0]) : null;
}

export async function getCategoryBySlug(slug: string): Promise<WPCategory | null> {
	const categories = await wpFetch<WPCategory[]>(`/categories?slug=${encodeURIComponent(slug)}`, {
		tags: ['categories'],
	});
	return categories[0] ?? null;
}

export async function getAllCategories(): Promise<WPCategory[]> {
	return wpFetch<WPCategory[]>('/categories?per_page=100&hide_empty=1', { tags: ['categories'] });
}

/**
 * Barra "Post piccanti!" in cima al sito: nel tema Edition originale e' un
 * ticker verticale (bxSlider) che scorre in autoplay tra alcuni articoli in
 * evidenza, in stile "ultim'ora". Qui si usano semplicemente gli ultimi
 * articoli pubblicati: e' il criterio piu' vicino a "ultim'ora" (niente
 * plugin di statistiche viste/popolarita' da replicare) e non richiede
 * dipendenze aggiuntive sul backend WordPress.
 */
export async function getTickerPosts(limit = 6): Promise<{ id: number; title: string; href: string }[]> {
	const { posts } = await getPosts({ perPage: limit });
	return posts.map((post) => ({ id: post.id, title: post.title, href: `/${post.slug}` }));
}

/**
 * Menu di navigazione: la REST API core di WordPress non espone i menu
 * pubblicamente senza autenticazione o un plugin dedicato (es. WPGraphQL,
 * WP REST API Menus). Per un menu che cambia raramente, la scelta piu'
 * robusta e veloce (zero round-trip extra, zero dipendenza da plugin) e'
 * tenerlo qui, sincronizzato a mano con Aspetto -> Menu su WordPress.
 * Se preferisci gestirlo da WP, installa "WP REST API Menus" e sostituisci
 * questa funzione con una chiamata a /wp-json/menus/v1/menus/<location>.
 */
export async function getMenu() {
	return [
		{ label: 'Varietà di Peperoncino', href: '/varieta-peperoncino' },
		{ label: 'I Peperoncini più Piccanti', href: '/varieta-peperoncino/peperoncini-piu-piccanti-al-mondo' },
		{ label: 'Coltivare il Peperoncino', href: '/come-coltivare-peperoncino' },
		{ label: 'Benefici del Peperoncino', href: '/benefici-peperoncino' },
		{ label: 'Ricette Piccanti', href: '/ricette-peperoncino-piccante' },
	];
}
