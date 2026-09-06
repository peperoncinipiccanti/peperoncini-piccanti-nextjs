'use client';

import { ReactNode, useState } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { useArticleReactions } from './ArticleReactionsProvider';
import { ShareModal } from './ShareModal';

type ReactionColor = 'teal' | 'blu' | 'corallo';

const BADGE_COLOR: Record<ReactionColor, string> = {
	teal: 'bg-teal',
	blu: 'bg-sky-600',
	corallo: 'bg-corallo',
};

const BORDER_COLOR: Record<ReactionColor, string> = {
	teal: 'border-teal text-teal',
	blu: 'border-sky-600 text-sky-600',
	corallo: 'border-corallo text-corallo',
};

/**
 * Un singolo badge "cerchio con icona + pallino numerico sovrapposto",
 * riprodotto dalla grafica del vecchio sito allegata da Daniele: cerchio
 * colorato (bordo + icona) con un pallino numerico piu' piccolo, dello
 * STESSO colore ma pieno, sovrapposto in alto a SINISTRA — non un cerchio
 * grigio neutro con hover, come nel primo tentativo.
 */
function ReactionBadge({
	icon,
	count,
	label,
	color,
	onClick,
	active,
}: {
	icon: ReactNode;
	count: number;
	label: string;
	color: ReactionColor;
	onClick?: () => void;
	active?: boolean;
}) {
	const content = (
		<>
			<span className="relative">
				<span
					className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-transform duration-150 ${
						BORDER_COLOR[color]
					} ${onClick ? 'active:scale-90' : ''}`}
				>
					{icon}
				</span>
				<span
					className={`absolute -left-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-[0.65rem] font-bold text-white ${BADGE_COLOR[color]}`}
				>
					{count > 999 ? `${Math.floor(count / 1000)}k` : count}
				</span>
			</span>
			<span className="text-[0.6rem] font-bold uppercase tracking-wide text-testo-secondario">{label}</span>
		</>
	);

	if (onClick) {
		return (
			<button
				type="button"
				onClick={onClick}
				className="flex flex-col items-center gap-1.5"
				aria-label={`${label}: ${count}${active ? " (gia' messo)" : ''}`}
			>
				{content}
			</button>
		);
	}

	return (
		<div className="flex flex-col items-center gap-1.5" aria-label={`${label}: ${count}`}>
			{content}
		</div>
	);
}

/**
 * Colonna verticale di contatori vicino all'inizio dell'articolo — non piu'
 * una riga orizzontale a tutta larghezza: nella grafica di riferimento del
 * vecchio sito, Share/Comment/Love sono impilati stretti sul bordo sinistro,
 * col testo dell'articolo che scorre alla loro destra (float, vedi il
 * commento in PostView, app/[...slug]/page.tsx).
 *
 * "Share" e' cliccabile come "Love": apre il popup di condivisione (vedi
 * ShareModal.tsx, stesso comportamento del vecchio sito) E incrementa subito
 * il contatore tramite trackShare() — l'incremento avviene all'apertura del
 * popup, non alla scelta di un canale al suo interno (altrimenti si
 * conterebbe due volte lo stesso click).
 */
export function ArticleReactions({ title, commentsCount }: { title: string; commentsCount: number }) {
	const { shares, loves, loved, trackShare, toggleLove } = useArticleReactions();
	const [shareOpen, setShareOpen] = useState(false);

	function handleShareClick() {
		trackShare();
		setShareOpen(true);
	}

	return (
		<>
			<div className="flex flex-col gap-4">
				<ReactionBadge icon={<Share2 size={18} />} count={shares} label="Share" color="teal" onClick={handleShareClick} />
				<ReactionBadge icon={<MessageCircle size={18} />} count={commentsCount} label="Comment" color="blu" />
				<ReactionBadge
					icon={<Heart size={18} fill={loved ? 'currentColor' : 'none'} />}
					count={loves}
					label="Love"
					color="corallo"
					active={loved}
					onClick={toggleLove}
				/>
			</div>

			{shareOpen && <ShareModal title={title} onClose={() => setShareOpen(false)} />}
		</>
	);
}
