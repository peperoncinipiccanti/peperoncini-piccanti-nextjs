'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Post } from '@/lib/types';
import { PostCard } from './PostCard';

/**
 * Slider "Come conservare i peperoncini | I metodi piu' comuni" del vecchio
 * tema: un carosello (bxSlider nel tema originale) che ruota tra alcuni
 * articoli scelti a mano — non un elenco di categoria, per questo i post
 * arrivano gia' pronti da app/page.tsx (4 chiamate a getPostBySlug per gli
 * slug esatti indicati).
 *
 * Nel vecchio tema erano sempre visibili 3 card insieme (bxSlider con
 * minSlides:3), e le frecce scorrevano di una card alla volta rivelando le
 * successive — non uno slide singolo a tutta larghezza. Ogni card e' quindi
 * larga 1/3 del contenitore da desktop in su (1/2 su tablet, intera su
 * mobile), e le frecce spostano lo scroller della larghezza di UNA card
 * (letta dal primo figlio), non dell'intero contenitore.
 *
 * Le frecce restano sovrapposte al carosello (bordo sinistro/destro,
 * verticalmente centrate) come nel bxSlider originale — non un pulsante
 * separato accanto al titolo (quello stile e' proprio di ReviewsCarousel).
 */
export function PreserveCarousel({ posts }: { posts: Post[] }) {
	const scrollerRef = useRef<HTMLDivElement>(null);

	function scrollByOne(direction: 1 | -1) {
		const el = scrollerRef.current;
		if (!el) return;
		const item = el.firstElementChild as HTMLElement | null;
		const step = item?.clientWidth ?? el.clientWidth;
		el.scrollBy({ left: direction * step, behavior: 'smooth' });
	}

	if (posts.length === 0) return null;

	return (
		<div>
			<h2 className="mb-6 text-3xl">Come conservare i peperoncini | I metodi più comuni</h2>

			<div className="relative">
				<div ref={scrollerRef} className="pp-hero-scroller flex snap-x snap-mandatory gap-6 overflow-x-auto">
					{posts.map((post) => (
						<div key={post.id} className="w-full flex-none snap-start sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]">
							<PostCard post={post} />
						</div>
					))}
				</div>

				{posts.length > 3 && (
					<div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 justify-between px-2">
						<button
							type="button"
							onClick={() => scrollByOne(-1)}
							className="pointer-events-auto flex h-10 w-10 items-center justify-center bg-notte/70 text-white transition hover:bg-teal"
							aria-label="Articolo precedente"
						>
							<ChevronLeft size={22} />
						</button>
						<button
							type="button"
							onClick={() => scrollByOne(1)}
							className="pointer-events-auto flex h-10 w-10 items-center justify-center bg-notte/70 text-white transition hover:bg-teal"
							aria-label="Articolo successivo"
						>
							<ChevronRight size={22} />
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
