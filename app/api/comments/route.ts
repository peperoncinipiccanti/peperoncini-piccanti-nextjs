import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { WP_API_URL } from '@/lib/wp';

/**
 * Proxy verso l'endpoint core di WordPress /wp/v2/comments (stesso pattern
 * di app/api/track-view/route.ts): il browser del visitatore invia il nuovo
 * commento a questa route, sulla stessa origin di Next.js, che lo inoltra
 * lato server a WordPress. Evita di dover configurare CORS sul WordPress per
 * accettare richieste dirette dal dominio del frontend.
 *
 * WordPress crea il commento con stato "in attesa di approvazione" a meno
 * che l'autore non abbia gia' un commento approvato in precedenza con la
 * stessa email — per garantire che DAVVERO ogni commento richieda
 * approvazione manuale (come richiesto), va spuntata l'opzione "Il commento
 * deve essere approvato manualmente" in Impostazioni > Discussione su
 * wp-admin: senza quella spunta, un commentatore "di fiducia" verrebbe
 * pubblicato subito.
 *
 * Anti-spam minimo: un campo honeypot ("sito_web" nel form, mai mostrato a
 * un utente reale via CSS) — se arriva compilato si scarta la richiesta
 * senza nemmeno interpellare WordPress. Si aggiunge ai controlli anti-flood
 * e anti-duplicato gia' nativi di WordPress.
 */
export async function POST(request: NextRequest) {
	let body: {
		postId?: number;
		authorName?: string;
		authorEmail?: string;
		content?: string;
		website?: string; // honeypot
	};

	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: 'Richiesta non valida.' }, { status: 400 });
	}

	const { postId, authorName, authorEmail, content, website } = body;

	// Honeypot compilato: quasi certamente un bot. Si finge un successo per
	// non dargli indizi su come aggirare il controllo.
	if (website) {
		return NextResponse.json({ status: 'hold' });
	}

	if (!postId || !authorName?.trim() || !authorEmail?.trim() || !content?.trim()) {
		return NextResponse.json({ error: 'Compila nome, email e commento.' }, { status: 400 });
	}

	try {
		const res = await fetch(`${WP_API_URL}/wp-json/wp/v2/comments`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				post: postId,
				author_name: authorName.trim(),
				author_email: authorEmail.trim(),
				content: content.trim(),
			}),
			cache: 'no-store',
		});

		const data = await res.json();

		if (!res.ok) {
			// rest_comment_duplicate / rest_comment_flooding ecc: il messaggio di
			// WordPress e' gia' in italiano se il sito e' in italiano, quindi si
			// puo' mostrare direttamente all'utente.
			return NextResponse.json({ error: data?.message ?? 'Impossibile inviare il commento.' }, { status: res.status });
		}

		// Se per qualche motivo il commento arriva gia' approvato (es. autore di
		// fiducia, vedi commento sopra) si invalida subito la cache di questo
		// articolo cosi' compare senza aspettare la finestra di revalidate di
		// 60s impostata in getPostComments(). Se resta "in attesa" non serve:
		// non e' comunque visibile finche' non viene approvato in wp-admin.
		if (data?.status === 'approved' && postId) {
			revalidateTag(`comments:${postId}`, 'max');
		}

		return NextResponse.json({ status: data?.status ?? 'hold' });
	} catch {
		return NextResponse.json({ error: 'WordPress non raggiungibile, riprova tra poco.' }, { status: 502 });
	}
}
