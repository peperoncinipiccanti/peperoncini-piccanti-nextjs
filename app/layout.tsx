import type { Metadata } from 'next';
import { Lato } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getMenu } from '@/lib/wp';

// next/font scarica e auto-ospita Lato in fase di build: nessuna richiesta
// a fonts.googleapis.com a runtime, font-display "swap" automatico, zero CLS.
const lato = Lato({
	subsets: ['latin'],
	weight: ['400', '700', '900'],
	style: ['normal', 'italic'],
	variable: '--font-lato',
	display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.peperoncinipiccanti.com';

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title: {
		default: 'Peperoncini Piccanti - PeperonciniPiccanti.com',
		template: '%s · PeperonciniPiccanti.com',
	},
	description:
		'Il blog più piccante della rete con ricette, consigli, foto e un unico fil rouge: i Peperoncini Piccanti. Piccante, per passione.',
	openGraph: {
		type: 'website',
		locale: 'it_IT',
		siteName: 'PeperonciniPiccanti.com',
	},
	alternates: {
		types: {
			'application/rss+xml': `${siteUrl}/feed.xml`,
		},
	},
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const menu = await getMenu();

	return (
		<html lang="it" className={lato.variable}>
			<body className="font-sans antialiased">
				<Header menu={menu} />
				{children}
				<Footer menu={menu} />
			</body>
		</html>
	);
}
