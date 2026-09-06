import type { Post } from '@/lib/types';

/**
 * Blocco "Recensione" del vecchio tema Edition: finora il frontend headless
 * mostrava solo il cerchietto compatto col punteggio finale (RatingBadge),
 * mai il dettaglio che lo compone — il sommario descrittivo e la barra di
 * ciascun "Review Criteria" (Piccantezza/Gusto/Estetica ecc., inseriti
 * dall'editor nel backoffice) con cui viene calcolata la media. Qui si
 * ricostruisce quel blocco: intestazione "RECENSIONE | Titolo articolo",
 * lo stesso anello (piu' grande, vedi .pp-review-ring in globals.css) col
 * titolo review e il sommario, poi una barra per ciascun criterio.
 *
 * Renderizzato solo per gli articoli con `post.review` valorizzato — cioe'
 * quelli marcati come review nel backoffice (es. le varieta' di
 * peperoncino), mai le ricette.
 */
export function ReviewBreakdown({ post }: { post: Post }) {
	const review = post.review;
	if (!review) return null;

	const clamped = Math.max(0, Math.min(10, review.score));
	const percent = Math.round((clamped / 10) * 100);
	const scoreLabel = Number.isInteger(clamped) ? String(clamped) : clamped.toFixed(1);

	// Il campo WordPress arriva come testo libero con un concetto per riga,
	// separato da una riga vuota (stesso formato del vecchio tema) — si
	// spezza in paragrafi invece di mostrarlo come un unico blocco compatto.
	const summaryParagraphs = review.summary
		.split(/\r?\n\s*\r?\n/)
		.map((p) => p.trim())
		.filter(Boolean);

	return (
		<div className="my-10">
			<h2 className="mb-4 flex flex-wrap items-baseline gap-2 text-lg">
				<span className="font-black uppercase text-testo">Recensione</span>
				<span className="text-bordo" aria-hidden="true">
					|
				</span>
				<span className="text-testo-secondario">{post.title}</span>
			</h2>

			<div className="bg-sfondo-chiaro p-6 sm:p-10">
				<div className="flex flex-col items-center text-center">
					<div
						className="pp-review-ring"
						style={{ ['--pp-rating-percent' as string]: percent }}
						role="img"
						aria-label={`Punteggio recensione: ${scoreLabel} su 10`}
					>
						<span className="text-4xl font-black text-testo" aria-hidden="true">
							{scoreLabel}
						</span>
					</div>

					{review.title && <p className="mt-4 text-xl font-bold text-testo">{review.title}</p>}

					{summaryParagraphs.length > 0 && (
						<div className="mt-3 flex max-w-xl flex-col gap-3 text-testo-secondario">
							{summaryParagraphs.map((paragraph, i) => (
								<p key={i}>{paragraph}</p>
							))}
						</div>
					)}
				</div>

				{review.criteria.length > 0 && (
					<div className="mx-auto mt-10 flex max-w-xl flex-col gap-5">
						{review.criteria.map((criterion, i) => {
							const value = criterion.rating ?? 0;
							const barPercent = Math.max(0, Math.min(100, (value / 10) * 100));
							return (
								<div key={i}>
									<div className="mb-1.5 flex items-center justify-between gap-3">
										<span className="text-xs font-bold uppercase tracking-wide text-testo-secondario">
											{criterion.label}
										</span>
										<span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-base text-xs font-bold text-teal shadow-sm">
											{criterion.rating ?? '–'}
										</span>
									</div>
									<div className="h-1.5 w-full bg-bordo">
										<div className="h-full bg-teal" style={{ width: `${barPercent}%` }} />
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
