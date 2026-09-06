import Script from 'next/script';

/**
 * Google Analytics 4 (gtag.js), inserito direttamente nel frontend Next.js.
 *
 * Prima della migrazione headless il tag veniva iniettato da Site Kit
 * dentro il tema WordPress. Ora WordPress (cms.peperoncinipiccanti.com) non
 * genera piu' le pagine che i visitatori vedono davvero — quindi un tag
 * iniettato li' non misurerebbe il traffico reale. Lo stream GA4 esistente
 * ("PeperonciniPiccanti.com - GA4", already attivo) resta lo stesso: qui lo
 * colleghiamo semplicemente al posto giusto, il sito pubblico servito da
 * Vercel.
 *
 * ID misurazione preso da Google Analytics (Amministrazione > Stream di
 * dati > PeperonciniPiccanti.com - GA4). Configurabile via env var cosi'
 * non e' hardcoded per ambienti di test/staging futuri.
 *
 * strategy="lazyOnload": il PageSpeed Insights del 6/9 segnalava gtag.js
 * come la voce singola piu' pesante di "JavaScript inutilizzato" (68,6 KiB)
 * e tra le cause dei task piu' lunghi sul thread principale — caricato con
 * "afterInteractive" competeva con l'idratazione della pagina proprio nella
 * finestra critica per LCP/TBT. "lazyOnload" lo rimanda a dopo l'evento
 * `load` del browser: le pagine viste continuano a essere tracciate
 * correttamente (l'utente e' gia' sulla pagina da un istante in piu', non
 * si perde l'evento), ma non compete piu' con il rendering iniziale.
 */
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 'G-4EH3Z47ZEM';

export function GoogleAnalytics() {
	if (!GA_MEASUREMENT_ID) return null;

	return (
		<>
			<Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="lazyOnload" />
			<Script id="ga4-init" strategy="lazyOnload">
				{`
					window.dataLayer = window.dataLayer || [];
					function gtag(){dataLayer.push(arguments);}
					gtag('js', new Date());
					gtag('config', '${GA_MEASUREMENT_ID}');
				`}
			</Script>
		</>
	);
}
