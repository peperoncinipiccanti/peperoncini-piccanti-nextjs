import Link from 'next/link';

export default function NotFound() {
	return (
		<main className="mx-auto max-w-xl px-4 py-24 text-center">
			<h1 className="text-4xl">404: peperoncino non trovato</h1>
			<p className="mt-4 text-testo-secondario">
				La pagina che cerchi non esiste più o è stata spostata. Prova a cercarla.
			</p>
			<Link
				href="/cerca"
				className="mt-8 inline-block bg-notte px-6 py-3 text-sm font-bold uppercase text-white hover:bg-teal"
			>
				Vai alla ricerca
			</Link>
		</main>
	);
}
