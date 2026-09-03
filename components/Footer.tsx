import Link from 'next/link';
import { FacebookIcon, InstagramIcon, LinkedinIcon, PinterestIcon, XIcon } from './icons';

type MenuItem = { label: string; href: string };

export function Footer({ menu }: { menu: MenuItem[] }) {
	return (
		<footer className="mt-16 bg-notte px-4 pb-6 pt-14 text-white">
			<div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-3">
				<div className="space-y-3">
					<h4 className="text-lg font-black uppercase text-white">PeperonciniPiccanti.com</h4>
					<p className="text-sm text-white/70">
						Il blog più piccante della rete: ricette, varietà, coltivazione e consigli su un unico filo
						conduttore, il peperoncino.
					</p>
					<div className="flex gap-3 pt-1">
						<a href="https://www.facebook.com/peperoncinipiccanti" target="_blank" rel="noreferrer" aria-label="Facebook">
							<FacebookIcon size={18} />
						</a>
						<a href="https://www.instagram.com/peperoncinipiccanti" target="_blank" rel="noreferrer" aria-label="Instagram">
							<InstagramIcon size={18} />
						</a>
						<a href="https://www.pinterest.com/peperoncini" target="_blank" rel="noreferrer" aria-label="Pinterest">
							<PinterestIcon size={18} />
						</a>
						<a href="https://x.com/peperoncinip" target="_blank" rel="noreferrer" aria-label="X (Twitter)">
							<XIcon size={18} />
						</a>
						{/* Profilo personale (non la pagina del blog): a differenza degli
						    altri, punta a un account LinkedIn individuale, non del brand. */}
						<a
							href="https://www.linkedin.com/in/danieleibba/"
							target="_blank"
							rel="noreferrer"
							aria-label="LinkedIn"
						>
							<LinkedinIcon size={18} />
						</a>
					</div>
				</div>

				<div className="space-y-3">
					<h4 className="text-lg font-black uppercase text-white">Menu</h4>
					<ul className="space-y-2 text-sm text-white/80">
						{menu.map((item) => (
							<li key={item.href}>
								<Link href={`/${item.href.replace(/^\//, '')}`} className="hover:text-teal">
									{item.label}
								</Link>
							</li>
						))}
					</ul>
				</div>

				<div className="space-y-3">
					<h4 className="text-lg font-black uppercase text-white">Cerca</h4>
					<p className="text-sm text-white/70">
						Cerchi una ricetta o una varietà in particolare?
						<br />
						<Link href="/cerca" className="text-teal hover:text-corallo">
							Usa la ricerca
						</Link>
						.
					</p>
				</div>
			</div>

			<div className="mx-auto mt-10 flex max-w-6xl flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-5 text-xs text-white/60">
				<p>© {new Date().getFullYear()} PeperonciniPiccanti.com — Tutti i diritti riservati.</p>
				<a href="#top" className="hover:text-teal">
					Torna su ↑
				</a>
			</div>
		</footer>
	);
}
