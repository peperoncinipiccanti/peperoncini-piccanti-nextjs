<?php
/**
 * Render del blocco "Carosello per tag" — stessa idea di
 * HealthCarousel.tsx / PreserveCarousel.tsx nel frontend Next.js: TUTTI
 * gli articoli con un certo tag, non una manciata scelta a mano, cosi'
 * un articolo nuovo con quel tag compare qui automaticamente.
 *
 * Due varianti (attributo "variant", vedi assets/css/style.css):
 * - "single": una card a piena larghezza alla volta (usato per "Peperoncino
 *   e Salute" nella sidebar stretta della home).
 * - "multi": 1/2/3 card visibili a seconda della larghezza schermo (usato
 *   per "Come conservare i peperoncini" a piena larghezza pagina).
 *
 * @var array $attributes
 */
$tag_slug = isset( $attributes['tagSlug'] ) ? $attributes['tagSlug'] : '';
$heading  = isset( $attributes['heading'] ) ? $attributes['heading'] : '';
$limit    = isset( $attributes['limit'] ) ? (int) $attributes['limit'] : 20;
$variant  = isset( $attributes['variant'] ) && 'multi' === $attributes['variant'] ? 'multi' : 'single';

if ( '' === $tag_slug ) {
	return;
}

$tag = get_term_by( 'slug', $tag_slug, 'post_tag' );
if ( ! $tag ) {
	return;
}

$ids = get_posts(
	array(
		'post_type'      => 'post',
		'post_status'    => 'publish',
		'posts_per_page' => $limit,
		'tag_id'         => $tag->term_id,
		'fields'         => 'ids',
		'no_found_rows'  => true,
	)
);

if ( empty( $ids ) ) {
	return;
}

wp_enqueue_script( 'pp-tag-carousel' );
wp_enqueue_style( 'peperoncini-piccanti-style' );

$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'pp-tagcarousel pp-tagcarousel--' . $variant ) );
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<?php if ( '' !== $heading ) : ?>
		<h2 class="pp-tagcarousel__heading"><?php echo esc_html( $heading ); ?></h2>
	<?php endif; ?>

	<div class="pp-tagcarousel__wrap">
		<div class="pp-tagcarousel__scroller" data-pp-tagcarousel-scroller>
			<?php foreach ( $ids as $post_id ) : ?>
				<div class="pp-tagcarousel__item">
					<?php echo pp_render_post_card_html( $post_id, array( 'show_rating' => false ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</div>
			<?php endforeach; ?>
		</div>

		<?php if ( count( $ids ) > 1 ) : ?>
			<button type="button" class="pp-tagcarousel__arrow pp-tagcarousel__arrow--prev" data-pp-tagcarousel-prev aria-label="Precedente">‹</button>
			<button type="button" class="pp-tagcarousel__arrow pp-tagcarousel__arrow--next" data-pp-tagcarousel-next aria-label="Successivo">›</button>
		<?php endif; ?>
	</div>
</div>
