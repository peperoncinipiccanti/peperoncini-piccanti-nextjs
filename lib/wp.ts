import type { Post, PopularPostsResponse, PostComment, RecentComment, WPCategory, WPComment, WPMedia, WPPost } from './types';

// Esportato: serve anche a app/api/comments/route.ts per inoltrare al
// WordPress i nuovi commenti inviati dal form (stesso pattern gia' usato da
// app/api/track-view/route.ts, che pero' ha la sua costante locale identica
// perche' quella route esisteva prima di questa esportazione).
export const WP_API_URL = (process.env.WP_API_URL ?? 'https://cms.peperoncinipiccanti.com').replace(/\/+$/, '');

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
 * Non tutti i post di questo sito hanno un'"Immagine in evidenza" nativa di
 * WordPress: su alcuni (soprattutto i piu' vecchi) le foto sono inserite a
 * mano dentro al corpo dell'articolo (`content.rendered`), tipicamente come
 * primo `<img>` avvolto in un link al lightbox. Quando manca l'embed di
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

/**
 * Sceglie l'URL migliore per un'immagine in evidenza: su questo sito, per
 * molte foto caricate anni fa, il file "full" a piena risoluzione non esiste
 * piu' sul server (restano solo le varianti ridimensionate generate da WP),
 * quindi usare sempre `source_url` (che punta al "full") produce 404 a
 * ripetizione. Si preferisce percio' una dimensione generata di poco inferiore
 * a 1024px, gia' presente in quasi tutte le media library WP e piu' adatta
 * per card/hero rispetto a un originale non ottimizzato.
 *
 * Se invece e' una foto appena caricata per cui WordPress non ha ancora
 * rigenerato tutte le dimensioni (capita quando si sostituisce un file:
 * risolto in passato con "Rigenera miniature"), "large"/"medium_large"/
 * "medium" possono mancare tutte — si aggiunge quindi "thumbnail" come
 * ulteriore tentativo prima di arrivare a `source_url`, cosi' una sola
 * dimensione mancante non fa piu' comparire un'icona rotta.
 */
function pickBestMediaUrl(media: WPMedia): { url: string; width: number; height: number } {
	const sizes = media.media_details?.sizes;
	const preferred = sizes?.large ?? sizes?.medium_large ?? sizes?.medium ?? sizes?.thumbnail;

	if (preferred) {
		return { url: preferred.source_url, width: preferred.width, height: preferred.height };
	}

	return {
		url: media.source_url,
		width: media.media_details?.width ?? 1200,
		height: media.media_details?.height ?? 900,
	};
}

function normalizePost(raw: WPPost): Post {
	const media = raw._embedded?.['wp:featuredmedia']?.[0];
	const author = raw._embedded?.author?.[0];
	const terms = raw._embedded?.['wp:term']?.flat() ?? [];
	// Il punteggio arriva gia' calcolato dal plugin companion (media dei
	// "Review Criteria" del tema Edition) ed e' null di default: cosi' le
	// ricette (che non sono "review post") non mostrano mai il cerchio.
	const rating = raw.pphc_review?.score ?? null;

	const contentImage = media ? null : extractFirstImageFromContent(raw.content.rendered);
	const bestMedia = media ? pickBestMediaUrl(media) : null;

	return {
		id: raw.id,
		slug: raw.slug,
		link: raw.link,
		date: raw.date,
		title: decodeHtmlEntities(raw.title.rendered),
		// `excerpt` non e' richiesto da getPosts() (vedi `_fields` sopra: le
		// pagine "elenco" non lo usano) — opzionale a runtime, da qui il
		// fallback: solo getPostBySlug()/getFeaturedPosts() lo popolano
		// davvero (embed completo), e sono le uniche a leggere post.excerpt.
		excerpt: raw.excerpt?.rendered ?? '',
		content: raw.content.rendered,
		rating: rating === null || Number.isNaN(rating) ? null : rating,
		featured: raw.is_featured === true,
		menuOrder: raw.pphc_menu_order ?? 0,
		featuredImage: media && bestMedia
			? {
					url: bestMedia.url,
					alt: media.alt_text || raw.title.rendered,
					width: bestMedia.width,
					height: bestMedia.height,
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
		shares: raw.pphc_shares ?? 0,
		loves: raw.pphc_loves ?? 0,
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
		tagId,
		exclude,
		offset,
		search,
	}: {
		page?: number;
		perPage?: number;
		categoryId?: number;
		tagId?: number;
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
		// `excerpt` e `tags` (l'array di ID, non le tassonomie embeddate) non
		// sono mai letti da normalizePost() per le pagine "elenco" che usano
		// getPosts() (card, carousel, ricerca — vedi PostCard.tsx): solo la
		// pagina del singolo articolo ne ha bisogno, e usa getPostBySlug(),
		// una chiamata separata non toccata da questo filtro. Ometterli qui
		// riduce il peso della risposta senza cambiare cosa si vede in
		// nessuna pagina. `_links`/`_embedded` vanno elencati esplicitamente:
		// `_fields` e' una whitelist, e senza indicarli sparirebbe anche
		// tutto l'embed (foto, autore, tassonomie).
		_fields:
			'id,slug,link,date,title,content,author,featured_media,is_featured,pphc_menu_order,pphc_review,_links,_embedded',
	});
	if (categoryId) params.set('categories', String(categoryId));
	if (tagId) params.set('tags', String(tagId));
	if (exclude?.length) params.set('exclude', exclude.join(','));
	if (offset) params.set('offset', String(offset));
	if (search) params.set('search', search);

	const { data, totalPages, total } = await wpFetchWithHeaders<WPPost[]>(`/posts?${params.toString()}`, {
		tags: ['posts'],
	});

	return { posts: data.map(normalizePost), totalPages, total };
}

/**
 * Elenco leggero (solo id + flag "featured" + ordine) di TUTTO il catalogo,
 * senza `_embed` e con `_fields` per limitare la risposta ai soli campi
 * necessari a capire quali articoli sono "Featured" e in che ordine.
 *
 * Usato solo da getFeaturedPosts(): scorrere tutto il catalogo con l'embed
 * completo (foto, autore, tassonomie di OGNI articolo) per poi tenerne solo
 * 4 produceva su questo sito una risposta oltre i 9MB per pagina — sopra il
 * limite di 2MB per voce della cache dati di Next.js, che quindi smetteva
 * di mettere in cache quella chiamata: ogni rigenerazione ISR doveva
 * rifare da capo la stessa richiesta pesantissima a WordPress (visibile nei
 * log di build Vercel come "Failed to set Next.js data cache ... items over
 * 2MB can not be cached"). Con _fields la stessa scansione pesa poche decine
 * di KB in totale.
 */
async function getFeaturedPostRefs(): Promise<{ id: number; menuOrder: number }[]> {
	const perPage = 100;
	let page = 1;
	const refs: { id: number; menuOrder: number }[] = [];

	while (true) {
		const params = new URLSearchParams({
			page: String(page),
			per_page: String(perPage),
			_fields: 'id,is_featured,pphc_menu_order',
		});

		const { data, totalPages } = await wpFetchWithHeaders<
			{ id: number; is_featured?: boolean; pphc_menu_order?: number }[]
		>(`/posts?${params.toString()}`, { tags: ['posts'] });

		for (const raw of data) {
			if (raw.is_featured) {
				refs.push({ id: raw.id, menuOrder: raw.pphc_menu_order ?? 0 });
			}
		}

		if (page >= totalPages) break;
		page += 1;
	}

	return refs;
}

/**
 * Articoli per lo slider hero in home: nel backoffice WordPress (tema
 * Edition) l'editor sceglie a mano quali post mostrare qui tramite il
 * metabox "Featured" (Si/No) sul singolo articolo, e ne stabilisce l'ordine
 * trascinandoli nella pagina admin "Featured Order" — non e' quindi un
 * criterio automatico (es. "i piu' recenti"), ma una scelta editoriale
 * esplicita, esposta in REST dal plugin companion (`is_featured`,
 * `pphc_menu_order`, vedi wp-plugin/peperoncini-headless-companion.php).
 *
 * La REST API di WordPress non permette di filtrare per un campo custom
 * come `is_featured` direttamente nella query (non e' un meta_query
 * standard), quindi si scorre prima tutto il catalogo in forma leggera
 * (getFeaturedPostRefs, solo id/ordine) e SOLO DOPO si richiedono con
 * `_embed=1` i pochi articoli realmente featured (via `include=`), invece
 * di scaricare l'embed completo di tutti i 139 articoli per poi tenerne 4.
 * Se per qualche motivo nessun articolo risulta featured (es. plugin
 * companion non ancora aggiornato sul WordPress live), si torna agli
 * ultimi pubblicati cosi' l'hero non resta vuoto.
 */
export async function getFeaturedPosts(limit = 4): Promise<Post[]> {
	const refs = await getFeaturedPostRefs();

	if (refs.length === 0) {
		const { posts } = await getPosts({ perPage: limit });
		return posts;
	}

	const ids = refs
		.sort((a, b) => a.menuOrder - b.menuOrder)
		.slice(0, limit)
		.map((ref) => ref.id);

	const params = new URLSearchParams({
		_embed: '1',
		include: ids.join(','),
		orderby: 'include',
		per_page: String(ids.length),
	});

	const posts = await wpFetch<WPPost[]>(`/posts?${params.toString()}`, { tags: ['posts'] });
	return posts.map(normalizePost);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
	// Tag sia `post:${slug}` (mirato) sia `posts` (generico): il webhook di
	// revalidazione invalida sempre `posts` ad ogni salvataggio, mentre
	// `post:${slug}` dipende dallo slug esatto inviato da WordPress nel
	// payload — un doppio tag rende questa chiamata resiliente anche se per
	// qualche motivo lo slug specifico non dovesse combaciare o arrivare.
	const posts = await wpFetch<WPPost[]>(`/posts?slug=${encodeURIComponent(slug)}&_embed=1`, {
		tags: [`post:${slug}`, 'posts'],
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
 * Slug + data di TUTTI gli articoli, per la sitemap (app/sitemap.ts): a
 * differenza di getPosts(), niente `_embed` (la sitemap non ha bisogno di
 * foto/autore/tassonomie) e `_fields` per limitare la risposta ai soli due
 * campi che servono — stesso principio di getFeaturedPostRefs(), stesso
 * motivo: senza, la scansione dell'intero catalogo superava il limite di
 * 2MB per voce della cache dati di Next.js.
 */
export async function getAllPostSlugs(): Promise<{ slug: string; date: string }[]> {
	const perPage = 100;
	let page = 1;
	let all: { slug: string; date: string }[] = [];

	while (true) {
		const params = new URLSearchParams({
			page: String(page),
			per_page: String(perPage),
			_fields: 'slug,date',
		});

		const { data, totalPages } = await wpFetchWithHeaders<{ slug: string; date: string }[]>(
			`/posts?${params.toString()}`,
			{ tags: ['posts'] }
		);

		all = all.concat(data);
		if (page >= totalPages) break;
		page += 1;
	}

	return all;
}

/**
 * Pagina archivio di un tag (/tag/nome-tag/ nel vecchio tema): la risposta
 * di /wp/v2/tags ha la stessa forma di /wp/v2/categories (id, name, slug,
 * description, count), quindi si riusa lo stesso tipo WPCategory invece di
 * duplicarlo.
 */
export async function getTagBySlug(slug: string): Promise<WPCategory | null> {
	const tags = await wpFetch<WPCategory[]>(`/tags?slug=${encodeURIComponent(slug)}`, {
		tags: ['tags'],
	});
	return tags[0] ?? null;
}

/**
 * Widget sidebar "Tag più utilizzati" (pagine diverse dalla home): i tag con
 * piu' articoli associati, stesso endpoint di getTagBySlug() ma ordinato per
 * `count` decrescente. `hide_empty=1` esclude i tag rimasti senza post (es.
 * refusi/duplicati creati per errore nel backoffice nel tempo).
 */
export async function getPopularTags(limit = 12): Promise<WPCategory[]> {
	return wpFetch<WPCategory[]>(
		`/tags?per_page=${limit}&orderby=count&order=desc&hide_empty=1&_fields=id,name,slug,count`,
		{ tags: ['tags'] }
	);
}

/**
 * Blocco "Potrebbe interessarti anche" sotto ogni articolo: si cercano prima
 * altri post della stessa categoria principale (la prima assegnata), che di
 * solito e' il segnale piu' forte di affinita' su questo sito (es. tutte le
 * schede di "Varieta' di Peperoncino" sono nella stessa categoria). Se
 * l'articolo non ha categorie o non ce ne sono abbastanza altre, si
 * completa con post che condividono il primo tag, e in ultima istanza con
 * gli ultimi pubblicati — cosi' il blocco mostra sempre `limit` post (a
 * meno che il sito non ne abbia proprio cosi' pochi) invece di restare vuoto
 * o a meta'.
 */
export async function getRelatedPosts(post: Post, limit = 3): Promise<Post[]> {
	const related: Post[] = [];
	const seenIds = new Set([post.id]);

	async function fillFrom(query: { categoryId?: number; tagId?: number }) {
		if (related.length >= limit) return;
		const { posts } = await getPosts({ ...query, perPage: limit + 1, exclude: [...seenIds] });
		for (const p of posts) {
			if (related.length >= limit) break;
			if (seenIds.has(p.id)) continue;
			related.push(p);
			seenIds.add(p.id);
		}
	}

	if (post.categories[0]) await fillFrom({ categoryId: post.categories[0].id });
	if (post.tags[0]) await fillFrom({ tagId: post.tags[0].id });
	if (related.length < limit) await fillFrom({});

	return related;
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
 * Widget "Ultimi commenti" della home (vecchio tema Edition): usa
 * l'endpoint standard `/wp/v2/comments` di WordPress, non una particolarita'
 * del tema, quindi non richiede un plugin companion ne' di indovinare campi
 * custom. Con `_embed=1` WordPress include il post commentato nella
 * relazione "up" (`_embedded.up[0]`), da cui si prende il titolo per la
 * scritta "Autore su Titolo articolo"; `link` punta gia' al commento sulla
 * pagina dell'articolo (stesso comportamento del widget originale).
 *
 * Alcuni siti disabilitano questo endpoint via plugin di sicurezza (per
 * evitare scraping/spam sui commenti): in quel caso si ritorna un array
 * vuoto e la sezione semplicemente non compare, invece di rompere la home.
 */
export async function getRecentComments(limit = 7): Promise<RecentComment[]> {
	try {
		const comments = await wpFetch<WPComment[]>(
			`/comments?per_page=${limit}&orderby=date&order=desc&_embed=1`,
			{ tags: ['comments'] }
		);

		return comments
			.map((comment) => {
				const post = comment._embedded?.up?.[0];
				return {
					id: comment.id,
					authorName: decodeHtmlEntities(comment.author_name || 'Anonimo'),
					postTitle: post ? decodeHtmlEntities(post.title.rendered) : '',
					href: comment.link,
				};
			})
			.filter((comment) => comment.postTitle !== '');
	} catch {
		return [];
	}
}

/**
 * Commenti approvati di un articolo, per la lista sotto il contenuto
 * (vedi CommentsSection.tsx): senza autenticazione la REST API di WordPress
 * restituisce di suo solo i commenti con stato "approved" (quelli in
 * moderazione o rifiutati non sono mai visibili da qui), quindi non serve
 * filtrare esplicitamente per stato — e' gia' impossibile leggerne altri.
 *
 * Tag dedicato `comments:${postId}` (invece del generico "comments" usato da
 * getRecentComments) cosi' l'invio di un nuovo commento (vedi
 * app/api/comments/route.ts) puo' invalidare solo la cache di QUESTO
 * articolo, non quella di tutta la home.
 */
export async function getPostComments(postId: number, perPage = 100): Promise<PostComment[]> {
	try {
		const params = new URLSearchParams({
			post: String(postId),
			per_page: String(perPage),
			orderby: 'date',
			order: 'asc',
			_fields: 'id,parent,author_name,date,content',
		});
		const comments = await wpFetch<WPComment[]>(`/comments?${params.toString()}`, {
			tags: [`comments:${postId}`],
			revalidate: 60,
		});

		return comments.map((c) => ({
			id: c.id,
			parentId: c.parent ?? 0,
			authorName: decodeHtmlEntities(c.author_name || 'Anonimo'),
			date: c.date,
			content: c.content.rendered,
		}));
	} catch {
		return [];
	}
}

/**
 * Widget "I post piccanti più visti" (sidebar delle pagine categoria):
 * legge la route custom del plugin companion (/pphc/v1/popular), che a sua
 * volta legge la stessa tabella dati del plugin "WP Most Popular" gia'
 * installato sul sito — non e' quindi sotto il namespace standard wp/v2,
 * per cui non si puo' riusare wpFetch() (ha /wp-json/wp/v2 hardcoded).
 *
 * Il conteggio viste riparte da zero da quando il sito e' diventato
 * headless (lo script di tracking del vecchio plugin funzionava solo sulle
 * pagine renderizzate da WordPress, che ora non servono piu' traffico
 * reale): i numeri iniziano ad accumularsi da capo grazie a ViewTracker.
 *
 * Se la route non esiste ancora sul WordPress live (plugin non ancora
 * aggiornato) o il sito risponde con un errore, si torna tre liste vuote
 * cosi' il widget semplicemente non si mostra invece di rompere la pagina.
 */
export async function getPopularPosts(limit = 5): Promise<PopularPostsResponse> {
	const empty: PopularPostsResponse = { weekly: [], monthly: [], all_time: [] };
	try {
		const res = await fetch(`${WP_API_URL}/wp-json/pphc/v1/popular?limit=${limit}`, {
			next: { revalidate: 3600, tags: ['wp', 'popular'] },
		});
		if (!res.ok) return empty;
		return (await res.json()) as PopularPostsResponse;
	} catch {
		return empty;
	}
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
