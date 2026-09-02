'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

/**
 * Il contenuto degli articoli arriva da WordPress spesso con le immagini
 * avvolte in un link diretto al file (comportamento classico dell'editor
 * classico/Gutenberg quando "Link a" e' impostato su "File multimediale"):
 * cliccandoci sopra il browser apriva/scaricava la foto a piena risoluzione
 * invece di ingrandirla senza lasciare la pagina.
 *
 * E' un client component solo per questo: intercetta il click sulle
 * immagini del contenuto (dangerouslySetInnerHTML non permette handler React
 * sui singoli tag), blocca la navigazione quando sono avvolte in un <a>, e
 * apre un overlay a schermo intero con la foto e una X per chiudere — si
 * chiude anche cliccando fuori dalla foto o con Esc.
 */
export function ArticleContent({ html, className }: { html: string; className: string }) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		function handleClick(event: MouseEvent) {
			const target = event.target as HTMLElement;
			const img = target.closest('img');
			if (!img) return;

			// Se l'immagine e' avvolta in un link (il caso tipico da correggere),
			// si blocca la navigazione verso il file; altrimenti si intercetta
			// comunque il click sull'immagine stessa.
			const link = target.closest('a');
			if (link) {
				event.preventDefault();
			}

			const src = link?.getAttribute('href') || img.getAttribute('src');
			if (src) {
				setLightboxSrc(src);
			}
		}

		container.addEventListener('click', handleClick);
		return () => container.removeEventListener('click', handleClick);
	}, []);

	useEffect(() => {
		if (!lightboxSrc) return;

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') setLightboxSrc(null);
		}

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [lightboxSrc]);

	return (
		<>
			<div ref={containerRef} className={`${className} prose-img:cursor-zoom-in`} dangerouslySetInnerHTML={{ __html: html }} />

			{lightboxSrc && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-notte/95 p-4 sm:p-10"
					onClick={() => setLightboxSrc(null)}
					role="dialog"
					aria-modal="true"
					aria-label="Immagine ingrandita"
				>
					<button
						type="button"
						onClick={() => setLightboxSrc(null)}
						aria-label="Chiudi"
						className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center text-white transition hover:text-corallo"
					>
						<X size={28} />
					</button>

					<div className="relative h-full w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
						<Image src={lightboxSrc} alt="" fill sizes="90vw" className="object-contain" />
					</div>
				</div>
			)}
		</>
	);
}
