/**
 * Contatore "fan" (Facebook + Instagram) mostrato in home sopra "Ultimi
 * commenti": sostituisce il vecchio plugin WordPress "Social Fans Counter",
 * ormai obsoleto E incompatibile con un sito headless a prescindere da
 * eventuali bug — un plugin a widget non arriva mai al frontend Next.js,
 * che non esegue mai il PHP/i widget di WordPress, solo REST API.
 *
 * Legge direttamente dalla Graph API di Meta (Facebook + Instagram passano
 * dalla stessa API/app sviluppatore): una sola chiamata restituisce sia il
 * "fan_count" della Pagina sia il "followers_count" dell'account Instagram
 * Business collegato, tramite field expansion.
 *
 * Richiede due variabili d'ambiente su Vercel (vedi istruzioni fornite
 * separatamente per crearle sul portale Meta for Developers):
 *   FB_PAGE_ID           id numerico della Pagina Facebook
 *   FB_ACCESS_TOKEN      token di accesso alla Pagina (page access token)
 * Senza queste variabili (o in caso di errore/token scaduto) si ritorna
 * semplicemente due contatori nulli: il blocco in home non si mostra,
 * invece di rompere la pagina.
 */
export interface SocialCounts {
	facebook: number | null;
	instagram: number | null;
}

export async function getSocialFanCounts(): Promise<SocialCounts> {
	const empty: SocialCounts = { facebook: null, instagram: null };

	const pageId = process.env.FB_PAGE_ID;
	const token = process.env.FB_ACCESS_TOKEN;
	if (!pageId || !token) {
		return empty;
	}

	try {
		const params = new URLSearchParams({
			fields: 'fan_count,instagram_business_account{followers_count}',
			access_token: token,
		});

		const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}?${params.toString()}`, {
			// I numeri di fan/follower cambiano lentamente: 6 ore di cache
			// evitano di consumare inutilmente la quota della Graph API.
			next: { revalidate: 21600, tags: ['social'] },
		});

		if (!res.ok) {
			return empty;
		}

		const data = (await res.json()) as {
			fan_count?: number;
			instagram_business_account?: { followers_count?: number };
		};

		return {
			facebook: typeof data.fan_count === 'number' ? data.fan_count : null,
			instagram:
				typeof data.instagram_business_account?.followers_count === 'number'
					? data.instagram_business_account.followers_count
					: null,
		};
	} catch {
		return empty;
	}
}
