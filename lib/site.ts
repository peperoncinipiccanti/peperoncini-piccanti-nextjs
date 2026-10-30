/**
 * Costanti condivise su dominio/nome del sito, usate sia dai metadata
 * (app/layout.tsx) sia dai dati strutturati schema.org (lib/schema.ts).
 * Centralizzate qui per evitare che i due punti finiscano per divergere
 * silenziosamente in futuro (es. se cambia di nuovo il dominio).
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.peperoncinipiccanti.com';
export const SITE_NAME = 'PeperonciniPiccanti.com';

// Campi Open Graph comuni a tutto il sito. I metadata di Next.js si fondono
// in modo "shallow": una pagina che definisce il proprio `openGraph` (per
// esempio per aggiungere `url`) sostituisce per intero quello del layout,
// quindi deve ripetere questi campi per non perderli.
export const OG_BASE = { locale: 'it_IT', siteName: SITE_NAME } as const;

// Stessa immagine usata come logo nell'header (vedi Header.tsx): resta un
// asset della libreria media di WordPress, non del tema/frontend, quindi si
// costruisce allo stesso modo a partire da WP_API_URL.
const WP_API_URL = (process.env.WP_API_URL ?? 'https://cms.peperoncinipiccanti.com').replace(/\/+$/, '');
export const LOGO_URL = `${WP_API_URL}/wp-content/uploads/2021/02/logo-www.peperoncinipiccanti.com_Tavola-disegno-1-1.jpg`;
