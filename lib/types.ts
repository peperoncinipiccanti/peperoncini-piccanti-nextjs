/**
 * Tipi minimi per le risposte della WP REST API (wp/v2), limitati ai campi
 * che il frontend usa davvero. Le richieste in lib/wp.ts passano sempre
 * `_embed=1`, quindi featured media e termini arrivano gia' dentro `_embedded`
 * senza bisogno di una seconda chiamata per ogni post (N+1 evitato).
 */

export interface WPRendered {
	rendered: string;
}

export interface WPMedia {
	id: number;
	source_url: string;
	alt_text: string;
	media_details?: {
		width: number;
		height: number;
		// Le varianti generate da WordPress (thumbnail, medium, large, ecc.).
		// Servono perche' su questo sito, per molte immagini piu' vecchie, il
		// file "full" originale e' stato cancellato dal server nel tempo (resta
		// solo su disco una risoluzione ridotta): usare "full" alla cieca da'
		// 404. Le dimensioni generate da WP restano invece quasi sempre intatte.
		sizes?: Record<string, { source_url: string; width: number; height: number }>;
	};
}

export interface WPTerm {
	id: number;
	name: string;
	slug: string;
	taxonomy: 'category' | 'post_tag';
	description?: string;
	count?: number;
}

export interface WPAuthor {
	id: number;
	name: string;
	description?: string;
	avatar_urls?: Record<string, string>;
}

export interface WPPost {
	id: number;
	date: string;
	modified: string;
	slug: string;
	link: string;
	title: WPRendered;
	content: WPRendered;
	/** Assente quando la richiesta usa `_fields` senza includerlo (vedi getPosts() in lib/wp.ts, che non ne ha bisogno per le pagine "elenco"). */
	excerpt?: WPRendered;
	author: number;
	featured_media: number;
	categories: number[];
	tags: number[];
	/** Aggiunti dal plugin companion (register_rest_field): vedi wp-plugin/peperoncini-headless-companion.php */
	is_featured?: boolean;
	pphc_menu_order?: number;
	/**
	 * Punteggio review del tema Edition (media dei "Review Criteria"), solo
	 * per i post marcati come review — es. le varieta' di peperoncino, MAI
	 * le ricette, che semplicemente non hanno questi campi compilati.
	 */
	pphc_review?: {
		score: number | null;
		title: string;
		criteria: { label: string; rating: number | null }[];
	} | null;
	_embedded?: {
		author?: WPAuthor[];
		'wp:featuredmedia'?: WPMedia[];
		'wp:term'?: WPTerm[][];
	};
}

export interface WPCategory {
	id: number;
	name: string;
	slug: string;
	description: string;
	count: number;
}

/**
 * Risposta di /wp/v2/comments. Con `_embed=1` WordPress espone il post
 * genitore nella relazione "up" (non "wp:post", che non esiste per i
 * commenti) — serve solo per mostrare il titolo dell'articolo commentato
 * nel widget "Ultimi commenti", esattamente come il vecchio tema.
 */
export interface WPComment {
	id: number;
	post: number;
	author_name: string;
	date: string;
	content: WPRendered;
	link: string;
	_embedded?: {
		up?: { id: number; slug: string; link: string; title: WPRendered }[];
	};
}

/** Forma "pulita" di un commento per il widget "Ultimi commenti" in home. */
export interface RecentComment {
	id: number;
	authorName: string;
	postTitle: string;
	href: string;
}

/**
 * Un post nella classifica "post piu' visti" (widget sidebar delle pagine
 * categoria). Arriva gia' pronto dalla route custom del plugin companion
 * (/pphc/v1/popular), che legge la stessa tabella dati del plugin "WP Most
 * Popular" gia' installato — vedi wp-plugin/peperoncini-headless-companion.php.
 */
export interface PopularPost {
	id: number;
	title: string;
	slug: string;
	link: string;
	views: number;
	thumbnail: string | null;
}

/** Risposta di /pphc/v1/popular: tre classifiche gia' ordinate e tagliate a `limit`. */
export interface PopularPostsResponse {
	weekly: PopularPost[];
	monthly: PopularPost[];
	all_time: PopularPost[];
}

/** Forma "pulita" usata dai componenti, dopo la normalizzazione in lib/wp.ts. */
export interface Post {
	id: number;
	slug: string;
	link: string;
	date: string;
	title: string;
	excerpt: string;
	content: string;
	/**
	 * Punteggio 0-10 (media dei "Review Criteria" del tema Edition), presente
	 * solo sugli articoli marcati come review (es. varieta' di peperoncino).
	 * null sulle ricette e su tutto il resto: RatingBadge non si mostra.
	 */
	rating: number | null;
	/** true se marcato "Featured" nel backoffice WP (vedi Post Settings / Featured Order del tema Edition). */
	featured: boolean;
	/** Ordine manuale scelto in "Featured Order"; usato solo per ordinare i post con featured=true. */
	menuOrder: number;
	featuredImage: { url: string; alt: string; width: number; height: number } | null;
	categories: { id: number; name: string; slug: string }[];
	tags: { id: number; name: string; slug: string }[];
	author: { name: string; bio: string } | null;
}
