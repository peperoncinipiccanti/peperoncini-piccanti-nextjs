'use client';

import { ReactNode } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { useArticleReactions } from './ArticleReactionsProvider';

type ReactionColor = 'teal' | 'blu' | 'corallo';

const BADGE_COLOR: Record<ReactionColor, string> = {
	teal: 'bg-teal',
	blu: 'bg-sky-600',
	corallo: 'bg-corallo',
};

/**
 * Un singolo badge "cerchio con icona + pallino numerico sovrapposto",
 * riprodotto dalla grafica di riferimento fornita da Daniele: cerchio grande
 * col bordo grigio e l'icona al centro, un cerchio piu' piccolo colorato con
 * il numero sopra al bordo in alto a destra, etichetta maiuscola sotto.
 *
 * Renderizza un <button> solo se riceve onClick (il badge "Love"), altrimenti
 * un <div> puramente informativo (Condivisioni, Commenti) — niente cursore a
 * manina ne' hover su qualcosa che non fa nulla al click.
 *
 * L'anteprima al passaggio del mouse (solo sul badge cliccabile, quando NON
 * e' ancora attivo) usa un colore piu' tenue (/60 di opacita') apposta
 * DIVERSO dal colore pieno dello stato "attivo": prima il hover e il click
 * usavano lo stesso colore pieno, rendendo i due stati indistinguibili a
 * colpo d'occhio — un click sembrava "non fare nulla" se il mouse restava
 * sopra al bottone dopo aver cliccato (bug segnalato da Daniele sul "Love").
 * `active:scale-90` da' inoltre un piccolo feedback di pressione immediato,
 * indipendente dalla richiesta di rete.
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
					className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all duration-150 sm:h-16 sm:w-16 ${
						active
							? 'border-corallo text-corallo'
							: `border-bordo text-testo-secondario ${onClick ? 'group-hover:border-corallo/60 group-hover:text-corallo/60' : ''}`
					} ${onClick ? 'active:scale-90' : ''}`}
				>
					{icon}
				</span>
				<span
					className={`absolute -top-1.5 right-0 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${BADGE_COLOR[color]}`}
				>
					{count > 999 ? `${Math.floor(count / 1000)}k` : count}
				</span>
			</span>
			<span className="text-[0.65rem] font-bold uppercase tracking-wide text-testo-secondario">{label}</span>
		</>
	);

	// Bottone solo per il badge "Love" (l'unico cliccabile): un <div> per gli
	// altri due evita che risultino focalizzabili/premibili da tastiera per
	// un'azione che in realta' non fanno nulla.
	if (onClick) {
		return (
			<button
				type="button"
				onClick={onClick}
				className="group flex flex-col items-center gap-2"
				aria-label={`${label}: ${count}${active ? ' (gia\' messo)' : ', clicca per mettere ' + label.toLowerCase()}`}
			>
				{content}
			</button>
		);
	}

	return (
		<div className="flex flex-col items-center gap-2" aria-label={`${label}: ${count}`}>
			{content}
		</div>
	);
}

/**
 * Riga di contatori in cima all'articolo: Condivisioni e Love arrivano dal
 * contesto condiviso con ShareButtons.tsx (vedi ArticleReactionsProvider.tsx)
 * cosi' un click sui pulsanti in fondo alla pagina aggiorna subito questi
 * numeri, senza dover ricaricare. "Comment" resta un valore passato come
 * prop, perche' e' il numero di commenti approvati gia' calcolato in
 * PostView — non ha bisogno di stato condiviso, non cambia mai durante la
 * visita di questa pagina.
 */
export function ArticleReactions({ commentsCount }: { commentsCount: number }) {
	const { shares, loves, loved, toggleLove } = useArticleReactions();

	return (
		<div className="flex justify-center gap-8 py-6 sm:justify-start sm:gap-10">
			<ReactionBadge icon={<Share2 size={22} />} count={shares} label="Share" color="teal" />
			<ReactionBadge icon={<MessageCircle size={22} />} count={commentsCount} label="Comment" color="blu" />
			<ReactionBadge
				icon={<Heart size={22} fill={loved ? 'currentColor' : 'none'} />}
				count={loves}
				label="Love"
				color="corallo"
				active={loved}
				onClick={toggleLove}
			/>
		</div>
	);
}
