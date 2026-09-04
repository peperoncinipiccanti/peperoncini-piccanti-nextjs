'use client';

import { ReactNode, useState } from 'react';

/**
 * Wrapper client per il "Visualizza tutti i commenti": i nodi <CommentNode>
 * arrivano gia' renderizzati da CommentsSection.tsx (Server Component), qui
 * si sceglie solo QUALI mostrare — nessun dato dei commenti passa nel bundle
 * client, solo elementi React gia' pronti (pattern standard per mescolare
 * Server e Client Component senza dover "client-izzare" tutto l'albero).
 *
 * Di default si vedono solo gli ultimi 5 thread (i piu' recenti, essendo
 * `comments` ordinato dal piu' vecchio al piu' nuovo): su articoli vecchi con
 * decine di commenti, il blocco "Potrebbe interessarti anche" sotto restava
 * altrimenti troppo in basso per essere notato.
 */
export function CommentsList({ recent, older }: { recent: ReactNode[]; older: ReactNode[] }) {
	const [expanded, setExpanded] = useState(false);

	return (
		<div className="mb-10">
			<ul className="flex flex-col gap-5">{expanded ? [...older, ...recent] : recent}</ul>

			{!expanded && older.length > 0 && (
				<button
					type="button"
					onClick={() => setExpanded(true)}
					className="mt-6 text-sm font-bold uppercase tracking-wide text-teal transition hover:text-corallo"
				>
					Visualizza tutti i commenti ({older.length + recent.length})
				</button>
			)}
		</div>
	);
}
