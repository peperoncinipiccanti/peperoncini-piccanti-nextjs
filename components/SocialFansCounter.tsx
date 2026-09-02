import { FacebookIcon, InstagramIcon } from './icons';
import type { SocialCounts } from '@/lib/social';

/**
 * Blocco "quanti fan hai" sopra "Ultimi commenti" in home. Sostituisce il
 * vecchio plugin WordPress "Social Fans Counter" — vedi il commento in
 * lib/social.ts per il perche' un plugin a widget non funzionerebbe
 * comunque su un frontend headless, a prescindere da quanto sia aggiornato.
 *
 * Se le variabili d'ambiente della Graph API non sono ancora configurate
 * (o la chiamata fallisce), entrambi i contatori sono null e il blocco
 * semplicemente non si mostra, invece di lasciare una sezione vuota o rotta.
 */
export function SocialFansCounter({ counts }: { counts: SocialCounts }) {
	if (counts.facebook === null && counts.instagram === null) {
		return null;
	}

	return (
		<div className="mb-8 flex flex-wrap gap-3">
			{counts.facebook !== null && (
				<a
					href="https://www.facebook.com/peperoncinipiccanti"
					target="_blank"
					rel="noreferrer"
					className="flex flex-1 items-center gap-3 bg-sfondo-chiaro px-5 py-4 transition hover:bg-black/[0.06]"
				>
					<FacebookIcon size={26} className="flex-none text-teal" />
					<div>
						<p className="text-xl font-black leading-none text-testo">{counts.facebook.toLocaleString('it-IT')}</p>
						<p className="mt-1 text-xs uppercase tracking-wide text-testo-secondario">Fan su Facebook</p>
					</div>
				</a>
			)}
			{counts.instagram !== null && (
				<a
					href="https://www.instagram.com/peperoncinipiccanti"
					target="_blank"
					rel="noreferrer"
					className="flex flex-1 items-center gap-3 bg-sfondo-chiaro px-5 py-4 transition hover:bg-black/[0.06]"
				>
					<InstagramIcon size={26} className="flex-none text-corallo" />
					<div>
						<p className="text-xl font-black leading-none text-testo">{counts.instagram.toLocaleString('it-IT')}</p>
						<p className="mt-1 text-xs uppercase tracking-wide text-testo-secondario">Follower su Instagram</p>
					</div>
				</a>
			)}
		</div>
	);
}
