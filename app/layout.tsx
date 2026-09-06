import type { Metadata } from 'next';
import { Lato } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { JsonLd } from '@/components/JsonLd';
import { getMenu } from '@/lib/wp';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { websiteSchema } from '@/lib/schema';

// next/font scarica e auto-ospita Lato in fase di build: nessuna richiesta
// a fonts.googleapis.com a runtime, font-display "swap" automatico, zero CLS.
const lato = Lato({
	subsets: ['latin'],
	weight: ['400', '700', '900'],
	style: ['normal', 'italic'],
	variable: '--font-lato',
	display: 'swap',
});

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: {
		default: 'Peperoncini Piccanti - PeperonciniPiccanti.com',
		template: '%s · PeperonciniPiccanti.com',
	},
	description:
		'Il blog più piccante della rete con ricette, consigli, foto e un unico fil rouge: i Peperoncini Piccanti. Piccante, per passione.',
	openGraph: {
		type: 'website',
		locale: 'it_IT',
		siteName: SITE_NAME,
	},
	alternates: {
		types: {
			'application/rss+xml': `${SITE_URL}/feed.xml`,
		},
	},
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const menu = await getMenu();

	return (
		<html lang="it" className={lato.variable}>
			<body className="font-sans antialiased">
				{/* Organization + WebSite: identita' del sito valida su ogni pagina, vedi lib/schema.ts. */}
				<JsonLd data={websiteSchema()} />
				<GoogleAnalytics />
				<Header menu={menu} />
				{children}
				<Footer menu={menu} />
			</body>
		</html>
	);
}
