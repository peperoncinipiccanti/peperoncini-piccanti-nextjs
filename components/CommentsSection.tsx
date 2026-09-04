import type { PostComment } from '@/lib/types';
import { CommentForm } from './CommentForm';
import { CommentsList } from './CommentsList';

const MAX_INDENT_LEVEL = 3; // oltre, le risposte restano allo stesso livello per non schiacciare il testo su mobile
const INITIAL_VISIBLE_THREADS = 5; // thread di primo livello mostrati prima di "Visualizza tutti i commenti"

/** Raggruppa la lista piatta di commenti per genitore, per poterla percorrere come un albero. */
function groupByParent(comments: PostComment[]): Map<number, PostComment[]> {
	const byParent = new Map<number, PostComment[]>();
	for (const comment of comments) {
		const siblings = byParent.get(comment.parentId) ?? [];
		siblings.push(comment);
		byParent.set(comment.parentId, siblings);
	}
	return byParent;
}

function CommentNode({
	comment,
	byParent,
	level,
}: {
	comment: PostComment;
	byParent: Map<number, PostComment[]>;
	level: number;
}) {
	const replies = byParent.get(comment.id) ?? [];
	const formattedDate = new Date(comment.date).toLocaleDateString('it-IT', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});

	return (
		<li className={level > 0 && level <= MAX_INDENT_LEVEL ? 'ml-6 border-l border-bordo pl-4 sm:ml-10' : undefined}>
			<div className="border-b border-bordo pb-5">
				<p className="text-sm font-bold uppercase tracking-wide text-testo">{comment.authorName}</p>
				<time dateTime={comment.date} className="text-xs text-testo-secondario">
					{formattedDate}
				</time>
				{/*
				 * Il contenuto arriva gia' filtrato da WordPress (wp_kses limita i
				 * tag consentiti nei commenti al momento del salvataggio, per
				 * chiunque non sia amministratore): stessa logica di fiducia gia'
				 * applicata al contenuto degli articoli in ArticleContent.tsx.
				 */}
				<div
					className="prose prose-sm prose-neutral mt-2 max-w-none prose-a:text-teal hover:prose-a:text-corallo"
					dangerouslySetInnerHTML={{ __html: comment.content }}
				/>
			</div>

			{replies.length > 0 && (
				<ul className="mt-5 flex flex-col gap-5">
					{replies.map((reply) => (
						<CommentNode key={reply.id} comment={reply} byParent={byParent} level={level + 1} />
					))}
				</ul>
			)}
		</li>
	);
}

/**
 * Elenco commenti approvati di un articolo + form per lasciarne uno nuovo.
 * I commenti arrivano gia' pronti da getPostComments() (lib/wp.ts), che
 * restituisce solo quelli con stato "approved" — un nuovo commento inviato
 * dal form resta quindi invisibile qui finche' non viene approvato in
 * wp-admin (comportamento richiesto, vedi anche il commento in
 * app/api/comments/route.ts sull'impostazione "approvazione manuale").
 */
export function CommentsSection({ postId, comments }: { postId: number; comments: PostComment[] }) {
	// `comments` arriva ordinato dal piu' vecchio al piu' nuovo (vedi
	// getPostComments in lib/wp.ts): gli ultimi elementi dell'array sono
	// quindi i thread piu' recenti, quelli mostrati di default.
	const topLevel = comments.filter((c) => c.parentId === 0);
	const byParent = groupByParent(comments);
	const nodes = topLevel.map((comment) => (
		<CommentNode key={comment.id} comment={comment} byParent={byParent} level={0} />
	));
	const recentNodes = nodes.slice(-INITIAL_VISIBLE_THREADS);
	const olderNodes = nodes.slice(0, Math.max(0, nodes.length - INITIAL_VISIBLE_THREADS));

	return (
		<section aria-label="Commenti" className="mt-12 border-t border-bordo pt-10">
			<h2 className="mb-6 text-2xl">{comments.length > 0 ? `${comments.length} commenti` : 'Commenti'}</h2>

			{topLevel.length > 0 && <CommentsList recent={recentNodes} older={olderNodes} />}

			{topLevel.length === 0 && (
				<p className="mb-8 text-sm text-testo-secondario">Nessun commento, per ora: lascia il primo!</p>
			)}

			<h3 className="mb-4 text-lg font-bold uppercase text-testo">Lascia un commento</h3>
			<CommentForm postId={postId} />
		</section>
	);
}
