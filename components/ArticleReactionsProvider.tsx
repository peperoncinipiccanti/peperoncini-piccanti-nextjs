'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

type ReactionsContextValue = {
	shares: number;
	loves: number;
	loved: boolean;
	/** Chiamata da ShareButtons.tsx ad ogni click su un pulsante di condivisione. */
	trackShare: () => void;
	/** Chiamata dal badge "Love" di ArticleReactions.tsx. */
	toggleLove: () => void;
};

const ReactionsContext = createContext<ReactionsContextValue | null>(null);

/**
 * Stato condiviso tra ArticleReactions.tsx (i 3 badge in cima all'articolo)
 * e ShareButtons.tsx (i pulsanti di condivisione in fondo): senza un
 * genitore comune che tenga lo stato, il badge "Condivisioni" in alto
 * restava fermo al valore calcolato al caricamento della pagina anche dopo
 * un click sui pulsanti in fondo — bug segnalato da Daniele dopo un test con
 * WhatsApp. Con questo Provider, invece, un click su un pulsante di
 * condivisione aggiorna SUBITO il numero in alto, senza aspettare un
 * ricaricamento della pagina.
 *
 * Avvolge lato server (in PostView, app/[...slug]/page.tsx) tutto il blocco
 * tra i contatori e i pulsanti di condivisione, contenuto dell'articolo
 * compreso: un Client Component puo' ricevere JSX gia' renderizzato da un
 * Server Component come `children` senza doverlo "client-izzare" anche lui.
 */
export function ArticleReactionsProvider({
	postId,
	initialShares,
	initialLoves,
	children,
}: {
	postId: number;
	initialShares: number;
	initialLoves: number;
	children: ReactNode;
}) {
	const [shares, setShares] = useState(initialShares);
	const [loves, setLoves] = useState(initialLoves);
	const [loved, setLoved] = useState(false);

	useEffect(() => {
		setLoved(localStorage.getItem(`pphc_loved_${postId}`) === '1');
	}, [postId]);

	async function sendReaction(type: 'share' | 'love') {
		try {
			const res = await fetch('/api/react', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ postId, type }),
				keepalive: true,
			});
			const data = await res.json();
			if (res.ok && typeof data?.count === 'number') {
				if (type === 'share') setShares(data.count);
				else setLoves(data.count);
			}
		} catch {
			// WordPress irraggiungibile o plugin non ancora aggiornato: il
			// conteggio ottimistico locale resta comunque visibile per questa
			// visita, e torna corretto al prossimo caricamento della pagina.
		}
	}

	function trackShare() {
		setShares((n) => n + 1); // ottimistico, corretto subito dopo dal valore reale di WordPress
		sendReaction('share');
	}

	function toggleLove() {
		if (loved) return; // un voto per browser, vedi commento sopra su localStorage
		setLoved(true);
		setLoves((n) => n + 1);
		localStorage.setItem(`pphc_loved_${postId}`, '1');
		sendReaction('love');
	}

	return (
		<ReactionsContext.Provider value={{ shares, loves, loved, trackShare, toggleLove }}>
			{children}
		</ReactionsContext.Provider>
	);
}

export function useArticleReactions() {
	const ctx = useContext(ReactionsContext);
	if (!ctx) {
		throw new Error('ArticleReactions e ShareButtons vanno usati dentro <ArticleReactionsProvider>.');
	}
	return ctx;
}
