import Image from 'next/image';
import Link from 'next/link';
import { AboutSection } from '@/components/AboutSection';
import { HeroCarousel } from '@/components/HeroCarousel';
import { PreserveCarousel } from '@/components/PreserveCarousel';
import { RecentComments } from '@/components/RecentComments';
import { ReviewsCarousel } from '@/components/ReviewsCarousel';
import { getCategoryBySlug, getFeaturedPosts, getPostBySlug, getPosts, getRecentComments } from '@/lib/wp';

export default async function HomePage() {
	// Il carosello hero mostra gli articoli scelti a mano come "Featured" nel
	// backoffice WordPress (metabox "Featured" + ordine da "Featured Order"),
	// non semplicemente i piu' recenti — vedi getFeaturedPosts() in lib/wp.ts.
	// Il resto della home li esclude via `exclude` cosi' nessun articolo
	// compare due volte.
	const heroPosts = await getFeaturedPosts(4);
	const heroIds = heroPosts.map((p) => p.id);

	// Sezione "Peperoncini Piccanti | Le mie recensioni": nel vecchio tema
	// e' l'elenco della categoria "Varieta' di Peperoncino" (gli articoli con
	// il punteggio a cerchio), con le freccette che scorrono il widget
	// mostrando il gruppo successivo di 5 (1 grande + 4 piccoli) — non e' una
	// paginazione di pagina, resta tutto in home. Si precarica quindi un
	// blocco piu' ampio (20 = 4 "pagine" da 5) in una sola chiamata, cosi'
	// ReviewsCarousel puo' scorrere lato client senza richieste aggiuntive al
	// WordPress a ogni click sulle frecce.
	const varietaCategory = await getCategoryBySlug('varieta-peperoncino');
	const { posts: reviews } = varietaCategory
		? await getPosts({ perPage: 20, categoryId: varietaCategory.id, exclude: heroIds })
		: { posts: [] };

	const recentComments = await getRecentComments(7);

	// Banner "Vuoi imparare come coltivare in casa il peperoncino?": nel
	// vecchio tema e' una foto a tutta larghezza con overlay nero al 35% e
	// testo bianco sopra (verificato dal vivo via CSS del sito originale:
	// classe ".overlay", background-color nero, opacity 0.35) — sul sito
	// live quella specifica foto e' pero' rotta (stesso problema noto dei
	// file "full" cancellati dal server, vedi pickBestMediaUrl), quindi li'
	// si vede solo il grigio piatto dell'overlay senza immagine sotto: non e'
	// il design voluto, e' un bug preesistente.
	//
	// Si tenta prima la foto dell'articolo piu' recente della categoria
	// "Coltivare il Peperoncino" (stesso slug del menu); se quello slug non
	// corrisponde a una categoria reale o e' senza articoli con immagine (da
	// verificare quando il sito WP non e' sotto protezione traffico, per non
	// fare ulteriori richieste ora), si ripiega sulla prima foto gia' in
	// memoria dal widget "recensioni" (piante di peperoncino) — zero
	// richieste aggiuntive al WordPress, il banner non resta mai a tinta
	// unita se una foto e' comunque disponibile.
	const coltivareCategory = await getCategoryBySlug('come-coltivare-peperoncino');
	const { posts: coltivarePosts } = coltivareCategory
		? await getPosts({ perPage: 1, categoryId: coltivareCategory.id })
		: { posts: [] };
	const ctaImage = coltivarePosts[0]?.featuredImage ?? reviews[0]?.featuredImage ?? null;

	// Sezione "Come conservare i peperoncini | I metodi piu' comuni": nel
	// vecchio tema NON e' l'elenco della categoria Ricette (che li' non
	// compariva affatto in questa posizione), ma uno slider con una manciata
	// di articoli scelti a mano dall'editor — quindi si prendono per slug
	// esatto, non per categoria, con una sola serie di richieste in
	// parallelo (cache ISR come il resto del sito).
	const preserveSlugs = [
		'come-evitare-botulino-nelle-conserve',
		'congelare-peperoncini',
		'peperoncini-essiccati',
		'come-essiccare-peperoncini',
	];
	const preservePosts = (await Promise.all(preserveSlugs.map((slug) => getPostBySlug(slug)))).filter(
		(post): post is NonNullable<typeof post> => post !== null
	);

	return (
		<main id="top">
			<HeroCarousel posts={heroPosts} />

			{/*
			 * Layout 2/3 + 1/3 del vecchio tema: a sinistra il widget
			 * "Le mie recensioni" (1 post grande + 4 piccoli), a destra la
			 * sidebar "Ultimi commenti". Su mobile la sidebar scende sotto.
			 */}
			<section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<ReviewsCarousel posts={reviews} />
				</div>

				<RecentComments comments={recentComments} />
			</section>

			{/*
			 * Banner "Vuoi imparare a coltivare in casa il peperoncino?" del
			 * vecchio tema: blocco a tutta larghezza tra il widget recensioni
			 * e "Ricette piccanti", link fisso alla guida (stesso slug usato nel
			 * menu, vedi getMenu() in lib/wp.ts) — testo statico del tema, non
			 * arriva da WordPress. Foto di sfondo + overlay nero al 35%, come
			 * nel CSS originale (classe ".overlay"); bg-notte piatto resta solo
			 * come fallback se la categoria non ha ancora un articolo con foto.
			 */}
			<section className="relative overflow-hidden bg-notte py-16 text-center text-white">
				{ctaImage && (
					<>
						<Image
							src={ctaImage.url}
							alt=""
							fill
							sizes="100vw"
							className="object-cover"
						/>
						<div className="absolute inset-0 bg-black/35" aria-hidden="true" />
					</>
				)}
				<div className="relative mx-auto max-w-2xl px-4">
					<h2 className="text-2xl uppercase text-white sm:text-3xl">
						Vuoi imparare come coltivare in casa il peperoncino?
					</h2>
					<p className="mt-3 text-white/70">Segui i miei consigli. Pochi, facili ed efficaci!</p>
					<Link
						href="/come-coltivare-peperoncino"
						className="mt-7 inline-flex items-center border border-white px-6 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-white hover:text-notte"
					>
						Scopri qui come fare
					</Link>
				</div>
			</section>

			{preservePosts.length > 0 && (
				<section className="mx-auto max-w-6xl px-4 py-14">
					<PreserveCarousel posts={preservePosts} />
				</section>
			)}

			<AboutSection />
		</main>
	);
}
