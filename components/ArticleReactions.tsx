'use client';

import { useEffect, useState } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';

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
 */
function ReactionBadge({
	icon,
	count,
	label,
	color,
	onClick,
	active,
}: {
	icon: React.ReactNode;
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
					className={`flex h-14 w-14 items-center justify-center rounded-full border-2 text-testo-secondario transition sm:h-16 sm:w-16 ${
						active ? 'border-corallo text-corallo' : 'border-bordo'
					} ${onClick ? 'group-hover:border-corallo group-hover:text-corallo' : ''}`}
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
				aria-label={`${label}: ${count}, clicca per mettere ${label.toLowerCase()}`}
			>
				{content}
			</button>
		);
	}

	return (
		<div className="group flex flex-col items-center gap-2" aria-label={`${label}: ${count}`}>
			{content}
		</div>
	);
}

/**
 * Riga di contatori in cima all'articolo: Condivisioni e Commenti sono
 * puramente informativi (il primo si aggiorna quando qualcuno usa i
 * pulsanti di ShareButtons.tsx in fondo alla pagina, il secondo e' il numero
 * reale di commenti approvati, gia' calcolato in PostView), "Love" e' invece
 * cliccabile: un click chiama /api/react (type=love) e incrementa il
 * contatore lato WordPress.
 *
 * Un voto "Love" per browser: si ricorda in localStorage se questo
 * visitatore ha gia' messo like a QUESTO articolo, per evitare click ripetuti
 * per sbaglio (non e' una protezione anti-frode, vedi commento nel plugin
 * PHP). L'aggiornamento del numero e' ottimistico (+1 subito al click) e poi
 * corretto con il valore reale tornato da WordPress.
 */
export function ArticleReactions({
	postId,
	initialShares,
	initialLoves,
	commentsCount,
}: {
	postId: number;
	initialShares: number;
	initialLoves: number;
	commentsCount: number;
}) {
	const [loves, setLoves] = useState(initialLoves);
	const [loved, setLoved] = useState(false);

	useEffect(() => {
		setLoved(typeof window !== 'undefined' && localStorage.getItem(`pphc_loved_${postId}`) === '1');
	}, [postId]);

	async function handleLove() {
		if (loved) return;

		setLoved(true);
		setLoves((n) => n + 1);
		localStorage.setItem(`pphc_loved_${postId}`, '1');

		try {
			const res = await fetch('/api/react', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ postId, type: 'love' }),
			});
			const data = await res.json();
			if (res.ok && typeof data?.count === 'number') setLoves(data.count);
		} catch {
			// Il "Love" resta comunque segnato localmente: non e' critico se
			// il conteggio server-side non si aggiorna per un problema di rete.
		}
	}

	return (
		<div className="flex justify-center gap-8 py-6 sm:justify-start sm:gap-10">
			<ReactionBadge icon={<Share2 size={22} />} count={initialShares} label="Share" color="teal" />
			<ReactionBadge icon={<MessageCircle size={22} />} count={commentsCount} label="Comment" color="blu" />
			<ReactionBadge
				icon={<Heart size={22} fill={loved ? 'currentColor' : 'none'} />}
				count={loves}
				label="Love"
				color="corallo"
				active={loved}
				onClick={handleLove}
			/>
		</div>
	);
}
