import Image from 'next/image';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { FacebookIcon, InstagramIcon } from './icons';
import { BreakingTicker } from './BreakingTicker';
import { getTickerPosts } from '@/lib/wp';

type MenuItem = { label: string; href: string };

// Stesso backend WordPress usato in lib/wp.ts: il logo resta un asset della
// libreria media di WP (non del tema), quindi la stessa immagine visibile
// oggi su Edition e' quella corretta anche qui, in un setup headless.
const WP_API_URL = (process.env.WP_API_URL ?? 'https://cms.peperoncinipiccanti.com').replace(/\/+$/, '');
const LOGO_URL = `${WP_API_URL}/wp-content/uploads/2021/02/logo-www.peperoncinipiccanti.com_Tavola-disegno-1-1.jpg`;

export async function Header({ menu }: { menu: MenuItem[] }) {
	const tickerItems = await getTickerPosts();

	return (
		<header>
			<div className="flex items-center justify-between gap-4 bg-notte px-4 py-2 text-white">
				<BreakingTicker items={tickerItems} />
				<div className="flex items-center gap-3">
					<a
						href="https://www.facebook.com/peperoncinipiccanti"
						target="_blank"
						rel="noreferrer"
						aria-label="Facebook"
					>
						<FacebookIcon size={16} />
					</a>
					<a
						href="https://www.instagram.com/peperoncinipiccanti"
						target="_blank"
						rel="noreferrer"
						aria-label="Instagram"
					>
						<InstagramIcon size={16} />
					</a>
				</div>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-4 border-b border-bordo px-4 py-4">
				<Link href="/" className="shrink-0">
					{/* Logo reale caricato nella libreria media di WordPress: sfondo bianco
					    nel file sorgente, per questo il contenitore ha uno sfondo bianco
					    esplicito anche se l'header e' gia' bianco (coerenza se in futuro
					    cambia). Dimensioni intrinseche reali 1001x126, per evitare CLS. */}
					<Image
						src={LOGO_URL}
						alt="PeperonciniPiccanti.com — Ricette e consigli per amanti del peperoncino"
						width={1001}
						height={126}
						priority
						className="h-10 w-auto sm:h-12"
					/>
				</Link>

				<nav aria-label="Menu principale">
					<ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold uppercase tracking-wide">
						{menu.map((item) => (
							<li key={item.href}>
								<Link href={`/${item.href.replace(/^\//, '')}`} className="text-testo hover:text-corallo">
									{item.label}
								</Link>
							</li>
						))}
					</ul>
				</nav>

				<Link href="/cerca" aria-label="Cerca" className="text-testo hover:text-teal">
					<Search size={20} />
				</Link>
			</div>
		</header>
	);
}
