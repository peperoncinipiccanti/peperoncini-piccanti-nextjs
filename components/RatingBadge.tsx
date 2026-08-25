/**
 * Anello "piccantezza" in puro CSS (conic-gradient), identico a quello del
 * tema WordPress: nessuna libreria di grafici, nessun client-side JS.
 * Server Component: non spedisce nessun bundle JS al browser.
 */
export function RatingBadge({ rating, className = '' }: { rating: number | null; className?: string }) {
	if (rating === null) return null;

	const clamped = Math.max(0, Math.min(10, rating));
	const percent = Math.round((clamped / 10) * 100);
	const label = Number.isInteger(clamped) ? String(clamped) : clamped.toFixed(1);

	return (
		<div
			className={`pp-rating-badge__ring ${className}`}
			style={{ ['--pp-rating-percent' as string]: percent }}
			role="img"
			aria-label={`Livello di piccantezza: ${label} su 10`}
		>
			<span className="text-base font-black text-white" aria-hidden="true">
				{label}
			</span>
		</div>
	);
}
