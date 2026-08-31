import { HeroCarousel } from '@/components/HeroCarousel';
import { PostCard } from '@/components/PostCard';
import { RecentComments } from '@/components/RecentComments';
import { ReviewsCarousel } from '@/components/ReviewsCarousel';
import { getCategoryBySlug, getFeaturedPosts, getPosts, getRecentComments } from '@/lib/wp';

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

	const recipesCategory = await getCategoryBySlug('ricette-peperoncino-piccante');
	const { posts: recipes } = recipesCategory
		? await getPosts({ perPage: 6, categoryId: recipesCategory.id })
		: { posts: [] };

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

			{recipes.length > 0 && (
				<section className="mx-auto max-w-6xl px-4 pb-16">
					<h2 className="mb-6 text-3xl">Ricette piccanti</h2>
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{recipes.map((post) => (
							<PostCard key={post.id} post={post} />
						))}
					</div>
				</section>
			)}
		</main>
	);
}
