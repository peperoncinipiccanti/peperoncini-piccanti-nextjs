'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Post } from '@/lib/types';
import { PostCard } from './PostCard';

const PAGE_SIZE = 5; // 1 post grande + 4 piccoli, come nel widget originale

/**
 * Widget "Peperoncini Piccanti | Le mie recensioni" del vecchio tema: le
 * frecce non portano ad altre pagine, scorrono il MEDESIMO widget in home
 * mostrando il gruppo di articoli successivo (1 grande + 4 piccoli), sempre
 * dentro la categoria "Varieta' di Peperoncino". Per evitare richieste
 * aggiuntive al WordPress a ogni click, il server (app/page.tsx) precarica
 * gia' un blocco di post (es. 20) e qui si scorre in memoria, lato client.
 */
export function ReviewsCarousel({ posts }: { posts: Post[] }) {
	const [page, setPage] = useState(0);
	const totalPages = Math.ceil(posts.length / PAGE_SIZE);

	if (posts.length === 0) return null;

	const start = page * PAGE_SIZE;
	const current = posts.slice(start, start + PAGE_SIZE);
	const [featured, ...rest] = current;

	function goTo(direction: 1 | -1) {
		setPage((p) => (p + direction + totalPages) % totalPages);
	}

	return (
		<div>
			<div className="mb-6 flex items-center justify-between gap-4">
				<h2 className="text-3xl">Peperoncini Piccanti | Le mie recensioni</h2>
				{totalPages > 1 && (
					<div className="flex flex-none gap-2">
						<button
							type="button"
							onClick={() => goTo(-1)}
							className="flex h-9 w-9 items-center justify-center bg-notte text-white transition hover:bg-teal"
							aria-label="Recensioni precedenti"
						>
							<ChevronLeft size={18} />
						</button>
						<button
							type="button"
							onClick={() => goTo(1)}
							className="flex h-9 w-9 items-center justify-center bg-notte text-white transition hover:bg-teal"
							aria-label="Recensioni successive"
						>
							<ChevronRight size={18} />
						</button>
					</div>
				)}
			</div>

			{featured && (
				<div className="mb-6">
					<PostCard post={featured} size="large" priority={page === 0} />
				</div>
			)}

			{/*
			 * 2 per riga: essendo questa colonna solo 2/3 della larghezza
			 * pagina, 4 per riga rendeva le card troppo strette — titolo
			 * sovrapposto e foto schiacciata.
			 */}
			<div className="grid grid-cols-2 gap-6">
				{rest.map((post) => (
					<PostCard key={post.id} post={post} />
				))}
			</div>
		</div>
	);
}
