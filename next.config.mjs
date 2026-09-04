/** @type {import('next').NextConfig} */

// Il dominio del backend WordPress (senza protocollo), es. "cms.peperoncinipiccanti.com".
// Serve a next/image per poter ottimizzare le immagini caricate in libreria media WP.
const WP_HOSTNAME = (() => {
	try {
		return new URL(process.env.WP_API_URL ?? 'https://cms.peperoncinipiccanti.com').hostname;
	} catch {
		return 'cms.peperoncinipiccanti.com';
	}
})();

const nextConfig = {
	images: {
		// AVIF prima di WebP: nella maggior parte dei casi pesa meno a parita' di qualita'.
		formats: ['image/avif', 'image/webp'],
		// Oltre all'host "corretto" (cms.*, quello impostato in WP_API_URL), si
		// autorizza temporaneamente anche www.peperoncinipiccanti.com in http e
		// https: l'opzione "Indirizzo sito" di WordPress non e' ancora stata
		// aggiornata dopo la migrazione, quindi molti URL immagine nel database
		// (media library + <img> dentro al contenuto dei post vecchi) puntano
		// ancora li'. Da rimuovere una volta fatto il search-replace nel DB
		// WordPress (vedi nota) che sposta tutto su cms.peperoncinipiccanti.com.
		remotePatterns: [
			{
				protocol: 'https',
				hostname: WP_HOSTNAME,
				pathname: '/wp-content/uploads/**',
			},
			{
				protocol: 'https',
				hostname: 'www.peperoncinipiccanti.com',
				pathname: '/wp-content/uploads/**',
			},
			{
				protocol: 'http',
				hostname: 'www.peperoncinipiccanti.com',
				pathname: '/wp-content/uploads/**',
			},
			{
				protocol: 'https',
				hostname: 'peperoncinipiccanti.com',
				pathname: '/wp-content/uploads/**',
			},
			{
				protocol: 'http',
				hostname: 'peperoncinipiccanti.com',
				pathname: '/wp-content/uploads/**',
			},
		],
	},
	// Header di sicurezza/performance di base; il caching vero e proprio delle pagine
	// e' gestito dalla revalidation di Next (vedi lib/wp.ts e app/api/revalidate).
	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
				],
			},
		];
	},
};

export default nextConfig;
