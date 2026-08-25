# Peperoncini Piccanti — frontend headless (Next.js)

Frontend pubblico in Next.js 16 (App Router, React 19, Tailwind CSS 4) che
consuma WordPress solo come backend/API (REST). Stessa identità visiva del
tema WordPress "peperoncini-piccanti" allegato (nero/teal/corallo, badge
piccantezza, card magazine), ma con un'architettura completamente diversa:
qui il rendering è React con Server Components, non blocchi WordPress.

**Prima di scegliere questa strada**, tieni presente il compromesso reale:
più complessità di hosting e manutenzione (serve un ambiente Node, non un
hosting WordPress "e basta"), in cambio di margine per ottimizzazioni CWV
molto spinte se in futuro il sito cresce. Per un blog personale, il tema
WordPress nativo allegato in `peperoncini-piccanti/` arriva già a risultati
ottimi con molta meno complessità operativa — vale la pena tenerlo a mente.

## Architettura

```
Utente → Next.js (Vercel o server Node)  →  fetch server-side, con cache  →  WordPress REST API (backend headless)
                                                                                      ↑
                                              webhook al salvataggio  ─────────────── ┘
                                              (wp-plugin/peperoncini-headless-companion.php)
```

- **WordPress** resta il CMS: editor, media, campo "piccantezza", SEO
  (Yoast/Rank Math). Non ha bisogno di un tema "bello" — nessun visitatore
  reale lo vedrà — ma può restare attivo il tema `peperoncini-piccanti`
  incluso in questo pacchetto, tanto non costa nulla tenerlo.
- **Next.js** genera l'HTML (Server Components, niente "single page app"
  vuota lato client) leggendo i contenuti dalla REST API, con cache e
  rivalidazione incrementale (ISR).
- **Il plugin `wp-plugin/`** avvisa Next.js via webhook quando pubblichi o
  aggiorni un articolo, cosi' il sito si aggiorna in pochi secondi.

## Requisiti

- Node.js 20+ e npm (per sviluppo/build in locale).
- Un hosting che esegua Node.js per Next.js: **Vercel** è il percorso più
  semplice (creato dallo stesso team di Next.js, deploy automatico da Git).
  In alternativa: Netlify, un VPS con `next start` dietro un reverse proxy.
- WordPress già esistente (anche il tuo hosting attuale va bene), con:
  - il plugin `wp-plugin/peperoncini-headless-companion.php` installato e attivo;
  - permalink "Nome articolo" (invariati rispetto ad ora);
  - REST API raggiungibile pubblicamente (è così per default su WordPress).

## Configurazione

1. `npm install`
2. Copia `.env.example` in `.env.local` e imposta:
   - `WP_API_URL`: l'indirizzo del tuo WordPress (es. il dominio attuale, o
     un sottodominio dedicato tipo `cms.peperoncinipiccanti.com` se in
     futuro vuoi separare backend e frontend anche a livello di DNS);
   - `NEXT_PUBLIC_SITE_URL`: l'URL pubblico del sito Next.js;
   - `REVALIDATE_SECRET`: una stringa lunga e casuale, la stessa che
     userai in `PPHC_REVALIDATE_SECRET` nel plugin WordPress.
3. `npm run dev` per sviluppo locale su `http://localhost:3000`.

## Deploy su Vercel (percorso consigliato)

1. Carica questo progetto su un repository Git (GitHub/GitLab/Bitbucket).
2. Su vercel.com → **Add New Project** → importa il repository.
3. Imposta le stesse variabili d'ambiente di `.env.example` nel pannello
   **Settings → Environment Variables** del progetto Vercel.
4. Deploy. Vercel assegna un URL `*.vercel.app`; poi colleghi il tuo
   dominio in **Settings → Domains**.
5. Su WordPress, in `wp-config.php`, aggiungi:
   ```php
   define( 'PPHC_REVALIDATE_URL', 'https://www.peperoncinipiccanti.com/api/revalidate' );
   define( 'PPHC_REVALIDATE_SECRET', 'lo-stesso-valore-di-REVALIDATE_SECRET' );
   ```

## Cosa fa gia' bene per i Core Web Vitals

- **Server Components ovunque tranne il carosello hero**: quasi zero
  JavaScript spedito al browser, ottimo per INP.
- **`next/image`**: ridimensiona, comprime e converte in AVIF/WebP ogni
  immagine automaticamente, servendo solo i byte necessari per ogni
  breakpoint — molto oltre a quello che un CMS classico fa di default.
- **`next/font/google`**: scarica e auto-ospita Lato in fase di build,
  nessuna richiesta a Google a runtime, `font-display: swap` automatico.
- **Cache con rivalidazione mirata**: le pagine restano statiche/cache-abili
  finché il contenuto non cambia davvero (webhook), invece di rigenerare
  tutto o servire dati stantii.
- **Paginazione via URL** (non stato client): funziona senza JavaScript ed
  è crawlabile da Google.

## Limiti noti / possibili estensioni future

- Il menu di navigazione è hardcoded in `lib/wp.ts` (`getMenu`) invece di
  essere letto da WordPress: la REST API core non espone i menu senza un
  plugin dedicato. Va bene per un menu che cambia raramente; se preferisci
  gestirlo da WP, installa "WP REST API Menus" e collega la funzione.
- La risoluzione dell'URL in `app/[...slug]/page.tsx` verifica l'ultimo
  segmento del percorso (slug piatto per gli articoli, slug della categoria
  per gli archivi). Per gerarchie di categorie molto profonde con slug
  duplicati tra rami diversi, si può rendere la corrispondenza più rigorosa
  confrontando anche `category.parent` lungo tutto il percorso.
- I commenti di WordPress non sono ancora integrati nel frontend (nel tema
  WordPress nativo invece sì, in `templates/single.html`): la REST API li
  espone (`/wp-json/wp/v2/comments`), servirebbe un componente form + lista
  se vuoi mantenerli anche qui.
- Il contenuto degli articoli viene renderizzato con `dangerouslySetInnerHTML`
  a partire dall'HTML che WordPress stesso genera (fonte fidata, è il tuo
  sito): per una protezione ulteriore si può filtrare con una libreria come
  `isomorphic-dompurify` prima del render.

## Verifica eseguita

In fase di sviluppo di questo scaffold sono stati eseguiti, con esito
positivo: `tsc --noEmit` (TypeScript strict, zero errori) ed `eslint .`
(regole `next/core-web-vitals` + `next/typescript`, zero errori). La build
completa (`next build`) richiede una connessione di rete reale verso
Google Fonts e verso il tuo WordPress per generare le pagine — cosa che
qui non è stato possibile testare end-to-end, ma che funzionerà
normalmente in locale o su Vercel.
