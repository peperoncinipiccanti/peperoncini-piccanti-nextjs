<?php
/**
 * Render del blocco dinamico "Badge Piccantezza".
 *
 * Blocco puramente PHP (nessun JavaScript necessario grazie al campo
 * "render" di block.json introdotto in WordPress 6.5): legge il
 * punteggio review vero dell'articolo (vedi pp_get_rating() in
 * functions.php — media dei "Review Criteria" ACF del tema Edition, con
 * ripiego sul semplice campo "piccantezza" di questo tema se il primo
 * non c'e') e disegna un anello circolare con CSS conic-gradient, senza
 * librerie o plugin esterni.
 *
 * @var array    $attributes Attributi del blocco.
 * @var string   $content    Contenuto salvato del blocco (non usato).
 * @var WP_Block $block      Istanza del blocco, con contesto (postId).
 */

// Dentro un Query Loop il contesto arriva da post-template; fuori da un
// loop (es. usato direttamente in single.html) ricadiamo sul post corrente,
// esattamente come fanno i blocchi dinamici del core (post-title, ecc.).
$post_id = isset( $block->context['postId'] ) ? (int) $block->context['postId'] : get_the_ID();

if ( ! $post_id ) {
	return;
}

$rating = pp_get_rating( $post_id );

// Nessun valore impostato: non mostrare nulla invece di un badge vuoto/fuorviante.
if ( null === $rating ) {
	return;
}

$percent  = round( ( $rating / 10 ) * 100 );
$label    = rtrim( rtrim( number_format( $rating, 1 ), '0' ), '.' );

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class'      => 'pp-rating-badge',
		'style'      => sprintf( '--pp-rating-percent:%d;', $percent ),
		'aria-label' => sprintf(
			/* translators: %s: livello di piccantezza da 0 a 10. */
			esc_attr__( 'Livello di piccantezza: %s su 10', 'peperoncini-piccanti' ),
			$label
		),
	)
);
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<span class="pp-rating-badge__ring" aria-hidden="true">
		<span class="pp-rating-badge__value"><?php echo esc_html( $label ); ?></span>
	</span>
</div>
