'use client';

import { useEffect } from 'react';
import { X, Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { SHARE_PLATFORMS, openSharePlatform } from './sharePlatforms';

/**
 * Popup "Share" aperto dal badge in cima all'articolo (vedi
 * ArticleReactions.tsx), che replica il comportamento del vecchio sito: al
 * click sul badge il contatore condivisioni sale subito di 1 (gestito dal
 * chiamante tramite trackShare(), non qui dentro — questo componente si
 * limita a mostrare la scelta del canale, niente incremento aggiuntivo
 * quando si clicca un canale, altrimenti si conterebbe due volte lo stesso
 * click), poi l'utente sceglie su quale canale condividere davvero.
 *
 * Stessi canali della riga fissa in fondo all'articolo (SHARE_PLATFORMS,
 * vedi sharePlatforms.tsx) — Daniele ha confermato che vanno bene quelli.
 */
export function ShareModal({ title, onClose }: { title: string; onClose: () => void }) {
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') onClose();
		}
		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [onClose]);

	async function handleCopyLink() {
		try {
			await navigator.clipboard.writeText(window.location.href);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Clipboard non disponibile: il link resta comunque nella barra indirizzi.
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-notte/70 p-4"
			role="dialog"
			aria-modal="true"
			aria-label="Condividi questo articolo"
			onClick={onClose}
		>
			<div
				className="relative w-full max-w-md bg-base p-8 text-center shadow-xl"
				onClick={(event) => event.stopPropagation()}
			>
				<button
					type="button"
					onClick={onClose}
					aria-label="Chiudi"
					className="absolute right-4 top-4 text-testo-secondario transition hover:text-testo"
				>
					<X size={22} />
				</button>

				<p className="mb-2 text-xs font-bold uppercase tracking-widest text-teal">Share</p>
				<h2 className="mb-6 text-2xl">{title}</h2>

				<div className="flex flex-wrap justify-center gap-3">
					{SHARE_PLATFORMS.map((platform) => (
						<button
							key={platform.key}
							type="button"
							onClick={() => openSharePlatform(platform, title)}
							aria-label={`Condividi su ${platform.label}`}
							className="flex h-12 w-12 items-center justify-center rounded-full bg-notte text-white transition hover:bg-teal"
						>
							{platform.icon}
						</button>
					))}
					<button
						type="button"
						onClick={handleCopyLink}
						aria-label="Copia link articolo"
						className="flex h-12 w-12 items-center justify-center rounded-full bg-notte text-white transition hover:bg-teal"
					>
						{copied ? <Check size={20} /> : <Copy size={20} />}
					</button>
				</div>
			</div>
		</div>
	);
}
