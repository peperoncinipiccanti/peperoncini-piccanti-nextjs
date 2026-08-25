import { HeroCarousel } from '@/components/HeroCarousel';
import { PostCard } from '@/components/PostCard';
import { getCategoryBySlug, getPosts } from '@/lib/wp';

export default async function HomePage() {
	// I 4 piu' recenti finiscono nel carosello hero; il resto della home
	// li esclude via `exclude` cosi' nessun articolo compare due volte.
	const { posts: heroPosts } = await getPosts({ perPage: 4 });
	const heroIds = heroPosts.map((p) => p.id);

	const { posts: featured } = await getPosts({ perPage: 6, exclude: heroIds });

	const recipesCategory = await getCategoryBySlug('ricette-peperoncino-piccante');
	const { posts: recipes } = recipesCategory
		? await getPosts({ perPage: 6, categoryId: recipesCategory.id })
		: { posts: [] };

	return (
		<main id="top">
			<HeroCarousel posts={heroPosts} />

			<section className="mx-auto max-w-6xl px-4 py-14">
				<h2 className="mb-6 text-3xl">In evidenza</h2>
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{featured.map((post) => (
						<PostCard key={post.id} post={post} />
					))}
				</div>
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
