<?php
/**
 * Plugin Name: Peperoncini Piccanti – Companion Headless
 * Description: Piccolo plugin, indipendente dal tema attivo, che rende WordPress pronto a fare da backend headless per il frontend Next.js: espone in REST il punteggio review (media dei "Review Criteria" del tema), il flag "Featured"/ordine per lo slider hero, il widget "post piu' visti" (Week/Month/All Time, compatibile con la tabella dati di "WP Most Popular"), e avvisa Next.js (webhook di revalidazione) quando un articolo viene pubblicato o aggiornato. Va installato sul WordPress che fa da CMS/API, non sul frontend.
 * Version: 1.0.0
 * Author: Daniele
 * Text Domain: peperoncini-headless
 */

defined( 'ABSPATH' ) || exit;

/**
 * ------------------------------------------------------------------
 * Punteggio "piccantezza" mostrato in home e sulle card — NON e' un campo
 * a se stante: sul tema Edition ogni articolo ha gia' un metabox nativo
 * "Review" (campi ACF: review_post Si/No, review_criteria = ripetitore di
 * coppie criteria/rating 0-10, review_title). Il cerchio con il numero che
 * si vede sul sito e' semplicemente la MEDIA dei "rating" in
 * review_criteria — per questo e' compilato solo sugli articoli di tipo
 * "Varieta' di Peperoncino" (dove l'editor ha attivato "Is this a review
 * post?") e non sulle ricette, che non hanno questi campi valorizzati.
 * Qui si legge quel dato via ACF (get_field) e si espone gia' calcolato,
 * cosi' il frontend Next.js non deve reimplementare la logica del tema ne'
 * duplicare un campo che finirebbe scollegato dai dati reali.
 * ------------------------------------------------------------------
 */
function pphc_register_review_field() {
	register_rest_field(
		'post',
		'pphc_review',
		array(
			'get_callback' => function ( $post ) {
				if ( ! function_exists( 'get_field' ) ) {
					return null;
				}

				$is_review = get_field( 'review_post', $post['id'] );
				if ( 'yes' !== $is_review && true !== $is_review ) {
					return null;
				}

				$rows = get_field( 'review_criteria', $post['id'] );
				$criteria = array();
				$total = 0;
				$count = 0;

				if ( is_array( $rows ) ) {
					foreach ( $rows as $row ) {
						$label = isset( $row['criteria'] ) ? sanitize_text_field( $row['criteria'] ) : '';
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

				return array(
					'score'    => $count > 0 ? round( $total / $count, 1 ) : null,
					'title'    => (string) get_field( 'review_title', $post['id'] ),
					'criteria' => $criteria,
				);
			},
			'schema'       => array(
				'description' => __( 'Punteggio review (media dei "Review Criteria" del tema Edition) per gli articoli marcati come review; null altrimenti (es. le ricette).', 'peperoncini-headless' ),
				'type'        => array( 'object', 'null' ),
				'context'     => array( 'view' ),
			),
		)
	);
}
add_action( 'rest_api_init', 'pphc_register_review_field' );

/**
 * ------------------------------------------------------------------
 * Slider "in evidenza" (hero) — nel tema Edition esiste gia' un metabox
 * "Featured" (campo ACF radio Yes/No, registrato via PHP nel tema, per
 * questo non compare tra i gruppi di campi di ACF ne' in REST di default)
 * usato insieme alla pagina admin "Featured Order" per scegliere a mano
 * quali articoli mostrare nello slider e in che ordine (drag&drop, salvato
 * come `menu_order` sul post). Qui si espone in REST solo il RISULTATO di
 * quella scelta editoriale — non si duplica il metabox — cosi' il frontend
 * Next.js puo' leggerlo senza reimplementare la logica del tema:
 *   - "is_featured": true/false, letto con get_field() se ACF e' attivo;
 *   - "pphc_menu_order": l'ordine scelto in "Featured Order".
 * ------------------------------------------------------------------
 */
function pphc_register_featured_fields() {
	register_rest_field(
		'post',
		'is_featured',
		array(
			'get_callback' => function ( $post ) {
				if ( function_exists( 'get_field' ) ) {
					$value = get_field( 'featured', $post['id'] );
					return true === $value || '1' === $value || 'Yes' === $value;
				}
				return false;
			},
			'schema'       => array(
				'description' => __( 'Se l\'articolo e\' marcato "Featured" nel backoffice (usato per lo slider hero).', 'peperoncini-headless' ),
				'type'        => 'boolean',
				'context'     => array( 'view' ),
			),
		)
	);

	register_rest_field(
		'post',
		'pphc_menu_order',
		array(
			'get_callback' => function ( $post ) {
				return (int) get_post_field( 'menu_order', $post['id'] );
			},
			'schema'       => array(
				'description' => __( 'Ordine manuale (drag&drop) scelto in "Featured Order" nel backoffice.', 'peperoncini-headless' ),
				'type'        => 'integer',
				'context'     => array( 'view' ),
			),
		)
	);
}
add_action( 'rest_api_init', 'pphc_register_featured_fields' );

/**
 * ------------------------------------------------------------------
 * Widget "I post piccanti piu' visti" (Week/Month/All Time) — nel tema
 * originale i dati venivano dal plugin "WP Most Popular", che pero' conta le
 * visite con uno script JS stampato in wp_head() delle pagine servite da
 * WordPress stesso. Ora che le pagine vere le serve Next.js, quello script
 * non gira mai piu': le visite si azzererebbero. Qui si replica lo STESSO
 * schema di dati del plugin (tabella {prefix}most_popular, colonne
 * 1_day_stats/7_day_stats/30_day_stats/all_time_stats) cosi' il widget resta
 * compatibile se in futuro si riattiva il plugin originale, ma la lettura
 * (GET /pphc/v1/popular) e la scrittura (POST /pphc/v1/track-view, chiamata
 * dal browser del visitatore via lib/wp.ts + components/ViewTracker.tsx nel
 * progetto Next.js) sono gestite direttamente da qui, senza dipendere da
 * classi del plugin di terze parti che potrebbero non essere caricate.
 * ------------------------------------------------------------------
 */
function pphc_most_popular_table() {
	global $wpdb;
	return $wpdb->prefix . 'most_popular';
}

function pphc_most_popular_table_exists() {
	global $wpdb;
	$table = pphc_most_popular_table();
	return $wpdb->get_var( "SHOW TABLES LIKE '{$table}'" ) === $table;
}

/**
 * Crea la tabella se non esiste gia' (es. plugin "WP Most Popular" mai
 * installato, o disattivato in futuro): cosi' il tracciamento visite del
 * sito headless non dipende dal restare attivo quel plugin di terze parti.
 * Sul sito attuale la tabella esiste gia', quindi questa funzione non tocca
 * i dati esistenti.
 */
function pphc_ensure_most_popular_table() {
	global $wpdb;
	if ( pphc_most_popular_table_exists() ) {
		return;
	}

	$table            = pphc_most_popular_table();
	$charset_collate  = $wpdb->get_charset_collate();
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
register_activation_hook( __FILE__, 'pphc_ensure_most_popular_table' );

function pphc_register_popular_posts_routes() {
	register_rest_route(
		'pphc/v1',
		'/popular',
		array(
			'methods'             => 'GET',
			'callback'            => 'pphc_get_popular_posts',
			'permission_callback' => '__return_true',
		)
	);

	register_rest_route(
		'pphc/v1',
		'/track-view',
		array(
			'methods'             => 'POST',
			'callback'            => 'pphc_track_view',
			'permission_callback' => '__return_true',
		)
	);
}
add_action( 'rest_api_init', 'pphc_register_popular_posts_routes' );

function pphc_get_popular_posts( WP_REST_Request $request ) {
	global $wpdb;

	$empty = array(
		'weekly'   => array(),
		'monthly'  => array(),
		'all_time' => array(),
	);

	if ( ! pphc_most_popular_table_exists() ) {
		return $empty;
	}

	$table = pphc_most_popular_table();
	$limit = (int) $request->get_param( 'limit' );
	if ( $limit <= 0 ) {
		$limit = 5;
	}

	// phpcs:ignore WordPress.DB.PreparedSQL -- $table e' costruito da $wpdb->prefix, nessun input utente.
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

	$format_post = function ( $row, $views ) {
		$thumb_id = get_post_thumbnail_id( $row->ID );
		return array(
			'id'        => (int) $row->ID,
			'title'     => html_entity_decode( get_the_title( $row->ID ), ENT_QUOTES ),
			'slug'      => get_post_field( 'post_name', $row->ID ),
			'link'      => get_permalink( $row->ID ),
			'views'     => (int) $views,
			'thumbnail' => $thumb_id ? wp_get_attachment_image_url( $thumb_id, 'thumbnail' ) : null,
		);
	};

	$build_range = function ( $field ) use ( $rows, $limit, $format_post ) {
		$copy = $rows;
		usort(
			$copy,
			function ( $a, $b ) use ( $field ) {
				return $b->$field <=> $a->$field;
			}
		);
		$copy = array_slice( $copy, 0, $limit );
		return array_values(
			array_map(
				function ( $row ) use ( $field, $format_post ) {
					return $format_post( $row, $row->$field );
				},
				$copy
			)
		);
	};

	return array(
		'weekly'   => $build_range( 'weekly' ),
		'monthly'  => $build_range( 'monthly' ),
		'all_time' => $build_range( 'all_time' ),
	);
}

function pphc_track_view( WP_REST_Request $request ) {
	$post_id = (int) $request->get_param( 'postId' );

	if ( ! $post_id || 'publish' !== get_post_status( $post_id ) ) {
		return new WP_Error( 'pphc_invalid_post', 'Post non valido.', array( 'status' => 400 ) );
	}

	global $wpdb;
	$table = pphc_most_popular_table();

	if ( ! pphc_most_popular_table_exists() ) {
		// Tabella non ancora creata (plugin "WP Most Popular" mai installato
		// o disattivato): niente da tracciare, ma non e' un errore per il
		// visitatore — si ritorna semplicemente "non tracciato".
		return array( 'tracked' => false );
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
		$stats = $raw ? (array) unserialize( $raw ) : array();
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
			serialize( $stats ),
			$post_id
		)
	);

	return array( 'tracked' => true );
}

/**
 * ------------------------------------------------------------------
 * CORS per la REST API — necessario SOLO se in futuro il frontend Next.js
 * fara' chiamate dirette dal browser a questa REST API (es. una ricerca
 * "live" o un form). Il fetch dei contenuti che genera le pagine avviene
 * lato server dentro Next.js, dove il CORS del browser non si applica:
 * quindi questa parte e' un'aggiunta "per il futuro", non un requisito
 * per far funzionare il sito cosi' com'e'.
 * ------------------------------------------------------------------
 */
function pphc_allow_cors_from_frontend( $value ) {
	$allowed_origin = defined( 'PPHC_FRONTEND_ORIGIN' ) ? PPHC_FRONTEND_ORIGIN : 'https://www.peperoncinipiccanti.com';

	remove_filter( 'rest_pre_serve_request', 'rest_send_cors_headers' );
	add_filter(
		'rest_pre_serve_request',
		function ( $served, $result, $request ) use ( $allowed_origin ) {
			header( 'Access-Control-Allow-Origin: ' . esc_url_raw( $allowed_origin ) );
			header( 'Access-Control-Allow-Methods: GET' );
			header( 'Vary: Origin' );
			return $served;
		},
		10,
		3
	);

	return $value;
}
add_filter( 'rest_authentication_errors', 'pphc_allow_cors_from_frontend' );

/**
 * ------------------------------------------------------------------
 * Webhook di revalidazione — avvisa Next.js quando un articolo viene
 * pubblicato/aggiornato, cosi' la cache si aggiorna in pochi secondi
 * invece di aspettare la scadenza naturale (1 ora, vedi lib/wp.ts nel
 * progetto Next.js). Configura le due costanti sotto in wp-config.php:
 *
 *   define( 'PPHC_REVALIDATE_URL', 'https://www.peperoncinipiccanti.com/api/revalidate' );
 *   define( 'PPHC_REVALIDATE_SECRET', 'lo-stesso-valore-di-REVALIDATE_SECRET-su-Vercel' );
 * ------------------------------------------------------------------
 */
function pphc_notify_frontend( $post_id, $post, $update ) {
	if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
		return;
	}
	if ( 'post' !== $post->post_type || 'publish' !== $post->post_status ) {
		return;
	}
	if ( ! defined( 'PPHC_REVALIDATE_URL' ) || ! defined( 'PPHC_REVALIDATE_SECRET' ) ) {
		return;
	}

	wp_remote_post(
		PPHC_REVALIDATE_URL,
		array(
			'timeout' => 5,
			'blocking' => false, // non far aspettare l'editor che salva l'articolo
			'headers' => array(
				'Content-Type'          => 'application/json',
				'x-revalidate-secret'   => PPHC_REVALIDATE_SECRET,
			),
			'body' => wp_json_encode( array( 'slug' => $post->post_name ) ),
		)
	);
}
add_action( 'save_post', 'pphc_notify_frontend', 20, 3 );
