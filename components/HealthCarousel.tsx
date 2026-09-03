'use client';

import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Post } from '@/lib/types';
import { PostCard } from './PostCard';

const AUTO_ADVANCE_MS = 9000;

/**
 * Blocco "Peperoncino e Salute" della sidebar home, sopra "Ultimi commenti":
 * tutti gli articoli con il tag "salute-peperoncino" (stesso pattern di
 * getPosts+tagId usato per "Come conservare i peperoncini", vedi app/page.tsx),
 * ma qui va mostrata una sola card alla volta che scorre da sola, non una
 * griglia/carosello a piu' colonne — coerente con la sidebar stretta (1/3).
 *
 * Riusa lo stesso scroll-snap nativo del resto del sito (niente libreria di
 * slider in piu'): un intervallo sposta lo scroller di una card alla volta e
 * torna all'inizio dopo l'ultima. A differenza della prima versione,
 * "overflow-x-auto" (non "-hidden"): serve per permettere lo swipe touch da
 * mobile e le frecce di scorrimento manuale, che spostano lo scroller esattamente
 * come fa gia' l'intervallo automatico (stessa funzione "scrollByOne").
 */
export function HealthCarousel({ posts }: { posts: Post[] }) {
	const scrollerRef = useRef<HTMLDivElement>(null);

	function scrollByOne(direction: 1 | -1) {
		const el = scrollerRef.current;
		if (!el) return;
		const item = el.firstElementChild as HTMLElement | null;
		const step = item?.clientWidth ?? el.clientWidth;

		if (direction === 1 && el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) {
			el.scrollTo({ left: 0, behavior: 'smooth' });
			return;
		}
		if (direction === -1 && el.scrollLeft <= 4) {
			el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
			return;
		}
		el.scrollBy({ left: direction * step, behavior: 'smooth' });
	}

	useEffect(() => {
		if (posts.length < 2) return;
		const timer = setInterval(() => scrollByOne(1), AUTO_ADVANCE_MS);
		return () => clearInterval(timer);
	}, [posts.length]);

	if (posts.length === 0) return null;

	return (
		<div className="mb-8">
			<h2 className="mb-4 text-2xl">Peperoncino e Salute</h2>

			<div className="relative">
				<div
					ref={scrollerRef}
					className="pp-hero-scroller flex snap-x snap-mandatory gap-4 overflow-x-auto"
				>
					{posts.map((post) => (
						<div key={post.id} className="w-full flex-none snap-start">
							<PostCard post={post} mobileSquareImage />
						</div>
					))}
				</div>

				{posts.length > 1 && (
					<div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 justify-between px-2">
						<button
							type="button"
							onClick={() => scrollByOne(-1)}
							className="pointer-events-auto flex h-9 w-9 items-center justify-center bg-notte/70 text-white transition hover:bg-teal"
							aria-label="Articolo precedente"
						>
							<ChevronLeft size={20} />
						</button>
						<button
							type="button"
							onClick={() => scrollByOne(1)}
							className="pointer-events-auto flex h-9 w-9 items-center justify-center bg-notte/70 text-white transition hover:bg-teal"
							aria-label="Articolo successivo"
						>
							<ChevronRight size={20} />
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
