'use client';

import { FormEvent, useState } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const inputClass = 'w-full border border-bordo px-4 py-2 text-sm focus:border-teal focus:outline-none';

/**
 * Form "Lascia un commento" sotto la lista commenti di un articolo. Invia a
 * /api/comments (route interna, vedi app/api/comments/route.ts), che inoltra
 * a WordPress lato server: qui non si parla mai direttamente con
 * cms.peperoncinipiccanti.com, ne' serve alcuna autenticazione.
 *
 * Ogni commento arriva su WordPress "in attesa di approvazione" (a patto che
 * in Impostazioni > Discussione sia spuntato "Il commento deve essere
 * approvato manualmente" — altrimenti un autore con un commento gia'
 * approvato in passato verrebbe pubblicato subito). Per questo motivo il
 * nuovo commento NON viene aggiunto otticamente alla lista qui sotto: non
 * sarebbe comunque visibile agli altri visitatori finche' non approvato in
 * wp-admin, e farlo sparire dopo un refresh confonderebbe piu' che aiutare.
 * Si mostra invece un messaggio di conferma chiaro.
 *
 * Il campo "sito_web" e' un honeypot anti-spam: nascosto via CSS (mai
 * visibile ne' raggiungibile da tastiera per un utente reale), un bot che
 * compila tutti i campi di un form ci casca quasi sempre.
 */
export function CommentForm({ postId }: { postId: number }) {
	const [status, setStatus] = useState<Status>('idle');
	const [errorMessage, setErrorMessage] = useState('');

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setStatus('sending');
		setErrorMessage('');

		const form = event.currentTarget;
		const data = new FormData(form);

		try {
			const res = await fetch('/api/comments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					postId,
					authorName: data.get('authorName'),
					authorEmail: data.get('authorEmail'),
					content: data.get('content'),
					website: data.get('sito_web'),
				}),
			});

			const result = await res.json();

			if (!res.ok) {
				setErrorMessage(result?.error ?? 'Impossibile inviare il commento.');
				setStatus('error');
				return;
			}

			form.reset();
			setStatus('sent');
		} catch {
			setErrorMessage('Connessione non riuscita, riprova tra poco.');
			setStatus('error');
		}
	}

	if (status === 'sent') {
		return (
			<p className="bg-sfondo-chiaro px-5 py-4 text-sm text-testo">
				Grazie per il tuo commento! È in attesa di approvazione e comparirà a breve.
			</p>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			{/* Honeypot: fuori dallo schermo, non solo "display:none" (alcuni bot lo ignorano se cosi'). */}
			<div className="absolute -left-[9999px]" aria-hidden="true">
				<label htmlFor="sito_web">Sito web</label>
				<input id="sito_web" name="sito_web" type="text" tabIndex={-1} autoComplete="off" />
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div>
					<label htmlFor="authorName" className="mb-1 block text-xs font-bold uppercase tracking-wide text-testo-secondario">
						Nome *
					</label>
					<input id="authorName" name="authorName" type="text" required className={inputClass} />
				</div>
				<div>
					<label htmlFor="authorEmail" className="mb-1 block text-xs font-bold uppercase tracking-wide text-testo-secondario">
						Email * <span className="normal-case font-normal">(non sarà pubblicata)</span>
					</label>
					<input id="authorEmail" name="authorEmail" type="email" required className={inputClass} />
				</div>
			</div>

			<div>
				<label htmlFor="content" className="mb-1 block text-xs font-bold uppercase tracking-wide text-testo-secondario">
					Commento *
				</label>
				<textarea id="content" name="content" required rows={5} className={inputClass} />
			</div>

			{status === 'error' && <p className="text-sm text-corallo">{errorMessage}</p>}

			<button
				type="submit"
				disabled={status === 'sending'}
				className="self-start bg-notte px-6 py-2.5 text-sm font-bold uppercase text-white transition hover:bg-teal disabled:opacity-50"
			>
				{status === 'sending' ? 'Invio…' : 'Invia commento'}
			</button>
		</form>
	);
}
