'use client';

import { useEffect } from 'react';

/**
 * Sostituisce lo script di tracciamento del plugin "WP Most Popular", che
 * nel vecchio tema veniva iniettato da WordPress in ogni pagina singola
 * (wp_head + admin-ajax.php) — meccanismo che smette di funzionare del
 * tutto in un sito headless, perche' Next.js serve tutto il traffico reale
 * e WordPress non renderizza piu' nessuna pagina per i visitatori.
 *
 * Componente invisibile: al mount, invia un ping "fire and forget" alla
 * route interna /api/track-view (che inoltra a WordPress), una sola volta
 * per visita. Nessun rendering, nessun impatto visivo.
 */
export function ViewTracker({ postId }: { postId: number }) {
	useEffect(() => {
		fetch('/api/track-view', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ postId }),
			keepalive: true,
		}).catch(() => {
			// Il conteggio visite non e' critico per l'utente: si ignora
			// silenziosamente un eventuale fallimento della rete.
		});
	}, [postId]);

	return null;
}
