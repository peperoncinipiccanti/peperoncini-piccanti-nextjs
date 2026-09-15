<?php
/**
 * Render del blocco "Carosello Recensioni" — stessa idea di
 * ReviewsCarousel.tsx nel frontend Next.js: le frecce non portano ad
 * altre pagine, scorrono lo STESSO widget mostrando il gruppo successivo
 * di 5 articoli (1 grande + 4 piccoli) della categoria scelta. Tutte le
 * "pagine" sono gia' renderizzate lato server (nessuna richiesta
 * aggiuntiva quando si clicca una freccia): il JS del blocco si limita a
 * mostrare/nascondere il gruppo giusto.
 *
 * @var array $attributes
 */
$page_size     = 5; // 1 grande + 4 piccoli, come nel widget originale.
$limit         = isset( $attributes['limit'] ) ? (int) $attributes['limit'] : 15;
$category_slug = isset( $attributes['categorySlug'] ) ? $attributes['categorySlug'] : 'varieta-peperoncino';
$heading       = isset( $attributes['heading'] ) ? $attributes['heading'] : 'Peperoncini Piccanti | Le mie recensioni';

$category = get_category_by_slug( $category_slug );
if ( ! $category ) {
	return;
}

$ids = get_posts(
	array(
		'post_type'      => 'post',
		'post_status'    => 'publish',
		'posts_per_page' => $limit,
		'category__in'   => array( $category->term_id ),
		'fields'         => 'ids',
		'no_found_rows'  => true,
	)
);

if ( empty( $ids ) ) {
	return;
}

$pages       = array_chunk( $ids, $page_size );
$total_pages = count( $pages );

wp_enqueue_script( 'pp-reviews-carousel' );
wp_enqueue_style( 'peperoncini-piccanti-style' );

$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'pp-reviews' ) );
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<div class="pp-reviews__head">
		<h2 class="pp-reviews__heading"><?php echo esc_html( $heading ); ?></h2>
		<?php if ( $total_pages > 1 ) : ?>
			<div class="pp-reviews__arrows">
				<button type="button" class="pp-reviews__arrow" data-pp-reviews-prev aria-label="Recensioni precedenti">‹</button>
				<button type="button" class="pp-reviews__arrow" data-pp-reviews-next aria-label="Recensioni successive">›</button>
			</div>
		<?php endif; ?>
	</div>

	<div data-pp-reviews-pages>
		<?php foreach ( $pages as $page_index => $page_ids ) : ?>
			<?php
			$hidden   = 0 !== $page_index;
			$featured = array_shift( $page_ids );
			?>
			<div class="pp-reviews__page" data-pp-reviews-page="<?php echo (int) $page_index; ?>" <?php echo $hidden ? 'hidden' : ''; ?>>
				<div class="pp-reviews__featured">
					<?php echo pp_render_post_card_html( $featured, array( 'size' => 'large' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</div>
				<div class="pp-reviews__grid">
					<?php foreach ( $page_ids as $post_id ) : ?>
						<?php echo pp_render_post_card_html( $post_id ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					<?php endforeach; ?>
				</div>
			</div>
		<?php endforeach; ?>
	</div>
</div>
