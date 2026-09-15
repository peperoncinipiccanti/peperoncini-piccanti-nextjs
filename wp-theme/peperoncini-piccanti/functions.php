<?php
/**
 * Peperoncini Piccanti - funzioni del tema.
 *
 * Tema a blocchi (FSE). Le impostazioni "di design" vivono in theme.json;
 * qui restano solo le cose che richiedono PHP: setup, asset, blocco
 * dinamico, campo piccantezza, ottimizzazioni performance e SEO di base.
 *
 * @package PeperonciniPiccanti
 */

defined( 'ABSPATH' ) || exit;

const PP_THEME_VERSION = '1.1.0';

/**
 * Setup tema: supporto titolo automatico, immagini in evidenza, feed,
 * dimensioni immagine dedicate alle card del magazine.
 */
function pp_theme_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'editor-styles' );
	add_theme_support( 'wp-block-styles' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' ) );

	add_editor_style( 'assets/css/style.css' );

	register_nav_menus(
		array(
			'primary' => __( 'Menu principale', 'peperoncini-piccanti' ),
		)
	);

	// Formati card coerenti con il vecchio layout "magazine" (4:3), generati in WebP quando l'host lo supporta.
	add_image_size( 'pp-card', 640, 480, true );
	add_image_size( 'pp-hero', 1600, 900, true );
}
add_action( 'after_setup_theme', 'pp_theme_setup' );

/**
 * Rende scelte "pp-card" / "pp-hero" nel menu a tendina delle dimensioni
 * immagine dell'editor, cosi' non restano nascoste solo perche' non fanno
 * parte dei formati predefiniti di WordPress.
 */
function pp_custom_image_sizes( $sizes ) {
	return array_merge(
		$sizes,
		array(
			'pp-card' => __( 'Card articolo (4:3)', 'peperoncini-piccanti' ),
			'pp-hero' => __( 'Hero (16:9)', 'peperoncini-piccanti' ),
		)
	);
}
add_filter( 'image_size_names_choose', 'pp_custom_image_sizes' );

/**
 * Categoria dedicata per i pattern del tema, cosi' compaiono raggruppati
 * nell'inserter invece che sotto "Non categorizzato".
 */
function pp_register_pattern_category() {
	register_block_pattern_category(
		'peperoncini-piccanti',
		array( 'label' => __( 'Peperoncini Piccanti', 'peperoncini-piccanti' ) )
	);
}
add_action( 'init', 'pp_register_pattern_category' );

/**
 * Enqueue degli asset. Un solo file CSS aggiuntivo oltre a quello che WP
 * genera da theme.json: niente Bootstrap, niente Font Awesome, niente jQuery.
 */
function pp_enqueue_assets() {
	wp_enqueue_style(
		'peperoncini-piccanti-style',
		get_theme_file_uri( 'assets/css/style.css' ),
		array(),
		PP_THEME_VERSION
	);
}
add_action( 'wp_enqueue_scripts', 'pp_enqueue_assets' );

/**
 * Registra il blocco dinamico "Badge Piccantezza" (block.json con campo
 * "render", nessun JavaScript richiesto - disponibile da WP 6.5).
 */
function pp_register_blocks() {
	register_block_type( get_theme_file_path( 'blocks/rating-badge' ) );
}
add_action( 'init', 'pp_register_blocks' );

/**
 * Campo personalizzato "piccantezza" (0-10) usato dal badge circolare.
 * Esposto in REST cosi' e' editabile anche dall'editor a blocchi nel
 * pannello "Campi personalizzati" e recuperabile via API.
 */
function pp_register_meta() {
	register_post_meta(
		'post',
		'piccantezza',
		array(
			'type'              => 'number',
			'description'       => __( 'Livello di piccantezza da 0 a 10, mostrato come badge sulla card.', 'peperoncini-piccanti' ),
			'single'            => true,
			'show_in_rest'      => true,
			'sanitize_callback' => function ( $value ) {
				return max( 0, min( 10, (float) $value ) );
			},
			'auth_callback'     => function () {
				return current_user_can( 'edit_posts' );
			},
		)
	);
}
add_action( 'init', 'pp_register_meta' );

/**
 * Riquadro dedicato nell'editor per impostare la piccantezza senza dover
 * aprire il pannello generico "Campi personalizzati".
 */
function pp_add_rating_meta_box() {
	add_meta_box(
		'pp_rating_box',
		__( 'Livello di piccantezza', 'peperoncini-piccanti' ),
		'pp_render_rating_meta_box',
		'post',
		'side',
		'default'
	);
}
add_action( 'add_meta_boxes', 'pp_add_rating_meta_box' );

function pp_render_rating_meta_box( $post ) {
	$value = get_post_meta( $post->ID, 'piccantezza', true );
	wp_nonce_field( 'pp_save_rating', 'pp_rating_nonce' );
	printf(
		'<label for="pp_rating_field">%s</label><br /><input type="number" min="0" max="10" step="0.1" id="pp_rating_field" name="pp_rating_field" value="%s" style="width:100%%;margin-top:6px;" />',
		esc_html__( 'Da 0 (per niente) a 10 (estremo)', 'peperoncini-piccanti' ),
		esc_attr( $value )
	);
}

function pp_save_rating_meta_box( $post_id ) {
	if ( ! isset( $_POST['pp_rating_nonce'] ) || ! wp_verify_nonce( $_POST['pp_rating_nonce'], 'pp_save_rating' ) ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	if ( isset( $_POST['pp_rating_field'] ) && '' !== $_POST['pp_rating_field'] ) {
		$value = max( 0, min( 10, (float) $_POST['pp_rating_field'] ) );
		update_post_meta( $post_id, 'piccantezza', $value );
	} else {
		delete_post_meta( $post_id, 'piccantezza' );
	}
}
add_action( 'save_post', 'pp_save_rating_meta_box' );

/**
 * Molti articoli storici non hanno un'immagine in evidenza impostata nel
 * modo "standard" di WordPress: il vecchio tema pescava probabilmente la
 * prima immagine dal contenuto in un modo suo, non tramite il campo
 * ufficiale "Immagine in evidenza". Il blocco post-featured-image invece
 * si aspetta quel campo — se manca, la card resta senza foto e collassa
 * in altezza. Questo filtro ripiega automaticamente sulla prima immagine
 * trovata nel contenuto dell'articolo quando non c'e' un'immagine in
 * evidenza vera e propria, cosi' non serve risistemare a mano ogni post.
 */
function pp_fallback_featured_image( $html, $post_id, $post_thumbnail_id, $size, $attr ) {
	if ( $html ) {
		return $html; // ha gia' un'immagine in evidenza vera: non tocchiamo nulla.
	}

	$post = get_post( $post_id );
	if ( ! $post ) {
		return $html;
	}

	if ( preg_match( '/<img[^>]+src=["\']([^"\']+)["\']/i', $post->post_content, $matches ) ) {
		return sprintf(
			'<img src="%s" alt="%s" class="wp-post-image" loading="lazy" decoding="async" />',
			esc_url( $matches[1] ),
			esc_attr( get_the_title( $post ) )
		);
	}

	return $html;
}
add_filter( 'post_thumbnail_html', 'pp_fallback_featured_image', 10, 5 );

/**
 * ------------------------------------------------------------------
 * Performance / Core Web Vitals
 * ------------------------------------------------------------------
 */

// Via il codice inline degli emoji: una richiesta e uno script in meno che nessuno usa.
remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
remove_action( 'wp_print_styles', 'print_emoji_styles' );

// Via l'endpoint oEmbed e i relativi script se non si incorporano contenuti WordPress altrui.
remove_action( 'wp_head', 'wp_oembed_add_discovery_links' );
remove_action( 'wp_head', 'wp_oembed_add_host_js' );

// Via i link RSD/wlwmanifest, residui dell'era XML-RPC, inutili oggi.
remove_action( 'wp_head', 'rsd_link' );
remove_action( 'wp_head', 'wlwmanifest_link' );

/**
 * Preconnect al proprio dominio per i font self-hosted e, se in futuro si
 * usa un CDN per le immagini, punto unico dove aggiungerlo.
 */
function pp_resource_hints( $urls, $relation_type ) {
	if ( 'preconnect' === $relation_type ) {
		$urls[] = array( 'href' => home_url(), 'crossorigin' );
	}
	return $urls;
}
add_filter( 'wp_resource_hints', 'pp_resource_hints', 10, 2 );

/**
 * Precarica l'immagine dell'articolo aperto per primo nel carosello hero:
 * e' quasi sempre l'elemento LCP della home, precaricarla evita che il
 * browser la scopra solo dopo aver letto tutto l'HTML.
 */
function pp_preload_hero_image() {
	if ( ! is_front_page() ) {
		return;
	}

	$hero_query = new WP_Query(
		array(
			'posts_per_page'      => 1,
			'post_status'         => 'publish',
			'ignore_sticky_posts' => false,
			'no_found_rows'       => true,
			'update_post_meta_cache' => false,
			'update_post_term_cache'  => false,
		)
	);

	if ( ! $hero_query->have_posts() ) {
		return;
	}

	$hero_query->the_post();
	$image_id = get_post_thumbnail_id();
	wp_reset_postdata();

	if ( ! $image_id ) {
		return;
	}

	$src = wp_get_attachment_image_url( $image_id, 'pp-hero' );
	if ( $src ) {
		printf(
			'<link rel="preload" as="image" href="%s" fetchpriority="high" />' . "\n",
			esc_url( $src )
		);
	}
}
add_action( 'wp_head', 'pp_preload_hero_image', 1 );

/**
 * ------------------------------------------------------------------
 * SEO di base (integrare comunque con Yoast SEO o Rank Math per
 * sitemap XML, controllo meta manuale e anteprime social avanzate:
 * qui restano solo le basi tecniche indipendenti dal plugin scelto)
 * ------------------------------------------------------------------
 */

/**
 * Schema.org Article/Recipe minimale in JSON-LD sui singoli articoli,
 * cosi' il ricco snippet non dipende esclusivamente dal plugin SEO.
 * Se un plugin SEO genera gia' uno schema Article, disattivare questo
 * filtro per evitare markup duplicato (vedi documentazione allegata).
 */
function pp_article_schema() {
	if ( ! is_singular( 'post' ) ) {
		return;
	}

	$image_id  = get_post_thumbnail_id();
	$image_url = $image_id ? wp_get_attachment_image_url( $image_id, 'pp-hero' ) : '';
	// pp_get_rating() e' definita piu' sotto in questo file (sezione v1.1.0):
	// legge prima il punteggio review vero (media dei Review Criteria ACF del
	// tema Edition), con ripiego sul campo "piccantezza" storico di questo
	// tema — cosi' lo schema.org resta corretto per il contenuto reale del
	// sito, non solo per gli articoli impostati manualmente con quel campo.
	$rating = pp_get_rating( get_the_ID() );

	$schema = array(
		'@context'         => 'https://schema.org',
		'@type'            => 'Article',
		'headline'         => get_the_title(),
		'datePublished'    => get_the_date( DATE_W3C ),
		'dateModified'     => get_the_modified_date( DATE_W3C ),
		'author'           => array(
			'@type' => 'Person',
			'name'  => get_the_author(),
		),
		'mainEntityOfPage' => get_permalink(),
	);

	if ( $image_url ) {
		$schema['image'] = array( $image_url );
	}

	if ( null !== $rating ) {
		$schema['additionalProperty'] = array(
			'@type' => 'PropertyValue',
			'name'  => 'Piccantezza',
			'value' => (float) $rating,
			'maxValue' => 10,
			'minValue' => 0,
		);
	}

	echo '<script type="application/ld+json">' . wp_json_encode( $schema ) . '</script>' . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}
add_action( 'wp_head', 'pp_article_schema' );

/**
 * I file dei template a blocchi sono HTML statico, non PHP: il tag
 * <?php ?> al loro interno non verrebbe eseguito. Per l'unico valore
 * dinamico nel footer (l'anno corrente) usiamo quindi un semplice
 * placeholder testuale sostituito qui, dopo il rendering dei blocchi.
 */
function pp_replace_footer_placeholders( $block_content, $block ) {
	if ( is_string( $block_content ) && false !== strpos( $block_content, '{anno-corrente}' ) ) {
		$block_content = str_replace( '{anno-corrente}', esc_html( gmdate( 'Y' ) ), $block_content );
	}
	return $block_content;
}
add_filter( 'render_block', 'pp_replace_footer_placeholders', 10, 2 );

/**
 * ==================================================================
 * v1.1.0 — Blocchi dinamici per la parita' con il frontend headless
 * ==================================================================
 *
 * Tutto cio' che segue serve a leggere, DIRETTAMENTE dal database di
 * WordPress (nessuna chiamata REST, nessuna dipendenza da Vercel/Next.js
 * ne' dal plugin "Peperoncini Piccanti - Companion Headless"), gli stessi
 * dati che il frontend headless mostra oggi: punteggio recensione,
 * articoli "Featured", post piu' visti, condivisioni/love, articoli
 * correlati. Cosi' questo tema puo' essere attivato in qualsiasi momento
 * come sostituto completo del sito headless, con lo storico dati intatto
 * (stessi meta key, stessa tabella del plugin "WP Most Popular").
 *
 * Il plugin companion, se resta installato e attivo insieme a questo
 * tema, NON va in conflitto: legge/scrive esattamente le stesse colonne
 * e chiavi meta (vedi i commenti su ciascuna funzione sotto), quindi i
 * numeri restano coerenti sia che li guardi da qui sia dal sito headless.
 */

/**
 * Legge il blocco "Recensione" di un articolo (campi ACF del tema
 * Edition: review_post Si/No, review_criteria = ripetitore di coppie
 * criteria/rating 0-10, review_title, review_summary). Stessa identica
 * logica di pphc_register_review_field() nel plugin companion — vedi
 * quel file per la storia di come questi nomi di campo sono stati
 * scoperti. Se ACF non e' attivo (plugin disinstallato) o l'articolo non
 * e' marcato come review, ritorna null: niente badge da mostrare.
 *
 * @return array{score:?float,title:string,summary:string,criteria:array<array{label:string,rating:?float}>}|null
 */
function pp_get_review( $post_id ) {
	static $cache = array();
	if ( isset( $cache[ $post_id ] ) ) {
		return $cache[ $post_id ];
	}

	if ( ! function_exists( 'get_field' ) ) {
		return $cache[ $post_id ] = null;
	}

	$is_review = get_field( 'review_post', $post_id );
	if ( 'yes' !== $is_review && true !== $is_review && '1' !== $is_review && 'Yes' !== $is_review ) {
		return $cache[ $post_id ] = null;
	}

	$rows     = get_field( 'review_criteria', $post_id );
	$criteria = array();
	$total    = 0;
	$count    = 0;

	if ( is_array( $rows ) ) {
		foreach ( $rows as $row ) {
			$label  = isset( $row['criteria'] ) ? sanitize_text_field( $row['criteria'] ) : '';
			$rating = isset( $row['rating'] ) && '' !== $row['rating'] ? (float) $row['rating'] : null;

			if ( '' === $label && null === $rating ) {
				continue;
			}

			$criteria[] = array( 'label' => $label, 'rating' => $rating );

			if ( null !== $rating ) {
				$total += $rating;
				++$count;
			}
		}
	}

	$result = array(
		'score'    => $count > 0 ? round( $total / $count, 1 ) : null,
		'title'    => (string) get_field( 'review_title', $post_id ),
		'summary'  => (string) get_field( 'review_summary', $post_id ),
		'criteria' => $criteria,
	);

	$cache[ $post_id ] = $result;
	return $result;
}

/**
 * Punteggio 0-10 da mostrare sul badge circolare: quello del blocco
 * Recensione se l'articolo ne ha uno (vedi pp_get_review sopra), con
 * ripiego sul semplice campo "piccantezza" di questo tema (v1.0, vedi
 * pp_register_meta piu' sopra in questo file) se presente — cosi' un
 * badge impostato a mano prima che ACF/il plugin companion fossero
 * collegati resta comunque visibile, invece di sparire silenziosamente.
 */
function pp_get_rating( $post_id ) {
	$review = pp_get_review( $post_id );
	if ( $review && null !== $review['score'] ) {
		return (float) $review['score'];
	}

	$legacy = get_post_meta( $post_id, 'piccantezza', true );
	if ( '' !== $legacy && null !== $legacy ) {
		return max( 0, min( 10, (float) $legacy ) );
	}

	return null;
}

/**
 * Se l'articolo e' marcato "Featured" nel backoffice (campo ACF radio
 * Yes/No del tema Edition, registrato via PHP nel tema — per questo non
 * compare tra i gruppi di campi ACF ne' viene esposto in REST di
 * default), usato dal carosello hero in prima pagina insieme all'ordine
 * scelto in "Featured Order" (salvato nel campo nativo `menu_order`).
 * Stessa identica logica tollerante di pphc_register_featured_fields().
 */
function pp_is_featured( $post_id ) {
	if ( ! function_exists( 'get_field' ) ) {
		return false;
	}
	$value = get_field( 'featured', $post_id );
	return true === $value || '1' === $value || 'Yes' === $value;
}

/**
 * Articoli per il carosello hero: quelli marcati "Featured" (vedi sopra),
 * ordinati per `menu_order` (l'ordine scelto in "Featured Order"). Si
 * scorre gli ultimi 100 articoli pubblicati invece di usare una meta_query
 * su "featured" perche' il modo in cui ACF salva un campo radio Si/No
 * puo' variare (stringa "Yes", "1", booleano...) — vedi lo stesso motivo
 * documentato in pp_is_featured(). Se nessun articolo e' marcato Featured
 * (es. subito dopo l'attivazione del tema, prima di configurare nulla),
 * si ripiega sugli ultimi articoli pubblicati cosi' l'hero non resta mai
 * vuoto.
 */
function pp_get_featured_posts( $limit = 4 ) {
	$candidates = get_posts(
		array(
			'post_type'              => 'post',
			'post_status'            => 'publish',
			'posts_per_page'         => 100,
			'no_found_rows'          => true,
			'update_post_term_cache' => false,
			'fields'                 => 'ids',
		)
	);

	$featured = array_values( array_filter( $candidates, 'pp_is_featured' ) );

	if ( empty( $featured ) ) {
		return array_slice( $candidates, 0, $limit );
	}

	usort(
		$featured,
		function ( $a, $b ) {
			return (int) get_post_field( 'menu_order', $a ) <=> (int) get_post_field( 'menu_order', $b );
		}
	);

	return array_slice( $featured, 0, $limit );
}

/**
 * ------------------------------------------------------------------
 * Post piu' visti (Settimana/Mese/Sempre) — stessa tabella e stesse
 * colonne del plugin "WP Most Popular" / del plugin companion headless
 * (pphc_most_popular_table): {prefix}most_popular, colonne
 * 1_day_stats/7_day_stats/30_day_stats/all_time_stats/raw_stats. Se il
 * plugin companion resta attivo insieme a questo tema, entrambi leggono
 * e scrivono la STESSA tabella: nessun doppio conteggio, nessun dato
 * scollegato.
 * ------------------------------------------------------------------
 */
function pp_most_popular_table() {
	global $wpdb;
	return $wpdb->prefix . 'most_popular';
}

function pp_most_popular_table_exists() {
	global $wpdb;
	$table = pp_most_popular_table();
	// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- $table da $wpdb->prefix, nessun input utente.
	return $wpdb->get_var( "SHOW TABLES LIKE '{$table}'" ) === $table;
}

function pp_ensure_most_popular_table() {
	global $wpdb;
	if ( pp_most_popular_table_exists() ) {
		return;
	}

	$table           = pp_most_popular_table();
	$charset_collate = $wpdb->get_charset_collate();
	require_once ABSPATH . 'wp-admin/includes/upgrade.php';

	$sql = "CREATE TABLE {$table} (
		id BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
		post_id BIGINT NOT NULL,
		last_updated DATETIME NOT NULL,
		`1_day_stats` MEDIUMINT NOT NULL,
		`7_day_stats` MEDIUMINT NOT NULL,
		`30_day_stats` MEDIUMINT NOT NULL,
		all_time_stats BIGINT NOT NULL,
		raw_stats TEXT NOT NULL
	) {$charset_collate};";

	dbDelta( $sql );
}
register_activation_hook( __FILE__, 'pp_ensure_most_popular_table' );

/**
 * Incrementa la visita odierna di un articolo nella tabella condivisa.
 * Agganciata a `template_redirect` (non a un beacon JS separato come nel
 * sito headless: qui le pagine le serve di nuovo WordPress stesso, quindi
 * si puo' tracciare direttamente lato server) con un filtro minimo
 * anti-bot basato sullo user agent — non perfetto (nessun filtro lo e'
 * mai davvero), ma sufficiente a non gonfiare i numeri con i crawler piu'
 * comuni, coerente con l'approccio "meglio di niente" gia' usato dal
 * vecchio plugin "WP Most Popular".
 */
function pp_maybe_track_view() {
	if ( ! is_singular( 'post' ) || is_preview() || wp_doing_ajax() || defined( 'REST_REQUEST' ) ) {
		return;
	}

	$user_agent = isset( $_SERVER['HTTP_USER_AGENT'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : '';
	if ( '' === $user_agent || preg_match( '/bot|crawl|spider|slurp|bingpreview|facebookexternalhit/i', $user_agent ) ) {
		return;
	}

	global $post;
	if ( ! $post ) {
		return;
	}

	pp_track_view( $post->ID );
}
add_action( 'template_redirect', 'pp_maybe_track_view' );

function pp_track_view( $post_id ) {
	global $wpdb;
	$table = pp_most_popular_table();

	if ( ! pp_most_popular_table_exists() ) {
		pp_ensure_most_popular_table();
	}

	$date = gmdate( 'Y-m-d' );
	$raw  = $wpdb->get_var( $wpdb->prepare( "SELECT raw_stats FROM {$table} WHERE post_id = %d", $post_id ) );

	if ( null === $raw ) {
		$wpdb->query(
			$wpdb->prepare(
				"INSERT INTO {$table} (post_id, last_updated, `1_day_stats`, `7_day_stats`, `30_day_stats`, all_time_stats, raw_stats) VALUES (%d, NOW(), 0, 0, 0, 0, '')",
				$post_id
			)
		);
		$stats = array();
	} else {
		$stats = $raw ? (array) unserialize( $raw ) : array(); // phpcs:ignore WordPress.PHP.NoSilencedErrors, WordPress.PHP.DiscouragedPHPFunctions.serialize_unserialize
	}

	$stats[ $date ] = isset( $stats[ $date ] ) ? $stats[ $date ] + 1 : 1;

	$sum_last_days = function ( $days ) use ( $stats ) {
		$total = 0;
		for ( $i = 0; $i < $days; $i++ ) {
			$day = gmdate( 'Y-m-d', strtotime( "-{$i} days" ) );
			if ( isset( $stats[ $day ] ) ) {
				$total += $stats[ $day ];
			}
		}
		return $total;
	};

	$wpdb->query(
		$wpdb->prepare(
			"UPDATE {$table} SET `1_day_stats` = %d, `7_day_stats` = %d, `30_day_stats` = %d, all_time_stats = all_time_stats + 1, last_updated = NOW(), raw_stats = %s WHERE post_id = %d",
			$sum_last_days( 1 ),
			$sum_last_days( 7 ),
			$sum_last_days( 30 ),
			serialize( $stats ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_unserialize
			$post_id
		)
	);
}

/**
 * Sceglie l'URL migliore per una miniatura, provando dimensioni via via
 * piu' grandi finche' WordPress non ne conferma una valida — stesso
 * principio di pphc_best_thumbnail_url() nel plugin companion, per non
 * lasciare un widget rotto quando la variante piu' piccola manca.
 */
function pp_best_thumbnail_url( $thumb_id, $size = 'pp-card' ) {
	foreach ( array( $size, 'medium', 'thumbnail', 'full' ) as $try ) {
		$url = wp_get_attachment_image_url( $thumb_id, $try );
		if ( $url ) {
			return $url;
		}
	}
	return null;
}

function pp_get_popular_posts( $limit = 5 ) {
	global $wpdb;

	$empty = array(
		'weekly'   => array(),
		'monthly'  => array(),
		'all_time' => array(),
	);

	if ( ! pp_most_popular_table_exists() ) {
		return $empty;
	}

	$table = pp_most_popular_table();

	// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- $table da $wpdb->prefix, nessun input utente.
	$rows = $wpdb->get_results(
		"
		SELECT p.ID, mp.`7_day_stats` AS weekly, mp.`30_day_stats` AS monthly, mp.all_time_stats AS all_time
		FROM {$table} mp
		INNER JOIN {$wpdb->posts} p ON mp.post_id = p.ID
		WHERE p.post_type = 'post' AND p.post_status = 'publish'
		"
	);

	if ( ! $rows ) {
		return $empty;
	}

	// Ogni voce e' ['id' => ID articolo, 'views' => conteggio per QUEL range]:
	// il render.php del blocco Post piu' visti mostra il numero accanto al
	// titolo senza dover rifare una query per recuperarlo a parte.
	$build_range = function ( $field ) use ( $rows, $limit ) {
		$copy = $rows;
		usort(
			$copy,
			function ( $a, $b ) use ( $field ) {
				return $b->$field <=> $a->$field;
			}
		);
		$copy = array_slice( $copy, 0, $limit );
		return array_map(
			function ( $row ) use ( $field ) {
				return array( 'id' => (int) $row->ID, 'views' => (int) $row->$field );
			},
			$copy
		);
	};

	return array(
		'weekly'   => $build_range( 'weekly' ),
		'monthly'  => $build_range( 'monthly' ),
		'all_time' => $build_range( 'all_time' ),
	);
}

/**
 * ------------------------------------------------------------------
 * Condivisioni / Love — stessi post meta storici del vecchio tema
 * Edition (`shares_count`, `votes_count`), stessa chiave letta e scritta
 * dal plugin companion: nessuna migrazione, nessun contatore separato.
 * ------------------------------------------------------------------
 */
function pp_get_shares( $post_id ) {
	return (int) get_post_meta( $post_id, 'shares_count', true );
}

function pp_get_loves( $post_id ) {
	return (int) get_post_meta( $post_id, 'votes_count', true );
}

/**
 * Endpoint REST per incrementare "share" o "love" dal browser del
 * visitatore (chiamato dal JS dei blocchi Reactions/Share Buttons).
 * Stesso namespace/route del plugin companion (pphc/v1/react) cosi' un
 * eventuale doppio caricamento (tema + plugin entrambi attivi) non
 * registra due route diverse per la stessa cosa — se il plugin e' gia'
 * attivo la sua route "vince" (registrata per prima) e questa non viene
 * ri-registrata da WordPress; se il plugin non c'e', la fornisce il tema.
 */
function pp_register_reaction_route() {
	if ( function_exists( 'pphc_handle_reaction' ) ) {
		return; // il plugin companion e' attivo e gestisce gia' questa route.
	}

	register_rest_route(
		'pphc/v1',
		'/react',
		array(
			'methods'             => 'POST',
			'callback'            => 'pp_handle_reaction',
			'permission_callback' => '__return_true',
		)
	);
}
add_action( 'rest_api_init', 'pp_register_reaction_route' );

function pp_handle_reaction( WP_REST_Request $request ) {
	$post_id = (int) $request->get_param( 'postId' );
	$type    = (string) $request->get_param( 'type' );

	if ( ! $post_id || 'publish' !== get_post_status( $post_id ) ) {
		return new WP_Error( 'pp_invalid_post', 'Post non valido.', array( 'status' => 400 ) );
	}

	$meta_key = null;
	if ( 'share' === $type ) {
		$meta_key = 'shares_count';
	} elseif ( 'love' === $type ) {
		$meta_key = 'votes_count';
	}

	if ( ! $meta_key ) {
		return new WP_Error( 'pp_invalid_type', 'Tipo di reazione non valido: usa "share" o "love".', array( 'status' => 400 ) );
	}

	$new_value = (int) get_post_meta( $post_id, $meta_key, true ) + 1;
	update_post_meta( $post_id, $meta_key, $new_value );

	return array(
		'type'  => $type,
		'count' => $new_value,
	);
}

/**
 * ------------------------------------------------------------------
 * Articoli correlati — stesso algoritmo di getRelatedPosts() in lib/wp.ts
 * (frontend Next.js): prima altri articoli della stessa categoria
 * principale (la prima assegnata), poi completamento con lo stesso primo
 * tag se non bastano, infine gli ultimi pubblicati come ultima risorsa —
 * cosi' il blocco mostra sempre `limit` articoli quando ce ne sono
 * abbastanza sul sito, mai una griglia a meta'.
 * ------------------------------------------------------------------
 */
function pp_get_related_posts( $post_id, $limit = 3 ) {
	$found = array();

	$categories = get_the_category( $post_id );
	if ( ! empty( $categories ) ) {
		$found = get_posts(
			array(
				'post_type'      => 'post',
				'post_status'    => 'publish',
				'posts_per_page' => $limit,
				'post__not_in'   => array( $post_id ),
				'category__in'   => array( $categories[0]->term_id ),
				'fields'         => 'ids',
				'no_found_rows'  => true,
			)
		);
	}

	if ( count( $found ) < $limit ) {
		$tags = get_the_tags( $post_id );
		if ( ! empty( $tags ) ) {
			$more = get_posts(
				array(
					'post_type'      => 'post',
					'post_status'    => 'publish',
					'posts_per_page' => $limit - count( $found ),
					'post__not_in'   => array_merge( array( $post_id ), $found ),
					'tag__in'        => array( $tags[0]->term_id ),
					'fields'         => 'ids',
					'no_found_rows'  => true,
				)
			);
			$found = array_merge( $found, $more );
		}
	}

	if ( count( $found ) < $limit ) {
		$more = get_posts(
			array(
				'post_type'      => 'post',
				'post_status'    => 'publish',
				'posts_per_page' => $limit - count( $found ),
				'post__not_in'   => array_merge( array( $post_id ), $found ),
				'fields'         => 'ids',
				'no_found_rows'  => true,
			)
		);
		$found = array_merge( $found, $more );
	}

	return $found;
}

/**
 * Tag piu' utilizzati (widget sidebar "Tag più utilizzati"): stessa idea
 * di getPopularTags() lato Next.js, tramite la funzione nativa di
 * WordPress get_tags() ordinata per numero di articoli.
 */
function pp_get_popular_tags( $limit = 12 ) {
	return get_tags(
		array(
			'orderby'    => 'count',
			'order'      => 'DESC',
			'number'     => $limit,
			'hide_empty' => true,
		)
	);
}

/**
 * Markup HTML della card "magazine" (.pp-post-card) per un articolo,
 * riusato dai blocchi Reviews Carousel e Related Posts cosi' le due
 * griglie restano visivamente identiche senza duplicare lo stesso markup
 * in due file diversi. Stessa struttura del pattern "griglia-articoli"
 * (immagine + overlay + pillole categoria + titolo + link), qui in PHP
 * puro perche' questi due blocchi non sono un Query Loop a blocchi.
 *
 * @param int   $post_id   ID articolo.
 * @param array $args      'size' => 'large'|'normal' (immagine pp-hero vs pp-card),
 *                          'show_rating' => bool.
 */
function pp_render_post_card_html( $post_id, $args = array() ) {
	$args = wp_parse_args(
		$args,
		array(
			'size'        => 'normal',
			'show_rating' => true,
		)
	);

	$is_large  = 'large' === $args['size'];
	$image_id  = get_post_thumbnail_id( $post_id );
	$image_url = $image_id ? pp_best_thumbnail_url( $image_id, $is_large ? 'pp-hero' : 'pp-card' ) : null;
	$permalink = get_permalink( $post_id );
	$title     = get_the_title( $post_id );
	$cats      = get_the_category( $post_id );
	$rating    = $args['show_rating'] ? pp_get_rating( $post_id ) : null;

	ob_start();
	?>
	<div class="pp-post-card<?php echo $is_large ? ' pp-post-card--large' : ''; ?>">
		<a href="<?php echo esc_url( $permalink ); ?>" class="pp-post-card__image-link">
			<?php if ( $image_url ) : ?>
				<img
					src="<?php echo esc_url( $image_url ); ?>"
					alt="<?php echo esc_attr( get_post_meta( $image_id, '_wp_attachment_image_alt', true ) ); ?>"
					loading="lazy"
					decoding="async"
				/>
			<?php endif; ?>
		</a>

		<?php if ( null !== $rating ) : ?>
			<?php $percent = round( ( $rating / 10 ) * 100 ); ?>
			<div class="pp-rating-badge" style="--pp-rating-percent:<?php echo (int) $percent; ?>;" aria-hidden="true">
				<span class="pp-rating-badge__ring">
					<span class="pp-rating-badge__value"><?php echo esc_html( rtrim( rtrim( number_format( $rating, 1 ), '0' ), '.' ) ); ?></span>
				</span>
			</div>
		<?php endif; ?>

		<div class="pp-post-card__overlay" aria-hidden="true"></div>

		<div class="pp-post-card__content">
			<?php if ( ! empty( $cats ) ) : ?>
				<ul class="pp-term-pills">
					<?php foreach ( array_slice( $cats, 0, 2 ) as $cat ) : ?>
						<li><a href="<?php echo esc_url( get_category_link( $cat ) ); ?>"><?php echo esc_html( $cat->name ); ?></a></li>
					<?php endforeach; ?>
				</ul>
			<?php endif; ?>
			<h3 class="pp-post-card__title"><a href="<?php echo esc_url( $permalink ); ?>"><?php echo esc_html( $title ); ?></a></h3>
			<a href="<?php echo esc_url( $permalink ); ?>" class="pp-post-card__cta">Leggi »</a>
		</div>
	</div>
	<?php
	return ob_get_clean();
}

/**
 * Se l'articolo appartiene alla categoria "Ricette Piccanti": cambia il
 * testo del pulsante nell'hero da "Leggi" a "Guarda la ricetta", stessa
 * logica di HeroCarousel.tsx lato Next.js.
 */
function pp_is_recipe( $post_id ) {
	return has_category( 'ricette-peperoncino-piccante', $post_id );
}

/**
 * Registra tutti i blocchi dinamici aggiunti in questa versione, con lo
 * stesso pattern gia' usato da pp_register_blocks() per rating-badge piu'
 * sopra in questo file.
 */
function pp_register_v2_blocks() {
	$blocks = array(
		'hero-carousel',
		'reviews-carousel',
		'popular-posts',
		'reactions',
		'share-buttons',
		'review-breakdown',
		'related-posts',
		'popular-tags',
		'tag-carousel',
	);
	foreach ( $blocks as $block ) {
		register_block_type( get_theme_file_path( "blocks/{$block}" ) );
	}
}
add_action( 'init', 'pp_register_v2_blocks' );

/**
 * Script condivisi dai blocchi interattivi (caroselli, tab, reazioni): un
 * file per blocco, messo in coda direttamente da ciascun render.php SOLO
 * se quel blocco compare davvero nella pagina, cosi' le pagine che non lo
 * usano non scaricano il suo JS. Questa funzione registra solo gli
 * handle (disponibili per wp_enqueue_script altrove), senza metterli in
 * coda qui.
 */
function pp_register_v2_scripts() {
	$version = PP_THEME_VERSION;
	$scripts = array(
		'pp-hero-carousel'    => 'hero-carousel.js',
		'pp-reviews-carousel' => 'reviews-carousel.js',
		'pp-tag-carousel'     => 'tag-carousel.js',
		'pp-popular-posts'    => 'popular-posts.js',
		'pp-reactions'        => 'reactions.js',
		'pp-share-buttons'    => 'share-buttons.js',
	);
	foreach ( $scripts as $handle => $file ) {
		wp_register_script( $handle, get_theme_file_uri( "assets/js/{$file}" ), array(), $version, true );
	}

	$rest_config = array(
		'restUrl' => esc_url_raw( rest_url( 'pphc/v1/react' ) ),
		'nonce'   => wp_create_nonce( 'wp_rest' ),
	);
	wp_localize_script( 'pp-reactions', 'ppReactions', $rest_config );
	wp_localize_script( 'pp-share-buttons', 'ppReactions', $rest_config );
}
add_action( 'init', 'pp_register_v2_scripts' );
