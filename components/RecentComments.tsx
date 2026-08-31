import Link from 'next/link';
import type { RecentComment } from '@/lib/types';

/**
 * Widget "Ultimi commenti" del vecchio tema Edition: elenco "Autore su
 * Titolo articolo" con link diretto al commento sull'articolo. Server
 * Component, zero JS: i dati arrivano gia' pronti da getRecentComments()
 * (lib/wp.ts), che a sua volta ritorna un array vuoto se l'endpoint dei
 * commenti e' disabilitato sul WordPress — per questo il componente
 * ritorna null in quel caso invece di mostrare una sezione vuota.
 *
 * Ogni commento e' un vero callout "a fumetto" (angoli arrotondati + punta
 * triangolare sul lato sinistro, non un rettangolo), con un grigio chiaro
 * (nero al 6-8%, non al 20%) come nel widget originale.
 */
export function RecentComments({ comments }: { comments: RecentComment[] }) {
	if (comments.length === 0) return null;

	return (
		<aside aria-label="Ultimi commenti">
			<h2 className="mb-6 text-2xl">Ultimi commenti</h2>
			<ul className="flex flex-col gap-4">
				{comments.map((comment) => (
					<li key={comment.id} className="group relative ml-2">
						{/* Punta del fumetto: triangolo CSS puro, nessuna immagine. */}
						<span
							aria-hidden="true"
							className="absolute -left-2 top-4 h-0 w-0 border-y-[7px] border-r-[8px] border-y-transparent border-r-black/[0.06] transition group-hover:border-r-black/[0.1]"
						/>
						<Link
							href={comment.href}
							className="block rounded-md bg-black/[0.06] px-4 py-3 text-sm leading-snug text-testo-secondario transition group-hover:bg-black/[0.1]"
						>
							<span className="font-bold text-testo group-hover:text-teal">{comment.authorName}</span>{' '}
							su{' '}
							<span className="font-semibold text-testo group-hover:text-teal">{comment.postTitle}</span>
						</Link>
					</li>
				))}
			</ul>
		</aside>
	);
}
