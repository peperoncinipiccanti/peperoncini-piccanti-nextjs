'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Post } from '@/lib/types';
import { RatingBadge } from './RatingBadge';

/**
 * Lo scorrimento e' CSS puro (scroll-snap): funziona anche con JavaScript
 * disattivato o prima che React idrati la pagina. I pulsanti prev/next sono
 * un progressive enhancement — per questo e' l'unico componente "use client"
 * di tutta l'interfaccia: tutto il resto resta Server Component, zero JS.
 */
export function HeroCarousel({ posts }: { posts: Post[] }) {
	const scrollerRef = useRef<HTMLDivElement>(null);

	function scrollByOne(direction: 1 | -1) {
		const el = scrollerRef.current;
		if (!el) return;
		el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' });
	}

	if (posts.length === 0) return null;

	return (
		<section className="relative" aria-label="Articoli in evidenza">
			<div
				ref={scrollerRef}
				className="pp-hero-scroller flex snap-x snap-mandatory overflow-x-auto"
			>
				{posts.map((post, i) => (
					<article
						key={post.id}
						className="group relative min-h-[320px] w-full flex-none snap-start sm:min-h-[420px] lg:min-h-[560px]"
					>
						<Link href={`/${post.slug}`} className="absolute inset-0 z-10" aria-label={post.title} />

						{post.featuredImage && (
							<Image
								src={post.featuredImage.url}
								alt={post.featuredImage.alt}
								fill
								priority={i === 0}
								sizes="100vw"
								className="object-cover"
							/>
						)}

						<RatingBadge rating={post.rating} className="absolute right-4 top-4 z-20 sm:right-8 sm:top-8" />

						<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-notte/90 via-notte/10 to-transparent" />

						<div className="relative z-20 flex h-full flex-col justify-end gap-3 p-6 sm:p-10 lg:p-14">
							{post.categories.length > 0 && (
								<ul className="flex flex-wrap gap-1.5">
									{post.categories.slice(0, 2).map((cat) => (
										<li
											key={cat.id}
											className="pp-tag bg-teal px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-white"
										>
											{cat.name}
										</li>
									))}
								</ul>
							)}
							<h2 className="max-w-2xl text-3xl font-black uppercase leading-tight text-white sm:text-5xl">
								{post.title}
							</h2>
							{/* Decorativo: il click e' gestito dal link che copre l'intera card
							    (sopra), quindi qui e' uno <span> e non un secondo <a> annidato. */}
							<span
								aria-hidden="true"
								className="mt-1 inline-flex w-fit items-center border border-white px-5 py-2 text-xs font-bold uppercase tracking-wide text-white transition group-hover:bg-white group-hover:text-notte"
							>
								Leggi l&rsquo;articolo
							</span>
						</div>
					</article>
				))}
			</div>

			{posts.length > 1 && (
				<div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 hidden -translate-y-1/2 justify-between px-4 sm:flex">
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
		</section>
	);
}
