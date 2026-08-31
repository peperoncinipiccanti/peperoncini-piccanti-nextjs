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
	excerpt: WPRendered;
	author: number;
	featured_media: number;
	categories: number[];
	tags: number[];
	meta?: {
		piccantezza?: number | string;
	};
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

/** Forma "pulita" usata dai componenti, dopo la normalizzazione in lib/wp.ts. */
export interface Post {
	id: number;
	slug: string;
	link: string;
	date: string;
	title: string;
	excerpt: string;
	content: string;
	rating: number | null;
	featuredImage: { url: string; alt: string; width: number; height: number } | null;
	categories: { id: number; name: string; slug: string }[];
	tags: { id: number; name: string; slug: string }[];
	author: { name: string; bio: string } | null;
}
