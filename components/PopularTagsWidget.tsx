import Link from 'next/link';
import type { WPCategory } from '@/lib/types';

/**
 * Widget sidebar "Tag più utilizzati" (pagine categoria/tag, articolo,
 * ricerca — non in home): stessa pillola grafica usata per le categorie
 * nelle card (classe "pp-tag", vedi PostCard.tsx) cosi' il linguaggio visivo
 * dei tag resta coerente in tutto il sito. I dati arrivano gia' ordinati per
 * numero di articoli da getPopularTags() (lib/wp.ts).
 */
export function PopularTagsWidget({ tags }: { tags: WPCategory[] }) {
	if (tags.length === 0) return null;

	return (
		<aside aria-label="Tag più utilizzati">
			<h2 className="mb-4 text-2xl">Tag più utilizzati</h2>
			<ul className="flex flex-wrap gap-2">
				{tags.map((tag) => (
					<li key={tag.id}>
						<Link
							href={`/tag/${tag.slug}`}
							className="pp-tag inline-block bg-notte px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-white transition hover:bg-teal"
						>
							{tag.name}
						</Link>
					</li>
				))}
			</ul>
		</aside>
	);
}
