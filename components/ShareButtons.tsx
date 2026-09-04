'use client';

import { ReactNode, useState } from 'react';
import { Check, Copy, Mail } from 'lucide-react';
import { FacebookIcon, TelegramIcon, WhatsappIcon, XIcon } from './icons';

type Platform = {
	key: string;
	label: string;
	icon: ReactNode;
	buildUrl: (pageUrl: string, title: string) => string;
};

const PLATFORMS: Platform[] = [
	{
		key: 'facebook',
		label: 'Facebook',
		icon: <FacebookIcon size={20} />,
		buildUrl: (pageUrl) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
	},
	{
		key: 'whatsapp',
		label: 'WhatsApp',
		icon: <WhatsappIcon size={20} />,
		buildUrl: (pageUrl, title) => `https://wa.me/?text=${encodeURIComponent(`${title} ${pageUrl}`)}`,
	},
	{
		key: 'x',
		label: 'X',
		icon: <XIcon size={20} />,
		buildUrl: (pageUrl, title) =>
			`https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(title)}`,
	},
	{
		key: 'telegram',
		label: 'Telegram',
		icon: <TelegramIcon size={20} />,
		buildUrl: (pageUrl, title) =>
			`https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(title)}`,
	},
	{
		key: 'email',
		label: 'Email',
		icon: <Mail size={20} />,
		buildUrl: (pageUrl, title) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(pageUrl)}`,
	},
];

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
 * Ogni click (comprese "copia link") registra +1 sul contatore "Condivisioni"
 * mostrato in cima all'articolo (vedi ArticleReactions.tsx) tramite
 * /api/react — fire-and-forget, un eventuale errore di rete non deve mai
 * impedire la condivisione vera e propria.
 */
export function ShareButtons({ postId, title }: { postId: number; title: string }) {
	const [copied, setCopied] = useState(false);

	function trackShare() {
		fetch('/api/react', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ postId, type: 'share' }),
			keepalive: true,
		}).catch(() => {
			// Il conteggio non e' critico per l'utente: si ignora un eventuale fallimento di rete.
		});
	}

	function handlePlatformClick(platform: Platform) {
		trackShare();
		const url = platform.buildUrl(window.location.href, title);
		if (platform.key === 'email') {
			window.location.href = url;
		} else {
			window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
		}
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
				{PLATFORMS.map((platform) => (
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
