<?php
/**
 * Plugin Name: Peperoncini Piccanti – Companion Headless
 * Description: Piccolo plugin, indipendente dal tema attivo, che rende WordPress pronto a fare da backend headless per il frontend Next.js: espone/gestisce il campo "piccantezza", e avvisa Next.js (webhook di revalidazione) quando un articolo viene pubblicato o aggiornato. Va installato sul WordPress che fa da CMS/API, non sul frontend.
 * Version: 1.0.0
 * Author: Daniele
 * Text Domain: peperoncini-headless
 */

defined( 'ABSPATH' ) || exit;

/**
 * ------------------------------------------------------------------
 * Campo "piccantezza" — identico a quello gia' presente nel tema a blocchi
 * peperoncini-piccanti. E' duplicato qui (invece che richiesto dal tema)
 * apposta: in un setup headless il tema attivo su WordPress e' spesso
 * irrilevante per il pubblico (il frontend vero e' Next.js), quindi questa
 * funzionalita' deve poter vivere in un plugin, non dipendere da quale
 * tema e' selezionato in Aspetto. Se il tema peperoncini-piccanti resta
 * comunque attivo, va bene lo stesso: le due registrazioni non confliggono.
 * ------------------------------------------------------------------
 */
function pphc_register_meta() {
	register_post_meta(
		'post',
		'piccantezza',
		array(
			'type'              => 'number',
			'description'       => __( 'Livello di piccantezza da 0 a 10, esposto in REST per il frontend Next.js.', 'peperoncini-headless' ),
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
add_action( 'init', 'pphc_register_meta' );

function pphc_add_rating_meta_box() {
	add_meta_box( 'pphc_rating_box', __( 'Livello di piccantezza', 'peperoncini-headless' ), 'pphc_render_rating_meta_box', 'post', 'side', 'default' );
}
add_action( 'add_meta_boxes', 'pphc_add_rating_meta_box' );

function pphc_render_rating_meta_box( $post ) {
	$value = get_post_meta( $post->ID, 'piccantezza', true );
	wp_nonce_field( 'pphc_save_rating', 'pphc_rating_nonce' );
	printf(
		'<label for="pphc_rating_field">%s</label><br /><input type="number" min="0" max="10" step="0.1" id="pphc_rating_field" name="pphc_rating_field" value="%s" style="width:100%%;margin-top:6px;" />',
		esc_html__( 'Da 0 (per niente) a 10 (estremo)', 'peperoncini-headless' ),
		esc_attr( $value )
	);
}

function pphc_save_rating_meta_box( $post_id ) {
	if ( ! isset( $_POST['pphc_rating_nonce'] ) || ! wp_verify_nonce( $_POST['pphc_rating_nonce'], 'pphc_save_rating' ) ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	if ( isset( $_POST['pphc_rating_field'] ) && '' !== $_POST['pphc_rating_field'] ) {
		update_post_meta( $post_id, 'piccantezza', max( 0, min( 10, (float) $_POST['pphc_rating_field'] ) ) );
	} else {
		delete_post_meta( $post_id, 'piccantezza' );
	}
}
add_action( 'save_post', 'pphc_save_rating_meta_box' );

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
