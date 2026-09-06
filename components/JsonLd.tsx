/**
 * Inietta un blocco <script type="application/ld+json"> con dati
 * strutturati schema.org. `dangerouslySetInnerHTML` e' l'unico modo per
 * mettere JSON grezzo dentro un tag <script> in React (non e' testo
 * "visibile", quindi non serve escaping HTML) — l'unico rischio reale e'
 * che il JSON contenga la sequenza "</script>", che chiuderebbe il tag
 * anzitempo: si sostituisce "<" con la sequenza unicode equivalente, innocua
 * per JSON.parse() ma non piu' interpretabile dall'HTML parser del browser.
 */
export function JsonLd({ data }: { data: object }) {
	const json = JSON.stringify(data).replace(/</g, '\\u003c');

	return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
