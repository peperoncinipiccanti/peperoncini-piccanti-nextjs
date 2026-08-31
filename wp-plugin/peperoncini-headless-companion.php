<?php
/**
 * Plugin Name: Peperoncini Piccanti – Companion Headless
 * Description: Piccolo plugin, indipendente dal tema attivo, che rende WordPress pronto a fare da backend headless per il frontend Next.js: espone in REST il punteggio review (media dei "Review Criteria" del tema), il flag "Featured"/ordine per lo slider hero, e avvisa Next.js (webhook di revalidazione) quando un articolo viene pubblicato o aggiornato. Va installato sul WordPress che fa da CMS/API, non sul frontend.
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
