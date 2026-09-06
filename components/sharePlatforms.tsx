import { ReactNode } from 'react';
import { Mail } from 'lucide-react';
import { FacebookIcon, TelegramIcon, WhatsappIcon, XIcon } from './icons';

export type SharePlatform = {
	key: string;
	label: string;
	icon: ReactNode;
	buildUrl: (pageUrl: string, title: string) => string;
};

/**
 * Elenco dei canali di condivisione, condiviso tra ShareButtons.tsx (la
 * riga fissa in fondo all'articolo) e ShareModal.tsx (il popup aperto dal
 * badge "Share" in cima, come nel vecchio sito) — stessa lista in entrambi i
 * posti invece di due copie separate da tenere allineate.
 */
export const SHARE_PLATFORMS: SharePlatform[] = [
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

/** Apre l'URL di condivisione: mailto: nella stessa scheda, il resto in un popup. */
export function openSharePlatform(platform: SharePlatform, title: string) {
	const url = platform.buildUrl(window.location.href, title);
	if (platform.key === 'email') {
		window.location.href = url;
	} else {
		window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
	}
}
