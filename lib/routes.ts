import { cache } from 'react';
import type { Post, WPCategory } from './types';
import { getCategoryBySlug, getCategoryPath, getPostBySlug, getTagBySlug } from './wp';

/**
 * Esito della risoluzione di un percorso della route catch-all
 * (app/[...slug]/page.tsx). Ogni contenuto ha UN SOLO indirizzo valido
 * (`path`, che e' anche il suo canonical); tutte le varianti note vengono
 * reindirizzate in modo permanente, tutto il resto va in 404.
 *
 * Prima la route guardava solo l'ultimo segmento dell'URL, quindi qualsiasi
 * prefisso serviva la stessa pagina con risposta 200 (es.
 * /qualsiasi/cosa/trinidad-moruga-scorpion o /2016/09/trinidad-moruga-scorpion):
 * senza canonical, Google trovava duplicati e in alcuni casi sceglieva come
 * principale un URL diverso da quello dell'articolo.
 */
export type ResolvedRoute =
	| { kind: 'post'; post: Post; path: string }
	| { kind: 'category'; category: WPCategory; path: string }
	| { kind: 'tag'; tag: WPCategory; path: string }
	| { kind: 'redirect'; to: string }
	| { kind: 'notFound' };

const NOT_FOUND: ResolvedRoute = { kind: 'notFound' };

/** Vecchio formato data di WordPress: /AAAA/MM/slug o /AAAA/MM/GG/slug. */
function isLegacyDatePath(segments: string[]): boolean {
	const [year, month, maybeDay] = segments;
	if (!/^\d{4}$/.test(year ?? '') || !/^\d{2}$/.test(month ?? '')) return false;
	if (segments.length === 3) return true;
	return segments.length === 4 && /^\d{2}$/.test(maybeDay ?? '');
}

/**
 * `cache()` di React deduplica la risoluzione tra generateMetadata e il
 * componente pagina della stessa richiesta. Riceve il percorso come stringa
 * (non come array) perche' cache() confronta gli argomenti per identita'.
 */
export const resolveRoute = cache(async (joinedPath: string): Promise<ResolvedRoute> => {
	const segments = joinedPath.split('/').filter(Boolean);
	const first = segments[0];
	const last = segments[segments.length - 1];
	if (!first || !last) return NOT_FOUND;

	// 1. Maiuscole: gli slug di WordPress sono sempre minuscoli, quindi la
	// versione minuscola e' l'unica valida. Redirect diretto, senza
	// interrogare WordPress (la richiesta successiva verifica che esista).
	const lower = segments.map((s) => s.toLowerCase());
	if (lower.join('/') !== segments.join('/')) {
		return { kind: 'redirect', to: `/${lower.join('/')}` };
	}

	// 2. Archivi dei tag: solo /tag/<slug>.
	if (first === 'tag') {
		if (segments.length !== 2) return NOT_FOUND;
		const tag = await getTagBySlug(last);
		return tag ? { kind: 'tag', tag, path: `/tag/${tag.slug}` } : NOT_FOUND;
	}

	// 3. Un solo segmento: articolo, oppure categoria. Una sottocategoria
	// richiesta senza il genitore (/peperoncini-piu-piccanti-al-mondo)
	// viene reindirizzata al suo percorso completo.
	if (segments.length === 1) {
		const post = await getPostBySlug(first);
		if (post) return { kind: 'post', post, path: `/${post.slug}` };

		const category = await getCategoryBySlug(first);
		if (category) {
			const path = await getCategoryPath(category);
			return path === `/${first}` ? { kind: 'category', category, path } : { kind: 'redirect', to: path };
		}

		return NOT_FOUND;
	}

	// 4. Vecchi permalink con la data: redirect all'articolo, se esiste.
	if (isLegacyDatePath(segments)) {
		const post = await getPostBySlug(last);
		return post ? { kind: 'redirect', to: `/${post.slug}` } : NOT_FOUND;
	}

	// 5. Piu' segmenti: valido solo se e' esattamente il percorso gerarchico
	// di una categoria (/varieta-peperoncino/peperoncini-piu-piccanti-al-mondo).
	const category = await getCategoryBySlug(last);
	if (category) {
		const path = await getCategoryPath(category);
		if (path === `/${segments.join('/')}`) return { kind: 'category', category, path };
	}

	return NOT_FOUND;
});

/**
 * Numero di pagina da `?pagina=`: 1 per valori assenti, non numerici o
 * minori di 1, cosi' "?pagina=abc" e "?pagina=1" hanno lo stesso canonical
 * della prima pagina.
 */
export function parsePage(pagina: string | undefined): number {
	const n = Number(pagina);
	return Number.isInteger(n) && n > 1 ? n : 1;
}

/** Canonical di una pagina d'archivio: la prima pagina e' il percorso pulito, le successive puntano a se stesse. */
export function archiveCanonical(path: string, page: number): string {
	return page > 1 ? `${path}?pagina=${page}` : path;
}
