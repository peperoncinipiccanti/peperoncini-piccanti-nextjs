import Link from 'next/link';
import { archivePagePath } from '@/lib/routes';

/**
 * Paginazione via link: niente stato client, funziona anche senza
 * JavaScript, ed e' crawlabile da Google come pagine distinte.
 *
 * Due formati:
 * - "path" (archivi di categorie e tag): /varieta-peperoncino/page/2, lo
 *   stesso formato di WordPress, vedi archivePagePath() in lib/routes.ts;
 * - "query" (ricerca): /cerca?q=scorpion&pagina=2, perche' la ricerca ha
 *   comunque bisogno dei parametri e non viene indicizzata.
 */
export function Pagination({
	currentPage,
	totalPages,
	basePath,
	extraParams = {},
	linkStyle = 'query',
}: {
	currentPage: number;
	totalPages: number;
	basePath: string;
	/** Altri query param da preservare tra una pagina e l'altra (es. { q: "scorpion" }). Solo per linkStyle "query". */
	extraParams?: Record<string, string>;
	linkStyle?: 'path' | 'query';
}) {
	if (totalPages <= 1) return null;

	const hasPrev = currentPage > 1;
	const hasNext = currentPage < totalPages;

	function hrefFor(page: number) {
		if (linkStyle === 'path') return archivePagePath(basePath, page);

		const params = new URLSearchParams(extraParams);
		if (page > 1) params.set('pagina', String(page));
		const qs = params.toString();
		return qs ? `${basePath}?${qs}` : basePath;
	}

	return (
		<nav aria-label="Paginazione" className="mt-10 flex items-center justify-center gap-4 text-sm font-bold uppercase">
			{hasPrev ? (
				<Link href={hrefFor(currentPage - 1)} className="text-testo hover:text-teal">
					« Precedenti
				</Link>
			) : (
				<span className="text-testo-secondario/40">« Precedenti</span>
			)}

			<span className="text-testo-secondario">
				Pagina {currentPage} di {totalPages}
			</span>

			{hasNext ? (
				<Link href={hrefFor(currentPage + 1)} className="text-testo hover:text-teal">
					Successivi »
				</Link>
			) : (
				<span className="text-testo-secondario/40">Successivi »</span>
			)}
		</nav>
	);
}
