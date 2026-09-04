import { NextRequest, NextResponse } from 'next/server';
import { WP_API_URL } from '@/lib/wp';

/**
 * Proxy verso la route custom del plugin companion (/pphc/v1/react), stesso
 * pattern di app/api/track-view/route.ts: il browser del visitatore chiama
 * questa route sulla stessa origin di Next.js (niente CORS da configurare
 * sul WordPress), che poi inoltra la richiesta lato server per incrementare
 * il contatore "share" o "love" dell'articolo — vedi ArticleReactions.tsx
 * (badge "Love" cliccabile) e ShareButtons.tsx (click su un pulsante di
 * condivisione).
 *
 * Non invalida la cache di Next.js ad ogni click: i contatori non sono
 * critici al secondo, si aggiornano naturalmente entro l'ora (stessa finestra
 * di revalidate usata per il resto dell'articolo, vedi lib/wp.ts) invece di
 * forzare una rigenerazione della pagina ad ogni singolo click.
 */
export async function POST(request: NextRequest) {
	let postId: number | undefined;
	let type: string | undefined;

	try {
		const body = await request.json();
		postId = typeof body?.postId === 'number' ? body.postId : undefined;
		type = typeof body?.type === 'string' ? body.type : undefined;
	} catch {
		// corpo assente o non JSON
	}

	if (!postId || (type !== 'share' && type !== 'love')) {
		return NextResponse.json({ error: 'Richiesta non valida.' }, { status: 400 });
	}

	try {
		const res = await fetch(`${WP_API_URL}/wp-json/pphc/v1/react`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ postId, type }),
			cache: 'no-store',
		});

		if (!res.ok) {
			return NextResponse.json({ error: 'Impossibile registrare la reazione.' }, { status: res.status });
		}

		const data = await res.json();
		return NextResponse.json(data);
	} catch {
		return NextResponse.json({ error: 'WordPress non raggiungibile, riprova tra poco.' }, { status: 502 });
	}
}
