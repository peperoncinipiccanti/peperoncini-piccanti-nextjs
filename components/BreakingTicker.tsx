'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type TickerItem = { id: number; title: string; href: string };

/**
 * Ticker verticale "Post piccanti!": nel tema Edition originale e' un
 * bxSlider in autoplay (modalita' verticale) che mostra un articolo alla
 * volta e scorre al successivo ogni pochi secondi, con frecce prev/next.
 * Qui e' reimplementato senza jQuery/bxSlider: un piccolo client component
 * con CSS transition + setInterval, in linea con l'approccio gia' usato in
 * HeroCarousel.tsx (CSS nativo, JS solo per l'interazione).
 *
 * L'autoplay si ferma al passaggio del mouse/focus (accessibilita' e per non
 * distrarre chi sta leggendo il titolo corrente) e riparte quando si esce.
 */
export function BreakingTicker({ items }: { items: TickerItem[] }) {
	const [index, setIndex] = useState(0);
	const [paused, setPaused] = useState(false);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		if (items.length <= 1 || paused) return;

		timerRef.current = setInterval(() => {
			setIndex((i) => (i + 1) % items.length);
		}, 4000);

		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, [items.length, paused]);

	if (items.length === 0) return null;

	function goTo(next: number) {
		setIndex((next + items.length) % items.length);
	}

	return (
		<div
			className="flex min-w-0 flex-1 items-stretch"
			onMouseEnter={() => setPaused(true)}
			onMouseLeave={() => setPaused(false)}
			onFocus={() => setPaused(true)}
			onBlur={() => setPaused(false)}
		>
			<p className="pp-tag shrink-0 self-center bg-teal px-3 py-1 text-[0.7rem] font-black uppercase tracking-widest text-white">
				Post piccanti!
			</p>

			<div className="relative ml-3 h-5 min-w-0 flex-1 overflow-hidden" aria-live="polite">
				{items.map((item, i) => (
					<Link
						key={item.id}
						href={item.href}
						aria-hidden={i !== index}
						tabIndex={i === index ? 0 : -1}
						className="absolute inset-0 truncate text-[0.75rem] font-bold uppercase tracking-wide text-white transition-all duration-500 ease-out hover:text-teal"
						style={{
							transform: `translateY(${(i - index) * 100}%)`,
							opacity: i === index ? 1 : 0,
						}}
					>
						{item.title}
					</Link>
				))}
			</div>

			{items.length > 1 && (
				<div className="ml-3 hidden shrink-0 items-center gap-1 sm:flex">
					<button
						type="button"
						aria-label="Articolo precedente"
						onClick={() => goTo(index - 1)}
						className="px-1 text-white/60 transition hover:text-teal"
					>
						‹
					</button>
					<button
						type="button"
						aria-label="Articolo successivo"
						onClick={() => goTo(index + 1)}
						className="px-1 text-white/60 transition hover:text-teal"
					>
						›
					</button>
				</div>
			)}
		</div>
	);
}
