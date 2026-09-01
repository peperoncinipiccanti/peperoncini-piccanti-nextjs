import { NextRequest, NextResponse } from 'next/server';

const WP_API_URL = (process.env.WP_API_URL ?? 'https://cms.peperoncinipiccanti.com').replace(/\/+$/, '');

/**
 * Proxy verso la route custom del plugin companion (/pphc/v1/track-view),
 * chiamata dal componente client ViewTracker a ogni visita reale di un
 * articolo. Serve solo per evitare di configurare CORS sul WordPress (stesso
 * pattern gia' usato in senso opposto da /api/revalidate): il browser
 * dell'utente chiama questa route sulla stessa origin di Next.js, che poi
 * inoltra la richiesta al WordPress lato server.
 *
 * Fire-and-forget: eventuali errori (WordPress irraggiungibile, plugin non
 * ancora aggiornato) non devono mai rompere la pagina per il visitatore,
 * quindi si ritorna sempre 200 anche se il tracciamento a monte fallisce.
 */
export async function POST(request: NextRequest) {
	let postId: number | undefined;
	try {
		const body = await request.json();
		postId = typeof body?.postId === 'number' ? body.postId : undefined;
	} catch {
		// corpo assente o non JSON
	}

	if (!postId) {
		return NextResponse.json({ tracked: false }, { status: 400 });
	}

	try {
		await fetch(`${WP_API_URL}/wp-json/pphc/v1/track-view`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ postId }),
			// Non serve cache ne' attesa lunga: e' un ping di tracciamento.
			cache: 'no-store',
		});
	} catch {
		// Il WordPress puo' essere lento/irraggiungibile: non e' un problema
		// del visitatore, si ignora e si risponde comunque ok.
	}

	return NextResponse.json({ tracked: true });
}
