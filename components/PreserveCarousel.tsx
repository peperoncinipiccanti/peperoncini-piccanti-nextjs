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
 * Le frecce sono sovrapposte allo slide stesso (bordo sinistro/destro,
 * verticalmente centrate) esattamente come nel bxSlider del vecchio tema —
 * non un pulsante separato accanto al titolo (quello stile e' proprio di
 * ReviewsCarousel, un widget diverso). Nessuna striscia di titoli sotto:
 * quella e' specifica dell'hero.
 */
export function PreserveCarousel({ posts }: { posts: Post[] }) {
	const scrollerRef = useRef<HTMLDivElement>(null);

	function scrollByOne(direction: 1 | -1) {
		const el = scrollerRef.current;
		if (!el) return;
		el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' });
	}

	if (posts.length === 0) return null;

	return (
		<div>
			<h2 className="mb-6 text-3xl">Come conservare i peperoncini | I metodi più comuni</h2>

			<div className="relative">
				<div ref={scrollerRef} className="pp-hero-scroller flex snap-x snap-mandatory overflow-x-auto">
					{posts.map((post) => (
						<div key={post.id} className="w-full flex-none snap-start">
							<PostCard post={post} size="large" />
						</div>
					))}
				</div>

				{posts.length > 1 && (
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
