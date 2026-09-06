'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { SHARE_PLATFORMS, openSharePlatform } from './sharePlatforms';
import { useArticleReactions } from './ArticleReactionsProvider';

/**
 * Pulsanti di condivisione in fondo all'articolo. L'URL condiviso e' sempre
 * `window.location.href` (letto al momento del click, non durante il
 * render: questo e' un Client Component ma viene comunque renderizzato una
 * prima volta lato server, dove `window` non esiste) — non l'URL salvato nel
 * database di WordPress (`post.link`), che punta ancora al vecchio dominio
 * finche' non si completa il cutover DNS: cosi' il link condiviso e' sempre
 * corretto, qualunque sia il dominio da cui si sta visitando la pagina in
 * quel momento (anteprima *.vercel.app inclusa).
 *
 * `trackShare()` arriva da ArticleReactionsProvider (stesso contesto usato
 * da ArticleReactions.tsx / ShareModal.tsx): aggiorna SUBITO il contatore
 * "Condivisioni" in cima alla pagina, non solo quello salvato su WordPress.
 *
 * Resta visibile in fondo ANCHE dopo l'aggiunta del popup "Share" in cima
 * (vedi ShareModal.tsx, che replica il comportamento del vecchio sito): chi
 * arriva in fondo alla lettura ha un modo di condividere senza dover
 * tornare su.
 */
export function ShareButtons({ title }: { title: string }) {
	const [copied, setCopied] = useState(false);
	const { trackShare } = useArticleReactions();

	function handlePlatformClick(platform: (typeof SHARE_PLATFORMS)[number]) {
		trackShare();
		openSharePlatform(platform, title);
	}

	async function handleCopyLink() {
		trackShare();
		try {
			await navigator.clipboard.writeText(window.location.href);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Clipboard non disponibile (permesso negato o contesto non sicuro):
			// il link resta comunque visibile e copiabile dalla barra indirizzi.
		}
	}

	return (
		<div className="my-10 border-y border-bordo py-6">
			<p className="mb-4 text-xs font-bold uppercase tracking-wide text-testo-secondario">Condividi questo articolo</p>
			<div className="flex flex-wrap gap-3">
				{SHARE_PLATFORMS.map((platform) => (
					<button
						key={platform.key}
						type="button"
						onClick={() => handlePlatformClick(platform)}
						aria-label={`Condividi su ${platform.label}`}
						className="flex h-11 w-11 items-center justify-center rounded-full bg-notte text-white transition hover:bg-teal"
					>
						{platform.icon}
					</button>
				))}
				<button
					type="button"
					onClick={handleCopyLink}
					aria-label="Copia link articolo"
					className="flex h-11 w-11 items-center justify-center rounded-full bg-notte text-white transition hover:bg-teal"
				>
					{copied ? <Check size={20} /> : <Copy size={20} />}
				</button>
			</div>
		</div>
	);
}
