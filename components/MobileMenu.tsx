'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

type MenuItem = { label: string; href: string };

/**
 * Su mobile le voci di menu per esteso non ci stanno in larghezza (o vanno
 * a capo rompendo l'header): sotto il breakpoint "sm" si nasconde la <nav>
 * orizzontale (vedi Header.tsx, classe "hidden sm:block") e si mostra
 * invece questo pulsante hamburger, che apre un pannello a tendina con le
 * stesse voci in verticale. Da tablet/desktop in su non renderizza nulla
 * (sia il pulsante che il pannello hanno "sm:hidden").
 *
 * Il pannello e' "position: absolute", non in flusso: si aggancia al primo
 * antenato posizionato, che e' la riga dell'header in Header.tsx (classe
 * "relative"), non a questo piccolo pulsante — cosi' copre l'intera
 * larghezza dell'header (da sotto il logo a sotto l'icona di ricerca)
 * invece di uno stretto riquadro sotto il solo pulsante, e non sposta il
 * resto del layout quando si apre/chiude.
 */
export function MobileMenu({ menu }: { menu: MenuItem[] }) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				aria-controls="mobile-menu-panel"
				aria-label={open ? 'Chiudi menu' : 'Apri menu'}
				className="flex h-9 w-9 items-center justify-center text-testo sm:hidden"
			>
				{open ? <X size={22} /> : <Menu size={22} />}
			</button>

			{open && (
				<nav
					id="mobile-menu-panel"
					aria-label="Menu principale"
					className="absolute inset-x-0 top-full z-30 border-t border-bordo bg-base px-4 py-4 shadow-lg sm:hidden"
				>
					<ul className="flex flex-col gap-1 text-sm font-bold uppercase tracking-wide">
						{menu.map((item) => (
							<li key={item.href}>
								<Link
									href={`/${item.href.replace(/^\//, '')}`}
									onClick={() => setOpen(false)}
									className="block py-2 text-testo hover:text-corallo"
								>
									{item.label}
								</Link>
							</li>
						))}
					</ul>
				</nav>
			)}
		</>
	);
}
