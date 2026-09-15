# Peperoncini Piccanti — tema a blocchi (FSE)

Rifacimento tecnico del tema storico "Edition" di peperoncinipiccanti.com,
pensato come **"piano B" sempre pronto**: se un giorno si volesse tornare a
una soluzione WordPress-only (senza Vercel/Next.js), basta installare e
attivare questo tema. Stessa identità visiva (nero/teal/corallo, badge
piccantezza, card "magazine") e, dalla v1.1.0, le STESSE funzionalità del
sito headless attuale (post più visti, recensioni con Review Criteria,
reazioni Share/Love, articoli correlati, caroselli "Salute"/"Conservazione"
per tag) — lette pero' direttamente dal database di WordPress, senza alcuna
dipendenza da Vercel, Next.js o dal plugin companion headless.

## Requisiti

- WordPress 6.5 o superiore (serve per il campo `render` di `block.json`
  usato dai blocchi dinamici, e per le funzioni FSE più recenti).
- PHP 7.4+.
- **Per il funzionamento base (griglie, badge piccantezza col campo
  semplice, caroselli, post più visti, reazioni): nessun plugin richiesto.**
- **Per il punteggio "Recensione" completo (media dei Review Criteria) e
  per la selezione manuale degli articoli nell'hero ("Featured")**: questo
  tema legge gli stessi campi ACF già usati dal tema "Edition"
  (`review_post`, `review_criteria`, `review_title`, `review_summary`,
  `featured`) — serve quindi che **Advanced Custom Fields** resti attivo
  (come lo e' oggi sul sito) e che quei campi restino compilati come sono
  adesso. Senza ACF attivo il tema funziona comunque, semplicemente questi
  due elementi non si mostrano (il badge piccantezza ripiega sul semplice
  campo "Livello di piccantezza" di questo tema, vedi sotto; l'hero mostra
  gli ultimi articoli pubblicati invece dei "Featured").
- **Post più visti**: legge la tabella `{prefix}most_popular`, la stessa
  usata dal plugin "WP Most Popular" e dal plugin companion headless — se
  non esiste ancora, il tema la crea da solo alla prima attivazione.
- **Condivisioni/Love**: leggono/scrivono `shares_count`/`votes_count`,
  gli stessi post meta storici del tema Edition — nessuna migrazione dati.
- Consigliati (non richiesti): un plugin SEO (Yoast, già in uso, o Rank
  Math) per sitemap XML e controllo meta avanzato.

## Installazione

1. Comprimi la cartella `peperoncini-piccanti` in un file `.zip` (se non
   l'hai già ricevuta così).
2. Nel tuo sito: **Aspetto → Temi → Aggiungi nuovo → Carica tema**, scegli
   lo zip, installa e attiva.
   In alternativa via FTP: carica la cartella in `wp-content/themes/`.
3. Prima di attivare su produzione, fallo su un ambiente di staging (o
   almeno con un backup pronto) e segui la checklist di migrazione nella
   guida allegata: l'obiettivo è mantenere invariati permalink e URL, così
   non servono redirect e il posizionamento SEO non viene toccato.
4. Dopo l'attivazione, in **Aspetto → Editor del sito**:
   - imposta il logo (era un'immagine nel tema vecchio, ora si carica da
     Aspetto → Editor del sito → Stili, o direttamente sul blocco Logo
     sito in intestazione);
   - crea/collega il menu di navigazione (Varietà di Peperoncino, I
     Peperoncini più Piccanti, Coltivare il Peperoncino, Benefici del
     Peperoncino, Ricette Piccanti — gli stessi URL di prima);
   - nel blocco "Ricette piccanti" in prima pagina, imposta il filtro per
     categoria dal pannello laterale del blocco Query Loop (nessun codice).

## Come impostare il "livello di piccantezza"

Ogni articolo ha un riquadro **"Livello di piccantezza"** nella barra
laterale dell'editor (0–10, anche con decimali tipo 8.3). Il valore
alimenta l'anello colorato che vedi sulle card e in testa agli articoli:
è generato in puro CSS (`conic-gradient`), niente JavaScript o plugin
esterni come nel tema vecchio.

## Struttura del tema

```
peperoncini-piccanti/
├── style.css                    # intestazione tema (obbligatoria per WP)
├── theme.json                   # design token: colori, font, spaziature, pulsanti
├── functions.php                # setup, performance, SEO, TUTTI gli helper dati v1.1.0
├── templates/                    # front-page, index, single, archive, search, 404, page
├── parts/                       # header.html, footer.html
├── patterns/
│   ├── cta-coltivare.php         # banner "Vuoi imparare a coltivare..."
│   ├── chi-sono.php              # bio autore + foto di chiusura (assets/images/)
│   ├── griglia-articoli.php      # griglia semplice a 3 colonne (senza sidebar)
│   └── griglia-con-sidebar.php   # griglia 2 colonne + sidebar (usata da archive/search/index)
├── blocks/
│   ├── rating-badge/             # badge piccantezza circolare (v1.0, ora legge il punteggio review vero)
│   ├── hero-carousel/            # carosello articoli "Featured"
│   ├── reviews-carousel/         # widget "Le mie recensioni" (1 grande + 4 piccoli)
│   ├── popular-posts/            # post più visti, tab Settimana/Mese/Sempre
│   ├── reactions/                # badge Share/Commenti/Love in cima all'articolo
│   ├── share-buttons/            # riga di pulsanti condivisione in fondo all'articolo
│   ├── review-breakdown/         # blocco "Recensione" dettagliato coi Review Criteria
│   ├── related-posts/            # "Potrebbe interessarti anche"
│   ├── popular-tags/             # nuvola "Tag più utilizzati"
│   └── tag-carousel/             # carosello per tag (Salute / Conservazione)
└── assets/
    ├── css/style.css             # tutte le regole non esprimibili via theme.json
    ├── js/                       # un file per ciascun blocco interattivo (vanilla JS, no build step)
    ├── images/                   # foto della sezione "Chi sono" (peperoncini.jpg, zen.jpg)
    └── fonts/                    # vuota di proposito, vedi guida per l'auto-hosting di Lato
```

## Cosa cambia rispetto al tema vecchio (in breve)

- Niente Bootstrap, niente jQuery, niente Font Awesome, niente framework
  di opzioni (Redux): meno JavaScript/CSS da scaricare, parsare ed
  eseguire, meno cose che possono rompersi con gli aggiornamenti di WP.
- Il "carosello" hero è scorrimento nativo del browser (CSS `scroll-snap`)
  invece di un plugin slider: stesso effetto visivo, zero librerie JS.
- Il badge piccantezza è un blocco dinamico WordPress nativo (nessun
  plugin di terze parti, nessuna dipendenza da mantenere aggiornata).
- Immagini con `loading="lazy"` automatico (nativo in WordPress dal
  6.3+), dimensioni dedicate (`pp-card`, `pp-hero`) invece di crop fissi
  da tema, `fetchpriority="high"` + preload sull'immagine dell'hero per
  migliorare l'LCP.
- Font di sistema come fallback immediato: zero richieste bloccanti a
  Google Fonts finché non aggiungi Lato in self-hosting (vedi guida).

Per la strategia SEO, la checklist di migrazione e il dettaglio Core Web
Vitals, vedi il documento **"Guida SEO e Performance"** allegato insieme
a questo tema.

## Se un giorno si torna a WordPress-only (senza Vercel)

Questo tema e' pensato per essere attivabile in qualsiasi momento come
sostituto completo del sito headless attuale, con lo storico dati intatto
(stessa tabella "post più visti", stessi meta di condivisioni/love, stessi
campi ACF di recensione/featured). In sintesi, per tornare a servire il
sito direttamente da WordPress:

1. **Backup del database** prima di qualsiasi modifica (vedi la procedura
   in `docs/DOCUMENTAZIONE-TECNICA.md` del progetto Next.js, §6.4).
2. **Aspetto → Temi → Carica tema**, attiva "Peperoncini Piccanti" (o, se
   preferisci restare sul tema "Edition" gia' installato, vedi il punto 5).
3. In **Impostazioni → Lettura**, togli la spunta a "Chiedi ai motori di
   ricerca di non indicizzare questo sito" se era stata attivata sul
   dominio `cms.` durante la fase headless (vedi §9.4 della documentazione
   tecnica) — sennò l'intero sito torna sotto `noindex`.
4. Ripunta il DNS del dominio pubblico (`www.`) da Vercel all'hosting
   WordPress (Serverplan), o viceversa configura Vercel per non servire
   più quel dominio — a seconda di quale dei due deve restare "il sito".
5. In alternativa a questo tema, il tema "Edition" + il child theme
   "edition-child" (con solo le patch di performance/accessibilità)
   restano comunque installati e funzionanti: coprono gran parte delle
   stesse funzionalità nativamente, essendo la base visiva che sia questo
   tema sia il frontend Next.js hanno sempre replicato.

## Changelog

| Versione | Data | Modifiche |
|---|---|---|
| 1.1.0 | 10/09/2026 | Aggiunti 9 blocchi dinamici per la parità funzionale col frontend headless: carosello hero (Featured), carosello recensioni, post più visti (tabella condivisa con "WP Most Popular"), reazioni Share/Love, pulsanti condivisione, blocco Recensione dettagliato (Review Criteria ACF), articoli correlati, tag più utilizzati, caroselli per tag (Salute/Conservazione). Il badge piccantezza ora legge il punteggio review vero (media dei Review Criteria) invece del solo campo semplice. Riscritto "Chi sono" col testo e le foto reali del sito. Nuova griglia con sidebar per archivio/ricerca/blog. |
| 1.0.0 | 19/08/2026 | Prima versione: tema a blocchi FSE, badge piccantezza (campo semplice), griglie articoli, pattern base. |
