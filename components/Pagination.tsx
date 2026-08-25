import Link from 'next/link';

/**
 * Paginazione via link (?pagina=N): niente stato client, funziona anche
 * senza JavaScript, ed e' crawlabile da Google come pagine distinte.
 */
export function Pagination({
	currentPage,
	totalPages,
	basePath,
	extraParams = {},
}: {
	currentPage: number;
	totalPages: number;
	basePath: string;
	/** Altri query param da preservare tra una pagina e l'altra (es. { q: "scorpion" }). */
	extraParams?: Record<string, string>;
}) {
	if (totalPages <= 1) return null;

	const hasPrev = currentPage > 1;
	const hasNext = currentPage < totalPages;

	function hrefFor(page: number) {
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
