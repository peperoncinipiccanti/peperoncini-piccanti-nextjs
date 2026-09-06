/**
 * Costruttori di dati strutturati schema.org (JSON-LD), renderizzati poi
 * via <JsonLd> (components/JsonLd.tsx). Il sito non ne aveva nessuno prima
 * della migrazione a Next.js: Search Console mostrava ancora risultati
 * "Breadcrumb" validi solo perche' rifletteva l'ultima scansione del vecchio
 * tema WordPress (che il markup ce l'aveva) — senza questo modulo, alla
 * prima ri-scansione del sito nuovo quei rich result sarebbero spariti dai
 * risultati di ricerca.
 */
import type { Post } from './types';
import { LOGO_URL, SITE_NAME, SITE_URL } from './site';

function absoluteUrl(path: string): string {
	return new URL(path, SITE_URL).toString();
}

/** Il contenuto/excerpt arriva come HTML gia' pronto per il rendering (vedi normalizePost() in lib/wp.ts): qui serve invece testo semplice. */
function stripHtml(html: string): string {
	return html
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

const organization = {
	'@type': 'Organization',
	'@id': `${SITE_URL}/#organization`,
	name: SITE_NAME,
	url: SITE_URL,
	logo: { '@type': 'ImageObject', url: LOGO_URL },
	sameAs: ['https://www.facebook.com/peperoncinipiccanti', 'https://www.instagram.com/peperoncinipiccanti'],
};

/**
 * Organization + WebSite: iniettati una sola volta nel layout radice, sono
 * l'identita' del sito e non cambiano da pagina a pagina. Il SearchAction
 * abilita (se Google lo ritiene opportuno) la sitelinks searchbox nei
 * risultati di ricerca, sfruttando la pagina di ricerca gia' esistente
 * (/cerca?q=...).
 */
export function websiteSchema() {
	return {
		'@context': 'https://schema.org',
		'@graph': [
			organization,
			{
				'@type': 'WebSite',
				'@id': `${SITE_URL}/#website`,
				url: SITE_URL,
				name: SITE_NAME,
				inLanguage: 'it-IT',
				publisher: { '@id': `${SITE_URL}/#organization` },
				potentialAction: {
					'@type': 'SearchAction',
					target: `${SITE_URL}/cerca?q={search_term_string}`,
					'query-input': 'required name=search_term_string',
				},
			},
		],
	};
}

/**
 * BreadcrumbList: `path` assente solo per la voce corrente quando non si
 * vuole ripeterne l'URL (facoltativo per l'ultima voce secondo le linee
 * guida schema.org) — qui lo passiamo comunque quando disponibile, non
 * cambia nulla per Google ma rende il markup piu' esplicito.
 */
export function breadcrumbSchema(items: { name: string; path?: string }[]) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: item.name,
			...(item.path ? { item: absoluteUrl(item.path) } : {}),
		})),
	};
}

/** Article per ogni articolo (recensioni comprese: hanno comunque un corpo editoriale, non solo il punteggio). */
export function articleSchema(post: Post, path: string) {
	const description = stripHtml(post.excerpt || post.content).slice(0, 300);
	const author = post.author?.name
		? { '@type': 'Person', name: post.author.name }
		: { '@type': 'Organization', name: SITE_NAME };

	return {
		'@context': 'https://schema.org',
		'@type': 'Article',
		'@id': `${absoluteUrl(path)}#article`,
		mainEntityOfPage: absoluteUrl(path),
		headline: post.title.slice(0, 110),
		description: description || undefined,
		image: post.featuredImage ? [post.featuredImage.url] : undefined,
		datePublished: post.date,
		dateModified: post.modified || post.date,
		author,
		publisher: { '@id': `${SITE_URL}/#organization` },
	};
}

/**
 * Product + Review/AggregateRating, solo per gli articoli marcati come
 * review nel backoffice WP (post.review non null, vedi normalizePost()) —
 * es. le varieta' di peperoncino col cerchio del punteggio. "Product" e' il
 * tipo che Google riconosce per l'anteprima a stelle nei risultati (le
 * linee guida per gli snippet di recensione limitano `itemReviewed` a un
 * elenco chiuso di tipi supportati: "Thing" generico non e' tra questi).
 * Punteggio su scala 0-10, la stessa gia' mostrata da RatingBadge/ReviewBreakdown.
 */
export function reviewSchema(post: Post, path: string) {
	if (!post.review) return null;

	const author = post.author?.name
		? { '@type': 'Person', name: post.author.name }
		: { '@type': 'Organization', name: SITE_NAME };

	// Il titolo della recensione spesso ripete quello dell'articolo con
	// aggiunte tipo "Recensione:" — per il nome del "Product" si usa il
	// titolo dell'articolo cosi' com'e', piu' affidabile del campo libero
	// compilato in redazione.
	return {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: post.title,
		url: absoluteUrl(path),
		image: post.featuredImage ? [post.featuredImage.url] : undefined,
		review: {
			'@type': 'Review',
			datePublished: post.date,
			author,
			reviewBody: stripHtml(post.review.summary).slice(0, 500) || undefined,
			reviewRating: {
				'@type': 'Rating',
				ratingValue: post.review.score,
				bestRating: 10,
				worstRating: 0,
			},
		},
		aggregateRating: {
			'@type': 'AggregateRating',
			ratingValue: post.review.score,
			bestRating: 10,
			worstRating: 0,
			reviewCount: 1,
		},
	};
}
