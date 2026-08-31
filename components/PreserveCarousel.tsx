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
 * slug esatti indicati). Stesso meccanismo di scroll-snap + frecce di
 * HeroCarousel, ma senza la striscia di titoli sotto (quella e' specifica
 * dell'hero) e con card in stile "large" per un solo articolo alla volta.
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
			<div className="mb-6 flex items-center justify-between gap-4">
				<h2 className="text-3xl">Come conservare i peperoncini | I metodi più comuni</h2>
				{posts.length > 1 && (
					<div className="flex flex-none gap-2">
						<button
							type="button"
							onClick={() => scrollByOne(-1)}
							className="flex h-9 w-9 items-center justify-center bg-notte text-white transition hover:bg-teal"
							aria-label="Articolo precedente"
						>
							<ChevronLeft size={18} />
						</button>
						<button
							type="button"
							onClick={() => scrollByOne(1)}
							className="flex h-9 w-9 items-center justify-center bg-notte text-white transition hover:bg-teal"
							aria-label="Articolo successivo"
						>
							<ChevronRight size={18} />
						</button>
					</div>
				)}
			</div>

			<div ref={scrollerRef} className="pp-hero-scroller flex snap-x snap-mandatory overflow-x-auto">
				{posts.map((post) => (
					<div key={post.id} className="w-full flex-none snap-start">
						<PostCard post={post} size="large" />
					</div>
				))}
			</div>
		</div>
	);
}
