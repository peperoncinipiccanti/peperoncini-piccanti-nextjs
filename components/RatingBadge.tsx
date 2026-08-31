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
			className={`pp-rating-badge__ring group ${className}`}
			style={{ ['--pp-rating-percent' as string]: percent }}
			role="img"
			aria-label={`Livello di piccantezza: ${label} su 10`}
		>
			<span
				className="text-xl font-black text-white transition-transform duration-200 ease-out group-hover:scale-125"
				aria-hidden="true"
			>
				{label}
			</span>
		</div>
	);
}
