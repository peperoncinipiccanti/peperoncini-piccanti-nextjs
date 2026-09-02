import Image from 'next/image';
import Link from 'next/link';
import type { Post } from '@/lib/types';
import { RatingBadge } from './RatingBadge';

/**
 * Card "magazine" riusata in griglia home, archivio categoria e ricerca.
 * `sizes` e' impostato per dire al browser esattamente quanto e' grande
 * l'immagine in ogni breakpoint, cosi' next/image scarica solo i byte
 * necessari invece della versione piu' grande disponibile.
 *
 * `size="large"` e' la variante usata per il post "in evidenza" del widget
 * "Le mie recensioni" in home (vedi app/page.tsx): stessa card, solo piu'
 * bassa/larga e con titolo piu' grande, per renderla visivamente doppia
 * rispetto alle 4 card piccole sotto — replica del vecchio tema.
 */
export function PostCard({
	post,
	priority = false,
	size = 'default',
}: {
	post: Post;
	priority?: boolean;
	size?: 'default' | 'large';
}) {
	const isLarge = size === 'large';

	return (
		<article className="group relative isolate overflow-hidden bg-notte">
			<Link href={`/${post.slug}`} className="absolute inset-0 z-10" aria-label={post.title} />

			<div className={`relative w-full overflow-hidden ${isLarge ? 'aspect-[16/9] sm:aspect-[21/9]' : 'aspect-[4/3]'}`}>
				{post.featuredImage ? (
					<Image
						src={post.featuredImage.url}
						alt={post.featuredImage.alt}
						fill
						priority={priority}
						sizes={isLarge ? '(min-width: 1024px) 66vw, 100vw' : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'}
						className="object-cover transition-transform duration-300 group-hover:scale-105"
					/>
				) : (
					<div className="h-full w-full bg-notte" />
				)}
			</div>

			<RatingBadge rating={post.rating} className="absolute right-4 top-4 z-20" />

			<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-notte/95 via-notte/10 to-transparent" />

			<div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 p-5">
				{/*
				 * "flex-nowrap" invece di "flex-wrap": con 2 categorie dal nome
				 * lungo, andare a capo faceva coprire quasi tutta la foto su
				 * mobile (la card e' stretta). Ogni tag ora si restringe
				 * (min-w-0 + truncate) restando su un'unica riga, con i nomi
				 * troppo lunghi tagliati con "…" invece di spingere a capo.
				 */}
				{post.categories.length > 0 && (
					<ul className="flex flex-nowrap gap-1.5 overflow-hidden">
						{post.categories.slice(0, 2).map((cat) => (
							<li
								key={cat.id}
								className="pp-tag min-w-0 shrink truncate bg-teal px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-white"
							>
								{cat.name}
							</li>
						))}
					</ul>
				)}
				<h3 className={`font-black uppercase leading-tight text-white ${isLarge ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>
					{post.title}
				</h3>
			</div>
		</article>
	);
}
