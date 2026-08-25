import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/PostCard';
import { Pagination } from '@/components/Pagination';
import { RatingBadge } from '@/components/RatingBadge';
import { getCategoryBySlug, getPostBySlug, getPosts } from '@/lib/wp';

type Props = {
	params: Promise<{ slug: string[] }>;
	searchParams: Promise<{ pagina?: string }>;
};

/**
 * Route "catch-all": risolve sia gli articoli (/trinidad-scorpion/) sia le
 * categorie, anche annidate (/varieta-peperoncino/peperoncini-piu-piccanti-al-mondo/),
 * cosi' gli URL restano identici a quelli del sito attuale — nessun redirect,
 * nessuna perdita di posizionamento SEO.
 *
 * La corrispondenza avviene sull'ultimo segmento del percorso: gli articoli
 * di questo sito hanno slug piatti e univoci, e lo slug di una categoria
 * WordPress non include i segmenti dei genitori. Per una validazione piu'
 * rigorosa dell'intero percorso gerarchico (utile se in futuro due categorie
 * di genitori diversi condividessero lo stesso slug figlio) si puo' estendere
 * questa funzione confrontando anche `category.parent`.
 */
function lastSegment(slug: string[]) {
	return slug[slug.length - 1] ?? '';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const post = await getPostBySlug(lastSegment(slug));

	if (post) {
		const description = post.excerpt.replace(/<[^>]+>/g, '').trim().slice(0, 160);
		return {
			title: post.title,
			description,
			openGraph: {
				type: 'article',
				title: post.title,
				description,
				images: post.featuredImage ? [{ url: post.featuredImage.url }] : undefined,
			},
		};
	}

	const category = await getCategoryBySlug(lastSegment(slug));
	if (category) {
		return { title: category.name, description: category.description || undefined };
	}

	return {};
}

export default async function CatchAllPage({ params, searchParams }: Props) {
	const { slug } = await params;
	const { pagina } = await searchParams;
	const target = lastSegment(slug);

	const post = await getPostBySlug(target);
	if (post) {
		return <PostView post={post} />;
	}

	const category = await getCategoryBySlug(target);
	if (category) {
		const page = Math.max(1, Number(pagina) || 1);
		const { posts, totalPages } = await getPosts({ categoryId: category.id, page, perPage: 9 });

		if (posts.length === 0 && page === 1) notFound();

		return (
			<main className="mx-auto max-w-6xl px-4 py-14">
				<h1 className="text-3xl">{category.name}</h1>
				{category.description && <p className="mt-2 max-w-2xl text-testo-secondario">{category.description}</p>}

				<div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{posts.map((p) => (
						<PostCard key={p.id} post={p} />
					))}
				</div>

				<Pagination currentPage={page} totalPages={totalPages} basePath={`/${slug.join('/')}`} />
			</main>
		);
	}

	notFound();
}

function PostView({ post }: { post: Awaited<ReturnType<typeof getPostBySlug>> }) {
	if (!post) return null;

	const formattedDate = new Date(post.date).toLocaleDateString('it-IT', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});

	return (
		<main>
			{post.featuredImage && (
				<div className="relative isolate aspect-[21/9] w-full overflow-hidden">
					<Image
						src={post.featuredImage.url}
						alt={post.featuredImage.alt}
						fill
						priority
						sizes="100vw"
						className="object-cover"
					/>
					<RatingBadge rating={post.rating} className="absolute right-4 top-4 z-20 sm:right-8 sm:top-8" />
				</div>
			)}

			<article className="mx-auto max-w-3xl px-4 py-10">
				{post.categories.length > 0 && (
					<ul className="mb-3 flex flex-wrap gap-1.5">
						{post.categories.map((cat, i) => (
							<li
								key={cat.id}
								className={`px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-white ${
									i % 2 === 0 ? 'bg-corallo' : 'bg-notte'
								}`}
							>
								{cat.name}
							</li>
						))}
					</ul>
				)}

				<h1 className="text-4xl">{post.title}</h1>

				<div className="mt-3 flex flex-wrap gap-3 text-sm text-testo-secondario">
					{post.author && <span>{post.author.name}</span>}
					<time dateTime={post.date}>{formattedDate}</time>
				</div>

				{/*
				 * Il contenuto arriva dalla WP REST API del tuo stesso sito (fonte
				 * fidata, non input di visitatori): renderlo con dangerouslySetInnerHTML
				 * e' la pratica standard per WordPress headless. Per una protezione
				 * aggiuntiva in profondita' si puo' filtrarlo con una libreria come
				 * isomorphic-dompurify prima del render.
				 */}
				<div
					className="prose prose-neutral mt-8 max-w-none prose-headings:font-black prose-headings:uppercase prose-a:text-teal hover:prose-a:text-corallo prose-img:w-full"
					dangerouslySetInnerHTML={{ __html: post.content }}
				/>

				{post.tags.length > 0 && (
					<ul className="mt-8 flex flex-wrap gap-2 border-t border-bordo pt-6 text-xs text-testo-secondario">
						{post.tags.map((tag) => (
							<li key={tag.id}>#{tag.name}</li>
						))}
					</ul>
				)}

				{post.author?.bio && (
					<div className="mt-8 bg-sfondo-chiaro p-5">
						<p className="text-sm font-bold uppercase text-testo">{post.author.name}</p>
						<p className="mt-1 text-sm">{post.author.bio}</p>
					</div>
				)}
			</article>
		</main>
	);
}
