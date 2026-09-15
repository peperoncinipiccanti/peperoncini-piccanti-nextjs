<?php
/**
 * Render del blocco "Articoli correlati" — stessa idea di
 * RelatedPosts.tsx nel frontend Next.js: griglia a tutta larghezza sotto
 * l'articolo (non nella colonna stretta), 3 card che riusano lo stesso
 * markup del Carosello Recensioni (pp_render_post_card_html()).
 *
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 */
$post_id = isset( $block->context['postId'] ) ? (int) $block->context['postId'] : get_the_ID();
if ( ! $post_id ) {
	return;
}

$limit = isset( $attributes['limit'] ) ? (int) $attributes['limit'] : 3;
$ids   = pp_get_related_posts( $post_id, $limit );

if ( empty( $ids ) ) {
	return;
}

wp_enqueue_style( 'peperoncini-piccanti-style' );

$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'pp-related alignwide' ) );
?>
<section <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<h2 class="pp-related__heading">Potrebbe interessarti anche</h2>
	<div class="pp-related__grid">
		<?php foreach ( $ids as $related_id ) : ?>
			<?php echo pp_render_post_card_html( $related_id ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		<?php endforeach; ?>
	</div>
</section>
