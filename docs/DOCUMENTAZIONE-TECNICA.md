# Documentazione Tecnica — PeperonciniPiccanti.com (Migrazione Headless)

| | |
|---|---|
| **Versione documento** | 1.0 |
| **Data** | 10 settembre 2026 |
| **Autore/manutentore** | Daniele Ibba |
| **Stato progetto** | Migrazione completata e in produzione; ottimizzazione continua |

> Changelog del documento in fondo (§14). Aggiornare la versione e la data a ogni modifica sostanziale.

---

## 1. Executive summary

`peperoncinipiccanti.com` è stato migrato da un sito WordPress "classico" (tema
`peperoncini-piccanti`, rendering lato server via PHP/tema) a un'architettura
**headless**: WordPress resta il CMS (editor, media, tassonomie, commenti,
SEO), ma non serve più pagine ai visitatori. Le pagine pubbliche sono generate
da un **frontend Next.js** ospitato su **Vercel**, che legge i contenuti dalla
REST API di WordPress.

Motivazione: margine di ottimizzazione Core Web Vitals molto più ampio
(Server Components, immagini ottimizzate automaticamente, cache/ISR granulare)
rispetto a un tema WordPress tradizionale, al costo di maggiore complessità
operativa (due sistemi da mantenere invece di uno, un ambiente Node da
gestire).

Questo documento copre: repository e workflow Git, hosting Vercel, dominio e
DNS, hosting/CMS WordPress, plugin, API interne, interventi SEO e performance
fatti finora, problemi noti e prossimi passi.

---

## 2. Architettura generale

```
Visitatore
    │
    ▼
www.peperoncinipiccanti.com  (Vercel — Next.js 16, App Router, React 19)
    │
    │  fetch server-side, con cache/ISR (lib/wp.ts)
    ▼
cms.peperoncinipiccanti.com  (WordPress headless — Serverplan/cPanel)
    │
    │  webhook di revalidazione al salvataggio di un articolo
    ▲  (wp-plugin/peperoncini-headless-companion.php → POST /api/revalidate)
    └──────────────────────────────────────────────────────────────────┘
```

- **WordPress** (`cms.peperoncinipiccanti.com`) resta il CMS: editor, media
  library, tassonomie (categorie/tag), campo "piccantezza" (Review Criteria),
  commenti, SEO on-page (Yoast). Il tema WordPress installato (`Edition`,
  ThemeForest) **non viene più mostrato ai visitatori reali** — resta attivo
  solo perché WordPress richiede sempre un tema, e perché il frontend Next.js
  replica visivamente la sua identità grafica (nero/teal/corallo, badge
  piccantezza, card "magazine").
- **Next.js** (`www.peperoncinipiccanti.com`, hosting Vercel) genera l'HTML
  lato server (Server Components, zero JavaScript per la maggior parte delle
  pagine tranne il carosello hero) leggendo i contenuti dalla REST API di
  WordPress, con **cache e Incremental Static Regeneration (ISR)**.
- **Plugin companion** (`wp-plugin/peperoncini-headless-companion.php`,
  installato solo su WordPress) espone endpoint REST custom necessari al
  frontend (punteggio review, post in evidenza, post più visti, contatori
  share/love) e avvisa Next.js via webhook quando un contenuto cambia, così
  la cache si aggiorna in pochi secondi invece di aspettare la scadenza
  naturale.

### 2.1 Perché due domini (`www.` e `cms.`)

Il dominio pubblico `www.peperoncinipiccanti.com` serve l'app Next.js.
Il sottodominio `cms.peperoncinipiccanti.com` è **il WordPress vero e
proprio**: stesso hosting di sempre (Serverplan), stesso database, stesso
`wp-admin/`. Separare i due domini permette di:

- avere un'app Next.js "pulita" su Vercel, senza dover far coesistere
  PHP/WordPress sullo stesso hosting;
- continuare a usare wp-admin esattamente come prima per scrivere articoli;
- deindicizzare il CMS dai motori di ricerca (§9.4) senza toccare il sito
  pubblico.

---

## 3. Repository GitHub — Frontend Next.js

- **Nome progetto locale**: `peperoncini-piccanti-frontend` (da `package.json`)
- **Remote**: `https://github.com/peperoncinipiccanti/peperoncini-piccanti-nextjs.git`
- **Branch principale**: `main`
- **Workflow**: manuale. Le modifiche vengono preparate/commitate in locale,
  poi l'utente esegue lui stesso, dal proprio terminale:
  ```bash
  git pull
  git add -A
  git push
  ```
  (Claude non ha accesso push diretto al repository in questo progetto.)
- **Deploy**: Vercel è collegato al repository via integrazione Git nativa —
  ogni push su `main` triggera automaticamente un nuovo deploy in produzione
  (nessuna pipeline CI/CD custom, il deploy è gestito interamente da Vercel).

### 3.1 Struttura del repository

```
peperoncini-nextjs/
├── app/
│   ├── [...slug]/page.tsx     # catch-all: articolo singolo O archivio categoria/tag
│   ├── api/
│   │   ├── comments/route.ts  # invio nuovo commento
│   │   ├── react/route.ts     # proxy verso pphc/v1/react (share/love)
│   │   ├── revalidate/route.ts# webhook chiamato da WordPress
│   │   └── track-view/route.ts# proxy verso pphc/v1/track-view
│   ├── cerca/page.tsx         # ricerca
│   ├── layout.tsx             # layout globale, JSON-LD Organization/WebSite
│   ├── page.tsx                # homepage
│   ├── robots.ts               # genera /robots.txt
│   └── sitemap.ts              # genera /sitemap.xml
├── components/                 # ~30 componenti React (vedi §3.2)
├── lib/
│   ├── format.ts                # formattazione date/numeri
│   ├── schema.ts                 # helper schema.org/JSON-LD
│   ├── site.ts                    # costanti (SITE_URL, SITE_NAME, LOGO_URL)
│   ├── social.ts                  # conteggio fan Facebook/Instagram
│   ├── types.ts                    # tipi TypeScript (Post, WPPost, ecc.)
│   └── wp.ts                        # TUTTE le chiamate alla REST API di WP
├── wp-plugin/
│   └── peperoncini-headless-companion.php  # plugin WordPress companion (§8.4)
├── next.config.mjs              # remotePatterns immagini, rewrite /wp-content/*
├── package.json
├── README.md                     # guida rapida setup/deploy (utile, tenerlo aggiornato)
└── docs/
    └── DOCUMENTAZIONE-TECNICA.md # questo documento
```

### 3.2 Stack tecnico (da `package.json`)

| Libreria | Versione | Note |
|---|---|---|
| Next.js | ^16.3.0 | App Router, Server Components |
| React / React DOM | ^19.1.0 | |
| TypeScript | ^5.7.0 | strict mode attivo |
| Tailwind CSS | ^4.3.3 | via `@tailwindcss/postcss` |
| `@tailwindcss/typography` | ^0.5.15 | classi `prose` per il corpo articolo |
| `lucide-react` | ^0.469.0 | set di icone |
| ESLint | ^9.15.0 | regole `next/core-web-vitals` + `next/typescript` |

Node.js richiesto: 20+. `browserslist` in `package.json`:
`"defaults and fully supports es6-module"` + `"maintained node versions"`
(target moderno, per minimizzare i polyfill — vedi problema noto in §12.2).

### 3.3 Variabili d'ambiente (`.env.local` in locale, "Environment Variables" su Vercel)

| Variabile | Valore (produzione) | Uso |
|---|---|---|
| `WP_API_URL` | `https://cms.peperoncinipiccanti.com` | base URL per tutte le chiamate REST a WordPress |
| `NEXT_PUBLIC_SITE_URL` | `https://www.peperoncinipiccanti.com` | usato per sitemap, robots, Open Graph/canonical assoluti |
| `REVALIDATE_SECRET` | *(segreto, vedi gestore password)* | token condiviso con il plugin WP per autenticare il webhook di revalidazione |

Lo stesso valore di `REVALIDATE_SECRET` deve essere presente anche in
`wp-config.php` sul WordPress come `PPHC_REVALIDATE_SECRET` (§8.4).

---

## 4. Hosting Vercel

- **Team/account**: `vercel.com/peperoncinipiccanti`
- **Progetto**: `peperoncini-piccanti-nextjs`
- **Piano**: Hobby
- **Framework preset**: Next.js (rilevato automaticamente)

### 4.1 Domini collegati al progetto Vercel

| Dominio | Ruolo | Redirect configurato |
|---|---|---|
| `www.peperoncinipiccanti.com` | **Produzione** (serve l'app) | — |
| `peperoncinipiccanti.it` | Redirect | → `https://www.peperoncinipiccanti.com` (Redirect to Another Domain, 308) |
| `www.peperoncinipiccanti.it` | Redirect | → `https://www.peperoncinipiccanti.com` (Redirect to Another Domain, 308) |

Configurati da **Settings → Domains** nel progetto Vercel. Il dominio apice
`peperoncinipiccanti.com` (senza www) **non è registrato come dominio Vercel**
— la redirezione verso `www.` avviene lato hosting WordPress/Serverplan,
non su Vercel (dettaglio importante, vedi §6.3).

### 4.2 Cache / ISR (Incremental Static Regeneration)

- Le fetch verso WordPress in `lib/wp.ts` usano `next: { revalidate: 3600, tags: [...] }`
  — cache di **1 ora** di default, con **cache tag** granulari
  (`posts`, `categories`, `popular`, `post:<slug>`, `comments`, `comments:<postId>`).
- Il webhook `/api/revalidate` (chiamato da WordPress a ogni pubblicazione/
  modifica) invalida i tag pertinenti con `revalidateTag(tag, 'max')`,
  aggiornando il sito in pochi secondi invece di aspettare l'ora di cache.
- **Route dinamiche vs statiche**: `app/[...slug]/page.tsx` legge
  `searchParams` (parametro `pagina`) SOLO nei rami categoria/tag, non
  incondizionatamente — leggerlo sempre avrebbe forzato Next.js a trattare
  *ogni* pagina (inclusi gli articoli) come dinamica, bypassando la cache
  CDN di Vercel. Bug corretto il 7 settembre 2026 (commit `ba89fff`), era
  la causa più probabile del warning Search Console "LCP scarsa, dati
  insufficienti" su ~20 articoli a basso traffico.
- Verifica pratica: header di risposta `x-vercel-cache: HIT` = pagina
  servita da CDN; `MISS` = rieseguita come funzione serverless (mai in
  cache). Utile per diagnosticare regressioni di questo tipo in futuro.

### 4.3 Ottimizzazione immagini (`next/image`)

- Formati serviti: **AVIF prima di WebP** (`images.formats` in
  `next.config.mjs`), fallback automatico al formato originale se il
  browser non supporta nessuno dei due.
- `remotePatterns` autorizza `cms.peperoncinipiccanti.com/wp-content/uploads/**`
  (l'host "corretto") **più**, temporaneamente, `www.peperoncinipiccanti.com`
  e `peperoncinipiccanti.com` in http e https: molti URL immagine nel
  database WordPress risalgono a quando il sito WordPress viveva ancora su
  quei domini. **Questa parte del config può essere ristretta ora** che il
  cleanup del database (§12.1, 10 settembre 2026) ha corretto la maggior
  parte di quei riferimenti — da rivalutare, non rimuovere finché non si è
  certi al 100% che non restino più URL vecchi in circolazione (cache di
  terzi, feed RSS, ecc.).

### 4.4 Rewrite di sicurezza `/wp-content/*`

`next.config.mjs` inoltra in modo permanente e trasparente qualsiasi
richiesta `/wp-content/*` fatta a `www.peperoncinipiccanti.com` verso
`cms.peperoncinipiccanti.com/wp-content/*`. Non è una soluzione temporanea:
resta una rete di sicurezza permanente per qualsiasi URL immagine vecchio,
mai aggiornato, che punti ancora al dominio sbagliato (pagine già in cache
su Google/social, browser di visitatori, backlink esterni non sotto il
nostro controllo).

### 4.5 Header di sicurezza

`next.config.mjs` → `headers()` imposta su tutte le route:
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.

---

## 5. Dominio e DNS

**Attenzione — punto delicato, letto male porta a confusione**: esistono
**due zone DNS distinte e non coincidenti** per `peperoncinipiccanti.com`.
Solo una delle due è quella davvero usata da Internet (autoritativa); l'altra
esiste ma non è "in ascolto" per il pubblico. Documentato qui perché scoperto
e verificato live il 10 settembre 2026, ed è facile fare l'errore di
modificare la zona sbagliata pensando di cambiare il sito in produzione.

### 5.1 Record DNS realmente attivi (verificati live via DNS-over-HTTPS, 10/09/2026)

| Host | Tipo | Valore | Verificato |
|---|---|---|---|
| `www.peperoncinipiccanti.com` | CNAME | `7259054701bcd76d.vercel-dns-017.com.` | ✅ risolve a Vercel, serve l'app Next.js |
| `peperoncinipiccanti.com` (apex) | A | `86.107.37.88` (IP condiviso Serverplan) | ✅ risponde con redirect HTTP 301 → `https://www.peperoncinipiccanti.com` |
| `peperoncinipiccanti.it` (apex) | A | `217.64.195.2` (anycast Vercel) | ✅ redirect Vercel → `https://www.peperoncinipiccanti.com` |
| `www.peperoncinipiccanti.it` | — | (redirect Vercel) | ✅ redirect → `https://www.peperoncinipiccanti.com` |
| `cms.peperoncinipiccanti.com` | A | `86.107.37.88` | ✅ serve WordPress (wp-admin, REST API) |

Questi valori **non sono quelli visibili nello Zone Editor di cPanel su
Serverplan** (§5.2) — la gestione DNS realmente autoritativa per l'apex/`www.`
va cercata nel pannello dove è stato configurato in origine il puntamento a
Vercel (nello stesso periodo/pannello usato per il dominio `.it`, verificare
se è lo stesso account TopHost usato per quest'ultimo, o un pannello diverso
legato alla registrazione del `.com`). **Da consolidare in una futura
revisione di questo documento**: individuare con certezza dove risiede lo
zone file autoritativo del `.com` e annotarlo qui.

### 5.2 Zone DNS "parallela" su Serverplan/cPanel (NON autoritativa per il pubblico)

cPanel genera automaticamente una zona DNS locale per ogni dominio ospitato
sull'account, con i record di servizio standard (mail, webmail, autodiscover,
DKIM/SPF/DMARC, ecc.), **indipendentemente dal fatto che quella zona sia
davvero quella interrogata da Internet**. Verificato che questa zona esiste
(cPanel → Domini → Zone Editor → `peperoncinipiccanti.com`, nameserver
`ns1.cmshigh.com` / `ns2.cmshigh.com`) e contiene, tra gli altri:

```
peperoncinipiccanti.com.        A       86.107.37.88
www.peperoncinipiccanti.com.    CNAME   peperoncinipiccanti.com
cms.peperoncinipiccanti.com.    A       86.107.37.88
mail.peperoncinipiccanti.com.   CNAME   peperoncinipiccanti.com
[+ record SPF/DKIM/DMARC per l'email, record CalDAV/CardDAV, ecc.]
```

Nota che qui `www` è CNAME verso l'apex (quindi tornerebbe a Serverplan, non
a Vercel) — in contraddizione con quanto risolve realmente Internet (§5.1).
Questo conferma che **i nameserver del dominio, a livello di registrar, NON
puntano a `ns1.cmshigh.com`/`ns2.cmshigh.com`**, altrimenti il sito pubblico
finirebbe sul vecchio WordPress invece che su Vercel. Questa zona resta utile
solo per i servizi email dell'account (`mail.`, `webmail.`, DKIM/SPF/DMARC) e
per `cms.peperoncinipiccanti.com`, che infatti risponde correttamente.

**Implicazione pratica**: se in futuro va modificato un record DNS per il
dominio principale (es. redirect, nuovo sottodominio pubblico), **non
modificarlo qui** — va cercato e modificato nel pannello DNS realmente
autoritativo (verosimilmente lo stesso usato per `.it`, da confermare).
Modificarlo solo qui su cPanel non avrebbe alcun effetto sul sito in
produzione, mentre modificare i record email (`mail.`, SPF/DKIM/DMARC) **va
fatto qui**, perché quelli sono effettivamente questa zona.

### 5.3 Redirect `peperoncinipiccanti.it` → `www.peperoncinipiccanti.com`

Il dominio `.it`, acquistato su **TopHost**, aveva inizialmente un problema:
la funzione nativa "Redirect dominio" di TopHost si rifiutava di attivarsi
("il dominio punta a un server diverso"). Soluzione adottata: puntare il
dominio `.it` direttamente ai DNS di Vercel (stesso pattern del `.com`:
A record sull'apex, CNAME su www) e configurare il redirect **lato Vercel**
(Settings → Domains → Edit → "Redirect to Another Domain", 308 Permanent
Redirect) invece che lato TopHost. Funzionante e verificato.

---

## 6. Backend WordPress — Hosting Serverplan

### 6.1 Dati account hosting

| Campo | Valore |
|---|---|
| Provider | Serverplan (cPanel) |
| Hostname server | `cms056.cmshigh.com` |
| Nameserver (di questo account) | `ns1.cmshigh.com`, `ns2.cmshigh.com` |
| Utente cPanel | `hcpepero` |
| Dominio primario account | `peperoncinipiccanti.com` |
| Home directory | `/home2/hcpepero` |
| IP condiviso | `86.107.37.88` |
| Database WordPress | `hcpepero_m3fi1` |
| Prefisso tabelle | `ek4r_` |
| SSL | Attivo |
| Piano/quota | 20 GB disco (14,57% usato), 20 database max (1 in uso), 50 sottodomini max (1 in uso — `cms.`) |

Accesso cPanel: `https://cms.peperoncinipiccanti.com:2083` (porta 2083,
oppure via l'area clienti Serverplan → gestione dominio → "Accedi al
pannello"). Credenziali nel gestore password / email di attivazione
Serverplan ("Credenziali di accesso cPanel e FTP").

### 6.2 Creazione del sottodominio `cms.`

`cms.peperoncinipiccanti.com` è un sottodominio dell'account cPanel
principale, con lo stesso document root/installazione WordPress già
esistente (non una nuova installazione separata) — è lo stesso sito
WordPress "storico" del blog, semplicemente esposto anche su questo secondo
hostname per servire da endpoint API dedicato al frontend headless, tenendo
il dominio pubblico (`www.`) libero per Next.js/Vercel.

### 6.3 Redirect dell'apex `peperoncinipiccanti.com` → `www.`

Osservato (10/09/2026): una richiesta a `https://peperoncinipiccanti.com/`
risponde con un redirect 301 verso `https://www.peperoncinipiccanti.com`.
**Il meccanismo esatto non è stato confermato con certezza in questa sessione**:
- non è un redirect configurato nello strumento cPanel "Reindirizzamenti"
  (verificato: elenco vuoto, "Non sono stati configurati reindirizzamenti
  per l'account");
- non sembra essere il redirect canonico nativo di WordPress (che punterebbe
  a `cms.`, l'attuale Site Address/home configurato in WordPress, non a `www.`);
- ipotesi più probabile: regola manuale in un file `.htaccess` nella
  document root dell'account (`public_html/`), da verificare via Gestione
  File se mai servisse modificarla.

**Da fare in una prossima sessione**: aprire Gestione File → abilitare
"Mostra file nascosti" → aprire `.htaccess` nella document root e
documentare qui la regola esatta.

### 6.4 Backup del database

Procedura verificata funzionante (10/09/2026): cPanel → **Backup** →
**Backup guidato** → Backup parziale → **Database** → seleziona
`hcpepero_m3fi1` → scarica `.sql.gz`. Nota: il primo tentativo di download
ha restituito errore HTTP 503 nella risposta della richiesta di rete
osservata, ma il file **si è comunque scaricato correttamente** (falso
allarme, verificato con l'utente) — non è chiaro se il codice 503 fosse
un problema del tracciamento della richiesta o un comportamento reale del
server che comunque non ha impedito il download; se capita di nuovo,
verificare il file scaricato prima di considerarlo un fallimento.

In alternativa: **phpMyAdmin** (cPanel → Database → phpMyAdmin, attenzione:
link con la "P" maiuscola, `PhpMyAdmin.html`) → seleziona database → tab
**Esporta** → metodo Rapido, formato SQL.

Serverplan esegue inoltre un backup automatico giornaliero su storage
esterno per i piani hosting (rete di sicurezza di base, non sostituisce un
backup "fresco" fatto immediatamente prima di un'operazione rischiosa).

---

## 7. Plugin WordPress installati

Confermati presenti (osservati in `wp-admin`, dashboard e menu laterale):

| Plugin | Funzione |
|---|---|
| **Peperoncini Piccanti – Companion Headless** | plugin custom di questo progetto — vedi §8.4 |
| **Yoast SEO** | SEO on-page, sitemap WordPress nativa (non usata dal frontend, che ha la propria in `app/sitemap.ts`), meta robots, dati strutturati lato WP |
| **EWWW Image Optimizer** | compressione/conversione WebP delle immagini caricate in libreria media |
| **W3 Total Cache (W3TC)** | cache lato WordPress (page/object cache); genera anche `Disallow: /wp-content/cache/` in `robots.txt` |
| **Akismet Anti-spam** | filtro spam commenti (ha bloccato ~478.000 commenti spam alla data di verifica) |
| **Duplicator** | backup/migrazione siti WordPress |
| **Ninja Forms** | form builder (probabilmente in uso per moduli di contatto nel tema, da verificare se ancora necessario in ottica headless) |
| **Redux** (Redux Framework) | framework per le opzioni del tema (`Theme Options`) |
| **Featured Order** | gestione ordine/flag "Featured" degli articoli — usato dal campo `is_featured`/`pphc_menu_order` letto dal frontend per il carosello hero |
| **Section** | (plugin/builder di sezioni per il tema, verificarne l'uso reale in ottica headless) |
| **SocialFans Counter** | conteggio fan Facebook/Instagram mostrato in home (richiesto dal tema `Edition`) |
| **Envato Market** | aggiornamenti del tema ThemeForest `Edition` (richiesto dal tema) |
| **Better Search Replace** | usato una tantum il 10/09/2026 per il cleanup dei link `http://www.peperoncinipiccanti.com` residui nel database (§12.1) — può restare installato per manutenzione futura o essere rimosso se non serve più |

Consigliati dal tema (notifica "This theme recommends…") ma **non confermato
se effettivamente installati/attivi**: Comet Cache, WooCommerce, WooCommerce
Menu Cart, WooCommerce Quantity Increment — probabilmente non necessari
(nessuna funzionalità e-commerce in uso sul sito).

---

## 8. API interne

### 8.1 Route Next.js (`app/api/`)

| Route | Metodo | Scopo |
|---|---|---|
| `/api/revalidate` | POST | Webhook chiamato da WordPress ad ogni pubblicazione/modifica articolo. Autenticato via header `x-revalidate-secret` (deve combaciare con `REVALIDATE_SECRET`). Invalida i cache tag `posts`, `categories`, `popular`, `post:<slug>`. |
| `/api/comments` | POST | Invio nuovo commento da parte di un visitatore (i commenti restano in moderazione, approvati da wp-admin) |
| `/api/react` | POST | Proxy verso `pphc/v1/react` di WordPress — incrementa contatore "share" o "love" di un articolo |
| `/api/track-view` | POST | Proxy verso `pphc/v1/track-view` — traccia una visualizzazione per il widget "post più visti" |

### 8.2 Endpoint REST custom esposti da WordPress (plugin companion)

| Endpoint | Metodo | Scopo |
|---|---|---|
| `wp-json/pphc/v1/popular` | GET | Restituisce i post più visti (weekly/monthly/all_time), compatibile con la tabella dati di "WP Most Popular" |
| `wp-json/pphc/v1/track-view` | POST | Incrementa il conteggio visualizzazioni di un post |
| `wp-json/pphc/v1/react` | POST | Incrementa `shares_count` o `votes_count` (stessi campi meta storici del vecchio tema) |

### 8.3 Campi custom aggiunti alla REST API standard di WordPress (`wp/v2/posts`)

Registrati dal plugin companion via `rest_api_init`: `pphc_review` (punteggio
medio dei "Review Criteria" del tema), `is_featured` + `pphc_menu_order`
(flag/ordine per il carosello hero), `pphc_shares` + `pphc_loves` (contatori
reazioni).

### 8.4 Plugin companion — `wp-plugin/peperoncini-headless-companion.php`

Plugin indipendente dal tema attivo, ~600 righe, **va installato solo sul
WordPress che fa da CMS/API** (`cms.peperoncinipiccanti.com`), non sul
frontend (che non è WordPress). Responsabilità:

1. Espone i campi/endpoint custom sopra elencati (§8.2, §8.3).
2. Gestisce CORS per la REST API (filtro `rest_authentication_errors`),
   attualmente predisposto ma non strettamente necessario finché tutte le
   fetch avvengono lato server Next.js (dove il CORS del browser non si
   applica) — utile se in futuro si aggiungono chiamate dirette dal browser.
3. **Webhook di revalidazione**: ad ogni `save_post` (articolo pubblicato/
   aggiornato) e ad ogni cambio della sola immagine in evidenza (evento
   separato, `updated_post_meta`/`added_post_meta` su `_thumbnail_id`, che
   NON passa da `save_post`), chiama `PPHC_REVALIDATE_URL` con header
   `x-revalidate-secret`. Richiede in `wp-config.php`:
   ```php
   define( 'PPHC_REVALIDATE_URL', 'https://www.peperoncinipiccanti.com/api/revalidate' );
   define( 'PPHC_REVALIDATE_SECRET', '<stesso valore di REVALIDATE_SECRET su Vercel>' );
   ```

---

## 9. SEO tecnico

### 9.1 Dati strutturati (schema.org / JSON-LD)

Aggiunti il 7 settembre 2026 (commit `277e12d`), prima assenti. Implementati
in `lib/schema.ts` + componente `components/JsonLd.tsx`:

- **Organization + WebSite** (con `SearchAction` verso `/cerca?q=`), renderizzati
  una volta in `app/layout.tsx` (quindi su ogni pagina).
- **BreadcrumbList** su pagine archivio e articolo.
- **Article** (`headline`, `datePublished`, `dateModified`, `author`,
  `publisher`) su ogni articolo.
- **Product + Review/AggregateRating** (`bestRating: 10, worstRating: 0`,
  coerente con la scala di valutazione 0-10 del sito) sugli articoli
  recensione — scelto `Product` (non un generico `Thing`) perché è tra i
  tipi supportati da Google per l'eleggibilità ai rich result "recensione".

### 9.2 Sitemap (`app/sitemap.ts`)

Genera `/sitemap.xml` con tutti gli articoli e le categorie. **Fix del 7
settembre 2026** (commit `f1ffee7`): il campo `date` restituito dalla REST
API di WordPress non include il timezone (es. `2012-05-25T10:41:54`, senza
`Z`), il che lo rende un `<lastmod>` non valido secondo lo standard W3C
Datetime — Search Console segnalava "Data non valida" su 137 URL. Corretto
convertendo la stringa in un oggetto `Date` (che Next.js serializza sempre
con `.toISOString()` completo di `Z`), con controllo di validità per non
far fallire l'intera sitemap su una singola data non parsabile.

### 9.3 Robots.txt (`app/robots.ts`)

```
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /cerca

Sitemap: https://www.peperoncinipiccanti.com/sitemap.xml
```

Le pagine tag (`/tag/<slug>`) **non sono bloccate e non sono in sitemap**:
restano indicizzabili (scoperte da Google via link interni, non tramite
sitemap), scelta deliberata — possono aiutare per query long-tail.

### 9.4 Noindex del CMS (`cms.peperoncinipiccanti.com`)

**Problema**: il tema WordPress classico è ancora tecnicamente raggiungibile
su `cms.peperoncinipiccanti.com` e generava pagine con `meta-robots: index,
follow` e **canonical auto-referenziato** (puntava a se stesso, non a
`www.`) — rischio concreto di contenuti duplicati indicizzati due volte.

**Fix applicato (10/09/2026)**: WordPress → Impostazioni → Lettura →
spuntata **"Chiedi ai motori di ricerca di non indicizzare questo sito"**.
WordPress applica automaticamente `<meta name="robots" content="noindex,
nofollow">` a tutte le pagine del tema. Verificato live (fetch diretta,
cache bypassata): il tag `noindex, nofollow` è effettivo immediatamente,
nessuna cache da svuotare in questo caso. **Non tocca** `robots.txt` (resta
`Disallow: /wp-content/cache/` di W3TC) — scelta corretta: bloccare anche
la scansione impedirebbe a Google di leggere il tag noindex, rallentando
un'eventuale deindicizzazione di pagine già note al motore di ricerca.
Nessun effetto sul sito pubblico `www.` (sistemi completamente separati,
il frontend Next.js non eredita nulla da questa impostazione: legge solo
JSON dalla REST API, non l'HTML del tema).

### 9.5 Link interni che puntavano erroneamente al CMS

**Problema**: i widget "Ultimi commenti" (`RecentComments`) e "I post più
visti" (`PopularPostsWidget`) usavano rispettivamente il campo `comment.link`
e `post.link` così come restituiti da WordPress — entrambi puntano sempre al
dominio `cms.peperoncinipiccanti.com` (l'unico "sito" che WordPress conosce
di sé, a prescindere dal cutover DNS del frontend), e ora quel dominio è in
noindex. Risultato: il sito pubblico linkava se stesso verso una copia
deindicizzata sul CMS invece che alla pagina corrispondente su `www.`.

**Fix (commit `7b47d03`, 10/09/2026)**: ricostruito l'URL sul frontend a
partire dallo slug già disponibile nei dati (`/${post.slug}`, con
`#comment-<id>` per i commenti) invece di fidarsi del campo `link`/`href`
pronto dalla API.

---

## 10. Performance / Core Web Vitals

Interventi fatti tra il 6 e l'8 settembre 2026:

| Data | Commit | Intervento |
|---|---|---|
| 06/09 | `4e57143` | Parallelizzate le fetch della homepage (erano ~11 chiamate sequenziali a WordPress) → fix TTFB |
| 06/09 | `6b2c41d` | Ottimizzato caricamento Google Analytics 4, ridotti polyfill inutili |
| 07/09 | `ba89fff` | **Fix critico**: `searchParams` letto incondizionatamente rendeva dinamiche (non cacheabili da Vercel) TUTTE le pagine articolo — vedi §4.2 |
| 07/09 | `87db32f` | Immagini nel corpo degli articoli sovradimensionate: corretto l'attributo `sizes` per farlo combaciare con la larghezza reale renderizzata (Tailwind Typography, colonna prose ~700px desktop) — fino a 178 KiB risparmiati per pagina |
| 07/09 | `94315af` | `fetchpriority="high"` mancante sull'immagine LCP — comportamento cambiato in Next.js 16: `priority` non imposta più da solo `fetchpriority` sull'`<img>` renderizzato, va aggiunto esplicitamente. Applicato su 4 componenti: `HeroCarousel`, `Header` (logo), `PostCard`, articolo singolo |
| 08/09 | `f855e7f` | Stesso tipo di fix immagini applicato alle card (`PostCard`, riusata in griglie con larghezze diverse: home, sidebar, archivio, correlati) — ogni chiamata ora passa un `sizes` specifico per la propria griglia invece di un valore generico, fino a ~94 KiB risparmiati |

**Metodologia importante da ricordare**: PageSpeed Insights mostra due tipi
di dati — **lab data** (singola simulazione Lighthouse, riflette subito il
codice attuale) e **field data** (dati reali utenti via CrUX, finestra
mobile di 28 giorni, è quello che determina il verdetto "Core Web Vitals
superata/non superata" su Search Console). Un fix di oggi migliora subito il
lab data ma **non si riflette nel field data/verdetto finché non passano
utenti reali sulle pagine corrette nelle settimane successive** — da
comunicare sempre per gestire le aspettative dopo un deploy.

Solo **LCP, INP, CLS** fanno parte ufficialmente delle Core Web Vitals; FCP
e TTFB sono "altre metriche rilevanti" diagnostiche, non determinano da sole
il verdetto pass/fail. Una metrica con dati insufficienti (es. INP "N/D" su
un sito a basso traffico) viene **esclusa** dal calcolo, non conta come
fallita.

---

## 11. Ottimizzazione immagini WordPress (lato CMS)

- Plugin scelto per servire WebP: **Converter for Media** (consigliato al
  posto di alternative più pesanti/meno mantenute), in combinazione con
  **EWWW Image Optimizer** già installato — nessun conflitto tra i due, solo
  attenzione all'ordine di attivazione/rigenerazione miniature con
  **Regenerate Thumbnails** se usato in futuro.

---

## 12. Problemi noti / debito tecnico

### 12.1 Cleanup contenuti misti — COMPLETATO il 10/09/2026

Contenuto storico (articoli scritti dal 2012 in poi) conteneva riferimenti
hardcoded a `http://www.peperoncinipiccanti.com/...` (immagini nel corpo
articolo, dati commenti, cache Yoast, regole del plugin Redirection).
Verificato con dry-run di **Better Search Replace**: 3374 celle su 51
tabelle. Eseguita la sostituzione reale (`http://www.peperoncinipiccanti.com`
→ `https://www.peperoncinipiccanti.com`, case-insensitive, **GUID esclusi
deliberatamente** — sono identificatori permanenti, WordPress raccomanda di
non modificarli mai, e non sono usati dal frontend): 3374 celle aggiornate,
3289 righe, **numeri combacianti al 100% con il dry run**, verificato
live su un caso concreto post-fix. Backup del database scaricato prima
dell'operazione (§6.4).

Tabelle coinvolte per riferimento futuro: `posts` (1012, il vero contenuto),
`commentmeta`/`comments` (765+639), `yoast_seo_links` (810, cache Yoast,
si rigenera da sola), `redirection_404`/`redirection_logs` (96, solo log
storici), `redirection_items` (44, regole di redirect — da ricontrollare
manualmente che siano ancora coerenti), `options`/`users`/`yoast_indexable`
(8, configurazione minore).

**Da rivalutare**: ora che il DB è pulito, restringere i `remotePatterns`
temporanei in `next.config.mjs` (§4.3) che autorizzano ancora
`www.peperoncinipiccanti.com` oltre a `cms.` per le immagini.

### 12.2 JavaScript non diagnosticato

- **~27 KiB di JavaScript first-party "inutilizzato"** segnalato da
  PageSpeed Insights, non ancora identificato con precisione — servirebbe
  `next build` + bundle analyzer per isolare il chunk esatto, non eseguibile
  nell'ambiente sandbox usato finora (blocco di rete sul download dei font
  Google durante la build). Da fare in locale o in CI.
- **~14 KiB di polyfill "legacy"** (`Array.prototype.at/flat/flatMap`,
  `Object.fromEntries/hasOwn`, `String.prototype.trimEnd/trimStart`)
  persistono nonostante il `browserslist` in `package.json` sia già
  configurato su target moderni. Sospetto: provengono da una dipendenza di
  terze parti che li include a prescindere dalla configurazione del
  progetto — non ancora isolata quale.

### 12.3 Redirect dell'apex non documentato con certezza (§6.3)

Vedi §6.3 — comportamento verificato (redirect funzionante) ma meccanismo
esatto non confermato, da verificare via `.htaccess`.

### 12.4 Zona DNS autoritativa del `.com` non identificata con certezza (§5.1)

Sappiamo *cosa* risolve (verificato live), non *dove* esattamente viene
gestito quel record (quale pannello/provider). Da consolidare.

### 12.5 Limiti noti già presenti nel README del progetto

- Menu di navigazione hardcoded in `lib/wp.ts` (`getMenu()`), non letto da
  WordPress (la REST API core non espone i menu senza plugin dedicato).
- Risoluzione URL in `app/[...slug]/page.tsx` basata sull'ultimo segmento
  del percorso — per gerarchie di categorie molto profonde con slug
  duplicati tra rami diversi potrebbe generare ambiguità (non riscontrato
  finora).
- Contenuto articoli renderizzato con `dangerouslySetInnerHTML` a partire
  dall'HTML generato da WordPress (fonte fidata, è il nostro stesso CMS);
  per una protezione ulteriore si potrebbe filtrare con
  `isomorphic-dompurify` prima del render.

---

## 13. Changelog cronologico (dal repository Git)

Cronologia completa dei commit sul frontend, dalla prima messa a punto
grafica alla situazione attuale (per il dettaglio riga per riga, vedi
`git log`). Raggruppata per fase:

**25–31 agosto 2026 — Adattamento grafico e componenti principali**
Replica dell'identità visiva del tema `Edition` (logo, badge piccantezza,
top bar); carosello hero basato sui post "Featured"; homepage con sezione
recensioni + ultimi commenti; slider "Come conservare i peperoncini"; banner
CTA coltivazione; vari fix di layout/immagini mancanti.

**1–3 settembre 2026 — Funzionalità e pagine secondarie**
Widget "post più visti"; pagine tag cliccabili; menu hamburger mobile;
blocco "Chi sono"; ottimizzazione payload (fix warning "items over 2MB
can not be cached"); pagine categoria/tag con paginazione; blocco
"Peperoncino e Salute".

**5–6 settembre 2026 — Interazioni e integrazioni**
Sidebar + related post sulle pagine articolo; form commenti con lista
commenti approvati; contatori condivisioni/commenti/love con pulsanti di
reazione; cutover proxy `/wp-content/*` verso `cms.`; integrazione Google
Analytics 4; blocco Recensione con Review Criteria; parallelizzazione fetch
homepage.

**7–10 settembre 2026 — SEO e performance (questo ciclo di lavoro)**
Dati strutturati schema.org; fix cache/ISR pagine articolo; fix immagini
sovradimensionate (corpo articolo e card); fix sitemap `lastmod`; fix
`fetchpriority` sull'immagine LCP; setup dominio `.it` e redirect Vercel;
noindex del CMS; fix link interni verso il CMS; cleanup contenuti misti nel
database.

Per il changelog letterale (hash + messaggio commit), eseguire nella cartella
del progetto:
```bash
git log --reverse --date=short --pretty=format:'%ad | %h | %s'
```

---

## 14. Prossimi passi consigliati

1. Confermare dove risiede la zona DNS autoritativa del `.com` (§5.1, §12.4)
   e documentarla con certezza.
2. Verificare la regola `.htaccess` dietro al redirect apex → www (§6.3, §12.3).
3. Restringere `remotePatterns` in `next.config.mjs` ora che il DB è pulito (§12.1).
4. Diagnosticare il chunk JS "inutilizzato" (~27 KiB) con bundle analyzer in locale (§12.2).
5. Isolare la dipendenza che introduce i polyfill legacy residui (§12.2).
6. Rivalutare se Ninja Forms/Section sono ancora necessari in ottica headless (§7).
7. Attendere la finestra di 28 giorni di dati field CrUX per confermare il
   miglioramento reale dei Core Web Vitals dopo i fix di performance di
   questo ciclo (§10).
8. Valutare `isomorphic-dompurify` sul contenuto articolo (§12.5).

---

## Changelog del documento

| Versione | Data | Modifiche |
|---|---|---|
| 1.0 | 10/09/2026 | Prima stesura completa: architettura, GitHub, Vercel, DNS, hosting Serverplan/cPanel, plugin WordPress, API interne, interventi SEO/performance del ciclo 25/08–10/09/2026, problemi noti, changelog Git |
