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
	/** `path` e' l'archivio (pagina 1); `page` il numero di pagina richiesto (1 = l'archivio stesso). */
	| { kind: 'category'; category: WPCategory; path: string; page: number }
	| { kind: 'tag'; tag: WPCategory; path: string; page: number }
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

async function resolveUncached(joinedPath: string): Promise<ResolvedRoute> {
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

	// 2. Pagine successive degli archivi: /<archivio>/page/<N>, lo stesso
	// formato di WordPress (senza slash finale, come il resto del sito).
	// Si e' scelto apposta il formato di WordPress, e non un parametro come
	// "?pagina=N": se un domani il sito torna a essere servito da WordPress,
	// questi URL restano identici. E un percorso, a differenza di un
	// parametro, permette di mettere in cache anche le pagine d'archivio
	// (vedi generateStaticParams in app/[...slug]/page.tsx).
	const pageIndex = segments.length - 2;
	if (pageIndex >= 0 && segments[pageIndex] === 'page' && /^\d+$/.test(last)) {
		const base = segments.slice(0, pageIndex).join('/');
		const n = Number(last);
		if (!base) return { kind: 'redirect', to: '/' };
		if (n < 1) return NOT_FOUND;

		const archive = await resolveUncached(base);
		if (archive.kind === 'category' || archive.kind === 'tag') {
			// /page/1 e' l'archivio stesso; "/page/02" diventa "/page/2".
			if (n === 1 || String(n) !== last) return { kind: 'redirect', to: archivePagePath(archive.path, n) };
			return { ...archive, page: n };
		}
		// Una sottocategoria con il vecchio percorso corto
		// (/peperoncini-piu-piccanti-al-mondo/page/2) risolve in un redirect
		// al percorso completo: si reindirizza li', mantenendo la pagina.
		if (archive.kind === 'redirect') {
			const target = await resolveUncached(archive.to);
			if (target.kind === 'category' || target.kind === 'tag') {
				return { kind: 'redirect', to: archivePagePath(target.path, n) };
			}
		}
		return NOT_FOUND;
	}

	// 3. Archivi dei tag: solo /tag/<slug>.
	if (first === 'tag') {
		if (segments.length !== 2) return NOT_FOUND;
		const tag = await getTagBySlug(last);
		return tag ? { kind: 'tag', tag, path: `/tag/${tag.slug}`, page: 1 } : NOT_FOUND;
	}

	// 4. Un solo segmento: articolo, oppure categoria. Una sottocategoria
	// richiesta senza il genitore (/peperoncini-piu-piccanti-al-mondo)
	// viene reindirizzata al suo percorso completo.
	if (segments.length === 1) {
		const post = await getPostBySlug(first);
		if (post) return { kind: 'post', post, path: `/${post.slug}` };

		const category = await getCategoryBySlug(first);
		if (category) {
			const path = await getCategoryPath(category);
			return path === `/${first}` ? { kind: 'category', category, path, page: 1 } : { kind: 'redirect', to: path };
		}

		return NOT_FOUND;
	}

	// 5. Vecchi permalink con la data: redirect all'articolo, se esiste.
	if (isLegacyDatePath(segments)) {
		const post = await getPostBySlug(last);
		return post ? { kind: 'redirect', to: `/${post.slug}` } : NOT_FOUND;
	}

	// 6. Piu' segmenti: valido solo se e' esattamente il percorso gerarchico
	// di una categoria (/varieta-peperoncino/peperoncini-piu-piccanti-al-mondo).
	const category = await getCategoryBySlug(last);
	if (category) {
		const path = await getCategoryPath(category);
		if (path === `/${segments.join('/')}`) return { kind: 'category', category, path, page: 1 };
	}

	return NOT_FOUND;
}

/**
 * `cache()` di React deduplica la risoluzione tra generateMetadata e il
 * componente pagina della stessa richiesta. Riceve il percorso come stringa
 * (non come array) perche' cache() confronta gli argomenti per identita'.
 */
export const resolveRoute = cache(resolveUncached);

/**
 * Indirizzo di una pagina d'archivio: la prima e' l'archivio stesso
 * (/varieta-peperoncino), le successive /varieta-peperoncino/page/2.
 * Usato per canonical, link di paginazione e redirect, cosi' il formato e'
 * deciso in un solo punto.
 */
export function archivePagePath(path: string, page: number): string {
	return page > 1 ? `${path}/page/${page}` : path;
}
