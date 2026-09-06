import Image from 'next/image';
import Link from 'next/link';
import { AboutSection } from '@/components/AboutSection';
import { HealthCarousel } from '@/components/HealthCarousel';
import { HeroCarousel } from '@/components/HeroCarousel';
import { PreserveCarousel } from '@/components/PreserveCarousel';
import { RecentComments } from '@/components/RecentComments';
import { ReviewsCarousel } from '@/components/ReviewsCarousel';
import { SocialFansCounter } from '@/components/SocialFansCounter';
import { getCategoryBySlug, getFeaturedPosts, getPosts, getRecentComments, getTagBySlug } from '@/lib/wp';
import { getSocialFanCounts } from '@/lib/social';

const NO_POSTS = { posts: [], totalPages: 1, total: 0 };

export default async function HomePage() {
	// Prima questa funzione faceva ~11 richieste a WordPress in sequenza (un
	// `await` dopo l'altro), sommando i relativi tempi di risposta — spiega
	// da solo il TTFB "sul campo" di 1,7s segnalato da PageSpeed Insights.
	// Le chiamate che non dipendono l'una dall'altra partono ora tutte
	// insieme, in due soli "giri" invece di undici.
	//
	// Primo giro: tutte richieste indipendenti (nessuna ha bisogno del
	// risultato di un'altra).
	const [heroPosts, varietaCategory, recentComments, socialCounts, coltivareCategory, conservareTag, healthTag] =
		await Promise.all([
			// Il carosello hero mostra gli articoli scelti a mano come "Featured"
			// nel backoffice WordPress (metabox "Featured" + ordine da "Featured
			// Order"), non semplicemente i piu' recenti — vedi getFeaturedPosts()
			// in lib/wp.ts.
			getFeaturedPosts(4),
			getCategoryBySlug('varieta-peperoncino'),
			getRecentComments(7),
			getSocialFanCounts(),
			getCategoryBySlug('come-coltivare-peperoncino'),
			getTagBySlug('conservare-peperoncino'),
			getTagBySlug('salute-peperoncino'),
		]);

	// Il resto della home esclude gli articoli gia' nell'hero via `exclude`,
	// cosi' nessun articolo compare due volte — per questo il secondo giro
	// deve aspettare heroIds (e le categorie/tag) del primo.
	const heroIds = heroPosts.map((p) => p.id);

	// Secondo giro: dipende dagli id trovati sopra, ma le quattro chiamate
	// sono indipendenti tra loro, quindi partono anch'esse insieme.
	const [reviewsResult, coltivareResult, preserveResult, healthResult] = await Promise.all([
		// Sezione "Peperoncini Piccanti | Le mie recensioni": nel vecchio tema
		// e' l'elenco della categoria "Varieta' di Peperoncino" (gli articoli
		// con il punteggio a cerchio), con le freccette che scorrono il widget
		// mostrando il gruppo successivo di 5 (1 grande + 4 piccoli) — non e'
		// una paginazione di pagina, resta tutto in home. Si precarica quindi
		// un blocco piu' ampio (15 = 3 "pagine" da 5) in una sola chiamata,
		// cosi' ReviewsCarousel puo' scorrere lato client senza richieste
		// aggiuntive al WordPress a ogni click sulle frecce. Era 20 (4
		// pagine): con l'embed completo di 20 post la risposta superava i 2MB
		// e Next.js smetteva di metterla in cache (vedi anche il
		// fields-trimming in getPosts()), 15 resta abbondantemente sotto quel
		// limite mantenendo comunque 3 pagine di contenuti da scorrere.
		varietaCategory
			? getPosts({ perPage: 15, categoryId: varietaCategory.id, exclude: heroIds })
			: Promise.resolve(NO_POSTS),
		// Foto del banner "Vuoi imparare come coltivare in casa il
		// peperoncino?" sotto: si tenta prima l'articolo piu' recente di
		// questa categoria (stesso slug del menu).
		coltivareCategory ? getPosts({ perPage: 1, categoryId: coltivareCategory.id }) : Promise.resolve(NO_POSTS),
		// Sezione "Come conservare i peperoncini | I metodi piu' comuni":
		// tutti gli articoli con il tag "conservare", non una manciata di
		// slug scelti a mano — cosi' un nuovo articolo con quel tag compare
		// qui automaticamente, senza dover toccare il codice ogni volta.
		conservareTag ? getPosts({ perPage: 20, tagId: conservareTag.id }) : Promise.resolve(NO_POSTS),
		// Blocco sidebar "Peperoncino e Salute": stesso pattern per tag di
		// sopra, ma renderizzato da HealthCarousel (una sola card alla volta,
		// che scorre da sola) invece che in griglia — vedi il commento li'
		// dentro.
		healthTag ? getPosts({ perPage: 20, tagId: healthTag.id }) : Promise.resolve(NO_POSTS),
	]);

	const reviews = reviewsResult.posts;
	const coltivarePosts = coltivareResult.posts;
	const preservePosts = preserveResult.posts;
	const healthPosts = healthResult.posts;

	// Banner "Vuoi imparare come coltivare in casa il peperoncino?": nel
	// vecchio tema e' una foto a tutta larghezza con overlay nero al 35% e
	// testo bianco sopra (verificato dal vivo via CSS del sito originale:
	// classe ".overlay", background-color nero, opacity 0.35) — sul sito
	// live quella specifica foto e' pero' rotta (stesso problema noto dei
	// file "full" cancellati dal server, vedi pickBestMediaUrl), quindi li'
	// si vede solo il grigio piatto dell'overlay senza immagine sotto: non e'
	// il design voluto, e' un bug preesistente.
	//
	// Se la categoria "Coltivare il Peperoncino" non corrisponde a nulla o
	// non ha articoli con immagine, si ripiega sulla prima foto gia' in
	// memoria dal widget "recensioni" (piante di peperoncino) — zero
	// richieste aggiuntive al WordPress, il banner non resta mai a tinta
	// unita se una foto e' comunque disponibile.
	const ctaImage = coltivarePosts[0]?.featuredImage ?? reviews[0]?.featuredImage ?? null;

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

				<div>
					<SocialFansCounter counts={socialCounts} />
					<HealthCarousel posts={healthPosts} />
					<RecentComments comments={recentComments} />
				</div>
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
