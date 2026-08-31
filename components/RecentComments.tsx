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
 * Ogni commento e' un callout grafico (sfondo nero al 20%, non una semplice
 * riga separata da un bordo) come nel widget originale.
 */
export function RecentComments({ comments }: { comments: RecentComment[] }) {
	if (comments.length === 0) return null;

	return (
		<aside aria-label="Ultimi commenti">
			<h2 className="mb-6 text-2xl">Ultimi commenti</h2>
			<ul className="flex flex-col gap-3">
				{comments.map((comment) => (
					<li key={comment.id}>
						<Link
							href={comment.href}
							className="group block bg-black/20 px-4 py-3 text-sm leading-snug text-testo-secondario transition hover:bg-black/30"
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
