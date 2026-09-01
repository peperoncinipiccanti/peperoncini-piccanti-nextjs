import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Webhook chiamato dal plugin WordPress companion (vedi wp-plugin/) quando
 * un articolo viene pubblicato o aggiornato: invalida la cache di Next.js
 * per quel contenuto, cosi' il sito si aggiorna in pochi secondi invece di
 * aspettare la scadenza naturale della cache (revalidate: 3600 in lib/wp.ts).
 *
 * Protetto da un token condiviso (REVALIDATE_SECRET), passato come header
 * "x-revalidate-secret" dal plugin WordPress.
 */
export async function POST(request: NextRequest) {
	const secret = request.headers.get('x-revalidate-secret');

	if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
		return NextResponse.json({ revalidated: false, message: 'Token non valido' }, { status: 401 });
	}

	let slug: string | undefined;
	try {
		const body = await request.json();
		slug = typeof body?.slug === 'string' ? body.slug : undefined;
	} catch {
		// corpo assente o non JSON: va bene, si invalida comunque la lista generale
	}

	// Da Next.js 16, revalidateTag richiede un "profilo" di cache life: "max"
	// da' semantica stale-while-revalidate (chi visita la pagina nei prossimi
	// istanti vede ancora la versione precedente mentre quella nuova viene
	// generata in background — nessuna attesa percepibile dall'utente).
	revalidateTag('posts', 'max');
	revalidateTag('categories', 'max');
	// Invalida anche il widget "post più visti": legge le foto in evidenza
	// correnti dei post, quindi va rinfrescato ad ogni salvataggio esattamente
	// come le altre liste, non solo ogni ora.
	revalidateTag('popular', 'max');
	if (slug) revalidateTag(`post:${slug}`, 'max');

	return NextResponse.json({ revalidated: true, slug: slug ?? null, now: Date.now() });
}
