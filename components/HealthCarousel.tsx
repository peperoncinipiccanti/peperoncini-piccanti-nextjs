'use client';

import { useEffect, useRef } from 'react';
import type { Post } from '@/lib/types';
import { PostCard } from './PostCard';

const AUTO_ADVANCE_MS = 5000;

/**
 * Blocco "Peperoncino e Salute" della sidebar home, sopra "Ultimi commenti":
 * tutti gli articoli con il tag "salute-peperoncino" (stesso pattern di
 * getPosts+tagId usato per "Come conservare i peperoncini", vedi app/page.tsx),
 * ma qui va mostrata una sola card alla volta che scorre da sola, non una
 * griglia/carosello a piu' colonne — coerente con la sidebar stretta (1/3).
 *
 * Riusa lo stesso scroll-snap nativo del resto del sito (niente libreria di
 * slider in piu'): un intervallo sposta lo scroller di una card alla volta e
 * torna all'inizio dopo l'ultima. "overflow-x-hidden" invece di "-auto"
 * perche' lo scorrimento qui deve essere solo automatico, non trascinabile
 * dall'utente (a differenza di PreserveCarousel, che ha le frecce): scrollTo
 * funziona comunque anche con l'overflow nascosto.
 */
export function HealthCarousel({ posts }: { posts: Post[] }) {
	const scrollerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (posts.length < 2) return;
		const el = scrollerRef.current;
		if (!el) return;

		const timer = setInterval(() => {
			const item = el.firstElementChild as HTMLElement | null;
			const step = item?.clientWidth ?? el.clientWidth;
			const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
			el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + step, behavior: 'smooth' });
		}, AUTO_ADVANCE_MS);

		return () => clearInterval(timer);
	}, [posts.length]);

	if (posts.length === 0) return null;

	return (
		<div className="mb-8">
			<h2 className="mb-4 text-2xl">Peperoncino e Salute</h2>
			<div ref={scrollerRef} className="pp-hero-scroller flex snap-x snap-mandatory gap-4 overflow-x-hidden">
				{posts.map((post) => (
					<div key={post.id} className="w-full flex-none snap-start">
						<PostCard post={post} />
					</div>
				))}
			</div>
		</div>
	);
}
