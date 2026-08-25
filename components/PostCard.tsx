import Image from 'next/image';
import Link from 'next/link';
import type { Post } from '@/lib/types';
import { RatingBadge } from './RatingBadge';

/**
 * Card "magazine" riusata in griglia home, archivio categoria e ricerca.
 * `sizes` e' impostato per dire al browser esattamente quanto e' grande
 * l'immagine in ogni breakpoint, cosi' next/image scarica solo i byte
 * necessari invece della versione piu' grande disponibile.
 */
export function PostCard({ post, priority = false }: { post: Post; priority?: boolean }) {
	return (
		<article className="group relative isolate overflow-hidden bg-notte">
			<Link href={`/${post.slug}`} className="absolute inset-0 z-10" aria-label={post.title} />

			<div className="relative aspect-[4/3] w-full overflow-hidden">
				{post.featuredImage ? (
					<Image
						src={post.featuredImage.url}
						alt={post.featuredImage.alt}
						fill
						priority={priority}
						sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
						className="object-cover transition-transform duration-300 group-hover:scale-105"
					/>
				) : (
					<div className="h-full w-full bg-notte" />
				)}
			</div>

			<RatingBadge rating={post.rating} className="absolute right-4 top-4 z-20" />

			<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-notte/95 via-notte/10 to-transparent" />

			<div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 p-5">
				{post.categories.length > 0 && (
					<ul className="flex flex-wrap gap-1.5">
						{post.categories.slice(0, 2).map((cat) => (
							<li
								key={cat.id}
								className="pp-tag bg-teal px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-white"
							>
								{cat.name}
							</li>
						))}
					</ul>
				)}
				<h3 className="text-xl font-black uppercase leading-tight text-white">{post.title}</h3>
			</div>
		</article>
	);
}
