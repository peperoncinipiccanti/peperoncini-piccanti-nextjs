import type { Post } from '@/lib/types';
import { PostCard } from './PostCard';

/**
 * Blocco "Potrebbe interessarti anche" sotto ogni articolo: 3 post correlati
 * (stessa categoria principale, con fallback su tag/ultimi pubblicati — vedi
 * getRelatedPosts() in lib/wp.ts), a tutta larghezza sotto la griglia
 * articolo+sidebar, non dentro la colonna stretta dell'articolo: 3 card
 * affiancate hanno bisogno di piu' spazio orizzontale di quanto ne resti nei
 * 2/3 della griglia.
 */
export function RelatedPosts({ posts }: { posts: Post[] }) {
	if (posts.length === 0) return null;

	return (
		<section className="mx-auto max-w-6xl px-4 pb-16">
			<h2 className="mb-6 text-2xl">Potrebbe interessarti anche</h2>
			{/*
			 * 1 colonna sotto "sm", 3 da "sm" in su, a piena larghezza pagina
			 * (max-w-6xl, non nella colonna 2/3 della griglia articolo). "sizes"
			 * riflette questo: circa un terzo del viewport (con margine per i 2
			 * gap da 24px) da "sm" in su, altrimenti quasi tutto il viewport.
			 */}
			<div className="grid gap-6 sm:grid-cols-3">
				{posts.map((post) => (
					<PostCard key={post.id} post={post} sizes="(min-width: 640px) calc(33vw - 40px), calc(100vw - 32px)" />
				))}
			</div>
		</section>
	);
}
