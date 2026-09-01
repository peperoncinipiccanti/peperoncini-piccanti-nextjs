import Image from 'next/image';

/**
 * Blocco "presentazione" della vecchia home (manifesto del blog + bio
 * dell'autore): testo statico fornito direttamente da Daniele, non arriva
 * da WordPress — stesso principio gia' usato per il banner "Vuoi imparare
 * come coltivare in casa il peperoncino?" in app/page.tsx.
 *
 * Le due foto di chiusura (peperoncini e Zen, il cane citato nel testo)
 * sono asset statici del progetto (public/about/), gia' ridimensionati e
 * compressi in JPEG — non passano dalla libreria media di WordPress perche'
 * non sono contenuto editoriale gestito da CMS, ma parte fissa di questa
 * sezione "Chi sono".
 */
export function AboutSection() {
	return (
		<section className="bg-sfondo-chiaro">
			<div className="mx-auto max-w-3xl px-4 py-14">
				<h2 className="text-2xl">Chi sono</h2>

				<div className="mt-6 space-y-4 text-testo-secondario">
					<p>
						<strong className="text-testo">Nomen Omen:</strong> PeperonciniPiccanti.com è un blog sui Peperoncini
						Piccanti. Informazioni, curiosità e ricette a base di Peperoncini Piccanti, collettati in un sito sul
						peperoncino di nome e di fatto.
					</p>
					<p>
						Un blog corale, scritto con il contributo di tutti gli appassionati di Peperoncini Piccanti.
						PeperonciniPiccanti.com vuole quindi essere un angolo del web in cui leggere e commentare i post
						inseriti, contribuire con ricette, foto e informazioni, ma tutto con lo stesso denominatore comune:
						peperoncino.
					</p>
				</div>

				<hr className="my-8 border-bordo" />

				<div className="space-y-4 text-testo-secondario">
					<p>Mi chiamo Daniele, da oltre 20 anni mi occupo di marketing.</p>
					<p>Lavoro come direttore tecnico per un&apos;importante agenzia di comunicazione in Sardegna.</p>
					<p>
						Precedentemente ho lavorato per la più grande catena di drugstore in Italia, ovvero Acqua&amp;Sapone, e
						ancor prima come marketing manager per un&apos;altra catena sarda di negozi (drugstore e profumerie) ma
						ho iniziato come sales e marketing per una società editrice specializzata nel campo dei free-press.
					</p>
					<p>Nato a Roma, cresciuto in Sardegna, partito alla conquista del mondo. Intrinsecamente cosmopolita.</p>
					<p>
						Web, rally, cucina e Peperoncini Piccanti sono le mie passioni: da qui la decisione di unirle in un
						blog. Non tutte, ovviamente, potete stare tranquilli: non vi proporrò mai spaghetti aglio, olio motore
						e peperoncino!!!
					</p>
					<p>
						Ho iniziato a coltivare Peperoncini Piccanti nel 1998 e, da allora, non ho mai smesso, destinando
						sempre un angolo degli appartamenti che mi hanno via via ospitato a piccolo orto, per tenere accesa la
						mia passione.
					</p>
					<p>
						Mi diletto a coltivare ogni varietà di peperoncino e, tra le mie preferite, ci sono quelle extra
						piccanti, con cui torturo parenti, amici e colleghi, sottoponendoli a focosissimi assaggi.
					</p>
					<p>
						Ma soprattutto torturo i miei genitori che, vivendo in Sardegna, hanno un giardino baciato da un sole
						caldo e fertile: è qui che coltivo la maggior parte dei miei peperoncini, affidandone loro la cura in
						mia assenza e, fino a qualche anno fa la protezione del raccolto da Zen, il Bobtail nuvola di pelo, che
						se n&rsquo;è andato senza avermi mai perdonato il trasferimento&hellip;
					</p>
					<p>Non mi resta che augurarvi buona navigazione e più PeperonciniPiccanti per il futuro!</p>
				</div>

				<div className="mt-8 grid grid-cols-2 gap-4">
					<figure>
						<div className="relative aspect-square overflow-hidden">
							<Image
								src="/about/peperoncini.jpg"
								alt="Peperoncini piccanti rossi, gialli e arancioni appena raccolti"
								width={1200}
								height={1200}
								sizes="(min-width: 640px) 340px, 45vw"
								className="h-full w-full object-cover"
							/>
						</div>
					</figure>
					<figure>
						<div className="relative aspect-square overflow-hidden">
							<Image
								src="/about/zen.jpg"
								alt="Zen, il Bobtail nuvola di pelo, in giardino con un pallone"
								width={900}
								height={1200}
								sizes="(min-width: 640px) 340px, 45vw"
								className="h-full w-full object-cover"
							/>
						</div>
					</figure>
				</div>
			</div>
		</section>
	);
}
