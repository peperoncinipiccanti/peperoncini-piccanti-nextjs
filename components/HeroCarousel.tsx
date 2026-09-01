'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Post } from '@/lib/types';
import { timeAgo } from '@/lib/format';
import { RatingBadge } from './RatingBadge';

const AUTOPLAY_MS = 3500;

/**
 * Lo scorrimento e' CSS puro (scroll-snap): funziona anche con JavaScript
 * disattivato o prima che React idrati la pagina. I pulsanti prev/next sono
 * un progressive enhancement — per questo e' l'unico componente "use client"
 * di tutta l'interfaccia: tutto il resto resta Server Component, zero JS.
 *
 * L'autoplay legge ogni volta la posizione REALE dello scroller (scrollLeft)
 * invece di tenere un indice separato in state: cosi' se l'utente scorre a
 * mano (swipe/trackpad) l'autoplay riparte da li', senza "scattare indietro"
 * alla prossima tick. Si ferma al passaggio del mouse (comportamento
 * standard dei carousel del vecchio tema) e riparte quando esce.
 */
export function HeroCarousel({ posts }: { posts: Post[] }) {
	const scrollerRef = useRef<HTMLDivElement>(null);
	const pausedRef = useRef(false);

	function scrollByOne(direction: 1 | -1) {
		const el = scrollerRef.current;
		if (!el) return;
		el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' });
	}

	useEffect(() => {
		if (posts.length <= 1) return;

		const id = setInterval(() => {
			const el = scrollerRef.current;
			if (!el || pausedRef.current) return;

			const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
			if (atEnd) {
				el.scrollTo({ left: 0, behavior: 'smooth' });
			} else {
				el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
			}
		}, AUTOPLAY_MS);

		return () => clearInterval(id);
	}, [posts.length]);

	if (posts.length === 0) return null;

	return (
		<section
			className="relative"
			aria-label="Articoli in evidenza"
			onMouseEnter={() => {
				pausedRef.current = true;
			}}
			onMouseLeave={() => {
				pausedRef.current = false;
			}}
		>
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

						{/*
						 * "pointer-events-none": questo blocco (titolo, tag, pulsante)
						 * si trova sopra il link che copre l'intera card (z-20 contro
						 * z-10) — senza disattivare i suoi eventi di puntamento,
						 * intercetta il click prima che raggiunga il link sottostante,
						 * rendendo la card cliccabile solo nell'area vuota non coperta
						 * da questo contenuto. Nessun elemento qui dentro ha bisogno
						 * di un proprio click handler, quindi il click passa sempre
						 * al link della card.
						 */}
						<div className="pointer-events-none relative z-20 flex h-full flex-col justify-end gap-3 p-6 sm:p-10 lg:p-14">
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
								Leggi
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

			{/*
			 * Striscia "altri featured" del vecchio tema Edition: sotto l'hero
			 * mostrava sempre TUTTI i titoli in evidenza (con link diretto e
			 * "N ANNI AGO"), non solo quelli diversi dallo slide corrente —
			 * verificato dal vivo avanzando lo slider: la lista non cambiava.
			 * Qui si riproduce lo stesso elenco fisso, testo bianco per
			 * leggibilità su sfondo scuro, separatori verticali tra gli item.
			 */}
			{posts.length > 1 && (
				<ul className="hidden flex-wrap items-center gap-x-6 gap-y-3 bg-notte px-6 py-4 sm:flex sm:px-10 sm:py-5">
					{posts.map((post, i) => (
						<li key={post.id} className="flex items-center gap-6">
							<Link href={`/${post.slug}`} className="group/item flex flex-col gap-0.5">
								<span className="max-w-[16rem] truncate text-sm font-bold uppercase tracking-wide text-white transition group-hover/item:text-teal sm:text-base">
									{post.title}
								</span>
								<span className="text-[0.7rem] font-semibold uppercase tracking-wide text-white/60">
									{timeAgo(post.date)}
								</span>
							</Link>
							{i < posts.length - 1 && (
								<span className="hidden h-8 w-px bg-white/20 sm:block" aria-hidden="true" />
							)}
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
