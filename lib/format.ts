/**
 * "X ANNI FA" ecc. per la striscia di titoli in evidenza sotto l'hero
 * (replica del vecchio tema, che mostrava "N ANNI AGO" sotto ogni titolo).
 * Nessuna libreria (date-fns ecc.): il calcolo serve solo per un'etichetta
 * testuale approssimata, non per logica di business, quindi una differenza
 * di millisecondi tra render server e idratazione client e' irrilevante
 * (i post coinvolti hanno sempre differenze di giorni/mesi/anni).
 */
export function timeAgo(dateIso: string): string {
	const diffMs = Date.now() - new Date(dateIso).getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays < 1) return 'OGGI';

	const diffYears = Math.floor(diffDays / 365);
	if (diffYears >= 1) return `${diffYears} ${diffYears === 1 ? 'ANNO' : 'ANNI'} FA`;

	const diffMonths = Math.floor(diffDays / 30);
	if (diffMonths >= 1) return `${diffMonths} ${diffMonths === 1 ? 'MESE' : 'MESI'} FA`;

	return `${diffDays} ${diffDays === 1 ? 'GIORNO' : 'GIORNI'} FA`;
}
