import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArticleContent } from '@/components/ArticleContent';
import { ArticleReactions } from '@/components/ArticleReactions';
import { ArticleReactionsProvider } from '@/components/ArticleReactionsProvider';
import { PostCard } from '@/components/PostCard';
import { Pagination } from '@/components/Pagination';
import { RatingBadge } from '@/components/RatingBadge';
import { CommentsSection } from '@/components/CommentsSection';
import { JsonLd } from '@/components/JsonLd';
import { PopularPostsWidget } from '@/components/PopularPostsWidget';
import { PopularTagsWidget } from '@/components/PopularTagsWidget';
import { RecentComments } from '@/components/RecentComments';
import { RelatedPosts } from '@/components/RelatedPosts';
import { ReviewBreakdown } from '@/components/ReviewBreakdown';
import { ShareButtons } from '@/components/ShareButtons';
import { ViewTracker } from '@/components/ViewTracker';
import { archiveCanonical, parsePage, resolveRoute } from '@/lib/routes';
import type { Post } from '@/lib/types';
import { articleSchema, breadcrumbSchema, reviewSchema } from '@/lib/schema';
import { OG_BASE } from '@/lib/site';
import {
	getPopularPosts,
	getPopularTags,
	getPostComments,
	getPosts,
	getRecentComments,
	getRelatedPosts,
} from '@/lib/wp';

type Props = {
	params: Promise<{ slug: string[] }>;
	searchParams: Promise<{ pagina?: string }>;
};

/**
 * Route "catch-all": articoli (/trinidad-scorpion), categorie anche annidate
 * (/varieta-peperoncino/peperoncini-piu-piccanti-al-mondo) e tag
 * (/tag/salse), con gli stessi percorsi del vecchio sito WordPress.
 *
 * Ogni contenuto ha un solo indirizzo valido, deciso da resolveRoute() in
 * lib/routes.ts: le varianti note (maiuscole, sottocategoria senza
 * genitore, vecchi permalink con la data) ricevono un redirect permanente,
 * qualsiasi altro percorso un 404. Lo stesso indirizzo finisce nel tag
 * canonical, nella sitemap e nel breadcrumb.
 */
function joinSlug(slug: string[]) {
	return slug.join('/');
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
	const { slug } = await params;
	const route = await resolveRoute(joinSlug(slug));

	if (route.kind === 'post') {
		const { post, path } = route;
		const description = post.excerpt.replace(/<[^>]+>/g, '').trim().slice(0, 160);
		return {
			title: post.title,
			description,
			alternates: { canonical: path },
			openGraph: {
				...OG_BASE,
				type: 'article',
				url: path,
				title: post.title,
				description,
				images: post.featuredImage ? [{ url: post.featuredImage.url }] : undefined,
			},
		};
	}

	if (route.kind === 'category' || route.kind === 'tag') {
		const term = route.kind === 'category' ? route.category : route.tag;
		// searchParams si legge solo qui, negli archivi: vedi il commento in
		// CatchAllPage sul perche' gli articoli non devono mai toccarlo.
		const { pagina } = await searchParams;
		const canonical = archiveCanonical(route.path, parsePage(pagina));
		return {
			title: term.name,
			description: term.description || undefined,
			alternates: { canonical },
			openGraph: { ...OG_BASE, type: 'website', url: canonical, title: term.name },
		};
	}

	// Redirect e 404: la pagina non viene mai mostrata, nessun metadata da aggiungere.
	return {};
}

export default async function CatchAllPage({ params, searchParams }: Props) {
	// `searchParams` si legge SOLO nei rami categoria/tag qui sotto (dove
	// serve davvero, per la paginazione `?pagina=`) e mai prima. In Next.js,
	// leggere searchParams (o cookies()/headers()) durante il render rende
	// l'intera route "dinamica": se lo si faceva incondizionatamente qui in
	// cima, anche gli articoli — che non usano affatto la paginazione —
	// finivano per non essere mai serviti dalla cache Vercel (verificato dal
	// vivo: header `x-vercel-cache: MISS` e `cache-control: no-store` su
	// OGNI richiesta, anche ripetuta sulla stessa pagina). Ogni visita reale
	// rieseguiva quindi da zero la funzione serverless: e' la causa piu'
	// probabile dell'LCP scadente segnalato da Search Console sulle pagine
	// articolo a basso traffico (poche visite reali, ma quelle poche cadono
	// spesso su un cold start). Rimandando la lettura qui sotto, gli
	// articoli tornano cacheable via ISR (revalidate: 3600 in lib/wp.ts +
	// revalidazione mirata via webhook, vedi app/api/revalidate/route.ts).
	const { slug } = await params;
	const route = await resolveRoute(joinSlug(slug));

	switch (route.kind) {
		case 'redirect':
			// 308 permanente: per Google equivale a un 301.
			return permanentRedirect(route.to);
		case 'notFound':
			return notFound();
		case 'post':
			return PostView({ post: route.post, path: route.path });
		case 'category':
		case 'tag': {
			// Stesso layout 2/3 + 1/3 per categorie e tag (/tag/nome-tag nel vecchio tema).
			const term = route.kind === 'category' ? route.category : route.tag;
			const { pagina } = await searchParams;
			return ArchiveView({
				title: term.name,
				description: term.description || undefined,
				postsQuery: route.kind === 'category' ? { categoryId: term.id } : { tagId: term.id },
				page: parsePage(pagina),
				basePath: route.path,
			});
		}
	}
}

/**
 * Layout comune alle pagine archivio (categorie e tag): griglia 2/3 (2
 * articoli per riga) + sidebar 1/3 col widget "post più visti", come nel
 * vecchio tema Edition. Estratta in una funzione condivisa per non
 * duplicare lo stesso JSX tra i due rami (categoria/tag) di CatchAllPage.
 */
async function ArchiveView({
	title,
	description,
	postsQuery,
	page,
	basePath,
}: {
	title: string;
	description?: string;
	postsQuery: { categoryId?: number; tagId?: number };
	page: number;
	basePath: string;
}) {
	// getPosts, getPopularPosts, getRecentComments e getPopularTags sono
	// indipendenti: si eseguono insieme invece che in sequenza per non
	// sommare i tempi di risposta. perPage: 8, non 9 — la griglia e' a 2
	// colonne, 8 riempie esattamente 4 righe complete invece di lasciare
	// un'ultima card spaiata da sola.
	const [postsResult, popular, recentComments, popularTags] = await Promise.all([
		// Oltre l'ultima pagina WordPress risponde 400 (rest_post_invalid_page_number)
		// e getPosts() lancia un errore: prima diventava un 500, ora e' un 404.
		// Sulla prima pagina invece un errore e' un problema vero e resta tale.
		getPosts({ ...postsQuery, page, perPage: 8 }).catch((error: unknown) => {
			if (page > 1) return null;
			throw error;
		}),
		getPopularPosts(5),
		getRecentComments(7),
		getPopularTags(12),
	]);

	if (!postsResult || postsResult.posts.length === 0) notFound();
	const { posts, totalPages } = postsResult;

	return (
		<main className="mx-auto max-w-6xl px-4 py-14">
			<JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: title, path: basePath }])} />
			<h1 className="text-3xl">{title}</h1>
			{description && <p className="mt-2 max-w-2xl text-testo-secondario">{description}</p>}

			<div className="mt-8 grid gap-10 lg:grid-cols-3">
				<div className="lg:col-span-2">
					{/*
					 * 1 colonna sotto "sm", 2 da "sm" in su, dentro la colonna
					 * 2/3 della griglia (lg:col-span-2, max-w-6xl): da lg in su
					 * la card e' quindi meta' di ~2/3 pagina (~320px), non
					 * meta'/intero viewport come nel default di PostCard.
					 */}
					<div className="grid gap-6 sm:grid-cols-2">
						{posts.map((p) => (
							<PostCard
								key={p.id}
								post={p}
								sizes="(min-width: 1024px) 320px, (min-width: 640px) calc(50vw - 28px), calc(100vw - 32px)"
							/>
						))}
					</div>

					<Pagination currentPage={page} totalPages={totalPages} basePath={basePath} />
				</div>

				<div className="flex flex-col gap-10">
					<PopularPostsWidget weekly={popular.weekly} monthly={popular.monthly} allTime={popular.all_time} />
					<RecentComments comments={recentComments} />
					<PopularTagsWidget tags={popularTags} />
				</div>
			</div>
		</main>
	);
}

async function PostView({ post, path: postPath }: { post: Post; path: string }) {
	const formattedDate = new Date(post.date).toLocaleDateString('it-IT', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});

	// Indipendenti tra loro: si eseguono insieme invece che in sequenza per
	// non sommare i tempi di risposta (stesso pattern di ArchiveView sopra).
	const [recentComments, popularTags, relatedPosts, postComments] = await Promise.all([
		getRecentComments(7),
		getPopularTags(12),
		getRelatedPosts(post, 3),
		getPostComments(post.id),
	]);

	// postPath arriva da resolveRoute(): e' sempre `/<slug>`, lo stesso
	// indirizzo dichiarato come canonical in generateMetadata.
	const review = reviewSchema(post, postPath);

	return (
		<main>
			<JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: post.title, path: postPath }])} />
			<JsonLd data={articleSchema(post, postPath)} />
			{review && <JsonLd data={review} />}
			<ViewTracker postId={post.id} />
			{post.featuredImage && (
				<div className="relative isolate aspect-[21/9] w-full overflow-hidden">
					<Image
						src={post.featuredImage.url}
						alt={post.featuredImage.alt}
						fill
						priority
						// Vedi il commento in HeroCarousel.tsx: da Next.js 16 `priority`
						// non imposta piu' da solo `fetchpriority="high"`.
						fetchPriority="high"
						sizes="100vw"
						className="object-cover"
					/>
					<RatingBadge rating={post.rating} className="absolute right-4 top-4 z-20 sm:right-8 sm:top-8" />
				</div>
			)}

			{/*
			 * Layout 2/3 + 1/3 coerente con le pagine categoria/tag: a sinistra
			 * l'articolo, a destra la sidebar "Ultimi commenti" + "Tag più
			 * utilizzati". Su mobile la sidebar scende sotto l'articolo.
			 */}
			<div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-3">
				<article className="lg:col-span-2">
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
					 * ArticleReactions (in cima) e ShareButtons (in fondo) condividono
					 * lo stato di condivisioni/love tramite questo Provider, cosi' un
					 * click sui pulsanti in fondo aggiorna subito il numero in alto —
					 * vedi ArticleReactionsProvider.tsx.
					 */}
					<ArticleReactionsProvider postId={post.id} slug={post.slug} initialShares={post.shares} initialLoves={post.loves}>
						{/*
						 * Riga orizzontale (non piu' "float-left" incolonnato a sinistra
						 * del testo): sui paragrafi brevi la vecchia colonna, piu' alta del
						 * testo, lasciava uno spazio vuoto vistoso prima del contenuto
						 * successivo. Ora e' un blocco a se' stante prima dell'inizio del
						 * testo, altezza fissa indipendente dalla lunghezza del paragrafo.
						 */}
						<div className="mb-6 mt-6">
							<ArticleReactions title={post.title} commentsCount={postComments.length} />
						</div>

						{/*
						 * Il contenuto arriva dalla WP REST API del tuo stesso sito (fonte
						 * fidata, non input di visitatori): renderlo con dangerouslySetInnerHTML
						 * e' la pratica standard per WordPress headless. Per una protezione
						 * aggiuntiva in profondita' si puo' filtrarlo con una libreria come
						 * isomorphic-dompurify prima del render.
						 *
						 * ArticleContent (client component) intercetta anche il click sulle
						 * immagini per aprirle in un overlay invece di navigare al file —
						 * vedi il commento li' dentro.
						 */}
						<ArticleContent
							html={post.content}
							className="prose prose-neutral max-w-none prose-headings:font-black prose-headings:uppercase prose-a:text-teal hover:prose-a:text-corallo prose-img:w-full"
						/>

						{/* Blocco "Recensione" col dettaglio dei Review Criteria — solo sugli articoli marcati come review, vedi ReviewBreakdown.tsx. */}
						<ReviewBreakdown post={post} />

						{/* Pulsanti di condivisione in fondo all'articolo — vedi ShareButtons.tsx. */}
						<ShareButtons title={post.title} />
					</ArticleReactionsProvider>

					{post.tags.length > 0 && (
						<ul className="mt-8 flex flex-wrap gap-2 border-t border-bordo pt-6 text-xs text-testo-secondario">
							{post.tags.map((tag) => (
								<li key={tag.id}>
									<Link href={`/tag/${tag.slug}`} className="transition hover:text-teal">
										#{tag.name}
									</Link>
								</li>
							))}
						</ul>
					)}

					{post.author?.bio && (
						<div className="mt-8 bg-sfondo-chiaro p-5">
							<p className="text-sm font-bold uppercase text-testo">{post.author.name}</p>
							<p className="mt-1 text-sm">{post.author.bio}</p>
						</div>
					)}

					<CommentsSection postId={post.id} comments={postComments} />
				</article>

				<div className="flex flex-col gap-10">
					<RecentComments comments={recentComments} />
					<PopularTagsWidget tags={popularTags} />
				</div>
			</div>

			<RelatedPosts posts={relatedPosts} />
		</main>
	);
}
