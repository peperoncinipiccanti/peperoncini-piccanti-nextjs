import type { Metadata } from 'next';
import { PostCard } from '@/components/PostCard';
import { Pagination } from '@/components/Pagination';
import { getPosts } from '@/lib/wp';

export const metadata: Metadata = {
	title: 'Cerca',
	robots: { index: false, follow: true }, // le pagine di ricerca interna non portano valore in SERP
};

type Props = { searchParams: Promise<{ q?: string; pagina?: string }> };

export default async function SearchPage({ searchParams }: Props) {
	const { q = '', pagina } = await searchParams;
	const page = Math.max(1, Number(pagina) || 1);
	const query = q.trim();

	const { posts, totalPages, total } = query
		? await getPosts({ search: query, page, perPage: 9 })
		: { posts: [], totalPages: 1, total: 0 };

	return (
		<main className="mx-auto max-w-6xl px-4 py-14">
			<h1 className="text-3xl">Cerca</h1>

			<form action="/cerca" method="get" className="mt-6 flex max-w-md gap-2">
				<label htmlFor="q" className="sr-only">
					Cerca ricette, varietà…
				</label>
				<input
					id="q"
					name="q"
					type="search"
					defaultValue={query}
					placeholder="Cerca ricette, varietà…"
					className="w-full border border-bordo px-4 py-2 text-sm focus:border-teal focus:outline-none"
				/>
				<button type="submit" className="bg-notte px-5 py-2 text-sm font-bold uppercase text-white hover:bg-teal">
					Cerca
				</button>
			</form>

			{query && (
				<p className="mt-6 text-sm text-testo-secondario">
					{total} risultat{total === 1 ? 'o' : 'i'} per “{query}”
				</p>
			)}

			<div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{posts.map((post) => (
					<PostCard key={post.id} post={post} />
				))}
			</div>

			{query && posts.length === 0 && (
				<p className="mt-8 text-testo-secondario">Nessun articolo trovato. Prova con altre parole chiave.</p>
			)}

			<Pagination currentPage={page} totalPages={totalPages} basePath="/cerca" extraParams={{ q: query }} />
		</main>
	);
}
