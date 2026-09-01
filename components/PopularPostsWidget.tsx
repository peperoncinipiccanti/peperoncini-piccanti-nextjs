'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import type { PopularPost } from '@/lib/types';

type Range = 'weekly' | 'monthly' | 'all_time';

const TABS: { key: Range; label: string }[] = [
	{ key: 'weekly', label: 'Settimana' },
	{ key: 'monthly', label: 'Mese' },
	{ key: 'all_time', label: 'Sempre' },
];

/**
 * Widget sidebar "I post piccanti più visti" delle pagine categoria (vecchio
 * tema Edition): selettore a tab Settimana/Mese/Sempre, ciascuna con la sua
 * classifica di articoli (thumbnail + titolo + icona occhio + N visualizzazioni).
 *
 * I dati per tutte e tre le classifiche arrivano gia' pronti come prop da
 * getPopularPosts() (fetch server-side, singola chiamata) — qui si cambia
 * solo quale array mostrare, senza ulteriori richieste di rete: cosi' il
 * cambio tab e' istantaneo e non genera traffico aggiuntivo verso WordPress.
 *
 * Se tutte e tre le liste sono vuote (plugin companion non ancora
 * aggiornato sul WordPress live, o nessuna visualizzazione ancora
 * registrata dal nuovo ViewTracker) il widget non si mostra.
 */
export function PopularPostsWidget({
	weekly,
	monthly,
	allTime,
}: {
	weekly: PopularPost[];
	monthly: PopularPost[];
	allTime: PopularPost[];
}) {
	const [active, setActive] = useState<Range>('weekly');

	const byRange: Record<Range, PopularPost[]> = { weekly, monthly, all_time: allTime };
	const posts = byRange[active];

	if (weekly.length === 0 && monthly.length === 0 && allTime.length === 0) {
		return null;
	}

	return (
		<aside aria-label="I post piccanti più visti">
			<h2 className="mb-4 text-2xl">I post piccanti più visti</h2>

			<div className="flex border-b border-bordo">
				{TABS.map((tab) => (
					<button
						key={tab.key}
						type="button"
						onClick={() => setActive(tab.key)}
						className={`flex-1 border-b-2 px-2 py-2 text-xs font-bold uppercase tracking-wide transition ${
							active === tab.key
								? 'border-corallo text-corallo'
								: 'border-transparent text-testo-secondario hover:text-testo'
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{posts.length === 0 ? (
				<p className="mt-4 text-sm text-testo-secondario">Nessun dato disponibile per questo periodo.</p>
			) : (
				<ul className="mt-4 flex flex-col gap-4">
					{posts.map((post, i) => (
						<li key={post.id} className="flex items-center gap-3">
							<span className="w-5 flex-none text-center text-lg font-black text-bordo">{i + 1}</span>
							<Link href={post.link} className="relative aspect-square w-16 flex-none overflow-hidden bg-sfondo-chiaro">
								{post.thumbnail && (
									<Image src={post.thumbnail} alt="" fill sizes="64px" className="object-cover" />
								)}
							</Link>
							<div className="min-w-0 flex-1">
								<Link
									href={post.link}
									className="line-clamp-2 text-sm font-bold leading-snug text-testo transition hover:text-teal"
								>
									{post.title}
								</Link>
								<span className="mt-1 flex items-center gap-1 text-xs text-testo-secondario">
									<Eye size={13} />
									{post.views.toLocaleString('it-IT')} Views
								</span>
							</div>
						</li>
					))}
				</ul>
			)}
		</aside>
	);
}
