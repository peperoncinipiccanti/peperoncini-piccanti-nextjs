import { HeroCarousel } from '@/components/HeroCarousel';
import { PostCard } from '@/components/PostCard';
import { RecentComments } from '@/components/RecentComments';
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
	// e' semplicemente l'elenco piu' recente della categoria "Varieta' di
	// Peperoncino" (gli articoli con il punteggio a cerchio), un post grande
	// in evidenza + 4 sotto. Stesso slug categoria gia' usato per il menu e
	// per l'archivio di categoria (app/[...slug]/page.tsx).
	const varietaCategory = await getCategoryBySlug('varieta-peperoncino');
	const { posts: reviews } = varietaCategory
		? await getPosts({ perPage: 5, categoryId: varietaCategory.id, exclude: heroIds })
		: { posts: [] };
	const [reviewFeatured, ...reviewRest] = reviews;

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
					<h2 className="mb-6 text-3xl">Peperoncini Piccanti | Le mie recensioni</h2>
					{reviewFeatured && (
						<div className="mb-6">
							<PostCard post={reviewFeatured} size="large" priority />
						</div>
					)}
					{/*
					 * 2 per riga anche da lg in su: essendo questa colonna solo
					 * 2/3 della larghezza pagina, 4 per riga (come nella griglia
					 * "Ricette piccanti" sotto, che occupa tutta la larghezza)
					 * rendeva le card troppo strette — titolo sovrapposto e foto
					 * schiacciata.
					 */}
					<div className="grid grid-cols-2 gap-6">
						{reviewRest.map((post) => (
							<PostCard key={post.id} post={post} />
						))}
					</div>
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
